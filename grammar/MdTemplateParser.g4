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
    | fmCommentLine
    | fmKeyLine
    | fmBlankLine
    | fmOtherLine
    ;

// spec 2.5: `^\s*#\s*[filename:case:<convention>]\s*$`, template-wide.
fmFilenameLine
    : FM_LINE_HASH WS? tagCandidate WS? NL
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
    | tagTypeEq
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

// ATX heading 1 to 6. Only levels 1 and 2 carry tags (spec 2.6).
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
    : LBRACK tagWord COLON tagShapePiece* RBRACK    # tagShapedCandidate
    | LBRACK tagWord COLON tagBracketItem* RBRACK   # tagClosedCandidate
    | LBRACK tagWord COLON tagBracketItem*          # tagUnclosedCandidate
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
    : tagTypeEq
    | ~(RBRACK | NL)
    ;

// `type=<name>` (spec 2.4), legacy `\btype\s*=\s*([\w-]+)`.
tagTypeEq
    : TYPE WS? EQ WS? tagHintName
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
    | TYPE
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
    ;

fmPresenceTag
    : PRESENCE COLON (REQUIRED | OPTIONAL | CONDITIONAL_ARG tagFreeText)
    ;

fmFormatTag
    : FORMAT COLON
      ( CONSTANT_ARG tagFreeText
      | fmCaseStyle
      | ELEMENTS COLON fmCaseStyle
      | SCHEME_ARG SCHEME_TEXT
      )
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

// --- body tags (body*), spec 2.6 ---

bodyTagEntry
    : LBRACK bodyTagBody RBRACK EOF
    ;

bodyTagBody
    : bodyPresenceTag
    | bodyContentTag
    ;

bodyPresenceTag
    : PRESENCE COLON (REQUIRED | OPTIONAL | EXIST | TEMPLATE_ONLY | CONDITIONAL_ARG tagFreeText)
    ;

bodyContentTag
    : CONTENT COLON
      ( NON_EMPTY
      | TABLE
      | LIST
      | MIN_LINES COLON NUMBER
      | MAX_LINES COLON NUMBER
      )
    ;
