/**
 * Output sanitizing (docs/spec.md 8, OWASP A03). Messages echo values of the
 * linted documents (field values, headings, file names). A value holding an
 * ANSI escape or a bidi override must not reach a terminal or a log viewer.
 *
 * - line breaks and other whitespace controls (tab, CR, LF, VT, FF, NEL, U+2028,
 *   U+2029) become one space, so a diagnostic stays on one line;
 * - every other C0/C1 control, DEL, the bidi controls and the invisible format
 *   characters (soft hyphen, zero-width, word joiner and invisible operators,
 *   interlinear annotation, tag characters) are shown as an escape (`\x1b`,
 *   `\u202e`, `\u{e0001}` above U+FFFF).
 */

const SPACING = new Set([0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x85, 0x2028, 0x2029]);

function isUnsafe(code: number): boolean {
  return (
    code < 0x20 ||
    (code >= 0x7f && code <= 0x9f) ||
    code === 0x00ad ||
    code === 0x061c ||
    code === 0x180e ||
    (code >= 0x200b && code <= 0x200f) ||
    (code >= 0x202a && code <= 0x202e) ||
    (code >= 0x2060 && code <= 0x2064) ||
    (code >= 0x2066 && code <= 0x2069) ||
    code === 0xfeff ||
    (code >= 0xfff9 && code <= 0xfffb) ||
    (code >= 0xe0000 && code <= 0xe007f)
  );
}

const hex = (code: number, width: number): string => code.toString(16).padStart(width, "0");

const escapeOf = (code: number): string => {
  if (code <= 0xff) return `\\x${hex(code, 2)}`;
  return code <= 0xffff ? `\\u${hex(code, 4)}` : `\\u{${hex(code, 1)}}`;
};

/** Safe, single-line text for any output channel. */
export function cleanText(text: string): string {
  let out = "";
  let spaced = false;
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (SPACING.has(code)) {
      if (!spaced) out += " ";
      spaced = true;
      continue;
    }
    spaced = false;
    out += isUnsafe(code) ? escapeOf(code) : char;
  }
  return out;
}

/**
 * One character as `cleanText` shows it, without collapsing: a whitespace control is
 * one space, an unsafe character its escape, anything else itself. A source excerpt
 * uses it so the caret column stays aligned (docs/spec.md 8.2, EX3).
 */
export function cleanChar(char: string): string {
  const code = char.codePointAt(0) ?? 0;
  if (SPACING.has(code)) return " ";
  return isUnsafe(code) ? escapeOf(code) : char;
}
