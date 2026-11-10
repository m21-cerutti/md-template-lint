/**
 * Target discovery (docs/spec.md 6.4): the files below a root that match a pair.
 * Symbolic links to directories are not traversed; only files are targets. A
 * directory that cannot be read counts as empty.
 */
import { readdir, stat } from "node:fs/promises";
import { matchesGlob, type CompiledGlob } from "../config/glob.js";

/**
 * Files below `rootDir` under the given base directories (`""` = the root), as
 * root-relative `/` paths, sorted in plain code-unit order (spec 8.4, locale
 * independent).
 */
export async function listFiles(rootDir: string, bases: readonly string[]): Promise<string[]> {
  const unique = [...new Set(bases)];
  const starts = unique.filter((base) => !unique.some((other) => other !== base && (other === "" || base.startsWith(`${other}/`))));
  const found = new Set<string>();

  async function walk(relative: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(relative === "" ? rootDir : `${rootDir}/${relative}`, {
        withFileTypes: true,
      });
    } catch {
      return;
    }
    for (const entry of entries) {
      const path = relative === "" ? entry.name : `${relative}/${entry.name}`;
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile()) found.add(path);
      else if (entry.isSymbolicLink()) {
        try {
          if ((await stat(`${rootDir}/${path}`)).isFile()) found.add(path);
        } catch {
          // A dangling link is not a target.
        }
      }
    }
  }

  for (const start of starts) {
    if (await existsWithExactCase(rootDir, start)) await walk(start);
  }
  return [...found].sort();
}

/**
 * True when every segment of the directory `base` below `rootDir` exists with exactly
 * this case. Globs are case-sensitive on every OS (AS5): on a case-insensitive file
 * system (Windows, macOS) `readdir("Docs")` would list `docs/` and print `Docs/a.md`.
 */
async function existsWithExactCase(rootDir: string, base: string): Promise<boolean> {
  if (base === "") return true;
  let current = rootDir;
  for (const segment of base.split("/")) {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return false;
    }
    if (!entries.some((entry) => entry.name === segment && entry.isDirectory())) return false;
    current = `${current}/${segment}`;
  }
  return true;
}

/** Targets of a pair below a root: a match of an include and of no exclude (spec 6.3). */
export async function targetsOf(rootDir: string, includes: readonly CompiledGlob[], excludes: readonly CompiledGlob[]): Promise<string[]> {
  const files = await listFiles(
    rootDir,
    includes.map((glob) => glob.base),
  );
  return files.filter((path) => includes.some((glob) => matchesGlob(glob, path)) && !excludes.some((glob) => matchesGlob(glob, path)));
}
