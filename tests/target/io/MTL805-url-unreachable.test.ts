/** MTL805 url-unreachable (src/rules/io.ts, docs/spec.md 2.8, 4.3). */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv, createMemoryIo, type RuleIo, type UrlProbe } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL805";
const DIR = "tests/fixtures/pairs/MTL805";

const LONG_REASON = `ConnectError: ${"z".repeat(66)}`;
const EDGE_REASON = "R".repeat(60);

/** In-memory answers: no real network. Anything not listed is "not probed". */
const answers = new Map<string, UrlProbe>([
  ["https://ok.example.com", { reachable: true }],
  ["https://ok.example.com/mirror", { reachable: true }],
  ["https://gone.example.com/a", { reachable: false, reason: "HTTP 404" }],
  ["https://busy.example.com/b", { reachable: false, reason: "HTTP 503" }],
  ["https://long.example.com", { reachable: false, reason: LONG_REASON }],
  ["https://edge.example.com", { reachable: false, reason: EDGE_REASON }],
]);

/** Probe that echoes the timeout it was given, to prove the 5 second limit is passed. */
const echoingIo: RuleIo = {
  exists: () => Promise.resolve(false),
  probeUrl: (_url, timeoutMs) => Promise.resolve({ reachable: false, reason: `timeout after ${timeoutMs} ms` }),
};

const memory = createEnv({ io: createMemoryIo([], answers) });

/** Case -> fixture -> env -> expected result: at least 1 passing case and 1 failing case. */
const CASES = [
  {
    name: "pass-reachable-urls-or-no-check",
    fixture: "tests/fixtures/pairs/MTL805/pass-reachable-urls-or-no-check",
    env: memory,
    expected: [],
  },
  {
    name: "fail-probe-reason-is-reported",
    fixture: "tests/fixtures/pairs/MTL805/fail-probe-reason-is-reported",
    env: createEnv({ io: echoingIo }),
    expected: ["Field 'site': URL 'https://slow.example.com' not reachable (timeout after 5000 ms)"],
  },
  {
    name: "fail-list-two-unreachable-items-in-order",
    fixture: "tests/fixtures/pairs/MTL805/fail-list-two-unreachable-items-in-order",
    env: memory,
    expected: ["Field 'mirrors': URL 'https://gone.example.com/a' not reachable (HTTP 404)", "Field 'mirrors': URL 'https://busy.example.com/b' not reachable (HTTP 503)"],
  },
  {
    name: "fail-reason-longer-than-60-is-cut",
    fixture: "tests/fixtures/pairs/MTL805/fail-reason-longer-than-60-is-cut",
    env: memory,
    expected: [`Field 'site': URL 'https://long.example.com' not reachable (${LONG_REASON.slice(0, 57)}...)`],
  },
  {
    name: "fail-reason-of-exactly-60-is-kept",
    fixture: "tests/fixtures/pairs/MTL805/fail-reason-of-exactly-60-is-kept",
    env: memory,
    expected: [`Field 'site': URL 'https://edge.example.com' not reachable (${EDGE_REASON})`],
  },
  {
    name: "fail-url-unknown-to-the-probe",
    fixture: "tests/fixtures/pairs/MTL805/fail-url-unknown-to-the-probe",
    env: memory,
    expected: ["Field 'site': URL 'https://nowhere.example.com' not reachable (not probed)"],
  },
] as const;

const read = (path: string): string => readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** Diagnostics of this code for the pair of a fixture folder. */
async function lint(fixture: string, env: typeof memory) {
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
  const found = await checkTarget(registry, status.model, read(`${fixture}/target.md`), `${fixture}/target.md`, env);
  return found.filter((diagnostic) => diagnostic.code === CODE);
}

/** Every directory and file under DIR, at any depth, as sorted `/`-separated relative paths. */
function listTree(): { dirs: string[]; files: string[] } {
  const root = fileURLToPath(new URL(`../../../${DIR}`, import.meta.url));
  const dirs: string[] = [];
  const files: string[] = [];
  for (const entry of readdirSync(root, { recursive: true, withFileTypes: true })) {
    const path = relative(root, join(entry.parentPath, entry.name)).replaceAll("\\", "/");
    (entry.isDirectory() ? dirs : files).push(path);
  }
  return { dirs: dirs.sort(), files: files.sort() };
}

describe("MTL805 url-unreachable", { tags: ["MTL805", "io"] }, () => {
  it("is registered in category io, warning, field step io", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "url-unreachable",
      category: "io",
      severity: "warning",
      phase: "field",
      step: "io",
    });
  });

  it("has at least 1 pass- case and at least 1 fail- case, one fixture dir each", () => {
    const passing = CASES.filter((testCase) => testCase.name.startsWith("pass-"));
    const failing = CASES.filter((testCase) => testCase.name.startsWith("fail-"));
    expect(passing.length).toBeGreaterThanOrEqual(1);
    expect(failing.length).toBeGreaterThanOrEqual(1);
    expect(passing.length + failing.length).toBe(CASES.length);
    expect(CASES.filter((testCase) => testCase.expected.length === 0)).toEqual(passing);
    expect(CASES.map((testCase) => testCase.fixture)).toEqual(CASES.map((testCase) => `${DIR}/${testCase.name}`));
    // Orphan detection: no directory at any depth besides the cases, and each holds only the pair.
    const names = CASES.map((testCase) => testCase.name).sort();
    const tree = listTree();
    expect(tree.dirs).toEqual(names);
    expect(tree.files).toEqual(names.flatMap((name) => [`${name}/target.md`, `${name}/template.md`]).sort());
  });

  for (const testCase of CASES) {
    it(`${testCase.name}: ${testCase.fixture}`, async () => {
      const found = await lint(testCase.fixture, testCase.env);
      expect(found.map((diagnostic) => diagnostic.message)).toEqual(testCase.expected);
      for (const diagnostic of found) expect(diagnostic.severity).toBe("warning");
    });
  }
});
