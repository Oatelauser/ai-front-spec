// WP10 回归：测试回放不得把 WSL 启动器当 Git Bash 使用——
// argv 重引号损坏 -c 命令替换、临时目录清理 EBUSY/EPERM（对照证据在 WP10 归档）。
// 探针语义：失败/超时/被杀/非零退出一律拒绝候选；显式覆盖非法必须 fail-loud。
import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gitDerivedCandidates, isUsableBash, nativeBash, probeCommand } from './native-bash.mjs'

const here = dirname(fileURLToPath(import.meta.url))

test('宿主选择：Windows 必须解析到原生 Git Bash（uname MSYS/MINGW），Linux 保持普通 bash', () => {
  assert.ok(nativeBash, '应能解析出可用 bash 宿主')
  if (process.platform === 'win32') {
    const probe = spawnSync(nativeBash, ['-c', 'uname -s'], { encoding: 'utf8' })
    assert.match(probe.stdout, /^(MSYS|MINGW)/, 'Windows 上不得回退到 WSL 等非原生宿主：' + nativeBash)
  } else {
    assert.equal(nativeBash, 'bash')
  }
})

const importWithOverride = (value) => spawnSync(process.execPath, ['--input-type=module', '-e', "import('./native-bash.mjs')"], {
  cwd: here, encoding: 'utf8', env: { ...process.env, AI_TEST_BASH: value },
})

test('覆盖错误路径：AI_TEST_BASH 指向不存在的 bash 导入失败且点名原因（平台无关）', () => {
  const missing = join(tmpdir(), 'wp10-missing-' + process.pid + '-bash.exe')
  const child = importWithOverride(missing)
  assert.notEqual(child.status, 0, '缺失覆盖必须让模块导入失败（fail-loud）')
  assert.ok(child.stderr.includes('AI_TEST_BASH'), '错误信息须点名覆盖变量：' + child.stderr)
  assert.ok(child.stderr.includes('不存在'), '缺失路径应报不存在：' + child.stderr)
})

test('覆盖错误路径：AI_TEST_BASH 指向 WSL 启动器（win32）同样 fail-loud', () => {
  if (process.platform !== 'win32') return
  const child = importWithOverride('C:/windows/system32/bash.exe')
  assert.notEqual(child.status, 0, 'WSL 覆盖在 Windows 必须导入失败')
  assert.ok(child.stderr.includes('AI_TEST_BASH'), child.stderr)
})

test('探针失败语义（注入替身）：error/超时/被杀/非零退出码一律拒绝候选', () => {
  const cases = [
    { error: { code: 'ETIMEDOUT' }, status: null },
    { error: { code: 'ENOENT' }, status: null },
    { status: null, signal: 'SIGTERM' },
    { status: 1, stdout: 'MINGW64_NT-10.0-26200\n' },
  ]
  for (const result of cases) {
    assert.equal(isUsableBash('fake-bash', () => result), false, '该探针结果必须拒绝：' + JSON.stringify(result))
  }
})

test('探针身份判定（注入替身）：win32 仅 MSYS/MINGW 通过，Linux 任意可用 bash 通过', () => {
  const msys = { status: 0, stdout: 'MINGW64_NT-10.0-26200\n' }
  const linux = { status: 0, stdout: 'Linux\n' }
  if (process.platform === 'win32') {
    assert.equal(isUsableBash('fake-bash', () => msys), true)
    assert.equal(isUsableBash('fake-bash', () => linux), false, 'Windows 上 Linux 内核响应应被拒绝')
  } else {
    assert.equal(isUsableBash('fake-bash', () => linux), true)
  }
})

test('git 探测失败/超时即无候选（注入替身）；成功时反推两个候选路径', () => {
  assert.deepEqual(gitDerivedCandidates(() => ({ error: { code: 'ETIMEDOUT' }, status: null })), [])
  assert.deepEqual(gitDerivedCandidates(() => ({ status: 128, stdout: '' })), [])
  const derived = gitDerivedCandidates(() => ({ status: 0, stdout: 'D:/soft/Git/mingw64/libexec/git-core\n' }))
  assert.equal(derived.length, 2)
  assert.ok(derived[0].endsWith(join('bin', 'bash.exe')), '应反推 <安装根>/bin/bash.exe：' + derived[0])
  assert.ok(derived[1].endsWith(join('usr', 'bin', 'bash.exe')), '应反推 <安装根>/usr/bin/bash.exe：' + derived[1])
})

test('真实探针具备有界超时：长睡眠命令被终止而非挂起（30s sleep 须远早于自然退出被杀）', () => {
  assert.ok(nativeBash)
  const started = Date.now()
  const result = probeCommand(nativeBash, ['-c', 'sleep 30'])
  const elapsed = Date.now() - started
  assert.notEqual(result.status, 0, '超时被杀的命令不得以 0 退出（若本用例挂满 30s 即超时失效）')
  assert.ok(elapsed < 15000, '应在远小于 30s 内被终止，实际 ' + elapsed + 'ms')
})

test('引用行为：经认证宿主回放命令替换+内层双引号脚本，参数语义完整（原 WSL 损坏形态）', () => {
  assert.ok(nativeBash)
  const script = 'node() { printf 9.9.9; }\nVERSION=$(node -p "require(\'./toolkit.json\').version")\necho got=$VERSION\n'
  const run = spawnSync(nativeBash, ['-c', script], { encoding: 'utf8' })
  assert.equal(run.status, 0, run.stdout + run.stderr)
  assert.equal(run.stdout.trim(), 'got=9.9.9')
})

test('清理路径：以临时目录为 cwd 执行后立即删除成功（无句柄滞留）', () => {
  assert.ok(nativeBash)
  const dir = mkdtempSync(join(tmpdir(), 'native-bash-'))
  const run = spawnSync(nativeBash, ['-c', 'echo marker'], { encoding: 'utf8', cwd: dir })
  assert.equal(run.status, 0, run.stdout + run.stderr)
  assert.doesNotThrow(() => rmSync(dir, { recursive: true, force: true }))
})
