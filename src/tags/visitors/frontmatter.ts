/**
 * Family `frontmatter` (ADR 0015): `[frontmatter:optional]`. Rule fmFrontmatterTag. The tag
 * takes effect only on a standalone comment line of a template frontmatter (the orchestrator
 * decides, src/tags/parser.ts); after a key or in mixed comment text it stays inert.
 */
import { FamilyVisitor, type FrontmatterTagData } from "./base.js";

export class FrontmatterOptionalVisitor extends FamilyVisitor<FrontmatterTagData> {
  override visitFmFrontmatterTag = (): FrontmatterTagData => ({ kind: "frontmatter-optional" });
}
