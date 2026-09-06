# 可直接交给 Codex 的环境初始化提示词

把本文件和 `通用模板/` 一起交给 Codex。若只提供本文件，Codex 可以盘点和安装外部能力，但不能验证模板是否已经接入目标项目。

本流程分为三个阶段：

1. 安装前审计：只读取、检查和输出清单，不安装。
2. 批准项安装：只安装用户明确批准的项目。
3. 新对话验证：不重复安装，验证能力是否已经被新对话发现。

前置条件（不计入上述三个安装阶段）：如果目标仓库还没有 `.agents/skills/project-workflow/`，先由用户决定是否把 `通用模板/` 接入目标仓库。接入涉及项目文件合并，不应由安装提示词擅自执行；用户批准后可单独完成合并，再进入第一阶段。模板接入不是通过 `npx skills add` 或 Plugin Management 完成的。

默认使用“按需模式”，不默认安装完整能力集。模式定义以 `通用模板/docs/AI_CAPABILITY_REQUIREMENTS.md` 为准：

- 核心模式：`$project-workflow` + `$tdd-workflow` + `$api-design` + `$security-review`
- UI 模式：核心模式 + Product Design + `$frontend-design-direction` + `$frontend-design` + `$web-design-guidelines` + Browser 宿主能力
- React UI 模式：UI 模式 + `$vercel-react-best-practices`
- Figma 模式：UI 模式 + Figma 插件及连接（连接按需进行）
- GitHub 远端模式：在所需模式上增加 GitHub 插件及连接（连接按需进行）
- 完整模式：以上全部；只有用户明确要求时使用

## 第一阶段：安装前审计

复制下面的提示词作为新任务。此阶段只读，不得安装、连接、授权或修改文件。

```text
你现在处于“安装前审计阶段”。只读取、检查和报告，不执行任何安装、连接、授权、文件复制或文件修改。

目标：盘点当前 Codex 环境是否具备本提示词工程需要的 Codex 插件、宿主内置能力、独立 Skill 和项目 Skill。

文件定位：
1. 优先读取当前工作区根目录的“给Codex的安装提示词.md”。
2. 如果不存在，搜索当前工作区中的同名文件；找不到时停止并报告。
3. 如果存在，读取 README.md、通用模板/docs/AI_CAPABILITY_REQUIREMENTS.md、
   通用模板/.agents/skills/project-workflow/references/task-routing.md 和通用模板/docs/PROJECT_PROFILE.md。
4. 文件缺失、路径不一致或内容无法读取时，明确标记“事实源缺失”，不要自行猜测清单。

先确认模板接入状态：
- 若当前活动项目已有 .agents/skills/project-workflow/SKILL.md，标记“项目 Skill 已接入，待发现性验证”。
- 若只有通用模板/.agents/skills/project-workflow/，不要自动复制或合并，标记“等待用户批准模板接入”。
- 若两者都没有，标记“项目 Skill 缺失”。不要在本阶段创建它。
- project-workflow 不是通过 npx skills add 安装的外部 Skill；它来自通用模板接入。

选择安装模式：
- 读取当前项目画像和本次任务上下文，按需推荐核心、UI、React UI、Figma 或 GitHub 远端模式。
- 若没有足够上下文，推荐核心模式，并把其他模式列为可选项；不要默认推荐完整模式。
- 只盘点和推荐，不因为推荐模式而安装任何项目。

能力分类和检查规则：
1. Codex 插件：检查 Plugin Management 是否存在，以及插件的精确引用、安装和启用状态。
2. 宿主内置能力：检查 browser@openai-bundled、chrome@openai-bundled、computer-use@openai-bundled 是否由当前宿主提供；不要从公共插件目录安装它们。
3. 独立 Skill：检查 $CODEX_HOME/skills 和可用 Skill 清单；读取同名 SKILL.md 的 name、description 和来源，不能只根据目录名判断满足依赖。
4. 项目 Skill：检查当前活动项目的 .agents/skills/project-workflow/，不把它当作全局 Skill 安装。
5. Figma 和 GitHub：分别检查“已安装”和“已连接”；不要索取、输出或记录令牌。

固定外部插件引用：
- Product Design：product-design@openai-api-curated（或当前配置中明确等价的 marketplace 引用）
- Figma：figma@openai-api-curated（或当前配置中明确等价的 marketplace 引用）
- GitHub：github（由 Plugin Management 显示的 marketplace 补全）

固定独立 Skill 来源：
- $tdd-workflow：affaan-m/everything-claude-code，路径 skills/tdd-workflow
- $api-design：affaan-m/everything-claude-code，路径 skills/api-design
- $security-review：affaan-m/everything-claude-code，路径 skills/security-review
- $frontend-design：anthropics/skills，路径 skills/frontend-design
- $frontend-design-direction：affaan-m/everything-claude-code，路径 skills/frontend-design-direction
- $design-taste-frontend：leonxlnx/taste-skill，实际 Skill 名称 taste-skill，路径 skills/taste-skill
- $vercel-react-best-practices：vercel-labs/agent-skills，实际 Skill 名称 react-best-practices，路径 skills/react-best-practices
- $web-design-guidelines：vercel-labs/agent-skills，路径 skills/web-design-guidelines

输出表格。每项都必须包含：
| 类型 | 显示名称 | 精确引用/Skill 名称 | 核心用途 | 固定来源或安装命令 | 已安装 | 已启用 | 已连接 | 当前会话可发现 | 当前任务可用 | 可安装状态 | 阻塞与证据 |
|---|---|---|---|---|---|---|---|---|---|---|---|

状态只使用可核验的值：
- 安装：已安装 / 未安装 / 来源未验证 / 不适用
- 启用：已启用 / 未启用 / 不适用
- 连接：已连接 / 未连接 / 当前不要求 / 不适用
- 发现：可发现 / 当前会话不可发现 / 需要新对话 / 不适用
- 可安装：可安装 / 需要用户授权 / 宿主不支持 / 源不可达 / 路径不存在 / 不适用

注意：命令退出码为 0 只能证明命令完成，不能证明当前会话已经发现 Skill；不安装相似名称、第三方替代品或未列入固定清单的能力；不使用 npm 安装 Codex 插件；不修改业务代码、项目配置或项目文档；不创建 Figma 文件、GitHub Issue/PR/提交，不发布，不执行生产写入。

最后输出：
1. 按需推荐的模式及理由。
2. 推荐安装项、可选安装项和不建议安装项。
3. 当前阻塞项和证据。
4. 一段“批准安装输入”，供用户直接复制并修改：

批准安装模式：<核心模式/UI 模式/React UI 模式/Figma 模式/GitHub 远端模式/完整模式>
批准安装插件：<从表格复制精确引用；没有则写“无”>
批准安装 Skill：<从表格复制 $名称；没有则写“无”>
批准连接：<Figma/GitHub/无；未批准的连接写“当前不要求”>

完成后停止，等待用户明确批准。不要自行进入第二阶段。
```

用户批准时，不需要重新粘贴整张表，只需把第一阶段最后的“批准安装输入”复制回来，填好尖括号中的内容。这就是第二阶段的输入。

## 第二阶段：批准项安装

在第一阶段完成后，用户可以在同一对话回复“批准安装输入”，也可以在新对话中复制下面的提示词，并把批准输入粘贴到末尾。

```text
现在进入“批准项安装阶段”。只执行下方“批准安装输入”中明确列出的项目，不安装其他项目。

安装前再次检查当前状态：已安装且来源、名称和路径均匹配的项目跳过，不覆盖同名 Skill。

插件规则：
1. Codex 插件只能通过 Codex Plugin Management 安装。
2. 不得使用 npm、手工复制目录或其他方式安装 Codex 插件。
3. browser@openai-bundled、chrome@openai-bundled、computer-use@openai-bundled 是宿主能力，只检查，不安装。
4. Figma 或 GitHub 需要 OAuth/登录时，使用宿主连接流程；暂停等待用户完成，不索取或记录令牌。
5. 安装不代表已连接，也不授权创建外部对象、提交变更或发布。

独立 Skill 规则：
1. 只能从安装前审计表中的固定仓库、实际路径和精确 Skill 名称安装。
2. 优先使用：npx skills add <精确仓库> --skill <精确 Skill 名称> -g -y
3. Python 备选必须指定对应的 --repo 和 --path，目标为 $CODEX_HOME/skills。
4. 若出现“Skill path not found”，先用仓库 API 核对实际目录，再重试一次；仍失败则报告未完成。
5. 已存在同名 Skill 时读取 SKILL.md 核对 name、description 和来源；来源不一致或无法确认时不得覆盖，标记“来源未验证”。
6. 不能因为安装命令成功就宣称当前对话已经发现 Skill。

项目 Skill 规则：不通过 npx skills add 安装 $project-workflow；如果模板尚未接入当前项目，不要擅自复制、合并或修改项目；$project-workflow 只有在用户批准模板接入并完成合并后，才进入新对话发现性验证。

权限边界：不修改业务代码、配置、测试或文档；不创建 Figma 文件、GitHub Issue/PR/提交，不发布，不执行生产写入；不改变插件全局权限模式，不自动授予更高权限。

逐项记录实际证据：精确命令或宿主操作、退出码/返回结果、安装路径、SKILL.md 核验、是否需要新对话、连接状态和阻塞原因。

输出：
1. 插件状态表：插件、精确引用、安装结果、启用状态、连接状态、当前任务可用、阻塞。
2. Skill 状态表：Skill、来源仓库、实际路径、安装结果、来源已验证、当前会话可发现、是否需要新对话、当前任务可用、阻塞。
3. 项目 Skill 状态：模板是否已接入、$project-workflow 是否可发现、下一步。
4. 未完成项和用户下一步。
5. 如果新安装了独立 Skill，明确提示必须开启新 Codex 对话，然后停止，不要在本阶段假装完成发现性验证。

批准安装输入：
<把第一阶段输出的“批准安装输入”原样粘贴到这里>
```

## 第三阶段：新对话验证

如果第二阶段安装了独立 Skill，开启新的 Codex 对话后复制下面的提示词。它对应原文件中的“新对话验证提示词”，并额外补充了按需模式和项目 Skill 生命周期检查；它不会重复安装。

```text
继续验证已批准的 Codex 能力安装结果。不要重复安装，不要修改项目文件，不要创建外部对象，不要发布。

请读取（存在时）：当前项目的 README.md、通用模板/docs/AI_CAPABILITY_REQUIREMENTS.md、通用模板/.agents/skills/project-workflow/references/task-routing.md、通用模板/docs/PROJECT_PROFILE.md。

按安装前审计中批准的模式和项目画像验证，不把未批准的可选能力算入失败。

逐项检查：
1. 若当前活动项目已有 .agents/skills/project-workflow/SKILL.md，检查 $project-workflow 是否可发现；若模板只有通用模板目录，标记“等待模板接入”，不要自动合并。
2. 检查所有已批准独立 Skill 的精确名称、SKILL.md、来源和可发现性。
3. 回读 Product Design、Figma、GitHub 的安装、启用和连接状态；把“已安装”与“已连接”分开。
4. 检查 Browser 是否为宿主内置能力；不要从公共插件目录安装 browser@openai-bundled。
5. 按 task-routing.md 检查批准模式所需的最小能力组合，不要求未选择模式的能力。
6. 对于已安装但未连接的 Figma/GitHub，标记“已安装，连接后可用”；若本次不需要连接，标记“当前不要求”。
7. 对于仍不可发现或来源无法验证的 Skill，标记“未完成”，给出证据和下一步。

分别报告：已安装、已启用、已连接、新对话可发现、当前任务可用、未完成项及下一步。
只有批准模式中的所有必需名称均可发现时，才能说明该模式已经就绪。
```

## `project-workflow` 的生命周期

`$project-workflow` 不在三阶段中“生成”：

1. 模板接入阶段：把 `通用模板/` 中的 `.agents/skills/project-workflow/`、`AGENTS.md` 和相关文档按项目情况合并到目标仓库。未经用户批准，不应自动合并或覆盖已有文件。
2. 新对话发现阶段：模板接入后开启新对话，检查当前活动项目是否能发现 `$project-workflow`。
3. 代码任务阶段：用户提出具体研发任务时，遵循仓库 `AGENTS.md` 和项目工作流即可。若当前宿主不能根据仓库规则自动发现该 Skill，再在任务中显式加载 `$project-workflow`。它负责读取项目事实、选择最小能力、实施和验证；它不会在此时才创建自己。

如果当前仓库已经有 `.agents/skills/project-workflow/SKILL.md`，说明它已经接入，只需完成发现性验证。当前仓库就是这种情况；全新目标仓库则通常需要先完成模板接入，再进行第三阶段验证。
