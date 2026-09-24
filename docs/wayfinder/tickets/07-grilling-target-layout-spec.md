---
label: wayfinder:grilling
title: 终态目录规格：扁平根 + 单源镜像 + .toolkit 归置
status: closed
assignee: main-session
blocked-by: ["06-prototype-rebuild-vs-refactor"]
---

## Question

锁定终态目录规格（改造的靶子或新仓的骨架）。依 [host-discovery-research.md](../assets/host-discovery-research.md) 的事实与已锁决策，需定：

1. **扁平根布局**：AGENTS.md / CLAUDE.md / README.md / docs/ / .agents/skills/ / .claude/skills/ / .toolkit/ / scripts/（开发件）的完整目录树终态图；开发件排除清单（scripts/、toolkit.json、docs/wayfinder/）。
2. **`.claude/skills` 机器镜像机制**：同步脚本落点（`scripts/` vs `.toolkit/scripts/`）、AUTO-GENERATED 文件头格式、测试锁形式（沿用现有逐字节同步测试改造，还是 `--check` 模式）；参考 prisma 的 gitignore+物化 与本仓入库+测试锁两种形态的取舍（目标项目无 node 环境，镜像必须实体随分发）。
3. **CLAUDE.md 一行桥去留**：v2.1.277 起无 CLAUDE.md 时原生读 AGENTS.md，但旧版/Bedrock/Vertex 不支持——保留一行桥（`@AGENTS.md` + `$技能名`→`/技能名` 说明）还是删除依赖回退。
4. **`.toolkit/`（原 `.codex/`）内容归置**：manifest.json / profile-state.json / templates/ / scripts/check-ai-guidance.mjs 逐项去留与改名；`docs/capability-state.json` 的归属。
5. **能力清单文档改名与重组**：CODEX_CAPABILITIES.md 改中性名；独立 Skill 节全部改"本 Starter 内置"（vendored 后零安装命令）；保留"宿主插件（可选）"节（product-design、figma 的宿主安装说明，承接用户裁定）；"宿主内置插件"核对节承接 `codex-capability-setup` 删除后的残余职能。
6. **`codex-capability-setup` 删除后的路由改线**：AGENTS.md 强制入口表、project-workflow 的 task-routing、README 的引用点逐处去向。

产出：目录树终态图 + 每个移动/删除/改名条目的清单（供「文档迁移矩阵」与「vendoring 细则」消费）。

会话先调 Skill：`grilling` 与 `domain-modeling`。

## Resolution（2026-09-23，六问全按推荐，含走查修正 ×3）

终态目录规格锁定（改造 in-place 的靶子）。关票前全局走查（消费者拷贝→双宿主加载→维护者改技能→分发剔除四条流）产出三修正：**sync-mirror 随发**（镜像头指引消费者跑的脚本必须存在于分发物，否则消费侧镜像必然漂移）、**CONTRIBUTING.md 分流 dev README**（开发面内容不混消费面）、**manifest.json 内容重生成**（非纯移动）。

### 终态目录树

```
<repo-root>/                            ← 仓库根 = starter 本体 = 分发根
├── AGENTS.md                           ← 代理入口；路由五路：docs/rules · .agents/skills ·
│                                          .toolkit/scripts/check-ai-guidance · docs/capabilities.md
├── CLAUDE.md                           ← 3 行桥保留（@AGENTS.md + /技能名 说明）
├── README.md                           ← = 原 resources/README.md(339行) 改造，纯消费视角
├── CONTRIBUTING.md                     ← 新建：原根 dev README(86行) 去处；仅开发，分发剔除
├── toolkit.json                        ← 仅开发（分发剔除）；v6：sourceRoot 语义消除
├── LICENSE / NOTICE                    ← 新建（条款/草案归票 08）
│
├── docs/
│   ├── rules/                          ← AI_*.md × 8 + FRONTEND_CONVENTIONS.md（规则层一体）
│   ├── capabilities.md                 ← 原 CODEX_CAPABILITIES.md 三段重组（见下）
│   ├── PROJECT_PROFILE.md              ← 画像种子位，docs 根
│   └── wayfinder/                      ← 过程文档，仓内隔离，分发剔除
│
├── .agents/skills/                     ← 唯一人工源；21 技能 = 13 项目 + 8 vendored
│   └── <技能>/templates/…              ← 模板随技能走，自动进镜像机制
│
├── .claude/skills/                     ← 机器镜像（AUTO-GENERATED 头 + 同步器 + 测试锁）
│
├── .toolkit/                           ← 随发运行时（平铺，无 state/ 子目录）
│   ├── ai-guidance.config.mjs / manifest.json / profile-state.json
│   └── scripts/
│       ├── check-ai-guidance.mjs
│       ├── sync-mirror.mjs             ← 随发（走查修正 1）：默认同步、--check 供测试锁与 CI
│       └── lib/ai-guidance-validation.mjs
│
├── scripts/                            ← 仅开发（分发剔除）：*.test.mjs + build-starter.mjs（打包器）
└── .serena/                            ← 仅开发，剔除
```

### 镜像机制规格

- 同步器 `.toolkit/scripts/sync-mirror.mjs`：默认同步、`--check` 模式供测试锁与 CI（同一代码路径）；二进制资源（png 等）整树复制。
- 头格式：YAML frontmatter **之后**一行 HTML 注释（frontmatter 必须行 1 起，双宿主可解析）：
  `<!-- AUTO-GENERATED from .agents/skills/<name>. DO NOT EDIT. Run: node .toolkit/scripts/sync-mirror.mjs -->`
- 测试锁：根 `scripts/lib/`（dev）新增测试调 sync `--check`；CI（票 10）同一入口。

### 移动 / 删除 / 改名条目清单（票 09 矩阵与票 08 接线的消费源）

| # | 现状 | 终态 | 操作 |
|---|---|---|---|
| 1 | `resources/{AGENTS,CLAUDE,README}.md` | 根三级 | 拍平上移（README 改造为纯消费视角） |
| 2 | `resources/docs/AI_*.md ×8` + `FRONTEND_CONVENTIONS.md` | `docs/rules/` | 移动 |
| 3 | `resources/docs/CODEX_CAPABILITIES.md` | `docs/capabilities.md` | 改名 + 三段重组 |
| 4 | `resources/docs/PROJECT_PROFILE.md` | `docs/PROJECT_PROFILE.md` | 移动 |
| 5 | `resources/docs/capability-state.json` | — | **票 09 F4 裁**（删或并入 capabilities.md） |
| 6 | `resources/.agents/skills/`（14 技能） | `.agents/skills/` | 上移；**删 codex-capability-setup**（→13） |
| 7 | `resources/.claude/skills/` | `.claude/skills/` | 清空，同步器重建带 AUTO-GENERATED 头 |
| 8 | `resources/.codex/{ai-guidance.config.mjs, manifest.json, profile-state.json}` | `.toolkit/` 平铺 | 移动；**manifest.json 内容须重生成**（走查修正 3：目录改名+模板迁走后清单数据失效） |
| 9 | `resources/.codex/scripts/check-ai-guidance.mjs` + `lib/ai-guidance-validation.mjs` | `.toolkit/scripts/` | 移动 |
| 10 | 根 `scripts/lib/ai-guidance-validation.mjs`（零差异拷贝） | — | **删除**（分家消灭重复） |
| 11 | `resources/.codex/templates/` ×10 | 各 `<技能>/templates/` | 随技能走：project-profile ×3 + profile-proposal + component-catalog ×6 → `project-profile/templates/`；frontend-task + task-state → `frontend-task/templates/`（逐文件消费方以票 09 矩阵枚举为准） |
| 12 | `resources/.codex/templates/capability-state.template.json` | — | **票 09 随 F4 裁** |
| 13 | 根 `scripts/*.test.mjs` + `build-starter.mjs` | 留根 `scripts/` | 留守；build-starter 转职打包器（接口归票 10） |
| 14 | 根 `README.md`（86 行 dev 版） | `CONTRIBUTING.md` | **分流（走查修正 2）**：dev 内容进 CONTRIBUTING（仅开发、分发剔除）后删除 |
| 15 | `toolkit.json` v5 | v6 | `sourceRoot/copyContentsToProjectRoot` 语义消除（根即本体）；skills 清单 13+8（票 08 接线） |
| 16 | —（新建） | `LICENSE`、`NOTICE`、`.toolkit/scripts/sync-mirror.mjs`、`CONTRIBUTING.md`、镜像测试锁 | 票 08 / 本票规格 / 执行期 |
| 17 | AGENTS.md 入口表 codex-capability-setup 行、project-workflow task-routing、README 引用点 | 全部指向 `docs/capabilities.md` 第 3 节 | 路由改线（去向唯一） |

### 能力清单文档（docs/capabilities.md）三段结构

1. **本 Starter 内置**——vendored + 项目技能合一清单，零安装命令（原"独立 Skill"节整体改写）；
2. **宿主插件（可选）**——product-design、figma 等需在宿主 marketplace 安装的说明；
3. **宿主内置插件核对**——承接 codex-capability-setup 删除后的只读审计残余职能。

### 配套字符串改写批（票 09 sed 种子）

`.codex/`→`.toolkit/`（171 处）· `resources/` 前缀消除 · `docs/AI_`→`docs/rules/AI_` · `.codex/templates/`→各技能模板路径 · `CODEX_CAPABILITIES`→`capabilities`。

### 分发剔除清单（票 10 消费）

`scripts/`、`toolkit.json`、`docs/wayfinder/`、`.serena/`、`CONTRIBUTING.md`、`.git`

### 让渡

- #5/#12（capability-state 两件）→ 票 09 F4；
- vendored 命名前缀（俯望建议：从 karpathy-guidelines 无前缀先例，归属由 NOTICE 承担）→ 票 08。
