/**
 * CLI exit codes of a full run (docs/spec.md 7.5): 0 clean, 1 lint failure or broken
 * template, 2 run error (takes precedence), config error or usage error. Fixtures:
 * tests/fixtures/cli/exit-<case>/. Sharing: the `--config` tests below run from the
 * neutral working directory `usage-no-config` (owned by the usage group, it only has to
 * hold no config) and point at the config of an exit- fixture by absolute path.
 */
import { describe, expect, it } from "vitest";
import { expectSplit } from "../../helpers/fixtures.js";
import { fixtureFile, parseJson, runCliIn } from "../../helpers/cli.js";

const GROUP = "exit-";

interface Case {
  readonly name: string;
  readonly exitCode: 0 | 1 | 2;
  /** Fragments of stdout, in the order they must appear. */
  readonly stdout: readonly string[];
  /** Fragments of stderr. */
  readonly stderr: readonly string[];
  /** Fragments that stdout must not contain. */
  readonly absent?: readonly string[];
}

/** At least 1 passing case and 1 failing case; one fixture directory per case. */
const CASES: readonly Case[] = [
  {
    name: "pass-clean-project",
    exitCode: 0,
    stdout: ["✓ docs/a.md", "Failed:       0", "All files passed!"],
    stderr: [],
  },
  {
    name: "fail-lint-failure",
    exitCode: 1,
    stdout: ["✓ docs/a.md", "✗ docs/b.md", "Failed:       1", "Failed files:", "  - docs/b.md"],
    stderr: [],
    absent: ["All files passed!"],
  },
  {
    name: "fail-broken-template",
    exitCode: 1,
    stdout: [
      "TEMPLATE ERROR: templates/broken.template.md - File must have YAML frontmatter (---...---)",
      "Templates:    1 checked, 1 broken",
    ],
    stderr: [],
    // The files of a broken pair are not linted.
    absent: ["docs/a.md", "All files passed!"],
  },
  {
    // A run error (2) outranks a failing file (1), and the other pair is still linted.
    name: "fail-run-error-and-lint-failure",
    exitCode: 2,
    stdout: ["✓ docs/a.md", "✗ docs/b.md", "Run errors:   1"],
    stderr: ["error MTL910: template not found: templates/missing.template.md (pair 'ghost')"],
  },
  {
    // A config error stops before any lint: only stderr, exit 2.
    name: "fail-config-invalid",
    exitCode: 2,
    stdout: ["Run errors:"],
    stderr: ["error MTL903: pairs[0].inlcude: unknown key 'inlcude'", "error MTL904:"],
    absent: ["✓", "✗"],
  },
  {
    name: "fail-no-config",
    exitCode: 2,
    stdout: [],
    stderr: ["error MTL901: no md-template-lint.yml found from "],
    absent: ["✓", "✗"],
  },
];

function expectInOrder(text: string, fragments: readonly string[]): void {
  let from = 0;
  for (const fragment of fragments) {
    const at = text.indexOf(fragment, from);
    expect(at, `"${fragment}" in order in:\n${text}`).toBeGreaterThanOrEqual(0);
    from = at + fragment.length;
  }
}

describe("cli exit codes: layout", () => {
  it("has at least 1 pass- case, at least 1 fail- case, one directory each", () => {
    expectSplit("cli", GROUP, CASES);
  });
});

describe("cli exit codes (spec 7.5)", () => {
  for (const testCase of CASES) {
    it(`${testCase.name}: exit ${testCase.exitCode}`, async () => {
      const run = await runCliIn(`${GROUP}${testCase.name}`, []);
      expect(run.exitCode).toBe(testCase.exitCode);
      expectInOrder(run.stdout, testCase.stdout);
      for (const fragment of testCase.stderr) expect(run.stderr).toContain(fragment);
      for (const fragment of testCase.absent ?? []) expect(run.stdout).not.toContain(fragment);
      if (testCase.stderr.length === 0) expect(run.stderr).toBe("");
    });

    it(`${testCase.name}: the JSON summary carries the same exit code`, async () => {
      const run = await runCliIn(`${GROUP}${testCase.name}`, ["--format", "json"]);
      expect(run.exitCode).toBe(testCase.exitCode);
      expect(parseJson(run.stdout).summary["exitCode"]).toBe(testCase.exitCode);
      // JSON prints one document and nothing else: run errors are inside it.
      expect(run.stderr).toBe("");
    });
  }
});

describe("cli --config", () => {
  const target = (name: string) => fixtureFile(`${GROUP}${name}`, "md-template-lint.yml");

  it("reads the given config, as two arguments or as --config=<path>", async () => {
    const separate = await runCliIn("usage-no-config", ["--config", target("fail-lint-failure")]);
    const joined = await runCliIn("usage-no-config", [`--config=${target("fail-lint-failure")}`]);
    expect(separate.exitCode).toBe(1);
    expect(joined.stdout).toBe(separate.stdout);
    expect(separate.stdout).toContain("✗ docs/b.md");
  });

  it("a config file that does not exist is MTL901, exit 2", async () => {
    const run = await runCliIn("usage-no-config", ["--config", "nope/md-template-lint.yml"]);
    expect(run.exitCode).toBe(2);
    expect(run.stderr).toContain("error MTL901: config file not found: nope/md-template-lint.yml");
  });

  it("finds the config in a parent directory of the working directory", async () => {
    const run = await runCliIn("exit-pass-clean-project", [], {
      cwd: fixtureFile("exit-pass-clean-project", "docs"),
      boundary: fixtureFile("exit-pass-clean-project", "."),
    });
    expect(run.exitCode).toBe(0);
    expect(run.stdout).toContain("✓ docs/a.md");
  });
});
