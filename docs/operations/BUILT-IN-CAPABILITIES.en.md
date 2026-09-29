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
