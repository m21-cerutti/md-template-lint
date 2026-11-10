/**
 * Field subject of a finding: the key name as the `yaml` package reports it.
 * Surrounding quotes are stripped; `''` is decoded in a single-quoted key and
 * the YAML escapes in a double-quoted key (YAML 1.2, 5.7).
 */
import type { TagSubject } from "./ast.js";

/** One-character YAML double-quoted escapes. */
const YAML_ESCAPES: Readonly<Record<string, string>> = {
  "0": "\0",
  a: "\x07",
  b: "\b",
  t: "\t",
  "\t": "\t",
  n: "\n",
  v: "\v",
  f: "\f",
  r: "\r",
  e: "\x1b",
  " ": " ",
  '"': '"',
  "/": "/",
  "\\": "\\",
  N: "\u0085",
  _: "\u00a0",
  L: "\u2028",
  P: "\u2029",
};

/** Hex digit count of the `\x`, `\u` and `\U` escapes. */
const YAML_HEX_ESCAPES: Readonly<Record<string, number>> = { x: 2, u: 4, U: 8 };
const HEX_DIGITS = "0123456789abcdefABCDEF";

/** Decode the body of a double-quoted YAML scalar; unknown escapes are kept as written. */
function decodeDoubleQuoted(body: string): string {
  let out = "";
  for (let i = 0; i < body.length; i += 1) {
    const char = body.charAt(i);
    if (char !== "\\" || i + 1 >= body.length) {
      out += char;
      continue;
    }
    const code = body.charAt(i + 1);
    const simple = YAML_ESCAPES[code];
    const hexLength = YAML_HEX_ESCAPES[code];
    if (simple !== undefined) {
      out += simple;
      i += 1;
    } else if (hexLength !== undefined) {
      const hex = body.slice(i + 2, i + 2 + hexLength);
      const allHex = hex.length === hexLength && [...hex].every((d) => HEX_DIGITS.includes(d));
      const value = allHex ? Number.parseInt(hex, 16) : -1;
      if (value >= 0 && value <= 0x10ffff) {
        out += String.fromCodePoint(value);
        i += 1 + hexLength;
      } else {
        out += char;
      }
    } else {
      out += char;
    }
  }
  return out;
}

export function keySubject(key: string): TagSubject {
  const first = key.charAt(0);
  const quoted = key.length >= 2 && (first === '"' || first === "'") && key.endsWith(first);
  if (!quoted) return { field: key };
  const body = key.slice(1, -1);
  return { field: first === "'" ? body.replaceAll("''", "'") : decodeDoubleQuoted(body) };
}
