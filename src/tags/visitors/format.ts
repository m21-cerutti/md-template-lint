/**
 * Family `format` (spec 2.3, 2.9): `[format:constant:<v>]`, `[format:snake_case]`,
 * `[format:kebab-case]`, `[format:elements:<case>]`, `[format:scheme:<list>]`,
 * `[format:semver]`, `[format:date]`, `[format:elements:semver]`,
 * `[format:elements:date]`. Rule fmFormatTag.
 */
import type {
  FmCaseStyleContext,
  FmFormatTagContext,
  FmShapeContext,
} from "../../generated/MdTemplateParser.js";
import type { CaseStyle, ValueShape } from "../ast.js";
import { FamilyVisitor, type FrontmatterTagData } from "./base.js";

function caseStyle(ctx: FmCaseStyleContext): CaseStyle {
  return ctx.SNAKE_CASE_CS() !== null || ctx.SNAKE_CASE() !== null ? "snake_case" : "kebab-case";
}

function valueShape(ctx: FmShapeContext): ValueShape {
  return ctx.SEMVER() !== null ? "semver" : "date";
}

export class FormatVisitor extends FamilyVisitor<FrontmatterTagData> {
  override visitFmFormatTag = (ctx: FmFormatTagContext): FrontmatterTagData => {
    const shapeCtx = ctx.fmShape();
    if (shapeCtx !== null) {
      const shape = valueShape(shapeCtx);
      return ctx.ELEMENTS() !== null
        ? { kind: "format-elements-shape", shape }
        : { kind: "format-shape", shape };
    }
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
