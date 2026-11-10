---
title: Architecture
last_updated: 2026-10-30
---

# Architecture

Skeleton from phase A9. The contract is [spec.md](spec.md); the grammar decisions are in
[ADR 0002](adr/0002-grammar-structure.md). When this file and the spec disagree, the spec wins.

## Modules

| Path                               | Role                                                                                |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| `grammar/MdTemplateLexer.g4`       | Lexer with region modes. Single source of tag syntax with the parser grammar.       |
| `grammar/MdTemplateParser.g4`      | Parser: `document`, `fm*` (frontmatter) and `body*` (body) rule families.           |
| `src/generated/`                   | antlr-ng output. Never hand-edited (`pnpm run gen:parser`, `pnpm run check:parser`). |
| `src/tags/listeners.ts`            | Collecting lexer and parser error listeners, `DiagnosticCollector`.                 |
| `src/tags/parser.ts`               | Stage 1 and stage 2 parses, visitors, typed AST (`analyzeDocument`), line endings.  |
| `src/tags/visitors/`               | One visitor per tag family, `TypeHintListener`, bracket and heading helpers.        |
| `src/tags/ast.ts`, `types.ts`      | Typed AST, tag kind lists, findings; the 17 type names.                             |
| `src/engine/load.ts`               | `loadDocument` / `loadFile`: grammar parse, YAML values, comment binding, sections. |
| `src/engine/infer.ts`, `values.ts` | Type inference (spec 3.2) and the loose value predicates (spec 3.3).                |
| `src/engine/rule.ts`               | Rule contract: categories, phases, steps, contexts, `RuleEnv`, `defineRule`, stubs. |
| `src/engine/ranges.json`           | Category code ranges (spec 4.2). Read by `rule.ts` and `scripts/new-rule.ts`.       |
| `src/engine/registry.ts`           | Loads the nine `src/rules/<category>.ts` files, validates codes, categories, steps. |
| `src/engine/pipeline.ts`           | `checkTemplate` and `checkTarget`: load, then run the rules in spec 4.1 order.      |
| `src/rules/<category>.ts`          | One file per category (spec 9). Each exports `rules: readonly AnyRule[]`.           |

Config loader, runner, reporters, the real file system and HTTP io, and the CLI (`MTL9xx`)
come in later phases.

## Data flow

```text
file bytes -> loadFile (strict UTF-8; failure = file-unreadable)
text -> analyzeDocument (src/tags/parser.ts)
          normalizeLineEnds (BOM, CRLF, CR; shared with load.ts)
          stage 1: lexer modes + parser `document`  -> parse tree
          stage 2: each `[word:` bracket re-lexed in TAG_STRICT -> tag or finding
          visitors (one per family) -> typed AST; TypeHintListener -> hints
          listeners -> DiagnosticCollector { grammarErrors, findings }
     -> loadDocument (src/engine/load.ts)
          no frontmatter / bad YAML / not a mapping -> ParseFailure
          `yaml` (failsafe, uniqueKeys false) -> values
          comment of key line N  <-> YAML key node on line N  (spec 2.1)
          findings kept only on YAML key lines, filename lines and the body
          H1/H2 headings -> sections; inferType -> field type
     -> DocumentModel { fields, sections, filename, findings }
     -> pipeline (async): parse | template | target + field rules, in order
     -> Diagnostic { code, severity, message, position }
```

## Listeners and error flow

| Listener or visitor   | Runs on                                       | Reports to                         |
| --------------------- | --------------------------------------------- | ---------------------------------- |
| `LexerErrorListener`  | every lexer (stage 1, stage 2, entry helpers) | the `SyntaxEventLog` of that parse |
| `ParserErrorListener` | every parser (same)                           | the `SyntaxEventLog` of that parse |
| family visitors       | stage-2 parse tree of one bracket             | tag data, located by `parser.ts`   |
| `TypeHintListener`    | stage-1 tree of an inline comment             | hints, located by the session map  |
| `DiagnosticCollector` | one whole document parse                      | `DocumentAnalysis`                 |

- Both error listeners map the ANTLR line and column through a `PositionMap`. For a stage-2
  bracket the map adds the bracket offset, so every location is a file position.
- Stage-1 events (the `document` parse and the entry helpers) are grammar bugs: the collector
  stores them as `GrammarError` (region, entry rule, source, position, offending text, ANTLR
  message). `analyzeDocument` returns them with `document: null`; `parseDocument` and
  `loadDocument` throw `InternalParseError` carrying all of them. They are never user
  diagnostics.
- Stage-2 events are expected user input. The first event of `fmTagEntry` / `bodyTagEntry`
  becomes a `malformed` finding at the offending token, or `wrong-region` when the other
  region accepts the bracket. Probes (`tagFamilyEntry`, the other-region retry) keep their
  events local.
- Findings (`unknown`, `malformed`, `wrong-region`) go to the collector in source order.
  `loadDocument` filters them (spec 2.1) into `DocumentModel.findings`; the `template` phase
  rules of `src/rules/syntax.ts` turn them into `MTL010` to `MTL013`. Parse failures run the
  `parse` phase rules (`MTL001` to `MTL004`).
- Reporters (later phases) print the `Diagnostic` list: template warnings in `--verify`, target
  diagnostics with the `Parse error: ` or `TEMPLATE ERROR` forms of spec 4.3.

## Rule contract

```ts
defineRule({
  code: "MTL301", // MTL + 3 digits, inside the category range (src/engine/ranges.json)
  name: "constant-mismatch", // the spec 4.3 name
  severity: "error", // default; a check may override per diagnostic
  category: "format", // must match the file
  phase: "field", // "parse" | "template" | "field" | "target"
  step: "constant", // field and target phases only
  check: (context) => [], // Diagnostic[] or Promise<Diagnostic[]>
});
```

| Phase      | Context                                                                                    | Step         |
| ---------- | ------------------------------------------------------------------------------------------ | ------------ |
| `parse`    | `ParseContext`: role (template or target), `ParseFailure`                                  | none         |
| `template` | `TemplateContext`: the template model with its tag findings                                | none         |
| `field`    | `FieldContext`: key, template field, target value or null, both models, target path, `env` | `FieldStep`  |
| `target`   | `TargetContext`: both models, target path, `env`                                           | `TargetStep` |

`RuleEnv` carries the config `aliases`, `approvedPaths`, the `pairRoot` and an injectable
`io` (`exists(path)`, `probeUrl(url, timeoutMs)`, never throws, `URL_PROBE_TIMEOUT_MS` is
5000). `createMemoryIo` and `createEnv` are the in-memory default for tests: no network.

The registry throws `RegistryError` on a duplicate code, a category that does not match its
file, a code outside the range, or a missing, unknown or unexpected `step`.

### Emission order (spec 4.1, 8.4)

`checkTarget` is async and awaits each check before the next, so io timing never changes the
order:

1. a parse failure runs only the `parse` rules;
2. `target` rules of step `filename`;
3. for each TEMPLATE field in template order: if the target value is missing or empty (blank
   string or empty list), only the `field` rules of step `presence` (the single guard);
   otherwise the `field` rules of the steps `constant`, `count`, `range`, `order`, `scheme`,
   `io`, `value-filename`, `case`, `elements`, `type`, in that order;
4. `target` rules of steps `unknown-keys`, `headings`, `content`.

Inside one step: registry order (category file order, then file order). The result lists
errors first, then warnings, each in emission order.

## How to add a tag (5 places)

1. `grammar/MdTemplateLexer.g4`: the keyword token(s) in mode `TAG_STRICT` only.
2. `grammar/MdTemplateParser.g4`: the `fm*` or `body*` tag rule and its alternative in
   `fmTagBody` or `bodyTagBody`, plus `tagFamily` for a new family. Run `pnpm run gen:parser`.
3. `src/tags/ast.ts`: the member of the `FrontmatterTag` or `BodyTag` union AND its kind in
   `FRONTMATTER_KIND_SET` or `BODY_KIND_SET` (same file; the compiler rejects a missing or
   extra kind).
4. `src/tags/visitors/<family>.ts`: its visitor, and `visitors/index.ts` for a new family.
5. `src/rules/<category>.ts`: the rule that consumes it (see below).

Then `pnpm run check:rules`. It derives one sample per grammar alternative from the parser
ATN, parses it through the production `document` rule and checks the visitor and the kind
lists. Only a new stage-2 token whose lexer rule is a negated set needs a sample text in
`TOKEN_SAMPLES` (`tests/consistency/consistency.ts`); the check names the token when missing.

## How to add a rule

```bash
pnpm run new:rule -- <category> <name> [--step <step>] [--phase <phase>] [--code MTLnnn] [--syntax]
```

- Adds a `defineRule` entry with `check: notImplemented("MTLxxx")` to `src/rules/<category>.ts`.
  The stub throws when run; the code stays in `tests/consistency/pending-rules.json` until the
  check is implemented, then remove it from that list.
- Phase: `template` for category `syntax`, else `field`; `field` and `target` need `--step`.
- A spec 4.3 row with that name gives the code and severity; a new code needs a spec row.
- Tests and fixtures (A39 layout):
  - target (default): `tests/target/<category>/<MTLxxx>-<name>.test.ts`, fixtures
    `tests/fixtures/pairs/<MTLxxx>/<case>/template.md` and `target.md`;
  - `--syntax`: `tests/syntax/<category>/<MTLxxx>-<name>.test.ts`, fixtures
    `tests/fixtures/templates/<MTLxxx>/<case>.md`.
- Tests per rule: exactly one passing case, failing cases at least as many.

## Consistency check

`pnpm run check:rules` (`tests/consistency/`) fails with one line per drift:

- `tagFamily` against the first keywords of `fmTagBody` and `bodyTagBody` (parser ATN);
- `tagWord` against the word tokens, `fmHintWord`, `TYPE`, `RULE` and the `TAG_TEXT` keywords;
- the visitor registry: exactly one visitor per `fmTagBody` / `bodyTagBody` alternative;
- `KNOWN_TYPE_NAMES` against spec 3.1;
- AST kinds: every grammar alternative yields one tag through `document`, each kind from one
  family, and the kinds equal the lists in `src/tags/ast.ts`;
- the 8 `DS_*` rules of `DEFAULT_MODE` against the 8 `B_*` rules of mode `BODY` (lexer ATN:
  mode membership, order, pattern, token type, next mode);
- one file per category in `src/rules/`; `src/engine/ranges.json` against spec 4.2;
- every spec 4.3 code (except `MTL9xx`) implemented or pending, never both; a stub counts as
  pending; registered rules match the spec name, category and severity.
