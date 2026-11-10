/**
 * Runner: a broken template skips only the files of its pair (docs/spec.md 8.2, C02,
 * D16). Fixtures: tests/fixtures/runner/broken-<case>/.
 */
import { describe, expect, it } from "vitest";
import { report } from "../../../src/reporters/index.js";
import { expectSplit } from "../../helpers/fixtures.js";
import { lintedFiles, runFixture } from "../../helpers/run.js";

const GROUP = "broken-";
const NO_FRONTMATTER = "File must have YAML frontmatter (---...---)";

interface Case {
  readonly name: string;
  readonly exitCode: 0 | 1;
  readonly linted: readonly string[];
  readonly summary: Record<string, number>;
  readonly broken: readonly { path: string; message: string }[];
}

/** At least 1 passing case and 1 failing case; one fixture directory per case. */
const CASES: readonly Case[] = [
  {
    name: "pass-clean-two-pairs",
    exitCode: 0,
    linted: ["project:docs:docs/a.md", "project:extra:extra/c.md"],
    // One template shared by two pairs counts once.
    summary: { files: 2, passed: 2, failed: 0, templatesChecked: 1, templatesBroken: 0 },
    broken: [],
  },
  {
    name: "fail-skips-only-its-pair",
    exitCode: 1,
    linted: ["project:good:docs/a.md", "project:good:docs/b.md"],
    summary: { files: 2, passed: 1, failed: 1, templatesChecked: 2, templatesBroken: 1 },
    broken: [{ path: "templates/broken.template.md", message: NO_FRONTMATTER }],
  },
  {
    name: "fail-shared-template-counted-once",
    exitCode: 1,
    linted: [],
    summary: { files: 0, passed: 0, failed: 0, templatesChecked: 1, templatesBroken: 1 },
    broken: [{ path: "templates/broken.template.md", message: NO_FRONTMATTER }],
  },
];

describe("runner broken templates: layout", () => {
  it("has at least 1 pass- case, at least 1 fail- case, one directory each", () => {
    expectSplit("runner", GROUP, CASES);
  });
});

describe("runner broken templates (spec 8.2)", () => {
  for (const testCase of CASES) {
    it(`${testCase.name}: exit ${testCase.exitCode}`, async () => {
      const result = await runFixture(`${GROUP}${testCase.name}`);
      expect(lintedFiles(result)).toEqual(testCase.linted);
      expect(result.summary).toMatchObject({ ...testCase.summary, exitCode: testCase.exitCode });
      expect(result.brokenTemplates).toEqual(testCase.broken);
      expect(result.runErrors).toEqual([]);
    });
  }

  it("fail-skips-only-its-pair: the broken pair is a block with its file count and no files", async () => {
    const result = await runFixture(`${GROUP}fail-skips-only-its-pair`);
    const [broken, good] = result.blocks;
    expect(broken).toMatchObject({
      kind: "pair",
      pair: "broken",
      fileCount: 2,
      files: [],
      template: {
        path: "templates/broken.template.md",
        status: "broken",
        error: { code: "MTL001", severity: "error", message: NO_FRONTMATTER },
      },
    });
    expect(good).toMatchObject({ kind: "pair", pair: "good", fileCount: 2 });
    const failing =
      good?.kind === "pair" ? good.files.find((file) => file.status === "fail") : null;
    expect(failing?.path).toBe("docs/b.md");
    expect(failing?.errors.map((error) => error.code)).toEqual(["MTL201"]);
  });

  it("fail-skips-only-its-pair: the text summary lists Broken templates: and the failed file", async () => {
    const result = await runFixture(`${GROUP}fail-skips-only-its-pair`);
    const { stdout } = report(result, { format: "plain", version: "1.0.0" });
    expect(stdout).toContain(
      `  TEMPLATE ERROR: templates/broken.template.md - ${NO_FRONTMATTER}\n`,
    );
    expect(stdout).toContain(
      `Broken templates:\n  - templates/broken.template.md - ${NO_FRONTMATTER}\n\nFailed files:\n  - docs/b.md\n`,
    );
    expect(stdout).not.toContain("skipping remaining");
    expect(stdout).not.toContain("All files passed!");
    expect(stdout).not.toContain("No files linted.");
  });

  it("fail-shared-template-counted-once: both pairs show the error, the list names the template once", async () => {
    const result = await runFixture(`${GROUP}fail-shared-template-counted-once`);
    const { stdout } = report(result, { format: "plain", version: "1.0.0" });
    expect(stdout.match(/TEMPLATE ERROR:/g)).toHaveLength(2);
    expect(stdout.match(/^ {2}- templates\/broken\.template\.md/gm)).toHaveLength(1);
  });
});
