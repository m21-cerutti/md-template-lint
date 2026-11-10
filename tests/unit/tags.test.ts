import { describe, expect, it } from "vitest";
import { loadDocument } from "../../src/engine/load.js";
import type { BodyHeading, FrontmatterLine } from "../../src/tags/ast.js";
import {
  InternalParseError,
  parseDocument,
  parseFilenameComment,
  parseHeadingSuffix,
  parseInlineComment,
} from "../../src/tags/parser.js";

const reasons = (text: string): string[] =>
  parseInlineComment(text).findings.map((f) => `${f.region} ${f.reason} ${f.tag}`);

describe("frontmatter presence tags", () => {
  it("parses required, optional and conditional", () => {
    const { tags, findings } = parseInlineComment(
      "[presence:required] [PRESENCE:Optional] [presence:conditional: only when risky ]",
    );
    expect(findings).toEqual([]);
    expect(tags).toMatchObject([
      { region: "frontmatter", kind: "presence", mode: "required", raw: "[presence:required]" },
      { kind: "presence", mode: "optional" },
      { kind: "presence", mode: "conditional", detail: "only when risky" },
    ]);
  });

  it("reports a bad presence argument as malformed", () => {
    expect(reasons("[presence:maybe]")).toEqual(["frontmatter malformed [presence:maybe]"]);
  });
});

describe("frontmatter value tags", () => {
  it("parses format, value, count, range, order and io tags", () => {
    const { tags, findings } = parseInlineComment(
      "[format:constant: v1 ] [format:snake_case] [format:elements:Kebab-Case] " +
        "[format:scheme:HTTPS,] [value:filename] [count:min:1] [count:max:5] " +
        "[range:min:-2.50] [range:max:007] [order:ascending] [io:exists]",
    );
    expect(findings).toEqual([]);
    expect(tags).toMatchObject([
      { kind: "format-constant", value: "v1" },
      { kind: "format-case", style: "snake_case" },
      { kind: "format-elements", style: "kebab-case" },
      { kind: "format-scheme", argument: "HTTPS,", schemes: ["https"] },
      { kind: "value-filename" },
      { kind: "count", bound: "min", value: 1 },
      { kind: "count", bound: "max", value: 5 },
      { kind: "range", bound: "min", text: "-2.50", isFloat: true, value: -2.5 },
      { kind: "range", bound: "max", text: "007", isFloat: false, value: 7 },
      { kind: "order-ascending" },
      { kind: "io-exists" },
    ]);
  });

  it("parses a scheme list and rejects spaces in it", () => {
    const [tag] = parseInlineComment("[format:scheme:HTTPS,ftp,]").tags;
    expect(tag).toMatchObject({ kind: "format-scheme", schemes: ["https", "ftp"] });
    expect(reasons("[format:scheme:https, ftp]")).toEqual([
      "frontmatter malformed [format:scheme:https, ftp]",
    ]);
  });

  it("reports bad arguments as malformed with line and column", () => {
    const result = parseInlineComment("[count:min:abc] [range:max:1e5] [order:descending]", {
      line: 4,
      column: 20,
    });
    expect(result.tags).toEqual([]);
    expect(result.findings).toMatchObject([
      {
        reason: "malformed",
        tag: "[count:min:abc]",
        offending: "abc",
        position: { line: 4, column: 31 },
      },
      {
        reason: "malformed",
        tag: "[range:max:1e5]",
        offending: "1e5",
        position: { line: 4, column: 47 },
      },
      // Spec 2.10: `[order:descending]` is a heading tag, misplaced in frontmatter (MTL013).
      {
        reason: "wrong-region",
        tag: "[order:descending]",
        offending: "[order:descending]",
        position: { line: 4, column: 52 },
      },
    ]);
  });

  it("reports an unterminated tag as malformed at end of text", () => {
    const [finding] = parseInlineComment("x [presence:").findings;
    expect(finding).toMatchObject({
      reason: "malformed",
      tag: "[presence:",
      offending: "<EOF>",
      position: { line: 1, column: 13 },
    });
  });

  it("reports body-only tags in a comment as wrong region, located", () => {
    const result = parseInlineComment("[content:table] [presence:template-only]", {
      line: 2,
      column: 9,
    });
    expect(result.tags).toEqual([]);
    expect(result.findings).toMatchObject([
      { reason: "wrong-region", region: "frontmatter", position: { line: 2, column: 9 } },
      {
        reason: "wrong-region",
        tag: "[presence:template-only]",
        position: { line: 2, column: 25 },
      },
    ]);
  });

  it("reports the dropped exist presence mode in a comment as malformed (MTL012), not wrong region", () => {
    const result = parseInlineComment("[content:table] [presence:exist]", { line: 2, column: 9 });
    expect(result.tags).toEqual([]);
    expect(result.findings).toMatchObject([
      { reason: "wrong-region", region: "frontmatter", position: { line: 2, column: 9 } },
      {
        reason: "malformed",
        region: "frontmatter",
        tag: "[presence:exist]",
        offending: "exist",
        position: { line: 2, column: 35 },
      },
    ]);
  });
});

describe("unknown and inert brackets in a comment", () => {
  it("reports tag-shaped unknown brackets", () => {
    expect(reasons("[foo:bar] [foo] [Filename:case:snake_case]")).toEqual([
      "frontmatter unknown [foo:bar]",
      "frontmatter unknown [foo]",
      "frontmatter unknown [Filename:case:snake_case]",
    ]);
  });

  it("ignores prose, the rule marker and type tokens", () => {
    expect(reasons("Like ['C++', 'Unity3D'] [rule] [date] [list-of-path-alias]")).toEqual([]);
  });

  it("keeps the filename tag after a key apart, as an inert tag", () => {
    const { tags, inertTags, findings } = parseInlineComment(
      "[presence:optional] [filename:case:snake_case]",
    );
    expect(findings).toEqual([]);
    expect(tags).toMatchObject([{ kind: "presence", mode: "optional" }]);
    expect(inertTags).toMatchObject([{ kind: "filename-case", convention: "snake_case" }]);
  });

  it("locates unknown brackets at the opening bracket", () => {
    const [finding] = parseInlineComment("abc [nope:x]", { line: 2, column: 10 }).findings;
    expect(finding).toMatchObject({
      reason: "unknown",
      tag: "[nope:x]",
      position: { line: 2, column: 14 },
      subject: null,
    });
  });
});

describe("type hints", () => {
  it("collects every hint form in source order", () => {
    const { hints } = parseInlineComment(
      "type = List-Of-Int [Date] YYYY-MM-DD iso url lien path @gen-1/ [path-alias]",
    );
    expect(hints.map((h) => ("name" in h ? `${h.kind}:${h.name}` : h.kind))).toEqual([
      "type-eq:list-of-int",
      "bracket:date",
      "date-placeholder",
      "iso-word",
      "url-word",
      "url-word",
      "path-word",
      "alias-marker:gen-1",
      "bracket:path-alias",
      "path-word",
    ]);
  });

  it("finds YYYY-MM-DD as a case-sensitive substring, like legacy", () => {
    for (const text of ["dateYYYY-MM-DD", "YYYY-MM-DDThh", "x_YYYY-MM-DD_y", "(YYYY-MM-DD)"]) {
      expect(parseInlineComment(text).hints.map((h) => h.kind)).toEqual(["date-placeholder"]);
    }
    expect(parseInlineComment("yyyy-mm-dd YYYY-MM").hints).toEqual([]);
  });

  it("matches the other hint words as whole words only", () => {
    const { hints } = parseInlineComment("urls subtype=int pathway isotope x_url");
    expect(hints).toEqual([]);
  });

  it("does not treat colon tags as type hints", () => {
    expect(parseInlineComment("[presence:optional]").hints).toEqual([]);
  });
});

describe("filename comment", () => {
  it("parses the directive, case-sensitive", () => {
    expect(parseFilenameComment("# [filename:case:camelCase]").tag).toMatchObject({
      kind: "filename-case",
      convention: "camelCase",
    });
    expect(parseFilenameComment("  #[filename:case:PascalCase]  ").tag?.convention).toBe(
      "PascalCase",
    );
  });

  it("reports a bad convention as malformed, located", () => {
    const result = parseFilenameComment("# [filename:case:Snake]", { line: 3, column: 1 });
    expect(result.tag).toBeNull();
    expect(result.findings).toMatchObject([
      {
        reason: "malformed",
        tag: "[filename:case:Snake]",
        offending: "Snake",
        position: { line: 3, column: 18 },
      },
    ]);
  });

  it("ignores other line shapes", () => {
    for (const line of [
      "id: x # [filename:case:snake_case]",
      "# [Filename:case:snake_case]",
      "# [filename:case:snake_case] extra",
      "# [presence:optional]",
      "# plain comment",
    ]) {
      expect(parseFilenameComment(line)).toEqual({ tag: null, findings: [] });
    }
  });
});

describe("heading suffix", () => {
  it("peels recognized body tags right to left", () => {
    const result = parseHeadingSuffix("Overview [x] [presence:optional]  [content:min-lines:3]  ");
    expect(result.text).toBe("Overview [x]");
    expect(result.tags).toMatchObject([
      { region: "body", kind: "presence", mode: "optional" },
      { region: "body", kind: "content-lines", bound: "min", value: 3 },
    ]);
    // The leftover trailing bracket is tag-shaped and unknown (legacy split_heading_tags).
    expect(result.findings).toMatchObject([
      { region: "body", reason: "unknown", tag: "[x]", subject: { heading: "Overview [x]" } },
    ]);
    expect(parseHeadingSuffix("Overview (x) [presence:optional]").findings).toEqual([]);
  });

  it("parses every body tag", () => {
    const result = parseHeadingSuffix(
      "A [presence:required] [presence:template-only] " +
        "[presence:conditional:x] [content:non-empty] [content:table] [content:list] [content:max-lines:9]",
    );
    expect(result.text).toBe("A");
    expect(result.tags).toHaveLength(7);
    expect(result.findings).toEqual([]);
  });

  it("keeps the dropped exist presence mode in the heading text as a malformed tag", () => {
    const result = parseHeadingSuffix("Intro [presence:exist]", { line: 7, column: 4 });
    expect(result.text).toBe("Intro [presence:exist]");
    expect(result.tags).toEqual([]);
    expect(result.findings).toMatchObject([
      { region: "body", reason: "malformed", tag: "[presence:exist]", offending: "exist" },
    ]);
    // Located (spec 2.7): the heading text starts at column 4 of line 7, `Intro ` is 6
    // characters, `[presence:` 10 more, so `exist` (the argument that does not fit) is at 4 + 16.
    expect(result.findings[0]?.position).toEqual({ line: 7, column: 20 });
  });

  it("keeps an unknown trailing bracket in the text", () => {
    const result = parseHeadingSuffix("Notes [presenc:optional]");
    expect(result.text).toBe("Notes [presenc:optional]");
    expect(result.tags).toEqual([]);
    expect(result.findings.map((f) => `${f.reason} ${f.tag}`)).toEqual([
      "unknown [presenc:optional]",
    ]);
  });

  it("reports a malformed trailing tag, located", () => {
    const result = parseHeadingSuffix("Notes [content:min-lines:x]", { line: 7, column: 4 });
    expect(result.text).toBe("Notes [content:min-lines:x]");
    expect(result.findings).toMatchObject([
      {
        region: "body",
        reason: "malformed",
        offending: "x",
        position: { line: 7, column: 29 },
        subject: { heading: "Notes [content:min-lines:x]" },
      },
    ]);
  });

  it("reports a frontmatter-only tag on a heading as wrong region and stops peeling", () => {
    const result = parseHeadingSuffix("Notes [count:min:1] [presence:optional]", {
      line: 5,
      column: 4,
    });
    expect(result.text).toBe("Notes [count:min:1]");
    expect(result.tags).toHaveLength(1);
    expect(result.findings).toMatchObject([
      { reason: "wrong-region", region: "body", position: { line: 5, column: 10 } },
    ]);
  });

  it("drops a trailing HTML comment and ignores prose brackets", () => {
    expect(parseHeadingSuffix("Notes [presence:optional] <!-- [content:x] -->")).toMatchObject({
      text: "Notes",
      tags: [{ mode: "optional" }],
      findings: [],
    });
    expect(parseHeadingSuffix("Use [a, b] here")).toEqual({
      text: "Use [a, b] here",
      tags: [],
      findings: [],
    });
  });
});

/**
 * `[unique-headings-names]` (spec 2.11, ADR 0013): one row of the 2.11 placement table per test,
 * at tag level. The rule MTL613 that reads the switches is phase A80c, not tested here.
 */
describe("unique heading names tag (spec 2.11)", () => {
  const lines = (...text: string[]) => text.join("\n");
  const headingsOf = (text: string): BodyHeading[] =>
    parseDocument(text).body.filter((b): b is BodyHeading => b.kind === "heading");
  /** The findings a load keeps (spec 2.1: key lines, standalone comment lines, the body). */
  const loadedFindings = (text: string) => {
    const result = loadDocument(text);
    if (!result.ok) throw new Error(`load failed: ${result.failure.reason}`);
    return result.model.findings;
  };
  const kinds = (fmLines: readonly FrontmatterLine[] | undefined) =>
    (fmLines ?? []).map((l) => l.kind);

  describe("on a heading (per-heading switch)", () => {
    it("parses at every heading level H1 to H6 and is peeled from the text", () => {
      const text = lines(
        "# One [unique-headings-names]",
        "## Two [unique-headings-names]",
        "### Three [unique-headings-names]",
        "#### Four [unique-headings-names]",
        "##### Five [unique-headings-names]",
        "###### Six [unique-headings-names]",
      );
      const tag = { region: "body", kind: "unique-names", raw: "[unique-headings-names]" };
      expect(headingsOf(text)).toMatchObject([
        { level: 1, text: "One", tags: [tag] },
        { level: 2, text: "Two", tags: [tag] },
        { level: 3, text: "Three", tags: [tag] },
        { level: 4, text: "Four", tags: [tag] },
        { level: 5, text: "Five", tags: [tag] },
        { level: 6, text: "Six", tags: [tag] },
      ]);
      expect(parseDocument(text).findings).toEqual([]);
    });

    it("is case-insensitive and keeps the tag as written in raw", () => {
      for (const written of ["[UNIQUE-HEADINGS-NAMES]", "[Unique-Headings-Names]"]) {
        const result = parseHeadingSuffix(`Notes ${written}`);
        expect(result).toMatchObject({
          text: "Notes",
          tags: [{ region: "body", kind: "unique-names", raw: written }],
          findings: [],
        });
      }
    });

    it("is peeled together with other trailing tags, in any order", () => {
      const after = parseHeadingSuffix(
        'Release [pattern:"[{semver}] - {date}"] [repeat-rules:same-level] [unique-headings-names]',
      );
      expect(after.findings).toEqual([]);
      expect(after.text).toBe("Release");
      expect(after.tags.map((t) => t.kind)).toEqual(["pattern", "repeat", "unique-names"]);
      const before = parseHeadingSuffix("Usage [unique-headings-names] [presence:optional]");
      expect(before.findings).toEqual([]);
      expect(before.text).toBe("Usage");
      expect(before.tags.map((t) => t.kind).sort()).toEqual(["presence", "unique-names"]);
    });

    it("written twice on one heading, both are peeled with no finding", () => {
      const result = parseHeadingSuffix("Notes [unique-headings-names] [unique-headings-names]");
      expect(result.findings).toEqual([]);
      expect(result.text).toBe("Notes");
      // Spec 2.6 peels every recognized trailing tag: both brackets leave the text.
      expect(result.tags).toHaveLength(2);
      expect(result.tags.every((t) => t.kind === "unique-names")).toBe(true);
    });

    it("is not peeled when it is not trailing", () => {
      for (const text of ["Notes [unique-headings-names] tail", "[unique-headings-names] Notes"]) {
        expect(parseHeadingSuffix(text)).toEqual({ text, tags: [], findings: [] });
      }
    });

    it("with an argument is malformed (MTL012) and stays in the heading text", () => {
      for (const written of ["[unique-headings-names:x]", "[unique-headings-names:]"]) {
        const result = parseHeadingSuffix(`Notes ${written}`);
        expect(result.text).toBe(`Notes ${written}`);
        expect(result.tags).toEqual([]);
        expect(result.findings).toMatchObject([
          {
            region: "body",
            reason: "malformed",
            tag: written,
            subject: { heading: `Notes ${written}` },
          },
        ]);
      }
    });

    it("a typo is an unknown tag (MTL011) and stays in the heading text", () => {
      const result = parseHeadingSuffix("Notes [unique-heading-names]");
      expect(result.text).toBe("Notes [unique-heading-names]");
      expect(result.tags).toEqual([]);
      expect(result.findings).toMatchObject([
        { region: "body", reason: "unknown", tag: "[unique-heading-names]" },
      ]);
    });
  });

  describe("in the frontmatter (template-wide switch)", () => {
    it("a standalone comment line holding only the tag sets the switch", () => {
      const text = lines("---", "# [unique-headings-names]", 'title: "string"', "---", "# T");
      const fm = parseDocument(text).frontmatter;
      expect(fm?.uniqueHeadingNames).toBe(true);
      expect(fm?.lines[0]).toMatchObject({
        kind: "unique-names",
        line: 2,
        tag: { region: "frontmatter", kind: "unique-names" },
      });
      expect(loadedFindings(text)).toEqual([]);
    });

    it("is case-insensitive and tolerates the spacing of a comment line", () => {
      for (const written of ["# [UNIQUE-HEADINGS-NAMES]", "#[Unique-Headings-Names]  "]) {
        const fm = parseDocument(lines("---", written, "a: x", "---")).frontmatter;
        expect(fm?.uniqueHeadingNames).toBe(true);
        expect(kinds(fm?.lines)).toEqual(["unique-names", "key"]);
      }
    });

    it("written on two lines counts once, with no finding", () => {
      const text = lines(
        "---",
        "# [unique-headings-names]",
        "a: x",
        "# [unique-headings-names]",
        "---",
      );
      expect(parseDocument(text).frontmatter?.uniqueHeadingNames).toBe(true);
      expect(loadedFindings(text)).toEqual([]);
    });

    it("after a key it is inert: no switch, no field tag, no finding", () => {
      const text = lines("---", 'title: "x" # [unique-headings-names]', "---");
      const fm = parseDocument(text).frontmatter;
      expect(fm?.uniqueHeadingNames).toBe(false);
      expect(fm?.lines[0]).toMatchObject({
        kind: "key",
        comment: { tags: [], inertTags: [{ kind: "unique-names" }], findings: [] },
      });
      expect(loadedFindings(text)).toEqual([]);
    });

    it("on a comment line with other text or tags it is inert and not reported", () => {
      for (const comment of [
        "# note [unique-headings-names]",
        "# [unique-headings-names] note",
        "# [presence:optional] [unique-headings-names]",
      ]) {
        const text = lines("---", comment, "a: x", "---");
        expect(parseDocument(text).frontmatter?.uniqueHeadingNames).toBe(false);
        expect(loadedFindings(text)).toEqual([]);
      }
    });

    it("a standalone line with an argument is malformed (MTL012) and sets no switch", () => {
      for (const written of ["[unique-headings-names:x]", "[unique-headings-names:]"]) {
        const text = lines("---", `# ${written}`, "a: x", "---");
        expect(parseDocument(text).frontmatter?.uniqueHeadingNames).toBe(false);
        expect(loadedFindings(text)).toMatchObject([
          { region: "frontmatter", reason: "malformed", tag: written, position: { line: 2 } },
        ]);
      }
    });

    it("a standalone `# [word]` line of another word is a plain comment: no switch, no finding", () => {
      // Spec 2.11: only the name `unique-headings-names` makes the line the switch; spec 2.1
      // reports field-tag findings on key lines only, so a typo here is silent.
      for (const written of ["# [unique-heading-names]", "# [todo]"]) {
        const text = lines("---", written, "a: x", "---");
        const fm = parseDocument(text).frontmatter;
        expect(fm?.uniqueHeadingNames).toBe(false);
        expect(fm?.lines[0]).toEqual({ kind: "comment", line: 2, raw: written });
        expect(loadedFindings(text)).toEqual([]);
      }
    });

    it("an argument after a key is malformed (MTL012)", () => {
      const text = lines("---", "n: x # [unique-headings-names:x]", "---");
      expect(loadedFindings(text)).toMatchObject([
        { region: "frontmatter", reason: "malformed", subject: { field: "n" } },
      ]);
    });

    it("a typo after a key is an unknown tag (MTL010)", () => {
      const text = lines("---", 'title: "x" # [unique-heading-names]', "---");
      expect(parseDocument(text).frontmatter?.uniqueHeadingNames).toBe(false);
      expect(loadedFindings(text)).toMatchObject([
        {
          region: "frontmatter",
          reason: "unknown",
          tag: "[unique-heading-names]",
          subject: { field: "title" },
        },
      ]);
    });
  });
});

describe("internal parse errors", () => {
  it("carry the region and position of a grammar bug", () => {
    const error = new InternalParseError("frontmatter", { line: 3, column: 2 }, "detail");
    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({ name: "InternalParseError", region: "frontmatter" });
    expect(error.message).toContain("3:2");
  });
});
