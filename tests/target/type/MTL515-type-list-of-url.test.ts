/** MTL515 type-list-of-url (src/rules/type.ts, docs/spec.md 3.4, 4.1 step 3, 4.3). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL515";
const SCHEME_CODE = "MTL305";
const DIR = "tests/fixtures/pairs/MTL515";

/** Spec 4.3 messages of MTL515: `Field '<key>' (type=list-of-url): <detail>`. */
const shape = (key: string, got: string): string =>
  `Field '${key}' (type=list-of-url): expected a YAML list of URLs, got ${got}`;
const entries = (key: string, items: string): string =>
  `Field '${key}' (type=list-of-url): list contains non-URL entries: ${items}`;
/** Spec 4.3 message of MTL305 (the scheme allow-list owns the valid-but-disallowed items). */
const scheme = (key: string, items: string, allowed: string): string =>
  `Field '${key}': list contains URLs with a disallowed scheme ${items} [format:scheme:${allowed}]`;

interface TestCase {
  readonly name: string;
  /** Expected MTL515 messages, in order. */
  readonly expected: readonly string[];
  /** Expected MTL305 messages, in order (the split of spec 3.4 "Url predicate"). */
  readonly scheme: readonly string[];
}

/**
 * Case -> fixture dir (same name) -> expected result. At least 1 passing case and
 * 1 failing case.
 */
const CASES: readonly TestCase[] = [
  // Silent: valid URLs of every look (case, userinfo and port, compound scheme
  // with `.` and `-`, IPv6 host, brackets in the path), padded items (tab and
  // spaces), URLs with a disallowed scheme (MTL305 owns them, never MTL515), a
  // field typed by its values alone, a block list of one item; other-type
  // fields (a string, a scalar url, a mapping, a list of non-URLs typed
  // `list`) pin the type guard; blank, whitespace-only, empty list and missing
  // key are skipped by the step 3 gate.
  {
    name: "pass-url-items-type-guard-and-empty-gates",
    expected: [],
    scheme: [scheme("restricted", "['ftp://files.example.com', 'gopher://old.example']", "https")],
  },
  // Not a list: a scalar and a comma separated scalar.
  {
    name: "fail-scalar-and-comma-separated-scalar-are-not-lists",
    expected: [shape("single_url", "a scalar"), shape("comma_separated_urls", "a scalar")],
    scheme: [],
  },
  {
    name: "fail-mapping-in-list-of-url-field",
    expected: [shape("urls", "a mapping")],
    scheme: [],
  },
  // Valid items are not named; the offenders keep their order.
  {
    name: "fail-mixed-valid-and-invalid-items-name-only-offenders-in-order",
    expected: [entries("urls", "['example.com', 'mailto:a@b.c']")],
    scheme: [],
  },
  // No scheme, empty authority, query or fragment right after `//`, a single
  // slash, a scheme starting with a digit, a bracket without its pair.
  {
    name: "fail-missing-scheme-host-and-malformed-separators",
    expected: [
      entries(
        "urls",
        "['www.example.com', 'https://', 'https:///path', 'https://?q=1', 'https://#frag', " +
          "'https:/example.com', '1http://host', 'http://[::1/x', 'http://::1]/x']",
      ),
    ],
    scheme: [],
  },
  // Space and tab inside, then each forbidden authority character; the
  // backslash is doubled and the tab escaped by the Python repr.
  {
    name: "fail-spaces-and-forbidden-authority-characters",
    expected: [
      entries(
        "urls",
        "['https://ex ample.com', 'https://example.com/a b', 'https://ex\\tample.com', " +
          "'https://ex<ample.com', 'https://ex>ample.com', 'https://ex{ample.com', " +
          "'https://ex}ample.com', 'https://ex|ample.com', 'https://ex\\\\ample.com', " +
          `'https://ex^ample.com', 'https://ex"ample.com']`,
      ),
    ],
    scheme: [],
  },
  // Blank items are invalid and printed untrimmed; a null item is ''.
  {
    name: "fail-blank-and-whitespace-items",
    expected: [entries("urls", "['', '   ', '']")],
    scheme: [],
  },
  // A nested list or mapping item prints as its Python str, then repr-quoted.
  {
    name: "fail-nested-list-and-mapping-items-print-as-python-text",
    expected: [entries("urls", `["['https://b.example']", "{'u': 'https://c.example'}"]`)],
    scheme: [],
  },
  // The split of spec 3.4: the valid item with a disallowed scheme is MTL305
  // only; the invalid item is MTL515 only; the allowed item is silent.
  {
    name: "fail-disallowed-scheme-item-is-mtl305-and-invalid-item-is-mtl515",
    expected: [entries("urls", "['not a url']")],
    scheme: [scheme("urls", "['ftp://files.example.com']", "https")],
  },
  // Errors follow the template key order, not the target order.
  {
    name: "fail-two-fields-in-template-order",
    expected: [shape("first", "a scalar"), entries("second", "['nowhere']")],
    scheme: [],
  },
  // Type from a template list of URL-like values, and from the word `url` in
  // the comment with a list value (promotion to list-of-url).
  {
    name: "fail-type-inferred-from-template-url-list",
    expected: [entries("urls", "['a.example']")],
    scheme: [],
  },
  {
    name: "fail-type-from-url-word-with-list-value",
    expected: [entries("urls", "['bare']")],
    scheme: [],
  },
];

const read = (path: string): string =>
  readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** MTL515 and MTL305 diagnostics for the pair of a fixture folder. */
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
    scheme: found.filter((diagnostic) => diagnostic.code === SCHEME_CODE),
  };
}

describe("MTL515 type-list-of-url", () => {
  it("is registered in category type, error, field step type", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "type-list-of-url",
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
      const result = await lint(testCase);
      expect(result.found.map((diagnostic) => diagnostic.message)).toEqual(testCase.expected);
      for (const diagnostic of result.found) {
        expect(diagnostic.code).toBe(CODE);
        expect(diagnostic.severity).toBe("error");
        expect(diagnostic.position).toBeNull();
      }
      expect(result.scheme.map((diagnostic) => diagnostic.message)).toEqual(testCase.scheme);
    });
  }
});
