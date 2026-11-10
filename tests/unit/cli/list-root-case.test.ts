/**
 * File-list mode and the case of the ROOT directory (docs/spec.md 6.4, AS5). On Windows the
 * file system ignores case, so a working directory typed `c:/projects/x` and a path
 * `C:/Projects/x/docs/a.md` passed by lint-staged are the same place. If the directory part were
 * compared case-sensitively the file would count as "matches no pair" and the gate would pass
 * silently (fail open). Only the directories up to the root are folded; the path BELOW the
 * root keeps its case, because globs are case-sensitive on every OS.
 * Platform-neutral tests drive `listedMatches` with the option on; the Windows tests run the
 * CLI function with a differently written working directory on the fixture
 * tests/fixtures/cli/list-pass-matched-and-unmatched-files/ (shared with the list group, read-only).
 */
import { describe, expect, it } from "vitest";
import { compileGlob } from "../../../src/config/glob.js";
import type { PairConfig } from "../../../src/config/types.js";
import { listedMatches, resolveFileList } from "../../../src/runner/list.js";
import { fixtureFile, lintedOf, parseJson, runCliIn } from "../../helpers/cli.js";

function glob(source: string) {
  const compiled = compileGlob(source);
  if (!compiled.ok) throw new Error(`bad glob ${source}`);
  return compiled.glob;
}

const PAIR: PairConfig = {
  name: "notes",
  template: "templates/t.md",
  templatePath: "/work/proj/templates/t.md",
  templateRoot: "project",
  roots: ["project"],
  include: ["docs/*.md"],
  exclude: [],
  includeGlobs: [glob("docs/*.md")],
  excludeGlobs: [],
  description: null,
  onEmpty: "warn",
};

const files = (...paths: string[]) => resolveFileList({ cwd: "/work/proj", home: "/h", paths });
const relatives = (...paths: string[]) =>
  listedMatches(files(...paths), "/work/proj", PAIR, true).map((match) => match.relative);

describe("file-list roots: the directory part is compared without case when asked", () => {
  it("a root written in another case still contains the file (Windows behaviour)", () => {
    expect(relatives("/Work/Proj/docs/a.md")).toEqual(["docs/a.md"]);
    expect(relatives("/WORK/PROJ/docs/a.md")).toEqual(["docs/a.md"]);
  });

  it("is off by default on a case-sensitive platform: the same path is another place", () => {
    const matches = listedMatches(files("/Work/Proj/docs/a.md"), "/work/proj", PAIR, false);
    expect(matches).toEqual([]);
  });

  it("the path below the root keeps its case: globs stay case-sensitive", () => {
    expect(relatives("/Work/Proj/DOCS/A.MD")).toEqual([]);
    expect(relatives("/work/proj/docs/A.MD")).toEqual([]);
    expect(relatives("/Work/Proj/docs/a.MD")).toEqual([]);
    expect(relatives("/Work/Proj/Docs/a.md")).toEqual([]);
  });

  it("two spellings of the root name one target, linted once", () => {
    expect(
      relatives("/work/proj/docs/a.md", "/Work/Proj/docs/a.md", "/WORK/PROJ/docs/a.md"),
    ).toEqual(["docs/a.md"]);
  });

  it("a sibling directory whose name only starts like the root is not inside it", () => {
    expect(relatives("/Work/Proj-other/docs/a.md")).toEqual([]);
  });
});

describe("file-list roots on Windows: a working directory written in another case", () => {
  const PASS = "list-pass-matched-and-unmatched-files";
  const real = fixtureFile(PASS, ".");
  // Upper case differs from the real path (its names are lower case), and names the same directory.
  const shout = real.toUpperCase();
  const asShouted = { cwd: shout, boundary: shout };

  it.runIf(process.platform === "win32")(
    "a file under the real-case path is linted when the working directory is typed in another case",
    async () => {
      const run = await runCliIn(PASS, ["--format", "json", `${real}/docs/a.md`], asShouted);
      expect(run.exitCode).toBe(0);
      const json = parseJson(run.stdout);
      expect(lintedOf(json)).toEqual(["project:notes:docs/a.md"]);
      expect(json.unmatched).toEqual([]);
    },
  );

  it.runIf(process.platform === "win32")(
    "the same holds the other way round: root written in another case in the argument",
    async () => {
      const run = await runCliIn(PASS, ["--format", "json", `${shout}/docs/a.md`]);
      expect(run.exitCode).toBe(0);
      expect(lintedOf(parseJson(run.stdout))).toEqual(["project:notes:docs/a.md"]);
    },
  );

  it.runIf(process.platform === "win32")(
    "a failing file behind a case-mismatched root is still reported, not skipped",
    async () => {
      // exit 1 (not 0): this is the fail-open the fold prevents.
      const failing = "list-fail-failing-file";
      const dir = fixtureFile(failing, ".");
      const run = await runCliIn(failing, ["--format", "json", `${dir}/docs/b.md`], {
        cwd: dir.toUpperCase(),
        boundary: dir.toUpperCase(),
      });
      expect(run.exitCode).toBe(1);
      expect(lintedOf(parseJson(run.stdout))).toEqual(["project:notes:docs/b.md"]);
    },
  );

  it.runIf(process.platform === "win32")(
    "a file that matches no pair is still exit 0 with `No files linted.`",
    async () => {
      const run = await runCliIn(PASS, [`${shout}/notes.txt`]);
      expect(run.exitCode).toBe(0);
      expect(run.stdout).toContain("No files linted.");
      expect(run.stderr).toBe("");
    },
  );

  it.runIf(process.platform === "win32")(
    "below the root the case still counts: DOCS/A.MD matches no include",
    async () => {
      const run = await runCliIn(PASS, ["--format", "json", `${shout}/DOCS/A.MD`], asShouted);
      const json = parseJson(run.stdout);
      expect(run.exitCode).toBe(0);
      expect(lintedOf(json)).toEqual([]);
      expect(json.unmatched).toHaveLength(1);
    },
  );
});
