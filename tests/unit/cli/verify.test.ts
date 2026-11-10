/**
 * CLI `--verify` (docs/spec.md 7.3, 8.3): every distinct template is parsed and its schema
 * printed (the table itself is pinned in schema.test.ts); no target is read, no io is built.
 * A template that does not parse is `TEMPLATE ERROR` (exit 1); a missing one is MTL910 and a
 * directory MTL911 (exit 2), and a run error outranks a broken template.
 * Fixtures: tests/fixtures/cli/verify-<case>/. Sharing: the MTL923 and `--config` tests run
 * from the neutral working directory `usage-no-config` (owned by the usage group, it only has
 * to hold no config); everything else is read from verify- fixtures.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { foldPath } from "../../../src/config/paths.js";
import { expectSplit } from "../../helpers/fixtures.js";
import { fixtureFile, parseJson, runCliIn } from "../../helpers/cli.js";

const GROUP = "verify-";
const PASS = `${GROUP}pass-valid-templates`;
const NO_FRONTMATTER = "File must have YAML frontmatter (---...---)";

interface Case {
  readonly name: string;
  readonly args: readonly string[];
  readonly exitCode: 0 | 1 | 2;
  readonly stdout: readonly string[];
  readonly stderr: readonly string[];
  readonly absent?: readonly string[];
  readonly summary: Record<string, number>;
}

/** At least 1 passing case and 1 failing case; one fixture directory per case. */
const CASES: readonly Case[] = [
  {
    // Three pairs, two distinct templates; the target docs/b.md would fail a lint run.
    name: "pass-valid-templates",
    args: ["--verify"],
    exitCode: 0,
    stdout: [
      "Config: md-template-lint.yml",
      "✓ templates/note.template.md",
      "title  string  presence:required",
      "✓ templates/tagged.template.md",
      "title  string  presence:required",
      "Unknown tags found (typo or unimplemented feature):",
      "  - Field 'title': unknown tag [optionl]",
      "Templates:    2 checked, 0 broken",
      "All templates passed!",
    ],
    stderr: [],
    absent: ["docs/b.md", "Total files", "✗"],
    summary: {
      templates: 2,
      broken: 0,
      errors: 0,
      warnings: 1,
      suppressed: 0,
      runErrors: 0,
      exitCode: 0,
    },
  },
  {
    name: "fail-broken-template",
    args: ["--verify"],
    exitCode: 1,
    stdout: ["✓ templates/note.template.md", `TEMPLATE ERROR: templates/broken.template.md - ${NO_FRONTMATTER}`, "Templates:    2 checked, 1 broken"],
    stderr: [],
    absent: ["docs/a.md", "All templates passed!"],
    summary: {
      templates: 2,
      broken: 1,
      errors: 0,
      warnings: 0,
      suppressed: 0,
      runErrors: 0,
      exitCode: 1,
    },
  },
  {
    // The missing template is a run error (exit 2); the other template is still checked.
    name: "fail-template-missing",
    args: ["--verify"],
    exitCode: 2,
    stdout: ["✓ templates/note.template.md", "Templates:    1 checked, 0 broken", "Run errors:   1"],
    stderr: ["error MTL910: template not found: templates/missing.template.md (pair 'ghost')"],
    absent: ["All templates passed!"],
    summary: {
      templates: 1,
      broken: 0,
      errors: 0,
      warnings: 0,
      suppressed: 0,
      runErrors: 1,
      exitCode: 2,
    },
  },
  {
    // Precedence (spec 7.5): one broken template (1) and one missing template (2) is exit 2.
    // The broken template is still reported, the run error does not hide it.
    name: "fail-broken-and-missing-template",
    args: ["--verify"],
    exitCode: 2,
    stdout: [`TEMPLATE ERROR: templates/broken.template.md - ${NO_FRONTMATTER}`, "Templates:    1 checked, 1 broken", "Run errors:   1"],
    stderr: ["error MTL910: template not found: templates/missing.template.md (pair 'ghost')"],
    absent: ["All templates passed!"],
    summary: {
      templates: 1,
      broken: 1,
      errors: 0,
      warnings: 0,
      suppressed: 0,
      runErrors: 1,
      exitCode: 2,
    },
  },
  {
    name: "fail-template-is-directory",
    args: ["--verify"],
    exitCode: 2,
    stdout: ["Templates:    0 checked, 0 broken", "Run errors:   1"],
    stderr: ["error MTL911: template path is not a regular file (for example a directory): templates/dir.template.md (pair 'dir')"],
    absent: ["No templates checked."],
    summary: {
      templates: 0,
      broken: 0,
      errors: 0,
      warnings: 0,
      suppressed: 0,
      runErrors: 1,
      exitCode: 2,
    },
  },
  {
    // A config error stops before any template is read.
    name: "fail-config-invalid",
    args: ["--verify"],
    exitCode: 2,
    stdout: ["Templates:    0 checked, 0 broken", "Run errors:   2"],
    stderr: ["error MTL903: pairs[0].inlcude: unknown key 'inlcude'", "error MTL904:"],
    absent: ["✓", "TEMPLATE ERROR"],
    summary: {
      templates: 0,
      broken: 0,
      errors: 0,
      warnings: 0,
      suppressed: 0,
      runErrors: 2,
      exitCode: 2,
    },
  },
  {
    // Template paths on the command line: no config is read (there is none here).
    name: "fail-explicit-broken-template",
    args: ["--verify", "templates/note.template.md", "templates/broken.template.md"],
    exitCode: 1,
    stdout: ["Config: (none)", "✓ templates/note.template.md", `TEMPLATE ERROR: templates/broken.template.md - ${NO_FRONTMATTER}`],
    stderr: [],
    summary: {
      templates: 2,
      broken: 1,
      errors: 0,
      warnings: 0,
      suppressed: 0,
      runErrors: 0,
      exitCode: 1,
    },
  },
];

function expectInOrder(text: string, fragments: readonly string[]): void {
  let from = 0;
  for (const fragment of fragments) {
    const at = text.indexOf(fragment, from);
    expect(at, `"${fragment}" in order in:\n${text}`).toBeGreaterThanOrEqual(0);
    from = at + fragment.length;
  }
}

describe("cli --verify: layout", () => {
  it("has at least 1 pass- case, at least 1 fail- case, one directory each", () => {
    expectSplit("cli", GROUP, CASES);
  });
});

describe("cli --verify (spec 7.3)", () => {
  for (const testCase of CASES) {
    it(`${testCase.name}: exit ${testCase.exitCode}`, async () => {
      const run = await runCliIn(`${GROUP}${testCase.name}`, testCase.args);
      expect(run.exitCode).toBe(testCase.exitCode);
      expectInOrder(run.stdout, testCase.stdout);
      for (const fragment of testCase.stderr) expect(run.stderr).toContain(fragment);
      if (testCase.stderr.length === 0) expect(run.stderr).toBe("");
      for (const fragment of testCase.absent ?? []) expect(run.stdout).not.toContain(fragment);
      // Template syntax only: no io is built, so no network and no file probe can happen.
      expect(run.ioCalls).toEqual([]);
    });

    it(`${testCase.name}: JSON summary`, async () => {
      const run = await runCliIn(`${GROUP}${testCase.name}`, [...testCase.args, "--format", "json"]);
      const json = parseJson(run.stdout);
      expect(run.exitCode).toBe(testCase.exitCode);
      expect(json.mode).toBe("verify");
      expect(json.summary).toEqual(testCase.summary);
      // Spec 8.5: `errors` (A72k) follows `broken`; `suppressed` (always 0 in verify mode)
      // follows `warnings`.
      expect(Object.keys(json.summary)).toEqual(["templates", "broken", "errors", "warnings", "suppressed", "runErrors", "exitCode"]);
      expect(run.stderr).toBe("");
    });
  }
});

describe("cli --verify: details", () => {
  it("JSON lists each template with its status, schema members and located warnings", async () => {
    const json = parseJson((await runCliIn(PASS, ["--verify", "--format", "json"])).stdout);
    const field = [{ name: "title", type: "string", rules: ["presence:required"] }];
    const headings = [{ level: 2, text: "Summary", rules: ["presence:required", "content:non-empty"] }];
    expect(json.templates).toEqual([
      {
        path: "templates/note.template.md",
        status: "ok",
        filenameCase: null,
        uniqueHeadingNames: false,
        fields: field,
        headings,
        diagnostics: [],
      },
      {
        path: "templates/tagged.template.md",
        status: "ok",
        filenameCase: null,
        uniqueHeadingNames: false,
        fields: field,
        headings,
        diagnostics: [
          {
            code: "MTL010",
            severity: "warning",
            message: "Field 'title': unknown tag [optionl]",
            line: 2,
            column: 19,
            sourceLine: 'title: "string" # [optionl]',
          },
        ],
      },
    ]);
    expect(json.runWarnings).toEqual([]);
  });

  it("JSON of a broken template carries its error and an empty schema", async () => {
    const run = await runCliIn(`${GROUP}fail-broken-template`, ["--verify", "--format=json"]);
    const broken = parseJson(run.stdout).templates?.find((item) => item.status === "broken");
    expect(broken).toEqual({
      path: "templates/broken.template.md",
      status: "broken",
      error: { code: "MTL001", severity: "error", message: NO_FRONTMATTER },
      filenameCase: null,
      uniqueHeadingNames: false,
      fields: [],
      headings: [],
      diagnostics: [],
    });
  });

  it("plain format uses PASS and never color", async () => {
    const run = await runCliIn(PASS, ["--verify", "--format", "plain"], { isTty: true });
    expect(run.stdout).toContain("  PASS templates/note.template.md");
    expect(run.stdout).not.toContain("✓");
    expect(run.stdout).not.toContain("\u001b[");
  });

  it("plain format prints a broken template as TEMPLATE ERROR, with no PASS line for it", async () => {
    const run = await runCliIn(`${GROUP}fail-broken-template`, ["--verify", "--format", "plain"]);
    expect(run.exitCode).toBe(1);
    expect(run.stdout).toContain(`  TEMPLATE ERROR: templates/broken.template.md - ${NO_FRONTMATTER}\n`);
    expect(run.stdout).not.toContain("PASS templates/broken.template.md");
    expect(run.stdout).not.toContain("\u001b[");
    expect(run.stdout).toContain("Templates:    2 checked, 1 broken");
    expect(run.stdout).not.toContain("All templates passed!");
    expect(run.stderr).toBe("");
  });

  it("text format is colored on a terminal only, and not with NO_COLOR", async () => {
    const tty = await runCliIn(PASS, ["--verify"], { isTty: true });
    const pipe = await runCliIn(PASS, ["--verify"]);
    const none = await runCliIn(PASS, ["--verify"], { isTty: true, noColor: true });
    expect(tty.stdout).toContain("\u001b[");
    expect(pipe.stdout).not.toContain("\u001b[");
    expect(none.stdout).toBe(pipe.stdout);
  });

  it("--quiet shows nothing when clean and only the broken templates otherwise", async () => {
    const clean = await runCliIn(PASS, ["--verify", "--quiet"]);
    expect(clean).toMatchObject({ stdout: "", stderr: "", exitCode: 0 });
    const broken = await runCliIn(`${GROUP}fail-broken-template`, ["--verify", "--quiet"]);
    expect(broken.stdout).toBe(`  TEMPLATE ERROR: templates/broken.template.md - ${NO_FRONTMATTER}\n`);
    expect(broken.exitCode).toBe(1);
  });

  it("--quiet with a run error prints only the error on stderr, exit 2", async () => {
    const run = await runCliIn(`${GROUP}fail-template-missing`, ["--verify", "--quiet"]);
    expect(run.exitCode).toBe(2);
    expect(run.stdout).toBe("");
    expect(run.stderr).toBe("error MTL910: template not found: templates/missing.template.md (pair 'ghost')\n");
  });

  it("--quiet with a broken and a missing template prints both, exit 2", async () => {
    const run = await runCliIn(`${GROUP}fail-broken-and-missing-template`, ["--verify", "--quiet"]);
    expect(run.exitCode).toBe(2);
    expect(run.stdout).toBe(`  TEMPLATE ERROR: templates/broken.template.md - ${NO_FRONTMATTER}\n`);
    expect(run.stderr).toContain("error MTL910:");
  });

  it("template arguments need no config, and win over --config", async () => {
    const run = await runCliIn(PASS, ["--verify", "--config", "nope.yml", "templates/note.template.md"]);
    expect(run.exitCode).toBe(0);
    expect(run.stdout).toContain("Config: (none)");
  });

  it("takes absolute and backslash template paths", async () => {
    const absolute = fixtureFile(`${GROUP}fail-explicit-broken-template`, "templates/broken.template.md");
    for (const form of [absolute, absolute.replaceAll("/", "\\")]) {
      const run = await runCliIn(PASS, ["--verify", form]);
      expect(run.exitCode, form).toBe(1);
      expect(run.stdout, form).toContain("TEMPLATE ERROR:");
    }
  });

  it("a template path that does not exist is MTL910 without a pair, exit 2", async () => {
    const run = await runCliIn(PASS, ["--verify", "templates/nope.md"]);
    expect(run.exitCode).toBe(2);
    expect(run.stderr).toBe("error MTL910: template not found: templates/nope.md\n");
  });

  it("the same template given twice is checked once", async () => {
    const run = await runCliIn(PASS, ["--verify", "templates/note.template.md", "./templates/note.template.md"]);
    expect(run.stdout).toContain("Templates:    1 checked, 0 broken");
  });

  it("without a config and without template paths it is a usage conflict (MTL923), exit 2", async () => {
    const run = await runCliIn("usage-no-config", ["--verify"]);
    expect(run.exitCode).toBe(2);
    expect(run.stderr).toContain("error MTL923: --verify needs a config or at least one template path");
  });

  it("an explicit --config that is missing is MTL901, not a usage conflict", async () => {
    const run = await runCliIn("usage-no-config", ["--verify", "--config", "nope.yml"]);
    expect(run.exitCode).toBe(2);
    expect(run.stderr).toContain("error MTL901: config file not found: nope.yml");
    expect(run.stderr).not.toContain("MTL923");
  });
});

describe("cli --verify: a template that is not UTF-8", () => {
  let folder = "";

  beforeAll(() => {
    folder = mkdtempSync(join(tmpdir(), "mtl-cli-verify-"));
    // 0xFF and 0xFE never occur in UTF-8; the bytes are built here, not stored as a fixture.
    writeFileSync(join(folder, "bytes.template.md"), Buffer.from([0x2d, 0x2d, 0x2d, 0xff, 0xfe, 0x0a]));
  });

  afterAll(() => {
    if (folder !== "") rmSync(folder, { recursive: true, force: true });
  });

  const run = (args: readonly string[]) => runCliIn("usage-no-config", args, { cwd: foldPath(folder), boundary: foldPath(folder) });

  it("is broken (MTL004), exit 1, with a path-free reason", async () => {
    const result = await run(["--verify", "bytes.template.md"]);
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("  TEMPLATE ERROR: bytes.template.md - file is not valid UTF-8\n");
    expect(result.stderr).toBe("");
    expect(result.stdout).not.toContain(folder);
  });

  it("JSON carries MTL004 and an empty schema", async () => {
    const result = await run(["--verify", "--format", "json", "bytes.template.md"]);
    expect(parseJson(result.stdout).templates).toEqual([
      {
        path: "bytes.template.md",
        status: "broken",
        error: { code: "MTL004", severity: "error", message: "file is not valid UTF-8" },
        filenameCase: null,
        uniqueHeadingNames: false,
        fields: [],
        headings: [],
        diagnostics: [],
      },
    ]);
  });
});

describe("cli --verify: every heading level (spec 8.3, change C10)", () => {
  let folder = "";

  beforeAll(() => {
    folder = mkdtempSync(join(tmpdir(), "mtl-cli-verify-levels-"));
    // Built here, not stored as a fixture: H1 to H6 with tags, and the sub-heading opt-out.
    writeFileSync(
      join(folder, "levels.template.md"),
      [
        "---",
        'title: "string"',
        "---",
        "",
        "# Doc",
        "",
        "## Release [content:list] [content:subheadings:disallow]",
        "",
        "### Added [presence:optional]",
        "",
        "#### Detail",
        "",
        "##### Deep [content:min-lines:2]",
        "",
        "###### Deepest [presence:template-only]",
        "",
      ].join("\n"),
    );
  });

  afterAll(() => {
    if (folder !== "") rmSync(folder, { recursive: true, force: true });
  });

  const run = (args: readonly string[]) => runCliIn("usage-no-config", args, { cwd: foldPath(folder), boundary: foldPath(folder) });

  it("lists H1 to H6 in template order with the disallow token after the content rules", async () => {
    const result = await run(["--verify", "--format", "plain", "levels.template.md"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(
      [
        "Headings:",
        "  # Doc (presence:required)",
        "  ## Release (presence:required, content:list, content:subheadings:disallow)",
        "  ### Added (presence:optional)",
        "  #### Detail (presence:required)",
        "  ##### Deep (presence:required, content:min-lines:2)",
        "  ###### Deepest (presence:template-only)",
      ].join("\n"),
    );
    expect(result.stdout).not.toContain("Conflicting tags:");
  });

  it("JSON lists the same headings with level, text and rules", async () => {
    const result = await run(["--verify", "--format", "json", "levels.template.md"]);
    expect(parseJson(result.stdout).templates?.[0]?.headings).toEqual([
      { level: 1, text: "Doc", rules: ["presence:required"] },
      {
        level: 2,
        text: "Release",
        rules: ["presence:required", "content:list", "content:subheadings:disallow"],
      },
      { level: 3, text: "Added", rules: ["presence:optional"] },
      { level: 4, text: "Detail", rules: ["presence:required"] },
      { level: 5, text: "Deep", rules: ["presence:required", "content:min-lines:2"] },
      { level: 6, text: "Deepest", rules: ["presence:template-only"] },
    ]);
  });
});
