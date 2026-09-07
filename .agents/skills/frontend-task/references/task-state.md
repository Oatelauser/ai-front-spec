# Frontend task records and state

Persist complex, visual, multi-round or resumable work under `docs/tasks/<task-id>/`:

```text
TASK.md         user request, original text and structured summary
PLAN.md         decisions, rounds, sources, scope and implementation plan
STATE.json      machine state, fingerprints, stage outputs and overrides
ACCEPTANCE.md   task-local verification and delivery evidence
assets/         copied local screenshots, prototypes or HTML when required
```

Create only the files needed by the task. Visual inputs (screenshots, prototypes or HTML) are copied to `assets/` when supplied as local materials; Figma and other external sources retain URL/node/version/read evidence rather than copying the external document wholesale. Always record source path/URL, version, read time, viewport/DPR and summary.

## State schema

```json
{
  "schemaVersion": 1,
  "taskId": "user-detail-page",
  "taskType": "new-page",
  "taskStatus": "awaiting-confirmation",
  "currentStage": "plan",
  "sourceStatus": {},
  "plan": {
    "revision": 1,
    "fingerprint": "...",
    "confirmation": "pending"
  },
  "stages": {},
  "overrides": []
}
```

Allowed task statuses are `draft`, `planned`, `awaiting-confirmation`, `implementing`, `partially-complete`, `verifying`, `partially-verified`, `completed`, `blocked` and `failed`. Source statuses are `unresolved`, `analyzed`, `changed`, `unavailable` and `conflict`.

Each stage record contains `status`, `inputFingerprint`, `planId`, `lastRun`, `changedFiles`, `reusedFiles`, `conflicts` and `confirmation`. Overall status is computed from stage results: unresolved high-impact decisions produce `awaiting-confirmation`; partial implementation or verification produces the corresponding partial state; any required-stage failure produces `failed`.

The plan fingerprint covers the task goal/type, relevant source files and configuration, profile summary, source paths/URLs/versions/read evidence and plan revision. Only changes affecting the task invalidate the plan. `resume` must stop and request `inspect/plan` when the fingerprint is stale; it may continue independent stages.

`user_override` is limited to the current task and plan. It records the missing fact, impact, temporary assumption/mock boundary, user decision and follow-up condition. It never changes the project profile's confirmed facts.
