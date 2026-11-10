/** MTL405 range-min-item (src/rules/bounds.ts, docs/spec.md 2.3, 4.1 step 3, 4.3). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL405";
const DIR = "tests/fixtures/pairs/MTL405";

/** Spec 4.3 message of MTL405: Python list of the items as written, parsed bound. */
const message = (key: string, items: string, min: string): string =>
  `Field '${key}': item(s) ${items} are below range:min ${min}`;

interface TestCase {
  readonly name: string;
  /** Expected MTL405 messages, in order. */
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
  // Silent in one run: items == bound or above (padded and `5.0` included),
  // items that are not `-?digits(.digits)?` (word, `+1`, `1e-3`, blank, a
  // BOM-prefixed text, nested list and mapping items), a scalar and a mapping
  // value (MTL403 territory), an empty list, a blank value and a missing key
  // (spec 4.1 step 3 gate), a field with only a max tag, an untagged field.
  {
    name: "pass-list-items-at-or-above-minimum-and-other-values-stay-silent",
    expected: [],
    warnings: [],
  },
  // Mixed list: only numeric items below the bound are named, in list order.
  {
    name: "fail-items-below-minimum-skip-non-numeric-items",
    expected: [message("scores", "['1', '3', '4']", "5")],
    warnings: [],
  },
  // Items are listed as written (padding, sign, leading and trailing zeros kept).
  {
    name: "fail-items-listed-as-written",
    expected: [
      message(
        "scores",
        "[' 2 ', '-0.5', '03', '4.00', '\\x853', '\\x1f3', '\\xa03\\xa0', '\\t3\\n', '\\u30003']",
        "5",
      ),
    ],
    warnings: [],
  },
  // Float items just outside a float bound: 2.49 and 2.4999 are named, 2.5 and 2.51 are not.
  {
    name: "fail-float-item-just-below-float-minimum",
    expected: [message("ratios", "['2.49', '2.4999']", "2.5")],
    warnings: [],
  },
  // One error per field, boundary item -3 == bound is not named.
  {
    name: "fail-negative-items-below-negative-minimum",
    expected: [message("offsets", "['-4', '-3.5']", "-3")],
    warnings: [],
  },
  // The bound is printed as Python prints the parsed number (spec 4.3 notes).
  {
    name: "fail-bounds-print-as-python-parsed-numbers",
    expected: [
      message("leading_zeros", "['1']", "7"),
      message("trailing_zero_float", "['1']", "2.5"),
      message("whole_float", "['1']", "2.0"),
      message("negative_zero_int", "['-1']", "0"),
      message("negative_zero_float", "['-1']", "-0.0"),
      message("small_fixed_float", "['-1']", "0.0001"),
      message("small_exponent_float", "['-1']", "1e-05"),
      message("large_fixed_float", "['1']", "1234567890123456.0"),
      message("large_exponent_float", "['1']", "1.5e+16"),
      message("huge_integer", "['1']", "12345678901234567890"),
    ],
    warnings: [],
  },
  // Negative bounds keep their sign (`-2.5`, `-1e-05`, `-100.0`); whole floats
  // are zero padded (`100.0`, `1500.0`); a fraction below 1 keeps its leading
  // zeros (`0.5`, `0.05`); digits split around the point (`123.456`); 1e16 is
  // the first whole float in exponent form.
  {
    name: "fail-bounds-print-signs-zero-padding-and-fractions",
    expected: [
      message("negative_float", "['-1000']", "-2.5"),
      message("negative_small_exponent", "['-1000']", "-1e-05"),
      message("negative_whole_float", "['-1000']", "-100.0"),
      message("whole_hundred", "['-1000']", "100.0"),
      message("whole_fifteen_hundred", "['-1000']", "1500.0"),
      message("fraction_half", "['-1000']", "0.5"),
      message("fraction_small", "['-1000']", "0.05"),
      message("fraction_mixed", "['-1000']", "123.456"),
      message("whole_ten_quadrillion", "['-1000']", "1e+16"),
    ],
    warnings: [],
  },
  // NO type guard: any list is checked, whatever the template field type.
  {
    name: "fail-no-type-guard-checks-any-list",
    expected: [
      message("int_list", "['1', '2']", "5"),
      message("string_list", "['3']", "5"),
      message("date_list", "['4']", "5"),
      message("string_typed_scalar_field", "['2']", "5"),
    ],
    warnings: [],
  },
  // Legacy takes the leftmost tag: [min:5] wins over a later [min:1] and
  // [min:1] wins over a later [min:5].
  {
    name: "fail-first-minimum-tag-wins",
    expected: [message("strict_first", "['3']", "5")],
    warnings: [],
  },
  // Silent branch: a malformed N (word, exponent, plus, trailing or leading dot) is MTL012 only.
  {
    name: "fail-malformed-minimum-warns-and-stays-silent",
    expected: [message("real", "['1']", "5")],
    warnings: ["MTL012", "MTL012", "MTL012", "MTL012", "MTL012"],
  },
  // Errors follow the template key order (not the target order); a field with
  // both bounds reports only the violated minimum.
  {
    name: "fail-multi-field-errors-follow-template-order",
    expected: [
      message("first", "['1']", "5"),
      message("third", "['2', '3']", "5"),
      message("both_bounds", "['1']", "5"),
    ],
    warnings: [],
  },
];

const read = (path: string): string =>
  readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** MTL405 diagnostics and template warnings for the pair of a fixture folder. */
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

describe("MTL405 range-min-item", () => {
  it("is registered in category bounds, error, field step range", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "range-min-item",
      category: "bounds",
      severity: "error",
      phase: "field",
      step: "range",
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
