/**
 * The built CLI as a process (`dist/cli.js`, package `bin`): arguments, exit code, stdout
 * and stderr through real pipes. Everything else about the CLI is covered through `runCli`
 * in the other files of this folder.
 *
 * It runs only against a usable build: dist/cli.js must exist AND be newer than every
 * `src/**.ts` file, otherwise a stale build would test yesterday's code. In both other
 * cases one skipped test says why and what to run (`pnpm run build`).
 *
 * Sharing: these tests read, read-only, fixtures of other groups as ready-made projects
 * (`exit-fail-lint-failure`, `list-pass-matched-and-unmatched-files`, `format-fail-run-error`,
 * `verify-fail-explicit-broken-template`); a change that alters their result breaks a test here.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { fixturePath, REPO_ROOT } from "../../helpers/fixtures.js";

const CLI = join(REPO_ROOT, "dist", "cli.js");
const SRC = join(REPO_ROOT, "src");

/** Newest modification time (ms) of any `.ts` file below `src/`. */
function newestSource(): number {
  return readdirSync(SRC, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
    .map((entry) => statSync(join(entry.parentPath, entry.name)).mtimeMs)
    .reduce((newest, time) => Math.max(newest, time), 0);
}

const missing = !existsSync(CLI);
const stale = !missing && statSync(CLI).mtimeMs < newestSource();
const usable = !missing && !stale;

const VERSION = (
  JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8")) as { version: string }
).version;

function spawn(args: readonly string[], fixture?: string) {
  const env = { ...process.env };
  delete env["NO_COLOR"];
  const result = spawnSync(process.execPath, [CLI, ...args], {
    cwd: fixture === undefined ? REPO_ROOT : fixturePath("cli", fixture),
    encoding: "utf8",
    env,
  });
  return { stdout: result.stdout, stderr: result.stderr, status: result.status };
}

describe("dist/cli.js as a process", () => {
  it.skipIf(!missing)("skipped: dist/cli.js does not exist, run `pnpm run build` first", () => {
    expect(missing).toBe(true);
  });

  it.skipIf(!stale)(
    "skipped: dist/cli.js is older than a file in src/, run `pnpm run build` to refresh it",
    () => {
      expect(stale).toBe(true);
    },
  );

  it.skipIf(!usable)("starts with a node shebang", () => {
    expect(readFileSync(CLI, "utf8").startsWith("#!/usr/bin/env node\n")).toBe(true);
  });

  it.skipIf(!usable)("--version prints the package version, exit 0", () => {
    expect(spawn(["--version"])).toEqual({ stdout: `${VERSION}\n`, stderr: "", status: 0 });
  });

  it.skipIf(!usable)("--help prints the usage, exit 0", () => {
    const run = spawn(["--help"]);
    expect(run.status).toBe(0);
    expect(run.stdout.startsWith("Usage:\n  md-template-lint [options] [files...]")).toBe(true);
    expect(run.stderr).toBe("");
  });

  it.skipIf(!usable)("an unknown flag is exit 2 with a message on stderr", () => {
    const run = spawn(["--bogus"]);
    expect(run.status).toBe(2);
    expect(run.stdout).toBe("");
    expect(run.stderr).toBe(
      "error MTL920: unknown option: --bogus\nTry 'md-template-lint --help' for usage.\n",
    );
  });

  it.skipIf(!usable)("a failing file is exit 1, with the report on stdout", () => {
    const run = spawn([], "exit-fail-lint-failure");
    expect(run.status).toBe(1);
    expect(run.stdout).toContain(`md-template-lint ${VERSION}`);
    expect(run.stdout).toContain("✗ docs/b.md");
    expect(run.stdout).not.toContain("\u001b[");
    expect(run.stderr).toBe("");
  });

  it.skipIf(!usable)("an absolute file argument that matches no pair is exit 0", () => {
    const outside = join(REPO_ROOT, "package.json");
    const run = spawn(["--quiet", outside], "list-pass-matched-and-unmatched-files");
    expect(run).toEqual({ stdout: "", stderr: "", status: 0 });
  });

  it.skipIf(!usable)("a run error is exit 2 and --format json keeps stderr empty", () => {
    const run = spawn(["--format", "json"], "format-fail-run-error");
    expect(run.status).toBe(2);
    expect(run.stderr).toBe("");
    expect((JSON.parse(run.stdout) as { summary: { exitCode: number } }).summary.exitCode).toBe(2);
  });

  it.skipIf(!usable)("--verify with a template argument works without a config", () => {
    const run = spawn(
      ["--verify", "templates/broken.template.md"],
      "verify-fail-explicit-broken-template",
    );
    expect(run.status).toBe(1);
    expect(run.stdout).toContain("TEMPLATE ERROR: templates/broken.template.md");
  });

  it.skipIf(!usable)("--verify prints the schema table of a template", () => {
    const run = spawn(
      ["--verify", "--format", "plain", "templates/note.template.md"],
      "verify-fail-explicit-broken-template",
    );
    expect(run.status).toBe(0);
    // The dash line is as long as the header (20), presence is always the first rule.
    expect(run.stdout).toContain(`Field  Type    Rules\n${"-".repeat(20)}\n`);
    expect(run.stdout).toContain("title  string  presence:required\n");
  });
});
