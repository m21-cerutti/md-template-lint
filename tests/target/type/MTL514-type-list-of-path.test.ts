/** MTL514 type-list-of-path (src/rules/type.ts, docs/spec.md 3.4, 4.1 step 3, 4.3). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL514";
const DIR = "tests/fixtures/pairs/MTL514";

/** Spec 4.3 messages of MTL514: `Field '<key>' (type=list-of-path): <detail>`. */
const shape = (key: string, got: string): string => `Field '${key}' (type=list-of-path): expected a YAML list of paths, got ${got}`;
const entries = (key: string, items: string): string => `Field '${key}' (type=list-of-path): list contains non-path entries: ${items}`;

interface TestCase {
  readonly name: string;
  /** Expected MTL514 messages, in order. */
  readonly expected: readonly string[];
}

/**
 * Case -> fixture dir (same name) -> expected result. At least 1 passing case and
 * 1 failing case.
 */
const CASES: readonly TestCase[] = [
  // Silent: anchored paths (relative, parent, absolute, home, drive letter,
  // backslashes), extension-anchored paths of 1 and 5 characters, a field
  // typed by its values alone, a block list of one item; other-type fields (a
  // string, a url, a scalar path, a mapping, a list of non-paths typed `list`)
  // pin the type guard; blank, whitespace-only, empty list and missing key are
  // skipped by the step 3 gate.
  {
    name: "pass-path-items-type-guard-and-empty-gates",
    expected: [],
  },
  // Not a list: a scalar and a comma separated scalar.
  {
    name: "fail-scalar-and-comma-separated-scalar-are-not-lists",
    expected: [shape("single_path", "a scalar"), shape("comma_separated_paths", "a scalar")],
  },
  {
    name: "fail-mapping-in-list-of-path-field",
    expected: [shape("paths", "a mapping")],
  },
  // Valid items are not named; the offenders keep their order.
  {
    name: "fail-mixed-valid-and-invalid-items-name-only-offenders-in-order",
    expected: [entries("paths", "['readme', 'n/a']")],
  },
  // No anchor and no extension; extension of 6 characters, empty extension,
  // extension followed by a slash; the 5 character extension is valid.
  {
    name: "fail-unanchored-and-extension-boundaries",
    expected: [entries("paths", "['n/a', 'QA/Test', 'and/or', 'dir/sub/', 'docs/file.abcdef', 'docs/file.', 'docs/readme.md/']")],
  },
  // Each forbidden character, a second colon, a space, a lone slash, a UNC prefix.
  {
    name: "fail-forbidden-characters-colon-whitespace-and-bare-separators",
    expected: [entries("paths", `['./a<b/c.md', './a>b/c.md', './a"b/c.md', './a|b/c.md', './a?b/c.md', './a*b/c.md', ` + "'./a:b/c.md', 'C:/a:b/c.md', './a b/c.md', '/', '//server/share/a.md']")],
  },
  // Items are not trimmed (legacy `is_path_like(value)`).
  {
    name: "fail-padded-items-are-not-trimmed",
    expected: [entries("paths", "[' ./docs/readme.md', './docs/readme.md ', '  ./docs/readme.md  ']")],
  },
  // A URL is never a path.
  {
    name: "fail-url-items-are-not-paths",
    expected: [entries("paths", "['https://example.com/docs/readme.md', 'ftp://host/dir/']")],
  },
  // Blank items are invalid and printed untrimmed; a null item is ''.
  {
    name: "fail-blank-and-whitespace-items",
    expected: [entries("paths", "['', '   ', '']")],
  },
  // A nested list or mapping item prints as its Python str, then repr-quoted.
  {
    name: "fail-nested-list-and-mapping-items-print-as-python-text",
    expected: [entries("paths", `["['./b.md']", "{'p': './c.md'}"]`)],
  },
  // Errors follow the template key order, not the target order.
  {
    name: "fail-two-fields-in-template-order",
    expected: [shape("first", "a scalar"), entries("second", "['nowhere']")],
  },
  // Type from a template list of path-like values, and from the word `path`
  // in the comment with a list value (promotion to list-of-path).
  {
    name: "fail-type-inferred-from-template-path-list",
    expected: [entries("paths", "['readme']")],
  },
  {
    name: "fail-type-from-path-word-with-list-value",
    expected: [entries("paths", "['bare']")],
  },
];

const read = (path: string): string => readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** MTL514 diagnostics for the pair of a fixture folder. */
async function lint(testCase: TestCase) {
  const fixture = `${DIR}/${testCase.name}`;
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
  const found = await checkTarget(registry, status.model, read(`${fixture}/target.md`), `${fixture}/target.md`, createEnv());
  return found.filter((diagnostic) => diagnostic.code === CODE);
}

describe("MTL514 type-list-of-path", { tags: ["MTL514", "type"] }, () => {
  it("is registered in category type, error, field step type", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "type-list-of-path",
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
    const dirs = readdirSync(fileURLToPath(new URL(`../../../${DIR}`, import.meta.url))).sort();
    expect(dirs).toEqual(CASES.map((testCase) => testCase.name).sort());
  });

  for (const testCase of CASES) {
    it(`${testCase.name}: ${DIR}/${testCase.name}`, async () => {
      const found = await lint(testCase);
      expect(found.map((diagnostic) => diagnostic.message)).toEqual(testCase.expected);
      for (const diagnostic of found) {
        expect(diagnostic.code).toBe(CODE);
        expect(diagnostic.severity).toBe("error");
        expect(diagnostic.position).toBeNull();
      }
    });
  }
});
