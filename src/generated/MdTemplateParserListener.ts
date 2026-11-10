
import { ErrorNode, type ParseTreeListener, ParserRuleContext, TerminalNode } from "antlr4ng";


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
 * This interface defines a complete listener for a parse tree produced by
 * `MdTemplateParser`.
 */
export class MdTemplateParserListener implements ParseTreeListener {
    /**
     * Enter a parse tree produced by `MdTemplateParser.document`.
     * @param ctx the parse tree
     */
    enterDocument?: (ctx: DocumentContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.document`.
     * @param ctx the parse tree
     */
    exitDocument?: (ctx: DocumentContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.frontmatter`.
     * @param ctx the parse tree
     */
    enterFrontmatter?: (ctx: FrontmatterContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.frontmatter`.
     * @param ctx the parse tree
     */
    exitFrontmatter?: (ctx: FrontmatterContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.fmUnclosed`.
     * @param ctx the parse tree
     */
    enterFmUnclosed?: (ctx: FmUnclosedContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.fmUnclosed`.
     * @param ctx the parse tree
     */
    exitFmUnclosed?: (ctx: FmUnclosedContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.fmLine`.
     * @param ctx the parse tree
     */
    enterFmLine?: (ctx: FmLineContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.fmLine`.
     * @param ctx the parse tree
     */
    exitFmLine?: (ctx: FmLineContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.fmFilenameLine`.
     * @param ctx the parse tree
     */
    enterFmFilenameLine?: (ctx: FmFilenameLineContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.fmFilenameLine`.
     * @param ctx the parse tree
     */
    exitFmFilenameLine?: (ctx: FmFilenameLineContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.fmCommentLine`.
     * @param ctx the parse tree
     */
    enterFmCommentLine?: (ctx: FmCommentLineContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.fmCommentLine`.
     * @param ctx the parse tree
     */
    exitFmCommentLine?: (ctx: FmCommentLineContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.fmKeyLine`.
     * @param ctx the parse tree
     */
    enterFmKeyLine?: (ctx: FmKeyLineContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.fmKeyLine`.
     * @param ctx the parse tree
     */
    exitFmKeyLine?: (ctx: FmKeyLineContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.fmValue`.
     * @param ctx the parse tree
     */
    enterFmValue?: (ctx: FmValueContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.fmValue`.
     * @param ctx the parse tree
     */
    exitFmValue?: (ctx: FmValueContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.fmInlineComment`.
     * @param ctx the parse tree
     */
    enterFmInlineComment?: (ctx: FmInlineCommentContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.fmInlineComment`.
     * @param ctx the parse tree
     */
    exitFmInlineComment?: (ctx: FmInlineCommentContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.fmCommentItem`.
     * @param ctx the parse tree
     */
    enterFmCommentItem?: (ctx: FmCommentItemContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.fmCommentItem`.
     * @param ctx the parse tree
     */
    exitFmCommentItem?: (ctx: FmCommentItemContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.fmHintWord`.
     * @param ctx the parse tree
     */
    enterFmHintWord?: (ctx: FmHintWordContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.fmHintWord`.
     * @param ctx the parse tree
     */
    exitFmHintWord?: (ctx: FmHintWordContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.fmBlankLine`.
     * @param ctx the parse tree
     */
    enterFmBlankLine?: (ctx: FmBlankLineContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.fmBlankLine`.
     * @param ctx the parse tree
     */
    exitFmBlankLine?: (ctx: FmBlankLineContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.fmOtherLine`.
     * @param ctx the parse tree
     */
    enterFmOtherLine?: (ctx: FmOtherLineContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.fmOtherLine`.
     * @param ctx the parse tree
     */
    exitFmOtherLine?: (ctx: FmOtherLineContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.body`.
     * @param ctx the parse tree
     */
    enterBody?: (ctx: BodyContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.body`.
     * @param ctx the parse tree
     */
    exitBody?: (ctx: BodyContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.bodyBlock`.
     * @param ctx the parse tree
     */
    enterBodyBlock?: (ctx: BodyBlockContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.bodyBlock`.
     * @param ctx the parse tree
     */
    exitBodyBlock?: (ctx: BodyBlockContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.bodyHeading`.
     * @param ctx the parse tree
     */
    enterBodyHeading?: (ctx: BodyHeadingContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.bodyHeading`.
     * @param ctx the parse tree
     */
    exitBodyHeading?: (ctx: BodyHeadingContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.bodyHeadingItem`.
     * @param ctx the parse tree
     */
    enterBodyHeadingItem?: (ctx: BodyHeadingItemContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.bodyHeadingItem`.
     * @param ctx the parse tree
     */
    exitBodyHeadingItem?: (ctx: BodyHeadingItemContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.bodyFence`.
     * @param ctx the parse tree
     */
    enterBodyFence?: (ctx: BodyFenceContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.bodyFence`.
     * @param ctx the parse tree
     */
    exitBodyFence?: (ctx: BodyFenceContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.bodyTableRow`.
     * @param ctx the parse tree
     */
    enterBodyTableRow?: (ctx: BodyTableRowContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.bodyTableRow`.
     * @param ctx the parse tree
     */
    exitBodyTableRow?: (ctx: BodyTableRowContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.bodyListItem`.
     * @param ctx the parse tree
     */
    enterBodyListItem?: (ctx: BodyListItemContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.bodyListItem`.
     * @param ctx the parse tree
     */
    exitBodyListItem?: (ctx: BodyListItemContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.bodyHtmlComment`.
     * @param ctx the parse tree
     */
    enterBodyHtmlComment?: (ctx: BodyHtmlCommentContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.bodyHtmlComment`.
     * @param ctx the parse tree
     */
    exitBodyHtmlComment?: (ctx: BodyHtmlCommentContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.bodyBlankLine`.
     * @param ctx the parse tree
     */
    enterBodyBlankLine?: (ctx: BodyBlankLineContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.bodyBlankLine`.
     * @param ctx the parse tree
     */
    exitBodyBlankLine?: (ctx: BodyBlankLineContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.bodyTextLine`.
     * @param ctx the parse tree
     */
    enterBodyTextLine?: (ctx: BodyTextLineContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.bodyTextLine`.
     * @param ctx the parse tree
     */
    exitBodyTextLine?: (ctx: BodyTextLineContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.fmInlineCommentEntry`.
     * @param ctx the parse tree
     */
    enterFmInlineCommentEntry?: (ctx: FmInlineCommentEntryContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.fmInlineCommentEntry`.
     * @param ctx the parse tree
     */
    exitFmInlineCommentEntry?: (ctx: FmInlineCommentEntryContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.fmFilenameLineEntry`.
     * @param ctx the parse tree
     */
    enterFmFilenameLineEntry?: (ctx: FmFilenameLineEntryContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.fmFilenameLineEntry`.
     * @param ctx the parse tree
     */
    exitFmFilenameLineEntry?: (ctx: FmFilenameLineEntryContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.bodyHeadingTextEntry`.
     * @param ctx the parse tree
     */
    enterBodyHeadingTextEntry?: (ctx: BodyHeadingTextEntryContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.bodyHeadingTextEntry`.
     * @param ctx the parse tree
     */
    exitBodyHeadingTextEntry?: (ctx: BodyHeadingTextEntryContext) => void;
    /**
     * Enter a parse tree produced by the `tagShapedCandidate`
     * labeled alternative in `MdTemplateParser.tagCandidate`.
     * @param ctx the parse tree
     */
    enterTagShapedCandidate?: (ctx: TagShapedCandidateContext) => void;
    /**
     * Exit a parse tree produced by the `tagShapedCandidate`
     * labeled alternative in `MdTemplateParser.tagCandidate`.
     * @param ctx the parse tree
     */
    exitTagShapedCandidate?: (ctx: TagShapedCandidateContext) => void;
    /**
     * Enter a parse tree produced by the `tagClosedCandidate`
     * labeled alternative in `MdTemplateParser.tagCandidate`.
     * @param ctx the parse tree
     */
    enterTagClosedCandidate?: (ctx: TagClosedCandidateContext) => void;
    /**
     * Exit a parse tree produced by the `tagClosedCandidate`
     * labeled alternative in `MdTemplateParser.tagCandidate`.
     * @param ctx the parse tree
     */
    exitTagClosedCandidate?: (ctx: TagClosedCandidateContext) => void;
    /**
     * Enter a parse tree produced by the `tagUnclosedCandidate`
     * labeled alternative in `MdTemplateParser.tagCandidate`.
     * @param ctx the parse tree
     */
    enterTagUnclosedCandidate?: (ctx: TagUnclosedCandidateContext) => void;
    /**
     * Exit a parse tree produced by the `tagUnclosedCandidate`
     * labeled alternative in `MdTemplateParser.tagCandidate`.
     * @param ctx the parse tree
     */
    exitTagUnclosedCandidate?: (ctx: TagUnclosedCandidateContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.tagRuleMarker`.
     * @param ctx the parse tree
     */
    enterTagRuleMarker?: (ctx: TagRuleMarkerContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.tagRuleMarker`.
     * @param ctx the parse tree
     */
    exitTagRuleMarker?: (ctx: TagRuleMarkerContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.tagBareBracket`.
     * @param ctx the parse tree
     */
    enterTagBareBracket?: (ctx: TagBareBracketContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.tagBareBracket`.
     * @param ctx the parse tree
     */
    exitTagBareBracket?: (ctx: TagBareBracketContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.tagShapedBracket`.
     * @param ctx the parse tree
     */
    enterTagShapedBracket?: (ctx: TagShapedBracketContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.tagShapedBracket`.
     * @param ctx the parse tree
     */
    exitTagShapedBracket?: (ctx: TagShapedBracketContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.tagProseBracket`.
     * @param ctx the parse tree
     */
    enterTagProseBracket?: (ctx: TagProseBracketContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.tagProseBracket`.
     * @param ctx the parse tree
     */
    exitTagProseBracket?: (ctx: TagProseBracketContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.tagBracketItem`.
     * @param ctx the parse tree
     */
    enterTagBracketItem?: (ctx: TagBracketItemContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.tagBracketItem`.
     * @param ctx the parse tree
     */
    exitTagBracketItem?: (ctx: TagBracketItemContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.tagTypeEq`.
     * @param ctx the parse tree
     */
    enterTagTypeEq?: (ctx: TagTypeEqContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.tagTypeEq`.
     * @param ctx the parse tree
     */
    exitTagTypeEq?: (ctx: TagTypeEqContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.tagHintName`.
     * @param ctx the parse tree
     */
    enterTagHintName?: (ctx: TagHintNameContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.tagHintName`.
     * @param ctx the parse tree
     */
    exitTagHintName?: (ctx: TagHintNameContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.tagHintPiece`.
     * @param ctx the parse tree
     */
    enterTagHintPiece?: (ctx: TagHintPieceContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.tagHintPiece`.
     * @param ctx the parse tree
     */
    exitTagHintPiece?: (ctx: TagHintPieceContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.tagShapePiece`.
     * @param ctx the parse tree
     */
    enterTagShapePiece?: (ctx: TagShapePieceContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.tagShapePiece`.
     * @param ctx the parse tree
     */
    exitTagShapePiece?: (ctx: TagShapePieceContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.tagWord`.
     * @param ctx the parse tree
     */
    enterTagWord?: (ctx: TagWordContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.tagWord`.
     * @param ctx the parse tree
     */
    exitTagWord?: (ctx: TagWordContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.tagFamilyEntry`.
     * @param ctx the parse tree
     */
    enterTagFamilyEntry?: (ctx: TagFamilyEntryContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.tagFamilyEntry`.
     * @param ctx the parse tree
     */
    exitTagFamilyEntry?: (ctx: TagFamilyEntryContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.tagFamily`.
     * @param ctx the parse tree
     */
    enterTagFamily?: (ctx: TagFamilyContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.tagFamily`.
     * @param ctx the parse tree
     */
    exitTagFamily?: (ctx: TagFamilyContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.tagFreeText`.
     * @param ctx the parse tree
     */
    enterTagFreeText?: (ctx: TagFreeTextContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.tagFreeText`.
     * @param ctx the parse tree
     */
    exitTagFreeText?: (ctx: TagFreeTextContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.fmTagEntry`.
     * @param ctx the parse tree
     */
    enterFmTagEntry?: (ctx: FmTagEntryContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.fmTagEntry`.
     * @param ctx the parse tree
     */
    exitFmTagEntry?: (ctx: FmTagEntryContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.fmTagBody`.
     * @param ctx the parse tree
     */
    enterFmTagBody?: (ctx: FmTagBodyContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.fmTagBody`.
     * @param ctx the parse tree
     */
    exitFmTagBody?: (ctx: FmTagBodyContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.fmPresenceTag`.
     * @param ctx the parse tree
     */
    enterFmPresenceTag?: (ctx: FmPresenceTagContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.fmPresenceTag`.
     * @param ctx the parse tree
     */
    exitFmPresenceTag?: (ctx: FmPresenceTagContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.fmFormatTag`.
     * @param ctx the parse tree
     */
    enterFmFormatTag?: (ctx: FmFormatTagContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.fmFormatTag`.
     * @param ctx the parse tree
     */
    exitFmFormatTag?: (ctx: FmFormatTagContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.fmCaseStyle`.
     * @param ctx the parse tree
     */
    enterFmCaseStyle?: (ctx: FmCaseStyleContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.fmCaseStyle`.
     * @param ctx the parse tree
     */
    exitFmCaseStyle?: (ctx: FmCaseStyleContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.fmValueTag`.
     * @param ctx the parse tree
     */
    enterFmValueTag?: (ctx: FmValueTagContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.fmValueTag`.
     * @param ctx the parse tree
     */
    exitFmValueTag?: (ctx: FmValueTagContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.fmCountTag`.
     * @param ctx the parse tree
     */
    enterFmCountTag?: (ctx: FmCountTagContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.fmCountTag`.
     * @param ctx the parse tree
     */
    exitFmCountTag?: (ctx: FmCountTagContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.fmRangeTag`.
     * @param ctx the parse tree
     */
    enterFmRangeTag?: (ctx: FmRangeTagContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.fmRangeTag`.
     * @param ctx the parse tree
     */
    exitFmRangeTag?: (ctx: FmRangeTagContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.fmBound`.
     * @param ctx the parse tree
     */
    enterFmBound?: (ctx: FmBoundContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.fmBound`.
     * @param ctx the parse tree
     */
    exitFmBound?: (ctx: FmBoundContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.fmSignedNumber`.
     * @param ctx the parse tree
     */
    enterFmSignedNumber?: (ctx: FmSignedNumberContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.fmSignedNumber`.
     * @param ctx the parse tree
     */
    exitFmSignedNumber?: (ctx: FmSignedNumberContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.fmOrderTag`.
     * @param ctx the parse tree
     */
    enterFmOrderTag?: (ctx: FmOrderTagContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.fmOrderTag`.
     * @param ctx the parse tree
     */
    exitFmOrderTag?: (ctx: FmOrderTagContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.fmIoTag`.
     * @param ctx the parse tree
     */
    enterFmIoTag?: (ctx: FmIoTagContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.fmIoTag`.
     * @param ctx the parse tree
     */
    exitFmIoTag?: (ctx: FmIoTagContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.fmFilenameTag`.
     * @param ctx the parse tree
     */
    enterFmFilenameTag?: (ctx: FmFilenameTagContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.fmFilenameTag`.
     * @param ctx the parse tree
     */
    exitFmFilenameTag?: (ctx: FmFilenameTagContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.fmConvention`.
     * @param ctx the parse tree
     */
    enterFmConvention?: (ctx: FmConventionContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.fmConvention`.
     * @param ctx the parse tree
     */
    exitFmConvention?: (ctx: FmConventionContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.bodyTagEntry`.
     * @param ctx the parse tree
     */
    enterBodyTagEntry?: (ctx: BodyTagEntryContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.bodyTagEntry`.
     * @param ctx the parse tree
     */
    exitBodyTagEntry?: (ctx: BodyTagEntryContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.bodyTagBody`.
     * @param ctx the parse tree
     */
    enterBodyTagBody?: (ctx: BodyTagBodyContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.bodyTagBody`.
     * @param ctx the parse tree
     */
    exitBodyTagBody?: (ctx: BodyTagBodyContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.bodyPresenceTag`.
     * @param ctx the parse tree
     */
    enterBodyPresenceTag?: (ctx: BodyPresenceTagContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.bodyPresenceTag`.
     * @param ctx the parse tree
     */
    exitBodyPresenceTag?: (ctx: BodyPresenceTagContext) => void;
    /**
     * Enter a parse tree produced by `MdTemplateParser.bodyContentTag`.
     * @param ctx the parse tree
     */
    enterBodyContentTag?: (ctx: BodyContentTagContext) => void;
    /**
     * Exit a parse tree produced by `MdTemplateParser.bodyContentTag`.
     * @param ctx the parse tree
     */
    exitBodyContentTag?: (ctx: BodyContentTagContext) => void;

    visitTerminal(node: TerminalNode): void {}
    visitErrorNode(node: ErrorNode): void {}
    enterEveryRule(node: ParserRuleContext): void {}
    exitEveryRule(node: ParserRuleContext): void {}
}

