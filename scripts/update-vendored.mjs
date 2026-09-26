#!/usr/bin/env node
// vendored 技能升级器（零修改原则配套）：
//   无参          check —— git repo 条目比对上游 HEAD 与登记 SHA，报告可升级/未基线/无法探测
//   --diff <技能>  双报告 —— 上游变更摘要（新增/删除/改动文件）× 本仓引用影响（谁在用）
//   --rebaseline <技能|all> 对账：与上游逐字节比对（文本按 LF 归一），一致才写入 SHA 基线
//   --upgrade <技能> 确认后执行：上游覆盖拷贝（不删本地附加文件）→ 更新登记 → 镜像 → 校验
//   --pack <目录>  离线包生成（CI 用稳定网络）：只打包落后/未建基线技能的上游最新全量目录 + manifest.json
//   --offline <包> 与 --diff/--rebaseline/--upgrade 组合：上游内容来自离线包（目录或 zip/tar.gz），零克隆
// 无 repo 的条目（插件快照/本地包）只打印来源，不做网络探测。SHA 是唯一版本真相。
import { copyFile, cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const toolkitPath = join(root, 'toolkit.json')
const toolkit = JSON.parse(await readFile(toolkitPath, 'utf8'))
const vendored = toolkit.vendored ?? {}

const args = process.argv.slice(2)
let mode = 'check'
let target = null
let bundlePath = null
for (let i = 0; i < args.length; i++) {
  const arg = args[i]
  if (arg === '--offline') { bundlePath = args[++i]; continue }
  if (arg.startsWith('--')) { mode = arg.slice(2); continue }
  target = arg
}

const run = (cmd, cmdArgs, opts = {}) => spawnSync(cmd, cmdArgs, { encoding: 'utf8', ...opts })
// Windows 上 npm 是 npm.cmd，无 shell 直接 spawn 会失败（git 是真 exe 不受影响）
const npmRun = (npmArgs, opts = {}) => spawnSync('npm', npmArgs, { encoding: 'utf8', shell: process.platform === 'win32', ...opts })

const listFiles = async (dir, base = dir, out = []) => {
  if (!existsSync(dir)) return out
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) await listFiles(full, base, out)
    else out.push({ rel: relative(base, full).split('\\').join('/'), full })
  }
  return out
}

const isText = (rel) => /\.(md|ya?ml|json|txt|mjs|cjs|html|css|svg)$/i.test(rel) || rel === 'LICENSE' || rel.startsWith('LICENSE') || rel.startsWith('NOTICE')

async function sameFile(a, b) {
  const [bufA, bufB] = [readFileSync(a), readFileSync(b)]
  if (isText(a) || isText(b)) {
    return bufA.toString('utf8').replace(/\r\n/g, '\n') === bufB.toString('utf8').replace(/\r\n/g, '\n')
  }
  return bufA.equals(bufB)
}

// 浅克隆上游并定位技能目录：优先登记 path；否则按 SKILL.md frontmatter name 或目录名 == 技能名发现。
async function fetchUpstream(skill, entry) {
  const tmp = await mkdtemp(join(tmpdir(), `upd-${skill}-`))
  const clone = run('git', ['clone', '--quiet', '--depth', '1', entry.repo, tmp])
  if (clone.status !== 0) {
    await rm(tmp, { recursive: true, force: true })
    return { error: `无法克隆上游 ${entry.repo}（网络/代理？）` }
  }
  const sha = run('git', ['-C', tmp, 'rev-parse', 'HEAD']).stdout.trim()
  let skillDir = entry.path ? join(tmp, entry.path) : null
  if (!skillDir || !existsSync(join(skillDir, 'SKILL.md'))) {
    // 上游仓库常有多份拷贝（.agents/.kiro/docs/<locale> 翻译）：优先规范布局 skills/<name>，再全库扫描兜底。
    const canonical = join(tmp, 'skills', skill)
    if (existsSync(join(canonical, 'SKILL.md'))) {
      skillDir = canonical
    } else {
      skillDir = null
      for (const candidate of await listFiles(tmp)) {
        if (!candidate.rel.endsWith('SKILL.md')) continue
        const dir = dirname(candidate.full)
        const frontmatterName = /^name:\s*(\S+)/m.exec(readFileSync(candidate.full, 'utf8'))?.[1]
        if (frontmatterName === skill || basename(dir) === skill) { skillDir = dir; break }
      }
      if (!skillDir) {
        await rm(tmp, { recursive: true, force: true })
        return { error: `上游未找到技能目录 ${skill}（补全 toolkit.json vendored.${skill}.path 后重试）` }
      }
    }
  }
  return { tmp, sha, skillDir }
}

// 本地目录 × 上游目录逐文件比对（文本按 LF 归一）。上游目录可来自克隆，也可来自离线包。
async function compareDirs(localDir, skillDir) {
  const localFiles = (await listFiles(localDir)).map((f) => f.rel)
  const upstreamFiles = (await listFiles(skillDir)).map((f) => f.rel)
  const report = { added: [], changed: [], identical: true, localExtra: localFiles.filter((f) => !upstreamFiles.includes(f)) }
  for (const rel of upstreamFiles) {
    const localPath = join(localDir, rel)
    if (!existsSync(localPath)) { report.added.push(rel); report.identical = false; continue }
    if (!(await sameFile(localPath, join(skillDir, rel)))) { report.changed.push(rel); report.identical = false }
  }
  return report
}

async function compareWithUpstream(skill, entry) {
  const up = await fetchUpstream(skill, entry)
  if (up.error) return up
  const localDir = join(root, '.agents', 'skills', skill)
  return { ...up, ...(await compareDirs(localDir, up.skillDir)), localDir }
}

// 离线包：目录直接用；压缩包用 tar 解压（Windows/macOS 的 bsdtar 兼容 zip，GNU tar 仅 tar.gz）。
// tar 兼容：绝对路径含冒号会被 GNU tar 当「远程主机:路径」（Windows 下 node 无 shell 时 PATH 命中 Git 的 GNU tar）——一律相对名 + cwd，参数不出现带冒号的路径。
async function extractBundle(path) {
  if (statSync(path).isDirectory()) return path
  const tmp = await mkdtemp(join(tmpdir(), 'vbundle-'))
  await copyFile(path, join(tmp, 'bundle.bin'))
  if (run('tar', ['-xf', 'bundle.bin'], { cwd: tmp }).status !== 0) {
    await rm(tmp, { recursive: true, force: true })
    console.error(`无法解压 ${path}（支持 zip/tar.gz；Linux 下 zip 请先手动解压后传目录）`)
    process.exit(2)
  }
  await rm(join(tmp, 'bundle.bin'), { force: true })
  if (existsSync(join(tmp, 'manifest.json'))) return tmp
  const first = (await readdir(tmp, { withFileTypes: true })).find((e) => e.isDirectory())
  return join(tmp, first.name)
}

async function compareWithBundle(skill, bundleDir) {
  const localDir = join(root, '.agents', 'skills', skill)
  const skillDir = join(bundleDir, skill)
  if (!existsSync(join(skillDir, 'SKILL.md'))) return { error: `离线包未包含技能目录 ${skill}` }
  return { ...(await compareDirs(localDir, skillDir)), localDir, skillDir, tmp: null }
}

// 破坏性升级识别：A) 改动文件的行级 diff（git 已是本脚本硬依赖，借 git diff --no-index；二进制跳过，超长截断）
const lineDiff = (localPath, upstreamPath) => {
  if (!isText(localPath) && !isText(upstreamPath)) return null
  const res = run('git', ['diff', '--no-index', '--unified=1', '--', localPath, upstreamPath])
  const lines = (res.stdout || '').split('\n').filter((l) => l !== '')
  if (!lines.length) return null
  return lines.slice(0, 80).join('\n') + (lines.length > 80 ? `\n  …（截断，全 diff 共 ${lines.length} 行）` : '')
}
// B) frontmatter 守卫：name 变了 = 所有 $调用名 断裂（机器可判定的破坏）；description 变化 = 触发匹配面变化（提示级）
const frontmatterField = (file, field) => {
  if (!existsSync(file)) return null
  return new RegExp(`^${field}:\\s*(.*)$`, 'm').exec(readFileSync(file, 'utf8'))?.[1]?.trim() ?? null
}
const breakingCheck = (result, skill, mode) => {
  const upName = frontmatterField(join(result.skillDir, 'SKILL.md'), 'name')
  const localName = frontmatterField(join(result.localDir, 'SKILL.md'), 'name')
  if (upName && localName && upName !== localName) {
    if (mode === 'upgrade') { console.log(`  ✗ 拒升：上游 frontmatter name "${localName}" → "${upName}"，全部 $${skill} 调用会断；先重命名并更新引用再升`); return true }
    console.log(`  ⚠ 破坏性：上游 frontmatter name "${localName}" → "${upName}"（升级即断路由引用）`)
  }
  if (mode === 'diff' && frontmatterField(join(result.skillDir, 'SKILL.md'), 'description') !== frontmatterField(join(result.localDir, 'SKILL.md'), 'description')) {
    console.log('  ⚠ description 已变化（影响宿主触发匹配，属行为面变更，升后须实测）')
  }
  return false
}

function impactReport(skill) {
  const hits = []
  const search = (dirAbs, dirRel) => {
    if (!existsSync(dirAbs)) return
    for (const entry of readdirSync(dirAbs, { withFileTypes: true })) {
      const rel = `${dirRel}/${entry.name}`
      if (entry.isDirectory()) {
        if (entry.name === '.claude' || entry.name === 'node_modules' || entry.name === '.git') continue
        search(join(dirAbs, entry.name), rel)
      } else if (/\.(md|mjs|json|ya?ml)$/.test(entry.name)) {
        const content = readFileSync(join(dirAbs, entry.name), 'utf8')
        if (content.includes(`$${skill}`) || content.includes(`/${skill}/`)) hits.push(rel)
      }
    }
  }
  for (const name of ['AGENTS.md', 'CLAUDE.md', 'README.md', 'NOTICE']) {
    if (existsSync(join(root, name)) && readFileSync(join(root, name), 'utf8').includes(skill)) hits.push(name)
  }
  for (const dir of ['docs', '.agents', '.toolkit', 'scripts']) search(resolve(root, dir), dir)
  return [...new Set(hits)]
}

const saveToolkit = async () => await writeFile(toolkitPath, JSON.stringify(toolkit, null, 2) + '\n', 'utf8')

if (mode === 'check') {
  console.log('vendored 上游检查（git SHA / npm 版本双通道）：\n')
  let drift = 0
  const reportedPkgs = new Set()
  for (const [skill, entry] of Object.entries(vendored)) {
    // npm 通道：共享包基线（toolkit.packages），同包只报一次
    if (entry.pkg) {
      const pkg = toolkit.packages?.[entry.pkg]
      if (!pkg?.npm) { console.log(`  ! ${skill}：引用包 ${entry.pkg} 未登记 npm 通道`); continue }
      if (reportedPkgs.has(entry.pkg)) continue
      reportedPkgs.add(entry.pkg)
      const skills = Object.entries(vendored).filter(([, e]) => e.pkg === entry.pkg).map(([s]) => s)
      const view = npmRun( ['view', pkg.npm, 'version'])
      if (view.status !== 0) { console.log(`  ! ${entry.pkg}：npm registry 不可达`); continue }
      const latest = view.stdout.trim()
      if (latest === pkg.version) console.log(`  ✓ ${entry.pkg} ${pkg.version}（覆盖：${skills.join('、')}）`)
      else { console.log(`  ↑ ${entry.pkg}：${pkg.version} → ${latest}（覆盖：${skills.join('、')}；升级指引：--upgrade ${skills[0]}）`); drift++ }
      continue
    }
    if (!entry.repo) { console.log(`  · ${skill}：${entry.source ?? '本地包来源'}（无公开 repo，手工升级）`); continue }
    const head = run('git', ['ls-remote', entry.repo, 'HEAD'])
    if (head.status !== 0) { console.log(`  ! ${skill}：无法探测上游（网络/代理）`); continue }
    const remote = head.stdout.split('\t')[0]
    if (!entry.sha) { console.log(`  ? ${skill}：未建基线 → 跑 --rebaseline ${skill} 对账`); continue }
    if (remote === entry.sha) console.log(`  ✓ ${skill}：最新（${entry.sha.slice(0, 8)}）`)
    else { console.log(`  ↑ ${skill}：可升级 ${entry.sha.slice(0, 8)} → ${remote.slice(0, 8)}（先 --diff ${skill}）`); drift++ }
  }
  process.exit(drift ? 1 : 0)
}

if (mode === 'pack') {
  if (!target) { console.error('用法：node scripts/update-vendored.mjs --pack <输出目录>'); process.exit(2) }
  await mkdir(target, { recursive: true })
  const manifest = { generated: new Date().toISOString(), skills: {}, packages: {} }
  // git 通道：ls-remote 找漂移（落后或未建基线），只克隆并打包这些技能的上游最新全量目录
  for (const [skill, entry] of Object.entries(vendored)) {
    if (entry.pkg || !entry.repo) continue
    const head = run('git', ['ls-remote', entry.repo, 'HEAD'])
    if (head.status !== 0) { console.log(`! ${skill}：无法探测上游（网络）`); continue }
    if (entry.sha && head.stdout.split('\t')[0] === entry.sha) continue
    const up = await fetchUpstream(skill, entry)
    if (up.error) { console.log(`! ${skill}：${up.error}`); continue }
    await cp(up.skillDir, join(target, skill), { recursive: true })
    manifest.skills[skill] = { repo: entry.repo, path: relative(up.tmp, up.skillDir).split('\\').join('/'), sha: up.sha }
    await rm(up.tmp, { recursive: true, force: true })
  }
  // npm 通道：版本落后才下载 tarball，展开后按 .agents/skills/<name> 布局取成员技能
  for (const [pkgName, pkg] of Object.entries(toolkit.packages ?? {})) {
    const view = npmRun( ['view', pkg.npm, 'version'])
    if (view.status !== 0) { console.log(`! ${pkgName}：npm registry 不可达`); continue }
    if (view.stdout.trim() === pkg.version) continue
    const version = view.stdout.trim()
    const tmp = await mkdtemp(join(tmpdir(), `pkg-${pkgName}-`))
    const packed = npmRun( ['pack', `${pkg.npm}@${version}`, '--pack-destination', tmp])
    const tgz = packed.status === 0 ? readdirSync(tmp).find((f) => f.endsWith('.tgz')) : null
    if (!tgz || run('tar', ['-xzf', tgz], { cwd: tmp }).status !== 0) {
      await rm(tmp, { recursive: true, force: true }); console.log(`! ${pkgName}：npm tarball 下载/展开失败`); continue
    }
    const bundled = []
    for (const skill of Object.entries(vendored).filter(([, e]) => e.pkg === pkgName).map(([s]) => s)) {
      const src = join(tmp, 'package', '.agents', 'skills', skill)
      if (!existsSync(src)) continue
      await cp(src, join(target, skill), { recursive: true })
      bundled.push(skill)
    }
    if (bundled.length) manifest.packages[pkgName] = { npm: pkg.npm, version, skills: bundled }
    await rm(tmp, { recursive: true, force: true })
  }
  await writeFile(join(target, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8')
  const count = Object.keys(manifest.skills).length + Object.values(manifest.packages).flatMap((p) => p.skills).length
  console.log(`离线升级包已生成 → ${target}（${count} 技能；git SHA 与 npm 版本在 manifest.json）`)
  process.exit(0)
}

if (bundlePath && mode === 'check') {
  console.error('--offline 仅与 --diff / --rebaseline / --upgrade 组合使用')
  process.exit(2)
}

if (mode === 'diff' || mode === 'rebaseline' || mode === 'upgrade') {
  if (bundlePath && !target) target = 'all' // 离线包只含漂移技能，缺省全量处理
  if (!target || (target !== 'all' && !(target in vendored))) {
    console.error(`用法：node scripts/update-vendored.mjs --${mode} <技能|all> [--offline <包>]`); process.exit(2)
  }
  let bundleDir = null
  let bundleManifest = null
  if (bundlePath) {
    bundleDir = await extractBundle(bundlePath)
    bundleManifest = JSON.parse(await readFile(join(bundleDir, 'manifest.json'), 'utf8'))
  }
  const printReport = (r) => {
    console.log(`  一致：${r.identical ? '是（零修改成立）' : '否'}`)
    if (r.added.length) console.log(`  上游新增：${r.added.join(', ')}`)
    if (r.changed.length) console.log(`  内容差异：${r.changed.join(', ')}`)
    if (r.localExtra.length) console.log(`  本地附加（升级保留）：${r.localExtra.join(', ')}`)
  }
  const copyChanges = async (r) => {
    for (const rel of [...r.added, ...r.changed]) {
      await mkdir(dirname(join(r.localDir, rel)), { recursive: true })
      await cp(join(r.skillDir, rel), join(r.localDir, rel))
    }
  }
  const names = target === 'all' ? Object.keys(vendored) : [target]
  for (const skill of names) {
    const entry = vendored[skill]
    // 离线包只装漂移技能：不在 manifest 里的条目直接跳过（不是错误）
    if (bundleManifest && !(bundleManifest.skills?.[skill] || Object.values(bundleManifest.packages ?? {}).some((p) => (p.skills ?? []).includes(skill)))) continue
    if (entry.pkg) {
      if (!bundleManifest) {
        const pkg = toolkit.packages?.[entry.pkg]
        console.log(`· ${skill}：npm 通道（${entry.pkg} 基线 ${pkg?.version ?? '?'}）。升级为手工快照流程：`)
        console.log(`  1. 宿主插件市场更新 ${entry.pkg} 后，取本机缓存新版本目录（如 ~/.claude/plugins/cache/claude-plugins-official/${entry.pkg}/<新版本>/）`)
        console.log(`  2. 覆盖拷贝对应技能目录到 .agents/skills/（同包技能：${Object.entries(vendored).filter(([, e]) => e.pkg === entry.pkg).map(([s]) => s).join('、')}）`)
        console.log('  3. 更新 toolkit.json packages.<包>.version → 跑 node .toolkit/scripts/sync-mirror.mjs → strict + tests → 发版')
        continue
      }
      const pkgInfo = Object.values(bundleManifest.packages ?? {}).find((p) => (p.skills ?? []).includes(skill))
      if (!pkgInfo) { console.log(`! ${skill}：离线包未包含（npm 包 ${entry.pkg}）`); continue }
      const result = await compareWithBundle(skill, bundleDir)
      if (result.error) { console.log(`! ${skill}：${result.error}`); continue }
      console.log(`\n== ${skill} @ npm ${pkgInfo.version} ==`)
      printReport(result)
      if (breakingCheck(result, skill, mode)) continue
      if (mode === 'diff') {
        console.log(`  引用影响：${impactReport(skill).join('、') || '无'}`)
        for (const rel of result.changed) {
          const d = lineDiff(join(result.localDir, rel), join(result.skillDir, rel))
          if (d === null) continue
          console.log(`\n  -- ${rel} 行级 diff --\n${d}`)
        }
      }
      if (mode === 'rebaseline') {
        if (result.identical) { toolkit.packages[entry.pkg].version = pkgInfo.version; await saveToolkit(); console.log(`  ✓ npm 版本基线已写入（${pkgInfo.version}）`) }
        else console.log('  ✗ 与离线包不一致，拒写基线（先人工评估 --diff，或 --upgrade）')
      }
      if (mode === 'upgrade') {
        await copyChanges(result)
        toolkit.packages[entry.pkg].version = pkgInfo.version
        await saveToolkit()
        console.log(`  ✓ 已覆盖 ${result.added.length + result.changed.length} 文件（本地附加未动）；npm 基线 → ${pkgInfo.version}`)
        console.log('  → 跑 node .toolkit/scripts/sync-mirror.mjs 重建镜像，strict + tests 通过后提交发版，NOTICE 快照日期同步')
      }
      continue
    }
    if (!entry.repo) { console.log(`· ${skill}：${entry.source ?? '本地包来源'}（无 repo，${mode} 不适用）`); continue }
    const result = bundleManifest ? await compareWithBundle(skill, bundleDir) : await compareWithUpstream(skill, entry)
    if (result.error) { console.log(`! ${skill}：${result.error}`); continue }
    const sha = bundleManifest ? bundleManifest.skills?.[skill]?.sha : result.sha
    if (!sha) { console.log(`! ${skill}：离线包 manifest 未登记`); continue }
    console.log(`\n== ${skill} @ ${sha.slice(0, 8)} ==`)
    printReport(result)
    if (breakingCheck(result, skill, mode)) continue
    if (mode === 'diff') {
      console.log(`  引用影响：${impactReport(skill).join('、') || '无'}`)
      for (const rel of result.changed) {
        const d = lineDiff(join(result.localDir, rel), join(result.skillDir, rel))
        if (d === null) continue
        console.log(`\n  -- ${rel} 行级 diff --\n${d}`)
      }
    }
    if (mode === 'rebaseline') {
      if (result.identical) {
        entry.sha = sha
        if (!bundleManifest) entry.path = entry.path ?? result.skillDir.slice(result.tmp.length + 1).split('\\').join('/')
        await saveToolkit()
        console.log(`  ✓ 基线已写入 toolkit.json（sha ${sha.slice(0, 8)}）`)
      } else console.log('  ✗ 与上游不一致，拒写基线（先人工评估 --diff，或 --upgrade）')
    }
    if (mode === 'upgrade') {
      await copyChanges(result)
      entry.sha = sha; entry.snapshot = new Date().toISOString().slice(0, 10)
      await saveToolkit()
      console.log(`  ✓ 已覆盖 ${result.added.length + result.changed.length} 文件（本地附加未动）；登记已更新`)
      console.log('  → 跑 node .toolkit/scripts/sync-mirror.mjs 重建镜像，strict + tests 通过后提交发版，NOTICE 快照日期同步')
    }
    if (result.tmp) await rm(result.tmp, { recursive: true, force: true })
  }
  process.exit(0)
}

console.error('用法：node scripts/update-vendored.mjs [--diff|--rebaseline|--upgrade|--pack] <技能|all|目录> [--offline <包>]')
process.exit(2)
