/**
 * CLI lint run of a target without frontmatter (ADR 0015, docs/spec.md 1.1, 7.5): under a
 * template with the standalone comment line `# [frontmatter:optional]` the target gets no
 * MTL001 and no field rule (no MTL201 for the required `title`), its headings and content are
 * still checked, and the run exits 0. The same pair without the tag is MTL001, exit 1.
 * The projects are built in a temporary folder (one per variant) and removed afterwards; the
 * neutral fixture `usage-no-config` is only the nominal working directory of `runCliIn`.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { foldPath } from "../../../src/config/paths.js";
import { runCliIn } from "../../helpers/cli.js";

const CONFIG = ["pairs:", "  - name: readme", "    template: templates/readme.template.md", "    include: docs/*.md", ""].join("\n");
const BODY = ["", "## Summary [content:non-empty]", ""];
const TAGGED = ["---", "# [frontmatter:optional]", 'title: "string"', "---", ...BODY].join("\n");
const UNTAGGED = ["---", 'title: "string"', "---", ...BODY].join("\n");
/** A target with no frontmatter block at all; its one heading has content. */
const TARGET = ["## Summary", "", "Some text.", ""].join("\n");
/** The same target with an empty heading: the content rule still runs (MTL701). */
const EMPTY_SECTION = ["## Summary", ""].join("\n");

interface LintJson {
  readonly summary: Readonly<Record<string, number>>;
  readonly results: readonly {
    readonly files: readonly {
      readonly path: string;
      readonly status: string;
      readonly errors: readonly { readonly code: string }[];
      readonly warnings: readonly { readonly code: string }[];
    }[];
  }[];
}

const codesOf = (stdout: string): string[] => (JSON.parse(stdout) as LintJson).results.flatMap((block) => block.files.flatMap((file) => [...file.errors, ...file.warnings].map((diagnostic) => `${file.path}:${diagnostic.code}`)));

describe("cli lint: [frontmatter:optional] with a frontmatter-less target (ADR 0015)", () => {
  let root = "";
  const project = (name: string, template: string, targets: Readonly<Record<string, string>>): string => {
    const dir = join(root, name);
    mkdirSync(join(dir, "templates"), { recursive: true });
    mkdirSync(join(dir, "docs"), { recursive: true });
    writeFileSync(join(dir, "md-template-lint.yml"), CONFIG);
    writeFileSync(join(dir, "templates", "readme.template.md"), template);
    for (const [file, text] of Object.entries(targets)) writeFileSync(join(dir, "docs", file), text);
    return foldPath(dir);
  };
  const dirs = { tagged: "", untagged: "", content: "" };

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), "mtl-cli-optional-frontmatter-"));
    dirs.tagged = project("pass-tagged", TAGGED, { "readme.md": TARGET });
    dirs.untagged = project("fail-untagged", UNTAGGED, { "readme.md": TARGET });
    dirs.content = project("fail-tagged-content", TAGGED, { "readme.md": EMPTY_SECTION });
  });

  afterAll(() => {
    if (root !== "") rmSync(root, { recursive: true, force: true });
  });

  const run = (dir: string, args: readonly string[]) => runCliIn("usage-no-config", args, { cwd: dir, boundary: dir });

  it("pass: tagged template, target without frontmatter: exit 0, no MTL001, no MTL201", async () => {
    const result = await run(dirs.tagged, []);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("✓ docs/readme.md");
    expect(result.stdout).toContain("All files passed!");
    expect(result.stdout).not.toContain("MTL001");
    expect(result.stdout).not.toContain("MTL201");
  });

  it("pass: tagged template, JSON: the target has no diagnostic and the summary exit code is 0", async () => {
    const result = await run(dirs.tagged, ["--format", "json"]);
    expect(result.exitCode).toBe(0);
    expect(codesOf(result.stdout)).toEqual([]);
    expect((JSON.parse(result.stdout) as LintJson).summary["exitCode"]).toBe(0);
  });

  it("fail: the same pair without the tag is MTL001, exit 1", async () => {
    const result = await run(dirs.untagged, ["--format", "json"]);
    expect(result.exitCode).toBe(1);
    expect(codesOf(result.stdout)).toEqual(["docs/readme.md:MTL001"]);
    const text = await run(dirs.untagged, []);
    expect(text.exitCode).toBe(1);
    expect(text.stdout).toContain("✗ docs/readme.md");
  });

  it("fail: tagged template, target without frontmatter: the content rule still runs (MTL701)", async () => {
    const result = await run(dirs.content, ["--format", "json"]);
    expect(result.exitCode).toBe(1);
    expect(codesOf(result.stdout)).toEqual(["docs/readme.md:MTL701"]);
  });
});
