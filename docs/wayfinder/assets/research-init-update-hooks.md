# 研究：init 与 update 机制的接入点

> 对应工单：`docs/wayfinder/tickets/01-research-init-update-hooks.md`；日期：2026-09-21。
> 方法：只读精读 hub 仓库一手源文件（`C:\Users\yangsheng\Desktop\ai-front-spec\`），所有结论附 文件路径:行号 与原文关键句。行号以 2026-09-21 工作区为准。
> 供工单 02（决策卡与 update 接入设计）、03（兼容性矩阵）、04（规则层结构）、05（vue-webview 模板终稿）引用。

---

## A. init 决策卡机制

### A1. 七张卡是什么、定义在哪

卡片集合双源定义：**规格文本** `resources/.agents/skills/project-profile/references/init-workflow.md` + **可编辑提案脚手架** `resources/.codex/templates/profile-proposal.template.json`。init 运行时从答案生成实例 `.codex/profile-proposal.json`（SKILL.md 步骤 3，`resources/.agents/skills/project-profile/SKILL.md:31`："Build `.codex/profile-proposal.json` from answers and evidence"）。

七张卡（`init-workflow.md:11-19` 表格）：

| 卡 | 决策 | 推荐默认 | 影响字段 |
| --- | --- | --- | --- |
| Q1 | Delivery targets and runtime contexts | "Browser Web + mobile H5 + tablet responsive; **WebView/PWA deferred**" | `deliveryTargets`, browser matrix, viewport matrix |
| Q2 | 产品形态与渲染 | Responsive Web + SPA + History | product shape, rendering, routing, deployment |
| Q3 | 框架与运行时 | Vue 3 + TypeScript + Vite | framework, runtime, package manager, commands |
| Q4 | 视觉与组件基线 | semantic tokens + adapter（Vue→Element Plus） | style, theme, icon, component baseline |
| Q5 | 移动交互与响应式 | Mobile-first, touch-safe, safe-area | breakpoints, touch, short-screen, safe area |
| Q6 | 数据、认证与安全 | real API + labeled mocks + server auth | request layer, DTO/VO, auth, permissions |
| Q7 | 质量与浏览器验收 | Desktop + mobile Browser/Playwright | commands, browser matrix, evidence |

Q1 硬规则（`init-workflow.md:21` 原文）："Q1 must always present a default that enables `browserWeb`, `mobileH5`, and `tabletWeb`. `multiPlatform` is derived from the confirmed target set; it is never independently edited."

### A2. 卡的结构（问题/选项/推荐/代价提示的先例）

JSON 卡片字段（`profile-proposal.template.json:7`，Q1 原文）：

```json
{ "id": "Q1", "title": "支持端与运行环境", "status": "recommended",
  "recommendation": "browser-web + mobile-h5 + tablet-web",
  "alternatives": ["desktop-only", "mobile-only", "custom"],
  "fields": [], "impacts": [] }
```

- **问题** = `title`；**推荐** = `recommendation`（status 停在 `recommended` 直到被接受）；**选项** = `alternatives` 数组——"新增一个选项"的既有槽位就是它。
- **代价提示：没有专用字段。** 两个最近先例：① JSON `impacts: []` 数组（模板全为空，属预留槽）；② 展示层硬要求（`init-workflow.md:27`）："Show the recommendation, alternatives, evidence, confidence, affected files/fields, and downstream component implications."——代价/下游影响是每卡必须展示的信息，但不是 schema 字段。webview 选项的"旧内核 CSS 兜底、真机验收、JSBridge 封装成本"照此写进 Q1 的展示文案与 `impacts`，零 schema 改动。
- 交互规则（`init-workflow.md:25-30`）：用户可 accept / choose A/B/C/D / 逐值编辑；改 Q3 会重算 Q4（依赖卡重算先例）；答案只进 proposal，"do not write the final Markdown or state facts yet"。
- 分层提交（`init-workflow.md:32-44` + `SKILL.md:33`）：facts / userDecisions / recommendations / componentPlan / deferred 五层，"Only approved layers are materialized"，被拒推荐保留为 `deferred`/`conflict` 不静默替换。

### A3. 新增选项 vs 新增一张卡：改动面对比

**结论：往 Q1 加 webview 选项改动面小一个数量级；新增 Q8 会被两道硬门禁直接拦下。**

新增卡的破坏面（全部必须动）：
1. `scripts/lib/ai-guidance-validation.mjs:117-119`（PE016）：`if (!['Q1'...'Q7'].every(id => ids.includes(id)) || ids.length !== 7)` —— "profile proposal 模板必须包含且仅包含 Q1-Q7 七张决策卡片"。**且此校验器在 starter 内有逐字节相同的第二份副本** `resources/.codex/scripts/lib/ai-guidance-validation.mjs`（同 117-119 行），两份都要改。
2. `scripts/lib/project-profile.test.mjs:101`：`assert.deepEqual(proposal.cards.map(card => card.id), ['Q1'...'Q7'])`。
3. "seven/七张"散文改写：`SKILL.md:30`（"ask seven high-level decision cards"）、`init-workflow.md:3` 与 `:9`（"Seven cards"）、`resources/README.md:86`、根 `README.md:32`。
4. `init-workflow.md:11-19` 表格 + `profile-proposal.template.json` cards 数组本身，及 traceability 语义。

新增选项（进 Q1）的改动面：`init-workflow.md:13`（Q1 行：默认文案从"WebView/PWA deferred"改为"WebView/PWA 默认暂缓、可选启用"+ 代价提示）、`profile-proposal.template.json:7`（Q1.alternatives 加一项）、宣传文案同步 `resources/README.md:86` / 根 `README.md:32` 两句。**无任何 validator/test 约束 alternatives 内容**——枚举校验只查卡片 id 集合，不查选项值。

---

## B. deliveryTargets 生命周期

### B1. 结构

`resources/.codex/profile-state.json:21-28`（与规格 `references/state-model.md:26-33` 一致）：

```json
"deliveryTargets": {
  "browserWeb": { "status": "pending", "value": null },
  "mobileH5":   { "status": "pending", "value": null },
  "tabletWeb":  { "status": "pending", "value": null },
  "webview":    { "status": "pending", "value": null },
  "pwa":        { "status": "pending", "value": null },
  "multiPlatform": { "status": "pending", "value": null, "derived": true }
}
```

**webview 已是一等键**，无需加字段。机器状态枚举（`ai-guidance-validation.mjs:89`）：`['pending', 'recommended', 'user-confirmed', 'deferred', 'conflict']`——注意 confirmed 的正式名是 **`user-confirmed`**（无裸 "confirmed"）。校验规则（`:93-101`）：六键必须各含合法 status + value 键，`multiPlatform.derived` 必须为 true（"不能作为独立事实编辑"）。

人类可读层：`docs/PROJECT_PROFILE.md` 第 3 节"支持端与运行环境"表格（`:28-39`），WebView 行 `:34`：`| WebView | <待填写> | <待填写：微信、企业微信、App WebView 或"不支持"> |`。注意 `:30` 多端适配行的状态占位符词表是 "user-confirmed / recommended / deferred / **unsupported**"——`unsupported` 只存在于文档层词表，不在机器枚举里；新增选项文案时以机器五值为准，"不支持"走 value 表达。

### B2. deferred → confirmed 的判定证据

- `init-workflow.md:28`："A recommendation remains `recommended` until accepted."
- `SKILL.md:31`："Recommendations remain `recommended` until explicitly approved."
- `docs/PROJECT_PROFILE.md:26`："推荐值只有在用户确认后才是事实。"
- 模板选择的同构先例（`references/template-selection.md:12`）："only an explicit user choice creates `user-confirmed` selection. When evidence disagrees with the selected template, report `conflict`"。
- 即：**只有显式用户接受**把 status 推到 `user-confirmed`；仓库证据只能给 `recommended`；分歧记 `conflict`；拒绝/未知保留 `deferred`（带 reason/impact/follow-up，`SKILL.md:35`、`init-workflow.md:44`）。

### B3. 谁在什么时候读写它

**写方（三个，全走显式决策）**：
1. `init`：扫描→七卡→proposal→分层审批→"Materialize approved layers into `docs/PROJECT_PROFILE.md`, `docs/AI_COMPONENT_CATALOG.md`, and `.codex/profile-state.json` **atomically**"（`SKILL.md:34`）。完成条件含 "`deliveryTargets` agrees with the readable table"（`init-workflow.md:48`）——机器态与人类表必须一致，这是 webview 接入后现成的校验钩子。
2. `profile` grilling：逐占位符分轮访谈，"Apply changes idempotently... never overwrite a confirmed field with an inferred value"（`SKILL.md:50`）；defer 记入 `state.unresolved`（`:47`）。
3. `update`：**可以变更 deliveryTargets，但必须经访谈、不可静默**。`SKILL.md:66`："applies only unambiguous low-impact facts, then routes changed or unresolved profile fields to the `profile` interview"；`update-policy.md:6`："Ask before changing framework, runtime, package manager, source layout, API semantics, authentication, permissions, generated-code ownership, or acceptance rules"——端目标属高影响，走询问路径；`:9` "Keep migration idempotent"；`SKILL.md:67` "update never changes a confirmed template choice, silently performs migration"。**"update 后补加选 webview" 零新机制：就是 update→profile interview→改 Q1 对应字段→联动 multiPlatform 派生。**

**读方（运行时持续读，每阶段）**：
- `resources/AGENTS.md:17`："任何前端任务在 `inspect` 前必须读取 `docs/PROJECT_PROFILE.md` 的'支持端与运行环境'、`.codex/profile-state.json` 的 `deliveryTargets` 和 `docs/AI_COMPONENT_CATALOG.md`；`plan`、`implement`、`verify`、`report` 也必须持续读取这三份约束。"
- `frontend-task/SKILL.md:27`（每阶段必读）、`:29`（缺口处理）、`:32`（"Verify the target types declared by `deliveryTargets`"）。
- `frontend-task/references/subcommands.md:5`（每阶段读）、`:27`（inspect 读）、`:56`（"依据 taskType、来源、`deliveryTargets` 和组件目录适用端选择 acceptance matrix"）。
- `frontend-task/references/acceptance-matrix.md:50`（"根据画像选择桌面、平板、移动代表尺寸……不支持端需核对明确降级行为"）。
- `docs/AI_FRONTEND_TASK.md:9`（全流程契约）、`:37`（"已按 `deliveryTargets` 验证所有声明的端类型"）。
- 三个画像模板第 3 节（如 `project-profile.vue.md:28`）。
- 校验器（B1 所引，两份副本）。

### B4. 变更时触发什么

1. **multiPlatform 重算**：`init-workflow.md:21` + validator `derived=true` 强制——加选 webview 后 multiPlatform 自动含它，不可手编。
2. **状态门控（AGENTS.md:18）**："`deliveryTargets` 缺失、冲突或处于 `deferred` 时不得猜测目标端；组件目录与画像不一致时提示 `$project-profile update`，或记录任务级确认后再继续。"——这是"含 webview 且 user-confirmed 才生效"语义的现成词表：pending/recommended/deferred/conflict 都不算确认。
3. **任务层缺口路由（frontend-task/SKILL.md:29）**：缺口高影响时 "Prompt the user to run `$project-profile` or provide a task-scoped override"。
4. **PE016 机械门禁**：结构非法即 fail（B1）。
5. 机器表 vs 人类表一致性要求（`init-workflow.md:48`）。

---

## C. 条件阅读路由

### C1. 既有路由的三种键

**强制入口块 = `resources/AGENTS.md:10-21`（"强制入口与按需读取"）。** 里面同时存在三种路由键：

1. **无条件必读**（`:17`）：三份约束（画像支持端节 + deliveryTargets + 组件目录），任何前端任务每阶段。
2. **任务类型条件读**（`:19`，原文）："**接口、身份、权限、数据、AI 责任或安全任务读取** [项目研发规范](docs/AI_PROJECT_STANDARDS.md)。"——这就是"满足条件才读某 docs 文档"的可照抄句式。另一例 `:16`："**新增或大改页面时**使用 [页面提示词](docs/AI_FRONTEND_TASK.md)，并读取 [组件目录]"。
3. **画像状态门控**（`:18`）：deliveryTargets 缺失/冲突/deferred → 禁止猜测 + 提示 update 或任务级确认——按**状态**路由，但产物是"停下/提示"，不是"加载某文档"。

按**输入来源**的条件加载另有一套：`frontend-task/SKILL.md:27` "Load only the source-specific reference that matches the input"；`frontend-task/references/source-routing.md:9-18` 的来源→流程路由表（Figma/截图/原型/HTML/API/需求六行）。**source-routing.md 只按来源和任务意图路由，不按画像字段值路由。**

按 deliveryTargets 值路由的仅有两处，且都是**行为**不是**文档加载**：`subcommands.md:56`（按 deliveryTargets 选验收矩阵）、`acceptance-matrix.md:50`（按画像选视口/降级核对）。

### C2. 结论：完全相同先例不存在；可拼装

"读 AI_WEBVIEW_MOBILE.md 当且仅当 deliveryTargets 含 webview 且 user-confirmed"——**按画像字段值条件加载指定文档的先例，既有机制里没有完全相同的**。最近似的是 AGENTS.md:19（条件句式）× AGENTS.md:17（每阶段持续读）× AGENTS.md:18（状态词表：含 webview=user-confirmed 才生效；deferred/缺失/conflict 不得猜测）。新写法只需在强制入口块 :17/:19 之间加一行，句式直接仿 :19：

> `deliveryTargets.webview` 为 `user-confirmed` 的前端任务，每阶段读取 [WebView 与移动端规则](docs/AI_WEBVIEW_MOBILE.md)；`pending`/`deferred`/`conflict` 时按上条不得猜测目标端处理。

### C3. 新文档进这条链要动的点（清单）

1. `resources/AGENTS.md` 强制入口块加一行条件读取（唯一的路由接线点；Claude Code 原生读 AGENTS.md，零适配——MAP.md:22 已锁）。
2. `resources/.codex/ai-guidance.config.mjs:4-43` `requiredFiles` 注册新文档——**校验器只读 requiredFiles 列表**（`scripts/check-ai-guidance.mjs:53-58`：`config.requiredFiles.map(...)`），不注册就脱离 PE001/PE008/PE011/PE012 全部门禁。
3. `frontend-task` 侧同步（可选但建议）：`SKILL.md:27` 必读清单加条件项，或 `references/subcommands.md:5/27` 阶段描述带一句——AGENTS.md 已是上游约束，这里属于冗余加固。
4. 链接合法性：AGENTS.md 属 requiredFiles，其 markdown 链接被 `validateLocalLinks`（PE008）核验目标存在——文件建好即自动满足。
5. 变更后必跑门禁（AGENTS.md:34）："提示词、Skill、路由或 AI 指引变更必须运行 `node .codex/scripts/check-ai-guidance.mjs --root .` 和 Skill 校验器。"

**注意**：注册进 requiredFiles 后，新文档不得含 `<待填写...>` 占位符（严格模式 PE012）且受 forbiddenPatterns（PE011）约束——规则文档必须是成品文，不是模板。

---

## D. 模板选择机制

### D1. profiles → starter 复制的真实机制

`toolkit.json:6-16`：

```json
"starter": { "sourceRoot": "resources", "copyContentsToProjectRoot": true,
             "runtime": ["AGENTS.md", "docs", ".agents", ".codex"] },
"profiles": { "generic": "resources/.codex/templates/project-profile.generic.md",
              "react": "...react.md", "vue": "...vue.md" },
"profileTarget": "docs/PROJECT_PROFILE.md"
```

- **`runtime` 清单是纯声明，无任何代码消费**（全仓 grep 仅 toolkit.json:9 一处出现）——不要把它当复制清单。
- **build-starter.mjs 的复制是目录整树遍历，不是显式枚举**：`scripts/build-starter.mjs:55` `await cp(sourceRoot, targetRoot, { recursive: true, errorOnExist: false, force: false })`——resources/ 下新增任何文件自动随 starter 分发，**build-starter.mjs 与 toolkit.json 零改动**。
- 显式枚举的是**校验白名单**，不是复制清单：`requiredPaths`（`:16-26`，9 个必存在路径）、`expectedSkills`（`:15` + `:35-43`，skills 目录只许 4 个 Skill，多一个即 fail："Starter contains unexpected project Skill"）。**docs/ 下加文件不受这两道白名单约束**（无测试枚举 docs 文件集合；`starter-builder.test.mjs` 只查 requiredPaths + 4 skills + 目标端跑通 guidance 校验 `:30-32`）。
- 模板实例化路径：profiles 的值是**单一模板文件**，选中后内容落到 `profileTarget`（docs/PROJECT_PROFILE.md）；选择机制见 `references/template-selection.md`（三候选 + defer 全展示；推荐≠选择；只有用户显式选择产生 `user-confirmed`；证据与所选模板冲突记 `conflict` 问迁移或保留）。`project-profile.test.mjs:14` 锁死 profiles 键恰为 `['generic','react','vue']`。

### D2. vue 模板现在携带什么

"vue 画像"= 一个模板文件 + 两份组件预设，不是目录：

1. `resources/.codex/templates/project-profile.vue.md`（136 行，10 节）：基本信息 / 事实源 / **支持端与运行环境**（`:26-40`，第 36 行已有 WebView 占位行）/ 技术与目录 / 硬边界 / 质量命令（`:80-81` 含 AI 指引校验与总门禁命令）/ UI 验收矩阵 / 接口验收 / 能力映射 / 维护信息。占位符形态为 `<待填写...>`，实例化后全部走 grilling 分类（`SKILL.md:44`）。
2. `resources/.codex/templates/component-catalog.vue.md` + `component-catalog.presets.json` 的 vue 预设（`project-profile.test.mjs:77-97` 锁死三预设键齐全，每预设 recommended=true、status=planned）。

模板文件本身**不在** requiredFiles（config 列表只有 proposal/component-catalog 模板），模板内链接不被 PE008 校验；实例化进 docs/PROJECT_PROFILE.md（在 requiredFiles）后其链接才被校验。

### D3. 给 vue 模板附加 AI_WEBVIEW_MOBILE.md：动哪几处

MAP.md:18-19 已锁定走"附加层"（webview 是 deliveryTargets 的一项，不做框架×端模板组合；deliveryTargets 含 webview 才载入规则层）。据此 **docs 引用路线**的完整改动清单：

1. 新建 `resources/docs/AI_WEBVIEW_MOBILE.md`（随目录遍历自动分发；成品文，无占位符）。
2. `resources/.codex/ai-guidance.config.mjs` requiredFiles 加一行（进门禁；注意 config 只此一份随 starter 分发，无第二副本）。
3. `resources/AGENTS.md` 强制入口加条件读取行（C3）。
4. 可选：`project-profile.vue.md`（或三模板）第 3 节/硬边界节加一句"WebView 启用后遵循 docs/AI_WEBVIEW_MOBILE.md"——实例化后链接进 PROJECT_PROFILE.md 被 PE008 覆盖。generic/react 模板是否也引用由票 05 裁决（webview 不分框架，建议三模板同引）。
5. **不需要动**：toolkit.json、build-starter.mjs、两份 ai-guidance-validation.mjs（不新增卡、不新增 status、不新增 deliveryTargets 键则校验器零改动）、全部测试。

**模板内嵌 vs docs 引用的代价**（票 05 直接用）：内嵌 → 内容只随 vue 模板走（react/generic 项目选 webview 拿不到），或三模板重复维护；且模板值是"候选非事实"（`SKILL.md:41`："template values are candidates only"），规则条文混进模板会与 grilling 的占位符分类机制纠缠。docs 引用 → 单一来源、条件路由按端启用（三层缝合第一层）、与 AI_PROJECT_STANDARDS.md 的"领域事实更新对应 docs/"维护规则（AGENTS.md:41、AI_WORKFLOW_PRINCIPLES.md:83）同构。

---

## 附：融合时可照抄的先例 / 障碍 Top 清单

**可照抄先例**：
1. AGENTS.md:19 条件读取句式 + :17/:18 状态词表（拼成 webview 条件路由，C2 给了成文）。
2. Q1 `alternatives` 数组 + `init-workflow.md:27` 展示要求（推荐/选项/证据/置信度/影响字段/下游代价）——webview 选项与代价提示的现成槽位（A2）。
3. `template-selection.md:12` "显式用户选择才产生 user-confirmed；证据分歧记 conflict"——冲突矩阵在决策卡上"显式亮出"的既有语义模板（配合 B2）。

**障碍/硬门禁**：
1. "仅 Q1-Q7 七卡"被两份校验器副本 + 测试三处锁死——新增卡必破，新增选项不破（A3）。
2. `check-ai-guidance.mjs` 只读 requiredFiles——不注册的新 docs 文件完全脱离门禁（C3）。
3. 校验器双副本（`scripts/lib/` 与 `resources/.codex/scripts/lib/`）必须同步改；动卡集合/状态枚举时容易漏（A3/B1）。
4. 文档层"unsupported"与机器枚举五值不一致（B1）——选项文案统一用 `user-confirmed`，"不支持"走 value。
