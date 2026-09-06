# Codex 前端开发通用项目使用说明

这个仓库就是前端开发项目的基础。获取仓库后，直接在这里初始化项目规则、搭建前端工程和开发页面。`resources/`、项目 Skill、规则文档和业务代码都属于同一个项目，不需要另外维护模板项目和业务项目。

根目录 [AGENTS.md](AGENTS.md) 是首次开发入口。模板名称、版本和资源映射以 [resources/toolkit.json](resources/toolkit.json) 为准；其中 `kind: frontend-project-template` 和 `initialization.mode: in-place` 表示在当前仓库使用。项目是否完成规则初始化由生成的 `.codex/manifest.json` 记录。

## 1. 直接在当前仓库开始

在当前仓库打开 Codex 会话，说明产品目标、已选技术栈和输入材料。例如：

```text
直接基于当前仓库搭建前端应用。
产品目标：<填写实际产品与主要用户流程>
已选技术栈：<填写已选框架、语言和包管理器；未决定时请根据需求推荐>
输入材料：<当前仓库中的截图、原型、接口文档路径或设计链接；没有则说明>
请先检查现有文件，使用 $bootstrap-project 在当前根目录补齐项目规则和画像。
没有业务工程时，在当前根目录创建工程，保留现有 .agents、resources、AGENTS.md 和用户修改。
随后使用 $frontend-task 完成页面、交互及适用的数据接入，执行检查并给出运行入口。
已有决定直接采用，只询问影响结果且无法从仓库查明的事项。
```

尖括号内是任务信息占位符，使用前按实际需求填写，不是终端参数。上面的请求已包含规则初始化、工程创建和页面实现，无需把它们拆成多轮重复授权。只要求查看方案或先审阅设计时，在任务中明确等待阶段。

尚未选择框架时，先根据需求决定；模板不会默认安装 React 或 Vue。已有工程时沿用实际配置和源码。脚手架要求空目录时，可以临时生成后逐项合并回当前根目录，不能清空仓库或把暂存目录变成另一个业务项目。详见 [工程搭建流程](.agents/skills/bootstrap-project/references/project-creation.md)。

本文所有仓库内路径都相对当前根目录，终端命令也在该根目录运行。订单、工单等仅为场景示例，不是固定的项目名称、目录或业务要求。

## 2. 文件如何共同工作

```text
当前项目/
  AGENTS.md                     首次开发入口，初始化时合并项目规则
  CODEX_TOOLKIT.md               本说明
  .agents/skills/
    bootstrap-project/          当前仓库规则初始化与更新
    codex-capability-setup/     按任务审计、安装和验证能力
    frontend-task/              六类来源的前端实现与验收
    project-workflow/           初始化时从 resources 补齐
  resources/                    仓库内保留的模板和校验资源
    toolkit.json                生成与合并清单
    docs/                       通用规则候选
    templates/                  画像、AGENTS、状态和任务候选
    project-workflow/           通用工作流来源
    scripts/                    指引校验器和测试
    ai-guidance.config.mjs      项目校验配置候选
    package-scripts.example.json
  docs/                         初始化后保存本项目规则、画像与证据
  .codex/                       初始化后保存配置、接入状态及可选副本
  package.json                  创建业务工程时生成或合并
  <业务源码目录>/               按实际框架创建，不固定为 src/
```

这里展示的是开发后的结构，不表示模板已经包含可运行的应用。`docs/`、`.codex/`、`package.json` 和业务源码应当在当前仓库出现；不要为了维持模板外观删除它们。

### 2.1 三个现有 Skill 与通用工作流

| 入口 | 用途 | 何时使用 |
| --- | --- | --- |
| [bootstrap-project](.agents/skills/bootstrap-project/SKILL.md) | 检查事实、生成或合并画像和规则、接续工程搭建 | 首次开发或规则更新 |
| [codex-capability-setup](.agents/skills/codex-capability-setup/SKILL.md) | 能力审计、按已有授权安装、记录验证 | 任务需要补齐或核验能力时 |
| [frontend-task](.agents/skills/frontend-task/SKILL.md) | 截图、原型、HTML、Figma、接口及需求实现 | 日常前端开发 |
| [project-workflow 资源](resources/project-workflow/SKILL.md) | 通用工程规则和专项路由 | 初始化接入后用于工程任务 |

每个 Skill 的 `SKILL.md`、`agents/openai.yaml`、`references/` 及其引用的模板共同构成完整能力，不能只留下入口文件。现有三个 Skill 直接复用；初始化只补齐缺少的通用工作流及规则。项目 Skill 无需全局安装，实际是否可发现仍以当前会话为准。

Skill 中指向 `docs/` 和 `project-workflow` 的链接，在相应规则生成后生效。首次开发由根 AGENTS 和 bootstrap 引导，不要求用户先手动创建这些文件。

### 2.2 resources 是本仓库的资源目录

| 资源 | 本项目中的用途 |
| --- | --- |
| `resources/toolkit.json` | source 和 target 默认都相对当前根目录，描述来源文件与生效位置 |
| `resources/docs/` | 八份规范候选合并到 `docs/`，保留项目定制 |
| `resources/templates/project-profile.*.md` | 从 generic、React、Vue 候选生成一份实际画像 |
| `resources/templates/agents.template.md` | 与根 AGENTS 合并，保留在当前仓库开发的约定 |
| `resources/templates/manifest.template.json` | 生成 `.codex/manifest.json`，记录实际结果 |
| `resources/templates/capability-state.template.json` | 缺少能力记录时生成空状态，已有记录不清空 |
| `resources/templates/frontend-task.template.json` | 需要结构化任务记录时使用，普通任务无需填写 JSON |
| `resources/ai-guidance.config.mjs` | 合并到 `.codex/ai-guidance.config.mjs` |
| `resources/scripts/` | 直接在当前项目执行，或生成 `.codex/scripts/` 副本 |
| `resources/package-scripts.example.json` | 按已有工具链合并命令，不能覆盖 package.json |

清单中 source 和 target 指向同一文件时，初始化读取、校验并复用，跳过复制。不同路径的文件才生成或合并；不要把整份仓库复制到自身。

`group: core` 是核心规则，`group: local` 是可选的 `.codex/` 资源副本。默认生成副本；不需要副本时仍使用同一仓库的 `resources/`，并同步调整实际校验命令。`mode: generate` 要结合项目事实生成，`mode: merge` 要保留已有内容。

项目事实进入 `docs/` 和根规则，运行状态进入 `.codex/` 或能力记录；`resources/` 保留通用候选。维护模板时可更新候选，但不把一次业务任务的名称、账号或验收结果写进模板。

## 3. 日常如何调用

`$bootstrap-project` 等名称用于发送给 Codex 的提示词，不是 PowerShell、npm 或其他终端命令。默认操作当前项目，不需要提供两个根目录。

```text
使用 $frontend-task 完成当前项目的以下修改：
目标：<用户需要完成的结果>
材料：<实际页面、截图、原型或接口资料>
约束：<必须保留的行为和已确认决定>
完成条件：<可以观察和验证的结果>
```

当前会话没有列出 Skill 时，可明确要求读取当前仓库中的实际入口，例如 `.agents/skills/frontend-task/SKILL.md`。只有新能力需要重新发现时才开启新会话，无需每次重新初始化或安装。

确认用于解决具体未决问题。仓库能查明的事实自行读取，已有授权和设计决定继续有效，普通可逆实现选择按项目模式处理；影响业务语义且无法确定的事项再询问，等待时继续独立部分。

## 4. 初始化与更新示例

### 4.0 先判断使用哪个示例

4.1、4.2、4.3 是三种场景，不是必须依次执行的三个步骤。复制本项目后，按当前仓库状态选择：

```text
复制本项目
   ↓
第一次只准备规则       → 使用 4.1
第一次就要搭建并开发   → 使用第 1 节的完整提示词
已有业务代码后更新规则 → 使用 4.2
以后 resources 或 Skill 有变化 → 使用 4.3
```

- **4.1**：当前仓库还没有业务工程，且本次只准备项目规则。它会生成或合并规则、项目画像和 manifest，不创建 React/Vue 工程，不安装业务依赖，也不写业务代码。
- **第 1 节的完整提示词**：当前仓库刚复制完成，但准备立即搭建前端并开始开发。它会先初始化规则；没有业务工程时，再在当前根目录创建工程，并根据真实生成结果更新画像。
- **4.2**：当前仓库已经有 `package.json`、锁文件和业务源码，根据实际代码、配置和 CI 更新规则，不重建工程或覆盖业务代码。
- **4.3**：`resources/` 或项目 Skill 后续发生变化时，检查受影响的规则并合并更新。它是维护流程，不是首次初始化的必经步骤。

如果复制项目后准备直接开始业务开发，优先使用第 1 节的完整提示词；只有想先把规则准备好、暂时不搭建业务工程时，才使用 4.1。初始化和更新都在当前仓库完成，不需要指定另一个模板目录或业务目录。

### 4.1 先准备项目规则

```text
使用 $bootstrap-project 在当前仓库初始化项目规则。
本次只准备规则，暂不创建业务工程。
检查现有文件，保留根 AGENTS 和已有 Skill，使用 resources 中的候选生成或合并。
尚未确定的技术选型和不存在的运行命令如实记录，保持 draft。
不生成虚构业务代码，不把模板预设当作已经安装的依赖。
```

规则草案可以先于业务工程存在。以后要求搭建应用时，按第 1 节继续在当前根目录创建，再把真实版本、目录和命令补入画像。

### 4.2 当前仓库已有业务代码

```text
使用 $bootstrap-project 更新当前项目规则。
以现有 package.json、锁文件、源码、CI 和测试配置确定技术栈和命令。
合并 resources 中适用的规则与当前 docs、AGENTS、项目 Skill 和校验配置。
保留业务源码、团队规则、已有能力状态和用户修改。
已存在且相同的资源直接复用，有冲突时指出具体差异。
完成后报告实际修改、校验和仍未解决的事实。
```

### 4.3 更新模板资源后的规则

```text
当前仓库的 resources 或项目 Skill 已更新，请使用 $bootstrap-project 检查受影响的规则。
比较实际内容，保留当前画像、业务约定和已确认的技术栈。
直接生效的 Skill 文件无需复制到自身；有资源副本时比较并合并其变化。
manifest 记录实际生成、合并和复用的文件及本次验证。
```

日常开发无需保有外部模板路径。只有用户明确提供其他版本资源时才从外部比较更新；版本号相同也不能代替文件差异检查。

### 4.4 不生成 .codex 资源副本

```text
本次不生成 group=local 的资源副本，记录 localResources=false。
仍在当前仓库生成核心规则与 .codex/ai-guidance.config.mjs。
使用 resources/scripts/check-ai-guidance.mjs --root . 进行检查，
同步调整生成的 AGENTS、画像和已接入包门禁的脚本路径。
```

`.codex/manifest.json` 中内置资源来源 `toolkit.source` 使用 `.`，相对当前根目录解析。整个项目移动后仍能定位本仓库资源；`localResources` 仅描述可选副本是否完整，不表示业务与模板分离。

## 5. 按任务配置能力

能力清单见 [CODEX_CAPABILITIES.md](resources/docs/CODEX_CAPABILITIES.md)。初始化后优先读取当前 `docs/CODEX_CAPABILITIES.md`。项目内的 Skill、外部独立 Skill、插件和宿主浏览器使用各自的发现与安装方式。

### 5.1 只读审计

```text
使用 $codex-capability-setup 执行 A 阶段只读审计。
后续任务：<填写实际前端任务及输入材料>
优先读取 docs/CODEX_CAPABILITIES.md；尚未生成时读取 resources 中的对应候选。
检查任务所需能力的精确名称、来源、安装状态和当前会话可发现性。
结果在对话中报告，本次不安装、不连接、不写状态。
```

### 5.2 安装审计中已明确需要的能力

按 [授权输入格式](.agents/skills/codex-capability-setup/templates/approval-input.md) 表达范围；已有明确授权继续有效，无需重复填写。示例：

```text
使用 $codex-capability-setup 执行已授权安装及验证。
批准模式：按需组合
批准插件：<审计确认需要的精确引用；没有则无>
批准独立 Skill：<精确名称及固定来源；没有则无>
批准连接：<任务需要且同意连接的服务；没有则无>
状态记录：当前项目 docs/capability-state.json
已安装且来源验证通过的跳过，保留已有状态条目。
逐项报告实际操作、可发现性和未验证项。
```

A 阶段只读，B/C 阶段按授权在当前仓库创建或更新状态，不因存在模板资源而拒绝记录。浏览器属于宿主能力时不按 npm 包安装；能力安装、服务连接和外部业务写入分别依据任务授权。

### 5.3 验证可发现性

```text
使用 $codex-capability-setup 执行 C 阶段验证。
读取当前项目 docs/capability-state.json，核对已接入能力的实际可发现性。
将本次证据更新到该文件，保留其他条目。
只验证，不重复安装；需要新会话验证的如实记录。
```

## 6. 前端任务 Skill 的详细示例

入口：[frontend-task/SKILL.md](.agents/skills/frontend-task/SKILL.md)。以下均在**当前仓库会话**执行，材料路径相对当前项目根目录。材料必须实际存在，示例 URL 和接口名称需替换。

该 Skill 先读取目标 AGENTS、画像、任务协议、前端约定和组件目录。缺少项目规则时先接入规则，再按输入类型选择流程，使用环境中实际可用的专项 Skill。缺失能力或无法执行的验收应明确记录。

场景说明按需组合，不要求每次读完全部 references：

| 本次任务 | 主要流程 | 核心产物或检查 |
| --- | --- | --- |
| 截图还原 | [截图流程](.agents/skills/frontend-task/references/screenshot-workflow.md) | 来源视口、区域/组件/素材映射、同状态视觉对比 |
| 原型实现 | [原型流程](.agents/skills/frontend-task/references/prototype-workflow.md) | 页面与步骤关系、状态转换、输入保留及提交结果 |
| 业务 HTML 修改或迁移 | [HTML流程](.agents/skills/frontend-task/references/html-workflow.md) | 原行为基线、事件/资源依赖、迁移后的行为回归 |
| Figma 转代码 | [Figma流程](.agents/skills/frontend-task/references/figma-workflow.md) | 指定节点、组件/变量/资产映射及视觉回归 |
| 接口接入或请求逻辑修复 | [API流程](.agents/skills/frontend-task/references/api-workflow.md) | 契约映射、请求状态、竞态/重试及数据一致性 |
| 无定稿的新需求 | [需求流程](.agents/skills/frontend-task/references/requirement-workflow.md) | 用户用例、范围、设计与接口决定、可观察的完成条件 |

截图加接口同时使用截图和 API 流程；原型工具导出的 HTML 先按原型处理，要求迁移其运行代码时才补充 HTML 流程。没有页面设计稿但已有适用设计系统时，沿用现有系统。小修复按 [共用契约](.agents/skills/frontend-task/references/common-workflow.md) 选择相关步骤，没有视觉或契约变化时无需新建设计/API 文档。

各场景按 [验收矩阵](.agents/skills/frontend-task/references/acceptance-matrix.md) 记录适用检查，区分“通过、失败、未验证、不适用”。命令从目标项目读取；数据状态、设备和主题按实际支持范围验证。需要开发服务器时交付可访问 URL；可直接打开的静态 HTML 提供文件入口。

### 6.1 截图还原，同时接入 API

```text
使用 $frontend-task 实现订单列表页。
目标：运营人员按订单号和状态筛选、分页查看订单并进入详情。
截图：design/orders-desktop.png，浏览器视口 1440x900 CSS px，DPR=1。
移动端参考：design/orders-mobile.png，视口 390x844 CSS px，DPR=1。
接口契约：docs/api/orders.openapi.yaml，以真实契约的方法、路径和字段为准。
目标路由：/orders；代码放在画像规定的页面目录。
约束：复用现有表格、表单、请求客户端及权限机制，保留已有页面行为。
先分析截图布局、组件复用点、页面状态和 API 字段映射。
接口未说明的字段或截图未覆盖的重要交互，先查已有实现和可信契约；
仍无法确定且影响结果时给出具体待决定项，继续完成不依赖该决定的部分。
完成条件：筛选和分页可用；覆盖加载、空数据、失败和无权限状态；
执行项目检查，并在上述两个视口检查页面、控制台和网络请求。
将实际命令、截图位置及未验证项记录到 docs/AI_ACCEPTANCE_EVIDENCE.md。
```

视觉参考和 API 契约共同参与实现。DPR 与 CSS 视口用于解释截图尺寸，不能只用图片像素推断布局宽度。接口无法访问时，区分已验证的模拟场景和未完成的真实联调。

### 6.2 Figma 设计转代码

```text
使用 $frontend-task 实现 Figma 中的客户详情页面。
设计链接：https://www.figma.com/design/<实际文件键>/<文件名>?node-id=<实际节点ID>
目标路由：/customers/:id
读取指定节点及设计上下文，先核对现有组件、设计变量和页面状态。
遵循当前可用 Figma Skill 对设计读取的前置要求。
数据契约：docs/api/customers.openapi.yaml，复用现有请求和错误处理。
本次范围是读取设计并修改本地代码，不包括回写 Figma。
按设计提供的桌面和移动端尺寸验收；缺少移动端设计时先沿用项目响应式约定，
只有无法据此决定的关键布局才提出待决定项。
连接或节点不可访问时报告具体缺失；有导出截图时可按截图流程继续已授权的可见部分，
节点和变量映射保留未完成，不将截图实现标为节点级还原全部完成。
```

### 6.3 根据交互原型实现流程

```text
使用 $frontend-task 实现新建工单流程。
原型入口：design/ticket-prototype/index.html
目标：填写基本信息、选择处理人、确认提交，返回上一步保留输入。
原型表达信息结构与交互，视觉沿用目标项目现有设计系统。
梳理步骤、跳转、校验、禁用条件、取消行为及提交成功/失败状态。
接口材料：docs/api/tickets.openapi.yaml。
保持现有路由和表单组件模式，完成后验证完整流程及失败重试。
三个步骤可位于同一有效路由，是否拆分按直接访问和刷新恢复需求决定。
核对取消、离开再进入和刷新时的输入处理；提交成功必须与实际结果对应。
```

### 6.4 改造已有 HTML

```text
使用 $frontend-task 改造已有报表页面。
输入：legacy/reports.html、legacy/reports.css、legacy/reports.js。
目标：按当前项目画像迁入 /reports，保留筛选、排序和导出行为。
先运行或检查原页面，记录筛选、排序、导出内容及视觉基线，给出迁移对应关系。
核对 DOM、脚本事件、数据来源、部署 base 下的资源与路由路径；
迁移到框架后按生命周期清理监听，验证离开再进入不会重复触发。
组件及样式采用现有模式，处理移动端横向溢出和键盘操作。
完成条件：原筛选/排序语义和导出内容保留，资源正常加载，深链及刷新可用，
相邻页面样式不受影响，相关检查和支持视口验收通过。
```

### 6.5 只有 API 文档，接入已有页面

```text
使用 $frontend-task 为已有商品列表接入接口。
页面：目标项目中 /products 对应的现有页面，请先定位实现。
契约：docs/api/products.openapi.yaml。
核对分页、筛选、认证、错误码及字段可空性，建立 DTO 到页面展示模型的映射。
核对零值与空值、筛选后的页码重置、快速切换条件时旧请求不能覆盖新结果。
复用请求客户端，保持页面视觉和无关业务逻辑。
完成条件：正常、空列表、认证失败、业务错误、超时和重试符合项目约定。
重试遵循接口幂等性和项目策略，不自动重放可能重复写入的请求。
联调环境或凭据缺失时报告，模拟测试通过不能写成真实接口联调通过。
```

### 6.6 只有文字需求

```text
使用 $frontend-task 为已有后台增加通知中心。
用户目标：查看通知，按未读筛选，打开详情，将单条或全部通知标记已读。
已决定：打开详情不自动标记已读，只有明确的“标记已读”动作改变状态。
视觉与交互沿用已有后台。
目前没有设计稿，先检查可复用的列表、抽屉、空状态及反馈组件。
接口契约尚未提供，先列出影响实现的数据与行为决定。
已授权完成本地交互原型和测试，模拟数据需要明确记录为模拟。
真实 API 接入保留为未验证项，不编造服务端契约。
完成条件：未读筛选、详情与已读操作可用，操作后列表和未读数量保持一致；
桌面和移动端可用，键盘可操作，适用的加载/空/失败状态完整。
```

### 6.7 增量修复

```text
使用 $frontend-task 修复订单页筛选后页码没有重置的问题。
复现：进入 /orders，切到第3页，再切换状态筛选，仍请求第3页导致空列表。
预期：筛选变化后从第1页请求，普通翻页仍保留当前筛选。
读取现有规则，定位状态与请求逻辑，复用现有测试方式添加针对性回归验证。
修改范围限于该问题及必要测试，运行相关检查并报告结果。
回归清空筛选、普通翻页和快速切换条件，核对实际请求参数及页面结果。
本次没有视觉或接口契约变化，无需新建设计解析、接口文档或任务 JSON。
```

### 6.8 需要结构化记录时使用任务模板

参考 [frontend-task.template.json](resources/templates/frontend-task.template.json)，在目标按团队约定保存具体任务。它不是初始化完成标记，也不要求每次任务都新建 JSON 文件。

```json
{
  "taskType": "new-page",
  "goal": "运营人员筛选并查看订单",
  "sources": [
    { "type": "screenshot", "path": "design/orders-desktop.png", "version": "v1", "viewport": { "width": 1440, "height": 900 }, "dpr": 1 },
    { "type": "api", "path": "docs/api/orders.openapi.yaml", "version": "v1" }
  ],
  "target": { "route": "/orders", "path": "src/pages/orders" },
  "constraints": ["复用现有组件及请求客户端"],
  "acceptance": ["筛选和分页可用", "覆盖加载、空数据和失败状态"],
  "confirmedDecisions": ["运营后台订单列表，视觉以指定截图为准"],
  "unverified": ["真实接口环境是否可访问"]
}
```

`target.path` 仅是示例，须按目标画像和源码调整。结构化任务不会取代实际材料读取和验收。

## 7. 通用工程任务

初始化后，`project-workflow` 位于当前 `.agents/skills/project-workflow/`。前端任务会按需进入 frontend-task，不要求用户手动反复切换。

```text
使用 $project-workflow 排查当前项目的类型检查失败。
先读取 AGENTS、项目画像、相关命令、CI 配置和实际错误日志。
定位可复现原因并修复，保留业务行为和现有工具链。
运行相关检查，报告根因、修改与未验证的环境差异。
```

## 8. 如何判断当前进度

| 产物或结果 | 表示什么 |
| --- | --- |
| `resources/toolkit.json` | 仓库内模板的元数据和映射，不是项目完成状态 |
| 根 `AGENTS.md` | 初始入口或合并后的项目规则；仅有该文件不代表画像已经完善 |
| `.codex/manifest.json` 的 draft | 项目规则仍有未决事实或未完成严格验收 |
| manifest 的 initialized | 规则接入与严格验收已完成，不代表业务功能完成 |
| `package.json`、锁文件、框架配置和源码 | 当前仓库已经有工程文件，是否可运行仍需实际执行 |
| `docs/capability-state.json` | 能力安装、发现、连接和证据状态 |
| `docs/AI_ACCEPTANCE_EVIDENCE.md` | 本次业务任务的命令、页面操作、接口和视觉验收证据 |

初始化应保留已存在的文件，重复执行不重建业务工程，不清空能力记录，不恢复模板默认值。清单、画像和能力记录的内容以实际结果为准。

## 9. 在当前项目验证

以下命令都在当前项目根目录运行，使用 Node 22+。没有业务工程时，校验器测试本身不需要 package.json 或 npm 依赖。

### 9.1 校验器回归测试

```powershell
node --test resources/scripts/lib/ai-guidance-validation.test.mjs
```

测试检查校验器行为，不会搭建业务应用。仅为测试而创建的临时样本会清理；当前开发仓库不得为了恢复模板外观而清空。

### 9.2 项目指引校验

初始化生成 `docs/` 和 `.codex/ai-guidance.config.mjs` 后：

```powershell
node resources/scripts/check-ai-guidance.mjs --root .
node resources/scripts/check-ai-guidance.mjs --root . --strict
```

有 `.codex/scripts/` 副本时也可以使用：

```powershell
node .codex/scripts/check-ai-guidance.mjs --root .
node .codex/scripts/check-ai-guidance.mjs --root . --strict
```

两种入口都检查当前项目，默认也按脚本所在项目定位根目录；显式 `--root .` 表示检查当前工作目录。日常优先使用画像中登记的一种入口，避免改动两份脚本而未同步。

两种方式可追加 `--format json`；退出码 0 表示配置范围内通过，1 表示校验发现问题，2 表示参数、配置或运行异常。尚未初始化时缺少项目文件是初始化待办，不是需要改到另一个仓库执行。

常规检查用于草案。严格检查禁用配置覆盖范围内的占位符，在启用 package 集成时要求门禁接入；不靠伪造项目事实消除失败。现有校验没有覆盖的真实语义仍需审查。

### 9.3 工程与业务验收

启动、构建、测试和类型检查使用实际工程命令。`resources/package-scripts.example.json` 含待填写内容及本地副本路径，按包管理器、脚本位置和现有门禁合并，不能原样覆盖 package.json。

普通业务任务按项目已有门禁执行；指引变化时补充相关校验。UI 和接口任务还需真实操作、视口及数据状态证据，区分通过、失败、未验证和不适用。Mock、构建成功或截图生成均不能单独证明业务流程完成。

保留 `resources/`、项目规则及业务代码在同一仓库中。后续继续在这里迭代页面、组件、接口和规则；历史审查报告只描述当时的版本，不作为当前开发入口。

