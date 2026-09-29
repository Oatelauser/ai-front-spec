# Frontend Task Guide

`$frontend-task` is the main path from requirements, screenshots, prototypes, Figma, HTML, or API material to an engineered page. It organizes facts, implementation, and verification; it does not replace the project profile, API contracts, permission rules, or existing components.

## 1. Task classification

| Type | Focus |
| --- | --- |
| `new-page` | Flow, route, states, API, permissions, targets, components |
| `incremental` | Changed region, preserved behavior, adjacent regression |
| `bug-fix` | Reproduction, root cause, smallest fix, replay |
| `refactor` | External equivalence; reclassify if behavior or visual scope changes |

Classify every source as `screenshot`, `prototype`, `html`, `figma`, `api`, or `requirement`, and state whether it owns visual, behavior, business, or engineering facts.

## 2. Prerequisites

Before `inspect`, and throughout later stages, read:

```text
AGENTS.md
docs/PROJECT_PROFILE.md
.toolkit/profile-state.json → deliveryTargets
docs/rules/AI_COMPONENT_CATALOG.md
docs/rules/AI_FRONTEND_TASK.md
```

Also inspect current changes, route entry points, neighboring pages, shared components, request client, theme/i18n, tests, and CI. Never guess missing, conflicted, or deferred targets.

## 3. Stage operations

### `inspect`

Confirm task type, route, source version/viewport/DPR, impact modes, fact gaps, assets, component boundaries, and completion criteria. Output a fact list and source responsibilities.

### `plan`

Plan files, component reuse/extension/private boundaries, state matrix, API mapping, permission semantics, responsive behavior, and acceptance matrix. For complex work create `docs/tasks/<task>/PLAN.md` and `STATE.json`.

### `confirm`

Confirm high-impact decisions: scope, targets, visual baseline, route, shared components, API/permissions, states, assets, and acceptance. Do not implement unresolved high-impact decisions.

### `implement`

Add focused failing tests when the project stack permits, then implement real DOM/UI, data, and interaction. Cover loading, empty, error, unauthorized/forbidden, disabled, success, retry, and stale responses when applicable. Do not use screenshots as backgrounds or mocks as real integration.

### `verify`

Run tests directly related to the change, then the project quality gates. Verify targets, responsive behavior, theme, interaction, keyboard, accessibility, overflow, console, and API states. In non-production, verify the real UI main flow, failure, permission, and refresh persistence when applicable. When reporting issues, if you would rather point than describe, say "let me mark the page" to use `$page-annotate`: you box problem areas on the page and submit, and the agent reads back coordinates with element diagnostics and fixes them one by one (see [Built-in capabilities](../operations/BUILT-IN-CAPABILITIES.en.md)).

### `report`

Report changed files, actual commands, routes, actions, API/permission evidence, visual deviations, unverified items, and blockers. Separate:

```text
visual: passed / failed / unverified
behavior: passed / failed / unverified
data: passed / failed / unverified
engineering: passed / failed / unverified
```

### `resume`

Resume interrupted work with `--from=<stage>`. If the fact fingerprint is stale, return to `inspect` or `plan` first.

## 4. Common calls

```text
$frontend-task inspect --source=requirement --type=new-page
$frontend-task plan
$frontend-task confirm
$frontend-task implement
$frontend-task verify
$frontend-task report
```

Calling `$frontend-task` without a stage is also supported; it routes through the stages and stops for unresolved high-impact confirmation.

## 5. Source combinations

| Combination | Responsibility |
| --- | --- |
| Screenshot + prototype | Prototype owns flow; screenshot owns appearance |
| Screenshot + API | Screenshot owns visual; API owns fields, requests, and states |
| Prototype + API | Prototype owns demonstrated flow; API owns real submission semantics |
| HTML + screenshot | HTML provides structure clues; screenshot provides visual baseline |
| Figma + screenshot | Bind by version, region, and state; record conflicts first |
| Frozen Stitch design + code | Stitch owns visual facts; code/contracts own engineering and business facts |

## 6. Scenario playbook

### New page

Settle flow, states, route, API, permissions, targets, and component boundaries. Without visual reference, use `$prototype` for fast direction or `$design-task` for professional design; implement after the baseline is confirmed.

### Screenshot reproduction

Preserve source dimensions, CSS viewport, DPR, browser, and state. Build an asset inventory, implement real DOM, and compare screenshots at the same viewport; do not pile up absolute positioning from pixels alone.

### Stitch prototype

Read the frozen HTML, screenshot, metadata, assets, and `CONTRACT.md`. Validate `downloadUrl` with manual redirects and body checks; on failure use an authorized browser or web ZIP, and never present an old snapshot as a new download.

### API page

Read the API contract and existing request layer first. Map fields and request states, then verify loading, empty, error, unauthorized/forbidden, disabled, success, retry, and stale responses.

### Bug fix

Reproduce and record actual/expected behavior, locate the root cause, make the smallest fix, and replay the failure plus adjacent normal paths. If it cannot be reproduced, report it as `unverified`.

### Refactor

Prove route, behavior, data, permission, state, and visual equivalence. If the scope includes change, reclassify as `incremental`.

## 7. Task records

For complex work, use as needed:

```text
docs/tasks/<task>/PLAN.md
                          STATE.json
                          PROMPTS.md
                          ACCEPTANCE.md
                          REPORT.md
```

Do not create empty records for simple tasks.
