# Unified initialization workflow

`$project-profile init` is the new-project path. It runs one repository scan, asks seven high-level decision cards, and creates a proposal before writing either domain file. The cards are decision groups, not a replacement for classifying every materialized placeholder.

## Project boundary

Use `init` only when the maturity scan classifies the project as `unformed` with no stable business implementation. If runnable business code, established routes, dependencies, tests, or conventions are present, stop this path and route the user to `$project-profile update`; do not overwrite the project as a new template.

## Seven cards

| Card | High-impact decision | Recommended default | Main fields affected |
| --- | --- | --- | --- |
| Q1 | Delivery targets and runtime contexts | Browser Web + mobile H5 + tablet responsive; WebView 可选启用（默认暂缓）；PWA 暂缓 | `deliveryTargets`, browser matrix, viewport matrix |
| Q2 | Product shape and rendering | Responsive Web application, SPA + History routing, deep-link fallback | product shape, rendering, routing, deployment |
| Q3 | Framework and runtime | Vue 3 + TypeScript + Vite | framework, runtime, package manager, test/build commands |
| Q4 | Visual system and component baseline | Semantic tokens plus framework adapter; Element Plus for Vue, Ant Design for React, generic contract otherwise | style, theme, icon, component baseline |
| Q5 | Mobile interaction and responsive strategy | Mobile-first, touch-safe, no hover-only controls, safe area and soft-keyboard handling | breakpoints, touch, short-screen, safe area, component variants |
| Q6 | Data, authentication and security | Real API contract first with explicitly labeled mocks; server-side authorization | request layer, DTO/VO, auth, permissions, error states, persistence |
| Q7 | Quality and browser acceptance | Desktop + mobile Browser/Playwright plus device-equivalent verification | commands, browser matrix, evidence and acceptance |

Q1 must always present a default that enables `browserWeb`, `mobileH5`, and `tabletWeb`. `multiPlatform` is derived from the confirmed target set; it is never independently edited.

Q1 also offers a `default + enterprise-webview` alternative alongside the existing per-value `custom` editing. Container choice is orthogonal to device form: `webview` combines freely with any target (a DingTalk PC embedded page is desktop × webview). The Q1 impact list holds exactly four one-line entries: legacy-kernel CSS fallbacks, JSBridge/SDK detection and wrapping, real-device acceptance cost, and compatibility-matrix involvement — the matrix entry points to the full matrix scan before materialization as the safety net (at Q1 time only rows whose 选型 column is `—` can match; custom answers hitting no row is expected). `webview` becomes `user-confirmed` only when the user can name the real containers (recorded as its value, e.g. DingTalk/Feishu/in-house app); choosing webview without a container name keeps it `deferred`, not confirmed. Matrix consumption has three timings: Q1 display is an immediate hint that is not persisted; the full scan before materialization persists into the proposal's `compatibilityScan`; an update re-check persists with timing `update`. Not persisted means not scanned (see `docs/AI_COMPATIBILITY_MATRIX.md`).

## Card interaction

For each card:

1. Show the recommendation, alternatives, evidence, confidence, affected files/fields, and downstream component implications.
2. Let the user accept, choose A/B/C/D, or edit individual values. A recommendation remains `recommended` until accepted.
3. Recompute dependent cards after edits. For example, changing Q3 from Vue to React changes Q4's library baseline and the component template.
4. Record the answer and every generated field in `.codex/profile-proposal.json`; do not write the final Markdown or state facts yet.

## Layered commit

Present a traceability matrix before writing:

| Layer | May contain | Default approval |
| --- | --- | --- |
| Facts | Repository evidence | `pending` until shown; may be batch-approved |
| User decisions | Explicit answers and edits | `pending` until shown |
| Recommendations | AI-selected viewports, browsers, breakpoints and defaults | Must be explicitly approved |
| Component plan | `planned` entries, variants and landing conditions | Must be explicitly approved |
| Deferred | Rejected/unknown values with reason, impact and follow-up | May be saved without completion |

Only approved layers are materialized. A user can approve different layers separately or leave a proposal resumable. Rejected recommendations remain visible as `deferred` or `conflict`; they are not silently replaced.

## Completion

Initialization is complete only when every generated field in both domain documents is classified as a fact, explicit decision, approved recommendation, `无`, `不适用`, or `deferred` with reason/impact/follow-up; `deliveryTargets` agrees with the readable table; component baseline agrees with framework; and validation passes.
