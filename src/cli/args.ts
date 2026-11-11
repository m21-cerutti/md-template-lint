/**
 * Command line parsing (docs/spec.md 7.1). No dependency: the grammar is small.
 *
 * - `--help` and `-h` win over everything else, then `--version`. They are looked up
 *   before any other flag is read, so `--help --bogus` prints the usage.
 * - `--config <path>` and `--format <name>` also take `--flag=value`. A missing value
 *   (nothing follows, the next argument starts with `--`, or the value is empty) is
 *   `MTL921`; a format other than `text`, `plain` or `json` is `MTL922`.
 * - An unknown option (any other argument starting with `-`) is `MTL920`.
 * - `--` ends the options; what follows are files.
 */
import { cleanText } from "../reporters/sanitize.js";

export const FORMAT_NAMES = ["text", "plain", "json"] as const;
export type FormatName = (typeof FORMAT_NAMES)[number];

export type UsageCode = "MTL920" | "MTL921" | "MTL922";

export const SYNTAX_DOC_URL = "https://github.com/m21-cerutti/md-template-lint/blob/main/docs/syntax-reference.md";
export const SYNTAX_DOC_REMINDER = `Template syntax reference: ${SYNTAX_DOC_URL}`;

export interface CliOptions {
  readonly configPath: string | undefined;
  readonly format: FormatName;
  readonly quiet: boolean;
  readonly verify: boolean;
  /** File arguments (targets, or templates with `--verify`), in command line order. */
  readonly files: readonly string[];
}

export type ParsedArgs = { readonly kind: "help" } | { readonly kind: "version" } | { readonly kind: "usage-error"; readonly code: UsageCode; readonly message: string } | { readonly kind: "run"; readonly options: CliOptions };

export const USAGE = [
  "Usage:",
  "  mdtl [options] [files...]",
  "  mdtl --verify [options] [templates...]",
  "",
  "Options:",
  "  --config <path>   Config file (default: md-template-lint.yml, searched upward)",
  "  --format <name>   text (default), plain or json",
  "  --quiet           Text only: failing files, broken templates and run errors",
  "  --verify          Check template syntax only, no target is read",
  "  --version         Print the version and exit",
  "  --help, -h        Print this help and exit",
  "",
  "With file arguments only those files are linted (lint-staged mode); a file that",
  "matches no pair is skipped.",
  "",
  "Exit codes: 0 clean, 1 lint failure or broken template, 2 usage or run error.",
  "",
  SYNTAX_DOC_REMINDER,
  "",
].join("\n");

export const USAGE_HINT = "Try 'mdtl --help' for usage.";

const error = (code: UsageCode, message: string): ParsedArgs => ({
  kind: "usage-error",
  code,
  message,
});

const isFormat = (value: string): value is FormatName => (FORMAT_NAMES as readonly string[]).includes(value);

/** Parse the arguments after `node cli.js` (`process.argv.slice(2)`). */
export function parseArgs(argv: readonly string[]): ParsedArgs {
  const stop = argv.indexOf("--");
  const optionPart = stop === -1 ? argv : argv.slice(0, stop);
  if (optionPart.includes("--help") || optionPart.includes("-h")) return { kind: "help" };
  if (optionPart.includes("--version")) return { kind: "version" };

  let configPath: string | undefined;
  let format: FormatName = "text";
  let quiet = false;
  let verify = false;
  const files: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index] as string;
    if (stop !== -1 && index === stop) {
      files.push(...argv.slice(index + 1));
      break;
    }
    const equals = arg.indexOf("=");
    const name = equals === -1 ? arg : arg.slice(0, equals);
    if (arg === "--quiet") quiet = true;
    else if (arg === "--verify") verify = true;
    else if (name === "--config" || name === "--format") {
      let value = equals === -1 ? undefined : arg.slice(equals + 1);
      if (equals === -1) {
        const next = argv[index + 1];
        if (next !== undefined && !next.startsWith("--")) {
          value = next;
          index += 1;
        }
      }
      if (value === undefined || value === "") return error("MTL921", `${name} requires an argument`);
      if (name === "--config") configPath = value;
      else if (isFormat(value)) format = value;
      else {
        return error("MTL922", `invalid value '${cleanText(value)}' for --format (expected text, plain or json)`);
      }
    } else if (arg.startsWith("-") && arg !== "-") {
      return error("MTL920", `unknown option: ${cleanText(arg)}`);
    } else files.push(arg);
  }
  return { kind: "run", options: { configPath, format, quiet, verify, files } };
}
