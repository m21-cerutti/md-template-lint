---
ascending_iso: [2026-01-01, 2026-02-01, 2026-03-01]
equal_dates: [2026-01-01, 2026-01-01, 2026-01-01]
marker_last: [2026-01-01, present]
marker_ties_max_date: [present, "9999-12-31", PRÉSENT]
slash_forms: [01/01/2026, 15/01/2026, 01/02/2026]
mixed_forms_and_partial_dates: [2026, 2026-01-15, 15/01/2026, 2026-02, 01/03/2026]
year_dominates_month_and_day: [2025-12-31, 2026-01-01]
partial_dates_equal_their_first_day: [2026-01-01, 2026, 2026-02-01, 2026-02, 2026-03, 2026-03-01]
padded_items: [" 2026-01-01 ", "\x852026-02-01"]
padded_markers_tie: [2026-01-01, " present ", " PRÉSENT ", "\tprésent\n"]
invalid_items_skipped: [2026-01-01, abc, 2026-13-40, "31/02/2020", "2025-02-29", "", 2026-02-01, "\uFEFF2026-01-01"]
nested_items_skipped: [2026-01-01, [2020-01-01], {k: 2019-01-01}, 2026-02-01]
single_item: [2026-05-01]
hinted_list: [2026-01-01, 2026-02-01]
string_list: [2026-03-01, 2026-01-01]
scalar_date: 2026-03-01
untagged_dates: [2026-03-01, 2026-01-01]
count_tag_guard: [2026-03-01, 2026-01-01]
scalar_on_list_field: 2026-03-01
mapping_on_list_field:
  key: 2026-01-01
empty_list: []
blank_value:
---
