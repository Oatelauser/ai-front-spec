# 研究报告：多宿主 AI 规则/技能 Starter 工具包调研

核实日期：2026-09-23（GitHub API + web）。Star 数为当日值。机制经 README/CONTRIBUTING/仓库树核实，未核实处已标注。制图期研究成果，供本图各票直接引用。

---

## 1. obra/superpowers — 290,317 stars
**URL:** https://github.com/obra/superpowers（MIT）
**是什么**：Agentic skills 框架 + SDLC 方法论（brainstorming → writing-plans → subagent-driven-development → TDD）。一个技能库约 15 个技能。
**多宿主机制**：无生成步骤。同一仓库被各宿主自己的插件/扩展系统消费——Claude Code marketplace（`/plugin install superpowers@claude-plugins-official`）、Codex 官方插件市场、Cursor `/add-plugin`、Gemini CLI `extensions install`、Devin、Factory Droid、Copilot CLI、Grok、Kimi、OpenCode、Pi、Qwen、Hermes、Muse、Antigravity。每宿主入口文件（如 `.opencode/INSTALL.md`、per-host hook shim）。贡献规则明言"技能更新必须在所有支持的编码代理下可用"，经跨宿主 eval harness（superpowers-evals）执法。
**Vendoring**：无第三方技能，全部原创。

## 2. affaan-m/ECC — 265,636 stars
**URL:** https://github.com/affaan-m/ECC（MIT）
**是什么**："Agent harness operating system"：292 skills、68 agents、94 commands、rules、hooks、Memory Vault，支持 Claude Code / Codex / Cursor / OpenCode / Gemini / Zed / Copilot / Antigravity / Qwen 等。
**多宿主机制**：仓库根单源（`skills/`、`agents/`、`commands/`、`rules/`、`hooks/`）+ 每宿主适配目录（`.claude-plugin/`、`.codex/`、`.opencode/`、`.cursor/`）。README："Platform adapters package or map these same workflows instead of maintaining separate copies."（根是事实源，平台适配器打包/映射同一工作流）。三级安装：(1) Claude Code 插件 `ecc@ecc`；(2) Codex 原生 marketplace 插件；(3) `./install.sh --target cursor|opencode|...` + 引导式多宿主向导（`npx ecc-universal install --guided --harness claude --harness codex`，含 preflight/dry-run）。legacy `scripts/sync-ecc-to-codex.sh`（复制并入 `~/.codex`，写所有权 manifest 供安全卸载）已废弃。Codex 也直接读根 `AGENTS.md` + `.agents/skills/`。
**Vendoring**：刻意不 re-bundle Anthropic 官方技能——"Install those from anthropics/skills when you want the official versions."

## 3. github/spec-kit — 138,449 stars
**URL:** https://github.com/github/spec-kit（MIT）
**是什么**：Spec-Driven Development 工具包（`specify init my-project --integration copilot`）+ bug-fix、idea-assessment 流程扩展。带 `/speckit-*` 技能/模板。
**多宿主机制**：宿主中立模板在 `templates/commands/*.md` + **数据驱动集成目录**（`integrations/catalog.json`，41 个集成，含 claude、codex、copilot、cursor-agent、gemini、opencode、zed、kimi 等；社区增补在 `catalog.community.json`）。`specify init --integration <key>` 在生成时实例化每宿主文件集（CLAUDE.md vs AGENTS.md vs `.cursor/rules` vs `.github/prompts` vs TOML vs skills 布局）。一次性实例化，非持续同步——后续编辑活在项目里（重跑 init 是否干净再生成未核实）。

## 4. dyoshikawa/rulesync — 1,464 stars
**URL:** https://github.com/dyoshikawa/rulesync（MIT，npm `rulesync`）
**是什么**：最纯粹的"一个规范目录 + 生成宿主副本"工具。Node CLI，支持 40+ AI 工具及 AGENTS.md、AgentsSkills 开放标准，覆盖 rules / ignore / MCP / commands / subagents / skills / hooks / permissions。
**机制**：`.rulesync/` 为事实源。`rulesync generate --targets "*" --features "*"` 产出宿主专属树；`rulesync import --targets claudecode` 反向吸收既有 CLAUDE.md/.cursorrules（采用桥）；`rulesync convert --from cursor --to copilot,claudecode` 一次性跨转换；`rulesync fetch <repo>` 从远端仓库装技能。CI 友好（generate + git diff 作检查）。被废弃工具作为冻结兼容目标并记录说明。

## 5. codejunkie99/agentic-stack — 2,272 stars
**URL:** https://github.com/codejunkie99/agentic-stack（Apache-2.0）
**是什么**：可移植 `.agent/` 文件夹（AGENTS.md 地图 + 4 层记忆 + 9 种子技能 + 协议），13 个宿主共享（Claude Code、Cursor、Windsurf、OpenCode、OpenClaw、Copilot CLI、Gemini、Hermes、Pi、Codex、Autohand、standalone Python、Antigravity）。
**机制**：规范 `.agent/` 从不按宿主改写；`adapters/<host>/` shim 各带 `adapter.json` manifest（每文件 `merge_policy`）。安装器（`agentic-stack <host>` / `install.sh` / `install.ps1`，manifest 驱动 `harness_manager/`）应用之：Claude Code 得 `CLAUDE.md` + settings hooks；Cursor 得 `.cursor/rules/*.mdc`；Copilot 得 `AGENTS.md` + `.github/instructions` + `.github/skills` **镜像**；Pi/Codex/Autohand 得指向 `.agent/skills/` 的 skills **symlink**。完整生命周期：`add`/`remove`/`doctor`/`upgrade --dry-run`、`install.json` 状态文件、`sync-manifest` 从 SKILL.md frontmatter 重建 `_manifest.jsonl`。升级永不改写用户自有的 CLAUDE.md/memory/skills。
**Vendoring/许可**：典范——Apache-2.0 + `NOTICE` + `docs/licensing.md`："Third-party components remain under their own licenses and are not relicensed by this repository."（第三方组件保留原许可，不被本仓库再许可）。外部 Brain 依赖从 vendoring 改为可选 brew 安装。

## 6. prisma/orm — 生产参考（非工具包）
**URL:** https://github.com/prisma/orm（AGENTS.md + `scripts/sync-agent-rules.mjs`）
**是什么**：大型真实代码库在生产运行"规范源 + 镜像"模式，写在其 AGENTS.md 里。
**机制**（AGENTS.md 原句）：规则规范家 `.agents/rules/<rule>.mdc` 是 "the only tracked copy"；"The `.cursor/rules/` and `.claude/rules/` trees are gitignored presentation mirrors containing only relative symlinks back into `.agents/rules/`." 由 `package.json` `prepare` hook 物化：`skills add ./skills-contrib --skill '*' --agent universal claude-code -y` 填充 `.claude/skills/` 与 `.agents/skills/`，再 `node scripts/sync-agent-rules.mjs` 构建规则树。**CI 执法**：`lint:rules:symlinks`（sync 脚本 `--check` 模式）、`lint:skills`（frontmatter）、`rules:footprint`——只加进 `.cursor/rules` 的规则"被 gitignore 且静默丢失"，CI 抓漂移。技能规范家 `skills-contrib/`；部分上游技能包在独立仓库（`prisma/ignite`）经 `npx skills add` 安装。

## 7. JCodesMore/ai-website-cloner-template — 34,804 stars（演进警示）
**URL:** https://github.com/JCodesMore/ai-website-cloner-template
**是什么**：Next.js "clone any website" 脚手架，带 `/clone-website` 技能给 Claude Code、Codex、Cursor、OpenCode。
**机制——随时间改变**：CHANGELOG 记录早期生成镜像设计：`scripts/sync-agent-rules.sh` 从 AGENTS.md 再生成 CLAUDE.md/GEMINI.md/Windsurf/copilot 指引（含 `@file` import 内联、Windows CRLF 修复）；`scripts/sync-skills.mjs` 按平台扇出技能。**当前** CONTRIBUTING 相反：指引活在 `AGENTS.md`；规范技能在 `.agents/skills/clone-website/`，"read directly by Codex, Cursor, and OpenCode"；Claude Code 得 `.claude/commands/clone-website.md`，"must remain a thin bridge rather than a second workflow copy... There is no generation or synchronization step."（当前 `scripts/` 目录仅 `.gitkeep`——sync 脚本似已移除；确切时点与原因未核实。）

## 其他值得注意

- **anthropics/skills** — 177,701 stars — 官方第三方技能 vendor 仓库（document skills：docx/pptx/xlsx/pdf 等）。"从上游装、不要 fork"的典范目标，ECC 即指向它。（许可本报告未核实，见 host-discovery 报告。）
- **hesreallyhim/awesome-claude-code** — 54,465 stars — 仅链接的 awesome 列表；**VoltAgent/awesome-claude-code-subagents** — 25,272 stars — 每代理 `npx` 安装器，无再分发；**rohitg00/awesome-claude-code-toolkit** — 2,634 stars — 混合：仓库内 vendor 实体组件目录（`skills/ agents/ commands/ rules/ hooks/ mcp-configs/ plugins/ templates/ contexts/ setup/`）作"要什么拷什么"自助餐（README 细节未核实；布局已核实）。
- **jnMetaCode/superpowers-zh** — 8,191 stars — superpowers 全量中文化 + 4 个原创技能，宣称支持 26 宿主；MIT 上游的归属/本地化衍生（自身 license 文件未核实）。

---

## 值得借鉴的模式

1. **规范根 + 宿主薄适配是主流形态。** ECC、agentic-stack、prisma/orm 都保一个源（`skills/`、`.agent/`、`skills-contrib/` + `.agents/rules/`）并让宿主目录成为薄 shim——绝不第二份拷贝。ECC 那句是模式论点："The root is the source of truth. Platform adapters package or map these same workflows."
2. **四种分发机制，耦合递增**：(a) 一仓多插件市场消费（superpowers——零镜像，但要求每宿主有插件系统）；(b) 宿主目录 symlink 指向规范目录（prisma、agentic-stack 对 Codex/Pi——Windows 可移植性是已知代价）；(c) 脚本/CLI 生成副本（rulesync、spec-kit init、prisma sync-agent-rules.mjs）；(d) 无机制——靠 AGENTS.md/.agents 汇合 + 给落单宿主一个"薄桥"文件（cloner 模板现行设计；本仓库 CLAUDE.md + .claude/skills 镜像最接近 (c) 的手动版）。
3. **差异化在防漂移执法，不在生成。** Prisma gitignore 镜像、prepare hook 物化、CI `sync --check` + symlink-lint + frontmatter-lint——镜像永不腐烂。生成文件头（"AUTO-GENERATED from X — do not edit"）是轻量版。**没有 CI `--check` 的生成镜像是已知失败模式**（cloner 模板的 CRLF `@file` bug 正是此类）。
4. **反向 import 降低采用摩擦。** rulesync `import` 把既有 CLAUDE.md/.cursorrules 变成规范源而非要求大爆炸迁移；`convert` 覆盖一次性用户。
5. **Vendor 技能的许可卫生**：不 re-bundle 官方上游就指向它（ECC → anthropics/skills）；要 vendor 就带 `NOTICE` + 许可指南并声明"第三方组件保留原许可"（agentic-stack）；vendor 技能加命名空间前缀让归属在拷贝后存活；上游包放独立仓库安装期拉取（prisma/ignite）。
6. **安装所有权在卸载时才显形。** ECC legacy sync 写所有权 manifest；agentic-stack 的 `adapter.json` merge_policy + `install.json` + `doctor`/`upgrade --dry-run` 同效。往用户 `.claude/`、`.codex/` 写东西却不跟踪所有权 starter 终会吃掉谁的配置。

Web 来源：[GetUnblocked rule-sync](https://getunblocked.com)、[Cursor 论坛 AGENTS.md 汇合帖](https://forum.cursor.com)、[AGENTS.md as standard — kupczynski.info](https://kupczynski.info)、[rulesync](https://github.com/dyoshikawa/rulesync)
