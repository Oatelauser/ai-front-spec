# 页面实现与验收提示词

本模板用于所有改动落在页面或视图组件文件（`.vue`/`.tsx`/`.jsx` 等）或全局样式、主题、构建配置的任务，路由判定以 `AGENTS.md` 任务路由行为准。先填写 [项目画像](../PROJECT_PROFILE.md)，并读取 [组件目录](AI_COMPONENT_CATALOG.md)。

通过 [$frontend-task](../../.agents/skills/frontend-task/SKILL.md) 执行，来源和阶段细节见其 references。缺少项目规则或画像时提示 `$project-profile`；画像维护不混入页面任务。目标目录不是工具包自身。

任务输入可以是对话或 `.agents/skills/frontend-task/templates/frontend-task.template.json` 的实例：taskType 支持 new-page、incremental、bug-fix、refactor；sources 每项包含 type（screenshot/prototype/html/figma/api/requirement）、path 或 url、版本及适用的 viewport/DPR。另提供目标路由/路径、保留约束、验收和已确认决定。实例留在业务项目任务记录，不修改模板源。

全流程契约：`inspect`、`plan`、`implement`、`verify`、`report` 每一阶段都必须读取 `PROJECT_PROFILE.md` 的“支持端与运行环境”、`.toolkit/profile-state.json.deliveryTargets` 和 `AI_COMPONENT_CATALOG.md`。计划必须记录适用端、关键视口、组件复用/扩展/业务域/页面私有决策及目标端变体；plan 中的视觉判定、行为推断、token 取值等结论逐条标注证据等级：已测量（材料可直接确认）、有依据的推断（跨材料归纳）、暂时假设（材料不足采用的默认值，须明示）；组件目录与画像不一致时先执行 `$project-profile update`，或记录任务级确认；`deliveryTargets` 缺失、冲突或处于 `deferred` 时不得猜测目标端，页面声明扩端必须走 update 访谈与矩阵复检，不得以任务级确认放行。

## 可直接使用

```text
遵循当前仓库的 AGENTS.md 和项目工作流，按项目路由选择必要的设计、实现、测试和浏览器能力。

使用 `$frontend-task`；如果当前宿主不能根据仓库规则自动发现项目工作流，再显式加载 `$project-workflow`。

目标：
- [页面或流程最终要实现的用户结果]
- 目标路由：[精确路由]

上下文：
- 业务依据：[需求、原型、接口契约或现有页面]
- 视觉依据：[设计文件、截图、参考系统或“沿用项目设计系统”]
- 工程依据：[邻近路由、公共组件、主题、国际化、权限、API 与测试]
- 接口范围：[真实接口、待接入接口或无接口]

约束：
- [必须保留的业务规则、权限、安全边界和不可修改范围]
- 业务事实、视觉事实和工程事实分别处理，不用一种来源覆盖另一种来源。
- 先复用现有组件和基础设施，不创建重叠实现。

完成条件：
- [关键交互、页面状态和业务结果]
- 针对性测试与项目总质量门禁通过。
- 浏览器已按项目画像验证桌面/移动、主题、主交互、键盘、焦点、溢出、可访问性和控制台。
- 已按 `deliveryTargets` 验证所有声明的端类型；未验证端必须列在未验证项中。
- 已核对组件目录中的目标端变体、触摸行为、安全区域和短屏规则。
- 换一组文案、图片和数据，页面规则仍保持一致（长文本、空数据、极端值不破坏布局）。
- 接口适用时，已从真实 UI 验证非生产主流程、失败、权限和刷新持久化。
- [未验证项；没有则写“无”]
```

## 阶段子命令与任务记录

`$frontend-task` 支持 `inspect`、`plan`、`confirm`、`implement`、`verify`、`report` 和 `resume` 子命令，也支持按依赖顺序组合调用。直接提出实现请求时，必须先执行 inspect 和 plan，并判断高影响决策；高影响信息未确认时停在确认阶段，不能因为“直接实现”而绕过判断。

需要多轮确认、跨会话恢复、正式验收或明显截图/原型/HTML 材料时，在 `docs/tasks/<task-id>/` 保存 `TASK.md`、`PLAN.md`、`STATE.json`、`ACCEPTANCE.md` 及必要的 `assets/`。来源材料记录路径或 URL、版本、读取时间、视口/DPR 和摘要；本地截图、原型和 HTML 可复制到 `assets/`。任务级 override 只对当前任务有效。

## 页面执行契约

1. 分别确认业务、视觉和工程事实源。
2. 搜索邻近路由、公共组件、业务域组件、主题、国际化、权限、API 与测试。
3. 编码前记录主要可见区域的组件决策：复用、扩展、业务域组件或页面私有结构。
4. 新规则、组件和关键交互执行 RED → GREEN → REFACTOR。
5. 完整处理 loading、empty、error、unauthorized、disabled、success 和安全可重试状态；涉及交互组件时，同时覆盖 hover（限指针设备）、focus-visible、pressed（:active）和 selected（Tab/导航/行选中）交互态。
6. 禁止用硬编码成功数据、静默 Mock 回退、跳过权限或吞异常伪造可用性。
7. 自动化通过后打开每个目标路由并实际操作；接入接口时再完成真实联调验收。
