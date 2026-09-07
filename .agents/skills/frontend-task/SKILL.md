---
name: frontend-task
description: Execute new or incremental frontend work from screenshots, prototypes, HTML, Figma, API documents, or raw requirements using project facts, routed references, tests, and responsive UI acceptance.
---

# Frontend Task

Use for frontend pages, components, responsive changes, visual reproduction, and frontend API integration in the current repository. Missing project rules or PROJECT_PROFILE.md routes to `$bootstrap-project` in this same root. When application creation is requested, continue authorized scaffolding and frontend work after the preparation steps; bundled template resources are not a reason to move work to another project.

## Command interface

`$frontend-task` is the frontend executioner behind `$project-workflow`. It supports one default routed flow and independently resumable stage subcommands. Read [subcommands](references/subcommands.md) and [task state](references/task-state.md) before selecting or executing a stage.

```text
$frontend-task
$frontend-task inspect
$frontend-task plan
$frontend-task confirm
$frontend-task implement
$frontend-task verify
$frontend-task report
$frontend-task resume [--from=<stage>]
```

Stages may be composed in dependency order, for example `inspect plan` or `inspect plan implement verify report`. The default implementation request runs `inspect → plan → high-impact decision check → confirm when needed → implement → verify → report`. It must always perform the high-impact check; “direct implementation” does not bypass it.

Use [task records](references/task-state.md) for persistent tasks. Create `docs/tasks/<task-id>/` when the task has visual materials, multi-round planning, cross-session recovery, complex implementation or formal acceptance evidence. Keep simple one-off changes lightweight, but preserve their acceptance evidence.

1. Read target [AGENTS](../../../AGENTS.md), [project profile](../../../docs/PROJECT_PROFILE.md), [task contract](../../../docs/AI_TASK_CONTRACT.md), [frontend task](../../../docs/AI_FRONTEND_TASK.md), [conventions](../../../docs/FRONTEND_CONVENTIONS.md), and [component catalog](../../../docs/AI_COMPONENT_CATALOG.md).
2. Load $project-workflow for repository facts and engineering boundaries. If that workflow already routed here, continue without recursively restarting it. Read its [capability routing](../project-workflow/references/task-routing.md), then [source routing](references/source-routing.md) for matching input workflows only.
3. Apply [shared execution](references/common-workflow.md), including evidence priorities and existing authorization. Read `$bootstrap-project`'s [subcommands](../bootstrap-project/references/subcommands.md) and [state model](../bootstrap-project/references/state-model.md) when profile state is missing, draft, pending or conflicted. For gaps that affect the current task, prompt the user to either run the relevant profile subcommand or continue with an explicit task-scoped override; never force profile completion and never silently invent facts. Complete unresolved design/API confirmation points before dependent code; do not repeatedly ask about already confirmed decisions. When `plan` is selected, use the round-based frontier interview in [subcommands](references/subcommands.md), similar to `$grill-me`.
4. Use project commands and relevant TDD/security/API/UI skills. Validate with [acceptance matrix](references/acceptance-matrix.md) and report using [acceptance evidence](../../../docs/AI_ACCEPTANCE_EVIDENCE.md). Report profile status, ignored high-impact gaps, mocks/assumptions and verification scope alongside the feature result. Missing Browser evidence remains unverified, even when screenshots or static checks pass. Persist final task evidence in `ACCEPTANCE.md` and structured state in `STATE.json` when a task record exists.
