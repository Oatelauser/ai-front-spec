# 内置能力清单

版本和提交事实以 根目录 manifest 为准；本表只说明用途。`根目录 manifest 的 skills 字段` 是 Starter roster，`根目录 manifest 的 vendored 字段` 记录可同步来源。

## 内置 Skill

| Skill | 用途 |
| --- | --- |
| `project-workflow` | 项目事实、任务路由、计划、实现、验证和交付 |
| `project-profile` | 项目画像、目标端和组件目录 |
| `frontend-task` | 前端任务全阶段流程 |
| `design-task` | 专业 UI 设计、多轮变体和定稿交接 |
| `mobile-ux-optimizer` | 移动端触摸、视口、安全区和响应式 |
| `apple-design` | 物理感动效和可打断交互 |
| `gsap-core` / `gsap-performance` / `gsap-timeline` | GSAP 基础、性能和时间线 |
| `tinypng-compress` | 图片压缩 |
| `webapp-testing`（+ chrome-devtools MCP） | 浏览器自动化和真实 UI 验收 |
| `page-annotate`（+ chrome-devtools MCP 双轨） | 页面标注反馈"指哪打哪"：用户在页面上圈选区域指认问题，agent 读回坐标与元素诊断；design-task 修订轮与 frontend-task 验收轮内建（见下节开启方法） |
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

## 浏览器双轨与页面标注

`$page-annotate` 走 chrome-devtools MCP（项目 vendor 内置）双入口：

| 轨 | 入口 | 用途 |
| --- | --- | --- |
| 隔离轨（默认） | `chrome-devtools` | agent 自动弹一个独立 Chrome 窗口，打开原型/dev 页给你标注，零配置 |
| 用户轨 | `chrome-devtools-user`（`--autoConnect`） | 连接**你自己正开着的 Chrome**（真实登录页、内网系统） |

**用户轨开启方法**（只需一次浏览器内操作，不用改任何配置）：在 Chrome 地址栏打开 `chrome://inspect/#remote-debugging` → 打开页面上的开关 → 首次连接时浏览器弹"允许调试连接"点允许 → 用完回到同一页面把开关关掉。开关没开时调用会明确报错提示去开（fail-loud，绝不静默换轨或自启浏览器）。

**哪里用得上**：`$design-task` 修订轮（说"我指给你看"）、`$frontend-task` 验收轮（说"在页面上标一下"），或任何时刻直接说"在页面上圈一下"。标注器是只读装饰，不改动页面行为；用户轨等于真实身份，agent 在真实页面只读不写。

## 内置、vendored 与宿主插件

- `根目录 manifest 的 skills 字段`：Starter 分发的能力 roster。
- `根目录 manifest 的 vendored 字段`：上游 repo、path、commit、snapshot 和内容来源。
- `pkg` 条目：由 npm 包提供；本地插件快照不代表所有宿主都能调用。
- `.claude/skills/`：由 `.agents/skills/` 生成，不是独立源。
- 外部插件/MCP：只有宿主实际安装或连接成功才算可用。

## 常见可选能力

| 能力 | 用途 | 约束 |
| --- | --- | --- |
| Figma | 读设计稿、生成原型、代码回写 | 按宿主安装清单和授权，先验证连接 |
| GitHub | PR、Issue、远端仓库 | 使用宿主连接器，不提交 token |
| Product Design plugin | 宿主相关设计子能力 | 以当前宿主版本为准 |
| Browser/Chrome/Computer Use | 真实 UI 验收或登录态流程 | 只在宿主实际暴露时使用 |
| Impeccable | 确定性 UI 检查 | 可选外部能力，不是 Starter 必需项 |

## 选择原则

先用内置能力；需要外部能力时读取 `docs/capabilities.md` 和宿主安装清单；不可用就报告缺口并走降级路径，不能假装已连接。
