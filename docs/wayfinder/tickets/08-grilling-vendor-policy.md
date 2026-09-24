---
label: wayfinder:grilling
title: vendoring 细则：8 个外部 skill 入库 + 许可 + 接线
status: closed
assignee: main-session
blocked-by: ["07-grilling-target-layout-spec"]
---

## Question

8 个外部独立 skill（tdd-workflow、frontend-design、api-design、security-review、frontend-design-direction、taste-skill、web-design-guidelines、react-best-practices）vendored 入库的细则。依 [host-discovery-research.md](../assets/host-discovery-research.md) §4 许可事实：

1. **拷贝来源**：从本机 `C:\Users\yangsheng\.codex\skills\`（已装实体）直接拷贝，还是从上游仓库固定 commit 拉取（可重复构建）？混合方案（本机为快照源 + NOTICE 记上游 URL 与快照日期）是否足够。
2. **逐 skill 许可核对**：everything-claude-code（MIT）、taste-skill（MIT）可直接入；vercel-labs/agent-skills 无 LICENSE 文件仅 README 声明 MIT——vendor 时标注口径；anthropics/skills 是混合许可仓，`frontend-design` 须核对该 skill 目录内的 LICENSE 文件实际条款后定（Apache-2.0 则顺，否则单独裁决）。
3. **NOTICE 文件**：格式与位置（沿 agentic-stack 惯例：第三方组件保留原许可、不被本仓库再许可）；每个 vendored skill 的归属标注（上游仓库、快照日期、许可）。
4. **命名冲突策略**：用户级已装同名 skill 时项目内置优先（沿用现有"名称冲突时以内置版本为准"规则）是否维持；`.claude/skills` 镜像同步是否覆盖 vendored skill 的 AUTO-GENERATED 头与 skill 自述文件的关系。
5. **接线**：toolkit.json 的 skills 清单补 8 项；能力清单文档独立 Skill 节改"本 Starter 内置"；安装模式（核心/UI/React UI/Figma/完整）重组——外部依赖归零后模式的意义是否坍缩为"宿主插件可选"单一维度。
6. **名称差异**：上游 `taste-skill`/`react-best-practices` 与清单里 `$design-taste-frontend`/`$vercel-react-best-practices` 的名字对齐——vendored 后以目录名为准还是保留清单别名。
7. **（俯瞰新增 F2）仓自身许可**：本仓根无 LICENSE——公开 release zip 分发前必须先立自己的许可立场（含"对 vendored 组件不再许可"的边界声明），与 NOTICE 三件一体裁决。

产出：vendoring 政策 + NOTICE 草案 + 接线改动清单。

会话先调 Skill：`grilling` 与 `domain-modeling`。

## Resolution（2026-09-23，两轮共八决策面，全按推荐，含用户修订×3）

用户修订：Q1 加硬要求「每个 skill/插件必须知道来源 + 别人怎么手动安装/更新」；Q6 定调双路径目标（Codex 兼容 figma 插件；无插件 Codex 与 Claude Code 走 MCP 直连）；命名锚点经盘点证据（frontmatter≠目录名 ×2）改判 frontmatter。

### 决策表

| 决策面 | 裁决 |
|---|---|
| 拷贝来源 | 本机 `~/.codex/skills/` 快照 + NOTICE 溯源（上游 URL、快照日期、许可证据、修改记录）；capabilities.md 记每个 vendored 技能「来源与更新」、每个宿主插件的双路径安装/更新说明 |
| 逐技能许可 | 8/8 入：ECC ×4（tdd-workflow / api-design / security-review / frontend-design-direction）MIT 仓库级；frontend-design **Apache-2.0（目录内 LICENSE.txt 全文）**——票面悬点落地；taste-skill MIT（leonxlnx/taste-skill，仓库级）；web-design-guidelines MIT（**内容源 vercel-labs/web-interface-guidelines 有 LICENSE 文件**，本次核实，升级"仅 README 声明"的研究结论）；react-best-practices MIT（frontmatter 声明，仓库无 LICENSE 文件，NOTICE 记口径） |
| 命名锚点 | canonical = frontmatter `name`（宿主索引实名；盘点实证两处目录≠名：taste-skill↔design-taste-frontend、react-best-practices↔vercel-react-best-practices）；目录名保持上游原样；不编辑上游 frontmatter（少一处要记录的修改）；toolkit.json / capabilities.md 清单一律用 frontmatter 名 |
| 名称冲突 | 维持「项目内置优先」，写入 capabilities.md 第 1 节 |
| 安装模式 | 核心/UI/React UI/Figma/完整五模式坍缩为「宿主插件可选」单一维度 |
| figma 处置（c′） | **不入库**：Figma Developer Terms §2 仅授"为开发集成而使用"的有限许可、§8a 未明授即保留——无再分发权（本会话抓取条款核实）。删 `.agents/skills/figma/`（镜像随同步器消失）；~25 行 MCP 直连用法以自写中文表述并入自有 `frontend-task/references/figma-workflow.md`（流程/事实不受版权、表达受版权：只取步骤重写）。双路径：Codex 主走 `figma@openai-api-curated` 插件（路由表本就指向其子技能）；无插件 Codex 与 Claude Code 走 MCP 直连（CC 唯一路径，指引随镜像分发） |
| web-design-guidelines | vendor 连带 `command.md` + 内容源 LICENSE 入技能目录；SKILL.md 改指本地引用（原为使用时拉取 raw.githubusercontent.com，违背零外部下载精神）；NOTICE 记修改（playwright Modifications 先例） |
| 仓自身许可 | MIT（LICENSE 新建）+ NOTICE 边界声明「vendored 组件保留原许可、不被本仓再许可」，三件一体 |

### NOTICE 草案（执行期落地，URL/日期届时填实）

```markdown
# NOTICE

ai-front-spec 按 MIT 许可发布（LICENSE）。
以下第三方组件随本仓库分发，版权归原作者所有，按其原许可条款提供，
不受本仓库许可再授权；目录内保留的原许可文件优先。

## Vendored skills（.agents/skills/）

| 目录 | 上游 | 快照 | 许可 | 本仓修改 |
|---|---|---|---|---|
| tdd-workflow / api-design / security-review / frontend-design-direction | everything-claude-code（URL 执行期填） | 执行期填 | MIT（仓库级） | 无 |
| frontend-design | anthropics/skills | 〃 | Apache-2.0（目录内 LICENSE.txt） | 无 |
| taste-skill | leonxlnx/taste-skill | 〃 | MIT（仓库级） | 无 |
| web-design-guidelines | vercel-labs/agent-skills（内容源 vercel-labs/web-interface-guidelines） | 〃 | MIT | SKILL.md 改指本地 command.md（原运行时拉取） |
| react-best-practices | vercel-labs/agent-skills | 〃 | MIT（frontmatter 声明，仓库无 LICENSE 文件） | 无 |
| playwright | microsoft/playwright-cli | 先在库 | Apache-2.0 | 见目录内 NOTICE.txt |

## 派生说明

- karpathy-guidelines（项目技能）：行为准则派生自 Andrej Karpathy 公开帖（URL 执行期填），本仓自撰。

## 边界

- 本仓库不对上述第三方组件再许可；任何修改均在表中或目录内 NOTICE 记录。
- figma 官方技能因 Figma Developer Terms 未授予再分发权，不入库；
  获取与双路径接入（Codex 插件 / MCP 直连）见 docs/capabilities.md「宿主插件（可选）」。
```

### 接线改动清单（票 09 消费源）

1. **toolkit.json v6**：skills 清单 20 项（12 项目 + 8 vendored），名称一律 frontmatter name。
2. **capabilities.md**：第 1 节 = 20 技能零安装合一清单 + 冲突规则一行（内置优先）+ 每 vendored 技能「来源与更新」行（上游 URL + 重 vendor 方式）；第 2 节 = figma 条目改双路径（Codex 插件 marketplace 安装/更新 + MCP 直连配置要点，CC 唯一路径）；模式节按决策坍缩为「宿主插件可选」单维。
3. **figma 删除改线**：删 `.agents/skills/figma/`（镜像随同步器消失）；capabilities.md 原 `$figma` 内置行（:79）删；`frontend-task/references/figma-workflow.md:17` 死引用（`figma:figma-design-to-code` 为插件专属技能）改「有 figma 插件加载其子技能，直连 MCP 按本节顺序」；同文件增「MCP 直连用法」~25 行（get_design_context → 截断回退 get_metadata → get_screenshot → 资产 localhost 源 / 禁新增图标包 / 禁占位 → 1:1 对稿验收，自写表述）。
4. **web-design-guidelines**：vendor 连带 `command.md` + 内容源 LICENSE；SKILL.md 改指本地。
5. **karpathy-guidelines**：归项目技能（NOTICE 派生说明记来源），不占 vendored 名额。

### 修正票 07

技能总数 21→**20**，以本票为准；其余树结构不变（内部构成见下方修订）。

### 修订（2026-09-23 俯瞰二：在库 6 技能来源审计补全）

在库 6 技能（gsap ×3 / apple-design / compatibility-testing / mobile-ux-optimizer）经 elms-h5 技能包（20260917，README 载明"发送者本机已安装 skill 快照"）迁入，上游全部定位、许可全部实取核实为 **MIT——无需重写或移除**：

| 技能 | 上游 | 许可（LICENSE 实取） |
|---|---|---|
| gsap-core / gsap-performance / gsap-timeline | github.com/greensock/gsap-skills | MIT © 2026 GreenSock |
| compatibility-testing | github.com/proffesor-for-testing/agentic-qe | MIT © 2025 Agentic QE Contributors |
| mobile-ux-optimizer | erichowens/some-claude-skills（原仓已 404；延续仓 curiositech/some_claude_skills 承 MIT） | MIT © 2025 Erich Owens |
| apple-design | github.com/emilkowalski/skills | MIT © 2026 Emil Kowalski（SKILL.md 指纹逐字核对，本仓为早期版本快照，上游已迭代） |

**计数二次修正**：20 = **5 自研项目技能**（project-workflow / project-profile / frontend-task / tinypng-compress / karpathy-guidelines）+ **15 vendored**（先在库 7：gsap ×3、apple-design、compatibility-testing、mobile-ux-optimizer、playwright + 新入 8）。

**G2 执行规则（适用全部 vendored）**：上游有 LICENSE 文件则拷入该技能目录随发（本次 5 上游 + ECC + taste-skill + web-interface-guidelines 均有；react-best-practices 无文件，以 NOTICE 行记口径）。

**NOTICE 草案表增量 4 行**（快照日期 = 2026-09-17 elms-h5 包；"本仓修改"均"无"）：上表四组上游；溯源链记「上游 → elms-h5 技能包 20260917 → 本仓 commit a0a5921」。capabilities.md「来源与更新」行覆盖全部 15 vendored。apple-design 保持快照版本（上游已演进，更新路径 = 重新 vendor，非必须）。

### 修订二（2026-09-23 图收口后：product-design 整包 vendor 改判）

图收口后发现缺口：product-design 插件是唯一无 CC 路径的外部能力（figma 有 MCP 直连，它没有——无公开 MCP server、无公开源码仓）。用户裁定 **A = 整包 vendor**（「自己用，不怕」「又不是商用」，两度确认；本节为改判依据与执行规则）。

**许可实勘（2026-09-23）**：本机插件缓存 `~/.codex/plugins/cache/openai-api-curated/product-design/d416fd5a/`（v0.1.52）——无 LICENSE/NOTICE、`package.json` `"private": true` 且无 license 字段、repository 指向 github.com/openai/openai **内部仓**（公开 404）→ 无任何授予，默认全保留权利。**与 figma 裁定的区别（不构成先例推翻）**：figma = 条款明文禁止再分发（实核）+ 有 MCP 替代路径 → 删；product-design = 沉默无授予 + **无任何替代路径** → 用户裁定自用接受、公开发布风险自担。实践风险≈0（个人非商用项目）。原 Resolution 中「插件不平移不替代」对 product-design 单项作废，figma 裁定不变。

**执行规则**：

1. 拷贝源 = 上述本机快照，**整包原样**（`skills/` ×10、`references/`、`scripts/`、`templates/`、`agents/`、`assets/`、README.md、package.json、`.codex-plugin/`）→ `.agents/skills/product-design/`（含迁移前 `resources/` 前缀阶段）。互依实证：3 个被接线子技能交叉引用 `../index/`、`../user-context/`、`../design-qa/`、包级 `references/`——抄子集必断链。
2. 顶层自写**薄路由 SKILL.md**（frontmatter `name: product-design`；正文 = 版本快照声明 + 10 子技能地图 + 与官方插件关系一段）——唯一修改，NOTICE 记；不动包内任何文件（G2「目录保持上游原样」在此扩展为整包原样；上游无 LICENSE 文件，G2 拷贝规则不适用）。
3. **接线增量**（票 09 矩阵消费）：`task-routing.md` 三行 + capabilities.md 子技能用法三处 `$product-design:index` 等 → `$product-design`（内置直调；装有官方插件者 ns 直调亦可，一句注记）；capabilities.md 第 2 节 product-design 行**迁第 1 节** vendored 清单；`ai-guidance.config.mjs` requiredMarkers 删 `product-design@openai-api-curated` 项；`screenshot-workflow.md:5` 措辞「当前可用」→「内置」。
4. **计数三次修正**：**21 = 5 自研 + 16 vendored**；toolkit.json v6 skills 清单 21 项；票 07/09/10 计数点同步（票 10 冒烟②「21 名全出」）。
5. **NOTICE 草案表增一行**：product-design | OpenAI product-design 插件 v0.1.52 本机快照（无公开源码仓） | 2026-09-23 | **无许可文件（private:true，默认全保留）——用户裁定自用接受，公开发布前需重审** | 顶层薄路由 SKILL.md 自写。
