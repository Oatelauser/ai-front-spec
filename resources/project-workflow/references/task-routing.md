# 任务、Skill 与插件组合路由

始终以 `$project-workflow` 作为项目约束层，再按任务目标和 [项目画像](../../../../docs/PROJECT_PROFILE.md)
中已登记的能力选择最小组合。安装来源和验证方式见
[插件与 Skill 安装清单](../../../../docs/CODEX_CAPABILITIES.md)。未登记或未安装的能力不得凭空调用。

## 精确组合矩阵

| 任务 | 组合 | 边界 |
| --- | --- | --- |
| 前端页面、组件、多端或前端接口任务 | `$frontend-task` + 本矩阵适用的最小专项能力 | 读取来源流程及验收矩阵；已从 frontend-task 进入时不递归重启 |
| 普通功能、缺陷修复、状态规则 | `$tdd-workflow` | 先复现或写失败测试；不自动启用 Product Design |
| 无定稿视觉源的新页面或重新设计 | `$product-design:index` + `$frontend-design-direction`，实现阶段再用 `$frontend-design` | 沿用用户已确认方向；未决定且影响实现的视觉选择先提出方案确认 |
| 从截图或选定视觉稿忠实实现 | `$product-design:image-to-code` | 视觉源决定布局，项目组件、可访问性和工程规则决定实现方式 |
| 创建或更新可编辑 Figma 页面 | `$figma:figma-use` + `$figma:figma-generate-design` | 写 Figma 前必须先加载 figma-use；没有文件时先用 `$figma:figma-create-new-file` |
| 从 Figma 实现代码 | `$figma:figma-design-to-code` | 先获取 design context；返回代码只作参考，必须适配项目技术栈与组件系统 |
| UI/流程审计 | `$product-design:audit` + `$web-design-guidelines` | 前者检查流程证据，后者检查代码、可访问性和 Web 规范 |
| React 性能或包体优化 | `$vercel-react-best-practices` | 先测量后优化；构建规则仍以项目文档为准 |
| OpenAPI、请求、身份或权限 | `$api-design` + `$security-review` | 普通字段调整可只用项目 Skill；涉及信任边界时必须安全审查 |
| 页面真实验收 | `$browser:control-in-app-browser` | 本地页面优先 Browser，不用 Computer Use 代替浏览器验证 |
| PR、Issue 或远端代码托管操作 | GitHub 插件 | 仅在用户要求远端读取或写入时使用；本地 Git 检查不需要插件 |

## 缺失能力处理

1. 先读取 [插件与 Skill 安装清单](../../../../docs/CODEX_CAPABILITIES.md) 并检查当前能力。
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
- Product Design：只负责设计探索、视觉复刻和体验审计，不替代项目工程事实。
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
- 提示词或 Skill：AI 指引校验 → Skill 校验器 → 总质量门禁 → 前向试用。
- 插件或 Skill 安装：读取依赖清单 → 检查现状 → 安装缺失项 → 新对话发现性验证 → 状态报告。
- 外部写操作：本地验证 → 确认授权范围 → 执行动作 → 回读外部状态。
