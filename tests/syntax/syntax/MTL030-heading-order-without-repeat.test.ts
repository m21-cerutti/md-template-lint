/**
 * MTL030 heading-order-without-repeat (src/rules/syntax.ts, docs/spec.md 2.7, 2.10 worked
 * example 7 J, 4.3, 8.3, 8.5, DIR6; owner decision 3 of A72n), via `--verify`. The effective
 * (first) `[order:...]` tag, any form, on a PATTERN HEADING (an effective, valid pattern, not
 * `[presence:template-only]`) with no `[repeat-rules:...]` tag of any kind gives ONE ERROR per
 * heading, at the `[` of that order tag. A heading without pattern or a template-only heading
 * gets MTL015 instead, a heading with an invalid pattern MTL014 (one cause, one finding). A
 * TEMPLATE ERROR like `MTL017`: `--verify` FAILS the template (exit 1, JSON status `fail`,
 * `summary.errors`) without making it broken; a target directive cannot disable it (MTL022).
 * In a lint run the heading is a single position, so the order tag has no effect.
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

const CODE = "MTL030";
const DIR = "tests/fixtures/templates/MTL030";
const SECTION = "Order tags without repeat:";

/** The MTL030 finding of spec 4.3: heading `text`, order `tag` at `line`, `column`. */
const withoutRepeat = (text: string, tag: string, line: number, column: number, sourceLine: string): VerifyDiagnostic => ({
  code: CODE,
  severity: "error",
  message: `Heading '${text}': tag ${tag} needs [repeat-rules:same-level] ` + "(an order compares the repeats of one heading)",
  line,
  column,
  sourceLine,
});

/** An MTL015 warning on line 5 (spec 2.7). */
const conflict = (text: string, tag: string, column: number, reason: string, sourceLine: string): VerifyDiagnostic => ({
  code: "MTL015",
  severity: "warning",
  message: `Heading '${text}': tag ${tag} has no effect (${reason})`,
  line: 5,
  column,
  sourceLine,
});

/** A failing case: template FAIL, exit 1, its errors (then warnings) in source order. */
const fail = ({ name }: { readonly name: string }, ...diagnostics: VerifyDiagnostic[]): VerifyCase => ({ name, exitCode: 1, status: "fail", diagnostics });
/** A passing case: no MTL030, so ok and exit 0; tag warnings may remain (MTL014, MTL015). */
const pass = ({ name }: { readonly name: string }, ...diagnostics: VerifyDiagnostic[]): VerifyCase => ({ name, exitCode: 0, status: "ok", diagnostics });

const J = '## Epic A - Title [pattern:"Epic {char} - {text}"] [order:ascending] [content:table]';
const FORMS = [
  ["Step", "[order:descending]", 5, 35, '## Step [pattern:"Step {digits}"] [order:descending]'],
  ["Step", "[order:first:number:ascending]", 7, 33, '## Step [pattern:"Step {text}"] [order:first:number:ascending]'],
  ["Run", "[order:first:number:descending]", 9, 31, '## Run [pattern:"Run {text}"] [order:first:number:descending]'],
  ["Sprint", "[order:first:date:ascending]", 11, 37, '## Sprint [pattern:"Sprint {text}"] [order:first:date:ascending]'],
  ["Week", "[order:first:date:descending]", 13, 33, '## Week [pattern:"Week {text}"] [order:first:date:descending]'],
  ["Release", "[order:first:semver:ascending]", 15, 34, '## Release [pattern:"v{semver}"] [order:first:semver:ascending]'],
  ["Version", "[order:first:semver:descending]", 17, 39, '## Version [pattern:"Version {text}"] [order:first:semver:descending]'],
] as const;
const TEMPLATE_ONLY = '## Draft [presence:template-only] [pattern:"D {text}"] [order:descending]';
const TEMPLATE_ONLY_ALL = '## Draft [presence:template-only] [pattern:"D {text}"] [repeat-rules:same-level] [order:descending]';
const TEMPLATE_ONLY_REASON = "the heading is [presence:template-only]";

/** Case -> fixture `<name>.md` -> expected `--verify` result. */
const CASES: readonly VerifyCase[] = [
  // The MTL030 variant of worked example 7 J of spec 2.10: column 52.
  fail({ name: "fail-worked-example-7-j-without-repeat" }, withoutRepeat("Epic A - Title", "[order:ascending]", 5, 52, J)),
  // Every other order form, one heading each (`ascending` is J above).
  fail({ name: "fail-every-order-form" }, ...FORMS.map(([text, tag, line, column, source]) => withoutRepeat(text, tag, line, column, source))),
  // The order tag written before the pattern tag: still the effective order tag, column 9.
  fail({ name: "fail-order-tag-before-pattern-tag" }, withoutRepeat("Step", "[order:descending]", 5, 9, '## Step [order:descending] [pattern:"Step {digits}"]')),
  // Two order tags: one finding, on the first (effective) one.
  fail({ name: "fail-two-order-tags-first-only" }, withoutRepeat("Step", "[order:first:number:descending]", 5, 35, '## Step [pattern:"Step {digits}"] [order:first:number:descending] [order:ascending]')),
  // One template, one repeat heading with an order tag (fine) and one without repeat tag:
  // one finding, on the second.
  fail({ name: "fail-mixed-repeat-and-non-repeat-headings" }, withoutRepeat("Step", "[order:descending]", 7, 31, '## Step [pattern:"S{digits}"] [order:descending]')),
  // The rule is not for H2 only: an H3 (section scope) with an order tag and no repeat tag.
  fail({ name: "fail-order-tag-on-a-deeper-heading" }, withoutRepeat("Item", "[order:first:number:ascending]", 7, 36, '### Item [pattern:"Item {digits}"] [order:first:number:ascending]')),
  // Worked example 7 J as written: `[repeat-rules:same-level]` makes it a repeat heading.
  pass({ name: "pass-worked-example-7-j-with-repeat" }),
  // Template-only with pattern, repeat and order tags: MTL015 on each of the three (spec 2.7),
  // never MTL030; the repeat tag does not make the order tag count.
  pass(
    { name: "pass-template-only-heading-with-repeat-and-order-tags" },
    conflict("Draft", '[pattern:"D {text}"]', 35, TEMPLATE_ONLY_REASON, TEMPLATE_ONLY_ALL),
    conflict("Draft", "[repeat-rules:same-level]", 56, TEMPLATE_ONLY_REASON, TEMPLATE_ONLY_ALL),
    conflict("Draft", "[order:descending]", 82, TEMPLATE_ONLY_REASON, TEMPLATE_ONLY_ALL),
  ),
  // Only the `min` form of the repeat tag counts as a repeat tag.
  pass({ name: "pass-min-repeat-form-only" }),
  // Only the `max` form of the repeat tag counts as a repeat tag.
  pass({ name: "pass-max-repeat-form-only" }),
  // No pattern: MTL015 (the missing pattern is the first cause), never MTL030.
  pass({ name: "pass-order-tag-without-pattern-gets-mtl015" }, conflict("Unreleased", "[order:ascending]", 35, "the heading has no [pattern:...]", "## Unreleased [presence:optional] [order:ascending]")),
  // Template-only: MTL015 on the pattern and on the order tag, never MTL030.
  pass({ name: "pass-template-only-heading-gets-mtl015" }, conflict("Draft", '[pattern:"D {text}"]', 35, TEMPLATE_ONLY_REASON, TEMPLATE_ONLY), conflict("Draft", "[order:descending]", 56, TEMPLATE_ONLY_REASON, TEMPLATE_ONLY)),
  // Invalid pattern: MTL014 only.
  pass(
    { name: "pass-invalid-pattern-gets-mtl014" },
    {
      code: "MTL014",
      severity: "warning",
      message: "Heading 'Step': invalid pattern [pattern:\"{int}\"] (unknown placeholder {int})",
      line: 5,
      column: 19,
      sourceLine: '## Step [pattern:"{int}"] [order:descending]',
    },
  ),
];

const registry = createRegistry();

/** Stdout and exit code of `--verify --format <format> [--quiet] <name>.md` in `folder`. */
async function verifyIn(folder: string, format: string, name: string, quiet = false) {
  const cwd = foldPath(folder);
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

const verifyRun = (format: string, name: string, quiet = false) => verifyIn(templatesDir(CODE), format, name, quiet);

/** One item of the section (spec 8.3): text, then the excerpt 6 spaces in, a caret. */
const item = (diagnostic: VerifyDiagnostic): string[] => {
  const line = diagnostic.line ?? 0;
  const column = diagnostic.column ?? 0;
  return [`  - ${diagnostic.message} (line ${line}, column ${column})`, `      ${line} | ${diagnostic.sourceLine ?? ""}`, `      ${" ".repeat(String(line).length)} | ${" ".repeat(column - 1)}^`];
};

describe("MTL030 heading-order-without-repeat (--verify)", { tags: ["MTL030", "syntax"] }, () => {
  it("is registered in category syntax, error, phase template, last of the category", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "heading-order-without-repeat",
      category: "syntax",
      severity: "error",
      phase: "template",
    });
    const codes = registry.byCategory.get("syntax")?.map((rule) => rule.code) ?? [];
    expect(codes.indexOf(CODE)).toBe(codes.indexOf("MTL025") + 1);
    expect(codes.at(-1)).toBe(CODE);
  });

  it("has at least 1 pass- and 1 fail- case, one fixture file each; MTL030 in fail- only", () => {
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
    const text = '---\ntitle: x\n---\n\n## Step [pattern:"Step {digits}"] [order:descending]\n\n' + "## Notes [order:ascending]\n";
    const status = await checkTemplate(registry, text);
    if (status.status !== "ok") throw new Error("template is broken");
    expect(status.errors.map(({ code }) => code)).toEqual([CODE]);
    expect(status.warnings.map(({ code }) => code)).toEqual(["MTL015"]);
    const result = await verifyPaths({
      cwd: foldPath(templatesDir(CODE)),
      home: HOME,
      paths: ["fail-every-order-form.md"],
    });
    expect(result.summary).toEqual({
      templates: 1,
      broken: 0,
      errors: 7,
      warnings: 0,
      runErrors: 0,
      exitCode: 1,
    });
  });

  it("a target directive cannot disable it (DIR6: MTL022)", async () => {
    const status = await checkTemplate(registry, "---\ntitle: x\n---\n\n## Notes\n");
    if (status.status !== "ok") throw new Error("template is broken");
    const target = "---\ntitle: x\n---\n\n## Notes\n\n<!-- md-template-lint disable MTL030 -->\n";
    const result = await lintTarget(registry, status.model, target, "target.md", createEnv());
    expect(result.diagnostics.map(({ code, message }) => ({ code, message }))).toEqual([{ code: "MTL022", message: "Directive on line 7: rule code MTL030 cannot be disabled" }]);
  });
});

describe("MTL030 in a lint run: the order tag has no effect (spec 2.7)", { tags: ["MTL030", "syntax"] }, () => {
  // Epic B before Epic A: descending, so `[order:ascending]` on a repeat heading gives MTL609.
  const target = "---\ntitle: x\n---\n\n## Epic B - Release\n\n| Task | Status |\n\n## Epic A - Setup\n\nText.\n";
  const codesWith = async (template: string): Promise<string[]> => {
    const status = await checkTemplate(registry, `---\ntitle: "string"\n---\n\n${template}\n`);
    if (status.status !== "ok") throw new Error("template is broken");
    const result = await lintTarget(registry, status.model, target, "a.md", createEnv());
    return result.diagnostics.map(({ code }) => code);
  };

  it("with the repeat tag the order compares the instances (MTL609)", async () => {
    const repeat = '## Epic A - Title [pattern:"Epic {char} - {text}"] [repeat-rules:same-level] ' + "[order:ascending] [content:table]";
    expect(await codesWith(repeat)).toContain("MTL609");
  });

  it("without it the heading is a single position: no MTL609, no MTL614", async () => {
    const status = await checkTemplate(registry, `---\ntitle: "string"\n---\n\n${J}\n`);
    if (status.status !== "ok") throw new Error("template is broken");
    expect(status.errors.map(({ code }) => code)).toEqual([CODE]);
    // The second epic is in the tail: an extra (the warning MTL616), never MTL614.
    const codes = await codesWith(J);
    expect(codes).not.toContain("MTL609");
    expect(codes).not.toContain("MTL614");
    expect(codes).not.toContain(CODE);
  });
});

describe(`MTL030 in the --verify text report (spec 8.3 \`${SECTION}\`)`, { tags: ["MTL030", "syntax"] }, () => {
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
        expect(out).not.toContain("Child headings out of level order:");
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

  it("comes last, right after `Child headings out of level order:`", async () => {
    // A temporary template (the fixture folder holds the cases only): MTL030 on line 5, then
    // MTL019 on line 11; under `--quiet` the MTL030 section still comes after the MTL019 one.
    const folder = mkdtempSync(join(tmpdir(), "mtl-030-"));
    try {
      writeFileSync(join(folder, "both.md"), '---\ntitle: x\n---\n\n## Step [pattern:"Step {digits}"] [order:descending]\n\n' + "## Setup\n\n#### Details\n\n### Steps\n");
      const run = await verifyIn(folder, "plain", "both", true);
      expect(run.exitCode).toBe(1);
      const out = run.stdout.split("\n");
      expect(out[0]).toBe("  FAIL both.md");
      const child = out.indexOf("Child headings out of level order:");
      expect(child).toBe(1);
      // Title, one item, its two excerpt rows, the blank line: the next section starts at +5.
      expect(out.indexOf(SECTION)).toBe(child + 5);
    } finally {
      rmSync(folder, { recursive: true, force: true });
    }
  });

  it("--quiet keeps the fail header and the error section only, exit 1", async () => {
    const name = "fail-worked-example-7-j-without-repeat";
    const run = await verifyRun("plain", name, true);
    expect(run.exitCode).toBe(1);
    expect(run.stdout).toBe(
      [
        `  FAIL ${name}.md`,
        SECTION,
        "  - Heading 'Epic A - Title': tag [order:ascending] needs [repeat-rules:same-level] (an order compares the repeats of one heading) (line 5, column 52)",
        `      5 | ${J}`,
        `        | ${" ".repeat(51)}^`,
        "",
        "",
      ].join("\n"),
    );
  });

  it("--quiet still prints nothing for a passing template (warnings stay hidden)", async () => {
    const run = await verifyRun("plain", "pass-template-only-heading-gets-mtl015", true);
    expect(run).toMatchObject({ stdout: "", exitCode: 0 });
  });
});
