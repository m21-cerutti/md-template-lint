---
status: "draft | accepted | rejected"
spaced: "a  |  b  |  c"
single_option: "only | "
leading_separator: " | a | b"
numeric_options: "1 | 2 | 3"
unicode_options: "été | hiver"
inner_pipe: "a|b | c"
hinted: "draft | accepted" # type=enum
optional_member: "a | b" # [presence:optional]
conditional_member: "a | b" # [presence:conditional:when risky]
bare_hint: "x" # type=enum
list_template_value: [" | ", "x"] # type=enum
mapping_template_value: {a: " | "} # type=enum
empty_template_value: # type=enum
pipe_without_spaces: "a|b" # type=enum
note: "x" # type=string
piped_string: "a | b" # type=string
piped_int: "1 | 2" # type=int
piped_url: "a | b" # type=url
piped_path: "a | b" # type=path
piped_alias: "a | b" # type=path-alias
count: "3" # type=int
ratio: "1.5" # type=float
draft_flag: "true" # type=bool
tags: "x" # type=list
meta: "x" # type=nested-map
blank_value: "a | b"
spaces_only: "a | b"
empty_list: "a | b"
missing_key: "a | b"
---
