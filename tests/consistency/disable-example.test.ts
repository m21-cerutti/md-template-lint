/**
 * `pnpm run check:rules`: the "Complete example" of the "Disable directives" section of
 * docs/syntax-reference.md is run for real. The three files are written to a temporary project
 * and linted through the runner and the CLI. The diagnostics the doc says remain must remain,
 * and each of the six verbs is proven alone: with its directives made plain comments, the
 * diagnostics it suppresses must come back. A verb removed from the example, or an example
 * that cannot be found or parsed, fails the test.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runCli } from "../../src/cli/run.js";
import { foldPath } from "../../src/config/paths.js";
import { loadConfig } from "../../src/config/load.js";
import { createMemoryIo } from "../../src/engine/rule.js";
import { runLint } from "../../src/runner/run.js";
import type { DirectiveVerb } from "../../src/tags/ast.js";
import { HOME } from "../helpers/run.js";
import { DIRECTIVE_VERBS, directivesOf, extractExample, neutralise, neutraliseAll, type DisableExample } from "./disable-example.js";
import { readDoc } from "./syntax-reference.js";

/** What a linted file gives, as `code severity line message`. */
interface Found {
  readonly code: string;
  readonly severity: string;
  readonly line: number;
  readonly message: string;
}

const example: DisableExample = extractExample(readDoc());
const made: string[] = [];

/** A temporary project holding the example files; `target` replaces the text of the target file. */
function project(target: string): string {
  const dir = mkdtempSync(join(tmpdir(), "mtl-disable-example-"));
  made.push(dir);
  for (const file of example.files) {
    mkdirSync(dirname(join(dir, file.path)), { recursive: true });
    writeFileSync(join(dir, file.path), file === example.target ? target : file.content);
  }
  return foldPath(dir);
}

/** Lint the project through the runner: the diagnostics of the target (errors, then warnings) and the summary. */
async function lint(target: string) {
  const dir = project(target);
  const loaded = await loadConfig({ cwd: dir, home: HOME, boundary: dir });
  const result = await runLint(loaded, { io: createMemoryIo() });
  const files = result.blocks.flatMap((block) => (block.kind === "pair" ? block.files : []));
  expect(files.map((file) => file.path)).toEqual([example.target.path]);
  const found = (files[0] === undefined ? [] : [...files[0].errors, ...files[0].warnings]).map((diagnostic): Found => ({
    code: diagnostic.code,
    severity: diagnostic.severity,
    line: diagnostic.position?.line ?? diagnostic.excerpt?.line ?? 0,
    message: diagnostic.message,
  }));
  return { found, summary: result.summary, dir };
}

const key = (found: Found) => `${found.code} ${found.message}`;

/** The suppressed diagnostics each verb must give back when it is removed, by code and a part of the message (doc bullets under the example). */
const SUPPRESSES: Record<DirectiveVerb, readonly (readonly [code: string, part: string])[]> = {
  "disable-line": [
    ["MTL202", "'owner'"],
    ["MTL701", "'Overview'"],
  ],
  "disable-next-line": [["MTL202", "'reviewer'"]],
  "begin disable": [
    ["MTL202", "'legacy_id'"],
    ["MTL202", "'legacy_owner'"],
  ],
  // Without `end disable`, the range of `begin disable` is left open: MTL024.
  "end disable": [["MTL024", ""]],
  disable: [["MTL306", "version"]],
  "disable-file": [["MTL601", "Summary"]],
};

afterAll(() => {
  for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("check:rules disable directives example", () => {
  let baseline: Found[] = [];

  beforeAll(async () => {
    baseline = (await lint(example.target.content)).found;
  });

  it("reads the example: three files, remaining diagnostics, suppressed count, all six verbs present", () => {
    expect(example.files.map((file) => file.path)).toHaveLength(3);
    expect(example.remaining.length).toBeGreaterThan(0);
    expect(example.suppressed).toBeGreaterThan(0);
    for (const verb of DIRECTIVE_VERBS) {
      expect(directivesOf(example.target.content, verb), `the doc example has no '${verb}' directive`).toBeGreaterThan(0);
    }
  });

  it("passes: exactly the documented diagnostics remain, in order, with line, severity and message", () => {
    expect(baseline).toEqual(example.remaining.map((entry) => ({ code: entry.code, severity: entry.severity, line: entry.line, message: entry.message })));
    expect(
      baseline.some((entry) => /^MTL02[0-5]$/.test(entry.code)),
      "a directive warning is printed",
    ).toBe(false);
  });

  it("passes: the summary and the CLI output show the documented suppressed count and exit 1", async () => {
    const { summary, dir } = await lint(example.target.content);
    expect(summary.suppressed).toBe(example.suppressed);
    const cli = await runCli(["--format", "plain"], { cwd: dir, home: HOME, boundary: dir, isTty: false, noColor: false, version: "9.9.9", createIo: () => createMemoryIo() });
    expect(cli.exitCode).toBe(1);
    expect(cli.stdout).toMatch(new RegExp(`Suppressed:\\s+${example.suppressed}\\b`));
  });

  it("passes: with no directive at all, the remaining plus the suppressed diagnostics come back", async () => {
    const { found } = await lint(neutraliseAll(example.target.content));
    expect(found).toHaveLength(example.remaining.length + example.suppressed);
    for (const entry of example.remaining) expect(found.map(key)).toContain(`${entry.code} ${entry.message}`);
  });

  it("covers every verb of the DirectiveVerb union", () => {
    expect(Object.keys(SUPPRESSES).sort()).toEqual([...DIRECTIVE_VERBS].sort());
  });

  for (const verb of DIRECTIVE_VERBS) {
    it(`fails: without the '${verb}' directives of the example, the diagnostics they suppress return`, async () => {
      const { found } = await lint(neutralise(example.target.content, verb));
      const before = new Set(baseline.map(key));
      const returned = found.filter((entry) => !before.has(key(entry)));
      for (const [code, part] of SUPPRESSES[verb]) {
        expect(
          returned.some((entry) => entry.code === code && entry.message.includes(part)),
          `${verb}: expected ${code} (${part}) to return, got ${JSON.stringify(returned)}`,
        ).toBe(true);
      }
    });
  }

  it("fails loudly: an example that is missing, malformed or without its list is rejected", () => {
    const doc = readDoc();
    expect(() => extractExample(doc.replace("### Complete example", "### Other"))).toThrow("'### Complete example' not found");
    expect(() => extractExample("# nothing")).toThrow("'## Disable directives (target files only)' not found");
    expect(() => extractExample(doc.replace("File: `docs/note.md`", "File: `note.md`"))).toThrow("config, a template and a target");
    expect(() => extractExample(doc.replace("The expected remaining diagnostics, in this order, are:", "Nothing remains:"))).toThrow("list of expected remaining diagnostics was not found");
    expect(() => extractExample(doc.replace("`Suppressed:   7`", "`Suppressed: n`"))).toThrow("'Suppressed:' count was not found");
    expect(() => extractExample(doc.replace(/^- `MTL202` \(warning\)/m, "- `MTL202` warning"))).toThrow("cannot parse the remaining diagnostic");
  });

  it("fails: a verb removed from the doc example is caught", async () => {
    const docWithout = (verb: string) => readDoc().replaceAll(`md-template-lint ${verb} `, "md-template-lint-gone ");
    for (const verb of DIRECTIVE_VERBS) {
      const changed = extractExample(docWithout(verb));
      const missing = directivesOf(changed.target.content, verb) === 0;
      const { found } = await lint(changed.target.content);
      const stillMatches = JSON.stringify(found) === JSON.stringify(example.remaining.map((entry) => ({ code: entry.code, severity: entry.severity, line: entry.line, message: entry.message })));
      expect(missing && !stillMatches, `removing '${verb}' from the doc example must be detected`).toBe(true);
    }
  });
});
