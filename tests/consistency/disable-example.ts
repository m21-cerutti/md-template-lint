/**
 * Helpers of `disable-example.test.ts` (run by `pnpm run check:rules`): read the "Complete
 * example" of the "Disable directives" section of docs/syntax-reference.md, a runnable project
 * of three `File:`-labelled yaml blocks plus the list of diagnostics that must remain. Every
 * function throws a plain `Error` when the doc no longer has the expected shape, so a doc edit
 * cannot make the test pass on nothing.
 */
import type { DirectiveVerb } from "../../src/tags/ast.js";

/** One `File: \`path\`` label and the fenced block that follows it. */
export interface ExampleFile {
  readonly path: string;
  readonly content: string;
}

/** One line of the doc list "The expected remaining diagnostics, in this order, are:". */
export interface Remaining {
  readonly code: string;
  readonly severity: string;
  readonly message: string;
  readonly line: number;
}

export interface DisableExample {
  readonly files: readonly ExampleFile[];
  /** `docs/note.md`: the target, the only file that carries directives (DIR4). */
  readonly target: ExampleFile;
  readonly remaining: readonly Remaining[];
  /** The count after `Suppressed:` in the doc. */
  readonly suppressed: number;
}

/**
 * The six verbs of a disable directive (docs/spec.md 4.4). Hand-kept copy of the `DirectiveVerb`
 * union of src/tags/ast.ts (the verb tokens of grammar/MdTemplateLexer.g4, mapped in
 * src/tags/visitors/directive.ts). The test keys a `Record<DirectiveVerb, ...>` on it, so
 * a verb added to the union breaks the type check of the test until it is probed here.
 */
export const DIRECTIVE_VERBS = ["disable", "disable-line", "disable-next-line", "disable-file", "begin disable", "end disable"] as const satisfies readonly DirectiveVerb[];

const KEYWORD = "md-template-lint";

/** The lines after `heading`, up to the next heading of level 2 (a `## ` line inside a fenced block is not a heading). */
function linesAfter(lines: readonly string[], heading: string, stopLevel2: boolean): string[] | undefined {
  const start = lines.indexOf(heading);
  if (start < 0) return undefined;
  const body: string[] = [];
  let fenced = false;
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("```")) fenced = !fenced;
    if (!fenced && stopLevel2 && line.startsWith("## ")) break;
    body.push(line);
  }
  return body;
}

/** The text of `### Complete example`, inside `## Disable directives`. */
function exampleSection(doc: string): string {
  const lines = doc.replaceAll("\r\n", "\n").split("\n");
  const parent = linesAfter(lines, "## Disable directives (target files only)", true);
  if (parent === undefined) throw new Error("docs/syntax-reference.md: section '## Disable directives (target files only)' not found");
  const child = linesAfter(parent, "### Complete example", false);
  if (child === undefined) throw new Error("docs/syntax-reference.md: section '### Complete example' not found under 'Disable directives'");
  return `${child.join("\n")}\n`;
}

/** Extract the example from the text of docs/syntax-reference.md. */
export function extractExample(doc: string): DisableExample {
  const example = exampleSection(doc);

  const files = [...example.matchAll(/^File: `([^`]+)`\n\n```yaml\n([\s\S]*?)\n```$/gm)].map((match): ExampleFile => ({ path: match[1] ?? "", content: `${match[2] ?? ""}\n` }));
  const paths = files.map((file) => file.path);
  if (paths.length !== 3 || paths[0] !== "md-template-lint.yml" || !paths[1]?.startsWith("templates/") || !paths[2]?.startsWith("docs/")) {
    throw new Error(`docs/syntax-reference.md: the complete example must hold the config, a template and a target in this order, found: ${JSON.stringify(paths)}`);
  }
  const target = files[2];
  if (target === undefined) throw new Error("unreachable: target checked above");

  const marked = example.split("The expected remaining diagnostics, in this order, are:\n")[1];
  if (marked === undefined) throw new Error("docs/syntax-reference.md: the list of expected remaining diagnostics was not found");
  const remaining: Remaining[] = [];
  for (const line of marked.split("\n")) {
    if (!line.startsWith("- ")) {
      if (remaining.length > 0) break;
      continue;
    }
    const match = /^- `(MTL\d{3})` \((error|warning)\): `(.+)` \(line (\d+)\)\.$/.exec(line);
    if (match === null) throw new Error(`docs/syntax-reference.md: cannot parse the remaining diagnostic: ${line}`);
    remaining.push({ code: match[1] ?? "", severity: match[2] ?? "", message: match[3] ?? "", line: Number(match[4]) });
  }
  if (remaining.length === 0) throw new Error("docs/syntax-reference.md: no remaining diagnostic listed");

  const count = /`Suppressed:\s+(\d+)`/.exec(example)?.[1];
  if (count === undefined) throw new Error("docs/syntax-reference.md: the 'Suppressed:' count was not found");
  return { files, target, remaining, suppressed: Number(count) };
}

/** Occurrences of the directives of `verb` in `text` (the verb must be followed by a blank). */
export function directivesOf(text: string, verb: DirectiveVerb): number {
  return text.match(directivePattern(verb, "gi"))?.length ?? 0;
}

function directivePattern(verb: DirectiveVerb, flags: string): RegExp {
  return new RegExp(`${KEYWORD}[ \\t]+${verb.replace(" ", "[ \\t]+")}(?=[ \\t])`, flags);
}

/**
 * `text` with the directives of `verb` made plain comments: the keyword is replaced, no line is
 * added or removed, so the line numbers of the diagnostics stay comparable.
 */
export function neutralise(text: string, verb: DirectiveVerb): string {
  return text.replace(directivePattern(verb, "gi"), (match) => match.replace(KEYWORD, "disabled-by-test"));
}

/** `text` with the directives of every verb neutralised. */
export const neutraliseAll = (text: string): string => DIRECTIVE_VERBS.reduce(neutralise, text);
