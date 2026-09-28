# Decision Index: UI Capability Split and Integration

An index of every ruling from the 2026-09-26 to 09-28 "UI prototyping/design capability split and integration" effort. This page only compiles decisions; it never introduces new ones. Full rationale and measurement appendices live in the linked issues.

## 1. How these decisions were made

All decisions closed inside the wayfinder map [#2](https://github.com/Oatelauser/ai-front-spec/issues/2): the map opened on 2026-09-26 with fact-finding first (repo coverage matrix + six upstream verifications), then per-ticket grilling; with 7/7 child tickets (#3–#9) settled, the map closed on 09-27. The single execution checklist is [#10](https://github.com/Oatelauser/ai-front-spec/issues/10); phases 0+1 passed blind integration testing (2026-09-27, no rework tickets), with two measurement appendices closing on 09-28. Standing hard constraint: no gap-filling by default; an adoption must prove both that existing skills cannot do it and that the reading-surface increment stays controllable.

## 2. Decision table

| Decision | One-line outcome | Key reversal / turning point |
| --- | --- | --- |
| [Design capability home](https://github.com/Oatelauser/ai-front-spec/issues/5) | Same repo, separate lanes: design stays in this repo as an independent lane (`$design-task`); the two-tier boundary "basic direct output (`$prototype`) vs professional design (lane)" is documented | Reversed: the original "separate design repo" ruling was withdrawn after three debate rounds (gating lives in routing, not directories, etc.) |
| [ui-ux-pro-max destination](https://github.com/Oatelauser/ai-front-spec/issues/7) | Vendored into this repo as the lane's selection engine (+2 install surface); missing local Python reports unavailable and degrades to a static list + LLM choice | Followed #5 twice: first to the "design repo", then back here as the lane engine |
| [Design lane plan](https://github.com/Oatelauser/ai-front-spec/issues/9) | `$design-task` thin skill + divergent loop (selection → 2–3 variants → user pick → revisions → freeze); finalized designs land versioned under the docs/design directory and feed frontend-task source; DRIFT.md reverse reconciliation; Stitch optional enhancement + HTML fallback | Nine appendices + final ruling = the working manual; download-channel conclusions were revised repeatedly as measurements came in |
| [Stitch free-tier verification](https://github.com/Oatelauser/ai-front-spec/issues/8) | Conditional ticket dissolved by #9's fallback design: unavailable or paid → fall back to HTML; quotas block nothing | Closed without verification; cloud-dependency concern dissolved the same way |
| [Tweak ownership criteria & contract](https://github.com/Oatelauser/ai-front-spec/issues/6) | Three-way criteria: implementation quality / local replacement → fix directly in this repo (replacements logged in DRIFT); systematic design-direction change → reopen in the lane; contract anchors on frontend-task's existing source mechanism (four forms + version tag, zero new machinery) | The ambiguous band first runs the "implementation vs design" comparison loop; only two escalation triggers |
| [Routing and doc gap repair](https://github.com/Oatelauser/ai-front-spec/issues/4) | Three new routing rows (style feel / GSAP / tinypng) + a re-check closing sentence + boundary statements + figma-workflow annotations; zero new files | karpathy-guidelines promoted by user ruling to a global line (not repeated per scenario row) |
| [impeccable adoption](https://github.com/Oatelauser/ai-front-spec/issues/3) | B: optional external registration — not vendored, zero repo increment; documented in both README and capabilities; hooks are manual opt-in, the installer never touches host config | Landed as a four-command integration: `detect` / `critique` / `polish` / `audit` (see the Impeccable row in capabilities.md) |
| [Execution checklist](https://github.com/Oatelauser/ai-front-spec/issues/10) | Phases 0+1 (doc wiring + lane construction) passed integration testing; findings deferred to the slimming batch, non-blocking | Download final plan upgraded to a three-tier ladder; DESIGN.md switched to inline API reconciliation (measured 09-28) |

## 3. Intentionally not adopted / exemptions

| Item | Reason |
| --- | --- |
| Vendoring the frontend-design plugin | anthropics/claude-code repo-specific commercial terms cannot be borrowed, and it adds nothing over the built-in frontend-design (Apache-2.0, same origin) ([#2 Out of scope](https://github.com/Oatelauser/ai-front-spec/issues/2)) |
| impeccable `craft` / `init` | Dual-contract conflict; not adopted |
| impeccable `live` / `bolder` / `animate` | Overlaps existing skills |
| grill family kept out of the routing table | Internal workflow grilling protocol (grill-me entry / grilling protocol), invoked on demand ([#4](https://github.com/Oatelauser/ai-front-spec/issues/4)) |
| ui-ux-pro-max single parent | design-task's internal engine; single-parent referencing is deliberate (pinned as an exemption by the roster reachability test), so it never enters the implementation-side scenario table |

## 4. Known limitations and external dependencies

- The Stitch HTML endpoint is intermittently available (same machine, same proxy, hit-or-miss; probe window 0/10). It is tamed by a three-tier ladder: ① automatic retries (manual redirect + body validation, spread across minutes) → ② Codex host `chrome@openai-bundled` → ③ manual zip export as fallback; re-verify before construction and retest when the official CLI hits v0.11+ ([#10 appendices](https://github.com/Oatelauser/ai-front-spec/issues/10)). DESIGN.md is now fetched automatically via MCP `get_project` inline content; code.html is the only manual item left in the five-piece final deliverable.
- product-design has no public source repo: public distribution rests on a user amnesty (ruled 2026-09-24, reviewed 2026-09-25 to indefinite · non-commercial); the license record is in the repository root NOTICE.
- Dead or migrated upstreams (e.g. mobile-ux-optimizer's original repo 404'd and moved to a continuation repo): the signal is the CI weekly report (`vendored-check.yml` scheduled run) showing persistent "cannot probe upstream"; switch to a continuation repo or freeze the baseline only after human confirmation. Plugin snapshots without a repo only report their source, with no network probing.
