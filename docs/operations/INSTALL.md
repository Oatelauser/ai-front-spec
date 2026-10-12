# 安装手册

面向把本 Starter 安装到自己项目的使用者；维护本仓库看 [运维手册](OPERATIONS.md)。

## 1. 🧰 环境要求

- Node.js 22 或 25（建议使用当前已验证版本：实测 v22.23.3 / v25.0.0；Node 20 不作兼容保证，见 [README 运行环境与支持边界](../../README.md)）。
- Git 可用。
- Claude Code 或 Codex 任一宿主，且已登录。

## 2. 📦 安装 Starter

安装内容由源仓 Starter 清单的 `starter.runtime` 白名单声明展开（文档、双宿主技能源与镜像、`.toolkit` 校验器，以及 `tools/mcp/` 必要 MCP 工具与 `.mcp.json`）；`distExcludes` 在声明范围内排除维护材料。`.toolkit/profile-state.json` 以 draft 种子随发，首装到新消费项目时其 `maturity` 重置为未评估种子（不继承源仓成熟度既有事实），安装后归用户所有，升级时受 `skipIfExists` 保护不被覆盖。

### 方式一：命令安装

```bash
git clone https://github.com/Oatelauser/ai-front-spec.git
cd ai-front-spec
node scripts/build-starter.mjs --target <你的项目目录>
```

空目录先在临时副本通过三连校验，再写入目标。已有项目默认安全安装：`AGENTS.md`、`CLAUDE.md`、`README.md`、项目画像与画像状态等已有用户文件保留；工具管理文件按成功安装时记录的逐文件旧基线判断，未定制者更新、本地单方定制保留、双方变化或未知基线差异非零退出，整个计划在写入前中止。自定义 Skill 与未知文件不自动删除。

先查看只读计划（目标不存在也不会创建目录）：

```bash
node scripts/build-starter.mjs --target <你的项目目录> --dry-run
```

已有项目增加 Starter 的 MCP 连接须明确采纳，先复查计划，再执行：

```bash
node scripts/build-starter.mjs --target <你的项目目录> --dry-run --accept-mcp
node scripts/build-starter.mjs --target <你的项目目录> --accept-mcp
```

`--accept-mcp` 只允许添加缺失的服务器 key，不覆盖同名不同配置。用户已有服务器和顶层字段保留；坏 JSON、同名冲突均失败，不静默忽略。空目录首次安装包含 Starter 声明的默认 MCP 配置，但不启动服务、不连接用户浏览器、不修改全局配置。

安装记录在 `.toolkit/manifest.json` 的 `installation` 字段中保存成功安装的受管文件 SHA-256（子结构版本 1）；原有状态与未知字段保留。历史安装没有基线时，只能确认当前与新版内容相同，不能推定其未定制；有差异须人工核对并处理后重跑，没有盲目强制覆盖开关。

源和目标不能相同或互相包含，目标路径不能含符号链接/junction。单写入者场景下捕获的执行异常会恢复已写内容和旧安装事实；恢复失败会非零退出并保留、打印恢复材料目录，不要删除唯一恢复副本。强制终止进程、断电与任意恶意并发不属于已验证的自动恢复范围。

### 方式二：GitHub Release 下载

在 [Releases](https://github.com/Oatelauser/ai-front-spec/releases) 下载 `ai-front-spec-v<版本>.zip`（CI 从干净副本自动构建），解压后把内容复制进你的项目根目录。内容与方式一一致；差别是手动复制不执行 `skipIfExists` 保护——目标项目已有 `AGENTS.md`、`CLAUDE.md` 等文件时先自查再覆盖。

### 方式三：源码 zip

GitHub 页面 Code → Download ZIP，解压后在解压目录内运行方式一的同一命令。适合不方便 `git clone` 的环境。

## 3. ▶️ 装完之后

Codex 自动发现 `.agents/skills/`，Claude Code 自动发现 `.claude/skills/`，装完即用无需注册。首次使用先运行 `$project-profile` 初始化项目画像，再按 [README](../../README.md) 入口表选择任务。

## 4. 🔄 升级

消费项目升级先对新版源仓运行上述 dry-run，再按计划安全安装；不要在消费项目运行维护侧上游升级命令。安装基线与失败恢复边界见 [升级手册](UPGRADING.md)。

## 5. 🧩 可选插件安装总览

本节只讲需要动手的增量；使用本 Starter 的绝大部分能力不需要安装任何东西：

- **29 项内置 Skill 随安装自带，无任何安装命令**——不要为它们找安装方式，装完即用。
- **下表 6 项才是可选插件**：按需安装对应能力，不装只是少该项，其余照常工作。

个别内置 Skill 另有可选运行时依赖——不是插件、没有安装命令，缺的只是本机环境，缺失时如实报告并降级，不会静默失败：

| 内置 Skill | 可选运行时依赖 | 何时需要 |
| --- | --- | --- |
| `webapp-testing` | 本机 Python + playwright | 用它对本地 Web 应用做浏览器自动化验收 |
| `ui-ux-pro-max` | Python 3（无外部依赖） | 用它检索内置 UI/UX 数据（运行 search.py） |

插件细节、降级路径和安装状态机见 [能力安装清单](../capabilities.md)。

| 能力 | 用途 | Claude Code | Codex | 备注 |
| --- | --- | --- | --- | --- |
| Figma | 设计稿读取、原型生成、代码回写画布 | `claude plugin install figma@claude-plugins-official` | `figma@openai-api-curated`（插件市场） | 免费账号即可读取与回写 |
| GitHub | PR、Issue、远端仓库读写 | GitHub 官方 MCP 连接器 | `github` 插件或 GitHub MCP 连接器 | 本地 Git 操作不需要插件 |
| Product Design | 设计探索、视觉复刻、UX 审计 | 无需安装（Starter 已内置整包拷贝） | OpenAI 官方插件市场 | Codex 装插件解锁 `image-to-code` 等宿主依赖子技能 |
| Impeccable | 设计质量确定性检查（detect / critique / polish / audit） | `npx impeccable` | `npx impeccable` | 编辑时拦截 hook 为进阶自选，见能力清单 |
| Stitch MCP | 设计 lane 云端出稿引擎 | `claude mcp add stitch --transport http https://stitch.googleapis.com/mcp --header "X-Goog-Api-Key: <key>" -s user` | 同端点 + 同请求头 | 未配置时降级为 agent 自写 HTML |
| chrome-devtools MCP | 浏览器页面验收、页面标注反馈 | 随包内置零安装（`.mcp.json` 双入口） | 不需要（宿主内置 browser） | 上游自身要求 Node 20+（第三方技术事实，不等于 Starter 对 Node 20 的保证）与系统 Chrome stable；CDP 桥另需 Node ≥22 |

## 6. 🚑 安装故障排查

| 问题 | 处理 |
| --- | --- |
| 安装冲突 | 保留目标现状，按报告核对文件拥有者、旧安装基线与新版差异；MCP 同名差异不能用 `--accept-mcp` 强制覆盖 |
| 恢复不完整 | 保留输出指向的 `starter-transaction-*` 恢复材料，按 `recovery.json` 与编号副本人工恢复；未恢复前不要重复覆盖或删除材料 |
