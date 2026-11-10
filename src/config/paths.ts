/**
 * Config path resolver (docs/spec.md 6.2, D04). One rule for every path value of
 * the config: `~` expands to the home directory, a drive letter followed by a
 * slash or a leading slash is absolute, anything else is relative to a base
 * directory, `\` is read as `/`, and printed paths always use `/`.
 * Resolution is lexical (no file system access): `..` is folded, symbolic links
 * are not followed.
 */

const DRIVE = /^[A-Za-z]:\//;

/** `\` read as `/` (spec 6.2 rule 4). */
export function toSlashes(path: string): string {
  return path.replaceAll("\\", "/");
}

/** Drive letter followed by a slash, or a leading slash (after `\` is read as `/`). */
export function isAbsolutePath(path: string): boolean {
  const text = toSlashes(path);
  return DRIVE.test(text) || text.startsWith("/");
}

/**
 * Root prefix and segments of a path. The prefix is `""`, `/`, `//` (UNC) or
 * `C:/`; empty and `.` segments are dropped.
 */
function split(path: string): { prefix: string; segments: string[] } {
  const text = toSlashes(path);
  const drive = DRIVE.exec(text);
  let prefix = "";
  if (drive !== null) prefix = drive[0];
  else if (text.startsWith("//") && !text.startsWith("///")) prefix = "//";
  else if (text.startsWith("/")) prefix = "/";
  const segments = text
    .slice(prefix.length)
    .split("/")
    .filter((segment) => segment !== "" && segment !== ".");
  return { prefix, segments };
}

/** Lexically fold `.` and `..`. A `..` above an absolute root is dropped. */
export function foldPath(path: string): string {
  const { prefix, segments } = split(path);
  const folded: string[] = [];
  for (const segment of segments) {
    if (segment !== "..") folded.push(segment);
    else if (folded.length > 0 && folded.at(-1) !== "..") folded.pop();
    else if (prefix === "") folded.push(segment);
  }
  const body = folded.join("/");
  if (prefix === "") return body === "" ? "." : body;
  return `${prefix}${body}`;
}

/**
 * Resolve a config path value (spec 6.2). `home` expands `~`; `baseDir` anchors a
 * relative value. The result is folded and uses `/`.
 */
export function resolvePath(value: string, baseDir: string, home: string): string {
  const text = toSlashes(value.trim());
  if (text === "~") return foldPath(home);
  if (text.startsWith("~/")) return foldPath(`${toSlashes(home)}/${text.slice(2)}`);
  if (isAbsolutePath(text)) return foldPath(text);
  return foldPath(`${toSlashes(baseDir)}/${text}`);
}

/**
 * Path of `path` below `directory` (both folded), or null when it lies outside.
 * The root prefix (drive letter) ignores case; segments are case-sensitive, which
 * fails closed. With `ignoreCase` the segments of `directory` itself (the part up to
 * the root) are compared without regard to case, for a file system that ignores case
 * (Windows): `c:/projects/x` and `C:/Projects/x` are the same directory. The returned
 * rest keeps the case of `path` either way, because globs are case-sensitive on every
 * OS (spec 6.4, AS5).
 */
export function relativeInside(path: string, directory: string, ignoreCase = false): string | null {
  const below = split(foldPath(path));
  const base = split(foldPath(directory));
  if (below.prefix.toLowerCase() !== base.prefix.toLowerCase()) return null;
  const same = (a: string | undefined, b: string): boolean => a !== undefined && (ignoreCase ? a.toLowerCase() === b.toLowerCase() : a === b);
  if (!base.segments.every((segment, index) => same(below.segments[index], segment))) return null;
  const rest = below.segments.slice(base.segments.length).join("/");
  return rest === "" ? "." : rest;
}

/** Printed form of `path`: relative to `base` when inside it, else the absolute folded path. */
export function displayPath(path: string, base: string): string {
  return relativeInside(path, base) ?? foldPath(path);
}
