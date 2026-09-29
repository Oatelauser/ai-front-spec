# Built-in Capability Inventory

Version and commit facts live in 根目录 manifest; this table explains purpose only. `根目录 manifest 的 skills 字段` is the Starter roster and `根目录 manifest 的 vendored 字段` records sync sources.

## Bundled Skills

| Skill | Purpose |
| --- | --- |
| `project-workflow` | Project facts, routing, planning, implementation, verification, delivery |
| `project-profile` | Project profile, targets, and component catalog |
| `frontend-task` | Full frontend task lifecycle |
| `design-task` | Professional UI design, variants, and frozen handoff |
| `mobile-ux-optimizer` | Touch, viewport, safe-area, and responsive details |
| `apple-design` | Physical-feeling and interruptible motion |
| `gsap-core` / `gsap-performance` / `gsap-timeline` | GSAP API, performance, and sequencing |
| `tinypng-compress` | Image compression |
| `webapp-testing` (+ chrome-devtools MCP) | Browser automation and real UI verification |
| `page-annotate` (+ chrome-devtools MCP dual lane) | "Point and shoot" page feedback: you box regions on the page to flag issues and the agent reads back coordinates with element diagnostics; built into the design-task refinement round and the frontend-task verify round (see the next section for setup) |
| `compatibility-testing` | Cross-browser, platform, and device validation |
| `karpathy-guidelines` | Surgical, verifiable implementation |
| `api-design` | REST API design |
| `frontend-design` / `frontend-design-direction` / `taste-skill` | Visual direction and anti-template design |
| `grill-me` / `grilling` | Decision stress-testing |
| `product-design` | Design exploration, visual cloning, UX audit, prototyping |
| `prototype` | One-off direction/state prototypes |
| `react-best-practices` | React/Next.js performance |
| `security-review` | Security review for sensitive features and inputs |
| `tdd-workflow` | Test-driven workflow |
| `web-design-guidelines` | Web UI, accessibility, and UX review |
| `ui-ux-pro-max` | UI/UX design assistance |

## Browser dual lane and page annotation

`$page-annotate` uses the chrome-devtools MCP (vendored in this repo) through two entries:

| Lane | Entry | Use |
| --- | --- | --- |
| Isolated (default) | `chrome-devtools` | The agent opens a separate Chrome window with the prototype/dev page for you to annotate — zero setup |
| Your browser | `chrome-devtools-user` (`--autoConnect`) | Attaches to **your own running Chrome** (real logged-in pages, internal systems) |

**Enabling your-browser mode** (one in-browser step, no config edits): open `chrome://inspect/#remote-debugging` in Chrome → flip the toggle on → approve the "allow debugging connection" prompt on first connect → flip the toggle off when done. If the toggle is off, calls fail loudly with a hint to enable it — never silently switching lanes or spawning a browser.

**Where it shows up**: the `$design-task` refinement round (say "let me show you on the page"), the `$frontend-task` verify round (say "let me mark the page"), or anytime by saying "let me circle it on the page". The annotator is a read-only overlay and does not alter page behavior; your-browser mode means your real identity, so the agent stays read-only there.

## Bundled, vendored, and host-provided

- `根目录 manifest 的 skills 字段`: Starter distribution roster.
- `根目录 manifest 的 vendored 字段`: upstream repository, path, commit, snapshot, and content source.
- `pkg` entries: package-provided; a local plugin snapshot is not guaranteed on every host.
- `.claude/skills/`: generated from `.agents/skills/`, not a separate source.
- External plugins/MCP: available only after the host actually installs/connects them.

## Common optional capabilities

| Capability | Purpose | Constraint |
| --- | --- | --- |
| Figma | Read designs, generate prototypes, write code back | Verify host installation and authorization |
| GitHub | PRs, issues, remote repositories | Use the host connector; never commit tokens |
| Product Design plugin | Host-specific design sub-skills | Follow the active host version |
| Browser/Chrome/Computer Use | Real UI verification or authenticated flows | Use only when exposed by the host |
| Impeccable | Deterministic UI checks | Optional external capability |

## Selection rule

Prefer bundled capabilities. For external capabilities, read `docs/capabilities.md` and the host installation inventory. If unavailable, report the gap and use the documented fallback; never claim it is connected.
