---
name: bootstrap-project
description: Initialize or update frontend project rules in the current repository using its bundled resources, repository facts, protected merges, and validation.
---

# Bootstrap Project

Use for first initialization or project-rule updates, including a repository that contains template resources but no business application. Default to the current repository. When the user asks to build an application, rule initialization is a preparation step within that task; continue authorized scaffolding and frontend work afterward.

## Command interface

Treat `$bootstrap-project` as an orchestration skill with explicit, independently resumable subcommands. The default `init` command runs the authorized stages in order; a user may invoke any stage directly when its prerequisites are satisfied. Read [subcommands](references/subcommands.md) and [state model](references/state-model.md) before planning a run.

```text
$bootstrap-project init
$bootstrap-project status | inspect | resume | report
$bootstrap-project profile init | plan | apply
$bootstrap-project profile migrate plan | apply
$bootstrap-project guidance plan | apply
$bootstrap-project capabilities plan | apply
$bootstrap-project scaffold plan | apply
$bootstrap-project validate
```

Mutating stages use `plan` then `apply`. Never infer an `apply` authorization from a plan, and never auto-trigger profile reconciliation because a user edited a generated file. A user must explicitly invoke the relevant `plan`, `migrate`, or `apply` subcommand.

1. Resolve the current project root and its bundled `resources/toolkit.json`. Read [resource lifecycle](references/resource-lifecycle.md). Resource source and destination may share this root; template metadata never prohibits development here. Use another project root only when the user explicitly requests it.
2. Read [subcommands](references/subcommands.md) and [state model](references/state-model.md), then inspect target code, package scripts, lockfiles, runtime, CI, tests, API/design documents and existing rules. Read [profile selection](references/profile-selection.md) and [field evidence](references/profile-schema.md). Templates are candidates, never repository facts.
3. Read [confirmation flow](references/confirmation-flow.md) and [merge policy](references/merge-policy.md). Produce field decisions and a stage plan using `resources/toolkit.json`. Resolve same-file entries before copying, preserve existing Skills, and merge generated guidance with the root starter AGENTS. Existing session authorization applies; request only missing consequential decisions.
4. Run the selected stage's `apply` only after its plan is current and confirmed. Generate or merge PROJECT_PROFILE, then AGENTS, docs, approved Skills, config and optional local resources in the documented order. Preserve existing business code and rules. Populate the project manifest from actual writes, never from planned writes.
5. For an authorized new application, follow [project creation](references/project-creation.md) in this same root, update the profile from the resulting code and commands, and continue through frontend-task. If only rules were requested, finish rules without inventing a business application.
6. Execute [initialization acceptance](references/acceptance-checklist.md) for the stages that ran. Distinguish bootstrap stage status from profile status, capability discoverability and business readiness. Report actual commands, preserved files, conflicts, overrides and remaining evidence gaps. Capability installation and external operations follow their own task authorization.


