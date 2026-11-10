/** MTL102 value-filename (src/rules/filename.ts, docs/spec.md 2.3, 4.1, 4.3). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL102";
const DIR = "tests/fixtures/pairs/MTL102";

/** Spec 4.3 message of MTL102. */
const message = (key: string, stem: string, got: string): string => `Field '${key}': expected value to equal filename '${stem}' ([value:filename]), got '${got}'`;

interface TestCase {
  readonly name: string;
  /**
   * File name the engine sees as the target path (default `target.md`). The
   * content always comes from the fixture's `target.md`; the engine never reads
   * the target path, it only derives the stem from it.
   */
  readonly targetName?: string;
  readonly expected: readonly string[];
}

/** Case -> fixture dir (same name) -> expected result: at least 1 passing case and 1 failing case. */
const CASES: readonly TestCase[] = [
  // Pass fixture, one run, three controls: the tagged `id` and `slug` (next to
  // other tags) equal the stem; the untagged `title` differs and is not checked;
  // `empty_id` (empty) and `missing_id` (key absent) are tagged but skipped by
  // the spec 4.1 step 3 gate (value-filename runs only for a non-empty value).
  { name: "pass-value-equals-file-stem", expected: [] },
  {
    name: "fail-value-differs-from-file-stem",
    expected: [message("id", "target", "other-name")],
  },
  {
    name: "fail-value-differs-by-letter-case",
    expected: [message("id", "target", "Target")],
  },
  {
    name: "fail-value-includes-file-extension",
    expected: [message("id", "target", "target.md")],
  },
  {
    name: "fail-value-has-trailing-space",
    expected: [message("id", "target", "target ")],
  },
  {
    name: "fail-value-differs-next-to-other-tags",
    expected: [message("slug", "target", "other-name")],
  },
  // A list never matches, even when its Python text equals the stem (Q02).
  {
    name: "fail-single-item-list-never-matches",
    expected: [message("id", "target", "['target']")],
  },
  {
    name: "fail-list-value-never-matches",
    expected: [message("id", "target", `['target', "it's final"]`)],
  },
  {
    name: "fail-mapping-value-never-matches",
    expected: [message("id", "target", "{'name': 'target'}")],
  },
  // Stem of the target name, as Python `Path.stem` (last extension only).
  {
    name: "fail-leading-dot-name-keeps-dot-in-stem",
    targetName: ".hidden.md",
    expected: [message("id", ".hidden", "hidden")],
  },
  {
    name: "fail-extension-only-name-is-whole-stem",
    targetName: ".md",
    expected: [message("id", ".md", "md")],
  },
  // `a..md`: the stem is `a.`, found by cutting at the LAST dot (the inner-dot
  // branch). The separate trailing-dot branch is the next case.
  {
    name: "fail-double-dot-name-keeps-trailing-dot-in-stem",
    targetName: "a..md",
    expected: [message("id", "a.", "a")],
  },
  // `a.`: a trailing dot is not an extension separator, the whole name is the stem.
  {
    name: "fail-trailing-dot-name-is-whole-stem",
    targetName: "a.",
    expected: [message("id", "a.", "a")],
  },
  {
    name: "fail-multi-dot-name-strips-last-extension-only",
    targetName: "a.b.md",
    expected: [message("id", "a.b", "a")],
  },
  // Spec 4.3 says "file name stem": a backslash separates segments on every
  // platform here. Python `PurePosixPath.stem` would keep the whole text on
  // POSIX; on Windows (the legacy platform) it gives `target`, as the port.
  {
    name: "fail-backslash-path-uses-last-segment-as-stem",
    targetName: "nested\\target.md",
    expected: [message("id", "target", "other-name")],
  },
];

const read = (path: string): string => readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** Diagnostics of this code for the pair of a fixture folder. */
async function lint(testCase: TestCase) {
  const fixture = `${DIR}/${testCase.name}`;
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
  const found = await checkTarget(registry, status.model, read(`${fixture}/target.md`), `${fixture}/${testCase.targetName ?? "target.md"}`, createEnv());
  return found.filter((diagnostic) => diagnostic.code === CODE);
}

describe("MTL102 value-filename", () => {
  it("is registered in category filename, error, field step value-filename", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "value-filename",
      category: "filename",
      severity: "error",
      phase: "field",
      step: "value-filename",
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

  // The pipeline never gives the rule a null value (step `value-filename` runs
  // only for a present, non-empty value, spec 4.1 step 3), but the type allows
  // it: the guard returns nothing instead of failing.
  it("returns no diagnostic when called with no value", async () => {
    const rule = registry.byCode.get(CODE);
    if (rule === undefined || rule.phase !== "field") throw new Error("MTL102 is a field rule");
    const fixture = `${DIR}/pass-value-equals-file-stem`;
    const status = await checkTemplate(registry, read(`${fixture}/template.md`));
    if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
    const templateField = status.model.fields.get("id");
    if (templateField === undefined) throw new Error(`${fixture}: field id is missing`);
    const found = await rule.check({
      phase: "field",
      key: "id",
      templateField,
      value: null,
      template: status.model,
      target: status.model,
      targetPath: `${fixture}/target.md`,
      env: createEnv(),
    });
    expect(found).toEqual([]);
  });

  for (const testCase of CASES) {
    it(`${testCase.name}: ${DIR}/${testCase.name}`, async () => {
      const found = await lint(testCase);
      expect(found.map((diagnostic) => diagnostic.message)).toEqual(testCase.expected);
      for (const diagnostic of found) {
        expect(diagnostic.severity).toBe("error");
        // Field rules report no source position (same as MTL301 to MTL305).
        expect(diagnostic.position).toBeNull();
      }
    });
  }
});
