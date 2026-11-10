/** MTL504 type-date (src/rules/type.ts, docs/spec.md 3.3, 3.4, 4.1, 4.3). */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL504";
const DIR = "tests/fixtures/pairs/MTL504";
const DETAIL =
  "value is not a valid calendar date in an accepted format " +
  "(YYYY-MM-DD / YYYY-MM / YYYY / DD/MM/YYYY / present / présent)";

/** `Field '<key>' (type=date): <detail>` for each key, in the given order. */
const invalid = (...keys: string[]): string[] =>
  keys.map((key) => `Field '${key}' (type=date): ${DETAIL}`);

/** Case -> fixture -> expected result: at least 1 passing case and 1 failing case. */
const CASES = [
  {
    name: "pass-valid-dates-and-type-guard-and-empty-gates",
    fixture: "tests/fixtures/pairs/MTL504/pass-valid-dates-and-type-guard-and-empty-gates",
    expected: [],
  },
  {
    name: "fail-non-leap-day-also-with-padding",
    fixture: "tests/fixtures/pairs/MTL504/fail-non-leap-day-also-with-padding",
    expected: invalid("non_leap_day", "padded_non_leap_day"),
  },
  {
    name: "fail-century-year-is-not-a-leap-year",
    fixture: "tests/fixtures/pairs/MTL504/fail-century-year-is-not-a-leap-year",
    expected: invalid("century_day"),
  },
  {
    name: "fail-month-and-day-out-of-range",
    fixture: "tests/fixtures/pairs/MTL504/fail-month-and-day-out-of-range",
    expected: invalid(
      "month_thirteen",
      "day_forty",
      "month_zero",
      "day_zero",
      "april_thirty_first",
      "both_out_of_range",
    ),
  },
  {
    name: "fail-year-month-with-month-thirteen",
    fixture: "tests/fixtures/pairs/MTL504/fail-year-month-with-month-thirteen",
    expected: invalid("period"),
  },
  {
    name: "fail-slash-form-with-impossible-day",
    fixture: "tests/fixtures/pairs/MTL504/fail-slash-form-with-impossible-day",
    expected: invalid("started"),
  },
  {
    name: "fail-year-zero-does-not-exist",
    fixture: "tests/fixtures/pairs/MTL504/fail-year-zero-does-not-exist",
    expected: invalid("bare_year_zero", "full_date_year_zero"),
  },
  {
    name: "fail-no-zero-padding",
    fixture: "tests/fixtures/pairs/MTL504/fail-no-zero-padding",
    expected: invalid("iso_unpadded", "slash_unpadded"),
  },
  {
    name: "fail-extra-text-around-a-date",
    fixture: "tests/fixtures/pairs/MTL504/fail-extra-text-around-a-date",
    expected: invalid("trailing_words", "time_suffix", "leading_words"),
  },
  {
    name: "fail-other-separators-and-orders",
    fixture: "tests/fixtures/pairs/MTL504/fail-other-separators-and-orders",
    expected: invalid("slash_year_first", "dash_day_first", "dot_separated"),
  },
  {
    name: "fail-misspelled-ongoing-marker",
    fixture: "tests/fixtures/pairs/MTL504/fail-misspelled-ongoing-marker",
    expected: invalid("ends_with_dot", "missing_letter", "extra_word", "leading_word"),
  },
  {
    name: "fail-day-above-month-length",
    fixture: "tests/fixtures/pairs/MTL504/fail-day-above-month-length",
    expected: invalid(
      "january_thirty_second",
      "june_thirty_first",
      "september_thirty_first",
      "november_thirty_first",
      "non_leap_february_twenty_ninth_slash",
    ),
  },
  {
    name: "fail-slash-and-year-width-and-extra-text",
    fixture: "tests/fixtures/pairs/MTL504/fail-slash-and-year-width-and-extra-text",
    expected: invalid(
      "slash_trailing_text",
      "slash_leading_text",
      "slash_three_digit_day",
      "slash_five_digit_year",
      "year_five_digits",
      "year_three_digits",
      "year_month_three_digit_year",
    ),
  },
  {
    name: "fail-list-in-date-field",
    fixture: "tests/fixtures/pairs/MTL504/fail-list-in-date-field",
    expected: ["Field 'started' (type=date): expected a scalar, got a list"],
  },
  {
    name: "fail-mapping-in-date-field",
    fixture: "tests/fixtures/pairs/MTL504/fail-mapping-in-date-field",
    expected: ["Field 'started' (type=date): expected a scalar, got a mapping"],
  },
  {
    name: "fail-type-inferred-from-template-date-value",
    fixture: "tests/fixtures/pairs/MTL504/fail-type-inferred-from-template-date-value",
    expected: invalid("born"),
  },
  {
    name: "fail-type-from-template-value-date",
    fixture: "tests/fixtures/pairs/MTL504/fail-type-from-template-value-date",
    expected: invalid("born"),
  },
] as const;

const read = (path: string): string =>
  readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** Diagnostics of this code for the pair of a fixture folder. */
async function lint(fixture: string) {
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
  const found = await checkTarget(
    registry,
    status.model,
    read(`${fixture}/target.md`),
    `${fixture}/target.md`,
    createEnv(),
  );
  return found.filter((diagnostic) => diagnostic.code === CODE);
}

/** Every directory and file under DIR, at any depth, as sorted `/`-separated relative paths. */
function listTree(): { dirs: string[]; files: string[] } {
  const root = fileURLToPath(new URL(`../../../${DIR}`, import.meta.url));
  const dirs: string[] = [];
  const files: string[] = [];
  for (const entry of readdirSync(root, { recursive: true, withFileTypes: true })) {
    const path = relative(root, join(entry.parentPath, entry.name)).replaceAll("\\", "/");
    (entry.isDirectory() ? dirs : files).push(path);
  }
  return { dirs: dirs.sort(), files: files.sort() };
}

describe("MTL504 type-date", () => {
  it("is registered in category type, error, field step type", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "type-date",
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
    expect(CASES.map((testCase) => testCase.fixture)).toEqual(
      CASES.map((testCase) => `${DIR}/${testCase.name}`),
    );
    // Orphan detection: no directory at any depth besides the cases, and each holds only the pair.
    const names = CASES.map((testCase) => testCase.name).sort();
    const tree = listTree();
    expect(tree.dirs).toEqual(names);
    expect(tree.files).toEqual(
      names.flatMap((name) => [`${name}/target.md`, `${name}/template.md`]).sort(),
    );
  });

  for (const testCase of CASES) {
    it(`${testCase.name}: ${testCase.fixture}`, async () => {
      const found = await lint(testCase.fixture);
      expect(found.map((diagnostic) => diagnostic.message)).toEqual(testCase.expected);
      for (const diagnostic of found) expect(diagnostic.severity).toBe("error");
    });
  }
});
