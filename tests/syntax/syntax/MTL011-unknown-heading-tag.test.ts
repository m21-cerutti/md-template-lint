/**
 * MTL011 unknown-heading-tag (src/rules/syntax.ts, docs/spec.md 2.7, 4.3, 7.3), via `--verify`.
 * A warning: the template stays ok and `--verify` exits 0. Line and column point at the tag.
 */
import { describe, expect, it } from "vitest";
import { createRegistry } from "../../../src/engine/registry.js";
import { expectTemplateCases, verifyFixture, type VerifyCase } from "../../helpers/verify.js";

const CODE = "MTL011";
const DIR = "tests/fixtures/templates/MTL011";

const warning = (message: string, line: number, column: number) =>
  ({ code: CODE, severity: "warning", message, line, column }) as const;

/** Case -> fixture `<name>.md` -> expected `--verify` result. */
const CASES: readonly VerifyCase[] = [
  // Known heading tags give no warning.
  { name: "pass-known-heading-tags", exitCode: 0, status: "ok", diagnostics: [] },
  // An unknown family on an H2.
  {
    name: "fail-unknown-tag-on-heading",
    exitCode: 0,
    status: "ok",
    diagnostics: [warning("Heading 'Notes [nope:y]': unknown tag [nope:y]", 4, 10)],
  },
  // One warning per heading, in source order (H1 and H2).
  {
    name: "fail-unknown-tags-on-two-headings",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      warning("Heading 'Title [alpha]': unknown tag [alpha]", 4, 9),
      warning("Heading 'Notes [beta:z]': unknown tag [beta:z]", 6, 10),
    ],
  },
];

describe("MTL011 unknown-heading-tag (--verify)", () => {
  it("is registered in category syntax, warning, phase template", () => {
    expect(createRegistry().byCode.get(CODE)).toMatchObject({
      name: "unknown-heading-tag",
      category: "syntax",
      severity: "warning",
      phase: "template",
    });
  });

  it("has at least 1 pass- case and at least 1 fail- case, one fixture file each", () => {
    expectTemplateCases(CODE, CASES);
  });

  for (const { name, ...expected } of CASES) {
    it(`${name}: ${DIR}/${name}.md`, async () => {
      expect(await verifyFixture(CODE, name)).toEqual(expected);
    });
  }
});
