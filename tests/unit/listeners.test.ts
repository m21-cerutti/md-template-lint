/**
 * Collecting ANTLR listeners and the DiagnosticCollector (src/tags/listeners.ts).
 * Fixture table: one passing case (clean input), one failing case per
 * listener outcome: lexer error, parser error, wrong-region, malformed, unknown.
 */
import { describe, expect, it } from "vitest";
import { MdTemplateLexer } from "../../src/generated/MdTemplateLexer.js";
import {
  createRecognizers,
  DiagnosticCollector,
  type PositionMap,
} from "../../src/tags/listeners.js";
import { analyzeDocument, InternalParseError } from "../../src/tags/parser.js";

/** Text line 1 starts at file line 10, column 5 (as for a bracket inside a file). */
const offset: PositionMap = (line, column) =>
  line === 1 ? { line: 10, column: 5 + column } : { line: 9 + line, column: column + 1 };

const findingsOf = (...lines: string[]) =>
  analyzeDocument(lines.join("\n")).findings.map((f) => ({
    region: f.region,
    reason: f.reason,
    tag: f.tag,
    offending: f.offending,
    line: f.position.line,
    column: f.position.column,
  }));

describe("listeners: fixture table", () => {
  it("passes: clean input collects no grammar error and no finding", () => {
    const analysis = analyzeDocument(
      "---\nid: x # [presence:optional] [date]\n---\n## Notes [content:list]\n",
    );
    expect(analysis.grammarErrors).toEqual([]);
    expect(analysis.findings).toEqual([]);
    expect(analysis.document).not.toBeNull();
  });

  it("fails: a lexer error is collected with its mapped location", () => {
    // TAG_FREE has no rule for a newline: a token recognition error.
    const { parser, log } = createRecognizers("ab\nc]", MdTemplateLexer.TAG_FREE, false, offset);
    parser.tagFreeText();
    const lexerEvents = log.events.filter((event) => event.source === "lexer");
    expect(lexerEvents).toHaveLength(1);
    expect(lexerEvents[0]).toMatchObject({
      source: "lexer",
      offending: "\n",
      token: null,
      position: { line: 10, column: 7 },
    });
    expect(lexerEvents[0]?.message).toContain("token recognition error");
  });

  it("fails: a parser error is collected and becomes a grammar error", () => {
    const { parser, log } = createRecognizers("# plain\n", MdTemplateLexer.FM, false, offset);
    parser.fmFilenameLineEntry();
    expect(log.first).toMatchObject({ source: "parser", position: { line: 10, column: 7 } });
    expect(log.first?.offending).toBe("plain");
    const collector = new DiagnosticCollector();
    collector.grammarErrors(log, "fmFilenameLineEntry", () => "frontmatter");
    expect(collector.errors[0]).toMatchObject({
      region: "frontmatter",
      entry: "fmFilenameLineEntry",
    });
    const error = InternalParseError.of(collector.errors);
    expect(error).toMatchObject({ region: "frontmatter", position: { line: 10, column: 7 } });
    expect(error.errors).toHaveLength(collector.errors.length);
  });

  it("fails: wrong-region tags are located at the bracket", () => {
    expect(findingsOf("---", "n: x # [content:table]", "---", "## Notes [count:min:1]")).toEqual([
      {
        region: "frontmatter",
        reason: "wrong-region",
        tag: "[content:table]",
        offending: "[content:table]",
        line: 2,
        column: 8,
      },
      {
        region: "body",
        reason: "wrong-region",
        tag: "[count:min:1]",
        offending: "[count:min:1]",
        line: 4,
        column: 10,
      },
    ]);
  });

  it("fails: a malformed tag is located at the offending token inside the bracket", () => {
    expect(findingsOf("---", "n: x # [count:min:abc]", "---", "# T [presence:")).toEqual([
      {
        region: "frontmatter",
        reason: "malformed",
        tag: "[count:min:abc]",
        offending: "abc",
        line: 2,
        column: 19,
      },
      {
        region: "body",
        reason: "malformed",
        tag: "[presence:",
        offending: "<EOF>",
        line: 4,
        column: 15,
      },
    ]);
  });

  it("fails: an unknown tag is located at the bracket", () => {
    expect(findingsOf("---", "n: x # [nope:y] [foo]", "---", "## A [zzz]")).toEqual([
      {
        region: "frontmatter",
        reason: "unknown",
        tag: "[nope:y]",
        offending: "[nope:y]",
        line: 2,
        column: 8,
      },
      {
        region: "frontmatter",
        reason: "unknown",
        tag: "[foo]",
        offending: "[foo]",
        line: 2,
        column: 17,
      },
      { region: "body", reason: "unknown", tag: "[zzz]", offending: "[zzz]", line: 4, column: 6 },
    ]);
  });
});
