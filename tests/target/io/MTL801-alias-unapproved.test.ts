/** MTL801 alias-unapproved (src/rules/io.ts, docs/spec.md 2.8, 4.3). */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv, createMemoryIo } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL801";
const DIR = "tests/fixtures/pairs/MTL801";

/** Config alias `assets` exists; its files are never needed by this code. */
const env = createEnv({
  aliases: new Map([["assets", "assets-root"]]),
  io: createMemoryIo(["assets-root/logo.png", "assets-root/c.png"]),
});

/** Case -> fixture -> expected result: at least 1 passing case and 1 failing case. */
const CASES = [
  {
    name: "pass-approved-alias-or-no-check",
    fixture: "tests/fixtures/pairs/MTL801/pass-approved-alias-or-no-check",
    expected: [],
  },
  {
    name: "fail-alias-without-config-entry",
    fixture: "tests/fixtures/pairs/MTL801/fail-alias-without-config-entry",
    expected: ["Field 'logo': alias '@gone/...' has no entry in config aliases, not checked"],
  },
  {
    name: "fail-list-two-unknown-aliases-in-item-order",
    fixture: "tests/fixtures/pairs/MTL801/fail-list-two-unknown-aliases-in-item-order",
    expected: [
      "Field 'images': alias '@one/...' has no entry in config aliases, not checked",
      "Field 'images': alias '@two/...' has no entry in config aliases, not checked",
    ],
  },
  {
    name: "fail-alias-name-case-differs-from-config",
    fixture: "tests/fixtures/pairs/MTL801/fail-alias-name-case-differs-from-config",
    expected: ["Field 'logo': alias '@Assets/...' has no entry in config aliases, not checked"],
  },
  {
    name: "fail-alias-name-uses-dash-underscore-digit",
    fixture: "tests/fixtures/pairs/MTL801/fail-alias-name-uses-dash-underscore-digit",
    expected: ["Field 'logo': alias '@my-lib_2/...' has no entry in config aliases, not checked"],
  },
  {
    name: "fail-two-fields-in-template-order",
    fixture: "tests/fixtures/pairs/MTL801/fail-two-fields-in-template-order",
    expected: [
      "Field 'logo': alias '@first/...' has no entry in config aliases, not checked",
      "Field 'banner': alias '@second/...' has no entry in config aliases, not checked",
    ],
  },
] as const;

const read = (path: string): string =>
  readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** Diagnostics of this code for the pair of a fixture folder. */
async function lint(fixture: string) {
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
  const found = await checkTarget(
    registry,
    status.model,
    read(`${fixture}/target.md`),
    `${fixture}/target.md`,
    env,
  );
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

describe("MTL801 alias-unapproved", () => {
  it("is registered in category io, warning, field step io", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "alias-unapproved",
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
    expect(CASES.map((testCase) => testCase.fixture)).toEqual(
      CASES.map((testCase) => `${DIR}/${testCase.name}`),
    );
    // Orphan detection: no directory at any depth besides the cases, and each holds only the pair.
    const names = CASES.map((testCase) => testCase.name).sort();
    const tree = listTree();
    expect(tree.dirs).toEqual(names);
    expect(tree.files).toEqual(
      names.flatMap((name) => [`${name}/target.md`, `${name}/template.md`]).sort(),
    );
  });

  for (const testCase of CASES) {
    it(`${testCase.name}: ${testCase.fixture}`, async () => {
      const found = await lint(testCase.fixture);
      expect(found.map((diagnostic) => diagnostic.message)).toEqual(testCase.expected);
      for (const diagnostic of found) expect(diagnostic.severity).toBe("warning");
    });
  }
});
