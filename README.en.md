# ai-front-spec — AI Rules Starter for Frontend Projects

[![CI](https://github.com/Oatelauser/ai-front-spec/actions/workflows/ci.yml/badge.svg)](https://github.com/Oatelauser/ai-front-spec/actions/workflows/ci.yml)
[![vendored-check](https://github.com/Oatelauser/ai-front-spec/actions/workflows/vendored-check.yml/badge.svg)](https://github.com/Oatelauser/ai-front-spec/actions/workflows/vendored-check.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node ≥20](https://img.shields.io/badge/node-%E2%89%A5%2020-green.svg)](https://nodejs.org)

[中文](README.md) | **English**

A rules pack for AI agents on frontend projects. Copy it into your repo and both hosts — Codex and Claude Code — immediately gain a frontend workflow that not only builds but also verifies its own work. Not a pile of marketplace plugins: a set of rules that travels with the project and gets read before every task.

Find your scenario:

- **Turn a screenshot or Figma file into a page**: `$frontend-task` screenshot workflow implements from the image; with the Figma plugin it reads design files directly, and Code to Canvas writes code back to the canvas.
- **Want your work verified after it's built**: `$frontend-task verify` walks the acceptance matrix (viewport, theme, keyboard, overflow, console); `$webapp-testing` runs real main flows with Playwright (login, permission denial, failure states, refresh persistence); `$web-design-guidelines` audits code and accessibility against web guidelines.
- **Unhappy with styling and feel**: `$apple-design` reviews motion (spring parameters, interruptibility, deceleration projection), `$compatibility-testing` covers cross-browser, `$mobile-ux-optimizer` checks mobile touch details.
- **Afraid the AI starts coding immediately**: new pages without a visual reference must go through 2–3 direction prototypes first (`$prototype`) — you pick one before implementation; implementation plans also require your approval via `$frontend-task confirm`.
- **Multi-target rules are hard to remember**: WebView / mobile H5 / desktop rules apply automatically based on the project profile, not on the AI's memory.

Boundary: it does not write business code, scaffold frameworks, or define your APIs — it governs "how the AI gets frontend work right, and how it proves the work is done."

| Host | Read path | Notes |
| --- | --- | --- |
| Codex | `.agents/skills/` | The only human-edited source; make changes here only |
| Claude Code | `.claude/skills/` | Machine mirror, generated automatically by `sync-mirror.mjs`; do not edit by hand |

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

Built-in skills require zero installation and work on both hosts. Only the external capabilities below are added per task; see section 2 of [docs/capabilities.md](docs/capabilities.md) for full details.

| Plugin | What it's for | Claude Code install | Codex install |
| --- | --- | --- | --- |
| Figma | Implement from designs, generate prototypes, write code back to canvas | `claude plugin install figma@claude-plugins-official`; fallback MCP: `claude mcp add --transport http figma https://mcp.figma.com/mcp` | `figma@openai-api-curated` (search in Plugin Management) |
| GitHub | PRs, issues, remote repository read/write | Official GitHub MCP connector | `github` plugin, or the GitHub MCP connector |
| Product Design | Design exploration, visual cloning, UX audit, prototyping | No install needed — the built-in full-package copy is already everything of it that works on Claude Code | `product-design` (official marketplace); unlocks OpenAI-host-dependent sub-skills such as image-to-code; the plugin version takes precedence |

Both Figma paths use the official remote MCP (OAuth); a free account suffices for reading and write-back (rate limits apply). Local Git checks do not need the GitHub plugin.

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

`$` commands are recognized by the host. The three entry skills plus all specialist skills are built in; see section 1 of [docs/capabilities.md](docs/capabilities.md) for the full list and sources.

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

### Specialist Skills (all built in)

`tdd-workflow`, `api-design`, `security-review`, the `frontend-design` series, the full `product-design` package, `grill-me`/`grilling` (grilling in rounds: entry point + protocol), `prototype` (throwaway prototypes: direction variants / state validation), `gsap` ×3, `playwright-cli` (real-browser automation: official manual + 10 hands-on references), `webapp-testing` (functional E2E for pages wired to APIs: Python Playwright scripts + dev server lifecycle management), `apple-design`, `compatibility-testing`, `mobile-ux-optimizer`, `react-best-practices`, `taste-skill`, `web-design-guidelines` — invoke directly as `$<skill-name>`; see [docs/capabilities.md](docs/capabilities.md) for sources and update procedures.

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

## 6. Skill Sources and Snapshot Versions

Identical to the Chinese table in [README.md §6](README.md): 25 built-in skills, all dual-host (Codex reads `.agents/skills/`, Claude Code reads the `.claude/skills/` mirror, byte-identical — hence listed once there). Host differences:

- **Host built-ins (Codex only, not shipped in this repo)**: `browser` / `chrome` / `computer-use` (`openai-bundled`) — page acceptance, reusing the user's browser session, desktop operation. On Claude Code, page acceptance uses `$webapp-testing` or `$playwright-cli` instead.
- **Plugins**: install sources differ per host — see the table in §1.
- **`product-design` capability surface**: the built-in full-package copy works everywhere for methodology/audit; sub-skills like image-to-code depend on the OpenAI host (Codex + official plugin).

### How to Upgrade These Skills (dual channel)

Online (when local network is fine):

```bash
node scripts/update-vendored.mjs                    # 1. Check: ✓ up to date / ↑ upgradeable / ? no baseline yet
node scripts/update-vendored.mjs --diff <skill-name>  # 2. Assess: upstream change summary × reference impact
node scripts/update-vendored.mjs --upgrade <skill-name>  # 3. Upgrade: overwrite changed files (local additions preserved), update the SHA baseline
node .toolkit/scripts/sync-mirror.mjs               # 4. Rebuild the mirror
node .toolkit/scripts/check-ai-guidance.mjs --root . --strict && node --test scripts/lib/*.test.mjs  # 5. Validate
```

Offline (when local clones are slow or failing): the weekly `vendored-check` CI packs the latest upstream content into an artifact whenever upgrades are available, with the download link attached to the issue it files —

```bash
# 1. Download vendored-bundle-<run>.zip from the issue link (Windows/macOS can pass the zip directly; on Linux, extract first and pass the directory)
node scripts/update-vendored.mjs --diff --offline <bundle-path>     # 2. Assess using the bundle (zero clones)
node scripts/update-vendored.mjs --upgrade --offline <bundle-path>  # 3. Upgrade using the bundle (byte-compared before overwrite)
# Steps 4-5 are the same as the online channel
```

Rules: always review `--diff` before upgrading (test on real behavior whenever a behavioral contract changes — e.g., run browser skills against a real page); update the snapshot date in `NOTICE` in sync; commit and cut a release once everything passes. The four plugin-snapshot skills (no public repo) are re-snapshotted from the local plugin cache instead of going through these channels. `--rebaseline` reconciles: when bytes already match upstream but the baseline is missing or stale, it writes the SHA directly.

## 7. FAQ

| Symptom | Remedy |
| --- | --- |
| Skills such as `$project-profile` not found | All 25 skills are built in; check the list in `docs/capabilities.md` and open a new session so the host rediscovers them; do not install third-party same-name substitutes |
| Profile is `draft` or template is `pending` | Run `$project-profile` to pick templates and confirm high-impact fields; defer when unsure — never hand-fill `initialized` |
| Task halted at `awaiting-confirmation` | Read the decision blocks in `PLAN.md`, then run `$frontend-task confirm` |
| `resume` reports a stale fingerprint | `inspect` first and re-`plan` if needed; do not carry over the old plan |
| AI guidance validation fails | Check the error paths and missing markers; verify the manifest and config, then rerun |
| `.claude/skills` out of sync with `.agents/skills` | Run `sync-mirror.mjs` to rebuild the mirror; never edit the mirror by hand |
| Need Figma / GitHub capabilities | See the plugin table in §1; on hosts without the plugin, connect Figma directly via MCP |
| Want to delete or overwrite files | Check Git status and impact first; leave `.toolkit` state and migration history untouched |
| Want to remove a local skill and use your own global/plugin version | `node scripts/remove-skill.mjs <skill-name>`: deletes `.agents`/`.claude` in pairs, updates the roster, registers `externalSkills`, and rebuilds the mirror — all atomically. For paired skills (e.g. grill-me↔grilling), never delete only one half — the validator will block it |
| Acceptance "looks like it passed" | Distinguish static checks / mocks / real integration; keep unverified items in `ACCEPTANCE.md` |
