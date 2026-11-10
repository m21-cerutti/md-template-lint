/** MTL511 type-list-of-string (src/rules/type.ts, docs/spec.md 3.4, 4.1 step 3, 4.3). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL511";
const DIR = "tests/fixtures/pairs/MTL511";

/** Spec 4.3 messages of MTL511: `Field '<key>' (type=list-of-string): <detail>`. */
const shape = (key: string, got: string): string =>
  `Field '${key}' (type=list-of-string): expected a YAML list of strings, got ${got}`;
const nested = (key: string, items: string): string =>
  `Field '${key}' (type=list-of-string): list contains non-scalar entries: ${items}`;

interface TestCase {
  readonly name: string;
  /** Expected MTL511 messages, in order. */
  readonly expected: readonly string[];
}

/**
 * Case -> fixture dir (same name) -> expected result. At least 1 passing case and
 * 1 failing case.
 */
const CASES: readonly TestCase[] = [
  // Silent: scalar items of every look (numbers, booleans, blank strings), a
  // block list of one item; other-type fields holding a scalar, a mapping or
  // a list with nested items (the type guard); blank, whitespace-only, empty
  // list and missing key (spec 4.1 step 3 gate).
  {
    name: "pass-scalar-items-type-guard-and-empty-gates",
    expected: [],
  },
  // Not a list: a scalar and a comma separated scalar (spec 3.4).
  {
    name: "fail-scalar-and-comma-separated-scalar-are-not-lists",
    expected: [shape("plain_scalar", "a scalar"), shape("comma_separated_scalar", "a scalar")],
  },
  {
    name: "fail-mapping-in-list-of-string-field",
    expected: [shape("words", "a mapping")],
  },
  // Only the nested items are named, by index and shape, in item order.
  {
    name: "fail-nested-list-and-mapping-items-named-by-position",
    expected: [nested("words", "['item 1 is a list', 'item 3 is a mapping', 'item 4 is a list']")],
  },
  {
    name: "fail-only-nested-items-in-block-list",
    expected: [nested("words", "['item 0 is a list', 'item 1 is a mapping']")],
  },
  // Errors follow the template key order, not the target order.
  {
    name: "fail-two-fields-in-template-order",
    expected: [shape("first", "a scalar"), nested("second", "['item 1 is a list']")],
  },
  // Type from the template value `list-of-string` and from `[list-of-string]`.
  {
    name: "fail-type-from-template-value-list-of-string",
    expected: [nested("words", "['item 1 is a mapping']")],
  },
  {
    name: "fail-type-from-bracket-hint-in-comment",
    expected: [shape("words", "a mapping")],
  },
];

const read = (path: string): string =>
  readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** MTL511 diagnostics for the pair of a fixture folder. */
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

describe("MTL511 type-list-of-string", () => {
  it("is registered in category type, error, field step type", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "type-list-of-string",
      category: "type",
      severity: "error",
      phase: "field",
      step: "type",
    });
  });

  it("has at least 1 pass- case and at least 1 fail- case, one fixture dir each", () => {
    const passing = CASES.filter((testCase) => testCase.name.startsWith("pass-"));
    const failing = CASES.filter((testCase) => testCase.name.startsWith("fail-"));
    expect(passing.length).toBeGreaterThanOrEqual(1);
    expect(failing.length).toBeGreaterThanOrEqual(1);
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
