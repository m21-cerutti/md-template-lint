---
title: "Guide: adding a tag"
last_updated: 2026-11-11
---

# Guide: adding a tag

A tag is a bracket token such as `[count:min:2]` written in the inline comment of a template field
or in the suffix of a template heading ([spec.md section 2](../spec.md#2-template-tags)). Tag syntax
is specified once, in the two grammars in `grammar/`; no tag regex lives anywhere else. This guide
adds one tag end to end, in five places (lexer, parser, AST, visitor, the rule in its category
file), and shows the checks that tell you when you missed one. The order is: **tests first and see
them fail**, then the five places, then the checks and the docs.

The worked example is `[io:readable]`, next to the existing `[io:exists]`. It is an
illustration, not a feature of the product: do it on a scratch branch (`git switch -c scratch/try-a-tag`)
and delete the branch afterwards. Background: [Grammar and listeners](grammar-and-listeners.md),
[ADR 0002](../adr/0002-grammar-structure.md), and the lexer modes in
[architecture.md](../architecture.md#lexer-modes).

<!-- prettier-ignore-start -->
<!-- omit in toc -->
## Summary
<!-- prettier-ignore-end -->

- [0. Before you start](#0-before-you-start)
- [1. Write the tests first and see them fail](#1-write-the-tests-first-and-see-them-fail)
- [2. Lexer: the keyword, in `TAG_STRICT` only](#2-lexer-the-keyword-in-tag_strict-only)
- [3. Parser: the rule and its alternative](#3-parser-the-rule-and-its-alternative)
- [4. AST: the type and the kind](#4-ast-the-type-and-the-kind)
- [5. Visitor: build the tag](#5-visitor-build-the-tag)
- [6. The rule that consumes the tag](#6-the-rule-that-consumes-the-tag)
- [7. Check the work](#7-check-the-work)
- [8. Docs, syntax reference and gates](#8-docs-syntax-reference-and-gates)
- [See also](#see-also)

## 0. Before you start

```bash
pnpm install --frozen-lockfile
pnpm run check:parser
pnpm run check:rules
```

Both must pass on a clean tree. Then see what the parser does with the tag today. Create the
scratch file `tmp/tag.ts` (`tmp/` is git-ignored; scripts run through `tsx`):

```ts
import { parseInlineComment } from "../src/tags/parser.js";

const comment = parseInlineComment("[io:readable]");
console.log(
  "tags:",
  comment.tags.map((tag) => tag.kind),
);
console.log(
  "findings:",
  comment.findings.map((finding) => `${finding.reason} ${finding.tag}`),
);
```

```bash
pnpm exec tsx tmp/tag.ts
```

```text
tags: []
findings: [ 'malformed [io:readable]' ]
```

The family `io` is known, so the bracket is a tag attempt. Its argument is not, so the finding is
`malformed` (the rule `malformed-tag`, `MTL012`). When you are done the tag list holds one tag.

## 1. Write the tests first and see them fail

Write the tests of the whole change before any of the five places. Two levels.

**Parser level.** In `tests/unit/tags.test.ts`, in the block "frontmatter value tags", add a test
with `parseInlineComment`:

```ts
it("parses io:readable", () => {
  const { tags, findings } = parseInlineComment("[io:readable]");
  expect(findings).toEqual([]);
  expect(tags).toMatchObject([{ kind: "io-readable" }]);
});
```

and in `tests/unit/visitors.test.ts`, in the table of `io.ts (IoVisitor)`, a passing row next to the
`[IO:EXISTS]` one (the table runs one case per row, with a mixed-case input):

```ts
["readable", fm, "[Io:Readable]", { kind: "io-readable" }],
```

Run them and watch them fail:

```bash
pnpm exec vitest run tests/unit/tags.test.ts tests/unit/visitors.test.ts
```

It must exit 1: the new tests fail on `expect(findings).toEqual([])` (the received list holds the
`malformed` finding of step 0). If they pass, or fail for another reason, fix the tests first.

**Rule level.** A tag without a rule does nothing but parse, so the tag comes with the rule that
consumes it (here an `io` rule in `src/rules/io.ts`, field step `io`, that finds the tag with
`context.templateField.comment?.tags` and the kind `"io-readable"`). Do the first half of
[Adding a rule](adding-a-rule.md) now: the spec row and the `FIX_NOTES` entry (its step 2), the
scaffold (step 3), the fixtures and the test file (step 4), and run the test to see it fail (step
5). Leave its step 6, the check itself, for section 6 below. The fixtures of the rule use the new
tag in the template, for example `title: x # [io:readable]`.

## 2. Lexer: the keyword, in `TAG_STRICT` only

In `grammar/MdTemplateLexer.g4`, mode `TAG_STRICT`, next to the other arguments:

```antlr
EXISTS        : 'exists' ;
READABLE      : 'readable' ;
```

Tag keywords live in `TAG_STRICT` only (the strict re-lex of one bracket), never in the stage-1
mode `TAG_TEXT`, so there is no keyword-as-word list to update. Keywords are case-insensitive by the
grammar option `caseInsensitive = true`; a case-sensitive twin (like `FILENAME_CS`) needs its own
rule with `options { caseInsensitive = false; }`.

## 3. Parser: the rule and its alternative

In `grammar/MdTemplateParser.g4`, rule `fmIoTag` (the family stays one rule):

```antlr
fmIoTag
    : IO COLON (EXISTS | READABLE)
    ;
```

For a tag in the heading suffix the rules are `bodyPresenceTag`, `bodyContentTag`, `bodyPatternTag`,
`bodyRepeatTag` and `bodyOrderTag`, reached from `bodyTagBody`. Regenerate and verify the generated parser (never edit `src/generated/` by hand):

```bash
pnpm run gen:parser
pnpm run check:parser
```

`gen:parser` (`scripts/gen-parser.ts`) empties `src/generated/` and regenerates it with antlr-ng, no
Java. Commit the output with the grammar.

## 4. AST: the type and the kind

In `src/tags/ast.ts` add the member to the union (`FrontmatterValueTag` for a field tag,
`BodyContentTag`, `BodyPresenceTag` or `BodyPatternTag` for a heading tag):

```ts
  | Fm<{ readonly kind: "io-exists" }>
  | Fm<{ readonly kind: "io-readable" }>;
```

and the kind to the matching list, `FRONTMATTER_KIND_SET` (or `BODY_KIND_SET`) in the same file:

```ts
  "io-exists": true,
  "io-readable": true,
```

Both lists are checked by the compiler (`satisfies Record<..., true>`): a missing or extra kind does
not compile, so `pnpm run typecheck` tells you.

## 5. Visitor: build the tag

A visitor per family in `src/tags/visitors/<family>.ts` turns the parse tree of one tag into data.
It extends `FamilyVisitor` and overrides only the visit method of its own parser rule. Family
`io` already has `IoVisitor`; make it answer for both arguments in `src/tags/visitors/io.ts`:

```ts
/** Family `io` (spec 2.8): `[io:exists]`, `[io:readable]`. Rule fmIoTag. */
import type { FmIoTagContext } from "../../generated/MdTemplateParser.js";
import { FamilyVisitor, type FrontmatterTagData } from "./base.js";

export class IoVisitor extends FamilyVisitor<FrontmatterTagData> {
  override visitFmIoTag = (ctx: FmIoTagContext): FrontmatterTagData => ({
    kind: ctx.READABLE() !== null ? "io-readable" : "io-exists",
  });
}
```

The visitor returns the data only; `src/tags/parser.ts` adds `region`, `position` and `raw`. A NEW
family needs its visitor class and one line in `src/tags/visitors/index.ts`
(`FRONTMATTER_TAG_VISITORS` or `BODY_TAG_VISITORS`, the only hand-kept list of families).

## 6. The rule that consumes the tag

Now write the check of the rule you scaffolded in section 1: step 6 of
[Adding a rule](adding-a-rule.md), in `src/rules/io.ts`.

Grep the old kind to find the other readers of the tag list, and give the new kind the same
treatment:

```text
io-exists in src/tags/ast.ts, src/tags/visitors/io.ts, src/rules/io.ts,
              src/runner/schema.ts (the rule tokens printed by --verify)
```

## 7. Check the work

```bash
pnpm exec tsx tmp/tag.ts
pnpm exec vitest run tests/unit/tags.test.ts tests/unit/visitors.test.ts
pnpm run check:parser
pnpm run check:rules
pnpm run typecheck
```

```text
tags: [ 'io-readable' ]
findings: []
```

The unit tests of section 1 pass now, and so does the test of the rule. `pnpm run check:rules`
(`tests/consistency/`) fails with one line per drift. For a tag it:

- derives one sample sentence per grammar alternative from the parser ATN, parses each through the
  production `document` rule, and checks that each yields one tag of the kind the visitor gives and
  that the kinds equal the lists in `src/tags/ast.ts`;
- checks `tagFamily` against the first keywords of `fmTagBody` and `bodyTagBody`, and that every
  `fmTagBody` / `bodyTagBody` alternative has exactly one visitor in `visitors/index.ts`;
- needs a sample text in `TOKEN_SAMPLES` (`tests/consistency/consistency.ts`) only for a new stage-2
  token whose lexer rule is a negated set; the check names the token when it is missing.

For a new FAMILY (a new alternative of `fmTagBody` or `bodyTagBody`, a new keyword in `tagFamily`)
`tests/consistency/rules.test.ts` also pins counts in the test "reads non-empty inputs":
`firstSymbols(atn, MdTemplateParser.RULE_tagFamily).tokens.size` (11),
`...RULE_fmTagBody).rules.size` (8) and `...RULE_bodyTagBody).rules.size` (5). Raise the one you
changed by one. A new argument of an existing family, as in the example, changes none of them.

## 8. Docs, syntax reference and gates

- [spec.md](../spec.md): section 2 (the tag tables, and 2.7 for unknown and malformed tags),
  section 9, and the README rule tables.
- Syntax reference: every tag form is a row of the generated tags block of `docs/syntax-reference.md`,
  so run `pnpm run gen:syntax-doc` for a new argument too (`check:syntax-doc` fails on a stale file).
  The `io` family reaches files or URLs, so its rows carry the warning emoji by themselves, and
  `tests/consistency/syntax-reference.test.ts` pins the list of such forms (the test "fails: the
  warning emoji missing on an io tag..."): add `[io:readable]` to it. A tag that does not reach
  files or URLs has no such pin.
- Maintaining `notes.ts`: `scripts/syntax-doc/notes.ts` is hand-written. For a new tag FAMILY (a
  new alternative of `fmTagBody` or `bodyTagBody`) add a `TAG_NOTES` entry keyed by
  `<region>:<family>` with `description` and `example`, and a `TAG_FIXTURES` entry with the path of
  one `pass-` fixture template that holds the tag (`gen:syntax-doc` throws `no TAG_FIXTURES entry`
  without it). `check:rules` fails on a missing or orphan entry, one line each, for example
  `heading:pattern: no TAG_NOTES entry in scripts/syntax-doc/notes.ts` (see
  `tests/consistency/syntax-reference.ts`). A new tag ARGUMENT to an existing family, as in the
  example, needs no new `TAG_NOTES` entry; the `FIX_NOTES` entry of the rule is in
  [Adding a rule](adding-a-rule.md).
- Parser tests: the two tests of section 1. A tag problem of a template (the warnings `MTL010` to
  `MTL016` and the template errors `MTL017`, `MTL018`, `MTL019` and `MTL030`) is tested through
  `--verify` in `tests/syntax/syntax/` ([Testing](testing.md)).
- Gates, in this order, one at a time: `pnpm run check:parser`, `pnpm run check:rules`,
  `pnpm run check:syntax-doc`, `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`, `pnpm run build`, `pnpm test`.

If you only tried the guide, switch back and delete the scratch branch
(`git switch main`, `git branch -D scratch/try-a-tag`).

## See also

- [Adding a rule](adding-a-rule.md), [Grammar and listeners](grammar-and-listeners.md),
  [Testing](testing.md).
- [Architecture: engine](../architecture.md#engine).
- [Glossary](../glossary.md): tag, region, lexer mode, visitor, generated parser.
