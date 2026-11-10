/** MTL305 scheme-disallowed-item (src/rules/format.ts, docs/spec.md 2.3, 3.4, 4.1, 4.3). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL305";
const DIR = "tests/fixtures/pairs/MTL305";
/** The other codes of the format family: none may fire in any case (tag isolation). */
const OTHER_FORMAT_CODES = ["MTL301", "MTL302", "MTL303", "MTL304"];

/** Spec 4.3 message of MTL305; `pylist` is the Python list text, `schemes` the allow-list. */
const message = (key: string, pylist: string, schemes: string): string =>
  `Field '${key}': list contains URLs with a disallowed scheme ${pylist} [format:scheme:${schemes}]`;

interface TestCase {
  readonly name: string;
  /** Expected MTL305 messages, in order. */
  readonly expected: readonly string[];
}

/**
 * Case -> fixture dir (same name) -> expected result. At least 1 passing case and
 * 1 failing case. Silent branches live in the pass fixture.
 */
const CASES: readonly TestCase[] = [
  // Silent in one run: allowed items, an empty allow-list (no restriction), an
  // invalid item (the type rule reports it), a padded but allowed item, nested
  // list and mapping items (not strings), an untagged list, the type gate (a
  // scheme tag on a `list-of-string` template field and on a `url` template
  // field), a scalar and a mapping on a list-of-url field, and the spec 4.1 step
  // 3 gate (blank, whitespace, bare key, empty list, missing key).
  { name: "pass-allowed-unrestricted-or-invalid-items", expected: [] },
  {
    name: "fail-list-has-one-disallowed-item",
    expected: [message("links", "['ftp://files.example.com']", "http,https")],
  },
  // One error names every disallowed item, in list order, as written.
  {
    name: "fail-list-has-two-disallowed-items-in-list-order",
    expected: [
      message("links", "['sftp://files.example.com', 'FTP://files.example.com']", "https"),
    ],
  },
  // The list is not deduplicated.
  {
    name: "fail-duplicate-disallowed-items-listed-twice",
    expected: [message("links", "['ftp://files.example.com', 'ftp://files.example.com']", "https")],
  },
  // Invalid, empty and blank items are skipped; the valid disallowed one is named.
  {
    name: "fail-invalid-item-is-skipped-valid-disallowed-item-named",
    expected: [message("links", "['ftp://files.example.com']", "https")],
  },
  // The check trims the URL, the message shows the item as written.
  {
    name: "fail-item-with-surrounding-spaces-shown-as-written",
    expected: [message("links", "['  ftp://files.example.com ']", "https")],
  },
  // Python `repr`: a backslash is doubled, U+200B is `\u200b`.
  {
    name: "fail-backslash-and-zero-width-in-path-escaped-like-python",
    expected: [
      message(
        "links",
        String.raw`['ftp://files.example.com/a\\b', 'ftp://files.example.com/z\u200bw']`,
        "https",
      ),
    ],
  },
  // An apostrophe makes Python pick double quotes.
  {
    name: "fail-apostrophe-in-url-shown-in-double-quotes",
    expected: [message("links", `["ftp://files.example.com/it's"]`, "https")],
  },
  {
    name: "fail-allow-list-sorted-lowercased-without-duplicates",
    expected: [message("links", "['ftp://files.example.com']", "http,https")],
  },
  // Legacy `re.search`: the first scheme tag of a field wins.
  {
    name: "fail-first-scheme-tag-wins",
    expected: [message("links", "['ftp://files.example.com']", "https")],
  },
  {
    name: "fail-two-fields-in-template-order",
    expected: [
      message("links", "['http://a.example.com']", "https"),
      message("mirrors", "['https://mirror.example.com']", "http"),
    ],
  },
];

const read = (path: string): string =>
  readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** Diagnostics of this code, and of the other format codes, for the pair of a fixture folder. */
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
    own: found.filter((diagnostic) => diagnostic.code === CODE),
    others: found.filter((diagnostic) => OTHER_FORMAT_CODES.includes(diagnostic.code)),
  };
}

describe("MTL305 scheme-disallowed-item", () => {
  it("is registered in category format, error, field step scheme", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "scheme-disallowed-item",
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
