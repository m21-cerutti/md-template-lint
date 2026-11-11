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

const warning = (message: string, line: number, column: number, sourceLine: string) => ({ code: CODE, severity: "warning", message, line, column, sourceLine }) as const;
/** A malformed heading tag: the bracket stays in the heading text (spec 2.7). */
const heading = (text: string, line: number, column: number, sourceLine: string) => {
  const tag = text.slice(text.indexOf("["));
  return warning(`Heading '${text}': malformed tag ${tag}`, line, column, sourceLine);
};

/** Case -> fixture `<name>.md` -> expected `--verify` result. */
const CASES: readonly VerifyCase[] = [
  // Field, heading and filename tags with valid arguments.
  { name: "pass-well-formed-tags", exitCode: 0, status: "ok", diagnostics: [] },
  // A field tag whose bound is not a number.
  {
    name: "fail-field-tag-bound-not-a-number",
    exitCode: 0,
    status: "ok",
    diagnostics: [warning("Field 'n': malformed tag [count:min:abc]", 2, 19, "n: x # [count:min:abc]")],
  },
  // A heading tag whose bound is not a number.
  {
    name: "fail-heading-tag-bound-not-a-number",
    exitCode: 0,
    status: "ok",
    diagnostics: [warning("Heading 'Notes [content:min-lines:x]': malformed tag [content:min-lines:x]", 4, 29, "## Notes [content:min-lines:x]")],
  },
  // The filename comment names an unknown case convention.
  {
    name: "fail-filename-comment-unknown-case",
    exitCode: 0,
    status: "ok",
    diagnostics: [warning("Filename comment: malformed tag [filename:case:bogus]", 2, 18, "# [filename:case:bogus]")],
  },
  // The four field shape tags, case-insensitive, next to other tags (spec 2.9).
  { name: "pass-format-shape-tags", exitCode: 0, status: "ok", diagnostics: [] },
  // A field shape tag whose shape is not `semver` or `date` (spec 2.9).
  {
    name: "fail-field-format-shape-bad",
    exitCode: 0,
    status: "ok",
    diagnostics: [warning("Field 'v': malformed tag [format:dates]", 2, 16, "v: x # [format:dates]"), warning("Field 'w': malformed tag [format:elements:semvers]", 3, 25, "w: x # [format:elements:semvers]")],
  },
  // The other bad shape forms: column of the first token that does not fit (spec 2.7, 2.9).
  {
    name: "fail-field-format-shape-argument",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      warning("Field 'a': malformed tag [format:semvers]", 2, 16, "a: x # [format:semvers]"),
      warning("Field 'b': malformed tag [format:elements:dates]", 3, 25, "b: x # [format:elements:dates]"),
      warning("Field 'c': malformed tag [format:elements:]", 4, 25, "c: x # [format:elements:]"),
      warning("Field 'd': malformed tag [format:elements]", 5, 24, "d: x # [format:elements]"),
      // Spec 3.2 step A4: the comment holds the word `ISO`, so `e` is a date field, and the
      // malformed tag is no `[format:date]`: MTL016 at column 1 sorts first (spec 2.9).
      {
        code: "MTL016",
        severity: "warning",
        message: "Field 'e' (type=date): no [format:date], default date formats apply",
        line: 6,
        column: 1,
        sourceLine: "e: x # [format:iso-date]",
      },
      warning("Field 'e': malformed tag [format:iso-date]", 6, 16, "e: x # [format:iso-date]"),
      warning("Field 'f': malformed tag [format:elements:semver:x]", 7, 31, "f: x # [format:elements:semver:x]"),
    ],
  },
  // The heading tags of spec 2.10 on H1 to H6, keywords in any case, a `]`, `\"`, `\\` and
  // `{{` inside the quotes (spec 2.10, section 9 "P1 grammar and tags").
  { name: "pass-heading-pattern-repeat-order-tags", exitCode: 0, status: "ok", diagnostics: [] },
  // Pattern tags of a wrong shape (spec 2.10): no quotes, the only quote escaped, text after
  // the closing quote. The bracket stays in the heading text.
  {
    name: "fail-heading-pattern-tag-malformed",
    exitCode: 0,
    status: "ok",
    diagnostics: [heading("R [pattern:Release]", 4, 15, "## R [pattern:Release]"), heading('R [pattern:"x\\"]', 5, 20, '## R [pattern:"x\\"]'), heading('R [pattern:"x"y]', 6, 19, '### R [pattern:"x"y]')],
  },
  // An unclosed quote: the tag ends at the end of the heading (spec 2.10).
  {
    name: "fail-heading-pattern-tag-unclosed-quote",
    exitCode: 0,
    status: "ok",
    diagnostics: [heading('R [pattern:"x]', 4, 18, '## R [pattern:"x]')],
  },
  // Repeat tags of a wrong shape: N is 1 or more without a leading zero, `max` needs N, the
  // level word is `same-level` (spec 2.10).
  {
    name: "fail-heading-repeat-tag-malformed",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      heading("R [repeat-rules:same-level:min:0]", 4, 35, "## R [repeat-rules:same-level:min:0]"),
      heading("R [repeat-rules:same-level:min:02]", 5, 35, "## R [repeat-rules:same-level:min:02]"),
      heading("R [repeat-rules:same-level:max]", 6, 34, "## R [repeat-rules:same-level:max]"),
      heading("R [repeat-rules:other-level]", 7, 22, "#### R [repeat-rules:other-level]"),
    ],
  },
  // Order tags of a wrong shape (spec 2.10): unknown direction, unknown key, `first` without
  // key or direction.
  {
    name: "fail-heading-order-tag-malformed",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      heading("R [order:sideways]", 4, 13, "## R [order:sideways]"),
      heading("R [order:first:version:ascending]", 5, 19, "## R [order:first:version:ascending]"),
      heading("R [order:first]", 6, 18, "## R [order:first]"),
      heading("R [order:first:number]", 7, 29, "###### R [order:first:number]"),
    ],
  },
  // A plural `no-extras` (spec 2.10 section 9): the stray `s` after the keyword `no-extra`.
  {
    name: "fail-heading-content-no-extras",
    exitCode: 0,
    status: "ok",
    diagnostics: [heading("R [content:subheadings:no-extras]", 4, 35, "## R [content:subheadings:no-extras]")],
  },
  // The dropped `[presence:exist]` on a heading (spec 2.6 "Dropped tag"): MTL012, and the
  // bracket stays in the heading text.
  {
    name: "fail-heading-presence-exist-dropped",
    exitCode: 0,
    status: "ok",
    diagnostics: [heading("Intro [presence:exist]", 4, 20, "## Intro [presence:exist]")],
  },
  // Peeling goes from the right (spec 2.6): `[content:non-empty]` is a recognized tag and is
  // peeled first; `[presence:exist]` is malformed, so peeling stops there and the bracket
  // stays in the heading text. One warning, the content tag is not reported.
  {
    name: "fail-heading-presence-exist-before-content-tag",
    exitCode: 0,
    status: "ok",
    diagnostics: [heading("Intro [presence:exist]", 4, 20, "## Intro [presence:exist] [content:non-empty]")],
  },
  // The malformed tag is the RIGHTMOST bracket: peeling stops at once, so the recognized
  // `[content:non-empty]` before it stays in the heading text too (spec 2.6, 2.7). The
  // column is the one of `exist` (the first token that does not fit).
  {
    name: "fail-heading-presence-exist-after-content-tag",
    exitCode: 0,
    status: "ok",
    diagnostics: [warning("Heading 'Intro [content:non-empty] [presence:exist]': malformed tag [presence:exist]", 4, 40, "## Intro [content:non-empty] [presence:exist]")],
  },
  // Keywords are case-insensitive, so `EXIST` is the same dropped word; the tag is printed as
  // written (spec 2, 4.3 `{tag}`).
  {
    name: "fail-heading-presence-exist-uppercase",
    exitCode: 0,
    status: "ok",
    diagnostics: [heading("Intro [presence:EXIST]", 4, 20, "## Intro [presence:EXIST]")],
  },
  // The same tag in a frontmatter comment: MTL012 too, no longer the misplaced MTL013.
  {
    name: "fail-field-presence-exist-dropped",
    exitCode: 0,
    status: "ok",
    diagnostics: [warning("Field 'n': malformed tag [presence:exist]", 2, 18, "n: x # [presence:exist]")],
  },
  // `[unique-headings-names]` in every place of the spec 2.11 placement table that gives no
  // finding: the standalone switch line (twice, any case), a mixed comment line, after a key,
  // on H1 to H6, any case, next to another tag, twice on one heading.
  { name: "pass-unique-headings-names-tags", exitCode: 0, status: "ok", diagnostics: [] },
  // Spec 2.11: the colon-less tag with an argument is malformed anywhere: on the standalone
  // line (reported like the filename line), after a key, on a heading (the bracket stays in
  // the heading text). Column of the `:` (the first token that does not fit).
  {
    name: "fail-unique-headings-names-argument",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      warning("Filename comment: malformed tag [unique-headings-names:x]", 2, 25, "# [unique-headings-names:x]"),
      warning("Field 'n': malformed tag [unique-headings-names:]", 3, 30, "n: x # [unique-headings-names:]"),
      heading("R [unique-headings-names:x]", 5, 28, "## R [unique-headings-names:x]"),
    ],
  },
];

describe("MTL012 malformed-tag (--verify)", { tags: ["MTL012", "syntax"] }, () => {
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
