---
id: 0002-grammar-structure
title: Split lexer and parser grammars with lexer modes and per-family visitors
status: accepted
date: 2026-10-29
deciders: [owner]
---

> Accepted. The owner asked for a grammar based on Markdown that separates frontmatter rules from body rules. On 2026-10-29 the owner approved lexer modes ("You can use lexer modes"), multiple grammar files ("You can also use multiple grammar files") and per-rule visitors and listeners ("You should split Listeners and Visitors per rules"). An earlier combined-grammar draft (region by position, TypeScript fence predicates) was replaced before commit.

# ADR

The tag grammar is two ANTLR files, a lexer with modes and a parser. The parser has a frontmatter rule family (`fm*`) and a body rule family (`body*`). The parse tree is walked by one small visitor or listener per tag family.

## Context

A combined ANTLR grammar cannot declare lexer modes, so a grammar that separates frontmatter from body at the lexer level needs a split `lexer grammar` and `parser grammar`. ADR 0001 first assumed one `.g4` file. The owner lifted that limit.

## Decision

- Grammar files: `grammar/MdTemplateLexer.g4` (`lexer grammar`, region modes) and `grammar/MdTemplateParser.g4` (`parser grammar`, `tokenVocab = MdTemplateLexer`). Together they are the single source of tag syntax. No tag regex lives outside `grammar/*.g4`.
- Lexer modes: `DEFAULT_MODE` (document start), `FM`, `FM_VALUE`, `FM_PLAIN`, `FM_FLOW`, `FM_TEXT` (frontmatter), `BODY`, `BODY_TEXT`, `FENCE_BACKTICK`, `FENCE_TILDE` (body and code fences), `TAG_TEXT`, `TAG_STRICT`, `TAG_FREE`, `TAG_SCHEME` (tag internals); added in A58: `DIRECTIVE_SCAN`, `DIRECTIVE` (target disable directives, spec 4.4).
- Parser root: `document` = frontmatter + body, an unclosed frontmatter, or body only. Entry rules for tests: `fmInlineCommentEntry`, `fmFilenameLineEntry`, `bodyHeadingTextEntry`, `fmTagEntry`, `bodyTagEntry`.
- Tags are parsed in two stages: a loose parse (stage 1, only type-hint words are keywords) and a strict re-lex of each bracket in mode `TAG_STRICT` (stage 2, all tag keywords). A known tag in the other region is reported as wrong-region (`MTL013`).
- One embedded TypeScript action and predicate remain, for code fences only: `openFence()` and `closesFence()`. Modes cannot express that a closing fence is at least as long as the opening one.
- Visitors: `src/tags/visitors/<family>.ts`, one module per tag family (presence, format, value, count, range, order, io, filename, content) built on a shared `FamilyVisitor` over the generated parser visitor; type hints use a listener (`TypeHintListener`). Two structural helpers are not tag families and need no tag alternative: `heading.ts` (heading-suffix peeling) and `brackets.ts` (bracket shape classification: unknown, inert, candidate). The A9 consistency check treats only the families registered in `visitors/index.ts` as tag families. `src/tags/parser.ts` only orchestrates: it parses per region, runs the registered visitors (`visitors/index.ts`) and merges the results into the typed AST (`Fm<T>` and `Body<T>`). There is no switch over tag kinds. Headings of every level (H1 to H6) are kept in the AST and peel their tags; consumers build a section, with its parent, from each of them (change C10, [ADR 0009](0009-all-heading-levels.md)).
- The parser layer returns only a region, a reason (unknown, malformed, wrong-region), a location and the subject. `src/rules/syntax.ts` (phase A9) maps reasons to `MTL010` to `MTL013`, severity and message (`MTL015`, a heading tag with no effect, is read from the template headings and `MTL016`, a date field without a format tag, from the template fields, in the same file).
- YAML comment binding: the lexer finds frontmatter comments and they are joined to the keys of the `yaml` document by line number, because `yaml` merges consecutive comment lines. Field-tag diagnostics are emitted only for lines that match a top-level YAML key.
- Stage-1 grammar errors are internal errors, never user diagnostics.
- Generation: `pnpm run gen:parser` empties `src/generated/` and regenerates both grammars (antlr-ng, no Java). `pnpm run check:parser` regenerates into a temporary folder and fails on any differing, missing or extra file.

## Consequences

- Adding a tag touches: (1) the lexer keyword in mode `TAG_STRICT`; (2) the parser tag rule and its alternative in `fmTagBody` or `bodyTagBody`, plus `tagFamily` for a new family; (3) the AST union and its kind in `FRONTMATTER_KIND_SET` or `BODY_KIND_SET` in `src/tags/ast.ts` (same file, enforced by `satisfies`); (4) its visitor in `src/tags/visitors/<family>.ts` (and `visitors/index.ts` for a new family); (5) one category file in `src/rules/`. Tag keywords no longer appear in stage 1, so there is no hand-kept keyword-as-word list for tags.
- Hand-kept lists the A9 consistency check must cover: `tagWord` (the seven type-hint words), `tagFamily`, the visitor registry in `visitors/index.ts`, `KNOWN_TYPE_NAMES` in `src/tags/types.ts`, and the body line-start rules repeated in `DEFAULT_MODE`. The check reads mode membership and rule order from the lexer ATN (not the grammar text), builds tag sentences from the parser ATN, and fails if `ranges.json` drifts from the spec 4.2 table. The only hand-kept sample is `TOKEN_SAMPLES` for negated-set lexer tokens; a missing entry fails the check and names the token.
- The fence action and predicate are TypeScript tied to the antlr-ng TypeScript target. This is guarded by `check:parser`.
- `scripts/gen-parser.ts` rewrites one generated import (`ParseTreeListener`) to a type-only import for `verbatimModuleSyntax`. The match is exact and fails loudly if a generator upgrade changes it.
- The YAML binding uses two tokenizers (the lexer modes and `yaml`). Quoted, multi-line and block-scalar keys rely on the line join and on matching to YAML keys.
- ADR 0001 stays valid except that the grammar is now two files.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| --- | --- | --- | --- |
| Split lexer and parser grammars with lexer modes | real region modes, matches the Markdown structure, one source of syntax | two files, one fence action and predicate | Chosen |
| Combined grammar, region by position | one file | no lexer modes, fence predicates in the parser, tied to the TS target | Rejected |
| Two separate grammars (frontmatter, body) | simple per region | tag syntax duplicated across files | Rejected |
| One monolithic visitor | one place to read | grows with every tag, central switch | Rejected |
| Bind comments with the `yaml` library only | one tokenizer | consecutive comment lines are merged, comments lose their line | Rejected |
