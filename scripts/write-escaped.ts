// Write a file from an ESCAPED text, so control characters (U+001C, U+0085, ...) that the
// Write tool drops never appear in the command text:
//   node scripts/write-escaped.ts <path> <escaped-text>
//
// Escapes decoded in <escaped-text>: \n \r \t \\ \xHH \uHHHH \u{H+}. Any other escape, a lone
// surrogate, a code point above U+10FFFF or a trailing backslash is an error.
// Output is UTF-8, no BOM unless \uFEFF is in the text.
// <path> is relative to the repo root (the parent of scripts/) or absolute inside it.
// Writes are limited to tests/fixtures/ (create or overwrite) and the git-ignored tmp/ (create
// only), file extension .md .txt .json .yml or .yaml only (case-insensitive; anything a test
// runner or shell could execute is refused). Refused (exit 1, nothing written): any other
// place or extension; a path outside the repo root
// (links resolved with realpathSync.native); a secret-like, `.git`, `node_modules`, 8.3 short
// name (`~1`) or Windows device name segment; a UNC, `\\?\` or drive-relative path; a
// directory; an existing file with hard links. Node built-ins only. The pure functions are
// exported for tests.
import { existsSync, lstatSync, mkdirSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const HEX = /^[0-9a-fA-F]+$/;
const MAX_CODE_POINT = 0x10ffff;
const USAGE = "usage: node scripts/write-escaped.ts <path> <escaped-text>";
const DEVICE = /^(con|prn|aux|nul|conin\$|conout\$|com[1-9]|lpt[1-9])$/;

const isHighSurrogate = (unit: number): boolean => unit >= 0xd800 && unit <= 0xdbff;
const isLowSurrogate = (unit: number): boolean => unit >= 0xdc00 && unit <= 0xdfff;

/** Exactly `length` hex digits of `text` from `start`, as a number. */
function hexValue(text: string, start: number, length: number, escape: string): number {
  const digits = text.slice(start, start + length);
  if (digits.length !== length || !HEX.test(digits)) {
    throw new Error(`malformed escape: ${escape} needs ${length} hex digits`);
  }
  return Number.parseInt(digits, 16);
}

/** Decode one `\u` escape whose `u` is at `text[at - 1]`. Returns the text and the next index. */
function decodeUnicode(text: string, at: number): { value: string; next: number } {
  if (text.charAt(at) === "{") {
    const close = text.indexOf("}", at);
    const digits = close < 0 ? "" : text.slice(at + 1, close);
    if (!HEX.test(digits)) throw new Error("malformed escape: \\u{...} needs 1 or more hex digits");
    const codePoint = Number.parseInt(digits, 16);
    if (codePoint > MAX_CODE_POINT) throw new Error(`code point above U+10FFFF: \\u{${digits}}`);
    if (isHighSurrogate(codePoint) || isLowSurrogate(codePoint)) {
      throw new Error(`lone surrogate: \\u{${digits}}`);
    }
    return { value: String.fromCodePoint(codePoint), next: close + 1 };
  }
  const unit = hexValue(text, at, 4, "\\u");
  if (isLowSurrogate(unit)) throw new Error("lone low surrogate in \\uHHHH");
  if (!isHighSurrogate(unit)) return { value: String.fromCharCode(unit), next: at + 4 };
  if (text.slice(at + 4, at + 6) !== "\\u") throw new Error("lone high surrogate in \\uHHHH");
  const low = hexValue(text, at + 6, 4, "\\u");
  if (!isLowSurrogate(low)) throw new Error("lone high surrogate in \\uHHHH");
  return { value: String.fromCharCode(unit, low), next: at + 10 };
}

/** Escaped text to real characters. Throws an Error on any bad escape. */
export function decodeEscapes(text: string): string {
  let out = "";
  let i = 0;
  while (i < text.length) {
    const char = text.charAt(i);
    if (char !== "\\") {
      out += char;
      i += 1;
      continue;
    }
    const kind = text.charAt(i + 1);
    if (kind === "") throw new Error("trailing backslash");
    i += 2;
    if (kind === "n") out += "\n";
    else if (kind === "r") out += "\r";
    else if (kind === "t") out += "\t";
    else if (kind === "\\") out += "\\";
    else if (kind === "x") {
      out += String.fromCodePoint(hexValue(text, i, 2, "\\x"));
      i += 2;
    } else if (kind === "u") {
      const decoded = decodeUnicode(text, i);
      out += decoded.value;
      i = decoded.next;
    } else {
      throw new Error(`unknown escape: \\${kind}`);
    }
  }
  return out;
}

/** Why a path segment is refused, or null. Case-insensitive; trailing dots and spaces dropped. */
function refusedSegment(segment: string): string | null {
  // 8.3 short names (GIT~1, NODE_M~1, SECRET~1) hide the real name from the checks below.
  if (/~\d/.test(segment)) return `short-name segment '${segment}' (contains ~digit)`;
  const name = segment.toLowerCase().replace(/[. ]+$/, "");
  const secretLike =
    name.startsWith(".env") ||
    name.endsWith(".env") ||
    name.includes("secret") ||
    name.includes("credential") ||
    name.endsWith(".pem") ||
    name.endsWith(".key") ||
    name.startsWith("id_rsa") ||
    name.startsWith("id_ed25519") ||
    name === ".ssh" ||
    name === ".npmrc" ||
    name === "auth.json";
  if (secretLike) return `secret-like segment '${segment}'`;
  if (name === ".git" || name === "node_modules") return `forbidden segment '${segment}'`;
  if (DEVICE.test((name.split(".")[0] ?? "").trimEnd())) {
    return `Windows device name '${segment}'`;
  }
  if (segment.includes(":")) return `segment '${segment}' contains ':'`;
  return null;
}

/** Segments of `path` below `root` ([] for the root itself), or null when outside it. */
function segmentsBelow(root: string, path: string): string[] | null {
  const rel = relative(root, path);
  if (rel === "") return [];
  if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) return null;
  return rel.split(/[\\/]/);
}

/**
 * `path` with its nearest existing ancestor canonicalised by the OS (realpathSync.native:
 * symlinks and junctions followed, 8.3 short names expanded, real letter case). The part
 * that does not exist yet is kept as typed; its short names are refused by refusedSegment.
 */
function canonicalPath(path: string): string {
  let existing = path;
  while (!existsSync(existing)) {
    const parent = dirname(existing);
    if (parent === existing) break;
    existing = parent;
  }
  return join(realpathSync.native(existing), relative(existing, path));
}

/** A checked target: absolute path, canonical root-relative segments, overwrite or creation. */
export interface Target {
  readonly path: string;
  readonly segments: readonly string[];
  readonly overwrite: boolean;
}

/** Writes are limited to tests/fixtures/ (create or overwrite) and tmp/ (create only). */
const inFixtures = (segments: readonly string[]): boolean => segments[0] === "tests" && segments[1] === "fixtures" && segments.length >= 3;
const inTmp = (segments: readonly string[]): boolean => segments[0] === "tmp" && segments.length >= 2;

function refuseSegments(segments: readonly string[]): void {
  for (const segment of segments) {
    const reason = refusedSegment(segment);
    if (reason !== null) throw new Error(`refusing path: ${reason}`);
  }
}

/** Data files only: a written `.test.mjs` or `.ts` would be run by `pnpm test` or `node`. */
const ALLOWED_EXTENSIONS = [".md", ".txt", ".json", ".yml", ".yaml"];

/** Refuse unless every name ends with an allowed extension (case-insensitive). */
function refuseExtension(...names: readonly (string | undefined)[]): void {
  for (const name of names) {
    const clean = (name ?? "").toLowerCase().replace(/[. ]+$/, "");
    const dot = clean.lastIndexOf(".");
    if (dot <= 0 || !ALLOWED_EXTENSIONS.includes(clean.slice(dot))) {
      throw new Error(`refusing path: extension not allowed, use one of ${ALLOWED_EXTENSIONS.join(" ")}`);
    }
  }
}

/** Resolve and check `input` against the repo `root`. Throws an Error to refuse. */
export function checkTarget(root: string, input: string): Target {
  // UNC, \\?\ and \\.\ forms and drive-relative `D:x` are never a repo-relative path.
  if (/^[\\/]{2}/.test(input) || /^[A-Za-z]:(?![\\/])/.test(input)) {
    throw new Error(`refusing path: '${input}' is a UNC, device or drive-relative path`);
  }
  const realRoot = realpathSync.native(root);
  const path = resolve(realRoot, input);
  const typed = segmentsBelow(realRoot, path);
  if (typed === null || typed.length === 0) {
    throw new Error(`refusing path: '${input}' is the repo root or outside it`);
  }
  refuseSegments(typed);

  // The canonical path is where the write really lands: links followed, short names expanded.
  const canonical = segmentsBelow(realRoot, canonicalPath(path));
  if (canonical === null || canonical.length === 0) {
    throw new Error(`refusing path: '${input}' resolves outside the repo`);
  }
  refuseSegments(canonical);
  if (!inFixtures(canonical) && !inTmp(canonical)) {
    throw new Error("refusing path: writes are limited to tests/fixtures/ and tmp/");
  }

  // lstat sees a dangling symlink too; writing through one could create a file elsewhere.
  if (lstatSync(path, { throwIfNoEntry: false }) === undefined) {
    refuseExtension(typed.at(-1), canonical.at(-1));
    return { path, segments: canonical, overwrite: false };
  }
  let real: string;
  try {
    real = realpathSync.native(path);
  } catch {
    throw new Error(`refusing path: '${input}' is a dangling symlink`);
  }
  const stat = statSync(real);
  if (stat.isDirectory()) throw new Error(`refusing path: '${input}' is a directory`);
  refuseExtension(typed.at(-1), canonical.at(-1));
  if (!inFixtures(canonical)) {
    throw new Error(`refusing to overwrite '${input}': only files in tests/fixtures/`);
  }
  if (stat.nlink > 1) throw new Error(`refusing to overwrite '${input}': it has hard links`);
  return { path, segments: canonical, overwrite: true };
}

/** Decode `escaped`, check `input` and write the file. Returns the display path and byte count. */
export function writeEscaped(root: string, input: string, escaped: string): { path: string; bytes: number } {
  const content = Buffer.from(decodeEscapes(escaped), "utf8");
  const target = checkTarget(root, input);
  mkdirSync(dirname(target.path), { recursive: true });
  // "wx" fails on an existing file, so a file created after the check is never overwritten.
  writeFileSync(target.path, content, { flag: target.overwrite ? "w" : "wx" });
  return { path: target.segments.join("/"), bytes: content.length };
}

/** CLI body. Returns the exit code: 0 ok, 1 refused or failed, 2 usage. */
export function main(argv: readonly string[], root: string): number {
  const [path, escaped] = argv;
  if (argv.length !== 2 || path === undefined || escaped === undefined) {
    process.stderr.write(`write-escaped: ${USAGE}\n`);
    return 2;
  }
  try {
    const result = writeEscaped(root, path, escaped);
    process.stdout.write(`write-escaped: wrote ${result.path} (${result.bytes} bytes)\n`);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`write-escaped: ${message}\n`);
    return 1;
  }
}

const scriptFile = fileURLToPath(import.meta.url);

function isEntryPoint(): boolean {
  const entry = process.argv[1];
  if (entry === undefined) return false;
  try {
    return realpathSync(resolve(entry)) === realpathSync(scriptFile);
  } catch {
    return false;
  }
}

if (isEntryPoint()) {
  process.exitCode = main(process.argv.slice(2), resolve(dirname(scriptFile), ".."));
}
