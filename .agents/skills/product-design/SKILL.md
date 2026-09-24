---
name: product-design
description: Product Design toolkit (vendored snapshot v0.1.52) — design exploration, visual cloning, UX research/audit, and prototyping. This top-level skill routes to its sub-skills. Use when the user asks to explore a design, research UX, audit a flow, clone a visual source (image/URL), QA a built design, or share a prototype.
---

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

## 宿主能力边界（先判宿主再选子技能）

vendor 拷贝的是指令文本，不是 OpenAI 宿主运行时服务。调用子技能前按下表判定本宿主可用面；无对应能力时走「等价路径」完成同等目标，不得宣称已使用该子技能。

判定方法：以当前会话实际可发现的能力为准——能发现 `sites-preview` 工具或 `$product-design:index` 命名空间（官方插件在宿主注册的标志）即视为具备 OpenAI 运行时；探测不到即走等价路径，不凭宿主名称或模型记忆猜测。

| 子技能 | 依赖的宿主服务 | 无该能力时的等价路径 |
| --- | --- | --- |
| `image-to-code` / `url-to-code` | `sites-preview` 预览、cloud browser（`terminal.local`）验收、Sites 部署（ChatGPT Work Mode 运行时） | `$frontend-task` 的 [screenshot-workflow](../../frontend-task/references/screenshot-workflow.md)：代理视觉读图 + 像素测量 + 画像/组件目录实现（已实证等效复刻） |
| `ideate` | OpenAI Image Gen 图像生成 | 参考站/关键词 + `taste-skill` 或 `frontend-design` 出方向，原型变体页承载 |
| `design-qa` | ChatGPT Work Mode 云浏览器验收分支 | 本地浏览器（`playwright`）截图 + 代理视觉比对源图与渲染实现 |
| `index` | 路由与 Browser Choice 判定全宿主可用；其 Work Mode 分支按上表边界执行 | — |
| `share` / `get-context` / `research` / `audit` / `user-context` | 无特殊宿主依赖（方法论 + 本地脚本） | 全宿主直接使用 |
