# Design Task 操作手册

`$design-task` 是专业 UI 设计 lane：设计系统先行、2–3 个视觉变体、用户翻选、多轮修订、定稿冻结。它不写业务代码、不建框架路由，实现交给 `$frontend-task`。

## 1. 适用与分流

使用 `$design-task`：

- 用户要求品牌化或审美驱动的专业界面；
- 需要多轮视觉修订或设计系统；
- 需要把最终稿冻结为可交接版本。

使用 `$prototype`：只验证一次方向、交互或状态模型。已有页面的间距/对齐/局部文案问题，直接走 `$frontend-task`；系统性视觉方向变化，回到本 lane。

## 2. 开始前读取

```text
AGENTS.md
docs/PROJECT_PROFILE.md
.toolkit/profile-state.json → deliveryTargets
docs/rules/AI_COMPONENT_CATALOG.md
```

目标端缺失、冲突或 deferred 时先 `$project-profile update`。`webview` 或 `mobileH5` 已确认时，设计阶段同步考虑触控目标、安全区、短屏和滚动容器。

## 3. 标准流程

### 3.1 Brief

记录业务目标、用户、页面/流程、目标端、内容密度、品牌约束、已存在组件、必须保留的行为、资产和验收条件。可参考 `.agents/skills/design-task/templates/design-brief.md`。

### 3.2 设计系统

先确定语义色、字体层级、圆角、间距、阴影、密度、明暗模式和反模式清单。已有 `SYSTEM.md` 时继承；没有时先冻结系统，再出稿。Stitch 可用时创建设计系统，所有 Screen 使用同一 `designSystem`，更新后逐页回读。

### 3.3 Stitch 出稿

```text
list_projects
→ create_project（没有项目时）
→ get_project
→ generate_screen_from_text
→ list_screens / get_screen
→ generate_variants
```

变体一次只探索一个维度：`COLOR_SCHEME`、`LAYOUT`、`TEXT_FONT`、`TEXT_CONTENT`、`IMAGES`。通常生成 2–3 个，并将 prompt、projectId、screenId、尺寸、版本和选择理由记录到 `PROMPTS.md`。

Stitch 不可用时可自写 HTML 原型，但必须报告降级原因。

### 3.4 微调

使用 scoped prompt，明确一个目标和“不修改”清单：

```text
只修改 Hero 区域的主按钮：改为品牌主色，保持尺寸、文案、导航和页脚不变。
```

`edit_screens` 返回成功不等于已持久化。编辑后必须重新读取 HTML、截图和元数据；没有变化就保留旧快照，改用网页端编辑或重生成，并记录来源。

### 3.5 下载与归档

下载阶梯：

1. 直接 GET：显式代理、manual redirect、校验 `200`、`Content-Type`、DOCTYPE 和真实标题；失败不得生成成功快照。
2. 使用宿主已授权的浏览器会话。
3. 使用 Stitch 网页端导出 ZIP，再由智能体解包归档。

`downloadUrl` 是临时地址，不写入生产代码。图片、字体、图标单独记录；PNG 校验文件签名。

推荐结构：

```text
.stitch/project.json
.stitch/manifest.json
.stitch/snapshots/<screen-id>/<snapshot-id>/
  source-response.json screen.json screen.html screenshot.png
  assets/ design-tokens.json layout-metrics.json checksums.json

docs/design/system/SYSTEM.md
docs/design/<feature>/vN/
  code.html DESIGN.md screen.png PROMPTS.md CONTRACT.md
```

快照不可覆盖；记录 CSS viewport、截图像素尺寸和 DPR，未知 DPR 写 `null`。

### 3.6 定稿冻结

检查内容漂移、额外生成的模块、文字截断、占位资源、颜色、字体、间距和目标端。版本递增，不覆盖旧稿。

## 4. 交接给 `$frontend-task`

至少交接：

- 视觉定稿版本、覆盖区域和状态；
- 路由、工程组件和 token 约束；
- 交互契约、九状态和待确认项；
- 图片、字体、图标及 fallback；
- 视口、主题、键盘、触摸、溢出和截图基线。

`screen.png` 是参照，不是背景图；`code.html` 是参考，不原样复制进生产页面。

## 5. 场景速查

| 场景 | 做法 |
| --- | --- |
| 无参照新页面 | 快速方向 `$prototype`；专业审美 `$design-task` |
| 已有设计系统 | 读取 `SYSTEM.md`，继承 token 后出稿 |
| 多视觉方向 | 一次只变一个维度，用户选择后修订 |
| 设计系统升级 | 新建系统版本，应用后逐页回读 |
| Stitch 下载失败 | 保留失败证据，换浏览器或 ZIP，不伪造成功 |
| 实现偏离定稿 | 先判断实现质量、局部替换或方向变化，再分流 |
