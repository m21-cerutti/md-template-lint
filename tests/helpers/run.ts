/** Run a runner fixture end to end with the in-memory io (no network, no file probes). */
import { loadConfig } from "../../src/config/load.js";
import { createMemoryIo, type RuleIo } from "../../src/engine/rule.js";
import type { RuleRegistry } from "../../src/engine/registry.js";
import { runLint } from "../../src/runner/run.js";
import type { RunResult } from "../../src/runner/types.js";
import { fixturePath } from "./fixtures.js";

export const HOME = "/home/test";

export async function runFixture(
  name: string,
  options: { readonly registry?: RuleRegistry; readonly io?: RuleIo } = {},
): Promise<RunResult> {
  const cwd = fixturePath("runner", name);
  const loaded = await loadConfig({ cwd, home: HOME, boundary: cwd });
  return runLint(loaded, { io: options.io ?? createMemoryIo(), registry: options.registry });
}

/** `root:pair:path` of every linted file, in output order. */
export function lintedFiles(result: RunResult): string[] {
  return result.blocks.flatMap((block) =>
    block.kind === "pair"
      ? block.files.map((file) => `${block.root}:${block.pair}:${file.path}`)
      : [],
  );
}
