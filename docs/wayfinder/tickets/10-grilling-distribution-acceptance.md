---
label: wayfinder:grilling
title: 分发与验收：本地命令 + release zip + 双宿主冒烟
status: closed
assignee: main-session
blocked-by: ["07-grilling-target-layout-spec"]
---

## Question

用户指令 Q7 裁定"A + C"：GitHub 上有 release zip，本地有一条命令。锁定：

1. **本地一条命令**：make-starter（或改造现有 build-starter.mjs）的接口——参数（目标目录）、排除清单（scripts/、toolkit.json、docs/wayfinder/、.git）、复制后校验（树完整性 + 校验器跑通）；扁平化后源根即仓库根的取舍。
2. **release zip**：打包触发（手动 vs git tag 触发 CI）、zip 内容 = 干净副本（同排除清单）、命名规范（版本号来源 toolkit.json）。
3. **双宿主冒烟验收清单**（执行期逐项核对，本票定清单）：
   - **Codex 完整性（硬约束，逐项可用）**：AGENTS.md 自动读取；`.agents/skills` 21 个技能（自研 5 + vendored 16，含 product-design 整包——票 08 修订二）全部可发现（新对话；figma 已移出，双路径接入见能力清单）；`$project-workflow` 路由、`$project-profile` init/profile/components/status/update、`$frontend-task` 页面任务流、宿主插件缺失时的文档降级路径（读取能力清单"宿主插件（可选）"节后智能体知道装什么）。
   - **Claude Code 尽力一等**：CLAUDE.md 桥（或 v2.1.277 AGENTS.md 回退）生效；`.claude/skills` 镜像无漂移（测试锁绿）；`/技能名` 可调用核心技能。
   - 两宿主各自的新会话冷启动冒烟（零外部下载前提下核心流程可走通）。
4. **验收即发布门槛**：冒烟清单全过 + 许可核实清零（zip 内含 LICENSE/NOTICE；每个第三方来源技能的许可证据在位或已按政策处置——见票 08 修订核实清单）才打 release zip。
5. **（俯瞰新增 F1）最小 CI = 防漂移执法**：无 CI 的生成镜像是已知失败模式（[starter-survey](../assets/starter-survey-research.md) 模式 3：执法差异化）。与第 2 条 zip 触发一并定：push/tag 时跑 `node --test` + 镜像 `--check` + check-ai-guidance；CI 管机器可断言项、冒烟管宿主观感项，分工写明。

产出：分发命令接口 + 打包流程 + 双宿主验收清单。

会话先调 Skill：`grilling` 与 `domain-modeling`。

## Resolution（2026-09-23，一轮五问全推荐 + 俯瞰四 H1–H5（H1 经俯瞰五 I2 修正）+ 俯瞰五 I1–I4，用户「推荐的来」×2）

### 决策表

| 决策面 | 裁决 |
|---|---|
| Q1 本地命令 | `node scripts/build-starter.mjs --target <目录>` 单参数**双语义**：空目录 = 干净副本；现有项目 = 安装/升级（三类文件契约见下）。无 `--zip`（zip 归 CI 通道）；剔除清单读 toolkit.json v6 `distExcludes`（缺失回退内置默认，G10） |
| Q2 zip 命名版本 | `ai-front-spec-v<version>.zip`；version = toolkit.json `version`（执行期随 v6 升 6.0.0）；git tag 名同值，CI 断言一致（防漂移） |
| Q3 触发 | git tag `v*` 触发发布——tag 即发布点、门槛机械执行；push(main) 只跑门不发版 |
| Q4 最小 CI（F1） | 单文件 `.github/workflows/ci.yml` 两触发：**push(main)** = 两门（`node --test scripts/lib/*.test.mjs`〔镜像 `--check` 已是测试锁用例〕+ `node .toolkit/scripts/check-ai-guidance.mjs --strict`）；**tag v\*** = 同两门 + tag↔version 断言 + build-starter 干净副本（含三连校验）+ zip + `gh release create` 附 artifact。ubuntu-latest 单 runner、node 22、纯 node 零安装秒级；action 仅官方 checkout/setup-node，第三方不引（H2）；tag job 声明 `permissions: contents: write`（I3——GITHUB_TOKEN 默认只读会挂）。分工线：机器可断言归 CI，宿主观感归冒烟 |
| Q5 冒烟 | 探针级 11 项、**用户本人执行**（副本 cwd、每宿主全新会话、零新增下载），逐项打勾，结果附 release notes（H5）；任一失败不打 release |

### 安装器三类文件契约（I1——防消费者数据丢失红线）

| 类 | 行为 | 成员 |
|---|---|---|
| ① 覆盖（starter 专有可再生） | 始终写入 | `.agents/`、`.claude/`、`.toolkit/` 专有件、静态规则 `docs/rules/AI_*.md`（状态类除外）、`docs/capabilities.md`、LICENSE/NOTICE |
| ② skip-if-present + 打印 | 已存在则跳过并打印 | 消费者/代理数据：`.toolkit/profile-state.json`、`docs/PROJECT_PROFILE.md`、`docs/rules/AI_COMPONENT_CATALOG.md`、`AI_FRONTEND_TASK.md`、`AI_TASK_CONTRACT.md`、`AI_PROJECT_STANDARDS.md`；入口三件：AGENTS.md / CLAUDE.md / README.md（已存在时） |
| ③ 排除 | 不复制 | distExcludes 六项 |

- skip-if-present 清单 = toolkit.json v6 `skipIfExists` 字段（与 `distExcludes` 并列，同一单一源思想）；执行期按「静态规则覆盖、状态数据跳过、入口跳过」原则逐文件归类。
- 升级路径 = 重跑安装器（②类自动保留）；README 记入口三件合并指引（如 AGENTS.md 追加入口表）。

### 校验条件化（I2，修正俯瞰四 H1）

- **干净副本模式**：复制后三连——树完整性断言（toolkit.json 清单驱动，替换硬编码 14 技能表）→ 副本上 `check-ai-guidance --strict`（distExcludes 回退默认；无 package.json 时 packageIntegration 跳过，G9——分发视角/死引用在副本上才是最有意义的执法点）→ 副本 `sync-mirror --check`（镜像零漂移）。
- **overlay 装入模式**：只打印落点/跳过清单即完（混合树上消费者内容会污染死引用道）；README 记一句「项目内自查跑 `.toolkit/scripts/check-ai-guidance.mjs`」（随装已在）。

### 冒烟清单（11 探针）

**Codex（硬约束，7）**：①AGENTS.md 生效——问「本项目代理入口要求」→ 答含入口表；②技能可发现——问「列出可用技能」→ 21 名全出（frontmatter 名，无 figma/ccs 残名；票 08 修订二计数）；③`$project-workflow` 路由一个小任务 → 走路由表；④`$project-profile status` → 读 `.toolkit/profile-state.json` 报状态；⑤`$project-profile components` → 读 `docs/rules/AI_COMPONENT_CATALOG.md`；⑥`$frontend-task` 起最小页面任务 → 流程骨架走通；⑦插件缺失降级——问「我要 figma 设计稿」→ 指 capabilities.md 双路径节，不装死。

**Claude Code（尽力一等，4）**：①CLAUDE.md 桥生效（能复述技能清单）；②`/project-profile` 可调用；③`/frontend-task` 可调用；④抽查镜像文件首行 AUTO-GENERATED 头在。

### 发布门槛（两级台阶，H3；H4 收口 G5）

1. **前置**：票 09 验收四道全绿（迁移完成的定义）；
2. **门槛**：CI 两门绿 + 冒烟 11 项过 + 许可核实清零（zip 内 LICENSE/NOTICE 在位、票 08 核实清单清零、**LICENSE 版权行已填**——G5 收口）→ 才打 tag 出 zip。

### 消费入口指引（I4）

README 首节一行：消费者拿 release zip 或本地命令产物；clone 仓库 = 开发贡献形态（见 CONTRIBUTING）。
