# 决策索引：UI 能力拆分与接入

汇编 2026-09-26 至 09-28「UI 原型/设计能力拆分与接入」全部已落定裁定。本页只做索引，不新设决策；完整依据与实测附录以各票为准。

## 1. 决策如何产生

全部决策在 wayfinder 地图 [#2](https://github.com/Oatelauser/ai-front-spec/issues/2) 内闭环：2026-09-26 立图，先完成事实调查（本仓覆盖矩阵 + 六上游核实），再分票质询裁定；7/7 子票（#3–#9）落定后于 09-27 关图。执行阶段唯一工作清单为 [#10](https://github.com/Oatelauser/ai-front-spec/issues/10)，阶段 0+1 已通过双盲集成测试（2026-09-27，无返工票），09-28 两条实测附录收尾。全程硬约束：默认不补缺口；接入须同时证明现有组合做不到、读取面增量可控。

## 2. 决策表

| 决策 | 一句话结论 | 关键改判/转折 |
| --- | --- | --- |
| [设计归宿](https://github.com/Oatelauser/ai-front-spec/issues/5) | 同仓分道：设计以独立 lane（`$design-task`）留本仓；「基本直出（`$prototype`）vs 专业设计（lane）」双层边界写入文档 | 改判：原裁定「单开设计仓」经三轮辩论撤销（门控在路由不在目录等三条依据） |
| [ui-ux-pro-max 去向](https://github.com/Oatelauser/ai-front-spec/issues/7) | 以「lane 选型依据」vendor 进本仓（安装面 +2）；运行时缺 Python 报不可用并降级静态清单 | 随 #5 两跳：先归「设计仓」，改判后归位本仓 lane |
| [设计 lane 方案](https://github.com/Oatelauser/ai-front-spec/issues/9) | `$design-task` 薄技能 + 发散循环（选型→2–3 变体→翻选→修订→冻结）；定稿归档 docs/design 目录（带版本）、走 frontend-task source；DRIFT.md 反向对账；Stitch 可选增强 + HTML 兜底 | 九份附录 + 终案 = 作业手册；下载通道结论随实测多次修正 |
| [Stitch 免费性核实](https://github.com/Oatelauser/ai-front-spec/issues/8) | 条件票被 #9 兜底设计消解关闭：不可用或触发付费即回落 HTML，配额不阻塞任何决策 | 免核实即结案；云依赖顾虑同消解 |
| [微调判据与契约](https://github.com/Oatelauser/ai-front-spec/issues/6) | 三分判据：实现质量 / 局部替换 → 本仓直修（替换记 DRIFT）；设计方向系统性 → lane 重开；契约锚 frontend-task 既有 source（四形态 + 版本标识，零新机制） | 模糊带先跑「实现 vs 稿」比对循环筛真因，升级仅两触发 |
| [路由与文档缺口修复](https://github.com/Oatelauser/ai-front-spec/issues/4) | 三行新路由（样式手感 / GSAP / tinypng）+ 复查闭环句 + 边界声明 + figma-workflow 标注；零新文件 | karpathy-guidelines 用户裁定升格全局行（不进场景表逐行重复） |
| [impeccable 接入](https://github.com/Oatelauser/ai-front-spec/issues/3) | B 可选外部登记：不 vendor、零仓增量；README 与 capabilities 双处说明；hook 手动 opt-in，安装器永不自动改宿主配置 | 落地收敛为四命令接入：`detect` / `critique` / `polish` / `audit`（见 capabilities.md Impeccable 行） |
| [施工总清单](https://github.com/Oatelauser/ai-front-spec/issues/10) | 阶段 0+1（文档接线 + lane 施工）通过集成测试；发现项归轻量化批次，不阻塞 | 下载终案升级三层阶梯；DESIGN.md 改 API 内联对账（09-28 实测） |

## 3. 有意不接与豁免

| 项 | 理由 |
| --- | --- |
| frontend-design 插件 vendored | anthropics/claude-code 仓库专有商业条款不可借用，且与内置 frontend-design（Apache-2.0 同源）无增量（[#2 Out of scope](https://github.com/Oatelauser/ai-front-spec/issues/2)） |
| impeccable `craft` / `init` | 双契约冲突，不接入 |
| impeccable `live` / `bolder` / `animate` | 与既有技能重叠 |
| grill 系不入路由表 | 工作流内部质询协议（grill-me 入口 / grilling 协议），保持按需直调（[#4](https://github.com/Oatelauser/ai-front-spec/issues/4)） |
| ui-ux-pro-max 单一父级 | design-task 内部引擎，仅 lane 引用为有意设计（由 roster 可达性测试固化为豁免），不进实现侧场景表 |

## 4. 已知限制与外部依赖现状

- Stitch HTML 端点间歇可用（同机同代理时好时坏，探针窗口 0/10）：以三层阶梯驯服——① 自动重试（manual 重定向 + body 校验，跨分钟铺开）→ ② Codex 宿主 `chrome@openai-bundled` → ③ 手动导出 zip 兜底；施工前重验，官方 CLI v0.11+ 再测（[#10 附录](https://github.com/Oatelauser/ai-front-spec/issues/10)）。DESIGN.md 已可由 MCP `get_project` 内联自动获取，定稿五件套唯一手动项只剩 code.html。
- product-design 无公开源码仓：公开分发依用户特赦（2026-09-24 裁定，2026-09-25 复核改无限期·非商用），许可记录见仓库根 NOTICE。
- 上游死仓/迁移（如 mobile-ux-optimizer 原仓 404 已切延续仓）：以 CI 周报（`vendored-check.yml` 定时任务）「无法探测上游」持续出现为信号，人工确认后再切换延续仓或冻结基线；无 repo 的插件快照只报告来源，不做网络探测。
