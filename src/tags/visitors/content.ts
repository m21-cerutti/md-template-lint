/**
 * Family `content` (spec 2.6): `[content:non-empty|table|list]`,
 * `[content:min-lines:N]`, `[content:max-lines:N]`. Rule bodyContentTag.
 */
import type { BodyContentTagContext } from "../../generated/MdTemplateParser.js";
import { FamilyVisitor, type BodyTagData } from "./base.js";

export class ContentVisitor extends FamilyVisitor<BodyTagData> {
  override visitBodyContentTag = (ctx: BodyContentTagContext): BodyTagData => {
    const number = ctx.NUMBER();
    if (number !== null) {
      return {
        kind: "content-lines",
        bound: ctx.MIN_LINES() !== null ? "min" : "max",
        value: Number.parseInt(number.getText(), 10),
      };
    }
    if (ctx.NON_EMPTY() !== null) return { kind: "content", check: "non-empty" };
    return { kind: "content", check: ctx.TABLE() !== null ? "table" : "list" };
  };
}
