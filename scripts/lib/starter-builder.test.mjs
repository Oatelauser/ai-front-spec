import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const builder = join(root, 'scripts/build-starter.mjs')
const build = (target) => spawnSync('node', [builder, '--target', target], { encoding: 'utf8' })

test('干净副本：distExcludes 不落地，skills 全数随发，副本内三连校验通过', async () => {
  const target = await mkdtemp(join(tmpdir(), 'starter-clean-'))
  try {
    const run = build(target)
    assert.equal(run.status, 0, run.stdout + run.stderr)
    for (const excluded of ['scripts', 'toolkit.json', 'docs/wayfinder', 'CONTRIBUTING.md', '.serena', '.github', '.gitignore', '.gitattributes']) {
      assert.equal(existsSync(join(target, excluded)), false, `${excluded} 不应随发`)
    }
    const manifest = JSON.parse(await readFile(join(target, '.toolkit/manifest.json'), 'utf8'))
    assert.equal(manifest.starterStatus, 'ready')
    const toolkit = JSON.parse(await readFile(join(root, 'toolkit.json'), 'utf8'))
    assert.equal(manifest.starterVersion, toolkit.version, '干净副本应写入 starterVersion')
    for (const skill of toolkit.skills) {
      assert.equal(existsSync(join(target, '.agents/skills', skill, 'SKILL.md')), true, `${skill} 缺 SKILL.md`)
    }
    assert.ok((await readFile(join(target, 'AGENTS.md'), 'utf8')).includes('$project-workflow'))
    assert.ok(existsSync(join(target, 'LICENSE')), 'LICENSE 应随发')
    assert.ok(existsSync(join(target, 'NOTICE')), 'NOTICE 应随发')
  } finally {
    await rm(target, { recursive: true, force: true })
  }
})

test('覆盖安装：skipIfExists 命中即跳过，普通文件照常写入', async () => {
  const target = await mkdtemp(join(tmpdir(), 'starter-overlay-'))
  try {
    await writeFile(join(target, 'AGENTS.md'), 'USER-EDITED')
    await mkdir(join(target, 'docs/rules'), { recursive: true })
    await writeFile(join(target, 'docs/rules/FRONTEND_CONVENTIONS.md'), 'MY-CONVENTIONS')
    await mkdir(join(target, '.toolkit'), { recursive: true })
    await writeFile(join(target, '.toolkit/manifest.json'), JSON.stringify({ starterStatus: 'ready', profileStatus: 'user-state', starterVersion: '0.0.0' }))
    const run = build(target)
    assert.equal(run.status, 0, run.stdout + run.stderr)
    assert.equal(await readFile(join(target, 'AGENTS.md'), 'utf8'), 'USER-EDITED', 'skipIfExists 文件不得覆盖用户内容')
    assert.equal(await readFile(join(target, 'docs/rules/FRONTEND_CONVENTIONS.md'), 'utf8'), 'MY-CONVENTIONS', '用户前端约定不得被升级覆盖')
    const installed = JSON.parse(await readFile(join(target, '.toolkit/manifest.json'), 'utf8'))
    assert.equal(installed.profileStatus, 'user-state', 'overlay 不得重置用户 manifest 状态')
    const current = JSON.parse(await readFile(join(root, 'toolkit.json'), 'utf8'))
    assert.equal(installed.starterVersion, current.version, 'overlay 应把 starterVersion 升到当前版本')
    assert.ok(run.stdout.includes('0.0.0 →'), '升级打印应包含旧→新版本：\n' + run.stdout)
    assert.ok(existsSync(join(target, 'LICENSE')), '非 skipIfExists 文件应写入')
    assert.ok(run.stdout.includes('跳过'), '跳过清单应打印：\n' + run.stdout)
  } finally {
    await rm(target, { recursive: true, force: true })
  }
})
