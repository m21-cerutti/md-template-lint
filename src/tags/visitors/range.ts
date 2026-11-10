/** Family `range` (spec 2.3): `[range:min:N]`, `[range:max:N]`. Rule fmRangeTag. */
import type { FmRangeTagContext } from "../../generated/MdTemplateParser.js";
import { FamilyVisitor, type FrontmatterTagData } from "./base.js";

export class RangeVisitor extends FamilyVisitor<FrontmatterTagData> {
  override visitFmRangeTag = (ctx: FmRangeTagContext): FrontmatterTagData => {
    const number = ctx.fmSignedNumber();
    const text = number.getText();
    return {
      kind: "range",
      bound: ctx.fmBound().MIN() !== null ? "min" : "max",
      text,
      isFloat: number.DOT() !== null,
      value: Number(text),
    };
  };
}
