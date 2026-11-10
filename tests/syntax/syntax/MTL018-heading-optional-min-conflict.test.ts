/**
 * MTL018 heading-optional-min-conflict (src/rules/syntax.ts, docs/spec.md 2.10 "Repeat
 * rules", 4.3, 8.3, 8.5, DIR6; owner decision 3 of A72l), via `--verify`. A REPEAT HEADING
 * (an effective pattern and an effective repeat tag: no `MTL014`, no repeat tag ignored by
 * `MTL015`) whose presence is `[presence:optional]` by the 2.6 precedence and that has an
 * effective explicit `min` tag (the first of its kind) gives one ERROR, at the `[` of that
 * `min` tag. `[presence:conditional:...]` with a `min` is not `MTL018`. A TEMPLATE ERROR
 * like `MTL017`: `--verify` FAILS the template (exit 1, JSON status `fail`,
 * `summary.errors`) without making it broken; a target directive cannot disable it (MTL022).
 *
 * Columns from the spec: `## Release [pattern:"{semver}"] ` puts the next tag at column 33.
 */
import { readdirSync } from "node:fs";
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

const CODE = "MTL018";
const DIR = "tests/fixtures/templates/MTL018";
const SECTION = "Optional headings with a minimum:";

/** The MTL018 finding of spec 4.3 on heading `heading`, its `min` tag `tag` with `N` `min`. */
const conflict = (heading: string, tag: string, min: number, line: number, column: number, sourceLine: string): VerifyDiagnostic => ({
  code: CODE,
  severity: "error",
  message: `Heading '${heading}': tag ${tag} contradicts [presence:optional] (a minimum of ${min} requires the heading)`,
  line,
  column,
  sourceLine,
});

/** A failing case: template FAIL, exit 1, its errors (then warnings) in source order. */
const fail = ({ name }: { readonly name: string }, ...diagnostics: VerifyDiagnostic[]): VerifyCase => ({ name, exitCode: 1, status: "fail", diagnostics });
/** A passing case: no MTL018, so ok and exit 0; tag warnings may remain (MTL014, MTL015). */
const pass = ({ name }: { readonly name: string }, ...diagnostics: VerifyDiagnostic[]): VerifyCase => ({ name, exitCode: 0, status: "ok", diagnostics });

/** Case -> fixture `<name>.md` -> expected `--verify` result. */
const CASES: readonly VerifyCase[] = [
  // `min:1`: the presence tag after the `min` tag.
  fail({ name: "fail-optional-min-one" }, conflict("Release", "[repeat-rules:same-level:min:1]", 1, 5, 33, '## Release [pattern:"{semver}"] [repeat-rules:same-level:min:1] [presence:optional]')),
  // `min:3` on a section-scope heading (H3 under `## Steps`).
  fail({ name: "fail-optional-min-three" }, conflict("Step", "[repeat-rules:same-level:min:3]", 3, 7, 36, '### Step [pattern:"Step {digits}"] [repeat-rules:same-level:min:3] [presence:optional]')),
  // The presence tag before the `min` tag: the position is still the `[` of the `min` tag.
  fail({ name: "fail-presence-tag-before-min-tag" }, conflict("Release", "[repeat-rules:same-level:min:2]", 2, 5, 53, '## Release [pattern:"{semver}"] [presence:optional] [repeat-rules:same-level:min:2]')),
  // The presence tag after the `min` tag (another heading and pattern than min-one).
  fail({ name: "fail-presence-tag-after-min-tag" }, conflict("Version", "[repeat-rules:same-level:min:2]", 2, 5, 34, '## Version [pattern:"v{digits}"] [repeat-rules:same-level:min:2] [presence:optional]')),
  // Two headings, two findings (one per heading, each at its own `min` tag): `Errors: 2`.
  fail(
    { name: "fail-two-headings-two-findings" },
    conflict("Release", "[repeat-rules:same-level:min:2]", 2, 5, 33, '## Release [pattern:"{semver}"] [repeat-rules:same-level:min:2] [presence:optional]'),
    conflict("Hotfix", "[repeat-rules:same-level:min:3]", 3, 7, 39, '## Hotfix [pattern:"hotfix {digits}"] [repeat-rules:same-level:min:3] [presence:optional]'),
  ),
  // Spec 2.6 precedence is conditional, template-only, OPTIONAL, then required: optional wins
  // over required whichever tag comes first in the line.
  fail(
    { name: "fail-required-and-optional-tags-optional-wins-in-both-orders" },
    conflict("A", "[repeat-rules:same-level:min:2]", 2, 5, 28, '## A [pattern:"a{digits}"] [repeat-rules:same-level:min:2] [presence:required] [presence:optional]'),
    conflict("B", "[repeat-rules:same-level:min:3]", 3, 7, 28, '## B [pattern:"b{digits}"] [repeat-rules:same-level:min:3] [presence:optional] [presence:required]'),
  ),
  // `min:0` and `min:02` are malformed (spec 2.10: N is 1 or more, no leading zero): MTL012,
  // the bracket stays in the heading text, there is no `min` tag and so no MTL018.
  pass(
    { name: "pass-malformed-min-tag-is-not-a-min" },
    {
      code: "MTL012",
      severity: "warning",
      message: "Heading 'Release [pattern:\"{semver}\"] [repeat-rules:same-level:min:0]': " + "malformed tag [repeat-rules:same-level:min:0]",
      line: 5,
      column: 62,
      sourceLine: '## Release [pattern:"{semver}"] [repeat-rules:same-level:min:0] [presence:optional]',
    },
    {
      code: "MTL012",
      severity: "warning",
      message: "Heading 'Hotfix [pattern:\"{digits}\"] [repeat-rules:same-level:min:02]': " + "malformed tag [repeat-rules:same-level:min:02]",
      line: 7,
      column: 61,
      sourceLine: '## Hotfix [pattern:"{digits}"] [repeat-rules:same-level:min:02] [presence:optional]',
    },
  ),
  // Required by default and by tag: the `min` is the only minimum.
  pass({ name: "pass-required-with-min" }),
  // A `max` only states no minimum.
  pass({ name: "pass-optional-with-max-only" }),
  // `[repeat-rules:same-level]` only: the default minimum 0 of an optional heading.
  pass({ name: "pass-optional-with-repeat-only" }),
  // Conditional (also when `[presence:optional]` is there too: conditional wins, 2.6).
  pass({ name: "pass-conditional-with-min" }),
  // No pattern: the `min` tag is ignored, MTL015 speaks instead.
  pass(
    { name: "pass-min-without-pattern" },
    {
      code: "MTL015",
      severity: "warning",
      message: "Heading 'Release': tag [repeat-rules:same-level:min:2] has no effect (the heading has no [pattern:...])",
      line: 5,
      column: 12,
      sourceLine: "## Release [repeat-rules:same-level:min:2] [presence:optional]",
    },
  ),
  // An invalid pattern: not a repeat heading, MTL014 speaks instead.
  pass(
    { name: "pass-invalid-pattern" },
    {
      code: "MTL014",
      severity: "warning",
      message: "Heading 'Release': invalid pattern [pattern:\"{semver\"] (unmatched '{')",
      line: 5,
      column: 22,
      sourceLine: '## Release [pattern:"{semver"] [repeat-rules:same-level:min:2] [presence:optional]',
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

/** One item of the section (spec 8.3): text, then the excerpt 6 spaces in, a caret. */
const item = (diagnostic: VerifyDiagnostic): string[] => {
  const line = diagnostic.line ?? 0;
  const column = diagnostic.column ?? 0;
  return [`  - ${diagnostic.message} (line ${line}, column ${column})`, `      ${line} | ${diagnostic.sourceLine ?? ""}`, `      ${" ".repeat(String(line).length)} | ${" ".repeat(column - 1)}^`];
};

describe("MTL018 heading-optional-min-conflict (--verify)", () => {
  it("is registered in category syntax, error, phase template, right after MTL017", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "heading-optional-min-conflict",
      category: "syntax",
      severity: "error",
      phase: "template",
    });
    const codes = registry.byCategory.get("syntax")?.map((rule) => rule.code) ?? [];
    expect(codes.indexOf(CODE)).toBe(codes.indexOf("MTL017") + 1);
  });

  it("has at least 1 pass- and 1 fail- case, one fixture file each; MTL018 in fail- only", () => {
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
    const text = "---\ntitle: x\n---\n\n## A [repeat-rules:same-level:min:1]\n\n" + '## B [pattern:"{semver}"] [repeat-rules:same-level:min:1] [presence:optional]\n';
    const status = await checkTemplate(registry, text);
    if (status.status !== "ok") throw new Error("template is broken");
    expect(status.errors.map(({ code }) => code)).toEqual([CODE]);
    expect(status.warnings.map(({ code }) => code)).toEqual(["MTL015"]);
    const result = await verifyPaths({
      cwd: foldPath(templatesDir(CODE)),
      home: HOME,
      paths: ["fail-optional-min-one.md"],
    });
    expect(result.summary).toEqual({
      templates: 1,
      broken: 0,
      errors: 1,
      warnings: 0,
      runErrors: 0,
      exitCode: 1,
    });
  });

  it("only the first min tag is effective: one finding, its tag and N", async () => {
    const text = '---\ntitle: x\n---\n\n## V [pattern:"{digits}"] [repeat-rules:same-level] ' + "[repeat-rules:same-level:min:2] [repeat-rules:same-level:min:5] [presence:optional]\n";
    const status = await checkTemplate(registry, text);
    if (status.status !== "ok") throw new Error("template is broken");
    expect(status.warnings).toEqual([]);
    expect(status.errors.map(({ message, position }) => ({ message, position }))).toEqual([
      {
        message: "Heading 'V': tag [repeat-rules:same-level:min:2] contradicts [presence:optional] " + "(a minimum of 2 requires the heading)",
        position: { line: 5, column: 53 },
      },
    ]);
  });

  it("a template-only heading with a min is no repeat heading: MTL015, no MTL018", async () => {
    const text = '---\ntitle: x\n---\n\n## Draft [pattern:"{semver}"] [repeat-rules:same-level:min:1] ' + "[presence:optional] [presence:template-only]\n";
    const status = await checkTemplate(registry, text);
    if (status.status !== "ok") throw new Error("template is broken");
    expect(status.errors).toEqual([]);
    expect(status.warnings.map(({ code }) => code)).toEqual(["MTL015", "MTL015"]);
  });

  it("a target directive cannot disable it (DIR6: MTL022)", async () => {
    const status = await checkTemplate(registry, "---\ntitle: x\n---\n\n## Notes\n");
    if (status.status !== "ok") throw new Error("template is broken");
    const target = "---\ntitle: x\n---\n\n## Notes\n\n<!-- md-template-lint disable MTL018 -->\n";
    const result = await lintTarget(registry, status.model, target, "target.md", createEnv());
    expect(result.diagnostics.map(({ code, message }) => ({ code, message }))).toEqual([{ code: "MTL022", message: "Directive on line 7: rule code MTL018 cannot be disabled" }]);
  });
});

describe(`MTL018 in the --verify text report (spec 8.3 \`${SECTION}\`)`, () => {
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

  it("--quiet keeps the fail header and the error section only, exit 1", async () => {
    const name = "fail-optional-min-one";
    const run = await verifyRun("plain", name, true);
    expect(run.exitCode).toBe(1);
    expect(run.stdout).toBe(
      [
        `  FAIL ${name}.md`,
        SECTION,
        "  - Heading 'Release': tag [repeat-rules:same-level:min:1] contradicts [presence:optional] (a minimum of 1 requires the heading) (line 5, column 33)",
        '      5 | ## Release [pattern:"{semver}"] [repeat-rules:same-level:min:1] [presence:optional]',
        "        |                                 ^",
        "",
        "",
      ].join("\n"),
    );
  });

  it("--quiet still prints nothing for a passing template (warnings stay hidden)", async () => {
    const run = await verifyRun("plain", "pass-min-without-pattern", true);
    expect(run).toMatchObject({ stdout: "", exitCode: 0 });
  });
});
