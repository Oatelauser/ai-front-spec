---
name: project-profile
description: Initialize, inspect, update, migrate, and validate the project profile from repository facts and explicit user decisions.
---

# Project Profile

Use this independent Skill when the project profile is missing, draft, stale, or in conflict. It owns profile facts and template selection; it does not scaffold an application or initialize the rest of the project.

## User interface

Most users only need these commands:

```text
$project-profile
$project-profile init
$project-profile profile
$project-profile components
$project-profile status
$project-profile update
```

`$project-profile` is a read-only navigator: it explains `init`, the two peer maintenance commands, `status`, and `update`; it does not run an implicit flow. `$project-profile init` is the explicit guided initializer for a new project: it performs one scan, asks a small set of high-impact decision cards, builds an editable proposal for both domains, and writes only approved layers. `$project-profile profile` owns project-profile maintenance. `$project-profile components` owns UI component-catalog maintenance; either command performs and persists the shared maturity assessment when it is missing. `status` is read-only and reports both domains. `update` rescans a project and coordinates the two domain interviews without silently switching templates or overwriting confirmed values.

Internal stages (`inspect`, `plan`, `confirm`, `apply`, `migrate`, `validate`) may be used by an orchestrator, but are not required knowledge for normal users.

## Required behavior: init

1. Confirm this is a new/unformed project from the maturity scan. This initializer is not a migration command and must stop if existing business code or stable conventions are detected; route the user to `update` instead.
2. Perform one repository scan, then ask seven high-level decision cards: delivery targets, product/rendering shape, framework/runtime, visual/component baseline, mobile interaction strategy, data/auth/security, and quality/browser acceptance. Every high-impact card has a recommended default, including browser Web + mobile H5 + tablet responsive support.
3. Build `.codex/profile-proposal.json` from answers and evidence. The proposal must show each decision, recommended value, source, confidence, impacted files/fields, and editable alternatives. Recommendations remain `recommended` until explicitly approved.
4. Present a field-level proposal traceability matrix. The user may edit any card or field before approval; dependent recommendations must be recomputed and shown again.
5. Commit in layers: repository facts, explicit user decisions, approved recommendations, approved component planning, and deferred items. Never write a recommendation or component plan merely because it was displayed.
6. Materialize approved layers into `docs/PROJECT_PROFILE.md`, `docs/AI_COMPONENT_CATALOG.md`, and `.codex/profile-state.json` atomically. Preserve rejected values as `deferred` or unresolved with reason, impact, and follow-up condition.
7. Validate delivery-target consistency, profile/component framework alignment, placeholder classification, proposal status, and AI guidance. A proposal may be resumed; an approved proposal is archived in state before being cleared.

## Required behavior: profile

1. Read `AGENTS.md`, `docs/PROJECT_PROFILE.md`, `docs/AI_COMPONENT_CATALOG.md`, `.codex/profile-state.json`, any `.codex/profile-proposal.json`, the three profile templates and the component templates under `.codex/templates/`, package manifests, source directories, lockfiles, CI, tests, and relevant design/API documents.
2. Separate facts from defaults. Repository evidence and explicit user decisions are facts; template values are candidates only.
3. On first use, assess project maturity from combined evidence: business source and runnable entry, manifests/lockfiles, scripts, routes/pages, shared components, request/state/theme/i18n infrastructure, tests, CI, and stable conventions. Record `unformed`, `existing`, or `uncertain` with evidence and confidence; do not use a file-count shortcut.
4. For an `unformed` project (empty or early code without stable conventions), show every available template (`generic`, `react`, and `vue`) even when no framework evidence exists. Explain the recommendation and ask the user to choose or defer.
5. For an `existing` project, ask whether to initialize from existing code (recommended) or perform an explicit template merge/migration. Before migration, show affected files, conflicts, preserved decisions, and rollback conditions; never silently overwrite business code or confirmed records.
6. After template or existing-code mode is selected, scan the entire `docs/PROJECT_PROFILE.md` for every `<待填写...>` placeholder, including low-impact fields such as project name, integration tests, coverage, capability mapping, and maintenance owner. Do not finish with a summary while any placeholder is unclassified.
7. Run a `$grill-me`-style interview in rounds: ask the whole current frontier, number each question, give a recommended answer, and wait for the user's answers before recomputing the next frontier. Group related fields for readability, but name every field covered by the question.
8. Facts discoverable from the repository are agent work: inspect them and fill them with evidence instead of asking the user. Ask the user only for decisions or facts unavailable to tools. A field may leave the frontier only when it has a confirmed value, an explicit `无`/`不适用`, or a recorded `deferred` reason and impact.
9. If the user defers, record the field or field group in `profile-state.json.unresolved` with reason, impact, and follow-up condition. Continue independent frontier questions; pause only fields that depend on the deferred decision.
10. After each round, write answers and evidence idempotently, run structural validation, and show the remaining frontier. End the interview only when all placeholders are classified, the user explicitly stops/defer-saves the remaining frontier, or a concrete external dependency blocks progress.
11. Read `AI_COMPONENT_CATALOG.md` for UI facts and existing component evidence, but do not fill its placeholders or change its status from this command.
12. Apply changes idempotently. Preserve user edits, record evidence and decisions, and never overwrite a confirmed field with an inferred value.
13. Validate profile state, maturity evidence, template references, evidence links, and placeholder impact. Report confirmed facts, inferred facts, deferred fields with reasons, unresolved blockers, and the next grilling frontier.

## Required behavior: components

1. Read `.codex/profile-state.json` first. If `maturity.status` is missing, `maturity.assessedAt` is null, or no maturity evidence was persisted, perform the shared maturity scan and persist it; do not block on profile and do not fill `PROJECT_PROFILE.md`.
2. Read `.codex/templates/component-catalog.template.md`, the selected framework preset (`component-catalog.generic.md`, `component-catalog.react.md`, or `component-catalog.vue.md`), `.codex/templates/component-catalog.presets.json`, the confirmed portions of `docs/PROJECT_PROFILE.md`, `docs/AI_COMPONENT_CATALOG.md`, repository components, exports, tests/examples, UI library dependencies, styles, icons, theme, and i18n entry points.
3. For an `unformed` project, derive candidate baselines from the selected template and confirmed profile facts. Present the user with a choice: the recommended baseline, another candidate, custom, or defer. A candidate is a planning baseline, never an implemented fact.
4. For an `existing` project, extract actual components and boundaries from code first; ask whether to preserve, consolidate, extend, or defer each uncertain boundary. Do not replace real components with template examples.
5. Scan the entire `docs/AI_COMPONENT_CATALOG.md` for every `<待填写...>` placeholder, including matrix rows and page decision rows. Every placeholder must receive a fact, `无`, `不适用`, or a recorded `deferred` reason and impact.
6. Run the same round-based grilling interview. Repository facts are extracted by the agent; user choices decide catalog membership, naming, boundaries, candidate selection, and consolidation.
7. Read `PROJECT_PROFILE.md` as context, but never fill its placeholders or change `profileStatus` from this command. Record only the component-catalog status and evidence.
8. Validate component entries, planning-vs-implemented labels, references, examples, and remaining frontier. `componentCatalogStatus` cannot be `initialized` while placeholders or unresolved conflicts remain.

## Required behavior: update and status

- `update` rescans code, configuration, tests, CI, `PROJECT_PROFILE.md`, and `AI_COMPONENT_CATALOG.md`; applies only unambiguous low-impact facts, then routes changed or unresolved profile fields to the `profile` interview and component fields to the `components` interview. If both domains need work, run them in `profile → components` order. It may create missing files only after showing the proposed files and receiving confirmation.
- `update` never changes a confirmed template choice, silently performs migration, or marks the other domain complete. It reports changed fields, preserved decisions, conflicts, deferred items, and validation results.
- `status` is read-only. It reports maturity status/evidence/confidence, `profileStatus`, template selection, `componentCatalogStatus`, each domain's placeholders/deferred/conflicts, the last validation, and the next recommended command.

## Confirmation gate

Ask for confirmation when a decision can change framework, build commands, source directories, API contracts, authentication, permissions, generated-code ownership, acceptance criteria, template migration, component-library selection, or public component boundaries. Low-impact facts such as a detected package manager may be recorded with evidence, but still must be classified in the relevant grilling interview rather than omitted from it. A recommendation is never a substitute for an answer, and a final summary is not a completion criterion while unclassified placeholders remain.

Read [state model](references/state-model.md), [template selection](references/template-selection.md), and [update policy](references/update-policy.md) before changing files.
