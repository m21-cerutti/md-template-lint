/*
 * MdTemplateLexer.g4 - lexer of md-template-lint templates and targets.
 *
 * Normative for docs/spec.md section 2, together with MdTemplateParser.g4.
 * No tag regex lives outside grammar/*.g4 (AGENTS.md). `pnpm run gen:parser`
 * (scripts/gen-parser.ts, antlr-ng, no Java) writes the TypeScript lexer and
 * parser to src/generated/. Never hand-edit that output.
 *
 * Lexer modes (the region separation of the Markdown document):
 *
 *   DEFAULT_MODE    start of the document: `---` opens the frontmatter, any
 *                   other first line is a body line (body rules mirrored here)
 *   FM              frontmatter, at the start of a line
 *   FM_VALUE        frontmatter value start, after `key: ` (quotes, flow, `#`)
 *   FM_PLAIN        rest of a frontmatter value (`<space>#` starts the comment)
 *   FM_FLOW         inside a flow collection `[...]` / `{...}` (nested by push)
 *   FM_TEXT         rest of a frontmatter line that is not a key line
 *   BODY            body, at the start of a line
 *   BODY_TEXT       rest of a plain body line
 *   FENCE_BACKTICK  inside a ``` fence (no heading, no tag)
 *   FENCE_TILDE     inside a ~~~ fence (no heading, no tag)
 *   TAG_TEXT        text of an inline comment or of a heading (stage 1)
 *   TAG_STRICT      one known-family bracket, re-lexed strictly (stage 2)
 *   TAG_QUOTED      stage 1, inside the quotes of `[pattern:"..."` (a `]` or an
 *                   escaped quote does not end the bracket)
 *   TAG_FREE        free text argument (`constant:`, `conditional:`)
 *   TAG_SCHEME      scheme list argument (`scheme:`)
 *   TAG_PATTERN     stage 2, the text of a heading pattern after `pattern:"`
 *   DIRECTIVE_SCAN  one target line: comment markers, backtick runs (spec 4.4)
 *   DIRECTIVE       content of one comment: disable directive words (spec 4.4)
 *
 * The only embedded code is the fence length: a closing fence must use the
 * same character (separate modes) and be AT LEAST AS LONG as the opening one
 * (legacy `_closes_fence`). Lengths are unbounded, so one counter (set by an
 * action on the opening line) and one predicate on the closing line remain.
 *
 * Input contract: line ends are normalized to LF and the text ends with LF
 * (src/tags/parser.ts, spec 1.1), so every line rule can require `\n`.
 *
 * Adding a tag (touch list, see also MdTemplateParser.g4):
 *   1. here: its keyword token(s) in mode TAG_STRICT only (tag keywords never
 *      appear in stage 1, so there is no keyword-as-word list to update);
 *   2. MdTemplateParser.g4: the fm* or body* tag rule and its alternative in
 *      fmTagBody / bodyTagBody, plus tagFamily when it is a new family;
 *   3. src/tags/ast.ts: the member of the FrontmatterTag or BodyTag union;
 *   4. src/tags/visitors/<family>.ts: its visitor (and the family registry
 *      list in src/tags/visitors/index.ts when it is a new family);
 *   5. src/rules/<category>.ts (phase A9): the rule that consumes it.
 * Then run `pnpm run gen:parser` and commit src/generated/.
 */
lexer grammar MdTemplateLexer;

options {
    caseInsensitive = true;
}

tokens {
    NL, LBRACK, RBRACK, COLON, DASH, DOT, WS, OTHER, NUMBER, ALNUM,
    H_OPEN, FENCE_OPEN, FENCE_NL, FENCE_LINE, FENCE_CLOSE,
    BODY_TABLE_ROW, BODY_LIST_ITEM, BODY_HTML_COMMENT, BODY_BLANK,
    BODY_TEXT_START, BODY_TEXT_REST,
    FM_QUOTED, FM_PLAIN_TEXT, FM_FLOW_OPEN, FM_FLOW_CLOSE, FM_COMMENT_HASH,
    QUOTED, QUOTED_END
}

@members {
    /** Marker length of the open fence (number of backticks or tildes). */
    private fenceLength = 0;

    /** Length of the backtick or tilde run that starts after the indentation. */
    private static markerLength(text: string): number {
        let index = 0;
        while (text.charAt(index) === " " || text.charAt(index) === "\t") {
            index += 1;
        }
        const marker = text.charAt(index);
        let length = 0;
        while (text.charAt(index + length) === marker) {
            length += 1;
        }
        return length;
    }

    private openFence(): void {
        this.fenceLength = MdTemplateLexer.markerLength(this.text);
    }

    private closesFence(): boolean {
        return MdTemplateLexer.markerLength(this.text) >= this.fenceLength;
    }
}

// ===========================================================================
// Fragments shared by several modes
// ===========================================================================

fragment F_INDENT   : ([ \t] ([ \t] [ \t]?)?)? ;      // legacy `\s{0,3}`
fragment F_HEADING  : '#' '#'? '#'? '#'? '#'? '#'? [ \t]+ ;
fragment F_FENCE_BT : F_INDENT '```' '`'* ~'\n'* ;
fragment F_FENCE_TL : F_INDENT '~~~' '~'* ~'\n'* ;
fragment F_TABLE    : [ \t]* '|' ~'\n'* '|' [ \t]* '\n' ;
fragment F_LIST     : [ \t]* ([-*+] | [0-9]+ [.)]) [ \t]+ ~'\n'* '\n' ;
fragment F_HTML     : [ \t]* '<!--' ~'\n'* '-->' [ \t]* '\n' ;
fragment F_BLANK    : [ \t]* '\n' ;
fragment F_DQ       : '"' (~["\\\n] | '\\' ~'\n')* '"' ;
fragment F_SQ       : '\'' (~['\n] | '\'\'')* '\'' ;
fragment F_KEY      : F_DQ | F_SQ | ~[ \t\n#\-"'[{:] (~[:\n] | ':' ~[ \t\n:])* ;
fragment F_WORD_CHAR : [\p{L}\p{N}_] ;

// ===========================================================================
// DEFAULT_MODE: start of the document
// ===========================================================================

// Legacy `\A---[ \t]*\n`: only the first line can open the frontmatter.
FM_OPEN : '---' [ \t]* '\n' -> mode(FM) ;

// Any other first line: the body line-start rules of mode BODY.
DS_HEADING : F_HEADING -> type(H_OPEN), mode(BODY), pushMode(TAG_TEXT) ;
DS_FENCE_BT : F_FENCE_BT { this.openFence(); } -> type(FENCE_OPEN), mode(FENCE_BACKTICK) ;
DS_FENCE_TL : F_FENCE_TL { this.openFence(); } -> type(FENCE_OPEN), mode(FENCE_TILDE) ;
DS_TABLE : F_TABLE -> type(BODY_TABLE_ROW), mode(BODY) ;
DS_LIST : F_LIST -> type(BODY_LIST_ITEM), mode(BODY) ;
DS_HTML : F_HTML -> type(BODY_HTML_COMMENT), mode(BODY) ;
DS_BLANK : F_BLANK -> type(BODY_BLANK), mode(BODY) ;
DS_CHAR : ~'\n' -> type(BODY_TEXT_START), mode(BODY_TEXT) ;

// ===========================================================================
// Frontmatter region
// ===========================================================================

mode FM;

// Legacy `^---[ \t]*(\n|\Z)`: the first delimiter line closes the block.
FM_CLOSE : '---' [ \t]* '\n' -> mode(BODY) ;
FM_BLANK : F_BLANK ;
// Whole-line comment (binds to no key) or the filename comment (spec 2.5).
FM_LINE_HASH : [ \t]* '#' -> pushMode(TAG_TEXT) ;
// Top-level key line `key: ...` (spec 2.1). Key without value: whole line.
FM_KEY : F_KEY [ \t]* ':' [ \t]+ -> mode(FM_VALUE) ;
FM_KEY_BARE : F_KEY [ \t]* ':' [ \t]* '\n' ;
// Indented lines, list items, continuation lines: no key, no binding.
FM_LINE_START : ~'\n' -> mode(FM_TEXT) ;

mode FM_TEXT;

FM_TEXT_REST : ~'\n'+ ;
FT_NL : '\n' -> type(NL), mode(FM) ;

mode FM_VALUE;

FV_QUOTED : (F_DQ | F_SQ) -> type(FM_QUOTED), mode(FM_PLAIN) ;
FV_FLOW_OPEN : [[{] -> type(FM_FLOW_OPEN), mode(FM_PLAIN), pushMode(FM_FLOW) ;
FV_COMMENT : '#' -> type(FM_COMMENT_HASH), mode(FM), pushMode(TAG_TEXT) ;
FV_NL : '\n' -> type(NL), mode(FM) ;
FV_CHAR : ~'\n' -> type(FM_PLAIN_TEXT), mode(FM_PLAIN) ;

mode FM_PLAIN;

// `#` starts a comment only after a space or tab (spec 2.1).
FP_COMMENT : [ \t]+ '#' -> type(FM_COMMENT_HASH), mode(FM), pushMode(TAG_TEXT) ;
FP_WS : [ \t]+ -> type(FM_PLAIN_TEXT) ;
FP_TEXT : ~[ \t\n]+ -> type(FM_PLAIN_TEXT) ;
FP_NL : '\n' -> type(NL), mode(FM) ;

mode FM_FLOW;

FF_QUOTED : (F_DQ | F_SQ) -> type(FM_QUOTED) ;
FF_OPEN : [[{] -> type(FM_FLOW_OPEN), pushMode(FM_FLOW) ;
FF_CLOSE : [\]}] -> type(FM_FLOW_CLOSE), popMode ;
FF_TEXT : ~[[\]{}"'\n]+ -> type(FM_PLAIN_TEXT) ;
FF_QUOTE : ["'] -> type(FM_PLAIN_TEXT) ;
// A flow value never spans lines here: the next line starts a new line.
FF_NL : '\n' -> type(NL), mode(FM) ;

// ===========================================================================
// Body region
// ===========================================================================

mode BODY;

// ATX heading, levels 1 to 6; its text is lexed in TAG_TEXT.
B_HEADING : F_HEADING -> type(H_OPEN), pushMode(TAG_TEXT) ;
B_FENCE_BT : F_FENCE_BT { this.openFence(); } -> type(FENCE_OPEN), mode(FENCE_BACKTICK) ;
B_FENCE_TL : F_FENCE_TL { this.openFence(); } -> type(FENCE_OPEN), mode(FENCE_TILDE) ;
B_TABLE : F_TABLE -> type(BODY_TABLE_ROW) ;
B_LIST : F_LIST -> type(BODY_LIST_ITEM) ;
// One-line HTML comment. Multi-line comments are plain lines, so headings
// inside them still count (kept legacy limitation, spec 2.6).
B_HTML : F_HTML -> type(BODY_HTML_COMMENT) ;
B_BLANK : F_BLANK -> type(BODY_BLANK) ;
B_CHAR : ~'\n' -> type(BODY_TEXT_START), mode(BODY_TEXT) ;

mode BODY_TEXT;

BT_REST : ~'\n'+ -> type(BODY_TEXT_REST) ;
BT_NL : '\n' -> type(NL), mode(BODY) ;

mode FENCE_BACKTICK;

FB_CLOSE : F_INDENT '```' '`'* [ \t]* '\n' { this.closesFence() }? -> type(FENCE_CLOSE), mode(BODY) ;
FB_NL : '\n' -> type(FENCE_NL) ;
FB_LINE : ~'\n'+ -> type(FENCE_LINE) ;

mode FENCE_TILDE;

FT_CLOSE : F_INDENT '~~~' '~'* [ \t]* '\n' { this.closesFence() }? -> type(FENCE_CLOSE), mode(BODY) ;
FTL_NL : '\n' -> type(FENCE_NL) ;
FTL_LINE : ~'\n'+ -> type(FENCE_LINE) ;

// ===========================================================================
// Stage 1: comment and heading text. No tag keyword here, only the type-hint
// words of spec 2.4 and generic word tokens.
// ===========================================================================

mode TAG_TEXT;

T_NL : '\n' -> type(NL), popMode ;
// `[pattern:"` opens a quoted argument (spec 2.10): the longer match wins over
// T_LBRACK, and the quoted text is lexed in TAG_QUOTED so that a `]` or an
// escaped `\"` inside the quotes does not end the bracket.
PATTERN_OPEN : '[' 'pattern' ':' '"' -> pushMode(TAG_QUOTED) ;
T_LBRACK : '[' -> type(LBRACK) ;
T_RBRACK : ']' -> type(RBRACK) ;
T_COLON : ':' -> type(COLON) ;
T_DASH : '-' -> type(DASH) ;
// Trailing heading comment (legacy `<!--.*-->`, greedy to the last `-->`).
HTML_COMMENT : '<!--' ~'\n'* '-->' ;

// `YYYY-MM-DD` as a case-sensitive substring, like legacy `"YYYY-MM-DD" in comment`.
DATE_PLACEHOLDER options { caseInsensitive = false; } : F_WORD_CHAR* 'YYYY-MM-DD' F_WORD_CHAR* ;
RULE : 'rule' ;
ISO  : 'iso' ;
URL  : 'url' ;
LIEN : 'lien' ;
PATH : 'path' ;
// Alias marker `@<name>/` (legacy `@[\w-]+/`).
ALIAS_MARK : '@' [\p{L}\p{N}_-]+ '/' ;

T_NUMBER : [0-9]+ -> type(NUMBER) ;
T_ALNUM : [a-z0-9]+ -> type(ALNUM) ;
// A word with an underscore is WORD, one with a non-ASCII letter or digit is UWORD.
WORD : [a-z0-9_]* '_' [a-z0-9_]* ;
UWORD : F_WORD_CHAR+ ;
T_WS : [ \t\f\u000B]+ -> type(WS) ;
T_OTHER : . -> type(OTHER) ;

// Stage 1, quoted argument of `[pattern:"`: runs to the first unescaped `"`.
// A backslash pairs with the next character, so `\"` never closes the quote.
// An unclosed quote ends at the line end (the bracket is then malformed in
// stage 2); the line end pops both this mode and TAG_TEXT, as T_NL does.
mode TAG_QUOTED;

Q_TEXT : (~["\\\n] | '\\' ~'\n')+ -> type(QUOTED) ;
Q_STRAY : '\\' -> type(QUOTED) ;
Q_CLOSE : '"' -> type(QUOTED_END), popMode ;
Q_NL : '\n' -> type(NL), popMode, popMode ;

// ===========================================================================
// Stage 2: one bracket of a known family, lexed strictly. Tag keywords live
// here only. On equal length the first rule wins: case-sensitive twins come
// before their case-insensitive forms (antlr-ng warning 112 on the shadowed
// lowercase spelling is intended).
// ===========================================================================

mode TAG_STRICT;

S_LBRACK : '[' -> type(LBRACK) ;
S_RBRACK : ']' -> type(RBRACK) ;
S_COLON : ':' -> type(COLON) ;
S_DASH : '-' -> type(DASH) ;
S_DOT : '.' -> type(DOT) ;

// Case-sensitive keywords (spec 2: the filename tag is fully case-sensitive).
SNAKE_CASE_CS options { caseInsensitive = false; } : 'snake_case' ;
KEBAB_CASE_CS options { caseInsensitive = false; } : 'kebab-case' ;
CAMEL_CASE options { caseInsensitive = false; } : 'camelCase' ;
PASCAL_CASE options { caseInsensitive = false; } : 'PascalCase' ;
FILENAME_CS options { caseInsensitive = false; } : 'filename' ;
CASE_CS options { caseInsensitive = false; } : 'case' ;

// Families.
PRESENCE : 'presence' ;
FORMAT   : 'format' ;
VALUE    : 'value' ;
COUNT    : 'count' ;
RANGE    : 'range' ;
ORDER    : 'order' ;
IO       : 'io' ;
CONTENT  : 'content' ;
PATTERN      : 'pattern' ;
REPEAT_RULES : 'repeat-rules' ;
// Colon-less, argument-less tag `[unique-headings-names]` (spec 2.11). Stage 1 reads it as a bare
// bracket; the stage-2 parse of that bracket (bodyTagEntry / fmTagEntry) makes it a known tag.
UNIQUE_HEADINGS_NAMES : 'unique-headings-names' ;

// Arguments.
REQUIRED      : 'required' ;
OPTIONAL      : 'optional' ;
TEMPLATE_ONLY : 'template-only' ;
ELEMENTS      : 'elements' ;
SNAKE_CASE    : 'snake_case' ;
KEBAB_CASE    : 'kebab-case' ;
FILENAME      : 'filename' ;
SEMVER        : 'semver' ;
DATE          : 'date' ;
MIN           : 'min' ;
MAX           : 'max' ;
ASCENDING     : 'ascending' ;
EXISTS        : 'exists' ;
NON_EMPTY     : 'non-empty' ;
TABLE         : 'table' ;
LIST          : 'list' ;
MIN_LINES     : 'min-lines' ;
MAX_LINES     : 'max-lines' ;
SUBHEADINGS   : 'subheadings' ;
DISALLOW      : 'disallow' ;
NO_EXTRA      : 'no-extra' ;
SAME_LEVEL    : 'same-level' ;
DESCENDING    : 'descending' ;
FIRST         : 'first' ;
// The word `number` of `[order:first:number:...]` (NUMBER is the digits token).
NUMBER_WORD   : 'number' ;

// Keywords followed by a free argument switch mode on their colon.
CONDITIONAL_ARG : 'conditional:' -> pushMode(TAG_FREE) ;
CONSTANT_ARG    : 'constant:' -> pushMode(TAG_FREE) ;
SCHEME_ARG      : 'scheme:' -> pushMode(TAG_SCHEME) ;

// The opening quote of a heading pattern (`pattern:"`): the quoted text is lexed
// in TAG_PATTERN up to the closing quote. A quote anywhere else is a plain
// stray character in the parser, so only `pattern:` can use it.
PATTERN_QUOTE : '"' -> pushMode(TAG_PATTERN) ;

S_NUMBER : [0-9]+ -> type(NUMBER) ;
S_WORD : [a-z0-9_]+ -> type(ALNUM) ;
S_WS : [ \t\f\u000B]+ -> type(WS) ;
S_OTHER : . -> type(OTHER) ;

// `[^\]]*`: any text up to the closing bracket.
mode TAG_FREE;

FREE_TEXT : ~[\]\n]+ ;
FREE_END : ']' -> type(RBRACK), popMode ;

// `[A-Za-z0-9+.,\-]+`
mode TAG_SCHEME;

SCHEME_TEXT : [a-z0-9+.,-]+ ;
SCHEME_END : ']' -> type(RBRACK), popMode ;
SCHEME_OTHER : . -> type(OTHER) ;

// Text of a heading pattern (spec 2.10), after `pattern:"` up to the first
// unescaped `"`. The lexer only cuts the text; the pieces are checked when the
// AST is built (src/tags/visitors/pattern.ts). Left to right, longest match:
// `{{` and `}}` are literal braces, `{...}` is a placeholder candidate (no
// brace inside, an escape pair allowed), a lone brace is kept for the
// unmatched-brace reason, a backslash pairs with the next character.
mode TAG_PATTERN;

PAT_LBRACE2 : '{{' ;
PAT_RBRACE2 : '}}' ;
PAT_PLACEHOLDER : '{' (~[{}"\\\n] | '\\' ~'\n')* '}' ;
PAT_LBRACE : '{' ;
PAT_RBRACE : '}' ;
PAT_ESCAPE : '\\' ~'\n' ;
PAT_TEXT : ~["\\{}\n]+ ;
PAT_END : '"' -> popMode ;
// A lone backslash or a line end: no parser rule accepts it (malformed tag).
PAT_STRAY : . ;

// ===========================================================================
// Disable directives of a target (spec 4.4, DIR2 to DIR4). Two stage-2 modes,
// never reached from DEFAULT_MODE: the stage-1 tokens above are unchanged.
// ===========================================================================

// Directive scan: the document re-lexed line by line. Only comment markers,
// backtick runs and plain text. src/tags/visitors/directive.ts pairs them
// left to right on one line (an equal backtick run closes a code span, the
// first following `-->` closes a comment); body lines inside a fence or the
// frontmatter are skipped by line (the fence modes above decide, DIR4).
mode DIRECTIVE_SCAN;

SCAN_OPEN : '<!--' ;
SCAN_CLOSE : '-->' ;
SCAN_TICKS : '`'+ ;
SCAN_NL : '\n' -> type(NL) ;
SCAN_TEXT : ~[<`\n\-]+ ;
SCAN_CHAR : [<\-] ;

// Directive content: the text of one comment (between `<!--` and `-->`, or
// after a frontmatter `#`). Keyword and verbs are case-insensitive (options).
// A word is a run without `,`, space or tab; on equal length a keyword wins.
mode DIRECTIVE;

DIR_KEYWORD : 'md-template-lint' ;
DIR_DISABLE : 'disable' ;
DIR_DISABLE_LINE : 'disable-line' ;
DIR_DISABLE_NEXT_LINE : 'disable-next-line' ;
DIR_DISABLE_FILE : 'disable-file' ;
DIR_BEGIN : 'begin' ;
DIR_END : 'end' ;
// A word that is exactly `--` (then whitespace, a comma or the end) starts the
// free-text reason, up to the end.
DIR_REASON : '--' ([ \t,] ~'\n'*)? ;
DIR_COMMA : ',' ;
DIR_WS : [ \t]+ -> type(WS) ;
DIR_WORD : ~[, \t\n]+ ;
