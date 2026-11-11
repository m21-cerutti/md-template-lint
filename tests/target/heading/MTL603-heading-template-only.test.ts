/** MTL603 heading-template-only (src/rules/heading.ts, docs/spec.md 2.6, 4.1 step 5, 4.3). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { anchorLineOf, createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL603";
const DIR = "tests/fixtures/pairs/MTL603";

const message = (text: string): string => `Heading: Heading '${text}' is marked [presence:template-only] ` + "and must not appear in the linted file";

/** Case -> fixture -> expected result: at least 1 passing case and 1 failing case. */
const CASES = [
  {
    name: "pass-template-only-heading-absent",
    fixture: "tests/fixtures/pairs/MTL603/pass-template-only-heading-absent",
    expected: [],
  },
  {
    name: "fail-template-only-heading-present",
    fixture: "tests/fixtures/pairs/MTL603/fail-template-only-heading-present",
    expected: [message("Authoring checklist")],
  },
  {
    name: "pass-template-only-heading-at-other-level",
    fixture: "tests/fixtures/pairs/MTL603/pass-template-only-heading-at-other-level",
    expected: [],
  },
  {
    name: "fail-template-only-heading-with-tag-in-target",
    fixture: "tests/fixtures/pairs/MTL603/fail-template-only-heading-with-tag-in-target",
    expected: [message("Authoring checklist")],
  },
  {
    name: "fail-template-only-tag-wins-over-required",
    fixture: "tests/fixtures/pairs/MTL603/fail-template-only-tag-wins-over-required",
    expected: [message("Authoring checklist")],
  },
  {
    name: "fail-template-only-text-is-case-sensitive",
    fixture: "tests/fixtures/pairs/MTL603/fail-template-only-text-is-case-sensitive",
    expected: [message("Notes for authors")],
  },
  {
    name: "fail-template-only-tag-wins-over-optional-required-and-loses-to-conditional",
    fixture: "tests/fixtures/pairs/MTL603/fail-template-only-tag-wins-over-optional-required-and-loses-to-conditional",
    expected: [message("A"), message("B"), message("D")],
  },
  {
    name: "fail-template-only-heading-in-code-fence-or-level-three-is-ignored",
    fixture: "tests/fixtures/pairs/MTL603/fail-template-only-heading-in-code-fence-or-level-three-is-ignored",
    expected: [message("Authoring checklist")],
  },
  {
    name: "fail-multiple-template-only-headings-template-order",
    fixture: "tests/fixtures/pairs/MTL603/fail-multiple-template-only-headings-template-order",
    expected: [message("Notes for authors"), message("Authoring checklist")],
  },
  {
    // Spec 2.6/4.3: section scope (H3 under a matched H2); the message has no `Section` form.
    name: "fail-template-only-h3-under-matched-h2",
    fixture: "tests/fixtures/pairs/MTL603/fail-template-only-h3-under-matched-h2",
    expected: [message("Draft notes")],
  },
  {
    // Spec 2.6, 2.10 step 1: scope is the target section of the parent's match; every sibling
    // with the text is set aside, ONE finding on the first (line 7). The second `### Draft
    // notes` (line 9) gets no finding, and the one under `## Other` (line 13) is out of scope.
    name: "fail-template-only-h3-first-sibling-in-parent-section-anchors",
    fixture: "tests/fixtures/pairs/MTL603/fail-template-only-h3-first-sibling-in-parent-section-anchors",
    expected: [message("Draft notes")],
  },
  {
    // docs/grammar.md "Checked", spec 2.10 step 3b: `## Other` comes first, so the level-2 position
    // `Context` looks at it, does not match and takes nothing: no match for the parent, its
    // template-only child is not checked, and the `### Draft notes` of the file are free.
    name: "pass-template-only-h3-under-parent-shifted-by-extra-h2",
    fixture: "tests/fixtures/pairs/MTL603/pass-template-only-h3-under-parent-shifted-by-extra-h2",
    expected: [],
  },
  {
    // Section scope nests: `#### Draft` under the matched `### Detail` under `## Context`.
    name: "fail-template-only-h4-under-matched-h3",
    fixture: "tests/fixtures/pairs/MTL603/fail-template-only-h4-under-matched-h3",
    expected: [message("Draft")],
  },
  {
    // docs/grammar.md "Checked": the section-scope descendants of a template-only heading are never
    // checked, so only `Notes` (line 5) is reported, not the matched `### Draft` (line 7).
    name: "fail-template-only-child-of-matched-template-only-parent-is-not-checked",
    fixture: "tests/fixtures/pairs/MTL603/fail-template-only-child-of-matched-template-only-parent-is-not-checked",
    expected: [message("Notes")],
  },
  {
    // The same heading in another H2 section is outside the scope of the matched parent.
    name: "pass-template-only-h3-outside-parent-section",
    fixture: "tests/fixtures/pairs/MTL603/pass-template-only-h3-outside-parent-section",
    expected: [],
  },
  {
    // docs/grammar.md "Checked": the parent `## Context` has no match, so the child is not checked.
    name: "pass-template-only-h3-under-missing-parent",
    fixture: "tests/fixtures/pairs/MTL603/pass-template-only-h3-under-missing-parent",
    expected: [],
  },
  {
    // Exact-level matching in a section: `#### Draft notes` is not `### Draft notes`.
    name: "pass-template-only-h3-at-other-level-in-section",
    fixture: "tests/fixtures/pairs/MTL603/pass-template-only-h3-at-other-level-in-section",
    expected: [],
  },
  {
    // `### Other` ends the section of `### Detail` (the parent's match), so `#### Draft` is out.
    name: "pass-template-only-h4-under-another-h3-sibling",
    fixture: "tests/fixtures/pairs/MTL603/pass-template-only-h4-under-another-h3-sibling",
    expected: [],
  },
] as const;

/** Spec 4.4 DIR5: target line of the first sibling in scope with that level and text (set aside, 2.10 step 1). */
const ANCHORS: readonly { readonly dir: string; readonly anchor: number }[] = [
  { dir: "fail-template-only-h3-under-matched-h2", anchor: 7 },
  { dir: "fail-template-only-h3-first-sibling-in-parent-section-anchors", anchor: 7 },
  { dir: "fail-template-only-h4-under-matched-h3", anchor: 9 },
  { dir: "fail-template-only-child-of-matched-template-only-parent-is-not-checked", anchor: 5 },
];

const read = (path: string): string => readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** Diagnostics of this code for the pair of a fixture folder. */
async function lint(fixture: string) {
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
  const found = await checkTarget(registry, status.model, read(`${fixture}/target.md`), `${fixture}/target.md`, createEnv());
  return found.filter((diagnostic) => diagnostic.code === CODE);
}

describe("MTL603 heading-template-only", { tags: ["MTL603", "heading"] }, () => {
  it("is registered in category heading, error, target step headings", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "heading-template-only",
      category: "heading",
      severity: "error",
      phase: "target",
      step: "headings",
    });
  });

  it("has at least 1 pass- case and at least 1 fail- case, one fixture dir each", () => {
    const passing = CASES.filter((testCase) => testCase.name.startsWith("pass-"));
    const failing = CASES.filter((testCase) => testCase.name.startsWith("fail-"));
    expect(passing.length).toBeGreaterThanOrEqual(1);
    expect(failing.length).toBeGreaterThanOrEqual(1);
    expect(passing.length + failing.length).toBe(CASES.length);
    expect(CASES.filter((testCase) => testCase.expected.length === 0)).toEqual(passing);
    for (const testCase of CASES) expect(testCase.fixture).toBe(`${DIR}/${testCase.name}`);
    const dirs = readdirSync(fileURLToPath(new URL(`../../../${DIR}`, import.meta.url))).sort();
    expect(dirs).toEqual(CASES.map((testCase) => testCase.name).sort());
  });

  for (const { dir, anchor } of ANCHORS) {
    it(`${dir}: one finding anchored on target line ${anchor}`, async () => {
      const found = await lint(`${DIR}/${dir}`);
      expect(found.map((diagnostic) => anchorLineOf(diagnostic))).toEqual([anchor]);
    });
  }

  for (const testCase of CASES) {
    it(`${testCase.name}: ${testCase.fixture}`, async () => {
      const found = await lint(testCase.fixture);
      expect(found.map((diagnostic) => diagnostic.message)).toEqual(testCase.expected);
      for (const diagnostic of found) {
        expect(diagnostic.severity).toBe("error");
        // The pipeline clears the template-line sort anchor (docs/architecture.md).
        expect(diagnostic.position).toBeNull();
      }
    });
  }
});
