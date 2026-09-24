# Update And Migration Policy

`update` inspects the repository and compares it with the recorded profile.

- Apply unambiguous, low-impact facts with their evidence.
- Ask before changing framework, runtime, package manager, source layout, API semantics, authentication, permissions, generated-code ownership, or acceptance rules.
- Never infer a user decision from a template default.
- Record conflicts instead of choosing silently.
- Keep migration idempotent: repeating the same update produces no additional changes.
- Report changed fields, preserved user decisions, conflicts, unresolved high-impact fields, and validation results.

`update` also compares `docs/rules/AI_COMPONENT_CATALOG.md` and component implementation evidence. Route profile changes to the `profile` interview and component changes to the `components` interview; when both change, process them in `profile` then `components` order. The two interviews may read one another's confirmed facts but never complete or overwrite the other domain. If either file is missing, show the proposed creation and obtain confirmation before writing it.

When an `update` changes the confirmed `deliveryTargets` set and the change involves `webview`, two re-checks are mandatory before the update completes:

1. Matrix re-check: scan the new (post-change) confirmed target set and tech stack against `docs/rules/AI_COMPATIBILITY_MATRIX.md`. Read the `兼容裁决记录` in section 10 of `docs/PROJECT_PROFILE.md` first; skip entries already adjudicated and unchanged instead of re-asking. Newly matched or changed entries follow the matrix flow — show the conflict, let the user adjudicate, and persist the result with timing `update`.
2. Page-declaration re-check: list existing pages whose `route.meta.targets` declarations are no longer a subset of the new confirmed set; show the stale declarations without auto-editing them — changing delivery targets stays an explicit user-adjudicated `update` decision.
