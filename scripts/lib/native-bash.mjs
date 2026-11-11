// 测试专用 Bash 宿主选择（WP10）：Windows 上按名调用 bash 可能解析到 WSL 启动器，
// 其 argv 重引号会损坏 -c 脚本的内层双引号与命令替换；且以 Windows 目录为 cwd 的
// WSL 进程退出后可观测到临时目录清理 EBUSY/EPERM（句柄异步释放为推断机制，对照
// 证据见 docs/wayfinder/assets/work-package-10-test-host-repair.md）。因此 Windows
// 只接受 uname 认证的原生 Git Bash（MSYS/MINGW）；Linux/CI 保持普通 bash。
// 所有外部探测均带 timeout/maxBuffer 上界：卡死的启动器/发行版不得挂起导入方。
// 产品脚本不经由此模块。
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'

const PROBE_TIMEOUT_MS = 4000
const PROBE_MAX_BUFFER = 64 * 1024

// 统一有界探测入口（测试注入替身验证失败/超时语义）
export const probeCommand = (file, args) =>
  spawnSync(file, args, { encoding: 'utf8', timeout: PROBE_TIMEOUT_MS, maxBuffer: PROBE_MAX_BUFFER })

const probeFailed = (result) => Boolean(result.error) || result.status !== 0

export const isUsableBash = (candidate, probe = probeCommand) => {
  const result = probe(candidate, ['--noprofile', '--norc', '-c', 'uname -s'])
  if (probeFailed(result)) return false
  return process.platform === 'win32' ? /^(MSYS|MINGW)/.test(String(result.stdout).trim()) : true
}

// PATH 上 git --exec-path 形如 <安装根>/mingw64/libexec/git-core，用于发现非默认安装位的 Git Bash
export const gitDerivedCandidates = (probe = probeCommand) => {
  const execPath = probe('git', ['--exec-path'])
  if (probeFailed(execPath)) return []
  const value = String(execPath.stdout || '').trim()
  if (!value) return []
  const installRoot = dirname(dirname(dirname(value)))
  return [join(installRoot, 'bin', 'bash.exe'), join(installRoot, 'usr', 'bin', 'bash.exe')]
}

const resolveNativeBash = () => {
  const override = process.env.AI_TEST_BASH
  if (override) {
    if (!existsSync(override)) throw new Error('AI_TEST_BASH 指向的 bash 不存在：' + override)
    if (!isUsableBash(override)) throw new Error('AI_TEST_BASH 未通过宿主认证（Windows 须为 MSYS/MINGW 原生 Git Bash）：' + override)
    return override
  }
  const candidates = ['bash']
  if (process.platform === 'win32') {
    candidates.push(...gitDerivedCandidates())
    for (const root of [process.env.ProgramFiles, process.env['ProgramFiles(x86)']]) {
      if (root) candidates.push(join(root, 'Git', 'bin', 'bash.exe'), join(root, 'Git', 'usr', 'bin', 'bash.exe'))
    }
  }
  return candidates.find((candidate) => isUsableBash(candidate)) ?? null
}

export const nativeBash = resolveNativeBash()
