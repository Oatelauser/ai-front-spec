# 通用提示词工程

这是一套从“数智监督前端”项目提炼出来的通用提示词工程。它不是一段万能长提示词，而是一套可发现、可组合、可验证、可持续修正的项目协作闭环。

## 适用范围

- 软件研发仓库中的代码、文档、界面、接口、测试和交付任务。
- 使用 Codex、Claude Code 或其他支持仓库规则、Skill/能力包和工具调用的智能编码代理。
- 希望把项目规则从临时对话升级为长期资产，同时避免上下文过载的团队。

## 核心产物

- `设计说明.md`：解释分层、优先级、事实源、执行闭环和维护原则。
- `来源映射.md`：说明原项目材料如何去业务化、参数化并映射到通用模板。
- `给Codex的安装提示词.md`：可直接交给 Codex，自动检查并安装缺失插件与 Skill。
- `通用模板/`：可以合并到新项目根目录的完整脚手架。
- `通用模板/docs/FRONTEND_CONVENTIONS.md`：可选的前端领域约定；只在项目画像确认前端技术栈并经用户批准后接入。

## 快速接入

1. 将 `通用模板/` 中的内容合并到目标仓库根目录。不要覆盖目标仓库已有规则，先人工合并。
2. 将 `给Codex的安装提示词.md` 交给 Codex，按
   `通用模板/docs/AI_CAPABILITY_REQUIREMENTS.md` 安装所需插件与 Skill；新安装 Skill 后按文档提供的
   “新对话验证提示词”完成第二轮发现性验证。
3. 填写 `docs/PROJECT_PROFILE.md`，明确技术栈、事实源、权限边界、质量命令和验收矩阵。
4. 搜索并替换所有 `<待填写：...>` 占位符。
5. 如需重命名 `project-workflow`，同时修改 Skill 目录名、`SKILL.md` 的 `name`、`agents/openai.yaml`、`AGENTS.md` 和 `ai-guidance.config.mjs`。
6. 参考 `package-scripts.example.json` 将 AI 指引校验接入项目质量门禁。
7. 将 `ai-guidance.config.mjs` 中的 `allowPlaceholders` 改为 `false`，运行：

   ```bash
   node scripts/check-ai-guidance.mjs
   node --test scripts/lib/ai-guidance-validation.test.mjs
   ```

   Windows 下运行官方 Python Skill validator 时，若默认编码不是 UTF-8，先执行：

   ```powershell
   $env:PYTHONUTF8 = '1'
   python <skill-creator目录>\scripts\quick_validate.py .agents\skills\project-workflow
   ```

8. 用一个真实的小任务试运行 `$project-workflow`，检查它是否能找到项目事实、选择最小能力组合并提供验证证据。

`--strict` 会同时禁止占位符并要求 AI 校验接入包脚本总门禁。非 JavaScript 项目可将
`packageIntegration.enabled` 设为 `false`，再把同等校验命令接入自身的 Make、Gradle、Maven、
Python 或 CI 门禁。

## 目录结构

```text
提示词工程/
├─ README.md
├─ 设计说明.md
├─ 来源映射.md
├─ 给Codex的安装提示词.md
└─ 通用模板/
   ├─ AGENTS.md
   ├─ ai-guidance.config.mjs
   ├─ package-scripts.example.json
   ├─ docs/
   │  ├─ PROJECT_PROFILE.md
   │  ├─ FRONTEND_CONVENTIONS.md
   │  ├─ AI_PROMPT_ENGINEERING.md
   │  ├─ AI_TASK_PROMPT.md
   │  ├─ AI_PAGE_PROMPT.md
   │  ├─ AI_PROJECT_STANDARDS.md
   │  ├─ AI_COMPONENT_CATALOG.md
   │  ├─ AI_CAPABILITY_REQUIREMENTS.md
   │  └─ AI_ACCEPTANCE_EVIDENCE.md
   ├─ .agents/skills/project-workflow/
   │  ├─ SKILL.md
   │  ├─ agents/openai.yaml
   │  └─ references/task-routing.md
   └─ scripts/
      ├─ check-ai-guidance.mjs
      └─ lib/
         ├─ ai-guidance-validation.mjs
         └─ ai-guidance-validation.test.mjs
```

## 最小任务提示词

日常复杂任务只需补充会改变结果的信息：

```text
遵循当前仓库的 AGENTS.md 和项目工作流。

如果当前宿主不能自动发现项目工作流，再显式加载 `$project-workflow`。

目标：
- 最终要改变什么，以及用户能完成什么。

上下文：
- 相关需求、文件、错误、路由、接口、数据或设计源。

约束：
- 必须保留的行为、技术边界、安全边界和不可修改范围。

完成条件：
- 可观察结果、必须通过的检查、真实验收证据和允许保留的未验证项。
```

## 设计边界

- 通用模板不预设语言、框架、UI 库、接口封装、测试框架、浏览器工具或代码托管平台。
- 外部 Skill、插件和模型输出只能补充能力，不能替代项目内部事实和授权。
- Mock、截图、构建成功或 HTTP 200 不能单独证明业务流程完成。
- 无法验证的内容必须明确列为“未验证”，不能伪造成功。
- 可机械判断的规则优先写成测试、Lint 或校验脚本，不继续堆进提示词。
- 零依赖校验器支持行内 Markdown 链接、标准标题锚点和本模板使用的受限 YAML 子集；复杂
  Markdown/YAML 语法继续交给宿主解析器和官方 Skill validator。
