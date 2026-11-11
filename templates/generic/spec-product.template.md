---
# [unique-headings-names]
title: Product specification # [presence:required]
last_updated: 2026-10-29 # [presence:required] [format:date] [date]
---

# Specification title [pattern:"{text}"]

What the product does and for whom, never how it is built. The how lives in the
technical spec and the architecture document.

## Purpose [content:non-empty]

One short paragraph: the problem, the audience, and the value delivered.

## Principles [content:list]

- Principle one, as a rule a reader can check a feature against.
- Principle two.

## Vocabulary [content:table]

| Term | Meaning                                    |
| ---- | ------------------------------------------ |
| Term | One sentence, the same meaning everywhere. |

## Users [content:list]

- User role: what they need and what they do with the product.

## Feature areas [content:non-empty]

One H3 per area: what the user can do, in plain words. Give each area a short
name and a stable id (`F1`, `F2`) so other documents can cite it.

### F1 — Area name [pattern:"F{digits} — {text}"] [repeat-rules:same-level] [order:first:number:ascending] [content:non-empty]

What the user can do in this area, in one or two sentences.

## Scenarios [content:non-empty]

One H3 per story that crosses feature areas: who starts, what they do, what
they get. Give each a stable id (`S1`, `S2`).

### S1 — Scenario name [pattern:"S{digits} — {text}"] [repeat-rules:same-level] [order:first:number:ascending] [content:non-empty]

Who starts, what they do and what they get, naming the areas (`F1`) it uses.

## Non-functional requirements [content:list]

- Quality target as a checkable statement (speed, safety, privacy, accessibility).

## Out of scope [content:list]

- Something this product deliberately does not do.

## Deferred [presence:optional] [content:list]

- Something wanted later, with the reason it waits.

## Authoring checklist [presence:template-only]

- Save as `docs/spec-product.md` (the technical spec is `docs/spec.md`). Keep
  the frontmatter and refresh `last_updated` on every change.
- Describe behaviour and outcomes only. Name no framework, file or library.
- Feature areas and scenarios are H3 items: `### F1 — Name` and `### S1 — Name`.
  Ids rise with each item, at least one of each, and stay stable once other
  documents cite them. Repeat the item block for every area and scenario.
- Headings are matched by exact level and exact text, in template order. Insert
  no section between two template sections; add your own after the last one (a
  warning, not an error). Delete the optional sections you do not need.
- Drop no required heading. For an empty required list write `- None.`; for an
  empty table write `None.` in the first cell.
- Link ADRs and the architecture document from the sections that depend on them.
- Delete this section and every `[tag:...]` marker before saving.
