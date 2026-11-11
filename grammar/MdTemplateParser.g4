/*
 * MdTemplateParser.g4 - parser of md-template-lint templates and targets.
 *
 * Tokens come from MdTemplateLexer.g4, whose modes split the document into
 * regions. Rule families:
 *
 *   document  root: optional frontmatter, then the body
 *   fm*       frontmatter region: key lines and their inline comment, whole-
 *             line comments (including the filename comment), stage-2
 *             frontmatter tags
 *   body*     body region: headings and their suffix, fenced code, other
 *             lines, stage-2 body tags
 *   tag*      bracket shapes of the comment and heading text, shared by both
 *             regions (no meaning of their own)
 *   directive* target disable directives (spec 4.4): a line scan for comment
 *             markers and code spans, then the content of one comment
 *
 * Tags are parsed in two stages. Stage 1 (document and the *Entry helpers)
 * never fails on a tag: it only splits comment and heading text into
 * brackets, type hints and plain tokens. A bracket `[word:...` is re-lexed in
 * mode TAG_STRICT and parsed with tagFamilyEntry, then fmTagEntry or
 * bodyTagEntry. A syntax error there is a MALFORMED tag (reason "malformed")
 * located at the offending token; a bracket that only the other region
 * accepts is a MISPLACED tag (reason "wrong-region"). The parser layer
 * reports reasons only; codes and messages belong to src/rules/ (A9).
 *
 * Adding a tag: see the touch list in MdTemplateLexer.g4. In this file, add
 * the fm* or body* tag rule and its alternative in fmTagBody or bodyTagBody,
 * and the family in tagFamily when it is a new family.
 */
parser grammar MdTemplateParser;

options {
    tokenVocab = MdTemplateLexer;
}

// The only embedded code of this grammar: one predicate, for the count of
// `[repeat-rules:same-level:min:N]` (N is 1 or more, spec 2.10).
@members {
    /** True when the next token does not start with `0`. */
    private startsWithNonZero(): boolean {
        return (this.tokenStream.LT(1)?.text ?? "0").charAt(0) !== "0";
    }
}

// ===========================================================================
// Document
// ===========================================================================

document
    : frontmatter body EOF
    | fmUnclosed EOF
    | body EOF
    ;

// ===========================================================================
// Frontmatter region (fm*)
// ===========================================================================

frontmatter
    : FM_OPEN fmLine* FM_CLOSE
    ;

// `---` on the first line but no closing delimiter: no frontmatter (MTL001).
fmUnclosed
    : FM_OPEN fmLine*
    ;

fmLine
    : fmFilenameLine
    | fmUniqueNamesLine
    | fmCommentLine
    | fmKeyLine
    | fmBlankLine
    | fmOtherLine
    ;

// spec 2.5: `^\s*#\s*[filename:case:<convention>]\s*$`, template-wide.
fmFilenameLine
    : FM_LINE_HASH WS? tagCandidate WS? NL
    ;

// spec 2.11: `# [unique-headings-names]` alone on a line, template-wide. The tag has no colon, so
// stage 1 sees a bare bracket: every `# [word]` line parses here and the orchestrator
// (src/tags/parser.ts) keeps the comment line when stage 2 does not know the name. Listed before
// fmCommentLine, which would also accept the line.
fmUniqueNamesLine
    : FM_LINE_HASH WS? tagBareBracket WS? NL
    ;

// Whole-line comment: binds to no key (spec 2.1).
fmCommentLine
    : FM_LINE_HASH fmCommentItem* NL
    ;

// Top-level key line (spec 2.1): only the comment on the key's own line binds.
fmKeyLine
    : FM_KEY_BARE
    | FM_KEY fmValue? fmInlineComment? NL
    ;

// Delimited by the lexer modes; never interpreted (the `yaml` package does that).
fmValue
    : (FM_QUOTED | FM_PLAIN_TEXT | FM_FLOW_OPEN | FM_FLOW_CLOSE)+
    ;

fmInlineComment
    : FM_COMMENT_HASH fmCommentItem*
    ;

fmCommentItem
    : tagCandidate
    | tagRuleMarker
    | tagBareBracket
    | tagShapedBracket
    | tagProseBracket
    | fmHintWord
    | ~NL
    ;

// Whole-word type hints in free text (spec 2.4).
fmHintWord
    : DATE_PLACEHOLDER
    | ISO
    | URL
    | LIEN
    | PATH
    | ALIAS_MARK
    ;

fmBlankLine
    : FM_BLANK
    ;

fmOtherLine
    : FM_LINE_START FM_TEXT_REST? NL
    ;

// ===========================================================================
// Body region (body*)
// ===========================================================================

body
    : bodyBlock*
    ;

bodyBlock
    : bodyHeading
    | bodyFence
    | bodyTableRow
    | bodyListItem
    | bodyHtmlComment
    | bodyBlankLine
    | bodyTextLine
    ;

// ATX heading 1 to 6. Every level carries tags (spec 2.6, ADR 0009).
bodyHeading
    : H_OPEN bodyHeadingItem* NL
    ;

bodyHeadingItem
    : tagCandidate
    | tagRuleMarker
    | tagBareBracket
    | tagShapedBracket
    | tagProseBracket
    | ~NL
    ;

// Fenced code: no heading and no tag inside. Unclosed: runs to the end.
bodyFence
    : FENCE_OPEN (FENCE_NL | FENCE_LINE)* FENCE_CLOSE?
    ;

bodyTableRow
    : BODY_TABLE_ROW
    ;

bodyListItem
    : BODY_LIST_ITEM
    ;

bodyHtmlComment
    : BODY_HTML_COMMENT
    ;

bodyBlankLine
    : BODY_BLANK
    ;

bodyTextLine
    : BODY_TEXT_START BODY_TEXT_REST? NL
    ;

// ===========================================================================
// Region helper entry rules (one comment, one heading text, one fm line)
// ===========================================================================

fmInlineCommentEntry
    : fmCommentItem* EOF
    ;

fmFilenameLineEntry
    : fmFilenameLine EOF
    ;

bodyHeadingTextEntry
    : bodyHeadingItem* EOF
    ;

// ===========================================================================
// Shared bracket shapes (tag*), stage 1
// ===========================================================================

// `[word:` ... : a tag attempt; stage 2 decides whether the family is known.
tagCandidate
    : LBRACK tagName COLON tagShapePiece* RBRACK    # tagShapedCandidate
    | LBRACK tagName COLON tagBracketItem* RBRACK   # tagClosedCandidate
    | LBRACK tagName COLON tagBracketItem*          # tagUnclosedCandidate
    | PATTERN_OPEN QUOTED* (QUOTED_END tagBracketItem* RBRACK?)?  # tagPatternCandidate
    ;

// A tag word, or dashed words (`repeat-rules`).
tagName
    : tagWord (DASH tagWord)*
    ;

// Legacy inert marker `[rule]` (spec 2.7).
tagRuleMarker
    : LBRACK RULE RBRACK
    ;

// Single-token bracket `[<word>]` (spec 2.4), legacy `\[[\w-]+\]`.
tagBareBracket
    : LBRACK tagHintName RBRACK
    ;

// `[A-Za-z0-9_:-]+` not starting with `word:`: unknown tag candidate.
tagShapedBracket
    : LBRACK tagShapePiece+ RBRACK
    ;

tagProseBracket
    : LBRACK tagBracketItem* RBRACK
    ;

tagBracketItem
    : ~(RBRACK | NL)
    ;

tagHintName
    : tagHintPiece+
    ;

tagHintPiece
    : tagWord
    | UWORD
    | DASH
    ;

tagShapePiece
    : tagWord
    | DASH
    | COLON
    ;

// ASCII word tokens of TAG_TEXT: generic words plus the spec 2.4 hint words.
// Hand-kept, but it changes only with the type-hint vocabulary, never with tags.
tagWord
    : ALNUM
    | NUMBER
    | WORD
    | RULE
    | ISO
    | URL
    | LIEN
    | PATH
    | DATE_PLACEHOLDER
    ;

// ===========================================================================
// Stage 2 (TAG_STRICT tokens)
// ===========================================================================

// Prefix probe: is `[word:` a known family?
tagFamilyEntry
    : LBRACK tagFamily COLON
    ;

tagFamily
    : PRESENCE
    | FORMAT
    | VALUE
    | COUNT
    | RANGE
    | ORDER
    | IO
    | CONTENT
    | FILENAME_CS
    | PATTERN
    | REPEAT_RULES
    | UNIQUE_HEADINGS_NAMES
    ;

tagFreeText
    : FREE_TEXT?
    ;

// --- frontmatter tags (fm*), spec 2.2, 2.3, 2.5 ---

fmTagEntry
    : LBRACK fmTagBody RBRACK EOF
    ;

fmTagBody
    : fmPresenceTag
    | fmFormatTag
    | fmValueTag
    | fmCountTag
    | fmRangeTag
    | fmOrderTag
    | fmIoTag
    | fmFilenameTag
    | fmUniqueNamesTag
    ;

fmPresenceTag
    : PRESENCE COLON (REQUIRED | OPTIONAL | CONDITIONAL_ARG tagFreeText)
    ;

fmFormatTag
    : FORMAT COLON
      ( CONSTANT_ARG tagFreeText
      | fmCaseStyle
      | ELEMENTS COLON fmCaseStyle
      | fmShape
      | ELEMENTS COLON fmShape
      | SCHEME_ARG SCHEME_TEXT
      )
    ;

fmShape
    : SEMVER
    | DATE
    ;

fmCaseStyle
    : SNAKE_CASE_CS
    | SNAKE_CASE
    | KEBAB_CASE_CS
    | KEBAB_CASE
    ;

fmValueTag
    : VALUE COLON (FILENAME_CS | FILENAME)
    ;

fmCountTag
    : COUNT COLON fmBound COLON NUMBER
    ;

fmRangeTag
    : RANGE COLON fmBound COLON fmSignedNumber
    ;

fmBound
    : MIN
    | MAX
    ;

// `-?\d+(\.\d+)?`
fmSignedNumber
    : DASH? NUMBER (DOT NUMBER)?
    ;

fmOrderTag
    : ORDER COLON ASCENDING
    ;

// spec 2.8
fmIoTag
    : IO COLON EXISTS
    ;

// spec 2.5, case-sensitive. Only a standalone comment line gives it effect.
fmFilenameTag
    : FILENAME_CS COLON CASE_CS COLON fmConvention
    ;

fmConvention
    : SNAKE_CASE_CS
    | KEBAB_CASE_CS
    | CAMEL_CASE
    | PASCAL_CASE
    ;

// spec 2.11, no colon and no argument. Effective only on a standalone comment line; after a key
// it is accepted here so that it stays inert (and `[unique-headings-names:x]` stays malformed).
fmUniqueNamesTag
    : UNIQUE_HEADINGS_NAMES
    ;

// --- body tags (body*), spec 2.6 ---

bodyTagEntry
    : LBRACK bodyTagBody RBRACK EOF
    ;

bodyTagBody
    : bodyPresenceTag
    | bodyContentTag
    | bodyPatternTag
    | bodyRepeatTag
    | bodyOrderTag
    | bodyUniqueNamesTag
    ;

bodyPresenceTag
    : PRESENCE COLON (REQUIRED | OPTIONAL | TEMPLATE_ONLY | CONDITIONAL_ARG tagFreeText)
    ;

bodyContentTag
    : CONTENT COLON
      ( NON_EMPTY
      | TABLE
      | LIST
      | MIN_LINES COLON NUMBER
      | MAX_LINES COLON NUMBER
      | SUBHEADINGS COLON DISALLOW
      | SUBHEADINGS COLON NO_EXTRA
      )
    ;

// spec 2.10. The quoted text is lexed in mode TAG_PATTERN; its pieces (literal
// runs, placeholders, invalid pieces) are built and checked by
// src/tags/visitors/pattern.ts, not here.
bodyPatternTag
    : PATTERN COLON PATTERN_QUOTE patternPiece* PAT_END
    ;

patternPiece
    : PAT_TEXT
    | PAT_ESCAPE
    | PAT_LBRACE2
    | PAT_RBRACE2
    | PAT_PLACEHOLDER
    | PAT_LBRACE
    | PAT_RBRACE
    ;

// spec 2.10. N is 1 or more without a leading zero: a count starting with `0`
// fails the predicate and is a malformed tag at that token.
bodyRepeatTag
    : REPEAT_RULES COLON SAME_LEVEL (COLON fmBound COLON repeatCount)?
    ;

repeatCount
    : {this.startsWithNonZero()}? NUMBER
    ;

// spec 2.10: `[order:ascending]` and `[order:descending]` order by the whole
// text, `[order:first:<number|date|semver>:<direction>]` by the first match.
bodyOrderTag
    : ORDER COLON (FIRST COLON (NUMBER_WORD | DATE | SEMVER) COLON)? (ASCENDING | DESCENDING)
    ;

// spec 2.11: `[unique-headings-names]`, no colon and no argument.
bodyUniqueNamesTag
    : UNIQUE_HEADINGS_NAMES
    ;

// ===========================================================================
// Disable directives of a target (directive*), spec 4.4 DIR2 to DIR4
// ===========================================================================

// Mode DIRECTIVE_SCAN over the whole document: one directiveScanLine per line.
// Never fails; the pairing of markers and backtick runs is done on its tokens.
directiveScanEntry
    : directiveScanLine* EOF
    ;

directiveScanLine
    : directiveScanItem* NL
    ;

directiveScanItem
    : SCAN_OPEN
    | SCAN_CLOSE
    | SCAN_TICKS
    | SCAN_TEXT
    | SCAN_CHAR
    ;

// Mode DIRECTIVE over the content of one comment. Never fails: content that
// does not start with the keyword followed by a space, a tab or the end is
// prose (second alternative, no directive). On a tie the first alternative wins.
directiveEntry
    : WS? directive EOF
    | directiveProse EOF
    ;

// DIR2: keyword WS+ verb (SEP item)* (SEP reason)? SEP?. A missing or unknown
// verb still parses (MTL020 in src/rules/syntax.ts, A60); items are validated
// as codes afterwards, never here.
directive
    : DIR_KEYWORD (WS directiveHead? directiveArgs)?
    ;

// A head after a comma (`md-template-lint ,MTL201`) is never a verb (DIR2 wants
// WS+ before it); its first word is still the MTL020 word.
directiveHead
    : directiveVerb
    | directiveUnknown
    | directiveSep directiveMisplaced
    ;

directiveMisplaced
    : directiveItem
    ;

// The six verbs. `begin` or `end` not followed by `disable` is directiveUnknown.
directiveVerb
    : DIR_DISABLE
    | DIR_DISABLE_LINE
    | DIR_DISABLE_NEXT_LINE
    | DIR_DISABLE_FILE
    | DIR_BEGIN WS DIR_DISABLE
    | DIR_END WS DIR_DISABLE
    ;

directiveUnknown
    : DIR_WORD
    | DIR_KEYWORD
    | DIR_BEGIN
    | DIR_END
    ;

directiveArgs
    : (directiveSep directiveItem)* directiveSep? directiveReason?
    ;

// Commas, spaces and tabs in any mix; empty items vanish.
directiveSep
    : (WS | DIR_COMMA)+
    ;

directiveItem
    : DIR_WORD
    | DIR_KEYWORD
    | DIR_DISABLE
    | DIR_DISABLE_LINE
    | DIR_DISABLE_NEXT_LINE
    | DIR_DISABLE_FILE
    | DIR_BEGIN
    | DIR_END
    ;

directiveReason
    : DIR_REASON
    ;

directiveProse
    : (WS | DIR_COMMA | DIR_REASON | directiveItem)*
    ;
