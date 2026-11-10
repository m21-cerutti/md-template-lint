/** Family `count` (spec 2.3): `[count:min:N]`, `[count:max:N]`. Rule fmCountTag. */
import type { FmCountTagContext } from "../../generated/MdTemplateParser.js";
import { FamilyVisitor, type FrontmatterTagData } from "./base.js";

export class CountVisitor extends FamilyVisitor<FrontmatterTagData> {
  override visitFmCountTag = (ctx: FmCountTagContext): FrontmatterTagData => ({
    kind: "count",
    bound: ctx.fmBound().MIN() !== null ? "min" : "max",
    value: Number.parseInt(ctx.NUMBER().getText(), 10),
  });
}
