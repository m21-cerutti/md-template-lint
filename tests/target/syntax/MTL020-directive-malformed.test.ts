/** MTL020 directive-malformed (src/rules/syntax.ts, docs/spec.md 4.3, 4.4 DIR2). */
import { describe, expect, it } from "vitest";
import {
  at,
  expectCases,
  expectDirectiveRule,
  findingsOf,
  type Found,
} from "../../helpers/directives.js";

const CODE = "MTL020";
const DIR = "tests/fixtures/pairs/MTL020";

const EXPECTED =
  "(expected disable, disable-line, disable-next-line, disable-file, begin disable or end disable)";
const unknown = (word: string): string => `unknown directive '${word}' ${EXPECTED}`;
const noCode = (verb: string): string => `'${verb}' needs at least one rule code`;

interface TestCase {
  readonly name: string;
  readonly expected: readonly Found[];
}

/** Case -> fixture dir (same name) -> expected result: at least 1 passing case and 1 failing case. */
const CASES: readonly TestCase[] = [
  // The six verbs with codes, both carriers; a comment that does not start with the keyword.
  { name: "pass-every-verb-valid", expected: [] },
  // A misspelled verb (the word as written, also mixed case), inline after text.
  {
    name: "fail-unknown-verb",
    expected: [at(7, 1, unknown("disabel")), at(8, 6, unknown("Disable-Lines"))],
  },
  // The keyword alone: a frontmatter column-1 comment, a body comment, a reason only.
  {
    name: "fail-keyword-alone",
    expected: [at(3, 1, unknown("")), at(8, 1, unknown("")), at(9, 1, unknown(""))],
  },
  // `begin` / `end` not followed by `disable`: the first word.
  {
    name: "fail-broken-two-word-verb",
    expected: [at(7, 1, unknown("begin")), at(8, 1, unknown("end")), at(9, 1, unknown("begin"))],
  },
  // A verb with no item: canonical lowercase verb; empty items (`,,`) are no items.
  {
    name: "fail-verb-without-code",
    expected: [
      at(3, 1, noCode("disable-file")),
      at(8, 1, noCode("begin disable")),
      at(9, 1, noCode("disable-line")),
      at(10, 1, noCode("end disable")),
      at(11, 1, noCode("disable")),
      at(12, 1, noCode("disable-next-line")),
    ],
  },
];

describe("MTL020 directive-malformed", () => {
  it("is registered in category syntax, warning, target step directives", () => {
    expectDirectiveRule(CODE, "directive-malformed");
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
