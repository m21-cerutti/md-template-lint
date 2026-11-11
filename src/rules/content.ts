/**
 * Category `content` (docs/spec.md 4.3, codes MTL700-MTL799): section body
 * rules (spec 2.6, 4.1 step 6). All codes of the category are ported.
 *
 * Order: one section after the other, the five
 * codes inside a section. Each rule tags its findings with the template
 * section index (`reportSection`) and the pipeline stable-sorts the `content`
 * step by it. The finding anchors on the target heading of the checked
 * section (spec 4.4 DIR5).
 */
import { defineRule, reportSection, type AnyRule, type TargetContext } from "../engine/rule.js";
import { headingPattern, matchHeadings, type Diagnostic, type Section } from "../engine/model.js";
import { isUnicodeSpace, stripUnicodeSpace } from "../engine/values.js";

/** A checked template section, its target match and the message label. */
interface CheckedSection {
  readonly section: Section;
  readonly index: number;
  readonly found: Section;
  readonly label: string;
}

/**
 * The template sections a content rule checks (spec 2.6): every checked
 * template heading with a positional match, the sibling its position took
 * (2.10 "Positional match"), for every presence mode (ADR 0012);
 * for a pattern heading, the sibling its pattern matched
 * (2.10 MATCH), and for a repeat heading each instance (one `matchHeadings`
 * entry per instance, anchored on it). A sibling taken as a mismatch (MTL606)
 * is no match and is never read. Skipped otherwise: a missing heading is reported once
 * by the heading rules, not here; a template-only heading is not a position.
 * The label is `Section '{text}'` in file scope and
 * `Section '{parent} > {text}'` in section scope ({parent}: the target parent match).
 * An exact-text heading's `{text}` is its template text (equal to the target text); a
 * pattern heading's `{text}` is the text of the checked target heading (the match or
 * instance), followed by ` (pattern "{pattern}")`, the pattern as written in its tag.
 */
function checkedSections(context: TargetContext): CheckedSection[] {
  return matchHeadings(context.template, context.target).flatMap((item) => {
    const { section, index, match } = item;
    if (!item.checked || match === null) return [];
    const pattern = headingPattern(section) === null ? null : writtenPattern(section);
    const text = pattern === null ? section.text : match.text;
    const name = item.parentMatch === null ? text : `${item.parentMatch.text} > ${text}`;
    const suffix = pattern === null ? "" : ` (pattern "${pattern}")`;
    return [{ section, index, found: match, label: `Section '${name}'${suffix}` }];
  });
}

/** `{pattern}` of spec 2.6: the effective pattern tag's text as written between the quotes. */
function writtenPattern(section: Section): string {
  const tag = section.tags.find((entry) => entry.kind === "pattern");
  return tag?.kind === "pattern" ? tag.text : "";
}

/**
 * True when every code point of `text` is whitespace of `isUnicodeSpace` (an
 * empty text is blank). Not `String.trim`: ECMAScript trims U+FEFF and keeps
 * U+001C-001F and U+0085, `isUnicodeSpace` does the opposite.
 */
function isBlank(text: string): boolean {
  for (const char of text) {
    if (!isUnicodeSpace(char.codePointAt(0) ?? 0)) return false;
  }
  return true;
}

/** True when the template section carries the tag `[content:<check>]`. */
function hasContentTag(section: Section, check: "non-empty" | "table" | "list"): boolean {
  return section.tags.some((tag) => tag.kind === "content" && tag.check === check);
}

/**
 * Value of the FIRST `[content:<bound>-lines:N]` tag of the template section
 * (the leftmost one wins; tags are in source order), or
 * null. A malformed N is not a tag: the parser reports it as MTL012 only.
 */
function lineBound(section: Section, bound: "min" | "max"): number | null {
  for (const tag of section.tags) {
    if (tag.kind === "content-lines" && tag.bound === bound) return tag.value;
  }
  return null;
}

/** Lines of `body` that are not blank. */
function nonBlankLineCount(body: string): number {
  return body.split("\n").filter((line) => !isBlank(line)).length;
}

/**
 * Table row, `^\s*\|.*\|\s*$` on one line: after trimming, at least two
 * characters, the first and the last a pipe. A lone `|` is not a row.
 */
function isTableRow(line: string): boolean {
  const trimmed = stripUnicodeSpace(line);
  return trimmed.length >= 2 && trimmed.startsWith("|") && trimmed.endsWith("|");
}

/**
 * List item, `^\s*(?:[-*+]\s+|\d+[.)]\s+)` anchored at the start of one line:
 * `\s` is `isUnicodeSpace`, `\d` any decimal digit (category Nd).
 * A marker alone at the end of the line is not an item: whitespace must follow.
 */
function isListItem(line: string): boolean {
  const chars = [...line];
  const isSpaceAt = (index: number): boolean => index < chars.length && isUnicodeSpace(chars[index]?.codePointAt(0) ?? 0);
  let index = 0;
  while (isSpaceAt(index)) index += 1;
  const first = chars[index] ?? "";
  if (first === "-" || first === "*" || first === "+") return isSpaceAt(index + 1);
  const digitsFrom = index;
  while (index < chars.length && /^\p{Nd}$/u.test(chars[index] ?? "")) index += 1;
  if (index === digitsFrom) return false;
  const marker = chars[index];
  return (marker === "." || marker === ")") && isSpaceAt(index + 1);
}

const contentNonEmpty = defineRule({
  code: "MTL701",
  name: "content-non-empty",
  severity: "error",
  category: "content",
  phase: "target",
  step: "content",
  check: (context: TargetContext): Diagnostic[] =>
    checkedSections(context).flatMap(({ section, index, found, label }) => {
      if (!hasContentTag(section, "non-empty")) return [];
      if (!isBlank(found.body)) return [];
      return [reportSection(contentNonEmpty, `${label}: [content:non-empty] section body is empty`, index, found.line)];
    }),
});

const contentTable = defineRule({
  code: "MTL702",
  name: "content-table",
  severity: "error",
  category: "content",
  phase: "target",
  step: "content",
  check: (context: TargetContext): Diagnostic[] =>
    checkedSections(context).flatMap(({ section, index, found, label }) => {
      if (!hasContentTag(section, "table")) return [];
      if (found.body.split("\n").some(isTableRow)) return [];
      return [reportSection(contentTable, `${label}: [content:table] no markdown table row found`, index, found.line)];
    }),
});

const contentList = defineRule({
  code: "MTL703",
  name: "content-list",
  severity: "error",
  category: "content",
  phase: "target",
  step: "content",
  check: (context: TargetContext): Diagnostic[] =>
    checkedSections(context).flatMap(({ section, index, found, label }) => {
      if (!hasContentTag(section, "list")) return [];
      if (found.body.split("\n").some(isListItem)) return [];
      return [reportSection(contentList, `${label}: [content:list] no markdown list item found`, index, found.line)];
    }),
});

const contentMinLines = defineRule({
  code: "MTL704",
  name: "content-min-lines",
  severity: "error",
  category: "content",
  phase: "target",
  step: "content",
  check: (context: TargetContext): Diagnostic[] =>
    checkedSections(context).flatMap(({ section, index, found, label }) => {
      const minimum = lineBound(section, "min");
      if (minimum === null) return [];
      const count = nonBlankLineCount(found.body);
      if (count >= minimum) return [];
      return [reportSection(contentMinLines, `${label}: [content:min-lines:${minimum}] only ${count} non-blank line(s)`, index, found.line)];
    }),
});

const contentMaxLines = defineRule({
  code: "MTL705",
  name: "content-max-lines",
  severity: "error",
  category: "content",
  phase: "target",
  step: "content",
  check: (context: TargetContext): Diagnostic[] =>
    checkedSections(context).flatMap(({ section, index, found, label }) => {
      const maximum = lineBound(section, "max");
      if (maximum === null) return [];
      const count = nonBlankLineCount(found.body);
      if (count <= maximum) return [];
      return [reportSection(contentMaxLines, `${label}: [content:max-lines:${maximum}] ${count} non-blank line(s)`, index, found.line)];
    }),
});

export const rules: readonly AnyRule[] = [
  contentNonEmpty,
  contentTable,
  contentList,
  contentMinLines,
  contentMaxLines,
  // new:rule inserts above this line
];
