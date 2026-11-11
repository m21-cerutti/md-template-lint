/** MTL601 heading-missing (src/rules/heading.ts, docs/spec.md 2.6, 4.1 step 5, 4.3). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { anchorLineOf, createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL601";
const DIR = "tests/fixtures/pairs/MTL601";

/** Case -> fixture -> expected result: at least 1 passing case and 1 failing case. */
const CASES = [
  {
    name: "pass-required-heading-present",
    fixture: "tests/fixtures/pairs/MTL601/pass-required-heading-present",
    expected: [],
  },
  {
    name: "fail-required-heading-missing",
    fixture: "tests/fixtures/pairs/MTL601/fail-required-heading-missing",
    expected: ["Heading: Missing required heading: 'Context'"],
  },
  {
    name: "fail-untagged-heading-missing",
    fixture: "tests/fixtures/pairs/MTL601/fail-untagged-heading-missing",
    expected: ["Heading: Missing required heading: 'Steps'"],
  },
  {
    name: "fail-heading-text-case-differs",
    fixture: "tests/fixtures/pairs/MTL601/fail-heading-text-case-differs",
    expected: ["Heading: Missing required heading: 'Context'"],
  },
  {
    name: "fail-heading-only-in-code-fence",
    fixture: "tests/fixtures/pairs/MTL601/fail-heading-only-in-code-fence",
    expected: ["Heading: Missing required heading: 'Context'"],
  },
  {
    name: "fail-heading-only-at-level-three",
    fixture: "tests/fixtures/pairs/MTL601/fail-heading-only-at-level-three",
    expected: ["Heading: Missing required heading: 'Context'"],
  },
  {
    name: "fail-same-text-at-other-level-does-not-match",
    fixture: "tests/fixtures/pairs/MTL601/fail-same-text-at-other-level-does-not-match",
    expected: ["Heading: Missing required heading: 'Context'", "Heading: Missing required heading: 'Steps'"],
  },
  {
    name: "fail-multiple-missing-template-order",
    fixture: "tests/fixtures/pairs/MTL601/fail-multiple-missing-template-order",
    expected: ["Heading: Missing required heading: 'Summary'", "Heading: Missing required heading: 'Actions'"],
  },
  {
    // Spec 2.6/4.3: `### Decision` has the template parent `## Context`, so it is section
    // scope; its absence is MTL610, never MTL601 (asserted below).
    name: "pass-missing-section-scope-h3-is-not-mtl601",
    fixture: "tests/fixtures/pairs/MTL601/pass-missing-section-scope-h3-is-not-mtl601",
    expected: [],
  },
  {
    // Spec 2.6: a heading with no template parent is file scope at any level.
    name: "pass-leading-h3-without-template-parent-matches-anywhere-in-file",
    fixture: "tests/fixtures/pairs/MTL601/pass-leading-h3-without-template-parent-matches-anywhere-in-file",
    expected: [],
  },
  {
    // `### Decision` has no template parent: file scope, MTL601. Its child `#### Options` is
    // section scope under a missing parent: not checked, not reported again (spec 2.6).
    name: "fail-leading-h3-without-template-parent-is-file-scope",
    fixture: "tests/fixtures/pairs/MTL601/fail-leading-h3-without-template-parent-is-file-scope",
    expected: ["Heading: Missing required heading: 'Decision'"],
  },
  {
    // Spec 2.6: H1 and H2 stay checked whatever their parent (the missing `# Guide` does not
    // hide `## Context`), in template order.
    name: "fail-h2-under-missing-h1-is-still-reported",
    fixture: "tests/fixtures/pairs/MTL601/fail-h2-under-missing-h1-is-still-reported",
    expected: ["Heading: Missing required heading: 'Guide'", "Heading: Missing required heading: 'Context'"],
  },
  {
    // Owner example I (spec 2.10 worked example 4, A72l): `Alpha` takes nothing at line 5;
    // line 7, from the cursor onward, has its text: the second message form (spec 4.3).
    name: "fail-swapped-pair-gives-found-later-hint",
    fixture: "tests/fixtures/pairs/MTL601/fail-swapped-pair-gives-found-later-hint",
    expected: ["Heading: Missing required heading: 'Alpha' (found later at line 7, out of order)"],
  },
  {
    // Exact level (spec 2.10 step 3b): `### Alpha` is not a sibling of the level-2 run, so it
    // gives no hint.
    name: "fail-same-text-at-other-level-gives-no-hint",
    fixture: "tests/fixtures/pairs/MTL601/fail-same-text-at-other-level-gives-no-hint",
    expected: ["Heading: Missing required heading: 'Alpha'"],
  },
  {
    // Spec 2.10 step 3b: the first `Alpha` takes line 5; the second `Alpha` finds its text
    // only before the cursor (no sibling left): no hint.
    name: "fail-same-text-before-cursor-gives-no-hint",
    fixture: "tests/fixtures/pairs/MTL601/fail-same-text-before-cursor-gives-no-hint",
    expected: ["Heading: Missing required heading: 'Alpha'"],
  },
  {
    // Owner example B (spec 2.10 worked example 4): the optional `{text}` position takes
    // `toto` before the cursor reaches `## toto`: no hint.
    name: "fail-taken-by-earlier-pattern-gives-no-hint",
    fixture: "tests/fixtures/pairs/MTL601/fail-taken-by-earlier-pattern-gives-no-hint",
    expected: ["Heading: Missing required heading: 'toto'"],
  },
  {
    // Spec 2.10 step 3b: line 7 is later taken by the `{text}` position; the hint still names
    // it and changes no match.
    name: "fail-later-sibling-taken-by-later-pattern-gives-hint",
    fixture: "tests/fixtures/pairs/MTL601/fail-later-sibling-taken-by-later-pattern-gives-hint",
    expected: ["Heading: Missing required heading: 'Alpha' (found later at line 7, out of order)"],
  },
  {
    // Spec 2.10 step 3b: a pattern heading never gives MTL601 and keeps its MTL605 message,
    // although a sibling with its text comes later (asserted below).
    name: "pass-pattern-heading-with-same-text-later-keeps-mtl605",
    fixture: "tests/fixtures/pairs/MTL601/pass-pattern-heading-with-same-text-later-keeps-mtl605",
    expected: [],
  },
  {
    // Spec 2.10 step 3b: section scope gives MTL610, which keeps its message (no hint) for a
    // swapped pair (asserted below).
    name: "pass-section-scope-swapped-pair-keeps-mtl610-without-hint",
    fixture: "tests/fixtures/pairs/MTL601/pass-section-scope-swapped-pair-keeps-mtl610-without-hint",
    expected: [],
  },
  {
    // Spec 2.10 step 3b: the sibling `Alpha` (line 7) is set aside by the template-only `Alpha`
    // (MTL603), so it is outside the run and not named: the plain message.
    name: "fail-set-aside-same-text-sibling-gives-no-hint",
    fixture: "tests/fixtures/pairs/MTL601/fail-set-aside-same-text-sibling-gives-no-hint",
    expected: ["Heading: Missing required heading: 'Alpha'"],
  },
  {
    // Spec 2.10 step 3b: "the first such sibling" in file order is named (line 7, not 9).
    name: "fail-two-later-siblings-name-the-first-one",
    fixture: "tests/fixtures/pairs/MTL601/fail-two-later-siblings-name-the-first-one",
    expected: ["Heading: Missing required heading: 'Alpha' (found later at line 7, out of order)"],
  },
] as const;

const read = (path: string): string => readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** Every diagnostic for the pair of a fixture folder. */
async function lintAll(fixture: string) {
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
  return checkTarget(registry, status.model, read(`${fixture}/target.md`), `${fixture}/target.md`, createEnv());
}

/** Diagnostics of this code for the pair of a fixture folder. */
async function lint(fixture: string) {
  const found = await lintAll(fixture);
  return found.filter((diagnostic) => diagnostic.code === CODE);
}

describe("MTL601 heading-missing", { tags: ["MTL601", "heading"] }, () => {
  it("is registered in category heading, error, target step headings", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "heading-missing",
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

  it("a missing section-scope heading is MTL610 alone; a leading H3 child gives MTL601 alone", async () => {
    // Spec 2.6 and 4.3: section scope -> MTL610; file scope -> MTL601, children unchecked.
    const codes = async (name: string) => (await lintAll(`${DIR}/${name}`)).map((diagnostic) => diagnostic.code);
    expect(await codes("pass-missing-section-scope-h3-is-not-mtl601")).toEqual(["MTL610"]);
    expect(await codes("fail-leading-h3-without-template-parent-is-file-scope")).toEqual(["MTL601"]);
    expect(await codes("pass-leading-h3-without-template-parent-matches-anywhere-in-file")).toEqual([]);
    // `## Other` is left in the tail of the level-2 run: the warning MTL616 (docs/grammar.md "Extra").
    expect(await codes("fail-h2-under-missing-h1-is-still-reported")).toEqual(["MTL601", "MTL601", "MTL616"]);
  });

  it("the found-later hint changes no match: a tail sibling stays MTL616, a taken one does not", async () => {
    // Owner example I: line 7 stays in the tail, the warning MTL616 anchors on it (spec 2.10).
    const swapped = await lintAll(`${DIR}/fail-swapped-pair-gives-found-later-hint`);
    expect(swapped.map((diagnostic) => [diagnostic.code, anchorLineOf(diagnostic)])).toEqual([
      ["MTL601", null],
      ["MTL616", 7],
    ]);
    // The `{text}` position takes line 7: no tail, so the hint is the only finding.
    const taken = await lintAll(`${DIR}/fail-later-sibling-taken-by-later-pattern-gives-hint`);
    expect(taken.map((diagnostic) => diagnostic.code)).toEqual(["MTL601"]);
  });

  it("a pattern heading keeps MTL605, a section-scope heading MTL610: no hint", async () => {
    const messages = async (name: string) => (await lintAll(`${DIR}/${name}`)).map((diagnostic) => [diagnostic.code, diagnostic.message]);
    // `Alpha` (line 7) stays in the tail: the warning MTL616 names it.
    expect(await messages("pass-pattern-heading-with-same-text-later-keeps-mtl605")).toEqual([
      ["MTL605", 'Heading: missing required heading matching [pattern:"Alpha"] (H2)'],
      ["MTL616", "Heading: 1 extra heading(s) at level H2 after the template headings: ['Alpha']"],
    ]);
    expect(await messages("pass-section-scope-swapped-pair-keeps-mtl610-without-hint")).toEqual([
      ["MTL610", "Heading: Section 'P': missing required heading 'Alpha' (H3)"],
      ["MTL616", "Heading: Section 'P': 1 extra heading(s) at level H3 after the template headings: " + "['Alpha']"],
    ]);
  });

  it("a set-aside sibling is MTL603's: sorted by template line, MTL603 then MTL601", async () => {
    // Template line 5 (the template-only `Alpha`) comes before line 9 (the required `Alpha`).
    const found = await lintAll(`${DIR}/fail-set-aside-same-text-sibling-gives-no-hint`);
    expect(found.map((diagnostic) => diagnostic.code)).toEqual(["MTL603", CODE]);
  });

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
