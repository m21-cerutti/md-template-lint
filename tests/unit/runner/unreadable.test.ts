/**
 * Runner: files whose bytes are not valid UTF-8 (docs/spec.md 4.3 MTL004, 7.5). A target
 * is a file failure printed `Parse error: <message>`; a TEMPLATE is a broken template
 * (exit 1, the files of its pair are not linted). Invalid UTF-8 cannot be a text fixture:
 * the test copies tests/fixtures/runner/unreadable-project/ to a temporary folder, adds
 * the bytes in code and removes the folder afterwards.
 */
import { cpSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "../../../src/config/load.js";
import { createMemoryIo } from "../../../src/engine/rule.js";
import { runLint } from "../../../src/runner/run.js";
import { fixturePath } from "../../helpers/fixtures.js";

const BAD_UTF8 = Buffer.from([0x2d, 0x2d, 0x2d, 0x0a, 0xff, 0xfe, 0x0a]);
const made: string[] = [];

/** A copy of the fixture project in a temporary folder. */
function project(): string {
  const dir = mkdtempSync(join(tmpdir(), "mtl-unreadable-"));
  made.push(dir);
  cpSync(fixturePath("runner", "unreadable-project"), dir, { recursive: true });
  return dir;
}

async function run(dir: string) {
  const loaded = await loadConfig({ cwd: dir, home: "/home/test", boundary: dir });
  return runLint(loaded, { io: createMemoryIo() });
}

afterEach(() => {
  for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("runner: bytes that are not UTF-8", () => {
  it("fails: a target with invalid UTF-8 is a file error with the Parse error prefix", async () => {
    const dir = project();
    writeFileSync(join(dir, "docs", "a-bad-utf8.md"), BAD_UTF8);
    const result = await run(dir);
    const [block] = result.blocks;
    if (block?.kind !== "pair") throw new Error("expected a pair block");
    expect(block.files.map((file) => [file.path, file.status])).toEqual([
      ["docs/a-bad-utf8.md", "fail"],
      ["docs/b-no-frontmatter.md", "fail"],
      ["docs/c-fine.md", "pass"],
    ]);
    expect(block.files[0]?.errors.map((error) => [error.code, error.message])).toEqual([
      ["MTL004", "Parse error: file is not valid UTF-8"],
    ]);
    expect(block.files[1]?.errors.map((error) => [error.code, error.message])).toEqual([
      ["MTL001", "Parse error: File must have YAML frontmatter (---...---)"],
    ]);
    expect(result.summary).toMatchObject({ files: 3, passed: 1, failed: 2, exitCode: 1 });
  });

  it("fails: a template with invalid UTF-8 is a broken template, exit 1, files not linted", async () => {
    const dir = project();
    writeFileSync(join(dir, "note.template.md"), BAD_UTF8);
    const result = await run(dir);
    const [block] = result.blocks;
    if (block?.kind !== "pair") throw new Error("expected a pair block");
    expect(block.template).toMatchObject({
      path: "note.template.md",
      status: "broken",
      error: { code: "MTL004", severity: "error", message: "file is not valid UTF-8" },
    });
    // The two target files are counted for the Target: line but not linted (C02).
    expect(block).toMatchObject({ fileCount: 2, files: [] });
    expect(result.brokenTemplates).toEqual([
      { path: "note.template.md", message: "file is not valid UTF-8" },
    ]);
    expect(result.runErrors).toEqual([]);
    expect(result.summary).toMatchObject({
      files: 0,
      failed: 0,
      templatesChecked: 1,
      templatesBroken: 1,
      exitCode: 1,
    });
  });
});
