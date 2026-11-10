/**
 * MTL604 heading-order (src/rules/heading.ts, docs/spec.md 2.6, 4.1 step 5, 4.3).
 * Also covers the no-op presence modes: an absent `[presence:optional]` or
 * `[presence:conditional:...]` heading gives no MTL601 or MTL603, so
 * the diagnostics checked here are the heading codes MTL601 to MTL605.
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL604";
const DIR = "tests/fixtures/pairs/MTL604";
// MTL605: the missing-heading code of a pattern heading (spec 2.10 step 3c).
const HEADING_CODES = ["MTL601", "MTL603", CODE, "MTL605"];

const order = (template: string, target: string): string => `Heading: Heading order mismatch: template order ${template} vs target order ${target}`;

/** Case -> fixture -> expected result: at least 1 passing case and 1 failing case. */
const CASES = [
  {
    name: "pass-optional-and-conditional-headings-absent",
    fixture: "tests/fixtures/pairs/MTL604/pass-optional-and-conditional-headings-absent",
    expected: [],
  },
  // Positional matching (spec 2.6 "Match of T", 2.10 "Positional match", ADR 0012): the template
  // headings of one level take the siblings in order, so a same-level swap is a MISSING heading
  // (MTL601), never an order error; MTL604 only reports an order ACROSS levels (spec 2.6 "Order").
  {
    // Alpha looks at `Beta` (no match: missing), Beta takes it; `Alpha` (line 7) is in the tail.
    // The MTL601 message names it: the "found later" hint (spec 2.10 step 3b, 4.3).
    name: "fail-two-headings-swapped",
    fixture: "tests/fixtures/pairs/MTL604/fail-two-headings-swapped",
    expected: ["Heading: Missing required heading: 'Alpha' (found later at line 7, out of order)"],
  },
  {
    // Summary looks at `Actions`: missing; Risks (absent, optional) takes nothing; Actions takes it.
    // `Summary` (line 7) comes later: the hint.
    name: "fail-later-heading-first-in-target-leaves-the-earlier-one-missing",
    fixture: "tests/fixtures/pairs/MTL604/fail-later-heading-first-in-target-leaves-the-earlier-one-missing",
    expected: ["Heading: Missing required heading: 'Summary' (found later at line 7, out of order)"],
  },
  {
    // Beta (template first) looks at `Alpha` (line 5): missing. Alpha takes line 5; the later
    // `Beta` and `Alpha` are in the tail. `Beta` (line 7) comes later: the hint.
    name: "fail-duplicate-target-heading-is-a-tail-extra",
    fixture: "tests/fixtures/pairs/MTL604/fail-duplicate-target-heading-is-a-tail-extra",
    expected: ["Heading: Missing required heading: 'Beta' (found later at line 7, out of order)"],
  },
  {
    // `## Slot [pattern:"{text}"]` takes the only H2 (`Any slot text`, line 5), matched before
    // the H1 `Title`; the template list names the pattern heading by its label `Slot` (2.10).
    name: "fail-pattern-heading-matched-by-level",
    fixture: "tests/fixtures/pairs/MTL604/fail-pattern-heading-matched-by-level",
    expected: [order("['Title', 'Slot']", "['Any slot text', 'Title']")],
  },
  {
    // An optional heading that comes after the next template heading is not skipped over: Beta
    // (optional) looks at `Gamma`, does not match and takes nothing; Gamma takes it; the later
    // `Beta` is in the tail (an extra, allowed). No error, and no order problem.
    name: "pass-present-optional-heading-after-later-heading-is-an-extra",
    fixture: "tests/fixtures/pairs/MTL604/pass-present-optional-heading-after-later-heading-is-an-extra",
    expected: [],
  },
  {
    // Same for `[presence:conditional:...]` (matches like optional, spec 2.6).
    name: "pass-present-conditional-heading-after-later-heading-is-an-extra",
    fixture: "tests/fixtures/pairs/MTL604/pass-present-conditional-heading-after-later-heading-is-an-extra",
    expected: [],
  },
  {
    // Alpha takes the only sibling; the required `Slot [pattern:"{text}"]` has no sibling left
    // (MTL605, template line 7, spec 2.10 step 3c), and `Beta` has none either (MTL601,
    // template line 9). Findings in template order.
    name: "fail-pattern-heading-without-sibling-left-is-missing",
    fixture: "tests/fixtures/pairs/MTL604/fail-pattern-heading-without-sibling-left-is-missing",
    expected: ['Heading: missing required heading matching [pattern:"{text}"] (H2)', "Heading: Missing required heading: 'Beta'"],
  },
  {
    // Texts are case sensitive: Alpha looks at `beta`, Beta looks at `beta` (case differs): both
    // missing, nothing taken, the run keeps its cursor. `Alpha` (line 7) comes later: the hint;
    // no sibling has the exact text `Beta`: no hint.
    name: "fail-case-differing-heading-takes-nothing-both-missing",
    fixture: "tests/fixtures/pairs/MTL604/fail-case-differing-heading-takes-nothing-both-missing",
    expected: ["Heading: Missing required heading: 'Alpha' (found later at line 7, out of order)", "Heading: Missing required heading: 'Beta'"],
  },
  {
    // The MTL601 message is the raw text between single quotes (the python repr is only for the
    // MTL604 lists, next case). The swapped heading (line 7) gives the hint.
    name: "fail-swapped-heading-text-with-quote-is-missing",
    fixture: "tests/fixtures/pairs/MTL604/fail-swapped-heading-text-with-quote-is-missing",
    expected: ["Heading: Missing required heading: 'Alpha's notes' (found later at line 7, out of order)"],
  },
  {
    // Order across levels: the H2 `Beta` matches (line 5) before the H1 `Alpha's notes` (line
    // 7) that precedes it in the template. The lists are python reprs: a text with `'` is
    // double-quoted.
    name: "fail-heading-text-with-quote-uses-python-repr",
    fixture: "tests/fixtures/pairs/MTL604/fail-heading-text-with-quote-uses-python-repr",
    expected: [order(`["Alpha's notes", 'Beta']`, `['Beta', "Alpha's notes"]`)],
  },
  {
    // The simplest order across levels (spec 2.6 "Order", MTL604 only).
    name: "fail-h2-matched-before-the-h1-that-precedes-it",
    fixture: "tests/fixtures/pairs/MTL604/fail-h2-matched-before-the-h1-that-precedes-it",
    expected: [order("['Title', 'Alpha']", "['Alpha', 'Title']")],
  },
  {
    name: "fail-pattern-takes-first-h2-matched-before-the-h1-title",
    fixture: "tests/fixtures/pairs/MTL604/fail-pattern-takes-first-h2-matched-before-the-h1-title",
    expected: [order("['Title', 'Slot']", "['First', 'Title', 'Second']")],
  },
  {
    name: "fail-missing-heading-is-presence-not-order",
    fixture: "tests/fixtures/pairs/MTL604/fail-missing-heading-is-presence-not-order",
    expected: ["Heading: Missing required heading: 'Beta'"],
  },
  {
    // Spec 2.6: the list is the file-scope headings; `### Beta` has no template parent, so the
    // deepest level is 3 and the target list shows levels up to H3 (`Gamma`, H4, is left out).
    name: "fail-file-scope-h3-widens-target-order-list",
    fixture: "tests/fixtures/pairs/MTL604/fail-file-scope-h3-widens-target-order-list",
    expected: [order("['Beta', 'Alpha']", "['Alpha', 'Beta', 'Delta']")],
  },
  {
    // Spec 2.6: only H1/H2 in the list, so the deepest level is 2 and `Zed` (H3) is left out.
    name: "fail-h1-h2-template-excludes-deeper-target-headings",
    fixture: "tests/fixtures/pairs/MTL604/fail-h1-h2-template-excludes-deeper-target-headings",
    expected: [order("['Beta', 'Alpha']", "['Alpha', 'Beta']")],
  },
  {
    // Spec 2.6: a swapped section-scope pair is no MTL604 (asserted below): `Inner one` looks at
    // `Inner two` and is missing (MTL610), the order codes only see an order across levels.
    name: "pass-section-scope-swap-is-mtl610-not-mtl604",
    fixture: "tests/fixtures/pairs/MTL604/pass-section-scope-swap-is-mtl610-not-mtl604",
    expected: [],
  },
] as const;

const read = (path: string): string => readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** Every diagnostic for the pair of a fixture folder. */
async function lintAll(fixture: string) {
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
  return checkTarget(registry, status.model, read(`${fixture}/target.md`), `${fixture}/target.md`, createEnv());
}

/** Heading diagnostics (MTL601 to MTL605) for the pair of a fixture folder. */
async function lint(fixture: string) {
  const found = await lintAll(fixture);
  return found.filter((diagnostic) => HEADING_CODES.includes(diagnostic.code));
}

describe("MTL604 heading-order", () => {
  it("is registered in category heading, error, target step headings", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "heading-order",
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

  it("a swapped section-scope pair gives MTL610 and no MTL604 and no MTL611", async () => {
    const found = await lintAll(`${DIR}/pass-section-scope-swap-is-mtl610-not-mtl604`);
    // `### Inner two` takes line 7, so `### Inner one` (line 9) is in the tail: MTL616 (2.6).
    expect(found.map((diagnostic) => diagnostic.code)).toEqual(["MTL610", "MTL616"]);
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
