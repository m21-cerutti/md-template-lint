/**
 * MTL607 heading-repeat-min (src/rules/heading.ts, docs/spec.md 2.10 step 3d3, "Repeat rules"
 * "Defaults" and "Bounds", the presence table, 4.3, 4.4 DIR5 to DIR7, 8.1). A repeat heading
 * with an explicit `min` (its first `min` tag) whose repeat set has fewer instances than `N`:
 * one error per repeat set, anchored on the first instance; at zero instances no anchor and no
 * MTL605 (MTL607 replaces it). The default minimum never gives MTL607. Every expected value is
 * derived from the spec by hand.
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate, lintTarget } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { anchorLineOf, createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL607";
const DIR = "tests/fixtures/pairs/MTL607";

interface Expected {
  readonly message: string;
  /** Target anchor line (DIR5): the first instance; null when the set has no instance. */
  readonly line: number | null;
  /** Spec 8.1: the label of the pattern heading. */
  readonly heading: string;
}

interface TestCase {
  readonly name: string;
  readonly expected: readonly Expected[];
}

const belowMin = (
  count: number,
  pattern: string,
  min: number,
  line: number | null,
  heading: string,
  parent: string | null = null,
): Expected => ({
  message:
    `Heading: ${parent === null ? "" : `Section '${parent}': `}${count} heading(s) match ` +
    `[pattern:"${pattern}"], minimum is ${min}`,
  line,
  heading,
});

const RELEASE_V = (count: number, min: number, line: number | null): Expected =>
  belowMin(count, "v{semver}", min, line, "Release");
const CHANGELOG = (count: number, line: number | null): Expected =>
  belowMin(count, "[{semver}] - {date}", 4, line, "Release");

/** Case -> fixture dir (same name) -> expected MTL607 findings. At least 1 pass- and 1 fail-. */
const CASES: readonly TestCase[] = [
  // "Bounds": `n` 2 below `min:3`, anchored on the FIRST instance (line 7, not line 9).
  { name: "fail-count-below-minimum-anchors-the-first-instance", expected: [RELEASE_V(2, 3, 7)] },
  // Zero instances with an explicit `min:2`, required: `{count}` 0, no anchor, no MTL605.
  { name: "fail-zero-instances-below-minimum-two-required", expected: [RELEASE_V(0, 2, null)] },
  // The same with `[presence:optional]`: the `min` decides alone in lint (MTL018 is template).
  { name: "fail-zero-instances-below-minimum-two-optional", expected: [RELEASE_V(0, 2, null)] },
  // Step 3d1 takes `Notes` as a mismatch (MTL606), the run is empty: MTL607 at zero too.
  { name: "fail-lead-mismatch-then-zero-instances", expected: [RELEASE_V(0, 2, null)] },
  // "Defaults": the default minimum is the presence rule, never MTL607 (required: MTL605).
  { name: "pass-default-minimum-required-zero-instances-gives-mtl605", expected: [] },
  // Optional or conditional: default minimum 0, no finding at all.
  { name: "pass-default-minimum-optional-zero-instances-gives-nothing", expected: [] },
  // `n` equal to `min` is not below it.
  { name: "pass-count-equal-to-minimum", expected: [] },
  // `min:1` with one instance.
  { name: "pass-minimum-one-met", expected: [] },
  // Section scope: one repeat set per parent instance; `{in}` is `Section '{parent}': `.
  // Instance `v1.0.0` has one step (line 9), `v1.1.0` none (no anchor), `v1.2.0` two.
  {
    name: "fail-section-scope-one-finding-per-parent-instance",
    expected: [
      belowMin(1, "Step {digits}", 2, 9, "Step", "v1.0.0"),
      belowMin(0, "Step {digits}", 2, null, "Step", "v1.1.0"),
    ],
  },
  // `disable-line MTL607` on the first instance (the anchor, DIR5, DIR7): silenced.
  { name: "pass-disable-line-on-the-first-instance-silences-it", expected: [] },
  // No anchor at zero instances: `disable-file MTL607` silences it.
  { name: "pass-disable-file-silences-the-anchorless-one", expected: [] },
  // Two `min` tags: the first is effective (`min:3`), the second is ignored.
  { name: "fail-two-min-tags-the-first-wins", expected: [RELEASE_V(2, 3, 7)] },
  { name: "pass-two-min-tags-the-first-is-met", expected: [] },
  // An invalid pattern (MTL014) or a repeat tag without pattern (MTL015): no repeat heading.
  { name: "pass-invalid-pattern-is-no-repeat-heading", expected: [] },
  { name: "pass-repeat-tag-without-pattern-is-ignored", expected: [] },
  // Spec 2.6 "Checked": a section-scope child is checked only under a checked, matched, not
  // template-only parent; an unchecked child is never reported (one cause, one finding).
  // Parent absent (MTL601), parent taken as a mismatch (MTL606), template-only parent.
  { name: "pass-child-under-absent-parent-is-not-checked", expected: [] },
  { name: "pass-child-under-mismatched-parent-is-not-checked", expected: [] },
  { name: "pass-child-under-template-only-parent-is-not-checked", expected: [] },
  // Only `max:N` (no explicit `min`): the default minimum applies, never MTL607 (2.10
  // "Defaults"); at zero instances a required heading is MTL605.
  { name: "pass-max-only-tag-is-no-minimum", expected: [] },
  { name: "pass-max-only-tag-zero-instances-gives-mtl605", expected: [] },
  // `[presence:conditional:...]` with `min:2`: the `min` decides alone (2.10 presence table,
  // not MTL018): 0 instances (no anchor) and 1 instance (anchored on line 7).
  {
    name: "fail-conditional-zero-instances-below-minimum-two",
    expected: [RELEASE_V(0, 2, null)],
  },
  { name: "fail-conditional-one-instance-below-minimum-two", expected: [RELEASE_V(1, 2, 7)] },
  // Negative control of the disable-line case: the directive on instance 2 (line 9) does not
  // cover the anchor (line 7, DIR5, DIR7).
  {
    name: "fail-disable-line-on-the-second-instance-does-not-silence-it",
    expected: [RELEASE_V(2, 3, 7)],
  },
  // `n` 3 above `min:2`: not below it.
  { name: "pass-count-above-minimum", expected: [] },
  // Explicit `min:1` at zero instances: MTL607 (no anchor), where the default minimum of 1
  // gives MTL605 (pass-default-minimum-required-zero-instances-gives-mtl605).
  { name: "fail-explicit-minimum-one-zero-instances", expected: [RELEASE_V(0, 1, null)] },
  // Worked example 1 of 2.10, variant "minimum": three instances, `min:4`, anchored on line 9.
  { name: "fail-worked-example-1-minimum-four-with-three-instances", expected: [CHANGELOG(3, 9)] },
  // Worked example 1, variant "no release" with `min:4`, with and without `[presence:optional]`:
  // `0 heading(s)`, no anchor, no MTL605.
  {
    name: "fail-worked-example-1-no-release-minimum-four-required",
    expected: [CHANGELOG(0, null)],
  },
  {
    name: "fail-worked-example-1-no-release-minimum-four-optional",
    expected: [CHANGELOG(0, null)],
  },
  // Worked example 5, template as written: `n` 2 is not below `min:2`, the target passes.
  { name: "pass-worked-example-5-two-instances-meet-minimum-two", expected: [] },
  // Worked example 5, variant "target line 9 removed": `n` 1, anchored on line 7.
  {
    name: "fail-worked-example-5-one-instance-below-minimum-two",
    expected: [belowMin(1, "{semver}", 2, 7, "Release")],
  },
];

const read = (path: string): string =>
  readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** Every diagnostic (after suppression) for the pair of a fixture folder. */
async function lintAll(name: string) {
  const fixture = `${DIR}/${name}`;
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error("template is broken");
  return checkTarget(
    registry,
    status.model,
    read(`${fixture}/target.md`),
    "target.md",
    createEnv(),
  );
}

/** The errors of a fixture as [code, anchor line]. */
async function errorsOf(name: string) {
  return (await lintAll(name))
    .filter((diagnostic) => diagnostic.severity === "error")
    .map((diagnostic) => [diagnostic.code, anchorLineOf(diagnostic)]);
}

/** Result of `lintTarget` (findings and suppressed count) for a fixture folder. */
async function lintResult(name: string) {
  const fixture = `${DIR}/${name}`;
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error("template is broken");
  return lintTarget(registry, status.model, read(`${fixture}/target.md`), "target.md", createEnv());
}

describe("MTL607 heading-repeat-min", () => {
  it("is registered in category heading, error, target step headings", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "heading-repeat-min",
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

  for (const testCase of CASES) {
    it(`${testCase.name}: ${DIR}/${testCase.name}`, async () => {
      const found = (await lintAll(testCase.name)).filter((diagnostic) => diagnostic.code === CODE);
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
    });
  }

  it("zero instances with an explicit min: MTL607 replaces MTL605 (both presence modes)", async () => {
    for (const name of [
      "fail-zero-instances-below-minimum-two-required",
      "fail-zero-instances-below-minimum-two-optional",
      "fail-worked-example-1-no-release-minimum-four-required",
      "fail-worked-example-1-no-release-minimum-four-optional",
      "fail-conditional-zero-instances-below-minimum-two",
      "fail-explicit-minimum-one-zero-instances",
    ]) {
      expect(await errorsOf(name)).toEqual([[CODE, null]]);
    }
  });

  it("default minimum: required zero instances is MTL605 only, optional gives nothing", async () => {
    expect(await errorsOf("pass-default-minimum-required-zero-instances-gives-mtl605")).toEqual([
      ["MTL605", null],
    ]);
    expect(await errorsOf("pass-default-minimum-optional-zero-instances-gives-nothing")).toEqual(
      [],
    );
  });

  it("a lead mismatch and an empty run: MTL606 on the sibling, then MTL607 (code order)", async () => {
    expect(await errorsOf("fail-lead-mismatch-then-zero-instances")).toEqual([
      ["MTL606", 7],
      [CODE, null],
    ]);
  });

  it("worked example 1, variant minimum: MTL607 is printed first", async () => {
    const found = await lintAll("fail-worked-example-1-minimum-four-with-three-instances");
    expect(found[0]?.code).toBe(CODE);
    expect(found.filter((diagnostic) => diagnostic.code === "MTL605")).toEqual([]);
  });

  it("no repeat heading: no MTL607 and nothing else from the min tag", async () => {
    expect(await errorsOf("pass-repeat-tag-without-pattern-is-ignored")).toEqual([]);
    expect(
      (await lintAll("pass-invalid-pattern-is-no-repeat-heading")).map((item) => item.code),
    ).not.toContain(CODE);
  });

  it("disable-line on the first instance: the baseline plus one directive", async () => {
    expect(await errorsOf("fail-count-below-minimum-anchors-the-first-instance")).toEqual([
      [CODE, 7],
    ]);
    const result = await lintResult("pass-disable-line-on-the-first-instance-silences-it");
    expect(result.diagnostics).toEqual([]);
    expect(result.suppressed).toBe(1);
  });

  it("section scope: zero instances under a parent instance is MTL607, never MTL605", async () => {
    expect(await errorsOf("fail-section-scope-one-finding-per-parent-instance")).toEqual([
      [CODE, 9],
      [CODE, null],
    ]);
  });

  it("unchecked child: only the parent's own finding, no MTL607 and no MTL605", async () => {
    expect(await errorsOf("pass-child-under-absent-parent-is-not-checked")).toEqual([
      ["MTL601", null],
    ]);
    expect(await errorsOf("pass-child-under-mismatched-parent-is-not-checked")).toEqual([
      ["MTL606", 7],
    ]);
    expect(await errorsOf("pass-child-under-template-only-parent-is-not-checked")).toEqual([]);
  });

  it("max only: one instance passes, zero instances is MTL605 only", async () => {
    expect(await errorsOf("pass-max-only-tag-is-no-minimum")).toEqual([]);
    expect(await errorsOf("pass-max-only-tag-zero-instances-gives-mtl605")).toEqual([
      ["MTL605", null],
    ]);
  });

  it("disable-line on instance 2 does not silence the finding on instance 1", async () => {
    const result = await lintResult("fail-disable-line-on-the-second-instance-does-not-silence-it");
    expect(result.diagnostics.map((item) => [item.code, anchorLineOf(item)])).toContainEqual([
      CODE,
      7,
    ]);
    expect(result.suppressed).toBe(0);
  });

  it("disable-file silences the anchorless finding", async () => {
    const result = await lintResult("pass-disable-file-silences-the-anchorless-one");
    expect(result.diagnostics).toEqual([]);
    expect(result.suppressed).toBe(1);
  });
});
