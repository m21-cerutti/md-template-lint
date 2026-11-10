/** MTL401 count-min (src/rules/bounds.ts, docs/spec.md 2.3, 4.1 step 3, 4.3). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL401";
const DIR = "tests/fixtures/pairs/MTL401";

/** Spec 4.3 message of MTL401. */
const message = (key: string, n: number, min: number): string =>
  `Field '${key}': list has ${n} item(s), minimum is ${min}`;

interface TestCase {
  readonly name: string;
  /** Expected MTL401 messages, in order. */
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
  // Silent in one run: n == bound and n == bound + 1, N = 0, a string, a
  // number-like scalar and a mapping value (no-op on a non-list), an empty
  // list, a blank value and a missing key (spec 4.1 step 3 gate), a field with
  // only a max tag, an untagged field.
  {
    name: "pass-lengths-meet-minimum-and-other-values-stay-silent",
    expected: [],
    warnings: [],
  },
  // Boundary n == bound - 1.
  {
    name: "fail-two-items-below-minimum-of-three",
    expected: [message("tags", 2, 3)],
    warnings: [],
  },
  // A block sequence is a list too; singular item(s) text is fixed.
  {
    name: "fail-block-sequence-single-item-below-minimum",
    expected: [message("tags", 1, 2)],
    warnings: [],
  },
  // Legacy takes the leftmost tag: [min:3] wins over a later [min:1] and
  // [min:1] wins over a later [min:3].
  {
    name: "fail-first-minimum-tag-wins",
    expected: [message("strict_first", 2, 3)],
    warnings: [],
  },
  // Silent branch: a malformed N (word, negative, float) is MTL012 only.
  {
    name: "fail-malformed-minimum-warns-and-stays-silent",
    expected: [message("real", 1, 2)],
    warnings: ["MTL012", "MTL012", "MTL012"],
  },
  // The bound is printed as the parsed integer (`007` -> 7).
  {
    name: "fail-leading-zero-bound-prints-parsed-integer",
    expected: [message("ids", 2, 7)],
    warnings: [],
  },
  // Items are counted whatever they hold: two blank strings are 2 items.
  {
    name: "fail-blank-string-items-still-count",
    expected: [message("names", 2, 3)],
    warnings: [],
  },
  // Errors follow the template key order (not the target order); a field with
  // both bounds reports only the violated minimum.
  {
    name: "fail-multi-field-errors-follow-template-order",
    expected: [message("first", 1, 2), message("third", 3, 4), message("both_bounds", 1, 3)],
    warnings: [],
  },
];

const read = (path: string): string =>
  readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** MTL401 diagnostics and template warnings for the pair of a fixture folder. */
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

describe("MTL401 count-min", () => {
  it("is registered in category bounds, error, field step count", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "count-min",
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
