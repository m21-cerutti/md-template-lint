/**
 * MTL010 unknown-field-tag (src/rules/syntax.ts, docs/spec.md 2.7, 4.3, 7.3), via `--verify`.
 * A warning: the template stays ok and `--verify` exits 0. Line and column point at the tag.
 */
import { describe, expect, it } from "vitest";
import { createRegistry } from "../../../src/engine/registry.js";
import { expectTemplateCases, verifyFixture, type VerifyCase } from "../../helpers/verify.js";

const CODE = "MTL010";
const DIR = "tests/fixtures/templates/MTL010";

const warning = (message: string, line: number, column: number, sourceLine: string) =>
  ({ code: CODE, severity: "warning", message, line, column, sourceLine }) as const;

/** Case -> fixture `<name>.md` -> expected `--verify` result. */
const CASES: readonly VerifyCase[] = [
  // Known tags and the inert legacy marker `[rule]` give no warning.
  { name: "pass-known-field-tags", exitCode: 0, status: "ok", diagnostics: [] },
  // An unknown family on a key line.
  {
    name: "fail-unknown-tag-on-key-line",
    exitCode: 0,
    status: "ok",
    diagnostics: [warning("Field 'id': unknown tag [nope:y]", 2, 9, "id: x # [nope:y]")],
  },
  // A typo in a known family is unknown, not malformed.
  {
    name: "fail-misspelled-tag-family",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      warning(
        "Field 'title': unknown tag [presense:required]",
        2,
        19,
        'title: "string" # [presense:required]',
      ),
    ],
  },
  // One warning per unknown tag, in source order.
  {
    name: "fail-unknown-tags-in-source-order",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      warning("Field 'first': unknown tag [alpha]", 2, 12, "first: x # [alpha]"),
      warning("Field 'second': unknown tag [beta:z]", 3, 13, "second: y # [beta:z]"),
    ],
  },
];

describe("MTL010 unknown-field-tag (--verify)", () => {
  it("is registered in category syntax, warning, phase template", () => {
    expect(createRegistry().byCode.get(CODE)).toMatchObject({
      name: "unknown-field-tag",
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
