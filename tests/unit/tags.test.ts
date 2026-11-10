import { describe, expect, it } from "vitest";
import {
  InternalParseError,
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
      { reason: "malformed", tag: "[order:descending]", offending: "descending" },
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
    const result = parseInlineComment("[content:table] [presence:exist]", { line: 2, column: 9 });
    expect(result.tags).toEqual([]);
    expect(result.findings).toMatchObject([
      { reason: "wrong-region", region: "frontmatter", position: { line: 2, column: 9 } },
      { reason: "wrong-region", tag: "[presence:exist]", position: { line: 2, column: 25 } },
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
      "A [presence:required] [presence:exist] [presence:template-only] " +
        "[presence:conditional:x] [content:non-empty] [content:table] [content:list] [content:max-lines:9]",
    );
    expect(result.text).toBe("A");
    expect(result.tags).toHaveLength(8);
    expect(result.findings).toEqual([]);
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

describe("internal parse errors", () => {
  it("carry the region and position of a grammar bug", () => {
    const error = new InternalParseError("frontmatter", { line: 3, column: 2 }, "detail");
    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({ name: "InternalParseError", region: "frontmatter" });
    expect(error.message).toContain("3:2");
  });
});
