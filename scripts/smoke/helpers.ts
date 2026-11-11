/**
 * Helper module: pure functions (no process, file system, network) for smoke-pack.ts and check-release.ts.
 * The scripts do I/O; unit tests cover the logic here (tests/unit/smoke/).
 */
import { join } from "node:path";

// ---------------------------------------------------------------------------------------
// Command line of smoke-pack.ts
// ---------------------------------------------------------------------------------------

export interface SmokeOptions {
  /** A ready tarball to test instead of running `pnpm pack`. */
  readonly tarball: string | undefined;
  /** Pass `--offline` to `pnpm add` (needs a warm store). */
  readonly offline: boolean;
}

/** Parse `[--tarball <file>] [--offline]`. Throws on anything else. */
export function parseArgs(argv: readonly string[]): SmokeOptions {
  let tarball: string | undefined;
  let offline = false;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--") {
      // `pnpm run smoke:pack -- --offline` may pass the separator through.
      continue;
    } else if (arg === "--offline") {
      offline = true;
    } else if (arg === "--tarball") {
      const value = argv[index + 1];
      if (value === undefined || value.startsWith("--")) {
        throw new Error("--tarball needs a file path");
      }
      tarball = value;
      index += 1;
    } else {
      throw new Error(`unknown argument: ${String(arg)}`);
    }
  }
  return { tarball, offline };
}

// ---------------------------------------------------------------------------------------
// Starting child processes (pnpm and the installed bin shim)
// ---------------------------------------------------------------------------------------

export interface Invocation {
  readonly command: string;
  /** Arguments that come before the caller's own arguments. */
  readonly prefixArgs: readonly string[];
  /** True only for a Windows `.cmd`/`.bat` shim or a bare command name on Windows. */
  readonly shell: boolean;
}

/** Node cannot start a `.cmd` or `.bat` file without a shell, and only on Windows. */
export function needsShell(command: string, platform: string): boolean {
  return platform === "win32" && /\.(?:cmd|bat)$/i.test(command);
}

/** How to start `command` as it is (a file path): through a shell only for a Windows shim. */
export function commandInvocation(command: string, platform: string): Invocation {
  return { command, prefixArgs: [], shell: needsShell(command, platform) };
}

/**
 * How to start pnpm. Under `pnpm run`, `npm_execpath` names the running pnpm: a script
 * (`.js`, `.cjs`, `.mjs`) is started with Node, anything else is started as a command. Without
 * it, fall back to the bare name `pnpm`, which Windows only resolves through a shell.
 */
export function pnpmInvocation(env: Readonly<Record<string, string | undefined>>, platform: string, nodePath: string): Invocation {
  const execPath = env["npm_execpath"];
  if (execPath !== undefined && execPath !== "") {
    if (/\.(?:c|m)?js$/i.test(execPath)) {
      return { command: nodePath, prefixArgs: [execPath], shell: false };
    }
    return commandInvocation(execPath, platform);
  }
  return { command: "pnpm", prefixArgs: [], shell: platform === "win32" };
}

/**
 * One argument for `cmd.exe`, inside double quotes. Inside quotes `& | < > ^ ( )` and spaces
 * are literal. What cannot be made literal is refused: `"` (ends the quote), `%` and `!`
 * (variable expansion), and line breaks or NUL.
 */
export function quoteForCmd(arg: string): string {
  if (/["%!\r\n\0]/.test(arg)) {
    throw new Error(`argument cannot be passed safely through cmd.exe: ${JSON.stringify(arg)}`);
  }
  // A backslash run before the closing quote would escape it for the child's argv parser.
  return `"${arg.replace(/\\+$/, (run) => run + run)}"`;
}

export interface SpawnPlan {
  readonly command: string;
  readonly args: readonly string[];
  readonly shell: boolean;
}

/**
 * What to hand to `spawnSync`. Without a shell the arguments go through as they are. With a
 * shell, Node does no quoting (and warns, DEP0190, when it is given an argument list), so the
 * plan is one command line with every part quoted (an unsafe part throws instead of being
 * passed on) and no separate arguments.
 */
export function spawnPlan(invocation: Invocation, args: readonly string[]): SpawnPlan {
  const all = [...invocation.prefixArgs, ...args];
  if (!invocation.shell) return { command: invocation.command, args: all, shell: false };
  return {
    command: [invocation.command, ...all].map(quoteForCmd).join(" "),
    args: [],
    shell: true,
  };
}

/** The tarball file among `names`. Throws when there is none or more than one. */
export function findTarball(names: readonly string[]): string {
  const tarballs = names.filter((name) => name.endsWith(".tgz"));
  if (tarballs.length !== 1) {
    throw new Error(`expected exactly one .tgz, found ${tarballs.length}: ${tarballs.join(", ")}`);
  }
  return tarballs[0] as string;
}

// ---------------------------------------------------------------------------------------
// package.json
// ---------------------------------------------------------------------------------------

export interface PackageFields {
  readonly name: string;
  readonly version: string;
  /** Path of the executable, relative to the package folder, with `/` separators. */
  readonly bin: string;
}

const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

function asRecord(manifest: unknown): Record<string, unknown> {
  if (typeof manifest !== "object" || manifest === null || Array.isArray(manifest)) {
    throw new Error("package.json is not an object");
  }
  return manifest as Record<string, unknown>;
}

function versionOf(record: Record<string, unknown>): string {
  const version = record["version"];
  if (typeof version !== "string" || !SEMVER.test(version)) {
    throw new Error(`package.json: version is not semver: ${String(version)}`);
  }
  return version;
}

/** Read name, version and the `bin` entry named `binName` of a parsed package.json. */
export function readPackageFields(manifest: unknown, binName: string): PackageFields {
  const record = asRecord(manifest);
  const name = record["name"];
  const bin = record["bin"];
  if (typeof name !== "string" || name === "") throw new Error("package.json: name is missing");
  const version = versionOf(record);
  const entry = typeof bin === "string" ? bin : typeof bin === "object" && bin !== null ? (bin as Record<string, unknown>)[binName] : undefined;
  if (typeof entry !== "string" || entry === "") {
    throw new Error(`package.json: no bin entry named ${binName}`);
  }
  return { name, version, bin: entry.replaceAll("\\", "/").replace(/^\.\//, "") };
}

/** The name of the one dependency of the consumer package.json. Throws unless there is exactly one. */
export function singleDependency(manifest: unknown): string {
  const deps = typeof manifest === "object" && manifest !== null ? (manifest as Record<string, unknown>)["dependencies"] : undefined;
  const names = typeof deps === "object" && deps !== null ? Object.keys(deps) : [];
  if (names.length !== 1) {
    throw new Error(`expected one dependency in the consumer package.json, found ${names.length}`);
  }
  return names[0] as string;
}

/** Absolute path of the installed executable: `<consumer>/node_modules/<name>/<bin>`. */
export function installedBinPath(consumerDir: string, fields: PackageFields): string {
  return join(consumerDir, "node_modules", ...fields.name.split("/"), ...fields.bin.split("/"));
}

/**
 * Path of the shim that the package manager writes for the bin:
 * `<consumer>/node_modules/.bin/<binName>`, with `.cmd` on Windows.
 */
export function binShimPath(consumerDir: string, binName: string, platform: string): string {
  return join(consumerDir, "node_modules", ".bin", platform === "win32" ? `${binName}.cmd` : binName);
}

// ---------------------------------------------------------------------------------------
// What the installed CLI must do
// ---------------------------------------------------------------------------------------

export interface RunResult {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

export interface Expectation {
  readonly label: string;
  readonly status: number;
  /** When set, stdout must equal this text exactly. */
  readonly stdoutIs?: string;
  /** Each text must appear in stdout. */
  readonly stdoutHas?: readonly string[];
  /** Each text must appear in stderr. */
  readonly stderrHas?: readonly string[];
}

/** `--version` prints the package version and a newline, exit 0. */
export const versionExpectation = (version: string): Expectation => ({
  label: "--version",
  status: 0,
  stdoutIs: `${version}\n`,
});

/** A full run on a clean fixture project: exit 0 and the success line. */
export const projectLintExpectation = (project: string): Expectation => ({
  label: `lint ${project}`,
  status: 0,
  stdoutHas: ["All files passed!"],
});

/** An unknown option: exit 2, the error code and the usage hint on stderr. */
export const unknownOptionExpectation = (): Expectation => ({
  label: "unknown option",
  status: 2,
  stderrHas: ["error MTL920: unknown option: --bogus", "Try 'md-template-lint --help' for usage."],
});

/** Problems of one run against its expectation; empty when it matches. */
export function checkRun(result: RunResult, expected: Expectation): string[] {
  const problems: string[] = [];
  if (result.status !== expected.status) {
    problems.push(`${expected.label}: exit code ${String(result.status)}, expected ${expected.status}`);
  }
  if (expected.stdoutIs !== undefined && result.stdout !== expected.stdoutIs) {
    problems.push(`${expected.label}: stdout ${JSON.stringify(result.stdout)}, expected ${JSON.stringify(expected.stdoutIs)}`);
  }
  for (const text of expected.stdoutHas ?? []) {
    if (!result.stdout.includes(text)) {
      problems.push(`${expected.label}: stdout lacks ${JSON.stringify(text)}`);
    }
  }
  for (const text of expected.stderrHas ?? []) {
    if (!result.stderr.includes(text)) {
      problems.push(`${expected.label}: stderr lacks ${JSON.stringify(text)}`);
    }
  }
  return problems;
}

// ---------------------------------------------------------------------------------------
// Tarball content
// ---------------------------------------------------------------------------------------

/** Files at the package root that the `files` whitelist lets through (package.json is automatic). */
const ROOT_FILES: readonly string[] = ["package.json", "README.md", "LICENSE", "CHANGELOG.md", "THIRD_PARTY_NOTICES.md"];
const REQUIRED_FILES: readonly string[] = [...ROOT_FILES, "dist/cli.js", "dist/index.js"];
const LEAK_DIRS: readonly string[] = ["tests", "scripts", "src", "legacy", "tmp"];

/**
 * Paths inside a tarball from the text of `tar -tzf`: one entry per line, directories dropped,
 * the `package/` prefix that npm puts on every entry removed. Throws on an entry without it.
 */
export function tarballEntries(listing: string): string[] {
  const paths: string[] = [];
  for (const raw of listing.split(/\r?\n/)) {
    const line = raw.trim();
    if (line === "" || line.endsWith("/")) continue;
    if (!line.startsWith("package/")) {
      throw new Error(`tarball entry without the package/ prefix: ${line}`);
    }
    paths.push(line.slice("package/".length));
  }
  return paths;
}

/**
 * Problems of a tarball listing (paths without the `package/` prefix): a required file is
 * missing, a source map is present, a source folder leaks, or a file is neither under `dist/`
 * nor one of the whitelisted root files. Empty when the tarball is as intended.
 */
export function checkTarballEntries(paths: readonly string[]): string[] {
  const problems: string[] = [];
  for (const required of REQUIRED_FILES) {
    if (!paths.includes(required)) problems.push(`missing required file: ${required}`);
  }
  for (const path of [...paths].sort()) {
    const top = path.split("/")[0] as string;
    if (path.endsWith(".map")) {
      problems.push(`forbidden source map: ${path}`);
    } else if (path.includes("/") && LEAK_DIRS.includes(top)) {
      problems.push(`leaks ${top}/: ${path}`);
    } else if (top !== "dist" && !ROOT_FILES.includes(path)) {
      problems.push(`unexpected file: ${path}`);
    }
  }
  return problems;
}

// ---------------------------------------------------------------------------------------
// Release checks (run by .github/workflows/release.yml through scripts/smoke/check-release.ts)
// ---------------------------------------------------------------------------------------

/** The pushed tag must be exactly `v` followed by the package.json version. */
export function checkTag(tag: string, version: string): string[] {
  const expected = `v${version}`;
  return tag === expected ? [] : [`tag ${JSON.stringify(tag)} does not match package.json version ${version} (expected ${expected})`];
}

/**
 * `repository.url` must be this repository, anchored at both ends: `https://github.com/<R>.git`
 * or `git+https://github.com/<R>.git` (the `.git` suffix is optional), compared without regard
 * to case. A longer or shorter repository name, another owner or extra path never matches.
 */
export function checkRepositoryUrl(manifest: unknown, repository: string): string[] {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    return [`repository ${JSON.stringify(repository)} is not <owner>/<name>`];
  }
  const repo = asRecord(manifest)["repository"];
  const url = typeof repo === "object" && repo !== null ? (repo as Record<string, unknown>)["url"] : undefined;
  if (typeof url !== "string") return ["package.json: repository.url is missing"];
  const base = `github.com/${repository}`.toLowerCase();
  const accepted = [`https://${base}.git`, `git+https://${base}.git`, `https://${base}`, `git+https://${base}`];
  return accepted.includes(url.toLowerCase()) ? [] : [`package.json repository.url ${url} is not https://github.com/${repository}.git`];
}

/** Every release check, for a pushed `tag` in `repository` (`<owner>/<name>`). */
export function checkRelease(manifest: unknown, tag: string, repository: string): string[] {
  let version: string;
  try {
    version = versionOf(asRecord(manifest));
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }
  return [...checkTag(tag, version), ...checkRepositoryUrl(manifest, repository)];
}
