/** MTL705 content-max-lines (src/rules/content.ts, docs/spec.md 2.6, 4.1 step 6, 4.3). */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { anchorLineOf, createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL705";
const DIR = "tests/fixtures/pairs/MTL705";

/** Expected message of a section with maximum `n` and `count` non-blank lines. */
const message = (n: number, count: number, section = "Steps"): string =>
  `Section '${section}': [content:max-lines:${n}] ${count} non-blank line(s)`;

/**
 * Case -> expected MTL705 messages, plus the template warning codes
 * (`warnings`, from the template parse, usually none). The fixture of a case is
 * `DIR/<name>`. At least 1 passing case and 1 failing case. Silent
 * branches live in `fail-` fixtures where another section of the same file
 * still yields the expected error.
 */
const CASES = [
  {
    // Exactly N non-blank lines pass; empty and whitespace-only lines are not counted.
    name: "pass-exactly-maximum-non-blank-lines",
    expected: [],
    warnings: [],
  },
  {
    name: "fail-one-line-above-maximum",
    expected: [message(3, 4)],
    warnings: [],
  },
  {
    // Empty, space, tab and ideographic space (U+3000) lines are blank, text lines count.
    name: "fail-only-non-blank-lines-counted",
    expected: [message(3, 4)],
    warnings: [],
  },
  {
    // A line holding only U+0085 (NEXT LINE) is blank.
    name: "fail-next-line-only-line-is-blank",
    expected: [message(3, 4)],
    warnings: [],
  },
  {
    // A line holding only U+001C (FILE SEPARATOR) is blank.
    name: "fail-c0-separator-only-line-is-blank",
    expected: [message(3, 4)],
    warnings: [],
  },
  {
    // 4 text lines plus lines holding only U+200B and U+180E (not whitespace for
    // Python `str.isspace`) count 6; the U+3000 line does not. A wider
    // isPythonSpace range (U+200B, U+180E) would give 4.
    name: "fail-unicode-whitespace-lines-not-counted",
    expected: [message(3, 6)],
    warnings: [],
  },
  {
    // A line holding only U+FEFF is NOT blank in Python (`str.isspace`), but
    // `String.trim` would strip it: swapping isPythonSpace for trim gives 3, not 4.
    name: "fail-bom-only-line-is-non-blank",
    expected: [message(3, 4)],
    warnings: [],
  },
  {
    // The next H2 ends the body: the 6 lines of 'Notes' are not added to 'Steps'.
    name: "fail-count-stops-at-next-heading",
    expected: [message(3, 4)],
    warnings: [],
  },
  {
    // H3 and deeper headings stay in the body and count as lines.
    name: "fail-subheading-line-counts-in-body",
    expected: [message(3, 4)],
    warnings: [],
  },
  {
    // Fenced code is part of the body: the text line, both fences and the code line count.
    name: "fail-fenced-code-lines-count-in-body",
    expected: [message(3, 4)],
    warnings: [],
  },
  {
    // Leading spaces do not make a text line blank.
    name: "fail-indented-text-lines-count",
    expected: [message(3, 4)],
    warnings: [],
  },
  {
    name: "fail-first-repeated-heading-above-maximum",
    expected: [message(3, 4)],
    warnings: [],
  },
  {
    // Legacy takes the leftmost tag: [max-lines:2] wins over the later [max-lines:9].
    name: "fail-first-maximum-tag-wins",
    expected: [message(2, 3)],
    warnings: [],
  },
  {
    // A [content:min-lines:9] tag before the max tag must not be taken as the maximum.
    name: "fail-max-tag-after-min-tag",
    expected: [message(2, 3)],
    warnings: [],
  },
  {
    // Boundary N = 0: the empty body of 'Empty' is silent, the one-line body of 'Filled' fails.
    name: "fail-zero-maximum-only-non-empty-body-reported",
    expected: [message(0, 1, "Filled")],
    warnings: [],
  },
  {
    // Silent branch: tagged template section absent from the target.
    name: "fail-absent-target-section-stays-silent",
    expected: [message(3, 4)],
    warnings: [],
  },
  {
    // Silent branch: template section without a max-lines tag, 5 lines in the target.
    name: "fail-untagged-section-stays-silent",
    expected: [message(3, 4)],
    warnings: [],
  },
  {
    // Silent branch: malformed N is MTL012 only, never MTL705 (spec 2.6).
    name: "fail-malformed-maximum-warns-and-stays-silent",
    expected: [message(3, 4)],
    warnings: ["MTL012"],
  },
  {
    // Spec 4.3: label `Section '{parent} > {text}'`. The body of `### Notes` stops at the next
    // H3: 2 non-blank lines, `### Other` is not added.
    name: "fail-section-scope-label-names-the-parent",
    expected: [message(1, 2, "Context > Notes")],
    warnings: [],
  },
  {
    // Spec 2.6, section scope: a pattern heading under an exact-text parent is labelled
    // `Section '{parent} > {text}' (pattern "{pattern}")`, `{text}` the target text `Day 3`.
    name: "fail-section-scope-pattern-heading-label",
    expected: [
      `Section 'Log > Day 3' (pattern "Day {number}"): [content:max-lines:1] 2 non-blank line(s)`,
    ],
    warnings: [],
  },
] as const;

const read = (path: string): string =>
  readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

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

/** MTL705 diagnostics and template warning codes for the pair of a case folder. */
async function lint(testCase: { readonly name: string }) {
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
    warnings: status.warnings,
  };
}

describe("MTL705 content-max-lines", () => {
  it("is registered in category content, error, target step content", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "content-max-lines",
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
    expect(tree.files).toEqual(
      names.flatMap((name) => [`${name}/target.md`, `${name}/template.md`]).sort(),
    );
  });

  it("anchors a section-scope finding on the target heading line (DIR5)", async () => {
    const { found } = await lint({ name: "fail-section-scope-label-names-the-parent" });
    expect(found.map((diagnostic) => anchorLineOf(diagnostic))).toEqual([7]);
    const day = await lint({ name: "fail-section-scope-pattern-heading-label" });
    expect(day.found.map((diagnostic) => anchorLineOf(diagnostic))).toEqual([7]);
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
