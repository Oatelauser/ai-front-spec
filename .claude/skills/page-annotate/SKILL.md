---
name: page-annotate
description: 页面标注反馈通道（"指哪打哪"）：用户在浏览器页面上圈选区域指认问题，agent 读回结构化标注（坐标+元素诊断）后逐条修改。用户说"在页面上圈/指着说问题/页面上标一下"，或 design-task 冻结循环、frontend-task 验收轮需要用户对页面做可视化微调反馈时进入。
---
<!-- AUTO-GENERATED from .agents/skills/page-annotate. DO NOT EDIT. Run: node .toolkit/scripts/sync-mirror.mjs -->

# Page Annotate（页面标注反馈）

用户不想用文字描述页面问题，想在页面上直接圈划指认。本技能提供：页面标注器（注入式）+ 双轨浏览器路由 + 读回协议。

## 1. 双轨路由（双宿主）

| 轨 | Claude Code 通道 | Codex 通道 | 适用 | 前置条件 |
| --- | --- | --- | --- | --- |
| 隔离轨（默认） | `chrome-devtools` MCP | `node assets/cdp-bridge.mjs launch --url <url>`（可见 Chrome + CDP evaluate，零依赖 Node ≥22） | agent 打开本地原型/开发服务器页面让用户标注 | Claude 零前置自动弹窗；Codex 需本机 Chrome + Node ≥22 |
| 用户轨 | `chrome-devtools-user`（`--autoConnect`） | 同一 `cdp-bridge.mjs`：`user-port` 取端口 → `eval/inject/read --port` | 用户自己 Chrome 里开着的真实页面（内网系统、已登录页） | 同一套 toggle 四步（`chrome://inspect/#remote-debugging`）；Codex 侧**待实测** |

- 轨道选择听用户的话锋（宿主无关）："我的浏览器/真实页面/要登录的页面"→用户轨；其余默认隔离轨。含糊时问一句。
- 用户轨 toggle 未开时两条宿主通道都会**响亮报错**（提示去开 toggle），这是特性：**绝不静默换轨**，防止用户以为在真实页、实际在隔离窗口。
- Codex 通道为 2026-09-30 实测裁定：宿主 browser 工具不注入 exec 会话，shell+CDP 脚本即正式通道（依据见 DECISIONS「Codex 标注通道 C 转正」）。
- 注入式标注器是只读 DOM 装饰：不改变页面行为、不发送数据；用户轨=真实身份，agent 在真实页面上只做读取与展示，任何写操作需用户明示。

## 2. 注入协议（通道无关三步）

任意能「打开页面 + evaluate」的浏览器通道皆可承载，三步等价：**打开目标页 → evaluate 注入 `assets/page-picker.js` 全文（返回值应为 `'installed-v2.7.2'`）→ evaluate `__picker.read()` 读回**。脚本本体是**单例**：重复注入自动 destroy 旧实例并迁移遗留标注（含已读状态），无幽灵监听器。**刷新归 agent 管**：修改代码 → reload → 重新注入 → 请用户验收；每轮修复循环结束（reload 前）先 `read()` 消化未读标注。

### Claude Code（chrome-devtools MCP）

1. Read `assets/page-picker.js`，以 `() => { <文件内容> }` 形式 `evaluate_script` 注入目标页（pageId）；注入及一切带副作用的模拟脚本必须传 `waitForStableDom: false`，否则脚本会被默认稳定等待机制重跑（注入跑 N 遍、编号虚增）。
2. **修复轮对照**：reload 并重新注入后，立即 `evaluate_script` 调 `__picker.ghost(上轮 read() 的 marks[].rect)`，上一轮标注以灰色虚线重画（近似坐标）供用户对照验收；「提交」自动清除，HUD 可开关。

### Codex（assets/cdp-bridge.mjs，零依赖 Node ≥22）

1. `node .agents/skills/page-annotate/assets/cdp-bridge.mjs launch --url <url>` → 输出 `{port, targetId}`（可见 Chrome、一次性 profile；脚本统一 Page.navigate 开页——`/json/new` 带 url 对 `file://` 拒载、新 profile 首启 intro 抢 URL，两个实测坑均已内置规避）。
2. `node …/cdp-bridge.mjs inject --port <port> --file …/assets/page-picker.js` → 输出 `'installed-v2.7.2'`（脚本自动 IIFE 包装顶层 `return`——实测坑：裸 evaluate 会 SyntaxError）。
3. 用户标注后 `node …/cdp-bridge.mjs read --port <port>` → read() JSON；`eval --expr` 可执行任意补充诊断。
4. 刷新循环：`eval --expr "location.reload()"` → 重新 inject；修复轮对照：`eval --expr "__picker.ghost(<上轮rects JSON>)"`。
5. 用户轨：用户开 toggle 后 `user-port` 取端口，其余命令同上（此路径待实测）。

## 3. 标注交互模型（告知用户的话术）

- **圈选**：拖拽画自由矩形；吸附开（默认）时悬停出布局框，单击按该框标注（已标注区域内同样出框可标）；同一元素不重复成标（HUD 提示「已标注 #n」）。
- **爬梯**：悬停时 `Alt+滚轮` 上/下选父/子元素框（普通滚轮仍是页面滚动；标注区内可用，免加标下钻）。
- **嵌套**：标注共存嵌套——已标 A 内单击子区域 B = 新增 B，A 保留；连点逐层加深（每点一层）。
- **删除**：悬停标注 → 右上角 ✕ 单击删除；`Delete`/`Backspace` 删悬停标注；撤销/清空兜底；面板整块可拖动且豁免标注。**单击/双击永不删除**。
- **取消拖拽**：`Esc` 丢弃拖拽中的框。
- **提交**：锁定本批（并清除对照虚线），用户回终端说「读」；继续标注可解锁追加。
- **编号**：创建时定终身、删除后不复用；已被读取的标号在页面上变淡（50%）但保留作上下文；reload 后归零。
- **锚定**：单击标注锚定其元素，resize/滚动/`read()` 时按元素当前盒子重画；拖拽自由框不锚定（resize 漂移为已知极限）；锚元素消失时 `read()` 该条返回 `anchorLost: true`。
- 无效标注被拒绝（拖框宽或高 <12px、无真实盒子的元素点击都不成标）。

## 4. 读回协议

用户说「读」后：

1. `evaluate_script` 调 `__picker.read()`，得到 `{ marks: [{n, read, anchorLost, rect, elements}], newCount, scroll, viewport }`；`n` 为终身编号；`elements[0]` 为锚元素（如有，带 `anchor: true`），其余按具体度排序（选择器/文本/字号字重/颜色/矩形，前 10）；`anchorLost: true` 表示锚元素已被改动移除（fail-loud，勿静默忽略）。
2. **逐块截图**：对每个未读 mark，滚动到其位置 `take_screenshot`，以"用户看到的"核对元素清单，防误判区域内容。
3. **回显核对**：把每块编号+覆盖内容摘要列表发给用户确认编号对应无误，再逐条接收需求派活。
4. 已读标号不重复派活；多批次靠"已读"状态区分，不靠批次号。

## 5. 被引用契约（供其他 Skill 调用）

| 调用方 | 场景 | 入参 | 出参 |
| --- | --- | --- | --- |
| `$design-task` 冻结循环 | 候选稿/定稿给用户翻选微调 | 页面 URL（file:// 或 dev server）+ 隔离轨 | 标注清单+元素诊断 → 修订依据 |
| `$frontend-task` 验收轮 | 已实现页面/真实页面的微调反馈 | dev server URL 或用户轨真实页面 | 同上 → 修复依据 |

调用即"打开页面 → 注入 → 用户标注 → 读回"，不重复实现。

## 6. 降级与边界

- **仅交互模式**：触发条件均含真实用户在场（用户的手产生标注），`auto` 模式 / subagent / CI 会话**不触发、不阻塞**，验收自动落回既有通道（验收矩阵、快照 uid 断言、impeccable、`$webapp-testing`）。agent 自验有自己的工具，不需要也不应模拟用户标注。
- 通道浏览器不可用（MCP 失联或 cdp-bridge 启动失败）时降级为**静态截图标注**：发截图给用户，用户画框贴回，agent 按快照 uid 对账元素。
- 只解决**静态视觉反馈**；流程/交互态问题（点击后跳转错等）仍走文字描述。
- 桌面鼠标交互；touch 不支持。

## 7. 未实现备查

- **localStorage 持久化**（2026-09-29 裁定不做，需时再补）：标注跨刷新存活。设计草案：仅 `file://` 与 `localhost` 生效；自净协议=全部读走后清键、恢复只恢复未读、7 天过期丢弃。不做的原因：localStorage 不会自动删除，用户不接受残留。
