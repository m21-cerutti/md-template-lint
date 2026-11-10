/**
 * Family `filename` (spec 2.5): `[filename:case:<convention>]`, fully
 * case-sensitive. Rule fmFilenameTag. Effective only on a standalone comment
 * line; after a key the orchestrator keeps it as an inert tag.
 */
import type { FmFilenameTagContext } from "../../generated/MdTemplateParser.js";
import type { FilenameConvention } from "../ast.js";
import { FamilyVisitor, type FrontmatterTagData } from "./base.js";

export class FilenameVisitor extends FamilyVisitor<FrontmatterTagData> {
  override visitFmFilenameTag = (ctx: FmFilenameTagContext): FrontmatterTagData => {
    const convention = ctx.fmConvention();
    let value: FilenameConvention = "PascalCase";
    if (convention.SNAKE_CASE_CS() !== null) value = "snake_case";
    else if (convention.KEBAB_CASE_CS() !== null) value = "kebab-case";
    else if (convention.CAMEL_CASE() !== null) value = "camelCase";
    return { kind: "filename-case", convention: value };
  };
}
