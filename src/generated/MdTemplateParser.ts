
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
    public static readonly SCAN_OPEN = 83;
    public static readonly SCAN_CLOSE = 84;
    public static readonly SCAN_TICKS = 85;
    public static readonly SCAN_TEXT = 86;
    public static readonly SCAN_CHAR = 87;
    public static readonly DIR_KEYWORD = 88;
    public static readonly DIR_DISABLE = 89;
    public static readonly DIR_DISABLE_LINE = 90;
    public static readonly DIR_DISABLE_NEXT_LINE = 91;
    public static readonly DIR_DISABLE_FILE = 92;
    public static readonly DIR_BEGIN = 93;
    public static readonly DIR_END = 94;
    public static readonly DIR_REASON = 95;
    public static readonly DIR_COMMA = 96;
    public static readonly DIR_WORD = 97;
    public static readonly FB_NL = 98;
    public static readonly T_LBRACK = 99;
    public static readonly T_RBRACK = 100;
    public static readonly T_COLON = 101;
    public static readonly T_DASH = 102;
    public static readonly S_DOT = 103;
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
    public static readonly RULE_directiveScanEntry = 58;
    public static readonly RULE_directiveScanLine = 59;
    public static readonly RULE_directiveScanItem = 60;
    public static readonly RULE_directiveEntry = 61;
    public static readonly RULE_directive = 62;
    public static readonly RULE_directiveHead = 63;
    public static readonly RULE_directiveMisplaced = 64;
    public static readonly RULE_directiveVerb = 65;
    public static readonly RULE_directiveUnknown = 66;
    public static readonly RULE_directiveArgs = 67;
    public static readonly RULE_directiveSep = 68;
    public static readonly RULE_directiveItem = 69;
    public static readonly RULE_directiveReason = 70;
    public static readonly RULE_directiveProse = 71;

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
        "'constant:'", "'scheme:'", null, null, "'<!--'", "'-->'", null, 
        null, null, "'md-template-lint'", "'disable'", "'disable-line'", 
        "'disable-next-line'", "'disable-file'", "'begin'", "'end'", null, 
        "','", null, null, null, null, null, null, "'.'"
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
        "FREE_TEXT", "SCHEME_TEXT", "SCAN_OPEN", "SCAN_CLOSE", "SCAN_TICKS", 
        "SCAN_TEXT", "SCAN_CHAR", "DIR_KEYWORD", "DIR_DISABLE", "DIR_DISABLE_LINE", 
        "DIR_DISABLE_NEXT_LINE", "DIR_DISABLE_FILE", "DIR_BEGIN", "DIR_END", 
        "DIR_REASON", "DIR_COMMA", "DIR_WORD", "FB_NL", "T_LBRACK", "T_RBRACK", 
        "T_COLON", "T_DASH", "S_DOT"
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
        "bodyPresenceTag", "bodyContentTag", "directiveScanEntry", "directiveScanLine", 
        "directiveScanItem", "directiveEntry", "directive", "directiveHead", 
        "directiveMisplaced", "directiveVerb", "directiveUnknown", "directiveArgs", 
        "directiveSep", "directiveItem", "directiveReason", "directiveProse",
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
            this.state = 154;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 0, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 144;
                this.frontmatter();
                this.state = 145;
                this.body();
                this.state = 146;
                this.match(MdTemplateParser.EOF);
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 148;
                this.fmUnclosed();
                this.state = 149;
                this.match(MdTemplateParser.EOF);
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 151;
                this.body();
                this.state = 152;
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
            this.state = 156;
            this.match(MdTemplateParser.FM_OPEN);
            this.state = 160;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 29)) & ~0x1F) === 0 && ((1 << (_la - 29)) & 31) !== 0)) {
                {
                {
                this.state = 157;
                this.fmLine();
                }
                }
                this.state = 162;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 163;
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
            this.state = 165;
            this.match(MdTemplateParser.FM_OPEN);
            this.state = 169;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 29)) & ~0x1F) === 0 && ((1 << (_la - 29)) & 31) !== 0)) {
                {
                {
                this.state = 166;
                this.fmLine();
                }
                }
                this.state = 171;
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
            this.state = 177;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 3, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 172;
                this.fmFilenameLine();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 173;
                this.fmCommentLine();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 174;
                this.fmKeyLine();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 175;
                this.fmBlankLine();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 176;
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
            this.state = 179;
            this.match(MdTemplateParser.FM_LINE_HASH);
            this.state = 181;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 7) {
                {
                this.state = 180;
                this.match(MdTemplateParser.WS);
                }
            }

            this.state = 183;
            this.tagCandidate();
            this.state = 185;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 7) {
                {
                this.state = 184;
                this.match(MdTemplateParser.WS);
                }
            }

            this.state = 187;
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
            this.state = 189;
            this.match(MdTemplateParser.FM_LINE_HASH);
            this.state = 193;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 4294967292) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 4294967295) !== 0) || ((((_la - 96)) & ~0x1F) === 0 && ((1 << (_la - 96)) & 255) !== 0)) {
                {
                {
                this.state = 190;
                this.fmCommentItem();
                }
                }
                this.state = 195;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 196;
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
            this.state = 207;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.FM_KEY_BARE:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 198;
                this.match(MdTemplateParser.FM_KEY_BARE);
                }
                break;
            case MdTemplateParser.FM_KEY:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 199;
                this.match(MdTemplateParser.FM_KEY);
                this.state = 201;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 62914560) !== 0)) {
                    {
                    this.state = 200;
                    this.fmValue();
                    }
                }

                this.state = 204;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 26) {
                    {
                    this.state = 203;
                    this.fmInlineComment();
                    }
                }

                this.state = 206;
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
            this.state = 210;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                {
                this.state = 209;
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
                this.state = 212;
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
            this.state = 214;
            this.match(MdTemplateParser.FM_COMMENT_HASH);
            this.state = 218;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 4294967292) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 4294967295) !== 0) || ((((_la - 96)) & ~0x1F) === 0 && ((1 << (_la - 96)) & 255) !== 0)) {
                {
                {
                this.state = 215;
                this.fmCommentItem();
                }
                }
                this.state = 220;
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
            this.state = 229;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 12, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 221;
                this.tagCandidate();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 222;
                this.tagRuleMarker();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 223;
                this.tagBareBracket();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 224;
                this.tagShapedBracket();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 225;
                this.tagProseBracket();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 226;
                this.tagTypeEq();
                }
                break;
            case 7:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 227;
                this.fmHintWord();
                }
                break;
            case 8:
                this.enterOuterAlt(localContext, 8);
                {
                this.state = 228;
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
            this.state = 231;
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
            this.state = 233;
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
            this.state = 235;
            this.match(MdTemplateParser.FM_LINE_START);
            this.state = 237;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 34) {
                {
                this.state = 236;
                this.match(MdTemplateParser.FM_TEXT_REST);
                }
            }

            this.state = 239;
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
            this.state = 244;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 2037760) !== 0)) {
                {
                {
                this.state = 241;
                this.bodyBlock();
                }
                }
                this.state = 246;
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
            this.state = 254;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.H_OPEN:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 247;
                this.bodyHeading();
                }
                break;
            case MdTemplateParser.FENCE_OPEN:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 248;
                this.bodyFence();
                }
                break;
            case MdTemplateParser.BODY_TABLE_ROW:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 249;
                this.bodyTableRow();
                }
                break;
            case MdTemplateParser.BODY_LIST_ITEM:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 250;
                this.bodyListItem();
                }
                break;
            case MdTemplateParser.BODY_HTML_COMMENT:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 251;
                this.bodyHtmlComment();
                }
                break;
            case MdTemplateParser.BODY_BLANK:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 252;
                this.bodyBlankLine();
                }
                break;
            case MdTemplateParser.BODY_TEXT_START:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 253;
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
            this.state = 256;
            this.match(MdTemplateParser.H_OPEN);
            this.state = 260;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 4294967292) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 4294967295) !== 0) || ((((_la - 96)) & ~0x1F) === 0 && ((1 << (_la - 96)) & 255) !== 0)) {
                {
                {
                this.state = 257;
                this.bodyHeadingItem();
                }
                }
                this.state = 262;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 263;
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
            this.state = 271;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 17, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 265;
                this.tagCandidate();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 266;
                this.tagRuleMarker();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 267;
                this.tagBareBracket();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 268;
                this.tagShapedBracket();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 269;
                this.tagProseBracket();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 270;
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
            this.state = 273;
            this.match(MdTemplateParser.FENCE_OPEN);
            this.state = 277;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 13 || _la === 14) {
                {
                {
                this.state = 274;
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
                this.state = 279;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 281;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 15) {
                {
                this.state = 280;
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
            this.state = 283;
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
            this.state = 285;
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
            this.state = 287;
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
            this.state = 289;
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
            this.state = 291;
            this.match(MdTemplateParser.BODY_TEXT_START);
            this.state = 293;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 21) {
                {
                this.state = 292;
                this.match(MdTemplateParser.BODY_TEXT_REST);
                }
            }

            this.state = 295;
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
            this.state = 300;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 4294967292) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 4294967295) !== 0) || ((((_la - 96)) & ~0x1F) === 0 && ((1 << (_la - 96)) & 255) !== 0)) {
                {
                {
                this.state = 297;
                this.fmCommentItem();
                }
                }
                this.state = 302;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 303;
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
            this.state = 305;
            this.fmFilenameLine();
            this.state = 306;
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
            this.state = 311;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 4294967292) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 4294967295) !== 0) || ((((_la - 96)) & ~0x1F) === 0 && ((1 << (_la - 96)) & 255) !== 0)) {
                {
                {
                this.state = 308;
                this.bodyHeadingItem();
                }
                }
                this.state = 313;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 314;
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
            this.state = 347;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 26, this.context) ) {
            case 1:
                localContext = new TagShapedCandidateContext(localContext);
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 316;
                this.match(MdTemplateParser.LBRACK);
                this.state = 317;
                this.tagWord();
                this.state = 318;
                this.match(MdTemplateParser.COLON);
                this.state = 322;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 1584) !== 0) || ((((_la - 37)) & ~0x1F) === 0 && ((1 << (_la - 37)) & 383) !== 0)) {
                    {
                    {
                    this.state = 319;
                    this.tagShapePiece();
                    }
                    }
                    this.state = 324;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                this.state = 325;
                this.match(MdTemplateParser.RBRACK);
                }
                break;
            case 2:
                localContext = new TagClosedCandidateContext(localContext);
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 327;
                this.match(MdTemplateParser.LBRACK);
                this.state = 328;
                this.tagWord();
                this.state = 329;
                this.match(MdTemplateParser.COLON);
                this.state = 333;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 4294967284) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 4294967295) !== 0) || ((((_la - 96)) & ~0x1F) === 0 && ((1 << (_la - 96)) & 255) !== 0)) {
                    {
                    {
                    this.state = 330;
                    this.tagBracketItem();
                    }
                    }
                    this.state = 335;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                this.state = 336;
                this.match(MdTemplateParser.RBRACK);
                }
                break;
            case 3:
                localContext = new TagUnclosedCandidateContext(localContext);
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 338;
                this.match(MdTemplateParser.LBRACK);
                this.state = 339;
                this.tagWord();
                this.state = 340;
                this.match(MdTemplateParser.COLON);
                this.state = 344;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 25, this.context);
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                        {
                        this.state = 341;
                        this.tagBracketItem();
                        }
                        }
                    }
                    this.state = 346;
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
            this.state = 349;
            this.match(MdTemplateParser.LBRACK);
            this.state = 350;
            this.match(MdTemplateParser.RULE);
            this.state = 351;
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
            this.state = 353;
            this.match(MdTemplateParser.LBRACK);
            this.state = 354;
            this.tagHintName();
            this.state = 355;
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
            this.state = 357;
            this.match(MdTemplateParser.LBRACK);
            this.state = 359;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                {
                this.state = 358;
                this.tagShapePiece();
                }
                }
                this.state = 361;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 1584) !== 0) || ((((_la - 37)) & ~0x1F) === 0 && ((1 << (_la - 37)) & 383) !== 0));
            this.state = 363;
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
            this.state = 365;
            this.match(MdTemplateParser.LBRACK);
            this.state = 369;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 4294967284) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 4294967295) !== 0) || ((((_la - 96)) & ~0x1F) === 0 && ((1 << (_la - 96)) & 255) !== 0)) {
                {
                {
                this.state = 366;
                this.tagBracketItem();
                }
                }
                this.state = 371;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 372;
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
            this.state = 376;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 29, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 374;
                this.tagTypeEq();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 375;
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
            this.state = 378;
            this.match(MdTemplateParser.TYPE);
            this.state = 380;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 7) {
                {
                this.state = 379;
                this.match(MdTemplateParser.WS);
                }
            }

            this.state = 382;
            this.match(MdTemplateParser.EQ);
            this.state = 384;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 7) {
                {
                this.state = 383;
                this.match(MdTemplateParser.WS);
                }
            }

            this.state = 386;
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
            this.state = 389;
            this.errorHandler.sync(this);
            alternative = 1;
            do {
                switch (alternative) {
                case 1:
                    {
                    {
                    this.state = 388;
                    this.tagHintPiece();
                    }
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                this.state = 391;
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
            this.state = 396;
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
                this.state = 393;
                this.tagWord();
                }
                break;
            case MdTemplateParser.UWORD:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 394;
                this.match(MdTemplateParser.UWORD);
                }
                break;
            case MdTemplateParser.DASH:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 395;
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
            this.state = 401;
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
                this.state = 398;
                this.tagWord();
                }
                break;
            case MdTemplateParser.DASH:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 399;
                this.match(MdTemplateParser.DASH);
                }
                break;
            case MdTemplateParser.COLON:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 400;
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
            this.state = 403;
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
            this.state = 405;
            this.match(MdTemplateParser.LBRACK);
            this.state = 406;
            this.tagFamily();
            this.state = 407;
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
            this.state = 409;
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
            this.state = 412;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 81) {
                {
                this.state = 411;
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
            this.state = 414;
            this.match(MdTemplateParser.LBRACK);
            this.state = 415;
            this.fmTagBody();
            this.state = 416;
            this.match(MdTemplateParser.RBRACK);
            this.state = 417;
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
            this.state = 427;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.PRESENCE:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 419;
                this.fmPresenceTag();
                }
                break;
            case MdTemplateParser.FORMAT:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 420;
                this.fmFormatTag();
                }
                break;
            case MdTemplateParser.VALUE:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 421;
                this.fmValueTag();
                }
                break;
            case MdTemplateParser.COUNT:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 422;
                this.fmCountTag();
                }
                break;
            case MdTemplateParser.RANGE:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 423;
                this.fmRangeTag();
                }
                break;
            case MdTemplateParser.ORDER:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 424;
                this.fmOrderTag();
                }
                break;
            case MdTemplateParser.IO:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 425;
                this.fmIoTag();
                }
                break;
            case MdTemplateParser.FILENAME_CS:
                this.enterOuterAlt(localContext, 8);
                {
                this.state = 426;
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
            this.state = 429;
            this.match(MdTemplateParser.PRESENCE);
            this.state = 430;
            this.match(MdTemplateParser.COLON);
            this.state = 435;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.REQUIRED:
                {
                this.state = 431;
                this.match(MdTemplateParser.REQUIRED);
                }
                break;
            case MdTemplateParser.OPTIONAL:
                {
                this.state = 432;
                this.match(MdTemplateParser.OPTIONAL);
                }
                break;
            case MdTemplateParser.CONDITIONAL_ARG:
                {
                this.state = 433;
                this.match(MdTemplateParser.CONDITIONAL_ARG);
                this.state = 434;
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
            this.state = 437;
            this.match(MdTemplateParser.FORMAT);
            this.state = 438;
            this.match(MdTemplateParser.COLON);
            this.state = 447;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.CONSTANT_ARG:
                {
                this.state = 439;
                this.match(MdTemplateParser.CONSTANT_ARG);
                this.state = 440;
                this.tagFreeText();
                }
                break;
            case MdTemplateParser.SNAKE_CASE_CS:
            case MdTemplateParser.KEBAB_CASE_CS:
            case MdTemplateParser.SNAKE_CASE:
            case MdTemplateParser.KEBAB_CASE:
                {
                this.state = 441;
                this.fmCaseStyle();
                }
                break;
            case MdTemplateParser.ELEMENTS:
                {
                this.state = 442;
                this.match(MdTemplateParser.ELEMENTS);
                this.state = 443;
                this.match(MdTemplateParser.COLON);
                this.state = 444;
                this.fmCaseStyle();
                }
                break;
            case MdTemplateParser.SCHEME_ARG:
                {
                this.state = 445;
                this.match(MdTemplateParser.SCHEME_ARG);
                this.state = 446;
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
            this.state = 449;
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
            this.state = 451;
            this.match(MdTemplateParser.VALUE);
            this.state = 452;
            this.match(MdTemplateParser.COLON);
            this.state = 453;
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
            this.state = 455;
            this.match(MdTemplateParser.COUNT);
            this.state = 456;
            this.match(MdTemplateParser.COLON);
            this.state = 457;
            this.fmBound();
            this.state = 458;
            this.match(MdTemplateParser.COLON);
            this.state = 459;
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
            this.state = 461;
            this.match(MdTemplateParser.RANGE);
            this.state = 462;
            this.match(MdTemplateParser.COLON);
            this.state = 463;
            this.fmBound();
            this.state = 464;
            this.match(MdTemplateParser.COLON);
            this.state = 465;
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
            this.state = 467;
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
            this.state = 470;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 5) {
                {
                this.state = 469;
                this.match(MdTemplateParser.DASH);
                }
            }

            this.state = 472;
            this.match(MdTemplateParser.NUMBER);
            this.state = 475;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 6) {
                {
                this.state = 473;
                this.match(MdTemplateParser.DOT);
                this.state = 474;
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
            this.state = 477;
            this.match(MdTemplateParser.ORDER);
            this.state = 478;
            this.match(MdTemplateParser.COLON);
            this.state = 479;
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
            this.state = 481;
            this.match(MdTemplateParser.IO);
            this.state = 482;
            this.match(MdTemplateParser.COLON);
            this.state = 483;
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
            this.state = 485;
            this.match(MdTemplateParser.FILENAME_CS);
            this.state = 486;
            this.match(MdTemplateParser.COLON);
            this.state = 487;
            this.match(MdTemplateParser.CASE_CS);
            this.state = 488;
            this.match(MdTemplateParser.COLON);
            this.state = 489;
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
            this.state = 491;
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
            this.state = 493;
            this.match(MdTemplateParser.LBRACK);
            this.state = 494;
            this.bodyTagBody();
            this.state = 495;
            this.match(MdTemplateParser.RBRACK);
            this.state = 496;
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
            this.state = 500;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.PRESENCE:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 498;
                this.bodyPresenceTag();
                }
                break;
            case MdTemplateParser.CONTENT:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 499;
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
            this.state = 502;
            this.match(MdTemplateParser.PRESENCE);
            this.state = 503;
            this.match(MdTemplateParser.COLON);
            this.state = 510;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.REQUIRED:
                {
                this.state = 504;
                this.match(MdTemplateParser.REQUIRED);
                }
                break;
            case MdTemplateParser.OPTIONAL:
                {
                this.state = 505;
                this.match(MdTemplateParser.OPTIONAL);
                }
                break;
            case MdTemplateParser.EXIST:
                {
                this.state = 506;
                this.match(MdTemplateParser.EXIST);
                }
                break;
            case MdTemplateParser.TEMPLATE_ONLY:
                {
                this.state = 507;
                this.match(MdTemplateParser.TEMPLATE_ONLY);
                }
                break;
            case MdTemplateParser.CONDITIONAL_ARG:
                {
                this.state = 508;
                this.match(MdTemplateParser.CONDITIONAL_ARG);
                this.state = 509;
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
            this.state = 512;
            this.match(MdTemplateParser.CONTENT);
            this.state = 513;
            this.match(MdTemplateParser.COLON);
            this.state = 523;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.NON_EMPTY:
                {
                this.state = 514;
                this.match(MdTemplateParser.NON_EMPTY);
                }
                break;
            case MdTemplateParser.TABLE:
                {
                this.state = 515;
                this.match(MdTemplateParser.TABLE);
                }
                break;
            case MdTemplateParser.LIST:
                {
                this.state = 516;
                this.match(MdTemplateParser.LIST);
                }
                break;
            case MdTemplateParser.MIN_LINES:
                {
                this.state = 517;
                this.match(MdTemplateParser.MIN_LINES);
                this.state = 518;
                this.match(MdTemplateParser.COLON);
                this.state = 519;
                this.match(MdTemplateParser.NUMBER);
                }
                break;
            case MdTemplateParser.MAX_LINES:
                {
                this.state = 520;
                this.match(MdTemplateParser.MAX_LINES);
                this.state = 521;
                this.match(MdTemplateParser.COLON);
                this.state = 522;
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
    public directiveScanEntry(): DirectiveScanEntryContext {
        let localContext = new DirectiveScanEntryContext(this.context, this.state);
        this.enterRule(localContext, 116, MdTemplateParser.RULE_directiveScanEntry);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 528;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 1 || ((((_la - 83)) & ~0x1F) === 0 && ((1 << (_la - 83)) & 31) !== 0)) {
                {
                {
                this.state = 525;
                this.directiveScanLine();
                }
                }
                this.state = 530;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 531;
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
    public directiveScanLine(): DirectiveScanLineContext {
        let localContext = new DirectiveScanLineContext(this.context, this.state);
        this.enterRule(localContext, 118, MdTemplateParser.RULE_directiveScanLine);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 536;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 83)) & ~0x1F) === 0 && ((1 << (_la - 83)) & 31) !== 0)) {
                {
                {
                this.state = 533;
                this.directiveScanItem();
                }
                }
                this.state = 538;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 539;
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
    public directiveScanItem(): DirectiveScanItemContext {
        let localContext = new DirectiveScanItemContext(this.context, this.state);
        this.enterRule(localContext, 120, MdTemplateParser.RULE_directiveScanItem);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 541;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 83)) & ~0x1F) === 0 && ((1 << (_la - 83)) & 31) !== 0))) {
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
    public directiveEntry(): DirectiveEntryContext {
        let localContext = new DirectiveEntryContext(this.context, this.state);
        this.enterRule(localContext, 122, MdTemplateParser.RULE_directiveEntry);
        let _la: number;
        try {
            this.state = 552;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 47, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 544;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 7) {
                    {
                    this.state = 543;
                    this.match(MdTemplateParser.WS);
                    }
                }

                this.state = 546;
                this.directive();
                this.state = 547;
                this.match(MdTemplateParser.EOF);
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 549;
                this.directiveProse();
                this.state = 550;
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
    public directive(): DirectiveContext {
        let localContext = new DirectiveContext(this.context, this.state);
        this.enterRule(localContext, 124, MdTemplateParser.RULE_directive);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 554;
            this.match(MdTemplateParser.DIR_KEYWORD);
            this.state = 560;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 7) {
                {
                this.state = 555;
                this.match(MdTemplateParser.WS);
                this.state = 557;
                this.errorHandler.sync(this);
                switch (this.interpreter.adaptivePredict(this.tokenStream, 48, this.context) ) {
                case 1:
                    {
                    this.state = 556;
                    this.directiveHead();
                    }
                    break;
                }
                this.state = 559;
                this.directiveArgs();
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
    public directiveHead(): DirectiveHeadContext {
        let localContext = new DirectiveHeadContext(this.context, this.state);
        this.enterRule(localContext, 126, MdTemplateParser.RULE_directiveHead);
        try {
            this.state = 567;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 50, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 562;
                this.directiveVerb();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 563;
                this.directiveUnknown();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 564;
                this.directiveSep();
                this.state = 565;
                this.directiveMisplaced();
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
    public directiveMisplaced(): DirectiveMisplacedContext {
        let localContext = new DirectiveMisplacedContext(this.context, this.state);
        this.enterRule(localContext, 128, MdTemplateParser.RULE_directiveMisplaced);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 569;
            this.directiveItem();
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
    public directiveVerb(): DirectiveVerbContext {
        let localContext = new DirectiveVerbContext(this.context, this.state);
        this.enterRule(localContext, 130, MdTemplateParser.RULE_directiveVerb);
        try {
            this.state = 581;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.DIR_DISABLE:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 571;
                this.match(MdTemplateParser.DIR_DISABLE);
                }
                break;
            case MdTemplateParser.DIR_DISABLE_LINE:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 572;
                this.match(MdTemplateParser.DIR_DISABLE_LINE);
                }
                break;
            case MdTemplateParser.DIR_DISABLE_NEXT_LINE:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 573;
                this.match(MdTemplateParser.DIR_DISABLE_NEXT_LINE);
                }
                break;
            case MdTemplateParser.DIR_DISABLE_FILE:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 574;
                this.match(MdTemplateParser.DIR_DISABLE_FILE);
                }
                break;
            case MdTemplateParser.DIR_BEGIN:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 575;
                this.match(MdTemplateParser.DIR_BEGIN);
                this.state = 576;
                this.match(MdTemplateParser.WS);
                this.state = 577;
                this.match(MdTemplateParser.DIR_DISABLE);
                }
                break;
            case MdTemplateParser.DIR_END:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 578;
                this.match(MdTemplateParser.DIR_END);
                this.state = 579;
                this.match(MdTemplateParser.WS);
                this.state = 580;
                this.match(MdTemplateParser.DIR_DISABLE);
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
    public directiveUnknown(): DirectiveUnknownContext {
        let localContext = new DirectiveUnknownContext(this.context, this.state);
        this.enterRule(localContext, 132, MdTemplateParser.RULE_directiveUnknown);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 583;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 88)) & ~0x1F) === 0 && ((1 << (_la - 88)) & 609) !== 0))) {
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
    public directiveArgs(): DirectiveArgsContext {
        let localContext = new DirectiveArgsContext(this.context, this.state);
        this.enterRule(localContext, 134, MdTemplateParser.RULE_directiveArgs);
        let _la: number;
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 590;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 52, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 585;
                    this.directiveSep();
                    this.state = 586;
                    this.directiveItem();
                    }
                    }
                }
                this.state = 592;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 52, this.context);
            }
            this.state = 594;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 7 || _la === 96) {
                {
                this.state = 593;
                this.directiveSep();
                }
            }

            this.state = 597;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 95) {
                {
                this.state = 596;
                this.directiveReason();
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
    public directiveSep(): DirectiveSepContext {
        let localContext = new DirectiveSepContext(this.context, this.state);
        this.enterRule(localContext, 136, MdTemplateParser.RULE_directiveSep);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 600;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                {
                this.state = 599;
                _la = this.tokenStream.LA(1);
                if(!(_la === 7 || _la === 96)) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                }
                }
                this.state = 602;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while (_la === 7 || _la === 96);
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
    public directiveItem(): DirectiveItemContext {
        let localContext = new DirectiveItemContext(this.context, this.state);
        this.enterRule(localContext, 138, MdTemplateParser.RULE_directiveItem);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 604;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 88)) & ~0x1F) === 0 && ((1 << (_la - 88)) & 639) !== 0))) {
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
    public directiveReason(): DirectiveReasonContext {
        let localContext = new DirectiveReasonContext(this.context, this.state);
        this.enterRule(localContext, 140, MdTemplateParser.RULE_directiveReason);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 606;
            this.match(MdTemplateParser.DIR_REASON);
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
    public directiveProse(): DirectiveProseContext {
        let localContext = new DirectiveProseContext(this.context, this.state);
        this.enterRule(localContext, 142, MdTemplateParser.RULE_directiveProse);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 614;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 7 || ((((_la - 88)) & ~0x1F) === 0 && ((1 << (_la - 88)) & 1023) !== 0)) {
                {
                this.state = 612;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case MdTemplateParser.WS:
                    {
                    this.state = 608;
                    this.match(MdTemplateParser.WS);
                    }
                    break;
                case MdTemplateParser.DIR_COMMA:
                    {
                    this.state = 609;
                    this.match(MdTemplateParser.DIR_COMMA);
                    }
                    break;
                case MdTemplateParser.DIR_REASON:
                    {
                    this.state = 610;
                    this.match(MdTemplateParser.DIR_REASON);
                    }
                    break;
                case MdTemplateParser.DIR_KEYWORD:
                case MdTemplateParser.DIR_DISABLE:
                case MdTemplateParser.DIR_DISABLE_LINE:
                case MdTemplateParser.DIR_DISABLE_NEXT_LINE:
                case MdTemplateParser.DIR_DISABLE_FILE:
                case MdTemplateParser.DIR_BEGIN:
                case MdTemplateParser.DIR_END:
                case MdTemplateParser.DIR_WORD:
                    {
                    this.state = 611;
                    this.directiveItem();
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 616;
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

    public static readonly _serializedATN: number[] = [
        4,1,103,618,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,
        7,6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,13,7,
        13,2,14,7,14,2,15,7,15,2,16,7,16,2,17,7,17,2,18,7,18,2,19,7,19,2,
        20,7,20,2,21,7,21,2,22,7,22,2,23,7,23,2,24,7,24,2,25,7,25,2,26,7,
        26,2,27,7,27,2,28,7,28,2,29,7,29,2,30,7,30,2,31,7,31,2,32,7,32,2,
        33,7,33,2,34,7,34,2,35,7,35,2,36,7,36,2,37,7,37,2,38,7,38,2,39,7,
        39,2,40,7,40,2,41,7,41,2,42,7,42,2,43,7,43,2,44,7,44,2,45,7,45,2,
        46,7,46,2,47,7,47,2,48,7,48,2,49,7,49,2,50,7,50,2,51,7,51,2,52,7,
        52,2,53,7,53,2,54,7,54,2,55,7,55,2,56,7,56,2,57,7,57,2,58,7,58,2,
        59,7,59,2,60,7,60,2,61,7,61,2,62,7,62,2,63,7,63,2,64,7,64,2,65,7,
        65,2,66,7,66,2,67,7,67,2,68,7,68,2,69,7,69,2,70,7,70,2,71,7,71,1,
        0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,3,0,155,8,0,1,1,1,1,5,1,159,
        8,1,10,1,12,1,162,9,1,1,1,1,1,1,2,1,2,5,2,168,8,2,10,2,12,2,171,
        9,2,1,3,1,3,1,3,1,3,1,3,3,3,178,8,3,1,4,1,4,3,4,182,8,4,1,4,1,4,
        3,4,186,8,4,1,4,1,4,1,5,1,5,5,5,192,8,5,10,5,12,5,195,9,5,1,5,1,
        5,1,6,1,6,1,6,3,6,202,8,6,1,6,3,6,205,8,6,1,6,3,6,208,8,6,1,7,4,
        7,211,8,7,11,7,12,7,212,1,8,1,8,5,8,217,8,8,10,8,12,8,220,9,8,1,
        9,1,9,1,9,1,9,1,9,1,9,1,9,1,9,3,9,230,8,9,1,10,1,10,1,11,1,11,1,
        12,1,12,3,12,238,8,12,1,12,1,12,1,13,5,13,243,8,13,10,13,12,13,246,
        9,13,1,14,1,14,1,14,1,14,1,14,1,14,1,14,3,14,255,8,14,1,15,1,15,
        5,15,259,8,15,10,15,12,15,262,9,15,1,15,1,15,1,16,1,16,1,16,1,16,
        1,16,1,16,3,16,272,8,16,1,17,1,17,5,17,276,8,17,10,17,12,17,279,
        9,17,1,17,3,17,282,8,17,1,18,1,18,1,19,1,19,1,20,1,20,1,21,1,21,
        1,22,1,22,3,22,294,8,22,1,22,1,22,1,23,5,23,299,8,23,10,23,12,23,
        302,9,23,1,23,1,23,1,24,1,24,1,24,1,25,5,25,310,8,25,10,25,12,25,
        313,9,25,1,25,1,25,1,26,1,26,1,26,1,26,5,26,321,8,26,10,26,12,26,
        324,9,26,1,26,1,26,1,26,1,26,1,26,1,26,5,26,332,8,26,10,26,12,26,
        335,9,26,1,26,1,26,1,26,1,26,1,26,1,26,5,26,343,8,26,10,26,12,26,
        346,9,26,3,26,348,8,26,1,27,1,27,1,27,1,27,1,28,1,28,1,28,1,28,1,
        29,1,29,4,29,360,8,29,11,29,12,29,361,1,29,1,29,1,30,1,30,5,30,368,
        8,30,10,30,12,30,371,9,30,1,30,1,30,1,31,1,31,3,31,377,8,31,1,32,
        1,32,3,32,381,8,32,1,32,1,32,3,32,385,8,32,1,32,1,32,1,33,4,33,390,
        8,33,11,33,12,33,391,1,34,1,34,1,34,3,34,397,8,34,1,35,1,35,1,35,
        3,35,402,8,35,1,36,1,36,1,37,1,37,1,37,1,37,1,38,1,38,1,39,3,39,
        413,8,39,1,40,1,40,1,40,1,40,1,40,1,41,1,41,1,41,1,41,1,41,1,41,
        1,41,1,41,3,41,428,8,41,1,42,1,42,1,42,1,42,1,42,1,42,3,42,436,8,
        42,1,43,1,43,1,43,1,43,1,43,1,43,1,43,1,43,1,43,1,43,3,43,448,8,
        43,1,44,1,44,1,45,1,45,1,45,1,45,1,46,1,46,1,46,1,46,1,46,1,46,1,
        47,1,47,1,47,1,47,1,47,1,47,1,48,1,48,1,49,3,49,471,8,49,1,49,1,
        49,1,49,3,49,476,8,49,1,50,1,50,1,50,1,50,1,51,1,51,1,51,1,51,1,
        52,1,52,1,52,1,52,1,52,1,52,1,53,1,53,1,54,1,54,1,54,1,54,1,54,1,
        55,1,55,3,55,501,8,55,1,56,1,56,1,56,1,56,1,56,1,56,1,56,1,56,3,
        56,511,8,56,1,57,1,57,1,57,1,57,1,57,1,57,1,57,1,57,1,57,1,57,1,
        57,3,57,524,8,57,1,58,5,58,527,8,58,10,58,12,58,530,9,58,1,58,1,
        58,1,59,5,59,535,8,59,10,59,12,59,538,9,59,1,59,1,59,1,60,1,60,1,
        61,3,61,545,8,61,1,61,1,61,1,61,1,61,1,61,1,61,3,61,553,8,61,1,62,
        1,62,1,62,3,62,558,8,62,1,62,3,62,561,8,62,1,63,1,63,1,63,1,63,1,
        63,3,63,568,8,63,1,64,1,64,1,65,1,65,1,65,1,65,1,65,1,65,1,65,1,
        65,1,65,1,65,3,65,582,8,65,1,66,1,66,1,67,1,67,1,67,5,67,589,8,67,
        10,67,12,67,592,9,67,1,67,3,67,595,8,67,1,67,3,67,598,8,67,1,68,
        4,68,601,8,68,11,68,12,68,602,1,69,1,69,1,70,1,70,1,71,1,71,1,71,
        1,71,5,71,613,8,71,10,71,12,71,616,9,71,1,71,0,0,72,0,2,4,6,8,10,
        12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50,52,54,
        56,58,60,62,64,66,68,70,72,74,76,78,80,82,84,86,88,90,92,94,96,98,
        100,102,104,106,108,110,112,114,116,118,120,122,124,126,128,130,
        132,134,136,138,140,142,0,15,1,0,22,25,1,0,1,1,2,0,37,37,40,44,1,
        0,13,14,2,0,1,1,3,3,3,0,9,10,37,43,45,45,2,0,51,51,53,60,2,0,47,
        48,66,67,2,0,51,51,68,68,1,0,69,70,1,0,47,50,1,0,83,87,3,0,88,88,
        93,94,97,97,2,0,7,7,96,96,2,0,88,94,97,97,647,0,154,1,0,0,0,2,156,
        1,0,0,0,4,165,1,0,0,0,6,177,1,0,0,0,8,179,1,0,0,0,10,189,1,0,0,0,
        12,207,1,0,0,0,14,210,1,0,0,0,16,214,1,0,0,0,18,229,1,0,0,0,20,231,
        1,0,0,0,22,233,1,0,0,0,24,235,1,0,0,0,26,244,1,0,0,0,28,254,1,0,
        0,0,30,256,1,0,0,0,32,271,1,0,0,0,34,273,1,0,0,0,36,283,1,0,0,0,
        38,285,1,0,0,0,40,287,1,0,0,0,42,289,1,0,0,0,44,291,1,0,0,0,46,300,
        1,0,0,0,48,305,1,0,0,0,50,311,1,0,0,0,52,347,1,0,0,0,54,349,1,0,
        0,0,56,353,1,0,0,0,58,357,1,0,0,0,60,365,1,0,0,0,62,376,1,0,0,0,
        64,378,1,0,0,0,66,389,1,0,0,0,68,396,1,0,0,0,70,401,1,0,0,0,72,403,
        1,0,0,0,74,405,1,0,0,0,76,409,1,0,0,0,78,412,1,0,0,0,80,414,1,0,
        0,0,82,427,1,0,0,0,84,429,1,0,0,0,86,437,1,0,0,0,88,449,1,0,0,0,
        90,451,1,0,0,0,92,455,1,0,0,0,94,461,1,0,0,0,96,467,1,0,0,0,98,470,
        1,0,0,0,100,477,1,0,0,0,102,481,1,0,0,0,104,485,1,0,0,0,106,491,
        1,0,0,0,108,493,1,0,0,0,110,500,1,0,0,0,112,502,1,0,0,0,114,512,
        1,0,0,0,116,528,1,0,0,0,118,536,1,0,0,0,120,541,1,0,0,0,122,552,
        1,0,0,0,124,554,1,0,0,0,126,567,1,0,0,0,128,569,1,0,0,0,130,581,
        1,0,0,0,132,583,1,0,0,0,134,590,1,0,0,0,136,600,1,0,0,0,138,604,
        1,0,0,0,140,606,1,0,0,0,142,614,1,0,0,0,144,145,3,2,1,0,145,146,
        3,26,13,0,146,147,5,0,0,1,147,155,1,0,0,0,148,149,3,4,2,0,149,150,
        5,0,0,1,150,155,1,0,0,0,151,152,3,26,13,0,152,153,5,0,0,1,153,155,
        1,0,0,0,154,144,1,0,0,0,154,148,1,0,0,0,154,151,1,0,0,0,155,1,1,
        0,0,0,156,160,5,27,0,0,157,159,3,6,3,0,158,157,1,0,0,0,159,162,1,
        0,0,0,160,158,1,0,0,0,160,161,1,0,0,0,161,163,1,0,0,0,162,160,1,
        0,0,0,163,164,5,28,0,0,164,3,1,0,0,0,165,169,5,27,0,0,166,168,3,
        6,3,0,167,166,1,0,0,0,168,171,1,0,0,0,169,167,1,0,0,0,169,170,1,
        0,0,0,170,5,1,0,0,0,171,169,1,0,0,0,172,178,3,8,4,0,173,178,3,10,
        5,0,174,178,3,12,6,0,175,178,3,22,11,0,176,178,3,24,12,0,177,172,
        1,0,0,0,177,173,1,0,0,0,177,174,1,0,0,0,177,175,1,0,0,0,177,176,
        1,0,0,0,178,7,1,0,0,0,179,181,5,30,0,0,180,182,5,7,0,0,181,180,1,
        0,0,0,181,182,1,0,0,0,182,183,1,0,0,0,183,185,3,52,26,0,184,186,
        5,7,0,0,185,184,1,0,0,0,185,186,1,0,0,0,186,187,1,0,0,0,187,188,
        5,1,0,0,188,9,1,0,0,0,189,193,5,30,0,0,190,192,3,18,9,0,191,190,
        1,0,0,0,192,195,1,0,0,0,193,191,1,0,0,0,193,194,1,0,0,0,194,196,
        1,0,0,0,195,193,1,0,0,0,196,197,5,1,0,0,197,11,1,0,0,0,198,208,5,
        32,0,0,199,201,5,31,0,0,200,202,3,14,7,0,201,200,1,0,0,0,201,202,
        1,0,0,0,202,204,1,0,0,0,203,205,3,16,8,0,204,203,1,0,0,0,204,205,
        1,0,0,0,205,206,1,0,0,0,206,208,5,1,0,0,207,198,1,0,0,0,207,199,
        1,0,0,0,208,13,1,0,0,0,209,211,7,0,0,0,210,209,1,0,0,0,211,212,1,
        0,0,0,212,210,1,0,0,0,212,213,1,0,0,0,213,15,1,0,0,0,214,218,5,26,
        0,0,215,217,3,18,9,0,216,215,1,0,0,0,217,220,1,0,0,0,218,216,1,0,
        0,0,218,219,1,0,0,0,219,17,1,0,0,0,220,218,1,0,0,0,221,230,3,52,
        26,0,222,230,3,54,27,0,223,230,3,56,28,0,224,230,3,58,29,0,225,230,
        3,60,30,0,226,230,3,64,32,0,227,230,3,20,10,0,228,230,8,1,0,0,229,
        221,1,0,0,0,229,222,1,0,0,0,229,223,1,0,0,0,229,224,1,0,0,0,229,
        225,1,0,0,0,229,226,1,0,0,0,229,227,1,0,0,0,229,228,1,0,0,0,230,
        19,1,0,0,0,231,232,7,2,0,0,232,21,1,0,0,0,233,234,5,29,0,0,234,23,
        1,0,0,0,235,237,5,33,0,0,236,238,5,34,0,0,237,236,1,0,0,0,237,238,
        1,0,0,0,238,239,1,0,0,0,239,240,5,1,0,0,240,25,1,0,0,0,241,243,3,
        28,14,0,242,241,1,0,0,0,243,246,1,0,0,0,244,242,1,0,0,0,244,245,
        1,0,0,0,245,27,1,0,0,0,246,244,1,0,0,0,247,255,3,30,15,0,248,255,
        3,34,17,0,249,255,3,36,18,0,250,255,3,38,19,0,251,255,3,40,20,0,
        252,255,3,42,21,0,253,255,3,44,22,0,254,247,1,0,0,0,254,248,1,0,
        0,0,254,249,1,0,0,0,254,250,1,0,0,0,254,251,1,0,0,0,254,252,1,0,
        0,0,254,253,1,0,0,0,255,29,1,0,0,0,256,260,5,11,0,0,257,259,3,32,
        16,0,258,257,1,0,0,0,259,262,1,0,0,0,260,258,1,0,0,0,260,261,1,0,
        0,0,261,263,1,0,0,0,262,260,1,0,0,0,263,264,5,1,0,0,264,31,1,0,0,
        0,265,272,3,52,26,0,266,272,3,54,27,0,267,272,3,56,28,0,268,272,
        3,58,29,0,269,272,3,60,30,0,270,272,8,1,0,0,271,265,1,0,0,0,271,
        266,1,0,0,0,271,267,1,0,0,0,271,268,1,0,0,0,271,269,1,0,0,0,271,
        270,1,0,0,0,272,33,1,0,0,0,273,277,5,12,0,0,274,276,7,3,0,0,275,
        274,1,0,0,0,276,279,1,0,0,0,277,275,1,0,0,0,277,278,1,0,0,0,278,
        281,1,0,0,0,279,277,1,0,0,0,280,282,5,15,0,0,281,280,1,0,0,0,281,
        282,1,0,0,0,282,35,1,0,0,0,283,284,5,16,0,0,284,37,1,0,0,0,285,286,
        5,17,0,0,286,39,1,0,0,0,287,288,5,18,0,0,288,41,1,0,0,0,289,290,
        5,19,0,0,290,43,1,0,0,0,291,293,5,20,0,0,292,294,5,21,0,0,293,292,
        1,0,0,0,293,294,1,0,0,0,294,295,1,0,0,0,295,296,5,1,0,0,296,45,1,
        0,0,0,297,299,3,18,9,0,298,297,1,0,0,0,299,302,1,0,0,0,300,298,1,
        0,0,0,300,301,1,0,0,0,301,303,1,0,0,0,302,300,1,0,0,0,303,304,5,
        0,0,1,304,47,1,0,0,0,305,306,3,8,4,0,306,307,5,0,0,1,307,49,1,0,
        0,0,308,310,3,32,16,0,309,308,1,0,0,0,310,313,1,0,0,0,311,309,1,
        0,0,0,311,312,1,0,0,0,312,314,1,0,0,0,313,311,1,0,0,0,314,315,5,
        0,0,1,315,51,1,0,0,0,316,317,5,2,0,0,317,318,3,72,36,0,318,322,5,
        4,0,0,319,321,3,70,35,0,320,319,1,0,0,0,321,324,1,0,0,0,322,320,
        1,0,0,0,322,323,1,0,0,0,323,325,1,0,0,0,324,322,1,0,0,0,325,326,
        5,3,0,0,326,348,1,0,0,0,327,328,5,2,0,0,328,329,3,72,36,0,329,333,
        5,4,0,0,330,332,3,62,31,0,331,330,1,0,0,0,332,335,1,0,0,0,333,331,
        1,0,0,0,333,334,1,0,0,0,334,336,1,0,0,0,335,333,1,0,0,0,336,337,
        5,3,0,0,337,348,1,0,0,0,338,339,5,2,0,0,339,340,3,72,36,0,340,344,
        5,4,0,0,341,343,3,62,31,0,342,341,1,0,0,0,343,346,1,0,0,0,344,342,
        1,0,0,0,344,345,1,0,0,0,345,348,1,0,0,0,346,344,1,0,0,0,347,316,
        1,0,0,0,347,327,1,0,0,0,347,338,1,0,0,0,348,53,1,0,0,0,349,350,5,
        2,0,0,350,351,5,39,0,0,351,352,5,3,0,0,352,55,1,0,0,0,353,354,5,
        2,0,0,354,355,3,66,33,0,355,356,5,3,0,0,356,57,1,0,0,0,357,359,5,
        2,0,0,358,360,3,70,35,0,359,358,1,0,0,0,360,361,1,0,0,0,361,359,
        1,0,0,0,361,362,1,0,0,0,362,363,1,0,0,0,363,364,5,3,0,0,364,59,1,
        0,0,0,365,369,5,2,0,0,366,368,3,62,31,0,367,366,1,0,0,0,368,371,
        1,0,0,0,369,367,1,0,0,0,369,370,1,0,0,0,370,372,1,0,0,0,371,369,
        1,0,0,0,372,373,5,3,0,0,373,61,1,0,0,0,374,377,3,64,32,0,375,377,
        8,4,0,0,376,374,1,0,0,0,376,375,1,0,0,0,377,63,1,0,0,0,378,380,5,
        38,0,0,379,381,5,7,0,0,380,379,1,0,0,0,380,381,1,0,0,0,381,382,1,
        0,0,0,382,384,5,35,0,0,383,385,5,7,0,0,384,383,1,0,0,0,384,385,1,
        0,0,0,385,386,1,0,0,0,386,387,3,66,33,0,387,65,1,0,0,0,388,390,3,
        68,34,0,389,388,1,0,0,0,390,391,1,0,0,0,391,389,1,0,0,0,391,392,
        1,0,0,0,392,67,1,0,0,0,393,397,3,72,36,0,394,397,5,46,0,0,395,397,
        5,5,0,0,396,393,1,0,0,0,396,394,1,0,0,0,396,395,1,0,0,0,397,69,1,
        0,0,0,398,402,3,72,36,0,399,402,5,5,0,0,400,402,5,4,0,0,401,398,
        1,0,0,0,401,399,1,0,0,0,401,400,1,0,0,0,402,71,1,0,0,0,403,404,7,
        5,0,0,404,73,1,0,0,0,405,406,5,2,0,0,406,407,3,76,38,0,407,408,5,
        4,0,0,408,75,1,0,0,0,409,410,7,6,0,0,410,77,1,0,0,0,411,413,5,81,
        0,0,412,411,1,0,0,0,412,413,1,0,0,0,413,79,1,0,0,0,414,415,5,2,0,
        0,415,416,3,82,41,0,416,417,5,3,0,0,417,418,5,0,0,1,418,81,1,0,0,
        0,419,428,3,84,42,0,420,428,3,86,43,0,421,428,3,90,45,0,422,428,
        3,92,46,0,423,428,3,94,47,0,424,428,3,100,50,0,425,428,3,102,51,
        0,426,428,3,104,52,0,427,419,1,0,0,0,427,420,1,0,0,0,427,421,1,0,
        0,0,427,422,1,0,0,0,427,423,1,0,0,0,427,424,1,0,0,0,427,425,1,0,
        0,0,427,426,1,0,0,0,428,83,1,0,0,0,429,430,5,53,0,0,430,435,5,4,
        0,0,431,436,5,61,0,0,432,436,5,62,0,0,433,434,5,78,0,0,434,436,3,
        78,39,0,435,431,1,0,0,0,435,432,1,0,0,0,435,433,1,0,0,0,436,85,1,
        0,0,0,437,438,5,54,0,0,438,447,5,4,0,0,439,440,5,79,0,0,440,448,
        3,78,39,0,441,448,3,88,44,0,442,443,5,65,0,0,443,444,5,4,0,0,444,
        448,3,88,44,0,445,446,5,80,0,0,446,448,5,82,0,0,447,439,1,0,0,0,
        447,441,1,0,0,0,447,442,1,0,0,0,447,445,1,0,0,0,448,87,1,0,0,0,449,
        450,7,7,0,0,450,89,1,0,0,0,451,452,5,55,0,0,452,453,5,4,0,0,453,
        454,7,8,0,0,454,91,1,0,0,0,455,456,5,56,0,0,456,457,5,4,0,0,457,
        458,3,96,48,0,458,459,5,4,0,0,459,460,5,9,0,0,460,93,1,0,0,0,461,
        462,5,57,0,0,462,463,5,4,0,0,463,464,3,96,48,0,464,465,5,4,0,0,465,
        466,3,98,49,0,466,95,1,0,0,0,467,468,7,9,0,0,468,97,1,0,0,0,469,
        471,5,5,0,0,470,469,1,0,0,0,470,471,1,0,0,0,471,472,1,0,0,0,472,
        475,5,9,0,0,473,474,5,6,0,0,474,476,5,9,0,0,475,473,1,0,0,0,475,
        476,1,0,0,0,476,99,1,0,0,0,477,478,5,58,0,0,478,479,5,4,0,0,479,
        480,5,71,0,0,480,101,1,0,0,0,481,482,5,59,0,0,482,483,5,4,0,0,483,
        484,5,72,0,0,484,103,1,0,0,0,485,486,5,51,0,0,486,487,5,4,0,0,487,
        488,5,52,0,0,488,489,5,4,0,0,489,490,3,106,53,0,490,105,1,0,0,0,
        491,492,7,10,0,0,492,107,1,0,0,0,493,494,5,2,0,0,494,495,3,110,55,
        0,495,496,5,3,0,0,496,497,5,0,0,1,497,109,1,0,0,0,498,501,3,112,
        56,0,499,501,3,114,57,0,500,498,1,0,0,0,500,499,1,0,0,0,501,111,
        1,0,0,0,502,503,5,53,0,0,503,510,5,4,0,0,504,511,5,61,0,0,505,511,
        5,62,0,0,506,511,5,63,0,0,507,511,5,64,0,0,508,509,5,78,0,0,509,
        511,3,78,39,0,510,504,1,0,0,0,510,505,1,0,0,0,510,506,1,0,0,0,510,
        507,1,0,0,0,510,508,1,0,0,0,511,113,1,0,0,0,512,513,5,60,0,0,513,
        523,5,4,0,0,514,524,5,73,0,0,515,524,5,74,0,0,516,524,5,75,0,0,517,
        518,5,76,0,0,518,519,5,4,0,0,519,524,5,9,0,0,520,521,5,77,0,0,521,
        522,5,4,0,0,522,524,5,9,0,0,523,514,1,0,0,0,523,515,1,0,0,0,523,
        516,1,0,0,0,523,517,1,0,0,0,523,520,1,0,0,0,524,115,1,0,0,0,525,
        527,3,118,59,0,526,525,1,0,0,0,527,530,1,0,0,0,528,526,1,0,0,0,528,
        529,1,0,0,0,529,531,1,0,0,0,530,528,1,0,0,0,531,532,5,0,0,1,532,
        117,1,0,0,0,533,535,3,120,60,0,534,533,1,0,0,0,535,538,1,0,0,0,536,
        534,1,0,0,0,536,537,1,0,0,0,537,539,1,0,0,0,538,536,1,0,0,0,539,
        540,5,1,0,0,540,119,1,0,0,0,541,542,7,11,0,0,542,121,1,0,0,0,543,
        545,5,7,0,0,544,543,1,0,0,0,544,545,1,0,0,0,545,546,1,0,0,0,546,
        547,3,124,62,0,547,548,5,0,0,1,548,553,1,0,0,0,549,550,3,142,71,
        0,550,551,5,0,0,1,551,553,1,0,0,0,552,544,1,0,0,0,552,549,1,0,0,
        0,553,123,1,0,0,0,554,560,5,88,0,0,555,557,5,7,0,0,556,558,3,126,
        63,0,557,556,1,0,0,0,557,558,1,0,0,0,558,559,1,0,0,0,559,561,3,134,
        67,0,560,555,1,0,0,0,560,561,1,0,0,0,561,125,1,0,0,0,562,568,3,130,
        65,0,563,568,3,132,66,0,564,565,3,136,68,0,565,566,3,128,64,0,566,
        568,1,0,0,0,567,562,1,0,0,0,567,563,1,0,0,0,567,564,1,0,0,0,568,
        127,1,0,0,0,569,570,3,138,69,0,570,129,1,0,0,0,571,582,5,89,0,0,
        572,582,5,90,0,0,573,582,5,91,0,0,574,582,5,92,0,0,575,576,5,93,
        0,0,576,577,5,7,0,0,577,582,5,89,0,0,578,579,5,94,0,0,579,580,5,
        7,0,0,580,582,5,89,0,0,581,571,1,0,0,0,581,572,1,0,0,0,581,573,1,
        0,0,0,581,574,1,0,0,0,581,575,1,0,0,0,581,578,1,0,0,0,582,131,1,
        0,0,0,583,584,7,12,0,0,584,133,1,0,0,0,585,586,3,136,68,0,586,587,
        3,138,69,0,587,589,1,0,0,0,588,585,1,0,0,0,589,592,1,0,0,0,590,588,
        1,0,0,0,590,591,1,0,0,0,591,594,1,0,0,0,592,590,1,0,0,0,593,595,
        3,136,68,0,594,593,1,0,0,0,594,595,1,0,0,0,595,597,1,0,0,0,596,598,
        3,140,70,0,597,596,1,0,0,0,597,598,1,0,0,0,598,135,1,0,0,0,599,601,
        7,13,0,0,600,599,1,0,0,0,601,602,1,0,0,0,602,600,1,0,0,0,602,603,
        1,0,0,0,603,137,1,0,0,0,604,605,7,14,0,0,605,139,1,0,0,0,606,607,
        5,95,0,0,607,141,1,0,0,0,608,613,5,7,0,0,609,613,5,96,0,0,610,613,
        5,95,0,0,611,613,3,138,69,0,612,608,1,0,0,0,612,609,1,0,0,0,612,
        610,1,0,0,0,612,611,1,0,0,0,613,616,1,0,0,0,614,612,1,0,0,0,614,
        615,1,0,0,0,615,143,1,0,0,0,616,614,1,0,0,0,58,154,160,169,177,181,
        185,193,201,204,207,212,218,229,237,244,254,260,271,277,281,293,
        300,311,322,333,344,347,361,369,376,380,384,391,396,401,412,427,
        435,447,470,475,500,510,523,528,536,544,552,557,560,567,581,590,
        594,597,602,612,614
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


export class DirectiveScanEntryContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public EOF(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.EOF, 0)!;
    }
    public directiveScanLine(): DirectiveScanLineContext[];
    public directiveScanLine(i: number): DirectiveScanLineContext | null;
    public directiveScanLine(i?: number): DirectiveScanLineContext[] | DirectiveScanLineContext | null {
        if (i === undefined) {
            return this.getRuleContexts(DirectiveScanLineContext);
        }

        return this.getRuleContext(i, DirectiveScanLineContext);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_directiveScanEntry;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterDirectiveScanEntry) {
             listener.enterDirectiveScanEntry(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitDirectiveScanEntry) {
             listener.exitDirectiveScanEntry(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitDirectiveScanEntry) {
            return visitor.visitDirectiveScanEntry(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class DirectiveScanLineContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public NL(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.NL, 0)!;
    }
    public directiveScanItem(): DirectiveScanItemContext[];
    public directiveScanItem(i: number): DirectiveScanItemContext | null;
    public directiveScanItem(i?: number): DirectiveScanItemContext[] | DirectiveScanItemContext | null {
        if (i === undefined) {
            return this.getRuleContexts(DirectiveScanItemContext);
        }

        return this.getRuleContext(i, DirectiveScanItemContext);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_directiveScanLine;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterDirectiveScanLine) {
             listener.enterDirectiveScanLine(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitDirectiveScanLine) {
             listener.exitDirectiveScanLine(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitDirectiveScanLine) {
            return visitor.visitDirectiveScanLine(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class DirectiveScanItemContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public SCAN_OPEN(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.SCAN_OPEN, 0);
    }
    public SCAN_CLOSE(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.SCAN_CLOSE, 0);
    }
    public SCAN_TICKS(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.SCAN_TICKS, 0);
    }
    public SCAN_TEXT(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.SCAN_TEXT, 0);
    }
    public SCAN_CHAR(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.SCAN_CHAR, 0);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_directiveScanItem;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterDirectiveScanItem) {
             listener.enterDirectiveScanItem(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitDirectiveScanItem) {
             listener.exitDirectiveScanItem(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitDirectiveScanItem) {
            return visitor.visitDirectiveScanItem(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class DirectiveEntryContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public directive(): DirectiveContext | null {
        return this.getRuleContext(0, DirectiveContext);
    }
    public EOF(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.EOF, 0)!;
    }
    public WS(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.WS, 0);
    }
    public directiveProse(): DirectiveProseContext | null {
        return this.getRuleContext(0, DirectiveProseContext);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_directiveEntry;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterDirectiveEntry) {
             listener.enterDirectiveEntry(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitDirectiveEntry) {
             listener.exitDirectiveEntry(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitDirectiveEntry) {
            return visitor.visitDirectiveEntry(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class DirectiveContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public DIR_KEYWORD(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.DIR_KEYWORD, 0)!;
    }
    public WS(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.WS, 0);
    }
    public directiveArgs(): DirectiveArgsContext | null {
        return this.getRuleContext(0, DirectiveArgsContext);
    }
    public directiveHead(): DirectiveHeadContext | null {
        return this.getRuleContext(0, DirectiveHeadContext);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_directive;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterDirective) {
             listener.enterDirective(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitDirective) {
             listener.exitDirective(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitDirective) {
            return visitor.visitDirective(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class DirectiveHeadContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public directiveVerb(): DirectiveVerbContext | null {
        return this.getRuleContext(0, DirectiveVerbContext);
    }
    public directiveUnknown(): DirectiveUnknownContext | null {
        return this.getRuleContext(0, DirectiveUnknownContext);
    }
    public directiveSep(): DirectiveSepContext | null {
        return this.getRuleContext(0, DirectiveSepContext);
    }
    public directiveMisplaced(): DirectiveMisplacedContext | null {
        return this.getRuleContext(0, DirectiveMisplacedContext);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_directiveHead;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterDirectiveHead) {
             listener.enterDirectiveHead(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitDirectiveHead) {
             listener.exitDirectiveHead(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitDirectiveHead) {
            return visitor.visitDirectiveHead(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class DirectiveMisplacedContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public directiveItem(): DirectiveItemContext {
        return this.getRuleContext(0, DirectiveItemContext)!;
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_directiveMisplaced;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterDirectiveMisplaced) {
             listener.enterDirectiveMisplaced(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitDirectiveMisplaced) {
             listener.exitDirectiveMisplaced(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitDirectiveMisplaced) {
            return visitor.visitDirectiveMisplaced(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class DirectiveVerbContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public DIR_DISABLE(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.DIR_DISABLE, 0);
    }
    public DIR_DISABLE_LINE(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.DIR_DISABLE_LINE, 0);
    }
    public DIR_DISABLE_NEXT_LINE(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.DIR_DISABLE_NEXT_LINE, 0);
    }
    public DIR_DISABLE_FILE(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.DIR_DISABLE_FILE, 0);
    }
    public DIR_BEGIN(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.DIR_BEGIN, 0);
    }
    public WS(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.WS, 0);
    }
    public DIR_END(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.DIR_END, 0);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_directiveVerb;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterDirectiveVerb) {
             listener.enterDirectiveVerb(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitDirectiveVerb) {
             listener.exitDirectiveVerb(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitDirectiveVerb) {
            return visitor.visitDirectiveVerb(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class DirectiveUnknownContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public DIR_WORD(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.DIR_WORD, 0);
    }
    public DIR_KEYWORD(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.DIR_KEYWORD, 0);
    }
    public DIR_BEGIN(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.DIR_BEGIN, 0);
    }
    public DIR_END(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.DIR_END, 0);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_directiveUnknown;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterDirectiveUnknown) {
             listener.enterDirectiveUnknown(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitDirectiveUnknown) {
             listener.exitDirectiveUnknown(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitDirectiveUnknown) {
            return visitor.visitDirectiveUnknown(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class DirectiveArgsContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public directiveSep(): DirectiveSepContext[];
    public directiveSep(i: number): DirectiveSepContext | null;
    public directiveSep(i?: number): DirectiveSepContext[] | DirectiveSepContext | null {
        if (i === undefined) {
            return this.getRuleContexts(DirectiveSepContext);
        }

        return this.getRuleContext(i, DirectiveSepContext);
    }
    public directiveItem(): DirectiveItemContext[];
    public directiveItem(i: number): DirectiveItemContext | null;
    public directiveItem(i?: number): DirectiveItemContext[] | DirectiveItemContext | null {
        if (i === undefined) {
            return this.getRuleContexts(DirectiveItemContext);
        }

        return this.getRuleContext(i, DirectiveItemContext);
    }
    public directiveReason(): DirectiveReasonContext | null {
        return this.getRuleContext(0, DirectiveReasonContext);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_directiveArgs;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterDirectiveArgs) {
             listener.enterDirectiveArgs(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitDirectiveArgs) {
             listener.exitDirectiveArgs(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitDirectiveArgs) {
            return visitor.visitDirectiveArgs(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class DirectiveSepContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
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
    public DIR_COMMA(): antlr.TerminalNode[];
    public DIR_COMMA(i: number): antlr.TerminalNode | null;
    public DIR_COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(MdTemplateParser.DIR_COMMA);
    	} else {
    		return this.getToken(MdTemplateParser.DIR_COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_directiveSep;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterDirectiveSep) {
             listener.enterDirectiveSep(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitDirectiveSep) {
             listener.exitDirectiveSep(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitDirectiveSep) {
            return visitor.visitDirectiveSep(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class DirectiveItemContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public DIR_WORD(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.DIR_WORD, 0);
    }
    public DIR_KEYWORD(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.DIR_KEYWORD, 0);
    }
    public DIR_DISABLE(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.DIR_DISABLE, 0);
    }
    public DIR_DISABLE_LINE(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.DIR_DISABLE_LINE, 0);
    }
    public DIR_DISABLE_NEXT_LINE(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.DIR_DISABLE_NEXT_LINE, 0);
    }
    public DIR_DISABLE_FILE(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.DIR_DISABLE_FILE, 0);
    }
    public DIR_BEGIN(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.DIR_BEGIN, 0);
    }
    public DIR_END(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.DIR_END, 0);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_directiveItem;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterDirectiveItem) {
             listener.enterDirectiveItem(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitDirectiveItem) {
             listener.exitDirectiveItem(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitDirectiveItem) {
            return visitor.visitDirectiveItem(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class DirectiveReasonContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public DIR_REASON(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.DIR_REASON, 0)!;
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_directiveReason;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterDirectiveReason) {
             listener.enterDirectiveReason(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitDirectiveReason) {
             listener.exitDirectiveReason(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitDirectiveReason) {
            return visitor.visitDirectiveReason(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class DirectiveProseContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
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
    public DIR_COMMA(): antlr.TerminalNode[];
    public DIR_COMMA(i: number): antlr.TerminalNode | null;
    public DIR_COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(MdTemplateParser.DIR_COMMA);
    	} else {
    		return this.getToken(MdTemplateParser.DIR_COMMA, i);
    	}
    }
    public DIR_REASON(): antlr.TerminalNode[];
    public DIR_REASON(i: number): antlr.TerminalNode | null;
    public DIR_REASON(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(MdTemplateParser.DIR_REASON);
    	} else {
    		return this.getToken(MdTemplateParser.DIR_REASON, i);
    	}
    }
    public directiveItem(): DirectiveItemContext[];
    public directiveItem(i: number): DirectiveItemContext | null;
    public directiveItem(i?: number): DirectiveItemContext[] | DirectiveItemContext | null {
        if (i === undefined) {
            return this.getRuleContexts(DirectiveItemContext);
        }

        return this.getRuleContext(i, DirectiveItemContext);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_directiveProse;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterDirectiveProse) {
             listener.enterDirectiveProse(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitDirectiveProse) {
             listener.exitDirectiveProse(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitDirectiveProse) {
            return visitor.visitDirectiveProse(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
