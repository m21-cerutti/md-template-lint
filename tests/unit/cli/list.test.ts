/**
 * CLI file-list mode, the lint-staged mode (docs/spec.md 7.2): each argument is matched
 * against the pairs by path, a file that matches no pair is skipped (and reported in
 * `unmatched`), a matching file that does not exist is MTL912 and the others are
 * still linted. Fixtures: tests/fixtures/cli/list-<case>/ (read through `--format json`).
 * The cases of this group use only their own fixtures; the group reads no other one.
 */
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { expectSplit, REPO_ROOT } from "../../helpers/fixtures.js";
import { fixtureFile, lintedOf, parseJson, runCliIn } from "../../helpers/cli.js";

const GROUP = "list-";
const PASS = `${GROUP}pass-matched-and-unmatched-files`;

interface Case {
  readonly name: string;
  readonly args: readonly string[];
  readonly exitCode: 0 | 1 | 2;
  /** `root:pair:path` of the linted files, in output order (not argument order). */
  readonly linted: readonly string[];
  readonly unmatched: readonly string[];
  readonly runErrors: readonly { code: string; message: string }[];
}

const MISSING_GONE = { code: "MTL912", message: "target not found: docs/gone.md" };

/** Exactly 1 passing case, failing cases >= passing; one fixture directory per case. */
const CASES: readonly Case[] = [
  {
    // lint-staged passes every staged .md: an excluded one, a non-Markdown file and the
    // template itself match no pair and are skipped.
    name: "pass-matched-and-unmatched-files",
    args: ["notes.txt", "docs/a.md", "docs/README.md", "templates/note.template.md"],
    exitCode: 0,
    linted: ["project:notes:docs/a.md"],
    unmatched: ["notes.txt", "docs/README.md", "templates/note.template.md"],
    runErrors: [],
  },
  {
    name: "fail-failing-file",
    args: ["docs/b.md", "docs/a.md"],
    exitCode: 1,
    linted: ["project:notes:docs/a.md", "project:notes:docs/b.md"],
    unmatched: [],
    runErrors: [],
  },
  {
    // The missing file is MTL912 (exit 2), the other file is still linted (change C01).
    name: "fail-missing-target-file",
    args: ["docs/gone.md", "docs/a.md"],
    exitCode: 2,
    linted: ["project:notes:docs/a.md"],
    unmatched: [],
    runErrors: [MISSING_GONE],
  },
  {
    // The path is matched against the root of the pair: data/docs/b.md is docs/b.md on `data`.
    name: "fail-external-root",
    args: ["data/docs/b.md"],
    exitCode: 1,
    linted: ["data:notes:docs/b.md"],
    unmatched: [],
    runErrors: [],
  },
  {
    // A file that two pairs match is linted once per pair, but its absence is reported once.
    name: "fail-missing-file-in-two-pairs",
    args: ["docs/gone.md", "docs/a.md"],
    exitCode: 2,
    linted: ["project:first:docs/a.md", "project:second:docs/a.md"],
    unmatched: [],
    runErrors: [MISSING_GONE],
  },
  {
    // A directory named like a target is not a regular file: MTL912, not a crash.
    name: "fail-directory-as-file",
    args: ["docs/folder.md", "docs/a.md"],
    exitCode: 2,
    linted: ["project:notes:docs/a.md"],
    unmatched: [],
    runErrors: [{ code: "MTL912", message: "target not found: docs/folder.md" }],
  },
  {
    // A config error stops before any lint, also with file arguments.
    name: "fail-config-invalid",
    args: ["docs/a.md"],
    exitCode: 2,
    linted: [],
    unmatched: [],
    runErrors: [
      { code: "MTL904", message: "pairs[0].include: required key is missing" },
      { code: "MTL903", message: "pairs[0].inlcude: unknown key 'inlcude'" },
    ],
  },
  {
    // The template of the pair of a listed file is missing: MTL910 (exit 2).
    name: "fail-template-missing",
    args: ["docs/a.md"],
    exitCode: 2,
    linted: [],
    unmatched: [],
    runErrors: [
      {
        code: "MTL910",
        message: "template not found: templates/missing.template.md (pair 'ghost')",
      },
    ],
  },
];

const lint = (fixture: string, args: readonly string[], extra: readonly string[] = []) =>
  runCliIn(fixture, ["--format", "json", ...extra, ...args]);

describe("cli file-list mode: layout", () => {
  it("has exactly 1 pass- case, at least as many fail- cases, one directory each", () => {
    expectSplit("cli", GROUP, CASES);
  });
});

describe("cli file-list mode (spec 7.2)", () => {
  for (const testCase of CASES) {
    it(`${testCase.name}: exit ${testCase.exitCode}`, async () => {
      const run = await lint(`${GROUP}${testCase.name}`, testCase.args);
      const json = parseJson(run.stdout);
      expect(run.exitCode).toBe(testCase.exitCode);
      expect(lintedOf(json)).toEqual(testCase.linted);
      expect(json.unmatched).toEqual(testCase.unmatched);
      expect(json.runErrors.map(({ code, message }) => ({ code, message }))).toEqual(
        testCase.runErrors,
      );
      expect(json.runWarnings).toEqual([]);
    });
  }
});

describe("cli file-list mode: path forms", () => {
  const clean = ["project:notes:docs/a.md"];

  it("takes the file as relative, ./relative, backslash, absolute and absolute backslash", async () => {
    const absolute = fixtureFile(PASS, "docs/a.md");
    const forms = [
      "docs/a.md",
      "./docs/a.md",
      "docs\\a.md",
      absolute,
      absolute.replaceAll("/", "\\"),
      `${fixtureFile(PASS, "docs")}/../docs/a.md`,
    ];
    for (const form of forms) {
      const run = await lint(PASS, [form]);
      expect(run.exitCode, form).toBe(0);
      expect(lintedOf(parseJson(run.stdout)), form).toEqual(clean);
    }
  });

  it.runIf(process.platform === "win32")("ignores the case of the drive letter", async () => {
    const absolute = fixtureFile(PASS, "docs/a.md");
    const drive = absolute.charAt(0);
    const other = drive === drive.toLowerCase() ? drive.toUpperCase() : drive.toLowerCase();
    const flipped = `${other}${absolute.slice(1)}`;
    const run = await lint(PASS, [flipped]);
    expect(lintedOf(parseJson(run.stdout))).toEqual(clean);
    // The same file under both drive spellings is one argument.
    const both = await lint(PASS, [flipped, absolute]);
    expect(lintedOf(parseJson(both.stdout))).toEqual(clean);
  });

  it("lints a file given twice, in two spellings, once", async () => {
    const run = await lint(PASS, ["docs/a.md", "./docs/a.md", fixtureFile(PASS, "docs/a.md")]);
    expect(lintedOf(parseJson(run.stdout))).toEqual(clean);
  });

  it("a spelling that differs only by case is another argument, in either order", async () => {
    // Globs are case-sensitive on every OS (AS5), so DOCS/A.MD matches no include. It
    // must not hide docs/a.md (nor be hidden by it), whichever comes first. On Windows,
    // where the file system ignores case, it names the same file; the rule is the same.
    for (const args of [
      ["DOCS\\A.MD", "docs/a.md"],
      ["docs/a.md", "DOCS\\A.MD"],
    ]) {
      const run = await lint(PASS, args);
      const json = parseJson(run.stdout);
      expect(run.exitCode, args.join(" ")).toBe(0);
      expect(lintedOf(json), args.join(" ")).toEqual(clean);
      expect(json.unmatched, args.join(" ")).toEqual(["DOCS/A.MD"]);
    }
  });

  it("a relative path that leaves the working directory is judged by where it lands", async () => {
    const outside = await lint(PASS, ["../list-fail-failing-file/docs/b.md"]);
    const json = parseJson(outside.stdout);
    expect(outside.exitCode).toBe(0);
    expect(lintedOf(json)).toEqual([]);
    // Outside the working directory it is printed absolute, with `/` separators.
    expect(json.unmatched).toHaveLength(1);
    expect(json.unmatched[0]).toMatch(/\/list-fail-failing-file\/docs\/b\.md$/);
    expect(json.unmatched[0]).toMatch(/^([A-Za-z]:)?\//);
    expect(json.unmatched[0]).not.toContain("\\");

    // Leaving and coming back lands on the same file.
    const back = await lint(PASS, [`../${PASS}/docs/a.md`]);
    expect(lintedOf(parseJson(back.stdout))).toEqual(clean);
  });

  it("an absolute path outside every root matches no pair: exit 0, reported as unmatched", async () => {
    const outside = join(REPO_ROOT, "package.json");
    const run = await lint(PASS, [outside]);
    const json = parseJson(run.stdout);
    expect(run.exitCode).toBe(0);
    expect(lintedOf(json)).toEqual([]);
    expect(json.unmatched).toHaveLength(1);
    expect(json.unmatched[0]).toMatch(/\/package\.json$/);
    expect(json.unmatched[0]).not.toContain("\\");
    expect(json.summary).toMatchObject({ files: 0, exitCode: 0 });
  });

  it("an absolute path of a file inside the project with no pair match exits 0", async () => {
    const run = await runCliIn(PASS, [fixtureFile(PASS, "notes.txt")]);
    expect(run.exitCode).toBe(0);
    expect(run.stdout).toContain("No files linted.");
    expect(run.stderr).toBe("");
  });

  it("a missing file that matches no pair is skipped, not MTL912", async () => {
    const run = await lint(PASS, ["gone.txt"]);
    expect(run.exitCode).toBe(0);
    expect(parseJson(run.stdout)).toMatchObject({ unmatched: ["gone.txt"], runErrors: [] });
  });

  it("a missing file given twice is reported once", async () => {
    const run = await lint(`${GROUP}fail-missing-target-file`, ["docs/gone.md", "./docs/gone.md"]);
    expect(parseJson(run.stdout).runErrors).toHaveLength(1);
    expect(run.exitCode).toBe(2);
  });

  it("a directory that matches no include is only skipped", async () => {
    const run = await lint(`${GROUP}fail-directory-as-file`, ["docs"]);
    expect(run.exitCode).toBe(0);
    expect(parseJson(run.stdout)).toMatchObject({ unmatched: ["docs"], runErrors: [] });
  });

  it("-- lets a file name start with a dash", async () => {
    const run = await lint(PASS, ["--", "-odd.txt"]);
    expect(run.exitCode).toBe(0);
    expect(parseJson(run.stdout).unmatched).toEqual(["-odd.txt"]);
  });

  it("-- with no file after it is a full run, not an empty file list", async () => {
    const bare = await runCliIn(PASS, ["--"]);
    expect(bare).toEqual(await runCliIn(PASS, []));
    expect(bare.stdout).toContain("✓ docs/a.md");
    const json = parseJson((await lint(PASS, ["--"])).stdout);
    expect(lintedOf(json)).toEqual(["project:notes:docs/a.md"]);
    expect(json.unmatched).toEqual([]);
  });
});

describe("cli file-list mode: other modes of failure", () => {
  it("no MTL913 in file-list mode: a pair no argument falls into is silent", async () => {
    const run = await lint(`${GROUP}fail-external-root`, ["docs/a.md"]);
    const json = parseJson(run.stdout);
    expect(run.exitCode).toBe(0);
    expect(json.runWarnings).toEqual([]);
    expect(json.unmatched).toEqual(["docs/a.md"]);
  });

  it("--quiet prints nothing when every listed file is skipped", async () => {
    const run = await runCliIn(PASS, ["--quiet", "notes.txt", "docs/README.md"]);
    expect(run).toMatchObject({ stdout: "", stderr: "", exitCode: 0 });
  });

  it("--quiet prints only the failing file", async () => {
    const run = await runCliIn(`${GROUP}fail-failing-file`, ["--quiet", "docs/a.md", "docs/b.md"]);
    expect(run.exitCode).toBe(1);
    expect(run.stdout).toContain("✗ docs/b.md");
    expect(run.stdout).not.toContain("docs/a.md");
  });
});
