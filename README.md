# ai-front-spec

[![CI](https://github.com/Oatelauser/ai-front-spec/actions/workflows/ci.yml/badge.svg)](https://github.com/Oatelauser/ai-front-spec/actions/workflows/ci.yml) [![vendored-check](https://github.com/Oatelauser/ai-front-spec/actions/workflows/vendored-check.yml/badge.svg)](https://github.com/Oatelauser/ai-front-spec/actions/workflows/vendored-check.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) [![Node >=20](https://img.shields.io/badge/node-%E2%89%A5%2020-green.svg)](https://nodejs.org)

**面向 Codex 和 Claude Code 的前端项目 AI 规则 Starter** —— 把项目事实、任务路由、设计流程、实现流程和验收要求放进仓库：智能体先读约束、再做修改、用证据交付，不做「看起来好了」式开发。

## ✨ 为什么选 ai-front-spec

| 💡 亮点 | 说明 |
|---|---|
| 🧭 **先读后写** | 项目画像 + 组件目录把项目事实（目标端、技术栈、命令、权限、验收参数）放进仓库——agent 动手前先读约束，不凭模型记忆猜你的项目 |
| 💬 **双宿主，一套规则** | `.agents/skills/`（人工源）+ `.claude/skills/`（自动镜像），Codex 与 Claude Code 同时生效，不用维护两份提示词 |
| 🛤️ **三 lane 全流程** | 专业设计（`$design-task` 出稿翻选定稿）→ 工程实现（`$frontend-task` 六命令链）→ 验收微调（`$page-annotate` 指哪打哪），从一句话需求到带证据交付 |
| 📍 **指哪打哪验收** | 反馈不用文字描述位置——直接在浏览器页面上圈选，agent 读回坐标与元素诊断逐条修，改完刷新对照上一轮标注 |
| 📦 **29 项 Skill 开箱自带** | 自研 6 + vendored 23（anthropics、vercel-labs、GSAP 等上游），零安装命令；CI 每周盯上游提交，离线 bundle 升级带逐文件 diff 审查，不悄悄丢功能 |
| 🧾 **证据交付** | 四维结果（visual / behavior / data / engineering）如实报告，没验证的标 `unverified`——HTTP 200 不算业务成功，mock 不算真实联调 |
| 🚦 **质量门禁** | strict 提示词一致性校验（42 文件）+ 单测 + 双目录镜像检查 + 双 OS CI 矩阵，规则漂移当场红 |

## 🧭 先选入口

| 你要做什么 | 使用入口 | 详细手册 |
| --- | --- | --- |
| 安装 Starter 到项目 | `node scripts/build-starter.mjs --target <目录>` | [安装手册](docs/operations/INSTALL.md) |
| 初始化项目画像与组件目录 | `$project-profile` | [Project Profile 手册](docs/tasks/PROJECT-PROFILE.md) |
| 做专业视觉设计、多轮调整、定稿归档 | `$design-task` | [Design Task 手册](docs/tasks/DESIGN-TASK.md) |
| 把需求、截图、原型、Figma 或 HTML 做成页面 | `$frontend-task` | [Frontend Task 手册](docs/tasks/FRONTEND-TASK.md) |
| 在页面上圈选指认问题（"指哪打哪"） | `$page-annotate` | [Page Annotate 手册](docs/tasks/PAGE-ANNOTATE.md) |
| 升级内置 Skill、插件或镜像 | `node scripts/update-vendored.mjs` | [升级与 CI](docs/operations/UPGRADING.md) |
| 查看内置能力和外部插件 | — | [能力清单](docs/operations/BUILT-IN-CAPABILITIES.md) |
| 设计质量确定性检查（实现自查 / 验收对稿 / 精修清单 / 存量体检） | impeccable 插件（Claude Code）或 `npx impeccable`（Codex） | [能力清单 §2](docs/capabilities.md) |

## 🚀 最短路径

安装与环境要求见 [安装手册](docs/operations/INSTALL.md)；装完之后：

```bash
$frontend-task inspect
$frontend-task plan
$frontend-task confirm
$frontend-task implement
$frontend-task verify
$frontend-task report
```

## 📜 核心规则

- `.agents/skills/` 是 Skill 人工源；`.claude/skills/` 是自动镜像，不要手改。
- 项目事实以画像、组件目录、代码、测试和接口契约为准；外部设计材料只负责它明确覆盖的事实。
- 页面任务在 `inspect` 前读取项目画像、`deliveryTargets`、组件目录和页面规则。
- 高影响决定先确认再实现；未验证项必须报告，不能写成已完成。
- 根 README 只做入口导航；具体任务规则见 `docs/tasks/`，维护升级规则见 `docs/operations/`。

## 📁 目录

```text
.agents/skills/        Skill 人工源
.claude/skills/        Claude Code 自动镜像
.toolkit/              校验器、镜像脚本和安装期运行文件
scripts/               Starter 构建、升级、移除工具
docs/tasks/            设计与前端任务手册
docs/operations/       安装、能力、升级、CI 与故障排查手册
toolkit.json           版本、Skill roster、vendored 来源和发布清单
```

维护者从 [运维手册](docs/operations/README.md) 开始；任务执行者从 [任务手册](docs/tasks/README.md) 开始。

## License

MIT，见 [LICENSE](LICENSE)。