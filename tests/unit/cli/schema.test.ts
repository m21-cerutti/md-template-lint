/**
 * `--verify` schema output (docs/spec.md 7.3, 8.3, 8.5): the table of fields (inferred type
 * and rules), the headings with their rules, the `Filename:` line and the sections for
 * unknown, malformed and misplaced tags; and the same data as JSON (`filenameCase`, `fields`,
 * `headings`, `diagnostics`). Each case is a folder with `template.md` and two golden files,
 * `expected.plain.txt` (the whole plain output) and `expected.json` (the `templates` array),
 * written from the spec rules and the legacy `describe()`, not generated.
 * Fixtures: tests/fixtures/cli/schema-<case>/. "fail-" here means the schema reports tag
 * problems; they are warnings, so every case is exit 0. The templates with no heading or no
 * field carry such a problem on purpose, so they are fail- cases and the group keeps its
 * split (one pass-, fail- >= pass-).
 *
 * Implementation-defined, not covered by spec 8.3: the goldens show a MALFORMED or MISPLACED
 * heading tag left in the heading text (`## Body [content:min-lines:abc]`, as the engine's
 * heading extraction keeps any bracket it does not recognise, spec 2.6). Spec 8.3 only
 * describes an unknown heading tag. A change of that extraction changes those goldens.
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
  /** Fragments the text output must show, in order (a reading aid on top of the golden). */
  readonly shows: readonly string[];
  /** Fragments the text output must not have. */
  readonly lacks: readonly string[];
}

/** Exactly 1 passing case, failing cases >= passing; one fixture directory per case. */
const CASES: readonly Case[] = [
  {
    // Types: enum, int, url, list-of-date, list, string; every rule kind, the first tag of a
    // kind wins (count:min:2 over count:min:9), conditional beats optional, exist beats optional.
    // Presence is always the first rule (required when untagged; conditional carries its text).
    // Headings: conditional beats required, template-only beats exist, optional beats required.
    // `piped` has an option list as value but type=string: no enum rule (enum fields only).
    name: "pass-several-types-rules-headings",
    shows: [
      "Filename: [filename:case:snake_case]",
      "Field       Type          Rules",
      "id          string        presence:required, value:filename",
      "status      enum          presence:optional, enum:draft|accepted",
      "owner       string        presence:conditional:only when risky",
      "plain       string        presence:required\n",
      "piped       string        presence:required\n",
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
    shows: [
      "Unknown tags found (typo or unimplemented feature):",
      "  - Field 'owner': unknown tag [optionl]",
      "  - Heading 'Overview [bogus]': unknown tag [bogus]",
    ],
    lacks: ["Filename:", "Malformed tags", "Misplaced tags"],
  },
  {
    name: "fail-malformed-tags",
    shows: [
      "Malformed tags:",
      "  - Field 'tags': malformed tag [count:min:abc] (line 2, column 26)",
    ],
    lacks: ["Filename:", "Unknown tags", "Misplaced tags"],
  },
  {
    name: "fail-misplaced-tags",
    shows: [
      "Misplaced tags:",
      "  - Field 'title': tag [content:non-empty] is not valid in frontmatter (line 2, column 19)",
      "  - Heading 'Body [value:filename]': tag [value:filename] is not valid in a heading (line 5, column 9)",
    ],
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
    // No heading at all: no `Headings:` line and no extra blank line before the next section.
    name: "fail-no-headings-unknown-field-tag",
    shows: ["owner  string  presence:required\n\nUnknown tags found"],
    lacks: ["Headings:", "\n\n\n", "Filename:"],
  },
  {
    // No frontmatter field (`{}`): the table is its header and the dash line only (spec 8.3).
    name: "fail-no-fields-unknown-heading-tag",
    shows: [
      "Filename: [filename:case:kebab-case]",
      "Field  Type  Rules\n------------------\n\nHeadings:",
    ],
    lacks: ["\n\n\n"],
  },
];

const dir = (name: string): string => fixturePath("cli", `${GROUP}${name}`);
/** A golden file with `\r\n` read as `\n` (a checkout may convert line ends). */
const golden = (name: string, file: string): string =>
  readFileSync(join(dir(name), file), "utf8").replaceAll("\r\n", "\n");

const plainRun = (fixture: string) =>
  runCliIn(fixture, ["--verify", "--format", "plain", "template.md"]);

describe("cli --verify schema: layout", () => {
  it("has exactly 1 pass- case, at least as many fail- cases, one directory each", () => {
    expectSplit("cli", GROUP, CASES);
  });
});

describe("cli --verify schema: text (spec 8.3)", () => {
  for (const testCase of CASES) {
    it(`${testCase.name}: plain output is the golden file`, async () => {
      const run = await plainRun(`${GROUP}${testCase.name}`);
      expect(run.exitCode).toBe(0);
      expect(run.stderr).toBe("");
      expect(run.stdout).toBe(golden(testCase.name, "expected.plain.txt"));
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

    it(`${testCase.name}: JSON templates are the golden file`, async () => {
      const run = await runCliIn(`${GROUP}${testCase.name}`, [
        "--verify",
        "--format",
        "json",
        "template.md",
      ]);
      expect(run.exitCode).toBe(0);
      expect(parseJson(run.stdout).templates).toEqual(
        JSON.parse(golden(testCase.name, "expected.json")) as unknown,
      );
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
    expect(rows).toEqual([
      "id          string        presence:required, value:filename",
      "milestones  list-of-date  presence:required, order:ascending",
      "plain       string        presence:required",
    ]);
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
      "presence:required",
      "presence:optional",
    ]);
    expect((entry?.headings ?? []).map((heading) => heading.rules[0])).toEqual([
      "presence:required",
      "presence:required",
      "presence:required",
      "presence:optional",
      "presence:exist",
      "presence:template-only",
      "presence:conditional:when ready",
      "presence:conditional:only when risky",
      "presence:template-only",
      "presence:optional",
      "presence:required",
    ]);
  });

  it("--quiet hides the schema", async () => {
    const run = await runCliIn(PASS, ["--verify", "--quiet", "template.md"]);
    expect(run).toMatchObject({ stdout: "", stderr: "", exitCode: 0 });
  });

  it("a template with no tag problem has no problem section and no warnings", async () => {
    const run = await runCliIn(PASS, ["--verify", "--format", "json", "template.md"]);
    const [entry] = parseJson(run.stdout).templates ?? [];
    expect(entry?.diagnostics).toEqual([]);
    expect(parseJson(run.stdout).summary["warnings"]).toBe(0);
  });

  it("the filename convention is null in JSON when the template declares none", async () => {
    const run = await runCliIn(`${GROUP}fail-unknown-tags`, [
      "--verify",
      "--format",
      "json",
      "template.md",
    ]);
    const json = JSON.parse(run.stdout) as { templates: { filenameCase: unknown }[] };
    expect(json.templates[0]?.filenameCase).toBeNull();
  });
});

describe("cli --verify schema: echoed text is sanitised", () => {
  let folder = "";

  beforeAll(() => {
    folder = mkdtempSync(join(tmpdir(), "mtl-cli-schema-"));
    // Written from JS escapes: the YAML escape `\e` is an ESC byte in the field name, and the
    // heading and the constant carry a raw ESC. No control character is stored in a file of the repo.
    const template = [
      "---",
      '"a\\eb": "string" # [format:constant:v\u001bw]',
      "---",
      "",
      "## Head\u001bing [content:non-empty]",
      "",
    ].join("\n");
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
