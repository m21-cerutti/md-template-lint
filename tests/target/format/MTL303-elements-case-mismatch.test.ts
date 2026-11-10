/** MTL303 elements-case-mismatch (src/rules/format.ts, docs/spec.md 2.3, 4.1, 4.3). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL303";
const DIR = "tests/fixtures/pairs/MTL303";
/** The other codes of the format family: none may fire in any case (tag isolation). */
const OTHER_FORMAT_CODES = ["MTL301", "MTL302", "MTL304", "MTL305"];

/** Spec 4.3 message of MTL303; `pylist` is the Python list text of the bad items. */
const message = (key: string, style: string, pylist: string): string => `Field '${key}': list contains entries not matching [format:elements:${style}]: ${pylist}`;

interface TestCase {
  readonly name: string;
  /** Expected MTL303 messages, in order. */
  readonly expected: readonly string[];
}

/**
 * Case -> fixture dir (same name) -> expected result. At least 1 passing case and
 * 1 failing case. Silent branches live in the pass fixture.
 */
const CASES: readonly TestCase[] = [
  // Silent in one run: matching lists, a scalar and a mapping under an elements
  // tag (skipped, and no MTL302 for a string under an elements tag), a list under
  // a case tag, an untagged list, and the spec 4.1 step 3 gate (blank, whitespace,
  // bare key, empty list, missing key).
  { name: "pass-all-items-match-or-value-is-not-a-list", expected: [] },
  {
    name: "fail-kebab-list-has-two-bad-items",
    expected: [message("tags", "kebab-case", "['Release_Notes', 'bad item']")],
  },
  {
    name: "fail-snake-list-has-hyphen-item",
    expected: [message("names", "snake_case", "['job-notes']")],
  },
  // Items are not trimmed and are shown as written.
  {
    name: "fail-item-has-leading-space",
    expected: [message("tags", "kebab-case", "[' release-notes']")],
  },
  // An empty item never matches and is listed.
  {
    name: "fail-empty-item-listed",
    expected: [message("tags", "kebab-case", "['']")],
  },
  // The list is not deduplicated.
  {
    name: "fail-duplicate-bad-items-listed-twice",
    expected: [message("tags", "kebab-case", "['Bad_One', 'Bad_One']")],
  },
  // An apostrophe makes Python pick double quotes.
  {
    name: "fail-item-with-apostrophe-shown-in-double-quotes",
    expected: [message("tags", "kebab-case", `["it's-bad"]`)],
  },
  // Python `repr`: a backslash is doubled, a tab is `\t`, U+200B is `\u200b`.
  {
    name: "fail-backslash-tab-and-zero-width-items-escaped-like-python",
    expected: [message("tags", "kebab-case", String.raw`['a\\b', 'tab\there', 'zero\u200bwidth']`)],
  },
  // Legacy `str(item)`: a nested list or mapping is listed as its Python text.
  {
    name: "fail-nested-list-item-listed-as-python-text",
    expected: [message("tags", "kebab-case", `["['a', 'b']"]`)],
  },
  {
    name: "fail-nested-mapping-item-listed-as-python-text",
    expected: [message("tags", "kebab-case", `["{'a': 'b'}"]`)],
  },
  // Legacy `re.search`: the first elements tag of a field wins.
  {
    name: "fail-first-elements-tag-wins",
    expected: [message("tags", "snake_case", "['release-notes']")],
  },
  {
    name: "fail-two-fields-in-template-order",
    expected: [message("names", "snake_case", "['Job_Notes']"), message("tags", "kebab-case", "['Release-Notes']")],
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

describe("MTL303 elements-case-mismatch", () => {
  it("is registered in category format, error, field step elements", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "elements-case-mismatch",
      category: "format",
      severity: "error",
      phase: "field",
      step: "elements",
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
