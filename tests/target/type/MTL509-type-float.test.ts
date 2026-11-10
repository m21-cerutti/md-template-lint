/** MTL509 type-float (src/rules/type.ts, docs/spec.md 3.4, 4.1, 4.3). */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL509";
const DIR = "tests/fixtures/pairs/MTL509";

/** Case -> fixture -> expected result: at least 1 passing case and 1 failing case. */
const CASES = [
  {
    name: "pass-float-text-forms",
    fixture: "tests/fixtures/pairs/MTL509/pass-float-text-forms",
    expected: [],
  },
  {
    name: "fail-exponent-is-not-a-float",
    fixture: "tests/fixtures/pairs/MTL509/fail-exponent-is-not-a-float",
    expected: ["Field 'ratio' (type=float): value is not a valid float"],
  },
  {
    name: "fail-sign-and-dash-forms",
    fixture: "tests/fixtures/pairs/MTL509/fail-sign-and-dash-forms",
    expected: ["Field 'plus' (type=float): value is not a valid float", "Field 'lone_minus' (type=float): value is not a valid float", "Field 'double_minus' (type=float): value is not a valid float"],
  },
  {
    name: "fail-decimal-exponent-nan-and-infinity-text",
    fixture: "tests/fixtures/pairs/MTL509/fail-decimal-exponent-nan-and-infinity-text",
    expected: ["Field 'scaled' (type=float): value is not a valid float", "Field 'not_a_number' (type=float): value is not a valid float", "Field 'infinite' (type=float): value is not a valid float"],
  },
  {
    name: "fail-comma-decimal-is-not-a-float",
    fixture: "tests/fixtures/pairs/MTL509/fail-comma-decimal-is-not-a-float",
    expected: ["Field 'ratio' (type=float): value is not a valid float"],
  },
  {
    name: "fail-leading-dot-is-not-a-float",
    fixture: "tests/fixtures/pairs/MTL509/fail-leading-dot-is-not-a-float",
    expected: ["Field 'ratio' (type=float): value is not a valid float"],
  },
  {
    name: "fail-trailing-dot-is-not-a-float",
    fixture: "tests/fixtures/pairs/MTL509/fail-trailing-dot-is-not-a-float",
    expected: ["Field 'ratio' (type=float): value is not a valid float"],
  },
  {
    name: "fail-list-in-float-field",
    fixture: "tests/fixtures/pairs/MTL509/fail-list-in-float-field",
    expected: ["Field 'ratio' (type=float): expected a scalar, got a list"],
  },
  {
    name: "fail-mapping-in-float-field",
    fixture: "tests/fixtures/pairs/MTL509/fail-mapping-in-float-field",
    expected: ["Field 'ratio' (type=float): expected a scalar, got a mapping"],
  },
  {
    name: "fail-type-from-template-value-float",
    fixture: "tests/fixtures/pairs/MTL509/fail-type-from-template-value-float",
    expected: ["Field 'ratio' (type=float): value is not a valid float"],
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

describe("MTL509 type-float", () => {
  it("is registered in category type, error, field step type", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "type-float",
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
