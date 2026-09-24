---
label: wayfinder:map
title: 自包含双宿主 Starter（零外部下载改造/重做）
status: closed
---

## Destination

一份零决策留白的锁定规格：ai-front-spec 成为"拷贝即用、零外部 skill/plugin 下载"的前端规则 Starter——8 个外部独立 Skill vendored 入库；Codex 插件降级为文档说明的宿主可选安装；`.agents/skills` 为唯一人工维护源 + `.claude/skills` 机器镜像；目录扁平化、`.codex`→`.toolkit`；分发 = 本地一条命令 + GitHub release zip。硬约束：**Codex 功能完整性不降级，Claude Code 尽量一等公民**。改造 or 重做由去锚定评估裁决（票 06）；规格可直接执行（执行在图外）。

## Notes

- 域：AI 前端开发规则工具包（frontend-project-starter，toolkit.json v5.0.0）。本地 markdown tracker：`tickets/` 每票一文件，front matter 记 `label/status/blocked-by/assignee`；本图票号 06–10（01–05 属已关闭的上张图 `MAP.md`）。
- 每个决策票会话先调用 Skill：`grilling` 与 `domain-modeling`；研究票用 `research`。
- 硬约束（用户 2026-09-23 两度强调）：**必须保证 Codex 功能完整性，Claude Code 尽量适配**——无法完整移植处可降级，但必须文档说明降级路径。
- 站位偏好：用户明确担心"现状锚定判断、打乱思路"——所有结构决策**先做 greenfield 草图**（只从需求 + 业界模式出发，不翻现状目录），再与现状 diff。
- 制图期已完成的研究（已入 `assets/`，票内直接引用，不再开研究票）：
  - [host-discovery-research.md](assets/host-discovery-research.md)：双宿主技能/插件发现机制（源码级核实）——Codex 只扫 `.agents/skills`，Claude Code 只扫 `.claude/skills`，无共享目录；Claude Code v2.1.277（2026-09-18）起无 CLAUDE.md 时原生读 AGENTS.md；Codex 插件 = plugin.json + skills/，仅 marketplace 安装（本地/git marketplace 可近似 vendor 但需 config.toml 注册）；四上游仓库许可（anthropics/skills 为混合许可仓）。
  - [starter-survey-research.md](assets/starter-survey-research.md)：7 个可借鉴项目——规范根 + 宿主薄适配是主流形态（ECC/agentic-stack/prisma）；镜像成败在防漂移执法（CI `--check`/测试锁），不在生成；vendor 许可惯例 = NOTICE + 保留原许可（agentic-stack 典范）。
- 制图前已锁定的决策（预图片段，grilling 2026-09-23，不再开票）：
  - 终点 = 锁定规格，执行图外（Q1）
  - 双宿主定位：Codex 完整性硬约束 + Claude Code 尽量一等（Q3）
  - 插件不平移不替代：能力清单文档保留"宿主插件（可选）"节，说明需在 Codex 宿主安装及用途；github 插件忽略（用户改用 github MCP）（Q4 + 用户补充裁定）
  - `resources/` 扁平化到仓库根，hub 根 ≈ starter 本体（Q5）
  - `.codex` 更名 `.toolkit`（Q6）
  - 分发 = 本地一条命令出干净副本（A）+ GitHub release zip（C）（Q7）
  - skills：`.agents/skills` 唯一人工编辑源 + `.claude/skills` 机器生成镜像（AUTO-GENERATED 文件头）+ 测试锁防漂移（Q8；物理单目录被研究证实不可能双宿主同读）
  - `codex-capability-setup` skill 删除：残余职能（宿主内置能力核对、插件连接引导）进文档 + 路由引用（Q9）
- 俯瞰复核（2026-09-23，票 06 关闭后全局过图）：骨架决策（镜像方向/扁平化/单入口/改造裁决）复核成立；新增遗漏点已归票——F1 最小 CI→票 10、F2 仓自身许可→票 08、F4 capability-state.json 去留→票 09、F5 落点判据"随发 vs 仅开发"与 F7 CLAUDE.md 桥建议保留→票 07。两权衡记录在案：clone 带过程文档噪音而 zip 干净 = Q3/Q7 下接受的权衡（F6）；执行顺序 = 结构迁移（拍平+改名+docs/rules/ 子目录化，一次 sed 批）→ 镜像自动化 → vendoring → 技能删除+文档迁移 → 分发打包，避免 vendored 二次搬家（F8，图外提示）。
- 俯瞰复核二（2026-09-23，票 08 关闭后）：骨架（改造裁决/镜像/双路径/8 技能 vendor）复核成立。**G1 实质遗漏**：在库 6 技能（gsap ×3 / apple-design / compatibility-testing / mobile-ux-optimizer，20260917 经 elms-h5 技能包迁入，commit a0a5921）从未过许可审计——经溯源（包内 manifest/README + 上游定位 + LICENSE 实取）**六技能全 MIT、零重写零移除**（greensock/gsap-skills、proffesor-for-testing/agentic-qe、erichowens→curiositech/some_claude_skills、emilkowalski/skills）→ 票 08 修订节补 NOTICE 4 行 + G2 执行规则；计数修正 20 = 5 自研 + 15 vendored。G2 执行规则：上游有 LICENSE 文件则拷入技能目录。G3 票 10 验收计数与发布门槛已同步修正（20 技能 + 许可核实清零）。G4 词表补「MCP 直连」。G5 LICENSE 版权行执行期用户填。
- 俯瞰复核三（2026-09-23，票 09 关票前）：骨架复核成立；七项收紧全采纳——G6 反引号路径锚定规则（结构性排除 vendored 示例路径误报）、G7 扫描面补 `.agents/skills/**/*.json`、G8 grep 道排除执法者自身、G9 strict 无 package.json 时 packageIntegration 跳过、G10 分发剔除清单单一事实源 toolkit.json `distExcludes`、G11 矩阵时效注记、G12 人工道收窄语义抽查。
- 俯瞰复核四/五（2026-09-23，票 10 关票前后）：H1–H5（副本校验升 strict〔经 I2 修正为仅干净副本模式〕/ gh CLI 替第三方 release action / 票 09 四道→票 10 门槛两级台阶 / G5 LICENSE 版权行入门槛 / 冒烟记录附 release notes）+ I1–I4（**安装器双语义与三类文件契约**——覆盖/skip-if-present/排除，`skipIfExists` 入 toolkit.json v6，防消费者画像数据丢失；校验三连仅干净副本；CI `permissions: contents: write`；README 首节 clone=开发形态指引）。终审：骨架无新矛盾，无更优替代。
- **图收口（2026-09-23）**：五票（06–10）全闭，规格完整可执行。执行图外，按 F8 顺序消费票 07（终态树/镜像）→ 08（vendoring/许可）→ 09（迁移矩阵/校验器）→ 10（安装器契约/CI/冒烟）产出；执行完成判据 = 票 09 验收四道 + 票 10 发布门槛。
- **图收口后补充裁定（2026-09-23，票 08 修订二）**：product-design 插件改判**整包 vendor**（原「宿主插件可选不入库」单项作废）——它无公开源码/许可（private:true 默认全保留）亦无 MCP 替代路径（CC 缺口根源），用户两度裁定自用接受、NOTICE 如实记「公开发布前需重审」；整包原样 + 顶层自写薄路由 SKILL.md，计数 **21 = 5 自研 + 16 vendored**（票 07/09/10 计数点同步）。figma 裁定不变。
- 词表（本图域内术语）：
  - **项目 Skill**：随 starter 分发于 `.agents/skills`，无需安装。
  - **vendored Skill**：从上游仓库复制入库的第三方 skill（NOTICE 标注、保留原许可）。
  - **宿主插件**：仅能经宿主 marketplace 安装的聚合体（plugin.json + skills/ + 可选 MCP），文档降级说明，可选。
  - **机器镜像**：`.claude/skills` 由脚本生成、禁止手编（文件头 AUTO-GENERATED）。
  - **MCP 直连**：不经宿主 marketplace、直接配置 MCP server 接入外部能力——跨宿主路径，Claude Code 的唯一外部能力接入方式（与「宿主插件」相对）。

## Decisions so far

- **票 10（2026-09-23 关闭）：分发与验收锁定**。本地命令 `build-starter.mjs --target` 双语义（空目录=干净副本 / 现有项目=安装升级）+ 三类文件契约（覆盖 / skip-if-present〔`skipIfExists` 入 toolkit.json v6〕/ distExcludes 排除——防消费者画像数据丢失）；校验三连（树完整 + strict + 镜像 `--check`）仅干净副本模式；zip = `ai-front-spec-v<version>.zip`（版本单一源 toolkit.json，tag 同值 CI 断言）；tag `v*` 触发 CI 发布（单 workflow：push 两门 / tag 加 build+zip+`gh release create`，仅官方 action + `permissions: contents: write`）；冒烟 11 探针用户执行、结果附 release notes；发布门槛 = 票 09 四道绿 →（CI 两门 + 冒烟 + 许可清零含 LICENSE 版权行）。README 首节记 clone=开发形态。
- **票 09（2026-09-23 关闭）：文档迁移矩阵 + 死引用执法锁定**。全量矩阵入 `assets/migration-matrix.md`（scope 内约 370 处失效引用、38 文件；镜像占 17–29% 禁手工双改、宿主路径 8 处不随 sed（playwright 4 处入登记豁免）、figma 插件引用 23 处保留、`$design-taste-frontend` 等别名 21 处归一 frontmatter 名；计划外引用 9 项逐条裁决）。死引用判定三类（md 链接 + 锚定反引号 / .mjs·.json 路径型字面量 / `$name`↔frontmatter 名册）+ 分发视角；结构豁免 + 登记制小表；死引用挂 `--strict`（AGENTS.md 完成条件升 strict，无 package.json 自动跳过该子项）；F4 = capability-state 全链删除（六条清单，票 07 #5/#12 落地）；验收四道（测试 / 校验 / 人工语义抽查 / grep 归零排除执法者）。剔除清单单一事实源 = toolkit.json v6 `distExcludes`。
- **票 08（2026-09-23 关闭）：vendoring 细则锁定**。8 技能许可逐个核实全数入库（frontend-design 目录内 Apache-2.0 LICENSE.txt 落地悬点；web-design-guidelines 内容源仓有 LICENSE=MIT，核实升级研究结论）；拷贝源 = 本机快照 + NOTICE 溯源（上游 URL/快照日期/许可证据/修改记录）+ capabilities.md 记「来源与更新」与宿主插件双路径装更；命名锚点 = frontmatter name（目录保持上游原样，清单跟随）；仓许可 MIT + NOTICE 边界声明（vendored 不再许可）。**figma 不入库**（Developer Terms 无再分发权）→ c′：删 + MCP 直连用法自写并入自有 figma-workflow.md，双路径接入（Codex 插件主路径 / MCP 直连 = CC 唯一路径）。web-design-guidelines 连带 command.md 本地化（零外部下载贯彻到使用期）；安装模式坍缩「宿主插件可选」单维。修正票 07：技能总数 21→**20**（俯瞰二再修正为：自研 5 + vendored 15——elms-h5 链 6 件改判 vendored，修订节记载；图收口后修订二再修正为 **21 = 5 + 16**，product-design 整包 vendor）。NOTICE 草案 + 接线清单入票内（票 09 消费源）。
- **票 07（2026-09-23 关闭）：终态目录规格锁定**。扁平根终态树 + 17 条移动/删除/改名清单（票 09/08 消费源）。要点：分家判据"随发 vs 仅开发"且 **sync-mirror.mjs 随发**（`.toolkit/scripts/`，走查修正：镜像头指引消费者跑的脚本必须在分发物内）；模板随技能走进 `<技能>/templates/`（自动进镜像）；CLAUDE.md 3 行桥保留；`docs/rules/` 子目录 + `capabilities.md` 三段重组（路由改线唯一去向 = 第 3 节）；dev README 分流 `CONTRIBUTING.md`；镜像头 = frontmatter 后一行 HTML 注释，测试锁与 CI 共用 sync `--check`。08/09/10 解除阻塞。
- **票 06（2026-09-23 关闭）：改造 in-place，不重做**。去锚定评估：greenfield 草图（[assets/greenfield-sketch.md](assets/greenfield-sketch.md)）与现状 diff 后判"一层嵌套 + 改名 + 同名合并"的机械距离，非本质冲突——starter 已是自洽子树，扁平化构建器已存在，`.codex→.toolkit` 171 处引用为字符串级且配置集中、测试锁在场。三档比例 ≈ 88% 原样 / 10% 改造 / 2% 新建，迁移风险低。不触发重做毕业票（新仓骨架/资产迁移映射/旧仓去留）。过程文档（wayfinder）不进分发物，仓内隔离 + 干净副本命令剔除。

## Not yet specified

（无——图已收口，zip 触发已随票 10 裁定为 tag CI）

## Out of scope

- 执行本身（改造/新建的实施、文件实际移动、vendoring 拷贝落地）——图走完即开干，不进图内（沿上张图惯例）
- github 插件的迁移或替代（用户已裁定用 github MCP 替代，忽略）
- 原生 Android/鸿蒙技能启用（沿上张图）
- elms-h5 相关遗留（上张图已关闭）
