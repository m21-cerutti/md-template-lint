/** Family `value` (spec 2.3): `[value:filename]`. Rule fmValueTag. */
import { FamilyVisitor, type FrontmatterTagData } from "./base.js";

export class ValueVisitor extends FamilyVisitor<FrontmatterTagData> {
  override visitFmValueTag = (): FrontmatterTagData => ({ kind: "value-filename" });
}
