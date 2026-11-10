/**
 * CLI io wiring (docs/spec.md 6.3 `allowPrivateNetworks`, 2.8): the CLI builds ONE
 * production io per run, from the config's `allowPrivateNetworks`, and gives it to the
 * runner. An injected factory records its calls. Fixtures: tests/fixtures/cli/wiring-<case>/
 * (this group reads no fixture of another group).
 */
import { describe, expect, it } from "vitest";
import { expectSplit } from "../../helpers/fixtures.js";
import { lintedOf, parseJson, runCliIn } from "../../helpers/cli.js";

const GROUP = "wiring-";

interface Case {
  readonly name: string;
  readonly exitCode: 0 | 1 | 2;
  /** Options of every createIo call. */
  readonly ioCalls: readonly { allowPrivateNetworks: boolean }[];
}

/** At least 1 passing case and 1 failing case; one fixture directory per case. */
const CASES: readonly Case[] = [
  {
    name: "pass-private-networks-default-off",
    exitCode: 0,
    ioCalls: [{ allowPrivateNetworks: false }],
  },
  {
    name: "fail-private-networks-allowed",
    exitCode: 1,
    ioCalls: [{ allowPrivateNetworks: true }],
  },
  {
    // Two roots and two pairs, still one io (it holds the URL cache and the run budget).
    name: "fail-one-io-for-two-roots",
    exitCode: 1,
    ioCalls: [{ allowPrivateNetworks: false }],
  },
  {
    // A config error lints nothing, so no io is built.
    name: "fail-config-invalid",
    exitCode: 2,
    ioCalls: [],
  },
];

describe("cli io wiring: layout", () => {
  it("has at least 1 pass- case, at least 1 fail- case, one directory each", () => {
    expectSplit("cli", GROUP, CASES);
  });
});

describe("cli io wiring", () => {
  for (const testCase of CASES) {
    it(`${testCase.name}: one io, built from the config`, async () => {
      const run = await runCliIn(`${GROUP}${testCase.name}`, []);
      expect(run.exitCode).toBe(testCase.exitCode);
      expect(run.ioCalls).toEqual(testCase.ioCalls);
    });
  }

  it("fail-one-io-for-two-roots: the same io lints every root", async () => {
    const run = await runCliIn(`${GROUP}fail-one-io-for-two-roots`, ["--format", "json"]);
    expect(lintedOf(parseJson(run.stdout))).toEqual([
      "first:notes:docs/a.md",
      "second:notes:docs/b.md",
      "second:more:more/c.md",
    ]);
    expect(run.ioCalls).toHaveLength(1);
  });

  it("file-list mode builds one io too", async () => {
    const run = await runCliIn(`${GROUP}fail-private-networks-allowed`, ["docs/b.md"]);
    expect(run.exitCode).toBe(1);
    expect(run.ioCalls).toEqual([{ allowPrivateNetworks: true }]);
  });

  it("uses the production io (createRealIo) when no factory is injected", async () => {
    const run = await runCliIn(`${GROUP}pass-private-networks-default-off`, [], {
      createIo: undefined,
    });
    expect(run.exitCode).toBe(0);
    expect(run.stdout).toContain("All files passed!");
  });
});
