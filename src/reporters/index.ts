/**
 * Reporters (docs/spec.md 8): `pretty` and `plain` text, and `json`.
 * `report` is the single entry for a lint run; `runCli` (src/cli/run.ts) maps `--format text`
 * to `pretty` and decides `color` from the terminal and `NO_COLOR`. The `--verify` output
 * has its own reporter, `reportVerify` (src/cli/verify-report.ts).
 */
import type { RunResult } from "../runner/types.js";
import { reportJson } from "./json.js";
import { reportPlain, reportPretty, type ReportOutput } from "./text.js";

export type ReportFormat = "pretty" | "plain" | "json";

export interface ReportOptions {
  readonly format: ReportFormat;
  /** Package version printed in the header and in the JSON document. */
  readonly version: string;
  /** ANSI color, `pretty` only. */
  readonly color?: boolean;
  /** Text formats only; JSON is always complete. */
  readonly quiet?: boolean;
}

/** Render a run: `stdout` and `stderr` text, ready to write. */
export function report(result: RunResult, options: ReportOptions): ReportOutput {
  const text = { version: options.version, color: options.color, quiet: options.quiet };
  if (options.format === "json") return reportJson(result, options.version);
  return options.format === "plain" ? reportPlain(result, text) : reportPretty(result, text);
}

export { cleanText } from "./sanitize.js";
export type { ReportOutput, TextOptions } from "./text.js";
