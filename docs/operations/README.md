# 运维与维护手册

维护对象：Starter 安装包、`.agents/skills` 人工源、`.claude/skills` 镜像、`.toolkit` 运行文件、根目录 manifest roster、vendored Skill、插件快照和 GitHub CI。

## 文档入口

| 任务 | 文档 |
| --- | --- |
| 安装和日常自检 | [OPERATIONS.md](OPERATIONS.md) |
| 内置 Skill、插件和宿主能力 | [BUILT-IN-CAPABILITIES.md](BUILT-IN-CAPABILITIES.md) |
| 升级、离线包和 GitHub CI | [UPGRADING.md](UPGRADING.md) |

## 不可违反的源规则

```text
.agents/skills/  = 人工编辑源
.claude/skills/  = 自动生成镜像
.toolkit/        = 校验器和安装后运行文件
```

不要手改 `.claude/skills/`，不要提交 token/cookie/代理密钥，升级前必须查看 diff。
