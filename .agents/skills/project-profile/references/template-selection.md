# Template Selection

Always present all three candidates:

| Template | Meaning |
| --- | --- |
| `generic` | Framework-neutral project facts |
| `react` | React project facts and React-specific defaults |
| `vue` | Vue project facts and Vue-specific defaults |
| `defer` | Keep a minimal neutral draft and ask again later |

A recommendation is not a selection. Framework evidence can recommend a template, but only an explicit user choice creates `user-confirmed` selection. When evidence disagrees with the selected template, report `conflict` and ask whether to migrate or retain the current profile.

After an explicit selection, immediately run the `$grill-me` interview skill ([SKILL.md](../../grill-me/SKILL.md)) over the current decision frontier; every round must show the remaining frontier. Scan the selected template and the materialized `docs/PROJECT_PROFILE.md` for every `<待填写...>` placeholder. Do not stop after reporting only high-impact fields: low-impact placeholders must be answered, marked `无`/`不适用`, or recorded as `deferred` with a reason, impact, and follow-up condition.
