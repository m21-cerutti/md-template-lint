/**
 * The heading pattern matcher of src/engine/pattern.ts (docs/spec.md 2.10 "MATCH",
 * "FAILING PIECE", "PLACEHOLDERS", NUMERIC TEXT; phase P3: the DEFAULT format of every
 * placeholder; phase Pf: the other formats). Expected values come from the spec text and its
 * owner and worked examples.
 */
import { describe, expect, it } from "vitest";
import {
  failingPiece,
  isNumericText,
  isPlaceholderValue,
  matchPattern,
} from "../../src/engine/pattern.js";
import type { PatternPiece } from "../../src/tags/ast.js";
import { parseHeadingSuffix } from "../../src/tags/parser.js";

/** The pieces of `[pattern:"<pattern>"]` as the parser builds them (valid patterns only). */
function pieces(pattern: string): readonly PatternPiece[] {
  const [tag] = parseHeadingSuffix(`H [pattern:"${pattern}"]`).tags;
  if (tag?.kind !== "pattern") throw new Error(`no pattern tag for ${pattern}`);
  expect(tag.pieces.some((piece) => piece.kind === "invalid")).toBe(false);
  return tag.pieces;
}

/** The single placeholder piece of `{...}`. */
function holder(raw: string): Extract<PatternPiece, { kind: "placeholder" }> {
  const [piece] = pieces(raw);
  if (piece?.kind !== "placeholder") throw new Error(`${raw} is no placeholder`);
  return piece;
}

const values = (pattern: string, text: string) => matchPattern(pieces(pattern), text)?.values;

/** The failing piece as printed by MTL606 (spec 2.10): placeholder as written, literal quoted. */
function failing(pattern: string, text: string): string | null {
  const piece = failingPiece(pieces(pattern), text);
  if (piece === null) return null;
  return piece.kind === "placeholder"
    ? piece.raw
    : piece.kind === "literal"
      ? `'${piece.text}'`
      : "?";
}

describe("NUMERIC TEXT (spec 2.10)", () => {
  it.each(["1", "007", "1.5", "-2", "1e5", "1.5E-3"])("%s is purely numeric", (text) => {
    expect(isNumericText(text)).toBe(true);
  });
  it.each(["1.2.0", "v1", "1.", ".5", "+1", "1e", "2026-10", " 1", ""])(
    "%j is not purely numeric",
    (text) => {
      expect(isNumericText(text)).toBe(false);
    },
  );
});

describe("default formats (spec 2.10 'Each format')", () => {
  const cases: readonly (readonly [string, readonly string[], readonly string[]])[] = [
    [
      "{text}",
      ["Release notes", "1.2.0", "v1", "Épique", "my_heading"],
      ["", "2026", "1.5", "-3", "1e5"],
    ],
    // `human` written explicitly is the default (spec 2.10).
    ["{text:format:human}", ["Release notes", "1.2.0"], ["", "2026"]],
    [
      "{number}",
      ["0", "10", "007", "01.5", "1.5", "0.25", "-1.5"],
      ["+1", "1.", ".5", "1e5", "1,5", "1 000"],
    ],
    ["{number:format:decimal}", ["007", "-1.5"], ["1e5"]],
    ["{digits}", ["0", "7", "42", "2026"], ["-1", "+1", "07", "1.0", "1e3", ""]],
    [
      "{semver}",
      ["1.2.0", "1.1.1-hotfix", "1.0.0+build.1", "2.0.0-rc.1"],
      ["1.2", "v1.2.0", "01.2.0", " 1.2.0"],
    ],
    ["{SemVer:format:full}", ["1.2.0"], ["1.2"]],
    ["{date}", ["2026-10-01", "2024-02-29"], ["2026-02-30", "2026-10", "2026", " 2026-10-01"]],
    ["{date:format:full}", ["2026-03-01"], ["2026-13-01"]],
    ["{char}", ["A", "b", "É", "ß", "ж"], ["1", "_", "AB", "", "E\u0301"]],
  ];
  for (const [raw, accepted, rejected] of cases) {
    it(`${raw} accepts ${accepted.join(", ")}`, () => {
      for (const value of accepted)
        expect(isPlaceholderValue(holder(raw), value), value).toBe(true);
    });
    it(`${raw} rejects ${rejected.map((value) => JSON.stringify(value)).join(", ")}`, () => {
      for (const value of rejected) {
        expect(isPlaceholderValue(holder(raw), value), value).toBe(false);
      }
    });
  }

  it("a non-default format (phase Pf) is checked: major-minor takes 1.2, padding:3 takes 007", () => {
    expect(isPlaceholderValue(holder("{semver:format:major-minor}"), "1.2")).toBe(true);
    expect(matchPattern(pieces("{digits:format:padding:3}"), "007")).toEqual({ values: ["007"] });
  });
});

describe("non-default formats (spec 2.10 'Each format', phase Pf)", () => {
  const cases: readonly (readonly [string, readonly string[], readonly string[]])[] = [
    [
      "{text:format:snakecase}",
      ["my_heading", "step_2", "2_step", "épique_été", "данные_2"],
      ["2026", "2026_10", "My_heading", "my-heading", "my__heading", "_x", "my heading", ""],
    ],
    [
      "{text:format:camelcase}",
      ["myHeading", "heading", "step2", "étéChaud"],
      ["MyHeading", "my_heading", "2step", "2026", "my heading", ""],
    ],
    [
      "{text:format:screamcase}",
      ["MY_HEADING", "STEP_2", "ÉTÉ_2"],
      ["2026", "My_Heading", "MY-HEADING", "MY__HEADING", "my_heading", ""],
    ],
    [
      "{text:format:kebabcase}",
      ["my-heading", "step-2", "été-chaud"],
      ["2026", "my_heading", "My-heading", "my--heading", "-x", ""],
    ],
    [
      "{text:format:lowercase}",
      ["release notes", "étape 2", "v1.2 notes"],
      ["Release notes", "2026", "-", ""],
    ],
    [
      "{text:format:uppercase}",
      ["RELEASE NOTES", "ÉTAPE 2", "V1.2 NOTES"],
      ["Release", "2026", ""],
    ],
    [
      "{number:format:scientific}",
      ["1e5", "01e5", "1.5E-3", "-2e+10", "1.5", "7"],
      ["1e", "e5", "1.5e-", "1e5.0", "+1e5"],
    ],
    ["{number:format:precision:2}", ["1.50", "01.00", "-0.25"], ["1.5", "1.500", "1", "1.50e0"]],
    ["{digits:format:signed}", ["42", "+42", "-7", "0"], ["+07", "--1", "+", "1.0"]],
    ["{digits:format:hex}", ["ff", "0A3F", "007", "7"], ["0x1f", "g1", "-1", ""]],
    ["{digits:format:uid}", ["U42", "a1b2", "42U", "user7"], ["42", "abc", "U-42", "U 42", "É1"]],
    ["{digits:format:padding:3}", ["007", "042", "123"], ["7", "0007", "-07", "1234"]],
    ["{semver:format:core}", ["1.2.0", "0.0.0"], ["1.2.0-rc.1", "1.2.0+build", "1.2", "01.2.0"]],
    ["{semver:format:major-minor}", ["1.2", "0.10"], ["1.2.0", "01.2", "1", "v1.2"]],
    ["{date:format:year-month}", ["2026-10", "0001-01"], ["2026-13", "2026-00", "0000-10", "2026"]],
    ["{date:format:year}", ["2026", "0001"], ["0000", "26", "2026-10", " 2026"]],
    // Keywords are case-insensitive (spec 2.10): the format name too.
    ["{Text:FORMAT:SnakeCase}", ["my_heading"], ["My_heading"]],
  ];
  for (const [raw, accepted, rejected] of cases) {
    it(`${raw} accepts ${accepted.join(", ")}`, () => {
      for (const value of accepted)
        expect(isPlaceholderValue(holder(raw), value), value).toBe(true);
    });
    it(`${raw} rejects ${rejected.map((value) => JSON.stringify(value)).join(", ")}`, () => {
      for (const value of rejected) {
        expect(isPlaceholderValue(holder(raw), value), value).toBe(false);
      }
    });
  }

  it("the argument is read from the piece: padding:4 and precision:1 differ from 3 and 2", () => {
    expect(isPlaceholderValue(holder("{digits:format:padding:4}"), "0007")).toBe(true);
    expect(isPlaceholderValue(holder("{digits:format:padding:4}"), "007")).toBe(false);
    expect(isPlaceholderValue(holder("{number:format:precision:1}"), "1.5")).toBe(true);
    expect(isPlaceholderValue(holder("{number:format:precision:1}"), "1.50")).toBe(false);
  });

  it("owner example F: major-minor then ' - ' then an ISO DATE", () => {
    const pattern = "{semver:format:major-minor} - {date}";
    expect(values(pattern, "1.2 - 2026-10-01")).toEqual(["1.2", "2026-10-01"]);
    expect(values(pattern, "1.2.0 - 2026-10-01")).toBeUndefined();
    expect(failing(pattern, "1.2.0 - 2026-10-01")).toBe("' - '");
  });

  it("'007' is a padding:3 and a {number} value; '2026' is no snakecase value", () => {
    expect(values("{digits:format:padding:3}", "007")).toEqual(["007"]);
    expect(values("{number}", "007")).toEqual(["007"]);
    expect(values("{text:format:snakecase}", "2026")).toBeUndefined();
    expect(failing("Item {digits:format:padding:3}", "Item 7")).toBe("{digits:format:padding:3}");
  });
});

describe("matchPattern (spec 2.10 MATCH)", () => {
  it("matches the WHOLE heading text, literal parts case-sensitive, nothing trimmed", () => {
    expect(values("[{semver}] - {date}", "[1.2.0] - 2026-03-01")).toEqual(["1.2.0", "2026-03-01"]);
    expect(values("Notes", "Notes")).toEqual([]);
    expect(values("Notes", "notes")).toBeUndefined();
    expect(values("Notes", "Notes ")).toBeUndefined();
    expect(values("Step {digits}", "Step  7")).toBeUndefined();
    expect(values("{digits}", "12a")).toBeUndefined();
  });

  it("each placeholder, from left to right, takes the shortest part the rest still matches", () => {
    expect(values("{text} - {text}", "a - b - c")).toEqual(["a", "b - c"]);
    expect(values("{text}-{text}", "x-y-z")).toEqual(["x", "y-z"]);
    // The first placeholder grows only as far as the rest needs.
    expect(values("{text} {digits}", "Release 2 notes 7")).toEqual(["Release 2 notes", "7"]);
  });

  it("escapes and brace escapes are literal text", () => {
    expect(values('Say \\"{text}\\"', 'Say "hi"')).toEqual(["hi"]);
    expect(values("{{semver}}", "{semver}")).toEqual([]);
    expect(values("{{semver}}", "1.2.0")).toBeUndefined();
  });

  it("owner example A: '1' is no {text} value, 'tata' no {number} value", () => {
    expect(values("{text}", "1")).toBeUndefined();
    expect(values("{number}", "tata")).toBeUndefined();
  });

  it("owner examples B, C, D, H: a {text} or literal pattern takes 'toto', 'Intro', 'Notes'", () => {
    expect(values("{text}", "toto")).toEqual(["toto"]);
    expect(values("toto", "toto")).toEqual([]);
    expect(values("{text}", "Intro")).toEqual(["Intro"]);
    expect(values("{text}", "Notes")).toEqual(["Notes"]);
  });

  it("owner example E: '1.2.0 - 2026-10-01' matches, '1.2 - 2026-10-01' does not", () => {
    expect(values("{semver} - {date}", "1.2.0 - 2026-10-01")).toEqual(["1.2.0", "2026-10-01"]);
    expect(values("{semver} - {date}", "1.1.0 - 2026-09-01")).toEqual(["1.1.0", "2026-09-01"]);
    expect(values("{semver} - {date}", "1.2 - 2026-10-01")).toBeUndefined();
  });

  it("owner example G: {semver} and 'hotfix {semver}'", () => {
    expect(values("{semver}", "1.2.0")).toEqual(["1.2.0"]);
    expect(values("{semver}", "hotfix 1.1.1")).toBeUndefined();
    expect(values("hotfix {semver}", "hotfix 1.1.1")).toEqual(["1.1.1"]);
    expect(values("{semver}", "1.1.1-hotfix")).toEqual(["1.1.1-hotfix"]);
  });

  it("worked examples 1, 7 J and K", () => {
    expect(values("[{semver}] - {date}", "0.9.0 - 2025-12-01")).toBeUndefined();
    expect(values("Epic {char} - {text}", "Epic A - Setup")).toEqual(["A", "Setup"]);
    expect(values("Epic {char} - {text}", "Epic 2 - Release")).toBeUndefined();
    expect(values("Step {text}", "Step 1 - Install")).toEqual(["1 - Install"]);
    expect(values("Step {text}", "Step four - Review")).toEqual(["four - Review"]);
    expect(values("Step {digits} - {text}", "Step four - Review")).toBeUndefined();
  });

  it("cuts on code points: an astral character is one {char}", () => {
    expect(values("{text} 🙂", "smile 🙂")).toEqual(["smile"]);
    expect(values("{char}", "𝒜")).toEqual(["𝒜"]);
  });

  it("stays fast on a long heading that does not match", () => {
    const text = `${"a ".repeat(200)}x`;
    expect(values("{text} {text} {text} {digits}", text)).toBeUndefined();
  });
});

describe("failingPiece (spec 2.10 FAILING PIECE)", () => {
  it.each([
    ["{semver} - {date}", "1.2 - 2026-10-01", "{semver}"],
    ["[{semver}] - {date}", "[Unreleased]", "{semver}"],
    ["{digits}", "12a", "{digits}"],
    ["{text}", "1", "{text}"],
    ["{number}", "tata", "{number}"],
    ["[{semver}] - {date}", "0.9.0 - 2025-12-01", "'['"],
    ["{semver} - {date}", "1.2.0 / 2026-10-01", "' - '"],
    ["{semver} - {date}", "1.2.0 - soon", "{date}"],
  ])("%s on %j fails at %s", (pattern, text, expected) => {
    expect(failing(pattern, text)).toBe(expected);
  });

  it("is null when the pattern matches", () => {
    expect(failing("[{semver}] - {date}", "[1.2.0] - 2026-03-01")).toBeNull();
  });
});
