import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const toolkit = JSON.parse(readFileSync(resolve(root, 'toolkit.json'), 'utf8'))
const routing = readFileSync(resolve(root, '.agents/skills/project-workflow/references/task-routing.md'), 'utf8')

// 实名映射：路由表用调用名，roster/目录用 vendored 目录名，判定时两者任一命中即可达。
const ROUTING_ALIASES = {
  'taste-skill': ['design-taste-frontend'],
  'react-best-practices': ['vercel-react-best-practices'],
}

// 显式豁免清单：不进 agent 路由表属已批准裁定（issue #10 引用审计附录），新增须附理由。
const ROUTING_EXEMPTIONS = {
  'grill-me': '用户直调/工作流内部调用，非 agent 路由入口',
  grilling: '协议本体，被 grill-me/project-profile 内嵌引用',
  'ui-ux-pro-max': 'design-task 内部引擎，单一父级引用为有意设计',
}

test('roster 中每个技能在 task-routing.md 可达或持有显式豁免', () => {
  const unreachable = toolkit.skills.filter(
    (skill) => ![skill, ...(ROUTING_ALIASES[skill] ?? [])].some((name) => routing.includes(name)),
  )
  const unexempted = unreachable.filter((skill) => !(skill in ROUTING_EXEMPTIONS))
  assert.deepEqual(
    unexempted,
    [],
    `以下技能既不出现在 task-routing.md 也不在豁免清单（不可达技能，需补路由行或补豁免理由）：${unexempted.join('、')}`,
  )
  const stale = Object.keys(ROUTING_EXEMPTIONS).filter(
    (skill) => !toolkit.skills.includes(skill) || !unreachable.includes(skill),
  )
  assert.deepEqual(
    stale,
    [],
    `过期豁免（技能已可达或已不在 roster，请从豁免清单删除）：${stale.join('、')}`,
  )
})

test('toolkit.json skills 数组与 .agents/skills/ 实际目录一致', () => {
  const onDisk = readdirSync(resolve(root, '.agents/skills'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
  const roster = new Set(toolkit.skills)
  const dirs = new Set(onDisk)
  const onlyRoster = toolkit.skills.filter((skill) => !dirs.has(skill))
  const onlyDirs = onDisk.filter((skill) => !roster.has(skill))
  assert.deepEqual(onlyRoster, [], `roster 声明但目录缺失（补 vendored 或删 roster 项）：${onlyRoster.join('、')}`)
  assert.deepEqual(onlyDirs, [], `目录存在但未登记进 roster（补登记或删目录）：${onlyDirs.join('、')}`)
})
