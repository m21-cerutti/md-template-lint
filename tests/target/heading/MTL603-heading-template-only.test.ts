/** MTL603 heading-template-only (src/rules/heading.ts, docs/spec.md 2.6, 4.1 step 5, 4.3). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL603";
const DIR = "tests/fixtures/pairs/MTL603";

const message = (text: string): string =>
  `Heading: Heading '${text}' is marked [presence:template-only] ` +
  "and must not appear in the linted file";

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
    name: "fail-template-only-heading-at-other-level",
    fixture: "tests/fixtures/pairs/MTL603/fail-template-only-heading-at-other-level",
    expected: [message("Authoring checklist")],
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
    name: "fail-template-only-tag-wins-over-optional-exist-and-loses-to-conditional",
    fixture:
      "tests/fixtures/pairs/MTL603/fail-template-only-tag-wins-over-optional-exist-and-loses-to-conditional",
    expected: [message("A"), message("B"), message("D")],
  },
  {
    name: "fail-template-only-heading-in-code-fence-or-level-three-is-ignored",
    fixture:
      "tests/fixtures/pairs/MTL603/fail-template-only-heading-in-code-fence-or-level-three-is-ignored",
    expected: [message("Authoring checklist")],
  },
  {
    name: "fail-multiple-template-only-headings-template-order",
    fixture: "tests/fixtures/pairs/MTL603/fail-multiple-template-only-headings-template-order",
    expected: [message("Notes for authors"), message("Authoring checklist")],
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

describe("MTL603 heading-template-only", () => {
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
