/**
 * Output sanitizing (docs/spec.md 8, OWASP A03). Messages echo values of the
 * linted documents (field values, headings, file names). A value holding an
 * ANSI escape or a bidi override must not reach a terminal or a log viewer.
 *
 * - line breaks and other whitespace controls (tab, CR, LF, VT, FF, NEL, U+2028,
 *   U+2029) become one space, so a diagnostic stays on one line;
 * - every other C0/C1 control, DEL and the bidi controls are shown as an escape
 *   (`\x1b`, `\u202e`).
 */

const SPACING = new Set([0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x85, 0x2028, 0x2029]);

function isUnsafe(code: number): boolean {
  return (
    code < 0x20 ||
    (code >= 0x7f && code <= 0x9f) ||
    code === 0x061c ||
    code === 0x200e ||
    code === 0x200f ||
    (code >= 0x202a && code <= 0x202e) ||
    (code >= 0x2066 && code <= 0x2069) ||
    code === 0xfeff
  );
}

const hex = (code: number, width: number): string => code.toString(16).padStart(width, "0");

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
    if (!isUnsafe(code)) out += char;
    else out += code <= 0xff ? `\\x${hex(code, 2)}` : `\\u${hex(code, 4)}`;
  }
  return out;
}
