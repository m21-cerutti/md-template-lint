---
title: md-template-lint specification
last_updated: 2026-10-30
---

# md-template-lint specification

Phase A3 deliverable. This is the contract for the TypeScript port. It is derived from a
frozen snapshot of the legacy linter and wrappers and from their captured behaviour (both
removed from the tree after parity; history in `docs/research/wrapper-parity.md`). Later phases (grammar A6, engine A9, rules, config, CLI)
implement this file. When code and this file disagree, fix one of them in
the same change.

Conventions in this file:

- Template tags are written only inside inline code or fenced code, so this file is never
  parsed as a template.
- `py` means the legacy `lint_markdown_template.py`. `ps` means the legacy
  `lint_markdown_core.ps1`. `ps-multi` means the legacy `lint_markdown.multi-project.ps1`.
  `Lnnn` is a line number in the frozen snapshot of the file named just before it.
- "Frozen" behaviour is kept byte for byte (messages, order, defaults) unless a section says
  "changed". Every change is listed in section 5 (defects D01 to D18), section 10
  (assumptions AS1 to AS14) or section 11 (kept quirks Q01 to Q08, other changes C01 to C09).
- `AS<n>` is an assumption id, `Q<nn>` a kept quirk, `C<nn>` a change beyond the defect list,
  `DIR<n>` a decision of the disable directives section (4.4).
  Phase ids (A3, A6, A9, A21 to A25) are plan phases and are never used as assumption ids.
- Rule codes are `MTLnnn`. A code is never renumbered and never reused.

## 1. Model

### 1.1 What a template is

A template is a Markdown file. It IS the schema. There is no separate schema file.

- It starts with a YAML frontmatter block: first line `---`, closing line `---` (only
  spaces or tabs after the dashes). A `---` inside a value does not close the block.
- Each top-level frontmatter key is a field. Its value and its inline comment define the
  field type and rules.
- The body headings of level 1 and 2 define the section rules. Their suffix tags define
  presence, order and content rules.
- A BOM at the start of the file is ignored. Files are UTF-8.
- Line endings are normalized before parsing: CRLF and a lone CR become LF (legacy read the
  file in text mode, py L1646). The frontmatter delimiters, comment binding, heading
  extraction and section bodies all see LF only (the frontmatter pattern matches `\n` only,
  py L1594). Messages never contain a CR.

A target is a Markdown file linted against one template. It needs the same frontmatter
shape. Tags in a target are inert (see 2.7), except that recognized trailing heading tags
are stripped from target heading text before comparison. A target may carry disable
directives (comments that silence rule codes locally, 4.4); a template never does.

The template is parsed once per run (defect D05) and never linted against itself. A template
file that matches the `include` of its own pair is skipped as a target.

### 1.2 YAML loading

The YAML library is `yaml`. Frontmatter is loaded with the `failsafe` schema: every scalar is a
string, maps and sequences keep their shape. This reproduces the legacy `StringSafeLoader`
(no coercion of `yes`, `2026-08-10`, `1.0`, `~` to bool, date, number, null).

- Empty value (`key:`) loads as the empty string.
- A duplicate key: the last one wins (kept from legacy, no error).
- No frontmatter, invalid YAML, or a frontmatter that is not a mapping are the parse errors
  `MTL001`, `MTL002`, `MTL003`. A file that cannot be read or is not valid UTF-8 is `MTL004`.
- An empty frontmatter block loads as an empty mapping and is valid.

"Empty value" (used by presence): the empty or blank string, or an empty list. A mapping is
never empty, even when all its sub-values are empty.

### 1.3 Severity

- `error`: the file fails. Exit code 1.
- `warning`: printed, never changes the exit code. There is no strict mode in v1.

## 2. Template tags

A tag is a bracket token `[family:argument...]`. All tag names and keywords are matched
case-insensitively, with one exception: `[filename:case:<convention>]` is fully case-sensitive
(`camelCase` and `PascalCase` differ by capitalization alone). Tags are specified in the two
ANTLR grammar files `grammar/MdTemplateLexer.g4` (lexer with region modes) and
`grammar/MdTemplateParser.g4` (parser); no tag regex lives anywhere else.

Three syntaxes carry tags:

| Syntax                    | Where                                              | Bound to           | Grammar entry (A6)  |
| ------------------------- | -------------------------------------------------- | ------------------ | ------------------- |
| Inline comment            | trailing `#` comment on a top-level frontmatter key | that key           | `fmKeyLine` / `fmInlineComment` (family `fm*`) |
| Filename comment          | a standalone `#` comment line in the frontmatter    | the template       | `fmFilenameLine` (family `fm*`)  |
| Heading suffix            | bracket tags after the text of an H1 or H2 heading | that heading       | `bodyHeading` (family `body*`) |

The parser has two rule families: `fm*` for the frontmatter and `body*` for the body. The region
is decided by lexer modes (`FM*` modes for the leading `---` block, `BODY` and fence modes for the
rest; ADR 0002). A known tag in the wrong region is a located warning (`MTL013`,
2.7). The production path is `document`, which reaches the rules above. The entry rules
`fmTagEntry`, `bodyTagEntry`, `fmInlineCommentEntry`, `fmFilenameLineEntry` and
`bodyHeadingTextEntry` are test-only helper entries; a consistency check must target the
production rules.

Informal grammar (the `grammar/*.g4` files are normative):

```text
tag            = "[" family ":" body "]"            ; body never contains "]"
typeHintBare   = "[" typeToken "]"                  ; one word, no colon
inlineComment  = (text | tag | typeHintBare | typeEq)*
typeEq         = "type" "=" typeToken
filenameLine   = "#" WS "[filename:case:" convention "]" WS EOL
headingSuffix  = headingText (WS tag)*              ; recognized tags peeled right to left
convention     = "snake_case" | "kebab-case" | "camelCase" | "PascalCase"
```

### 2.1 Where comments bind (inline comment)

- A `#` starts a comment only outside single and double quotes AND at the start of the text or
  after a space or tab. `"#ff0000"`, `url#frag` and a `#` glued to a value stay in the value.
- The comment binds to the TOP-LEVEL key on the same physical line. It never binds across
  lines.
- Comments on indented sub-keys bind to nothing (a sub-key never shadows a top-level key).
- A comment on a list item is read per item index but no rule consumes it today.
- Whole-line comments bind to no key, except the filename comment (2.5).
- Several tags may share one comment, in any order, mixed with free text. For a tag
  that can appear once, the first occurrence wins.
- Legacy splits comments with a text heuristic that does not track backslash-escaped quotes
  and that breaks on quoted keys containing a colon. The port locates comments with the grammar
  key-line lexer (`fmKeyLine`) and joins them to the keys of the `yaml` document by line number
  (A6 spike, `docs/research/yaml-spike.md`, ADR 0002). The `yaml` library alone cannot be used:
  it merges consecutive comment lines. Field-tag diagnostics (`MTL010`, `MTL012`, `MTL013`) are
  emitted only for lines that match a top-level key of the parsed YAML document. A key-like line
  that is not a YAML key (inside a block scalar, a multi-line value) never produces a field-tag
  diagnostic. Results for normal templates are identical to legacy.

### 2.2 Presence tags (inline comment)

| Tag                              | Meaning                                                              | Code     |
| -------------------------------- | -------------------------------------------------------------------- | -------- |
| `[presence:required]`            | Value must be non-empty. Same as no presence tag. A missing or empty value is `MTL201`. | `MTL201` |
| `[presence:optional]`            | Absent or empty value is fine. No other check runs on an empty value. | none     |
| `[presence:conditional:<text>]`  | Documentation only. Behaves like optional. `<text>` is any text up to `]`, trimmed. | none     |

Precedence when several are present: conditional, then optional, then required. A field with
no presence tag is REQUIRED.

```yaml
---
id: "string" # [presence:required] [value:filename]
owner: "string" # [presence:optional]
reviewer: "string" # [presence:conditional:only when the change is risky]
---
```

### 2.3 Value tags (inline comment)

| Tag                                      | Applies to                        | Semantics                                                                                              | Code(s)          |
| ---------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------- |
| `[format:constant:<value>]`              | any present field                 | A scalar value must equal `<value>` (up to `]`, trimmed) as a string. A list or mapping value never matches (legacy compared its Python `str`; accepted deviation, see Q02), so it is always an error. | `MTL301`         |
| `[format:snake_case]`                    | scalar string value               | Must match snake case. Skipped when the value is not a string.                                         | `MTL302`         |
| `[format:kebab-case]`                    | scalar string value               | Must match kebab case. Skipped when the value is not a string.                                         | `MTL302`         |
| `[format:elements:snake_case]`           | list value                        | Every item must match snake case. Skipped when the value is not a list.                                | `MTL303`         |
| `[format:elements:kebab-case]`           | list value                        | Every item must match kebab case. Skipped when the value is not a list.                                | `MTL303`         |
| `[format:scheme:<s1>,<s2>,...]`          | `url`, per item of `list-of-url`  | Allow-list of URL schemes, comma separated, lowercased, case-insensitive. Only a syntactically valid URL is checked (an invalid URL is reported by the type rule). Empty list after trimming means no restriction. | `MTL304`, `MTL305` |
| `[value:filename]`                       | any present field                 | A scalar value must equal the target file name stem (name without the last extension) as a string. A list or mapping value never matches (legacy compared its Python `str`; accepted deviation, see Q02), so it is always an error. | `MTL102`         |
| `[count:min:N]`, `[count:max:N]`         | list value                        | Bounds the LENGTH of a list. `N` is a non-negative integer. No-op on a non-list value.                 | `MTL401`, `MTL402` |
| `[range:min:N]`, `[range:max:N]`         | any present field, NO type guard (legacy `_check_numeric_range`) | Bounds a numeric VALUE. `N` is `-?digits` with an optional `.digits`; an integer bound when no `.`, else a float. A scalar whose trimmed text matches `-?digits(.digits)?` (no exponent) is compared as a number (`MTL403`, `MTL404`). On a list, each item that matches is compared on its own (`MTL405`, `MTL406`), for ANY list, not only `list-of-int`. Items or scalars that are not numbers, and mappings, are skipped silently (the type rule reports them, no second error). | `MTL403` to `MTL406` |
| `[order:ascending]`                      | `list-of-date`                    | Adjacent valid dates must be in non-decreasing order. An ongoing marker sorts after every date. Invalid items are skipped. No-op on any other type. | `MTL407`         |
| `[io:exists]`                            | `path`, `list-of-path`, `url`, `list-of-url` (per item) | Opt-in existence or reachability check. EVERY finding is a warning. See 2.8. | `MTL801` to `MTL805` |

`[count:...]` bounds a list length. `[range:...]` bounds a number. They are never
interchangeable. `[range:...]` does not look at the field type: a string-typed field holding
`"3"` is range-checked too. A type hint such as `type=int` only adds the type rule on top.

Case styles used by `[format:...]` and `[filename:case:...]`:

```text
snake_case   ^[a-z0-9]+(_[a-z0-9]+)*$
kebab-case   ^[a-z0-9]+(-[a-z0-9]+)*$
camelCase    ^[a-z][a-zA-Z0-9]*$
PascalCase   ^[A-Z][a-zA-Z0-9]*$
```

(These are value patterns, not tag patterns. They live in the rule files.)

```yaml
---
slug: "string" # [format:kebab-case] [value:filename]
tags: ["a"] # [count:min:1] [count:max:5] [format:elements:kebab-case]
rating: "3" # type=int [range:min:1] [range:max:5]
homepage: "https://example.org" # [format:scheme:https] [io:exists]
milestones: ["2026-01", "2026-06"] # [order:ascending]
---
```

### 2.4 Type hints (inline comment)

Type hints are not rules. They only choose the field type (see section 3). Forms:

- `type=<name>` anywhere in the comment.
- A single-token bracket `[<name>]`, for example `[date]`. The `[path-alias]` bracket is a hint.
- The literal text `YYYY-MM-DD` or the word `ISO` (hint: date).
- The words `url` or `lien` (hint: url), the word `path` (hint: path), matched as whole words.
- An alias marker `@<name>/` in the comment (hint: path-alias).
- The field VALUE equal to a type name (`"date"`), or an option list `a | b` (enum).

Colon tags (`[presence:...]`) never act as type hints.

### 2.5 Filename comment (template-wide)

```yaml
---
# [filename:case:snake_case]
id: "string" # [presence:required] [value:filename]
---
```

- Syntax: a standalone comment line in the frontmatter block holding only this tag:
  `# [filename:case:<convention>]`, convention one of `snake_case`, `kebab-case`,
  `camelCase`, `PascalCase`. Case-sensitive.
- It binds to no key. The first such line wins.
- It constrains the target file name stem. Error `MTL101` when the stem does not match.
- It is read from the TEMPLATE only. In a target it is inert. The template file name is
  never checked.
- The same tag trailing a `key:` line is inert (and not reported as unknown).

### 2.6 Heading suffix tags (body sections)

Syntax: bracket tags trailing the text of an H1 or H2 line, space separated, in any order.
Only headings of level 1 and 2 are read. Headings inside fenced code blocks are ignored.

```markdown
## Overview [presence:required] [content:non-empty]
## Notes [presence:optional]
## Authoring checklist [presence:template-only]
```

Heading extraction rules:

- Line pattern: `#` or `##`, whitespace, text, optional trailing HTML comment (dropped).
- Fences: a line of three or more backticks or tildes (up to three leading spaces) opens a
  fence. It closes on the same character, at least as long, alone on its line.
- Known limitation, kept: `#` lines inside a multi-line HTML comment still count as headings.
- Tags are peeled from the right, one at a time, while the text keeps ending in a recognized
  heading tag. Peeling stops at the first bracket that is not a recognized heading tag; that
  bracket stays in the heading text (a typo does not become a missing-heading error).
- The stored heading text has all recognized tags removed, so `## Notes [presence:optional]`
  matches a plain `## Notes`. Heading text comparison is exact and case-sensitive. Levels are
  compared only by `[presence:exist]`.
- A section body is the raw text between a heading and the next extracted heading of
  equal or higher level (or the end of the file). H3 and deeper headings stay in the body.
  Fenced code is part of the body.

Presence tags on a heading:

| Tag                              | Meaning                                                                                       | Code     |
| -------------------------------- | --------------------------------------------------------------------------------------------- | -------- |
| `[presence:required]`            | Heading with this exact text must exist in the target. Same as no tag.                        | `MTL601` |
| `[presence:exist]`               | A heading at the SAME LEVEL must exist in the target, any text. Not in the legacy docstring, implemented in code (see Q03). | `MTL602` |
| `[presence:optional]`            | The target may omit it.                                                                       | none     |
| `[presence:conditional:<text>]`  | Documentation only, never enforced.                                                           | none     |
| `[presence:template-only]`       | Template-only guidance. Finding a heading with this text in a target is an error. Absent is the silent, correct outcome. No frontmatter equivalent. | `MTL603` |

Precedence: conditional, template-only, exist, optional, then required (the default).

Order (`MTL604`): headings of the template found in the target must appear in the same
relative order. For each template heading the matching target index is the FIRST target
heading with the same text (for `exist`: the first target heading of the same level). The
list of indices must be non-decreasing. Extra target headings are allowed. Missing ones are
covered by presence and are not an order problem.

Content tags (all errors, target only, skipped when the target lacks the heading, so a
missing heading is reported once). If the target repeats a heading text, the FIRST
occurrence is checked.

| Tag                       | Rule                                                                                  | Code     |
| ------------------------- | ------------------------------------------------------------------------------------- | -------- |
| `[content:non-empty]`     | Section body must not be blank.                                                       | `MTL701` |
| `[content:table]`         | Some line, trimmed, starts and ends with `\|` and has 2+ chars (a separator row counts). | `MTL702` |
| `[content:list]`          | Some line starts (after whitespace) with a `-`, `*` or `+` bullet or `N.` / `N)` and then whitespace. Nested items count. | `MTL703` |
| `[content:min-lines:N]`   | At least `N` non-blank lines in the body.                                             | `MTL704` |
| `[content:max-lines:N]`   | At most `N` non-blank lines in the body.                                              | `MTL705` |

If a heading carries several `min-lines` (or `max-lines`) tags, the first (leftmost) one is used.
A malformed `N` (for example `[content:min-lines:abc]`) is an `MTL012` warning only and never gives
`MTL704` or `MTL705`.

The old `<!-- [rule] required -->` HTML comment is dead. It is inert prose.

### 2.7 Inert, unknown and malformed tags

- The legacy marker `[rule]` is inert and never reported.
- A bracket that is not a known tag, not `[rule]`, not a known type token (the 17 type names
  of section 3) and that looks like a tag (only letters, digits, `_`, `:`, `-`) is an UNKNOWN
  tag: warning `MTL010` on a field, `MTL011` on a heading. It is otherwise ignored.
  Brackets in prose (`['a', 'b']`) are not tag attempts.
- On a heading, only the single leftover trailing bracket is considered for `MTL011`.
- A tag of a known family with a bad argument (`[count:min:abc]`, `[filename:case:Snake]`,
  an unterminated `[presence:`) is MALFORMED: warning `MTL012` with line and column. Legacy
  reported it as unknown (`MTL010`/`MTL011`). New code, same severity.
- Heading-only tags written in a frontmatter comment, and the reverse, are known, well-formed
  tags in the wrong region: warning `MTL013` (misplaced tag) with line and column, no effect on
  linting. They are not unknown and not malformed. New code (change C05); legacy ignored them.
- Unknown, malformed and misplaced tags are shown by `--verify` only (as in legacy). A normal
  lint run does not print template warnings.
- The parser layer reports only a region, a reason (unknown, malformed, wrong-region), a location
  and the subject. The rule file `src/rules/syntax.ts` owns the code, the severity and the
  message text (ADR 0002).
- Tags in a target file are inert. Only trailing heading tags are stripped (2.6). Disable
  directives (4.4) are comments, not tags.

### 2.8 The `[io:exists]` tag

The only tag that touches the file system or network. Opt-in, template only, target only.
EVERY finding is a warning and never changes the exit code. It is a no-op on other types.

Per item (a list contributes one check per non-blank string item):

1. Value shaped `@<name>/<rest>` (name `[A-Za-z0-9_-]+`): look up `<name>` in config `aliases`.
   Approved: join and test existence (`MTL802` when missing). Not approved: `MTL801`,
   not checked. Aliases are never guessed.
2. Absolute value (drive letter, or a leading `/` or `\`): never probed directly. If it lies
   inside one of the config `approvedPaths` it is tested like a relative path (`MTL804`).
   Otherwise `MTL803` (skipped).
3. Anything else is relative and is resolved against the ROOT of the pair that matched the
   target (changed, D11) and tested (`MTL804`).
   Residual (accepted, same as legacy): relative values and alias rests are NOT contained.
   A `..` segment may leave the pair root or alias root, so `approvedPaths` only restricts
   absolute values. The result is a warning that tells whether a file exists.
   Printed text keeps `..` unfolded (legacy parity). The existence probe and the
   `approvedPaths` containment test use the same lexically folded path, so on POSIX a
   symlinked segment before `..` can differ from the legacy physical resolution (accepted).
   A root prefix inside an alias rest (`@a//etc/x`) is stripped and joined under the alias root.
4. URL: HTTP HEAD with a 5 second timeout, retried once with GET if HEAD fails. Status
   2xx or 3xx is reachable and silent. Anything else (other status, timeout, DNS failure,
   refused connection, any exception) is `MTL805` with a reason of at most 60 characters.
   The body is never read. The probe never throws.
   Network policy (changed, SSRF hardening, C07):
   - Only `http:` and `https:` are probed. Any other scheme is refused before any I/O
     (`unsupported scheme`). User info in the URL is stripped and no cookie or auth header is sent.
   - Redirects are never followed; a 3xx status counts as reachable.
   - Loopback, 0.0.0.0/8, link-local (169.254.0.0/16, fe80::/10), cloud metadata, multicast and
     reserved ranges, IPv4-mapped IPv6 and numeric host spellings are refused (`blocked address`).
     RFC 1918, 100.64.0.0/10 and fc00::/7 are refused unless config `allowPrivateNetworks` is
     `true` (AS8). The RESOLVED address is checked at connect time (DNS rebinding).
   - Each URL is probed once per run; a run is capped at 100 distinct URLs (`url budget exceeded`).
   - Reasons come from a fixed vocabulary: `HTTP <status>`, `timeout`, `DNS failure`,
     `connection refused`, `blocked address`, `unsupported scheme`, `invalid URL`,
     `url budget exceeded`, `request failed`. Remote text is never echoed.

   Trust boundary: the config file is trusted. Its `template`, `templateRoot`, `roots`, `aliases`
   and `approvedPaths` accept `~`, absolute paths and `..`. Document values only feed existence
   checks (a warning), never reads. Symlinked target files are followed and read; directory
   symlinks are not traversed. On Windows a UNC path in any config path value triggers SMB/NTLM
   authentication to that host.

Existence tests swallow every OS error (treated as "does not exist"). No network access
happens unless a template uses `[io:exists]` on a url type.

## 3. Types

### 3.1 The 17 types

`string`, `enum`, `list`, `date`, `path`, `url`, `int`, `float`, `bool`, `nested-map`,
`path-alias`, `list-of-string`, `list-of-int`, `list-of-date`, `list-of-path`, `list-of-url`,
`list-of-path-alias`.

Inference is LOOSE (shape based). Validation is STRICT. They must stay separate for `date`
and `url`: a value that merely looks like a date is TYPED `date`, so the strict check can
reject it. Tightening inference would re-type a bad value to `string`, which has no format
check, and it would pass. `path` is the one shared predicate, on purpose, so prose such as
`n/a` is not typed as a path.

### 3.2 Inference order

`inferType(value, comment)` returns the first hit. Comment means the inline comment text bound
to the key (after `#`, trimmed). Source: `TypeInference.infer_type` py L1011,
`_hint_from_comment_and_value` L918, `_type_from_value` L984.

Step A, declared hint (first hit wins):

1. `type=<name>` in the comment: that name, lowercased, even if it is not a known type.
2. The value is a string equal (trimmed, case-insensitive) to a type name: that type.
3. The value is a string containing the separator ` | ` (space, pipe, space): `enum`.
4. The comment contains an alias marker `@<name>/` or the bracket `[path-alias]`
   (case-insensitive), OR the value is alias-shaped (`@<name>/<rest>`): `path-alias`.
   If there is no comment, the hint search stops here with no hint.
5. The comment contains `YYYY-MM-DD` or the word `ISO`: `date`.
6. The first single-token bracket `[<word>]` (letters, digits, `_`, `-`) in the comment,
   lowercased, other than `rule`: that token.
7. The comment contains the word `url` or `lien`: `url`. Else the word `path`: `path`.

Step B, promotion: if a hint was found, the value is a list and the hint is one of `date`,
`url`, `path`, `path-alias`, the type is `list-of-<hint>`. Otherwise the type is the hint.
There is no `list-of-enum`. `list-of-string` and `list-of-int` exist only through an explicit
hint (`type=list-of-int`, the value `"list-of-int"`, or `[list-of-int]`).

Step C, no hint, from the value alone:

1. Mapping: `nested-map`.
2. Non-empty list where every item is date-like: `list-of-date`; else every item
   url-like: `list-of-url`; else every item path-like: `list-of-path`; else `list`.
   An empty list is `list`.
3. String: alias-shaped, `path-alias`; date-like, `date`; url-like, `url`; path-like, `path`.
4. Anything else: `string`.

Kept quirk (Q01): a step A hint that is not one of the 17 types (`type=foo`, `[foo]`) becomes
the type name. Such a type is never validated, and a bracket form is also reported as an
unknown tag (`MTL010`).

### 3.3 Loose inference predicates

```text
date-like   matches one of the four shapes below, or the ongoing marker (calendar not checked)
url-like    non-blank string matching ^[A-Za-z][A-Za-z0-9+.\-]*://\S+$
path-like   see "path predicate" below (shared with validation)
alias-like  trimmed string matching ^@([A-Za-z0-9_-]+)/(.+)$
```

Date shapes (the only accepted formats, project wide):

```text
YYYY-MM-DD   ^\d{4}-\d{2}-\d{2}$
YYYY-MM      ^\d{4}-\d{2}$
YYYY         ^\d{4}$
DD/MM/YYYY   ^\d{2}/\d{2}/\d{4}$
```

Ongoing marker: `present` or `présent`, case-insensitive, with or without the accent.

### 3.4 The types and their rules

Each type has one rule and one stable code. The message is
`Field '<key>' (type=<type>): <detail>`. A list or mapping given to a scalar type is a shape
mismatch (`expected a scalar, got a list`), not a stringified format failure. `<shape>` is one
of `a list`, `a mapping`, `a scalar`.

| Type                 | Valid when (strict)                                                                                  | Code     |
| -------------------- | ---------------------------------------------------------------------------------------------------- | -------- |
| `string`             | Not a list and not a mapping.                                                                        | `MTL501` |
| `list`               | A YAML list (items unchecked).                                                                       | `MTL502` |
| `nested-map`         | A mapping. Sub-keys are never checked.                                                               | `MTL503` |
| `date`               | Trimmed value is the ongoing marker, or one of the four shapes AND a real calendar date (`2025-02-29`, `2026-13-40`, `31/02/2020` fail; no lenient zero padding). | `MTL504` |
| `url`                | See "url predicate".                                                                                 | `MTL505` |
| `path`               | See "path predicate".                                                                                | `MTL506` |
| `path-alias`         | Trimmed value matches `^@[A-Za-z0-9_-]+/\S+$`.                                                       | `MTL507` |
| `int`                | Trimmed value matches `^-?\d+$`. A decimal gets `got a decimal, expected an integer: '<value>'`.      | `MTL508` |
| `float`              | Trimmed value matches `^-?\d+(\.\d+)?$` (no exponent).                                               | `MTL509` |
| `bool`               | Trimmed value is `true` or `false`, case-insensitive.                                                | `MTL510` |
| `list-of-string`     | A list whose items are not lists or mappings.                                                        | `MTL511` |
| `list-of-int`        | A list, every item a valid `int`.                                                                    | `MTL512` |
| `list-of-date`       | A list, every item a valid `date`.                                                                   | `MTL513` |
| `list-of-path`       | A list, every item a valid `path`.                                                                   | `MTL514` |
| `list-of-url`        | A list, every item a valid `url`.                                                                    | `MTL515` |
| `list-of-path-alias` | A list, every item a valid `path-alias`.                                                             | `MTL516` |
| `enum`               | Membership in the option list (see below). Not a type check.                                         | `MTL517` |

A list type given a non-list value fails with `expected a YAML list of <things>, got <shape>`.
Block and flow YAML lists are both valid. A comma separated scalar is NOT a list.

Enum: options come from the TEMPLATE field value split on ` | `, each trimmed, empty
dropped. A target holds one option. No options (hint without a pipe list): no check. A value
not in the list is an error `MTL517` when the field is required, a WARNING when optional or
conditional. An enum field skips the type check afterwards.

Url predicate (strict): trimmed, no whitespace, a scheme matching `^[a-z][a-z0-9+.\-]*$`
(case-insensitive), a non-empty authority (the text after `://` up to the first `/`, `?` or
`#`), and no `<>"{}|\^` inside the authority. That is all: the `[format:scheme:...]`
allow-list is NOT part of this predicate. The scheme check belongs to `MTL304` and `MTL305`
only, and those run only on a value that passes this predicate (legacy `_check_url_schemes`,
py L1964-1975). The split is per value, and per item for lists: a valid URL with a disallowed
scheme gives `MTL304` (`MTL305` for an item of a list) and never `MTL505` (`MTL515`); an
invalid URL gives `MTL505` (`MTL515`) and never `MTL304` (`MTL305`). A `list-of-url` with
one valid but disallowed item and one invalid item therefore gets both `MTL305` (naming the
first item) and `MTL515` (naming the second).

Path predicate (shared by inference and validation): a non-blank string, not url-like, with
at least one `/` or `\` separator and no whitespace (shape
`^(?:[A-Za-z]:)?[\\/]?(?:[^\s\\/]+[\\/])+[^\s\\/]*$`), no character from `<>"|?*` or a control
character, no `:` other than one leading drive colon, AND anchored (py L275): it starts with
one of `./`, `../`, `.\`, `..\`, `/`, `\`, `~/`, `~\`, or a drive letter followed by `/` or
`\`; OR it ends with an extension (`.` and one to five letters or digits). `n/a`, `QA/Test`
and `and/or` are not paths.

Python-style text in messages (Q02): the legacy messages print lists with Python `repr`
(`['a', 'b']`), and a list or mapping used as `{value}` with its Python `str`. The port
reproduces this for parity. Placeholder `{pylist}` in section 4.

## 4. Lint pipeline and rule codes

### 4.1 Order of checks for one target

1. Parse the target. A parse failure (`MTL001` to `MTL004`) is the only diagnostic; the file
   is not checked further. Message prefix: `Parse error: `.
2. Filename case (`MTL101`).
3. For each template field, in template order. If the target value is missing or empty:
   required gives `MTL201`; optional and conditional are silent; then go to the next field.
   Otherwise run, in this order: constant (`MTL301`), count (`MTL401`, `MTL402`), range
   (`MTL403` to `MTL406`), order (`MTL407`), scheme (`MTL304`, `MTL305`), `[io:exists]`
   (`MTL80x`), value-filename (`MTL102`), case (`MTL302`), elements case (`MTL303`), then
   enum (`MTL517`) or the type rule (`MTL501` to `MTL516`).
4. Unknown keys, in target key order (`MTL202`, warning).
5. Heading presence and order (`MTL601` to `MTL604`), message prefix `Heading: `.
6. Section content (`MTL701` to `MTL705`).
7. Directive diagnostics of the target (`MTL020` to `MTL025`, warnings, 4.4), in directive
   source order, `MTL024` last (DIR8).
8. Suppression (engine core, 4.4): every diagnostic of steps 2 to 6 that a directive covers
   (DIR7: a line directive or range on its anchor line, or a `disable-file` for its code)
   is removed and counted as suppressed. Step 7 diagnostics are never removed.

Steps 7 and 8 are new (change C08) and are appended at the end, so the numbers of steps 1
to 6 stay valid. A target without directives gives the same diagnostics and the same text
output as before (parity); JSON only gains the always present `summary.suppressed` key (8.5).
Errors are printed first, then warnings, each list in emission order.

Template-side diagnostics (`MTL001` to `MTL004` fatal, `MTL010` to `MTL013` warnings) come
from the template parse.

### 4.2 Code ranges

| Range         | Category (file in `src/rules/`) | Scope                                         |
| ------------- | ------------------------------- | --------------------------------------------- |
| `MTL001`-`099` | `syntax`                        | parsing, template tag and target directive diagnostics |
| `MTL100`-`199` | `filename`                      | rules on the target file name                 |
| `MTL200`-`299` | `presence`                      | field presence, unknown keys                  |
| `MTL300`-`399` | `format`                        | value shape rules from tags                   |
| `MTL400`-`499` | `bounds`                        | count, range, order                           |
| `MTL500`-`599` | `type`                          | type validation, enum                         |
| `MTL600`-`699` | `heading`                       | heading presence and order                    |
| `MTL700`-`799` | `content`                       | section body rules                            |
| `MTL800`-`899` | `io`                            | `[io:exists]` warnings                        |
| `MTL900`-`999` | none (engine)                   | run diagnostics: config, CLI, missing inputs (errors; `MTL913` may be a warning) |

Sub-ranges inside `syntax` (prose on purpose: the table above is read by `pnpm run
check:rules`, one row per category): `MTL001`-`009` parse errors, `MTL010`-`019` template
tag warnings (`MTL014`-`019` free), `MTL020`-`029` target directive warnings (4.4;
`MTL026`-`029` free).

### 4.3 Code table

Placeholders: `{key}` field name, `{value}` value as text, `{stem}` file name stem, `{text}`
heading text, `{pylist}` Python-style list, `{shape}` see 3.4. Messages are the legacy text
(after the code, in output). Changed messages are marked "changed".

#### syntax (`src/rules/syntax.ts`)

| Code     | Name                      | Severity | Message                                                              | Legacy source                          |
| -------- | ------------------------- | -------- | -------------------------------------------------------------------- | -------------------------------------- |
| `MTL001` | frontmatter-missing       | error    | `File must have YAML frontmatter (---...---)`                        | py L1649-1650 `TemplateParser.parse`   |
| `MTL002` | yaml-invalid              | error    | `YAML parse error: {detail}` (`{detail}` is the `yaml` package message, not the PyYAML text; accepted deviation) | py L1655-1658 `TemplateParser.parse`   |
| `MTL003` | frontmatter-not-mapping   | error    | `YAML frontmatter must be a mapping of 'key: value' pairs`           | py L1660-1661 `TemplateParser.parse`   |
| `MTL004` | file-unreadable           | error    | `{detail}` (read or UTF-8 decode failure)                            | py L2072-2075 `lint_file` (target), L2606-2611 `main` (template) |
| `MTL010` | unknown-field-tag         | warning  | `Field '{key}': unknown tag {tag}`                                   | py L773-803 `find_unknown_tags`, L2229-2231 `describe` |
| `MTL011` | unknown-heading-tag       | warning  | `Heading '{text}': unknown tag {tag}`                                | py L864-871 `split_heading_tags`, L2232-2234 `describe` |
| `MTL012` | malformed-tag             | warning  | `Field '{key}': malformed tag {tag}`, `Heading '{text}': malformed tag {tag}` or `Filename comment: malformed tag {tag}` | new (phase A6, located errors) |
| `MTL013` | misplaced-tag             | warning  | `Field '{key}': tag {tag} is not valid in frontmatter` or `Heading '{text}': tag {tag} is not valid in a heading` | new (change C05) |
| `MTL020` | directive-malformed          | warning  | `Directive on line {line}: unknown directive '{word}' (expected disable, disable-line, disable-next-line, disable-file, begin disable or end disable)` or `Directive on line {line}: '{directive}' needs at least one rule code` | new (C08) |
| `MTL021` | directive-unknown-code       | warning  | `Directive on line {line}: unknown rule code '{token}'`                                                     | new (C08)     |
| `MTL022` | directive-code-not-suppressible | warning | `Directive on line {line}: rule code {code} cannot be disabled`                                           | new (C08)     |
| `MTL023` | directive-end-without-begin  | warning  | `Directive on line {line}: 'end disable {code}' has no open 'disable' or 'begin disable' for {code}`        | new (C08)     |
| `MTL024` | directive-begin-unclosed     | warning  | `Directive on line {line}: 'begin disable {code}' is never closed, it runs to the end of the file`          | new (C08)     |
| `MTL025` | directive-already-disabled   | warning  | `Directive on line {line}: '{directive} {code}' while {code} is already disabled since line {open}`         | new (C08)     |

`MTL020` to `MTL025` are the target directive warnings; their placeholders and rules are
under "Directive warnings" below (4.3) and in 4.4.

`MTL001` to `MTL004` on a target print `Parse error: <message>`. On a template the same
diagnostic makes the template "broken" and is printed in ONE form everywhere (text, verify and
JSON `error`): `TEMPLATE ERROR: <template> - <message>`, where `<message>` is the message of
the code, for example `YAML parse error: ...` (8.2). The text output prints the full line.
The `Broken templates:` list prints `- <template> - <message>`, and the JSON `error` holds
the bare `<message>` with the template in its own field. Verify mode prints a broken
template with the same `TEMPLATE ERROR` line instead of its table (7.3, 8.3). The legacy prefix
`Error: template parse failed:` is not printed (D16).

Template file checks. A configured template path goes through three checks, in this order,
and each outcome has one code:

1. The path does not exist: `MTL910`, run error, exit 2.
2. The path exists but is not a regular file (a directory, a device; a symbolic link to a
   regular file counts as a file): `MTL911`, run error, exit 2. It says nothing about
   readability.
3. The path is a regular file but reading or UTF-8 decoding fails, or its content does not
   parse: `MTL004` or `MTL001` to `MTL003`. The template is "broken", exit 1, as in legacy
   (py L2606-2611).

`MTL910` and `MTL911` skip only the pairs that use that template. Other pairs still run (D14).
The `MTL911` outcome is a change from legacy, recorded as C04.

#### filename (`src/rules/filename.ts`)

| Code     | Name            | Severity | Message                                                                                  | Legacy source                     |
| -------- | --------------- | -------- | ---------------------------------------------------------------------------------------- | --------------------------------- |
| `MTL101` | filename-case   | error    | `Filename '{stem}' does not match required case [filename:case:{convention}]`            | py L2089-2094 `lint_file`         |
| `MTL102` | value-filename  | error    | `Field '{key}': expected value to equal filename '{stem}' ([value:filename]), got '{value}'` | py L2011-2015 `_check_field`  |

#### presence (`src/rules/presence.ts`)

| Code     | Name              | Severity | Message                                             | Legacy source                |
| -------- | ----------------- | -------- | --------------------------------------------------- | ---------------------------- |
| `MTL201` | required-missing  | error    | `Field '{key}': required but empty or missing`      | py L2096-2101 `lint_file`    |
| `MTL202` | unknown-key       | warning  | `Unknown key '{key}' not present in template`       | py L2105-2107 `lint_file`    |

#### format (`src/rules/format.ts`)

| Code     | Name                        | Severity | Message                                                                                       | Legacy source                  |
| -------- | --------------------------- | -------- | --------------------------------------------------------------------------------------------- | ------------------------------ |
| `MTL301` | constant-mismatch           | error    | `Field '{key}': expected constant value '{constant}', got '{value}'`                          | py L1988-1992 `_check_field`   |
| `MTL302` | case-mismatch               | error    | `Field '{key}': value '{value}' does not match required format [{case}]`                      | py L2017-2023 `_check_field`   |
| `MTL303` | elements-case-mismatch      | error    | `Field '{key}': list contains entries not matching [format:elements:{case}]: {pylist}`        | py L2025-2033 `_check_field`   |
| `MTL304` | scheme-disallowed           | error    | `Field '{key}': URL scheme of '{value}' is not allowed [format:scheme:{schemes}]`             | py L1964-1970 `_check_url_schemes` |
| `MTL305` | scheme-disallowed-item      | error    | `Field '{key}': list contains URLs with a disallowed scheme {pylist} [format:scheme:{schemes}]` | py L1972-1980 `_check_url_schemes` |

`{schemes}` is the allow-list, lowercased, sorted, comma joined.

#### bounds (`src/rules/bounds.ts`)

| Code     | Name              | Severity | Message                                                                              | Legacy source                       |
| -------- | ----------------- | -------- | ------------------------------------------------------------------------------------ | ----------------------------------- |
| `MTL401` | count-min         | error    | `Field '{key}': list has {n} item(s), minimum is {min}`                              | py L2001-2002 `_check_field`        |
| `MTL402` | count-max         | error    | `Field '{key}': list has {n} item(s), maximum is {max}`                              | py L2003-2004 `_check_field`        |
| `MTL403` | range-min         | error    | `Field '{key}': value {value} is below range:min {min}`                              | py L1918-1919 `_check_numeric_range` |
| `MTL404` | range-max         | error    | `Field '{key}': value {value} is above range:max {max}`                              | py L1920-1921 `_check_numeric_range` |
| `MTL405` | range-min-item    | error    | `Field '{key}': item(s) {pylist} are below range:min {min}`                          | py L1899-1908 `_check_numeric_range` |
| `MTL406` | range-max-item    | error    | `Field '{key}': item(s) {pylist} are above range:max {max}`                          | py L1902-1911 `_check_numeric_range` |
| `MTL407` | order-ascending   | error    | `Field '{key}': dates are not in ascending order ('{prev}' comes before '{item}') [order:ascending]` | py L1939-1950 `_check_order_ascending` |

The bound `{min}` / `{max}` of `MTL403` to `MTL406` is printed as the PARSED number, in
Python `repr` style, not as written (py `parse_numeric_bound` L692): a tag bound without `.`
is an integer printed in plain decimal (`007` prints `7`, `-0` prints `0`); a bound with `.`
is a float printed in its shortest round-trip form with at least one decimal (`2.50` prints
`2.5`, `2.0` prints `2.0`). Python switches to exponent form for very small and very large
floats (`0.00001` prints `1e-05`, `15000000000000000.0` prints `1.5e+16`); the port keeps the
same behaviour (it must not use JavaScript number formatting). `{value}` in `MTL403` and `MTL404` is the raw text of the target
value. `MTL401` and `MTL402` print the integer bound of `[count:...]` the same way.
One `MTL407` per decreasing adjacent pair.

#### type (`src/rules/type.ts`)

All messages are `Field '{key}' (type={type}): {detail}`; the detail text is the legacy text.
Source for all: py L1099-1164 `validate_value`, L1057-1096 tables, L2052-2054 `_check_field`.

| Code     | Name                     | Severity | Detail text                                                                                                  |
| -------- | ------------------------ | -------- | ------------------------------------------------------------------------------------------------------------ |
| `MTL501` | type-string              | error    | `expected a plain string, got {shape}`                                                                       |
| `MTL502` | type-list                | error    | `expected a YAML list, got {shape}`                                                                          |
| `MTL503` | type-nested-map          | error    | `expected a mapping (nested-map), got {shape}`                                                               |
| `MTL504` | type-date                | error    | `value is not a valid calendar date in an accepted format (YYYY-MM-DD / YYYY-MM / YYYY / DD/MM/YYYY / present / présent)` |
| `MTL505` | type-url                 | error    | `value is not syntactically a valid URL (expected scheme://host/...)`                                        |
| `MTL506` | type-path                | error    | `value does not look like a valid path`                                                                      |
| `MTL507` | type-path-alias          | error    | `value is not a valid path alias (expected @<name>/<rest>)`                                                  |
| `MTL508` | type-int                 | error    | `value is not a valid integer` or `got a decimal, expected an integer: '{value}'`                            |
| `MTL509` | type-float               | error    | `value is not a valid float`                                                                                 |
| `MTL510` | type-bool                | error    | `value is not 'true' or 'false'`                                                                             |
| `MTL511` | type-list-of-string      | error    | `expected a YAML list of strings, got {shape}` or `list contains non-scalar entries: {pylist}` (items like `item 0 is a list`) |
| `MTL512` | type-list-of-int         | error    | `expected a YAML list of integers, got {shape}` or `list contains non-integer entries: {pylist}`             |
| `MTL513` | type-list-of-date        | error    | `expected a YAML list of dates, got {shape}` or `list contains invalid date entries (expected a real calendar date in <formats>): {pylist}` |
| `MTL514` | type-list-of-path        | error    | `expected a YAML list of paths, got {shape}` or `list contains non-path entries: {pylist}`                   |
| `MTL515` | type-list-of-url         | error    | `expected a YAML list of URLs, got {shape}` or `list contains non-URL entries: {pylist}`                     |
| `MTL516` | type-list-of-path-alias  | error    | `expected a YAML list of path aliases, got {shape}` or `list contains non-alias entries (expected @<name>/<rest>): {pylist}` |
| `MTL517` | enum-option              | error or warning | `value '{value}' is not one of the allowed options {pylist}` (error when the field is required, warning when optional or conditional) |

For scalar types a list or mapping gives `expected a scalar, got {shape}` under the same code.
`<formats>` is `YYYY-MM-DD / YYYY-MM / YYYY / DD/MM/YYYY / present / présent`.

#### heading (`src/rules/heading.ts`)

All messages carry the prefix `Heading: ` (py L2112). Source: py L1456-1523
`HeadingOrderValidator.validate`.

| Code     | Name                   | Severity | Message                                                                                                   | Legacy source |
| -------- | ---------------------- | -------- | --------------------------------------------------------------------------------------------------------- | ------------- |
| `MTL601` | heading-missing        | error    | `Missing required heading: '{text}'`                                                                      | py L1488      |
| `MTL602` | heading-level-missing  | error    | `Missing heading at level H{n} [presence:exist]`                                                          | py L1484      |
| `MTL603` | heading-template-only  | error    | `Heading '{text}' is marked [presence:template-only] and must not appear in the linted file`              | py L1490      |
| `MTL604` | heading-order          | error    | `Heading order mismatch: template order {pylist} vs target order {pylist}`                                | py L1519      |

#### content (`src/rules/content.ts`)

Source: py L1526-1581 `HeadingOrderValidator.validate_content`. The `{label}` is `Section '{text}'`.

| Code     | Name                 | Severity | Message                                                                       | Legacy source |
| -------- | -------------------- | -------- | ----------------------------------------------------------------------------- | ------------- |
| `MTL701` | content-non-empty    | error    | `{label}: [content:non-empty] section body is empty`                          | py L1558-1559 |
| `MTL702` | content-table        | error    | `{label}: [content:table] no markdown table row found`                        | py L1561-1562 |
| `MTL703` | content-list         | error    | `{label}: [content:list] no markdown list item found`                         | py L1564-1565 |
| `MTL704` | content-min-lines    | error    | `{label}: [content:min-lines:{n}] only {count} non-blank line(s)`             | py L1567-1572 |
| `MTL705` | content-max-lines    | error    | `{label}: [content:max-lines:{n}] {count} non-blank line(s)`                  | py L1574-1579 |

#### io (`src/rules/io.ts`)

All warnings. Source: py L1811-1877 `_warn_path_exists`, `_warn_url_reachable`,
`_check_io_exists`; probe py L530-563 `probe_url_reachable`. Paths in messages are printed
with `/`. The pair root is joined with a relative value as in legacy, so a real run prints
an absolute path, as legacy does. The path separator normalisation is D15.

| Code     | Name                  | Severity | Message                                                                                                                      | Legacy source |
| -------- | --------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `MTL801` | alias-unapproved      | warning  | `Field '{key}': alias '@{name}/...' has no entry in config aliases, not checked` (changed: said `approved_path.yml`)          | py L1818-1821 |
| `MTL802` | alias-path-missing    | warning  | `Field '{key}': aliased path '@{name}/{rest}' resolved to {resolved} — does not exist`                                       | py L1824-1828 |
| `MTL803` | absolute-skipped      | warning  | `Field '{key}': absolute path '{value}' skipped by [io:exists] (not checked); add it under approvedPaths in the config` (changed) | py L1831-1836 |
| `MTL804` | path-missing          | warning  | `Field '{key}': path '{value}' does not exist (resolved: {resolved})`                                                        | py L1839-1843 |
| `MTL805` | url-unreachable       | warning  | `Field '{key}': URL '{value}' not reachable ({reason})`                                                                       | py L1845-1849 |

#### run errors (engine, no rule file)

Not rules. They describe a problem with the run itself. All are errors (exit code 2) except
`MTL913`, whose severity comes from `onEmpty` (see 7.4). Details of each are in sections 6
and 7.

| Code     | Name                   | Message (shape)                                                           | Legacy source                          |
| -------- | ---------------------- | ------------------------------------------------------------------------- | -------------------------------------- |
| `MTL901` | config-not-found       | `config file not found: {path}` or `no md-template-lint.yml found from {dir} upward` | new (replaces wrappers)     |
| `MTL902` | config-yaml-invalid    | `cannot parse {path}: {detail}`                                           | py L2291-2298 `load_approved_path_aliases` |
| `MTL903` | config-unknown-key     | `{keyPath}: unknown key '{key}'`                                          | new                                    |
| `MTL904` | config-invalid-value   | `{keyPath}: expected {expected}, got {actual}`; missing required keys use `{keyPath}: required key is missing` | py L2300-2317 (alias entry checks)     |
| `MTL905` | config-invalid-name    | `{keyPath}: invalid name '{name}'`, reserved or duplicate names           | new                                    |
| `MTL906` | config-unknown-root    | `{keyPath}: root '{name}' is not declared`                                | new                                    |
| `MTL907` | config-invalid-glob    | `{keyPath}: invalid glob '{glob}': {detail}`                              | py L2480-2492 (invalid regex)          |
| `MTL908` | config-bad-version     | `unsupported config version {n}`                                          | new                                    |
| `MTL909` | root-not-found         | `root '{name}' directory not found: {path}`                               | `ps-multi` L56-59; py L2476-2478 |
| `MTL910` | template-not-found     | `template not found: {path} (pair '{name}')`                              | py L2586-2588; ps L90-93               |
| `MTL911` | template-not-a-file    | `template path is not a regular file (for example a directory): {path} (pair '{name}')` | new (see "Template file checks" below) |
| `MTL912` | target-not-found       | `target not found: {path}`                                                | py L2633-2635                          |
| `MTL913` | empty-target-set       | `no files matched pair '{name}' in root '{root}'` (changed, C03; severity warning or error from `onEmpty`) | py L2626-2628; ps L114-117             |
| `MTL920` | unknown-option         | `unknown option: {flag}`                                                  | py L2568-2571                          |
| `MTL921` | option-missing-arg     | `{flag} requires an argument`                                             | py L2541-2566                          |
| `MTL922` | option-bad-value       | `invalid value '{value}' for {flag} (expected {expected})`                | new                                    |
| `MTL923` | usage-conflict         | e.g. `--verify needs a config or at least one template path`              | py L2579-2582                          |

#### Directive warnings (`MTL020` to `MTL025`, rows in the `syntax` table above)

Target directive warnings (4.4, change C08), category `syntax`, `src/rules/syntax.ts`, phase
`target`, step `directives`. All are warnings, never change the exit code and
are never suppressible. Each carries the `line` and `column` of the directive start (`<!--`
or `#`), and the message names the line too: the message must stay readable on its own, in
the JSON `message` and in logs that drop the excerpt rows of 8.2 (which quote that line with a
caret under the start). `{line}` is the 1-based file line of the directive. `{directive}` is the canonical
lowercase verb (`disable`, `disable-line`, `disable-next-line`, `disable-file`, `begin
disable`, `end disable`). `{code}` is a rule code in upper case. `{token}` and `{word}` are the text as
written (control characters escaped as in 8.2). One diagnostic per offending code token; a
token written twice in one directive (compared in upper case) counts once, like a code.

`{word}` of `MTL020` is the first word after the keyword (leading commas and spaces are skipped,
so `,MTL201` gives `MTL201`), or empty (`''`) when the keyword is alone; for a two-word verb that is broken (`begin disabel`, `end` alone) it is the first word
(`begin` or `end`) when the second word is not `disable`, else the verb is valid. `{open}` of `MTL025` is the line of the directive that opened the active range.
`disable-file` never opens a range, so it never takes part in `MTL023`, `MTL024` or
`MTL025` (DIR8); it can give `MTL020` (no code), `MTL021` and `MTL022` like every verb.

The six rows live in the `syntax` table because `pnpm run check:rules` reads only the rows
under a heading whose first word is a category (`tests/consistency/rules.test.ts` pins the
row count). This heading holds the prose only.

### 4.4 Disable directives in target files

A target file may silence rule codes locally with comments. This is the only way a target
changes which diagnostics are reported (change C08). Directives came in A58 (grammar and
parser) and A60 (engine suppression and `MTL020` to `MTL025`); A62 documents them in the
README. Each decision
below is numbered (DIR1 to DIR10, cited from other sections) with its rationale; the global
assumptions are AS9 to AS13 (section 10).

#### Forms and syntax (DIR1, DIR2)

DIR1. Six directive words give four behaviours (inline, open disable, block, whole document):

| Directive                              | Covers (file lines, inclusive)                                                           |
| -------------------------------------- | ---------------------------------------------------------------------------------------- |
| `disable <codes>`                      | from its own line to the line of a matching `end disable`, else to the end of the file    |
| `disable-line <codes>`                 | its own line only (inline)                                                               |
| `disable-next-line <codes>`            | the next file line only (line + 1, even when that line is blank)                          |
| `disable-file <codes>`                 | the whole target document, wherever it stands: every line, and every diagnostic without anchor (DIR7) |
| `begin disable <codes>`                | from its own line to the line of the matching `end disable` (block)                      |
| `end disable <codes>`                  | closes the open range (`disable` or `begin disable`) of each listed code, on its own line |

`disable` and `begin disable` open the same kind of range. The only difference: an unclosed
`begin disable` is a mistake (`MTL024`, the range still runs to the end of the file), while an
unclosed `disable` is the normal, intended use. Rationale: both an open
`disable` and a `begin`/`end` block are needed; ESLint users also know `disable-line` and
`disable-next-line`, and the next-line form keeps a busy line clean (a YAML key with a long
value, a heading) by putting the comment on its own line above it.

`disable-file` is the only directive that covers a diagnostic without anchor (a missing
key, a missing heading, the heading order, the file name; DIR5, DIR7). It opens no range, so
`end disable` does not close it and it never conflicts with a range (DIR8). Rationale: a
finding about the whole file has no line a line directive could point at; a dedicated verb
states the whole-file intent explicitly, in one place, instead of inferring it from where a
range happens to end. There is no alias: a draft name, `disable-document`, was never
released and is an unknown verb (`MTL020`) like any other.

DIR2. Syntax. A directive is the content of one comment (carriers in DIR3):

```text
directive  = keyword WS+ verb (SEP item)* (SEP reason)? SEP?
keyword    = "md-template-lint"
verb       = "disable" | "disable-line" | "disable-next-line" | "disable-file"
           | "begin" WS+ "disable" | "end" WS+ "disable"
SEP        = ("," | WS)+                          ; commas and/or spaces and tabs
item       = word                                 ; validated afterwards as a code
word       = (any character except "," and WS)+, but not exactly "--"
reason     = "--" (WS any text)?                  ; free text, ignored
```

Each `item` is checked after parsing, never by the grammar: it is a code when it matches
`MTL` and three digits (case-insensitive) and names a code of the 4.3 tables. A suppressible
code (DIR6) is kept; a known code that is not suppressible gives `MTL022`; any other item
(`MTL2O1`, `201`, `MTL050`) gives `MTL021`. Example: `disable-line MTL601 -- x` parses as
verb, SEP, item `MTL601`, SEP, reason `-- x`.

- The comment content, after leading spaces and tabs, must START with the keyword followed by
  a space, a tab or the end of the content. Otherwise the comment is plain prose, silently
  (`<!-- see md-template-lint docs -->` is not a directive).
- Keyword, verbs and codes are case-insensitive (`MD-Template-Lint Disable mtl202` is valid);
  codes are normalized to upper case. Rationale: tag keywords are case-insensitive too (section 2 intro).
- Codes are separated by commas, spaces or tabs, in any mix: `MTL201, MTL202`,
  `MTL201,MTL202` and `MTL201 MTL202` are equal. Empty items (`MTL201,,MTL202`, a trailing
  comma) are ignored. A code listed twice in one directive counts once.
- The code list ends at the end of the content or at a word that is exactly `--` (preceded
  by a separator, followed by whitespace, a comma or the end); the rest, without that one
  leading comma, is a free-text reason (`<!-- md-template-lint disable-line MTL202 -- kept for import -->`).
  Rationale: a reason documents why, and `--` inside an HTML comment is valid HTML5.
- There is no wildcard and no "disable everything": a directive without a code is `MTL020`.
  Rationale: explicit codes keep each suppression reviewable.
- Error cases (warnings, 4.3 `syntax` table and "Directive warnings"): an unknown verb or a keyword alone is
  `MTL020`; a verb with no item is `MTL020`; an item that is not a code of the 4.3 tables
  (`MTL2O1`, `201`, `MTL050`) is `MTL021`; a known code that is not suppressible (DIR6) is
  `MTL022`. A bad item is dropped; the valid codes of the same directive still apply. A
  malformed verb (`MTL020`) makes the whole directive inert.
- When every item of a directive is dropped (all `MTL021` or `MTL022`), there is no extra
  `MTL020`: those warnings already explain the problem. The directive is inert (it opens,
  closes and covers nothing). Rationale: one warning per mistake, no duplicate.
- A code that never fires in this file is fine: no warning (no "unused directive" check).
  Rationale: a directive may guard a value that is only sometimes wrong; an unused check
  would add noise and a new code for little gain.

#### Carriers and where directives are read (DIR3, DIR4)

DIR3. Carriers. Only in a TARGET file, in two forms:

- Body (after the frontmatter): an HTML comment `<!--` ... `-->` that opens and closes on the
  same line. Its content is the text between `<!--` and the first following `-->`. The
  comment may stand anywhere on the line, also after text or on a heading line
  (`## Notes <!-- md-template-lint disable-line MTL701 -->`; heading extraction already drops
  a trailing HTML comment, 2.6, so the heading still matches). Several directive comments on
  one line are read left to right. A multi-line HTML comment is never a directive.
- Frontmatter: a YAML comment. Its content is the text after the `#`. Two places only: the
  trailing comment of a top-level key line (the same lines that bind field comments, 2.1:
  lines that match a top-level key of the parsed YAML document), and a whole-line comment
  whose `#` is in column 1 and that the `yaml` document treats as a comment (not a line inside
  a multi-line quoted or flow value). An HTML comment in the frontmatter is YAML text, not a
  directive. Comments on indented sub-keys and list items are not read (their findings anchor
  on the top-level key line anyway, DIR5).

Rationale: an HTML comment is invisible in rendered Markdown and is the convention of
markdownlint and Prettier; YAML has its own comment syntax, and most field findings anchor on
key lines, which can only hold a YAML comment. Single-line comments keep the parse
line-based and simple. The comment lexing lives in the grammar (`grammar/*.g4`, A58), like
every other token of the linter (AGENTS.md, no tag regex outside the grammar).

DIR4. Not read:

- in a template (body or frontmatter): a template is the schema and is never suppressed;
  such a comment is inert prose there, with no warning, and is not shown by `--verify`;
- inside a fenced code block (the fences of 2.6, the lexer fence modes);
- inside an inline code span: a `<!--` that lies between a pair of equal backtick runs on the
  same line;
- after a target parse failure (`MTL001` to `MTL004`): the file is not linted (4.1 step 1).

Known limitation, accepted: indented code blocks (four spaces) are not detected, as for
headings (2.6). Directive comments stay part of the section body text, so a directive line
counts as a non-blank line for `MTL701`, `MTL704` and `MTL705`. Put a directive about a
section on its heading line to keep the body unchanged. Rationale: the body text is the
legacy contract (2.6, HTML comments are prose); stripping comments would change content
results for files without directives.

Line numbers: 1-based physical lines of the whole file after line-ending normalization (1.1),
line 1 is the opening `---`. The same numbering as field and heading lines.

#### Anchors and the coverage rule (DIR5, DIR6, DIR7)

DIR5. Anchor line. The engine gives each target diagnostic an anchor: one target line, or
none. The anchor is internal (a side table, like the item and section sort keys of the
pipeline); its number is not printed on its own and does not change `line` in JSON, so for a
target without directives the diagnostic set stays identical (JSON differs only by the
always present `summary.suppressed` key, 8.5). The text formats quote the anchored line
below the diagnostic (source line, 8.1; excerpt, 8.2), which is the one intended change of
the text output (change C09).

| Codes                                                            | Anchor                                                                    |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `MTL101`                                                         | none (the file name)                                                      |
| `MTL201`                                                         | the target key line when the key is present with an empty value; none when the key is missing |
| `MTL202`                                                         | the target key line                                                       |
| field steps: `MTL102`, `MTL301`-`MTL305`, `MTL401`-`MTL407`, `MTL501`-`MTL517`, `MTL801`-`MTL805` | the target key line of that field                                         |
| `MTL601`, `MTL602`, `MTL604`                                     | none (missing heading, order of the whole file)                           |
| `MTL603`                                                         | the line of the first target heading with that text (the one that fired)   |
| `MTL701`-`MTL705`                                                | the line of the target heading whose section was checked (the first occurrence, 2.6) |

A key line is the line of the key itself (for a duplicate key, the last occurrence, Q06),
never the lines of a multi-line value. Rationale: the key line is what the user sees as the
field, and it is already known to the engine (`Field.line`).

DIR6. Suppressible codes: the file diagnostics of a parsed target, `MTL101` to `MTL899`
(categories filename, presence, format, bounds, type, heading, content, io). NOT
suppressible, and named in a directive they give `MTL022`:

- `MTL001` to `MTL004`, on a target or a template: a file that does not parse is not linted
  and its directives are not read; a broken template is never suppressed;
- `MTL010` to `MTL013`: template tag warnings; they are never emitted for a target (tags in a
  target are inert, 2.7), and the template cannot carry directives (DIR4);
- `MTL020` to `MTL025`: directive warnings; a directive cannot silence its own diagnostics;
- `MTL900` to `MTL999`: run diagnostics; they belong to the run, not to a file line.

Rationale: only findings about the content of one target are local to that file; the others
describe the template, the run or the directives themselves.

DIR7. Coverage rule. A suppressible diagnostic with code C is removed when:

- the target holds a valid `disable-file` for C, anywhere in the file (any carrier of
  DIR3, before or after the finding). This covers every diagnostic with code C, with or
  without anchor;
- or it has an anchor line A, and some line directive or range for C covers A (DIR1 table: a
  `disable-line` on A, a `disable-next-line` on A - 1, or a `disable` / `begin disable` range
  that starts at or before A and is not closed before A; the `end disable` line itself is
  covered).

A diagnostic without anchor (`MTL101`, `MTL201` for a missing key, `MTL601`, `MTL602`,
`MTL604`; DIR5) is covered ONLY by `disable-file`. `disable`, `begin disable`,
`disable-line` and `disable-next-line` never cover it, whether their range is closed or runs
to the end of the file. The match is by code only: a `disable-file MTL601` silences every
missing heading of the file, not one named heading.

Rationale: a finding without anchor (missing field, missing heading, heading order, file
name) concerns the whole file and has no line; any line-based rule (first lines, nearest
directive, a range that happens to stay open) would be arbitrary and easy to trigger by
accident. One explicit whole-file verb keeps the intent reviewable. Consequence, documented
in the README (A62): a missing key or a missing heading is silenced with
`disable-file <code>` (for example `<!-- md-template-lint disable-file MTL601 -->`
in the body or `# md-template-lint disable-file MTL201` in the frontmatter), never with
an open `disable`. Likewise, a body `disable MTL202` does not cover the frontmatter keys
(they come before its range); use `disable-file MTL202` or a frontmatter directive.

#### Range bookkeeping (DIR8)

DIR8. Directives are processed in source order (line, then column). Per code:

- `disable C` or `begin disable C` while C is not open: opens a range at this line.
- `disable C` or `begin disable C` while C is open: `MTL025`, no effect (the first range
  keeps its start). Rationale: no nested counting; one open range per code is easy to reason
  about.
- `end disable C` while C is open: closes the range at this line (inclusive).
- `end disable C` while C is not open: `MTL023`, no effect.
- End of file with C still open from `begin disable`: `MTL024`, emitted once per open code,
  ordered by the source position (line, then column) of the `begin disable`, and for several
  codes opened by one directive by the order of the codes in that directive, first to last;
  the range runs to the end of the file. Still
  open from `disable`: silent.
- `disable-line` and `disable-next-line` never open or close a range and never conflict with
  one (no `MTL025`).
- `disable-file C` never opens or closes a range: no `MTL023`, `MTL024` or `MTL025` for
  it, also when C is open or already named by another `disable-file` (repeating it is
  harmless, no warning). `disable C` after it opens a range as usual, and `end disable C`
  does not end its effect (with no open range for C, that `end disable` is `MTL023`).

Step 7 of 4.1 emits the directive diagnostics in directive order, `MTL024` last. A file that
is linted against two pairs is processed once per pair, so its directive warnings appear in
both blocks, like any other warning.

#### Counts, exit codes and reporters (DIR9)

DIR9. A suppressed diagnostic is removed before anything counts it:

- it is not printed (text, `--quiet`, JSON), not counted in `Warnings:` /
  `summary.warnings` or `filesWithWarnings`, and does not make a file fail: a file whose only
  errors are suppressed is `✓` and JSON status `pass`, and the exit code follows the rest
  (7.5);
- it is counted per pair-file lint in the text summary line `Suppressed:` (shown only when
  greater than 0, 8.2) and in JSON `summary.suppressed` (always present, 0 when none, 8.5);
- the directive warnings `MTL020` to `MTL025` are normal file warnings: printed, counted in
  `Warnings:`, hidden by `--quiet`, never in `Suppressed:`.

Rationale: the count keeps suppression visible in CI without listing what was hidden; listing
suppressed findings would need a new output section for little gain. JSON stays
`schemaVersion` 1 because the new key is additive.

#### Interactions (DIR10)

DIR10.

- Presence, value and content tags: no interaction. The rules still run in full; suppression
  only filters their output (4.1 step 8). Suppressing `MTL201` does not run the value checks
  of an empty field, and does not change the `MTL517` severity. A `disable-file MTL601`
  hides a missing heading but does not make it present: the order check (`MTL604`) still
  see it as absent.
- File-list mode (7.2): no difference. Directives belong to the target file, whatever pair or
  mode selected it.
- `--quiet` (7.1): suppressed diagnostics are never printed in any mode; `--quiet` prints no
  summary, so no `Suppressed:` line either.
- `--verify` (7.3): no target is read, so no directive is read; templates never carry
  directives (DIR4). Directives change nothing in verify output and exit codes (JSON only
  gains `summary.suppressed`, 0, 8.5); the excerpt rows of C09 are a separate change.

Rationale: suppression is a pure output filter on one target, so it composes with every tag,
mode and flag without special cases.

#### Worked examples

Template for the examples (fields `title`, `status` required; headings `# Notes`,
`## Overview [content:non-empty]`, `## Details [content:non-empty]`, `## Context`).

Example 1, `disable-line` and `disable-next-line` in the frontmatter and on a heading:

```markdown
---
title: Notes
status: draft
owner: alice # md-template-lint disable-line MTL202
# md-template-lint disable-next-line MTL202, MTL301
reviewer: bob
draft: yes
---

# Notes

## Overview <!-- md-template-lint disable-line MTL701 -->

## Details

## Context
```

- Line 4 `owner`: `MTL202` anchored on line 4, covered by its `disable-line`. Suppressed.
- Line 6 `reviewer`: `MTL202` anchored on line 6, covered by the `disable-next-line` of line 5
  (multi-code list; `MTL301` never fires here, which is fine). Suppressed.
- Line 7 `draft`: `MTL202` anchored on line 7, no directive. Reported (negative case).
- Line 12 `## Overview`: `MTL701` anchored on line 12, covered. Suppressed.
- Line 14 `## Details`: `MTL701` anchored on line 14, no directive. Reported (negative case).
- Negative variant: `# md-template-lint disable-line MTL202` alone on line 5 covers line 5
  only, so `reviewer` would be reported.
- Summary: `Suppressed:   3`.

Example 2, a `begin disable` / `end disable` block over several keys, with a multi-code list
(frontmatter only; the body is the one of example 1):

```markdown
---
title: Notes
status: draft
# md-template-lint begin disable MTL202, MTL301
legacy_id: 42
legacy_owner: alice
# md-template-lint end disable MTL202 MTL301
extra: x
---
```

- Range for `MTL202` and `MTL301`: lines 4 to 7. `legacy_id` (line 5) and `legacy_owner`
  (line 6): `MTL202` suppressed.
- `extra` (line 8): after the block, `MTL202` reported (negative case).
- Without line 7, both ranges run to the end of the file: `extra` is suppressed too, and two
  `MTL024` warnings are printed, `Directive on line 4: 'begin disable MTL202' is never
  closed, it runs to the end of the file` and the same for `MTL301`.

Example 3, `disable-file` and diagnostics without anchor (file `notes/draft.md`):

```markdown
---
title: Draft
---

<!-- md-template-lint disable-file MTL201, MTL601 -- filled in later -->

# Notes

## Overview

Text.
```

- `status` is missing: `MTL201` without anchor, covered by the `disable-file MTL201` of
  line 5. Suppressed.
- `## Details` and `## Context` are missing: two `MTL601` without anchor, covered by
  `disable-file MTL601`. Suppressed.
- Expected text output: the file passes, its block is `✓ notes/draft.md` with no diagnostic
  line, and the summary shows `Suppressed:   3`.
- The same result with the directive in the frontmatter, for example
  `# md-template-lint disable-file MTL201, MTL601` as line 2, or at the end of the file:
  the position does not matter.
- Negative variant: replace `disable-file` by `disable`. The range runs to the end of the
  file, but a range never covers a diagnostic without anchor, so all three are reported, no
  `Suppressed:` line:

```text
  ✗ notes/draft.md
      error MTL201 Field 'status': required but empty or missing
      error MTL601 Heading: Missing required heading: 'Details'
      error MTL601 Heading: Missing required heading: 'Context'
```

- Negative variant: `disable-file MTL201` only. The two `MTL601` are reported, the file
  fails, `Suppressed:   1`.

Example 4, `disable-file` on anchored diagnostics (file `notes/imported.md`):

```markdown
---
title: Notes
status: draft
legacy_id: 42
legacy_owner: alice
---

# Notes

## Overview

Text.

## Details

Text.

## Context

<!-- md-template-lint disable-file MTL202 -- imported keys -->
<!-- md-template-lint end disable MTL202 -->
```

- `legacy_id` (line 4) and `legacy_owner` (line 5): `MTL202` anchored on lines 4 and 5. The
  `disable-file MTL202` on line 20 comes after them but covers the whole document.
  Suppressed.
- Line 21: `end disable` does not end a `disable-file`, and no range for `MTL202` is open,
  so it gives `MTL023`; the two keys stay suppressed.
- Expected text output:

```text
  ✓ notes/imported.md
      warn  MTL023 Directive on line 21: 'end disable MTL202' has no open 'disable' or 'begin disable' for MTL202
        21 | <!-- md-template-lint end disable MTL202 -->
           | ^
```

  and the summary shows `Warnings:     1 (in 1 file(s))` and `Suppressed:   2`.
- Negative variant: replace `disable-file` by `disable` on line 20. Its range starts on
  line 20 (and ends on line 21), after both key lines, so the two `MTL202` are reported.

Example 5, ignored places and directive warnings:

````markdown
---
title: Notes
status: draft
---

```markdown
<!-- md-template-lint disable MTL601 -->
```

Inline code is prose: `<!-- md-template-lint disable MTL601 -->`.

<!-- md-template-lint disabel MTL601 -->
<!-- md-template-lint disable MTL2O1, MTL910 -->
<!-- md-template-lint end disable MTL202 -->
<!-- md-template-lint begin disable -->
````

- Lines 7 and 10: inside a fence and inside a code span. Not directives, no warning.
- Line 12: `MTL020` `Directive on line 12: unknown directive 'disabel' (expected disable,
  disable-line, disable-next-line, disable-file, begin disable or end disable)`.
- Line 13: `MTL021` `Directive on line 13: unknown rule code 'MTL2O1'` (letter O) and
  `MTL022` `Directive on line 13: rule code MTL910 cannot be disabled`. Both items are
  dropped, so the directive is inert (no range opens) and there is no extra `MTL020`.
- Line 14: `MTL023` `Directive on line 14: 'end disable MTL202' has no open 'disable' or
  'begin disable' for MTL202`.
- Line 15: `MTL020` `Directive on line 15: 'begin disable' needs at least one rule code`.
- The missing headings still give `MTL601`: no `disable-file MTL601` is read, and the
  `disable MTL601` lines would not cover them even if read (DIR7).
- Variant: `<!-- md-template-lint disable-file -->` added as line 16 gives `MTL020`
  `Directive on line 16: 'disable-file' needs at least one rule code`.

## 5. Defect decisions (D01 to D18)

Decisions are fix, keep or drop. Defect ids come from the phase A1 research (history note
`docs/research/wrapper-parity.md`) and are never renumbered.

| ID  | Defect (short)                                       | Decision | Reason and how                                                                                                                                                                      |
| --- | ---------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D01 | Wrappers ask for template names that do not exist; agent and skill pairs never linted, run exits 0 | fix | The wrappers are gone. The config names real files, and a missing template is always an error (`MTL910`, exit 2), never a silent skip. Migration: use the installed names (`agent.template.md`, `skill.template.md`). |
| D02 | Missing template, missing dir or empty file set is a warning; zero files still prints "All files passed!" with exit 0 | fix | Missing template: `MTL910`, exit 2. Missing root: `MTL909`, exit 2. Empty file set: `MTL913`, severity from `onEmpty` (default `warn`, config global or per pair, values `warn`, `error`, `ignore`; effects in 7.4). A run with zero files linted, no broken template and no run error prints `No files linted.` and never `All files passed!`; with a broken template or a run error the failure summary shows instead (8.2). In file-list mode (lint-staged) unmatched files are normal and silent. |
| D03 | Multi-project run order is random                    | fix      | Fixed order (8.4): roots in declaration order, pairs in config order, files sorted. Output is deterministic.                                                                         |
| D04 | Absolute path test misses `C:/x`; `~/` never expanded | fix     | One path resolver for config values: `~` and `~/` expand to the home directory; absolute means a drive letter with either slash, a leading `/` or `\`, or `~`; `\` is read as `/` in config paths and globs; relative paths resolve against the config directory (6.2). |
| D05 | One process per file, template re-parsed every time  | fix      | One process. Each distinct template is parsed once per run and cached by resolved path. Each target is read and parsed once per pair.                                                |
| D06 | `Warnings:` counts files with warnings               | fix      | Summary `Warnings:` counts warning diagnostics. Files with warnings are shown next to it: `Warnings:     7 (in 4 file(s))`. JSON has both counts.                                      |
| D07 | `--pattern` regex and recursive vs wrapper wildcard and optional recursion | fix | One dialect: globs in config (`include`, `exclude`), recursion explicit with `**`. The flags `--pattern`, `--dir`, `--ignore` are dropped. Regex `exclude` becomes a glob (6.5).    |
| D08 | Output shows file name only; same names collide      | fix      | Every printed and JSON path is relative to its root with `/` separators. Multi-root output also prints the root in the block header.                                                  |
| D09 | Usage error, missing input and lint failure all exit 1 | fix    | Exit 0 clean, 1 lint failure or broken template, 2 usage, config or missing-input error (7.5). `--help` and `--version` are exit 0 wherever they appear. No arguments is NOT an error: it lints the whole config. |
| D10 | Double error for one cause (bad regex or dir, then "no files matched") | fix | One cause, one diagnostic. An invalid glob is `MTL907` and that pair is not evaluated for an empty set. A missing root is `MTL909` and its pairs report nothing more.                 |
| D11 | `[io:exists]` relative paths depend on the working directory | fix | Resolved against the pair ROOT, never the working directory. `--base-dir` is dropped.                                                                                             |
| D12 | `approved_path.yml` is global, holds absolute machine paths | fix | Replaced by `aliases` and `approvedPaths` in the per-project config. Values may be relative to the config directory, or `~`. The legacy file is not read. Invalid entries are config errors (`MTL904`) instead of silent warnings. |
| D13 | Wrappers need a fixed global skill folder, `python`, Windows paths | fix | Installed from npm (Node >=22.18). No fixed location, no wrapper, no `python`. Config paths are relative, `~` based or absolute; separators are normalized.                          |
| D14 | Multi-project wrapper aborts on the first missing root, no partial run | fix | A missing root is `MTL909` for that root only. Other roots are still linted. Exit code is 2 at the end. Nothing is lost silently.                                                  |
| D15 | Mixed `/` and `\` in printed lines                   | fix      | Every printed path (text and JSON, including inside `MTL80x` messages) uses `/` on every OS.                                                                                        |
| D16 | Broken template detected by matching the linter output text | fix | No text matching. The engine returns a structured template status (`ok` or `broken`, with the `MTL001` to `MTL004` diagnostic; an unreadable or non-UTF-8 template is broken too, as in legacy py L2606-2611). Text output is rendered from it. JSON carries it.   |
| D17 | Prompt sidecar data fails the prompt template (data drift) | drop | Not a tool defect. The port reports such failures as normal lint errors. Any fixture note belongs in the parity report, not in the tool.                                          |
| D18 | Python `Error:` lines print OS-specific paths        | fix      | Same as D15: forward slashes everywhere. Parity checks compare after normalizing separators.                                                                                         |

## 6. Configuration: `md-template-lint.yml`

One config file per project replaces the wrapper scripts and `approved_path.yml`. It is
YAML, parsed with the `yaml` library and validated strictly: unknown keys are errors.

### 6.1 Discovery

- `--config <path>`: use that file. Missing: `MTL901`.
- Otherwise search for `md-template-lint.yml` in the current directory, then each parent up to
  the file system root. First match wins. None found: `MTL901` (except `--verify` with explicit
  template paths, which needs no config).
- The config directory (the folder holding the file) is the implicit root `project`.

### 6.2 Path values

Every path in the config (roots, aliases, approved paths, templates) follows one resolver:

1. `~` or `~/...` expands to the home directory.
2. A drive letter followed by `/` or `\`, a leading `/` or `\` is absolute.
3. Otherwise relative to the config directory.
4. `\` is read as `/`. Printed paths always use `/`.
5. The result is not required to exist at validation time (existence is checked at run time:
   `MTL909`, `MTL910`, `MTL911`).

### 6.3 Schema

```yaml
version: 1 # optional, only 1 is valid
onEmpty: warn # optional, warn | error | ignore (default warn)

roots: # optional, extra roots (multi-root, external roots)
  shared: ../shared-templates
  notes: ~/notes # external root, outside the project

aliases: # optional, alias name -> directory, for @name/ values with [io:exists]
  assets: ./assets

approvedPaths: # optional, directories where absolute values may be probed
  - ~/notes

allowPrivateNetworks: false # optional, default false; lets [io:exists] URL probes reach private ranges

pairs: # required, at least one
  - name: adr # optional label, unique
    template: docs/templates/adr.template.md # required
    templateRoot: project # optional, default project
    roots: project # optional, name, list of names, or "*"; default project
    include: docs/adr/*.md # required, glob or list of globs
    exclude: "**/README.md" # optional, glob or list of globs
    description: architecture decision records # optional
    onEmpty: warn # optional, overrides the global value
```

| Key                       | Type                          | Required | Default   | Rules                                                                                                       |
| ------------------------- | ----------------------------- | -------- | --------- | ----------------------------------------------------------------------------------------------------------- |
| `version`                 | integer                       | no       | `1`       | Must be `1`, else `MTL908`.                                                                                  |
| `onEmpty`                 | `warn`, `error`, `ignore`     | no       | `warn`    | Policy when a pair matches no file (7.4).                                                                   |
| `roots`                   | map name to path              | no       | empty     | Names match `^[A-Za-z0-9_-]+$`. `project` is reserved (`MTL905`). Order is kept (it fixes output order).    |
| `aliases`                 | map name to path              | no       | empty     | Names as above. The name is written WITHOUT `@` (changed: legacy stripped a leading `@`, the port rejects it with `MTL905`). Value is a non-empty string, else `MTL904`.         |
| `approvedPaths`           | list of path                  | no       | empty     | Non-empty strings. An absolute value in a document is probed only inside one of these folders.             |
| `allowPrivateNetworks`    | boolean                       | no       | `false`   | When `true`, URL probes of `[io:exists]` may reach RFC 1918, 100.64.0.0/10 and fc00::/7 addresses. Loopback, link-local, cloud metadata and IPv4-mapped IPv6 stay blocked (AS8). Other types are `MTL904`. |
| `pairs`                   | list of pair                  | yes      | none      | Non-empty list, else `MTL904`.                                                                              |
| `pairs[].name`            | string                        | no       | generated (below) | Explicit names match `^[A-Za-z0-9_.-]+$` and are unique, else `MTL905`.                              |
| `pairs[].template`        | path                          | yes      | none      | Resolved by 6.2, but a relative path is relative to `templateRoot`.                                         |
| `pairs[].templateRoot`    | root name                     | no       | `project` | Must be `project` or a declared root (`MTL906`).                                                            |
| `pairs[].roots`           | root name, list, or `"*"`     | no       | `project` | Each name is `project` or declared (`MTL906`). `"*"` means every root declared under `roots` (not `project`); `"*"` with no declared root is `MTL904`. A pair runs once per listed root. |
| `pairs[].include`         | glob or list of globs         | yes      | none      | Non-empty. Each glob per 6.4, else `MTL907`.                                                                |
| `pairs[].exclude`         | glob or list of globs         | no       | empty     | Same glob rules. A file is a target when it matches an include and no exclude.                              |
| `pairs[].description`     | string                        | no       | none      | Shown in the `Target:` line.                                                                                |
| `pairs[].onEmpty`         | `warn`, `error`, `ignore`     | no       | global    | Overrides the global value for this pair.                                                                   |

Default pair name: after all explicit names are read, each unnamed pair, in config order,
gets the file name of its `template` without the last extension (`adr.template.md` gives
`adr.template`), with every character outside `[A-Za-z0-9_.-]` replaced by `-`; an empty
result becomes `pair`. If that name is already taken (an explicit name or an earlier
generated one), `-2`, `-3`, and so on is appended until it is free. A generated name never
raises `MTL905`; only two explicit names that are equal do. The name appears in messages
(`pair '<name>'`) and in JSON.

### 6.4 Globs

- Matched against the file path relative to the root, with `/` separators, case-sensitive,
  on every OS.
- `*` any characters except `/`. `?` one character except `/`. `**` as a whole path segment
  matches zero or more segments (so `a/**/*.md` matches `a/x.md`). `[abc]` a class.
  `{a,b}` alternation. A leading `.` is matched like any character (dot files and folders are
  included).
- Invalid globs: empty string, absolute (`/` first or a drive letter), containing `..`,
  starting with `!` (use `exclude`), unbalanced `[`, `{` or `}`, a character class with a reversed
  range (`[z-a]`, detail `invalid character class`). Error `MTL907`.
- Symlinked directories are not traversed. Only files are targets.

### 6.5 Multi-root, external root and migration

A root is a folder where pairs run. The implicit root `project` is the config directory. A
root outside the config directory is an EXTERNAL root (sibling repository, data folder).
`pairs[].roots` makes one pair run on several roots (multi-root).

External root, templates kept in the project (replaces the external-repo wrapper):

```yaml
roots:
  data: ~/data/prompts
pairs:
  - template: templates/prompt.template.md
    roots: data
    include: _prompts/*.md
```

Multi-root with shared templates (replaces the multi-project wrapper):

```yaml
roots:
  shared: ../shared-templates # holds the templates only
  app-a: ../app-a
  app-b: ../app-b
pairs:
  - name: agents
    template: agent.template.md
    templateRoot: shared
    roots: [app-a, app-b]
    include: .opencode/agents/*.md
  - name: skills
    template: skill.template.md
    templateRoot: shared
    roots: [app-a, app-b]
    include: .opencode/skills/**/*SKILL.md
```

`roots: "*"` would also run on `shared`, so a root used only for templates is listed by name
in `pairs[].roots` instead. The order inside `pairs[].roots` does not change the output
order (8.4).

Conversion of a legacy pair (`ps` keys to config keys):

| Legacy key                         | Config                                                                 |
| ---------------------------------- | ---------------------------------------------------------------------- |
| `template`                         | `template` (+ `templateRoot` when it was global)                       |
| `targetDir` and `pattern`          | `include: <targetDir>/<pattern>` (default pattern `*.md`)              |
| `Recurse = true`                   | `**` between folder and pattern: `<targetDir>/**/<pattern>`            |
| `Exclude` (regex on the file name) | `exclude`, as a glob: `^README\.md$` becomes `**/README.md`            |
| `description`                      | `description`                                                          |
| repo root of the wrapper           | the config directory (or a `roots` entry)                              |
| `approved_path.yml` entries        | `aliases`                                                              |

### 6.6 Validation errors

Errors are collected (not first-fail) and printed together, sorted by key path in config
order. Any config error stops the run before linting (exit 2). Root and template file
errors are run-time errors (exit 2 at the end) and do not stop other roots or pairs: `MTL909`
(root directory missing), `MTL910` (template path missing) and `MTL911` (template path exists
but is not a regular file). A template that is a regular file but cannot be read or parsed is
not a run error: it is a broken template (`MTL001` to `MTL004`, exit 1).

| Case                                             | Code     | Example message                                                       |
| ------------------------------------------------ | -------- | --------------------------------------------------------------------- |
| YAML syntax error, empty file, root not a map, duplicate key, non-UTF-8 input, multi-document file, read failure | `MTL902` | `cannot parse md-template-lint.yml: <detail>` |
| Unknown key at any level                         | `MTL903` | `pairs[0].inlcude: unknown key 'inlcude'`                             |
| Wrong type, missing required key, bad enum value | `MTL904` | `pairs[1].include: expected string or list of strings, got number`    |
| Bad name, reserved `project`, duplicate pair name | `MTL905` | `roots.project: invalid name 'project' (reserved)`                    |
| Pair references an undeclared root               | `MTL906` | `pairs[0].roots: root 'app-c' is not declared`                        |
| Bad glob                                         | `MTL907` | `pairs[0].include[1]: invalid glob '../x': contains '..'`             |
| Bad `version`                                    | `MTL908` | `unsupported config version 2`                                        |

## 7. CLI

### 7.1 Synopsis

```text
md-template-lint [options] [files...]
md-template-lint --verify [options] [templates...]
```

| Flag              | Meaning                                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| `--config <path>` | Config file. Also `--config=<path>`. Default: discovery (6.1).                                              |
| `--format <name>` | `text` (default, same as `pretty`), `plain` or `json` (8.2). Other value: `MTL922`.                                |
| `--quiet`         | Text only: print only failing files, broken templates and run errors. No headers, no OK lines, no warnings, no summary. JSON is always complete. |
| `--verify`        | Template-syntax check only. No target is read (7.3).                                                        |
| `--version`       | Print the package version and exit 0.                                                                       |
| `--help`, `-h`    | Print usage and exit 0.                                                                                     |

`--help` and `--version` win over everything else on the command line. `--` ends options.
An unknown flag is `MTL920`, a missing argument `MTL921`, exit 2, followed by the usage hint.
A flag that takes a value (`--config`, `--format`) is missing its argument only when it is last or
when the next argument starts with `--`; `--config -x` takes `-x` as the path.
The legacy flags `--pattern`, `--dir`, `--ignore`, `--base-dir` do not exist (D07, D11).

### 7.2 Modes

1. Full run (`md-template-lint`): load the config, run every pair on every root it names.
2. File-list mode (`md-template-lint a.md b.md`, the lint-staged mode): each argument is a file
   path relative to the working directory, or absolute (either slash). For each root and pair,
   the file is a target when its path relative to the root matches an include and no exclude.
   A file matching no pair is ignored silently (lint-staged passes every staged `.md`). A file
   matching several pairs is linted once per pair. A file that matches a pair but does not exist
   is `MTL912` (a missing file matching no pair is ignored like any other; the other files are
   still linted, change C01). Output order follows 8.4, not the argument
   order. Disable directives (4.4) apply the same in both modes: they belong to the target
   file, not to the mode or the pair.

lint-staged config:

```json
{
  "lint-staged": {
    "*.md": "md-template-lint --quiet"
  }
}
```

### 7.3 `--verify`

- `md-template-lint --verify`: every distinct template of the config (in pair order).
  Needs a config.
- `md-template-lint --verify path/to/a.md path/to/b.md`: those files are the templates.
  No config needed.
- Each template is parsed and its schema printed (field, inferred type, rules, headings,
  unknown and malformed tags). No target file is read, no `[io:exists]` check runs, no
  network access.
- Exit 0 when every template parses (warnings `MTL010` to `MTL013` do not fail). A template
  that does not parse or cannot be read (`MTL001` to `MTL004`, including a file that is not
  UTF-8) is broken: exit 1, as in legacy. A template path that does not exist is `MTL910` and
  one that is not a regular file is `MTL911`: exit 2 (checks in 4.3, "Template file checks").
  No config and no template path: `MTL923`.
- Disable directives (4.4) play no role: no target is read, and a directive-like comment in a
  template is inert prose (not listed, no warning, no effect on the exit code).

### 7.4 Empty target sets

A pair-root combination that matches no file (full run only) raises `MTL913` according to
`onEmpty`. The message is always `no files matched pair '{name}' in root '{root}'` (change
C03). It is a run-level diagnostic, never a file diagnostic.

| `onEmpty` | Severity | Text output                                   | Counts                                                  | JSON                              | Exit |
| --------- | -------- | --------------------------------------------- | ------------------------------------------------------- | --------------------------------- | ---- |
| `warn`    | warning  | stdout line `ℹ MTL913 <message>`              | `Run warnings:` and `summary.runWarnings` +1. NOT in `Warnings:` / `summary.warnings` (those count file diagnostics only), NOT in `Run errors:` / `summary.runErrors` | `runWarnings` array, not `runErrors` | 0    |
| `error`   | error    | stderr line `error MTL913: <message>`         | `Run errors:` and `summary.runErrors` +1                | `runErrors` array                 | 2    |
| `ignore`  | none     | nothing                                       | nothing                                                 | nothing                           | 0    |

Closing line, one rule (also in 8.2): when the whole run lints zero files AND there is no
broken template AND no error-severity run diagnostic, the summary prints `No files linted.`
instead of `All files passed!`. Run warnings (`MTL913` with `warn`) do not change this. With
zero files and a broken template or a run error, the failure summary shows (`Broken
templates:`, `Run errors:`) and `No files linted.` is not printed.

### 7.5 Exit codes

| Code | Meaning                                                                                                    |
| ---- | ---------------------------------------------------------------------------------------------------------- |
| 0    | No file with errors, no broken template, no run error. Warnings may exist. Also `--help`, `--version`.     |
| 1    | At least one target has an error, or a template is broken, and there is no run error.                      |
| 2    | A run error occurred (usage, config, missing root, template or file). Takes precedence over 1.             |

The engine keeps going after a run error when the remaining work is independent (D14), and
reports exit 2 at the end. A usage or config validation error stops before any lint.

Suppressed diagnostics (4.4) are removed before the exit code is computed: a target whose
only errors are suppressed counts as passed (exit 0 when nothing else fails). The directive
warnings `MTL020` to `MTL025` never change the exit code. Run diagnostics (`MTL9xx`) are never
suppressible, so exit 2 is never hidden.

## 8. Output

### 8.1 Diagnostic

Every finding is `{ code, severity, message }`, plus optional `heading`, `line`, `column`
(1-based, only where known, for example tag errors) and, in JSON only, `sourceLine` (the
source line, below and 8.5). `heading` is set for heading and content
findings (MTL601-603, MTL701-705; MTL604 has no anchor and gets no heading). A `field` member is NOT emitted (change C07). `message` is the legacy text
without the code. Comparisons with the legacy output use `(path, severity, code, message)` after normalizing
separators (D18). The directive warnings `MTL020` to `MTL025` carry `line` and `column` of
the directive in the target (4.4). The anchor line used for suppression (4.4, DIR5) is
internal: its number is never emitted as `line` (it can be quoted in the text output, see
the source line below). A suppressed diagnostic is never emitted at all.

Source line (change C09, AS14). A diagnostic may have a source line: the line of its own
source file that causes it, shown by the reporters as an excerpt (8.2, 8.3, 8.5). It is
resolved once per diagnostic, by the runner, in this order:

1. the `line` of its `position`, when it has one;
2. else its anchor line (4.4, DIR5), when it has one;
3. else none.

The source file is the file the diagnostic belongs to: the TARGET file for a target
diagnostic (the field, filename, heading, content and directive codes), the TEMPLATE file for
a template-phase diagnostic (`MTL010` to `MTL013`, shown by `--verify`, 8.3). `MTL001` to
`MTL004` (no position, no anchor) and the run diagnostics `MTL9xx` have no source line. A line
number outside the file (below 1 or above its line count) gives no source line. Line numbers
and text follow the line-ending normalization of 1.1: CRLF and a lone CR are line ends, a
leading BOM is dropped, so a `\r` never appears in a source line and `line` and `column` agree
with the text shown. The runner reuses the text it already read to lint the file; no file is
read again. What the runner keeps while matching, and what stays on a diagnostic, is bounded
(8.2, EX8).

Rationale for step 2: most findings concern one key or heading and have no column, so a
position-only excerpt would show almost nothing (in a lint run only `MTL020` to `MTL025` have
a position). The anchor is already known, cheap (a table lookup) and unambiguous (DIR5 gives
one target line per code, or none), and it is the line a user must edit: the key line of a
field, the heading line of a section. A diagnostic about the whole file (`MTL101`, a missing
key, `MTL601`, `MTL602`, `MTL604`) has no anchor and no excerpt: showing line 1 or the
first heading would point at a line that did not cause it.

### 8.2 Text format

Modelled on the wrapper layout. Glyphs are UTF-8: `✓` pass, `✗` fail, `⚠` problem, `ℹ` note.
Color only on a terminal, disabled by `NO_COLOR`. Run errors go to stderr as
`error MTLnnn: <message>`, with a ` (file:line:col)` suffix for config errors; everything
else to stdout.

Two renderings exist (change C07): `pretty` is the layout below with glyphs and optional
color; `plain` is the same layout with ASCII words `PASS`, `FAIL`, `INFO` instead of glyphs
and never colored. The CLI format `text` maps to `pretty`. Control characters,
bidi controls and invisible format characters in echoed document values are replaced by
visible escapes in every format (the set is listed in EX3). `Templates:` counts distinct
template paths. A failed file of a non-project root is listed as `path (root 'name')`.
A pair with no files raises `MTL913` before its template is parsed, so a broken template
of an empty pair is not reported.

```text
md-template-lint 1.0.0
Config: md-template-lint.yml
========================

Template: docs/templates/adr.template.md
Target:   docs/adr/*.md (3 file(s)) - architecture decision records

  ✓ docs/adr/0001-first.md
  ✗ docs/adr/0002-second.md
      error MTL201 Field 'status': required but empty or missing
        3 | status:
      error MTL601 Heading: Missing required heading: 'Context'
      warn  MTL202 Unknown key 'authors' not present in template
        4 | authors: bob
  ✓ docs/adr/0003-third.md
      warn  MTL202 Unknown key 'reviewer' not present in template
        4 | reviewer: alice

Template: templates/x.md
Target:   notes/*.md (2 file(s))

  TEMPLATE ERROR: templates/x.md - YAML parse error: ...

ℹ MTL913 no files matched pair 'bugs' in root 'project'

========================
Summary
========================
Total files:  3
Passed:       2
Failed:       1
Warnings:     2 (in 2 file(s))
Templates:    2 checked, 1 broken
Run warnings: 1

Broken templates:
  - templates/x.md - YAML parse error: ...

Failed files:
  - docs/adr/0002-second.md

========================
```

This sample is exit code 1. The two files of the broken-template pair are not linted and not
counted in `Total files`. The empty pair `bugs` is not counted in `Templates` (legacy
counted a template only when its pair had files).

Rules:

- Header: package name and version, then `Config:` with the config path (relative to the
  working directory when inside it, absolute otherwise, `/` separators).
- One block per root-pair combination that has files (or a note). When the root is not
  `project`, a line `Root:     <name>` follows `Template:`. The `Target:` line lists the
  include globs joined by `, `, the file count and the description.
- Per file: `✓ <path>` or `✗ <path>`, then one indented line per diagnostic, each followed by its excerpt rows when it has any (EX1): `error` lines
  first, then `warn` lines, each list in emission order (4.1). A passing file shows its
  warnings.
- Broken template: one `TEMPLATE ERROR: <template> - <message>` line under its
  `Template:` and `Target:` lines. The files of that pair are not linted and not counted.
  The legacy extra line `(skipping remaining N target file(s) for this template)` is dropped
  (change C02). The template is counted once in `checked` and once in `broken`, and is listed
  under `Broken templates:`.
- `Run errors:` and `Run warnings:` are shown only when greater than 0 (never as `0`).
  `Broken templates:` and `Failed files:` lists appear only when non-empty, in that order.
  The line `All files passed!` appears only when there is no failed file, no broken template,
  no run error and at least one file was linted (run warnings do not prevent it).
  `No files linted.` replaces it only when zero files were linted, there is no broken
  template and no error-severity run diagnostic (same single rule as 7.4); otherwise the
  failure summary shows and `No files linted.` is not printed.
- A `MTL913` line is printed where the pair would have been (`ℹ MTL913 <message>` on stdout
  for `warn`). Its counting rules are in 7.4.
- `Total files` counts pair-file lints (a file in two pairs counts twice, as in the wrapper).
- `Suppressed:` (4.4, DIR9) follows `Warnings:` and counts the diagnostics removed by
  disable directives, per pair-file lint, for example `Suppressed:   3`. It is shown only when
  greater than 0 (never as `0`), so the sample above has none. Suppressed diagnostics are
  never printed and never count in `Warnings:`, `Failed` or `Failed files:`.
- `--quiet` prints only the `✗` lines with their `error` lines (and the excerpts of those
  lines, see below), `TEMPLATE ERROR` lines and run errors. Nothing when clean.

#### Source excerpt (change C09, AS14)

Rows added under a diagnostic line, in `pretty` and `plain` alike:

- EX1. Which. A diagnostic with a source line (8.1) is followed by its excerpt. One without
  prints no extra row, so a file whose diagnostics all lack a source line (a missing key, a
  missing heading, a file name, a parse failure) prints exactly as before. Excerpts follow the
  order of their diagnostics (errors first, then warnings, 8.4).
- EX2. Layout. The gutter row is 8 spaces, the 1-based line number (no padding, no
  alignment with other excerpts), ` | `, then the text. When the diagnostic has a `column`, a
  caret row follows: 8 spaces, as many spaces as the line number has digits, ` | `, spaces up
  to the offending character, `^`. An empty text prints the gutter row as `<n> |` with
  nothing after the bar.
- EX3. Text. Each character of the line is shown as follows, one output character per source
  character unless escaped: a whitespace control (tab, VT, FF, NEL, U+2028, U+2029) becomes
  one space; every other control, DEL, bidi control, U+FEFF and invisible format character
  is the escape of `cleanText` (`\x1b`, `\u202e`, and `\u{e0001}` above U+FFFF); anything
  else is unchanged. The invisible format characters are U+00AD, U+180E, U+200B to U+200D,
  U+2060 to U+2064, U+FFF9 to U+FFFB and U+E0000 to U+E007F; with U+061C, U+200E, U+200F,
  U+202A to U+202E, U+2066 to U+2069 and U+FEFF they are the whole escaped set above C0, C1
  and DEL (the same set escapes echoed values in every message, heading and path, 8). Unlike
  `cleanText`, runs of whitespace are NOT collapsed, so the caret stays under its character. Leading and trailing whitespace is
  kept. A tab is one space (not a tab stop), so the excerpt never depends on the terminal.
  CRLF never shows: the line comes from the normalized text (8.1), so a file with CRLF line
  ends gives the same excerpt as one with LF.
- EX4. Caret. `column` is 1-based and counts characters (Unicode code points), as the
  parser reports it. The caret is under the character at that column; the offset is the width
  of the shown text before it (an escape counts its full width). A column past the end of the
  line puts the caret just after the last character; a column below 1 is read as 1. (A column
  past the end is not produced by any rule today; if it were, the caret index is clamped to
  the line length and the window of EX5 follows that index, so on a line of exactly 100
  characters it may still slide.)
- EX5. Width. At most 100 characters of the line are shown. A longer line is cut: the shown
  window is the first 100 characters followed by `...`. When the diagnostic has a column in
  the part that would be cut (column above 100), the window instead starts 40 characters
  before the offending character (it then shows up to 59 characters after it, fewer when the
  line ends sooner), is preceded by `...`, and is followed by `...` when characters remain
  after it. The caret offset includes the 3 characters of a leading `...`. The ellipsis is the
  ASCII `...` in every format. The width counts source characters, before escaping.
- EX6. Color. In `pretty` with color, the excerpt rows (gutter and caret) are gray (SGR 90) and
  the rest of the output is unchanged; `plain` and no-color output carry no escape code.
- EX7. `--quiet` hides an excerpt exactly when it hides its diagnostic (warnings are hidden,
  so are their excerpts). The summary, counts and exit code never depend on excerpts.
- EX8. Cost and memory. Building the excerpts of a file costs one normalize-and-split pass
  over the file text (the lines of 8.1), one pass over each source line that has a diagnostic,
  however many diagnostics it has, plus a constant (at most 100
  characters, EX5) per diagnostic: 2000 diagnostics on one line of 1 MB cost a few passes,
  not 2000. What stays on a diagnostic is at most two strings of 100 characters (the shown
  window, and for the JSON `sourceLine` the first 100 characters) and a few numbers; each
  string is a copy that owns its characters, so a diagnostic never keeps the line, nor the
  file text, alive. The prepared lines live only while the diagnostics of one file are
  matched. In a lint run the template text is not retained after it is parsed (no template
  line is ever quoted in lint mode); `--verify` holds a template text only until its tag
  warnings have their excerpts. A source line is therefore never held per diagnostic, and a
  report of N diagnostics holds O(N x 100) characters of source, not O(N x line length).
- EX9. Echo. An excerpt echoes the content of the linted file, including frontmatter values
  such as tokens, e-mail addresses or paths, into the terminal and into CI logs and JSON
  artifacts, as the messages already do for the values they name. Escaping (EX3) keeps it
  from acting on the terminal, not from being read. A project that must not print its
  content should not write it into lines that lint messages can quote.

Example (a caret row exists only for a diagnostic with a column: in a lint run
`MTL020` to `MTL025`):

```text
  ✗ docs/adr/0004-fourth.md
      error MTL201 Field 'status': required but empty or missing
        3 | status:
      warn  MTL021 Directive on line 9: unknown rule code 'MTL999'
        9 | <!-- md-template-lint disable-line MTL999 -->
          | ^
```

Rationale: the message says what is wrong, the excerpt says where, so a reader no longer
opens the file to find the line. The rows are indented under the diagnostic (EX2) and start
with a line number, so they cannot be mistaken for a diagnostic line (`error`/`warn`), a
file line (`✓`/`✗`) or a summary line. One format for text and the rule that the text comes
from the normalized document (8.1) keep the caret and `line:column` consistent. Sanitising
(EX3) is mandatory for the same reason as in 8: a document line may hold an escape sequence.
Windowing (EX5) keeps the caret visible without printing a minified line in full.

### 8.3 Verify text output

The legacy `--verify` table, for each template:

```text
Filename: [filename:case:snake_case]

Field   Type    Rules
-----------------------------------------------------------
id      string  presence:required, value:filename
status  enum    presence:required, enum:draft|accepted

Headings:
  # ADR (presence:required)
  ## Context (presence:required, content:non-empty)

Unknown tags found (typo or unimplemented feature):
  - Field 'owner': unknown tag [optionl]
      7 | owner: string # [optionl]
        |                 ^
```

- The `Filename:` line only when the template declares it. Columns are padded to the widest
  name and type, the rule line is a run of `-` of the header length.
- Rule order per field: presence, constant, case, elements case, value-filename, count min,
  count max, range min, range max, order, scheme (sorted), io, enum options. `-` when none.
- Headings print as `  <#s> <text> (<rules>)`, presence first, then content rules.
- The unknown tags section lists fields first, then headings. Malformed tags (`MTL012`) are
  listed in a section `Malformed tags:` with line and column. Misplaced tags (`MTL013`) are
  listed in a section `Misplaced tags:` with line and column.
- A broken template prints `TEMPLATE ERROR: <template> - <message>` instead of its table.
- Source excerpt (change C09, AS14). Every item of the three sections above is followed by
  the excerpt of its TEMPLATE line (the tag warnings `MTL010` to `MTL013` all carry line and
  column), with the rules EX2 to EX6 of 8.2 except that the rows are indented 6 spaces
  instead of 8 (the item text starts at column 5, the excerpt sits 2 columns to the right of
  it, as in 8.2). The caret is under the character the `column` names (for a malformed tag,
  the bad part). An item whose line does not exist has no excerpt. Example:

  ```text
  Malformed tags:
    - Field 'tags': malformed tag [count:min:abc] (line 2, column 26)
        2 | tags: ["a"] # [count:min:abc]
          |                          ^
  ```
- `--quiet` hides the table and shows only broken templates and run errors; the sections, and
  so the excerpts, are hidden with the table.

### 8.4 Ordering

Everything is deterministic:

1. Roots: `project` first (when a pair uses it), then the `roots` map in declaration order.
2. Within a root: pairs in config order.
3. Within a pair-root: files sorted by root-relative path, plain code-unit order, `/`
   separators, case-sensitive, locale independent.
4. Within a file: errors, then warnings, each in emission order (4.1).
5. `--verify`: templates in config pair order, deduplicated by resolved path.

### 8.5 JSON format

`--format json` prints one JSON document to stdout and nothing else (run errors are inside
it, nothing goes to stderr). Keys are stable, arrays follow 8.4.

```json
{
  "schemaVersion": 1,
  "tool": "md-template-lint",
  "version": "1.0.0",
  "mode": "lint",
  "config": "md-template-lint.yml",
  "results": [
    {
      "root": "project",
      "pair": "adr",
      "template": { "path": "docs/templates/adr.template.md", "status": "ok" },
      "files": [
        {
          "path": "docs/adr/0002-second.md",
          "status": "fail",
          "errors": [
            { "code": "MTL201", "severity": "error", "message": "Field 'status': required but empty or missing" },
            { "code": "MTL601", "severity": "error", "message": "Heading: Missing required heading: 'Context'", "heading": "Context" }
          ],
          "warnings": [
            { "code": "MTL202", "severity": "warning", "message": "Unknown key 'authors' not present in template" }
          ]
        }
      ]
    },
    {
      "root": "project",
      "pair": "x",
      "template": {
        "path": "templates/x.md",
        "status": "broken",
        "error": { "code": "MTL002", "severity": "error", "message": "YAML parse error: ..." }
      },
      "files": []
    }
  ],
  "runErrors": [],
  "runWarnings": [
    { "code": "MTL913", "severity": "warning", "message": "no files matched pair 'bugs' in root 'project'", "pair": "bugs", "root": "project" }
  ],
  "unmatched": [],
  "summary": {
    "files": 3,
    "passed": 2,
    "failed": 1,
    "warnings": 2,
    "filesWithWarnings": 2,
    "suppressed": 0,
    "templatesChecked": 2,
    "templatesBroken": 1,
    "runErrors": 0,
    "runWarnings": 1,
    "exitCode": 1
  }
}
```

The `files` array of the first pair is shortened to the failing file (its two diagnostics
lists are complete), so the counts above also include the two passing files of the text
sample.

- `mode` is `lint` or `verify`. In verify mode `results` is replaced by `templates`: for each
  template `{ path, status, filenameCase, fields: [{ name, type, rules }], headings: [{ level, text, rules }], diagnostics }`.
- `template.status` is `ok` or `broken`; a broken template carries `error` (a diagnostic) and
  an empty `files` array.
- `unmatched` lists the file-list arguments that matched no pair (paths as normalized
  strings). It is empty in a full run.
- `runErrors` holds the error-severity `MTL9xx` diagnostics with their `pair` or `root` when
  known. `runWarnings` holds the warning-severity ones (today only `MTL913` with
  `onEmpty: warn`). `summary.runErrors` and `summary.runWarnings` are the lengths of these two
  arrays. Neither is added to `summary.warnings`, which counts file diagnostics only (D06).
  Both arrays are always present, empty when there is nothing.
- `summary.exitCode` equals the process exit code.
- `summary.suppressed` counts the diagnostics removed by disable directives (4.4, DIR9), per
  pair-file lint. Always present, 0 when none. Suppressed diagnostics are not in any
  `errors` or `warnings` array, and a file whose only errors are suppressed has status
  `pass`. In verify mode it is 0. The key is additive, so `schemaVersion` stays 1. Its
  position is fixed: between `filesWithWarnings` and `templatesChecked` (sample above). In
  the verify document it follows `warnings` (`templates`, `broken`, `warnings`,
  `suppressed`, `runErrors`, `exitCode`). Pinned by the summary key-order list of
  `tests/unit/reporters/json.test.ts` and the `summary` object of every
  `tests/fixtures/runner/*/expected.json`.
- `--quiet` does not shrink JSON.
- `sourceLine` (change C09, AS14) is an optional string member of a diagnostic, placed right
  after `column`. It is the text of line `line` of the diagnostic's source file (the target
  file for the diagnostics of `files[]`, the template file for the `diagnostics` of a verify
  template, 8.1), shown as in EX3 of 8.2 (escapes, whitespace controls as single spaces, runs
  not collapsed) and cut after 100 characters with `...` when longer (EX5, but never a
  window and no caret: `column` already says where). It is present exactly when the
  diagnostic has `line` and that line exists in the file. It is absent otherwise: an
  anchor-only diagnostic (4.4, DIR5) has no `line`, so it has no `sourceLine` even though the
  text formats quote its anchor line; `runErrors`, `runWarnings` and a broken template's
  `error` never have it. The key is additive, so `schemaVersion` stays 1. It is never
  affected by `--quiet`. Example (a directive warning):

  ```json
  { "code": "MTL021", "severity": "warning", "message": "Directive on line 9: unknown rule code 'MTL999'", "line": 9, "column": 1, "sourceLine": "<!-- md-template-lint disable-line MTL999 -->" }
  ```

## 9. Rule categories

One file per category in `src/rules/`. Each file exports its rules: `{ code, name, severity,
category, check, phase, step }`, registered by the engine (A9). Rule phases are `parse`,
`template`, `field` (with a step from `FIELD_STEPS`, the order of 4.1 step 3) and `target` (with a
step from `TARGET_STEPS`). A check returns `Diagnostic[]` or a promise of it and receives an
injectable `RuleEnv` (aliases, approved paths, pair root, `io.exists`, `io.probeUrl`). A new rule
that adds a tag touches five
places: the lexer keyword (`grammar/MdTemplateLexer.g4`, mode `TAG_STRICT`), the parser tag rule
and its alternative (`grammar/MdTemplateParser.g4`, plus `tagFamily` for a new family), the AST
union and its kind in `FRONTMATTER_KIND_SET` or `BODY_KIND_SET` (`src/tags/ast.ts`, same file,
enforced by `satisfies`), its visitor (`src/tags/visitors/<family>.ts`, plus
`visitors/index.ts` for a new family) and exactly one category file. A rule without a new tag
touches only the category file. The A9 consistency check (`pnpm run check:rules`) builds every tag
sentence from the parser ATN and runs it through the production `document` rule. It covers
`tagWord`, `tagFamily`, the visitor registry, `KNOWN_TYPE_NAMES`, AST kind sets, the start-mode
mirror of the lexer (read from the lexer ATN), the category ranges (`src/engine/ranges.json`
against 4.2) and the code table against the registered rules (a `notImplemented` stub counts as
pending, ADR 0002). A negated-set lexer token needs a `TOKEN_SAMPLES` entry in
`tests/consistency/consistency.ts`.

| File                      | Codes                 | Tags and checks                                                                      |
| ------------------------- | --------------------- | ------------------------------------------------------------------------------------ |
| `src/rules/syntax.ts`     | `MTL001`-`MTL004`, `MTL010`-`MTL013`, `MTL020`-`MTL025` | Frontmatter and YAML parse errors, unknown, malformed and misplaced tags; target disable directive warnings (4.4). |
| `src/rules/filename.ts`   | `MTL101`, `MTL102`    | `[filename:case:<convention>]`, `[value:filename]`.                                  |
| `src/rules/presence.ts`   | `MTL201`, `MTL202`    | `[presence:required]`, `[presence:optional]`, `[presence:conditional:<text>]` on fields; unknown keys. |
| `src/rules/format.ts`     | `MTL301`-`MTL305`     | `[format:constant:...]`, `[format:snake_case]`, `[format:kebab-case]`, `[format:elements:...]`, `[format:scheme:...]`. |
| `src/rules/bounds.ts`     | `MTL401`-`MTL407`     | `[count:min:N]`, `[count:max:N]`, `[range:min:N]`, `[range:max:N]`, `[order:ascending]`. |
| `src/rules/type.ts`       | `MTL501`-`MTL517`     | The 17 types and enum membership; type inference lives in the engine core.           |
| `src/rules/heading.ts`    | `MTL601`-`MTL604`     | Heading suffix presence tags (required, exist, optional, conditional, template-only) and order. |
| `src/rules/content.ts`    | `MTL701`-`MTL705`     | `[content:non-empty]`, `[content:table]`, `[content:list]`, `[content:min-lines:N]`, `[content:max-lines:N]`. |
| `src/rules/io.ts`         | `MTL801`-`MTL805`     | `[io:exists]`.                                                                       |

Outside `src/rules/`: the engine core (frontmatter and heading extraction, comment
binding, type inference), config loader, runner, reporters and CLI own `MTL9xx`.

Disable directives (4.4), split by phase: A58 lexes the directive comments in the grammar
(body HTML comments outside fences and code spans, frontmatter YAML comments) and exposes
them on the target `DocumentModel` with line, column and the raw word and code tokens; the
lexer and parser accept the six verbs of DIR2, `disable-file` included. A60
adds the six `MTL020` to `MTL025` rules to `src/rules/syntax.ts` as phase `target`, step
`directives` (the last entry of `TARGET_STEPS`, 4.1 step 7); the validation and range
bookkeeping they share is `src/engine/directives.ts`. The engine core
(`src/engine/pipeline.ts`) records the anchor line of each diagnostic (DIR5), applies the
coverage rule (DIR7, 4.1 step 8) and returns the suppressed count to the runner and the
reporters (DIR9). For `disable-file` the engine matches by code only (any anchor or
none); line directives and ranges match by code and anchor line, and never a diagnostic
without anchor. The JSON reporter has `summary.suppressed` between `filesWithWarnings` and
`templatesChecked` (8.5). A62 documents the directives in the README.

Coverage check (for the A9 consistency check): every code of 4.3 appears in exactly one
category row, except the `MTL9xx` run diagnostics, which belong to the engine and have no
rule file. Tags map to the categories by the codes they emit: presence tags emit codes in
both `presence.ts` (fields) and `heading.ts` (heading suffixes), so a tag may appear in
several rows. Type hints (2.4) are read by the engine core and emit no code of their own;
their effect shows through `type.ts` codes.

## 10. Assumptions

These choices go beyond the frozen sources. Review them before phases A6 and A9 (AS9 to
AS13: before A58 and A60; AS14: before A65). Ids are `AS1` to `AS14` (they are not plan phases).

- AS1: `approvedPaths` is an addition. Legacy only had alias approvals; absolute values were
  never probed. The new key lets a project opt in per folder. Default (empty) keeps the legacy
  behaviour.
- AS2: A broken template exits 1 (as the wrapper did), a missing template exits 2.
- AS3: `onEmpty` default is `warn` (legacy was an informational note).
- AS4: Text output replaces the nested `FAIL name has errors:` / `WARN name has N warning(s):`
  blocks of the legacy linter with one indented line per diagnostic (plus excerpt rows, EX1). Messages are unchanged.
- AS5: Globs are case-sensitive on every OS, where PowerShell wildcards are case-insensitive
  on Windows.
- AS6: A template file never lints itself (it is skipped when it matches its own pair).
- AS7: `MTL012` malformed tags are warnings, in line with unknown tags.
- AS8: `allowPrivateNetworks` is an addition. URL probes of `[io:exists]` refuse private,
  loopback, link-local and metadata addresses by default (SSRF guard); only private ranges can
  be opted in, the others are always blocked.
- AS9: Disable directive syntax (4.4, DIR1, DIR2): keyword `md-template-lint`, verbs
  `disable`, `disable-line`, `disable-next-line`, `disable-file`, `begin disable`, `end
  disable` (six), codes separated by commas and/or whitespace, all case-insensitive, optional
  ` -- reason`, no wildcard. Rationale: covers the three requested behaviours (inline, open
  disable, block) with the ESLint vocabulary most users know, plus one explicit whole-file
  verb for findings without a line; explicit codes keep suppressions reviewable.
- AS10: Carriers (DIR3, DIR4): single-line HTML comments in the target body, YAML comments
  (key-line trailing or column-1 whole-line) in the target frontmatter; never in templates,
  fences, code spans or multi-line HTML comments. Rationale: HTML comments are invisible
  when rendered; frontmatter findings anchor on key lines, which only take YAML comments.
- AS11: Anchors and coverage (DIR5, DIR7): a diagnostic anchors on a target key or heading
  line, or nowhere; an anchored one is covered by a line directive or range on or around
  that line, and any one by a `disable-file` for its code placed anywhere in the target;
  one without anchor ONLY by `disable-file` (never by a range, closed or not).
  Rationale: a finding about the whole file has no line, so it needs an explicit whole-file
  directive; any line or range rule would be arbitrary.
- AS12: Suppressible set (DIR6): `MTL101` to `MTL899` only. `MTL001` to `MTL004`, `MTL010` to
  `MTL013`, `MTL020` to `MTL025` and `MTL9xx` are not (`MTL022` when named). Rationale: only
  findings about one parsed target's content are local to that file.
- AS13: Reporting (DIR9): suppressed findings are dropped before counting and the exit code;
  only a count is shown (text `Suppressed:` when greater than 0, JSON `summary.suppressed`
  always). Rationale: suppression stays visible in CI without a new listing section; the
  JSON change is additive (`schemaVersion` 1).
- AS14: Source excerpt (8.1, 8.2, 8.3, 8.5; plan A65). The user confirmed that the "faulty
  line" is the line that causes the finding, in the target or in the template. Decisions:
  (a) a diagnostic without position quotes its anchor line (DIR5) when it has one, because
  the anchor is cheap and unambiguous; one without both gets no excerpt; (b) the caret
  exists only for a diagnostic with a column; (c) JSON `sourceLine` exists only next to a
  `line` (an anchor-only excerpt is text-only, so JSON never carries a quoted line without
  its number and DIR5 stays true); (d) the line is cut at 100 characters, with `...`;
  (e) `--verify` quotes the template line of `MTL010` to `MTL013`. Rationale: see 8.1 and
  8.2.

## 11. Legacy quirks and other changes

### 11.1 Kept quirks

Kept on purpose for parity (change only with a new decision):

- Q01: an unknown type hint becomes the type name and is never validated (3.2).
- Q02: Python `repr` list text in messages (`{pylist}`): quotes and escapes follow Python.
  Accepted deviation, same entry: legacy compared `[format:constant:...]` and
  `[value:filename]` against Python `str(value)`. For a list or mapping the port never
  matches. A non-empty list always has a `]` in its `str`, which a constant cannot contain
  (a file stem can, so `[value:filename]` could match a list such as `['a']` against a stem
  `['a']` in legacy; accepted, same class as the mapping case), and
  an empty list is "empty" (skipped), so lists behave the same. A mapping could match in
  legacy only when the constant is its Python text (an empty mapping `{}` equals a constant
  `{}`); the port reports it as a mismatch. This case is accepted as not worth reproducing.
- Q03: `[presence:exist]` is undocumented in the legacy docstring (which says "substring");
  the code matches by heading LEVEL. The code is the contract.
- Q04: `[format:constant:...]` and `[presence:conditional:...]` text cannot contain `]`.
- Q05: heading order uses the first matching target heading; headings inside multi-line HTML
  comments count.
- Q06: a duplicate frontmatter key silently keeps the last value.
- Q07: unknown and malformed template tags show in `--verify` only.
- Q08: a tag in a comment on a list item is read but not used.

### 11.2 Changes beyond D01 to D18

Behaviour that differs from legacy and is not one of the numbered defects.

- C01: a target file argument that does not exist. Legacy aborted the whole run with
  `Error: target not found` and exit 1 at the first missing file (py L2633-2635), before
  linting any file. The port reports `MTL912` for that file, still lints the others, and
  exits 2 at the end (7.2, 7.5).
- C02: a broken template. The wrapper printed an extra line
  `(skipping remaining N target file(s) for this template)` after `TEMPLATE ERROR`
  (ps L139). The port does not print it: the files of that pair are never attempted, and the
  `TEMPLATE ERROR` line plus the `Broken templates:` list say it (8.2).
- C03: the empty-set note. Legacy printed `No files matching pattern '<p>' in <dir>`
  (ps L115). The port prints `no files matched pair '{name}' in root '{root}'` as `MTL913`,
  because a pair now has several globs and a root, not one pattern and one directory (7.4).
- C04: a template path that exists but is not a regular file (for example a directory).
  Legacy passed the exists check, then failed the parse: "broken template", exit 1
  (py L2586, L2606-2611). The port reports `MTL911`, a run error that skips only the pairs
  using that template, and exits 2 (4.3, 6.6, 7.3).
- C05: a known, well-formed tag in the wrong region (a heading-only tag in a frontmatter
  comment, or the reverse). Legacy ignored it silently. The port reports `MTL013`, a warning
  with line and column, shown by `--verify` only (2.7).
- C07: reporting additions of A14. `pretty` and `plain` text renderings (8.2); the diagnostic
  `heading` member for heading and content findings, no `field` member (8.1); config errors
  carry file, line, column and key (`(file:line:col)` suffix in text); a duplicate YAML key in
  the config is `MTL902`, YAML anchors and aliases in the config are a type error; URL probe
  reasons also include `invalid URL`, `url budget exceeded` and `request failed`; MTL004 detail
  is path free (`file is not valid UTF-8` or `cannot read file (CODE)`).
- C06: accepted Unicode deviations of the port (JavaScript regex and string semantics against
  Python). Each is a known, small difference, kept until a real case shows up:
  - Digits: JS `\d` and the lexer `T_NUMBER` match ASCII digits only. Python `\d` matches every
    Unicode decimal digit (class Nd). Affects int, float, date patterns, range/count/min-lines
    numbers.
  - Whitespace: type checks, io paths and the frontmatter loader strip with JS `trim()`. The
    range, order, url, path-alias and content rules strip with the Python `str.isspace` set.
    Python `strip()` is the contract; the two sets differ for U+001C to U+001F, U+0085 and
    U+FEFF.
  - URLs: the syntactic URL check follows Python `urlsplit` but does not validate IPv6 bracket
    literals, does not strip leading C0 control characters and does not apply the NFKC netloc
    check.
  - Numbers: an integer bound above 2^53 compares as a JS number. In `range` the printed bound
    stays exact through BigInt; in `count` it is parsed with `parseInt` and prints inexactly.
  - Filename stem: a target path that ends with a separator has an empty stem, while Python
    `Path("dir/").stem` is `dir` (`[filename:case]`, `[value:filename]`).
- C08: disable directives in target files (4.4, AS9 to AS13; plan A56 spec, A58 grammar and
  parser, A60 engine and rules, A62 README). Legacy had no suppression: every comment of a
  target was inert prose. The port reads `md-template-lint` comments in the target (HTML in
  the body, YAML in the frontmatter) with six verbs (`disable-file` the only one for
  findings without a line, DIR7), drops the covered diagnostics (4.1 step 8), reports
  directive mistakes as `MTL020` to `MTL025` (4.1 step 7), and counts suppressions
  (`Suppressed:`, `summary.suppressed`, 8.2, 8.5). Parity: a target without such a comment
  gives the legacy diagnostics unchanged (the frozen corpus has none); JSON gains only the
  always present `summary.suppressed` key. Rationale: users need a local, reviewable escape
  hatch for one known exception without loosening the shared template.
- C09: source excerpt (8.1 to 8.3, 8.5, AS14; plan A65). Legacy printed only the message.
  The port quotes the offending source line under each diagnostic that has one, with a
  caret when a column is known, in `pretty` and `plain`, and adds the optional string
  `sourceLine` next to `line` in JSON and verify JSON. Messages, codes, counts, exit codes,
  ordering and `schemaVersion` (1) are unchanged, except that the escaped set of `cleanText`
  grows by the invisible format characters of EX3 (U+00AD, zero-width, tag characters and
  the like), which now show as escapes in every echoed value. Text output of a file with findings gains
  rows (a normalizer that drops the excerpt rows compares equal to the legacy layout, rows
  start with a line number and ` | `). Rationale: the user finds the line without opening
  the file.
