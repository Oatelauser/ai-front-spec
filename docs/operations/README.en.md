# Operations and Maintenance

Maintenance covers the Starter installer, editable `.agents/skills`, generated `.claude/skills`, runtime `.toolkit`, the 根目录 manifest roster, vendored Skills, plugin snapshots, and GitHub CI.

## Documentation map

| Task | Guide |
| --- | --- |
| Installation and routine checks | [OPERATIONS.en.md](OPERATIONS.en.md) |
| Bundled Skills, plugins, and host capabilities | [BUILT-IN-CAPABILITIES.en.md](BUILT-IN-CAPABILITIES.en.md) |
| Upgrades, offline bundles, and GitHub CI | [UPGRADING.en.md](UPGRADING.en.md) |

## Non-negotiable source rules

```text
.agents/skills/  = editable source
.claude/skills/  = generated mirror
.toolkit/        = validators and post-install runtime
```

Never hand-edit `.claude/skills/`, commit tokens/cookies/proxy credentials, or upgrade without reviewing the diff.
