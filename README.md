# Codex 前端项目 Starter 使用指南

本仓库是一套「拷贝即用、零外部下载」的项目规则与工作流 Starter：21 个技能全部内置（5 自研 + 16 vendored，见 `docs/capabilities.md` 第 1 节），复制后即可被 Codex 与 Claude Code 双宿主发现，不需要联网安装任何 Skill。它不是业务应用，也不替你创建框架、路由或接口。

## 1. 获取与首次检查

### 两种形态

- **业务项目使用（消费形态）**：把 Starter 安装到你的项目根目录（下述命令）。
- **直接 git clone 本仓库（开发形态）**：得到的是 Starter 源仓，含构建脚本（`scripts/`）、wayfinder 决策档案（`docs/wayfinder/`）和贡献指南（`CONTRIBUTING.md`）。这些开发件**不会**随安装进入业务项目（`toolkit.json` 的 `distExcludes`）。

### 安装到业务项目

```bash
node scripts/build-starter.mjs --target ./my-project
```

- 目标目录为空 → **干净副本**：复制除开发件外的全部内容，并自动执行三连校验（结构完整性 / AI 指引严格校验 / 镜像一致性）。
- 目标已有项目 → **覆盖安装**：普通文件覆盖写入；`AGENTS.md`、`CLAUDE.md`、`README.md`、画像与规则草稿等已存在时**跳过不覆盖**（清单见 `toolkit.json` 的 `skipIfExists`，安装结束打印跳过清单）；开发件不落地。

也可以手工复制仓库根目录内容（不含 `scripts/`、`toolkit.json`、`docs/wayfinder/`、`.serena/`、`CONTRIBUTING.md`），不要漏掉隐藏目录 `.agents/`、`.claude/`、`.toolkit/`。

### 验证

在业务项目根目录：

```bash
node .toolkit/scripts/check-ai-guidance.mjs --root .
node .toolkit/scripts/sync-mirror.mjs --check
```

`--strict` 会把画像草稿外的 `<待填写>` 占位符视为失败；这是提醒事实尚未确认，不代表 Starter 文件损坏。

### 安装后下一步

校验通过后，新项目从 `$project-profile` 开始初始化画像（见第 3 节）；已有业务代码的项目运行 `$project-profile update` 对齐现状，画像中的质量命令必须对齐你 `package.json` 的真实脚本名，不要沿用模板示例值。覆盖安装跳过的 `AGENTS.md`/`CLAUDE.md`/`README.md` 保持你的版本，Starter 的入口指引不会自动接入；需要接入时参照源仓库同名文件手工合并。

## 2. 命令总览

`$` 命令由宿主识别。项目入口技能（`project-workflow` / `project-profile` / `frontend-task`）随 Starter 内置；16 个 vendored 专项技能（tdd-workflow、api-design、security-review、frontend-design 系列、product-design 整包、gsap ×3、playwright 等）同样内置，完整清单与来源见 [docs/capabilities.md](docs/capabilities.md) 第 1 节。

| 命令 | 用途 | 是否写文件 | 何时需要确认 | 主要产物/输出 |
| --- | --- | --- | --- | --- |
| `$project-profile` | 只读展示平级初始化入口、推荐路径和可用子命令 | 只读 | 从不 | 当前状态与下一步建议 |
| `$project-profile init` | 新项目一次扫描、七张高影响决策卡片、提案确认和分层提交 | 会写两域文件 | 成熟度必须为 `unformed`；每层写入需确认 | `.toolkit/profile-proposal.json`、画像、组件目录和状态 |
| `$project-profile profile` | 判断项目成熟度并初始化/更新项目画像 | 会写画像和画像状态 | 框架、命令、目录、API、权限、验收、模板迁移等高影响字段 | `docs/PROJECT_PROFILE.md`、`.toolkit/profile-state.json` |
| `$project-profile components` | 读取成熟度和画像，初始化/更新 UI 公共组件目录 | 会写组件目录和组件状态 | 组件基线、公共边界、合并/扩展决策 | `docs/rules/AI_COMPONENT_CATALOG.md`、`.toolkit/profile-state.json` |
| `$project-profile status` | 查看画像、成熟度和组件目录状态 | 只读 | 从不 | 双状态、占位符、冲突 |
| `$project-profile update` | 扫描现有项目并协调画像与组件目录更新 | 可能写入 | 高影响变更、缺失文件创建、模板迁移前 | 两个域的变更字段、保留决定、冲突、校验结果 |
| `$project-workflow` | 项目级入口，路由到最小 Skill 和阶段 | 视被路由阶段而定 | 由具体 Skill 决定 | 计划、实现或验收报告 |
| `$frontend-task` | 前端任务完整流程 | 通常会写任务记录和业务代码 | 高影响决定未确认时停在 `awaiting-confirmation` | `docs/tasks/<task-id>/` 下的任务产物 |
| `$frontend-task inspect/plan/confirm/implement/verify/report/resume` | 分阶段执行或恢复 | 视阶段而定 | 见各阶段说明 | 事实清单、计划、实现、验收、报告 |

## 3. 用户画像操作

用户画像的唯一事实源是 `docs/PROJECT_PROFILE.md`，组件目录的事实源是 `docs/rules/AI_COMPONENT_CATALOG.md`，机器状态统一记录在 `.toolkit/profile-state.json`。模板和组件基线只是候选，不是事实；只有用户明确确认才会记录为 `user-confirmed`。

### 首次初始化：两个平级入口，推荐先画像

```text
$project-profile
```

裸命令只展示入口和推荐路径，不隐式执行完整流程。`profile` 与 `components` 是平级命令，没有强制先后顺序；推荐先运行 `profile`，因为它通常能先确认 UI 框架、样式和公共目录，但 `components` 也可以先执行。

```text
$project-profile profile
$project-profile components
```

谁先运行，谁就负责执行共享项目成熟度扫描并持久化结果；后运行的命令复用该结果。先运行 `components` 时，它不会填写项目画像；先运行 `profile` 时，它也不会替组件目录完成初始化。两个阶段互相参考，但不替对方完成初始化。

`profile` 会按“扫描仓库 → 保存成熟度证据 →（必要时）选择 `generic`、`react`、`vue` 或 `defer` → 进入 `$grill-me` 风格的分轮画像访谈 → 应用 → 校验”的顺序运行。选择模板后，代理必须扫描 `docs/PROJECT_PROFILE.md` 的全部 `<待填写...>` 占位符，不论字段是否高影响；每轮回答后会重新计算剩余问题，不能只给汇总就结束。

新项目也可以使用 `$project-profile init`：它只接受成熟度扫描判定的 `unformed` 项目，集中询问七张决策卡片，生成可编辑的 `.toolkit/profile-proposal.json`。提案先展示推荐值、依据、影响字段和追踪矩阵；用户确认后才按“事实、用户决定、推荐、组件规划、deferred”分层写入。Q1 默认推荐桌面 Web、移动 H5、平板响应式，WebView 可选启用（默认暂缓）、PWA 暂缓；Q1 另提供 `default + enterprise-webview` 组合项，选了 webview 但容器名填不出时保持 deferred 不算 confirmed。选型冲突按 `docs/rules/AI_COMPATIBILITY_MATRIX.md` 扫描：Q1 展示即时提示不落纸，materialize 前全量扫描落纸进提案的 `compatibilityScan`（不落纸=未扫描）。`multiPlatform` 只能由确认的端类型派生。已有业务代码或稳定规范时应使用 `update`，不能用 `init` 覆盖。

1. 选择与仓库证据相符的模板；不确定时选择 defer，保留 `draft + pending`。
2. 明确语言、目标用户、技术栈、源码/组件目录、质量命令、权限来源和验收矩阵。
3. 只确认有证据的事实；不要把模板默认值当成项目事实。
4. 对每个字段给出事实、`无`、`不适用` 或明确 defer 理由；“项目名称”“集成测试”“覆盖率”“维护负责人”等低影响字段也不能被汇总跳过。
5. 查看每轮写入的校验结果和剩余 frontier；画像完成或暂缓保存后，可执行 `$project-profile components`。

`components` 的顺序是“读取组件目录结构模板和候选预设 → 读取或计算共享成熟度 → 读取画像已确认事实 → 给出组件基线候选 → 等待用户选择 → grilling 填充目录全部占位符 → 校验”。空/萌芽项目至少展示：Vue 的 Element Plus、React 的 Ant Design、generic 的框架中立基础组件契约，以及“自定义”“暂缓”。推荐项必须由用户选择；未实现组件标记为 `planned`，不能冒充代码事实。

项目级端支持写在 `docs/PROJECT_PROFILE.md` 的“支持端与运行环境”，机器态对应 `.toolkit/profile-state.json.deliveryTargets`；组件目录只记录组件级端差异。`$frontend-task` 在每个阶段都会读取两者，不能只在 `inspect` 读取一次。

画像保持 `draft` 不会阻塞独立的低风险工作；工作流会提示缺口，并暂停依赖框架、路由、API、权限或验收规则的高影响决定。

### 查看与更新

```text
$project-profile status
$project-profile update
```

`status` 只读，同时展示成熟度、`profileStatus`、模板选择、`componentCatalogStatus`、两边的剩余占位符/deferred/冲突和下一条命令。`update` 会扫描代码、配置、测试、CI、画像和组件目录：低影响且无歧义的事实可自动记录；画像变化进入 `profile` grilling，组件变化进入 `components` grilling；两边都变化时按 `profile → components` 执行。重复执行应幂等；冲突会被记录，不会静默选择一方。

## 4. 任务操作：从需求到交付

### 4.1 准备任务输入

先明确用户要完成的事情，再补齐任务类型、来源、目标入口和验收条件。前端任务支持以下类型：

| 类型 | 适用场景 | 重点确认 |
| --- | --- | --- |
| `new-page` | 新增页面、完整流程或新路由 | 用户流程、布局、状态、接口、响应式范围 |
| `incremental` | 修改已有页面或组件的一部分 | 原行为、变化区域、依赖方和回归范围 |
| `bug-fix` | 修复可复现缺陷 | 复现步骤、预期/实际、根因和回归用例 |
| `refactor` | 保持行为不变的结构调整 | 对外接口、调用者、状态生命周期和等价性 |

来源可以是 `screenshot`、`prototype`、`html`、`figma`、`api`、`requirement`，可组合使用。对每个来源记录路径或 URL、版本/节点、读取时间、适用视口和状态；来源冲突必须记录，不要自行假定某一份材料永远优先。

可以直接在对话中描述，也可以复制 `.agents/skills/frontend-task/templates/frontend-task.template.json` 后填写任务输入。模板中的 `<待填写>` 只应替换为当前任务事实，不要修改 Starter 模板本身。

至少写清：用户目标、目标路由/文件、已有行为、输入材料、约束、权限边界和可观察的完成条件。框架、包管理器、API 字段、认证权限和质量命令优先从 `docs/PROJECT_PROFILE.md` 与仓库代码确认，不能用示例值代替事实。

### 4.2 推荐的完整流程

以“根据 Figma 和 API 文档新增用户详情页”为例：

```text
$frontend-task inspect --source=figma,api --type=new-page
$frontend-task plan
$frontend-task confirm
$frontend-task implement
$frontend-task verify
$frontend-task report
```

也可以直接运行 `$frontend-task`，它会自动执行上述路由；若存在未决高影响决定，会停在 `awaiting-confirmation`，不会绕过确认直接改业务代码。

### 4.3 每个阶段做什么

| 阶段 | 用户需要提供/决定 | 代理会执行 | 结果与下一步 |
| --- | --- | --- | --- |
| `inspect` | 需求、来源路径/URL、目标分支或路由（已有则复用） | 读取画像、规则、相关代码、测试、组件、请求入口和来源；识别任务类型、冲突和能力缺口 | 事实清单、来源路由和缺口；无须等待实现许可 |
| `plan` | 对范围、视觉基准、组件、状态、API、权限和响应式问题逐轮回答 | 建立决策前沿，区分事实、假设和待确认项，规划文件与验收矩阵 | 写入 `PLAN.md`、`STATE.json`；高影响项未定则暂停 |
| `confirm` | 按决策块批准、拒绝或要求修改 | 审核“范围与路由、来源与视觉、组件与状态、API/权限、测试与验收” | 已批准的块进入实现；拒绝项回到 `plan` |
| `implement` | 确认计划有效，必要时提供获授权的 override | 复用现有基础设施，先补失败测试，再实现 loading/empty/error/unauthorized/disabled/success 等适用数据态；涉及交互组件时同时实现 hover（限指针设备）/focus-visible/pressed(:active)/selected 交互态 | 业务代码和任务状态；计划冲突部分单独暂停 |
| `verify` | 提供非生产环境、测试账号/数据和可用 Browser（如需） | 运行真实存在的测试、类型检查、构建、Browser/API 和状态验收；区分 mock/真实联调 | 写入 `ACCEPTANCE.md`；失败则修复后重跑 |
| `report` | 确认交付范围及仍可接受的未验证项 | 汇总修改文件、命令/退出码、路由操作、证据、偏差和后续条件 | 交付报告；未验证项不能写成已完成 |

`inspect` 可以单独用于“只调查不改代码”；`verify` 可以用于已有实现的专项验收；`resume [--from=<stage>]` 用于中断后恢复，不会替代过期计划的重新检查。

### 4.4 按任务类型操作

- **新增页面**：先确定用户主流程和目标路由，再解析设计源、选择可复用组件、映射 API 字段，随后实现主流程及所有适用状态。必须验证直接打开深链、刷新、导航、响应式和权限边界。
- **增量修改**：先记录原页面行为和变化区域，只扩展必要组件或接口；验证修改区域、邻近调用方、旧筛选/分页/导航和回归状态，避免借机重做无关视觉。
- **缺陷修复**：先用真实步骤复现并写失败用例，定位根因后做最小修复；修复后重放原复现、验证正常路径和受影响调用方，不以删除测试或改变测试数据作为“修复”。
- **重构**：先列出对外接口和所有调用者，确认状态生命周期不变；实现后运行等价行为测试、类型检查和构建，不顺带改变业务语义、权限或视觉。

### 4.5 状态、暂停与恢复

任务状态常见顺序为 `draft → planned → awaiting-confirmation → implementing → verifying → completed`；出现部分实现或部分验收时会记录 `partially-complete`/`partially-verified`，失败记录为 `failed`。复杂任务的 `STATE.json` 还会保存输入 fingerprint：来源、路由、画像或关键配置变化后，`resume` 必须先回到 `inspect`/`plan`。

画像仍是 `draft`、外部 Figma/Browser/API 不可用或测试数据缺失时，可以继续不依赖它们的工作，但受影响结论必须标为未验证。`user_override` 只能临时放宽当前任务的缺口，需写明假设、风险和后续补证条件，不能修改项目画像或伪造权限。

### 4.6 验收操作清单

根据页面实际功能选择检查，不凭空增加不存在的状态：

1. **自动化**：相关单元/集成测试、类型/静态检查、构建和项目总门禁，记录真实命令、工作目录和退出码。
2. **页面运行**：启动正确服务，打开目标路由和深链，记录浏览器、CSS 视口、DPR、主题、语言及已有控制台错误。
3. **用户流程**：从入口完成导航、筛选/分页、表单、弹层、返回和刷新；核对请求参数、认证、缓存更新及重复提交。
4. **状态与极端内容**：按适用范围检查 loading、empty、error、unauthorized、disabled、success、retry 等数据态，涉及交互组件时同时检查 hover（限指针设备）、focus-visible、pressed（:active）、selected（Tab/导航/行选中）等交互态，以及长文本、零值、缺失字段、大量数据和短屏溢出。
5. **可访问性与响应式**：键盘顺序、焦点可见、可访问名称、标签/错误关联、对比度、减少动态效果、断点两侧布局和触摸操作。
6. **证据交付**：记录通过、失败、未验证、不适用；附截图或脱敏请求记录。Mock、截图、构建成功和 HTTP 200 都不能单独证明业务流程成功。

复杂、多轮或视觉任务会在 `docs/tasks/<task-id>/` 保存 `TASK.md`、`PLAN.md`、`STATE.json`、`ACCEPTANCE.md` 和 `assets/`。如果 `resume` 报告 fingerprint 过期，先重新运行 `inspect`/`plan`；不要强行沿用旧计划。

## 5. 文件职责索引

### 入口、规范与事实

| 路径 | 作用 |
| --- | --- |
| `AGENTS.md` / `CLAUDE.md` | 项目边界、事实源优先级、完成条件和安全约束（双宿主入口，内容同源） |
| `README.md` | 本用户指南 |
| `docs/PROJECT_PROFILE.md` | 技术栈、目录、命令、权限、UI/API 验收的唯一事实源 |
| `docs/rules/AI_*.md`（8 件） | 任务合同、前端任务契约、项目标准、工作流原则、组件目录、验收证据、WebView 移动端规则、兼容矩阵 |
| `docs/rules/FRONTEND_CONVENTIONS.md` | 可选的图标、国际化、样式等前端约定 |
| `docs/capabilities.md` | 三段能力清单：21 内置技能（含来源与更新）/ 宿主插件可选（figma 双路径、GitHub）/ 宿主内置插件核对 |
| `LICENSE` / `NOTICE` | 本仓 MIT 与 vendored 组件归属、许可、修改记录 |

### 技能与机器镜像

| 路径 | 作用 |
| --- | --- |
| `.agents/skills/`（21 技能） | 唯一人工源：5 自研 + 16 vendored；修改只在这里进行 |
| `.claude/skills/` | Claude Code 宿主镜像：`sync-mirror.mjs` 全量重建，文件带 AUTO-GENERATED 头，**不要手改** |

### `.toolkit/` 运行时文件

| 路径 | 作用 |
| --- | --- |
| `.toolkit/manifest.json` | Starter 状态记录 |
| `.toolkit/profile-state.json` | 成熟度、画像状态、模板选择和组件目录状态 |
| `.toolkit/ai-guidance.config.mjs` | 校验所需文件、标记、命令和状态引用 |
| `.toolkit/scripts/check-ai-guidance.mjs` | AI 指引校验器入口（`--strict` 严格模式） |
| `.toolkit/scripts/sync-mirror.mjs` | `.agents` → `.claude` 镜像同步（`--check` 校验漂移） |
| `.toolkit/scripts/lib/ai-guidance-validation.mjs` | 校验器实现，可被测试复用 |
| `.agents/skills/<技能>/templates/` | 画像三模板、组件目录模板与预设、任务输入模板 |

机器状态文件和模板由对应 Skill 管理；不要手工伪造 `initialized`、确认状态或验收成功。

## 6. 如何扩展

### 新增 Skill 或命令

1. 在 `.agents/skills/<name>/` 添加 `SKILL.md`（frontmatter `name` 必须与目录名一致），必要时添加 `agents/openai.yaml`、`references/`、`templates/`。
2. 运行 `node .toolkit/scripts/sync-mirror.mjs` 重建镜像——`.claude/skills` 永远机器生成。
3. 在 `toolkit.json` 的 `skills` 登记；在 `.toolkit/ai-guidance.config.mjs` 的 `requiredFiles`、`additionalSkills` 或 `routing` 登记（如适用）。
4. 若改变任务路由，更新 `project-workflow/references/task-routing.md`；若增加来源，补充 `frontend-task/references/source-routing.md` 和对应 workflow。
5. vendored 技能一律在 `NOTICE` 记上游、快照日期、许可与修改；`docs/capabilities.md` 第 1 节补「来源与更新」行。
6. 新增状态字段时递增 `schemaVersion`，提供迁移和向后兼容说明；保持重复执行幂等。

### 新增模板、规范或验收规则

- 新模板放入对应技能的 `templates/`（如 `.agents/skills/project-profile/templates/`），同时更新选择规则、状态模型、校验配置和 README 文件索引。
- 新增公共组件或 UI 约定时更新 `docs/rules/AI_COMPONENT_CATALOG.md`、`docs/rules/FRONTEND_CONVENTIONS.md`，并说明复用边界。
- 新增安全、接口或 AI 责任规则时更新 `docs/rules/AI_PROJECT_STANDARDS.md`，不要只写在一次性任务里。

每次扩展后，在干净副本中验证“复制 → `$project-profile` → `$frontend-task inspect`”主流程，并运行：

```bash
node .toolkit/scripts/check-ai-guidance.mjs --root .
node .toolkit/scripts/check-ai-guidance.mjs --root . --strict
node .toolkit/scripts/sync-mirror.mjs --check
```

严格模式在画像未确认时失败是预期行为；确认画像后应重新运行并记录结果。

## 7. 常见问题与注意事项

| 现象 | 处理方式 |
| --- | --- |
| 找不到 `$project-profile`/`$frontend-task`/专项技能 | 全部 21 技能随项目内置；核对 `docs/capabilities.md` 第 1 节清单与 `.agents/skills/` 目录，开启新会话让宿主重新发现；不要安装同名第三方 Skill 替代 |
| 画像是 `draft` 或模板 `pending` | 运行 `$project-profile` 选择模板并确认高影响字段；不确定可 defer，不要手填成 `initialized` |
| 任务停在 `awaiting-confirmation` | 阅读 `PLAN.md` 的决策块并运行 `$frontend-task confirm`，确认后再 implement |
| `resume` 提示 fingerprint 过期 | 先 `inspect`，必要时重新 `plan`；来源、路由或画像变化后不要沿用旧计划 |
| AI 指引校验失败 | 先看错误路径和缺失标记，再核对 manifest、配置和对应文件；修复后重跑校验 |
| `.claude/skills` 与 `.agents/skills` 不一致 | 运行 `node .toolkit/scripts/sync-mirror.mjs` 重建镜像；不要手工编辑镜像 |
| 需要 Figma/GitHub 能力 | 见 `docs/capabilities.md` 第 2 节「宿主插件（可选）」；Figma 无插件宿主走 MCP 直连（figma-workflow 有完整用法） |
| 状态文件与仓库不一致 | 运行 `status`/`update` 或任务 `inspect` 重建证据；保留冲突记录，不直接编辑机器状态 |
| 想删除或覆盖文件 | 先检查 Git 状态和影响范围；不要删除 `.toolkit` 状态、迁移历史或旧名称映射，不要覆盖已确认事实 |
| 验收“看起来通过” | 区分静态检查、构建、mock、真实联调和 Browser 证据；未验证项必须留在 `ACCEPTANCE.md`/交付报告 |

## 8. 旧版文档名称映射

| 旧版名称 | 当前名称 |
| --- | --- |
| `AI_PROMPT_ENGINEERING.md` | `AI_WORKFLOW_PRINCIPLES.md` |
| `AI_TASK_PROMPT.md` | `AI_TASK_CONTRACT.md` |
| `AI_PAGE_PROMPT.md` | `AI_FRONTEND_TASK.md` |
| `AI_CAPABILITY_REQUIREMENTS.md` / `CODEX_CAPABILITIES.md` | `docs/capabilities.md` |
| `resources/`（旧 Starter 载体目录） | 仓库根目录即 Starter（2026-09 拓扑拍平） |

保留这张映射表，便于迁移旧项目和检索历史链接；新增内容统一使用当前正式名称。
