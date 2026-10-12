import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import filesystem from 'node:fs'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { syncBuiltinESMExports } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { validateTaskRecords } from '../../.toolkit/scripts/lib/ai-guidance-validation.mjs'

const sha256 = (content) => createHash('sha256').update(content).digest('hex')
const acceptanceDiagnostics = (errors) => errors.filter((error) => error.code === 'PE021' && (/acceptance/i.test(error.message) || error.message.includes('证据')))

const buildFixture = () => {
  const parent = mkdtempSync(join(tmpdir(), 'task-evidence-'))
  const root = join(parent, 'root')
  const outside = join(parent, 'outside')
  const taskDirectory = join(root, 'docs', 'tasks', 't')
  mkdirSync(taskDirectory, { recursive: true })
  mkdirSync(outside, { recursive: true })
  const writeState = (state) => writeFileSync(join(taskDirectory, 'STATE.json'), JSON.stringify(state))
  const writeEvidence = (content) => {
    writeFileSync(join(taskDirectory, 'evidence.log'), content)
    return sha256(content)
  }
  const baseState = (extra) => ({
    schemaVersion: 2,
    taskId: 't',
    taskType: 'bug-fix',
    taskStatus: 'done',
    currentStage: 'report',
    sourceStatus: {},
    plan: { revision: 1, fingerprint: null, confirmation: 'not-required' },
    stages: { report: { status: 'done', lastRun: '2026-10-02T00:00:00.000Z', notes: '' } },
    overrides: [],
    ...extra,
  })
  return { parent, root, outside, taskDirectory, writeState, writeEvidence, baseState }
}
const withCleanup = (context, fixture) => {
  context.after(() => rmSync(fixture.parent, { recursive: true, force: true }))
  return fixture
}

test('历史 schema1/2 无验收块与全 unverified 的 done 均不产生验收诊断', (context) => {
  const fixture = withCleanup(context, buildFixture())
  fixture.writeState(fixture.baseState({ schemaVersion: 1 }))
  assert.deepEqual(acceptanceDiagnostics(validateTaskRecords(fixture.root)), [])
  fixture.writeState(fixture.baseState())
  assert.deepEqual(validateTaskRecords(fixture.root), [])
  fixture.writeState(fixture.baseState({ acceptance: { engineering: 'unverified' } }))
  assert.deepEqual(validateTaskRecords(fixture.root), [])
})

test('显式 passed 无 acceptanceEvidence 必须产生验收诊断', (context) => {
  const fixture = withCleanup(context, buildFixture())
  fixture.writeState(fixture.baseState({ acceptance: { engineering: 'passed' } }))
  assert.ok(acceptanceDiagnostics(validateTaskRecords(fixture.root)).length >= 1, '显式 passed 缺证据须拒绝')
})

test('当前字节 SHA-256 一致的仓内相对路径证据通过', (context) => {
  const fixture = withCleanup(context, buildFixture())
  const digest = fixture.writeEvidence('node --test scripts/lib/task-evidence.test.mjs\nexit 0\n')
  fixture.writeState(fixture.baseState({
    acceptance: { engineering: 'passed' },
    acceptanceEvidence: { engineering: [{ path: 'docs/tasks/t/evidence.log', sha256: digest }] },
  }))
  assert.deepEqual(validateTaskRecords(fixture.root), [])
})

test('等长改写、缺文件、空文件与错哈希各自独立拒绝', (context) => {
  const fixture = withCleanup(context, buildFixture())
  const digest = fixture.writeEvidence('aaaa\nbbbb\n')
  writeFileSync(join(fixture.taskDirectory, 'evidence.log'), 'cccc\ndddd\n')
  fixture.writeState(fixture.baseState({
    acceptance: { engineering: 'passed' },
    acceptanceEvidence: { engineering: [{ path: 'docs/tasks/t/evidence.log', sha256: digest }] },
  }))
  assert.ok(acceptanceDiagnostics(validateTaskRecords(fixture.root)).length >= 1, '同长度内容变更后旧哈希须失效')
  fixture.writeState(fixture.baseState({
    acceptance: { engineering: 'passed' },
    acceptanceEvidence: { engineering: [{ path: 'docs/tasks/t/absent.log', sha256: digest }] },
  }))
  assert.ok(acceptanceDiagnostics(validateTaskRecords(fixture.root)).length >= 1, '缺文件须拒绝')
  const emptyDigest = fixture.writeEvidence('')
  fixture.writeState(fixture.baseState({
    acceptance: { engineering: 'passed' },
    acceptanceEvidence: { engineering: [{ path: 'docs/tasks/t/evidence.log', sha256: emptyDigest }] },
  }))
  assert.ok(acceptanceDiagnostics(validateTaskRecords(fixture.root)).length >= 1, '空文件不是留存证据')
  fixture.writeEvidence('real bytes')
  fixture.writeState(fixture.baseState({
    acceptance: { engineering: 'passed' },
    acceptanceEvidence: { engineering: [{ path: 'docs/tasks/t/evidence.log', sha256: 'f'.repeat(64) }] },
  }))
  assert.ok(acceptanceDiagnostics(validateTaskRecords(fixture.root)).length >= 1, '哈希不匹配须拒绝')
})

test('malformed 验收输入与未知状态/维度拒绝，STATE 根为 null/数组产生 PE021 且不崩', (context) => {
  const fixture = withCleanup(context, buildFixture())
  const digest = fixture.writeEvidence('payload')
  const malformed = [
    { acceptance: 'passed' },
    { acceptance: ['passed'] },
    { acceptance: null },
    { acceptance: { engineering: 'shipit' } },
    { acceptance: { engineering: 'passed', perf: 'passed' } },
    { acceptance: { engineering: 'passed' }, acceptanceEvidence: 'docs/tasks/t/evidence.log' },
    { acceptance: { engineering: 'passed' }, acceptanceEvidence: null },
    { acceptance: { engineering: 'passed' }, acceptanceEvidence: [] },
    { acceptance: { engineering: 'passed' }, acceptanceEvidence: { engineering: 'docs/tasks/t/evidence.log' } },
    { acceptance: { engineering: 'passed' }, acceptanceEvidence: { engineering: [{ path: 'docs/tasks/t/evidence.log' }] } },
    { acceptance: { engineering: 'passed' }, acceptanceEvidence: { engineering: [{ sha256: digest }] } },
    { acceptance: { engineering: 'passed' }, acceptanceEvidence: { engineering: [{ path: 123, sha256: digest }] } },
    { acceptance: { engineering: 'passed' }, acceptanceEvidence: { engineering: [], perf: [{ path: 'docs/tasks/t/evidence.log', sha256: digest }] } },
  ]
  for (const extra of malformed) {
    fixture.writeState(fixture.baseState(extra))
    assert.ok(acceptanceDiagnostics(validateTaskRecords(fixture.root)).length >= 1, 'malformed 输入须拒绝：' + JSON.stringify(extra))
  }
  writeFileSync(join(fixture.taskDirectory, 'STATE.json'), 'null')
  assert.ok(validateTaskRecords(fixture.root).some((error) => error.code === 'PE021'), 'STATE 根为 null 须 PE021')
  writeFileSync(join(fixture.taskDirectory, 'STATE.json'), '[]')
  assert.ok(validateTaskRecords(fixture.root).some((error) => error.code === 'PE021'), 'STATE 根为数组须 PE021')
})

test('绝对路径、父级穿越、反斜杠与冒号路径各自拒绝', (context) => {
  const fixture = withCleanup(context, buildFixture())
  const digest = fixture.writeEvidence('payload')
  for (const path of ['/etc/passwd', 'C:/temp/evidence.log', '../outside/evidence.log', String.raw`docs\tsk\tt\tevidence.log`, 'docs/tasks/t/e:v.log']) {
    fixture.writeState(fixture.baseState({
      acceptance: { engineering: 'passed' },
      acceptanceEvidence: { engineering: [{ path, sha256: digest }] },
    }))
    assert.ok(acceptanceDiagnostics(validateTaskRecords(fixture.root)).length >= 1, '路径须拒绝：' + path)
  }
})

test('junction 祖先与叶目录、根内链接均拒绝，普通等价路径通过', (context) => {
  const fixture = withCleanup(context, buildFixture())
  mkdirSync(join(fixture.outside, 'sub'), { recursive: true })
  writeFileSync(join(fixture.outside, 'evidence.log'), 'outside bytes')
  writeFileSync(join(fixture.outside, 'sub', 'evidence.log'), 'outside bytes')
  const outsideDigest = sha256('outside bytes')
  const linkTargets = [
    { link: 'leaf-link', target: fixture.outside, ref: 'docs/tasks/t/leaf-link/evidence.log' },
    { link: 'parent-link', target: fixture.outside, ref: 'docs/tasks/t/parent-link/sub/evidence.log' },
  ]
  for (const { link, target, ref } of linkTargets) {
    try {
      symlinkSync(target, join(fixture.taskDirectory, link), 'junction')
    } catch (error) {
      if (['EPERM', 'EACCES', 'ENOTSUP', 'EINVAL'].includes(error.code)) {
        context.skip('junction 创建被权限拒绝，实际执行 code=' + error.code)
        return
      }
      throw error
    }
  }
  try {
    symlinkSync(join(fixture.taskDirectory, 'plain'), join(fixture.taskDirectory, 'inside-link'), 'junction')
  } catch (error) {
    if (['EPERM', 'EACCES', 'ENOTSUP', 'EINVAL'].includes(error.code)) {
      context.skip('junction 创建被权限拒绝，实际执行 code=' + error.code)
      return
    }
    throw error
  }
  for (const ref of ['docs/tasks/t/leaf-link/evidence.log', 'docs/tasks/t/parent-link/sub/evidence.log', 'docs/tasks/t/inside-link/evidence.log']) {
    fixture.writeState(fixture.baseState({
      acceptance: { engineering: 'passed' },
      acceptanceEvidence: { engineering: [{ path: ref, sha256: outsideDigest }] },
    }))
    assert.ok(acceptanceDiagnostics(validateTaskRecords(fixture.root)).length >= 1, '经链接的证据须拒绝：' + ref)
  }
  mkdirSync(join(fixture.taskDirectory, 'plain'), { recursive: true })
  writeFileSync(join(fixture.taskDirectory, 'plain', 'evidence.log'), 'outside bytes')
  fixture.writeState(fixture.baseState({
    acceptance: { engineering: 'passed' },
    acceptanceEvidence: { engineering: [{ path: 'docs/tasks/t/plain/evidence.log', sha256: outsideDigest }] },
  }))
  assert.deepEqual(validateTaskRecords(fixture.root), [])
})

test('realpath 解析越出信任根须拒绝，真实别名拼写不误伤（助手级 mock 标注）', (context) => {
  const fixture = withCleanup(context, buildFixture())
  const digest = fixture.writeEvidence('canonical payload')
  const passedState = () => fixture.writeState(fixture.baseState({
    acceptance: { engineering: 'passed' },
    acceptanceEvidence: { engineering: [{ path: 'docs/tasks/t/evidence.log', sha256: digest }] },
  }))
  if (process.platform === 'win32') {
    const aliasRoot = join(fixture.parent, 'ROOT')
    passedState()
    const errorsFromAlias = validateTaskRecords(aliasRoot)
    assert.deepEqual(errorsFromAlias.filter((error) => error.file === 'docs/tasks/t/STATE.json'), [], '真实大小写别名拼写不应误伤：' + JSON.stringify(errorsFromAlias))
  }
  const candidate = resolve(fixture.root, 'docs', 'tasks', 't', 'evidence.log')
  const outsideFile = resolve(fixture.outside, 'evidence.log')
  writeFileSync(outsideFile, 'canonical payload')
  const originalRealpath = filesystem.realpathSync
  filesystem.realpathSync = (probed) => (resolve(String(probed)) === candidate ? outsideFile : originalRealpath(probed))
  syncBuiltinESMExports()
  try {
    passedState()
    const errors = validateTaskRecords(fixture.root)
    assert.ok(acceptanceDiagnostics(errors).length >= 1, 'realpath 解析越出信任根须产生 PE021（helper 级 fs mock，非真实文件系统）')
  } finally {
    filesystem.realpathSync = originalRealpath
    syncBuiltinESMExports()
  }
})

test('证据文件读取 EACCES 须 PE021 且不抛原始异常', (context) => {
  const fixture = withCleanup(context, buildFixture())
  const digest = fixture.writeEvidence('protected payload')
  const candidate = resolve(fixture.root, 'docs', 'tasks', 't', 'evidence.log')
  const resolvedCandidate = filesystem.realpathSync(candidate)
  const originalRead = filesystem.readFileSync
  filesystem.readFileSync = (probed, ...rest) => {
    if (resolve(String(probed)) === resolvedCandidate) {
      const failure = new Error('fixture EACCES')
      failure.code = 'EACCES'
      throw failure
    }
    return originalRead(probed, ...rest)
  }
  syncBuiltinESMExports()
  try {
    fixture.writeState(fixture.baseState({
      acceptance: { engineering: 'passed' },
      acceptanceEvidence: { engineering: [{ path: 'docs/tasks/t/evidence.log', sha256: digest }] },
    }))
    const errors = validateTaskRecords(fixture.root)
    assert.ok(acceptanceDiagnostics(errors).length >= 1, '读取失败须产生 PE021：' + JSON.stringify(errors))
  } finally {
    filesystem.readFileSync = originalRead
    syncBuiltinESMExports()
  }
})
