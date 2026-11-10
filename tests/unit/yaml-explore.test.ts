/**
 * A6 spike, part 2: `yaml` loading options for spec 1.2 (failsafe schema,
 * duplicate keys). Part 1 (comment binding) is yaml-spike.test.ts.
 */
import { describe, expect, it } from "vitest";
import { parseDocument } from "yaml";

const load = (src: string): unknown =>
  parseDocument(src, { schema: "failsafe", uniqueKeys: false }).toJS();

describe("yaml loading spike (spec 1.2)", () => {
  it("keeps every scalar as a string (no coercion)", () => {
    expect(load("a: yes\nb: 2026-08-10\nc: 1.0\nd: ~\ne:\n")).toEqual({
      a: "yes",
      b: "2026-08-10",
      c: "1.0",
      d: "~",
      e: "",
    });
  });

  it("keeps lists and maps, last duplicate key wins without error", () => {
    const doc = parseDocument("k: a\nk: [x, y]\nm:\n  s: 1\n", {
      schema: "failsafe",
      uniqueKeys: false,
    });
    expect(doc.errors).toEqual([]);
    expect(doc.toJS()).toEqual({ k: ["x", "y"], m: { s: "1" } });
  });
});
