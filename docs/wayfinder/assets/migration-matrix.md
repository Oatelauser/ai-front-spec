# 目录重构引用失效迁移矩阵（枚举快照）

- 仓库：`D:\workspace\CC\ai-front-spec`，扫描时间 2026-09-23，只读枚举（后台子代理产出，主会话核收）。
- 计数单位：出现次数（occurrence，一行内多次命中分别计）；行号为样本（每文件最多 3 条）。
- 范围：`resources/` 全树 + 根 `scripts/` + 根 `README.md` + `toolkit.json`（根 `CLAUDE.md`/`AGENTS.md` 不存在，只有 resources/ 版）。
- 标注约定：【镜像】= `resources/.claude/skills/**`（自动再生成，改 `.agents` 源后同步即可）；【宿主】= 指向 Codex 宿主目录（`~/.codex/skills`、`.codex/config.toml` 等），与仓库内 `.codex/` 无关，**不受重构影响**；【FP】= 假阳性。
- 背景：`docs/wayfinder/`（重构规划文档自身）不在声明的扫描范围内，但含大量旧路径引用，单独列入「计划外引用」以防漏网。

---

## A. `.codex/` 引用（→ `.toolkit/`）

### A-总表（`.codex/<路径>` 完整路径引用；根/scripts + resources 非镜像 135 + 镜像 22 = 157，另裸 `.codex` 10）

| 文件 | 命中数 | 样本行号 |
|---|---|---|
| resources/README.md | 26 | 23, 37, 49（271–286 为文件索引密集区） |
| resources/.codex/ai-guidance.config.mjs | 11 | 17, 18, 83 |
| resources/.agents/skills/project-profile/SKILL.md | 9 | 31, 34, 39 |
| scripts/lib/ai-guidance-validation.test.mjs | 14 | 173, 192, 302 |
| scripts/lib/project-profile.test.mjs | 11 | 20, 21, 23 |
| resources/.codex/scripts/lib/ai-guidance-validation.mjs | 5 | 82, 103, 112 |
| scripts/lib/ai-guidance-validation.mjs | 5 | 82, 103, 577 |
| toolkit.json | 3 | 12, 13, 14 |
| README.md（根，dev 版） | 3 | 13, 14, 48 |
| scripts/build-starter.mjs | 3 | 35, 36, 37 |
| resources/.codex/templates/project-profile.react.md | 4 | 3, 28, 82 |
| resources/.codex/templates/project-profile.vue.md | 4 | 3, 28, 82 |
| resources/docs/PROJECT_PROFILE.md | 3 | 5, 26, 80 |
| resources/docs/AI_COMPONENT_CATALOG.md | 3 | 7（一行 3 处） |
| resources/.codex/templates/project-profile.generic.md | 3 | 7, 30, 85 |
| scripts/check-ai-guidance.mjs | 2 | 21, 22 |
| resources/.codex/scripts/check-ai-guidance.mjs | 2 | 21, 22 |
| scripts/lib/starter-builder.test.mjs | 2 | 19, 30 |
| resources/AGENTS.md | 2 | 17, 35 |
| resources/docs/AI_FRONTEND_TASK.md | 2 | 7, 9 |
| resources/.codex/profile-state.json | 1 | 30（指 `.codex/profile-proposal.json`） |
| resources/docs/AI_WORKFLOW_PRINCIPLES.md | 1 | 86 |
| resources/docs/AI_WEBVIEW_MOBILE.md | 1 | 40 |
| resources/.codex/templates/component-catalog.{template,react,generic,vue}.md | 各 1 | 9 / 8 / 8 / 8 |
| resources/.agents/skills/frontend-task/SKILL.md | 1 | 27 |
| resources/.agents/skills/codex-capability-setup/references/status-model.md | 1 | 3 |
| resources/.agents/skills/frontend-task/references/common-workflow.md | 1 | 67 |
| resources/.agents/skills/project-workflow/SKILL.md | 1 | 35 |
| resources/.agents/skills/frontend-task/references/subcommands.md | 2 | 5, 27 |
| resources/.agents/skills/project-profile/references/state-model.md | 2 | 3, 35 |
| resources/.agents/skills/project-profile/references/init-workflow.md | 1 | 32 |
| resources/.agents/skills/playwright/SKILL.md | 1【宿主】 | 41（`.codex/skills`） |
| resources/.agents/skills/playwright/references/cli.md | 1【宿主】 | 11 |
| resources/.agents/skills/figma/references/figma-mcp-config.md | 2【宿主】 | 3, 24（`.codex/config.toml`） |
| 【镜像】resources/.claude/skills/project-profile/SKILL.md | 9 | 31, 34, 39 |
| 【镜像】resources/.claude/skills/frontend-task/SKILL.md | 1 | 27 |
| 【镜像】resources/.claude/skills/frontend-task/references/subcommands.md | 2 | 5, 27 |
| 【镜像】resources/.claude/skills/frontend-task/references/common-workflow.md | 1 | 67 |
| 【镜像】resources/.claude/skills/project-profile/references/{state-model,init-workflow}.md | 2 / 1 | 3, 35 / 32 |
| 【镜像】resources/.claude/skills/project-workflow/SKILL.md | 1 | 35 |
| 【镜像】resources/.claude/skills/codex-capability-setup/references/status-model.md | 1 | 3 |
| 【镜像】resources/.claude/skills/playwright/{SKILL.md,cli.md} | 1+1【宿主】 | 41 / 11 |
| 【镜像】resources/.claude/skills/figma/references/figma-mcp-config.md | 2【宿主】 | 3, 24 |

**裸 `.codex`（无斜杠，共 10，其中 6 失效 / 4 宿主）**：

| 文件 | 命中数 | 行号 | 说明 |
|---|---|---|---|
| toolkit.json | 1 | 9 | runtime 数组 `".codex"` → 需改 `.toolkit` |
| scripts/check-ai-guidance.mjs | 1 | 12 | `['.codex','resources'].includes(basename(scriptParent))` 定位逻辑 → 需加 `.toolkit` 分支 |
| resources/.codex/scripts/check-ai-guidance.mjs（同文件副本） | 1 | 12 | 同上 |
| scripts/lib/ai-guidance-validation.test.mjs | 2 | 301, 325 | fixture 目录名 `'.codex'` + 遍历 `['resources','.codex']` |
| resources/README.md | 1 | 327 | "不要删除 `.codex` 状态" |
| resources/.agents/skills/playwright/SKILL.md + cli.md（源 + 镜像） | 2+2 | 37 / 6 | 【宿主】不受影响 |

### A 子类计数（scope 内出现次数）

| 子类 | 非镜像 | 镜像 | 总计 | 备注 |
|---|---|---|---|---|
| `.codex/scripts`（→ .toolkit/scripts） | 20 | 4 | 24 | 校验器调用点 |
| `.codex/templates`（→ 各技能 templates/） | 37 | 6 | 43 | 含目录泛指 `.codex/templates/` |
| `.codex/profile-state.json` | 34 | 8 | 42 | → `.toolkit/profile-state.json` |
| `.codex/ai-guidance.config.mjs` | 6 | 0 | 6+2(测试) | 根+resources 副本 |
| `.codex/manifest.json` | 9 | 0 | 11 | |
| `.codex/profile-proposal.json`（计划外状态文件，随 .codex 迁移） | 8 | 2 | 10 | |
| `.codex/` 目录泛指 | 6 | 0 | 6 | README 13/23/271 等 |
| 【宿主】`.codex/skills`、`.codex/config.toml` | 4 | 4 | 8 | 不受影响 |

## B. `resources/` 路径前缀引用

| 文件 | 命中数 | 样本行号 | 备注 |
|---|---|---|---|
| toolkit.json | 3 | 12, 13, 14 | profiles 三条 `resources/.codex/templates/project-profile.*.md` |
| scripts/lib/ai-guidance-validation.test.mjs | 2 | 333, 384 | fixture `'resources/toolkit.json'`、`sourceFiles` 集合 |
| scripts/build-starter.mjs | 1 | 56 | 报错文案 `resources/toolkit.json must point...`；另 9/55 行经 sourceRoot 依赖（见 K/L） |
| README.md（根） | 3 | 3, 57×2 | 57 链接 `resources/README.md` |
| resources/README.md | 2 | 3, 23 | 自述 `resources/` |
| resources/.agents/skills/codex-capability-setup/SKILL.md | 1 | 8 | `resources/docs/CODEX_CAPABILITIES.md`（随技能删除） |
| 【镜像】resources/.claude/skills/codex-capability-setup/SKILL.md | 1 | 8 | 同上 |
| resources/.agents/skills/gsap-core/SKILL.md | 1 | 114 | 【FP】`https://gsap.com/resources/getting-started/Staggers` 外部 URL |
| 【镜像】resources/.claude/skills/gsap-core/SKILL.md | 1 | 114 | 【FP】同上 |

scope 内合计 15（13 失效 + 2 FP）；docs/wayfinder 另有 51 处（见计划外）。

## C. `docs/AI_*` 与 `FRONTEND_CONVENTIONS` 引用

### C1 `docs/AI_`（→ `docs/rules/AI_`；scope 内 124 = 非镜像 88 + 镜像 36）

| 文件 | 命中数 | 样本行号 |
|---|---|---|
| resources/.codex/ai-guidance.config.mjs | 10 | 7–15（requiredFiles）、47, 48 |
| resources/README.md | 13 | 51, 67, 226–233（索引表） |
| resources/AGENTS.md | 6 | 16（一行 3 处）, 17, 19 |
| resources/.agents/skills/project-workflow/SKILL.md | 7 | 10, 15, 16 |
| resources/.agents/skills/project-profile/SKILL.md | 4 | 34, 39, 56 |
| resources/.agents/skills/frontend-task/references/requirement-workflow.md | 3 | 5（一行 2 处）, 84 |
| resources/.agents/skills/frontend-task/references/acceptance-matrix.md | 3 | 3（一行 2 处）, 9 |
| resources/.agents/skills/frontend-task/references/common-workflow.md | 3 | 7（一行 2 处）, 69 |
| resources/.agents/skills/frontend-task/SKILL.md | 1 | 27 |
| resources/.agents/skills/frontend-task/references/{api,figma,html,prototype,screenshot,subcommands}.md | 各 2 | api:5,82；figma:5,68；html:5,71 等 |
| resources/.agents/skills/project-profile/references/{update-policy,init-workflow}.md | 2 / 1 | 12, 16 / 23 |
| resources/.codex/templates/project-profile.{vue,react}.md | 2 / 2 | 7, 42 |
| resources/.codex/templates/project-profile.generic.md | 1 | 44 |
| resources/.codex/templates/component-catalog.template.md | 1 | 3 |
| scripts/lib/ai-guidance-validation.test.mjs | 8 | 22, 30, 61 |
| scripts/lib/project-profile.test.mjs | 6 | 66, 107, 111 |
| README.md（根） | 3 | 11（一行 2 处）, 50 |
| scripts/lib/ai-guidance-validation.mjs | 1 | 579（`docs/AI_COMPONENT_CATALOG.md` 特判分支） |
| 【镜像】project-workflow/SKILL.md | 7 | 10, 15, 16 |
| 【镜像】project-profile/SKILL.md | 4 | 34, 39, 56 |
| 【镜像】frontend-task/references/{acceptance,requirement,common}*.md | 3/3/3 | 同源文件 |
| 【镜像】frontend-task/references/{api,figma,html,prototype,screenshot,subcommands}.md | 各 2 | 同源文件 |
| 【镜像】frontend-task/SKILL.md、update-policy、init-workflow | 1/2/1 | 同源文件 |

### C2 `FRONTEND_CONVENTIONS`（→ `docs/rules/`；scope 内 17 + wayfinder 2 = 19）

| 文件 | 命中数 | 样本行号 |
|---|---|---|
| resources/.codex/templates/project-profile.vue.md | 3 | 23, 59, 63 |
| resources/.codex/templates/project-profile.react.md | 3 | 23, 59, 63 |
| resources/.codex/templates/project-profile.generic.md | 1 | 61 |
| resources/.codex/templates/component-catalog.{vue,react}.md | 1 / 1 | 29 |
| resources/.codex/ai-guidance.config.mjs | 1 | 16（requiredFiles） |
| resources/README.md | 2 | 234, 303 |
| resources/docs/PROJECT_PROFILE.md | 1 | 56 |
| resources/.agents/skills/frontend-task/references/common-workflow.md | 1 | 7 |
| resources/.agents/skills/frontend-task/references/screenshot-workflow.md | 1 | 5 |
| 【镜像】上两文件 | 1 / 1 | 7 / 5 |

## D. `CODEX_CAPABILITIES`（改名 → `docs/capabilities.md`；scope 内 22 + wayfinder 7 = 29）

| 文件 | 命中数 | 样本行号 |
|---|---|---|
| resources/README.md | 4 | 235, 298, 320 |
| resources/.codex/ai-guidance.config.mjs | 2 | 12（requiredFiles）, 62（capabilityRequirements.path） |
| resources/.agents/skills/project-workflow/references/task-routing.md | 2 | 5, 27 |
| resources/.agents/skills/codex-capability-setup/SKILL.md +【镜像】 | 2+2 | 8（各一行 2 处） |
| resources/.agents/skills/project-workflow/SKILL.md +【镜像】 | 1+1 | 13 |
| resources/AGENTS.md | 1 | 15（`docs/CODEX_CAPABILITIES.md` 链接） |
| resources/docs/AI_WORKFLOW_PRINCIPLES.md | 1 | 69 |
| scripts/lib/ai-guidance-validation.test.mjs | 4 | 26, 46, 75 |

## E. `codex-capability-setup`（被删技能；scope 内 29 + wayfinder 8 = 37）

| 文件 | 命中数 | 样本行号 |
|---|---|---|
| resources/README.md | 10 | 44, 63, 263–269（索引 7 行）, 320 |
| resources/.codex/ai-guidance.config.mjs | 5 | 35, 43, 44（requiredFiles 展开数组） |
| resources/docs/CODEX_CAPABILITIES.md | 3 | 24, 144（一行 2 处） |
| resources/.agents/skills/project-workflow/references/task-routing.md +【镜像】 | 1+1 | 25 |
| resources/.agents/skills/codex-capability-setup/SKILL.md +【镜像】 | 1+1 | 2 |
| resources/.agents/skills/codex-capability-setup/agents/openai.yaml +【镜像】 | 1+1 | 4 |
| toolkit.json | 1 | 27（skills 数组） |
| scripts/build-starter.mjs | 2 | 19（expectedSkills）, 41（requiredPaths） |
| scripts/lib/starter-builder.test.mjs | 1 | 22（expectedSkills 断言） |
| README.md（根） | 1 | 12 |

## F. `capability-state`（scope 内 19 + wayfinder 7 = 26）

| 文件 | 命中数 | 样本行号 | 目标 |
|---|---|---|---|
| resources/.codex/ai-guidance.config.mjs | 2 | 25, 69 | `docs/capability-state.json`（requiredFiles + projectRecords.capabilities） |
| resources/README.md | 3 | 63, 236, 286 | `docs/capability-state.json` ×2 + `.codex/templates/capability-state.template.json`（286） |
| resources/docs/CODEX_CAPABILITIES.md | 1 | 144 | `docs/capability-state.json` |
| resources/.agents/skills/codex-capability-setup/templates/approval-input.md +【镜像】 | 1+1 | 10 | `docs/capability-state.json` |
| resources/.agents/skills/codex-capability-setup/SKILL.md +【镜像】 | 1+1 | 12 | 同上 |
| resources/.agents/skills/codex-capability-setup/references/status-model.md +【镜像】 | 2+2 | 3 | `.json` + `.template.json` 各 1 |
| resources/.agents/skills/codex-capability-setup/references/install-policy.md +【镜像】 | 1+1 | 9 | `.json` |
| scripts/lib/ai-guidance-validation.test.mjs | 3 | 457, 466, 494 | `docs/capability-state.json`（projectRecords 断言） |

## G. figma 相关（删除技能 `resources/.agents/skills/figma/`）

### G-a `$figma` 裸调用（scope 内 18 + wayfinder 1 = 19+1）

| 文件 | 命中数 | 样本行号 |
|---|---|---|
| resources/docs/CODEX_CAPABILITIES.md | 8 | 35（一行 4 处）, 79, 118–121 |
| resources/.agents/skills/project-workflow/references/task-routing.md +【镜像】 | 4+4 | 15（一行 3 处）, 16 |
| resources/.agents/skills/figma/agents/openai.yaml +【镜像】 | 1+1 | 6（随技能删除，自然消失） |

### G-b `.agents/skills/figma` 路径

| 文件 | 命中数 | 行号 |
|---|---|---|
| scripts/build-starter.mjs | 1 | 47（requiredPaths `.agents/skills/figma/SKILL.md`） |
| resources/docs/CODEX_CAPABILITIES.md | 1 | 79（`$figma` 技能来源行） |

### G-c 技能名登记（删除后失效）

| 文件 | 命中数 | 行号 |
|---|---|---|
| toolkit.json | 1 | 33（skills 数组 `"figma"`） |
| scripts/build-starter.mjs | 1 | 25（expectedSkills `'figma'`） |

### G-d 插件引用-保留（`figma:figma-*` 与 `figma@openai-api-curated`，scope 内 21 + wayfinder 2 = 23，**不动**）

| 文件 | 命中数 | 样本行号 |
|---|---|---|
| resources/docs/CODEX_CAPABILITIES.md | 10 | 35（curated + 4 个 figma:figma-*）, 79, 118–121 |
| resources/.agents/skills/project-workflow/references/task-routing.md +【镜像】 | 4+4 | 15×3, 16 |
| resources/.agents/skills/frontend-task/references/figma-workflow.md +【镜像】 | 1+1 | 17 |
| resources/.codex/ai-guidance.config.mjs | 1 | 63（requiredMarkers `figma@openai-api-curated`） |

## H. `.codex/templates/<模板名>` 逐模板（scope 内 40 + wayfinder 17 = 57）

| 模板 | scope 内命中 | 文件（样本行号） | 去向 |
|---|---|---|---|
| project-profile.generic.md | 2 | toolkit.json:12；wayfinder 1 处 | project-profile/templates/ |
| project-profile.react.md | 1 | toolkit.json:13 | project-profile/templates/ |
| project-profile.vue.md | 5 | toolkit.json:14；tickets/02:45；research×3 | project-profile/templates/ |
| profile-proposal.template.json | 14 | scripts/lib/ai-guidance-validation.mjs:112,129；resources/.codex/scripts/lib 副本:112,129；project-profile.test.mjs:100；ai-guidance.config.mjs:19；resources/README.md（49,86 为其运行态 .json，非模板）；tickets/01:24、03:30、02:29；research:13,31,53,55；compatibility-matrix-draft:33 | project-profile/templates/ |
| component-catalog.template.md | 7 | pptest:20,78；README:281；config:20；AI_COMPONENT_CATALOG.md:7；ppSKILL:56×2【镜像含】 | project-profile/templates/ |
| component-catalog.presets.json | 8 | pptest:21,79；README:283；config:21；AI_COMPONENT_CATALOG.md:7；ppSKILL:56×2；research:170 | project-profile/templates/ |
| component-catalog.generic.md | 3 | config:22；ppSKILL:56×2（镜像含） | project-profile/templates/ |
| component-catalog.react.md | 5 | ai-guidance-validation.test:173,202；config:23；ppSKILL:56×2（镜像含） | project-profile/templates/ |
| component-catalog.vue.md | 4 | config:24；ppSKILL:56×2（镜像含）；research:170 | project-profile/templates/ |
| frontend-task.template.json | 3 | README:126,284；AI_FRONTEND_TASK.md:7 | frontend-task/templates/ |
| task-state.template.json | 1 | README:285 | frontend-task/templates/ |
| capability-state.template.json | 4 | README:286；tickets/07:84；ccs status-model.md:3×2 | 票 09 F4 裁决 = 删 |

## I. `.claude/skills` 提及（scope 内 8 + wayfinder 28 = 36）

| 文件 | 命中数 | 样本行号 | 备注 |
|---|---|---|---|
| resources/CLAUDE.md | 1 | 3 | "技能镜像位于 `.claude/skills/`"（运行时说明，拍平到根后仍成立） |
| scripts/lib/project-profile.test.mjs | 3 | 153, 159, 167 | 镜像字节一致性测试（镜像-自动再生成的守护测试） |
| resources/.agents/skills/compatibility-testing/SKILL.md | 2 | 24, 39 | 运行时说明 |
| 【镜像】resources/.claude/skills/compatibility-testing/SKILL.md | 2 | 24, 39 | 同上 |

## J. `design-taste-frontend` / `vercel-react-best-practices` / `taste-skill` / `react-best-practices`

| 名称 | scope 内命中 | 文件（样本行号） | wayfinder |
|---|---|---|---|
| design-taste-frontend | 4 | pp.vue:124；pp.react:124；CODEX_CAPABILITIES.md:71,115 | 2（tickets/08:18,35） |
| vercel-react-best-practices | 8 | pp.react:131；CC:73,124,139；common-workflow.md:61×2（agents+镜像）；task-routing.md:18×2 | 2（tickets/08:18,35） |
| taste-skill | 6 | CODEX_CAPABILITIES.md:71（一行 4 处）,161（一行 2 处） | 11（tickets/08 ×9、host-discovery ×2） |
| react-best-practices（独立出现） | 3 | CODEX_CAPABILITIES.md:73×2,163 | 6（tickets/08） |

注：这些是外部 Skill/插件名（能力清单与模板推荐值），引用本身不因目录重构失效，但随 `CODEX_CAPABILITIES.md` 改名/重组需整体迁移，且按票 08 锚点一律归一为 frontmatter 名（taste-skill / react-best-practices）。

## K. `toolkit.json` sourceRoot / copyContentsToProjectRoot

| 文件 | 命中数 | 样本行号 | 说明 |
|---|---|---|---|
| toolkit.json | 1+1 | 7 (`"sourceRoot": "resources"`), 8 (`"copyContentsToProjectRoot": true`) | sourceRoot 需改为 `.`（或删除字段）；copyContents 语义随拍平改变 |
| scripts/build-starter.mjs | 10 | 9, 55（`!== 'resources'` 硬编码校验）, 59–82 | 读 manifest.starter.sourceRoot 并 cp 整树 → 改为根分发后需排除 scripts/、toolkit.json、docs/wayfinder 等 |
| scripts/lib/project-profile.test.mjs | 2 | 9, 13 | 读 sourceRoot 定位 starterRoot + 断言 copyContentsToProjectRoot=true |

## L. `build-starter` 与 `*.test.mjs` 对 resources/ 与 .codex/ 的路径依赖

| 文件 | 依赖点 | 行号 |
|---|---|---|
| scripts/build-starter.mjs | sourceRoot='resources' 硬校验；requiredPaths 逐一断言 `.codex/{manifest,profile-state,ai-guidance.config}`、`.agents/skills/codex-capability-setup/SKILL.md`、`.agents/skills/figma/SKILL.md`、`docs/PROJECT_PROFILE.md`；整树 `cp()` 到目标根 | 9, 31–52（35–37, 41, 47）, 55, 61, 81 |
| scripts/lib/starter-builder.test.mjs | 复制后断言 `.codex/manifest.json`、expectedSkills 含 codex-capability-setup、执行副本 `.codex/scripts/check-ai-guidance.mjs` | 19, 22, 30 |
| scripts/lib/project-profile.test.mjs | starterRoot 下 `.codex/templates/component-catalog.*`、`.codex/profile-state.json`、`.codex/manifest.json`、`docs/AI_{COMPONENT_CATALOG,FRONTEND_TASK,WEBVIEW_MOBILE,COMPATIBILITY_MATRIX}.md`、`.codex/templates/project-profile.*`、AGENTS 路由行正则；镜像一致性测试 | 20–23, 30, 55–66, 78–84, 100–115, 129–141, 150–169 |
| scripts/lib/ai-guidance-validation.test.mjs | fixture 构造 `.codex/ai-guidance.config.mjs`、`.codex/templates/component-catalog.react.md`、`.codex/profile-state.json`、`.codex/manifest.json`、`docs/capability-state.json`；CLI 定位循环 `['resources','.codex']`；`resources/toolkit.json` fixture | 173–227, 301–302, 325–333, 419–494 |
| scripts/lib/ai-guidance-validation.mjs | 默认值 `'.codex/profile-state.json'`(82,410)、`'.codex/profile-proposal.json'`(103)、`'.codex/templates/profile-proposal.template.json'`(112)、前缀特判 `file.startsWith('.codex/templates/')`(577)、`docs/AI_COMPONENT_CATALOG.md`(579) | 82, 103, 112, 410, 577–579 |
| scripts/check-ai-guidance.mjs（根） | `['.codex','resources']` 定位分支；默认配置 `.codex/ai-guidance.config.mjs` | 12, 21–23 |

## M. resources/{AGENTS,CLAUDE,README}.md 中的失效引用汇总

| 文件 | 失效引用（→ 改法） | 行号 |
|---|---|---|
| resources/AGENTS.md | `docs/CODEX_CAPABILITIES.md`×1（D）；`docs/AI_{FRONTEND_TASK,COMPONENT_CATALOG,TASK_CONTRACT,WEBVIEW_MOBILE,PROJECT_STANDARDS}`×6（C）；`.codex/profile-state.json`×1、`.codex/scripts/check-ai-guidance.mjs`×1（A）；`docs/PROJECT_PROFILE.md`×4 **路径不变-不失效** | 15–20, 26, 35 |
| resources/CLAUDE.md | `@AGENTS.md` 导入（拍平后同在根-不失效）；`.claude/skills/` 说明（不失效） | 1, 3 |
| resources/README.md | `.codex/`×26（A）；`docs/AI_`×13 + FRONTEND_CONVENTIONS×2（C）；CODEX_CAPABILITIES×4（D）；codex-capability-setup×10（E）；capability-state×3（F）；`resources/`×2（B）；`docs/PROJECT_PROFILE.md`×6 不失效 | 23–96, 126, 226–236, 263–286, 295–320, 334–337 |

## 计划外引用（防漏网）

1. **`resources/docs/capability-state.json` 文件本身无迁移目的地** — 重构清单第 1 条只列了 AI_*.md ×8、FRONTEND_CONVENTIONS、CODEX_CAPABILITIES、PROJECT_PROFILE；该文件在 `ai-guidance.config.mjs` requiredFiles(25)、projectRecords.capabilities(69)、README:236 索引、ccs 技能 4 处、测试 3 处均按 `docs/capability-state.json` 引用。且技能 `codex-capability-setup` 删除后无人写它 → 去留归票 09 F4（裁决：删）。
2. **`.codex/profile-proposal.json`**（运行态文件，非模板）— 10 处引用（A 表内），随 `.codex/` → `.toolkit/` 迁移，不在模板分发清单中，易漏（validation.mjs:103 硬编码路径）。
3. **裸 `AI_*.md` 文件名引用（无 `docs/` 前缀）**，文件移入 `docs/rules/` 后同样失效但不匹配 C 模式：resources/docs/PROJECT_PROFILE.md:129、AI_WORKFLOW_PRINCIPLES.md:49、AI_FRONTEND_TASK.md:3,9、AI_COMPATIBILITY_MATRIX.md:16、`.codex/templates/profile-proposal.template.json`:30、根 README.md:10；README:334–337 的旧名映射表含 `CODEX_CAPABILITIES.md` 旧名条目。
4. **`docs/wayfinder/`（重构规划文档自身）** — 不在声明范围但 git 已跟踪，含约 160+ 处旧路径引用（`resources/`×51、`.codex/`×40+、`docs/AI_`×16、模板名 ×17、E×8、F×7、J×21、`.claude/skills`×28、`.toolkit`/`docs/rules` 新名 ×35），重构落地后全部过期。属"计划自身快照"，单列豁免、不改写。
5. **`scripts/check-ai-guidance.mjs:12` 的目录名逻辑依赖**（`['.codex','resources']`）— 非文件引用而是行为依赖，`.toolkit` 与根拍平都需要新分支（A-bare 已计，此处强调易漏）。
6. **`.claude` runtime 登记项** — toolkit.json:9 runtime 数组含 `".claude"` 与 `".codex"` 两项，`.codex` 需改 `.toolkit`（A-bare 已计 `.codex`；`.claude` 项不受影响）。
7. **`.serena/`**（未跟踪的本地工具状态目录）存在于仓库目录，未纳入扫描（非 git 文件）。
8. 排除的假阳性：gsap-core SKILL.md:114 `gsap.com/resources/...` 外部 URL ×2；`manifest.toolkit?.[key]`（ai-guidance-validation.mjs:472、test:385）是 JSON 字段名，非 `.toolkit/` 目录引用。
9. **不失效确认**：所有 `docs/PROJECT_PROFILE.md` 引用（AGENTS、README、模板、toolkit.json profileTarget、测试）目标路径重构后不变；`.agents/skills/**` 引用拍平后相对关系不变（除被删技能）。

## 总览表

| 模式 | scope 内文件数 | scope 内总命中 | 其中镜像命中 | wayfinder（范围外） | 主要改写点 |
|---|---|---|---|---|---|
| A `.codex/`（含子类） | 38 | 167（157 路径 + 10 裸；宿主 12 不受影响） | 26 | 50 | 全局 `.codex`→`.toolkit`；check 脚本定位逻辑 |
| B `resources/` 前缀 | 8 | 15（FP 2） | 2 | 51 | toolkit.json profiles、测试 fixture、根 README |
| C `docs/AI_` + FRONTEND_CONVENTIONS | 27+11 | 124 + 17 | 36 + 2 | 16+2 | 前缀改 `docs/rules/`；config requiredFiles |
| D CODEX_CAPABILITIES | 10 | 22 | 4 | 7 | 改 `docs/capabilities.md`（AGENTS/CC/config/test） |
| E codex-capability-setup | 13 | 29 | 4 | 8 | toolkit/build-starter/测试清单 + config requiredFiles + task-routing |
| F capability-state | 9 | 19 | 6 | 7 | 删除 + 改线 capabilities.md 第 3 节（票 09 F4） |
| G figma（技能删除） | 9 | 技能引用 18+2+2（$调用/路径/登记） | 8 | 3 | toolkit/build-starter/CC:79/task-routing；插件引用 23 处保留 |
| H 模板名（逐个） | 12 | 40 | 12 | 17 | toolkit profiles、config、验证器/测试、README 索引 |
| I `.claude/skills` | 4 | 8 | 2 | 28 | 仅镜像测试与说明（自动再生成） |
| J 四个名称 | 7 | 21 | 4 | 21 | 随 CC 文档重组迁移，归一 frontmatter 名 |
| K sourceRoot/copyContents | 3 | 14 | 0 | 5 | toolkit.json + build-starter 语义重写 |
| L 构建/测试路径依赖 | 6 | 见 L 节（约 60 处断言/路径） | 0 | — | 全部 fixture 与 requiredPaths 重写 |
| M 三份入口文档 | 3 | AGENTS 9 / CLAUDE 0 / README 60 | 0 | — | 随 A–F 同步改写 |

**镜像占比提示**：C1 29%、A 17%、E/F/G 14–29% 的命中位于 `resources/.claude/skills/` 镜像 — 修改 `.agents` 源后由镜像同步流程（project-profile.test.mjs:150 守护）自动再生成，无需手工双改；但 build-starter/ toolkit.json/ scripts/ 下的引用必须手工改写。
