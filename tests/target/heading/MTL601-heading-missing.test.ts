/** MTL601 heading-missing (src/rules/heading.ts, docs/spec.md 2.6, 4.1 step 5, 4.3). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL601";
const DIR = "tests/fixtures/pairs/MTL601";

/** Case -> fixture -> expected result: exactly 1 passing case, failing cases >= passing. */
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
    name: "fail-same-text-at-other-level-still-matches",
    fixture: "tests/fixtures/pairs/MTL601/fail-same-text-at-other-level-still-matches",
    expected: ["Heading: Missing required heading: 'Steps'"],
  },
  {
    name: "fail-multiple-missing-template-order",
    fixture: "tests/fixtures/pairs/MTL601/fail-multiple-missing-template-order",
    expected: [
      "Heading: Missing required heading: 'Summary'",
      "Heading: Missing required heading: 'Actions'",
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

describe("MTL601 heading-missing", () => {
  it("is registered in category heading, error, target step headings", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "heading-missing",
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
