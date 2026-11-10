/** MTL101 filename-case (src/rules/filename.ts, docs/spec.md 2.5, 4.1, 4.3). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL101";
const DIR = "tests/fixtures/pairs/MTL101";

/** Spec 4.3 message of MTL101. */
const message = (stem: string, convention: string): string =>
  `Filename '${stem}' does not match required case [filename:case:${convention}]`;

interface TestCase {
  readonly name: string;
  /** File name the engine sees as the target path. Content comes from the fixture's `target.md`. */
  readonly targetName: string;
  readonly expected: readonly string[];
}

/** Case -> fixture dir (same name) -> expected result: at least 1 passing case and 1 failing case. */
const CASES: readonly TestCase[] = [
  // Silent controls in one run: the first standalone tag (PascalCase) wins over
  // a later one (snake_case); a tag trailing the `slug:` key line is inert; a
  // standalone tag in the target (kebab-case) is inert; the template's own
  // file name (`template.md`, not PascalCase) is never checked.
  {
    name: "pass-stem-matches-template-case-and-inert-tags-stay-silent",
    targetName: "ReleaseNotes2026.md",
    expected: [],
  },
  {
    name: "fail-snake-case-stem-has-uppercase",
    targetName: "Release_Notes.md",
    expected: [message("Release_Notes", "snake_case")],
  },
  {
    name: "fail-snake-case-stem-has-hyphen",
    targetName: "release-notes.md",
    expected: [message("release-notes", "snake_case")],
  },
  {
    name: "fail-snake-case-stem-has-space",
    targetName: "release notes.md",
    expected: [message("release notes", "snake_case")],
  },
  // Only the last extension is removed (Python `Path.stem`).
  {
    name: "fail-snake-case-stem-has-inner-dot",
    targetName: "release.notes.md",
    expected: [message("release.notes", "snake_case")],
  },
  {
    name: "fail-snake-case-extension-only-name-is-whole-stem",
    targetName: ".md",
    expected: [message(".md", "snake_case")],
  },
  // A trailing dot is not an extension separator: `a.` is the whole stem.
  {
    name: "fail-snake-case-trailing-dot-name-is-whole-stem",
    targetName: "a.",
    expected: [message("a.", "snake_case")],
  },
  // Case styles are ASCII only: accented letters never match.
  {
    name: "fail-snake-case-non-ascii-stem",
    targetName: "résumé.md",
    expected: [message("résumé", "snake_case")],
  },
  // An empty file name (the path ends with a separator) gives an empty stem,
  // which matches no case style. Pinned for the engine contract; Python
  // `Path("dir/").stem` would give `dir` instead.
  {
    name: "fail-snake-case-empty-stem",
    targetName: "",
    expected: [message("", "snake_case")],
  },
  {
    name: "fail-kebab-case-stem-has-underscore",
    targetName: "release_notes.md",
    expected: [message("release_notes", "kebab-case")],
  },
  {
    name: "fail-camel-case-stem-starts-uppercase",
    targetName: "ReleaseNotes.md",
    expected: [message("ReleaseNotes", "camelCase")],
  },
  {
    name: "fail-camel-case-stem-has-underscore",
    targetName: "release_notes.md",
    expected: [message("release_notes", "camelCase")],
  },
  {
    name: "fail-pascal-case-stem-starts-lowercase",
    targetName: "releaseNotes.md",
    expected: [message("releaseNotes", "PascalCase")],
  },
  {
    name: "fail-pascal-case-stem-starts-with-digit",
    targetName: "2026Report.md",
    expected: [message("2026Report", "PascalCase")],
  },
  // snake_case (first tag) is checked, kebab-case (second tag) is not: the stem
  // is valid kebab-case and invalid snake_case.
  {
    name: "fail-first-filename-tag-wins-over-later-tag",
    targetName: "release-notes.md",
    expected: [message("release-notes", "snake_case")],
  },
  // The target's own kebab-case tag is inert: the template's snake_case applies.
  {
    name: "fail-target-tag-does-not-override-template-tag",
    targetName: "release-notes.md",
    expected: [message("release-notes", "snake_case")],
  },
];

const read = (path: string): string =>
  readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/**
 * Control outside the pass-/fail- table and outside tests/fixtures/pairs (so the MTL101 split
 * keeps its pass- cases about the tag): a template WITHOUT a `[filename:case:...]` tag never reports
 * MTL101 (spec 2.5), whatever the target file name. `Mixed-Case_Name` breaks all four
 * conventions (uppercase, hyphen and underscore).
 */
const CONTROL_DIR = "tests/fixtures/rule-controls/MTL101-no-filename-tag";
const CONTROL_TARGET = "Mixed-Case_Name.md";

/** Diagnostics of this code for the pair of a fixture folder. */
async function lint(testCase: TestCase, fixture = `${DIR}/${testCase.name}`) {
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
  const found = await checkTarget(
    registry,
    status.model,
    read(`${fixture}/target.md`),
    `${fixture}/${testCase.targetName}`,
    createEnv(),
  );
  return found.filter((diagnostic) => diagnostic.code === CODE);
}

describe("MTL101 filename-case", () => {
  it("is registered in category filename, error, target step filename", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "filename-case",
      category: "filename",
      severity: "error",
      phase: "target",
      step: "filename",
    });
  });

  it("has at least 1 pass- case and at least 1 fail- case, one fixture dir each", () => {
    const passing = CASES.filter((testCase) => testCase.name.startsWith("pass-"));
    const failing = CASES.filter((testCase) => testCase.name.startsWith("fail-"));
    expect(passing.length).toBeGreaterThanOrEqual(1);
    expect(failing.length).toBeGreaterThanOrEqual(1);
    expect(passing.length + failing.length).toBe(CASES.length);
    // The passing case is the only one expecting no diagnostic.
    expect(CASES.filter((testCase) => testCase.expected.length === 0)).toEqual(passing);
    const dirs = readdirSync(fileURLToPath(new URL(`../../../${DIR}`, import.meta.url))).sort();
    expect(dirs).toEqual(CASES.map((testCase) => testCase.name).sort());
  });

  it(`control: ${CONTROL_DIR} (no filename tag) reports nothing for ${CONTROL_TARGET}`, async () => {
    const control = { name: "control", targetName: CONTROL_TARGET, expected: [] };
    expect(await lint(control, CONTROL_DIR)).toEqual([]);
  });

  for (const testCase of CASES) {
    it(`${testCase.name}: ${DIR}/${testCase.name}`, async () => {
      const found = await lint(testCase);
      expect(found.map((diagnostic) => diagnostic.message)).toEqual(testCase.expected);
      for (const diagnostic of found) {
        expect(diagnostic.severity).toBe("error");
        expect(diagnostic.position).toBeNull();
      }
    });
  }
});
