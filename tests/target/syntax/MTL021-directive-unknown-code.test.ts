/** MTL021 directive-unknown-code (src/rules/syntax.ts, docs/spec.md 4.3, 4.4 DIR2). */
import { describe, expect, it } from "vitest";
import {
  at,
  expectCases,
  expectDirectiveRule,
  findingsOf,
  type Found,
} from "../../helpers/directives.js";

const CODE = "MTL021";
const DIR = "tests/fixtures/pairs/MTL021";

const unknown = (token: string): string => `unknown rule code '${token}'`;

interface TestCase {
  readonly name: string;
  readonly expected: readonly Found[];
}

/** Case -> fixture dir (same name) -> expected result: at least 1 passing case and 1 failing case. */
const CASES: readonly TestCase[] = [
  // Codes of the 4.3 tables in any case and separator mix; a token inside the reason is text.
  { name: "pass-known-codes", expected: [] },
  // Not `MTL` and three digits, or not a code of the tables; frontmatter trailing comment first.
  {
    name: "fail-unknown-tokens",
    expected: [
      at(2, 14, unknown("MTL999")),
      at(7, 1, unknown("MTL2O1")),
      at(7, 1, unknown("201")),
      at(7, 1, unknown("MTL050")),
      at(7, 1, unknown("MTL1234")),
    ],
  },
  // `--x` is a word, not the reason marker.
  { name: "fail-glued-reason-marker", expected: [at(7, 1, unknown("--x"))] },
  // The same token three times (any case) counts once, as written the first time.
  { name: "fail-duplicate-token-once", expected: [at(7, 1, unknown("MTL2O1"))] },
];

describe("MTL021 directive-unknown-code", () => {
  it("is registered in category syntax, warning, target step directives", () => {
    expectDirectiveRule(CODE, "directive-unknown-code");
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
