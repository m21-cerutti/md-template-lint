---
title: Product specification  # [presence:required]
last_updated: 2026-10-29  # [presence:required] [format:date] type=date
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

| Term | Meaning                                       |
| ---- | --------------------------------------------- |
| Term | One sentence, the same meaning everywhere.    |

## Users [content:list]

- User role: what they need and what they do with the product.

## Feature areas [content:non-empty]

One block per area: what the user can do, in plain words. Give each area a short
name and a stable id (`F1`, `F2`) so other documents can cite it.

## Scenarios [content:non-empty]

Short end-to-end stories that cross feature areas: who starts, what they do,
what they get.

## Non-functional requirements [content:list]

- Quality target as a checkable statement (speed, safety, privacy, accessibility).

## Out of scope [content:list]

- Something this product deliberately does not do.

## Deferred [presence:optional] [content:list]

- Something wanted later, with the reason it waits.

## Authoring checklist [presence:template-only]

- Save as `docs/spec-product.md` (the technical spec is `docs/spec.md`). Keep the frontmatter and refresh
  `last_updated` on every change.
- Describe behaviour and outcomes only. Name no framework, file or library.
- Keep the section order above; drop no required heading, write "None." instead.
- Link ADRs and the architecture document from the sections that depend on them.
- Delete this section and every `[tag:...]` marker before saving.
