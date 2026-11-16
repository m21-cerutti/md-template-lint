/**
 * Field format shape tags parse contract (spec 2.1, 2.7, 2.9, section 9 F1, ADR 0010):
 * `[format:semver]`, `[format:date]`, `[format:elements:semver]` and
 * `[format:elements:date]` on a top-level frontmatter key comment, case-insensitive; a bad
 * shape is malformed (MTL012); on a heading the tag is misplaced (MTL013).
 */
import { describe, expect, it } from "vitest";
import { parseDocument, type BodyHeading } from "../../../src/index.js";
import { parseHeadingSuffix, parseInlineComment } from "../../../src/tags/parser.js";

const doc = (...lines: string[]) => parseDocument(lines.join("\n"));
const headings = (result: ReturnType<typeof parseDocument>): BodyHeading[] => result.body.filter((b): b is BodyHeading => b.kind === "heading");
/** Tags of the comment on the frontmatter line at `index` (0-based, after `---`). */
const keyTags = (result: ReturnType<typeof parseDocument>, index = 0) => {
  const line = result.frontmatter?.lines[index];
  return line?.kind === "key" ? (line.comment?.tags ?? null) : null;
};

describe("format shape tags on a frontmatter key comment", () => {
  it.each([
    ["[format:semver]", "format-shape", "semver"],
    ["[format:date]", "format-shape", "date"],
    ["[format:DATE]", "format-shape", "date"],
    ["[FORMAT:SemVer]", "format-shape", "semver"],
    ["[Format:Date]", "format-shape", "date"],
    ["[format:elements:semver]", "format-elements-shape", "semver"],
    ["[format:elements:date]", "format-elements-shape", "date"],
    ["[format:ELEMENTS:SEMVER]", "format-elements-shape", "semver"],
    ["[Format:Elements:Date]", "format-elements-shape", "date"],
    ["[format:elements:dAtE]", "format-elements-shape", "date"],
  ])("%s gives kind %s with shape %s, located", (tag, kind, shape) => {
    const result = doc("---", "title: x", `v: x # ${tag}`, "---", "# Top");
    expect(result.findings).toEqual([]);
    expect(keyTags(result, 1)).toEqual([
      expect.objectContaining({
        region: "frontmatter",
        kind,
        shape,
        raw: tag,
        position: { line: 3, column: 8 },
      }),
    ]);
  });

  it("counts the column in code points, after a non-BMP character", () => {
    // é (1 code point) : space " 😀 " (3 code points) space # space [ -> column 10.
    const result = doc("---", 'é: "😀" # [format:elements:date]', "---");
    expect(result.findings).toEqual([]);
    expect(keyTags(result)).toMatchObject([{ kind: "format-elements-shape", shape: "date", position: { line: 2, column: 10 } }]);
  });

  it("parses the four forms with parseInlineComment, located from the comment start", () => {
    const { tags, findings } = parseInlineComment("[format:semver] [format:date] [format:elements:semver] [format:elements:date]", { line: 5, column: 3 });
    expect(findings).toEqual([]);
    expect(tags).toMatchObject([
      { kind: "format-shape", shape: "semver", position: { line: 5, column: 3 } },
      { kind: "format-shape", shape: "date", position: { line: 5, column: 19 } },
      { kind: "format-elements-shape", shape: "semver", position: { line: 5, column: 33 } },
      { kind: "format-elements-shape", shape: "date", position: { line: 5, column: 58 } },
    ]);
  });
});

describe("format shape tags with a bad shape are malformed (MTL012)", { tags: ["MTL012", "syntax"] }, () => {
  // The tag opens at column 8; the finding points at the first token that does not fit
  // (spec 2.7): the bad shape after `[format:` (16) or `[format:elements:` (25), the `]`
  // where a shape or `:` is due, the `:` after a complete shape (8 + 23 = 31).
  it.each([
    ["[format:dates]", 16],
    ["[format:semvers]", 16],
    ["[format:elements:semvers]", 25],
    ["[format:elements:dates]", 25],
    ["[format:elements:]", 25],
    ["[format:elements]", 24],
    ["[format:iso-date]", 16],
    ["[format:elements:semver:x]", 31],
  ])("%s on a key comment: malformed at column %i, no tag", (tag, column) => {
    const result = doc("---", `v: x # ${tag}`, "---");
    expect(result.findings).toMatchObject([
      {
        region: "frontmatter",
        reason: "malformed",
        tag,
        position: { line: 2, column },
        subject: { field: "v" },
      },
    ]);
    expect(result.findings).toHaveLength(1);
    expect(keyTags(result)).toEqual([]);
  });

  it("locates a bad shape at its first character", () => {
    const result = parseInlineComment("[format:dates] [format:elements:semvers]", {
      line: 2,
      column: 8,
    });
    expect(result.tags).toEqual([]);
    expect(result.findings).toMatchObject([
      { reason: "malformed", tag: "[format:dates]", position: { line: 2, column: 16 } },
      { reason: "malformed", tag: "[format:elements:semvers]", position: { line: 2, column: 40 } },
    ]);
  });

  it("locates the missing shape at the closing bracket", () => {
    const result = parseInlineComment("[format:elements:] [format:elements]", {
      line: 2,
      column: 8,
    });
    expect(result.tags).toEqual([]);
    expect(result.findings).toMatchObject([
      { reason: "malformed", tag: "[format:elements:]", position: { line: 2, column: 25 } },
      { reason: "malformed", tag: "[format:elements]", position: { line: 2, column: 43 } },
    ]);
  });

  it("keeps a well-formed neighbour of a malformed shape tag", () => {
    const result = doc("---", "v: x # [format:dates] [format:semver]", "---");
    expect(result.findings).toMatchObject([{ reason: "malformed", tag: "[format:dates]" }]);
    expect(keyTags(result)).toMatchObject([{ kind: "format-shape", shape: "semver", position: { line: 2, column: 23 } }]);
  });
});

describe("format shape tags on a heading are misplaced (MTL013)", { tags: ["MTL013", "syntax"] }, () => {
  it.each([
    ["#", "[format:semver]"],
    ["##", "[format:date]"],
    ["###", "[format:elements:semver]"],
    ["####", "[format:DATE]"],
    ["#####", "[format:Elements:SemVer]"],
    ["######", "[format:elements:date]"],
  ])("%s heading with %s: wrong region in the body, no tag", (marks, tag) => {
    const result = doc("---", "title: x", "---", `${marks} Releases ${tag}`);
    expect(result.findings).toMatchObject([
      {
        region: "body",
        reason: "wrong-region",
        tag,
        position: { line: 4, column: marks.length + 11 },
        subject: { heading: `Releases ${tag}` },
      },
    ]);
    expect(result.findings).toHaveLength(1);
    expect(headings(result)).toMatchObject([{ level: marks.length, tags: [] }]);
  });

  it("is wrong region in a heading suffix and keeps the heading tag after it", () => {
    const result = parseHeadingSuffix("Notes [format:semver] [presence:optional]", {
      line: 7,
      column: 4,
    });
    expect(result.text).toBe("Notes [format:semver]");
    expect(result.tags).toMatchObject([{ region: "body", kind: "presence", mode: "optional" }]);
    expect(result.tags).toHaveLength(1);
    expect(result.findings).toMatchObject([
      {
        region: "body",
        reason: "wrong-region",
        tag: "[format:semver]",
        position: { line: 7, column: 10 },
      },
    ]);
  });
});

describe("format shape tags with other tags on one key", () => {
  it.each([
    [
      "[format:snake_case] [format:semver]",
      [
        { kind: "format-case", style: "snake_case", position: { line: 2, column: 8 } },
        { kind: "format-shape", shape: "semver", position: { line: 2, column: 28 } },
      ],
    ],
    [
      "[format:date] [presence:optional]",
      [
        { kind: "format-shape", shape: "date", position: { line: 2, column: 8 } },
        { kind: "presence", mode: "optional", position: { line: 2, column: 22 } },
      ],
    ],
    [
      "[format:elements:kebab-case] [format:elements:date] [count:min:1]",
      [
        { kind: "format-elements", style: "kebab-case", position: { line: 2, column: 8 } },
        { kind: "format-elements-shape", shape: "date", position: { line: 2, column: 37 } },
        { kind: "count", bound: "min", value: 1, position: { line: 2, column: 60 } },
      ],
    ],
    [
      "[format:semver] [format:date]",
      [
        { kind: "format-shape", shape: "semver", position: { line: 2, column: 8 } },
        { kind: "format-shape", shape: "date", position: { line: 2, column: 24 } },
      ],
    ],
  ])("%s keeps every tag in source order", (comment, tags) => {
    const result = doc("---", `v: x # ${comment}`, "---");
    expect(result.findings).toEqual([]);
    expect(keyTags(result)).toMatchObject(tags);
    expect(keyTags(result)).toHaveLength(tags.length);
  });

  it("[format:constant:date] stays a format-constant tag with the value `date`", () => {
    const result = doc("---", "v: x # [format:constant:date]", "---");
    expect(result.findings).toEqual([]);
    expect(keyTags(result)).toMatchObject([{ kind: "format-constant", value: "date", position: { line: 2, column: 8 } }]);
    expect(keyTags(result)).toHaveLength(1);
  });

  it("[format:constant:semver] stays a format-constant tag with the value `semver`", () => {
    const result = doc("---", "v: x # [format:constant:semver]", "---");
    expect(result.findings).toEqual([]);
    expect(keyTags(result)).toMatchObject([{ kind: "format-constant", value: "semver" }]);
    expect(keyTags(result)).toHaveLength(1);
  });

  it("[format:scheme:date] stays a format-scheme tag with the scheme `date`", () => {
    const result = doc("---", "v: x # [format:scheme:date]", "---");
    expect(result.findings).toEqual([]);
    expect(keyTags(result)).toMatchObject([{ kind: "format-scheme", argument: "date", schemes: ["date"] }]);
    expect(keyTags(result)).toHaveLength(1);
  });

  it("[format:scheme:semver,date] stays one format-scheme tag with two schemes", () => {
    const result = doc("---", "v: x # [format:scheme:semver,date]", "---");
    expect(result.findings).toEqual([]);
    expect(keyTags(result)).toMatchObject([{ kind: "format-scheme", schemes: ["semver", "date"] }]);
    expect(keyTags(result)).toHaveLength(1);
  });

  it("a shape word as the value of a neighbour does not leak into a shape tag", () => {
    const result = parseInlineComment("[format:constant:date] [format:date] [format:scheme:semver]");
    expect(result.findings).toEqual([]);
    expect(result.tags).toMatchObject([
      { kind: "format-constant", value: "date" },
      { kind: "format-shape", shape: "date" },
      { kind: "format-scheme", schemes: ["semver"] },
    ]);
    expect(result.tags).toHaveLength(3);
  });

  it("keeps a shape tag written twice twice (first wins is a rule concern, 2.1)", () => {
    const result = doc("---", "v: x # [format:semver] free text [FORMAT:SEMVER]", "---");
    expect(result.findings).toEqual([]);
    expect(keyTags(result)).toMatchObject([
      { kind: "format-shape", shape: "semver", raw: "[format:semver]", position: { column: 8 } },
      { kind: "format-shape", shape: "semver", raw: "[FORMAT:SEMVER]", position: { column: 34 } },
    ]);
  });
});
