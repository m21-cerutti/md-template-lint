---
title: Configuration
last_updated: 2026-11-11
---

# Configuration

The `md-template-lint.yml` file: its keys, defaults, paths, globs and the `io` options. The contract is
[spec.md](spec.md) section 6; it wins over this page. The commands and flags are in [cli.md](cli.md), the
template syntax in [syntax-reference.md](syntax-reference.md).

## Overview

One `md-template-lint.yml` per project. It is YAML, validated strictly: an unknown key is an error
(`MTL903`), and every config error is reported together before any linting (exit 2). YAML anchors and
aliases are not supported.

Discovery: `--config <path>` uses that file (missing: `MTL901`). Otherwise the tool looks for
`md-template-lint.yml` in the working directory, then in each parent up to the file system root; the first
match wins. The folder that holds the file is the implicit root `project`. `mdtl --verify` with explicit
template paths needs no config.

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

allowPrivateNetworks: false # optional, default false

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

A minimal config is one pair:

```yaml
pairs:
  - template: templates/adr.template.md
    include: docs/adr/*.md
    exclude: "**/README.md"
```

## Top-level keys

| Key                    | Type                      | Required | Default | Notes                                                                                                                                             |
| ---------------------- | ------------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `version`              | integer                   | no       | `1`     | Must be `1`, else `MTL908`.                                                                                                                       |
| `onEmpty`              | `warn`, `error`, `ignore` | no       | `warn`  | Policy when a pair matches no file (full run only), see [`onEmpty`](#onempty).                                                                    |
| `roots`                | map name to path          | no       | empty   | Names match `^[A-Za-z0-9_-]+$`; `project` is reserved (`MTL905`). The declaration order fixes the output order.                                   |
| `aliases`              | map name to path          | no       | empty   | The name is written without `@`, same name rule. Used by `@name/...` values with `[io:exists]`.                                                   |
| `approvedPaths`        | list of path              | no       | empty   | An absolute path value is probed by `[io:exists]` only inside one of these folders.                                                               |
| `allowPrivateNetworks` | boolean                   | no       | `false` | Lets `[io:exists]` URL probes reach RFC 1918, 100.64.0.0/10 and fc00::/7. Loopback, link-local, cloud metadata and IPv4-mapped IPv6 stay blocked. |
| `pairs`                | list of pair              | yes      | none    | Non-empty list of template and target pairs.                                                                                                      |

## Pair keys

Each item of `pairs`:

| Key            | Type                      | Required | Default   | Notes                                                                                                                                                       |
| -------------- | ------------------------- | -------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`         | string                    | no       | generated | Explicit names match `^[A-Za-z0-9_.-]+$` and are unique. Generated: file name of the template without its last extension, made unique with `-2`, `-3`, ...  |
| `template`     | path                      | yes      | none      | A relative path is relative to `templateRoot`.                                                                                                              |
| `templateRoot` | root name                 | no       | `project` | `project` or a declared root.                                                                                                                               |
| `roots`        | root name, list or `"*"`  | no       | `project` | Each name is `project` or declared (`MTL906` otherwise). `"*"` means every root declared under `roots` (not `project`). The pair runs once per listed root. |
| `include`      | glob or list of globs     | yes      | none      | Non-empty. A file is a target when it matches an include and no exclude.                                                                                    |
| `exclude`      | glob or list of globs     | no       | empty     | Same glob rules.                                                                                                                                            |
| `description`  | string                    | no       | none      | Shown in the `Target:` line of the output.                                                                                                                  |
| `onEmpty`      | `warn`, `error`, `ignore` | no       | global    | Overrides the global value for this pair.                                                                                                                   |

Another key at the top level or in a pair is `MTL903`; a wrong type, a missing required key or a bad value is
`MTL904`.

## Path values

`roots`, `aliases`, `approvedPaths` and `template` follow one resolver:

- `~` and `~/...` expand to the home directory.
- A drive letter followed by `/` or `\`, or a leading `/` or `\`, is absolute.
- Anything else is relative to the folder of the config file (a pair `template` is relative to its
  `templateRoot`).
- `\` is read as `/`, and printed paths always use `/`.
- A path need not exist when the config is validated. A missing root is `MTL909`, a missing template
  `MTL910`, a template that is not a regular file `MTL911`. These skip only the affected pair or root, the
  others still run, and the exit code is 2.

The config file is trusted. On Windows a UNC path (`\\server\share`) in any path value makes the operating
system contact that server, so use one only for a server you trust.

## Globs

`include` and `exclude` globs are matched against the path relative to the root, with `/` separators, and
are case-sensitive on every OS.

- `*` matches any characters except `/`; `?` one character except `/`.
- `**` as a whole segment matches zero or more segments (`a/**/*.md` matches `a/x.md`).
- `[abc]` is a character class; `{a,b}` is an alternation.
- Dot files and folders are matched like any other. Symlinked directories are not traversed.
- An invalid glob is `MTL907`: empty, absolute, containing `..`, starting with `!` (use `exclude` instead),
  unbalanced `[`, `{` or `}`, or a reversed class range.

## `onEmpty`

A pair and root combination that matches no file (full run only) raises `MTL913`:

| `onEmpty` | Text output                           | Exit |
| --------- | ------------------------------------- | ---- |
| `warn`    | stdout line `ℹ MTL913 <message>`      | 0    |
| `error`   | stderr line `error MTL913: <message>` | 2    |
| `ignore`  | nothing                               | 0    |

The pair value, when set, wins over the top-level value. A file argument that matches no pair is skipped
silently and never raises `MTL913`.

## `io` options: `approvedPaths`, `aliases`, `allowPrivateNetworks`

The `[io:exists]` template tag checks that a path or URL value of a target exists or answers. It applies to
the field types `path`, `list-of-path`, `url` and `list-of-url`. It is the only tag that reads the file
system or the network, and every finding is a warning (`MTL801` to `MTL805`). Three config keys bound it:

- `approvedPaths`: an absolute path value is checked only when it lies inside one of these folders. The
  list is empty by default, so an absolute path is skipped with `MTL803` (add the folder to the list to
  check it). A relative value is checked against the root of the pair.
- `aliases`: a value written `@name/...` is checked under the folder of alias `name`. An alias that is not
  declared is skipped with `MTL801`; aliases are never guessed.
- `allowPrivateNetworks`: URL probes refuse private address ranges unless this is `true`. Loopback,
  link-local and cloud metadata addresses, and `localhost`, are always refused.

URL probes use only `http` and `https`, send a `HEAD` request and then one `GET` if it fails, never follow a
redirect (a 3xx answer counts as reachable), send no cookies or credentials, and give up after 5 seconds per
request and 10 seconds per URL. A URL is probed once per run, and at most 100 different URLs are probed per
run. `--verify` never uses the network.

## What is not configurable

- There is no severity override: the severity of each code is fixed by the rule (see the
  [error codes](syntax-reference.md#error-codes)).
- There is no config key that disables a rule or a code. A target file suppresses codes locally with
  [disable directives](syntax-reference.md#disable-directives-target-files-only).
- Codes are never renumbered or reused (a change needs a PR discussion and a breaking-change note), so a
  code in a script, a CI filter or a directive stays valid across releases.
