/**
 * Source excerpt of a diagnostic (docs/spec.md 8.2 EX1 to EX8, 8.5 `sourceLine`): the
 * line that causes it, sanitized, cut at a fixed width, with a caret under the column
 * when there is one. The runner attaches the bounded window (`src/runner/excerpt.ts`);
 * this file only formats it, so every reporter shows the same text and its cost never
 * depends on the length of the source line.
 */
import { EXCERPT_WIDTH } from "../runner/excerpt.js";
import type { SourceExcerpt } from "../runner/types.js";
import { cleanChar } from "./sanitize.js";

export { EXCERPT_WIDTH };

const ELLIPSIS = "...";

/** Display width of a shown unit (one source character, possibly an escape). */
const widthOf = (unit: string): number => Array.from(unit).length;

/**
 * The rows of an excerpt, indented by `indent` spaces: the gutter row, then the caret row
 * when the excerpt has a column (EX2). The caret offset counts the shown width before it
 * (escapes in full, a leading ellipsis included, EX4).
 */
export function excerptRows(excerpt: SourceExcerpt, indent: number): string[] {
  const units = Array.from(excerpt.text).map(cleanChar);
  const head = excerpt.before > 0 ? ELLIPSIS : "";
  const tail = excerpt.after > 0 ? ELLIPSIS : "";
  const text = `${head}${units.join("")}${tail}`;
  const pad = " ".repeat(indent);
  const number = String(excerpt.line);
  const rows = [text === "" ? `${pad}${number} |` : `${pad}${number} | ${text}`];
  if (excerpt.caret !== null) {
    const offset =
      head.length + units.slice(0, excerpt.caret).reduce((sum, unit) => sum + widthOf(unit), 0);
    rows.push(`${pad}${" ".repeat(number.length)} | ${" ".repeat(offset)}^`);
  }
  return rows;
}

/**
 * JSON `sourceLine` (spec 8.5): the sanitized first `EXCERPT_WIDTH` characters of the line,
 * with `...` when it is longer, never a window and no caret. Only an excerpt with a column
 * has one, since `sourceLine` always sits next to `line`; an anchor-only excerpt is text only.
 */
export function sourceLineOf(excerpt: SourceExcerpt | undefined): string | undefined {
  if (excerpt === undefined || excerpt.head === null) return undefined;
  const shown = Array.from(excerpt.head).map(cleanChar).join("");
  return excerpt.headCut ? `${shown}${ELLIPSIS}` : shown;
}
