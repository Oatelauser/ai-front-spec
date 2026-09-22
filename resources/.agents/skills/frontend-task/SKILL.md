---
name: frontend-task
description: Execute new or incremental frontend work from screenshots, prototypes, HTML, Figma, API documents, or requirements using project facts and responsive acceptance.
---

# Frontend Task

Use for frontend pages, components, responsive changes, visual reproduction, and frontend API integration.

## Command interface

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

The default flow is `inspect -> plan -> high-impact decision check -> confirm when needed -> implement -> verify -> report`. Stage commands remain independently callable for recovery and acceptance.

## Required behavior

1. Before every stage, read `AGENTS.md`, `docs/PROJECT_PROFILE.md` (including `支持端与运行环境`), `.codex/profile-state.json` (`deliveryTargets`), the task contract, frontend guidance, conventions, and `docs/AI_COMPONENT_CATALOG.md`. Load only the source-specific reference that matches the input.
2. Inspect the repository and task evidence before planning. Screenshots, prototypes, HTML, Figma, API documents, and requirements are recorded as task evidence; project facts still come from the repository and profile.
3. If profile facts, `deliveryTargets`, or component-catalog facts are missing, draft, deferred, or conflicted, identify whether the gap has high impact. Never force profile completion and never silently invent framework, route, API, permission, target, component variant, or acceptance facts. For `deliveryTargets` gaps (missing, conflicted, deferred, or page declarations exceeding the confirmed set), route to `$project-profile update` with no task-scoped bypass — expanding targets requires the update interview and matrix re-check. For component-catalog conflicts with the profile, prompt the user to run `$project-profile` or provide a task-scoped override.
4. When the user provides a visible UI reference such as a screenshot, prototype, or HTML, record its path or URL, version/date when available, and the affected acceptance criteria in `docs/tasks/<task>/`.
5. Implement using the confirmed framework and existing components. Keep mocks and assumptions explicitly labeled. Re-read target-relevant component entries before implementation; record reuse, extension, business-domain, or page-private decisions.
6. Verify the target types declared by `deliveryTargets` plus responsive, theme, interaction, keyboard, accessibility, overflow, console, and API states required by the profile and component catalog. Missing real-browser evidence remains unverified.
7. Persist complex-task evidence as `docs/tasks/<task>/STATE.json` and `ACCEPTANCE.md`; keep simple changes lightweight.

Read `references/common-workflow.md`, `references/acceptance-matrix.md`, and `references/task-state.md` before implementation or verification.

The component catalog is a continuous constraint, not an inspect-only reference: `inspect`, `plan`, `implement`, `verify`, and `report` must use target-relevant entries and surface catalog/profile conflicts.
