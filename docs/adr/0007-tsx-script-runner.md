---
id: 0007-tsx-script-runner
title: Run the TypeScript scripts through tsx instead of Node type stripping
status: accepted
date: 2026-10-30
deciders: [owner]
---

# ADR 0007: scripts run through tsx

The repository's TypeScript scripts run with `tsx scripts/x.ts`. `tsx` is a devDependency.
This supersedes the runner choice of [ADR 0004](0004-typescript-scripts.md) (Node type
stripping) and its "erasable syntax only" script rule; the rest of ADR 0004 stands
(ADR 0004 stays `accepted`, with a note pointing here). It also amends the build-approval
policy of [ADR 0003](0003-pnpm.md): see the amendment below.

Amended 2026-11-11 (current policy): `pnpm-workspace.yaml` now sets `allowBuilds: esbuild: true`.
The "Build policy" bullet below (`esbuild: false`, build denied) is the original decision and
no longer holds; the "build stays denied" reasoning is replaced by the facts that follow.

- **What runs.** The install script (postinstall) of `esbuild` is allowed. It is the script
  that selects the platform binary. It now runs on every `pnpm install --frozen-lockfile`:
  in the `verify` job of `.github/workflows/release.yml` (the job that builds the tarball
  published with provenance, [ADR 0005](0005-packaging-and-release.md)), in CI
  (`.github/workflows/ci.yml`) and on a developer machine. It does not run for a consumer of
  the package: `esbuild` and `tsx` are devDependencies and are not shipped.
- **Why.** The change came in commit `ec700de` (message: "bump pnpm to 12.18.0, enable
  esbuild builds"). No reason beyond that line is recorded in the repository, so the reason
  is not recorded. The owner is asked to confirm that allowing the script is intended
  (open item in the ADR audit).
- **Risk.** A compromised `esbuild` install script would run code in the release `verify`
  job. That job packs the tarball (`pnpm pack`) and uploads it as the artifact `package-tarball`;
  the `publish` job downloads that artifact and runs `npm publish` on it with provenance. So
  the code could alter the tarball that gets published and signed with provenance, because
  provenance attests the workflow run, not the content of the artifact. The smoke test of the
  tarball (ADR 0005) runs in the same job, after the install. The missing `id-token` in
  `verify` limits theft of the OIDC token in that job; it does not prevent tampering with the
  artifact.
- **Protection that exists.** `--frozen-lockfile`: `pnpm-lock.yaml` pins `esbuild@0.28.2`
  and `tsx@4.23.15` with integrity hashes, so an install cannot pick another version or
  other content. This is the real protection. The release `verify` job also uses no
  third-party action and no cache (ADR 0005). The only allowlisted build is `esbuild`; any
  other dependency build stays denied.

## Context

[ADR 0004](0004-typescript-scripts.md) made every script TypeScript and ran it with
`node scripts/x.ts` (Node type stripping), and rejected `tsx` to avoid a dependency. Type
stripping only removes annotations: enums, namespaces and parameter properties fail at
runtime, so `tsconfig.scripts.json` enforced `erasableSyntaxOnly` on `scripts/` (lifted
later, see Decision). The owner asked on 2026-10-30 to run the scripts through `tsx`.

`tsx` 4.23.15 is MIT licensed (npm field and shipped `LICENSE`, checked in
`node_modules/tsx`). It depends on `esbuild` 0.28.2 (MIT) and, on macOS only, on the optional
`fsevents`. It needs Node >=18 and is used at build time only: it is not in `dist/` and not in
the npm tarball.

## Decision

- **Runner: `tsx`.** `package.json` scripts `gen:parser`, `check:parser`, `new:rule` and
  `smoke:pack` call `tsx scripts/<name>.ts`. To run a script by hand: `pnpm exec tsx scripts/<name>.ts`.
- **Release workflow:** the tag check runs `pnpm exec tsx scripts/smoke/check-release.ts "$TAG" "$REPOSITORY"`.
  `tsx` is a devDependency, so the step moved after `pnpm install --frozen-lockfile`
  (it ran before the install when it used `node`). It still runs before every gate and before
  the pack.
- **Tests that spawn a script** run `process.execPath` with the tsx CLI file
  (`node_modules/tsx/dist/cli.mjs`, `TSX_CLI` in `tests/helpers/fixtures.ts`). No shell and no
  `.cmd` shim, so it behaves the same on Windows and POSIX.
- **Build policy (original decision, amended above):** `esbuild` has a postinstall script that
  only checks the binary. Its platform package ships the binary, so the build stayed denied:
  `pnpm-workspace.yaml` set `allowBuilds: { esbuild: false }` (the default `strictDepBuilds`
  would fail `pnpm install` on the unreviewed build otherwise). Current policy:
  `allowBuilds: esbuild: true`.
- **Engines reconsidered, not changed: `engines.node` stays `>=22.18`.** The reason ADR 0004
  gave (type stripping needs no flag from 22.18) no longer applies to the scripts. The floor set
  by the dev tools in `pnpm-lock.yaml` is lower: `vitest` 5.0.5 needs `^22.12.0 || ^24.0.0 || >=26.0.0`,
  `eslint` 10.13.0 needs `^20.19.0 || ^22.13.0 || >=24`, so 22.13 is the real development floor.
  The field also describes the shipped CLI, the CI matrix (`22.18`, `24`, `26`) and
  `tests/unit/smoke/workflows.test.ts` assert `22.18`, and the README, CONTRIBUTING and spec (D13)
  state it. Lowering it is a public support decision, not part of this change. A later ADR can lower it.
- **Erasable-syntax rule lifted (done):** `erasableSyntaxOnly` is removed from
  `tsconfig.scripts.json`, and the "erasable syntax only" wording is removed from CONTRIBUTING,
  `docs/guides/testing.md`, `scripts/gen-parser.ts` and AGENTS.md. Reason: the scripts run
  through `tsx`, which compiles enums, namespaces and parameter properties, so the rule only
  existed for Node type stripping. The switch to `tsx` first left the rule in place and a
  follow-up change removed it.

## Consequences

- At runtime the scripts no longer depend on Node type stripping. Enums, namespaces and
  parameter properties run under `tsx`. The erasable-syntax constraint is therefore not
  needed any more; `erasableSyntaxOnly` is removed from `tsconfig.scripts.json` and the
  wording from the docs. Scripts may use any TypeScript syntax.
- `.ts` import extensions in scripts still work (`allowImportingTsExtensions`).
- One more devDependency (`tsx`) and one transitive (`esbuild` with 26 optional platform
  packages in the lockfile; only the host package is installed). Notices updated in
  `THIRD_PARTY_NOTICES.md`.
- Scripts need `pnpm install` before they run, including the release tag check (hence the
  moved step).
- The project permission config had a shell allow rule `node scripts/*`. Agents now run
  `pnpm run <script>` or `tsx scripts/*`. AGENTS.md now says `tsx scripts/x.ts`. The
  permission config still carries the `node scripts/*` rule, which the scripts do not need.

## Alternatives considered

| Option                                        | Pros                                               | Cons                                                 | Verdict    |
| --------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------- | ---------- |
| `tsx` as devDependency                        | Full TypeScript at runtime, no flag, no Node floor | New devDependency and esbuild build-policy entry     | **Chosen** |
| Keep Node type stripping                      | No dependency                                      | Erasable syntax only, `.ts` extensions, Node >=22.18 | Rejected   |
| `ts-node`                                     | Mature                                             | Slow, ESM friction                                   | Rejected   |
| Compile scripts to `dist/` first              | Plain Node at run time                             | Extra build step before every script, stale output   | Rejected   |
| Lower `engines.node` to `>=22.13` in this ADR | Matches the real development floor                 | Public support change, CI matrix and docs follow     | Deferred   |
