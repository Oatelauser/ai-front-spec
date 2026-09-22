# elms-h5 快照规则通用性分类报告

> 来源：快照 `project-overlay/.codex/skills/references/` 三文件逐条分类（2026-09-21）。
> 同一规则在文件内多节重复出现的已合并为一条（如 Orval/qisi 禁令出现 3 次、文件 id 直链规则跨节重复）。
> 供「WebView 规则层结构与适用域标注」「兼容性矩阵草案」工单使用。

## api-services.md（30 条）

| 规则摘要 | 分类 | 私有名词 |
| --- | --- | --- |
| 请求封装三层分工：统一 Axios 实例/成功码/Token 头/错误提示；Token 获取刷新登出；请求类型 | 半通用 | `src/service/request/{index,shared,type}.ts` |
| custom-api 为项目唯一手写 API 契约目录（含 auth.ts 登录/用户信息/登出契约） | 私货 | `src/service/custom-api` |
| 历史生成目录 qisi-efficiency-* 禁改/禁导入，触达即迁移 custom-api | 私货 | `src/service/api/qisi-efficiency-*` |
| 禁止运行 Orval / pnpm run api，禁改 orval.config.cjs 与生成配置 | 私货 | `orval.config.cjs`、Orval、`pnpm run api` |
| 统一按 `{ error, data }` / `{ error, response }` 解构调用 | 半通用 | request 封装返回签名 |
| 封装已统一处理网络异常与错误提示，业务层不重复 try/catch | 通用 | — |
| 先判 error 再用 data/response | 通用 | — |
| responseType 非 json 时按原始数据返回（Blob/文件流/图片） | 半通用 | request 封装 responseType 行为 |
| 登录 Token 在响应头 `response.headers.token`，勿假设 data.token | 私货 | 后端登录契约 |
| 认证逻辑优先复用 auth store 与 auth 契约 | 半通用 | `src/store/modules/auth(+shared.ts)`、`custom-api/auth.ts` |
| 表单字段与后端返回一致，详情/编辑回显不加中间映射层 | 通用 | — |
| 多页面共用接口数据沉淀 Pinia store，统一刷新/格式化/清除 | 半通用 | `src/store/modules` |
| store 缓存刷新时机（入口/keep-alive 激活/关键成功回调；登出、401、切用户必清） | 通用 | — |
| 新接口手写强类型，以后端 Controller/OpenAPI 契约为准 | 半通用 | `src/service/custom-api` |
| 401/登出码走统一登出重置逻辑，页面不重复跳转 | 通用 | — |
| 特殊业务反馈走统一 message 工具，不直接从 vant 导入 showToast/showDialog | 半通用 | `@/utils/message` |
| showErrorTips 选项控制是否显示后端错误提示 | 半通用 | `showErrorTips` |
| 调试日志不输出 token/完整用户对象/完整响应，交付前删除 | 通用 | — |
| 企业 WebView OAuth 由后端换 Token，前端只收短时 code/state | 通用 | — |
| 回跳写登录态复用 auth store 既有链路 | 半通用 | `casLogin()/setToken()/getUserInfo()` |
| URL 中 Token/code 处理完用 router.replace 清理地址栏敏感参数 | 通用 | — |
| WebView SDK 身份/临时 code/租户/corp 标识按不可信输入，不写日志 | 通用 | — |
| redirect 仅允许站内相对路径，防开放重定向与 /login 自循环 | 通用 | — |
| Blob/上传/下载通过第二参数传 responseType、headers 等 Axios 选项 | 半通用 | request 封装第二参数 |
| 文件 id 普通展示用 getFileAllUrl 直链（loading 不等图片）；须读 Blob 才用 getImageUrl | 半通用 | `getFileAllUrl`、`getImageUrl` |
| 下载文件名用业务名+扩展名，不信用户/后端原始文件名 | 通用 | — |
| URL.createObjectURL 预览地址在替换/删除/卸载时释放 | 通用 | — |
| 表单保存后端文件 id，不存 blob URL/base64/临时预览地址 | 通用 | — |
| 不在业务页手写 axios/fetch（封装无法表达时除外） | 通用 | — |
| 不复制后端 DTO，用交叉类型/Pick/Omit 局部扩展 | 通用 | — |

## mobile-ui-assets.md（51 条）

| 规则摘要 | 分类 | 私有名词 |
| --- | --- | --- |
| 全屏高度统一用 h-app-screen（100vh fallback→100svh），不写裸 h-svh/h-100vh | 半通用 | `h-app-screen` |
| 沉浸页 viewport 锁缩放 + viewport-fit=cover，全局 visualViewport 同步，单页不重复注册 | 半通用 | `h-app-screen`、全局 visualViewport 机制 |
| 不只以桌面 Chrome 为依据；图标+文案控件预留整体宽高防裁切；贴边控件 safe-area/calc 边界约束 | 通用 | — |
| 常规页/页面头/沉浸页优先用全局布局组件（head/main、插槽定制） | 半通用 | `page-layout.vue`、`page-head.vue`、`login-layout.vue` |
| 间距用 gap 不用 space-x/y；table-like 用 border-separate+border-spacing | 通用 | — |
| 常见移动视口下文字/按钮/图片不重叠，固定区域明确宽高约束 | 通用 | — |
| 带热点背景保持等比坐标系，禁独立 scaleX/scaleY 与 fill 拉伸；长短屏裁切/滚动策略 | 通用 | — |
| 旧 WebView CSS 兜底集中维护在全局样式入口（translate/color-mix/bg-clip-text/svh/透明遮罩高风险点） | 半通用 | `src/styles/index.css`、`app-loading.css` |
| 企业容器 CSS 兼容统一走既有兼容插件层，新容器复用扩展 | 半通用 | `build/vite-plugins/dingtalk-css-compat.ts` |
| 透明遮罩复用全局 bg-black/0-90 兜底；半透明背景用明确色值，避免未兜底 Tailwind 透明色 | 半通用 | 全局 `bg-black/<opacity>` 兜底类 |
| 关键定位用 `@supports not (translate)` fallback 或显式 transform；弹窗定位由基础 Dialog 内建，业务不重复声明（防双重偏移） | 半通用 | `DialogContent`、`@supports not (translate)` |
| 不只依赖构建插件自动降级现代 CSS，保留项目级兜底；严格旧内核可评估 Tailwind v3.4 | 通用 | — |
| 不顺手调整已有 class 顺序，避免无关样式 diff | 通用 | — |
| 新页面先查局部 components/modules/constants/utils，再查全局组件层 | 半通用 | `src/components/{common,ui,mall}`、`packages/ui`、`src/layouts/components` |
| 页面私有组件放页面目录，跨页复用才提升全局 | 半通用 | `src/components/common`、`src/components/<domain>`、`packages/ui` |
| 自动注册范围与例外：src/components/** 直用标签；layouts 与 modules/** 例外需局部导入；改范围动构建配置并重新生成声明 | 半通用 | `unplugin-vue-components`、`vite.config.ts`、`components.d.ts`、BackButton/Loading/Empty/SvgIcon/TabsBlock/PagPlayer 等组件名 |
| 统一返回按钮内建 canGoBack/back/fallback；页面头 back 事件透传，阻止默认用 @back.prevent 或自定义插槽 | 半通用 | `BackButton`、`PageHead`、`canGoBack()`、`fallbackTo/backUrl` |
| 业务态 UI 优先用项目 UI 包装层（Button/Dialog/Select/TabsBlock） | 半通用 | `src/components/ui` |
| 基础 UI 包分层与引用方式；共享组件复用 cn / isAppleMobileDevice 工具 | 半通用 | `packages/ui`、`@elms-h5/ui`、`packages/ui/src/utils.ts` |
| Apple 设备输入字号 16px 防聚焦缩放；placeholder 样式作用到真实 input/textarea | 半通用 | `inputClass/placeholderClass` 入口 |
| 局部 loading 与空态复用公共组件（父级 relative、name/show/description 定制） | 半通用 | `loading.vue`、`empty.vue`、Spinner/Empty |
| 商城域组件优先查对应域组件目录 | 半通用 | `src/components/mall` |
| 富文本展示复用统一 viewer，不新增未清洗 v-html | 半通用 | `rich-text-viewer.vue` |
| 弹窗/抽屉/Toast/Dialog 反馈走项目统一入口，不散落 Vant API | 通用 | — |
| 异步确认契约：confirm 入口支持 onOk 返回 Promise，期间仅确认按钮 loading，失败保持打开 | 半通用 | 项目 confirm 入口、`onOk` |
| 异步确认期间不禁用取消/关闭按钮（除非业务显式约束） | 通用 | — |
| i18n：locale 随 setLocale 切换，统一用项目 locales 入口 | 半通用 | `src/locales/index.ts`、`@/locales`、`$t/setLocale` |
| 新文案同步全部语言包；公共文案 common.*、页面文案 page.*，先查重复用 | 半通用 | `zh-cn.json`、`en-us.json`、`common.*`、`page.*` |
| 页面结构变化按需运行路由生成命令 | 半通用 | `Elegant Router`、`src/router/elegant`、`pnpm gen-route` |
| 新增页面核对生成的 route name/path/i18nKey/布局 | 通用 | — |
| 页面目录按 _static/_dynamic/_demo 分层；根路由/404/login 常量路由配置固定 | 私货 | `_static/_dynamic/_demo`、`src/router/routes/index.ts`、`/home`、login/403/404、`vite.config.ts` |
| 返回逻辑先判空历史再 router.back，有业务入口显式兜底 | 半通用 | `canGoBack()` |
| 静态资源目录约定：图片按域放 imgs/，首屏必载资源放 preload/，资源目录不放 TS 导出文件 | 半通用 | `src/assets/imgs`、`src/assets/preload(+README)` |
| Figma 位图统一 4x 导出，SVG 保持矢量 | 通用 | — |
| 本地 SVG 走图标组件使用 | 半通用 | `SvgIcon`、`qisi-icon-[dir]-[name]` 前缀 |
| 文件 id 展示用直链工具（loading 不等图片），Blob 场景才用文件流工具并按生命周期 revoke | 半通用 | `getFileAllUrl`、`getImageUrl`、`revokeImageUrl/revokeAllImageUrls` |
| 高清整屏位图按最大 CSS 尺寸×DPR（iOS 常 3）核对源像素，压缩不替代源图 | 通用 | — |
| APNG/PAG 动画复用公共播放组件与工具 | 半通用 | `apng-image.vue`、`pag-player.vue`、`pag-utils.ts`、`assetsInclude` |
| 大资源评估包体与首屏影响；新资源类型先确认打包归类与缓存 | 半通用 | Vite 输出分组配置 |
| 页面样式优先 scoped；共享样式/token 变更先查全局影响 | 通用 | — |
| 渐变+描边标题用项目双层文字结构与 CSS 变量；特定字体走已注册字体变量 | 私货 | `qisi-title-text*`、`--qisi-title-text-*`、`--font-lin-hai`、LinHai/临海体 |
| 图标优先用已有图标库/资源，不手写复杂 SVG | 通用 | — |
| 新增 UI 变量/组件先判断归属层级（业务 UI 层/公共层/基础包/页面私有） | 半通用 | `src/components/ui`、`src/components/common`、`packages/ui` |
| 纯展示文本不用原生 button；用 button 时文字 class 加 !important 防基础样式覆盖 | 通用 | — |
| 企业 WebView 容器一律按能力不完全一致处理（现代 CSS/History/视口/摄像头） | 通用 | — |
| WebView 环境判断集中统一模块并暴露语义函数，不散落 UA 判断 | 半通用 | `src/utils/browser.ts`、`isDingTalkWebView()` 等 |
| JSBridge/SDK 先存在性/能力检测再懒初始化，页面只调封装 | 通用 | — |
| WebView 登录授权页空历史用显式 router.replace/push 兜底 | 通用 | — |
| OAuth/code/租户等注入参数不可信，遵循安全文档 | 通用 | — |
| 扫码/摄像头复用公共 hooks，保留后置摄像头与手动输入兜底 | 半通用 | `src/hooks/common` |
| WebView 适配交付前 320–450px 多断点+连续宽度抽查，尽量真机复核 | 通用 | — |

## security-content.md（22 条）

| 规则摘要 | 分类 | 私有名词 |
| --- | --- | --- |
| 后端富文本/评论/用户 HTML/外链/文件名一律按不可信内容处理 | 通用 | — |
| 不新增裸 v-html，富文本渲染走统一清洗组件 | 半通用 | `rich-text-viewer.vue` |
| token/用户信息/权限码/租户信息不入 URL/错误提示/前端日志 | 通用 | — |
| 业务页不 console 完整响应；作者已有日志不因无关需求删除 | 通用 | — |
| 普通文本/昵称/评论默认纯文本渲染，依赖框架转义 | 通用 | — |
| Markdown/活动说明统一封装渲染与清洗，不散落配置 | 通用 | — |
| 外链仅允许明确协议白名单（http/https/mailto）；新窗口补 rel="noopener noreferrer" | 通用 | — |
| 维护旧 v-html 页面不盲目扩大范围（现有清洗组件基于 DOMPurify） | 半通用 | rich-text-viewer、DOMPurify/wangeditor 现状 |
| 文件 id 展示直链 / Blob 工具 / 按生命周期 revoke | 半通用 | `getFileAllUrl`、`getImageUrl`、`revokeImageUrl/revokeAllImageUrls` |
| 仅封装无法表达时直接 createObjectURL，且必须 revokeObjectURL | 通用 | — |
| 表单保存后端文件 id，不存 blob URL/base64/临时地址 | 通用 | — |
| 下载文件名用业务名+扩展名，不信任原始文件名 | 通用 | — |
| 上传前校验类型/大小/数量，反馈走统一消息工具 | 半通用 | `@/utils/message` |
| 导入失败详情为文件流时按 Blob 下载，不把二进制塞进页面 | 通用 | — |
| 批量导出/删除/核销/兑换/提交前校验状态与权限/登录态 | 通用 | — |
| 二维码/兑换码/订单号等凭证不在日志/URL/提示暴露完整值 | 通用 | — |
| 特殊错误提示不含 token/SQL/堆栈/完整响应；页面不打印 token/完整用户对象 | 通用 | — |
| 临时排查用最小信息日志，交付前删除 | 通用 | — |
| WebView 注入 query/hash/JSBridge 返回值按外部输入处理 | 通用 | — |
| code/state/tenantId/corpId/redirect/临时 Token 不入日志/Toast/外链/缓存 | 通用 | — |
| redirect 仅站内相对路径，禁外部/协议相对/含敏感参数 URL | 通用 | — |
| WebView 打开外链/下载/复制继续遵守协议白名单与最小暴露 | 通用 | — |

## 统计

| 文件 | 通用 | 半通用 | 私货 | 合计 |
| --- | --- | --- | --- | --- |
| api-services.md | 15 | 11 | 4 | 30 |
| mobile-ui-assets.md | 19 | 30 | 2 | 51 |
| security-content.md | 18 | 4 | 0 | 22 |
| 合计 | 52 | 45 | 6 | 103 |

另注：文件 id 直链/Blob、redirect 白名单、WebView 参数不可信、ObjectURL 释放四组规则在三个文件中重复出现，上移通用层时合并为单一条目。

## 半通用规则的去私有化改写要点

- 路径 → 角色称呼：`src/service/request/*`→"项目统一请求封装层"；`src/store/modules`→"全局 store"；`src/components/{common,ui,mall}`、`packages/ui`、`src/layouts/components`→"全局组件层/基础 UI 包/布局组件层"；`src/locales`→"i18n 入口"；`src/utils/browser.ts`、`src/hooks/common`→"环境判断模块/公共 hooks"；`src/assets/*`、`src/styles/index.css`→"静态资源目录约定/全局样式入口"。
- 封装签名 → 能力描述：`{error,data,response}`、第二参数 options、`showErrorTips`→"请求封装的返回结构与配置项"；`casLogin/setToken/getUserInfo`→"认证 store 既有 action 链"；`canGoBack()`→"空历史判断工具"；`getFileAllUrl/getImageUrl/revoke*`→"文件直链工具/文件流工具及其释放方法"；confirm 的 `onOk`→"统一确认弹窗的异步契约"。
- 组件名 → 职能称呼：BackButton/PageLayout/PageHead/LoginLayout→"统一返回按钮/页面布局/页头/沉浸页布局组件"；Loading/Empty/SvgIcon/Dialog(DialogContent)/TabsBlock/PagPlayer/rich-text-viewer→"公共加载/空态/图标/弹窗基座/富文本清洗组件"；qisi-icon 前缀→"SVG symbol 前缀（按项目配置）"。
- 类名/CSS 变量：`h-app-screen`→"全局全屏高度类（100vh fallback + 100svh 覆盖）"；`bg-black/<opacity>` 兜底→"全局透明遮罩 fallback"；`qisi-title-text*`、`--font-lin-hai` 无通用价值，降级为"双层描边+渐变文字、字体走已注册变量"的通用做法（本条原判私货，相邻半通用条目引用时用此说法）。
- 工具链决策只留模式：Orval/qisi-efficiency/orval.config.cjs/pnpm run api→"废弃的生成代码只迁移不修复不重生成"；pnpm gen-route/Elegant Router/unplugin-vue-components/dingtalk-css-compat.ts→"路由与组件注册的生成机制（命令和插件名留给项目层）/既有 CSS 兼容插件层"。
- 后端契约：`response.headers.token`→"Token 位置以后端契约为准"；文件 id 体系→"后端文件标识"。
