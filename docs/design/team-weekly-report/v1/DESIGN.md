# DESIGN.md — 团队周报视图 v1

设计系统规格（与 `docs/design/system/SYSTEM.md` v1 对账生成；冻结候选·待确认）。
本稿由 agent 自写（Stitch 不可用兜底路径），DESIGN.md 与 SYSTEM.md 逐条对齐，无漂移。

## 风格

Minimalism & Swiss Style：中性灰面 + teal 主色点缀、细边框轻投影、网格化高密度版式（density 8）。检索来源 `$ui-ux-pro-max --design-system`（2026-09-28），背景/前景按 SYSTEM.md §6 裁定由薄荷调中性化为 `#F6F8FA` / `#0F172A`。

## Token 摘录（与 SYSTEM.md 同值）

| 组 | 值 |
| --- | --- |
| 面 | bg `#F6F8FA` · surface `#FFFFFF` · border `#E2E8F0` / strong `#CBD5E1` |
| 墨 | ink `#0F172A` · ink-2 `#475569` · ink-3 `#5B6B7E` |
| 主色 | primary `#0D9488`（标记/图标）· strong `#0F766E`（文字/按钮/实心彩底，白字 5.5:1）· soft `#F0FDFA` |
| 阶段 | 完成 teal `#0D9488`/`#0F766E` · 进行中 blue `#2563EB`/`#1D4ED8` · 计划中性 `#94A3B8` 点 + ink-2 文字 |
| 警示 | accent `#EA580C`（标记/色点）· 警示文字 `#C2410C`（「临期」徽章，浅底 `#FEF3EA`）· danger `#DC2626` |
| 字体 | IBM Plex Sans（Latin/数字，Google Fonts 渐进加载，实测已加载；冻结 gate 裁定替换 Jakarta，见 SYSTEM.md §6.4）+ `"PingFang SC","Microsoft YaHei","Noto Sans SC"`；数字 tabular-nums |
| 圆角 | 卡 10 · 块 8 · chip 6 |
| 间距 | 4px 网格；卡内 16–20；区块间 24；容器 max-width 1320，gutter 32 |
| 效果 | 阴影 `0 1px 2px rgba(15,23,42,.05)`，hover 升 `0 4px 14px rgba(15,23,42,.07)`；transition 160ms；reduced-motion 全关 |

## 版式结构（定稿：变体 A「网格」）

1. 应用栏 56px：品牌 mark + Aurora + 增长平台组｜搜索、导出周报、用户头像。
2. 页头：标题 + 副题「第 40 周 · 09.21 – 09.27 · 周一 08:00 自动汇总」；右侧周步进器 + 团队选择。
3. 统计条（顶部，单卡五格）：参与成员 6 / 本周完成 23（+4）/ 进行中 11（2 项临期）/ 下周计划 18 + 工作项分布堆叠条（23/11/18，段间 2px，图例直接标注）。
4. 成员卡 3×2 网格：头像+姓名+角色；三段（本周完成 teal check／进行中 blue 进度条 4px + 百分比／下周计划中性点列），每段计数徽章（soft 底 + strong 字），每段列 2 条 +「+ 还有 n 项」。

## 阶段色校验（dataviz validate_palette.js，2026-09-28）

- `#0D9488,#2563EB`：六项全过，CVD ΔE 20.7（deutan），对比 ≥3:1。
- 灰作第三分类色 FAIL（chroma floor）→ 裁定：计划段为语义中性色，任何图表使用必须直接标注；页内三段始终有结构性标签，颜色非唯一编码。

## 反模式核查（SYSTEM.md §5）

无 emoji 图标（全部内联 SVG）；无双轴/彩虹图；文字均穿墨色 token；彩色小字用 strong 档；hover/focus-visible/reduced-motion 已实现；无横向滚动（1425px 内容宽 @1440 视口实测）。

## 深色模式

未定义（SYSTEM.md §7 待确认）；本稿仅浅色。
