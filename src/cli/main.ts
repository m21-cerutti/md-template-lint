/**
 * The process-facing wrapper of `runCli`: whatever `runCli` throws (a grammar bug, an
 * I/O failure) becomes a run error, exit 2. The message is path free: an error text
 * can carry an absolute path (`ENOENT: ... open 'C:\Users\...'`), which must not reach
 * a shared CI log (the policy of `readUtf8` in src/runner/files.ts). Only the error
 * code (`EACCES`) or, failing that, the error name (`TypeError`) is printed.
 * `src/cli.ts` is a thin shell around this, so the wrapper is testable.
 */
import { cleanText } from "../reporters/sanitize.js";
import { runCli, type CliEnv, type CliResult } from "./run.js";

export type CliRunner = (argv: readonly string[], env: CliEnv) => Promise<CliResult>;

/** Short, path-free reason of a thrown value. */
export function failureReason(error: unknown): string {
  const code = (error as { code?: unknown } | null)?.code;
  if (typeof code === "string" && code !== "") return cleanText(code);
  const name = (error as { name?: unknown } | null)?.name;
  return typeof name === "string" && name !== "" ? cleanText(name) : "unknown error";
}

/** `runCli`, never throwing: an unexpected failure is exit 2 with a fixed-shape message. */
export async function execute(argv: readonly string[], env: CliEnv | (() => CliEnv), run: CliRunner = runCli): Promise<CliResult> {
  try {
    // A thunk, so that reading the process (`process.cwd()` throws when the directory
    // was deleted) is covered by the same guard.
    return await run(argv, typeof env === "function" ? env() : env);
  } catch (error) {
    return {
      stdout: "",
      stderr: `error: unexpected failure (${failureReason(error)})\n`,
      exitCode: 2,
    };
  }
}
