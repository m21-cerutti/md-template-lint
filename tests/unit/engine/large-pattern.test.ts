/**
 * Characterization of the heading pattern matcher on many generated pattern and text pairs and on
 * long texts (A4 of the perf plan, tmp/PLAN_perf-bench.md, target P1): `matchPattern` (the values of
 * the placeholders), `failingPiece` (the index of the piece that fails) and `headingMatches`
 * (src/engine/pattern.ts, src/engine/model.ts). The single-pair semantics are tested by
 * tests/unit/engine/pattern-match.test.ts; here the expected values come from the code at the time of
 * writing, so a faster matcher (no per-call copies of the text) must give the same value, the same cut
 * and the same failing piece everywhere. The matrix is pinned by a count per pattern (readable) and a
 * digest of every result (certain); the explicit cases below it are written out in full.
 */
import { describe, expect, it } from "vitest";
import { loadDocument } from "../../../src/engine/load.js";
import { headingMatches, type Section } from "../../../src/engine/model.js";
import { failingPiece, matchPattern } from "../../../src/engine/pattern.js";
import type { PatternPiece } from "../../../src/tags/ast.js";
import { parseHeadingSuffix } from "../../../src/tags/parser.js";
import { digestOf } from "../../helpers/characterize.js";

/** The parsed pieces of each pattern, parsed once (the matrix asks for them thousands of times). */
const parsed = new Map<string, readonly PatternPiece[]>();

function piecesOf(pattern: string): readonly PatternPiece[] {
  const known = parsed.get(pattern);
  if (known !== undefined) return known;
  const [tag] = parseHeadingSuffix(`H [pattern:"${pattern}"]`).tags;
  if (tag?.kind !== "pattern") throw new Error(`no pattern tag for ${pattern}`);
  expect(
    tag.pieces.some((piece) => piece.kind === "invalid"),
    pattern,
  ).toBe(false);
  parsed.set(pattern, tag.pieces);
  return tag.pieces;
}

/** The template heading `## H [pattern:"..."]` as a section (what `headingMatches` takes). */
function headingOf(pattern: string): Section {
  const loaded = loadDocument(`---\ntitle: x\n---\n## H [pattern:"${pattern}"]\n`);
  const section = loaded.ok ? loaded.model.sections[0] : undefined;
  if (section === undefined) throw new Error(`no heading for ${pattern}`);
  return section;
}

/** Placeholder values, or null when the pattern does not match the whole text. */
const valuesOf = (pattern: string, text: string): readonly string[] | null => matchPattern(piecesOf(pattern), text)?.values ?? null;

/** Index of the failing piece, or -1 when the pattern matches. */
function failingIndex(pattern: string, text: string): number {
  const pieces = piecesOf(pattern);
  const piece = failingPiece(pieces, text);
  return piece === null ? -1 : pieces.indexOf(piece);
}

const PATTERNS = [
  "{text}",
  "{text:format:snakecase}",
  "{text:format:camelcase}",
  "{text:format:screamcase}",
  "{text:format:kebabcase}",
  "{text:format:lowercase}",
  "{text:format:uppercase}",
  "{number}",
  "{number:format:scientific}",
  "{number:format:precision:2}",
  "{digits}",
  "{digits:format:signed}",
  "{digits:format:hex}",
  "{digits:format:uid}",
  "{digits:format:padding:3}",
  "{semver}",
  "{semver:format:core}",
  "{semver:format:major-minor}",
  "{date}",
  "{date:format:year-month}",
  "{date:format:year}",
  "{char}",
  "Step {digits}",
  "v{semver}",
  "{semver} - {date}",
  "[{semver}] - {date}",
  "{text} - {text}",
  "{text} {digits}",
  "{digits}-{digits}",
  "{char}-{char}-{digits}",
  "{number} {text}",
  "Epic {char} - {text}",
  "Café 🎉 {digits}",
  "{char}𝒜{char}",
  "Notes",
] as const;

/** Texts that suit one pattern or another, plus the usual near misses, each used against every pattern. */
const TEXTS = [
  "",
  "Notes",
  "notes",
  "Notes ",
  "Release notes",
  "my_heading",
  "myHeading",
  "MY_HEADING",
  "my-heading",
  "RELEASE NOTES",
  "1",
  "007",
  "42",
  "1234",
  "0012",
  "-7",
  "+42",
  "ff",
  "U42",
  "1.5",
  "1.50",
  "1e5",
  "1.2",
  "1.2.0",
  "1.2.0-rc.1",
  "v1.2.0",
  "2026",
  "2026-10",
  "2026-10-01",
  "2026-13-01",
  "A",
  "É",
  "𝒜",
  "ab42",
  "a1b",
  "Step 12",
  "Step  12",
  "Step four - Review",
  "1.2.0 - 2026-10-01",
  "[1.2.0] - 2026-10-01",
  "1.2.0 / 2026-10-01",
  "a - b - c",
  "x-y-z",
  "Release 2 notes 7",
  "Epic A - Setup",
  "Epic 2 - Setup",
  "Café 🎉 7",
  "Café 🎉 07",
  "A𝒜B",
  "𝒜𝒜𝒜",
  "12 apples",
  "3.5 kg",
  "12-34",
  "a-b-42",
] as const;

/** Pinned: how many of the TEXTS each pattern matches. */
const MATCH_COUNTS: Readonly<Record<string, number>> = {
  "{text}": 42,
  "{text:format:snakecase}": 6,
  "{text:format:camelcase}": 5,
  "{text:format:screamcase}": 7,
  "{text:format:kebabcase}": 8,
  "{text:format:lowercase}": 14,
  "{text:format:uppercase}": 8,
  "{number}": 10,
  "{number:format:scientific}": 11,
  "{number:format:precision:2}": 1,
  "{digits}": 4,
  "{digits:format:signed}": 6,
  "{digits:format:hex}": 11,
  "{digits:format:uid}": 4,
  "{digits:format:padding:3}": 1,
  "{semver}": 2,
  "{semver:format:core}": 1,
  "{semver:format:major-minor}": 3,
  "{date}": 1,
  "{date:format:year-month}": 1,
  "{date:format:year}": 3,
  "{char}": 3,
  "Step {digits}": 1,
  "v{semver}": 1,
  "{semver} - {date}": 1,
  "[{semver}] - {date}": 1,
  "{text} - {text}": 6,
  "{text} {digits}": 4,
  "{digits}-{digits}": 2,
  "{char}-{char}-{digits}": 1,
  "{number} {text}": 2,
  "Epic {char} - {text}": 1,
  "Café 🎉 {digits}": 1,
  "{char}𝒜{char}": 2,
  Notes: 1,
};

describe("P1: the matrix of generated patterns and texts", () => {
  const rows = PATTERNS.flatMap((pattern, patternIndex) =>
    TEXTS.map((text, textIndex) => {
      const values = valuesOf(pattern, text);
      return { pattern, patternIndex, text, textIndex, values, failing: failingIndex(pattern, text) };
    }),
  );

  it("covers 35 patterns and 54 texts", () => {
    expect(PATTERNS).toHaveLength(35);
    expect(TEXTS).toHaveLength(54);
    expect(rows).toHaveLength(35 * 54);
  });

  it("matches the same texts per pattern", () => {
    const counts: Record<string, number> = {};
    for (const row of rows) counts[row.pattern] = (counts[row.pattern] ?? 0) + (row.values === null ? 0 : 1);
    expect(counts).toEqual(MATCH_COUNTS);
  });

  it("gives the same values, the same cut and the same failing piece for every pair", () => {
    expect(digestOf(rows.map((row) => [row.patternIndex, row.textIndex, row.values, row.failing]))).toBe("cd91a7c77f4ae437622ebd950dc2d57b");
  });

  it("agrees with itself: a pattern matches exactly when there is no failing piece, and headingMatches follows matchPattern", () => {
    for (const row of rows) {
      expect(row.failing === -1, `${row.pattern} on ${JSON.stringify(row.text)}`).toBe(row.values !== null);
    }
    const sections = new Map(PATTERNS.map((pattern) => [pattern, headingOf(pattern)]));
    for (const row of rows) {
      const section = sections.get(row.pattern);
      if (section === undefined) throw new Error(row.pattern);
      expect(headingMatches(section, row.text), `${row.pattern} on ${JSON.stringify(row.text)}`).toBe(row.values !== null);
    }
  });
});

describe("P1: ties, code points and exact values (written out in full)", () => {
  it("each placeholder takes the shortest part the rest still matches", () => {
    expect(valuesOf("{text} - {text}", "a - b - c")).toEqual(["a", "b - c"]);
    expect(valuesOf("{text} {digits}", "Release 2 notes 7")).toEqual(["Release 2 notes", "7"]);
    expect(valuesOf("{digits}-{digits}", "12-34")).toEqual(["12", "34"]);
    expect(valuesOf("{char}-{char}-{digits}", "a-b-42")).toEqual(["a", "b", "42"]);
    expect(valuesOf("{number} {text}", "12 apples")).toEqual(["12", "apples"]);
    expect(valuesOf("{number} {text}", "3.5 kg")).toEqual(["3.5", "kg"]);
  });

  it("adjacent placeholders (a pattern the parser refuses, MTL014, but the matcher still cuts): shortest first", () => {
    const digits: PatternPiece = { kind: "placeholder", name: "digits", format: null, argument: null, raw: "{digits}" };
    const text: PatternPiece = { kind: "placeholder", name: "text", format: null, argument: null, raw: "{text}" };
    const char: PatternPiece = { kind: "placeholder", name: "char", format: null, argument: null, raw: "{char}" };
    expect(matchPattern([digits, digits], "1234")?.values).toEqual(["1", "234"]);
    expect(matchPattern([digits, digits], "10")?.values).toEqual(["1", "0"]);
    expect(matchPattern([digits, digits], "0012")).toBeNull();
    expect(matchPattern([char, char, digits], "ab42")?.values).toEqual(["a", "b", "42"]);
    expect(matchPattern([char, char, digits], "a1b")).toBeNull();
    expect(matchPattern([digits, text], "12 apples")?.values).toEqual(["1", "2 apples"]);
    expect(matchPattern([text, text], "abc")?.values).toEqual(["a", "bc"]);
    expect(failingPiece([digits, digits], "0012")).toBe(digits);
    expect(failingPiece([char, char, digits], "a1b")).toBe(char);
  });

  it("an invalid piece matches nothing, and it is the failing piece", () => {
    const bad: PatternPiece = { kind: "invalid", reason: "unknown placeholder {bogus}", offset: 0 };
    expect(matchPattern([bad], "x")).toBeNull();
    expect(failingPiece([bad], "x")).toBe(bad);
    expect(matchPattern([], "x")).toBeNull();
  });

  it("astral characters are one code point: literals, {char} and {text} never split a pair", () => {
    expect(valuesOf("Café 🎉 {digits}", "Café 🎉 7")).toEqual(["7"]);
    expect(valuesOf("Café 🎉 {digits}", "Café 🎉 07")).toBeNull();
    expect(valuesOf("{char}𝒜{char}", "A𝒜B")).toEqual(["A", "B"]);
    expect(valuesOf("{char}𝒜{char}", "𝒜𝒜𝒜")).toEqual(["𝒜", "𝒜"]);
    expect(valuesOf("{char}", "𝒜")).toEqual(["𝒜"]);
    expect(valuesOf("{text} 🙂", "smile 🙂")).toEqual(["smile"]);
    expect(failingIndex("Café 🎉 {digits}", "Café 🎉 07")).toBe(1);
    expect(failingIndex("Café 🎉 {digits}", "Café 🎈 7")).toBe(0);
  });

  it("failing piece: the first piece after which no head of the text matches", () => {
    expect(failingIndex("{semver} - {date}", "1.2 - 2026-10-01")).toBe(0);
    expect(failingIndex("{semver} - {date}", "1.2.0 / 2026-10-01")).toBe(1);
    expect(failingIndex("{semver} - {date}", "1.2.0 - soon")).toBe(2);
    expect(failingIndex("{semver} - {date}", "1.2.0 - 2026-10-01")).toBe(-1);
  });
});

describe("P1: long texts (over 500 code points, 261 for the one that fails)", () => {
  const WORDS = "word ".repeat(110);
  const GOOD = `Chapter 12: ${WORDS}(2026-10-01)`;
  const PATTERN = "Chapter {digits}: {text} ({date})";

  it("the texts are long", () => {
    expect([...GOOD].length).toBeGreaterThan(500);
  });

  it("a long {text} takes the whole heading; two {text} cut at the first and the last space the rest allows", () => {
    const long = `${"word ".repeat(120)}end`;
    expect([...long].length).toBe(603);
    expect(valuesOf("{text}", long)).toEqual([long]);
    const spaced = `${"a ".repeat(260)}7`;
    expect([...spaced]).toHaveLength(521);
    const [head, tail] = valuesOf("{text} {digits}", spaced) ?? [];
    expect([head?.length, tail]).toEqual([519, "7"]);
    const [first, middle, last] = valuesOf("{text} {text} {digits}", spaced) ?? [];
    expect([first, middle?.length, last]).toEqual(["a", 517, "7"]);
  }, 30_000);

  it("the matching long heading gives each placeholder its value", () => {
    const values = valuesOf(PATTERN, GOOD);
    expect(values?.map((value) => value.length)).toEqual([2, 549, 10]);
    expect(values?.[0]).toBe("12");
    expect(values?.[2]).toBe("2026-10-01");
    expect(failingIndex(PATTERN, GOOD)).toBe(-1);
  });

  it("a fault at each piece of a long heading is reported on that piece", () => {
    const faulty: readonly (readonly [string, string])[] = [
      ["first literal", GOOD.replace("Chapter ", "Chaptre ")],
      ["digits", GOOD.replace("12:", "x2:")],
      ["second literal", GOOD.replace("12: ", "12 - ")],
      ["text (purely numeric)", "Chapter 12: 4242"],
      ["third literal", GOOD.replace(" (", " [")],
      ["date", GOOD.replace("2026-10-01", "2026-13-01")],
      ["last literal", GOOD.replace("(2026-10-01)", "(2026-10-01")],
    ];
    expect(faulty.map(([, text]) => failingIndex(PATTERN, text))).toEqual([0, 1, 2, 3, 4, 5, 6]);
    for (const [, text] of faulty) expect(valuesOf(PATTERN, text)).toBeNull();
  });

  it("a long heading that does not match is null for several placeholders and fails on the last piece", () => {
    const text = `${"a ".repeat(130)}x`;
    expect([...text].length).toBe(261);
    expect(valuesOf("{text} {text} {text} {digits}", text)).toBeNull();
    expect(failingIndex("{text} {text} {text} {digits}", text)).toBe(6);
  }, 30_000);
});
