---
title: yaml comment-binding spike (A6)
last_updated: 2026-10-29
---

# yaml comment-binding spike (A6)

Question: can the `yaml` package (2.9.1, pinned) bind a frontmatter inline comment to the
right top-level key (spec 2.1)? Evidence: `tests/unit/yaml-spike.test.ts` (binding) and
`tests/unit/yaml-explore.test.ts` (loading options). Both run in `pnpm test`.

## Cases checked

| Case                                   | Example                        | Result                                               |
| -------------------------------------- | ------------------------------ | ---------------------------------------------------- |
| Double-quoted key and value            | `"quoted key": x # c`          | bound                                                |
| Apostrophe in a single-quoted key      | `'it''s': "a # not" # c`       | bound, `#` in quotes kept in value                   |
| Apostrophe in a plain value            | `owner: it's fine # c`         | bound                                                |
| Escaped quote in a double-quoted value | `esc: "q \" # in" # c`         | bound                                                |
| Colon inside a quoted key              | `"a:b": x # c`                 | bound (legacy heuristic breaks here)                 |
| `#` glued to a value                   | `url: a#frag # c`, `"#ff0000"` | stays in the value                                   |
| Empty value                            | `empty: # c`                   | bound, value `""`                                    |
| Flow list                              | `flow: ["a", "b"] # c`         | bound                                                |
| Block list or map key                  | `tags: # c` then `  - a`       | bound to `tags`; item and sub-key comments not bound |
| Whole-line comment                     | `# [filename:case:...]`        | never bound                                          |
| Comment without space                  | `last: y #c`                   | bound                                                |

## Limitation found

`yaml` node comments (`node.comment`, `node.commentBefore`) MERGE consecutive comment lines:
`k: x # c` followed by an indented `# next` gives `comment = " c\n next"`, and a block
key comment merges with the comment lines under it. Node comments alone cannot tell the
same-line comment from the lines after it, so they break the rule "never binds across
lines".

Working method in the spike: take the comment tokens of the CST (`Parser`), map each
offset to a line with `LineCounter`, and bind it only to the top-level key whose key node
starts on that same line. This matches every case above.

## Loading options (spec 1.2)

`parseDocument(src, { schema: "failsafe", uniqueKeys: false })` keeps every scalar as
a string (`yes`, `2026-08-10`, `1.0`, `~` unchanged, empty value `""`) and lets the last
duplicate key win without an error. With the default `uniqueKeys` a duplicate gives
`DUPLICATE_KEY`.

## Decision for A9

- The grammar locates the frontmatter region, its key lines and each inline comment
  (lexer modes `FM`, `FM_VALUE`, `FM_PLAIN` in `grammar/MdTemplateLexer.g4`; parser
  rules `fmKeyLine`, `fmInlineComment` in `grammar/MdTemplateParser.g4`; exposed as
  `parseDocument(...).frontmatter.lines`). A spike test checks that the grammar and the CST
  method give the same comments on all cases above.
- A9 loads values with `yaml` (`failsafe`, `uniqueKeys: false`) from `frontmatter.yaml`,
  then joins comments to keys BY LINE: key node line (from `LineCounter`) equals the
  grammar's key line. Node comments are not used.
- Known gaps, both rare: a quoted scalar or flow list spanning several lines, and `" #"`
  inside an unquoted flow item. The grammar falls back to a plain line (no comment); YAML
  itself treats `" #"` in flow as a comment.
