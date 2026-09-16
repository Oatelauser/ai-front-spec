# 三阶段

## A 审计
读取项目规则、能力清单和当前任务，输出精确能力名称、来源、安装/启用/连接/可发现/任务可用状态、证据和阻塞。缺任务上下文时推荐核心模式，其余为可选项；不默认完整安装。使用 [状态格式](status-model.md) 和 [批准输入](../templates/approval-input.md)。只读审计不写状态文件；用户只要求审计时到此结束，不自行安装。

## B 批准安装
按 [安装政策](install-policy.md) 只执行已授权的精确插件或 Skill。已有明确安装授权时继续执行，不重复请求同一批准；新增加的范围先展示清单。插件使用 Codex Plugin Management，独立 Skill 使用固定来源，宿主 Browser 不安装，Figma/GitHub 安装与连接分离。

## C 新会话验证
按 [验证清单](verification-checklist.md) 重新读取 Skill 元数据并检查可发现性、项目 Skill、宿主能力和当前任务最小组合。仅在新装 Skill 需要重新发现时开启新会话，不因重复检查已可用能力而强制重启。
