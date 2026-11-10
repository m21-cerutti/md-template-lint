
import * as antlr from "antlr4ng";
import { Token } from "antlr4ng";

import { MdTemplateParserListener } from "./MdTemplateParserListener.js";
import { MdTemplateParserVisitor } from "./MdTemplateParserVisitor.js";

// for running tests with parameters, TODO: discuss strategy for typed parameters in CI
// eslint-disable-next-line no-unused-vars
type int = number;


export class MdTemplateParser extends antlr.Parser {
    public static readonly NL = 1;
    public static readonly LBRACK = 2;
    public static readonly RBRACK = 3;
    public static readonly COLON = 4;
    public static readonly DASH = 5;
    public static readonly DOT = 6;
    public static readonly WS = 7;
    public static readonly OTHER = 8;
    public static readonly NUMBER = 9;
    public static readonly ALNUM = 10;
    public static readonly H_OPEN = 11;
    public static readonly FENCE_OPEN = 12;
    public static readonly FENCE_NL = 13;
    public static readonly FENCE_LINE = 14;
    public static readonly FENCE_CLOSE = 15;
    public static readonly BODY_TABLE_ROW = 16;
    public static readonly BODY_LIST_ITEM = 17;
    public static readonly BODY_HTML_COMMENT = 18;
    public static readonly BODY_BLANK = 19;
    public static readonly BODY_TEXT_START = 20;
    public static readonly BODY_TEXT_REST = 21;
    public static readonly FM_QUOTED = 22;
    public static readonly FM_PLAIN_TEXT = 23;
    public static readonly FM_FLOW_OPEN = 24;
    public static readonly FM_FLOW_CLOSE = 25;
    public static readonly FM_COMMENT_HASH = 26;
    public static readonly FM_OPEN = 27;
    public static readonly FM_CLOSE = 28;
    public static readonly FM_BLANK = 29;
    public static readonly FM_LINE_HASH = 30;
    public static readonly FM_KEY = 31;
    public static readonly FM_KEY_BARE = 32;
    public static readonly FM_LINE_START = 33;
    public static readonly FM_TEXT_REST = 34;
    public static readonly EQ = 35;
    public static readonly HTML_COMMENT = 36;
    public static readonly DATE_PLACEHOLDER = 37;
    public static readonly TYPE = 38;
    public static readonly RULE = 39;
    public static readonly ISO = 40;
    public static readonly URL = 41;
    public static readonly LIEN = 42;
    public static readonly PATH = 43;
    public static readonly ALIAS_MARK = 44;
    public static readonly WORD = 45;
    public static readonly UWORD = 46;
    public static readonly SNAKE_CASE_CS = 47;
    public static readonly KEBAB_CASE_CS = 48;
    public static readonly CAMEL_CASE = 49;
    public static readonly PASCAL_CASE = 50;
    public static readonly FILENAME_CS = 51;
    public static readonly CASE_CS = 52;
    public static readonly PRESENCE = 53;
    public static readonly FORMAT = 54;
    public static readonly VALUE = 55;
    public static readonly COUNT = 56;
    public static readonly RANGE = 57;
    public static readonly ORDER = 58;
    public static readonly IO = 59;
    public static readonly CONTENT = 60;
    public static readonly REQUIRED = 61;
    public static readonly OPTIONAL = 62;
    public static readonly EXIST = 63;
    public static readonly TEMPLATE_ONLY = 64;
    public static readonly ELEMENTS = 65;
    public static readonly SNAKE_CASE = 66;
    public static readonly KEBAB_CASE = 67;
    public static readonly FILENAME = 68;
    public static readonly MIN = 69;
    public static readonly MAX = 70;
    public static readonly ASCENDING = 71;
    public static readonly EXISTS = 72;
    public static readonly NON_EMPTY = 73;
    public static readonly TABLE = 74;
    public static readonly LIST = 75;
    public static readonly MIN_LINES = 76;
    public static readonly MAX_LINES = 77;
    public static readonly CONDITIONAL_ARG = 78;
    public static readonly CONSTANT_ARG = 79;
    public static readonly SCHEME_ARG = 80;
    public static readonly FREE_TEXT = 81;
    public static readonly SCHEME_TEXT = 82;
    public static readonly FB_NL = 83;
    public static readonly T_LBRACK = 84;
    public static readonly T_RBRACK = 85;
    public static readonly T_COLON = 86;
    public static readonly T_DASH = 87;
    public static readonly S_DOT = 88;
    public static readonly RULE_document = 0;
    public static readonly RULE_frontmatter = 1;
    public static readonly RULE_fmUnclosed = 2;
    public static readonly RULE_fmLine = 3;
    public static readonly RULE_fmFilenameLine = 4;
    public static readonly RULE_fmCommentLine = 5;
    public static readonly RULE_fmKeyLine = 6;
    public static readonly RULE_fmValue = 7;
    public static readonly RULE_fmInlineComment = 8;
    public static readonly RULE_fmCommentItem = 9;
    public static readonly RULE_fmHintWord = 10;
    public static readonly RULE_fmBlankLine = 11;
    public static readonly RULE_fmOtherLine = 12;
    public static readonly RULE_body = 13;
    public static readonly RULE_bodyBlock = 14;
    public static readonly RULE_bodyHeading = 15;
    public static readonly RULE_bodyHeadingItem = 16;
    public static readonly RULE_bodyFence = 17;
    public static readonly RULE_bodyTableRow = 18;
    public static readonly RULE_bodyListItem = 19;
    public static readonly RULE_bodyHtmlComment = 20;
    public static readonly RULE_bodyBlankLine = 21;
    public static readonly RULE_bodyTextLine = 22;
    public static readonly RULE_fmInlineCommentEntry = 23;
    public static readonly RULE_fmFilenameLineEntry = 24;
    public static readonly RULE_bodyHeadingTextEntry = 25;
    public static readonly RULE_tagCandidate = 26;
    public static readonly RULE_tagRuleMarker = 27;
    public static readonly RULE_tagBareBracket = 28;
    public static readonly RULE_tagShapedBracket = 29;
    public static readonly RULE_tagProseBracket = 30;
    public static readonly RULE_tagBracketItem = 31;
    public static readonly RULE_tagTypeEq = 32;
    public static readonly RULE_tagHintName = 33;
    public static readonly RULE_tagHintPiece = 34;
    public static readonly RULE_tagShapePiece = 35;
    public static readonly RULE_tagWord = 36;
    public static readonly RULE_tagFamilyEntry = 37;
    public static readonly RULE_tagFamily = 38;
    public static readonly RULE_tagFreeText = 39;
    public static readonly RULE_fmTagEntry = 40;
    public static readonly RULE_fmTagBody = 41;
    public static readonly RULE_fmPresenceTag = 42;
    public static readonly RULE_fmFormatTag = 43;
    public static readonly RULE_fmCaseStyle = 44;
    public static readonly RULE_fmValueTag = 45;
    public static readonly RULE_fmCountTag = 46;
    public static readonly RULE_fmRangeTag = 47;
    public static readonly RULE_fmBound = 48;
    public static readonly RULE_fmSignedNumber = 49;
    public static readonly RULE_fmOrderTag = 50;
    public static readonly RULE_fmIoTag = 51;
    public static readonly RULE_fmFilenameTag = 52;
    public static readonly RULE_fmConvention = 53;
    public static readonly RULE_bodyTagEntry = 54;
    public static readonly RULE_bodyTagBody = 55;
    public static readonly RULE_bodyPresenceTag = 56;
    public static readonly RULE_bodyContentTag = 57;

    public static readonly literalNames = [
        null, null, null, null, null, null, null, null, null, null, null, 
        null, null, null, null, null, null, null, null, null, null, null, 
        null, null, null, null, null, null, null, null, null, null, null, 
        null, null, "'='", null, null, "'type'", "'rule'", "'iso'", "'url'", 
        "'lien'", "'path'", null, null, null, null, null, null, null, null, 
        null, "'presence'", "'format'", "'value'", "'count'", "'range'", 
        "'order'", "'io'", "'content'", "'required'", "'optional'", "'exist'", 
        "'template-only'", "'elements'", "'snake_case'", "'kebab-case'", 
        "'filename'", "'min'", "'max'", "'ascending'", "'exists'", "'non-empty'", 
        "'table'", "'list'", "'min-lines'", "'max-lines'", "'conditional:'", 
        "'constant:'", "'scheme:'", null, null, null, null, null, null, 
        null, "'.'"
    ];

    public static readonly symbolicNames = [
        null, "NL", "LBRACK", "RBRACK", "COLON", "DASH", "DOT", "WS", "OTHER", 
        "NUMBER", "ALNUM", "H_OPEN", "FENCE_OPEN", "FENCE_NL", "FENCE_LINE", 
        "FENCE_CLOSE", "BODY_TABLE_ROW", "BODY_LIST_ITEM", "BODY_HTML_COMMENT", 
        "BODY_BLANK", "BODY_TEXT_START", "BODY_TEXT_REST", "FM_QUOTED", 
        "FM_PLAIN_TEXT", "FM_FLOW_OPEN", "FM_FLOW_CLOSE", "FM_COMMENT_HASH", 
        "FM_OPEN", "FM_CLOSE", "FM_BLANK", "FM_LINE_HASH", "FM_KEY", "FM_KEY_BARE", 
        "FM_LINE_START", "FM_TEXT_REST", "EQ", "HTML_COMMENT", "DATE_PLACEHOLDER", 
        "TYPE", "RULE", "ISO", "URL", "LIEN", "PATH", "ALIAS_MARK", "WORD", 
        "UWORD", "SNAKE_CASE_CS", "KEBAB_CASE_CS", "CAMEL_CASE", "PASCAL_CASE", 
        "FILENAME_CS", "CASE_CS", "PRESENCE", "FORMAT", "VALUE", "COUNT", 
        "RANGE", "ORDER", "IO", "CONTENT", "REQUIRED", "OPTIONAL", "EXIST", 
        "TEMPLATE_ONLY", "ELEMENTS", "SNAKE_CASE", "KEBAB_CASE", "FILENAME", 
        "MIN", "MAX", "ASCENDING", "EXISTS", "NON_EMPTY", "TABLE", "LIST", 
        "MIN_LINES", "MAX_LINES", "CONDITIONAL_ARG", "CONSTANT_ARG", "SCHEME_ARG", 
        "FREE_TEXT", "SCHEME_TEXT", "FB_NL", "T_LBRACK", "T_RBRACK", "T_COLON", 
        "T_DASH", "S_DOT"
    ];
    public static readonly ruleNames = [
        "document", "frontmatter", "fmUnclosed", "fmLine", "fmFilenameLine", 
        "fmCommentLine", "fmKeyLine", "fmValue", "fmInlineComment", "fmCommentItem", 
        "fmHintWord", "fmBlankLine", "fmOtherLine", "body", "bodyBlock", 
        "bodyHeading", "bodyHeadingItem", "bodyFence", "bodyTableRow", "bodyListItem", 
        "bodyHtmlComment", "bodyBlankLine", "bodyTextLine", "fmInlineCommentEntry", 
        "fmFilenameLineEntry", "bodyHeadingTextEntry", "tagCandidate", "tagRuleMarker", 
        "tagBareBracket", "tagShapedBracket", "tagProseBracket", "tagBracketItem", 
        "tagTypeEq", "tagHintName", "tagHintPiece", "tagShapePiece", "tagWord", 
        "tagFamilyEntry", "tagFamily", "tagFreeText", "fmTagEntry", "fmTagBody", 
        "fmPresenceTag", "fmFormatTag", "fmCaseStyle", "fmValueTag", "fmCountTag", 
        "fmRangeTag", "fmBound", "fmSignedNumber", "fmOrderTag", "fmIoTag", 
        "fmFilenameTag", "fmConvention", "bodyTagEntry", "bodyTagBody", 
        "bodyPresenceTag", "bodyContentTag",
    ];

    public get grammarFileName(): string { return "MdTemplateParser.g4"; }
    public get literalNames(): (string | null)[] { return MdTemplateParser.literalNames; }
    public get symbolicNames(): (string | null)[] { return MdTemplateParser.symbolicNames; }
    public get ruleNames(): string[] { return MdTemplateParser.ruleNames; }
    public get serializedATN(): number[] { return MdTemplateParser._serializedATN; }

    protected createFailedPredicateException(predicate?: string, message?: string): antlr.FailedPredicateException {
        return new antlr.FailedPredicateException(this, predicate, message);
    }

    public constructor(input: antlr.TokenStream) {
        super(input);
        this.interpreter = new antlr.ParserATNSimulator(this, MdTemplateParser._ATN, MdTemplateParser.decisionsToDFA, new antlr.PredictionContextCache());
    }
    public document(): DocumentContext {
        let localContext = new DocumentContext(this.context, this.state);
        this.enterRule(localContext, 0, MdTemplateParser.RULE_document);
        try {
            this.state = 126;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 0, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 116;
                this.frontmatter();
                this.state = 117;
                this.body();
                this.state = 118;
                this.match(MdTemplateParser.EOF);
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 120;
                this.fmUnclosed();
                this.state = 121;
                this.match(MdTemplateParser.EOF);
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 123;
                this.body();
                this.state = 124;
                this.match(MdTemplateParser.EOF);
                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public frontmatter(): FrontmatterContext {
        let localContext = new FrontmatterContext(this.context, this.state);
        this.enterRule(localContext, 2, MdTemplateParser.RULE_frontmatter);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 128;
            this.match(MdTemplateParser.FM_OPEN);
            this.state = 132;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 29)) & ~0x1F) === 0 && ((1 << (_la - 29)) & 31) !== 0)) {
                {
                {
                this.state = 129;
                this.fmLine();
                }
                }
                this.state = 134;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 135;
            this.match(MdTemplateParser.FM_CLOSE);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fmUnclosed(): FmUnclosedContext {
        let localContext = new FmUnclosedContext(this.context, this.state);
        this.enterRule(localContext, 4, MdTemplateParser.RULE_fmUnclosed);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 137;
            this.match(MdTemplateParser.FM_OPEN);
            this.state = 141;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 29)) & ~0x1F) === 0 && ((1 << (_la - 29)) & 31) !== 0)) {
                {
                {
                this.state = 138;
                this.fmLine();
                }
                }
                this.state = 143;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fmLine(): FmLineContext {
        let localContext = new FmLineContext(this.context, this.state);
        this.enterRule(localContext, 6, MdTemplateParser.RULE_fmLine);
        try {
            this.state = 149;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 3, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 144;
                this.fmFilenameLine();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 145;
                this.fmCommentLine();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 146;
                this.fmKeyLine();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 147;
                this.fmBlankLine();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 148;
                this.fmOtherLine();
                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fmFilenameLine(): FmFilenameLineContext {
        let localContext = new FmFilenameLineContext(this.context, this.state);
        this.enterRule(localContext, 8, MdTemplateParser.RULE_fmFilenameLine);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 151;
            this.match(MdTemplateParser.FM_LINE_HASH);
            this.state = 153;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 7) {
                {
                this.state = 152;
                this.match(MdTemplateParser.WS);
                }
            }

            this.state = 155;
            this.tagCandidate();
            this.state = 157;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 7) {
                {
                this.state = 156;
                this.match(MdTemplateParser.WS);
                }
            }

            this.state = 159;
            this.match(MdTemplateParser.NL);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fmCommentLine(): FmCommentLineContext {
        let localContext = new FmCommentLineContext(this.context, this.state);
        this.enterRule(localContext, 10, MdTemplateParser.RULE_fmCommentLine);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 161;
            this.match(MdTemplateParser.FM_LINE_HASH);
            this.state = 165;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 4294967292) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 33554431) !== 0)) {
                {
                {
                this.state = 162;
                this.fmCommentItem();
                }
                }
                this.state = 167;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 168;
            this.match(MdTemplateParser.NL);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fmKeyLine(): FmKeyLineContext {
        let localContext = new FmKeyLineContext(this.context, this.state);
        this.enterRule(localContext, 12, MdTemplateParser.RULE_fmKeyLine);
        let _la: number;
        try {
            this.state = 179;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.FM_KEY_BARE:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 170;
                this.match(MdTemplateParser.FM_KEY_BARE);
                }
                break;
            case MdTemplateParser.FM_KEY:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 171;
                this.match(MdTemplateParser.FM_KEY);
                this.state = 173;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 62914560) !== 0)) {
                    {
                    this.state = 172;
                    this.fmValue();
                    }
                }

                this.state = 176;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 26) {
                    {
                    this.state = 175;
                    this.fmInlineComment();
                    }
                }

                this.state = 178;
                this.match(MdTemplateParser.NL);
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fmValue(): FmValueContext {
        let localContext = new FmValueContext(this.context, this.state);
        this.enterRule(localContext, 14, MdTemplateParser.RULE_fmValue);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 182;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                {
                this.state = 181;
                _la = this.tokenStream.LA(1);
                if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 62914560) !== 0))) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                }
                }
                this.state = 184;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 62914560) !== 0));
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fmInlineComment(): FmInlineCommentContext {
        let localContext = new FmInlineCommentContext(this.context, this.state);
        this.enterRule(localContext, 16, MdTemplateParser.RULE_fmInlineComment);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 186;
            this.match(MdTemplateParser.FM_COMMENT_HASH);
            this.state = 190;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 4294967292) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 33554431) !== 0)) {
                {
                {
                this.state = 187;
                this.fmCommentItem();
                }
                }
                this.state = 192;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fmCommentItem(): FmCommentItemContext {
        let localContext = new FmCommentItemContext(this.context, this.state);
        this.enterRule(localContext, 18, MdTemplateParser.RULE_fmCommentItem);
        let _la: number;
        try {
            this.state = 201;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 12, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 193;
                this.tagCandidate();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 194;
                this.tagRuleMarker();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 195;
                this.tagBareBracket();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 196;
                this.tagShapedBracket();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 197;
                this.tagProseBracket();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 198;
                this.tagTypeEq();
                }
                break;
            case 7:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 199;
                this.fmHintWord();
                }
                break;
            case 8:
                this.enterOuterAlt(localContext, 8);
                {
                this.state = 200;
                _la = this.tokenStream.LA(1);
                if(_la<=0 || _la === 1) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fmHintWord(): FmHintWordContext {
        let localContext = new FmHintWordContext(this.context, this.state);
        this.enterRule(localContext, 20, MdTemplateParser.RULE_fmHintWord);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 203;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 37)) & ~0x1F) === 0 && ((1 << (_la - 37)) & 249) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fmBlankLine(): FmBlankLineContext {
        let localContext = new FmBlankLineContext(this.context, this.state);
        this.enterRule(localContext, 22, MdTemplateParser.RULE_fmBlankLine);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 205;
            this.match(MdTemplateParser.FM_BLANK);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fmOtherLine(): FmOtherLineContext {
        let localContext = new FmOtherLineContext(this.context, this.state);
        this.enterRule(localContext, 24, MdTemplateParser.RULE_fmOtherLine);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 207;
            this.match(MdTemplateParser.FM_LINE_START);
            this.state = 209;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 34) {
                {
                this.state = 208;
                this.match(MdTemplateParser.FM_TEXT_REST);
                }
            }

            this.state = 211;
            this.match(MdTemplateParser.NL);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public body(): BodyContext {
        let localContext = new BodyContext(this.context, this.state);
        this.enterRule(localContext, 26, MdTemplateParser.RULE_body);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 216;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 2037760) !== 0)) {
                {
                {
                this.state = 213;
                this.bodyBlock();
                }
                }
                this.state = 218;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public bodyBlock(): BodyBlockContext {
        let localContext = new BodyBlockContext(this.context, this.state);
        this.enterRule(localContext, 28, MdTemplateParser.RULE_bodyBlock);
        try {
            this.state = 226;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.H_OPEN:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 219;
                this.bodyHeading();
                }
                break;
            case MdTemplateParser.FENCE_OPEN:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 220;
                this.bodyFence();
                }
                break;
            case MdTemplateParser.BODY_TABLE_ROW:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 221;
                this.bodyTableRow();
                }
                break;
            case MdTemplateParser.BODY_LIST_ITEM:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 222;
                this.bodyListItem();
                }
                break;
            case MdTemplateParser.BODY_HTML_COMMENT:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 223;
                this.bodyHtmlComment();
                }
                break;
            case MdTemplateParser.BODY_BLANK:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 224;
                this.bodyBlankLine();
                }
                break;
            case MdTemplateParser.BODY_TEXT_START:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 225;
                this.bodyTextLine();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public bodyHeading(): BodyHeadingContext {
        let localContext = new BodyHeadingContext(this.context, this.state);
        this.enterRule(localContext, 30, MdTemplateParser.RULE_bodyHeading);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 228;
            this.match(MdTemplateParser.H_OPEN);
            this.state = 232;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 4294967292) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 33554431) !== 0)) {
                {
                {
                this.state = 229;
                this.bodyHeadingItem();
                }
                }
                this.state = 234;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 235;
            this.match(MdTemplateParser.NL);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public bodyHeadingItem(): BodyHeadingItemContext {
        let localContext = new BodyHeadingItemContext(this.context, this.state);
        this.enterRule(localContext, 32, MdTemplateParser.RULE_bodyHeadingItem);
        let _la: number;
        try {
            this.state = 243;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 17, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 237;
                this.tagCandidate();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 238;
                this.tagRuleMarker();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 239;
                this.tagBareBracket();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 240;
                this.tagShapedBracket();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 241;
                this.tagProseBracket();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 242;
                _la = this.tokenStream.LA(1);
                if(_la<=0 || _la === 1) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public bodyFence(): BodyFenceContext {
        let localContext = new BodyFenceContext(this.context, this.state);
        this.enterRule(localContext, 34, MdTemplateParser.RULE_bodyFence);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 245;
            this.match(MdTemplateParser.FENCE_OPEN);
            this.state = 249;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 13 || _la === 14) {
                {
                {
                this.state = 246;
                _la = this.tokenStream.LA(1);
                if(!(_la === 13 || _la === 14)) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                }
                }
                this.state = 251;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 253;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 15) {
                {
                this.state = 252;
                this.match(MdTemplateParser.FENCE_CLOSE);
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public bodyTableRow(): BodyTableRowContext {
        let localContext = new BodyTableRowContext(this.context, this.state);
        this.enterRule(localContext, 36, MdTemplateParser.RULE_bodyTableRow);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 255;
            this.match(MdTemplateParser.BODY_TABLE_ROW);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public bodyListItem(): BodyListItemContext {
        let localContext = new BodyListItemContext(this.context, this.state);
        this.enterRule(localContext, 38, MdTemplateParser.RULE_bodyListItem);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 257;
            this.match(MdTemplateParser.BODY_LIST_ITEM);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public bodyHtmlComment(): BodyHtmlCommentContext {
        let localContext = new BodyHtmlCommentContext(this.context, this.state);
        this.enterRule(localContext, 40, MdTemplateParser.RULE_bodyHtmlComment);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 259;
            this.match(MdTemplateParser.BODY_HTML_COMMENT);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public bodyBlankLine(): BodyBlankLineContext {
        let localContext = new BodyBlankLineContext(this.context, this.state);
        this.enterRule(localContext, 42, MdTemplateParser.RULE_bodyBlankLine);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 261;
            this.match(MdTemplateParser.BODY_BLANK);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public bodyTextLine(): BodyTextLineContext {
        let localContext = new BodyTextLineContext(this.context, this.state);
        this.enterRule(localContext, 44, MdTemplateParser.RULE_bodyTextLine);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 263;
            this.match(MdTemplateParser.BODY_TEXT_START);
            this.state = 265;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 21) {
                {
                this.state = 264;
                this.match(MdTemplateParser.BODY_TEXT_REST);
                }
            }

            this.state = 267;
            this.match(MdTemplateParser.NL);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fmInlineCommentEntry(): FmInlineCommentEntryContext {
        let localContext = new FmInlineCommentEntryContext(this.context, this.state);
        this.enterRule(localContext, 46, MdTemplateParser.RULE_fmInlineCommentEntry);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 272;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 4294967292) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 33554431) !== 0)) {
                {
                {
                this.state = 269;
                this.fmCommentItem();
                }
                }
                this.state = 274;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 275;
            this.match(MdTemplateParser.EOF);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fmFilenameLineEntry(): FmFilenameLineEntryContext {
        let localContext = new FmFilenameLineEntryContext(this.context, this.state);
        this.enterRule(localContext, 48, MdTemplateParser.RULE_fmFilenameLineEntry);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 277;
            this.fmFilenameLine();
            this.state = 278;
            this.match(MdTemplateParser.EOF);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public bodyHeadingTextEntry(): BodyHeadingTextEntryContext {
        let localContext = new BodyHeadingTextEntryContext(this.context, this.state);
        this.enterRule(localContext, 50, MdTemplateParser.RULE_bodyHeadingTextEntry);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 283;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 4294967292) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 33554431) !== 0)) {
                {
                {
                this.state = 280;
                this.bodyHeadingItem();
                }
                }
                this.state = 285;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 286;
            this.match(MdTemplateParser.EOF);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public tagCandidate(): TagCandidateContext {
        let localContext = new TagCandidateContext(this.context, this.state);
        this.enterRule(localContext, 52, MdTemplateParser.RULE_tagCandidate);
        let _la: number;
        try {
            let alternative: number;
            this.state = 319;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 26, this.context) ) {
            case 1:
                localContext = new TagShapedCandidateContext(localContext);
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 288;
                this.match(MdTemplateParser.LBRACK);
                this.state = 289;
                this.tagWord();
                this.state = 290;
                this.match(MdTemplateParser.COLON);
                this.state = 294;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 1584) !== 0) || ((((_la - 37)) & ~0x1F) === 0 && ((1 << (_la - 37)) & 383) !== 0)) {
                    {
                    {
                    this.state = 291;
                    this.tagShapePiece();
                    }
                    }
                    this.state = 296;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                this.state = 297;
                this.match(MdTemplateParser.RBRACK);
                }
                break;
            case 2:
                localContext = new TagClosedCandidateContext(localContext);
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 299;
                this.match(MdTemplateParser.LBRACK);
                this.state = 300;
                this.tagWord();
                this.state = 301;
                this.match(MdTemplateParser.COLON);
                this.state = 305;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 4294967284) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 33554431) !== 0)) {
                    {
                    {
                    this.state = 302;
                    this.tagBracketItem();
                    }
                    }
                    this.state = 307;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                this.state = 308;
                this.match(MdTemplateParser.RBRACK);
                }
                break;
            case 3:
                localContext = new TagUnclosedCandidateContext(localContext);
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 310;
                this.match(MdTemplateParser.LBRACK);
                this.state = 311;
                this.tagWord();
                this.state = 312;
                this.match(MdTemplateParser.COLON);
                this.state = 316;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 25, this.context);
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                        {
                        this.state = 313;
                        this.tagBracketItem();
                        }
                        }
                    }
                    this.state = 318;
                    this.errorHandler.sync(this);
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 25, this.context);
                }
                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public tagRuleMarker(): TagRuleMarkerContext {
        let localContext = new TagRuleMarkerContext(this.context, this.state);
        this.enterRule(localContext, 54, MdTemplateParser.RULE_tagRuleMarker);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 321;
            this.match(MdTemplateParser.LBRACK);
            this.state = 322;
            this.match(MdTemplateParser.RULE);
            this.state = 323;
            this.match(MdTemplateParser.RBRACK);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public tagBareBracket(): TagBareBracketContext {
        let localContext = new TagBareBracketContext(this.context, this.state);
        this.enterRule(localContext, 56, MdTemplateParser.RULE_tagBareBracket);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 325;
            this.match(MdTemplateParser.LBRACK);
            this.state = 326;
            this.tagHintName();
            this.state = 327;
            this.match(MdTemplateParser.RBRACK);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public tagShapedBracket(): TagShapedBracketContext {
        let localContext = new TagShapedBracketContext(this.context, this.state);
        this.enterRule(localContext, 58, MdTemplateParser.RULE_tagShapedBracket);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 329;
            this.match(MdTemplateParser.LBRACK);
            this.state = 331;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                {
                this.state = 330;
                this.tagShapePiece();
                }
                }
                this.state = 333;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 1584) !== 0) || ((((_la - 37)) & ~0x1F) === 0 && ((1 << (_la - 37)) & 383) !== 0));
            this.state = 335;
            this.match(MdTemplateParser.RBRACK);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public tagProseBracket(): TagProseBracketContext {
        let localContext = new TagProseBracketContext(this.context, this.state);
        this.enterRule(localContext, 60, MdTemplateParser.RULE_tagProseBracket);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 337;
            this.match(MdTemplateParser.LBRACK);
            this.state = 341;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 4294967284) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 33554431) !== 0)) {
                {
                {
                this.state = 338;
                this.tagBracketItem();
                }
                }
                this.state = 343;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 344;
            this.match(MdTemplateParser.RBRACK);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public tagBracketItem(): TagBracketItemContext {
        let localContext = new TagBracketItemContext(this.context, this.state);
        this.enterRule(localContext, 62, MdTemplateParser.RULE_tagBracketItem);
        let _la: number;
        try {
            this.state = 348;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 29, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 346;
                this.tagTypeEq();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 347;
                _la = this.tokenStream.LA(1);
                if(_la<=0 || _la === 1 || _la === 3) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public tagTypeEq(): TagTypeEqContext {
        let localContext = new TagTypeEqContext(this.context, this.state);
        this.enterRule(localContext, 64, MdTemplateParser.RULE_tagTypeEq);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 350;
            this.match(MdTemplateParser.TYPE);
            this.state = 352;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 7) {
                {
                this.state = 351;
                this.match(MdTemplateParser.WS);
                }
            }

            this.state = 354;
            this.match(MdTemplateParser.EQ);
            this.state = 356;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 7) {
                {
                this.state = 355;
                this.match(MdTemplateParser.WS);
                }
            }

            this.state = 358;
            this.tagHintName();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public tagHintName(): TagHintNameContext {
        let localContext = new TagHintNameContext(this.context, this.state);
        this.enterRule(localContext, 66, MdTemplateParser.RULE_tagHintName);
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 361;
            this.errorHandler.sync(this);
            alternative = 1;
            do {
                switch (alternative) {
                case 1:
                    {
                    {
                    this.state = 360;
                    this.tagHintPiece();
                    }
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                this.state = 363;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 32, this.context);
            } while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public tagHintPiece(): TagHintPieceContext {
        let localContext = new TagHintPieceContext(this.context, this.state);
        this.enterRule(localContext, 68, MdTemplateParser.RULE_tagHintPiece);
        try {
            this.state = 368;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.NUMBER:
            case MdTemplateParser.ALNUM:
            case MdTemplateParser.DATE_PLACEHOLDER:
            case MdTemplateParser.TYPE:
            case MdTemplateParser.RULE:
            case MdTemplateParser.ISO:
            case MdTemplateParser.URL:
            case MdTemplateParser.LIEN:
            case MdTemplateParser.PATH:
            case MdTemplateParser.WORD:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 365;
                this.tagWord();
                }
                break;
            case MdTemplateParser.UWORD:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 366;
                this.match(MdTemplateParser.UWORD);
                }
                break;
            case MdTemplateParser.DASH:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 367;
                this.match(MdTemplateParser.DASH);
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public tagShapePiece(): TagShapePieceContext {
        let localContext = new TagShapePieceContext(this.context, this.state);
        this.enterRule(localContext, 70, MdTemplateParser.RULE_tagShapePiece);
        try {
            this.state = 373;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.NUMBER:
            case MdTemplateParser.ALNUM:
            case MdTemplateParser.DATE_PLACEHOLDER:
            case MdTemplateParser.TYPE:
            case MdTemplateParser.RULE:
            case MdTemplateParser.ISO:
            case MdTemplateParser.URL:
            case MdTemplateParser.LIEN:
            case MdTemplateParser.PATH:
            case MdTemplateParser.WORD:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 370;
                this.tagWord();
                }
                break;
            case MdTemplateParser.DASH:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 371;
                this.match(MdTemplateParser.DASH);
                }
                break;
            case MdTemplateParser.COLON:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 372;
                this.match(MdTemplateParser.COLON);
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public tagWord(): TagWordContext {
        let localContext = new TagWordContext(this.context, this.state);
        this.enterRule(localContext, 72, MdTemplateParser.RULE_tagWord);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 375;
            _la = this.tokenStream.LA(1);
            if(!(_la === 9 || _la === 10 || ((((_la - 37)) & ~0x1F) === 0 && ((1 << (_la - 37)) & 383) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public tagFamilyEntry(): TagFamilyEntryContext {
        let localContext = new TagFamilyEntryContext(this.context, this.state);
        this.enterRule(localContext, 74, MdTemplateParser.RULE_tagFamilyEntry);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 377;
            this.match(MdTemplateParser.LBRACK);
            this.state = 378;
            this.tagFamily();
            this.state = 379;
            this.match(MdTemplateParser.COLON);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public tagFamily(): TagFamilyContext {
        let localContext = new TagFamilyContext(this.context, this.state);
        this.enterRule(localContext, 76, MdTemplateParser.RULE_tagFamily);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 381;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 51)) & ~0x1F) === 0 && ((1 << (_la - 51)) & 1021) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public tagFreeText(): TagFreeTextContext {
        let localContext = new TagFreeTextContext(this.context, this.state);
        this.enterRule(localContext, 78, MdTemplateParser.RULE_tagFreeText);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 384;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 81) {
                {
                this.state = 383;
                this.match(MdTemplateParser.FREE_TEXT);
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fmTagEntry(): FmTagEntryContext {
        let localContext = new FmTagEntryContext(this.context, this.state);
        this.enterRule(localContext, 80, MdTemplateParser.RULE_fmTagEntry);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 386;
            this.match(MdTemplateParser.LBRACK);
            this.state = 387;
            this.fmTagBody();
            this.state = 388;
            this.match(MdTemplateParser.RBRACK);
            this.state = 389;
            this.match(MdTemplateParser.EOF);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fmTagBody(): FmTagBodyContext {
        let localContext = new FmTagBodyContext(this.context, this.state);
        this.enterRule(localContext, 82, MdTemplateParser.RULE_fmTagBody);
        try {
            this.state = 399;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.PRESENCE:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 391;
                this.fmPresenceTag();
                }
                break;
            case MdTemplateParser.FORMAT:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 392;
                this.fmFormatTag();
                }
                break;
            case MdTemplateParser.VALUE:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 393;
                this.fmValueTag();
                }
                break;
            case MdTemplateParser.COUNT:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 394;
                this.fmCountTag();
                }
                break;
            case MdTemplateParser.RANGE:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 395;
                this.fmRangeTag();
                }
                break;
            case MdTemplateParser.ORDER:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 396;
                this.fmOrderTag();
                }
                break;
            case MdTemplateParser.IO:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 397;
                this.fmIoTag();
                }
                break;
            case MdTemplateParser.FILENAME_CS:
                this.enterOuterAlt(localContext, 8);
                {
                this.state = 398;
                this.fmFilenameTag();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fmPresenceTag(): FmPresenceTagContext {
        let localContext = new FmPresenceTagContext(this.context, this.state);
        this.enterRule(localContext, 84, MdTemplateParser.RULE_fmPresenceTag);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 401;
            this.match(MdTemplateParser.PRESENCE);
            this.state = 402;
            this.match(MdTemplateParser.COLON);
            this.state = 407;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.REQUIRED:
                {
                this.state = 403;
                this.match(MdTemplateParser.REQUIRED);
                }
                break;
            case MdTemplateParser.OPTIONAL:
                {
                this.state = 404;
                this.match(MdTemplateParser.OPTIONAL);
                }
                break;
            case MdTemplateParser.CONDITIONAL_ARG:
                {
                this.state = 405;
                this.match(MdTemplateParser.CONDITIONAL_ARG);
                this.state = 406;
                this.tagFreeText();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fmFormatTag(): FmFormatTagContext {
        let localContext = new FmFormatTagContext(this.context, this.state);
        this.enterRule(localContext, 86, MdTemplateParser.RULE_fmFormatTag);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 409;
            this.match(MdTemplateParser.FORMAT);
            this.state = 410;
            this.match(MdTemplateParser.COLON);
            this.state = 419;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.CONSTANT_ARG:
                {
                this.state = 411;
                this.match(MdTemplateParser.CONSTANT_ARG);
                this.state = 412;
                this.tagFreeText();
                }
                break;
            case MdTemplateParser.SNAKE_CASE_CS:
            case MdTemplateParser.KEBAB_CASE_CS:
            case MdTemplateParser.SNAKE_CASE:
            case MdTemplateParser.KEBAB_CASE:
                {
                this.state = 413;
                this.fmCaseStyle();
                }
                break;
            case MdTemplateParser.ELEMENTS:
                {
                this.state = 414;
                this.match(MdTemplateParser.ELEMENTS);
                this.state = 415;
                this.match(MdTemplateParser.COLON);
                this.state = 416;
                this.fmCaseStyle();
                }
                break;
            case MdTemplateParser.SCHEME_ARG:
                {
                this.state = 417;
                this.match(MdTemplateParser.SCHEME_ARG);
                this.state = 418;
                this.match(MdTemplateParser.SCHEME_TEXT);
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fmCaseStyle(): FmCaseStyleContext {
        let localContext = new FmCaseStyleContext(this.context, this.state);
        this.enterRule(localContext, 88, MdTemplateParser.RULE_fmCaseStyle);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 421;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 47)) & ~0x1F) === 0 && ((1 << (_la - 47)) & 1572867) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fmValueTag(): FmValueTagContext {
        let localContext = new FmValueTagContext(this.context, this.state);
        this.enterRule(localContext, 90, MdTemplateParser.RULE_fmValueTag);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 423;
            this.match(MdTemplateParser.VALUE);
            this.state = 424;
            this.match(MdTemplateParser.COLON);
            this.state = 425;
            _la = this.tokenStream.LA(1);
            if(!(_la === 51 || _la === 68)) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fmCountTag(): FmCountTagContext {
        let localContext = new FmCountTagContext(this.context, this.state);
        this.enterRule(localContext, 92, MdTemplateParser.RULE_fmCountTag);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 427;
            this.match(MdTemplateParser.COUNT);
            this.state = 428;
            this.match(MdTemplateParser.COLON);
            this.state = 429;
            this.fmBound();
            this.state = 430;
            this.match(MdTemplateParser.COLON);
            this.state = 431;
            this.match(MdTemplateParser.NUMBER);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fmRangeTag(): FmRangeTagContext {
        let localContext = new FmRangeTagContext(this.context, this.state);
        this.enterRule(localContext, 94, MdTemplateParser.RULE_fmRangeTag);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 433;
            this.match(MdTemplateParser.RANGE);
            this.state = 434;
            this.match(MdTemplateParser.COLON);
            this.state = 435;
            this.fmBound();
            this.state = 436;
            this.match(MdTemplateParser.COLON);
            this.state = 437;
            this.fmSignedNumber();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fmBound(): FmBoundContext {
        let localContext = new FmBoundContext(this.context, this.state);
        this.enterRule(localContext, 96, MdTemplateParser.RULE_fmBound);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 439;
            _la = this.tokenStream.LA(1);
            if(!(_la === 69 || _la === 70)) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fmSignedNumber(): FmSignedNumberContext {
        let localContext = new FmSignedNumberContext(this.context, this.state);
        this.enterRule(localContext, 98, MdTemplateParser.RULE_fmSignedNumber);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 442;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 5) {
                {
                this.state = 441;
                this.match(MdTemplateParser.DASH);
                }
            }

            this.state = 444;
            this.match(MdTemplateParser.NUMBER);
            this.state = 447;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 6) {
                {
                this.state = 445;
                this.match(MdTemplateParser.DOT);
                this.state = 446;
                this.match(MdTemplateParser.NUMBER);
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fmOrderTag(): FmOrderTagContext {
        let localContext = new FmOrderTagContext(this.context, this.state);
        this.enterRule(localContext, 100, MdTemplateParser.RULE_fmOrderTag);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 449;
            this.match(MdTemplateParser.ORDER);
            this.state = 450;
            this.match(MdTemplateParser.COLON);
            this.state = 451;
            this.match(MdTemplateParser.ASCENDING);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fmIoTag(): FmIoTagContext {
        let localContext = new FmIoTagContext(this.context, this.state);
        this.enterRule(localContext, 102, MdTemplateParser.RULE_fmIoTag);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 453;
            this.match(MdTemplateParser.IO);
            this.state = 454;
            this.match(MdTemplateParser.COLON);
            this.state = 455;
            this.match(MdTemplateParser.EXISTS);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fmFilenameTag(): FmFilenameTagContext {
        let localContext = new FmFilenameTagContext(this.context, this.state);
        this.enterRule(localContext, 104, MdTemplateParser.RULE_fmFilenameTag);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 457;
            this.match(MdTemplateParser.FILENAME_CS);
            this.state = 458;
            this.match(MdTemplateParser.COLON);
            this.state = 459;
            this.match(MdTemplateParser.CASE_CS);
            this.state = 460;
            this.match(MdTemplateParser.COLON);
            this.state = 461;
            this.fmConvention();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fmConvention(): FmConventionContext {
        let localContext = new FmConventionContext(this.context, this.state);
        this.enterRule(localContext, 106, MdTemplateParser.RULE_fmConvention);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 463;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 47)) & ~0x1F) === 0 && ((1 << (_la - 47)) & 15) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public bodyTagEntry(): BodyTagEntryContext {
        let localContext = new BodyTagEntryContext(this.context, this.state);
        this.enterRule(localContext, 108, MdTemplateParser.RULE_bodyTagEntry);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 465;
            this.match(MdTemplateParser.LBRACK);
            this.state = 466;
            this.bodyTagBody();
            this.state = 467;
            this.match(MdTemplateParser.RBRACK);
            this.state = 468;
            this.match(MdTemplateParser.EOF);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public bodyTagBody(): BodyTagBodyContext {
        let localContext = new BodyTagBodyContext(this.context, this.state);
        this.enterRule(localContext, 110, MdTemplateParser.RULE_bodyTagBody);
        try {
            this.state = 472;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.PRESENCE:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 470;
                this.bodyPresenceTag();
                }
                break;
            case MdTemplateParser.CONTENT:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 471;
                this.bodyContentTag();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public bodyPresenceTag(): BodyPresenceTagContext {
        let localContext = new BodyPresenceTagContext(this.context, this.state);
        this.enterRule(localContext, 112, MdTemplateParser.RULE_bodyPresenceTag);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 474;
            this.match(MdTemplateParser.PRESENCE);
            this.state = 475;
            this.match(MdTemplateParser.COLON);
            this.state = 482;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.REQUIRED:
                {
                this.state = 476;
                this.match(MdTemplateParser.REQUIRED);
                }
                break;
            case MdTemplateParser.OPTIONAL:
                {
                this.state = 477;
                this.match(MdTemplateParser.OPTIONAL);
                }
                break;
            case MdTemplateParser.EXIST:
                {
                this.state = 478;
                this.match(MdTemplateParser.EXIST);
                }
                break;
            case MdTemplateParser.TEMPLATE_ONLY:
                {
                this.state = 479;
                this.match(MdTemplateParser.TEMPLATE_ONLY);
                }
                break;
            case MdTemplateParser.CONDITIONAL_ARG:
                {
                this.state = 480;
                this.match(MdTemplateParser.CONDITIONAL_ARG);
                this.state = 481;
                this.tagFreeText();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public bodyContentTag(): BodyContentTagContext {
        let localContext = new BodyContentTagContext(this.context, this.state);
        this.enterRule(localContext, 114, MdTemplateParser.RULE_bodyContentTag);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 484;
            this.match(MdTemplateParser.CONTENT);
            this.state = 485;
            this.match(MdTemplateParser.COLON);
            this.state = 495;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.NON_EMPTY:
                {
                this.state = 486;
                this.match(MdTemplateParser.NON_EMPTY);
                }
                break;
            case MdTemplateParser.TABLE:
                {
                this.state = 487;
                this.match(MdTemplateParser.TABLE);
                }
                break;
            case MdTemplateParser.LIST:
                {
                this.state = 488;
                this.match(MdTemplateParser.LIST);
                }
                break;
            case MdTemplateParser.MIN_LINES:
                {
                this.state = 489;
                this.match(MdTemplateParser.MIN_LINES);
                this.state = 490;
                this.match(MdTemplateParser.COLON);
                this.state = 491;
                this.match(MdTemplateParser.NUMBER);
                }
                break;
            case MdTemplateParser.MAX_LINES:
                {
                this.state = 492;
                this.match(MdTemplateParser.MAX_LINES);
                this.state = 493;
                this.match(MdTemplateParser.COLON);
                this.state = 494;
                this.match(MdTemplateParser.NUMBER);
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }

    public static readonly _serializedATN: number[] = [
        4,1,88,498,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,7,
        6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,13,7,13,
        2,14,7,14,2,15,7,15,2,16,7,16,2,17,7,17,2,18,7,18,2,19,7,19,2,20,
        7,20,2,21,7,21,2,22,7,22,2,23,7,23,2,24,7,24,2,25,7,25,2,26,7,26,
        2,27,7,27,2,28,7,28,2,29,7,29,2,30,7,30,2,31,7,31,2,32,7,32,2,33,
        7,33,2,34,7,34,2,35,7,35,2,36,7,36,2,37,7,37,2,38,7,38,2,39,7,39,
        2,40,7,40,2,41,7,41,2,42,7,42,2,43,7,43,2,44,7,44,2,45,7,45,2,46,
        7,46,2,47,7,47,2,48,7,48,2,49,7,49,2,50,7,50,2,51,7,51,2,52,7,52,
        2,53,7,53,2,54,7,54,2,55,7,55,2,56,7,56,2,57,7,57,1,0,1,0,1,0,1,
        0,1,0,1,0,1,0,1,0,1,0,1,0,3,0,127,8,0,1,1,1,1,5,1,131,8,1,10,1,12,
        1,134,9,1,1,1,1,1,1,2,1,2,5,2,140,8,2,10,2,12,2,143,9,2,1,3,1,3,
        1,3,1,3,1,3,3,3,150,8,3,1,4,1,4,3,4,154,8,4,1,4,1,4,3,4,158,8,4,
        1,4,1,4,1,5,1,5,5,5,164,8,5,10,5,12,5,167,9,5,1,5,1,5,1,6,1,6,1,
        6,3,6,174,8,6,1,6,3,6,177,8,6,1,6,3,6,180,8,6,1,7,4,7,183,8,7,11,
        7,12,7,184,1,8,1,8,5,8,189,8,8,10,8,12,8,192,9,8,1,9,1,9,1,9,1,9,
        1,9,1,9,1,9,1,9,3,9,202,8,9,1,10,1,10,1,11,1,11,1,12,1,12,3,12,210,
        8,12,1,12,1,12,1,13,5,13,215,8,13,10,13,12,13,218,9,13,1,14,1,14,
        1,14,1,14,1,14,1,14,1,14,3,14,227,8,14,1,15,1,15,5,15,231,8,15,10,
        15,12,15,234,9,15,1,15,1,15,1,16,1,16,1,16,1,16,1,16,1,16,3,16,244,
        8,16,1,17,1,17,5,17,248,8,17,10,17,12,17,251,9,17,1,17,3,17,254,
        8,17,1,18,1,18,1,19,1,19,1,20,1,20,1,21,1,21,1,22,1,22,3,22,266,
        8,22,1,22,1,22,1,23,5,23,271,8,23,10,23,12,23,274,9,23,1,23,1,23,
        1,24,1,24,1,24,1,25,5,25,282,8,25,10,25,12,25,285,9,25,1,25,1,25,
        1,26,1,26,1,26,1,26,5,26,293,8,26,10,26,12,26,296,9,26,1,26,1,26,
        1,26,1,26,1,26,1,26,5,26,304,8,26,10,26,12,26,307,9,26,1,26,1,26,
        1,26,1,26,1,26,1,26,5,26,315,8,26,10,26,12,26,318,9,26,3,26,320,
        8,26,1,27,1,27,1,27,1,27,1,28,1,28,1,28,1,28,1,29,1,29,4,29,332,
        8,29,11,29,12,29,333,1,29,1,29,1,30,1,30,5,30,340,8,30,10,30,12,
        30,343,9,30,1,30,1,30,1,31,1,31,3,31,349,8,31,1,32,1,32,3,32,353,
        8,32,1,32,1,32,3,32,357,8,32,1,32,1,32,1,33,4,33,362,8,33,11,33,
        12,33,363,1,34,1,34,1,34,3,34,369,8,34,1,35,1,35,1,35,3,35,374,8,
        35,1,36,1,36,1,37,1,37,1,37,1,37,1,38,1,38,1,39,3,39,385,8,39,1,
        40,1,40,1,40,1,40,1,40,1,41,1,41,1,41,1,41,1,41,1,41,1,41,1,41,3,
        41,400,8,41,1,42,1,42,1,42,1,42,1,42,1,42,3,42,408,8,42,1,43,1,43,
        1,43,1,43,1,43,1,43,1,43,1,43,1,43,1,43,3,43,420,8,43,1,44,1,44,
        1,45,1,45,1,45,1,45,1,46,1,46,1,46,1,46,1,46,1,46,1,47,1,47,1,47,
        1,47,1,47,1,47,1,48,1,48,1,49,3,49,443,8,49,1,49,1,49,1,49,3,49,
        448,8,49,1,50,1,50,1,50,1,50,1,51,1,51,1,51,1,51,1,52,1,52,1,52,
        1,52,1,52,1,52,1,53,1,53,1,54,1,54,1,54,1,54,1,54,1,55,1,55,3,55,
        473,8,55,1,56,1,56,1,56,1,56,1,56,1,56,1,56,1,56,3,56,483,8,56,1,
        57,1,57,1,57,1,57,1,57,1,57,1,57,1,57,1,57,1,57,1,57,3,57,496,8,
        57,1,57,0,0,58,0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,
        36,38,40,42,44,46,48,50,52,54,56,58,60,62,64,66,68,70,72,74,76,78,
        80,82,84,86,88,90,92,94,96,98,100,102,104,106,108,110,112,114,0,
        11,1,0,22,25,1,0,1,1,2,0,37,37,40,44,1,0,13,14,2,0,1,1,3,3,3,0,9,
        10,37,43,45,45,2,0,51,51,53,60,2,0,47,48,66,67,2,0,51,51,68,68,1,
        0,69,70,1,0,47,50,520,0,126,1,0,0,0,2,128,1,0,0,0,4,137,1,0,0,0,
        6,149,1,0,0,0,8,151,1,0,0,0,10,161,1,0,0,0,12,179,1,0,0,0,14,182,
        1,0,0,0,16,186,1,0,0,0,18,201,1,0,0,0,20,203,1,0,0,0,22,205,1,0,
        0,0,24,207,1,0,0,0,26,216,1,0,0,0,28,226,1,0,0,0,30,228,1,0,0,0,
        32,243,1,0,0,0,34,245,1,0,0,0,36,255,1,0,0,0,38,257,1,0,0,0,40,259,
        1,0,0,0,42,261,1,0,0,0,44,263,1,0,0,0,46,272,1,0,0,0,48,277,1,0,
        0,0,50,283,1,0,0,0,52,319,1,0,0,0,54,321,1,0,0,0,56,325,1,0,0,0,
        58,329,1,0,0,0,60,337,1,0,0,0,62,348,1,0,0,0,64,350,1,0,0,0,66,361,
        1,0,0,0,68,368,1,0,0,0,70,373,1,0,0,0,72,375,1,0,0,0,74,377,1,0,
        0,0,76,381,1,0,0,0,78,384,1,0,0,0,80,386,1,0,0,0,82,399,1,0,0,0,
        84,401,1,0,0,0,86,409,1,0,0,0,88,421,1,0,0,0,90,423,1,0,0,0,92,427,
        1,0,0,0,94,433,1,0,0,0,96,439,1,0,0,0,98,442,1,0,0,0,100,449,1,0,
        0,0,102,453,1,0,0,0,104,457,1,0,0,0,106,463,1,0,0,0,108,465,1,0,
        0,0,110,472,1,0,0,0,112,474,1,0,0,0,114,484,1,0,0,0,116,117,3,2,
        1,0,117,118,3,26,13,0,118,119,5,0,0,1,119,127,1,0,0,0,120,121,3,
        4,2,0,121,122,5,0,0,1,122,127,1,0,0,0,123,124,3,26,13,0,124,125,
        5,0,0,1,125,127,1,0,0,0,126,116,1,0,0,0,126,120,1,0,0,0,126,123,
        1,0,0,0,127,1,1,0,0,0,128,132,5,27,0,0,129,131,3,6,3,0,130,129,1,
        0,0,0,131,134,1,0,0,0,132,130,1,0,0,0,132,133,1,0,0,0,133,135,1,
        0,0,0,134,132,1,0,0,0,135,136,5,28,0,0,136,3,1,0,0,0,137,141,5,27,
        0,0,138,140,3,6,3,0,139,138,1,0,0,0,140,143,1,0,0,0,141,139,1,0,
        0,0,141,142,1,0,0,0,142,5,1,0,0,0,143,141,1,0,0,0,144,150,3,8,4,
        0,145,150,3,10,5,0,146,150,3,12,6,0,147,150,3,22,11,0,148,150,3,
        24,12,0,149,144,1,0,0,0,149,145,1,0,0,0,149,146,1,0,0,0,149,147,
        1,0,0,0,149,148,1,0,0,0,150,7,1,0,0,0,151,153,5,30,0,0,152,154,5,
        7,0,0,153,152,1,0,0,0,153,154,1,0,0,0,154,155,1,0,0,0,155,157,3,
        52,26,0,156,158,5,7,0,0,157,156,1,0,0,0,157,158,1,0,0,0,158,159,
        1,0,0,0,159,160,5,1,0,0,160,9,1,0,0,0,161,165,5,30,0,0,162,164,3,
        18,9,0,163,162,1,0,0,0,164,167,1,0,0,0,165,163,1,0,0,0,165,166,1,
        0,0,0,166,168,1,0,0,0,167,165,1,0,0,0,168,169,5,1,0,0,169,11,1,0,
        0,0,170,180,5,32,0,0,171,173,5,31,0,0,172,174,3,14,7,0,173,172,1,
        0,0,0,173,174,1,0,0,0,174,176,1,0,0,0,175,177,3,16,8,0,176,175,1,
        0,0,0,176,177,1,0,0,0,177,178,1,0,0,0,178,180,5,1,0,0,179,170,1,
        0,0,0,179,171,1,0,0,0,180,13,1,0,0,0,181,183,7,0,0,0,182,181,1,0,
        0,0,183,184,1,0,0,0,184,182,1,0,0,0,184,185,1,0,0,0,185,15,1,0,0,
        0,186,190,5,26,0,0,187,189,3,18,9,0,188,187,1,0,0,0,189,192,1,0,
        0,0,190,188,1,0,0,0,190,191,1,0,0,0,191,17,1,0,0,0,192,190,1,0,0,
        0,193,202,3,52,26,0,194,202,3,54,27,0,195,202,3,56,28,0,196,202,
        3,58,29,0,197,202,3,60,30,0,198,202,3,64,32,0,199,202,3,20,10,0,
        200,202,8,1,0,0,201,193,1,0,0,0,201,194,1,0,0,0,201,195,1,0,0,0,
        201,196,1,0,0,0,201,197,1,0,0,0,201,198,1,0,0,0,201,199,1,0,0,0,
        201,200,1,0,0,0,202,19,1,0,0,0,203,204,7,2,0,0,204,21,1,0,0,0,205,
        206,5,29,0,0,206,23,1,0,0,0,207,209,5,33,0,0,208,210,5,34,0,0,209,
        208,1,0,0,0,209,210,1,0,0,0,210,211,1,0,0,0,211,212,5,1,0,0,212,
        25,1,0,0,0,213,215,3,28,14,0,214,213,1,0,0,0,215,218,1,0,0,0,216,
        214,1,0,0,0,216,217,1,0,0,0,217,27,1,0,0,0,218,216,1,0,0,0,219,227,
        3,30,15,0,220,227,3,34,17,0,221,227,3,36,18,0,222,227,3,38,19,0,
        223,227,3,40,20,0,224,227,3,42,21,0,225,227,3,44,22,0,226,219,1,
        0,0,0,226,220,1,0,0,0,226,221,1,0,0,0,226,222,1,0,0,0,226,223,1,
        0,0,0,226,224,1,0,0,0,226,225,1,0,0,0,227,29,1,0,0,0,228,232,5,11,
        0,0,229,231,3,32,16,0,230,229,1,0,0,0,231,234,1,0,0,0,232,230,1,
        0,0,0,232,233,1,0,0,0,233,235,1,0,0,0,234,232,1,0,0,0,235,236,5,
        1,0,0,236,31,1,0,0,0,237,244,3,52,26,0,238,244,3,54,27,0,239,244,
        3,56,28,0,240,244,3,58,29,0,241,244,3,60,30,0,242,244,8,1,0,0,243,
        237,1,0,0,0,243,238,1,0,0,0,243,239,1,0,0,0,243,240,1,0,0,0,243,
        241,1,0,0,0,243,242,1,0,0,0,244,33,1,0,0,0,245,249,5,12,0,0,246,
        248,7,3,0,0,247,246,1,0,0,0,248,251,1,0,0,0,249,247,1,0,0,0,249,
        250,1,0,0,0,250,253,1,0,0,0,251,249,1,0,0,0,252,254,5,15,0,0,253,
        252,1,0,0,0,253,254,1,0,0,0,254,35,1,0,0,0,255,256,5,16,0,0,256,
        37,1,0,0,0,257,258,5,17,0,0,258,39,1,0,0,0,259,260,5,18,0,0,260,
        41,1,0,0,0,261,262,5,19,0,0,262,43,1,0,0,0,263,265,5,20,0,0,264,
        266,5,21,0,0,265,264,1,0,0,0,265,266,1,0,0,0,266,267,1,0,0,0,267,
        268,5,1,0,0,268,45,1,0,0,0,269,271,3,18,9,0,270,269,1,0,0,0,271,
        274,1,0,0,0,272,270,1,0,0,0,272,273,1,0,0,0,273,275,1,0,0,0,274,
        272,1,0,0,0,275,276,5,0,0,1,276,47,1,0,0,0,277,278,3,8,4,0,278,279,
        5,0,0,1,279,49,1,0,0,0,280,282,3,32,16,0,281,280,1,0,0,0,282,285,
        1,0,0,0,283,281,1,0,0,0,283,284,1,0,0,0,284,286,1,0,0,0,285,283,
        1,0,0,0,286,287,5,0,0,1,287,51,1,0,0,0,288,289,5,2,0,0,289,290,3,
        72,36,0,290,294,5,4,0,0,291,293,3,70,35,0,292,291,1,0,0,0,293,296,
        1,0,0,0,294,292,1,0,0,0,294,295,1,0,0,0,295,297,1,0,0,0,296,294,
        1,0,0,0,297,298,5,3,0,0,298,320,1,0,0,0,299,300,5,2,0,0,300,301,
        3,72,36,0,301,305,5,4,0,0,302,304,3,62,31,0,303,302,1,0,0,0,304,
        307,1,0,0,0,305,303,1,0,0,0,305,306,1,0,0,0,306,308,1,0,0,0,307,
        305,1,0,0,0,308,309,5,3,0,0,309,320,1,0,0,0,310,311,5,2,0,0,311,
        312,3,72,36,0,312,316,5,4,0,0,313,315,3,62,31,0,314,313,1,0,0,0,
        315,318,1,0,0,0,316,314,1,0,0,0,316,317,1,0,0,0,317,320,1,0,0,0,
        318,316,1,0,0,0,319,288,1,0,0,0,319,299,1,0,0,0,319,310,1,0,0,0,
        320,53,1,0,0,0,321,322,5,2,0,0,322,323,5,39,0,0,323,324,5,3,0,0,
        324,55,1,0,0,0,325,326,5,2,0,0,326,327,3,66,33,0,327,328,5,3,0,0,
        328,57,1,0,0,0,329,331,5,2,0,0,330,332,3,70,35,0,331,330,1,0,0,0,
        332,333,1,0,0,0,333,331,1,0,0,0,333,334,1,0,0,0,334,335,1,0,0,0,
        335,336,5,3,0,0,336,59,1,0,0,0,337,341,5,2,0,0,338,340,3,62,31,0,
        339,338,1,0,0,0,340,343,1,0,0,0,341,339,1,0,0,0,341,342,1,0,0,0,
        342,344,1,0,0,0,343,341,1,0,0,0,344,345,5,3,0,0,345,61,1,0,0,0,346,
        349,3,64,32,0,347,349,8,4,0,0,348,346,1,0,0,0,348,347,1,0,0,0,349,
        63,1,0,0,0,350,352,5,38,0,0,351,353,5,7,0,0,352,351,1,0,0,0,352,
        353,1,0,0,0,353,354,1,0,0,0,354,356,5,35,0,0,355,357,5,7,0,0,356,
        355,1,0,0,0,356,357,1,0,0,0,357,358,1,0,0,0,358,359,3,66,33,0,359,
        65,1,0,0,0,360,362,3,68,34,0,361,360,1,0,0,0,362,363,1,0,0,0,363,
        361,1,0,0,0,363,364,1,0,0,0,364,67,1,0,0,0,365,369,3,72,36,0,366,
        369,5,46,0,0,367,369,5,5,0,0,368,365,1,0,0,0,368,366,1,0,0,0,368,
        367,1,0,0,0,369,69,1,0,0,0,370,374,3,72,36,0,371,374,5,5,0,0,372,
        374,5,4,0,0,373,370,1,0,0,0,373,371,1,0,0,0,373,372,1,0,0,0,374,
        71,1,0,0,0,375,376,7,5,0,0,376,73,1,0,0,0,377,378,5,2,0,0,378,379,
        3,76,38,0,379,380,5,4,0,0,380,75,1,0,0,0,381,382,7,6,0,0,382,77,
        1,0,0,0,383,385,5,81,0,0,384,383,1,0,0,0,384,385,1,0,0,0,385,79,
        1,0,0,0,386,387,5,2,0,0,387,388,3,82,41,0,388,389,5,3,0,0,389,390,
        5,0,0,1,390,81,1,0,0,0,391,400,3,84,42,0,392,400,3,86,43,0,393,400,
        3,90,45,0,394,400,3,92,46,0,395,400,3,94,47,0,396,400,3,100,50,0,
        397,400,3,102,51,0,398,400,3,104,52,0,399,391,1,0,0,0,399,392,1,
        0,0,0,399,393,1,0,0,0,399,394,1,0,0,0,399,395,1,0,0,0,399,396,1,
        0,0,0,399,397,1,0,0,0,399,398,1,0,0,0,400,83,1,0,0,0,401,402,5,53,
        0,0,402,407,5,4,0,0,403,408,5,61,0,0,404,408,5,62,0,0,405,406,5,
        78,0,0,406,408,3,78,39,0,407,403,1,0,0,0,407,404,1,0,0,0,407,405,
        1,0,0,0,408,85,1,0,0,0,409,410,5,54,0,0,410,419,5,4,0,0,411,412,
        5,79,0,0,412,420,3,78,39,0,413,420,3,88,44,0,414,415,5,65,0,0,415,
        416,5,4,0,0,416,420,3,88,44,0,417,418,5,80,0,0,418,420,5,82,0,0,
        419,411,1,0,0,0,419,413,1,0,0,0,419,414,1,0,0,0,419,417,1,0,0,0,
        420,87,1,0,0,0,421,422,7,7,0,0,422,89,1,0,0,0,423,424,5,55,0,0,424,
        425,5,4,0,0,425,426,7,8,0,0,426,91,1,0,0,0,427,428,5,56,0,0,428,
        429,5,4,0,0,429,430,3,96,48,0,430,431,5,4,0,0,431,432,5,9,0,0,432,
        93,1,0,0,0,433,434,5,57,0,0,434,435,5,4,0,0,435,436,3,96,48,0,436,
        437,5,4,0,0,437,438,3,98,49,0,438,95,1,0,0,0,439,440,7,9,0,0,440,
        97,1,0,0,0,441,443,5,5,0,0,442,441,1,0,0,0,442,443,1,0,0,0,443,444,
        1,0,0,0,444,447,5,9,0,0,445,446,5,6,0,0,446,448,5,9,0,0,447,445,
        1,0,0,0,447,448,1,0,0,0,448,99,1,0,0,0,449,450,5,58,0,0,450,451,
        5,4,0,0,451,452,5,71,0,0,452,101,1,0,0,0,453,454,5,59,0,0,454,455,
        5,4,0,0,455,456,5,72,0,0,456,103,1,0,0,0,457,458,5,51,0,0,458,459,
        5,4,0,0,459,460,5,52,0,0,460,461,5,4,0,0,461,462,3,106,53,0,462,
        105,1,0,0,0,463,464,7,10,0,0,464,107,1,0,0,0,465,466,5,2,0,0,466,
        467,3,110,55,0,467,468,5,3,0,0,468,469,5,0,0,1,469,109,1,0,0,0,470,
        473,3,112,56,0,471,473,3,114,57,0,472,470,1,0,0,0,472,471,1,0,0,
        0,473,111,1,0,0,0,474,475,5,53,0,0,475,482,5,4,0,0,476,483,5,61,
        0,0,477,483,5,62,0,0,478,483,5,63,0,0,479,483,5,64,0,0,480,481,5,
        78,0,0,481,483,3,78,39,0,482,476,1,0,0,0,482,477,1,0,0,0,482,478,
        1,0,0,0,482,479,1,0,0,0,482,480,1,0,0,0,483,113,1,0,0,0,484,485,
        5,60,0,0,485,495,5,4,0,0,486,496,5,73,0,0,487,496,5,74,0,0,488,496,
        5,75,0,0,489,490,5,76,0,0,490,491,5,4,0,0,491,496,5,9,0,0,492,493,
        5,77,0,0,493,494,5,4,0,0,494,496,5,9,0,0,495,486,1,0,0,0,495,487,
        1,0,0,0,495,488,1,0,0,0,495,489,1,0,0,0,495,492,1,0,0,0,496,115,
        1,0,0,0,44,126,132,141,149,153,157,165,173,176,179,184,190,201,209,
        216,226,232,243,249,253,265,272,283,294,305,316,319,333,341,348,
        352,356,363,368,373,384,399,407,419,442,447,472,482,495
    ];

    private static __ATN: antlr.ATN;
    public static get _ATN(): antlr.ATN {
        if (!MdTemplateParser.__ATN) {
            MdTemplateParser.__ATN = new antlr.ATNDeserializer().deserialize(MdTemplateParser._serializedATN);
        }

        return MdTemplateParser.__ATN;
    }


    private static readonly vocabulary = new antlr.Vocabulary(MdTemplateParser.literalNames, MdTemplateParser.symbolicNames, []);

    public override get vocabulary(): antlr.Vocabulary {
        return MdTemplateParser.vocabulary;
    }

    private static readonly decisionsToDFA = MdTemplateParser._ATN.decisionToState.map( (ds: antlr.DecisionState, index: number) => new antlr.DFA(ds, index) );
}

export class DocumentContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public frontmatter(): FrontmatterContext | null {
        return this.getRuleContext(0, FrontmatterContext);
    }
    public body(): BodyContext | null {
        return this.getRuleContext(0, BodyContext);
    }
    public EOF(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.EOF, 0)!;
    }
    public fmUnclosed(): FmUnclosedContext | null {
        return this.getRuleContext(0, FmUnclosedContext);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_document;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterDocument) {
             listener.enterDocument(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitDocument) {
             listener.exitDocument(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitDocument) {
            return visitor.visitDocument(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FrontmatterContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public FM_OPEN(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.FM_OPEN, 0)!;
    }
    public FM_CLOSE(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.FM_CLOSE, 0)!;
    }
    public fmLine(): FmLineContext[];
    public fmLine(i: number): FmLineContext | null;
    public fmLine(i?: number): FmLineContext[] | FmLineContext | null {
        if (i === undefined) {
            return this.getRuleContexts(FmLineContext);
        }

        return this.getRuleContext(i, FmLineContext);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_frontmatter;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterFrontmatter) {
             listener.enterFrontmatter(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitFrontmatter) {
             listener.exitFrontmatter(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitFrontmatter) {
            return visitor.visitFrontmatter(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FmUnclosedContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public FM_OPEN(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.FM_OPEN, 0)!;
    }
    public fmLine(): FmLineContext[];
    public fmLine(i: number): FmLineContext | null;
    public fmLine(i?: number): FmLineContext[] | FmLineContext | null {
        if (i === undefined) {
            return this.getRuleContexts(FmLineContext);
        }

        return this.getRuleContext(i, FmLineContext);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_fmUnclosed;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterFmUnclosed) {
             listener.enterFmUnclosed(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitFmUnclosed) {
             listener.exitFmUnclosed(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitFmUnclosed) {
            return visitor.visitFmUnclosed(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FmLineContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public fmFilenameLine(): FmFilenameLineContext | null {
        return this.getRuleContext(0, FmFilenameLineContext);
    }
    public fmCommentLine(): FmCommentLineContext | null {
        return this.getRuleContext(0, FmCommentLineContext);
    }
    public fmKeyLine(): FmKeyLineContext | null {
        return this.getRuleContext(0, FmKeyLineContext);
    }
    public fmBlankLine(): FmBlankLineContext | null {
        return this.getRuleContext(0, FmBlankLineContext);
    }
    public fmOtherLine(): FmOtherLineContext | null {
        return this.getRuleContext(0, FmOtherLineContext);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_fmLine;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterFmLine) {
             listener.enterFmLine(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitFmLine) {
             listener.exitFmLine(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitFmLine) {
            return visitor.visitFmLine(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FmFilenameLineContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public FM_LINE_HASH(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.FM_LINE_HASH, 0)!;
    }
    public tagCandidate(): TagCandidateContext {
        return this.getRuleContext(0, TagCandidateContext)!;
    }
    public NL(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.NL, 0)!;
    }
    public WS(): antlr.TerminalNode[];
    public WS(i: number): antlr.TerminalNode | null;
    public WS(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(MdTemplateParser.WS);
    	} else {
    		return this.getToken(MdTemplateParser.WS, i);
    	}
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_fmFilenameLine;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterFmFilenameLine) {
             listener.enterFmFilenameLine(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitFmFilenameLine) {
             listener.exitFmFilenameLine(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitFmFilenameLine) {
            return visitor.visitFmFilenameLine(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FmCommentLineContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public FM_LINE_HASH(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.FM_LINE_HASH, 0)!;
    }
    public NL(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.NL, 0)!;
    }
    public fmCommentItem(): FmCommentItemContext[];
    public fmCommentItem(i: number): FmCommentItemContext | null;
    public fmCommentItem(i?: number): FmCommentItemContext[] | FmCommentItemContext | null {
        if (i === undefined) {
            return this.getRuleContexts(FmCommentItemContext);
        }

        return this.getRuleContext(i, FmCommentItemContext);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_fmCommentLine;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterFmCommentLine) {
             listener.enterFmCommentLine(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitFmCommentLine) {
             listener.exitFmCommentLine(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitFmCommentLine) {
            return visitor.visitFmCommentLine(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FmKeyLineContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public FM_KEY_BARE(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.FM_KEY_BARE, 0);
    }
    public FM_KEY(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.FM_KEY, 0);
    }
    public NL(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.NL, 0);
    }
    public fmValue(): FmValueContext | null {
        return this.getRuleContext(0, FmValueContext);
    }
    public fmInlineComment(): FmInlineCommentContext | null {
        return this.getRuleContext(0, FmInlineCommentContext);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_fmKeyLine;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterFmKeyLine) {
             listener.enterFmKeyLine(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitFmKeyLine) {
             listener.exitFmKeyLine(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitFmKeyLine) {
            return visitor.visitFmKeyLine(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FmValueContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public FM_QUOTED(): antlr.TerminalNode[];
    public FM_QUOTED(i: number): antlr.TerminalNode | null;
    public FM_QUOTED(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(MdTemplateParser.FM_QUOTED);
    	} else {
    		return this.getToken(MdTemplateParser.FM_QUOTED, i);
    	}
    }
    public FM_PLAIN_TEXT(): antlr.TerminalNode[];
    public FM_PLAIN_TEXT(i: number): antlr.TerminalNode | null;
    public FM_PLAIN_TEXT(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(MdTemplateParser.FM_PLAIN_TEXT);
    	} else {
    		return this.getToken(MdTemplateParser.FM_PLAIN_TEXT, i);
    	}
    }
    public FM_FLOW_OPEN(): antlr.TerminalNode[];
    public FM_FLOW_OPEN(i: number): antlr.TerminalNode | null;
    public FM_FLOW_OPEN(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(MdTemplateParser.FM_FLOW_OPEN);
    	} else {
    		return this.getToken(MdTemplateParser.FM_FLOW_OPEN, i);
    	}
    }
    public FM_FLOW_CLOSE(): antlr.TerminalNode[];
    public FM_FLOW_CLOSE(i: number): antlr.TerminalNode | null;
    public FM_FLOW_CLOSE(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(MdTemplateParser.FM_FLOW_CLOSE);
    	} else {
    		return this.getToken(MdTemplateParser.FM_FLOW_CLOSE, i);
    	}
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_fmValue;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterFmValue) {
             listener.enterFmValue(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitFmValue) {
             listener.exitFmValue(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitFmValue) {
            return visitor.visitFmValue(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FmInlineCommentContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public FM_COMMENT_HASH(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.FM_COMMENT_HASH, 0)!;
    }
    public fmCommentItem(): FmCommentItemContext[];
    public fmCommentItem(i: number): FmCommentItemContext | null;
    public fmCommentItem(i?: number): FmCommentItemContext[] | FmCommentItemContext | null {
        if (i === undefined) {
            return this.getRuleContexts(FmCommentItemContext);
        }

        return this.getRuleContext(i, FmCommentItemContext);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_fmInlineComment;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterFmInlineComment) {
             listener.enterFmInlineComment(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitFmInlineComment) {
             listener.exitFmInlineComment(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitFmInlineComment) {
            return visitor.visitFmInlineComment(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FmCommentItemContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public tagCandidate(): TagCandidateContext | null {
        return this.getRuleContext(0, TagCandidateContext);
    }
    public tagRuleMarker(): TagRuleMarkerContext | null {
        return this.getRuleContext(0, TagRuleMarkerContext);
    }
    public tagBareBracket(): TagBareBracketContext | null {
        return this.getRuleContext(0, TagBareBracketContext);
    }
    public tagShapedBracket(): TagShapedBracketContext | null {
        return this.getRuleContext(0, TagShapedBracketContext);
    }
    public tagProseBracket(): TagProseBracketContext | null {
        return this.getRuleContext(0, TagProseBracketContext);
    }
    public tagTypeEq(): TagTypeEqContext | null {
        return this.getRuleContext(0, TagTypeEqContext);
    }
    public fmHintWord(): FmHintWordContext | null {
        return this.getRuleContext(0, FmHintWordContext);
    }
    public NL(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.NL, 0);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_fmCommentItem;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterFmCommentItem) {
             listener.enterFmCommentItem(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitFmCommentItem) {
             listener.exitFmCommentItem(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitFmCommentItem) {
            return visitor.visitFmCommentItem(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FmHintWordContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public DATE_PLACEHOLDER(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.DATE_PLACEHOLDER, 0);
    }
    public ISO(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.ISO, 0);
    }
    public URL(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.URL, 0);
    }
    public LIEN(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.LIEN, 0);
    }
    public PATH(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.PATH, 0);
    }
    public ALIAS_MARK(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.ALIAS_MARK, 0);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_fmHintWord;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterFmHintWord) {
             listener.enterFmHintWord(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitFmHintWord) {
             listener.exitFmHintWord(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitFmHintWord) {
            return visitor.visitFmHintWord(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FmBlankLineContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public FM_BLANK(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.FM_BLANK, 0)!;
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_fmBlankLine;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterFmBlankLine) {
             listener.enterFmBlankLine(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitFmBlankLine) {
             listener.exitFmBlankLine(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitFmBlankLine) {
            return visitor.visitFmBlankLine(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FmOtherLineContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public FM_LINE_START(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.FM_LINE_START, 0)!;
    }
    public NL(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.NL, 0)!;
    }
    public FM_TEXT_REST(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.FM_TEXT_REST, 0);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_fmOtherLine;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterFmOtherLine) {
             listener.enterFmOtherLine(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitFmOtherLine) {
             listener.exitFmOtherLine(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitFmOtherLine) {
            return visitor.visitFmOtherLine(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class BodyContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public bodyBlock(): BodyBlockContext[];
    public bodyBlock(i: number): BodyBlockContext | null;
    public bodyBlock(i?: number): BodyBlockContext[] | BodyBlockContext | null {
        if (i === undefined) {
            return this.getRuleContexts(BodyBlockContext);
        }

        return this.getRuleContext(i, BodyBlockContext);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_body;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterBody) {
             listener.enterBody(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitBody) {
             listener.exitBody(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitBody) {
            return visitor.visitBody(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class BodyBlockContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public bodyHeading(): BodyHeadingContext | null {
        return this.getRuleContext(0, BodyHeadingContext);
    }
    public bodyFence(): BodyFenceContext | null {
        return this.getRuleContext(0, BodyFenceContext);
    }
    public bodyTableRow(): BodyTableRowContext | null {
        return this.getRuleContext(0, BodyTableRowContext);
    }
    public bodyListItem(): BodyListItemContext | null {
        return this.getRuleContext(0, BodyListItemContext);
    }
    public bodyHtmlComment(): BodyHtmlCommentContext | null {
        return this.getRuleContext(0, BodyHtmlCommentContext);
    }
    public bodyBlankLine(): BodyBlankLineContext | null {
        return this.getRuleContext(0, BodyBlankLineContext);
    }
    public bodyTextLine(): BodyTextLineContext | null {
        return this.getRuleContext(0, BodyTextLineContext);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_bodyBlock;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterBodyBlock) {
             listener.enterBodyBlock(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitBodyBlock) {
             listener.exitBodyBlock(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitBodyBlock) {
            return visitor.visitBodyBlock(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class BodyHeadingContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public H_OPEN(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.H_OPEN, 0)!;
    }
    public NL(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.NL, 0)!;
    }
    public bodyHeadingItem(): BodyHeadingItemContext[];
    public bodyHeadingItem(i: number): BodyHeadingItemContext | null;
    public bodyHeadingItem(i?: number): BodyHeadingItemContext[] | BodyHeadingItemContext | null {
        if (i === undefined) {
            return this.getRuleContexts(BodyHeadingItemContext);
        }

        return this.getRuleContext(i, BodyHeadingItemContext);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_bodyHeading;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterBodyHeading) {
             listener.enterBodyHeading(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitBodyHeading) {
             listener.exitBodyHeading(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitBodyHeading) {
            return visitor.visitBodyHeading(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class BodyHeadingItemContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public tagCandidate(): TagCandidateContext | null {
        return this.getRuleContext(0, TagCandidateContext);
    }
    public tagRuleMarker(): TagRuleMarkerContext | null {
        return this.getRuleContext(0, TagRuleMarkerContext);
    }
    public tagBareBracket(): TagBareBracketContext | null {
        return this.getRuleContext(0, TagBareBracketContext);
    }
    public tagShapedBracket(): TagShapedBracketContext | null {
        return this.getRuleContext(0, TagShapedBracketContext);
    }
    public tagProseBracket(): TagProseBracketContext | null {
        return this.getRuleContext(0, TagProseBracketContext);
    }
    public NL(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.NL, 0);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_bodyHeadingItem;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterBodyHeadingItem) {
             listener.enterBodyHeadingItem(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitBodyHeadingItem) {
             listener.exitBodyHeadingItem(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitBodyHeadingItem) {
            return visitor.visitBodyHeadingItem(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class BodyFenceContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public FENCE_OPEN(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.FENCE_OPEN, 0)!;
    }
    public FENCE_CLOSE(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.FENCE_CLOSE, 0);
    }
    public FENCE_NL(): antlr.TerminalNode[];
    public FENCE_NL(i: number): antlr.TerminalNode | null;
    public FENCE_NL(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(MdTemplateParser.FENCE_NL);
    	} else {
    		return this.getToken(MdTemplateParser.FENCE_NL, i);
    	}
    }
    public FENCE_LINE(): antlr.TerminalNode[];
    public FENCE_LINE(i: number): antlr.TerminalNode | null;
    public FENCE_LINE(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(MdTemplateParser.FENCE_LINE);
    	} else {
    		return this.getToken(MdTemplateParser.FENCE_LINE, i);
    	}
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_bodyFence;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterBodyFence) {
             listener.enterBodyFence(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitBodyFence) {
             listener.exitBodyFence(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitBodyFence) {
            return visitor.visitBodyFence(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class BodyTableRowContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public BODY_TABLE_ROW(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.BODY_TABLE_ROW, 0)!;
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_bodyTableRow;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterBodyTableRow) {
             listener.enterBodyTableRow(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitBodyTableRow) {
             listener.exitBodyTableRow(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitBodyTableRow) {
            return visitor.visitBodyTableRow(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class BodyListItemContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public BODY_LIST_ITEM(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.BODY_LIST_ITEM, 0)!;
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_bodyListItem;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterBodyListItem) {
             listener.enterBodyListItem(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitBodyListItem) {
             listener.exitBodyListItem(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitBodyListItem) {
            return visitor.visitBodyListItem(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class BodyHtmlCommentContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public BODY_HTML_COMMENT(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.BODY_HTML_COMMENT, 0)!;
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_bodyHtmlComment;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterBodyHtmlComment) {
             listener.enterBodyHtmlComment(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitBodyHtmlComment) {
             listener.exitBodyHtmlComment(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitBodyHtmlComment) {
            return visitor.visitBodyHtmlComment(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class BodyBlankLineContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public BODY_BLANK(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.BODY_BLANK, 0)!;
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_bodyBlankLine;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterBodyBlankLine) {
             listener.enterBodyBlankLine(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitBodyBlankLine) {
             listener.exitBodyBlankLine(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitBodyBlankLine) {
            return visitor.visitBodyBlankLine(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class BodyTextLineContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public BODY_TEXT_START(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.BODY_TEXT_START, 0)!;
    }
    public NL(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.NL, 0)!;
    }
    public BODY_TEXT_REST(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.BODY_TEXT_REST, 0);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_bodyTextLine;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterBodyTextLine) {
             listener.enterBodyTextLine(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitBodyTextLine) {
             listener.exitBodyTextLine(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitBodyTextLine) {
            return visitor.visitBodyTextLine(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FmInlineCommentEntryContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public EOF(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.EOF, 0)!;
    }
    public fmCommentItem(): FmCommentItemContext[];
    public fmCommentItem(i: number): FmCommentItemContext | null;
    public fmCommentItem(i?: number): FmCommentItemContext[] | FmCommentItemContext | null {
        if (i === undefined) {
            return this.getRuleContexts(FmCommentItemContext);
        }

        return this.getRuleContext(i, FmCommentItemContext);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_fmInlineCommentEntry;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterFmInlineCommentEntry) {
             listener.enterFmInlineCommentEntry(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitFmInlineCommentEntry) {
             listener.exitFmInlineCommentEntry(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitFmInlineCommentEntry) {
            return visitor.visitFmInlineCommentEntry(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FmFilenameLineEntryContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public fmFilenameLine(): FmFilenameLineContext {
        return this.getRuleContext(0, FmFilenameLineContext)!;
    }
    public EOF(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.EOF, 0)!;
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_fmFilenameLineEntry;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterFmFilenameLineEntry) {
             listener.enterFmFilenameLineEntry(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitFmFilenameLineEntry) {
             listener.exitFmFilenameLineEntry(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitFmFilenameLineEntry) {
            return visitor.visitFmFilenameLineEntry(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class BodyHeadingTextEntryContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public EOF(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.EOF, 0)!;
    }
    public bodyHeadingItem(): BodyHeadingItemContext[];
    public bodyHeadingItem(i: number): BodyHeadingItemContext | null;
    public bodyHeadingItem(i?: number): BodyHeadingItemContext[] | BodyHeadingItemContext | null {
        if (i === undefined) {
            return this.getRuleContexts(BodyHeadingItemContext);
        }

        return this.getRuleContext(i, BodyHeadingItemContext);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_bodyHeadingTextEntry;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterBodyHeadingTextEntry) {
             listener.enterBodyHeadingTextEntry(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitBodyHeadingTextEntry) {
             listener.exitBodyHeadingTextEntry(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitBodyHeadingTextEntry) {
            return visitor.visitBodyHeadingTextEntry(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TagCandidateContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_tagCandidate;
    }
    public override copyFrom(ctx: TagCandidateContext): void {
        super.copyFrom(ctx);
    }
}
export class TagShapedCandidateContext extends TagCandidateContext {
    public constructor(ctx: TagCandidateContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public LBRACK(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.LBRACK, 0)!;
    }
    public tagWord(): TagWordContext {
        return this.getRuleContext(0, TagWordContext)!;
    }
    public COLON(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.COLON, 0)!;
    }
    public RBRACK(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.RBRACK, 0)!;
    }
    public tagShapePiece(): TagShapePieceContext[];
    public tagShapePiece(i: number): TagShapePieceContext | null;
    public tagShapePiece(i?: number): TagShapePieceContext[] | TagShapePieceContext | null {
        if (i === undefined) {
            return this.getRuleContexts(TagShapePieceContext);
        }

        return this.getRuleContext(i, TagShapePieceContext);
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterTagShapedCandidate) {
             listener.enterTagShapedCandidate(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitTagShapedCandidate) {
             listener.exitTagShapedCandidate(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitTagShapedCandidate) {
            return visitor.visitTagShapedCandidate(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class TagClosedCandidateContext extends TagCandidateContext {
    public constructor(ctx: TagCandidateContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public LBRACK(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.LBRACK, 0)!;
    }
    public tagWord(): TagWordContext {
        return this.getRuleContext(0, TagWordContext)!;
    }
    public COLON(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.COLON, 0)!;
    }
    public RBRACK(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.RBRACK, 0)!;
    }
    public tagBracketItem(): TagBracketItemContext[];
    public tagBracketItem(i: number): TagBracketItemContext | null;
    public tagBracketItem(i?: number): TagBracketItemContext[] | TagBracketItemContext | null {
        if (i === undefined) {
            return this.getRuleContexts(TagBracketItemContext);
        }

        return this.getRuleContext(i, TagBracketItemContext);
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterTagClosedCandidate) {
             listener.enterTagClosedCandidate(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitTagClosedCandidate) {
             listener.exitTagClosedCandidate(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitTagClosedCandidate) {
            return visitor.visitTagClosedCandidate(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class TagUnclosedCandidateContext extends TagCandidateContext {
    public constructor(ctx: TagCandidateContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public LBRACK(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.LBRACK, 0)!;
    }
    public tagWord(): TagWordContext {
        return this.getRuleContext(0, TagWordContext)!;
    }
    public COLON(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.COLON, 0)!;
    }
    public tagBracketItem(): TagBracketItemContext[];
    public tagBracketItem(i: number): TagBracketItemContext | null;
    public tagBracketItem(i?: number): TagBracketItemContext[] | TagBracketItemContext | null {
        if (i === undefined) {
            return this.getRuleContexts(TagBracketItemContext);
        }

        return this.getRuleContext(i, TagBracketItemContext);
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterTagUnclosedCandidate) {
             listener.enterTagUnclosedCandidate(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitTagUnclosedCandidate) {
             listener.exitTagUnclosedCandidate(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitTagUnclosedCandidate) {
            return visitor.visitTagUnclosedCandidate(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TagRuleMarkerContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public LBRACK(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.LBRACK, 0)!;
    }
    public RULE(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.RULE, 0)!;
    }
    public RBRACK(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.RBRACK, 0)!;
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_tagRuleMarker;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterTagRuleMarker) {
             listener.enterTagRuleMarker(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitTagRuleMarker) {
             listener.exitTagRuleMarker(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitTagRuleMarker) {
            return visitor.visitTagRuleMarker(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TagBareBracketContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public LBRACK(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.LBRACK, 0)!;
    }
    public tagHintName(): TagHintNameContext {
        return this.getRuleContext(0, TagHintNameContext)!;
    }
    public RBRACK(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.RBRACK, 0)!;
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_tagBareBracket;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterTagBareBracket) {
             listener.enterTagBareBracket(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitTagBareBracket) {
             listener.exitTagBareBracket(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitTagBareBracket) {
            return visitor.visitTagBareBracket(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TagShapedBracketContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public LBRACK(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.LBRACK, 0)!;
    }
    public RBRACK(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.RBRACK, 0)!;
    }
    public tagShapePiece(): TagShapePieceContext[];
    public tagShapePiece(i: number): TagShapePieceContext | null;
    public tagShapePiece(i?: number): TagShapePieceContext[] | TagShapePieceContext | null {
        if (i === undefined) {
            return this.getRuleContexts(TagShapePieceContext);
        }

        return this.getRuleContext(i, TagShapePieceContext);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_tagShapedBracket;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterTagShapedBracket) {
             listener.enterTagShapedBracket(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitTagShapedBracket) {
             listener.exitTagShapedBracket(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitTagShapedBracket) {
            return visitor.visitTagShapedBracket(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TagProseBracketContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public LBRACK(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.LBRACK, 0)!;
    }
    public RBRACK(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.RBRACK, 0)!;
    }
    public tagBracketItem(): TagBracketItemContext[];
    public tagBracketItem(i: number): TagBracketItemContext | null;
    public tagBracketItem(i?: number): TagBracketItemContext[] | TagBracketItemContext | null {
        if (i === undefined) {
            return this.getRuleContexts(TagBracketItemContext);
        }

        return this.getRuleContext(i, TagBracketItemContext);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_tagProseBracket;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterTagProseBracket) {
             listener.enterTagProseBracket(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitTagProseBracket) {
             listener.exitTagProseBracket(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitTagProseBracket) {
            return visitor.visitTagProseBracket(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TagBracketItemContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public tagTypeEq(): TagTypeEqContext | null {
        return this.getRuleContext(0, TagTypeEqContext);
    }
    public RBRACK(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.RBRACK, 0);
    }
    public NL(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.NL, 0);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_tagBracketItem;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterTagBracketItem) {
             listener.enterTagBracketItem(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitTagBracketItem) {
             listener.exitTagBracketItem(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitTagBracketItem) {
            return visitor.visitTagBracketItem(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TagTypeEqContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public TYPE(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.TYPE, 0)!;
    }
    public EQ(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.EQ, 0)!;
    }
    public tagHintName(): TagHintNameContext {
        return this.getRuleContext(0, TagHintNameContext)!;
    }
    public WS(): antlr.TerminalNode[];
    public WS(i: number): antlr.TerminalNode | null;
    public WS(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(MdTemplateParser.WS);
    	} else {
    		return this.getToken(MdTemplateParser.WS, i);
    	}
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_tagTypeEq;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterTagTypeEq) {
             listener.enterTagTypeEq(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitTagTypeEq) {
             listener.exitTagTypeEq(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitTagTypeEq) {
            return visitor.visitTagTypeEq(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TagHintNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public tagHintPiece(): TagHintPieceContext[];
    public tagHintPiece(i: number): TagHintPieceContext | null;
    public tagHintPiece(i?: number): TagHintPieceContext[] | TagHintPieceContext | null {
        if (i === undefined) {
            return this.getRuleContexts(TagHintPieceContext);
        }

        return this.getRuleContext(i, TagHintPieceContext);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_tagHintName;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterTagHintName) {
             listener.enterTagHintName(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitTagHintName) {
             listener.exitTagHintName(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitTagHintName) {
            return visitor.visitTagHintName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TagHintPieceContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public tagWord(): TagWordContext | null {
        return this.getRuleContext(0, TagWordContext);
    }
    public UWORD(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.UWORD, 0);
    }
    public DASH(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.DASH, 0);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_tagHintPiece;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterTagHintPiece) {
             listener.enterTagHintPiece(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitTagHintPiece) {
             listener.exitTagHintPiece(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitTagHintPiece) {
            return visitor.visitTagHintPiece(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TagShapePieceContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public tagWord(): TagWordContext | null {
        return this.getRuleContext(0, TagWordContext);
    }
    public DASH(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.DASH, 0);
    }
    public COLON(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.COLON, 0);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_tagShapePiece;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterTagShapePiece) {
             listener.enterTagShapePiece(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitTagShapePiece) {
             listener.exitTagShapePiece(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitTagShapePiece) {
            return visitor.visitTagShapePiece(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TagWordContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ALNUM(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.ALNUM, 0);
    }
    public NUMBER(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.NUMBER, 0);
    }
    public WORD(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.WORD, 0);
    }
    public TYPE(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.TYPE, 0);
    }
    public RULE(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.RULE, 0);
    }
    public ISO(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.ISO, 0);
    }
    public URL(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.URL, 0);
    }
    public LIEN(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.LIEN, 0);
    }
    public PATH(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.PATH, 0);
    }
    public DATE_PLACEHOLDER(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.DATE_PLACEHOLDER, 0);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_tagWord;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterTagWord) {
             listener.enterTagWord(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitTagWord) {
             listener.exitTagWord(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitTagWord) {
            return visitor.visitTagWord(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TagFamilyEntryContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public LBRACK(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.LBRACK, 0)!;
    }
    public tagFamily(): TagFamilyContext {
        return this.getRuleContext(0, TagFamilyContext)!;
    }
    public COLON(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.COLON, 0)!;
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_tagFamilyEntry;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterTagFamilyEntry) {
             listener.enterTagFamilyEntry(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitTagFamilyEntry) {
             listener.exitTagFamilyEntry(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitTagFamilyEntry) {
            return visitor.visitTagFamilyEntry(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TagFamilyContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public PRESENCE(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.PRESENCE, 0);
    }
    public FORMAT(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.FORMAT, 0);
    }
    public VALUE(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.VALUE, 0);
    }
    public COUNT(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.COUNT, 0);
    }
    public RANGE(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.RANGE, 0);
    }
    public ORDER(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.ORDER, 0);
    }
    public IO(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.IO, 0);
    }
    public CONTENT(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.CONTENT, 0);
    }
    public FILENAME_CS(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.FILENAME_CS, 0);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_tagFamily;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterTagFamily) {
             listener.enterTagFamily(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitTagFamily) {
             listener.exitTagFamily(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitTagFamily) {
            return visitor.visitTagFamily(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TagFreeTextContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public FREE_TEXT(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.FREE_TEXT, 0);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_tagFreeText;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterTagFreeText) {
             listener.enterTagFreeText(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitTagFreeText) {
             listener.exitTagFreeText(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitTagFreeText) {
            return visitor.visitTagFreeText(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FmTagEntryContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public LBRACK(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.LBRACK, 0)!;
    }
    public fmTagBody(): FmTagBodyContext {
        return this.getRuleContext(0, FmTagBodyContext)!;
    }
    public RBRACK(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.RBRACK, 0)!;
    }
    public EOF(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.EOF, 0)!;
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_fmTagEntry;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterFmTagEntry) {
             listener.enterFmTagEntry(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitFmTagEntry) {
             listener.exitFmTagEntry(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitFmTagEntry) {
            return visitor.visitFmTagEntry(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FmTagBodyContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public fmPresenceTag(): FmPresenceTagContext | null {
        return this.getRuleContext(0, FmPresenceTagContext);
    }
    public fmFormatTag(): FmFormatTagContext | null {
        return this.getRuleContext(0, FmFormatTagContext);
    }
    public fmValueTag(): FmValueTagContext | null {
        return this.getRuleContext(0, FmValueTagContext);
    }
    public fmCountTag(): FmCountTagContext | null {
        return this.getRuleContext(0, FmCountTagContext);
    }
    public fmRangeTag(): FmRangeTagContext | null {
        return this.getRuleContext(0, FmRangeTagContext);
    }
    public fmOrderTag(): FmOrderTagContext | null {
        return this.getRuleContext(0, FmOrderTagContext);
    }
    public fmIoTag(): FmIoTagContext | null {
        return this.getRuleContext(0, FmIoTagContext);
    }
    public fmFilenameTag(): FmFilenameTagContext | null {
        return this.getRuleContext(0, FmFilenameTagContext);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_fmTagBody;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterFmTagBody) {
             listener.enterFmTagBody(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitFmTagBody) {
             listener.exitFmTagBody(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitFmTagBody) {
            return visitor.visitFmTagBody(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FmPresenceTagContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public PRESENCE(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.PRESENCE, 0)!;
    }
    public COLON(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.COLON, 0)!;
    }
    public REQUIRED(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.REQUIRED, 0);
    }
    public OPTIONAL(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.OPTIONAL, 0);
    }
    public CONDITIONAL_ARG(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.CONDITIONAL_ARG, 0);
    }
    public tagFreeText(): TagFreeTextContext | null {
        return this.getRuleContext(0, TagFreeTextContext);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_fmPresenceTag;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterFmPresenceTag) {
             listener.enterFmPresenceTag(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitFmPresenceTag) {
             listener.exitFmPresenceTag(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitFmPresenceTag) {
            return visitor.visitFmPresenceTag(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FmFormatTagContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public FORMAT(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.FORMAT, 0)!;
    }
    public COLON(): antlr.TerminalNode[];
    public COLON(i: number): antlr.TerminalNode | null;
    public COLON(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(MdTemplateParser.COLON);
    	} else {
    		return this.getToken(MdTemplateParser.COLON, i);
    	}
    }
    public CONSTANT_ARG(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.CONSTANT_ARG, 0);
    }
    public tagFreeText(): TagFreeTextContext | null {
        return this.getRuleContext(0, TagFreeTextContext);
    }
    public fmCaseStyle(): FmCaseStyleContext | null {
        return this.getRuleContext(0, FmCaseStyleContext);
    }
    public ELEMENTS(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.ELEMENTS, 0);
    }
    public SCHEME_ARG(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.SCHEME_ARG, 0);
    }
    public SCHEME_TEXT(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.SCHEME_TEXT, 0);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_fmFormatTag;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterFmFormatTag) {
             listener.enterFmFormatTag(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitFmFormatTag) {
             listener.exitFmFormatTag(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitFmFormatTag) {
            return visitor.visitFmFormatTag(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FmCaseStyleContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public SNAKE_CASE_CS(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.SNAKE_CASE_CS, 0);
    }
    public SNAKE_CASE(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.SNAKE_CASE, 0);
    }
    public KEBAB_CASE_CS(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.KEBAB_CASE_CS, 0);
    }
    public KEBAB_CASE(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.KEBAB_CASE, 0);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_fmCaseStyle;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterFmCaseStyle) {
             listener.enterFmCaseStyle(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitFmCaseStyle) {
             listener.exitFmCaseStyle(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitFmCaseStyle) {
            return visitor.visitFmCaseStyle(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FmValueTagContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public VALUE(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.VALUE, 0)!;
    }
    public COLON(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.COLON, 0)!;
    }
    public FILENAME_CS(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.FILENAME_CS, 0);
    }
    public FILENAME(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.FILENAME, 0);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_fmValueTag;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterFmValueTag) {
             listener.enterFmValueTag(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitFmValueTag) {
             listener.exitFmValueTag(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitFmValueTag) {
            return visitor.visitFmValueTag(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FmCountTagContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public COUNT(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.COUNT, 0)!;
    }
    public COLON(): antlr.TerminalNode[];
    public COLON(i: number): antlr.TerminalNode | null;
    public COLON(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(MdTemplateParser.COLON);
    	} else {
    		return this.getToken(MdTemplateParser.COLON, i);
    	}
    }
    public fmBound(): FmBoundContext {
        return this.getRuleContext(0, FmBoundContext)!;
    }
    public NUMBER(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.NUMBER, 0)!;
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_fmCountTag;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterFmCountTag) {
             listener.enterFmCountTag(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitFmCountTag) {
             listener.exitFmCountTag(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitFmCountTag) {
            return visitor.visitFmCountTag(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FmRangeTagContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public RANGE(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.RANGE, 0)!;
    }
    public COLON(): antlr.TerminalNode[];
    public COLON(i: number): antlr.TerminalNode | null;
    public COLON(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(MdTemplateParser.COLON);
    	} else {
    		return this.getToken(MdTemplateParser.COLON, i);
    	}
    }
    public fmBound(): FmBoundContext {
        return this.getRuleContext(0, FmBoundContext)!;
    }
    public fmSignedNumber(): FmSignedNumberContext {
        return this.getRuleContext(0, FmSignedNumberContext)!;
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_fmRangeTag;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterFmRangeTag) {
             listener.enterFmRangeTag(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitFmRangeTag) {
             listener.exitFmRangeTag(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitFmRangeTag) {
            return visitor.visitFmRangeTag(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FmBoundContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public MIN(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.MIN, 0);
    }
    public MAX(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.MAX, 0);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_fmBound;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterFmBound) {
             listener.enterFmBound(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitFmBound) {
             listener.exitFmBound(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitFmBound) {
            return visitor.visitFmBound(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FmSignedNumberContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public NUMBER(): antlr.TerminalNode[];
    public NUMBER(i: number): antlr.TerminalNode | null;
    public NUMBER(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(MdTemplateParser.NUMBER);
    	} else {
    		return this.getToken(MdTemplateParser.NUMBER, i);
    	}
    }
    public DASH(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.DASH, 0);
    }
    public DOT(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.DOT, 0);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_fmSignedNumber;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterFmSignedNumber) {
             listener.enterFmSignedNumber(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitFmSignedNumber) {
             listener.exitFmSignedNumber(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitFmSignedNumber) {
            return visitor.visitFmSignedNumber(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FmOrderTagContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ORDER(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.ORDER, 0)!;
    }
    public COLON(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.COLON, 0)!;
    }
    public ASCENDING(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.ASCENDING, 0)!;
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_fmOrderTag;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterFmOrderTag) {
             listener.enterFmOrderTag(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitFmOrderTag) {
             listener.exitFmOrderTag(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitFmOrderTag) {
            return visitor.visitFmOrderTag(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FmIoTagContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public IO(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.IO, 0)!;
    }
    public COLON(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.COLON, 0)!;
    }
    public EXISTS(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.EXISTS, 0)!;
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_fmIoTag;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterFmIoTag) {
             listener.enterFmIoTag(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitFmIoTag) {
             listener.exitFmIoTag(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitFmIoTag) {
            return visitor.visitFmIoTag(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FmFilenameTagContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public FILENAME_CS(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.FILENAME_CS, 0)!;
    }
    public COLON(): antlr.TerminalNode[];
    public COLON(i: number): antlr.TerminalNode | null;
    public COLON(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(MdTemplateParser.COLON);
    	} else {
    		return this.getToken(MdTemplateParser.COLON, i);
    	}
    }
    public CASE_CS(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.CASE_CS, 0)!;
    }
    public fmConvention(): FmConventionContext {
        return this.getRuleContext(0, FmConventionContext)!;
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_fmFilenameTag;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterFmFilenameTag) {
             listener.enterFmFilenameTag(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitFmFilenameTag) {
             listener.exitFmFilenameTag(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitFmFilenameTag) {
            return visitor.visitFmFilenameTag(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FmConventionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public SNAKE_CASE_CS(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.SNAKE_CASE_CS, 0);
    }
    public KEBAB_CASE_CS(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.KEBAB_CASE_CS, 0);
    }
    public CAMEL_CASE(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.CAMEL_CASE, 0);
    }
    public PASCAL_CASE(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.PASCAL_CASE, 0);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_fmConvention;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterFmConvention) {
             listener.enterFmConvention(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitFmConvention) {
             listener.exitFmConvention(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitFmConvention) {
            return visitor.visitFmConvention(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class BodyTagEntryContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public LBRACK(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.LBRACK, 0)!;
    }
    public bodyTagBody(): BodyTagBodyContext {
        return this.getRuleContext(0, BodyTagBodyContext)!;
    }
    public RBRACK(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.RBRACK, 0)!;
    }
    public EOF(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.EOF, 0)!;
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_bodyTagEntry;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterBodyTagEntry) {
             listener.enterBodyTagEntry(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitBodyTagEntry) {
             listener.exitBodyTagEntry(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitBodyTagEntry) {
            return visitor.visitBodyTagEntry(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class BodyTagBodyContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public bodyPresenceTag(): BodyPresenceTagContext | null {
        return this.getRuleContext(0, BodyPresenceTagContext);
    }
    public bodyContentTag(): BodyContentTagContext | null {
        return this.getRuleContext(0, BodyContentTagContext);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_bodyTagBody;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterBodyTagBody) {
             listener.enterBodyTagBody(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitBodyTagBody) {
             listener.exitBodyTagBody(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitBodyTagBody) {
            return visitor.visitBodyTagBody(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class BodyPresenceTagContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public PRESENCE(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.PRESENCE, 0)!;
    }
    public COLON(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.COLON, 0)!;
    }
    public REQUIRED(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.REQUIRED, 0);
    }
    public OPTIONAL(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.OPTIONAL, 0);
    }
    public EXIST(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.EXIST, 0);
    }
    public TEMPLATE_ONLY(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.TEMPLATE_ONLY, 0);
    }
    public CONDITIONAL_ARG(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.CONDITIONAL_ARG, 0);
    }
    public tagFreeText(): TagFreeTextContext | null {
        return this.getRuleContext(0, TagFreeTextContext);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_bodyPresenceTag;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterBodyPresenceTag) {
             listener.enterBodyPresenceTag(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitBodyPresenceTag) {
             listener.exitBodyPresenceTag(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitBodyPresenceTag) {
            return visitor.visitBodyPresenceTag(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class BodyContentTagContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public CONTENT(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.CONTENT, 0)!;
    }
    public COLON(): antlr.TerminalNode[];
    public COLON(i: number): antlr.TerminalNode | null;
    public COLON(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(MdTemplateParser.COLON);
    	} else {
    		return this.getToken(MdTemplateParser.COLON, i);
    	}
    }
    public NON_EMPTY(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.NON_EMPTY, 0);
    }
    public TABLE(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.TABLE, 0);
    }
    public LIST(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.LIST, 0);
    }
    public MIN_LINES(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.MIN_LINES, 0);
    }
    public NUMBER(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.NUMBER, 0);
    }
    public MAX_LINES(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.MAX_LINES, 0);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_bodyContentTag;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterBodyContentTag) {
             listener.enterBodyContentTag(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitBodyContentTag) {
             listener.exitBodyContentTag(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitBodyContentTag) {
            return visitor.visitBodyContentTag(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
