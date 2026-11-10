/**
 * File system helpers of the runner: strict UTF-8 reads and the checks the run
 * does on template, root and target paths. Nothing here throws for a missing or
 * unreadable path.
 */
import { readFile, stat } from "node:fs/promises";

export type ReadResult = { readonly ok: true; readonly text: string } | { readonly ok: false; readonly detail: string };

/** Strict UTF-8 read. The detail is path free (no personal path in a message). */
export async function readUtf8(path: string): Promise<ReadResult> {
  try {
    return {
      ok: true,
      text: new TextDecoder("utf-8", { fatal: true }).decode(await readFile(path)),
    };
  } catch (error) {
    if (error instanceof TypeError) return { ok: false, detail: "file is not valid UTF-8" };
    const code = (error as { code?: unknown }).code;
    return {
      ok: false,
      detail: typeof code === "string" ? `cannot read file (${code})` : "cannot read file",
    };
  }
}

export const isDirectory = async (path: string): Promise<boolean> => {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
};

export const isRegularFile = async (path: string): Promise<boolean> => {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
};

/** `MTL910` when the path does not exist, `MTL911` when it is not a regular file (spec 4.3). */
export async function templateProblem(path: string): Promise<"MTL910" | "MTL911" | null> {
  try {
    return (await stat(path)).isFile() ? null : "MTL911";
  } catch {
    return "MTL910";
  }
}

/** Comparison key of a folded path: case-insensitive on Windows only. */
export const pathKey = (path: string): string => (process.platform === "win32" ? path.toLowerCase() : path);

export const samePath = (a: string, b: string): boolean => pathKey(a) === pathKey(b);
