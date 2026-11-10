/**
 * Source lines of diagnostics (docs/spec.md 8.1, 8.2 EX5 and EX8, change C09). The runner
 * already holds the text of the file it lints, so a diagnostic is matched to its line here,
 * and the reporters only format what is kept.
 *
 * A diagnostic quotes, in this order: the line of its `position`, else its anchor line
 * (4.4 DIR5), else nothing. A line outside the file quotes nothing.
 *
 * Cost and memory are bounded (EX8). A source line is prepared at most once per file
 * (`prepare`, one pass over that line, cached by line number while the file's diagnostics
 * are matched); each diagnostic then costs a constant (`EXCERPT_WIDTH` characters), however
 * long the line or many the diagnostics on it. What is kept on a diagnostic is a few
 * strings of at most `EXCERPT_WIDTH` characters, each a copy that owns its characters: a
 * slice of the file text would keep the whole file alive.
 */
import type { Diagnostic } from "../engine/model.js";
import { anchorLineOf } from "../engine/rule.js";
import { normalizeLineEnds } from "../tags/parser.js";
import type { ReportedDiagnostic, SourceExcerpt } from "./types.js";

/** Characters of a source line shown at most (spec 8.2, EX5). */
export const EXCERPT_WIDTH = 100;
/** Characters kept before the offending one when the window slides (EX5). */
const LEAD = 40;

/** A source line ready for constant-time windows: its length in characters and their offsets. */
interface PreparedLine {
  readonly text: string;
  /** Length in characters (Unicode code points, as the parser counts columns). */
  readonly count: number;
  /** Offset in `text` of each character plus the end; null when every character is one unit. */
  readonly offsets: Uint32Array | null;
}

/** One pass over `text`: is every character one UTF-16 unit, else where does each start. */
function prepare(text: string): PreparedLine {
  let single = true;
  for (let index = 0; index < text.length; index += 1) {
    const unit = text.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdfff) {
      single = false;
      break;
    }
  }
  if (single) return { text, count: text.length, offsets: null };
  const offsets = new Uint32Array(text.length + 1);
  let count = 0;
  for (let index = 0; index < text.length;) {
    offsets[count] = index;
    count += 1;
    index += (text.codePointAt(index) ?? 0) > 0xffff ? 2 : 1;
  }
  offsets[count] = text.length;
  return { text, count, offsets };
}

// Not observable by a unit test: it detaches the piece from the file text (heap snapshot only).
/** A copy that owns its characters (a slice of a big string keeps the big string alive). */
const own = (piece: string): string => Array.from(piece).join("");

/** Characters `from` up to `to` of a prepared line, as a string of their own. */
function chars(line: PreparedLine, from: number, to: number): string {
  const { text, offsets } = line;
  return own(offsets === null ? text.slice(from, to) : text.slice(offsets[from], offsets[to]));
}

/** The excerpt of a prepared line (EX2 to EX5): a window of at most `EXCERPT_WIDTH` characters. */
function excerptOf(number: number, line: PreparedLine, column: number | null): SourceExcerpt {
  // A column past the end puts the caret just after the last character (EX4).
  const at = column === null ? null : Math.min(Math.max(column - 1, 0), line.count);
  const start = at !== null && at >= EXCERPT_WIDTH ? at - LEAD : 0;
  const end = Math.min(start + EXCERPT_WIDTH, line.count);
  const text = chars(line, start, end);
  const headEnd = Math.min(EXCERPT_WIDTH, line.count);
  return {
    line: number,
    column,
    text,
    before: start,
    after: line.count - end,
    caret: at === null ? null : at - start,
    head: column === null ? null : start === 0 ? text : chars(line, 0, headEnd),
    headCut: line.count > EXCERPT_WIDTH,
  };
}

/** The excerpt of one raw source line (a line number, its text, a column or null). */
export function excerptFor(number: number, text: string, column: number | null): SourceExcerpt {
  return excerptOf(number, prepare(text), column);
}

/**
 * The physical lines of `text` after line-end normalization (spec 1.1): the numbering of
 * every `line`, so `lines[line - 1]` is the text of line `line`.
 */
export function sourceLines(text: string): readonly string[] {
  return normalizeLineEnds(text).split("\n");
}

/**
 * `diagnostics` with the `excerpt` of the ones that have a source line in `text`, the
 * text of the file they belong to. The same objects come back when none has one.
 */
export function withExcerpts(
  diagnostics: readonly Diagnostic[],
  text: string,
): ReportedDiagnostic[] {
  if (diagnostics.length === 0) return [];
  const lines = sourceLines(text);
  /** Prepared lines of this file by line number: one pass per line, however many diagnostics. */
  const prepared = new Map<number, PreparedLine>();
  return diagnostics.map((diagnostic): ReportedDiagnostic => {
    const number = diagnostic.position?.line ?? anchorLineOf(diagnostic);
    const source = number === null ? undefined : lines[number - 1];
    if (number === null || source === undefined) return diagnostic;
    let line = prepared.get(number);
    if (line === undefined) {
      line = prepare(source);
      prepared.set(number, line);
    }
    return { ...diagnostic, excerpt: excerptOf(number, line, diagnostic.position?.column ?? null) };
  });
}
