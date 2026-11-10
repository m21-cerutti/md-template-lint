/**
 * scripts/write-escaped.ts: the escape decoder and the path rules run in process against a
 * temporary root (so nothing is written into the real tests/fixtures/, which other tests scan
 * in parallel); a few CLI runs use the real script and a unique folder in the git-ignored tmp/.
 */
import { spawnSync } from "node:child_process";
import {
  existsSync,
  linkSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkTarget, decodeEscapes, main, writeEscaped } from "../../scripts/write-escaped.ts";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SCRIPT = join(REPO, "scripts", "write-escaped.ts");

let root = "";
let outside = "";

beforeEach(() => {
  const base = realpathSync.native(mkdtempSync(join(tmpdir(), "md-template-lint-write-escaped-")));
  root = join(base, "repo");
  outside = join(base, "outside");
  mkdirSync(root);
  mkdirSync(outside);
});

afterEach(() => {
  rmSync(dirname(root), { recursive: true, force: true });
});

const bytesOf = (path: string): number[] => [...readFileSync(join(root, path))];

/** Create a link; false when the OS refuses (a file symlink needs a privilege on Windows). */
function link(target: string, path: string, type: "file" | "junction"): boolean {
  try {
    symlinkSync(target, path, type);
    return true;
  } catch {
    return false;
  }
}

describe("decodeEscapes", () => {
  it.each([
    ["\\n", "\n"],
    ["\\r", "\r"],
    ["\\t", "\t"],
    ["\\\\", "\\"],
    ["\\x41", "A"],
    ["\\x85", "\u0085"],
    ["\\u001c", "\u001c"],
    ["\\u00E9", "\u00e9"],
    ["\\u{1F600}", "\u{1f600}"],
    ["\\u{41}", "A"],
    ["\\uD83D\\uDE00", "\u{1f600}"],
    ["a\\nb\\\\n", "a\nb\\n"],
    ["plain text", "plain text"],
    ["", ""],
  ])("decodes %j", (escaped, expected) => {
    expect(decodeEscapes(escaped)).toBe(expected);
  });

  it.each([
    ["\\q", /unknown escape/],
    ["\\", /trailing backslash/],
    ["abc\\", /trailing backslash/],
    ["\\x4", /malformed escape/],
    ["\\xZZ", /malformed escape/],
    ["\\u12", /malformed escape/],
    ["\\u{}", /malformed escape/],
    ["\\u{41", /malformed escape/],
    ["\\u{110000}", /above U\+10FFFF/],
    ["\\u{D83D}", /lone surrogate/],
    ["\\uD83D", /lone high surrogate/],
    ["\\uD83Dx", /lone high surrogate/],
    ["\\uD83D\\u0041", /lone high surrogate/],
    ["\\uDE00", /lone low surrogate/],
  ])("rejects %j", (escaped, message) => {
    expect(() => decodeEscapes(escaped)).toThrow(message);
  });
});

describe("writeEscaped", () => {
  it("writes U+001C as the byte 0x1C", () => {
    writeEscaped(root, "tmp/a.md", "x\\n\\u001c\\ny\\n");
    expect(bytesOf("tmp/a.md")).toEqual([0x78, 0x0a, 0x1c, 0x0a, 0x79, 0x0a]);
  });

  it("writes U+0085 as the UTF-8 bytes C2 85", () => {
    writeEscaped(root, "tmp/a.md", "\\u0085");
    expect(bytesOf("tmp/a.md")).toEqual([0xc2, 0x85]);
    writeEscaped(root, "tmp/b.md", "\\x85");
    expect(bytesOf("tmp/b.md")).toEqual([0xc2, 0x85]);
  });

  it("writes no BOM by default and a BOM when \\uFEFF is in the text", () => {
    writeEscaped(root, "tmp/plain.md", "a");
    expect(bytesOf("tmp/plain.md")).toEqual([0x61]);
    writeEscaped(root, "tmp/bom.md", "\\uFEFFa");
    expect(bytesOf("tmp/bom.md")).toEqual([0xef, 0xbb, 0xbf, 0x61]);
  });

  it("creates missing parent folders and reports path and byte count", () => {
    expect(writeEscaped(root, "tmp/deep/er/a.md", "ab")).toEqual({
      path: "tmp/deep/er/a.md",
      bytes: 2,
    });
    expect(bytesOf("tmp/deep/er/a.md")).toEqual([0x61, 0x62]);
  });

  it("accepts an absolute path inside the root", () => {
    writeEscaped(root, join(root, "tmp", "abs.md"), "z");
    expect(bytesOf("tmp/abs.md")).toEqual([0x7a]);
  });

  it("writes nothing when the text is malformed", () => {
    expect(() => writeEscaped(root, "tmp/a.md", "\\q")).toThrow(/unknown escape/);
    expect(existsSync(join(root, "tmp", "a.md"))).toBe(false);
  });
});

describe("path rules", () => {
  it("refuses a path outside the root", () => {
    expect(() => checkTarget(root, "../escape.md")).toThrow(/outside/);
    expect(() => checkTarget(root, join(outside, "escape.md"))).toThrow(/outside/);
    expect(() => writeEscaped(root, "../escape.md", "a")).toThrow(/outside/);
    expect(existsSync(join(outside, "escape.md"))).toBe(false);
    expect(existsSync(join(dirname(root), "escape.md"))).toBe(false);
  });

  it("refuses the root itself and a directory target", () => {
    expect(() => checkTarget(root, ".")).toThrow(/repo root/);
    expect(() => checkTarget(root, "")).toThrow(/repo root/);
    mkdirSync(join(root, "tests", "fixtures", "dir"), { recursive: true });
    expect(() => checkTarget(root, "tests/fixtures/dir")).toThrow(/directory/);
    mkdirSync(join(root, "tmp", "dir"), { recursive: true });
    expect(() => checkTarget(root, "tmp/dir")).toThrow(/directory/);
  });

  it("refuses a parent link that leads outside the root", (context) => {
    mkdirSync(join(root, "tmp"));
    if (!link(outside, join(root, "tmp", "link"), "junction")) context.skip();
    expect(() => writeEscaped(root, "tmp/link/escape.md", "a")).toThrow(/outside/);
    expect(existsSync(join(outside, "escape.md"))).toBe(false);
  });

  it("refuses a file link that leads outside the root", (context) => {
    writeFileSync(join(outside, "target.md"), "keep");
    mkdirSync(join(root, "tests", "fixtures"), { recursive: true });
    const linked = link(
      join(outside, "target.md"),
      join(root, "tests", "fixtures", "l.md"),
      "file",
    );
    if (!linked) context.skip();
    expect(() => writeEscaped(root, "tests/fixtures/l.md", "a")).toThrow(/outside/);
    expect(readFileSync(join(outside, "target.md"), "utf8")).toBe("keep");
  });

  it("checks the canonical path: a link into .git is refused", (context) => {
    mkdirSync(join(root, ".git", "hooks"), { recursive: true });
    mkdirSync(join(root, "tmp"));
    if (!link(join(root, ".git"), join(root, "tmp", "g"), "junction")) context.skip();
    expect(() => writeEscaped(root, "tmp/g/hooks/pre-commit", "a")).toThrow(/forbidden segment/);
    expect(existsSync(join(root, ".git", "hooks", "pre-commit"))).toBe(false);
  });

  it.each([
    [".env", /secret-like/],
    [".env.local", /secret-like/],
    ["sub/.ENV", /secret-like/],
    ["prod.env", /secret-like/],
    ["my-secret.md", /secret-like/],
    ["SECRETS/a.md", /secret-like/],
    ["credentials.md", /secret-like/],
    ["a/Credential.txt", /secret-like/],
    ["cert.pem", /secret-like/],
    ["tls.key", /secret-like/],
    ["id_rsa", /secret-like/],
    ["id_rsa.pub", /secret-like/],
    ["id_ed25519", /secret-like/],
    [".ssh/config", /secret-like/],
    [".npmrc", /secret-like/],
    ["auth.json", /secret-like/],
    [".git/config", /forbidden segment/],
    ["node_modules/x/a.md", /forbidden segment/],
    [".env.", /secret-like/],
    [".git /x", /forbidden segment/],
    [".git./x", /forbidden segment/],
    ["a.md:stream", /contains ':'/],
    // 8.3 short names hide the real name: any ~digit segment is refused.
    ["GIT~1/hooks/x", /short-name/],
    ["NODE_M~1/x", /short-name/],
    ["SECRET~1", /short-name/],
    ["SECRET~1/a.md", /short-name/],
    ["a~1.md", /short-name/],
    // Windows device names, with or without an extension.
    ["NUL.md", /device name/],
    ["CON", /device name/],
    ["con.txt", /device name/],
    ["a/Aux", /device name/],
    ["COM1.log", /device name/],
    ["lpt9 .md", /device name/],
    ["PRN.", /device name/],
  ])("refuses %s under tmp/ and under the root", (path, message) => {
    for (const prefix of ["tmp/", ""]) {
      expect(() => checkTarget(root, `${prefix}${path}`)).toThrow(message);
      expect(() => writeEscaped(root, `${prefix}${path}`, "a")).toThrow(message);
    }
    expect(existsSync(join(root, "tmp", path))).toBe(false);
    expect(existsSync(join(root, path))).toBe(false);
  });

  it.each([
    ["D:x.md"],
    ["C:x.md"],
    ["\\\\host\\share\\x.md"],
    ["//host/share/x.md"],
    ["\\\\?\\C:\\x.md"],
    ["\\\\.\\C:\\x.md"],
  ])("refuses the drive-relative, UNC or device form %s", (path) => {
    expect(() => checkTarget(root, path)).toThrow(/UNC, device or drive-relative/);
    expect(() => writeEscaped(root, path, "a")).toThrow(/UNC, device or drive-relative/);
  });

  it("accepts ordinary names that only look close", () => {
    for (const path of ["environment.md", "keys.md", "monkey.md", "console.md", "tilde~x.md"]) {
      expect(checkTarget(root, `tmp/${path}`).overwrite).toBe(false);
    }
  });
});

describe("write area: tests/fixtures/ and tmp/ only", () => {
  it.each([
    ["a.md"],
    ["src/x.ts"],
    ["scripts/x.ts"],
    [".github/workflows/x.yml"],
    [".vscode/tasks.json"],
    ["docs/x.md"],
    ["tests/x.md"],
    ["tests/unit/x.test.ts"],
    ["tests/fixture/x.md"],
    ["tests/fixtures"],
    ["tests/fixtures/../unit/x.md"],
    ["tmp"],
    ["tmpx/a.md"],
  ])("refuses to create %s", (path) => {
    expect(() => checkTarget(root, path)).toThrow(/writes are limited to tests\/fixtures/);
    expect(() => writeEscaped(root, path, "a")).toThrow(/writes are limited/);
    expect(existsSync(join(root, path))).toBe(false);
  });

  it("allows creation under tests/fixtures/ and tmp/", () => {
    expect(writeEscaped(root, "tests/fixtures/pairs/new/target.md", "a\\u0085b")).toEqual({
      path: "tests/fixtures/pairs/new/target.md",
      bytes: 4,
    });
    expect(bytesOf("tests/fixtures/pairs/new/target.md")).toEqual([0x61, 0xc2, 0x85, 0x62]);
    writeEscaped(root, "tmp/x/y.md", "a");
    expect(bytesOf("tmp/x/y.md")).toEqual([0x61]);
  });
});

describe("extension allowlist: .md .txt .json .yml .yaml", () => {
  it.each([
    ["tmp/a.test.mjs"],
    ["tests/fixtures/x/a.test.ts"],
    ["tmp/a.ts"],
    ["tmp/a.mts"],
    ["tmp/a.cts"],
    ["tmp/a.tsx"],
    ["tmp/a.js"],
    ["tmp/a.cjs"],
    ["tmp/a.jsx"],
    ["tmp/a.ps1"],
    ["tmp/a.sh"],
    ["tmp/a.cmd"],
    ["tmp/a.bat"],
    ["tmp/a.vbs"],
    ["tmp/noext"],
    ["tmp/.md"],
    ["tmp/a.md.exe"],
    ["tmp/a.md.ts."],
  ])("refuses %s", (path) => {
    expect(() => checkTarget(root, path)).toThrow(
      "refusing path: extension not allowed, use one of .md .txt .json .yml .yaml",
    );
    expect(() => writeEscaped(root, path, "a")).toThrow(/extension not allowed/);
    expect(existsSync(join(root, path))).toBe(false);
  });

  it("refuses to overwrite an existing fixture with a disallowed extension", () => {
    mkdirSync(join(root, "tests", "fixtures"), { recursive: true });
    writeFileSync(join(root, "tests", "fixtures", "a.test.ts"), "keep");
    expect(() => writeEscaped(root, "tests/fixtures/a.test.ts", "x")).toThrow(/extension/);
    expect(readFileSync(join(root, "tests", "fixtures", "a.test.ts"), "utf8")).toBe("keep");
  });

  it("keeps an alternate data stream refused", () => {
    expect(() => checkTarget(root, "tmp/a.md:x.ts")).toThrow(/contains ':'/);
  });

  it.each([["tmp/A.MD"], ["tmp/a.txt"], ["tmp/a.Json"], ["tmp/a.yml"], ["tmp/a.YAML"]])(
    "accepts %s (case-insensitive)",
    (path) => {
      writeEscaped(root, path, "a");
      expect(bytesOf(path)).toEqual([0x61]);
    },
  );
});

describe("links and spellings that lead out of tests/fixtures/", () => {
  it("refuses a junction inside tests/fixtures/ that points to scripts/", (context) => {
    mkdirSync(join(root, "scripts"));
    writeFileSync(join(root, "scripts", "a.md"), "keep");
    mkdirSync(join(root, "tests", "fixtures"), { recursive: true });
    if (!link(join(root, "scripts"), join(root, "tests", "fixtures", "j"), "junction")) {
      context.skip();
    }
    expect(() => writeEscaped(root, "tests/fixtures/j/new.md", "x")).toThrow(/writes are limited/);
    expect(() => writeEscaped(root, "tests/fixtures/j/a.md", "x")).toThrow(/writes are limited/);
    expect(existsSync(join(root, "scripts", "new.md"))).toBe(false);
    expect(readFileSync(join(root, "scripts", "a.md"), "utf8")).toBe("keep");
  });

  // Junction twins of the file-symlink tests above, which skip without the symlink privilege.
  it("refuses an existing file reached through a junction to outside the root", (context) => {
    writeFileSync(join(outside, "target.md"), "keep");
    mkdirSync(join(root, "tests", "fixtures"), { recursive: true });
    if (!link(outside, join(root, "tests", "fixtures", "j"), "junction")) context.skip();
    expect(() => writeEscaped(root, "tests/fixtures/j/target.md", "a")).toThrow(/outside/);
    expect(readFileSync(join(outside, "target.md"), "utf8")).toBe("keep");
  });

  it("refuses an existing file reached through a junction elsewhere in the root", (context) => {
    mkdirSync(join(root, "docs"));
    writeFileSync(join(root, "docs", "src.md"), "keep");
    mkdirSync(join(root, "tests", "fixtures"), { recursive: true });
    if (!link(join(root, "docs"), join(root, "tests", "fixtures", "j"), "junction")) {
      context.skip();
    }
    expect(() => writeEscaped(root, "tests/fixtures/j/src.md", "x")).toThrow(/writes are limited/);
    expect(readFileSync(join(root, "docs", "src.md"), "utf8")).toBe("keep");
  });

  it("maps a case variant Tests/Fixtures/ to the real tests/fixtures/ or refuses it", () => {
    mkdirSync(join(root, "tests", "fixtures"), { recursive: true });
    let target: ReturnType<typeof checkTarget> | null = null;
    try {
      target = checkTarget(root, "Tests/Fixtures/x.md");
    } catch (error) {
      // Case-sensitive file system: Tests/ is not tests/, so it is outside the write area.
      expect(String(error)).toMatch(/writes are limited/);
    }
    if (target !== null) {
      // Case-insensitive file system: the canonical path has the real letter case.
      expect(target.segments).toEqual(["tests", "fixtures", "x.md"]);
      writeEscaped(root, "Tests/Fixtures/x.md", "a");
      expect(bytesOf("tests/fixtures/x.md")).toEqual([0x61]);
    }
  });

  it("refuses mixed separators that climb out of tests/fixtures/", () => {
    mkdirSync(join(root, "scripts"));
    const path = "tests\\fixtures/../scripts/x.md";
    expect(() => checkTarget(root, path)).toThrow(/writes are limited/);
    expect(() => writeEscaped(root, path, "a")).toThrow(/writes are limited/);
    expect(existsSync(join(root, "scripts", "x.md"))).toBe(false);
  });
});

describe("overwrite rule", () => {
  it("refuses to touch an existing file outside the write area", () => {
    writeFileSync(join(root, "a.md"), "old");
    expect(() => writeEscaped(root, "a.md", "new")).toThrow(/writes are limited/);
    expect(readFileSync(join(root, "a.md"), "utf8")).toBe("old");
    mkdirSync(join(root, "tests"));
    writeFileSync(join(root, "tests", "a.md"), "old");
    expect(() => writeEscaped(root, "tests/a.md", "new")).toThrow(/writes are limited/);
    expect(readFileSync(join(root, "tests", "a.md"), "utf8")).toBe("old");
  });

  it("refuses to overwrite an existing file in tmp/", () => {
    writeEscaped(root, "tmp/a.md", "old");
    expect(() => writeEscaped(root, "tmp/a.md", "new")).toThrow(/refusing to overwrite/);
    expect(bytesOf("tmp/a.md")).toEqual([0x6f, 0x6c, 0x64]);
  });

  it("overwrites an existing file inside tests/fixtures/", () => {
    mkdirSync(join(root, "tests", "fixtures", "pairs"), { recursive: true });
    writeFileSync(join(root, "tests", "fixtures", "pairs", "a.md"), "old content");
    expect(checkTarget(root, "tests/fixtures/pairs/a.md").overwrite).toBe(true);
    writeEscaped(root, "tests/fixtures/pairs/a.md", "new");
    expect(readFileSync(join(root, "tests", "fixtures", "pairs", "a.md"), "utf8")).toBe("new");
  });

  it("refuses a link in tests/fixtures/ that points at a file elsewhere in the root", (context) => {
    mkdirSync(join(root, "tests", "fixtures"), { recursive: true });
    writeFileSync(join(root, "src.md"), "keep");
    const linked = link(join(root, "src.md"), join(root, "tests", "fixtures", "l.md"), "file");
    if (!linked) context.skip();
    expect(() => writeEscaped(root, "tests/fixtures/l.md", "x")).toThrow(/writes are limited/);
    expect(readFileSync(join(root, "src.md"), "utf8")).toBe("keep");
  });

  it("refuses to overwrite a file that has hard links", (context) => {
    mkdirSync(join(root, "tests", "fixtures"), { recursive: true });
    writeFileSync(join(root, "tests", "fixtures", "a.md"), "keep");
    try {
      linkSync(join(root, "tests", "fixtures", "a.md"), join(root, "b.md"));
    } catch {
      context.skip();
    }
    expect(() => writeEscaped(root, "tests/fixtures/a.md", "x")).toThrow(/hard links/);
    expect(readFileSync(join(root, "b.md"), "utf8")).toBe("keep");
  });
});

describe("main", () => {
  let stderrSpy: ReturnType<typeof vi.spyOn>;
  let stdoutSpy: ReturnType<typeof vi.spyOn>;

  afterEach(() => {
    stderrSpy?.mockRestore();
    stdoutSpy?.mockRestore();
  });

  it("returns 2 on a wrong argument count", () => {
    stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    expect(main([], root)).toBe(2);
    expect(main(["tmp/a.md"], root)).toBe(2);
    expect(main(["tmp/a.md", "x", "y"], root)).toBe(2);

    const stderrCalls = stderrSpy.mock.calls.map((call: unknown[]) => String(call[0])).join("");
    expect(stderrCalls).toContain("usage");
  });

  it("returns 1 on a refusal and 0 on success", () => {
    stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    expect(main(["../x.md", "a"], root)).toBe(1);
    const stderrAfterFirstCall = stderrSpy.mock.calls
      .map((call: unknown[]) => String(call[0]))
      .join("");
    expect(stderrAfterFirstCall).toContain("refusing path");

    stderrSpy.mockClear();
    stdoutSpy.mockClear();

    expect(main(["ok.md", "a"], root)).toBe(1);
    const stderrAfterSecondCall = stderrSpy.mock.calls
      .map((call: unknown[]) => String(call[0]))
      .join("");
    expect(stderrAfterSecondCall).toContain("refusing path");

    stderrSpy.mockClear();
    stdoutSpy.mockClear();

    expect(main(["tmp/ok.md", "a"], root)).toBe(0);
    const stdoutAfterSuccess = stdoutSpy.mock.calls
      .map((call: unknown[]) => String(call[0]))
      .join("");
    expect(stdoutAfterSuccess).toContain("wrote tmp/ok.md (1 bytes)");

    expect(bytesOf("tmp/ok.md")).toEqual([0x61]);
  });
});

describe("CLI process", () => {
  const folder = `write-escaped-test-${process.pid}-${Date.now()}`;
  const dir = join(REPO, "tmp", folder);

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  const run = (...args: string[]) =>
    spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8" });

  it("exits 0, prints path and byte count, writes the control characters", () => {
    const result = run(`tmp/${folder}/c.md`, "a\\n\\u001c\\n\\u0085\\nb\\n");
    expect(result.status).toBe(0);
    expect(result.stdout).toBe(`write-escaped: wrote tmp/${folder}/c.md (9 bytes)\n`);
    expect([...readFileSync(join(dir, "c.md"))]).toEqual([
      0x61, 0x0a, 0x1c, 0x0a, 0xc2, 0x85, 0x0a, 0x62, 0x0a,
    ]);
  });

  it("exits 1 with a message on a bad escape and writes nothing", () => {
    const result = run(`tmp/${folder}/bad.md`, "a\\q");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("unknown escape");
    expect(existsSync(join(dir, "bad.md"))).toBe(false);
  });

  it("exits 1 on a path outside the repo root", () => {
    const result = run("../write-escaped-outside.md", "a");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("outside");
    expect(existsSync(join(REPO, "..", "write-escaped-outside.md"))).toBe(false);
  });

  it("exits 1 on a secret-like path", () => {
    const result = run(`tmp/${folder}/.env`, "a");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("secret-like");
    expect(existsSync(join(dir, ".env"))).toBe(false);
  });

  it.each([["GIT~1/hooks/x"], ["NODE_M~1/x"], ["SECRET~1"]])(
    "exits 1 on the 8.3 short name %s",
    (path) => {
      const result = run(path, "a");
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("short-name");
      expect(existsSync(join(REPO, path))).toBe(false);
    },
  );

  it("exits 1 on a new file outside tests/fixtures/ and tmp/", () => {
    const path = "docs/write-escaped-probe-never-created.md";
    const result = run(path, "a");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("writes are limited to tests/fixtures/ and tmp/");
    expect(existsSync(join(REPO, path))).toBe(false);
  });

  it("exits 1 on a test file that pnpm test would run", () => {
    const result = run(`tmp/${folder}/a.test.mjs`, "throw 1");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("extension not allowed");
    expect(existsSync(join(dir, "a.test.mjs"))).toBe(false);
  });

  it("exits 1 when the target exists in tmp/", () => {
    expect(run(`tmp/${folder}/o.md`, "a").status).toBe(0);
    const result = run(`tmp/${folder}/o.md`, "b");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("refusing to overwrite");
    expect(readFileSync(join(dir, "o.md"), "utf8")).toBe("a");
  });

  it("exits 2 with a usage line on a wrong argument count", () => {
    const result = run("only-one-arg");
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("usage: node scripts/write-escaped.ts <path> <escaped-text>");
  });
});
