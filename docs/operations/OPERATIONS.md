# 运维手册

面向维护本仓库的人：自检、改 Skill、改脚本 / manifest / CI、GitHub CI 与发布。把 Starter 安装到自己项目看 [安装手册](INSTALL.md)。

## 1. 本仓库自检

```bash
node scripts/build-starter.mjs --check
node .toolkit/scripts/check-ai-guidance.mjs --root . --strict
node .toolkit/scripts/sync-mirror.mjs --check
node --test scripts/lib/*.test.mjs
```

`--strict` 检查占位符、死链接、Skill/文档死引用和任务记录问题。

## 2. 改了 Skill 后要做什么

1. 只编辑 `.agents/skills/<name>/`；`.claude/skills/` 是生成镜像，不要手改。
2. 行为、路由或引用变化时，同步更新对应 `docs/` 手册。
3. 运行 `node .toolkit/scripts/sync-mirror.mjs` 重建 `.claude/skills/`。
4. 跑 §1 自检四连，再 `git diff -- .agents/skills .claude/skills docs` 复核。
5. 确认镜像没有人工独有修改后，源和镜像一起提交。

## 3. 改了脚本、manifest 或 CI 后要跑什么

```bash
node --test scripts/lib/*.test.mjs
node scripts/build-starter.mjs --check
node .toolkit/scripts/check-ai-guidance.mjs --root . --strict
node .toolkit/scripts/sync-mirror.mjs --check
```

改的是 Skill、提示词、路由或 AI 指引时，另跑非 strict guidance 校验和项目规定的 Skill 校验器。

## 4. GitHub CI

CI 的存在目的：在 GitHub 干净环境验证仓库健康（不受本地工作区状态影响），并把两件人工成本高的事自动化——发布打包与上游技能版本巡检。

### `ci.yml`：测试、校验与发布

`main` push、`v*` tag 与 PR 触发；声明 Ubuntu/Windows 双系统 × Node 22/25 矩阵（Windows 已本地实测该两版，Linux 与真实 Actions 编排未验证）跑单元测试和 strict 校验。推 `v*` tag 时 release 受 `release-policy` 前置门禁约束：当前公开发布暂停（该 job 无条件非零退出，源码级实现、未部署远端），恢复须明确批准与材料核查；此前描述的「推 tag 即自动发布」在暂停期内不生效。

### `vendored-check.yml`：上游技能版本巡检

每周一 UTC 03:23 定时运行（另有手动触发；`main` push 只冒烟验证工作流健康，不落 Issue 防刷屏）。运行升级检查，有可升级项时上传离线升级包 artifact 并创建/更新一条 Issue。维护流程：看 Issue → 按 Issue 内链接下载 bundle artifact → 按 [升级手册](UPGRADING.md) 的离线升级步骤评估、应用。本轮全绿时自动关闭遗留 Issue。

## 5. 发布前

确认版本、Skill 镜像、测试、严格校验和 Starter 构建均通过。推送匹配的 `v*` tag 后由 GitHub CI 创建 Release，不手工改生成包。

## 6. 故障排查

| 问题 | 处理 |
| --- | --- |
| 镜像漂移 | 运行 `sync-mirror.mjs`，再跑 `--check` |
| 校验失败 | 按错误码修复，不删除规则绕过 |
| 上游无法克隆 | 下载 CI artifact，用 `--offline` |
| 升级后测试失败 | 保留 diff，回滚升级，修复兼容后再应用 |
| tag/version 不一致 | 根目录 manifest 的 version 必须等于 `v<version>` |
