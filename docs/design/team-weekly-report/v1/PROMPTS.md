# PROMPTS.md — 团队周报视图 v1

## 元数据

| 字段 | 值 |
| --- | --- |
| 特性 slug | `team-weekly-report` |
| screenId | null（agent-written 路径，无 Stitch 屏） |
| projectId | null（本子代理环境无 Stitch MCP 工具；探测按 SKILL §4/§8 兜底，环境原因，非 Stitch 故障） |
| 来源标记 | `agent-written`（SYSTEM.md v1 同规格自写，非 Stitch 导出/截图还原） |
| 确认状态 | `confirmed: pending`（auto 无人场候选定稿；用户点头后在本节补记转正时间） |
| 版本 | v1（2026-09-28 冻结） |
| 设计视口 | CSS 1440×900（Chrome DevTools 设备仿真，非窗口 resize），DPR = 2 |
| 截图像素 | screen.png 2848×2544 px（全页捕获：内容宽 1425 CSS px——1440 视口减 15px 滚动条；页高 1272 CSS px；×2） |
| 字体加载 | Plus Jakarta Sans 实测已加载（document.fonts.check = true，4 weights）；离线回退中文系统栈不破版 |
| 控制台 | 仅两条环境噪音：search input 缺 name（已修复）与 file:// 同源 favicon 噪音；无渲染错误 |
| 横向滚动 | 无（scrollWidth 1425 = clientWidth 1425 实测） |

## 提示词链

1. 设计简报（同源文本，完整存 `.stitch/designs/team-weekly/brief.md`）：产品描述 + 内容清单（应用栏/页头/统计条/成员卡×6/无卡脚）+ 负清单（不加通知、快捷操作排、新增按钮、消息流）。
2. `$ui-ux-pro-max --design-system "team weekly report dashboard productivity tool" --density 8 --variance 3 --motion 2` → Minimalism & Swiss + teal 色板 + Plus Jakarta Sans；裁定记录见 SYSTEM.md §6。
3. 变体生成（agent 自写 HTML，单维度 LAYOUT，同内容清单同 token）：

| 变体 | 维度 | 差异点 | 截图 | 裁决 |
| --- | --- | --- | --- | --- |
| A 网格 | LAYOUT | 顶部统计带 + 成员卡 3 列网格 | `.stitch/designs/team-weekly/shot-a.png` | **选定** |
| B 台账 | LAYOUT | 单一大表面，每人一行 × 完成/进行中/计划三列对齐 | `shot-b.png` | 落选：形态是表非卡，与任务书「每人一条卡片」字面不符；长条目在列内换行不佳 |
| C 控制台 | LAYOUT | 左信息轨（概览 + 成员索引迷你分布条）+ 2 列大卡 | `shot-c.png` | 落选：统计移到侧栏违背「顶部有团队本周统计」；左栏下方空腔、整页最高 |

**选择原因（A）**：对任务书两条硬约束（顶部统计、每人一卡）零偏离；密度与扫描路径均衡；卡形态最利于九状态扩展（空卡/错误卡/未提交成员卡）；三列同构自带跨成员可比性（B 的核心优点已部分保留）。C 的成员索引迷你分布条记为 v2 候选增强，不混入本轮（防加戏）。

## 定稿前核对（冻结 gate）

- [x] 对照内容清单核加戏：无多出区块（无铃铛/快捷排/消息流；卡脚按简报省略）
- [x] 渲染瑕疵过检：无文字截断、无占位残留、无空图（1440×900 全页截图逐卡目检）
- [x] 原始响应已存：变体 HTML 与截图存 `.stitch/designs/team-weekly/`（gitignored 工作区）
- [x] 尺寸已区分：CSS 视口与 PNG 像素分列（见元数据），DPR = 2 实测非 null
- [x] 路由映射：原型无路由；CONTRACT.md 记「待确认」
- [x] impeccable detect：首跑 6 项 → 修复 → 复跑 **0 findings**（详见下节运行记录）

## 复现说明

变体与简报：`.stitch/designs/team-weekly/{brief,variant-a,variant-b,variant-c}.html/md` + `shot-{a,b,c}.png`。
定稿 code.html = variant-a.html 原样副本（差异：search input 补 `name="q"` + 下述 detect 修复）。
浏览器验收命令：设备仿真 1440x900x2 + 全页截图（Chrome DevTools MCP）。

## impeccable detect 运行记录（冻结 gate，2026-09-28）

`npx impeccable detect docs/design/team-weekly-report/v1/code.html`（npm 引擎，无需代理）。首跑 6 项，全部修复后复跑 0 findings（exit 0）：

| 发现 | 裁定 | 修复 |
| --- | --- | --- |
| 白字 on `#0d9488` 3.7:1（品牌 mark） | 真问题 | mark 底改 `--primary-strong #0F766E`（5.5:1） |
| `#64748b` on `#f6f8fa` 4.47:1（meta 墨色） | 真问题（踩线） | `--ink-3` 全局加深为 `#5B6B7E` |
| `#ea580c` on `#fef3ea` 3.3:1 ×2（临期徽章） | 真问题 | 徽章文字改 `#C2410C`；统计条「2 项临期」同步 |
| stepper 子元素贴边 | 半真（分段控件常态，但可零成本改善） | stepper 加 3px 内衬、按钮缩至 28px |
| Plus Jakarta Sans overused-font | 工具打架，采 gate 裁定 | Latin 字体换 IBM Plex Sans；SYSTEM.md §3/§6.4 记录（ui-ux-pro-max 选型被冻结 gate 覆盖，规格未被实现消费过，不构成 v2） |
