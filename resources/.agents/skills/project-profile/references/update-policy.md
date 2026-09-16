# Update And Migration Policy

`update` inspects the repository and compares it with the recorded profile.

- Apply unambiguous, low-impact facts with their evidence.
- Ask before changing framework, runtime, package manager, source layout, API semantics, authentication, permissions, generated-code ownership, or acceptance rules.
- Never infer a user decision from a template default.
- Record conflicts instead of choosing silently.
- Keep migration idempotent: repeating the same update produces no additional changes.
- Report changed fields, preserved user decisions, conflicts, unresolved high-impact fields, and validation results.

`update` also compares `docs/AI_COMPONENT_CATALOG.md` and component implementation evidence. Route profile changes to the `profile` interview and component changes to the `components` interview; when both change, process them in `profile` then `components` order. The two interviews may read one another's confirmed facts but never complete or overwrite the other domain. If either file is missing, show the proposed creation and obtain confirmation before writing it.
