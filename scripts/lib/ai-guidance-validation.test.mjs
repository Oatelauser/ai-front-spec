import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  collectGuidanceErrors,
  parseSkillFrontmatter,
  validateDeadReferences,
  validateTaskRecords,
  validateDocumentedPackageScripts,
  validateLocalLinks,
} from '../../.toolkit/scripts/lib/ai-guidance-validation.mjs'

const config = {
  allowPlaceholders: true,
  forbiddenPatterns: ['old-project-name'],
  placeholderPattern: '<待填写(?:[：；][^>]*)?>',
  requiredFiles: [
    'AGENTS.md',
    'docs/rules/AI_TASK_CONTRACT.md',
    '.agents/skills/project-workflow/SKILL.md',
    '.agents/skills/project-workflow/agents/openai.yaml',
    '.agents/skills/project-workflow/references/task-routing.md',
    'docs/capabilities.md',
  ],
  promptContracts: [
    {
      file: 'docs/rules/AI_TASK_CONTRACT.md',
      sections: ['目标：', '上下文：', '约束：', '完成条件：'],
    },
  ],
  projectSkill: {
    name: 'project-workflow',
    path: '.agents/skills/project-workflow/SKILL.md',
    metadataPath: '.agents/skills/project-workflow/agents/openai.yaml',
    maxLines: 500,
    triggerPatterns: ['Use when'],
  },
  routing: {
    path: '.agents/skills/project-workflow/references/task-routing.md',
    requiredMarkers: ['普通功能', '真实验收'],
  },
  capabilityRequirements: {
    path: 'docs/capabilities.md',
    requiredMarkers: ['plugin@example-marketplace', 'owner/repository'],
  },
  packageIntegration: {
    enabled: true,
    required: false,
    manifestPath: 'package.json',
    aiCheckScript: 'ai:check',
    aiCheckCommand: 'node scripts/check-ai-guidance.mjs',
    qualityScripts: ['check'],
  },
}

const validFiles = {
  'AGENTS.md': '使用 $project-workflow。',
  'docs/rules/AI_TASK_CONTRACT.md': '目标：结果\n上下文：事实\n约束：边界\n完成条件：证据',
  '.agents/skills/project-workflow/SKILL.md': `---
name: project-workflow
description: Execute and verify project work. Use when changing this repository.
---

# Workflow
`,
  '.agents/skills/project-workflow/agents/openai.yaml': `interface:
  display_name: "Project workflow"
  short_description: "Plan, implement, and verify scoped project work"
  default_prompt: "Use $project-workflow to complete a scoped task."
`,
  '.agents/skills/project-workflow/references/task-routing.md': '普通功能\n真实验收',
  'docs/capabilities.md': 'plugin@example-marketplace\nowner/repository',
}

describe('AI guidance validation', () => {
  it('接受完整的通用提示词工程', () => {
    assert.deepEqual(collectGuidanceErrors({ config, files: validFiles }), [])
  })

  it('拒绝缺失文件、乱序 Prompt 合同和未路由的项目 Skill', () => {
    const files = {
      ...validFiles,
      'AGENTS.md': '没有入口',
      'docs/rules/AI_TASK_CONTRACT.md': '上下文：事实\n目标：结果\n约束：边界',
    }
    delete files['.agents/skills/project-workflow/agents/openai.yaml']

    const codes = collectGuidanceErrors({ config, files }).map((error) => error.code)
    assert.ok(codes.includes('PE001'))
    assert.ok(codes.includes('PE002'))
    assert.ok(codes.includes('PE006'))
    assert.ok(codes.includes('PE013'))
  })

  it('只接受目录名一致且仅包含 name/description 的 Skill frontmatter', () => {
    assert.deepEqual(
      parseSkillFrontmatter(`---
name: wrong-name
description: Missing trigger detail.
metadata: invalid
---`),
      {
        description: 'Missing trigger detail.',
        extraKeys: ['metadata'],
        name: 'wrong-name',
      },
    )
    assert.equal(
      parseSkillFrontmatter(`---
name: project-workflow
description: >-
  Plan and execute project work.
  Use when changing a repository.
---`).description,
      'Plan and execute project work. Use when changing a repository.',
    )
  })

  it('严格模式拒绝占位符和伪装接入总门禁的包脚本', () => {
    const strictConfig = {
      ...config,
      allowPlaceholders: false,
      packageIntegration: { ...config.packageIntegration, required: true },
    }
    const files = { ...validFiles, 'AGENTS.md': '使用 $project-workflow。<待填写：命令>' }
    const packageJson = {
      scripts: {
        'ai:check': 'node scripts/check-ai-guidance.mjs',
        check: 'echo npm run ai:check',
      },
    }

    const codes = collectGuidanceErrors({ config: strictConfig, files, packageJson }).map(
      (error) => error.code,
    )
    assert.ok(codes.includes('PE010'))
    assert.ok(codes.includes('PE012'))

    const conditionalPackage = {
      scripts: {
        'ai:check': 'node scripts/check-ai-guidance.mjs',
        check: 'npm run test || npm run ai:check',
      },
    }
    const conditionalCodes = collectGuidanceErrors({
      config: strictConfig,
      files: validFiles,
      packageJson: conditionalPackage,
    }).map((error) => error.code)
    assert.ok(conditionalCodes.includes('PE010'))

    const connectedPackage = {
      scripts: {
        'ai:check': 'node scripts/check-ai-guidance.mjs',
        check: 'npm run quality',
        quality: 'npm run ai:check && npm run test',
      },
    }
    const connectedCodes = collectGuidanceErrors({
      config: strictConfig,
      files: validFiles,
      packageJson: connectedPackage,
    }).map((error) => error.code)
    assert.ok(!connectedCodes.includes('PE010'))
  })

  it('严格模式豁免模板与初始化前草稿的占位符，初始化后仍须报错', () => {
    const placeholderFiles = {
      ...validFiles,
      '.agents/skills/project-profile/templates/component-catalog.react.md': '基础组件：<待填写：组件名>',
      'docs/PROJECT_PROFILE.md': '运行时：<待填写：运行时>',
      'docs/rules/AI_COMPONENT_CATALOG.md': '按钮：<待填写：变体>',
    }
    const profileState = (status, catalogStatus) =>
      JSON.stringify({
        schemaVersion: 1,
        status,
        templateSelection: { status: 'pending', selected: null, candidates: ['generic', 'react', 'vue'] },
        maturity: { status: 'unformed', confidence: 'low', evidence: [], assessedAt: null },
        componentCatalog: { status: catalogStatus, unresolved: [], evidence: [], lastUpdatedAt: null },
        deliveryTargets: {
          browserWeb: { status: 'pending', value: null },
          mobileH5: { status: 'pending', value: null },
          tabletWeb: { status: 'pending', value: null },
          webview: { status: 'pending', value: null },
          pwa: { status: 'pending', value: null },
          multiPlatform: { status: 'pending', value: null, derived: true },
        },
        proposal: { path: '.toolkit/profile-proposal.json', status: 'none', proposalId: null },
        fields: {},
        evidence: [],
        unresolved: [],
      })
    const strictConfig = {
      ...config,
      allowPlaceholders: false,
      requiredFiles: [
        ...config.requiredFiles,
        '.agents/skills/project-profile/templates/component-catalog.react.md',
        'docs/PROJECT_PROFILE.md',
        'docs/rules/AI_COMPONENT_CATALOG.md',
        '.toolkit/profile-state.json',
      ],
    }

    const draftErrors = collectGuidanceErrors({
      config: strictConfig,
      files: { ...placeholderFiles, '.toolkit/profile-state.json': profileState('draft', 'draft') },
    })
    assert.deepEqual(
      draftErrors.filter((error) => error.code === 'PE012').map((error) => error.file),
      [],
    )

    const initializedErrors = collectGuidanceErrors({
      config: strictConfig,
      files: {
        ...placeholderFiles,
        '.toolkit/profile-state.json': profileState('initialized', 'initialized'),
      },
    })
    assert.deepEqual(
      initializedErrors.filter((error) => error.code === 'PE012').map((error) => error.file).sort(),
      ['docs/PROJECT_PROFILE.md', 'docs/rules/AI_COMPONENT_CATALOG.md'],
    )
  })

  it('接受 deliveryTargets 的 unsupported 状态（与模板词表对齐）', () => {
    const state = {
      schemaVersion: 1,
      status: 'initialized',
      templateSelection: { status: 'pending', selected: null, candidates: ['generic', 'react', 'vue'] },
      maturity: { status: 'unformed', confidence: 'low', evidence: [], assessedAt: null },
      componentCatalog: { status: 'initialized', unresolved: [], evidence: [], lastUpdatedAt: null },
      deliveryTargets: {
        browserWeb: { status: 'pending', value: null },
        mobileH5: { status: 'pending', value: null },
        tabletWeb: { status: 'pending', value: null },
        webview: { status: 'pending', value: null },
        pwa: { status: 'unsupported', value: null },
        multiPlatform: { status: 'pending', value: null, derived: true },
      },
      proposal: { path: '.toolkit/profile-proposal.json', status: 'none', proposalId: null },
      fields: {},
      evidence: [],
      unresolved: [],
    }
    const errors = collectGuidanceErrors({
      config: { ...config, projectRecords: { profile: '.toolkit/profile-state.json' } },
      files: { ...validFiles, '.toolkit/profile-state.json': JSON.stringify(state) },
    })
    assert.deepEqual(
      errors.filter((error) => error.code === 'PE016' && error.message.includes('deliveryTargets')),
      [],
    )
  })

  it('流程契约标记缺失报 PE020，齐备不报', () => {
    const flowConfig = { ...config, flowContracts: [{ file: 'docs/CONTRACT.md', markers: ['硬门槛'] }] }
    const withGate = collectGuidanceErrors({
      config: flowConfig,
      files: { ...validFiles, 'docs/CONTRACT.md': '……必须先产出方向原型并经用户确认（硬门槛）……' },
    })
    assert.deepEqual(withGate.filter((e) => e.code === 'PE020'), [])
    const withoutGate = collectGuidanceErrors({
      config: flowConfig,
      files: { ...validFiles, 'docs/CONTRACT.md': '普通说明，无门槛语言。' },
    })
    assert.ok(withoutGate.some((e) => e.code === 'PE020' && e.message.includes('硬门槛')))
  })

  it('模板端状态词不在词表报 PE016（词表两侧同步防漂移）', () => {
    const template = '.agents/skills/project-profile/templates/project-profile.vue.md'
    const good = collectGuidanceErrors({
      config,
      files: { ...validFiles, [template]: '| 多端适配 | `<待填写：user-confirmed / unsupported>` | `<待填写>` | `<待填写>` |' },
    })
    assert.deepEqual(good.filter((e) => e.code === 'PE016' && e.message.includes('状态词')), [])
    const bad = collectGuidanceErrors({
      config,
      files: { ...validFiles, [template]: '| 多端适配 | `<待填写：user-confirmed / bogus-state>` | `<待填写>` | `<待填写>` |' },
    })
    assert.ok(bad.some((e) => e.code === 'PE016' && e.message.includes('bogus-state')))
  })

  it('拒绝文档引用不存在的包脚本', () => {
    const errors = validateDocumentedPackageScripts({
      config,
      files: {
        ...validFiles,
        'AGENTS.md': '先执行 pnpm install 和 yarn install，再运行 npm run missing。',
      },
      packageJson: { scripts: {} },
    })
    assert.equal(errors.length, 1)
    assert.equal(errors[0].code, 'PE009')
  })

  it('拒绝 Prompt 最后一段为空并被后续标题伪装成正文', () => {
    const files = {
      ...validFiles,
      'docs/rules/AI_TASK_CONTRACT.md':
        '目标：结果\n上下文：事实\n约束：边界\n完成条件：\n## 使用原则\n这是另一节',
    }
    const errors = collectGuidanceErrors({ config, files })
    assert.ok(errors.some((error) => error.code === 'PE002'))
  })

  it('拒绝能力安装清单缺少固定插件或 Skill 来源', () => {
    const files = {
      ...validFiles,
      'docs/capabilities.md': 'plugin@example-marketplace',
    }
    const errors = collectGuidanceErrors({ config, files })
    assert.ok(errors.some((error) => error.code === 'PE014'))
  })

  it('接受带标题的本地链接并拒绝失效锚点', () => {
    const root = mkdtempSync(join(tmpdir(), 'ai-guidance-'))
    try {
      mkdirSync(join(root, 'docs'))
      writeFileSync(join(root, 'docs', 'target.md'), '# 存在标题\n', 'utf8')
      writeFileSync(join(root, 'docs', 'source.md'), '# 来源\n', 'utf8')

      assert.deepEqual(
        validateLocalLinks({
          files: {
            'docs/source.md':
              '[文档](target.md "标题")\n[锚点](target.md#存在标题)\n[本页](#来源)',
          },
          root,
        }),
        [],
      )
      const errors = validateLocalLinks({
        files: { 'docs/source.md': '[失效](target.md#不存在)' },
        root,
      })
      assert.equal(errors[0].code, 'PE008')
    } finally {
      rmSync(root, { force: true, recursive: true })
    }
  })

  it('CLI 提供稳定的成功、严格失败和 JSON 退出语义', () => {
    const templateRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
    const script = resolve(templateRoot, '.toolkit/scripts/check-ai-guidance.mjs')
    const fixtureRoot = mkdtempSync(join(tmpdir(), 'ai-guidance-cli-'))
    try {
      for (const [path, content] of Object.entries(validFiles)) {
        const target = resolve(fixtureRoot, path)
        mkdirSync(dirname(target), { recursive: true })
        writeFileSync(target, content, 'utf8')
      }
      writeFileSync(resolve(fixtureRoot, 'AGENTS.md'), validFiles['AGENTS.md'] + '<待填写：命令>')
      mkdirSync(resolve(fixtureRoot, '.toolkit'), { recursive: true })
      writeFileSync(resolve(fixtureRoot, '.toolkit/ai-guidance.config.mjs'),
        `export default ${JSON.stringify(config)}`)
    const normal = spawnSync(process.execPath, [script, '--root', fixtureRoot, '--format', 'json'], {
      cwd: fixtureRoot,
      encoding: 'utf8',
    })
    assert.equal(normal.status, 0)
    assert.equal(JSON.parse(normal.stdout).ok, true)

    const strict = spawnSync(process.execPath, [script, '--root', fixtureRoot, '--strict', '--format', 'json'], {
      cwd: fixtureRoot,
      encoding: 'utf8',
    })
    const result = JSON.parse(strict.stdout)
    assert.equal(strict.status, 1)
    assert.equal(result.ok, false)
    assert.ok(result.errors.some((error) => error.code === 'PE010'))
    assert.ok(result.errors.some((error) => error.code === 'PE012'))
    } finally {
      rmSync(fixtureRoot, { force: true, recursive: true })
    }
  })

  for (const resourceDirectory of ['.toolkit']) {
    it(`CLI 从 ${resourceDirectory} 定位同仓库项目，允许业务代码并保持文件不变`, () => {
      const toolkitScripts = resolve(dirname(fileURLToPath(import.meta.url)), '../../.toolkit/scripts')
      const fixtureRoot = mkdtempSync(join(tmpdir(), 'frontend-in-place-'))
      try {
        const fixtureFiles = {
          ...validFiles,
          '.toolkit/ai-guidance.config.mjs': `export default ${JSON.stringify(config)}`,
          'toolkit.json': JSON.stringify({ kind: 'frontend-project-template',
            initialization: { mode: 'in-place', projectRoot: '.' } }),
          'package.json': JSON.stringify({ private: true, scripts: {} }),
          'src/main.js': 'export const existingBusinessValue = 42\n',
        }
        for (const [file, content] of Object.entries(fixtureFiles)) {
          const target = resolve(fixtureRoot, file)
          mkdirSync(dirname(target), { recursive: true })
          writeFileSync(target, content)
        }
        const fixtureScript = resolve(fixtureRoot, resourceDirectory, 'scripts/check-ai-guidance.mjs')
        mkdirSync(dirname(fixtureScript), { recursive: true })
        mkdirSync(resolve(dirname(fixtureScript), 'lib'), { recursive: true })
        copyFileSync(resolve(toolkitScripts, 'check-ai-guidance.mjs'), fixtureScript)
        copyFileSync(resolve(toolkitScripts, 'lib/ai-guidance-validation.mjs'),
          resolve(dirname(fixtureScript), 'lib/ai-guidance-validation.mjs'))

        const result = spawnSync(process.execPath, [fixtureScript, '--format', 'json'], {
          cwd: tmpdir(), encoding: 'utf8',
        })
        assert.equal(result.status, 0, result.stdout + result.stderr)
        assert.equal(JSON.parse(result.stdout).checkedFiles, config.requiredFiles.length)
        for (const [file, content] of Object.entries(fixtureFiles)) {
          assert.equal(readFileSync(resolve(fixtureRoot, file), 'utf8'), content)
        }
      } finally {
        rmSync(fixtureRoot, { force: true, recursive: true })
      }
    })
  }

  it('校验额外项目 Skill，不能只检查主入口', () => {
    const extended = { ...config, additionalSkills: [{ ...config.projectSkill,
      name: 'frontend-task', path: '.agents/skills/frontend-task/SKILL.md',
      metadataPath: '.agents/skills/frontend-task/agents/openai.yaml' }] }
    const errors = collectGuidanceErrors({ config: extended, files: validFiles })
    assert.ok(errors.some(error => error.code === 'PE003' && error.file.includes('frontend-task')))
  })


  it('项目状态使用结构化 JSON，拒绝伪造完成或路径越界', () => {
    // capability-state.json 注册表机器已随死配置清理移除；manifest 只记 Starter 自身事实。
    const recordConfig = { requiredFiles: [], allowPlaceholders: true,
      projectRecords: { manifest: '.toolkit/manifest.json' } }
    const manifest = { schemaVersion: 1, kind: 'project-starter', starterStatus: 'ready' }
    const check = (current = manifest) =>
      collectGuidanceErrors({ config: recordConfig, files: { '.toolkit/manifest.json': JSON.stringify(current) } })
    assert.deepEqual(check(), [])
    for (const current of [null, [], { schemaVersion: 2 },
      { ...manifest, kind: 'project-installation' }, { ...manifest, starterStatus: 'shipping' }]) {
      assert.ok(check(current).some(error => error.code === 'PE015'))
    }
    assert.ok(collectGuidanceErrors({ config: recordConfig, files: { '.toolkit/manifest.json': '{invalid' } })
      .every(error => error.code === 'PE015'))
  })
})

describe('validateTaskRecords 任务状态执法（PE021）', () => {
  it('真实形态通过，越界词表与结构报错，模板豁免', () => {
    const root = mkdtempSync(join(tmpdir(), 'task-records-'))
    try {
      mkdirSync(join(root, 'docs/tasks/real/templates'), { recursive: true })
      mkdirSync(join(root, 'docs/tasks/bad'), { recursive: true })
      const real = {
        schemaVersion: 1, taskId: 't', taskType: 'incremental', taskStatus: 'done', currentStage: 'report',
        sourceStatus: { 'screenshot:x': 'analyzed' },
        plan: { revision: 1, fingerprint: 'f', confirmation: 'self-confirmed-with-record (D1 reversible)' },
        stages: { inspect: { status: 'done', lastRun: '2026-09-25', notes: 'ok' } },
        overrides: [{ id: 'O1', missingFact: 'm', impact: 'i', assumption: 'a', userDecision: 'u', followUp: 'f' }],
      }
      writeFileSync(join(root, 'docs/tasks/real/STATE.json'), JSON.stringify(real))
      const bad = {
        ...real, taskStatus: 'completed', taskType: 'refactor-x', currentStage: 'deploy',
        stages: { inspect: { status: 'done', todo: true } }, overrides: [{ missingFact: 'm' }],
      }
      writeFileSync(join(root, 'docs/tasks/bad/STATE.json'), JSON.stringify(bad))
      writeFileSync(join(root, 'docs/tasks/real/templates/STATE.json'), JSON.stringify({ taskStatus: 'whatever' }))
      const errors = validateTaskRecords(root)
      const of = (name) => errors.filter((e) => e.file === `docs/tasks/${name}/STATE.json`).map((e) => e.message)
      assert.deepEqual(of('real'), [])
      assert.deepEqual(errors.filter((e) => e.file.includes('/templates/')), [])
      const badMsgs = of('bad')
      for (const needle of ['taskStatus', 'taskType', 'currentStage', 'todo', 'overrides[0]']) {
        assert.ok(badMsgs.some((m) => m.includes(needle)), `应报 ${needle}：${JSON.stringify(badMsgs)}`)
      }
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})

describe('validateDeadReferences 死引用执法', () => {
  it('三类引用 + 分发视角：正反例、豁免与登记表', () => {
    const deadRoot = mkdtempSync(join(tmpdir(), 'dead-refs-'))
    try {
      for (const dir of ['.agents/skills/demo/scripts', '.agents/skills/product-design',
        '.claude/skills', 'docs/wayfinder', 'docs', '.toolkit/scripts']) {
        mkdirSync(join(deadRoot, dir), { recursive: true })
      }
      writeFileSync(join(deadRoot, '.agents/skills/demo/SKILL.md'),
        '---\nname: demo\ndescription: Use when demo.\n---\n调用 `$demo`。\n')
      writeFileSync(join(deadRoot, '.agents/skills/demo/scripts/run.cjs'), '')
      writeFileSync(join(deadRoot, '.agents/skills/product-design/SKILL.md'),
        '整包豁免：`.agents/不存在/x.md` 与 `$nope`。\n')
      writeFileSync(join(deadRoot, 'AGENTS.md'), [
        '好链 [画像](docs/PROJECT_PROFILE.md) 与 `$demo`。',
        '坏链 [丢失](docs/missing.md)。',
        '坏锚定 `.toolkit/missing.mjs`；坏技能 `$nope`；命名空间 `$demo:sub` 不扫。',
        '复合引用与运行态：`.toolkit/profile-state.json.deliveryTargets`、`.toolkit/profile-proposal.json` 不报。',
        '```text',
        '$fenced-nope 与 `.toolkit/fenced-missing.mjs`',
        '```',
      ].join('\n'))
      writeFileSync(join(deadRoot, 'README.md'),
        '分发自述（I4 豁免）：`toolkit.json` 与 `scripts/` 不报 PE019。\n')
      writeFileSync(join(deadRoot, 'docs/PROJECT_PROFILE.md'), '# 画像\n')
      writeFileSync(join(deadRoot, 'docs/consumer.md'),
        '随发文件引用开发件 `toolkit.json` 应报 PE019。非路径形态：`镜像目录不存在：.claude/skills` 与 `/g` 不报。\n')
      writeFileSync(join(deadRoot, '.agents/skills/demo/usage.md'),
        '包内脚本 `scripts/run.cjs` 豁免；`scripts/absent.cjs` 报 PE019。\n' +
        'Call the Skill tool with "ghost-dep" 应报依赖缺失；Call the Skill tool with demo 命中名册不报。\n')
      writeFileSync(join(deadRoot, '.toolkit/scripts/tool.mjs'),
        'export const good = \'docs/PROJECT_PROFILE.md\'\nexport const bad = \'./missing-lib.mjs\'\n')
      writeFileSync(join(deadRoot, '.claude/skills/mirror.md'), '`$mirror-nope` 与 `.toolkit/nope.mjs`\n')
      writeFileSync(join(deadRoot, 'docs/wayfinder/old.md'), '`$old-nope` [旧链](gone.md)\n')
      mkdirSync(join(deadRoot, '.agents/skills/demo/templates'), { recursive: true })
      mkdirSync(join(deadRoot, 'docs/rules'), { recursive: true })
      writeFileSync(join(deadRoot, 'docs/rules/AI_X.md'), '# 规则\n')
      writeFileSync(join(deadRoot, '.agents/skills/demo/templates/tpl.md'), '[规则](docs/rules/AI_X.md)\n')
      writeFileSync(join(deadRoot, '.toolkit/profile-state.json'), '{}\n')

      const errors = validateDeadReferences(deadRoot, {})
      const messages = (file) =>
        errors.filter((error) => error.file === file).map((error) => `${error.code} ${error.message}`)

      assert.ok(messages('AGENTS.md').some((m) => m.startsWith('PE017') && m.includes('missing.md')))
      assert.ok(messages('AGENTS.md').some((m) => m.startsWith('PE017') && m.includes('missing.mjs')))
      assert.equal(messages('AGENTS.md').filter((m) => m.startsWith('PE018')).length, 1)
      assert.ok(messages('AGENTS.md')[0] !== undefined && messages('AGENTS.md').some((m) => m.startsWith('PE018') && m.includes('$nope')))
      assert.ok(messages('docs/consumer.md').some((m) => m.startsWith('PE019')))
      assert.deepEqual(messages('README.md'), [])
      assert.ok(messages('.agents/skills/demo/usage.md').some((m) => m.startsWith('PE019') && m.includes('absent.cjs')))
      assert.ok(messages('.agents/skills/demo/usage.md').some((m) => m.startsWith('PE018') && m.includes('ghost-dep')))
      assert.ok(!messages('.agents/skills/demo/usage.md').some((m) => m.includes('with demo') && m.startsWith('PE018') && !m.includes('ghost')))
      const externalErrors = validateDeadReferences(deadRoot, { externalSkills: ['ghost-dep'] })
      assert.ok(!externalErrors.some((error) => error.file === '.agents/skills/demo/usage.md' && error.message.includes('ghost-dep')),
        'externalSkills 登记后依赖缺失应放行')
      assert.ok(!messages('.agents/skills/demo/usage.md').some((m) => m.includes('run.cjs')))
      assert.ok(messages('.toolkit/scripts/tool.mjs').some((m) => m.startsWith('PE017') && m.includes('missing-lib.mjs')))
      assert.ok(!messages('.toolkit/scripts/tool.mjs').some((m) => m.includes('PROJECT_PROFILE')))
      assert.ok(!errors.some((error) => error.file === '.claude/skills/mirror.md'))
      assert.ok(!errors.some((error) => error.file === 'docs/wayfinder/old.md'))
      assert.ok(!errors.some((error) => error.file === '.agents/skills/product-design/SKILL.md'))
      assert.ok(!errors.some((error) => error.file === '.agents/skills/demo/SKILL.md'))
      assert.ok(!messages('AGENTS.md').some((m) => m.includes('deliveryTargets') || m.includes('profile-proposal')))
      assert.ok(!messages('docs/consumer.md').some((m) => m.includes('claude/skills') || m.includes('/g')))
      assert.ok(!errors.some((error) => error.file === '.agents/skills/demo/templates/tpl.md'))
    } finally {
      rmSync(deadRoot, { recursive: true, force: true })
    }
  })
})
