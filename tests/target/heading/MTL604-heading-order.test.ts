/**
 * MTL604 heading-order (src/rules/heading.ts, docs/spec.md 2.6, 4.1 step 5, 4.3).
 * Also covers the no-op presence modes: an absent `[presence:optional]` or
 * `[presence:conditional:...]` heading gives no MTL601, MTL602 or MTL603, so
 * the diagnostics checked here are the four heading codes MTL601 to MTL604.
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
const HEADING_CODES = ["MTL601", "MTL602", "MTL603", CODE];

const order = (template: string, target: string): string =>
  `Heading: Heading order mismatch: template order ${template} vs target order ${target}`;

/** Case -> fixture -> expected result: exactly 1 passing case, failing cases >= passing. */
const CASES = [
  {
    name: "pass-optional-and-conditional-headings-absent",
    fixture: "tests/fixtures/pairs/MTL604/pass-optional-and-conditional-headings-absent",
    expected: [],
  },
  {
    name: "fail-two-headings-swapped",
    fixture: "tests/fixtures/pairs/MTL604/fail-two-headings-swapped",
    expected: [order("['Alpha', 'Beta']", "['Beta', 'Alpha']")],
  },
  {
    name: "fail-order-checked-without-absent-optional-heading",
    fixture: "tests/fixtures/pairs/MTL604/fail-order-checked-without-absent-optional-heading",
    expected: [order("['Summary', 'Risks', 'Actions']", "['Actions', 'Summary']")],
  },
  {
    name: "fail-duplicate-target-heading-uses-first-match",
    fixture: "tests/fixtures/pairs/MTL604/fail-duplicate-target-heading-uses-first-match",
    expected: [order("['Beta', 'Alpha']", "['Alpha', 'Beta', 'Alpha']")],
  },
  {
    name: "fail-exist-heading-matched-by-level",
    fixture: "tests/fixtures/pairs/MTL604/fail-exist-heading-matched-by-level",
    expected: [order("['Title', 'Slot']", "['Any slot text', 'Title']")],
  },
  {
    name: "fail-present-optional-heading-out-of-order",
    fixture: "tests/fixtures/pairs/MTL604/fail-present-optional-heading-out-of-order",
    expected: [order("['Alpha', 'Beta', 'Gamma']", "['Alpha', 'Gamma', 'Beta']")],
  },
  {
    name: "fail-present-conditional-heading-out-of-order",
    fixture: "tests/fixtures/pairs/MTL604/fail-present-conditional-heading-out-of-order",
    expected: [order("['Alpha', 'Beta', 'Gamma']", "['Alpha', 'Gamma', 'Beta']")],
  },
  {
    name: "fail-equal-index-is-not-an-order-problem",
    fixture: "tests/fixtures/pairs/MTL604/fail-equal-index-is-not-an-order-problem",
    expected: ["Heading: Missing required heading: 'Beta'"],
  },
  {
    name: "fail-case-differing-heading-is-not-matched-for-order",
    fixture: "tests/fixtures/pairs/MTL604/fail-case-differing-heading-is-not-matched-for-order",
    expected: ["Heading: Missing required heading: 'Beta'"],
  },
  {
    name: "fail-heading-text-with-quote-uses-python-repr",
    fixture: "tests/fixtures/pairs/MTL604/fail-heading-text-with-quote-uses-python-repr",
    expected: [order(`["Alpha's notes", 'Beta']`, `['Beta', "Alpha's notes"]`)],
  },
  {
    name: "fail-exist-heading-uses-first-heading-of-the-level",
    fixture: "tests/fixtures/pairs/MTL604/fail-exist-heading-uses-first-heading-of-the-level",
    expected: [order("['Title', 'Slot']", "['First', 'Title', 'Second']")],
  },
  {
    name: "fail-missing-heading-is-presence-not-order",
    fixture: "tests/fixtures/pairs/MTL604/fail-missing-heading-is-presence-not-order",
    expected: ["Heading: Missing required heading: 'Beta'"],
  },
] as const;

const read = (path: string): string =>
  readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** Heading diagnostics (MTL601 to MTL604) for the pair of a fixture folder. */
async function lint(fixture: string) {
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
  const found = await checkTarget(
    registry,
    status.model,
    read(`${fixture}/target.md`),
    `${fixture}/target.md`,
    createEnv(),
  );
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

  it("has exactly 1 pass- case and at least as many fail- cases, one fixture dir each", () => {
    const passing = CASES.filter((testCase) => testCase.name.startsWith("pass-"));
    const failing = CASES.filter((testCase) => testCase.name.startsWith("fail-"));
    expect(passing).toHaveLength(1);
    expect(failing.length).toBeGreaterThanOrEqual(passing.length);
    expect(passing.length + failing.length).toBe(CASES.length);
    expect(CASES.filter((testCase) => testCase.expected.length === 0)).toEqual(passing);
    for (const testCase of CASES) expect(testCase.fixture).toBe(`${DIR}/${testCase.name}`);
    const dirs = readdirSync(fileURLToPath(new URL(`../../../${DIR}`, import.meta.url))).sort();
    expect(dirs).toEqual(CASES.map((testCase) => testCase.name).sort());
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
