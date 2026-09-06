# Codex 插件与 Skill 安装清单

更新时间：2026-07-24

本文件是 `$project-workflow` 外部能力的单一安装事实源。完整任务组合见
[任务路由](../.agents/skills/project-workflow/references/task-routing.md)。

## 目录

1. 依赖分类
2. Codex 插件
3. 独立 Skill
4. 完整组合验证
5. 安装模式
6. 安全与失败边界
7. 来源

## 1. 依赖分类

- **Codex 插件**：使用 Codex Plugin Management 搜索、安装和连接，不使用 npm 或手工复制。
- **宿主内置插件**：随 Codex 宿主提供，只检查是否可用，不尝试从公共插件目录安装。
- **独立 Skill**：使用 Codex 的 `skill-installer`，或使用 `npx skills add` 从固定来源安装。
- **项目 Skill**：`$project-workflow` 已包含在本模板中，不需要从外部安装；只有把
  `通用模板/` 合并到目标仓库并开启新对话后，才能验证它是否被当前项目发现。

插件安装和 Skill 安装是两条不同流程，不能互相替代。

## 2. Codex 插件

### 2.1 可由 Plugin Management 安装

| 插件 | 精确插件引用 | 提供的组合能力 | 安装级别 | 额外连接 |
| --- | --- | --- | --- | --- |
| Product Design | `product-design@openai-api-curated`（或当前配置的等价 marketplace） | `$product-design:index`、`$product-design:image-to-code`、`$product-design:audit` | 完整模式必装；无 UI 项目可省略 | 无 |
| Figma | `figma@openai-api-curated`（或当前配置的等价 marketplace） | `$figma:figma-use`、`$figma:figma-create-new-file`、`$figma:figma-generate-design`、`$figma:figma-design-to-code` | 使用 Figma 时安装 | 需要连接 Figma |
| GitHub | `github`（由当前 Plugin Management 显示的 marketplace 补全） | PR、Issue、远端仓库读取与写入 | 使用 GitHub 远端操作时安装 | 需要连接 GitHub |

安装规则：

1. 先让 Codex 使用 Plugin Management 按精确引用搜索插件。
2. 已安装且启用时不重复安装。
3. 缺失时只请求安装表中列出的精确插件，不安装相似名称或第三方替代品。
4. Figma、GitHub 安装后按宿主提示完成连接；不在提示词、代码或日志中记录令牌。
5. 安装或连接失败时报告真实状态，不得宣称对应 Skill 已可用。

### 2.2 宿主内置插件

| 能力 | 宿主引用 | 需要验证的 Skill | 处理方式 |
| --- | --- | --- | --- |
| 本地页面真实验收 | `browser@openai-bundled` | `$browser:control-in-app-browser` | 公共插件目录可能无法发现；只检查当前 Codex 是否内置 |
| 用户现有浏览器会话 | `chrome@openai-bundled` | 当前宿主的 Chrome 控制 Skill | 仅在必须使用用户登录态时使用 |
| 桌面应用操作 | `computer-use@openai-bundled` | 当前宿主的 Computer Use Skill | 不替代 Browser、Figma 或专用连接器 |

`browser@openai-bundled` 不是公共插件安装目标。若当前 Codex 没有
`$browser:control-in-app-browser`，应查找宿主提供的 Browser、Chrome 或 Playwright 等价能力，
把实际名称登记到 `docs/PROJECT_PROFILE.md`，不能伪造已经安装。

## 3. 独立 Skill

完整模式使用以下 Skill。安装前先检查当前 Skill 清单；已存在同名 Skill 时不覆盖，除非用户明确要求更新。
同名 Skill 存在时还要核对 `SKILL.md` 的名称、描述和可识别来源；来源无法确认时标记“来源未验证”，
不能仅凭目录名判定满足依赖。

| Skill | 固定来源 | 安装命令 |
| --- | --- | --- |
| `$tdd-workflow` | `affaan-m/everything-claude-code` | `npx skills add https://github.com/affaan-m/everything-claude-code --skill tdd-workflow -g -y` |
| `$frontend-design` | `anthropics/skills` | `npx skills add https://github.com/anthropics/skills --skill frontend-design -g -y` |
| `$api-design` | `affaan-m/everything-claude-code` | `npx skills add https://github.com/affaan-m/everything-claude-code --skill api-design -g -y` |
| `$security-review` | `affaan-m/everything-claude-code` | `npx skills add https://github.com/affaan-m/everything-claude-code --skill security-review -g -y` |
| `$frontend-design-direction` | `affaan-m/everything-claude-code` | `npx skills add https://github.com/affaan-m/everything-claude-code --skill frontend-design-direction -g -y` |
| `$design-taste-frontend` | `leonxlnx/taste-skill`（目录 `skills/taste-skill`） | `npx skills add https://github.com/leonxlnx/taste-skill --skill taste-skill -g -y` |
| `$web-design-guidelines` | `vercel-labs/agent-skills` | `npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines -g -y` |
| `$vercel-react-best-practices` | `vercel-labs/agent-skills`（目录 `skills/react-best-practices`） | `npx skills add https://github.com/vercel-labs/agent-skills --skill react-best-practices -g -y` |

这些命令使用 `-g` 安装到用户级 Skill 目录，不修改业务仓库。来源默认跟随上游仓库当前版本；
需要可重复构建的团队应在自己的安装流程中固定审核过的提交。安装后通常需要开启新一轮 Codex
对话，Skill 才会进入可发现清单。

## 4. 完整组合验证

### 4.1 状态机

每项能力只使用以下状态，不把“命令退出码为 0”直接写成“当前任务可用”：

```text
缺失 → 待用户确认 → 已安装 → 已连接（适用时）→ 新对话可发现 → 当前任务可用
```

- Product Design 通常不需要外部账号连接。
- Figma、GitHub 在完整模式下要求安装，但可保持“未连接（当前任务不需要）”。
- 只有当前任务实际需要 Figma/GitHub 时，才把“已连接”作为可用条件。
- Browser 等宿主能力没有安装阶段，直接检查“宿主提供 → Skill 可发现 → 当前任务可用”。
- `$project-workflow` 的可发现性依赖模板已经合并到活动项目，而不是全局 Skill 安装命令。

### 4.2 名称检查

安装完成后必须验证下列名称是否可发现：

```text
$project-workflow
$tdd-workflow
$product-design:index
$frontend-design-direction
$design-taste-frontend
$frontend-design
$product-design:image-to-code
$figma:figma-use
$figma:figma-create-new-file
$figma:figma-generate-design
$figma:figma-design-to-code
$product-design:audit
$web-design-guidelines
$vercel-react-best-practices
$api-design
$security-review
$browser:control-in-app-browser
GitHub 插件
```

只检查当前项目实际需要的连接权限。未使用 Figma 或 GitHub 时，不要求提前连接外部账号。
若本轮新安装了独立 Skill，名称检查必须放到新对话执行。

## 5. 安装模式

- **核心模式**：`$project-workflow` + `$tdd-workflow` + `$api-design` + `$security-review`。
- **UI 模式**：核心模式 + Product Design + `$frontend-design-direction` + `$frontend-design` +
  `$web-design-guidelines` + 浏览器能力。
- **React UI 模式**：UI 模式 + `$vercel-react-best-practices`。
- **Figma 模式**：UI 模式 + Figma 插件及连接。
- **完整模式**：以上全部 + GitHub 插件。给 Codex 的自动安装提示词默认使用完整模式。

安装模式只决定能力是否可用，不代表每个任务都加载全部能力。执行时仍按任务路由选择最小组合。

## 6. 安全与失败边界

- 只从本文件固定的插件引用和 Skill 仓库安装，不使用同名 fork。
- 安装前检查来源、名称和当前状态；来源不可达或名称变化时停止并报告。
- 不自动授予“永不询问”或等价的最高插件权限。
- 安装插件不授权创建 Figma 文件、提交 GitHub 变更、发布、发送消息或执行生产写入。
- 本文件不包含令牌、账号、OAuth 密钥或私有仓库凭证。

## 7. 来源

- Product Design、Figma、GitHub 插件引用已通过 Codex Plugin Management 核验。
- [TDD Workflow](https://skills.sh/affaan-m/everything-claude-code/tdd-workflow)
- [Frontend Design](https://skills.sh/anthropics/skills/frontend-design)
- [API Design](https://skills.sh/affaan-m/everything-claude-code/api-design)
- [Security Review](https://skills.sh/affaan-m/everything-claude-code/security-review)
- [Design Taste Frontend](https://skills.sh/leonxlnx/taste-skill/taste-skill)
- [Web Design Guidelines](https://skills.sh/vercel-labs/agent-skills/web-design-guidelines)
- [Vercel React Best Practices](https://skills.sh/vercel-labs/agent-skills/react-best-practices)
