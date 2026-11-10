/**
 * Family `pattern` (spec 2.10): `[pattern:"<text>"]`. Rule bodyPatternTag.
 *
 * The lexer (mode TAG_PATTERN) cuts the quoted text into literal text, escape
 * pairs, `{{` and `}}`, placeholder candidates `{...}` and lone braces. This
 * visitor builds the PIECES of the pattern and checks them against the fixed
 * placeholder and format table of spec 2.10. The pieces stop at the first
 * problem from the left, an `invalid` piece with its `MTL014` reason (the rule
 * itself is phase P2).
 */
import type { BodyPatternTagContext, PatternPieceContext } from "../../generated/MdTemplateParser.js";
import type { PatternPiece, PatternPlaceholderName } from "../ast.js";
import { FamilyVisitor, type BodyTagData } from "./base.js";

const PLACEHOLDER_NAMES: readonly PatternPlaceholderName[] = ["text", "number", "digits", "semver", "date", "char"];

/** Per placeholder: its formats, each mapped to "needs an argument". `char` has none. */
const FORMATS = new Map<PatternPlaceholderName, ReadonlyMap<string, boolean>>([
  [
    "text",
    new Map([
      ["human", false],
      ["snakecase", false],
      ["camelcase", false],
      ["screamcase", false],
      ["kebabcase", false],
      ["lowercase", false],
      ["uppercase", false],
    ]),
  ],
  [
    "number",
    new Map([
      ["decimal", false],
      ["scientific", false],
      ["precision", true],
    ]),
  ],
  [
    "digits",
    new Map([
      ["signed", false],
      ["hex", false],
      ["uid", false],
      ["padding", true],
    ]),
  ],
  [
    "semver",
    new Map([
      ["full", false],
      ["core", false],
      ["major-minor", false],
    ]),
  ],
  [
    "date",
    new Map([
      ["full", false],
      ["year-month", false],
      ["year", false],
    ]),
  ],
  ["char", new Map<string, boolean>()],
]);

/** `[1-9][0-9]*`: ASCII digits, 1 or more, no leading zero. */
function isPositiveInteger(text: string): boolean {
  if (text === "") return false;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    if (code < 48 || code > 57) return false;
    if (index === 0 && code === 48) return false;
  }
  return true;
}

function invalid(reason: string, offset: number): PatternPiece {
  return { kind: "invalid", reason, offset };
}

/** One placeholder candidate `{...}`: name, shape, format, argument (spec 2.10, in this order). */
function placeholder(raw: string, offset: number): PatternPiece {
  const parts = raw.slice(1, -1).split(":");
  const written = parts[0] ?? "";
  const name = PLACEHOLDER_NAMES.find((candidate) => candidate === written.toLowerCase());
  if (name === undefined) return invalid(`unknown placeholder ${raw}`, offset);
  if (parts.length === 1) return { kind: "placeholder", name, format: null, argument: null, raw };
  const shaped = (parts.length === 3 || parts.length === 4) && parts[1]?.toLowerCase() === "format" && parts.every((part) => part !== "");
  if (!shaped) return invalid(`malformed placeholder ${raw}`, offset);
  const formatText = parts[2] ?? "";
  const format = formatText.toLowerCase();
  const needsArgument = FORMATS.get(name)?.get(format);
  if (needsArgument === undefined) {
    return invalid(`unknown format ${formatText} for {${written}}`, offset);
  }
  const argument = parts[3];
  const where = `format ${formatText} of {${written}}`;
  if (needsArgument && argument === undefined) {
    return invalid(`${where} needs an argument`, offset);
  }
  if (!needsArgument && argument !== undefined) {
    return invalid(`${where} takes no argument`, offset);
  }
  if (argument !== undefined && !isPositiveInteger(argument)) {
    return invalid(`bad argument ${argument} for ${where}`, offset);
  }
  return {
    kind: "placeholder",
    name,
    format,
    argument: argument === undefined ? null : Number.parseInt(argument, 10),
    raw,
  };
}

/** The pieces of the quoted text, left to right, up to the first problem. */
function buildPieces(parts: readonly PatternPieceContext[]): PatternPiece[] {
  const pieces: PatternPiece[] = [];
  let literal = "";
  const flush = () => {
    if (literal !== "") pieces.push({ kind: "literal", text: literal });
    literal = "";
  };
  const stop = (piece: PatternPiece) => {
    flush();
    pieces.push(piece);
    return pieces;
  };
  for (const part of parts) {
    const text = part.PAT_TEXT()?.symbol;
    const escape = part.PAT_ESCAPE()?.symbol;
    const holder = part.PAT_PLACEHOLDER()?.symbol;
    const open = part.PAT_LBRACE()?.symbol;
    const close = part.PAT_RBRACE()?.symbol;
    if (text !== undefined) {
      literal += text.text ?? "";
    } else if (escape !== undefined) {
      const pair = escape.text ?? "";
      if (pair !== '\\"' && pair !== "\\\\") {
        return stop(invalid(`invalid escape ${pair}`, escape.column));
      }
      literal += pair.slice(1);
    } else if (part.PAT_LBRACE2() !== null) {
      literal += "{";
    } else if (part.PAT_RBRACE2() !== null) {
      literal += "}";
    } else if (holder !== undefined) {
      flush();
      const piece = placeholder(holder.text ?? "", holder.column);
      const previous = pieces.at(-1);
      if (piece.kind === "placeholder" && previous?.kind === "placeholder") {
        return stop(invalid(`adjacent placeholders ${previous.raw}${piece.raw}`, holder.column));
      }
      pieces.push(piece);
      if (piece.kind === "invalid") return pieces;
    } else if (open !== undefined) {
      return stop(invalid("unmatched '{'", open.column));
    } else if (close !== undefined) {
      return stop(invalid("unmatched '}'", close.column));
    }
  }
  if (parts.length === 0) return [invalid("empty pattern", 0)];
  flush();
  return pieces;
}

export class PatternVisitor extends FamilyVisitor<BodyTagData> {
  override visitBodyPatternTag = (ctx: BodyPatternTagContext): BodyTagData => {
    const parts = ctx.patternPiece();
    return {
      kind: "pattern",
      text: parts.map((part) => part.getText()).join(""),
      pieces: buildPieces(parts),
    };
  };
}
