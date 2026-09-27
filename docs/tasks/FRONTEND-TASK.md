# Frontend Task 操作手册

`$frontend-task` 是从需求、截图、原型、Figma、HTML 或 API 到工程交付的主流程。它组织事实、实现和验收，不替代项目画像、接口契约、权限规则或现有组件。

## 1. 任务分类

| 类型 | 重点 |
| --- | --- |
| `new-page` | 流程、路由、状态、接口、权限、目标端、组件 |
| `incremental` | 变化区域、保留行为、邻近回归 |
| `bug-fix` | 复现、根因、最小修复、重放 |
| `refactor` | 外部等价性；有行为/视觉变化则重新分类 |

每个来源单独分类为 `screenshot`、`prototype`、`html`、`figma`、`api` 或 `requirement`，并说明它负责视觉、行为、业务还是工程事实。

## 2. 阶段前置

在 `inspect` 前读取以下内容，并在后续阶段持续遵守：

```text
AGENTS.md
docs/PROJECT_PROFILE.md
.toolkit/profile-state.json → deliveryTargets
docs/rules/AI_COMPONENT_CATALOG.md
docs/rules/AI_FRONTEND_TASK.md
```

另查当前工作区改动、路由入口、邻近页面、共享组件、请求客户端、主题/i18n、测试和 CI。目标端缺失、冲突或 deferred 时不得猜。

## 3. 阶段操作

### `inspect`

确认任务类型、路由、来源版本/视口/DPR、影响模式、事实缺口、资产、组件边界和完成条件。输出事实清单与来源责任。

### `plan`

计划文件、组件复用/扩展/私有边界、状态矩阵、API 映射、权限语义、响应式和验收矩阵。复杂任务写 `docs/tasks/<task>/PLAN.md`、`STATE.json`。

### `confirm`

确认高影响决定：范围、目标端、视觉基线、路由、公共组件、接口/权限、状态、资产和验收。未确认不实现。

### `implement`

先补针对性失败测试（项目测试栈允许时），再实现真实 DOM/UI、数据和交互。适用时覆盖 loading、empty、error、unauthorized/forbidden、disabled、success、retry、stale response。截图不是背景图，mock 不是真实联调。

### `verify`

先跑改动直接相关测试，再跑项目画像质量门禁。验证目标端、响应式、主题、交互、键盘、无障碍、溢出、控制台和接口状态；非生产环境用真实 UI 验证主流程、失败、权限和刷新持久化。

### `report`

报告修改文件、实际命令、路由、操作、接口/权限证据、视觉偏差、未验证项和阻塞，并分别报告：

```text
visual: passed / failed / unverified
behavior: passed / failed / unverified
data: passed / failed / unverified
engineering: passed / failed / unverified
```

### `resume`

中断任务用 `--from=<stage>` 恢复；事实 fingerprint 过期时先回 `inspect`/`plan`。

## 4. 常用调用

```text
$frontend-task inspect --source=requirement --type=new-page
$frontend-task plan
$frontend-task confirm
$frontend-task implement
$frontend-task verify
$frontend-task report
```

## 5. 来源组合

| 组合 | 事实责任 |
| --- | --- |
| 截图 + 原型 | 原型负责流程，截图负责外观 |
| 截图 + API | 截图负责视觉，API 负责字段、请求和状态 |
| 原型 + API | 原型负责演示流程，API 负责真实提交语义 |
| HTML + 截图 | HTML 提供结构线索，截图提供视觉基线 |
| Figma + 截图 | 按版本、区域和状态绑定，冲突先记录 |
| Stitch 定稿 + 代码 | Stitch 提供视觉事实，代码/契约提供工程和业务事实 |

## 6. 场景操作

### 新页面

先确定流程、状态、路由、接口、权限、目标端和组件边界。无视觉参照时，快速方向走 `$prototype`，专业设计走 `$design-task`；定稿确认后实现。

### 截图还原

保留原始尺寸、CSS viewport、DPR、浏览器和状态，建立资产清单，实现真实 DOM，并在相同视口截图比较；不要只按像素堆绝对定位。

### Stitch 原型

读取冻结版本的 HTML、截图、元数据、资产和 `CONTRACT.md`。`downloadUrl` 先 manual redirect + body 校验；失败时使用浏览器登录态或网页端 ZIP，不把旧快照冒充新下载。

### API 页面

先读 API 契约和现有请求层，建立字段映射与请求状态，验证 loading、empty、error、unauthorized/forbidden、disabled、success、retry 和陈旧响应。

### Bug fix

先复现并记录实际/预期，定位根因，最小修复，重放失败和邻近正常路径。无法复现报告 `unverified`。

### Refactor

证明路由、行为、数据、权限、状态和视觉等价；若包含变化，改按 `incremental`。

## 7. 任务记录

复杂任务按需创建：

```text
docs/tasks/<task>/PLAN.md
                          STATE.json
                          PROMPTS.md
                          ACCEPTANCE.md
                          REPORT.md
```

简单任务不创建空记录。
