/**
 * Shared base of the per-family tag visitors (src/tags/visitors/<family>.ts).
 *
 * Each family visitor extends FamilyVisitor and overrides ONLY the visit
 * method of its own parser rule (for example visitFmCountTag). Visiting any
 * other tag gives null, so the orchestrator (src/tags/parser.ts) can ask every
 * visitor of a region in turn without a central switch over tag kinds.
 */
import { MdTemplateParserVisitor } from "../../generated/MdTemplateParserVisitor.js";
import type { BodyTag, FrontmatterTag } from "../ast.js";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** A frontmatter tag without location and region (added by the orchestrator). */
export type FrontmatterTagData = DistributiveOmit<FrontmatterTag, "position" | "raw" | "region">;

/** A body tag without location and region (added by the orchestrator). */
export type BodyTagData = DistributiveOmit<BodyTag, "position" | "raw" | "region">;

/** Visitor whose result is the first non-null result found in the subtree. */
export abstract class FamilyVisitor<T> extends MdTemplateParserVisitor<T> {
  protected override defaultResult(): T | null {
    return null;
  }

  protected override aggregateResult(aggregate: T | null, next: T | null): T | null {
    return aggregate ?? next;
  }
}
