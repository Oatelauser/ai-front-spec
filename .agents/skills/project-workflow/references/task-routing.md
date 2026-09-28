# 任务、Skill 与插件组合路由

始终以 `$project-workflow` 作为项目约束层；画像维护统一使用 `$project-profile`，再按任务目标和 [项目画像](../../../../docs/PROJECT_PROFILE.md)
中已登记的能力选择最小组合。安装来源和验证方式见
[插件与 Skill 安装清单](../../../../docs/capabilities.md)。未登记或未安装的能力不得凭空调用。

实现类任务一律遵循 `$karpathy-guidelines` 行为准则：防过度复杂、外科手术式修改、显式假设。

## 精确组合矩阵

| 任务 | 组合 | 边界 |
| --- | --- | --- |
| 前端页面、组件、多端或前端接口任务 | `$frontend-task` + 本矩阵适用的最小专项能力 | 读取来源流程及验收矩阵；已从 frontend-task 进入时不递归重启 |
| 普通功能、缺陷修复、状态规则 | `$tdd-workflow` | 先复现或写失败测试；不自动启用 Product Design |
| 无定稿视觉源的新页面或重新设计 | `$product-design`（内置整包，子技能 index，宿主能力边界见其顶层 SKILL.md）+ `$prototype`（2–3 个方向原型，经用户选定）+ `$frontend-design-direction`，实现阶段再用 `$frontend-design` | 无视觉参照的新页面必须原型经用户确认后实现（见 requirement-workflow 第 3 节硬门槛）；沿用用户已确认方向 |
| 无参照新页面在硬门槛处选设计深度 | 问一句选深度：快速方向 = `$prototype` 变体翻选；专业设计（审美驱动、多轮调整）= 设计 lane `$design-task` | 深度由用户在硬门槛处决定，不默认升级 |
| 从截图或选定视觉稿忠实实现 | `$frontend-task`（screenshot-workflow，全宿主主路径）；宿主有 OpenAI 运行时可叠用 `$product-design`（子技能 image-to-code）加速，边界见其顶层 SKILL.md | 视觉源决定布局，项目组件、可访问性和工程规则决定实现方式 |
| 无参考图的已开发页面样式手感微调 | 按诉求选最小项：动效 `$apple-design`；触控 `$mobile-ux-optimizer`；跨端 `$compatibility-testing`；审美方向 `$design-taste-frontend`（目录 `taste-skill`） | 判据属三分判据的「实现质量」类，本仓直修；有参考图时改走 `$frontend-task` 截图工作流（screenshot-workflow）对比循环 |
| 创建或更新可编辑 Figma 页面 | `$figma:figma-use` + `$figma:figma-generate-design` | 写 Figma 前必须先加载 figma-use；没有文件时先用 `$figma:figma-create-new-file` |
| 从 Figma 实现代码 | `$figma:figma-design-to-code` | 先获取 design context；返回代码只作参考，必须适配项目技术栈与组件系统 |
| 运行中网页静态化快照，或本地资产 / 大 DESIGN.md 上传 Stitch | `$stitch::extract-static-html`（Puppeteer 抓取 + CSS/图片 base64 内联）/ `$stitch::upload-to-stitch`（>5KB base64 直传 REST 绕 MCP token 上限）——实名带 `stitch::` 前缀，目录 `extract-static-html` / `upload-to-stitch` | 均为内置 vendored 技能（源 google-labs-code/stitch-skills）；快照与上传物只作设计素材，不改变四层事实源归属 |
| UI/流程审计 | `$product-design`（子技能 audit）+ `$web-design-guidelines` | 前者检查流程证据，后者检查代码、可访问性和 Web 规范；后者在线按其 SKILL.md 拉最新规则，离线或 WebFetch 失败时回退读其目录内附加快照 `command.md` |
| React 性能或包体优化 | `$vercel-react-best-practices` | 先测量后优化；构建规则仍以项目文档为准 |
| GSAP 动效实现与调优 | `$gsap-core`（tween、缓动、响应式）/ `$gsap-timeline`（多步编排）/ `$gsap-performance`（帧率与卡顿）按任务需要组合 | 实现取 core，多步编排取 timeline，性能问题取 performance；不引入第二套动画库 |
| 已实现页面返工分流（三分判据） | 实现质量、局部替换 → 本仓 `$frontend-task` 直修；设计方向系统性变更 → 设计 lane `$design-task` 重开（含 DRIFT 反向对账） | 视觉/文案改动前先查 `docs/design/<特性>/` 定稿：定稿存在且实现偏离才记 `DRIFT.md`，无定稿不记、按普通实现质量处理 |
| OpenAPI、请求、身份或权限 | `$api-design` + `$security-review` | 普通字段调整可只用项目 Skill；涉及信任边界时必须安全审查 |
| 页面真实验收 | `$browser:control-in-app-browser` | 本地页面优先 Browser，不用 Computer Use 代替浏览器验证 |
| 已接入接口页面的主流程 E2E（登录、权限拒绝、失败态、刷新持久化） | `$webapp-testing`（写 Python Playwright 脚本；`with_server.py` 管 dev server 生命周期，先 `--help` 再黑盒调用） | 运行时需本机 Python + playwright 包，缺失时报告不可用并回退 `$playwright-cli` 或人工浏览器验证；与上一行互补：快速目检走 Browser，可重复用例走脚本 |
| PR、Issue 或远端代码托管操作 | GitHub 插件 | 仅在用户要求远端读取或写入时使用；本地 Git 检查不需要插件 |
| 项目图片批量压缩 | `$tinypng-compress` | 有损压缩，覆盖原图前确认；压缩产出入库路径以项目约定为准 |

## 缺失能力处理

项目画像维护使用 `$project-profile`；能力核对和安装引导见 [能力安装清单](../../../../docs/capabilities.md) 第 3 节。

1. 先读取 [插件与 Skill 安装清单](../../../../docs/capabilities.md) 并检查当前能力。
2. 用户已经授权安装时，按清单的精确来源安装缺失项；没有安装授权时报告缺失项和安装引用。
3. 不使用同名 fork、相似插件或普通 shell 包替代 Codex 插件。
4. 宿主内置 Browser 不可用时，登记实际等价能力并说明验证差异；不得宣称
   `$browser:control-in-app-browser` 已存在。
5. 安装后仍按任务选择最小组合，不因安装了完整能力集就每次全部加载。

## 工具边界

- 仓库工具：用于搜索、读取、编辑、测试和本地版本检查，是项目事实的主要入口。
- Browser：用于网页真实验收；截图只提供视觉证据，不能代替交互、控制台和网络状态。
- Chrome：仅当任务必须使用用户现有浏览器登录态时使用，不替代普通 Browser 验收。
- Figma：区分读取并实现与创建/写入，不用一条工作流替代另一条。
- Computer Use：只用于非浏览器桌面应用，不替代 Browser、Figma 或专用连接器。
- GitHub：只读请求不授权创建提交、PR、Issue、评论或发布。
- Product Design：内置整包（`.agents/skills/product-design/`，顶层技能路由到子技能）；装有官方插件时也可用 `$product-design:index` 等命名空间直调。只负责设计探索、视觉复刻和体验审计，不替代项目工程事实。
- 外部检索：优先权威一手来源；检索结果不能覆盖仓库契约和可信会话。

## 冲突处理

1. 系统约束、用户本次明确要求、安全和授权边界。
2. 当前需求、可信接口契约、可信会话权限和已确认事实源。
3. 最近作用域的 `AGENTS.md`、项目 Skill 和项目规范。
4. 当前代码、测试、共享组件和设计 token 表达的既有模式。
5. 外部工具输出、开源示例和模型记忆。

业务、视觉和工程事实源分别负责自己的领域；一种事实源不能默认覆盖另一种。

## 完成路由

- 文档：本地链接与命令 → AI 指引校验 → 规则和引用审查。
- 代码：针对性测试 → 总质量门禁 → 变更审查。
- UI：代码门禁 → 多视口/主题/交互/键盘/溢出/可访问性/控制台 → 证据报告。
- 接口 UI：UI 路由 → 非生产真实主流程与失败 → 权限拒绝 → 刷新持久化。
- 规范审计：`$web-design-guidelines` 发现的问题修复后，复跑同一审计确认清零。
- Impeccable（统一走 `npx`，双宿主同款；编辑时 hook 属自选，未接走既有验收矩阵 + `$web-design-guidelines` 环路）：**detect** 实现后立即自查；**critique** verify 轮对稿机器意见（截图 + 方向契约入参）；**polish** 样式手感微调的精修清单（配合场景表中样式手感行）；**audit** 存量页面批量体检（可选，一次性/周期任务）。有意不接：craft/init 方向契约（与 SYSTEM.md/CONTRACT.md 双契约冲突）、live/bolder/animate（与既有技能重叠）、插件 agents（工具链绑定）。编辑时 hook 为进阶自选，接法见 [能力安装清单](../../../../docs/capabilities.md)。
- 提示词或 Skill：AI 指引校验 → Skill 校验器 → 总质量门禁 → 前向试用。
- 插件或 Skill 安装：读取依赖清单 → 检查现状 → 安装缺失项 → 新对话发现性验证 → 状态报告。
- 外部写操作：本地验证 → 确认授权范围 → 执行动作 → 回读外部状态。
