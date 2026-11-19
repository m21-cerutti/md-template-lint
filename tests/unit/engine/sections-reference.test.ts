/**
 * Sections of `loadDocument` (`buildSections` in src/engine/load.ts, a one-pass stack) against a
 * straightforward O(H^2) reference written here from the rule of spec 2.6: the parent of a heading
 * is the nearest preceding heading with a lower level, and its section ends on the line before the
 * next heading of equal or higher level (or on the last file line).
 */
import { describe, expect, it } from "vitest";
import { loadDocument } from "../../../src/engine/load.js";

const FRONTMATTER = ["---", "title: x", "---"];

/** A document with one heading per level of `levels`, each followed by one text line. */
function documentOf(levels: readonly number[]): string {
  const lines = [...FRONTMATTER];
  levels.forEach((level, index) => lines.push(`${"#".repeat(level)} H${index}`, `text ${index}`));
  return `${lines.join("\n")}\n`;
}

interface Expected {
  readonly level: number;
  readonly line: number;
  readonly parent: number | null;
  readonly endLine: number;
}

/** The O(H^2) reference: scan back for the parent, scan forward for the end. */
function reference(levels: readonly number[], lineCount: number): Expected[] {
  const lineOf = (index: number): number => FRONTMATTER.length + 1 + 2 * index;
  return levels.map((level, index) => {
    let parent: number | null = null;
    for (let before = index - 1; before >= 0 && parent === null; before -= 1) {
      if ((levels[before] ?? 0) < level) parent = before;
    }
    let endLine = lineCount;
    for (let after = index + 1; after < levels.length; after += 1) {
      if ((levels[after] ?? 0) <= level) {
        endLine = lineOf(after) - 1;
        break;
      }
    }
    return { level, line: lineOf(index), parent, endLine };
  });
}

describe("sections: the one-pass stack equals the O(H^2) reference", () => {
  it.each([[[]], [[3, 1, 2, 2, 1]], [[1, 3, 2, 4, 2]], [[2, 2, 2]]] as const)("levels %j", (levels) => {
    const text = documentOf(levels);
    const result = loadDocument(text);
    if (!result.ok) throw new Error(`load failed: ${result.failure.reason}`);
    const lineCount = text.split("\n").length;
    const actual = result.model.sections.map(({ level, line, parent, endLine }) => ({ level, line, parent, endLine }));
    expect(actual).toEqual(reference(levels, lineCount));
  });
});
