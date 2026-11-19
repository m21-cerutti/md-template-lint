/**
 * The two-stage parse of `analyzeDocument` (src/tags/parser.ts, `parseSll` in src/tags/listeners.ts):
 * SLL with bail-out first, and on any lexer or parser error the plain full-LL parse with the
 * collecting listeners. The fallback must log exactly what a direct plain-LL parse logs.
 *
 * `analyzeDocument` normalizes line ends and ends the source with LF (the lexer contract), and the
 * document grammar then never fails: no text given to it reaches the fallback. So the fallback is
 * tested through `parseSll` itself, on raw text the lexer contract excludes (no final LF, a bare CR),
 * which does fail the document rule; the plain-LL reference is built with `createRecognizers`.
 */
import { describe, expect, it } from "vitest";
import { MdTemplateLexer } from "../../../src/generated/MdTemplateLexer.js";
import { createRecognizers, parseSll, SyntaxEventLog, type SyntaxEvent } from "../../../src/tags/listeners.js";
import { analyzeDocument } from "../../../src/tags/parser.js";
import type { MdTemplateParser } from "../../../src/generated/MdTemplateParser.js";

const MODE = MdTemplateLexer.DEFAULT_MODE;
const position = (line: number, column: number) => ({ line, column });
const document = (parser: MdTemplateParser): string => parser.document().toStringTree(parser);

/** What a direct plain-LL parse of `text` gives: its tree and its error log (the events without their token objects). */
function plainLl(text: string): { readonly tree: string; readonly events: readonly Omit<SyntaxEvent, "token">[] } {
  const log = new SyntaxEventLog();
  const { parser } = createRecognizers(text, MODE, false, position, log);
  const tree = document(parser);
  return { tree, events: log.events.map(({ source, position: at, offending, message }) => ({ source, position: at, offending, message })) };
}

/** Raw texts the document rule rejects (checked below), and some it accepts. */
const FAILING = ["---\n---", "\r", "# h"];
const CLEAN = ["", "---\na: x\n---\n# h\n", "# h [presence:optional]\n", "```\n# in fence\n", "---\na: [\n---\n"];

describe("parseSll: the fallback to the plain LL parse", () => {
  it.each(FAILING)("returns null for %j, whose plain LL parse logs errors", (text) => {
    expect(plainLl(text).events.length).toBeGreaterThan(0);
    expect(parseSll(text, MODE, false, document)).toBeNull();
  });

  it.each(CLEAN)("returns the plain LL tree for %j, whose error log is empty", (text) => {
    const reference = plainLl(text);
    expect(reference.events).toEqual([]);
    expect(parseSll(text, MODE, false, document)).toBe(reference.tree);
  });

  it.each(FAILING)("leaves the plain LL parse of %j with the same errors and positions as before it", (text) => {
    const before = plainLl(text);
    expect(parseSll(text, MODE, false, document)).toBeNull();
    const after = plainLl(text);
    expect(after.events).toEqual(before.events);
    expect(after.tree).toBe(before.tree);
  });

  it("leaves the plain LL parse of every clean text unchanged by an SLL parse of the failing ones", () => {
    const before = CLEAN.map(plainLl);
    for (const text of [...FAILING, ...CLEAN]) parseSll(text, MODE, false, document);
    expect(CLEAN.map(plainLl)).toEqual(before);
  });
});

describe("analyzeDocument: errors of the two-stage parse", () => {
  it("a clean input has an empty error log and no finding", () => {
    const analysis = analyzeDocument("---\na: x\n---\n# h\n");
    expect(analysis.grammarErrors).toEqual([]);
    expect(analysis.findings).toEqual([]);
    expect(analysis.document).not.toBeNull();
  });

  it.each(FAILING)("%j is normalized to the lexer contract: no grammar error, so the fallback is not reached", (text) => {
    const analysis = analyzeDocument(text);
    expect(analysis.grammarErrors).toEqual([]);
    expect(analysis.document).not.toBeNull();
  });
});
