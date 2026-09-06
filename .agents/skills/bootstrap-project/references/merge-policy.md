# 合并政策

以当前仓库 `resources/toolkit.json` 为生成与合并清单，source/target 均相对当前根目录。逐文件标记：同文件复用、新增、已有且一致、已有需合并、冲突待确认。先解析真实路径（包括符号链接及 Windows 大小写差异）；同文件只校验并复用，不复制到自身。清单是候选，不授权覆盖。

1. 先生成或逐字段合并 `docs/PROJECT_PROFILE.md`，以现有事实为主。其他资源接入不得再次覆盖画像。
2. 以 `resources/templates/agents.template.md` 为通用规则候选，结合已确认画像逐段合并目标 `AGENTS.md`。保留原规则，登记 project-workflow、frontend-task 和能力安装的入口。
3. 按清单合并目标 docs 与四个项目 Skill（含 references、templates、agents 元数据）。不通过全局 Skill 安装器接入项目 Skill。
4. 配置放入 `.codex/ai-guidance.config.mjs`。已存在的根目录旧配置和旧文档名称先检查调用者，提出路径迁移差异；不删除旧文件，不同时维护矛盾的两套配置。
5. 默认在当前仓库接入 `.codex/templates/` 和 `.codex/scripts/`；业务 `scripts/`、`templates/` 不被整目录复制。用户不需要副本时使用 `resources/` 的原文件，并同步调整生成的 AGENTS、画像和校验配置中的命令。包脚本示例按实际工程合并，不能直接覆盖 package.json；已授权的工程创建使用 [搭建流程](project-creation.md)。
6. manifest 记录实际生成、合并和已确认复用的文件。没有完整 `.codex/` 资源副本时记录 localResources=false；内置资源 source 记为 `.`。能力状态仅在缺失时初始化为空，已有状态保留，不填“已安装”。

保护已有 AGENTS、画像、全部 Skill、文档、配置、脚本、测试、锁文件和业务代码；存在冲突时只提出差异，不强制覆盖、删除重建或清空目录。稳定规则进 Skill/规范，实际项目值进画像，一次性确认和证据进目标项目记录。
