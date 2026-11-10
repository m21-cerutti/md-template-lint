/**
 * Disable directives of a target (spec 4.4, DIR2 to DIR4). Not a tag family
 * (no fmTagBody / bodyTagBody alternative, not in visitors/index.ts), like
 * heading.ts and brackets.ts. Two structural helpers:
 *
 * - scanComments pairs the DIRECTIVE_SCAN tokens of one line left to right:
 *   a backtick run opens a code span closed by the next run of the same
 *   length (an unmatched run is text), a `<!--` outside a code span opens a
 *   comment closed by the first following `-->`. Token types and lengths
 *   only; the grammar decides what a token is.
 * - DirectiveVisitor reads the directiveEntry tree of one comment content:
 *   null for prose, else the verb, the word at the verb position, the item
 *   tokens and the reason. Positions are added by src/tags/parser.ts.
 */
import type { Token } from "antlr4ng";
import { MdTemplateLexer } from "../../generated/MdTemplateLexer.js";
import type { DirectiveContext } from "../../generated/MdTemplateParser.js";
import type { DirectiveVerb } from "../ast.js";
import { FamilyVisitor } from "./base.js";

/** Indices of the `<!--` and `-->` tokens of one comment of a scanned line. */
export interface CommentSpan {
  readonly open: number;
  readonly close: number;
}

/** Index of the first token after `from` that `match` accepts, or -1. */
function findFrom(tokens: readonly Token[], from: number, match: (token: Token) => boolean) {
  for (let index = from; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token !== undefined && match(token)) return index;
  }
  return -1;
}

/** One-line comments of a scanned line outside code spans, left to right (DIR3, DIR4). */
export function scanComments(tokens: readonly Token[]): CommentSpan[] {
  const spans: CommentSpan[] = [];
  let index = 0;
  while (index < tokens.length) {
    const token = tokens[index];
    if (token === undefined) break;
    if (token.type === MdTemplateLexer.SCAN_TICKS) {
      const length = (token.text ?? "").length;
      const close = findFrom(
        tokens,
        index + 1,
        (next) => next.type === MdTemplateLexer.SCAN_TICKS && (next.text ?? "").length === length,
      );
      index = close < 0 ? index + 1 : close + 1;
    } else if (token.type === MdTemplateLexer.SCAN_OPEN) {
      const close = findFrom(tokens, index + 1, (next) => next.type === MdTemplateLexer.SCAN_CLOSE);
      // No `-->` on this line: a multi-line comment, never a directive (DIR3).
      if (close < 0) break;
      spans.push({ open: index, close });
      index = close + 1;
    } else {
      index += 1;
    }
  }
  return spans;
}

/** The parse data of one directive, before the orchestrator locates it. */
export interface DirectiveParts {
  readonly verb: DirectiveVerb | null;
  readonly word: string;
  readonly items: readonly Token[];
  readonly reason: string | null;
}

/** First token of a directiveVerb alternative -> canonical verb. */
const VERBS = new Map<number, DirectiveVerb>([
  [MdTemplateLexer.DIR_DISABLE, "disable"],
  [MdTemplateLexer.DIR_DISABLE_LINE, "disable-line"],
  [MdTemplateLexer.DIR_DISABLE_NEXT_LINE, "disable-next-line"],
  [MdTemplateLexer.DIR_DISABLE_FILE, "disable-file"],
  [MdTemplateLexer.DIR_BEGIN, "begin disable"],
  [MdTemplateLexer.DIR_END, "end disable"],
]);

export class DirectiveVisitor extends FamilyVisitor<DirectiveParts> {
  override visitDirective = (ctx: DirectiveContext): DirectiveParts => {
    const head = ctx.directiveHead();
    const verb = head?.directiveVerb()?.start ?? null;
    const args = ctx.directiveArgs();
    const items: Token[] = [];
    for (const item of args?.directiveItem() ?? []) {
      if (item.start !== null) items.push(item.start);
    }
    const reason = args?.directiveReason()?.getText() ?? null;
    return {
      verb: verb === null ? null : (VERBS.get(verb.type) ?? null),
      // The leading separators of a misplaced head are not part of the word.
      word: (head?.directiveMisplaced() ?? head)?.getText() ?? "",
      items,
      reason: reason === null ? null : reasonText(reason),
    };
  };
}

/** DIR2: drop the `--` marker and the one comma glued to it; the rest is free text. */
function reasonText(token: string): string {
  const rest = token.slice(2);
  return (rest.startsWith(",") ? rest.slice(1) : rest).trim();
}
