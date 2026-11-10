/**
 * The GitHub Actions workflows (.github/workflows/ci.yml and release.yml, ADR 0005) and the
 * package.json publish settings. The subjects are the real files, so these assertions are
 * the contract: valid YAML, least privilege, no secrets, the OS and Node matrix, Trusted
 * Publishing with provenance in the release workflow only, the `files` whitelist.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";
import { REPO_ROOT } from "../../helpers/fixtures.js";

interface Step {
  readonly name?: string;
  readonly uses?: string;
  readonly run?: string;
  readonly if?: string;
  readonly env?: Readonly<Record<string, string>>;
  readonly with?: Readonly<Record<string, string>>;
}

interface Job {
  readonly needs?: string;
  readonly if?: string;
  readonly environment?: string;
  readonly "runs-on": string;
  readonly permissions?: Readonly<Record<string, string>>;
  readonly strategy?: { readonly matrix: { readonly os: string[]; readonly node: string[] } };
  readonly steps: readonly Step[];
}

interface Workflow {
  readonly name: string;
  readonly on: {
    readonly push?: { readonly branches?: string[]; readonly tags?: string[] };
    readonly workflow_dispatch?: unknown;
  };
  readonly permissions?: Readonly<Record<string, string>>;
  readonly jobs: Readonly<Record<string, Job>>;
}

interface PackageJson {
  readonly packageManager: string;
  readonly engines: { readonly node: string };
  readonly main: string;
  readonly types: string;
  readonly bin: Readonly<Record<string, string>>;
  readonly exports: Readonly<Record<string, string | Readonly<Record<string, string>>>>;
  readonly files: readonly string[];
  readonly scripts: Readonly<Record<string, string>>;
  readonly repository: { readonly url: string };
}

const read = (...parts: string[]): string => readFileSync(join(REPO_ROOT, ...parts), "utf8");
const CI_TEXT = read(".github", "workflows", "ci.yml");
const RELEASE_TEXT = read(".github", "workflows", "release.yml");
const CI = parse(CI_TEXT) as Workflow;
const RELEASE = parse(RELEASE_TEXT) as Workflow;
const PACKAGE = JSON.parse(read("package.json")) as PackageJson;
/** Owner and repository name of package.json `repository.url`, read at runtime (never written here). */
const [OWNER = "", REPOSITORY_NAME = ""] = new URL(
  PACKAGE.repository.url.replace(/^git\+/, ""),
).pathname
  .slice(1)
  .replace(/\.git$/, "")
  .split("/");

const stepsOf = (job: Job): string[] => job.steps.flatMap((step) => (step.run ? [step.run] : []));
const usesOf = (workflow: Workflow): string[] =>
  Object.values(workflow.jobs).flatMap((job) => job.steps.flatMap((s) => (s.uses ? [s.uses] : [])));

/** The gates in the order of CONTRIBUTING.md, plus the install step before them. */
const GATES = [
  "pnpm install --frozen-lockfile",
  "pnpm run check:parser",
  "pnpm run check:rules",
  "pnpm run typecheck",
  "pnpm run lint",
  "pnpm run format:check",
  "pnpm test",
  "pnpm run build",
];

describe("ci.yml", () => {
  const job = CI.jobs["gates"] as Job;

  it("is a workflow with one gates job", () => {
    expect(CI.name).toBe("CI");
    expect(Object.keys(CI.jobs)).toEqual(["gates"]);
  });

  it("triggers on pull requests and pushes to main", () => {
    expect(CI.on.push?.branches).toEqual(["main"]);
    expect(Object.keys(CI.on)).toContain("pull_request");
  });

  it("has read-only default permissions and never asks for id-token", () => {
    expect(CI.permissions).toEqual({ contents: "read" });
    expect(CI_TEXT).not.toContain("id-token");
  });

  it("runs on three operating systems", () => {
    expect(job.strategy?.matrix.os).toEqual(["ubuntu-latest", "windows-latest", "macos-latest"]);
    expect(job["runs-on"]).toBe("${{ matrix.os }}");
  });

  it("runs on Node 22.18, 24 and 26, and 22.18 is the engines minimum", () => {
    expect(job.strategy?.matrix.node).toEqual(["22.18", "24", "26"]);
    expect(PACKAGE.engines.node).toBe(">=22.18");
  });

  it("sets up pnpm from packageManager, then Node with the pnpm cache", () => {
    const uses = usesOf(CI);
    expect(uses.findIndex((use) => use.startsWith("pnpm/action-setup@"))).toBeLessThan(
      uses.findIndex((use) => use.startsWith("actions/setup-node@")),
    );
    const pnpmSetup = job.steps.find((step) => step.uses?.startsWith("pnpm/action-setup@"));
    expect(pnpmSetup).toBeDefined();
    expect(pnpmSetup).not.toHaveProperty("with");
    const nodeSetup = job.steps.find((step) => step.uses?.startsWith("actions/setup-node@"));
    expect(nodeSetup).toMatchObject({ with: { cache: "pnpm" } });
  });

  it("runs every gate in order, then the pack smoke test on ubuntu only", () => {
    expect(stepsOf(job)).toEqual([...GATES, "pnpm run smoke:pack"]);
    const smoke = job.steps.find((step) => step.run === "pnpm run smoke:pack");
    expect(smoke?.if).toBe("matrix.os == 'ubuntu-latest'");
  });

  it("pins every action by major version tag", () => {
    expect(usesOf(CI).length).toBeGreaterThan(0);
    for (const use of usesOf(CI)) expect(use).toMatch(/^[\w-]+\/[\w-]+@v\d+$/);
  });

  it("uses no secret and does not publish", () => {
    expect(CI_TEXT).not.toMatch(/secrets\.|NPM_TOKEN|NODE_AUTH_TOKEN/);
    expect(CI_TEXT).not.toContain("--provenance");
    expect(CI_TEXT).not.toContain("publish");
  });
});

describe("release.yml", () => {
  const verify = RELEASE.jobs["verify"] as Job;
  const publish = RELEASE.jobs["publish"] as Job;

  it("runs on a v* tag and on manual dispatch", () => {
    expect(RELEASE.on.push?.tags).toEqual(["v*"]);
    expect(Object.keys(RELEASE.on)).toContain("workflow_dispatch");
  });

  it("has read-only default permissions", () => {
    expect(RELEASE.permissions).toEqual({ contents: "read" });
  });

  it("gives id-token: write to the publish job only", () => {
    expect(publish.permissions).toEqual({ contents: "read", "id-token": "write" });
    expect(verify.permissions).toEqual({ contents: "read" });
    expect(Object.keys(RELEASE.jobs).sort()).toEqual(["publish", "verify"]);
    // One occurrence in the whole file: the one of the publish job.
    expect(RELEASE_TEXT.match(/id-token: write/g) ?? []).toHaveLength(1);
  });

  it("runs the publish job in the release environment (reviewers and tag protection)", () => {
    expect(publish.environment).toBe("release");
    expect(verify.environment).toBeUndefined();
  });

  it("publishes with provenance, only in the publish job", () => {
    expect(RELEASE_TEXT).toContain("--provenance");
    expect(stepsOf(publish).some((run) => run.includes("npm publish"))).toBe(true);
    expect(stepsOf(publish).join("\n")).toContain("--provenance");
    expect(stepsOf(verify).join("\n")).not.toContain("publish");
  });

  it("never publishes from the manual dry run or from a fork", () => {
    expect(publish.needs).toBe("verify");
    expect(publish.if).toBe("github.event_name == 'push' && github.event.repository.fork == false");
  });

  it("runs no third-party action: pnpm comes from Corepack, not pnpm/action-setup", () => {
    expect(RELEASE_TEXT).not.toContain("pnpm/action-setup");
    for (const use of usesOf(RELEASE)) expect(use.startsWith("actions/")).toBe(true);
    const runs = stepsOf(verify);
    expect(runs.indexOf("corepack enable")).toBeGreaterThanOrEqual(0);
    expect(runs.indexOf("corepack enable")).toBeLessThan(
      runs.indexOf("pnpm install --frozen-lockfile"),
    );
    expect(PACKAGE.packageManager).toMatch(/^pnpm@\d+\.\d+\.\d+$/);
  });

  it("restores no cache in the job that builds the published tarball", () => {
    expect(verify.steps.some((step) => step.with?.["cache"] !== undefined)).toBe(false);
    expect(RELEASE_TEXT).not.toMatch(/actions\/cache|cache:/);
  });

  it("installs an exact npm, 11.5.1 or newer (Trusted Publishing), in the publish job", () => {
    const installs = stepsOf(publish).filter((run) => run.startsWith("npm install"));
    expect(installs).toHaveLength(1);
    const match = /^npm install --global npm@(\d+)\.(\d+)\.(\d+)$/.exec(installs[0] ?? "");
    expect(match).not.toBeNull();
    const [major, minor, patch] = (match ?? []).slice(1).map(Number) as [number, number, number];
    expect(major === 11 ? minor > 5 || (minor === 5 && patch >= 1) : major > 11).toBe(true);
    expect(RELEASE_TEXT).not.toMatch(/npm@[\^~]|npm@latest/);
  });

  it("runs every gate, packs, and smoke-tests the tarball it publishes", () => {
    const runs = stepsOf(verify).filter(
      (run) => run.startsWith("pnpm") && !run.startsWith("pnpm exec tsx"),
    );
    expect(runs.slice(0, GATES.length)).toEqual(GATES);
    expect(runs[GATES.length]).toMatch(/^pnpm pack --pack-destination /);
    expect(runs[GATES.length + 1]).toMatch(/^pnpm run smoke:pack -- --tarball /);
    expect(verify.steps.some((step) => step.uses?.startsWith("actions/upload-artifact@"))).toBe(
      true,
    );
    expect(publish.steps.some((step) => step.uses?.startsWith("actions/download-artifact@"))).toBe(
      true,
    );
  });

  it("checks the tag and the repository with the tested script, only on a tag push", () => {
    const check = verify.steps.find((step) => step.name?.startsWith("Tag matches"));
    expect(check?.if).toBe("github.event_name == 'push'");
    expect(check?.env).toEqual({
      TAG: "${{ github.ref_name }}",
      REPOSITORY: "${{ github.repository }}",
    });
    expect(check?.run).toBe('pnpm exec tsx scripts/smoke/check-release.ts "$TAG" "$REPOSITORY"');
    // tsx is a devDependency: the check runs after the install step.
    const runs = stepsOf(verify);
    expect(runs.indexOf("pnpm install --frozen-lockfile")).toBeLessThan(
      runs.indexOf(check?.run ?? ""),
    );
    // ...and before the first gate (and so before the pack and the publish).
    expect(runs.indexOf(check?.run ?? "")).toBeGreaterThanOrEqual(0);
    expect(runs.indexOf(check?.run ?? "")).toBeLessThan(runs.indexOf("pnpm run check:parser"));
  });

  it("uses ${{ github.repository }} and hard-codes no owner or repository", () => {
    expect(RELEASE_TEXT).toContain("${{ github.repository }}");
    expect(OWNER).not.toBe("");
    expect(REPOSITORY_NAME).not.toBe("");
    expect(RELEASE_TEXT).not.toContain(OWNER);
    expect(RELEASE_TEXT).not.toContain(REPOSITORY_NAME);
  });

  it("uses no secret and no npm token", () => {
    expect(RELEASE_TEXT).not.toMatch(/secrets\.|NPM_TOKEN|NODE_AUTH_TOKEN|_authToken/);
  });

  it("pins every action by major version tag", () => {
    expect(usesOf(RELEASE).length).toBeGreaterThan(0);
    for (const use of usesOf(RELEASE)) expect(use).toMatch(/^[\w-]+\/[\w-]+@v\d+$/);
  });
});

describe("package.json publish settings", () => {
  it("ships only dist (without source maps), the licence, the notices and the README", () => {
    expect(PACKAGE.files).toEqual([
      "dist",
      "!dist/**/*.map",
      "LICENSE",
      "CHANGELOG.md",
      "THIRD_PARTY_NOTICES.md",
      "README.md",
    ]);
  });

  it("points main, types, bin and exports into dist", () => {
    expect(PACKAGE.main).toBe("dist/index.js");
    expect(PACKAGE.types).toBe("dist/index.d.ts");
    expect(PACKAGE.bin).toEqual({ "md-template-lint": "dist/cli.js" });
    expect(PACKAGE.exports["."]).toEqual({
      types: "./dist/index.d.ts",
      default: "./dist/index.js",
    });
  });

  it("builds before packing and exposes the smoke test", () => {
    expect(PACKAGE.scripts["prepack"]).toBe("pnpm run build");
    expect(PACKAGE.scripts["smoke:pack"]).toBe("tsx scripts/smoke-pack.ts");
  });
});
