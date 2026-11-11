/** MTL308 elements-semver-mismatch (src/rules/format.ts, docs/spec.md 2.9, 4.1, 4.3, 4.4 DIR5). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTemplate, lintTarget } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { anchorLineOf, createEnv } from "../../../src/engine/rule.js";
import { describeTemplate } from "../../../src/runner/schema.js";

const registry = createRegistry();
const CODE = "MTL308";
const DIR = "tests/fixtures/pairs/MTL308";
/** The other codes of the format family: none may fire in any case (tag isolation). */
const OTHER_FORMAT_CODES = ["MTL301", "MTL302", "MTL303", "MTL304", "MTL305", "MTL306", "MTL307"];

/** Spec 4.3 message of MTL308; `pylist` is the Python list of the bad items. */
const message = (key: string, pylist: string): string => `Field '${key}': list contains entries not matching [format:elements:semver]: ${pylist}`;

interface Finding {
  readonly message: string;
  /** Target key line (DIR5 anchor). */
  readonly line: number;
}

interface TestCase {
  readonly name: string;
  /** Expected MTL308 findings, in order. */
  readonly expected: readonly Finding[];
  /** Findings removed by the target directives (default 0). */
  readonly suppressed?: number;
  /** Codes of the type category expected besides MTL308, in order (default none). */
  readonly typeCodes?: readonly string[];
}

/**
 * Case -> fixture dir (same name) -> expected result. At least 1 passing case and
 * 1 failing case. Silent branches live in the pass fixtures.
 */
const CASES: readonly TestCase[] = [
  // Silent in one run: a list of SEMVERs (pre-release, build, zeros); a scalar and a
  // mapping under `[format:elements:semver]` (not a list, skipped); `[format:elements:date]`
  // written first (the first elements shape tag wins, spec 2.9); `[format:semver]` only
  // (the scalar kind); an untagged field; and the spec 4.1 step 3 gate (bare key, empty
  // list, missing key). The mapping on the `string` field `meta` is the type rule's (MTL501).
  { name: "pass-valid-versions-or-skipped-values", expected: [], typeCodes: ["MTL501"] },
  // DIR5: `disable-line` on the key line and `disable-next-line` before it.
  { name: "pass-suppressed-by-disable-directives", expected: [], suppressed: 2 },
  // Spec 2.9 worked example 1, line 4.
  {
    name: "fail-one-bad-item",
    expected: [{ message: message("supported", "['1.1.x']"), line: 2 }],
  },
  // One finding per field, every bad item in list order.
  {
    name: "fail-several-bad-items-in-order",
    expected: [
      {
        message: message("supported", "['1.1.x', '01.2.0', '1.2', '1.0.0-01', '1.0.0+']"),
        line: 2,
      },
    ],
  },
  // No `v` prefix (spec 2.9).
  { name: "fail-v-prefix", expected: [{ message: message("supported", "['v1.2.0']"), line: 2 }] },
  // Exact text, no trimming (AS16).
  {
    name: "fail-quoted-padded-item",
    expected: [{ message: message("supported", "[' 1.2.0 ']"), line: 2 }],
  },
  // Items tested as their text (as MTL303): a nested list is listed.
  {
    name: "fail-nested-list-item-listed-as-python-text",
    expected: [{ message: message("supported", `["['1.0.0']"]`), line: 2 }],
  },
  // `[format:elements:semver] [format:elements:date]`: semver is first, so it runs.
  {
    name: "fail-first-elements-tag-wins",
    expected: [{ message: message("supported", "['1.x']"), line: 2 }],
  },
  // Template order, each finding anchored on its own target key line.
  {
    name: "fail-two-fields-in-template-order",
    expected: [
      { message: message("supported", "['latest']"), line: 3 },
      { message: message("tested", "['next']"), line: 2 },
    ],
  },
  // Spec 2.9: a mapping item is tested as its Python text and listed as that text (Q02:
  // the text holds `'` and no `"`, so its repr uses double quotes).
  {
    name: "fail-mapping-item-listed-as-python-text",
    expected: [{ message: message("supported", `["{'a': '1.0.0'}"]`), line: 2 }],
  },
  // Every bad item is listed, a duplicate twice, the empty string as ''.
  {
    name: "fail-duplicate-and-empty-items",
    expected: [{ message: message("supported", "['x', 'x', '']"), line: 2 }],
  },
  // Spec 1.2 (failsafe): unquoted `1.0` and `2` load as the strings '1.0' and '2', so they
  // are listed as text; `1.2.3` and `1.0.0` are SEMVERs and stay out.
  {
    name: "fail-unquoted-numbers-are-text",
    expected: [{ message: message("supported", "['1.0', '2']"), line: 2 }],
  },
  // Q02 repr: an item with `'` is double quoted, an item with `"` stays single quoted.
  {
    name: "fail-items-with-quotes",
    expected: [{ message: message("supported", `["it's", 'x"y']`), line: 2 }],
  },
  // Spec 2.9 exact text: a trailing space and a trailing newline (escaped by repr) are bad.
  {
    name: "fail-trailing-space-and-newline-items",
    expected: [{ message: message("supported", "['1.0.0 ', '1.0.0\\n']"), line: 2 }],
  },
];

const read = (path: string): string => readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

async function templateOf(fixture: string) {
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
  return status.model;
}

/** Diagnostics of this code, of the other format codes, the type codes and the suppressed count. */
async function lint(testCase: TestCase) {
  const fixture = `${DIR}/${testCase.name}`;
  const result = await lintTarget(registry, await templateOf(fixture), read(`${fixture}/target.md`), `${fixture}/target.md`, createEnv());
  return {
    own: result.diagnostics.filter((diagnostic) => diagnostic.code === CODE),
    others: result.diagnostics.filter((diagnostic) => OTHER_FORMAT_CODES.includes(diagnostic.code)),
    types: result.diagnostics.filter((diagnostic) => diagnostic.code.startsWith("MTL5")).map((diagnostic) => diagnostic.code),
    suppressed: result.suppressed,
  };
}

describe("MTL308 elements-semver-mismatch", { tags: ["MTL308", "format"] }, () => {
  it("is registered in category format, error, field step shape", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "elements-semver-mismatch",
      category: "format",
      severity: "error",
      phase: "field",
      step: "shape",
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
      const { own, others, types, suppressed } = await lint(testCase);
      expect(
        own.map((diagnostic) => ({
          message: diagnostic.message,
          line: anchorLineOf(diagnostic),
        })),
      ).toEqual(testCase.expected);
      for (const diagnostic of own) {
        expect(diagnostic.severity).toBe("error");
        expect(diagnostic.position).toBeNull();
      }
      expect(others).toEqual([]);
      expect(types).toEqual(testCase.typeCodes ?? []);
      expect(suppressed).toBe(testCase.suppressed ?? 0);
    });
  }

  it("--verify lists the token format:elements:semver after the scalar shape (spec 8.3)", async () => {
    const model = await templateOf(`${DIR}/pass-valid-versions-or-skipped-values`);
    const rules = new Map(describeTemplate(model).fields.map((field) => [field.name, field.rules]));
    expect(rules.get("supported")).toEqual(["presence:required", "format:elements:semver"]);
    // `[format:elements:date]` written first wins the elements shape kind: no semver token.
    expect(rules.get("date_first")).not.toContain("format:elements:semver");
    expect(rules.get("scalar_only")).toEqual(["presence:required", "format:semver"]);
    const ordered = await checkTemplate(registry, '---\nv: ["1"] # [count:min:1] [format:elements:semver] [format:semver] [format:elements:snake_case]\n---\n');
    if (ordered.status !== "ok") throw new Error("template is broken");
    expect(describeTemplate(ordered.model).fields[0]?.rules).toEqual(["presence:required", "format:elements:snake_case", "format:semver", "format:elements:semver", "count:min:1"]);
  });
});
