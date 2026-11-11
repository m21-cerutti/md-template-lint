/** MTL309 elements-date-mismatch (src/rules/format.ts, docs/spec.md 2.9, 4.1, 4.3, 4.4 DIR5). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTemplate, lintTarget } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { anchorLineOf, createEnv } from "../../../src/engine/rule.js";
import { describeTemplate } from "../../../src/runner/schema.js";

const registry = createRegistry();
const CODE = "MTL309";
const DIR = "tests/fixtures/pairs/MTL309";
/** The other codes of the format family (tag isolation unless a case lists them). */
const OTHER_FORMAT_CODES = ["MTL301", "MTL302", "MTL303", "MTL304", "MTL305", "MTL306", "MTL307", "MTL308"];

/** Spec 4.3 message of MTL309; `listText` is the list text of the bad items. */
const message = (key: string, listText: string): string => `Field '${key}': list contains entries not matching [format:elements:date]: ${listText}`;

interface Finding {
  readonly message: string;
  /** Target key line (DIR5 anchor). */
  readonly line: number;
}

interface TestCase {
  readonly name: string;
  /** Expected MTL309 findings, in order. */
  readonly expected: readonly Finding[];
  /** Findings removed by the target directives (default 0). */
  readonly suppressed?: number;
  /** Codes of the type category expected besides MTL309, in order (default none). */
  readonly typeCodes?: readonly string[];
  /** Other format codes expected, in order (default none). */
  readonly formatCodes?: readonly string[];
  /** Every expected code in emission order, when the case pins it (spec 2.9 example). */
  readonly allCodes?: readonly string[];
}

/**
 * Case -> fixture dir (same name) -> expected result. At least 1 passing case and
 * 1 failing case. Silent branches live in the pass fixtures.
 */
const CASES: readonly TestCase[] = [
  // Silent in one run: a list of ISO DATEs (leap day, year 1); a scalar on a `string`
  // field, a scalar on a `date` field and a mapping under `[format:elements:date]` (not a
  // list, skipped); `[format:elements:semver]` written first (the first elements shape tag
  // wins, spec 2.9); `[format:date]` only (the scalar kind, skipped on a list); an untagged
  // field; and the spec 4.1 step 3 gate (bare key, empty list, missing key). The mapping on
  // the `string` field `meta` is the type rule's (MTL501).
  { name: "pass-iso-dates-or-skipped-values", expected: [], typeCodes: ["MTL501"] },
  // DIR5: `disable-line` on the key line and `disable-next-line` before it.
  { name: "pass-suppressed-by-disable-directives", expected: [], suppressed: 2 },
  // Spec 2.9: on a `list-of-date` field an item that fails the default date parsing is
  // listed by MTL513 only (one problem, one error).
  {
    name: "pass-invalid-item-on-list-of-date-is-mtl513-only",
    expected: [],
    typeCodes: ["MTL513"],
  },
  // Spec 2.9 worked example 1, line 5, with the expected emission order of the example.
  {
    name: "fail-release-milestones-mixed-items",
    expected: [{ message: message("milestones", "['2026-02', 'present']"), line: 5 }],
    typeCodes: ["MTL504", "MTL513"],
    formatCodes: ["MTL306", "MTL308"],
    allCodes: ["MTL306", "MTL504", "MTL308", "MTL513", "MTL309"],
  },
  // Spec 2.9 edge case: a `date` field with a list value gives MTL504 and MTL309 lists
  // every item that is not an ISO DATE (the type rule lists no items).
  {
    name: "fail-list-on-date-field",
    expected: [{ message: message("due", "['2026-13-01', 'present']"), line: 2 }],
    typeCodes: ["MTL504"],
  },
  // Exact text, no trimming (AS16): the padded item passes the default parsing (MTL513
  // silent) but is not an ISO DATE.
  {
    name: "fail-quoted-padded-item",
    expected: [{ message: message("milestones", "[' 2026-01-01']"), line: 2 }],
  },
  // One finding per field, every bad item in list order (other default shapes and markers).
  {
    name: "fail-several-bad-items-in-order",
    expected: [
      {
        message: message("milestones", "['2026-02', 'present', '2026', '31/12/2026', 'présent']"),
        line: 2,
      },
    ],
  },
  // `[format:elements:date] [format:elements:semver]`: date is first, so it runs (MTL308
  // silent). The field type is `list`, so an item failing the default parsing is listed.
  {
    name: "fail-first-elements-tag-wins",
    expected: [{ message: message("supported", "['1.0.0']"), line: 2 }],
  },
  // Template order, each finding anchored on its own target key line.
  {
    name: "fail-two-fields-in-template-order",
    expected: [
      { message: message("milestones", "['present']"), line: 3 },
      { message: message("deadlines", "['2026-02']"), line: 2 },
    ],
  },
  // Spec 2.9: items are tested as their text, so on a plain `list` field (no type rule on
  // the items) a nested list and a mapping are listed as value text (Q02, double quoted).
  {
    name: "fail-nested-list-and-mapping-items-on-list-field",
    expected: [{ message: message("dates", `["['2026-01-01']", "{'a': '2026-01-01'}"]`), line: 2 }],
  },
  // Spec 2.9: on a `list-of-date` field a nested list or mapping fails the default date
  // parsing, so MTL513 lists it and MTL309 does not.
  {
    name: "pass-nested-items-on-list-of-date-are-mtl513-only",
    expected: [],
    typeCodes: ["MTL513"],
  },
  // Spec 2.9: `2026-02-30` and `2026-04-31` fail the default parsing too: MTL513 only.
  {
    name: "pass-calendar-invalid-items-on-list-of-date-are-mtl513-only",
    expected: [],
    typeCodes: ["MTL513"],
  },
  // Spec 2.9: on a list field that is NOT `list-of-date` nothing is deferred: the calendar
  // invalid dates are listed by MTL309 (as for a `string` field and MTL307).
  {
    name: "fail-calendar-invalid-items-on-list-field",
    expected: [{ message: message("dates", "['2026-02-30', '2026-04-31']"), line: 2 }],
  },
  // Duplicates are listed twice, '' is an item, an unquoted `1.0` is the text '1.0' (spec
  // 1.2 failsafe), repr quotes: `'` gives double quotes, `"` keeps single quotes (Q02).
  {
    name: "fail-duplicate-empty-numeric-and-quoted-items",
    expected: [{ message: message("dates", `['x', 'x', '', '1.0', "it's", 'a"b']`), line: 2 }],
  },
  // Spec 2.9 exact text: the type trims, so a trailing space and a trailing newline pass the
  // default parsing (no MTL513) and are listed as not ISO DATEs.
  {
    name: "fail-trailing-space-and-newline-items-on-list-of-date",
    expected: [{ message: message("milestones", "['2026-01-01 ', '2026-01-01\\n']"), line: 2 }],
  },
];

const read = (path: string): string => readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

async function templateOf(fixture: string) {
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
  return status.model;
}

/** Diagnostics of this code, the other format codes, the type codes, all codes and the suppressed count. */
async function lint(testCase: TestCase) {
  const fixture = `${DIR}/${testCase.name}`;
  const result = await lintTarget(registry, await templateOf(fixture), read(`${fixture}/target.md`), `${fixture}/target.md`, createEnv());
  return {
    own: result.diagnostics.filter((diagnostic) => diagnostic.code === CODE),
    others: result.diagnostics.filter((diagnostic) => OTHER_FORMAT_CODES.includes(diagnostic.code)).map((diagnostic) => diagnostic.code),
    types: result.diagnostics.filter((diagnostic) => diagnostic.code.startsWith("MTL5")).map((diagnostic) => diagnostic.code),
    all: result.diagnostics.map((diagnostic) => diagnostic.code),
    suppressed: result.suppressed,
  };
}

describe("MTL309 elements-date-mismatch", { tags: ["MTL309", "format"] }, () => {
  it("is registered in category format, error, field step shape", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "elements-date-mismatch",
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
      const { own, others, types, all, suppressed } = await lint(testCase);
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
      expect(others).toEqual(testCase.formatCodes ?? []);
      expect(types).toEqual(testCase.typeCodes ?? []);
      if (testCase.allCodes !== undefined) expect(all).toEqual(testCase.allCodes);
      expect(suppressed).toBe(testCase.suppressed ?? 0);
    });
  }

  it("--verify lists the token format:elements:date after the scalar shape (spec 8.3)", async () => {
    const model = await templateOf(`${DIR}/pass-iso-dates-or-skipped-values`);
    const rules = new Map(describeTemplate(model).fields.map((field) => [field.name, field.rules]));
    expect(rules.get("milestones")).toEqual(["presence:required", "format:elements:date"]);
    // `[format:elements:semver]` written first wins the elements shape kind: no date token.
    expect(rules.get("semver_first")).toEqual(["presence:required", "format:elements:semver"]);
    expect(rules.get("scalar_only")).toEqual(["presence:required", "format:date"]);
    const ordered = await checkTemplate(registry, '---\nv: ["1"] # [count:min:1] [value:filename] [format:elements:date] [format:elements:semver] [format:date] [format:elements:snake_case]\n---\n');
    if (ordered.status !== "ok") throw new Error("template is broken");
    expect(describeTemplate(ordered.model).fields[0]?.rules).toEqual(["presence:required", "format:elements:snake_case", "format:date", "format:elements:date", "value:filename", "count:min:1"]);
  });
});
