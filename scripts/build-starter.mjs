import { cp, mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = resolve(repositoryRoot, 'toolkit.json')
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
const sourceRoot = resolve(repositoryRoot, manifest.starter.sourceRoot)

const args = new Set(process.argv.slice(2))
const targetArgument = process.argv.slice(2).find((value, index, values) => value === '--target' && values[index + 1])
const targetRoot = targetArgument ? resolve(process.cwd(), process.argv[process.argv.indexOf('--target') + 1]) : null

const expectedSkills = new Set(['project-workflow', 'project-profile', 'frontend-task', 'codex-capability-setup'])
const requiredPaths = [
  'AGENTS.md',
  'docs/PROJECT_PROFILE.md',
  '.codex/manifest.json',
  '.codex/profile-state.json',
  '.codex/ai-guidance.config.mjs',
  '.agents/skills/project-workflow/SKILL.md',
  '.agents/skills/project-profile/SKILL.md',
  '.agents/skills/frontend-task/SKILL.md',
  '.agents/skills/codex-capability-setup/SKILL.md',
]

const errors = []
if (manifest.kind !== 'frontend-project-starter' || manifest.starter.sourceRoot !== 'resources') {
  errors.push('resources/toolkit.json must point to resources as the only distributable source')
}
for (const relativePath of requiredPaths) {
  if (!existsSync(resolve(sourceRoot, relativePath))) errors.push(`Starter is missing ${relativePath}`)
}
const skillRoot = resolve(sourceRoot, '.agents/skills')
if (existsSync(skillRoot)) {
  const entries = await (await import('node:fs/promises')).readdir(skillRoot, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory() && !expectedSkills.has(entry.name)) {
      errors.push(`Starter contains unexpected project Skill: ${entry.name}`)
    }
  }
}
if (existsSync(resolve(sourceRoot, '.agents/skills/bootstrap-project'))) {
  errors.push('Starter must not contain bootstrap-project')
}

if (errors.length) {
  console.error(errors.map(error => `- ${error}`).join('\n'))
  process.exitCode = 1
} else if (args.has('--check') || !targetRoot) {
  console.log(`Starter validated: ${sourceRoot}`)
} else {
  await stat(sourceRoot)
  await cp(sourceRoot, targetRoot, { recursive: true, errorOnExist: false, force: false })
  console.log(`Starter copied from ${sourceRoot} to ${targetRoot}`)
}
