/**
 * ANTLR error listeners and the shared diagnostic collector of the tag parser
 * (docs/architecture.md, "Listeners and error flow").
 *
 * - LexerErrorListener and ParserErrorListener extend antlr4ng
 *   BaseErrorListener. Both write every `syntaxError` callback, located in the
 *   FILE (through a PositionMap), into one SyntaxEventLog per parse.
 * - DiagnosticCollector is the one sink of a whole document parse: stage-1
 *   syntax events become GrammarError records (a grammar bug, never a user
 *   diagnostic), tag problems become TagFinding records (mapped to MTL010 to
 *   MTL013 by src/rules/syntax.ts).
 *
 * No tag regex here: the grammar (grammar/*.g4) decides what is an error.
 */
import { BailErrorStrategy, BaseErrorListener, CharStream, CommonTokenStream, LexerNoViableAltException, ParseCancellationException, PredictionMode, Token, type ATNSimulator, type RecognitionException, type Recognizer } from "antlr4ng";
import { MdTemplateLexer } from "../generated/MdTemplateLexer.js";
import { MdTemplateParser } from "../generated/MdTemplateParser.js";
import type { Region, SourcePosition, TagFinding } from "./ast.js";

/** Maps a 1-based line and a 0-based column of the parsed text to a file position. */
export type PositionMap = (line: number, column: number) => SourcePosition;

/** One `syntaxError` callback of the lexer or the parser, located in the file. */
export interface SyntaxEvent {
  readonly source: "lexer" | "parser";
  readonly position: SourcePosition;
  /** Offending token (`<EOF>` at the end) or the character the lexer could not match. */
  readonly offending: string;
  /** Offending parser token, null for a lexer error. */
  readonly token: Token | null;
  /** ANTLR message. Not a user message. */
  readonly message: string;
}

/** A stage-1 syntax event: the grammar failed on its catch-all input (a grammar bug). */
export interface GrammarError extends SyntaxEvent {
  readonly region: Region;
  /** Parser entry rule that failed, for example `document`. */
  readonly entry: string;
}

/** Ordered syntax events of one lexer + parser pair. */
export class SyntaxEventLog {
  readonly events: SyntaxEvent[] = [];

  get first(): SyntaxEvent | undefined {
    return this.events[0];
  }

  get isEmpty(): boolean {
    return this.events.length === 0;
  }
}

/** Collects lexer errors (token recognition failures). */
export class LexerErrorListener extends BaseErrorListener {
  constructor(
    private readonly log: SyntaxEventLog,
    private readonly map: PositionMap,
    private readonly input: CharStream,
  ) {
    super();
  }

  override syntaxError<S extends Token, T extends ATNSimulator>(_recognizer: Recognizer<T>, _offendingSymbol: S | null, line: number, column: number, msg: string, e: RecognitionException | null): void {
    const offending = e instanceof LexerNoViableAltException ? this.input.getTextFromRange(e.startIndex, e.startIndex) : "";
    this.log.events.push({
      source: "lexer",
      position: this.map(line, column),
      offending,
      token: null,
      message: msg,
    });
  }
}

/** Collects parser errors (mismatched or missing tokens, no viable alternative). */
export class ParserErrorListener extends BaseErrorListener {
  constructor(
    private readonly log: SyntaxEventLog,
    private readonly map: PositionMap,
  ) {
    super();
  }

  override syntaxError<S extends Token, T extends ATNSimulator>(_recognizer: Recognizer<T>, offendingSymbol: S | null, line: number, column: number, msg: string): void {
    const offending = offendingSymbol === null ? "" : offendingSymbol.type === Token.EOF ? "<EOF>" : (offendingSymbol.text ?? "");
    this.log.events.push({
      source: "parser",
      position: this.map(line, column),
      offending,
      token: offendingSymbol,
      message: msg,
    });
  }
}

/** A lexer and parser over `text` with both error listeners attached. */
export interface Recognizers {
  readonly parser: MdTemplateParser;
  readonly log: SyntaxEventLog;
}

/**
 * Lexer and parser over `text`, starting in lexer mode `mode` (pushed when
 * `push`). The default console listeners are replaced by the collecting ones.
 */
export function createRecognizers(text: string, mode: number, push: boolean, map: PositionMap, log = new SyntaxEventLog()): Recognizers {
  const input = CharStream.fromString(text);
  const lexer = new MdTemplateLexer(input);
  lexer.removeErrorListeners();
  lexer.addErrorListener(new LexerErrorListener(log, map, input));
  if (push) lexer.pushMode(mode);
  else lexer.mode = mode;
  const parser = new MdTemplateParser(new CommonTokenStream(lexer));
  parser.removeErrorListeners();
  parser.addErrorListener(new ParserErrorListener(log, map));
  return { parser, log };
}

/**
 * First stage of ANTLR's two-stage parse: SLL prediction with a bail-out strategy and no
 * listeners. When it finishes with no lexer or parser error, its tree is the one full LL gives
 * (PredictionMode.SLL contract). Null on any error: the caller then parses as usual (full LL,
 * collecting listeners), so every error path and its events stay unchanged.
 */
export function parseSll<T>(text: string, mode: number, push: boolean, entry: (parser: MdTemplateParser) => T): T | null {
  const log = new SyntaxEventLog();
  const { parser } = createRecognizers(text, mode, push, () => ({ line: 0, column: 0 }), log);
  parser.removeErrorListeners();
  parser.errorHandler = new BailErrorStrategy();
  parser.interpreter.predictionMode = PredictionMode.SLL;
  try {
    const tree = entry(parser);
    return log.isEmpty ? tree : null;
  } catch (error) {
    if (error instanceof ParseCancellationException) return null;
    throw error;
  }
}

/** The single sink of one document parse: grammar errors and tag findings. */
export class DiagnosticCollector {
  private readonly grammar: GrammarError[] = [];
  private readonly tagFindings: TagFinding[] = [];

  /** Record the stage-1 events of `log` as grammar errors of `entry`. */
  grammarErrors(log: SyntaxEventLog, entry: string, regionOf: (event: SyntaxEvent) => Region) {
    for (const event of log.events) this.grammar.push({ ...event, region: regionOf(event), entry });
  }

  report(findings: readonly TagFinding[]): void {
    this.tagFindings.push(...findings);
  }

  get errors(): readonly GrammarError[] {
    return this.grammar;
  }

  /** Findings in source order (line, then column; stable). */
  get findings(): readonly TagFinding[] {
    return [...this.tagFindings].sort((a, b) => a.position.line - b.position.line || a.position.column - b.position.column);
  }
}
