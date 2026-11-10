---
title: "Guide: adding a tag"
last_updated: 2026-10-30
---

# Guide: adding a tag

A tag is a bracket token such as `[count:min:2]` written in the inline comment of a template field
or in the suffix of a template heading ([spec.md section 2](../spec.md#2-template-tags)). Tag syntax
is specified once, in the two grammars in `grammar/`; no tag regex lives anywhere else. This guide
adds one tag end to end, in five places, and shows the checks that tell you when you missed one.

The worked example is `[order:descending]`, next to the existing `[order:ascending]`. It is an
illustration, not a feature of the product: do it on a scratch branch (`git switch -c scratch/try-a-tag`)
and delete the branch afterwards. Background: [Grammar and listeners](grammar-and-listeners.md),
[ADR 0002](../adr/0002-grammar-structure.md), and the lexer modes in
[architecture.md](../architecture.md#lexer-modes).

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

const comment = parseInlineComment("[order:descending]");
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
findings: [ 'malformed [order:descending]' ]
```

The family `order` is known, so the bracket is a tag attempt. Its argument is not, so the finding is
`malformed` (the rule `malformed-tag`, `MTL012`). When you are done the tag list holds one tag.

## 1. Lexer: the keyword, in `TAG_STRICT` only

In `grammar/MdTemplateLexer.g4`, mode `TAG_STRICT`, next to the other arguments:

```antlr
ASCENDING     : 'ascending' ;
DESCENDING    : 'descending' ;
```

Tag keywords live in `TAG_STRICT` only (the strict re-lex of one bracket), never in the stage-1
mode `TAG_TEXT`, so there is no keyword-as-word list to update. Keywords are case-insensitive by the
grammar option `caseInsensitive = true`; a case-sensitive twin (like `FILENAME_CS`) needs its own
rule with `options { caseInsensitive = false; }`.

## 2. Parser: the rule and its alternative

In `grammar/MdTemplateParser.g4`, rule `fmOrderTag` (the family stays one rule):

```antlr
fmOrderTag
    : ORDER COLON (ASCENDING | DESCENDING)
    ;
```

For a tag in the heading suffix the rules are `bodyPresenceTag` and `bodyContentTag`, reached from
`bodyTagBody`. Regenerate and verify the generated parser (never edit `src/generated/` by hand):

```bash
pnpm run gen:parser
pnpm run check:parser
```

`gen:parser` (`scripts/gen-parser.ts`) empties `src/generated/` and regenerates it with antlr-ng, no
Java. Commit the output with the grammar.

## 3. AST: the type and the kind

In `src/tags/ast.ts` add the member to the union (`FrontmatterValueTag` for a field tag,
`BodyContentTag` or `BodyPresenceTag` for a heading tag):

```ts
  | Fm<{ readonly kind: "order-ascending" }>
  | Fm<{ readonly kind: "order-descending" }>
```

and the kind to the matching list, `FRONTMATTER_KIND_SET` (or `BODY_KIND_SET`) in the same file:

```ts
  "order-ascending": true,
  "order-descending": true,
```

Both lists are checked by the compiler (`satisfies Record<..., true>`): a missing or extra kind does
not compile, so `pnpm run typecheck` tells you.

## 4. Visitor: build the tag

A visitor per family in `src/tags/visitors/<family>.ts` turns the parse tree of one tag into data.
It extends `FamilyVisitor` and overrides only the visit method of its own parser rule. Family
`order` already has `OrderVisitor`; make it answer for both arguments in `src/tags/visitors/order.ts`:

```ts
/** Family `order` (spec 2.3): `[order:ascending]`, `[order:descending]`. Rule fmOrderTag. */
import type { FmOrderTagContext } from "../../generated/MdTemplateParser.js";
import { FamilyVisitor, type FrontmatterTagData } from "./base.js";

export class OrderVisitor extends FamilyVisitor<FrontmatterTagData> {
  override visitFmOrderTag = (ctx: FmOrderTagContext): FrontmatterTagData => ({
    kind: ctx.DESCENDING() !== null ? "order-descending" : "order-ascending",
  });
}
```

The visitor returns the data only; `src/tags/parser.ts` adds `region`, `position` and `raw`. A NEW
family needs its visitor class and one line in `src/tags/visitors/index.ts`
(`FRONTMATTER_TAG_VISITORS` or `BODY_TAG_VISITORS`, the only hand-kept list of families).

## 5. The rule that consumes the tag

A tag without a rule does nothing but parse. Add the rule with
[Adding a rule](adding-a-rule.md) (here a `bounds` rule in `src/rules/bounds.ts`, step `order`, that
finds the tag with `context.templateField.comment?.tags` and the kind `"order-descending"`), and its
spec row.

Grep the old kind to find the other readers of the tag list, and give the new kind the same
treatment:

```text
order-ascending in src/tags/ast.ts, src/tags/visitors/order.ts, src/rules/bounds.ts,
                    src/runner/schema.ts (the rule tokens printed by --verify)
```

## 6. Check the work

```bash
pnpm exec tsx tmp/tag.ts
pnpm run check:parser
pnpm run check:rules
pnpm run typecheck
```

```text
tags: [ 'order-descending' ]
findings: []
```

`pnpm run check:rules` (`tests/consistency/`) fails with one line per drift. For a tag it:

- derives one sample sentence per grammar alternative from the parser ATN, parses each through the
  production `document` rule, and checks that each yields one tag of the kind the visitor gives and
  that the kinds equal the lists in `src/tags/ast.ts`;
- checks `tagFamily` against the first keywords of `fmTagBody` and `bodyTagBody`, and that every
  `fmTagBody` / `bodyTagBody` alternative has exactly one visitor in `visitors/index.ts`;
- needs a sample text in `TOKEN_SAMPLES` (`tests/consistency/consistency.ts`) only for a new stage-2
  token whose lexer rule is a negated set; the check names the token when it is missing.

For a new FAMILY (a new alternative of `fmTagBody` or `bodyTagBody`, a new keyword in `tagFamily`)
`tests/consistency/rules.test.ts` also pins counts in the test "reads non-empty inputs":
`firstSymbols(atn, MdTemplateParser.RULE_tagFamily).tokens.size` (9),
`...RULE_fmTagBody).rules.size` (8) and `...RULE_bodyTagBody).rules.size` (2). Raise the one you
changed by one. A new argument of an existing family, as in the example, changes none of them.

## 7. Tests and docs

- Parser level: add the tag to the matching test of `tests/unit/tags.test.ts` (it parses
  `[order:ascending]` in "parses format, value, count, range, order and io tags") with
  `parseInlineComment`, and a malformed case; `tests/unit/visitors.test.ts` covers the visitors.
- Rule level: the fixtures and test file of the new rule ([Testing](testing.md)). A tag problem of a
  template (`MTL010` to `MTL013`) is tested through `--verify` in `tests/syntax/syntax/`.
- Docs: [spec.md](../spec.md) section 2 (the tag tables, and 2.7 for unknown and malformed tags),
  section 9, and the README rule tables.
- Gates, in this order, one at a time: `pnpm run check:parser`, `pnpm run check:rules`,
  `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`, `pnpm run build`, `pnpm test`.

If you only tried the guide, switch back and delete the scratch branch
(`git switch main`, `git branch -D scratch/try-a-tag`).

## See also

- [Adding a rule](adding-a-rule.md), [Grammar and listeners](grammar-and-listeners.md),
  [Testing](testing.md).
- [Architecture: how to add a tag (5 places)](../architecture.md#how-to-add-a-tag-5-places) and
  [adding-a-rule.md, section 5](../adding-a-rule.md#5-adding-a-new-tag).
- [Glossary](../glossary.md): tag, region, lexer mode, visitor, generated parser.
