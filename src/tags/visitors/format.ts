/**
 * Family `format` (spec 2.3): `[format:constant:<v>]`, `[format:snake_case]`,
 * `[format:kebab-case]`, `[format:elements:<case>]`, `[format:scheme:<list>]`.
 * Rule fmFormatTag.
 */
import type { FmCaseStyleContext, FmFormatTagContext } from "../../generated/MdTemplateParser.js";
import type { CaseStyle } from "../ast.js";
import { FamilyVisitor, type FrontmatterTagData } from "./base.js";

function caseStyle(ctx: FmCaseStyleContext): CaseStyle {
  return ctx.SNAKE_CASE_CS() !== null || ctx.SNAKE_CASE() !== null ? "snake_case" : "kebab-case";
}

export class FormatVisitor extends FamilyVisitor<FrontmatterTagData> {
  override visitFmFormatTag = (ctx: FmFormatTagContext): FrontmatterTagData => {
    const scheme = ctx.SCHEME_TEXT();
    if (scheme !== null) {
      const argument = scheme.getText();
      const schemes = argument
        .split(",")
        .map((part) => part.trim().toLowerCase())
        .filter((part) => part !== "");
      return { kind: "format-scheme", argument, schemes };
    }
    const free = ctx.tagFreeText();
    if (ctx.CONSTANT_ARG() !== null) {
      return { kind: "format-constant", value: free === null ? "" : free.getText().trim() };
    }
    const style = caseStyle(ctx.fmCaseStyle() as FmCaseStyleContext);
    return ctx.ELEMENTS() !== null
      ? { kind: "format-elements", style }
      : { kind: "format-case", style };
  };
}
