#!/usr/bin/env node
// 技能移除器（全局/插件托管场景）：删除本地技能但保留引用可达性。
//   node scripts/remove-skill.mjs <技能名> [--purge]
// 默认把技能登记进 externalSkills（语义：运行时由宿主全局副本/插件提供，校验按外部提供放行）；
// --purge 表示彻底移除不登记（引用会随后续校验报错，慎用）。
// 原子步骤：成对删除 .agents/.claude → roster/vendored 更新 → externalSkills 登记或跳过 → 镜像重建 → 校验。
import { rm } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const [name, ...flags] = process.argv.slice(2)
const purge = flags.includes('--purge')

if (!name) {
  console.error('用法：node scripts/remove-skill.mjs <技能名> [--purge]')
  process.exit(2)
}

const toolkitPath = join(root, 'toolkit.json')
const configPath = join(root, '.toolkit', 'ai-guidance.config.mjs')
const toolkit = JSON.parse(await readFileSync(toolkitPath, 'utf8'))

if (!toolkit.skills.includes(name)) {
  console.error(`remove-skill: ${name} 不在 toolkit.json roster 中`)
  process.exit(2)
}
for (const dir of [join(root, '.agents', 'skills', name), join(root, '.claude', 'skills', name)]) {
  if (existsSync(dir)) await rm(dir, { recursive: true, force: true })
}
toolkit.skills = toolkit.skills.filter((s) => s !== name)
if (toolkit.vendored) delete toolkit.vendored[name]
await writeFile(toolkitPath, JSON.stringify(toolkit, null, 2) + '\n', 'utf8')

if (!purge) {
  const config = readFileSync(configPath, 'utf8')
  const rewritten = config.replace(/externalSkills:\s*\[[^\]]*\]/, (m) => {
    const current = m.slice(m.indexOf('[') + 1, m.lastIndexOf(']')).split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
    if (current.includes(name)) return m
    current.push(name)
    return `externalSkills: [${current.map((s) => `'${s}'`).join(', ')}]`
  })
  await writeFile(configPath, rewritten, 'utf8')
  console.log(`remove-skill: ${name} 已登记 externalSkills（运行时由全局/插件提供）`)
} else {
  console.log(`remove-skill: ${name} 彻底移除（未登记外部提供）`)
}

const mirror = spawnSync('node', [join(root, '.toolkit', 'scripts', 'sync-mirror.mjs')], { encoding: 'utf8' })
console.log(mirror.stdout.trim() || mirror.stderr.trim())
const check = spawnSync('node', [join(root, '.toolkit', 'scripts', 'check-ai-guidance.mjs'), '--root', '.', '--strict'], { encoding: 'utf8' })
console.log(check.stdout.trim() || check.stderr.trim())
console.log(`\nremove-skill 完成。后续：提交（含镜像删除）${purge ? '；注意剩余引用会在校验中暴露' : '；宿主需具备该技能的全局副本或插件'}`)
process.exit(check.status === 0 ? 0 : 1)
