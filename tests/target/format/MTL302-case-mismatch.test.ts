/** MTL302 case-mismatch (src/rules/format.ts, docs/spec.md 2.3, 4.1, 4.3). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL302";
const DIR = "tests/fixtures/pairs/MTL302";
/** The other codes of the format family: none may fire in any case (tag isolation). */
const OTHER_FORMAT_CODES = ["MTL301", "MTL303", "MTL304", "MTL305"];

/** Spec 4.3 message of MTL302. */
const message = (key: string, value: string, style: string): string => `Field '${key}': value '${value}' does not match required format [${style}]`;

interface TestCase {
  readonly name: string;
  /** Expected MTL302 messages, in order. */
  readonly expected: readonly string[];
}

/**
 * Case -> fixture dir (same name) -> expected result. At least 1 passing case and
 * 1 failing case. Silent branches live in the pass fixture.
 */
const CASES: readonly TestCase[] = [
  // Silent in one run: matching snake and kebab values, a `|` block scalar (one
  // final newline is allowed), a list and a mapping under a case tag (skipped, and
  // no MTL303 for a list under a case tag), an untagged field, and the spec 4.1
  // step 3 gate (blank, whitespace, bare key, empty list, missing key).
  { name: "pass-values-match-or-are-not-strings", expected: [] },
  {
    name: "fail-snake-case-value-has-uppercase",
    expected: [message("code_name", "Release_Notes", "snake_case")],
  },
  {
    name: "fail-snake-case-value-uses-hyphen",
    expected: [message("code_name", "release-notes", "snake_case")],
  },
  {
    name: "fail-kebab-case-value-uses-underscore",
    expected: [message("slug", "release_notes", "kebab-case")],
  },
  {
    name: "fail-kebab-case-value-has-space",
    expected: [message("slug", "release notes", "kebab-case")],
  },
  // The value is not trimmed and is shown as written.
  {
    name: "fail-value-has-trailing-space",
    expected: [message("code_name", "release_notes ", "snake_case")],
  },
  // Legacy `re.search`: the first case tag of a field wins.
  {
    name: "fail-first-case-tag-wins",
    expected: [message("slug", "release-notes", "snake_case")],
  },
  {
    name: "fail-two-fields-in-template-order",
    expected: [message("slug", "Release Notes", "kebab-case"), message("code_name", "Release-Notes", "snake_case")],
  },
];

const read = (path: string): string => readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** Diagnostics of this code, and of the other format codes, for the pair of a fixture folder. */
async function lint(testCase: TestCase) {
  const fixture = `${DIR}/${testCase.name}`;
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
  const found = await checkTarget(registry, status.model, read(`${fixture}/target.md`), `${fixture}/target.md`, createEnv());
  return {
    own: found.filter((diagnostic) => diagnostic.code === CODE),
    others: found.filter((diagnostic) => OTHER_FORMAT_CODES.includes(diagnostic.code)),
  };
}

describe("MTL302 case-mismatch", { tags: ["MTL302", "format"] }, () => {
  it("is registered in category format, error, field step case", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "case-mismatch",
      category: "format",
      severity: "error",
      phase: "field",
      step: "case",
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
      const { own, others } = await lint(testCase);
      expect(own.map((diagnostic) => diagnostic.message)).toEqual(testCase.expected);
      for (const diagnostic of own) {
        expect(diagnostic.severity).toBe("error");
        expect(diagnostic.position).toBeNull();
      }
      expect(others).toEqual([]);
    });
  }
});
