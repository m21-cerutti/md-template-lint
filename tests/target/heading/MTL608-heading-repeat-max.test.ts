/**
 * MTL608 heading-repeat-max (src/rules/heading.ts, docs/spec.md 2.10 step 3d3, "Repeat rules"
 * "Defaults" and "Bounds", 4.3, 4.4 DIR5 to DIR7, 8.1). A repeat heading with an explicit
 * `max` (its first `max` tag) whose repeat set has more instances than `N`: one error per
 * repeat set, anchored on the instance number `max + 1`. The bound never stops the run (the
 * count is every instance). No default maximum; a `min` tag is no maximum. Every expected
 * value is derived from the spec by hand.
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate, lintTarget } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { anchorLineOf, createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL608";
const DIR = "tests/fixtures/pairs/MTL608";

interface Expected {
  readonly message: string;
  /** Target anchor line (DIR5): the instance number `max + 1`. */
  readonly line: number;
  /** Spec 8.1: the label of the pattern heading. */
  readonly heading: string;
}

interface TestCase {
  readonly name: string;
  readonly expected: readonly Expected[];
}

const aboveMax = (
  count: number,
  pattern: string,
  max: number,
  line: number,
  heading: string,
  parent: string | null = null,
): Expected => ({
  message:
    `Heading: ${parent === null ? "" : `Section '${parent}': `}${count} heading(s) match ` +
    `[pattern:"${pattern}"], maximum is ${max}`,
  line,
  heading,
});

const RELEASE_V = (count: number, max: number, line: number): Expected =>
  aboveMax(count, "v{semver}", max, line, "Release");

/** Case -> fixture dir (same name) -> expected MTL608 findings. At least 1 pass- and 1 fail-. */
const CASES: readonly TestCase[] = [
  // "Bounds": `n` 4 above `max:2` (instances 7, 9, 11, 13), anchored on instance 3 (line 11),
  // not on the first or the last; the bound does not stop the run, so `{count}` is 4.
  {
    name: "fail-count-above-maximum-anchors-instance-max-plus-one",
    expected: [RELEASE_V(4, 2, 11)],
  },
  // `n` equal to `max` is not above it.
  { name: "pass-count-equal-to-maximum", expected: [] },
  // "Defaults": there is no default maximum.
  { name: "pass-no-max-tag-has-no-maximum", expected: [] },
  // A `min` tag is no maximum (`min:1`, 3 instances).
  { name: "pass-min-only-tag-is-no-maximum", expected: [] },
  // Both bounds on one heading, each its own kind, in both tag orders: `max:2` decides here.
  { name: "fail-max-then-min-tags-both-apply", expected: [RELEASE_V(3, 2, 11)] },
  { name: "fail-min-then-max-tags-both-apply", expected: [RELEASE_V(3, 2, 11)] },
  // `min:3` above `max:2` (no template warning): 2 instances give MTL607 only, 3 give MTL608.
  { name: "pass-min-above-max-two-instances-gives-mtl607-only", expected: [] },
  {
    name: "fail-min-above-max-three-instances-gives-mtl608-only",
    expected: [RELEASE_V(3, 2, 11)],
  },
  // Section scope: one repeat set per parent instance; `{in}` is `Section '{parent}': `.
  // `v1.0.0` has 2 steps (9, 11), `v1.1.0` one, `v1.2.0` three (19, 21, 23); `max:1`.
  {
    name: "fail-section-scope-one-finding-per-parent-instance",
    expected: [
      aboveMax(2, "Step {digits}", 1, 11, "Step", "v1.0.0"),
      aboveMax(3, "Step {digits}", 1, 21, "Step", "v1.2.0"),
    ],
  },
  // `disable-line MTL608` on the anchor (instance 3, line 11; DIR5, DIR7): silenced.
  { name: "pass-disable-line-on-the-anchor-silences-it", expected: [] },
  // Negative control: the directive on instance 4 (line 13) does not cover the anchor.
  {
    name: "fail-disable-line-on-another-instance-does-not-silence-it",
    expected: [RELEASE_V(4, 2, 11)],
  },
  { name: "pass-disable-file-silences-it", expected: [] },
  // Two `max` tags: the first is effective, the second is ignored (2.10 "First tag of a kind").
  { name: "fail-two-max-tags-the-first-wins", expected: [RELEASE_V(3, 2, 11)] },
  { name: "pass-two-max-tags-the-first-is-met", expected: [] },
  // An invalid pattern (MTL014) or a repeat tag without pattern (MTL015): no repeat heading.
  { name: "pass-invalid-pattern-is-no-repeat-heading", expected: [] },
  { name: "pass-repeat-tag-without-pattern-is-ignored", expected: [] },
  // Spec 2.6 "Checked": parent absent (MTL601), parent taken as a mismatch (MTL606),
  // template-only parent (MTL603): the child is not checked, never reported.
  { name: "pass-child-under-absent-parent-is-not-checked", expected: [] },
  { name: "pass-child-under-mismatched-parent-is-not-checked", expected: [] },
  { name: "pass-child-under-template-only-parent-is-not-checked", expected: [] },
  // `[presence:conditional:...]` plays no part in the maximum: 2 instances above `max:1`.
  { name: "fail-conditional-above-maximum", expected: [RELEASE_V(2, 1, 9)] },
  // Step 3d2: the stray `Notes` (line 13) ends the run; `n` counts lines 7, 9, 11 only.
  {
    name: "fail-stray-heading-breaks-the-run-counts-only-the-first-run",
    expected: [RELEASE_V(3, 2, 11)],
  },
  // The run (lines 7, 9) stops at `Notes`; the later matches are tail siblings, not counted.
  { name: "pass-stray-heading-ends-the-run-at-the-maximum", expected: [] },
  // Worked example 1 of 2.10, variant "maximum": three instances, `max:2`, anchored on line 21.
  {
    name: "fail-worked-example-1-maximum-two-with-three-instances",
    expected: [aboveMax(3, "[{semver}] - {date}", 2, 21, "Release")],
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

describe("MTL608 heading-repeat-max", () => {
  it("is registered in category heading, error, target step headings", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "heading-repeat-max",
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

  it("the only error of a plain case is MTL608 (no MTL607, no MTL605)", async () => {
    for (const name of [
      "fail-count-above-maximum-anchors-instance-max-plus-one",
      "fail-max-then-min-tags-both-apply",
      "fail-min-then-max-tags-both-apply",
      "fail-min-above-max-three-instances-gives-mtl608-only",
      "fail-two-max-tags-the-first-wins",
      "fail-conditional-above-maximum",
    ]) {
      const expectedLine = name === "fail-conditional-above-maximum" ? 9 : 11;
      expect(await errorsOf(name)).toEqual([[CODE, expectedLine]]);
    }
  });

  it("min above max: two instances give MTL607 on the first instance and no MTL608", async () => {
    expect(await errorsOf("pass-min-above-max-two-instances-gives-mtl607-only")).toEqual([
      ["MTL607", 7],
    ]);
  });

  it("passing cases have no error at all", async () => {
    for (const name of [
      "pass-count-equal-to-maximum",
      "pass-no-max-tag-has-no-maximum",
      "pass-min-only-tag-is-no-maximum",
      "pass-two-max-tags-the-first-is-met",
      "pass-repeat-tag-without-pattern-is-ignored",
    ]) {
      expect(await errorsOf(name)).toEqual([]);
    }
  });

  it("no repeat heading after an invalid pattern: no MTL608", async () => {
    expect(
      (await lintAll("pass-invalid-pattern-is-no-repeat-heading")).map((item) => item.code),
    ).not.toContain(CODE);
  });

  it("section scope: findings follow the parent instances (line 11, then line 21)", async () => {
    expect(await errorsOf("fail-section-scope-one-finding-per-parent-instance")).toEqual([
      [CODE, 11],
      [CODE, 21],
    ]);
  });

  it("disable-line on the anchor: the baseline plus one directive", async () => {
    const result = await lintResult("pass-disable-line-on-the-anchor-silences-it");
    expect(result.diagnostics).toEqual([]);
    expect(result.suppressed).toBe(1);
  });

  it("disable-line on instance 4 does not silence the finding on instance 3", async () => {
    const result = await lintResult("fail-disable-line-on-another-instance-does-not-silence-it");
    expect(result.diagnostics.map((item) => [item.code, anchorLineOf(item)])).toContainEqual([
      CODE,
      11,
    ]);
    expect(result.suppressed).toBe(0);
  });

  it("disable-file silences it", async () => {
    const result = await lintResult("pass-disable-file-silences-it");
    expect(result.diagnostics).toEqual([]);
    expect(result.suppressed).toBe(1);
  });

  it("unchecked child: only the parent's own finding, no MTL608", async () => {
    expect(await errorsOf("pass-child-under-absent-parent-is-not-checked")).toEqual([
      ["MTL601", null],
    ]);
    expect(await errorsOf("pass-child-under-mismatched-parent-is-not-checked")).toEqual([
      ["MTL606", 7],
    ]);
    expect(await errorsOf("pass-child-under-template-only-parent-is-not-checked")).toEqual([
      ["MTL603", 7],
    ]);
  });

  it("worked example 1, variant maximum: MTL608 is printed first, no MTL607", async () => {
    const found = await lintAll("fail-worked-example-1-maximum-two-with-three-instances");
    expect(found[0]?.code).toBe(CODE);
    expect(found.filter((diagnostic) => diagnostic.code === "MTL607")).toEqual([]);
  });
});
