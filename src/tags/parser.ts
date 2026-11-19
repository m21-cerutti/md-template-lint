/**
 * Thin orchestration of the Markdown template parser.
 *
 * Stage 1 lexes the document with the region modes of
 * grammar/MdTemplateLexer.g4 and parses it with grammar/MdTemplateParser.g4.
 * Stage 2 re-lexes each `[word:...` bracket in mode TAG_STRICT, probes its
 * family (tagFamilyEntry) and parses it with the entry rule of its region
 * (fmTagEntry or bodyTagEntry). Tag data comes from the per-family visitors
 * in src/tags/visitors/; this file only merges their results into the typed
 * AST (src/tags/ast.ts) and the findings (region, reason, location, subject).
 * Codes, severities and messages belong to src/rules/ (A9).
 */
import { ParseTreeWalker, ParserRuleContext, Token } from "antlr4ng";
import { MdTemplateLexer } from "../generated/MdTemplateLexer.js";
import {
  BodyBlankLineContext,
  BodyFenceContext,
  BodyHeadingContext,
  BodyHtmlCommentContext,
  BodyListItemContext,
  BodyTableRowContext,
  FmBlankLineContext,
  FmCommentLineContext,
  FmFilenameLineContext,
  FmKeyLineContext,
  FmUniqueNamesLineContext,
  type BodyBlockContext,
  type FrontmatterContext,
  type MdTemplateParser,
} from "../generated/MdTemplateParser.js";
import type {
  BodyBlock,
  BodyTag,
  Directive,
  FilenameComment,
  Frontmatter,
  FrontmatterComment,
  FrontmatterFieldTag,
  FrontmatterFilenameTag,
  FrontmatterInertTag,
  FrontmatterLine,
  FrontmatterOptionalPlacement,
  FrontmatterOptionalTag,
  FrontmatterTag,
  HeadingSuffix,
  MarkdownDocument,
  Region,
  SourcePosition,
  TagFinding,
  TagSubject,
} from "./ast.js";
import { keySubject } from "./key.js";
import { createRecognizers, DiagnosticCollector, parseSll, type GrammarError, type PositionMap, type SyntaxEvent, type SyntaxEventLog } from "./listeners.js";
import { BracketShapeVisitor } from "./visitors/brackets.js";
import { DirectiveVisitor, scanComments } from "./visitors/directive.js";
import { HeadingVisitor, peelHeading, type HeadingItemResult } from "./visitors/heading.js";
import { TypeHintListener } from "./visitors/hints.js";
import { BODY_TAG_VISITORS, FRONTMATTER_TAG_VISITORS } from "./visitors/index.js";

/** 1-based position of the first character of the parsed text in its file. */
export type Origin = SourcePosition;

const DEFAULT_ORIGIN: Origin = { line: 1, column: 1 };

/**
 * A stage-1 syntax error. Stage 1 has a catch-all alternative everywhere, so
 * this means a grammar bug, never a user error: it is thrown, never reported
 * as a finding. `errors` holds every grammar error collected by the lexer and
 * parser error listeners (src/tags/listeners.ts) for that parse.
 */
export class InternalParseError extends Error {
  constructor(
    readonly region: Region,
    readonly position: SourcePosition,
    readonly detail: string,
    readonly errors: readonly GrammarError[] = [],
  ) {
    super(`internal parse error (${region}) at ${position.line}:${position.column}: ${detail}`);
    this.name = "InternalParseError";
  }

  /** The error of the first collected grammar error (throws nothing when `errors` is empty). */
  static of(errors: readonly GrammarError[]): InternalParseError {
    const first = errors[0];
    if (first === undefined) throw new Error("internal: InternalParseError.of needs an error");
    return new InternalParseError(first.region, first.position, first.message, errors);
  }
}

type Finding = Omit<TagFinding, "subject">;
type Resolved<T> = { readonly tag: T } | { readonly finding: Finding };
type Classified<T> = Resolved<T> | null;

const bracketShapes = new BracketShapeVisitor();
const headingParts = new HeadingVisitor();
const directiveParts = new DirectiveVisitor();

/** Spec 1.1: BOM ignored, CRLF and lone CR become LF. Shared with src/engine/load.ts. */
export function normalizeLineEnds(text: string): string {
  const withoutBom = text.startsWith("\uFEFF") ? text.slice(1) : text;
  return withoutBom.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
}

/** One stage-1 parse plus its stage-2 re-parses, all reporting into one collector. */
class ParseSession {
  readonly parser: MdTemplateParser;
  readonly log: SyntaxEventLog;
  readonly collector = new DiagnosticCollector();

  constructor(
    text: string,
    mode: number,
    push: boolean,
    private readonly origin: Origin,
  ) {
    const created = createRecognizers(text, mode, push, (line, column) => this.position(line, column));
    this.parser = created.parser;
    this.log = created.log;
  }

  /** Absolute 1-based position of a 1-based line and 0-based column of the text. */
  position(line: number, column: number): SourcePosition {
    return line === 1 ? { line: this.origin.line, column: this.origin.column + column } : { line: this.origin.line + line - 1, column: column + 1 };
  }

  readonly tokenPosition = (token: Token): SourcePosition => this.position(token.line, token.column);

  /** File line of a parsed rule: every rule of the document grammar has a first token. */
  lineOf(ctx: ParserRuleContext): number {
    return this.tokenPosition(ctx.start as Token).line;
  }

  /** Record the stage-1 events as grammar errors of `entry`. */
  collectStageOne(entry: string, regionOf: (event: SyntaxEvent) => Region): void {
    this.collector.grammarErrors(this.log, entry, regionOf);
  }

  /** Throws InternalParseError on any stage-1 syntax error (a grammar bug, not user input). */
  assertStageOne(entry: string, region: Region): void {
    this.collectStageOne(entry, () => region);
    if (this.collector.errors.length > 0) throw InternalParseError.of(this.collector.errors);
  }

  // --- stage 2 -------------------------------------------------------------

  /** Stage-2 recognizers over one bracket; positions map back into the file. */
  private strict(bracket: ParserRuleContext) {
    const map: PositionMap = (_line, column) => this.innerPosition(bracket, column);
    return createRecognizers(bracket.getText(), MdTemplateLexer.TAG_STRICT, false, map);
  }

  /** Family of a `[word:` candidate, or null when the family is unknown. */
  family(bracket: ParserRuleContext): "filename" | "unique-names" | "frontmatter" | "other" | null {
    const { parser, log } = this.strict(bracket);
    const probe = parser.tagFamilyEntry();
    if (!log.isEmpty) return null;
    const family = probe.tagFamily();
    if (family.FILENAME_CS() !== null) return "filename";
    if (family.FRONTMATTER() !== null) return "frontmatter";
    return family.UNIQUE_HEADINGS_NAMES() !== null ? "unique-names" : "other";
  }

  frontmatterTag(bracket: ParserRuleContext): Resolved<FrontmatterTag> {
    const { parser, log } = this.strict(bracket);
    const body = parser.fmTagEntry().fmTagBody();
    const issue = log.first;
    if (issue !== undefined) return { finding: this.rejected(bracket, "frontmatter", issue) };
    for (const visitor of FRONTMATTER_TAG_VISITORS) {
      const data = visitor.visit(body);
      if (data !== null) return { tag: { ...data, ...this.located(bracket, "frontmatter") } };
    }
    throw new Error(`internal: no frontmatter visitor for ${bracket.getText()}`);
  }

  bodyTag(bracket: ParserRuleContext): Resolved<BodyTag> {
    const { parser, log } = this.strict(bracket);
    const body = parser.bodyTagEntry().bodyTagBody();
    const issue = log.first;
    if (issue !== undefined) return { finding: this.rejected(bracket, "body", issue) };
    for (const visitor of BODY_TAG_VISITORS) {
      const data = visitor.visit(body);
      if (data !== null) return { tag: { ...data, ...this.located(bracket, "body") } };
    }
    throw new Error(`internal: no body visitor for ${bracket.getText()}`);
  }

  private located<R extends Region>(bracket: ParserRuleContext, region: R) {
    return { region, position: this.innerPosition(bracket, 0), raw: bracket.getText() };
  }

  /** Absolute position of column `column` (0-based) inside a one-line bracket. */
  private innerPosition(bracket: ParserRuleContext, column: number): SourcePosition {
    const start = this.tokenPosition(bracket.start as Token);
    return { line: start.line, column: start.column + column };
  }

  /** `wrong-region` when the other region accepts the bracket, else `malformed`. */
  private rejected(bracket: ParserRuleContext, region: Region, issue: SyntaxEvent): Finding {
    const raw = bracket.getText();
    const other = this.strict(bracket);
    if (region === "frontmatter") other.parser.bodyTagEntry();
    else other.parser.fmTagEntry();
    if (other.log.isEmpty) {
      return {
        region,
        reason: "wrong-region",
        tag: raw,
        position: this.innerPosition(bracket, 0),
        offending: raw,
        detail: "",
      };
    }
    return {
      region,
      reason: "malformed",
      tag: raw,
      position: issue.position,
      offending: issue.offending,
      detail: issue.message,
    };
  }

  private unknown(region: Region, ctx: ParserRuleContext): Finding {
    const raw = ctx.getText();
    return {
      region,
      reason: "unknown",
      tag: raw,
      position: this.innerPosition(ctx, 0),
      offending: raw,
      detail: "",
    };
  }

  /** Classify one comment or heading item of `region` (null: nothing to report). */
  classifyFrontmatter(item: ParserRuleContext): Classified<FrontmatterTag> {
    const shape = bracketShapes.visit(item);
    if (shape === null || shape.kind === "inert") return null;
    if (shape.kind === "unknown") return { finding: this.unknown("frontmatter", shape.ctx) };
    if (shape.kind === "bare") {
      // Colon-less tag (spec 2.11) when stage 2 knows the name, else an unknown bracket.
      const result = this.frontmatterTag(shape.ctx);
      return "tag" in result ? result : { finding: this.unknown("frontmatter", shape.ctx) };
    }
    if (this.family(shape.ctx) === null) {
      return shape.shaped ? { finding: this.unknown("frontmatter", shape.ctx) } : null;
    }
    return this.frontmatterTag(shape.ctx);
  }

  classifyBody(item: ParserRuleContext): Classified<BodyTag> {
    const shape = bracketShapes.visit(item);
    if (shape === null || shape.kind === "inert") return null;
    if (shape.kind === "unknown") return { finding: this.unknown("body", shape.ctx) };
    if (shape.kind === "bare") {
      const result = this.bodyTag(shape.ctx);
      return "tag" in result ? result : { finding: this.unknown("body", shape.ctx) };
    }
    if (this.family(shape.ctx) === null) {
      return shape.shaped ? { finding: this.unknown("body", shape.ctx) } : null;
    }
    return this.bodyTag(shape.ctx);
  }

  // --- disable directives (spec 4.4) ---------------------------------------

  /**
   * Stage 2 of one comment content (mode DIRECTIVE): its directive, or null
   * for prose. `start` is the comment start (`<!--` or `#`), `origin` the
   * file position of the first content character. directiveEntry never
   * fails, so an event here is a grammar bug (a GrammarError).
   */
  directive(region: Region, raw: string, start: SourcePosition, content: string, origin: SourcePosition): Directive | null {
    const map: PositionMap = (_line, column) => ({
      line: origin.line,
      column: origin.column + column,
    });
    const { parser, log } = createRecognizers(content, MdTemplateLexer.DIRECTIVE, false, map);
    const entry = parser.directiveEntry();
    this.collector.grammarErrors(log, "directiveEntry", () => region);
    const parts = directiveParts.visit(entry);
    if (parts === null) return null;
    return {
      region,
      line: start.line,
      position: start,
      raw,
      verb: parts.verb,
      word: parts.word,
      items: parts.items.map((token) => ({
        text: token.text ?? "",
        position: map(token.line, token.column),
      })),
      reason: parts.reason,
    };
  }

  /**
   * Body directives (DIR3, DIR4): `source` re-lexed in mode DIRECTIVE_SCAN,
   * lines before `firstLine` (the frontmatter) and in `fenced` skipped.
   */
  bodyDirectives(source: string, firstLine: number, fenced: ReadonlySet<number>): Directive[] {
    const { parser, log } = createRecognizers(source, MdTemplateLexer.DIRECTIVE_SCAN, false, (l, c) => this.position(l, c));
    const tree = parser.directiveScanEntry();
    this.collector.grammarErrors(log, "directiveScanEntry", () => "body");
    const directives: Directive[] = [];
    for (const scanLine of tree.directiveScanLine()) {
      const line = this.lineOf(scanLine);
      if (line < firstLine || fenced.has(line)) continue;
      const tokens: Token[] = [];
      for (const item of scanLine.directiveScanItem()) {
        if (item.start !== null) tokens.push(item.start);
      }
      const text = (from: number, to: number) =>
        tokens
          .slice(from, to)
          .map((token) => token.text ?? "")
          .join("");
      for (const span of scanComments(tokens)) {
        const open = tokens[span.open];
        if (open === undefined) continue;
        const start = this.tokenPosition(open);
        const origin = { line: start.line, column: start.column + (open.text ?? "").length };
        const raw = text(span.open, span.close + 1);
        const content = text(span.open + 1, span.close);
        const directive = this.directive("body", raw, start, content, origin);
        if (directive !== null) directives.push(directive);
      }
    }
    return directives;
  }
}

function withSubject(list: readonly Finding[], subject: TagSubject | null): TagFinding[] {
  return list.map((finding) => ({ ...finding, subject }));
}

// ---------------------------------------------------------------------------
// Frontmatter region
// ---------------------------------------------------------------------------

/** Inline comment items -> field tags, inert filename tags, hints and findings. */
function buildComment(session: ParseSession, items: readonly ParserRuleContext[], position: SourcePosition, subject: TagSubject | null): FrontmatterComment {
  const tags: FrontmatterFieldTag[] = [];
  const inertTags: FrontmatterInertTag[] = [];
  const findings: Finding[] = [];
  const hints = new TypeHintListener(session.tokenPosition);
  for (const item of items) {
    const result = session.classifyFrontmatter(item);
    if (result !== null) {
      if ("finding" in result) findings.push(result.finding);
      else if (result.tag.kind === "filename-case" || result.tag.kind === "unique-names" || result.tag.kind === "frontmatter-optional") {
        inertTags.push(result.tag);
      } else tags.push(result.tag);
    }
    ParseTreeWalker.DEFAULT.walk(hints, item);
  }
  const text = items
    .map((item) => item.getText())
    .join("")
    .trim();
  return {
    text,
    position,
    tags,
    inertTags,
    hints: hints.hints,
    findings: withSubject(findings, subject),
  };
}

interface FilenameResult {
  /** True when the bracket is of the filename family (well-formed or not). */
  readonly isDirective: boolean;
  readonly tag: FrontmatterFilenameTag | null;
  readonly findings: TagFinding[];
}

/** `# [word:...]` candidate on its own line -> directive, malformed finding, or plain comment. */
function buildFilename(session: ParseSession, candidate: ParserRuleContext): FilenameResult {
  if (session.family(candidate) !== "filename") {
    return { isDirective: false, tag: null, findings: [] };
  }
  const result = session.frontmatterTag(candidate);
  if ("finding" in result) {
    return { isDirective: true, tag: null, findings: withSubject([result.finding], null) };
  }
  const tag = result.tag;
  return { isDirective: true, tag: tag.kind === "filename-case" ? tag : null, findings: [] };
}

function lineText(ctx: ParserRuleContext): string {
  const text = ctx.getText();
  return text.endsWith("\n") ? text.slice(0, -1) : text;
}

/** `key: ` or `key:\n` token text (both end with the colon once trimmed) -> key as written. */
function keyText(token: string): string {
  return token.trimEnd().slice(0, -1).trimEnd();
}

/**
 * Frontmatter directive carriers (DIR3): a whole-line comment whose `#` is in
 * column 1 (`hash` is FM_LINE_HASH, `raw` its line) or the trailing comment
 * of a key line (`hash` is FM_COMMENT_HASH, `content` its text). The YAML
 * side (key lines, multi-line values) is checked by src/engine/load.ts.
 */
function frontmatterDirective(session: ParseSession, hash: Token, content: string, wholeLine: boolean): Directive | null {
  const marker = hash.text ?? "#";
  // FM_LINE_HASH and FP_COMMENT include the spaces before `#`.
  const start = session.position(hash.line, hash.column + marker.length - 1);
  if (wholeLine && start.column !== 1) return null;
  const origin = session.position(hash.line, hash.column + marker.length);
  return session.directive("frontmatter", `#${content}`, start, content, origin);
}

function buildFrontmatter(session: ParseSession, ctx: FrontmatterContext, directives: Directive[]): Frontmatter {
  const lines: FrontmatterLine[] = [];
  let filename: FrontmatterFilenameTag | null = null;
  let uniqueHeadingNames = false;
  const optionalTags: FrontmatterOptionalPlacement[] = [];
  let firstOptionalLine: number | null = null;
  const at = (tag: FrontmatterOptionalTag) => ({ line: tag.position.line, column: tag.position.column });
  const collect = (directive: Directive | null) => {
    if (directive !== null) directives.push(directive);
  };
  // Spec 2.1: a standalone comment line reports its UNKNOWN brackets only (known tags are inert
  // there, malformed or wrong-region ones are not reported), subject `Comment line N`.
  const reportUnknown = (line: number, results: readonly Classified<FrontmatterTag>[]) => {
    const unknown = results.flatMap((result) => (result !== null && "finding" in result && result.finding.reason === "unknown" ? [result.finding] : []));
    session.collector.report(withSubject(unknown, { commentLine: line }));
  };
  for (const fmLine of ctx.fmLine()) {
    const line = session.lineOf(fmLine);
    const raw = lineText(fmLine);
    const body = fmLine.getChild(0);
    let isDirective = false;
    if (body instanceof FmFilenameLineContext || body instanceof FmCommentLineContext) {
      const hash = body.FM_LINE_HASH().symbol;
      const directive = frontmatterDirective(session, hash, raw.slice((hash.text ?? "#").length), true);
      collect(directive);
      isDirective = directive !== null;
    }
    const family = body instanceof FmFilenameLineContext ? session.family(body.tagCandidate()) : null;
    if (body instanceof FmFilenameLineContext && family === "unique-names") {
      // `# [unique-headings-names:x]` alone: the template-wide switch with an argument (MTL012).
      const result = session.frontmatterTag(body.tagCandidate());
      session.collector.report("finding" in result ? withSubject([result.finding], null) : []);
      lines.push({ kind: "unique-names", line, raw, tag: null });
    } else if (body instanceof FmFilenameLineContext && family === "frontmatter") {
      // `# [frontmatter:optional]` alone (ADR 0015): the switch; malformed is MTL012.
      const result = session.frontmatterTag(body.tagCandidate());
      session.collector.report("finding" in result ? withSubject([result.finding], null) : []);
      const tag = "tag" in result && result.tag.kind === "frontmatter-optional" ? result.tag : null;
      if (tag !== null) {
        optionalTags.push({ placement: "alone", ...at(tag), subject: { commentLine: line }, firstLine: firstOptionalLine, tag });
        firstOptionalLine ??= line;
      }
      lines.push({ kind: "frontmatter-optional", line, raw, tag });
    } else if (body instanceof FmFilenameLineContext) {
      const result = buildFilename(session, body.tagCandidate());
      session.collector.report(result.findings);
      if (result.isDirective) {
        filename ??= result.tag;
        lines.push({ kind: "filename", line, raw, tag: result.tag });
      } else {
        // `# [x:y]` alone, another family: a plain comment line, an unknown shape is reported.
        if (!isDirective) reportUnknown(line, [session.classifyFrontmatter(body.tagCandidate())]);
        lines.push({ kind: "comment", line, raw });
      }
    } else if (body instanceof FmUniqueNamesLineContext) {
      // `# [word]` alone: the template-wide switch when the word is `unique-headings-names`
      // (spec 2.11), else a plain comment line (an unknown word is reported, `[rule]` and the
      // type names are inert).
      const result = session.classifyFrontmatter(body.tagBareBracket());
      const tag = result !== null && "tag" in result && result.tag.kind === "unique-names" ? result.tag : null;
      uniqueHeadingNames ||= tag !== null;
      if (tag === null) {
        reportUnknown(line, [result]);
        lines.push({ kind: "comment", line, raw });
      } else lines.push({ kind: "unique-names", line, raw, tag });
    } else if (body instanceof FmCommentLineContext) {
      if (!isDirective) {
        const results = body.fmCommentItem().map((item) => session.classifyFrontmatter(item));
        reportUnknown(line, results);
        // ADR 0015: the switch beside other comment text is inert (MTL031 reports it).
        for (const result of results) {
          if (result !== null && "tag" in result && result.tag.kind === "frontmatter-optional") {
            optionalTags.push({ placement: "mixed", ...at(result.tag), subject: { commentLine: line }, tag: result.tag });
          }
        }
      }
      lines.push({ kind: "comment", line, raw });
    } else if (body instanceof FmKeyLineContext) {
      const keyToken = body.FM_KEY() ?? body.FM_KEY_BARE();
      const key = keyText(keyToken?.getText() ?? "");
      const commentCtx = body.fmInlineComment();
      let comment: FrontmatterComment | null = null;
      if (commentCtx !== null) {
        const hash = commentCtx.FM_COMMENT_HASH().symbol;
        const position = session.position(hash.line, hash.column + (hash.text ?? "#").length);
        comment = buildComment(session, commentCtx.fmCommentItem(), position, keySubject(key));
        session.collector.report(comment.findings);
        const content = commentCtx
          .fmCommentItem()
          .map((item) => item.getText())
          .join("");
        collect(frontmatterDirective(session, hash, content, false));
        for (const tag of comment.inertTags) {
          if (tag.kind === "frontmatter-optional") optionalTags.push({ placement: "key", ...at(tag), subject: keySubject(key), tag });
        }
      }
      lines.push({ kind: "key", line, raw, key, comment });
    } else {
      lines.push({ kind: body instanceof FmBlankLineContext ? "blank" : "other", line, raw });
    }
  }
  return {
    startLine: session.lineOf(ctx),
    endLine: session.tokenPosition(ctx.FM_CLOSE().symbol).line,
    yaml: ctx
      .fmLine()
      .map((fmLine) => fmLine.getText())
      .join(""),
    lines,
    filename,
    uniqueHeadingNames,
    frontmatterOptional: firstOptionalLine !== null,
    optionalTags,
  };
}

// ---------------------------------------------------------------------------
// Body region
// ---------------------------------------------------------------------------

function buildHeadingText(session: ParseSession, items: readonly ParserRuleContext[]): HeadingSuffix {
  const peeled = peelHeading(items, (item): HeadingItemResult => session.classifyBody(item));
  return {
    text: peeled.text,
    tags: peeled.tags,
    findings: withSubject(peeled.findings, { heading: peeled.text }),
  };
}

/** Marker of an opening fence line: its backtick or tilde run. */
function fenceMarker(line: string): string {
  const text = line.trimStart();
  const char = text.charAt(0);
  let length = 0;
  while (text.charAt(length) === char) length += 1;
  return text.slice(0, length);
}

function buildBodyBlock(session: ParseSession, block: BodyBlockContext): BodyBlock {
  const body = block.getChild(0);
  const line = session.lineOf(block);
  const raw = lineText(block);
  if (body instanceof BodyHeadingContext) {
    const parts = headingParts.visit(body);
    const level = parts?.level ?? 1;
    const items = parts?.items ?? [];
    const content = items
      .map((item) => item.getText())
      .join("")
      .trim();
    // A heading, `#{1,2}\s+(.+?)`, needs text.
    if (content === "") return { kind: "text", line, raw };
    const heading = buildHeadingText(session, items);
    session.collector.report(heading.findings);
    return { kind: "heading", line, raw, level, text: heading.text, tags: heading.tags };
  }
  if (body instanceof BodyFenceContext) {
    const stop = body.stop;
    return {
      kind: "fence",
      line,
      raw,
      endLine: stop === null ? line : session.tokenPosition(stop).line,
      marker: fenceMarker(body.FENCE_OPEN().getText()),
      closed: body.FENCE_CLOSE() !== null,
    };
  }
  const kind = body instanceof BodyHtmlCommentContext ? "html-comment" : body instanceof BodyTableRowContext ? "table-row" : body instanceof BodyListItemContext ? "list-item" : body instanceof BodyBlankLineContext ? "blank" : "text";
  return { kind, line, raw };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Result of one document parse with every collected error. `document` is
 * null when stage 1 failed: `grammarErrors` then holds the grammar bug (an
 * internal error, never a user diagnostic). Otherwise `findings` holds the
 * tag findings (src/rules/syntax.ts maps them to MTL010 to MTL013; MTL015 and
 * MTL016 are not findings, those rules read the parsed template headings and
 * fields).
 */
export interface DocumentAnalysis {
  readonly document: MarkdownDocument | null;
  readonly grammarErrors: readonly GrammarError[];
  readonly findings: readonly TagFinding[];
}

/** Parse a whole document and return the collected errors instead of throwing. */
export function analyzeDocument(text: string): DocumentAnalysis {
  const normalized = normalizeLineEnds(text);
  // Lexer contract: every line ends with LF (grammar/MdTemplateLexer.g4).
  const source = normalized === "" || normalized.endsWith("\n") ? normalized : `${normalized}\n`;
  const session = new ParseSession(source, MdTemplateLexer.DEFAULT_MODE, false, DEFAULT_ORIGIN);
  // Two-stage parse: SLL first; on any error the session's full LL parse, as before.
  const tree = parseSll(source, MdTemplateLexer.DEFAULT_MODE, false, (parser) => parser.document()) ?? session.parser.document();
  const fmCtx = tree.frontmatter();
  const unclosed = tree.fmUnclosed() !== null;
  const fmEnd = fmCtx?.stop?.line ?? 0;
  session.collectStageOne("document", (event) => (unclosed || event.position.line <= fmEnd ? "frontmatter" : "body"));
  const grammarErrors = session.collector.errors;
  if (grammarErrors.length > 0) return { document: null, grammarErrors, findings: [] };
  const directives: Directive[] = [];
  const frontmatter = fmCtx === null ? null : buildFrontmatter(session, fmCtx, directives);
  const blocks = tree.body()?.bodyBlock() ?? [];
  const body = blocks.map((block) => buildBodyBlock(session, block));
  if (!unclosed) {
    // DIR4: no directive inside a fence (the stage-1 fence modes decide).
    const fenced = new Set<number>();
    for (const block of body) {
      if (block.kind !== "fence") continue;
      for (let line = block.line; line <= block.endLine; line += 1) fenced.add(line);
    }
    const firstLine = frontmatter === null ? 1 : frontmatter.endLine + 1;
    directives.push(...session.bodyDirectives(source, firstLine, fenced));
  }
  if (session.collector.errors.length > 0) {
    return { document: null, grammarErrors: session.collector.errors, findings: [] };
  }
  const findings = session.collector.findings;
  return {
    document: { frontmatter, frontmatterUnclosed: unclosed, body, directives, findings },
    grammarErrors,
    findings,
  };
}

/**
 * Parse a whole Markdown template or target: optional frontmatter (fm* rules)
 * and body (body* rules). YAML values are not interpreted; feed
 * `frontmatter.yaml` to the `yaml` package. Throws InternalParseError on a
 * grammar bug (see analyzeDocument for the non-throwing form).
 */
export function parseDocument(text: string): MarkdownDocument {
  const analysis = analyzeDocument(text);
  if (analysis.document === null) throw InternalParseError.of(analysis.grammarErrors);
  return analysis.document;
}

/**
 * Region helper (not exported by the package): parse the inline comment of a
 * frontmatter key (the text after `#`). Every bracket is checked.
 */
export function parseInlineComment(text: string, origin: Origin = DEFAULT_ORIGIN): FrontmatterComment {
  const session = new ParseSession(normalizeLineEnds(text), MdTemplateLexer.TAG_TEXT, true, origin);
  const tree = session.parser.fmInlineCommentEntry();
  session.assertStageOne("fmInlineCommentEntry", "frontmatter");
  return buildComment(session, tree.fmCommentItem(), origin, null);
}

/**
 * Region helper (not exported by the package): parse the text of a heading of
 * any level, H1 to H6 (after the `#` marks). Body tags are peeled from the right; only the
 * leftover trailing bracket can give a finding.
 */
export function parseHeadingSuffix(text: string, origin: Origin = DEFAULT_ORIGIN): HeadingSuffix {
  const session = new ParseSession(normalizeLineEnds(text), MdTemplateLexer.TAG_TEXT, true, origin);
  const tree = session.parser.bodyHeadingTextEntry();
  session.assertStageOne("bodyHeadingTextEntry", "body");
  return buildHeadingText(session, tree.bodyHeadingItem());
}

/**
 * Region helper (not exported by the package): parse one frontmatter line as
 * the template-wide filename comment `# [filename:case:<convention>]`
 * (spec 2.5). Here a stage-1 syntax error is expected input: it means "not a
 * filename comment" and gives `{ tag: null }` with no finding. A malformed
 * filename tag gives a `malformed` finding.
 */
export function parseFilenameComment(line: string, origin: Origin = DEFAULT_ORIGIN): FilenameComment {
  const session = new ParseSession(`${normalizeLineEnds(line)}\n`, MdTemplateLexer.FM, false, origin);
  const tree = session.parser.fmFilenameLineEntry();
  // Expected input here, not a grammar bug: the events stay in the session log.
  if (!session.log.isEmpty) return { tag: null, findings: [] };
  const result = buildFilename(session, tree.fmFilenameLine().tagCandidate());
  return { tag: result.tag, findings: result.findings };
}
