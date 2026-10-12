# Frontend task records and state

Persist complex, multi-round or resumable work, or work needing retained source comparison or formal acceptance, under `docs/tasks/<task-id>/` (visual impact alone does not force this directory — see common-workflow.md §0; visible changes still produce actual UI evidence):

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
  "acceptanceEvidence": {
    "visual": [],
    "behavior": [],
    "data": [],
    "engineering": []
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

Allowed task statuses are `draft`, `awaiting-confirmation`, `done` and `failed`. `sourceStatus` may use `analyzed`, `changed`, `unavailable` or `unverified`. Each stage record contains `status`, `lastRun` and free-form `notes`. `schemaVersion` is currently `2`; legacy records still at `1` remain valid (the validator accepts both), and the JSON example above plus the template are checked against the validator by regression tests.

`acceptance` is itself optional; each dimension reports `passed`, `failed` or `unverified`. `acceptanceEvidence` is optional and keys to the same four dimensions as `acceptance`; each dimension holds an array of `{path, sha256}` references — a repository-relative path to a regular file (forward slashes) plus the lowercase 64-hex SHA-256 of its current bytes. An explicit `passed` must carry at least one non-empty referenced file whose bytes still match the recorded hash; absolute paths, traversal outside the repository root, links, missing, empty or unreadable files and stale hashes are rejected. A matching hash only proves the file exists and has not drifted — it does not certify the finding itself. `done` closes execution only, so `done` with `unverified` dimensions is valid and claims no pass; historical records without an acceptance block remain valid, and an old explicit `passed` without retained evidence must be re-evidenced or honestly downgraded to `unverified`. Keep not-applicable, waived or blocked dimensions, with reasons, in `ACCEPTANCE.md` — no extra status word is added for them.

The plan fingerprint covers task goal/type, impact modes, relevant source files/configuration, profile summary, source paths/URLs/versions/read evidence, target declarations, component decisions and plan revision. Only task-relevant changes invalidate the plan. `resume` must stop and request `inspect/plan` when the fingerprint is stale; it may continue independent stages.

`user_override` is limited to the current task and plan. It records the missing fact, impact, temporary assumption/mock boundary, user decision and follow-up condition. It never changes the project profile's confirmed facts.

## Required records

For visual work, `assets` should distinguish project assets, supplied assets, licensed external assets, placeholders and unresolved items. For API work, `stateCoverage` should map UI states to request states. For refactors, record the equivalence claims and their evidence. For bug fixes, record reproduction and replay evidence.

A task is not complete merely because a build, screenshot, HTTP 200, mock, or tool call succeeded. `ACCEPTANCE.md` must separately report the status and evidence for `visual`, `behavior`, `data`, and `engineering`, plus unverified targets and unresolved assumptions.
