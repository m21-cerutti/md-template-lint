/**
 * Disable directives of the document parser (spec 4.4, DIR2 to DIR4; phase A58, parse only):
 * the six verbs in both carriers, the word at the verb position, the item tokens, the reason,
 * fences and code spans ignored, and the malformed forms that still parse to a node carrying
 * the raw data of MTL020 to MTL022 (rules in A60).
 *
 * Fixture of a case: `tests/fixtures/directives/<name>/document.md`. At least 1 passing case
 * and 1 failing case.
 */
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { fixturePath, expectSplit } from "../../helpers/fixtures.js";
import { loadDocument } from "../../../src/engine/load.js";
import type { Directive } from "../../../src/tags/ast.js";
import { analyzeDocument, parseDocument } from "../../../src/tags/parser.js";

interface Node {
  readonly line: number;
  readonly column: number;
  readonly region: "frontmatter" | "body";
  readonly verb: Directive["verb"];
  readonly word: string;
  readonly items: readonly string[];
  readonly reason: string | null;
}

const node = (line: number, column: number, verb: Directive["verb"], word: string, items: readonly string[], reason: string | null = null, region: Node["region"] = "body"): Node => ({ line, column, region, verb, word, items, reason });

const summary = (directive: Directive): Node => ({
  line: directive.line,
  column: directive.position.column,
  region: directive.region,
  verb: directive.verb,
  word: directive.word,
  items: directive.items.map((item) => item.text),
  reason: directive.reason,
});

const CASES: readonly { readonly name: string; readonly nodes: readonly Node[] }[] = [
  {
    // All six verbs; frontmatter trailing and column-1 comments (an indented `#` line is not a
    // carrier); body comments on their own line, after a heading, two on one line (one with no
    // space after `<!--` and tabs), in a list item and a table row; case-insensitive keyword
    // and verb; comma, space and tab separators with an empty item; a `--` reason.
    name: "pass-every-verb-and-carrier",
    nodes: [
      node(2, 14, "disable-line", "disable-line", ["MTL202"], null, "frontmatter"),
      node(3, 1, "disable-next-line", "disable-next-line", ["MTL202", "MTL301"], null, "frontmatter"),
      node(8, 1, "disable", "disable", ["MTL701"]),
      node(9, 13, "disable-line", "disable-line", ["MTL701"]),
      node(10, 1, "disable-next-line", "disable-next-line", ["MTL201", "MTL202"]),
      node(11, 6, "begin disable", "begin disable", ["MTL703", "MTL704"]),
      node(11, 64, "end disable", "end\tdisable", ["MTL703", "MTL704"]),
      node(12, 1, "disable-file", "Disable-File", ["mtl601", "mtl602"], "filled in later"),
      node(13, 8, "disable-line", "disable-line", ["MTL702"]),
      node(14, 7, "disable-line", "disable-line", ["MTL702"]),
    ],
  },
  {
    // Not read: an HTML comment in the frontmatter, the opening line and the lines of a
    // backtick fence and of a tilde fence (a shorter `~~~` does not close `~~~~`), a code span
    // of one or two backticks. Read: after a code span, after an unmatched backtick, and the
    // directives that follow a prose comment on the same line, left to right.
    name: "pass-ignored-in-fences-and-code-spans",
    nodes: [node(16, 65, "disable-line", "disable-line", ["MTL701"]), node(17, 14, "disable-line", "disable-line", ["MTL702"]), node(18, 15, "disable-line", "disable-line", ["MTL703"]), node(18, 61, "disable-line", "disable-line", ["MTL704"])],
  },
  {
    // Unknown verb, keyword alone, `begin` / `end` without `disable`, verbs without a code,
    // items that are no codes (validated in A60), a reason without a verb, a `--x` item, a
    // second keyword inside one comment (plain items), `begin,disable` (a comma is no verb
    // space), `--,` starting the reason, a misspelled verb. Prose, no node: the keyword not at
    // the start, glued to a word or a comma, and a comment that is not closed on its line.
    // After it: leading commas before the first word are skipped for the MTL020 word (never a
    // verb there, DIR2), and only separators after the keyword give the empty word.
    name: "fail-malformed-directive-forms",
    nodes: [
      node(5, 1, null, "disabel", ["MTL601"]),
      node(6, 1, null, "", []),
      node(7, 1, null, "begin", ["MTL202"]),
      node(8, 1, null, "end", []),
      node(9, 1, "begin disable", "begin disable", []),
      node(10, 1, "disable-file", "disable-file", []),
      node(11, 1, "disable", "disable", ["MTL2O1", "201", "MTL050", "MTL910"]),
      node(12, 1, null, "", [], "only a reason"),
      node(13, 1, "disable-line", "disable-line", ["MTL201", "--x"], ""),
      node(14, 1, "disable-line", "disable-line", ["MTL201", "md-template-lint", "disable", "MTL202"]),
      node(15, 1, null, "begin", ["disable", "MTL202"]),
      node(16, 1, "disable", "disable", ["MTL201"], "MTL202"),
      node(17, 1, null, "disable-lines", ["MTL201"]),
      node(22, 1, null, "MTL201", []),
      node(23, 1, null, "disable", []),
      node(24, 1, null, "", []),
    ],
  },
];

const read = (name: string): string => readFileSync(`${fixturePath("directives", name)}/document.md`, "utf8");

describe("parser: disable directives (spec 4.4)", () => {
  it("has at least 1 pass- case and at least 1 fail- case, one fixture dir each", () => {
    expectSplit("directives", "", CASES);
    for (const testCase of CASES) {
      expect(readdirSync(fixturePath("directives", testCase.name))).toEqual(["document.md"]);
    }
  });

  for (const testCase of CASES) {
    it(`${testCase.name}: tests/fixtures/directives/${testCase.name}`, () => {
      const text = read(testCase.name);
      const analysis = analyzeDocument(text);
      expect(analysis.grammarErrors).toEqual([]);
      expect(analysis.findings).toEqual([]);
      expect(analysis.document?.directives.map(summary)).toEqual(testCase.nodes);
      // The target model keeps every one of them (YAML key and comment lines only).
      const loaded = loadDocument(text);
      expect(loaded.ok && loaded.model.directives.map(summary)).toEqual(testCase.nodes);
    });

    it(`${testCase.name}: CRLF line ends give the same nodes`, () => {
      const crlf = read(testCase.name).replaceAll("\n", "\r\n");
      expect(parseDocument(crlf).directives.map(summary)).toEqual(testCase.nodes);
    });
  }

  it("locates the comment, its raw text and every item in the file", () => {
    const [directive] = parseDocument("---\nk: v\n---\nText <!-- md-template-lint disable MTL201,  mtl202 -- why -->\n").directives;
    expect(directive).toEqual({
      region: "body",
      line: 4,
      position: { line: 4, column: 6 },
      raw: "<!-- md-template-lint disable MTL201,  mtl202 -- why -->",
      verb: "disable",
      word: "disable",
      items: [
        { text: "MTL201", position: { line: 4, column: 36 } },
        { text: "mtl202", position: { line: 4, column: 45 } },
      ],
      reason: "why",
    });
  });

  it("skips leading commas for the MTL020 word: `,MTL201` gives 'MTL201'", () => {
    const [directive] = parseDocument("---\nk: v\n---\n<!-- md-template-lint ,MTL201 -->\n").directives;
    expect(directive).toMatchObject({ verb: null, word: "MTL201", items: [] });
  });

  it("starts the reason at `--,` and drops that one comma", () => {
    const [glued, twoCommas] = parseDocument("---\nk: v\n---\n<!-- md-template-lint disable MTL201 --, kept -->\n" + "<!-- md-template-lint disable MTL201 --,, two -->\n").directives;
    expect(glued).toMatchObject({ verb: "disable", items: [{ text: "MTL201" }], reason: "kept" });
    expect(twoCommas).toMatchObject({ reason: ", two" });
  });

  it("locates a frontmatter comment at its `#`", () => {
    const [trailing, whole] = parseDocument("---\nk: v   # md-template-lint disable-line MTL202\n# md-template-lint disable MTL301\n---\n").directives;
    expect(trailing).toMatchObject({
      region: "frontmatter",
      position: { line: 2, column: 8 },
      raw: "# md-template-lint disable-line MTL202",
      items: [{ text: "MTL202", position: { line: 2, column: 40 } }],
    });
    expect(whole).toMatchObject({
      position: { line: 3, column: 1 },
      raw: "# md-template-lint disable MTL301",
      items: [{ text: "MTL301", position: { line: 3, column: 28 } }],
    });
  });

  it("drops frontmatter comments inside a multi-line flow value", () => {
    const text = ["---", "tags: [a,", "# md-template-lint disable-line MTL202", "  b]", "# md-template-lint disable-line MTL301", "---", ""].join("\n");
    expect(parseDocument(text).directives.map((d) => d.line)).toEqual([3, 5]);
    const loaded = loadDocument(text);
    expect(loaded.ok && loaded.model.directives.map((d) => d.line)).toEqual([5]);
  });

  it("reads no directive in an unclosed frontmatter and none in plain documents", () => {
    expect(parseDocument("---\n<!-- md-template-lint disable MTL201 -->\n").directives).toEqual([]);
    expect(parseDocument("").directives).toEqual([]);
    expect(parseDocument("# Title\n\nText <!-- note -->\n").directives).toEqual([]);
  });
});
