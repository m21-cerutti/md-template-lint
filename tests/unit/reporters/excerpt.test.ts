/**
 * Source excerpt formatting (docs/spec.md 8.2 EX2 to EX5, 8.5 `sourceLine`). Every expected
 * string is written out from the spec rules, not produced by the code under test.
 */
import { describe, expect, it } from "vitest";
import { EXCERPT_WIDTH, excerptRows, sourceLineOf } from "../../../src/reporters/excerpt.js";
import { excerptFor } from "../../../src/runner/excerpt.js";
import type { SourceExcerpt } from "../../../src/runner/types.js";

/** The excerpt the runner keeps for one raw source line (the whole line goes in, a window stays). */
const at = (line: number, text: string, column: number | null = null): SourceExcerpt => excerptFor(line, text, column);

/** Indent of an excerpt under a file diagnostic (EX2). */
const I = " ".repeat(8);

describe("excerptRows: layout (EX2)", () => {
  it("pass: a line without column is one gutter row, no caret", () => {
    expect(excerptRows(at(3, "status:"), 8)).toEqual([`${I}3 | status:`]);
  });

  it("pass: a line with a column adds a caret row under that character", () => {
    expect(excerptRows(at(9, "<!-- md-template-lint x -->", 1), 8)).toEqual([`${I}9 | <!-- md-template-lint x -->`, `${I}  | ^`]);
    // column 6 is the `m` of `md-template-lint`: 5 spaces before the caret
    expect(excerptRows(at(9, "<!-- md-template-lint x -->", 6), 8)).toEqual([`${I}9 | <!-- md-template-lint x -->`, `${I}  |      ^`]);
  });

  it("pass: the gutter is as wide as the line number, the bars line up", () => {
    expect(excerptRows(at(120, "abc", 2), 8)).toEqual([`${I}120 | abc`, `${I}    |  ^`]);
  });

  it("pass: the indent is a parameter (6 for a --verify item)", () => {
    expect(excerptRows(at(2, "owner: x", 1), 6)).toEqual(["      2 | owner: x", "        | ^"]);
  });

  it("pass: an empty line prints the bar and nothing after it", () => {
    expect(excerptRows(at(4, ""), 8)).toEqual([`${I}4 |`]);
    expect(excerptRows(at(4, "", 1), 8)).toEqual([`${I}4 |`, `${I}  | ^`]);
  });
});

describe("excerptRows: text (EX3, EX4)", () => {
  it("fail: a tab is one space and runs are not collapsed, so the caret stays under its character", () => {
    // `b` is the 4th character: 3 spaces before the caret
    expect(excerptRows(at(2, "a\t\tb", 4), 8)).toEqual([`${I}2 | a  b`, `${I}  |    ^`]);
  });

  it("fail: other whitespace controls are one space each", () => {
    expect(excerptRows(at(2, "a\u000b\u000c\u0085\u2028\u2029b"), 8)).toEqual([`${I}2 | a     b`]);
  });

  it("fail: controls and bidi marks are escaped, and the caret counts the full escape", () => {
    // ESC is `\x1b` (4 characters), so `x` (column 2) has the caret 4 spaces in
    expect(excerptRows(at(2, "\u001bx", 2), 8)).toEqual([`${I}2 | \\x1bx`, `${I}  |     ^`]);
    expect(excerptRows(at(2, "a\u202eb\u007f\ufeff"), 8)).toEqual([`${I}2 | a\\u202eb\\x7f\\ufeff`]);
  });

  it("pass: an astral character is one character wide", () => {
    expect(excerptRows(at(2, "\u{1f600}x", 2), 8)).toEqual([`${I}2 | \u{1f600}x`, `${I}  |  ^`]);
  });

  it("pass: a column past the end puts the caret just after the last character", () => {
    expect(excerptRows(at(2, "abc", 10), 8)).toEqual([`${I}2 | abc`, `${I}  |    ^`]);
  });
});

describe("excerptRows: width (EX5)", () => {
  const line = (length: number): string => "0123456789".repeat(Math.ceil(length / 10)).slice(0, length);

  it("pass: 100 characters are shown whole, without an ellipsis", () => {
    expect(EXCERPT_WIDTH).toBe(100);
    expect(excerptRows(at(1, line(100)), 8)).toEqual([`${I}1 | ${line(100)}`]);
  });

  it("fail: 101 characters are cut to the first 100 followed by `...`", () => {
    expect(excerptRows(at(1, line(101)), 8)).toEqual([`${I}1 | ${line(100)}...`]);
  });

  it("pass: a column up to 100 keeps the first window, the caret is in it", () => {
    expect(excerptRows(at(1, line(300), 100), 8)).toEqual([`${I}1 | ${line(100)}...`, `${I}  | ${" ".repeat(99)}^`]);
  });

  it("fail: a column above 100 slides the window to start 40 characters before it", () => {
    // 150 characters, column 101 -> index 100, window starts at index 60 and reaches the end
    const rows = excerptRows(at(1, line(150), 101), 8);
    expect(rows).toEqual([`${I}1 | ...${line(150).slice(60)}`, `${I}  | ${" ".repeat(3 + 40)}^`]);
  });

  it("fail: a slid window with characters left after it ends with `...` too", () => {
    // 300 characters, column 150 -> index 149, window [109, 209)
    const rows = excerptRows(at(1, line(300), 150), 8);
    expect(rows).toEqual([`${I}1 | ...${line(300).slice(109, 209)}...`, `${I}  | ${" ".repeat(3 + 40)}^`]);
  });

  it("fail: a column past the end of a long line shows the last 40 characters", () => {
    const rows = excerptRows(at(1, line(200), 500), 8);
    expect(rows).toEqual([`${I}1 | ...${line(200).slice(160)}`, `${I}  | ${" ".repeat(3 + 40)}^`]);
  });

  it("pass: the width counts source characters, before escaping", () => {
    const escaped = "\u001b".repeat(100);
    expect(excerptRows(at(1, escaped), 8)).toEqual([`${I}1 | ${"\\x1b".repeat(100)}`]);
  });
});

describe("sourceLineOf: JSON sourceLine (spec 8.5)", () => {
  it("pass: the sanitized line of an excerpt with a column", () => {
    expect(sourceLineOf(at(3, "status:", 1))).toBe("status:");
    expect(sourceLineOf(at(3, "a\t\tb\u001b", 1))).toBe("a  b\\x1b");
  });

  it("fail: absent without an excerpt, and absent for an anchor-only excerpt", () => {
    expect(sourceLineOf(undefined)).toBeUndefined();
    expect(sourceLineOf(at(3, "status:", null))).toBeUndefined();
  });

  it("fail: cut after 100 characters with `...`, never a window", () => {
    const long = "x".repeat(250);
    expect(sourceLineOf(at(1, "x".repeat(100), 1))).toBe("x".repeat(100));
    expect(sourceLineOf(at(1, long, 1))).toBe(`${"x".repeat(100)}...`);
    expect(sourceLineOf(at(1, long, 200))).toBe(`${"x".repeat(100)}...`);
  });

  it("fail: a line of exactly 101 characters is cut to 100 plus `...`", () => {
    expect(sourceLineOf(at(1, "y".repeat(101), 1))).toBe(`${"y".repeat(100)}...`);
  });

  it("pass: the cut counts source characters, before escaping", () => {
    // 100 ESC characters are 100 source characters: 400 shown characters, no `...`
    expect(sourceLineOf(at(1, "\u001b".repeat(100), 1))).toBe("\\x1b".repeat(100));
    expect(sourceLineOf(at(1, "\u001b".repeat(101), 1))).toBe(`${"\\x1b".repeat(100)}...`);
  });

  it("fail: a control character on the last kept position is escaped, the one after it is cut", () => {
    const line = `${"a".repeat(99)}\u001b\u001b`;
    expect(sourceLineOf(at(1, line, 1))).toBe(`${"a".repeat(99)}\\x1b...`);
  });
});

describe("excerptRows: column below 1 (EX4)", () => {
  it("pass: column 0 is read as 1, the caret is under the first character", () => {
    expect(excerptRows(at(1, "abc", 0), 8)).toEqual([`${I}1 | abc`, `${I}  | ^`]);
  });
});

describe("excerptRows and sourceLineOf: astral characters in a long line (EX4, EX5)", () => {
  it("pass: the window slides by characters, not by UTF-16 units", () => {
    // 120 emoji then `x`: `x` is column 121 (index 120), the window is [80, 121)
    const line = `${"\u{1f600}".repeat(120)}x`;
    const excerpt = at(1, line, 121);
    expect(excerptRows(excerpt, 8)).toEqual([`${I}1 | ...${"\u{1f600}".repeat(40)}x`, `${I}  | ${" ".repeat(3 + 40)}^`]);
    expect(sourceLineOf(excerpt)).toBe(`${"\u{1f600}".repeat(100)}...`);
  });

  it("fail: a window with characters left after it ends with `...`", () => {
    const rows = excerptRows(at(1, "\u{1f600}".repeat(300), 150), 8);
    expect(rows).toEqual([`${I}1 | ...${"\u{1f600}".repeat(100)}...`, `${I}  | ${" ".repeat(3 + 40)}^`]);
  });
});

/** Escapes by character (EX3): controls, bidi and the invisible format characters. */
const ESCAPED: readonly (readonly [string, string])[] = [
  ["\u0000", "\\x00"],
  ["\u009b", "\\x9b"],
  ["\u2066\u2067\u2068\u2069", "\\u2066\\u2067\\u2068\\u2069"],
  ["\u00ad", "\\xad"],
  ["\u180e", "\\u180e"],
  ["\u200b\u200c\u200d", "\\u200b\\u200c\\u200d"],
  ["\u2060\u2061\u2062\u2063\u2064", "\\u2060\\u2061\\u2062\\u2063\\u2064"],
  ["\ufff9\ufffa\ufffb", "\\ufff9\\ufffa\\ufffb"],
  ["\u{e0000}\u{e0001}\u{e007f}", "\\u{e0000}\\u{e0001}\\u{e007f}"],
];

/** Neighbours of those ranges that stay as they are. */
const KEPT = ["\u00ac\u00ae", "\u200a", "\u2065", "\ufff8\ufffc", "\u{e0080}", "\u{1f600}"];

describe("excerpt text: invisible and control characters (EX3)", () => {
  for (const [raw, shown] of ESCAPED) {
    it(`fail: ${JSON.stringify(raw)} is escaped as ${shown} in the text and in JSON`, () => {
      expect(excerptRows(at(1, `a${raw}b`), 8)).toEqual([`${I}1 | a${shown}b`]);
      expect(sourceLineOf(at(1, `a${raw}b`, 1))).toBe(`a${shown}b`);
    });
  }

  for (const raw of KEPT) {
    it(`pass: ${JSON.stringify(raw)} is shown as it is`, () => {
      expect(excerptRows(at(1, `a${raw}b`), 8)).toEqual([`${I}1 | a${raw}b`]);
      expect(sourceLineOf(at(1, `a${raw}b`, 1))).toBe(`a${raw}b`);
    });
  }

  it("fail: the caret counts the full width of an escape of more than 4 characters", () => {
    // `\u{e0001}` is 9 characters, so `x` (column 2) has the caret 9 spaces in
    expect(excerptRows(at(1, "\u{e0001}x", 2), 8)).toEqual([`${I}1 | \\u{e0001}x`, `${I}  | ${" ".repeat(9)}^`]);
  });

  it("fail: a control character right after the leading `...` of a slid window is escaped", () => {
    // 150 characters, ESC at index 60, column 101 -> index 100, window starts at index 60
    const line = `${"a".repeat(60)}\u001b${"b".repeat(89)}`;
    expect(excerptRows(at(1, line, 101), 8)).toEqual([
      `${I}1 | ...\\x1b${"b".repeat(89)}`,
      // `...` (3) + `\x1b` (4) + 39 letters before the caret character
      `${I}  | ${" ".repeat(3 + 4 + 39)}^`,
    ]);
  });
});
