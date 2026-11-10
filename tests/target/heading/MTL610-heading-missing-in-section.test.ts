/** MTL610 heading-missing-in-section (src/rules/heading.ts, docs/spec.md 2.6, 4.3, 4.4 DIR5). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { anchorLineOf, createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL610";
const DIR = "tests/fixtures/pairs/MTL610";

interface Expected {
  readonly message: string;
  /** Text of the missing template heading (spec 8.1). */
  readonly heading: string;
  /** Target line of the parent heading's match (spec 4.4 DIR5). */
  readonly anchor: number;
}

interface TestCase {
  readonly name: string;
  readonly expected: readonly Expected[];
}

/** Case -> fixture dir (same name) -> expected result. At least 1 pass- and 1 fail- case. */
const CASES: readonly TestCase[] = [
  { name: "pass-section-heading-present", expected: [] },
  { name: "pass-parent-missing-gives-no-finding", expected: [] },
  // Spec 2.6: the section of `## Context` is lines 5 to 6, so `### Decision` on line 6, the
  // last line before `## Next`, is inside it.
  { name: "pass-heading-on-last-line-of-parent-section", expected: [] },
  { name: "pass-optional-or-unchecked-children-absent", expected: [] },
  // Suppressible (spec 4.4): the directive covers the anchor, the parent heading line.
  { name: "pass-suppressed-on-parent-heading-line", expected: [] },
  // Spec 2.6: the children of a matched template-only parent are never checked.
  { name: "pass-required-child-of-matched-template-only-parent-is-unchecked", expected: [] },
  {
    // Spec 4.3: emission sorted by the template line of the missing heading.
    name: "fail-several-missing-headings-in-template-order",
    expected: [
      {
        message: "Heading: Section 'Context': missing required heading 'Decision' (H3)",
        heading: "Decision",
        anchor: 7,
      },
      {
        message: "Heading: Section 'Context': missing required heading 'Consequences' (H3)",
        heading: "Consequences",
        anchor: 7,
      },
      {
        message: "Heading: Section 'Steps': missing required heading 'Install' (H3)",
        heading: "Install",
        anchor: 11,
      },
    ],
  },
  {
    // Spec 2.6: scope is the target section of the parent's match, not the file.
    name: "fail-heading-only-in-another-parent-section",
    expected: [
      {
        message: "Heading: Section 'Context': missing required heading 'Decision' (H3)",
        heading: "Decision",
        anchor: 7,
      },
    ],
  },
  {
    // Spec 2.6: the children of a missing parent are not reported again.
    name: "fail-missing-parent-reported-once-not-its-child",
    expected: [
      {
        message: "Heading: Section 'Context': missing required heading 'Decision' (H3)",
        heading: "Decision",
        anchor: 7,
      },
    ],
  },
  {
    name: "fail-required-heading-missing-under-matched-parent",
    expected: [
      {
        message: "Heading: Section 'Context': missing required heading 'Decision' (H3)",
        heading: "Decision",
        anchor: 7,
      },
    ],
  },
  {
    // Spec 4.3: `{parent}` is the TARGET parent text (`## Hub [pattern:"{text}"]` matched
    // `## Actual parent`), `{text}` the template child text; `heading` is the child.
    name: "fail-parent-label-uses-target-parent-text",
    expected: [
      {
        message: "Heading: Section 'Actual parent': missing required heading 'Child' (H3)",
        heading: "Child",
        anchor: 5,
      },
    ],
  },
  {
    // Spec 4.3: sorted by the template line of the missing heading (`Decision` 7, `Install`
    // 11), although `# Steps` comes first in the target. Within one level the target order IS
    // the template order (positional run, spec 2.6), so the two parents are of different
    // levels here (`## Context` and `# Steps`; the order across levels is MTL604's).
    name: "fail-emitted-in-template-order-not-target-order",
    expected: [
      {
        message: "Heading: Section 'Context': missing required heading 'Decision' (H3)",
        heading: "Decision",
        anchor: 9,
      },
      {
        message: "Heading: Section 'Steps': missing required heading 'Install' (H4)",
        heading: "Install",
        anchor: 5,
      },
    ],
  },
  {
    // Spec 2.6 "Extra", 2.10 step 3b: an H2 before `## Context` shifts the run. `Context` looks at
    // `## Other`, takes nothing and is missing (MTL601): its child `### Decision` is not checked
    // (no MTL610), though a `### Decision` sits under the extra `## Other` and under `Context`.
    name: "pass-parent-shifted-by-an-extra-heading-gives-no-finding",
    expected: [],
  },
  {
    // Interleaved with MTL601 by template line (asserted below).
    name: "fail-interleaves-with-mtl601-by-template-line",
    expected: [
      {
        message: "Heading: Section 'Alpha': missing required heading 'Alpha child' (H3)",
        heading: "Alpha child",
        anchor: 5,
      },
      {
        message: "Heading: Section 'Beta': missing required heading 'Beta child' (H3)",
        heading: "Beta child",
        anchor: 9,
      },
    ],
  },
  {
    // Spec 2.6: text comparison is exact and case sensitive: `### decision` is not a match.
    name: "fail-heading-text-case-differs",
    expected: [
      {
        message: "Heading: Section 'Context': missing required heading 'Decision' (H3)",
        heading: "Decision",
        anchor: 5,
      },
    ],
  },
  {
    // Level 5: `D` (H6) under the missing `C` is not checked and not reported again.
    name: "fail-missing-h5-reported-on-its-h4-parent",
    expected: [
      {
        message: "Heading: Section 'B': missing required heading 'C' (H5)",
        heading: "C",
        anchor: 9,
      },
    ],
  },
  {
    name: "fail-missing-h6-reported-on-its-h5-parent",
    expected: [
      {
        message: "Heading: Section 'C': missing required heading 'D' (H6)",
        heading: "D",
        anchor: 11,
      },
    ],
  },
  {
    // Spec 2.6 worked example 1, variant: `#### Decision` is level 4, not the level 3 required.
    name: "fail-same-text-at-deeper-level-does-not-match",
    expected: [
      {
        message: "Heading: Section 'Context': missing required heading 'Decision' (H3)",
        heading: "Decision",
        anchor: 7,
      },
    ],
  },
];

const read = (path: string): string =>
  readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** Every diagnostic for the pair of a fixture folder. */
async function lintAll(name: string) {
  const fixture = `${DIR}/${name}`;
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
  const found = await checkTarget(
    registry,
    status.model,
    read(`${fixture}/target.md`),
    `${fixture}/target.md`,
    createEnv(),
  );
  return found;
}

/** The MTL610 diagnostics for the pair of a fixture folder. */
async function lint(testCase: TestCase) {
  const found = await lintAll(testCase.name);
  return found.filter((diagnostic) => diagnostic.code === CODE);
}

describe("MTL610 heading-missing-in-section", () => {
  it("is registered in category heading, error, target step headings", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "heading-missing-in-section",
      category: "heading",
      severity: "error",
      phase: "target",
      step: "headings",
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

  it("a matched template-only parent gives MTL603 for itself, nothing for its child", async () => {
    // Spec 2.6 and 4.3: MTL603 for `## Notes` found in the target; `### Tips` is not checked.
    const found = await lintAll("pass-required-child-of-matched-template-only-parent-is-unchecked");
    expect(found.map((diagnostic) => [diagnostic.code, diagnostic.heading])).toEqual([
      ["MTL603", "Notes"],
    ]);
  });

  it("interleaves with MTL601 by template line (spec 4.3 emission order)", async () => {
    // Template lines: `### Alpha child` 7, `## Missing top` 9, `### Beta child` 13.
    const found = await lintAll("fail-interleaves-with-mtl601-by-template-line");
    expect(found.map((diagnostic) => [diagnostic.code, anchorLineOf(diagnostic)])).toEqual([
      ["MTL610", 5],
      ["MTL601", null],
      ["MTL610", 9],
    ]);
  });

  it("the spec worked example variant gives exactly one finding", async () => {
    // Spec 2.6 worked example 1 variant: MTL610 on the parent line 7, nothing else.
    const found = await lintAll("fail-same-text-at-deeper-level-does-not-match");
    expect(found.map((diagnostic) => [diagnostic.code, anchorLineOf(diagnostic)])).toEqual([
      ["MTL610", 7],
    ]);
  });

  for (const testCase of CASES) {
    it(`${testCase.name}: ${DIR}/${testCase.name}`, async () => {
      const found = await lint(testCase);
      expect(
        found.map((diagnostic) => ({
          message: diagnostic.message,
          heading: diagnostic.heading,
          anchor: anchorLineOf(diagnostic),
        })),
      ).toEqual(testCase.expected);
      for (const diagnostic of found) {
        expect(diagnostic.severity).toBe("error");
        // The pipeline clears the template-line sort anchor (docs/architecture.md).
        expect(diagnostic.position).toBeNull();
      }
    });
  }
});
