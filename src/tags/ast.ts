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
export type ValueShape = "semver" | "date";
export type FilenameConvention = "snake_case" | "kebab-case" | "camelCase" | "PascalCase";
export type Bound = "min" | "max";

// ---------------------------------------------------------------------------
// Frontmatter tags (inline comment of a key, filename comment)
// ---------------------------------------------------------------------------

type Fm<T> = Located & { readonly region: "frontmatter" } & T;

/** spec 2.2 */
export type FrontmatterPresenceTag = Fm<{ readonly kind: "presence"; readonly mode: "required" | "optional" }> | Fm<{ readonly kind: "presence"; readonly mode: "conditional"; readonly detail: string }>;

/** spec 2.3 */
export type FrontmatterValueTag =
  | Fm<{ readonly kind: "format-constant"; readonly value: string }>
  | Fm<{ readonly kind: "format-case"; readonly style: CaseStyle }>
  | Fm<{ readonly kind: "format-elements"; readonly style: CaseStyle }>
  /** spec 2.9: `[format:semver]`, `[format:date]` */
  | Fm<{ readonly kind: "format-shape"; readonly shape: ValueShape }>
  /** spec 2.9: `[format:elements:semver]`, `[format:elements:date]` */
  | Fm<{ readonly kind: "format-elements-shape"; readonly shape: ValueShape }>
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

/**
 * spec 2.11: `[unique-headings-names]`, no colon and no argument. Effective only on a standalone
 * comment line (the template-wide switch); inert after a key.
 */
export type FrontmatterUniqueNamesTag = Fm<{ readonly kind: "unique-names" }>;

/**
 * ADR 0015: `[frontmatter:optional]`. Effective only on a standalone comment line of a template
 * frontmatter (the target may omit its frontmatter); inert after a key or in mixed comment text.
 */
export type FrontmatterOptionalTag = Fm<{ readonly kind: "frontmatter-optional" }>;

/** Tags that take effect on the field whose key line carries them. */
export type FrontmatterFieldTag = FrontmatterPresenceTag | FrontmatterValueTag;

/** Tags that are well-formed after a key but take no effect there (spec 2.5, 2.11, ADR 0015). */
export type FrontmatterInertTag = FrontmatterFilenameTag | FrontmatterUniqueNamesTag | FrontmatterOptionalTag;

/** Every well-formed frontmatter tag. */
export type FrontmatterTag = FrontmatterFieldTag | FrontmatterInertTag;

/** Type hints, spec 2.4 (frontmatter only). They choose a type and emit no code. */
export type TypeHint =
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
      readonly mode: "required" | "optional" | "template-only";
    }>
  | Body<{ readonly kind: "presence"; readonly mode: "conditional"; readonly detail: string }>;

/** spec 2.6 content tags */
export type BodyContentTag =
  | Body<{
      readonly kind: "content";
      /**
       * `subheadings-disallow` is `[content:subheadings:disallow]` (spec 2.6, ADR 0009);
       * `subheadings-no-extra` is `[content:subheadings:no-extra]` (spec 2.10).
       */
      readonly check: "non-empty" | "table" | "list" | "subheadings-disallow" | "subheadings-no-extra";
    }>
  | Body<{ readonly kind: "content-lines"; readonly bound: Bound; readonly value: number }>;

/** Placeholder names of a heading pattern (spec 2.10), lowercase. */
export type PatternPlaceholderName = "text" | "number" | "digits" | "semver" | "date" | "char";

/**
 * One piece of a heading pattern (spec 2.10 "PATTERN"), left to right. The
 * list stops at the first invalid piece (the first problem from the left), so
 * a pattern is valid when no piece is `invalid`.
 */
export type PatternPiece =
  /** A longest run of literal characters, escapes and `{{` `}}` resolved. */
  | { readonly kind: "literal"; readonly text: string }
  | {
      readonly kind: "placeholder";
      readonly name: PatternPlaceholderName;
      /** The format written (lowercase), null when the option is absent. */
      readonly format: string | null;
      /** The format argument (`padding:3` gives 3), null when none was written. */
      readonly argument: number | null;
      /** The placeholder as written, braces included (`{semver:format:core}`). */
      readonly raw: string;
    }
  | {
      readonly kind: "invalid";
      /** The `MTL014` reason of spec 2.10, for example `unknown placeholder {version}`. */
      readonly reason: string;
      /**
       * 0-based offset, in characters, of the problem inside the tag `raw`; the
       * file column is the tag `position.column` plus the offset. 0 is the tag's `[`.
       */
      readonly offset: number;
    };

/** spec 2.10 heading pattern, repeat and order tags */
export type BodyPatternTag =
  | Body<{
      readonly kind: "pattern";
      /** The text between the quotes as written (escapes unresolved). */
      readonly text: string;
      readonly pieces: readonly PatternPiece[];
    }>
  | Body<{
      readonly kind: "repeat";
      /** `none` is `[repeat-rules:same-level]`, `min` and `max` carry `n` (1 or more). */
      readonly bound: "none" | "min" | "max";
      readonly n: number | null;
    }>
  | Body<{
      readonly kind: "order";
      readonly direction: "ascending" | "descending";
      /** `text` orders by the whole heading text, the others by the first number, date or semver. */
      readonly by: "text" | "first-number" | "first-date" | "first-semver";
    }>;

/** spec 2.11: `[unique-headings-names]`, the per-heading switch. */
export type BodyUniqueNamesTag = Body<{ readonly kind: "unique-names" }>;

export type BodyTag = BodyPresenceTag | BodyContentTag | BodyPatternTag | BodyUniqueNamesTag;

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
  "format-shape": true,
  "format-elements-shape": true,
  "format-scheme": true,
  "value-filename": true,
  count: true,
  range: true,
  "order-ascending": true,
  "io-exists": true,
  "filename-case": true,
  "unique-names": true,
  "frontmatter-optional": true,
} satisfies Record<FrontmatterTag["kind"], true>;

const BODY_KIND_SET = {
  presence: true,
  content: true,
  "content-lines": true,
  pattern: true,
  repeat: true,
  order: true,
  "unique-names": true,
} satisfies Record<BodyTag["kind"], true>;

export const FRONTMATTER_TAG_KINDS = Object.keys(FRONTMATTER_KIND_SET) as FrontmatterTag["kind"][];
export const BODY_TAG_KINDS = Object.keys(BODY_KIND_SET) as BodyTag["kind"][];

// ---------------------------------------------------------------------------
// Findings (tag problems, before the registry turns them into diagnostics)
// ---------------------------------------------------------------------------

/**
 * The field, heading or comment line a finding belongs to, when known. No subject (`null`) means
 * the filename comment; `commentLine` is the 1-based file line of a standalone frontmatter
 * comment line.
 */
export type TagSubject = { readonly field: string } | { readonly heading: string } | { readonly commentLine: number };

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
   * Well-formed `[filename:case:...]`, `[unique-headings-names]` and `[frontmatter:optional]`
   * tags written after a key. Inert by spec 2.5, 2.11 and ADR 0015 (only a standalone comment
   * line takes effect) and not tag findings.
   */
  readonly inertTags: readonly FrontmatterInertTag[];
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
  | {
      readonly kind: "unique-names";
      readonly line: number;
      readonly raw: string;
      /** The tag, or null when it is malformed (`# [unique-headings-names:x]`, MTL012). */
      readonly tag: FrontmatterUniqueNamesTag | null;
    }
  | {
      readonly kind: "frontmatter-optional";
      readonly line: number;
      readonly raw: string;
      /** The tag, or null when it is malformed (`# [frontmatter:optional:x]`, MTL012). */
      readonly tag: FrontmatterOptionalTag | null;
    }
  | { readonly kind: "comment" | "blank" | "other"; readonly line: number; readonly raw: string };

/**
 * One well-formed `[frontmatter:optional]` in the frontmatter (ADR 0015), for MTL031:
 * - `alone`: on a standalone comment line. `firstLine` is null on the first such line (the
 *   effective one) and holds that first line on every later one (a duplicate);
 * - `key`: after a key (inert); `subject` is the `field` subject of the key;
 * - `mixed`: in comment text beside other text (inert).
 * `line` and `column` are the position of the tag's `[`; `subject` is `field` for `key` and
 * `commentLine` for `alone` and `mixed`. Parser data: no YAML knowledge (the line filter of
 * spec 2.1 is applied by src/engine/load.ts, `DocumentModel.optionalTags`).
 */
export type FrontmatterOptionalPlacement =
  | {
      readonly placement: "alone";
      readonly line: number;
      readonly column: number;
      readonly subject: TagSubject;
      readonly firstLine: number | null;
      readonly tag: FrontmatterOptionalTag;
    }
  | {
      readonly placement: "key" | "mixed";
      readonly line: number;
      readonly column: number;
      readonly subject: TagSubject;
      readonly tag: FrontmatterOptionalTag;
    };

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
  /**
   * True when a well-formed standalone `# [unique-headings-names]` line is present (spec 2.11,
   * the template-wide switch). Written on several lines, it counts once.
   */
  readonly uniqueHeadingNames: boolean;
  /**
   * True when a well-formed standalone `# [frontmatter:optional]` line is present (ADR 0015).
   * Written on several lines, it counts once (the first line is the effective one). Parser
   * view: the effective switch is `DocumentModel.frontmatterOptional` (spec 2.1 line filter).
   */
  readonly frontmatterOptional: boolean;
  /**
   * Every well-formed `[frontmatter:optional]` of the block, in source order, before the spec
   * 2.1 line filter; MTL031 reads the filtered `DocumentModel.optionalTags`.
   */
  readonly optionalTags: readonly FrontmatterOptionalPlacement[];
}

// ---------------------------------------------------------------------------
// Body region
// ---------------------------------------------------------------------------

/**
 * An ATX heading. CONTRACT: every ATX level 1 to 6 is `kind: "heading"` in the
 * AST and every level is a section that carries tags (spec 2.6, ADR 0009).
 * No consumer filters on `level`.
 */
export interface BodyHeading {
  readonly kind: "heading";
  readonly line: number;
  readonly raw: string;
  /** ATX level 1 to 6. */
  readonly level: number;
  /** Heading text, trailing HTML comment dropped, recognized tags removed, trimmed. */
  readonly text: string;
  /** Peeled tags in source order (every level, H1 to H6). */
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
export type DirectiveVerb = "disable" | "disable-line" | "disable-next-line" | "disable-file" | "begin disable" | "end disable";

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
