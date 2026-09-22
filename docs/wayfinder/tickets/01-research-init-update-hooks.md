---
label: wayfinder:research
title: 研究：init 与 update 机制的接入点
status: closed
assignee: research-subagent
blocked-by: []
---

## Question

精读 ai-front-spec 仓库（`C:\Users\yangsheng\Desktop\ai-front-spec\resources\`）中画像与任务机制的源文件，产出四组事实，回答"webview 选项与冲突矩阵校验应该挂在哪、怎么挂"：

1. `$project-profile init` 的决策卡片机制：卡片从哪来、选项如何呈现与记录、"推荐/暂缓"如何表达（读 `.agents/skills/project-profile/references/init-workflow.md`、`template-selection.md`、`state-model.md`）
2. `deliveryTargets` 的存储与生命周期：`profile-state.json` 的字段、deferred→confirmed 的判定证据、update 流程如何修改它（读 `update-policy.md`）
3. 条件读取路由：根 `AGENTS.md` 强制入口表与 frontend-task 的 `source-routing.md` 如何按画像字段决定必读文档——新增 WebView 规则层要进这条链需要动哪几处
4. 模板选择：`.codex/templates/project-profile.*.md` 如何被选中与实例化——webview 相关内容走模板内嵌还是走 docs 引用，各自代价

成果写入 `docs/wayfinder/assets/research-init-update-hooks.md`，本票记录结论指针后闭环。

## Resolution

完整事实与文件行号级证据：[assets/research-init-update-hooks.md](../assets/research-init-update-hooks.md)（2026-09-21）。要点：

1. **决策卡**：七卡（Q1–Q7）定义于 init-workflow.md + profile-proposal.template.json；卡结构含 title/recommendation/alternatives/fields/impacts，代价提示的现成槽位是 `impacts` 数组（无专用字段）。往 Q1 加 webview 选项改动面远小于新增卡——"仅 Q1–Q7"被两份校验器副本（scripts/lib 与 resources/.codex/scripts/lib 的 ai-guidance-validation.mjs:117-119）和测试三处锁死，加选项则零门禁破坏。
2. **deliveryTargets**：webview 已是一等键；状态机为 pending/recommended/**user-confirmed**/deferred/conflict（无裸 "confirmed"）；仅显式用户接受才确认；update 可改但必须走画像访谈、不可静默，变更联动 multiPlatform 派生重算。
3. **条件路由**："按 deliveryTargets 值条件加载文档"的完全相同先例不存在；最近似是根 AGENTS.md:19 按任务类型条件读 AI_PROJECT_STANDARDS.md，可照抄该句式拼上 :17/:18 的状态词表。
4. **模板机制**：build-starter.mjs:55 为整目录递归复制（runtime 清单纯声明无消费），docs/ 下新增 AI_WEBVIEW_MOBILE.md 会自动分发；但校验只认 ai-guidance.config.mjs 的 requiredFiles，不注册即脱离门禁。

最大执行坑：校验器存在双副本（scripts/lib 与 resources/.codex/scripts/lib），改动必须同步两处。
