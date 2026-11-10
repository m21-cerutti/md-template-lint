/** MTL307 date-format-mismatch (src/rules/format.ts, docs/spec.md 2.9, 4.1, 4.3, 4.4 DIR5). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTemplate, lintTarget } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { anchorLineOf, createEnv } from "../../../src/engine/rule.js";
import { describeTemplate } from "../../../src/runner/schema.js";

const registry = createRegistry();
const CODE = "MTL307";
const DIR = "tests/fixtures/pairs/MTL307";
/** The other codes of the format family: none may fire in any case (tag isolation). */
const OTHER_FORMAT_CODES = ["MTL301", "MTL302", "MTL303", "MTL304", "MTL305", "MTL306"];

/** Spec 4.3 message of MTL307. */
const message = (key: string, value: string): string => `Field '${key}': value '${value}' is not a YYYY-MM-DD date [format:date]`;

interface Finding {
  readonly message: string;
  /** Target key line (DIR5 anchor). */
  readonly line: number;
}

interface TestCase {
  readonly name: string;
  /** Expected MTL307 findings, in order. */
  readonly expected: readonly Finding[];
  /** Findings removed by the target directives (default 0). */
  readonly suppressed?: number;
  /** Codes of the type category expected besides MTL307, in order (default none). */
  readonly typeCodes?: readonly string[];
}

/**
 * Case -> fixture dir (same name) -> expected result. At least 1 passing case and
 * 1 failing case. Silent branches live in the pass fixtures.
 */
const CASES: readonly TestCase[] = [
  // Silent in one run: ISO dates on `date` and `string` fields (leap day, year 0001);
  // a list and a mapping under `[format:date]` (skipped); `[format:semver]` written
  // first (the first scalar shape tag wins, spec 2.9); `[format:elements:date]` only
  // (not the scalar kind); an untagged field; and the spec 4.1 step 3 gate (blank,
  // whitespace, bare key, empty list, missing key).
  // The mapping on the `string` field `meta` is the type rule's (MTL501).
  { name: "pass-iso-dates-or-skipped-values", expected: [], typeCodes: ["MTL501"] },
  // One problem, one error (spec 2.9): values failing the type `date` give MTL504 only.
  {
    name: "pass-calendar-invalid-on-date-field-is-mtl504-only",
    expected: [],
    typeCodes: ["MTL504", "MTL504", "MTL504", "MTL504"],
  },
  // DIR5: `disable-line` on the key line and `disable-next-line` before it.
  { name: "pass-suppressed-by-disable-directives", expected: [], suppressed: 2 },
  {
    name: "fail-year-month-on-date-field",
    expected: [{ message: message("released", "2026-10"), line: 2 }],
  },
  {
    name: "fail-ongoing-marker-on-date-field",
    expected: [{ message: message("released", "present"), line: 2 }],
  },
  {
    name: "fail-other-default-shapes-on-date-fields",
    expected: [
      { message: message("year_only", "2026"), line: 2 },
      { message: message("day_first", "31/12/2026"), line: 3 },
    ],
  },
  { name: "fail-word-on-string-field", expected: [{ message: message("due", "soon"), line: 2 }] },
  // No type rule checks a date on a `string` field: the calendar test is MTL307's.
  {
    name: "fail-calendar-invalid-on-string-field",
    expected: [
      { message: message("due", "2026-02-30"), line: 2 },
      { message: message("not_leap", "2025-02-29"), line: 3 },
      { message: message("year_zero", "0000-01-01"), line: 4 },
    ],
  },
  // Exact text, no trimming (AS16): the type `date` trims and passes, MTL307 fires.
  {
    name: "fail-quoted-padded-date-on-date-field",
    expected: [{ message: message("released", " 2026-01-01 "), line: 2 }],
  },
  // `[format:date] [format:semver]`: date is the first scalar shape tag, so it runs.
  {
    name: "fail-date-is-first-shape-tag",
    expected: [{ message: message("due", "1.2.0"), line: 2 }],
  },
  // Spec 2.9 edge case: a scalar on a `list-of-date` field gives MTL513 and MTL307.
  {
    name: "fail-scalar-on-list-of-date-field",
    expected: [{ message: message("milestones", "soon"), line: 2 }],
    typeCodes: ["MTL513"],
  },
  // Template order, each finding anchored on its own target key line.
  {
    name: "fail-two-fields-in-template-order",
    expected: [
      { message: message("released", "2026"), line: 3 },
      { message: message("due", "next week"), line: 2 },
    ],
  },
  // Spec 2.9 worked example variants: on a `string` field no type rule reports `2026-1-5`,
  // so MTL307 does (MTL504 would only exist on a `date` field); no zero padding in either part.
  {
    name: "fail-unpadded-date-on-string-field",
    expected: [
      { message: message("short", "2026-1-5"), line: 2 },
      { message: message("half", "2026-01-5"), line: 3 },
    ],
  },
  // Spec 2.9 / 3.4 calendar test on a `string` field: April has 30 days, day 00 does not
  // exist, 1900 is not a leap year.
  {
    name: "fail-calendar-limits-on-string-field",
    expected: [
      { message: message("april", "2026-04-31"), line: 2 },
      { message: message("day_zero", "2026-01-00"), line: 3 },
      { message: message("century", "1900-02-29"), line: 4 },
    ],
  },
  // Spec 2.9, exact text: a block scalar `|` ends with a newline. On a `date` field the
  // type trims and passes (no MTL504), then MTL307 fires; on a `string` field it fires too.
  {
    name: "fail-block-scalar-final-newline-on-date-field",
    expected: [
      { message: message("released", "2026-01-01\n"), line: 2 },
      { message: message("due", "2026-01-01\n"), line: 4 },
    ],
  },
  // Spec 2.9 "every other field type (string, enum, ...)": an `enum` field checks the shape
  // too. `final` is an allowed option but not a date; `2026-02` is an allowed option and a
  // real date in the wrong shape; `2026-01-01` is an ISO DATE and stays silent.
  {
    name: "fail-enum-field-with-format-date",
    expected: [
      { message: message("status", "final"), line: 2 },
      { message: message("when", "2026-02"), line: 3 },
    ],
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

describe("MTL307 date-format-mismatch", () => {
  it("is registered in category format, error, field step shape", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "date-format-mismatch",
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

  it("runs in step shape, after the type step: the type finding prints first (spec 4.1)", async () => {
    const status = await checkTemplate(registry, '---\nmilestones: ["2026-01-01"] # [format:date]\ndue: "x" # [format:date]\n---\n');
    if (status.status !== "ok") throw new Error("template is broken");
    const result = await lintTarget(registry, status.model, "---\nmilestones: soon\ndue: later\n---\n", "target.md", createEnv());
    expect(result.diagnostics.map((diagnostic) => [diagnostic.code, anchorLineOf(diagnostic)])).toEqual([
      ["MTL513", 2],
      ["MTL307", 2],
      ["MTL307", 3],
    ]);
  });

  it("--verify lists the token format:date after the case tokens (spec 8.3)", async () => {
    const model = await templateOf(`${DIR}/pass-iso-dates-or-skipped-values`);
    const rules = new Map(describeTemplate(model).fields.map((field) => [field.name, field.rules]));
    expect(rules.get("due")).toEqual(["presence:required", "format:date"]);
    // `[format:semver]` written first wins the scalar shape kind: no date token.
    expect(rules.get("semver_first")).toEqual(["presence:required", "format:semver"]);
    expect(rules.get("elements_only")).not.toContain("format:date");
    const ordered = await checkTemplate(registry, '---\nv: "1" # [count:min:1] [format:date] [format:elements:snake_case] [format:constant:1]\n---\n');
    if (ordered.status !== "ok") throw new Error("template is broken");
    expect(describeTemplate(ordered.model).fields[0]?.rules).toEqual(["presence:required", "format:constant:1", "format:elements:snake_case", "format:date", "count:min:1"]);
  });
});
