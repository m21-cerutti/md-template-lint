/** MTL513 type-list-of-date (src/rules/type.ts, docs/spec.md 3.4, 4.1 step 3, 4.3). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL513";
const DIR = "tests/fixtures/pairs/MTL513";

/** Spec 4.3 messages of MTL513: `Field '<key>' (type=list-of-date): <detail>`. */
const shape = (key: string, got: string): string =>
  `Field '${key}' (type=list-of-date): expected a YAML list of dates, got ${got}`;
const entries = (key: string, items: string): string =>
  `Field '${key}' (type=list-of-date): list contains invalid date entries ` +
  `(expected a real calendar date in YYYY-MM-DD / YYYY-MM / YYYY / DD/MM/YYYY / present / présent): ${items}`;

interface TestCase {
  readonly name: string;
  /** Expected MTL513 messages, in order. */
  readonly expected: readonly string[];
}

/**
 * Case -> fixture dir (same name) -> expected result. At least 1 passing case and
 * 1 failing case.
 */
const CASES: readonly TestCase[] = [
  // Silent: all four shapes, leap days, the ongoing markers, padded items, a
  // field typed by its values alone, a block list of one item; other-type
  // fields (a bad date as a string, a scalar date, a scalar int, a mapping, a
  // list of bad dates typed `list`) pin the type guard; blank, whitespace-only,
  // empty list and missing key are skipped by the step 3 gate.
  {
    name: "pass-date-items-type-guard-and-empty-gates",
    expected: [],
  },
  // Not a list: a scalar and a comma separated scalar.
  {
    name: "fail-scalar-and-comma-separated-scalar-are-not-lists",
    expected: [shape("single_date", "a scalar"), shape("comma_separated_dates", "a scalar")],
  },
  {
    name: "fail-mapping-in-list-of-date-field",
    expected: [shape("dates", "a mapping")],
  },
  // Valid items are not named; the offenders keep their order.
  {
    name: "fail-mixed-valid-and-invalid-items-name-only-offenders-in-order",
    expected: [entries("dates", "['2026-13-40', '2025-02-29', 'tomorrow']")],
  },
  // Month length, month and day zero, year 0000, non-leap century, slash form,
  // a year-month with month 13; the last item (2026-12-31) is valid.
  {
    name: "fail-calendar-boundaries",
    expected: [
      entries(
        "dates",
        "['2026-04-31', '2026-01-32', '2026-00-10', '0000', '1900-02-29', '31/02/2020', '2026-13']",
      ),
    ],
  },
  // No lenient zero padding, no extra text, other separators, bad markers.
  {
    name: "fail-shapes-without-padding-and-with-extra-text",
    expected: [
      entries(
        "dates",
        "['2026-1-2', '1/2/2026', '2026-01-15T10:00', '2026/01/15', 'present day', " +
          "'not present', '2026-01-15 and more']",
      ),
    ],
  },
  // Blank items are invalid and printed untrimmed; a null item is ''.
  {
    name: "fail-blank-and-whitespace-items",
    expected: [entries("dates", "['', '   ', '']")],
  },
  // A nested list or mapping item prints as its Python str, then repr-quoted.
  {
    name: "fail-nested-list-and-mapping-items-print-as-python-text",
    expected: [entries("dates", `["['2026-01-16']", "{'d': '2026-01-17'}"]`)],
  },
  // Errors follow the template key order, not the target order.
  {
    name: "fail-two-fields-in-template-order",
    expected: [shape("first", "a scalar"), entries("second", "['soon']")],
  },
  // Type from a template list of date-like values, and from `type=date` with
  // a list value (promotion to list-of-date).
  {
    name: "fail-type-inferred-from-template-date-list",
    expected: [entries("dates", "['nope']")],
  },
  {
    name: "fail-type-from-date-hint-with-list-value",
    expected: [entries("dates", "['2026-13-40']")],
  },
];

const read = (path: string): string =>
  readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** MTL513 diagnostics for the pair of a fixture folder. */
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

describe("MTL513 type-list-of-date", () => {
  it("is registered in category type, error, field step type", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "type-list-of-date",
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
