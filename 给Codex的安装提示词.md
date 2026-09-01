# 可直接交给 Codex 的安装提示词

把本文件和 `通用模板/` 一起交给 Codex，或复制下面代码块作为新任务。默认安装“完整模式”；若只需要后端或非 UI 项目，把“完整模式”改成“核心模式”。

```text
请为当前 Codex 环境安装并验证这套通用提示词工程需要的插件和 Skill。

目标：
- 读取提示词工程包，按“完整模式”安装所有缺失能力。
- 已安装能力不重复安装。
- 本轮完成安装；新安装独立 Skill 时，在新对话完成发现性验证。

前置边界：
- 先确认通用模板是否已经合并到目标仓库。
- 若尚未合并，本任务只安装外部插件和 Skill，并把 $project-workflow 标记为“等待模板接入”；
  不擅自修改目标项目。

必须先读取：
1. 本提示词工程根目录的 README.md。
2. 通用模板/docs/AI_CAPABILITY_REQUIREMENTS.md。
3. 通用模板/.agents/skills/project-workflow/references/task-routing.md。
4. 通用模板/docs/PROJECT_PROFILE.md。

插件安装：
- 使用 Codex Plugin Management 搜索并安装：
  - product-design@openai-curated-remote
  - figma@openai-curated-remote
  - github@openai-curated-remote
- 已安装且启用时跳过。
- 只安装上面三个精确插件，不选择相似名称。
- browser@openai-bundled、chrome@openai-bundled、computer-use@openai-bundled 属于宿主能力；
  只检查是否可用，不从公共插件目录安装。
- Figma 和 GitHub 需要连接时，使用宿主提供的连接流程；不要索取或记录令牌。
- 完整模式要求安装 Figma、GitHub，但当前任务不使用时可以保持“未连接（当前不要求）”。

Skill 安装：
- 优先使用系统自带的 skill-installer；也可以执行依赖清单中的固定 npx skills add 命令。
- 只从依赖清单固定的 GitHub 仓库安装以下缺失 Skill：
  - tdd-workflow
  - frontend-design
  - api-design
  - security-review
  - design-taste-frontend
  - web-design-guidelines
  - vercel-react-best-practices
- 已存在同名 Skill 时不要覆盖。
- 已存在同名 Skill 时读取其 SKILL.md，核对名称、描述和可识别来源；来源无法确认时标记
  “来源未验证”，不要直接当作满足依赖。
- Skill 安装后若要到下一轮对话才可发现，请明确说明并停止在该边界。

验证：
- 按 AI_CAPABILITY_REQUIREMENTS.md 的“完整组合验证”逐项检查。
- Product Design、Figma、Browser、GitHub 能力必须区分“已安装”“已连接”“当前任务可用”三种状态。
- 所有能力使用统一状态：缺失 → 待用户确认 → 已安装 → 已连接（适用时）→ 新对话可发现
  → 当前任务可用。
- 命令退出码为 0 只证明安装命令完成，不能证明当前对话已经发现 Skill。
- 任何名称无法发现、插件无法安装、连接未完成或需要重新开启对话时，都标记为未完成，不能假装成功。

权限与范围：
- 本任务只授权安装和连接清单中的插件与 Skill。
- 不授权修改业务项目代码，不授权创建 Figma 文件、GitHub Issue/PR/提交，不授权发布或生产写入。
- 不更改插件的全局权限模式；保留用户当前默认权限。

交付格式：
1. 插件状态表：名称、精确引用、安装状态、连接状态、可用 Skill、阻塞。
2. Skill 状态表：名称、来源、安装状态、是否需新对话、阻塞。
3. 未完成项与用户下一步。
4. 明确说明是否已经具备 task-routing.md 中的全部组合。
5. 若需要新对话，输出下一节“新对话验证提示词”并停止。
```

## 新对话验证提示词

独立 Skill 安装完成后，在新对话复制下面内容：

```text
继续验证通用提示词工程的能力安装结果，不重复执行安装。

请读取：
- 通用模板/docs/AI_CAPABILITY_REQUIREMENTS.md
- 通用模板/.agents/skills/project-workflow/references/task-routing.md
- 通用模板/docs/PROJECT_PROFILE.md

执行：
1. 检查 $project-workflow 是否已从当前活动项目发现；若模板尚未合并，标记“等待模板接入”。
2. 按“完整组合验证”逐项检查所有精确 Skill 名称。
3. 回读 Product Design、Figma、GitHub 的安装和连接状态。
4. 检查 Browser 是否为宿主内置能力；不要从公共插件目录安装 browser@openai-bundled。
5. 分别报告：已安装、已连接、新对话可发现、当前任务可用。
6. 不修改项目代码，不创建 Figma/GitHub 外部对象，不发布。

只有全部必需名称可发现时，才能说明 task-routing.md 的完整组合已就绪。
Figma/GitHub 已安装但当前未连接时，说明“完整组合已安装，相关任务连接后可用”。
```

## 说明

- Codex 的 Plugin Management 可能显示安装确认界面，这是正常授权流程。
- 如果当前宿主没有插件管理能力，Codex 应只报告缺失项和精确引用，不得用 npm 安装 Codex 插件。
- 如果只把本文件交给 Codex，没有同时提供 `通用模板/`，仍可按本提示词安装；但无法验证项目画像和路由文档是否一致。
