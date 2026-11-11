/** MTL517 enum-option (src/rules/type.ts, docs/spec.md 3.4 "Enum", 4.1 step 3, 4.3). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL517";
const DIR = "tests/fixtures/pairs/MTL517";

interface Expected {
  readonly severity: "error" | "warning";
  readonly message: string;
}

/**
 * Spec 4.3 message of MTL517: `Field '<key>' (type=enum): value '<value>' is
 * not one of the allowed options <pylist>`. Error for a required field,
 * warning for an optional or conditional one.
 */
const outside = (severity: Expected["severity"], key: string, value: string, options: string): Expected => ({
  severity,
  message: `Field '${key}' (type=enum): value '${value}' is not one of the allowed options ${options}`,
});

const DRAFT_ACCEPTED = "['draft', 'accepted']";

interface TestCase {
  readonly name: string;
  /** Expected MTL517 diagnostics, in order (errors first, then warnings). */
  readonly expected: readonly Expected[];
}

/**
 * Case -> fixture dir (same name) -> expected result. At least 1 passing case and
 * 1 failing case.
 */
const CASES: readonly TestCase[] = [
  // Silent: members of every option list form (extra spaces, a single option
  // with a trailing separator, a leading separator, numbers, accents, an inner
  // pipe without spaces), the same on an optional and a conditional field, a
  // `[enum]` hint with no option list (bare value, or a pipe without
  // spaces), and `[enum]` on a template value that is a list holding
  // ` | `, a mapping or empty: no options, no check, no throw; other-type fields (string, int, float, bool, list,
  // mapping) holding values outside any option pin the type guard; blank,
  // whitespace-only, empty list and missing key are skipped by the step 3 gate.
  {
    name: "pass-members-type-guard-and-empty-gates",
    expected: [],
  },
  {
    name: "fail-value-outside-options-of-required-field",
    expected: [outside("error", "status", "published", "['draft', 'accepted', 'rejected']")],
  },
  // An explicit [presence:required] is a required field too.
  {
    name: "fail-explicit-required-tag-keeps-error",
    expected: [outside("error", "status", "published", DRAFT_ACCEPTED)],
  },
  {
    name: "fail-optional-field-gives-warning",
    expected: [outside("warning", "status", "published", DRAFT_ACCEPTED)],
  },
  // Conditional wins over optional and over required (spec 2.2 precedence).
  {
    name: "fail-conditional-field-gives-warning",
    expected: [outside("warning", "conditional_only", "published", DRAFT_ACCEPTED), outside("warning", "conditional_and_optional", "published", DRAFT_ACCEPTED), outside("warning", "conditional_and_required", "published", DRAFT_ACCEPTED)],
  },
  // Precedence conditional > optional > required whatever the tag order
  // (legacy `parse_presence`): every combination is a warning.
  {
    name: "fail-presence-tag-order-never-changes-severity",
    expected: [
      outside("warning", "optional_then_required", "published", DRAFT_ACCEPTED),
      outside("warning", "required_then_optional", "published", DRAFT_ACCEPTED),
      outside("warning", "conditional_then_optional", "published", DRAFT_ACCEPTED),
      outside("warning", "conditional_then_required", "published", DRAFT_ACCEPTED),
      outside("warning", "required_then_conditional", "published", DRAFT_ACCEPTED),
      outside("warning", "optional_then_conditional", "published", DRAFT_ACCEPTED),
    ],
  },
  // Errors are returned first, then warnings, each in template order.
  {
    name: "fail-errors-come-before-warnings-across-fields",
    expected: [
      outside("error", "required_second", "published", DRAFT_ACCEPTED),
      outside("error", "required_fourth", "published", DRAFT_ACCEPTED),
      outside("warning", "optional_first", "published", DRAFT_ACCEPTED),
      outside("warning", "conditional_third", "published", DRAFT_ACCEPTED),
    ],
  },
  {
    name: "fail-comparison-is-case-sensitive",
    expected: [outside("error", "status", "Draft", DRAFT_ACCEPTED)],
  },
  // The target value is compared as written: no trim (legacy `value not in options`).
  {
    name: "fail-padded-value-is-not-trimmed",
    expected: [
      outside("error", "leading_space", " draft", DRAFT_ACCEPTED),
      outside("error", "trailing_space", "draft ", DRAFT_ACCEPTED),
      outside("error", "both_spaces", "  draft  ", DRAFT_ACCEPTED),
      outside("error", "tab_padded", "\tdraft\t", DRAFT_ACCEPTED),
    ],
  },
  // A list or mapping is never a member; it prints as its Python str.
  {
    name: "fail-list-and-mapping-values-are-never-members",
    expected: [outside("error", "list_value", "['draft', 'accepted']", DRAFT_ACCEPTED), outside("error", "mapping_value", "{'state': 'draft'}", DRAFT_ACCEPTED), outside("error", "single_item_list", "['draft']", DRAFT_ACCEPTED)],
  },
  // Options are split on the literal ` | `, trimmed, empty ones dropped; a
  // pipe without spaces stays inside an option.
  {
    name: "fail-option-list-edge-forms",
    expected: [
      outside("error", "extra_spaces", "d", "['a', 'b', 'c']"),
      outside("error", "single_option", "other", "['only']"),
      outside("error", "leading_separator", "c", "['a', 'b']"),
      outside("error", "doubled_separator", "c", "['a', 'b']"),
      outside("error", "inner_pipe", "a", "['a|b', 'c']"),
    ],
  },
  // Options are listed as written: a duplicate is not removed.
  {
    name: "fail-duplicate-options-are-listed-as-written",
    expected: [outside("error", "duplicated", "b", "['a', 'a']"), outside("error", "duplicated_with_padding", "c", "['a', 'a', 'b']")],
  },
  // Values are compared as text, never as numbers: 1.0, 01, 1e0, +1 are not 1.
  {
    name: "fail-numeric-looking-values-are-compared-as-text",
    expected: [
      outside("error", "decimal_near_miss", "1.0", "['1', '2']"),
      outside("error", "leading_zero_near_miss", "01", "['1', '2']"),
      outside("error", "exponent_near_miss", "1e0", "['1', '2']"),
      outside("error", "signed_near_miss", "+1", "['1', '2']"),
    ],
  },
  {
    name: "fail-numeric-and-unicode-options",
    expected: [outside("error", "numeric", "4", "['1', '2', '3']"), outside("error", "unicode", "ete", "['été', 'hiver']")],
  },
  // The options print with Python repr quoting; the value is printed as is.
  {
    name: "fail-quote-characters-print-with-python-repr-quoting",
    expected: [outside("error", "quoted", "it's not", `["it's", 'say "hi"']`)],
  },
  // Errors follow the template key order, not the target order.
  {
    name: "fail-two-fields-in-template-order",
    expected: [outside("error", "first", "published", DRAFT_ACCEPTED), outside("error", "second", "w", "['x', 'y', 'z']")],
  },
  // Type from `[enum]` on a value that already holds the option list.
  {
    name: "fail-type-from-enum-hint-with-option-value",
    expected: [outside("error", "status", "published", DRAFT_ACCEPTED)],
  },
];

const read = (path: string): string => readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** MTL517 diagnostics for the pair of a fixture folder. */
async function lint(testCase: TestCase) {
  const fixture = `${DIR}/${testCase.name}`;
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
  const found = await checkTarget(registry, status.model, read(`${fixture}/target.md`), `${fixture}/target.md`, createEnv());
  return found.filter((diagnostic) => diagnostic.code === CODE);
}

describe("MTL517 enum-option", { tags: ["MTL517", "type"] }, () => {
  it("is registered in category type, default severity error, field step type", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "enum-option",
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
    const dirs = readdirSync(fileURLToPath(new URL(`../../../${DIR}`, import.meta.url))).sort();
    expect(dirs).toEqual(CASES.map((testCase) => testCase.name).sort());
  });

  for (const testCase of CASES) {
    it(`${testCase.name}: ${DIR}/${testCase.name}`, async () => {
      const found = await lint(testCase);
      expect(
        found.map((diagnostic) => ({
          severity: diagnostic.severity,
          message: diagnostic.message,
        })),
      ).toEqual(testCase.expected);
      for (const diagnostic of found) {
        expect(diagnostic.code).toBe(CODE);
        expect(diagnostic.position).toBeNull();
      }
    });
  }
});
