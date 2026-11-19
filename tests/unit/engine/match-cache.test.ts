/**
 * `matchHeadings` (src/engine/model.ts) is computed once per (template, target) pair and the array
 * is shared by every rule that reads it: the same pair gives the same array, another pair another one.
 */
import { describe, expect, it } from "vitest";
import { loadDocument } from "../../../src/engine/load.js";
import { matchHeadings, type DocumentModel } from "../../../src/engine/model.js";

function load(body: readonly string[]): DocumentModel {
  const result = loadDocument(["---", "title: x", "---", "", ...body].join("\n"));
  if (!result.ok) throw new Error(`load failed: ${result.failure.reason}`);
  return result.model;
}

describe("matchHeadings cache", () => {
  const template = load(["# A", "## B"]);
  const target = load(["# A", "## B"]);
  const other = load(["# A"]);

  it("returns the same array for the same template and target", () => {
    expect(matchHeadings(template, target)).toBe(matchHeadings(template, target));
  });

  it("returns another result for another target or another template", () => {
    const first = matchHeadings(template, target);
    expect(matchHeadings(template, other)).not.toBe(first);
    expect(matchHeadings(other, target)).not.toBe(first);
    expect(matchHeadings(template, other)).toHaveLength(2);
    expect(matchHeadings(other, target)).toHaveLength(1);
  });
});
