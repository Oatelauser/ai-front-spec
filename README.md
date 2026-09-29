# ai-front-spec

[![CI](https://github.com/Oatelauser/ai-front-spec/actions/workflows/ci.yml/badge.svg)](https://github.com/Oatelauser/ai-front-spec/actions/workflows/ci.yml) [![vendored-check](https://github.com/Oatelauser/ai-front-spec/actions/workflows/vendored-check.yml/badge.svg)](https://github.com/Oatelauser/ai-front-spec/actions/workflows/vendored-check.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) [![Node >=20](https://img.shields.io/badge/node-%E2%89%A5%2020-green.svg)](https://nodejs.org)

面向 Codex 和 Claude Code 的前端项目 AI 规则 Starter：把项目事实、任务路由、设计流程、实现流程和验收要求放进仓库，让智能体先读约束，再做修改，并用证据交付。

## 先选入口

| 你要做什么 | 使用入口 | 详细手册 |
| --- | --- | --- |
| 安装 Starter 到项目 | `node scripts/build-starter.mjs --target <目录>` | [安装手册](docs/operations/INSTALL.md) |
| 初始化项目画像与组件目录 | `$project-profile` | [任务总览](docs/tasks/README.md) |
| 做专业视觉设计、多轮调整、定稿归档 | `$design-task` | [Design Task 手册](docs/tasks/DESIGN-TASK.md) |
| 把需求、截图、原型、Figma 或 HTML 做成页面 | `$frontend-task` | [Frontend Task 手册](docs/tasks/FRONTEND-TASK.md) |
| 在页面上圈选指认问题（"指哪打哪"） | `$page-annotate` | [Page Annotate 手册](docs/tasks/PAGE-ANNOTATE.md) |
| 升级内置 Skill、插件或镜像 | `node scripts/update-vendored.mjs` | [升级与 CI](docs/operations/UPGRADING.md) |
| 查看内置能力和外部插件 | — | [能力清单](docs/operations/BUILT-IN-CAPABILITIES.md) |
| 设计质量确定性检查（实现自查 / 验收对稿 / 精修清单 / 存量体检） | impeccable 插件（Claude Code）或 `npx impeccable`（Codex） | [能力清单 §2](docs/capabilities.md) |

## 最短路径

安装与环境要求见 [安装手册](docs/operations/INSTALL.md)；装完之后：

```bash
$frontend-task inspect
$frontend-task plan
$frontend-task confirm
$frontend-task implement
$frontend-task verify
$frontend-task report
```

## 核心规则

- `.agents/skills/` 是 Skill 人工源；`.claude/skills/` 是自动镜像，不要手改。
- 项目事实以画像、组件目录、代码、测试和接口契约为准；外部设计材料只负责它明确覆盖的事实。
- 页面任务在 `inspect` 前读取项目画像、`deliveryTargets`、组件目录和页面规则。
- 高影响决定先确认再实现；未验证项必须报告，不能写成已完成。
- 根 README 只做入口导航；具体任务规则见 `docs/tasks/`，维护升级规则见 `docs/operations/`。

## 目录

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