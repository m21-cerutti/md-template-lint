/** MTL306 semver-mismatch (src/rules/format.ts, docs/spec.md 2.9, 4.1, 4.3, 4.4 DIR5). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTemplate, lintTarget } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { anchorLineOf, createEnv } from "../../../src/engine/rule.js";
import { describeTemplate } from "../../../src/runner/schema.js";

const registry = createRegistry();
const CODE = "MTL306";
const DIR = "tests/fixtures/pairs/MTL306";
/** The other codes of the format family: none may fire in any case (tag isolation). */
const OTHER_FORMAT_CODES = ["MTL301", "MTL302", "MTL303", "MTL304", "MTL305"];

/** Spec 4.3 message of MTL306. */
const message = (key: string, value: string): string => `Field '${key}': value '${value}' is not a semantic version [format:semver]`;

interface Finding {
  readonly message: string;
  /** Target key line (DIR5 anchor). */
  readonly line: number;
}

interface TestCase {
  readonly name: string;
  /** Expected MTL306 findings, in order. */
  readonly expected: readonly Finding[];
  /** Findings removed by the target directives (default 0). */
  readonly suppressed?: number;
}

/**
 * Case -> fixture dir (same name) -> expected result. At least 1 passing case and
 * 1 failing case. Silent branches live in the pass fixtures.
 */
const CASES: readonly TestCase[] = [
  // Silent in one run: `1.2.0`, `1.2.0-rc.1+build.7`, `0.0.0`, hyphens and a numeric
  // `0` in the pre-release; a list and a mapping under `[format:semver]` (skipped);
  // `[format:date]` written first (the first scalar shape tag wins, spec 2.9);
  // `[format:elements:semver]` only (not the scalar kind); an untagged field; and the
  // spec 4.1 step 3 gate (blank, whitespace, bare key, empty list, missing key).
  { name: "pass-valid-versions-or-skipped-values", expected: [] },
  // DIR5: `disable-line` on the key line and `disable-next-line` before it.
  { name: "pass-suppressed-by-disable-directives", expected: [], suppressed: 2 },
  { name: "fail-v-prefix", expected: [{ message: message("version", "v1.2.0"), line: 2 }] },
  { name: "fail-two-parts-only", expected: [{ message: message("version", "1.2"), line: 2 }] },
  {
    name: "fail-leading-zero-in-major",
    expected: [{ message: message("version", "01.2.0"), line: 2 }],
  },
  {
    name: "fail-leading-zero-in-numeric-prerelease",
    expected: [{ message: message("version", "1.2.0-01"), line: 2 }],
  },
  // Exact text, no trimming (AS16): the padded value is shown as loaded.
  {
    name: "fail-quoted-value-with-padding",
    expected: [{ message: message("version", " 1.2.0 "), line: 2 }],
  },
  // ASCII digits only (C06): an Arabic-Indic digit is not a digit here.
  {
    name: "fail-non-ascii-digit",
    expected: [{ message: message("version", "1.\u0662.0"), line: 2 }],
  },
  // `[format:semver] [format:date]`: semver is the first scalar shape tag, so it runs.
  {
    name: "fail-semver-is-first-shape-tag",
    expected: [{ message: message("version", "v1.2"), line: 2 }],
  },
  // Template order, each finding anchored on its own target key line.
  {
    name: "fail-two-fields-in-template-order",
    expected: [
      { message: message("version", "2.0.0.1"), line: 4 },
      { message: message("minimum", "1.0"), line: 2 },
    ],
  },
  // Spec 2.9 `num` = "0" | [1-9][0-9]*: the minor and the patch part have no leading zero
  // either (the major is covered by fail-leading-zero-in-major).
  {
    name: "fail-leading-zero-in-minor-or-patch",
    expected: [
      { message: message("minor", "1.02.0"), line: 2 },
      { message: message("patch", "1.2.03"), line: 3 },
    ],
  },
  // Spec 2.9: `pre` and `build` are non-empty identifiers: "1.0.0-" and "1.0.0+" (empty
  // after the separator), an empty part between two dots, a trailing dot.
  {
    name: "fail-empty-identifiers",
    expected: [
      { message: message("pre_empty", "1.0.0-"), line: 2 },
      { message: message("build_empty", "1.0.0+"), line: 3 },
      { message: message("pre_empty_part", "1.0.0-rc..1"), line: 4 },
      { message: message("pre_trailing_dot", "1.0.0-rc."), line: 5 },
      { message: message("build_empty_part", "1.0.0+a..b"), line: 6 },
    ],
  },
  // Spec 2.9: "ASCII digits and letters only" also holds for the pre-release and the build.
  {
    name: "fail-non-ascii-prerelease",
    expected: [
      { message: message("pre", "1.0.0-\u00e9"), line: 2 },
      { message: message("build", "1.0.0+\u00e9"), line: 3 },
    ],
  },
  // Spec 2.9, exact text, no trimming: a block scalar `|` keeps its final newline, so the
  // value is "1.0.0\n" and the message prints it as loaded.
  {
    name: "fail-block-scalar-trailing-newline",
    expected: [{ message: message("version", "1.0.0\n"), line: 2 }],
  },
  // Spec 2.9 `pre = num | [0-9]* [A-Za-z-] [0-9A-Za-z-]*`: an alphanumeric pre-release
  // part may start with digits or zeros (`0a`, `1a`, `00a`); `0` and `-` are valid; a
  // build may start with zeros. A block scalar `|-` has no final newline, so it passes.
  { name: "pass-prerelease-identifiers-with-leading-digits", expected: [] },
];

const read = (path: string): string => readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

async function templateOf(fixture: string) {
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
  return status.model;
}

/** Diagnostics of this code, of the other format codes, and the suppressed count. */
async function lint(testCase: TestCase) {
  const fixture = `${DIR}/${testCase.name}`;
  const result = await lintTarget(registry, await templateOf(fixture), read(`${fixture}/target.md`), `${fixture}/target.md`, createEnv());
  return {
    own: result.diagnostics.filter((diagnostic) => diagnostic.code === CODE),
    others: result.diagnostics.filter((diagnostic) => OTHER_FORMAT_CODES.includes(diagnostic.code)),
    suppressed: result.suppressed,
  };
}

describe("MTL306 semver-mismatch", { tags: ["MTL306", "format"] }, () => {
  it("is registered in category format, error, field step shape", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "semver-mismatch",
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
      const { own, others, suppressed } = await lint(testCase);
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
      expect(suppressed).toBe(testCase.suppressed ?? 0);
    });
  }

  it("runs in step shape, after the type step: the type finding prints first (spec 4.1)", async () => {
    const status = await checkTemplate(registry, "---\nreleased: 2026-01-01 # [format:semver]\nversion: '1.0.0' # [format:semver]\n---\n");
    if (status.status !== "ok") throw new Error("template is broken");
    const result = await lintTarget(registry, status.model, "---\nreleased: v1\nversion: v2\n---\n", "target.md", createEnv());
    expect(result.diagnostics.map((diagnostic) => [diagnostic.code, anchorLineOf(diagnostic)])).toEqual([
      ["MTL504", 2],
      ["MTL306", 2],
      ["MTL306", 3],
    ]);
  });

  it("--verify lists the token format:semver after the case tokens (spec 8.3)", async () => {
    const model = await templateOf(`${DIR}/pass-valid-versions-or-skipped-values`);
    const rules = new Map(describeTemplate(model).fields.map((field) => [field.name, field.rules]));
    expect(rules.get("version")).toEqual(["presence:required", "format:semver"]);
    // `[format:date]` written first wins the scalar shape kind: no semver token.
    expect(rules.get("date_first")).toEqual(["presence:required", "format:date"]);
    expect(rules.get("elements_only")).not.toContain("format:semver");
    const ordered = await checkTemplate(registry, '---\nv: "1" # [count:min:1] [format:semver] [format:elements:snake_case] [format:constant:1]\n---\n');
    if (ordered.status !== "ok") throw new Error("template is broken");
    expect(describeTemplate(ordered.model).fields[0]?.rules).toEqual(["presence:required", "format:constant:1", "format:elements:snake_case", "format:semver", "count:min:1"]);
  });
});
