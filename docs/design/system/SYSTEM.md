# SYSTEM.md — 设计系统规格

版本：`v1`（候选·待确认，auto 模式冻结，见文末来源与转正条件）
适用：桌面 Web 端（本版本仅定义浅色模式；深色模式待确认后另行扩展）
选型来源：`$ui-ux-pro-max --design-system`，查询 "team weekly report dashboard productivity tool"，dials variance 3 / motion 2 / density 8（2026-09-28，Python 3.14.5 本机检索命中）

## 1. 风格与布局模式

- 风格：Minimalism & Swiss Style——干净、功能性、高对比、网格化、几何秩序。检索匹配理由：Best For "Enterprise apps, dashboards, professional tools"。
- 布局模式：高密度仪表盘（density 8，间距档 4/8/12/16/24/32），内容容器 max-width 1320px 居中，页面两侧 gutter ≥ 24px。
- 效果约束：细边框 + 极轻投影（`0 1px 2px rgba(15,23,42,.05)`）分层；hover 150–200ms；禁用大位移、视差与装饰渐变。
- 动效：仅 transition 级微交互（边框、投影、背景色）；`prefers-reduced-motion: reduce` 时全部归零。不出货 scroll 动画。

## 2. 色板

### 2.1 基础色（语义 token）

| token | 值 | 用途 |
| --- | --- | --- |
| `--bg` | `#F6F8FA` | 应用背景（中性灰，见 §6 裁定 1） |
| `--surface` | `#FFFFFF` | 卡片/条面 |
| `--ink` | `#0F172A` | 主文字 |
| `--ink-2` | `#475569` | 次级文字 |
| `--ink-3` | `#5B6B7E` | 辅助文字（meta，白底与 `--bg` 上均 ≥ 4.5:1；v1 冻结 gate 由 `#64748B` 加深，impeccable 4.47:1 踩线项） |
| `--border` | `#E2E8F0` | 常规边框 |
| `--border-strong` | `#CBD5E1` | hover 边框/强调分隔 |
| `--primary` | `#0D9488` | 品牌主色 teal：标记、图标、图形 |
| `--primary-strong` | `#0F766E` | 主色文字与实心按钮底（白字 5.5:1） |
| `--primary-soft` | `#F0FDFA` | 主色浅底（chip/选中态） |
| `--accent` | `#EA580C` | 风险/临期/阻塞警示标记与色点，仅小面积点缀；**警示文字一律用 `#C2410C`**（浅底 `#FEF3EA` 上 4.6:1，`#EA580C` 仅 3.3 不可作小字） |
| `--danger` | `#DC2626` | 破坏性/失败 |
| `--focus-ring` | `#0D9488` | 焦点环 2px + offset 2px |

文字级规则：小于 18px 的彩色文字一律用 strong 档（`--primary-strong`；蓝色用 `#1D4ED8`）；-600 档（`#0D9488`/`#2563EB`）只用于图标、图形标记、大号数字。

### 2.2 阶段色（周报三段语义）

| 阶段 | 色 | 值 | 文字档 |
| --- | --- | --- | --- |
| 完成 | teal | `#0D9488` / 浅底 `#F0FDFA` | `#0F766E` |
| 进行中 | blue | `#2563EB` / 浅底 `#EFF6FF` | `#1D4ED8` |
| 计划 | 中性 | 边框与圆点用 `#94A3B8`，文字用 `--ink-2` | `#475569` |

校验记录（dataviz `validate_palette.js`，light surface，2026-09-28）：
- `#0D9488,#2563EB` 双色：六项全过（CVD ΔE 20.7 deutan、对比 ≥3:1）。
- `#0D9488,#2563EB,#94A3B8` 三色：灰项 chroma floor FAIL、对比 WARN——**裁定：计划段不是分类色，是有意的中性语义（未启动）**；任何图表中出现计划段必须直接标注数值/文字，不允许仅靠颜色区分（relief 已满足）。
- 颜色跟实体走：完成/进行中/计划三色全页固定，不按排名或筛选重涂。

## 3. 字体对

- 定稿字体：**IBM Plex Sans**（Latin/数字；400/500/600/700，`font-variant-numeric: tabular-nums` 实测有效）。
- 变更记录：检索匹配原为 Plus Jakarta Sans，冻结 gate 的 `impeccable detect` 判其为 AI 收敛高频字体（overused-font 反模式），实现尚未消费本规格，按 gate 裁定换为更具工程气质的 IBM Plex Sans；复盘见 §6 裁定 4。
- 中文栈：`"PingFang SC", "Microsoft YaHei", "Noto Sans SC"` 系统回退；原型允许 Google Fonts 渐进增强，离线回退不破版。
- 数字：`font-variant-numeric: tabular-nums`（统计数字、计数徽章、进度百分比）。

字号阶（dense 档）：`12 / 13 / 14 / 15 / 16 / 20 / 24 / 28`。正文 13–14px；meta 与图表标注 ≥12px；行高正文 1.55、标题 1.25。

## 4. 圆角与间距

- 圆角：卡片 10px；卡片内块/输入 8px；chip/徽章 6px（全圆 avatar 与进度条端点除外）。
- 间距：4px 基网格；卡片内边距 16–20px；区块间 12–16px；区块（stats 条、卡片网格）间 24px；页面 gutter 24–32px。

## 5. 组件基线与反模式清单

组件基线（组件目录当前为空，此为设计期基线，实现期回填目录）：
- 图标：内联 SVG（lucide 风格，stroke 1.75，20px 视盒），**禁止 emoji 充当图标**；纯图标按钮必须带 `aria-label`。
- 统计块（stat tile）：数值 28px semibold tabular + 标签 12px `--ink-3` + 变化/补充行 12px；数值穿文字 token，不穿系列色。
- 卡片：`--surface` 底、`--border` 1px 边框；hover：边框升 `--border-strong` + 投影微升；focus-visible 环同 §2.1。
- 列表项：图标列 20px 固定，文字 13px；省略其余项折叠为「+ 还有 n 项」文字链样式。
- 进度：4px 高圆条，进行中填 `#2563EB`，右缀百分比（`#1D4ED8`）。
- 堆叠分布条：段间 2px 表面留白（dataviz mark 规范），段上/旁直接标注数值。

反模式（AVOID，来自检索 + dataviz）：
- emoji 当图标；hover 才可见的信息；0ms 状态突变；gray-on-gray 正文；组件里写死 hex（实现期一律 token 化）。
- 图表：双轴；彩虹渐变；每点标数值；仅靠颜色区分系列；文字穿系列色。
- 复杂上手引导、装饰性大动效、玻璃拟态混入 Swiss 版式。

## 6. 对检索结果的裁定记录（auto 模式，候选）

1. **背景去薄荷化**：检索命中的 background `#F0FDFA`（薄荷底）在长文密集扫描场景偏色偏躁，裁定改为中性 `#F6F8FA`，teal 保留为主色身份；foreground `#134E4A` 同步中性化为 `#0F172A` 墨色。主色/辅色/警示色原样采纳。
2. **字体**：Plus Jakarta Sans 采纳为 Latin/数字主字体，补中文系统栈（检索未覆盖 CJK）。
3. **Pattern 命中 "Product Demo + Features"（营销页模式）弃用**——本任务是内勤工具页，不适用 hero/CTA 结构；采纳其 Style/Colors/Typography 部分。
4. **冻结 gate 字体换裁定（2026-09-28）**：`impeccable detect`（npm 引擎，npx 调用）首跑报 6 项——白字 on `#0D9488` 3.7:1（品牌 mark 改用 `--primary-strong`）、`--ink-3` 4.47:1 踩线（加深为 `#5B6B7E`）、临期徽章 3.3:1 ×2（文字改 `#C2410C`）、stepper 无内衬（加 3px 内衬 + 缩钮）、Jakarta overused（换 IBM Plex Sans，见 §3）。复跑 0 findings。发生在任何实现消费之前，不构成 v2；此为 v1 定稿内容的一部分。

## 7. 深色模式与移动端

- 深色模式：**未定义，待确认**。若启用，阶段色需按 dataviz 协议在暗表面上重跑校验器，不允许自动反色。
- 移动端/WebView：本版本不含（任务级确认为桌面 Web 单端）；触控目标、安全区规则不适用于本稿。

## 8. 版本与转正

- v1 · 候选·待确认 · 2026-09-28 · auto 模式（无人场）按选型直接冻结；同日完成冻结 gate（impeccable detect 复跑清零，见 §6 裁定 4）。
- 转正条件：用户审阅认可，或按反馈出 v2；转正时在本节补记确认时间。
- 升级路径：换配色体系/字体体系属设计方向系统性变更，回 `$design-task` 重开新版本；已实现页面局部不跟进记 DRIFT。
