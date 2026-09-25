# ai-front-spec —— 前端项目 AI 规则 Starter
**中文** | [English](README.en.md)

「拷贝即用、零外部下载」的前端项目规则与工作流模板：**24 个技能全部内置**（5 自研 + 19 vendored，清单见 [docs/capabilities.md](docs/capabilities.md)），复制进项目即可被 Codex 与 Claude Code 双宿主发现，无需联网安装。它不是业务应用，也不替你创建框架、路由或接口。

| 宿主 | 读取路径 | 说明 |
| --- | --- | --- |
| Codex | `.agents/skills/` | 唯一人工源，修改只在这里 |
| Claude Code | `.claude/skills/` | 机器镜像，由 `sync-mirror.mjs` 自动生成，不要手改 |

## 技能来源与快照版本（24 个全部内置）

| 来源 | 快照 | 技能 |
| --- | --- | --- |
| ★ OpenAI `product-design` 插件 v0.1.52（Codex 宿主插件，无公开源码仓） | 2026-09-23 | `product-design`（整包） |
| ★ `mattpocock-skills` 1.2.3（插件市场快照） | 2026-09-25 | `grill-me`、`grilling`、`prototype` |
| github.com/vercel-labs/agent-skills | 2026-09-23 | `react-best-practices`、`web-design-guidelines` |
| github.com/anthropics/skills | 2026-09-23 | `frontend-design` |
| github.com/affaan-m/everything-claude-code | 2026-09-23 | `tdd-workflow`、`api-design`、`security-review`、`frontend-design-direction` |
| github.com/microsoft/playwright-cli | 2026-09-25 | `playwright-cli` |
| github.com/leonxlnx/taste-skill | 2026-09-23 | `taste-skill` |
| elms-h5 技能包 20260917（GitHub 上游见 capabilities §1） | 2026-09-17 | `gsap` ×3、`apple-design`、`compatibility-testing`、`mobile-ux-optimizer` |
| 本仓自研 | — | `project-workflow`、`project-profile`、`frontend-task`、`tinypng-compress`、`karpathy-guidelines` |

★ = 插件快照来源（无公开 repo，升级需重新快照）。vendored 技能与上游字节一致（零修改原则），许可与修改记录见 `NOTICE`，机器可读基线（repo/SHA/日期）见 `toolkit.json` 的 `vendored`。

### 如何升级这些技能（下次照此办理）

```bash
node scripts/update-vendored.mjs                    # 1. 检查：哪些落后于上游（✓ 最新 / ↑ 可升级 / ? 未建基线）
node scripts/update-vendored.mjs --diff <技能名>     # 2. 评估：上游变更摘要 × 本仓引用影响，人工确认无功能损失
node scripts/update-vendored.mjs --upgrade <技能名>  # 3. 升级：覆盖上游文件（本地附加保留），更新 SHA 基线
node .toolkit/scripts/sync-mirror.mjs               # 4. 镜像重建
node .toolkit/scripts/check-ai-guidance.mjs --root . --strict && node --test scripts/lib/*.test.mjs  # 5. 校验
```

规则：升级前必看 `--diff` 评估（尤其涉及行为约定变化时须实测，如浏览器技能跑真实页面）；`NOTICE` 快照日期同步更新；全部通过后提交并发版。无 repo 的 ★ 条目（插件快照）从对应插件缓存重新快照覆盖，再走 4-5 步。老安装判读：项目 `.toolkit/manifest.json` 无 `starterVersion` 字段 = v6.0.x 之前的安装，对照源仓 Release 升级后即有版本锚点；升级若涉及技能改名，安装器会提示退役目录，按提示成对删除后重建镜像。

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

24 个内置技能零安装，开箱即用。仅以下外部能力按任务需要装入，完整说明见 [docs/capabilities.md](docs/capabilities.md) 第 2 节。

**Claude Code 宿主**（`/plugin` 市场安装）：

- **Figma**：`claude plugin install figma@claude-plugins-official`；装不上时手动接远程 MCP：`claude mcp add --transport http figma https://mcp.figma.com/mcp`。读设计稿复刻、Code to Canvas 原型回写画布；免费账号可用。
- **GitHub**：GitHub 官方 MCP 连接器。
- **Product Design**：无需安装——Starter 内置整包拷贝，这已是它在 Claude Code 的全部可用部分（image-to-code 等子技能依赖 OpenAI 宿主能力，Claude Code 无官方插件）。

**Codex 宿主**（Plugin Management 按精确引用搜索安装）：

- **Figma**：`figma@openai-api-curated`。能力同上（读取 + 原型生成 + Code to Canvas 回写）。
- **GitHub**：`github` 插件，或 GitHub MCP 连接器，两种方式皆可。
- **Product Design**：`product-design`（OpenAI 官方插件市场）。Starter 已内置整包拷贝，方法论部分全宿主可用；装官方插件解锁依赖 OpenAI 宿主能力的子技能（如 image-to-code），装后以插件版为准。

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

`$` 命令由宿主识别。三个入口技能（`project-workflow` / `project-profile` / `frontend-task`）+ 19 个 vendored 专项技能全部内置，完整清单与来源见 [docs/capabilities.md](docs/capabilities.md) 第 1 节。

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

### 专项技能（16 个 vendored）

`tdd-workflow`、`api-design`、`security-review`、`frontend-design` 系列、`product-design` 整包、`grill-me`/`grilling`（分轮拷问：入口 + 协议）、`prototype`（一次性原型：方向变体 / 状态验证）、`gsap` ×3、`playwright-cli`（真浏览器自动化：官方手册 + 10 份实操参考）、`apple-design`、`compatibility-testing`、`mobile-ux-optimizer`、`react-best-practices`、`taste-skill`、`web-design-guidelines`——直接以 `$技能名` 调用，来源与更新方式见 [docs/capabilities.md](docs/capabilities.md)。

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

`inspect` 可单独用于只读调查；状态流转 `draft → planned → awaiting-confirmation → implementing → verifying → completed`，部分完成记录 `partially-complete`/`partially-verified`。画像 `draft` 不阻塞低风险工作，但高影响决定会暂停。`user_override` 只临时放宽当前任务缺口，需写明假设与风险，不能改画像或伪造权限。

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

## 6. 如何扩展

新增 Skill：

1. 在 `.agents/skills/<name>/` 写 `SKILL.md`（frontmatter `name` 与目录名一致），按需加 `agents/openai.yaml`、`references/`、`templates/`。
2. `node .toolkit/scripts/sync-mirror.mjs` 重建镜像。
3. `toolkit.json` 的 `skills` 登记；`.toolkit/ai-guidance.config.mjs` 按需登记 `requiredFiles` / `additionalSkills` / `routing`。
4. 改变任务路由则更新 `project-workflow/references/task-routing.md`；新增来源补充 `frontend-task/references/source-routing.md`。
5. vendored 技能在 `NOTICE` 记上游、快照、许可与修改；`docs/capabilities.md` 补来源行。
6. 新增状态字段递增 `schemaVersion`，保持幂等。

新增模板 / 规范：放入对应技能 `templates/` 或 `docs/rules/`，同步更新校验配置与文件索引。

每次扩展后在干净副本验证「复制 → `$project-profile` → `$frontend-task inspect`」主流程：

```bash
node .toolkit/scripts/check-ai-guidance.mjs --root . --strict
node .toolkit/scripts/sync-mirror.mjs --check
```

严格模式在画像未确认时失败是预期；确认画像后重跑并记录。

## 7. 常见问题

| 现象 | 处理 |
| --- | --- |
| 找不到 `$project-profile` 等技能 | 24 技能全内置；核对 `docs/capabilities.md` 清单，开新会话让宿主重新发现；不要装第三方同名替代 |
| 画像 `draft` 或模板 `pending` | 跑 `$project-profile` 选模板并确认高影响字段；不确定就 defer，不要手填 `initialized` |
| 任务停在 `awaiting-confirmation` | 读 `PLAN.md` 决策块，跑 `$frontend-task confirm` |
| `resume` 提示 fingerprint 过期 | 先 `inspect` 必要时重新 `plan`，不沿用旧计划 |
| AI 指引校验失败 | 看错误路径与缺失标记，核对 manifest 与配置后重跑 |
| `.claude/skills` 与 `.agents/skills` 不一致 | 跑 `sync-mirror.mjs` 重建镜像，不手改镜像 |
| 需要 Figma / GitHub 能力 | 见 `docs/capabilities.md` 第 2 节；Figma 无插件宿主走 MCP 直连 |
| 想删除或覆盖文件 | 先查 Git 状态与影响；不动 `.toolkit` 状态与迁移历史 |
| 想删本地技能，用自己的全局/插件版 | `node scripts/remove-skill.mjs <技能名>`：成对删 `.agents`/`.claude`、更新 roster、登记 `externalSkills`（校验按外部提供放行）、重建镜像，原子完成。依赖成对技能（如 grill-me↔grilling）别只删一半——校验器会拦 |
| 验收「看起来通过」 | 区分静态检查/mock/真实联调；未验证项留在 `ACCEPTANCE.md` |

## 8. 旧版文档名称映射

| 旧名 | 现名 |
| --- | --- |
| `AI_PROMPT_ENGINEERING.md` | `AI_WORKFLOW_PRINCIPLES.md` |
| `AI_TASK_PROMPT.md` | `AI_TASK_CONTRACT.md` |
| `AI_PAGE_PROMPT.md` | `AI_FRONTEND_TASK.md` |
| `AI_CAPABILITY_REQUIREMENTS.md` / `CODEX_CAPABILITIES.md` | `docs/capabilities.md` |
| `resources/` 旧载体目录 | 仓库根即 Starter（2026-09 拓扑拍平） |

保留映射便于迁移旧项目；新增内容统一用现名。
