// Pack smoke test (phase A30): the published artifact works from a clean directory.
//
//   pnpm run smoke:pack                      pack, install the tarball in a temp dir, run the CLI
//   pnpm run smoke:pack -- --tarball <file>  test a tarball that already exists (no pack)
//   pnpm run smoke:pack -- --offline         pass --offline to pnpm add (needs a warm store)
//
// Steps: `pnpm pack`; list the tarball (`tar -tzf`, no shell) and check its content (required
// files, no source map, nothing outside dist/ and the whitelisted root files); `pnpm add
// <tarball>` in an empty temp project (outside this repository); then run the installed bin
// through the real shim of node_modules/.bin: `--version` (also with `node <bin file>`), a copy
// of the synthetic fixture project tests/fixtures/smoke/clean-project (exit 0) and an unknown
// option (exit 2). The temp directory is removed.
// Exit code: 0 all checks pass, 1 a check failed, 2 harness error (pack or install failed).
// Pure decisions are in scripts/smoke/helpers.ts (unit tested); this file does the I/O.
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  binShimPath,
  checkRun,
  checkTarballEntries,
  commandInvocation,
  findTarball,
  installedBinPath,
  parseArgs,
  pnpmInvocation,
  projectLintExpectation,
  readPackageFields,
  singleDependency,
  spawnPlan,
  tarballEntries,
  unknownOptionExpectation,
  versionExpectation,
  type Invocation,
  type RunResult,
} from "./smoke/helpers.ts";

/** The synthetic fixture project that is linted from the installed package (exit 0 expected). */
const SMOKE_PROJECT = ["tests", "fixtures", "smoke", "clean-project"] as const;
const BIN_NAME = "md-template-lint";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function run(
  invocation: Invocation,
  args: readonly string[],
  cwd: string,
): RunResult & { readonly error: Error | undefined } {
  const plan = spawnPlan(invocation, args);
  const result = spawnSync(plan.command, plan.args, { cwd, encoding: "utf8", shell: plan.shell });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error,
  };
}

function readJson(file: string): unknown {
  return JSON.parse(readFileSync(file, "utf8")) as unknown;
}

function pnpm(args: readonly string[], cwd: string): void {
  const invocation = pnpmInvocation(process.env, process.platform, process.execPath);
  const result = run(invocation, args, cwd);
  if (result.status !== 0) {
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    throw new Error(
      `pnpm ${args.join(" ")} failed (exit ${String(result.status)})${result.error ? `: ${result.error.message}` : ""}`,
    );
  }
}

/**
 * The entries of the tarball, from `tar -tzf` without a shell. The tarball is named relative to
 * its folder: GNU tar reads `C:\...` as host:path.
 */
function listTarball(tarball: string): string[] {
  const result = spawnSync("tar", ["-tzf", basename(tarball)], {
    cwd: dirname(tarball),
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(
      `tar -tzf ${basename(tarball)} failed (exit ${String(result.status)}): ${result.error?.message ?? result.stderr}`,
    );
  }
  return tarballEntries(result.stdout);
}

function main(): number {
  const options = parseArgs(process.argv.slice(2));
  const work = mkdtempSync(join(tmpdir(), "mtl-smoke-"));
  try {
    let tarball = options.tarball === undefined ? undefined : resolve(options.tarball);
    if (tarball === undefined) {
      const packDir = join(work, "pack");
      mkdirSync(packDir);
      pnpm(["pack", "--pack-destination", packDir], repoRoot);
      tarball = join(packDir, findTarball(readdirSync(packDir)));
    }
    process.stdout.write(`tarball: ${tarball}\n`);

    const entries = listTarball(tarball);
    const contentProblems = checkTarballEntries(entries);
    if (contentProblems.length > 0) {
      for (const problem of contentProblems) process.stderr.write(`FAIL tarball: ${problem}\n`);
      return 1;
    }
    process.stdout.write(`ok   tarball holds ${entries.length} files, none unexpected\n`);

    const consumer = join(work, "consumer");
    mkdirSync(consumer);
    writeFileSync(
      join(consumer, "package.json"),
      `${JSON.stringify({ name: "smoke-consumer", version: "0.0.0", private: true }, null, 2)}\n`,
    );
    pnpm(
      ["add", tarball, "--ignore-workspace", ...(options.offline ? ["--offline"] : [])],
      consumer,
    );

    const dependency = singleDependency(readJson(join(consumer, "package.json")));
    const fields = readPackageFields(
      readJson(join(consumer, "node_modules", ...dependency.split("/"), "package.json")),
      BIN_NAME,
    );
    const binFile = installedBinPath(consumer, fields);
    const shim = binShimPath(consumer, BIN_NAME, process.platform);
    if (!existsSync(binFile) || !existsSync(shim)) {
      throw new Error(`installed bin missing: ${existsSync(binFile) ? "" : binFile} ${existsSync(shim) ? "" : shim}`.trim());
    }

    const project = join(work, "project");
    cpSync(join(repoRoot, ...SMOKE_PROJECT), project, { recursive: true });

    const viaShim = (args: readonly string[], cwd: string): RunResult =>
      run(commandInvocation(shim, process.platform), args, cwd);
    const viaNode = (args: readonly string[], cwd: string): RunResult =>
      run({ command: process.execPath, prefixArgs: [binFile], shell: false }, args, cwd);

    const problems = [
      ...checkRun(viaShim(["--version"], consumer), versionExpectation(fields.version)),
      ...checkRun(viaNode(["--version"], consumer), versionExpectation(fields.version)),
      ...checkRun(viaShim([], project), projectLintExpectation(SMOKE_PROJECT.join("/"))),
      ...checkRun(viaShim(["--bogus"], project), unknownOptionExpectation()),
    ];
    if (problems.length > 0) {
      for (const problem of problems) process.stderr.write(`FAIL ${problem}\n`);
      return 1;
    }
    process.stdout.write(
      `ok   ${fields.name}@${fields.version}: --version (shim and node), fixture project lint, unknown option\n`,
    );
    return 0;
  } finally {
    try {
      rmSync(work, { recursive: true, force: true, maxRetries: 3 });
    } catch (error) {
      process.stderr.write(`warning: could not remove ${work}: ${String(error)}\n`);
    }
  }
}

try {
  process.exitCode = main();
} catch (error) {
  process.stderr.write(`smoke:pack: harness error: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 2;
}
