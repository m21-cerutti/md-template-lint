/**
 * Category `io` (docs/spec.md 2.8, 4.3, codes MTL800-MTL899): `[io:exists]`
 * warnings. The only rules that touch the file system or the network, and
 * only through `env.io` (src/engine/rule.ts), so tests inject an in-memory io.
 * EVERY finding is a warning. Codes: MTL801 to MTL805.
 *
 * Order (legacy `_check_io_exists`): one finding per item, in item order across
 * the five codes. Each rule tags its findings with the item index (`reportItem`)
 * and the pipeline stable-sorts the `io` step of a field by it.
 */
import {
  defineRule,
  reportItem,
  URL_PROBE_TIMEOUT_MS,
  type AnyRule,
  type FieldContext,
} from "../engine/rule.js";
import type { Diagnostic } from "../engine/model.js";
import { ALIAS_LIKE } from "../engine/values.js";

/** Longest reason text of MTL805 (spec 2.8). */
const REASON_MAX_LENGTH = 60;

/** Absolute value: a drive letter, or a leading `/` or `\` (spec 2.8 step 2). */
const ABSOLUTE = /^(?:[A-Za-z]:|[\\/])/;

/** A path split into its root prefix (`""`, `/`, `//` for UNC, `C:/`) and its segments. */
interface Parts {
  readonly prefix: string;
  readonly segments: readonly string[];
}

/**
 * Split a path read with `\` as `/` (spec 6.2 rule 4). Empty and `.` segments
 * are dropped, as `pathlib` does; `..` is kept (see `fold`). A leading `//` is a
 * UNC prefix and is kept, so `\\server\share\a.md` stays `//server/share/a.md`.
 */
function split(path: string): Parts {
  const text = path.replaceAll("\\", "/");
  const drive = /^[A-Za-z]:\/?/.exec(text);
  let prefix = "";
  if (drive !== null) prefix = drive[0];
  else if (text.startsWith("//") && !text.startsWith("///")) prefix = "//";
  else if (text.startsWith("/")) prefix = "/";
  const segments = text
    .slice(prefix.length)
    .split("/")
    .filter((segment) => segment !== "" && segment !== ".");
  return { prefix, segments };
}

/** Printed and probed form: the joined path, `..` NOT folded (legacy `root / remainder`). */
function unfolded(parts: Parts): string {
  const body = parts.segments.join("/");
  return body === "" && parts.prefix === "" ? "." : `${parts.prefix}${body}`;
}

/** `rest` appended to `base`, both read through `split`. */
const joined = (base: string, rest: string): Parts => {
  const root = split(base);
  return { prefix: root.prefix, segments: [...root.segments, ...split(rest).segments] };
};

/** `..` folded, for the containment test only. A `..` above a root is dropped. */
function fold(parts: Parts): Parts {
  const segments: string[] = [];
  for (const segment of parts.segments) {
    if (segment !== "..") segments.push(segment);
    else if (segments.length > 0 && segments.at(-1) !== "..") segments.pop();
    else if (parts.prefix === "") segments.push(segment);
  }
  return { prefix: parts.prefix, segments };
}

/**
 * True when `path` is `directory` or lies below it. Both are folded first, so
 * `/srv/notes/../x` is outside `/srv/notes`. Only the root prefix (drive letter)
 * ignores case; segments are compared case-sensitively, which fails closed (a
 * differently-cased folder counts as outside and is skipped, MTL803).
 */
function isInside(path: string, directory: string): boolean {
  const below = fold(split(path));
  const base = fold(split(directory));
  if (below.prefix.toLowerCase() !== base.prefix.toLowerCase()) return false;
  return base.segments.every((segment, index) => below.segments[index] === segment);
}

/**
 * A resolved location: `resolved` is the printed text (unfolded, legacy
 * parity); `probe` is the path handed to `env.io.exists`, FOLDED, so the file
 * system is asked about the same path the containment test judged.
 */
interface Location {
  readonly resolved: string;
  readonly probe: string;
}

const located = (parts: Parts): Location => ({
  resolved: unfolded(parts),
  probe: unfolded(fold(parts)),
});

/** What `[io:exists]` has to do with one non-blank item (spec 2.8). */
type Action =
  | { readonly kind: "alias-unapproved"; readonly name: string }
  | {
      readonly kind: "alias-path";
      readonly name: string;
      readonly rest: string;
      readonly where: Location;
    }
  | { readonly kind: "absolute-skipped"; readonly value: string }
  | { readonly kind: "path"; readonly value: string; readonly where: Location }
  | { readonly kind: "url"; readonly value: string };

/** An action and the position of its item in the list (0 for a scalar). */
type Plan = Action & { readonly index: number };

/** Action for one trimmed path value (spec 2.8 steps 1 to 3). */
function planPath(context: FieldContext, value: string): Action {
  const { env } = context;
  const alias = ALIAS_LIKE.exec(value);
  if (alias !== null) {
    const [, name = "", rest = ""] = alias;
    const root = env.aliases.get(name);
    if (root === undefined) return { kind: "alias-unapproved", name };
    return { kind: "alias-path", name, rest, where: located(joined(root, rest)) };
  }
  if (ABSOLUTE.test(value)) {
    const approved = env.approvedPaths.some((directory) => isInside(value, directory));
    return approved
      ? { kind: "path", value, where: located(split(value)) }
      : { kind: "absolute-skipped", value };
  }
  return { kind: "path", value, where: located(joined(env.pairRoot, value)) };
}

/**
 * The plans of a field, in item order. Empty unless the template field carries
 * `[io:exists]` and has type `path`, `list-of-path`, `url` or `list-of-url`
 * (a no-op on every other type, so `path-alias` fields are not handled here).
 * A list type with a non-list value is skipped. Blank and non-string items are
 * skipped; the others are trimmed (legacy `_check_io_exists`). `index` is the
 * position in the list (0 for a scalar).
 */
function plans(context: FieldContext): Plan[] {
  const tagged = (context.templateField.comment?.tags ?? []).some(
    (tag) => tag.kind === "io-exists",
  );
  const { value } = context;
  if (!tagged || value === null) return [];
  const type = context.templateField.type;
  let items: readonly unknown[];
  if (type === "path" || type === "url") items = [value];
  else if ((type === "list-of-path" || type === "list-of-url") && Array.isArray(value)) {
    items = value;
  } else return [];
  const out: Plan[] = [];
  items.forEach((item, index) => {
    if (typeof item !== "string" || item.trim() === "") return;
    const trimmed = item.trim();
    const action: Action = type.endsWith("path")
      ? planPath(context, trimmed)
      : { kind: "url", value: trimmed };
    out.push({ ...action, index });
  });
  return out;
}

/**
 * `[io:exists]` on an alias-shaped path value whose name has no entry in the
 * config `aliases` (spec 2.8 step 1). Not checked; aliases are never guessed.
 */
const aliasUnapproved = defineRule({
  code: "MTL801",
  name: "alias-unapproved",
  severity: "warning",
  category: "io",
  phase: "field",
  step: "io",
  check: (context: FieldContext): Diagnostic[] =>
    plans(context).flatMap((plan) =>
      plan.kind === "alias-unapproved"
        ? [
            reportItem(
              aliasUnapproved,
              `Field '${context.key}': alias '@${plan.name}/...' has no entry in config aliases, not checked`,
              plan.index,
            ),
          ]
        : [],
    ),
});

/**
 * `[io:exists]` on an alias-shaped path value of an approved alias: the joined
 * path does not exist (spec 2.8 step 1).
 */
const aliasPathMissing = defineRule({
  code: "MTL802",
  name: "alias-path-missing",
  severity: "warning",
  category: "io",
  phase: "field",
  step: "io",
  check: async (context: FieldContext): Promise<Diagnostic[]> => {
    const out: Diagnostic[] = [];
    for (const plan of plans(context)) {
      if (plan.kind !== "alias-path" || (await context.env.io.exists(plan.where.probe))) continue;
      out.push(
        reportItem(
          aliasPathMissing,
          `Field '${context.key}': aliased path '@${plan.name}/${plan.rest}' resolved to ${plan.where.resolved} — does not exist`,
          plan.index,
        ),
      );
    }
    return out;
  },
});

/**
 * `[io:exists]` on an absolute path value outside every config `approvedPaths`
 * folder (spec 2.8 step 2). Never probed.
 */
const absoluteSkipped = defineRule({
  code: "MTL803",
  name: "absolute-skipped",
  severity: "warning",
  category: "io",
  phase: "field",
  step: "io",
  check: (context: FieldContext): Diagnostic[] =>
    plans(context).flatMap((plan) =>
      plan.kind === "absolute-skipped"
        ? [
            reportItem(
              absoluteSkipped,
              `Field '${context.key}': absolute path '${plan.value}' skipped by [io:exists] (not checked); add it under approvedPaths in the config`,
              plan.index,
            ),
          ]
        : [],
    ),
});

/**
 * `[io:exists]` on a relative path value (resolved against the pair root) or an
 * absolute one inside an approved folder: it does not exist (spec 2.8 steps 2, 3).
 */
const pathMissing = defineRule({
  code: "MTL804",
  name: "path-missing",
  severity: "warning",
  category: "io",
  phase: "field",
  step: "io",
  check: async (context: FieldContext): Promise<Diagnostic[]> => {
    const out: Diagnostic[] = [];
    for (const plan of plans(context)) {
      if (plan.kind !== "path" || (await context.env.io.exists(plan.where.probe))) continue;
      out.push(
        reportItem(
          pathMissing,
          `Field '${context.key}': path '${plan.value}' does not exist (resolved: ${plan.where.resolved})`,
          plan.index,
        ),
      );
    }
    return out;
  },
});

/** At most `REASON_MAX_LENGTH` characters, cut with `...` (legacy `probe_url_reachable`). */
const shortReason = (reason: string): string =>
  reason.length > REASON_MAX_LENGTH ? `${reason.slice(0, REASON_MAX_LENGTH - 3)}...` : reason;

/**
 * `[io:exists]` on a URL value: the probe (HEAD, then GET, 5 second timeout,
 * done by `env.io.probeUrl`) says it is not reachable (spec 2.8 step 4).
 */
const urlUnreachable = defineRule({
  code: "MTL805",
  name: "url-unreachable",
  severity: "warning",
  category: "io",
  phase: "field",
  step: "io",
  check: async (context: FieldContext): Promise<Diagnostic[]> => {
    const out: Diagnostic[] = [];
    for (const plan of plans(context)) {
      if (plan.kind !== "url") continue;
      const probe = await context.env.io.probeUrl(plan.value, URL_PROBE_TIMEOUT_MS);
      if (probe.reachable) continue;
      out.push(
        reportItem(
          urlUnreachable,
          `Field '${context.key}': URL '${plan.value}' not reachable (${shortReason(probe.reason)})`,
          plan.index,
        ),
      );
    }
    return out;
  },
});

export const rules: readonly AnyRule[] = [
  aliasUnapproved,
  aliasPathMissing,
  absoluteSkipped,
  pathMissing,
  urlUnreachable,
  // new:rule inserts above this line
];
