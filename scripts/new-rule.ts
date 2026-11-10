// Scaffold a rule:
//   pnpm run new:rule -- <category> <name> [--code MTLnnn] [--phase <phase>] [--step <step>]
//                        [--syntax] [--root <dir>]
//
// Adds a `defineRule({...})` entry with a stub check (`notImplemented`, throws
// when run) to src/rules/<category>.ts, before the
// `// new:rule inserts above this line` marker, plus a test stub and fixture
// folders in the A39 layout:
//   target (default): tests/target/<category>/<MTLxxx>-<name>.test.ts
//                     tests/fixtures/pairs/<MTLxxx>/{pass,fail-1}/{template,target}.md
//   --syntax:         tests/syntax/<category>/<MTLxxx>-<name>.test.ts
//                     tests/fixtures/templates/<MTLxxx>/{pass-1,fail-1}.md
// The code is `--code`, else the docs/spec.md 4.3 row with that name in that
// category, else the next free code of the category range (then add the row
// to the spec, or `pnpm run check:rules` fails). The code stays in
// tests/consistency/pending-rules.json until the check is implemented.
// Phase: `template` for category syntax, else `field`; `field` and `target`
// need `--step` (a FieldStep / TargetStep of src/engine/rule.ts; a wrong step
// fails `pnpm run typecheck`). Ranges come from src/engine/ranges.json, the
// same file src/engine/rule.ts imports. `--root` writes into another tree
// (tests); the spec and ranges are always read from this repository.
// No dependencies; never runs git. Runs through Node type stripping (ADR 0004).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

/** Inclusive code range of a category (src/engine/ranges.json). */
type CodeRange = readonly [number, number];

/** A docs/spec.md 4.3 row. */
interface SpecRow {
  readonly code: string;
  readonly name: string;
  readonly severity: string;
  readonly category: string;
}

interface Options {
  syntax: boolean;
  code?: string;
  phase?: string;
  step?: string;
  root?: string;
}

/** Test case: [case name, fixture path, expected result]. */
type Case = [name: string, fixture: string, expected: string];

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const MARKER = "  // new:rule inserts above this line";
const IMPORT_FROM = 'from "../engine/rule.js";';
const PHASES = ["parse", "template", "field", "target"];
const STEP_PHASES = ["field", "target"];

function fail(message: string): never {
  process.stderr.write(`new:rule: ${message}\n`);
  process.exit(1);
}

function parseArgs(argv: readonly string[]): { positional: string[]; options: Options } {
  const positional: string[] = [];
  const options: Options = { syntax: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i] ?? "";
    if (arg === "--") {
      // pnpm forwards the bare `--` of `pnpm run new:rule -- ...` to the script.
      continue;
    } else if (arg === "--syntax") {
      options.syntax = true;
    } else if (arg === "--code" || arg === "--phase" || arg === "--step" || arg === "--root") {
      const value = argv[i + 1];
      if (value === undefined) fail(`${arg} requires a value`);
      if (arg === "--code") options.code = value;
      else if (arg === "--phase") options.phase = value;
      else if (arg === "--step") options.step = value;
      else options.root = value;
      i += 1;
    } else if (arg.startsWith("--")) {
      fail(`unknown option ${arg}`);
    } else {
      positional.push(arg);
    }
  }
  return { positional, options };
}

const isKebab = (name: string): boolean =>
  name.length > 0 &&
  !name.startsWith("-") &&
  !name.endsWith("-") &&
  [...name].every((c) => (c >= "a" && c <= "z") || (c >= "0" && c <= "9") || c === "-");

const codeOf = (number: number): string => `MTL${String(number).padStart(3, "0")}`;

function codeNumber(code: string): number | null {
  const digits = code.slice(3);
  if (!code.startsWith("MTL") || digits.length !== 3) return null;
  if (![...digits].every((c) => c >= "0" && c <= "9")) return null;
  return Number(digits);
}

/** Rows of docs/spec.md 4.3. Fails when the table is missing. */
function specRows(ranges: Readonly<Record<string, CodeRange>>): SpecRow[] {
  const spec = readFileSync(join(repo, "docs", "spec.md"), "utf8").replaceAll("\r\n", "\n");
  const start = spec.indexOf("\n### 4.3 Code table");
  if (start < 0) fail("docs/spec.md: heading '### 4.3 Code table' not found");
  const end = spec.indexOf("\n## 5.", start);
  if (end < 0) fail("docs/spec.md: heading '## 5.' after the code table not found");
  const rows: SpecRow[] = [];
  let category: string | null = null;
  for (const line of spec.slice(start, end).split("\n")) {
    if (line.startsWith("#### ")) {
      const word = line.slice(5).split(" ")[0] ?? "";
      category = word in ranges ? word : null;
    } else if (category !== null && line.startsWith("| `MTL")) {
      const cells = line.split("|").map((cell) => cell.trim().replaceAll("`", ""));
      const [, code = "", name = "", severity = ""] = cells;
      rows.push({ code, name, severity, category });
    }
  }
  if (rows.length === 0) fail("docs/spec.md 4.3: no rule rows found");
  return rows;
}

/** Every `<prefix>...` quoted value written in a rule file. */
function quotedValues(text: string, prefix: string): string[] {
  const values: string[] = [];
  let index = text.indexOf(prefix);
  while (index >= 0) {
    const from = index + prefix.length;
    values.push(text.slice(from, text.indexOf('"', from)));
    index = text.indexOf(prefix, from);
  }
  return values;
}

function write(file: string, content: string): void {
  if (existsSync(file)) fail(`${file} already exists`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

const ranges = JSON.parse(
  readFileSync(join(repo, "src", "engine", "ranges.json"), "utf8"),
) as Record<string, CodeRange>;
const { positional, options } = parseArgs(process.argv.slice(2));
const root = options.root ?? repo;
const [category, name] = positional;
if (positional.length !== 2 || category === undefined || name === undefined) {
  fail("usage: pnpm run new:rule -- <category> <name> [options]");
}
const bounds = category in ranges ? ranges[category] : undefined;
if (bounds === undefined) {
  fail(`unknown category '${category}' (${Object.keys(ranges).join(", ")})`);
}
if (!isKebab(name)) fail(`name '${name}' must be kebab-case (a-z, 0-9, -)`);

const phase = options.phase ?? (category === "syntax" ? "template" : "field");
if (!PHASES.includes(phase)) fail(`phase must be one of ${PHASES.join(", ")}`);
if (STEP_PHASES.includes(phase) && options.step === undefined) {
  fail(`phase '${phase}' needs --step (see FIELD_STEPS / TARGET_STEPS in src/engine/rule.ts)`);
}
if (!STEP_PHASES.includes(phase) && options.step !== undefined) {
  fail(`phase '${phase}' takes no --step`);
}

const ruleFile = join(root, "src", "rules", `${category}.ts`);
if (!existsSync(ruleFile)) fail(`${ruleFile} not found`);
const source = readFileSync(ruleFile, "utf8");
if (!source.includes(MARKER)) fail(`${ruleFile}: marker '${MARKER.trim()}' not found`);
const usedCodes = quotedValues(source, 'code: "');
if (quotedValues(source, 'name: "').includes(name)) fail(`rule '${name}' already exists`);

const rows = specRows(ranges);
const row = rows.find((entry) => entry.category === category && entry.name === name);
const [low, high] = bounds;
let code: string | undefined = options.code ?? row?.code;
if (code === undefined) {
  const taken = new Set([...usedCodes, ...rows.map((entry) => entry.code)]);
  for (let number = low; number <= high && code === undefined; number += 1) {
    if (!taken.has(codeOf(number))) code = codeOf(number);
  }
  if (code === undefined) fail(`no free code left in ${category} (${low}-${high})`);
}
const number = codeNumber(code);
if (number === null || number < low || number > high) {
  fail(`code ${code} is not in the ${category} range ${codeOf(low)}-${codeOf(high)}`);
}
if (usedCodes.includes(code)) fail(`code ${code} is already registered in ${ruleFile}`);

const severity = row?.severity.startsWith("warning") ? "warning" : "error";
const entry = [
  "  defineRule({",
  `    code: "${code}",`,
  `    name: "${name}",`,
  `    severity: "${severity}",`,
  `    category: "${category}",`,
  `    phase: "${phase}",`,
  ...(options.step === undefined ? [] : [`    step: "${options.step}",`]),
  `    check: notImplemented("${code}"),`,
  "  }),",
  "",
].join("\n");
let updated = source.replace(MARKER, `${entry}${MARKER}`);
if (!updated.includes("notImplemented,")) {
  const importLine = updated.split("\n").find((line) => line.endsWith(IMPORT_FROM));
  if (importLine === undefined) fail(`${ruleFile}: no import from ../engine/rule.js to extend`);
  const typeOnly = importLine.startsWith("import type {");
  const names = importLine
    .slice(importLine.indexOf("{") + 1, importLine.indexOf("}"))
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "" && part !== "defineRule" && part !== "notImplemented")
    .map((part) => (typeOnly && !part.startsWith("type ") ? `type ${part}` : part));
  const values = names.filter((part) => !part.startsWith("type "));
  const types = names.filter((part) => part.startsWith("type ")).map((part) => part.slice(5));
  const merged = [
    ...["defineRule", "notImplemented", ...values].sort(),
    ...types.sort().map((part) => `type ${part}`),
  ];
  const oneLine = `import { ${merged.join(", ")} } ${IMPORT_FROM}`;
  // Prettier style: one line up to 100 columns, else one name per line.
  const replacement =
    oneLine.length <= 100
      ? oneLine
      : `import {\n${merged.map((part) => `  ${part},`).join("\n")}\n} ${IMPORT_FROM}`;
  updated = updated.replace(importLine, replacement);
}

const family = options.syntax ? "syntax" : "target";
const testFile = join(root, "tests", family, category, `${code}-${name}.test.ts`);
const fixtureRoot = options.syntax
  ? `tests/fixtures/templates/${code}`
  : `tests/fixtures/pairs/${code}`;
const cases: Case[] = options.syntax
  ? [
      ["pass-1", `${fixtureRoot}/pass-1.md`, "clean"],
      ["fail-1", `${fixtureRoot}/fail-1.md`, code],
    ]
  : [
      ["pass", `${fixtureRoot}/pass`, "clean"],
      ["fail-1", `${fixtureRoot}/fail-1`, code],
    ];
const test = [
  `/** ${code} ${name} (src/rules/${category}.ts). Stub from \`pnpm run new:rule\`. */`,
  'import { describe, expect, it } from "vitest";',
  'import { createRegistry } from "../../../src/engine/registry.js";',
  "",
  "/** Case -> fixture -> expected result: exactly 1 passing case, failing cases >= passing. */",
  "const CASES = [",
  ...cases.map(
    ([caseName, fixture, expected]) =>
      `  { name: "${caseName}", fixture: "${fixture}", expected: "${expected}" },`,
  ),
  "] as const;",
  "",
  `describe("${code} ${name}", () => {`,
  `  it("is registered in category ${category}", () => {`,
  `    expect(createRegistry().byCode.get("${code}")).toMatchObject({`,
  `      name: "${name}",`,
  `      category: "${category}",`,
  "    });",
  "  });",
  "",
  "  for (const testCase of CASES) {",
  "    it.todo(`${testCase.name}: ${testCase.fixture} -> ${testCase.expected}`);",
  "  }",
  "});",
  "",
].join("\n");

const placeholder = "---\n---\n";
for (const path of [testFile, join(root, fixtureRoot)]) {
  if (existsSync(path)) fail(`${path} already exists`);
}
writeFileSync(ruleFile, updated);
write(testFile, test);
if (options.syntax) {
  write(join(root, fixtureRoot, "pass-1.md"), placeholder);
  write(join(root, fixtureRoot, "fail-1.md"), placeholder);
} else {
  for (const caseName of ["pass", "fail-1"]) {
    write(join(root, fixtureRoot, caseName, "template.md"), placeholder);
    write(join(root, fixtureRoot, caseName, "target.md"), placeholder);
  }
}

const relativeTest = `tests/${family}/${category}/${code}-${name}.test.ts`;
process.stdout.write(`new:rule: ${code} ${name} (stub) added to src/rules/${category}.ts\n`);
process.stdout.write(`new:rule: test stub ${relativeTest}, fixtures ${fixtureRoot}/\n`);
if (row === undefined || row.code !== code) {
  process.stdout.write(
    `new:rule: ${code} is not a docs/spec.md 4.3 row for '${name}': add the row and a ` +
      "pending-rules.json entry, or `pnpm run check:rules` fails\n",
  );
}
