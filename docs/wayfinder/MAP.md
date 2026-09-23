---
label: wayfinder:map
title: elms-h5 → ai-front-spec 融合规格
status: closed
---

## Destination

一份已锁定的融合规格：elms-h5 快照的通用规范/规则/技能与 WebView 知识沉淀融入 ai-front-spec；多端 + WebView 经"项目级挂载 × 条目标注 × route.meta 页面声明"三层适用域无冲突共存；冲突在 init/update 决策时由兼容性矩阵显式亮出；WebView 通过支持端决策卡显式接入（init 主入口 + update 后补 + 任务路由持续触发）。规格零决策留白，可直接执行合并（合并执行本身在地图范围外）。

## Notes

- 域：AI 前端开发规则工具包。hub = `C:\Users\yangsheng\Desktop\ai-front-spec`；素材 = elms-h5 快照（2026-09-17 冻结；用户另有备份，非孤本，故不做 git 化/存档迁入；103 条规则已完成通用性分类，见 `assets/elms-h5-rule-classification.md`）。
- 每个决策票会话先调用 Skill：`grilling` 与 `domain-modeling`；研究票用 `research`。
- 站位偏好：简单优先、消除特殊情况、不破坏 ai-front-spec 既有流程（零新机制，寄生在决策卡/路由/能力清单上）；YAGNI；私货（qisi-*、纳纳、奇奇币、`_static/_dynamic/_demo` 路由结构）永不进通用层，改写遵循分类报告的"去私有化要点"。
- 已考虑并否决的替代（2026-09-22 二轮自审）：规则库机器化（JSON/YAML 规则库 + CLI 按页产出生效规则集）——执法更强但属新机制，markdown + 查表协议对 AI 读者已足够；**重开触发条件**：条目达数百级，或实践中观察到标签误用。
- 执行期注意（2026-09-22 四轮系统自审）：矩阵种子选型词须与决策卡选项词表逐词校对（自定义答案不命中=预期，Q1 impacts"矩阵介入"兜底）；Q1 卡 impacts 措辞保持一句话级，特性清单归矩阵，防两处维护；挂载条件句共 5 份复制（3 模板 + AGENTS.md 路由行 + 规则层文档头）须同步——5 份复制全部由测试断言锁定（票 05 改动清单 9：3 模板 + AGENTS.md 路由行 + 规则层文档头，另加文档头/矩阵内容锚）。
- 已考虑并否决的替代（2026-09-22 四轮系统自审）：矩阵并入规则层文档（挂载条件冲突——规则层 webview 条件加载，矩阵须全项目可扫）；页面负向声明 targetsExclude（意图不锚定 + update 加端时静默漂移，详见票 04 修正 6）。
- 制图前已锁定的决策（预图片段，不再开票）：
  - 形态 = 部分合并（hub + 只读存档 + 提炼层）；用户下注 A（Tier 0/1/2 全做）
  - WebView 定位 = 附加层：画像按框架选模板，webview 是 deliveryTargets 的一项，不做框架×端的专属模板组合
  - 适用域 = 三层缝合：项目级挂载（**2026-09-22 票 05 修正**：webview 或 mobileH5 任一确认即载入——原 webview 单键使纯移动 H5 静默缺席 [视口] 规则）× 条目适用标注（仅 WebView 容器/仅移动视口/全端）× `route.meta.targets` 页面声明（缺省跟随项目主端）
  - 判定 = 显式选择（init 决策卡 + update 后补），永不隐式猜测；容器/能力/约束三概念暂不拆分（YAGNI，出现"要容器不要桥"的真实项目再拆）
  - 技能库 = 前端 9 个入库（mobile-ux、apple-design、gsap×3、figma、tinypng、playwright、compatibility-testing），原生 4 个仅存档；**2026-09-22 改判：karpathy 入库**（「免安装自包含」原则——starter 不依赖使用者另装原版插件）；tinypng 换快照 13KB 新版脚本
  - 工具链 = Codex 为主；Claude Code 适配：**2026-09-23 修正**——原判「原生读 AGENTS.md，零适配」有误（Claude Code 不自动读 AGENTS.md，技能只认 `.claude/skills/` + `/名` 语法）；现文档层经 `CLAUDE.md`（`@AGENTS.md` 一行引用）接入，技能层 `.claude/skills/` 全镜像 `.agents/skills/`（测试锁逐字节同步）；结构扁平化与更新承诺等其余分发形态问题另行拍板
- 本地 markdown tracker：`tickets/` 每票一文件，front matter 记 `label/status/blocked-by/assignee`；阻塞关系看 `blocked-by`。
- **地图完成（2026-09-22）**：5/5 票关闭，雾区清零——规格零决策留白，进执行期（执行范围见 Out of scope 第一条；按既定指令以 subagent 执行，校验器双副本同步）。

## Decisions so far

- [研究：init 与 update 机制的接入点](tickets/01-research-init-update-hooks.md)：四个接入点全部确认可行——Q1 卡加 webview 选项（改动面最小，impacts 槽位承载代价提示）、deliveryTargets 状态机（正式名 user-confirmed，update 走访谈不可静默）、AGENTS.md:19 句式照抄做条件路由（无现成 deliveryTargets 先例，最近似可拼）、docs 整目录递归复制自动分发（但 requiredFiles 不注册即脱离门禁）；坑：校验器双副本须同步改。详见 [assets/research-init-update-hooks.md](assets/research-init-update-hooks.md)。
- [决策卡与 update 的 WebView 接入设计](tickets/02-grilling-webview-card-design.md)：Q1 alternatives 加 "default + enterprise-webview" 组合项（custom 逐值编辑保留）；impacts 四条（CSS 兜底/JSBridge 封装/真机验收/矩阵介入）；webview 是容器维度与端形态正交、无非法组合表；confirmed 门槛 = 能填容器名才 confirmed 否则 deferred；update 只强制矩阵复检；矩阵接口已锁死（输入 confirmed 端+技术栈，输出冲突条目+裁决选项，Q1 展示时与 update 时消费，卡片只展示不裁决）——票 03 只填内容。
- [WebView 规则层结构与适用域标注](tickets/04-prototype-rule-layer-structure.md)：8 域组织 + ~95 条归属表（锁结构不锁明细）；标签 3 值 [容器]/[视口]/[全端] 封闭枚举；**标签可识别性的机械解**——激活条件表（标签键名=deliveryTargets 键名，零翻译层）+ 判定协议四步（读主端→读页面声明→查表→生效标签集落纸进 plan，inspect 执行 verify 可核对）；route.meta.targets 显式覆盖缺省、声明即事实不推断，但**只能收窄不能扩端**（⊆ confirmed；扩端=改端走 update；执法=判定协议第 2 步守卫超集即停 + update 复检声明；否决 targetsExclude 负向格式——静默漂移，见票 04 修正 6）；降级=背景知识不隐藏。草案见 [assets/ai-webview-mobile-structure-draft.md](assets/ai-webview-mobile-structure-draft.md)。
- [兼容性矩阵草案](tickets/03-prototype-conflict-matrix.md)：独立文档 `AI_COMPATIBILITY_MATRIX.md`（注册 requiredFiles，消费方=project-profile 访谈，不进任务路由，项目可增补）；8 列条目格式（方案 C："目标"拆"含/缺"两列，命中 = 含任一∈S ∧ 缺无一∈S ∧ 选型(—|∈T)，零语法纯查表），级别二分冲突/提醒（亮出非禁令）；命中落纸进 proposal 具名槽 `compatibilityScan`（不落纸=未扫描；Q1 展示即时提示不落纸，义务挂 materialize 前全量 + update 复检），消费时机按票 02 修正节；种子 9 条（3 冲突 6 提醒，含票面点名补回的共享单页条目）成文；收窄容器基线口子开（代价=验收含该基线真机，声明落纸进 webview.value 容器名+最低版本）；不做校验脚本（YAGNI）。修正明细见票 03 修正节（2–7，另 10 = 裁决记录持久家）。草案见 [assets/compatibility-matrix-draft.md](assets/compatibility-matrix-draft.md)。
- [vue-webview 画像模板终稿](tickets/05-grilling-profile-template.md)：三模板第 3 节表格后**同一句一字不差**引用规则层（不加待填写槽位，零校验影响；测试锁——project-profile.test.mjs 新断言沿 :107 惯例）；只引规则层不引矩阵（任务期要裁决结果不要裁决工具）；组件目录**零动作**（三场景各有归属——雾区关闭）；裁决记录持久家 = materialize 并入 PROJECT_PROFILE 第 10 节兼容裁决记录（compatibilityScan 不随 proposal 蒸发）；**挂载条件扩宽**：webview 或 mobileH5 任一确认即载入（纯移动 H5 不再静默缺席 [视口] 规则；tablet/纯桌面有意不挂载）。顺手修：草例 browser→browserWeb（枚举违例）。

## Not yet specified

（无——雾区清零 2026-09-22。组件目录挂起项由「vue-webview 画像模板终稿」关闭：零动作，三场景各有归属。历史清理：矩阵持久化格式→票 03；WebView 验收清单条目→票 04 域 8。）

## Out of scope

- 合并执行本身：skills 库迁入、`toolkit.json`/`AGENTS.md`/`CODEX_CAPABILITIES.md` 接线、build-starter 与测试验证——地图走完即开干，不在图内（快照 git 化与存档迁入已取消：用户另有备份，2026-09-21 裁决）
- elms-h5 真实仓库的规则回传（孤本，无上游）
- 原生 Android/鸿蒙技能的启用（真做原生项目另起努力）
