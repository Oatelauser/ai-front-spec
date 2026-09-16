import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const script = resolve(root, 'scripts/build-starter.mjs')

test('starter builder validates the source and copies only starter contents', async () => {
  const temporaryRoot = await mkdtemp(resolve(tmpdir(), 'codex-starter-'))
  try {
    const result = spawnSync(process.execPath, [script, '--target', temporaryRoot], { encoding: 'utf8' })
    assert.equal(result.status, 0, result.stdout + result.stderr)
    assert.match(await readFile(resolve(temporaryRoot, 'AGENTS.md'), 'utf8'), /项目智能代理指引/)
    assert.equal(await readFile(resolve(temporaryRoot, '.codex/manifest.json'), 'utf8').then(JSON.parse).then(value => value.starterStatus), 'ready')
    assert.equal(existsSync(resolve(temporaryRoot, 'scripts')), false)

    const expectedSkills = ['project-workflow', 'project-profile', 'frontend-task', 'codex-capability-setup']
    for (const name of expectedSkills) {
      const skill = await readFile(resolve(temporaryRoot, `.agents/skills/${name}/SKILL.md`), 'utf8')
      assert.match(skill, new RegExp(`name: ${name}`))
      const metadata = await readFile(resolve(temporaryRoot, `.agents/skills/${name}/agents/openai.yaml`), 'utf8')
      assert.match(metadata, /display_name:/)
      assert.match(metadata, /default_prompt:/)
    }
    const guidance = spawnSync(process.execPath, [resolve(temporaryRoot, '.codex/scripts/check-ai-guidance.mjs'), '--root', temporaryRoot], { encoding: 'utf8' })
    assert.equal(guidance.status, 0, guidance.stdout + guidance.stderr)
    assert.match(guidance.stdout, /AI guidance validated across/)
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true })
  }
})
