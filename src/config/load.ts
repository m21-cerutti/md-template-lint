/**
 * `md-template-lint.yml` loader and validator (docs/spec.md 6).
 *
 * Discovery (6.1): `--config <path>`, else the current directory then each parent
 * up to the file system root. The file is parsed with `yaml` and validated by
 * walking the YAML nodes (not a plain object), so every error is located:
 * file, line, column and key path. Errors are collected, not first-fail, and
 * sorted by position (6.6). Anchors and aliases are not supported (a type error),
 * so a config cannot expand.
 *
 * Codes: MTL901 (not found), MTL902 (not YAML / empty / not a mapping),
 * MTL903 (unknown key), MTL904 (wrong type, missing key, bad value),
 * MTL905 (bad, reserved or duplicate name), MTL906 (undeclared root),
 * MTL907 (bad glob), MTL908 (bad version).
 */
import { readFile, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { isAlias, isMap, isNode, isScalar, isSeq, LineCounter, parseDocument, type Pair, type YAMLMap } from "yaml";
import type { RuleCode } from "../engine/model.js";
import { compileGlob, type CompiledGlob } from "./glob.js";
import { displayPath, foldPath, resolvePath, toSlashes } from "./paths.js";
import { ON_EMPTY_VALUES, type ConfigResult, type LintConfig, type OnEmpty, type PairConfig, type RunDiagnostic } from "./types.js";

export const CONFIG_FILE_NAME = "md-template-lint.yml";

export interface LoadConfigOptions {
  /** Working directory (absolute). Discovery starts here; `configPath` is relative to it. */
  readonly cwd: string;
  /** `--config <path>`. */
  readonly configPath?: string;
  /** Home directory for `~` (default: the OS home). */
  readonly home?: string;
  /** Discovery stops after this directory (default: the file system root). */
  readonly boundary?: string;
}

const ROOT_OR_ALIAS_NAME = /^[A-Za-z0-9_-]+$/;
const PAIR_NAME = /^[A-Za-z0-9_.-]+$/;
const RESERVED_ROOT = "project";

const TOP_KEYS = ["version", "onEmpty", "roots", "aliases", "approvedPaths", "allowPrivateNetworks", "pairs"];
const PAIR_KEYS = ["name", "template", "templateRoot", "roots", "include", "exclude", "description", "onEmpty"];

async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function discover(start: string, boundary: string | undefined): Promise<string | null> {
  const stop = boundary === undefined ? null : foldPath(boundary);
  let dir = start;
  for (;;) {
    const candidate = foldPath(`${dir}/${CONFIG_FILE_NAME}`);
    if (await isFile(candidate)) return candidate;
    if (dir === stop) return null;
    const parent = foldPath(`${dir}/..`);
    if (parent === dir) return null;
    dir = parent;
  }
}

function failure(display: string | null, code: RuleCode, message: string, extra: Partial<RunDiagnostic> = {}): ConfigResult {
  return {
    ok: false,
    display,
    errors: [{ code, severity: "error", message, ...extra }],
  };
}

/** Short, path-free reason of a read failure. */
function readDetail(error: unknown): string {
  if (error instanceof TypeError) return "file is not valid UTF-8";
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? `cannot read file (${code})` : "cannot read file";
}

/** Type name of a YAML node for messages ("got number"). */
function describe(node: unknown): string {
  if (isScalar(node)) {
    const value: unknown = node.value;
    if (value === null || value === undefined) return "null";
    if (typeof value === "string") return value.trim() === "" ? "empty string" : "string";
    return typeof value;
  }
  if (isSeq(node)) return node.items.length === 0 ? "an empty list" : "list";
  if (isMap(node)) return "mapping";
  if (isAlias(node)) return "alias";
  return "nothing";
}

const stringOf = (node: unknown): string | null => (isScalar(node) && typeof node.value === "string" ? node.value : null);

interface Entry {
  readonly name: string;
  readonly key: unknown;
  readonly value: unknown;
}

const join = (path: string, name: string): string => (path === "" ? name : `${path}.${name}`);

/** Error collector: positions come from the YAML nodes (offset -> line and column). */
class Errors {
  readonly pending: { offset: number; diagnostic: RunDiagnostic }[] = [];
  private readonly display: string;
  private readonly lines: LineCounter;

  constructor(display: string, lines: LineCounter) {
    this.display = display;
    this.lines = lines;
  }

  add(code: RuleCode, node: unknown, key: string, message: string): void {
    const offset = isNode(node) && node.range ? node.range[0] : 0;
    const { line, col } = this.lines.linePos(offset);
    this.pending.push({
      offset,
      diagnostic: {
        code,
        severity: "error",
        message,
        file: this.display,
        line,
        column: col,
        key,
      },
    });
  }

  /** Sorted by position, i.e. in config order (spec 6.6). */
  sorted(): RunDiagnostic[] {
    return this.pending
      .map((item, index) => ({ ...item, index }))
      .sort((a, b) => a.offset - b.offset || a.index - b.index)
      .map((item) => item.diagnostic);
  }
}

/** The entries of a mapping; a key that is not a scalar is a type error. */
function entriesOf(errors: Errors, map: YAMLMap, path: string): Entry[] {
  const out: Entry[] = [];
  for (const pair of map.items as Pair<unknown, unknown>[]) {
    if (!isScalar(pair.key) || typeof pair.key.value !== "string") {
      const where = path === "" ? "(root)" : path;
      errors.add("MTL904", pair.key, where, `${where}: expected a string key, got ${describe(pair.key)}`);
      continue;
    }
    out.push({ name: String(pair.key.value), key: pair.key, value: pair.value });
  }
  return out;
}

function checkKnown(errors: Errors, entries: readonly Entry[], allowed: readonly string[], path: string) {
  for (const entry of entries) {
    if (allowed.includes(entry.name)) continue;
    const key = join(path, entry.name);
    errors.add("MTL903", entry.key, key, `${key}: unknown key '${entry.name}'`);
  }
}

const find = (entries: readonly Entry[], name: string): Entry | undefined => entries.find((entry) => entry.name === name);

/** A string value (non-empty unless `allowEmpty`), else MTL904. */
function readText(errors: Errors, entry: Entry, key: string, allowEmpty = false): string | null {
  const text = stringOf(entry.value);
  if (text !== null && (allowEmpty || text.trim() !== "")) return text;
  errors.add("MTL904", entry.key, key, `${key}: expected ${allowEmpty ? "string" : "non-empty string"}, got ${describe(entry.value)}`);
  return null;
}

function readEnum<T extends string>(errors: Errors, entry: Entry, key: string, values: readonly T[]): T | null {
  const text = stringOf(entry.value);
  const hit = values.find((value) => value === text);
  if (hit !== undefined) return hit;
  const actual = text === null ? describe(entry.value) : `'${text}'`;
  errors.add("MTL904", entry.key, key, `${key}: expected one of ${values.join(", ")}, got ${actual}`);
  return null;
}

/**
 * A name map (`roots`, `aliases`). `names` are the valid names, `values` those
 * whose value is also a non-empty string. A name with a bad value still counts
 * as declared (one error, not two).
 */
function readNameMap(errors: Errors, entry: Entry | undefined, path: string, reserved: string | null): { names: Set<string>; rejected: Set<string>; values: Map<string, string> } {
  const out = {
    names: new Set<string>(),
    rejected: new Set<string>(),
    values: new Map<string, string>(),
  };
  if (entry === undefined) return out;
  if (!isMap(entry.value)) {
    errors.add("MTL904", entry.key, path, `${path}: expected a mapping, got ${describe(entry.value)}`);
    return out;
  }
  for (const item of entriesOf(errors, entry.value, path)) {
    const key = join(path, item.name);
    if (!ROOT_OR_ALIAS_NAME.test(item.name)) {
      out.rejected.add(item.name);
      errors.add("MTL905", item.key, key, `${key}: invalid name '${item.name}'`);
    } else if (item.name === reserved) {
      out.rejected.add(item.name);
      errors.add("MTL905", item.key, key, `${key}: invalid name '${item.name}' (reserved)`);
    } else {
      out.names.add(item.name);
      const text = readText(errors, item, key);
      if (text !== null) out.values.set(item.name, text);
    }
  }
  return out;
}

/** One glob or a list of globs; each is compiled (MTL907). */
function readGlobs(errors: Errors, entry: Entry, key: string, allowEmptyList: boolean): { sources: string[]; compiled: CompiledGlob[] } {
  const sources: string[] = [];
  const compiled: CompiledGlob[] = [];
  const take = (node: unknown, itemKey: string, anchor: unknown): void => {
    const text = stringOf(node);
    if (text === null) {
      errors.add("MTL904", anchor, itemKey, `${itemKey}: expected string, got ${describe(node)}`);
      return;
    }
    const result = compileGlob(text);
    if (result.ok) {
      sources.push(text);
      compiled.push(result.glob);
    } else {
      errors.add("MTL907", anchor, itemKey, `${itemKey}: invalid glob '${text}': ${result.detail}`);
    }
  };
  if (isSeq(entry.value)) {
    if (entry.value.items.length === 0 && !allowEmptyList) {
      errors.add("MTL904", entry.key, key, `${key}: expected a non-empty list, got an empty list`);
    }
    entry.value.items.forEach((item, index) => take(item, `${key}[${index}]`, item));
  } else if (stringOf(entry.value) !== null) {
    take(entry.value, key, entry.key);
  } else {
    errors.add("MTL904", entry.key, key, `${key}: expected string or list of strings, got ${describe(entry.value)}`);
  }
  return { sources, compiled };
}

interface Context {
  readonly errors: Errors;
  readonly declared: ReadonlySet<string>;
  /** Root names that were declared but rejected (MTL905): one error per cause, no MTL906 cascade. */
  readonly rejected: ReadonlySet<string>;
  readonly rootDirs: ReadonlyMap<string, string>;
  readonly dir: string;
  readonly home: string;
  readonly onEmpty: OnEmpty;
}

/** True for `project`, a declared root, or a declared root already reported as invalid. */
const isKnownRoot = (context: Context, name: string): boolean => name === RESERVED_ROOT || context.declared.has(name) || context.rejected.has(name);

/** `pairs[].roots`: a name, a list of names or `"*"` (spec 6.3). */
function readPairRoots(context: Context, entry: Entry, key: string): string[] | null {
  const { errors, declared } = context;
  const check = (name: string, anchor: unknown, itemKey: string): boolean => {
    if (isKnownRoot(context, name)) return true;
    errors.add("MTL906", anchor, itemKey, `${itemKey}: root '${name}' is not declared`);
    return false;
  };
  const value = entry.value;
  const text = stringOf(value);
  if (text === "*") {
    if (declared.size === 0) {
      if (context.rejected.size > 0) return null;
      errors.add("MTL904", entry.key, key, `${key}: expected at least one declared root for "*", got none`);
      return null;
    }
    return [...declared];
  }
  if (text !== null) return check(text, entry.key, key) ? [text] : null;
  if (isSeq(value)) {
    if (value.items.length === 0) {
      errors.add("MTL904", entry.key, key, `${key}: expected at least one root name, got an empty list`);
      return null;
    }
    const names: string[] = [];
    let valid = true;
    value.items.forEach((item, index) => {
      const itemKey = `${key}[${index}]`;
      const name = stringOf(item);
      if (name === null) {
        errors.add("MTL904", item, itemKey, `${itemKey}: expected root name, got ${describe(item)}`);
        valid = false;
      } else if (!check(name, item, itemKey)) valid = false;
      else if (!names.includes(name)) names.push(name);
    });
    return valid ? names : null;
  }
  errors.add("MTL904", entry.key, key, `${key}: expected root name, list of root names or "*", got ${describe(value)}`);
  return null;
}

interface PairDraft {
  readonly name: string | null;
  readonly template: string;
  readonly templatePath: string;
  readonly templateRoot: string;
  readonly roots: readonly string[];
  readonly include: readonly string[];
  readonly exclude: readonly string[];
  readonly includeGlobs: readonly CompiledGlob[];
  readonly excludeGlobs: readonly CompiledGlob[];
  readonly description: string | null;
  readonly onEmpty: OnEmpty;
}

function readPair(context: Context, node: unknown, index: number, explicitNames: Map<string, number>): PairDraft | null {
  const { errors } = context;
  const path = `pairs[${index}]`;
  if (!isMap(node)) {
    errors.add("MTL904", node, path, `${path}: expected a mapping, got ${describe(node)}`);
    return null;
  }
  const entries = entriesOf(errors, node, path);
  checkKnown(errors, entries, PAIR_KEYS, path);
  const before = errors.pending.length;

  let name: string | null = null;
  const nameEntry = find(entries, "name");
  if (nameEntry !== undefined) {
    const key = `${path}.name`;
    const text = readText(errors, nameEntry, key, true);
    if (text === null) {
      // Not a string: MTL904 was reported by readText (spec 6.6), not a name error.
    } else if (!PAIR_NAME.test(text)) {
      errors.add("MTL905", nameEntry.key, key, `${key}: invalid name '${text}'`);
    } else if (explicitNames.has(text)) {
      errors.add("MTL905", nameEntry.key, key, `${key}: invalid name '${text}' (duplicate)`);
    } else {
      explicitNames.set(text, index);
      name = text;
    }
  }

  const templateEntry = find(entries, "template");
  let template = "";
  if (templateEntry === undefined) {
    errors.add("MTL904", node, `${path}.template`, `${path}.template: required key is missing`);
  } else template = readText(errors, templateEntry, `${path}.template`) ?? "";

  let templateRoot = RESERVED_ROOT;
  const templateRootEntry = find(entries, "templateRoot");
  if (templateRootEntry !== undefined) {
    const key = `${path}.templateRoot`;
    const text = readText(errors, templateRootEntry, key);
    if (text !== null) {
      if (isKnownRoot(context, text)) templateRoot = text;
      else errors.add("MTL906", templateRootEntry.key, key, `${key}: root '${text}' is not declared`);
    }
  }

  let roots: string[] = [RESERVED_ROOT];
  const rootsEntry = find(entries, "roots");
  if (rootsEntry !== undefined) roots = readPairRoots(context, rootsEntry, `${path}.roots`) ?? roots;

  let include: ReturnType<typeof readGlobs> = { sources: [], compiled: [] };
  const includeEntry = find(entries, "include");
  if (includeEntry === undefined) {
    errors.add("MTL904", node, `${path}.include`, `${path}.include: required key is missing`);
  } else include = readGlobs(errors, includeEntry, `${path}.include`, false);

  let exclude: ReturnType<typeof readGlobs> = { sources: [], compiled: [] };
  const excludeEntry = find(entries, "exclude");
  if (excludeEntry !== undefined) exclude = readGlobs(errors, excludeEntry, `${path}.exclude`, true);

  let description: string | null = null;
  const descriptionEntry = find(entries, "description");
  if (descriptionEntry !== undefined) {
    description = readText(errors, descriptionEntry, `${path}.description`, true);
  }

  let onEmpty = context.onEmpty;
  const onEmptyEntry = find(entries, "onEmpty");
  if (onEmptyEntry !== undefined) {
    onEmpty = readEnum(errors, onEmptyEntry, `${path}.onEmpty`, ON_EMPTY_VALUES) ?? onEmpty;
  }

  if (errors.pending.length > before) return null;
  const rootDir = templateRoot === RESERVED_ROOT ? context.dir : context.rootDirs.get(templateRoot);
  return {
    name,
    template,
    templatePath: resolvePath(template, rootDir ?? context.dir, context.home),
    templateRoot,
    roots,
    include: include.sources,
    exclude: exclude.sources,
    includeGlobs: include.compiled,
    excludeGlobs: exclude.compiled,
    description,
    onEmpty,
  };
}

/** Spec 6.3: file name of the template without its last extension, safe characters only. */
function generatedName(template: string): string {
  const fileName = toSlashes(template).split("/").at(-1) ?? "";
  const stem = fileName.replace(/\.[^.]*$/, "");
  const safe = [...stem].map((char) => (/[A-Za-z0-9_.-]/.test(char) ? char : "-")).join("");
  return safe === "" ? "pair" : safe;
}

/** Name pairs: explicit names first, then generated ones in config order (spec 6.3). */
function namePairs(drafts: readonly PairDraft[]): PairConfig[] {
  const taken = new Set(drafts.flatMap((draft) => (draft.name === null ? [] : [draft.name])));
  return drafts.map((draft) => {
    if (draft.name !== null) return { ...draft, name: draft.name };
    const base = generatedName(draft.template);
    let name = base;
    for (let n = 2; taken.has(name); n += 1) name = `${base}-${n}`;
    taken.add(name);
    return { ...draft, name };
  });
}

function validate(errors: Errors, root: YAMLMap, file: string, display: string, home: string): LintConfig | null {
  const dir = foldPath(`${file}/..`);
  const entries = entriesOf(errors, root, "");
  checkKnown(errors, entries, TOP_KEYS, "");

  const versionEntry = find(entries, "version");
  if (versionEntry !== undefined) {
    const value: unknown = isScalar(versionEntry.value) ? versionEntry.value.value : undefined;
    if (typeof value !== "number" || !Number.isInteger(value)) {
      errors.add("MTL904", versionEntry.key, "version", `version: expected integer, got ${describe(versionEntry.value)}`);
    } else if (value !== 1) {
      errors.add("MTL908", versionEntry.key, "version", `unsupported config version ${value}`);
    }
  }

  let onEmpty: OnEmpty = "warn";
  const onEmptyEntry = find(entries, "onEmpty");
  if (onEmptyEntry !== undefined) {
    onEmpty = readEnum(errors, onEmptyEntry, "onEmpty", ON_EMPTY_VALUES) ?? onEmpty;
  }

  const rawRoots = readNameMap(errors, find(entries, "roots"), "roots", RESERVED_ROOT);
  const declared = rawRoots.names;
  const rootDirs = new Map<string, string>();
  for (const [name, value] of rawRoots.values) rootDirs.set(name, resolvePath(value, dir, home));

  const aliases = new Map<string, string>();
  const rawAliases = readNameMap(errors, find(entries, "aliases"), "aliases", null);
  for (const [name, value] of rawAliases.values) aliases.set(name, resolvePath(value, dir, home));

  const approvedPaths: string[] = [];
  const approvedEntry = find(entries, "approvedPaths");
  if (approvedEntry !== undefined) {
    if (!isSeq(approvedEntry.value)) {
      errors.add("MTL904", approvedEntry.key, "approvedPaths", `approvedPaths: expected list of strings, got ${describe(approvedEntry.value)}`);
    } else {
      approvedEntry.value.items.forEach((item, index) => {
        const key = `approvedPaths[${index}]`;
        const text = stringOf(item);
        if (text === null || text.trim() === "") {
          errors.add("MTL904", item, key, `${key}: expected non-empty string, got ${describe(item)}`);
        } else approvedPaths.push(resolvePath(text, dir, home));
      });
    }
  }

  let allowPrivateNetworks = false;
  const allowEntry = find(entries, "allowPrivateNetworks");
  if (allowEntry !== undefined) {
    const value: unknown = isScalar(allowEntry.value) ? allowEntry.value.value : undefined;
    if (typeof value === "boolean") allowPrivateNetworks = value;
    else {
      errors.add("MTL904", allowEntry.key, "allowPrivateNetworks", `allowPrivateNetworks: expected boolean, got ${describe(allowEntry.value)}`);
    }
  }

  const context: Context = {
    errors,
    declared,
    rejected: rawRoots.rejected,
    rootDirs,
    dir,
    home,
    onEmpty,
  };
  const drafts: PairDraft[] = [];
  const pairsEntry = find(entries, "pairs");
  if (pairsEntry === undefined) {
    errors.add("MTL904", root, "pairs", "pairs: required key is missing");
  } else if (!isSeq(pairsEntry.value) || pairsEntry.value.items.length === 0) {
    errors.add("MTL904", pairsEntry.key, "pairs", `pairs: expected a non-empty list, got ${describe(pairsEntry.value)}`);
  } else {
    const explicitNames = new Map<string, number>();
    pairsEntry.value.items.forEach((item, index) => {
      const draft = readPair(context, item, index, explicitNames);
      if (draft !== null) drafts.push(draft);
    });
  }

  if (errors.pending.length > 0) return null;
  return {
    file,
    display,
    dir,
    version: 1,
    onEmpty,
    roots: rootDirs,
    aliases,
    approvedPaths,
    allowPrivateNetworks,
    pairs: namePairs(drafts),
  };
}

/**
 * Find, read, parse and validate the config (spec 6). Never throws for a bad
 * config: every problem is a located `RunDiagnostic` (spec 6.6).
 */
export async function loadConfig(options: LoadConfigOptions): Promise<ConfigResult> {
  const home = options.home ?? homedir();
  const cwd = foldPath(options.cwd);
  let file: string;
  if (options.configPath !== undefined) {
    file = resolvePath(options.configPath, cwd, home);
    if (!(await isFile(file))) {
      const shown = displayPath(file, cwd);
      return failure(shown, "MTL901", `config file not found: ${shown}`);
    }
  } else {
    const found = await discover(cwd, options.boundary);
    if (found === null) {
      return failure(null, "MTL901", `no ${CONFIG_FILE_NAME} found from ${cwd} upward`);
    }
    file = found;
  }
  const display = displayPath(file, cwd);

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(await readFile(file));
  } catch (error) {
    return failure(display, "MTL902", `cannot parse ${display}: ${readDetail(error)}`, {
      file: display,
    });
  }

  const lines = new LineCounter();
  const document = parseDocument(text, { lineCounter: lines });
  const errors = new Errors(display, lines);
  const syntax = document.errors[0];
  if (syntax !== undefined) {
    const { line, col } = lines.linePos(syntax.pos[0]);
    const detail = syntax.message.split("\n")[0] ?? "invalid YAML";
    return failure(display, "MTL902", `cannot parse ${display}: ${detail}`, {
      file: display,
      line,
      column: col,
    });
  }
  const contents = document.contents;
  if (contents === null) {
    return failure(display, "MTL902", `cannot parse ${display}: file is empty`, { file: display });
  }
  if (!isMap(contents)) {
    return failure(display, "MTL902", `cannot parse ${display}: expected a mapping at the top level, got ${describe(contents)}`, { file: display, line: 1, column: 1 });
  }
  const config = validate(errors, contents, file, display, home);
  if (config === null) return { ok: false, display, errors: errors.sorted() };
  return { ok: true, config };
}
