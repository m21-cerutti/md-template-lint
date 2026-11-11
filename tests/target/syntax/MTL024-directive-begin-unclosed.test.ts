/** MTL024 directive-begin-unclosed (src/rules/syntax.ts, docs/spec.md 4.3, 4.4 DIR8). */
import { describe, expect, it } from "vitest";
import { at, expectCases, expectDirectiveRule, findingsOf, type Found } from "../../helpers/directives.js";

const CODE = "MTL024";
const DIR = "tests/fixtures/pairs/MTL024";

const unclosed = (code: string): string => `'begin disable ${code}' is never closed, it runs to the end of the file`;

interface TestCase {
  readonly name: string;
  readonly expected: readonly Found[];
}

/** Case -> fixture dir (same name) -> expected result: at least 1 passing case and 1 failing case. */
const CASES: readonly TestCase[] = [
  // An open `disable` at the end of the file is the normal use; `disable-file` opens nothing.
  { name: "pass-disable-left-open", expected: [] },
  // One per open code, in the code order of the directive.
  {
    name: "fail-begin-unclosed",
    expected: [at(7, 1, unclosed("MTL202")), at(7, 1, unclosed("MTL301"))],
  },
  // Ordered by the position of the `begin disable` (line, then column); a code closed and
  // opened again reports the second opening.
  {
    name: "fail-ordered-by-begin-position",
    expected: [at(3, 1, unclosed("MTL701")), at(8, 1, unclosed("MTL703")), at(8, 48, unclosed("MTL702")), at(11, 1, unclosed("MTL202"))],
  },
];

describe("MTL024 directive-begin-unclosed", { tags: ["MTL024", "syntax"] }, () => {
  it("is registered in category syntax, warning, target step directives", () => {
    expectDirectiveRule(CODE, "directive-begin-unclosed");
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
