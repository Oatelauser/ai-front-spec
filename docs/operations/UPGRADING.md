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

## 7. 提交和回滚

升级提交通常包含：

```text
根目录 manifest
.agents/skills/<name>/
.claude/skills/<name>/
docs/（行为或操作变化时）
测试和校验结果
```

回滚优先恢复本次提交，再运行镜像检查和全部质量门禁。

## 8. 禁止捷径

不要手改 `.claude/skills/`，不要未看 diff 就升级全部，不要声称未连接插件可用，不要提交 token/cookie/代理凭据，不要删除引用或改退出码绕过失败。

## 9. 消费项目升级（与上述维护操作不同）

在新版 Starter 源仓运行 `node scripts/build-starter.mjs --target <消费项目> --dry-run`；确认计划后去掉 `--dry-run` 执行。已有项目新增默认 MCP 服务器须显式 `--accept-mcp`，同名不同配置仍报冲突。只操作用户明确指定的本地目标，不扩大宿主权限或写全局配置。

成功安装的受管内容哈希保存于消费项目 `.toolkit/manifest.json` 的 `installation.files`；上游 commit、Starter 版本与新版内容都不是旧安装基线。旧安装无基线的差异默认不覆盖；画像、入口及用户状态继续保护。双边变化、坏安装记录、目标链接与重叠路径会在写入前失败。

执行中的可捕获失败恢复本次写入，成功后才提交安装事实；恢复失败打印并保留 `starter-transaction-*` 中的编号旧内容与 `recovery.json`，供人工恢复，不要求消费项目存在 Git。未自动删除用户内容或上游移除的旧文件；手工复制 Release zip 不提供这些保护。

当前验证范围不含断电/强制结束进程后的自动恢复，也不保证抵御任意并发替换路径；发生恢复失败时，恢复材料不是可清理垃圾。公开发布仍受本轮第三方材料政策约束，不因安装测试通过自动恢复发布。
