/**
 * The built CLI as a process with REAL disable directives (docs/spec.md 4.4 DIR9, 7.1 `--quiet`,
 * 8.5 JSON): the `Suppressed:` summary line, the exit code, `--quiet` and `summary.suppressed`.
 *
 * Fixtures: tests/fixtures/cli/suppress-<case>/ (config, template, one target `docs/a.md`).
 * - `suppress-fail-no-comment`: three real findings (MTL302, MTL202, MTL701), no directive.
 * - `suppress-pass-real-directives`: the same target with a directive per finding (3 suppressed).
 * - `suppress-fail-wrong-code`: the same, but the MTL302 comment names MTL508: MTL302 is reported.
 *
 * Same guard as spawn.test.ts: it runs only against a usable `dist/cli.js` (present and newer
 * than every `src/**.ts` file); otherwise one skipped test says to run `pnpm run build`.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { fixturePath, REPO_ROOT } from "../../helpers/fixtures.js";

const CLI = join(REPO_ROOT, "dist", "cli.js");
const SRC = join(REPO_ROOT, "src");

/** Newest modification time (ms) of any `.ts` file below `src/`. */
function newestSource(): number {
  return readdirSync(SRC, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
    .map((entry) => statSync(join(entry.parentPath, entry.name)).mtimeMs)
    .reduce((newest, time) => Math.max(newest, time), 0);
}

const missing = !existsSync(CLI);
const stale = !missing && statSync(CLI).mtimeMs < newestSource();
const usable = !missing && !stale;

function spawn(args: readonly string[], fixture: string) {
  const env = { ...process.env };
  delete env["NO_COLOR"];
  const result = spawnSync(process.execPath, [CLI, ...args], {
    cwd: fixturePath("cli", fixture),
    encoding: "utf8",
    env,
  });
  return { stdout: result.stdout, stderr: result.stderr, status: result.status };
}

const PASS = "suppress-pass-real-directives";
const WRONG = "suppress-fail-wrong-code";
const BARE = "suppress-fail-no-comment";

describe("dist/cli.js with disable directives", () => {
  it.skipIf(!missing)("skipped: dist/cli.js does not exist, run `pnpm run build` first", () => {
    expect(missing).toBe(true);
  });

  it.skipIf(!stale)(
    "skipped: dist/cli.js is older than a file in src/, run `pnpm run build` to refresh it",
    () => {
      expect(stale).toBe(true);
    },
  );

  it.skipIf(!usable)(
    "without a comment the real findings fail the run: exit 1, no Suppressed line",
    () => {
      const run = spawn([], BARE);
      expect(run.status).toBe(1);
      expect(run.stdout).toContain("error MTL302 Field 'slug': value 'Not_Kebab'");
      expect(run.stdout).toContain("error MTL701 Section 'Overview'");
      expect(run.stdout).toContain("warn  MTL202 Unknown key 'extra'");
      expect(run.stdout).not.toContain("Suppressed:");
      expect(run.stderr).toBe("");
    },
  );

  it.skipIf(!usable)("with a directive per finding: exit 0 and `Suppressed:   3`", () => {
    const run = spawn([], PASS);
    expect(run.status).toBe(0);
    expect(run.stdout).toContain("✓ docs/a.md");
    expect(run.stdout).toContain("Suppressed:   3\n");
    expect(run.stdout).not.toContain("MTL302");
    expect(run.stdout).not.toContain("MTL202");
    expect(run.stdout).not.toContain("MTL701");
    expect(run.stderr).toBe("");
  });

  it.skipIf(!usable)(
    "a comment naming the wrong code: exit 1, MTL302 reported, 2 suppressed",
    () => {
      const run = spawn([], WRONG);
      expect(run.status).toBe(1);
      expect(run.stdout).toContain("error MTL302 Field 'slug': value 'Not_Kebab'");
      expect(run.stdout).toContain("Suppressed:   2\n");
      expect(run.stdout).not.toContain("MTL202");
      expect(run.stdout).not.toContain("MTL701");
      expect(run.stderr).toBe("");
    },
  );

  it.skipIf(!usable)("--quiet prints no Suppressed line and no summary on a passing run", () => {
    expect(spawn(["--quiet"], PASS)).toEqual({ stdout: "", stderr: "", status: 0 });
  });

  it.skipIf(!usable)(
    "--quiet on the wrong-code run prints the finding, still no Suppressed line",
    () => {
      const run = spawn(["--quiet"], WRONG);
      expect(run.status).toBe(1);
      expect(run.stdout).toContain("MTL302");
      expect(run.stdout).not.toContain("Suppressed:");
    },
  );

  it.skipIf(!usable)("--format json carries summary.suppressed, 0 without a comment", () => {
    const summaryOf = (fixture: string) =>
      (
        JSON.parse(spawn(["--format", "json"], fixture).stdout) as {
          summary: { suppressed: number; exitCode: number; failed: number };
        }
      ).summary;
    expect(summaryOf(PASS)).toMatchObject({ suppressed: 3, exitCode: 0, failed: 0 });
    expect(summaryOf(WRONG)).toMatchObject({ suppressed: 2, exitCode: 1, failed: 1 });
    expect(summaryOf(BARE)).toMatchObject({ suppressed: 0, exitCode: 1, failed: 1 });
  });

  it.skipIf(!usable)(
    "--format json lists the unsuppressed MTL302 only in the wrong-code run",
    () => {
      const codes = (fixture: string): string[] => {
        const json = JSON.parse(spawn(["--format", "json"], fixture).stdout) as {
          results: { files: { errors: { code: string }[]; warnings: { code: string }[] }[] }[];
        };
        const [file] = json.results[0]?.files ?? [];
        return [...(file?.errors ?? []), ...(file?.warnings ?? [])].map((entry) => entry.code);
      };
      expect(codes(PASS)).toEqual([]);
      expect(codes(WRONG)).toEqual(["MTL302"]);
      expect(codes(BARE).sort()).toEqual(["MTL202", "MTL302", "MTL701"]);
    },
  );
});
