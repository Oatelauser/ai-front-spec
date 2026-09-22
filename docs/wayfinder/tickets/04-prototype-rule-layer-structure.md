---
label: wayfinder:prototype
title: WebView 规则层结构与适用域标注
status: closed
assignee: main-session
blocked-by: ["01-research-init-update-hooks"]
---

## Question

`AI_WEBVIEW_MOBILE.md` 的结构草案：分域组织（视口与全屏 / 布局组件层 / 请求与认证 / 安全 / 资源与压缩 / i18n / WebView 能力与兼容 / 验收）、97 条去重后（4 组跨文件重复合并）的条目归属、每条规则的适用域标签词表（仅 WebView 容器 / 仅移动视口 / 全端）、`route.meta.targets` 页面声明约定与缺省跟随主端的规则。产出：结构草案 + 已标注样例 ≥20 条（含改写，遵循分类报告"去私有化要点"）。

## Resolution（2026-09-22）

产出资产：[assets/ai-webview-mobile-structure-draft.md](../assets/ai-webview-mobile-structure-draft.md)（结构草案 + 28 条去私有化样例 + 激活条件表 + 判定协议 + worked example）。锁定：

1. **8 域组织**（i18n 独立成域——域按职责不按体量）；~95 条归属分配表锁结构不锁明细，执行期逐条落位。
2. **标签 3 值封闭枚举**：[容器]/[视口]/[全端]，不加第四值（YAGNI）。
3. **标签可识别性（用户硬要求）的机械解**：激活条件表——标签键名 = `deliveryTargets` 键名（容器↔webview、视口↔mobileH5、全端↔恒真），零翻译层零解释空间；正交不推导（钉钉 PC 内嵌 = 容器激活、视口不激活）。
4. **判定协议四步**写进成品文档头，inspect 阶段执行：读主端（既有强制读点）→ 读页面声明（缺省=主端）→ 查表得生效标签集 → **生效标签集落纸进 plan 开头**（verify 阶段可核对一致性）。识别不靠 AI 自觉，靠查表+落纸。
5. **页面声明语义**：`route.meta.targets` 显式覆盖缺省；声明即事实，声明里没有的端对应标签不激活，不做推断；载体不绑死（生成路由 meta / 手写 meta / 页面常量皆可）。
6. **降级语义**：未激活标签条目 = 背景知识（可见不强制不删除）。
7. 分层职责：AGENTS.md 路由行管第一层挂载；文档头协议管第二三层判定；不重叠。

### 修正（2026-09-22，关票后自审发现）

1. 生效标签集的产出**锚定既有 acceptance-matrix 选择步**（subcommands.md:56 本就读 deliveryTargets 选行，同步产出标签集），plan 落纸引用之——不新造 plan 行格式约定。
2. tabletWeb 无专属标签为**有意设计**（平板由通用响应式规则覆盖），成品文档头一句话写明，防后来者疑惑。
3. route.meta.targets 取值必须来自 deliveryTargets 键名枚举（约定级约束）；错拼的可见性由"生效标签集落纸"兜底——落纸值与页面声明对不上时 verify 阶段可核对。
4. **多页任务**：判定协议第 2 步按页面逐一生效——多页任务逐页判定、逐页落纸（按页分组列出生效标签集），防多页任务下标签集含糊。
5. **条目增补生命周期**：成品文档头写明项目可增补条目（同格式 [标签] 前缀 + 归入对应域）——规则层不是只读物，项目内新发现的坑有处安放，不散落进 commit message。
6. **页面声明边界（四轮系统自审，用户裁决升级版）**：`route.meta.targets` **只能收窄、不能扩端**——必须 ⊆ confirmed deliveryTargets；扩端 = 改端，走 update（访谈确认 + 矩阵复检），不得靠页面声明静默混入。规则一句写进成品文档头，执法嵌进**判定协议第 2 步**（读声明时加守卫：声明 ⊄ confirmed 集 → 停，亮出超出的端，提示走 update；本任务不静默按扩端执行——项目级路由行未加载规则层，继续 = AI 凭记忆即兴容器知识）。停而非禁令：update 确认后即合法——页面声明是想扩端的隐式选择，update 把它变成显式。**否决的候选**：负向声明 `targetsExclude`（生效集 = S \ 排除，结构上无法违规）——意图不锚定（工件不含意图，靠当时 S 考古）+ update 加端时页面静默漂移（Exclude mobileH5 的 JSBridge 页在加 browserWeb 后无声坏掉）：把可见冲突换成不可见漂移，与全图灭绝静默失效的方向相反。
7. **挂载条件扩宽 + 草例违例修复（票 05 自审）**：生效条件从 `webview` 单键扩为 **`webview 或 mobileH5 任一 user-confirmed`**——原条件使纯移动 H5 项目的 [视口] 规则（safe-area/16px/键盘）任务期静默缺席，文档名承诺的 Mobile 半边被门挡住；[容器] 条目按既有降级语义处理。tabletWeb-only/纯桌面有意不挂载（平板归通用响应式规则，桌面通用规则归工具包既有文档，融合前原状非回归）。同时修复：草案示例三处 `targets: ['browser']` 违反修正 3 枚举——已改 `browserWeb`。
