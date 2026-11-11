/**
 * `--verify` schema output (docs/spec.md 7.3, 8.3, 8.5): the table of fields (inferred type
 * and rules), the headings with their rules, the `Filename:` line and the sections for
 * unknown, malformed and misplaced tags; and the same data as JSON (`filenameCase`, `fields`,
 * `headings`, `diagnostics`). Each case is a folder with `template.md` and two expected-output files,
 * `expected.plain.txt` (the whole plain output) and `expected.json` (the `templates` array),
 * written from the spec rules, not generated.
 * Fixtures: tests/fixtures/cli/schema-<case>/. "fail-" here means the schema reports tag
 * problems; they are warnings, so every case is exit 0, except a template ERROR (MTL017,
 * spec 2.7), which is exit 1 (`exitCode` of the case). The templates with no heading or no
 * field carry such a problem on purpose, so they are fail- cases and the group keeps its
 * split (at least one pass- and one fail- case).
 *
 * Implementation-defined, not covered by spec 8.3: the expected files show a MALFORMED or MISPLACED
 * heading tag left in the heading text (`## Body [content:min-lines:abc]`, as the engine's
 * heading extraction keeps any bracket it does not recognise, spec 2.6). Spec 8.3 only
 * describes an unknown heading tag. A change of that extraction changes those files.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { foldPath } from "../../../src/config/paths.js";
import { expectSplit, fixturePath } from "../../helpers/fixtures.js";
import { parseJson, runCliIn } from "../../helpers/cli.js";

const GROUP = "schema-";

interface Case {
  readonly name: string;
  /** Fragments the text output must show, in order (a reading aid on top of the expected file). */
  readonly shows: readonly string[];
  /** Fragments the text output must not have. */
  readonly lacks: readonly string[];
  /** Exit code: 0 (tag warnings never fail) unless the template has a template error (1). */
  readonly exitCode?: 0 | 1;
}

/** At least 1 passing case and 1 failing case; one fixture directory per case. */
const CASES: readonly Case[] = [
  {
    // Types: enum, int, url, list-of-date, list, string; every rule kind, the first tag of a
    // kind wins (count:min:2 over count:min:9), conditional beats optional.
    // Presence is always the first rule (required when untagged; conditional carries its text).
    // Headings: conditional beats required, template-only beats optional, optional beats required.
    name: "pass-several-types-rules-headings",
    shows: [
      "Filename: [filename:case:snake_case]",
      "Field       Type          Rules",
      "id          string        presence:required, value:filename",
      "status      enum          presence:optional, enum:draft|accepted",
      "owner       string        presence:conditional:only when risky",
      "plain       string        presence:required\n",
      "Headings:",
      "  # ADR (presence:required)",
      "  ## Context (presence:required, content:non-empty)",
      "  ## Gate (presence:conditional:when ready)",
      "  ## Review gate (presence:conditional:only when risky)",
      "  ## Both (presence:template-only)",
      "  ## Mixed (presence:optional)",
      "  ## Free text (presence:required)",
    ],
    lacks: ["Unknown tags", "Malformed tags", "Misplaced tags"],
  },
  {
    // Fields first, then headings; an unknown heading tag stays in the heading text.
    name: "fail-unknown-tags",
    shows: ["Unknown tags found (typo or unimplemented feature):", "  - Field 'owner': unknown tag [optionl]", "  - Heading 'Overview [bogus]': unknown tag [bogus]"],
    lacks: ["Filename:", "Malformed tags", "Misplaced tags"],
  },
  {
    name: "fail-malformed-tags",
    shows: ["Malformed tags:", "  - Field 'tags': malformed tag [count:min:abc] (line 2, column 26)"],
    lacks: ["Filename:", "Unknown tags", "Misplaced tags"],
  },
  {
    name: "fail-misplaced-tags",
    shows: ["Misplaced tags:", "  - Field 'title': tag [content:non-empty] is not valid in frontmatter (line 2, column 19)", "  - Heading 'Body [value:filename]': tag [value:filename] is not valid in a heading (line 5, column 9)"],
    lacks: ["Filename:", "Unknown tags", "Malformed tags"],
  },
  {
    // The three kinds together, written in the REVERSE of the section order (misplaced,
    // malformed, unknown; headings likewise): the sections are always unknown, malformed,
    // misplaced, and inside unknown the fields come before the headings.
    name: "fail-all-problem-kinds-together",
    shows: [
      "Unknown tags found (typo or unimplemented feature):",
      "  - Field 'unknown_field'",
      "  - Heading 'Unknown heading [bogus]'",
      "Malformed tags:",
      "  - Field 'bad_count'",
      "  - Heading 'Bad heading [content:min-lines:abc]'",
      "Misplaced tags:",
      "  - Field 'wrong_place'",
      "  - Heading 'Wrong heading [value:filename]'",
    ],
    lacks: ["Filename:"],
  },
  {
    // Spec 8.3 (change C12): pattern and repeat tokens right after presence, the first tag of
    // each kind, in the order pattern, same-level, min, max, then the content rules; written
    // here in the reverse order (max before min, a second min and a second pattern ignored).
    // `## Release` is the fixed variant of worked example 2 of spec 2.10.
    name: "pass-pattern-heading-tokens",
    shows: [
      '  ## Release (presence:required, pattern:"[{semver}] - {date}", repeat-rules:same-level)',
      '  ### Step (presence:required, pattern:"Step {digits}", repeat-rules:same-level, ' + "repeat-rules:same-level:min:2, repeat-rules:same-level:max:5, content:non-empty, content:list)",
    ],
    lacks: ["Invalid patterns", "min:9", "Other {text}", "Filename:"],
  },
  {
    // Worked example 2 of spec 2.10: the order tag ignored by MTL015 still prints as written
    // (`order:ascending`), the invalid pattern prints as written in the heading rules (spec 8.3)
    // and its warning in `Invalid patterns:` (MTL014, column 23), then `Conflicting tags:` with
    // the MTL015 of line 7, column 35 (the order tag on a heading without pattern, phase P7).
    name: "fail-invalid-pattern-worked-example",
    shows: [
      "  ## Unreleased (presence:optional, order:ascending)",
      '  ## Release (presence:required, pattern:"[{version}] - {date}", repeat-rules:same-level)',
      "Invalid patterns:",
      "  - Heading 'Release': invalid pattern [pattern:\"[{version}] - {date}\"] (unknown placeholder {version}) (line 9, column 23)",
      "Conflicting tags:",
      "  - Heading 'Unreleased': tag [order:ascending] has no effect (the heading has no [pattern:...]) (line 7, column 35)",
    ],
    lacks: ["Filename:", "Unknown tags", "Malformed tags", "Misplaced tags"],
  },
  {
    // Worked example 3 of spec 2.10: the template error MTL017 (same pattern `{semver}` on
    // two adjacent H2) makes the template FAIL (fail header, `Duplicate patterns:`, `Errors:`,
    // no `All templates passed!`), exit 1, JSON status `fail` (spec 8.3, 8.5, phase P7c).
    name: "fail-duplicate-pattern-worked-example",
    shows: [
      "  FAIL template.md",
      '  ## Hotfix (presence:optional, pattern:"{semver}")',
      "Duplicate patterns:",
      "  - Heading 'Hotfix': same pattern [pattern:\"{semver}\"] as the previous heading '' (line 5) (line 7, column 11)",
      "Templates:    1 checked, 0 broken\nErrors:       1\nWarnings:     0",
    ],
    lacks: ["PASS", "All templates passed!", "Invalid patterns", "Conflicting tags"],
    exitCode: 1,
  },
  {
    // Worked example 5 of spec 2.10: the template errors MTL017 and MTL018, each in its own
    // section, `Optional headings with a minimum:` right after `Duplicate patterns:` (phase
    // P7e), `Errors:       2`, exit 1, JSON status `fail`.
    name: "fail-worked-example-5-both-errors",
    shows: [
      "  FAIL template.md",
      '  ## Release (presence:optional, pattern:"{semver}", repeat-rules:same-level:min:2)',
      "Duplicate patterns:",
      "  - Heading 'Notes': matches the same headings as the previous heading 'Notes' (line 5) (line 7, column 4)",
      "Optional headings with a minimum:",
      "  - Heading 'Release': tag [repeat-rules:same-level:min:2] contradicts [presence:optional] (a minimum of 2 requires the heading) (line 9, column 33)",
      "Templates:    1 checked, 0 broken\nErrors:       2\nWarnings:     0",
    ],
    lacks: ["PASS", "All templates passed!", "Invalid patterns", "Conflicting tags"],
    exitCode: 1,
  },
  {
    // Worked example 3 of spec 2.6: the template error MTL019 (`#### Details` before
    // `### Steps` under `## Setup`) in `Child headings out of level order:` (phase P7i),
    // `Errors:       1`, exit 1, JSON status `fail`.
    name: "fail-worked-example-3-child-order",
    shows: [
      "  FAIL template.md",
      "  #### Details (presence:required)\n  ### Steps (presence:required)",
      "Child headings out of level order:",
      "  - Heading 'Steps' (H3): comes after the deeper child 'Details' (H4, line 9) under 'Setup' (line 11, column 1)",
      "Templates:    1 checked, 0 broken\nErrors:       1\nWarnings:     0",
    ],
    lacks: ["PASS", "All templates passed!", "Duplicate patterns:", "Optional headings"],
    exitCode: 1,
  },
  {
    // The MTL030 variant of worked example 7 J of spec 2.10: the order tag on a pattern
    // heading without repeat tag in `Order tags without repeat:` (phase P7j), no MTL015,
    // `Errors:       1`, exit 1, JSON status `fail`.
    name: "fail-worked-example-7-j-order-without-repeat",
    shows: [
      "  FAIL template.md",
      '  ## Epic A - Title (presence:required, pattern:"Epic {char} - {text}", order:ascending, ' + "content:table)",
      "Order tags without repeat:",
      "  - Heading 'Epic A - Title': tag [order:ascending] needs [repeat-rules:same-level] (an order compares the repeats of one heading) (line 5, column 52)",
      "Templates:    1 checked, 0 broken\nErrors:       1\nWarnings:     0",
    ],
    lacks: ["PASS", "All templates passed!", "Conflicting tags", "Child headings"],
    exitCode: 1,
  },
  {
    // Spec 2.11 (A80c): the template-wide switch prints its line right after `Filename:`,
    // then one blank line; the per-heading token prints last in the heading's rules list,
    // after `content:subheadings:no-extra` (written here before it).
    name: "pass-unique-headings-names-switches",
    shows: ["Filename: [filename:case:kebab-case]\nUnique heading names: [unique-headings-names]\n\n", "  ## Usage (presence:required, content:non-empty, content:subheadings:no-extra, " + "unique-headings-names)"],
    lacks: ["Conflicting tags", "Unknown tags", "Malformed tags"],
  },
  {
    // Spec 2.11, 8.3: both switches and no `filename:case`: the `Unique heading names:` line
    // stands in place of the `Filename:` line (no `Filename:` line) and is followed by one blank
    // line; JSON `filenameCase` is null and `uniqueHeadingNames` true.
    name: "pass-unique-headings-names-without-filename",
    shows: ["PASS template.md\nUnique heading names: [unique-headings-names]\n\nField  Type    Rules", "  ## Usage (presence:required, unique-headings-names)"],
    lacks: ["Filename:", "Conflicting tags", "Unknown tags", "Malformed tags"],
  },
  {
    // Spec 2.11, 8.3: the per-heading tag alone prints its token in the heading's rules list and
    // NO `Unique heading names:` line, no blank line before the table (no `filename:case` either);
    // JSON `uniqueHeadingNames` false.
    name: "pass-unique-headings-names-per-heading-only",
    shows: ["PASS template.md\nField  Type    Rules", "  ## Usage (presence:required, unique-headings-names)"],
    lacks: ["Unique heading names:", "Filename:", "Conflicting tags", "Unknown tags"],
  },
  {
    // No heading at all: no `Headings:` line and no extra blank line before the next section.
    name: "fail-no-headings-unknown-field-tag",
    shows: ["owner  string  presence:required\n\nUnknown tags found"],
    lacks: ["Headings:", "\n\n\n", "Filename:"],
  },
  {
    // No frontmatter field (`{}`): the table is its header and the dash line only (spec 8.3).
    name: "fail-no-fields-unknown-heading-tag",
    shows: ["Filename: [filename:case:kebab-case]", "Field  Type  Rules\n------------------\n\nHeadings:"],
    lacks: ["\n\n\n"],
  },
];

const dir = (name: string): string => fixturePath("cli", `${GROUP}${name}`);
/** An expected-output file with `\r\n` read as `\n` (a checkout may convert line ends). */
const expectedFile = (name: string, file: string): string => readFileSync(join(dir(name), file), "utf8").replaceAll("\r\n", "\n");

/** The separator line of the text reports (spec 8.3). */
const RULE_LINE = "========================\nSummary";

const plainRun = (fixture: string) => runCliIn(fixture, ["--verify", "--format", "plain", "template.md"]);

describe("cli --verify schema: layout", () => {
  it("has at least 1 pass- case, at least 1 fail- case, one directory each", () => {
    expectSplit("cli", GROUP, CASES);
  });
});

describe("cli --verify schema: text (spec 8.3)", () => {
  for (const testCase of CASES) {
    it(`${testCase.name}: plain output is the expected file`, async () => {
      const run = await plainRun(`${GROUP}${testCase.name}`);
      expect(run.exitCode).toBe(testCase.exitCode ?? 0);
      expect(run.stderr).toBe("");
      expect(run.stdout).toBe(expectedFile(testCase.name, "expected.plain.txt"));
      let from = 0;
      for (const fragment of testCase.shows) {
        const at = run.stdout.indexOf(fragment, from);
        expect(at, fragment).toBeGreaterThanOrEqual(0);
        from = at + fragment.length;
      }
      for (const fragment of testCase.lacks) expect(run.stdout).not.toContain(fragment);
    });

    it(`${testCase.name}: the line under the table header is as long as the header`, async () => {
      const lines = (await plainRun(`${GROUP}${testCase.name}`)).stdout.split("\n");
      const at = lines.findIndex((line) => /^Field +Type +Rules$/.test(line));
      expect(at).toBeGreaterThanOrEqual(0);
      const header = lines[at] ?? "";
      expect(lines[at + 1]).toBe("-".repeat(header.length));
    });

    it(`${testCase.name}: JSON templates are the expected file`, async () => {
      const run = await runCliIn(`${GROUP}${testCase.name}`, ["--verify", "--format", "json", "template.md"]);
      expect(run.exitCode).toBe(testCase.exitCode ?? 0);
      expect(parseJson(run.stdout).templates).toEqual(JSON.parse(expectedFile(testCase.name, "expected.json")) as unknown);
    });
  }
});

describe("cli --verify schema: details", () => {
  const PASS = `${GROUP}pass-several-types-rules-headings`;

  it("pretty text has the same schema after a glyph header", async () => {
    const pretty = await runCliIn(PASS, ["--verify", "template.md"]);
    const plain = await plainRun(PASS);
    expect(pretty.stdout).toContain("  ✓ template.md\nFilename: [filename:case:snake_case]\n");
    expect(pretty.stdout.replace("  ✓ template.md", "  PASS template.md")).toBe(plain.stdout);
  });

  it("the table columns are padded to the widest name and type, rules unpadded", async () => {
    const run = await plainRun(PASS);
    const rows = run.stdout.split("\n").filter((line) => /^(id|milestones|plain) /.test(line));
    expect(rows).toEqual(["id          string        presence:required, value:filename", "milestones  list-of-date  presence:required, order:ascending", "plain       string        presence:required"]);
    expect(rows.every((row) => row === row.trimEnd())).toBe(true);
  });

  it("the dash line is 31 characters for the header of the pass case", async () => {
    // Field(10) + 2 + Type(12) + 2 + Rules(5): the header length, not a fixed width.
    const run = await plainRun(PASS);
    expect(run.stdout).toContain(`Field       Type          Rules\n${"-".repeat(31)}\n`);
  });

  it("every field and heading shows its presence first, also when untagged", async () => {
    const run = await runCliIn(PASS, ["--verify", "--format", "json", "template.md"]);
    const [entry] = parseJson(run.stdout).templates ?? [];
    expect((entry?.fields ?? []).map((field) => field.rules[0])).toEqual([
      "presence:required",
      "presence:optional",
      "presence:required",
      "presence:required",
      "presence:required",
      "presence:required",
      "presence:required",
      "presence:conditional:only when risky",
      "presence:required",
      "presence:required",
      "presence:optional",
    ]);
    expect((entry?.headings ?? []).map((heading) => heading.rules[0])).toEqual([
      "presence:required",
      "presence:required",
      "presence:required",
      "presence:optional",
      "presence:required",
      "presence:template-only",
      "presence:conditional:when ready",
      "presence:conditional:only when risky",
      "presence:template-only",
      "presence:optional",
      "presence:required",
    ]);
  });

  it("--quiet keeps the fail header and both error sections of worked example 5", async () => {
    const fixture = `${GROUP}fail-worked-example-5-both-errors`;
    const run = await runCliIn(fixture, ["--verify", "--format", "plain", "--quiet", "template.md"]);
    expect(run.exitCode).toBe(1);
    const full = expectedFile("fail-worked-example-5-both-errors", "expected.plain.txt");
    const sections = full.slice(full.indexOf("Duplicate patterns:"), full.indexOf(RULE_LINE));
    expect(run.stdout).toBe(`  FAIL template.md\n${sections}`);
  });

  it("--quiet keeps the fail header and the child order section of worked example 3", async () => {
    const name = "fail-worked-example-3-child-order";
    const run = await runCliIn(`${GROUP}${name}`, ["--verify", "--format", "plain", "--quiet", "template.md"]);
    expect(run.exitCode).toBe(1);
    const full = expectedFile(name, "expected.plain.txt");
    const sections = full.slice(full.indexOf("Child headings out of level order:"), full.indexOf(RULE_LINE));
    expect(run.stdout).toBe(`  FAIL template.md\n${sections}`);
  });

  it("--quiet keeps the fail header and the order section of worked example 7 J", async () => {
    const name = "fail-worked-example-7-j-order-without-repeat";
    const run = await runCliIn(`${GROUP}${name}`, ["--verify", "--format", "plain", "--quiet", "template.md"]);
    expect(run.exitCode).toBe(1);
    const full = expectedFile(name, "expected.plain.txt");
    const sections = full.slice(full.indexOf("Order tags without repeat:"), full.indexOf(RULE_LINE));
    expect(run.stdout).toBe(`  FAIL template.md\n${sections}`);
  });

  it("--quiet hides the schema", async () => {
    const run = await runCliIn(PASS, ["--verify", "--quiet", "template.md"]);
    expect(run).toMatchObject({ stdout: "", stderr: "", exitCode: 0 });
  });

  it("a template with no tag problem has no tag warning; its one warning is MTL016", async () => {
    // Spec 2.9: `milestones` (list-of-date) has no [format:elements:date].
    const run = await runCliIn(PASS, ["--verify", "--format", "json", "template.md"]);
    const [entry] = parseJson(run.stdout).templates ?? [];
    expect((entry?.diagnostics ?? []).map((diagnostic) => diagnostic.code)).toEqual(["MTL016"]);
    expect(parseJson(run.stdout).summary["warnings"]).toBe(1);
  });

  it("the filename convention is null in JSON when the template declares none", async () => {
    const run = await runCliIn(`${GROUP}fail-unknown-tags`, ["--verify", "--format", "json", "template.md"]);
    const json = JSON.parse(run.stdout) as { templates: { filenameCase: unknown }[] };
    expect(json.templates[0]?.filenameCase).toBeNull();
  });

  it("uniqueHeadingNames is true only for the template-wide switch, never for the heading tag", async () => {
    // Spec 2.11, 8.5: always present, false without the frontmatter switch.
    const flags: Record<string, boolean> = {};
    for (const name of ["pass-unique-headings-names-switches", "pass-unique-headings-names-without-filename", "pass-unique-headings-names-per-heading-only", "fail-unknown-tags"]) {
      const run = await runCliIn(`${GROUP}${name}`, ["--verify", "--format", "json", "template.md"]);
      flags[name] = parseJson(run.stdout).templates?.[0]?.uniqueHeadingNames ?? false;
    }
    expect(flags).toEqual({
      "pass-unique-headings-names-switches": true,
      "pass-unique-headings-names-without-filename": true,
      "pass-unique-headings-names-per-heading-only": false,
      "fail-unknown-tags": false,
    });
  });
});

describe("cli --verify schema: echoed text is sanitised", () => {
  let folder = "";

  beforeAll(() => {
    folder = mkdtempSync(join(tmpdir(), "mtl-cli-schema-"));
    // Written from JS escapes: the YAML escape `\e` is an ESC byte in the field name, and the
    // heading and the constant carry a raw ESC. No control character is stored in a file of the repo.
    const template = ["---", '"a\\eb": "string" # [format:constant:v\u001bw]', "---", "", "## Head\u001bing [content:non-empty]", ""].join("\n");
    writeFileSync(join(folder, "esc.template.md"), template);
  });

  afterAll(() => {
    if (folder !== "") rmSync(folder, { recursive: true, force: true });
  });

  const run = (format: string) =>
    runCliIn("usage-no-config", ["--verify", "--format", format, "esc.template.md"], {
      cwd: foldPath(folder),
      boundary: foldPath(folder),
    });

  it("text shows control characters as visible escapes, never raw", async () => {
    const result = await run("plain");
    expect(result.exitCode).toBe(0);
    expect(result.stdout).not.toContain("\u001b");
    expect(result.stdout).toContain("a\\x1bb");
    expect(result.stdout).toContain("format:constant:v\\x1bw");
    expect(result.stdout).toContain("## Head\\x1bing (presence:required, content:non-empty)");
  });

  it("pretty text, which adds its own color escapes, still has no raw ESC from the document", async () => {
    const result = await run("text");
    expect(result.stdout).toContain("a\\x1bb");
    expect(result.stdout).not.toContain("a\u001bb");
  });

  it("JSON strings are sanitised too", async () => {
    const result = await run("json");
    expect(result.stdout).not.toContain("\\u001b");
    expect(result.stdout).not.toContain("\u001b");
    const json = JSON.parse(result.stdout) as {
      templates: { fields: { name: string; rules: string[] }[]; headings: { text: string }[] }[];
    };
    const entry = json.templates[0];
    expect(entry?.fields[0]?.name).toBe("a\\x1bb");
    expect(entry?.fields[0]?.rules).toContain("format:constant:v\\x1bw");
    expect(entry?.headings[0]?.text).toBe("Head\\x1bing");
  });
});
