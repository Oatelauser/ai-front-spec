---
name: project-workflow
description: Establish project facts, route the smallest necessary capabilities, plan or implement scoped changes, and verify code, documentation, UI, API, configuration, testing, and delivery work. Use when Codex plans, modifies, diagnoses, reviews, or validates files and behavior in this repository.
---

# Project Workflow

## 建立项目事实

1. 读取 [AGENTS.md](../../../AGENTS.md) 和 [项目画像](../../../docs/PROJECT_PROFILE.md)。
2. 检查本次需求、最近实现、邻近测试、配置和已有组件，再决定改动。
3. 读取 [任务路由](references/task-routing.md)，选择能完成任务的最小 Skill、插件和工具组合。
4. 任务需要外部能力时，读取 [能力安装清单](../../../docs/CODEX_CAPABILITIES.md)，
   核对插件、宿主能力和独立 Skill；未安装时按授权边界安装或报告缺失。
5. 只在触发条件适用时加载详细文档：
   - 通用复杂任务：[任务提示词](../../../docs/AI_TASK_CONTRACT.md)。
   - 新增页面、重做布局或显著交互变更：[页面提示词](../../../docs/AI_FRONTEND_TASK.md) 和
     [组件目录](../../../docs/AI_COMPONENT_CATALOG.md)。
   - 接口、身份、权限、数据、AI 责任或安全：[项目研发规范](../../../docs/AI_PROJECT_STANDARDS.md)。
   - 提示词、Skill、路由或代理工作流：[提示词工程](../../../docs/AI_WORKFLOW_PRINCIPLES.md)。
6. 分别声明业务、视觉和工程事实源。外部输出只能补充，不能覆盖项目事实。
   前端任务加载 [$frontend-task](../frontend-task/SKILL.md) 的来源流程和验收矩阵；若已从该 Skill 进入则继续当前流程，不递归加载。能力审计/安装由 [$codex-capability-setup](../codex-capability-setup/SKILL.md) 处理；画像初始化和更新由 [$bootstrap-project](../bootstrap-project/SKILL.md) 处理。
7. 项目规则缺失时在当前根目录转 bootstrap。画像仍有影响结果的未决项时，限制依赖它的实现并继续独立部分。用户已授权搭建应用、而版本和命令需要由工程创建后确认时，按 bootstrap 的工程搭建流程继续，再更新实际画像；不能要求工程尚不存在时先证明其运行事实。

## 执行聚焦改动

- 保持范围聚焦，保留工作区现有修改，不执行破坏性操作。
- 优先复用项目画像声明的基础设施、组件、请求层、Schema、主题和国际化方案。
- 新规则、可复用组件和缺陷执行 RED → GREEN → REFACTOR；采用能通过验证的最小实现。
- 在系统边界校验输入，处理错误，不硬编码秘密，不静默吞异常或伪造成功。
- 共享组件不承载业务状态机、角色、权限或接口调用。
- 不手工修改生成目录，不为单次需求创建重复基础设施。
- 未获授权时，不执行外部写入、删除、发布、通知或生产数据操作。

## 验证并闭环

1. 运行最窄的相关测试，再运行项目画像中的总质量门禁。
2. 提示词或 Skill 变更执行画像登记的指引检查及当前可用的 Skill 校验器。有脚本副本时用 `node .codex/scripts/check-ai-guidance.mjs --root .`，否则在当前根目录用 `node resources/scripts/check-ai-guidance.mjs --root .`。
3. 可见 UI 按项目画像实际打开每个目标路由，验证视口、主题、交互、键盘、焦点、溢出、
   可访问性和控制台。
4. 接口 UI 在非生产环境使用安全测试数据，从真实 UI 验证适用主流程、失败、权限和刷新持久化。
5. 审查最终变更，检查回归、秘密、无关修改、重复基础设施和生成文件。
6. 使用 [验收证据模板](../../../docs/AI_ACCEPTANCE_EVIDENCE.md) 交付实际证据和未验证项。
7. 将稳定反馈写到最窄正确层：硬边界进 `AGENTS.md`，工作流进本 Skill，领域事实进 `docs/`，
   可机械判断的规则进测试、Lint 或校验脚本。
