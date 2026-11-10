/**
 * Runner: template errors in a lint run (docs/spec.md 7.5, 8.2, 8.5, phase P7d). The runner
 * keeps the template errors of each parsed template on the `fail` template entry of every
 * pair block that uses it, with the excerpt of its template line built at parse time (EX8),
 * lists the template once in `failedTemplates`, still lints the targets and exits 1. A
 * template with warnings only stays `ok`. Sharing: the fixtures are the CLI ones of
 * tests/fixtures/cli/template-<case>/ (owned by tests/unit/cli/template-errors.test.ts).
 */
import { describe, expect, it } from "vitest";
import { loadConfig } from "../../../src/config/load.js";
import { createMemoryIo } from "../../../src/engine/rule.js";
import { runLint } from "../../../src/runner/run.js";
import type { PairBlock, RunResult } from "../../../src/runner/types.js";
import { fixturePath } from "../../helpers/fixtures.js";
import { HOME, lintedFiles } from "../../helpers/run.js";

const TEMPLATE = "templates/versions.template.md";

async function run(name: string): Promise<RunResult> {
  const cwd = fixturePath("cli", `template-${name}`);
  const loaded = await loadConfig({ cwd, home: HOME, boundary: cwd });
  return runLint(loaded, { io: createMemoryIo() });
}

const pairs = (result: RunResult): PairBlock[] => result.blocks.flatMap((block) => (block.kind === "pair" ? [block] : []));

describe("runner template errors (spec 7.5, 8.2)", () => {
  it("fail-duplicate-pattern-worked-example: fail entry with the MTL017 excerpt, target linted, exit 1", async () => {
    const result = await run("fail-duplicate-pattern-worked-example");
    const [block] = pairs(result);
    expect(block?.template.status === "fail" ? block.template.errors : []).toHaveLength(1);
    expect(block?.template).toMatchObject({
      path: TEMPLATE,
      status: "fail",
      errors: [
        {
          code: "MTL017",
          severity: "error",
          message: "Heading 'Notes': matches the same headings as the previous heading 'Notes' (line 5)",
          position: { line: 7, column: 4 },
          excerpt: {
            line: 7,
            column: 4,
            text: "## Notes [presence:optional]",
            before: 0,
            after: 0,
            caret: 3,
            head: "## Notes [presence:optional]",
            headCut: false,
          },
        },
      ],
    });
    expect(lintedFiles(result)).toEqual(["project:versions:notes/a.md"]);
    expect(block?.files.map((file) => file.status)).toEqual(["pass"]);
    expect(result.failedTemplates).toEqual([TEMPLATE]);
    expect(result.brokenTemplates).toEqual([]);
    expect(result.summary).toMatchObject({
      files: 1,
      passed: 1,
      failed: 0,
      templatesChecked: 1,
      templatesBroken: 0,
      exitCode: 1,
    });
  });

  it("fail-two-pairs-one-template: the entry is in both blocks, the template listed and counted once", async () => {
    const result = await run("fail-two-pairs-one-template");
    const blocks = pairs(result);
    expect(blocks.map((block) => [block.pair, block.template.status])).toEqual([
      ["notes", "fail"],
      ["more", "fail"],
    ]);
    expect(result.failedTemplates).toEqual([TEMPLATE]);
    expect(result.summary).toMatchObject({ files: 2, passed: 2, templatesChecked: 1, exitCode: 1 });
  });

  it("fail-failing-target: a failing target counts as usual next to the failed template", async () => {
    const result = await run("fail-failing-target");
    const [block] = pairs(result);
    expect(block?.template.status).toBe("fail");
    expect(block?.files[0]?.errors.map((error) => error.code)).toEqual(["MTL607"]);
    expect(result.summary).toMatchObject({ files: 1, passed: 0, failed: 1, exitCode: 1 });
  });

  it("pass-warnings-only: template warnings leave the template ok and the exit to the targets", async () => {
    const result = await run("pass-warnings-only");
    const [block] = pairs(result);
    expect(block?.template).toEqual({ path: TEMPLATE, status: "ok" });
    expect(result.failedTemplates).toEqual([]);
    expect(result.summary.exitCode).toBe(0);
  });
});
