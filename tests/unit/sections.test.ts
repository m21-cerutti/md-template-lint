/**
 * The all-levels section model (docs/spec.md 2.6, change C10, docs/adr/0009-all-heading-levels.md):
 * `Section.endLine`, `Section.parent` (src/engine/load.ts) and the scope, match and `checked`
 * flag of `matchHeadings` (src/engine/model.ts). The match is POSITIONAL (spec 2.6 "Match of T",
 * 2.10 "Positional match", ADR 0012): the template headings of one level and scope take the
 * siblings of that scope in order, adjacent, with no skipping. Every expected value below is
 * derived by hand from the spec definitions, not from the code. Body line 1 is file line 5 (the
 * frontmatter takes lines 1 to 4), so the `L<n>` comments are file lines. The positional run
 * itself (`HeadingRun`, `HeadingPosition`) is covered by tests/unit/heading-run.test.ts.
 */
import { describe, expect, it } from "vitest";
import { loadDocument } from "../../src/engine/load.js";
import {
  headingPresence,
  matchHeadings,
  type DocumentModel,
  type HeadingMatch,
  type Section,
} from "../../src/engine/model.js";

const FRONTMATTER = ["---", "title: x", "---", ""];

/** A document whose body starts on file line 5; no trailing newline, so the last line is exact. */
function load(body: readonly string[], lineEnd = "\n"): DocumentModel {
  const result = loadDocument([...FRONTMATTER, ...body].join(lineEnd));
  if (!result.ok) throw new Error(`load failed: ${result.failure.reason}`);
  return result.model;
}

const sectionView = (section: Section) => ({
  level: section.level,
  text: section.text,
  line: section.line,
  endLine: section.endLine,
  parent: section.parent,
});

const matchView = (item: HeadingMatch) => ({
  text: item.section.text,
  scope: item.scope,
  match: item.match?.line ?? null,
  parent: item.parentMatch?.line ?? null,
  checked: item.checked,
});

/** `matchHeadings` of two bodies, as views keyed by template heading text. */
function matched(template: readonly string[], target: readonly string[]) {
  const items = matchHeadings(load(template), load(target));
  return new Map(items.map((item) => [item.section.text, matchView(item)]));
}

const must = <T>(value: T | undefined): T => {
  if (value === undefined) throw new Error("missing entry");
  return value;
};

describe("Section.endLine and Section.parent (spec 2.6 'Levels, parents and scope')", () => {
  const BODY = [
    "# One", //                 L5
    "", //                      L6
    "### Deep", //              L7
    "", //                      L8
    "text", //                  L9
    "", //                      L10
    "## Two", //                L11
    "", //                      L12
    "#### Four", //             L13
    "", //                      L14
    "##### Five", //            L15
    "", //                      L16
    "###### Six", //            L17
    "", //                      L18
    "# Three", //               L19
    "", //                      L20
    "end", //                   L21
  ];

  it("a section ends on the line before the next heading of equal or LOWER number", () => {
    // `### Deep` ends at L10: `## Two` (level 2 <= 3) follows. The deeper headings of `## Two`
    // end at L18, the line before `# Three`. The last section ends on the last line (L21).
    expect(load(BODY).sections.map(sectionView)).toEqual([
      { level: 1, text: "One", line: 5, endLine: 18, parent: null },
      { level: 3, text: "Deep", line: 7, endLine: 10, parent: 0 },
      { level: 2, text: "Two", line: 11, endLine: 18, parent: 0 },
      { level: 4, text: "Four", line: 13, endLine: 18, parent: 2 },
      { level: 5, text: "Five", line: 15, endLine: 18, parent: 3 },
      { level: 6, text: "Six", line: 17, endLine: 18, parent: 4 },
      { level: 1, text: "Three", line: 19, endLine: 21, parent: null },
    ]);
  });

  it("H1 then H3: the parent of the H3 is the H1 (level gaps are allowed)", () => {
    expect(must(load(BODY).sections[1]).parent).toBe(0);
  });

  it("a leading H3 has no parent; a later H2 is no child of it; its own H3 is", () => {
    const sections = load([
      "### Lead", //  L5
      "## Next", //   L6
      "### Inner", // L7
      "# Top", //     L8
      "#### Late", // L9
    ]).sections;
    expect(sections.map((section) => section.parent)).toEqual([null, null, 1, null, 3]);
  });

  it("the parent is the NEAREST preceding heading with a lower level (H4 to H6, siblings)", () => {
    const sections = load([
      "# A", //        L5
      "### B", //      L6  parent A
      "#### C", //     L7  parent B
      "### D", //      L8  parent A (B is a sibling, not lower)
      "#### E", //     L9  parent D
      "## F", //       L10 parent A
      "### G", //      L11 parent F
    ]).sections;
    expect(sections.map(sectionView)).toEqual([
      { level: 1, text: "A", line: 5, endLine: 11, parent: null },
      { level: 3, text: "B", line: 6, endLine: 7, parent: 0 },
      { level: 4, text: "C", line: 7, endLine: 7, parent: 1 },
      { level: 3, text: "D", line: 8, endLine: 9, parent: 0 },
      { level: 4, text: "E", line: 9, endLine: 9, parent: 3 },
      { level: 2, text: "F", line: 10, endLine: 11, parent: 0 },
      { level: 3, text: "G", line: 11, endLine: 11, parent: 5 },
    ]);
  });

  it("the body keeps deeper headings and their text, and stops at the next equal or higher one", () => {
    const sections = load(BODY).sections;
    const one = must(sections[0]).body;
    for (const kept of ["### Deep", "text", "## Two", "#### Four", "###### Six"]) {
      expect(one).toContain(kept);
    }
    expect(one).not.toContain("# Three");
    expect(one).not.toContain("end");
    expect(must(sections[1]).body.trim()).toBe("text");
    expect(must(sections[5]).body.trim()).toBe("");
    expect(must(sections[6]).body.trim()).toBe("end");
  });

  it("a heading-like line inside a backtick or tilde fence is not a section", () => {
    const sections = load([
      "# Top", //              L5
      "```", //                L6
      "## Not a heading", //   L7
      "```", //                L8
      "~~~", //                L9
      "### Not one either", // L10
      "~~~", //                L11
      "## Real", //            L12
    ]).sections;
    expect(sections.map(sectionView)).toEqual([
      { level: 1, text: "Top", line: 5, endLine: 12, parent: null },
      { level: 2, text: "Real", line: 12, endLine: 12, parent: 0 },
    ]);
    expect(must(sections[0]).body).toContain("## Not a heading");
  });

  it("CRLF line ends give the same lines, end lines and parents", () => {
    expect(load(BODY, "\r\n").sections.map(sectionView)).toEqual(
      load(BODY).sections.map(sectionView),
    );
  });

  it("recognized tags are peeled at every level; an unrecognized bracket stays in the text", () => {
    const sections = load([
      "###### Deep [presence:optional]", // L5
      "### Notes [optionl]", //            L6
    ]).sections;
    expect(must(sections[0]).text).toBe("Deep");
    expect(headingPresence(must(sections[0]))).toBe("optional");
    expect(must(sections[1]).text).toBe("Notes [optionl]");
    expect(headingPresence(must(sections[1]))).toBe("required");
  });
});

describe("matchHeadings scope (spec 2.6: FILE scope for H1, H2 and no template parent)", () => {
  it("an H2 before the template H2 shifts the run: the parent has no match, its H3 is not checked", () => {
    // Spec 2.10 step 3b: the level-2 position `Context` looks only at the next sibling, `Other`
    // (L6); it does not match, so `Context` takes nothing and is missing. `### Decision` has a
    // parent without match: not checked (2.6 "Checked").
    const result = matched(
      ["# Guide", "## Context", "### Decision"],
      [
        "# Guide", //     L5
        "## Other", //    L6
        "### Decision", // L7  inside `## Other`
        "## Context", //  L8  in the tail of the level-2 run (extra)
        "### Notes", //   L9
      ],
    );
    expect(result.get("Guide")).toEqual({
      text: "Guide",
      scope: "file",
      match: 5,
      parent: null,
      checked: true,
    });
    expect(result.get("Context")).toEqual({
      text: "Context",
      scope: "file",
      match: null,
      parent: null,
      checked: true,
    });
    expect(result.get("Decision")).toEqual({
      text: "Decision",
      scope: "section",
      match: null,
      parent: null,
      checked: false,
    });
  });

  it("an H3 matches only inside the target section of its parent's match", () => {
    // `## Context` takes L5 (first sibling). Its section is L5 to L6 (`## Other` at L7 ends it),
    // so the `### Decision` of L8 (inside `## Other`) is not in scope: Decision is missing and
    // checked (its parent matched).
    const result = matched(
      ["## Context", "### Decision"],
      [
        "## Context", //  L5
        "### Notes", //   L6
        "## Other", //    L7
        "### Decision", // L8  inside `## Other`, not inside `## Context`
      ],
    );
    expect(result.get("Context")).toEqual({
      text: "Context",
      scope: "file",
      match: 5,
      parent: null,
      checked: true,
    });
    expect(result.get("Decision")).toEqual({
      text: "Decision",
      scope: "section",
      match: null,
      parent: 5,
      checked: true,
    });
  });

  it("the parent's position decides the scope, and an adjacent duplicate sits in the tail", () => {
    const first = matched(
      ["## Context", "### Decision"],
      [
        "## Context", //   L5  taken by the position `Context`; its section ends at L6
        "### Other", //    L6
        "## Next", //      L7
        "### Decision", // L8
        "## Context", //   L9  second `Context`: in the tail (extra), not a match
        "### Decision", // L10
      ],
    );
    expect(must(first.get("Decision"))).toMatchObject({ parent: 5, match: null, checked: true });
    const duplicates = matched(
      ["## P", "### X"],
      ["## P", "### X", "### X"], // L5, L6, L7
    );
    // `X` takes L6; the second `### X` (L7) is in the tail, an extra: the match stays L6.
    expect(must(duplicates.get("X"))).toMatchObject({ parent: 5, match: 6 });
  });

  it("the last line of the parent's section is in scope, the next heading's line is not", () => {
    const inside = matched(
      ["## P", "### X"],
      ["## P", "### X", "## Q"], // `### X` on L6 is the last line of `## P` (L5 to L6)
    );
    expect(must(inside.get("X"))).toMatchObject({ parent: 5, match: 6 });
    const outside = matched(
      ["## P", "### X"],
      ["## P", "## Q", "### X"], // L7 is inside `## Q`
    );
    expect(must(outside.get("X"))).toMatchObject({ parent: 5, match: null });
  });

  it("an H3 under an H1 parent is section scope; an H2 under an H1 stays file scope", () => {
    const template = ["# Guide", "## Anywhere", "# Second", "### Under second"];
    const found = matched(template, [
      "## Anywhere", //       L5  before `# Guide`, still a match: file scope
      "# Guide", //           L6
      "# Second", //          L7
      "### Under second", //  L8
    ]);
    expect(must(found.get("Anywhere"))).toMatchObject({ scope: "file", match: 5, checked: true });
    expect(must(found.get("Under second"))).toMatchObject({
      scope: "section",
      parent: 7,
      match: 8,
      checked: true,
    });
    const before = matched(template, [
      "### Under second", // L5  before its parent `# Second`: not in scope
      "# Second", //         L6
    ]);
    expect(must(before.get("Under second"))).toMatchObject({ parent: 6, match: null });
  });

  it("a leading H3 (no template parent) is file scope; its H4 child is section scope", () => {
    // The level-3 file run walks every H3 of the file; `### Lead` is its first sibling (L6).
    const found = matched(
      ["### Lead", "#### Sub"],
      ["## Wrapper", "### Lead", "#### Sub"], // L5, L6, L7
    );
    expect(must(found.get("Lead"))).toEqual({
      text: "Lead",
      scope: "file",
      match: 6,
      parent: null,
      checked: true,
    });
    expect(must(found.get("Sub"))).toEqual({
      text: "Sub",
      scope: "section",
      match: 7,
      parent: 6,
      checked: true,
    });
    // An H3 after an H2 of the template: `### A` leads (file), `### C` follows `## B` (section).
    // File-scope level-3 run: the sequence is `A` only; the H3 siblings of the whole file are
    // `C` (L6) and `A` (L7). `A` looks at the first one, `C`: no match, so `A` is missing (an
    // extra before the heading is not skipped, 2.6 "Extra").
    const mixed = matched(["### A", "## B", "### C"], ["## B", "### C", "### A"]);
    expect(must(mixed.get("A"))).toMatchObject({ scope: "file", match: null });
    expect(must(mixed.get("B"))).toMatchObject({ scope: "file", match: 5 });
    expect(must(mixed.get("C"))).toMatchObject({ scope: "section", parent: 5, match: 6 });
    // With the leading H3 first in the file it matches.
    const lead = matched(["### A", "## B", "### C"], ["### A", "## B", "### C"]);
    expect(must(lead.get("A"))).toMatchObject({ scope: "file", match: 5 });
    expect(must(lead.get("C"))).toMatchObject({ scope: "section", parent: 6, match: 7 });
  });

  it("levels match exactly at every level: the same text at another level is no match", () => {
    expect(must(matched(["## Context"], ["# Context", "### Context"]).get("Context")).match).toBe(
      null,
    );
    expect(must(matched(["# Context"], ["## Context"]).get("Context")).match).toBeNull();
    expect(must(matched(["## Context"], ["## Context"]).get("Context")).match).toBe(5);
  });

  it("nested scope: an H3 before `Detail` shifts its run, so its H4 child is not checked", () => {
    // Level-3 run in the section of `## Context` (L5 to L9): siblings `Other` (L6), `Detail`
    // (L8). `Detail` looks at `Other`: no match, so `Detail` is missing (2.10 step 3b) and
    // `#### Option` has no checked parent.
    const found = matched(
      ["## Context", "### Detail", "#### Option"],
      [
        "## Context", //  L5
        "### Other", //   L6
        "#### Option", // L7  inside `### Other`
        "### Detail", //  L8
        "#### Option", // L9  inside `### Detail`
      ],
    );
    expect(must(found.get("Detail"))).toMatchObject({ parent: 5, match: null, checked: true });
    expect(must(found.get("Option"))).toMatchObject({ parent: null, match: null, checked: false });
  });

  it("nested scope: an H4 matches only inside the section of the matched H3 of the matched H2", () => {
    const found = matched(
      ["## Context", "### Detail", "#### Option"],
      [
        "## Context", //  L5
        "### Detail", //  L6  first sibling: matched; its section ends at L7
        "#### Option", // L7  inside `### Detail`
        "### Other", //   L8
        "#### Option", // L9  inside `### Other`: not in scope, an extra
      ],
    );
    expect(must(found.get("Detail"))).toMatchObject({ parent: 5, match: 6 });
    expect(must(found.get("Option"))).toMatchObject({ parent: 6, match: 7, checked: true });
  });
});

describe("matchHeadings checked flag (spec 2.6 'Checked')", () => {
  const TEMPLATE = [
    "# Guide", //                                    0
    "## Missing", //                                 1
    "### Child1", //                                 2  parent Missing
    "#### Grand1", //                                3  parent Child1
    "## Opt [presence:optional]", //                 4
    "### Child2", //                                 5  parent Opt
    "## Draft [presence:template-only]", //          6
    "### Child3", //                                 7  parent Draft
    "## Cond [presence:conditional:when needed]", // 8
    "### Child4", //                                 9  parent Cond
    "## Here [presence:optional]", //                10
    "### Child5", //                                 11 parent Here
    "#### Grand5", //                                12 parent Child5
  ];
  const TARGET = [
    "# Guide", //     L5
    "## Draft", //    L6
    "### Child3", //  L7  present, but its parent is template-only
    "## Here", //     L8
    "### Child5", //  L9
    "#### Grand5", // L10
  ];
  const result = matched(TEMPLATE, TARGET);

  it("every file-scope heading is checked, whatever its presence or its template parent", () => {
    for (const text of ["Guide", "Missing", "Opt", "Draft", "Cond", "Here"]) {
      expect(must(result.get(text)).checked, text).toBe(true);
    }
    expect(must(result.get("Missing")).match).toBeNull();
    // `Draft` is `[presence:template-only]`: not a position, so it has no match (2.6 "Match of
    // T"); its sibling (L6) is set aside (2.10 step 1) and does not shift the level-2 run.
    expect(must(result.get("Draft")).match).toBeNull();
    // Level-2 positions: Missing, Opt, Cond, Here (no Draft). The only free sibling, `Here`
    // (L8), is looked at by Missing, Opt and Cond in turn (no match, nothing taken), then taken.
    expect(must(result.get("Here")).match).toBe(8);
  });

  it("a section-scope heading under a missing, absent optional, conditional or template-only parent is not checked", () => {
    for (const text of ["Child1", "Child2", "Child3", "Child4"]) {
      expect(must(result.get(text)).checked, text).toBe(false);
    }
  });

  it("the unchecked flag reaches the section-scope descendants of an unchecked heading", () => {
    expect(must(result.get("Grand1")).checked).toBe(false);
  });

  it("a section-scope heading under a matched optional parent is checked, and so are its descendants", () => {
    expect(must(result.get("Child5"))).toEqual({
      text: "Child5",
      scope: "section",
      match: 9,
      parent: 8,
      checked: true,
    });
    expect(must(result.get("Grand5"))).toEqual({
      text: "Grand5",
      scope: "section",
      match: 10,
      parent: 9,
      checked: true,
    });
  });

  it("the results come in template order, one per template heading", () => {
    const items = matchHeadings(load(TEMPLATE), load(TARGET));
    expect(items.map((item) => item.index)).toEqual(TEMPLATE.map((_, index) => index));
  });
});

describe("matchHeadings presence modes (spec 2.10 steps 1 to 3)", () => {
  it("template-only is no position (no match), the others take their sibling in order", () => {
    const found = matched(
      ["## A", "### B", "## C [presence:optional]", "## D [presence:template-only]"],
      ["## A", "### B", "## C", "## D"], // L5 to L8
    );
    for (const text of ["A", "B", "C"]) {
      expect(must(found.get(text)).match, text).not.toBeNull();
    }
    expect(must(found.get("D")).match).toBeNull();
  });
});
