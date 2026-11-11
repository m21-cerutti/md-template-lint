/** MTL025 directive-already-disabled (src/rules/syntax.ts, docs/spec.md 4.3, 4.4 DIR8). */
import { describe, expect, it } from "vitest";
import { at, expectCases, expectDirectiveRule, findingsOf, type Found } from "../../helpers/directives.js";

const CODE = "MTL025";
const DIR = "tests/fixtures/pairs/MTL025";

const again = (directive: string, code: string, open: number): string => `'${directive} ${code}' while ${code} is already disabled since line ${open}`;

interface TestCase {
  readonly name: string;
  readonly expected: readonly Found[];
}

/** Case -> fixture dir (same name) -> expected result: at least 1 passing case and 1 failing case. */
const CASES: readonly TestCase[] = [
  // Line directives and `disable-file` never conflict with an open range; a closed range
  // may open again; a code listed twice in one `begin disable` opens once.
  { name: "pass-no-nested-range", expected: [] },
  // The first range keeps its start (line 7) for both later openings.
  {
    name: "fail-open-while-open",
    expected: [at(8, 1, again("begin disable", "MTL202", 7)), at(9, 1, again("disable", "MTL202", 7))],
  },
  // A range opened in the frontmatter is still open in the body.
  {
    name: "fail-frontmatter-range-reopened",
    expected: [at(8, 1, again("begin disable", "MTL202", 3))],
  },
];

describe("MTL025 directive-already-disabled", { tags: ["MTL025", "syntax"] }, () => {
  it("is registered in category syntax, warning, target step directives", () => {
    expectDirectiveRule(CODE, "directive-already-disabled");
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
