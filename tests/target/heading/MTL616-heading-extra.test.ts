/**
 * MTL616 heading-extra (src/rules/heading.ts, docs/spec.md 2.6 "Extra", 2.10 step 4 and
 * "Interplay", 4.3, 4.4 DIR5 to DIR7, 8.1), the only WARNING of the heading category. The tail
 * headings of a run (one sequence in one scope) that no error names (MTL612 with its stray
 * block, MTL614, MTL615) are ONE warning per run, anchored on the first listed heading, sorted
 * by the template line of the last position of the sequence. A level and scope without
 * template heading has no run and no tail. Every expected value is derived from the spec by
 * hand.
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate, lintTarget } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { anchorLineOf, createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL616";
const DIR = "tests/fixtures/pairs/MTL616";

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
  /** Every error of the fixture as [code, anchor line], in emission order. */
  readonly errors: readonly (readonly [string, number | null])[];
  /** Diagnostics removed by the disable directives of the target (DIR9). */
  readonly suppressed: number;
}

/**
 * Spec 4.3: `{in}{count} extra heading(s) at level H{n} after the template headings:
 * {pylist}`.
 */
const extra = (level: number, texts: readonly string[], line: number, parent: string | null = null): Expected => ({
  message: `Heading: ${parent === null ? "" : `Section '${parent}': `}${texts.length} extra ` + `heading(s) at level H${level} after the template headings: ` + `[${texts.map((text) => `'${text}'`).join(", ")}]`,
  line,
  heading: texts[0] ?? "",
});

/** Worked example 6 of 2.10, the two warnings of the base target. */
const SIX_UNRELEASED = extra(3, ["Added"], 11, "Unreleased");
const SIX_LEVEL_TWO = extra(2, ["1.1.0 - 2026-02-01", "Links"], 21);
/** Worked example 6 of 2.10, the errors: MTL612 (template line 7), MTL614 and MTL615 (11). */
const SIX_ERRORS = [
  ["MTL612", 13],
  ["MTL614", 23],
  ["MTL615", 19],
] as const;

/** Case -> fixture dir (same name) -> expected MTL616 findings. At least 1 pass- and 1 fail-. */
const CASES: readonly TestCase[] = [
  // Worked example 6 of 2.10: the level-2 tail is lines 21, 23, 25; line 23 is MTL614, so one
  // warning lists 21 and 25. Under `Unreleased`, line 13 is MTL612 and line 11 is listed. Under
  // the instance line 15, line 19 is MTL615: empty list, no warning. `### Added` (template line
  // 9) sorts before `## Release` (template line 11).
  {
    name: "fail-worked-example-six-changelog",
    expected: [SIX_UNRELEASED, SIX_LEVEL_TWO],
    errors: SIX_ERRORS,
    suppressed: 0,
  },
  // Variant, no no-extra tag: line 19 gets no MTL615, so the run of the instance line 15 lists
  // it, printed last (its last position, `### Added` on template line 13, follows line 11).
  {
    name: "fail-worked-example-six-without-no-extra-tag",
    expected: [SIX_UNRELEASED, SIX_LEVEL_TWO, extra(3, ["Notes"], 19, "[1.2.0] - 2026-03-01")],
    errors: [
      ["MTL612", 13],
      ["MTL614", 23],
    ],
    suppressed: 0,
  },
  // Variant, no repeat match in the tail: line 23 reads `## Links 2`, no MTL614.
  {
    name: "fail-worked-example-six-no-repeat-match-in-tail",
    expected: [SIX_UNRELEASED, extra(2, ["1.1.0 - 2026-02-01", "Links 2", "Links"], 21)],
    errors: [
      ["MTL612", 13],
      ["MTL615", 19],
    ],
    suppressed: 0,
  },
  // Variant, `disable-line MTL616` on the anchor (line 21): the whole level-2 warning goes.
  {
    name: "fail-worked-example-six-disable-line-on-the-anchor",
    expected: [SIX_UNRELEASED],
    errors: SIX_ERRORS,
    suppressed: 1,
  },
  // Variant, the same directive on line 25, a later listed line, not the anchor: no effect.
  {
    name: "fail-worked-example-six-disable-line-on-a-later-listed-line",
    expected: [SIX_UNRELEASED, SIX_LEVEL_TWO],
    errors: SIX_ERRORS,
    suppressed: 0,
  },
  // `disable-file MTL616` on worked example 6: both warnings go, the errors stay.
  {
    name: "pass-disable-file-silences-every-warning",
    expected: [],
    errors: SIX_ERRORS,
    suppressed: 2,
  },
  // Worked example 1 of 2.6: `# Guide` takes line 5; line 7 `# Context` is in the level-1 tail.
  // `## Context` is MTL601; `### Decision` is not checked (its parent has no match).
  {
    name: "fail-worked-example-one-exact-level-mismatch",
    expected: [extra(1, ["Context"], 7)],
    errors: [["MTL601", null]],
    suppressed: 0,
  },
  // Worked example 1 of 2.6, variant: `#### Decision` (line 9) is in no run: free detail.
  {
    name: "pass-worked-example-one-deeper-level-is-free-detail",
    expected: [],
    errors: [["MTL610", 7]],
    suppressed: 0,
  },
  // Worked example 1 of 2.6 with `disable-line MTL616` on the anchor (line 7).
  {
    name: "pass-disable-line-on-the-anchor-silences-it",
    expected: [],
    errors: [["MTL601", null]],
    suppressed: 1,
  },
  // Worked example 2 of 2.6: line 17 `### Misc` is MTL612 (empty level-3 list); line 23
  // `## Fixed` is the level-2 extra. Lines 13 and 19 are level 4: no run.
  {
    name: "fail-worked-example-two-disallow",
    expected: [extra(2, ["Fixed"], 23)],
    errors: [
      ["MTL612", 13],
      ["MTL612", 17],
    ],
    suppressed: 0,
  },
  // Worked example 2 of 2.6, no tag: two warnings, the level-3 one first (its sequence ends at
  // `### Fixed`, template line 11, before `## Notes`, template line 13).
  {
    name: "fail-worked-example-two-no-tag",
    expected: [extra(3, ["Misc"], 17, "Unreleased"), extra(2, ["Fixed"], 23)],
    errors: [],
    suppressed: 0,
  },
  // Worked example 2 of 2.6, duplicate group under the disallow tag: line 17 `### Added` is
  // listed (no MTL612), so the warning lists it; line 19 `#### Sub` is now topmost: MTL612.
  {
    name: "fail-worked-example-two-duplicate-group-under-disallow",
    expected: [extra(3, ["Added"], 17, "Unreleased"), extra(2, ["Fixed"], 23)],
    errors: [
      ["MTL612", 13],
      ["MTL612", 19],
    ],
    suppressed: 0,
  },
  // The template has H1 and H2 only: the H3 and H4 headings are in no run.
  {
    name: "pass-level-without-template-heading-gives-nothing",
    expected: [],
    errors: [],
    suppressed: 0,
  },
  // Section scope, one run per parent instance: `v1.1.0` lists `Notes`; under `v1.0.0` the
  // optional `### Added` takes nothing, so `Misc` and `More` are one warning; `v0.9.0` has an
  // empty tail. Same last position (template line 7): by target line.
  {
    name: "fail-section-scope-one-warning-per-parent-instance",
    expected: [extra(3, ["Notes"], 9, "v1.1.0"), extra(3, ["Misc", "More"], 13, "v1.0.0")],
    errors: [],
    suppressed: 0,
  },
  // Stray block (2.6 "Extra", 2.10 step 4): `### Free` has no template parent, so its level-3
  // run is file scope: it takes line 5, the tail is `### Extra` (11) and `### Later` (15).
  // `## Stray` (9) is unlisted under the disallow tag of `# Doc`: MTL612, topmost. `### Extra`
  // lies inside that block: not listed. `### Later` is outside the region: listed. The level-1
  // tail `# Appendix` (13) is listed too. `### Free` (template line 5) sorts before `# Doc` (7).
  {
    name: "fail-tail-heading-inside-stray-block-is-not-listed",
    expected: [extra(3, ["Later"], 15), extra(1, ["Appendix"], 13)],
    errors: [["MTL612", 9]],
    suppressed: 0,
  },
  // Worked example 1 of 2.6 with `disable-next-line MTL616` on the line before the anchor (8).
  {
    name: "pass-disable-next-line-on-the-anchor-silences-it",
    expected: [],
    errors: [["MTL601", null]],
    suppressed: 1,
  },
  // Overlapping runs of one level (a file-scope run and a section-scope run: `### Free` has no
  // template parent, `### Inner` is a child of `## Sec`). Spec 2.6/2.10 are silent here; the
  // phase P7f assumption is pinned: a heading another run takes is no extra. `### Inner` (line
  // 9) is in the tail of the file-scope level-3 run (lines 5 and 9) but the run of `## Sec`
  // takes it, so there is no warning.
  {
    name: "pass-heading-taken-by-an-overlapping-run-is-not-extra",
    expected: [],
    errors: [],
    suppressed: 0,
  },
  // Same layout, `### Gone` is template-only under `## Sec`: the section-scope run sets line 9
  // aside (MTL603 names it), so the file-scope level-3 run does not list it either.
  {
    name: "pass-heading-set-aside-by-an-overlapping-run-is-not-extra",
    expected: [],
    errors: [["MTL603", 9]],
    suppressed: 0,
  },
  // Same layout, the section-scope `### Step` is a required placeholder position: it takes
  // `### Oops` (line 9) as a mismatch (MTL606), so the file-scope run does not list it.
  {
    name: "pass-heading-taken-as-mismatch-by-an-overlapping-run-is-not-extra",
    expected: [],
    errors: [["MTL606", 9]],
    suppressed: 0,
  },
  // The optional repeat position `Release` takes nothing; `Notes` takes line 5; the whole tail
  // (line 7, which matches the release pattern) is MTL614's: the list is empty, no warning.
  {
    name: "pass-whole-tail-named-by-repeat-miss-gives-no-warning",
    expected: [],
    errors: [["MTL614", 7]],
    suppressed: 0,
  },
  // A file-scope run that takes every sibling has an empty tail: no warning.
  {
    name: "pass-file-scope-run-without-tail-gives-nothing",
    expected: [],
    errors: [],
    suppressed: 0,
  },
  // Texts are listed as written, with Python `repr` rules (4.3, Q02): non-ASCII letters stay as
  // they are and the backslash of `a\b` is doubled in the list.
  {
    name: "fail-unicode-and-backslash-heading-texts-are-listed-as-written",
    expected: [
      {
        message: "Heading: 3 extra heading(s) at level H2 after the template headings: " + "['Étape été', '日本語', 'a\\\\b']",
        line: 7,
        heading: "Étape été",
      },
    ],
    errors: [],
    suppressed: 0,
  },
  // `{pylist}` is a Python repr (4.3): a text with `'` and no `"` takes double quotes, a text
  // with `"` keeps single quotes.
  {
    name: "fail-quotes-in-listed-texts-follow-python-repr",
    expected: [
      {
        message: "Heading: 2 extra heading(s) at level H1 after the template headings: " + `["It's done", 'Say "hi"']`,
        line: 7,
        heading: "It's done",
      },
    ],
    errors: [],
    suppressed: 0,
  },
  // A run of only PATTERN headings (empty text after peeling) keeps MTL616: it has no MTL601,
  // unlike the exact-text empty heading of the 2.11 body line (spec 2.10 step 4).
  {
    name: "fail-pattern-only-run-with-empty-text-keeps-the-warning",
    expected: [extra(2, ["Zebra"], 7)],
    errors: [],
    suppressed: 0,
  },
  // An OPTIONAL heading with empty text after tag peeling keeps MTL616 (spec 2.10 step 4): only
  // REQUIRED empty exact-text headings (reported by MTL601) silence the run.
  {
    name: "fail-optional-tag-only-heading-keeps-the-warning",
    expected: [extra(2, ["Real", "Zebra"], 7)],
    errors: [],
    suppressed: 0,
  },
];

const read = (path: string): string => readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

async function templateOf(name: string) {
  const status = await checkTemplate(registry, read(`${DIR}/${name}/template.md`));
  if (status.status !== "ok") throw new Error("template is broken");
  return status;
}

/** Result of `lintTarget` (findings and suppressed count) for a fixture folder. */
async function lintResult(name: string) {
  const status = await templateOf(name);
  return lintTarget(registry, status.model, read(`${DIR}/${name}/target.md`), "target.md", createEnv());
}

describe("MTL616 heading-extra", { tags: ["MTL616", "heading"] }, () => {
  it("is registered in category heading, warning, target step headings", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "heading-extra",
      category: "heading",
      severity: "warning",
      phase: "target",
      step: "headings",
    });
  });

  it("is registered between MTL615 and MTL617 (spec 4.3: same template line, by code)", () => {
    const codes = registry.rules.map((rule) => rule.code);
    expect(codes.indexOf(CODE)).toBe(codes.indexOf("MTL615") + 1);
    expect(codes.indexOf("MTL617")).toBe(codes.indexOf(CODE) + 1);
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
      const result = await lintResult(testCase.name);
      const found = result.diagnostics.filter((diagnostic) => diagnostic.code === CODE);
      expect(
        found.map((diagnostic) => ({
          message: diagnostic.message,
          line: anchorLineOf(diagnostic),
          heading: diagnostic.heading,
        })),
      ).toEqual(testCase.expected);
      for (const diagnostic of found) {
        expect(diagnostic.severity).toBe("warning");
        // The template-line sort key is cleared (the anchor is internal, spec 8.1).
        expect(diagnostic.position).toBeNull();
      }
      // Which code reports a heading is decided before suppression; errors stay unchanged.
      expect(result.diagnostics.filter((diagnostic) => diagnostic.severity === "error").map((diagnostic) => [diagnostic.code, anchorLineOf(diagnostic)])).toEqual(testCase.errors);
      expect(result.suppressed).toBe(testCase.suppressed);
    });
  }

  it("warnings print after errors (spec 4.1)", async () => {
    const status = await templateOf("fail-worked-example-six-changelog");
    const all = await checkTarget(registry, status.model, read(`${DIR}/fail-worked-example-six-changelog/target.md`), "target.md", createEnv());
    expect(all.map((diagnostic) => diagnostic.code)).toEqual(["MTL612", "MTL614", "MTL615", CODE, CODE]);
  });
});
