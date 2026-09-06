# 当前项目的资源与状态

默认在当前仓库开发。`resources/toolkit.json` 的 `kind=frontend-project-template` 和 `initialization.mode=in-place` 描述模板用途，不描述项目是否已经初始化。旧清单中的 `uninitialized-toolkit` 也不能覆盖用户在当前仓库开发的要求。

## 资源定位与生成

优先读取当前根目录的 `resources/toolkit.json`。所有 source 和 target 默认相对同一个项目根目录；source 是文件来源，target 是生效位置，不代表两个独立仓库。`profiles` 中的候选用于生成本仓库 `docs/PROJECT_PROFILE.md`。

- source 与 target 解析为同一文件时，读取并校验现有文件，记录为“已有并复用”，跳过复制；不能先清空目标再从相同路径读取。
- mode=generate 的文件结合实际项目事实生成，mode=merge 的文件先比较再合并，重复执行不能覆盖项目定制内容。
- group=core 为核心规则。group=local 默认在当前仓库保留 `.codex/templates/`、`.codex/scripts/` 等副本；用户选择不生成副本时，仍可使用仓库内 `resources/`。
- `resources/` 保留为模板候选，项目值写入根目录规则、`docs/` 和 `.codex/`。更新模板时可以修改资源，但不把一次任务的业务事实填进候选模板。
- 三个已存在的项目 Skill 直接复用；将 `resources/project-workflow/` 合并到 `.agents/skills/project-workflow/`，无需全局安装。

用户明确要求从其他位置更新资源时，再读取该位置的清单并逐项比较；不能仅凭同版本号跳过内容比较。不要求日常开发者维护另一份模板仓库。

## 项目记录

从 `resources/templates/manifest.template.json` 生成当前项目 `.codex/manifest.json`：

- schemaVersion=1，kind=project-installation，表示规则接入记录，保留现有校验格式。
- toolkit.name/version 来自资源清单；内置资源的 source 写 `.`，相对项目根目录解析，表示读取本仓库 `resources/toolkit.json`。只有实际使用外部来源时才记录其路径或固定版本地址。
- initializedAt 使用实际 ISO 时间；status 为 draft 或 initialized，严格验收未完成时保持 draft。
- installedFiles 记录实际生成、合并及确认复用的生效文件，使用项目相对路径，不填计划写入但未落地的文件。
- localResources 表示是否完整保留清单中 group=local 的副本；不生成或仅生成部分副本时为 false，实际文件以 installedFiles 为准。
- updates 为 review-required 或 disabled；deferredFields 只记录低影响待确认字段；lastValidation 记录实际命令、时间及 passed/failed/not-run。

能力状态位于当前仓库 `docs/capability-state.json`。首次初始化只在文件不存在时生成空状态；再次执行保留已记录条目。规则接入不自动意味着外部能力已安装。

## 开发与验证边界

当前根目录允许并预期出现 `AGENTS.md`、`docs/PROJECT_PROFILE.md`、`.codex/`、`package.json` 及业务源码。这些是项目开始开发的正常结果，不能为了维持“模板状态”而删除。

只为验证模板行为而创建的测试样本可以使用临时目录，测试结束清理本次样本；这不是实际开发必须另建项目的要求。测试不得重置当前开发仓库。指引校验及业务验收见 [验收清单](acceptance-checklist.md)。
