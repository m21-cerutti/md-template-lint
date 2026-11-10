/** Family `io` (spec 2.8): `[io:exists]`. Rule fmIoTag. */
import { FamilyVisitor, type FrontmatterTagData } from "./base.js";

export class IoVisitor extends FamilyVisitor<FrontmatterTagData> {
  override visitFmIoTag = (): FrontmatterTagData => ({ kind: "io-exists" });
}
