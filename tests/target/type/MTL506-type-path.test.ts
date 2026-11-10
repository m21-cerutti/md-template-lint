/** MTL506 type-path (src/rules/type.ts, docs/spec.md 3.4 "Path predicate", 4.1, 4.3). */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL506";
const DETAIL = "value does not look like a valid path";
const DIR = "tests/fixtures/pairs/MTL506";

/** `Field '<key>' (type=path): <detail>` for each key, in the given order. */
const invalid = (...keys: string[]): string[] => keys.map((key) => `Field '${key}' (type=path): ${DETAIL}`);

/** Case -> fixture -> expected result: at least 1 passing case and 1 failing case. */
const CASES = [
  {
    name: "pass-valid-paths-and-type-guard-and-empty-gates",
    fixture: `${DIR}/pass-valid-paths-and-type-guard-and-empty-gates`,
    expected: [],
  },
  {
    name: "fail-no-separator",
    fixture: `${DIR}/fail-no-separator`,
    expected: invalid("bare_file", "bare_word", "dotted_name", "drive_without_separator"),
  },
  {
    name: "fail-unanchored-without-extension",
    fixture: `${DIR}/fail-unanchored-without-extension`,
    expected: invalid("not_applicable", "qa_slash_test", "and_slash_or", "unanchored_directory", "extension_before_trailing_slash"),
  },
  {
    name: "fail-extension-longer-than-five-or-empty",
    fixture: `${DIR}/fail-extension-longer-than-five-or-empty`,
    expected: invalid("six_letter_extension", "long_extension", "dot_without_extension"),
  },
  {
    name: "fail-whitespace-inside",
    fixture: `${DIR}/fail-whitespace-inside`,
    expected: invalid("space_in_file_name", "space_in_directory", "tab_in_directory", "non_breaking_space_in_directory"),
  },
  {
    name: "fail-padded-value-is-not-trimmed",
    fixture: `${DIR}/fail-padded-value-is-not-trimmed`,
    expected: invalid("leading_space", "trailing_space", "both_spaces"),
  },
  {
    name: "fail-forbidden-characters",
    fixture: `${DIR}/fail-forbidden-characters`,
    expected: invalid("less_than", "greater_than", "double_quote", "pipe", "question_mark", "asterisk", "control_character"),
  },
  {
    name: "fail-colon-outside-drive-prefix",
    fixture: `${DIR}/fail-colon-outside-drive-prefix`,
    expected: invalid("colon_in_directory", "second_colon_after_drive", "colon_without_drive"),
  },
  {
    name: "fail-leading-separators-and-lone-slash",
    fixture: `${DIR}/fail-leading-separators-and-lone-slash`,
    expected: invalid("lone_slash", "double_leading_slash", "unc_backslashes"),
  },
  {
    name: "fail-url-is-not-a-path",
    fixture: `${DIR}/fail-url-is-not-a-path`,
    expected: invalid("https_url", "ftp_url"),
  },
  {
    name: "fail-list-in-path-field",
    fixture: `${DIR}/fail-list-in-path-field`,
    expected: ["Field 'file' (type=path): expected a scalar, got a list"],
  },
  {
    name: "fail-mapping-in-path-field",
    fixture: `${DIR}/fail-mapping-in-path-field`,
    expected: ["Field 'file' (type=path): expected a scalar, got a mapping"],
  },
  {
    name: "fail-two-fields-in-template-order",
    fixture: `${DIR}/fail-two-fields-in-template-order`,
    expected: ["Field 'first' (type=path): expected a scalar, got a list", `Field 'second' (type=path): ${DETAIL}`],
  },
  {
    name: "fail-type-inferred-from-template-path-value",
    fixture: `${DIR}/fail-type-inferred-from-template-path-value`,
    expected: invalid("file"),
  },
  {
    name: "fail-type-from-template-value-path",
    fixture: `${DIR}/fail-type-from-template-value-path`,
    expected: invalid("file"),
  },
  {
    name: "fail-type-from-path-word-in-comment",
    fixture: `${DIR}/fail-type-from-path-word-in-comment`,
    expected: invalid("file"),
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

describe("MTL506 type-path", () => {
  it("is registered in category type, error, field step type", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "type-path",
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
