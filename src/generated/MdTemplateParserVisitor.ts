
import { AbstractParseTreeVisitor } from "antlr4ng";


import { DocumentContext } from "./MdTemplateParser.js";
import { FrontmatterContext } from "./MdTemplateParser.js";
import { FmUnclosedContext } from "./MdTemplateParser.js";
import { FmLineContext } from "./MdTemplateParser.js";
import { FmFilenameLineContext } from "./MdTemplateParser.js";
import { FmCommentLineContext } from "./MdTemplateParser.js";
import { FmKeyLineContext } from "./MdTemplateParser.js";
import { FmValueContext } from "./MdTemplateParser.js";
import { FmInlineCommentContext } from "./MdTemplateParser.js";
import { FmCommentItemContext } from "./MdTemplateParser.js";
import { FmHintWordContext } from "./MdTemplateParser.js";
import { FmBlankLineContext } from "./MdTemplateParser.js";
import { FmOtherLineContext } from "./MdTemplateParser.js";
import { BodyContext } from "./MdTemplateParser.js";
import { BodyBlockContext } from "./MdTemplateParser.js";
import { BodyHeadingContext } from "./MdTemplateParser.js";
import { BodyHeadingItemContext } from "./MdTemplateParser.js";
import { BodyFenceContext } from "./MdTemplateParser.js";
import { BodyTableRowContext } from "./MdTemplateParser.js";
import { BodyListItemContext } from "./MdTemplateParser.js";
import { BodyHtmlCommentContext } from "./MdTemplateParser.js";
import { BodyBlankLineContext } from "./MdTemplateParser.js";
import { BodyTextLineContext } from "./MdTemplateParser.js";
import { FmInlineCommentEntryContext } from "./MdTemplateParser.js";
import { FmFilenameLineEntryContext } from "./MdTemplateParser.js";
import { BodyHeadingTextEntryContext } from "./MdTemplateParser.js";
import { TagShapedCandidateContext } from "./MdTemplateParser.js";
import { TagClosedCandidateContext } from "./MdTemplateParser.js";
import { TagUnclosedCandidateContext } from "./MdTemplateParser.js";
import { TagRuleMarkerContext } from "./MdTemplateParser.js";
import { TagBareBracketContext } from "./MdTemplateParser.js";
import { TagShapedBracketContext } from "./MdTemplateParser.js";
import { TagProseBracketContext } from "./MdTemplateParser.js";
import { TagBracketItemContext } from "./MdTemplateParser.js";
import { TagTypeEqContext } from "./MdTemplateParser.js";
import { TagHintNameContext } from "./MdTemplateParser.js";
import { TagHintPieceContext } from "./MdTemplateParser.js";
import { TagShapePieceContext } from "./MdTemplateParser.js";
import { TagWordContext } from "./MdTemplateParser.js";
import { TagFamilyEntryContext } from "./MdTemplateParser.js";
import { TagFamilyContext } from "./MdTemplateParser.js";
import { TagFreeTextContext } from "./MdTemplateParser.js";
import { FmTagEntryContext } from "./MdTemplateParser.js";
import { FmTagBodyContext } from "./MdTemplateParser.js";
import { FmPresenceTagContext } from "./MdTemplateParser.js";
import { FmFormatTagContext } from "./MdTemplateParser.js";
import { FmCaseStyleContext } from "./MdTemplateParser.js";
import { FmValueTagContext } from "./MdTemplateParser.js";
import { FmCountTagContext } from "./MdTemplateParser.js";
import { FmRangeTagContext } from "./MdTemplateParser.js";
import { FmBoundContext } from "./MdTemplateParser.js";
import { FmSignedNumberContext } from "./MdTemplateParser.js";
import { FmOrderTagContext } from "./MdTemplateParser.js";
import { FmIoTagContext } from "./MdTemplateParser.js";
import { FmFilenameTagContext } from "./MdTemplateParser.js";
import { FmConventionContext } from "./MdTemplateParser.js";
import { BodyTagEntryContext } from "./MdTemplateParser.js";
import { BodyTagBodyContext } from "./MdTemplateParser.js";
import { BodyPresenceTagContext } from "./MdTemplateParser.js";
import { BodyContentTagContext } from "./MdTemplateParser.js";


/**
 * This interface defines a complete generic visitor for a parse tree produced
 * by `MdTemplateParser`.
 *
 * @param <Result> The return type of the visit operation. Use `void` for
 * operations with no return type.
 */
export class MdTemplateParserVisitor<Result> extends AbstractParseTreeVisitor<Result> {
    /**
     * Visit a parse tree produced by `MdTemplateParser.document`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDocument?: (ctx: DocumentContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.frontmatter`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFrontmatter?: (ctx: FrontmatterContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.fmUnclosed`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFmUnclosed?: (ctx: FmUnclosedContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.fmLine`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFmLine?: (ctx: FmLineContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.fmFilenameLine`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFmFilenameLine?: (ctx: FmFilenameLineContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.fmCommentLine`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFmCommentLine?: (ctx: FmCommentLineContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.fmKeyLine`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFmKeyLine?: (ctx: FmKeyLineContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.fmValue`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFmValue?: (ctx: FmValueContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.fmInlineComment`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFmInlineComment?: (ctx: FmInlineCommentContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.fmCommentItem`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFmCommentItem?: (ctx: FmCommentItemContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.fmHintWord`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFmHintWord?: (ctx: FmHintWordContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.fmBlankLine`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFmBlankLine?: (ctx: FmBlankLineContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.fmOtherLine`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFmOtherLine?: (ctx: FmOtherLineContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.body`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBody?: (ctx: BodyContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.bodyBlock`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBodyBlock?: (ctx: BodyBlockContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.bodyHeading`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBodyHeading?: (ctx: BodyHeadingContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.bodyHeadingItem`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBodyHeadingItem?: (ctx: BodyHeadingItemContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.bodyFence`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBodyFence?: (ctx: BodyFenceContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.bodyTableRow`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBodyTableRow?: (ctx: BodyTableRowContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.bodyListItem`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBodyListItem?: (ctx: BodyListItemContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.bodyHtmlComment`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBodyHtmlComment?: (ctx: BodyHtmlCommentContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.bodyBlankLine`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBodyBlankLine?: (ctx: BodyBlankLineContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.bodyTextLine`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBodyTextLine?: (ctx: BodyTextLineContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.fmInlineCommentEntry`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFmInlineCommentEntry?: (ctx: FmInlineCommentEntryContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.fmFilenameLineEntry`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFmFilenameLineEntry?: (ctx: FmFilenameLineEntryContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.bodyHeadingTextEntry`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBodyHeadingTextEntry?: (ctx: BodyHeadingTextEntryContext) => Result;
    /**
     * Visit a parse tree produced by the `tagShapedCandidate`
     * labeled alternative in `MdTemplateParser.tagCandidate`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTagShapedCandidate?: (ctx: TagShapedCandidateContext) => Result;
    /**
     * Visit a parse tree produced by the `tagClosedCandidate`
     * labeled alternative in `MdTemplateParser.tagCandidate`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTagClosedCandidate?: (ctx: TagClosedCandidateContext) => Result;
    /**
     * Visit a parse tree produced by the `tagUnclosedCandidate`
     * labeled alternative in `MdTemplateParser.tagCandidate`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTagUnclosedCandidate?: (ctx: TagUnclosedCandidateContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.tagRuleMarker`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTagRuleMarker?: (ctx: TagRuleMarkerContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.tagBareBracket`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTagBareBracket?: (ctx: TagBareBracketContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.tagShapedBracket`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTagShapedBracket?: (ctx: TagShapedBracketContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.tagProseBracket`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTagProseBracket?: (ctx: TagProseBracketContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.tagBracketItem`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTagBracketItem?: (ctx: TagBracketItemContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.tagTypeEq`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTagTypeEq?: (ctx: TagTypeEqContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.tagHintName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTagHintName?: (ctx: TagHintNameContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.tagHintPiece`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTagHintPiece?: (ctx: TagHintPieceContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.tagShapePiece`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTagShapePiece?: (ctx: TagShapePieceContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.tagWord`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTagWord?: (ctx: TagWordContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.tagFamilyEntry`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTagFamilyEntry?: (ctx: TagFamilyEntryContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.tagFamily`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTagFamily?: (ctx: TagFamilyContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.tagFreeText`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTagFreeText?: (ctx: TagFreeTextContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.fmTagEntry`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFmTagEntry?: (ctx: FmTagEntryContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.fmTagBody`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFmTagBody?: (ctx: FmTagBodyContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.fmPresenceTag`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFmPresenceTag?: (ctx: FmPresenceTagContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.fmFormatTag`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFmFormatTag?: (ctx: FmFormatTagContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.fmCaseStyle`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFmCaseStyle?: (ctx: FmCaseStyleContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.fmValueTag`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFmValueTag?: (ctx: FmValueTagContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.fmCountTag`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFmCountTag?: (ctx: FmCountTagContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.fmRangeTag`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFmRangeTag?: (ctx: FmRangeTagContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.fmBound`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFmBound?: (ctx: FmBoundContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.fmSignedNumber`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFmSignedNumber?: (ctx: FmSignedNumberContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.fmOrderTag`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFmOrderTag?: (ctx: FmOrderTagContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.fmIoTag`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFmIoTag?: (ctx: FmIoTagContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.fmFilenameTag`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFmFilenameTag?: (ctx: FmFilenameTagContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.fmConvention`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFmConvention?: (ctx: FmConventionContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.bodyTagEntry`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBodyTagEntry?: (ctx: BodyTagEntryContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.bodyTagBody`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBodyTagBody?: (ctx: BodyTagBodyContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.bodyPresenceTag`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBodyPresenceTag?: (ctx: BodyPresenceTagContext) => Result;
    /**
     * Visit a parse tree produced by `MdTemplateParser.bodyContentTag`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBodyContentTag?: (ctx: BodyContentTagContext) => Result;
}

