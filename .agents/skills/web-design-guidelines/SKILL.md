---
name: web-design-guidelines
description: Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".
metadata:
  author: vercel
  version: "1.0.0"
  argument-hint: <file-or-pattern>
---

# Web Interface Guidelines

Review files for compliance with Web Interface Guidelines.

## How It Works

1. Read the bundled guidelines in `command.md`（同目录，随库分发，零外部下载）
2. Read the specified files (or prompt user for files/pattern)
3. Check against all rules in the guidelines
4. Output findings in the terse `file:line` format

## Guidelines Source

- 规则全文：本目录 `command.md`（快照，来源 github.com/vercel-labs/web-interface-guidelines）
- 内容源许可：本目录 `LICENSE-content-source`
- 更新方式：重新 vendor——从上游仓库取最新 `command.md` 覆盖本文件同目录副本

## Usage

When a user provides a file or pattern argument:
1. Read the bundled `command.md` in this skill directory
2. Read the specified files
3. Apply all rules from the guidelines
4. Output findings using the format specified in the guidelines

If no files specified, ask the user which files to review.
