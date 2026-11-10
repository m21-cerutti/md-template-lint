/**
 * MTL012 malformed-tag (src/rules/syntax.ts, docs/spec.md 2.7, 4.3, 7.3), via `--verify`. A
 * known family with a wrong argument. A warning: `--verify` exits 0. Line and column point at the
 * first token that does not fit.
 */
import { describe, expect, it } from "vitest";
import { createRegistry } from "../../../src/engine/registry.js";
import { expectTemplateCases, verifyFixture, type VerifyCase } from "../../helpers/verify.js";

const CODE = "MTL012";
const DIR = "tests/fixtures/templates/MTL012";

const warning = (message: string, line: number, column: number, sourceLine: string) =>
  ({ code: CODE, severity: "warning", message, line, column, sourceLine }) as const;

/** Case -> fixture `<name>.md` -> expected `--verify` result. */
const CASES: readonly VerifyCase[] = [
  // Field, heading and filename tags with valid arguments.
  { name: "pass-well-formed-tags", exitCode: 0, status: "ok", diagnostics: [] },
  // A field tag whose bound is not a number.
  {
    name: "fail-field-tag-bound-not-a-number",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      warning("Field 'n': malformed tag [count:min:abc]", 2, 19, "n: x # [count:min:abc]"),
    ],
  },
  // A heading tag whose bound is not a number.
  {
    name: "fail-heading-tag-bound-not-a-number",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      warning(
        "Heading 'Notes [content:min-lines:x]': malformed tag [content:min-lines:x]",
        4,
        29,
        "## Notes [content:min-lines:x]",
      ),
    ],
  },
  // The filename comment names an unknown case convention.
  {
    name: "fail-filename-comment-unknown-case",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      warning(
        "Filename comment: malformed tag [filename:case:bogus]",
        2,
        18,
        "# [filename:case:bogus]",
      ),
    ],
  },
];

describe("MTL012 malformed-tag (--verify)", () => {
  it("is registered in category syntax, warning, phase template", () => {
    expect(createRegistry().byCode.get(CODE)).toMatchObject({
      name: "malformed-tag",
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
