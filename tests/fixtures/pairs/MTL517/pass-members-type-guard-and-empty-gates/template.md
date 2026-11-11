---
status: "draft | accepted | rejected"
spaced: "a  |  b  |  c"
single_option: "only | "
leading_separator: " | a | b"
numeric_options: "1 | 2 | 3"
unicode_options: "été | hiver"
inner_pipe: "a|b | c"
hinted: "draft | accepted" # [enum]
optional_member: "a | b" # [presence:optional]
conditional_member: "a | b" # [presence:conditional:when risky]
bare_hint: "x" # [enum]
list_template_value: [" | ", "x"] # [enum]
mapping_template_value: {a: " | "} # [enum]
empty_template_value: # [enum]
pipe_without_spaces: "a|b" # [enum]
note: "x" # [string]
count: "3" # [int]
ratio: "1.5" # [float]
draft_flag: "true" # [bool]
tags: "x" # [list]
meta: "x" # [nested-map]
blank_value: "a | b"
spaces_only: "a | b"
empty_list: "a | b"
missing_key: "a | b"
---
