---
title: Glossary
last_updated: 2026-10-30
---

# Glossary

The terms of the code and the docs, alphabetical (a leading `--` is ignored). Each entry names the
type, file or key the term has in the code; when a term has no code name of its own, the entry says
so. Back to the [docs index](README.md).

- **alias**: a named directory of the config (`aliases`, `LintConfig.aliases`, `RuleEnv.aliases`).
  A path value that starts with `@name/` is resolved through it by `[io:exists]` (`ALIAS_LIKE` in
  `src/engine/values.ts`, rules `MTL801` and `MTL802`). See [spec 2.8](spec.md#28-the-ioexists-tag).
- **anchor line**: the one target line a diagnostic is about, or none (`anchorLineOf` in
  `src/engine/rule.ts`). It lives in a side table, not on the `Diagnostic`; a disable directive
  covers a diagnostic by its code and anchor line, and the runner quotes the anchored line.
  See [anchor lines](architecture.md#anchor-lines-spec-44-dir5).
- **approvedPaths**: the config key (`LintConfig.approvedPaths`, `RuleEnv.approvedPaths`) that lists
  the absolute directories `[io:exists]` may check. An absolute path outside them is skipped with
  `MTL803`. See [spec 2.8](spec.md#28-the-ioexists-tag).
- **category**: one of the nine groups of rules (`CATEGORIES`, the type `Category` in
  `src/engine/rule.ts`): `syntax`, `filename`, `presence`, `format`, `bounds`, `type`, `heading`,
  `content`, `io`. Each has one file `src/rules/<category>.ts` and one code range. See
  [where the codes live](architecture.md#where-the-codes-live).
- **DiagnosticCollector**: the class (`src/tags/listeners.ts`) that is the single sink of one document
  parse: it holds the `GrammarError` list and the `TagFinding` list. See
  [listeners and error flow](architecture.md#listeners-and-error-flow).
- **disable directive**: a comment in a target that silences rule codes locally
  (`<!-- md-template-lint disable-line MTL201 -->` in the body, `# md-template-lint ...` in the
  frontmatter). The parsed form is `Directive` (verb type `DirectiveVerb`, `src/tags/ast.ts`); the
  engine validates it and builds a `SuppressionPlan` (`src/engine/directives.ts`). Problems are
  `MTL020` to `MTL025`. See [spec 4.4](spec.md#44-disable-directives-in-target-files).
- **DocumentModel**: the interface (`src/engine/model.ts`) of one loaded template or target: its
  `fields`, `sections`, filename tag, tag `findings` and `directives`, built by `loadDocument`. See
  [main types](architecture.md#main-types).
- **fixture**: a file or folder under `tests/fixtures/` that holds the input of one test case, named
  `pass-...` or `fail-...`. See [fixtures and case names](guides/testing.md#fixtures-and-case-names).
- **generated parser**: the lexer, parser, listener and visitor in `src/generated/`, written by
  `pnpm run gen:parser` from the two grammars, checked by `pnpm run check:parser`, never hand-edited.
  See [the generated parser](guides/grammar-and-listeners.md#the-generated-parser).
- **lexer mode**: a state of the ANTLR lexer in `grammar/MdTemplateLexer.g4` (`DEFAULT_MODE`, `FM`,
  `BODY`, `TAG_STRICT`, `DIRECTIVE`, ...). The modes separate the regions of a document and the
  parse stages. See [lexer modes](architecture.md#lexer-modes).
- **listener**: an ANTLR object called during lexing, parsing or a tree walk. Here: the error listeners
  `LexerErrorListener` and `ParserErrorListener` (`src/tags/listeners.ts`) and the tree listener
  `TypeHintListener` (`src/tags/visitors/hints.ts`). See
  [listeners and visitors](guides/grammar-and-listeners.md#listeners-and-visitors).
- **misplaced tag (`MTL013`)**: a well-formed tag written in the wrong region, for example a heading
  tag in a field comment. The finding reason in code is `wrong-region` (`TagFindingReason`); the rule is
  `misplaced-tag`. It is a warning. See
  [spec 2.7](spec.md#27-inert-unknown-and-malformed-tags).
- **MTL code**: the stable identifier `MTL` plus three digits of a rule or a run diagnostic (the type
  `RuleCode`, `codeNumber` in `src/engine/model.ts`). The range tells the category; a code is never
  renumbered or reused. See [spec 4.3](spec.md#43-code-table).
- **pair**: one entry of `pairs` in `md-template-lint.yml` (`PairConfig`): a template, include and
  exclude globs and the roots it runs on. In the tests a "pair fixture" is a folder with one
  `template.md` and one `target.md`. See [spec 6.3](spec.md#63-schema).
- **phase**: when the pipeline runs a rule (the type `Phase` in `src/engine/rule.ts`): `parse`,
  `template`, `field` or `target`. `field` and `target` rules also have a step. Not the "phase A9"
  of code comments, which names a step of the project plan. See [rule contract](architecture.md#rule-contract).
- **region**: the part of a document a tag is written in (the type `Region`, `"frontmatter"` or
  `"body"`, in `src/tags/ast.ts`). The lexer has region modes too (`FM*`, `BODY*`). See
  [lexer modes](architecture.md#lexer-modes).
- **rule**: one check with a code, name, severity, category, phase and a `check` function (`defineRule`,
  `AnyRule` in `src/engine/rule.ts`), registered through `src/rules/<category>.ts`. Not a run
  diagnostic. See [rule contract](architecture.md#rule-contract).
- **run diagnostic vs run warning**: a run diagnostic (`RunDiagnostic`, `src/config/types.ts`) is a
  `MTL9xx` finding about the run itself (config, a missing root, template or target, usage), not a rule.
  A run warning is one of them with severity `warning` (`RunResult.runWarnings`; only `MTL913` with
  `onEmpty: warn`): it never changes the exit code, while a run error (`runErrors`) gives exit 2. There
  is no type named "run warning". See [spec 4.3](spec.md#run-errors-engine-no-rule-file).
- **severity**: `error` (the file fails, exit 1) or `warning` (printed, never changes the exit code); the
  type `Severity` in `src/engine/model.ts`. See [spec 1.3](spec.md#13-severity).
- **source excerpt**: the bounded window of the source line a diagnostic is about, printed under it
  with a caret (`SourceExcerpt` in `src/runner/types.ts`, `withExcerpts` in `src/runner/excerpt.ts`,
  `excerptRows` in `src/reporters/excerpt.ts`; JSON `sourceLine`). See
  [source excerpt](architecture.md#source-excerpt-spec-82-ex1-to-ex9-83-85).
- **syntax vs target test**: a syntax test (`tests/syntax/`) runs one template through `--verify` for a
  template-only code; a target test (`tests/target/`) lints a template and a target pair for any other
  code. The phase of the rule decides. Not the same word as the rule category `syntax`. See
  [the five kinds of test](guides/testing.md#the-five-kinds-of-test).
- **tag**: a bracket token `[family:argument]` in a field comment or a heading suffix, for example
  `[count:min:2]`. Well-formed tags become typed data (`FrontmatterTag`, `BodyTag` in
  `src/tags/ast.ts`); problems become `TagFinding`. See [spec 2](spec.md#2-template-tags).
- **TagFinding**: the interface (`src/tags/ast.ts`) of one tag problem: region, reason (`unknown`,
  `malformed` or `wrong-region`), the bracket text and its position. `src/rules/syntax.ts` turns
  findings into `MTL010` to `MTL013`. See [spec 2.7](spec.md#27-inert-unknown-and-malformed-tags).
- **target**: a Markdown file linted against one template. Tags in a target are inert; it may carry
  disable directives. See [spec 1.1](spec.md#11-what-a-template-is).
- **template**: a Markdown file that is the schema: its frontmatter keys, inline comments and heading
  suffixes carry the tags. It is parsed once per run and never linted against itself. See
  [spec 1.1](spec.md#11-what-a-template-is).
- **`--verify`**: the CLI mode that parses templates only and prints their schema and tag warnings
  (`verifyConfig`, `verifyPaths` in `src/runner/verify.ts`, `describeTemplate` in
  `src/runner/schema.ts`). It reads no target and builds no io. See
  [spec 7.3](spec.md#73---verify) and the [flowchart](architecture.md#--verify).
- **visitor**: an ANTLR object that walks a parse tree and returns a value. Here the tag visitors
  (`FamilyVisitor` in `src/tags/visitors/base.ts` and one subclass per tag family) and the helpers
  `BracketShapeVisitor`, `HeadingVisitor` and `DirectiveVisitor`. See
  [listeners and visitors](guides/grammar-and-listeners.md#listeners-and-visitors).
