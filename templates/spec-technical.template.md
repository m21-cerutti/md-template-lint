---
# [unique-headings-names]
title: Technical specification # [presence:required]
last_updated: 2026-11-11 # [presence:required] [format:date] [date]
---

# Specification title [pattern:"{text}"]

The contract of the system: what it must do, exactly. When this file and the code
disagree, one of them is a bug.

## Summary [presence:optional] [content:non-empty]

- Table of contents: one link per section.

## 1. Model [content:non-empty]

The core objects and their relations. Define each term once, then use it
unchanged.

## 2. Template tags [content:non-empty]

The tags, where each one binds and what it checks.

## 3. Types [content:non-empty]

The value types and how each is inferred or declared.

## 4. Lint pipeline and rule codes [content:non-empty]

The phases of a run, the order of the rules and the table of codes.

## 5. Defect decisions (D01 to D18) [content:non-empty]

The decisions taken on the defects of the previous tools, one id each.

## 6. Configuration: `md-template-lint.yml` [content:non-empty]

The config file: keys, defaults, validation and path rules.

## 7. CLI [content:non-empty]

Flags, arguments, exit codes and paths.

## 8. Output [content:non-empty]

The output formats and their exact layout.

## 9. Rule categories [content:non-empty]

One part per category of rules, with its range of codes.

## 10. Assumptions [content:non-empty]

- AS1: a fact taken as true without proof, and what changes if it is false.

## 11. Behaviour notes and changes beyond D01 to D18 [content:non-empty]

Kept quirks and other changes, one id each.

## Authoring checklist [presence:template-only]

- Save as `docs/spec.md`. Keep the frontmatter and refresh `last_updated` on
  every change.
- This is the project variant of `generic/spec-technical.template.md`: the
  sections are the numbered sections of this repository's specification, matched
  by exact text and order. H3 headings (`2.1`, `2.2` ...) are free.
- The `Summary` block with its `omit in toc` markers is optional. Its list is
  maintained by the Markdown All in One extension, not by hand.
- Headings are matched by exact level and exact text, in template order. Insert
  no section between two template sections; add your own after the last one
  (a warning, not an error).
- Template tags appear in the file only inside inline code or fenced code, so
  the file is never parsed as a template.
- Delete this section and every `[tag:...]` marker before saving.
