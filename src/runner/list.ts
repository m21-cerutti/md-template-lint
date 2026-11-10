/**
 * File-list mode (docs/spec.md 7.2, the lint-staged mode): the file arguments of the
 * command line are matched against the pairs by PATH only, with no file system
 * access. A file is a target of a pair on a root when its path relative to the root
 * matches an include and no exclude; the template of the pair is never a target.
 * Arguments are relative to the working directory or absolute, with either slash.
 */
import { homedir } from "node:os";
import { matchesGlob } from "../config/glob.js";
import { displayPath, foldPath, relativeInside, resolvePath } from "../config/paths.js";
import type { PairConfig } from "../config/types.js";
import { pathKey } from "./files.js";

export interface FileListInput {
  /** Working directory (absolute): relative arguments are relative to it. */
  readonly cwd: string;
  /** Home directory for `~` (default: the OS home). */
  readonly home?: string;
  /** The file arguments as given. */
  readonly paths: readonly string[];
}

/** One distinct file argument. */
export interface ListedFile {
  /** Comparison key of the resolved path. */
  readonly key: string;
  /** Resolved, folded absolute path. */
  readonly path: string;
  /** Printed form: relative to the working directory when inside it, `/` separators. */
  readonly shown: string;
}

/** A listed file that is a target of one pair on one root. */
export interface ListedMatch {
  readonly file: ListedFile;
  /** Root-relative path. */
  readonly relative: string;
}

/**
 * Identity of an argument: the resolved path with the drive letter folded to lower case.
 * Only the drive ignores case, as in `relativeInside` and as the globs are case-sensitive
 * on every OS (AS5): `DOCS/A.MD` is another argument than `docs/a.md` (it matches no glob)
 * whatever the order of the arguments, so one spelling never hides the other.
 */
const argumentKey = (path: string): string => path.replace(/^[A-Za-z]:\//, (drive) => drive.toLowerCase());

/** Resolve the arguments; the same file given twice is kept once, in argument order. */
export function resolveFileList(input: FileListInput): ListedFile[] {
  const home = input.home ?? homedir();
  const cwd = foldPath(input.cwd);
  const seen = new Map<string, ListedFile>();
  for (const given of input.paths) {
    const path = resolvePath(given, cwd, home);
    const key = argumentKey(path);
    if (!seen.has(key)) seen.set(key, { key, path, shown: displayPath(path, cwd) });
  }
  return [...seen.values()];
}

/**
 * Targets of `pair` among the listed files on the root `rootDir`, sorted by relative path.
 *
 * `ignoreRootCase` (default: on Windows) compares the directories from the file system root
 * to `rootDir` without regard to case, because the file system does: with the working
 * directory typed `c:/projects/x`, the path `C:/Projects/x/docs/a.md` that lint-staged passes
 * is still in the project. Without it such a file would be skipped as "matches no pair" and the
 * gate would pass silently. Everything BELOW the root keeps its case: globs are case-sensitive
 * on every OS (AS5, spec 6.4), so `DOCS/A.MD` still matches no include.
 */
export function listedMatches(files: readonly ListedFile[], rootDir: string, pair: PairConfig, ignoreRootCase: boolean = process.platform === "win32"): ListedMatch[] {
  const templateKey = pathKey(pair.templatePath);
  const out: ListedMatch[] = [];
  const seen = new Set<string>();
  for (const file of files) {
    const relative = relativeInside(file.path, rootDir, ignoreRootCase);
    if (relative === null || relative === ".") continue;
    if (!pair.includeGlobs.some((glob) => matchesGlob(glob, relative))) continue;
    if (pair.excludeGlobs.some((glob) => matchesGlob(glob, relative))) continue;
    if (pathKey(foldPath(`${rootDir}/${relative}`)) === templateKey) continue;
    // Two spellings of the root directory name the same target: keep the first.
    if (seen.has(relative)) continue;
    seen.add(relative);
    out.push({ file, relative });
  }
  return out.sort((a, b) => (a.relative < b.relative ? -1 : a.relative > b.relative ? 1 : 0));
}
