---
label: wayfinder:prototype
title: 改造还是重做：去锚定裁决
status: closed
assignee: main-session
blocked-by: []
---

## Question

改造 in-place 还是重做新仓库（旧仓作参考）？

用户明确担心"当前项目影响判断、打乱思路"，故本票方法强制**去锚定**：

1. **先不翻现状目录**。仅凭需求清单（拷贝即用 / 零外部下载 / Codex 完整性硬约束 / Claude Code 尽量一等 / 根目录扁平 / `.toolkit` 中性运行时目录 / `.agents/skills` 单源 + `.claude/skills` 机器镜像 / 本地命令 + release zip 双分发）+ [starter-survey-research.md](../assets/starter-survey-research.md) 的业界模式，画一棵 greenfield 目录树草图（AGENTS.md / docs 规则层 / 技能源 / 模板 / 校验器 / 构建脚本的归置），并草拟信息架构（入口、路由、状态文件）。
2. **然后才 diff 现状**（`resources/` 树、上张图沉淀的资产：AI_*.md 规则层、profile 决策卡机制、组件目录机制、测试锁、skills 库 14 个），逐项归类：可原样复用 / 需改造复用 / 需重写，估三档比例与迁移风险。
3. 裁决：改造 in-place，或重做新仓库 + 旧仓参考。判据：重做仅在 greenfield 草图与现状结构**本质冲突**（而非机械差异）时才划算——规则内容、profile 机制、测试是宿主无关资产，重做不重写它们。

产出：greenfield 草图 + 三档归类表 + 裁决与理由。裁决须与用户当面确认（HITL）。若判"重做"，毕业出新票：新仓库骨架、资产迁移映射、旧仓库去留，并清雾。

会话先调 Skill：`grilling` 与 `domain-modeling`。

## Resolution（2026-09-23，五问全按推荐）

**裁决：改造 in-place（不重做、不开毕业票）。**

去锚定顺序兑现：greenfield 草图先落盘（[assets/greenfield-sketch.md](../assets/greenfield-sketch.md)，audit 派发前），现状 audit 后行（后台子代理纯事实盘点）。

### 裁决判据（Q1 锁定）与判定

- **T1 结构耦合测试**：现状是否存在搬不走的结构性依赖（starter 被别的身份压住 / 旧路径深埋不可机械替换）→ **通过**。starter 是边界清晰的自洽子树（`resources/` 154 文件，自带 AGENTS.md 入口 + CLAUDE.md 桥 + README + 规则层 + 技能源 + 镜像 + `.codex/` 运行时）；覆盖层只有一级目录嵌套 + 一个已存在的构建器（`build-starter.mjs` 已做 `copyContentsToProjectRoot` 拍平）。`.codex/` 引用 45 md（116 次）+ 9 脚本（55 次）全是字符串级、配置集中（`ai-guidance.config.mjs`）、测试锁在场（703 行测试 + 809 行校验器）。
- **T2 机械迁移测试**：`git mv resources/* → 根` + `.codex→.toolkit` 字符串改写（171 处）+ 三处同名合并（根 README 被 starter README 覆盖 / docs 与 wayfinder 合并 / 根 scripts 与 `.codex/scripts` 去重——audit 证实两处本就是零差异拷贝）。全程可脚本化、测试可验证。
- **Q4 tie-breaker（平手倾向重做）不触发**：T1 明确通过，非边缘。Q2/Q3 裁定重做能给的（新历史、无 wayfinder）在改造路径同样可得（新历史不值钱、wayfinder 仓内隔离分发剔除），重做只多付全量迁移 + 双仓期成本。

### 三档归类表

| 档 | 资产 | 说明 |
|---|---|---|
| **原样复用**（内容不动，仅机械挪位） | 13 项目技能（删 codex-capability-setup 后）、AI_*.md × 8、AGENTS.md(44行)、CLAUDE.md 桥(3行)、模板 × 11、校验器 672+137 行、测试 703 行、profile-state/capability-state | ≈ 154 文件中的 ~135（**~88%**） |
| **需改造复用** | resources/README（26 处 `.codex/` 改写 + 插件可选节）、CODEX_CAPABILITIES→capabilities.md（票 09）、ai-guidance.config 路径重映射、toolkit.json v5→v6、根 scripts 与 `.codex/scripts` 去重合一、build-starter 转职分发打包器（票 10） | ≈ **~10%**，各有对应票接住 |
| **需新建** | 镜像同步脚本 + AUTO-GENERATED 头 + 防漂移测试锁、NOTICE、vendored 8 技能入库（票 08） | ≈ **~2% + 纯增量** |

迁移风险：**低**。最大单点 = `.codex→.toolkit` 171 处字符串引用，配置集中 + 测试锁兜底。

### 附带锁定的裁决输入

- Q2：若（假想）重做则全新历史 + 旧仓冻结——本案不触发，留作记录。
- Q3：过程文档（wayfinder）不进分发物；改造路径 = 仓内隔离 + 干净副本命令剔除。
