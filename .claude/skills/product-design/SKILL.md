---
name: product-design
description: Product Design toolkit (vendored snapshot v0.1.52) — design exploration, visual cloning, UX research/audit, and prototyping. This top-level skill routes to its sub-skills. Use when the user asks to explore a design, research UX, audit a flow, clone a visual source (image/URL), QA a built design, or share a prototype.
---
<!-- AUTO-GENERATED from .agents/skills/product-design. DO NOT EDIT. Run: node .toolkit/scripts/sync-mirror.mjs -->

# Product Design（内置整包）

本目录是 OpenAI `product-design` 插件 **v0.1.52** 的整包快照（2026-09-23 自本机插件缓存 vendor，上游无公开源码仓）。除本路由文件自写外，包内文件保持上游原样；子技能互依（`../index/`、`references/`、`scripts/`、`templates/`），不得只抄子集。

## 子技能地图（skills/）

| 子技能 | 用途 |
| --- | --- |
| `index` | 总路由：设计探索 / UX 研究 / 审计 / 视觉复刻 / 原型分享的入口判定 |
| `get-context` | 设计简报闸门：ideation / image-to-code / 重设计前先澄清产品与目标 |
| `research` | 来源落地的 UX 痛点研究（用户抱怨、onboarding、文档、DX 摩擦） |
| `ideate` | 从简报生成图像版设计变体、remix、新方向 |
| `image-to-code` | 把选定图片/截图/mockup 实现为忠实响应式前端 |
| `url-to-code` | 克隆线上 URL 为本地可运行前端 |
| `audit` | 截图取证后对流程/漏斗/多步体验做 UX、设计与可访问性审计 |
| `design-qa` | 内部 QA：源视觉目标 vs 渲染实现的比对（仅原型/复刻构建后） |
| `share` | 用用户偏好的部署工具分享可运行原型 |
| `user-context` | 载入/管理 Product Design 的持久用户上下文（来源、偏好、资产） |

包级 `references/`、`scripts/`、`templates/`、`agents/`、`assets/` 由子技能按相对路径消费。

## 与官方插件的关系

装有官方 `product-design@openai-api-curated` 插件的 Codex 宿主可直接用命名空间调用（如 `$product-design:index`），以插件版为准；本内置包服务于无插件宿主（含 Claude Code 镜像路径），任务路由见 `project-workflow/references/task-routing.md`。许可状态与再分发边界见仓库根 `NOTICE`。
