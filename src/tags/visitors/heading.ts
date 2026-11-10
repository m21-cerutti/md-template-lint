/**
 * Family `heading suffix` (spec 2.6). A VISITOR over bodyHeading that returns
 * the level and the text items, plus the peeling of trailing tags.
 *
 * Legacy `(.+?)\s*(<!--.*-->)?\s*$`: a trailing one-line HTML comment is
 * dropped. Tags are peeled from the right while the text ends in a valid body
 * tag; only the single leftover trailing bracket can give a finding.
 */
import { ParserRuleContext, TerminalNode } from "antlr4ng";
import { MdTemplateLexer } from "../../generated/MdTemplateLexer.js";
import type { BodyHeadingContext } from "../../generated/MdTemplateParser.js";
import type { BodyTag, TagFinding } from "../ast.js";
import { FamilyVisitor } from "./base.js";

export interface HeadingParts {
  /** ATX level 1 to 6. */
  readonly level: number;
  readonly items: readonly ParserRuleContext[];
}

export class HeadingVisitor extends FamilyVisitor<HeadingParts> {
  override visitBodyHeading = (ctx: BodyHeadingContext): HeadingParts => {
    const marker = ctx.H_OPEN().getText();
    let level = 0;
    while (marker.charAt(level) === "#") level += 1;
    return { level, items: ctx.bodyHeadingItem() };
  };
}

/** Classification of one heading item by the orchestrator (stage 2 included). */
export type HeadingItemResult = { readonly tag: BodyTag } | { readonly finding: Omit<TagFinding, "subject"> } | null;

export interface PeeledHeading {
  readonly text: string;
  readonly tags: readonly BodyTag[];
  readonly findings: readonly Omit<TagFinding, "subject">[];
}

function tokenType(item: ParserRuleContext): number | null {
  const child = item.getChild(0);
  return child instanceof TerminalNode ? child.symbol.type : null;
}

/** Peel recognized body tags from the right of the heading text items. */
export function peelHeading(items: readonly ParserRuleContext[], classify: (item: ParserRuleContext) => HeadingItemResult): PeeledHeading {
  const isWs = (index: number): boolean => tokenType(items[index] as ParserRuleContext) === MdTemplateLexer.WS;
  let end = items.length;
  while (end > 0 && isWs(end - 1)) end -= 1;
  if (end > 0 && tokenType(items[end - 1] as ParserRuleContext) === MdTemplateLexer.HTML_COMMENT) {
    end -= 1;
    while (end > 0 && isWs(end - 1)) end -= 1;
  }

  const tags: BodyTag[] = [];
  const findings: Omit<TagFinding, "subject">[] = [];
  let cut = end;
  let index = end - 1;
  while (index >= 0) {
    const result = classify(items[index] as ParserRuleContext);
    if (result !== null && "tag" in result) {
      tags.unshift(result.tag);
      cut = index;
      index -= 1;
      while (index >= 0 && isWs(index)) index -= 1;
      continue;
    }
    if (result !== null) findings.push(result.finding);
    break;
  }
  const text = items
    .slice(0, cut)
    .map((item) => item.getText())
    .join("")
    .trim();
  return { text, tags, findings };
}
