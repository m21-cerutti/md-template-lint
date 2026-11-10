/**
 * Family `brackets` (spec 2.7, unknown and inert brackets): classify one
 * stage-1 item of a comment or heading. A VISITOR (returns the shape):
 *
 * - candidate: `[word:...` -> stage 2 decides (known family or not);
 *   `shaped` tells whether an unknown family is reported (tag-shaped);
 * - bare: `[word]` -> type hint; inert for a known type name or non-ASCII, else stage 2
 *   decides: a colon-less tag (`[unique-headings-names]`, spec 2.11) or unknown;
 * - shaped: `[A-Za-z0-9_:-]+` not starting with `word:` -> unknown;
 * - rule: `[rule]` -> inert; prose brackets and plain tokens -> null.
 */
import type { ParserRuleContext } from "antlr4ng";
import type { TagBareBracketContext, TagClosedCandidateContext, TagPatternCandidateContext, TagShapedBracketContext, TagShapedCandidateContext, TagUnclosedCandidateContext } from "../../generated/MdTemplateParser.js";
import { KNOWN_TYPE_NAMES } from "../types.js";
import { FamilyVisitor } from "./base.js";

export type BracketShape =
  | { readonly kind: "candidate"; readonly ctx: ParserRuleContext; readonly shaped: boolean }
  | { readonly kind: "unknown"; readonly ctx: ParserRuleContext }
  /** `[word]` of an unknown type name: a colon-less tag when stage 2 knows it, else unknown. */
  | { readonly kind: "bare"; readonly ctx: ParserRuleContext }
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

  // `[pattern:"` ... : the family is known, so `shaped` never matters.
  override visitTagPatternCandidate = (ctx: TagPatternCandidateContext): BracketShape => ({
    kind: "candidate",
    ctx,
    shaped: false,
  });

  override visitTagBareBracket = (ctx: TagBareBracketContext): BracketShape => {
    const name = ctx.tagHintName();
    // Standalone `# [rule]` parses as a bare bracket (tagWord includes RULE): it is the inert
    // rule marker, as on key lines (tagRuleMarker), never an unknown tag.
    const pieces = name.tagHintPiece();
    if (pieces.length === 1 && pieces[0]!.tagWord()?.RULE() != null) {
      return { kind: "inert" };
    }
    const ascii = name.tagHintPiece().every((piece) => piece.UWORD() === null);
    return ascii && !KNOWN_TYPE_NAMES.has(name.getText().toLowerCase()) ? { kind: "bare", ctx } : { kind: "inert" };
  };

  override visitTagShapedBracket = (ctx: TagShapedBracketContext): BracketShape => ({
    kind: "unknown",
    ctx,
  });

  override visitTagRuleMarker = (): BracketShape => ({ kind: "inert" });
}
