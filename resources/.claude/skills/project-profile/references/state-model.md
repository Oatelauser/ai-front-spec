# Project Profile State

Store the machine-readable state in `.codex/profile-state.json`:

```json
{
  "schemaVersion": 1,
  "status": "draft",
  "templateSelection": {
    "status": "pending",
    "selected": null,
    "candidates": ["generic", "react", "vue"]
  },
  "maturity": {
    "status": "unformed",
    "confidence": "low",
    "evidence": [],
    "assessedAt": null
  },
  "componentCatalog": {
    "status": "draft",
    "unresolved": [],
    "evidence": [],
    "lastUpdatedAt": null
  },
  "deliveryTargets": {
    "browserWeb": { "status": "pending", "value": null },
    "mobileH5": { "status": "pending", "value": null },
    "tabletWeb": { "status": "pending", "value": null },
    "webview": { "status": "pending", "value": null },
    "pwa": { "status": "pending", "value": null },
    "multiPlatform": { "status": "pending", "value": null, "derived": true }
  },
  "proposal": {
    "path": ".codex/profile-proposal.json",
    "status": "none",
    "proposalId": null
  },
  "fields": {},
  "evidence": [],
  "unresolved": []
}
```

Allowed profile statuses are `draft`, `initialized`, and `conflict`. Template selection is independent and may be `pending`, `user-confirmed`, `inferred-only`, or `conflict`. Maturity status is `unformed`, `existing`, or `uncertain`; confidence is `high`, `medium`, or `low`. Component-catalog status is `draft`, `initialized`, or `conflict` and is independent from profile status.

`initialized` means required high-impact fields have confirmed evidence. It does not mean an application exists or that all optional fields are filled. `deliveryTargets` is the machine-readable source for supported browser Web, mobile H5, tablet Web, WebView, and PWA contexts; `multiPlatform` is derived from the confirmed target set and is not independently edited.

`maturity` is a shared project-context fact produced by the first profile subcommand that needs it (`profile` or `components`) and refreshed when its evidence fingerprint changes. It is usable by either domain only when `assessedAt` is non-null and evidence is present. `components` may read confirmed profile fields and maturity evidence, but cannot create or change profile fields. Conversely, `profile` may read component evidence but cannot complete the component catalog. Neither status implies the other.

For an `unformed` project, component entries selected as a future baseline are labelled `planned`; for an `existing` project, entries extracted from code may be labelled `implemented`. Deferred fields and conflicts remain visible until explicitly resolved.
