/**
 * Family `presence`: frontmatter (spec 2.2) and heading (spec 2.6) presence
 * tags. Rules fmPresenceTag and bodyPresenceTag; one visitor per region,
 * because the two regions accept different modes.
 */
import type {
  BodyPresenceTagContext,
  FmPresenceTagContext,
} from "../../generated/MdTemplateParser.js";
import { FamilyVisitor, type BodyTagData, type FrontmatterTagData } from "./base.js";

/** `[presence:required|optional|conditional:<text>]` in a key comment. */
export class FrontmatterPresenceVisitor extends FamilyVisitor<FrontmatterTagData> {
  override visitFmPresenceTag = (ctx: FmPresenceTagContext): FrontmatterTagData => {
    const free = ctx.tagFreeText();
    if (free !== null) {
      return { kind: "presence", mode: "conditional", detail: free.getText().trim() };
    }
    return { kind: "presence", mode: ctx.REQUIRED() !== null ? "required" : "optional" };
  };
}

/** `[presence:required|optional|exist|template-only|conditional:<text>]` on a heading. */
export class BodyPresenceVisitor extends FamilyVisitor<BodyTagData> {
  override visitBodyPresenceTag = (ctx: BodyPresenceTagContext): BodyTagData => {
    const free = ctx.tagFreeText();
    if (free !== null) {
      return { kind: "presence", mode: "conditional", detail: free.getText().trim() };
    }
    if (ctx.REQUIRED() !== null) return { kind: "presence", mode: "required" };
    if (ctx.OPTIONAL() !== null) return { kind: "presence", mode: "optional" };
    if (ctx.EXIST() !== null) return { kind: "presence", mode: "exist" };
    return { kind: "presence", mode: "template-only" };
  };
}
