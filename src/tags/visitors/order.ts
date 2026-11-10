/** Family `order` (spec 2.3): `[order:ascending]`. Rule fmOrderTag. */
import { FamilyVisitor, type FrontmatterTagData } from "./base.js";

export class OrderVisitor extends FamilyVisitor<FrontmatterTagData> {
  override visitFmOrderTag = (): FrontmatterTagData => ({ kind: "order-ascending" });
}
