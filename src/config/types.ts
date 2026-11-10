/**
 * Types of the loaded config (docs/spec.md 6) and of run diagnostics
 * (`MTL9xx`, spec 4.3).
 */
import type { RuleCode, Severity } from "../engine/model.js";
import type { CompiledGlob } from "./glob.js";

export const ON_EMPTY_VALUES = ["warn", "error", "ignore"] as const;

/** Policy when a pair matches no file (spec 7.4). */
export type OnEmpty = (typeof ON_EMPTY_VALUES)[number];

/**
 * A run-level finding (`MTL9xx`): a config error, a missing root, template or
 * file, an empty target set. Config errors carry `file`, `line`, `column` and
 * `key` (spec 6.6); the others carry `pair` and/or `root` when known (spec 8.5).
 */
export interface RunDiagnostic {
  readonly code: RuleCode;
  readonly severity: Severity;
  readonly message: string;
  readonly pair?: string;
  readonly root?: string;
  /** Config file (display path), for config errors. */
  readonly file?: string;
  /** 1-based, for config errors. */
  readonly line?: number;
  readonly column?: number;
  /** Key path in the config, e.g. `pairs[0].include[1]`. */
  readonly key?: string;
}

/** A pair of the config (spec 6.3), defaults applied, paths resolved. */
export interface PairConfig {
  /** Explicit or generated name (spec 6.3). */
  readonly name: string;
  /** The `template` value as written. */
  readonly template: string;
  /** Resolved template path (spec 6.2; a relative value is relative to `templateRoot`). */
  readonly templatePath: string;
  readonly templateRoot: string;
  /** Root names this pair runs on, `project` and/or declared roots. */
  readonly roots: readonly string[];
  /** Include and exclude globs as written. */
  readonly include: readonly string[];
  readonly exclude: readonly string[];
  readonly includeGlobs: readonly CompiledGlob[];
  readonly excludeGlobs: readonly CompiledGlob[];
  readonly description: string | null;
  readonly onEmpty: OnEmpty;
}

/** A validated `md-template-lint.yml` (spec 6.3). */
export interface LintConfig {
  /** Resolved path of the config file. */
  readonly file: string;
  /** Printed path of the config file: relative to the working directory when inside it. */
  readonly display: string;
  /** Config directory: the implicit root `project`. */
  readonly dir: string;
  readonly version: 1;
  readonly onEmpty: OnEmpty;
  /** Declared roots (`roots`), name -> resolved directory, declaration order. `project` is not in it. */
  readonly roots: ReadonlyMap<string, string>;
  /** `aliases`, name -> resolved directory. */
  readonly aliases: ReadonlyMap<string, string>;
  /** `approvedPaths`, resolved. */
  readonly approvedPaths: readonly string[];
  /**
   * Opt-in for URL probes of `[io:exists]` (spec change request): when true, private
   * ranges (RFC 1918, fc00::/7, 100.64.0.0/10) are probed. Loopback, link-local
   * and cloud metadata addresses stay blocked. Default false.
   */
  readonly allowPrivateNetworks: boolean;
  readonly pairs: readonly PairConfig[];
}

/** Result of `loadConfig`: a config, or every error found (spec 6.6, sorted by position). */
export type ConfigResult =
  | { readonly ok: true; readonly config: LintConfig }
  | {
      readonly ok: false;
      /** Printed config path, null when no file was found. */
      readonly display: string | null;
      readonly errors: readonly RunDiagnostic[];
    };
