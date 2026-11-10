/**
 * Family `brackets` (spec 2.7, unknown and inert brackets): classify one
 * stage-1 item of a comment or heading. A VISITOR (returns the shape):
 *
 * - candidate: `[word:...` -> stage 2 decides (known family or not);
 *   `shaped` tells whether an unknown family is reported (tag-shaped);
 * - bare: `[word]` -> type hint; unknown unless a known type name or non-ASCII;
 * - shaped: `[A-Za-z0-9_:-]+` not starting with `word:` -> unknown;
 * - rule: `[rule]` -> inert; prose brackets and plain tokens -> null.
 */
import type { ParserRuleContext } from "antlr4ng";
import type {
  TagBareBracketContext,
  TagClosedCandidateContext,
  TagShapedBracketContext,
  TagShapedCandidateContext,
  TagUnclosedCandidateContext,
} from "../../generated/MdTemplateParser.js";
import { KNOWN_TYPE_NAMES } from "../types.js";
import { FamilyVisitor } from "./base.js";

export type BracketShape =
  | { readonly kind: "candidate"; readonly ctx: ParserRuleContext; readonly shaped: boolean }
  | { readonly kind: "unknown"; readonly ctx: ParserRuleContext }
  | { readonly kind: "inert" };

export class BracketShapeVisitor extends FamilyVisitor<BracketShape> {
  override visitTagShapedCandidate = (ctx: TagShapedCandidateContext): BracketShape => ({
    kind: "candidate",
    ctx,
    shaped: true,
  });

  override visitTagClosedCandidate = (ctx: TagClosedCandidateContext): BracketShape => ({
    kind: "candidate",
    ctx,
    shaped: false,
  });

  override visitTagUnclosedCandidate = (ctx: TagUnclosedCandidateContext): BracketShape => ({
    kind: "candidate",
    ctx,
    shaped: false,
  });

  override visitTagBareBracket = (ctx: TagBareBracketContext): BracketShape => {
    const name = ctx.tagHintName();
    const ascii = name.tagHintPiece().every((piece) => piece.UWORD() === null);
    return ascii && !KNOWN_TYPE_NAMES.has(name.getText().toLowerCase())
      ? { kind: "unknown", ctx }
      : { kind: "inert" };
  };

  override visitTagShapedBracket = (ctx: TagShapedBracketContext): BracketShape => ({
    kind: "unknown",
    ctx,
  });

  override visitTagRuleMarker = (): BracketShape => ({ kind: "inert" });
}
