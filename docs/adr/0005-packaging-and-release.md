---
id: 0005-packaging-and-release
title: Ship dist only, test the tarball, publish with Trusted Publishing
status: accepted
date: 2026-10-30
deciders: [owner]
---

# ADR 0005: Packaging, CI and release

The npm package holds `dist/`, `LICENSE`, `THIRD_PARTY_NOTICES.md` and `README.md` (plus the
always-included `package.json`). CI runs every gate on three operating systems and three Node
versions. A tag `v*` publishes the tarball that the smoke test installed, with npm Trusted
Publishing and provenance. No secret is used.

## Context

Phase A30 prepares the first release. Facts that shape the decision:

- `engines.node` is `>=22.18` ([ADR 0004](0004-typescript-scripts.md)); the package manager is
  pnpm ([ADR 0003](0003-pnpm.md)).
- `tsc -p tsconfig.json` (rootDir `src`) writes `dist/` with `.js`, `.d.ts`, `.js.map` and
  `dist/engine/ranges.json`. It emits no test and no script.
- `src/generated/` is produced by `antlr-ng` and compiled into `dist/generated/`. The licence of
  `antlr-ng` output is not stated by the tool (open item below).
- Publishing is a human step: agents never run `npm publish` or `pnpm publish`, and never push.
  The owner pushes a tag; GitHub Actions then publishes.
- A tarball that only works from inside the clone (a missing file, a wrong `bin`) is the usual
  first-release failure.

## Decision

- **`files` whitelist** in `package.json`: `dist`, `!dist/**/*.map`, `LICENSE`,
  `THIRD_PARTY_NOTICES.md`, `README.md`. Source maps are left out because their sources are not
  shipped. `main`, `types`, `bin` and a new `exports` map (`.` and `./package.json`) all point
  into `dist`. `exports` closes deep imports into `dist/`: the public API is `dist/index.js`.
  A unit test (`tests/unit/smoke/workflows.test.ts`) pins these fields.
- **`prepack` runs `pnpm run build`**, so a tarball is never packed from a stale or missing
  `dist/`. No `prepublishOnly`: `prepack` already runs before a publish from the source tree, and
  the release publishes a ready tarball (no lifecycle script runs for it).
- **Smoke test** `pnpm run smoke:pack` (`scripts/smoke-pack.ts`, pure helpers in
  `scripts/smoke/helpers.ts`): packs (or takes `--tarball <file>`), lists the tarball with
  `tar -tzf` (no shell) and checks the listing, installs the tarball with `pnpm add` into an empty
  temp project outside the repository, then runs the installed `bin`. Tarball check: required
  `package.json`, `README.md`, `LICENSE`, `THIRD_PARTY_NOTICES.md`, `dist/cli.js`,
  `dist/index.js`; forbidden any `.map`, any file outside `dist/` and those four root files, and
  anything under `tests/`, `scripts/`, `src/`, `legacy/`, `tmp/`. CLI check, through the real shim
  of `node_modules/.bin` (`.cmd` on Windows, started with quoted arguments, never with raw
  `shell: true`) and once with `node <bin file>`: `--version` (exit 0, prints the package version
  and a newline), a copy of the synthetic fixture project `tests/fixtures/smoke/clean-project`
  (exit 0, "All files passed!") and an unknown option (exit 2, `error MTL920` and the usage hint on stderr).
  `--offline` passes through to `pnpm add` when the store is warm. The temp directory is removed.
  It needs the network (`pnpm add` fetches the two runtime dependencies), so it is a CI and
  release check, not a mandatory pre-commit gate.
- **CI** (`.github/workflows/ci.yml`): `ubuntu-latest`, `windows-latest`, `macos-latest` times
  Node `22.18`, `24`, `26`. Steps: checkout, `pnpm/action-setup` (version from `packageManager`),
  `actions/setup-node` with the pnpm cache, `pnpm install --frozen-lockfile`, then `check:parser`,
  `check:rules`, `typecheck`, `lint`, `format:check`, `test`, `build` (a `parity` step ran after `build` until 2026-10-30, removed by
  [ADR 0006](0006-parity-reached.md)); the smoke test
  runs on ubuntu only. `permissions: contents: read`; no secret, no OIDC token, nothing is
  published. **CI differs from the release on purpose:** it keeps the third-party
  `pnpm/action-setup` and the pnpm cache because it builds nothing that is shipped and holds no
  write permission; the cache speeds up nine jobs. The release workflow builds the shipped
  artifact, so it uses neither (next item).
- **Release** (`.github/workflows/release.yml`): trigger on a tag `v*`, plus `workflow_dispatch`
  as a dry run that never publishes. Job `verify` (`contents: read`) runs
  `node scripts/smoke/check-release.ts "$TAG" "$REPOSITORY"` (tag must be exactly `v<version>`;
  `repository.url` must be `https://github.com/<repository>.git`, optionally `git+https`, anchored
  so `owner/name` never matches `owner/name-longer`; the rules are `checkRelease` in
  `scripts/smoke/helpers.ts`, unit tested; `${{ github.repository }}` is passed through `env`),
  runs the gates, `pnpm pack`, the smoke test on that tarball, and uploads the tarball as an
  artifact. Job `publish` (needs `verify`; tag push only, not on a fork:
  `github.event_name == 'push' && github.event.repository.fork == false`) runs in the GitHub
  environment `release`, has `contents: read` and `id-token: write`, downloads the artifact and
  runs `npm publish <tarball> --provenance --access public`. The tested file is the published
  file. `id-token: write` appears once in the file, in the publish job, so the gates never hold an
  OIDC token.
- **No third-party action and no cache in the release path.** `verify` builds the tarball that is
  published with provenance, so it does not run `pnpm/action-setup` (a mutable third-party tag
  that would execute with the build). pnpm comes from Corepack (`corepack enable`, shipped with
  Node 24), which reads the exact version from `packageManager` in `package.json`. The job also
  restores no cache (`setup-node` without `cache`), so a poisoned cache entry from an earlier run
  cannot reach the artifact. The only actions left are GitHub-owned (`actions/*`), pinned by major
  tag. `tests/unit/smoke/workflows.test.ts` asserts that `pnpm/action-setup` and `cache` are
  absent from `release.yml`.
- **Environment `release`.** The publish job declares `environment: release`. The owner configures
  it in the repository settings (Settings, Environments, `release`): required reviewers (a human
  approves every publish), a deployment branch and tag rule that allows only `v*` tags, and, in
  the repository rules, tag protection for `v*` so only the owner can create such a tag. Without
  these settings the environment is created empty on first use and approves nothing; the owner
  must set them before the first tag.
- **Trusted Publishing:** no `NPM_TOKEN`, no secret. npm trusts the workflow through OIDC; it
  needs npm 11.5.1 or newer. The publish job installs one exact version
  (`npm install --global npm@11.21.1`, never a range or `latest`), so a new npm release cannot
  change what publishes; raising it is a reviewed change. One-time owner setup on npmjs.com:
  add a Trusted Publisher for this GitHub repository, workflow file `release.yml` (and the
  environment name `release` if npm asks for it). Whether the package page must exist before the
  first publish was not verified; if it must, the owner bootstraps the first version by hand.
- **Actions** are pinned by major version tag.
- **Open owner decision: licence of the `antlr-ng` generated output.** The generated parser ships
  in `dist/generated/`. Neither `antlr-ng` nor `antlr4ng` states a licence for generated output.
  [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md) records it as open. No legal conclusion is
  drawn here. The owner decides before the first publish; the release stays blocked on it.

## Consequences

- The package is small and predictable: `dist/**` (without maps), three named root files
  (`LICENSE`, `THIRD_PARTY_NOTICES.md`, `README.md`) and `package.json`. The smoke test fails when
  the real tarball holds anything else.
- Every release runs the full gate set and an install from a clean directory before any publish.
- No long-lived token exists to leak; a compromised fork cannot publish (Trusted Publisher is bound
  to this repository and workflow).
- The workflows cannot be run locally. They are checked by `tests/unit/smoke/workflows.test.ts`
  (valid YAML, permissions, matrix, no secret, provenance in the release workflow only) and by the
  first real run on GitHub, which is not verified yet.
- The smoke test reads the synthetic project `tests/fixtures/smoke/clean-project`
  (`SMOKE_PROJECT` in `scripts/smoke-pack.ts`; repointed in phase A39).
  `tests/unit/smoke/helpers.test.ts` checks that it lints clean.
- CI uses `pnpm/action-setup@v6` with pnpm 11; its README recommends `pnpm/setup` for pnpm 11+.
  If that step fails on GitHub, switching is a one-step change (CI only). The release workflow's
  `corepack enable` with pnpm 11 is also unverified until the first run (a dry run through
  `workflow_dispatch` tests it without publishing).
- The owner must configure the `release` environment (reviewers, `v*` tag rule) and tag
  protection; the workflow cannot enforce them.
- Follow-ups: pin actions by full commit SHA (with Dependabot for github-actions updates); a
  `clean` step before `build` so a local pack cannot include a stale `dist/` file.

## Alternatives considered

| Option                                                  | Pros                                          | Cons                                                             | Verdict      |
| ------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------- | ------------ |
| **`files` whitelist + Trusted Publishing + smoke test** | Small package, no token, tested artifact      | One-time setup on npmjs.com, workflows only verifiable on GitHub | **Chosen**   |
| `.npmignore` blacklist                                  | Familiar                                      | A new top-level file ships by default (leaks sources and config) | Rejected     |
| Long-lived `NPM_TOKEN` secret                           | Works without npm 11.5.1 or OIDC              | A secret to store, rotate and leak; no automatic provenance link | Rejected     |
| Publish from a developer machine                        | No workflow                                   | No provenance, depends on a local build state                    | Rejected     |
| Gates and publish in one job                            | Fewer lines                                   | The gates would run with `id-token: write`                       | Rejected     |
| Ship source maps                                        | Readable stack traces                         | Sources are not shipped, so the maps point at nothing            | Rejected     |
| `pnpm/action-setup` and a pnpm cache in the release     | Same setup as CI, faster                      | A mutable third-party tag and a poisonable cache in the build of the shipped artifact | Rejected (CI keeps them) |
| `npm@^11.5.1` or `npm@latest` in the publish job        | Always current                                | The publisher changes without review                             | Rejected     |
| Publish job without an `environment`                    | Fewer settings                                | Any `v*` tag publishes with no human approval                    | Rejected     |
| SHA-pinned actions now                                  | Strongest supply-chain pinning                | Needs an update process first                                    | Deferred     |
