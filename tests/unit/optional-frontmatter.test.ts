/**
 * Optional target frontmatter (ADR 0015, template tag `[frontmatter:optional]`): each
 * template/target pair of `tests/fixtures/optional-frontmatter/<case>/` runs through
 * `checkTemplate` and `lintTarget` with the real registry and an in-memory env. A case
 * asserts a clean template, the exact ordered list of target diagnostics `{code, message, line}`
 * (empty for `pass-`) and the suppressed count.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTemplate, lintTarget } from "../../src/engine/pipeline.js";
import { createRegistry } from "../../src/engine/registry.js";
import { createEnv, createMemoryIo } from "../../src/engine/rule.js";
import type { Diagnostic } from "../../src/engine/model.js";

const registry = createRegistry();
const DIR = "tests/fixtures/optional-frontmatter";
const env = createEnv({ io: createMemoryIo([]) });

interface Expected {
  readonly code: string;
  readonly message: string;
  readonly line: number | undefined;
}

interface Case {
  readonly name: string;
  readonly targetPath: string;
  readonly diagnostics: readonly Expected[];
  readonly suppressed?: number;
}

/** Case -> file name given to the engine, the exact target diagnostics and the suppressed count (default 0). */
const MISSING_FRONTMATTER: Expected = { code: "MTL001", message: "File must have YAML frontmatter (---...---)", line: undefined };
const missingHeading = (name: string): Expected => ({ code: "MTL601", message: `Heading: Missing required heading: '${name}'`, line: undefined });

const CASES: readonly Case[] = [
  { name: "pass-target-without-frontmatter", targetPath: "guide.md", diagnostics: [] },
  { name: "pass-target-with-frontmatter", targetPath: "guide.md", diagnostics: [] },
  {
    name: "fail-target-with-frontmatter-missing-required-field",
    targetPath: "guide.md",
    diagnostics: [{ code: "MTL201", message: "Field 'title': required but empty or missing", line: undefined }],
  },
  {
    name: "fail-target-with-invalid-frontmatter-value",
    targetPath: "guide.md",
    diagnostics: [{ code: "MTL508", message: "Field 'rating' (type=int): value is not a valid integer", line: undefined }],
  },
  { name: "fail-target-without-frontmatter-heading-missing", targetPath: "guide.md", diagnostics: [missingHeading("Context")] },
  {
    name: "fail-target-without-frontmatter-content-rule",
    targetPath: "guide.md",
    diagnostics: [{ code: "MTL701", message: "Section 'Overview': [content:non-empty] section body is empty", line: undefined }],
  },
  // The file-wide directive suppresses the MTL601 of the missing `Context`.
  { name: "pass-body-directive-without-frontmatter", targetPath: "guide.md", diagnostics: [], suppressed: 1 },
  // The engine takes the file name as an argument, so the case controls it here.
  {
    name: "fail-target-without-frontmatter-filename-case",
    targetPath: "Not_Kebab_Case.md",
    diagnostics: [{ code: "MTL101", message: "Filename 'Not_Kebab_Case' does not match required case [filename:case:PascalCase]", line: undefined }],
  },
  { name: "fail-unclosed-frontmatter", targetPath: "guide.md", diagnostics: [MISSING_FRONTMATTER] },
  {
    name: "fail-invalid-yaml-frontmatter",
    targetPath: "guide.md",
    // `{detail}` is the `yaml` package message (spec 4.3, MTL002).
    diagnostics: [
      {
        code: "MTL002",
        message: "YAML parse error: Flow sequence in block collection must be sufficiently indented and end with a ] at line 2, column 1:\n\ntitle: [Release, notes\n\n^\n",
        line: undefined,
      },
    ],
  },
  { name: "fail-untagged-template-target-without-frontmatter", targetPath: "guide.md", diagnostics: [MISSING_FRONTMATTER] },
  // One MTL601 per required heading, in template order.
  { name: "fail-empty-target", targetPath: "guide.md", diagnostics: [missingHeading("Summary"), missingHeading("Details")] },
  {
    name: "fail-frontmatter-not-a-mapping",
    targetPath: "guide.md",
    diagnostics: [{ code: "MTL003", message: "YAML frontmatter must be a mapping of 'key: value' pairs", line: undefined }],
  },
  // `[value:filename]` is a field rule: no MTL102 without a frontmatter block.
  { name: "pass-target-without-frontmatter-value-filename", targetPath: "guide.md", diagnostics: [] },
  // Tags in a target are inert; the pair is checked against its tag-free variant below.
  { name: "pass-target-carries-optional-tag", targetPath: "guide.md", diagnostics: [] },
  {
    name: "fail-body-directive-unknown-code-without-frontmatter",
    targetPath: "guide.md",
    diagnostics: [{ code: "MTL021", message: "Directive on line 1: unknown rule code 'MTL999'", line: 1 }],
  },
];

const read = (path: string): string => readFileSync(fileURLToPath(new URL(`../../${path}`, import.meta.url)), "utf8");

const shape = (list: readonly Diagnostic[]): Expected[] => list.map(({ code, message, position }) => ({ code, message, line: position?.line }));

/** Every directory and file under DIR, at any depth, as sorted `/`-separated relative paths. */
function listTree(): { dirs: string[]; files: string[] } {
  const root = fileURLToPath(new URL(`../../${DIR}`, import.meta.url));
  const dirs: string[] = [];
  const files: string[] = [];
  for (const entry of readdirSync(root, { recursive: true, withFileTypes: true })) {
    const path = relative(root, join(entry.parentPath, entry.name)).replaceAll("\\", "/");
    (entry.isDirectory() ? dirs : files).push(path);
  }
  return { dirs: dirs.sort(), files: files.sort() };
}

/** Lints `targetText` against the template of the case fixture. */
async function lintPair(fixture: string, targetText: string, targetPath: string) {
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
  expect(status.warnings.map((diagnostic) => diagnostic.code)).toEqual([]);
  return lintTarget(registry, status.model, targetText, targetPath, env);
}

describe("optional frontmatter: [frontmatter:optional] template/target pairs", () => {
  it("has pass- and fail- cases, one fixture dir each, no orphan", () => {
    const passing = CASES.filter((testCase) => testCase.name.startsWith("pass-"));
    const failing = CASES.filter((testCase) => testCase.name.startsWith("fail-"));
    expect(passing.length + failing.length).toBe(CASES.length);
    expect(CASES.filter((testCase) => testCase.diagnostics.length === 0)).toEqual(passing);
    const names = CASES.map((testCase) => testCase.name).sort();
    const tree = listTree();
    expect(tree.dirs).toEqual(names);
    expect(tree.files).toEqual(names.flatMap((name) => [`${name}/target.md`, `${name}/template.md`]).sort());
  });

  for (const testCase of CASES) {
    it(`${testCase.name}: ${DIR}/${testCase.name}`, async () => {
      const fixture = `${DIR}/${testCase.name}`;
      const result = await lintPair(fixture, read(`${fixture}/target.md`), testCase.targetPath);
      expect(shape(result.diagnostics)).toEqual(testCase.diagnostics);
      expect(result.suppressed).toBe(testCase.suppressed ?? 0);
    });
  }

  it("pass-target-carries-optional-tag: the tag in a target is inert (same list as without it, no MTL031/MTL013)", async () => {
    const fixture = `${DIR}/pass-target-carries-optional-tag`;
    const withTag = read(`${fixture}/target.md`);
    const withoutTag = withTag.replace("# [frontmatter:optional]\n", "").replace(" [frontmatter:optional]", "");
    expect(withoutTag).not.toContain("[frontmatter:optional]");
    const found = shape((await lintPair(fixture, withTag, "guide.md")).diagnostics);
    expect(found).toEqual(shape((await lintPair(fixture, withoutTag, "guide.md")).diagnostics));
    expect(found.map((diagnostic) => diagnostic.code)).not.toContain("MTL031");
    expect(found.map((diagnostic) => diagnostic.code)).not.toContain("MTL013");
  });
});
