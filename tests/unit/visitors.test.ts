/**
 * One table per visitor/listener module of src/tags/visitors/ (one tag family
 * each). Owner rule (2026-10-30): at least 1 passing case and 1 failing
 * case per family, one failing case per distinct failure mode. More passing
 * cases of the same families live in tags.test.ts and document.test.ts.
 *
 * A failing case expects a finding reason (`malformed`, `wrong-region`,
 * `unknown`) or `none` (no tag and no finding: the input is not a tag).
 */
import { describe, expect, it } from "vitest";
import type { TagFindingReason } from "../../src/tags/ast.js";
import { parseFilenameComment, parseHeadingSuffix, parseInlineComment } from "../../src/tags/parser.js";

interface Outcome {
  readonly tags: readonly object[];
  readonly findings: readonly { readonly reason: TagFindingReason }[];
}

const fm = (text: string): Outcome => {
  const comment = parseInlineComment(text);
  return { tags: [...comment.tags, ...comment.inertTags], findings: comment.findings };
};
const body = (text: string): Outcome => parseHeadingSuffix(`Heading ${text}`);
const line = (text: string): Outcome => {
  const result = parseFilenameComment(text);
  return { tags: result.tag === null ? [] : [result.tag], findings: result.findings };
};

type Pass = readonly [string, (text: string) => Outcome, string, object];
type Fail = readonly [string, (text: string) => Outcome, string, TagFindingReason | "none"];

function family(name: string, passes: readonly Pass[], fails: readonly Fail[]): void {
  describe(name, () => {
    it.each(passes)("passes: %s", (_label, run, input, expected) => {
      const outcome = run(input);
      expect(outcome.findings).toEqual([]);
      expect(outcome.tags).toMatchObject([expected]);
    });
    it.each(fails)("fails: %s", (_label, run, input, reason) => {
      const outcome = run(input);
      expect(outcome.tags).toEqual([]);
      if (reason === "none") expect(outcome.findings).toEqual([]);
      else expect(outcome.findings.map((f) => f.reason)).toEqual([reason]);
    });
  });
}

family(
  "presence.ts (FrontmatterPresenceVisitor, BodyPresenceVisitor)",
  [["body template-only", body, "[presence:template-only]", { mode: "template-only" }]],
  [
    ["bad argument", fm, "[presence:maybe]", "malformed"],
    ["body-only mode in frontmatter", fm, "[presence:template-only]", "wrong-region"],
    ["dropped exist mode in frontmatter", fm, "[presence:exist]", "malformed"],
    ["dropped exist mode on a heading", body, "[presence:exist]", "malformed"],
    ["empty argument", body, "[presence:]", "malformed"],
    ["unterminated", fm, "[presence:", "malformed"],
    ["space inside", fm, "[presence: optional]", "malformed"],
    ["conditional without colon", body, "[presence:conditional]", "malformed"],
  ],
);

family(
  "format.ts (FormatVisitor)",
  [["scheme list", fm, "[format:scheme:HTTPS,ftp]", { kind: "format-scheme", schemes: ["https", "ftp"] }]],
  [
    ["unknown case style", fm, "[format:camelCase]", "malformed"],
    ["empty scheme list", fm, "[format:scheme:]", "malformed"],
    ["space in scheme list", fm, "[format:scheme:a b]", "malformed"],
    ["empty elements", fm, "[format:elements:]", "malformed"],
    ["constant without colon", fm, "[format:constant]", "malformed"],
    ["on a heading", body, "[format:snake_case]", "wrong-region"],
    ["extra argument", fm, "[format:snake_case:x]", "malformed"],
    ["empty format", fm, "[format:]", "malformed"],
    ["unterminated", fm, "[format:scheme:https", "malformed"],
  ],
);

family(
  "value.ts (ValueVisitor)",
  [["uppercase", fm, "[VALUE:FILENAME]", { kind: "value-filename" }]],
  [
    ["bad argument", fm, "[value:file]", "malformed"],
    ["empty argument", fm, "[value:]", "malformed"],
    ["extra argument", fm, "[value:filename:x]", "malformed"],
    ["on a heading", body, "[value:filename]", "wrong-region"],
    ["bare family word", fm, "[value]", "unknown"],
    ["unterminated", fm, "[value:filename", "malformed"],
  ],
);

family(
  "count.ts (CountVisitor)",
  [["maximum", fm, "[count:max:10]", { kind: "count", bound: "max", value: 10 }]],
  [
    ["negative", fm, "[count:min:-1]", "malformed"],
    ["decimal", fm, "[count:min:1.5]", "malformed"],
    ["bad bound", fm, "[count:avg:1]", "malformed"],
    ["empty number", fm, "[count:min:]", "malformed"],
    ["on a heading", body, "[count:max:3]", "wrong-region"],
    ["space before number", fm, "[count:min: 1]", "malformed"],
  ],
);

family(
  "range.ts (RangeVisitor)",
  [["negative float maximum", fm, "[range:max:-2.5]", { kind: "range", bound: "max", isFloat: true, value: -2.5 }]],
  [
    ["exponent", fm, "[range:min:1e5]", "malformed"],
    ["leading dot", fm, "[range:min:.5]", "malformed"],
    ["trailing dot", fm, "[range:min:1.]", "malformed"],
    ["bad bound", fm, "[range:mid:1]", "malformed"],
    ["on a heading", body, "[range:max:1]", "wrong-region"],
    ["double sign", fm, "[range:max:--1]", "malformed"],
  ],
);

family(
  "order.ts (OrderVisitor)",
  [
    ["mixed case", fm, "[ORDER:Ascending]", { kind: "order-ascending" }],
    // Spec 2.10: on a heading `[order:ascending]` is the body order tag (no longer MTL013).
    ["on a heading", body, "[order:ascending]", { region: "body", kind: "order", direction: "ascending", by: "text" }],
    ["body first date, mixed case", body, "[Order:First:Date:Descending]", { kind: "order", direction: "descending", by: "first-date" }],
  ],
  [
    // Spec 2.10: `[order:descending]` in a frontmatter comment is misplaced (MTL013).
    ["descending", fm, "[order:descending]", "wrong-region"],
    ["first form in frontmatter", fm, "[order:first:number:ascending]", "wrong-region"],
    ["empty argument", fm, "[order:]", "malformed"],
    ["extra argument", fm, "[order:ascending:x]", "malformed"],
    ["bare family word", fm, "[order]", "unknown"],
    ["unterminated", fm, "[order:ascending", "malformed"],
    ["body unknown direction", body, "[order:sideways]", "malformed"],
    ["body first without key", body, "[order:first:number]", "malformed"],
  ],
);

family(
  "pattern.ts (PatternVisitor)",
  [["placeholders and literals", body, '[pattern:"{semver} - {date}"]', { region: "body", kind: "pattern", text: "{semver} - {date}" }]],
  [
    ["no quotes", body, "[pattern:Release]", "malformed"],
    ["unclosed quote", body, '[pattern:"x]', "malformed"],
    ["only quote escaped", body, '[pattern:"x\\"]', "malformed"],
    ["text after the closing quote", body, '[pattern:"x"y]', "malformed"],
    ["in frontmatter", fm, '[pattern:"{semver}"]', "wrong-region"],
  ],
);

family(
  "repeat.ts (RepeatVisitor)",
  [["minimum", body, "[repeat-rules:same-level:min:2]", { region: "body", kind: "repeat", bound: "min", n: 2 }]],
  [
    ["zero minimum", body, "[repeat-rules:same-level:min:0]", "malformed"],
    ["leading zero", body, "[repeat-rules:same-level:min:02]", "malformed"],
    ["max without count", body, "[repeat-rules:same-level:max]", "malformed"],
    ["other level", body, "[repeat-rules:other-level]", "malformed"],
    ["in frontmatter", fm, "[repeat-rules:same-level]", "wrong-region"],
  ],
);

family(
  "io.ts (IoVisitor)",
  [["uppercase", fm, "[IO:EXISTS]", { kind: "io-exists" }]],
  [
    ["exist without s", fm, "[io:exist]", "malformed"],
    ["empty argument", fm, "[io:]", "malformed"],
    ["on a heading", body, "[io:exists]", "wrong-region"],
    ["bare family word", fm, "[io]", "unknown"],
    ["extra argument", fm, "[io:exists:now]", "malformed"],
    ["unterminated", fm, "[io:exists", "malformed"],
  ],
);

family(
  "filename.ts (FilenameVisitor)",
  [["PascalCase line, odd spacing", line, "  #[filename:case:PascalCase] ", { convention: "PascalCase" }]],
  [
    ["capitalized convention", line, "# [filename:case:Snake]", "malformed"],
    ["case-sensitive convention", line, "# [filename:case:pascalcase]", "malformed"],
    ["capitalized keyword", line, "# [filename:Case:snake_case]", "malformed"],
    ["capitalized family", line, "# [Filename:case:snake_case]", "none"],
    ["on a heading", body, "[filename:case:snake_case]", "wrong-region"],
    ["empty convention", line, "# [filename:case:]", "malformed"],
  ],
);

family(
  "content.ts (ContentVisitor)",
  [
    ["max-lines", body, "[content:max-lines:2]", { kind: "content-lines", bound: "max", value: 2 }],
    ["subheadings no-extra", body, "[content:subheadings:no-extra]", { kind: "content", check: "subheadings-no-extra" }],
  ],
  [
    ["no-extra plural", body, "[content:subheadings:no-extras]", "malformed"],
    ["no-extra in frontmatter", fm, "[content:subheadings:no-extra]", "wrong-region"],
    ["non-numeric", body, "[content:max-lines:x]", "malformed"],
    ["plural", body, "[content:tables]", "malformed"],
    ["in frontmatter", fm, "[content:list]", "wrong-region"],
    ["empty number", body, "[content:min-lines:]", "malformed"],
    ["negative", body, "[content:min-lines:-1]", "malformed"],
    ["unterminated", body, "[content:non-empty", "malformed"],
  ],
);

family(
  "unique-names.ts (FrontmatterUniqueNamesVisitor, BodyUniqueNamesVisitor)",
  [
    ["on a heading", body, "[unique-headings-names]", { region: "body", kind: "unique-names" }],
    ["upper case on a heading", body, "[UNIQUE-HEADINGS-NAMES]", { kind: "unique-names" }],
    // Spec 2.11: after a key the tag is well-formed and inert (an inert tag, no finding).
    ["after a key, inert", fm, "[Unique-Headings-Names]", { region: "frontmatter", kind: "unique-names" }],
  ],
  [
    ["argument on a heading", body, "[unique-headings-names:x]", "malformed"],
    ["empty argument on a heading", body, "[unique-headings-names:]", "malformed"],
    ["argument after a key", fm, "[unique-headings-names:x]", "malformed"],
    ["singular typo on a heading", body, "[unique-heading-names]", "unknown"],
    ["singular typo after a key", fm, "[unique-heading-names]", "unknown"],
    ["tag not trailing", (text) => parseHeadingSuffix(`H ${text} tail`), "[unique-headings-names]", "none"],
  ],
);

family(
  "frontmatter.ts (FrontmatterOptionalVisitor)",
  [
    // ADR 0015: after a key the tag is well-formed and inert (an inert tag, no tag finding).
    ["after a key, inert", fm, "[frontmatter:optional]", { region: "frontmatter", kind: "frontmatter-optional" }],
    ["upper case after a key", fm, "[FRONTMATTER:OPTIONAL]", { region: "frontmatter", kind: "frontmatter-optional", raw: "[FRONTMATTER:OPTIONAL]" }],
  ],
  [
    ["argument after a key", fm, "[frontmatter:optional:x]", "malformed"],
    ["required mode", fm, "[frontmatter:required]", "malformed"],
    ["empty argument", fm, "[frontmatter:]", "malformed"],
    ["on a heading", body, "[frontmatter:optional]", "wrong-region"],
    ["family typo", fm, "[frontmater:optional]", "unknown"],
  ],
);

describe("hints.ts (TypeHintListener)", () => {
  const kinds = (text: string) => parseInlineComment(text).hints.map((h) => ("name" in h ? `${h.kind}:${h.name}` : h.kind));
  it.each([["every hint form", "[INT] [Date] YYYY-MM-DD iso lien @gen/", ["bracket:int", "bracket:date", "date-placeholder", "iso-word", "url-word", "alias-marker:gen"]]])("passes: %s", (_label, text, expected) => {
    expect(kinds(text)).toEqual(expected);
  });
  it.each([
    ["removed type=<name> form", "type=int"],
    ["removed type = <name> form, spaced", "Type = INT"],
    ["type= without name", "type="],
    ["colon tag", "[presence:optional]"],
    ["path inside a word", "pathway"],
    ["lowercase date placeholder", "yyyy-mm-dd"],
    ["alias without slash", "@alias"],
  ])("fails: %s", (_label, text) => {
    expect(kinds(text)).toEqual([]);
  });
});

describe("brackets.ts (BracketShapeVisitor)", () => {
  it.each([["rule marker and type token", fm, "[rule] [list-of-path-alias]"]])("passes (inert): %s", (_label, run, text) => {
    expect(run(text).findings).toEqual([]);
  });
  it.each([
    ["unknown family", fm, "[foo:bar]"],
    ["unknown word", fm, "[foo]"],
    ["case-sensitive family", fm, "[Filename:case:snake_case]"],
    ["shape without word colon", fm, "[a-b:c]"],
    ["unknown on a heading", body, "[x]"],
    ["leading colon", fm, "[:x]"],
  ])("fails (unknown): %s", (_label, run, text) => {
    expect(run(text).findings.map((f) => f.reason)).toEqual(["unknown"]);
  });
});

describe("heading.ts (HeadingVisitor, peelHeading)", () => {
  it.each([["two tags and a trailing HTML comment", "Notes [presence:optional] [content:list] <!-- c -->", "Notes", 2]])("passes: %s", (_label, text, expectedText, tagCount) => {
    const result = parseHeadingSuffix(text);
    expect(result.findings).toEqual([]);
    expect(result.text).toBe(expectedText);
    expect(result.tags).toHaveLength(tagCount);
  });
  it.each([
    ["typo", "Notes [presenc:optional]", "unknown"],
    ["frontmatter tag", "Notes [count:min:1]", "wrong-region"],
    ["bad argument", "Notes [content:min-lines:x]", "malformed"],
    ["tag not trailing", "Notes [presence:optional] tail", "none"],
    ["prose bracket", "Notes [a, b]", "none"],
    ["leading tag", "[presence:optional] Notes", "none"],
  ])("fails: %s", (_label, text, reason) => {
    const result = parseHeadingSuffix(text);
    expect(result.tags).toEqual([]);
    if (reason === "none") expect(result.findings).toEqual([]);
    else expect(result.findings.map((f) => f.reason)).toEqual([reason]);
  });
});
