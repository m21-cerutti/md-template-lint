/**
 * MTL609 heading-pattern-order (src/rules/heading.ts, docs/spec.md 2.10 step 3d4 and "Order",
 * 4.3, 4.4 DIR5 to DIR7, 8.1, 8.3). A repeat heading with an effective (first) `[order:...]`
 * tag: the adjacent pairs of its repeat set (consecutive instances WITH an order key, file
 * order) must follow the direction; equal keys pass. One error per repeat set with at least
 * one pair out of order, anchored on the later instance of the FIRST pair out of order,
 * `{count}` the pairs out of order, `{tag}` the order tag in canonical form. Keys: the whole
 * text (code-unit order), the FIRST NUMBER, the FIRST DATE, the FIRST SEMVER (SemVer
 * precedence). Every expected value is derived from the spec by hand.
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate, lintTarget } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { anchorLineOf, createEnv } from "../../../src/engine/rule.js";
import { describeTemplate } from "../../../src/runner/schema.js";

const registry = createRegistry();
const CODE = "MTL609";
const DIR = "tests/fixtures/pairs/MTL609";

interface Expected {
  readonly message: string;
  /** Target anchor line (DIR5): the later instance of the first pair out of order. */
  readonly line: number;
  /** Spec 8.1: the text of the reported target heading. */
  readonly heading: string;
}

interface TestCase {
  readonly name: string;
  readonly expected: readonly Expected[];
}

const outOfOrder = (
  text: string,
  prev: string,
  direction: "ascending" | "descending",
  count: number,
  tag: string,
  line: number,
  parent: string | null = null,
): Expected => ({
  message:
    `Heading: ${parent === null ? "" : `Section '${parent}': `}heading '${text}' is not in ` +
    `${direction} order after '${prev}', ${count} pair(s) out of order ${tag}`,
  line,
  heading: text,
});

const NUMBER_ASC = "[order:first:number:ascending]";
/** Worked example 1 of 2.10: line 21 after line 15, one pair (15-21) out of order. */
const WORKED_1 = (tag: string): Expected =>
  outOfOrder("[1.1.0] - 2026-02-01", "[1.0.0] - 2026-01-10", "descending", 1, tag, 21);
/** `Step 2` (line 11) after `Step 3` (line 9), ascending first number. */
const STEP_3_2 = (count: number): Expected =>
  outOfOrder("Step 2", "Step 3", "ascending", count, NUMBER_ASC, 11);

/** Case -> fixture dir (same name) -> expected MTL609 findings. At least 1 pass- and 1 fail-. */
const CASES: readonly TestCase[] = [
  // Worked example 1 of 2.10: whole texts, pair 9-15 descends, pair 15-21 rises.
  {
    name: "fail-worked-example-1-whole-text-descending",
    expected: [WORKED_1("[order:descending]")],
  },
  // Variant, order by date: 2026-03-01, 2026-01-10, 2026-02-01: the same finding.
  {
    name: "fail-worked-example-1-order-by-date",
    expected: [WORKED_1("[order:first:date:descending]")],
  },
  // Variant, order by version: 1.2.0, 1.0.0, 1.1.0: the same finding (`1 pair(s)`).
  {
    name: "fail-worked-example-1-order-by-semver",
    expected: [WORKED_1("[order:first:semver:descending]")],
  },
  // Variant, no order tag: no MTL609.
  { name: "pass-worked-example-1-without-order-tag", expected: [] },
  // Variant, typo fixed: line 23 `[0.9.0] - 2025-12-01`, 5 instances; pairs 21-23 and 23-25
  // descend, so the finding stays the same (`1 pair(s)`, line 21).
  { name: "fail-worked-example-1-typo-fixed", expected: [WORKED_1("[order:descending]")] },
  // Spec 2.10 "Presence" table: a template-only heading is no pattern heading; its pattern,
  // repeat and order tags are ignored (MTL015): no MTL609 on `Step 2`, `Step 1`.
  { name: "pass-template-only-heading-has-no-repeat-set", expected: [] },
  // Equal first numbers (5, 5) pass under `ascending`, where the whole texts would fall
  // (`Step 5 b` then `Step 5 a`).
  { name: "pass-equal-first-numbers-pass", expected: [] },
  // The lexer is case-insensitive: `[Order:First:Number:Descending]` is the order tag, and
  // `{tag}` prints its canonical lowercase form (spec 4.3).
  {
    name: "fail-mixed-case-order-tag-printed-lowercase",
    expected: [
      outOfOrder("Step 2", "Step 1", "descending", 1, "[order:first:number:descending]", 9),
    ],
  },
  // Keys 1, 3, 2, 4, 0: pairs 3-2 and 4-0 fall: ONE finding, on the first (line 11), 2 pairs.
  { name: "fail-two-pairs-out-of-order-give-one-finding", expected: [STEP_3_2(2)] },
  // Equal keys pass: two equal first dates then a lower one (descending); equal whole texts.
  { name: "pass-equal-dates-pass", expected: [] },
  { name: "pass-equal-whole-texts-pass", expected: [] },
  // Owner example K (worked example 7): first numbers 1, 10, 9, none: one finding on line 9.
  {
    name: "fail-owner-example-k-first-number-ascending",
    expected: [outOfOrder("Step 9 - Test", "Step 10 - Deploy", "ascending", 1, NUMBER_ASC, 9)],
  },
  // K, variant `[order:ascending]`: the four whole texts are in ascending string order.
  { name: "pass-owner-example-k-string-order-variant", expected: [] },
  // Owner example J: `Epic A - Setup` is below `Epic B - Release`: no finding.
  { name: "pass-owner-example-j-epic-a-before-epic-b", expected: [] },
  // J swapped: `Epic A - Setup` (line 9) after `Epic B - Release` is out of ascending order.
  {
    name: "fail-owner-example-j-epic-b-before-epic-a",
    expected: [
      outOfOrder("Epic A - Setup", "Epic B - Release", "ascending", 1, "[order:ascending]", 9),
    ],
  },
  // `Temp -3`: the `-` after a space belongs to the number: -3 is below 1.
  {
    name: "fail-negative-first-number",
    expected: [outOfOrder("Temp -3", "Temp 1", "ascending", 1, NUMBER_ASC, 9)],
  },
  // `Epic-1`, `Epic-2`: a `-` after a letter is no sign: 1 then 2 ascend.
  { name: "pass-hyphen-after-letter-is-no-sign", expected: [] },
  // `2e3` is 2000, above 500 (string order would pass: `2` below `5`).
  {
    name: "fail-scientific-first-number",
    expected: [outOfOrder("Run 500 steps", "Run 2e3 steps", "ascending", 1, NUMBER_ASC, 9)],
  },
  // Spec 2.10: `-1.5` is below `1e0`.
  { name: "pass-negative-decimal-below-scientific-one", expected: [] },
  // `Sprint 2026-02-30 / 2026-03-02`: 2026-02-30 fails the calendar test and is skipped, the
  // key is 2026-03-02, above the next key 2026-03-01: out of ascending order.
  {
    name: "fail-invalid-date-is-skipped-by-the-scan",
    expected: [
      outOfOrder(
        "Sprint 2026-03-01",
        "Sprint 2026-02-30 / 2026-03-02",
        "ascending",
        1,
        "[order:first:date:ascending]",
        9,
      ),
    ],
  },
  // `[1.10.0]` then `[1.9.0]`: as strings `[1.1` is below `[1.9`, so the pair rises.
  {
    name: "fail-version-ten-before-nine-whole-text-descending",
    expected: [
      outOfOrder(
        "[1.9.0] - 2026-03-15",
        "[1.10.0] - 2026-04-01",
        "descending",
        1,
        "[order:descending]",
        9,
      ),
    ],
  },
  // The same headings by version (1.10.0 above 1.9.0) and by date: in descending order.
  { name: "pass-version-ten-before-nine-semver-descending", expected: [] },
  { name: "pass-version-ten-before-nine-date-descending", expected: [] },
  // A pre-release is below its release: `v2.0.0-rc.1` after `v2.0.0` falls.
  {
    name: "fail-pre-release-below-its-release",
    expected: [
      outOfOrder("v2.0.0-rc.1", "v2.0.0", "ascending", 1, "[order:first:semver:ascending]", 9),
    ],
  },
  // alpha < alpha.1 < rc.2 < rc.10 (numeric identifiers by value) < the release.
  { name: "pass-pre-releases-before-their-release", expected: [] },
  // `1.0.0+b` and `1.0.0+a` are equal keys (build metadata ignored).
  { name: "pass-build-metadata-ignored", expected: [] },
  // `v10.0.0` is read as 10.0.0, above 2.0.0: out of descending order.
  {
    name: "fail-v-prefix-read-as-semver",
    expected: [
      outOfOrder(
        "Release v10.0.0",
        "Release v2.0.0",
        "descending",
        1,
        "[order:first:semver:descending]",
        9,
      ),
    ],
  },
  // Section scope: one repeat set per parent instance; `{in}` is `Section '{parent}': `.
  // v1.0.0: 2, 1 (one pair, line 11); v1.1.0: 1, 2 (none); v1.2.0: 3, 2, 1 (two, line 23).
  {
    name: "fail-section-scope-one-finding-per-parent-instance",
    expected: [
      outOfOrder("Step 1", "Step 2", "ascending", 1, NUMBER_ASC, 11, "v1.0.0"),
      outOfOrder("Step 2", "Step 3", "ascending", 2, NUMBER_ASC, 23, "v1.2.0"),
    ],
  },
  // `disable-line MTL609` on the anchor (line 11; DIR5, DIR7): silenced.
  { name: "pass-disable-line-on-the-anchor-silences-it", expected: [] },
  // Negative control: the directive on line 13 does not cover the anchor.
  { name: "fail-disable-line-on-another-line-does-not-silence-it", expected: [STEP_3_2(1)] },
  { name: "pass-disable-file-silences-it", expected: [] },
  // Two order tags: the first is effective (`descending`: 1 then 2 rises).
  {
    name: "fail-two-order-tags-the-first-wins",
    expected: [outOfOrder("Step 2", "Step 1", "descending", 1, "[order:descending]", 9)],
  },
  { name: "pass-two-order-tags-the-first-is-met", expected: [] },
  // No repeat heading: an invalid pattern (MTL014), no pattern (MTL015), no repeat tag (MTL030).
  { name: "pass-invalid-pattern-gives-no-order-finding", expected: [] },
  { name: "pass-repeat-tag-without-pattern-gives-no-order-finding", expected: [] },
  { name: "pass-order-tag-without-repeat-tag-gives-no-order-finding", expected: [] },
  // Spec 2.6 "Checked": parent absent (MTL601), parent taken as a mismatch (MTL606),
  // template-only parent (MTL603): the child is not checked, never reported.
  { name: "pass-child-under-absent-parent-is-not-checked", expected: [] },
  { name: "pass-child-under-mismatched-parent-is-not-checked", expected: [] },
  { name: "pass-child-under-template-only-parent-is-not-checked", expected: [] },
  // `[presence:conditional:...]` plays no part in the order.
  {
    name: "fail-conditional-presence-out-of-order",
    expected: [outOfOrder("Step 2", "Step 1", "descending", 1, "[order:descending]", 9)],
  },
  // Step 3d2: `Notes` (line 13) ends the run; `Step 0` (line 15) is in the tail, not a pair.
  {
    name: "fail-stray-heading-breaks-the-run-orders-only-the-first-run",
    expected: [STEP_3_2(1)],
  },
  { name: "pass-stray-heading-ends-the-run-before-a-pair-out-of-order", expected: [] },
  // `Step four - b` has no first number: skipped, so the pair is 1 (line 7) then 0 (line 11).
  {
    name: "fail-instance-without-key-is-skipped-from-the-pairs",
    expected: [outOfOrder("Step 0 - c", "Step 1 - a", "ascending", 1, NUMBER_ASC, 11)],
  },
  // Keys 1 and 2 around the keyless instance: in order (the keyless one is MTL617, P7h).
  { name: "pass-instance-without-key-gives-no-order-finding", expected: [] },
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

/** The errors of a fixture as [code, anchor line]. */
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

describe("MTL609 heading-pattern-order", () => {
  it("is registered in category heading, error, target step headings", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "heading-pattern-order",
      category: "heading",
      severity: "error",
      phase: "target",
      step: "headings",
    });
  });

  it("is registered right after MTL608", () => {
    const codes = registry.rules.map((rule) => rule.code);
    expect(codes.indexOf(CODE)).toBe(codes.indexOf("MTL608") + 1);
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

  it("the only error of a plain case is MTL609", async () => {
    for (const [name, line] of [
      ["fail-two-pairs-out-of-order-give-one-finding", 11],
      ["fail-negative-first-number", 9],
      ["fail-scientific-first-number", 9],
      ["fail-invalid-date-is-skipped-by-the-scan", 9],
      ["fail-pre-release-below-its-release", 9],
      ["fail-v-prefix-read-as-semver", 9],
      ["fail-two-order-tags-the-first-wins", 9],
      ["fail-conditional-presence-out-of-order", 9],
    ] as const) {
      expect(await errorsOf(name)).toEqual([[CODE, line]]);
    }
  });

  it("the keyless instance (line 9) is MTL617, printed after MTL609 (same template line, by code)", async () => {
    expect(await errorsOf("fail-instance-without-key-is-skipped-from-the-pairs")).toEqual([
      [CODE, 11],
      ["MTL617", 9],
    ]);
  });

  it("worked example 1: MTL609 (template line 9) before MTL703 (template line 11)", async () => {
    const codes = (await errorsOf("fail-worked-example-1-whole-text-descending")).map(
      ([code]) => code,
    );
    expect(codes.filter((code) => code === CODE || code === "MTL703")).toEqual([CODE, "MTL703"]);
  });

  it("worked example 1, variant maximum: MTL608 is printed before MTL609 (codes in order)", async () => {
    const fixture =
      "tests/fixtures/pairs/MTL608/fail-worked-example-1-maximum-two-with-three-instances";
    const status = await checkTemplate(registry, read(`${fixture}/template.md`));
    if (status.status !== "ok") throw new Error("template is broken");
    const found = await checkTarget(
      registry,
      status.model,
      read(`${fixture}/target.md`),
      "target.md",
      createEnv(),
    );
    const codes = found.map((diagnostic) => diagnostic.code);
    expect(codes.slice(0, 2)).toEqual(["MTL608", CODE]);
  });

  it("owner example K: the instance without number gives no MTL609 of its own", async () => {
    // Worked example 7 K: the instance without number is MTL617 (line 11), sorted after MTL609.
    expect(await errorsOf("fail-owner-example-k-first-number-ascending")).toEqual([
      [CODE, 9],
      ["MTL617", 11],
    ]);
  });

  it("passing cases have no error at all", async () => {
    for (const name of [
      "pass-equal-dates-pass",
      "pass-equal-whole-texts-pass",
      "pass-owner-example-k-string-order-variant",
      "pass-hyphen-after-letter-is-no-sign",
      "pass-negative-decimal-below-scientific-one",
      "pass-version-ten-before-nine-semver-descending",
      "pass-version-ten-before-nine-date-descending",
      "pass-pre-releases-before-their-release",
      "pass-build-metadata-ignored",
      "pass-two-order-tags-the-first-is-met",
    ]) {
      expect(await errorsOf(name)).toEqual([]);
    }
  });

  it("the keyless instance between two keyed ones in order is MTL617 only (line 9)", async () => {
    expect(await errorsOf("pass-instance-without-key-gives-no-order-finding")).toEqual([
      ["MTL617", 9],
    ]);
  });

  it("invalid pattern: the template has MTL014 and the target no MTL609", async () => {
    const status = await templateOf("pass-invalid-pattern-gives-no-order-finding");
    expect(status.warnings.map((diagnostic) => diagnostic.code)).toContain("MTL014");
    expect(
      (await lintAll("pass-invalid-pattern-gives-no-order-finding")).map((item) => item.code),
    ).not.toContain(CODE);
  });

  it("repeat tag without pattern: the template has MTL015 and the target no MTL609", async () => {
    const status = await templateOf("pass-repeat-tag-without-pattern-gives-no-order-finding");
    expect(status.warnings.map((diagnostic) => diagnostic.code)).toEqual(["MTL015", "MTL015"]);
  });

  it("section scope: findings follow the parent instances (line 11, then line 23)", async () => {
    expect(await errorsOf("fail-section-scope-one-finding-per-parent-instance")).toEqual([
      [CODE, 11],
      [CODE, 23],
    ]);
  });

  it("disable-line on the anchor: the baseline plus one directive", async () => {
    const result = await lintResult("pass-disable-line-on-the-anchor-silences-it");
    expect(result.diagnostics).toEqual([]);
    expect(result.suppressed).toBe(1);
  });

  it("disable-line on another line does not silence the finding on line 11", async () => {
    const result = await lintResult("fail-disable-line-on-another-line-does-not-silence-it");
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

  it("unchecked child: only the parent's own finding, no MTL609", async () => {
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
});

/** The `--verify` heading tokens (spec 8.3) of a one-heading template. */
async function headingTokens(tags: string): Promise<readonly string[]> {
  const status = await checkTemplate(registry, `---\ntitle: "string"\n---\n\n## Step ${tags}\n`);
  if (status.status !== "ok") throw new Error("template is broken");
  return describeTemplate(status.model).headings[0]?.rules ?? [];
}

describe("MTL609 --verify order tokens (spec 8.3)", () => {
  const forms = [
    "order:ascending",
    "order:descending",
    "order:first:number:ascending",
    "order:first:number:descending",
    "order:first:date:ascending",
    "order:first:date:descending",
    "order:first:semver:ascending",
    "order:first:semver:descending",
  ];
  for (const form of forms) {
    it(`[${form}] prints as ${form}, after the pattern and repeat tokens`, async () => {
      expect(
        await headingTokens(
          `[${form}] [content:list] [repeat-rules:same-level:max:3] [pattern:"Step {digits}"] [repeat-rules:same-level]`,
        ),
      ).toEqual([
        "presence:required",
        'pattern:"Step {digits}"',
        "repeat-rules:same-level",
        "repeat-rules:same-level:max:3",
        form,
        "content:list",
      ]);
    });
  }

  it("prints the first order tag only", async () => {
    expect(await headingTokens("[order:first:date:descending] [order:ascending]")).toEqual([
      "presence:required",
      "order:first:date:descending",
    ]);
  });
});
