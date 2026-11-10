/**
 * Globs of the config (docs/spec.md 6.4). Matched against the path relative to a
 * root, with `/` separators, case-sensitive on every OS.
 *
 * - `*` any characters except `/`; `?` one character except `/`.
 * - `**` as a whole path segment matches zero or more segments
 *   (`a/**` + `/*.md` matches `a/x.md`); a trailing `**` matches the rest.
 * - `[abc]` a class (`[!abc]` and `[^abc]` negate); `{a,b}` alternation.
 * - A leading `.` is matched like any character.
 * - Invalid: empty, absolute, a `..` segment, a leading `!`, unbalanced `[` or `{`.
 */

export interface CompiledGlob {
  /** The glob as written. */
  readonly source: string;
  readonly regex: RegExp;
  /**
   * Leading literal directories of the glob (no glob character, last segment
   * excluded), `""` when none. A walk may start there instead of at the root.
   */
  readonly base: string;
}

export type GlobResult =
  | { readonly ok: true; readonly glob: CompiledGlob }
  | { readonly ok: false; readonly detail: string };

class GlobSyntaxError extends Error {}

const REGEX_SPECIALS = new Set([..."\\^$.*+?()[]{}|/"]);

/** Translate a normalized glob (no leading `./`, `/` separators) to regex source. */
function translate(text: string): string {
  let i = 0;

  const escape = (char: string): string => (REGEX_SPECIALS.has(char) ? `\\${char}` : char);

  /** `[...]` at `text[i]`; returns regex source and moves past the closing bracket. */
  function charClass(): string {
    let start = i + 1;
    const negated = text[start] === "!" || text[start] === "^";
    if (negated) start += 1;
    const close = text.indexOf("]", start + 1);
    if (close < 0) throw new GlobSyntaxError("unbalanced '['");
    const body = [...text.slice(start, close)]
      .map((char) =>
        char === "\\" || char === "[" || char === "]" || char === "^" ? `\\${char}` : char,
      )
      .join("");
    i = close + 1;
    return negated ? `[^/${body}]` : `[${body}]`;
  }

  /** `{a,b}` after the opening brace was consumed. */
  function alternation(): string {
    const alternatives: string[] = [];
    for (;;) {
      alternatives.push(sequence(true));
      if (i >= text.length) throw new GlobSyntaxError("unbalanced '{'");
      const separator = text[i];
      i += 1;
      if (separator === "}") break;
    }
    return `(?:${alternatives.join("|")})`;
  }

  function sequence(inBrace: boolean): string {
    let out = "";
    while (i < text.length) {
      const char = text[i] as string;
      if (inBrace && (char === "," || char === "}")) return out;
      if (char === "}") throw new GlobSyntaxError("unbalanced '}'");
      if (char === "{") {
        i += 1;
        out += alternation();
      } else if (char === "[") {
        out += charClass();
      } else if (char === "*") {
        const startOfSegment = i === 0 || "/{,".includes(text[i - 1] as string);
        const wholeSegment = startOfSegment && text[i + 1] === "*";
        const after = text[i + 2];
        if (wholeSegment && after === "/") {
          out += "(?:[^/]+/)*";
          i += 3;
        } else if (wholeSegment && (after === undefined || (inBrace && ",}".includes(after)))) {
          out += ".+";
          i += 2;
        } else {
          while (text[i] === "*") i += 1;
          out += "[^/]*";
        }
      } else if (char === "?") {
        out += "[^/]";
        i += 1;
      } else {
        out += escape(char);
        i += 1;
      }
    }
    if (inBrace) throw new GlobSyntaxError("unbalanced '{'");
    return out;
  }

  return sequence(false);
}

/**
 * The regex of a translated glob. A pattern the translation let through but
 * the regex engine refuses (a reversed range such as `[z-a]`) is a glob syntax
 * error too, so the config loader reports MTL907 and never throws.
 */
function compileRegex(source: string): RegExp {
  try {
    return new RegExp(`^${source}$`);
  } catch (error) {
    if (error instanceof SyntaxError) throw new GlobSyntaxError("invalid character class");
    throw error;
  }
}

/** Literal leading directories of `text` (see `CompiledGlob.base`). */
function literalBase(text: string): string {
  const base: string[] = [];
  for (const segment of text.split("/").slice(0, -1)) {
    if (/[*?[\]{}]/.test(segment)) break;
    base.push(segment);
  }
  return base.join("/");
}

/** Compile one glob (spec 6.4), or say why it is invalid (spec 6.6 `MTL907`). */
export function compileGlob(source: string): GlobResult {
  const bad = (detail: string): GlobResult => ({ ok: false, detail });
  const slashed = source.replaceAll("\\", "/");
  if (slashed.trim() === "") return bad("empty glob");
  if (slashed.startsWith("!")) return bad("starts with '!' (use exclude)");
  if (slashed.startsWith("/") || /^[A-Za-z]:/.test(slashed)) return bad("absolute path");
  const parts = slashed.split("/");
  if (parts.includes("..")) return bad("contains '..'");
  const text = parts.filter((part) => part !== "" && part !== ".").join("/");
  if (text === "") return bad("empty glob");
  try {
    return {
      ok: true,
      glob: { source, regex: compileRegex(translate(text)), base: literalBase(text) },
    };
  } catch (error) {
    if (error instanceof GlobSyntaxError) return bad(error.message);
    throw error;
  }
}

/** True when `path` (relative to a root, `/` separators) matches `glob`. */
export function matchesGlob(glob: CompiledGlob, path: string): boolean {
  return glob.regex.test(path);
}
