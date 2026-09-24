# UI 公共组件目录（Vue 预制模板）

这是 Vue 项目的 Element Plus 组件目录候选。Element Plus 仅是推荐基线，不能代替项目事实；用户选择后仍必须由 `$project-profile components` 使用 `$grill-me` 逐轮确认全部占位符（每个 `<待填写...>` 字段）。

## 初始化状态与来源

- 目录状态：`<待填写：draft / initialized / conflict>`
- 项目成熟度依据：`<待填写：.toolkit/profile-state.json#maturity>`
- 画像 UI 依据：`<待填写：PROJECT_PROFILE.md 中已确认的 Vue、样式、主题、图标和公共目录>`
- 目录基线：`Vue + Element Plus`

## 组件矩阵

每个条目还必须记录支持端、响应式变体、触摸行为和安全区域/短屏规则。

| 组件/能力 | 状态 | 目录/导出入口 | 推荐实现 | 使用边界 | 规划依据/落地条件 |
| --- | --- | --- | --- | --- | --- |
| AppShell | `<待填写：planned / implemented / deferred>` | `<待填写>` | ElContainer、ElMenu、ElBreadcrumb | 统一导航与内容壳层 | `<待填写>` |
| FormField | `<待填写>` | `<待填写>` | ElForm、ElInput、ElSelect、ElDatePicker | 统一校验、label、错误态 | `<待填写>` |
| DataTable | `<待填写>` | `<待填写>` | ElTable、ElPagination | 业务列定义留在业务域 | `<待填写>` |
| FeedbackState | `<待填写>` | `<待填写>` | ElLoading、ElEmpty、ElAlert、ElResult | 统一 loading/empty/error/unauthorized | `<待填写>` |
| Icon | `<待填写>` | `<待填写>` | 项目批准的 SvgIcon/iconfont 入口 | 禁止页面直接引入未批准图标包 | `<待填写>` |

## 选用与边界

- 先查目录和业务域，再复用现有组件；缺少通用变体时扩展，不复制页面实现。
- 公共组件通过 props/slots 接收内容，不直接请求业务接口；业务状态机和权限语义留在业务域。
- `planned` 可在代码目录尚不存在时使用，但必须写落地条件。
- 主题 token、国际化、焦点和无障碍规则以画像及 `FRONTEND_CONVENTIONS.md` 为准。

## 页面组件决策

| 页面区域 | 决策：复用/扩展/业务域/页面私有 | 依据 |
| --- | --- | --- |
| `<待填写>` | `<待填写>` | `<待填写>` |

## 新组件检查

- 是否优先使用 Element Plus 已有能力？
- 是否需要公共变体而非页面复制？
- 是否补充 Vitest/Vue Test Utils 测试和示例？
- 是否符合项目 token、国际化和无障碍约定？
