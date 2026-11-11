/**
 * `--verify` (docs/spec.md 7.3): template syntax only. Each distinct template is read
 * and parsed; no target file is read, no `[io:exists]` check runs, no io is needed.
 *
 * - From a config: every distinct template of the pairs, in pair order.
 * - From paths: those files are the templates, no config needed.
 * - A template that does not parse or is not UTF-8 is broken (exit 1); one that does
 *   not exist is `MTL910` and one that is not a regular file `MTL911` (exit 2).
 *   Tag warnings (`MTL010` to `MTL016`, `MTL031`) do not fail and carry their template line
 *   (spec 8.3, C09). Template errors (`MTL017`, `MTL018`, `MTL019` and `MTL030`, spec 2.7)
 *   are counted apart (`summary.errors`): the template FAILS (exit 1) without being
 *   broken, and its schema is still described. A run error outranks a broken or failed
 *   template: one missing template and one broken template is exit 2.
 * - An ok template carries its schema (`schema.ts`): filename convention, fields with
 *   type and rules, headings with rules (spec 8.3).
 */
import { homedir } from "node:os";
import { displayPath, foldPath, resolvePath } from "../config/paths.js";
import type { ConfigResult, RunDiagnostic } from "../config/types.js";
import { createRegistry, type RuleRegistry } from "../engine/registry.js";
import { withExcerpts } from "./excerpt.js";
import { pathKey, templateProblem } from "./files.js";
import { describeTemplate } from "./schema.js";
import { brokenReport, loadTemplate } from "./template.js";
import type { ExitCode, VerifyResult, VerifyTemplate } from "./types.js";

export interface VerifyOptions {
  /** Rule registry (default: every rule). */
  readonly registry?: RuleRegistry;
}

interface TemplateRef {
  /** Resolved, folded path. */
  readonly path: string;
  /** Printed path. */
  readonly shown: string;
  /** First pair that uses it (config mode only). */
  readonly pair?: string;
}

async function verifyRefs(config: string | null, refs: readonly TemplateRef[], options: VerifyOptions): Promise<VerifyResult> {
  const registry = options.registry ?? createRegistry();
  const templates: VerifyTemplate[] = [];
  const runErrors: RunDiagnostic[] = [];
  const seen = new Set<string>();
  for (const ref of refs) {
    const key = pathKey(ref.path);
    if (seen.has(key)) continue;
    seen.add(key);
    const problem = await templateProblem(ref.path);
    if (problem !== null) {
      const suffix = ref.pair === undefined ? "" : ` (pair '${ref.pair}')`;
      runErrors.push(
        problem === "MTL910"
          ? {
              code: "MTL910",
              severity: "error",
              message: `template not found: ${ref.shown}${suffix}`,
              ...(ref.pair === undefined ? {} : { pair: ref.pair }),
            }
          : {
              code: "MTL911",
              severity: "error",
              message: `template path is not a regular file (for example a directory): ${ref.shown}${suffix}`,
              ...(ref.pair === undefined ? {} : { pair: ref.pair }),
            },
      );
      continue;
    }
    const status = await loadTemplate(registry, ref.path);
    templates.push(
      status.status === "broken"
        ? {
            template: brokenReport(ref.shown, status.diagnostics),
            warnings: [],
            errors: [],
            schema: null,
          }
        : {
            template: { path: ref.shown, status: "ok" },
            warnings: withExcerpts(status.warnings, status.text),
            errors: withExcerpts(status.errors, status.text),
            schema: describeTemplate(status.model),
          },
    );
  }
  const broken = templates.filter((item) => item.template.status === "broken").length;
  const errors = templates.reduce((count, item) => count + item.errors.length, 0);
  let exitCode: ExitCode = 0;
  if (runErrors.length > 0) exitCode = 2;
  else if (broken > 0 || errors > 0) exitCode = 1;
  return {
    mode: "verify",
    config,
    templates,
    runErrors,
    summary: {
      templates: templates.length,
      broken,
      errors,
      warnings: templates.reduce((count, item) => count + item.warnings.length, 0),
      runErrors: runErrors.length,
      exitCode,
    },
  };
}

/** Verify every distinct template of a loaded config. A failed config yields exit code 2. */
export async function verifyConfig(loaded: ConfigResult, options: VerifyOptions = {}): Promise<VerifyResult> {
  if (!loaded.ok) {
    return {
      mode: "verify",
      config: loaded.display,
      templates: [],
      runErrors: loaded.errors,
      summary: {
        templates: 0,
        broken: 0,
        errors: 0,
        warnings: 0,
        runErrors: loaded.errors.length,
        exitCode: 2,
      },
    };
  }
  const { config } = loaded;
  const refs = config.pairs.map((pair) => ({
    path: pair.templatePath,
    shown: displayPath(pair.templatePath, config.dir),
    pair: pair.name,
  }));
  return verifyRefs(config.display, refs, options);
}

export interface VerifyPathsInput {
  /** Working directory (absolute): relative paths are relative to it. */
  readonly cwd: string;
  /** Home directory for `~` (default: the OS home). */
  readonly home?: string;
  /** The template paths as given. */
  readonly paths: readonly string[];
}

/** Verify the given files as templates. No config is read. */
export function verifyPaths(input: VerifyPathsInput, options: VerifyOptions = {}): Promise<VerifyResult> {
  const cwd = foldPath(input.cwd);
  const home = input.home ?? homedir();
  const refs = input.paths.map((given) => {
    const path = resolvePath(given, cwd, home);
    return { path, shown: displayPath(path, cwd) };
  });
  return verifyRefs(null, refs, options);
}
