# Starter Operations

## 1. Environment

- Node.js >= 20; CI validates Node 22.
- Git is required. Vendored upgrades need access to upstream repositories or an offline bundle.
- Existing `AGENTS.md`, `CLAUDE.md`, `README.md`, profile, and rule files are protected by `skipIfExists` in 根目录 manifest.

## 2. Install

```bash
node scripts/build-starter.mjs --target ./my-project
```

An empty directory receives a clean copy. An existing project receives an overlay while protected files are skipped. Review the skip list and align the profile and component catalog with the target project.

## 3. Validate this repository

```bash
node scripts/build-starter.mjs --check
node .toolkit/scripts/check-ai-guidance.mjs --root . --strict
node .toolkit/scripts/sync-mirror.mjs --check
node --test scripts/lib/*.test.mjs
```

Strict mode checks placeholders, dead links, dead Skill/document references, and task records.

## 4. Skill change order

1. Edit only `.agents/skills/<name>/`.
2. Update related `docs/` guides when behavior, routing, or references change.
3. Run `node .toolkit/scripts/sync-mirror.mjs` to regenerate `.claude/skills/`.
4. Run tests, structure checks, strict guidance validation, and mirror checks.
5. Review `git diff -- .agents/skills .claude/skills docs`.
6. Commit source and mirror together after confirming the mirror has no hand-written-only changes.

## 5. Scripts, manifest, and CI changes

```bash
node --test scripts/lib/*.test.mjs
node scripts/build-starter.mjs --check
node .toolkit/scripts/check-ai-guidance.mjs --root . --strict
node .toolkit/scripts/sync-mirror.mjs --check
```

Changes to Skills, prompts, routing, or AI guidance also require the non-strict guidance check and the applicable Skill validator.

## 6. Troubleshooting

| Problem | Action |
| --- | --- |
| Mirror drift | Run `sync-mirror.mjs`, then run `--check` |
| Validator failure | Fix the reported code/file; do not bypass the rule |
| Unexpected install overwrite | Review `skipIfExists` and `distExcludes` |
| Upstream clone failure | Download the CI artifact and use `--offline` |
| Upgrade breaks tests | Preserve the diff, revert the upgrade, fix compatibility, then reapply |
| Tag/version mismatch | 根目录 manifest 的版本字段 must equal `v<version>` |

## 7. Release gate

Confirm version, bilingual docs, Skill mirror, tests, strict validation, and Starter build all pass. Push a matching `v*` tag; GitHub CI creates the release.
