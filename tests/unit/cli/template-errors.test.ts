/**
 * Template errors in a lint run (docs/spec.md 7.5, 8.2, 8.5, owner decision 2 of A72l,
 * phase P7d): a template with a template error (`MTL017` here) prints its entry
 * `✗ <template> (template)` / `FAIL ... (template)` with the error lines and their
 * template-line excerpts before the files of each pair block that uses it, is listed once
 * under `Failed templates:` (before `Failed files:`), removes `All files passed!`, survives
 * `--quiet`, has JSON `template.status` `fail` with `diagnostics`, and makes the run exit 1;
 * the targets are still linted. Template warnings are never printed in a lint run.
 * Fixtures: tests/fixtures/cli/template-<case>/. The worked example (the `MTL017` part of
 * worked example 5 of spec 2.10, line 9 without `[presence:optional]` so no `MTL018`) and
 * worked example 5 as written (`MTL017` and `MTL018`, phase P7e), worked example 3 of spec
 * 2.6 (`MTL019` and the target's `MTL611`, phase P7i) and the `MTL030` variant of worked
 * example 7 J of spec 2.10 (phase P7j) have hand-written expected files: `expected.txt`
 * (pretty), `expected.plain.txt`, `expected.quiet.txt` (pretty `--quiet`) and `expected.json`
 * (the whole document).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { expectSplit, fixturePath } from "../../helpers/fixtures.js";
import { lintedOf, parseJson, runCliIn } from "../../helpers/cli.js";

const GROUP = "template-";
const TEMPLATE = "templates/versions.template.md";
const MTL017 =
  "      error MTL017 Heading 'Notes': matches the same headings as the previous heading 'Notes' (line 5)\n" +
  "        7 | ## Notes [presence:optional]\n" +
  "          |    ^\n";
const MTL018 =
  "      error MTL018 Heading 'Release': tag [repeat-rules:same-level:min:2] contradicts [presence:optional] (a minimum of 2 requires the heading)\n" +
  '        9 | ## Release [pattern:"{semver}"] [repeat-rules:same-level:min:2] [presence:optional]\n' +
  `          | ${" ".repeat(32)}^\n`;
const MTL019 =
  "      error MTL019 Heading 'Steps' (H3): comes after the deeper child 'Details' (H4, line 9) under 'Setup'\n" +
  "        11 | ### Steps\n" +
  "           | ^\n";
const MTL030 =
  "      error MTL030 Heading 'Epic A - Title': tag [order:ascending] needs [repeat-rules:same-level] (an order compares the repeats of one heading)\n" +
  '        5 | ## Epic A - Title [pattern:"Epic {char} - {text}"] [order:ascending] [content:table]\n' +
  `          | ${" ".repeat(51)}^\n`;

/**
 * The template errors of the `all.template.md` fixture, as printed (spec 8.2, 8.4): sorted by
 * template line, then code. Their emission order is code order (MTL017, MTL018, MTL019, MTL030),
 * so only the sort puts MTL030 (line 5) first and MTL018 (line 17) last.
 */
const SEVERAL =
  "      error MTL030 Heading 'Epic': tag [order:ascending] needs [repeat-rules:same-level] (an order compares the repeats of one heading)\n" +
  '        5 | ## Epic [pattern:"E{digits}"] [order:ascending]\n' +
  `          | ${" ".repeat(30)}^\n` +
  "      error MTL019 Heading 'Steps' (H3): comes after the deeper child 'Details' (H4, line 9) under 'Setup'\n" +
  "        11 | ### Steps\n" +
  "           | ^\n" +
  "      error MTL017 Heading 'Notes': matches the same headings as the previous heading 'Notes' (line 13)\n" +
  "        15 | ## Notes\n" +
  `           | ${" ".repeat(3)}^\n` +
  "      error MTL018 Heading 'Rel': tag [repeat-rules:same-level:min:2] contradicts [presence:optional] (a minimum of 2 requires the heading)\n" +
  '        17 | ## Rel [pattern:"{semver}"] [repeat-rules:same-level:min:2] [presence:optional]\n' +
  `           | ${" ".repeat(28)}^\n`;

interface Case {
  readonly name: string;
  readonly exitCode: 0 | 1 | 2;
  /** Exact stderr of the plain run (run errors); empty when omitted. */
  readonly stderr?: string;
  /** `root:pair:path` of the linted files (the targets are always linted). */
  readonly linted: readonly string[];
  /** Fragments of the plain output, in the order they must appear. */
  readonly plain: readonly string[];
  /** Fragments the plain output must not have. */
  readonly absent: readonly string[];
}

/** At least 1 passing case and 1 failing case; one fixture directory per case. */
const CASES: readonly Case[] = [
  {
    name: "fail-duplicate-pattern-worked-example",
    exitCode: 1,
    linted: ["project:versions:notes/a.md"],
    plain: [`  FAIL ${TEMPLATE} (template)\n${MTL017}  PASS notes/a.md\n`, "Failed templates:"],
    absent: ["All files passed!", "Failed files:"],
  },
  {
    // Worked example 5 of spec 2.10 as written: both template errors, MTL017 then MTL018
    // (phase P7e), in source order; the target is still linted and passes.
    name: "fail-worked-example-5-both-errors",
    exitCode: 1,
    linted: ["project:versions:notes/a.md"],
    plain: [
      `  FAIL ${TEMPLATE} (template)\n${MTL017}${MTL018}  PASS notes/a.md\n`,
      "Failed templates:",
    ],
    absent: ["All files passed!", "Failed files:"],
  },
  {
    // Worked example 3 of spec 2.6 (phase P7i): the template error MTL019 on the template,
    // the target still linted and failing with MTL611; `Failed files:` after `Failed templates:`.
    name: "fail-worked-example-3-child-order",
    exitCode: 1,
    linted: ["project:guide:notes/guide.md"],
    plain: [
      `  FAIL templates/guide.template.md (template)\n${MTL019}  FAIL notes/guide.md\n`,
      "      error MTL611 Heading: Section 'Setup': heading order mismatch:",
      "Failed templates:\n  - templates/guide.template.md\n\nFailed files:\n  - notes/guide.md\n",
    ],
    absent: ["All files passed!", "PASS"],
  },
  {
    // The MTL030 variant of worked example 7 J of spec 2.10 (phase P7j): the template error
    // on the template; the target is still linted with the heading as a single position (the
    // order tag compares nothing, no MTL609) and passes.
    name: "fail-worked-example-7-j-order-without-repeat",
    exitCode: 1,
    linted: ["project:epics:notes/a.md"],
    plain: [
      `  FAIL templates/epics.template.md (template)\n${MTL030}  PASS notes/a.md\n`,
      "Failed templates:\n  - templates/epics.template.md\n",
    ],
    absent: ["All files passed!", "Failed files:", "MTL609"],
  },
  {
    // One template, two pairs: the entry in both blocks, counted and listed once.
    name: "fail-two-pairs-one-template",
    exitCode: 1,
    linted: ["project:notes:notes/a.md", "project:more:more/b.md"],
    plain: [
      `  FAIL ${TEMPLATE} (template)\n${MTL017}  PASS notes/a.md\n`,
      `  FAIL ${TEMPLATE} (template)\n${MTL017}  PASS more/b.md\n`,
      "Templates:    1 checked, 0 broken\n",
      `Failed templates:\n  - ${TEMPLATE}\n\n========================\n`,
    ],
    absent: ["All files passed!", "Failed files:"],
  },
  {
    // Worked example 5 variant: the target also fails (MTL607), `Failed files:` comes after
    // `Failed templates:`.
    name: "fail-failing-target",
    exitCode: 1,
    linted: ["project:versions:notes/a.md"],
    plain: [
      `  FAIL ${TEMPLATE} (template)\n${MTL017}  FAIL notes/a.md\n`,
      '      error MTL607 Heading: 1 heading(s) match [pattern:"{semver}"], minimum is 2\n',
      "Failed:       1\n",
      `Failed templates:\n  - ${TEMPLATE}\n\nFailed files:\n  - notes/a.md\n`,
    ],
    absent: ["All files passed!"],
  },
  {
    // Spec 8.2 and 8.4: the errors of one template sort by template line, then code: MTL030
    // (line 5), MTL019 (11), MTL017 (15), MTL018 (17); the target is still linted.
    name: "fail-several-errors-sorted-by-line-then-code",
    exitCode: 1,
    linted: ["project:all:notes/a.md"],
    plain: [
      `  FAIL templates/all.template.md (template)\n${SEVERAL}  PASS notes/a.md\n`,
      "Failed templates:\n  - templates/all.template.md\n",
    ],
    absent: ["All files passed!", "Failed files:"],
  },
  {
    // Spec 7.5: exit 2 takes precedence over exit 1. The pair `ghost` has no template
    // (MTL910); the independent pair `versions` is still linted with its template error.
    name: "fail-run-error-outranks-failed-template",
    exitCode: 2,
    stderr: "error MTL910: template not found: templates/missing.template.md (pair 'ghost')\n",
    linted: ["project:versions:notes/a.md"],
    plain: [
      `  FAIL ${TEMPLATE} (template)\n${MTL017}  PASS notes/a.md\n`,
      "Run errors:   1\n",
      `Failed templates:\n  - ${TEMPLATE}\n`,
    ],
    absent: ["All files passed!", "Failed files:"],
  },
  {
    // Spec 8.2: a broken template and a failed template in one run. The broken one is
    // `TEMPLATE ERROR` and skips its files; both count in `checked`; `Broken templates:` comes
    // before `Failed templates:`.
    name: "fail-broken-and-failed-templates-in-one-run",
    exitCode: 1,
    linted: ["project:versions:notes/a.md"],
    plain: [
      `  FAIL ${TEMPLATE} (template)\n${MTL017}  PASS notes/a.md\n`,
      "  TEMPLATE ERROR: templates/broken.template.md - File must have YAML frontmatter (---...---)\n",
      "Templates:    2 checked, 1 broken\n",
      "Broken templates:\n  - templates/broken.template.md - File must have YAML frontmatter (---...---)\n\n" +
        `Failed templates:\n  - ${TEMPLATE}\n`,
    ],
    absent: ["All files passed!", "Failed files:", "more/b.md"],
  },
  {
    // Spec 8.2: a pair with no files raises MTL913 before its template is parsed, so the
    // template error of an empty pair is not reported: exit 0, nothing checked.
    name: "pass-failed-template-of-an-empty-pair-is-not-parsed",
    exitCode: 0,
    linted: [],
    plain: [
      "INFO MTL913 no files matched pair 'versions' in root 'project'\n",
      "Templates:    0 checked, 0 broken\n",
      "No files linted.\n",
    ],
    absent: ["(template)", "Failed templates:", "MTL017", "All files passed!"],
  },
  {
    // Template warnings only (MTL010): nothing extra printed, exit by the targets only.
    name: "pass-warnings-only",
    exitCode: 0,
    linted: ["project:versions:notes/a.md"],
    plain: ["  PASS notes/a.md\n", "All files passed!\n"],
    absent: ["(template)", "Failed templates:", "MTL010", "optionl", "FAIL"],
  },
];

const fixture = (name: string): string => `${GROUP}${name}`;
/** An expected-output file with `\r\n` read as `\n` (a checkout may convert line ends). */
const expectedFile = (name: string, file: string): string =>
  readFileSync(join(fixturePath("cli", fixture(name)), file), "utf8").replaceAll("\r\n", "\n");

function expectInOrder(text: string, fragments: readonly string[]): void {
  let from = 0;
  for (const fragment of fragments) {
    const at = text.indexOf(fragment, from);
    expect(at, `"${fragment}" in order in:\n${text}`).toBeGreaterThanOrEqual(0);
    from = at + fragment.length;
  }
}

const count = (text: string, fragment: string): number => text.split(fragment).length - 1;

describe("cli template errors in a lint run: layout", () => {
  it("has at least 1 pass- case, at least 1 fail- case, one directory each", () => {
    expectSplit("cli", GROUP, CASES);
  });
});

describe("cli template errors in a lint run (spec 7.5, 8.2, 8.5)", () => {
  for (const testCase of CASES) {
    it(`${testCase.name}: plain text, exit ${testCase.exitCode}`, async () => {
      const run = await runCliIn(fixture(testCase.name), ["--format", "plain"]);
      expect(run.exitCode).toBe(testCase.exitCode);
      expect(run.stderr).toBe(testCase.stderr ?? "");
      expectInOrder(run.stdout, testCase.plain);
      for (const fragment of testCase.absent) expect(run.stdout).not.toContain(fragment);
    });

    it(`${testCase.name}: JSON lints every target, exit code in the summary`, async () => {
      const run = await runCliIn(fixture(testCase.name), ["--format", "json"]);
      const json = parseJson(run.stdout);
      expect(run.exitCode).toBe(testCase.exitCode);
      expect(json.summary["exitCode"]).toBe(testCase.exitCode);
      expect(lintedOf(json)).toEqual(testCase.linted);
      expect(run.stderr).toBe("");
    });
  }
});

/**
 * Worked example 5 of spec 2.10: its `MTL017` part (P7d), and as written with `MTL018` (P7e);
 * worked example 3 of spec 2.6, `MTL019` with a failing target (P7i); the `MTL030` variant of
 * worked example 7 J of spec 2.10 (P7j).
 */
const WORKED_EXAMPLES = [
  ["fail-duplicate-pattern-worked-example", "MTL017 part of worked example 5 of spec 2.10"],
  ["fail-worked-example-5-both-errors", "worked example 5 of spec 2.10, MTL017 and MTL018"],
  ["fail-worked-example-3-child-order", "worked example 3 of spec 2.6, MTL019 and MTL611"],
  ["fail-worked-example-7-j-order-without-repeat", "MTL030 variant of worked example 7 J"],
] as const;

for (const [NAME, title] of WORKED_EXAMPLES)
  describe(`cli template errors: worked example (${title})`, () => {
    it("pretty output is expected.txt", async () => {
      const run = await runCliIn(fixture(NAME), []);
      expect(run.exitCode).toBe(1);
      expect(run.stdout).toBe(expectedFile(NAME, "expected.txt"));
    });

    it("plain output is expected.plain.txt", async () => {
      const run = await runCliIn(fixture(NAME), ["--format", "plain"]);
      expect(run.stdout).toBe(expectedFile(NAME, "expected.plain.txt"));
    });

    it("--quiet keeps the template entry with its error and excerpt, hides a passing target", async () => {
      const run = await runCliIn(fixture(NAME), ["--quiet"]);
      expect(run.exitCode).toBe(1);
      expect(run.stdout).toBe(expectedFile(NAME, "expected.quiet.txt"));
    });

    it("JSON is expected.json: template status fail with diagnostics and sourceLine", async () => {
      const run = await runCliIn(fixture(NAME), ["--format", "json"]);
      expect(run.exitCode).toBe(1);
      expect(JSON.parse(run.stdout)).toEqual(JSON.parse(expectedFile(NAME, "expected.json")));
    });

    it("JSON template keys are path, status, diagnostics; no summary key is added", async () => {
      const run = await runCliIn(fixture(NAME), ["--format", "json"]);
      const document = JSON.parse(run.stdout) as {
        results: { template: object }[];
        summary: object;
      };
      expect(Object.keys(document.results[0]?.template ?? {})).toEqual([
        "path",
        "status",
        "diagnostics",
      ]);
      expect(Object.keys(document.summary)).not.toContain("templatesFailed");
    });
  });

/**
 * The four later fixtures with a hand-derived expected output in every format (spec 7.5, 8.2 to
 * 8.5): `expected.txt` (pretty), `expected.plain.txt`, `expected.quiet.txt` (pretty `--quiet`),
 * `expected.json`, and `expected.stderr.txt` when the run has a run error (stderr is the same in
 * every text mode, also under `--quiet`; JSON keeps run errors inside the document).
 */
const EXACT = [
  { name: "fail-several-errors-sorted-by-line-then-code", exitCode: 1, stderr: false },
  { name: "fail-run-error-outranks-failed-template", exitCode: 2, stderr: true },
  { name: "fail-broken-and-failed-templates-in-one-run", exitCode: 1, stderr: false },
  { name: "pass-failed-template-of-an-empty-pair-is-not-parsed", exitCode: 0, stderr: false },
] as const;

for (const { name, exitCode, stderr } of EXACT)
  describe(`cli template errors: exact output of ${GROUP}${name}`, () => {
    const stderrText = stderr ? expectedFile(name, "expected.stderr.txt") : "";

    it(`pretty output is expected.txt, exit ${exitCode}`, async () => {
      const run = await runCliIn(fixture(name), []);
      expect(run.exitCode).toBe(exitCode);
      expect(run.stderr).toBe(stderrText);
      expect(run.stdout).toBe(expectedFile(name, "expected.txt"));
    });

    it(`plain output is expected.plain.txt, exit ${exitCode}`, async () => {
      const run = await runCliIn(fixture(name), ["--format", "plain"]);
      expect(run.exitCode).toBe(exitCode);
      expect(run.stderr).toBe(stderrText);
      expect(run.stdout).toBe(expectedFile(name, "expected.plain.txt"));
    });

    it(`--quiet output is expected.quiet.txt, exit ${exitCode}, same stderr`, async () => {
      const run = await runCliIn(fixture(name), ["--quiet"]);
      expect(run.exitCode).toBe(exitCode);
      expect(run.stderr).toBe(stderrText);
      expect(run.stdout).toBe(expectedFile(name, "expected.quiet.txt"));
    });

    it(`JSON is expected.json (message, sourceLine, line, column), exit ${exitCode}`, async () => {
      const run = await runCliIn(fixture(name), ["--format", "json"]);
      expect(run.exitCode).toBe(exitCode);
      expect(run.stderr).toBe("");
      const document = JSON.parse(run.stdout) as { summary: { exitCode: number } };
      expect(document).toEqual(JSON.parse(expectedFile(name, "expected.json")));
      expect(document.summary.exitCode).toBe(exitCode);
    });

    it("--quiet --format json is the same document as the full JSON", async () => {
      const full = await runCliIn(fixture(name), ["--format", "json"]);
      const quiet = await runCliIn(fixture(name), ["--format", "json", "--quiet"]);
      expect(quiet.exitCode).toBe(exitCode);
      expect(quiet.stdout).toBe(full.stdout);
    });
  });

describe("cli template errors: shared template and warnings", () => {
  it("fail-two-pairs-one-template: entry in both blocks, listed once, both JSON blocks fail", async () => {
    const text = await runCliIn(fixture("fail-two-pairs-one-template"), ["--format", "plain"]);
    expect(count(text.stdout, `  FAIL ${TEMPLATE} (template)\n`)).toBe(2);
    expect(count(text.stdout, `  - ${TEMPLATE}\n`)).toBe(1);
    const quiet = await runCliIn(fixture("fail-two-pairs-one-template"), ["--quiet"]);
    expect(count(quiet.stdout, `  ✗ ${TEMPLATE} (template)\n`)).toBe(2);
    const json = JSON.parse(
      (await runCliIn(fixture("fail-two-pairs-one-template"), ["--format", "json"])).stdout,
    ) as { results: { template: { status: string; diagnostics: object[] } }[] };
    expect(json.results.map((block) => block.template.status)).toEqual(["fail", "fail"]);
    expect(json.results.map((block) => block.template.diagnostics.length)).toEqual([1, 1]);
  });

  it("several errors: JSON diagnostics are in template line order, then code", async () => {
    const name = "fail-several-errors-sorted-by-line-then-code";
    const json = JSON.parse((await runCliIn(fixture(name), ["--format", "json"])).stdout) as {
      results: { template: { diagnostics: { code: string; line: number }[] } }[];
    };
    const found = json.results[0]?.template.diagnostics ?? [];
    expect(found.map((item) => [item.code, item.line])).toEqual([
      ["MTL030", 5],
      ["MTL019", 11],
      ["MTL017", 15],
      ["MTL018", 17],
    ]);
  });

  it("several errors: --verify prints the four sections in code order, exit 1", async () => {
    const name = "fail-several-errors-sorted-by-line-then-code";
    const run = await runCliIn(fixture(name), [
      "--verify",
      "--format",
      "plain",
      "templates/all.template.md",
    ]);
    expect(run.exitCode).toBe(1);
    const out = run.stdout.split("\n");
    const at = [
      "Duplicate patterns:",
      "Optional headings with a minimum:",
      "Child headings out of level order:",
      "Order tags without repeat:",
    ].map((section) => out.indexOf(section));
    expect(at.every((index) => index > 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    expect(out).toContain("Errors:       4");
    expect(out).toContain("  FAIL templates/all.template.md");
  });

  it("run error and failed template: JSON keeps both, the exit code is 2", async () => {
    const name = "fail-run-error-outranks-failed-template";
    const run = await runCliIn(fixture(name), ["--format", "json"]);
    const json = JSON.parse(run.stdout) as {
      results: { template: { status: string } }[];
      runErrors: { code: string }[];
      summary: { exitCode: number };
    };
    expect(run.exitCode).toBe(2);
    expect(json.summary.exitCode).toBe(2);
    expect(json.runErrors.map((error) => error.code)).toEqual(["MTL910"]);
    expect(json.results.map((block) => block.template.status)).toEqual(["fail"]);
  });

  it("broken and failed templates in one run: JSON statuses in pair order, exit 1", async () => {
    const name = "fail-broken-and-failed-templates-in-one-run";
    const run = await runCliIn(fixture(name), ["--format", "json"]);
    const json = JSON.parse(run.stdout) as { results: { template: { status: string } }[] };
    expect(run.exitCode).toBe(1);
    expect(json.results.map((block) => block.template.status)).toEqual(["fail", "broken"]);
  });

  it("file-list mode (lint-staged) with a failed template: exit 1, target linted", async () => {
    const name = "fail-duplicate-pattern-worked-example";
    const run = await runCliIn(fixture(name), ["--format", "json", "notes/a.md"]);
    const json = parseJson(run.stdout);
    expect(run.exitCode).toBe(1);
    expect(json.summary["exitCode"]).toBe(1);
    expect(lintedOf(json)).toEqual(["project:versions:notes/a.md"]);
    const blocks = JSON.parse(run.stdout) as { results: { template: { status: string } }[] };
    expect(blocks.results.map((block) => block.template.status)).toEqual(["fail"]);
    const quiet = await runCliIn(fixture(name), ["--quiet", "notes/a.md"]);
    expect(quiet.exitCode).toBe(1);
    expect(quiet.stdout).toContain(`  ✗ ${TEMPLATE} (template)\n${MTL017}`);
    expect(quiet.stdout).not.toContain("notes/a.md");
  });

  it("pass-warnings-only: JSON template is ok with no diagnostics, --quiet prints nothing", async () => {
    const json = JSON.parse(
      (await runCliIn(fixture("pass-warnings-only"), ["--format", "json"])).stdout,
    ) as { results: { template: object }[] };
    expect(json.results[0]?.template).toEqual({ path: TEMPLATE, status: "ok" });
    expect(await runCliIn(fixture("pass-warnings-only"), ["--quiet"])).toMatchObject({
      stdout: "",
      stderr: "",
      exitCode: 0,
    });
  });
});
