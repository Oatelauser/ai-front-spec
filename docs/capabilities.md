# Codex 插件与 Skill 能力清单

维护版本：4.0.0。本文件自 4.0.0 起为「拷贝即用、零外部下载」三段制：内置技能合一清单、宿主插件（可选）、宿主内置插件核对。实际使用前只须核对当前宿主，不需要联网下载任何技能。

完整任务组合见 [任务路由](../.agents/skills/project-workflow/references/task-routing.md)。

## 目录

1. 内置技能（24，零安装）
2. 宿主插件（可选）
3. 宿主内置插件核对

## 1. 内置技能（24，零安装）

全部技能随本 Starter 分发在 `.agents/skills/`（Codex 与 Claude Code 双宿主同源，镜像见 `.claude/skills/`），复制项目后即可发现，不需要安装命令。**名称冲突时以内置版本为准**，不覆盖用户级同名 Skill。

自研 5 项：`project-workflow`、`project-profile`、`frontend-task`、`tinypng-compress`、`karpathy-guidelines`。

Vendored 19 项，遵守**零修改原则**：vendored 目录与上游字节一致，升级 = 新快照纯覆盖。本仓适配只允许两种形式——附加文件（上游不存在的文件名，如 `product-design` 整包 vendor 时上游无根 SKILL.md，我们的适配层是纯附加，重 vendor 天然幸存）或外层文档/路由。许可与修改记录见仓库根 `NOTICE`；更新方式为从「上游」列取最新快照覆盖 `.agents/skills/<目录>`，然后运行 `node .toolkit/scripts/sync-mirror.mjs` 重建镜像：

| 技能（目录） | 上游 | 本仓说明 |
| --- | --- | --- |
| `tdd-workflow` / `api-design` / `security-review` / `frontend-design-direction` | github.com/affaan-m/everything-claude-code | 2026-09-23 快照，MIT |
| `frontend-design` | github.com/anthropics/skills | 2026-09-23 快照，Apache-2.0（目录内 LICENSE.txt） |
| `taste-skill` | github.com/leonxlnx/taste-skill | 2026-09-23 快照，MIT；frontmatter 实名 `design-taste-frontend` |
| `grill-me` / `grilling` / `prototype` | claude-plugins-official/mattpocock-skills 1.2.3 | 2026-09-25 快照，MIT；grill-me（入口）与 grilling（协议）按上游依赖结构原样入库，零修改；prototype 支持无视觉参照新页面的方向原型硬门槛 |
| `web-design-guidelines` | github.com/vercel-labs/agent-skills（内容源 vercel-labs/web-interface-guidelines） | SKILL.md verbatim：在线按上游机制拉最新规则；`command.md` 为内容源规则快照（附加文件），离线/WebFetch 失败时按 task-routing 指示回退使用 |
| `react-best-practices` | github.com/vercel-labs/agent-skills | 2026-09-23 快照；frontmatter 实名 `vercel-react-best-practices` |
| `product-design` | OpenAI `product-design` 插件 v0.1.52 本机快照（无公开源码仓） | 整包 vendor，顶层薄路由自写；部分子技能（如 image-to-code）依赖 OpenAI 宿主能力，其他宿主仅方法论与测量/清册部分可用；许可状态见 NOTICE——用户已特赦公开分发（2026-09-24） |
| `gsap-core` / `gsap-performance` / `gsap-timeline` | github.com/greensock/gsap-skills | 经 elms-h5 技能包（20260917）迁入 |
| `apple-design` | github.com/emilkowalski/skills | 同上；上游已迭代，本仓为早期快照 |
| `compatibility-testing` | github.com/proffesor-for-testing/agentic-qe | 同上 |
| `mobile-ux-optimizer` | github.com/erichowens/some-claude-skills（原仓 404，延续仓同 MIT） | 同上 |
| `playwright` | github.com/microsoft/playwright-cli | 先在库，修改见目录内 NOTICE.txt |

内置 `product-design` 直调写作 `$product-design`（如 `$product-design` image-to-code / audit 用法见其顶层 SKILL.md 子技能地图）；装有官方插件的宿主也可用 `$product-design:index` 等命名空间直调，以插件版为准。

## 2. 宿主插件（可选）

内置技能之外，仅以下外部插件按需安装——「宿主插件可选」是唯一安装维度，没有核心/UI/React UI/Figma/完整等多模式预设；执行时按任务路由选择最小组合。

| 插件 | 精确引用（按宿主） | 用途 | 双路径 |
| --- | --- | --- | --- |
| Figma | Claude Code：`claude plugin install figma@claude-plugins-official`（插件市场）；不可用时手动 `claude mcp add --transport http figma https://mcp.figma.com/mcp`。Codex：`figma@openai-api-curated`（或当前配置的等价 marketplace） | 设计稿读取（design-to-code）、原型生成（generate-design / create-new-file）、Code to Canvas 代码回写画布 | 双宿主均走 Figma 官方远程 MCP（`mcp.figma.com/mcp`，OAuth 授权）；**免费账号即可读与回写**，不依赖 Dev Mode 付费席位；注意 Figma 免费 API 有频率限制、AI 侧额度随宿主订阅。用法见 [figma-workflow](../.agents/skills/frontend-task/references/figma-workflow.md) |
| GitHub | Codex：`github` 插件（由当前 Plugin Management 显示的 marketplace 补全）或 GitHub MCP 连接器，两种皆可。Claude Code：GitHub 官方 MCP 连接器 | PR、Issue、远端仓库读取与写入 | 本地 Git 检查不需要插件 |
| Product Design | Codex：`product-design`（OpenAI 官方插件市场，Plugin Management 搜索）。Claude Code：无官方插件，无需安装 | 设计探索、视觉复刻、UX 审计、原型（image-to-code 等子技能依赖 OpenAI 宿主能力） | **Starter 已内置整包 vendor 拷贝**（见第 1 节），方法论/audit/测量/清册部分全宿主可用；Codex 装官方插件解锁宿主能力依赖的子技能，装有插件后以插件版为准（`$product-design:index` 命名空间） |

安装规则：

1. 按宿主走各自的安装入口：Codex 用 Plugin Management、Claude Code 用 `/plugin` 市场；缺失时只安装表中列出的精确引用，不用相似名称或第三方替代品。
2. 安装或连接失败时报告真实状态，不得宣称对应 Skill 已可用；不在提示词、代码或日志中记录令牌。
3. 安装插件不授权创建 Figma 文件、提交 GitHub 变更、发布或生产写入。
4. 每项能力只使用状态机「缺失 → 待用户确认 → 已安装 → 已连接（适用时）→ 新对话可发现 → 当前任务可用」，不把「命令退出码 0」写成「任务可用」。

## 3. 宿主内置插件核对

随宿主提供的能力只检查是否可用，不尝试从公共插件目录安装。

| 能力 | 宿主引用 | 需要验证的 Skill | 处理方式 |
| --- | --- | --- | --- |
| 本地页面真实验收 | `browser@openai-bundled` | `$browser:control-in-app-browser` | 公共插件目录可能无法发现；只检查当前宿主是否内置 |
| 用户现有浏览器会话 | `chrome@openai-bundled` | 当前宿主的 Chrome 控制 Skill | 仅在必须使用用户登录态时使用 |
| 桌面应用操作 | `computer-use@openai-bundled` | 当前宿主的 Computer Use Skill | 不替代 Browser、Figma 或专用连接器 |

`browser@openai-bundled` 不是公共插件安装目标。若当前宿主没有 `$browser:control-in-app-browser`，应查找宿主提供的 Browser、Chrome 或 Playwright 等价能力，把实际名称登记到 `docs/PROJECT_PROFILE.md`，不能伪造已经安装。
