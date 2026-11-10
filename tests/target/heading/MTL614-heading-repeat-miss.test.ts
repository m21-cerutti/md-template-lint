/**
 * MTL614 heading-repeat-miss (src/rules/heading.ts, docs/spec.md 2.10 step 4 and "Repeat
 * rules", 4.3, 4.4 DIR5 to DIR7, 8.1). The tail siblings of a run whose text matches the pattern
 * of a repeat heading T, and that no earlier repeat heading of the sequence lists, are ONE error
 * per repeat set (per parent instance in section scope), anchored on the first listed heading,
 * `{count}` and `{pylist}` the listed headings in file order. A tail sibling is listed under the
 * first repeat heading, in template order, whose pattern it matches. A tail sibling matching no
 * repeat pattern is no MTL614 (it is the warning MTL616, phase P7f). Every expected value is
 * derived from the spec by hand.
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate, lintTarget } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { anchorLineOf, createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL614";
const DIR = "tests/fixtures/pairs/MTL614";

interface Expected {
  readonly message: string;
  /** Target anchor line (DIR5): the first listed tail heading. */
  readonly line: number;
  /** Spec 8.1: the text of the first listed tail heading. */
  readonly heading: string;
}

interface TestCase {
  readonly name: string;
  readonly expected: readonly Expected[];
}

/**
 * Spec 4.3: `{in}{count} heading(s) match [pattern:"{pattern}"] after the end of its run
 * [repeat-rules:same-level]: {pylist}`.
 */
const repeatMiss = (
  pattern: string,
  texts: readonly string[],
  line: number,
  parent: string | null = null,
): Expected => ({
  message:
    `Heading: ${parent === null ? "" : `Section '${parent}': `}${texts.length} heading(s) ` +
    `match [pattern:"${pattern}"] after the end of its run [repeat-rules:same-level]: ` +
    `[${texts.map((text) => `'${text}'`).join(", ")}]`,
  line,
  heading: texts[0] ?? "",
});

/** Case -> fixture dir (same name) -> expected MTL614 findings. At least 1 pass- and 1 fail-. */
const CASES: readonly TestCase[] = [
  // Worked example 1 of 2.10: the run takes lines 9, 15, 21 and stops at line 23 (no `[`); the
  // tail is lines 23 and 25; line 25 matches the release pattern.
  {
    name: "fail-worked-example-one-changelog",
    expected: [repeatMiss("[{semver}] - {date}", ["[0.8.0] - 2025-11-01"], 25)],
  },
  // Owner example G, second target: the run takes line 5, `Hotfix` takes line 7, line 9 is in
  // the tail and matches `{semver}`.
  { name: "fail-owner-example-g-second-target", expected: [repeatMiss("{semver}", ["1.1.0"], 9)] },
  // `Release` takes line 5, `Tag` takes line 7 (`vNext`), `Stray` (line 9) ends the run. Tail:
  // 9, 11, 13. `v0.9.0` (line 11) matches both patterns: listed once, under `Release` (first in
  // template order). `vBeta` (line 13) matches `v{text}` only: listed under `Tag`. `Stray`
  // matches none: no MTL614.
  {
    name: "fail-tail-heading-matching-two-repeat-patterns-is-listed-once",
    expected: [repeatMiss("v{semver}", ["v0.9.0"], 11), repeatMiss("v{text}", ["vBeta"], 13)],
  },
  // `Release` takes line 5; `Stray` (line 7) ends the run. Lines 9 and 11 are in the tail and
  // both match: ONE finding with `{count}` 2 and both texts in file order, anchored on line 9.
  {
    name: "fail-two-tail-headings-are-one-finding-in-file-order",
    expected: [repeatMiss("v{semver}", ["v0.9.0", "v0.8.0"], 9)],
  },
  // Same run, but `Other` (line 11) sits between the two matching tail headings: it matches no
  // pattern, so it is not listed (it stays an extra, the warning MTL616); lines 9 and 13 are.
  {
    name: "fail-extra-heading-between-listed-headings-stays-extra",
    expected: [repeatMiss("v{semver}", ["v0.9.0", "v0.8.0"], 9)],
  },
  // The tail `Notes` (line 11) matches no repeat pattern: no MTL614 (the warning MTL616).
  { name: "pass-non-matching-tail-heading-gets-none", expected: [] },
  // An optional repeat heading meets `Notes` (line 7): no mismatch, zero instances. `v1.0.0`
  // (line 9) is in the tail and matches: MTL614 at zero instances.
  {
    name: "fail-zero-instances-with-matching-tail-heading",
    expected: [repeatMiss("v{semver}", ["v1.0.0"], 9)],
  },
  // Owner example G, second target, `disable-line MTL614` on the anchor (line 9; DIR5, DIR7).
  { name: "pass-disable-line-on-the-anchor-silences-it", expected: [] },
  // Section scope: one repeat set per parent instance; `{in}` is `Section '{parent}': `. Under
  // `v1.0.0`, `### Notes` (line 9) ends the run and `### Step 2` (line 11) is in the tail; under
  // `v0.9.0` the tail is empty.
  {
    name: "fail-section-scope-one-finding-per-parent-instance",
    expected: [repeatMiss("Step {digits}", ["Step 2"], 11, "v1.0.0")],
  },
];

const read = (path: string): string =>
  readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

async function templateOf(name: string) {
  const status = await checkTemplate(registry, read(`${DIR}/${name}/template.md`));
  if (status.status !== "ok") throw new Error("template is broken");
  return status;
}

/** Every diagnostic (after suppression) for the pair of a fixture folder. */
async function lintAll(name: string) {
  const status = await templateOf(name);
  return checkTarget(
    registry,
    status.model,
    read(`${DIR}/${name}/target.md`),
    "target.md",
    createEnv(),
  );
}

/** The errors of a fixture as [code, anchor line], in emission order. */
async function errorsOf(name: string) {
  return (await lintAll(name))
    .filter((diagnostic) => diagnostic.severity === "error")
    .map((diagnostic) => [diagnostic.code, anchorLineOf(diagnostic)]);
}

/** Result of `lintTarget` (findings and suppressed count) for a fixture folder. */
async function lintResult(name: string) {
  const status = await templateOf(name);
  return lintTarget(
    registry,
    status.model,
    read(`${DIR}/${name}/target.md`),
    "target.md",
    createEnv(),
  );
}

describe("MTL614 heading-repeat-miss", () => {
  it("is registered in category heading, error, target step headings", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "heading-repeat-miss",
      category: "heading",
      severity: "error",
      phase: "target",
      step: "headings",
    });
  });

  it("is registered between MTL612 and MTL615 (spec 4.3: same template line, by code)", () => {
    const codes = registry.rules.map((rule) => rule.code);
    expect(codes.indexOf(CODE)).toBe(codes.indexOf("MTL612") + 1);
    expect(codes.indexOf("MTL615")).toBe(codes.indexOf(CODE) + 1);
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

  it("worked example 1: MTL609 (line 21), MTL614 (line 25), then MTL703 (line 17)", async () => {
    expect(await errorsOf("fail-worked-example-one-changelog")).toEqual([
      ["MTL609", 21],
      [CODE, 25],
      ["MTL703", 17],
    ]);
  });

  it("the only errors of the other fail- cases are MTL614", async () => {
    expect(await errorsOf("fail-owner-example-g-second-target")).toEqual([[CODE, 9]]);
    expect(await errorsOf("fail-tail-heading-matching-two-repeat-patterns-is-listed-once")).toEqual(
      [
        [CODE, 11],
        [CODE, 13],
      ],
    );
    // Optional repeat heading: no MTL605 and no MTL606 at zero instances.
    expect(await errorsOf("fail-zero-instances-with-matching-tail-heading")).toEqual([[CODE, 9]]);
    expect(await errorsOf("fail-section-scope-one-finding-per-parent-instance")).toEqual([
      [CODE, 11],
    ]);
  });

  it("{count} is 2 or more: one error lists every matching tail heading", async () => {
    expect(await errorsOf("fail-two-tail-headings-are-one-finding-in-file-order")).toEqual([
      [CODE, 9],
    ]);
    expect(await errorsOf("fail-extra-heading-between-listed-headings-stays-extra")).toEqual([
      [CODE, 9],
    ]);
  });

  it("the heading that broke the run (Stray, line 7) is the MTL616 warning", async () => {
    const warnings = (await lintAll("fail-two-tail-headings-are-one-finding-in-file-order"))
      .filter((diagnostic) => diagnostic.code === "MTL616")
      .map((diagnostic) => ({
        message: diagnostic.message,
        severity: diagnostic.severity,
        line: anchorLineOf(diagnostic),
        heading: diagnostic.heading,
      }));
    expect(warnings).toEqual([
      {
        message: "Heading: 1 extra heading(s) at level H2 after the template headings: ['Stray']",
        severity: "warning",
        line: 7,
        heading: "Stray",
      },
    ]);
  });

  it("a tail heading that is not listed stays an extra: the warning MTL616 names it", async () => {
    // Stray (line 7) and Other (line 11) match no pattern; the listed 9 and 13 are left out.
    const warnings = (await lintAll("fail-extra-heading-between-listed-headings-stays-extra"))
      .filter((diagnostic) => diagnostic.code === "MTL616")
      .map((diagnostic) => diagnostic.message);
    expect(warnings).toEqual([
      "Heading: 2 extra heading(s) at level H2 after the template headings: ['Stray', 'Other']",
    ]);
  });

  it("a non-matching tail heading gives no error at all", async () => {
    expect(await errorsOf("pass-non-matching-tail-heading-gets-none")).toEqual([]);
  });

  it("disable-line on the anchor: no finding, one suppressed", async () => {
    const result = await lintResult("pass-disable-line-on-the-anchor-silences-it");
    expect(result.diagnostics.filter((item) => item.severity === "error")).toEqual([]);
    expect(result.suppressed).toBe(1);
  });
});
