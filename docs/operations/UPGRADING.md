# Skill、插件和 CI 升级手册

## 1. 版本事实

- Starter 版本：根目录 manifest 的版本字段。
- vendored Skill 上游提交：根目录 manifest 的 vendored 提交字段。
- npm 包版本：根目录 manifest 的 packages 字段。
- Skill 人工源：`.agents/skills/`。
- Claude 镜像：`.claude/skills/`，由脚本生成。

## 2. 检查和评估

```bash
node scripts/update-vendored.mjs check
node scripts/update-vendored.mjs --diff <skill-name>
```

先看上游新增/删除/修改文件和本仓引用影响，再决定升级。无 repo 的插件快照只报告来源，不做网络探测。

## 3. 在线升级五步

```bash
node scripts/update-vendored.mjs check
node scripts/update-vendored.mjs --diff <skill-name>
node scripts/update-vendored.mjs --upgrade <skill-name>
node .toolkit/scripts/sync-mirror.mjs
node --test scripts/lib/*.test.mjs
node scripts/build-starter.mjs --check
node .toolkit/scripts/check-ai-guidance.mjs --root . --strict
node .toolkit/scripts/sync-mirror.mjs --check
```

`--upgrade` 不删除本地附加文件，但仍必须审查 diff；兼容性不明时一次只升级一个 Skill。

## 4. 对账

```bash
node scripts/update-vendored.mjs --rebaseline <skill-name>
node scripts/update-vendored.mjs --rebaseline all
```

只有本地与上游逐字节一致（文本行尾归一后）才允许 rebaseline；它不是冲突解决工具。

## 5. 离线升级

联网环境或 CI 生成包：

```bash
node scripts/update-vendored.mjs --pack bundle
```

离线评估和应用：

```bash
node scripts/update-vendored.mjs --diff <skill-name> --offline bundle
node scripts/update-vendored.mjs --upgrade <skill-name> --offline bundle
node .toolkit/scripts/sync-mirror.mjs
node .toolkit/scripts/check-ai-guidance.mjs --root . --strict
```

## 6. npm 包和宿主插件升级

查看 根目录 manifest 的 packages 字段 与 `docs/capabilities.md`，在隔离分支更新版本；同步更新能力边界；运行测试、严格校验、镜像检查和 Starter 构建；记录兼容性与回滚方式。宿主插件未实际连接时，不能写成 Starter 内置能力。

## 7. GitHub CI

### `ci.yml`

`main` push 和 `v*` tag 触发；Ubuntu/Windows + Node 22 运行单元测试和严格 AI guidance 校验。`v*` tag 还会检查 tag 与 根目录 manifest 的版本字段 一致，构建 `dist-starter`、打 ZIP 并创建 Release。

### `vendored-check.yml`

每周一 UTC 03:23、手动触发和 `main` push 触发；运行升级检查，有升级项时上传 bundle artifact，定时/手动运行会创建或更新 Issue。网络慢时下载 artifact，使用 `--offline` 评估/应用。

## 8. 提交和回滚

升级提交通常包含：

```text
根目录 manifest
.agents/skills/<name>/
.claude/skills/<name>/
docs/（行为或操作变化时）
测试和校验结果
```

回滚优先恢复本次提交，再运行镜像检查和全部质量门禁。

## 9. 禁止捷径

不要手改 `.claude/skills/`，不要未看 diff 就升级全部，不要声称未连接插件可用，不要提交 token/cookie/代理凭据，不要删除引用或改退出码绕过失败。
