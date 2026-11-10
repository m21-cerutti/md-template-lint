/**
 * The 17 type names of docs/spec.md section 3.1. A one-word bracket holding
 * one of them (`[date]`) is a type hint, never an unknown tag (spec 2.7).
 */
export const KNOWN_TYPE_NAMES: ReadonlySet<string> = new Set([
  "string",
  "enum",
  "list",
  "date",
  "path",
  "url",
  "int",
  "float",
  "bool",
  "nested-map",
  "path-alias",
  "list-of-string",
  "list-of-int",
  "list-of-date",
  "list-of-path",
  "list-of-url",
  "list-of-path-alias",
]);
