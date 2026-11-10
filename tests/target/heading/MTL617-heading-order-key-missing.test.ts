/**
 * MTL617 heading-order-key-missing (src/rules/heading.ts, docs/spec.md 2.10 step 3d4 and "Order",
 * 4.3, 4.4 DIR5 to DIR7, 8.1). A repeat heading whose effective (first) `[order:...]` tag is a
 * `first:` form: ONE error per repeat set (per parent instance in section scope), at any `n` of
 * 1 or more, when at least one instance has no ORDER KEY; anchored on the first such instance,
 * `{count}` and `{pylist}` the keyless instances in file order, `{kind}` and `{placeholder}` the
 * keyword of the form, `{tag}` the order tag in canonical lowercase. The whole-text forms never
 * give it. Every expected value is derived from the spec by hand.
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate, lintTarget } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { anchorLineOf, createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL617";
const DIR = "tests/fixtures/pairs/MTL617";

interface Expected {
  readonly message: string;
  /** Target anchor line (DIR5): the first instance without order key. */
  readonly line: number;
  /** Spec 8.1: the text of the first listed heading. */
  readonly heading: string;
}

interface TestCase {
  readonly name: string;
  readonly expected: readonly Expected[];
}

/**
 * Spec 4.3: `{in}{count} heading(s) have no {kind} to order by {tag}, use a [pattern:...] with
 * {placeholder}: {pylist}`. `{kind}` and `{placeholder}` are separate literals, so a source that
 * swaps or derives one from the other wrongly is caught. `pylist` defaults to the plain
 * single-quoted texts; a case with quotes, backslashes or non-ASCII text passes it as written.
 */
const keyMissing = (
  kind: "number" | "date" | "semver",
  placeholder: "{number}" | "{date}" | "{semver}",
  tag: string,
  texts: readonly string[],
  line: number,
  parent: string | null = null,
  pylist: string = `[${texts.map((text) => `'${text}'`).join(", ")}]`,
): Expected => ({
  message:
    `Heading: ${parent === null ? "" : `Section '${parent}': `}${texts.length} heading(s) have ` +
    `no ${kind} to order by ${tag}, use a [pattern:...] with ${placeholder}: ${pylist}`,
  line,
  heading: texts[0] ?? "",
});

const NUMBER_ASC = "[order:first:number:ascending]";
const SEMVER_ASC = "[order:first:semver:ascending]";
const SEMVER_DESC = "[order:first:semver:descending]";

/** Case -> fixture dir (same name) -> expected MTL617 findings. At least 1 pass- and 1 fail-. */
const CASES: readonly TestCase[] = [
  // Owner example K (worked example 7): first numbers 1, 10, 9, none: line 11 has no number.
  {
    name: "fail-owner-example-k-first-number-ascending",
    expected: [keyMissing("number", "{number}", NUMBER_ASC, ["Step four - Review"], 11)],
  },
  // K, semver variant (spec 2.10, A72n): no heading holds a SEMVER: 4 headings, anchor line 5.
  {
    name: "fail-owner-example-k-semver-variant",
    expected: [
      keyMissing(
        "semver",
        "{semver}",
        SEMVER_ASC,
        ["Step 1 - Install", "Step 10 - Deploy", "Step 9 - Test", "Step four - Review"],
        5,
      ),
    ],
  },
  // K, `[order:ascending]` variant: every instance has its whole text as key: no finding.
  { name: "pass-owner-example-k-string-order-variant", expected: [] },
  // A set of one instance (n is 1) without a number.
  {
    name: "fail-one-instance-without-number",
    expected: [keyMissing("number", "{number}", NUMBER_ASC, ["Step one"], 7)],
  },
  { name: "pass-one-instance-with-number", expected: [] },
  // Zero instances (optional heading, n is 0): no repeat set to report.
  { name: "pass-zero-instances-give-none", expected: [] },
  // `Sprint 2026-10` holds no ISO DATE (spec 2.10): the date form finds no key on line 9.
  {
    name: "fail-date-form-without-date",
    expected: [
      keyMissing("date", "{date}", "[order:first:date:descending]", ["Sprint 2026-10"], 9),
    ],
  },
  // `Release 1.2` (a `{number}` value) has two parts, no SEMVER (spec 2.10): no key, line 7.
  {
    name: "fail-semver-form-on-two-part-release",
    expected: [keyMissing("semver", "{semver}", SEMVER_DESC, ["Release 1.2"], 7)],
  },
  { name: "pass-every-instance-keyed", expected: [] },
  // Whole-text form: `Step one` then `Step four` descend (`o` above `f`); never MTL617.
  { name: "pass-whole-text-descending-never-gives-it", expected: [] },
  // `disable-line MTL617` on the anchor (line 9; DIR5, DIR7): silenced.
  { name: "pass-disable-line-on-the-anchor-silences-it", expected: [] },
  // Negative control: the directive sits on the second keyless instance (line 11), not on the
  // anchor (line 7): the one finding stays, listing both.
  {
    name: "fail-disable-line-on-another-keyless-instance-does-not-silence-it",
    expected: [keyMissing("number", "{number}", NUMBER_ASC, ["Step one", "Step three"], 7)],
  },
  { name: "pass-disable-file-silences-it", expected: [] },
  // Section scope: one repeat set per parent instance; `{in}` is `Section '{parent}': `.
  // v1.0.0: `Step one` (line 9); v1.1.0: all keyed; v1.2.0: `Step two`, `Step three` (line 23).
  {
    name: "fail-section-scope-one-finding-per-parent-instance",
    expected: [
      keyMissing("number", "{number}", NUMBER_ASC, ["Step one"], 9, "v1.0.0"),
      keyMissing("number", "{number}", NUMBER_ASC, ["Step two", "Step three"], 23, "v1.2.0"),
    ],
  },
  // Invalid pattern (MTL014): no repeat heading, no repeat set.
  { name: "pass-invalid-pattern-gives-none", expected: [] },
  // Spec 2.6 "Checked": parent absent (MTL601), parent taken as a mismatch (MTL606),
  // template-only parent (MTL603): the child is not checked, never reported.
  { name: "pass-child-under-absent-parent-is-not-checked", expected: [] },
  { name: "pass-child-under-mismatched-parent-is-not-checked", expected: [] },
  { name: "pass-child-under-template-only-parent-is-not-checked", expected: [] },
  // Two order tags: the first (`first:date`) is effective: neither instance holds a date (the
  // second tag, `first:number`, would find keys in both).
  {
    name: "fail-two-order-tags-the-first-wins",
    expected: [
      keyMissing(
        "date",
        "{date}",
        "[order:first:date:ascending]",
        ["Step 1 - Install", "Step 2 - Test"],
        7,
      ),
    ],
  },
  // The first tag is the whole-text form: never MTL617, though the second is `first:number`.
  { name: "pass-two-order-tags-whole-text-first-wins", expected: [] },
  // `[Order:First:Semver:Descending]` is the order tag; `{tag}` prints it lowercase.
  {
    name: "fail-mixed-case-order-tag-printed-lowercase",
    expected: [keyMissing("semver", "{semver}", SEMVER_DESC, ["Release next"], 7)],
  },
  // Step 3d2: `Notes` (line 11) ends the run; `Step three` (line 13) is in the tail, no instance.
  {
    name: "fail-stray-heading-breaks-the-run",
    expected: [keyMissing("number", "{number}", NUMBER_ASC, ["Step two"], 9)],
  },
  // `[presence:conditional:...]` plays no part.
  {
    name: "fail-conditional-presence-without-number",
    expected: [keyMissing("number", "{number}", NUMBER_ASC, ["Step one"], 7)],
  },
  // `Step one` (line 7) has no number; keyed 2 (line 9) then 1 (line 11) fall: MTL609 on line 11.
  {
    name: "fail-keyless-before-pair-out-of-order-sorts-by-code",
    expected: [keyMissing("number", "{number}", NUMBER_ASC, ["Step one"], 7)],
  },
  // `Step 0 - x` has the first number 0, a key (not keyless): only `Step four` (line 9) is listed.
  {
    name: "fail-zero-is-a-number-key",
    expected: [keyMissing("number", "{number}", NUMBER_ASC, ["Step four"], 9)],
  },
  // The order tag sits on a `[presence:template-only]` heading: no pattern heading, its pattern,
  // repeat and order tags are ignored (MTL015, spec 2.10 "Presence" table): no repeat set.
  { name: "pass-template-only-heading-gives-none", expected: [] },
  // `{pylist}` is a Python repr list (Q02): `Step it's` holds `'` and no `"`, so it is
  // double-quoted; `Étape` stays as is; the backslash of `Step a\b` is doubled.
  {
    name: "fail-quote-backslash-and-non-ascii-texts-escaped",
    expected: [
      keyMissing(
        "number",
        "{number}",
        NUMBER_ASC,
        ["Step it's", "Step Étape", "Step a\\b"],
        7,
        null,
        `["Step it's", 'Step Étape', 'Step a\\\\b']`,
      ),
    ],
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

describe("MTL617 heading-order-key-missing", () => {
  it("is registered in category heading, error, target step headings", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "heading-order-key-missing",
      category: "heading",
      severity: "error",
      phase: "target",
      step: "headings",
    });
  });

  it("is registered right after MTL616 (spec 4.3: same template line, by code)", () => {
    const codes = registry.rules.map((rule) => rule.code);
    expect(codes.indexOf(CODE)).toBe(codes.indexOf("MTL616") + 1);
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

  it("owner example K: MTL609 on line 9, then MTL617 on line 11 (same template line, by code)", async () => {
    expect(await errorsOf("fail-owner-example-k-first-number-ascending")).toEqual([
      ["MTL609", 9],
      [CODE, 11],
    ]);
  });

  it("owner example K, semver variant: no keyed pair, so MTL617 alone", async () => {
    expect(await errorsOf("fail-owner-example-k-semver-variant")).toEqual([[CODE, 5]]);
  });

  it("keyless first, pair out of order later: MTL609 (line 11) still sorts before MTL617 (line 7)", async () => {
    const found = await lintAll("fail-keyless-before-pair-out-of-order-sorts-by-code");
    expect(
      found
        .filter((diagnostic) => diagnostic.severity === "error")
        .map((diagnostic) => [diagnostic.code, anchorLineOf(diagnostic)]),
    ).toEqual([
      ["MTL609", 11],
      [CODE, 7],
    ]);
    expect(found.find((diagnostic) => diagnostic.code === "MTL609")?.message).toBe(
      "Heading: heading 'Step 1 - Install' is not in ascending order after 'Step 2 - Test', " +
        "1 pair(s) out of order " +
        NUMBER_ASC,
    );
  });

  it("the only error of a plain case is MTL617", async () => {
    for (const [name, line] of [
      ["fail-one-instance-without-number", 7],
      ["fail-date-form-without-date", 9],
      ["fail-semver-form-on-two-part-release", 7],
      ["fail-two-order-tags-the-first-wins", 7],
      ["fail-mixed-case-order-tag-printed-lowercase", 7],
      ["fail-conditional-presence-without-number", 7],
      ["fail-zero-is-a-number-key", 9],
      ["fail-quote-backslash-and-non-ascii-texts-escaped", 7],
      ["fail-disable-line-on-another-keyless-instance-does-not-silence-it", 7],
    ] as const) {
      expect(await errorsOf(name)).toEqual([[CODE, line]]);
    }
  });

  it("passing cases have no error at all", async () => {
    for (const name of [
      "pass-owner-example-k-string-order-variant",
      "pass-one-instance-with-number",
      "pass-zero-instances-give-none",
      "pass-every-instance-keyed",
      "pass-whole-text-descending-never-gives-it",
      "pass-two-order-tags-whole-text-first-wins",
      "pass-template-only-heading-gives-none",
    ]) {
      expect(await errorsOf(name)).toEqual([]);
    }
  });

  it("section scope: findings follow the parent instances (line 9, then line 23)", async () => {
    expect(await errorsOf("fail-section-scope-one-finding-per-parent-instance")).toEqual([
      [CODE, 9],
      [CODE, 23],
    ]);
  });

  it("stray heading: the tail instance is not listed", async () => {
    const codes = (await errorsOf("fail-stray-heading-breaks-the-run")).filter(
      ([code]) => code === CODE,
    );
    expect(codes).toEqual([[CODE, 9]]);
  });

  it("invalid pattern: the template has MTL014 and the target no MTL617", async () => {
    const status = await templateOf("pass-invalid-pattern-gives-none");
    expect(status.warnings.map((diagnostic) => diagnostic.code)).toContain("MTL014");
    expect(
      (await lintAll("pass-invalid-pattern-gives-none")).map((item) => item.code),
    ).not.toContain(CODE);
  });

  it("order tag on a template-only heading: the template has MTL015, the target no MTL617", async () => {
    const status = await templateOf("pass-template-only-heading-gives-none");
    expect(status.warnings.map((diagnostic) => diagnostic.code)).toContain("MTL015");
    expect(
      (await lintAll("pass-template-only-heading-gives-none")).map((item) => item.code),
    ).not.toContain(CODE);
  });

  it("disable-line on the anchor: the baseline plus one directive", async () => {
    const result = await lintResult("pass-disable-line-on-the-anchor-silences-it");
    expect(result.diagnostics).toEqual([]);
    expect(result.suppressed).toBe(1);
  });

  it("disable-line on another keyless instance does not silence the finding on line 7", async () => {
    const result = await lintResult(
      "fail-disable-line-on-another-keyless-instance-does-not-silence-it",
    );
    expect(result.diagnostics.map((item) => [item.code, anchorLineOf(item)])).toEqual([[CODE, 7]]);
    expect(result.suppressed).toBe(0);
  });

  it("disable-file silences it", async () => {
    const result = await lintResult("pass-disable-file-silences-it");
    expect(result.diagnostics).toEqual([]);
    expect(result.suppressed).toBe(1);
  });

  it("unchecked child: only the parent's own finding, no MTL617", async () => {
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
