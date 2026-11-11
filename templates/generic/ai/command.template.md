---
# [filename:case:kebab-case]
description: One line shown in the command list # [presence:required]
agent: agent-name # [presence:optional]
model: provider/model-id # [presence:optional] [string]
---

# /command-name [pattern:"{text}"]

One sentence: what the command does.

## Usage [content:non-empty]

```text
/command-name [arguments]
```

- `arguments` (optional): what the user may pass and its default.

## Prompt [content:non-empty]

Do the task for `$ARGUMENTS`. If `$ARGUMENTS` is empty, use the default
described in Usage.

1. First step the agent runs.
2. Second step.
3. Report the result in the format the caller expects.

## Examples [presence:optional] [content:non-empty]

```text
/command-name
/command-name some-argument
```

## Authoring checklist [presence:template-only]

- Save as `.opencode/commands/short-name.md` (kebab-case); the file name is the
  command name.
- `agent` and `model` are optional; leave them out to run with the current
  ones.
- The Prompt section is what the agent receives. Write `$ARGUMENTS` where the
  user text goes; use `$1`, `$2` for single positional values.
- Keep the prompt to one job. Chain several jobs with a skill, not a long prompt.
- Delete this section and every `[tag:...]` marker before saving.
