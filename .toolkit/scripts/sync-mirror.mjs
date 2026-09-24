#!/usr/bin/env node
// 镜像同步器：.agents/skills（唯一人工源）→ .claude/skills（机器镜像）。
// 默认同步（wipe + rebuild）；--check 只报告漂移（测试锁与 CI 共用同一代码路径）。
// 带 YAML frontmatter 的 .md 在 frontmatter 之后注入一行 AUTO-GENERATED 头；
// 其余文件（png/svg/yaml/无 frontmatter md）原样复制。frontmatter 必须行 1 起。
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDir, '..', '..')
const sourceDir = join(projectRoot, '.agents', 'skills')
const mirrorDir = join(projectRoot, '.claude', 'skills')
const checkMode = process.argv.includes('--check')

const mirrorHeader = (skill) =>
  `<!-- AUTO-GENERATED from .agents/skills/${skill}. DO NOT EDIT. Run: node .toolkit/scripts/sync-mirror.mjs -->`

async function collectFiles(dir, base = dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) await collectFiles(full, base, out)
    else out.push(relative(base, full).split('\\').join('/'))
  }
  return out
}

function withHeader(text, skill) {
  const lines = text.split(/\r?\n/)
  if (lines[0] !== '---') return text
  const close = lines.indexOf('---', 1)
  if (close === -1) return text
  lines.splice(close + 1, 0, mirrorHeader(skill))
  return lines.join('\n')
}

// 行尾全程归一：vendored 源可能带 CRLF、检出环境各异；镜像统一 LF，比较前双方 normalize。
const normalizeEol = (text) => text.replace(/\r\n/g, '\n')

async function buildExpected() {
  const expected = new Map()
  for (const relPath of await collectFiles(sourceDir)) {
    // 仅 .md 走文本管道（头注入 + 行尾归一）；其余文件一律字节管道，防止 utf8 往返损坏二进制。
    if (relPath.endsWith('.md')) {
      const raw = await readFile(join(sourceDir, relPath), 'utf8')
      expected.set(relPath, withHeader(normalizeEol(raw), relPath.split('/')[0]))
    } else {
      expected.set(relPath, await readFile(join(sourceDir, relPath)))
    }
  }
  return expected
}

if (!existsSync(sourceDir)) {
  console.error(`sync-mirror: 找不到技能源目录 ${sourceDir}`)
  process.exit(2)
}

const expected = await buildExpected()

if (checkMode) {
  const drift = []
  if (!existsSync(mirrorDir)) {
    drift.push('镜像目录不存在：.claude/skills')
  } else {
    const actualFiles = new Set(await collectFiles(mirrorDir))
    for (const relPath of expected.keys()) {
      if (!actualFiles.has(relPath)) drift.push(`镜像缺失：${relPath}`)
    }
    for (const relPath of actualFiles) {
      if (!expected.has(relPath)) drift.push(`镜像多出：${relPath}`)
    }
    for (const relPath of expected.keys()) {
      if (!actualFiles.has(relPath)) continue
      const expectedContent = expected.get(relPath)
      const actual = await readFile(join(mirrorDir, relPath))
      const equal = Buffer.isBuffer(expectedContent)
        ? actual.equals(expectedContent)
        : normalizeEol(actual.toString('utf8')) === expectedContent
      if (!equal) drift.push(`镜像漂移：${relPath}`)
    }
  }
  if (drift.length) {
    console.error(`sync-mirror --check: 发现 ${drift.length} 处漂移（运行 node .toolkit/scripts/sync-mirror.mjs 修复）`)
    drift.forEach((line) => console.error(`- ${line}`))
    process.exit(1)
  }
  console.log(`sync-mirror --check: 镜像一致（${expected.size} 文件）`)
} else {
  await rm(mirrorDir, { recursive: true, force: true })
  for (const [relPath, content] of expected) {
    const target = join(mirrorDir, relPath)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, content, 'utf8')
  }
  console.log(`sync-mirror: 已重建镜像（${expected.size} 文件）→ .claude/skills`)
}
