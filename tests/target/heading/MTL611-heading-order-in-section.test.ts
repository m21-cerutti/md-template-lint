/** MTL611 heading-order-in-section (src/rules/heading.ts, docs/spec.md 2.6, 4.3, 4.4 DIR5). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate, lintTarget } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { anchorLineOf, createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL611";
const DIR = "tests/fixtures/pairs/MTL611";

interface Expected {
  readonly message: string;
  /** Text of the target parent heading, the match of the template parent (spec 8.1). */
  readonly heading: string;
  /** Target line of the parent heading's match (spec 4.4 DIR5). */
  readonly anchor: number;
}

interface TestCase {
  readonly name: string;
  readonly expected: readonly Expected[];
}

const mismatch = (parent: string, template: string, target: string): string => `Heading: Section '${parent}': heading order mismatch: template order ${template} vs target order ${target}`;

/**
 * Reachability under positional matching (spec 2.6 "Order", 2.10, ADR 0012): the template
 * headings of ONE level and scope take the siblings in template order by construction, so two
 * children of the same level can never be out of order (a swapped pair is MTL610 for the
 * first of them, see `pass-same-level-swap-is-mtl610-not-mtl611`). MTL611 can only fail
 * ACROSS levels: the direct children of P are the section-scope headings whose nearest lower
 * preceding template heading is P, so a deeper child must come BEFORE the shallower ones in the
 * template (`#### Y` then `### X`, both children of `## P`); the target is then ordered by file
 * position, and an `### X` that comes before `#### Y` gives a decrease (template order
 * ['Y', 'X'], matched indices Y after X). Every fail- case below is of that shape.
 *
 * Case -> fixture dir (same name) -> expected result. At least 1 pass- and 1 fail- case.
 */
const CASES: readonly TestCase[] = [
  // Extra target headings (`#### Detail` free detail, `### Notes` in the tail after the run)
  // never change the order result.
  { name: "pass-children-in-template-order", expected: [] },
  // Spec 2.6: `# Context` is not a match of `## Context`, so its children are not checked.
  { name: "pass-parent-missing-gives-no-finding", expected: [] },
  // Absent optional child skipped; children of an absent optional or a template-only parent unchecked.
  { name: "pass-optional-or-unchecked-children-ignored", expected: [] },
  // Suppressible (spec 4.4): the directive covers the anchor, the parent heading line. A real
  // cross-level MTL611 sits under it (asserted below: one suppressed, nothing reported).
  { name: "pass-suppressed-on-parent-heading-line", expected: [] },
  // A `{text}` pattern child and a literal child take two different siblings, in order (spec
  // 2.10 steps 3b and 3c): the indices are strictly increasing, never equal. (Two adjacent
  // `{text}` children would be the template error MTL017.)
  { name: "pass-pattern-and-literal-children-take-siblings-in-order", expected: [] },
  // A parent with one child and a parent without children have nothing to order.
  { name: "pass-single-child-and-no-child-parents", expected: [] },
  // A same-level swap is no MTL611: `Decision` looks at `Consequences`, is missing (MTL610,
  // asserted below) and Consequences takes it; no order is left to fail.
  { name: "pass-same-level-swap-is-mtl610-not-mtl611", expected: [] },
  {
    // Spec 8.1: `heading` and the message name the TARGET parent (`## Release
    // [pattern:"{text}"]` matched `## 1.0.0`).
    name: "fail-pattern-parent-reports-target-text",
    expected: [
      {
        message: mismatch("1.0.0", "['Fixed', 'Added']", "['Added', 'Fixed']"),
        heading: "1.0.0",
        anchor: 7,
      },
    ],
  },
  {
    // P is itself section scope: a checked H3 under a matched H2, with H4 children.
    name: "fail-section-scope-parent",
    expected: [
      {
        message: mismatch("Decision", "['Options', 'Choice']", "['Choice', 'Options']"),
        heading: "Decision",
        anchor: 9,
      },
    ],
  },
  {
    // Context's direct children are ordered: no finding on it; the H4 swap is Decision's.
    name: "fail-grandchildren-reordered-reported-on-their-parent-only",
    expected: [
      {
        message: mismatch("Decision", "['Options', 'Choice']", "['Choice', 'Options']"),
        heading: "Decision",
        anchor: 9,
      },
    ],
  },
  {
    name: "fail-last-pair-swapped",
    expected: [
      {
        message: mismatch("Context", "['Decision', 'Options', 'Consequences']", "['Decision', 'Consequences', 'Options']"),
        heading: "Context",
        anchor: 7,
      },
    ],
  },
  {
    // DIR5: the anchor is the target line of the parent (11), not its template line (7).
    name: "fail-parent-target-line-differs-from-template-line",
    expected: [
      {
        message: mismatch("Context", "['Decision', 'Consequences']", "['Consequences', 'Decision']"),
        heading: "Context",
        anchor: 11,
      },
    ],
  },
  {
    // The target list stops at the deepest child level (H3) and at the end of the parent section.
    name: "fail-children-out-of-order-under-matched-parent",
    expected: [
      {
        message: mismatch("Context", "['Decision', 'Consequences']", "['Consequences', 'Decision']"),
        heading: "Context",
        anchor: 7,
      },
    ],
  },
  {
    // Spec 2.6: one list per parent; an ordered sibling group of another parent gives nothing.
    name: "fail-order-checked-per-parent-not-across-parents",
    expected: [
      {
        message: mismatch("Steps", "['Install', 'Verify']", "['Verify', 'Install']"),
        heading: "Steps",
        anchor: 13,
      },
    ],
  },
  {
    // Spec 4.3: one finding per parent at most, sorted by the template line of the parent.
    name: "fail-two-parents-reported-in-template-order",
    expected: [
      {
        message: mismatch("Context", "['Decision', 'Consequences']", "['Consequences', 'Decision']"),
        heading: "Context",
        anchor: 7,
      },
      {
        message: mismatch("Steps", "['Install', 'Verify']", "['Verify', 'Install']"),
        heading: "Steps",
        anchor: 13,
      },
    ],
  },
  {
    // Spec 2.6: every child counts whatever its presence mode, once it has a match.
    name: "fail-optional-child-present-out-of-order-counts",
    expected: [
      {
        message: mismatch("Context", "['Decision', 'Rollout', 'Consequences']", "['Rollout', 'Decision', 'Consequences']"),
        heading: "Context",
        anchor: 7,
      },
    ],
  },
  {
    // The file-scope order (the H2 `Steps` matched before the H1 `Guide`) is MTL604's alone
    // (asserted below); MTL611 reports the H3/H4 group of `Steps`.
    name: "fail-file-scope-order-stays-mtl604-only",
    expected: [
      {
        message: mismatch("Steps", "['Install', 'Verify']", "['Verify', 'Install']"),
        heading: "Steps",
        anchor: 5,
      },
    ],
  },
  {
    // Spec 2.6: P is "checked, matched, not template-only": a present optional P counts.
    name: "fail-matched-optional-parent-checks-children-order",
    expected: [
      {
        message: mismatch("Context", "['A', 'B']", "['B', 'A']"),
        heading: "Context",
        anchor: 5,
      },
    ],
  },
  {
    // A `{text}` pattern child counts with the sibling it took (spec 2.10 step 3c): `#### Slot`
    // takes the first H4 (`First`, after `### Named` in the file), so the template order Slot,
    // Named is a decrease. Each position takes its own sibling (ADR 0012).
    name: "fail-pattern-child-counts-with-the-sibling-it-took",
    expected: [
      {
        message: mismatch("Context", "['Slot', 'Named']", "['Named', 'First']"),
        heading: "Context",
        anchor: 5,
      },
    ],
  },
  {
    // The missing child gets no match and is skipped in the list; it stays in the template list.
    // Emission order is asserted below (spec 4.3).
    name: "fail-emits-between-mtl601-and-mtl610-by-template-line",
    expected: [
      {
        message: mismatch("Context", "['Two', 'One', 'Missing child']", "['One', 'Two']"),
        heading: "Context",
        anchor: 7,
      },
    ],
  },
  {
    // Negative control (spec 4.4 DIR5/DIR7): the anchor is the PARENT line (5). A line directive
    // on a child line (7) and a next-line directive covering a child line (9) do not cover it.
    name: "fail-directive-on-child-line-does-not-suppress",
    expected: [
      {
        message: mismatch("Context", "['A', 'B']", "['B', 'A']"),
        heading: "Context",
        anchor: 5,
      },
    ],
  },
];

const read = (path: string): string => readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** Every diagnostic for the pair of a fixture folder. */
async function lintAll(name: string) {
  const fixture = `${DIR}/${name}`;
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
  return checkTarget(registry, status.model, read(`${fixture}/target.md`), `${fixture}/target.md`, createEnv());
}

/** The MTL611 diagnostics for the pair of a fixture folder. */
async function lint(testCase: TestCase) {
  const found = await lintAll(testCase.name);
  return found.filter((diagnostic) => diagnostic.code === CODE);
}

describe("MTL611 heading-order-in-section", () => {
  it("is registered in category heading, error, target step headings", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "heading-order-in-section",
      category: "heading",
      severity: "error",
      phase: "target",
      step: "headings",
    });
  });

  it("has at least 3 pass- cases and at least 3 fail- cases, one fixture dir each", () => {
    const passing = CASES.filter((testCase) => testCase.name.startsWith("pass-"));
    const failing = CASES.filter((testCase) => testCase.name.startsWith("fail-"));
    expect(passing.length).toBeGreaterThanOrEqual(3);
    expect(failing.length).toBeGreaterThanOrEqual(3);
    expect(passing.length + failing.length).toBe(CASES.length);
    expect(CASES.filter((testCase) => testCase.expected.length === 0)).toEqual(passing);
    const dirs = readdirSync(fileURLToPath(new URL(`../../../${DIR}`, import.meta.url))).sort();
    expect(dirs).toEqual(CASES.map((testCase) => testCase.name).sort());
  });

  it("file-scope order stays MTL604 (H2 list only), emitted after MTL611", async () => {
    // Spec 2.6 and 4.3: MTL604 lists file-scope headings and target headings up to H2.
    const found = await lintAll("fail-file-scope-order-stays-mtl604-only");
    expect(found.map((diagnostic) => [diagnostic.code, anchorLineOf(diagnostic)])).toEqual([
      ["MTL611", 5],
      ["MTL604", null],
    ]);
    expect(found[1]?.message).toBe("Heading: Heading order mismatch: template order ['Guide', 'Steps'] " + "vs target order ['Steps', 'Guide']");
  });

  it("a same-level swap gives MTL610 for the first heading and no MTL611 (positional match)", async () => {
    // Spec 2.6 "Order": `### Decision` looks at `### Consequences` (line 9) and is missing;
    // `### Consequences` takes it; `### Decision` (line 11) is in the tail: the warning MTL616.
    const found = await lintAll("pass-same-level-swap-is-mtl610-not-mtl611");
    expect(found.map((diagnostic) => [diagnostic.code, anchorLineOf(diagnostic)])).toEqual([
      ["MTL610", 7],
      ["MTL616", 11],
    ]);
    expect(found[0]?.message).toBe("Heading: Section 'Context': missing required heading 'Decision' (H3)");
  });

  it("a suppressed MTL611 is counted: the directive on the parent line covers it", async () => {
    const fixture = `${DIR}/pass-suppressed-on-parent-heading-line`;
    const status = await checkTemplate(registry, read(`${fixture}/template.md`));
    if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
    const result = await lintTarget(registry, status.model, read(`${fixture}/target.md`), `${fixture}/target.md`, createEnv());
    expect(result.diagnostics).toEqual([]);
    expect(result.suppressed).toBe(1);
  });

  it("emits MTL601, MTL611, MTL610, MTL603 by the template line they are about", async () => {
    // Template lines: `## Alpha` 7 (MTL601), `## Context` 9 (MTL611, the parent),
    // `### Missing child` 15 (MTL610), `## Draft` 17 (MTL603). Spec 4.3 emission order.
    const found = await lintAll("fail-emits-between-mtl601-and-mtl610-by-template-line");
    expect(found.map((diagnostic) => [diagnostic.code, anchorLineOf(diagnostic)])).toEqual([
      ["MTL601", null],
      ["MTL611", 7],
      ["MTL610", 7],
      ["MTL603", 13],
    ]);
    expect(found[2]?.message).toBe("Heading: Section 'Context': missing required heading 'Missing child' (H3)");
  });

  it("a directive on a child line does not suppress: reported, nothing counted", async () => {
    const fixture = `${DIR}/fail-directive-on-child-line-does-not-suppress`;
    const status = await checkTemplate(registry, read(`${fixture}/template.md`));
    if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
    const result = await lintTarget(registry, status.model, read(`${fixture}/target.md`), `${fixture}/target.md`, createEnv());
    expect(result.suppressed).toBe(0);
    expect(result.diagnostics.map((diagnostic) => [diagnostic.code, anchorLineOf(diagnostic)])).toEqual([["MTL611", 5]]);
  });

  it("a parent that is not matched gives MTL601 only, nothing for its children", async () => {
    const found = await lintAll("pass-parent-missing-gives-no-finding");
    // `# Context` (line 7) is in the level-1 tail: the warning MTL616 (worked example 1 of 2.6).
    expect(found.map((diagnostic) => diagnostic.code)).toEqual(["MTL601", "MTL616"]);
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
        // No column: the pipeline clears the template-line sort anchor (docs/architecture.md).
        expect(diagnostic.position).toBeNull();
      }
    });
  }
});
