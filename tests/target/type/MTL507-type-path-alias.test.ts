/** MTL507 type-path-alias (src/rules/type.ts, docs/spec.md 3.4, 4.1, 4.3). */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL507";
const DETAIL = "value is not a valid path alias (expected @<name>/<rest>)";
const DIR = "tests/fixtures/pairs/MTL507";

/** `Field '<key>' (type=path-alias): <detail>` for each key, in the given order. */
const invalid = (...keys: string[]): string[] => keys.map((key) => `Field '${key}' (type=path-alias): ${DETAIL}`);

/** Case -> fixture -> expected result: at least 1 passing case and 1 failing case. */
const CASES = [
  {
    name: "pass-valid-aliases-and-type-guard-and-empty-gates",
    fixture: `${DIR}/pass-valid-aliases-and-type-guard-and-empty-gates`,
    expected: [],
  },
  {
    name: "fail-missing-at-sign",
    fixture: `${DIR}/fail-missing-at-sign`,
    expected: invalid("no_at_sign", "absolute_path", "leading_text"),
  },
  {
    name: "fail-missing-slash-or-empty-rest",
    fixture: `${DIR}/fail-missing-slash-or-empty-rest`,
    expected: invalid("name_only", "empty_rest", "spaces_only_rest", "backslash_separator"),
  },
  {
    name: "fail-empty-or-doubled-name",
    fixture: `${DIR}/fail-empty-or-doubled-name`,
    expected: invalid("empty_name", "doubled_at_sign"),
  },
  {
    name: "fail-name-charset",
    fixture: `${DIR}/fail-name-charset`,
    expected: invalid("dot_in_name", "space_in_name", "dollar_in_name", "accent_in_name", "at_sign_in_name", "hash_in_name", "plus_in_name"),
  },
  {
    name: "fail-whitespace-in-rest",
    fixture: `${DIR}/fail-whitespace-in-rest`,
    expected: invalid("space_in_rest", "tab_in_rest", "non_breaking_space_in_rest"),
  },
  {
    name: "fail-list-in-alias-field",
    fixture: `${DIR}/fail-list-in-alias-field`,
    expected: ["Field 'logo' (type=path-alias): expected a scalar, got a list"],
  },
  {
    name: "fail-mapping-in-alias-field",
    fixture: `${DIR}/fail-mapping-in-alias-field`,
    expected: ["Field 'logo' (type=path-alias): expected a scalar, got a mapping"],
  },
  {
    name: "fail-two-fields-in-template-order",
    fixture: `${DIR}/fail-two-fields-in-template-order`,
    expected: ["Field 'first' (type=path-alias): expected a scalar, got a list", `Field 'second' (type=path-alias): ${DETAIL}`],
  },
  {
    name: "fail-type-inferred-from-template-alias-value",
    fixture: `${DIR}/fail-type-inferred-from-template-alias-value`,
    expected: invalid("logo"),
  },
  {
    name: "fail-type-from-template-value-path-alias",
    fixture: `${DIR}/fail-type-from-template-value-path-alias`,
    expected: invalid("logo"),
  },
  {
    name: "fail-type-from-bracket-hint-in-comment",
    fixture: `${DIR}/fail-type-from-bracket-hint-in-comment`,
    expected: invalid("logo"),
  },
  {
    name: "fail-type-from-alias-marker-in-comment",
    fixture: `${DIR}/fail-type-from-alias-marker-in-comment`,
    expected: invalid("logo"),
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

describe("MTL507 type-path-alias", () => {
  it("is registered in category type, error, field step type", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "type-path-alias",
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
