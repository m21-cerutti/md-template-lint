/**
 * Usage: pnpm run bench [--runs N] [--json]
 * Opt-in timing bench: generates synthetic projects in a fresh OS temp dir, then times in-process
 * `loadConfig` + `runLint` per workload (one cold run, then N warm runs, default 5).
 * It asserts nothing and is not part of `pnpm test`, CI or the hooks. Compare two states of the
 * code by running it on each and comparing medians; CV (percent) tells how noisy a workload is.
 * Writes only inside the temp dir, which is always removed. No network (in-memory io).
 * Exit code: 0 done, 2 bad arguments or harness error.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { loadConfig } from "../src/config/load.ts";
import { createMemoryIo } from "../src/engine/rule.ts";
import { runLint } from "../src/runner/run.ts";

const DEFAULT_RUNS = 5;

/** A generated project: its folder (holds `md-template-lint.yml`) and what to report about it. */
interface Workload {
  readonly name: string;
  readonly dir: string;
}

interface Timing {
  readonly name: string;
  /** Files linted and failed in the last run (a sanity check that the workload is realistic). */
  readonly files: number;
  readonly failed: number;
  readonly coldMs: number;
  readonly warmMs: readonly number[];
  readonly medianMs: number;
  readonly minMs: number;
  /** Coefficient of variation of the warm runs, in percent. */
  readonly cvPercent: number;
}

interface Options {
  readonly runs: number;
  readonly json: boolean;
}

function parseArgs(argv: readonly string[]): Options | string {
  let runs = DEFAULT_RUNS;
  let json = false;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index] ?? "";
    if (arg === "--json") json = true;
    else if (arg === "--runs" || arg.startsWith("--runs=")) {
      const value = arg === "--runs" ? argv[(index += 1)] : arg.slice("--runs=".length);
      runs = Number(value);
      if (value === undefined || !Number.isInteger(runs) || runs < 1) return `--runs needs a whole number of 1 or more, got '${String(value)}'`;
    } else return `unknown argument '${arg}'`;
  }
  return { runs, json };
}

// ---------------------------------------------------------------------------------------------
// Generators (all outside the timed region)
// ---------------------------------------------------------------------------------------------

const NOTE_TEMPLATE = ["---", 'title: "string" # [presence:required]', "tags: [a] # [count:min:1]", "---", "", "## Summary [content:non-empty]", "", "## Details", "", "### Notes [presence:optional]", ""].join("\n");

function noteInstance(index: number): string {
  return ["---", `title: Note ${index}`, "tags: [demo]", "---", "", "## Summary", "", "Some text.", "", "## Details", "", "More text.", "", "### Notes", "", "A note.", ""].join("\n");
}

function write(dir: string, relative: string, text: string): void {
  writeFileSync(join(dir, ...relative.split("/")), text);
}

function makeDirs(dir: string, relatives: readonly string[]): void {
  for (const relative of relatives) mkdirSync(join(dir, ...relative.split("/")), { recursive: true });
}

function pairYaml(name: string, template: string, include: string): string {
  return `  - name: ${name}\n    template: ${template}\n    include: ${include}\n`;
}

/** One template, `files` notes. */
function oneTemplate(root: string, name: string, files: number): Workload {
  const dir = join(root, name);
  makeDirs(dir, ["templates", "docs"]);
  write(dir, "templates/note.template.md", NOTE_TEMPLATE);
  write(dir, "md-template-lint.yml", `pairs:\n${pairYaml("notes", "templates/note.template.md", "docs/*.md")}`);
  for (let index = 0; index < files; index += 1) write(dir, `docs/note-${index}.md`, noteInstance(index));
  return { name: `${files} files, 1 template`, dir };
}

/** One template with a repeated heading, one file with `headings` headings. */
function manyHeadings(root: string, headings: number): Workload {
  const dir = join(root, "many-headings");
  makeDirs(dir, ["templates", "docs"]);
  const template = ["---", 'title: "string"', "---", "", "## Overview", "", '## Step 1 [pattern:"Step {digits}"] [repeat-rules:same-level]', ""].join("\n");
  write(dir, "templates/steps.template.md", template);
  write(dir, "md-template-lint.yml", `pairs:\n${pairYaml("steps", "templates/steps.template.md", "docs/*.md")}`);
  const lines = ["---", "title: Steps", "---", "", "## Overview", "", "Intro.", ""];
  for (let step = 1; step < headings; step += 1) lines.push(`## Step ${step}`, "", `Body of step ${step}.`, "");
  write(dir, "docs/steps.md", lines.join("\n"));
  return { name: `1 file, ${headings} headings`, dir };
}

/** A template with `fields` frontmatter fields and `sections` H2 headings of two H3 children each. */
function largeTemplate(root: string, fields: number, sections: number, files: number): Workload {
  const dir = join(root, "large-template");
  makeDirs(dir, ["templates", "docs"]);
  const templateLines = ["---"];
  const instanceFront = ["---"];
  for (let field = 0; field < fields; field += 1) {
    templateLines.push(`field${field}: "string" # [presence:required]`);
    instanceFront.push(`field${field}: value ${field}`);
  }
  templateLines.push("---", "");
  instanceFront.push("---", "");
  const instanceBody: string[] = [];
  for (let section = 0; section < sections; section += 1) {
    templateLines.push(`## Section ${section} [content:non-empty]`, "", `### Part ${section}a`, "", `### Part ${section}b`, "");
    instanceBody.push(`## Section ${section}`, "", "Text.", "", `### Part ${section}a`, "", "A.", "", `### Part ${section}b`, "", "B.", "");
  }
  write(dir, "templates/large.template.md", templateLines.join("\n"));
  write(dir, "md-template-lint.yml", `pairs:\n${pairYaml("large", "templates/large.template.md", "docs/*.md")}`);
  const instance = [...instanceFront, ...instanceBody].join("\n");
  for (let index = 0; index < files; index += 1) write(dir, `docs/large-${index}.md`, instance);
  return { name: `large template (${fields} fields, ${sections * 3} headings), ${files} files`, dir };
}

/** `templates` pairs, each with its own template and `files` notes. */
function manyTemplates(root: string, templates: number, files: number): Workload {
  const dir = join(root, "many-templates");
  makeDirs(dir, ["templates"]);
  let config = "pairs:\n";
  for (let pair = 0; pair < templates; pair += 1) {
    makeDirs(dir, [`docs/t${pair}`]);
    write(dir, `templates/t${pair}.template.md`, NOTE_TEMPLATE);
    config += pairYaml(`t${pair}`, `templates/t${pair}.template.md`, `docs/t${pair}/*.md`);
    for (let index = 0; index < files; index += 1) write(dir, `docs/t${pair}/note-${index}.md`, noteInstance(index));
  }
  write(dir, "md-template-lint.yml", config);
  return { name: `${templates} templates, ${files} files each`, dir };
}

function generate(root: string): Workload[] {
  return [oneTemplate(root, "files-500", 500), oneTemplate(root, "files-2000", 2000), manyHeadings(root, 5000), largeTemplate(root, 300, 200, 5), manyTemplates(root, 200, 3)];
}

// ---------------------------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------------------------

async function timeOnce(dir: string): Promise<{ readonly ms: number; readonly files: number; readonly failed: number }> {
  const start = performance.now();
  const loaded = await loadConfig({ cwd: dir, boundary: dir });
  const result = await runLint(loaded, { io: createMemoryIo() });
  const ms = performance.now() - start;
  return { ms, files: result.summary.files, failed: result.summary.failed };
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? (sorted[middle] ?? 0) : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

/** Sample standard deviation over the mean, in percent; 0 for fewer than two runs. */
function cvPercent(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (mean === 0) return 0;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1);
  return (Math.sqrt(variance) / mean) * 100;
}

async function measure(workload: Workload, runs: number): Promise<Timing> {
  const cold = await timeOnce(workload.dir);
  const warm: number[] = [];
  let last = cold;
  for (let run = 0; run < runs; run += 1) {
    last = await timeOnce(workload.dir);
    warm.push(last.ms);
  }
  return {
    name: workload.name,
    files: last.files,
    failed: last.failed,
    coldMs: cold.ms,
    warmMs: warm,
    medianMs: median(warm),
    minMs: Math.min(...warm),
    cvPercent: cvPercent(warm),
  };
}

function table(timings: readonly Timing[]): string {
  const header = ["workload", "files", "failed", "cold ms", "median ms", "min ms", "CV %"];
  const rows = timings.map((timing) => [timing.name, String(timing.files), String(timing.failed), timing.coldMs.toFixed(1), timing.medianMs.toFixed(1), timing.minMs.toFixed(1), timing.cvPercent.toFixed(1)]);
  const widths = header.map((title, column) => Math.max(title.length, ...rows.map((row) => row[column]?.length ?? 0)));
  const line = (cells: readonly string[]): string => cells.map((cell, column) => (column === 0 ? cell.padEnd(widths[column] ?? 0) : cell.padStart(widths[column] ?? 0))).join("  ");
  return [line(header), widths.map((width) => "-".repeat(width)).join("  "), ...rows.map(line)].join("\n");
}

async function main(argv: readonly string[]): Promise<number> {
  const options = parseArgs(argv);
  if (typeof options === "string") {
    process.stderr.write(`bench: ${options}\nUsage: pnpm run bench [--runs N] [--json]\n`);
    return 2;
  }
  const root = mkdtempSync(join(tmpdir(), "mtl-bench-"));
  try {
    const workloads = generate(root);
    const timings: Timing[] = [];
    for (const workload of workloads) {
      if (!options.json) process.stderr.write(`running: ${workload.name}\n`);
      timings.push(await measure(workload, options.runs));
    }
    if (options.json) process.stdout.write(`${JSON.stringify({ runs: options.runs, node: process.version, workloads: timings }, null, 2)}\n`);
    else process.stdout.write(`\nmd-template-lint bench: 1 cold run, ${options.runs} warm run(s); median, min and CV are over the warm runs\n\n${table(timings)}\n`);
    return 0;
  } finally {
    try {
      rmSync(root, { recursive: true, force: true, maxRetries: 3 });
    } catch (error) {
      process.stderr.write(`warning: could not remove ${root}: ${String(error)}\n`);
    }
  }
}

try {
  process.exitCode = await main(process.argv.slice(2));
} catch (error) {
  process.stderr.write(`bench: harness error: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 2;
}
