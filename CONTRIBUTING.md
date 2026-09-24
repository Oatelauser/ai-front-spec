# Codex Frontend Toolkit

这是一个预制项目规则 Starter（「拷贝即用、零外部下载」，Codex 与 Claude Code 双宿主），不负责创建业务应用。新项目通过 `node scripts/build-starter.mjs --target <project-directory>` 安装 Starter 运行时内容；构建脚本、测试与 wayfinder 档案（`scripts/`、`scripts/lib/`、`toolkit.json`、`docs/wayfinder/`、`CONTRIBUTING.md`）是开发件，不随安装分发（`toolkit.json` 的 `distExcludes`）。

## Starter 内容

Starter 会提供：

- 固定的 `AGENTS.md` 与 `CLAUDE.md`（双宿主入口，内容同源）；
- `docs/` 中的跨项目规范、草稿 `PROJECT_PROFILE.md` 和 UI 公共组件目录 `AI_COMPONENT_CATALOG.md`；规则层在 `docs/rules/`（8 件 `AI_*.md` + `FRONTEND_CONVENTIONS.md`，含 `AI_WEBVIEW_MOBILE.md`、`AI_COMPATIBILITY_MATRIX.md`）；能力清单 `docs/capabilities.md`（三段制：内置/宿主插件可选/宿主内置核对）；
- `.agents/skills/` 中的 21 个技能（5 自研 + 16 vendored，清单与来源见 `docs/capabilities.md` 第 1 节）；`templates/` 中的项目画像模板、组件目录结构模板和框架候选基线；
- `.claude/skills/`：`.agents/skills/` 的机器镜像（`sync-mirror.mjs` 全量重建，带 AUTO-GENERATED 头，不手改）；
- `.toolkit/` 中的 manifest、画像状态、校验器配置与运行时脚本（`check-ai-guidance.mjs`、`sync-mirror.mjs`）；
- `LICENSE`（MIT）与 `NOTICE`（vendored 组件归属、许可、修改记录）。

Starter 不包含业务代码，也不包含 `$bootstrap-project`。

## 用户入口

用户只需要记住：

```text
$project-profile
$project-profile init
$project-profile profile
$project-profile components
$project-profile status
$project-profile update
```

裸 `$project-profile` 只展示两个平级入口和推荐路径，不执行隐式全流程。`profile` 与 `components` 没有强制先后顺序；推荐先运行 `$project-profile profile` 完成成熟度判断和项目画像，但也可以先运行 `$project-profile components`。谁先运行谁负责共享成熟度扫描，后运行者复用结果；两个阶段都使用分轮 grilling，推荐项仍必须由用户选择，用户可以暂缓并保留独立状态和后续条件。

新项目可用 `$project-profile init` 以一次扫描和七张决策卡片生成可编辑提案；只有用户确认后才分层写入画像和组件目录。默认推荐支持桌面 Web、移动 H5、平板响应式，WebView 可选启用（默认暂缓）、PWA 暂缓；`multiPlatform` 是确认端类型的派生值。已有业务代码或稳定规范时使用 `update`，不要用 `init` 覆盖。

`profile` 会记录 `unformed`、`existing` 或 `uncertain` 的成熟度证据；`components` 在缺少记录时也会执行并持久化同一份扫描结果，随后读取画像中的已确认 UI 事实，但不能自行猜测或填写画像。`status` 汇总成熟度、画像和组件目录双状态；`update` 扫描现有项目并在两边都需要协调时按 `profile → components` 路由更新。

项目级任务使用 `$project-workflow`，前端任务使用 `$frontend-task`。画像缺口由这两个入口提示 `$project-profile`，不会强制替用户完成画像，也不会静默猜测高影响事实。

### 画像与组件目录初始化入口

裸 `$project-profile` 只展示导航，不执行隐式全流程。首次接入项目时可按任意顺序运行以下两个平级命令（推荐先 `profile`）：

```text
$project-profile profile
$project-profile components
```

`profile` 会根据业务源码、可运行入口、依赖/脚本、路由、公共基础设施、测试、CI 和工程约定判断项目成熟度，并将 `unformed`、`existing` 或 `uncertain` 及证据写入 `.toolkit/profile-state.json`。随后使用模板或现有代码初始化 `docs/PROJECT_PROFILE.md`，对全部占位符执行分轮 grilling。

`components` 会读取（或在缺少时先生成）已持久化的成熟度结果和画像中的已确认 UI 信息，再初始化 `docs/rules/AI_COMPONENT_CATALOG.md`。空/萌芽项目会展示并等待用户选择组件基线（Vue 的 Element Plus、React 的 Ant Design、generic 的框架中立契约、自定义或暂缓）；规划候选不会被当作已实现组件。两个阶段互相参考，但不会替对方完成初始化。

其他入口：

- `$project-profile status`：只读展示成熟度、画像状态、组件目录状态、剩余占位符、deferred、冲突和下一步。
- `$project-profile update`：重新扫描现有项目，自动记录无歧义事实，并在画像和组件目录都需要协调时按 `profile → components` 顺序进入对应 grilling；不会静默切换模板或覆盖已确认值。

完整命令、字段说明、扩展方式和故障处理见 [`README.md`](README.md)。

## 构建和验证

验证 Starter 源目录：

```text
node scripts/build-starter.mjs --check
```

复制 Starter 到新项目根目录：

```text
node scripts/build-starter.mjs --target <project-directory>
```

运行完整测试：

```text
node --test scripts/lib/*.test.mjs
```

运行指引校验（校验器随 Starter 分发，位于 `.toolkit/scripts/`）：

```text
node .toolkit/scripts/check-ai-guidance.mjs --root .
node .toolkit/scripts/check-ai-guidance.mjs --root . --strict
```

严格校验在画像仍为草稿、存在占位字段时应保持失败；这表示事实尚未确认，不表示 Starter 初始化失败。

镜像一致性（改了 `.agents/skills/` 之后必须先重建再校验）：

```text
node .toolkit/scripts/sync-mirror.mjs
node .toolkit/scripts/sync-mirror.mjs --check
```

`.claude/skills/` 永远是机器生成；任何宿主差异都通过重建镜像解决，不要手工编辑镜像文件。

## 修改与新增技能

1. 只改 `.agents/skills/<技能>/`（唯一人工源），不要碰 `.claude/skills/`。
2. vendored 技能的更新方式是**重新 vendor**：从上游取最新快照覆盖目录，然后在 `NOTICE` 更新快照日期与修改记录，在 `docs/capabilities.md` 第 1 节核对「来源与更新」行。
3. 新技能在 `toolkit.json` 的 `skills` 登记，必要时同步 `.toolkit/ai-guidance.config.mjs`。
4. 改完运行 `node .toolkit/scripts/sync-mirror.mjs` 重建镜像，再跑上面的校验与测试。
