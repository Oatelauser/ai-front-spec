# 运维与维护手册

维护对象：Starter 安装包、`.agents/skills` 人工源、`.claude/skills` 镜像、`.toolkit` 运行文件、根目录 manifest roster、vendored Skill、插件快照和 GitHub CI。

## 文档入口

| 任务 | 文档 |
| --- | --- |
| 安装 Starter 到项目 | [INSTALL.md](INSTALL.md) |
| 自检、改 Skill、GitHub CI 与发布 | [OPERATIONS.md](OPERATIONS.md) |
| 内置 Skill、插件和宿主能力 | [BUILT-IN-CAPABILITIES.md](BUILT-IN-CAPABILITIES.md) |
| 升级与离线包 | [UPGRADING.md](UPGRADING.md) |
| 全部关键决策的裁定链与豁免清单 | [DECISIONS.md](DECISIONS.md) |

## 不可违反的源规则

```text
.agents/skills/  = 人工编辑源
.claude/skills/  = 自动生成镜像
.toolkit/        = 校验器和安装后运行文件
```

不要手改 `.claude/skills/`，不要提交 token/cookie/代理密钥，升级前必须查看 diff。
