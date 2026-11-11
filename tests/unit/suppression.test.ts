/**
 * Suppression by target disable directives (docs/spec.md 4.1 step 8, 4.4 DIR5 to DIR8): every
 * verb covers what DIR1 says and nothing more, a diagnostic without anchor is covered only by
 * `disable-file`, directives of a template and directives in fences or code spans are
 * inert, and the edge cases of the parser (empty comments, a stray `-->`, multi-line values, a
 * filename comment line, non-ASCII text before a comment, a `--<tab>` reason, duplicate codes).
 *
 * Fixture of a case: `tests/fixtures/suppression/<name>/template.md` + `target.md`, linted with
 * `lintTarget`. A case lists every reported diagnostic (errors first, then warnings) as
 * `CODE message`, directive warnings with `@line:column`, and the suppressed count. Passing
 * cases report nothing. At least 1 passing case and 1 failing case.
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { RUN_CODES } from "../../src/engine/directives.js";
import type { Diagnostic } from "../../src/engine/model.js";
import { cleanText } from "../../src/reporters/sanitize.js";
import { checkTemplate, lintTarget } from "../../src/engine/pipeline.js";
import { createRegistry } from "../../src/engine/registry.js";
import { createEnv } from "../../src/engine/rule.js";
import { expectSplit, fixturePath } from "../helpers/fixtures.js";

const registry = createRegistry();

const missing = (key: string) => `MTL201 Field '${key}': required but empty or missing`;
const unknown = (key: string) => `MTL202 Unknown key '${key}' not present in template`;
const EMPTY = "MTL701 Section 'Overview': [content:non-empty] section body is empty";
const PATH_MISSING = "MTL804 Field 'logo': path 'docs/missing.png' does not exist (resolved: docs/missing.png)";
const directive = (code: string, line: number, column: number, text: string) => `${code} Directive on line ${line}: ${text} @${line}:${column}`;

interface Case {
  readonly name: string;
  readonly reported: readonly string[];
  readonly suppressed: number;
}

const CASES: readonly Case[] = [
  // disable-line: its own line only, its own codes only.
  { name: "pass-disable-line-covers-own-line", reported: [], suppressed: 2 },
  {
    name: "fail-disable-line-other-line-or-code",
    reported: [EMPTY, unknown("extra"), unknown("other")],
    suppressed: 0,
  },
  // disable-next-line: line + 1, even when that line is blank.
  { name: "pass-disable-next-line-covers-next-line", reported: [], suppressed: 2 },
  {
    name: "fail-disable-next-line-blank-line-counts",
    reported: [EMPTY, unknown("extra")],
    suppressed: 0,
  },
  // disable: open to the end of the file, silently; never a diagnostic without anchor, never a
  // line before it.
  { name: "pass-disable-runs-to-end-of-file", reported: [], suppressed: 3 },
  {
    name: "fail-disable-never-covers-unanchored",
    reported: [missing("status"), unknown("extra")],
    suppressed: 0,
  },
  // begin disable: up to and including the end disable line (a key line, a heading line).
  { name: "pass-begin-end-inclusive", reported: [], suppressed: 3 },
  {
    name: "fail-begin-end-outside-range",
    reported: [missing("status"), unknown("other"), directive("MTL024", 3, 1, "'begin disable MTL201' is never closed, it runs to the end of the file")],
    suppressed: 1,
  },
  // end disable: closes on its own line, nothing after it is covered.
  { name: "pass-end-disable-closes-on-its-line", reported: [], suppressed: 2 },
  {
    name: "fail-end-disable-stops-coverage",
    reported: [EMPTY, unknown("extra"), directive("MTL023", 11, 1, "'end disable MTL701' has no open 'disable' or 'begin disable' for MTL701")],
    suppressed: 0,
  },
  // disable-file: anywhere, with or without anchor, by code only. `## Appendix` is in the tail
  // of the level-2 run: the warning MTL616 (docs/grammar.md "Extra"), silenced too.
  { name: "pass-disable-file-anywhere", reported: [], suppressed: 4 },
  {
    name: "fail-disable-file-matches-code-only",
    reported: [missing("status"), EMPTY],
    suppressed: 2,
  },
  // The former name of disable-file was never released and has no alias: an unknown verb
  // (MTL020 with the current verb list), so nothing is suppressed.
  {
    name: "fail-old-verb-disable-document-unknown",
    reported: [missing("status"), directive("MTL020", 9, 1, "unknown directive 'disable-document' (expected disable, disable-line, " + "disable-next-line, disable-file, begin disable or end disable)")],
    suppressed: 0,
  },
  // DIR4: a template is never read for directives; fences and code spans are inert.
  {
    name: "fail-directive-in-template-ignored",
    reported: [missing("status"), unknown("extra")],
    suppressed: 0,
  },
  { name: "fail-directives-in-fences-inert", reported: [unknown("extra")], suppressed: 0 },
  { name: "pass-directive-after-longer-fence-closer", reported: [], suppressed: 1 },
  // Parser edge cases.
  { name: "pass-empty-comments-and-stray-closer", reported: [], suppressed: 1 },
  {
    name: "fail-multi-line-scalar-value",
    reported: [unknown("note"), unknown("extra")],
    suppressed: 0,
  },
  { name: "pass-multi-line-value-anchors-on-key-line", reported: [], suppressed: 1 },
  {
    name: "fail-filename-comment-line-is-prose",
    reported: [unknown("extra"), directive("MTL021", 6, 1, "unknown rule code '[filename:case:kebab-case]'")],
    suppressed: 1,
  },
  {
    // Columns count code points: `é` and the astral `😀` are one column each.
    name: "fail-non-ascii-before-comment-column",
    reported: [directive("MTL021", 4, 11, "unknown rule code 'MTL999'"), directive("MTL020", 11, 8, "unknown directive 'disabel' (expected disable, disable-line, disable-next-line, " + "disable-file, begin disable or end disable)")],
    suppressed: 1,
  },
  { name: "pass-reason-after-tab", reported: [], suppressed: 2 },
  { name: "pass-duplicate-code-items", reported: [], suppressed: 2 },
  {
    // Spec 4.1 step 7, DIR8: the full, unfiltered list in emission order. The unclosed
    // `begin disable` of line 4 comes FIRST in the file but its MTL024 warnings come LAST,
    // one per code in the order written in that directive (MTL701 before MTL202).
    name: "fail-directive-warnings-order",
    reported: [
      directive("MTL020", 11, 1, "unknown directive 'disabel' (expected disable, disable-line, disable-next-line, " + "disable-file, begin disable or end disable)"),
      directive("MTL021", 12, 1, "unknown rule code 'MTL2O1'"),
      directive("MTL023", 13, 1, "'end disable MTL301' has no open 'disable' or 'begin disable' for MTL301"),
      directive("MTL025", 14, 1, "'disable MTL202' while MTL202 is already disabled since line 4"),
      directive("MTL024", 4, 1, "'begin disable MTL701' is never closed, it runs to the end of the file"),
      directive("MTL024", 4, 1, "'begin disable MTL202' is never closed, it runs to the end of the file"),
    ],
    suppressed: 1,
  },
  // MTL804 is a warning from the io rule: the memory io of the tests has no file, so it fires.
  {
    name: "fail-io-path-missing-warning-reported",
    reported: [PATH_MISSING],
    suppressed: 0,
  },
  { name: "pass-io-path-missing-disable-line", reported: [], suppressed: 1 },
  // DIR4: a directive comment stays part of the section body text. A body that holds only a
  // directive comment is therefore NOT blank for MTL701: the comment is the whole body here,
  // so `## Overview [content:non-empty]` passes although no prose follows the heading. The
  // suppression-real-codes test strips the comment and sees MTL701 come back.
  { name: "pass-directive-comment-only-body-counts-as-content", reported: [], suppressed: 1 },
  {
    // DIR4: after a target parse failure no directive is read (no warning, nothing covered).
    name: "fail-parse-failure-reads-no-directive",
    reported: ["MTL001 File must have YAML frontmatter (---...---)"],
    suppressed: 0,
  },
];

const read = (name: string, file: string): string => readFileSync(`${fixturePath("suppression", name)}/${file}`, "utf8");

const shown = (diagnostic: Diagnostic): string => {
  const text = `${diagnostic.code} ${diagnostic.message}`;
  const directiveCode = diagnostic.code >= "MTL020" && diagnostic.code <= "MTL025";
  const at = diagnostic.position;
  return directiveCode && at !== null ? `${text} @${at.line}:${at.column}` : text;
};

async function lint(name: string) {
  const status = await checkTemplate(registry, read(name, "template.md"));
  if (status.status !== "ok") throw new Error(`${name}: template is broken`);
  return {
    warnings: status.warnings,
    result: await lintTarget(registry, status.model, read(name, "target.md"), "t.md", createEnv()),
  };
}

describe("suppression by target directives (spec 4.4)", () => {
  it("has at least 1 pass- case and at least 1 fail- case, one fixture dir each", () => {
    expectSplit("suppression", "", CASES);
    expect(CASES.filter((testCase) => testCase.reported.length === 0)).toEqual(CASES.filter((testCase) => testCase.name.startsWith("pass-")));
    for (const testCase of CASES) {
      expect(readdirSync(fixturePath("suppression", testCase.name)).sort()).toEqual(["target.md", "template.md"]);
    }
  });

  for (const testCase of CASES) {
    it(`${testCase.name}: tests/fixtures/suppression/${testCase.name}`, async () => {
      const { warnings, result } = await lint(testCase.name);
      // A directive-like comment in a template is inert prose: no template warning either.
      expect(warnings).toEqual([]);
      expect(result.diagnostics.map(shown)).toEqual(testCase.reported);
      expect(result.suppressed).toBe(testCase.suppressed);
    });

    it(`${testCase.name}: CRLF line ends give the same result`, async () => {
      const status = await checkTemplate(registry, read(testCase.name, "template.md"));
      if (status.status !== "ok") throw new Error("template is broken");
      const crlf = read(testCase.name, "target.md").replaceAll("\n", "\r\n");
      const result = await lintTarget(registry, status.model, crlf, "t.md", createEnv());
      expect(result.diagnostics.map(shown)).toEqual(testCase.reported);
      expect(result.suppressed).toBe(testCase.suppressed);
    });
  }

  it("rules still run in full: the same target without directives reports every suppressed one", async () => {
    const { result } = await lint("pass-disable-file-anywhere");
    const status = await checkTemplate(registry, read("pass-disable-file-anywhere", "template.md"));
    if (status.status !== "ok") throw new Error("template is broken");
    // The fixture's only directive is its last line.
    const lines = read("pass-disable-file-anywhere", "target.md").split("\n");
    const bare = [...lines.slice(0, -2), ""].join("\n");
    const plain = await lintTarget(registry, status.model, bare, "t.md", createEnv());
    expect(plain.diagnostics.map(shown)).toEqual([missing("status"), EMPTY, unknown("extra"), "MTL616 Heading: 1 extra heading(s) at level H2 after the template headings: ['Appendix']"]);
    expect(plain.suppressed).toBe(0);
    expect(result.suppressed).toBe(plain.diagnostics.length);
  });
});

/** Codes of the docs/spec.md 4.3 "run errors" table (the rows up to the next heading). */
function specRunCodes(): string[] {
  const spec = readFileSync(fileURLToPath(new URL("../../docs/spec.md", import.meta.url)), "utf8");
  const lines = spec.replaceAll("\r\n", "\n").split("\n");
  const start = lines.findIndex((line) => line.startsWith("#### run errors"));
  const end = lines.findIndex((line, index) => index > start && line.startsWith("#"));
  return lines
    .slice(start, end)
    .filter((line) => line.startsWith("| `MTL"))
    .map((line) => (line.split("|")[1] ?? "").trim().replaceAll("`", ""));
}

describe("directive codes against the spec tables", () => {
  it("RUN_CODES equals the run errors table of spec 4.3", () => {
    const codes = specRunCodes();
    expect(codes.length).toBeGreaterThan(10);
    expect([...RUN_CODES].sort()).toEqual([...codes].sort());
  });

  it("every run error code named in a directive is MTL022, never MTL021 (DIR6)", async () => {
    const codes = specRunCodes();
    const status = await checkTemplate(registry, "---\ntitle: Notes\n---\n");
    if (status.status !== "ok") throw new Error("template is broken");
    const target = `---\ntitle: Notes\n---\n\n<!-- md-template-lint disable ${codes.join(" ")} -->\n`;
    const { diagnostics } = await lintTarget(registry, status.model, target, "t.md", createEnv());
    expect(diagnostics.map((diagnostic) => diagnostic.message)).toEqual(codes.map((code) => `Directive on line 5: rule code ${code} cannot be disabled`));
    expect(diagnostics.every((diagnostic) => diagnostic.code === "MTL022")).toBe(true);
  });

  it("control characters in the MTL020 word and the MTL021 token are escaped on output (8.2)", async () => {
    const status = await checkTemplate(registry, "---\ntitle: Notes\n---\n");
    if (status.status !== "ok") throw new Error("template is broken");
    const target = "---\ntitle: Notes\n---\n\n" + "<!-- md-template-lint dis\u0001abel MTL202 -->\n" + "<!-- md-template-lint disable-line MTL\u001b[2J -->\n";
    const { diagnostics } = await lintTarget(registry, status.model, target, "t.md", createEnv());
    // The diagnostic keeps the text as written; every reporter prints it through cleanText.
    expect(diagnostics.map((diagnostic) => [diagnostic.code, cleanText(diagnostic.message)])).toEqual([
      ["MTL020", "Directive on line 5: unknown directive 'dis\\x01abel' (expected disable, disable-line, " + "disable-next-line, disable-file, begin disable or end disable)"],
      ["MTL021", "Directive on line 6: unknown rule code 'MTL\\x1b[2J'"],
    ]);
  });
});
