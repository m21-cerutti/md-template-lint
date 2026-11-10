/**
 * Family `repeat-rules` (spec 2.10): `[repeat-rules:same-level]`,
 * `[repeat-rules:same-level:min:N]`, `[repeat-rules:same-level:max:N]`.
 * Rule bodyRepeatTag. The grammar refuses an N that starts with `0`.
 */
import type { BodyRepeatTagContext } from "../../generated/MdTemplateParser.js";
import { FamilyVisitor, type BodyTagData } from "./base.js";

export class RepeatVisitor extends FamilyVisitor<BodyTagData> {
  override visitBodyRepeatTag = (ctx: BodyRepeatTagContext): BodyTagData => {
    const bound = ctx.fmBound();
    const count = ctx.repeatCount();
    if (bound === null || count === null) return { kind: "repeat", bound: "none", n: null };
    return {
      kind: "repeat",
      bound: bound.MIN() !== null ? "min" : "max",
      n: Number.parseInt(count.NUMBER().getText(), 10),
    };
  };
}
