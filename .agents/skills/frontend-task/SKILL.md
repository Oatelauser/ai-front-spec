---
name: frontend-task
description: Execute frontend pages, components, responsive changes, visual reproduction, and API integration from screenshots, prototypes, HTML, Figma, API documents, or requirements. Use when a frontend task needs inspection, planning, implementation, verification, or delivery evidence.
---

# Frontend Task

Use for frontend pages, components, responsive changes, visual reproduction, frontend API integration, and internal refactors.

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

## Task model

Keep exactly four task types:

- `new-page`: add a route, page, or complete page-level experience.
- `incremental`: change an existing page or component while preserving unaffected behavior.
- `bug-fix`: fix a reproducible defect; reproduction precedes implementation.
- `refactor`: change internal structure while preserving the external route, behavior, data contract, permission semantics, and visual baseline unless the user explicitly changes scope.

Record independent impact modes instead of creating more task types:

- `visual`: layout, typography, tokens, assets, theme, or visual baseline changes.
- `behavior`: navigation, interaction, state transitions, form behavior, or user-visible actions.
- `data`: requests, fields, caching, persistence, permissions, or API error semantics.
- `structure`: component boundaries, routes, build entry, dependencies, or internal architecture.
- `compatibility`: responsive targets, WebView/mobile constraints, browser behavior, keyboard, touch, or accessibility.

A task may have several impact modes. `refactor` that changes visual, behavior, data, route, permission, or public component contracts is no longer a pure refactor; classify the changed scope as `incremental` or stop for high-impact confirmation.

## Source and evidence model

Classify the task type from the requested outcome, then classify every source independently as `screenshot`, `prototype`, `html`, `figma`, `api`, or `requirement`. A source is evidence, not an automatic project fact.

Record, when applicable:

- source path or URL, version/date, read time, viewport, CSS viewport, DPR, browser and state;
- adopted, excluded, or unresolved sources and the reason;
- affected routes, regions, states, and acceptance criteria;
- assets, fonts, icons, licenses, dimensions, crop behavior, alt text, and fallback status;
- confirmed, derived, and unverified delivery targets.

Use source responsibility rather than file-format precedence:

- engineering facts: repository, tests, config, and project profile;
- business/data facts: trusted requirements, API contracts, and server behavior;
- visual facts: the explicitly selected current visual source, bound by region and state;
- behavior facts: interactive prototypes or existing runnable behavior;
- generated code and AI suggestions: implementation references only.

When sources conflict, record the region/field, source A/B, impact, recommended resolution, and unresolved decision. Default resolution is: newer user-selected visual source for visual regions, trusted API/server behavior for data and permission semantics, and existing runnable behavior for preserved behavior. Do not apply a global “Figma always wins” or “screenshot always wins” rule.

## Required behavior

1. Before every stage, read `AGENTS.md`, `docs/PROJECT_PROFILE.md` (including `支持端与运行环境`), `.toolkit/profile-state.json` (`deliveryTargets`), the task contract, frontend guidance, conventions, and `docs/rules/AI_COMPONENT_CATALOG.md`. Load only the source-specific reference that matches the input.
2. Inspect the repository and task evidence before planning. Determine `taskType`, `impactModes`, source responsibility, target routes, and high-impact gaps before implementation.
3. If profile facts, `deliveryTargets`, or component-catalog facts are missing, draft, deferred, or conflicted, identify whether the gap has high impact. Never force profile completion and never silently invent framework, route, API, permission, target, component variant, or acceptance facts. For `deliveryTargets` gaps (missing, conflicted, deferred, or page declarations exceeding the confirmed set), route to `$project-profile update` with no task-scoped bypass.
4. When a visible UI reference is provided, record its path or URL, version/date, source viewport/CSS viewport/DPR when known, affected regions/states, and acceptance criteria. For screenshots, inspect actual image dimensions and preserve the original baseline.
5. For image-based work, build an asset inventory and separate project assets, supplied assets, licensed external assets, temporary placeholders, and unresolved assets. Implement text and controls as real DOM/UI, not a screenshot background or flattened interaction.
6. Plan and implement with the confirmed framework and existing components. Record each region as reuse, extension, business-domain, or page-private. Record mock boundaries and assumptions explicitly.
7. For API work, map UI states to request states and verify loading, empty, error, unauthorized/forbidden, disabled, success, retry, and stale-response behavior when applicable. HTTP 200 alone is not business success.
8. For `bug-fix`, reproduce before changing code and replay the original failure plus adjacent normal paths after the fix. If the defect cannot be reproduced, report it as unconfirmed rather than complete.
9. For `refactor`, prove external equivalence across route, behavior, data, permissions, states, and visual baseline. If equivalence is not the goal, reclassify the changed scope.
10. Verify confirmed target types plus responsive, theme, interaction, keyboard, accessibility, overflow, console, and API states required by the profile and component catalog. Separate `visual`, `behavior`, `data`, and `engineering` completion status.
11. Persist complex, visual, multi-round, or resumable work under `docs/tasks/<task>/`; keep simple changes lightweight.

Read `references/common-workflow.md`, `references/acceptance-matrix.md`, and `references/task-state.md` before implementation or verification.

The component catalog is a continuous constraint: `inspect`, `plan`, `implement`, `verify`, and `report` must use target-relevant entries and surface catalog/profile conflicts.

