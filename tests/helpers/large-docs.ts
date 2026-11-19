/**
 * Deterministic generators of large synthetic templates and targets for the characterization
 * tests of the engine (tests/unit/engine/large-*.test.ts). No randomness: a fixed LCG, so every
 * run builds the very same text. The texts carry no path and no personal data.
 *
 * Two shapes:
 * - the BOOK pair: a template of about 600 headings over six levels (chapters with exact, pattern,
 *   repeat, optional, conditional, template-only and invalid-pattern headings) and five targets,
 *   from a clean one to a very faulty one;
 * - the WIDE pair: a small template (a few headings) and a target of thousands of headings (many
 *   repeated parts, each with its own children), with deliberate order mismatches in several parents.
 */

export type Next = () => number;

/** A linear congruential generator (Numerical Recipes constants); each call is an integer in [0, 2^32). */
export function lcg(seed: number): Next {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };
}

/** An integer in [0, bound), from the high bits of the generator. */
export const below = (next: Next, bound: number): number => Math.floor((next() / 2 ** 32) * bound);

const join = (lines: readonly string[]): string => `${lines.join("\n")}\n`;

// ---------------------------------------------------------------------------
// The BOOK pair
// ---------------------------------------------------------------------------

/** Number of chapters of the book template (about 12 headings each). */
export const BOOK_CHAPTERS = 53;

/** The template headings of one chapter: every presence mode and pattern kind of spec 2.6 and 2.10. */
function chapterTemplate(chapter: number): string[] {
  const lines = [
    `## Chapter ${chapter}`,
    "### Intro",
    "#### Context [presence:optional]",
    "##### Origin",
    "###### Source [presence:optional]",
    '### Step [pattern:"Step {digits}"] [repeat-rules:same-level:min:1] [order:first:number:ascending]',
    "#### Check [presence:optional]",
    '### Release [pattern:"v{semver}"] [repeat-rules:same-level:max:2] [presence:optional]',
    '### Owner [pattern:"Owner {text}"]',
    "### Draft [presence:template-only]",
    "### Wrap-up [content:non-empty] [content:subheadings:disallow]",
  ];
  // An invalid pattern (MTL014): the heading is never checked and not listed.
  if (chapter % 7 === 3) lines.push('### Broken [pattern:"{bogus}"]');
  if (chapter % 9 === 4) lines.push("### Reviewer [presence:conditional:x]");
  return lines;
}

/** The book template: three fields, `# Handbook`, `## Overview`, the chapters, an optional appendix. */
export function bookTemplate(): string {
  const lines = ["---", 'title: "string"', 'owner: "string" # [presence:optional]', 'version: "0.0.0" # [format:semver]', "---", "# Handbook", "## Overview"];
  for (let chapter = 0; chapter < BOOK_CHAPTERS; chapter += 1) lines.push(...chapterTemplate(chapter));
  lines.push("## Appendix [presence:optional]");
  return join(lines);
}

/** One fault of a chapter: what `chapterTarget` does to an otherwise conforming chapter. */
const CHAPTER_FAULTS = 12;

/** The target lines of one chapter; `fault` is a number below `CHAPTER_FAULTS`, or null for a conforming chapter. */
function chapterTarget(chapter: number, next: Next, fault: number | null): string[] {
  const steps = 1 + below(next, 3);
  const intro = ["### Intro", "Introduction text.", ...(below(next, 2) === 0 ? ["#### Context", "##### Origin", "###### Source"] : ["#### Context", "##### Origin"])];
  const stepNumbers = fault === 3 ? [3, 1, 2] : fault === 4 ? [] : Array.from({ length: steps }, (_, index) => index + 1);
  const stepLines = stepNumbers.flatMap((number) => [`### Step ${number}`, "Do it.", ...(number % 2 === 0 ? ["#### Check"] : [])]);
  const releases = fault === 5 ? ["v1.0.0", "v1.1.0", "v1.2.0"] : below(next, 2) === 0 ? ["v2.0.0"] : [];
  const releaseLines = releases.flatMap((release) => [`### ${release}`, "Notes."]);
  const owner = fault === 7 ? "### Owner 12" : "### Owner Sam";
  const wrap = fault === 10 ? ["### Wrap-up"] : ["### Wrap-up", "Closing words."];
  let body = [...intro, ...stepLines, ...releaseLines, owner, ...(fault === 8 ? ["### Draft"] : []), ...wrap];
  if (fault === 0) body = [...wrap, ...body.filter((line) => !wrap.includes(line))];
  if (fault === 1) body = body.filter((line) => !intro.includes(line));
  if (fault === 2) body.splice(body.indexOf(owner) + 1, 0, "### Extra", "Extra text.");
  if (fault === 6) body.splice(body.indexOf(owner), 0, "### Stray", "### v9.9.9");
  if (fault === 9) body.push("#### Footnote");
  if (fault === 11) body = body.map((line) => (line === "### Intro" ? "### intro" : line));
  return [`## Chapter ${chapter}`, "Chapter text.", ...body];
}

/**
 * The target of one `level` of fault, 0 to 4: 0 conforms to the template; each higher level
 * puts a fault in about `rate` percent of the chapters (and adds a frontmatter fault, a directive
 * or a heading out of order). The same `seed` and `level` always give the same text.
 */
export function bookTarget(level: number, seed: number): string {
  const next = lcg(seed * 7919 + level);
  const rate = [0, 15, 30, 55, 80][level] ?? 0;
  const front = ["---", level === 4 ? "title: " : "title: Handbook", "owner: Sam", level === 1 ? "version: x" : "version: 1.2.3", ...(level === 3 ? ["bogus: 1"] : []), "---"];
  const directive = level === 2 ? ["<!-- md-template-lint disable-file MTL616 -->"] : level === 3 ? ["<!-- md-template-lint disable-file MTL606 -->"] : [];
  const lines = [...front, ...directive];
  const head = ["# Handbook", "Handbook text.", "## Overview", "Overview text."];
  // Level 4: the H2 comes before the H1, so the file-scope order is wrong (MTL604).
  lines.push(...(level === 4 ? [head[2] ?? "", head[3] ?? "", head[0] ?? "", head[1] ?? ""] : head));
  for (let chapter = 0; chapter < BOOK_CHAPTERS; chapter += 1) {
    const hit = below(next, 100) < rate;
    const fault = hit ? below(next, CHAPTER_FAULTS) : null;
    lines.push(...chapterTarget(chapter, next, fault));
  }
  if (level >= 2) lines.push("## Appendix", "Appendix text.");
  if (level === 4) lines.push("## Colophon", "### Extra detail");
  return join(lines);
}

// ---------------------------------------------------------------------------
// The WIDE pair
// ---------------------------------------------------------------------------

/** The wide template: a guide with four ordered children, repeated parts with children, releases. */
export function wideTemplate(): string {
  return join([
    "---",
    'title: "string"',
    "---",
    "# Handbook",
    "## Guide",
    "#### Prelude",
    "### Alpha",
    "### Beta",
    "### Gamma",
    "### Delta",
    '## Part [pattern:"Part {digits}"] [repeat-rules:same-level] [order:first:number:ascending]',
    "#### Prelude [presence:optional]",
    "### Alpha",
    "### Beta",
    "### Gamma [presence:optional]",
    '### Item [pattern:"Item {digits}"] [repeat-rules:same-level] [order:first:number:ascending]',
    "##### Remark [presence:optional]",
    '### Oops [pattern:"{bogus}"]',
    '### Owner [pattern:"Owner {text}"]',
    '## Release [pattern:"v{semver}"] [repeat-rules:same-level] [presence:optional]',
  ]);
}

/**
 * The wide target: `# Handbook`, a guide whose `#### Prelude` comes after `### Beta` (MTL611, with
 * a long target order list: many extra headings follow), `parts` repeated parts (about one in five
 * faulty: a late prelude, a missing child, `Beta` before `Alpha`, items out of order, a stray
 * heading, a stray repeat match, a placeholder mismatch), then releases. About 20 headings a part.
 */
export function wideTarget(parts: number): string {
  const next = lcg(20260101);
  const lines = ["---", "title: Handbook", "---", "# Handbook", "Text.", "## Guide", "### Alpha", "### Beta", "#### Prelude", "### Gamma", "### Delta"];
  for (let note = 1; note <= 60; note += 1) lines.push(`### Log ${note}`, "Entry.");
  for (let part = 1; part <= parts; part += 1) {
    const fault = below(next, 5) === 0 ? below(next, 7) : null;
    const items = 10 + below(next, 6);
    const itemNumbers = Array.from({ length: items }, (_, index) => (fault === 3 && index === 4 ? 2 : index + 1));
    const children = fault === 1 ? ["### Alpha"] : fault === 6 ? ["### Beta", "### Alpha"] : ["### Alpha", "### Beta"];
    // The prelude comes first in a conforming part; a late one is out of order across levels.
    const prelude = part % 3 === 0 || fault === 0 ? ["#### Prelude"] : [];
    const itemLines = itemNumbers.flatMap((number) => [`### Item ${number}`, ...(number % 3 === 0 ? ["##### Remark"] : [])]);
    lines.push(`## Part ${part === 120 ? 7 : part}`, "Part text.", ...(fault === 0 ? [] : prelude), ...children, ...(fault === 0 ? prelude : []), ...(part % 4 === 0 && fault !== 1 ? ["### Gamma"] : []), ...itemLines);
    if (fault === 2) lines.push("### Stray", "### Item 99");
    if (fault === 4) lines.push("### Stray");
    lines.push(fault === 5 ? "### Owner 7" : "### Owner Kim");
  }
  lines.push("## v1.0.0", "## v0.9.0", "## Release", "## v1.1.0");
  return join(lines);
}
