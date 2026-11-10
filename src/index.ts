/** Package name. */
export const PACKAGE_NAME = "md-template-lint";

export { analyzeDocument, InternalParseError, parseDocument } from "./tags/parser.js";
export type { DocumentAnalysis } from "./tags/parser.js";
export type { GrammarError, SyntaxEvent } from "./tags/listeners.js";
export { loadDocument, loadFile } from "./engine/load.js";
export { inferType } from "./engine/infer.js";
export { createRegistry, runPhase } from "./engine/registry.js";
export type { RuleRegistry } from "./engine/registry.js";
export { checkTarget, checkTemplate, lintTarget } from "./engine/pipeline.js";
export type { TargetResult, TemplateStatus } from "./engine/pipeline.js";
export { anchorLineOf, CATEGORIES, createEnv, createMemoryIo, FIELD_STEPS, TARGET_STEPS, URL_PROBE_TIMEOUT_MS } from "./engine/rule.js";
export type { AnyRule, Category, FieldContext, FieldRule, FieldStep, ParseContext, Phase, PhaseContexts, Rule, RuleEnv, RuleIo, RuleResult, TargetContext, TargetRule, TargetStep, TemplateContext, UrlProbe } from "./engine/rule.js";
export type { Diagnostic, DocumentModel, Field, LoadResult, ParseFailure, RuleCode, Section, Severity, YamlValue } from "./engine/model.js";
export { CONFIG_FILE_NAME, loadConfig } from "./config/load.js";
export type { LoadConfigOptions } from "./config/load.js";
export { compileGlob, matchesGlob } from "./config/glob.js";
export type { CompiledGlob, GlobResult } from "./config/glob.js";
export { displayPath, foldPath, isAbsolutePath, relativeInside, resolvePath, toSlashes } from "./config/paths.js";
export { ON_EMPTY_VALUES } from "./config/types.js";
export type { ConfigResult, LintConfig, OnEmpty, PairConfig, RunDiagnostic } from "./config/types.js";
export { runLint } from "./runner/run.js";
export type { RunOptions } from "./runner/run.js";
export { listedMatches, resolveFileList } from "./runner/list.js";
export type { FileListInput, ListedFile, ListedMatch } from "./runner/list.js";
export { verifyConfig, verifyPaths } from "./runner/verify.js";
export type { VerifyOptions, VerifyPathsInput } from "./runner/verify.js";
export { listFiles, targetsOf } from "./runner/walk.js";
export type {
  Block,
  ExitCode,
  FileResult,
  NoteBlock,
  PairBlock,
  ReportedDiagnostic,
  RunResult,
  RunSummary,
  SchemaField,
  SchemaHeading,
  SourceExcerpt,
  TemplateReport,
  TemplateSchema,
  VerifyResult,
  VerifySummary,
  VerifyTemplate,
} from "./runner/types.js";
export { FORMAT_NAMES, parseArgs, USAGE } from "./cli/args.js";
export type { CliOptions, FormatName, ParsedArgs, UsageCode } from "./cli/args.js";
export { runCli } from "./cli/run.js";
export type { CliEnv, CliResult } from "./cli/run.js";
export { execute, failureReason } from "./cli/main.js";
export type { CliRunner } from "./cli/main.js";
export { readVersion } from "./cli/version.js";
export { describeTemplate } from "./runner/schema.js";
export { reportVerify } from "./cli/verify-report.js";
export type { VerifyReportOptions } from "./cli/verify-report.js";
export { cleanText, report } from "./reporters/index.js";
export type { ReportFormat, ReportOptions, ReportOutput, TextOptions } from "./reporters/index.js";
export { createRealIo, USER_AGENT } from "./io/index.js";
export type { RealIoOptions } from "./io/index.js";
export type {
  Bound,
  BodyBlock,
  BodyContentTag,
  BodyFence,
  BodyHeading,
  BodyLine,
  BodyPatternTag,
  BodyPresenceTag,
  BodyTag,
  BodyUniqueNamesTag,
  CaseStyle,
  Directive,
  DirectiveItem,
  DirectiveVerb,
  FilenameConvention,
  Frontmatter,
  FrontmatterComment,
  FrontmatterFieldTag,
  FrontmatterFilenameTag,
  FrontmatterInertTag,
  FrontmatterLine,
  FrontmatterPresenceTag,
  FrontmatterTag,
  FrontmatterUniqueNamesTag,
  FrontmatterValueTag,
  Located,
  MarkdownDocument,
  PatternPiece,
  PatternPlaceholderName,
  Region,
  SourcePosition,
  TagFinding,
  TagFindingReason,
  TagSubject,
  TypeHint,
} from "./tags/ast.js";
