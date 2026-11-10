/** MTL803 absolute-skipped (src/rules/io.ts, docs/spec.md 2.8, 4.3). */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv, createMemoryIo } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL803";
const DIR = "tests/fixtures/pairs/MTL803";

/** Approved: folder `/srv/notes`, a UNC share, a drive folder; never probed outside them. */
const env = createEnv({
  approvedPaths: ["/srv/notes", "\\\\server\\share", "D:\\data"],
  io: createMemoryIo(["/srv/notes/a.md"]),
});

/** Case -> fixture -> expected result: at least 1 passing case and 1 failing case. */
const CASES = [
  {
    name: "pass-absolute-inside-approved-path-or-no-check",
    fixture: "tests/fixtures/pairs/MTL803/pass-absolute-inside-approved-path-or-no-check",
    expected: [],
  },
  {
    name: "fail-posix-absolute-outside-approved-paths",
    fixture: "tests/fixtures/pairs/MTL803/fail-posix-absolute-outside-approved-paths",
    expected: ["Field 'note': absolute path '/etc/hosts' skipped by [io:exists] (not checked); add it under approvedPaths in the config"],
  },
  {
    name: "fail-windows-drive-letter-path",
    fixture: "tests/fixtures/pairs/MTL803/fail-windows-drive-letter-path",
    expected: ["Field 'note': absolute path 'C:\\data\\a.md' skipped by [io:exists] (not checked); add it under approvedPaths in the config"],
  },
  {
    name: "fail-leading-backslash-path",
    fixture: "tests/fixtures/pairs/MTL803/fail-leading-backslash-path",
    expected: ["Field 'note': absolute path '\\share\\a.md' skipped by [io:exists] (not checked); add it under approvedPaths in the config"],
  },
  {
    name: "fail-sibling-folder-of-approved-path-is-outside",
    fixture: "tests/fixtures/pairs/MTL803/fail-sibling-folder-of-approved-path-is-outside",
    expected: ["Field 'note': absolute path '/srv/notes-old/a.md' skipped by [io:exists] (not checked); add it under approvedPaths in the config"],
  },
  {
    name: "fail-dot-dot-escapes-approved-path",
    fixture: "tests/fixtures/pairs/MTL803/fail-dot-dot-escapes-approved-path",
    expected: ["Field 'note': absolute path '/srv/notes/../private/a.md' skipped by [io:exists] (not checked); add it under approvedPaths in the config"],
  },
  {
    name: "fail-unc-path-outside-approved-share",
    fixture: "tests/fixtures/pairs/MTL803/fail-unc-path-outside-approved-share",
    expected: ["Field 'note': absolute path '\\\\server\\share-old\\a.md' skipped by [io:exists] (not checked); add it under approvedPaths in the config"],
  },
  {
    name: "fail-single-slash-lookalike-of-approved-unc-share-is-outside",
    fixture: "tests/fixtures/pairs/MTL803/fail-single-slash-lookalike-of-approved-unc-share-is-outside",
    expected: ["Field 'note': absolute path '/server/share/a.md' skipped by [io:exists] (not checked); add it under approvedPaths in the config"],
  },
  {
    name: "fail-drive-letter-copy-of-approved-posix-folder-is-outside",
    fixture: "tests/fixtures/pairs/MTL803/fail-drive-letter-copy-of-approved-posix-folder-is-outside",
    expected: ["Field 'note': absolute path 'C:\\srv\\notes\\a.md' skipped by [io:exists] (not checked); add it under approvedPaths in the config"],
  },
  {
    name: "fail-posix-copy-of-approved-drive-folder-is-outside",
    fixture: "tests/fixtures/pairs/MTL803/fail-posix-copy-of-approved-drive-folder-is-outside",
    expected: ["Field 'note': absolute path '/data/a.md' skipped by [io:exists] (not checked); add it under approvedPaths in the config"],
  },
  {
    name: "fail-dot-dot-above-root-stays-outside",
    fixture: "tests/fixtures/pairs/MTL803/fail-dot-dot-above-root-stays-outside",
    expected: ["Field 'note': absolute path '/../../etc/x.md' skipped by [io:exists] (not checked); add it under approvedPaths in the config"],
  },
  {
    name: "fail-list-two-absolute-items-in-item-order",
    fixture: "tests/fixtures/pairs/MTL803/fail-list-two-absolute-items-in-item-order",
    expected: [
      "Field 'others': absolute path '/etc/a.md' skipped by [io:exists] (not checked); add it under approvedPaths in the config",
      "Field 'others': absolute path '/var/b.md' skipped by [io:exists] (not checked); add it under approvedPaths in the config",
    ],
  },
] as const;

const read = (path: string): string => readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** Diagnostics of this code for the pair of a fixture folder. */
async function lint(fixture: string) {
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
  const found = await checkTarget(registry, status.model, read(`${fixture}/target.md`), `${fixture}/target.md`, env);
  return found.filter((diagnostic) => diagnostic.code === CODE);
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

describe("MTL803 absolute-skipped", () => {
  it("is registered in category io, warning, field step io", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "absolute-skipped",
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
      const found = await lint(testCase.fixture);
      expect(found.map((diagnostic) => diagnostic.message)).toEqual(testCase.expected);
      for (const diagnostic of found) expect(diagnostic.severity).toBe("warning");
    });
  }
});
