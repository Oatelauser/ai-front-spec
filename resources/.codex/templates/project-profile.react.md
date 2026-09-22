# React 项目画像模板

本模板提供 React + TypeScript 前端项目的画像候选，在当前仓库生成 `docs/PROJECT_PROFILE.md` 时，以实际选定的框架、版本、代码、配置、接口和测试替换预设与 `<待填写：...>`。尚无工程时先建立草案，在当前根目录搭建后补充事实，再启用严格 AI 指引门禁。指引校验使用 `node .codex/scripts/check-ai-guidance.mjs --root .`。

模板选择初始状态为 `pending`；React、版本、目录和命令均为候选，不是已确认事实。首次使用 `$project-profile` 必须展示 `generic`、`react`、`vue` 并由用户选择或暂缓，未填写字段不得静默补成事实。

组件目录由 `$project-profile components` 单独初始化。React 项目的推荐规划基线为 Ant Design；它必须由用户明确选择后才能写入 `docs/AI_COMPONENT_CATALOG.md`，且规划候选不等于已实现组件。

## 1. 基本信息

- 项目名称：`<待填写：项目名称>`
- 业务目标：`<待填写：一句话业务目标>`
- 默认沟通语言：`中文`
- 目标用户与关键场景：`<待填写：用户、角色和关键场景>`
- AI 使用责任边界：`可以：按已确认的设计源与接口契约实现页面，起草标注为“待后端确认”的接口契约草案，生成明确标注用途的 mock 与文档。不得：修改后端契约、自行添加需求外功能、在设计稿已定义的视觉上做“优化”、绕过身份或权限、把 mock 当作生产事实；遇到歧义、冲突或授权不足时停下并向人确认。`

## 2. 事实源

| 类型 | 权威来源 | 冲突处理 |
| --- | --- | --- |
| 业务事实 | `需求文档 > 后端接口文档 docs/api/<模块>.md（有后端文档时标注版本；无时为草案）` | `以需求文档和已确认业务规则为准；接口差异记入接口问题清单并向负责人确认，不擅自修改后端契约。` |
| 视觉事实 | `Figma > 原型图/截图 > docs/design/<页面>.md 中已确认的 token 表 > 现有页面` | `还原模式以已确认设计源为主要依据；浏览器渲染、字体和像素密度造成的客观误差记录在差异清单，不以“误差 0”作为无法验证的承诺；设计源未覆盖的状态按 docs/design 派生规则并标注假设。` |
| 工程事实 | `代码与配置 > docs/FRONTEND_CONVENTIONS.md > 本文件第 3、4 节` | `同时服从系统约束、用户本次要求、AGENTS.md 和可信接口契约；工程事实冲突且无法安全兼容时停下提问，不擅自二选一。` |
| 身份与权限 | `<待填写：服务端会话、令牌声明、权限接口或 RBAC/ABAC 文档>` | `<待填写：身份和权限冲突时的确认人、接口版本与降级策略；客户端限制不能替代服务端鉴权>` |

## 3. 支持端与运行环境

本节是项目是否适配多端 H5 的唯一项目级配置入口；`$frontend-task` 全流程必须读取它和 `.codex/profile-state.json` 的 `deliveryTargets`。新项目默认推荐桌面 Web、移动端 H5 和平板响应式，推荐值须经用户确认后才可写入事实。

| 支持能力 | 状态 | 具体范围 | 证据/决策 |
| --- | --- | --- | --- |
| 多端适配 | `<待填写：user-confirmed / recommended / deferred / unsupported>` | `<待填写>` | `<待填写>` |
| 浏览器 Web | `<待填写>` | `<待填写：桌面浏览器及版本>` | `<待填写>` |
| 移动端 H5 | `<待填写>` | `<待填写：iOS/Android 浏览器及版本>` | `<待填写>` |
| 平板 Web | `<待填写>` | `<待填写：横竖屏及版本>` | `<待填写>` |
| WebView | `<待填写>` | `<待填写：支持范围或“不支持”>` | `<待填写>` |
| PWA | `<待填写>` | `<待填写：能力范围或“不支持”>` | `<待填写>` |
| 响应式策略 | `<待填写：移动优先/桌面优先/分别设计>` | `<待填写>` | `<待填写>` |
| 移动交互/安全区域 | `<待填写>` | `<待填写：触摸、软键盘、短屏、safe-area>` | `<待填写>` |
| 深链与部署路径 | `<待填写>` | `<待填写：History fallback、子路径、刷新>` | `<待填写>` |

deliveryTargets 含 webview 或 mobileH5 时，页面任务受 [WebView 移动端规则](docs/AI_WEBVIEW_MOBILE.md) 约束，按页面声明判定生效标签集。

## 4. 技术与目录

- 语言与运行时：`TypeScript 5.x，Node <版本>（以 .nvmrc 或 package.json engines 为准），pnpm <版本>（以 packageManager 和锁文件为准）`
- 应用框架：`React 18 / Vite 5 / React Router v6 data router，纯客户端 SPA，不是 Next.js，不使用 RSC / Server Actions；仅函数组件，页面级 React.lazy + Suspense`
- UI 与样式系统：`Ant Design 5 + CSS Modules + SCSS + CSS Variables；禁用 Tailwind、styled-components、emotion；图标仅使用项目批准的 iconfont Symbol 入口`
- 状态、数据与请求层：`TanStack Query（服务端状态）+ Zustand（客户端状态，按模块拆 store）+ axios 二次封装；Context 仅做依赖注入；DTO → VO 在 adapter.ts，于 queries.ts 的 select 阶段调用`
- Schema/接口生成：`默认无自动生成；类型手写于 src/api/<模块>/types.ts，与 docs/api/<模块>.md 一一对应；若后端提供 OpenAPI，应明确生成源、生成命令和禁止手改目录`
- 测试框架：`Vitest + @testing-library/react；接口 mock 按项目批准方案（如 MSW）；关键用户流程使用 Playwright 或项目批准的等价 E2E 工具`
- 源码目录：`src/`
- 公共组件目录：`src/components/（含 SvgIcon、QueryState）`
- 业务域目录：`src/pages/<模块>/{index.tsx, components/, config.tsx, hooks/}，src/api/<模块>/{index.ts, types.ts, adapter.ts, queries.ts}，src/stores/<模块>.ts`
- 请求统一入口：`src/utils/request.ts`
- 生成代码目录：`无；如存在，填写真实路径、生成命令和禁止手工修改规则`
- 国际化入口：`src/locales/index.ts（react-i18next；namespace 按模块拆；同步 Ant Design ConfigProvider locale）`
- 主题入口：`src/styles/theme/{tokens.scss, light.scss, dark.scss}（html[data-theme]；Ant Design ConfigProvider theme.algorithm 与 token 从同一套 CSS Variables 派生）`
- 前端约定入口：`docs/FRONTEND_CONVENTIONS.md（图标、国际化、主题 token、VO/adapter、配置化字段、四态、代码卫生和文档产物）`

## 5. 硬边界

- 必须复用的基础设施：`src/components/SvgIcon、src/components/QueryState、src/utils/request.ts、src/styles/theme/tokens.scss、src/locales、src/constants；页面 loading、empty、error、unauthorized 四态统一实现方式见 docs/FRONTEND_CONVENTIONS.md`
- 禁止引入或复制的能力：`任何未经批准的图标 npm 包（lucide-react、react-icons、@mui/icons-material）；业务代码禁止直接引用 @ant-design/icons，组件库内置图标通过 icon 属性替换为 SvgIcon；第二套 UI 库；Tailwind / styled-components / emotion；Google Fonts；未经批准的外链图片；硬编码用户文案与色值；any；emoji。测试或构建工具如需例外，必须在本画像登记。`
- 禁止手工修改的目录：`<待填写：生成代码、迁移或构建产物目录；没有则写“无”>`
- 数据与秘密管理：`秘密只通过环境变量或批准的秘密管理系统注入；.env.local 等本地文件不得提交；日志、mock、截图和交付报告不得记录令牌、密码、个人敏感数据或未脱敏接口响应；所有外部输入在边界校验。`
- 身份、角色和权限来源：`<待填写：会话/令牌来源、角色与权限接口、401/403 处理和服务端复核规则>`
- 不可逆操作与授权边界：`未经明确授权不得删除、发布、创建外部对象、发送通知、写入生产或扩大权限；不修改后端契约。页面任务如采用“分析 → 结构 → 编码”三阶段，需在任务中明确阶段产物和确认点；阶段 1 未确认不新建 src/ 文件，阶段 2 未确认不写页面组件。`
- 兼容性或发布约束：`<待填写：支持的浏览器与版本、Node/pnpm 版本、部署目标、环境变量清单、发布审批和回滚要求>`

## 6. 质量命令

| 目的 | 命令 |
| --- | --- |
| 格式检查 | `pnpm format:check` |
| 类型或静态检查 | `pnpm lint && pnpm type-check` |
| 单元测试 | `pnpm test` |
| 集成测试 | `<待填写；无则写“无”>` |
| 覆盖率 | `pnpm test:coverage` |
| 构建 | `pnpm build` |
| 安全审计 | `pnpm audit --prod` |
| AI 指引校验 | `node .codex/scripts/check-ai-guidance.mjs --root .` |
| 总质量门禁 | `node .codex/scripts/check-ai-guidance.mjs --root . --strict && pnpm lint && pnpm type-check && pnpm test && pnpm build` |
| 端到端验收 | `<待填写：例如 pnpm test:e2e；无则写“无”>` |

所有命令必须先在 package.json、CI 或项目文档中核对真实脚本名称。`pnpm audit`、覆盖率和 E2E 的失败或缺失必须如实报告，不能用构建成功替代。

## 7. UI 验收矩阵

- 支持端与响应式范围：`<待填写：桌面端、平板端、移动端的支持范围与 CSS 断点；断点应以内容布局需要为依据，不只按设备型号划分。若某端不支持，必须写明“不支持”及对应降级行为>`
- 桌面验收视口：`1024、1280、1366、1440、1920；使用 CSS 像素；还原模式另在设计稿明确标注的视口、DPR 和浏览器下进行视觉对比`
- 平板验收视口：`<待填写：例如 768、820、1024；按项目需要覆盖横屏与竖屏>`
- 移动验收视口：`<待填写：例如 320、360、375、390、414；至少覆盖竖屏，必要时覆盖横屏；纯中后台不可只写“不适用”，应说明是否不支持及小屏降级行为>`
- 主题/配色模式：`light、dark；切换后无未变色元素，Ant Design token 与 CSS Variables 同步；若项目只支持一种模式须明确写出`
- 必查状态：`loading、empty、error、unauthorized、disabled、success、安全可重试；每个状态绑定真实接口或明确标注 mock`
- 必查交互：`zh-CN / en-US 切换无溢出（英文按 1.3 倍长度预留）；主题与语言切换刷新后保持；<待填写：页面业务交互、键盘操作和可取消动作>`
- 可访问性：`键盘顺序、焦点可见、可访问名称、对比度、表单错误关联、屏幕阅读器语义、减少动态效果；必要时运行 axe 或项目批准的等价检查`
- 布局：`溢出、横向滚动、内容区利用率、长文本、极端数据、断点降级、触摸目标尺寸和固定工具栏稳定性`
- 浏览器与控制台：`<待填写：Playwright/Browser/手动验收工具、支持浏览器与版本、各视口和 DPR 的覆盖矩阵、控制台无新增错误的证据路径>`
- 设计稿视觉对比：`仅在设计稿明确标注的视口、DPR 和浏览器下对比；产出 docs/design/compare/<页面>/ 并排截图与差异清单；视觉对比不替代桌面、平板和移动响应式验收`

视口宽度使用 CSS 像素，DPR 作为独立测试变量记录。验收视口是代表性抽样，不等于项目完整支持范围；每个断点附近至少验证一个临界宽度，避免只在大屏或单一手机尺寸下通过。

## 8. 接口验收

- 非生产环境：`<待填写：环境地址或启动方式；不得写入生产地址的秘密>`
- 测试账号/数据策略：`<待填写：脱敏账号、fixture 或种子数据策略；不得记录密码、令牌和个人敏感数据>`
- 主流程：`<待填写：从真实 UI 进入的主流程、接口和预期结果>`
- 失败与超时：`断网、401、403、4xx、500、超时、取消分别验证；仅对幂等且安全的动作重试；<待填写：具体环境行为>`
- 权限拒绝：`403 走统一无权限态；401 由 request.ts 处理并保留安全返回路径；服务端始终执行最终鉴权`
- 刷新或重新进入后的持久化：`app-locale、app-theme 与页面明确要求持久化的筛选条件；<待填写：具体存储介质、版本和清理策略>`
- 只验证到授权边界的高风险动作：`删除、批量变更、发布、通知和生产写入只验证确认界面、权限拒绝和幂等边界；最终动作需用户明确授权`
- 其余：`<待填写：缓存一致性、并发冲突、分页/排序、文件上传或其他接口特有验收>`

## 9. 能力映射

按当前宿主和项目实际可用能力填写精确名称；没有对应能力写“无”，不要把安装来源当作已安装或已连接。

| 能力 | 当前实现 |
| --- | --- |
| 规划与架构 | `$project-workflow；无设计稿任务的需求整理按项目路由选择最小能力组合` |
| 测试驱动开发 | `$tdd-workflow（hooks / adapter / utils / config / stores 逻辑；按项目测试栈执行 RED → GREEN → REFACTOR）` |
| 安全审查 | `$security-review（身份、输入、秘密、接口和阶段 3 交付前）` |
| UI 设计探索 | `$frontend-design-direction、$design-taste-frontend、$frontend-design；仅无定稿设计源任务使用，还原模式不得改动设计源已定义视觉；输出中的 Tailwind / CSS-in-JS 示例必须转为项目样式方案` |
| 读取并实现设计源 | `Figma 插件（有 Figma 时优先于截图）；$web-design-guidelines（阶段 3 交付前，与 AGENTS.md UI 验证条目合并执行）` |
| 创建或写入设计源 | `无；除非用户明确授权，不创建或修改 Figma 文件及其他外部设计对象` |
| 浏览器真实验收 | `<待填写：Playwright、宿主 Browser 或手动验收；写明实际支持矩阵>` |
| API/文档检索 | `$api-design（有后端文档时只审查不改契约；无文档时起草草案并标“待后端确认”）` |
| 代码托管 | `参考项目条件为 React + TypeScript 纯客户端项目；Next.js 项目只借鉴组件拆分，不借鉴数据获取方式；GitHub 插件仅在用户明确要求远端读取或写入时使用；复杂需求的外部案例检索不得替代项目事实` |
| 发布部署 | `<待填写：部署工具或“无”；发布必须有明确授权和回滚证据>` |
| React 框架最佳实践 | `$vercel-react-best-practices：全量适用，忽略 Next.js / RSC 条目；结合项目 React Router data router、TanStack Query、Zustand 和页面级 React.lazy + Suspense 执行` |

## 10. 维护信息

- 维护负责人：`<待填写>`
- 最近核对日期：`<待填写：YYYY-MM-DD>`
- 变更记录：`<待填写：重大架构、接口、权限或验收矩阵变更的链接>`
