---
label: wayfinder:grilling
title: 决策卡与 update 的 WebView 接入设计
status: closed
assignee: main-session
blocked-by: ["01-research-init-update-hooks"]
---

## Question

支持端决策卡上 webview 选项的最终设计：选项文案与代价提示（旧内核 CSS 兜底、真机验收、JSBridge 封装成本）、单选与多端组合的语义、deferred→**user-confirmed** 需要的用户证据（状态机正式名，见研究成果第 2 组）、`$project-profile update` 加选 webview 的 grilling 流程。产出可直接执行的规格文字：决策卡改动清单 + update 流程改动清单。依据 [assets/research-init-update-hooks.md](../assets/research-init-update-hooks.md) 的事实（Q1 加选项优于新增卡；impacts 数组是代价提示现成槽位），不破坏既有卡片机制。

## Resolution（2026-09-22，用户全推荐通过）

### 六项决策

1. **选项形态 = C（预设组合 + 逐值编辑并存）**：Q1.alternatives 加 `"default + enterprise-webview"` 快捷项；既有 custom 逐值编辑路径保留作细改兜底。卡面可见 = 显式接入铁律。
2. **impacts 四条**：旧内核 CSS 兜底（color-mix/translate/svh 等降级与验证）/ JSBridge·SDK 存在性检测与封装 / 真机验收成本 / 兼容矩阵扫描介入选型。多断点抽查不进卡（归票 04 验收条目，避免双处维护）。
3. **组合语义 = 容器维度与端形态正交，无非法组合表**：webview 可与任意端形态同选（钉钉 PC 内嵌 WebView 即 desktop×webview 真实场景）；不做卡层禁组合，真冲突交矩阵与条目标签。
4. **user-confirmed 门槛 = 能填 value 才 confirmed**：用户说出真实容器（钉钉/飞书/自研 App）→ user-confirmed + value=容器清单；只有意向 → 保持 deferred（reason=意向未定，follow-up=容器明确）。
5. **update 复检 = 只①强制**：兼容矩阵扫描（已确认技术栈 × webview）强制；acceptance matrix 顺带提示；既有页面回溯审查不做（YAGNI）。
6. **矩阵接口锁死（票 03 只填内容）**：输入 = confirmed 的 deliveryTargets + 已确认技术栈字段；输出 = 冲突条目列表（目标 × 特性 × 选型 → 冲突说明 + 裁决选项）；消费时机 = Q1 卡展示时 + update 复检时；卡片只展示不裁决。

### 决策卡改动清单（init 侧，执行期照做）

| # | 文件 | 改动 |
| --- | --- | --- |
| 1 | `resources/.agents/skills/project-profile/references/init-workflow.md` Q1 行 | 推荐文案 "WebView/PWA deferred" → "WebView 可选启用（默认暂缓）；PWA 暂缓"；Q1 交互说明补：alternatives 含 webview 组合项、容器维度正交、confirmed 门槛（能填 value）、选择时触发矩阵扫描 |
| 2 | `resources/.codex/templates/profile-proposal.template.json` Q1 卡 | `alternatives` 加 `"default + enterprise-webview"`；`impacts` 填四条文案 |
| 3 | `resources/README.md` 与根 `README.md` | "WebView/PWA 暂缓"两处文案同步为可选启用表述 |

零改动项：不新增卡（PE016 三处锁死不动）、不加 deliveryTargets 键、不动两份校验器与测试、PWA 保持暂缓（不在本努力范围）。

### update 流程改动清单（执行期照做）

1. update 检测 deliveryTargets 变化涉及 webview → 路由 profile interview（既有机制，零新流程）。
2. interview 中 webview 占位符按既有分类问答；confirmed 前必须取得容器名（决策 4 标准）。
3. 强制复检：矩阵扫描已确认技术栈 × webview，冲突亮出，用户裁决（换选型 / 接受兜底成本 / 记 conflict）。
4. 顺带提示：acceptance matrix 将含 WebView 视口/真机项（条目内容归票 04）。
5. multiPlatform 派生重算与机器表/人类表一致性核验走既有机制（init-workflow.md:48）。

### 归属边界

- AGENTS.md 条件路由行成文（研究 C2 已给）与 requiredFiles 注册 → 执行期接线，随票 04 产出落地。
- 画像模板（project-profile.vue.md 等）第 3 节 WebView 行的问法 → 票 05。
- 矩阵条目内容与持久化格式 → 票 03。

### 修正（2026-09-22，关票后自审发现）

**决策 6 的矩阵消费时机有时序 bug**：Q1 是第一张卡，展示时 Q3–Q5 未答，无技术栈可扫，"Tailwind 4 × 旧内核"类冲突在 Q1 时刻扫不出来——扫描发生在输入存在之前。细化为三处：

1. Q1 卡展示时：静态 impacts + 仅"目标×目标"组合检查（如 webview 无 mobileH5 的提醒）
2. **七卡答完、分层审批 materialize 前：全量扫描一次（目标 × 技术栈 × 选型）**——技术栈冲突的正确时机，挂既有分层审批节点，零新机制
3. update 复检：保留原决策

原文"消费时机 = Q1 卡展示时 + update 复检时"按此细化理解。

### 修正二（2026-09-22，四轮系统自审，用户裁决升级版）

1. **update 强制项从一项扩为两项**（决策 5 修订）：①矩阵复检（原强制）+ ②**页面声明复检**——update 改变端集合后，扫描既有 route.meta.targets 声明，列出超出新 confirmed 集的页面，亮出不自动改（与矩阵同一家族：从 deliveryTargets 派生的工件，端变了会烂；页面声明边界规则见票 04 修正 6）。执行期在 update 流程改动清单第 3 步后补第 3.5 步。
2. **修正节 1 的措辞被机械定义取代**："仅'目标×目标'组合检查"细化为"**选型列为 `—` 的行**"（Q1 时 T 尚空，恰好只有这些行可扫=目标组合类）——以票 03 修正 8 的定义为准。
