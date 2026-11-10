/** MTL505 type-url (src/rules/type.ts, docs/spec.md 3.4 "Url predicate", 4.1, 4.3). */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL505";
const DIR = "tests/fixtures/pairs/MTL505";
const DETAIL = "value is not syntactically a valid URL (expected scheme://host/...)";

/** `Field '<key>' (type=url): <detail>` for each key, in the given order. */
const invalid = (...keys: string[]): string[] =>
  keys.map((key) => `Field '${key}' (type=url): ${DETAIL}`);

/** Case -> fixture -> expected result: exactly 1 passing case, failing cases >= passing. */
const CASES = [
  {
    name: "pass-valid-urls-and-type-guard-and-empty-gates",
    fixture: "tests/fixtures/pairs/MTL505/pass-valid-urls-and-type-guard-and-empty-gates",
    expected: [],
  },
  {
    name: "fail-missing-scheme",
    fixture: "tests/fixtures/pairs/MTL505/fail-missing-scheme",
    expected: invalid("no_scheme", "bare_host"),
  },
  {
    name: "fail-missing-host",
    fixture: "tests/fixtures/pairs/MTL505/fail-missing-host",
    expected: invalid("empty_authority", "triple_slash", "query_only", "fragment_only"),
  },
  {
    name: "fail-spaces-inside",
    fixture: "tests/fixtures/pairs/MTL505/fail-spaces-inside",
    expected: invalid(
      "space_in_host",
      "space_in_path",
      "non_breaking_space_in_host",
      "tab_in_host",
      "tab_in_path",
    ),
  },
  {
    name: "fail-forbidden-characters-in-authority",
    fixture: "tests/fixtures/pairs/MTL505/fail-forbidden-characters-in-authority",
    expected: invalid(
      "opening_angle_bracket",
      "closing_angle_bracket",
      "opening_brace",
      "closing_brace",
      "pipe",
      "backslash",
      "caret",
      "double_quote",
    ),
  },
  {
    name: "fail-malformed-separator-scheme-and-bracket",
    fixture: "tests/fixtures/pairs/MTL505/fail-malformed-separator-scheme-and-bracket",
    expected: invalid(
      "single_slash",
      "mailto_without_slashes",
      "scheme_starts_with_digit",
      "unbalanced_opening_bracket",
      "unbalanced_closing_bracket",
    ),
  },
  {
    name: "fail-padded-invalid-value-still-invalid",
    fixture: "tests/fixtures/pairs/MTL505/fail-padded-invalid-value-still-invalid",
    expected: invalid("site"),
  },
  {
    name: "fail-disallowed-scheme-not-reported-beside-invalid-url",
    fixture: "tests/fixtures/pairs/MTL505/fail-disallowed-scheme-not-reported-beside-invalid-url",
    expected: invalid("broken"),
  },
  {
    name: "fail-list-in-url-field",
    fixture: "tests/fixtures/pairs/MTL505/fail-list-in-url-field",
    expected: ["Field 'site' (type=url): expected a scalar, got a list"],
  },
  {
    name: "fail-mapping-in-url-field",
    fixture: "tests/fixtures/pairs/MTL505/fail-mapping-in-url-field",
    expected: ["Field 'site' (type=url): expected a scalar, got a mapping"],
  },
  {
    name: "fail-two-fields-in-template-order",
    fixture: "tests/fixtures/pairs/MTL505/fail-two-fields-in-template-order",
    expected: [
      "Field 'first' (type=url): expected a scalar, got a list",
      `Field 'second' (type=url): ${DETAIL}`,
    ],
  },
  {
    name: "fail-type-inferred-from-template-url-value",
    fixture: "tests/fixtures/pairs/MTL505/fail-type-inferred-from-template-url-value",
    expected: invalid("home"),
  },
  {
    name: "fail-type-from-template-value-url",
    fixture: "tests/fixtures/pairs/MTL505/fail-type-from-template-value-url",
    expected: invalid("home"),
  },
  {
    name: "fail-type-from-url-word-in-comment",
    fixture: "tests/fixtures/pairs/MTL505/fail-type-from-url-word-in-comment",
    expected: invalid("home"),
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

describe("MTL505 type-url", () => {
  it("is registered in category type, error, field step type", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "type-url",
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
