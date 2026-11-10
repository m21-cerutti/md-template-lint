/** Package name. */
export const PACKAGE_NAME = "md-template-lint";

export { analyzeDocument, InternalParseError, parseDocument } from "./tags/parser.js";
export type { DocumentAnalysis } from "./tags/parser.js";
export type { GrammarError, SyntaxEvent } from "./tags/listeners.js";
export { loadDocument, loadFile } from "./engine/load.js";
export { inferType } from "./engine/infer.js";
export { createRegistry, runPhase } from "./engine/registry.js";
export type { RuleRegistry } from "./engine/registry.js";
export { checkTarget, checkTemplate } from "./engine/pipeline.js";
export type { TemplateStatus } from "./engine/pipeline.js";
export {
  CATEGORIES,
  createEnv,
  createMemoryIo,
  FIELD_STEPS,
  TARGET_STEPS,
  URL_PROBE_TIMEOUT_MS,
} from "./engine/rule.js";
export type {
  AnyRule,
  Category,
  FieldContext,
  FieldRule,
  FieldStep,
  ParseContext,
  Phase,
  PhaseContexts,
  Rule,
  RuleEnv,
  RuleIo,
  RuleResult,
  TargetContext,
  TargetRule,
  TargetStep,
  TemplateContext,
  UrlProbe,
} from "./engine/rule.js";
export type {
  Diagnostic,
  DocumentModel,
  Field,
  LoadResult,
  ParseFailure,
  RuleCode,
  Section,
  Severity,
  YamlValue,
} from "./engine/model.js";
export type {
  Bound,
  BodyBlock,
  BodyContentTag,
  BodyFence,
  BodyHeading,
  BodyLine,
  BodyPresenceTag,
  BodyTag,
  CaseStyle,
  FilenameConvention,
  Frontmatter,
  FrontmatterComment,
  FrontmatterFieldTag,
  FrontmatterFilenameTag,
  FrontmatterLine,
  FrontmatterPresenceTag,
  FrontmatterTag,
  FrontmatterValueTag,
  Located,
  MarkdownDocument,
  Region,
  SourcePosition,
  TagFinding,
  TagFindingReason,
  TagSubject,
  TypeHint,
} from "./tags/ast.js";
