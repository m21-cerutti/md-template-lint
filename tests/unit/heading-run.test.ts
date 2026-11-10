/**
 * `HeadingRun` and `HeadingPosition` of `matchHeadings` (src/engine/model.ts): the positional run
 * of docs/spec.md 2.6 "Sequence", "Match of T", "Extra" and 2.10 "Positional match" steps 1 to 4
 * (ADR 0012). Every expected value below is derived by hand from the spec, not from the code.
 * Body line 1 is file line 5 (the frontmatter takes lines 1 to 4), so the `L<n>` comments are
 * file lines; one heading per line, no blank lines, so the heading of body line `n` is on file
 * line `n + 4`.
 */
import { describe, expect, it } from "vitest";
import { loadDocument } from "../../src/engine/load.js";
import { matchHeadings, type DocumentModel, type HeadingMatch, type HeadingPosition, type HeadingRun } from "../../src/engine/model.js";

const FRONTMATTER = ["---", "title: x", "---", ""];

function load(body: readonly string[]): DocumentModel {
  const result = loadDocument([...FRONTMATTER, ...body].join("\n"));
  if (!result.ok) throw new Error(`load failed: ${result.failure.reason}`);
  return result.model;
}

/** `matchHeadings` of two bodies, in template order. */
const run = (template: readonly string[], target: readonly string[]): HeadingMatch[] => matchHeadings(load(template), load(target));

const must = <T>(value: T | null | undefined): T => {
  if (value === null || value === undefined) throw new Error("missing entry");
  return value;
};

/** File lines of target sections (a view for `toEqual`). */
const lines = (sections: readonly { readonly line: number }[]): number[] => sections.map((section) => section.line);

/** The positions of a run: template index -> matched file line (null: took nothing). */
const taken = (found: HeadingRun): [number, number | null][] => found.positions.map((position) => [position.index, position.match?.line ?? null]);

/** The position of the template heading `index` (an index in `template.sections`). */
const positionOf = (items: readonly HeadingMatch[], index: number): HeadingPosition => {
  const found = must(must(items[index]).run).positions.find((entry) => entry.index === index);
  return must(found);
};

describe("HeadingRun: one run per level and scope (spec 2.6 'Sequence', 2.10 'Positional match')", () => {
  it("a file-scope run lists the siblings of its level, its positions in template order, and the tail", () => {
    // Siblings of level 2: L5, L6, L7; `A` takes L5, `B` takes L6; L7 is the tail (extra).
    const items = run(["## A", "## B"], ["## A", "## B", "## C"]);
    const found = must(must(items[0]).run);
    expect(found.level).toBe(2);
    expect(found.scope).toBe("file");
    expect(found.parent).toBeNull();
    expect(found.parentMatch).toBeNull();
    expect(lines(found.siblings)).toEqual([5, 6, 7]);
    expect(found.setAside).toEqual([]);
    expect(taken(found)).toEqual([
      [0, 5],
      [1, 6],
    ]);
    expect(lines(found.tail)).toEqual([7]);
  });

  it("one run object per level and scope: its members share it, another level has its own", () => {
    const items = run(["## A", "## B", "# Top"], ["# Top", "## A", "## B"]);
    const a = must(items[0]);
    const b = must(items[1]);
    const top = must(items[2]);
    expect(a.run).not.toBeNull();
    expect(a.run).toBe(b.run);
    expect(top.run).not.toBeNull();
    expect(top.run).not.toBe(a.run);
    expect(must(top.run).level).toBe(1);
  });

  it("the siblings are the target headings of the SAME level only, whatever their text", () => {
    // `# A` and `### A` are no siblings of the level-2 run: `## A` has none and takes nothing.
    const missing = must(run(["## A"], ["# A", "### A"])[0]);
    expect(lines(must(missing.run).siblings)).toEqual([]);
    expect(taken(must(missing.run))).toEqual([[0, null]]);
    expect(missing.match).toBeNull();
    // With a level-2 sibling it is taken.
    const present = must(run(["## A"], ["# A", "## A", "### A"])[0]);
    expect(lines(must(present.run).siblings)).toEqual([6]);
    expect(taken(must(present.run))).toEqual([[0, 6]]);
  });

  it("the run walks the siblings in file order, one position takes at most one sibling, no skipping", () => {
    // `B` looks at the extra `X` (L6): no match, takes nothing; `C` looks at `X` too. The cursor
    // never goes forward over a sibling, so `B` (L7) and `C` (L8) are never reached.
    const found = must(must(run(["## A", "## B", "## C"], ["## A", "## X", "## B", "## C"])[0]).run);
    expect(taken(found)).toEqual([
      [0, 5],
      [1, null],
      [2, null],
    ]);
    expect(lines(found.tail)).toEqual([6, 7, 8]);
  });

  it("the tail starts after the last sibling taken (the cursor), an absent optional takes nothing", () => {
    // `B` (optional) looks at `C` (L6): no match. `C` takes L6. `X` (L7) and `B` (L8) are left.
    const found = must(must(run(["## A", "## B [presence:optional]", "## C"], ["## A", "## C", "## X", "## B"])[0]).run);
    expect(taken(found)).toEqual([
      [0, 5],
      [1, null],
      [2, 6],
    ]);
    expect(lines(found.tail)).toEqual([7, 8]);
  });

  it("a conditional heading matches like an optional one: it takes a matching sibling, else nothing", () => {
    const found = must(must(run(["## A", "## B [presence:conditional:x]"], ["## A", "## B", "## C"])[0]).run);
    expect(taken(found)).toEqual([
      [0, 5],
      [1, 6],
    ]);
    expect(lines(found.tail)).toEqual([7]);
  });

  it("a required {text} position takes the next sibling whatever its text, and only one", () => {
    // Spec 2.10 step 3c (the migration of the dropped `exist` tag, 2.6 "Dropped tag").
    const found = must(must(run(["## A", '## B [pattern:"{text}"]', "## C"], ["## A", "## Any", "## C", "## D"])[0]).run);
    expect(taken(found)).toEqual([
      [0, 5],
      [1, 6],
      [2, 7],
    ]);
    expect(lines(found.tail)).toEqual([8]);
    // With no sibling left the `{text}` position takes nothing.
    const none = must(must(run(["## A", '## B [pattern:"{text}"]'], ["## A"])[0]).run);
    expect(taken(none)).toEqual([
      [0, 5],
      [1, null],
    ]);
    expect(none.tail).toEqual([]);
  });

  it("the position index is the index of the template heading in template.sections", () => {
    // Template sections: 0 `# Top`, 1 `## A`, 2 `### Inner`, 3 `## B`. The level-2 run has the
    // positions 1 and 3 (not 0..1): indices name template headings, not ranks in the run.
    const items = run(["# Top", "## A", "### Inner", "## B"], ["# Top", "## A", "### Inner", "## B"]);
    expect(taken(must(must(items[1]).run))).toEqual([
      [1, 6],
      [3, 8],
    ]);
    expect(must(items[3]).run).toBe(must(items[1]).run);
  });
});

describe("HeadingRun.setAside: template-only siblings (spec 2.10 step 1, MTL603)", () => {
  const TEMPLATE = ["## A", "## T [presence:template-only]", "## B"];

  it("every sibling with the text is set aside, in file order, and no position takes it", () => {
    const items = run(TEMPLATE, ["## A", "## T", "## T", "## B"]);
    const found = must(must(items[0]).run);
    expect(lines(found.siblings)).toEqual([5, 6, 7, 8]);
    expect(lines(found.setAside)).toEqual([6, 7]);
    // `T` is no position; `A` and `B` are not shifted by the copies of `T`.
    expect(taken(found)).toEqual([
      [0, 5],
      [2, 8],
    ]);
    expect(found.tail).toEqual([]);
  });

  it("the template-only heading has no match, no position, and `setAside` is its FIRST sibling", () => {
    const items = run(TEMPLATE, ["## A", "## T", "## T", "## B"]);
    const only = must(items[1]);
    expect(only.match).toBeNull();
    expect(only.run).toBe(must(items[0]).run);
    expect(must(only.setAside).line).toBe(6);
    // `setAside` is null for every other presence mode, even when a copy of its text is set aside.
    expect(must(items[0]).setAside).toBeNull();
    expect(must(items[2]).setAside).toBeNull();
  });

  it("an absent template-only heading is the silent outcome: nothing set aside, `setAside` null", () => {
    const items = run(TEMPLATE, ["## A", "## B"]);
    const only = must(items[1]);
    expect(only.setAside).toBeNull();
    expect(must(only.run).setAside).toEqual([]);
  });

  it("the text compare is exact: another case is a plain sibling (it shifts the run)", () => {
    const items = run(TEMPLATE, ["## A", "## t", "## B"]);
    const found = must(must(items[0]).run);
    expect(found.setAside).toEqual([]);
    // `B` looks at `t` (L6): missing.
    expect(taken(found)).toEqual([
      [0, 5],
      [2, null],
    ]);
  });

  it("a run with only a template-only heading has no position and so no tail (spec 2.6 'Extra')", () => {
    // `T` is set aside; the other sibling `X` is free detail, not an extra: no tail.
    const found = must(must(run(["## T [presence:template-only]"], ["## T", "## X"])[0]).run);
    expect(found.positions).toEqual([]);
    expect(lines(found.setAside)).toEqual([5]);
    expect(found.tail).toEqual([]);
  });
});

describe("HeadingRun in section scope: one run per level and per parent match (spec 2.6 'Siblings')", () => {
  const TEMPLATE = ["# Guide", "## P", "### X", "## Q", "### X", "### Y"];

  it("walks the target section of its parent's match only, and names the parent", () => {
    // `## P` L6 (section L6 to L7), `## Q` L8 (section L8 to L10).
    const items = run(TEMPLATE, ["# Guide", "## P", "### X", "## Q", "### X", "### Y"]);
    const underP = must(must(items[2]).run);
    expect(underP.scope).toBe("section");
    expect(underP.level).toBe(3);
    expect(underP.parent).toBe(1);
    expect(must(underP.parentMatch).line).toBe(6);
    expect(lines(underP.siblings)).toEqual([7]);
    expect(taken(underP)).toEqual([[2, 7]]);
    expect(underP.tail).toEqual([]);

    const underQ = must(must(items[4]).run);
    expect(underQ.parent).toBe(3);
    expect(must(underQ.parentMatch).line).toBe(8);
    expect(lines(underQ.siblings)).toEqual([9, 10]);
    // The sequence of `Q` is [X, Y]: both take their sibling, in order.
    expect(taken(underQ)).toEqual([
      [4, 9],
      [5, 10],
    ]);
    // Two parents, two runs, two objects; the members of one parent share their run.
    expect(underQ).not.toBe(underP);
    expect(must(items[5]).run).toBe(underQ);
  });

  it("the run of one parent is not reused for another: a sibling of P is no sibling of Q", () => {
    // `### X` of `## Q` finds only `### Z` in its own section: missing, although `### X` is in P.
    const items = run(["# Guide", "## P", "### X", "## Q", "### X"], ["# Guide", "## P", "### X", "## Q", "### Z"]);
    expect(must(items[2]).match?.line).toBe(7);
    expect(must(items[4]).match).toBeNull();
    expect(lines(must(must(items[4]).run).siblings)).toEqual([9]);
    expect(lines(must(must(items[4]).run).tail)).toEqual([9]);
  });

  it("a section-scope run of another level inside the same parent is a separate run", () => {
    // Template parent `## P`: `#### Deep` (level 4) and `### X` (level 3) are both its children.
    const items = run(["## P", "#### Deep", "### X"], ["## P", "### X", "#### Deep"]);
    const level4 = must(must(items[1]).run);
    const level3 = must(must(items[2]).run);
    expect(level4).not.toBe(level3);
    expect([level4.level, level3.level]).toEqual([4, 3]);
    expect(taken(level4)).toEqual([[1, 7]]);
    expect(taken(level3)).toEqual([[2, 6]]);
    expect(level4.parent).toBe(0);
    expect(level3.parent).toBe(0);
  });

  it("a section-scope heading under an unmatched parent is not checked: no run, no match", () => {
    // `## P` looks at `## Other` (L5): missing, so `### X` is not checked (spec 2.6 'Checked').
    const items = run(["## P", "### X"], ["## Other", "### X"]);
    const child = must(items[1]);
    expect(child.checked).toBe(false);
    expect(child.run).toBeNull();
    expect(child.match).toBeNull();
    expect(child.parentMatch).toBeNull();
  });

  it("the tail of a section-scope run is the siblings after the last position, in its section", () => {
    const items = run(["## P", "### X"], ["## P", "### X", "### Y", "### Z", "## Q", "### W"]);
    const found = must(must(items[1]).run);
    expect(lines(found.siblings)).toEqual([6, 7, 8]);
    expect(taken(found)).toEqual([[1, 6]]);
    expect(lines(found.tail)).toEqual([7, 8]);
  });
});

describe("HeadingPosition.repeatMisses: tail siblings of a repeat heading (2.10 step 4)", () => {
  const RELEASE = '## R [pattern:"v{semver}"] [repeat-rules:same-level]';

  it("lists the tail siblings matching the pattern, in file order, never the instances", () => {
    // `R` takes L5; `Stray` (L6) ends the run. The tail is L6, L7, L8; L7 and L8 match.
    const items = run([RELEASE], ["## v1.0.0", "## Stray", "## v0.9.0", "## v0.8.0"]);
    const found = positionOf(items, 0);
    expect(lines(found.instances)).toEqual([5]);
    expect(lines(must(items[0]).run?.tail ?? [])).toEqual([6, 7, 8]);
    expect(lines(found.repeatMisses)).toEqual([7, 8]);
  });

  it("is empty when no tail sibling matches, and when the tail is empty", () => {
    const none = positionOf(run([RELEASE], ["## v1.0.0", "## Stray", "## Other"]), 0);
    expect(none.repeatMisses).toEqual([]);
    // Both siblings are instances: no tail at all.
    const items = run([RELEASE], ["## v1.0.0", "## v0.9.0"]);
    expect(lines(positionOf(items, 0).instances)).toEqual([5, 6]);
    expect(must(items[0]).run?.tail).toEqual([]);
    expect(positionOf(items, 0).repeatMisses).toEqual([]);
  });

  it("is empty for every position that is not a REPEAT position, whatever the tail", () => {
    // A single placeholder position (`S`) and an exact-text one (`A`) take one sibling each;
    // L7 matches `S` but no repeat position exists: an extra, not a repeat miss (spec 2.10).
    const items = run(["## A", '## S [pattern:"v{semver}"]'], ["## A", "## v1.0.0", "## v0.9.0"]);
    expect(lines(must(items[0]).run?.tail ?? [])).toEqual([7]);
    expect(positionOf(items, 0).repeatMisses).toEqual([]);
    expect(positionOf(items, 1).repeatMisses).toEqual([]);
  });

  it("a tail sibling is listed once, under the FIRST repeat heading it matches", () => {
    // `Release` takes L5, `Tag` takes L6 (`vNext`), `Stray` (L7) ends the run. L8 `v0.9.0`
    // matches both patterns: `Release` (first in template order) lists it. L9 `vBeta` matches
    // `v{text}` only: `Tag` lists it. L7 matches neither.
    const items = run([RELEASE, '## Tag [pattern:"v{text}"] [repeat-rules:same-level]'], ["## v1.0.0", "## vNext", "## Stray", "## v0.9.0", "## vBeta"]);
    expect(lines(positionOf(items, 0).instances)).toEqual([5]);
    expect(lines(positionOf(items, 1).instances)).toEqual([6]);
    expect(lines(must(items[0]).run?.tail ?? [])).toEqual([7, 8, 9]);
    expect(lines(positionOf(items, 0).repeatMisses)).toEqual([8]);
    expect(lines(positionOf(items, 1).repeatMisses)).toEqual([9]);
  });

  it("an optional repeat heading with zero instances still lists the matching tail", () => {
    // `R` does not match `Notes` (L5) and takes nothing; `Notes` takes L5; L6 is the tail.
    const items = run([`${RELEASE} [presence:optional]`, "## Notes"], ["## Notes", "## v1.0.0"]);
    const found = positionOf(items, 0);
    expect(found.instances).toEqual([]);
    expect(found.match).toBeNull();
    expect(lines(found.repeatMisses)).toEqual([6]);
  });

  it("a literal-pattern repeat heading is a repeat position too (2.10 'Kinds')", () => {
    const items = run(['## Entry [pattern:"Entry"] [repeat-rules:same-level]'], ["## Entry", "## Other", "## Entry"]);
    expect(lines(positionOf(items, 0).repeatMisses)).toEqual([7]);
  });

  it("a set-aside sibling is not in the tail, so it is never listed", () => {
    // L7 `v9.9.9` is set aside by the template-only heading (MTL603's), although it matches `R`.
    const items = run([RELEASE, "## v9.9.9 [presence:template-only]"], ["## v1.0.0", "## Stray", "## v9.9.9"]);
    const found = must(items[0]).run;
    expect(lines(found?.setAside ?? [])).toEqual([7]);
    expect(lines(found?.tail ?? [])).toEqual([6]);
    expect(positionOf(items, 0).repeatMisses).toEqual([]);
  });

  it("in section scope only the tail of its own parent section counts", () => {
    // `S` takes L6, `Notes` (L7) ends the run, L8 `Step 2` is in the tail; L10 `Step 3` lies in
    // the section of `## Q`, outside the section of `## P`.
    const items = run(["## P", '### S [pattern:"Step {digits}"] [repeat-rules:same-level]'], ["## P", "### Step 1", "### Notes", "### Step 2", "## Q", "### Step 3"]);
    const found = positionOf(items, 1);
    expect(lines(found.instances)).toEqual([6]);
    expect(lines(must(items[1]).run?.tail ?? [])).toEqual([7, 8]);
    expect(lines(found.repeatMisses)).toEqual([8]);
  });
});

describe("HeadingPosition.foundLater: the MTL601 'found later' hint (spec 2.10 step 3b)", () => {
  it("owner example I: a missing heading names its later sibling, which stays in the tail", () => {
    // `Alpha` looks at `Beta` (L5): nothing taken. L6, from the cursor onward, has its text.
    const items = run(["## Alpha", "## Beta"], ["## Beta", "## Alpha"]);
    const alpha = positionOf(items, 0);
    expect(alpha.match).toBeNull();
    expect(alpha.foundLater?.line).toBe(6);
    // The hint changes no match: `Beta` still takes L5 and L6 stays in the tail.
    expect(positionOf(items, 1).match?.line).toBe(5);
    expect(lines(must(items[0]).run?.tail ?? [])).toEqual([6]);
  });

  it("a position that took its sibling has no hint", () => {
    const items = run(["## Alpha", "## Beta"], ["## Alpha", "## Beta", "## Alpha"]);
    expect(positionOf(items, 0).foundLater).toBeNull();
    expect(positionOf(items, 1).foundLater).toBeNull();
  });

  it("two later siblings with the text: the FIRST one, in file order, is named", () => {
    const items = run(["## Alpha", "## Beta"], ["## Beta", "## Alpha", "## Alpha"]);
    expect(positionOf(items, 0).foundLater?.line).toBe(6);
  });

  it("a sibling with the text BEFORE the cursor gives no hint (taken earlier)", () => {
    // The first `Alpha` takes L5; the second finds no sibling left.
    const twice = run(["## Alpha", "## Alpha"], ["## Alpha"]);
    expect(positionOf(twice, 1).foundLater).toBeNull();
    // Owner example B: the optional `{text}` position takes `toto` (L5) before `toto` is reached.
    const early = run(['## X [pattern:"{text}"] [presence:optional]', "## toto"], ["## toto"]);
    expect(positionOf(early, 0).match?.line).toBe(5);
    expect(positionOf(early, 1).foundLater).toBeNull();
  });

  it("a heading with the text at ANOTHER level is no sibling: no hint", () => {
    expect(positionOf(run(["## Alpha"], ["### Alpha"]), 0).foundLater).toBeNull();
    expect(positionOf(run(["## Alpha"], ["# Alpha"]), 0).foundLater).toBeNull();
  });

  it("a set-aside sibling with the text gives no hint (it is outside the run)", () => {
    // The template-only `Alpha` sets L6 aside; the required `Alpha` (index 2) finds nothing.
    const items = run(["## Alpha [presence:template-only]", "## Beta", "## Alpha"], ["## Beta", "## Alpha"]);
    const found = must(items[2]).run;
    expect(lines(found?.setAside ?? [])).toEqual([6]);
    expect(positionOf(items, 2).match).toBeNull();
    expect(positionOf(items, 2).foundLater).toBeNull();
  });

  it("a pattern heading keeps MTL605: the hint belongs to exact-text headings only", () => {
    // `Alpha` is the literal pattern of its text: it takes nothing at L5 and the target has
    // `Alpha` at L6, yet the message stays the MTL605 one (spec 2.10 step 3b, last sentence).
    const items = run(['## Alpha [pattern:"Alpha"]', "## Beta"], ["## Beta", "## Alpha"]);
    expect(positionOf(items, 0).match).toBeNull();
    expect(positionOf(items, 0).foundLater).toBeNull();
  });

  it("the named sibling can be taken later by another position: still no match change", () => {
    // `Alpha` takes nothing at L5 (hint L6); the repeat `{text}` position then takes L5 and L6.
    const items = run(["## Alpha", '## X [pattern:"{text}"] [repeat-rules:same-level]'], ["## Beta", "## Alpha"]);
    expect(positionOf(items, 0).foundLater?.line).toBe(6);
    expect(lines(positionOf(items, 1).instances)).toEqual([5, 6]);
    expect(must(items[0]).run?.tail).toEqual([]);
  });
});
