/** MTL512 type-list-of-int (src/rules/type.ts, docs/spec.md 3.4, 4.1 step 3, 4.3). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL512";
const DIR = "tests/fixtures/pairs/MTL512";

/** Spec 4.3 messages of MTL512: `Field '<key>' (type=list-of-int): <detail>`. */
const shape = (key: string, got: string): string =>
  `Field '${key}' (type=list-of-int): expected a YAML list of integers, got ${got}`;
const entries = (key: string, items: string): string =>
  `Field '${key}' (type=list-of-int): list contains non-integer entries: ${items}`;

interface TestCase {
  readonly name: string;
  /** Expected MTL512 messages, in order. */
  readonly expected: readonly string[];
}

/**
 * Case -> fixture dir (same name) -> expected result. Exactly 1 passing case,
 * failing cases >= passing.
 */
const CASES: readonly TestCase[] = [
  // Silent: signed, padded and zero-led integers, a block list of one item;
  // other-type fields (a string, a float, a scalar int, a mapping, a list of
  // non-integers) pin the type guard; blank, whitespace-only, empty list and
  // missing key are skipped by the step 3 gate.
  {
    name: "pass-integer-items-type-guard-and-empty-gates",
    expected: [],
  },
  // Not a list: a scalar and a comma separated scalar.
  {
    name: "fail-scalar-and-comma-separated-scalar-are-not-lists",
    expected: [shape("single_integer", "a scalar"), shape("comma_separated_integers", "a scalar")],
  },
  {
    name: "fail-mapping-in-list-of-int-field",
    expected: [shape("ids", "a mapping")],
  },
  // Valid items are not named; the offenders keep their order.
  {
    name: "fail-mixed-valid-and-invalid-items-name-only-offenders-in-order",
    expected: [entries("ids", "['abc', '3.5', 'x']")],
  },
  // Decimal, plus sign, lone and doubled minus, trailing and leading dot,
  // exponent; the neighbouring "0" is valid and not named.
  {
    name: "fail-decimal-exponent-and-sign-boundaries",
    expected: [entries("ids", "['1.5', '+5', '-', '--5', '5.', '.5', '1e3']")],
  },
  // Blank items are invalid and printed untrimmed; a null item is ''.
  {
    name: "fail-blank-and-whitespace-items",
    expected: [entries("ids", "['', '   ', '']")],
  },
  // A nested list or mapping item prints as its Python str, then repr-quoted.
  {
    name: "fail-nested-list-and-mapping-items-print-as-python-text",
    expected: [entries("ids", `["['2', '3']", "{'a': '1'}"]`)],
  },
  // Python repr quoting of the printed items.
  {
    name: "fail-items-with-quote-characters-use-python-repr-quoting",
    expected: [entries("ids", `["it's", 'say "hi"', 'both \\' and "']`)],
  },
  // Errors follow the template key order, not the target order.
  {
    name: "fail-two-fields-in-template-order",
    expected: [shape("first", "a scalar"), entries("second", "['two']")],
  },
  // Type from the template value `list-of-int` and from `[list-of-int]`.
  {
    name: "fail-type-from-template-value-list-of-int",
    expected: [entries("ids", "['x']")],
  },
  {
    name: "fail-type-from-bracket-hint-in-comment",
    expected: [entries("ids", "['2.0']")],
  },
];

const read = (path: string): string =>
  readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** MTL512 diagnostics for the pair of a fixture folder. */
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

describe("MTL512 type-list-of-int", () => {
  it("is registered in category type, error, field step type", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "type-list-of-int",
      category: "type",
      severity: "error",
      phase: "field",
      step: "type",
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
        expect(diagnostic.code).toBe(CODE);
        expect(diagnostic.severity).toBe("error");
        expect(diagnostic.position).toBeNull();
      }
    });
  }
});
