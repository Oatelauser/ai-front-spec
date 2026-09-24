---
name: tinypng-compress
description: Compress PNG/JPG/JPEG project images with the TinyPNG API using a bundled no-dependency Node.js CLI. Use when Codex needs to batch compress images, optimize public assets, shrink Figma-exported images, make TinyPNG compression reusable across projects, or handle Chinese requests like "压缩图片", "TinyPNG", "图片瘦身", "批量压缩".
---
<!-- AUTO-GENERATED from .agents/skills/tinypng-compress. DO NOT EDIT. Run: node .toolkit/scripts/sync-mirror.mjs -->

# TinyPNG Compress

## Overview

Use the bundled `scripts/tinypng-compress.cjs` script to compress project image assets through the TinyPNG API without adding dependencies to the target project.

The script overwrites matched image files in place and writes a `.tinypng-compressed.json` tracking file so unchanged files can be skipped on later runs.

## Workflow

1. Identify the smallest target directory that contains the assets, such as `public/figma-assets`, `public/assets`, or `src/assets`.
2. Run a dry-run first:

```powershell
node "<skill-dir>\scripts\tinypng-compress.cjs" "<target-dir>" --dry-run
```

3. Ensure the API key is available through `TINYPNG_API_KEY`. Never hardcode the key in a project script, skill, or committed file.
4. Compress after the dry-run output looks right:

```powershell
$env:TINYPNG_API_KEY = "<tiny-png-api-key>"
node "<skill-dir>\scripts\tinypng-compress.cjs" "<target-dir>" --passes 2
```

5. Review the project diff after compression because image files are changed in place.

## Script Options

Use these options when the target project needs different behavior:

- `--passes <number>`: compress each file multiple times. Default is `2` to match the source project behavior.
- `--extensions <list>`: comma-separated extensions. Default is `png,jpg,jpeg`.
- `--track-file <path>`: custom tracking JSON path. Default is `.tinypng-compressed.json` in the target directory.
- `--force`: ignore the tracking file and recompress matched files.
- `--no-recursive`: scan only the target directory.
- `--dry-run`: list matched pending files without uploading or writing.

If no target directory is passed, the script uses `public/figma-assets` only when that directory exists in the current project. Otherwise pass the target explicitly.

## Safety Notes

- Treat TinyPNG API keys as secrets. If a key is found hardcoded in a repository, remove it and tell the user to rotate it.
- Prefer narrow target directories over project roots. The script skips common build/dependency directories when recursive scanning is enabled.
- The tracking file stores relative paths and compressed byte sizes; keep or ignore it according to the target project's convention.

## Examples

Compress the current project's Figma assets:

```powershell
node "<skill-dir>\scripts\tinypng-compress.cjs" "public/figma-assets" --passes 2
```

Compress only top-level PNG files:

```powershell
node "<skill-dir>\scripts\tinypng-compress.cjs" "public/assets" --extensions png --no-recursive
```
