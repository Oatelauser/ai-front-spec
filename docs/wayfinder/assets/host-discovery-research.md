# 研究报告：双宿主技能/插件发现机制（Codex CLI vs Claude Code）

核实日期：2026-09-23（源码级 + 官方文档级）。制图期研究成果，供本图各票直接引用。

**Bottom line:** 没有任何单一个技能目录能被两个宿主原生同读。Codex 读 `.agents/skills`（仓库级）和 `~/.agents/skills`（用户级），不读 `.claude/skills`。Claude Code 读 `.claude/skills`（项目/个人级），不读 `.agents/skills`（anthropics/claude-code 代码 0 命中；有未实现 feature request；memory 文档明言 "anything under a `.agents/` directory" 不读）。可移植的是 **SKILL.md 格式**（agentskills.io / Agent Plugins 标准），不是目录。变通：各宿主目录 + 同步、symlink（Codex 官方支持跟随）、或 `npx skills add` 按宿主写入。

## 1. Codex CLI（openai/codex）技能目录

源码核实：`codex-rs/ext/skills/src/host_roots.rs`（常量 `AGENTS_DIR_NAME = ".agents"`、`SKILLS_DIR_NAME = "skills"`）；官方文档 https://developers.openai.com/codex/skills

| 范围 | 目录 | 备注 |
|---|---|---|
| REPO（项目） | `.agents/skills` | 从 git/项目根到 CWD 逐级探测（`repo_agents_skill_roots()`） |
| REPO（legacy） | `.codex/skills` | 代码中有（Project config 层）；文档表未列；PR #10317："will remain but will be deprecated soon" |
| USER | `~/.agents/skills` | PR #10437（2026-02-02）新增 |
| USER（deprecated） | `~/.codex/skills` | 向后兼容保留 |
| ADMIN | `/etc/codex/skills` | |
| 插件 | `~/.codex/plugins/cache/<marketplace>/<plugin>/<hash>/skills` | |

- `.claude/skills`：**不扫描**（全仓库代码搜索 0 命中）。
- 时间线：PR #10317（2026-01-31）加入仓库级 `.agents/skills`，动机即跨宿主共享："sharing them across agents is awkward and often ends up requiring symlinks/duplication."
- **AGENTS.md：自动读取**——全局 `~/.codex/AGENTS.md`，然后项目根到 CWD 每级目录，根优先拼接，32 KiB 上限（`project_doc_max_bytes`）。https://developers.openai.com/codex/guides/agents-md
- Codex 附带 Claude→Codex 导入器（PR #12660）：`.claude/skills` → `.agents/skills` 单向复制、CLAUDE.md → AGENTS.md 迁移。

## 2. Codex CLI 插件

来源：https://developers.openai.com/codex/build-plugins 与插件总览。

- **解剖**：根 `plugin.json` 清单（可移植 "Agent Plugins" 格式，schema `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`；字段 `name`/`version`/`description`/`author`）+ `skills/` 目录（自动发现，每个 `<skill>/SKILL.md`）。还可捆绑 MCP 服务器、应用集成、UI。legacy 布局用 `.codex-plugin/plugin.json`。ID 形如 `plugin@marketplace`。
- **安装**：仅经 marketplace——universal 插件目录（ChatGPT + Codex）、**本地 marketplace**（本地文件夹）或 **git marketplace**（任意仓库 URL），配置在 `config.toml`（`marketplaceSource`：`"sourceType": "git"` / `"source": "local"`，commits #26417/#27009 核实）；按 `[plugins."name@marketplace"]` 启用。安装缓存于 `~/.codex/plugins/cache/...`。
- **纯项目文件？** skills 可以（`.agents/skills`）；插件不能（项目目录不自动发现插件）。**Vendoring**：可经 git marketplace（"repo marketplace for a project or team"）近似实现，但需要 config.toml 注册——是一步手动宿主配置，不是纯拷贝。

## 3. Claude Code

来源：https://code.claude.com/docs/en/skills 与 https://code.claude.com/docs/en/memory

- 项目技能：`.claude/skills/`（起始目录**及每个父目录直至仓库根**）；个人 `~/.claude/skills`；企业托管位置；插件技能 `~/.claude/plugins/...`。
- `.agents/skills`：skills 文档未提；anthropics/claude-code 代码搜索 0 结果；memory 文档明言："Not read: `AGENTS.local.md`, `AGENTS.override.md`, or anything under a `.agents/` directory." 有 open feature request 要求 `~/.agents/skills`——未实现。
- **AGENTS.md：支持（v2.1.277，2026-09-18）**——release notes："in a project with no CLAUDE.md, Claude Code reads AGENTS.md instead; change it under 'Project instructions' in /config (not yet on Bedrock, Vertex or Foundry)"。实现为内置 `agents-md` 插件（`mods/agents-md/`）；读 `AGENTS.md` 与 `.claude/AGENTS.md`；默认模式 `claude-md-or-agents-md`（仅回退），可配置 `claude-md-and-agents-md`（双读）。

## 4. 许可

| 仓库 | 许可 | 证据 |
|---|---|---|
| affaan-m/everything-claude-code | **MIT**（c) 2026 Affan Mustafa） | LICENSE 文件 |
| anthropics/skills | **混合；根目录无 LICENSE**。多数 skill Apache-2.0（如 `skills/theme-factory/LICENSE.txt`，"Copyright 2026 Anthropic, PBC"）；`docx`/`pdf`/`pptx`/`xlsx` 为 "source-available, not open source" | README + 各 skill LICENSE.txt |
| leonxlnx/taste-skill | **MIT**（c) 2026 Leonxlnx） | LICENSE 文件 |
| vercel-labs/agent-skills | **README 声明 MIT**；根无 LICENSE 文件，`package.json` `"private": true` 无 license 字段——文件级许可未核实 | README.md |

## 5. 跨宿主约定？

`.agents/skills` 是真实增长中的约定——Codex、Cursor（`.cursor/skills` 或 `.agents/skills`）、Gemini CLI、GitHub Copilot、Atlassian Rovo（canonical bundle 写入 `~/.agents/skills`）已采用。SKILL.md 格式在 agentskills.io 标准化（Anthropic 与 Codex 文档均引用）；插件清单在 agent-plugins.org 标准化。**Claude Code 是唯一的局外人**：AGENTS.md 已支持（v2.1.277），但 `.agents/skills` 发现缺失。今天单目录服务双宿主只能变通：skills 放 `.agents/skills`（或中性目录）+ symlink/复制 `.claude/skills` 指向它（Codex 官方跟随 symlink；Claude Code 技能 symlink 行为未核实），或 `npx skills add`（skills.sh）按探测到的宿主安装。

## 来源

- https://github.com/openai/codex — `codex-rs/ext/skills/src/host_roots.rs`；commits `39a6a84`（PR #10317）、`e24058b`（PR #10437）、`6d6570d`（PR #12660）、`cdc1c59`（#26417）、`0aa9931`（#27009）；`docs/skills.md`、`docs/agents_md.md`
- https://developers.openai.com/codex/skills ; /codex/guides/agents-md ; /codex/plugins ; /codex/build-plugins
- https://code.claude.com/docs/en/skills ; https://code.claude.com/docs/en/memory
- https://github.com/anthropics/claude-code — `mods/agents-md/`（内置插件）、`feed.xml`（v2.1.277 notes）
- https://github.com/anthropics/skills（README、skills/theme-factory/LICENSE.txt）；https://github.com/affaan-m/everything-claude-code（LICENSE）；https://github.com/leonxlnx/taste-skill（LICENSE）；https://github.com/vercel-labs/agent-skills（README、package.json）
- https://agentskills.io ; https://agent-plugins.org ; https://cursor.com/docs（Agent Skills）；https://developer.atlassian.com（Agent Skills – Teamwork Graph）
