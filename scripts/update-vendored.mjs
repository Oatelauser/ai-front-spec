#!/usr/bin/env node
// vendored 技能升级器（零修改原则配套）：
//   无参          check —— git repo 条目比对上游 HEAD 与登记 SHA，报告可升级/未基线/无法探测
//   --diff <技能>  双报告 —— 上游变更摘要（新增/删除/改动文件）× 本仓引用影响（谁在用）
//   --rebaseline <技能|all> 对账：与上游逐字节比对（文本按 LF 归一），一致才写入 SHA 基线
//   --upgrade <技能> 确认后执行：上游覆盖拷贝（不删本地附加文件）→ 更新登记 → 镜像 → 校验
// 无 repo 的条目（插件快照/本地包）只打印来源，不做网络探测。SHA 是唯一版本真相。
import { cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const toolkitPath = join(root, 'toolkit.json')
const toolkit = JSON.parse(await readFile(toolkitPath, 'utf8'))
const vendored = toolkit.vendored ?? {}

const args = process.argv.slice(2)
const mode = args[0]?.startsWith('--') ? args[0].slice(2) : 'check'
const target = args[1]

const run = (cmd, cmdArgs, opts = {}) => spawnSync(cmd, cmdArgs, { encoding: 'utf8', ...opts })

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

async function compareWithUpstream(skill, entry) {
  const up = await fetchUpstream(skill, entry)
  if (up.error) return up
  const localDir = join(root, '.agents', 'skills', skill)
  const localFiles = (await listFiles(localDir)).map((f) => f.rel)
  const upstreamFiles = (await listFiles(up.skillDir)).map((f) => f.rel)
  const report = { added: [], changed: [], identical: true, localExtra: localFiles.filter((f) => !upstreamFiles.includes(f)) }
  for (const rel of upstreamFiles) {
    const localPath = join(localDir, rel)
    if (!existsSync(localPath)) { report.added.push(rel); report.identical = false; continue }
    if (!(await sameFile(localPath, join(up.skillDir, rel)))) { report.changed.push(rel); report.identical = false }
  }
  return { ...up, ...report, localDir }
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
  console.log('vendored 上游检查（SHA 基线制）：\n')
  let drift = 0
  for (const [skill, entry] of Object.entries(vendored)) {
    if (!entry.repo) { console.log(`  · ${skill}：${entry.source}（无公开 repo，手工升级）`); continue }
    const head = run('git', ['ls-remote', entry.repo, 'HEAD'])
    if (head.status !== 0) { console.log(`  ! ${skill}：无法探测上游（网络/代理）`); continue }
    const remote = head.stdout.split('\t')[0]
    if (!entry.sha) { console.log(`  ? ${skill}：未建基线 → 跑 --rebaseline ${skill} 对账`); continue }
    if (remote === entry.sha) console.log(`  ✓ ${skill}：最新（${entry.sha.slice(0, 8)}）`)
    else { console.log(`  ↑ ${skill}：可升级 ${entry.sha.slice(0, 8)} → ${remote.slice(0, 8)}（先 --diff ${skill}）`); drift++ }
  }
  process.exit(drift ? 1 : 0)
}

if (mode === 'diff' || mode === 'rebaseline' || mode === 'upgrade') {
  if (!target || (target !== 'all' && !(target in vendored))) {
    console.error(`用法：node scripts/update-vendored.mjs --${mode} <技能|all>`); process.exit(2)
  }
  const names = target === 'all' ? Object.keys(vendored) : [target]
  for (const skill of names) {
    const entry = vendored[skill]
    if (!entry.repo) { console.log(`· ${skill}：${entry.source}（无 repo，${mode} 不适用）`); continue }
    const result = await compareWithUpstream(skill, entry)
    if (result.error) { console.log(`! ${skill}：${result.error}`); continue }
    console.log(`\n== ${skill} @ ${result.sha.slice(0, 8)} ==`)
    console.log(`  一致：${result.identical ? '是（零修改成立）' : '否'}`)
    if (result.added.length) console.log(`  上游新增：${result.added.join(', ')}`)
    if (result.changed.length) console.log(`  内容差异：${result.changed.join(', ')}`)
    if (result.localExtra.length) console.log(`  本地附加（升级保留）：${result.localExtra.join(', ')}`)
    if (mode === 'diff') console.log(`  引用影响：${impactReport(skill).join('、') || '无'}`)
    if (mode === 'rebaseline') {
      if (result.identical) {
        entry.sha = result.sha; entry.path = entry.path ?? result.skillDir.slice(result.tmp.length + 1).split('\\').join('/')
        await saveToolkit()
        console.log(`  ✓ 基线已写入 toolkit.json（sha ${result.sha.slice(0, 8)}）`)
      } else console.log(`  ✗ 与上游不一致，拒写基线（先人工评估 --diff，或 --upgrade）`)
    }
    if (mode === 'upgrade') {
      for (const rel of [...result.added, ...result.changed]) {
        await mkdir(dirname(join(result.localDir, rel)), { recursive: true })
        await cp(join(result.skillDir, rel), join(result.localDir, rel))
      }
      entry.sha = result.sha; entry.snapshot = new Date().toISOString().slice(0, 10)
      await saveToolkit()
      console.log(`  ✓ 已覆盖 ${result.added.length + result.changed.length} 文件（本地附加未动）；登记已更新`)
      console.log('  → 跑 node .toolkit/scripts/sync-mirror.mjs 重建镜像，strict + tests 通过后提交发版，NOTICE 快照日期同步')
    }
    if (result.tmp) await rm(result.tmp, { recursive: true, force: true })
  }
  process.exit(0)
}

console.error('用法：node scripts/update-vendored.mjs [--diff|--rebaseline|--upgrade] <技能|all>')
process.exit(2)
