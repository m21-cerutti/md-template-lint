/**
 * Family `order`: frontmatter (spec 2.3) `[order:ascending]` (rule fmOrderTag)
 * and heading (spec 2.10) `[order:ascending|descending]` and
 * `[order:first:number|date|semver:ascending|descending]` (rule bodyOrderTag).
 * One visitor per region, because the two regions accept different forms.
 */
import type { BodyOrderTagContext } from "../../generated/MdTemplateParser.js";
import { FamilyVisitor, type BodyTagData, type FrontmatterTagData } from "./base.js";

export class OrderVisitor extends FamilyVisitor<FrontmatterTagData> {
  override visitFmOrderTag = (): FrontmatterTagData => ({ kind: "order-ascending" });
}

export class BodyOrderVisitor extends FamilyVisitor<BodyTagData> {
  override visitBodyOrderTag = (ctx: BodyOrderTagContext): BodyTagData => {
    const by =
      ctx.FIRST() === null
        ? "text"
        : ctx.NUMBER_WORD() !== null
          ? "first-number"
          : ctx.DATE() !== null
            ? "first-date"
            : "first-semver";
    return {
      kind: "order",
      direction: ctx.DESCENDING() !== null ? "descending" : "ascending",
      by,
    };
  };
}
