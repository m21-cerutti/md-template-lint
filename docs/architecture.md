---
title: Architecture
last_updated: 2026-10-30
---

# Architecture

How the code is organised and why. The contract is [spec.md](spec.md); the grammar decisions are in
[ADR 0002](adr/0002-grammar-structure.md). When this file and the spec disagree, the spec wins.

## Overview

`md-template-lint` checks Markdown files (frontmatter and H1/H2 headings) against Markdown
templates. A template is the schema: its inline comments and heading suffixes carry bracket
tags. The tags are specified once, in the two ANTLR grammars in `grammar/`. A run goes in four
steps: the config loader reads `md-template-lint.yml` (pairs of template and glob), the runner
walks the targets of each pair, the pipeline parses each file and runs the rules of
`src/rules/<category>.ts` in a fixed order, and a reporter prints the diagnostics
(`MTLnnn` codes) as text, plain text or JSON. The CLI wraps these steps and sets the exit code.
The sections below detail each part.

Guides:

- [README](../README.md): install, usage, rule syntax by category, config reference, lint-staged.
- [Adding a rule](adding-a-rule.md): scaffold, tests, fixtures, new tags, quality gates.
- [Migration](migration.md): replace the legacy wrappers and `approved_path.yml`.
- [Contributing](../CONTRIBUTING.md): setup, gates, commit style, ADR process.
- [ADR 0006](adr/0006-parity-reached.md): result of the comparison with the legacy linter.

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
| `src/config/load.ts`               | `loadConfig`: discovery, `yaml` parse, located validation (`MTL901` to `MTL908`).    |
| `src/config/paths.ts`, `glob.ts`   | One path resolver (spec 6.2, D04); globs to regex plus a walk base (spec 6.4).       |
| `src/config/types.ts`              | `LintConfig`, `PairConfig`, `ConfigResult`, `RunDiagnostic` (`MTL9xx`).              |
| `src/runner/run.ts`                | `runLint`: roots, pairs, template cache, pipeline calls, run diagnostics, exit code. |
| `src/runner/walk.ts`, `types.ts`   | Target discovery (include minus exclude, sorted); the plain-data `RunResult`.        |
| `src/reporters/`                   | `report`: `pretty`, `plain`, `json`; `cleanText` sanitizing of echoed values.        |
| `src/io/`                          | `createRealIo`: production `RuleIo` (`exists`, hardened `probeUrl`).                 |
| `src/runner/list.ts`, `verify.ts`  | File-list matching (lint-staged mode); `verifyConfig` / `verifyPaths` (`--verify`).  |
| `src/runner/files.ts`, `template.ts` | Strict UTF-8 read and path checks; template load shared by lint and `--verify`.    |
| `src/runner/schema.ts`             | `describeTemplate`: filename convention, fields (type, rules), headings (`--verify`). |
| `src/cli.ts`, `src/cli/`           | Process entry (`bin`), `execute` catch-all, argument parser, `runCli`, `--verify` reporter, version. |

The CLI is described in [CLI](#cli) below. It calls `loadConfig`, `createRealIo`, `runLint` (or
`verifyConfig` / `verifyPaths`) and `report`, all exported from `src/index.ts`.

## Run flow: config, runner, pipeline, reporters

```text
md-template-lint.yml
  -> loadConfig({ cwd, configPath?, home?, boundary? })      src/config/load.ts
       discovery (6.1): --config, else cwd then each parent
       yaml parseDocument + LineCounter; walk the NODES (no toJS), so each error has
         file, line, column and key path; errors are collected and sorted by position
       one path resolver (6.2): ~, C:/ and C:\, /x, relative; \ read as /; .. folded
       globs compiled (6.4) -> regex + literal base directory (the walk starts there)
       -> ConfigResult { ok: true, config } | { ok: false, errors: RunDiagnostic[] }
  -> runLint(configResult, { io, registry? })                 src/runner/run.ts
       not ok: no lint, result with the config errors, exit 2
       roots: project first, then `roots` in declaration order (8.4); each root dir
         checked once (MTL909); per root the pairs that list it, in config order
       per pair-root: template stat (MTL910 / MTL911, once per pair, pair skipped);
         targets (walk, include minus exclude, sorted, template itself skipped);
         none -> MTL913 per onEmpty; template read + checkTemplate ONCE per resolved
         path (cache); broken -> TEMPLATE ERROR block, files not linted, other pairs go on
       each file: strict UTF-8 read, checkTarget(registry, template, text, rootRelativePath, env)
         env = { aliases, approvedPaths, pairRoot = root dir (D11), io }
         target parse failures (MTL001 to MTL004) get the `Parse error: ` prefix (4.1)
       -> RunResult { blocks, brokenTemplates, runErrors, runWarnings, unmatched, summary }
  -> report(result, { format: "pretty" | "plain" | "json", version, color?, quiet? })
       -> { stdout, stderr }; run errors go to stderr as `error MTLnnn: message (file:line:col)`
```

- Exit code (spec 7.5) is `summary.exitCode`: 2 with any run error, else 1 with a failed file or
  a broken template, else 0. `MTL913` with `warn` is a run warning (exit 0), with `error` a run
  error (exit 2), with `ignore` nothing.
- `pretty` is the wrapper layout of spec 8.2 with Unicode glyphs, ANSI color only when the caller
  passes `color: true` (the CLI decides from the terminal and `NO_COLOR`). `plain` is the same
  layout with ASCII words (`PASS`, `FAIL`, `INFO`) and never colored. `json` is spec 8.5.
- `Diagnostic.heading` (spec 8.1) is set by the pipeline for `MTL601` to `MTL603` (from the
  template heading anchor line) and `MTL701` to `MTL705` (from the section index, only when
  `reportSection` recorded one: an untagged finding gets no heading). Both anchors
  stay transient: the anchor line and the `WeakMap` indices remain the sort keys, `heading` is
  only added after the sort. `field` is not emitted (spec change C07).
- Templates and targets are read by the runner, not by the pipeline. The runner never lets a
  grammar bug pass as a user diagnostic: `InternalParseError` propagates.

## CLI

`src/cli.ts` (shebang, built to `dist/cli.js`, the package `bin`) only reads the process: arguments,
working directory, `stdout.isTTY`, `NO_COLOR` (set and not empty). It writes what `execute` returns
and sets `process.exitCode` (never `process.exit`, so a pipe is flushed). `execute`
(`src/cli/main.ts`) is `runCli` behind a catch-all: an unexpected exception (a grammar bug,
`InternalParseError`, an I/O failure, also while reading the process) is exit 2 with the fixed shape
`error: unexpected failure (<code or name>)`, for example `(EACCES)` or `(TypeError)`. The error
message is never printed, because it can carry an absolute path (the path-free policy of `readUtf8`).
All behaviour is in `runCli(argv, env)` (`src/cli/run.ts`): `argv` in,
`{ stdout, stderr, exitCode }` out, with `env = { cwd, home?, boundary?, isTty, noColor, version?,
createIo? }`, so the tests call it without a process.

```text
runCli(argv, env)
  parseArgs                                        src/cli/args.ts
    --help / -h, then --version win over everything (looked up first, before any error)
    --config <path|=path>, --format <text|plain|json> (=value too), --quiet, --verify, --, files
    MTL920 unknown option, MTL921 missing value, MTL922 bad --format value: stderr
      `error MTLnnn: message` + `Try 'md-template-lint --help' for usage.`, exit 2
  lint (default):
    loadConfig({ cwd, configPath, home, boundary })
    io = createIo({ allowPrivateNetworks: config.allowPrivateNetworks })   ONE per run, none when
                                                    the config failed (nothing is linted)
    runLint(loaded, { io, files? })                 files = the positional arguments, if any
    report(result, { format, version, color, quiet })
    exit code = result.summary.exitCode
  --verify:
    arguments given: verifyPaths({ cwd, home, paths })   the files ARE the templates, no config read
    none: loadConfig, then verifyConfig; no config found (MTL901, no --config) is MTL923
    reportVerify(result, ...) (src/cli/verify-report.ts); no io is built
```

- `--format text` is the `pretty` reporter, `plain` and `json` are the same names. Color only when
  `format` is `text`, stdout is a terminal and `NO_COLOR` is unset or empty. `--quiet` shrinks the text
  formats only (spec 7.1).
- Exit codes are spec 7.5 and come from the result, not from the CLI: 0 clean, 1 failed file or broken
  template, 2 run, config or usage error (a run error outranks a failed file). `--help` and `--version` are 0.

### File-list mode (lint-staged)

`runLint(loaded, { io, files: { cwd, home?, paths } })` (`src/runner/list.ts`, `run.ts`). Each argument
is resolved by the config resolver (`resolvePath`: relative to `cwd`, absolute with `/` or `\`, `~`,
`..` folded) and de-duplicated: the same file in two spellings (`docs/a.md`, `./docs/a.md`, the absolute
path, the backslash form) is one argument; below the root the case counts, so `DOCS\A.MD` is another
argument that matches no include (globs are case-sensitive, AS5) and never hides `docs/a.md`, in either
order. For every root and pair, a file is a target when `relativeInside(file, root, ignoreRootCase)`
matches an include glob and no exclude glob, and it is not the pair's template (`compileGlob` /
`matchesGlob` results already held by the pair). This is a path test only; no file system access.

The directories from the file system root down to the root of the pair are compared WITHOUT regard to
case on Windows (`ignoreRootCase`, default `process.platform === "win32"`; `relativeInside` in
`src/config/paths.ts` keeps its case-sensitive default for every other caller). The file system ignores
case there, so with the working directory typed `c:/projects/x` the path `C:/Projects/x/docs/a.md` that
lint-staged passes is in the project; compared case-sensitively it would be "matches no pair" and the gate
would pass silently (fail open). Only that part is folded: the rest of the path keeps its case and still
meets the case-sensitive globs. Two spellings of the root that name one target are linted once.

- A root where no pair matches any argument is skipped before the root directory is checked (no
  `MTL909` for an unrelated root). A pair with no match is silent: no `MTL913` in this mode (spec 7.4).
- A matching file that is not a regular file is `MTL912` (`target not found: <path as shown>`), once per
  file whatever the number of pairs, exit 2. The other files are still linted (change C01).
- A file that matches no pair on any root is skipped and listed in `RunResult.unmatched` (printed
  paths: relative to the working directory when inside it, else absolute, always `/`). The JSON
  document has it; the text formats do not print it. A file that does not exist and matches no pair is
  also only skipped (assumption: the path test comes first, as in spec 7.2: "a file matching no pair
  is ignored silently").
- Output order is spec 8.4 (root, pair, sorted path), not argument order. A file matching two pairs is
  linted once per pair.
- Long lists: the arguments are one array and matching is linear in files times pairs and roots; there
  is no limit in the tool. lint-staged splits a very long list into several calls (the shell limit,
  for example 8191 characters in `cmd.exe`); every call is an independent run with its own summary.

### `--verify`

`src/runner/verify.ts` parses each DISTINCT template once (dedupe by resolved path, pair order) with
`loadTemplate` (the same function the lint run uses) and returns a `VerifyResult` (`mode: "verify"`).
No target is read, no io exists, no URL is probed. Broken (`MTL001` to `MTL004`, also a file that is not
UTF-8) is `TEMPLATE ERROR` and exit 1; a missing template is `MTL910` and a directory `MTL911` (exit 2,
no `(pair '...')` suffix when the path came from the command line); tag warnings `MTL010` to `MTL013`
do not fail. A run error outranks a broken template: one missing and one broken template is exit 2
(spec 7.5), and both are still reported.

The schema of an ok template (`src/runner/schema.ts`, `describeTemplate`) is plain data read from the
`DocumentModel` the engine built (inferred field types, parsed tags, H1/H2 sections); there is no
second parser. It has `filenameCase` (the `[filename:case:...]` convention or null), `fields`
(`name`, `type`, `rules[]`) and `headings` (`level`, `text`, `rules[]`).

Rule tokens spell the tag without brackets: `presence:required|optional|exist|template-only` or
`presence:conditional:<text>`, `format:constant:<v>`, `format:snake_case|kebab-case`, `format:elements:<style>`, `value:filename`,
`count:min:N`, `count:max:N`, `range:min:<n>`, `range:max:<n>`, `order:ascending`,
`format:scheme:<a,b>` (sorted, unique), `io:exists`, `enum:<a|b>` (field type `enum`, options from the
value split on ` | `, the one `enumOptions` of `src/rules/type.ts`, shown for fields whose type is `enum`
only). Field order is the spec 8.3 order: presence, constant, case, elements case,
value-filename, count min and max, range min and max, order, scheme, io, enum. When a tag kind that
can appear once is written twice the first one counts (spec 2.1). Presence is ALWAYS the first rule, as
in the legacy `describe()`: the effective mode (conditional, then optional, then required; `required`
when no presence tag is written), and a conditional one carries the text of its first tag
(`presence:conditional:only when risky`). Headings: presence first (conditional, template-only, exist,
optional, required, always printed), then `content:non-empty`, `content:table`, `content:list`,
`content:min-lines:N`, `content:max-lines:N`.

Text (`src/cli/verify-report.ts`), per ok template: `  ✓ <path>` (`PASS` in plain), the
`Filename: [filename:case:<c>]` line only when declared, the `Field  Type  Rules` table (name and type
columns padded to the widest, two spaces between columns, `-` for no rule, and under the header a run of
`-` of the HEADER LENGTH as in spec 8.3 and the legacy `describe()`: 20 for `Field  Type    Rules`, 18 for a
template with no field, where the table is these two lines only), `Headings:` (`  ## Text (rules)`; the
section and its blank line are left out when the template has no heading), then
the sections `Unknown tags found (typo or unimplemented feature):` (fields first, then headings),
`Malformed tags:` and `Misplaced tags:` (the last two with line and column), always in this order whatever
the order in the template. They come from the template warnings, so a template with no tag problem has
none of them. A malformed or misplaced heading tag stays in the heading text (the heading extraction keeps a
bracket it does not recognise, spec 2.6); that is implementation-defined, spec 8.3 covers unknown heading
tags only. Every echoed string (field names, types, rules, heading texts) goes through `cleanText`. A broken template is
`  TEMPLATE ERROR: <path> - <message>` instead. `--quiet` hides the schema and shows only broken
templates and run errors.

JSON is `mode: "verify"` with `templates[]` of `{ path, status, error?, filenameCase, fields, headings,
diagnostics }` (a broken template has `error`, `filenameCase: null` and empty `fields`, `headings`,
`diagnostics`; `diagnostics` of an ok one are its tag warnings), `runErrors`, `runWarnings`, `summary`.

## Reporter sanitizing and UNC paths

`cleanText` (`src/reporters/sanitize.ts`) is applied to every echoed string in all three formats
(messages, headings, paths, descriptions, pair and root names). Line breaks and other
whitespace controls become one space, every other C0/C1 control, DEL and the bidi controls
(U+202A to U+202E, U+2066 to U+2069, U+200E, U+200F, U+061C) and U+FEFF are shown as `\xNN` or
`\uNNNN`. A document value holding an ANSI escape therefore cannot move the cursor, clear the
screen or flip the text direction of a terminal, a CI log or a JSON viewer.

UNC paths: EVERY path value of the config is resolved lexically and may be UNC
(`\\server\share`, read as `//server/share`): `aliases`, `approvedPaths`, `roots`, `template`
and `templateRoot`. On Windows, any file system access to such a path (`exists` for an alias or
an approved path, the directory listing of a root, the read of a template) makes the operating
system open the share, which sends the user's NTLM credentials to that server over SMB
(credential disclosure or relay, OWASP A10). The tool does not block UNC values: the config
file is trusted (spec 2.8 trust boundary). Configure a UNC path only for a server you trust,
and review a config from an untrusted source before running it. Document values are not part of
this: they only feed `exists` and are gated by `approvedPaths`.

## Production RuleIo (`src/io/`)

`createRealIo({ allowPrivateNetworks?, fetch?, resolve?, maxUrls?, hardCapMs? })` returns the
`RuleIo` the runner is given (`runLint` takes `io` as a required option, like `checkTarget`).

| Requirement (A12.11, OWASP A10) | Where                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------ |
| Scheme allow-list `http`, `https`, before any I/O | `probe` in `src/io/index.ts`; others: `unsupported scheme`      |
| `redirect: "manual"`, 3xx is reachable, never followed | request init; the default transport never follows        |
| Blocked by default: 0.0.0.0/8, loopback, link-local (169.254/16, fe80::/10), multicast and reserved, cloud metadata, IPv4-mapped, -compatible and -translated IPv6, Teredo, NAT64 local use, every IPv6 outside 2000::/3 and fc00::/7, `localhost`, numeric IP spellings | `src/io/address.ts`, `hostProblem` |
| Private ranges (RFC 1918, 100.64.0.0/10, fc00::/7) only with `allowPrivateNetworks: true` in the config | `isAddressAllowed`; loopback, link-local and metadata stay blocked |
| RESOLVED address checked, at connect time too (DNS rebinding) | pre-check in `hostProblem`; `createGuardedLookup` in the default transport (`src/io/transport.ts`) |
| Userinfo stripped, no cookies or auth header, fixed User-Agent, no proxy | `probe`; `node:http(s)` with `agent: false` ignores proxy variables |
| `AbortSignal.timeout(5000)` per request, 10 s hard cap per URL, body cancelled at once, never read | `probe` |
| Run budget: a URL is probed once, at most `maxUrls` (100) different URLs | `probeUrl` cache                     |
| Never throws; reason from a fixed vocabulary | `reasonOf`: `HTTP <status>`, `timeout`, `DNS failure`, `connection refused`, `blocked address`, `unsupported scheme`, `invalid URL`, `url budget exceeded`, `request failed` |
| `exists` swallows every OS error and a NUL byte | `exists`; the rule passes the folded path it judged                    |

Numeric IP spellings (`2130706433`, `0x7f000001`, `0177.0.0.1`, `127.1`, fullwidth digits,
ideographic dots) are folded to dotted quads by the WHATWG URL parser. `hostProblem` reads the
host as written back from the URL text (any number of slashes after the scheme, so `http:/134744072/`
and `http:134744072` too; tab, LF and CR removed as the parser does) and refuses an IPv4 host that
was written any other way than its dotted quad, public address or not. When the written host cannot
be read back, the URL is refused (fail closed). A host name is resolved in its punycode form;
`localhost`, `localhost.` and `*.localhost` are refused without a lookup. A zone id (`%25eth0`) is
not valid in a URL host: `invalid URL`. The default
transport is `node:http` and `node:https` with a `lookup` hook, not `fetch`: the global `fetch`
cannot hook the address used by the socket without a second package. The transport has the
shape of `fetch` (`redirect`, `signal`, `credentials`), so tests inject a fake and the guard is
tested apart (`tests/unit/io/`).

Tests never use the network: `fetch` and `resolve` are injected, and the rebinding test
resolves to a loopback address at connect time, which is refused before any socket opens.

A16b decision on `..` traversal (ACCEPTED, spec 2.8): a relative or alias value may contain `..`
and leave the pair root or the alias root. The only operation on it is `exists`, a yes/no
answer turned into a warning; nothing is read, listed or printed from the target, so it is an
existence-only oracle. Absolute values are gated by `approvedPaths` (folded, case-sensitive
segments, fail closed), so a document cannot probe an arbitrary absolute path. The probe and
the containment test use the same lexically folded path. The config is trusted (spec 2.8): a
config author can already point `roots`, `aliases` and `template` anywhere.

Globs are case-sensitive on every OS (AS5). The walk starts at the literal base directory of a
glob and checks each base segment against the directory listing, so `Docs/*.md` never lists
`docs/` on a case-insensitive file system. Symbolic links to files are targets (spec 2.8), links
to directories are not traversed, dangling links are skipped.

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
- Reporters print the `Diagnostic` list: target diagnostics with the `Parse error: ` or
  `TEMPLATE ERROR` forms of spec 4.3 (template warnings in `--verify` are printed by
  `src/cli/verify-report.ts`).

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
5000). `checkTarget` takes `env` as a required argument (no default, so no caller gets an
in-memory io by accident). `createMemoryIo` and `createEnv` build the in-memory one for
tests: no network.

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

One exception, the `headings` step (kept from the legacy linter): the presence findings `MTL601` to `MTL603`
come in TEMPLATE HEADING order, interleaved across the three rules, not grouped by rule. Each
of these rules anchors its finding on the line of the template heading it is about (the
diagnostic `position`). After the step ran, the pipeline stable-sorts the anchored findings by
that line (one heading keeps registry order), clears the anchor (it is a template line, not a
target location) and appends the findings without an anchor, such as `MTL604`, which concerns
the whole heading list, last.

Second exception, the `io` step (legacy `_check_io_exists`): the findings `MTL801` to `MTL805`
of one field come in ITEM order, interleaved across the five rules, not grouped by rule (a list
`["docs/missing.md", "@gone/a.png"]` gives `MTL804` then `MTL801`). Each io rule reports through
`reportItem(rule, message, index)` (`src/engine/rule.ts`), which records the item index in a side
table (a `WeakMap`), never on the `Diagnostic`. After the step ran for one field, the pipeline
stable-sorts its findings by that index (`byItemIndex`; one item keeps registry order). Reporters
therefore never see the index: a diagnostic has exactly `code`, `severity`, `message`,
`position`. Fields stay in template order.

Third exception, the `content` step (legacy `validate_content`): the findings `MTL701` to
`MTL705` come in TEMPLATE SECTION order, interleaved across the five rules, not grouped by rule
(two empty sections `## A [content:table]` and `## B [content:non-empty]` give `MTL702` for A
then `MTL701` for B). Each content rule reports through `reportSection(rule, message, index)`
(`src/engine/rule.ts`), which records the template section index in a side table (a `WeakMap`),
never on the `Diagnostic`. After the step ran, the pipeline stable-sorts its findings by that
index (`bySectionIndex`; one section keeps registry order).

`checkTemplate` returns its tag warnings (`MTL010` to `MTL013`) sorted by source position
(line, then column) across rules; equal positions keep registry order.

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

The `pnpm run new:rule` scaffold (flags, what it writes, pending rules, test layout and
fixtures) is described in [adding-a-rule.md](adding-a-rule.md#2-scaffold-the-rule). A new rule
needs a row in the spec 4.3 code table; a rule that adds a tag also follows the five places above.

## Tests: rule cases

Every registered rule code has one test file and one fixture folder, with at least 1 `pass-` case
and at least 1 `fail-` case. There is no upper bound: several `pass-` cases are welcome to test
limit cases. Each case has its own fixture with a descriptive kebab-case
name (`pass-<name>` / `fail-<name>`, never numbered), and the test file holds a table that maps
the case name to the fixture and the expected result. No case text is written inline.

| Family | Test file | Fixtures | Code path |
| ------ | --------- | -------- | --------- |
| Template syntax (phase `parse` or `template`: `MTL001`-`MTL004`, `MTL010`-`MTL013`) | `tests/syntax/<category>/<MTLxxx>-<name>.test.ts` | `tests/fixtures/templates/<MTLxxx>/<case>.md`, one template, no target | `md-template-lint --verify --format json <case>.md` through `runCli` (`tests/helpers/verify.ts`); asserts code, severity, message, line and column, template status and exit code (0, or 1 when broken) |
| Target (phase `field` or `target`: `MTL101`-`MTL805`) | `tests/target/<category>/<MTLxxx>-<name>.test.ts` | `tests/fixtures/pairs/<MTLxxx>/<case>/template.md` + `target.md` | `checkTemplate` then `checkTarget` of `src/engine/pipeline.ts`; asserts the messages, severity and position of the code |

The run diagnostics `MTL9xx` are not rules (no registry entry, no rule file). They depend on a
config, a file system layout or the command line, so their cases live with the config, runner
and CLI tests below. `tests/fixtures/smoke/clean-project/` is the synthetic project that
`pnpm run smoke:pack` lints from the installed package.

`tests/consistency/rule-fixtures.ts` (run by `rule-fixtures.test.ts`, part of `check:rules`, and
on a fresh scaffold by `tests/unit/new-rule.test.ts`) enforces the layout: one fixture
family per code (syntax or target, from the phase), one test file per code, the split, the case
name format, the pair folder shape (exactly `template.md` and `target.md`), the case table equal to
the fixture listing (`name: "..."` entries outside comments), and no orphan fixture folder,
fixture case or test file. Controls outside the split (for example "no `[filename:case]` tag,
no `MTL101`") live in `tests/fixtures/rule-controls/<MTLxxx>-<name>/` and must be named by the
test of their code.

## Tests of config, runner, reporters and io

| Path                                  | Content                                                                        |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| `tests/unit/config/`                  | `validate` (one error kind per fixture), `discovery`, `naming`, `bytes` (invalid UTF-8, BOM + CRLF, zero byte), `paths`, `glob`. |
| `tests/unit/runner/`                  | `inputs` (MTL909 to MTL911, exit precedence), `empty` (`onEmpty`), `broken`, `parse` (`Parse error:`), `expand`, `io-wiring`, `unreadable`, `walk`. |
| `tests/unit/reporters/`               | `pretty`, `plain`, `json` against expected-output files, `cleanText`.          |
| `tests/unit/io/`                      | `address`, `probe` (refusal table), `probe-behaviour`, `connect-guard`, `exists`. |
| `tests/unit/cli/`                     | `usage`, `exit`, `list`, `list-large` (500+ arguments, temp folder) and `list-root-case` (root directory written in another case), `verify`, `schema` (expected table and JSON), `format`, `wiring` (injected `createIo`), `main` (catch-all), `version`, `layout`, `spawn` (`dist/cli.js`, skipped when missing or older than `src/`). |
| `tests/fixtures/cli/<case>/`          | One project per case: `exit-`, `list-`, `verify-`, `schema-` (a `template.md` with `expected.plain.txt` and `expected.json`), `format-`, `wiring-` (split), `usage-no-config` and `large-source-project` (one shared project each). |
| `tests/fixtures/config/<case>/`       | One config per case: `validate-` (split), `discover-`, `naming-`.               |
| `tests/fixtures/runner/<case>/`       | One project per case: `inputs-`, `empty-`, `broken-`, `parse-` (split), `expand-`, `io-`, `unreadable-`, `report-`. |
| `tests/fixtures/tags/<case>/`         | One `document.md` per case (`pass-` / `fail-`), read by `tests/unit/parser-comment-line.test.ts`. |
| `tests/helpers/`                      | Fixture paths, the pass/fail split check, runner and io fakes.                 |
| `tests/unit/smoke/`                   | Packaging (ADR 0005): the pure helpers of `scripts/smoke-pack.ts` and `scripts/smoke/check-release.ts` (`scripts/smoke/helpers.ts`: process invocation and quoting, tarball content, tag and repository checks, CLI expectations), `check-release.ts` as a process, and the workflows `.github/workflows/ci.yml` and `release.yml` plus the `package.json` publish fields. |
| `tests/fixtures/release/<group>/`     | One file per case (`pass-` / `fail-`): `manifest/`, `repository/` and `consumer/` (JSON: package.json fields, `repository` block, the smoke-test project after `pnpm add`) and `tarball/` (`.txt`: a `tar -tzf` listing). |

A group of fixtures shares a prefix (`inputs-`, `empty-`, `broken-`, `parse-`, `validate-`), so each
test file checks that its directories are exactly its cases (no orphan). Inside a group the case names
start with `pass-` or `fail-` (naming rules: [CONTRIBUTING.md](../CONTRIBUTING.md#tests)). Groups without
a pass/fail split (`discover-`, `naming-`, `expand-`, `io-`, `unreadable-`, `report-`) list their cases
without the prefix; the configs of the `report-`, `io-` and `unreadable-` projects start with a comment
that says why. The expected-output files `expected.*` are written from the spec 8.2 and 8.5 samples, not
generated. Bytes that cannot be text fixtures (invalid UTF-8, a BOM with CRLF, symbolic links) are built
in code in a temporary folder that the test removes.

`tests/fixtures/cli/` declares its group prefixes in `KNOWN_PREFIXES` (`tests/helpers/fixtures.ts`);
`fixtureDirs` throws on a directory of that area with an unknown prefix, so a misspelled prefix cannot
hide a fixture from every group. A group owns its fixtures: a test reads a fixture of another group only
when its header says so (`exit`, `verify` and `usage` for the neutral working directory
`usage-no-config`, `spawn` for four ready-made projects).

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
  pending; registered rules match the spec name, category and severity;
- every registered rule code has its rule-case test file and fixtures, and no fixture is an
  orphan ("Tests: rule cases" above, `tests/consistency/rule-fixtures.test.ts`); the `MTL9xx`
  run diagnostics are not rules.

## Legacy comparison harness (removed)

A harness once compared the port with outputs captured from the legacy linter and the wrappers.
The comparison finished on 2026-10-30 with every divergence documented, and the harness was
removed, then its sample data (phase A39). See [ADR 0006](adr/0006-parity-reached.md) for the
result and the commits that keep it.

## Coverage gate

`pnpm run coverage` runs the whole suite with v8 coverage (`vitest.config.ts`) over `src/**`, minus
`src/generated/**` (generated, checked by `check:parser`) and `src/cli.ts` (process entry, reached only
through the child process of `tests/unit/cli/spawn.test.ts`, which v8 does not see; its logic is in
`src/cli/`). It exits non-zero when lines, statements, functions or branches fall under 85% in any of
`src/engine/**`, `src/rules/**`, `src/tags/**` and `src/tags/*.ts` (the parser files without the
visitors). `pnpm test` is unchanged and does not collect coverage. Defensive branches that real input
cannot reach (the grammar has a catch-all everywhere) are covered by a hand-built argument in
`tests/unit/listeners-defensive.test.ts`, or removed when dead; thresholds are never lowered.
