/**
 * Source excerpt of a diagnostic, end to end (docs/spec.md 8.1, 8.2, 8.3, 8.5, change C09):
 * the runner matches each diagnostic to its source line, the reporters print and serialize it.
 *
 * - Fixtures tests/fixtures/runner/excerpt-<case>/ hold the plain text, the JSON and (one case)
 *   the `--quiet` output, written out from the spec.
 * - The bytes a text fixture cannot keep (CRLF, BOM, tab, control characters, very long
 *   lines) are generated into a temporary project and removed afterwards.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadConfig } from "../../../src/config/load.js";
import { foldPath } from "../../../src/config/paths.js";
import { reportVerify } from "../../../src/cli/verify-report.js";
import type { Diagnostic } from "../../../src/engine/model.js";
import { createMemoryIo, setAnchorLine } from "../../../src/engine/rule.js";
import { report } from "../../../src/reporters/index.js";
import { withExcerpts } from "../../../src/runner/excerpt.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { runLint } from "../../../src/runner/run.js";
import { loadTemplate, withoutText } from "../../../src/runner/template.js";
import type { VerifyResult } from "../../../src/runner/types.js";
import { verifyPaths } from "../../../src/runner/verify.js";
import { expectSplit, readFixture } from "../../helpers/fixtures.js";
import { HOME, runFixture } from "../../helpers/run.js";

const GROUP = "excerpt-";
const VERSION = "1.0.0";
const ESC = String.fromCharCode(27);
/** Color sequences (SGR) added by the reporter. */
const SGR = new RegExp(`${ESC}\\[[0-9;]*m`, "g");

interface Case {
  readonly name: string;
  readonly exitCode: 0 | 1;
  /** The fixture also holds `expected.quiet.txt`. */
  readonly quiet?: true;
}

/** At least 1 passing case and 1 failing case, one directory each. */
const CASES: readonly Case[] = [
  { name: "pass-clean-file", exitCode: 0 },
  { name: "pass-warning-quotes-key-line", exitCode: 0 },
  { name: "fail-whole-file-findings", exitCode: 1 },
  { name: "fail-anchor-and-position", exitCode: 1, quiet: true },
];

describe("excerpt: layout of the fixtures", () => {
  it("has at least 1 pass- case, at least 1 fail- case, one directory each", () => {
    expectSplit("runner", GROUP, CASES);
  });
});

describe("excerpt: expected outputs of the fixtures", () => {
  for (const testCase of CASES) {
    const dir = `${GROUP}${testCase.name}`;

    it(`${testCase.name}: plain output equals expected.plain.txt`, async () => {
      const result = await runFixture(dir);
      const { stdout, stderr } = report(result, { format: "plain", version: VERSION });
      expect(stdout).toBe(readFixture("runner", dir, "expected.plain.txt"));
      expect(stderr).toBe("");
      expect(result.summary.exitCode).toBe(testCase.exitCode);
    });

    it(`${testCase.name}: JSON equals expected.json`, async () => {
      const result = await runFixture(dir);
      const { stdout } = report(result, { format: "json", version: VERSION });
      expect(JSON.parse(stdout)).toEqual(JSON.parse(readFixture("runner", dir, "expected.json")));
    });

    if (testCase.quiet === true) {
      it(`${testCase.name}: --quiet keeps the excerpts of the errors only`, async () => {
        const result = await runFixture(dir);
        const { stdout } = report(result, { format: "plain", version: VERSION, quiet: true });
        expect(stdout).toBe(readFixture("runner", dir, "expected.quiet.txt"));
      });
    }
  }

  it("pass-clean-file and fail-whole-file-findings print no excerpt row at all", async () => {
    for (const name of ["pass-clean-file", "fail-whole-file-findings"]) {
      const result = await runFixture(`${GROUP}${name}`);
      for (const format of ["pretty", "plain"] as const) {
        const { stdout } = report(result, { format, version: VERSION });
        expect(stdout, `${name} ${format}`).not.toMatch(/^ +\d+ \|/m);
      }
      expect(report(result, { format: "json", version: VERSION }).stdout).not.toContain(
        "sourceLine",
      );
    }
  });

  it("fail-anchor-and-position: pretty is plain with glyphs; color paints only the excerpt rows gray", async () => {
    const result = await runFixture(`${GROUP}fail-anchor-and-position`);
    const pretty = report(result, { format: "pretty", version: VERSION }).stdout;
    const plain = readFixture("runner", `${GROUP}fail-anchor-and-position`, "expected.plain.txt");
    expect(pretty).toBe(plain.replace("  FAIL docs/a.md", "  ✗ docs/a.md"));
    const colored = report(result, { format: "pretty", version: VERSION, color: true }).stdout;
    expect(colored).toContain(`${ESC}[90m        3 | status:${ESC}[0m\n`);
    expect(colored).toContain(`${ESC}[90m          | ^${ESC}[0m\n`);
    // Nothing but color differs.
    expect(colored.replace(SGR, "")).toBe(pretty);
  });

  it("fail-anchor-and-position: JSON puts sourceLine right after column, only on the located diagnostic", async () => {
    const result = await runFixture(`${GROUP}fail-anchor-and-position`);
    const document = JSON.parse(report(result, { format: "json", version: VERSION }).stdout) as {
      results: { files: { errors: object[]; warnings: object[] }[] }[];
    };
    const file = document.results[0]?.files[0];
    const all = [...(file?.errors ?? []), ...(file?.warnings ?? [])];
    expect(all.map((item) => Object.keys(item))).toEqual([
      ["code", "severity", "message"],
      ["code", "severity", "message", "heading"],
      ["code", "severity", "message"],
      ["code", "severity", "message", "line", "column", "sourceLine"],
    ]);
  });

  it("fail-anchor-and-position: a target diagnostic quotes the target line, not the template line", async () => {
    // Line 3 is `status: "string"` in the template and `status:` in the target.
    const result = await runFixture(`${GROUP}fail-anchor-and-position`);
    const { stdout } = report(result, { format: "plain", version: VERSION });
    expect(stdout).toContain("        3 | status:\n");
    expect(stdout).not.toContain('"string"');
  });
});

describe("withExcerpts: which line a diagnostic quotes (spec 8.1)", () => {
  const base = { code: "MTL202", severity: "warning", message: "m", position: null } as const;
  const text = "one\ntwo\nthree";

  it("pass: the line of the position wins over the anchor, and carries the column", () => {
    const diagnostic: Diagnostic = { ...base, position: { line: 2, column: 3 } };
    setAnchorLine(diagnostic, 1);
    expect(withExcerpts([diagnostic], text)[0]?.excerpt).toEqual({
      line: 2,
      column: 3,
      text: "two",
      before: 0,
      after: 0,
      caret: 2,
      head: "two",
      headCut: false,
    });
  });

  it("pass: without a position the anchor line is quoted, with no column and no JSON head", () => {
    const diagnostic = setAnchorLine({ ...base }, 3);
    expect(withExcerpts([diagnostic], text)[0]?.excerpt).toEqual({
      line: 3,
      column: null,
      text: "three",
      before: 0,
      after: 0,
      caret: null,
      head: null,
      headCut: false,
    });
  });

  it("fail: no position and no anchor gives no excerpt, and the same object back", () => {
    const diagnostic: Diagnostic = { ...base };
    const [out] = withExcerpts([diagnostic], text);
    expect(out).toBe(diagnostic);
    expect(out).not.toHaveProperty("excerpt");
  });

  it("fail: a line outside the file gives no excerpt", () => {
    const outside = [
      { ...base, position: { line: 4, column: 1 } },
      { ...base, position: { line: 0, column: 1 } },
      setAnchorLine({ ...base }, 99),
    ];
    for (const out of withExcerpts(outside, text)) expect(out).not.toHaveProperty("excerpt");
  });

  it("fail: a position outside the file gives no excerpt, even with an anchor inside it (no fallback)", () => {
    // Spec 8.1 step 1: the position line is chosen first; the anchor is only for no position.
    const diagnostic: Diagnostic = { ...base, position: { line: 4, column: 1 } };
    setAnchorLine(diagnostic, 1);
    const [out] = withExcerpts([diagnostic], text);
    expect(out).toBe(diagnostic);
    expect(out).not.toHaveProperty("excerpt");
  });

  it("pass: a line is prepared once however many diagnostics quote it (EX8, one pass per line)", () => {
    // `prepare` allocates one Uint32Array per line holding a character above U+FFFF: count them.
    let allocated = 0;
    class Counting extends Uint32Array {
      constructor(length: number) {
        super(length);
        allocated += 1;
      }
    }
    const astral = `a\u{1f600}${"b".repeat(1000)}`;
    const lines = `${astral}\nplain\n${astral}`;
    const diagnostics = [1, 2, 3].flatMap((line) =>
      Array.from({ length: 200 }, (_, index) => ({
        ...base,
        position: { line, column: index + 1 },
      })),
    );
    vi.stubGlobal("Uint32Array", Counting);
    try {
      const out = withExcerpts(diagnostics, lines);
      expect(out.every((item) => item.excerpt !== undefined)).toBe(true);
    } finally {
      vi.unstubAllGlobals();
    }
    // Lines 1 and 3 hold an astral character, line 2 does not: 2 allocations, not 400.
    expect(allocated).toBe(2);
  });

  /** Many diagnostics on each of a few ASCII lines (no character above U+FFFF). */
  function asciiCase() {
    const long = "c".repeat(1000);
    const text = `${long}\nshort line\n${long}`;
    const diagnostics = [1, 2, 3].flatMap((line) =>
      Array.from({ length: 200 }, (_, index) => ({
        ...base,
        position: { line, column: index + 1 },
      })),
    );
    // Characters of the distinct quoted lines: what one pass over each of them reads.
    return { text, diagnostics, quoted: long.length * 2 + "short line".length };
  }

  it("pass: an ASCII line is read at most once however many diagnostics quote it (EX8)", () => {
    const { text, diagnostics, quoted } = asciiCase();
    // Every character read by index during the build: bounded by one pass per quoted line.
    const reads = vi.spyOn(String.prototype, "charCodeAt");
    let calls: number;
    try {
      const out = withExcerpts(diagnostics, text);
      expect(out.every((item) => item.excerpt !== undefined)).toBe(true);
    } finally {
      calls = reads.mock.calls.length;
      reads.mockRestore();
    }
    // One pass: at most `quoted` reads; one pass per diagnostic would be 200 times that.
    expect(calls).toBeLessThanOrEqual(quoted);
  });

  it("pass: the file text is normalized and split once, not once per diagnostic (EX8)", () => {
    const { text, diagnostics } = asciiCase();
    const splits = vi.spyOn(String.prototype, "split");
    const replaces = vi.spyOn(String.prototype, "replaceAll");
    let splitCalls: number;
    let replaceCalls: number;
    try {
      withExcerpts(diagnostics, text);
    } finally {
      splitCalls = splits.mock.calls.length;
      replaceCalls = replaces.mock.calls.length;
      splits.mockRestore();
      replaces.mockRestore();
    }
    // One split into lines and one line-end normalization (CRLF then lone CR), for 600 diagnostics.
    expect(splitCalls).toBe(1);
    expect(replaceCalls).toBeLessThanOrEqual(2);
  });

  it("pass: lines are numbered after line-end normalization (CRLF, lone CR, BOM)", () => {
    const crlf = "\uFEFFone\r\ntwo\rthree\r\n";
    const found = withExcerpts(
      [1, 2, 3, 4].map((line) => ({ ...base, position: { line, column: 1 } })),
      crlf,
    );
    expect(found.map((item) => item.excerpt?.text)).toEqual(["one", "two", "three", ""]);
  });

  it("pass: nothing to do for an empty list", () => {
    expect(withExcerpts([], text)).toEqual([]);
  });
});

const made: string[] = [];

afterEach(() => {
  for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const CONFIG = `pairs:
  - name: notes
    template: templates/note.template.md
    include: docs/*.md
`;

/** A temporary project: the config, `templates/note.template.md` and `docs/a.md`. */
function project(template: string, target: string): string {
  const dir = mkdtempSync(join(tmpdir(), "mtl-excerpt-"));
  made.push(dir);
  const files: Record<string, string> = {
    "md-template-lint.yml": CONFIG,
    "templates/note.template.md": template,
    "docs/a.md": target,
  };
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  return dir;
}

const TITLE_TEMPLATE = '---\ntitle: "string"\n---\n';

async function lint(dir: string) {
  const loaded = await loadConfig({ cwd: dir, home: HOME, boundary: dir });
  const result = await runLint(loaded, { io: createMemoryIo() });
  return {
    plain: report(result, { format: "plain", version: VERSION }).stdout,
    json: report(result, { format: "json", version: VERSION }).stdout,
    result,
  };
}

/** The `warn`/`error` line and the rows under it, as one block of the plain output. */
const block = (...rows: string[]): string => `${rows.join("\n")}\n`;

describe("excerpt: bytes a text fixture cannot keep", () => {
  it("pass: CRLF line ends and a BOM give the same excerpt as LF, with no \\r", async () => {
    const target = "\uFEFF---\r\ntitle: Fine\r\nreviewer: alice\r\n---\r\n\r\n# Notes\r\n";
    const { plain, json } = await lint(project(TITLE_TEMPLATE, target));
    expect(plain).toContain(
      block(
        "  PASS docs/a.md",
        "      warn  MTL202 Unknown key 'reviewer' not present in template",
        "        3 | reviewer: alice",
      ),
    );
    expect(plain).not.toContain("\r");
    expect(json).not.toContain("sourceLine");
  });

  it("fail: a tab is one space, two tabs two spaces (not collapsed)", async () => {
    const target = '---\ntitle: Fine\nextra: "a\t\tb"\n---\n';
    const { plain } = await lint(project(TITLE_TEMPLATE, target));
    expect(plain).toContain(
      block(
        "      warn  MTL202 Unknown key 'extra' not present in template",
        '        3 | extra: "a  b"',
      ),
    );
    expect(plain).not.toContain("\t");
  });

  it("fail: control characters of the line are escaped in text and in JSON", async () => {
    const comment = `<!-- md-template-lint disabel MTL601 ${ESC}[2J\u202e -->`;
    const target = `---\ntitle: Fine\n---\n\n${comment}\n`;
    const { plain, json } = await lint(project(TITLE_TEMPLATE, target));
    const shown = "<!-- md-template-lint disabel MTL601 \\x1b[2J\\u202e -->";
    expect(plain).toContain(`        5 | ${shown}\n          | ^\n`);
    const warning = (
      JSON.parse(json) as { results: { files: { warnings: Record<string, unknown>[] }[] }[] }
    ).results[0]?.files[0]?.warnings[0];
    expect(warning).toMatchObject({ code: "MTL020", line: 5, column: 1, sourceLine: shown });
    for (const output of [plain, json]) {
      expect(output.includes(ESC)).toBe(false);
      expect(output.includes("\u202e")).toBe(false);
    }
  });

  it("fail: a long line is cut at 100 characters with `...` (anchor: no caret, no JSON sourceLine)", async () => {
    const value = `extra: ${"b".repeat(150)}`;
    const target = `---\ntitle: Fine\n${value}\n---\n`;
    const { plain, json } = await lint(project(TITLE_TEMPLATE, target));
    expect(plain).toContain(
      block(
        "      warn  MTL202 Unknown key 'extra' not present in template",
        `        3 | ${value.slice(0, 100)}...`,
      ),
    );
    expect(plain).not.toMatch(/^ +\| /m);
    expect(json).not.toContain("sourceLine");
  });

  it("fail: a directive far into a long line gets a window around the caret and a cut JSON line", async () => {
    // `# ` + 118 letters + a space = 121 characters, then the comment: column 122.
    const comment = "<!-- md-template-lint disabel MTL601 -->";
    const heading = `# ${"a".repeat(118)} ${comment}`;
    const target = `---\ntitle: Fine\n---\n\n${heading}\n`;
    const { plain, json } = await lint(project(TITLE_TEMPLATE, target));
    // Index of the comment is 121, window [81, 161): 40 characters, then the caret.
    expect(plain).toContain(
      block(`        5 | ...${heading.slice(81)}`, `          | ${" ".repeat(3 + 40)}^`),
    );
    const warning = (
      JSON.parse(json) as { results: { files: { warnings: Record<string, unknown>[] }[] }[] }
    ).results[0]?.files[0]?.warnings[0];
    expect(warning).toMatchObject({
      line: 5,
      column: 122,
      sourceLine: `${heading.slice(0, 100)}...`,
    });
  });

  it("fail: a target that does not parse has no source line", async () => {
    const { plain, json, result } = await lint(project(TITLE_TEMPLATE, "no frontmatter here\n"));
    expect(result.summary.exitCode).toBe(1);
    expect(plain).toContain("Parse error: File must have YAML frontmatter (---...---)\n\n");
    expect(plain).not.toMatch(/^ +\d+ \|/m);
    expect(json).not.toContain("sourceLine");
  });
});

describe("excerpt: --verify quotes the template line", () => {
  const template = '---\r\nowner: "string" # [optionl]\r\n---\r\n\r\n## Summary\r\n';

  async function verify() {
    const dir = project(template, "");
    return verifyPaths({
      cwd: foldPath(dir),
      home: HOME,
      paths: ["templates/note.template.md"],
    });
  }

  it("pass: each tag item of a CRLF template is followed by its line and a caret", async () => {
    const out = reportVerify(await verify(), { format: "plain", version: VERSION }).stdout;
    expect(out).toContain(
      block(
        "Unknown tags found (typo or unimplemented feature):",
        "  - Field 'owner': unknown tag [optionl]",
        '      2 | owner: "string" # [optionl]',
        // column 19: 18 characters before the `[`
        `        | ${" ".repeat(18)}^`,
      ),
    );
    expect(out).not.toContain("\r");
  });

  it("pass: JSON puts sourceLine next to line and column of the template warning", async () => {
    const out = reportVerify(await verify(), { format: "json", version: VERSION }).stdout;
    const [item] = (JSON.parse(out) as { templates: { diagnostics: object[] }[] }).templates;
    expect(item?.diagnostics).toEqual([
      {
        code: "MTL010",
        severity: "warning",
        message: "Field 'owner': unknown tag [optionl]",
        line: 2,
        column: 19,
        sourceLine: 'owner: "string" # [optionl]',
      },
    ]);
  });

  it("fail: --quiet hides the sections, so the excerpts too", async () => {
    const out = reportVerify(await verify(), {
      format: "plain",
      version: VERSION,
      quiet: true,
    }).stdout;
    expect(out).toBe("");
  });

  it("pass: color paints the excerpt rows gray and the item yellow", async () => {
    const out = reportVerify(await verify(), {
      format: "pretty",
      version: VERSION,
      color: true,
    }).stdout;
    expect(out).toContain(`${ESC}[33m  - Field 'owner': unknown tag [optionl]${ESC}[0m\n`);
    expect(out).toContain(`${ESC}[90m      2 | owner: "string" # [optionl]${ESC}[0m\n`);
  });

  it("fail: an item whose line does not exist in the template has no excerpt", () => {
    const tag: Diagnostic = {
      code: "MTL012",
      severity: "warning",
      message: "Field 'n': malformed tag [count:min:abc]",
      position: { line: 99, column: 1 },
    };
    const result: VerifyResult = {
      mode: "verify",
      config: null,
      templates: [
        {
          template: { path: "t.md", status: "ok" },
          warnings: withExcerpts([tag], "---\nn: x\n---\n"),
          schema: { filenameCase: null, fields: [], headings: [] },
        },
      ],
      runErrors: [],
      summary: { templates: 1, broken: 0, warnings: 1, runErrors: 0, exitCode: 0 },
    };
    const text = reportVerify(result, { format: "plain", version: VERSION }).stdout;
    expect(text).toContain(
      block(
        "Malformed tags:",
        "  - Field 'n': malformed tag [count:min:abc] (line 99, column 1)",
        "",
      ),
    );
    const json = reportVerify(result, { format: "json", version: VERSION }).stdout;
    expect(json).toContain('"line": 99');
    expect(json).not.toContain("sourceLine");
  });
});

describe("excerpt: withoutText drops the template text that loadTemplate keeps (EX8)", () => {
  it("pass: loadTemplate keeps the text for --verify, withoutText drops it (ok and broken)", async () => {
    const dir = project(TITLE_TEMPLATE, "");
    const registry = createRegistry();
    const ok = await loadTemplate(registry, join(dir, "templates", "note.template.md"));
    expect(ok.text).toBe(TITLE_TEMPLATE);
    expect(withoutText(ok)).not.toHaveProperty("text");
    expect(withoutText(ok)).toMatchObject({ status: "ok" });
    const broken = await loadTemplate(registry, join(dir, "docs", "a.md"));
    expect(broken.status).toBe("broken");
    expect(withoutText(broken)).not.toHaveProperty("text");
    expect(withoutText(broken)).toMatchObject({ status: "broken" });
  });
});

describe("excerpt: --quiet does not shrink JSON", () => {
  it("pass: quiet JSON keeps sourceLine of the directive warning (fail-anchor-and-position)", async () => {
    const result = await runFixture(`${GROUP}fail-anchor-and-position`);
    const quiet = report(result, { format: "json", version: VERSION, quiet: true }).stdout;
    expect(JSON.parse(quiet)).toEqual(
      JSON.parse(readFixture("runner", `${GROUP}fail-anchor-and-position`, "expected.json")),
    );
    expect(quiet).toContain('"sourceLine": "<!-- md-template-lint disable-line MTL999 -->"');
  });
});

/** Very long lines: the cost and the memory per diagnostic do not depend on their length (EX8). */
describe("excerpt: bounded cost and memory on very long lines", () => {
  const TOKENS = 2000;
  const REASON = 1_000_000;
  const codes = Array.from({ length: TOKENS }, (_, index) => `ZZ${String(index).padStart(4, "0")}`);
  const prefix = `<!-- md-template-lint disable ${codes.join(", ")} -- `;
  /** One line of more than 1 MB holding one directive with 2000 unknown rule codes (2000 MTL021). */
  const line = `${prefix}${"x".repeat(REASON)} -->`;
  const target = `---\ntitle: Fine\n---\n\n${line}\n`;

  async function longLine() {
    const dir = project(TITLE_TEMPLATE, target);
    const started = Date.now();
    const output = await lint(dir);
    return { ...output, elapsed: Date.now() - started };
  }

  it("fail: 2000 diagnostics on one line of more than 1 MB finish quickly with the right rows", async () => {
    expect(line.length).toBeGreaterThan(1_000_000);
    const { plain, result, elapsed } = await longLine();
    // Generous (a run takes well under a second): copying the whole line per diagnostic is
    // about 2000 x 1 MB, ten seconds or more.
    expect(elapsed).toBeLessThan(5_000);
    const shown = `${line.slice(0, 100)}...`;
    const rows = (code: string): string =>
      block(
        `      warn  MTL021 Directive on line 5: unknown rule code '${code}'`,
        `        5 | ${shown}`,
        "          | ^",
      );
    expect(plain).toContain(rows(codes[0] ?? ""));
    expect(plain).toContain(rows(codes[TOKENS - 1] ?? ""));
    expect(plain.split("MTL021").length - 1).toBe(TOKENS);
    expect(result.summary.warnings).toBe(TOKENS);
  }, 60_000);

  it("fail: what is kept on a diagnostic is at most 100 characters per string, never the line", async () => {
    // The run result only: the stored objects are asserted, not a rendering of them.
    const dir = project(TITLE_TEMPLATE, target);
    const loaded = await loadConfig({ cwd: dir, home: HOME, boundary: dir });
    const result = await runLint(loaded, { io: createMemoryIo() });
    const [block0] = result.blocks;
    if (block0?.kind !== "pair") throw new Error("expected a pair block");
    const warnings = block0.files[0]?.warnings ?? [];
    expect(warnings).toHaveLength(TOKENS);
    for (const warning of warnings) {
      const excerpt = warning.excerpt;
      expect(excerpt).toBeDefined();
      if (excerpt === undefined) continue;
      // `text` is the window (EX5) and `head` the JSON line (8.5): at most 100 characters each.
      expect(Array.from(excerpt.text).length).toBeLessThanOrEqual(100);
      expect(Array.from(excerpt.head ?? "").length).toBeLessThanOrEqual(100);
      expect(excerpt).toMatchObject({ line: 5, column: 1, before: 0, caret: 0, headCut: true });
      // No other field: nothing on the excerpt can hold the whole line.
      expect(Object.keys(excerpt).sort()).toEqual(
        ["after", "before", "caret", "column", "head", "headCut", "line", "text"].sort(),
      );
      expect(excerpt.after).toBe(line.length - 100);
    }
  }, 60_000);

  it("pass: a column deep in a long line slides the window, with the same bounds", async () => {
    // 300000 emoji (600000 UTF-16 units) then the directive: column 300001.
    const wide = `${"\u{1f600}".repeat(300_000)}<!-- md-template-lint disabel MTL601 -->`;
    const { plain, result } = await lint(
      project(TITLE_TEMPLATE, `---\ntitle: Fine\n---\n\n# ${wide}\n`),
    );
    const [first] = result.blocks;
    if (first?.kind !== "pair") throw new Error("expected a pair block");
    const excerpt = first.files[0]?.warnings[0]?.excerpt;
    // `# ` is 2 characters: the comment starts at index 300002; the window is [299962, 300062).
    expect(excerpt).toMatchObject({ line: 5, column: 300_003, before: 299_962, caret: 40 });
    expect(Array.from(excerpt?.text ?? "").length).toBeLessThanOrEqual(100);
    const comment = "<!-- md-template-lint disabel MTL601 -->";
    const shown = `...${"\u{1f600}".repeat(40)}${comment}`;
    expect(plain).toContain(`        5 | ${shown}\n          | ${" ".repeat(3 + 40)}^\n`);
  }, 60_000);
});
