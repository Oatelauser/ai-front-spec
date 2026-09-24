# Greenfield 目录草图（去锚定 · 票 06 步骤一）

绘制方法：仅凭 MAP-2 已锁定需求 + [starter-survey-research.md](starter-survey-research.md) 业界模式，**未翻现状目录**。
落盘时间：2026-09-23，现状 audit 派发之前——本文件即去锚定顺序的证据。
粒度：结构本质层。`scripts/` 落点、CLAUDE.md 桥、docs 内部分类等细则明确让渡给票 07（终态目录规格）。

## 需求输入（全部已锁定）

1. 拷贝即用、零外部 skill/plugin 下载（插件降级为文档说明的宿主可选安装）
2. Codex 功能完整性硬约束；Claude Code 尽量一等公民
3. 仓库根目录扁平：hub 根 ≈ starter 本体
4. `.codex` → `.toolkit` 中性运行时目录
5. `.agents/skills` 唯一人工源 + `.claude/skills` 机器镜像（AUTO-GENERATED 头 + 测试锁防漂移）
6. 8 个外部独立 skill vendored 入库（NOTICE + 保留原许可）
7. 分发 = 本地一条命令出干净副本 + GitHub release zip

业界模式依据：规范根 + 宿主薄适配（ECC/agentic-stack/prisma）；镜像成败在 CI `--check`/测试锁执法，不在生成；vendor 许可 = NOTICE + 不再许可声明。

## 目录树草图

```
<repo-root>/                         ← 仓库根 = starter 本体 = 分发根（扁平）
│
├── AGENTS.md                        ← 代理唯一入口（Codex 原生自动读；CC v2.1.277+ 回退读）
├── README.md                        ← 人类入口：拷贝即用三步 + 宿主插件（可选）安装说明
├── toolkit.json                     ← starter 版本与元数据
├── NOTICE                           ← vendored 技能归属 + "第三方保留原许可"声明
│
├── docs/
│   ├── rules/                       ← 规则层 AI_*.md（宿主无关资产）
│   ├── templates/                   ← 组件目录 / 脚手架模板
│   ├── capabilities.md              ← 宿主能力清单 + 插件（可选）降级说明
│   └── guides/                      ← 面向人的使用/贡献指南
│
├── .agents/skills/                  ← 技能源：唯一人工编辑（Codex 原生扫描）
│   ├── <项目技能>/                   ← 含机制类技能（profile 决策卡等若为技能形态）
│   └── <vendored × 8>/              ← 外部 skill 入库，上游许可文件随目录保留
│
├── .claude/skills/                  ← 机器镜像：脚本生成、禁手编（AUTO-GENERATED 头）
│
├── .toolkit/                        ← 中性运行时目录（原 .codex 更名，不再是技能目录）
│   ├── validators/                  ← check-ai-guidance 等守门校验器
│   ├── scripts/                     ← 镜像同步 / 干净副本 / release zip（落点票 07 定）
│   └── tests/                       ← 测试锁（镜像防漂移、死引用检查）
│
└── CLAUDE.md （可选一行桥，票 07 裁决——新版 CC 已原生回退，旧版/Bedrock/Vertex 需桥）
```

## 信息架构

- **入口**（两个，一代理一人类）：`AGENTS.md` / `README.md`。单一代理入口，避免双入口漂移。
- **路由**：AGENTS.md 扇出五路——规则 `docs/rules` / 技能 `.agents/skills` / 模板 `docs/templates` / 守门 `.toolkit/validators` / 宿主插件 `docs/capabilities.md`。
- **状态文件**：`toolkit.json`（版本）→ git tag → release zip。镜像的新鲜度由测试锁证明，不另设状态文件。
- **不变量**：`.agents/skills` 是唯一源；`.claude/skills` 永远可由脚本再生成；零外部下载（宿主插件可选除外）。

## 草图中标注"票 07 定"的悬空点

- CLAUDE.md 一行桥去留；`scripts/` 在根还是在 `.toolkit/` 内；docs/ 内部分类细则；vendored 命名空间前缀。
