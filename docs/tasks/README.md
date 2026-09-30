# 任务手册

本目录是执行设计和开发任务时的操作手册。根 `README.md` 只做导航；智能体执行时仍以 `.agents/skills/` 和项目画像为准。

## 🧭 选择入口

| 目标 | 入口 | 下一步 |
| --- | --- | --- |
| 初始化或维护项目画像与组件目录 | `$project-profile` | 阅读 [PROJECT-PROFILE.md](PROJECT-PROFILE.md) |
| 一次性验证交互或视觉方向 | `$prototype` | 原型验证后决定是否进入开发 |
| 专业视觉设计、多轮调整、定稿冻结 | `$design-task` | 阅读 [DESIGN-TASK.md](DESIGN-TASK.md) |
| 从需求/截图/原型/Figma/HTML 实现页面 | `$frontend-task` | 阅读 [FRONTEND-TASK.md](FRONTEND-TASK.md) |
| 在页面上圈选指认问题（"指哪打哪"） | `$page-annotate` | 阅读 [PAGE-ANNOTATE.md](PAGE-ANNOTATE.md) |
| 设计稿已经定稿，需要工程实现 | `$design-task` → `$frontend-task` | 先完成视觉交接，再进入实现 |

## 🎛️ 通用生命周期

```text
读取项目事实 → 分类任务和来源 → 识别缺口
→ plan → confirm 高影响决定 → implement
→ verify → report 证据
```

## 🚧 前端任务硬门槛

在 `inspect` 前，以及 `plan`、`implement`、`verify`、`report` 阶段持续读取：

- `AGENTS.md`
- `docs/PROJECT_PROFILE.md` 的“支持端与运行环境”
- `.toolkit/profile-state.json` 的 `deliveryTargets`
- `docs/rules/AI_COMPONENT_CATALOG.md`
- `docs/rules/AI_FRONTEND_TASK.md`
- 与输入来源匹配的 `frontend-task/references/*.md`

`deliveryTargets` 缺失、冲突或为 `deferred` 时不得猜测目标端，转 `$project-profile update`。

## 🗂️ 任务类型

- `new-page`：先确定流程、路由、状态、接口、权限、组件和目标端。
- `incremental`：锁定变化区域并保护邻近行为。
- `bug-fix`：先复现，再修复，再重放原失败和邻近正常路径。
- `refactor`：证明路由、行为、数据、权限、状态和视觉等价；有行为变化就改分类。

## 📁 任务记录

复杂、视觉、多轮或可恢复任务保存到 `docs/tasks/<task>/`：

```text
PLAN.md STATE.json PROMPTS.md ACCEPTANCE.md REPORT.md
```

简单任务不创建空记录。
