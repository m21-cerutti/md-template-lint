/**
 * Defensive branches of src/tags that real input cannot reach (the grammar has a catch-all
 * everywhere and every parsed rule has a first token). Each is driven with a hand-built
 * argument, never with a document:
 *
 * - SyntaxEvent offending text when the lexer gets no LexerNoViableAltException, and when
 *   the parser gets no offending symbol or a symbol without text (src/tags/listeners.ts);
 * - InternalParseError.of with no grammar error (src/tags/parser.ts);
 * - TypeHintListener on a context that has no first token and on a token without text
 *   (src/tags/visitors/hints.ts).
 *
 * One passing case (a normal lexer error keeps its character), then one failing case per branch.
 */
import { CharStream, CommonToken, TerminalNode } from "antlr4ng";
import { describe, expect, it } from "vitest";
import { MdTemplateLexer } from "../../src/generated/MdTemplateLexer.js";
import { TagBareBracketContext, TagTypeEqContext } from "../../src/generated/MdTemplateParser.js";
import {
  LexerErrorListener,
  ParserErrorListener,
  SyntaxEventLog,
  type PositionMap,
} from "../../src/tags/listeners.js";
import { InternalParseError } from "../../src/tags/parser.js";
import { TypeHintListener } from "../../src/tags/visitors/hints.js";

const here: PositionMap = (line, column) => ({ line, column: column + 1 });
/** The recognizer argument is never read by the listeners. */
const NO_RECOGNIZER = undefined as never;

describe("listeners: defensive branches", () => {
  it("passes: a lexer error with its exception keeps the character it could not match", () => {
    const lexer = new MdTemplateLexer(CharStream.fromString("ab\nc]"));
    lexer.pushMode(MdTemplateLexer.TAG_FREE);
    const log = new SyntaxEventLog();
    lexer.removeErrorListeners();
    lexer.addErrorListener(new LexerErrorListener(log, here, CharStream.fromString("ab\nc]")));
    lexer.getAllTokens();
    expect(log.events.map((event) => event.offending)).toEqual(["\n"]);
  });

  it("fails: a lexer error without exception has an empty offending text", () => {
    const log = new SyntaxEventLog();
    const listener = new LexerErrorListener(log, here, CharStream.fromString("x"));
    listener.syntaxError(NO_RECOGNIZER, null, 2, 3, "boom", null);
    expect(log.events).toEqual([
      {
        source: "lexer",
        position: { line: 2, column: 4 },
        offending: "",
        token: null,
        message: "boom",
      },
    ]);
  });

  it("fails: a parser error without offending symbol has an empty offending text", () => {
    const log = new SyntaxEventLog();
    new ParserErrorListener(log, here).syntaxError(NO_RECOGNIZER, null, 1, 0, "boom");
    expect(log.events).toEqual([
      {
        source: "parser",
        position: { line: 1, column: 1 },
        offending: "",
        token: null,
        message: "boom",
      },
    ]);
  });

  it("fails: a parser error on a symbol without text has an empty offending text", () => {
    const log = new SyntaxEventLog();
    const symbol = CommonToken.fromType(MdTemplateLexer.LBRACK);
    expect(symbol.text).toBeUndefined();
    new ParserErrorListener(log, here).syntaxError(NO_RECOGNIZER, symbol, 1, 0, "boom");
    expect(log.events[0]?.offending).toBe("");
    expect(log.events[0]?.token).toBe(symbol);
  });

  it("fails: InternalParseError.of refuses an empty error list", () => {
    expect(() => InternalParseError.of([])).toThrow(
      "internal: InternalParseError.of needs an error",
    );
  });

  it("fails: TypeHintListener ignores type contexts that have no first token", () => {
    const listener = new TypeHintListener(() => ({ line: 1, column: 1 }));
    const typeEq = new TagTypeEqContext(null, 0);
    const bare = new TagBareBracketContext(null, 0);
    expect(typeEq.start).toBeNull();
    expect(bare.start).toBeNull();
    listener.enterTagTypeEq(typeEq);
    listener.enterTagBareBracket(bare);
    expect(listener.hints).toEqual([]);
  });

  it("fails: TypeHintListener keeps an empty raw text for a hint token without text", () => {
    const listener = new TypeHintListener(() => ({ line: 1, column: 1 }));
    const token = CommonToken.fromType(MdTemplateLexer.ISO);
    expect(token.text).toBeUndefined();
    listener.visitTerminal(new TerminalNode(token));
    expect(listener.hints).toEqual([
      { kind: "iso-word", position: { line: 1, column: 1 }, raw: "" },
    ]);
  });
});
