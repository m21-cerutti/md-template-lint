/**
 * Category `content` (docs/spec.md 4.3, codes MTL700-MTL799): section body
 * rules (spec 2.6, 4.1 step 6). All codes of the category are ported.
 *
 * Order (legacy `validate_content`): one section after the other, the five
 * codes inside a section. Each rule tags its findings with the template
 * section index (`reportSection`) and the pipeline stable-sorts the `content`
 * step by it. The finding anchors on the target heading of the checked
 * section (spec 4.4 DIR5).
 */
import { defineRule, reportSection, type AnyRule, type TargetContext } from "../engine/rule.js";
import type { Diagnostic, Section } from "../engine/model.js";
import { isPythonSpace, stripPythonSpace } from "../engine/values.js";

/**
 * The target section a template section is checked against: the FIRST target
 * section with the same text (spec 2.6). Null when the target lacks it; the
 * missing heading is reported once by the heading rules, not here.
 */
function targetSection(context: TargetContext, section: Section): Section | null {
  return context.target.sections.find((candidate) => candidate.text === section.text) ?? null;
}

/**
 * True when every code point of `text` is Python whitespace (an empty text is
 * blank). Not `String.trim`: ECMAScript trims U+FEFF and keeps U+001C-001F
 * and U+0085, Python does the opposite (legacy `not body.strip()`).
 */
function isBlank(text: string): boolean {
  for (const char of text) {
    if (!isPythonSpace(char.codePointAt(0) ?? 0)) return false;
  }
  return true;
}

/** True when the template section carries the tag `[content:<check>]`. */
function hasContentTag(section: Section, check: "non-empty" | "table" | "list"): boolean {
  return section.tags.some((tag) => tag.kind === "content" && tag.check === check);
}

/**
 * Value of the FIRST `[content:<bound>-lines:N]` tag of the template section
 * (legacy `re.search` takes the leftmost one; tags are in source order), or
 * null. A malformed N is not a tag: the parser reports it as MTL012 only.
 */
function lineBound(section: Section, bound: "min" | "max"): number | null {
  for (const tag of section.tags) {
    if (tag.kind === "content-lines" && tag.bound === bound) return tag.value;
  }
  return null;
}

/** Lines of `body` that are not blank (legacy `line.strip()` is truthy). */
function nonBlankLineCount(body: string): number {
  return body.split("\n").filter((line) => !isBlank(line)).length;
}

/**
 * Legacy `^\s*\|.*\|\s*$` on one line: after trimming, at least two
 * characters, the first and the last a pipe. A lone `|` is not a row.
 */
function isTableRow(line: string): boolean {
  const trimmed = stripPythonSpace(line);
  return trimmed.length >= 2 && trimmed.startsWith("|") && trimmed.endsWith("|");
}

/**
 * Legacy `^\s*(?:[-*+]\s+|\d+[.)]\s+)` on one line (re.match, Unicode str
 * semantics): `\s` is Python whitespace, `\d` any decimal digit (category Nd).
 * A marker alone at the end of the line is not an item: whitespace must follow.
 */
function isListItem(line: string): boolean {
  const chars = [...line];
  const isSpaceAt = (index: number): boolean =>
    index < chars.length && isPythonSpace(chars[index]?.codePointAt(0) ?? 0);
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
    context.template.sections.flatMap((section, index) => {
      if (!hasContentTag(section, "non-empty")) return [];
      const found = targetSection(context, section);
      if (found === null || !isBlank(found.body)) return [];
      return [
        reportSection(
          contentNonEmpty,
          `Section '${section.text}': [content:non-empty] section body is empty`,
          index,
          found.line,
        ),
      ];
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
    context.template.sections.flatMap((section, index) => {
      if (!hasContentTag(section, "table")) return [];
      const found = targetSection(context, section);
      if (found === null || found.body.split("\n").some(isTableRow)) return [];
      return [
        reportSection(
          contentTable,
          `Section '${section.text}': [content:table] no markdown table row found`,
          index,
          found.line,
        ),
      ];
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
    context.template.sections.flatMap((section, index) => {
      if (!hasContentTag(section, "list")) return [];
      const found = targetSection(context, section);
      if (found === null || found.body.split("\n").some(isListItem)) return [];
      return [
        reportSection(
          contentList,
          `Section '${section.text}': [content:list] no markdown list item found`,
          index,
          found.line,
        ),
      ];
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
    context.template.sections.flatMap((section, index) => {
      const minimum = lineBound(section, "min");
      if (minimum === null) return [];
      const found = targetSection(context, section);
      if (found === null) return [];
      const count = nonBlankLineCount(found.body);
      if (count >= minimum) return [];
      return [
        reportSection(
          contentMinLines,
          `Section '${section.text}': [content:min-lines:${minimum}] only ${count} non-blank line(s)`,
          index,
          found.line,
        ),
      ];
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
    context.template.sections.flatMap((section, index) => {
      const maximum = lineBound(section, "max");
      if (maximum === null) return [];
      const found = targetSection(context, section);
      if (found === null) return [];
      const count = nonBlankLineCount(found.body);
      if (count <= maximum) return [];
      return [
        reportSection(
          contentMaxLines,
          `Section '${section.text}': [content:max-lines:${maximum}] ${count} non-blank line(s)`,
          index,
          found.line,
        ),
      ];
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
