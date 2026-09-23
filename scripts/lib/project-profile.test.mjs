import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const toolkit = JSON.parse(readFileSync(resolve(root, 'toolkit.json'), 'utf8'))
const starterRoot = resolve(root, toolkit.starter.sourceRoot)

test('starter is the only distributable source and contains all profile candidates', () => {
  assert.equal(toolkit.kind, 'frontend-project-starter')
  assert.equal(toolkit.starter.copyContentsToProjectRoot, true)
  assert.deepEqual(Object.keys(toolkit.profiles).sort(), ['generic', 'react', 'vue'])
  for (const profilePath of Object.values(toolkit.profiles)) {
    assert.equal(existsSync(resolve(root, profilePath)), true, profilePath)
  }
  assert.equal(existsSync(resolve(starterRoot, '.agents/skills/bootstrap-project')), false)
  assert.equal(existsSync(resolve(starterRoot, '.agents/skills/project-profile/SKILL.md')), true)
  assert.equal(existsSync(resolve(starterRoot, '.codex/templates/component-catalog.template.md')), true)
  assert.equal(existsSync(resolve(starterRoot, '.codex/templates/component-catalog.presets.json')), true)
  for (const name of ['generic', 'react', 'vue']) {
    assert.equal(existsSync(resolve(starterRoot, `.codex/templates/component-catalog.${name}.md`)), true)
  }
})

test('project profile owns template selection and keeps recommendation separate from choice', () => {
  const skill = readFileSync(resolve(starterRoot, '.agents/skills/project-profile/SKILL.md'), 'utf8')
  const selection = readFileSync(resolve(starterRoot, '.agents/skills/project-profile/references/template-selection.md'), 'utf8')
  const state = JSON.parse(readFileSync(resolve(starterRoot, '.codex/profile-state.json'), 'utf8'))
  assert.match(skill, /\$project-profile status/)
  assert.match(skill, /\$project-profile profile/)
  assert.match(skill, /\$project-profile components/)
  assert.match(skill, /read-only navigator|只读.*导航/s)
  assert.match(skill, /generic.*react.*vue/s)
  assert.match(selection, /推荐项不是选择|recommendation is not a selection/i)
  assert.equal(state.templateSelection.status, 'pending')
  assert.equal(state.templateSelection.selected, null)
})

test('template selection must continue with exhaustive grilling over profile placeholders', () => {
  const skill = readFileSync(resolve(starterRoot, '.agents/skills/project-profile/SKILL.md'), 'utf8')
  const selection = readFileSync(resolve(starterRoot, '.agents/skills/project-profile/references/template-selection.md'), 'utf8')
  for (const text of [skill, selection]) {
    assert.match(text, /每个.*占位符|every.*placeholder/i)
    assert.match(text, /grill|分轮|round/i)
    assert.match(text, /deferred|defer|暂缓/i)
    assert.match(text, /remaining frontier|剩余.*frontier|剩余.*问题/i)
  }
  assert.match(skill, /project name|integration tests|coverage|maintenance owner/i)
  assert.match(skill, /不能.*总结|final summary|不能.*汇总/s)
})

test('starter manifest is initialized while profile completion remains pending', () => {
  const manifest = JSON.parse(readFileSync(resolve(starterRoot, '.codex/manifest.json'), 'utf8'))
  assert.equal(manifest.starterStatus, 'ready')
  assert.equal(manifest.bootstrapStatus, 'initialized')
  assert.equal(manifest.profileStatus, 'draft')
  assert.equal(manifest.templateSelection.status, 'pending')
  assert.deepEqual(manifest.templateSelection.candidates, ['generic', 'react', 'vue'])
  assert.equal(manifest.componentCatalogStatus, 'draft')
})

test('profile and components are separate peer commands and mutually referential without cross-completing', () => {
  const skill = readFileSync(resolve(starterRoot, '.agents/skills/project-profile/SKILL.md'), 'utf8')
  const catalog = readFileSync(resolve(starterRoot, 'docs/AI_COMPONENT_CATALOG.md'), 'utf8')
  assert.match(skill, /maturity.status.*missing.*profile/s)
  assert.match(skill, /assessedAt.*null|evidence.*persisted/s)
  assert.match(skill, /do not fill its placeholders|不能.*填.*画像|不能.*profileStatus/s)
  assert.match(skill, /profile.*components/s)
  assert.match(catalog, /必须先读取.*maturity|缺少成熟度.*profile/s)
  assert.match(catalog, /Element Plus.*推荐|Ant Design.*推荐|框架中立.*基础组件/s)
  assert.match(catalog, /规划候选|planned/)
  assert.match(catalog, /每个.*占位符|全部.*字段/s)
})

test('component catalog has a shared structure template and explicit framework presets', () => {
  const template = readFileSync(resolve(starterRoot, '.codex/templates/component-catalog.template.md'), 'utf8')
  const presets = JSON.parse(readFileSync(resolve(starterRoot, '.codex/templates/component-catalog.presets.json'), 'utf8'))
  assert.match(template, /implemented.*planned.*deferred.*conflict/s)
  assert.match(template, /规划依据.*落地条件/s)
  assert.match(template, /全部.*占位符|每个字段/s)
  for (const name of ['generic', 'react', 'vue']) {
    const presetTemplate = readFileSync(resolve(starterRoot, `.codex/templates/component-catalog.${name}.md`), 'utf8')
    assert.match(presetTemplate, /组件矩阵/)
    assert.match(presetTemplate, /全部.*占位符/)
    assert.match(presetTemplate, /planned.*implemented.*deferred/s)
    assert.match(presetTemplate, /支持端.*响应式变体.*触摸行为.*安全区域/s)
  }
  assert.deepEqual(Object.keys(presets.presets).sort(), ['generic', 'react', 'vue'])
  assert.deepEqual(presets.choices, ['recommended', 'other-candidate', 'custom', 'defer'])
  for (const preset of Object.values(presets.presets)) {
    assert.equal(preset.recommended, true)
    assert.equal(preset.status, 'planned')
    assert.ok(preset.components.length > 0)
  }
})

test('init proposal, delivery targets, and frontend task contracts are discoverable', () => {
  const proposal = JSON.parse(readFileSync(resolve(starterRoot, '.codex/templates/profile-proposal.template.json'), 'utf8'))
  assert.deepEqual(proposal.cards.map(card => card.id), ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7'])
  assert.deepEqual(Object.keys(proposal.writeScopes).sort(), ['componentPlan', 'deferred', 'facts', 'recommendations', 'userDecisions'])
  assert.ok(proposal.traceability.length > 0)
  const state = JSON.parse(readFileSync(resolve(starterRoot, '.codex/profile-state.json'), 'utf8'))
  assert.equal(state.deliveryTargets.multiPlatform.derived, true)
  assert.match(readFileSync(resolve(starterRoot, '.agents/skills/project-profile/references/init-workflow.md'), 'utf8'), /Q1.*Q2.*Q3.*Q4.*Q5.*Q6.*Q7/s)
  assert.match(readFileSync(resolve(starterRoot, 'docs/AI_FRONTEND_TASK.md'), 'utf8'), /deliveryTargets.*AI_COMPONENT_CATALOG/s)
})

const WEBVIEW_RULE_SENTENCE =
  'deliveryTargets 含 webview 或 mobileH5 时，页面任务与全局样式、主题、构建配置改动受 [WebView 移动端规则](docs/AI_WEBVIEW_MOBILE.md) 约束，按页面声明判定生效标签集（全局改动无页面声明，按主端全集合判定）'

test('webview mobile rule mounting condition stays identical across templates, AGENTS routing, and rule docs', () => {
  for (const name of ['generic', 'react', 'vue']) {
    const templatePath = `.codex/templates/project-profile.${name}.md`
    const template = readFileSync(resolve(starterRoot, templatePath), 'utf8')
    assert.ok(
      template.includes(WEBVIEW_RULE_SENTENCE),
      `${templatePath} 缺少 WebView 引用句（三份模板必须一字不差，检测到复制漂移）：${WEBVIEW_RULE_SENTENCE}`,
    )
  }

  const agents = readFileSync(resolve(starterRoot, 'AGENTS.md'), 'utf8')
  assert.match(
    agents,
    /`webview` 或 `mobileH5` 任一为 `user-confirmed`/,
    'AGENTS.md 路由行挂载条件句与规则层文档头不一致（5 份复制漂移之一）',
  )
  assert.match(agents, /AI_WEBVIEW_MOBILE\.md/, 'AGENTS.md 路由行未引用 docs/AI_WEBVIEW_MOBILE.md')

  const webviewRules = readFileSync(resolve(starterRoot, 'docs/AI_WEBVIEW_MOBILE.md'), 'utf8')
  assert.match(
    webviewRules,
    /含 `webview` 或 `mobileH5` 任一为 `user-confirmed` 即载入/,
    'AI_WEBVIEW_MOBILE.md 文档头生效条件句漂移（5 份复制漂移之一）',
  )
  assert.match(webviewRules, /激活条件表/, 'AI_WEBVIEW_MOBILE.md 缺少「激活条件表」锚点')

  const matrix = readFileSync(resolve(starterRoot, 'docs/AI_COMPATIBILITY_MATRIX.md'), 'utf8')
  assert.match(matrix, /含 任一/, 'AI_COMPATIBILITY_MATRIX.md 缺少合同句「含 任一」锚点')
  assert.match(matrix, /缺 无一/, 'AI_COMPATIBILITY_MATRIX.md 缺少合同句「缺 无一」锚点')
})

const collectSkillFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? collectSkillFiles(resolve(dir, entry.name)).map((relativePath) => `${entry.name}/${relativePath}`)
      : [entry.name],
  )

test('claude skills mirror stays byte-identical to agents skills', () => {
  const agentsDir = resolve(starterRoot, '.agents/skills')
  const claudeDir = resolve(starterRoot, '.claude/skills')
  const agentsFiles = collectSkillFiles(agentsDir).sort()
  const claudeFiles = collectSkillFiles(claudeDir).sort()
  assert.deepEqual(
    claudeFiles,
    agentsFiles,
    '.claude/skills 与 .agents/skills 相对文件集合不一致（镜像出现增删或漏复制）',
  )
  for (const relativePath of agentsFiles) {
    const agentsContent = readFileSync(resolve(agentsDir, relativePath), 'utf8').replaceAll('\r', '')
    const claudeContent = readFileSync(resolve(claudeDir, relativePath), 'utf8').replaceAll('\r', '')
    assert.equal(
      claudeContent,
      agentsContent,
      `.claude/skills/${relativePath} 与 .agents/skills/${relativePath} 去除 \\r 后内容不一致（镜像漂移）`,
    )
  }
})
