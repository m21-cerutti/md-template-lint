/**
 * MTL615 heading-subheadings-only-declared (src/rules/heading.ts, docs/spec.md 2.6 "Second
 * sub-heading tag", 2.10 "Interplay", 4.3, 4.4 DIR5 to DIR7, 8.1, 8.3). Under
 * `[content:subheadings:no-extra]` on a checked, matched, not template-only heading D, every
 * DIRECT target child of D's match M (each instance of a repeat heading) must be taken by a
 * position of D's template children, as a match or a mismatch. Each undeclared direct child is
 * one error anchored on its line, except a heading that gets MTL603, MTL612 or MTL614. A deeper
 * heading is never reported. Every expected value is derived from the spec by hand.
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate, lintTarget } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { anchorLineOf, createEnv } from "../../../src/engine/rule.js";
import { describeTemplate } from "../../../src/runner/schema.js";

const registry = createRegistry();
const CODE = "MTL615";
const DIR = "tests/fixtures/pairs/MTL615";

interface Expected {
  readonly message: string;
  /** Target anchor line (DIR5): the undeclared direct child. */
  readonly line: number;
  /** Spec 8.1: the text of the undeclared direct child. */
  readonly heading: string;
}

interface TestCase {
  readonly name: string;
  readonly expected: readonly Expected[];
  /** Every error of the fixture as [code, anchor line], in emission order. */
  readonly errors: readonly (readonly [string, number | null])[];
}

/**
 * Spec 4.3: `Section '{parent}': heading '{text}' at level H{n} is not declared at this
 * position [content:subheadings:no-extra]`.
 */
const undeclared = (parent: string, text: string, level: number, line: number): Expected => ({
  message: `Heading: Section '${parent}': heading '${text}' at level H${level} ` + "is not declared at this position [content:subheadings:no-extra]",
  line,
  heading: text,
});

/** Case -> fixture dir (same name) -> expected MTL615 findings. At least 1 pass- and 1 fail-. */
const CASES: readonly TestCase[] = [
  // Worked example 2 of 2.6, no-extra variant: the direct children of line 7 are lines 9 and
  // 17; line 9 was taken by `### Added`, line 17 by no position. Lines 13 and 19 are deeper.
  {
    name: "fail-worked-example-two-no-extra-variant",
    expected: [undeclared("Unreleased", "Misc", 3, 17)],
    errors: [[CODE, 17]],
  },
  // Worked example 2, duplicate group: line 17 `### Added` is extra in the level-3 run.
  {
    name: "fail-worked-example-two-duplicate-group-variant",
    expected: [undeclared("Unreleased", "Added", 3, 17)],
    errors: [[CODE, 17]],
  },
  // Both tags on one heading (both apply, spec 2.6): line 17 `### Added` is listed (no MTL612)
  // but not taken (MTL615); lines 13 and 19 are topmost unlisted (MTL612). Same template
  // line (7), so by code: the two MTL612 first, then MTL615.
  {
    name: "fail-both-tags-duplicate-group-gets-mtl612-and-mtl615",
    expected: [undeclared("Unreleased", "Added", 3, 17)],
    errors: [
      ["MTL612", 13],
      ["MTL612", 19],
      [CODE, 17],
    ],
  },
  // Both tags, worked example 2 target: line 17 `### Misc` gets MTL612, so no MTL615.
  {
    name: "pass-both-tags-unlisted-child-gets-mtl612-only",
    expected: [],
    errors: [
      ["MTL612", 13],
      ["MTL612", 17],
    ],
  },
  // `#### Detail` (line 9) has the target parent `## Context` (line 7): a direct child at a
  // level where `## Context` has no template child.
  {
    name: "fail-direct-child-at-undeclared-level",
    expected: [undeclared("Context", "Detail", 4, 9)],
    errors: [[CODE, 9]],
  },
  // `#### Deep` and `##### Deeper` are below the declared `### Decision`: not direct children.
  { name: "pass-deeper-heading-is-not-reported", expected: [], errors: [] },
  // Per instance of a repeat heading: under `v1.1.0`, `### Notes` (line 9) is in the tail;
  // under `v1.0.0`, the optional `### Added` does not take `### Misc` (line 13).
  {
    name: "fail-per-instance-of-repeat-heading",
    expected: [undeclared("v1.1.0", "Notes", 3, 9), undeclared("v1.0.0", "Misc", 3, 13)],
    errors: [
      [CODE, 9],
      [CODE, 13],
    ],
  },
  // Worked example 6 of 2.10: MTL612 (template line 7), MTL614 and MTL615 (template line 11).
  {
    name: "fail-worked-example-six-changelog",
    expected: [undeclared("[1.2.0] - 2026-03-01", "Notes", 3, 19)],
    errors: [
      ["MTL612", 13],
      ["MTL614", 23],
      [CODE, 19],
    ],
  },
  // A required placeholder position took `### Notes` as a mismatch (MTL606): it is declared.
  { name: "pass-mismatch-counts-as-declared", expected: [], errors: [["MTL606", 7]] },
  // The tail `### v1.0.0` (line 11) matches the repeat pattern: MTL614, never also MTL615.
  {
    name: "pass-repeat-miss-tail-heading-gets-mtl614-only",
    expected: [],
    errors: [["MTL614", 11]],
  },
  // Both `### Draft` are set aside by the template-only child: the first is MTL603, the
  // second is subject only to MTL612 (2.10 "Interplay"), so neither is MTL615.
  { name: "pass-template-only-child-gets-mtl603-only", expected: [], errors: [["MTL603", 9]] },
  // Worked example 2, no-extra variant, `disable-line MTL615` on the anchor (line 17).
  { name: "pass-disable-line-on-the-child-silences-it", expected: [], errors: [] },
  // Spec 2.6: a template-only D has no effect (and the `--verify` warning MTL015). `## Draft`
  // (line 5) is MTL603, and its child `### Child` (line 7) is not reported.
  {
    name: "pass-template-only-heading-with-the-tag-has-no-effect",
    expected: [],
    errors: [["MTL603", 5]],
  },
  // Spec 2.6: an absent optional D has no match, so no effect. `Beta` looks at `## Gamma` (line
  // 7), does not match and takes nothing; if the tag were applied to the sibling it did not take,
  // `### Kid` (line 9), a direct child of `## Gamma`, would be reported.
  { name: "pass-absent-optional-heading-with-the-tag-has-no-effect", expected: [], errors: [] },
  // Spec 2.6 "Checked": `### D` is unchecked because its parent `## P` has no match
  // (`## Other` stands there), so the tag does nothing; only `## P` is reported (MTL601).
  {
    name: "pass-unchecked-section-scope-heading-with-the-tag-gives-none",
    expected: [],
    errors: [["MTL601", null]],
  },
  // Spec 2.6 "Reported": `## Doc` has no template child at any level, so every direct child
  // (lines 7 and 9) is undeclared; `#### Deep` (line 11) is a child of `### B`, not of `## Doc`.
  {
    name: "fail-heading-without-template-children-reports-every-direct-child",
    expected: [undeclared("Doc", "A", 3, 7), undeclared("Doc", "B", 3, 9)],
    errors: [
      [CODE, 7],
      [CODE, 9],
    ],
  },
  // Spec 2.6 "Where": a template heading of ANY level, H1 included. `## A` (line 7) is declared
  // by the position of `## A`; `## B` (line 9) is a direct child of `# Doc` taken by no position.
  {
    name: "fail-tag-on-a-top-level-heading",
    expected: [undeclared("Doc", "B", 2, 9)],
    errors: [[CODE, 9]],
  },
  // Spec 2.6 "Reported" (one heading, one finding): the file-scope `### X` and the section-scope
  // `### X` both match line 7 and both carry the tag, so `#### Child` (line 9) is reported once.
  // The file-scope `### X` precedes `## Sec` in the template, not in the target: MTL604.
  {
    name: "fail-two-tagged-headings-sharing-one-match-report-once",
    expected: [undeclared("X", "Child", 4, 9)],
    errors: [
      [CODE, 9],
      ["MTL604", null],
    ],
  },
  // Spec 2.6: written twice on one heading, the tag counts once: one finding for `### B`.
  {
    name: "fail-tag-written-twice-counts-once",
    expected: [undeclared("Doc", "B", 3, 9)],
    errors: [[CODE, 9]],
  },
];

const read = (path: string): string => readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

async function templateOf(name: string) {
  const status = await checkTemplate(registry, read(`${DIR}/${name}/template.md`));
  if (status.status !== "ok") throw new Error("template is broken");
  return status;
}

/** Every diagnostic (after suppression) for the pair of a fixture folder. */
async function lintAll(name: string) {
  const status = await templateOf(name);
  return checkTarget(registry, status.model, read(`${DIR}/${name}/target.md`), "target.md", createEnv());
}

/** Result of `lintTarget` (findings and suppressed count) for a fixture folder. */
async function lintResult(name: string) {
  const status = await templateOf(name);
  return lintTarget(registry, status.model, read(`${DIR}/${name}/target.md`), "target.md", createEnv());
}

describe("MTL615 heading-subheadings-only-declared", () => {
  it("is registered in category heading, error, target step headings", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "heading-subheadings-only-declared",
      category: "heading",
      severity: "error",
      phase: "target",
      step: "headings",
    });
  });

  it("is registered between MTL614 and MTL616 (spec 4.3: same template line, by code)", () => {
    const codes = registry.rules.map((rule) => rule.code);
    expect(codes.indexOf(CODE)).toBe(codes.indexOf("MTL614") + 1);
    expect(codes.indexOf("MTL616")).toBe(codes.indexOf(CODE) + 1);
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
      const all = await lintAll(testCase.name);
      const found = all.filter((diagnostic) => diagnostic.code === CODE);
      expect(
        found.map((diagnostic) => ({
          message: diagnostic.message,
          line: anchorLineOf(diagnostic),
          heading: diagnostic.heading,
        })),
      ).toEqual(testCase.expected);
      for (const diagnostic of found) {
        expect(diagnostic.severity).toBe("error");
        // The template-line sort key is cleared (the anchor is internal, spec 8.1).
        expect(diagnostic.position).toBeNull();
      }
      expect(all.filter((diagnostic) => diagnostic.severity === "error").map((diagnostic) => [diagnostic.code, anchorLineOf(diagnostic)])).toEqual(testCase.errors);
    });
  }

  it("disable-line on the anchor: no finding, one suppressed", async () => {
    const result = await lintResult("pass-disable-line-on-the-child-silences-it");
    expect(result.diagnostics.filter((item) => item.severity === "error")).toEqual([]);
    expect(result.suppressed).toBe(1);
  });

  it("--verify lists the rule token after content:subheadings:disallow (spec 8.3)", async () => {
    const status = await templateOf("fail-both-tags-duplicate-group-gets-mtl612-and-mtl615");
    const unreleased = describeTemplate(status.model).headings.find((heading) => heading.text === "Unreleased");
    expect(unreleased?.rules).toEqual(["presence:required", "content:subheadings:disallow", "content:subheadings:no-extra"]);
  });
});
