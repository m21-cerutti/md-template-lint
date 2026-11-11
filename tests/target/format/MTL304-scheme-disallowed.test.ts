/** MTL304 scheme-disallowed (src/rules/format.ts, docs/spec.md 2.3, 3.4, 4.1, 4.3). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL304";
const DIR = "tests/fixtures/pairs/MTL304";
/** The other codes of the format family: none may fire in any case (tag isolation). */
const OTHER_FORMAT_CODES = ["MTL301", "MTL302", "MTL303", "MTL305"];

/** Spec 4.3 message of MTL304; `schemes` is the sorted, lowercased allow-list. */
const message = (key: string, value: string, schemes: string): string => `Field '${key}': URL scheme of '${value}' is not allowed [format:scheme:${schemes}]`;

interface TestCase {
  readonly name: string;
  /** Expected MTL304 messages, in order. */
  readonly expected: readonly string[];
}

/**
 * Case -> fixture dir (same name) -> expected result. At least 1 passing case and
 * 1 failing case. Silent branches live in the pass fixture.
 */
const CASES: readonly TestCase[] = [
  // Silent in one run: an allowed scheme, an empty allow-list (no restriction), a
  // case-insensitive tag, an invalid URL (the type rule reports it), a padded but
  // allowed URL (trimmed for the check), an untagged url field, the type gate (a
  // scheme tag on a `string` template field, on a `list-of-url` template field), a
  // list and a mapping on a url field, and the spec 4.1 step 3 gate (blank,
  // whitespace, bare key, empty list, missing key).
  { name: "pass-allowed-unrestricted-or-invalid-urls", expected: [] },
  {
    name: "fail-scheme-not-in-allow-list",
    expected: [message("site", "ftp://files.example.com", "http,https")],
  },
  // The URL scheme is compared lowercased; the value is shown as written.
  {
    name: "fail-uppercase-scheme-outside-allow-list",
    expected: [message("site", "FTP://files.example.com", "https")],
  },
  // The allow-list is lowercased, deduplicated and sorted.
  {
    name: "fail-allow-list-sorted-lowercased-without-duplicates",
    expected: [message("site", "ftp://files.example.com", "http,https")],
  },
  // The first scheme tag of a field wins.
  {
    name: "fail-first-scheme-tag-wins",
    expected: [message("site", "ftp://files.example.com", "https")],
  },
  // The check trims the URL, the message shows the value as written.
  {
    name: "fail-value-shown-with-surrounding-spaces",
    expected: [message("site", "  ftp://files.example.com ", "https")],
  },
  {
    name: "fail-two-fields-in-template-order",
    expected: [message("site", "http://example.com", "https"), message("docs", "https://docs.example.com", "http")],
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

describe("MTL304 scheme-disallowed", { tags: ["MTL304", "format"] }, () => {
  it("is registered in category format, error, field step scheme", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "scheme-disallowed",
      category: "format",
      severity: "error",
      phase: "field",
      step: "scheme",
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
