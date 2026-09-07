# Bootstrap state model

Persist state in the project manifest (normally `.codex/manifest.json`) and keep the profile's field provenance in `docs/PROJECT_PROFILE.md` or its adjacent metadata.

## Status dimensions

```text
bootstrapStatus: draft | partial | initialized | failed
profileStatus:   draft | initialized | business-ready
migrationStatus: none | pending | planned | applied | conflict
templateSelection.status: pending | user-confirmed | inferred-only | conflict
```

`bootstrapStatus=initialized` does not imply `profileStatus=initialized`. A project may finish rule and capability setup while its profile remains draft because the user chose to continue with acknowledged gaps.

`templateSelection` is independent from `profileStatus`: a selected template does not make the profile initialized, and a recommended template is never a user selection. Record the candidate IDs, recommendation and reason, selected template (or null), decision source and confirmation timestamp.

Example initial state:

```json
{
  "templateSelection": {
    "status": "pending",
    "candidates": ["generic", "react", "vue"],
    "recommended": "generic",
    "reason": "No verifiable application or framework evidence",
    "selected": null,
    "source": "inferred-only"
  },
  "profileStatus": "draft"
}
```

## Stage record

Each stage records:

```json
{
  "status": "pending|planned|applied|skipped|conflict|failed",
  "inputFingerprint": "...",
  "planId": "...",
  "lastRun": "ISO-8601",
  "changedFiles": [],
  "reusedFiles": [],
  "conflicts": [],
  "confirmation": "required|confirmed|declined|not-required"
}
```

The manifest records only actual writes, merges and confirmed reuse. Planned-but-not-applied files never appear in `installedFiles`.

## Profile field provenance

Every meaningful profile field should be classified as one of:

```text
user_confirmed | repo_fact | inferred | template_default | unresolved | user_override
```

`user_override` is task-scoped risk acceptance, not a replacement for a confirmed project fact. It records that the user allowed a task to proceed with a mock or assumption while the profile remains draft.

An existing profile without provenance is `unknown`; preserve its content, but require a new profile plan to confirm template choice and high-impact fields before treating them as user-confirmed.

## Idempotency and drift

An apply operation is idempotent when repeating it with the same current inputs produces the same target state, does not append duplicate content, and does not overwrite user changes. If a managed file differs from its recorded baseline, the stage becomes `conflict` and requires a new plan/confirmation. No stage is considered complete solely because its command exited successfully; its recorded outputs and validation must agree.
