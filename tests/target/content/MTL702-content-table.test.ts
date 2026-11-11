/** MTL702 content-table (src/rules/content.ts, docs/spec.md 2.6, 4.1 step 6, 4.3). */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { anchorLineOf, createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL702";
const DIR = "tests/fixtures/pairs/MTL702";
const MESSAGE = "Section 'Results': [content:table] no markdown table row found";
const OVERVIEW = "Section 'Overview' (pattern \"{text}\"): [content:table] no markdown table row found";

/**
 * Case -> expected MTL702 messages, plus the template warning codes
 * (`warnings`, from the template parse, usually none). The fixture of a case is
 * `DIR/<name>`. At least 1 passing case and 1 failing case. Silent
 * branches live in `fail-` fixtures where another section of the same file
 * still yields the expected error.
 */
const CASES = [
  {
    // One row shape per section: indented rows, trailing spaces and tab,
    // ideographic-space padding (U+3000), and `||` (two pipes, the minimum).
    name: "pass-section-has-table-rows",
    expected: [],
    warnings: [],
  },
  {
    name: "fail-section-has-prose-only",
    expected: [MESSAGE],
    warnings: [],
  },
  {
    // Leading-only, trailing-only and inner pipes, a lone `|`, a `  |  ` line and a
    // U+FEFF-prefixed row (U+FEFF is not whitespace for Python) are not rows.
    name: "fail-pipe-lines-lack-both-ends",
    expected: [MESSAGE],
    warnings: [],
  },
  {
    name: "fail-table-in-other-section",
    expected: [MESSAGE],
    warnings: [],
  },
  {
    name: "fail-first-repeated-heading-without-table",
    expected: [MESSAGE],
    warnings: [],
  },
  {
    // Silent: tagged section absent from the target, untagged section, and a
    // section tagged [content:non-empty] only (prose body, no table).
    name: "fail-only-tagged-section-without-table-reported",
    expected: [MESSAGE],
    warnings: [],
  },
  {
    // `## Changes [pattern:"{text}"]` takes the NEXT sibling, `## Overview` (spec 2.10 step 3c),
    // and the content rules read the section at that position (spec 2.6 "Content tags", ADR
    // 0012). `## Overview` has no table, the table under the extra `## Changes` does not count.
    // A pattern heading's label is the target text plus the pattern (spec 2.6).
    name: "fail-pattern-heading-checks-the-sibling-at-its-position",
    expected: [OVERVIEW],
    warnings: [],
  },
  {
    // The mirror: the sibling at the position (`## Overview`) has the table; the prose under
    // the later `## Changes` (an extra after the run) is not checked.
    name: "pass-pattern-heading-checks-the-sibling-at-its-position",
    expected: [],
    warnings: [],
  },
  {
    // Spec 4.3: a section-scope heading is labelled `Section '{parent} > {text}'`.
    name: "fail-section-scope-label-names-the-parent",
    expected: ["Section 'Context > Results': [content:table] no markdown table row found"],
    warnings: [],
  },
  {
    // Spec 2.6, section scope: `### Slot [pattern:"{text}"]` takes the first H3 in the section
    // of `## Hub`, `### First` (prose only), and its table rule is checked there; the table
    // under the later `### Slot` does not count. The label names the target text `First`.
    name: "fail-section-scope-pattern-heading-checks-the-sibling-at-its-position",
    expected: [`Section 'Hub > First' (pattern "{text}"): [content:table] no markdown table row found`],
    warnings: [],
  },
  {
    // The mirror: the table is under `### First` (the sibling at the position), the prose
    // under the later `### Slot` is an extra: no finding.
    name: "pass-section-scope-pattern-heading-checks-the-sibling-at-its-position",
    expected: [],
    warnings: [],
  },
  {
    // Spec 2.10 step 3c: no H3 under `## Hub`, so the `{text}` position has no sibling and no
    // match: the content check is skipped (the missing heading is MTL605's, not MTL702's).
    name: "pass-section-scope-pattern-heading-without-sibling-skips-content",
    expected: [],
    warnings: [],
  },
  {
    // Spec 2.10 worked example 7 J: the run takes lines 5 and 9; line 5 has a table row,
    // line 9 (`Epic B - Release`) has none. The label is the target text plus the pattern as
    // written, not the template text `Epic A - Title` (spec 2.6 "Content tags").
    name: "fail-pattern-heading-label-worked-example-7-j",
    expected: [`Section 'Epic B - Release' (pattern "Epic {char} - {text}"): [content:table] no markdown table row found`],
    warnings: [],
  },
  {
    // Spec 2.6, section scope: `{parent}` is the matched target parent (`Epic A`, matched by
    // the parent's pattern), `{text}` the target text `Step 2`, then the child's own pattern.
    name: "fail-section-scope-pattern-heading-label-names-the-parent-match",
    expected: [`Section 'Epic A > Step 2' (pattern "Step {number}"): [content:table] no markdown table row found`],
    warnings: [],
  },
] as const;

const read = (path: string): string => readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** Every directory and file under DIR, at any depth, as sorted `/`-separated relative paths. */
function listTree(): { dirs: string[]; files: string[] } {
  const root = fileURLToPath(new URL(`../../../${DIR}`, import.meta.url));
  const dirs: string[] = [];
  const files: string[] = [];
  for (const entry of readdirSync(root, { recursive: true, withFileTypes: true })) {
    const path = relative(root, join(entry.parentPath, entry.name)).replaceAll("\\", "/");
    (entry.isDirectory() ? dirs : files).push(path);
  }
  return { dirs: dirs.sort(), files: files.sort() };
}

/** MTL702 diagnostics and template warning codes for the pair of a case folder. */
async function lint(testCase: { readonly name: string }) {
  const fixture = `${DIR}/${testCase.name}`;
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
  const found = await checkTarget(registry, status.model, read(`${fixture}/target.md`), `${fixture}/target.md`, createEnv());
  return {
    found: found.filter((diagnostic) => diagnostic.code === CODE),
    warnings: status.warnings,
  };
}

describe("MTL702 content-table", { tags: ["MTL702", "content"] }, () => {
  it("is registered in category content, error, target step content", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "content-table",
      category: "content",
      severity: "error",
      phase: "target",
      step: "content",
    });
  });

  it("has at least 1 pass- case and at least 1 fail- case, one fixture dir each", () => {
    const passing = CASES.filter((testCase) => testCase.name.startsWith("pass-"));
    const failing = CASES.filter((testCase) => testCase.name.startsWith("fail-"));
    expect(passing.length).toBeGreaterThanOrEqual(1);
    expect(failing.length).toBeGreaterThanOrEqual(1);
    expect(passing.length + failing.length).toBe(CASES.length);
    expect(CASES.filter((testCase) => testCase.expected.length === 0)).toEqual(passing);
    // Orphan detection: no directory at any depth besides the cases, and each holds only the pair.
    const names = CASES.map((testCase) => testCase.name).sort();
    const tree = listTree();
    expect(tree.dirs).toEqual(names);
    expect(tree.files).toEqual(names.flatMap((name) => [`${name}/target.md`, `${name}/template.md`]).sort());
  });

  for (const testCase of CASES) {
    it(`${testCase.name}: ${DIR}/${testCase.name}`, async () => {
      const { found, warnings } = await lint(testCase);
      expect(found.map((diagnostic) => diagnostic.message)).toEqual(testCase.expected);
      for (const diagnostic of found) {
        expect(diagnostic.severity).toBe("error");
        expect(diagnostic.position).toBeNull();
      }
      expect(warnings.map((diagnostic) => diagnostic.code)).toEqual(testCase.warnings);
      for (const diagnostic of warnings) expect(diagnostic.severity).toBe("warning");
    });
  }

  it("anchors a {text} pattern heading's finding on the sibling at its position (the first H2)", async () => {
    const { found } = await lint({
      name: "fail-pattern-heading-checks-the-sibling-at-its-position",
    });
    // Target line 5 is `## Overview`, the sibling the `{text}` position took; line 9 is
    // `## Changes`.
    expect(found.map((diagnostic) => anchorLineOf(diagnostic))).toEqual([5]);
  });

  it("anchors a section-scope finding on the target heading line (DIR5)", async () => {
    // `### Results` is line 7; the `{text}` pattern `### Slot` took `### First`, line 7.
    const label = await lint({ name: "fail-section-scope-label-names-the-parent" });
    expect(label.found.map((diagnostic) => anchorLineOf(diagnostic))).toEqual([7]);
    const slot = await lint({
      name: "fail-section-scope-pattern-heading-checks-the-sibling-at-its-position",
    });
    expect(slot.found.map((diagnostic) => anchorLineOf(diagnostic))).toEqual([7]);
  });

  it("anchors a pattern heading's finding on its target heading line (DIR5)", async () => {
    // Worked example 7 J: `## Epic B - Release` is line 9; `### Step 2` is line 7.
    const epic = await lint({ name: "fail-pattern-heading-label-worked-example-7-j" });
    expect(epic.found.map((diagnostic) => anchorLineOf(diagnostic))).toEqual([9]);
    const step = await lint({
      name: "fail-section-scope-pattern-heading-label-names-the-parent-match",
    });
    expect(step.found.map((diagnostic) => anchorLineOf(diagnostic))).toEqual([7]);
  });
});
