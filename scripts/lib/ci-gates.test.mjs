import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repository = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const workflowPath = join(repository, '.github/workflows/ci.yml')
const readmeText = readFileSync(join(repository, 'README.md'), 'utf8')
const installText = readFileSync(join(repository, 'docs/operations/INSTALL.md'), 'utf8')
const policyMarker = 'release-policy: publication paused pending distribution-policy clearance'
const singleQuote = String.fromCharCode(39)

const parseScalar = (value) => {
  const trimmed = value.trim()
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed.slice(1, -1).split(',').map((entry) => parseScalar(entry)).filter((entry) => entry !== '')
  }
  if (/^-?\d+$/.test(trimmed)) return Number(trimmed)
  if (trimmed.startsWith(singleQuote) && trimmed.endsWith(singleQuote) && trimmed.length >= 2) return trimmed.slice(1, -1)
  return trimmed
}

const parseWorkflow = (text) => {
  const lines = []
  for (const raw of text.split(/\r?\n/)) {
    const content = raw.replace(/^\s+/, '').replace(/\s+$/, '')
    if (content === '' || content.startsWith('#')) continue
    lines.push({ content, indent: raw.length - raw.replace(/^ +/, '').length })
  }
  let position = 0
  const parseLiteral = (indent) => {
    const collected = []
    while (position < lines.length && lines[position].indent >= indent) {
      collected.push(lines[position].content)
      position += 1
    }
    return collected.join('\n') + '\n'
  }
  const parseSequence = (indent) => {
    const items = []
    while (position < lines.length && lines[position].indent === indent && lines[position].content.startsWith('- ')) {
      const rest = lines[position].content.slice(2)
      if (rest.includes(':')) {
        lines[position] = { content: rest, indent: indent + 2 }
        items.push(parseMapping(indent + 2))
      } else {
        position += 1
        items.push(parseScalar(rest))
      }
    }
    return items
  }
  const parseBlock = (indent) => {
    if (position >= lines.length || lines[position].indent !== indent) return null
    if (lines[position].content.startsWith('- ')) return parseSequence(indent)
    return parseMapping(indent)
  }
  const parseMapping = (indent) => {
    const mapping = {}
    while (position < lines.length && lines[position].indent === indent && !lines[position].content.startsWith('- ')) {
      const separator = lines[position].content.indexOf(':')
      const key = lines[position].content.slice(0, separator)
      if (key in mapping) throw new Error('重复键拒绝：' + key)
      const value = lines[position].content.slice(separator + 1).trim()
      position += 1
      const childIndent = position < lines.length ? lines[position].indent : indent
      if (value === '|') {
        mapping[key] = parseLiteral(childIndent)
      } else if (value === '') {
        if (childIndent > indent) mapping[key] = parseBlock(childIndent)
        else mapping[key] = null
      } else {
        mapping[key] = parseScalar(value)
      }
    }
    return mapping
  }
  const workflow = parseBlock(0)
  if (position < lines.length) throw new Error('顶层未消费行拒绝：' + lines[position].content)
  return workflow
}

const loadWorkflow = () => parseWorkflow(readFileSync(workflowPath, 'utf8'))

test('快速门禁：PR/main 触发，Node22/25 × ubuntu/windows，Git Bash 下四条快速命令', () => {
  const workflow = loadWorkflow()
  const triggers = workflow.on
  assert.deepEqual(triggers.push, { branches: ['main'], tags: ['v*'] })
  assert.deepEqual(triggers.pull_request, { branches: ['main'] })
  assert.deepEqual(Object.keys(triggers).sort(), ['pull_request', 'push'])
  assert.equal(workflow.permissions.contents, 'read')
  const gate = workflow.jobs.gate
  assert.equal(gate['runs-on'], '${{ matrix.os }}')
  assert.deepEqual(gate.strategy.matrix.os, ['ubuntu-latest', 'windows-latest'])
  assert.deepEqual(gate.strategy.matrix['node-version'], [22, 25], 'Node20 明确不保证（2026-10-02 用户裁决）：工具链矩阵为已实证的 22/25 两支')
  const setup = gate.steps.find((step) => step.uses === 'actions/setup-node@v4')
  assert.equal(setup.with['node-version'], '${{ matrix.node-version }}')
  const runs = gate.steps.filter((step) => step.run)
  assert.deepEqual(runs.map((step) => step.run), [
    'node --test scripts/lib/*.test.mjs',
    'node scripts/build-starter.mjs --check',
    'node .toolkit/scripts/check-ai-guidance.mjs --root . --strict',
    'node .toolkit/scripts/sync-mirror.mjs --check',
  ])
  for (const step of runs) assert.equal(step.shell, 'bash', '命令须显式 Git Bash：' + step.run)
  assert.ok(readmeText.includes('Node 20 不作兼容保证'), 'README 须声明 Node 20 不作兼容保证（批 L 用户裁决）')
  assert.ok(installText.includes('CDP 桥另需 Node ≥22'), 'INSTALL 须保留 CDP 桥 Node ≥22 要求')
})

test('公开发布暂停：独立 release-policy 无条件非零，release 双前置且独占写权限，PR 不发布', () => {
  const workflow = loadWorkflow()
  const triggers = workflow.on
  assert.equal(triggers.pull_request.tags, undefined, 'PR 触发不得带 tag 条件')
  const policy = workflow.jobs['release-policy']
  assert.equal(policy['continue-on-error'], undefined, 'release-policy job 不得 continue-on-error')
  assert.equal(policy.if, 'startsWith(github.ref, ' + singleQuote + 'refs/tags/v' + singleQuote + ')')
  assert.equal(policy.environment, undefined)
  assert.equal(policy.permissions, undefined)
  assert.equal(policy.needs, undefined)
  const policySteps = policy.steps.filter((step) => step.run)
  assert.equal(policySteps.length, 1)
  assert.equal(policySteps[0].if, undefined, '暂停步不得带条件开关')
  assert.equal(policySteps[0]['continue-on-error'], undefined, '暂停步不得 continue-on-error')
  assert.equal(policySteps[0].run, 'echo ' + singleQuote + policyMarker + singleQuote + '\nexit 1\n', '暂停 run 须精确为两行 marker echo + exit 1，防条件退出假绿')
  const release = workflow.jobs.release
  assert.deepEqual(release.needs, ['gate', 'release-policy'])
  assert.equal(release.if, 'startsWith(github.ref, ' + singleQuote + 'refs/tags/v' + singleQuote + ')')
  assert.deepEqual(release.permissions, { contents: 'write' })
  assert.equal(workflow.jobs.gate.permissions, undefined)
  assert.equal(release['continue-on-error'], undefined, 'release job 不得 continue-on-error')
  for (const [index, step] of release.steps.entries()) {
    assert.equal(step['continue-on-error'], undefined, 'release step 不得 continue-on-error：#' + index)
    assert.equal(step.if, undefined, 'release step 不得自带条件开关：#' + index)
  }
  for (const [name, job] of Object.entries(workflow.jobs)) {
    if (name === 'release') continue
    assert.equal(job.permissions, undefined, '仅 release 可声明权限：' + name)
  }
  const triggerKeys = Object.keys(triggers).join(',')
  assert.equal(triggerKeys.includes('workflow_dispatch') || triggerKeys.includes('schedule'), false, '不得新增手动/定时开关')
})

test('暂停脚本真实执行：Git Bash 回放输出暂停标记且非零退出', async () => {
  const workflow = loadWorkflow()
  const runText = workflow.jobs['release-policy'].steps.find((step) => step.run).run
  const venue = await mkdtemp(join(tmpdir(), 'ci-policy-'))
  try {
    const replay = spawnSync('bash', ['-c', runText], { encoding: 'utf8', cwd: venue })
    assert.notEqual(replay.status, 0, '暂停脚本必须非零退出')
    assert.ok(replay.stdout.includes(policyMarker), '退出前必须先输出暂停标记：' + replay.stdout + replay.stderr)
    assert.equal(replay.stderr.includes('gh '), false, '本地回放不得触发真实 gh 调用')
  } finally {
    await rm(venue, { recursive: true, force: true })
  }
})

test('提取器 fail-fast：顶层未消费行与重复键拒绝而非静默', () => {
  assert.throws(() => parseWorkflow('jobs:\n  a:\n    runs-on: x\n   b: 2'), /未消费/)
  assert.throws(() => parseWorkflow('a: 1\na: 2'), /重复键/)
})
