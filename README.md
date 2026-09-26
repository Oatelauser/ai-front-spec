# ai-front-spec —— 前端项目 AI 规则 Starter

[![CI](https://github.com/Oatelauser/ai-front-spec/actions/workflows/ci.yml/badge.svg)](https://github.com/Oatelauser/ai-front-spec/actions/workflows/ci.yml)
[![vendored-check](https://github.com/Oatelauser/ai-front-spec/actions/workflows/vendored-check.yml/badge.svg)](https://github.com/Oatelauser/ai-front-spec/actions/workflows/vendored-check.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node ≥20](https://img.shields.io/badge/node-%E2%89%A5%2020-green.svg)](https://nodejs.org)

**中文** | [English](README.en.md)

给前端项目的 AI 规则包。复制进仓库，Codex 和 Claude Code 立刻多出一套"会干活也会验收"的前端工作流——不是去插件市场装一堆工具，而是一份随项目走、AI 每次任务都先读的规矩。

对号入座找能力：

- **拿着截图或 Figma 还原页面**：`$frontend-task` 截图工作流读图实现；接了 Figma 插件直接读设计稿，Code to Canvas 还能把代码回写画布
- **写完想有人盯着验收**：`$frontend-task verify` 按验收矩阵逐项过（视口、主题、键盘、溢出、控制台）；`$webapp-testing` 用 Playwright 跑真主流程（登录、权限拒绝、失败态、刷新持久化）；`$web-design-guidelines` 按 Web 规范审代码和可访问性
- **样式和手感不满意**：`$apple-design` 审动效（弹簧参数、可打断、减速投影），`$compatibility-testing` 查跨浏览器，`$mobile-ux-optimizer` 过移动端触控细节
- **怕 AI 上来就写代码**：无视觉参照的新页面强制先出 2–3 个方向原型（`$prototype`），你选定才实现；实现计划也要 `$frontend-task confirm` 过了你的批准才动
- **多端规则怕漏**：WebView / 移动 H5 / 桌面规则按项目画像自动套用，不靠 AI 记性

边界：它不写业务代码、不建框架路由、不替你定接口——它管"AI 怎么把前端活干对、干完怎么证明干对了"。

| 宿主 | 读取路径 | 说明 |
| --- | --- | --- |
| Codex | `.agents/skills/` | 唯一人工源，修改只在这里 |
| Claude Code | `.claude/skills/` | 机器镜像，由 `sync-mirror.mjs` 自动生成，不要手改 |

## 1. 快速接入

### 安装

要求 Node ≥ 20（CI 以 22 验证）。

```bash
node scripts/build-starter.mjs --target ./my-project
```

- 目标为**空目录** → 干净副本：除开发件外全量复制，并自动跑三连校验（结构 / AI 指引 / 镜像一致）。
- 目标**已有项目** → 覆盖安装：普通文件覆盖；`AGENTS.md`、`CLAUDE.md`、`README.md`、画像与规则草稿已存在时跳过（清单见 `toolkit.json` 的 `skipIfExists`，结束打印跳过项）。

> 直接 git clone 本仓库得到的是开发形态（含 `scripts/`、`docs/wayfinder/`、`CONTRIBUTING.md`），这些开发件不会随安装进入业务项目。也可手工复制仓库根内容（不含上述开发件与 `.serena/`），注意保留隐藏目录 `.agents/`、`.claude/`、`.toolkit/`。把 Starter 提交进自己的 Git 仓库时，建议在项目 `.gitattributes` 加一行 `*.png binary`，避免行尾转换损坏技能内置图片。

### 验证

```bash
node .toolkit/scripts/check-ai-guidance.mjs --root .
node .toolkit/scripts/sync-mirror.mjs --check
```

`--strict` 把画像草稿外的 `<待填写>` 占位符视为失败——这是提醒事实未确认，不是文件损坏。

### 安装后下一步

1. **初始化画像**：新项目跑 `$project-profile`；已有业务代码跑 `$project-profile update` 对齐现状。
2. **对齐质量命令**：画像里的质量命令必须对齐你 `package.json` 的真实脚本名，不要沿用模板示例值。
3. **确认支持端**：画像初始化时确认 `deliveryTargets`（桌面浏览器 / 移动 H5 / WebView 等）——它决定页面任务适用哪些规则，未确认前 AI 不得猜测。
4. **隔离技能测试文件**：测试框架若全目录扫描（如 Vitest 默认），把 `.agents/` 与 `.claude/` 加入 exclude，技能包内模板测试不是项目测试。
5. **合并入口指引**：覆盖安装跳过的 `AGENTS.md` / `CLAUDE.md` / `README.md` 保持你的版本；需接入 Starter 指引时参照源仓库同名文件手工合并。

### 可选插件（按需）

内置技能零安装、双宿主同源。仅以下外部能力按任务需要加装，完整说明见 [docs/capabilities.md](docs/capabilities.md) 第 2 节。

| 插件 | 干什么用 | Claude Code 安装 | Codex 安装 |
| --- | --- | --- | --- |
| Figma | 读设计稿实现、原型生成、代码回写画布 | `claude plugin install figma@claude-plugins-official`；装不上走 MCP 直连：`claude mcp add --transport http figma https://mcp.figma.com/mcp` | `figma@openai-api-curated`（Plugin Management 搜索） |
| GitHub | PR、Issue、远端仓库读写 | GitHub 官方 MCP 连接器 | `github` 插件，或 GitHub MCP 连接器 |
| Product Design | 设计探索、视觉复刻、UX 审计、原型 | 无需安装——内置整包拷贝已是它在 Claude Code 的全部可用部分 | `product-design`（官方市场）；装后解锁 image-to-code 等依赖 OpenAI 宿主的子技能，以插件版为准 |

Figma 双路径均走官方远程 MCP（OAuth），免费账号即可读与回写（有频率限制）；本地 Git 检查不需要 GitHub 插件。

## 2. 快速入门

一个新项目从零到第一个任务交付，只需四步：

```text
1. $project-profile init            # 新项目：成熟度扫描 → 七张决策卡片 → 生成画像与组件目录
2. $frontend-task inspect --source=requirement --type=new-page
3. $frontend-task plan && $frontend-task confirm
4. $frontend-task implement && $frontend-task verify && $frontend-task report
```

- 不知道从哪开始时，裸跑 `$project-profile`：只读展示当前状态与推荐路径，不隐式执行。
- 直接跑 `$frontend-task` 也可以，它会自动路由到上述阶段；有未决高影响决定时停在 `awaiting-confirmation`，不会绕过确认改代码。
- 已有项目把第 1 步换成 `$project-profile update`。

## 3. 命令参考

`$` 命令由宿主识别。三个入口技能 + 全部专项技能内置，完整清单与来源见 [docs/capabilities.md](docs/capabilities.md) 第 1 节。

### $project-profile —— 画像与组件目录

| 子命令 | 用途 | 写文件 |
| --- | --- | --- |
| （裸命令） | 展示状态、推荐路径与可用子命令 | 否 |
| `init` | 新项目一次扫描 + 七张决策卡片 + 提案确认 + 分层写入（仅限 `unformed` 项目） | 是 |
| `profile` | 画像访谈：扫描 → 模板选择 → 分轮 grilling → 校验 | 是 |
| `components` | 组件目录：基线候选 → 用户选择 → grilling → 校验 | 是 |
| `status` | 双状态、剩余占位符、冲突一览 | 否 |
| `update` | 扫描现状并协调画像与组件目录更新（幂等，冲突不静默） | 可能 |

要点：`profile` 与 `components` 平级无先后，推荐先 `profile`；事实源分别是 `docs/PROJECT_PROFILE.md` 与 `docs/rules/AI_COMPONENT_CATALOG.md`，机器状态在 `.toolkit/profile-state.json`；模板默认值不是项目事实，只有用户确认才记 `user-confirmed`。

### $frontend-task —— 前端任务全流程

| 阶段 | 做什么 | 产出 |
| --- | --- | --- |
| `inspect` | 读取画像、规则、代码、来源材料，识别任务类型与缺口 | 事实清单、来源路由、缺口 |
| `plan` | 决策前沿分轮问答，规划文件与验收矩阵 | `PLAN.md`、`STATE.json` |
| `confirm` | 按决策块批准 / 拒绝 / 要求修改 | 批准块进入实现 |
| `implement` | 先补失败测试再实现，含数据态与交互态 | 业务代码、任务状态 |
| `verify` | 真实测试、类型、构建、Browser/API 验收 | `ACCEPTANCE.md` |
| `report` | 汇总修改、命令、证据、偏差、未验证项 | 交付报告 |
| `resume` | 中断恢复（`--from=<stage>`）；fingerprint 过期先回 `inspect`/`plan` | — |

### $project-workflow —— 项目级路由

不确定用哪个技能时入口：路由到最小 Skill 与阶段，详见 `project-workflow/references/task-routing.md`。

### 专项技能（全部内置）

`tdd-workflow`、`api-design`、`security-review`、`frontend-design` 系列、`product-design` 整包、`grill-me`/`grilling`（分轮拷问：入口 + 协议）、`prototype`（一次性原型：方向变体 / 状态验证）、`gsap` ×3、`playwright-cli`（真浏览器自动化：官方手册 + 10 份实操参考）、`webapp-testing`（已接入接口页面的功能 E2E：Python Playwright 脚本 + dev server 生命周期管理）、`apple-design`、`compatibility-testing`、`mobile-ux-optimizer`、`react-best-practices`、`taste-skill`、`web-design-guidelines`——直接以 `$技能名` 调用，来源与更新方式见 [docs/capabilities.md](docs/capabilities.md)。

## 4. 任务操作细节

### 4.1 任务输入

| 类型 | 适用 | 重点确认 |
| --- | --- | --- |
| `new-page` | 新页面、完整流程、新路由 | 用户流程、布局、状态、接口、响应式 |
| `incremental` | 修改已有页面/组件一部分 | 原行为、变化区域、回归范围 |
| `bug-fix` | 修复可复现缺陷 | 复现步骤、根因、回归用例 |
| `refactor` | 行为不变的结构调整 | 对外接口、调用者、等价性 |

来源支持 `screenshot` / `prototype` / `html` / `figma` / `api` / `requirement`，可组合；对每个来源记录路径或 URL、版本、读取时间与状态，冲突必须记录不自行取舍。可直接对话描述，或复制 `.agents/skills/frontend-task/templates/frontend-task.template.json` 填写。至少写清：用户目标、目标路由/文件、已有行为、约束、权限边界、可观察的完成条件。

### 4.2 阶段对照

| 阶段 | 你提供/决定 | 代理执行 |
| --- | --- | --- |
| `inspect` | 需求、来源路径、目标路由 | 读取画像与代码、识别类型与缺口 |
| `plan` | 对范围、视觉、组件、API、权限逐轮回答 | 区分事实/假设/待确认，写计划与验收矩阵 |
| `confirm` | 批准、拒绝或要求修改 | 审核五大决策块 |
| `implement` | 必要时提供获授权的 override | 先补失败测试，实现含 loading/empty/error/unauthorized/disabled/success 数据态与 hover/focus-visible/pressed/selected 交互态 |
| `verify` | 非生产环境、测试账号、Browser | 跑真实测试/类型/构建/Browser 验收，区分 mock 与真实联调 |
| `report` | 确认交付范围与可接受未验证项 | 汇总证据；未验证项不得写成完成 |

`inspect` 可单独用于只读调查；任务状态收敛为 `draft → awaiting-confirmation → done`（失败 `failed`）。画像 `draft` 不阻塞低风险工作，但高影响决定会暂停。`user_override` 只临时放宽当前任务缺口，需写明假设与风险，不能改画像或伪造权限。

### 4.3 按任务类型要点

- **新增页面**：先定主流程与路由，再解析设计源、复用组件、映射 API；必须验证深链直开、刷新、响应式与权限。
- **增量修改**：记录原行为，只动变化区域；验证邻近调用方与回归，不借机重做无关视觉。
- **缺陷修复**：先复现并写失败用例，最小修复后重放复现；不以删测试或改测试数据充当修复。
- **重构**：先列对外接口与调用者；实现后跑等价行为测试，不顺带改语义、权限或视觉。

### 4.4 验收清单（按实际功能选择）

1. **自动化**：相关测试、类型/静态检查、构建、总门禁，记录真实命令与退出码。
2. **页面运行**：目标路由与深链，记录浏览器、视口、DPR、主题及控制台错误。
3. **用户流程**：导航、筛选/分页、表单、弹层、返回、刷新；核对请求参数与重复提交。
4. **状态与极端内容**：适用数据态与交互态逐项检查；长文本、零值、大量数据、短屏溢出。
5. **可访问性与响应式**：键盘顺序、焦点可见、可访问名称、对比度、断点两侧、触摸操作。
6. **证据交付**：记录通过/失败/未验证/不适用；mock、截图、HTTP 200 都不能单独证明流程成功。

复杂任务在 `docs/tasks/<task-id>/` 保存 `TASK.md`、`PLAN.md`、`STATE.json`、`ACCEPTANCE.md` 与 `assets/`。

## 5. 文件职责索引

| 路径 | 作用 |
| --- | --- |
| `AGENTS.md` / `CLAUDE.md` | 项目边界、事实源优先级、完成条件（双宿主入口，内容同源） |
| `docs/PROJECT_PROFILE.md` | 技术栈、目录、命令、权限、验收的唯一事实源 |
| `docs/rules/AI_*.md`（8 件） | 任务合同、前端任务契约、项目标准、工作流原则、组件目录、验收证据、WebView 规则、兼容矩阵 |
| `docs/rules/FRONTEND_CONVENTIONS.md` | 可选的图标、国际化、样式约定 |
| `docs/capabilities.md` | 能力清单：内置技能 / 宿主插件（可选）/ 宿主内置核对 |
| `.agents/skills/` | 唯一人工源，修改只在这里 |
| `.claude/skills/` | Claude Code 镜像，机器生成不要手改 |
| `.toolkit/manifest.json` | Starter 状态记录 |
| `.toolkit/profile-state.json` | 成熟度、画像状态、模板选择、组件目录状态 |
| `.toolkit/ai-guidance.config.mjs` | 校验所需文件、标记、命令和状态引用 |
| `.toolkit/scripts/check-ai-guidance.mjs` | AI 指引校验器入口（`--strict` 严格模式） |
| `.toolkit/scripts/sync-mirror.mjs` | 镜像同步（`--check` 校验漂移） |
| `.toolkit/scripts/lib/ai-guidance-validation.mjs` | 校验器实现，可被测试复用 |
| `.agents/skills/<技能>/templates/` | 画像三模板、组件目录模板与预设、任务输入模板 |
| `LICENSE` / `NOTICE` | MIT 许可与 vendored 组件归属、修改记录 |

机器状态文件由对应 Skill 管理，不要手工伪造 `initialized`、确认状态或验收成功。

## 6. 技能来源与快照版本

25 个内置技能全部双宿主：Codex 读 `.agents/skills/`，Claude Code 读 `.claude/skills/` 镜像，两份字节一致——所以清单只列一次。两宿主真正的差异只有两处：插件安装方式（见 §1 表）和宿主内置能力（见本节末尾）。

### 自研（5）

| 技能 | 来源 | 快照 | 说明 |
| --- | --- | --- | --- |
| `project-workflow` | 本仓 | — | 项目级路由入口，任务用哪个技能它说了算 |
| `project-profile` | 本仓 | — | 项目画像与组件目录的初始化、更新 |
| `frontend-task` | 本仓 | — | 前端任务全流程（inspect → report） |
| `tinypng-compress` | 本仓 | — | TinyPNG 批量图片压缩 CLI |
| `karpathy-guidelines` | 本仓 | — | 防 AI 低级错误的行为准则 |

### GitHub 上游 vendored（16）

零修改原则：与上游字节一致，升级 = 新快照纯覆盖。许可与修改记录见 `NOTICE`，机器可读基线（repo / SHA / 日期）见 `toolkit.json` 的 `vendored` 字段。

| 技能 | 来源 | 快照 | 说明 |
| --- | --- | --- | --- |
| `gsap-core` | github.com/greensock/gsap-skills | 2026-09-17 | GSAP 核心 API |
| `gsap-performance` | 同上 | 同上 | GSAP 性能优化 |
| `gsap-timeline` | 同上 | 同上 | GSAP 时间线编排 |
| `apple-design` | github.com/emilkowalski/skills | 2026-09-26 | Apple 风格动效、材质、排版 |
| `compatibility-testing` | github.com/proffesor-for-testing/agentic-qe | 2026-09-17 | 跨浏览器/平台/设备兼容测试 |
| `mobile-ux-optimizer` | github.com/curiositech/some_claude_skills（原 erichowens 仓已 404） | 2026-09-25 | 移动端触控、视口、性能 |
| `tdd-workflow` | github.com/affaan-m/everything-claude-code | 2026-09-25 | TDD 工作流 |
| `api-design` | 同上 | 2026-09-23 | REST API 设计规范 |
| `security-review` | 同上 | 2026-09-23 | 安全审查清单 |
| `frontend-design-direction` | 同上 | 2026-09-23 | 设计方向设定 |
| `frontend-design` | github.com/anthropics/skills | 2026-09-23 | 视觉设计判断（Apache-2.0） |
| `webapp-testing` | 同上 | 2026-09-25 | Python Playwright 功能 E2E（Apache-2.0） |
| `playwright-cli` | github.com/microsoft/playwright-cli | 2026-09-25 | Playwright 官方 CLI 驱动 |
| `react-best-practices` | github.com/vercel-labs/agent-skills | 2026-09-23 | React/Next.js 性能规范 |
| `web-design-guidelines` | 同上（内容源 vercel-labs/web-interface-guidelines） | 2026-09-23 | Web 界面规范审计（在线拉最新，离线回退 `command.md`） |
| `taste-skill` | github.com/leonxlnx/taste-skill | 2026-09-23 | 反模板化前端审美 |

### 插件快照（4，无公开源码仓，升级 = 从宿主插件缓存重新快照）

| 技能 | 来源 | 快照 | 说明 |
| --- | --- | --- | --- |
| `product-design` | OpenAI Codex 插件市场 `product-design` v0.1.52 | 2026-09-23 | 整包 vendor（顶层路由 + 子技能地图见其 SKILL.md）；image-to-code 等子能力依赖 OpenAI 宿主 |
| `grill-me` | Claude Code 官方市场 `mattpocock-skills` 1.2.3 | 2026-09-25 | 拷问入口技能 |
| `↳ grilling` | 同上 | 同上 | 拷问协议本体，`grill-me` 依赖它，两者成对不可拆 |
| `prototype` | 同上 | 同上 | 一次性原型（方向变体 / 状态验证） |

### 宿主内置（仅 Codex，不随仓库分发）

| 能力 | 来源 | 说明 |
| --- | --- | --- |
| `browser` / `chrome` / `computer-use` | openai-bundled | 页面真实验收 / 复用用户浏览器会话 / 桌面操作。Claude Code 无对应内置——页面验收走 `$webapp-testing` 或 `$playwright-cli` |

### 如何升级这些技能（双通道）

在线（本机网络通畅时）：

```bash
node scripts/update-vendored.mjs                    # 1. 检查：✓ 最新 / ↑ 可升级 / ? 未建基线
node scripts/update-vendored.mjs --diff <技能名>     # 2. 评估：上游变更摘要 × 本仓引用影响
node scripts/update-vendored.mjs --upgrade <技能名>  # 3. 升级：覆盖差异文件（本地附加保留），更新 SHA 基线
node .toolkit/scripts/sync-mirror.mjs               # 4. 镜像重建
node .toolkit/scripts/check-ai-guidance.mjs --root . --strict && node --test scripts/lib/*.test.mjs  # 5. 校验
```

离线（本机克隆慢或失败时）：周度 CI `vendored-check` 发现可升级项时，会自动把上游最新内容打包成 artifact 并在 Issue 里附下载链接——

```bash
# 1. 从 Issue 链接下载 vendored-bundle-<运行号>.zip（Windows/macOS 可直接传 zip，Linux 先解压传目录）
node scripts/update-vendored.mjs --diff --offline <包路径>     # 2. 用包评估（零克隆）
node scripts/update-vendored.mjs --upgrade --offline <包路径>  # 3. 用包升级（逐字节比对后覆盖）
# 4-5 与在线通道相同
```

规则：升级前必看 `--diff`（涉及行为约定变化须实测，如浏览器技能跑真实页面）；`NOTICE` 快照日期同步更新；插件快照（无 repo 的 4 项）从本机插件缓存重新快照，不走上述通道。`--rebaseline` 用于对账：字节与上游一致但基线缺失或陈旧时直接写 SHA（如 taste-skill 2026-09-26 案例：上游新提交未动技能目录，rebaseline 即闭合）。

## 7. 常见问题

| 现象 | 处理 |
| --- | --- |
| 找不到 `$project-profile` 等技能 | 25 技能全内置；核对 `docs/capabilities.md` 清单，开新会话让宿主重新发现；不要装第三方同名替代 |
| 画像 `draft` 或模板 `pending` | 跑 `$project-profile` 选模板并确认高影响字段；不确定就 defer，不要手填 `initialized` |
| 任务停在 `awaiting-confirmation` | 读 `PLAN.md` 决策块，跑 `$frontend-task confirm` |
| `resume` 提示 fingerprint 过期 | 先 `inspect` 必要时重新 `plan`，不沿用旧计划 |
| AI 指引校验失败 | 看错误路径与缺失标记，核对 manifest 与配置后重跑 |
| `.claude/skills` 与 `.agents/skills` 不一致 | 跑 `sync-mirror.mjs` 重建镜像，不手改镜像 |
| 需要 Figma / GitHub 能力 | 见 §1 可选插件表；Figma 无插件宿主走 MCP 直连 |
| 想删除或覆盖文件 | 先查 Git 状态与影响；不动 `.toolkit` 状态与迁移历史 |
| 想删本地技能，用自己的全局/插件版 | `node scripts/remove-skill.mjs <技能名>`：成对删 `.agents`/`.claude`、更新 roster、登记 `externalSkills`、重建镜像，原子完成。依赖成对技能（如 grill-me↔grilling）别只删一半——校验器会拦 |
| 验收「看起来通过」 | 区分静态检查/mock/真实联调；未验证项留在 `ACCEPTANCE.md` |
