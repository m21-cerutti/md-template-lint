/** MTL602 heading-level-missing (src/rules/heading.ts, docs/spec.md 2.6, 4.1 step 5, 4.3). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL602";
const DIR = "tests/fixtures/pairs/MTL602";

/** Case -> fixture -> expected result: exactly 1 passing case, failing cases >= passing. */
const CASES = [
  {
    name: "pass-same-level-heading-present",
    fixture: "tests/fixtures/pairs/MTL602/pass-same-level-heading-present",
    expected: [],
  },
  {
    name: "fail-no-heading-at-level-two",
    fixture: "tests/fixtures/pairs/MTL602/fail-no-heading-at-level-two",
    expected: ["Heading: Missing heading at level H2 [presence:exist]"],
  },
  {
    name: "fail-no-heading-at-level-one",
    fixture: "tests/fixtures/pairs/MTL602/fail-no-heading-at-level-one",
    expected: ["Heading: Missing heading at level H1 [presence:exist]"],
  },
  {
    name: "fail-same-text-at-other-level",
    fixture: "tests/fixtures/pairs/MTL602/fail-same-text-at-other-level",
    expected: ["Heading: Missing heading at level H2 [presence:exist]"],
  },
  {
    name: "fail-heading-only-in-code-fence",
    fixture: "tests/fixtures/pairs/MTL602/fail-heading-only-in-code-fence",
    expected: ["Heading: Missing heading at level H2 [presence:exist]"],
  },
  {
    name: "fail-exist-tag-wins-over-required",
    fixture: "tests/fixtures/pairs/MTL602/fail-exist-tag-wins-over-required",
    expected: ["Heading: Missing heading at level H2 [presence:exist]"],
  },
  {
    name: "fail-precedence-conditional-and-template-only-beat-exist",
    fixture: "tests/fixtures/pairs/MTL602/fail-precedence-conditional-and-template-only-beat-exist",
    expected: ["Heading: Missing heading at level H1 [presence:exist]"],
  },
  {
    name: "fail-exist-is-a-set-check-not-a-count",
    fixture: "tests/fixtures/pairs/MTL602/fail-exist-is-a-set-check-not-a-count",
    expected: ["Heading: Missing heading at level H1 [presence:exist]"],
  },
  {
    name: "fail-multiple-exist-missing-template-order",
    fixture: "tests/fixtures/pairs/MTL602/fail-multiple-exist-missing-template-order",
    expected: [
      "Heading: Missing heading at level H2 [presence:exist]",
      "Heading: Missing heading at level H1 [presence:exist]",
      "Heading: Missing heading at level H2 [presence:exist]",
    ],
  },
] as const;

const read = (path: string): string =>
  readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** Diagnostics of this code for the pair of a fixture folder. */
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
  return found.filter((diagnostic) => diagnostic.code === CODE);
}

describe("MTL602 heading-level-missing", () => {
  it("is registered in category heading, error, target step headings", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "heading-level-missing",
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
