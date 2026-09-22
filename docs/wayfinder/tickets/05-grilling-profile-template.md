---
label: wayfinder:grilling
title: vue-webview 画像模板终稿
status: closed
assignee: main-session
blocked-by: ["02-grilling-webview-card-design", "04-prototype-rule-layer-structure"]
---

## Question

画像模板的最终形态：vue 模板如何携带 webview 变体内容（模板内嵌 vs 硬边界引用规则层与矩阵）、`toolkit.json` profiles 的注册方式、与组件目录（AI_COMPONENT_CATALOG.md）的联动是否需要 WebView 侧动作。产出模板全文草案 + 注册改动清单。

（2026-09-22 追加硬边界，源自 02/04 自审）**不新增 profiles 键**：`project-profile.test.mjs:14` 锁死键集恰为 `['generic','react','vue']`，且 MAP 预锁"不做框架×端模板组合"。webview 内容走**三模板同引**路线——generic/react/vue 各自第 3 节/硬边界节引用 `docs/AI_WEBVIEW_MOBILE.md`（措辞可按框架微调）。本票终稿定的是**引用措辞 + 组件目录联动**，不是造新模板文件；标题"vue-webview"按"vue 模板的 webview 侧引用"理解。

## Resolution（2026-09-22，六问全按推荐）

硬边界兑现：**零新模板文件、零 profiles 键改动**（探查证实 toolkit.json profiles 为纯路径字符串，模板改内容即可）。六项锁定：

1. **引用措辞 = 三份一字不差**（Q1）：generic/react/vue 同一句复制，不做框架微调——规则层框架无关，微调只添三处漂移；票面"措辞可按框架微调"的暂定表述按此否决。**测试锁**：扩展 `project-profile.test.mjs`（沿 :107 既有惯例）断言三模板均含 WebView 引用句——同步由测试管，不靠自觉。
2. **只引规则层，不引矩阵**（Q2）：矩阵归 project-profile 访谈流（决策期工具）；任务期要裁决结果不要裁决工具，画像不放矩阵指针，防任务期私自裁决。
3. **落位 = 第 3 节「支持端与运行环境」表格后**（Q3）：声明式一句，三份同位置同句，**不加新 `<待填写>` 槽位**（条件写在句内，零校验器/测试影响）。骨架：`deliveryTargets 含 webview 或 mobileH5 时，页面任务受 [WebView 移动端规则](docs/AI_WEBVIEW_MOBILE.md) 约束，按页面声明判定生效标签集`。硬边界节否决（禁令清单容不下事实声明）。
4. **组件目录 = 零动作**（Q4）：三场景各有归属——任务期读目录的 AI 已被 AGENTS.md 路由行加载规则层；init 期组件基线选择由矩阵第 7 条扫；目录"支持端"列已能表达组件级容器适配。**雾区挂起项正式关闭**。
5. **裁决记录持久化**（Q5）：materialize 时把 `compatibilityScan` 结果并入 PROJECT_PROFILE **第 10 节「维护信息」**的"兼容裁决记录"条目（条目/级别/裁决/时机）；update 复检读之避免重复追问；proposal 本体用后即弃（票 03 修正 10 同步）。
6. **挂载条件扩宽**（Q6）：**`webview 或 mobileH5 任一 user-confirmed` 即载入规则层**——原 webview 单键使纯移动 H5 项目 [视口] 规则（safe-area/16px/键盘）任务期静默缺席，文档名承诺的另一半用户被门挡住；[容器] 条目按既有降级语义为背景知识。tabletWeb-only/纯桌面**有意**不挂载（平板归通用响应式规则、桌面通用规则归工具包既有文档——融合前原状非回归）。落点：草案文档头已改 + AGENTS.md 路由行（执行期）+ 模板引用句（Q3 骨架已含）。

顺手修复：草案 worked example 三处 `targets: ['browser']`/`['browser','webview']` → `browserWeb`（票 04 修正 3 枚举规则的示例自己违例——词必须对的上）。

### 执行期改动清单（随全局执行）

| # | 文件 | 改动 |
| --- | --- | --- |
| 1 | 三份 `project-profile.{generic,react,vue}.md` | 第 3 节表格后加同一句引用（一字不差） |
| 2 | `scripts/lib/project-profile.test.mjs` | 新断言：三模板均含引用句（沿 :107 惯例） |
| 3 | `resources/AGENTS.md` 路由行 | 挂载条件句（webview 或 mobileH5）——共 5 份复制须同步（3 模板+路由行+规则层文档头） |
| 4 | 规则层文档头（成品） | 生效条件同步扩宽 |
| 5 | project-profile SKILL.md materialize 步 | compatibilityScan 并入第 10 节兼容裁决记录 |
| 6 | `acceptance-matrix.md` / `subcommands.md` 行选择步 | 补标签集同步产出措辞（票 04 修正 1 锚点的载体，一行） |
| 7 | `update-policy.md` | 矩阵复检步补"先读第 10 节兼容裁决记录（跳过已裁未变）"；声明复检 3.5 步（票 02 修正二）；materialize 对第 10 节 **append-only**（只追加不重置） |
| 8 | `resources/README.md` | 文档清单加两行（若存在 docs 清单） |
| 9 | `project-profile.test.mjs` 断言扩面 | 挂载条件句 **5 份复制全锁**（3 模板 + AGENTS.md 路由行 + 规则层文档头）+ 内容锚（文档头含激活条件表关键词；矩阵含合同三句话）——静态断言 ≠ 被否决的语义扫描脚本 |

**执行顺序（依赖链，subagent 照此派工）**：两份成品文档 → requiredFiles 注册（`ai-guidance.config.mjs`）→ 模板引用句 + 测试断言 → AGENTS.md 路由行 → 技能/流程接线（init-workflow / proposal 模板 / SKILL.md / update-policy / acceptance-matrix / 两 README）→ 校验器双副本同步 → 门禁全绿（`build-starter --check` / `node --test` / `check-ai-guidance --strict`）→ commit + tag v5.0。
