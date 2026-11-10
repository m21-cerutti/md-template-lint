/**
 * Engine data model (docs/spec.md sections 1 to 3): a loaded template or
 * target, its fields (top-level frontmatter keys) and sections (H1/H2).
 */
import type {
  BodyTag,
  Directive,
  FrontmatterComment,
  FrontmatterFilenameTag,
  MarkdownDocument,
  SourcePosition,
  TagFinding,
} from "../tags/ast.js";

/** A frontmatter value loaded with the `failsafe` schema (spec 1.2): strings, lists, mappings. */
export type YamlValue = string | readonly YamlValue[] | YamlMapping;
export type YamlMapping = ReadonlyMap<string, YamlValue>;

export function isList(value: YamlValue): value is readonly YamlValue[] {
  return Array.isArray(value);
}

export function isMapping(value: YamlValue): value is YamlMapping {
  return value instanceof Map;
}

/** Spec 1.2 "empty value": a blank string or an empty list. A mapping is never empty. */
export function isEmptyValue(value: YamlValue): boolean {
  if (typeof value === "string") return value.trim() === "";
  return isList(value) && value.length === 0;
}

/**
 * One top-level frontmatter key. For a duplicate key the LAST occurrence wins
 * (Q06): value, line, comment and type all come from it. Only the order of
 * `DocumentModel.fields` keeps the slot of the first occurrence.
 */
export interface Field {
  readonly key: string;
  readonly value: YamlValue;
  /** File line of the key (the last occurrence for a duplicate key). */
  readonly line: number;
  /** Inline comment on the key's own line (spec 2.1), joined by line number. */
  readonly comment: FrontmatterComment | null;
  /** Inferred type (spec 3.2). May be a name outside the 17 types (Q01). */
  readonly type: string;
}

/**
 * Presence mode of a template field (spec 2.2). Precedence when several tags
 * are present: conditional, then optional, then required. No presence tag
 * means required. Shared by the presence and the enum severity rules.
 */
export function presenceMode(field: Field): "required" | "optional" | "conditional" {
  const modes = (field.comment?.tags ?? []).flatMap((tag) =>
    tag.kind === "presence" ? [tag.mode] : [],
  );
  if (modes.includes("conditional")) return "conditional";
  if (modes.includes("optional")) return "optional";
  return "required";
}

/** An H1 or H2 heading and its body (spec 2.6). H3 to H6 stay in the body. */
export interface Section {
  readonly level: 1 | 2;
  /** Heading text with recognized tags removed. */
  readonly text: string;
  readonly line: number;
  readonly tags: readonly BodyTag[];
  /** Raw text up to the next H1/H2 of equal or higher level (or the end of the file). */
  readonly body: string;
}

/** A successfully loaded template or target. */
export interface DocumentModel {
  readonly document: MarkdownDocument;
  /** Fields in key order. */
  readonly fields: ReadonlyMap<string, Field>;
  readonly sections: readonly Section[];
  /** First standalone `# [filename:case:...]` (spec 2.5). */
  readonly filename: FrontmatterFilenameTag | null;
  /**
   * Syntax-level tag findings collected by the parser listeners, kept only
   * for YAML top-level key lines, filename comment lines and the body
   * (spec 2.1, 2.7). Read by src/rules/syntax.ts.
   */
  readonly findings: readonly TagFinding[];
  /**
   * Disable directives in source order (spec 4.4, DIR3): every body one-line
   * HTML comment outside fences and code spans, and frontmatter YAML comments
   * on top-level key lines or column-1 comment lines outside a multi-line
   * value. Parse data only; read for a target, never for a template (DIR4).
   */
  readonly directives: readonly Directive[];
}

/** Parse failures MTL001 to MTL004 (spec 1.2). Codes and messages live in src/rules/syntax.ts. */
export type ParseFailureReason =
  "frontmatter-missing" | "yaml-invalid" | "frontmatter-not-mapping" | "file-unreadable";

export interface ParseFailure {
  readonly reason: ParseFailureReason;
  /** Detail text (YAML or OS error), empty when none. */
  readonly detail: string;
}

export type LoadResult =
  | { readonly ok: true; readonly model: DocumentModel }
  | { readonly ok: false; readonly failure: ParseFailure };

export type Severity = "error" | "warning";

/** A stable rule code, `MTL` and three digits. */
export type RuleCode = `MTL${string}`;

/** Numeric part of `MTLnnn`, or null when the code is not `MTL` and three digits. */
export function codeNumber(code: string): number | null {
  const digits = code.slice(3);
  if (!code.startsWith("MTL") || digits.length !== 3) return null;
  for (const char of digits) if (char < "0" || char > "9") return null;
  return Number(digits);
}

export interface Diagnostic {
  readonly code: RuleCode;
  readonly severity: Severity;
  readonly message: string;
  readonly position: SourcePosition | null;
  /**
   * Template heading text the finding is about (spec 8.1), set by the pipeline for
   * the heading presence findings (MTL601 to MTL603) and the content findings
   * (MTL701 to MTL705). Absent for every other diagnostic.
   */
  readonly heading?: string;
}
