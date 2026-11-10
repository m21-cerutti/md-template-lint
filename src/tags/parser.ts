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
  type BodyBlockContext,
  type FrontmatterContext,
  type MdTemplateParser,
} from "../generated/MdTemplateParser.js";
import type {
  BodyBlock,
  BodyTag,
  FilenameComment,
  Frontmatter,
  FrontmatterComment,
  FrontmatterFieldTag,
  FrontmatterFilenameTag,
  FrontmatterLine,
  FrontmatterTag,
  HeadingSuffix,
  MarkdownDocument,
  Region,
  SourcePosition,
  TagFinding,
  TagSubject,
} from "./ast.js";
import { keySubject } from "./key.js";
import {
  createRecognizers,
  DiagnosticCollector,
  type GrammarError,
  type PositionMap,
  type SyntaxEvent,
  type SyntaxEventLog,
} from "./listeners.js";
import { BracketShapeVisitor } from "./visitors/brackets.js";
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
    const created = createRecognizers(text, mode, push, (line, column) =>
      this.position(line, column),
    );
    this.parser = created.parser;
    this.log = created.log;
  }

  /** Absolute 1-based position of a 1-based line and 0-based column of the text. */
  position(line: number, column: number): SourcePosition {
    return line === 1
      ? { line: this.origin.line, column: this.origin.column + column }
      : { line: this.origin.line + line - 1, column: column + 1 };
  }

  readonly tokenPosition = (token: Token): SourcePosition =>
    this.position(token.line, token.column);

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
  family(bracket: ParserRuleContext): "filename" | "other" | null {
    const { parser, log } = this.strict(bracket);
    const probe = parser.tagFamilyEntry();
    if (!log.isEmpty) return null;
    return probe.tagFamily().FILENAME_CS() !== null ? "filename" : "other";
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
    if (this.family(shape.ctx) === null) {
      return shape.shaped ? { finding: this.unknown("frontmatter", shape.ctx) } : null;
    }
    return this.frontmatterTag(shape.ctx);
  }

  classifyBody(item: ParserRuleContext): Classified<BodyTag> {
    const shape = bracketShapes.visit(item);
    if (shape === null || shape.kind === "inert") return null;
    if (shape.kind === "unknown") return { finding: this.unknown("body", shape.ctx) };
    if (this.family(shape.ctx) === null) {
      return shape.shaped ? { finding: this.unknown("body", shape.ctx) } : null;
    }
    return this.bodyTag(shape.ctx);
  }
}

function withSubject(list: readonly Finding[], subject: TagSubject | null): TagFinding[] {
  return list.map((finding) => ({ ...finding, subject }));
}

// ---------------------------------------------------------------------------
// Frontmatter region
// ---------------------------------------------------------------------------

/** Inline comment items -> field tags, inert filename tags, hints and findings. */
function buildComment(
  session: ParseSession,
  items: readonly ParserRuleContext[],
  position: SourcePosition,
  subject: TagSubject | null,
): FrontmatterComment {
  const tags: FrontmatterFieldTag[] = [];
  const inertTags: FrontmatterFilenameTag[] = [];
  const findings: Finding[] = [];
  const hints = new TypeHintListener(session.tokenPosition);
  for (const item of items) {
    const result = session.classifyFrontmatter(item);
    if (result !== null) {
      if ("finding" in result) findings.push(result.finding);
      else if (result.tag.kind === "filename-case") inertTags.push(result.tag);
      else tags.push(result.tag);
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

function buildFrontmatter(session: ParseSession, ctx: FrontmatterContext): Frontmatter {
  const lines: FrontmatterLine[] = [];
  let filename: FrontmatterFilenameTag | null = null;
  for (const fmLine of ctx.fmLine()) {
    const line = session.lineOf(fmLine);
    const raw = lineText(fmLine);
    const body = fmLine.getChild(0);
    if (body instanceof FmFilenameLineContext) {
      const result = buildFilename(session, body.tagCandidate());
      session.collector.report(result.findings);
      if (result.isDirective) {
        filename ??= result.tag;
        lines.push({ kind: "filename", line, raw, tag: result.tag });
      } else {
        lines.push({ kind: "comment", line, raw });
      }
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
      }
      lines.push({ kind: "key", line, raw, key, comment });
    } else {
      const kind =
        body instanceof FmCommentLineContext
          ? "comment"
          : body instanceof FmBlankLineContext
            ? "blank"
            : "other";
      lines.push({ kind, line, raw });
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
  };
}

// ---------------------------------------------------------------------------
// Body region
// ---------------------------------------------------------------------------

function buildHeadingText(
  session: ParseSession,
  items: readonly ParserRuleContext[],
): HeadingSuffix {
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
    // Legacy `#{1,2}\s+(.+?)`: a heading needs text.
    if (content === "") return { kind: "text", line, raw };
    if (level > 2) return { kind: "heading", line, raw, level, text: content, tags: [] };
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
  const kind =
    body instanceof BodyHtmlCommentContext
      ? "html-comment"
      : body instanceof BodyTableRowContext
        ? "table-row"
        : body instanceof BodyListItemContext
          ? "list-item"
          : body instanceof BodyBlankLineContext
            ? "blank"
            : "text";
  return { kind, line, raw };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Result of one document parse with every collected error. `document` is
 * null when stage 1 failed: `grammarErrors` then holds the grammar bug (an
 * internal error, never a user diagnostic). Otherwise `findings` holds the
 * tag findings (src/rules/syntax.ts maps them to MTL010 to MTL013).
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
  const tree = session.parser.document();
  const fmCtx = tree.frontmatter();
  const unclosed = tree.fmUnclosed() !== null;
  const fmEnd = fmCtx?.stop?.line ?? 0;
  session.collectStageOne("document", (event) =>
    unclosed || event.position.line <= fmEnd ? "frontmatter" : "body",
  );
  const grammarErrors = session.collector.errors;
  if (grammarErrors.length > 0) return { document: null, grammarErrors, findings: [] };
  const frontmatter = fmCtx === null ? null : buildFrontmatter(session, fmCtx);
  const blocks = tree.body()?.bodyBlock() ?? [];
  const body = blocks.map((block) => buildBodyBlock(session, block));
  const findings = session.collector.findings;
  return {
    document: { frontmatter, frontmatterUnclosed: unclosed, body, findings },
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
export function parseInlineComment(
  text: string,
  origin: Origin = DEFAULT_ORIGIN,
): FrontmatterComment {
  const session = new ParseSession(normalizeLineEnds(text), MdTemplateLexer.TAG_TEXT, true, origin);
  const tree = session.parser.fmInlineCommentEntry();
  session.assertStageOne("fmInlineCommentEntry", "frontmatter");
  return buildComment(session, tree.fmCommentItem(), origin, null);
}

/**
 * Region helper (not exported by the package): parse the text of an H1 or H2
 * heading (after the `#` marks). Body tags are peeled from the right; only the
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
export function parseFilenameComment(
  line: string,
  origin: Origin = DEFAULT_ORIGIN,
): FilenameComment {
  const session = new ParseSession(
    `${normalizeLineEnds(line)}\n`,
    MdTemplateLexer.FM,
    false,
    origin,
  );
  const tree = session.parser.fmFilenameLineEntry();
  // Expected input here, not a grammar bug: the events stay in the session log.
  if (!session.log.isEmpty) return { tag: null, findings: [] };
  const result = buildFilename(session, tree.fmFilenameLine().tagCandidate());
  return { tag: result.tag, findings: result.findings };
}
