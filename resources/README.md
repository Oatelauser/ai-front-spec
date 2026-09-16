# Codex 前端项目 Starter 使用指南

`resources/` 是一套可复制的项目规则与工作流模板，不是业务应用，也不会替你创建框架、路由或接口。把它复制到业务项目根目录后，代理会有统一的项目画像、任务流程、验收记录和能力安装边界。

## 1. 安装与首次检查

### 复制整个 Starter

请在本仓库根目录执行。复制前先确认目标目录和 Git 状态；复制动作不会删除目标中的文件，但同名文件可能无法覆盖，遇到冲突应人工合并。

PowerShell：

```powershell
node scripts/build-starter.mjs --target C:\work\my-project
```

Bash：

```bash
node scripts/build-starter.mjs --target ./my-project
```

也可以手工复制 `resources/` 下的全部内容，但不要只复制 `README.md` 或漏掉隐藏目录 `.agents/`、`.codex/`。Starter 不包含 `$bootstrap-project`，复制完成后不要运行这个旧入口。

### 验证复制结果

在本仓库根目录：

```bash
node scripts/build-starter.mjs --check
node --test scripts/lib/*.test.mjs
```

在已复制的业务项目根目录：

```bash
node .codex/scripts/check-ai-guidance.mjs --root .
```

`--strict` 会把画像草稿和 `<待填写>` 占位符视为失败；这是提醒事实尚未确认，不代表 Starter 文件损坏。

## 2. 命令总览

下面的 `$` 命令由 Codex 宿主识别；如果宿主尚未发现对应 Skill，请先运行 `$codex-capability-setup` 做能力审计，不要用同名的第三方 Skill 替代。

| 命令 | 用途 | 是否写文件 | 何时需要确认 | 主要产物/输出 |
| --- | --- | --- | --- | --- |
| `$project-profile` | 只读展示平级初始化入口、推荐路径和可用子命令 | 只读 | 从不 | 当前状态与下一步建议 |
| `$project-profile init` | 新项目一次扫描、七张高影响决策卡片、提案确认和分层提交 | 会写两域文件 | 成熟度必须为 `unformed`；每层写入需确认 | `.codex/profile-proposal.json`、画像、组件目录和状态 |
| `$project-profile profile` | 判断项目成熟度并初始化/更新项目画像 | 会写画像和画像状态 | 框架、命令、目录、API、权限、验收、模板迁移等高影响字段 | `docs/PROJECT_PROFILE.md`、`.codex/profile-state.json` |
| `$project-profile components` | 读取成熟度和画像，初始化/更新 UI 公共组件目录 | 会写组件目录和组件状态 | 组件基线、公共边界、合并/扩展决策 | `docs/AI_COMPONENT_CATALOG.md`、`.codex/profile-state.json` |
| `$project-profile status` | 查看画像、成熟度和组件目录状态 | 只读 | 从不 | 双状态、占位符、冲突 |
| `$project-profile update` | 扫描现有项目并协调画像与组件目录更新 | 可能写入 | 高影响变更、缺失文件创建、模板迁移前 | 两个域的变更字段、保留决定、冲突、校验结果 |
| `$project-workflow` | 项目级入口，路由到最小 Skill 和阶段 | 视被路由阶段而定 | 由具体 Skill 决定 | 计划、实现或验收报告 |
| `$frontend-task` | 前端任务完整流程 | 通常会写任务记录和业务代码 | 高影响决定未确认时停在 `awaiting-confirmation` | `docs/tasks/<task-id>/` 下的任务产物 |
| `$frontend-task inspect` | 收集事实、来源和任务类型，不实现代码 | 可能写任务记录 | 不需要 | 事实清单、来源路由、缺口 |
| `$frontend-task plan` | 多轮决策访谈并生成计划 | 会写 | 计划中的高影响块 | `PLAN.md`、`STATE.json` |
| `$frontend-task confirm` | 按范围、视觉、状态、API/权限、验收分块确认计划 | 会写状态 | 用户逐块批准/拒绝 | 更新后的 `PLAN.md`、`STATE.json` |
| `$frontend-task implement` | 按已确认计划实现业务代码 | 会写业务代码 | 必须已有有效计划和授权 | 源码、任务状态 |
| `$frontend-task verify` | 运行适用的测试、构建、Browser/API 和状态验收 | 会写 | 不替代业务确认 | `ACCEPTANCE.md`、`STATE.json` |
| `$frontend-task report` | 汇总修改、命令、证据、未验证项和偏差 | 会写 | 不需要 | 完整交付报告 |
| `$frontend-task resume [--from=<stage>]` | 恢复最近可继续的阶段 | 视阶段而定 | fingerprint 过期时需重新 inspect/plan | 更新任务状态和阶段产物 |
| `$codex-capability-setup` | 审计、按授权安装并验证外部能力 | 审计只读；安装会写环境 | 安装缺失能力前需授权 | `docs/capability-state.json`、安装报告 |

## 3. 用户画像操作

用户画像的唯一事实源是 `docs/PROJECT_PROFILE.md`，组件目录的事实源是 `docs/AI_COMPONENT_CATALOG.md`，机器状态统一记录在 `.codex/profile-state.json`。模板和组件基线只是候选，不是事实；只有用户明确确认才会记录为 `user-confirmed`。

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

新项目也可以使用 `$project-profile init`：它只接受成熟度扫描判定的 `unformed` 项目，集中询问七张决策卡片，生成可编辑的 `.codex/profile-proposal.json`。提案先展示推荐值、依据、影响字段和追踪矩阵；用户确认后才按“事实、用户决定、推荐、组件规划、deferred”分层写入。Q1 默认推荐桌面 Web、移动 H5、平板响应式，WebView/PWA 暂缓；`multiPlatform` 只能由确认的端类型派生。已有业务代码或稳定规范时应使用 `update`，不能用 `init` 覆盖。

1. 选择与仓库证据相符的模板；不确定时选择 defer，保留 `draft + pending`。
2. 明确语言、目标用户、技术栈、源码/组件目录、质量命令、权限来源和验收矩阵。
3. 只确认有证据的事实；不要把模板默认值当成项目事实。
4. 对每个字段给出事实、`无`、`不适用` 或明确 defer 理由；“项目名称”“集成测试”“覆盖率”“维护负责人”等低影响字段也不能被汇总跳过。
5. 查看每轮写入的校验结果和剩余 frontier；画像完成或暂缓保存后，可执行 `$project-profile components`。

`components` 的顺序是“读取组件目录结构模板和候选预设 → 读取或计算共享成熟度 → 读取画像已确认事实 → 给出组件基线候选 → 等待用户选择 → grilling 填充目录全部占位符 → 校验”。空/萌芽项目至少展示：Vue 的 Element Plus、React 的 Ant Design、generic 的框架中立基础组件契约，以及“自定义”“暂缓”。推荐项必须由用户选择；未实现组件标记为 `planned`，不能冒充代码事实。

项目级端支持写在 `docs/PROJECT_PROFILE.md` 的“支持端与运行环境”，机器态对应 `.codex/profile-state.json.deliveryTargets`；组件目录只记录组件级端差异，例如移动变体、触摸行为、安全区域和短屏规则。`$frontend-task` 在每个阶段都会读取两者，不能只在 `inspect` 读取一次。

如果直接执行 `$project-profile components` 而没有带 `assessedAt` 和证据的成熟度记录，命令会先执行共享成熟度扫描；如果画像关键 UI 字段未确认，仍可以展示模板预设候选，但必须等待用户选择并标注其为规划方案，不能越权填写项目画像。

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

可以直接在对话中描述，也可以复制 `.codex/templates/frontend-task.template.json` 后填写任务输入。模板中的 `<待填写>` 只应替换为当前任务事实，不要修改 Starter 模板本身：

```json
{
  "taskId": "user-detail-page",
  "taskType": "new-page",
  "goal": "用户可以查看并编辑自己的资料",
  "sources": [
    { "type": "figma", "url": "<Figma URL>", "version": "<版本或节点>" },
    { "type": "api", "path": "docs/api/user.md", "version": "<版本>" }
  ],
  "target": { "route": "/users/:id", "path": "src/pages/UserDetail" },
  "constraints": ["复用现有表单组件", "不改变已有权限语义"],
  "acceptance": ["可读取、编辑、保存", "覆盖 loading/error/unauthorized"],
  "requestedStage": "full"
}
```

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
| `implement` | 确认计划有效，必要时提供获授权的 override | 复用现有基础设施，先补失败测试，再实现 loading/empty/error/unauthorized/disabled/success 等适用状态 | 业务代码和任务状态；计划冲突部分单独暂停 |
| `verify` | 提供非生产环境、测试账号/数据和可用 Browser（如需） | 运行真实存在的测试、类型检查、构建、Browser/API 和状态验收；区分 mock/真实联调 | 写入 `ACCEPTANCE.md`；失败则修复后重跑 |
| `report` | 确认交付范围及仍可接受的未验证项 | 汇总修改文件、命令/退出码、路由操作、证据、偏差和后续条件 | 交付报告；未验证项不能写成已完成 |

`inspect` 可以单独用于“只调查不改代码”；`verify` 可以用于已有实现的专项验收；`resume [--from=<stage>]` 用于中断后恢复，不会替代过期计划的重新检查。

- `inspect` 记录来源路径或 URL、版本/读取时间、视口与 DPR，识别 `new-page`、`incremental`、`bug-fix` 或 `refactor`。
- `plan` 采用决策前沿访谈，明确目标路由、复用组件、状态、API 字段、权限、响应式范围和验收矩阵。
- `confirm` 只确认决策块，不按文件逐个索要许可。框架/入口、路由范围、API 提交语义、身份权限、安全、视觉基准、响应式和共享组件扩展均属高影响决定。
- `implement` 仅实现有效且已确认的计划；mock、假设和 `user_override` 必须标注在当前任务内。
- `verify` 区分通过、失败、跳过、未运行、不适用，以及真实联调、mock 和未验证；适用时检查 loading、empty、error、unauthorized、disabled、success 和安全可重试。
- `report` 必须列出实际修改文件、命令与结果、计划偏差、未验证项和后续决定；构建成功或 HTTP 200 不能单独代表业务验收完成。

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
4. **状态与极端内容**：按适用范围检查 loading、empty、error、unauthorized、disabled、success、retry，以及长文本、零值、缺失字段、大量数据和短屏溢出。
5. **可访问性与响应式**：键盘顺序、焦点可见、可访问名称、标签/错误关联、对比度、减少动态效果、断点两侧布局和触摸操作。
6. **证据交付**：记录通过、失败、未验证、不适用；附截图或脱敏请求记录。Mock、截图、构建成功和 HTTP 200 都不能单独证明业务流程成功。

复杂、多轮或视觉任务会在 `docs/tasks/<task-id>/` 保存：

| 文件 | 内容 |
| --- | --- |
| `TASK.md` | 原始需求、任务类型、目标和来源摘要 |
| `PLAN.md` | 决策轮次、范围、方案、风险和确认记录 |
| `STATE.json` | 阶段状态、fingerprint、覆盖项和可恢复信息 |
| `ACCEPTANCE.md` | 验收矩阵、实际命令、证据和未验证项 |
| `assets/` | 需要纳入任务证据的本地截图、原型或 HTML |

如果 `resume` 报告 fingerprint 过期，先重新运行 `inspect`/`plan`；不要强行沿用旧计划。`user_override` 只对当前任务生效，不会修改项目画像。

## 5. 文件职责索引

### 入口、规范与事实

| 路径 | 作用 |
| --- | --- |
| `AGENTS.md` | 项目边界、事实源优先级、完成条件和安全约束 |
| `README.md` | 本用户指南、命令、流程、扩展与文件索引 |
| `docs/PROJECT_PROFILE.md` | 技术栈、目录、命令、权限、UI/API 验收的唯一事实源 |
| `docs/AI_TASK_CONTRACT.md` | 通用任务提示词合同：目标、上下文、约束、完成条件 |
| `docs/AI_FRONTEND_TASK.md` | 前端任务类型、来源、阶段、状态与验收契约 |
| `docs/AI_PROJECT_STANDARDS.md` | AI 责任、数据安全、接口和研发边界 |
| `docs/AI_WORKFLOW_PRINCIPLES.md` | 提示词分层、事实优先级和反馈沉淀规则 |
| `docs/AI_COMPONENT_CATALOG.md` | 公共组件选用顺序、矩阵和扩展规则 |
| `docs/AI_ACCEPTANCE_EVIDENCE.md` | 交付验收证据报告模板 |
| `docs/FRONTEND_CONVENTIONS.md` | 可选的图标、国际化、样式等前端约定 |
| `docs/CODEX_CAPABILITIES.md` | 插件、Skill、Browser/Figma/GitHub 等能力的来源与安装政策 |
| `docs/capability-state.json` | 当前项目能力审计和安装状态 |

### Skills 与参考资料

| 路径 | 作用 |
| --- | --- |
| `.agents/skills/project-workflow/SKILL.md` | 总流程入口和任务路由 |
| `.agents/skills/project-workflow/agents/openai.yaml` | Skill 展示元数据和默认提示 |
| `.agents/skills/project-workflow/references/task-routing.md` | 任务类型到 Skill/插件的最小组合矩阵 |
| `.agents/skills/project-profile/SKILL.md` | 画像初始化、状态、更新、迁移和校验 |
| `.agents/skills/project-profile/agents/openai.yaml` | 画像 Skill 元数据 |
| `.agents/skills/project-profile/references/state-model.md` | 画像状态字段和状态机 |
| `.agents/skills/project-profile/references/template-selection.md` | `generic`/`react`/`vue`/`defer` 选择规则 |
| `.agents/skills/project-profile/references/update-policy.md` | 事实更新、冲突和幂等迁移政策 |
| `.agents/skills/frontend-task/SKILL.md` | 前端任务执行入口和阶段总则 |
| `.agents/skills/frontend-task/agents/openai.yaml` | 前端 Skill 元数据 |
| `.agents/skills/frontend-task/references/subcommands.md` | 子命令、输出、写入边界和高影响闸门 |
| `.agents/skills/frontend-task/references/task-state.md` | 任务记录目录、状态 schema 和 fingerprint |
| `.agents/skills/frontend-task/references/source-routing.md` | screenshot/prototype/html/figma/api/requirement 来源路由 |
| `.agents/skills/frontend-task/references/common-workflow.md` | 所有前端任务共用的执行契约 |
| `.agents/skills/frontend-task/references/requirement-workflow.md` | 从文字需求提取页面、流程和验收 |
| `.agents/skills/frontend-task/references/screenshot-workflow.md` | 截图解析、布局复用和一比一还原流程 |
| `.agents/skills/frontend-task/references/prototype-workflow.md` | 原型到页面与用户流程的转换 |
| `.agents/skills/frontend-task/references/html-workflow.md` | 既有 HTML 改造与框架迁移流程 |
| `.agents/skills/frontend-task/references/figma-workflow.md` | Figma 节点读取、设计到工程映射 |
| `.agents/skills/frontend-task/references/api-workflow.md` | API 契约、DTO/VO/UI 映射和请求状态 |
| `.agents/skills/frontend-task/references/acceptance-matrix.md` | 响应式、主题、交互、可访问性和状态验收矩阵 |
| `.agents/skills/codex-capability-setup/SKILL.md` | 能力审计、授权安装和新会话验证 |
| `.agents/skills/codex-capability-setup/agents/openai.yaml` | 能力 Skill 元数据 |
| `.agents/skills/codex-capability-setup/references/setup-phases.md` | A 审计、B 安装、C 验证三阶段 |
| `.agents/skills/codex-capability-setup/references/install-policy.md` | 安装授权与来源限制 |
| `.agents/skills/codex-capability-setup/references/status-model.md` | 能力状态模型 |
| `.agents/skills/codex-capability-setup/references/verification-checklist.md` | 安装后发现性和可用性检查 |
| `.agents/skills/codex-capability-setup/templates/approval-input.md` | 能力安装批准输入模板 |

### `.codex/` 运行时文件

| 路径 | 作用 |
| --- | --- |
| `.codex/manifest.json` | Starter 元数据、必需文件和附加 Skill 清单 |
| `.codex/profile-state.json` | 成熟度、画像状态、模板选择和组件目录状态 |
| `.codex/ai-guidance.config.mjs` | 校验所需文件、标记、命令和状态引用 |
| `.codex/scripts/check-ai-guidance.mjs` | 运行本地 AI 指引校验器 |
| `.codex/scripts/lib/ai-guidance-validation.mjs` | 校验器实现，可被测试复用 |
| `.codex/templates/project-profile.{generic,react,vue}.md` | 三种画像候选模板 |
| `.codex/templates/component-catalog.template.md` | UI 组件目录的统一结构模板 |
| `.codex/templates/component-catalog.{generic,react,vue}.md` | 可直接选择的 generic、React、Vue 组件目录预制模板 |
| `.codex/templates/component-catalog.presets.json` | generic/React/Vue 组件基线候选和用户选择项 |
| `.codex/templates/frontend-task.template.json` | 前端任务输入模板 |
| `.codex/templates/task-state.template.json` | 任务状态模板 |
| `.codex/templates/capability-state.template.json` | 能力状态模板 |

机器状态文件和模板由对应 Skill 管理；不要手工伪造 `initialized`、确认状态或验收成功。

## 6. 如何扩展

### 新增 Skill 或命令

1. 在 `.agents/skills/<name>/` 添加 `SKILL.md`，必要时添加 `agents/openai.yaml`、`references/`、`templates/`。
2. 在 `.codex/manifest.json` 的 `requiredFiles`、`additionalSkills` 或 `routing` 中登记；同步 `ai-guidance.config.mjs` 的必需文件和触发标记（如适用）。
3. 若改变任务路由，更新 `project-workflow/references/task-routing.md`；若增加来源，补充 `frontend-task/references/source-routing.md` 和对应 workflow。
4. 新增状态字段时递增 `schemaVersion`，提供迁移和向后兼容说明；保持重复执行幂等。
5. 在 `docs/CODEX_CAPABILITIES.md` 登记外部插件/Skill 的精确来源、授权和验证方式。

### 新增模板、规范或验收规则

- 新模板放入 `.codex/templates/`，同时更新选择规则、状态模型、校验配置和 README 文件索引。
- 新增公共组件或 UI 约定时更新 `docs/AI_COMPONENT_CATALOG.md`、`docs/FRONTEND_CONVENTIONS.md`，并说明复用边界。
- 新增安全、接口或 AI 责任规则时更新 `docs/AI_PROJECT_STANDARDS.md`，不要只写在一次性任务里。
- 新增必需文件、章节标记或禁止模式时同步校验配置和测试。

每次扩展后，在干净副本中验证“复制 → `$project-profile` → `$frontend-task inspect`”主流程，并运行：

```bash
node .codex/scripts/check-ai-guidance.mjs --root .
node .codex/scripts/check-ai-guidance.mjs --root . --strict
```

严格模式在画像未确认时失败是预期行为；确认画像后应重新运行并记录结果。保持公开命令语义、旧文档重命名映射和现有文件可读性，避免直接删除旧入口。

## 7. 常见问题与注意事项

| 现象 | 处理方式 |
| --- | --- |
| 找不到 `$project-profile`/`$frontend-task` | 运行 `$codex-capability-setup` 审计宿主能力；按 `docs/CODEX_CAPABILITIES.md` 的精确来源安装，不要假装可用 |
| 画像是 `draft` 或模板 `pending` | 运行 `$project-profile` 选择模板并确认高影响字段；不确定可 defer，不要手填成 `initialized` |
| 任务停在 `awaiting-confirmation` | 阅读 `PLAN.md` 的决策块并运行 `$frontend-task confirm`，确认后再 implement |
| `resume` 提示 fingerprint 过期 | 先 `inspect`，必要时重新 `plan`；来源、路由或画像变化后不要沿用旧计划 |
| AI 指引校验失败 | 先看错误路径和缺失标记，再核对 manifest、配置和对应文件；修复后重跑校验 |
| 外部能力未安装/不可发现 | 读取能力清单，完成授权安装和新会话验证；Browser/Figma/GitHub 的真实能力不能用普通 shell 冒充 |
| 状态文件与仓库不一致 | 运行 `status`/`update` 或任务 `inspect` 重建证据；保留冲突记录，不直接编辑机器状态 |
| 想删除或覆盖文件 | 先检查 Git 状态和影响范围；不要删除 `.codex` 状态、迁移历史或旧名称映射，不要覆盖已确认事实 |
| 验收“看起来通过” | 区分静态检查、构建、mock、真实联调和 Browser 证据；未验证项必须留在 `ACCEPTANCE.md`/交付报告 |

## 8. 旧版文档名称映射

| 旧版名称 | 当前名称 |
| --- | --- |
| `AI_PROMPT_ENGINEERING.md` | `AI_WORKFLOW_PRINCIPLES.md` |
| `AI_TASK_PROMPT.md` | `AI_TASK_CONTRACT.md` |
| `AI_PAGE_PROMPT.md` | `AI_FRONTEND_TASK.md` |
| `AI_CAPABILITY_REQUIREMENTS.md` | `CODEX_CAPABILITIES.md` |

保留这张映射表，便于迁移旧项目和检索历史链接；新增内容统一使用当前正式名称。
