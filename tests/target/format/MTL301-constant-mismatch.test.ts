/** MTL301 constant-mismatch (src/rules/format.ts, docs/spec.md 2.3, 4.1, 4.3). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL301";
const DIR = "tests/fixtures/pairs/MTL301";
/** The other codes of the format family: none may fire in any case (tag isolation). */
const OTHER_FORMAT_CODES = ["MTL302", "MTL303", "MTL304", "MTL305"];

/** Spec 4.3 message of MTL301. */
const message = (key: string, constant: string, got: string): string =>
  `Field '${key}': expected constant value '${constant}', got '${got}'`;

interface TestCase {
  readonly name: string;
  /** Expected MTL301 messages, in order. */
  readonly expected: readonly string[];
}

/**
 * Case -> fixture dir (same name) -> expected result. Exactly 1 passing case,
 * failing cases >= passing. Silent branches live in the pass fixture.
 */
const CASES: readonly TestCase[] = [
  // Silent in one run: a value equal to the constant, a constant with an inner
  // space and colon, a field without a tag, and the spec 4.1 step 3 gate (a blank
  // value, a whitespace value, a bare key, an empty list and a missing key).
  { name: "pass-value-equals-constant", expected: [] },
  {
    name: "fail-value-differs-from-constant",
    expected: [message("status", "draft", "published")],
  },
  // The comparison is case-sensitive.
  {
    name: "fail-value-differs-by-letter-case",
    expected: [message("status", "draft", "Draft")],
  },
  // The value is not trimmed (the constant is).
  {
    name: "fail-value-has-trailing-space",
    expected: [message("status", "draft", "draft ")],
  },
  {
    name: "fail-list-value-never-matches",
    expected: [message("status", "draft", `['draft', "it's final"]`)],
  },
  {
    name: "fail-single-item-list-equal-to-constant",
    expected: [message("status", "draft", "['draft']")],
  },
  {
    name: "fail-mapping-value-never-matches",
    expected: [message("status", "draft", "{'state': 'draft'}")],
  },
  // Legacy `re.search`: the first constant tag of a field wins.
  {
    name: "fail-first-constant-tag-wins",
    expected: [message("status", "draft", "final")],
  },
  // `[format:constant:]` is an empty constant no present value equals; the
  // constant text keeps its inner space and colon.
  {
    name: "fail-empty-constant-and-constant-with-space-and-colon",
    expected: [message("empty", "", "anything"), message("note", "draft v2: final", "draft v2")],
  },
];

const read = (path: string): string =>
  readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** Diagnostics of this code, and of the other format codes, for the pair of a fixture folder. */
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
  return {
    own: found.filter((diagnostic) => diagnostic.code === CODE),
    others: found.filter((diagnostic) => OTHER_FORMAT_CODES.includes(diagnostic.code)),
  };
}

describe("MTL301 constant-mismatch", () => {
  it("is registered in category format, error, field step constant", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "constant-mismatch",
      category: "format",
      severity: "error",
      phase: "field",
      step: "constant",
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
      const { own, others } = await lint(testCase);
      expect(own.map((diagnostic) => diagnostic.message)).toEqual(testCase.expected);
      for (const diagnostic of own) {
        expect(diagnostic.severity).toBe("error");
        expect(diagnostic.position).toBeNull();
      }
      expect(others).toEqual([]);
    });
  }
});
