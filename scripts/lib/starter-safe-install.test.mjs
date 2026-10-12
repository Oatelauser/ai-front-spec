import test from 'node:test'
import assert from 'node:assert/strict'
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve, sep } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const repository = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const write = (path, content) => {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
}
const snapshot = (root) => {
  if (!existsSync(root)) return null
  const result = {}
  const walk = (directory, prefix = '') => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const relative = prefix + entry.name
      if (entry.isDirectory()) walk(join(directory, entry.name), relative + '/')
      else result[relative] = readFileSync(join(directory, entry.name)).toString('base64')
    }
  }
  walk(root)
  return result
}
const fixture = (context) => {
  const root = mkdtempSync(join(tmpdir(), 'starter-safe-'))
  context.after(() => rmSync(root, { recursive: true, force: true }))
  const temp = join(root, 'temp')
  mkdirSync(temp)
  const source = join(root, 'source')
  const target = join(root, 'target')
  mkdirSync(join(source, 'scripts'), { recursive: true })
  copyFileSync(join(repository, 'scripts/build-starter.mjs'), join(source, 'scripts/build-starter.mjs'))
  write(join(source, 'toolkit.json'), JSON.stringify({
    version: '1.0.0', skills: [], starter: { runtime: ['AGENTS.md', 'docs', '.toolkit', '.mcp.json', 'tools'] },
    distExcludes: [], skipIfExists: ['AGENTS.md', '.toolkit/manifest.json', '.toolkit/profile-state.json'],
  }))
  write(join(source, 'AGENTS.md'), 'stock entry')
  write(join(source, 'docs/a.md'), 'old a')
  write(join(source, 'docs/b.md'), 'old b')
  write(join(source, '.toolkit/manifest.json'), JSON.stringify({ schemaVersion: 1, starterStatus: 'ready' }))
  write(join(source, '.toolkit/profile-state.json'), '{"status":"draft"}')
  write(join(source, '.toolkit/scripts/check-ai-guidance.mjs'), 'process.exit(0)')
  write(join(source, '.toolkit/scripts/sync-mirror.mjs'), 'process.exit(0)')
  write(join(source, 'tools/bin.js'), 'local')
  write(join(source, '.mcp.json'), JSON.stringify({ mcpServers: { local: { command: 'node', args: ['tools/bin.js'] } } }))
  const env = { ...process.env, TMP: temp, TEMP: temp, TMPDIR: temp }
  const run = (...args) => spawnSync(process.execPath, [join(source, 'scripts/build-starter.mjs'), '--target', target, ...args], { encoding: 'utf8', env })
  const spawn = (argv) => spawnSync(process.execPath, argv, { encoding: 'utf8', env })
  const install = () => {
    const result = run()
    assert.equal(result.status, 0, result.stdout + result.stderr)
  }
  return { root, temp, source, target, run, spawn, install }
}

test('dry-run 不创建目标，未知参数失败且不写入', (context) => {
  const { target, run } = fixture(context)
  assert.equal(run('--dry-run').status, 0)
  assert.equal(existsSync(target), false)
  assert.notEqual(run('--typo').status, 0)
  assert.equal(existsSync(target), false)
})

test('完整安装登记基线，重装保留未知字段与用户状态', (context) => {
  const { target, run, install } = fixture(context)
  install()
  const manifestPath = join(target, '.toolkit/manifest.json')
  const installed = JSON.parse(readFileSync(manifestPath, 'utf8'))
  assert.equal(installed.installation.schemaVersion, 1)
  assert.match(installed.installation.files['docs/a.md'], /^[a-f0-9]{64}$/)
  installed.customState = { keep: true }
  write(manifestPath, JSON.stringify(installed))
  write(join(target, 'AGENTS.md'), 'user entry')
  write(join(target, '.toolkit/profile-state.json'), '{"status":"initialized"}')
  assert.equal(run().status, 0)
  assert.deepEqual(JSON.parse(readFileSync(manifestPath)).customState, { keep: true })
  assert.equal(readFileSync(join(target, 'AGENTS.md'), 'utf8'), 'user entry')
  assert.equal(readFileSync(join(target, '.toolkit/profile-state.json'), 'utf8'), '{"status":"initialized"}')
})

test('三方基线：更新未定制文件，保留单方定制，双方变化零写入', (context) => {
  const { source, target, run, install } = fixture(context)
  install()
  write(join(source, 'docs/a.md'), 'new a')
  assert.equal(run().status, 0)
  assert.equal(readFileSync(join(target, 'docs/a.md'), 'utf8'), 'new a')
  write(join(target, 'docs/a.md'), 'custom a')
  assert.equal(run().status, 0)
  assert.equal(readFileSync(join(target, 'docs/a.md'), 'utf8'), 'custom a')
  write(join(source, 'docs/a.md'), 'newer a')
  write(join(source, 'docs/b.md'), 'new b')
  const before = snapshot(target)
  assert.notEqual(run().status, 0)
  assert.deepEqual(snapshot(target), before)
})

test('旧安装无基线的差异不覆盖，坏 manifest 不重置', (context) => {
  const { target, run } = fixture(context)
  write(join(target, 'docs/a.md'), 'legacy custom')
  const before = snapshot(target)
  assert.notEqual(run('--accept-mcp').status, 0)
  assert.deepEqual(snapshot(target), before)
  write(join(target, '.toolkit/manifest.json'), '{broken')
  const invalid = snapshot(target)
  assert.notEqual(run('--accept-mcp').status, 0)
  assert.deepEqual(snapshot(target), invalid)
})

test('MCP 保留用户 key 和顶层字段，新 key 必须显式采纳', (context) => {
  const { target, run } = fixture(context)
  write(join(target, '.mcp.json'), JSON.stringify({ owner: 'user', mcpServers: { own: { command: 'user-command' } } }))
  const before = snapshot(target)
  assert.notEqual(run().status, 0)
  assert.deepEqual(snapshot(target), before)
  assert.equal(run('--accept-mcp').status, 0)
  const merged = JSON.parse(readFileSync(join(target, '.mcp.json')))
  assert.equal(merged.owner, 'user')
  assert.equal(merged.mcpServers.own.command, 'user-command')
  assert.equal(merged.mcpServers.local.command, 'node')
})

test('MCP 同名不同和坏 JSON 非零，accept-mcp 不能强制覆盖', (context) => {
  const { target, run } = fixture(context)
  write(join(target, '.mcp.json'), '{"mcpServers":{"local":{"command":"user-command"}}}')
  const before = snapshot(target)
  assert.notEqual(run('--accept-mcp').status, 0)
  assert.deepEqual(snapshot(target), before)
  write(join(target, '.mcp.json'), '{broken')
  const invalid = snapshot(target)
  assert.notEqual(run('--accept-mcp').status, 0)
  assert.deepEqual(snapshot(target), invalid)
})

test('拒绝目标与源根的三种重叠，源内容不变', (context) => {
  const { source, root, spawn } = fixture(context)
  for (const target of [source, join(source, 'nested'), root]) {
    const before = snapshot(source)
    const result = spawn([join(source, 'scripts/build-starter.mjs'), '--target', target])
    assert.notEqual(result.status, 0)
    assert.deepEqual(snapshot(source), before)
  }
  assert.equal(existsSync(join(source, 'nested')), false)
})

test('目标目录 junction 拒绝，根外 sentinel 不变', (context) => {
  const { root, target, run } = fixture(context)
  const outside = join(root, 'outside')
  write(join(outside, 'sentinel'), 'keep')
  mkdirSync(target)
  try {
    symlinkSync(outside, join(target, 'docs'), 'junction')
  } catch (error) {
    if (['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) { context.skip(error.code); return }
    throw error
  }
  assert.notEqual(run('--accept-mcp').status, 0)
  assert.deepEqual(snapshot(outside), { sentinel: Buffer.from('keep').toString('base64') })
})

test('校验失败不留下目标或安装事实', (context) => {
  const { source, target, run } = fixture(context)
  write(join(source, '.toolkit/scripts/check-ai-guidance.mjs'), 'process.exit(1)')
  assert.notEqual(run().status, 0)
  assert.equal(existsSync(target), false)
})

test('复制中故障恢复旧树、版本和未知字段，不依赖 Git', (context) => {
  const { root, temp, source, target, install, spawn } = fixture(context)
  install()
  write(join(source, 'docs/a.md'), 'new a')
  write(join(source, 'docs/b.md'), 'new b')
  const before = snapshot(target)
  const injector = join(root, 'inject.mjs')
  write(injector, `import filesystem from 'node:fs';\nimport { syncBuiltinESMExports } from 'node:module';\nconst original = filesystem.promises.writeFile;\nlet triggered = false;\nfilesystem.promises.writeFile = async (path, ...args) => {\n  if (!triggered && String(path).endsWith('b.md')) {\n    triggered = true;\n    throw new Error('fixture copy failure');\n  }\n  return original(path, ...args);\n};\nsyncBuiltinESMExports();\n`)
  const result = spawn(['--import', pathToFileURL(injector).href, join(source, 'scripts/build-starter.mjs'), '--target', target])
  assert.notEqual(result.status, 0, '故障注入必须实际触发')
  assert.match(result.stderr, /fixture copy failure/)
  assert.deepEqual(snapshot(target), before)
  assert.deepEqual(readdirSync(temp), [])
})

test('坏基线、缺失受管文件和未知 schema 均零写入失败', (context) => {
  const { target, run, install } = fixture(context)
  install()
  const manifestPath = join(target, '.toolkit/manifest.json')
  const original = readFileSync(manifestPath, 'utf8')
  for (const invalid of [
    { schemaVersion: 2, files: {} },
    { schemaVersion: 1, starterVersion: '1.0.0', files: { '../escape': 'a'.repeat(64) } },
    { schemaVersion: 1, starterVersion: '1.0.0', files: { 'docs/a.md': 'wrong' } },
    { schemaVersion: 1, starterVersion: '0.0.0', files: {} },
  ]) {
    write(manifestPath, JSON.stringify({ ...JSON.parse(original), installation: invalid }))
    const before = snapshot(target)
    assert.notEqual(run().status, 0)
    assert.deepEqual(snapshot(target), before)
  }
  write(manifestPath, original)
  rmSync(join(target, 'docs/a.md'))
  const before = snapshot(target)
  assert.notEqual(run().status, 0)
  assert.deepEqual(snapshot(target), before)
})

test('自定义技能源、镜像与无关文件原样保留', (context) => {
  const { target, run, install } = fixture(context)
  install()
  write(join(target, '.agents/skills/custom/SKILL.md'), 'custom source')
  write(join(target, '.claude/skills/custom/SKILL.md'), 'custom mirror')
  write(join(target, 'application.txt'), 'business')
  const before = snapshot(target)
  assert.equal(run().status, 0)
  assert.deepEqual(snapshot(target), before)
})

test('预检后目标变化被拒绝，不覆盖协作者内容', (context) => {
  const { root, source, target, install, spawn } = fixture(context)
  install()
  write(join(source, 'docs/a.md'), 'new a')
  const injector = join(root, 'changed.mjs')
  write(injector, `import filesystem from 'node:fs';\nimport { syncBuiltinESMExports } from 'node:module';\nconst original = filesystem.promises.mkdtemp;\nfilesystem.promises.mkdtemp = async (...args) => {\n  const result = await original(...args);\n  if (String(args[0]).includes('starter-transaction-')) filesystem.writeFileSync(${JSON.stringify(join(target, 'docs/a.md'))}, 'collaborator');\n  return result;\n};\nsyncBuiltinESMExports();\n`)
  const manifestBefore = readFileSync(join(target, '.toolkit/manifest.json'), 'utf8')
  const result = spawn(['--import', pathToFileURL(injector).href, join(source, 'scripts/build-starter.mjs'), '--target', target])
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /预检后目标已变化/)
  assert.equal(readFileSync(join(target, 'docs/a.md'), 'utf8'), 'collaborator')
  assert.equal(readFileSync(join(target, '.toolkit/manifest.json'), 'utf8'), manifestBefore)
})

test('重装保留 installation 内未知字段，自有字段仍更新', (context) => {
  const { source, target, run, install } = fixture(context)
  install()
  const manifestPath = join(target, '.toolkit/manifest.json')
  const installed = JSON.parse(readFileSync(manifestPath, 'utf8'))
  installed.installation.customNote = { keep: true }
  write(manifestPath, JSON.stringify(installed))
  write(join(source, 'docs/a.md'), 'new a')
  write(join(source, 'toolkit.json'), JSON.stringify({
    version: '1.1.0', skills: [], starter: { runtime: ['AGENTS.md', 'docs', '.toolkit', '.mcp.json', 'tools'] },
    distExcludes: [], skipIfExists: ['AGENTS.md', '.toolkit/manifest.json', '.toolkit/profile-state.json'],
  }))
  assert.equal(run().status, 0)
  const next = JSON.parse(readFileSync(manifestPath, 'utf8'))
  assert.deepEqual(next.installation.customNote, { keep: true })
  assert.equal(next.installation.starterVersion, '1.1.0')
  assert.match(next.installation.files['docs/a.md'], /^[a-f0-9]{64}$/)
})

test('manifest 写入中途故障回滚旧字节与旧版本', (context) => {
  const { root, temp, source, target, install, spawn } = fixture(context)
  install()
  write(join(source, 'docs/a.md'), 'new a')
  write(join(source, 'toolkit.json'), JSON.stringify({
    version: '1.1.0', skills: [], starter: { runtime: ['AGENTS.md', 'docs', '.toolkit', '.mcp.json', 'tools'] },
    distExcludes: [], skipIfExists: ['AGENTS.md', '.toolkit/manifest.json', '.toolkit/profile-state.json'],
  }))
  const manifestPath = join(target, '.toolkit/manifest.json')
  const oldManifest = readFileSync(manifestPath, 'utf8')
  const injector = join(root, 'inject-manifest.mjs')
  write(injector, `import filesystem from 'node:fs';\nimport { syncBuiltinESMExports } from 'node:module';\nconst targetManifest = ${JSON.stringify(manifestPath)};\nconst original = filesystem.promises.writeFile;\nlet triggered = false;\nfilesystem.promises.writeFile = async (path, ...args) => {\n  if (!triggered && String(path) === targetManifest) {\n    triggered = true;\n    await original(path, Buffer.from('partial-manifest'));\n    throw new Error('fixture manifest failure');\n  }\n  return original(path, ...args);\n};\nsyncBuiltinESMExports();\n`)
  const result = spawn(['--import', pathToFileURL(injector).href, join(source, 'scripts/build-starter.mjs'), '--target', target])
  assert.notEqual(result.status, 0, '故障注入必须实际触发')
  assert.match(result.stderr, /fixture manifest failure/)
  assert.equal(readFileSync(join(target, 'docs/a.md'), 'utf8'), 'old a')
  assert.equal(readFileSync(manifestPath, 'utf8'), oldManifest)
  assert.equal(JSON.parse(readFileSync(manifestPath, 'utf8')).installation.starterVersion, '1.0.0')
  assert.deepEqual(readdirSync(temp), [])
})

test('恢复失败保留事务备份与恢复材料，编号旧字节与旧 manifest 完好', (context) => {
  const { root, temp, source, target, install, spawn } = fixture(context)
  install()
  write(join(source, 'docs/a.md'), 'new a')
  write(join(source, 'docs/b.md'), 'new b')
  const manifestPath = join(target, '.toolkit/manifest.json')
  const oldManifest = readFileSync(manifestPath, 'utf8')
  const injector = join(root, 'rollback-fail.mjs')
  write(injector, `import filesystem from 'node:fs';\nimport { syncBuiltinESMExports } from 'node:module';\nconst restoreA = ${JSON.stringify(join(target, 'docs/a.md'))};\nconst planB = ${JSON.stringify(join(target, 'docs/b.md'))};\nconst original = filesystem.promises.writeFile;\nfilesystem.promises.writeFile = async (path, data, ...args) => {\n  if (String(path) === planB) throw new Error('fixture copy failure');\n  if (String(path) === restoreA && String(data) === 'old a') throw new Error('fixture restore failure');\n  return original(path, data, ...args);\n};\nsyncBuiltinESMExports();\n`)
  const result = spawn(['--import', pathToFileURL(injector).href, join(source, 'scripts/build-starter.mjs'), '--target', target])
  assert.notEqual(result.status, 0, '故障注入必须实际触发')
  assert.match(result.stderr, /fixture copy failure/)
  assert.match(result.stderr, /恢复不完整：docs\/a\.md/)
  const retained = resolve(result.stderr.match(/恢复材料保留于：(.+)/)[1].trim())
  assert.equal(retained.startsWith(resolve(temp) + sep), true, `备份必须留在隔离临时目录：${retained}`)
  assert.equal(existsSync(retained), true)
  const recovery = JSON.parse(readFileSync(join(retained, 'recovery.json'), 'utf8'))
  assert.equal(recovery.target, target)
  const entryA = recovery.files.find((entry) => entry.path === 'docs/a.md')
  assert.match(entryA.backup, /^\d+$/)
  assert.equal(readFileSync(join(retained, entryA.backup), 'utf8'), 'old a')
  assert.equal(readFileSync(manifestPath, 'utf8'), oldManifest)
  assert.equal(JSON.parse(oldManifest).installation.starterVersion, '1.0.0')
})

test('独占创建撞上协作者文件：非零退出、回滚早前写入并清除事务备份', (context) => {
  const { root, temp, source, target, install, spawn } = fixture(context)
  install()
  write(join(source, 'docs/a.md'), 'new a')
  write(join(source, 'docs/c.md'), 'new c')
  const manifestPath = join(target, '.toolkit/manifest.json')
  const manifestBefore = readFileSync(manifestPath, 'utf8')
  const injector = join(root, 'race.mjs')
  write(injector, `import filesystem from 'node:fs';\nimport { syncBuiltinESMExports } from 'node:module';\nconst planned = ${JSON.stringify(join(target, 'docs/c.md'))};\nconst original = filesystem.promises.open;\nfilesystem.promises.open = async (path, flags = 'r', ...rest) => {\n  if (String(path) === planned && String(flags).includes('wx')) {\n    filesystem.writeFileSync(planned, 'collaborator');\n    console.log('fixture exclusive-create race: docs/c.md');\n  }\n  return original(path, flags, ...rest);\n};\nsyncBuiltinESMExports();\n`)
  const result = spawn(['--import', pathToFileURL(injector).href, join(source, 'scripts/build-starter.mjs'), '--target', target])
  assert.notEqual(result.status, 0, '故障注入必须实际触发')
  assert.match(result.stdout, /fixture exclusive-create race: docs\/c\.md/)
  assert.match(result.stderr, /EEXIST/)
  assert.match(result.stderr, /docs.c\.md/)
  assert.equal(readFileSync(join(target, 'docs/c.md'), 'utf8'), 'collaborator')
  assert.equal(readFileSync(join(target, 'docs/a.md'), 'utf8'), 'old a')
  assert.equal(readFileSync(manifestPath, 'utf8'), manifestBefore)
  assert.deepEqual(readdirSync(temp), [])
})

test('目标根与祖先 junction 拒绝安装，根外 sentinel 与安装事实不变', (context) => {
  const { root, source, spawn } = fixture(context)
  const outside = join(root, 'outside')
  write(join(outside, 'sentinel'), 'keep')
  const outsideFacts = { sentinel: Buffer.from('keep').toString('base64') }
  const link = (path) => {
    try {
      symlinkSync(outside, path, 'junction')
      return true
    } catch (error) {
      if (['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) { context.skip(error.code); return false }
      throw error
    }
  }
  if (link(join(root, 'link-root'))) {
    assert.notEqual(spawn([join(source, 'scripts/build-starter.mjs'), '--target', join(root, 'link-root'), '--accept-mcp']).status, 0)
    assert.deepEqual(snapshot(outside), outsideFacts)
  }
  if (link(join(root, 'hop'))) {
    assert.notEqual(spawn([join(source, 'scripts/build-starter.mjs'), '--target', join(root, 'hop', 'target'), '--accept-mcp']).status, 0)
    assert.deepEqual(snapshot(outside), outsideFacts)
 }
})

test('首装分发种子不继承源仓 maturity：空目标重置为未评估种子，其余字段保留', (context) => {
  const { source, target, run } = fixture(context)
  const sourceState = JSON.stringify({
    status: 'draft',
    template: 'generic',
    deliveryTargets: { browserWeb: 'user-confirmed', custom: { unknown: [1, 2] } },
    maturity: { status: 'existing', confidence: 'high', assessedAt: '2026-09-29', evidence: ['本仓为规则工具包 starter 本体'] },
    customField: { kept: true },
  })
  write(join(source, '.toolkit/profile-state.json'), sourceState)
  const sourceBefore = readFileSync(join(source, '.toolkit/profile-state.json'))
  const result = run()
  assert.equal(result.status, 0, '首装应成功：' + result.stdout + result.stderr)
  assert.equal(readFileSync(join(source, '.toolkit/profile-state.json')).equals(sourceBefore), true, '源仓 profile-state 字节不得被安装过程修改')
  const installed = JSON.parse(readFileSync(join(target, '.toolkit/profile-state.json'), 'utf8'))
  assert.deepEqual(installed.maturity, { status: 'unformed', confidence: 'low', evidence: [], assessedAt: null }, '新消费者 maturity 必须是未评估种子，不得继承源仓既有事实')
  const expected = { ...JSON.parse(sourceState), maturity: { status: 'unformed', confidence: 'low', evidence: [], assessedAt: null } }
  assert.deepEqual(installed, expected, '整个安装对象须等于源对象仅替换 maturity')
})

test('已有用户 profile-state 逐字保留（含自定 maturity 与未知字段），不受源仓种子影响', (context) => {
  const { source, target, run } = fixture(context)
  const userState = JSON.stringify({ status: 'initialized', maturity: { status: 'existing', confidence: 'medium', assessedAt: '2025-01-01', evidence: ['用户自证'] }, unknownFuture: [1, 2] })
  mkdirSync(join(target, '.toolkit'), { recursive: true })
  writeFileSync(join(target, '.toolkit/profile-state.json'), userState)
  write(join(source, '.toolkit/profile-state.json'), JSON.stringify({
    status: 'draft',
    maturity: { status: 'existing', confidence: 'high', assessedAt: '2026-09-29', evidence: ['源'] },
  }))
  const result = run('--accept-mcp')
  assert.equal(result.status, 0, '升级应成功：' + result.stdout + result.stderr)
  assert.equal(readFileSync(join(target, '.toolkit/profile-state.json'), 'utf8'), userState, '用户已有 state 必须逐字保留')
})

test('非空目标缺 profile-state 时仍按首装重置；dry-run 零写入', (context) => {
  const { source, target, run } = fixture(context)
  write(join(source, '.toolkit/profile-state.json'), JSON.stringify({
    status: 'draft', maturity: { status: 'existing', confidence: 'high', assessedAt: '2026-09-29', evidence: ['源'] },
  }))
  write(join(target, 'README.md'), 'user file')
  const before = snapshot(target)
  const dry = run('--dry-run', '--accept-mcp')
  assert.equal(dry.status, 0, 'dry-run 应成功')
  assert.deepEqual(snapshot(target), before, 'dry-run 零写入：目标全树字节级不变（含 manifest 与任何文件）')
  const result = run('--accept-mcp')
  assert.equal(result.status, 0)
  const installed = JSON.parse(readFileSync(join(target, '.toolkit/profile-state.json'), 'utf8'))
  assert.deepEqual(installed.maturity, { status: 'unformed', confidence: 'low', evidence: [], assessedAt: null }, '非空目标缺该文件仍按首装重置')
})

test('坏源 profile-state JSON：新目标零写入非零退出；已有用户 state 不受影响', (context) => {
  const { source, target, run } = fixture(context)
  write(join(source, '.toolkit/profile-state.json'), '{"broken":')
  const result = run()
  assert.notEqual(result.status, 0, '坏源 JSON 必须非零退出')
  assert.equal(existsSync(target), false, '失败时整个目标目录不得被创建')
  mkdirSync(join(target, '.toolkit'), { recursive: true })
  const userState = '{"status":"initialized","kept":true}'
  writeFileSync(join(target, '.toolkit/profile-state.json'), userState)
  const rerun = run('--accept-mcp')
  assert.equal(rerun.status, 0, '已有用户 state 时坏源不阻止升级（skipIfExists 先行）')
  assert.equal(readFileSync(join(target, '.toolkit/profile-state.json'), 'utf8'), userState)
})
