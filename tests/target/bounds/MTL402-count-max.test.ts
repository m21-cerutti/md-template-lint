/** MTL402 count-max (src/rules/bounds.ts, docs/spec.md 2.3, 4.1 step 3, 4.3). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL402";
const DIR = "tests/fixtures/pairs/MTL402";

/** Spec 4.3 message of MTL402. */
const message = (key: string, n: number, max: number): string =>
  `Field '${key}': list has ${n} item(s), maximum is ${max}`;

interface TestCase {
  readonly name: string;
  /** Expected MTL402 messages, in order. */
  readonly expected: readonly string[];
  /** Expected template warning codes (from the template parse). */
  readonly warnings: readonly string[];
}

/**
 * Case -> fixture dir (same name) -> expected result. At least 1 passing case and
 * 1 failing case. Silent branches live in the pass fixture or in
 * `fail-` fixtures where another field of the same file still yields the
 * expected error.
 */
const CASES: readonly TestCase[] = [
  // Silent in one run: n == bound and n < bound, N = 0 on an empty list and on
  // a blank value, a long string, a number-like scalar and a three-key mapping
  // (no-op on a non-list), a missing key (spec 4.1 step 3 gate), a field with
  // only a min tag and 5 items, an untagged field with 7 items.
  {
    name: "pass-lengths-within-maximum-and-other-values-stay-silent",
    expected: [],
    warnings: [],
  },
  // Boundary n == bound + 1.
  {
    name: "fail-three-items-above-maximum-of-two",
    expected: [message("tags", 3, 2)],
    warnings: [],
  },
  // A block sequence is a list too.
  {
    name: "fail-block-sequence-two-items-above-maximum-of-one",
    expected: [message("tags", 2, 1)],
    warnings: [],
  },
  // N = 0: every non-empty list fails (an empty one is skipped by the gate).
  {
    name: "fail-zero-maximum-reports-non-empty-list",
    expected: [message("tags", 1, 0)],
    warnings: [],
  },
  // Legacy takes the leftmost tag: [max:1] wins over a later [max:9] and
  // [max:9] wins over a later [max:1].
  {
    name: "fail-first-maximum-tag-wins",
    expected: [message("strict_first", 2, 1)],
    warnings: [],
  },
  // Silent branch: a malformed N (word, negative, float) is MTL012 only.
  {
    name: "fail-malformed-maximum-warns-and-stays-silent",
    expected: [message("real", 3, 1)],
    warnings: ["MTL012", "MTL012", "MTL012"],
  },
  // The bound is printed as the parsed integer (`007` -> 7).
  {
    name: "fail-leading-zero-bound-prints-parsed-integer",
    expected: [message("ids", 8, 7)],
    warnings: [],
  },
  // Items are counted whatever they hold: two blank strings are 2 items.
  {
    name: "fail-blank-string-items-still-count",
    expected: [message("names", 2, 1)],
    warnings: [],
  },
  // Errors follow the template key order (not the target order); a field with
  // both bounds reports only the violated maximum.
  {
    name: "fail-multi-field-errors-follow-template-order",
    expected: [message("first", 2, 1), message("third", 3, 2), message("both_bounds", 4, 2)],
    warnings: [],
  },
];

const read = (path: string): string =>
  readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** MTL402 diagnostics and template warnings for the pair of a fixture folder. */
async function lint(testCase: TestCase) {
  const fixture = `${DIR}/${testCase.name}`;
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
  const found = await checkTarget(
    registry,
    status.model,
    read(`${fixture}/target.md`),
    `${fixture}/target.md`,
    createEnv(),
  );
  return {
    found: found.filter((diagnostic) => diagnostic.code === CODE),
    warnings: status.warnings,
  };
}

describe("MTL402 count-max", () => {
  it("is registered in category bounds, error, field step count", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "count-max",
      category: "bounds",
      severity: "error",
      phase: "field",
      step: "count",
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
      const { found, warnings } = await lint(testCase);
      expect(found.map((diagnostic) => diagnostic.message)).toEqual(testCase.expected);
      for (const diagnostic of found) {
        expect(diagnostic.severity).toBe("error");
        expect(diagnostic.position).toBeNull();
      }
      expect(warnings.map((diagnostic) => diagnostic.code)).toEqual(testCase.warnings);
      for (const diagnostic of warnings) expect(diagnostic.severity).toBe("warning");
    });
  }
});
