/**
 * Runner (docs/spec.md 7, 8.4): expands every pair of a validated config on its
 * roots, lints the targets through the pipeline and returns plain data.
 *
 * Order (spec 8.4): roots (`project` first, then the `roots` map in declaration
 * order), pairs in config order, files sorted by root-relative path.
 *
 * Per pair and root, in this order:
 * 1. root directory missing: `MTL909` once per root, its pairs report nothing more;
 * 2. template path missing / not a regular file: `MTL910` / `MTL911` once per pair,
 *    that pair is skipped, the others still run (D14);
 * 3. targets: includes minus excludes below the root; the template itself is never a
 *    target (AS6); none: `MTL913` per `onEmpty` (7.4);
 * 4. the template is read and parsed ONCE per run (cached by resolved path, D05);
 *    broken (`MTL001` to `MTL004`): the files of this pair are not linted, other
 *    pairs still run (C02);
 * 5. each target is read (strict UTF-8) and checked with `io` rooted at the pair
 *    root (D11); aliases and approved paths come from the config. Each diagnostic
 *    gets its target source line from that same text (`excerpt.ts`, spec 8.1).
 *
 * File-list mode (`RunOptions.files`, spec 7.2): the listed files are matched against
 * each pair and root by path only (`list.ts`); a root or pair no file falls into is
 * skipped silently (no `MTL913`), a matching file that does not exist is `MTL912` once,
 * a file matching no pair is reported in `RunResult.unmatched`. The steps above then
 * run on the existing listed files instead of the walk.
 *
 * Template errors (`MTL017`, ..., spec 7.5, 8.2, owner decision 2 of A72l): a template that
 * parses with template errors is not broken; its pair block carries a `fail` template entry
 * (in every block that uses it), its files are still linted, and it is listed once in
 * `failedTemplates`. The excerpts of those errors are built at parse time (EX8).
 *
 * Exit code (7.5): 2 with any run error, else 1 with a failed file, a broken template or
 * a template with template errors, else 0.
 */
import { displayPath, foldPath } from "../config/paths.js";
import type { ConfigResult, PairConfig, RunDiagnostic } from "../config/types.js";
import { lintTarget } from "../engine/pipeline.js";
import type { Diagnostic } from "../engine/model.js";
import { createRegistry, runPhase, type RuleRegistry } from "../engine/registry.js";
import type { RuleEnv, RuleIo } from "../engine/rule.js";
import { withExcerpts } from "./excerpt.js";
import { isDirectory, isRegularFile, readUtf8, samePath, templateProblem, type ReadResult } from "./files.js";
import { listedMatches, resolveFileList, type FileListInput, type ListedFile, type ListedMatch } from "./list.js";
import { brokenReport, loadTemplate, withoutText, type LintTemplate } from "./template.js";
import type { Block, ExitCode, FileResult, PairBlock, ReportedDiagnostic, RunResult, RunSummary, TemplateReport } from "./types.js";
import { targetsOf } from "./walk.js";

export interface RunOptions {
  /** File system and network access of `[io:exists]`; the production one is `createRealIo`. */
  readonly io: RuleIo;
  /** Rule registry (default: every rule). */
  readonly registry?: RuleRegistry;
  /**
   * File-list mode (spec 7.2): lint only these files, matched against the pairs by
   * path. Absent: a full run. `RunResult.unmatched` lists the arguments that matched
   * no pair; a matching file that does not exist is `MTL912`.
   */
  readonly files?: FileListInput;
}

/** Target reads in flight ahead of the file being linted (bounded memory). */
const READ_AHEAD = 16;

const PARSE_CODES = new Set(["MTL001", "MTL002", "MTL003", "MTL004"]);

/** Spec 4.1 step 1: a parse failure of a target is printed `Parse error: <message>`. */
function parseErrorPrefix(diagnostic: Diagnostic): Diagnostic {
  return PARSE_CODES.has(diagnostic.code) ? { ...diagnostic, message: `Parse error: ${diagnostic.message}` } : diagnostic;
}

interface Counts {
  readonly checked: number;
  readonly broken: number;
  /** Distinct templates with template errors (spec 7.5). */
  readonly failedTemplates: number;
  readonly runErrors: number;
  readonly runWarnings: number;
  readonly suppressed: number;
}

/**
 * Summary and exit code (spec 7.5, 8.2, 8.5). Suppressed diagnostics are already
 * out of the file results, so they never count in warnings, failed or the exit code.
 */
function summarize(blocks: readonly Block[], counts: Counts): RunSummary {
  const files = blocks.flatMap((block) => (block.kind === "pair" ? block.files : []));
  const failed = files.filter((file) => file.status === "fail").length;
  const warnings = files.reduce((count, file) => count + file.warnings.length, 0);
  let exitCode: ExitCode = 0;
  if (counts.runErrors > 0) exitCode = 2;
  else if (failed > 0 || counts.broken > 0 || counts.failedTemplates > 0) exitCode = 1;
  return {
    files: files.length,
    passed: files.length - failed,
    failed,
    warnings,
    filesWithWarnings: files.filter((file) => file.warnings.length > 0).length,
    suppressed: counts.suppressed,
    templatesChecked: counts.checked,
    templatesBroken: counts.broken,
    runErrors: counts.runErrors,
    runWarnings: counts.runWarnings,
    exitCode,
  };
}

function finish(
  config: string | null,
  blocks: readonly Block[],
  runErrors: readonly RunDiagnostic[],
  runWarnings: readonly RunDiagnostic[],
  checked: ReadonlySet<string>,
  broken: ReadonlyMap<string, string>,
  failedTemplates: ReadonlySet<string> = new Set(),
  unmatched: readonly string[] = [],
  suppressed = 0,
): RunResult {
  return {
    mode: "lint",
    config,
    blocks,
    brokenTemplates: [...broken].map(([path, message]) => ({ path, message })),
    failedTemplates: [...failedTemplates],
    runErrors,
    runWarnings,
    unmatched,
    summary: summarize(blocks, {
      checked: checked.size,
      broken: broken.size,
      failedTemplates: failedTemplates.size,
      runErrors: runErrors.length,
      runWarnings: runWarnings.length,
      suppressed,
    }),
  };
}

/** Lint everything the config names. A failed config yields the result of exit code 2. */
export async function runLint(loaded: ConfigResult, options: RunOptions): Promise<RunResult> {
  if (!loaded.ok) return finish(loaded.display, [], loaded.errors, [], new Set(), new Map());
  const config = loaded.config;
  const registry = options.registry ?? createRegistry();
  const blocks: Block[] = [];
  const runErrors: RunDiagnostic[] = [];
  const runWarnings: RunDiagnostic[] = [];
  const checked = new Set<string>();
  const broken = new Map<string, string>();
  /** Printed paths of the templates with template errors, in order of appearance. */
  const failedTemplates = new Set<string>();
  /** Diagnostics removed by disable directives, per pair-file lint (spec 4.4 DIR9). */
  let suppressed = 0;

  const problems = new Map<string, Promise<"MTL910" | "MTL911" | null>>();
  const parsed = new Map<string, Promise<LintTemplate>>();
  const reportedProblem = new Set<string>();

  const problemOf = (path: string) => {
    let hit = problems.get(path);
    if (hit === undefined) {
      hit = templateProblem(path);
      problems.set(path, hit);
    }
    return hit;
  };

  const parseOnce = (path: string): Promise<LintTemplate> => {
    let hit = parsed.get(path);
    if (hit === undefined) {
      // The template text is dropped here; the only template lines a lint run quotes, those
      // of the template errors, get their excerpts first (EX8).
      hit = loadTemplate(registry, path).then(withoutText);
      parsed.set(path, hit);
    }
    return hit;
  };

  // File-list mode (spec 7.2): the arguments, and the ones some pair accepted.
  const listed: readonly ListedFile[] | null = options.files === undefined ? null : resolveFileList(options.files);
  const matchedAnywhere = new Set<string>();
  const missingReported = new Set<string>();

  /** Keep the listed targets that exist; each missing one is `MTL912`, once per file. */
  const existingTargets = async (matches: readonly ListedMatch[], pair: PairConfig, rootName: string, rootDir: string): Promise<string[]> => {
    const files: string[] = [];
    for (const match of matches) {
      if (await isRegularFile(`${rootDir}/${match.relative}`)) files.push(match.relative);
      else if (!missingReported.has(match.file.key)) {
        missingReported.add(match.file.key);
        runErrors.push({
          code: "MTL912",
          severity: "error",
          message: `target not found: ${match.file.shown}`,
          pair: pair.name,
          root: rootName,
        });
      }
    }
    return files;
  };

  const lintFile = async (status: Extract<LintTemplate, { status: "ok" }>, env: RuleEnv, relative: string, read: ReadResult): Promise<FileResult> => {
    let found: Diagnostic[];
    if (read.ok) {
      const linted = await lintTarget(registry, status.model, read.text, relative, env);
      found = linted.diagnostics;
      suppressed += linted.suppressed;
    } else {
      const failure = { reason: "file-unreadable", detail: read.detail } as const;
      const context = { phase: "parse", role: "target", failure } as const;
      found = await runPhase(registry, "parse", context);
    }
    // Spec 8.1: the target line of each diagnostic, from the text just read (no second read).
    const prefixed = found.map(parseErrorPrefix);
    const diagnostics: readonly ReportedDiagnostic[] = read.ok ? withExcerpts(prefixed, read.text) : prefixed;
    const errors = diagnostics.filter((diagnostic) => diagnostic.severity === "error");
    const warnings = diagnostics.filter((diagnostic) => diagnostic.severity === "warning");
    return { path: relative, status: errors.length > 0 ? "fail" : "pass", errors, warnings };
  };

  const runPair = async (pair: PairConfig, rootName: string, rootDir: string, matches: readonly ListedMatch[] | null): Promise<void> => {
    let files: string[] = [];
    if (matches !== null) {
      files = await existingTargets(matches, pair, rootName, rootDir);
      if (files.length === 0) return;
    }
    const problem = await problemOf(pair.templatePath);
    if (problem !== null) {
      if (reportedProblem.has(pair.name)) return;
      reportedProblem.add(pair.name);
      const shown = displayPath(pair.templatePath, config.dir);
      runErrors.push(
        problem === "MTL910"
          ? {
              code: "MTL910",
              severity: "error",
              message: `template not found: ${shown} (pair '${pair.name}')`,
              pair: pair.name,
            }
          : {
              code: "MTL911",
              severity: "error",
              message: `template path is not a regular file (for example a directory): ${shown} (pair '${pair.name}')`,
              pair: pair.name,
            },
      );
      return;
    }

    if (matches === null) {
      files = (await targetsOf(rootDir, pair.includeGlobs, pair.excludeGlobs)).filter((relative) => !samePath(foldPath(`${rootDir}/${relative}`), pair.templatePath));
      if (files.length === 0) {
        if (pair.onEmpty === "ignore") return;
        const diagnostic: RunDiagnostic = {
          code: "MTL913",
          severity: pair.onEmpty === "error" ? "error" : "warning",
          message: `no files matched pair '${pair.name}' in root '${rootName}'`,
          pair: pair.name,
          root: rootName,
        };
        if (pair.onEmpty === "error") runErrors.push(diagnostic);
        else {
          runWarnings.push(diagnostic);
          blocks.push({ kind: "note", diagnostic });
        }
        return;
      }
    }

    const templateShown = displayPath(pair.templatePath, config.dir);
    checked.add(templateShown);
    const status = await parseOnce(pair.templatePath);
    const head = { kind: "pair", root: rootName, pair: pair.name, include: pair.include } as const;
    const tail = { description: pair.description, fileCount: files.length } as const;
    if (status.status === "broken") {
      const template = brokenReport(templateShown, status.diagnostics);
      broken.set(templateShown, template.error.message);
      blocks.push({ ...head, template, ...tail, files: [] });
      return;
    }

    const env: RuleEnv = {
      aliases: config.aliases,
      approvedPaths: config.approvedPaths,
      pairRoot: rootDir,
      io: options.io,
    };
    // Template errors fail the template, not its pair: the targets are still linted (7.5).
    let template: TemplateReport = { path: templateShown, status: "ok" };
    if (status.errors.length > 0) {
      template = { path: templateShown, status: "fail", errors: status.errors };
      failedTemplates.add(templateShown);
    }
    // Reads run up to READ_AHEAD files ahead, but file i is linted (and its result pushed) only
    // after its own read, before file i+1: diagnostics keep the file order. readUtf8 never rejects.
    const readAt = (index: number): Promise<ReadResult> => readUtf8(`${rootDir}/${files[index] ?? ""}`);
    const reads = files.slice(0, READ_AHEAD).map((_, index) => readAt(index));
    const results: FileResult[] = [];
    for (const [index, relative] of files.entries()) {
      const read = reads[index % READ_AHEAD] ?? readAt(index);
      if (index + READ_AHEAD < files.length) reads[index % READ_AHEAD] = readAt(index + READ_AHEAD);
      results.push(await lintFile(status, env, relative, await read));
    }
    const block: PairBlock = {
      ...head,
      template,
      ...tail,
      files: results,
    };
    blocks.push(block);
  };

  for (const rootName of ["project", ...config.roots.keys()]) {
    const pairs = config.pairs.filter((pair) => pair.roots.includes(rootName));
    if (pairs.length === 0) continue;
    const rootDir = rootName === "project" ? config.dir : config.roots.get(rootName);
    if (rootDir === undefined) continue;
    // File-list mode matches by path first: a root no argument falls into is skipped
    // without touching the file system.
    let matches: Map<PairConfig, ListedMatch[]> | null = null;
    if (listed !== null) {
      matches = new Map(pairs.map((pair) => [pair, listedMatches(listed, rootDir, pair)]));
      for (const found of matches.values()) {
        for (const match of found) matchedAnywhere.add(match.file.key);
      }
      if ([...matches.values()].every((found) => found.length === 0)) continue;
    }
    if (!(await isDirectory(rootDir))) {
      runErrors.push({
        code: "MTL909",
        severity: "error",
        message: `root '${rootName}' directory not found: ${displayPath(rootDir, config.dir)}`,
        root: rootName,
      });
      continue;
    }
    for (const pair of pairs) await runPair(pair, rootName, rootDir, matches?.get(pair) ?? null);
  }
  const unmatched = listed === null ? [] : listed.filter((file) => !matchedAnywhere.has(file.key)).map((file) => file.shown);
  return finish(config.display, blocks, runErrors, runWarnings, checked, broken, failedTemplates, unmatched, suppressed);
}
