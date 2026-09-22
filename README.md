# Codex Frontend Toolkit

这是一个预制项目规则 Starter，不负责创建业务应用。新项目直接使用 `resources/` 的全部内容；工具包内部的构建和测试脚本位于 `scripts/`，不会复制到用户项目。

## Starter 内容

Starter 会提供：

- 固定的 `AGENTS.md`；
- `docs/` 中的跨项目规范、草稿 `PROJECT_PROFILE.md` 和 UI 公共组件目录 `AI_COMPONENT_CATALOG.md`；
- `docs/AI_WEBVIEW_MOBILE.md`（WebView/移动端规则层，按 `deliveryTargets` 条件挂载）与 `docs/AI_COMPATIBILITY_MATRIX.md`（端兼容与选型冲突矩阵，init/update 访谈消费）；
- `.agents/skills/` 中的 `project-workflow`、`project-profile`、`frontend-task` 和 `codex-capability-setup`；
- `.codex/` 中的 manifest、画像状态、模板和运行时指引校验器。
- `.codex/templates/` 中的项目画像模板、组件目录结构模板和框架候选基线。

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

`profile` 会根据业务源码、可运行入口、依赖/脚本、路由、公共基础设施、测试、CI 和工程约定判断项目成熟度，并将 `unformed`、`existing` 或 `uncertain` 及证据写入 `.codex/profile-state.json`。随后使用模板或现有代码初始化 `docs/PROJECT_PROFILE.md`，对全部占位符执行分轮 grilling。

`components` 会读取（或在缺少时先生成）已持久化的成熟度结果和画像中的已确认 UI 信息，再初始化 `docs/AI_COMPONENT_CATALOG.md`。空/萌芽项目会展示并等待用户选择组件基线（Vue 的 Element Plus、React 的 Ant Design、generic 的框架中立契约、自定义或暂缓）；规划候选不会被当作已实现组件。两个阶段互相参考，但不会替对方完成初始化。

其他入口：

- `$project-profile status`：只读展示成熟度、画像状态、组件目录状态、剩余占位符、deferred、冲突和下一步。
- `$project-profile update`：重新扫描现有项目，自动记录无歧义事实，并在画像和组件目录都需要协调时按 `profile → components` 顺序进入对应 grilling；不会静默切换模板或覆盖已确认值。

完整命令、字段说明、扩展方式和故障处理见 [`resources/README.md`](resources/README.md)。

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

运行指引校验：

```text
node scripts/check-ai-guidance.mjs --root .
node scripts/check-ai-guidance.mjs --root . --strict
```

严格校验在画像仍为草稿、存在占位字段时应保持失败；这表示事实尚未确认，不表示 Starter 初始化失败。
