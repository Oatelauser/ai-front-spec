# 验证清单

- 精确 Skill 名称和 `SKILL.md` 元数据可读。
- 新安装 Skill 在新会话可发现。
- `project-workflow` 从项目 `.agents/skills/` 发现。
- Browser 由宿主提供。
- Figma/GitHub 安装状态与连接状态分开。
- 核对批准模式及每个 Skill 的实际来源；未批准的可选能力不算失败。
- 项目 Skill 尚未接入时记录“等待 Starter 接入”，不能由安装阶段生成。
- Browser 不存在时核对实际可用的 Playwright 或宿主等价能力，并记录差异。
- 已安装但本任务不要求连接的 Figma/GitHub 标记 not-required，不强制登录。
- 只有批准模式的全部必需能力具备实际证据，才能报告该模式就绪；否则列出未完成项和继续条件。

使用 [状态格式](status-model.md) 分别报告 installed/enabled/connected/discoverable/taskUsable，回读获准写入的目标状态记录。新会话不可在当前会话中模拟成功。
