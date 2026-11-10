---
title: Adding a rule
last_updated: 2026-11-04
---

# Adding a rule

Step by step guide to add a rule, or a rule with a new template tag, to
`md-template-lint`. Read [architecture.md](architecture.md) (rule contract, emission
order) and [spec.md](spec.md) sections 2, 4 and 9 first. The spec is the contract: when
code and spec disagree, fix one of them in the same change.

Every command below exists in `package.json` (`new:rule`, `gen:parser`, `check:parser`,
`check:rules`, `typecheck`, `lint`, `format:check`, `test`, `build`) or in
`scripts/` (`scripts/new-rule.ts`).

## 1. Choose the category and the code

Rules live in `src/rules/<category>.ts`, one file per category. The nine categories and
their code ranges (spec 4.2, `src/engine/ranges.json`):

| Category   | Range             | Scope                                                  |
| ---------- | ----------------- | ------------------------------------------------------ |
| `syntax`   | `MTL001`-`MTL099` | parsing, template tag and target directive diagnostics |
| `filename` | `MTL100`-`MTL199` | rules on the target file name                          |
| `presence` | `MTL200`-`MTL299` | field presence, unknown keys                           |
| `format`   | `MTL300`-`MTL399` | value shape rules from tags                            |
| `bounds`   | `MTL400`-`MTL499` | count, range, order                                    |
| `type`     | `MTL500`-`MTL599` | type validation, enum                                  |
| `heading`  | `MTL600`-`MTL699` | heading presence and order                             |
| `content`  | `MTL700`-`MTL799` | section body rules                                     |
| `io`       | `MTL800`-`MTL899` | `[io:exists]` warnings                                 |

`MTL900`-`MTL999` are run diagnostics of the engine, not rules.

A code is never renumbered and never reused. A rule needs a row in the code table of
[spec.md](spec.md) section 4.3 (code, name, severity, message). Write the row first:
the scaffold reads the code and the severity from it, and `pnpm run check:rules`
fails when a registered rule and a spec row disagree on name, category or severity.
Use the legacy-style message text of the spec (`Field '{key}': ...`, `Heading: ...`)
and a severity of `error` or `warning` (`warning` never changes the exit code).
If the rule consumes a tag, also add the tag to the tables of spec section 2 and the
category row of spec section 9.

## 2. Scaffold the rule

```bash
pnpm run new:rule -- <category> <name> [--code MTLnnn] [--phase <phase>] [--step <step>] [--syntax]
```

| Argument or flag  | Meaning                                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `<category>`      | One of the nine categories above.                                                                                         |
| `<name>`          | Kebab-case rule name (a-z, 0-9, `-`). Use the name of the spec 4.3 row.                                                   |
| `--code MTLnnn`   | Explicit code, inside the category range. Default: the spec 4.3 row with that name, else the next free code of the range. |
| `--phase <phase>` | `parse`, `template`, `field` or `target`. Default: `template` for category `syntax` or with `--syntax`, else `field`.     |
| `--step <step>`   | Required for phases `field` and `target`, refused for the others. See below.                                              |
| `--syntax`        | A template-only rule in another category: default phase `template`; refused with phase `field` or `target`.               |

The test layout follows the phase, the same rule `pnpm run check:rules` applies: phase
`parse` or `template` gets the template-only layout (`tests/syntax/`,
`tests/fixtures/templates/`), phase `field` or `target` the pair layout (`tests/target/`,
`tests/fixtures/pairs/`). Category `syntax` therefore gets the template-only layout without
any flag; a `syntax` rule of phase `target` (the directive warnings `MTL020` to `MTL025`) has
the pair layout (`tests/target/syntax/`, `tests/fixtures/pairs/`).

Steps are the lists in `src/engine/rule.ts` and fix the emission order (spec 4.1):

- `field` phase, `FIELD_STEPS`: `presence`, `constant`, `count`, `range`, `order`,
  `scheme`, `io`, `value-filename`, `case`, `elements`, `type`.
- `target` phase, `TARGET_STEPS`: `filename`, `unknown-keys`, `headings`, `content`,
  `directives` (the target directive warnings `MTL020` to `MTL025`, spec 4.4).

Examples (names are illustrative; use a free code and a spec row of your own):

```bash
pnpm run new:rule -- bounds count-exact --step count
pnpm run new:rule -- content content-max-words --phase target --step content
```

The script (it never runs git and has no dependency):

- adds a `defineRule({...})` entry with `check: notImplemented("MTLxxx")` to
  `src/rules/<category>.ts`, above the `// new:rule inserts above this line` marker;
- writes a test stub and two placeholder fixtures (see section 4);
- prints a warning when the code is not a spec 4.3 row for that name.

A stub throws when run, so the rule counts as pending: its code must stay in
`tests/consistency/pending-rules.json` until the check is implemented. That file maps a
code to a short reason (it is `{}` when nothing is pending). If you added the spec row,
add the code there now, or `pnpm run check:rules` reports a rule that is neither
implemented nor pending.

## 3. Implement the check

In `src/rules/<category>.ts`, replace the stub with the real check. A check receives the
context of its phase (`FieldContext`, `TargetContext`, ...) and returns a list of
diagnostics, or a promise of one. Build diagnostics with the `report` helper so the
severity and code come from the rule:

```ts
const countMin = defineRule({
  code: "MTL401",
  name: "count-min",
  severity: "error",
  category: "bounds",
  phase: "field",
  step: "count",
  check: (context: FieldContext): Diagnostic[] => {
    // read the tag from context.templateField, the value from context.value
    return [report(countMin, `Field '${context.key}': list has ...`)];
  },
});
```

Rules of the road:

- The message is the spec 4.3 text, character for character.
- No tag regex outside `grammar/*.g4`. Value patterns (case styles, dates) live in the
  rule files or `src/engine/values.ts`.
- No `any`. Scripts and configs are TypeScript only (a guideline; `check:rules` does not
  enforce it).
- Do not hand-edit `src/generated/`.
- A rule that emits several findings in a step that needs item or section order uses
  `reportItem` (io) or `reportSection` (content, optional 4th argument `anchorLine`) from
  `src/engine/rule.ts`; see the
  "Emission order" section of [architecture.md](architecture.md#emission-order-spec-41-84).
- A `target` rule whose finding is about one target line it alone knows records that line
  as the anchor (`reportOnLine` or `setAnchorLine`, spec 4.4 DIR5), so a disable directive
  can cover it; field findings get the key line from the pipeline. See "Anchor lines" in
  [architecture.md](architecture.md#anchor-lines-spec-44-dir5).
- Remove the code from `tests/consistency/pending-rules.json` once the check is real.

## 4. Write the tests and fixtures

Layout (the same names are used by every existing rule):

| Kind                      | Test file                                         | Fixtures                                                               |
| ------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------- |
| Phase `field`, `target`   | `tests/target/<category>/<MTLxxx>-<name>.test.ts` | `tests/fixtures/pairs/<MTLxxx>/<case>/template.md` and `.../target.md` |
| Phase `parse`, `template` | `tests/syntax/<category>/<MTLxxx>-<name>.test.ts` | `tests/fixtures/templates/<MTLxxx>/<case>.md`                          |

Case names (descriptive kebab-case, `pass-` or `fail-` prefix, never numbered) follow the
fixture naming rules of [CONTRIBUTING.md](../CONTRIBUTING.md#tests). A rule needs at least one
`pass-` case and at least one `fail-` case, with no upper bound on either. Put the silent
branches in `pass-` fixtures (add one `pass-` case per limit case, for example a value exactly
on a bound), and cover each distinct failure in its own `fail-` case.

- The scaffold writes `pass-placeholder` and `fail-placeholder`. Rename them (and the
  matching entries in the test) to describe what each case exercises.
- The test lists every case with its expected diagnostics, asserts that the fixture
  folder holds exactly those cases, and checks the rule is registered with the right
  category, severity, phase and step. See
  `tests/target/bounds/MTL401-count-min.test.ts` for a complete example.
- Tests never use the network. Inject a fake `io` (`createEnv`, `createMemoryIo`).
- The person or agent who writes the tests should not be the one who wrote the check
  (see [CONTRIBUTING.md](../CONTRIBUTING.md#tests)).

Every registered rule code needs its test file and a fixture folder under
`tests/fixtures/pairs/` (phase `field` or `target`) or `tests/fixtures/templates/` (phase
`parse` or `template`); `pnpm run check:rules` enforces it, with no exception, and fails on an
orphan fixture or a case table that differs from the fixture listing. The test file must name
its fixture folder as a quoted string (the scaffold writes `const DIR = "tests/fixtures/..."`);
`name: "..."` entries inside comments do not count. A control outside the pass-/fail- split
(for example "no tag, no diagnostic") lives in `tests/fixtures/rule-controls/<MTLxxx>-<name>/`
and is named, quoted, by the test of that code. A syntax test runs the
template through `--verify` (`verifyFixture` in `tests/helpers/verify.ts`); see
`tests/syntax/syntax/MTL010-unknown-field-tag.test.ts`.

### Fixtures with control characters

Some editors and agent tools drop control characters such as U+001C or U+0085 when they write a
file. `scripts/write-escaped.ts` writes the file from escape sequences instead, so no control
character appears in the command:

```bash
node scripts/write-escaped.ts tests/fixtures/pairs/MTLxxx/<case>/target.md 'line\n\u0085\nline\n'
```

Use single quotes: in PowerShell `$` and backticks expand inside double quotes, but `$` is safe
in single quotes. A `'` in the text must be doubled (`''`) in PowerShell.

- Two arguments: the path and the escaped text. Output is UTF-8, no BOM unless `\uFEFF` is in
  the text. It prints the path and the byte count.
- Escapes: `\n` `\r` `\t` `\\` `\xHH` (code point U+00HH) `\uHHHH` (a surrogate pair is fine, a
  lone surrogate is an error) `\u{H+}` (up to U+10FFFF). Any other escape or a trailing
  backslash is an error.
- Write area: only `tests/fixtures/` (create or overwrite) and the git-ignored `tmp/` (create
  only). Any other path fails with "writes are limited to tests/fixtures/ and tmp/".
- Extensions: only `.md`, `.txt`, `.json`, `.yml`, `.yaml` (case-insensitive). Anything else,
  including no extension, `.ts`, `.js`, `.mjs`, `.test.ts`, `.ps1` or `.sh`, fails with
  "extension not allowed", so the script never writes a file that `pnpm test` or a shell would
  run. As a second guard, `vitest.config.ts` excludes `tmp/**` from the test run.
- Permissions: the existing `node scripts/*` allow row in `opencode.jsonc` is the effective
  gate; the `node scripts/write-escaped.ts *` row only documents this use and does not narrow it.
- The path is relative to the repo root (or absolute inside it). Exit 1 and nothing written
  when it is outside the root (links resolved to the real path), is a directory, or has a
  segment that is secret-like (`.env*`, `*.env`, `*secret*`, `*credential*`, `*.pem`, `*.key`,
  `id_rsa*`, `id_ed25519*`, `.ssh`, `.npmrc`, `auth.json`), `.git`, `node_modules`, a Windows
  device name (`NUL`, `CON`, `COM1`, ...), an 8.3 short name (any `~` plus digit, like `GIT~1`)
  or contains `:`. UNC (`\\host\share`), `\\?\` and drive-relative (`D:x.md`) paths are refused.
- Missing parent folders are created. An existing file is overwritten only inside
  `tests/fixtures/`, and not when it has hard links; in `tmp/` an existing file is never
  overwritten ("refusing to overwrite").

## 5. Adding a new tag

A rule that needs a new template tag touches five places (lexer, parser, AST, visitor,
category file). The list is in
[architecture.md](architecture.md#how-to-add-a-tag-5-places) and the reasoning in
[ADR 0002](adr/0002-grammar-structure.md).

After a grammar change:

```bash
pnpm run gen:parser    # empties and regenerates src/generated/ (antlr-ng, no Java)
pnpm run check:parser  # fails when src/generated/ differs from the grammars
pnpm run check:rules   # consistency check: grammar, visitors, AST kinds, ranges, spec codes
```

Commit the regenerated `src/generated/`; never edit it by hand. `check:rules` builds one
sample sentence per grammar alternative from the parser ATN and runs it through the
production `document` rule. A new stage-2 token whose lexer rule is a negated set needs a
sample in `TOKEN_SAMPLES` (`tests/consistency/consistency.ts`); the check names the token
when it is missing. Also document the tag in [spec.md](spec.md) section 2 and the
README rule tables.

A rule without a new tag touches only the category file.

## 6. Quality gates

Run all of them before a commit, from the repository root:

```bash
pnpm run check:parser
pnpm run check:rules
pnpm run typecheck
pnpm run lint
pnpm run format:check
pnpm test
pnpm run build
```

Then update the docs that name the rule ([spec.md](spec.md), the README tables), add a `FIX_NOTES` entry in `scripts/syntax-doc/notes.ts` keyed by the code with the typical fix, then run `pnpm run gen:syntax-doc`. For a design decision, add an ADR (see [CONTRIBUTING.md](../CONTRIBUTING.md)).
