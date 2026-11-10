/**
 * The schema of a parsed template for `--verify` (docs/spec.md 8.3, 8.5): filename
 * convention, one entry per field (inferred type and rule tokens) and one per heading
 * of every level (H1 to H6, change C10). Plain data read from the `DocumentModel` the
 * engine already built; there is no parsing here.
 *
 * Rule tokens spell the tag without brackets (`presence:required`, `value:filename`,
 * `count:min:1`, `range:max:5`, `format:snake_case`, `format:elements:kebab-case`,
 * `format:semver`, `format:date`, `format:elements:semver`, `format:elements:date`,
 * `format:constant:x`, `format:scheme:http,https`, `order:ascending`, `io:exists`) plus
 * `enum:a|b` for an enum field; a heading adds `pattern:"<pattern>"`,
 * `repeat-rules:same-level`, `repeat-rules:same-level:min:N` and
 * `repeat-rules:same-level:max:N` right after its presence, then its order tag
 * (`order:descending`, `order:first:date:ascending`, ...) (spec 8.3, 2.10), and
 * `unique-headings-names` last (spec 2.11). Rules of one kind that can appear once use the
 * first tag
 * (spec 2.1). Presence is ALWAYS the first rule, as the effective mode (spec 2.2 and 2.6
 * precedence; `required` when no presence tag is written), and a conditional one carries
 * its text: `presence:conditional:<detail>` (the legacy `describe()`).
 */
import { presenceMode, type DocumentModel, type Field, type Section } from "../engine/model.js";
import { orderToken } from "../engine/pattern.js";
import { enumOptions } from "../rules/type.js";
import type { BodyTag, FrontmatterFieldTag } from "../tags/ast.js";
import type { SchemaField, SchemaHeading, TemplateSchema } from "./types.js";

/** `presence:<mode>`; for `conditional`, the text of its first tag when it has one. */
function presenceToken(mode: string, tags: readonly (FrontmatterFieldTag | BodyTag)[]): string {
  if (mode !== "conditional") return `presence:${mode}`;
  for (const tag of tags) {
    if (tag.kind === "presence" && tag.mode === "conditional" && tag.detail !== "") {
      return `presence:conditional:${tag.detail}`;
    }
  }
  return "presence:conditional";
}

function fieldRules(field: Field): string[] {
  const tags: readonly FrontmatterFieldTag[] = field.comment?.tags ?? [];
  const rules: string[] = [presenceToken(presenceMode(field), tags)];

  const constant = tags.flatMap((tag) => (tag.kind === "format-constant" ? [tag] : []))[0];
  if (constant !== undefined) rules.push(`format:constant:${constant.value}`);
  const style = tags.flatMap((tag) => (tag.kind === "format-case" ? [tag] : []))[0];
  if (style !== undefined) rules.push(`format:${style.style}`);
  const elements = tags.flatMap((tag) => (tag.kind === "format-elements" ? [tag] : []))[0];
  if (elements !== undefined) rules.push(`format:elements:${elements.style}`);
  // Spec 8.3 order: shape after elements case; the first scalar shape tag (change C11).
  const shape = tags.flatMap((tag) => (tag.kind === "format-shape" ? [tag] : []))[0];
  if (shape !== undefined) rules.push(`format:${shape.shape}`);
  // Then the first elements shape tag (MTL308 `semver`, MTL309 `date`).
  const elementsShape = tags.flatMap((tag) =>
    tag.kind === "format-elements-shape" ? [tag] : [],
  )[0];
  if (elementsShape !== undefined) rules.push(`format:elements:${elementsShape.shape}`);
  if (tags.some((tag) => tag.kind === "value-filename")) rules.push("value:filename");

  const counts = tags.flatMap((tag) => (tag.kind === "count" ? [tag] : []));
  for (const bound of ["min", "max"] as const) {
    const count = counts.find((tag) => tag.bound === bound);
    if (count !== undefined) rules.push(`count:${bound}:${count.value}`);
  }
  const ranges = tags.flatMap((tag) => (tag.kind === "range" ? [tag] : []));
  for (const bound of ["min", "max"] as const) {
    const range = ranges.find((tag) => tag.bound === bound);
    if (range !== undefined) rules.push(`range:${bound}:${range.text}`);
  }

  if (tags.some((tag) => tag.kind === "order-ascending")) rules.push("order:ascending");
  const scheme = tags.flatMap((tag) => (tag.kind === "format-scheme" ? [tag] : []))[0];
  if (scheme !== undefined && scheme.schemes.length > 0) {
    rules.push(`format:scheme:${[...new Set(scheme.schemes)].sort().join(",")}`);
  }
  if (tags.some((tag) => tag.kind === "io-exists")) rules.push("io:exists");

  const options = field.type === "enum" ? enumOptions(field.value) : [];
  if (options.length > 0) rules.push(`enum:${options.join("|")}`);
  return rules;
}

/** Heading presence precedence (spec 2.6): conditional, template-only, optional, required. */
function headingRules(section: Section): string[] {
  const modes = section.tags.flatMap((tag) => (tag.kind === "presence" ? [tag.mode] : []));
  const mode =
    (["conditional", "template-only", "optional"] as const).find((candidate) =>
      modes.includes(candidate),
    ) ?? "required";
  const rules: string[] = [presenceToken(mode, section.tags)];
  // Spec 8.3 (change C12): the pattern and repeat tags right after presence, the first tag
  // of each kind, as written (an invalid pattern, MTL014, prints too), then the first order
  // tag in its canonical lowercase form (phase P7; also when MTL015 ignores it).
  const pattern = section.tags.find((tag) => tag.kind === "pattern");
  if (pattern?.kind === "pattern") rules.push(`pattern:"${pattern.text}"`);
  const repeats = section.tags.flatMap((tag) => (tag.kind === "repeat" ? [tag] : []));
  for (const bound of ["none", "min", "max"] as const) {
    const repeat = repeats.find((tag) => tag.bound === bound);
    if (repeat === undefined) continue;
    rules.push(
      bound === "none"
        ? "repeat-rules:same-level"
        : `repeat-rules:same-level:${bound}:${repeat.n ?? ""}`,
    );
  }
  const order = section.tags.find((tag) => tag.kind === "order");
  if (order?.kind === "order") rules.push(orderToken(order));
  const checks = section.tags.flatMap((tag) => (tag.kind === "content" ? [tag.check] : []));
  for (const check of ["non-empty", "table", "list"] as const) {
    if (checks.includes(check)) rules.push(`content:${check}`);
  }
  const lines = section.tags.flatMap((tag) => (tag.kind === "content-lines" ? [tag] : []));
  for (const bound of ["min", "max"] as const) {
    const found = lines.find((tag) => tag.bound === bound);
    if (found !== undefined) rules.push(`content:${bound}-lines:${found.value}`);
  }
  // Spec 8.3: the sub-heading opt-outs print after the other content rules, disallow first.
  if (checks.includes("subheadings-disallow")) rules.push("content:subheadings:disallow");
  if (checks.includes("subheadings-no-extra")) rules.push("content:subheadings:no-extra");
  // Spec 2.11, 8.3: the per-heading unique-names switch prints last, once.
  if (section.tags.some((tag) => tag.kind === "unique-names")) rules.push("unique-headings-names");
  return rules;
}

/** Schema of a parsed template. */
export function describeTemplate(model: DocumentModel): TemplateSchema {
  const fields: SchemaField[] = [...model.fields.values()].map((field) => ({
    name: field.key,
    type: field.type,
    rules: fieldRules(field),
  }));
  const headings: SchemaHeading[] = model.sections.map((section) => ({
    level: section.level,
    text: section.text,
    rules: headingRules(section),
  }));
  return {
    filenameCase: model.filename?.convention ?? null,
    uniqueHeadingNames: model.uniqueHeadingNames,
    fields,
    headings,
  };
}
