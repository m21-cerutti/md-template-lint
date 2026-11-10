#!/usr/bin/env node
/**
 * Process entry of `md-template-lint` (package `bin`, `dist/cli.js`). All behaviour
 * is in `src/cli/run.ts` and `src/cli/main.ts`; this file only reads the process
 * (arguments, working directory, terminal, `NO_COLOR`), writes the result and sets
 * the exit code.
 */
import { execute } from "./cli/main.js";

const result = await execute(process.argv.slice(2), () => ({
  cwd: process.cwd(),
  isTty: process.stdout.isTTY === true,
  noColor: (process.env["NO_COLOR"] ?? "") !== "",
}));
process.stdout.write(result.stdout);
process.stderr.write(result.stderr);
process.exitCode = result.exitCode;
