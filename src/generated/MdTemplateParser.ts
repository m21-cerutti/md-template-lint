
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
    public static readonly QUOTED = 27;
    public static readonly QUOTED_END = 28;
    public static readonly FM_OPEN = 29;
    public static readonly FM_CLOSE = 30;
    public static readonly FM_BLANK = 31;
    public static readonly FM_LINE_HASH = 32;
    public static readonly FM_KEY = 33;
    public static readonly FM_KEY_BARE = 34;
    public static readonly FM_LINE_START = 35;
    public static readonly FM_TEXT_REST = 36;
    public static readonly PATTERN_OPEN = 37;
    public static readonly HTML_COMMENT = 38;
    public static readonly DATE_PLACEHOLDER = 39;
    public static readonly RULE = 40;
    public static readonly ISO = 41;
    public static readonly URL = 42;
    public static readonly LIEN = 43;
    public static readonly PATH = 44;
    public static readonly ALIAS_MARK = 45;
    public static readonly WORD = 46;
    public static readonly UWORD = 47;
    public static readonly SNAKE_CASE_CS = 48;
    public static readonly KEBAB_CASE_CS = 49;
    public static readonly CAMEL_CASE = 50;
    public static readonly PASCAL_CASE = 51;
    public static readonly FILENAME_CS = 52;
    public static readonly CASE_CS = 53;
    public static readonly PRESENCE = 54;
    public static readonly FORMAT = 55;
    public static readonly VALUE = 56;
    public static readonly COUNT = 57;
    public static readonly RANGE = 58;
    public static readonly ORDER = 59;
    public static readonly IO = 60;
    public static readonly CONTENT = 61;
    public static readonly PATTERN = 62;
    public static readonly REPEAT_RULES = 63;
    public static readonly UNIQUE_HEADINGS_NAMES = 64;
    public static readonly FRONTMATTER = 65;
    public static readonly REQUIRED = 66;
    public static readonly OPTIONAL = 67;
    public static readonly TEMPLATE_ONLY = 68;
    public static readonly ELEMENTS = 69;
    public static readonly SNAKE_CASE = 70;
    public static readonly KEBAB_CASE = 71;
    public static readonly FILENAME = 72;
    public static readonly SEMVER = 73;
    public static readonly DATE = 74;
    public static readonly MIN = 75;
    public static readonly MAX = 76;
    public static readonly ASCENDING = 77;
    public static readonly EXISTS = 78;
    public static readonly NON_EMPTY = 79;
    public static readonly TABLE = 80;
    public static readonly LIST = 81;
    public static readonly MIN_LINES = 82;
    public static readonly MAX_LINES = 83;
    public static readonly SUBHEADINGS = 84;
    public static readonly DISALLOW = 85;
    public static readonly NO_EXTRA = 86;
    public static readonly SAME_LEVEL = 87;
    public static readonly DESCENDING = 88;
    public static readonly FIRST = 89;
    public static readonly NUMBER_WORD = 90;
    public static readonly CONDITIONAL_ARG = 91;
    public static readonly CONSTANT_ARG = 92;
    public static readonly SCHEME_ARG = 93;
    public static readonly PATTERN_QUOTE = 94;
    public static readonly FREE_TEXT = 95;
    public static readonly SCHEME_TEXT = 96;
    public static readonly PAT_LBRACE2 = 97;
    public static readonly PAT_RBRACE2 = 98;
    public static readonly PAT_PLACEHOLDER = 99;
    public static readonly PAT_LBRACE = 100;
    public static readonly PAT_RBRACE = 101;
    public static readonly PAT_ESCAPE = 102;
    public static readonly PAT_TEXT = 103;
    public static readonly PAT_END = 104;
    public static readonly PAT_STRAY = 105;
    public static readonly SCAN_OPEN = 106;
    public static readonly SCAN_CLOSE = 107;
    public static readonly SCAN_TICKS = 108;
    public static readonly SCAN_TEXT = 109;
    public static readonly SCAN_CHAR = 110;
    public static readonly DIR_KEYWORD = 111;
    public static readonly DIR_DISABLE = 112;
    public static readonly DIR_DISABLE_LINE = 113;
    public static readonly DIR_DISABLE_NEXT_LINE = 114;
    public static readonly DIR_DISABLE_FILE = 115;
    public static readonly DIR_BEGIN = 116;
    public static readonly DIR_END = 117;
    public static readonly DIR_REASON = 118;
    public static readonly DIR_COMMA = 119;
    public static readonly DIR_WORD = 120;
    public static readonly FB_NL = 121;
    public static readonly T_LBRACK = 122;
    public static readonly T_RBRACK = 123;
    public static readonly T_COLON = 124;
    public static readonly T_DASH = 125;
    public static readonly Q_STRAY = 126;
    public static readonly Q_CLOSE = 127;
    public static readonly S_DOT = 128;
    public static readonly RULE_document = 0;
    public static readonly RULE_frontmatter = 1;
    public static readonly RULE_fmUnclosed = 2;
    public static readonly RULE_fmLine = 3;
    public static readonly RULE_fmFilenameLine = 4;
    public static readonly RULE_fmUniqueNamesLine = 5;
    public static readonly RULE_fmCommentLine = 6;
    public static readonly RULE_fmKeyLine = 7;
    public static readonly RULE_fmValue = 8;
    public static readonly RULE_fmInlineComment = 9;
    public static readonly RULE_fmCommentItem = 10;
    public static readonly RULE_fmHintWord = 11;
    public static readonly RULE_fmBlankLine = 12;
    public static readonly RULE_fmOtherLine = 13;
    public static readonly RULE_body = 14;
    public static readonly RULE_bodyBlock = 15;
    public static readonly RULE_bodyHeading = 16;
    public static readonly RULE_bodyHeadingItem = 17;
    public static readonly RULE_bodyFence = 18;
    public static readonly RULE_bodyTableRow = 19;
    public static readonly RULE_bodyListItem = 20;
    public static readonly RULE_bodyHtmlComment = 21;
    public static readonly RULE_bodyBlankLine = 22;
    public static readonly RULE_bodyTextLine = 23;
    public static readonly RULE_fmInlineCommentEntry = 24;
    public static readonly RULE_fmFilenameLineEntry = 25;
    public static readonly RULE_bodyHeadingTextEntry = 26;
    public static readonly RULE_tagCandidate = 27;
    public static readonly RULE_tagName = 28;
    public static readonly RULE_tagRuleMarker = 29;
    public static readonly RULE_tagBareBracket = 30;
    public static readonly RULE_tagShapedBracket = 31;
    public static readonly RULE_tagProseBracket = 32;
    public static readonly RULE_tagBracketItem = 33;
    public static readonly RULE_tagHintName = 34;
    public static readonly RULE_tagHintPiece = 35;
    public static readonly RULE_tagShapePiece = 36;
    public static readonly RULE_tagWord = 37;
    public static readonly RULE_tagFamilyEntry = 38;
    public static readonly RULE_tagFamily = 39;
    public static readonly RULE_tagFreeText = 40;
    public static readonly RULE_fmTagEntry = 41;
    public static readonly RULE_fmTagBody = 42;
    public static readonly RULE_fmPresenceTag = 43;
    public static readonly RULE_fmFormatTag = 44;
    public static readonly RULE_fmShape = 45;
    public static readonly RULE_fmCaseStyle = 46;
    public static readonly RULE_fmValueTag = 47;
    public static readonly RULE_fmCountTag = 48;
    public static readonly RULE_fmRangeTag = 49;
    public static readonly RULE_fmBound = 50;
    public static readonly RULE_fmSignedNumber = 51;
    public static readonly RULE_fmOrderTag = 52;
    public static readonly RULE_fmIoTag = 53;
    public static readonly RULE_fmFilenameTag = 54;
    public static readonly RULE_fmFrontmatterTag = 55;
    public static readonly RULE_fmConvention = 56;
    public static readonly RULE_fmUniqueNamesTag = 57;
    public static readonly RULE_bodyTagEntry = 58;
    public static readonly RULE_bodyTagBody = 59;
    public static readonly RULE_bodyPresenceTag = 60;
    public static readonly RULE_bodyContentTag = 61;
    public static readonly RULE_bodyPatternTag = 62;
    public static readonly RULE_patternPiece = 63;
    public static readonly RULE_bodyRepeatTag = 64;
    public static readonly RULE_repeatCount = 65;
    public static readonly RULE_bodyOrderTag = 66;
    public static readonly RULE_bodyUniqueNamesTag = 67;
    public static readonly RULE_directiveScanEntry = 68;
    public static readonly RULE_directiveScanLine = 69;
    public static readonly RULE_directiveScanItem = 70;
    public static readonly RULE_directiveEntry = 71;
    public static readonly RULE_directive = 72;
    public static readonly RULE_directiveHead = 73;
    public static readonly RULE_directiveMisplaced = 74;
    public static readonly RULE_directiveVerb = 75;
    public static readonly RULE_directiveUnknown = 76;
    public static readonly RULE_directiveArgs = 77;
    public static readonly RULE_directiveSep = 78;
    public static readonly RULE_directiveItem = 79;
    public static readonly RULE_directiveReason = 80;
    public static readonly RULE_directiveProse = 81;

    public static readonly literalNames = [
        null, null, null, null, null, null, null, null, null, null, null, 
        null, null, null, null, null, null, null, null, null, null, null, 
        null, null, null, null, null, null, null, null, null, null, null, 
        null, null, null, null, null, null, null, "'rule'", "'iso'", "'url'", 
        "'lien'", "'path'", null, null, null, null, null, null, null, null, 
        null, "'presence'", "'format'", "'value'", "'count'", "'range'", 
        "'order'", "'io'", "'content'", "'pattern'", "'repeat-rules'", "'unique-headings-names'", 
        "'frontmatter'", "'required'", "'optional'", "'template-only'", 
        "'elements'", "'snake_case'", "'kebab-case'", "'filename'", "'semver'", 
        "'date'", "'min'", "'max'", "'ascending'", "'exists'", "'non-empty'", 
        "'table'", "'list'", "'min-lines'", "'max-lines'", "'subheadings'", 
        "'disallow'", "'no-extra'", "'same-level'", "'descending'", "'first'", 
        "'number'", "'conditional:'", "'constant:'", "'scheme:'", null, 
        null, null, "'{{'", "'}}'", null, "'{'", "'}'", null, null, null, 
        null, "'<!--'", "'-->'", null, null, null, "'md-template-lint'", 
        "'disable'", "'disable-line'", "'disable-next-line'", "'disable-file'", 
        "'begin'", "'end'", null, "','", null, null, null, null, null, null, 
        "'\\'", null, "'.'"
    ];

    public static readonly symbolicNames = [
        null, "NL", "LBRACK", "RBRACK", "COLON", "DASH", "DOT", "WS", "OTHER", 
        "NUMBER", "ALNUM", "H_OPEN", "FENCE_OPEN", "FENCE_NL", "FENCE_LINE", 
        "FENCE_CLOSE", "BODY_TABLE_ROW", "BODY_LIST_ITEM", "BODY_HTML_COMMENT", 
        "BODY_BLANK", "BODY_TEXT_START", "BODY_TEXT_REST", "FM_QUOTED", 
        "FM_PLAIN_TEXT", "FM_FLOW_OPEN", "FM_FLOW_CLOSE", "FM_COMMENT_HASH", 
        "QUOTED", "QUOTED_END", "FM_OPEN", "FM_CLOSE", "FM_BLANK", "FM_LINE_HASH", 
        "FM_KEY", "FM_KEY_BARE", "FM_LINE_START", "FM_TEXT_REST", "PATTERN_OPEN", 
        "HTML_COMMENT", "DATE_PLACEHOLDER", "RULE", "ISO", "URL", "LIEN", 
        "PATH", "ALIAS_MARK", "WORD", "UWORD", "SNAKE_CASE_CS", "KEBAB_CASE_CS", 
        "CAMEL_CASE", "PASCAL_CASE", "FILENAME_CS", "CASE_CS", "PRESENCE", 
        "FORMAT", "VALUE", "COUNT", "RANGE", "ORDER", "IO", "CONTENT", "PATTERN", 
        "REPEAT_RULES", "UNIQUE_HEADINGS_NAMES", "FRONTMATTER", "REQUIRED", 
        "OPTIONAL", "TEMPLATE_ONLY", "ELEMENTS", "SNAKE_CASE", "KEBAB_CASE", 
        "FILENAME", "SEMVER", "DATE", "MIN", "MAX", "ASCENDING", "EXISTS", 
        "NON_EMPTY", "TABLE", "LIST", "MIN_LINES", "MAX_LINES", "SUBHEADINGS", 
        "DISALLOW", "NO_EXTRA", "SAME_LEVEL", "DESCENDING", "FIRST", "NUMBER_WORD", 
        "CONDITIONAL_ARG", "CONSTANT_ARG", "SCHEME_ARG", "PATTERN_QUOTE", 
        "FREE_TEXT", "SCHEME_TEXT", "PAT_LBRACE2", "PAT_RBRACE2", "PAT_PLACEHOLDER", 
        "PAT_LBRACE", "PAT_RBRACE", "PAT_ESCAPE", "PAT_TEXT", "PAT_END", 
        "PAT_STRAY", "SCAN_OPEN", "SCAN_CLOSE", "SCAN_TICKS", "SCAN_TEXT", 
        "SCAN_CHAR", "DIR_KEYWORD", "DIR_DISABLE", "DIR_DISABLE_LINE", "DIR_DISABLE_NEXT_LINE", 
        "DIR_DISABLE_FILE", "DIR_BEGIN", "DIR_END", "DIR_REASON", "DIR_COMMA", 
        "DIR_WORD", "FB_NL", "T_LBRACK", "T_RBRACK", "T_COLON", "T_DASH", 
        "Q_STRAY", "Q_CLOSE", "S_DOT"
    ];
    public static readonly ruleNames = [
        "document", "frontmatter", "fmUnclosed", "fmLine", "fmFilenameLine", 
        "fmUniqueNamesLine", "fmCommentLine", "fmKeyLine", "fmValue", "fmInlineComment", 
        "fmCommentItem", "fmHintWord", "fmBlankLine", "fmOtherLine", "body", 
        "bodyBlock", "bodyHeading", "bodyHeadingItem", "bodyFence", "bodyTableRow", 
        "bodyListItem", "bodyHtmlComment", "bodyBlankLine", "bodyTextLine", 
        "fmInlineCommentEntry", "fmFilenameLineEntry", "bodyHeadingTextEntry", 
        "tagCandidate", "tagName", "tagRuleMarker", "tagBareBracket", "tagShapedBracket", 
        "tagProseBracket", "tagBracketItem", "tagHintName", "tagHintPiece", 
        "tagShapePiece", "tagWord", "tagFamilyEntry", "tagFamily", "tagFreeText", 
        "fmTagEntry", "fmTagBody", "fmPresenceTag", "fmFormatTag", "fmShape", 
        "fmCaseStyle", "fmValueTag", "fmCountTag", "fmRangeTag", "fmBound", 
        "fmSignedNumber", "fmOrderTag", "fmIoTag", "fmFilenameTag", "fmFrontmatterTag", 
        "fmConvention", "fmUniqueNamesTag", "bodyTagEntry", "bodyTagBody", 
        "bodyPresenceTag", "bodyContentTag", "bodyPatternTag", "patternPiece", 
        "bodyRepeatTag", "repeatCount", "bodyOrderTag", "bodyUniqueNamesTag", 
        "directiveScanEntry", "directiveScanLine", "directiveScanItem", 
        "directiveEntry", "directive", "directiveHead", "directiveMisplaced", 
        "directiveVerb", "directiveUnknown", "directiveArgs", "directiveSep", 
        "directiveItem", "directiveReason", "directiveProse",
    ];

    public get grammarFileName(): string { return "MdTemplateParser.g4"; }
    public get literalNames(): (string | null)[] { return MdTemplateParser.literalNames; }
    public get symbolicNames(): (string | null)[] { return MdTemplateParser.symbolicNames; }
    public get ruleNames(): string[] { return MdTemplateParser.ruleNames; }
    public get serializedATN(): number[] { return MdTemplateParser._serializedATN; }

    protected createFailedPredicateException(predicate?: string, message?: string): antlr.FailedPredicateException {
        return new antlr.FailedPredicateException(this, predicate, message);
    }


        /** True when the next token does not start with `0`. */
        private startsWithNonZero(): boolean {
            return (this.tokenStream.LT(1)?.text ?? "0").charAt(0) !== "0";
        }

    public constructor(input: antlr.TokenStream) {
        super(input);
        this.interpreter = new antlr.ParserATNSimulator(this, MdTemplateParser._ATN, MdTemplateParser.decisionsToDFA, new antlr.PredictionContextCache());
    }
    public document(): DocumentContext {
        let localContext = new DocumentContext(this.context, this.state);
        this.enterRule(localContext, 0, MdTemplateParser.RULE_document);
        try {
            this.state = 174;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 0, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 164;
                this.frontmatter();
                this.state = 165;
                this.body();
                this.state = 166;
                this.match(MdTemplateParser.EOF);
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 168;
                this.fmUnclosed();
                this.state = 169;
                this.match(MdTemplateParser.EOF);
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 171;
                this.body();
                this.state = 172;
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
            this.state = 176;
            this.match(MdTemplateParser.FM_OPEN);
            this.state = 180;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 31)) & ~0x1F) === 0 && ((1 << (_la - 31)) & 31) !== 0)) {
                {
                {
                this.state = 177;
                this.fmLine();
                }
                }
                this.state = 182;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 183;
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
            this.state = 185;
            this.match(MdTemplateParser.FM_OPEN);
            this.state = 189;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 31)) & ~0x1F) === 0 && ((1 << (_la - 31)) & 31) !== 0)) {
                {
                {
                this.state = 186;
                this.fmLine();
                }
                }
                this.state = 191;
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
            this.state = 198;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 3, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 192;
                this.fmFilenameLine();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 193;
                this.fmUniqueNamesLine();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 194;
                this.fmCommentLine();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 195;
                this.fmKeyLine();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 196;
                this.fmBlankLine();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 197;
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
            this.state = 200;
            this.match(MdTemplateParser.FM_LINE_HASH);
            this.state = 202;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 7) {
                {
                this.state = 201;
                this.match(MdTemplateParser.WS);
                }
            }

            this.state = 204;
            this.tagCandidate();
            this.state = 206;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 7) {
                {
                this.state = 205;
                this.match(MdTemplateParser.WS);
                }
            }

            this.state = 208;
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
    public fmUniqueNamesLine(): FmUniqueNamesLineContext {
        let localContext = new FmUniqueNamesLineContext(this.context, this.state);
        this.enterRule(localContext, 10, MdTemplateParser.RULE_fmUniqueNamesLine);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 210;
            this.match(MdTemplateParser.FM_LINE_HASH);
            this.state = 212;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 7) {
                {
                this.state = 211;
                this.match(MdTemplateParser.WS);
                }
            }

            this.state = 214;
            this.tagBareBracket();
            this.state = 216;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 7) {
                {
                this.state = 215;
                this.match(MdTemplateParser.WS);
                }
            }

            this.state = 218;
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
        this.enterRule(localContext, 12, MdTemplateParser.RULE_fmCommentLine);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 220;
            this.match(MdTemplateParser.FM_LINE_HASH);
            this.state = 224;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 2)) & ~0x1F) === 0 && ((1 << (_la - 2)) & 4294967295) !== 0) || ((((_la - 34)) & ~0x1F) === 0 && ((1 << (_la - 34)) & 4294967295) !== 0) || ((((_la - 66)) & ~0x1F) === 0 && ((1 << (_la - 66)) & 4294967295) !== 0) || ((((_la - 98)) & ~0x1F) === 0 && ((1 << (_la - 98)) & 2147483647) !== 0)) {
                {
                {
                this.state = 221;
                this.fmCommentItem();
                }
                }
                this.state = 226;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 227;
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
        this.enterRule(localContext, 14, MdTemplateParser.RULE_fmKeyLine);
        let _la: number;
        try {
            this.state = 238;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.FM_KEY_BARE:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 229;
                this.match(MdTemplateParser.FM_KEY_BARE);
                }
                break;
            case MdTemplateParser.FM_KEY:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 230;
                this.match(MdTemplateParser.FM_KEY);
                this.state = 232;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 62914560) !== 0)) {
                    {
                    this.state = 231;
                    this.fmValue();
                    }
                }

                this.state = 235;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 26) {
                    {
                    this.state = 234;
                    this.fmInlineComment();
                    }
                }

                this.state = 237;
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
        this.enterRule(localContext, 16, MdTemplateParser.RULE_fmValue);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 241;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                {
                this.state = 240;
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
                this.state = 243;
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
        this.enterRule(localContext, 18, MdTemplateParser.RULE_fmInlineComment);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 245;
            this.match(MdTemplateParser.FM_COMMENT_HASH);
            this.state = 249;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 2)) & ~0x1F) === 0 && ((1 << (_la - 2)) & 4294967295) !== 0) || ((((_la - 34)) & ~0x1F) === 0 && ((1 << (_la - 34)) & 4294967295) !== 0) || ((((_la - 66)) & ~0x1F) === 0 && ((1 << (_la - 66)) & 4294967295) !== 0) || ((((_la - 98)) & ~0x1F) === 0 && ((1 << (_la - 98)) & 2147483647) !== 0)) {
                {
                {
                this.state = 246;
                this.fmCommentItem();
                }
                }
                this.state = 251;
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
        this.enterRule(localContext, 20, MdTemplateParser.RULE_fmCommentItem);
        let _la: number;
        try {
            this.state = 259;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 14, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 252;
                this.tagCandidate();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 253;
                this.tagRuleMarker();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 254;
                this.tagBareBracket();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 255;
                this.tagShapedBracket();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 256;
                this.tagProseBracket();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 257;
                this.fmHintWord();
                }
                break;
            case 7:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 258;
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
        this.enterRule(localContext, 22, MdTemplateParser.RULE_fmHintWord);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 261;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 39)) & ~0x1F) === 0 && ((1 << (_la - 39)) & 125) !== 0))) {
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
        this.enterRule(localContext, 24, MdTemplateParser.RULE_fmBlankLine);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 263;
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
        this.enterRule(localContext, 26, MdTemplateParser.RULE_fmOtherLine);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 265;
            this.match(MdTemplateParser.FM_LINE_START);
            this.state = 267;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 36) {
                {
                this.state = 266;
                this.match(MdTemplateParser.FM_TEXT_REST);
                }
            }

            this.state = 269;
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
        this.enterRule(localContext, 28, MdTemplateParser.RULE_body);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 274;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 2037760) !== 0)) {
                {
                {
                this.state = 271;
                this.bodyBlock();
                }
                }
                this.state = 276;
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
        this.enterRule(localContext, 30, MdTemplateParser.RULE_bodyBlock);
        try {
            this.state = 284;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.H_OPEN:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 277;
                this.bodyHeading();
                }
                break;
            case MdTemplateParser.FENCE_OPEN:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 278;
                this.bodyFence();
                }
                break;
            case MdTemplateParser.BODY_TABLE_ROW:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 279;
                this.bodyTableRow();
                }
                break;
            case MdTemplateParser.BODY_LIST_ITEM:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 280;
                this.bodyListItem();
                }
                break;
            case MdTemplateParser.BODY_HTML_COMMENT:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 281;
                this.bodyHtmlComment();
                }
                break;
            case MdTemplateParser.BODY_BLANK:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 282;
                this.bodyBlankLine();
                }
                break;
            case MdTemplateParser.BODY_TEXT_START:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 283;
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
        this.enterRule(localContext, 32, MdTemplateParser.RULE_bodyHeading);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 286;
            this.match(MdTemplateParser.H_OPEN);
            this.state = 290;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 2)) & ~0x1F) === 0 && ((1 << (_la - 2)) & 4294967295) !== 0) || ((((_la - 34)) & ~0x1F) === 0 && ((1 << (_la - 34)) & 4294967295) !== 0) || ((((_la - 66)) & ~0x1F) === 0 && ((1 << (_la - 66)) & 4294967295) !== 0) || ((((_la - 98)) & ~0x1F) === 0 && ((1 << (_la - 98)) & 2147483647) !== 0)) {
                {
                {
                this.state = 287;
                this.bodyHeadingItem();
                }
                }
                this.state = 292;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 293;
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
        this.enterRule(localContext, 34, MdTemplateParser.RULE_bodyHeadingItem);
        let _la: number;
        try {
            this.state = 301;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 19, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 295;
                this.tagCandidate();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 296;
                this.tagRuleMarker();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 297;
                this.tagBareBracket();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 298;
                this.tagShapedBracket();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 299;
                this.tagProseBracket();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 300;
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
        this.enterRule(localContext, 36, MdTemplateParser.RULE_bodyFence);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 303;
            this.match(MdTemplateParser.FENCE_OPEN);
            this.state = 307;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 13 || _la === 14) {
                {
                {
                this.state = 304;
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
                this.state = 309;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 311;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 15) {
                {
                this.state = 310;
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
        this.enterRule(localContext, 38, MdTemplateParser.RULE_bodyTableRow);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 313;
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
        this.enterRule(localContext, 40, MdTemplateParser.RULE_bodyListItem);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 315;
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
        this.enterRule(localContext, 42, MdTemplateParser.RULE_bodyHtmlComment);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 317;
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
        this.enterRule(localContext, 44, MdTemplateParser.RULE_bodyBlankLine);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 319;
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
        this.enterRule(localContext, 46, MdTemplateParser.RULE_bodyTextLine);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 321;
            this.match(MdTemplateParser.BODY_TEXT_START);
            this.state = 323;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 21) {
                {
                this.state = 322;
                this.match(MdTemplateParser.BODY_TEXT_REST);
                }
            }

            this.state = 325;
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
        this.enterRule(localContext, 48, MdTemplateParser.RULE_fmInlineCommentEntry);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 330;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 2)) & ~0x1F) === 0 && ((1 << (_la - 2)) & 4294967295) !== 0) || ((((_la - 34)) & ~0x1F) === 0 && ((1 << (_la - 34)) & 4294967295) !== 0) || ((((_la - 66)) & ~0x1F) === 0 && ((1 << (_la - 66)) & 4294967295) !== 0) || ((((_la - 98)) & ~0x1F) === 0 && ((1 << (_la - 98)) & 2147483647) !== 0)) {
                {
                {
                this.state = 327;
                this.fmCommentItem();
                }
                }
                this.state = 332;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 333;
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
        this.enterRule(localContext, 50, MdTemplateParser.RULE_fmFilenameLineEntry);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 335;
            this.fmFilenameLine();
            this.state = 336;
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
        this.enterRule(localContext, 52, MdTemplateParser.RULE_bodyHeadingTextEntry);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 341;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 2)) & ~0x1F) === 0 && ((1 << (_la - 2)) & 4294967295) !== 0) || ((((_la - 34)) & ~0x1F) === 0 && ((1 << (_la - 34)) & 4294967295) !== 0) || ((((_la - 66)) & ~0x1F) === 0 && ((1 << (_la - 66)) & 4294967295) !== 0) || ((((_la - 98)) & ~0x1F) === 0 && ((1 << (_la - 98)) & 2147483647) !== 0)) {
                {
                {
                this.state = 338;
                this.bodyHeadingItem();
                }
                }
                this.state = 343;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 344;
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
        this.enterRule(localContext, 54, MdTemplateParser.RULE_tagCandidate);
        let _la: number;
        try {
            let alternative: number;
            this.state = 396;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 32, this.context) ) {
            case 1:
                localContext = new TagShapedCandidateContext(localContext);
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 346;
                this.match(MdTemplateParser.LBRACK);
                this.state = 347;
                this.tagName();
                this.state = 348;
                this.match(MdTemplateParser.COLON);
                this.state = 352;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 1584) !== 0) || ((((_la - 39)) & ~0x1F) === 0 && ((1 << (_la - 39)) & 191) !== 0)) {
                    {
                    {
                    this.state = 349;
                    this.tagShapePiece();
                    }
                    }
                    this.state = 354;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                this.state = 355;
                this.match(MdTemplateParser.RBRACK);
                }
                break;
            case 2:
                localContext = new TagClosedCandidateContext(localContext);
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 357;
                this.match(MdTemplateParser.LBRACK);
                this.state = 358;
                this.tagName();
                this.state = 359;
                this.match(MdTemplateParser.COLON);
                this.state = 363;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (((((_la - 2)) & ~0x1F) === 0 && ((1 << (_la - 2)) & 4294967293) !== 0) || ((((_la - 34)) & ~0x1F) === 0 && ((1 << (_la - 34)) & 4294967295) !== 0) || ((((_la - 66)) & ~0x1F) === 0 && ((1 << (_la - 66)) & 4294967295) !== 0) || ((((_la - 98)) & ~0x1F) === 0 && ((1 << (_la - 98)) & 2147483647) !== 0)) {
                    {
                    {
                    this.state = 360;
                    this.tagBracketItem();
                    }
                    }
                    this.state = 365;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                this.state = 366;
                this.match(MdTemplateParser.RBRACK);
                }
                break;
            case 3:
                localContext = new TagUnclosedCandidateContext(localContext);
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 368;
                this.match(MdTemplateParser.LBRACK);
                this.state = 369;
                this.tagName();
                this.state = 370;
                this.match(MdTemplateParser.COLON);
                this.state = 374;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 27, this.context);
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                        {
                        this.state = 371;
                        this.tagBracketItem();
                        }
                        }
                    }
                    this.state = 376;
                    this.errorHandler.sync(this);
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 27, this.context);
                }
                }
                break;
            case 4:
                localContext = new TagPatternCandidateContext(localContext);
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 377;
                this.match(MdTemplateParser.PATTERN_OPEN);
                this.state = 381;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 28, this.context);
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                        {
                        this.state = 378;
                        this.match(MdTemplateParser.QUOTED);
                        }
                        }
                    }
                    this.state = 383;
                    this.errorHandler.sync(this);
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 28, this.context);
                }
                this.state = 394;
                this.errorHandler.sync(this);
                switch (this.interpreter.adaptivePredict(this.tokenStream, 31, this.context) ) {
                case 1:
                    {
                    this.state = 384;
                    this.match(MdTemplateParser.QUOTED_END);
                    this.state = 388;
                    this.errorHandler.sync(this);
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 29, this.context);
                    while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                        if (alternative === 1) {
                            {
                            {
                            this.state = 385;
                            this.tagBracketItem();
                            }
                            }
                        }
                        this.state = 390;
                        this.errorHandler.sync(this);
                        alternative = this.interpreter.adaptivePredict(this.tokenStream, 29, this.context);
                    }
                    this.state = 392;
                    this.errorHandler.sync(this);
                    switch (this.interpreter.adaptivePredict(this.tokenStream, 30, this.context) ) {
                    case 1:
                        {
                        this.state = 391;
                        this.match(MdTemplateParser.RBRACK);
                        }
                        break;
                    }
                    }
                    break;
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
    public tagName(): TagNameContext {
        let localContext = new TagNameContext(this.context, this.state);
        this.enterRule(localContext, 56, MdTemplateParser.RULE_tagName);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 398;
            this.tagWord();
            this.state = 403;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 5) {
                {
                {
                this.state = 399;
                this.match(MdTemplateParser.DASH);
                this.state = 400;
                this.tagWord();
                }
                }
                this.state = 405;
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
    public tagRuleMarker(): TagRuleMarkerContext {
        let localContext = new TagRuleMarkerContext(this.context, this.state);
        this.enterRule(localContext, 58, MdTemplateParser.RULE_tagRuleMarker);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 406;
            this.match(MdTemplateParser.LBRACK);
            this.state = 407;
            this.match(MdTemplateParser.RULE);
            this.state = 408;
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
        this.enterRule(localContext, 60, MdTemplateParser.RULE_tagBareBracket);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 410;
            this.match(MdTemplateParser.LBRACK);
            this.state = 411;
            this.tagHintName();
            this.state = 412;
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
        this.enterRule(localContext, 62, MdTemplateParser.RULE_tagShapedBracket);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 414;
            this.match(MdTemplateParser.LBRACK);
            this.state = 416;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                {
                this.state = 415;
                this.tagShapePiece();
                }
                }
                this.state = 418;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 1584) !== 0) || ((((_la - 39)) & ~0x1F) === 0 && ((1 << (_la - 39)) & 191) !== 0));
            this.state = 420;
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
        this.enterRule(localContext, 64, MdTemplateParser.RULE_tagProseBracket);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 422;
            this.match(MdTemplateParser.LBRACK);
            this.state = 426;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 2)) & ~0x1F) === 0 && ((1 << (_la - 2)) & 4294967293) !== 0) || ((((_la - 34)) & ~0x1F) === 0 && ((1 << (_la - 34)) & 4294967295) !== 0) || ((((_la - 66)) & ~0x1F) === 0 && ((1 << (_la - 66)) & 4294967295) !== 0) || ((((_la - 98)) & ~0x1F) === 0 && ((1 << (_la - 98)) & 2147483647) !== 0)) {
                {
                {
                this.state = 423;
                this.tagBracketItem();
                }
                }
                this.state = 428;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 429;
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
        this.enterRule(localContext, 66, MdTemplateParser.RULE_tagBracketItem);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 431;
            _la = this.tokenStream.LA(1);
            if(_la<=0 || _la === 1 || _la === 3) {
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
    public tagHintName(): TagHintNameContext {
        let localContext = new TagHintNameContext(this.context, this.state);
        this.enterRule(localContext, 68, MdTemplateParser.RULE_tagHintName);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 434;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                {
                this.state = 433;
                this.tagHintPiece();
                }
                }
                this.state = 436;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 1568) !== 0) || ((((_la - 39)) & ~0x1F) === 0 && ((1 << (_la - 39)) & 447) !== 0));
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
        this.enterRule(localContext, 70, MdTemplateParser.RULE_tagHintPiece);
        try {
            this.state = 441;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.NUMBER:
            case MdTemplateParser.ALNUM:
            case MdTemplateParser.DATE_PLACEHOLDER:
            case MdTemplateParser.RULE:
            case MdTemplateParser.ISO:
            case MdTemplateParser.URL:
            case MdTemplateParser.LIEN:
            case MdTemplateParser.PATH:
            case MdTemplateParser.WORD:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 438;
                this.tagWord();
                }
                break;
            case MdTemplateParser.UWORD:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 439;
                this.match(MdTemplateParser.UWORD);
                }
                break;
            case MdTemplateParser.DASH:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 440;
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
        this.enterRule(localContext, 72, MdTemplateParser.RULE_tagShapePiece);
        try {
            this.state = 446;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.NUMBER:
            case MdTemplateParser.ALNUM:
            case MdTemplateParser.DATE_PLACEHOLDER:
            case MdTemplateParser.RULE:
            case MdTemplateParser.ISO:
            case MdTemplateParser.URL:
            case MdTemplateParser.LIEN:
            case MdTemplateParser.PATH:
            case MdTemplateParser.WORD:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 443;
                this.tagWord();
                }
                break;
            case MdTemplateParser.DASH:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 444;
                this.match(MdTemplateParser.DASH);
                }
                break;
            case MdTemplateParser.COLON:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 445;
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
        this.enterRule(localContext, 74, MdTemplateParser.RULE_tagWord);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 448;
            _la = this.tokenStream.LA(1);
            if(!(_la === 9 || _la === 10 || ((((_la - 39)) & ~0x1F) === 0 && ((1 << (_la - 39)) & 191) !== 0))) {
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
        this.enterRule(localContext, 76, MdTemplateParser.RULE_tagFamilyEntry);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 450;
            this.match(MdTemplateParser.LBRACK);
            this.state = 451;
            this.tagFamily();
            this.state = 452;
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
        this.enterRule(localContext, 78, MdTemplateParser.RULE_tagFamily);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 454;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 52)) & ~0x1F) === 0 && ((1 << (_la - 52)) & 16381) !== 0))) {
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
        this.enterRule(localContext, 80, MdTemplateParser.RULE_tagFreeText);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 457;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 95) {
                {
                this.state = 456;
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
        this.enterRule(localContext, 82, MdTemplateParser.RULE_fmTagEntry);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 459;
            this.match(MdTemplateParser.LBRACK);
            this.state = 460;
            this.fmTagBody();
            this.state = 461;
            this.match(MdTemplateParser.RBRACK);
            this.state = 462;
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
        this.enterRule(localContext, 84, MdTemplateParser.RULE_fmTagBody);
        try {
            this.state = 474;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.PRESENCE:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 464;
                this.fmPresenceTag();
                }
                break;
            case MdTemplateParser.FORMAT:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 465;
                this.fmFormatTag();
                }
                break;
            case MdTemplateParser.VALUE:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 466;
                this.fmValueTag();
                }
                break;
            case MdTemplateParser.COUNT:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 467;
                this.fmCountTag();
                }
                break;
            case MdTemplateParser.RANGE:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 468;
                this.fmRangeTag();
                }
                break;
            case MdTemplateParser.ORDER:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 469;
                this.fmOrderTag();
                }
                break;
            case MdTemplateParser.IO:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 470;
                this.fmIoTag();
                }
                break;
            case MdTemplateParser.FILENAME_CS:
                this.enterOuterAlt(localContext, 8);
                {
                this.state = 471;
                this.fmFilenameTag();
                }
                break;
            case MdTemplateParser.UNIQUE_HEADINGS_NAMES:
                this.enterOuterAlt(localContext, 9);
                {
                this.state = 472;
                this.fmUniqueNamesTag();
                }
                break;
            case MdTemplateParser.FRONTMATTER:
                this.enterOuterAlt(localContext, 10);
                {
                this.state = 473;
                this.fmFrontmatterTag();
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
        this.enterRule(localContext, 86, MdTemplateParser.RULE_fmPresenceTag);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 476;
            this.match(MdTemplateParser.PRESENCE);
            this.state = 477;
            this.match(MdTemplateParser.COLON);
            this.state = 482;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.REQUIRED:
                {
                this.state = 478;
                this.match(MdTemplateParser.REQUIRED);
                }
                break;
            case MdTemplateParser.OPTIONAL:
                {
                this.state = 479;
                this.match(MdTemplateParser.OPTIONAL);
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
    public fmFormatTag(): FmFormatTagContext {
        let localContext = new FmFormatTagContext(this.context, this.state);
        this.enterRule(localContext, 88, MdTemplateParser.RULE_fmFormatTag);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 484;
            this.match(MdTemplateParser.FORMAT);
            this.state = 485;
            this.match(MdTemplateParser.COLON);
            this.state = 498;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 42, this.context) ) {
            case 1:
                {
                this.state = 486;
                this.match(MdTemplateParser.CONSTANT_ARG);
                this.state = 487;
                this.tagFreeText();
                }
                break;
            case 2:
                {
                this.state = 488;
                this.fmCaseStyle();
                }
                break;
            case 3:
                {
                this.state = 489;
                this.match(MdTemplateParser.ELEMENTS);
                this.state = 490;
                this.match(MdTemplateParser.COLON);
                this.state = 491;
                this.fmCaseStyle();
                }
                break;
            case 4:
                {
                this.state = 492;
                this.fmShape();
                }
                break;
            case 5:
                {
                this.state = 493;
                this.match(MdTemplateParser.ELEMENTS);
                this.state = 494;
                this.match(MdTemplateParser.COLON);
                this.state = 495;
                this.fmShape();
                }
                break;
            case 6:
                {
                this.state = 496;
                this.match(MdTemplateParser.SCHEME_ARG);
                this.state = 497;
                this.match(MdTemplateParser.SCHEME_TEXT);
                }
                break;
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
    public fmShape(): FmShapeContext {
        let localContext = new FmShapeContext(this.context, this.state);
        this.enterRule(localContext, 90, MdTemplateParser.RULE_fmShape);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 500;
            _la = this.tokenStream.LA(1);
            if(!(_la === 73 || _la === 74)) {
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
    public fmCaseStyle(): FmCaseStyleContext {
        let localContext = new FmCaseStyleContext(this.context, this.state);
        this.enterRule(localContext, 92, MdTemplateParser.RULE_fmCaseStyle);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 502;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 48)) & ~0x1F) === 0 && ((1 << (_la - 48)) & 12582915) !== 0))) {
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
        this.enterRule(localContext, 94, MdTemplateParser.RULE_fmValueTag);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 504;
            this.match(MdTemplateParser.VALUE);
            this.state = 505;
            this.match(MdTemplateParser.COLON);
            this.state = 506;
            _la = this.tokenStream.LA(1);
            if(!(_la === 52 || _la === 72)) {
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
        this.enterRule(localContext, 96, MdTemplateParser.RULE_fmCountTag);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 508;
            this.match(MdTemplateParser.COUNT);
            this.state = 509;
            this.match(MdTemplateParser.COLON);
            this.state = 510;
            this.fmBound();
            this.state = 511;
            this.match(MdTemplateParser.COLON);
            this.state = 512;
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
        this.enterRule(localContext, 98, MdTemplateParser.RULE_fmRangeTag);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 514;
            this.match(MdTemplateParser.RANGE);
            this.state = 515;
            this.match(MdTemplateParser.COLON);
            this.state = 516;
            this.fmBound();
            this.state = 517;
            this.match(MdTemplateParser.COLON);
            this.state = 518;
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
        this.enterRule(localContext, 100, MdTemplateParser.RULE_fmBound);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 520;
            _la = this.tokenStream.LA(1);
            if(!(_la === 75 || _la === 76)) {
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
        this.enterRule(localContext, 102, MdTemplateParser.RULE_fmSignedNumber);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 523;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 5) {
                {
                this.state = 522;
                this.match(MdTemplateParser.DASH);
                }
            }

            this.state = 525;
            this.match(MdTemplateParser.NUMBER);
            this.state = 528;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 6) {
                {
                this.state = 526;
                this.match(MdTemplateParser.DOT);
                this.state = 527;
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
        this.enterRule(localContext, 104, MdTemplateParser.RULE_fmOrderTag);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 530;
            this.match(MdTemplateParser.ORDER);
            this.state = 531;
            this.match(MdTemplateParser.COLON);
            this.state = 532;
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
        this.enterRule(localContext, 106, MdTemplateParser.RULE_fmIoTag);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 534;
            this.match(MdTemplateParser.IO);
            this.state = 535;
            this.match(MdTemplateParser.COLON);
            this.state = 536;
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
        this.enterRule(localContext, 108, MdTemplateParser.RULE_fmFilenameTag);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 538;
            this.match(MdTemplateParser.FILENAME_CS);
            this.state = 539;
            this.match(MdTemplateParser.COLON);
            this.state = 540;
            this.match(MdTemplateParser.CASE_CS);
            this.state = 541;
            this.match(MdTemplateParser.COLON);
            this.state = 542;
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
    public fmFrontmatterTag(): FmFrontmatterTagContext {
        let localContext = new FmFrontmatterTagContext(this.context, this.state);
        this.enterRule(localContext, 110, MdTemplateParser.RULE_fmFrontmatterTag);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 544;
            this.match(MdTemplateParser.FRONTMATTER);
            this.state = 545;
            this.match(MdTemplateParser.COLON);
            this.state = 546;
            this.match(MdTemplateParser.OPTIONAL);
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
        this.enterRule(localContext, 112, MdTemplateParser.RULE_fmConvention);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 548;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 48)) & ~0x1F) === 0 && ((1 << (_la - 48)) & 15) !== 0))) {
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
    public fmUniqueNamesTag(): FmUniqueNamesTagContext {
        let localContext = new FmUniqueNamesTagContext(this.context, this.state);
        this.enterRule(localContext, 114, MdTemplateParser.RULE_fmUniqueNamesTag);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 550;
            this.match(MdTemplateParser.UNIQUE_HEADINGS_NAMES);
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
        this.enterRule(localContext, 116, MdTemplateParser.RULE_bodyTagEntry);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 552;
            this.match(MdTemplateParser.LBRACK);
            this.state = 553;
            this.bodyTagBody();
            this.state = 554;
            this.match(MdTemplateParser.RBRACK);
            this.state = 555;
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
        this.enterRule(localContext, 118, MdTemplateParser.RULE_bodyTagBody);
        try {
            this.state = 563;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.PRESENCE:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 557;
                this.bodyPresenceTag();
                }
                break;
            case MdTemplateParser.CONTENT:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 558;
                this.bodyContentTag();
                }
                break;
            case MdTemplateParser.PATTERN:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 559;
                this.bodyPatternTag();
                }
                break;
            case MdTemplateParser.REPEAT_RULES:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 560;
                this.bodyRepeatTag();
                }
                break;
            case MdTemplateParser.ORDER:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 561;
                this.bodyOrderTag();
                }
                break;
            case MdTemplateParser.UNIQUE_HEADINGS_NAMES:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 562;
                this.bodyUniqueNamesTag();
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
        this.enterRule(localContext, 120, MdTemplateParser.RULE_bodyPresenceTag);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 565;
            this.match(MdTemplateParser.PRESENCE);
            this.state = 566;
            this.match(MdTemplateParser.COLON);
            this.state = 572;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.REQUIRED:
                {
                this.state = 567;
                this.match(MdTemplateParser.REQUIRED);
                }
                break;
            case MdTemplateParser.OPTIONAL:
                {
                this.state = 568;
                this.match(MdTemplateParser.OPTIONAL);
                }
                break;
            case MdTemplateParser.TEMPLATE_ONLY:
                {
                this.state = 569;
                this.match(MdTemplateParser.TEMPLATE_ONLY);
                }
                break;
            case MdTemplateParser.CONDITIONAL_ARG:
                {
                this.state = 570;
                this.match(MdTemplateParser.CONDITIONAL_ARG);
                this.state = 571;
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
        this.enterRule(localContext, 122, MdTemplateParser.RULE_bodyContentTag);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 574;
            this.match(MdTemplateParser.CONTENT);
            this.state = 575;
            this.match(MdTemplateParser.COLON);
            this.state = 591;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 47, this.context) ) {
            case 1:
                {
                this.state = 576;
                this.match(MdTemplateParser.NON_EMPTY);
                }
                break;
            case 2:
                {
                this.state = 577;
                this.match(MdTemplateParser.TABLE);
                }
                break;
            case 3:
                {
                this.state = 578;
                this.match(MdTemplateParser.LIST);
                }
                break;
            case 4:
                {
                this.state = 579;
                this.match(MdTemplateParser.MIN_LINES);
                this.state = 580;
                this.match(MdTemplateParser.COLON);
                this.state = 581;
                this.match(MdTemplateParser.NUMBER);
                }
                break;
            case 5:
                {
                this.state = 582;
                this.match(MdTemplateParser.MAX_LINES);
                this.state = 583;
                this.match(MdTemplateParser.COLON);
                this.state = 584;
                this.match(MdTemplateParser.NUMBER);
                }
                break;
            case 6:
                {
                this.state = 585;
                this.match(MdTemplateParser.SUBHEADINGS);
                this.state = 586;
                this.match(MdTemplateParser.COLON);
                this.state = 587;
                this.match(MdTemplateParser.DISALLOW);
                }
                break;
            case 7:
                {
                this.state = 588;
                this.match(MdTemplateParser.SUBHEADINGS);
                this.state = 589;
                this.match(MdTemplateParser.COLON);
                this.state = 590;
                this.match(MdTemplateParser.NO_EXTRA);
                }
                break;
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
    public bodyPatternTag(): BodyPatternTagContext {
        let localContext = new BodyPatternTagContext(this.context, this.state);
        this.enterRule(localContext, 124, MdTemplateParser.RULE_bodyPatternTag);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 593;
            this.match(MdTemplateParser.PATTERN);
            this.state = 594;
            this.match(MdTemplateParser.COLON);
            this.state = 595;
            this.match(MdTemplateParser.PATTERN_QUOTE);
            this.state = 599;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 97)) & ~0x1F) === 0 && ((1 << (_la - 97)) & 127) !== 0)) {
                {
                {
                this.state = 596;
                this.patternPiece();
                }
                }
                this.state = 601;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 602;
            this.match(MdTemplateParser.PAT_END);
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
    public patternPiece(): PatternPieceContext {
        let localContext = new PatternPieceContext(this.context, this.state);
        this.enterRule(localContext, 126, MdTemplateParser.RULE_patternPiece);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 604;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 97)) & ~0x1F) === 0 && ((1 << (_la - 97)) & 127) !== 0))) {
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
    public bodyRepeatTag(): BodyRepeatTagContext {
        let localContext = new BodyRepeatTagContext(this.context, this.state);
        this.enterRule(localContext, 128, MdTemplateParser.RULE_bodyRepeatTag);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 606;
            this.match(MdTemplateParser.REPEAT_RULES);
            this.state = 607;
            this.match(MdTemplateParser.COLON);
            this.state = 608;
            this.match(MdTemplateParser.SAME_LEVEL);
            this.state = 614;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 4) {
                {
                this.state = 609;
                this.match(MdTemplateParser.COLON);
                this.state = 610;
                this.fmBound();
                this.state = 611;
                this.match(MdTemplateParser.COLON);
                this.state = 612;
                this.repeatCount();
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
    public repeatCount(): RepeatCountContext {
        let localContext = new RepeatCountContext(this.context, this.state);
        this.enterRule(localContext, 130, MdTemplateParser.RULE_repeatCount);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 616;
            if (!(this.startsWithNonZero())) {
                throw this.createFailedPredicateException("this.startsWithNonZero()");
            }
            this.state = 617;
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
    public bodyOrderTag(): BodyOrderTagContext {
        let localContext = new BodyOrderTagContext(this.context, this.state);
        this.enterRule(localContext, 132, MdTemplateParser.RULE_bodyOrderTag);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 619;
            this.match(MdTemplateParser.ORDER);
            this.state = 620;
            this.match(MdTemplateParser.COLON);
            this.state = 625;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 89) {
                {
                this.state = 621;
                this.match(MdTemplateParser.FIRST);
                this.state = 622;
                this.match(MdTemplateParser.COLON);
                this.state = 623;
                _la = this.tokenStream.LA(1);
                if(!(((((_la - 73)) & ~0x1F) === 0 && ((1 << (_la - 73)) & 131075) !== 0))) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 624;
                this.match(MdTemplateParser.COLON);
                }
            }

            this.state = 627;
            _la = this.tokenStream.LA(1);
            if(!(_la === 77 || _la === 88)) {
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
    public bodyUniqueNamesTag(): BodyUniqueNamesTagContext {
        let localContext = new BodyUniqueNamesTagContext(this.context, this.state);
        this.enterRule(localContext, 134, MdTemplateParser.RULE_bodyUniqueNamesTag);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 629;
            this.match(MdTemplateParser.UNIQUE_HEADINGS_NAMES);
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
        this.enterRule(localContext, 136, MdTemplateParser.RULE_directiveScanEntry);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 634;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 1 || ((((_la - 106)) & ~0x1F) === 0 && ((1 << (_la - 106)) & 31) !== 0)) {
                {
                {
                this.state = 631;
                this.directiveScanLine();
                }
                }
                this.state = 636;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 637;
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
        this.enterRule(localContext, 138, MdTemplateParser.RULE_directiveScanLine);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 642;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 106)) & ~0x1F) === 0 && ((1 << (_la - 106)) & 31) !== 0)) {
                {
                {
                this.state = 639;
                this.directiveScanItem();
                }
                }
                this.state = 644;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 645;
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
        this.enterRule(localContext, 140, MdTemplateParser.RULE_directiveScanItem);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 647;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 106)) & ~0x1F) === 0 && ((1 << (_la - 106)) & 31) !== 0))) {
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
        this.enterRule(localContext, 142, MdTemplateParser.RULE_directiveEntry);
        let _la: number;
        try {
            this.state = 658;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 54, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 650;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 7) {
                    {
                    this.state = 649;
                    this.match(MdTemplateParser.WS);
                    }
                }

                this.state = 652;
                this.directive();
                this.state = 653;
                this.match(MdTemplateParser.EOF);
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 655;
                this.directiveProse();
                this.state = 656;
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
        this.enterRule(localContext, 144, MdTemplateParser.RULE_directive);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 660;
            this.match(MdTemplateParser.DIR_KEYWORD);
            this.state = 666;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 7) {
                {
                this.state = 661;
                this.match(MdTemplateParser.WS);
                this.state = 663;
                this.errorHandler.sync(this);
                switch (this.interpreter.adaptivePredict(this.tokenStream, 55, this.context) ) {
                case 1:
                    {
                    this.state = 662;
                    this.directiveHead();
                    }
                    break;
                }
                this.state = 665;
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
        this.enterRule(localContext, 146, MdTemplateParser.RULE_directiveHead);
        try {
            this.state = 673;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 57, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 668;
                this.directiveVerb();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 669;
                this.directiveUnknown();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 670;
                this.directiveSep();
                this.state = 671;
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
        this.enterRule(localContext, 148, MdTemplateParser.RULE_directiveMisplaced);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 675;
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
        this.enterRule(localContext, 150, MdTemplateParser.RULE_directiveVerb);
        try {
            this.state = 687;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.DIR_DISABLE:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 677;
                this.match(MdTemplateParser.DIR_DISABLE);
                }
                break;
            case MdTemplateParser.DIR_DISABLE_LINE:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 678;
                this.match(MdTemplateParser.DIR_DISABLE_LINE);
                }
                break;
            case MdTemplateParser.DIR_DISABLE_NEXT_LINE:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 679;
                this.match(MdTemplateParser.DIR_DISABLE_NEXT_LINE);
                }
                break;
            case MdTemplateParser.DIR_DISABLE_FILE:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 680;
                this.match(MdTemplateParser.DIR_DISABLE_FILE);
                }
                break;
            case MdTemplateParser.DIR_BEGIN:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 681;
                this.match(MdTemplateParser.DIR_BEGIN);
                this.state = 682;
                this.match(MdTemplateParser.WS);
                this.state = 683;
                this.match(MdTemplateParser.DIR_DISABLE);
                }
                break;
            case MdTemplateParser.DIR_END:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 684;
                this.match(MdTemplateParser.DIR_END);
                this.state = 685;
                this.match(MdTemplateParser.WS);
                this.state = 686;
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
        this.enterRule(localContext, 152, MdTemplateParser.RULE_directiveUnknown);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 689;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 111)) & ~0x1F) === 0 && ((1 << (_la - 111)) & 609) !== 0))) {
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
        this.enterRule(localContext, 154, MdTemplateParser.RULE_directiveArgs);
        let _la: number;
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 696;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 59, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 691;
                    this.directiveSep();
                    this.state = 692;
                    this.directiveItem();
                    }
                    }
                }
                this.state = 698;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 59, this.context);
            }
            this.state = 700;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 7 || _la === 119) {
                {
                this.state = 699;
                this.directiveSep();
                }
            }

            this.state = 703;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 118) {
                {
                this.state = 702;
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
        this.enterRule(localContext, 156, MdTemplateParser.RULE_directiveSep);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 706;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                {
                this.state = 705;
                _la = this.tokenStream.LA(1);
                if(!(_la === 7 || _la === 119)) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                }
                }
                this.state = 708;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while (_la === 7 || _la === 119);
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
        this.enterRule(localContext, 158, MdTemplateParser.RULE_directiveItem);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 710;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 111)) & ~0x1F) === 0 && ((1 << (_la - 111)) & 639) !== 0))) {
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
        this.enterRule(localContext, 160, MdTemplateParser.RULE_directiveReason);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 712;
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
        this.enterRule(localContext, 162, MdTemplateParser.RULE_directiveProse);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 720;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 7 || ((((_la - 111)) & ~0x1F) === 0 && ((1 << (_la - 111)) & 1023) !== 0)) {
                {
                this.state = 718;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case MdTemplateParser.WS:
                    {
                    this.state = 714;
                    this.match(MdTemplateParser.WS);
                    }
                    break;
                case MdTemplateParser.DIR_COMMA:
                    {
                    this.state = 715;
                    this.match(MdTemplateParser.DIR_COMMA);
                    }
                    break;
                case MdTemplateParser.DIR_REASON:
                    {
                    this.state = 716;
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
                    this.state = 717;
                    this.directiveItem();
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 722;
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

    public override sempred(localContext: antlr.ParserRuleContext | null, ruleIndex: number, predIndex: number): boolean {
        switch (ruleIndex) {
        case 65:
            return this.repeatCount_sempred(localContext as RepeatCountContext, predIndex);
        }
        return true;
    }
    private repeatCount_sempred(localContext: RepeatCountContext | null, predIndex: number): boolean {
        switch (predIndex) {
        case 0:
            return this.startsWithNonZero();
        }
        return true;
    }

    public static readonly _serializedATN: number[] = [
        4,1,128,724,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,
        7,6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,13,7,
        13,2,14,7,14,2,15,7,15,2,16,7,16,2,17,7,17,2,18,7,18,2,19,7,19,2,
        20,7,20,2,21,7,21,2,22,7,22,2,23,7,23,2,24,7,24,2,25,7,25,2,26,7,
        26,2,27,7,27,2,28,7,28,2,29,7,29,2,30,7,30,2,31,7,31,2,32,7,32,2,
        33,7,33,2,34,7,34,2,35,7,35,2,36,7,36,2,37,7,37,2,38,7,38,2,39,7,
        39,2,40,7,40,2,41,7,41,2,42,7,42,2,43,7,43,2,44,7,44,2,45,7,45,2,
        46,7,46,2,47,7,47,2,48,7,48,2,49,7,49,2,50,7,50,2,51,7,51,2,52,7,
        52,2,53,7,53,2,54,7,54,2,55,7,55,2,56,7,56,2,57,7,57,2,58,7,58,2,
        59,7,59,2,60,7,60,2,61,7,61,2,62,7,62,2,63,7,63,2,64,7,64,2,65,7,
        65,2,66,7,66,2,67,7,67,2,68,7,68,2,69,7,69,2,70,7,70,2,71,7,71,2,
        72,7,72,2,73,7,73,2,74,7,74,2,75,7,75,2,76,7,76,2,77,7,77,2,78,7,
        78,2,79,7,79,2,80,7,80,2,81,7,81,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,
        1,0,1,0,3,0,175,8,0,1,1,1,1,5,1,179,8,1,10,1,12,1,182,9,1,1,1,1,
        1,1,2,1,2,5,2,188,8,2,10,2,12,2,191,9,2,1,3,1,3,1,3,1,3,1,3,1,3,
        3,3,199,8,3,1,4,1,4,3,4,203,8,4,1,4,1,4,3,4,207,8,4,1,4,1,4,1,5,
        1,5,3,5,213,8,5,1,5,1,5,3,5,217,8,5,1,5,1,5,1,6,1,6,5,6,223,8,6,
        10,6,12,6,226,9,6,1,6,1,6,1,7,1,7,1,7,3,7,233,8,7,1,7,3,7,236,8,
        7,1,7,3,7,239,8,7,1,8,4,8,242,8,8,11,8,12,8,243,1,9,1,9,5,9,248,
        8,9,10,9,12,9,251,9,9,1,10,1,10,1,10,1,10,1,10,1,10,1,10,3,10,260,
        8,10,1,11,1,11,1,12,1,12,1,13,1,13,3,13,268,8,13,1,13,1,13,1,14,
        5,14,273,8,14,10,14,12,14,276,9,14,1,15,1,15,1,15,1,15,1,15,1,15,
        1,15,3,15,285,8,15,1,16,1,16,5,16,289,8,16,10,16,12,16,292,9,16,
        1,16,1,16,1,17,1,17,1,17,1,17,1,17,1,17,3,17,302,8,17,1,18,1,18,
        5,18,306,8,18,10,18,12,18,309,9,18,1,18,3,18,312,8,18,1,19,1,19,
        1,20,1,20,1,21,1,21,1,22,1,22,1,23,1,23,3,23,324,8,23,1,23,1,23,
        1,24,5,24,329,8,24,10,24,12,24,332,9,24,1,24,1,24,1,25,1,25,1,25,
        1,26,5,26,340,8,26,10,26,12,26,343,9,26,1,26,1,26,1,27,1,27,1,27,
        1,27,5,27,351,8,27,10,27,12,27,354,9,27,1,27,1,27,1,27,1,27,1,27,
        1,27,5,27,362,8,27,10,27,12,27,365,9,27,1,27,1,27,1,27,1,27,1,27,
        1,27,5,27,373,8,27,10,27,12,27,376,9,27,1,27,1,27,5,27,380,8,27,
        10,27,12,27,383,9,27,1,27,1,27,5,27,387,8,27,10,27,12,27,390,9,27,
        1,27,3,27,393,8,27,3,27,395,8,27,3,27,397,8,27,1,28,1,28,1,28,5,
        28,402,8,28,10,28,12,28,405,9,28,1,29,1,29,1,29,1,29,1,30,1,30,1,
        30,1,30,1,31,1,31,4,31,417,8,31,11,31,12,31,418,1,31,1,31,1,32,1,
        32,5,32,425,8,32,10,32,12,32,428,9,32,1,32,1,32,1,33,1,33,1,34,4,
        34,435,8,34,11,34,12,34,436,1,35,1,35,1,35,3,35,442,8,35,1,36,1,
        36,1,36,3,36,447,8,36,1,37,1,37,1,38,1,38,1,38,1,38,1,39,1,39,1,
        40,3,40,458,8,40,1,41,1,41,1,41,1,41,1,41,1,42,1,42,1,42,1,42,1,
        42,1,42,1,42,1,42,1,42,1,42,3,42,475,8,42,1,43,1,43,1,43,1,43,1,
        43,1,43,3,43,483,8,43,1,44,1,44,1,44,1,44,1,44,1,44,1,44,1,44,1,
        44,1,44,1,44,1,44,1,44,1,44,3,44,499,8,44,1,45,1,45,1,46,1,46,1,
        47,1,47,1,47,1,47,1,48,1,48,1,48,1,48,1,48,1,48,1,49,1,49,1,49,1,
        49,1,49,1,49,1,50,1,50,1,51,3,51,524,8,51,1,51,1,51,1,51,3,51,529,
        8,51,1,52,1,52,1,52,1,52,1,53,1,53,1,53,1,53,1,54,1,54,1,54,1,54,
        1,54,1,54,1,55,1,55,1,55,1,55,1,56,1,56,1,57,1,57,1,58,1,58,1,58,
        1,58,1,58,1,59,1,59,1,59,1,59,1,59,1,59,3,59,564,8,59,1,60,1,60,
        1,60,1,60,1,60,1,60,1,60,3,60,573,8,60,1,61,1,61,1,61,1,61,1,61,
        1,61,1,61,1,61,1,61,1,61,1,61,1,61,1,61,1,61,1,61,1,61,1,61,3,61,
        592,8,61,1,62,1,62,1,62,1,62,5,62,598,8,62,10,62,12,62,601,9,62,
        1,62,1,62,1,63,1,63,1,64,1,64,1,64,1,64,1,64,1,64,1,64,1,64,3,64,
        615,8,64,1,65,1,65,1,65,1,66,1,66,1,66,1,66,1,66,1,66,3,66,626,8,
        66,1,66,1,66,1,67,1,67,1,68,5,68,633,8,68,10,68,12,68,636,9,68,1,
        68,1,68,1,69,5,69,641,8,69,10,69,12,69,644,9,69,1,69,1,69,1,70,1,
        70,1,71,3,71,651,8,71,1,71,1,71,1,71,1,71,1,71,1,71,3,71,659,8,71,
        1,72,1,72,1,72,3,72,664,8,72,1,72,3,72,667,8,72,1,73,1,73,1,73,1,
        73,1,73,3,73,674,8,73,1,74,1,74,1,75,1,75,1,75,1,75,1,75,1,75,1,
        75,1,75,1,75,1,75,3,75,688,8,75,1,76,1,76,1,77,1,77,1,77,5,77,695,
        8,77,10,77,12,77,698,9,77,1,77,3,77,701,8,77,1,77,3,77,704,8,77,
        1,78,4,78,707,8,78,11,78,12,78,708,1,79,1,79,1,80,1,80,1,81,1,81,
        1,81,1,81,5,81,719,8,81,10,81,12,81,722,9,81,1,81,0,0,82,0,2,4,6,
        8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50,
        52,54,56,58,60,62,64,66,68,70,72,74,76,78,80,82,84,86,88,90,92,94,
        96,98,100,102,104,106,108,110,112,114,116,118,120,122,124,126,128,
        130,132,134,136,138,140,142,144,146,148,150,152,154,156,158,160,
        162,0,19,1,0,22,25,1,0,1,1,2,0,39,39,41,45,1,0,13,14,2,0,1,1,3,3,
        3,0,9,10,39,44,46,46,2,0,52,52,54,65,1,0,73,74,2,0,48,49,70,71,2,
        0,52,52,72,72,1,0,75,76,1,0,48,51,1,0,97,103,2,0,73,74,90,90,2,0,
        77,77,88,88,1,0,106,110,3,0,111,111,116,117,120,120,2,0,7,7,119,
        119,2,0,111,117,120,120,760,0,174,1,0,0,0,2,176,1,0,0,0,4,185,1,
        0,0,0,6,198,1,0,0,0,8,200,1,0,0,0,10,210,1,0,0,0,12,220,1,0,0,0,
        14,238,1,0,0,0,16,241,1,0,0,0,18,245,1,0,0,0,20,259,1,0,0,0,22,261,
        1,0,0,0,24,263,1,0,0,0,26,265,1,0,0,0,28,274,1,0,0,0,30,284,1,0,
        0,0,32,286,1,0,0,0,34,301,1,0,0,0,36,303,1,0,0,0,38,313,1,0,0,0,
        40,315,1,0,0,0,42,317,1,0,0,0,44,319,1,0,0,0,46,321,1,0,0,0,48,330,
        1,0,0,0,50,335,1,0,0,0,52,341,1,0,0,0,54,396,1,0,0,0,56,398,1,0,
        0,0,58,406,1,0,0,0,60,410,1,0,0,0,62,414,1,0,0,0,64,422,1,0,0,0,
        66,431,1,0,0,0,68,434,1,0,0,0,70,441,1,0,0,0,72,446,1,0,0,0,74,448,
        1,0,0,0,76,450,1,0,0,0,78,454,1,0,0,0,80,457,1,0,0,0,82,459,1,0,
        0,0,84,474,1,0,0,0,86,476,1,0,0,0,88,484,1,0,0,0,90,500,1,0,0,0,
        92,502,1,0,0,0,94,504,1,0,0,0,96,508,1,0,0,0,98,514,1,0,0,0,100,
        520,1,0,0,0,102,523,1,0,0,0,104,530,1,0,0,0,106,534,1,0,0,0,108,
        538,1,0,0,0,110,544,1,0,0,0,112,548,1,0,0,0,114,550,1,0,0,0,116,
        552,1,0,0,0,118,563,1,0,0,0,120,565,1,0,0,0,122,574,1,0,0,0,124,
        593,1,0,0,0,126,604,1,0,0,0,128,606,1,0,0,0,130,616,1,0,0,0,132,
        619,1,0,0,0,134,629,1,0,0,0,136,634,1,0,0,0,138,642,1,0,0,0,140,
        647,1,0,0,0,142,658,1,0,0,0,144,660,1,0,0,0,146,673,1,0,0,0,148,
        675,1,0,0,0,150,687,1,0,0,0,152,689,1,0,0,0,154,696,1,0,0,0,156,
        706,1,0,0,0,158,710,1,0,0,0,160,712,1,0,0,0,162,720,1,0,0,0,164,
        165,3,2,1,0,165,166,3,28,14,0,166,167,5,0,0,1,167,175,1,0,0,0,168,
        169,3,4,2,0,169,170,5,0,0,1,170,175,1,0,0,0,171,172,3,28,14,0,172,
        173,5,0,0,1,173,175,1,0,0,0,174,164,1,0,0,0,174,168,1,0,0,0,174,
        171,1,0,0,0,175,1,1,0,0,0,176,180,5,29,0,0,177,179,3,6,3,0,178,177,
        1,0,0,0,179,182,1,0,0,0,180,178,1,0,0,0,180,181,1,0,0,0,181,183,
        1,0,0,0,182,180,1,0,0,0,183,184,5,30,0,0,184,3,1,0,0,0,185,189,5,
        29,0,0,186,188,3,6,3,0,187,186,1,0,0,0,188,191,1,0,0,0,189,187,1,
        0,0,0,189,190,1,0,0,0,190,5,1,0,0,0,191,189,1,0,0,0,192,199,3,8,
        4,0,193,199,3,10,5,0,194,199,3,12,6,0,195,199,3,14,7,0,196,199,3,
        24,12,0,197,199,3,26,13,0,198,192,1,0,0,0,198,193,1,0,0,0,198,194,
        1,0,0,0,198,195,1,0,0,0,198,196,1,0,0,0,198,197,1,0,0,0,199,7,1,
        0,0,0,200,202,5,32,0,0,201,203,5,7,0,0,202,201,1,0,0,0,202,203,1,
        0,0,0,203,204,1,0,0,0,204,206,3,54,27,0,205,207,5,7,0,0,206,205,
        1,0,0,0,206,207,1,0,0,0,207,208,1,0,0,0,208,209,5,1,0,0,209,9,1,
        0,0,0,210,212,5,32,0,0,211,213,5,7,0,0,212,211,1,0,0,0,212,213,1,
        0,0,0,213,214,1,0,0,0,214,216,3,60,30,0,215,217,5,7,0,0,216,215,
        1,0,0,0,216,217,1,0,0,0,217,218,1,0,0,0,218,219,5,1,0,0,219,11,1,
        0,0,0,220,224,5,32,0,0,221,223,3,20,10,0,222,221,1,0,0,0,223,226,
        1,0,0,0,224,222,1,0,0,0,224,225,1,0,0,0,225,227,1,0,0,0,226,224,
        1,0,0,0,227,228,5,1,0,0,228,13,1,0,0,0,229,239,5,34,0,0,230,232,
        5,33,0,0,231,233,3,16,8,0,232,231,1,0,0,0,232,233,1,0,0,0,233,235,
        1,0,0,0,234,236,3,18,9,0,235,234,1,0,0,0,235,236,1,0,0,0,236,237,
        1,0,0,0,237,239,5,1,0,0,238,229,1,0,0,0,238,230,1,0,0,0,239,15,1,
        0,0,0,240,242,7,0,0,0,241,240,1,0,0,0,242,243,1,0,0,0,243,241,1,
        0,0,0,243,244,1,0,0,0,244,17,1,0,0,0,245,249,5,26,0,0,246,248,3,
        20,10,0,247,246,1,0,0,0,248,251,1,0,0,0,249,247,1,0,0,0,249,250,
        1,0,0,0,250,19,1,0,0,0,251,249,1,0,0,0,252,260,3,54,27,0,253,260,
        3,58,29,0,254,260,3,60,30,0,255,260,3,62,31,0,256,260,3,64,32,0,
        257,260,3,22,11,0,258,260,8,1,0,0,259,252,1,0,0,0,259,253,1,0,0,
        0,259,254,1,0,0,0,259,255,1,0,0,0,259,256,1,0,0,0,259,257,1,0,0,
        0,259,258,1,0,0,0,260,21,1,0,0,0,261,262,7,2,0,0,262,23,1,0,0,0,
        263,264,5,31,0,0,264,25,1,0,0,0,265,267,5,35,0,0,266,268,5,36,0,
        0,267,266,1,0,0,0,267,268,1,0,0,0,268,269,1,0,0,0,269,270,5,1,0,
        0,270,27,1,0,0,0,271,273,3,30,15,0,272,271,1,0,0,0,273,276,1,0,0,
        0,274,272,1,0,0,0,274,275,1,0,0,0,275,29,1,0,0,0,276,274,1,0,0,0,
        277,285,3,32,16,0,278,285,3,36,18,0,279,285,3,38,19,0,280,285,3,
        40,20,0,281,285,3,42,21,0,282,285,3,44,22,0,283,285,3,46,23,0,284,
        277,1,0,0,0,284,278,1,0,0,0,284,279,1,0,0,0,284,280,1,0,0,0,284,
        281,1,0,0,0,284,282,1,0,0,0,284,283,1,0,0,0,285,31,1,0,0,0,286,290,
        5,11,0,0,287,289,3,34,17,0,288,287,1,0,0,0,289,292,1,0,0,0,290,288,
        1,0,0,0,290,291,1,0,0,0,291,293,1,0,0,0,292,290,1,0,0,0,293,294,
        5,1,0,0,294,33,1,0,0,0,295,302,3,54,27,0,296,302,3,58,29,0,297,302,
        3,60,30,0,298,302,3,62,31,0,299,302,3,64,32,0,300,302,8,1,0,0,301,
        295,1,0,0,0,301,296,1,0,0,0,301,297,1,0,0,0,301,298,1,0,0,0,301,
        299,1,0,0,0,301,300,1,0,0,0,302,35,1,0,0,0,303,307,5,12,0,0,304,
        306,7,3,0,0,305,304,1,0,0,0,306,309,1,0,0,0,307,305,1,0,0,0,307,
        308,1,0,0,0,308,311,1,0,0,0,309,307,1,0,0,0,310,312,5,15,0,0,311,
        310,1,0,0,0,311,312,1,0,0,0,312,37,1,0,0,0,313,314,5,16,0,0,314,
        39,1,0,0,0,315,316,5,17,0,0,316,41,1,0,0,0,317,318,5,18,0,0,318,
        43,1,0,0,0,319,320,5,19,0,0,320,45,1,0,0,0,321,323,5,20,0,0,322,
        324,5,21,0,0,323,322,1,0,0,0,323,324,1,0,0,0,324,325,1,0,0,0,325,
        326,5,1,0,0,326,47,1,0,0,0,327,329,3,20,10,0,328,327,1,0,0,0,329,
        332,1,0,0,0,330,328,1,0,0,0,330,331,1,0,0,0,331,333,1,0,0,0,332,
        330,1,0,0,0,333,334,5,0,0,1,334,49,1,0,0,0,335,336,3,8,4,0,336,337,
        5,0,0,1,337,51,1,0,0,0,338,340,3,34,17,0,339,338,1,0,0,0,340,343,
        1,0,0,0,341,339,1,0,0,0,341,342,1,0,0,0,342,344,1,0,0,0,343,341,
        1,0,0,0,344,345,5,0,0,1,345,53,1,0,0,0,346,347,5,2,0,0,347,348,3,
        56,28,0,348,352,5,4,0,0,349,351,3,72,36,0,350,349,1,0,0,0,351,354,
        1,0,0,0,352,350,1,0,0,0,352,353,1,0,0,0,353,355,1,0,0,0,354,352,
        1,0,0,0,355,356,5,3,0,0,356,397,1,0,0,0,357,358,5,2,0,0,358,359,
        3,56,28,0,359,363,5,4,0,0,360,362,3,66,33,0,361,360,1,0,0,0,362,
        365,1,0,0,0,363,361,1,0,0,0,363,364,1,0,0,0,364,366,1,0,0,0,365,
        363,1,0,0,0,366,367,5,3,0,0,367,397,1,0,0,0,368,369,5,2,0,0,369,
        370,3,56,28,0,370,374,5,4,0,0,371,373,3,66,33,0,372,371,1,0,0,0,
        373,376,1,0,0,0,374,372,1,0,0,0,374,375,1,0,0,0,375,397,1,0,0,0,
        376,374,1,0,0,0,377,381,5,37,0,0,378,380,5,27,0,0,379,378,1,0,0,
        0,380,383,1,0,0,0,381,379,1,0,0,0,381,382,1,0,0,0,382,394,1,0,0,
        0,383,381,1,0,0,0,384,388,5,28,0,0,385,387,3,66,33,0,386,385,1,0,
        0,0,387,390,1,0,0,0,388,386,1,0,0,0,388,389,1,0,0,0,389,392,1,0,
        0,0,390,388,1,0,0,0,391,393,5,3,0,0,392,391,1,0,0,0,392,393,1,0,
        0,0,393,395,1,0,0,0,394,384,1,0,0,0,394,395,1,0,0,0,395,397,1,0,
        0,0,396,346,1,0,0,0,396,357,1,0,0,0,396,368,1,0,0,0,396,377,1,0,
        0,0,397,55,1,0,0,0,398,403,3,74,37,0,399,400,5,5,0,0,400,402,3,74,
        37,0,401,399,1,0,0,0,402,405,1,0,0,0,403,401,1,0,0,0,403,404,1,0,
        0,0,404,57,1,0,0,0,405,403,1,0,0,0,406,407,5,2,0,0,407,408,5,40,
        0,0,408,409,5,3,0,0,409,59,1,0,0,0,410,411,5,2,0,0,411,412,3,68,
        34,0,412,413,5,3,0,0,413,61,1,0,0,0,414,416,5,2,0,0,415,417,3,72,
        36,0,416,415,1,0,0,0,417,418,1,0,0,0,418,416,1,0,0,0,418,419,1,0,
        0,0,419,420,1,0,0,0,420,421,5,3,0,0,421,63,1,0,0,0,422,426,5,2,0,
        0,423,425,3,66,33,0,424,423,1,0,0,0,425,428,1,0,0,0,426,424,1,0,
        0,0,426,427,1,0,0,0,427,429,1,0,0,0,428,426,1,0,0,0,429,430,5,3,
        0,0,430,65,1,0,0,0,431,432,8,4,0,0,432,67,1,0,0,0,433,435,3,70,35,
        0,434,433,1,0,0,0,435,436,1,0,0,0,436,434,1,0,0,0,436,437,1,0,0,
        0,437,69,1,0,0,0,438,442,3,74,37,0,439,442,5,47,0,0,440,442,5,5,
        0,0,441,438,1,0,0,0,441,439,1,0,0,0,441,440,1,0,0,0,442,71,1,0,0,
        0,443,447,3,74,37,0,444,447,5,5,0,0,445,447,5,4,0,0,446,443,1,0,
        0,0,446,444,1,0,0,0,446,445,1,0,0,0,447,73,1,0,0,0,448,449,7,5,0,
        0,449,75,1,0,0,0,450,451,5,2,0,0,451,452,3,78,39,0,452,453,5,4,0,
        0,453,77,1,0,0,0,454,455,7,6,0,0,455,79,1,0,0,0,456,458,5,95,0,0,
        457,456,1,0,0,0,457,458,1,0,0,0,458,81,1,0,0,0,459,460,5,2,0,0,460,
        461,3,84,42,0,461,462,5,3,0,0,462,463,5,0,0,1,463,83,1,0,0,0,464,
        475,3,86,43,0,465,475,3,88,44,0,466,475,3,94,47,0,467,475,3,96,48,
        0,468,475,3,98,49,0,469,475,3,104,52,0,470,475,3,106,53,0,471,475,
        3,108,54,0,472,475,3,114,57,0,473,475,3,110,55,0,474,464,1,0,0,0,
        474,465,1,0,0,0,474,466,1,0,0,0,474,467,1,0,0,0,474,468,1,0,0,0,
        474,469,1,0,0,0,474,470,1,0,0,0,474,471,1,0,0,0,474,472,1,0,0,0,
        474,473,1,0,0,0,475,85,1,0,0,0,476,477,5,54,0,0,477,482,5,4,0,0,
        478,483,5,66,0,0,479,483,5,67,0,0,480,481,5,91,0,0,481,483,3,80,
        40,0,482,478,1,0,0,0,482,479,1,0,0,0,482,480,1,0,0,0,483,87,1,0,
        0,0,484,485,5,55,0,0,485,498,5,4,0,0,486,487,5,92,0,0,487,499,3,
        80,40,0,488,499,3,92,46,0,489,490,5,69,0,0,490,491,5,4,0,0,491,499,
        3,92,46,0,492,499,3,90,45,0,493,494,5,69,0,0,494,495,5,4,0,0,495,
        499,3,90,45,0,496,497,5,93,0,0,497,499,5,96,0,0,498,486,1,0,0,0,
        498,488,1,0,0,0,498,489,1,0,0,0,498,492,1,0,0,0,498,493,1,0,0,0,
        498,496,1,0,0,0,499,89,1,0,0,0,500,501,7,7,0,0,501,91,1,0,0,0,502,
        503,7,8,0,0,503,93,1,0,0,0,504,505,5,56,0,0,505,506,5,4,0,0,506,
        507,7,9,0,0,507,95,1,0,0,0,508,509,5,57,0,0,509,510,5,4,0,0,510,
        511,3,100,50,0,511,512,5,4,0,0,512,513,5,9,0,0,513,97,1,0,0,0,514,
        515,5,58,0,0,515,516,5,4,0,0,516,517,3,100,50,0,517,518,5,4,0,0,
        518,519,3,102,51,0,519,99,1,0,0,0,520,521,7,10,0,0,521,101,1,0,0,
        0,522,524,5,5,0,0,523,522,1,0,0,0,523,524,1,0,0,0,524,525,1,0,0,
        0,525,528,5,9,0,0,526,527,5,6,0,0,527,529,5,9,0,0,528,526,1,0,0,
        0,528,529,1,0,0,0,529,103,1,0,0,0,530,531,5,59,0,0,531,532,5,4,0,
        0,532,533,5,77,0,0,533,105,1,0,0,0,534,535,5,60,0,0,535,536,5,4,
        0,0,536,537,5,78,0,0,537,107,1,0,0,0,538,539,5,52,0,0,539,540,5,
        4,0,0,540,541,5,53,0,0,541,542,5,4,0,0,542,543,3,112,56,0,543,109,
        1,0,0,0,544,545,5,65,0,0,545,546,5,4,0,0,546,547,5,67,0,0,547,111,
        1,0,0,0,548,549,7,11,0,0,549,113,1,0,0,0,550,551,5,64,0,0,551,115,
        1,0,0,0,552,553,5,2,0,0,553,554,3,118,59,0,554,555,5,3,0,0,555,556,
        5,0,0,1,556,117,1,0,0,0,557,564,3,120,60,0,558,564,3,122,61,0,559,
        564,3,124,62,0,560,564,3,128,64,0,561,564,3,132,66,0,562,564,3,134,
        67,0,563,557,1,0,0,0,563,558,1,0,0,0,563,559,1,0,0,0,563,560,1,0,
        0,0,563,561,1,0,0,0,563,562,1,0,0,0,564,119,1,0,0,0,565,566,5,54,
        0,0,566,572,5,4,0,0,567,573,5,66,0,0,568,573,5,67,0,0,569,573,5,
        68,0,0,570,571,5,91,0,0,571,573,3,80,40,0,572,567,1,0,0,0,572,568,
        1,0,0,0,572,569,1,0,0,0,572,570,1,0,0,0,573,121,1,0,0,0,574,575,
        5,61,0,0,575,591,5,4,0,0,576,592,5,79,0,0,577,592,5,80,0,0,578,592,
        5,81,0,0,579,580,5,82,0,0,580,581,5,4,0,0,581,592,5,9,0,0,582,583,
        5,83,0,0,583,584,5,4,0,0,584,592,5,9,0,0,585,586,5,84,0,0,586,587,
        5,4,0,0,587,592,5,85,0,0,588,589,5,84,0,0,589,590,5,4,0,0,590,592,
        5,86,0,0,591,576,1,0,0,0,591,577,1,0,0,0,591,578,1,0,0,0,591,579,
        1,0,0,0,591,582,1,0,0,0,591,585,1,0,0,0,591,588,1,0,0,0,592,123,
        1,0,0,0,593,594,5,62,0,0,594,595,5,4,0,0,595,599,5,94,0,0,596,598,
        3,126,63,0,597,596,1,0,0,0,598,601,1,0,0,0,599,597,1,0,0,0,599,600,
        1,0,0,0,600,602,1,0,0,0,601,599,1,0,0,0,602,603,5,104,0,0,603,125,
        1,0,0,0,604,605,7,12,0,0,605,127,1,0,0,0,606,607,5,63,0,0,607,608,
        5,4,0,0,608,614,5,87,0,0,609,610,5,4,0,0,610,611,3,100,50,0,611,
        612,5,4,0,0,612,613,3,130,65,0,613,615,1,0,0,0,614,609,1,0,0,0,614,
        615,1,0,0,0,615,129,1,0,0,0,616,617,4,65,0,0,617,618,5,9,0,0,618,
        131,1,0,0,0,619,620,5,59,0,0,620,625,5,4,0,0,621,622,5,89,0,0,622,
        623,5,4,0,0,623,624,7,13,0,0,624,626,5,4,0,0,625,621,1,0,0,0,625,
        626,1,0,0,0,626,627,1,0,0,0,627,628,7,14,0,0,628,133,1,0,0,0,629,
        630,5,64,0,0,630,135,1,0,0,0,631,633,3,138,69,0,632,631,1,0,0,0,
        633,636,1,0,0,0,634,632,1,0,0,0,634,635,1,0,0,0,635,637,1,0,0,0,
        636,634,1,0,0,0,637,638,5,0,0,1,638,137,1,0,0,0,639,641,3,140,70,
        0,640,639,1,0,0,0,641,644,1,0,0,0,642,640,1,0,0,0,642,643,1,0,0,
        0,643,645,1,0,0,0,644,642,1,0,0,0,645,646,5,1,0,0,646,139,1,0,0,
        0,647,648,7,15,0,0,648,141,1,0,0,0,649,651,5,7,0,0,650,649,1,0,0,
        0,650,651,1,0,0,0,651,652,1,0,0,0,652,653,3,144,72,0,653,654,5,0,
        0,1,654,659,1,0,0,0,655,656,3,162,81,0,656,657,5,0,0,1,657,659,1,
        0,0,0,658,650,1,0,0,0,658,655,1,0,0,0,659,143,1,0,0,0,660,666,5,
        111,0,0,661,663,5,7,0,0,662,664,3,146,73,0,663,662,1,0,0,0,663,664,
        1,0,0,0,664,665,1,0,0,0,665,667,3,154,77,0,666,661,1,0,0,0,666,667,
        1,0,0,0,667,145,1,0,0,0,668,674,3,150,75,0,669,674,3,152,76,0,670,
        671,3,156,78,0,671,672,3,148,74,0,672,674,1,0,0,0,673,668,1,0,0,
        0,673,669,1,0,0,0,673,670,1,0,0,0,674,147,1,0,0,0,675,676,3,158,
        79,0,676,149,1,0,0,0,677,688,5,112,0,0,678,688,5,113,0,0,679,688,
        5,114,0,0,680,688,5,115,0,0,681,682,5,116,0,0,682,683,5,7,0,0,683,
        688,5,112,0,0,684,685,5,117,0,0,685,686,5,7,0,0,686,688,5,112,0,
        0,687,677,1,0,0,0,687,678,1,0,0,0,687,679,1,0,0,0,687,680,1,0,0,
        0,687,681,1,0,0,0,687,684,1,0,0,0,688,151,1,0,0,0,689,690,7,16,0,
        0,690,153,1,0,0,0,691,692,3,156,78,0,692,693,3,158,79,0,693,695,
        1,0,0,0,694,691,1,0,0,0,695,698,1,0,0,0,696,694,1,0,0,0,696,697,
        1,0,0,0,697,700,1,0,0,0,698,696,1,0,0,0,699,701,3,156,78,0,700,699,
        1,0,0,0,700,701,1,0,0,0,701,703,1,0,0,0,702,704,3,160,80,0,703,702,
        1,0,0,0,703,704,1,0,0,0,704,155,1,0,0,0,705,707,7,17,0,0,706,705,
        1,0,0,0,707,708,1,0,0,0,708,706,1,0,0,0,708,709,1,0,0,0,709,157,
        1,0,0,0,710,711,7,18,0,0,711,159,1,0,0,0,712,713,5,118,0,0,713,161,
        1,0,0,0,714,719,5,7,0,0,715,719,5,119,0,0,716,719,5,118,0,0,717,
        719,3,158,79,0,718,714,1,0,0,0,718,715,1,0,0,0,718,716,1,0,0,0,718,
        717,1,0,0,0,719,722,1,0,0,0,720,718,1,0,0,0,720,721,1,0,0,0,721,
        163,1,0,0,0,722,720,1,0,0,0,65,174,180,189,198,202,206,212,216,224,
        232,235,238,243,249,259,267,274,284,290,301,307,311,323,330,341,
        352,363,374,381,388,392,394,396,403,418,426,436,441,446,457,474,
        482,498,523,528,563,572,591,599,614,625,634,642,650,658,663,666,
        673,687,696,700,703,708,718,720
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
    public fmUniqueNamesLine(): FmUniqueNamesLineContext | null {
        return this.getRuleContext(0, FmUniqueNamesLineContext);
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


export class FmUniqueNamesLineContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public FM_LINE_HASH(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.FM_LINE_HASH, 0)!;
    }
    public tagBareBracket(): TagBareBracketContext {
        return this.getRuleContext(0, TagBareBracketContext)!;
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
        return MdTemplateParser.RULE_fmUniqueNamesLine;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterFmUniqueNamesLine) {
             listener.enterFmUniqueNamesLine(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitFmUniqueNamesLine) {
             listener.exitFmUniqueNamesLine(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitFmUniqueNamesLine) {
            return visitor.visitFmUniqueNamesLine(this);
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
    public tagName(): TagNameContext {
        return this.getRuleContext(0, TagNameContext)!;
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
    public tagName(): TagNameContext {
        return this.getRuleContext(0, TagNameContext)!;
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
    public tagName(): TagNameContext {
        return this.getRuleContext(0, TagNameContext)!;
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
export class TagPatternCandidateContext extends TagCandidateContext {
    public constructor(ctx: TagCandidateContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public PATTERN_OPEN(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.PATTERN_OPEN, 0)!;
    }
    public QUOTED(): antlr.TerminalNode[];
    public QUOTED(i: number): antlr.TerminalNode | null;
    public QUOTED(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(MdTemplateParser.QUOTED);
    	} else {
    		return this.getToken(MdTemplateParser.QUOTED, i);
    	}
    }
    public QUOTED_END(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.QUOTED_END, 0);
    }
    public tagBracketItem(): TagBracketItemContext[];
    public tagBracketItem(i: number): TagBracketItemContext | null;
    public tagBracketItem(i?: number): TagBracketItemContext[] | TagBracketItemContext | null {
        if (i === undefined) {
            return this.getRuleContexts(TagBracketItemContext);
        }

        return this.getRuleContext(i, TagBracketItemContext);
    }
    public RBRACK(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.RBRACK, 0);
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterTagPatternCandidate) {
             listener.enterTagPatternCandidate(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitTagPatternCandidate) {
             listener.exitTagPatternCandidate(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitTagPatternCandidate) {
            return visitor.visitTagPatternCandidate(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TagNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public tagWord(): TagWordContext[];
    public tagWord(i: number): TagWordContext | null;
    public tagWord(i?: number): TagWordContext[] | TagWordContext | null {
        if (i === undefined) {
            return this.getRuleContexts(TagWordContext);
        }

        return this.getRuleContext(i, TagWordContext);
    }
    public DASH(): antlr.TerminalNode[];
    public DASH(i: number): antlr.TerminalNode | null;
    public DASH(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(MdTemplateParser.DASH);
    	} else {
    		return this.getToken(MdTemplateParser.DASH, i);
    	}
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_tagName;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterTagName) {
             listener.enterTagName(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitTagName) {
             listener.exitTagName(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitTagName) {
            return visitor.visitTagName(this);
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
    public PATTERN(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.PATTERN, 0);
    }
    public REPEAT_RULES(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.REPEAT_RULES, 0);
    }
    public UNIQUE_HEADINGS_NAMES(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.UNIQUE_HEADINGS_NAMES, 0);
    }
    public FRONTMATTER(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.FRONTMATTER, 0);
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
    public fmUniqueNamesTag(): FmUniqueNamesTagContext | null {
        return this.getRuleContext(0, FmUniqueNamesTagContext);
    }
    public fmFrontmatterTag(): FmFrontmatterTagContext | null {
        return this.getRuleContext(0, FmFrontmatterTagContext);
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
    public fmShape(): FmShapeContext | null {
        return this.getRuleContext(0, FmShapeContext);
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


export class FmShapeContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public SEMVER(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.SEMVER, 0);
    }
    public DATE(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.DATE, 0);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_fmShape;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterFmShape) {
             listener.enterFmShape(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitFmShape) {
             listener.exitFmShape(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitFmShape) {
            return visitor.visitFmShape(this);
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


export class FmFrontmatterTagContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public FRONTMATTER(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.FRONTMATTER, 0)!;
    }
    public COLON(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.COLON, 0)!;
    }
    public OPTIONAL(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.OPTIONAL, 0)!;
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_fmFrontmatterTag;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterFmFrontmatterTag) {
             listener.enterFmFrontmatterTag(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitFmFrontmatterTag) {
             listener.exitFmFrontmatterTag(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitFmFrontmatterTag) {
            return visitor.visitFmFrontmatterTag(this);
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


export class FmUniqueNamesTagContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public UNIQUE_HEADINGS_NAMES(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.UNIQUE_HEADINGS_NAMES, 0)!;
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_fmUniqueNamesTag;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterFmUniqueNamesTag) {
             listener.enterFmUniqueNamesTag(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitFmUniqueNamesTag) {
             listener.exitFmUniqueNamesTag(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitFmUniqueNamesTag) {
            return visitor.visitFmUniqueNamesTag(this);
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
    public bodyPatternTag(): BodyPatternTagContext | null {
        return this.getRuleContext(0, BodyPatternTagContext);
    }
    public bodyRepeatTag(): BodyRepeatTagContext | null {
        return this.getRuleContext(0, BodyRepeatTagContext);
    }
    public bodyOrderTag(): BodyOrderTagContext | null {
        return this.getRuleContext(0, BodyOrderTagContext);
    }
    public bodyUniqueNamesTag(): BodyUniqueNamesTagContext | null {
        return this.getRuleContext(0, BodyUniqueNamesTagContext);
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
    public SUBHEADINGS(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.SUBHEADINGS, 0);
    }
    public DISALLOW(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.DISALLOW, 0);
    }
    public NO_EXTRA(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.NO_EXTRA, 0);
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


export class BodyPatternTagContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public PATTERN(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.PATTERN, 0)!;
    }
    public COLON(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.COLON, 0)!;
    }
    public PATTERN_QUOTE(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.PATTERN_QUOTE, 0)!;
    }
    public PAT_END(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.PAT_END, 0)!;
    }
    public patternPiece(): PatternPieceContext[];
    public patternPiece(i: number): PatternPieceContext | null;
    public patternPiece(i?: number): PatternPieceContext[] | PatternPieceContext | null {
        if (i === undefined) {
            return this.getRuleContexts(PatternPieceContext);
        }

        return this.getRuleContext(i, PatternPieceContext);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_bodyPatternTag;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterBodyPatternTag) {
             listener.enterBodyPatternTag(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitBodyPatternTag) {
             listener.exitBodyPatternTag(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitBodyPatternTag) {
            return visitor.visitBodyPatternTag(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class PatternPieceContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public PAT_TEXT(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.PAT_TEXT, 0);
    }
    public PAT_ESCAPE(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.PAT_ESCAPE, 0);
    }
    public PAT_LBRACE2(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.PAT_LBRACE2, 0);
    }
    public PAT_RBRACE2(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.PAT_RBRACE2, 0);
    }
    public PAT_PLACEHOLDER(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.PAT_PLACEHOLDER, 0);
    }
    public PAT_LBRACE(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.PAT_LBRACE, 0);
    }
    public PAT_RBRACE(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.PAT_RBRACE, 0);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_patternPiece;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterPatternPiece) {
             listener.enterPatternPiece(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitPatternPiece) {
             listener.exitPatternPiece(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitPatternPiece) {
            return visitor.visitPatternPiece(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class BodyRepeatTagContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public REPEAT_RULES(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.REPEAT_RULES, 0)!;
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
    public SAME_LEVEL(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.SAME_LEVEL, 0)!;
    }
    public fmBound(): FmBoundContext | null {
        return this.getRuleContext(0, FmBoundContext);
    }
    public repeatCount(): RepeatCountContext | null {
        return this.getRuleContext(0, RepeatCountContext);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_bodyRepeatTag;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterBodyRepeatTag) {
             listener.enterBodyRepeatTag(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitBodyRepeatTag) {
             listener.exitBodyRepeatTag(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitBodyRepeatTag) {
            return visitor.visitBodyRepeatTag(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class RepeatCountContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public NUMBER(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.NUMBER, 0)!;
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_repeatCount;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterRepeatCount) {
             listener.enterRepeatCount(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitRepeatCount) {
             listener.exitRepeatCount(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitRepeatCount) {
            return visitor.visitRepeatCount(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class BodyOrderTagContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ORDER(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.ORDER, 0)!;
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
    public ASCENDING(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.ASCENDING, 0);
    }
    public DESCENDING(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.DESCENDING, 0);
    }
    public FIRST(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.FIRST, 0);
    }
    public NUMBER_WORD(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.NUMBER_WORD, 0);
    }
    public DATE(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.DATE, 0);
    }
    public SEMVER(): antlr.TerminalNode | null {
        return this.getToken(MdTemplateParser.SEMVER, 0);
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_bodyOrderTag;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterBodyOrderTag) {
             listener.enterBodyOrderTag(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitBodyOrderTag) {
             listener.exitBodyOrderTag(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitBodyOrderTag) {
            return visitor.visitBodyOrderTag(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class BodyUniqueNamesTagContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public UNIQUE_HEADINGS_NAMES(): antlr.TerminalNode {
        return this.getToken(MdTemplateParser.UNIQUE_HEADINGS_NAMES, 0)!;
    }
    public override get ruleIndex(): number {
        return MdTemplateParser.RULE_bodyUniqueNamesTag;
    }
    public override enterRule(listener: MdTemplateParserListener): void {
        if(listener.enterBodyUniqueNamesTag) {
             listener.enterBodyUniqueNamesTag(this);
        }
    }
    public override exitRule(listener: MdTemplateParserListener): void {
        if(listener.exitBodyUniqueNamesTag) {
             listener.exitBodyUniqueNamesTag(this);
        }
    }
    public override accept<Result>(visitor: MdTemplateParserVisitor<Result>): Result | null {
        if (visitor.visitBodyUniqueNamesTag) {
            return visitor.visitBodyUniqueNamesTag(this);
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
