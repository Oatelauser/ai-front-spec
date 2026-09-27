# Task Guides

This directory is the operational manual for design and development tasks. The root `README.md` is navigation only; agent execution still follows `.agents/skills/` and the project profile.

## Choose an entry point

| Goal | Entry point | Next step |
| --- | --- | --- |
| One-off interaction or direction experiment | `$prototype` | Decide whether to enter development |
| Professional visual design, iteration, and freeze | `$design-task` | Read [DESIGN-TASK.en.md](DESIGN-TASK.en.md) |
| Implement from requirements, screenshot, prototype, Figma, HTML, or API | `$frontend-task` | Read [FRONTEND-TASK.en.md](FRONTEND-TASK.en.md) |
| Implement an approved design | `$design-task` → `$frontend-task` | Finish visual handoff, then implement |

## Shared lifecycle

```text
Read project facts → classify task and sources → record gaps
→ plan → confirm high-impact decisions → implement
→ verify → report evidence
```

## Frontend hard gate

Before `inspect`, and throughout `plan`, `implement`, `verify`, and `report`, read:

- `AGENTS.md`
- the support/runtime section of `docs/PROJECT_PROFILE.md`
- `deliveryTargets` in `.toolkit/profile-state.json`
- `docs/rules/AI_COMPONENT_CATALOG.md`
- `docs/rules/AI_FRONTEND_TASK.md`
- the matching `frontend-task/references/*.md`

If `deliveryTargets` is missing, conflicted, or `deferred`, do not guess the target; route to `$project-profile update`.

## Task types

- `new-page`: settle flow, route, states, API, permissions, components, and targets first.
- `incremental`: isolate the changed region and protect neighboring behavior.
- `bug-fix`: reproduce, fix, replay the original failure and adjacent normal paths.
- `refactor`: prove route, behavior, data, permission, state, and visual equivalence; reclassify if behavior changes.

## Task records

Persist complex, visual, multi-round, or resumable work under `docs/tasks/<task>/`:

```text
PLAN.md STATE.json PROMPTS.md ACCEPTANCE.md REPORT.md
```

Do not create empty records for simple tasks.
