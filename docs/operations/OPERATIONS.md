# Starter 安装与日常运维

## 1. 环境

- Node.js >= 20；CI 使用 Node 22。
- Git 可用；vendored 升级需要访问上游仓库或离线包。
- 目标项目已有 `AGENTS.md`、`CLAUDE.md`、`README.md`、项目画像或规则文件时，安装器按 根目录 manifest 的 `skipIfExists` 保护它们。

## 2. 安装

```bash
node scripts/build-starter.mjs --target ./my-project
```

空目录会得到干净副本；已有项目执行覆盖安装，但保护文件会跳过。安装后检查跳过清单，并按目标项目实际技术栈初始化画像和组件目录。

## 3. 本仓库自检

```bash
node scripts/build-starter.mjs --check
node .toolkit/scripts/check-ai-guidance.mjs --root . --strict
node .toolkit/scripts/sync-mirror.mjs --check
node --test scripts/lib/*.test.mjs
```

`--strict` 会检查占位符、死链接、Skill/文档死引用和任务记录问题。

## 4. 修改 Skill 的顺序

1. 只编辑 `.agents/skills/<name>/`。
2. 行为、路由或引用变化时同步更新对应 `docs/` 手册。
3. 运行 `node .toolkit/scripts/sync-mirror.mjs` 生成 `.claude/skills/`。
4. 运行单元测试、结构检查、严格 AI guidance 检查和镜像检查。
5. 查看 `git diff -- .agents/skills .claude/skills docs`。
6. 确认镜像没有人工独有修改后提交源和镜像。

## 5. 修改脚本、manifest 或 CI

```bash
node --test scripts/lib/*.test.mjs
node scripts/build-starter.mjs --check
node .toolkit/scripts/check-ai-guidance.mjs --root . --strict
node .toolkit/scripts/sync-mirror.mjs --check
```

修改 Skill、提示词、路由或 AI 指引时，还要运行非 strict guidance 校验和项目规定的 Skill 校验器。

## 6. 故障排查

| 问题 | 处理 |
| --- | --- |
| 镜像漂移 | 运行 `sync-mirror.mjs`，再运行 `--check` |
| 校验失败 | 按错误码修复，不删除规则绕过 |
| 安装覆盖异常 | 检查 `skipIfExists` 与 `distExcludes` |
| 上游无法克隆 | 下载 CI artifact，用 `--offline` |
| 升级后测试失败 | 保留 diff，回滚升级，修复兼容后再应用 |
| tag/version 不一致 | 根目录 manifest 的版本字段 必须等于 `v<version>` |

## 7. 发布前

确认版本、双语文档、Skill 镜像、测试、严格校验和 Starter 构建均通过。推送匹配的 `v*` tag 后由 GitHub CI 创建 Release，不手工改生成包。
