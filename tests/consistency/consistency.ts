/**
 * Grammar-to-rule consistency check (`pnpm run check:rules`, ADR 0002, spec 9).
 * Each check returns human-readable problems; an empty list means no drift.
 * The grammar side is read from the generated ATNs (MdTemplateParser._ATN,
 * MdTemplateLexer._ATN), never from the .g4 text. Hand-kept lists covered:
 * tagWord, tagFamily, the visitor registry, KNOWN_TYPE_NAMES, the AST tag
 * kind lists, the DEFAULT_MODE body rules, the rule files, the category code
 * ranges and the spec code table.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ActionTransition, LexerActionType, LexerModeAction, LexerPushModeAction, LexerTypeAction, RuleTransition, Transition, type ATN, type ATNState } from "antlr4ng";
import { LIST_PROMOTABLE_HINTS } from "../../src/engine/infer.js";
import { createRegistry } from "../../src/engine/registry.js";
import { CATEGORIES, CATEGORY_RANGES, isStub, type AnyRule, type Category } from "../../src/engine/rule.js";
import { MdTemplateLexer } from "../../src/generated/MdTemplateLexer.js";
import { MdTemplateParser } from "../../src/generated/MdTemplateParser.js";
import { BODY_TAG_KINDS, FRONTMATTER_TAG_KINDS } from "../../src/tags/ast.js";
import { parseDocument } from "../../src/tags/parser.js";
import { KNOWN_TYPE_NAMES } from "../../src/tags/types.js";
import { BODY_TAG_VISITORS, FRONTMATTER_TAG_VISITORS } from "../../src/tags/visitors/index.js";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (...parts: string[]) => readFileSync(join(ROOT, ...parts), "utf8");

// ---------------------------------------------------------------------------
// Spec inputs (docs/spec.md is the contract; it is never edited here)
// ---------------------------------------------------------------------------

export interface SpecCode {
  readonly code: string;
  readonly name: string;
  /** "error", "warning" or "error or warning". */
  readonly severity: string;
  readonly category: Category;
  /** Raw message (or detail text) cell of the 4.3 table, trimmed, Markdown kept. */
  readonly message: string;
}

/** A run error of the docs/spec.md 4.3 "run errors" table (MTL9xx, no rule, no severity column). */
export interface SpecRunCode {
  readonly code: string;
  readonly name: string;
  /** Raw "Message (shape)" cell, trimmed, Markdown kept. */
  readonly message: string;
}

/** Text of a Markdown section from its heading line to the next `stop` line. */
function section(text: string, heading: string, stop: string): string {
  const start = text.indexOf(`\n${heading}`);
  if (start < 0) throw new Error(`docs/spec.md: section '${heading}' not found`);
  const end = text.indexOf(`\n${stop}`, start + heading.length + 1);
  return text.slice(start, end < 0 ? undefined : end);
}

const unquote = (cell: string) => cell.trim().replaceAll("`", "");
const spec = () => read("docs", "spec.md").replaceAll("\r\n", "\n");
const isCategory = (word: string): word is Category => (CATEGORIES as readonly string[]).includes(word);

/** Codes of docs/spec.md 4.3 with their category heading, except the MTL9xx run errors. */
export function specCodes(text = spec()): SpecCode[] {
  const codes: SpecCode[] = [];
  let category: Category | null = null;
  for (const line of section(text, "### 4.3 Code table", "## 5.").split("\n")) {
    if (line.startsWith("#### ")) {
      const word = line.slice(5).split(" ")[0] ?? "";
      category = isCategory(word) ? word : null;
    } else if (category !== null && line.startsWith("| `MTL")) {
      const cells = line.split("|");
      codes.push({
        code: unquote(cells[1] ?? ""),
        name: unquote(cells[2] ?? ""),
        severity: unquote(cells[3] ?? ""),
        category,
        message: (cells[4] ?? "").trim(),
      });
    }
  }
  return codes;
}

/** Run errors (MTL9xx) of the docs/spec.md 4.3 "run errors" table. */
export function specRunCodes(text = spec()): SpecRunCode[] {
  const codes: SpecRunCode[] = [];
  for (const line of section(text, "#### run errors", "#### Directive warnings").split("\n")) {
    if (!line.startsWith("| `MTL")) continue;
    const cells = line.split("|");
    codes.push({
      code: unquote(cells[1] ?? ""),
      name: unquote(cells[2] ?? ""),
      message: (cells[3] ?? "").trim(),
    });
  }
  return codes;
}

/** Category ranges of the docs/spec.md 4.2 table, e.g. syntax -> [1, 99]. */
export function specRanges(text = spec()): Map<Category, [number, number]> {
  const ranges = new Map<Category, [number, number]>();
  for (const line of section(text, "### 4.2 Code ranges", "### 4.3").split("\n")) {
    const cells = line.split("|");
    const category = unquote(cells[2] ?? "");
    if (!line.startsWith("| `MTL") || !isCategory(category)) continue;
    const [low = "", high = ""] = unquote(cells[1] ?? "").split("-");
    ranges.set(category, [Number(low.slice(3)), Number(high.replace("MTL", ""))]);
  }
  return ranges;
}

/** The 17 type names listed in docs/spec.md 3.1. */
export function specTypeNames(text = spec()): string[] {
  const body = section(text, "### 3.1 The 17 types", "Inference is LOOSE");
  return body.split("`").filter((_, index) => index % 2 === 1);
}

// ---------------------------------------------------------------------------
// ATN helpers
// ---------------------------------------------------------------------------

/** Rules called and tokens matched first by the alternatives of `ruleIndex`. */
export function firstSymbols(atn: ATN, ruleIndex: number) {
  const rules = new Set<number>();
  const tokens = new Set<number>();
  const start = atn.ruleToStartState[ruleIndex];
  const stop = atn.ruleToStopState[ruleIndex];
  const stack: ATNState[] = start ? [start] : [];
  const seen = new Set<number>();
  while (stack.length > 0) {
    const state = stack.pop();
    if (state === undefined || seen.has(state.stateNumber) || state === stop) continue;
    seen.add(state.stateNumber);
    for (const transition of state.transitions) {
      if (transition instanceof RuleTransition) rules.add(transition.target.ruleIndex);
      else if (transition.isEpsilon) stack.push(transition.target);
      else for (const token of transition.label?.toArray() ?? []) tokens.add(token);
    }
  }
  return { rules, tokens };
}

const parserAtn = MdTemplateParser._ATN;
const lexerAtn = MdTemplateLexer._ATN;
const tokenName = (type: number) => MdTemplateLexer.symbolicNames[type] ?? String(type);
const ruleName = (index: number) => MdTemplateParser.ruleNames[index] ?? String(index);
const lexerRuleName = (index: number) => MdTemplateLexer.ruleNames[index] ?? String(index);
const names = (types: Iterable<number>) => [...types].map(tokenName).sort();

function sameSet(label: string, actual: readonly string[], expected: readonly string[]): string[] {
  const problems: string[] = [];
  for (const name of expected) {
    if (!actual.includes(name)) problems.push(`${label}: missing ${name}`);
  }
  for (const name of actual) {
    if (!expected.includes(name)) problems.push(`${label}: unexpected ${name}`);
  }
  return problems;
}

/** Lexer rule indices of `mode`, in declaration order. */
export function modeRules(mode: number): number[] {
  return (lexerAtn.modeToStartState[mode]?.transitions ?? []).map((transition) => transition.target.ruleIndex);
}

/** Keyword tokens of lexer mode `mode` whose literal is a plain word (`'type'`). */
export function modeKeywords(mode: number): string[] {
  const words: string[] = [];
  for (const rule of modeRules(mode)) {
    const type = lexerAtn.ruleToTokenType[rule] ?? -1;
    const literal = MdTemplateLexer.literalNames[type] ?? null;
    const word = literal?.slice(1, -1) ?? "";
    if (literal !== null && word !== "" && [...word].every((c) => c >= "a" && c <= "z")) {
      words.push(tokenName(type));
    }
  }
  return words.sort();
}

// ---------------------------------------------------------------------------
// Grammar lists
// ---------------------------------------------------------------------------

/** tagFamily lists exactly the family keywords that start an fm* or body* tag rule. */
export function checkTagFamily(): string[] {
  const family = firstSymbols(parserAtn, MdTemplateParser.RULE_tagFamily).tokens;
  const fm = firstSymbols(parserAtn, MdTemplateParser.RULE_fmTagBody).rules;
  const body = firstSymbols(parserAtn, MdTemplateParser.RULE_bodyTagBody).rules;
  const starts = new Set<number>();
  for (const rule of [...fm, ...body]) {
    for (const token of firstSymbols(parserAtn, rule).tokens) starts.add(token);
  }
  return sameSet("tagFamily (grammar/MdTemplateParser.g4) vs first keywords of fmTagBody/bodyTagBody", names(family), names(starts));
}

/** tagWord = generic word tokens + the six hint and marker words of TAG_TEXT. */
export function checkTagWord(): string[] {
  const tagWord = names(firstSymbols(parserAtn, MdTemplateParser.RULE_tagWord).tokens);
  const hintWords = names(firstSymbols(parserAtn, MdTemplateParser.RULE_fmHintWord).tokens).filter((name) => name !== "ALIAS_MARK");
  const expected = ["ALNUM", "NUMBER", "WORD", "RULE", ...hintWords];
  const problems = sameSet("tagWord vs word tokens + fmHintWord + RULE", tagWord, expected);
  const textKeywords = modeKeywords(MdTemplateLexer.TAG_TEXT);
  for (const keyword of textKeywords) {
    if (!tagWord.includes(keyword)) {
      problems.push(`tagWord: TAG_TEXT keyword ${keyword} is missing (stage 1 would split it)`);
    }
  }
  const hintCount = expected.length - 3;
  if (hintCount !== 6) problems.push(`tagWord: expected 6 hint and marker words, found ${hintCount}`);
  const strict = modeKeywords(MdTemplateLexer.TAG_STRICT);
  for (const keyword of textKeywords) {
    if (strict.includes(keyword)) {
      problems.push(`TAG_TEXT: tag keyword ${keyword} must live in TAG_STRICT only`);
    }
  }
  return problems;
}

type VisitorLike = object;

function visitorProblems(region: string, bodyRule: number, visitors: readonly VisitorLike[]): string[] {
  const problems: string[] = [];
  const alternatives = [...firstSymbols(parserAtn, bodyRule).rules].map(ruleName);
  const handles = (visitor: VisitorLike, rule: string) => {
    const method = `visit${rule.charAt(0).toUpperCase()}${rule.slice(1)}`;
    return typeof (visitor as Record<string, unknown>)[method] === "function";
  };
  for (const rule of alternatives) {
    const owners = visitors.filter((visitor) => handles(visitor, rule));
    if (owners.length !== 1) {
      problems.push(`visitors/index.ts ${region}: ${owners.length} visitors handle ${rule} (expected exactly 1)`);
    }
  }
  for (const visitor of visitors) {
    if (!alternatives.some((rule) => handles(visitor, rule))) {
      problems.push(`visitors/index.ts ${region}: ${visitor.constructor.name} handles no ${ruleName(bodyRule)} alternative`);
    }
  }
  return problems;
}

/** Every fmTagBody / bodyTagBody alternative has exactly one registered visitor. */
export function checkVisitorRegistry(frontmatter: readonly VisitorLike[] = FRONTMATTER_TAG_VISITORS, body: readonly VisitorLike[] = BODY_TAG_VISITORS): string[] {
  return [...visitorProblems("FRONTMATTER_TAG_VISITORS", MdTemplateParser.RULE_fmTagBody, frontmatter), ...visitorProblems("BODY_TAG_VISITORS", MdTemplateParser.RULE_bodyTagBody, body)];
}

/** KNOWN_TYPE_NAMES equals the 17 types of spec 3.1; promoted list types exist. */
export function checkTypeNames(known: ReadonlySet<string> = KNOWN_TYPE_NAMES): string[] {
  const types = specTypeNames();
  const problems = sameSet("KNOWN_TYPE_NAMES (src/tags/types.ts) vs spec 3.1", [...known], types);
  if (types.length !== 17) problems.push(`spec 3.1 lists ${types.length} types, expected 17`);
  for (const hint of LIST_PROMOTABLE_HINTS) {
    if (!known.has(`list-of-${hint}`)) {
      problems.push(`LIST_PROMOTABLE_HINTS: list-of-${hint} is not a known type`);
    }
  }
  return problems;
}

// ---------------------------------------------------------------------------
// AST kinds, derived from the grammar (no hand-kept sample list)
// ---------------------------------------------------------------------------

/** Text for tokens whose lexer rule is a negated set (no first character to pick). */
const TOKEN_SAMPLES: Readonly<Record<string, string>> = {
  FREE_TEXT: "x",
  // Negated-set tokens of mode TAG_PATTERN: literal text, an escape pair, a placeholder.
  PAT_TEXT: "x",
  PAT_ESCAPE: "\\\\",
  PAT_PLACEHOLDER: "{text}",
  // The count of `repeat-rules` is 1 or more: the first digit of the set (`0`) is refused.
  NUMBER: "1",
};

/**
 * Every token sequence `ruleIndex` accepts, each loop taken at most once per
 * path. Token sequences only: the caller turns them into text.
 */
export function sentences(atn: ATN, ruleIndex: number): number[][] {
  const out: number[][] = [];
  const walk = (state: ATNState, follow: readonly ATNState[], tokens: number[], seen: string[]) => {
    if (out.length > 1000) throw new Error(`sentences: ${ruleName(ruleIndex)} explodes`);
    if (atn.ruleToStopState[state.ruleIndex] === state) {
      const next = follow.at(-1);
      if (next === undefined) out.push(tokens);
      else walk(next, follow.slice(0, -1), tokens, seen);
      return;
    }
    const key = `${follow.length}:${state.stateNumber}`;
    if (seen.includes(key)) return;
    const path = [...seen, key];
    for (const transition of state.transitions) {
      if (transition instanceof RuleTransition) {
        walk(transition.target, [...follow, transition.followState], tokens, path);
      } else if (transition.isEpsilon) {
        walk(transition.target, follow, tokens, path);
      } else {
        for (const token of transition.label?.toArray() ?? []) {
          walk(transition.target, follow, [...tokens, token], path);
        }
      }
    }
  };
  const start = atn.ruleToStartState[ruleIndex];
  if (start) walk(start, [], [], []);
  return out;
}

/** First string the lexer rule `ruleIndex` matches (first transition, first character). */
function lexerRuleText(ruleIndex: number): string | null {
  const walk = (state: ATNState, follow: readonly ATNState[], text: string, seen: string[]): string | null => {
    if (lexerAtn.ruleToStopState[state.ruleIndex] === state) {
      const next = follow.at(-1);
      return next === undefined ? text : walk(next, follow.slice(0, -1), text, seen);
    }
    const key = `${follow.length}:${state.stateNumber}`;
    if (seen.includes(key)) return null;
    for (const transition of state.transitions) {
      let found: string | null = null;
      if (transition instanceof RuleTransition) {
        const calls = [...follow, transition.followState];
        found = walk(transition.target, calls, text, [...seen, key]);
      } else if (transition.isEpsilon) {
        found = walk(transition.target, follow, text, [...seen, key]);
      } else {
        const code = transition.label?.toArray()[0];
        if (code !== undefined && transition.transitionType !== Transition.NOT_SET) {
          found = walk(transition.target, follow, text + String.fromCodePoint(code), [...seen, key]);
        }
      }
      if (found !== null) return found;
    }
    return null;
  };
  const start = lexerAtn.ruleToStartState[ruleIndex];
  return start ? walk(start, [], "", []) : null;
}

const STAGE_TWO_MODES = [MdTemplateLexer.TAG_STRICT, MdTemplateLexer.TAG_FREE, MdTemplateLexer.TAG_SCHEME, MdTemplateLexer.TAG_PATTERN];

/** Sample text of a stage-2 token: an override, else the text its lexer rule matches. */
function tokenText(token: number): string | undefined {
  const override = TOKEN_SAMPLES[tokenName(token)];
  if (override !== undefined) return override;
  for (const mode of STAGE_TWO_MODES) {
    for (const rule of modeRules(mode)) {
      if (ruleShape(rule).type === token) return lexerRuleText(rule) ?? undefined;
    }
  }
  return undefined;
}

/** Source text of a token sequence, or a problem when a token has no sample text. */
export function sentenceText(tokens: readonly number[]): string | { problem: string } {
  let text = "";
  for (const token of tokens) {
    const sample = tokenText(token);
    if (sample === undefined) return { problem: `no sample text for token ${tokenName(token)}` };
    text += sample;
  }
  return text;
}

/** Tag kinds produced by the visitors for every sentence of every alternative of `bodyRule`. */
function kindsByAlternative(region: "frontmatter" | "body", bodyRule: number) {
  const problems: string[] = [];
  const byAlternative = new Map<string, Set<string>>();
  for (const alternative of firstSymbols(parserAtn, bodyRule).rules) {
    const kinds = new Set<string>();
    byAlternative.set(ruleName(alternative), kinds);
    for (const tokens of sentences(parserAtn, alternative)) {
      const text = sentenceText(tokens);
      if (typeof text !== "string") {
        problems.push(`${ruleName(alternative)}: ${text.problem}`);
        continue;
      }
      // Production entry rule `document` (spec 2), not a test-only entry rule.
      const source = region === "frontmatter" ? `---\nk: v # [${text}]\n---\n` : `---\n---\n## H [${text}]\n`;
      const document = parseDocument(source);
      const produced: string[] = [];
      for (const line of document.frontmatter?.lines ?? []) {
        if (line.kind === "key" && line.comment !== null) {
          produced.push(...[...line.comment.tags, ...line.comment.inertTags].map((t) => t.kind));
        }
      }
      for (const block of document.body) {
        if (block.kind === "heading") produced.push(...block.tags.map((tag) => tag.kind));
      }
      if (produced.length !== 1 || document.findings.length > 0) {
        problems.push(`${ruleName(alternative)}: [${text}] gives [${produced.join(", ")}]`);
      }
      for (const kind of produced) kinds.add(kind);
    }
    if (kinds.size === 0) problems.push(`${ruleName(alternative)}: produces no tag kind`);
  }
  return { problems, byAlternative };
}

/**
 * AST kinds: every grammar alternative yields tags through its visitor, each
 * kind comes from exactly one alternative (its family), and the kinds equal
 * FRONTMATTER_TAG_KINDS / BODY_TAG_KINDS of src/tags/ast.ts.
 */
export function checkAstKinds(frontmatterKinds: readonly string[] = FRONTMATTER_TAG_KINDS, bodyKinds: readonly string[] = BODY_TAG_KINDS): string[] {
  const problems: string[] = [];
  const regions = [
    ["frontmatter", MdTemplateParser.RULE_fmTagBody, frontmatterKinds, "FRONTMATTER_TAG_KINDS"],
    ["body", MdTemplateParser.RULE_bodyTagBody, bodyKinds, "BODY_TAG_KINDS"],
  ] as const;
  for (const [region, bodyRule, declared, label] of regions) {
    const result = kindsByAlternative(region, bodyRule);
    problems.push(...result.problems);
    const produced: string[] = [];
    for (const kinds of result.byAlternative.values()) {
      for (const kind of kinds) {
        if (produced.includes(kind)) problems.push(`${label}: ${kind} comes from two families`);
        produced.push(kind);
      }
    }
    problems.push(...sameSet(`${label} (src/tags/ast.ts) vs grammar + visitors`, declared, produced));
  }
  return problems;
}

/** Kind -> family (grammar alternative rule), derived; for docs and reports. */
export function tagFamilies(): Map<string, string> {
  const families = new Map<string, string>();
  const regions = [
    ["frontmatter", MdTemplateParser.RULE_fmTagBody],
    ["body", MdTemplateParser.RULE_bodyTagBody],
  ] as const;
  for (const [region, bodyRule] of regions) {
    for (const [alternative, kinds] of kindsByAlternative(region, bodyRule).byAlternative) {
      for (const kind of kinds) families.set(`${region}:${kind}`, alternative);
    }
  }
  return families;
}

// ---------------------------------------------------------------------------
// DEFAULT_MODE mirror (lexer ATN, mode membership and declaration order)
// ---------------------------------------------------------------------------

/** B_ rules in mode BODY and DS_ rules in DEFAULT_MODE: heading, 2 fences, table, list, html, blank, char. */
export const MIRROR_RULE_COUNT = 8;

const COMMANDS: ReadonlySet<number> = new Set([LexerActionType.TYPE, LexerActionType.MODE, LexerActionType.PUSH_MODE, LexerActionType.POP_MODE]);

interface RuleShape {
  /** Canonical ATN graph of the rule pattern (lexer commands removed). */
  readonly graph: string;
  readonly type: number;
  /** Mode after the token; null when the rule does not change mode. */
  readonly mode: number | null;
  readonly pushes: readonly number[];
}

/** Shape of one lexer rule, read from the lexer ATN. */
export function ruleShape(ruleIndex: number): RuleShape {
  let type = lexerAtn.ruleToTokenType[ruleIndex] ?? -1;
  let mode: number | null = null;
  const pushes: number[] = [];
  const command = (transition: Transition): boolean => {
    if (!(transition instanceof ActionTransition)) return false;
    const action = lexerAtn.lexerActions[transition.actionIndex];
    if (action === undefined || !COMMANDS.has(action.actionType)) return false;
    if (action instanceof LexerTypeAction) type = action.type;
    else if (action instanceof LexerModeAction) mode = action.mode;
    else if (action instanceof LexerPushModeAction) pushes.push(action.mode);
    return true;
  };
  /** Skip states whose only transition is a lexer command. */
  const resolve = (state: ATNState): ATNState => {
    let current = state;
    for (;;) {
      const only = current.transitions.length === 1 ? current.transitions[0] : undefined;
      if (only === undefined || !command(only)) return current;
      current = only.target;
    }
  };
  const start = lexerAtn.ruleToStartState[ruleIndex];
  const ids = new Map<number, number>();
  const queue: ATNState[] = [];
  const idOf = (state: ATNState) => {
    const target = resolve(state);
    if (!ids.has(target.stateNumber)) {
      ids.set(target.stateNumber, ids.size);
      queue.push(target);
    }
    return ids.get(target.stateNumber);
  };
  if (start) idOf(start);
  const lines: string[] = [];
  for (let index = 0; index < queue.length; index += 1) {
    const state = queue[index];
    if (state === undefined) continue;
    const stop = lexerAtn.ruleToStopState[state.ruleIndex] === state;
    const edges = state.transitions.map((transition) => {
      if (stop) return "stop";
      if (transition instanceof RuleTransition) {
        return `rule:${lexerRuleName(transition.target.ruleIndex)}>${idOf(transition.followState)}`;
      }
      if (command(transition)) return `eps>${idOf(transition.target)}`;
      if (transition instanceof ActionTransition) return `action>${idOf(transition.target)}`;
      const label = transition.label?.toString() ?? `t${transition.transitionType}`;
      return `${label}>${idOf(transition.target)}`;
    });
    lines.push(`${ids.get(state.stateNumber)}:${edges.join(",")}`);
  }
  return { graph: lines.join(";"), type, mode, pushes };
}

/** Problems of the DS_ rule `start` against the B_ rule `body`. */
export function compareMirror(start: number, body: number): string[] {
  const ds = ruleShape(start);
  const b = ruleShape(body);
  const pair = `${lexerRuleName(start)} vs ${lexerRuleName(body)}`;
  const problems: string[] = [];
  if (ds.graph !== b.graph) problems.push(`DEFAULT_MODE: ${pair}: patterns differ`);
  if (ds.type !== b.type) problems.push(`DEFAULT_MODE: ${pair}: token types differ`);
  // A B_ rule without mode() stays in BODY; its DS_ twin must switch to the same mode.
  if (ds.mode !== (b.mode ?? MdTemplateLexer.BODY)) {
    problems.push(`DEFAULT_MODE: ${pair}: next modes differ`);
  }
  if (ds.pushes.join() !== b.pushes.join()) problems.push(`DEFAULT_MODE: ${pair}: pushModes differ`);
  return problems;
}

/** The DS_ rules of DEFAULT_MODE mirror the B_ rules of mode BODY, same order (ADR 0002). */
export function checkDefaultModeMirror(startMode: number = MdTemplateLexer.DEFAULT_MODE, bodyMode: number = MdTemplateLexer.BODY): string[] {
  const pick = (mode: number, prefix: string) => modeRules(mode).filter((rule) => lexerRuleName(rule).startsWith(prefix));
  const starts = pick(startMode, "DS_");
  const bodies = pick(bodyMode, "B_");
  const problems: string[] = [];
  const modeName = (mode: number) => MdTemplateLexer.modeNames[mode] ?? String(mode);
  if (starts.length !== MIRROR_RULE_COUNT) {
    problems.push(`DEFAULT_MODE: found ${starts.length} DS_ rules in ${modeName(startMode)}, expected ${MIRROR_RULE_COUNT}`);
  }
  if (bodies.length !== MIRROR_RULE_COUNT) {
    problems.push(`DEFAULT_MODE: found ${bodies.length} B_ rules in ${modeName(bodyMode)}, expected ${MIRROR_RULE_COUNT}`);
  }
  const suffix = (rule: number, prefix: string) => lexerRuleName(rule).slice(prefix.length);
  for (let index = 0; index < Math.max(starts.length, bodies.length); index += 1) {
    const start = starts[index];
    const body = bodies[index];
    if (start === undefined || body === undefined) continue;
    if (suffix(start, "DS_") !== suffix(body, "B_")) {
      problems.push(`DEFAULT_MODE: rule ${index + 1} is ${lexerRuleName(start)} vs ${lexerRuleName(body)} (order)`);
    } else {
      problems.push(...compareMirror(start, body));
    }
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Rule files, ranges, codes
// ---------------------------------------------------------------------------

/** src/rules/ holds exactly one file per category. */
export function checkRuleFiles(files = readdirSync(join(ROOT, "src", "rules"))): string[] {
  const stems = files.filter((file) => file.endsWith(".ts")).map((file) => file.slice(0, -3));
  return sameSet("src/rules/*.ts vs the nine categories", stems, [...CATEGORIES]);
}

/** src/engine/ranges.json (CATEGORY_RANGES, new-rule.ts) equals the spec 4.2 table. */
export function checkRanges(shared: Readonly<Record<Category, readonly number[]>> = CATEGORY_RANGES, specified: ReadonlyMap<Category, readonly number[]> = specRanges()): string[] {
  const problems: string[] = [];
  for (const category of CATEGORIES) {
    const own = shared[category].join("-");
    const theirs = specified.get(category)?.join("-") ?? "missing";
    if (own !== theirs) {
      problems.push(`src/engine/ranges.json ${category}: ${own} vs spec 4.2 ${theirs}`);
    }
  }
  return problems;
}

/**
 * Every spec code (except MTL9xx) has a registered rule with a real check, and
 * every registered rule is a spec code. A scaffold stub (`notImplemented`)
 * fails until its check is written. Registered rules match the spec.
 */
export function checkCodes(codes: readonly SpecCode[] = specCodes(), registered: readonly AnyRule[] = createRegistry().rules): string[] {
  const problems: string[] = [];
  const bySpec = new Map(codes.map((entry) => [entry.code, entry]));
  const byCode = new Map<string, AnyRule>(registered.map((rule) => [rule.code, rule]));
  for (const entry of codes) {
    const rule = byCode.get(entry.code);
    if (rule === undefined) {
      problems.push(`${entry.code} ${entry.name}: in docs/spec.md 4.3 but no rule is registered in src/rules/${entry.category}.ts`);
    } else if (isStub(rule)) {
      problems.push(`${entry.code} ${entry.name}: in docs/spec.md 4.3 but the rule in src/rules/${entry.category}.ts is still a stub check (implement it)`);
    }
  }
  for (const rule of registered) {
    const entry = bySpec.get(rule.code);
    if (entry === undefined) {
      problems.push(`${rule.code} ${rule.name}: registered but not in docs/spec.md 4.3`);
      continue;
    }
    if (entry.name !== rule.name) {
      problems.push(`${rule.code}: name '${rule.name}' differs from spec '${entry.name}'`);
    }
    if (entry.category !== rule.category) {
      problems.push(`${rule.code}: category '${rule.category}' differs from spec '${entry.category}'`);
    }
    if (!entry.severity.split(" or ").includes(rule.severity)) {
      problems.push(`${rule.code}: severity '${rule.severity}' differs from spec '${entry.severity}'`);
    }
  }
  return problems;
}

/** Every check, in a fixed order. */
export function allProblems(): string[] {
  return [...checkTagFamily(), ...checkTagWord(), ...checkVisitorRegistry(), ...checkTypeNames(), ...checkAstKinds(), ...checkDefaultModeMirror(), ...checkRuleFiles(), ...checkRanges(), ...checkCodes()];
}
