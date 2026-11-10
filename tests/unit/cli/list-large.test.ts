/**
 * CLI file-list mode with long lists (docs/spec.md 7.2): lint-staged passes every staged
 * file, splitting a very long list into several calls. A list of 500+ arguments must
 * lint every matching file and skip the rest, in one call or in chunks. The project is
 * built in a temporary folder (520 files cannot be fixtures) from the files of the
 * fixture large-source-project, which no other test reads, and removed afterwards.
 */
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { foldPath } from "../../../src/config/paths.js";
import { fixtureDirs, fixturePath } from "../../helpers/fixtures.js";
import { lintedOf, parseJson, runCliIn } from "../../helpers/cli.js";

const MATCHING = 520;
const SKIPPED = 80;
const SOURCE = fixturePath("cli", "large-source-project");

const pad = (index: number): string => String(index).padStart(4, "0");
const names = Array.from({ length: MATCHING }, (_, index) => `docs/n${pad(index)}.md`);
const skipped = Array.from({ length: SKIPPED }, (_, index) => `elsewhere/s${index}.txt`);
const linted = names.map((name) => `project:notes:${name}`);

let project = "";

beforeAll(() => {
  project = mkdtempSync(join(tmpdir(), "mtl-cli-list-"));
  mkdirSync(join(project, "docs"));
  mkdirSync(join(project, "templates"));
  copyFileSync(join(SOURCE, "md-template-lint.yml"), join(project, "md-template-lint.yml"));
  copyFileSync(join(SOURCE, "templates", "note.template.md"), join(project, "templates", "note.template.md"));
  for (const name of names) copyFileSync(join(SOURCE, "docs", "a.md"), join(project, name));
});

afterAll(() => {
  if (project !== "") rmSync(project, { recursive: true, force: true });
});

const run = (args: readonly string[]) =>
  runCliIn("usage-no-config", ["--format", "json", ...args], {
    cwd: foldPath(project),
    boundary: foldPath(project),
  });

describe("cli file-list mode: long lists", () => {
  it("has the one source fixture directory (no pass/fail split: one project, copied)", () => {
    expect(fixtureDirs("cli", "large-")).toEqual(["large-source-project"]);
  });

  it("lints 520 matching files and skips 80 others given in one call", async () => {
    const args = [...skipped.slice(0, 40), ...names, ...skipped.slice(40)];
    expect(args.length).toBeGreaterThan(500);
    const result = await run(args);
    const json = parseJson(result.stdout);
    expect(result.exitCode).toBe(0);
    expect(lintedOf(json)).toEqual(linted);
    expect(json.unmatched).toEqual(skipped);
    expect(json.summary).toMatchObject({ files: MATCHING, passed: MATCHING, failed: 0 });
  }, 60_000);

  it("lints the same files in three chunked calls, as lint-staged does", async () => {
    const chunks = [names.slice(0, 200), names.slice(200, 400), names.slice(400)];
    const done: string[] = [];
    for (const chunk of chunks) {
      const result = await run(chunk);
      expect(result.exitCode).toBe(0);
      done.push(...lintedOf(parseJson(result.stdout)));
    }
    expect(done).toEqual(linted);
  }, 60_000);
});
