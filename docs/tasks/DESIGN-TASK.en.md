# Design Task Guide

`$design-task` is the professional UI design lane: design-system first, 2–3 visual variants, user selection, multi-round refinement, and a frozen handoff. It does not write business code or framework routes; implementation belongs to `$frontend-task`.

## 1. When to use it

Use `$design-task` for branded or aesthetic interfaces, multi-round visual refinement, design-system work, or a final version that must be handed to engineering.

Use `$prototype` for a one-off direction, interaction, or state experiment. Use `$frontend-task` for spacing, alignment, copy, or local implementation fixes. Reopen this lane for a systemic visual-direction change.

## 2. Read before starting

```text
AGENTS.md
docs/PROJECT_PROFILE.md
.toolkit/profile-state.json → deliveryTargets
docs/rules/AI_COMPONENT_CATALOG.md
```

If targets are missing, conflicted, or deferred, route to `$project-profile update`. When `webview` or `mobileH5` is confirmed, account for touch targets, safe areas, short screens, and scroll containers during design.

## 3. Standard flow

### 3.1 Brief

Record the business goal, users, page/flow, targets, density, brand constraints, existing components, preserved behavior, assets, and acceptance criteria. Use `.agents/skills/design-task/templates/design-brief.md` as a starting point.

### 3.2 Design system

Settle semantic colors, type hierarchy, radius, spacing, shadows, density, modes, and anti-patterns first. Inherit `SYSTEM.md` when present; otherwise freeze the system before screens. If Stitch is available, create a design system, pass the same `designSystem` to every Screen, and read every screen back after updates.

### 3.3 Stitch generation

```text
list_projects
→ create_project when needed
→ get_project
→ generate_screen_from_text
→ list_screens / get_screen
→ generate_variants
```

Explore one dimension at a time: `COLOR_SCHEME`, `LAYOUT`, `TEXT_FONT`, `TEXT_CONTENT`, or `IMAGES`. Usually generate 2–3 variants. Record prompts, projectId, screenId, dimensions, version, and selection reason in `PROMPTS.md`.

If Stitch is unavailable, use a self-authored HTML prototype and report the fallback reason.

### 3.4 Refinement

Use scoped prompts with one target and a keep-unchanged list:

```text
Only change the primary button in the Hero area: use the brand color; keep size, copy, navigation, and footer unchanged.
```

A successful `edit_screens` response is not proof of persistence. Read HTML, screenshot, and metadata again. If unchanged, preserve the old snapshot, use the web UI, or regenerate, and record the source.

### 3.5 Download and archive

Use this ladder:

1. Direct GET with an explicit proxy, manual redirects, and checks for `200`, content type, DOCTYPE, and real title; do not create a successful snapshot on failure.
2. An authorized host browser session.
3. Stitch web export ZIP, then unpack and archive it.

`downloadUrl` is temporary and must not enter production code. Track images, fonts, and icons separately; validate PNG magic bytes.

Recommended structure:

```text
.stitch/project.json
.stitch/manifest.json
.stitch/snapshots/<screen-id>/<snapshot-id>/
  source-response.json screen.json screen.html screenshot.png
  assets/ design-tokens.json layout-metrics.json checksums.json

docs/design/system/SYSTEM.md
docs/design/<feature>/vN/
  code.html DESIGN.md screen.png PROMPTS.md CONTRACT.md
```

Snapshots are immutable. Record CSS viewport, screenshot pixels, and DPR; use `null` for unknown DPR.

### 3.6 Freeze

Check content drift, unexpected modules, truncation, placeholders, colors, typography, spacing, and target support. Increment the version; never overwrite a prior final design.

## 4. Handoff to `$frontend-task`

Include the selected visual version, covered regions/states, route and engineering constraints, interaction contract and gaps, asset inventory, and viewport/theme/keyboard/touch/overflow/screenshot baseline.

`screen.png` is a reference, not a background; `code.html` is a reference, not production code.

## 5. Scenario matrix

| Scenario | Action |
| --- | --- |
| New page without reference | `$prototype` for fast direction; `$design-task` for professional design |
| Existing design system | Read `SYSTEM.md`, inherit tokens, then design |
| Multiple visual directions | Change one dimension at a time; let the user select before refinement |
| Design-system upgrade | Create a new system version, apply it, and read every screen back |
| Stitch download failure | Preserve failure evidence; switch to browser or ZIP; never fake success |
| Implementation drift | Classify quality, local replacement, or direction change before routing |
