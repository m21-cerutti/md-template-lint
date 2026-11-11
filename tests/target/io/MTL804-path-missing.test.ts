/** MTL804 path-missing (src/rules/io.ts, docs/spec.md 2.8, 4.3). */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv, createMemoryIo, type RuleEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL804";
const DIR = "tests/fixtures/pairs/MTL804";

const approvedPaths = ["/srv/notes", "C:\\notes", "\\\\server\\share"];
const io = createMemoryIo(["project-root/docs/a.md", "project-root/docs/b.md", "/srv/notes/a.md", "//server/share/a.md"]);
/**
 * Same files plus an UNFOLDED `project-root/sub/../shared/a.md`: the probe asks
 * about the folded path (`project-root/shared/a.md`, missing), so it still fails.
 */
const unfoldedOnlyIo = createMemoryIo(["project-root/docs/a.md", "project-root/sub/../shared/a.md"]);
/** Pair root `project-root`, alias `assets`, three approved folders (one UNC share). */
const rooted = createEnv({
  pairRoot: "project-root",
  aliases: new Map([["assets", "assets-root"]]),
  approvedPaths,
  io,
});
/** Default pair root `.`, in-memory io with no file at all. */
const bare = createEnv();

/**
 * Case -> fixture -> env -> expected result: at least 1 passing case and 1
 * failing case. `codes` widens the filter for the cross-code order case.
 */
interface Case {
  readonly name: string;
  readonly fixture: string;
  readonly env: RuleEnv;
  readonly expected: readonly string[];
  readonly codes?: readonly string[];
}

const CASES: readonly Case[] = [
  {
    name: "pass-existing-paths-or-not-checked",
    fixture: "tests/fixtures/pairs/MTL804/pass-existing-paths-or-not-checked",
    env: rooted,
    expected: [],
  },
  {
    name: "fail-list-mixes-all-path-outcomes-in-item-order",
    fixture: "tests/fixtures/pairs/MTL804/fail-list-mixes-all-path-outcomes-in-item-order",
    env: rooted,
    codes: ["MTL801", "MTL802", "MTL803", "MTL804"],
    expected: [
      "Field 'others': path 'docs/missing.md' does not exist (resolved: project-root/docs/missing.md)",
      "Field 'others': alias '@gone/...' has no entry in config aliases, not checked",
      "Field 'others': aliased path '@assets/gone.png' resolved to assets-root/gone.png — does not exist",
      "Field 'others': absolute path '/etc/hosts' skipped by [io:exists] (not checked); add it under approvedPaths in the config",
      "Field 'others': path '/srv/notes/gone.md' does not exist (resolved: /srv/notes/gone.md)",
    ],
  },
  {
    name: "fail-unc-approved-share-keeps-prefix",
    fixture: "tests/fixtures/pairs/MTL804/fail-unc-approved-share-keeps-prefix",
    env: rooted,
    expected: ["Field 'note': path '\\\\server\\share\\gone.md' does not exist (resolved: //server/share/gone.md)"],
  },
  {
    name: "fail-relative-path-missing-resolved-from-pair-root",
    fixture: "tests/fixtures/pairs/MTL804/fail-relative-path-missing-resolved-from-pair-root",
    env: rooted,
    expected: ["Field 'note': path 'docs/gone.md' does not exist (resolved: project-root/docs/gone.md)"],
  },
  {
    name: "fail-default-pair-root-is-dot",
    fixture: "tests/fixtures/pairs/MTL804/fail-default-pair-root-is-dot",
    env: bare,
    expected: ["Field 'note': path 'docs/gone.md' does not exist (resolved: docs/gone.md)"],
  },
  {
    name: "fail-approved-absolute-path-missing",
    fixture: "tests/fixtures/pairs/MTL804/fail-approved-absolute-path-missing",
    env: rooted,
    expected: ["Field 'note': path '/srv/notes/gone.md' does not exist (resolved: /srv/notes/gone.md)"],
  },
  {
    name: "fail-windows-style-approved-path-printed-with-slashes",
    fixture: "tests/fixtures/pairs/MTL804/fail-windows-style-approved-path-printed-with-slashes",
    env: rooted,
    expected: ["Field 'note': path 'c:\\notes\\gone.md' does not exist (resolved: c:/notes/gone.md)"],
  },
  {
    name: "fail-triple-slash-prefix-is-single-root",
    fixture: "tests/fixtures/pairs/MTL804/fail-triple-slash-prefix-is-single-root",
    env: rooted,
    expected: ["Field 'note': path '///srv/notes/gone.md' does not exist (resolved: /srv/notes/gone.md)"],
  },
  {
    name: "fail-value-equal-to-approved-folder-is-checked",
    fixture: "tests/fixtures/pairs/MTL804/fail-value-equal-to-approved-folder-is-checked",
    env: rooted,
    expected: ["Field 'note': path '/srv/notes' does not exist (resolved: /srv/notes)"],
  },
  {
    name: "fail-empty-and-dot-segments-are-dropped-from-resolved",
    fixture: "tests/fixtures/pairs/MTL804/fail-empty-and-dot-segments-are-dropped-from-resolved",
    env: rooted,
    expected: [
      "Field 'others': path 'docs//gone.md' does not exist (resolved: project-root/docs/gone.md)",
      "Field 'others': path 'docs/' does not exist (resolved: project-root/docs)",
      "Field 'others': path './docs/gone.md' does not exist (resolved: project-root/docs/gone.md)",
    ],
  },
  {
    name: "fail-alias-lookalikes-are-plain-relative-paths",
    fixture: "tests/fixtures/pairs/MTL804/fail-alias-lookalikes-are-plain-relative-paths",
    env: rooted,
    expected: [
      "Field 'others': path '@assets' does not exist (resolved: project-root/@assets)",
      "Field 'others': path '@assets/' does not exist (resolved: project-root/@assets)",
      "Field 'others': path '@/x' does not exist (resolved: project-root/@/x)",
      "Field 'others': path '@assets\\x.png' does not exist (resolved: project-root/@assets/x.png)",
      "Field 'others': path '@my.lib/x.png' does not exist (resolved: project-root/@my.lib/x.png)",
    ],
  },
  {
    name: "fail-list-missing-items-in-order",
    fixture: "tests/fixtures/pairs/MTL804/fail-list-missing-items-in-order",
    env: rooted,
    expected: ["Field 'others': path 'docs/z.md' does not exist (resolved: project-root/docs/z.md)", "Field 'others': path 'docs/y.md' does not exist (resolved: project-root/docs/y.md)"],
  },
  {
    name: "fail-dot-dot-relative-leaves-pair-root",
    fixture: "tests/fixtures/pairs/MTL804/fail-dot-dot-relative-leaves-pair-root",
    env: createEnv({ pairRoot: "project-root/sub", io: unfoldedOnlyIo }),
    expected: ["Field 'note': path '../shared/a.md' does not exist (resolved: project-root/sub/../shared/a.md)"],
  },
  {
    name: "fail-surrounding-spaces-are-trimmed",
    fixture: "tests/fixtures/pairs/MTL804/fail-surrounding-spaces-are-trimmed",
    env: rooted,
    expected: ["Field 'note': path 'docs/gone.md' does not exist (resolved: project-root/docs/gone.md)"],
  },
];

const read = (path: string): string => readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** Diagnostics of this code for the pair of a fixture folder. */
async function lint(testCase: Case) {
  const { fixture, env } = testCase;
  const codes = testCase.codes ?? [CODE];
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
  const found = await checkTarget(registry, status.model, read(`${fixture}/target.md`), `${fixture}/target.md`, env);
  return found.filter((diagnostic) => codes.includes(diagnostic.code));
}

/** Every directory and file under DIR, at any depth, as sorted `/`-separated relative paths. */
function listTree(): { dirs: string[]; files: string[] } {
  const root = fileURLToPath(new URL(`../../../${DIR}`, import.meta.url));
  const dirs: string[] = [];
  const files: string[] = [];
  for (const entry of readdirSync(root, { recursive: true, withFileTypes: true })) {
    const path = relative(root, join(entry.parentPath, entry.name)).replaceAll("\\", "/");
    (entry.isDirectory() ? dirs : files).push(path);
  }
  return { dirs: dirs.sort(), files: files.sort() };
}

describe("MTL804 path-missing", { tags: ["MTL804", "io"] }, () => {
  it("is registered in category io, warning, field step io", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "path-missing",
      category: "io",
      severity: "warning",
      phase: "field",
      step: "io",
    });
  });

  it("has at least 1 pass- case and at least 1 fail- case, one fixture dir each", () => {
    const passing = CASES.filter((testCase) => testCase.name.startsWith("pass-"));
    const failing = CASES.filter((testCase) => testCase.name.startsWith("fail-"));
    expect(passing.length).toBeGreaterThanOrEqual(1);
    expect(failing.length).toBeGreaterThanOrEqual(1);
    expect(passing.length + failing.length).toBe(CASES.length);
    expect(CASES.filter((testCase) => testCase.expected.length === 0)).toEqual(passing);
    expect(CASES.map((testCase) => testCase.fixture)).toEqual(CASES.map((testCase) => `${DIR}/${testCase.name}`));
    // Orphan detection: no directory at any depth besides the cases, and each holds only the pair.
    const names = CASES.map((testCase) => testCase.name).sort();
    const tree = listTree();
    expect(tree.dirs).toEqual(names);
    expect(tree.files).toEqual(names.flatMap((name) => [`${name}/target.md`, `${name}/template.md`]).sort());
  });

  for (const testCase of CASES) {
    it(`${testCase.name}: ${testCase.fixture}`, async () => {
      const found = await lint(testCase);
      expect(found.map((diagnostic) => diagnostic.message)).toEqual(testCase.expected);
      for (const diagnostic of found) {
        expect(diagnostic.severity).toBe("warning");
        // No transient sort key (item index) leaks to reporters.
        expect(Object.keys(diagnostic).sort()).toEqual(["code", "message", "position", "severity"]);
      }
    });
  }
});
