/**
 * Characterization of the section tree built by `loadDocument` (src/engine/load.ts `buildSections`) on
 * large and awkward heading layouts (A4 of the perf plan, tmp/PLAN_perf-bench.md, target S1). A section
 * runs to the next heading of equal or higher level, and its parent is the nearest preceding heading with
 * a lower level (spec 2.6, ADR 0009). The small tables are derived by hand from those two definitions;
 * the 5000-heading document is checked against the same definitions written as a formula. The body of
 * every section is also compared with the lines between its heading and its last line, so a change of
 * the tree cannot hide in a body.
 */
import { describe, expect, it } from "vitest";
import { loadDocument } from "../../../src/engine/load.js";
import type { Section } from "../../../src/engine/model.js";

const FRONT = ["---", "title: x", "---"];

/** `[level, text, line, endLine, parent]`. */
type Row = readonly [number, string, number, number, number | null];

const rowOf = (section: Section): Row => [section.level, section.text, section.line, section.endLine, section.parent];

/** The text of a document: the frontmatter, then each heading followed by one body line `t<i>`. */
function document(levels: readonly number[], lineEnd = "\n", trailing = false): { readonly text: string; readonly lines: readonly string[] } {
  const lines = [...FRONT, ...levels.flatMap((level, index) => [`${"#".repeat(level)} h${index}`, `t${index}`])];
  return { text: lines.join(lineEnd) + (trailing ? lineEnd : ""), lines };
}

function sectionsOf(text: string): readonly Section[] {
  const loaded = loadDocument(text);
  if (!loaded.ok) throw new Error(`load failed: ${loaded.failure.reason}`);
  return loaded.model.sections;
}

/** The body of a section: the lines after its heading up to its `endLine`, as the spec words it. */
function expectBodies(sections: readonly Section[], lines: readonly string[]): void {
  for (const section of sections) expect(section.body, `${section.text} at line ${section.line}`).toBe(lines.slice(section.line, section.endLine).join("\n"));
}

describe("S1: section tree of a document with 5000 flat H2 headings", () => {
  const COUNT = 5000;
  const levels = Array.from({ length: COUNT }, () => 2);
  const { text, lines } = document(levels);
  const sections = sectionsOf(text);

  it("one section per heading: line 2n+2, ends on its body line, no parent; the last runs to the end of the file", () => {
    expect(sections).toHaveLength(COUNT);
    const expected = Array.from({ length: COUNT }, (_, index): Row => [2, `h${index}`, 4 + 2 * index, index === COUNT - 1 ? lines.length : 5 + 2 * index, null]);
    expect(sections.map(rowOf)).toEqual(expected);
    expect(lines).toHaveLength(10003);
  });

  it("the body of each section is its one text line; the last one too", () => {
    expectBodies(sections, lines);
    expect(sections[0]?.body).toBe("t0");
    expect(sections[COUNT - 1]?.body).toBe(`t${COUNT - 1}`);
  });
});

describe("S1: section tree of a deep zig-zag of levels 1, 6, 2, 5, 3, 4 repeated twice", () => {
  const levels = [1, 6, 2, 5, 3, 4, 1, 6, 2, 5, 3, 4];
  const { text, lines } = document(levels);
  const sections = sectionsOf(text);

  it("each section ends before the next heading of equal or higher level; its parent is the nearest lower one", () => {
    expect(sections.map(rowOf)).toEqual([
      [1, "h0", 4, 15, null],
      [6, "h1", 6, 7, 0],
      [2, "h2", 8, 15, 0],
      [5, "h3", 10, 11, 2],
      [3, "h4", 12, 15, 2],
      [4, "h5", 14, 15, 4],
      [1, "h6", 16, 27, null],
      [6, "h7", 18, 19, 6],
      [2, "h8", 20, 27, 6],
      [5, "h9", 22, 23, 8],
      [3, "h10", 24, 27, 8],
      [4, "h11", 26, 27, 10],
    ]);
    expectBodies(sections, lines);
  });
});

describe("S1: headings with no lower level before them", () => {
  const levels = [3, 2, 1, 4, 3, 5, 2];
  const { text, lines } = document(levels);
  const sections = sectionsOf(text);

  it("have no parent; a later deeper heading takes the nearest lower one, never an earlier same-or-deeper one", () => {
    expect(sections.map(rowOf)).toEqual([
      [3, "h0", 4, 5, null],
      [2, "h1", 6, 7, null],
      [1, "h2", 8, 17, null],
      [4, "h3", 10, 11, 2],
      [3, "h4", 12, 15, 2],
      [5, "h5", 14, 15, 4],
      [2, "h6", 16, 17, 2],
    ]);
    expectBodies(sections, lines);
  });
});

describe("S1: line ends and the last line", () => {
  const levels = [3, 2, 1, 4, 3, 5, 2];

  it("CRLF line ends give the very same tree and bodies as LF", () => {
    const lf = document(levels);
    const crlf = document(levels, "\r\n");
    expect(sectionsOf(crlf.text).map(rowOf)).toEqual(sectionsOf(lf.text).map(rowOf));
    expect(sectionsOf(crlf.text).map((section) => section.body)).toEqual(sectionsOf(lf.text).map((section) => section.body));
    expectBodies(sectionsOf(crlf.text), lf.lines);
  });

  it("a lone CR is a line end too", () => {
    const lf = document(levels);
    const cr = document(levels, "\r");
    expect(sectionsOf(cr.text).map(rowOf)).toEqual(sectionsOf(lf.text).map(rowOf));
  });

  it("a heading on the last line (no trailing newline) ends on its own line and has an empty body", () => {
    const sections = sectionsOf([...FRONT, "## A", "text", "## B"].join("\n"));
    expect(sections.map(rowOf)).toEqual([
      [2, "A", 4, 5, null],
      [2, "B", 6, 6, null],
    ]);
    expect(sections.map((section) => section.body)).toEqual(["text", ""]);
  });

  it("with a trailing newline the last section ends on the empty line after it (the file has one more line)", () => {
    const sections = sectionsOf([...FRONT, "## A", "text", "## B", ""].join("\n"));
    expect(sections.map(rowOf)).toEqual([
      [2, "A", 4, 5, null],
      [2, "B", 6, 7, null],
    ]);
    expect(sections.map((section) => section.body)).toEqual(["text", ""]);
  });

  it("a trailing newline after the last body line also adds one line to the last section", () => {
    const { text, lines } = document([2, 3], "\n", true);
    const sections = sectionsOf(text);
    expect(sections.map(rowOf)).toEqual([
      [2, "h0", 4, 8, null],
      [3, "h1", 6, 8, 0],
    ]);
    expect(sections.map((section) => section.body)).toEqual([[...lines.slice(4), ""].join("\n"), [...lines.slice(6), ""].join("\n")]);
  });
});
