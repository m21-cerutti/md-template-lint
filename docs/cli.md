---
title: Command line
last_updated: 2026-11-11
---

# Command line

The commands, flags, exit codes and output formats of `md-template-lint`. The contract is
[spec.md](spec.md) sections 7 and 8; it wins over this page. The configuration file is described in
[configuration.md](configuration.md), the template syntax in [syntax-reference.md](syntax-reference.md).

The package installs two commands that run the same program: `mdtl` and `md-template-lint`. This page
writes `mdtl`. Until the package is published, run it from a built clone: `node dist/cli.js` stands for
`mdtl`.

## Synopsis

```text
mdtl [options] [files...]
mdtl --verify [options] [templates...]
```

Without `--verify` the command lints targets against the templates of the config. With `--verify` it
only checks the syntax of templates.

## Flags

| Flag              | Meaning                                                                                                                 |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `--config <path>` | Config file (also `--config=<path>`). Default: `md-template-lint.yml`, searched in the working directory, then upward.  |
| `--format <name>` | `text` (default), `plain` or `json` (also `--format=<name>`). Any other value is `MTL922`.                              |
| `--quiet`         | Text formats only: print only failing files, broken templates, template errors and run errors. JSON is always complete. |
| `--verify`        | Check the template syntax only. No target is read, and the network is not used.                                         |
| `--version`       | Print the package version and exit 0.                                                                                   |
| `--help`, `-h`    | Print the usage and exit 0.                                                                                             |

- `files...` are the targets to lint (see [Full run and file arguments](#full-run-and-file-arguments)). With `--verify` they are
  the templates to check.
- `--help` and `--version` win over every other argument (`--help` wins over `--version`).
- `--` ends the options; what follows are files.
- A flag that needs a value (`--config`, `--format`) and gets none (nothing follows, the next argument
  starts with `--`, or the value is empty) is `MTL921`. An unknown option is `MTL920`. Both exit 2 and print
  a hint. The legacy flags `--pattern`, `--dir`, `--ignore` and `--base-dir` do not exist (see
  [migration.md](migration.md)).
- `--help` and the text-format `--verify` report end with the line `Template syntax reference: <URL>`, a
  link to [syntax-reference.md](syntax-reference.md).

## Exit codes

| Code | Meaning                                                                                                                                          |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `0`  | No file with errors, no broken template, no template error, no run error. Warnings may exist. Also `--help` and `--version`.                     |
| `1`  | A target has an error, a template is broken, or a template has a template error (`MTL017`, `MTL018`, `MTL019`, `MTL030`). There is no run error. |
| `2`  | A run error occurred: usage, config, missing root, template or target file, or an unexpected failure of the program. It outranks `1`.            |

Warnings never change the exit code. A diagnostic that a
[disable directive](syntax-reference.md#disable-directives-target-files-only) suppresses is removed
before anything counts it. The codes are listed in the
[error codes](syntax-reference.md#error-codes) of the syntax reference. Codes are never renumbered or
reused: a script may rely on a code (a change needs a PR discussion and a breaking-change note).

## Full run and file arguments

- **Full run** (no file argument): load the config and run every pair on every root it names.
- **File arguments** (lint-staged mode): each argument is a path relative to the working directory, or
  absolute. A file is a target of a pair when its path relative to the root matches an `include` glob and
  no `exclude` glob. A file that matches no pair is skipped silently. A file that matches a pair but does
  not exist is `MTL912` (the other files are still linted). The output order does not follow the argument
  order.

```bash
mdtl                                      # every pair of md-template-lint.yml
mdtl docs/adr/0002-second.md              # only this file
mdtl --config tools/md-template-lint.yml  # another config file
mdtl --format json                        # one JSON document on stdout
mdtl --quiet docs/adr/0002-second.md      # failures only
```

## `--verify`

`--verify` parses the templates and prints their schema: each field with its inferred type and rules,
each heading of every level H1 to H6 with its rules, and a section per template problem (unknown,
malformed, misplaced and conflicting tags, invalid heading patterns, date fields without a format tag,
and the template errors). No target is read.

- `mdtl --verify` checks every distinct template of the config.
- `mdtl --verify path/to/a.md` checks those files and needs no config.
- With neither a config nor a template path the run fails with `MTL923` (exit 2).
- A broken template (`MTL001` to `MTL004` on the template) exits 1, and so does a template with a template
  error. A missing template path exits 2.
- The template warnings `MTL010` to `MTL016` are shown by `--verify` only and never change the exit code.

```bash
mdtl --verify
mdtl --verify templates/adr.template.md
```

## Output

`--format` selects one of three reporters:

- `text` (default): the layout with the glyphs `✓ ✗ ⚠ ℹ`. Color is used only on a terminal and only when
  `NO_COLOR` is unset or empty.
- `plain`: the same layout with the words `PASS`, `FAIL`, `INFO`, never colored.
- `json`: one JSON document on stdout and nothing else (run errors are inside it). The keys are
  `schemaVersion`, `tool`, `version`, `mode`, `config`, `results`, `runErrors`, `runWarnings`, `unmatched` and
  `summary` (with `suppressed` and `exitCode`). In `--verify` mode `results` is replaced by `templates`. A
  diagnostic that has a `line` also has `sourceLine`.

Run errors in the text formats go to stderr as `error MTLnnn: <message>`. Every printed path is relative to
its root and uses `/`. The output order is fixed: roots in declaration order, pairs in config order, files
sorted. A diagnostic that has a line is followed by the text of that line (and a `^` row when it has a
column). The line is sanitized: control and invisible characters are escaped, and it is cut after 100
characters.

Text output of a full run (shortened):

```text
mdtl <version>
Config: md-template-lint.yml
========================

Template: templates/note.template.md
Target:   docs/*.md (1 file(s))

  ✗ docs/note.md
      error MTL701 Section 'Details': [content:non-empty] section body is empty
        23 | ## Details
      warn  MTL202 Unknown key 'extra' not present in template
        14 | extra: x

========================
Summary
========================
Total files:  1
Passed:       0
Failed:       1
Warnings:     1 (in 1 file(s))
Suppressed:   7
Templates:    1 checked, 0 broken

Failed files:
  - docs/note.md

========================
```

The `Suppressed:` line appears only when a directive suppressed something. `--quiet` prints no summary.

## Paths and backslashes

Slash and backslash are both accepted in every path argument and in `--config`, on every OS. Absolute paths
work on any drive:

```powershell
mdtl D:\notes\adr\0003-third.md
mdtl "E:/work/project/docs/adr/0004-fourth.md"
mdtl --config C:\tools\md-template-lint.yml D:\notes\adr\0003-third.md
```

A file on another drive than the config is linted only when it lies under a root of a pair (for example a
`roots` entry on `D:`). Otherwise it matches no pair and is not linted; like any other unmatched file it
changes neither the exit code nor the text output, and the JSON report lists it under `unmatched`. The drive
letter is compared ignoring case. On Windows the directories of the root itself are compared ignoring case
too (`c:/notes` and `C:/Notes` are the same root); the part below the root stays case-sensitive, because
globs are case-sensitive on every OS. Paths inside the config file follow the rules of
[configuration.md](configuration.md#path-values).

## Disable directives

A target file silences codes locally with comments such as `<!-- md-template-lint disable-line MTL202 -->`.
The directive keyword is always `md-template-lint`, whichever command name runs the tool. Verbs, scope, the
list of codes that can be disabled and a complete example are in the
[syntax reference](syntax-reference.md#disable-directives-target-files-only). There is no flag and no config
key that disables a code for a whole run.
