/**
 * Runner: pair expansion (docs/spec.md 6.3 to 6.5, 8.4, AS6, D05). Order of roots,
 * pairs and files; excludes; the template is never its own target; a template is
 * parsed once. Fixtures: tests/fixtures/runner/expand-<case>/. No pass/fail split
 * applies (each case checks a different part of the expansion).
 */
import { describe, expect, it } from "vitest";
import { createRegistry, RULE_FILES } from "../../../src/engine/registry.js";
import { defineRule } from "../../../src/engine/rule.js";
import { fixtureDirs } from "../../helpers/fixtures.js";
import { lintedFiles, runFixture } from "../../helpers/run.js";

const GROUP = "expand-";

describe("runner expansion", () => {
  it("has one fixture directory per case", () => {
    expect(fixtureDirs("runner", GROUP)).toEqual([
      "expand-case-sensitive-base-dir",
      "expand-include-exclude-sorted-skips-template",
      "expand-multi-root-declaration-order",
      "expand-shared-template-parsed-once",
    ]);
  });

  it("include minus exclude, code-unit order, dot files kept, template skipped (AS6)", async () => {
    const result = await runFixture(`${GROUP}include-exclude-sorted-skips-template`);
    expect(lintedFiles(result)).toEqual([
      "project:all:docs/.hidden.md",
      "project:all:docs/B.md",
      "project:all:docs/a.md",
      "project:all:docs/sub/c.md",
    ]);
    expect(result.summary).toMatchObject({ files: 4, failed: 0, exitCode: 0 });
    const [block] = result.blocks;
    // The count is the targets, not every file under the glob base.
    expect(block).toMatchObject({ kind: "pair", fileCount: 4 });
  });

  it("a glob base directory is case-sensitive on every OS: Docs/*.md never lists docs/ (AS5)", async () => {
    // On a case-insensitive file system (Windows, macOS) a plain readdir("Docs") finds docs/.
    // On a case-sensitive one it finds nothing, so the result is the same everywhere.
    const result = await runFixture(`${GROUP}case-sensitive-base-dir`);
    expect(lintedFiles(result)).toEqual([]);
    expect(result.blocks).toHaveLength(1);
    expect(result.runWarnings).toEqual([
      {
        code: "MTL913",
        severity: "warning",
        message: "no files matched pair 'upper' in root 'project'",
        pair: "upper",
        root: "project",
      },
    ]);
  });

  it("roots run project first, then the roots map in declaration order, whatever the pair lists (8.4)", async () => {
    const result = await runFixture(`${GROUP}multi-root-declaration-order`);
    expect(lintedFiles(result)).toEqual([
      "project:both:docs/p.md",
      "a:both:docs/x.md",
      "b:both:docs/y.md",
    ]);
    expect(result.summary).toMatchObject({ files: 3, failed: 0, exitCode: 0 });
  });

  it("a template shared by two pairs is parsed once per run (D05)", async () => {
    let parses = 0;
    const counter = defineRule({
      code: "MTL098",
      name: "parse-counter",
      severity: "warning",
      category: "syntax",
      phase: "template",
      check: () => {
        parses += 1;
        return [];
      },
    });
    const registry = createRegistry({ ...RULE_FILES, syntax: [...RULE_FILES.syntax, counter] });
    const result = await runFixture(`${GROUP}shared-template-parsed-once`, { registry });
    expect(lintedFiles(result)).toEqual(["project:first:first/a.md", "project:second:second/b.md"]);
    expect(parses).toBe(1);
  });
});
