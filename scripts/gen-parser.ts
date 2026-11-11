/**
 * Usage: pnpm run gen:parser
 * Generates TypeScript lexer, parser, listener and visitor from grammar/*.g4 files
 * with antlr-ng (pure Node, no Java). Empties src/generated/ first, so no stale file
 * survives a grammar change. Runs through tsx with `.ts` import extensions allowed (ADR 0007).
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

export const root = join(dirname(fileURLToPath(import.meta.url)), "..");
export const generatedDir = join(root, "src", "generated");

/** The part of antlr-ng's package.json this script reads. */
interface ToolPackage {
  readonly bin: Readonly<Record<string, string>>;
}

/** Grammar files, lexer first (the parser imports its tokens). */
const GRAMMARS = ["grammar/MdTemplateLexer.g4", "grammar/MdTemplateParser.g4"];

/** Empty `outputDir`, then generate both grammars into it. */
export function generateParser(outputDir: string): void {
  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });
  const toolPkg = JSON.parse(readFileSync(join(root, "node_modules", "antlr-ng", "package.json"), "utf8")) as ToolPackage;
  const binPath = toolPkg.bin["antlr-ng"];
  if (binPath === undefined) {
    throw new Error("gen-parser: antlr-ng package.json has no bin 'antlr-ng'");
  }
  const runner = join(root, "node_modules", "antlr-ng", binPath);
  for (const grammar of GRAMMARS) {
    execFileSync(process.execPath, [runner, "-Dlanguage=TypeScript", "--generate-visitor", "true", "--generate-listener", "true", "--lib", outputDir, "-o", outputDir, grammar], { cwd: root, stdio: "inherit" });
  }
  fixListenerImport(outputDir);
}

/**
 * antlr-ng 1.0.10 imports the `ParseTreeListener` interface as a value, which
 * tsconfig `verbatimModuleSyntax` rejects (TS1484). Rewrite that one import as
 * a type-only import. Exact match, so a generator upgrade that changes the
 * line fails here instead of silently.
 */
function fixListenerImport(outputDir: string): void {
  const file = join(outputDir, "MdTemplateParserListener.ts");
  const before = 'import { ErrorNode, ParseTreeListener, ParserRuleContext, TerminalNode } from "antlr4ng";';
  const after = 'import { ErrorNode, type ParseTreeListener, ParserRuleContext, TerminalNode } from "antlr4ng";';
  const source = readFileSync(file, "utf8");
  if (!source.includes(before)) {
    throw new Error(`gen-parser: expected import not found in ${file}; review fixListenerImport`);
  }
  writeFileSync(file, source.replace(before, after), "utf8");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  generateParser(generatedDir);
}
