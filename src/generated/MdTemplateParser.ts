
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
    public static readonly REQUIRED = 65;
    public static readonly OPTIONAL = 66;
    public static readonly TEMPLATE_ONLY = 67;
    public static readonly ELEMENTS = 68;
    public static readonly SNAKE_CASE = 69;
    public static readonly KEBAB_CASE = 70;
    public static readonly FILENAME = 71;
    public static readonly SEMVER = 72;
    public static readonly DATE = 73;
    public static readonly MIN = 74;
    public static readonly MAX = 75;
    public static readonly ASCENDING = 76;
    public static readonly EXISTS = 77;
    public static readonly NON_EMPTY = 78;
    public static readonly TABLE = 79;
    public static readonly LIST = 80;
    public static readonly MIN_LINES = 81;
    public static readonly MAX_LINES = 82;
    public static readonly SUBHEADINGS = 83;
    public static readonly DISALLOW = 84;
    public static readonly NO_EXTRA = 85;
    public static readonly SAME_LEVEL = 86;
    public static readonly DESCENDING = 87;
    public static readonly FIRST = 88;
    public static readonly NUMBER_WORD = 89;
    public static readonly CONDITIONAL_ARG = 90;
    public static readonly CONSTANT_ARG = 91;
    public static readonly SCHEME_ARG = 92;
    public static readonly PATTERN_QUOTE = 93;
    public static readonly FREE_TEXT = 94;
    public static readonly SCHEME_TEXT = 95;
    public static readonly PAT_LBRACE2 = 96;
    public static readonly PAT_RBRACE2 = 97;
    public static readonly PAT_PLACEHOLDER = 98;
    public static readonly PAT_LBRACE = 99;
    public static readonly PAT_RBRACE = 100;
    public static readonly PAT_ESCAPE = 101;
    public static readonly PAT_TEXT = 102;
    public static readonly PAT_END = 103;
    public static readonly PAT_STRAY = 104;
    public static readonly SCAN_OPEN = 105;
    public static readonly SCAN_CLOSE = 106;
    public static readonly SCAN_TICKS = 107;
    public static readonly SCAN_TEXT = 108;
    public static readonly SCAN_CHAR = 109;
    public static readonly DIR_KEYWORD = 110;
    public static readonly DIR_DISABLE = 111;
    public static readonly DIR_DISABLE_LINE = 112;
    public static readonly DIR_DISABLE_NEXT_LINE = 113;
    public static readonly DIR_DISABLE_FILE = 114;
    public static readonly DIR_BEGIN = 115;
    public static readonly DIR_END = 116;
    public static readonly DIR_REASON = 117;
    public static readonly DIR_COMMA = 118;
    public static readonly DIR_WORD = 119;
    public static readonly FB_NL = 120;
    public static readonly T_LBRACK = 121;
    public static readonly T_RBRACK = 122;
    public static readonly T_COLON = 123;
    public static readonly T_DASH = 124;
    public static readonly Q_STRAY = 125;
    public static readonly Q_CLOSE = 126;
    public static readonly S_DOT = 127;
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
    public static readonly RULE_fmConvention = 55;
    public static readonly RULE_fmUniqueNamesTag = 56;
    public static readonly RULE_bodyTagEntry = 57;
    public static readonly RULE_bodyTagBody = 58;
    public static readonly RULE_bodyPresenceTag = 59;
    public static readonly RULE_bodyContentTag = 60;
    public static readonly RULE_bodyPatternTag = 61;
    public static readonly RULE_patternPiece = 62;
    public static readonly RULE_bodyRepeatTag = 63;
    public static readonly RULE_repeatCount = 64;
    public static readonly RULE_bodyOrderTag = 65;
    public static readonly RULE_bodyUniqueNamesTag = 66;
    public static readonly RULE_directiveScanEntry = 67;
    public static readonly RULE_directiveScanLine = 68;
    public static readonly RULE_directiveScanItem = 69;
    public static readonly RULE_directiveEntry = 70;
    public static readonly RULE_directive = 71;
    public static readonly RULE_directiveHead = 72;
    public static readonly RULE_directiveMisplaced = 73;
    public static readonly RULE_directiveVerb = 74;
    public static readonly RULE_directiveUnknown = 75;
    public static readonly RULE_directiveArgs = 76;
    public static readonly RULE_directiveSep = 77;
    public static readonly RULE_directiveItem = 78;
    public static readonly RULE_directiveReason = 79;
    public static readonly RULE_directiveProse = 80;

    public static readonly literalNames = [
        null, null, null, null, null, null, null, null, null, null, null, 
        null, null, null, null, null, null, null, null, null, null, null, 
        null, null, null, null, null, null, null, null, null, null, null, 
        null, null, null, null, null, null, null, "'rule'", "'iso'", "'url'", 
        "'lien'", "'path'", null, null, null, null, null, null, null, null, 
        null, "'presence'", "'format'", "'value'", "'count'", "'range'", 
        "'order'", "'io'", "'content'", "'pattern'", "'repeat-rules'", "'unique-headings-names'", 
        "'required'", "'optional'", "'template-only'", "'elements'", "'snake_case'", 
        "'kebab-case'", "'filename'", "'semver'", "'date'", "'min'", "'max'", 
        "'ascending'", "'exists'", "'non-empty'", "'table'", "'list'", "'min-lines'", 
        "'max-lines'", "'subheadings'", "'disallow'", "'no-extra'", "'same-level'", 
        "'descending'", "'first'", "'number'", "'conditional:'", "'constant:'", 
        "'scheme:'", null, null, null, "'{{'", "'}}'", null, "'{'", "'}'", 
        null, null, null, null, "'<!--'", "'-->'", null, null, null, "'md-template-lint'", 
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
        "REPEAT_RULES", "UNIQUE_HEADINGS_NAMES", "REQUIRED", "OPTIONAL", 
        "TEMPLATE_ONLY", "ELEMENTS", "SNAKE_CASE", "KEBAB_CASE", "FILENAME", 
        "SEMVER", "DATE", "MIN", "MAX", "ASCENDING", "EXISTS", "NON_EMPTY", 
        "TABLE", "LIST", "MIN_LINES", "MAX_LINES", "SUBHEADINGS", "DISALLOW", 
        "NO_EXTRA", "SAME_LEVEL", "DESCENDING", "FIRST", "NUMBER_WORD", 
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
        "fmSignedNumber", "fmOrderTag", "fmIoTag", "fmFilenameTag", "fmConvention", 
        "fmUniqueNamesTag", "bodyTagEntry", "bodyTagBody", "bodyPresenceTag", 
        "bodyContentTag", "bodyPatternTag", "patternPiece", "bodyRepeatTag", 
        "repeatCount", "bodyOrderTag", "bodyUniqueNamesTag", "directiveScanEntry", 
        "directiveScanLine", "directiveScanItem", "directiveEntry", "directive", 
        "directiveHead", "directiveMisplaced", "directiveVerb", "directiveUnknown", 
        "directiveArgs", "directiveSep", "directiveItem", "directiveReason", 
        "directiveProse",
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
            this.state = 172;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 0, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 162;
                this.frontmatter();
                this.state = 163;
                this.body();
                this.state = 164;
                this.match(MdTemplateParser.EOF);
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 166;
                this.fmUnclosed();
                this.state = 167;
                this.match(MdTemplateParser.EOF);
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 169;
                this.body();
                this.state = 170;
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
            this.state = 174;
            this.match(MdTemplateParser.FM_OPEN);
            this.state = 178;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 31)) & ~0x1F) === 0 && ((1 << (_la - 31)) & 31) !== 0)) {
                {
                {
                this.state = 175;
                this.fmLine();
                }
                }
                this.state = 180;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 181;
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
            this.state = 183;
            this.match(MdTemplateParser.FM_OPEN);
            this.state = 187;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 31)) & ~0x1F) === 0 && ((1 << (_la - 31)) & 31) !== 0)) {
                {
                {
                this.state = 184;
                this.fmLine();
                }
                }
                this.state = 189;
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
            this.state = 196;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 3, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 190;
                this.fmFilenameLine();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 191;
                this.fmUniqueNamesLine();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 192;
                this.fmCommentLine();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 193;
                this.fmKeyLine();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 194;
                this.fmBlankLine();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 195;
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
            this.state = 198;
            this.match(MdTemplateParser.FM_LINE_HASH);
            this.state = 200;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 7) {
                {
                this.state = 199;
                this.match(MdTemplateParser.WS);
                }
            }

            this.state = 202;
            this.tagCandidate();
            this.state = 204;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 7) {
                {
                this.state = 203;
                this.match(MdTemplateParser.WS);
                }
            }

            this.state = 206;
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
            this.state = 208;
            this.match(MdTemplateParser.FM_LINE_HASH);
            this.state = 210;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 7) {
                {
                this.state = 209;
                this.match(MdTemplateParser.WS);
                }
            }

            this.state = 212;
            this.tagBareBracket();
            this.state = 214;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 7) {
                {
                this.state = 213;
                this.match(MdTemplateParser.WS);
                }
            }

            this.state = 216;
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
            this.state = 218;
            this.match(MdTemplateParser.FM_LINE_HASH);
            this.state = 222;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 4294967292) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 4294967295) !== 0) || ((((_la - 96)) & ~0x1F) === 0 && ((1 << (_la - 96)) & 4294967295) !== 0)) {
                {
                {
                this.state = 219;
                this.fmCommentItem();
                }
                }
                this.state = 224;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 225;
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
            this.state = 236;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.FM_KEY_BARE:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 227;
                this.match(MdTemplateParser.FM_KEY_BARE);
                }
                break;
            case MdTemplateParser.FM_KEY:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 228;
                this.match(MdTemplateParser.FM_KEY);
                this.state = 230;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 62914560) !== 0)) {
                    {
                    this.state = 229;
                    this.fmValue();
                    }
                }

                this.state = 233;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 26) {
                    {
                    this.state = 232;
                    this.fmInlineComment();
                    }
                }

                this.state = 235;
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
            this.state = 239;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                {
                this.state = 238;
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
                this.state = 241;
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
            this.state = 243;
            this.match(MdTemplateParser.FM_COMMENT_HASH);
            this.state = 247;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 4294967292) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 4294967295) !== 0) || ((((_la - 96)) & ~0x1F) === 0 && ((1 << (_la - 96)) & 4294967295) !== 0)) {
                {
                {
                this.state = 244;
                this.fmCommentItem();
                }
                }
                this.state = 249;
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
            this.state = 257;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 14, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 250;
                this.tagCandidate();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 251;
                this.tagRuleMarker();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 252;
                this.tagBareBracket();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 253;
                this.tagShapedBracket();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 254;
                this.tagProseBracket();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 255;
                this.fmHintWord();
                }
                break;
            case 7:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 256;
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
            this.state = 259;
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
            this.state = 261;
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
            this.state = 263;
            this.match(MdTemplateParser.FM_LINE_START);
            this.state = 265;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 36) {
                {
                this.state = 264;
                this.match(MdTemplateParser.FM_TEXT_REST);
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
    public body(): BodyContext {
        let localContext = new BodyContext(this.context, this.state);
        this.enterRule(localContext, 28, MdTemplateParser.RULE_body);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 272;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 2037760) !== 0)) {
                {
                {
                this.state = 269;
                this.bodyBlock();
                }
                }
                this.state = 274;
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
            this.state = 282;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.H_OPEN:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 275;
                this.bodyHeading();
                }
                break;
            case MdTemplateParser.FENCE_OPEN:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 276;
                this.bodyFence();
                }
                break;
            case MdTemplateParser.BODY_TABLE_ROW:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 277;
                this.bodyTableRow();
                }
                break;
            case MdTemplateParser.BODY_LIST_ITEM:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 278;
                this.bodyListItem();
                }
                break;
            case MdTemplateParser.BODY_HTML_COMMENT:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 279;
                this.bodyHtmlComment();
                }
                break;
            case MdTemplateParser.BODY_BLANK:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 280;
                this.bodyBlankLine();
                }
                break;
            case MdTemplateParser.BODY_TEXT_START:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 281;
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
            this.state = 284;
            this.match(MdTemplateParser.H_OPEN);
            this.state = 288;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 4294967292) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 4294967295) !== 0) || ((((_la - 96)) & ~0x1F) === 0 && ((1 << (_la - 96)) & 4294967295) !== 0)) {
                {
                {
                this.state = 285;
                this.bodyHeadingItem();
                }
                }
                this.state = 290;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 291;
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
            this.state = 299;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 19, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 293;
                this.tagCandidate();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 294;
                this.tagRuleMarker();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 295;
                this.tagBareBracket();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 296;
                this.tagShapedBracket();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 297;
                this.tagProseBracket();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 298;
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
            this.state = 301;
            this.match(MdTemplateParser.FENCE_OPEN);
            this.state = 305;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 13 || _la === 14) {
                {
                {
                this.state = 302;
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
                this.state = 307;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 309;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 15) {
                {
                this.state = 308;
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
            this.state = 311;
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
            this.state = 313;
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
            this.state = 315;
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
            this.state = 317;
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
            this.state = 319;
            this.match(MdTemplateParser.BODY_TEXT_START);
            this.state = 321;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 21) {
                {
                this.state = 320;
                this.match(MdTemplateParser.BODY_TEXT_REST);
                }
            }

            this.state = 323;
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
            this.state = 328;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 4294967292) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 4294967295) !== 0) || ((((_la - 96)) & ~0x1F) === 0 && ((1 << (_la - 96)) & 4294967295) !== 0)) {
                {
                {
                this.state = 325;
                this.fmCommentItem();
                }
                }
                this.state = 330;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 331;
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
            this.state = 333;
            this.fmFilenameLine();
            this.state = 334;
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
            this.state = 339;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 4294967292) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 4294967295) !== 0) || ((((_la - 96)) & ~0x1F) === 0 && ((1 << (_la - 96)) & 4294967295) !== 0)) {
                {
                {
                this.state = 336;
                this.bodyHeadingItem();
                }
                }
                this.state = 341;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 342;
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
            this.state = 394;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 32, this.context) ) {
            case 1:
                localContext = new TagShapedCandidateContext(localContext);
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 344;
                this.match(MdTemplateParser.LBRACK);
                this.state = 345;
                this.tagName();
                this.state = 346;
                this.match(MdTemplateParser.COLON);
                this.state = 350;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 1584) !== 0) || ((((_la - 39)) & ~0x1F) === 0 && ((1 << (_la - 39)) & 191) !== 0)) {
                    {
                    {
                    this.state = 347;
                    this.tagShapePiece();
                    }
                    }
                    this.state = 352;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                this.state = 353;
                this.match(MdTemplateParser.RBRACK);
                }
                break;
            case 2:
                localContext = new TagClosedCandidateContext(localContext);
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 355;
                this.match(MdTemplateParser.LBRACK);
                this.state = 356;
                this.tagName();
                this.state = 357;
                this.match(MdTemplateParser.COLON);
                this.state = 361;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 4294967284) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 4294967295) !== 0) || ((((_la - 96)) & ~0x1F) === 0 && ((1 << (_la - 96)) & 4294967295) !== 0)) {
                    {
                    {
                    this.state = 358;
                    this.tagBracketItem();
                    }
                    }
                    this.state = 363;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                this.state = 364;
                this.match(MdTemplateParser.RBRACK);
                }
                break;
            case 3:
                localContext = new TagUnclosedCandidateContext(localContext);
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 366;
                this.match(MdTemplateParser.LBRACK);
                this.state = 367;
                this.tagName();
                this.state = 368;
                this.match(MdTemplateParser.COLON);
                this.state = 372;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 27, this.context);
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                        {
                        this.state = 369;
                        this.tagBracketItem();
                        }
                        }
                    }
                    this.state = 374;
                    this.errorHandler.sync(this);
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 27, this.context);
                }
                }
                break;
            case 4:
                localContext = new TagPatternCandidateContext(localContext);
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 375;
                this.match(MdTemplateParser.PATTERN_OPEN);
                this.state = 379;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 28, this.context);
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                        {
                        this.state = 376;
                        this.match(MdTemplateParser.QUOTED);
                        }
                        }
                    }
                    this.state = 381;
                    this.errorHandler.sync(this);
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 28, this.context);
                }
                this.state = 392;
                this.errorHandler.sync(this);
                switch (this.interpreter.adaptivePredict(this.tokenStream, 31, this.context) ) {
                case 1:
                    {
                    this.state = 382;
                    this.match(MdTemplateParser.QUOTED_END);
                    this.state = 386;
                    this.errorHandler.sync(this);
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 29, this.context);
                    while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                        if (alternative === 1) {
                            {
                            {
                            this.state = 383;
                            this.tagBracketItem();
                            }
                            }
                        }
                        this.state = 388;
                        this.errorHandler.sync(this);
                        alternative = this.interpreter.adaptivePredict(this.tokenStream, 29, this.context);
                    }
                    this.state = 390;
                    this.errorHandler.sync(this);
                    switch (this.interpreter.adaptivePredict(this.tokenStream, 30, this.context) ) {
                    case 1:
                        {
                        this.state = 389;
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
            this.state = 396;
            this.tagWord();
            this.state = 401;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 5) {
                {
                {
                this.state = 397;
                this.match(MdTemplateParser.DASH);
                this.state = 398;
                this.tagWord();
                }
                }
                this.state = 403;
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
            this.state = 404;
            this.match(MdTemplateParser.LBRACK);
            this.state = 405;
            this.match(MdTemplateParser.RULE);
            this.state = 406;
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
            this.state = 408;
            this.match(MdTemplateParser.LBRACK);
            this.state = 409;
            this.tagHintName();
            this.state = 410;
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
            this.state = 412;
            this.match(MdTemplateParser.LBRACK);
            this.state = 414;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                {
                this.state = 413;
                this.tagShapePiece();
                }
                }
                this.state = 416;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 1584) !== 0) || ((((_la - 39)) & ~0x1F) === 0 && ((1 << (_la - 39)) & 191) !== 0));
            this.state = 418;
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
            this.state = 420;
            this.match(MdTemplateParser.LBRACK);
            this.state = 424;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 4294967284) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 4294967295) !== 0) || ((((_la - 96)) & ~0x1F) === 0 && ((1 << (_la - 96)) & 4294967295) !== 0)) {
                {
                {
                this.state = 421;
                this.tagBracketItem();
                }
                }
                this.state = 426;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 427;
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
            this.state = 429;
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
            this.state = 432;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                {
                this.state = 431;
                this.tagHintPiece();
                }
                }
                this.state = 434;
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
            this.state = 439;
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
                this.state = 436;
                this.tagWord();
                }
                break;
            case MdTemplateParser.UWORD:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 437;
                this.match(MdTemplateParser.UWORD);
                }
                break;
            case MdTemplateParser.DASH:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 438;
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
            this.state = 444;
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
                this.state = 441;
                this.tagWord();
                }
                break;
            case MdTemplateParser.DASH:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 442;
                this.match(MdTemplateParser.DASH);
                }
                break;
            case MdTemplateParser.COLON:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 443;
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
            this.state = 446;
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
            this.state = 448;
            this.match(MdTemplateParser.LBRACK);
            this.state = 449;
            this.tagFamily();
            this.state = 450;
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
            this.state = 452;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 52)) & ~0x1F) === 0 && ((1 << (_la - 52)) & 8189) !== 0))) {
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
            this.state = 455;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 94) {
                {
                this.state = 454;
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
            this.state = 457;
            this.match(MdTemplateParser.LBRACK);
            this.state = 458;
            this.fmTagBody();
            this.state = 459;
            this.match(MdTemplateParser.RBRACK);
            this.state = 460;
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
            this.state = 471;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.PRESENCE:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 462;
                this.fmPresenceTag();
                }
                break;
            case MdTemplateParser.FORMAT:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 463;
                this.fmFormatTag();
                }
                break;
            case MdTemplateParser.VALUE:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 464;
                this.fmValueTag();
                }
                break;
            case MdTemplateParser.COUNT:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 465;
                this.fmCountTag();
                }
                break;
            case MdTemplateParser.RANGE:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 466;
                this.fmRangeTag();
                }
                break;
            case MdTemplateParser.ORDER:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 467;
                this.fmOrderTag();
                }
                break;
            case MdTemplateParser.IO:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 468;
                this.fmIoTag();
                }
                break;
            case MdTemplateParser.FILENAME_CS:
                this.enterOuterAlt(localContext, 8);
                {
                this.state = 469;
                this.fmFilenameTag();
                }
                break;
            case MdTemplateParser.UNIQUE_HEADINGS_NAMES:
                this.enterOuterAlt(localContext, 9);
                {
                this.state = 470;
                this.fmUniqueNamesTag();
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
            this.state = 473;
            this.match(MdTemplateParser.PRESENCE);
            this.state = 474;
            this.match(MdTemplateParser.COLON);
            this.state = 479;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.REQUIRED:
                {
                this.state = 475;
                this.match(MdTemplateParser.REQUIRED);
                }
                break;
            case MdTemplateParser.OPTIONAL:
                {
                this.state = 476;
                this.match(MdTemplateParser.OPTIONAL);
                }
                break;
            case MdTemplateParser.CONDITIONAL_ARG:
                {
                this.state = 477;
                this.match(MdTemplateParser.CONDITIONAL_ARG);
                this.state = 478;
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
            this.state = 481;
            this.match(MdTemplateParser.FORMAT);
            this.state = 482;
            this.match(MdTemplateParser.COLON);
            this.state = 495;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 42, this.context) ) {
            case 1:
                {
                this.state = 483;
                this.match(MdTemplateParser.CONSTANT_ARG);
                this.state = 484;
                this.tagFreeText();
                }
                break;
            case 2:
                {
                this.state = 485;
                this.fmCaseStyle();
                }
                break;
            case 3:
                {
                this.state = 486;
                this.match(MdTemplateParser.ELEMENTS);
                this.state = 487;
                this.match(MdTemplateParser.COLON);
                this.state = 488;
                this.fmCaseStyle();
                }
                break;
            case 4:
                {
                this.state = 489;
                this.fmShape();
                }
                break;
            case 5:
                {
                this.state = 490;
                this.match(MdTemplateParser.ELEMENTS);
                this.state = 491;
                this.match(MdTemplateParser.COLON);
                this.state = 492;
                this.fmShape();
                }
                break;
            case 6:
                {
                this.state = 493;
                this.match(MdTemplateParser.SCHEME_ARG);
                this.state = 494;
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
            this.state = 497;
            _la = this.tokenStream.LA(1);
            if(!(_la === 72 || _la === 73)) {
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
            this.state = 499;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 48)) & ~0x1F) === 0 && ((1 << (_la - 48)) & 6291459) !== 0))) {
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
            this.state = 501;
            this.match(MdTemplateParser.VALUE);
            this.state = 502;
            this.match(MdTemplateParser.COLON);
            this.state = 503;
            _la = this.tokenStream.LA(1);
            if(!(_la === 52 || _la === 71)) {
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
            this.state = 505;
            this.match(MdTemplateParser.COUNT);
            this.state = 506;
            this.match(MdTemplateParser.COLON);
            this.state = 507;
            this.fmBound();
            this.state = 508;
            this.match(MdTemplateParser.COLON);
            this.state = 509;
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
            this.state = 511;
            this.match(MdTemplateParser.RANGE);
            this.state = 512;
            this.match(MdTemplateParser.COLON);
            this.state = 513;
            this.fmBound();
            this.state = 514;
            this.match(MdTemplateParser.COLON);
            this.state = 515;
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
            this.state = 517;
            _la = this.tokenStream.LA(1);
            if(!(_la === 74 || _la === 75)) {
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
            this.state = 520;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 5) {
                {
                this.state = 519;
                this.match(MdTemplateParser.DASH);
                }
            }

            this.state = 522;
            this.match(MdTemplateParser.NUMBER);
            this.state = 525;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 6) {
                {
                this.state = 523;
                this.match(MdTemplateParser.DOT);
                this.state = 524;
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
            this.state = 527;
            this.match(MdTemplateParser.ORDER);
            this.state = 528;
            this.match(MdTemplateParser.COLON);
            this.state = 529;
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
            this.state = 531;
            this.match(MdTemplateParser.IO);
            this.state = 532;
            this.match(MdTemplateParser.COLON);
            this.state = 533;
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
            this.state = 535;
            this.match(MdTemplateParser.FILENAME_CS);
            this.state = 536;
            this.match(MdTemplateParser.COLON);
            this.state = 537;
            this.match(MdTemplateParser.CASE_CS);
            this.state = 538;
            this.match(MdTemplateParser.COLON);
            this.state = 539;
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
        this.enterRule(localContext, 110, MdTemplateParser.RULE_fmConvention);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 541;
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
        this.enterRule(localContext, 112, MdTemplateParser.RULE_fmUniqueNamesTag);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 543;
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
        this.enterRule(localContext, 114, MdTemplateParser.RULE_bodyTagEntry);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 545;
            this.match(MdTemplateParser.LBRACK);
            this.state = 546;
            this.bodyTagBody();
            this.state = 547;
            this.match(MdTemplateParser.RBRACK);
            this.state = 548;
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
        this.enterRule(localContext, 116, MdTemplateParser.RULE_bodyTagBody);
        try {
            this.state = 556;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.PRESENCE:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 550;
                this.bodyPresenceTag();
                }
                break;
            case MdTemplateParser.CONTENT:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 551;
                this.bodyContentTag();
                }
                break;
            case MdTemplateParser.PATTERN:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 552;
                this.bodyPatternTag();
                }
                break;
            case MdTemplateParser.REPEAT_RULES:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 553;
                this.bodyRepeatTag();
                }
                break;
            case MdTemplateParser.ORDER:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 554;
                this.bodyOrderTag();
                }
                break;
            case MdTemplateParser.UNIQUE_HEADINGS_NAMES:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 555;
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
        this.enterRule(localContext, 118, MdTemplateParser.RULE_bodyPresenceTag);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 558;
            this.match(MdTemplateParser.PRESENCE);
            this.state = 559;
            this.match(MdTemplateParser.COLON);
            this.state = 565;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.REQUIRED:
                {
                this.state = 560;
                this.match(MdTemplateParser.REQUIRED);
                }
                break;
            case MdTemplateParser.OPTIONAL:
                {
                this.state = 561;
                this.match(MdTemplateParser.OPTIONAL);
                }
                break;
            case MdTemplateParser.TEMPLATE_ONLY:
                {
                this.state = 562;
                this.match(MdTemplateParser.TEMPLATE_ONLY);
                }
                break;
            case MdTemplateParser.CONDITIONAL_ARG:
                {
                this.state = 563;
                this.match(MdTemplateParser.CONDITIONAL_ARG);
                this.state = 564;
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
        this.enterRule(localContext, 120, MdTemplateParser.RULE_bodyContentTag);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 567;
            this.match(MdTemplateParser.CONTENT);
            this.state = 568;
            this.match(MdTemplateParser.COLON);
            this.state = 584;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 47, this.context) ) {
            case 1:
                {
                this.state = 569;
                this.match(MdTemplateParser.NON_EMPTY);
                }
                break;
            case 2:
                {
                this.state = 570;
                this.match(MdTemplateParser.TABLE);
                }
                break;
            case 3:
                {
                this.state = 571;
                this.match(MdTemplateParser.LIST);
                }
                break;
            case 4:
                {
                this.state = 572;
                this.match(MdTemplateParser.MIN_LINES);
                this.state = 573;
                this.match(MdTemplateParser.COLON);
                this.state = 574;
                this.match(MdTemplateParser.NUMBER);
                }
                break;
            case 5:
                {
                this.state = 575;
                this.match(MdTemplateParser.MAX_LINES);
                this.state = 576;
                this.match(MdTemplateParser.COLON);
                this.state = 577;
                this.match(MdTemplateParser.NUMBER);
                }
                break;
            case 6:
                {
                this.state = 578;
                this.match(MdTemplateParser.SUBHEADINGS);
                this.state = 579;
                this.match(MdTemplateParser.COLON);
                this.state = 580;
                this.match(MdTemplateParser.DISALLOW);
                }
                break;
            case 7:
                {
                this.state = 581;
                this.match(MdTemplateParser.SUBHEADINGS);
                this.state = 582;
                this.match(MdTemplateParser.COLON);
                this.state = 583;
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
        this.enterRule(localContext, 122, MdTemplateParser.RULE_bodyPatternTag);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 586;
            this.match(MdTemplateParser.PATTERN);
            this.state = 587;
            this.match(MdTemplateParser.COLON);
            this.state = 588;
            this.match(MdTemplateParser.PATTERN_QUOTE);
            this.state = 592;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 96)) & ~0x1F) === 0 && ((1 << (_la - 96)) & 127) !== 0)) {
                {
                {
                this.state = 589;
                this.patternPiece();
                }
                }
                this.state = 594;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 595;
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
        this.enterRule(localContext, 124, MdTemplateParser.RULE_patternPiece);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 597;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 96)) & ~0x1F) === 0 && ((1 << (_la - 96)) & 127) !== 0))) {
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
        this.enterRule(localContext, 126, MdTemplateParser.RULE_bodyRepeatTag);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 599;
            this.match(MdTemplateParser.REPEAT_RULES);
            this.state = 600;
            this.match(MdTemplateParser.COLON);
            this.state = 601;
            this.match(MdTemplateParser.SAME_LEVEL);
            this.state = 607;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 4) {
                {
                this.state = 602;
                this.match(MdTemplateParser.COLON);
                this.state = 603;
                this.fmBound();
                this.state = 604;
                this.match(MdTemplateParser.COLON);
                this.state = 605;
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
        this.enterRule(localContext, 128, MdTemplateParser.RULE_repeatCount);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 609;
            if (!(this.startsWithNonZero())) {
                throw this.createFailedPredicateException("this.startsWithNonZero()");
            }
            this.state = 610;
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
        this.enterRule(localContext, 130, MdTemplateParser.RULE_bodyOrderTag);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 612;
            this.match(MdTemplateParser.ORDER);
            this.state = 613;
            this.match(MdTemplateParser.COLON);
            this.state = 618;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 88) {
                {
                this.state = 614;
                this.match(MdTemplateParser.FIRST);
                this.state = 615;
                this.match(MdTemplateParser.COLON);
                this.state = 616;
                _la = this.tokenStream.LA(1);
                if(!(((((_la - 72)) & ~0x1F) === 0 && ((1 << (_la - 72)) & 131075) !== 0))) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 617;
                this.match(MdTemplateParser.COLON);
                }
            }

            this.state = 620;
            _la = this.tokenStream.LA(1);
            if(!(_la === 76 || _la === 87)) {
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
        this.enterRule(localContext, 132, MdTemplateParser.RULE_bodyUniqueNamesTag);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 622;
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
        this.enterRule(localContext, 134, MdTemplateParser.RULE_directiveScanEntry);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 627;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 1 || ((((_la - 105)) & ~0x1F) === 0 && ((1 << (_la - 105)) & 31) !== 0)) {
                {
                {
                this.state = 624;
                this.directiveScanLine();
                }
                }
                this.state = 629;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 630;
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
        this.enterRule(localContext, 136, MdTemplateParser.RULE_directiveScanLine);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 635;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 105)) & ~0x1F) === 0 && ((1 << (_la - 105)) & 31) !== 0)) {
                {
                {
                this.state = 632;
                this.directiveScanItem();
                }
                }
                this.state = 637;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 638;
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
        this.enterRule(localContext, 138, MdTemplateParser.RULE_directiveScanItem);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 640;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 105)) & ~0x1F) === 0 && ((1 << (_la - 105)) & 31) !== 0))) {
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
        this.enterRule(localContext, 140, MdTemplateParser.RULE_directiveEntry);
        let _la: number;
        try {
            this.state = 651;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 54, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 643;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 7) {
                    {
                    this.state = 642;
                    this.match(MdTemplateParser.WS);
                    }
                }

                this.state = 645;
                this.directive();
                this.state = 646;
                this.match(MdTemplateParser.EOF);
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 648;
                this.directiveProse();
                this.state = 649;
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
        this.enterRule(localContext, 142, MdTemplateParser.RULE_directive);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 653;
            this.match(MdTemplateParser.DIR_KEYWORD);
            this.state = 659;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 7) {
                {
                this.state = 654;
                this.match(MdTemplateParser.WS);
                this.state = 656;
                this.errorHandler.sync(this);
                switch (this.interpreter.adaptivePredict(this.tokenStream, 55, this.context) ) {
                case 1:
                    {
                    this.state = 655;
                    this.directiveHead();
                    }
                    break;
                }
                this.state = 658;
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
        this.enterRule(localContext, 144, MdTemplateParser.RULE_directiveHead);
        try {
            this.state = 666;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 57, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 661;
                this.directiveVerb();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 662;
                this.directiveUnknown();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 663;
                this.directiveSep();
                this.state = 664;
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
        this.enterRule(localContext, 146, MdTemplateParser.RULE_directiveMisplaced);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 668;
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
        this.enterRule(localContext, 148, MdTemplateParser.RULE_directiveVerb);
        try {
            this.state = 680;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case MdTemplateParser.DIR_DISABLE:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 670;
                this.match(MdTemplateParser.DIR_DISABLE);
                }
                break;
            case MdTemplateParser.DIR_DISABLE_LINE:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 671;
                this.match(MdTemplateParser.DIR_DISABLE_LINE);
                }
                break;
            case MdTemplateParser.DIR_DISABLE_NEXT_LINE:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 672;
                this.match(MdTemplateParser.DIR_DISABLE_NEXT_LINE);
                }
                break;
            case MdTemplateParser.DIR_DISABLE_FILE:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 673;
                this.match(MdTemplateParser.DIR_DISABLE_FILE);
                }
                break;
            case MdTemplateParser.DIR_BEGIN:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 674;
                this.match(MdTemplateParser.DIR_BEGIN);
                this.state = 675;
                this.match(MdTemplateParser.WS);
                this.state = 676;
                this.match(MdTemplateParser.DIR_DISABLE);
                }
                break;
            case MdTemplateParser.DIR_END:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 677;
                this.match(MdTemplateParser.DIR_END);
                this.state = 678;
                this.match(MdTemplateParser.WS);
                this.state = 679;
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
        this.enterRule(localContext, 150, MdTemplateParser.RULE_directiveUnknown);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 682;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 110)) & ~0x1F) === 0 && ((1 << (_la - 110)) & 609) !== 0))) {
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
        this.enterRule(localContext, 152, MdTemplateParser.RULE_directiveArgs);
        let _la: number;
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 689;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 59, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 684;
                    this.directiveSep();
                    this.state = 685;
                    this.directiveItem();
                    }
                    }
                }
                this.state = 691;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 59, this.context);
            }
            this.state = 693;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 7 || _la === 118) {
                {
                this.state = 692;
                this.directiveSep();
                }
            }

            this.state = 696;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 117) {
                {
                this.state = 695;
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
        this.enterRule(localContext, 154, MdTemplateParser.RULE_directiveSep);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 699;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                {
                this.state = 698;
                _la = this.tokenStream.LA(1);
                if(!(_la === 7 || _la === 118)) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                }
                }
                this.state = 701;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while (_la === 7 || _la === 118);
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
        this.enterRule(localContext, 156, MdTemplateParser.RULE_directiveItem);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 703;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 110)) & ~0x1F) === 0 && ((1 << (_la - 110)) & 639) !== 0))) {
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
        this.enterRule(localContext, 158, MdTemplateParser.RULE_directiveReason);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 705;
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
        this.enterRule(localContext, 160, MdTemplateParser.RULE_directiveProse);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 713;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 7 || ((((_la - 110)) & ~0x1F) === 0 && ((1 << (_la - 110)) & 1023) !== 0)) {
                {
                this.state = 711;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case MdTemplateParser.WS:
                    {
                    this.state = 707;
                    this.match(MdTemplateParser.WS);
                    }
                    break;
                case MdTemplateParser.DIR_COMMA:
                    {
                    this.state = 708;
                    this.match(MdTemplateParser.DIR_COMMA);
                    }
                    break;
                case MdTemplateParser.DIR_REASON:
                    {
                    this.state = 709;
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
                    this.state = 710;
                    this.directiveItem();
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 715;
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
        case 64:
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
        4,1,127,717,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,
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
        78,2,79,7,79,2,80,7,80,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,3,
        0,173,8,0,1,1,1,1,5,1,177,8,1,10,1,12,1,180,9,1,1,1,1,1,1,2,1,2,
        5,2,186,8,2,10,2,12,2,189,9,2,1,3,1,3,1,3,1,3,1,3,1,3,3,3,197,8,
        3,1,4,1,4,3,4,201,8,4,1,4,1,4,3,4,205,8,4,1,4,1,4,1,5,1,5,3,5,211,
        8,5,1,5,1,5,3,5,215,8,5,1,5,1,5,1,6,1,6,5,6,221,8,6,10,6,12,6,224,
        9,6,1,6,1,6,1,7,1,7,1,7,3,7,231,8,7,1,7,3,7,234,8,7,1,7,3,7,237,
        8,7,1,8,4,8,240,8,8,11,8,12,8,241,1,9,1,9,5,9,246,8,9,10,9,12,9,
        249,9,9,1,10,1,10,1,10,1,10,1,10,1,10,1,10,3,10,258,8,10,1,11,1,
        11,1,12,1,12,1,13,1,13,3,13,266,8,13,1,13,1,13,1,14,5,14,271,8,14,
        10,14,12,14,274,9,14,1,15,1,15,1,15,1,15,1,15,1,15,1,15,3,15,283,
        8,15,1,16,1,16,5,16,287,8,16,10,16,12,16,290,9,16,1,16,1,16,1,17,
        1,17,1,17,1,17,1,17,1,17,3,17,300,8,17,1,18,1,18,5,18,304,8,18,10,
        18,12,18,307,9,18,1,18,3,18,310,8,18,1,19,1,19,1,20,1,20,1,21,1,
        21,1,22,1,22,1,23,1,23,3,23,322,8,23,1,23,1,23,1,24,5,24,327,8,24,
        10,24,12,24,330,9,24,1,24,1,24,1,25,1,25,1,25,1,26,5,26,338,8,26,
        10,26,12,26,341,9,26,1,26,1,26,1,27,1,27,1,27,1,27,5,27,349,8,27,
        10,27,12,27,352,9,27,1,27,1,27,1,27,1,27,1,27,1,27,5,27,360,8,27,
        10,27,12,27,363,9,27,1,27,1,27,1,27,1,27,1,27,1,27,5,27,371,8,27,
        10,27,12,27,374,9,27,1,27,1,27,5,27,378,8,27,10,27,12,27,381,9,27,
        1,27,1,27,5,27,385,8,27,10,27,12,27,388,9,27,1,27,3,27,391,8,27,
        3,27,393,8,27,3,27,395,8,27,1,28,1,28,1,28,5,28,400,8,28,10,28,12,
        28,403,9,28,1,29,1,29,1,29,1,29,1,30,1,30,1,30,1,30,1,31,1,31,4,
        31,415,8,31,11,31,12,31,416,1,31,1,31,1,32,1,32,5,32,423,8,32,10,
        32,12,32,426,9,32,1,32,1,32,1,33,1,33,1,34,4,34,433,8,34,11,34,12,
        34,434,1,35,1,35,1,35,3,35,440,8,35,1,36,1,36,1,36,3,36,445,8,36,
        1,37,1,37,1,38,1,38,1,38,1,38,1,39,1,39,1,40,3,40,456,8,40,1,41,
        1,41,1,41,1,41,1,41,1,42,1,42,1,42,1,42,1,42,1,42,1,42,1,42,1,42,
        3,42,472,8,42,1,43,1,43,1,43,1,43,1,43,1,43,3,43,480,8,43,1,44,1,
        44,1,44,1,44,1,44,1,44,1,44,1,44,1,44,1,44,1,44,1,44,1,44,1,44,3,
        44,496,8,44,1,45,1,45,1,46,1,46,1,47,1,47,1,47,1,47,1,48,1,48,1,
        48,1,48,1,48,1,48,1,49,1,49,1,49,1,49,1,49,1,49,1,50,1,50,1,51,3,
        51,521,8,51,1,51,1,51,1,51,3,51,526,8,51,1,52,1,52,1,52,1,52,1,53,
        1,53,1,53,1,53,1,54,1,54,1,54,1,54,1,54,1,54,1,55,1,55,1,56,1,56,
        1,57,1,57,1,57,1,57,1,57,1,58,1,58,1,58,1,58,1,58,1,58,3,58,557,
        8,58,1,59,1,59,1,59,1,59,1,59,1,59,1,59,3,59,566,8,59,1,60,1,60,
        1,60,1,60,1,60,1,60,1,60,1,60,1,60,1,60,1,60,1,60,1,60,1,60,1,60,
        1,60,1,60,3,60,585,8,60,1,61,1,61,1,61,1,61,5,61,591,8,61,10,61,
        12,61,594,9,61,1,61,1,61,1,62,1,62,1,63,1,63,1,63,1,63,1,63,1,63,
        1,63,1,63,3,63,608,8,63,1,64,1,64,1,64,1,65,1,65,1,65,1,65,1,65,
        1,65,3,65,619,8,65,1,65,1,65,1,66,1,66,1,67,5,67,626,8,67,10,67,
        12,67,629,9,67,1,67,1,67,1,68,5,68,634,8,68,10,68,12,68,637,9,68,
        1,68,1,68,1,69,1,69,1,70,3,70,644,8,70,1,70,1,70,1,70,1,70,1,70,
        1,70,3,70,652,8,70,1,71,1,71,1,71,3,71,657,8,71,1,71,3,71,660,8,
        71,1,72,1,72,1,72,1,72,1,72,3,72,667,8,72,1,73,1,73,1,74,1,74,1,
        74,1,74,1,74,1,74,1,74,1,74,1,74,1,74,3,74,681,8,74,1,75,1,75,1,
        76,1,76,1,76,5,76,688,8,76,10,76,12,76,691,9,76,1,76,3,76,694,8,
        76,1,76,3,76,697,8,76,1,77,4,77,700,8,77,11,77,12,77,701,1,78,1,
        78,1,79,1,79,1,80,1,80,1,80,1,80,5,80,712,8,80,10,80,12,80,715,9,
        80,1,80,0,0,81,0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,
        36,38,40,42,44,46,48,50,52,54,56,58,60,62,64,66,68,70,72,74,76,78,
        80,82,84,86,88,90,92,94,96,98,100,102,104,106,108,110,112,114,116,
        118,120,122,124,126,128,130,132,134,136,138,140,142,144,146,148,
        150,152,154,156,158,160,0,19,1,0,22,25,1,0,1,1,2,0,39,39,41,45,1,
        0,13,14,2,0,1,1,3,3,3,0,9,10,39,44,46,46,2,0,52,52,54,64,1,0,72,
        73,2,0,48,49,69,70,2,0,52,52,71,71,1,0,74,75,1,0,48,51,1,0,96,102,
        2,0,72,73,89,89,2,0,76,76,87,87,1,0,105,109,3,0,110,110,115,116,
        119,119,2,0,7,7,118,118,2,0,110,116,119,119,753,0,172,1,0,0,0,2,
        174,1,0,0,0,4,183,1,0,0,0,6,196,1,0,0,0,8,198,1,0,0,0,10,208,1,0,
        0,0,12,218,1,0,0,0,14,236,1,0,0,0,16,239,1,0,0,0,18,243,1,0,0,0,
        20,257,1,0,0,0,22,259,1,0,0,0,24,261,1,0,0,0,26,263,1,0,0,0,28,272,
        1,0,0,0,30,282,1,0,0,0,32,284,1,0,0,0,34,299,1,0,0,0,36,301,1,0,
        0,0,38,311,1,0,0,0,40,313,1,0,0,0,42,315,1,0,0,0,44,317,1,0,0,0,
        46,319,1,0,0,0,48,328,1,0,0,0,50,333,1,0,0,0,52,339,1,0,0,0,54,394,
        1,0,0,0,56,396,1,0,0,0,58,404,1,0,0,0,60,408,1,0,0,0,62,412,1,0,
        0,0,64,420,1,0,0,0,66,429,1,0,0,0,68,432,1,0,0,0,70,439,1,0,0,0,
        72,444,1,0,0,0,74,446,1,0,0,0,76,448,1,0,0,0,78,452,1,0,0,0,80,455,
        1,0,0,0,82,457,1,0,0,0,84,471,1,0,0,0,86,473,1,0,0,0,88,481,1,0,
        0,0,90,497,1,0,0,0,92,499,1,0,0,0,94,501,1,0,0,0,96,505,1,0,0,0,
        98,511,1,0,0,0,100,517,1,0,0,0,102,520,1,0,0,0,104,527,1,0,0,0,106,
        531,1,0,0,0,108,535,1,0,0,0,110,541,1,0,0,0,112,543,1,0,0,0,114,
        545,1,0,0,0,116,556,1,0,0,0,118,558,1,0,0,0,120,567,1,0,0,0,122,
        586,1,0,0,0,124,597,1,0,0,0,126,599,1,0,0,0,128,609,1,0,0,0,130,
        612,1,0,0,0,132,622,1,0,0,0,134,627,1,0,0,0,136,635,1,0,0,0,138,
        640,1,0,0,0,140,651,1,0,0,0,142,653,1,0,0,0,144,666,1,0,0,0,146,
        668,1,0,0,0,148,680,1,0,0,0,150,682,1,0,0,0,152,689,1,0,0,0,154,
        699,1,0,0,0,156,703,1,0,0,0,158,705,1,0,0,0,160,713,1,0,0,0,162,
        163,3,2,1,0,163,164,3,28,14,0,164,165,5,0,0,1,165,173,1,0,0,0,166,
        167,3,4,2,0,167,168,5,0,0,1,168,173,1,0,0,0,169,170,3,28,14,0,170,
        171,5,0,0,1,171,173,1,0,0,0,172,162,1,0,0,0,172,166,1,0,0,0,172,
        169,1,0,0,0,173,1,1,0,0,0,174,178,5,29,0,0,175,177,3,6,3,0,176,175,
        1,0,0,0,177,180,1,0,0,0,178,176,1,0,0,0,178,179,1,0,0,0,179,181,
        1,0,0,0,180,178,1,0,0,0,181,182,5,30,0,0,182,3,1,0,0,0,183,187,5,
        29,0,0,184,186,3,6,3,0,185,184,1,0,0,0,186,189,1,0,0,0,187,185,1,
        0,0,0,187,188,1,0,0,0,188,5,1,0,0,0,189,187,1,0,0,0,190,197,3,8,
        4,0,191,197,3,10,5,0,192,197,3,12,6,0,193,197,3,14,7,0,194,197,3,
        24,12,0,195,197,3,26,13,0,196,190,1,0,0,0,196,191,1,0,0,0,196,192,
        1,0,0,0,196,193,1,0,0,0,196,194,1,0,0,0,196,195,1,0,0,0,197,7,1,
        0,0,0,198,200,5,32,0,0,199,201,5,7,0,0,200,199,1,0,0,0,200,201,1,
        0,0,0,201,202,1,0,0,0,202,204,3,54,27,0,203,205,5,7,0,0,204,203,
        1,0,0,0,204,205,1,0,0,0,205,206,1,0,0,0,206,207,5,1,0,0,207,9,1,
        0,0,0,208,210,5,32,0,0,209,211,5,7,0,0,210,209,1,0,0,0,210,211,1,
        0,0,0,211,212,1,0,0,0,212,214,3,60,30,0,213,215,5,7,0,0,214,213,
        1,0,0,0,214,215,1,0,0,0,215,216,1,0,0,0,216,217,5,1,0,0,217,11,1,
        0,0,0,218,222,5,32,0,0,219,221,3,20,10,0,220,219,1,0,0,0,221,224,
        1,0,0,0,222,220,1,0,0,0,222,223,1,0,0,0,223,225,1,0,0,0,224,222,
        1,0,0,0,225,226,5,1,0,0,226,13,1,0,0,0,227,237,5,34,0,0,228,230,
        5,33,0,0,229,231,3,16,8,0,230,229,1,0,0,0,230,231,1,0,0,0,231,233,
        1,0,0,0,232,234,3,18,9,0,233,232,1,0,0,0,233,234,1,0,0,0,234,235,
        1,0,0,0,235,237,5,1,0,0,236,227,1,0,0,0,236,228,1,0,0,0,237,15,1,
        0,0,0,238,240,7,0,0,0,239,238,1,0,0,0,240,241,1,0,0,0,241,239,1,
        0,0,0,241,242,1,0,0,0,242,17,1,0,0,0,243,247,5,26,0,0,244,246,3,
        20,10,0,245,244,1,0,0,0,246,249,1,0,0,0,247,245,1,0,0,0,247,248,
        1,0,0,0,248,19,1,0,0,0,249,247,1,0,0,0,250,258,3,54,27,0,251,258,
        3,58,29,0,252,258,3,60,30,0,253,258,3,62,31,0,254,258,3,64,32,0,
        255,258,3,22,11,0,256,258,8,1,0,0,257,250,1,0,0,0,257,251,1,0,0,
        0,257,252,1,0,0,0,257,253,1,0,0,0,257,254,1,0,0,0,257,255,1,0,0,
        0,257,256,1,0,0,0,258,21,1,0,0,0,259,260,7,2,0,0,260,23,1,0,0,0,
        261,262,5,31,0,0,262,25,1,0,0,0,263,265,5,35,0,0,264,266,5,36,0,
        0,265,264,1,0,0,0,265,266,1,0,0,0,266,267,1,0,0,0,267,268,5,1,0,
        0,268,27,1,0,0,0,269,271,3,30,15,0,270,269,1,0,0,0,271,274,1,0,0,
        0,272,270,1,0,0,0,272,273,1,0,0,0,273,29,1,0,0,0,274,272,1,0,0,0,
        275,283,3,32,16,0,276,283,3,36,18,0,277,283,3,38,19,0,278,283,3,
        40,20,0,279,283,3,42,21,0,280,283,3,44,22,0,281,283,3,46,23,0,282,
        275,1,0,0,0,282,276,1,0,0,0,282,277,1,0,0,0,282,278,1,0,0,0,282,
        279,1,0,0,0,282,280,1,0,0,0,282,281,1,0,0,0,283,31,1,0,0,0,284,288,
        5,11,0,0,285,287,3,34,17,0,286,285,1,0,0,0,287,290,1,0,0,0,288,286,
        1,0,0,0,288,289,1,0,0,0,289,291,1,0,0,0,290,288,1,0,0,0,291,292,
        5,1,0,0,292,33,1,0,0,0,293,300,3,54,27,0,294,300,3,58,29,0,295,300,
        3,60,30,0,296,300,3,62,31,0,297,300,3,64,32,0,298,300,8,1,0,0,299,
        293,1,0,0,0,299,294,1,0,0,0,299,295,1,0,0,0,299,296,1,0,0,0,299,
        297,1,0,0,0,299,298,1,0,0,0,300,35,1,0,0,0,301,305,5,12,0,0,302,
        304,7,3,0,0,303,302,1,0,0,0,304,307,1,0,0,0,305,303,1,0,0,0,305,
        306,1,0,0,0,306,309,1,0,0,0,307,305,1,0,0,0,308,310,5,15,0,0,309,
        308,1,0,0,0,309,310,1,0,0,0,310,37,1,0,0,0,311,312,5,16,0,0,312,
        39,1,0,0,0,313,314,5,17,0,0,314,41,1,0,0,0,315,316,5,18,0,0,316,
        43,1,0,0,0,317,318,5,19,0,0,318,45,1,0,0,0,319,321,5,20,0,0,320,
        322,5,21,0,0,321,320,1,0,0,0,321,322,1,0,0,0,322,323,1,0,0,0,323,
        324,5,1,0,0,324,47,1,0,0,0,325,327,3,20,10,0,326,325,1,0,0,0,327,
        330,1,0,0,0,328,326,1,0,0,0,328,329,1,0,0,0,329,331,1,0,0,0,330,
        328,1,0,0,0,331,332,5,0,0,1,332,49,1,0,0,0,333,334,3,8,4,0,334,335,
        5,0,0,1,335,51,1,0,0,0,336,338,3,34,17,0,337,336,1,0,0,0,338,341,
        1,0,0,0,339,337,1,0,0,0,339,340,1,0,0,0,340,342,1,0,0,0,341,339,
        1,0,0,0,342,343,5,0,0,1,343,53,1,0,0,0,344,345,5,2,0,0,345,346,3,
        56,28,0,346,350,5,4,0,0,347,349,3,72,36,0,348,347,1,0,0,0,349,352,
        1,0,0,0,350,348,1,0,0,0,350,351,1,0,0,0,351,353,1,0,0,0,352,350,
        1,0,0,0,353,354,5,3,0,0,354,395,1,0,0,0,355,356,5,2,0,0,356,357,
        3,56,28,0,357,361,5,4,0,0,358,360,3,66,33,0,359,358,1,0,0,0,360,
        363,1,0,0,0,361,359,1,0,0,0,361,362,1,0,0,0,362,364,1,0,0,0,363,
        361,1,0,0,0,364,365,5,3,0,0,365,395,1,0,0,0,366,367,5,2,0,0,367,
        368,3,56,28,0,368,372,5,4,0,0,369,371,3,66,33,0,370,369,1,0,0,0,
        371,374,1,0,0,0,372,370,1,0,0,0,372,373,1,0,0,0,373,395,1,0,0,0,
        374,372,1,0,0,0,375,379,5,37,0,0,376,378,5,27,0,0,377,376,1,0,0,
        0,378,381,1,0,0,0,379,377,1,0,0,0,379,380,1,0,0,0,380,392,1,0,0,
        0,381,379,1,0,0,0,382,386,5,28,0,0,383,385,3,66,33,0,384,383,1,0,
        0,0,385,388,1,0,0,0,386,384,1,0,0,0,386,387,1,0,0,0,387,390,1,0,
        0,0,388,386,1,0,0,0,389,391,5,3,0,0,390,389,1,0,0,0,390,391,1,0,
        0,0,391,393,1,0,0,0,392,382,1,0,0,0,392,393,1,0,0,0,393,395,1,0,
        0,0,394,344,1,0,0,0,394,355,1,0,0,0,394,366,1,0,0,0,394,375,1,0,
        0,0,395,55,1,0,0,0,396,401,3,74,37,0,397,398,5,5,0,0,398,400,3,74,
        37,0,399,397,1,0,0,0,400,403,1,0,0,0,401,399,1,0,0,0,401,402,1,0,
        0,0,402,57,1,0,0,0,403,401,1,0,0,0,404,405,5,2,0,0,405,406,5,40,
        0,0,406,407,5,3,0,0,407,59,1,0,0,0,408,409,5,2,0,0,409,410,3,68,
        34,0,410,411,5,3,0,0,411,61,1,0,0,0,412,414,5,2,0,0,413,415,3,72,
        36,0,414,413,1,0,0,0,415,416,1,0,0,0,416,414,1,0,0,0,416,417,1,0,
        0,0,417,418,1,0,0,0,418,419,5,3,0,0,419,63,1,0,0,0,420,424,5,2,0,
        0,421,423,3,66,33,0,422,421,1,0,0,0,423,426,1,0,0,0,424,422,1,0,
        0,0,424,425,1,0,0,0,425,427,1,0,0,0,426,424,1,0,0,0,427,428,5,3,
        0,0,428,65,1,0,0,0,429,430,8,4,0,0,430,67,1,0,0,0,431,433,3,70,35,
        0,432,431,1,0,0,0,433,434,1,0,0,0,434,432,1,0,0,0,434,435,1,0,0,
        0,435,69,1,0,0,0,436,440,3,74,37,0,437,440,5,47,0,0,438,440,5,5,
        0,0,439,436,1,0,0,0,439,437,1,0,0,0,439,438,1,0,0,0,440,71,1,0,0,
        0,441,445,3,74,37,0,442,445,5,5,0,0,443,445,5,4,0,0,444,441,1,0,
        0,0,444,442,1,0,0,0,444,443,1,0,0,0,445,73,1,0,0,0,446,447,7,5,0,
        0,447,75,1,0,0,0,448,449,5,2,0,0,449,450,3,78,39,0,450,451,5,4,0,
        0,451,77,1,0,0,0,452,453,7,6,0,0,453,79,1,0,0,0,454,456,5,94,0,0,
        455,454,1,0,0,0,455,456,1,0,0,0,456,81,1,0,0,0,457,458,5,2,0,0,458,
        459,3,84,42,0,459,460,5,3,0,0,460,461,5,0,0,1,461,83,1,0,0,0,462,
        472,3,86,43,0,463,472,3,88,44,0,464,472,3,94,47,0,465,472,3,96,48,
        0,466,472,3,98,49,0,467,472,3,104,52,0,468,472,3,106,53,0,469,472,
        3,108,54,0,470,472,3,112,56,0,471,462,1,0,0,0,471,463,1,0,0,0,471,
        464,1,0,0,0,471,465,1,0,0,0,471,466,1,0,0,0,471,467,1,0,0,0,471,
        468,1,0,0,0,471,469,1,0,0,0,471,470,1,0,0,0,472,85,1,0,0,0,473,474,
        5,54,0,0,474,479,5,4,0,0,475,480,5,65,0,0,476,480,5,66,0,0,477,478,
        5,90,0,0,478,480,3,80,40,0,479,475,1,0,0,0,479,476,1,0,0,0,479,477,
        1,0,0,0,480,87,1,0,0,0,481,482,5,55,0,0,482,495,5,4,0,0,483,484,
        5,91,0,0,484,496,3,80,40,0,485,496,3,92,46,0,486,487,5,68,0,0,487,
        488,5,4,0,0,488,496,3,92,46,0,489,496,3,90,45,0,490,491,5,68,0,0,
        491,492,5,4,0,0,492,496,3,90,45,0,493,494,5,92,0,0,494,496,5,95,
        0,0,495,483,1,0,0,0,495,485,1,0,0,0,495,486,1,0,0,0,495,489,1,0,
        0,0,495,490,1,0,0,0,495,493,1,0,0,0,496,89,1,0,0,0,497,498,7,7,0,
        0,498,91,1,0,0,0,499,500,7,8,0,0,500,93,1,0,0,0,501,502,5,56,0,0,
        502,503,5,4,0,0,503,504,7,9,0,0,504,95,1,0,0,0,505,506,5,57,0,0,
        506,507,5,4,0,0,507,508,3,100,50,0,508,509,5,4,0,0,509,510,5,9,0,
        0,510,97,1,0,0,0,511,512,5,58,0,0,512,513,5,4,0,0,513,514,3,100,
        50,0,514,515,5,4,0,0,515,516,3,102,51,0,516,99,1,0,0,0,517,518,7,
        10,0,0,518,101,1,0,0,0,519,521,5,5,0,0,520,519,1,0,0,0,520,521,1,
        0,0,0,521,522,1,0,0,0,522,525,5,9,0,0,523,524,5,6,0,0,524,526,5,
        9,0,0,525,523,1,0,0,0,525,526,1,0,0,0,526,103,1,0,0,0,527,528,5,
        59,0,0,528,529,5,4,0,0,529,530,5,76,0,0,530,105,1,0,0,0,531,532,
        5,60,0,0,532,533,5,4,0,0,533,534,5,77,0,0,534,107,1,0,0,0,535,536,
        5,52,0,0,536,537,5,4,0,0,537,538,5,53,0,0,538,539,5,4,0,0,539,540,
        3,110,55,0,540,109,1,0,0,0,541,542,7,11,0,0,542,111,1,0,0,0,543,
        544,5,64,0,0,544,113,1,0,0,0,545,546,5,2,0,0,546,547,3,116,58,0,
        547,548,5,3,0,0,548,549,5,0,0,1,549,115,1,0,0,0,550,557,3,118,59,
        0,551,557,3,120,60,0,552,557,3,122,61,0,553,557,3,126,63,0,554,557,
        3,130,65,0,555,557,3,132,66,0,556,550,1,0,0,0,556,551,1,0,0,0,556,
        552,1,0,0,0,556,553,1,0,0,0,556,554,1,0,0,0,556,555,1,0,0,0,557,
        117,1,0,0,0,558,559,5,54,0,0,559,565,5,4,0,0,560,566,5,65,0,0,561,
        566,5,66,0,0,562,566,5,67,0,0,563,564,5,90,0,0,564,566,3,80,40,0,
        565,560,1,0,0,0,565,561,1,0,0,0,565,562,1,0,0,0,565,563,1,0,0,0,
        566,119,1,0,0,0,567,568,5,61,0,0,568,584,5,4,0,0,569,585,5,78,0,
        0,570,585,5,79,0,0,571,585,5,80,0,0,572,573,5,81,0,0,573,574,5,4,
        0,0,574,585,5,9,0,0,575,576,5,82,0,0,576,577,5,4,0,0,577,585,5,9,
        0,0,578,579,5,83,0,0,579,580,5,4,0,0,580,585,5,84,0,0,581,582,5,
        83,0,0,582,583,5,4,0,0,583,585,5,85,0,0,584,569,1,0,0,0,584,570,
        1,0,0,0,584,571,1,0,0,0,584,572,1,0,0,0,584,575,1,0,0,0,584,578,
        1,0,0,0,584,581,1,0,0,0,585,121,1,0,0,0,586,587,5,62,0,0,587,588,
        5,4,0,0,588,592,5,93,0,0,589,591,3,124,62,0,590,589,1,0,0,0,591,
        594,1,0,0,0,592,590,1,0,0,0,592,593,1,0,0,0,593,595,1,0,0,0,594,
        592,1,0,0,0,595,596,5,103,0,0,596,123,1,0,0,0,597,598,7,12,0,0,598,
        125,1,0,0,0,599,600,5,63,0,0,600,601,5,4,0,0,601,607,5,86,0,0,602,
        603,5,4,0,0,603,604,3,100,50,0,604,605,5,4,0,0,605,606,3,128,64,
        0,606,608,1,0,0,0,607,602,1,0,0,0,607,608,1,0,0,0,608,127,1,0,0,
        0,609,610,4,64,0,0,610,611,5,9,0,0,611,129,1,0,0,0,612,613,5,59,
        0,0,613,618,5,4,0,0,614,615,5,88,0,0,615,616,5,4,0,0,616,617,7,13,
        0,0,617,619,5,4,0,0,618,614,1,0,0,0,618,619,1,0,0,0,619,620,1,0,
        0,0,620,621,7,14,0,0,621,131,1,0,0,0,622,623,5,64,0,0,623,133,1,
        0,0,0,624,626,3,136,68,0,625,624,1,0,0,0,626,629,1,0,0,0,627,625,
        1,0,0,0,627,628,1,0,0,0,628,630,1,0,0,0,629,627,1,0,0,0,630,631,
        5,0,0,1,631,135,1,0,0,0,632,634,3,138,69,0,633,632,1,0,0,0,634,637,
        1,0,0,0,635,633,1,0,0,0,635,636,1,0,0,0,636,638,1,0,0,0,637,635,
        1,0,0,0,638,639,5,1,0,0,639,137,1,0,0,0,640,641,7,15,0,0,641,139,
        1,0,0,0,642,644,5,7,0,0,643,642,1,0,0,0,643,644,1,0,0,0,644,645,
        1,0,0,0,645,646,3,142,71,0,646,647,5,0,0,1,647,652,1,0,0,0,648,649,
        3,160,80,0,649,650,5,0,0,1,650,652,1,0,0,0,651,643,1,0,0,0,651,648,
        1,0,0,0,652,141,1,0,0,0,653,659,5,110,0,0,654,656,5,7,0,0,655,657,
        3,144,72,0,656,655,1,0,0,0,656,657,1,0,0,0,657,658,1,0,0,0,658,660,
        3,152,76,0,659,654,1,0,0,0,659,660,1,0,0,0,660,143,1,0,0,0,661,667,
        3,148,74,0,662,667,3,150,75,0,663,664,3,154,77,0,664,665,3,146,73,
        0,665,667,1,0,0,0,666,661,1,0,0,0,666,662,1,0,0,0,666,663,1,0,0,
        0,667,145,1,0,0,0,668,669,3,156,78,0,669,147,1,0,0,0,670,681,5,111,
        0,0,671,681,5,112,0,0,672,681,5,113,0,0,673,681,5,114,0,0,674,675,
        5,115,0,0,675,676,5,7,0,0,676,681,5,111,0,0,677,678,5,116,0,0,678,
        679,5,7,0,0,679,681,5,111,0,0,680,670,1,0,0,0,680,671,1,0,0,0,680,
        672,1,0,0,0,680,673,1,0,0,0,680,674,1,0,0,0,680,677,1,0,0,0,681,
        149,1,0,0,0,682,683,7,16,0,0,683,151,1,0,0,0,684,685,3,154,77,0,
        685,686,3,156,78,0,686,688,1,0,0,0,687,684,1,0,0,0,688,691,1,0,0,
        0,689,687,1,0,0,0,689,690,1,0,0,0,690,693,1,0,0,0,691,689,1,0,0,
        0,692,694,3,154,77,0,693,692,1,0,0,0,693,694,1,0,0,0,694,696,1,0,
        0,0,695,697,3,158,79,0,696,695,1,0,0,0,696,697,1,0,0,0,697,153,1,
        0,0,0,698,700,7,17,0,0,699,698,1,0,0,0,700,701,1,0,0,0,701,699,1,
        0,0,0,701,702,1,0,0,0,702,155,1,0,0,0,703,704,7,18,0,0,704,157,1,
        0,0,0,705,706,5,117,0,0,706,159,1,0,0,0,707,712,5,7,0,0,708,712,
        5,118,0,0,709,712,5,117,0,0,710,712,3,156,78,0,711,707,1,0,0,0,711,
        708,1,0,0,0,711,709,1,0,0,0,711,710,1,0,0,0,712,715,1,0,0,0,713,
        711,1,0,0,0,713,714,1,0,0,0,714,161,1,0,0,0,715,713,1,0,0,0,65,172,
        178,187,196,200,204,210,214,222,230,233,236,241,247,257,265,272,
        282,288,299,305,309,321,328,339,350,361,372,379,386,390,392,394,
        401,416,424,434,439,444,455,471,479,495,520,525,556,565,584,592,
        607,618,627,635,643,651,656,659,666,680,689,693,696,701,711,713
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
