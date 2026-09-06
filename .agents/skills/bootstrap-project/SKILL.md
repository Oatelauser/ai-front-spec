---
name: bootstrap-project
description: Initialize or update frontend project rules in the current repository using its bundled resources, repository facts, protected merges, and validation.
---

# Bootstrap Project

Use for first initialization or project-rule updates, including a repository that contains template resources but no business application. Default to the current repository. When the user asks to build an application, rule initialization is a preparation step within that task; continue authorized scaffolding and frontend work afterward.

1. Resolve the current project root and its bundled `resources/toolkit.json`. Read [resource lifecycle](references/resource-lifecycle.md). Resource source and destination may share this root; template metadata never prohibits development here. Use another project root only when the user explicitly requests it.
2. Inspect target code, package scripts, lockfiles, runtime, CI, tests, API/design documents and existing rules. Read [profile selection](references/profile-selection.md) and [field evidence](references/profile-schema.md). Templates are candidates, never repository facts.
3. Read [confirmation flow](references/confirmation-flow.md) and [merge policy](references/merge-policy.md). Produce field decisions and a file change plan using `resources/toolkit.json`. Resolve same-file entries before copying, preserve existing Skills, and merge generated guidance with the root starter AGENTS. Existing session authorization applies; request only missing consequential decisions.
4. Generate or merge PROJECT_PROFILE, then AGENTS, docs, approved Skills, config and optional local resources in the documented order. Preserve existing business code and rules. Populate the project manifest from actual writes, never from planned writes.
5. For an authorized new application, follow [project creation](references/project-creation.md) in this same root, update the profile from the resulting code and commands, and continue through frontend-task. If only rules were requested, finish rules without inventing a business application.
6. Execute [initialization acceptance](references/acceptance-checklist.md). Distinguish draft, initialized, capability discoverability and business readiness. Report actual commands, preserved files and remaining evidence gaps. Capability installation and external operations follow their own task authorization.


