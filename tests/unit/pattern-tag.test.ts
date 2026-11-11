/**
 * The PIECES of a `[pattern:"..."]` heading tag (docs/spec.md 2.10 "PATTERN",
 * "PLACEHOLDERS", "INVALID PATTERN"; section 9 "P1 grammar and tags"). The tag
 * is parsed after a heading text, so an offset relative to the line (not to the
 * tag) would show. Offsets count characters from the tag's `[` (0); the
 * quoted text starts at offset 10 (`[pattern:"` is 10 characters).
 */
import { describe, expect, it } from "vitest";
import type { PatternPiece } from "../../src/tags/ast.js";
import { parseHeadingSuffix } from "../../src/tags/parser.js";

/** Offset of the first character inside the quotes. */
const START = '[pattern:"'.length;

function pieces(pattern: string): readonly PatternPiece[] {
  const result = parseHeadingSuffix(`Release notes [pattern:"${pattern}"]`, { line: 3, column: 4 });
  expect(result.findings).toEqual([]);
  expect(result.text).toBe("Release notes");
  const [tag, ...rest] = result.tags;
  expect(rest).toEqual([]);
  if (tag?.kind !== "pattern") throw new Error(`no pattern tag for ${pattern}`);
  expect(tag.text).toBe(pattern);
  expect(tag.raw).toBe(`[pattern:"${pattern}"]`);
  return tag.pieces;
}

const lit = (text: string) => ({ kind: "literal", text });
const ph = (name: string, raw: string, format: string | null = null, argument: number | null = null) => ({ kind: "placeholder", name, format, argument, raw });
const bad = (reason: string, offset: number) => ({ kind: "invalid", reason, offset });

describe("pattern pieces: valid patterns (spec 2.10 PATTERN, PLACEHOLDERS)", () => {
  it.each([
    ["one placeholder", "{semver}", [ph("semver", "{semver}")]],
    ["placeholders and literal runs", "{semver} - {date}", [ph("semver", "{semver}"), lit(" - "), ph("date", "{date}")]],
    ["a `]` inside the quotes", "[{semver}] - {date}", [lit("["), ph("semver", "{semver}"), lit("] - "), ph("date", "{date}")]],
    ["format option", "v{semver:format:major-minor}", [lit("v"), ph("semver", "{semver:format:major-minor}", "major-minor")]],
    ["padding argument", "Item {digits:format:padding:3}", [lit("Item "), ph("digits", "{digits:format:padding:3}", "padding", 3)]],
    ["precision argument", "{number:format:precision:2} kg", [ph("number", "{number:format:precision:2}", "precision", 2), lit(" kg")]],
    ["text case format", "{text:format:snakecase}", [ph("text", "{text:format:snakecase}", "snakecase")]],
    ["char and text", "Epic {char} - {text}", [lit("Epic "), ph("char", "{char}"), lit(" - "), ph("text", "{text}")]],
    ["digits (the former int)", "Step {digits}", [lit("Step "), ph("digits", "{digits}")]],
    ["double braces are literal braces", "{{semver}}", [lit("{semver}")]],
    ["double braces inside a literal run", "a}}b{{c", [lit("a}b{c")]],
    ["escaped quote and backslash", 'say \\"hi\\" \\\\ end', [lit('say "hi" \\ end')]],
    ["escapes next to a placeholder", '\\"{digits}\\\\', [lit('"'), ph("digits", "{digits}"), lit("\\")]],
    ["case-insensitive names, raw as written", "{SemVer:FORMAT:Major-Minor}", [ph("semver", "{SemVer:FORMAT:Major-Minor}", "major-minor")]],
    ["case-insensitive format with argument", "{Digits:format:PADDING:3}", [ph("digits", "{Digits:format:PADDING:3}", "padding", 3)]],
    ["literal text keeps its case", "Release {date}", [lit("Release "), ph("date", "{date}")]],
    ["literal text only", "Notes", [lit("Notes")]],
  ])("%s: %s", (_label, pattern, expected) => {
    expect(pieces(pattern)).toEqual(expected);
  });

  // Every format of the table (spec 2.10), including the default format names.
  it.each([
    ["text", "human"],
    ["text", "snakecase"],
    ["text", "camelcase"],
    ["text", "screamcase"],
    ["text", "kebabcase"],
    ["text", "lowercase"],
    ["text", "uppercase"],
    ["number", "decimal"],
    ["number", "scientific"],
    ["digits", "signed"],
    ["digits", "hex"],
    ["digits", "uid"],
    ["semver", "full"],
    ["semver", "core"],
    ["semver", "major-minor"],
    ["date", "full"],
    ["date", "year-month"],
    ["date", "year"],
  ])("format without argument: {%s:format:%s}", (name, format) => {
    const raw = `{${name}:format:${format}}`;
    expect(pieces(raw)).toEqual([ph(name, raw, format)]);
  });

  it.each(["text", "number", "digits", "semver", "date", "char"])("every placeholder name: {%s}", (name) => {
    expect(pieces(`{${name}}`)).toEqual([ph(name, `{${name}}`)]);
  });
});

describe("pattern pieces: invalid patterns (spec 2.10 INVALID PATTERN, MTL014 reasons)", { tags: ["MTL014", "syntax"] }, () => {
  it.each([
    // Unknown placeholder name, column of its `{`.
    ["unknown name", "{version}", "unknown placeholder {version}", START],
    ["empty name", "{}", "unknown placeholder {}", START],
    ["{int} is unknown since A72n", "{int}", "unknown placeholder {int}", START],
    ["{int} after a literal", "Step {int}", "unknown placeholder {int}", START + 5],
    ["name is checked before shape", "{version:major}", "unknown placeholder {version:major}", START],
    // Malformed placeholder shape.
    ["option without format word", "{semver:major-minor}", "malformed placeholder {semver:major-minor}", START],
    ["empty format", "{semver:format:}", "malformed placeholder {semver:format:}", START],
    ["empty argument", "{digits:format:padding:}", "malformed placeholder {digits:format:padding:}", START],
    ["two arguments", "{digits:format:padding:3:4}", "malformed placeholder {digits:format:padding:3:4}", START],
    ["shape is checked before format", "{semver:fmt:patch}", "malformed placeholder {semver:fmt:patch}", START],
    // Unknown format for that placeholder.
    ["semver patch", "{semver:format:patch}", "unknown format patch for {semver}", START],
    ["digits full", "{digits:format:full}", "unknown format full for {digits}", START],
    ["digits decimal", "{digits:format:decimal}", "unknown format decimal for {digits}", START],
    ["text upper", "{text:format:upper}", "unknown format upper for {text}", START],
    ["text full", "{text:format:full}", "unknown format full for {text}", START],
    ["number hex", "{number:format:hex}", "unknown format hex for {number}", START],
    ["char takes no format", "{char:format:upper}", "unknown format upper for {char}", START],
    ["format is checked before argument", "{semver:format:patch:2}", "unknown format patch for {semver}", START],
    // Argument problems.
    ["padding needs an argument", "{digits:format:padding}", "format padding of {digits} needs an argument", START],
    ["precision needs an argument", "{number:format:precision}", "format precision of {number} needs an argument", START],
    ["argument zero", "{digits:format:padding:0}", "bad argument 0 for format padding of {digits}", START],
    ["argument with a leading zero", "{digits:format:padding:03}", "bad argument 03 for format padding of {digits}", START],
    ["argument not digits", "{digits:format:padding:x}", "bad argument x for format padding of {digits}", START],
    ["bad precision argument", "{number:format:precision:0}", "bad argument 0 for format precision of {number}", START],
    ["argument on year", "{date:format:year:month}", "format year of {date} takes no argument", START],
    ["argument on hex", "{digits:format:hex:2}", "format hex of {digits} takes no argument", START],
    // Unmatched braces, column of that brace.
    ["`{` without `}`", "a {semver", "unmatched '{'", START + 2],
    ["`{` before the next `{`", "{semver {date}", "unmatched '{'", START],
    ["lone `}`", "a } b", "unmatched '}'", START + 2],
    // Adjacent placeholders, column of the second `{`.
    ["adjacent placeholders", "{digits}{text}", "adjacent placeholders {digits}{text}", START + 8],
    ["adjacent char and text", "x{char}{text}", "adjacent placeholders {char}{text}", START + 7],
    // Invalid escape, column of the backslash.
    ["backslash n", "a\\nb", "invalid escape \\n", START + 1],
    ["backslash brace", "\\{semver}", "invalid escape \\{", START],
    // Empty pattern, column of the tag's `[`.
    ["empty pattern", "", "empty pattern", 0],
  ])("%s: %s", (_label, pattern, reason, offset) => {
    const list = pieces(pattern);
    expect(list.at(-1)).toEqual(bad(reason, offset));
    expect(list.filter((piece) => piece.kind === "invalid")).toHaveLength(1);
  });

  it("keeps the pieces before the first problem and stops there (first problem only)", () => {
    expect(pieces("ab {version} \\x {}")).toEqual([lit("ab "), bad("unknown placeholder {version}", START + 3)]);
    expect(pieces("{semver} \\q {int}")).toEqual([ph("semver", "{semver}"), lit(" "), bad("invalid escape \\q", START + 9)]);
  });

  it("an invalid escape never ends the quoted text", () => {
    // `\x` is paired by the lexer, so the closing quote is the next unescaped `"`.
    const result = parseHeadingSuffix('R [pattern:"a\\x"]');
    expect(result.text).toBe("R");
    expect(result.findings).toEqual([]);
    expect(result.tags).toMatchObject([{ kind: "pattern", text: "a\\x", pieces: [lit("a"), bad("invalid escape \\x", START + 1)] }]);
  });

  it("counts offsets in code points (an astral character is one)", () => {
    expect(pieces("\u{1F680} {int}")).toEqual([lit("\u{1F680} "), bad("unknown placeholder {int}", START + 2)]);
  });
});
