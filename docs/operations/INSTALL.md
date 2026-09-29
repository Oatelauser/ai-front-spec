# 安装手册

面向把本 Starter 安装到自己项目的使用者；维护本仓库看 [运维手册](OPERATIONS.md)。

## 1. 环境要求

- Node.js >= 20。
- Git 可用。
- Claude Code 或 Codex 任一宿主，且已登录。

## 2. 安装 Starter

### 方式一：命令安装

```bash
git clone https://github.com/Oatelauser/ai-front-spec.git
cd ai-front-spec
node scripts/build-starter.mjs --target <你的项目目录>
```

空目录得到干净副本；已有项目执行覆盖安装——`AGENTS.md`、`CLAUDE.md`、`README.md`、项目画像等受保护文件已存在时自动跳过（`skipIfExists`），其余文件覆盖并打印落地/跳过清单。

### 方式二：GitHub Release 下载

在 [Releases](https://github.com/Oatelauser/ai-front-spec/releases) 下载 `ai-front-spec-v<版本>.zip`（CI 从干净副本自动构建），解压后把内容复制进你的项目根目录。内容与方式一一致；差别是手动复制不执行 `skipIfExists` 保护——目标项目已有 `AGENTS.md`、`CLAUDE.md` 等文件时先自查再覆盖。

### 方式三：源码 zip

GitHub 页面 Code → Download ZIP，解压后在解压目录内运行方式一的同一命令。适合不方便 `git clone` 的环境。

## 3. 装完之后

Codex 自动发现 `.agents/skills/`，Claude Code 自动发现 `.claude/skills/`，装完即用无需注册。首次使用先运行 `$project-profile` 初始化项目画像，再按 [README](../../README.md) 入口表选择任务。

## 4. 升级

Starter 与内置 Skill 的升级见 [升级手册](UPGRADING.md)。

## 5. 可选插件安装总览

除下表 6 项可选插件外，其余 29 项内置 Skill 随安装自带，无任何安装命令。个别内置 Skill 有可选运行时依赖（`webapp-testing` 需本机 Python + playwright、`ui-ux-pro-max` 需 Python 3），缺失时如实报告并降级。插件细节、降级路径和安装状态机见 [能力安装清单](../capabilities.md)。

| 能力 | 用途 | Claude Code | Codex | 备注 |
| --- | --- | --- | --- | --- |
| Figma | 设计稿读取、原型生成、代码回写画布 | `claude plugin install figma@claude-plugins-official` | `figma@openai-api-curated`（插件市场） | 免费账号即可读取与回写 |
| GitHub | PR、Issue、远端仓库读写 | GitHub 官方 MCP 连接器 | `github` 插件或 GitHub MCP 连接器 | 本地 Git 操作不需要插件 |
| Product Design | 设计探索、视觉复刻、UX 审计 | 无需安装（Starter 已内置整包拷贝） | OpenAI 官方插件市场 | Codex 装插件解锁 `image-to-code` 等宿主依赖子技能 |
| Impeccable | 设计质量确定性检查（detect / critique / polish / audit） | `npx impeccable` | `npx impeccable` | 编辑时拦截 hook 为进阶自选，见能力清单 |
| Stitch MCP | 设计 lane 云端出稿引擎 | `claude mcp add stitch --transport http https://stitch.googleapis.com/mcp --header "X-Goog-Api-Key: <key>" -s user` | 同端点 + 同请求头 | 未配置时降级为 agent 自写 HTML |
| chrome-devtools MCP | 浏览器页面验收、页面标注反馈 | 随包内置零安装（`.mcp.json` 双入口） | 不需要（宿主内置 browser） | 运行需 Node 20+ 与系统 Chrome stable |

## 6. 安装故障排查

| 问题 | 处理 |
| --- | --- |
| 安装覆盖异常 | 以源仓根目录 manifest 为准核对 `skipIfExists` 与 `distExcludes` 两份清单，确认目标文件属于哪类契约 |
