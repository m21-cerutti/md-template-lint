/**
 * Target discovery (docs/spec.md 6.4, 2.8 trust boundary): `listFiles` and `targetsOf`
 * on a temporary tree built in code (symbolic links cannot be committed fixtures).
 * Files are returned sorted in code-unit order; a missing base directory is empty; a
 * base directory must match in case; a symbolic link to a file is a target, a dangling
 * one and a symbolic link to a directory are not. Link tests skip where links cannot
 * be created (Windows without the privilege).
 */
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { compileGlob } from "../../../src/config/glob.js";
import { foldPath } from "../../../src/config/paths.js";
import { listFiles, targetsOf } from "../../../src/runner/walk.js";

let dir = "";
let linksWork = false;

const glob = (source: string) => {
  const result = compileGlob(source);
  if (!result.ok) throw new Error(source);
  return result.glob;
};

beforeAll(() => {
  dir = foldPath(mkdtempSync(join(tmpdir(), "mtl-walk-")));
  mkdirSync(join(dir, "a", "sub"), { recursive: true });
  mkdirSync(join(dir, "empty"));
  writeFileSync(join(dir, "a", "x.md"), "x");
  writeFileSync(join(dir, "a", "B.md"), "B");
  writeFileSync(join(dir, "a", "sub", "y.md"), "y");
  writeFileSync(join(dir, "top.md"), "t");
  try {
    symlinkSync(join(dir, "a", "x.md"), join(dir, "link-to-file.md"), "file");
    symlinkSync(join(dir, "does-not-exist.md"), join(dir, "dangling.md"), "file");
    symlinkSync(join(dir, "a"), join(dir, "link-to-dir"), "junction");
    linksWork = true;
  } catch {
    linksWork = false;
  }
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("listFiles", () => {
  it("lists files below the base directories, sorted in code-unit order", async () => {
    const files = await listFiles(dir, ["a"]);
    expect(files).toEqual(["a/B.md", "a/sub/y.md", "a/x.md"]);
  });

  it("a base of the root lists everything and swallows nested bases", async () => {
    const files = await listFiles(dir, ["a", "", "a/sub"]);
    expect(files).toContain("top.md");
    expect(files).toContain("a/sub/y.md");
    expect(files.filter((path) => path === "a/sub/y.md")).toHaveLength(1);
  });

  it("a missing or empty base directory lists nothing and does not throw", async () => {
    expect(await listFiles(dir, ["nope"])).toEqual([]);
    expect(await listFiles(dir, ["a/missing/deeper"])).toEqual([]);
    expect(await listFiles(dir, ["empty"])).toEqual([]);
    expect(await listFiles(join(dir, "no-such-root"), [""])).toEqual([]);
  });

  it("a base that is a file, not a directory, lists nothing", async () => {
    expect(await listFiles(dir, ["top.md"])).toEqual([]);
  });

  it("a base directory is matched with its exact case (AS5)", async () => {
    expect(await listFiles(dir, ["A"])).toEqual([]);
    expect(await listFiles(dir, ["a/SUB"])).toEqual([]);
  });

  it("a symbolic link to a file is a target; a dangling link and a directory link are not", async (context) => {
    if (!linksWork) context.skip();
    const files = await listFiles(dir, [""]);
    expect(files).toContain("link-to-file.md");
    expect(files).not.toContain("dangling.md");
    expect(files.some((path) => path.startsWith("link-to-dir/"))).toBe(false);
  });
});

describe("targetsOf", () => {
  it("keeps the files that match an include and no exclude", async () => {
    const found = await targetsOf(dir, [glob("a/**/*.md")], [glob("**/B.md")]);
    expect(found).toEqual(["a/sub/y.md", "a/x.md"]);
  });

  it("walks from the literal base of each include only", async () => {
    const found = await targetsOf(dir, [glob("a/sub/*.md"), glob("top.md")], []);
    expect(found).toEqual(["a/sub/y.md", "top.md"]);
  });
});
