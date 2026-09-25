#!/usr/bin/env node
// 打包器/安装器（票 10）：空目标 = 干净副本 + 三连校验；现有项目 = 覆盖安装三类契约。
// 干净副本：复制 distExcludes 以外的全部文件 → ①结构完整性 ②check-ai-guidance --strict ③sync-mirror --check。
// 覆盖安装：①普通文件覆盖 ②skipIfExists 命中且已存在 → 跳过并打印 ③distExcludes 不落地；结尾打印清单。
import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(await readFile(join(repositoryRoot, 'toolkit.json'), 'utf8'))
const distExcludes = manifest.distExcludes ?? []
const skipIfExists = new Set(manifest.skipIfExists ?? [])

let targetDir = null
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === '--target') targetDir = process.argv[++i]
  else if (process.argv[i].startsWith('--target=')) targetDir = process.argv[i].slice('--target='.length)
}
const checkOnly = process.argv.includes('--check')

async function collectFiles(dir, base = dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) await collectFiles(full, base, out)
    else out.push(relative(base, full).split('\\').join('/'))
  }
  return out
}

const isExcluded = (rel) => distExcludes.some((ex) => rel === ex || rel.startsWith(ex + '/'))

// 结构完整性：manifest.skills 逐个有 SKILL.md、runtime 逐项存在、磁盘无未登记技能。
function integrityErrors(root) {
  const errors = []
  const skillsDir = join(root, '.agents', 'skills')
  for (const skill of manifest.skills) {
    if (!existsSync(join(skillsDir, skill, 'SKILL.md'))) errors.push(`技能缺 SKILL.md：${skill}`)
  }
  for (const entry of manifest.starter.runtime) {
    if (!existsSync(join(root, entry))) errors.push(`starter.runtime 项缺失：${entry}`)
  }
  if (existsSync(skillsDir)) {
    for (const name of readdirSync(skillsDir)) {
      if (!statSync(join(skillsDir, name)).isDirectory()) continue
      if (!existsSync(join(skillsDir, name, 'SKILL.md'))) continue
      if (!manifest.skills.includes(name)) errors.push(`manifest 未登记的技能：${name}`)
    }
  }
  return errors
}

function fail(label, errors) {
  console.error(`build-starter: ${label}`)
  errors.forEach((line) => console.error(`- ${line}`))
  process.exit(1)
}

if (checkOnly) {
  const errors = integrityErrors(repositoryRoot)
  if (errors.length) fail('--check 结构完整性失败', errors)
  console.log(`build-starter --check: 结构完整（${manifest.skills.length} 技能）`)
  process.exit(0)
}

if (!targetDir) {
  console.error('用法：node scripts/build-starter.mjs --target <目录> | --check')
  process.exit(2)
}

await mkdir(targetDir, { recursive: true })
const overlay = (await readdir(targetDir)).length > 0
const copied = []
const skipped = []

for (const rel of await collectFiles(repositoryRoot)) {
  if (isExcluded(rel)) continue
  const dest = join(targetDir, rel)
  if (overlay && skipIfExists.has(rel) && existsSync(dest)) {
    skipped.push(rel)
    continue
  }
  await mkdir(dirname(dest), { recursive: true })
  await copyFile(join(repositoryRoot, rel), dest)
  copied.push(rel)
}

// 安装事实：写入 starterVersion（升级可检测）；overlay 下读取既有 manifest，只补版本不碰用户状态字段。
{
  const manifestPath = join(targetDir, '.toolkit', 'manifest.json')
  let installed = {}
  try { installed = JSON.parse(await readFile(manifestPath, 'utf8')) } catch {}
  const previous = installed.starterVersion ?? null
  installed.starterVersion = manifest.version
  await mkdir(dirname(manifestPath), { recursive: true })
  await writeFile(manifestPath, JSON.stringify(installed, null, 2) + '\n', 'utf8')
  if (overlay) console.log(previous && previous !== manifest.version ? `  Starter 升级：${previous} → ${manifest.version}` : `  Starter 版本：${manifest.version}`)
}

if (overlay) {
  // 源仓工作区状态检查：未提交改动会被当作 stock 拷入目标，先警告让用户甄别。
  const dirty = run('git', ['-C', repositoryRoot, 'status', '--porcelain'])
  if (dirty.status === 0 && dirty.stdout.trim()) {
    console.log(`  ⚠ 源仓工作区有未提交改动（${dirty.stdout.trim().split('\n').length} 项），将按工作区现状安装；要按已发布版本安装请先提交或暂存`)
  }
  console.log(`覆盖安装完成：写入 ${copied.length} 文件，跳过 ${skipped.length} 文件（skipIfExists 命中且已存在）`)
  // 跳过文件区分「已定制」与「未定制」：未定制的与新版 stock 一致，可放心手工采用新版。
  for (const rel of skipped) {
    const [stockText, userText] = await Promise.all([
      readFile(join(repositoryRoot, rel), 'utf8').catch(() => null),
      readFile(join(targetDir, rel), 'utf8').catch(() => null),
    ])
    if (stockText === null || userText === null) { console.log(`  跳过：${rel}`); continue }
    const norm = (t) => t.replace(/\r\n/g, '\n').split('\n')
    const [a, b] = [norm(stockText), norm(userText)]
    const diff = a.filter((line) => !b.includes(line)).length + b.filter((line) => !a.includes(line)).length
    console.log(diff === 0 ? `  跳过：${rel}（与新版一致，未定制）` : `  跳过：${rel}（与新版有 ${diff} 行差异：可能是你的定制或旧版落后；从未定制过可对照新版采纳）`)
  }
  // 退役技能检测：目标里存在而新版名册没有的技能目录（如 playwright → playwright-cli 改名后的旧目录），提示手工清理。
  const skillsDir = join(targetDir, '.agents', 'skills')
  if (existsSync(skillsDir)) {
    const retired = readdirSync(skillsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && existsSync(join(skillsDir, e.name, 'SKILL.md')) && !manifest.skills.includes(e.name))
      .map((e) => e.name)
    if (retired.length) {
      console.log(`  ⚠ 检测到未登记技能目录（可能是升级退役物）：${retired.join(', ')}`)
      console.log('    建议确认后手工删除 .agents/skills/<名> 与 .claude/skills/<名>，再运行 node .toolkit/scripts/sync-mirror.mjs 重建镜像')
    }
  }
  // vitest 全目录扫描提示：技能模板测试不是项目测试（README 预警过仍两度被踩，安装时主动提示）。
  const pkgPath = join(targetDir, 'package.json')
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(await readFile(pkgPath, 'utf8').catch(() => ({})))
    const hasVitest = [pkg.dependencies, pkg.devDependencies].some((d) => d && 'vitest' in d)
    if (hasVitest) {
      const cfgFiles = ['vite.config.js', 'vite.config.mjs', 'vite.config.ts', 'vitest.config.js', 'vitest.config.mjs', 'vitest.config.ts']
      const cfgText = (await Promise.all(cfgFiles.map((c) => readFile(join(targetDir, c), 'utf8').catch(() => '')))).join('\n')
      if (!(cfgText.includes('.agents') && cfgText.includes('.claude'))) {
        console.log('  ⚠ 检测到 vitest 但配置未排除 .agents/.claude：技能模板测试会被项目测试扫描，请在 vite/vitest 的 test.exclude 加入这两个目录')
      }
    }
  }
  console.log(`  未落地（distExcludes）：${distExcludes.join(', ')}`)
  process.exit(0)
}

// 干净副本：三连校验（票 10）。
const errors = integrityErrors(targetDir)
if (errors.length) fail('三连校验①结构完整性失败', errors)

const run = (label, args) => {
  const result = spawnSync('node', args, { stdio: 'inherit' })
  if (result.status !== 0) {
    console.error(`build-starter: 三连校验${label}失败`)
    process.exit(1)
  }
}
run('②check-ai-guidance --strict', [join(targetDir, '.toolkit', 'scripts', 'check-ai-guidance.mjs'), '--root', targetDir, '--strict'])
run('③sync-mirror --check', [join(targetDir, '.toolkit', 'scripts', 'sync-mirror.mjs'), '--check'])

console.log(`干净副本完成：${copied.length} 文件 → ${targetDir}（三连校验通过）`)
