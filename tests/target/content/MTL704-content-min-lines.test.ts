/** MTL704 content-min-lines (src/rules/content.ts, docs/spec.md 2.6, 4.1 step 6, 4.3). */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { anchorLineOf, createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL704";
const DIR = "tests/fixtures/pairs/MTL704";

/** Expected message of section 'Steps' with minimum `n` and `count` non-blank lines. */
const message = (n: number, count: number): string => `Section 'Steps': [content:min-lines:${n}] only ${count} non-blank line(s)`;

/**
 * Case -> expected MTL704 messages, plus the template warning codes
 * (`warnings`, from the template parse, usually none). The fixture of a case is
 * `DIR/<name>`. At least 1 passing case and 1 failing case. Silent
 * branches live in `fail-` fixtures where another section of the same file
 * still yields the expected error.
 */
const CASES = [
  {
    name: "pass-exactly-minimum-non-blank-lines",
    expected: [],
    warnings: [],
  },
  {
    name: "fail-one-line-below-minimum",
    expected: [message(3, 2)],
    warnings: [],
  },
  {
    // Empty, space, tab and ideographic space (U+3000) lines are blank.
    name: "fail-blank-lines-not-counted",
    expected: [message(3, 2)],
    warnings: [],
  },
  {
    // 4 text lines plus lines holding only U+200B, U+180E and U+FEFF (none is
    // whitespace for Python `str.isspace`) count 7; the U+3000 line does not.
    // Swapping isPythonSpace for String.trim would drop U+FEFF and give 6.
    name: "fail-unicode-whitespace-lines-not-counted",
    expected: [message(8, 7)],
    warnings: [],
  },
  {
    // A line holding only U+0085 (NEXT LINE) is blank.
    name: "fail-next-line-only-line-is-blank",
    expected: [message(8, 7)],
    warnings: [],
  },
  {
    // A line holding only U+001C (FILE SEPARATOR) is blank.
    name: "fail-c0-separator-only-line-is-blank",
    expected: [message(8, 7)],
    warnings: [],
  },
  {
    name: "fail-empty-body-counts-zero",
    expected: [message(3, 0)],
    warnings: [],
  },
  {
    name: "fail-lines-in-other-section",
    expected: [message(3, 1)],
    warnings: [],
  },
  {
    name: "fail-first-repeated-heading-below-minimum",
    expected: [message(3, 1)],
    warnings: [],
  },
  {
    // Legacy takes the leftmost tag: [min-lines:4] wins over the later [min-lines:1].
    name: "fail-first-minimum-tag-wins",
    expected: [message(4, 2)],
    warnings: [],
  },
  {
    // A [content:max-lines:9] tag before the min tag must not be taken as the minimum.
    name: "fail-min-tag-after-max-tag",
    expected: [message(3, 2)],
    warnings: [],
  },
  {
    // Silent: tagged section absent from the target, untagged section, and a
    // malformed N (`[content:min-lines:abc]` is an MTL012 warning, never MTL704).
    name: "fail-only-tagged-section-below-minimum-reported",
    expected: [message(3, 1)],
    warnings: ["MTL012"],
  },
  {
    // Spec 4.3: label `Section '{parent} > {text}'`. The body of `### Notes` stops at the next
    // H3: 1 non-blank line, the 3 lines of `### Other` are not added.
    name: "fail-section-scope-label-names-the-parent",
    expected: ["Section 'Context > Notes': [content:min-lines:2] only 1 non-blank line(s)"],
    warnings: [],
  },
  {
    // Spec 2.6: each instance of a repeat heading is checked and labelled with its own target
    // text; `Sprint 3` has 2 lines and passes.
    name: "fail-repeat-pattern-instances-labelled-by-own-text",
    expected: [`Section 'Sprint 1' (pattern "Sprint {number}"): [content:min-lines:2] only 1 non-blank line(s)`, `Section 'Sprint 2' (pattern "Sprint {number}"): [content:min-lines:2] only 1 non-blank line(s)`],
    warnings: [],
  },
] as const;

const read = (path: string): string => readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

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

/** MTL704 diagnostics and template warning codes for the pair of a case folder. */
async function lint(testCase: { readonly name: string }) {
  const fixture = `${DIR}/${testCase.name}`;
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
  const found = await checkTarget(registry, status.model, read(`${fixture}/target.md`), `${fixture}/target.md`, createEnv());
  return {
    found: found.filter((diagnostic) => diagnostic.code === CODE),
    warnings: status.warnings,
  };
}

describe("MTL704 content-min-lines", () => {
  it("is registered in category content, error, target step content", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "content-min-lines",
      category: "content",
      severity: "error",
      phase: "target",
      step: "content",
    });
  });

  it("has at least 1 pass- case and at least 1 fail- case, one fixture dir each", () => {
    const passing = CASES.filter((testCase) => testCase.name.startsWith("pass-"));
    const failing = CASES.filter((testCase) => testCase.name.startsWith("fail-"));
    expect(passing.length).toBeGreaterThanOrEqual(1);
    expect(failing.length).toBeGreaterThanOrEqual(1);
    expect(passing.length + failing.length).toBe(CASES.length);
    expect(CASES.filter((testCase) => testCase.expected.length === 0)).toEqual(passing);
    // Orphan detection: no directory at any depth besides the cases, and each holds only the pair.
    const names = CASES.map((testCase) => testCase.name).sort();
    const tree = listTree();
    expect(tree.dirs).toEqual(names);
    expect(tree.files).toEqual(names.flatMap((name) => [`${name}/target.md`, `${name}/template.md`]).sort());
  });

  it("anchors a section-scope finding on the target heading line (DIR5)", async () => {
    const { found } = await lint({ name: "fail-section-scope-label-names-the-parent" });
    expect(found.map((diagnostic) => anchorLineOf(diagnostic))).toEqual([7]);
  });

  it("anchors each repeat instance's finding on its own heading line (DIR5)", async () => {
    // `## Sprint 1` is line 5, `## Sprint 2` line 9.
    const { found } = await lint({ name: "fail-repeat-pattern-instances-labelled-by-own-text" });
    expect(found.map((diagnostic) => anchorLineOf(diagnostic))).toEqual([5, 9]);
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
