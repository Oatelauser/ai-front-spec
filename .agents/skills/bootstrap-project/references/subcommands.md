# Bootstrap subcommands

This is the command contract for `$bootstrap-project`. These are skill-level intents; a repository script may expose the same names later.

## Commands

| Command | Purpose | Writes |
| --- | --- | --- |
| `init` | Orchestrate all authorized stages in dependency order | Yes, after confirmation |
| `status` | Show stage, profile, migration and drift state | No |
| `inspect` | Collect repository facts, resources and template candidates | No |
| `profile init` | Select a template and create the first profile plan | Plan plus confirmed apply |
| `profile plan` | Plan profile completion or update from current evidence | Plan artifact only |
| `profile apply` | Apply a current, confirmed profile plan | Yes |
| `profile migrate plan/apply` | Plan and apply an explicitly requested template/schema migration | Plan / yes |
| `guidance plan/apply` | Plan/apply AGENTS, docs and configuration merges | Plan / yes |
| `capabilities plan/apply` | Plan/apply project-local Skills and capability resources | Plan / yes |
| `scaffold plan/apply` | Plan/apply authorized application creation | Plan / yes |
| `validate` | Run initialization and strict validation for selected stages | Validation record |
| `resume` | Apply confirmed pending plans whose inputs are still current | Yes |
| `report` | Summarize every stage and unresolved evidence | No |

`init` is equivalent to `inspect`, profile preparation, then the requested guidance, capability, scaffold and validation stages. It must not scaffold an application without explicit authorization. `profile init` is the first-run convenience flow; `profile migrate plan/apply` is the explicit change flow after initialization.

## Plan/apply protocol

Every mutating stage follows:

```text
inspect -> plan -> user confirmation -> apply -> validate
```

The plan records a `planId`, stage, input fingerprint, proposed file operations, conflicts, unresolved decisions and required confirmation. `apply` refuses a stale plan when the repository or relevant resources changed; run the plan command again. There is no implicit force-overwrite path.

## Stage dependencies

- `inspect` has no prerequisite and is read-only.
- `profile plan` may invoke `inspect`; `profile apply` requires a current confirmed plan.
- `guidance` consumes the selected/draft profile but may proceed with documented low-impact gaps.
- `capabilities` consumes the guidance/config plan and existing project state.
- `scaffold` requires an authorized application-creation decision and a selected framework; unresolved high-impact business decisions limit only dependent scaffolding.
- `validate` and `report` can run after any subset of stages and must state which stages were skipped.
- `resume` never invents confirmation; it applies only plans already confirmed by the user.

## Manual edits and migration

Manual edits do not trigger reconciliation. `status` may report drift or conflict, but only an explicit `profile plan`, `profile migrate`, or relevant `guidance plan` computes a change. User-confirmed and repository-fact values are preserved; template defaults fill only unresolved/default fields. Conflicts require a new confirmation.
