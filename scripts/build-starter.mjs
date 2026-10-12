#!/usr/bin/env node
import { mkdir, mkdtemp, open, readdir, readFile, rmdir, rm, unlink, writeFile } from 'node:fs/promises'
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { isDeepStrictEqual } from 'node:util'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(await readFile(join(repositoryRoot, 'toolkit.json'), 'utf8'))
const distExcludes = manifest.distExcludes ?? []
const skipIfExists = new Set(manifest.skipIfExists ?? [])
const runtimeEntries = manifest.starter.runtime

let targetDir = null
let dryRun = false
let acceptMcp = false
let checkOnly = false
for (let argumentIndex = 2; argumentIndex < process.argv.length; argumentIndex++) {
  const argument = process.argv[argumentIndex]
  if (argument === '--target') targetDir = process.argv[++argumentIndex]
  else if (argument.startsWith('--target=')) targetDir = argument.slice('--target='.length)
  else if (argument === '--check') checkOnly = true
  else if (argument === '--dry-run') dryRun = true
  else if (argument === '--accept-mcp') acceptMcp = true
  else { console.error(`build-starter: 未知参数 ${argument}`); process.exit(2) }
}
if ((targetDir && targetDir.startsWith('--')) || (checkOnly && (targetDir || dryRun || acceptMcp))) {
  console.error('build-starter: 参数组合无效')
  process.exit(2)
}

const isExcluded = (rel) => distExcludes.some((ex) => rel === ex || rel.startsWith(ex + '/'))

// 已识别缓存/临时物：按明确路径段与文件类型过滤，不按笼统名称排除必要 vendor 文件（票 12）。
const CACHE_DIR_SEGMENTS = new Set(['__pycache__', '.stitch'])
const isCacheArtifact = (rel) =>
  rel.split('/').some((seg) => CACHE_DIR_SEGMENTS.has(seg)) || rel.endsWith('.pyc') || rel.split('/').pop() === '.DS_Store'

// 声明有效性：相对路径、无父级穿越/反斜杠、解析后不越出源根（拒绝借声明读取根外内容）。
function declarationErrors(root) {
  const errors = []
  for (const entry of runtimeEntries) {
    if (typeof entry !== 'string' || entry === '' || isAbsolute(entry) || entry.includes('\\') || entry.split('/').includes('..')) {
      errors.push(`starter.runtime 声明非法（须为相对路径、无父级穿越）：${JSON.stringify(entry)}`)
      continue
    }
    const full = resolve(root, entry)
    if (full !== root && !full.startsWith(root + sep)) errors.push(`starter.runtime 声明越出源根：${entry}`)
  }
  return errors
}

// 真实边界预检（票 12 补修）：词法检查之外，用 realpath 解析声明全链——
// 任一祖先目录或声明本身是符号链接/junction 且指向源根外即拒绝（词法 resolve 不穿透链接，必须实测解析）。
function boundaryErrors(root) {
  const errors = []
  let realRoot
  try {
    realRoot = realpathSync(root)
  } catch {
    return [`源根无法解析（realpath）：${root}`]
  }
  for (const entry of runtimeEntries) {
    const full = resolve(root, entry)
    if (!existsSync(full)) continue // 缺失由结构完整性/白名单展开报告
    let real
    try {
      real = realpathSync(full)
    } catch {
      errors.push(`starter.runtime 声明路径无法解析（链接环/权限）：${entry}`)
      continue
    }
    if (real !== realRoot && !real.startsWith(realRoot + sep)) {
      errors.push(`starter.runtime 声明经链接越出源根：${entry} → ${real}`)
    }
  }
  return errors
}

// 白名单展开：目录声明递归收录普通文件；符号链接一律拒绝（防根外读取）；缓存段不进入。
async function collectDeclaredFiles(root) {
  const files = []
  const errors = []
  const walkDir = async (abs) => {
    for (const entry of await readdir(abs, { withFileTypes: true })) {
      const rel = relative(root, join(abs, entry.name)).split('\\').join('/')
      if (entry.isSymbolicLink()) { errors.push(`声明范围内含符号链接（拒绝以防根外读取）：${rel}`); continue }
      if (isCacheArtifact(rel)) continue
      if (entry.isDirectory()) await walkDir(join(abs, entry.name))
      else files.push(rel)
    }
  }
  for (const entry of runtimeEntries) {
    const full = resolve(root, entry)
    if (!existsSync(full)) { errors.push(`starter.runtime 项缺失：${entry}`); continue }
    if (lstatSync(full).isSymbolicLink()) { errors.push(`starter.runtime 声明本身是符号链接：${entry}`); continue }
    if (lstatSync(full).isDirectory()) await walkDir(full)
    else files.push(relative(root, full).split('\\').join('/'))
  }
  return { files, errors }
}

// 必要能力引用（票 12 补修）：.mcp.json 的本地 tools/ 引用必须存在，且实际进入
// 过滤后的最终分发集合（已声明、未被 distExcludes 排除、未被缓存过滤）——基于 finalSet 判定。
function mcpReferenceErrors(root, finalSet) {
  if (!finalSet.has('.mcp.json') || !existsSync(join(root, '.mcp.json'))) return []
  let mcp
  try {
    mcp = JSON.parse(readFileSync(join(root, '.mcp.json'), 'utf8'))
  } catch {
    return ['.mcp.json 已声明随发但不是有效 JSON']
  }
  const errors = []
  for (const [name, server] of Object.entries(mcp.mcpServers ?? {})) {
    for (const arg of server?.args ?? []) {
      if (typeof arg !== 'string' || !arg.startsWith('tools/')) continue
      if (!existsSync(join(root, arg))) {
        errors.push(`.mcp.json 服务器 ${name} 引用的本地工具路径缺失：${arg}`)
      } else if (!finalSet.has(arg)) {
        errors.push(`.mcp.json 服务器 ${name} 引用的 ${arg} 未进入最终分发集合（未声明/被排除/被过滤）`)
      }
    }
  }
  return errors
}

// 批 P（票 12 残余 snippet 消费接线/票 16 机制范围）：codex-mcp-snippet.toml 与
// .mcp.json 同边界，按本仓窄契约严格解析——每个非空非整行注释行必须被完整消费：
// section 名仅限简单字符且不得重复；command = "node" 必需且唯一；args 为单行纯简单
// 双引号字符串数组（严格逗号分隔、无转义、无空项、无尾随逗号）；args 首项必须是
// 规范 tools/ 仓内普通文件且进入最终分发集合，越界/绝对/反斜杠/控制字节拒绝；
// 未知键/未知行/缺项拒绝。非通用 TOML 解析器、零新依赖。
function snippetReferenceErrors(root, finalSet) {
  const rel = 'tools/mcp/codex-mcp-snippet.toml'
  const contract = `${rel}（本仓片段契约）`
  if (!finalSet.has(rel) || !existsSync(join(root, rel))) return []
  const BACKSLASH = String.fromCharCode(92)
  const CONTROL = /[\u0000-\u001f]/
  const errors = []
  const sections = new Map()
  let current = null
  const isCanonicalToolsPath = (item) => {
    if (!item.startsWith('tools/') || item.includes(BACKSLASH) || item.includes(':') || CONTROL.test(item)) return false
    const segments = item.split('/')
    return segments.every((segment) => segment !== '' && segment !== '.' && segment !== '..')
  }
  const parseSimpleStringArray = (value) => {
    if (!value.startsWith('[') || !value.endsWith(']')) return { error: 'args 必须是单行数组' }
    let rest = value.slice(1, -1).trim()
    const items = []
    if (rest === '') return { error: 'args 不得为空数组' }
    while (true) {
      if (!rest.startsWith('"')) return { error: 'args 每项必须为简单双引号字符串（不支持转义）' }
      const close = rest.indexOf('"', 1)
      if (close < 0) return { error: 'args 字符串未闭合' }
      const item = rest.slice(1, close)
      if (item === '') return { error: 'args 不得包含空字符串' }
      if (item.includes(BACKSLASH) || CONTROL.test(item)) return { error: 'args 字符串不得含反斜杠或控制字节' }
      items.push(item)
      rest = rest.slice(close + 1).trimStart()
      if (rest === '') break
      if (!rest.startsWith(',')) return { error: 'args 项之间必须以逗号分隔' }
      rest = rest.slice(1).trimStart()
      if (rest === '') return { error: 'args 不得以尾随逗号结束' }
    }
    return { items }
  }
  for (const raw of readFileSync(join(root, rel), 'utf8').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const header = /^\[mcp_servers\.([A-Za-z0-9_-]+)\]$/.exec(line)
    if (header) {
      current = header[1]
      if (sections.has(current)) errors.push(`${contract} 重复 section：${current}`)
      else sections.set(current, { command: false, args: null })
      continue
    }
    if (current === null) { errors.push(`${contract} 节外未知行：${line}`); continue }
    const assignment = /^([A-Za-z]+)[ ]*=[ ]*(.+)$/.exec(line)
    if (!assignment) { errors.push(`${contract} 服务器 ${current} 未知语法行：${line}`); continue }
    const [, key, value] = assignment
    const entry = sections.get(current)
    if (key === 'command') {
      if (entry.command) errors.push(`${contract} 服务器 ${current} 重复 command`)
      else if (value !== '"node"') errors.push(`${contract} 服务器 ${current} command 必须为 "node"`)
      else entry.command = true
    } else if (key === 'args') {
      if (entry.args) errors.push(`${contract} 服务器 ${current} 重复 args`)
      else {
        const parsed = parseSimpleStringArray(value)
        if (parsed.error) errors.push(`${contract} 服务器 ${current} ${parsed.error}`)
        else entry.args = parsed.items
      }
    } else {
      errors.push(`${contract} 服务器 ${current} 未知键：${key}`)
    }
  }
  if (sections.size === 0) return [`${contract} 未包含任何 [mcp_servers.*] 节`]
  for (const [name, entry] of sections) {
    if (!entry.command) errors.push(`${contract} 服务器 ${name} 缺少 command = "node"`)
    if (!entry.args) { errors.push(`${contract} 服务器 ${name} 缺少可解析的 args`); continue }
    const [first, ...restItems] = entry.args
    if (!isCanonicalToolsPath(first)) {
      errors.push(`${contract} 服务器 ${name} args 首项必须是规范 tools/ 仓内入口（拒绝越界/裸名/反斜杠/绝对路径）：${first}`)
    } else if (!existsSync(join(root, first)) || !statSync(join(root, first)).isFile()) {
      errors.push(`${contract} 服务器 ${name} 引用的本地工具入口缺失或非普通文件：${first}`)
    } else if (!finalSet.has(first)) {
      errors.push(`${contract} 服务器 ${name} 引用的 ${first} 未进入最终分发集合（未声明/被排除/被过滤）`)
    }
    for (const arg of restItems) {
      if (arg.startsWith('tools/')) {
        if (isCanonicalToolsPath(arg) && existsSync(join(root, arg)) && statSync(join(root, arg)).isFile()) {
          if (!finalSet.has(arg)) errors.push(`${contract} 服务器 ${name} 引用的 ${arg} 未进入最终分发集合（未声明/被排除/被过滤）`)
        } else {
          errors.push(`${contract} 服务器 ${name} 引用的本地工具路径缺失/非规范：${arg}`)
        }
      } else if (arg.startsWith('../') || arg.startsWith('/') || arg.includes(':') || arg.includes(BACKSLASH)) {
        errors.push(`${contract} 服务器 ${name} 引用越界/绝对路径（仅允许 tools/ 相对引用）：${arg}`)
      }
    }
  }
  return errors
}

// 共享预检（票 12 补修）：--check 与安装复用同一边界/引用预检；
// 任一阶段失败即返回错误，安装侧据此在复制受管文件或写安装事实之前中止。
async function preflight(root) {
  const lexical = declarationErrors(root)
  if (lexical.length) return { files: [], errors: lexical }
  const boundary = boundaryErrors(root)
  if (boundary.length) return { files: [], errors: boundary }
  const { files, errors: walkErrors } = await collectDeclaredFiles(root)
  if (walkErrors.length) return { files: [], errors: walkErrors }
  const finalSet = new Set(files.filter((rel) => !isExcluded(rel)))
  return { files, finalSet, errors: [...mcpReferenceErrors(root, finalSet), ...snippetReferenceErrors(root, finalSet)] }
}

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
  const pre = await preflight(repositoryRoot)
  const errors = [...pre.errors, ...integrityErrors(repositoryRoot)]
  if (errors.length) fail('--check 结构完整性失败', errors)
  console.log(`build-starter --check: 结构完整（${manifest.skills.length} 技能）`)
  process.exit(0)
}

if (!targetDir) {
  console.error('用法：node scripts/build-starter.mjs --target <目录> | --check')
  process.exit(2)
}

const pre = await preflight(repositoryRoot)
if (pre.errors.length) fail('starter.runtime 预检失败', pre.errors)
targetDir = resolve(targetDir)
const copied = []
const skipped = []
const hash = (content) => createHash('sha256').update(content).digest('hex')
const objectRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const pathStat = (path) => {
  try { return lstatSync(path) } catch (error) { if (error.code === 'ENOENT') return null; throw error }
}
function checkTargetPath(path, file = false) {
  let current = path
  let leaf = true
  while (true) {
    const entry = pathStat(current)
    if (entry?.isSymbolicLink()) throw new Error(`目标路径含链接：${current}`)
    if (entry && (leaf && file ? !entry.isFile() : !entry.isDirectory())) throw new Error(`目标路径类型冲突：${current}`)
    const parent = dirname(current)
    if (parent === current) break
    current = parent
    leaf = false
  }
}
function canonicalTarget(path) {
  let ancestor = path
  while (!pathStat(ancestor)) ancestor = dirname(ancestor)
  return resolve(realpathSync(ancestor), relative(ancestor, path))
}
const containsPath = (parent, child) => {
  const remainder = relative(parent, child)
  return remainder === '' || (!isAbsolute(remainder) && remainder !== '..' && !remainder.startsWith('..' + sep))
}
const readTarget = async (rel) => {
  const path = join(targetDir, rel)
  checkTargetPath(path, true)
  return pathStat(path) ? await readFile(path) : null
}
function parseObject(content, label) {
  const value = JSON.parse(content.toString('utf8'))
  if (!objectRecord(value)) throw new Error(`${label} 必须是 JSON 对象`)
  return value
}
function validRelative(rel) {
  return typeof rel === 'string' && rel !== '' && !isAbsolute(rel) && !/[\\:\x00]/.test(rel) && rel.split('/').every((part) => part !== '' && part !== '.' && part !== '..')
}
let overlay = false
try {
  checkTargetPath(targetDir)
  const realSource = realpathSync(repositoryRoot)
  const realTarget = canonicalTarget(targetDir)
  if (containsPath(realSource, realTarget) || containsPath(realTarget, realSource)) throw new Error('源与目标重叠，拒绝安装')
  overlay = existsSync(targetDir) && (await readdir(targetDir)).length > 0
  const manifestRel = '.toolkit/manifest.json'
  const oldManifest = await readTarget(manifestRel)
  const seed = pre.finalSet.has(manifestRel) ? parseObject(await readFile(join(repositoryRoot, manifestRel)), manifestRel) : {}
  const installed = oldManifest ? parseObject(oldManifest, manifestRel) : seed
  const baseline = installed.installation?.files ?? {}
  if (installed.installation !== undefined) {
    if (!objectRecord(installed.installation) || installed.installation.schemaVersion !== 1 || !objectRecord(installed.installation.files) || installed.installation.starterVersion !== installed.starterVersion) throw new Error('安装基线格式或版本无效')
    for (const [rel, digest] of Object.entries(baseline)) {
      if (!validRelative(rel) || typeof digest !== 'string' || !/^[a-f0-9]{64}$/.test(digest)) throw new Error('安装基线包含非法路径或哈希')
    }
  }
  const nextBaseline = { ...baseline }
  const plans = []
  const conflicts = []
  for (const rel of pre.finalSet) {
    if (rel === manifestRel) continue
    const current = await readTarget(rel)
    let incoming = await readFile(join(repositoryRoot, rel))
    if (rel === '.toolkit/profile-state.json' && !current) {
      const seedState = parseObject(incoming, rel)
      seedState.maturity = { status: 'unformed', confidence: 'low', evidence: [], assessedAt: null }
      incoming = Buffer.from(JSON.stringify(seedState, null, 2) + '\n')
    }
    const digest = hash(incoming)
    if (rel === '.mcp.json') {
      const stock = parseObject(incoming, rel)
      const user = current ? parseObject(current, rel) : {}
      if ((stock.mcpServers !== undefined && !objectRecord(stock.mcpServers)) || (user.mcpServers !== undefined && !objectRecord(user.mcpServers))) throw new Error('MCP mcpServers 必须是对象')
      const servers = new Map(Object.entries(user.mcpServers ?? {}))
      for (const [name, server] of Object.entries(stock.mcpServers ?? {})) {
        if (servers.has(name)) {
          if (!isDeepStrictEqual(servers.get(name), server)) conflicts.push(`MCP 同名配置冲突：${name}`)
        } else if (overlay && !acceptMcp) conflicts.push(`MCP 新连接须显式 --accept-mcp：${name}`)
        else servers.set(name, server)
      }
      const merged = { ...(current ? user : stock), mcpServers: Object.fromEntries(servers) }
      const content = current && isDeepStrictEqual(user, merged) ? current : Buffer.from(JSON.stringify(merged, null, 2) + '\n')
      if (!current || !content.equals(current)) plans.push({ rel, current, incoming: content, mode: statSync(join(repositoryRoot, rel)).mode })
      else skipped.push(rel)
      continue
    }
    if (skipIfExists.has(rel) && current) { skipped.push(rel); continue }
    const previousHash = Object.hasOwn(baseline, rel) ? baseline[rel] : null
    if (!current && previousHash) { conflicts.push(`受管文件已删除，需显式处理：${rel}`); continue }
    if (current && hash(current) !== digest && (!previousHash || hash(current) !== previousHash)) {
      if (previousHash === digest) skipped.push(rel)
      else conflicts.push(`文件冲突或未知旧基线：${rel}`)
      continue
    }
    if (!skipIfExists.has(rel)) Object.defineProperty(nextBaseline, rel, { value: digest, enumerable: true, configurable: true, writable: true })
    if (!current || !current.equals(incoming)) plans.push({ rel, current, incoming, mode: statSync(join(repositoryRoot, rel)).mode })
    else skipped.push(rel)
  }
  if (dryRun) {
    for (const plan of plans) console.log(`拟写入：${plan.rel}`)
    for (const rel of skipped) console.log(`保留：${rel}`)
  }
  if (conflicts.length) throw new Error(conflicts.join('\n'))
  const previousVersion = installed.starterVersion
  const nextInstalled = {
    ...installed, starterVersion: manifest.version,
    installation: { ...installed.installation, schemaVersion: 1, starterVersion: manifest.version, files: nextBaseline },
  }
  const nextManifest = Buffer.from(JSON.stringify(nextInstalled, null, 2) + '\n')
  if (!oldManifest || !oldManifest.equals(nextManifest)) plans.push({ rel: manifestRel, current: oldManifest, incoming: nextManifest })
  if (dryRun) { console.log(`dry-run：${plans.length} 项拟写入，目标未修改`); process.exit(0) }
  if (!overlay) {
    const stage = await mkdtemp(join(tmpdir(), 'starter-stage-'))
    try {
      for (const plan of plans) {
        const path = join(stage, plan.rel)
        await mkdir(dirname(path), { recursive: true })
        await writeFile(path, plan.incoming, { mode: plan.mode })
      }
      const errors = integrityErrors(stage)
      if (errors.length) throw new Error(errors.join('\n'))
      for (const args of [[join(stage, '.toolkit/scripts/check-ai-guidance.mjs'), '--root', stage, '--strict'], [join(stage, '.toolkit/scripts/sync-mirror.mjs'), '--check']]) {
        const result = spawnSync(process.execPath, args, { stdio: 'inherit' })
        if (result.status !== 0) throw new Error('干净副本三连校验失败')
      }
    } finally { await rm(stage, { recursive: true, force: true }) }
  }
  const backup = plans.length ? await mkdtemp(join(tmpdir(), 'starter-transaction-')) : null
  const applied = []
  const createdDirectories = []
  let keepBackup = false
  const ensureDirectory = async (path) => {
    checkTargetPath(path)
    const missing = []
    let ancestor = path
    while (!pathStat(ancestor)) { missing.push(ancestor); ancestor = dirname(ancestor) }
    for (const directory of missing.reverse()) {
      await mkdir(directory)
      createdDirectories.push(directory)
    }
  }
  try {
    for (const [index, plan] of plans.entries()) {
      if (plan.current) await writeFile(join(backup, String(index)), plan.current)
    }
    if (backup) await writeFile(join(backup, 'recovery.json'), JSON.stringify({ target: targetDir, files: plans.map((plan, index) => ({ path: plan.rel, backup: plan.current ? String(index) : null })) }, null, 2))
    for (const plan of plans) {
      const current = await readTarget(plan.rel)
      if ((current === null) !== (plan.current === null) || (current && !current.equals(plan.current))) throw new Error(`预检后目标已变化：${plan.rel}`)
    }
    for (const plan of plans) {
      await ensureDirectory(dirname(join(targetDir, plan.rel)))
      const current = await readTarget(plan.rel)
      if ((current === null) !== (plan.current === null) || (current && !current.equals(plan.current))) throw new Error(`写入前目标已变化：${plan.rel}`)
      if (plan.current === null) {
        const handle = await open(join(targetDir, plan.rel), 'wx', plan.mode)
        applied.push({ ...plan, completed: false })
        try { await handle.writeFile(plan.incoming) } finally { await handle.close() }
      } else {
        applied.push({ ...plan, completed: false })
        await writeFile(join(targetDir, plan.rel), plan.incoming)
      }
      applied[applied.length - 1].completed = true
      copied.push(plan.rel)
    }
  } catch (error) {
    const recoveryErrors = []
    for (const plan of applied.reverse()) {
      try {
        const current = await readTarget(plan.rel)
        if (current && plan.current && current.equals(plan.current)) continue
        if (plan.completed && (!current || !current.equals(plan.incoming))) throw new Error('恢复前文件再次变化')
        if (plan.current) await writeFile(join(targetDir, plan.rel), plan.current)
        else if (current) await unlink(join(targetDir, plan.rel))
      } catch { recoveryErrors.push(plan.rel) }
    }
    for (const directory of createdDirectories.reverse()) {
      try { await rmdir(directory) } catch (cleanupError) { if (!['ENOTEMPTY', 'ENOENT', 'EEXIST'].includes(cleanupError.code)) recoveryErrors.push(directory) }
    }
    if (recoveryErrors.length) {
      keepBackup = true
      throw new Error(`${error.message}\n恢复不完整：${recoveryErrors.join(', ')}\n恢复材料保留于：${backup}`)
    }
    throw new Error(`${error.message}\n已恢复本次写入`)
  } finally {
    if (backup && !keepBackup) await rm(backup, { recursive: true, force: true })
  }
  if (!overlay) { console.log(`干净副本完成：${copied.length} 文件 → ${targetDir}（三连校验通过）`); process.exit(0) }
  console.log(previousVersion && previousVersion !== manifest.version ? `  Starter 升级：${previousVersion} → ${manifest.version}` : `  Starter 版本：${manifest.version}`)
} catch (error) {
  console.error(`build-starter: ${error.message}`)
  process.exit(1)
}

try {
if (overlay) {
  // 源仓工作区状态检查：未提交改动会被当作 stock 拷入目标，先警告让用户甄别。
  const dirty = spawnSync('git', ['-C', repositoryRoot, 'status', '--porcelain'], { encoding: 'utf8' })
  if (dirty.status === 0 && dirty.stdout.trim()) {
    console.log(`  ⚠ 源仓工作区有未提交改动（${dirty.stdout.trim().split('\n').length} 项），将按工作区现状安装；要按已发布版本安装请先提交或暂存`)
  }
  console.log(`安全安装完成：写入 ${copied.length} 文件，保留 ${skipped.length} 文件（用户拥有/内容相同/本地定制）`)
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
    console.log(diff === 0 ? `  跳过：${rel}（与新版内容相同，不代表历史基线）` : `  跳过：${rel}（与新版有 ${diff} 行差异；保留现状，需人工核对后采纳）`)
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
  console.log(`  排除清单（distExcludes，在 runtime 声明范围内生效）：${distExcludes.join(', ')}`)
  process.exit(0)
}
} catch {
  console.warn('安装已成功；辅助报告未完成，未更改用户配置。')
  process.exit(0)
}
