/**
 * Reporters: the template entry of a template with template errors in a lint run
 * (docs/spec.md 8.2, 8.5, owner decision 2 of A72l, phase P7d), on a hand-built result:
 * `✗ <template> (template)` / `FAIL ... (template)` before the files of the block, one
 * `error` line per template error with its template-line excerpt and caret, the lists
 * `Broken templates:`, `Failed templates:`, `Failed files:` in that order, no
 * `All files passed!`, `--quiet` keeps the entry; JSON `template.status` `fail` with
 * `diagnostics` (each with `line`, `column`, `sourceLine`). The end-to-end cases are in
 * tests/unit/cli/template-errors.test.ts.
 */
import { describe, expect, it } from "vitest";
import { report } from "../../../src/reporters/index.js";
import { excerptFor } from "../../../src/runner/excerpt.js";
import type { FileResult, PairBlock, ReportedDiagnostic, RunResult, RunSummary, TemplateReport } from "../../../src/runner/types.js";

const VERSION = "1.0.0";
const ESC = String.fromCharCode(27);

const templateError = (line: number, column: number, text: string): ReportedDiagnostic => ({
  code: "MTL017",
  severity: "error",
  message: `Heading 'X': duplicate on line ${line}`,
  position: { line, column },
  excerpt: excerptFor(line, text, column),
});

const FAILED: TemplateReport = {
  path: "templates/t.md",
  status: "fail",
  errors: [templateError(7, 4, "## Notes [presence:optional]"), templateError(9, 4, "## Notes")],
};

const passing: FileResult = { path: "docs/a.md", status: "pass", errors: [], warnings: [] };
const failing: FileResult = {
  path: "docs/b.md",
  status: "fail",
  errors: [{ code: "MTL201", severity: "error", message: "Field 'title': empty", position: null }],
  warnings: [],
};

const block = (template: TemplateReport, files: readonly FileResult[]): PairBlock => ({
  kind: "pair",
  root: "project",
  pair: "p",
  template,
  include: ["docs/*.md"],
  description: null,
  fileCount: files.length,
  files,
});

function result(blocks: readonly PairBlock[], extra: Partial<Pick<RunResult, "brokenTemplates" | "failedTemplates">> = {}): RunResult {
  const files = blocks.flatMap((item) => item.files);
  const failed = files.filter((file) => file.status === "fail").length;
  const summary: RunSummary = {
    files: files.length,
    passed: files.length - failed,
    failed,
    warnings: 0,
    filesWithWarnings: 0,
    suppressed: 0,
    templatesChecked: 1,
    templatesBroken: extra.brokenTemplates?.length ?? 0,
    runErrors: 0,
    runWarnings: 0,
    exitCode: 1,
  };
  return {
    mode: "lint",
    config: "md-template-lint.yml",
    blocks,
    brokenTemplates: extra.brokenTemplates ?? [],
    failedTemplates: extra.failedTemplates ?? ["templates/t.md"],
    runErrors: [],
    runWarnings: [],
    unmatched: [],
    summary,
  };
}

const ENTRY = "      error MTL017 Heading 'X': duplicate on line 7\n" + "        7 | ## Notes [presence:optional]\n" + "          |    ^\n" + "      error MTL017 Heading 'X': duplicate on line 9\n" + "        9 | ## Notes\n" + "          |    ^\n";

describe("text reporters: template entry (spec 8.2)", () => {
  it("plain: FAIL entry with its errors and excerpts before the files, Failed templates:, no All files passed!", () => {
    const { stdout, stderr } = report(result([block(FAILED, [passing])]), {
      format: "plain",
      version: VERSION,
    });
    expect(stderr).toBe("");
    expect(stdout).toContain(`Target:   docs/*.md (1 file(s))\n\n  FAIL templates/t.md (template)\n${ENTRY}  PASS docs/a.md\n`);
    expect(stdout).toContain("Templates:    1 checked, 0 broken\n\nFailed templates:\n  - templates/t.md\n\n===");
    expect(stdout).not.toContain("All files passed!");
    expect(stdout).not.toContain("No files linted.");
  });

  it("pretty: the same entry with the fail glyph; with color the entry is red, the excerpt gray", () => {
    const plain = report(result([block(FAILED, [passing])]), { format: "plain", version: VERSION });
    const pretty = report(result([block(FAILED, [passing])]), {
      format: "pretty",
      version: VERSION,
    });
    expect(pretty.stdout).toContain(`  ✗ templates/t.md (template)\n${ENTRY}  ✓ docs/a.md\n`);
    expect(pretty.stdout.replace("  ✗ templates/t.md (template)", "  FAIL templates/t.md (template)").replace("  ✓ docs/a.md", "  PASS docs/a.md")).toBe(plain.stdout);
    const colored = report(result([block(FAILED, [passing])]), {
      format: "pretty",
      version: VERSION,
      color: true,
    });
    expect(colored.stdout).toContain(`${ESC}[31m  ✗ templates/t.md (template)${ESC}[0m`);
    expect(colored.stdout).toContain(`${ESC}[90m        7 | ## Notes [presence:optional]${ESC}[0m`);
    expect(colored.stdout).toContain(`${ESC}[31mFailed templates:${ESC}[0m`);
  });

  it("--quiet keeps the entry with its errors and excerpts, hides the passing file and the summary", () => {
    const { stdout } = report(result([block(FAILED, [passing])]), {
      format: "pretty",
      version: VERSION,
      quiet: true,
    });
    expect(stdout).toBe(`  ✗ templates/t.md (template)\n${ENTRY}`);
  });

  it("a template used by two blocks: the entry in both, listed once", () => {
    const { stdout } = report(result([block(FAILED, [passing]), block(FAILED, [passing])]), {
      format: "plain",
      version: VERSION,
    });
    expect(stdout.split("  FAIL templates/t.md (template)\n")).toHaveLength(3);
    expect(stdout.split("  - templates/t.md\n")).toHaveLength(2);
  });

  it("Broken templates:, Failed templates:, Failed files: in that order", () => {
    const broken: TemplateReport = {
      path: "templates/x.md",
      status: "broken",
      error: { code: "MTL002", severity: "error", message: "YAML parse error", position: null },
    };
    const { stdout } = report(
      result([block(FAILED, [failing]), block(broken, [])], {
        brokenTemplates: [{ path: "templates/x.md", message: "YAML parse error" }],
      }),
      { format: "plain", version: VERSION },
    );
    expect(stdout).toContain("Broken templates:\n  - templates/x.md - YAML parse error\n\n" + "Failed templates:\n  - templates/t.md\n\n" + "Failed files:\n  - docs/b.md\n\n");
  });

  it("an ok template prints no entry and no Failed templates: list", () => {
    const { stdout } = report(result([block({ path: "templates/t.md", status: "ok" }, [passing])], { failedTemplates: [] }), { format: "plain", version: VERSION });
    expect(stdout).not.toContain("(template)");
    expect(stdout).not.toContain("Failed templates:");
    expect(stdout).toContain("All files passed!");
  });
});

describe("json reporter: template entry (spec 8.5)", () => {
  it("status fail with diagnostics (line, column, sourceLine), files as usual", () => {
    const { stdout } = report(result([block(FAILED, [passing])]), {
      format: "json",
      version: VERSION,
    });
    const document = JSON.parse(stdout) as {
      results: { template: Record<string, unknown>; files: object[] }[];
      summary: Record<string, unknown>;
    };
    const [first] = document.results;
    expect(first?.template).toEqual({
      path: "templates/t.md",
      status: "fail",
      diagnostics: [
        {
          code: "MTL017",
          severity: "error",
          message: "Heading 'X': duplicate on line 7",
          line: 7,
          column: 4,
          sourceLine: "## Notes [presence:optional]",
        },
        {
          code: "MTL017",
          severity: "error",
          message: "Heading 'X': duplicate on line 9",
          line: 9,
          column: 4,
          sourceLine: "## Notes",
        },
      ],
    });
    expect(Object.keys(first?.template ?? {})).toEqual(["path", "status", "diagnostics"]);
    expect(first?.files).toHaveLength(1);
    // No summary key is added (spec 8.5).
    expect(Object.keys(document.summary)).toHaveLength(11);
  });

  it("--quiet does not shrink it", () => {
    const loud = report(result([block(FAILED, [passing])]), { format: "json", version: VERSION });
    const quiet = report(result([block(FAILED, [passing])]), {
      format: "json",
      version: VERSION,
      quiet: true,
    });
    expect(quiet.stdout).toBe(loud.stdout);
  });
});
