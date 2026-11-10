/**
 * MTL019 heading-child-order-conflict (src/rules/syntax.ts, docs/spec.md 2.7, 2.6 worked
 * example 3, 4.3, 8.3, 8.5, DIR6; owner decision 2 of A72m, owner decision 1 of A72n), via
 * `--verify`. The CHILD LIST of a template heading P (the section-scope template headings
 * whose template parent is P, in template order, without `[presence:template-only]` children
 * and children with an invalid pattern) holding a heading after a deeper one gives ONE ERROR
 * per P, on the first offending child, column 1. P is any heading that is not template-only,
 * also one with an invalid pattern (then `MTL014` and `MTL019`). A TEMPLATE ERROR like
 * `MTL017`: `--verify` FAILS the template (exit 1, JSON status `fail`, `summary.errors`)
 * without making it broken; a target directive cannot disable it (MTL022).
 */
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkTemplate, lintTarget } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";
import { runCli } from "../../../src/cli/run.js";
import { foldPath } from "../../../src/config/paths.js";
import { verifyPaths } from "../../../src/runner/verify.js";
import { HOME } from "../../helpers/run.js";
import { expectNameSplit } from "../../helpers/fixtures.js";
import { templatesDir, verifyFixture, type VerifyCase, type VerifyDiagnostic } from "../../helpers/verify.js";

const CODE = "MTL019";
const DIR = "tests/fixtures/templates/MTL019";
const SECTION = "Child headings out of level order:";

/** The MTL019 finding of spec 4.3: child `text` (H`n`) after `prev` (H`m`) under `parent`. */
const conflict = (child: { readonly text: string; readonly level: number; readonly line: number }, prev: { readonly text: string; readonly level: number; readonly line: number }, parent: string): VerifyDiagnostic => ({
  code: CODE,
  severity: "error",
  message: `Heading '${child.text}' (H${child.level}): comes after the deeper child ` + `'${prev.text}' (H${prev.level}, line ${prev.line}) under '${parent}'`,
  line: child.line,
  column: 1,
  sourceLine: `${"#".repeat(child.level)} ${child.text}`,
});

/** A failing case: template FAIL, exit 1, its errors (then warnings) in source order. */
const fail = ({ name }: { readonly name: string }, ...diagnostics: VerifyDiagnostic[]): VerifyCase => ({ name, exitCode: 1, status: "fail", diagnostics });
/** A passing case: no MTL019, so ok and exit 0; tag warnings may remain (MTL014). */
const pass = ({ name }: { readonly name: string }, ...diagnostics: VerifyDiagnostic[]): VerifyCase => ({ name, exitCode: 0, status: "ok", diagnostics });

/** Case -> fixture `<name>.md` -> expected `--verify` result. */
const CASES: readonly VerifyCase[] = [
  // Worked example 3 of spec 2.6: `#### Details` then `### Steps`, both children of `## Setup`.
  fail({ name: "fail-worked-example-3-deeper-child-first" }, conflict({ text: "Steps", level: 3, line: 11 }, { text: "Details", level: 4, line: 9 }, "Setup")),
  // An H5 before an H4 under an H3.
  fail({ name: "fail-h5-before-h4-under-h3" }, conflict({ text: "Steps", level: 4, line: 11 }, { text: "Details", level: 5, line: 9 }, "Setup")),
  // H5, H4, H3 under one parent: two offending children, one finding on the first (the H4).
  fail({ name: "fail-two-offending-children-one-finding" }, conflict({ text: "Details", level: 4, line: 9 }, { text: "Deep", level: 5, line: 7 }, "Setup")),
  // Two parents, each with a deeper child first: one finding per parent.
  fail({ name: "fail-two-parents-two-findings" }, conflict({ text: "Steps", level: 3, line: 9 }, { text: "Details", level: 4, line: 7 }, "Setup"), conflict({ text: "Run", level: 3, line: 15 }, { text: "Notes", level: 4, line: 13 }, "Usage")),
  // A parent whose own pattern is invalid is checked too: MTL019 (error) and MTL014 (warning).
  fail({ name: "fail-invalid-pattern-parent" }, conflict({ text: "Steps", level: 3, line: 9 }, { text: "Details", level: 4, line: 7 }, "Release"), {
    code: "MTL014",
    severity: "warning",
    message: "Heading 'Release': invalid pattern [pattern:\"{version}\"] (unknown placeholder {version})",
    line: 5,
    column: 22,
    sourceLine: '## Release [pattern:"{version}"]',
  }),
  // `{prev}` is the FIRST earlier deeper child (`Deep One`), not the nearest one (`Deep Two`).
  fail({ name: "fail-prev-is-the-first-deeper-child-not-the-nearest" }, conflict({ text: "Steps", level: 3, line: 11 }, { text: "Deep One", level: 4, line: 7 }, "Setup")),
  // The template-only `Gone` (H3, line 9) is no child of the list: `Steps` is the offender.
  fail({ name: "fail-template-only-child-between-is-skipped" }, conflict({ text: "Steps", level: 3, line: 11 }, { text: "Details", level: 4, line: 7 }, "Setup")),
  // Two parents at two depths: `Steps` under `Setup`, and `Mid` (H4 after H5) under `Steps`.
  fail(
    { name: "fail-nested-parents-each-have-a-conflict" },
    conflict({ text: "Steps", level: 3, line: 9 }, { text: "Details", level: 4, line: 7 }, "Setup"),
    conflict({ text: "Mid", level: 4, line: 13 }, { text: "Deep", level: 5, line: 11 }, "Steps"),
  ),
  // An H1 parent: its H2 child (`Sec`, file scope) is not in the list, the H3 after the H4 is.
  fail({ name: "fail-h1-parent-conflict-ignores-file-scope-sibling" }, conflict({ text: "Mid", level: 3, line: 9 }, { text: "Deep", level: 4, line: 7 }, "Top")),
  // The deeper heading is a grandchild (child of `### Steps`), not a child of `## Setup`.
  pass({ name: "pass-shallower-before-deeper" }),
  // Children of one level only.
  pass({ name: "pass-same-level-children" }),
  // A template-only child is left out of the child list.
  pass({ name: "pass-deeper-template-only-child-first" }),
  // A child with an invalid pattern is left out of the child list: MTL014 only.
  pass(
    { name: "pass-deeper-invalid-pattern-child-first" },
    {
      code: "MTL014",
      severity: "warning",
      message: "Heading 'Details': invalid pattern [pattern:\"{version}\"] (unknown placeholder {version})",
      line: 7,
      column: 24,
      sourceLine: '#### Details [pattern:"{version}"]',
    },
  ),
  // A template-only parent is not checked.
  pass({ name: "pass-children-of-template-only-parent" }),
  // `## Setup` is file scope (an H2), so it is not in the child list of `# Guide`.
  pass({ name: "pass-h3-before-h2-under-h1" }),
];

const registry = createRegistry();

/** Stdout and exit code of `--verify --format <format> [--quiet] <name>.md` on a fixture. */
async function verifyRun(format: string, name: string, quiet = false) {
  const cwd = foldPath(templatesDir(CODE));
  const run = await runCli(["--verify", "--format", format, ...(quiet ? ["--quiet"] : []), `${name}.md`], {
    cwd,
    home: HOME,
    boundary: cwd,
    isTty: false,
    noColor: false,
    version: "9.9.9",
    createIo: () => {
      throw new Error("--verify must not build the io");
    },
  });
  expect(run.stderr).toBe("");
  return run;
}

/** One item of the section (spec 8.3): text, then the excerpt 6 spaces in, a caret. */
const item = (diagnostic: VerifyDiagnostic): string[] => {
  const line = diagnostic.line ?? 0;
  const column = diagnostic.column ?? 0;
  return [`  - ${diagnostic.message} (line ${line}, column ${column})`, `      ${line} | ${diagnostic.sourceLine ?? ""}`, `      ${" ".repeat(String(line).length)} | ${" ".repeat(column - 1)}^`];
};

describe("MTL019 heading-child-order-conflict (--verify)", () => {
  it("is registered in category syntax, error, phase template, right after MTL018", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "heading-child-order-conflict",
      category: "syntax",
      severity: "error",
      phase: "template",
    });
    const codes = registry.byCategory.get("syntax")?.map((rule) => rule.code) ?? [];
    expect(codes.indexOf(CODE)).toBe(codes.indexOf("MTL018") + 1);
  });

  it("has at least 1 pass- and 1 fail- case, one fixture file each; MTL019 in fail- only", () => {
    expectNameSplit(CASES);
    for (const testCase of CASES) {
      const has = testCase.diagnostics.some((diagnostic) => diagnostic.code === CODE);
      expect(has, testCase.name).toBe(testCase.name.startsWith("fail-"));
    }
    expect(readdirSync(templatesDir(CODE)).sort()).toEqual(CASES.map((testCase) => `${testCase.name}.md`).sort());
  });

  for (const { name, ...expected } of CASES) {
    it(`${name}: ${DIR}/${name}.md`, async () => {
      expect(await verifyFixture(CODE, name)).toEqual(expected);
    });
  }

  it("is counted apart from the warnings (checkTemplate errors, summary.errors)", async () => {
    const text = '---\ntitle: x\n---\n\n## Setup [pattern:"{version}"]\n\n#### Details\n\n### Steps\n';
    const status = await checkTemplate(registry, text);
    if (status.status !== "ok") throw new Error("template is broken");
    expect(status.errors.map(({ code }) => code)).toEqual([CODE]);
    expect(status.warnings.map(({ code }) => code)).toEqual(["MTL014"]);
    const result = await verifyPaths({
      cwd: foldPath(templatesDir(CODE)),
      home: HOME,
      paths: ["fail-two-parents-two-findings.md"],
    });
    expect(result.summary).toEqual({
      templates: 1,
      broken: 0,
      errors: 2,
      warnings: 0,
      runErrors: 0,
      exitCode: 1,
    });
  });

  it("a target directive cannot disable it (DIR6: MTL022)", async () => {
    const status = await checkTemplate(registry, "---\ntitle: x\n---\n\n## Notes\n");
    if (status.status !== "ok") throw new Error("template is broken");
    const target = "---\ntitle: x\n---\n\n## Notes\n\n<!-- md-template-lint disable MTL019 -->\n";
    const result = await lintTarget(registry, status.model, target, "target.md", createEnv());
    expect(result.diagnostics.map(({ code, message }) => ({ code, message }))).toEqual([{ code: "MTL022", message: "Directive on line 7: rule code MTL019 cannot be disabled" }]);
  });
});

describe(`MTL019 in the --verify text report (spec 8.3 \`${SECTION}\`)`, () => {
  // CLI `--format text` is the `pretty` reporter (spec 7.3); `plain` is the other text one.
  for (const format of ["text", "plain"]) {
    const failWord = format === "plain" ? "FAIL" : "✗";
    const passWord = format === "plain" ? "PASS" : "✓";
    for (const { name, diagnostics } of CASES) {
      const own = diagnostics.filter((diagnostic) => diagnostic.code === CODE);
      it(`${format} ${name}`, async () => {
        const run = await verifyRun(format, name);
        const out = run.stdout.split("\n");
        expect(out).toContain(`Warnings:     ${diagnostics.length - own.length}`);
        if (own.length === 0) {
          expect(run.exitCode).toBe(0);
          expect(out).toContain(`  ${passWord} ${name}.md`);
          expect(out).not.toContain(SECTION);
          expect(out.some((line) => line.startsWith("Errors:"))).toBe(false);
          expect(out).toContain("All templates passed!");
          return;
        }
        expect(run.exitCode).toBe(1);
        expect(out).toContain(`  ${failWord} ${name}.md`);
        expect(out).not.toContain(`  ${passWord} ${name}.md`);
        expect(out).not.toContain("Duplicate patterns:");
        expect(out).not.toContain("Optional headings with a minimum:");
        const start = out.indexOf(SECTION);
        expect(start).toBeGreaterThan(0);
        const expected = [SECTION, ...own.flatMap(item), ""];
        expect(out.slice(start, start + expected.length)).toEqual(expected);
        // `Errors:` right after `Templates:`; no closing line replaces `All templates passed!`.
        const templates = out.indexOf("Templates:    1 checked, 0 broken");
        expect(out[templates + 1]).toBe(`Errors:       ${own.length}`);
        expect(out).not.toContain("All templates passed!");
        expect(out).not.toContain("No templates checked.");
      });
    }
  }

  it("comes right after `Optional headings with a minimum:`, both errors counted", async () => {
    // A temporary template (the fixture folder holds the cases only): MTL018 on line 5, then
    // MTL019 on line 9; under `--quiet` the two error sections follow each other.
    const folder = mkdtempSync(join(tmpdir(), "mtl-019-"));
    try {
      writeFileSync(join(folder, "both.md"), '---\ntitle: x\n---\n\n## Setup [pattern:"{semver}"] [repeat-rules:same-level:min:1] ' + "[presence:optional]\n\n#### Details\n\n### Steps\n");
      const cwd = foldPath(folder);
      const run = await runCli(["--verify", "--format", "plain", "--quiet", "both.md"], {
        cwd,
        home: HOME,
        boundary: cwd,
        isTty: false,
        noColor: false,
        version: "9.9.9",
        createIo: () => {
          throw new Error("--verify must not build the io");
        },
      });
      expect(run.exitCode).toBe(1);
      const out = run.stdout.split("\n");
      expect(out[0]).toBe("  FAIL both.md");
      const min = out.indexOf("Optional headings with a minimum:");
      expect(min).toBe(1);
      // Title, one item, its two excerpt rows, the blank line: the next section starts at +5.
      expect(out.indexOf(SECTION)).toBe(min + 5);
    } finally {
      rmSync(folder, { recursive: true, force: true });
    }
  });

  it("--quiet keeps the fail header and the error section only, exit 1", async () => {
    const name = "fail-worked-example-3-deeper-child-first";
    const run = await verifyRun("plain", name, true);
    expect(run.exitCode).toBe(1);
    expect(run.stdout).toBe([`  FAIL ${name}.md`, SECTION, "  - Heading 'Steps' (H3): comes after the deeper child 'Details' (H4, line 9) under 'Setup' (line 11, column 1)", "      11 | ### Steps", "         | ^", "", ""].join("\n"));
  });

  it("--quiet still prints nothing for a passing template (warnings stay hidden)", async () => {
    const run = await verifyRun("plain", "pass-deeper-invalid-pattern-child-first", true);
    expect(run).toMatchObject({ stdout: "", exitCode: 0 });
  });
});
