/**
 * Cross-tag integration (docs/spec.md 4.1, 8.4): one many-tag template (field
 * presence, format, count, range, type, enum, order, scheme, io and filename
 * tags; heading presence tags; content tags) run through `checkTemplate` and
 * `checkTarget` with the real registry and an in-memory env (no network). Each
 * case asserts the FULL ordered diagnostic list, not one code. At least 1
 * passing case and 1 failing case, one fixture dir each.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { Diagnostic } from "../../src/engine/model.js";
import { checkTarget, checkTemplate } from "../../src/engine/pipeline.js";
import { createRegistry } from "../../src/engine/registry.js";
import { createEnv, createMemoryIo } from "../../src/engine/rule.js";

const registry = createRegistry();
const DIR = "tests/fixtures/integration";

/** What a case expects of a diagnostic: nothing else is compared. */
interface Expected {
  readonly code: string;
  readonly severity: "error" | "warning";
  readonly message: string;
}

const error = (code: string, message: string): Expected => ({ code, severity: "error", message });
const warning = (code: string, message: string): Expected => ({
  code,
  severity: "warning",
  message,
});

/**
 * Case -> target path given to the engine, template warnings and the full
 * ordered target diagnostic list (errors first, then warnings, each in
 * emission order, spec 4.1 and 8.4).
 */
const CASES: readonly {
  readonly name: string;
  readonly targetPath: string;
  readonly templateWarnings: readonly Expected[];
  readonly expected: readonly Expected[];
}[] = [
  {
    name: "pass-release-notes",
    targetPath: "release-notes.md",
    templateWarnings: [],
    expected: [],
  },
  {
    // One finding per tag family. Per field the steps run in spec order
    // (slug: value-filename before case; tags: count before elements;
    // homepage: scheme before io); unknown keys last; warnings after errors.
    name: "fail-frontmatter-rules",
    targetPath: "release-notes.md",
    templateWarnings: [],
    expected: [
      error(
        "MTL102",
        "Field 'slug': expected value to equal filename 'release-notes' ([value:filename]), got 'Release_Notes'",
      ),
      error(
        "MTL302",
        "Field 'slug': value 'Release_Notes' does not match required format [kebab-case]",
      ),
      error("MTL402", "Field 'tags': list has 4 item(s), maximum is 3"),
      error(
        "MTL303",
        "Field 'tags': list contains entries not matching [format:elements:kebab-case]: ['Alpha']",
      ),
      error("MTL404", "Field 'rating': value 9 is above range:max 5"),
      error(
        "MTL407",
        "Field 'milestones': dates are not in ascending order ('2026-06' comes before '2026-01') [order:ascending]",
      ),
      error(
        "MTL304",
        "Field 'homepage': URL scheme of 'ftp://example.org' is not allowed [format:scheme:https]",
      ),
      warning(
        "MTL517",
        "Field 'status' (type=enum): value 'published' is not one of the allowed options ['draft', 'accepted']",
      ),
      warning("MTL805", "Field 'homepage': URL 'ftp://example.org' not reachable (not probed)"),
      warning("MTL202", "Unknown key 'extra' not present in template"),
    ],
  },
  {
    // File name first, then the field, then headings (template heading order,
    // order finding last), then content in template SECTION order across codes
    // (Changes MTL702, Overview MTL701, Steps MTL703 and MTL705).
    name: "fail-filename-headings-content",
    targetPath: "Release_Notes.md",
    templateWarnings: [warning("MTL010", "Field 'reviewer': unknown tag [nope:y]")],
    expected: [
      error(
        "MTL101",
        "Filename 'Release_Notes' does not match required case [filename:case:kebab-case]",
      ),
      error(
        "MTL102",
        "Field 'slug': expected value to equal filename 'Release_Notes' ([value:filename]), got 'release-notes'",
      ),
      error("MTL601", "Heading: Missing required heading: 'Summary'"),
      error(
        "MTL603",
        "Heading: Heading 'Authoring checklist' is marked [presence:template-only] and must not appear in the linted file",
      ),
      error(
        "MTL604",
        "Heading: Heading order mismatch: template order ['Release notes', 'Changes', 'Overview', 'Steps', 'Summary', 'Authoring checklist'] vs target order ['Release notes', 'Steps', 'Overview', 'Authoring checklist', 'Changes']",
      ),
      error("MTL702", "Section 'Changes': [content:table] no markdown table row found"),
      error("MTL701", "Section 'Overview': [content:non-empty] section body is empty"),
      error("MTL703", "Section 'Steps': [content:list] no markdown list item found"),
      error("MTL705", "Section 'Steps': [content:max-lines:3] 4 non-blank line(s)"),
    ],
  },
];

const read = (path: string): string =>
  readFileSync(fileURLToPath(new URL(`../../${path}`, import.meta.url)), "utf8");

/** Every directory and file under DIR, at any depth, as sorted `/`-separated relative paths. */
function listTree(): { dirs: string[]; files: string[] } {
  const root = fileURLToPath(new URL(`../../${DIR}`, import.meta.url));
  const dirs: string[] = [];
  const files: string[] = [];
  for (const entry of readdirSync(root, { recursive: true, withFileTypes: true })) {
    const path = relative(root, join(entry.parentPath, entry.name)).replaceAll("\\", "/");
    (entry.isDirectory() ? dirs : files).push(path);
  }
  return { dirs: dirs.sort(), files: files.sort() };
}

const summary = (diagnostics: readonly Diagnostic[]): Expected[] =>
  diagnostics.map(({ code, severity, message }) => ({ code, severity, message }));

/** In-memory env: only the https homepage of the fixtures is reachable. */
const env = createEnv({
  io: createMemoryIo([], new Map([["https://example.org", { reachable: true }]])),
});

describe("rule set: many-tag template, real registry, in-memory io", () => {
  it("has at least 1 pass- case and at least 1 fail- case, one fixture dir each", () => {
    const passing = CASES.filter((testCase) => testCase.name.startsWith("pass-"));
    const failing = CASES.filter((testCase) => testCase.name.startsWith("fail-"));
    expect(passing.length).toBeGreaterThanOrEqual(1);
    expect(failing.length).toBeGreaterThanOrEqual(1);
    expect(passing.length + failing.length).toBe(CASES.length);
    expect(CASES.filter((testCase) => testCase.expected.length === 0)).toEqual(passing);
    // Orphan detection: no directory at any depth besides the cases, and each holds only the pair.
    const names = CASES.map((testCase) => testCase.name).sort();
    const tree = listTree();
    expect(tree.dirs).toEqual(names);
    expect(tree.files).toEqual(
      names.flatMap((name) => [`${name}/target.md`, `${name}/template.md`]).sort(),
    );
  });

  for (const testCase of CASES) {
    it(`${testCase.name}: ${DIR}/${testCase.name}`, async () => {
      const fixture = `${DIR}/${testCase.name}`;
      const status = await checkTemplate(registry, read(`${fixture}/template.md`));
      if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
      expect(summary(status.warnings)).toEqual(testCase.templateWarnings);
      const found = await checkTarget(
        registry,
        status.model,
        read(`${fixture}/target.md`),
        testCase.targetPath,
        env,
      );
      expect(summary(found)).toEqual(testCase.expected);
    });
  }
});
