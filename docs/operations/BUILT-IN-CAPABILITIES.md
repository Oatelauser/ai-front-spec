# 能力清单

版本和提交事实以 根目录 manifest 为准；本表只说明用途。自研能力的使用细节见 `docs/tasks/` 手册；vendored 能力的上游、许可与升级见 [能力安装清单](../capabilities.md)。

## 🛠️ 自研能力（6）

| Skill | 用途 | 使用手册 |
| --- | --- | --- |
| `frontend-task` | 前端任务全阶段流程（inspect → plan → confirm → implement → verify → report） | [FRONTEND-TASK.md](../tasks/FRONTEND-TASK.md) |
| `design-task` | 专业 UI 设计、多轮变体和定稿交接 | [DESIGN-TASK.md](../tasks/DESIGN-TASK.md) |
| `page-annotate` | 页面标注反馈"指哪打哪"：页面上圈选指认问题，agent 读回坐标与元素诊断后逐条修改；design-task 修订轮与 frontend-task 验收轮内建 | [PAGE-ANNOTATE.md](../tasks/PAGE-ANNOTATE.md) |
| `project-workflow` | agent 强制工作入口：项目事实、路由、执行、验证（内部契约，入口见 AGENTS.md） | — |
| `project-profile` | 项目画像、目标端和组件目录建档与维护（内部契约，入口见 AGENTS.md） | [PROJECT-PROFILE.md](../tasks/PROJECT-PROFILE.md) |
| `tinypng-compress` | 批量图片压缩（工具型，`$tinypng-compress` 直调） | — |

页面标注的浏览器双轨、标注操作与场景示例随手册走：[PAGE-ANNOTATE.md](../tasks/PAGE-ANNOTATE.md)。

## 📦 Vendored 内置能力（23，随包分发零安装）

上游快照、许可与升级基线见 [能力安装清单](../capabilities.md)。

| Skill | 用途 |
| --- | --- |
| `mobile-ux-optimizer` | 移动端触摸、视口、安全区和响应式 |
| `apple-design` | 物理感动效和可打断交互 |
| `gsap-core` / `gsap-performance` / `gsap-timeline` | GSAP 基础、性能和时间线 |
| `webapp-testing`（+ chrome-devtools MCP） | 浏览器自动化和真实 UI 验收 |
| `compatibility-testing` | 跨浏览器、平台和设备验证 |
| `karpathy-guidelines` | 精简、可验证、避免过度实现 |
| `api-design` | REST API 设计 |
| `frontend-design` / `frontend-design-direction` / `taste-skill` | 前端视觉方向和反模板设计 |
| `grill-me` / `grilling` | 方案质询和决策压力测试 |
| `product-design` | 设计探索、视觉复刻、UX 审计和原型 |
| `prototype` | 一次性方向/状态原型 |
| `react-best-practices` | React/Next.js 性能实践 |
| `security-review` | 身份、输入、接口和敏感功能安全检查 |
| `tdd-workflow` | 测试驱动开发流程 |
| `web-design-guidelines` | Web 界面、可访问性和 UX 审查 |
| `ui-ux-pro-max` | UI/UX 设计辅助 |

## 🧩 可选外部能力

| 能力 | 用途 | 约束 |
| --- | --- | --- |
| Figma | 读设计稿、生成原型、代码回写 | 按宿主安装清单和授权，先验证连接 |
| GitHub | PR、Issue、远端仓库 | 使用宿主连接器，不提交 token |
| Product Design plugin | 宿主相关设计子能力 | 以当前宿主版本为准 |
| Browser/Chrome/Computer Use | 真实 UI 验收或登录态流程 | 只在宿主实际暴露时使用 |
| Impeccable | 确定性 UI 检查 | 可选外部能力，不是 Starter 必需项 |

## ⚖️ 选择原则

先用内置能力；需要外部能力时读取 `docs/capabilities.md` 和宿主安装清单；外部插件/MCP 只有宿主实际安装或连接成功才算可用；不可用就报告缺口并走降级路径，不能假装已连接。
