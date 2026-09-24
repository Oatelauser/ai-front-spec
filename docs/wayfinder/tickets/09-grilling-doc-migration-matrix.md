---
label: wayfinder:grilling
title: 文档迁移矩阵：引用适配 + 死引用执法
status: closed
assignee: main-session
blocked-by: ["07-grilling-target-layout-spec"]
---

## Question

用户指令第 5 条："所有文件/文件夹删除、移动，都需要评估涉及的相关文档的修改，无效引用。"锁定：

1. **引用枚举**：对「终态目录规格」产出的每个移动/删除/改名条目，枚举全部引用点——AGENTS.md、README.md（根 + resources 两份）、CLAUDE.md、docs/*.md（含 AI_*.md、PROJECT_PROFILE 模板、能力清单）、.agents/skills/*/（SKILL.md 与 references）、.toolkit/templates/、check-ai-guidance.mjs、scripts/lib/*.test.mjs、toolkit.json。产出"改动 → 引用修改"矩阵（含 `.codex`→`.toolkit` 全量路径替换、`resources/` 前缀消除、CODEX_CAPABILITIES.md 改名的波及面）。
2. **死引用执法**：check-ai-guidance.mjs 扩展死引用检查——判定规则（markdown 链接/路径引用指向不存在的文件即死）、豁免清单（如模板占位符）、`--strict` 语义是否扩展覆盖。
3. **验收口径**：`node --test scripts/lib/*.test.mjs` 全绿 + `check-ai-guidance.mjs --strict` 通过 + 死引用检查零命中；文档口径与仓库现实一致（AGENTS.md 强制入口表指向的文件全部存在）。
4. **（俯瞰新增 F4）capability-state.json 去留**：Q9 删除 codex-capability-setup 后该状态文件失去唯一维护者——判删（随技能归档）或转静态说明并入能力清单文档，本票定。

产出：迁移矩阵 + 校验器扩展规格 + 验收清单。

会话先调 Skill：`grilling` 与 `domain-modeling`。

## Resolution（2026-09-23，一轮五问修订版全按推荐锁定；关票前俯瞰三 G6–G12 全采纳——用户「推荐的来」「全部建议采纳」）

### 迁移矩阵（全量枚举入资产）

完整矩阵见 [assets/migration-matrix.md](../assets/migration-matrix.md)（38 文件、scope 内约 370 处失效引用、样本行号到行、镜像/宿主/FP 三类标注）。要点：

- **规模**：`.codex/` 167（另裸 `.codex` 10）· `resources/` 前缀 13 · `docs/AI_`+FRONTEND_CONVENTIONS 141 · CODEX_CAPABILITIES 22 · codex-capability-setup 29 · capability-state 19 · figma 技能引用 22 · 模板名 40 · sourceRoot 语义 14 · 构建/测试路径依赖约 60 处断言。票 06「171 处」估计由实测取代。
- **镜像占比 17–29%**（C1/A/E/F/G 类命中在 `.claude/skills/`）——改 `.agents` 源后同步器自动再生，**禁手工双改**；build-starter/toolkit.json/scripts/ 下引用必须手工改写。
- **宿主盲区（sed 最大陷阱）**：8 处 `.codex` 命中实指 Codex 宿主目录（playwright SKILL.md:41 + cli.md:11 及镜像；figma ×2+2 随技能删除消失）——**不得**随全局 `.codex→.toolkit` 替换，剩 playwright 4 处原样保留（入登记豁免表）。
- **插件引用保留**：`figma:figma-*` / `figma@openai-api-curated` 23 处（G-d）不动，与删 `$figma` 裸名并行不悖。
- **名称归一**：`$design-taste-frontend`/`$vercel-react-best-practices` 别名 21 处随能力清单重组一律改 frontmatter 名（taste-skill / react-best-practices，锚定票 08）。
- **矩阵时效（G11）**：矩阵 = vendoring 前快照（F8 执行顺序下正确）；执行若变序或中途有提交，以校验器实测为准，矩阵仅作 sed 底稿。

### 计划外引用裁决（枚举防漏网 9 项）

| # | 发现 | 裁决 |
|---|---|---|
| 1 | capability-state.json 无迁移目的地 | Q4-A 删（引用改线见 F 表 + F4 清单） |
| 2 | profile-proposal.json 运行态 10 处 | 随 `.codex→.toolkit` 全局替换；validation.mjs:103 默认路径同步改 |
| 3 | 裸 `AI_*.md` 文件名（无 `docs/` 前缀，6 文件） | 校验器行内反引号路径相对解析天然覆盖（Q1①设计行为）；grep 道兜底 |
| 4 | docs/wayfinder/ 160+ 处旧路径 | Q2 豁免 + 不改写（计划自身快照，历史文档） |
| 5 | check-ai-guidance.mjs:12 定位逻辑 `['.codex','resources']` | 加 `.toolkit` 分支（非文件引用，行为依赖） |
| 6 | toolkit.json runtime `".codex"` | → `".toolkit"`；`".claude"` 项不动 |
| 7 | `.serena/` 未跟踪 | 已在分发剔除清单（票 07） |
| 8 | FP ×2 类 | gsap.com 外链走 Q2 外链豁免；`manifest.toolkit?.[key]` 无斜杠不匹配路径型字面量 |
| 9 | `docs/PROJECT_PROFILE.md` 与 `.agents/skills/**` 相对引用 | 不失效，无操作（矩阵已确认） |

### 决策表（五问锁定）

| 决策面 | 裁决 |
|---|---|
| Q1 死引用判定 | **三类引用 + 分发视角**：①文件路径引用 = markdown 链接 `[x](path)`（相对引用文件所在目录解析，`/` 开头按仓库根）+ 行内反引号路径（**仅锚定路径，G6**：`/` 开头或以仓内顶层名开头——`.agents/`、`.claude/`、`.toolkit/`、`docs/`、`scripts/`、根级文件名；纯相对反引号不扫，结构性排除 vendored 技能示例路径误报，自有文件由 md 链接道 + grep 道兜底）；②`.mjs`/`.json` 路径型字符串字面量（含 `/` 且解析后落仓内）；叙述性纯文本不扫。③技能调用引用：裸 `$name`/`/name` 必须命中 `.agents/skills/*/SKILL.md` frontmatter name 名册（票 08 锚点）；`ns:name` 与 `@marketplace` 豁免（插件引用），`${}` 天然不匹配。④分发视角：非 dev-only 文件禁引分发剔除清单路径（六项，单一事实源见 G10） |
| Q2 豁免清单 | 外部 URL/锚点/mailto；`<...>` 占位符；fenced 代码块内路径；`.claude/skills` 镜像；`docs/wayfinder/`；NOTICE 上游 URL。零星误报 → 校验器内硬编码小豁免登记表（首条登记：playwright 宿主路径 4 处），无行内 disable 机制 |
| Q3 `--strict` 挂载 | 死引用检查归 `--strict`（语义扩展为发布级完整性 = 禁占位符 + 强制 packageIntegration + 死引用零命中）；AGENTS.md 完成条件升 `--strict`（本仓纪律），plain 模式留消费者（无 package.json 场景）；packageIntegration 子项仅在 package.json 存在时强制、缺文件跳过——一份 AGENTS.md 双受众不冲突（**G9**）；测试锁直调验证函数不经 CLI 开关 |
| Q4 F4 = A 删 | capability-state 全链删除（清单见下） |
| Q5 验收四道 | 见下方验收清单 |

### 校验器扩展规格（执行期落 `ai-guidance-validation.mjs`）

- 新增导出 `validateDeadReferences(root, config)`（与 `validateLocalLinks` 并列；后者现仅扫 requiredFiles 约 10 文档，扩展为全量面）；`check-ai-guidance.mjs` 在 `--strict` 下调用。
- **扫描面**：根 `AGENTS.md`/`CLAUDE.md`/`README.md`/`CONTRIBUTING.md`、`docs/**/*.md`、`.agents/skills/**/*.{md,yaml,yml,json}`（**G7**：json 模板随技能迁入此层，实证含路径字符串）、`.toolkit/**/*.{mjs,json}`。
- **剔除清单单一事实源（G10）**：六项分发剔除清单落 toolkit.json v6 `distExcludes` 字段，校验器与打包器共读；文件缺失（消费者侧）回退内置默认。
- **判定与豁免**：按 Q1 三类 + Q2 豁免清单执行；自研扩展而非外链工具（lychee 等排除——零外部依赖约束，消费者须能直接跑）。
- **测试**：新用例直调 `validateDeadReferences`，含三类正反例 + 镜像豁免 + 宿主路径登记豁免 + 名册未命中。

### F4 删除清单（Q4-A；票 07 条目 #5/#12 落地）

1. `resources/docs/capability-state.json` — 删
2. `resources/.codex/templates/capability-state.template.json` — 删
3. `ai-guidance.config.mjs`：requiredFiles 条目（:25）+ `projectRecords.capabilities` 分支（:69）
4. `scripts/lib/ai-guidance-validation.test.mjs` 三处（:457, :466, :494）
5. 文档改线 6 处：resources/README.md :63/:236/:286 + CODEX_CAPABILITIES.md :144 → 改指 `docs/capabilities.md` 第 3 节
6. codex-capability-setup 技能内 6 处引用（SKILL.md:12、approval-input.md:10、status-model.md:3×2、install-policy.md:9 及镜像）随技能删除自然消失

已核实：manifest.json 由构建重生成、无孤儿问题；profile-state.json 归活着的 project-profile，均不随 F4 动。

### 验收清单（四道）

1. **测试道**：`node --test scripts/lib/*.test.mjs` 全绿（含新增死引用用例 + sync `--check` 用例）
2. **校验道**：`check-ai-guidance --strict` 零错（含死引用零命中）
3. **人工道**：AGENTS.md 入口表 + 路由表 + README 文档地图**抽查语义正确性**——存在性已由校验道覆盖，人工只核「指对了没」（G12）
4. **grep 道归零**：随发 **md/yaml/json**（排除 `.toolkit/scripts/`——执法者不自证，登记表与定位兼容分支含旧名字面量属正当，**G8**）内 `.codex/`、`resources/` 前缀、`CODEX_CAPABILITIES`、`capability-state`、`codex-capability-setup`、`$figma` 裸名命中 0（豁免：wayfinder 历史文档；镜像随同步自动清零；playwright 宿主路径 4 处登记豁免）
