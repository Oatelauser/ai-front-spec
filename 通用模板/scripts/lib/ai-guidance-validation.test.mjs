import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
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
    'docs/AI_TASK_PROMPT.md',
    '.agents/skills/project-workflow/SKILL.md',
    '.agents/skills/project-workflow/agents/openai.yaml',
    '.agents/skills/project-workflow/references/task-routing.md',
    'docs/AI_CAPABILITY_REQUIREMENTS.md',
  ],
  promptContracts: [
    {
      file: 'docs/AI_TASK_PROMPT.md',
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
    path: 'docs/AI_CAPABILITY_REQUIREMENTS.md',
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
  'docs/AI_TASK_PROMPT.md': '目标：结果\n上下文：事实\n约束：边界\n完成条件：证据',
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
  'docs/AI_CAPABILITY_REQUIREMENTS.md': 'plugin@example-marketplace\nowner/repository',
}

describe('AI guidance validation', () => {
  it('接受完整的通用提示词工程', () => {
    assert.deepEqual(collectGuidanceErrors({ config, files: validFiles }), [])
  })

  it('拒绝缺失文件、乱序 Prompt 合同和未路由的项目 Skill', () => {
    const files = {
      ...validFiles,
      'AGENTS.md': '没有入口',
      'docs/AI_TASK_PROMPT.md': '上下文：事实\n目标：结果\n约束：边界',
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
      'docs/AI_TASK_PROMPT.md':
        '目标：结果\n上下文：事实\n约束：边界\n完成条件：\n## 使用原则\n这是另一节',
    }
    const errors = collectGuidanceErrors({ config, files })
    assert.ok(errors.some((error) => error.code === 'PE002'))
  })

  it('拒绝能力安装清单缺少固定插件或 Skill 来源', () => {
    const files = {
      ...validFiles,
      'docs/AI_CAPABILITY_REQUIREMENTS.md': 'plugin@example-marketplace',
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
    const normal = spawnSync(process.execPath, [script, '--format', 'json'], {
      cwd: templateRoot,
      encoding: 'utf8',
    })
    assert.equal(normal.status, 0)
    assert.equal(JSON.parse(normal.stdout).ok, true)

    const strict = spawnSync(process.execPath, [script, '--strict', '--format', 'json'], {
      cwd: templateRoot,
      encoding: 'utf8',
    })
    const result = JSON.parse(strict.stdout)
    assert.equal(strict.status, 1)
    assert.equal(result.ok, false)
    assert.ok(result.errors.some((error) => error.code === 'PE010'))
    assert.ok(result.errors.some((error) => error.code === 'PE012'))
  })
})
