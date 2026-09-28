import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const zh = readFileSync(resolve(root, 'README.md'), 'utf8')
const en = readFileSync(resolve(root, 'README.en.md'), 'utf8')

// 提取规则与两侧结构无关：$命令 形式的技能引用全文扫描；
// 反引号命令只认单行内联代码（`[^`\n]+` 不会吞多行围栏块），
// 且仅取「运行器 + 脚本/包名」两词，丢弃 --flag 与 <占位符> 等译文差异。
const COMMAND_RUNNERS = new Set(['node', 'npx', 'npm', 'pnpm', 'yarn', 'bun', 'python', 'py', 'git'])

const extractSkillRefs = (text) => new Set([...text.matchAll(/\$[A-Za-z0-9][\w:-]*/g)].map((m) => m[0]))

const extractCommandNames = (text) => {
  const commands = new Set()
  for (const match of text.matchAll(/`([^`\n]+)`/g)) {
    const tokens = match[1].trim().split(/\s+/)
    if (tokens.length > 1 && COMMAND_RUNNERS.has(tokens[0])) commands.add(`${tokens[0]} ${tokens[1]}`)
  }
  return commands
}

const assertSameSet = (label, zhSet, enSet) => {
  const missingEn = [...zhSet].filter((item) => !enSet.has(item))
  const missingZh = [...enSet].filter((item) => !zhSet.has(item))
  assert.deepEqual(
    { missingEn, missingZh },
    { missingEn: [], missingZh: [] },
    `${label} 集合不一致——README.en.md 缺失：${missingEn.join('、') || '无'}；README.md 缺失：${missingZh.join('、') || '无'}`,
  )
}

test('双语文档 README 的 $命令 技能引用集合一致', () => {
  assertSameSet('$命令 技能引用', extractSkillRefs(zh), extractSkillRefs(en))
})

test('双语文档 README 的反引号命令名集合一致', () => {
  assertSameSet('反引号命令名', extractCommandNames(zh), extractCommandNames(en))
})
