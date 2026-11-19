/**
 * Characterization of `runLint` on a large project (A4 of the perf plan, tmp/PLAN_perf-bench.md,
 * targets R1 and R2). The expected values were produced by the code at the time of writing, not
 * derived from the spec: they pin the ORDER of the blocks and of the files, each file's diagnostics
 * (code, message, line), the summary with its suppressed count and the exit code, so a run that reads
 * several targets ahead of the one being linted must change none of them.
 *
 * The project is built in code in a temporary folder (about 330 targets in three pairs, two sharing one
 * template, plus a pair whose template is missing): invalid UTF-8, no frontmatter, invalid YAML, passing
 * files, files with one or several errors, a file with warnings, and files with a disable directive.
 * Names are chosen so the code-unit walk order differs from the creation order and from the order a
 * human would sort them (`n10` before `n2`, `B/` before `a/`, `a-b/` before `a/`).
 *
 * Read order: `node:fs/promises` `readFile` is wrapped so each target read can be delayed by a number of
 * event-loop turns (`setImmediate`, no timer, no wall clock) chosen per path. A run that overlaps reads
 * then finishes them in an order other than the order they started; the results must still come out in
 * file order. Today's sequential run is unaffected by the delays, and the same pins must hold.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { loadConfig } from "../../../src/config/load.js";
import { foldPath } from "../../../src/config/paths.js";
import { createMemoryIo } from "../../../src/engine/rule.js";
import { runLint } from "../../../src/runner/run.js";
import type { ReportedDiagnostic, RunResult } from "../../../src/runner/types.js";
import { digestOf } from "../../helpers/characterize.js";
import { lcg, below } from "../../helpers/large-docs.js";

/** Hook of the wrapped `readFile`: called with the `/` form of the path before every string-path read. */
const hook = vi.hoisted(() => ({ before: null as null | ((path: string) => Promise<void> | void) }));

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  const readFile = (async (path: Parameters<typeof actual.readFile>[0], options?: Parameters<typeof actual.readFile>[1]) => {
    if (hook.before !== null && typeof path === "string") await hook.before(path.replaceAll("\\", "/"));
    return actual.readFile(path, options as never);
  }) as typeof actual.readFile;
  return { ...actual, readFile };
});

/** `count` turns of the event loop, no timer: the delay is a number of steps, not a duration. */
async function turns(count: number): Promise<void> {
  for (let step = 0; step < count; step += 1) await new Promise<void>((resolve) => setImmediate(resolve));
}

const BAD_UTF8 = Buffer.from([0x2d, 0x2d, 0x2d, 0x0a, 0xff, 0xfe, 0x0a]);

const NOTE_TEMPLATE = ["---", 'title: "string"', 'version: "0.0.0" # [format:semver]', "---", "# Note", "## Summary", '## Log [pattern:"Entry {digits}"] [repeat-rules:same-level] [presence:optional]', ""].join("\n");
const OTHER_TEMPLATE = ["---", 'title: "string"', "---", ""].join("\n");

const note = (options: { readonly version?: string; readonly title?: boolean; readonly summary?: boolean; readonly extra?: boolean; readonly directive?: string } = {}): string =>
  [
    "---",
    ...(options.title === false ? [] : ["title: T"]),
    `version: ${options.version ?? "1.0.0"}`,
    "---",
    ...(options.directive === undefined ? [] : [options.directive]),
    "# Note",
    ...(options.summary === false ? [] : ["## Summary", "text"]),
    "## Entry 1",
    "## Entry 2",
    ...(options.extra === true ? ["## Extra"] : []),
    "",
  ].join("\n");

type Content = string | Buffer;

/** Kinds of target, by `index % 10` in the main pair; what each is expected to give is asserted below. */
const KINDS: readonly { readonly name: string; readonly make: () => Content }[] = [
  { name: "invalid-utf8", make: () => BAD_UTF8 },
  { name: "no-frontmatter", make: () => "# Note\n## Summary\n" },
  { name: "invalid-yaml", make: () => "---\ntitle: [\n---\n# Note\n" },
  { name: "pass", make: () => note() },
  { name: "pass", make: () => note() },
  { name: "pass", make: () => note() },
  { name: "bad-version", make: () => note({ version: "x" }) },
  { name: "several-errors", make: () => note({ version: "x", title: false, summary: false, extra: true }) },
  { name: "suppressed", make: () => note({ summary: false, directive: "<!-- md-template-lint disable-file MTL601 -->" }) },
  { name: "warning", make: () => note({ extra: true }) },
];

/** Where the generated targets of the main pair go: names that sort differently as text, as numbers and by case. */
const DIRS = ["", "a/", "B/", "a-b/", "deep/x/", "é/"] as const;
const STEMS = ["n", "N", "z_", "n-", "é", "0"] as const;
const MAIN = 300;

interface Target {
  readonly path: string;
  readonly kind: string;
  readonly content: Content;
}

/** The 300 targets of the pair `notes` (`docs/**`), in creation order. */
function mainTargets(): Target[] {
  const next = lcg(20260519);
  return Array.from({ length: MAIN }, (_, index): Target => {
    const kind = KINDS[index % 10];
    if (kind === undefined) throw new Error("kind");
    const dir = DIRS[below(next, DIRS.length)] ?? "";
    const stem = STEMS[below(next, STEMS.length)] ?? "n";
    return { path: `docs/${dir}${stem}${index}.md`, kind: kind.name, content: kind.make() };
  });
}

const ARCHIVE: readonly Target[] = Array.from({ length: 20 }, (_, index): Target => {
  const kinds = [KINDS[3], KINDS[3], KINDS[6], KINDS[1]] as const;
  const kind = kinds[index % 4];
  if (kind === undefined) throw new Error("kind");
  return { path: `archive/r${index}.md`, kind: kind.name, content: kind.make() };
});

const OTHER: readonly Target[] = Array.from({ length: 12 }, (_, index): Target => ({ path: `other/o${index}.md`, kind: index % 3 === 0 ? "no-title" : "pass", content: index % 3 === 0 ? "---\nsubtitle: x\n---\n" : "---\ntitle: T\n---\n" }));

const CONFIG = [
  "pairs:",
  "  - name: notes",
  "    template: templates/note.template.md",
  "    include: docs/**/*.md",
  "  - name: ghost",
  "    template: templates/missing.template.md",
  "    include: ghost/*.md",
  "  - name: archive",
  "    template: templates/note.template.md",
  "    include: archive/*.md",
  "  - name: other",
  "    template: templates/other.template.md",
  "    include: other/*.md",
  "",
].join("\n");

function put(root: string, relative: string, content: Content): void {
  const file = join(root, relative);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

const made: string[] = [];

function tempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  made.push(dir);
  return dir;
}

afterAll(() => {
  hook.before = null;
  for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
});

async function run(dir: string, files?: readonly string[]): Promise<RunResult> {
  const loaded = await loadConfig({ cwd: dir, home: "/home/test", boundary: dir });
  return runLint(loaded, { io: createMemoryIo(), ...(files === undefined ? {} : { files: { cwd: foldPath(dir), home: "/home/test", paths: files } }) });
}

type Row = readonly [code: string, message: string, line: number | null];

interface FileRow {
  readonly pair: string;
  readonly path: string;
  readonly status: string;
  readonly errors: readonly Row[];
  readonly warnings: readonly Row[];
}

const rowsOf = (list: readonly ReportedDiagnostic[]): Row[] => list.map((item): Row => [item.code, item.message, item.position?.line ?? item.excerpt?.line ?? null]);

function fileRows(result: RunResult): FileRow[] {
  return result.blocks.flatMap((block) => (block.kind === "pair" ? block.files.map((file): FileRow => ({ pair: block.pair, path: file.path, status: file.status, errors: rowsOf(file.errors), warnings: rowsOf(file.warnings) })) : []));
}

/** Everything a test pins of a run, besides the explicit per-kind checks. */
function projection(result: RunResult) {
  const files = fileRows(result);
  const codes = files.flatMap((file) => [...file.errors, ...file.warnings].map((row) => row[0]));
  return {
    blocks: result.blocks.map((block) => (block.kind === "pair" ? `${block.root}:${block.pair}:${block.template.status}:${block.files.length}/${block.fileCount}` : `note:${block.diagnostic.code}`)),
    files: files.length,
    statuses: { pass: files.filter((file) => file.status === "pass").length, fail: files.filter((file) => file.status === "fail").length },
    codes: Object.fromEntries([...new Set(codes)].sort().map((code) => [code, codes.filter((other) => other === code).length])),
    head: files.slice(0, 3),
    tail: files.slice(-2),
    digest: digestOf(files),
    brokenTemplates: result.brokenTemplates,
    failedTemplates: result.failedTemplates,
    runErrors: result.runErrors.map((error) => [error.code, error.message, error.pair ?? null, error.root ?? null]),
    runWarnings: result.runWarnings.length,
    unmatched: result.unmatched,
    summary: result.summary,
  };
}

const FULL_FILES = {
  files: 332,
  statuses: { pass: 168, fail: 164 },
  codes: { MTL001: 35, MTL002: 30, MTL004: 30, MTL201: 34, MTL202: 4, MTL306: 65, MTL601: 30, MTL616: 60 },
};

const SEVERAL_ERRORS: FileRow = {
  pair: "notes",
  path: "docs/B/037.md",
  status: "fail",
  errors: [
    ["MTL201", "Field 'title': required but empty or missing", null],
    ["MTL306", "Field 'version': value 'x' is not a semantic version [format:semver]", 2],
    ["MTL601", "Heading: Missing required heading: 'Summary'", null],
  ],
  warnings: [["MTL616", "Heading: 1 extra heading(s) at level H2 after the template headings: ['Extra']", 7]],
};

const MISSING_TITLE: FileRow = { pair: "other", path: "other/o9.md", status: "fail", errors: [["MTL201", "Field 'title': required but empty or missing", null]], warnings: [["MTL202", "Unknown key 'subtitle' not present in template", 2]] };

const PINS: Readonly<Record<string, unknown>> = {
  full: {
    blocks: ["project:notes:ok:300/300", "project:archive:ok:20/20", "project:other:ok:12/12"],
    ...FULL_FILES,
    head: [
      { pair: "notes", path: "docs/0134.md", status: "pass", errors: [], warnings: [] },
      {
        pair: "notes",
        path: "docs/0152.md",
        status: "fail",
        errors: [["MTL002", "Parse error: YAML parse error: Flow sequence in block collection must be sufficiently indented and end with a ] at line 2, column 1:\n\ntitle: [\n\n^\n", null]],
        warnings: [],
      },
      { pair: "notes", path: "docs/0159.md", status: "pass", errors: [], warnings: [["MTL616", "Heading: 1 extra heading(s) at level H2 after the template headings: ['Extra']", 10]] },
    ],
    tail: [{ pair: "other", path: "other/o8.md", status: "pass", errors: [], warnings: [] }, MISSING_TITLE],
    digest: "71d577fe40be4db9f2a8e6a73f639264",
    brokenTemplates: [],
    failedTemplates: [],
    runErrors: [["MTL910", "template not found: templates/missing.template.md (pair 'ghost')", "ghost", null]],
    runWarnings: 0,
    unmatched: [],
    summary: { files: 332, passed: 168, failed: 164, warnings: 64, filesWithWarnings: 64, suppressed: 30, templatesChecked: 2, templatesBroken: 0, runErrors: 1, runWarnings: 0, exitCode: 2 },
  },
  list: {
    blocks: ["project:notes:ok:40/40", "project:archive:ok:2/2", "project:other:ok:2/2"],
    files: 44,
    statuses: { pass: 23, fail: 21 },
    codes: { MTL001: 4, MTL002: 4, MTL004: 4, MTL201: 4, MTL306: 9, MTL601: 4, MTL616: 8 },
    head: [{ pair: "notes", path: "docs/04.md", status: "pass", errors: [], warnings: [] }, SEVERAL_ERRORS, { ...SEVERAL_ERRORS, path: "docs/N17.md" }],
    tail: [
      { pair: "other", path: "other/o1.md", status: "pass", errors: [], warnings: [] },
      { pair: "other", path: "other/o4.md", status: "pass", errors: [], warnings: [] },
    ],
    digest: "b15ce8f4a1fa5a05fe12ec18c4ef15fd",
    brokenTemplates: [],
    failedTemplates: [],
    runErrors: [["MTL912", "target not found: docs/zz-missing.md", "notes", "project"]],
    runWarnings: 0,
    unmatched: ["README.txt", "docs/notes.txt"],
    summary: { files: 44, passed: 23, failed: 21, warnings: 8, filesWithWarnings: 8, suppressed: 4, templatesChecked: 2, templatesBroken: 0, runErrors: 1, runWarnings: 0, exitCode: 2 },
  },
};

const pinned = (name: string, actual: unknown): void => {
  expect(actual).toEqual(PINS[name]);
};

describe("R1: runLint on a project of 332 targets in three pairs and a pair without template", () => {
  let dir = "";
  /** The undelayed full run, made once: a cold run of 332 files takes seconds under load. */
  let baseline: RunResult;
  beforeAll(async () => {
    dir = tempDir("mtl-large-run-");
    put(dir, "md-template-lint.yml", CONFIG);
    put(dir, "templates/note.template.md", NOTE_TEMPLATE);
    put(dir, "templates/other.template.md", OTHER_TEMPLATE);
    for (const target of [...mainTargets(), ...ARCHIVE, ...OTHER]) put(dir, target.path, target.content);
    baseline = await run(dir);
  }, 60_000);

  it("the walk order is the code-unit order of the root-relative path, and not the creation order", () => {
    const result = baseline;
    const notes = fileRows(result)
      .filter((file) => file.pair === "notes")
      .map((file) => file.path);
    expect(notes).toHaveLength(MAIN);
    expect(notes).toEqual([...notes].sort());
    expect(notes).not.toEqual(mainTargets().map((target) => target.path));
    expect(new Set(notes)).toEqual(new Set(mainTargets().map((target) => target.path)));
  });

  it("each kind of target gives the diagnostics its content calls for", () => {
    const result = baseline;
    const byPath = new Map(fileRows(result).map((file) => [file.path, file] as const));
    const expectedFor = new Map<string, readonly [status: string, errors: readonly string[], warnings: readonly string[]]>([
      ["invalid-utf8", ["fail", ["MTL004"], []]],
      ["no-frontmatter", ["fail", ["MTL001"], []]],
      ["invalid-yaml", ["fail", ["MTL002"], []]],
      ["pass", ["pass", [], []]],
      ["bad-version", ["fail", ["MTL306"], []]],
      ["suppressed", ["pass", [], []]],
      ["warning", ["pass", [], ["MTL616"]]],
      ["no-title", ["fail", ["MTL201"], ["MTL202"]]],
    ]);
    for (const target of [...mainTargets(), ...ARCHIVE, ...OTHER]) {
      const file = byPath.get(target.path);
      const expected = expectedFor.get(target.kind);
      if (file === undefined) throw new Error(`${target.path} was not linted`);
      if (expected === undefined) continue;
      expect([file.status, file.errors.map((row) => row[0]), file.warnings.map((row) => row[0])], `${target.path} (${target.kind})`).toEqual(expected);
    }
    const utf8 = [...byPath.values()].find((file) => file.errors[0]?.[0] === "MTL004");
    expect(utf8?.errors).toEqual([["MTL004", "Parse error: file is not valid UTF-8", null]]);
    const noFrontmatter = [...byPath.values()].find((file) => file.errors[0]?.[0] === "MTL001");
    expect(noFrontmatter?.errors[0]?.[1]).toBe("Parse error: File must have YAML frontmatter (---...---)");
    const several = mainTargets().find((target) => target.kind === "several-errors");
    expect(byPath.get(several?.path ?? "")?.errors.map((row) => row[0])).toEqual(["MTL201", "MTL306", "MTL601"]);
  });

  it("full run: blocks, files, diagnostics, summary and exit code", () => {
    pinned("full", projection(baseline));
  });

  it.each([
    ["reads of earlier files finish last", (n: number) => 9 - (n % 10)],
    ["reads finish in a scrambled order", (n: number) => (n * 7) % 11],
  ])(
    "the same result when %s",
    async (_name, policy) => {
      const started = new Map<string, number>();
      hook.before = async (path) => {
        if (!/\/(docs|archive|other)\//.test(path)) return;
        started.set(path, (started.get(path) ?? 0) + 1);
        const sum = [...path].reduce((total, char) => total + char.charCodeAt(0), 0);
        await turns(policy(sum));
      };
      try {
        // The very same pin as the undelayed run.
        pinned("full", projection(await run(dir)));
      } finally {
        hook.before = null;
      }
      // Every target is read once, whatever the order the reads finish in.
      expect(started.size).toBe(MAIN + ARCHIVE.length + OTHER.length);
      expect([...started.values()].every((count) => count === 1)).toBe(true);
    },
    60_000,
  );

  it("file-list mode: files of each pair in path order, a missing file is MTL912 once, the rest is unmatched", async () => {
    const some = mainTargets()
      .slice(0, 40)
      .map((target) => target.path);
    const paths = [...some.slice().reverse(), some[3] ?? "", "docs/zz-missing.md", "docs/zz-missing.md", "other/o4.md", "other/o1.md", "archive/r2.md", "archive/r1.md", "README.txt", "docs/notes.txt"];
    const result = await run(dir, paths);
    pinned("list", projection(result));
    expect(result.runErrors.map((error) => error.code)).toEqual(["MTL912"]);
    expect(result.unmatched).toEqual(["README.txt", "docs/notes.txt"]);
    expect(result.summary.exitCode).toBe(2);
  }, 60_000);

  it("file-list mode without the missing file ends with exit code 1; with only passing files, 0", async () => {
    const targets = mainTargets();
    const failing = await run(dir, [targets[6]?.path ?? "", targets[3]?.path ?? ""]);
    expect(failing.summary).toMatchObject({ files: 2, passed: 1, failed: 1, exitCode: 1 });
    const passing = await run(dir, [targets[5]?.path ?? "", targets[3]?.path ?? "", targets[8]?.path ?? ""]);
    expect(passing.summary).toMatchObject({ files: 3, passed: 3, failed: 0, suppressed: 1, exitCode: 0 });
    expect(fileRows(passing).map((file) => file.path)).toEqual([targets[3]?.path, targets[5]?.path, targets[8]?.path].sort());
  }, 60_000);
});

describe("R2: a target that cannot be read keeps its place in the run", () => {
  const NAMES = Array.from({ length: 12 }, (_, index) => `docs/f${String(index).padStart(2, "0")}.md`);

  function small(): string {
    const dir = tempDir("mtl-large-run-r2-");
    put(dir, "md-template-lint.yml", ["pairs:", "  - name: notes", "    template: note.template.md", "    include: docs/*.md", ""].join("\n"));
    put(dir, "note.template.md", OTHER_TEMPLATE);
    for (const name of NAMES) put(dir, name, "---\ntitle: T\n---\n");
    return dir;
  }

  /** Replace the file by a directory (f05) or remove it (f07) at the moment it is read, after the walk. */
  function vanish(dir: string, policy: (n: number) => number) {
    return async (path: string): Promise<void> => {
      if (!path.includes("/docs/f")) return;
      const sum = [...path].reduce((total, char) => total + char.charCodeAt(0), 0);
      await turns(policy(sum));
      const file = join(dir, "docs", path.slice(path.lastIndexOf("/") + 1));
      if (path.endsWith("/docs/f05.md")) {
        rmSync(file);
        mkdirSync(file);
      } else if (path.endsWith("/docs/f07.md")) rmSync(file);
    };
  }

  it.each([
    ["in order", () => 0],
    ["with earlier reads finishing last", (n: number) => 9 - (n % 10)],
  ])(
    "%s: the unreadable files stay in their slot, with their message",
    async (_name, policy) => {
      const dir = small();
      hook.before = vanish(dir, policy);
      let result: RunResult;
      try {
        result = await run(dir);
      } finally {
        hook.before = null;
      }
      const files = fileRows(result);
      expect(files.map((file) => file.path)).toEqual(NAMES);
      expect(files.map((file) => file.status)).toEqual(NAMES.map((_, index) => (index === 5 || index === 7 ? "fail" : "pass")));
      expect(files[5]?.errors).toHaveLength(1);
      expect(files[5]?.errors[0]?.[0]).toBe("MTL004");
      expect(files[5]?.errors[0]?.[1]).toMatch(/^Parse error: cannot read file \(E[A-Z]+\)$/);
      expect(files[7]?.errors).toEqual([["MTL004", "Parse error: cannot read file (ENOENT)", null]]);
      expect(result.summary).toMatchObject({ files: 12, passed: 10, failed: 2, exitCode: 1 });
    },
    60_000,
  );
});
