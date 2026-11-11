/** MTL612 heading-unlisted (src/rules/heading.ts, docs/spec.md 2.6, 4.3, 4.4 DIR5, 8.1). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate, lintTarget } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { anchorLineOf, createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL612";
const DIR = "tests/fixtures/pairs/MTL612";

interface Expected {
  readonly message: string;
  /** Text of the unlisted target heading (spec 8.1). */
  readonly heading: string;
  /** Target line of the unlisted heading (spec 4.4 DIR5). */
  readonly anchor: number;
}

interface TestCase {
  readonly name: string;
  readonly expected: readonly Expected[];
}

const unlisted = (parent: string, text: string, level: number, anchor: number): Expected => ({
  message: `Heading: Section '${parent}': heading '${text}' at level H${level} ` + "is not in the template [content:subheadings:disallow]",
  heading: text,
  anchor,
});

/** Case -> fixture dir (same name) -> expected result. At least 1 pass- and 1 fail- case. */
const CASES: readonly TestCase[] = [
  // Listed: level and text of a checked template heading (a `{text}` pattern one: any text its
  // pattern matches, spec 2.6 "Listed").
  { name: "pass-listed-headings-not-reported", expected: [] },
  // Spec 2.6: without the tag, extra headings stay allowed at every level.
  { name: "pass-no-disallow-tag-extras-allowed", expected: [] },
  // Duplicates of a listed heading are listed too.
  { name: "pass-duplicate-listed-heading-not-reported", expected: [] },
  // `# Context` is not a match of `## Context`: the tag has no effect (MTL601 only).
  { name: "pass-parent-not-matched-gives-no-finding", expected: [] },
  // DIR5: `disable-line` and `disable-next-line` cover the unlisted heading line.
  { name: "pass-suppressed-on-unlisted-heading-line", expected: [] },
  // The match of a checked template-only heading is MTL603's; its child is not reported.
  { name: "pass-template-only-match-gets-mtl603-only", expected: [] },
  // Spec 2.6: MTL603 also when the template-only heading (`### Draft`, template parent
  // `# Guide`) is outside the subtree of the tagged `## Context`; never also MTL612.
  { name: "pass-template-only-match-outside-tag-subtree-gets-mtl603-only", expected: [] },
  // DIR5: `disable-file MTL612` silences the whole file (both worked example findings).
  { name: "pass-disable-file-silences-whole-file", expected: [] },
  // A tagged template-only heading has no effect (spec 2.6), only MTL603 on its match.
  { name: "pass-template-only-tagged-heading-has-no-effect", expected: [] },
  // A tagged H3 under a template-only parent is not checked: its tag has no effect.
  { name: "pass-tagged-heading-under-template-only-parent-has-no-effect", expected: [] },
  // A tagged H3 under a missing parent has no match: its tag has no effect.
  { name: "pass-tagged-heading-under-missing-parent-has-no-effect", expected: [] },
  {
    // The extra `### Extra` inside the region; `## Appendix` ends the region.
    name: "fail-unlisted-heading-reported-on-its-line",
    expected: [unlisted("Context", "Extra", 3, 13)],
  },
  {
    // Topmost only: `#### Sub`, `##### Deeper`, `#### Decision` sit under `### Extra`.
    name: "fail-descendants-of-unlisted-not-reported-again",
    expected: [unlisted("Context", "Extra", 3, 11)],
  },
  {
    // Spec 2.6 "and so on": `#### Stray` (unlisted, topmost) > `##### Deep` (listed, template
    // `### Added` > `##### Deep`) > `###### Leaf` (unlisted): only `Stray` is reported, `Leaf`
    // has an unlisted ancestor above its listed parent.
    name: "fail-listed-heading-under-unlisted-ancestor-does-not-reset",
    expected: [unlisted("Unreleased", "Stray", 4, 11)],
  },
  {
    // Region end: `#### Extra` is the last line of `## Context` (line 11), `## Next` follows
    // on line 12 with no blank line; the region ends on line 11 inclusive.
    name: "fail-unlisted-heading-on-last-line-of-region",
    expected: [unlisted("Context", "Extra", 4, 11)],
  },
  {
    // Spec 2.6 worked example 2: a listed `### Added` does not reset the rule.
    name: "fail-changelog-worked-example",
    expected: [unlisted("Unreleased", "Details", 4, 13), unlisted("Unreleased", "Misc", 3, 17)],
  },
  {
    // Spec 2.6 variant: `#### Added` is not listed (`### Added` is level 3).
    name: "fail-changelog-added-at-level-four-variant",
    expected: [unlisted("Unreleased", "Added", 4, 9), unlisted("Unreleased", "Details", 4, 13), unlisted("Unreleased", "Misc", 3, 17)],
  },
  {
    // Spec 2.6 variant: `disable-line MTL612` on line 17 removes the `Misc` finding only.
    name: "fail-changelog-suppressed-on-misc-line",
    expected: [unlisted("Unreleased", "Details", 4, 13)],
  },
  {
    // Spec 2.6 variant, `disable-next-line` twin: the directive on line 17 covers `### Misc` (18).
    name: "fail-changelog-suppressed-next-line-before-misc",
    expected: [unlisted("Unreleased", "Details", 4, 13)],
  },
  {
    // Scope: `#### Items` is listed only inside `### Added`; the one under `### Misc` is not.
    name: "fail-listed-text-outside-its-parent-match-is-unlisted",
    expected: [unlisted("Unreleased", "Items", 4, 15)],
  },
  {
    // Subtree: template `### Second` (parent `# Guide`, scope the whole Guide section) has the
    // level and text of the target `### Second` and has it in scope, but is not in the subtree
    // of the tagged `## Alpha` (spec 2.6 "some checked template heading E in D's subtree").
    name: "fail-heading-listed-outside-tagged-subtree-is-unlisted",
    expected: [unlisted("Alpha", "Second", 3, 11)],
  },
  {
    // `#### Inner [presence:template-only]` under the matched template-only `## Draft` is not
    // checked: its target match (line 13, inside the tagged `### Context`) gets no MTL603, so
    // it is a plain unlisted heading (MTL612); `## Draft` itself gets MTL603.
    name: "fail-unchecked-template-only-child-match-gets-mtl612",
    expected: [unlisted("Context", "Inner", 4, 13)],
  },
  {
    // Text comparison is exact and case sensitive (spec 2.6): `decision` is not `Decision`.
    name: "fail-heading-text-is-case-sensitive",
    expected: [unlisted("Context", "decision", 3, 9)],
  },
  {
    // Spec 4.3: sorted by the tagged template heading (`Alpha` first, then `Beta`). Within one
    // level the target order is the template order (positional run), so both orders agree.
    name: "fail-sibling-tagged-headings-sorted-by-template-line",
    expected: [unlisted("Alpha", "Stray alpha", 3, 11), unlisted("Beta", "Stray beta", 3, 17)],
  },
  {
    // Spec 2.6 "Effective when D ... has a match", 2.10 step 3b: the target has `Beta` first, so
    // `Alpha` looks at it and is missing (MTL601, not asserted here): its tag has no effect, and
    // `Stray alpha` (line 17) is not reported. Only the tag of the matched `Beta` applies.
    name: "fail-tagged-heading-without-match-has-no-effect",
    expected: [unlisted("Beta", "Stray beta", 3, 11)],
  },
  {
    // `#### Detail` sits under an absent optional `### Notes`: unchecked, so it lists nothing.
    name: "fail-heading-of-unchecked-template-heading-is-unlisted",
    expected: [unlisted("Context", "Detail", 4, 9)],
  },
  {
    // Every deeper level: a topmost H5 and H6 name their own level.
    name: "fail-topmost-unlisted-at-levels-five-and-six",
    expected: [unlisted("Context", "Five", 5, 11), unlisted("Context", "Six", 6, 15)],
  },
  {
    // A template-only heading never lists: its first set-aside sibling (spec 2.10 step 1) is
    // MTL603, a second sibling with the same text is MTL612.
    name: "fail-second-template-only-duplicate-gets-mtl612",
    expected: [unlisted("Context", "Draft", 3, 13)],
  },
  {
    // A tag on a `[pattern:"{text}"]` heading applies to the sibling its position took (docs/grammar.md
    // "Match of T": the match is the sibling taken; ADR 0012): `## Whatever`. `First` is listed,
    // `Third` is not. (Inside ONE run two positions never share a sibling, but two tagged
    // template headings of the same level in different scopes can: see the next case.)
    name: "fail-tag-on-pattern-heading-applies-to-the-sibling-it-took",
    expected: [unlisted("Whatever", "Third", 3, 11)],
  },
  {
    // Two tagged headings share ONE match across scopes: `#### Item` under `## A` and `#### Item`
    // under `### B` (a different template parent, whose section lies inside A's) both take the
    // target `#### Item` (line 9). Region of both: lines 9 to 13. `##### K1` is listed by the
    // first tag (its template child) and unlisted for the second; `##### Y` is unlisted for
    // both: a TIE on the same match, owned by the FIRST tag in template order (the one that
    // names it, `heading.ts` `known.match.line < match.line` keeps the earlier owner). The
    // findings sort by their tag's template line (spec 4.3): `Y` (first tag, line 7) before
    // `K1` (second tag, line 13), although `K1` comes first in the target. A tie that went to
    // the second tag would sort `K1` before `Y`. The spec fixes `{parent}` only as the text of
    // M, which is `Item` for both tags.
    name: "fail-two-tags-share-one-match-across-scopes-first-in-template-order-owns-ties",
    expected: [unlisted("Item", "Y", 5, 13), unlisted("Item", "K1", 5, 11)],
  },
  {
    // Spec 2.6 worked example 2, variant "a duplicate group" (under the disallow tag): line 17
    // reads `### Added`, listed by level and text, so no error for it (it is an extra in the
    // tail of the level-3 run, listed by the MTL616 warning). `#### Details` (line 13, under the
    // listed `### Added` of line 9) and `#### Sub` (line 19: its parent, line 17, is listed, so
    // it is the topmost unlisted heading of its block) are reported.
    name: "fail-changelog-duplicate-group-variant",
    expected: [unlisted("Unreleased", "Details", 4, 13), unlisted("Unreleased", "Sub", 4, 19)],
  },
  {
    // MTL611 and MTL612 on one tagged parent: MTL611 first (registry order, code order). The
    // template children are `#### Decision`, `### Consequences` (a deeper child first: the only
    // shape MTL611 can fail on, see MTL611 test); the target has `Consequences` before `Decision`.
    name: "fail-order-and-unlisted-on-same-tagged-parent",
    expected: [unlisted("Context", "Extra", 3, 13)],
  },
  {
    // Same-level children: `Decision` looks at `Consequences` and is missing (MTL610 on the
    // parent line), `Decision` (line 11) is in the tail and still listed. MTL612 for `Extra` first
    // (template line 7, the tag), then MTL610 (template line 9, `Decision`). Spec 4.3.
    name: "fail-missing-child-and-unlisted-on-same-tagged-parent",
    expected: [unlisted("Context", "Extra", 3, 13)],
  },
  {
    // Nested tags: `#### Stray` once, under the innermost tag (`Context`); spec 4.3 order
    // sorts by the tagged template heading first (`Guide`, then `Context`).
    name: "fail-nested-disallow-reported-once-under-innermost-tag",
    expected: [unlisted("Guide", "Extra", 2, 15), unlisted("Context", "Stray", 4, 13)],
  },
  {
    // Spec 2.6: the tag works with zero template children; `#### Deeper` has an unlisted
    // ancestor, so only `### Extra` is reported.
    name: "fail-tag-without-children-reports-every-deeper-heading",
    expected: [unlisted("Context", "Extra", 3, 7)],
  },
  {
    // Spec 2.6: a fenced block is not a heading; only the real `### Real stray` (line 13).
    name: "fail-unlisted-heading-after-code-fence-is-reported",
    expected: [unlisted("Context", "Real stray", 3, 13)],
  },
  // Zero template children and no target sub-heading: nothing to report.
  { name: "pass-tag-without-children-and-no-subheadings", expected: [] },
  // Spec 2.6: headings inside backtick or tilde fences are ignored (not unlisted, no region end).
  { name: "pass-heading-like-text-in-code-fence-is-not-a-heading", expected: [] },
];

/**
 * Every code of the pass- cases (not only MTL612), derived from the fixtures and the spec:
 * the tag-guard cases give the MTL601/MTL603 their own rules require, an extra in the tail of
 * a run that no error names gives the warning MTL616 (docs/grammar.md "Extra"), the rest are clean.
 */
const PASS_CODES: Readonly<Record<string, readonly string[]>> = {
  "pass-listed-headings-not-reported": [],
  // No tag: `### Extra` (line 13) is in the tail of the level-3 run of `## Context`.
  "pass-no-disallow-tag-extras-allowed": ["MTL616"],
  // The second `### Decision` (line 13) is listed (no MTL612) but in the tail: MTL616 (2.6).
  "pass-duplicate-listed-heading-not-reported": ["MTL616"],
  // `# Context` (line 7) is in the level-1 tail (worked example 1 of 2.6).
  "pass-parent-not-matched-gives-no-finding": ["MTL601", "MTL616"],
  "pass-suppressed-on-unlisted-heading-line": [],
  "pass-template-only-match-gets-mtl603-only": ["MTL603"],
  "pass-template-only-match-outside-tag-subtree-gets-mtl603-only": ["MTL603"],
  // Worked example 2 of 2.6: `## Fixed` (line 25 here) is the level-2 extra.
  "pass-disable-file-silences-whole-file": ["MTL616"],
  "pass-template-only-tagged-heading-has-no-effect": ["MTL603"],
  "pass-tagged-heading-under-template-only-parent-has-no-effect": ["MTL603"],
  // `# Context` (line 7) is in the level-1 tail.
  "pass-tagged-heading-under-missing-parent-has-no-effect": ["MTL601", "MTL616"],
  "pass-tag-without-children-and-no-subheadings": [],
  "pass-heading-like-text-in-code-fence-is-not-a-heading": [],
};

const read = (path: string): string => readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** Every diagnostic for the pair of a fixture folder. */
async function lintAll(name: string) {
  const fixture = `${DIR}/${name}`;
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
  return checkTarget(registry, status.model, read(`${fixture}/target.md`), `${fixture}/target.md`, createEnv());
}

/** The MTL612 diagnostics for the pair of a fixture folder. */
async function lint(testCase: TestCase) {
  const found = await lintAll(testCase.name);
  return found.filter((diagnostic) => diagnostic.code === CODE);
}

describe("MTL612 heading-unlisted", { tags: ["MTL612", "heading"] }, () => {
  it("is registered in category heading, error, target step headings", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "heading-unlisted",
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

  it("every pass- case gives the full code list of PASS_CODES, not only no MTL612", async () => {
    const passing = CASES.filter((testCase) => testCase.name.startsWith("pass-")).map((testCase) => testCase.name);
    expect(Object.keys(PASS_CODES).sort()).toEqual([...passing].sort());
    for (const name of passing) {
      const found = await lintAll(name);
      expect([name, found.map((diagnostic) => diagnostic.code)]).toEqual([name, PASS_CODES[name]]);
    }
  });

  it("a tagged heading that is not matched gives MTL601 only (and the MTL616 of the extra)", async () => {
    const found = await lintAll("pass-parent-not-matched-gives-no-finding");
    expect(found.map((diagnostic) => diagnostic.code)).toEqual(["MTL601", "MTL616"]);
  });

  it("the match of a template-only heading gives MTL603, never also MTL612", async () => {
    const found = await lintAll("pass-template-only-match-gets-mtl603-only");
    expect(found.map((diagnostic) => [diagnostic.code, anchorLineOf(diagnostic)])).toEqual([["MTL603", 11]]);
  });

  it("a template-only match outside the tagged subtree gives MTL603 only (spec 2.6)", async () => {
    const found = await lintAll("pass-template-only-match-outside-tag-subtree-gets-mtl603-only");
    expect(
      found.map((diagnostic) => ({
        code: diagnostic.code,
        message: diagnostic.message,
        heading: diagnostic.heading,
        anchor: anchorLineOf(diagnostic),
      })),
    ).toEqual([
      {
        code: "MTL603",
        message: "Heading: Heading 'Draft' is marked [presence:template-only] " + "and must not appear in the linted file",
        heading: "Draft",
        anchor: 11,
      },
    ]);
  });

  it("the deeper chain and the region end give MTL612 only", async () => {
    const codes = async (name: string) => (await lintAll(name)).map((diagnostic) => [diagnostic.code, anchorLineOf(diagnostic)]);
    expect(await codes("fail-listed-heading-under-unlisted-ancestor-does-not-reset")).toEqual([["MTL612", 11]]);
    expect(await codes("fail-unlisted-heading-on-last-line-of-region")).toEqual([["MTL612", 11]]);
    // `### Second` (template parent `# Guide`) looks at `### First` (line 9) first: MTL610
    // anchored on the `# Guide` line (5), template line 7, before the tag (line 9, MTL612).
    expect(await codes("fail-heading-listed-outside-tagged-subtree-is-unlisted")).toEqual([
      ["MTL610", 5],
      ["MTL612", 11],
    ]);
    // Sorted by template heading line: the tag (`### Context`, 7) before `## Draft` (11).
    expect(await codes("fail-unchecked-template-only-child-match-gets-mtl612")).toEqual([
      ["MTL612", 13],
      ["MTL603", 7],
    ]);
  });

  it("the pass- suppression cases count every silenced finding (`Suppressed:   2`)", async () => {
    // The rule fires on each silenced heading: a rule that never fires has nothing to suppress.
    for (const [name, left] of [
      // `disable-line` on `### Extra` (11) and `disable-next-line` before `### Other` (14).
      ["pass-suppressed-on-unlisted-heading-line", []],
      // `disable-file MTL612`: the two worked example findings (`Details`, `Misc`). The warning
      // MTL616 for `## Fixed` stays (spec 2.6 worked example 2; line 25 in this fixture).
      ["pass-disable-file-silences-whole-file", [["MTL616", 25]]],
    ] as const) {
      const fixture = `${DIR}/${name}`;
      const status = await checkTemplate(registry, read(`${fixture}/template.md`));
      if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
      const result = await lintTarget(registry, status.model, read(`${fixture}/target.md`), `${fixture}/target.md`, createEnv());
      expect(result.suppressed).toBe(2);
      expect(result.diagnostics.map((diagnostic) => [diagnostic.code, anchorLineOf(diagnostic)])).toEqual(left);
    }
  });

  it("the worked example gives MTL612 only (no content or order finding)", async () => {
    const found = await lintAll("fail-changelog-worked-example");
    // Spec 2.6 worked example 2: then the warning MTL616 for the level-2 extra `## Fixed`.
    expect(found.map((diagnostic) => [diagnostic.code, anchorLineOf(diagnostic)])).toEqual([
      ["MTL612", 13],
      ["MTL612", 17],
      ["MTL616", 23],
    ]);
  });

  it("full code lists: tag guards, template-only duplicate, MTL611 before MTL612, MTL612 before MTL610", async () => {
    const codes = async (name: string) => (await lintAll(name)).map((diagnostic) => [diagnostic.code, anchorLineOf(diagnostic)]);
    expect(await codes("pass-template-only-tagged-heading-has-no-effect")).toEqual([["MTL603", 7]]);
    expect(await codes("pass-tagged-heading-under-template-only-parent-has-no-effect")).toEqual([["MTL603", 7]]);
    expect(await codes("pass-tagged-heading-under-missing-parent-has-no-effect")).toEqual([
      ["MTL601", null],
      ["MTL616", 7],
    ]);
    // Sorted by template heading line: the tag (`## Context`, 7) before `### Draft` (11).
    expect(await codes("fail-second-template-only-duplicate-gets-mtl612")).toEqual([
      ["MTL612", 13],
      ["MTL603", 11],
    ]);
    expect(await codes("fail-order-and-unlisted-on-same-tagged-parent")).toEqual([
      ["MTL611", 7],
      ["MTL612", 13],
    ]);
    // A same-level swap is MTL610 (not MTL611): template line 9 (`Decision`) sorts after the tag (7).
    // `### Consequences` takes line 9; line 11 `### Decision` is listed but in the tail: MTL616.
    expect(await codes("fail-missing-child-and-unlisted-on-same-tagged-parent")).toEqual([
      ["MTL612", 13],
      ["MTL610", 7],
      ["MTL616", 11],
    ]);
  });

  it("the suppression variants count one suppressed finding (`Suppressed:   1`)", async () => {
    // The MTL612 on line 13 and the MTL616 for `## Fixed` stay (spec 2.6 worked example 2):
    // line 23, or 24 where a directive line is inserted before `### Misc`.
    for (const [name, fixed] of [
      ["fail-changelog-suppressed-on-misc-line", 23],
      ["fail-changelog-suppressed-next-line-before-misc", 24],
    ] as const) {
      const fixture = `${DIR}/${name}`;
      const status = await checkTemplate(registry, read(`${fixture}/template.md`));
      if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
      const result = await lintTarget(registry, status.model, read(`${fixture}/target.md`), `${fixture}/target.md`, createEnv());
      expect(result.suppressed).toBe(1);
      expect(result.diagnostics.map((diagnostic) => anchorLineOf(diagnostic))).toEqual([13, fixed]);
    }
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
