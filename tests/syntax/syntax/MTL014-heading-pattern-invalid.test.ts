/**
 * MTL014 heading-pattern-invalid (src/rules/syntax.ts, docs/spec.md 2.7, 2.10 INVALID
 * PATTERN, 4.3, DIR6, change C12; argument reasons A72n), via `--verify`. The first problem
 * from the left of a `[pattern:"..."]` tag, one warning per tag, at the column of the `{`,
 * the brace, the backslash or the tag's `[` (empty pattern). A template warning: `--verify`
 * exits 0, a target directive cannot disable it (MTL022), and a lint run never prints it. The
 * heading is not checked and is not a position (spec 2.6), so a lint run reads the template
 * as if that heading and its section-scope descendants were not written.
 *
 * Expected values come from the spec: `## Release ` puts the tag `[` at column 12, so the
 * first character inside the quotes is column 22.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkTemplate, lintTarget } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";
import { matchHeadings, type Diagnostic, type DocumentModel } from "../../../src/engine/model.js";
import { loadDocument } from "../../../src/engine/load.js";
import { runCli } from "../../../src/cli/run.js";
import { foldPath } from "../../../src/config/paths.js";
import { HOME } from "../../helpers/run.js";
import { runCliIn } from "../../helpers/cli.js";
import { fixturePath } from "../../helpers/fixtures.js";
import { expectTemplateCases, templatesDir, verifyFixture, type VerifyCase, type VerifyDiagnostic } from "../../helpers/verify.js";

const CODE = "MTL014";
const DIR = "tests/fixtures/templates/MTL014";

const warning = (heading: string, pattern: string, reason: string, line: number, column: number, sourceLine: string): VerifyDiagnostic => ({
  code: CODE,
  severity: "warning",
  message: `Heading '${heading}': invalid pattern [pattern:"${pattern}"] (${reason})`,
  line,
  column,
  sourceLine,
});

/** One `## Release [pattern:"<pattern>"]` heading on line 7. */
const release = (pattern: string, reason: string, column: number): VerifyDiagnostic => warning("Release", pattern, reason, 7, column, `## Release [pattern:"${pattern}"]`);

/** A case: `{ name: "<case>" }` (the form check:rules reads) and its expected warnings. */
const fail = ({ name }: { readonly name: string }, ...diagnostics: VerifyDiagnostic[]): VerifyCase => ({ name, exitCode: 0, status: "ok", diagnostics });
const pass = (named: { readonly name: string }): VerifyCase => fail(named);

/** Case -> fixture `<name>.md` -> expected `--verify` result. */
const CASES: readonly VerifyCase[] = [
  // Unknown placeholder (the placeholder as written), column of its `{`.
  fail({ name: "fail-unknown-placeholder" }, release("[{version}] - {date}", "unknown placeholder {version}", 23)),
  fail({ name: "fail-empty-placeholder" }, release("Step {}", "unknown placeholder {}", 27)),
  // A72n: `{int}` is no placeholder any more.
  fail({ name: "fail-int-is-an-unknown-placeholder" }, release("Step {int}", "unknown placeholder {int}", 27)),
  // The name as written, an empty label (a heading with only its tag), at H6.
  fail({ name: "fail-label-empty-at-h6" }, warning("", "{Version}", "unknown placeholder {Version}", 7, 18, '###### [PATTERN:"{Version}"]')),
  fail({ name: "fail-malformed-placeholder" }, release("v{semver:major-minor}", "malformed placeholder {semver:major-minor}", 23)),
  // A default format name is allowed only for its own placeholder; `{char}` takes none.
  fail(
    { name: "fail-unknown-format" },
    release("{text:format:full}", "unknown format full for {text}", 22),
    warning("Epic", "Epic {char:format:upper}", "unknown format upper for {char}", 9, 24, '## Epic [pattern:"Epic {char:format:upper}"]'),
    warning("Step", "Step {digits:format:decimal}", "unknown format decimal for {digits}", 11, 24, '## Step [pattern:"Step {digits:format:decimal}"]'),
  ),
  fail({ name: "fail-format-needs-an-argument" }, release("Item {digits:format:padding}", "format padding of {digits} needs an argument", 27)),
  fail(
    { name: "fail-format-bad-argument" },
    release("Item {digits:format:padding:0}", "bad argument 0 for format padding of {digits}", 27),
    // `[1-9][0-9]*`: a leading zero and a non-digit are bad arguments too (spec 2.10).
    warning("Code", "Code {digits:format:padding:03}", "bad argument 03 for format padding of {digits}", 9, 24, '## Code [pattern:"Code {digits:format:padding:03}"]'),
    warning("Tag", "Tag {digits:format:padding:x}", "bad argument x for format padding of {digits}", 11, 22, '## Tag [pattern:"Tag {digits:format:padding:x}"]'),
  ),
  fail({ name: "fail-format-takes-no-argument" }, release("Year {date:format:year:2}", "format year of {date} takes no argument", 27)),
  // Unmatched braces, column of that brace.
  fail({ name: "fail-unmatched-open-brace" }, release("Step {digits", "unmatched '{'", 27)),
  fail({ name: "fail-unmatched-close-brace" }, release("Step } {digits}", "unmatched '}'", 27)),
  // Adjacent placeholders, column of the second `{`.
  fail({ name: "fail-adjacent-placeholders" }, release("Epic {char}{text}", "adjacent placeholders {char}{text}", 33)),
  // Invalid escape, column of the backslash (worked example 2 variant of spec 2.10).
  fail({ name: "fail-invalid-escape" }, release("a\\tb", "invalid escape \\t", 23)),
  // Empty pattern, column of the tag's `[`.
  fail({ name: "fail-empty-pattern" }, release("", "empty pattern", 12)),
  // First problem from the left only, whatever follows it.
  fail({ name: "fail-first-problem-only" }, release("[{version}] \\q {int} }", "unknown placeholder {version}", 23), warning("Notes", "a\\q {version}{", "invalid escape \\q", 9, 21, '## Notes [pattern:"a\\q {version}{"]')),
  // One warning per tag, each at its own column.
  fail(
    { name: "fail-two-pattern-tags-one-warning-each" },
    warning("Release", "{version}", "unknown placeholder {version}", 7, 22, '## Release [pattern:"{version}"] [pattern:""]'),
    warning("Release", "", "empty pattern", 7, 34, '## Release [pattern:"{version}"] [pattern:""]'),
  ),
  // A valid first tag, an invalid second one: MTL014 at the second tag (column 43); the
  // first tag is the effective one, so the heading stays checked (pinned below).
  fail({ name: "fail-second-pattern-tag-invalid" }, warning("Release", "{version}", "unknown placeholder {version}", 7, 43, '## Release [pattern:"{semver}"] [pattern:"{version}"]')),
  // The reverse: the effective tag is invalid, so the heading is not checked.
  fail({ name: "fail-first-pattern-tag-invalid" }, warning("Release", "{version}", "unknown placeholder {version}", 7, 22, '## Release [pattern:"{version}"] [pattern:"{semver}"]')),
  // Spec 2.7: one cause, one warning: no MTL015 for the repeat and order tags of a heading
  // with an invalid pattern, template-only or not.
  fail(
    { name: "fail-repeat-and-order-tags-give-no-conflict" },
    warning("Release", "[{version}] - {date}", "unknown placeholder {version}", 7, 23, '## Release [pattern:"[{version}] - {date}"] [repeat-rules:same-level] [order:descending]'),
    warning("A", "{int}", "unknown placeholder {int}", 9, 42, '### A [presence:template-only] [pattern:"{int}"] [repeat-rules:same-level] [order:ascending]'),
  ),
  // Spec 8.2 EX4: a column counts code points, in the heading and inside the quotes.
  fail({ name: "fail-astral-heading-column-counts-code-points" }, warning("Étape 🙂", "🙂 {int}", "unknown placeholder {int}", 7, 24, '## Étape 🙂 [pattern:"🙂 {int}"]')),
  // Three codes in source order (the section order of the text report is pinned below).
  fail(
    { name: "fail-invalid-patterns-between-misplaced-and-conflicting" },
    {
      code: "MTL015",
      severity: "warning",
      message: "Heading 'Checklist': tag [content:subheadings:disallow] has no effect (the heading is [presence:template-only])",
      line: 7,
      column: 39,
      sourceLine: "## Checklist [presence:template-only] [content:subheadings:disallow]",
    },
    warning("Release", "{version}", "unknown placeholder {version}", 9, 22, '## Release [pattern:"{version}"]'),
    {
      code: "MTL013",
      severity: "warning",
      message: "Heading 'Notes [count:min:1]': tag [count:min:1] is not valid in a heading",
      line: 11,
      column: 10,
      sourceLine: "## Notes [count:min:1]",
    },
  ),
  // `{{semver}}` is the literal text `{semver}`.
  pass({ name: "pass-double-braces-are-literal" }),
  // Names and formats are matched case-insensitively (`{SemVer}`).
  pass({ name: "pass-names-are-case-insensitive" }),
  // Every placeholder of the table, `{char}` included.
  pass({ name: "pass-every-placeholder" }),
  // Every format of the table, default names included (A72m, A72n).
  pass({ name: "pass-every-format" }),
  // `padding:3`, `precision:2`, a two-digit argument and the smallest one, `padding:1`.
  pass({ name: "pass-format-arguments" }),
  // `\"` and `\\` are the two valid escapes.
  pass({ name: "pass-escaped-quote-and-backslash" }),
];

const registry = createRegistry();

async function model(text: string): Promise<DocumentModel> {
  const status = await checkTemplate(registry, text);
  if (status.status !== "ok") throw new Error("template is broken");
  return status.model;
}

async function lint(template: string, target: string): Promise<Diagnostic[]> {
  const result = await lintTarget(registry, await model(template), target, "target.md", createEnv());
  expect(result.suppressed).toBe(0);
  return result.diagnostics;
}

const codesOf = (found: readonly Diagnostic[]) => found.map(({ code, message }) => ({ code, message }));

describe("MTL014 heading-pattern-invalid (--verify)", () => {
  it("is registered in category syntax, warning, phase template", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "heading-pattern-invalid",
      category: "syntax",
      severity: "warning",
      phase: "template",
    });
  });

  it("has at least 1 pass- case and at least 1 fail- case, one fixture file each", () => {
    expectTemplateCases(CODE, CASES);
  });

  for (const { name, ...expected } of CASES) {
    it(`${name}: ${DIR}/${name}.md`, async () => {
      expect(await verifyFixture(CODE, name)).toEqual(expected);
    });
  }
});

describe("MTL014 in a lint run (spec 2.6 Checked, 2.10, DIR6)", () => {
  const head = "---\ntitle: x\n---\n\n";

  it("is never printed in a lint run and a directive naming it is MTL022 (DIR6)", async () => {
    const template = `${head}# Guide\n\n## Release [pattern:"{version}"]\n`;
    const target = `${head}# Guide\n\n<!-- md-template-lint disable MTL014 -->\n`;
    expect(codesOf(await lint(template, target))).toEqual([{ code: "MTL022", message: "Directive on line 7: rule code MTL014 cannot be disabled" }]);
  });

  it("worked example 2 of 2.10: the heading and its section-scope child are not checked", async () => {
    const template = `${head}# Changelog\n\n## Release [pattern:"[{version}] - {date}"] [repeat-rules:same-level]\n\n` + "### Added [content:list]\n";
    const target = `${head}# Changelog\n`;
    expect(await lint(template, target)).toEqual([]);
    // Same lint as the template without that heading and its descendants.
    expect(await lint(template, `${head}# Changelog\n\n## Release\n\n### Added\n\ntext\n`)).toEqual(await lint(`${head}# Changelog\n`, `${head}# Changelog\n\n## Release\n\n### Added\n\ntext\n`));
  });

  it("is not a position: the sibling it would take goes to the next position", async () => {
    const template = `${head}# Guide\n\n## A\n\n## Bad [pattern:"{x}"]\n\n## C\n`;
    const without = `${head}# Guide\n\n## A\n\n## C\n`;
    for (const target of [without, `${head}# Guide\n\n## A\n`]) {
      expect(await lint(template, target)).toEqual(await lint(without, target));
    }
    expect(codesOf(await lint(template, `${head}# Guide\n\n## A\n`))).toEqual([{ code: "MTL601", message: "Heading: Missing required heading: 'C'" }]);
  });

  it("matchHeadings: not checked, no run, not among the positions of its level", () => {
    const loaded = loadDocument(`${head}# Guide\n\n## A\n\n## Bad [pattern:"{x}"]\n\n### Child\n\n## C\n`);
    const target = loadDocument(`${head}# Guide\n\n## A\n\n## C\n`);
    if (!loaded.ok || !target.ok) throw new Error("not loaded");
    const matches = matchHeadings(loaded.model, target.model);
    const byText = (text: string) => matches.find((item) => item.section.text === text);
    expect(byText("Bad")).toMatchObject({ checked: false, run: null, match: null });
    expect(byText("Child")).toMatchObject({ checked: false, run: null, match: null });
    expect(byText("C")?.match?.text).toBe("C");
    expect(byText("A")?.run?.positions.map((position) => position.index)).toEqual([1, 4]);
  });

  it("a valid pattern heading stays checked (no MTL014 behaviour leaks to it)", async () => {
    const loaded = loadDocument(`${head}# Guide\n\n## Release [pattern:"{semver}"]\n`);
    const target = loadDocument(`${head}# Guide\n`);
    if (!loaded.ok || !target.ok) throw new Error("not loaded");
    const release = matchHeadings(loaded.model, target.model)[1];
    expect(release).toMatchObject({ checked: true });
  });

  /** `matchHeadings` of a template and a target text, by template heading text. */
  function matchesOf(templateText: string, targetText: string) {
    const loaded = loadDocument(templateText);
    const target = loadDocument(targetText);
    if (!loaded.ok || !target.ok) throw new Error("not loaded");
    const matches = matchHeadings(loaded.model, target.model);
    return (text: string) => matches.find((item) => item.section.text === text);
  }

  it("only the effective (first) pattern tag decides: an invalid second tag keeps it checked", () => {
    const fixture = (name: string) => readFileSync(join(templatesDir(CODE), `${name}.md`), "utf8");
    const target = `${head}# Guide\n\n## Release\n`;
    const second = matchesOf(fixture("fail-second-pattern-tag-invalid"), target);
    expect(second("Release")).toMatchObject({ checked: true });
    expect(second("Release")?.run).not.toBeNull();
    const first = matchesOf(fixture("fail-first-pattern-tag-invalid"), target);
    expect(first("Release")).toMatchObject({ checked: false, run: null, match: null });
  });

  it("a template-only heading with an invalid pattern gives no MTL603", async () => {
    const target = `${head}# Guide\n\n## Notes\n`;
    const tags = "[presence:template-only]";
    expect(await lint(`${head}# Guide\n\n## Notes ${tags} [pattern:"{x}"]\n`, target)).toEqual([]);
    // Control: the same heading with a valid pattern tag is checked and gets MTL603.
    expect((await lint(`${head}# Guide\n\n## Notes ${tags}\n`, target)).map(({ code }) => code)).toEqual(["MTL603"]);
  });

  it("a content-tagged heading with an invalid pattern gives no content finding", async () => {
    const target = `${head}# Guide\n\n## Notes\n`;
    expect(await lint(`${head}# Guide\n\n## Notes [pattern:"{x}"] [content:non-empty]\n`, target)).toEqual([]);
    // Control: without the invalid pattern the empty section is a content finding.
    expect((await lint(`${head}# Guide\n\n## Notes [content:non-empty]\n`, target)).map(({ code }) => code)).toEqual(["MTL701"]);
  });

  it("section scope: an H3 with an invalid pattern between two H3 is not a position", async () => {
    const template = `${head}# G\n\n## P\n\n### A\n\n### Bad [pattern:"{x}"]\n\n### C\n`;
    const target = `${head}# G\n\n## P\n\n### A\n\n### C\n`;
    const of = matchesOf(template, target);
    expect(of("A")?.run).toMatchObject({ scope: "section", parent: 1 });
    expect(of("A")?.run?.positions.map((position) => position.index)).toEqual([2, 4]);
    expect(of("Bad")).toMatchObject({ checked: false, run: null, match: null });
    expect(of("C")?.match?.text).toBe("C");
    expect(await lint(template, target)).toEqual([]);
  });

  // Spec 2.10 step 1 sets siblings aside only for a CHECKED template-only heading, and spec 2.6
  // says a heading with an invalid pattern is not checked: its text sets nothing aside, so a
  // target sibling with that text is an ordinary sibling (here it blocks position C).
  it("a template-only heading with an invalid pattern sets nothing aside", async () => {
    const template = `${head}# Guide\n\n## A\n\n## Notes [presence:template-only] [pattern:"{x}"]\n\n## C\n`;
    const target = `${head}# Guide\n\n## A\n\n## Notes\n\n## C\n`;
    const of = matchesOf(template, target);
    expect(of("Notes")).toMatchObject({ checked: false, run: null, setAside: null });
    expect(of("A")?.run?.setAside).toEqual([]);
    expect(of("C")?.match).toBeNull();
    expect(of("A")?.run?.tail.map((section) => section.text)).toEqual(["Notes", "C"]);
    const found = codesOf(await lint(template, target));
    // `## C` (line 11) comes after the cursor: the "found later" hint (spec 2.10 step 3b).
    expect(found).toContainEqual({
      code: "MTL601",
      message: "Heading: Missing required heading: 'C' (found later at line 11, out of order)",
    });
    expect(found.map(({ code }) => code)).not.toContain("MTL603");
  });

  it("MTL604 leaves a file-scope heading with an invalid pattern out of the template list", async () => {
    const template = `${head}# One\n\n## A\n\n## Bad [pattern:"{x}"]\n`;
    const target = `${head}## A\n\n# One\n`;
    expect(codesOf(await lint(template, target))).toEqual([
      {
        code: "MTL604",
        message: "Heading: Heading order mismatch: template order ['One', 'A'] vs target order ['A', 'One']",
      },
    ]);
  });

  it("MTL611 leaves a child with an invalid pattern out of the template list", async () => {
    const template = `${head}# G\n\n## P\n\n#### D\n\n### Bad [pattern:"{x}"]\n\n### A\n`;
    const target = `${head}# G\n\n## P\n\n### A\n\n#### D\n`;
    expect(codesOf(await lint(template, target))).toEqual([
      {
        code: "MTL611",
        message: "Heading: Section 'P': heading order mismatch: template order ['D', 'A'] vs target order ['A', 'D']",
      },
    ]);
  });
});

/** Stdout lines of `--verify --format <format> <name>.md` on a fixture of this code. */
async function verifyText(format: string, name: string): Promise<string[]> {
  const cwd = foldPath(templatesDir(CODE));
  const run = await runCli(["--verify", "--format", format, `${name}.md`], {
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
  expect(run.exitCode).toBe(0);
  return run.stdout.split("\n");
}

/** One item of `Invalid patterns:` (spec 8.3): text, then the excerpt 6 spaces in, a caret. */
const item = (diagnostic: VerifyDiagnostic): string[] => {
  const line = diagnostic.line ?? 0;
  const column = diagnostic.column ?? 0;
  return [`  - ${diagnostic.message} (line ${line}, column ${column})`, `      ${line} | ${diagnostic.sourceLine ?? ""}`, `      ${" ".repeat(String(line).length)} | ${" ".repeat(column - 1)}^`];
};

describe("MTL014 in the --verify text report (spec 8.3 `Invalid patterns:`)", () => {
  // CLI `--format text` is the `pretty` reporter (spec 7.3); `plain` is the other text one.
  for (const format of ["text", "plain"]) {
    for (const { name, diagnostics } of CASES) {
      const own = diagnostics.filter((diagnostic) => diagnostic.code === CODE);
      it(`${format} ${name}`, async () => {
        const out = await verifyText(format, name);
        expect(out).toContain(`Warnings:     ${diagnostics.length}`);
        if (own.length === 0) {
          expect(out).not.toContain("Invalid patterns:");
          return;
        }
        const start = out.indexOf("Invalid patterns:");
        expect(start).toBeGreaterThan(0);
        const expected = ["Invalid patterns:", ...own.flatMap(item), ""];
        expect(out.slice(start, start + expected.length)).toEqual(expected);
        expect(out.filter((text) => text === "Invalid patterns:")).toHaveLength(1);
      });
    }
  }

  // Spec 8.3 section order: Misplaced, Invalid patterns, Conflicting (code order), here the
  // reverse of the source order (lines 11, 9 and 7).
  for (const format of ["text", "plain"]) {
    it(`${format}: Invalid patterns sits between Misplaced tags and Conflicting tags`, async () => {
      const out = await verifyText(format, "fail-invalid-patterns-between-misplaced-and-conflicting");
      const start = out.indexOf("Misplaced tags:");
      expect(start).toBeGreaterThan(0);
      const expected = [
        "Misplaced tags:",
        "  - Heading 'Notes [count:min:1]': tag [count:min:1] is not valid in a heading (line 11, column 10)",
        "      11 | ## Notes [count:min:1]",
        "         | ".concat(" ".repeat(9), "^"),
        "",
        "Invalid patterns:",
        "  - Heading 'Release': invalid pattern [pattern:\"{version}\"] (unknown placeholder {version}) (line 9, column 22)",
        '      9 | ## Release [pattern:"{version}"]',
        "        | ".concat(" ".repeat(21), "^"),
        "",
        "Conflicting tags:",
        "  - Heading 'Checklist': tag [content:subheadings:disallow] has no effect (the heading is [presence:template-only]) (line 7, column 39)",
        "      7 | ## Checklist [presence:template-only] [content:subheadings:disallow]",
        "        | ".concat(" ".repeat(38), "^"),
        "",
      ];
      expect(out.slice(start, start + expected.length)).toEqual(expected);
    });
  }
});

describe("MTL014 worked example 2 of spec 2.10 (tests/fixtures/cli/schema-fail-invalid-pattern-worked-example)", () => {
  const FIXTURE = "schema-fail-invalid-pattern-worked-example";
  const expectedPlain = readFileSync(join(fixturePath("cli", FIXTURE), "expected.plain.txt"), "utf8").replaceAll("\r\n", "\n");

  it("pretty text is the plain expected file with the pass glyph", async () => {
    const run = await runCliIn(FIXTURE, ["--verify", "template.md"]);
    expect(run.exitCode).toBe(0);
    expect(run.stderr).toBe("");
    expect(run.stdout).toBe(expectedPlain.replace("  PASS template.md", "  ✓ template.md"));
  });
});
