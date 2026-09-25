# ai-front-spec — AI Rules Starter for Frontend Projects
[中文](README.md) | **English**

A "copy-and-use, zero-external-download" template of rules and workflows for frontend projects: **all 24 skills are built in** (5 in-house + 19 vendored; see the list in [docs/capabilities.md](docs/capabilities.md)). Copy it into a project and both hosts — Codex and Claude Code — discover it, with no network installation required. It is not a business application, and it does not create frameworks, routes, or API endpoints for you.

| Host | Read path | Notes |
| --- | --- | --- |
| Codex | `.agents/skills/` | The only human-edited source; make changes here only |
| Claude Code | `.claude/skills/` | Machine mirror, generated automatically by `sync-mirror.mjs`; do not edit by hand |

## Skill Sources and Snapshot Versions (all 24 built in)

| Source | Snapshot | Skills |
| --- | --- | --- |
| ★ OpenAI `product-design` plugin v0.1.52 (Codex host plugin, no public source repo) | 2026-09-23 | `product-design` (full package) |
| ★ `mattpocock-skills` 1.2.3 (plugin marketplace snapshot) | 2026-09-25 | `grill-me`, `grilling`, `prototype` |
| github.com/vercel-labs/agent-skills | 2026-09-23 | `react-best-practices`, `web-design-guidelines` |
| github.com/anthropics/skills | 2026-09-23 | `frontend-design` |
| github.com/affaan-m/everything-claude-code | 2026-09-23 | `tdd-workflow`, `api-design`, `security-review`, `frontend-design-direction` |
| github.com/microsoft/playwright-cli | 2026-09-25 | `playwright-cli` |
| github.com/leonxlnx/taste-skill | 2026-09-23 | `taste-skill` |
| elms-h5 skill pack 20260917 (GitHub upstream: see capabilities §1) | 2026-09-17 | `gsap` ×3, `apple-design`, `compatibility-testing`, `mobile-ux-optimizer` |
| In-house, this repository | — | `project-workflow`, `project-profile`, `frontend-task`, `tinypng-compress`, `karpathy-guidelines` |

★ = plugin snapshot source (no public repo; upgrading requires a fresh snapshot). Vendored skills are byte-identical to upstream (zero-modification principle); licenses and modification records are in `NOTICE`, and the machine-readable baseline (repo/SHA/date) is in the `vendored` field of `toolkit.json`.

### How to Upgrade These Skills (follow this procedure next time)

```bash
node scripts/update-vendored.mjs                    # 1. Check: which skills lag upstream (✓ up to date / ↑ upgradeable / ? no baseline yet)
node scripts/update-vendored.mjs --diff <skill-name>  # 2. Assess: upstream change summary × reference impact in this repo; manually confirm no functional loss
node scripts/update-vendored.mjs --upgrade <skill-name>  # 3. Upgrade: overwrite with upstream files (local additions preserved), update the SHA baseline
node .toolkit/scripts/sync-mirror.mjs               # 4. Rebuild the mirror
node .toolkit/scripts/check-ai-guidance.mjs --root . --strict && node --test scripts/lib/*.test.mjs  # 5. Validate
```

Rules: always review the `--diff` assessment before upgrading (and test on real behavior whenever a behavioral contract changes — e.g., run browser skills against a real page); update the snapshot date in `NOTICE` in sync; commit and cut a release once everything passes. ★ entries without a repo (plugin snapshots) are re-snapshotted from the corresponding plugin cache and overwritten, then steps 4-5 apply. Interpreting older installs: a project whose `.toolkit/manifest.json` has no `starterVersion` field predates v6.0.x; upgrading against the source repository's Releases gives it a version anchor. If an upgrade renames skills, the installer flags the retired directories — delete them in pairs as prompted, then rebuild the mirror.

## 1. Quick Setup

### Install

Requires Node ≥ 20 (CI verifies on 22).

```bash
node scripts/build-starter.mjs --target ./my-project
```

- Target is an **empty directory** → clean copy: everything except development artifacts is copied, and the three validations (structure / AI guidance / mirror consistency) run automatically.
- Target is an **existing project** → overlay install: regular files are overwritten; `AGENTS.md`, `CLAUDE.md`, `README.md`, and the project profile and rule drafts are skipped when they already exist (see the list in the `skipIfExists` field of `toolkit.json`; skipped items are printed at the end).

> Cloning this repository directly yields the development form (including `scripts/`, `docs/wayfinder/`, and `CONTRIBUTING.md`); these development artifacts never enter a business project through installation. You can also copy the repository root contents manually (excluding the development artifacts above and `.serena/`); be sure to keep the hidden directories `.agents/`, `.claude/`, and `.toolkit/`. When committing the Starter into your own Git repository, consider adding a `*.png binary` line to the project `.gitattributes` so line-ending conversion cannot corrupt the images bundled inside skills.

### Verify

```bash
node .toolkit/scripts/check-ai-guidance.mjs --root .
node .toolkit/scripts/sync-mirror.mjs --check
```

`--strict` treats `<待填写>` placeholders outside the profile draft as failures — that is a reminder that facts are unconfirmed, not a sign of file corruption.

### Next Steps After Installation

1. **Initialize the project profile**: run `$project-profile` on a new project; run `$project-profile update` on existing business code to align it with reality.
2. **Align quality commands**: the quality commands in the profile must match the real script names in your `package.json`; do not keep the template's example values.
3. **Confirm delivery targets**: confirm `deliveryTargets` while initializing the profile (desktop browser / mobile H5 / WebView, etc.) — it determines which rules apply to page tasks, and the AI must not guess before it is confirmed.
4. **Isolate skill test files**: if your test framework scans the whole tree (Vitest does by default), add `.agents/` and `.claude/` to its exclude list — template tests inside skill packages are not project tests.
5. **Merge entry guidance**: keep your versions of `AGENTS.md` / `CLAUDE.md` / `README.md` when the overlay install skips them; to bring in the Starter guidance, merge manually against the same-named files in the source repository.

### Optional Plugins (on demand)

The 24 built-in skills require zero installation and work out of the box. Only the external capabilities below are installed per task when needed; see section 2 of [docs/capabilities.md](docs/capabilities.md) for full details.

**Claude Code host** (install from the `/plugin` marketplace):

- **Figma**: `claude plugin install figma@claude-plugins-official`; if that fails, connect the remote MCP manually: `claude mcp add --transport http figma https://mcp.figma.com/mcp`. Reproduce designs from Figma files and write Code to Canvas prototypes back to the canvas; works with a free account.
- **GitHub**: the official GitHub MCP connector.
- **Product Design**: no installation needed — the Starter ships a full-package copy, which is already everything of it that works on Claude Code (sub-skills such as image-to-code depend on OpenAI host capabilities; there is no official Claude Code plugin).

**Codex host** (install via Plugin Management, searching by exact reference):

- **Figma**: `figma@openai-api-curated`. Same capabilities as above (read + prototype generation + Code to Canvas write-back).
- **GitHub**: the `github` plugin, or the GitHub MCP connector — either works.
- **Product Design**: `product-design` (official OpenAI plugin marketplace). The Starter already ships a full-package copy whose methodology works on all hosts; installing the official plugin unlocks the sub-skills that depend on OpenAI host capabilities (such as image-to-code), and the plugin version takes precedence once installed.

## 2. Getting Started

From zero to delivering the first task on a new project takes four steps:

```text
1. $project-profile init            # New project: maturity scan → seven decision cards → generates the project profile and component catalog
2. $frontend-task inspect --source=requirement --type=new-page
3. $frontend-task plan && $frontend-task confirm
4. $frontend-task implement && $frontend-task verify && $frontend-task report
```

- When you don't know where to start, run bare `$project-profile`: it read-only displays the current state and the recommended path, with no implicit execution.
- Running `$frontend-task` directly also works — it routes automatically to the stages above; it halts at `awaiting-confirmation` while high-impact decisions are unresolved and never bypasses confirmation to change code.
- On an existing project, replace step 1 with `$project-profile update`.

## 3. Command Reference

`$` commands are recognized by the host. The three entry skills (`project-workflow` / `project-profile` / `frontend-task`) plus 19 vendored specialist skills are all built in; see section 1 of [docs/capabilities.md](docs/capabilities.md) for the full list and sources.

### $project-profile — Project Profile and Component Catalog

| Subcommand | Purpose | Writes files |
| --- | --- | --- |
| (bare command) | Shows status, recommended path, and available subcommands | No |
| `init` | One-pass scan for new projects + seven decision cards + proposal confirmation + layered writes (`unformed` projects only) | Yes |
| `profile` | Profile interview: scan → template selection → grilling rounds → validation | Yes |
| `components` | Component catalog: baseline candidates → user selection → grilling → validation | Yes |
| `status` | Overview of both states, remaining placeholders, and conflicts | No |
| `update` | Scans the current state and reconciles profile and component catalog updates (idempotent; conflicts are never silent) | Maybe |

Key points: `profile` and `components` are peers with no prescribed order; starting with `profile` is recommended. Their sources of truth are `docs/PROJECT_PROFILE.md` and `docs/rules/AI_COMPONENT_CATALOG.md` respectively, with machine state in `.toolkit/profile-state.json`. Template defaults are not project facts; only user confirmation is recorded as `user-confirmed`.

### $frontend-task — End-to-End Frontend Task Flow

| Stage | What it does | Output |
| --- | --- | --- |
| `inspect` | Reads the profile, rules, code, and source materials; identifies the task type and gaps | Fact list, source routing, gaps |
| `plan` | Round-by-round Q&A at the decision frontier; plans files and the acceptance matrix | `PLAN.md`, `STATE.json` |
| `confirm` | Approve / reject / request changes per decision block | Approved blocks proceed to implementation |
| `implement` | Adds failing tests first, then implements, covering data states and interaction states | Business code, task state |
| `verify` | Real tests, types, build, Browser/API acceptance | `ACCEPTANCE.md` |
| `report` | Summarizes changes, commands, evidence, deviations, and unverified items | Delivery report |
| `resume` | Resumes after interruption (`--from=<stage>`); if the fingerprint is stale, go back to `inspect`/`plan` first | — |

### $project-workflow — Project-Level Routing

The entry point when you are unsure which skill to use: it routes to the minimal skill and stage; see `project-workflow/references/task-routing.md` for details.

### Specialist Skills (16 vendored)

`tdd-workflow`, `api-design`, `security-review`, the `frontend-design` series, the full `product-design` package, `grill-me`/`grilling` (grilling in rounds: entry point + protocol), `prototype` (throwaway prototypes: direction variants / state validation), `gsap` ×3, `playwright-cli` (real-browser automation: official manual + 10 hands-on references), `apple-design`, `compatibility-testing`, `mobile-ux-optimizer`, `react-best-practices`, `taste-skill`, `web-design-guidelines` — invoke directly as `$<skill-name>`; see [docs/capabilities.md](docs/capabilities.md) for sources and update procedures.

## 4. Task Operation Details

### 4.1 Task Input

| Type | Applies to | Key points to confirm |
| --- | --- | --- |
| `new-page` | New pages, complete flows, new routes | User flows, layout, state, APIs, responsiveness |
| `incremental` | Modifying part of an existing page/component | Original behavior, changed area, regression scope |
| `bug-fix` | Fixing reproducible defects | Repro steps, root cause, regression cases |
| `refactor` | Structural changes with unchanged behavior | Public interfaces, callers, equivalence |

Sources support `screenshot` / `prototype` / `html` / `figma` / `api` / `requirement` and can be combined; for each source, record the path or URL, version, read time, and status — conflicts must be recorded, never resolved unilaterally. Describe the task directly in conversation, or copy `.agents/skills/frontend-task/templates/frontend-task.template.json` and fill it in. At minimum, state clearly: the user's goal, target route/files, existing behavior, constraints, permission boundaries, and observable completion criteria.

### 4.2 Stage Reference

| Stage | You provide / decide | The agent executes |
| --- | --- | --- |
| `inspect` | Requirements, source paths, target route | Reads the profile and code; identifies the type and gaps |
| `plan` | Round-by-round answers on scope, visuals, components, APIs, permissions | Separates facts/assumptions/to-confirm; writes the plan and acceptance matrix |
| `confirm` | Approve, reject, or request changes | Reviews the five major decision blocks |
| `implement` | Provide an authorized override when necessary | Adds failing tests first; implements data states (loading/empty/error/unauthorized/disabled/success) and interaction states (hover/focus-visible/pressed/selected) |
| `verify` | Non-production environment, test accounts, Browser | Runs real tests/types/build/Browser acceptance; distinguishes mocks from real integration |
| `report` | Confirms delivery scope and acceptable unverified items | Summarizes evidence; unverified items must not be reported as done |

`inspect` can run alone for read-only investigation; task status converges to `draft → awaiting-confirmation → done` (failure `failed`). A `draft` profile does not block low-risk work, but high-impact decisions pause it. `user_override` only relaxes gaps for the current task temporarily and must state its assumptions and risks; it cannot modify the profile or fake permissions.

### 4.3 Key Points by Task Type

- **New page**: settle the main flow and route first, then parse design sources, reuse components, and map APIs; deep-link direct open, refresh, responsiveness, and permissions must all be verified.
- **Incremental change**: record the original behavior and touch only the changed area; verify neighboring callers and regressions — do not redo unrelated visuals on the side.
- **Bug fix**: reproduce first and write a failing case, then replay the repro after the minimal fix; deleting tests or editing test data does not count as a fix.
- **Refactor**: list public interfaces and callers first; run behavioral-equivalence tests afterward, without sneaking in semantic, permission, or visual changes.

### 4.4 Acceptance Checklist (pick by actual feature)

1. **Automation**: relevant tests, type/static checks, build, and the overall quality gate; record real commands and exit codes.
2. **Page runtime**: target routes and deep links; record browser, viewport, DPR, theme, and console errors.
3. **User flows**: navigation, filtering/pagination, forms, overlays, back, refresh; check request parameters and duplicate submissions.
4. **States and extreme content**: check each applicable data state and interaction state; long text, zero values, large data volumes, overflow on short viewports.
5. **Accessibility and responsiveness**: keyboard order, visible focus, accessible names, contrast, both sides of each breakpoint, touch operation.
6. **Evidence delivery**: record pass/fail/unverified/not applicable; a mock, a screenshot, or an HTTP 200 alone never proves a flow works.

Complex tasks store `TASK.md`, `PLAN.md`, `STATE.json`, `ACCEPTANCE.md`, and `assets/` under `docs/tasks/<task-id>/`.

## 5. File Responsibility Index

| Path | Role |
| --- | --- |
| `AGENTS.md` / `CLAUDE.md` | Project boundaries, source-of-truth priority, completion conditions (dual-host entry, identical content) |
| `docs/PROJECT_PROFILE.md` | The single source of truth for tech stack, directories, commands, permissions, and acceptance |
| `docs/rules/AI_*.md` (8 files) | Task contract, frontend task contract, project standards, workflow principles, component catalog, acceptance evidence, WebView rules, compatibility matrix |
| `docs/rules/FRONTEND_CONVENTIONS.md` | Optional conventions for icons, internationalization, and styling |
| `docs/capabilities.md` | Capability inventory: built-in skills / host plugins (optional) / host built-in verification |
| `.agents/skills/` | The only human-edited source; make changes here only |
| `.claude/skills/` | Claude Code mirror; machine-generated, do not edit by hand |
| `.toolkit/manifest.json` | Starter state record |
| `.toolkit/profile-state.json` | Maturity, profile state, template selection, component catalog state |
| `.toolkit/ai-guidance.config.mjs` | Files, markers, commands, and state references required by validation |
| `.toolkit/scripts/check-ai-guidance.mjs` | AI guidance validator entry point (`--strict` strict mode) |
| `.toolkit/scripts/sync-mirror.mjs` | Mirror sync (`--check` validates drift) |
| `.toolkit/scripts/lib/ai-guidance-validation.mjs` | Validator implementation, reusable by tests |
| `.agents/skills/<skill>/templates/` | Three profile templates, component catalog templates and presets, task input template |
| `LICENSE` / `NOTICE` | MIT license plus vendored component attribution and modification records |

Machine state files are managed by their corresponding skills; never hand-forge `initialized`, confirmation states, or acceptance success.

## 6. How to Extend

Adding a new skill:

1. Write `SKILL.md` under `.agents/skills/<name>/` (frontmatter `name` must match the directory name); add `agents/openai.yaml`, `references/`, and `templates/` as needed.
2. Rebuild the mirror with `node .toolkit/scripts/sync-mirror.mjs`.
3. Register it in the `skills` field of `toolkit.json`; register `requiredFiles` / `additionalSkills` / `routing` in `.toolkit/ai-guidance.config.mjs` as needed.
4. If task routing changes, update `project-workflow/references/task-routing.md`; for new sources, extend `frontend-task/references/source-routing.md`.
5. For vendored skills, record the upstream source, snapshot, license, and modifications in `NOTICE`; add a source row to `docs/capabilities.md`.
6. Increment `schemaVersion` when adding state fields, and keep it idempotent.

New templates / conventions: put them in the corresponding skill's `templates/` or `docs/rules/`, and update the validation config and the file index in sync.

After each extension, verify the main flow "copy → `$project-profile` → `$frontend-task inspect`" on a clean copy:

```bash
node .toolkit/scripts/check-ai-guidance.mjs --root . --strict
node .toolkit/scripts/sync-mirror.mjs --check
```

Strict mode failing while the profile is unconfirmed is expected; rerun and record after confirming the profile.

## 7. FAQ

| Symptom | Remedy |
| --- | --- |
| Skills such as `$project-profile` not found | All 24 skills are built in; check the list in `docs/capabilities.md` and open a new session so the host rediscovers them; do not install third-party same-name substitutes |
| Profile is `draft` or template is `pending` | Run `$project-profile` to pick templates and confirm high-impact fields; defer when unsure — never hand-fill `initialized` |
| Task halted at `awaiting-confirmation` | Read the decision blocks in `PLAN.md`, then run `$frontend-task confirm` |
| `resume` reports a stale fingerprint | `inspect` first and re-`plan` if needed; do not carry over the old plan |
| AI guidance validation fails | Check the error paths and missing markers; verify the manifest and config, then rerun |
| `.claude/skills` out of sync with `.agents/skills` | Run `sync-mirror.mjs` to rebuild the mirror; never edit the mirror by hand |
| Need Figma / GitHub capabilities | See section 2 of `docs/capabilities.md`; on hosts without the plugin, connect Figma directly via MCP |
| Want to delete or overwrite files | Check Git status and impact first; leave `.toolkit` state and migration history untouched |
| Want to remove a local skill and use your own global/plugin version | `node scripts/remove-skill.mjs <skill-name>`: deletes `.agents`/`.claude` in pairs, updates the roster, registers `externalSkills` (validation then treats it as externally provided), and rebuilds the mirror — all atomically. For paired skills (e.g. grill-me↔grilling), never delete only one half — the validator will block it |
| Acceptance "looks like it passed" | Distinguish static checks / mocks / real integration; keep unverified items in `ACCEPTANCE.md` |

## 8. Legacy Document Name Mapping

| Old name | Current name |
| --- | --- |
| `AI_PROMPT_ENGINEERING.md` | `AI_WORKFLOW_PRINCIPLES.md` |
| `AI_TASK_PROMPT.md` | `AI_TASK_CONTRACT.md` |
| `AI_PAGE_PROMPT.md` | `AI_FRONTEND_TASK.md` |
| `AI_CAPABILITY_REQUIREMENTS.md` / `CODEX_CAPABILITIES.md` | `docs/capabilities.md` |
| `resources/` legacy container directory | The repository root is the Starter (topology flattened in 2026-09) |

The mapping is kept to ease migrating older projects; new content uses the current names throughout.
