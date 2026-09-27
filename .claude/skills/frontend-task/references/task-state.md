# Frontend task records and state

Persist complex, visual, multi-round or resumable work under `docs/tasks/<task-id>/`:

```text
TASK.md         user request, original text and structured summary
PLAN.md         decisions, rounds, sources, scope and implementation plan
STATE.json      machine state, fingerprints, stage outputs and overrides
ACCEPTANCE.md   task-local verification and delivery evidence
assets/         copied local screenshots, prototypes, HTML or supplied assets when required
```

Create only the files needed by the task. Always record source path/URL, version/read time, viewport/CSS viewport/DPR when known, browser/state, affected regions, and summary. Figma and external sources retain URL/node/version/read evidence rather than copying the external document wholesale.

## State schema

```json
{
  "schemaVersion": 2,
  "taskId": "user-detail-page",
  "taskType": "new-page",
  "impactModes": ["visual", "behavior", "compatibility"],
  "taskStatus": "awaiting-confirmation",
  "currentStage": "plan",
  "sourceStatus": {
    "screenshot": "analyzed",
    "api": "analyzed"
  },
  "sources": [],
  "sourcePriority": {
    "visual": "screenshot",
    "behavior": "prototype",
    "data": "api"
  },
  "targets": {
    "sourceViewport": [],
    "confirmed": [],
    "derived": [],
    "unverified": []
  },
  "assets": [],
  "componentDecisions": [],
  "stateCoverage": [],
  "acceptance": {
    "visual": "unverified",
    "behavior": "unverified",
    "data": "unverified",
    "engineering": "unverified"
  },
  "plan": {
    "revision": 1,
    "fingerprint": "...",
    "confirmation": "pending"
  },
  "stages": {},
  "overrides": []
}
```

Allowed task statuses are `draft`, `awaiting-confirmation`, `done` and `failed`. `sourceStatus` may use `analyzed`, `changed`, `unavailable` or `unverified`. Each stage record contains `status`, `lastRun` and free-form `notes`.

The plan fingerprint covers task goal/type, impact modes, relevant source files/configuration, profile summary, source paths/URLs/versions/read evidence, target declarations, component decisions and plan revision. Only task-relevant changes invalidate the plan. `resume` must stop and request `inspect/plan` when the fingerprint is stale; it may continue independent stages.

`user_override` is limited to the current task and plan. It records the missing fact, impact, temporary assumption/mock boundary, user decision and follow-up condition. It never changes the project profile's confirmed facts.

## Required records

For visual work, `assets` should distinguish project assets, supplied assets, licensed external assets, placeholders and unresolved items. For API work, `stateCoverage` should map UI states to request states. For refactors, record the equivalence claims and their evidence. For bug fixes, record reproduction and replay evidence.

A task is not complete merely because a build, screenshot, HTTP 200, mock, or tool call succeeded. `ACCEPTANCE.md` must separately report the status and evidence for `visual`, `behavior`, `data`, and `engineering`, plus unverified targets and unresolved assumptions.
