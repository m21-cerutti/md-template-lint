/** MTL503 type-nested-map (src/rules/type.ts, docs/spec.md 3.4, 4.1, 4.3). */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL503";
const DIR = "tests/fixtures/pairs/MTL503";

/** Case -> fixture -> expected result: exactly 1 passing case, failing cases >= passing. */
const CASES = [
  {
    name: "pass-mapping-subkeys-unchecked",
    fixture: "tests/fixtures/pairs/MTL503/pass-mapping-subkeys-unchecked",
    expected: [],
  },
  {
    name: "fail-scalar-in-nested-map-field",
    fixture: "tests/fixtures/pairs/MTL503/fail-scalar-in-nested-map-field",
    expected: ["Field 'meta' (type=nested-map): expected a mapping (nested-map), got a scalar"],
  },
  {
    name: "fail-list-in-nested-map-field",
    fixture: "tests/fixtures/pairs/MTL503/fail-list-in-nested-map-field",
    expected: ["Field 'meta' (type=nested-map): expected a mapping (nested-map), got a list"],
  },
  {
    name: "fail-template-mapping-value-infers-nested-map",
    fixture: "tests/fixtures/pairs/MTL503/fail-template-mapping-value-infers-nested-map",
    expected: ["Field 'author' (type=nested-map): expected a mapping (nested-map), got a scalar"],
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
    createEnv(),
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

describe("MTL503 type-nested-map", () => {
  it("is registered in category type, error, field step type", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "type-nested-map",
      category: "type",
      severity: "error",
      phase: "field",
      step: "type",
    });
  });

  it("has exactly 1 pass- case and at least as many fail- cases, one fixture dir each", () => {
    const passing = CASES.filter((testCase) => testCase.name.startsWith("pass-"));
    const failing = CASES.filter((testCase) => testCase.name.startsWith("fail-"));
    expect(passing).toHaveLength(1);
    expect(failing.length).toBeGreaterThanOrEqual(passing.length);
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
      for (const diagnostic of found) expect(diagnostic.severity).toBe("error");
    });
  }
});
