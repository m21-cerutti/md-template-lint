/**
 * Engine data model (docs/spec.md sections 1 to 3): a loaded template or
 * target, its fields (top-level frontmatter keys) and sections (every
 * heading level, H1 to H6, each with its parent).
 */
import type { BodyTag, Directive, FrontmatterComment, FrontmatterFilenameTag, MarkdownDocument, PatternPiece, SourcePosition, TagFinding } from "../tags/ast.js";
import { matchPattern } from "./pattern.js";

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
  const modes = (field.comment?.tags ?? []).flatMap((tag) => (tag.kind === "presence" ? [tag.mode] : []));
  if (modes.includes("conditional")) return "conditional";
  if (modes.includes("optional")) return "optional";
  return "required";
}

/** ATX heading level (spec 2.6). */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** A heading of any level (H1 to H6) and its body (spec 2.6, change C10). */
export interface Section {
  readonly level: HeadingLevel;
  /** Heading text with recognized tags removed. */
  readonly text: string;
  readonly line: number;
  readonly tags: readonly BodyTag[];
  /**
   * Raw text up to the next heading of equal or higher level (or the end of
   * the file). Deeper headings and their text stay in the body.
   */
  readonly body: string;
  /** Last file line of the section (the line before that next heading, or the last line). */
  readonly endLine: number;
  /**
   * Index in `DocumentModel.sections` of the parent: the nearest preceding
   * heading with a LOWER level; null when there is none (spec 2.6).
   */
  readonly parent: number | null;
}

export type HeadingPresence = "required" | "optional" | "conditional" | "template-only";

/**
 * Presence mode of a template heading (spec 2.6). Precedence when several
 * tags are present: conditional, template-only, optional, then
 * required (the default, also with no presence tag).
 */
export function headingPresence(section: Section): HeadingPresence {
  const modes = section.tags.flatMap((tag) => (tag.kind === "presence" ? [tag.mode] : []));
  for (const mode of ["conditional", "template-only", "optional"] as const) {
    if (modes.includes(mode)) return mode;
  }
  return "required";
}

/**
 * The effective (first, spec 2.10) `[pattern:"..."]` tag of a template heading
 * is invalid (`MTL014`, spec 2.10 INVALID PATTERN): the heading is not
 * checked, at any level, and is not a position (spec 2.6 "Sequence", "Checked").
 */
export function hasInvalidPattern(section: Section): boolean {
  const pattern = section.tags.find((tag) => tag.kind === "pattern");
  return pattern?.kind === "pattern" && pattern.pieces.some((piece) => piece.kind === "invalid");
}

/**
 * The pieces of the effective `[pattern:"..."]` tag of a PATTERN HEADING (spec 2.10): the
 * first pattern tag, valid (no `MTL014`), on a heading that is not `[presence:template-only]`
 * (there `MTL015` ignores it). Null for every other heading: an exact-text heading.
 */
export function headingPattern(section: Section): readonly PatternPiece[] | null {
  if (hasInvalidPattern(section) || headingPresence(section) === "template-only") return null;
  const pattern = section.tags.find((tag) => tag.kind === "pattern");
  return pattern?.kind === "pattern" ? pattern.pieces : null;
}

/**
 * True when the target heading text `text` matches template heading `section`
 * (spec 2.6 "Match of T", 2.10 MATCH): its pattern for a pattern heading,
 * else its exact text (case-sensitive, the literal pattern of its text).
 */
export function headingMatches(section: Section, text: string): boolean {
  const pieces = headingPattern(section);
  return pieces === null ? text === section.text : matchPattern(pieces, text) !== null;
}

/**
 * True when template heading `section` is a REPEAT HEADING (spec 2.10 "Kinds of position"): a
 * pattern heading (an effective, valid pattern) with at least one `[repeat-rules:...]` tag. A
 * repeat tag on any other heading is ignored (`MTL015`, or no finding after `MTL014`).
 */
export function isRepeatHeading(section: Section): boolean {
  return headingPattern(section) !== null && section.tags.some((tag) => tag.kind === "repeat");
}

/** One position of a run (spec 2.6 "Sequence", 2.10 step 2): a template heading and what it took. */
export interface HeadingPosition {
  /** Index in `template.sections` of the template heading. */
  readonly index: number;
  /**
   * The match (2.10 steps 3b to 3d): the sibling the position took as a match, the FIRST
   * instance of a repeat heading; null when it took no match (missing, or only a mismatch).
   */
  readonly match: Section | null;
  /**
   * Every sibling the position took as a match, in file order: the match alone for a single
   * position, the INSTANCES (the repeat set, 2.10 step 3d2) for a repeat heading. Empty when
   * it took no match.
   */
  readonly instances: readonly Section[];
  /**
   * The sibling a REQUIRED PLACEHOLDER position took as a MISMATCH (2.10 steps 3c and 3d1,
   * `MTL606`); null otherwise. A mismatch is not a match: it is in no `instances`.
   */
  readonly mismatch: Section | null;
  /**
   * "The next sibling" when the position was reached (2.10 step 2), taken or not; null when
   * no sibling was left. Tells MTL605 (no sibling left) from a placeholder mismatch (MTL606).
   */
  readonly next: Section | null;
  /**
   * EXACT-TEXT position that took nothing (2.10 step 3b, the `MTL601` hint of owner decision 6
   * of A72l): the first sibling from the cursor onward (not set aside, file order) whose text
   * equals the heading's text; null otherwise. Message data only: it changes no match.
   */
  readonly foundLater: Section | null;
  /**
   * REPEAT position only (2.10 step 4, `MTL614`): the tail siblings whose text matches its
   * pattern and that no earlier repeat position of the sequence lists, in file order (each
   * tail sibling is listed under the first repeat heading, in template order, it matches).
   * Empty for every other position.
   */
  readonly repeatMisses: readonly Section[];
}

/**
 * One positional run (spec 2.6 "Sequence", 2.10 "Positional match", ADR 0012):
 * the sequence of one level and scope over the siblings of that scope. File
 * scope: one run per level over the whole file. Section scope: one run per
 * level and per match of the template parent, over its target section.
 */
export interface HeadingRun {
  readonly level: HeadingLevel;
  readonly scope: "file" | "section";
  /** Section scope: index in `template.sections` of the template parent; null in file scope. */
  readonly parent: number | null;
  /** Section scope: the target section the run walks (the parent's match); null in file scope. */
  readonly parentMatch: Section | null;
  /** The target headings of this level in this scope, in file order. */
  readonly siblings: readonly Section[];
  /** Siblings set aside by a `[presence:template-only]` heading (2.10 step 1), in file order. */
  readonly setAside: readonly Section[];
  /** The positions, in template order (no template-only heading). */
  readonly positions: readonly HeadingPosition[];
  /**
   * The siblings from the cursor onward (2.10 step 4): the extra headings.
   * Empty when the run has no position (2.6 "Extra": no run, no tail). The warning MTL616
   * lists the ones no error (MTL612, MTL614, MTL615) names (src/rules/heading.ts).
   */
  readonly tail: readonly Section[];
}

/**
 * How one template heading relates to a target (spec 2.6 "Levels, parents and scope"), in one
 * scope. A template heading has one entry per scope it is matched in (in section scope, one per
 * entry of its template parent: per parent match or instance) and, in that scope, one entry
 * per INSTANCE of a repeat heading (spec 2.10 "Repeat rules": every instance is a match for
 * the rules on T); a single entry when it took one match or none.
 */
export interface HeadingMatch {
  /** The template heading and its index in `template.sections`. */
  readonly section: Section;
  readonly index: number;
  /** FILE: H1, H2 or no template parent; SECTION: H3 to H6 with a template parent. */
  readonly scope: "file" | "section";
  /**
   * The positional match (spec 2.6 "Match of T"): the sibling its position took
   * in `run` (for a repeat heading: the instance of this entry). Null when the position took
   * nothing or only a mismatch (`MTL606`), when the heading is not checked and for a
   * `[presence:template-only]` heading (not a position).
   */
  readonly match: Section | null;
  /**
   * Rank of this entry among the entries of the template heading in its scope: the instance
   * number (0-based) of a repeat heading, else 0. The entry 0 is "the match" of T for the order
   * lists (`MTL604`, `MTL611`: the first instance) and the one that carries the scope findings.
   */
  readonly instance: number;
  /** The sibling its position took as a mismatch (2.10 steps 3c, 3d1, `MTL606`); else null. */
  readonly mismatch: Section | null;
  /** Section scope: the target match of the template parent; null in file scope. */
  readonly parentMatch: Section | null;
  /**
   * Every file-scope heading; a section-scope one when its parent is checked, matched, not
   * template-only. Never a heading with an invalid pattern (MTL014, spec 2.6).
   */
  readonly checked: boolean;
  /**
   * The run of its level and scope (its position, or the siblings a
   * template-only heading sets aside); null when the heading is not checked.
   */
  readonly run: HeadingRun | null;
  /**
   * `[presence:template-only]`: the first sibling it set aside (2.10 step 1,
   * the `MTL603` heading); null when none and for every other presence mode.
   */
  readonly setAside: Section | null;
}

/** File scope (spec 2.6): an H1 or H2, or a heading without template parent. */
export const isFileScope = (section: Section): boolean => section.level <= 2 || section.parent === null;

/**
 * The positional run of one sequence over the siblings of one scope (spec
 * 2.10 steps 1 to 4: exact-text and pattern positions, the
 * mismatch of steps 3c and 3d1, the repeat run of step 3d2, the tail and its
 * repeat listing of step 4; the counts and order findings of steps 3d3 and 3d4
 * and the MTL614 findings are read by the rules). `members`
 * are the template indices of the sequence's level and scope, template-only
 * headings included, in template order. `parentMatch` null means file scope.
 */
function positionalRun(template: DocumentModel, target: DocumentModel, members: readonly number[], parent: number | null, parentMatch: Section | null): HeadingRun {
  const heads = members.flatMap((index) => {
    const section = template.sections[index];
    return section === undefined ? [] : [{ index, section, mode: headingPresence(section) }];
  });
  const level = heads[0]?.section.level ?? 1;
  const siblings = target.sections.filter((candidate) => candidate.level === level && (parentMatch === null || (candidate.line > parentMatch.line && candidate.line <= parentMatch.endLine)));
  // Step 1: every sibling with the text of a template-only heading is set aside.
  const asideTexts = new Set(heads.flatMap((head) => (head.mode === "template-only" ? [head.section.text] : [])));
  const setAside = siblings.filter((sibling) => asideTexts.has(sibling.text));
  const free = siblings.filter((sibling) => !asideTexts.has(sibling.text));
  // Steps 2 and 3: a cursor over the free siblings; it only moves forward.
  let cursor = 0;
  const taken: Omit<HeadingPosition, "repeatMisses">[] = [];
  /** Template index -> template heading, for the REPEAT positions only (step 4). */
  const repeats = new Map<number, Section>();
  for (const head of heads) {
    if (head.mode === "template-only") continue;
    const next = free[cursor] ?? null;
    const matches = (sibling: Section): boolean => headingMatches(head.section, sibling.text);
    const pieces = headingPattern(head.section);
    const placeholder = pieces?.some((piece) => piece.kind === "placeholder") ?? false;
    const repeat = isRepeatHeading(head.section);
    // Steps 3c and 3d1: only a REQUIRED PLACEHOLDER position takes a sibling it does not
    // match, as a MISMATCH (MTL606); with no sibling left presence speaks (MTL605).
    let mismatch: Section | null = null;
    if (next !== null && !matches(next) && placeholder && head.mode === "required") {
      mismatch = next;
      cursor += 1;
    }
    // Steps 3b and 3c: a single position takes the next sibling when it matches (not after a
    // mismatch). Step 3d2: a repeat position then takes every next sibling that matches.
    const instances: Section[] = [];
    if (mismatch === null || repeat) {
      let sibling = free[cursor];
      while (sibling !== undefined && matches(sibling)) {
        instances.push(sibling);
        cursor += 1;
        sibling = repeat ? free[cursor] : undefined;
      }
    }
    if (repeat) repeats.set(head.index, head.section);
    // Step 3b hint: an exact-text position that took nothing names the first sibling from the
    // cursor onward with its text (taken later or left in the tail); it takes nothing.
    const foundLater = pieces === null && instances.length === 0 ? (free.slice(cursor).find((sibling) => sibling.text === head.section.text) ?? null) : null;
    taken.push({
      index: head.index,
      match: instances[0] ?? null,
      instances,
      mismatch,
      next,
      foundLater,
    });
  }
  // Step 4: the siblings from the cursor onward; no position, no run, no tail.
  const tail = taken.length === 0 ? [] : free.slice(cursor);
  // Step 4, MTL614: each tail sibling matching a repeat pattern is listed once, under the first
  // repeat position (template order) whose pattern it matches.
  const listed = new Set<Section>();
  const positions: HeadingPosition[] = taken.map((position) => {
    const section = repeats.get(position.index);
    const repeatMisses = section === undefined ? [] : tail.filter((sibling) => !listed.has(sibling) && headingMatches(section, sibling.text));
    for (const sibling of repeatMisses) listed.add(sibling);
    return { ...position, repeatMisses };
  });
  const scope = parentMatch === null ? "file" : "section";
  return { level, scope, parent, parentMatch, siblings, setAside, positions, tail };
}

/**
 * Scope, positional match and "checked" of every template heading against a
 * target, in template order (spec 2.6, 2.10 "Positional match", ADR 0012).
 * The template headings of one level and scope form a sequence; it takes the
 * siblings of that level and scope in order, as one adjacent run (greedy
 * first-fit, no gaps, no backtracking). A section-scope run walks the target
 * section of the parent's match, so a parent is matched before its children.
 */
export function matchHeadings(template: DocumentModel, target: DocumentModel): HeadingMatch[] {
  const sections = template.sections;
  const matches: HeadingMatch[] = [];
  /** Template index -> its entries, in order (one per scope and instance). */
  const entries = new Map<number, HeadingMatch[]>();
  const runs = new Map<string, HeadingRun>();
  sections.forEach((section, index) => {
    const scope = isFileScope(section) ? "file" : "section";
    const parentIndex = scope === "file" ? null : section.parent;
    // Section scope: once per entry of the template parent (per parent match or instance).
    const parents: readonly (HeadingMatch | undefined)[] = parentIndex === null ? [undefined] : (entries.get(parentIndex) ?? []);
    const own: HeadingMatch[] = [];
    for (const parentItem of parents) {
      const parentMatch = parentItem?.match ?? null;
      // Spec 2.6 "Checked": a heading with an invalid pattern (MTL014) is never checked, and
      // neither are its section-scope descendants (their parent is not checked).
      const checked = !hasInvalidPattern(section) && (parentItem === undefined || (parentItem.checked && parentMatch !== null && headingPresence(parentItem.section) !== "template-only"));
      let run: HeadingRun | null = null;
      if (checked) {
        const key = `${section.level}:${parentIndex ?? "file"}:${parentMatch?.line ?? 0}`;
        run = runs.get(key) ?? null;
        if (run === null) {
          // An invalid-pattern heading is no position: the siblings it would take go on.
          const members = sections.flatMap((other, at) => (other.level === section.level && !hasInvalidPattern(other) && (scope === "file" ? isFileScope(other) : other.parent === parentIndex) ? [at] : []));
          run = positionalRun(template, target, members, parentIndex, parentMatch);
          runs.set(key, run);
        }
      }
      const position = run?.positions.find((entry) => entry.index === index) ?? null;
      const mismatch = position?.mismatch ?? null;
      const setAside = run !== null && headingPresence(section) === "template-only" ? (run.setAside.find((sibling) => sibling.text === section.text) ?? null) : null;
      // One entry per instance (spec 2.10 "Repeat rules"); one entry when it took no match.
      const taken: readonly (Section | null)[] = position === null || position.instances.length === 0 ? [null] : position.instances;
      taken.forEach((match, instance) => {
        own.push({
          section,
          index,
          scope,
          match,
          instance,
          mismatch,
          parentMatch,
          checked,
          run,
          setAside,
        });
      });
    }
    entries.set(index, own);
    matches.push(...own);
  });
  return matches;
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
   * True when a standalone `# [unique-headings-names]` line is present: the template-wide
   * switch (spec 2.11). Read by the rule of phase A80c.
   */
  readonly uniqueHeadingNames: boolean;
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
export type ParseFailureReason = "frontmatter-missing" | "yaml-invalid" | "frontmatter-not-mapping" | "file-unreadable";

export interface ParseFailure {
  readonly reason: ParseFailureReason;
  /** Detail text (YAML or OS error), empty when none. */
  readonly detail: string;
}

export type LoadResult = { readonly ok: true; readonly model: DocumentModel } | { readonly ok: false; readonly failure: ParseFailure };

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
