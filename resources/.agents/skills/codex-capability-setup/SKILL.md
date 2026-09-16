---
name: codex-capability-setup
description: Audit, install approved Codex capabilities, and verify discoverability when setting up an environment or resolving missing task capabilities.
---

# Codex Capability Setup

Default to on-demand capabilities, never the full mode without an explicit request. Read the current repository's `docs/CODEX_CAPABILITIES.md` first; before project rules are generated, use its bundled `resources/docs/CODEX_CAPABILITIES.md`. Missing authoritative sources must be reported instead of guessing dependencies.

Follow [setup phases](references/setup-phases.md). Phase A is read-only. Phase B uses [installation policy](references/install-policy.md) for items covered by existing user authorization or the completed [approval input](templates/approval-input.md). Phase C uses [verification checklist](references/verification-checklist.md), starting a new session only when new capabilities require discovery.

Use [status model](references/status-model.md) for audit output and approved state updates in the current repository's `docs/capability-state.json`, including repositories that still contain template resources. Phase A remains read-only. Never infer discoverability from exit code alone. Project profile maintenance belongs to $project-profile; capability setup does not create project rules, business code, or external objects.

