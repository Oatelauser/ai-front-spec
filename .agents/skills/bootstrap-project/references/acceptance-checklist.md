# 初始化验收

先检查实际接入清单、画像证据、受保护文件差异、AGENTS 入口和 Skill 元数据，确认没有把模板预设或测试值当成目标事实。检查 [资源生命周期](resource-lifecycle.md) 的 manifest 字段。

已接入副本时在目标根目录运行：

```text
node .codex/scripts/check-ai-guidance.mjs --root .
node --test .codex/scripts/lib/ai-guidance-validation.test.mjs
node .codex/scripts/check-ai-guidance.mjs --root . --strict
```

没有 `.codex/scripts/` 副本时，在当前根目录运行 `node resources/scripts/check-ai-guidance.mjs --root .`，严格检查追加 `--strict`；测试运行 `node --test resources/scripts/lib/ai-guidance-validation.test.mjs`。两种方式都读取当前项目 `.codex/ai-guidance.config.mjs`。核对 AGENTS、画像和包门禁实际引用存在的脚本。

同目录初始化还需核对：既有三个 Skill 未被复制到自身或清空，根 AGENTS 的项目规则已保留，resources 候选未被业务值覆盖，重复执行保留已有画像、能力状态和业务文件。已搭建工程时，根目录出现 package.json 和源码是预期结果，不是模板污染。

使用当前宿主的 Skill validator 检查批准的项目 Skill；Windows Python 使用 `python -X utf8 <validator> <skill目录>`。再按画像运行真实存在且适用于规则变更的项目质量命令，不运行虚构包脚本或业务写操作。

strict 模式禁止配置登记文件中的占位符；只有用户批准接入包门禁时才启用 packageIntegration。草稿允许延后低影响字段，但必须报告 draft，不能声称初始化完成。目标正式完成还要求：AGENTS/画像/Skill 接入完整、字段均已确认、manifest 来源版本有效、实际校验通过、没有未经批准的业务改动。

交付分别报告：文件接入、校验、新会话可发现性、外部能力和未验证项。新会话发现须实际检查，无法检查时写“待新会话验证”；初始化文件完成不等于业务项目可运行。记录实际命令后回读 manifest 和目标文件，避免只凭退出码宣称所有能力就绪。
