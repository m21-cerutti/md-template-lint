/**
 * Typed AST of a Markdown template or target (docs/spec.md sections 1.1 and 2).
 * Built from the parse trees of grammar/MdTemplateLexer.g4 and
 * grammar/MdTemplateParser.g4 by src/tags/parser.ts (orchestration) and the
 * per-family visitors in src/tags/visitors/.
 * Frontmatter and body are separate regions with separate tag unions
 * (docs/adr/0002-grammar-structure.md). No tag regex here.
 *
 * This layer reports tag problems as FINDINGS (region, reason, location,
 * subject) only. Codes, severities and messages belong to the rule registry
 * (src/rules/syntax.ts, phase A9).
 */

/** A 1-based position in the source file. */
export interface SourcePosition {
  readonly line: number;
  readonly column: number;
}

/** Where a node starts, plus its raw source text. */
export interface Located {
  readonly position: SourcePosition;
  readonly raw: string;
}

export type Region = "frontmatter" | "body";
export type CaseStyle = "snake_case" | "kebab-case";
export type FilenameConvention = "snake_case" | "kebab-case" | "camelCase" | "PascalCase";
export type Bound = "min" | "max";

// ---------------------------------------------------------------------------
// Frontmatter tags (inline comment of a key, filename comment)
// ---------------------------------------------------------------------------

type Fm<T> = Located & { readonly region: "frontmatter" } & T;

/** spec 2.2 */
export type FrontmatterPresenceTag =
  | Fm<{ readonly kind: "presence"; readonly mode: "required" | "optional" }>
  | Fm<{ readonly kind: "presence"; readonly mode: "conditional"; readonly detail: string }>;

/** spec 2.3 */
export type FrontmatterValueTag =
  | Fm<{ readonly kind: "format-constant"; readonly value: string }>
  | Fm<{ readonly kind: "format-case"; readonly style: CaseStyle }>
  | Fm<{ readonly kind: "format-elements"; readonly style: CaseStyle }>
  | Fm<{
      readonly kind: "format-scheme";
      /** Raw argument as written, for messages. */
      readonly argument: string;
      /** Comma split, trimmed, lowercased, empty items dropped. */
      readonly schemes: readonly string[];
    }>
  | Fm<{ readonly kind: "value-filename" }>
  | Fm<{ readonly kind: "count"; readonly bound: Bound; readonly value: number }>
  | Fm<{
      readonly kind: "range";
      readonly bound: Bound;
      /** Bound text as written (`-?digits(.digits)?`). */
      readonly text: string;
      /** True when the bound has a `.` (a float bound, else an integer bound). */
      readonly isFloat: boolean;
      readonly value: number;
    }>
  | Fm<{ readonly kind: "order-ascending" }>
  | Fm<{ readonly kind: "io-exists" }>;

/** spec 2.5. Effective only on a standalone comment line; inert after a key. */
export type FrontmatterFilenameTag = Fm<{
  readonly kind: "filename-case";
  readonly convention: FilenameConvention;
}>;

/** Tags that take effect on the field whose key line carries them. */
export type FrontmatterFieldTag = FrontmatterPresenceTag | FrontmatterValueTag;

/** Every well-formed frontmatter tag. */
export type FrontmatterTag = FrontmatterFieldTag | FrontmatterFilenameTag;

/** Type hints, spec 2.4 (frontmatter only). They choose a type and emit no code. */
export type TypeHint =
  | (Located & { readonly kind: "type-eq"; readonly name: string })
  | (Located & { readonly kind: "bracket"; readonly name: string })
  | (Located & { readonly kind: "date-placeholder" })
  | (Located & { readonly kind: "iso-word" })
  | (Located & { readonly kind: "url-word" })
  | (Located & { readonly kind: "path-word" })
  | (Located & { readonly kind: "alias-marker"; readonly name: string });

// ---------------------------------------------------------------------------
// Body tags (heading suffix)
// ---------------------------------------------------------------------------

type Body<T> = Located & { readonly region: "body" } & T;

/** spec 2.6 presence on a heading */
export type BodyPresenceTag =
  | Body<{
      readonly kind: "presence";
      readonly mode: "required" | "optional" | "exist" | "template-only";
    }>
  | Body<{ readonly kind: "presence"; readonly mode: "conditional"; readonly detail: string }>;

/** spec 2.6 content tags */
export type BodyContentTag =
  | Body<{ readonly kind: "content"; readonly check: "non-empty" | "table" | "list" }>
  | Body<{ readonly kind: "content-lines"; readonly bound: Bound; readonly value: number }>;

export type BodyTag = BodyPresenceTag | BodyContentTag;

// ---------------------------------------------------------------------------
// Tag kinds at run time. `satisfies Record<kind, true>` makes the compiler
// reject a missing or an extra kind, so these lists cannot drift from the
// unions above; `pnpm run check:rules` checks them against the grammar and
// the visitors.
// ---------------------------------------------------------------------------

const FRONTMATTER_KIND_SET = {
  presence: true,
  "format-constant": true,
  "format-case": true,
  "format-elements": true,
  "format-scheme": true,
  "value-filename": true,
  count: true,
  range: true,
  "order-ascending": true,
  "io-exists": true,
  "filename-case": true,
} satisfies Record<FrontmatterTag["kind"], true>;

const BODY_KIND_SET = {
  presence: true,
  content: true,
  "content-lines": true,
} satisfies Record<BodyTag["kind"], true>;

export const FRONTMATTER_TAG_KINDS = Object.keys(FRONTMATTER_KIND_SET) as FrontmatterTag["kind"][];
export const BODY_TAG_KINDS = Object.keys(BODY_KIND_SET) as BodyTag["kind"][];

// ---------------------------------------------------------------------------
// Findings (tag problems, before the registry turns them into diagnostics)
// ---------------------------------------------------------------------------

/** The field or heading a finding belongs to, when known. */
export type TagSubject = { readonly field: string } | { readonly heading: string };

/**
 * Why a bracket is a problem. Mapping to codes is the registry's job; see
 * docs/spec.md section 2.7 and docs/adr/0002-grammar-structure.md:
 * - `unknown`: tag-shaped bracket of no known family (frontmatter or heading);
 * - `malformed`: known family, bad syntax;
 * - `wrong-region`: a known tag that is only valid in the other region.
 */
export type TagFindingReason = "unknown" | "malformed" | "wrong-region";

export interface TagFinding {
  /** Region where the bracket was written. */
  readonly region: Region;
  readonly reason: TagFindingReason;
  /** The whole bracket as written, for example `[count:min:abc]`. */
  readonly tag: string;
  /** Offending token (malformed) or the opening bracket (unknown, wrong-region). */
  readonly position: SourcePosition;
  /** Offending token text (`<EOF>` for an unterminated tag) or the bracket. */
  readonly offending: string;
  /** Parser detail for `malformed`, empty otherwise. Not a user message. */
  readonly detail: string;
  /** Field key (quotes stripped) or heading text; null when unknown to the caller. */
  readonly subject: TagSubject | null;
}

// ---------------------------------------------------------------------------
// Frontmatter region
// ---------------------------------------------------------------------------

export interface FrontmatterComment {
  /** Comment text after `#`, trimmed (spec 3.2 "comment"). */
  readonly text: string;
  /** Position of the first character after `#`. */
  readonly position: SourcePosition;
  /** Well-formed field tags in source order. */
  readonly tags: readonly FrontmatterFieldTag[];
  /**
   * Well-formed `[filename:case:...]` tags written after a key. Inert by
   * spec 2.5 (only a standalone comment line takes effect) and not findings.
   */
  readonly inertTags: readonly FrontmatterFilenameTag[];
  readonly hints: readonly TypeHint[];
  readonly findings: readonly TagFinding[];
}

export type FrontmatterLine =
  | {
      readonly kind: "key";
      readonly line: number;
      readonly raw: string;
      /** Key as written (quotes kept for a quoted key). YAML meaning comes from `yaml`. */
      readonly key: string;
      readonly comment: FrontmatterComment | null;
    }
  | {
      readonly kind: "filename";
      readonly line: number;
      readonly raw: string;
      /** The directive, or null when its tag is malformed. */
      readonly tag: FrontmatterFilenameTag | null;
    }
  | { readonly kind: "comment" | "blank" | "other"; readonly line: number; readonly raw: string };

export interface Frontmatter {
  /** Line of the opening `---`. */
  readonly startLine: number;
  /** Line of the closing `---`. */
  readonly endLine: number;
  /** YAML text between the delimiters, for the `yaml` package. */
  readonly yaml: string;
  readonly lines: readonly FrontmatterLine[];
  /** First well-formed standalone `# [filename:case:...]` (spec 2.5). */
  readonly filename: FrontmatterFilenameTag | null;
}

// ---------------------------------------------------------------------------
// Body region
// ---------------------------------------------------------------------------

/**
 * An ATX heading. CONTRACT: every ATX level 1 to 6 is `kind: "heading"` in the
 * AST, but only levels 1 and 2 are sections and carry tags (spec 2.6).
 * Consumers building sections must filter `level <= 2`; H3 to H6 stay part of
 * the enclosing section body.
 */
export interface BodyHeading {
  readonly kind: "heading";
  readonly line: number;
  readonly raw: string;
  /** ATX level 1 to 6. */
  readonly level: number;
  /** Heading text, trailing HTML comment dropped, recognized tags removed, trimmed. */
  readonly text: string;
  /** Peeled tags in source order (levels 1 and 2 only; always empty for H3 to H6). */
  readonly tags: readonly BodyTag[];
}

export interface BodyFence {
  readonly kind: "fence";
  readonly line: number;
  readonly raw: string;
  readonly endLine: number;
  /** Opening marker, for example "```" or "~~~~". */
  readonly marker: string;
  readonly closed: boolean;
}

export interface BodyLine {
  readonly kind: "html-comment" | "table-row" | "list-item" | "blank" | "text";
  readonly line: number;
  readonly raw: string;
}

export type BodyBlock = BodyHeading | BodyFence | BodyLine;

// ---------------------------------------------------------------------------
// Disable directives of a target (spec 4.4). Parse data only: validation of
// the verb and the codes (MTL020 to MTL022) and suppression belong to A60.
// ---------------------------------------------------------------------------

/** Canonical lowercase verb of DIR1. */
export type DirectiveVerb =
  | "disable"
  | "disable-line"
  | "disable-next-line"
  | "disable-file"
  | "begin disable"
  | "end disable";

/** One item of the code list as written (validated as a code later, DIR2). */
export interface DirectiveItem {
  readonly text: string;
  readonly position: SourcePosition;
}

/**
 * One directive comment (DIR2, DIR3). `position` is the comment start: `<!--`
 * in the body, `#` in the frontmatter. `raw` is the whole comment as written
 * (`<!-- ... -->`, or `#` to the end of the line).
 */
export interface Directive extends Located {
  /** body: one-line HTML comment; frontmatter: YAML comment. */
  readonly region: Region;
  /**
   * File line of the comment (DIR1): the line `disable-line` covers, the line
   * before the one `disable-next-line` covers, the start or end of a range.
   */
  readonly line: number;
  /** The verb, or null when the keyword is alone or the word is no verb (MTL020). */
  readonly verb: DirectiveVerb | null;
  /**
   * The verb position as written: the verb (`Begin  Disable`), the unknown word
   * (`disabel`, `begin` or `end` without `disable`), or `''` when there is none.
   */
  readonly word: string;
  /** Code list items in source order, empty items dropped, duplicates kept. */
  readonly items: readonly DirectiveItem[];
  /** Free text after a `--` word, trimmed; null when there is no `--`. */
  readonly reason: string | null;
}

export interface MarkdownDocument {
  /** null when the document has no frontmatter or when it is unclosed. */
  readonly frontmatter: Frontmatter | null;
  /**
   * The first line opens a frontmatter (`---`) that is never closed. The rest
   * of the document was lexed as frontmatter, so `body` is empty; this is the
   * MTL001 case (spec 1.1).
   */
  readonly frontmatterUnclosed: boolean;
  readonly body: readonly BodyBlock[];
  /**
   * Every directive comment candidate in source order (spec 4.4, DIR3, DIR4):
   * body one-line HTML comments outside fences and code spans, frontmatter
   * comments on `FM_KEY` lines and column-1 `#` lines. Read for a target only;
   * `loadDocument` keeps the frontmatter ones on YAML key and comment lines.
   */
  readonly directives: readonly Directive[];
  /**
   * Every tag finding of the document, in source order. Field findings carry
   * the key line; A9 keeps only those whose line matches a YAML top-level key.
   */
  readonly findings: readonly TagFinding[];
}

// ---------------------------------------------------------------------------
// Region helper results (src/tags/parser.ts helpers, not exported by the package)
// ---------------------------------------------------------------------------

export interface HeadingSuffix {
  readonly text: string;
  readonly tags: readonly BodyTag[];
  readonly findings: readonly TagFinding[];
}

export interface FilenameComment {
  /** The directive, or null when the line is not a well-formed filename comment. */
  readonly tag: FrontmatterFilenameTag | null;
  readonly findings: readonly TagFinding[];
}
