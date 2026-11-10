/**
 * Family `unique-headings-names` (spec 2.11): `[unique-headings-names]`, no colon and no
 * argument. Rules fmUniqueNamesTag and bodyUniqueNamesTag; one visitor per region, as for
 * `presence`. In the frontmatter the tag takes effect only on a standalone comment line (the
 * orchestrator decides, src/tags/parser.ts); after a key it stays an inert tag.
 */
import { FamilyVisitor, type BodyTagData, type FrontmatterTagData } from "./base.js";

export class FrontmatterUniqueNamesVisitor extends FamilyVisitor<FrontmatterTagData> {
  override visitFmUniqueNamesTag = (): FrontmatterTagData => ({ kind: "unique-names" });
}

export class BodyUniqueNamesVisitor extends FamilyVisitor<BodyTagData> {
  override visitBodyUniqueNamesTag = (): BodyTagData => ({ kind: "unique-names" });
}
