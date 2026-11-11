/**
 * Family `type hints` (spec 2.4): `[<word>]`, `YYYY-MM-DD`,
 * `ISO`, `url`/`lien`, `path`, `@<name>/`. A LISTENER (simple collection, no
 * return value): walk an inline comment and collect every hint in source order.
 * Hints anywhere in the comment count, inside brackets too (legacy searched
 * the whole comment text).
 */
import type { TerminalNode, Token } from "antlr4ng";
import { MdTemplateLexer } from "../../generated/MdTemplateLexer.js";
import type { TagBareBracketContext } from "../../generated/MdTemplateParser.js";
import { MdTemplateParserListener } from "../../generated/MdTemplateParserListener.js";
import type { SourcePosition, TypeHint } from "../ast.js";

export class TypeHintListener extends MdTemplateParserListener {
  readonly hints: TypeHint[] = [];

  constructor(private readonly positionOf: (token: Token) => SourcePosition) {
    super();
  }

  override enterTagBareBracket = (ctx: TagBareBracketContext): void => {
    if (ctx.start === null) return;
    this.hints.push({
      kind: "bracket",
      name: ctx.tagHintName().getText().toLowerCase(),
      position: this.positionOf(ctx.start),
      raw: ctx.getText(),
    });
  };

  override visitTerminal(node: TerminalNode): void {
    const token = node.symbol;
    const raw = token.text ?? "";
    const position = this.positionOf(token);
    switch (token.type) {
      case MdTemplateLexer.DATE_PLACEHOLDER:
        this.hints.push({ kind: "date-placeholder", position, raw });
        break;
      case MdTemplateLexer.ISO:
        this.hints.push({ kind: "iso-word", position, raw });
        break;
      case MdTemplateLexer.URL:
      case MdTemplateLexer.LIEN:
        this.hints.push({ kind: "url-word", position, raw });
        break;
      case MdTemplateLexer.PATH:
        this.hints.push({ kind: "path-word", position, raw });
        break;
      case MdTemplateLexer.ALIAS_MARK:
        this.hints.push({ kind: "alias-marker", name: raw.slice(1, -1), position, raw });
        break;
      default:
        break;
    }
  }
}
