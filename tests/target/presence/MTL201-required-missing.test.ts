/** MTL201 required-missing (src/rules/presence.ts, docs/spec.md 2.2, 4.1, 4.3). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL201";
const DIR = "tests/fixtures/pairs/MTL201";

/** Spec 4.3 message of MTL201. */
const message = (key: string): string => `Field '${key}': required but empty or missing`;

interface TestCase {
  readonly name: string;
  readonly expected: readonly string[];
}

/** Case -> fixture dir (same name) -> expected result: exactly 1 passing case, failing cases >= passing. */
const CASES: readonly TestCase[] = [
  // Silent in one run: every required field present, a field with only a
  // non-presence tag present, optional and conditional fields blank or absent.
  { name: "pass-all-required-present", expected: [] },
  // Required field absent from the target.
  { name: "fail-required-key-absent", expected: [message("summary")] },
  // Required field present but blank.
  { name: "fail-required-value-blank", expected: [message("summary")] },
  // A field without a presence tag is required; an empty list is empty.
  { name: "fail-untagged-field-empty-list", expected: [message("tags")] },
  // Optional and conditional stay silent; errors follow the template order.
  {
    name: "fail-multiple-missing-template-order",
    expected: [message("title"), message("summary")],
  },
  // Precedence conditional > optional > required, whatever the tag order: a, b
  // and c carry a required tag next to an optional or conditional one and stay
  // silent; only the untagged d is reported.
  {
    name: "fail-required-tag-loses-to-optional-or-conditional",
    expected: [message("d")],
  },
  // No presence tag at all (only a format tag): the field is required.
  {
    name: "fail-field-with-only-non-presence-tag-is-required",
    expected: [message("slug")],
  },
];

const read = (path: string): string =>
  readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** Diagnostics of this code for the pair of a fixture folder. */
async function lint(testCase: TestCase) {
  const fixture = `${DIR}/${testCase.name}`;
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

describe("MTL201 required-missing", () => {
  it("is registered in category presence, error, field step presence", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "required-missing",
      category: "presence",
      severity: "error",
      phase: "field",
      step: "presence",
    });
  });

  it("has exactly 1 pass- case and at least as many fail- cases, one fixture dir each", () => {
    const passing = CASES.filter((testCase) => testCase.name.startsWith("pass-"));
    const failing = CASES.filter((testCase) => testCase.name.startsWith("fail-"));
    expect(passing).toHaveLength(1);
    expect(failing.length).toBeGreaterThanOrEqual(passing.length);
    expect(passing.length + failing.length).toBe(CASES.length);
    expect(CASES.filter((testCase) => testCase.expected.length === 0)).toEqual(passing);
    const dirs = readdirSync(fileURLToPath(new URL(`../../../${DIR}`, import.meta.url))).sort();
    expect(dirs).toEqual(CASES.map((testCase) => testCase.name).sort());
  });

  for (const testCase of CASES) {
    it(`${testCase.name}: ${DIR}/${testCase.name}`, async () => {
      const found = await lint(testCase);
      expect(found.map((diagnostic) => diagnostic.message)).toEqual(testCase.expected);
      for (const diagnostic of found) {
        expect(diagnostic.severity).toBe("error");
        expect(diagnostic.position).toBeNull();
      }
    });
  }
});
