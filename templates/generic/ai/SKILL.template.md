---
# [unique-headings-names]
name: short-skill-name # [presence:required] [format:kebab-case]
description: What the skill does and when to load it # [presence:required]
compatibility: opencode # [presence:optional]
---

# Skill title [pattern:"{text}"]

One sentence: the skill in plain words.

## When to use [content:non-empty]

The triggers: the requests, files or situations that should load this skill. Say
what it is NOT for, and name the neighbouring skill that covers that case.

## Steps [content:list]

1. First action, with the exact command or file to touch.
2. Second action.
3. Check the result and report it.

## Resources [presence:optional] [content:non-empty] [content:list]

- `scripts/example.ts`: what it does and how to run it.
- `references/example.md`: when to read it.

## Notes [presence:optional] [content:non-empty]

Limits, known gaps or follow-ups.

## Authoring checklist [presence:template-only]

- Save as `.opencode/skills/<name>/SKILL.md`; `name` equals the folder name
  (kebab-case).
- `description` is what the agent reads to decide whether to load the skill.
  Put the triggers in it, in one or two sentences.
- Keep the body short. Move long material to `references/` and link it from
  Resources.
- Resources is optional: delete it when the skill has no extra file. Check each path.
- Headings are matched by exact level and exact text, in template order. Insert
  no section between two template sections; add your own after the last one (a
  warning, not an error). Delete the optional sections you do not need.
- Delete this section and every `[tag:...]` marker before saving.
