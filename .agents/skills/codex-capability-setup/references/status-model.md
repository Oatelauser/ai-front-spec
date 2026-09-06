# 能力状态模型

记录文件为当前项目 `docs/capability-state.json`，模板为同一仓库的 `resources/templates/capability-state.template.json`。B/C 阶段获得记录授权后可在本仓库创建或更新，保留已有条目；不把实际能力状态写回模板。使用 JSON 解析和保留未知字段的定向合并，不用字符串拼接更改记录。

顶层 schemaVersion=1，updatedAt 为实际 ISO 时间或未检查时 null，mode 为 on-demand/core/ui/react-ui/figma/github/full，capabilities 为条目数组。安装审计在对话中使用同一字段，只有授权的 B/C 阶段才持久化到目标。

每条包含 id、type（plugin/host/skill/project-skill）、exactReference、source、path、installed、enabled、connected、discoverable、taskUsable、installability、evidence、blockers、checkedAt。

| 字段 | 可用值 |
| --- | --- |
| installed | yes / no / source-unverified / not-applicable / unknown |
| enabled | yes / no / not-applicable / unknown |
| connected | yes / no / not-required / not-applicable / unknown |
| discoverable | yes / no / new-session-required / not-applicable / unknown |
| taskUsable | yes / no / not-required / unknown |
| installability | available / approval-required / host-unsupported / source-unreachable / path-missing / not-applicable / unknown |

source 记录批准来源及可用时的固定提交；evidence 是命令/操作、结果摘要、证据路径组成的数组；blockers 为具体原因数组。不得保存令牌、密码、敏感环境变量或完整私人响应。

安装、启用、连接、发现与任务可用是独立维度，不能根据一个布尔值填满其他字段。taskUsable=yes 要有任务所需各维度的证据；宿主能力没有安装步骤，项目 Skill 需要目标文件接入。重复检查保留既有条目并更新该 id 的实际检查结果；失效证据标为 unknown/no，不沿用旧成功结论。
