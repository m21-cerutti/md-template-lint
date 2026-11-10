/**
 * The CLI as a function (docs/spec.md 7): arguments in, `{ stdout, stderr, exitCode }`
 * out. `src/cli.ts` only wires the process around it, so tests call this directly.
 *
 * - `--help` and `--version` print and exit 0; a usage error is exit 2 on stderr
 *   with the usage hint (`MTL920`, `MTL921`, `MTL922`, `MTL923`).
 * - Lint: load the config, build ONE production io from `allowPrivateNetworks`, run
 *   (all pairs, or only the file arguments), report. Exit code is `summary.exitCode`.
 * - `--verify`: template syntax only. Template arguments need no config; without
 *   them a config is required (`MTL923` when none is found). No io is created.
 * - `--format text` is the `pretty` reporter; color only on a terminal with
 *   `NO_COLOR` unset.
 */
import { loadConfig } from "../config/load.js";
import { createMemoryIo, type RuleIo } from "../engine/rule.js";
import { createRealIo, type RealIoOptions } from "../io/index.js";
import { report, type ReportFormat } from "../reporters/index.js";
import { runLint } from "../runner/run.js";
import type { ExitCode } from "../runner/types.js";
import { verifyConfig, verifyPaths } from "../runner/verify.js";
import { parseArgs, USAGE, USAGE_HINT, type CliOptions, type FormatName } from "./args.js";
import { readVersion } from "./version.js";
import { reportVerify } from "./verify-report.js";

export interface CliEnv {
  /** Working directory (absolute). */
  readonly cwd: string;
  /** Home directory for `~` (default: the OS home). */
  readonly home?: string;
  /** Config discovery stops after this directory (default: the file system root). */
  readonly boundary?: string;
  /** Standard output is a terminal: color is allowed. */
  readonly isTty: boolean;
  /** `NO_COLOR` is set and not empty. */
  readonly noColor: boolean;
  /** Package version (default: read from `package.json`). */
  readonly version?: string;
  /** Production io factory (default `createRealIo`); tests inject a recording one. */
  readonly createIo?: (options: RealIoOptions) => RuleIo;
}

export interface CliResult {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: ExitCode;
}

const FORMATS: Readonly<Record<FormatName, ReportFormat>> = {
  text: "pretty",
  plain: "plain",
  json: "json",
};

const usageFailure = (code: string, message: string): CliResult => ({
  stdout: "",
  stderr: `error ${code}: ${message}\n${USAGE_HINT}\n`,
  exitCode: 2,
});

async function lint(options: CliOptions, env: CliEnv, version: string): Promise<CliResult> {
  const loaded = await loadConfig({
    cwd: env.cwd,
    configPath: options.configPath,
    home: env.home,
    boundary: env.boundary,
  });
  const create = env.createIo ?? createRealIo;
  // One io per run: it holds the URL probe cache and the run budget. A failed config
  // lints nothing, so it needs none.
  const io = loaded.ok
    ? create({ allowPrivateNetworks: loaded.config.allowPrivateNetworks })
    : createMemoryIo();
  const result = await runLint(loaded, {
    io,
    files:
      options.files.length > 0 ? { cwd: env.cwd, home: env.home, paths: options.files } : undefined,
  });
  const format = FORMATS[options.format];
  const output = report(result, {
    format,
    version,
    color: format === "pretty" && env.isTty && !env.noColor,
    quiet: options.quiet,
  });
  return { ...output, exitCode: result.summary.exitCode };
}

async function verify(options: CliOptions, env: CliEnv, version: string): Promise<CliResult> {
  let result;
  if (options.files.length > 0) {
    result = await verifyPaths({ cwd: env.cwd, home: env.home, paths: options.files });
  } else {
    const loaded = await loadConfig({
      cwd: env.cwd,
      configPath: options.configPath,
      home: env.home,
      boundary: env.boundary,
    });
    if (!loaded.ok && options.configPath === undefined && loaded.errors[0]?.code === "MTL901") {
      return usageFailure("MTL923", "--verify needs a config or at least one template path");
    }
    result = await verifyConfig(loaded);
  }
  const format = FORMATS[options.format];
  const output = reportVerify(result, {
    format,
    version,
    color: format === "pretty" && env.isTty && !env.noColor,
    quiet: options.quiet,
  });
  return { ...output, exitCode: result.summary.exitCode };
}

/** Run the CLI for `argv` (the arguments after the script name). */
export async function runCli(argv: readonly string[], env: CliEnv): Promise<CliResult> {
  const parsed = parseArgs(argv);
  switch (parsed.kind) {
    case "help":
      return { stdout: USAGE, stderr: "", exitCode: 0 };
    case "version":
      return { stdout: `${env.version ?? readVersion()}\n`, stderr: "", exitCode: 0 };
    case "usage-error":
      return usageFailure(parsed.code, parsed.message);
    case "run": {
      const version = env.version ?? readVersion();
      return parsed.options.verify
        ? verify(parsed.options, env, version)
        : lint(parsed.options, env, version);
    }
  }
}
