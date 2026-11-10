/** MTL023 directive-end-without-begin (src/rules/syntax.ts, docs/spec.md 4.3, 4.4 DIR8). */
import { describe, expect, it } from "vitest";
import {
  at,
  expectCases,
  expectDirectiveRule,
  findingsOf,
  type Found,
} from "../../helpers/directives.js";

const CODE = "MTL023";
const DIR = "tests/fixtures/pairs/MTL023";

const noOpen = (code: string): string =>
  `'end disable ${code}' has no open 'disable' or 'begin disable' for ${code}`;

interface TestCase {
  readonly name: string;
  readonly expected: readonly Found[];
}

/** Case -> fixture dir (same name) -> expected result: at least 1 passing case and 1 failing case. */
const CASES: readonly TestCase[] = [
  // `end disable` closes a `disable` and a `begin disable`; a code listed twice closes once.
  { name: "pass-every-end-closes", expected: [] },
  { name: "fail-end-without-open", expected: [at(7, 1, noOpen("MTL202"))] },
  // `disable-file` opens no range (DIR8, spec 4.4 example 4).
  { name: "fail-end-after-disable-file", expected: [at(8, 1, noOpen("MTL202"))] },
  { name: "fail-end-twice", expected: [at(9, 1, noOpen("MTL202"))] },
  // A frontmatter `begin disable` closed in the body; the other listed code was never open.
  { name: "fail-end-closes-only-listed", expected: [at(8, 1, noOpen("MTL701"))] },
];

describe("MTL023 directive-end-without-begin", () => {
  it("is registered in category syntax, warning, target step directives", () => {
    expectDirectiveRule(CODE, "directive-end-without-begin");
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
