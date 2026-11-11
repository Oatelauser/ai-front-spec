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

上述单测含 Bash 命令回放。Windows 请在 Git Bash 中执行；从 PowerShell 启动时，确保当前进程 PATH 优先找到 Git for Windows 的 Bash，避免误用系统的 WSL `bash.exe` 启动器。不要为运行测试修改全局 PATH；在 WSL 内测试则使用 Linux Node 与 Linux 路径。

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

`main` push、`v*` tag 与 PR 触发；Ubuntu/Windows × Node 22/25 四组均跑单元测试、Starter 构建检查、strict 校验和镜像检查。2026-10-12 UTC 的真实 Actions 已验证以下托管环境：

| CI 轴 | 实测系统 | 实测 Node.js | PR / main / 测试 tag 门禁结果 |
| --- | --- | --- | --- |
| ubuntu-latest / 22 | Ubuntu 24.04.5 | 22.23.3 | 各 135/135 测试及三项检查通过 |
| ubuntu-latest / 25 | Ubuntu 24.04.5 | 25.9.0 | 各 135/135 测试及三项检查通过 |
| windows-latest / 22 | Windows Server 2025 | 22.23.3 | 各 135/135 测试及三项检查通过 |
| windows-latest / 25 | Windows Server 2025 | 25.9.0 | 各 135/135 测试及三项检查通过 |

运行证据：[PR #14 CI](https://github.com/Oatelauser/ai-front-spec/actions/runs/38192531425)、[main CI](https://github.com/Oatelauser/ai-front-spec/actions/runs/38193243661)、[测试 tag CI](https://github.com/Oatelauser/ai-front-spec/actions/runs/38194413297)。main 与测试 tag 对应提交 `6df3a76471a05e637a98bee41943eeab271f5607`。本地另有 Node 25.0.0 实测；上述矩阵不扩大为全部 Linux、所有 Node 补丁版本或双宿主模型行为通过，`*-latest` 后续镜像变化需按实际运行复核。

**当前公开发布暂停，门禁已部署远端 main。** tag 场景的 `release-policy` 无条件 exit=1，`release` 依赖 `gate` 与 `release-policy`。上述测试 tag 中四组 gate 全通过，但 `release-policy` 按预期失败、`release` 跳过、未创建 Release，整体运行因此标为 failure；测试 tag 已删除并只读确认不存在。暂停期间推 `v*` tag 不会恢复发布。

### `vendored-check.yml`：上游技能版本巡检

每周一 UTC 03:23 定时运行，另有手动触发及 `main` push 冒烟。运行升级检查，有可升级项且打包成功时上传离线升级包 artifact；只有定时/手动触发进入 Issue 报告步骤：可升级则创建/更新待办，探测完整且无更新才关闭遗留待办，未知/错误则告警并保留待办。`main` push 不落 Issue。

[main push 实测](https://github.com/Oatelauser/ai-front-spec/actions/runs/38193243637) 检查完成（可升级 10、未知/错误 0、无变化 11）、打包上传成功，Issue 步骤按条件跳过；定时/手动报告分支尚未真实验证。artifact 不等于已应用升级或 Release 发布。维护流程：看 Issue 或运行报告 → 下载该运行的 bundle artifact → 按 [升级手册](UPGRADING.md) 的离线升级步骤评估、应用。

## 5. 发布前

**公开发布仍暂停。** 恢复前须核查第三方分发授权材料并取得明确批准，再单独修改、审查和验证 `release-policy`；测试通过或推 tag 均不能代替这些条件。本轮只验证暂停阻断，没有恢复发布。

恢复获批并完成门禁变更验收后，仍须确认版本、Skill 镜像、测试、严格校验和 Starter 构建均通过，才可推送与源仓 Starter 清单声明版本匹配的 `v<version>` tag，由 CI 从干净副本构建并创建 Release；不手工改生成包。

## 6. 故障排查

| 问题 | 处理 |
| --- | --- |
| 镜像漂移 | 运行 `sync-mirror.mjs`，再跑 `--check` |
| 校验失败 | 按错误码修复，不删除规则绕过 |
| 上游无法克隆 | 下载 CI artifact，用 `--offline` |
| 升级后测试失败 | 保留 diff，回滚升级，修复兼容后再应用 |
| tag/version 不一致 | 根目录 manifest 的 version 必须等于 `v<version>` |
