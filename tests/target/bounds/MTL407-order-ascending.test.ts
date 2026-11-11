/** MTL407 order-ascending (src/rules/bounds.ts, docs/spec.md 2.3, 4.1 step 3, 4.3). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL407";
const DIR = "tests/fixtures/pairs/MTL407";

/** Spec 4.3 message of MTL407: both items as written (not stripped, not repr). */
const message = (key: string, prev: string, item: string): string => `Field '${key}': dates are not in ascending order ('${prev}' comes before '${item}') [order:ascending]`;

interface TestCase {
  readonly name: string;
  /** Expected MTL407 messages, in order. */
  readonly expected: readonly string[];
  /** Expected template warning codes (from the template parse). */
  readonly warnings: readonly string[];
}

/**
 * `count` times MTL016 (spec 2.9): one per template `date` or `list-of-date` field
 * without its date format tag; no fixture template here carries one.
 */
const noDateFormat = (count: number): string[] => Array<string>(count).fill("MTL016");

/**
 * Case -> fixture dir (same name) -> expected result. At least 1 passing case and
 * 1 failing case. Silent branches live in the pass fixture or in
 * `fail-` fixtures where another field of the same file still yields the
 * expected error.
 */
const CASES: readonly TestCase[] = [
  // Silent in one run: ascending ISO dates, equal dates, the ongoing marker last,
  // the marker tying with 9999-12-31 (any case and accent), slash dates, ISO
  // and slash forms of one day mixed with `YYYY` and `YYYY-MM`, a later year
  // with a smaller month and day, `YYYY` / `YYYY-MM` equal to their first day,
  // padded items (Python strip incl. NEL), padded markers (space, tab and
  // newline, accent and case) tying with each other, invalid and nested items between valid ones
  // (a BOM-prefixed date is invalid), a single item, a `[date]`-hinted list;
  // type guard: a list of strings, a scalar date, an untagged list-of-date and
  // a count-tagged list-of-date with unordered dates; a scalar and a mapping
  // on a list-of-date field; an empty list, a blank value and a missing key
  // (spec 4.1 step 3 gate).
  {
    name: "pass-dates-ascending-and-other-values-stay-silent",
    expected: [],
    // 22 fields: 21 list-of-date (incl. the `[date]` hint), the scalar date; not `string_list`.
    warnings: noDateFormat(22),
  },
  {
    name: "fail-one-decreasing-pair",
    expected: [message("dates", "2026-03-01", "2026-01-01")],
    warnings: noDateFormat(1),
  },
  // The marker sorts after every date: a date after it is a violation.
  {
    name: "fail-marker-followed-by-date",
    expected: [message("career", "present", "2026-06-01")],
    warnings: noDateFormat(1),
  },
  // The year dominates the month and day: 2025-12-31 -> 2026-01-01 passes (pass
  // fixture), 2026-01-01 -> 2025-12-31 fails, in ISO and slash form. Partial
  // dates keep their floor: 2026-02 (= 02-01) before 2026-01-31, 2026 (= 01-01)
  // after 2026-01-31, 2025-12 (= 12-01) after 2026.
  {
    name: "fail-earlier-year-dominates-larger-month-and-day",
    expected: [
      message("iso_years", "2026-01-01", "2025-12-31"),
      message("slash_years", "01/01/2026", "31/12/2025"),
      message("partial_dates", "2026-02", "2026-01-31"),
      message("partial_dates", "2026-01-31", "2026"),
      message("partial_dates", "2026", "2025-12"),
    ],
    warnings: noDateFormat(3),
  },
  // A padded marker is stripped before the marker test: it still sorts last and
  // is shown as written.
  {
    name: "fail-padded-marker-sorts-after-dates",
    expected: [message("career", " present ", "2026-06-01")],
    warnings: noDateFormat(1),
  },
  // Marker == 9999-12-31 (legacy key): equal is fine, 9999-12-30 after it is
  // not; `PRÉSENT` and `présent` tie, a date after them is a violation, a
  // marker after a date is not.
  {
    name: "fail-marker-ties-with-max-date-and-sorts-after-others",
    expected: [message("case_variants", "présent", "2026-02-01"), message("max_date_after_marker", "9999-12-31", "9999-12-30")],
    warnings: noDateFormat(2),
  },
  // One error per decreasing adjacent pair; after a violation the previous
  // date moves on (03-01 then 04-01 is fine), so there are exactly two errors.
  {
    name: "fail-each-decreasing-pair-reported-in-list-order",
    expected: [message("dates", "2026-05-01", "2026-03-01"), message("dates", "2026-04-01", "2026-02-01")],
    warnings: noDateFormat(1),
  },
  // The pair forms between neighbouring VALID items: a word, an impossible day,
  // 31/02, a non-leap 02-29, a blank, a nested list, a mapping and a BOM-prefixed
  // date are all skipped.
  {
    name: "fail-invalid-items-skipped-pair-forms-between-valid-items",
    expected: [message("dates", "2026-05-01", "2026-02-01")],
    warnings: noDateFormat(1),
  },
  // Slash and ISO forms compare by calendar date: 15/02/2026 == 2026-02-15 is
  // fine, `YYYY-MM` sorts as the 1st and `YYYY` as January 1st.
  {
    name: "fail-slash-and-iso-forms-compare-by-calendar-date",
    expected: [message("dates", "01/03/2026", "2026-02-15"), message("dates", "15/02/2026", "2026-02"), message("dates", "2026-02", "2026")],
    warnings: noDateFormat(1),
  },
  // Items are shown as written (padding and NEL kept); the BOM item is invalid
  // (Python `strip` keeps U+FEFF) and skipped.
  {
    name: "fail-items-shown-as-written-after-python-strip",
    expected: [message("dates", " 2026-03-01 ", "\u00852026-01-01")],
    warnings: noDateFormat(1),
  },
  // A `[date]` hint promotes a list to list-of-date: the type is the declared
  // one, not only the inferred one.
  {
    name: "fail-hint-promoted-list-of-date-is-checked",
    expected: [message("hinted", "2026-03-01", "2026-01-01")],
    warnings: noDateFormat(1),
  },
  // The tag has no argument: a repeated tag reports once.
  {
    name: "fail-repeated-order-tag-reports-once",
    expected: [message("dates", "2026-03-01", "2026-01-01")],
    warnings: noDateFormat(1),
  },
  // Errors follow the template key order (not the target order), pairs in list order.
  {
    name: "fail-multi-field-errors-follow-template-order",
    expected: [message("first", "2026-03-01", "2026-01-01"), message("second", "2026-02-01", "2026-01-15"), message("second", "2026-01-15", "2026-01-01")],
    warnings: noDateFormat(3),
  },
];

const read = (path: string): string => readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** MTL407 diagnostics and template warnings for the pair of a fixture folder. */
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

describe("MTL407 order-ascending", { tags: ["MTL407", "bounds"] }, () => {
  it("is registered in category bounds, error, field step order", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "order-ascending",
      category: "bounds",
      severity: "error",
      phase: "field",
      step: "order",
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
