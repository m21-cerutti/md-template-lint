/** MTL510 type-bool (src/rules/type.ts, docs/spec.md 3.4, 4.1, 4.3). */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL510";
const DIR = "tests/fixtures/pairs/MTL510";

/** Case -> fixture -> expected result: at least 1 passing case and 1 failing case. */
const CASES = [
  {
    name: "pass-true-false-any-case-and-padding",
    fixture: "tests/fixtures/pairs/MTL510/pass-true-false-any-case-and-padding",
    expected: [],
  },
  {
    name: "fail-yes-is-not-a-bool",
    fixture: "tests/fixtures/pairs/MTL510/fail-yes-is-not-a-bool",
    expected: ["Field 'draft' (type=bool): value is not 'true' or 'false'"],
  },
  {
    name: "fail-near-misses-truex-spaced-and-zero",
    fixture: "tests/fixtures/pairs/MTL510/fail-near-misses-truex-spaced-and-zero",
    expected: ["Field 'suffixed' (type=bool): value is not 'true' or 'false'", "Field 'spaced' (type=bool): value is not 'true' or 'false'", "Field 'zero' (type=bool): value is not 'true' or 'false'"],
  },
  {
    name: "fail-number-is-not-a-bool",
    fixture: "tests/fixtures/pairs/MTL510/fail-number-is-not-a-bool",
    expected: ["Field 'draft' (type=bool): value is not 'true' or 'false'"],
  },
  {
    name: "fail-list-in-bool-field",
    fixture: "tests/fixtures/pairs/MTL510/fail-list-in-bool-field",
    expected: ["Field 'draft' (type=bool): expected a scalar, got a list"],
  },
  {
    name: "fail-mapping-in-bool-field",
    fixture: "tests/fixtures/pairs/MTL510/fail-mapping-in-bool-field",
    expected: ["Field 'draft' (type=bool): expected a scalar, got a mapping"],
  },
  {
    name: "fail-type-from-template-value-bool",
    fixture: "tests/fixtures/pairs/MTL510/fail-type-from-template-value-bool",
    expected: ["Field 'draft' (type=bool): value is not 'true' or 'false'"],
  },
] as const;

const read = (path: string): string => readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** Diagnostics of this code for the pair of a fixture folder. */
async function lint(fixture: string) {
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
  const found = await checkTarget(registry, status.model, read(`${fixture}/target.md`), `${fixture}/target.md`, createEnv());
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

describe("MTL510 type-bool", () => {
  it("is registered in category type, error, field step type", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "type-bool",
      category: "type",
      severity: "error",
      phase: "field",
      step: "type",
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
      for (const diagnostic of found) expect(diagnostic.severity).toBe("error");
    });
  }
});
