/**
 * MTL017 heading-pattern-duplicate (src/rules/syntax.ts, docs/spec.md 2.7, 2.10 "Duplicate
 * pattern", 4.3, 8.3, 8.5, DIR6; owner decision 7 of A72k, widened by A72l and A72m), via
 * `--verify`. Two ADJACENT members of a template sequence (one level and scope of the
 * template alone, without template-only headings and invalid patterns) with the SAME PATTERN
 * give one ERROR on the later one: pattern headings by their pieces, exact-text headings by
 * the literal pattern of their text. The first TEMPLATE ERROR: `--verify` FAILS the template
 * (exit 1, JSON status `fail`, `summary.errors`) without making it broken; a target directive
 * cannot disable it (MTL022). The lint-run output of template errors is phase P7d.
 *
 * Columns from the spec: the `[` of the later pattern tag (`## Hotfix ` puts it at column
 * 11), or the first character of the later exact-text heading's text (`## Notes`: column 4).
 */
import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { checkTemplate, lintTarget } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";
import { runCli } from "../../../src/cli/run.js";
import { reportVerify } from "../../../src/cli/verify-report.js";
import { foldPath } from "../../../src/config/paths.js";
import { verifyPaths } from "../../../src/runner/verify.js";
import { HOME } from "../../helpers/run.js";
import { expectNameSplit } from "../../helpers/fixtures.js";
import { parseJson, runCliIn } from "../../helpers/cli.js";
import { templatesDir, verifyFixture, type VerifyCase, type VerifyDiagnostic } from "../../helpers/verify.js";

const CODE = "MTL017";
const DIR = "tests/fixtures/templates/MTL017";

/** The first message form: the later heading is a pattern heading. */
const samePattern = (heading: string, pattern: string, prev: string, prevLine: number, line: number, column: number, sourceLine: string): VerifyDiagnostic => ({
  code: CODE,
  severity: "error",
  message: `Heading '${heading}': same pattern [pattern:"${pattern}"] as the previous heading '${prev}' (line ${prevLine})`,
  line,
  column,
  sourceLine,
});

/** The second message form: the later heading is an exact-text heading. */
const sameText = (heading: string, prev: string, prevLine: number, line: number, column: number, sourceLine: string): VerifyDiagnostic => ({
  code: CODE,
  severity: "error",
  message: `Heading '${heading}': matches the same headings as the previous heading '${prev}' (line ${prevLine})`,
  line,
  column,
  sourceLine,
});

/** A failing case: template FAIL, exit 1, its errors (then warnings) in source order. */
const fail = ({ name }: { readonly name: string }, ...diagnostics: VerifyDiagnostic[]): VerifyCase => ({ name, exitCode: 1, status: "fail", diagnostics });
/** A passing case: no MTL017, so ok and exit 0; tag warnings may remain (MTL014). */
const pass = ({ name }: { readonly name: string }, ...diagnostics: VerifyDiagnostic[]): VerifyCase => ({ name, exitCode: 0, status: "ok", diagnostics });

/** Case -> fixture `<name>.md` -> expected `--verify` result. */
const CASES: readonly VerifyCase[] = [
  // Worked example 3 of spec 2.10: `{prev}` is the empty label of line 5.
  fail({ name: "fail-worked-example-3-same-semver-pattern" }, samePattern("Hotfix", "{semver}", "", 5, 7, 11, '## Hotfix [pattern:"{semver}"] [presence:optional]')),
  // Three in a row give two findings: the second and the third, each against the one before.
  fail(
    { name: "fail-three-in-a-row-give-two-findings" },
    samePattern("Second", "Step {digits}", "First", 5, 7, 11, '## Second [pattern:"Step {digits}"]'),
    samePattern("Third", "Step {digits}", "Second", 7, 9, 10, '## Third [pattern:"Step {digits}"]'),
  ),
  // Names and formats case-insensitively, no format equal to the default name `full` (A72m),
  // the argument compared as written (A72n): `{digits:format:padding:3}` and
  // `{Digits:format:PADDING:3}` under one parent (section scope).
  fail(
    { name: "fail-placeholder-case-and-default-format-are-equal" },
    samePattern("B", "{SemVer:format:full}", "A", 5, 7, 6, '## B [pattern:"{SemVer:format:full}"]'),
    samePattern("D", "Item {Digits:format:PADDING:3}", "C", 9, 11, 7, '### D [pattern:"Item {Digits:format:PADDING:3}"]'),
  ),
  // `{text}` and `{text:format:human}` are the same (A72m).
  fail({ name: "fail-text-next-to-text-format-human" }, samePattern("Other", "{text:format:human}", "Topic", 5, 7, 10, '## Other [pattern:"{text:format:human}"]')),
  // Two exact-text headings with the same text (A72l): second form, column of the `N`.
  fail({ name: "fail-exact-text-notes-twice-in-a-row" }, sameText("Notes", "Notes", 5, 7, 4, "## Notes [presence:optional]")),
  // An exact-text heading and the literal pattern of its text, in both orders.
  fail({ name: "fail-exact-text-then-literal-pattern" }, samePattern("More", "Notes", "Notes", 5, 7, 9, '## More [pattern:"Notes"]')),
  fail({ name: "fail-literal-pattern-then-exact-text" }, sameText("Notes", "More", 5, 7, 4, "## Notes")),
  // One template with an error and a warning. JSON `diagnostics` list the error first, then the
  // warning (spec 8.5 says nothing on this order; the verify helper pins errors, then warnings).
  // The text report differs: its sections follow code order (spec 8.3), so `Invalid patterns:`
  // (MTL014, line 5) comes BEFORE `Duplicate patterns:` (MTL017, line 9); see the test "an error
  // and a warning in one template" below. The invalid pattern of `Bad` is no member of the
  // sequence, the `Notes` pair is.
  fail({ name: "fail-error-and-warning-in-one-template" }, sameText("Notes", "Notes", 7, 9, 4, "## Notes"), {
    code: "MTL014",
    severity: "warning",
    message: "Heading 'Bad': invalid pattern [pattern:\"{nope}\"] (unknown placeholder {nope})",
    line: 5,
    column: 18,
    sourceLine: '## Bad [pattern:"{nope}"]',
  }),
  // The column of an exact-text heading is the first character of its text: two blanks after
  // the `#` marks push it to column 6 (spec 2.10 "Duplicate pattern", Position).
  fail({ name: "fail-exact-text-column-after-wide-gap" }, sameText("Notes", "Notes", 5, 7, 6, "##   Notes")),
  // The sequence is the headings of ONE level and scope: the H3 between two H2 headings is
  // not in it, so the two `{semver}` headings are adjacent (spec 2.7).
  fail({ name: "fail-same-pattern-h2-separated-by-h3" }, samePattern("B", "{semver}", "A", 5, 9, 6, '## B [pattern:"{semver}"]')),
  // Headings without template parent are file scope at any level: two leading H3 headings
  // form one sequence (spec 2.6 "Sequence").
  fail({ name: "fail-two-leading-h3-with-same-pattern" }, samePattern("B", "{semver}", "A", 5, 7, 7, '### B [pattern:"{semver}"]')),
  // Two H1 headings with the same text are one file-scope sequence of level 1.
  fail({ name: "fail-two-h1-with-same-text" }, sameText("Doc", "Doc", 5, 7, 3, "# Doc")),
  // Literals are compared after escapes (spec 2.10 "Duplicate pattern"): the text `Say "hi"`
  // is the pattern `Say \"hi\"`; `{x}` in an exact-text heading is the literal `{x}`, which the
  // brace escape `{{x}}` spells in a pattern.
  fail({ name: "fail-escaped-quote-equals-plain-quote-in-exact-text" }, samePattern("Other", 'Say \\"hi\\"', 'Say "hi"', 5, 7, 10, '## Other [pattern:"Say \\"hi\\""]')),
  fail({ name: "fail-doubled-brace-equals-single-brace-in-exact-text" }, samePattern("Other", "Use {{x}}", "Use {x}", 5, 7, 10, '## Other [pattern:"Use {{x}}"]')),
  // `a\\b` is the text `a\b`, `a\"b` the text `a"b`: different literals.
  pass({ name: "pass-escaped-backslash-differs-from-escaped-quote" }),
  // `{semver}` / `v{semver}`, `padding:3` / `padding:4`, `{digits}` / `{number}` all differ.
  pass({ name: "pass-patterns-differ" }),
  // A different exact-text heading between two same patterns: they are not adjacent.
  pass({ name: "pass-different-exact-text-heading-between" }),
  // Literal pieces are case-sensitive: `## Notes` and `## notes` differ.
  pass({ name: "pass-exact-text-differs-by-case" }),
  // Different levels, or one level under different template parents: other sequences.
  pass({ name: "pass-different-levels-or-parents" }),
  // A heading with an invalid pattern is no member (it has MTL014 only).
  pass(
    { name: "pass-invalid-pattern-next-to-valid" },
    {
      code: "MTL014",
      severity: "warning",
      message: "Heading 'B': invalid pattern [pattern:\"{semver\"] (unmatched '{')",
      line: 7,
      column: 16,
      sourceLine: '## B [pattern:"{semver"]',
    },
  ),
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

/** One item of `Duplicate patterns:` (spec 8.3): text, then the excerpt 6 spaces in, a caret. */
const item = (diagnostic: VerifyDiagnostic): string[] => {
  const line = diagnostic.line ?? 0;
  const column = diagnostic.column ?? 0;
  return [`  - ${diagnostic.message} (line ${line}, column ${column})`, `      ${line} | ${diagnostic.sourceLine ?? ""}`, `      ${" ".repeat(String(line).length)} | ${" ".repeat(column - 1)}^`];
};

describe("MTL017 heading-pattern-duplicate (--verify)", { tags: ["MTL017", "syntax"] }, () => {
  it("is registered in category syntax, error, phase template", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "heading-pattern-duplicate",
      category: "syntax",
      severity: "error",
      phase: "template",
    });
  });

  it("has at least 1 pass- and 1 fail- case, one fixture file each; MTL017 in fail- only", () => {
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
    const text = '---\ntitle: x\n---\n\n## A [pattern:"{x}"]\n\n## Notes\n\n## Notes\n';
    const status = await checkTemplate(registry, text);
    if (status.status !== "ok") throw new Error("template is broken");
    expect(status.errors.map(({ code }) => code)).toEqual([CODE]);
    expect(status.warnings.map(({ code }) => code)).toEqual(["MTL014"]);
    const result = await verifyPaths({
      cwd: foldPath(templatesDir(CODE)),
      home: HOME,
      paths: ["fail-three-in-a-row-give-two-findings.md"],
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

  it("template-only headings are no members: the headings around one are adjacent", async () => {
    const text = '---\ntitle: x\n---\n\n## A [pattern:"{semver}"]\n\n## Draft [presence:template-only]\n\n' + '## B [pattern:"{semver}"]\n';
    const status = await checkTemplate(registry, text);
    if (status.status !== "ok") throw new Error("template is broken");
    expect(status.errors.map(({ message }) => message)).toEqual(["Heading 'B': same pattern [pattern:\"{semver}\"] as the previous heading 'A' (line 5)"]);
  });

  it("a tab between the marks and the text is one character of the column", async () => {
    // Columns count characters (spec 8.2 EX4): `##`, one tab, then `Notes` at column 4.
    const text = "---\ntitle: x\n---\n\n## Notes\n\n##\tNotes\n";
    const status = await checkTemplate(registry, text);
    if (status.status !== "ok") throw new Error("template is broken");
    expect(status.errors.map(({ code, position }) => ({ code, position }))).toEqual([{ code: CODE, position: { line: 7, column: 4 } }]);
  });

  it("a target directive cannot disable it (DIR6: MTL022)", async () => {
    const status = await checkTemplate(registry, "---\ntitle: x\n---\n\n## Notes\n");
    if (status.status !== "ok") throw new Error("template is broken");
    const target = "---\ntitle: x\n---\n\n## Notes\n\n<!-- md-template-lint disable MTL017 -->\n";
    const result = await lintTarget(registry, status.model, target, "target.md", createEnv());
    expect(result.diagnostics.map(({ code, message }) => ({ code, message }))).toEqual([{ code: "MTL022", message: "Directive on line 7: rule code MTL017 cannot be disabled" }]);
  });
});

describe("MTL017 in the --verify text report (spec 8.3 `Duplicate patterns:`)", { tags: ["MTL017", "syntax"] }, () => {
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
          expect(out).not.toContain("Duplicate patterns:");
          expect(out.some((line) => line.startsWith("Errors:"))).toBe(false);
          expect(out).toContain("All templates passed!");
          return;
        }
        expect(run.exitCode).toBe(1);
        expect(out).toContain(`  ${failWord} ${name}.md`);
        expect(out).not.toContain(`  ${passWord} ${name}.md`);
        const start = out.indexOf("Duplicate patterns:");
        expect(start).toBeGreaterThan(0);
        const expected = ["Duplicate patterns:", ...own.flatMap(item), ""];
        expect(out.slice(start, start + expected.length)).toEqual(expected);
        // `Errors:` right after `Templates:`; no closing line replaces `All templates passed!`.
        const templates = out.indexOf("Templates:    1 checked, 0 broken");
        expect(out[templates + 1]).toBe(`Errors:       ${own.length}`);
        expect(out).not.toContain("All templates passed!");
        expect(out).not.toContain("No templates checked.");
      });
    }
  }

  it("--quiet keeps the fail header and the error section only, exit 1", async () => {
    const name = "fail-worked-example-3-same-semver-pattern";
    const run = await verifyRun("plain", name, true);
    expect(run.exitCode).toBe(1);
    expect(run.stdout).toBe(
      [
        `  FAIL ${name}.md`,
        "Duplicate patterns:",
        "  - Heading 'Hotfix': same pattern [pattern:\"{semver}\"] as the previous heading '' (line 5) (line 7, column 11)",
        '      7 | ## Hotfix [pattern:"{semver}"] [presence:optional]',
        "        |           ^",
        "",
        "",
      ].join("\n"),
    );
  });

  it("--quiet still prints nothing for a passing template (warnings stay hidden)", async () => {
    const run = await verifyRun("plain", "pass-invalid-pattern-next-to-valid", true);
    expect(run).toMatchObject({ stdout: "", exitCode: 0 });
  });

  it("an error and a warning in one template: the warning section is first", async () => {
    const out = (await verifyRun("plain", "fail-error-and-warning-in-one-template")).stdout.split("\n");
    const invalid = out.indexOf("Invalid patterns:");
    expect(invalid).toBeGreaterThan(0);
    expect(invalid).toBeLessThan(out.indexOf("Duplicate patterns:"));
    expect(out).toContain("Templates:    1 checked, 0 broken");
    expect(out).toContain("Errors:       1");
    expect(out).toContain("Warnings:     1");
  });

  it("--quiet does not shrink JSON: a failing template keeps the whole document", async () => {
    const name = "fail-error-and-warning-in-one-template";
    const full = await verifyRun("json", name);
    const quiet = await verifyRun("json", name, true);
    expect(quiet.exitCode).toBe(1);
    expect(quiet.stdout).toBe(full.stdout);
    const json = parseJson(quiet.stdout);
    expect(json.templates?.[0]?.status).toBe("fail");
    expect(json.templates?.[0]?.diagnostics.map((diagnostic) => diagnostic.code).sort()).toEqual(["MTL014", CODE]);
    expect(json.summary).toMatchObject({ templates: 1, broken: 0, errors: 1, warnings: 1 });
  });

  it("a failed template next to a passing one: each its own header, exit 1", async () => {
    const cwd = foldPath(templatesDir(CODE));
    const result = await verifyPaths({
      cwd,
      home: HOME,
      paths: ["fail-exact-text-notes-twice-in-a-row.md", "pass-patterns-differ.md"],
    });
    const text = reportVerify(result, { format: "plain", version: "9.9.9" }).stdout;
    expect(text).toContain("  FAIL fail-exact-text-notes-twice-in-a-row.md\n");
    expect(text).toContain("  PASS pass-patterns-differ.md\n");
    expect(text).toContain("Templates:    2 checked, 0 broken\nErrors:       1\n");
    expect(result.summary.exitCode).toBe(1);
  });
});

describe("MTL017 worked example 3 of spec 2.10 (tests/fixtures/cli/schema-fail-duplicate-pattern-worked-example)", { tags: ["MTL017", "syntax"] }, () => {
  const FIXTURE = "schema-fail-duplicate-pattern-worked-example";

  it("pretty text has the fail glyph header, exit 1", async () => {
    const pretty = await runCliIn(FIXTURE, ["--verify", "template.md"]);
    const plain = await runCliIn(FIXTURE, ["--verify", "--format", "plain", "template.md"]);
    expect(pretty.exitCode).toBe(1);
    expect(pretty.stderr).toBe("");
    expect(pretty.stdout).toBe(plain.stdout.replace("  FAIL template.md", "  ✗ template.md"));
  });

  it("JSON: status fail, summary.errors after broken, exit 1", async () => {
    const run = await runCliIn(FIXTURE, ["--verify", "--format", "json", "template.md"]);
    expect(run.exitCode).toBe(1);
    const json = parseJson(run.stdout);
    expect(json.templates?.[0]?.status).toBe("fail");
    expect(json.summary).toEqual({
      templates: 1,
      broken: 0,
      errors: 1,
      warnings: 0,
      suppressed: 0,
      runErrors: 0,
      exitCode: 1,
    });
    expect(Object.keys(json.summary)).toEqual(["templates", "broken", "errors", "warnings", "suppressed", "runErrors", "exitCode"]);
  });
});
