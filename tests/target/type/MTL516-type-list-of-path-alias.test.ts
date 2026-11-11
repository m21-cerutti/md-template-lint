/** MTL516 type-list-of-path-alias (src/rules/type.ts, docs/spec.md 3.4, 4.1 step 3, 4.3). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL516";
const DIR = "tests/fixtures/pairs/MTL516";

/** Spec 4.3 messages of MTL516: `Field '<key>' (type=list-of-path-alias): <detail>`. */
const shape = (key: string, got: string): string => `Field '${key}' (type=list-of-path-alias): expected a YAML list of path aliases, got ${got}`;
const entries = (key: string, items: string): string => `Field '${key}' (type=list-of-path-alias): list contains non-alias entries ` + `(expected @<name>/<rest>): ${items}`;

interface TestCase {
  readonly name: string;
  /** Expected MTL516 messages, in order. */
  readonly expected: readonly string[];
}

/**
 * Case -> fixture dir (same name) -> expected result. At least 1 passing case and
 * 1 failing case.
 */
const CASES: readonly TestCase[] = [
  // Silent: aliases of every look (minimal, charset, trailing slash, `@` in
  // the rest), padded items (spaces, tab, no-break space), a field typed by a
  // `[path-alias]` hint with a list value, a block list of one item;
  // other-type fields (a string, a scalar alias, a scalar path, a mapping, a
  // list of non-aliases typed `list`) pin the type guard; blank,
  // whitespace-only, empty list and missing key are skipped by the step 3 gate.
  {
    name: "pass-alias-items-type-guard-and-empty-gates",
    expected: [],
  },
  // Not a list: a scalar and a comma separated scalar.
  {
    name: "fail-scalar-and-comma-separated-scalar-are-not-lists",
    expected: [shape("single_alias", "a scalar"), shape("comma_separated_aliases", "a scalar")],
  },
  {
    name: "fail-mapping-in-list-of-path-alias-field",
    expected: [shape("aliases", "a mapping")],
  },
  // Valid items are not named; the offenders keep their order. A plain
  // absolute path is not an alias.
  {
    name: "fail-mixed-valid-and-invalid-items-name-only-offenders-in-order",
    expected: [entries("aliases", "['assets/b.svg', '/assets/d.svg']")],
  },
  // Empty or doubled name, characters outside [A-Za-z0-9_-], no slash, empty
  // rest, a backslash instead of the slash (doubled by the repr); the
  // last item (@a/b) is valid.
  {
    name: "fail-name-charset-and-structure",
    expected: [entries("aliases", "['@/x', '@@a/x', '@as.sets/x', '@as sets/x', '@assèts/x', '@as$ets/x', " + "'@assets', '@assets/', '@assets\\\\x']")],
  },
  // Whitespace in the rest (space, tab, no-break space shown as \xa0), text
  // before the @, a rest of spaces only; items are printed untrimmed.
  {
    name: "fail-whitespace-in-rest-and-leading-text",
    expected: [entries("aliases", "['@assets/my logo.svg', '@assets/my\\tlogo', 'x @assets/logo', '@assets/   ', " + "'@assets/a\\xa0b']")],
  },
  // Blank items are invalid and printed untrimmed; a null item is ''.
  {
    name: "fail-blank-and-whitespace-items",
    expected: [entries("aliases", "['', '   ', '']")],
  },
  // A nested list or mapping item prints as its value text, then repr-quoted.
  {
    name: "fail-nested-list-and-mapping-items-print-as-value-text",
    expected: [entries("aliases", `["['@a/b']", "{'k': '@c/d'}"]`)],
  },
  // Errors follow the template key order, not the target order.
  {
    name: "fail-two-fields-in-template-order",
    expected: [shape("first", "a scalar"), entries("second", "['nowhere']")],
  },
  // Type from the template value `list-of-path-alias`, and from the hint
  // `[path-alias]` with a list value (promotion).
  {
    name: "fail-type-from-template-value-list-of-path-alias",
    expected: [entries("aliases", "['x']")],
  },
  {
    name: "fail-type-from-bracket-hint-with-list-value",
    expected: [entries("aliases", "['bad']")],
  },
  {
    name: "fail-type-from-explicit-path-alias-hint-with-list-value",
    expected: [entries("aliases", "['/not/an/alias']")],
  },
];

const read = (path: string): string => readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** MTL516 diagnostics for the pair of a fixture folder. */
async function lint(testCase: TestCase) {
  const fixture = `${DIR}/${testCase.name}`;
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
  const found = await checkTarget(registry, status.model, read(`${fixture}/target.md`), `${fixture}/target.md`, createEnv());
  return found.filter((diagnostic) => diagnostic.code === CODE);
}

describe("MTL516 type-list-of-path-alias", { tags: ["MTL516", "type"] }, () => {
  it("is registered in category type, error, field step type", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "type-list-of-path-alias",
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
