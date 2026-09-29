---
name: design-task
description: 专业 UI 原型设计 lane。用于审美驱动、需要多轮调整的界面稿：设计系统先行，Stitch 或自写 HTML 出 2–3 变体，用户翻选修订，定稿归档到 docs/design/。无参照新页面在硬门槛处选「专业设计」深度时进入；快速方向原型仍走 $prototype。
---
<!-- AUTO-GENERATED from .agents/skills/design-task. DO NOT EDIT. Run: node .toolkit/scripts/sync-mirror.mjs -->

# Design Task（设计 lane）

出专业 UI 原型设计稿：审美驱动、多轮调整、定稿冻结。不写业务代码、不建框架路由，实现归 `$frontend-task`。

## 1. 定位与边界

双层模型，深度由用户在硬门槛处选择，agent 不猜、不默认升级：

| 层 | 载体 | 适用 | 产物 |
| --- | --- | --- | --- |
| 基本方向直出 | `$prototype` 硬门槛 | 无参照新页面的快速方向确认 | 2–3 方向原型，选定即实现 |
| 专业设计 | 本技能 | 审美驱动、系统性多轮调整 | 设计系统 + 带版本定稿目录 |

- 入口：用户直调 `$design-task`；或 `$frontend-task` 需求流程硬门槛处问一句选深度、用户选「专业设计」。
- 过渡期与路由边界以 [任务路由](../project-workflow/references/task-routing.md) 为准，不在此重复。
- 形态 = 发散循环：brief → 选型依据 → 2–3 变体 → 用户翻选 → 修订多轮 → 定稿冻结。状态即文件（定稿目录 + 版本号），无状态机。
- 本技能产物是 `$frontend-task` 的源：定稿按「选定视觉稿」（visual facts）消费，见第 6 节交接。

**运行模式与调用协议**：prompt 首行含 `auto`（或写明「无人场 / 自动模式」）= 轻量模式，用户与 agent 同款——全程免询问（含第 3 节系统冻结、第 5 节定稿链、第 6 节冻结点头），产出候选定稿；缺省 = 交互模式。auto 模式中用户的即时消息优先于自动决策（指令 > 流程）。子代理漏声明且无询问通道时按 auto 处理（结构性事实，非探测，不做在场推断）。

## 2. 前置读取

| 读取 | 用途 |
| --- | --- |
| [项目画像](../../../docs/PROJECT_PROFILE.md) | 支持端与运行环境；deliveryTargets 决定稿的视口集与 Stitch deviceType |
| [组件目录](../../../docs/rules/AI_COMPONENT_CATALOG.md) | 出稿向既有组件靠拢；目录与画像冲突时上报，不自行改档 |
| SYSTEM.md（设计系统规格） | 存在则继承；不存在先走第 3 节，再出稿 |
| [WebView 移动端规则](../../../docs/rules/AI_WEBVIEW_MOBILE.md) | deliveryTargets 含 webview 或 mobileH5（user-confirmed）时：触控目标、安全区在设计期即生效 |

deliveryTargets 缺失、冲突或 deferred 时交 `$project-profile update`，不猜目标端。

## 3. 设计系统先行（无 SYSTEM.md 时，项目级一次）

1. `$ui-ux-pro-max` 输入产品描述，产出规格：布局模式、风格、配色板、字体配对、反模式清单。其检索脚本依赖本机 Python，缺失时报不可用并降级为静态清单 + LLM 选择。
2. 交互模式：用户调整确认后冻结 SYSTEM.md（路径见第 6 节），带版本号，tokens 至少含色板、字体对、圆角、间距习惯；auto 模式：按选型直接冻结并标「候选·待确认」，事后审阅可改版。
3. Stitch 可用时 `create_design_system`（customColor、字体、圆度、明暗，designMd 附规格）资产化，记 assetId；此后每张稿 `generate_screen_from_text` 一律带 designSystem=assetId。designMd 超大（>5KB）可能撞 MCP 输出 token 上限：裁剪规格或走 REST base64 直传。**资产化不保真**——提交后必须 `get_project` 回读生效主题（2026-09-29 实测：提交 teal/IBM Plex/8px，生效 Hanken Grotesk/靛蓝/4px 并自创第三字体），以生效版为准归档对账，漂移必须可见。
4. 系统升级走 `update_design_system` + 版本号；apply 后逐页回读，验证每页生效。apply 的 `selectedScreenInstances` 只准 `id`+`sourceScreen`（带坐标等字段即 invalid argument）。
5. DESIGN.md 与 SYSTEM.md 对账：走 `get_project` / `list_design_systems` 内联 `designMd`（API 恒为最新，与网页导出同源同文），不依赖 zip 导出；系统漂移必须可见、可追。

系统级变更（换配色体系、字体体系）属三分判据的「设计方向系统性」：回本技能重开出新版本；已实现页面局部不跟进记 DRIFT，成批跟进另立实现任务。

## 4. Stitch 工作流

| 环节 | 规则 |
| --- | --- |
| 探测 | 实际调用 `list_projects` 判定连接，禁凭模型记忆假设可用或不可用；MCP 工具仅宿主主会话持有，子代理环境探测不到属预期——按第 8 节兜底并注明环境原因，不算 Stitch 故障 |
| 项目 | 生成前必须 `create_project`（无项目上下文报 Requested entity was not found）；create 后立刻 `get_project`，projectId 记入 `.stitch/project.json` |
| 出稿 | `generate_screen_from_text`：prompt=brief、designSystem=assetId、deviceType 按 deliveryTargets；资源名等调用形态按 MCP 工具自述，不凭记忆拼；生成 prompt 不带主题 token（hex/字体名），编辑 prompt 才带精确值 |
| 等待 | 同步超时属预期（冷启动约 2 分钟，第二张起通常即时）：超时后每 30–60s 轮询 `list_screens` 至出现，不误判失败；端点可整窗死（实测 2 连超时 + 12 分钟零落屏）——约 15 分钟零屏即判端点不可用，转第 8 节兜底；**`list_screens` 可与 UI 面脱钩**（实测屏已存在仍返回空）——轮询 2 轮空后改 `get_project` 读 screenInstances 判定，勿仅凭 list_screens 判失败 |
| 变体 | `generate_variants` 单维度探索，维度枚举：COLOR_SCHEME、LAYOUT、TEXT_FONT、TEXT_CONTENT、IMAGES；每次 2–3 个；变体 ID 与最终选择原因记入 PROMPTS.md |
| 微调 | 编辑优先，仅布局根本错误才重生成；`edit_screens` 用 scoped 提示词：单目标、指明位置、附「不修改 X」负清单；反例：「让页面更高级一点」 |
| 回读 | **编辑持久化门**：edit 返回成功 ≠ 已持久化；存在第三种响应——返回澄清问题（目标不存在时反问，此时什么都没改）。判据 = get_screen 文件 ID（htmlCode/screenshot 的 files/&lt;id&gt;）变化，响应内 sessionEvent.dom_operations 仅供参考不可作证（2026-09-28 实测：成功文案+事件俱在，文件层零变化）。编辑后三层回读（HTML + 截图 + 元数据）；内容未变化不得报成功 → 保留编辑前快照 → 转网页端编辑或重生成 → 回读归档并注明来源 |
| 核对 | Stitch 会加戏（brief 写 2 卡出 3 卡、自加角标）：定稿前对照 brief 核内容漂移；渲染瑕疵（文字截断、占位残留、空图）定稿前浏览器过一遍 |

## 5. 定稿决策流（code.html 获取）——刚性兜底链

链路：**⓪ 静默自动试下载 → ① 弹浏览器手动下载 → ② 高清截图还原 → ③ agent 自写 HTML**。每级失败自动降到下一级，不停止、不重问已失败的级；每次降级响亮告知。③ 是定稿阶段终点兜底（Stitch 变体照常用于发散翻选，code.html 由 agent 按选定方向自写，继承第 8 节同款规格纪律）——与第 8 节「Stitch 整体不可用」的生成阶段兜底互不吞并。auto 模式：免询问，⓪→②→③ 自动降级（跳过①）；交互模式：⓪ 快速试后按链询问。

| 级 | 动作 | 失败判据 → 降级 |
| --- | --- | --- |
| ⓪ 自动尝试 | fetch downloadUrl：显式代理（读 HTTPS_PROXY）+ manual redirect + body 校验（DOCTYPE 与页面标题）。交互模式快速试 2–3 次（约 30s）即转①；auto 模式静默重试约 10 次、跨分钟铺开 | 命中即免问；落空 → ①（交互）或 ②（auto） |
| ① 弹浏览器手动下载（仅交互模式） | 响亮询问 → 愿意：程序化弹**用户默认浏览器**打开 `stitch.withgoogle.com/projects/<projectId>` → 用户点「导出 → zip」（三秒，登录态在用户浏览器里）→ agent **监听下载目录**（轮询新 .zip，含 mtime 变化）→ **验明正身再收**：三件套结构 + code.html `<title>` 与目标屏一致（get_screen 元数据预取）+ DESIGN.md 与 API designMd 逐字一致——不匹配跳过继续等，歧义时询问用户 → 自动解包归档 code.html，zip 其余件丢弃（DESIGN.md 走第 3.5 条 API 更新鲜）。用户也可直接改选 ② 或 ③ | 用户拒绝 / 下载超时 / 指纹长时不匹配 → ② |
| ② 高清截图还原 | screen.png 拼参数 `=s1600-rp`（**长边**封顶 1600——390 CSS 屏得 549×1600，268KB 网页导出同款）或 `=w{width}` 按像素宽度；裸 URL 是 CDN 缩略图（实测 176×512）不可直接用；元数据 width 为像素口径（390 CSS 屏报 780）——作为「选定视觉稿」（visual facts，`$frontend-task` 原生 `source=screenshot` 路径）+ DESIGN.md（API）+ CONTRACT.md；定稿目录 `code.html` 标记"未获取（截图路径）" | 截图拉取重试后仍失败 → ③ |
| ③ agent 自写 HTML | 按选定变体方向自写定稿 code.html，继承 SYSTEM.md 同规格（第 8 节同款纪律），来源标 `agent-written` | 终点，无降级 |

- downloadUrl 是临时地址，只用于当次下载，不入生产代码；有时效，生成后尽快取，勿隔夜复用。
- 该端点间歇可用、不可按需复现：勿因偶发 404 判死，勿因偶发 200 判稳；下载必带 `-f` 或 body 校验——无 `-f` 的 curl 在 404 时静默存 0 字节文件且退出码 0（2026-09-28 实测）。
- Codex 宿主可加走 chrome@openai-bundled（②之前，免弹浏览器直接下载）。
- 迭代轮截图 URL 免认证可直接落袋，仅服务迭代比对，不作实现输入。

## 6. 定稿归档

```text
.stitch/                       迭代工作区（机器生成，入 .gitignore，不进 git）
  project.json                 projectId 等项目元数据
  manifest.json                slug ↔ screenId ↔ route 映射
  snapshots/                   编辑前快照与原始响应
docs/design/system/SYSTEM.md   设计系统规格（冻结版本）
docs/design/<特性>/vN/         定稿目录（版本递增，不覆盖旧稿）
  code.html  DESIGN.md  screen.png  PROMPTS.md  CONTRACT.md
```

| 文件 | 内容 |
| --- | --- |
| code.html | Stitch 导出或 agent 自写；实现参考 |
| DESIGN.md | 导出的设计系统规格；与 SYSTEM.md 对账 |
| screen.png | 预览图 |
| PROMPTS.md | 提示词链 + 元数据头：screenId、projectId、导出时间、版本、尺寸。CSS viewport 与截图像素分列，DPR 未确认记 null（780×2274 PNG ≠ 780 CSS px）；变体 ID 与选择原因同记；**来源标记** `stitch-export / screenshot / agent-written`；**确认状态** `confirmed / pending`（auto 产出与未点头冻结 = pending，转正时补记确认时间） |
| CONTRACT.md | 九状态裁剪版：默认、加载、空、错误、权限、未登录、部分数据、长文本、离线重试；加路由、可点控件、刷新、深链。原型没说的标「待确认」，不从截图推断业务规则 |

- manifest 纪律：Screen ID 是唯一关联键，不按标题猜。
- 冻结 gate：原始响应已存、尺寸已区分、路由映射已固定、缺口已列；装有 impeccable 时先对 code.html 跑 detect；**元数据与实现一致**（字体 / 来源 / 尺寸等字段对 code.html 实测核对，防账本漂移——2026-09-28 实测字体行不同步）。
- **冻结循环（交互模式）**：五件套 + 选定视觉稿摆出请求点头 → 不满意 → 按用户要求整改 → 再请求点头 → ……**直到用户显式同意才冻结归档**。多轮无上限；满意的唯一判据是用户显式同意，agent 永不代判、不劝退、不擅自冻结。
- **候选定稿（auto 产出，或未点头先开发）**：未经确认直接进入开发是**允许的正当行为，不阻塞**；PROMPTS.md 标 `confirmed: pending`，下游知晓基于未确认定稿。事后审阅分流：尚未实现 → 回冻结循环继续整改直到满意；已实现 → 三分判据分流（设计方向系统性 → 本技能重开 v2，实现联动；局部 → `$frontend-task` 直修记 DRIFT）；满意 → PROMPTS.md 补记转正时间一行。
- 归档一律用标准文件名，不因下载通道（官方 zip 或自动落袋）改名或另存对照包。

交接给 `$frontend-task` 三行摘要：

1. 定稿按「选定视觉稿」（visual facts）路由；工程、业务、行为事实仍以仓库与契约为准（四层事实源见 frontend-task）；定稿确认状态见 PROMPTS.md 元数据。
2. screen.png 是验收参照不是背景图：实现必须是真实 DOM 与真实控件。
3. code.html 是参考不是规范：不原样复制，按项目组件与约定实现。

分工：Stitch 负责无参照出稿；Figma 侧（可编辑交付、Code to Canvas）按 [Figma 流程](../frontend-task/references/figma-workflow.md)。

## 7. 微调判据衔接（三分判据）

| 判据 | 典型情形 | 归属 |
| --- | --- | --- |
| 实现质量 | 间距、对齐、还原度缺陷 | `$frontend-task` 直修 |
| 局部替换 | 换图标、改文案、单点值，不波及共享设计基准 | `$frontend-task` 直修；改前查 `docs/design/<特性>/` 定稿，存在则 DRIFT.md 记一行 |
| 设计方向系统性 | 换布局体系、配色、字体、跨页面方向 | 本技能重开；先读 DRIFT 对账再出稿 |

## 8. 兜底（Stitch 不可用）

触发：探测失败、生成失败、下载全空。动作：响亮告知用户降级发生（附 Stitch MCP 配置指引，宿主能力边界见 [能力清单](../../../docs/capabilities.md)）→ agent 自写 HTML 变体：继承 SYSTEM.md 同一规格，风格不断裂；变体、翻选、定稿归档结构不变，DESIGN.md 从 SYSTEM.md 生成，screen.png 用浏览器截图（视口仿真用设备 emulate，勿用窗口 resize——Windows 最小窗宽会让名义 390 实为 501 CSS px）。不许静默降级。

**迭代复验门**：每轮维护**已修复问题清单**，轮末对照复验不得回退（修 A 不许顺手退 B——回归振荡 2026-09-28 实测发生过：滚动条修了又坏）。**验收子集（兜底稿专用，轻量）**：brief 忠实度逐条对照 + 整页浏览器过一遍（多视口 / 溢出 / 空白 / 控件样式）+ impeccable detect 一轮；逐变体浏览器回读、字体加载 JS 级验证等重验收留给正式 Stitch 定稿，兜底稿不跑满。

## 9. 护栏

- 本技能 = 一份 SKILL.md + 至多一份 [设计简报模板](templates/design-brief.md)。
- 不建脚本、状态机、模板目录；产物与状态的唯一载体是文件本身。
- 失败模式是长成第二个 frontend-task：发现即回缩。
