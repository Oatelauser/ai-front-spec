# Frontend task subcommands

This is the execution contract for `$frontend-task`. `$project-workflow` chooses the domain and may select a stage; this skill executes the selected frontend stage.

Every stage reads `docs/PROJECT_PROFILE.md`'s `支持端与运行环境`, `.codex/profile-state.json`'s `deliveryTargets`, and the target-relevant entries in `docs/AI_COMPONENT_CATALOG.md`. If either source is missing, deferred, or conflicts with the other, keep the affected decision high-impact and route it to `$project-profile update` or a task-scoped confirmation before implementation.

## Commands and outputs

| Command | Purpose | Writes |
| --- | --- | --- |
| `inspect` | Collect repository, task and source facts; classify task and route sources | Task record when persistence is needed |
| `plan` | Run a round-based decision-frontier interview and produce a plan | `PLAN.md`, `STATE.json` |
| `confirm` | Review a pending plan by decision block and approve, reject or request changes | `PLAN.md`, `STATE.json` |
| `implement` | Apply the current confirmed plan to business code | Source code and task state |
| `verify` | Run acceptance checks selected from task type, sources and impact | `ACCEPTANCE.md`, `STATE.json` |
| `report` | Persist and present the complete delivery report | `ACCEPTANCE.md`, `STATE.json` |
| `resume` | Continue the latest recoverable stage after validating inputs | Task state and permitted outputs |

`$frontend-task` without a stage is a routed full flow. It always performs `inspect` and `plan`, then evaluates high-impact decisions. If any such decision is unresolved, stop at `awaiting-confirmation`; otherwise show a plan summary and continue to implementation under the user's existing task authorization.

## Stage prompts

### `inspect`

```text
建立当前前端任务的可验证事实集，不修改业务代码。
读取项目级路由、画像（含支持端与运行环境）、`.codex/profile-state.json` 的 `deliveryTargets`、前端约定、任务合同和组件目录；检查工作区、目标路由、相邻实现、测试和真实命令；识别 taskType（new-page/incremental/bug-fix/refactor）；识别并记录 screenshot/prototype/html/figma/api/requirement 来源的路径或 URL、版本、读取时间、视口和可访问性；检测来源冲突、缺失、版本变化、画像/组件缺口和所需专项 Skill。
输出事实清单、来源路由、冲突/缺失、相关文件、建议能力以及是否可以进入 plan。不得修改业务代码或把推测写成事实。
```

### `plan`

```text
把 inspect 事实转换成用户可确认、可执行、可验收的计划。
先列出当前决策前沿，只询问前置条件已满足的问题；仓库可查事实不问，已确认决定不重复问。对范围、API 语义、权限、安全、视觉基准、来源冲突、响应式范围和任务类型变化逐轮提问，每题给出推荐答案和影响，等待用户回答后重新计算下一轮。
形成 PLAN.md 时记录任务类型、来源采用/排除、目标路由、文件范围、保留行为、UI/API/状态方案、复用/扩展/业务域/页面私有组件决策、适用 delivery targets、专项 Skill、验收矩阵、风险、override、fingerprint 和失效条件。高影响决定未确认时保持 awaiting-confirmation，不进入依赖它的实现。
```

### `confirm`

```text
读取 pending plan，按“范围与路由、来源与视觉基准、组件和状态、API 与权限、测试与验收”区块展示将修改/不修改内容、排除来源及原因、风险和失效条件。
允许用户批准、拒绝或要求修改区块；只把明确批准的高影响决定标记为 confirmed。可独立切分且不会产生半成品的区块可以单独进入实现，其余保持 pending。
```

### `implement`

```text
仅在 plan 有效、必要高影响决定已确认且当前范围已获授权时写入代码。复用项目已有组件、路由、样式、请求入口和测试；将 mock、假设和 user_override 限定在当前 task-id；实现前重新核对组件目录中的目标端变体、触摸、安全区域和短屏规则。发现计划与实际代码或组件目录冲突时，独立部分可继续，依赖冲突部分暂停并生成 plan 差异，不自动扩大范围。
输出实际修改文件、复用/新增组件、状态交互、API/mock、计划偏差和待验证项。
```

### `verify`

```text
依据 taskType、来源、`deliveryTargets` 和组件目录适用端选择 acceptance matrix，而不是机械执行固定命令。运行仓库中真实存在且适用的测试、类型检查、lint、构建、Browser、视觉对比和接口验证；区分通过、失败、跳过、未运行和不适用；区分真实联调、mock 和未验证。记录复现/回归、loading/empty/error/unauthorized/disabled/success 等适用状态及证据。
```

### `report`

```text
生成完整交付报告：目标与 taskType；采用、未采用和冲突来源及原因；实际修改文件；复用/扩展/新增组件及其目录影响；适用 delivery targets；计划偏差；实际命令和验证结果；未验证项；mock、假设和 task-scoped override；项目画像/组件目录状态；当前 taskStatus；后续待决定事项。构建成功、HTTP 200、静态检查或 mock 不得单独表述为业务验收完成。
```

## Routing and confirmation

`$project-workflow` may route `frontend-task.inspect`, `frontend-task.plan`, `frontend-task.full`, `frontend-task.verify`, `frontend-task.report` or `frontend-task.resume`. A source flag such as `--source=figma,api` and a task flag such as `--type=new-page` are priority hints; inspect must verify them and record excluded materials.

`plan` uses a `$grill-me`-style frontier interview. `confirm` is the final block review, not a per-file permission prompt. A user request to “直接实现” authorizes ordinary implementation only after inspect has judged the high-impact boundary.

## High-impact gate

Treat framework/build/entry, route scope, API fields or submission semantics, auth/permission/security, source conflicts, responsive/visual baseline, shared component or route expansion, and task-type changes as high impact. If evidence cannot establish that a decision is low impact, keep it unresolved and ask. The user may choose a task-scoped override to continue, but the risk remains visible in the task record and report.
