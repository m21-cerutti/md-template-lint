/**
 * The heading tags of docs/spec.md 2.10 (`[pattern:"..."]`, `[repeat-rules:...]`,
 * `[order:...]`) and `[content:subheadings:no-extra]`, through `parseDocument`
 * (section 9 "P1 grammar and tags"): every heading level, case-insensitive
 * keywords, malformed forms (MTL012, spec 2.7), the frontmatter misplacement
 * (MTL013, spec 2.7, 2.10) and the unknown dashed brackets (MTL010, MTL011).
 * Columns are 1-based and count code points.
 */
import { describe, expect, it } from "vitest";
import { parseDocument, type BodyHeading } from "../../src/index.js";

const FM = ["---", "title: x", "---"];
/** Parse a template whose line 4 is `line`. */
const doc = (line: string) => parseDocument([...FM, line].join("\n"));
const heading = (line: string): BodyHeading => {
  const found = doc(line).body.find((block): block is BodyHeading => block.kind === "heading");
  if (found === undefined) throw new Error(`no heading in ${line}`);
  return found;
};

/** Tag as written -> expected AST fields. */
const TAGS: readonly (readonly [string, object])[] = [
  [
    '[pattern:"{semver} - {date}"]',
    {
      kind: "pattern",
      text: "{semver} - {date}",
      pieces: [
        { kind: "placeholder", name: "semver" },
        { kind: "literal", text: " - " },
        { kind: "placeholder", name: "date" },
      ],
    },
  ],
  // A `]` and an escaped quote inside the quotes (escapes resolved in the pieces only).
  ['[pattern:"a]b \\"q\\""]', { kind: "pattern", text: 'a]b \\"q\\"', pieces: [{ kind: "literal", text: 'a]b "q"' }] }],
  ["[repeat-rules:same-level]", { kind: "repeat", bound: "none", n: null }],
  ["[repeat-rules:same-level:min:2]", { kind: "repeat", bound: "min", n: 2 }],
  ["[repeat-rules:same-level:max:3]", { kind: "repeat", bound: "max", n: 3 }],
  ["[repeat-rules:same-level:min:12]", { kind: "repeat", bound: "min", n: 12 }],
  ["[order:ascending]", { kind: "order", direction: "ascending", by: "text" }],
  ["[order:descending]", { kind: "order", direction: "descending", by: "text" }],
  ["[order:first:number:ascending]", { kind: "order", direction: "ascending", by: "first-number" }],
  ["[order:first:number:descending]", { kind: "order", direction: "descending", by: "first-number" }],
  ["[order:first:date:ascending]", { kind: "order", direction: "ascending", by: "first-date" }],
  ["[order:first:date:descending]", { kind: "order", direction: "descending", by: "first-date" }],
  ["[order:first:semver:ascending]", { kind: "order", direction: "ascending", by: "first-semver" }],
  ["[order:first:semver:descending]", { kind: "order", direction: "descending", by: "first-semver" }],
  ["[content:subheadings:no-extra]", { kind: "content", check: "subheadings-no-extra" }],
];

/** Mixed-case spelling of a tag: keywords only (pattern literal text stays as is). */
const mixedCase = (tag: string): string => (tag.startsWith('[pattern:"') ? `[PATTERN:${tag.slice("[pattern:".length)}` : tag.replace(/[a-z]+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1)));

const LEVELS = [1, 2, 3, 4, 5, 6] as const;

describe("2.10 heading tags parse on every level, case-insensitive", () => {
  for (const [tag, fields] of TAGS) {
    for (const spelling of [tag, mixedCase(tag)]) {
      it.each(LEVELS)(`H%i: ${spelling}`, (level) => {
        const marks = "#".repeat(level);
        const result = doc(`${marks} Release ${spelling}`);
        expect(result.findings).toEqual([]);
        const found = heading(`${marks} Release ${spelling}`);
        expect(found).toMatchObject({ level, line: 4, text: "Release" });
        expect(found.tags).toHaveLength(1);
        expect(found.tags[0]).toMatchObject({
          ...fields,
          region: "body",
          raw: spelling,
          // `#` marks, one space, `Release `, then the `[`.
          position: { line: 4, column: level + 1 + "Release ".length + 1 },
        });
      });
    }
  }

  it("parses mixed-case placeholder names in a mixed-case pattern tag", () => {
    expect(heading('## R [Pattern:"{SemVer} - {DATE}"]').tags).toMatchObject([
      {
        kind: "pattern",
        text: "{SemVer} - {DATE}",
        pieces: [
          { kind: "placeholder", name: "semver", raw: "{SemVer}" },
          { kind: "literal", text: " - " },
          { kind: "placeholder", name: "date", raw: "{DATE}" },
        ],
      },
    ]);
  });

  it("peels the changelog heading of worked example 1 (three tags, `]` inside the quotes)", () => {
    const line = '## Release [pattern:"[{semver}] - {date}"] [repeat-rules:same-level] [order:descending]';
    expect(doc(line).findings).toEqual([]);
    expect(heading(line)).toMatchObject({
      text: "Release",
      tags: [
        { kind: "pattern", text: "[{semver}] - {date}", position: { line: 4, column: 12 } },
        { kind: "repeat", bound: "none", position: { line: 4, column: 44 } },
        { kind: "order", direction: "descending", by: "text", position: { line: 4, column: 70 } },
      ],
    });
  });

  it("allows an empty label: a heading made of tags only", () => {
    const found = heading('## [pattern:"{semver}"] [repeat-rules:same-level:max:2]');
    expect(found.text).toBe("");
    expect(found.tags).toMatchObject([
      { kind: "pattern", position: { column: 4 } },
      { kind: "repeat", bound: "max", n: 2, position: { column: 25 } },
    ]);
  });

  it("counts columns in code points", () => {
    // `É` is one code point, the rocket an astral one (two UTF-16 units).
    const found = heading("## \u00C9pique \u{1F680} [order:first:semver:ascending]");
    expect(found.tags).toMatchObject([{ kind: "order", position: { line: 4, column: 13 } }]);
  });
});

describe("2.10 malformed forms are MTL012 (spec 2.7), the bracket stays in the text", { tags: ["MTL012", "syntax"] }, () => {
  // Tag (after `## R `, so the `[` is at column 6) -> column of the offending token.
  it.each([
    ["no quotes", "[pattern:Release]", 15],
    ["unclosed quote", '[pattern:"x]', 18],
    ["only quote escaped", '[pattern:"x\\"]', 20],
    ["text between the closing quote and `]`", '[pattern:"x"y]', 18],
    ["min of 0", "[repeat-rules:same-level:min:0]", 35],
    ["min with a leading zero", "[repeat-rules:same-level:min:02]", 35],
    ["max of 0", "[repeat-rules:same-level:max:0]", 35],
    ["max without count", "[repeat-rules:same-level:max]", 34],
    ["min without count", "[repeat-rules:same-level:min:]", 35],
    ["other level", "[repeat-rules:other-level]", 20],
    ["sideways", "[order:sideways]", 13],
    ["first:version", "[order:first:version:ascending]", 19],
    ["first alone", "[order:first]", 18],
    ["first:number without direction", "[order:first:number]", 25],
    ["last:number", "[order:last:number:ascending]", 13],
    ["first:number:up", "[order:first:number:up]", 26],
    ["extra part", "[order:first:date:descending:x]", 34],
    // The dashed keyword `no-extra` is the longest token, so the stray `s` is the offender.
    ["no-extras", "[content:subheadings:no-extras]", 35],
  ])("%s: %s", (_label, tag, column) => {
    const line = `## R ${tag}`;
    const result = doc(line);
    expect(result.findings).toMatchObject([
      {
        region: "body",
        reason: "malformed",
        tag,
        position: { line: 4, column },
        subject: { heading: `R ${tag}` },
      },
    ]);
    expect(result.findings).toHaveLength(1);
    expect(heading(line)).toMatchObject({ text: `R ${tag}`, tags: [] });
  });
});

describe("2.10 heading tags in a frontmatter comment are MTL013 (spec 2.7)", { tags: ["MTL013", "syntax"] }, () => {
  it.each([
    '[pattern:"{semver}"]',
    '[pattern:"a]b"]',
    "[repeat-rules:same-level]",
    "[repeat-rules:same-level:min:2]",
    "[repeat-rules:same-level:max:3]",
    "[order:descending]",
    "[order:first:number:ascending]",
    "[order:first:number:descending]",
    "[order:first:date:ascending]",
    "[order:first:date:descending]",
    "[order:first:semver:ascending]",
    "[order:first:semver:descending]",
    "[content:subheadings:no-extra]",
    "[ORDER:FIRST:SEMVER:DESCENDING]",
  ])("%s", (tag) => {
    const result = parseDocument(["---", `n: x # ${tag}`, "---", "# T"].join("\n"));
    expect(result.findings).toEqual([
      expect.objectContaining({
        region: "frontmatter",
        reason: "wrong-region",
        tag,
        offending: tag,
        position: { line: 2, column: 8 },
        subject: { field: "n" },
      }),
    ]);
  });

  it("keeps `[order:ascending]` a field tag in frontmatter (MTL407, spec 2.3)", () => {
    const result = parseDocument(["---", "n: x # [order:ascending]", "---", "# T"].join("\n"));
    expect(result.findings).toEqual([]);
    const key = result.frontmatter?.lines.find((line) => line.kind === "key");
    expect(key).toMatchObject({
      comment: { tags: [{ kind: "order-ascending", position: { line: 2, column: 8 } }] },
    });
  });
});

describe("other dashed brackets keep their unknown result (regression)", () => {
  it.each([
    ["heading", "## R [repeat-rule:same-level]", "body", "[repeat-rule:same-level]"],
    ["heading", "## R [same-level]", "body", "[same-level]"],
    ["heading", "## R [no-extra]", "body", "[no-extra]"],
    ["heading", "## R [foo-bar:x-y]", "body", "[foo-bar:x-y]"],
  ])("%s: %s", (_where, line, region, tag) => {
    expect(doc(line).findings).toMatchObject([{ region, reason: "unknown", tag }]);
  });

  it.each(["[repeat-rule:same-level]", "[a-b:c]", "[foo-bar]"])("frontmatter: %s", (tag) => {
    const result = parseDocument(["---", `n: x # ${tag}`, "---", "# T"].join("\n"));
    expect(result.findings).toMatchObject([{ region: "frontmatter", reason: "unknown", tag, position: { line: 2, column: 8 } }]);
  });
});
