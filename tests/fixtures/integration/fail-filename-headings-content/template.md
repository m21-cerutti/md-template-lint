---
# [filename:case:kebab-case]
slug: "string" # [presence:required] [format:kebab-case] [value:filename]
owner: "string" # [presence:optional]
reviewer: "string" # [nope:y] [presence:optional]
tags: ["a"] # [count:min:1] [count:max:3] [format:elements:kebab-case]
rating: "3" # type=int [range:min:1] [range:max:5]
status: "draft | accepted" # [presence:optional]
milestones: ["2026-01", "2026-06"] # [order:ascending]
homepage: "https://example.org" # [format:scheme:https] [io:exists]
---

# Release notes

## Changes [pattern:"{text}"] [content:table]

## Overview [presence:required] [content:non-empty]

## Steps [content:list] [content:max-lines:3]

## Summary

## Authoring checklist [presence:template-only]
