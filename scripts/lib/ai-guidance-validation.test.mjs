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
  validateDocumentedPackageScripts,
  validateLocalLinks,
} from './ai-guidance-validation.mjs'

const config = {
  allowPlaceholders: true,
  forbiddenPatterns: ['old-project-name'],
  placeholderPattern: '<待填写(?:[：；][^>]*)?>',
  requiredFiles: [
    'AGENTS.md',
    'docs/AI_TASK_CONTRACT.md',
    '.agents/skills/project-workflow/SKILL.md',
    '.agents/skills/project-workflow/agents/openai.yaml',
    '.agents/skills/project-workflow/references/task-routing.md',
    'docs/CODEX_CAPABILITIES.md',
  ],
  promptContracts: [
    {
      file: 'docs/AI_TASK_CONTRACT.md',
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
    path: 'docs/CODEX_CAPABILITIES.md',
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
  'docs/AI_TASK_CONTRACT.md': '目标：结果\n上下文：事实\n约束：边界\n完成条件：证据',
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
  'docs/CODEX_CAPABILITIES.md': 'plugin@example-marketplace\nowner/repository',
}

describe('AI guidance validation', () => {
  it('接受完整的通用提示词工程', () => {
    assert.deepEqual(collectGuidanceErrors({ config, files: validFiles }), [])
  })

  it('拒绝缺失文件、乱序 Prompt 合同和未路由的项目 Skill', () => {
    const files = {
      ...validFiles,
      'AGENTS.md': '没有入口',
      'docs/AI_TASK_CONTRACT.md': '上下文：事实\n目标：结果\n约束：边界',
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
      'docs/AI_TASK_CONTRACT.md':
        '目标：结果\n上下文：事实\n约束：边界\n完成条件：\n## 使用原则\n这是另一节',
    }
    const errors = collectGuidanceErrors({ config, files })
    assert.ok(errors.some((error) => error.code === 'PE002'))
  })

  it('拒绝能力安装清单缺少固定插件或 Skill 来源', () => {
    const files = {
      ...validFiles,
      'docs/CODEX_CAPABILITIES.md': 'plugin@example-marketplace',
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
    const script = resolve(templateRoot, 'scripts/check-ai-guidance.mjs')
    const fixtureRoot = mkdtempSync(join(tmpdir(), 'ai-guidance-cli-'))
    try {
      for (const [path, content] of Object.entries(validFiles)) {
        const target = resolve(fixtureRoot, path)
        mkdirSync(dirname(target), { recursive: true })
        writeFileSync(target, content, 'utf8')
      }
      writeFileSync(resolve(fixtureRoot, 'AGENTS.md'), validFiles['AGENTS.md'] + '<待填写：命令>')
      mkdirSync(resolve(fixtureRoot, '.codex'), { recursive: true })
      writeFileSync(resolve(fixtureRoot, '.codex/ai-guidance.config.mjs'),
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

  for (const resourceDirectory of ['resources', '.codex']) {
    it(`CLI 从 ${resourceDirectory} 定位同仓库项目，允许业务代码并保持文件不变`, () => {
      const scriptRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
      const fixtureRoot = mkdtempSync(join(tmpdir(), 'frontend-in-place-'))
      try {
        const fixtureFiles = {
          ...validFiles,
          '.codex/ai-guidance.config.mjs': `export default ${JSON.stringify(config)}`,
          'resources/toolkit.json': JSON.stringify({ kind: 'frontend-project-template',
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
        copyFileSync(resolve(scriptRoot, 'check-ai-guidance.mjs'), fixtureScript)
        copyFileSync(resolve(scriptRoot, 'lib/ai-guidance-validation.mjs'),
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

  it('真实模板在同仓库布局生成三种画像，搬移后两种资源模式均可校验', (t) => {
    const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
    const manifestPath = resolve(projectRoot, 'toolkit.json')
    if (!existsSync(manifestPath)) {
      t.skip('仅安装校验脚本的旧项目没有内置模板资源，跳过模板集成检查')
      return
    }
    const toolkit = JSON.parse(readFileSync(manifestPath, 'utf8'))
    if (!Array.isArray(toolkit.files)) {
      t.skip('Starter 由 resources 统一构建，使用 project-profile.test.mjs 验证其结构')
      return
    }
    const sourceFiles = new Set(['AGENTS.md', 'CODEX_TOOLKIT.md', 'resources/toolkit.json',
      ...Object.values(toolkit.profiles), ...toolkit.files.map(entry => entry.source)])
    const sourceContents = new Map([...sourceFiles].map(file =>
      [file, readFileSync(resolve(projectRoot, file), 'utf8')]))

    for (const [profile, profileSource] of Object.entries(toolkit.profiles)) {
      for (const localResources of [true, false]) {
        const temporaryRoot = mkdtempSync(join(tmpdir(), 'frontend-template-'))
        try {
          const fixtureRoot = join(temporaryRoot, 'project')
          const write = (file, content) => {
            const target = resolve(fixtureRoot, file)
            mkdirSync(dirname(target), { recursive: true })
            writeFileSync(target, content)
          }
          for (const [file, content] of sourceContents) write(file, content)
          const businessFile = 'src/existing.js'
          const businessContent = 'export const preserved = true\n'
          write(businessFile, businessContent)
          write('package.json', JSON.stringify({ private: true, scripts: {} }))

          const installedFiles = ['docs/PROJECT_PROFILE.md']
          let reusedFiles = 0
          for (const entry of toolkit.files) {
            if (entry.group === 'local' && !localResources) continue
            installedFiles.push(entry.target)
            if (resolve(fixtureRoot, entry.source) === resolve(fixtureRoot, entry.target)) {
              reusedFiles += 1
              continue
            }
            const content = readFileSync(resolve(fixtureRoot, entry.source), 'utf8')
            write(entry.target, entry.target === 'AGENTS.md'
              ? `${sourceContents.get('AGENTS.md')}\n${content}` : content)
          }
          write('docs/PROJECT_PROFILE.md', sourceContents.get(profileSource))
          const manifest = JSON.parse(readFileSync(resolve(fixtureRoot, '.codex/manifest.json'), 'utf8'))
          manifest.localResources = localResources
          manifest.installedFiles = installedFiles
          write('.codex/manifest.json', JSON.stringify(manifest))
          assert.equal(manifest.toolkit.source, '.')
          assert.ok(reusedFiles > 0)

          const movedRoot = join(temporaryRoot, 'moved-project')
          renameSync(fixtureRoot, movedRoot)
          const script = resolve(movedRoot, localResources ? '.codex/scripts/check-ai-guidance.mjs'
            : 'scripts/check-ai-guidance.mjs')
          const check = (args = []) => spawnSync(process.execPath, [script, ...args, '--format', 'json'], {
            cwd: temporaryRoot, encoding: 'utf8',
          })
          const normal = check()
          assert.equal(normal.status, 0, `${profile}/${localResources}: ${normal.stdout}${normal.stderr}`)
          const strict = check(['--strict'])
          assert.equal(strict.status, 1, strict.stdout + strict.stderr)
          assert.ok(JSON.parse(strict.stdout).errors.some(error => error.code === 'PE012'))
          assert.equal(readFileSync(resolve(movedRoot, businessFile), 'utf8'), businessContent)
          assert.ok(readFileSync(resolve(movedRoot, 'AGENTS.md'), 'utf8')
            .includes(sourceContents.get('AGENTS.md')))
          for (const [file, content] of sourceContents) {
            if (file === 'AGENTS.md') continue
            assert.equal(readFileSync(resolve(movedRoot, file), 'utf8'), content, file)
          }
        } finally {
          rmSync(temporaryRoot, { force: true, recursive: true })
        }
      }
    }
    for (const [file, content] of sourceContents) {
      assert.equal(readFileSync(resolve(projectRoot, file), 'utf8'), content)
    }
  })

  it('项目状态使用结构化 JSON，拒绝伪造完成或路径越界', () => {
    const recordConfig = { requiredFiles: [], allowPlaceholders: true,
      projectRecords: { manifest: '.codex/manifest.json', capabilities: 'docs/capability-state.json' } }
    const manifest = { schemaVersion: 1, kind: 'project-installation', status: 'draft',
      toolkit: { name: 'fixture', version: '1', source: 'fixture-source' },
      installedFiles: ['AGENTS.md'], updates: 'review-required', localResources: true,
      deferredFields: [], initializedAt: null, lastValidation: { status: 'not-run' } }
    const capabilities = { schemaVersion: 1, mode: 'on-demand', capabilities: [] }
    const check = (current = manifest, capabilityRecord = capabilities, overrides = {}) =>
      collectGuidanceErrors({ config: { ...recordConfig, ...overrides }, files: {
        '.codex/manifest.json': JSON.stringify(current),
        'docs/capability-state.json': JSON.stringify(capabilityRecord),
      } })
    assert.deepEqual(check(), [])
    for (const current of [null, [], { schemaVersion: 2 },
      { ...manifest, status: 'initialized' }, { ...manifest, kind: 'uninitialized-toolkit' },
      { ...manifest, toolkit: { name: 'fixture' } },
      { ...manifest, installedFiles: ['../outside'] }, { ...manifest, installedFiles: ['a', 'a'] },
      { ...manifest, deferredFields: [{ field: 'runtime', reason: 'unknown', impact: 'high' }] },
      { ...manifest, lastValidation: { status: 'success' } }]) {
      assert.ok(check(current).some(error => error.code === 'PE015'))
    }
    const deferred = { ...manifest, deferredFields: [{ field: 'owner', reason: 'unknown', impact: 'low' }] }
    assert.deepEqual(check(deferred), [])
    assert.ok(check(deferred, capabilities, { allowPlaceholders: false, placeholderPattern: '<TODO>' })
      .some(error => error.code === 'PE015'))
    assert.deepEqual(check({ ...manifest, status: 'initialized', initializedAt: '2026-09-06T00:00:00Z',
      lastValidation: { status: 'passed', command: 'fixture-check', at: '2026-09-06T00:00:00Z' } }), [])
    assert.ok(check(manifest, { ...capabilities, mode: 'unknown' }).some(error => error.code === 'PE015'))
    const skill = { id: 'fixture-skill', type: 'skill', exactReference: 'fixture-skill',
      installed: 'yes', enabled: 'not-applicable', connected: 'not-applicable', discoverable: 'yes',
      taskUsable: 'yes', installability: 'not-applicable', evidence: ['fixture-evidence'], blockers: [] }
    assert.deepEqual(check(manifest, { ...capabilities, capabilities: [skill] }), [])
    for (const entries of [[{ ...skill, evidence: [] }], [{ ...skill, discoverable: 'new-session-required' }],
      [{ ...skill, enabled: true }], [skill, skill], [null]]) {
      assert.ok(check(manifest, { ...capabilities, capabilities: entries })
        .some(error => error.code === 'PE015'))
    }
    assert.ok(collectGuidanceErrors({ config: recordConfig, files: {
      '.codex/manifest.json': '{invalid', 'docs/capability-state.json': '{}',
    } }).every(error => error.code === 'PE015'))
  })
})
