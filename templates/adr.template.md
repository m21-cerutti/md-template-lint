---
# [filename:case:kebab-case]
id: 0000-record-template  # [presence:required] [value:filename] [format:kebab-case]
title: Short imperative statement of the decision  # [presence:required]
status: proposed | accepted | superseded | deprecated  # [presence:required]
date: 2026-10-29  # [presence:required] type=date
deciders: [Name]  # [presence:required] [count:min:1]
supersedes: 0000-other-record  # [presence:optional]
---

# ADR [presence:exist]

One-sentence restatement of the decision, readable on its own.

## Context [content:non-empty]

Forces at play: constraints, existing code to reuse, scale figures, prior art,
what breaks if nothing is decided. State facts, not preferences.

## Decision [content:non-empty]

What was chosen, in the present tense: "The backend uses X."
Include the concrete shape (names, folders, protocols) that follows from it.

## Consequences [content:list]

- Positive consequence.
- Negative consequence or accepted cost.
- Follow-up work this decision creates.

## Alternatives considered [content:table]

| Option          | Pros                | Cons          | Verdict  |
| --------------- | ------------------- | ------------- | -------- |
| Chosen option   | why it wins         | what it costs | Chosen   |
| Rejected option | what was attractive | why it lost   | Rejected |

## Authoring checklist [presence:template-only]

- Save as `docs/adr/NNNN-short-title.md`; `id` equals the filename stem.
- `status` starts at `proposed`; flip to `accepted` once the decision is live.
- When this record replaces an older one, set `supersedes` and flip the old
  record to `superseded`.
- Keep at least one rejected option: an ADR with a single option documents
  nothing.
- Delete this section and every `[tag:...]` marker before saving.
