/** MTL022 directive-code-not-suppressible (src/rules/syntax.ts, docs/spec.md 4.3, 4.4 DIR6). */
import { describe, expect, it } from "vitest";
import {
  at,
  expectCases,
  expectDirectiveRule,
  findingsOf,
  type Found,
} from "../../helpers/directives.js";

const CODE = "MTL022";
const DIR = "tests/fixtures/pairs/MTL022";

const fixed = (code: string): string => `rule code ${code} cannot be disabled`;

interface TestCase {
  readonly name: string;
  readonly expected: readonly Found[];
}

/** Case -> fixture dir (same name) -> expected result: at least 1 passing case and 1 failing case. */
const CASES: readonly TestCase[] = [
  // The bounds of the suppressible set (MTL101, MTL805) and a whole-file code.
  { name: "pass-suppressible-codes", expected: [] },
  // Parse, template tag, directive and run codes; codes are printed in upper case.
  {
    name: "fail-not-suppressible-codes",
    expected: ["MTL001", "MTL013", "MTL020", "MTL025", "MTL910", "MTL923"].map((code) =>
      at(7, 1, fixed(code)),
    ),
  },
  // A code listed three times (any case) counts once.
  { name: "fail-duplicate-code-once", expected: [at(7, 1, fixed("MTL910"))] },
];

describe("MTL022 directive-code-not-suppressible", () => {
  it("is registered in category syntax, warning, target step directives", () => {
    expectDirectiveRule(CODE, "directive-code-not-suppressible");
  });

  it("has at least 1 pass- case and at least 1 fail- case, one fixture dir each", () => {
    expectCases(DIR, CASES);
  });

  for (const testCase of CASES) {
    it(`${testCase.name}: ${DIR}/${testCase.name}`, async () => {
      expect(await findingsOf(DIR, testCase.name, CODE)).toEqual(testCase.expected);
    });
  }
});
