/** MTL404 range-max (src/rules/bounds.ts, docs/spec.md 2.3, 4.1 step 3, 4.3). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL404";
const DIR = "tests/fixtures/pairs/MTL404";

/** Spec 4.3 message of MTL404: raw target text, parsed bound in Python repr style. */
const message = (key: string, value: string, max: string): string => `Field '${key}': value ${value} is above range:max ${max}`;

interface TestCase {
  readonly name: string;
  /** Expected MTL404 messages, in order. */
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
  // Silent in one run (all fields string-typed, so there is no type guard):
  // n == bound (int, negative, float `2.50` vs `2.5`), below the bound, a
  // padded value, `+99` and `1e9` (not `-?digits(.digits)?`), a BOM-prefixed
  // text (Python `strip` keeps U+FEFF, so it is not a number), a word, a
  // mapping, a list (MTL406 territory), a blank value and a missing key (spec
  // 4.1 step 3 gate), a field with only a min tag, an untagged field.
  {
    name: "pass-values-at-or-below-maximum-and-other-values-stay-silent",
    expected: [],
    warnings: [],
  },
  // Boundary n == bound + 1.
  {
    name: "fail-integer-one-above-maximum",
    expected: [message("age", "6", "5")],
    warnings: [],
  },
  {
    name: "fail-negative-value-above-negative-maximum",
    expected: [message("offset", "-2", "-3")],
    warnings: [],
  },
  {
    name: "fail-float-just-above-float-maximum",
    expected: [message("ratio", "2.51", "2.5")],
    warnings: [],
  },
  // The bound is printed as Python prints the parsed number (spec 4.3 notes).
  {
    name: "fail-bounds-print-as-python-parsed-numbers",
    expected: [
      message("leading_zeros", "99", "7"),
      message("trailing_zero_float", "99", "2.5"),
      message("whole_float", "99", "2.0"),
      message("negative_zero_int", "1", "0"),
      message("negative_zero_float", "1", "-0.0"),
      message("small_fixed_float", "1", "0.0001"),
      message("small_exponent_float", "1", "1e-05"),
      message("large_fixed_float", "99999999999999999999", "1234567890123456.0"),
      message("large_exponent_float", "99999999999999999999", "1.5e+16"),
      message("huge_integer", "99999999999999999999", "12345678901234567890"),
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
      message("negative_float", "99999999999999999999", "-2.5"),
      message("negative_small_exponent", "99999999999999999999", "-1e-05"),
      message("negative_whole_float", "99999999999999999999", "-100.0"),
      message("whole_hundred", "99999999999999999999", "100.0"),
      message("whole_fifteen_hundred", "99999999999999999999", "1500.0"),
      message("fraction_half", "99999999999999999999", "0.5"),
      message("fraction_small", "99999999999999999999", "0.05"),
      message("fraction_mixed", "99999999999999999999", "123.456"),
      message("whole_ten_quadrillion", "99999999999999999999", "1e+16"),
    ],
    warnings: [],
  },
  // `{value}` is the raw target text, not the parsed number or the stripped
  // text; every Python-space padding (NEL, U+001F, NBSP, tab and newline,
  // U+3000) is stripped for the comparison only.
  {
    name: "fail-value-prints-raw-target-text",
    expected: [
      message("padded", " 30 ", "5"),
      message("leading_zero", "030", "5"),
      message("trailing_zero_float", "7.50", "5"),
      message("next_line_padded", "\u008530", "5"),
      message("unit_separator_padded", "\u001f30", "5"),
      message("no_break_space_padded", "\u00a030\u00a0", "5"),
      message("tab_newline_padded", "\t30\n", "5"),
      message("ideographic_space_padded", "\u300030", "5"),
    ],
    warnings: [],
  },
  // NO type guard: string, int, float and date typed template fields are all checked.
  {
    name: "fail-no-type-guard-checks-any-field-type",
    expected: [message("string_typed", "10", "5"), message("int_typed", "20", "5"), message("float_typed", "30.5", "5"), message("date_typed", "40", "5")],
    // Spec 2.9: `date_typed` is a date field without [format:date].
    warnings: ["MTL016"],
  },
  // Legacy takes the leftmost tag: [max:1] wins over a later [max:9] and
  // [max:9] wins over a later [max:1].
  {
    name: "fail-first-maximum-tag-wins",
    expected: [message("strict_first", "3", "1")],
    warnings: [],
  },
  // Silent branch: a malformed N (word, exponent, plus, trailing or leading dot) is MTL012 only.
  {
    name: "fail-malformed-maximum-warns-and-stays-silent",
    expected: [message("real", "10", "5")],
    warnings: ["MTL012", "MTL012", "MTL012", "MTL012", "MTL012"],
  },
  // Errors follow the template key order (not the target order); a field with
  // both bounds reports only the violated maximum.
  {
    name: "fail-multi-field-errors-follow-template-order",
    expected: [message("first", "9", "5"), message("third", "8", "5"), message("both_bounds", "9", "5")],
    warnings: [],
  },
];

const read = (path: string): string => readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** MTL404 diagnostics and template warnings for the pair of a fixture folder. */
async function lint(testCase: TestCase) {
  const fixture = `${DIR}/${testCase.name}`;
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
  const found = await checkTarget(registry, status.model, read(`${fixture}/target.md`), `${fixture}/target.md`, createEnv());
  return {
    found: found.filter((diagnostic) => diagnostic.code === CODE),
    warnings: status.warnings,
  };
}

describe("MTL404 range-max", { tags: ["MTL404", "bounds"] }, () => {
  it("is registered in category bounds, error, field step range", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "range-max",
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
