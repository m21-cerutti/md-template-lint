/**
 * Runner and reporters with disable directives: the five worked examples of docs/spec.md 4.4
 * end to end (pretty text output line for line, JSON `summary.suppressed`, exit code), their
 * variants through the engine, and the counting rules of DIR9 (suppressed diagnostics count
 * nowhere else; `Suppressed:` only when greater than 0, never with `--quiet`).
 * Fixtures: tests/fixtures/runner/suppress-<case>/ (one target under `notes/` each, the
 * template of the examples, and the expected pretty output).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Diagnostic } from "../../../src/engine/model.js";
import { checkTemplate, lintTarget } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";
import { report } from "../../../src/reporters/index.js";
import { expectSplit, fixturePath, readFixture } from "../../helpers/fixtures.js";
import { runFixture } from "../../helpers/run.js";

const GROUP = "suppress-";
const VERSION = "1.0.0";
const registry = createRegistry();

interface Case {
  readonly name: string;
  /** The one target, relative to the fixture. */
  readonly target: string;
  readonly suppressed: number;
  readonly exitCode: 0 | 1;
}

/** Spec 4.4 worked examples 1 to 5; at least 1 passing case and 1 failing case. */
const CASES: readonly Case[] = [
  { name: "fail-line-directives", target: "notes/notes.md", suppressed: 3, exitCode: 1 },
  { name: "fail-begin-end-block", target: "notes/legacy.md", suppressed: 3, exitCode: 1 },
  {
    name: "pass-document-covers-unanchored",
    target: "notes/draft.md",
    suppressed: 3,
    exitCode: 0,
  },
  {
    name: "pass-document-covers-anchored",
    target: "notes/imported.md",
    suppressed: 2,
    exitCode: 0,
  },
  {
    name: "fail-ignored-places-and-warnings",
    target: "notes/ignored.md",
    suppressed: 0,
    exitCode: 1,
  },
  // DIR9: the sum over pair-file lints: a.md (1) in two pairs plus b.md (2).
  { name: "pass-sum-over-pair-file-lints", target: "notes/a.md", suppressed: 4, exitCode: 0 },
];

const textOf = (name: string, file: string): string =>
  readFileSync(join(fixturePath("runner", `${GROUP}${name}`), file), "utf8");

/** Lint a variant of a worked example target against the example template. */
async function variant(name: string, text: string) {
  const status = await checkTemplate(registry, textOf(name, "templates/notes.template.md"));
  if (status.status !== "ok") throw new Error(`${name}: template is broken`);
  return lintTarget(registry, status.model, text, "notes/t.md", createEnv());
}

/** `text` with its 1-based line `line` replaced (or removed when `by` is null). */
function withLine(text: string, line: number, by: string | null): string {
  const lines = text.split("\n");
  lines.splice(line - 1, 1, ...(by === null ? [] : [by]));
  return lines.join("\n");
}

const shown = (diagnostic: Diagnostic): string => `${diagnostic.code} ${diagnostic.message}`;
const unknown = (key: string) => `MTL202 Unknown key '${key}' not present in template`;
const missingHeading = (text: string) => `MTL601 Heading: Missing required heading: '${text}'`;
const STATUS_MISSING = "MTL201 Field 'status': required but empty or missing";
const DETAILS_EMPTY = "MTL701 Section 'Details': [content:non-empty] section body is empty";
const unclosed = (code: string) =>
  `MTL024 Directive on line 4: 'begin disable ${code}' is never closed, it runs to the end of the file`;

describe("runner with disable directives: layout", () => {
  it("has at least 1 pass- case, at least 1 fail- case, one directory each", () => {
    expectSplit("runner", GROUP, CASES);
  });
});

describe("runner with disable directives: the worked examples of spec 4.4", () => {
  for (const testCase of CASES) {
    it(`${testCase.name}: pretty output equals expected.pretty.txt`, async () => {
      const result = await runFixture(`${GROUP}${testCase.name}`);
      const { stdout, stderr } = report(result, { format: "pretty", version: VERSION });
      expect(stdout).toBe(readFixture("runner", `${GROUP}${testCase.name}`, "expected.pretty.txt"));
      expect(stderr).toBe("");
      expect(result.summary.exitCode).toBe(testCase.exitCode);
    });

    it(`${testCase.name}: JSON summary.suppressed between filesWithWarnings and templatesChecked`, async () => {
      const result = await runFixture(`${GROUP}${testCase.name}`);
      const document = JSON.parse(report(result, { format: "json", version: VERSION }).stdout) as {
        summary: Record<string, number>;
        results: { files: { status: string; errors: object[]; warnings: object[] }[] }[];
      };
      expect(document.summary["suppressed"]).toBe(testCase.suppressed);
      const keys = Object.keys(document.summary);
      expect(keys.indexOf("suppressed")).toBe(keys.indexOf("filesWithWarnings") + 1);
      expect(keys.indexOf("templatesChecked")).toBe(keys.indexOf("suppressed") + 1);
      // Suppressed diagnostics are in no list and count nowhere else (DIR9).
      const [file] = document.results[0]?.files ?? [];
      expect(document.summary["warnings"]).toBe(file?.warnings.length);
      expect(document.summary["failed"]).toBe(testCase.exitCode);
      expect(file?.status).toBe(testCase.exitCode === 0 ? "pass" : "fail");
      expect(document.summary["exitCode"]).toBe(testCase.exitCode);
    });

    it(`${testCase.name}: --quiet prints no Suppressed: line`, async () => {
      const result = await runFixture(`${GROUP}${testCase.name}`);
      const quiet = report(result, { format: "plain", version: VERSION, quiet: true }).stdout;
      expect(quiet.includes("Suppressed:")).toBe(false);
      const plain = report(result, { format: "plain", version: VERSION }).stdout;
      expect(plain.includes(`Suppressed:   ${testCase.suppressed}\n`)).toBe(
        testCase.suppressed > 0,
      );
      expect(plain.includes("Suppressed:   0")).toBe(false);
    });
  }
});

describe("runner with disable directives: counts (DIR9)", () => {
  it("summary.suppressed adds every pair-file lint: two files, one of them in two pairs", async () => {
    const result = await runFixture(`${GROUP}pass-sum-over-pair-file-lints`);
    const files = result.blocks.flatMap((block) =>
      block.kind === "pair" ? block.files.map((file) => `${block.pair}:${file.path}`) : [],
    );
    expect(files).toEqual(["notes:notes/a.md", "notes:notes/b.md", "first:notes/a.md"]);
    expect(result.summary).toMatchObject({ files: 3, passed: 3, warnings: 0, suppressed: 4 });
  });
});

describe("runner with disable directives: variants of the worked examples (engine)", () => {
  it("example 1, negative: disable-line on line 5 covers line 5 only, reviewer is reported", async () => {
    const text = withLine(
      textOf("fail-line-directives", "notes/notes.md"),
      5,
      "# md-template-lint disable-line MTL202",
    );
    const result = await variant("fail-line-directives", text);
    expect(result.diagnostics.map(shown)).toEqual([
      DETAILS_EMPTY,
      unknown("reviewer"),
      unknown("draft"),
    ]);
    expect(result.suppressed).toBe(2);
  });

  it("example 2, without line 7: both ranges run to the end, extra is suppressed, two MTL024 last", async () => {
    const text = withLine(textOf("fail-begin-end-block", "notes/legacy.md"), 7, null);
    const result = await variant("fail-begin-end-block", text);
    expect(result.diagnostics.map(shown)).toEqual([
      DETAILS_EMPTY,
      unclosed("MTL202"),
      unclosed("MTL301"),
    ]);
    expect(result.suppressed).toBe(4);
  });

  it("example 3, negative: disable instead of disable-file reports all three, nothing suppressed", async () => {
    const text = textOf("pass-document-covers-unanchored", "notes/draft.md").replace(
      "disable-file",
      "disable",
    );
    const result = await variant("pass-document-covers-unanchored", text);
    expect(result.diagnostics.map(shown)).toEqual([
      STATUS_MISSING,
      missingHeading("Details"),
      missingHeading("Context"),
    ]);
    expect(result.suppressed).toBe(0);
  });

  it("example 3, negative: disable-file MTL201 only, the two MTL601 are reported", async () => {
    const text = textOf("pass-document-covers-unanchored", "notes/draft.md").replace(
      "MTL201, MTL601",
      "MTL201",
    );
    const result = await variant("pass-document-covers-unanchored", text);
    expect(result.diagnostics.map(shown)).toEqual([
      missingHeading("Details"),
      missingHeading("Context"),
    ]);
    expect(result.suppressed).toBe(1);
  });

  it("example 3: the same result with the directive in the frontmatter or at the end", async () => {
    const original = textOf("pass-document-covers-unanchored", "notes/draft.md");
    const withoutBody = withLine(original, 5, null);
    const inFrontmatter = withLine(
      withoutBody,
      2,
      "# md-template-lint disable-file MTL201, MTL601\ntitle: Draft",
    );
    const atEnd = `${withoutBody}<!-- md-template-lint disable-file MTL201, MTL601 -->\n`;
    for (const text of [inFrontmatter, atEnd]) {
      const result = await variant("pass-document-covers-unanchored", text);
      expect(result.diagnostics).toEqual([]);
      expect(result.suppressed).toBe(3);
    }
  });

  it("example 4, negative: disable on line 20 starts after both key lines, both are reported", async () => {
    const text = textOf("pass-document-covers-anchored", "notes/imported.md").replace(
      "disable-file MTL202",
      "disable MTL202",
    );
    const result = await variant("pass-document-covers-anchored", text);
    expect(result.diagnostics.map(shown)).toEqual([unknown("legacy_id"), unknown("legacy_owner")]);
    expect(result.suppressed).toBe(0);
  });

  it("example 5, variant: disable-file with no code on line 16 is MTL020", async () => {
    const text = `${textOf("fail-ignored-places-and-warnings", "notes/ignored.md")}<!-- md-template-lint disable-file -->\n`;
    const result = await variant("fail-ignored-places-and-warnings", text);
    expect(result.diagnostics.map(shown).at(-1)).toBe(
      "MTL020 Directive on line 16: 'disable-file' needs at least one rule code",
    );
    expect(result.suppressed).toBe(0);
  });
});
