/**
 * Order keys of the heading order tags (src/engine/pattern.ts, docs/spec.md 2.10 "Order",
 * A72m, A72n): the FIRST NUMBER, FIRST DATE and FIRST SEMVER scans, SemVer 2.0.0 precedence,
 * the canonical order tag text and the comparison of keys. Expected values are the examples
 * of the spec, plus limit cases derived from its definitions.
 */
import { describe, expect, it } from "vitest";
import { compareOrderKeys, compareSemver, firstDate, firstNumber, firstSemver, orderKey, orderTagText, orderToken, type OrderTag } from "../../../src/engine/pattern.js";

describe("firstNumber (spec 2.10 FIRST NUMBER)", () => {
  const cases: readonly (readonly [string, number | null])[] = [
    // The examples of the spec.
    ["Step 10 - Deploy", 10],
    ["v1.5.2", 1.5],
    ["Temp -3", -3],
    ["Epic-2", 2],
    ["1e5 runs", 100000],
    ["2026-10-01", 2026],
    ["Intro", null],
    // A `-` that is the first character belongs to the number.
    ["-4 degrees", -4],
    // Longest NUMERIC TEXT: decimals, exponents with a sign, leading zeros.
    ["Run 1.5E-3 s", 0.0015],
    ["Value 007", 7],
    ["x -1.5", -1.5],
    // A `-` after a digit-free letter, or after a letter of another script, is no sign.
    ["Épique-3", 3],
    // `1.` and `1e` are not NUMERIC TEXT: the number stops before them.
    ["Step 1. Install", 1],
    ["1e runs", 1],
    // The FIRST number wins, not the second.
    ["Sprint 3 of 10", 3],
    // A non-ASCII letter (general category L) before the `-`: no sign.
    ["Эпик-3", 3],
    // A letter outside the BMP (U+1D400, a surrogate pair) before the `-`: one code point,
    // a letter, so no sign.
    ["\u{1D400}-3", 3],
    // A non-letter outside the BMP before the `-`: the `-` is a sign.
    ["\u{1F642}-3", -3],
    // An IEEE double: an exponent out of range is Infinity.
    ["Run 1e999", Number.POSITIVE_INFINITY],
  ];
  for (const [text, expected] of cases) {
    it(`${JSON.stringify(text)} -> ${String(expected)}`, () => {
      expect(firstNumber(text)).toBe(expected);
    });
  }
});

describe("firstDate (spec 2.10 FIRST DATE)", () => {
  const cases: readonly (readonly [string, string | null])[] = [
    ["[1.2.0] - 2026-03-01", "2026-03-01"],
    // A shape that fails the calendar test is skipped and the scan goes on.
    ["Sprint 2026-02-30 / 2026-03-02", "2026-03-02"],
    ["2026-10", null],
    ["Intro", null],
    // A digit right before or right after the 10 characters: not a date there.
    ["12026-03-01", null],
    ["2026-03-011", null],
    // Leap years: 2024-02-29 is a date, 2025-02-29 is not.
    ["Leap 2024-02-29", "2024-02-29"],
    ["No 2025-02-29", null],
    ["Year 0000-01-01", null],
  ];
  for (const [text, expected] of cases) {
    it(`${JSON.stringify(text)} -> ${String(expected)}`, () => {
      expect(firstDate(text)).toBe(expected);
    });
  }
});

describe("firstSemver (spec 2.10 FIRST SEMVER)", () => {
  const cases: readonly (readonly [string, string | null])[] = [
    // The examples of the spec.
    ["[1.10.0] - 2026-04-01", "1.10.0"],
    ["v2.0.0-rc.1", "2.0.0-rc.1"],
    ["1.2.0 - 2026-03-01", "1.2.0"],
    ["Release 1.2", null],
    ["Version 10", null],
    ["Intro", null],
    // Build metadata is part of the SEMVER text (ignored only by the precedence).
    ["v1.0.0+build.5 notes", "1.0.0+build.5"],
    // A leading zero is no SEMVER: `01.2.3` starts at `0`, no prefix is a SEMVER; `1` is
    // preceded by a digit and `2` by a `.`, so no other start exists.
    ["01.2.3", null],
    // `1.2.03`: the longest SEMVER prefix `1.2.0` is followed by a digit: dropped.
    ["1.2.03", null],
    // A later candidate after a dropped one.
    ["1.2.03 then 4.5.6", "4.5.6"],
    // A start needs no digit and no `.` right before it.
    ["x.1.2.3", null],
  ];
  for (const [text, expected] of cases) {
    it(`${JSON.stringify(text)} -> ${String(expected)}`, () => {
      expect(firstSemver(text)).toBe(expected);
    });
  }
});

describe("compareSemver (SemVer 2.0.0 section 11)", () => {
  it("orders the precedence example of semver.org", () => {
    const chain = ["1.0.0-alpha", "1.0.0-alpha.1", "1.0.0-alpha.beta", "1.0.0-beta", "1.0.0-beta.2", "1.0.0-beta.11", "1.0.0-rc.1", "1.0.0", "2.0.0", "2.1.0", "2.1.1", "10.0.0"];
    for (let index = 1; index < chain.length; index += 1) {
      const lower = chain[index - 1] ?? "";
      const higher = chain[index] ?? "";
      expect(compareSemver(lower, higher), `${lower} < ${higher}`).toBeLessThan(0);
      expect(compareSemver(higher, lower), `${higher} > ${lower}`).toBeGreaterThan(0);
    }
  });

  it("compares the core numerically: 1.10.0 above 1.9.0", () => {
    expect(compareSemver("1.10.0", "1.9.0")).toBeGreaterThan(0);
  });

  it("ignores build metadata: 1.0.0+a equals 1.0.0+b", () => {
    expect(compareSemver("1.0.0+a", "1.0.0+b")).toBe(0);
    expect(compareSemver("1.0.0-rc.1+x", "1.0.0-rc.1")).toBe(0);
  });

  it("compares numbers of any size exactly (beyond 2^53)", () => {
    expect(compareSemver("1.0.9007199254740993", "1.0.9007199254740992")).toBeGreaterThan(0);
    expect(compareSemver("100000000000000000000001.0.0", "100000000000000000000000.0.0")).toBeGreaterThan(0);
    expect(compareSemver("1.0.0-9007199254740993", "1.0.0-9007199254740992")).toBeGreaterThan(0);
  });

  it("puts a pre-release below its release", () => {
    expect(compareSemver("2.0.0-rc.1", "2.0.0")).toBeLessThan(0);
  });
});

describe("orderKey and compareOrderKeys (spec 2.10 ORDER KEY)", () => {
  it("whole text: plain UTF-16 code-unit order, case-sensitive", () => {
    const compare = (a: string, b: string): number => compareOrderKeys("text", a, b);
    expect(orderKey("text", "Epic A - Setup")).toBe("Epic A - Setup");
    expect(compare("Epic A - Setup", "Epic B - Release")).toBeLessThan(0);
    expect(compare("Step 10", "Step 9")).toBeLessThan(0);
    expect(compare("B", "a")).toBeLessThan(0);
    expect(compare("[1.10.0]", "[1.9.0]")).toBeLessThan(0);
    expect(compare("x", "x")).toBe(0);
  });

  it("first number: by value", () => {
    const nine = orderKey("first-number", "Step 9") ?? 0;
    const ten = orderKey("first-number", "Step 10") ?? 0;
    expect(compareOrderKeys("first-number", nine, ten)).toBeLessThan(0);
    expect(compareOrderKeys("first-number", -1.5, 1)).toBeLessThan(0);
    expect(compareOrderKeys("first-number", 5, 5)).toBe(0);
    expect(compareOrderKeys("first-number", 10, 9)).toBeGreaterThan(0);
    expect(orderKey("first-number", "Step four")).toBeNull();
  });

  it("first date: chronological", () => {
    expect(compareOrderKeys("first-date", "2026-01-10", "2026-02-01")).toBeLessThan(0);
    expect(compareOrderKeys("first-date", "2026-02-01", "2026-02-01")).toBe(0);
    expect(orderKey("first-date", "Sprint 2026-02-30")).toBeNull();
  });

  it("first semver: by precedence, not as strings", () => {
    expect(compareOrderKeys("first-semver", "1.10.0", "1.9.0")).toBeGreaterThan(0);
    expect(orderKey("first-semver", "v2.0.0")).toBe("2.0.0");
    expect(orderKey("first-semver", "Step 1")).toBeNull();
  });
});

describe("orderToken and orderTagText (spec 2.10, 4.3, 8.3 canonical form)", () => {
  const tag = (direction: OrderTag["direction"], by: OrderTag["by"]): OrderTag => ({
    kind: "order",
    region: "body",
    raw: "",
    position: { line: 1, column: 1 },
    direction,
    by,
  });
  it("spells every form in lowercase", () => {
    expect(orderToken(tag("ascending", "text"))).toBe("order:ascending");
    expect(orderToken(tag("descending", "first-number"))).toBe("order:first:number:descending");
    expect(orderToken(tag("ascending", "first-date"))).toBe("order:first:date:ascending");
    expect(orderTagText(tag("descending", "first-semver"))).toBe("[order:first:semver:descending]");
  });
});
