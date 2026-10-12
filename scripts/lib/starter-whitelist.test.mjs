// 票 12 实现轮：build-starter 白名单分发边界（隔离 fixture，不碰真实消费项目）。
// 覆盖：声明外不随发、声明内保留、缓存排除、MCP 精确登记、种子保持、
// 非法声明/越界拒绝、--check 声明有效性。fixture 以 overlay 模式安装（跳过三连校验，
// 只测复制边界；干净副本 + 三连校验由 starter-builder.test.mjs 在真实仓覆盖）。
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve, sep } from 'node:path'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const builder = join(root, 'scripts/build-starter.mjs')

const baseToolkit = {
  version: '0.0.0-test',
  skills: [],
  starter: { runtime: ['AGENTS.md', 'docs', '.toolkit', '.mcp.json', 'tools/mcp/chrome-devtools-mcp', 'tools/mcp/codex-mcp-snippet.toml'] },
  distExcludes: ['docs/wayfinder', '.gitattributes'],
  skipIfExists: [],
}

// baseToolkit 声明的每个条目在 fixture 里都必须存在（缺声明项 = 构建失败，这是被测行为）
const declaredDefaults = {
  'AGENTS.md': 'entry',
  'docs/.keep': 'x',
  '.toolkit/.keep': 'x',
  '.mcp.json': JSON.stringify({ mcpServers: { x: { command: 'node', args: ['tools/mcp/chrome-devtools-mcp/LICENSE'] } } }),
  'tools/mcp/chrome-devtools-mcp/LICENSE': 'Apache-2.0',
  'tools/mcp/chrome-devtools-mcp/entry.js': 'console.log("fixture entry")\n',
  'tools/mcp/codex-mcp-snippet.toml': '[mcp_servers.x]\ncommand = "node"\nargs = ["tools/mcp/chrome-devtools-mcp/entry.js", "--channel=stable"]\n',
}

const makeFixture = (toolkit, files = {}, opts = {}) => {
  const src = mkdtempSync(join(tmpdir(), 'wl-src-'))
  mkdirSync(join(src, 'scripts'), { recursive: true })
  copyFileSync(builder, join(src, 'scripts/build-starter.mjs'))
  writeFileSync(join(src, 'toolkit.json'), JSON.stringify(toolkit, null, 2))
  const base = opts.noDefaults ? {} : declaredDefaults
  for (const [rel, content = 'content'] of Object.entries({ ...base, ...files })) {
    const full = join(src, rel)
    mkdirSync(dirname(full), { recursive: true })
    writeFileSync(full, content)
  }
  return src
}

// overlay 安装：目标预置 .keep 非空 → 走覆盖分支，退出前不跑三连校验
const installOverlay = (src, label) => {
  const target = mkdtempSync(join(tmpdir(), `wl-tgt-${label}-`))
  writeFileSync(join(target, '.keep'), '')
  overlayTargets.push(target)
  const r = spawnSync(process.execPath, [join(src, 'scripts/build-starter.mjs'), '--target', target, '--accept-mcp'], { encoding: 'utf8' })
  return { r, target }
}

// 批 P 退回修正：安装目标在进程退出时统一清扫（此前 finally 仅删 src，目标泄漏）。
const overlayTargets = []
process.on('exit', () => { for (const target of overlayTargets) rmSync(target, { recursive: true, force: true }) })

const runCheck = (src) => spawnSync(process.execPath, [join(src, 'scripts/build-starter.mjs'), '--check'], { encoding: 'utf8' })

test('声明外文件不随发，声明内合法文件保留，明确排除项不随发', () => {
  const src = makeFixture(baseToolkit, {
    'AGENTS.md': 'entry',
    'docs/rules/a.md': 'rule',
    'docs/wayfinder/decision.md': 'internal',
    '.toolkit/profile-state.json': JSON.stringify({ status: 'draft' }),
    '.mcp.json': JSON.stringify({ mcpServers: { x: { command: 'node', args: ['tools/mcp/chrome-devtools-mcp/LICENSE'] } } }),
    'tools/mcp/chrome-devtools-mcp/LICENSE': 'Apache-2.0',
    'tools/mcp/chrome-devtools-mcp/package.json': '{}',
    'tools/mcp/codex-mcp-snippet.toml': '[mcp_servers.x]\ncommand = "node"\nargs = ["tools/mcp/chrome-devtools-mcp/entry.js", "--channel=stable"]\n',
    'maintenance-note.md': '维护便签（未声明）',
    'scripts/dev-tool.mjs': '维护工具（未声明目录）',
    'tools/mcp/undeclared-extra.txt': 'tools 内未声明文件',
  })
  try {
    const { r, target } = installOverlay(src, 'scope')
    assert.equal(r.status, 0, r.stdout + r.stderr)
    // 声明外：不随发
    for (const absent of ['maintenance-note.md', 'scripts/dev-tool.mjs', 'tools/mcp/undeclared-extra.txt', 'toolkit.json']) {
      assert.equal(existsSync(join(target, absent)), false, `${absent} 未声明，不应随发`)
    }
    // 声明内合法文件：保留
    for (const present of ['AGENTS.md', 'docs/rules/a.md', '.mcp.json', 'tools/mcp/chrome-devtools-mcp/LICENSE', 'tools/mcp/chrome-devtools-mcp/package.json', 'tools/mcp/codex-mcp-snippet.toml']) {
      assert.equal(existsSync(join(target, present)), true, `${present} 已声明，应随发`)
    }
    // 明确排除：docs/wayfinder（distExcludes 在声明范围内排除）
    assert.equal(existsSync(join(target, 'docs/wayfinder')), false, 'docs/wayfinder 应被 distExcludes 排除')
    assert.equal(existsSync(join(target, 'docs/rules/a.md')), true, '排除 wayfinder 不得牵连声明内其他 docs 文件')
  } finally {
    rmSync(src, { recursive: true, force: true })
  }
})

test('缓存/临时物按段过滤：不随发且源仓文件不删除', () => {
  const src = makeFixture(baseToolkit, {
    'docs/rules/keep.md': 'x',
    'docs/__pycache__/junk.pyc': 'pyc',
    'docs/rules/cache.pyc': 'pyc',
    'docs/rules/.DS_Store': 'ds',
    'docs/.stitch/workspace.bin': 'stitch',
    '.agents-does-not-exist': '',
  })
  // 白名单目录内（模拟技能脚本缓存）
  mkdirSync(join(src, '.toolkit/__pycache__'), { recursive: true })
  writeFileSync(join(src, '.toolkit/__pycache__/c.pyc'), 'pyc')
  try {
    const { r, target } = installOverlay(src, 'cache')
    assert.equal(r.status, 0, r.stdout + r.stderr)
    assert.equal(existsSync(join(target, 'docs/__pycache__')), false, '__pycache__ 目录不应随发')
    assert.equal(existsSync(join(target, 'docs/rules/cache.pyc')), false, '*.pyc 不应随发')
    assert.equal(existsSync(join(target, 'docs/rules/.DS_Store')), false, '.DS_Store 不应随发')
    assert.equal(existsSync(join(target, 'docs/.stitch')), false, '.stitch 不应随发')
    assert.equal(existsSync(join(target, '.toolkit/__pycache__')), false, '声明目录内的缓存同样过滤')
    assert.equal(existsSync(join(target, 'docs/rules/keep.md')), true, '普通文件不受缓存过滤牵连')
    // 源仓不删除
    assert.equal(existsSync(join(src, 'docs/__pycache__/junk.pyc')), true, '源仓缓存不得被删除')
    assert.equal(existsSync(join(src, 'docs/.stitch/workspace.bin')), true, '源仓临时物不得被删除')
  } finally {
    rmSync(src, { recursive: true, force: true })
  }
})

test('种子分发：首装 maturity 重置为未评估种子，其余字段语义保持', () => {
  const seed = JSON.stringify({ status: 'draft', templateSelection: { status: 'pending' } })
  const src = makeFixture(baseToolkit, { '.toolkit/profile-state.json': seed })
  try {
    const { r, target } = installOverlay(src, 'seed')
    assert.equal(r.status, 0, r.stdout + r.stderr)
    const shipped = JSON.parse(readFileSync(join(target, '.toolkit/profile-state.json'), 'utf8'))
    assert.deepEqual(shipped.maturity, { status: 'unformed', confidence: 'low', evidence: [], assessedAt: null }, '首装不得继承源仓成熟度既有事实（批 I 契约）')
    const { maturity, ...rest } = shipped
    assert.deepEqual(rest, JSON.parse(seed), '除 maturity 外字段语义保持（draft/pending）')
  } finally {
    rmSync(src, { recursive: true, force: true })
  }
})

test('非法声明拒绝：绝对路径与父级穿越使构建失败，不产出半成品', () => {
  for (const bad of ['C:/Windows/System32', '/etc', '../outside-root', 'docs/../../escape']) {
    const src = makeFixture({ ...baseToolkit, starter: { runtime: ['AGENTS.md', bad] } }, { 'AGENTS.md': 'x' })
    try {
      const { r, target } = installOverlay(src, 'bad')
      assert.notEqual(r.status, 0, `声明 ${bad} 应使构建失败`)
      assert.ok((r.stderr || '').includes('runtime') || (r.stderr || '').includes('声明'), `错误应指明 runtime 声明问题：${r.stderr}`)
      assert.equal(existsSync(join(target, 'AGENTS.md')), false, '失败时不得留下半成品复制（installer 事实写入除外）')
    } finally {
      rmSync(src, { recursive: true, force: true })
    }
  }
})

// 链接越界反例（票 12 补修一）：junction 创建失败仅限已知权限错误码 → t.skip；
// 其他异常照常失败，不得 catch 任意错误后伪装通过。
const makeJunction = (target, path) => {
  try {
    symlinkSync(target, path, 'junction')
    return true
  } catch (err) {
    if (['EPERM', 'EACCES', 'EINVAL', 'ENOTSUP', 'UNKNOWN'].includes(err.code)) return false
    throw err
  }
}

test('祖先目录为链接：--check 与安装都拒绝越界读取，不产半成品', (t) => {
  // 声明 tools/mcp/...，但 tools 本身是指向源根外的 junction —— 词法路径仍在根内，只有 realpath 能识破
  const outside = mkdtempSync(join(tmpdir(), 'wl-outside-anc-'))
  mkdirSync(join(outside, 'mcp/chrome-devtools-mcp'), { recursive: true })
  writeFileSync(join(outside, 'mcp/chrome-devtools-mcp/LICENSE'), 'ROOT-ESCAPE')
  writeFileSync(join(outside, 'mcp/codex-mcp-snippet.toml'), '# escape')
  const src = makeFixture(baseToolkit, {
    'AGENTS.md': 'x',
    'docs/.keep': 'x',
    '.toolkit/.keep': 'x',
    '.mcp.json': JSON.stringify({ mcpServers: { x: { command: 'node', args: ['tools/mcp/chrome-devtools-mcp/LICENSE'] } } }),
  }, { noDefaults: true })
  try {
    if (!makeJunction(outside, join(src, 'tools'))) return t.skip('本机无法创建 junction（权限限制），此反例未验证')
    const check = runCheck(src)
    assert.notEqual(check.status, 0, '祖先 junction 应使 --check 失败')
    assert.ok((check.stderr || '').includes('越') || (check.stderr || '').includes('链接'), `应指明越界/链接：${check.stderr}`)
    const { r, target } = installOverlay(src, 'anc')
    assert.notEqual(r.status, 0, '祖先 junction 应使安装失败')
    assert.equal(existsSync(join(target, 'tools')), false, '不得复制根外材料')
    assert.equal(existsSync(join(target, 'AGENTS.md')), false, '预检失败不得复制受管文件')
    assert.equal(existsSync(join(target, '.toolkit/manifest.json')), false, '预检失败不得写安装事实')
  } finally {
    rmSync(src, { recursive: true, force: true })
    rmSync(outside, { recursive: true, force: true })
  }
})

test('声明本身为链接：--check 与安装都拒绝', (t) => {
  const outside = mkdtempSync(join(tmpdir(), 'wl-outside-decl-'))
  writeFileSync(join(outside, 'secret.md'), 'ROOT-ESCAPE')
  const src = makeFixture({ ...baseToolkit, starter: { runtime: [...baseToolkit.starter.runtime, 'linked-entry'] } }, {})
  try {
    if (!makeJunction(outside, join(src, 'linked-entry'))) return t.skip('本机无法创建 junction（权限限制），此反例未验证')
    const check = runCheck(src)
    assert.notEqual(check.status, 0, '声明本身为链接应使 --check 失败')
    const { r, target } = installOverlay(src, 'decl')
    assert.notEqual(r.status, 0, '声明本身为链接应使安装失败')
    assert.equal(existsSync(join(target, 'linked-entry')), false, '不得复制根外材料')
    assert.equal(existsSync(join(target, '.toolkit/manifest.json')), false, '预检失败不得写安装事实')
  } finally {
    rmSync(src, { recursive: true, force: true })
    rmSync(outside, { recursive: true, force: true })
  }
})

test('声明目录内的链接：递归收录时拒绝，--check 与安装一致', (t) => {
  const outside = mkdtempSync(join(tmpdir(), 'wl-outside-inner-'))
  writeFileSync(join(outside, 'secret.txt'), 'ROOT-ESCAPE')
  const src = makeFixture(baseToolkit, { 'docs/rules/keep.md': 'x' })
  try {
    if (!makeJunction(outside, join(src, 'docs/rules/linked-inside'))) return t.skip('本机无法创建 junction（权限限制），此反例未验证')
    const check = runCheck(src)
    assert.notEqual(check.status, 0, '声明范围内的链接应使 --check 失败')
    assert.ok((check.stderr || '').includes('链接') || (check.stderr || '').includes('symbolic'), `应指明链接：${check.stderr}`)
    const { r, target } = installOverlay(src, 'inner')
    assert.notEqual(r.status, 0, '声明范围内的链接应使安装失败')
    assert.equal(existsSync(join(target, 'docs/rules/linked-inside')), false, '不得复制根外材料')
    assert.equal(existsSync(join(target, '.toolkit/manifest.json')), false, '预检失败不得写安装事实')
  } finally {
    rmSync(src, { recursive: true, force: true })
    rmSync(outside, { recursive: true, force: true })
  }
})

test('--check 校验声明有效性：越界/绝对路径报错', () => {
  const badDecl = makeFixture({ ...baseToolkit, starter: { runtime: ['AGENTS.md', '../escape'] } }, {})
  try {
    const bad1 = runCheck(badDecl)
    assert.notEqual(bad1.status, 0, '越界声明应使 --check 失败')
    assert.ok((bad1.stderr || '').includes('runtime'), `应指明 runtime 声明问题：${bad1.stderr}`)
  } finally {
    rmSync(badDecl, { recursive: true, force: true })
  }
})

// 票 12 补修二：MCP 引用校验基于最终复制集合（缺失/存在但未声明/被排除/正常），--check 与安装双路径。
const mcpFixture = (ref, extra = {}, toolkit = baseToolkit) =>
  makeFixture(toolkit, { '.mcp.json': JSON.stringify({ mcpServers: { x: { command: 'node', args: [ref] } } }), ...extra })

test('MCP 引用：文件缺失 → --check 与安装都失败', () => {
  const src = mcpFixture('tools/mcp/chrome-devtools-mcp/missing-entry.js')
  try {
    assert.notEqual(runCheck(src).status, 0, '缺失引用应使 --check 失败')
    const { r, target } = installOverlay(src, 'mcp-missing')
    assert.notEqual(r.status, 0, '缺失引用应使安装失败（安装路径也必须校验）')
    assert.equal(existsSync(join(target, '.toolkit/manifest.json')), false, '失败不得写安装事实')
  } finally {
    rmSync(src, { recursive: true, force: true })
  }
})

test('MCP 引用：文件存在但未声明 → 不在最终分发集合，双路径失败', () => {
  const src = mcpFixture('tools/mcp/extra-entry/entry.js', { 'tools/mcp/extra-entry/entry.js': 'exists-but-undeclared' })
  try {
    const check = runCheck(src)
    assert.notEqual(check.status, 0, '存在但未声明的引用应使 --check 失败')
    assert.ok((check.stderr || '').includes('分发集合'), `应指明未进入分发集合：${check.stderr}`)
    const { r, target } = installOverlay(src, 'mcp-undeclared')
    assert.notEqual(r.status, 0, '存在但未声明的引用应使安装失败')
    assert.equal(existsSync(join(target, '.toolkit/manifest.json')), false, '失败不得写安装事实')
  } finally {
    rmSync(src, { recursive: true, force: true })
  }
})

test('MCP 引用：已声明但被 distExcludes 排除 → 不在最终分发集合，双路径失败', () => {
  const src = mcpFixture(
    'tools/mcp/chrome-devtools-mcp/build/entry.js',
    { 'tools/mcp/chrome-devtools-mcp/build/entry.js': 'excluded-content' },
    { ...baseToolkit, distExcludes: [...baseToolkit.distExcludes, 'tools/mcp/chrome-devtools-mcp/build'] },
  )
  try {
    const check = runCheck(src)
    assert.notEqual(check.status, 0, '被排除的引用应使 --check 失败')
    const { r, target } = installOverlay(src, 'mcp-excluded')
    assert.notEqual(r.status, 0, '被排除的引用应使安装失败')
    assert.equal(existsSync(join(target, 'tools/mcp/chrome-devtools-mcp/build')), false, '被排除内容不得落地')
  } finally {
    rmSync(src, { recursive: true, force: true })
  }
})

test('MCP 引用：正常随发 → --check 通过，安装成功且引用文件与 .mcp.json 同时落地', () => {
  const src = mcpFixture('tools/mcp/chrome-devtools-mcp/LICENSE')
  try {
    assert.equal(runCheck(src).status, 0, '正常引用应通过 --check')
    const { r, target } = installOverlay(src, 'mcp-ok')
    assert.equal(r.status, 0, r.stdout + r.stderr)
    assert.equal(existsSync(join(target, '.mcp.json')), true, '.mcp.json 应落地')
    assert.equal(existsSync(join(target, 'tools/mcp/chrome-devtools-mcp/LICENSE')), true, '被引用文件应随发')
  } finally {
    rmSync(src, { recursive: true, force: true })
  }
})

// 批 P（票 12 残余 snippet 消费接线/票 16 机制范围）：codex-mcp-snippet.toml 的本地
// tools/ 引用与 .mcp.json 同边界——仅 TOML 引用的入口缺失/未声明/被排除/越界、片段
// 坏格式不得静默通过；正例在独占消费 fixture 安装后按片段 args 从副本 cwd 解析入口
// 且副本内容与源一致（SHA-256）。仅解析本仓片段契约格式，非通用 TOML 解析器。
const snippetFixture = (snippet, extra = {}, toolkit = baseToolkit) =>
  makeFixture(toolkit, { 'tools/mcp/codex-mcp-snippet.toml': snippet, ...extra })

const validSnippet = (ref) =>
  `[mcp_servers.chrome-devtools]\ncommand = "node"\nargs = ["${ref}", "--channel=stable"]\n`

test('TOML 片段引用：入口缺失 → --check 与安装都失败', () => {
  const src = snippetFixture(validSnippet('tools/mcp/chrome-devtools-mcp/missing-entry.js'))
  try {
    const check = runCheck(src)
    assert.notEqual(check.status, 0, 'TOML 缺失引用应使 --check 失败')
    assert.ok((check.stderr || '').includes('缺失'), `应指明引用缺失：${check.stderr}`)
    const { r, target } = installOverlay(src, 'toml-missing')
    assert.notEqual(r.status, 0, 'TOML 缺失引用应使安装失败')
    assert.equal(existsSync(join(target, '.toolkit/manifest.json')), false, '失败不得写安装事实')
  } finally {
    rmSync(src, { recursive: true, force: true })
  }
})

test('TOML 片段引用：存在但未声明 → 不在最终分发集合，双路径失败', () => {
  const src = snippetFixture(validSnippet('tools/mcp/extra-entry/entry.js'), { 'tools/mcp/extra-entry/entry.js': 'exists-but-undeclared' })
  try {
    const check = runCheck(src)
    assert.notEqual(check.status, 0, '存在但未声明的 TOML 引用应使 --check 失败')
    assert.ok((check.stderr || '').includes('分发集合'), `应指明未进入分发集合：${check.stderr}`)
    const { r, target } = installOverlay(src, 'toml-undeclared')
    assert.notEqual(r.status, 0, '存在但未声明的 TOML 引用应使安装失败')
    assert.equal(existsSync(join(target, '.toolkit/manifest.json')), false, '失败不得写安装事实')
  } finally {
    rmSync(src, { recursive: true, force: true })
  }
})

test('TOML 片段引用：已声明但被 distExcludes 排除 → 双路径失败', () => {
  const src = snippetFixture(
    validSnippet('tools/mcp/chrome-devtools-mcp/build/entry.js'),
    { 'tools/mcp/chrome-devtools-mcp/build/entry.js': 'excluded-content' },
    { ...baseToolkit, distExcludes: [...baseToolkit.distExcludes, 'tools/mcp/chrome-devtools-mcp/build'] },
  )
  try {
    const check = runCheck(src)
    assert.notEqual(check.status, 0, '被排除的 TOML 引用应使 --check 失败')
    const { r, target } = installOverlay(src, 'toml-excluded')
    assert.notEqual(r.status, 0, '被排除的 TOML 引用应使安装失败')
    assert.equal(existsSync(join(target, 'tools/mcp/chrome-devtools-mcp/build')), false, '被排除内容不得落地')
  } finally {
    rmSync(src, { recursive: true, force: true })
  }
})

test('TOML 片段引用：越界引用（../ 根外相对路径）→ 双路径失败', () => {
  const src = snippetFixture(validSnippet('../escape-root/entry.js'))
  try {
    const check = runCheck(src)
    assert.notEqual(check.status, 0, '越界 TOML 引用应使 --check 失败')
    assert.ok((check.stderr || '').includes('越界'), `应指明越界引用：${check.stderr}`)
    const { r, target } = installOverlay(src, 'toml-escape')
    assert.notEqual(r.status, 0, '越界 TOML 引用应使安装失败')
    assert.equal(existsSync(join(target, '.toolkit/manifest.json')), false, '失败不得写安装事实')
  } finally {
    rmSync(src, { recursive: true, force: true })
  }
})

test('TOML 片段坏格式：无 [mcp_servers.*] 节 → 双路径失败', () => {
  const src = snippetFixture('# 只有注释，没有服务器声明的片段\n')
  try {
    assert.notEqual(runCheck(src).status, 0, '无服务器节的片段应使 --check 失败')
    const { r, target } = installOverlay(src, 'toml-noSection')
    assert.notEqual(r.status, 0, '无服务器节的片段应使安装失败')
    assert.equal(existsSync(join(target, '.toolkit/manifest.json')), false, '失败不得写安装事实')
  } finally {
    rmSync(src, { recursive: true, force: true })
  }
})

test('TOML 片段坏格式：有节但 args 不可解析 → 双路径失败', () => {
  const src = snippetFixture('[mcp_servers.chrome-devtools]\ncommand = "node"\nargs = "not-an-array"\n')
  try {
    const check = runCheck(src)
    assert.notEqual(check.status, 0, 'args 不可解析的片段应使 --check 失败')
    assert.ok((check.stderr || '').includes('args'), `应指明 args 问题：${check.stderr}`)
    const { r, target } = installOverlay(src, 'toml-badArgs')
    assert.notEqual(r.status, 0, 'args 不可解析的片段应使安装失败')
    assert.equal(existsSync(join(target, '.toolkit/manifest.json')), false, '失败不得写安装事实')
  } finally {
    rmSync(src, { recursive: true, force: true })
  }
})

test('TOML 片段正例：安装后按副本内片段 args 从副本 cwd 解析 .js 入口，片段与副本内容一致', () => {
  const entryRel = 'tools/mcp/chrome-devtools-mcp/entry.js'
  const src = snippetFixture(validSnippet(entryRel))
  try {
    assert.equal(runCheck(src).status, 0, '正常 TOML 引用应通过 --check')
    const { r, target } = installOverlay(src, 'toml-ok')
    assert.equal(r.status, 0, r.stdout + r.stderr)
    const snippetCopy = readFileSync(join(target, 'tools/mcp/codex-mcp-snippet.toml'))
    const snippetSrc = readFileSync(join(src, 'tools/mcp/codex-mcp-snippet.toml'))
    assert.equal(createHash('sha256').update(snippetCopy).digest('hex'), createHash('sha256').update(snippetSrc).digest('hex'), '副本内片段必须与源字节一致（SHA-256）')
    const argMatch = /args\s*=\s*\[\s*"([^"]+)"/.exec(snippetCopy.toString('utf8'))
    assert.ok(argMatch, '副本内片段应含可解析 args')
    const resolved = resolve(target, argMatch[1])
    assert.ok(resolved.startsWith(target + sep), '解析结果必须落在副本内，不得跨引用源仓')
    assert.ok(argMatch[1].endsWith('.js'), '正例入口应为真实 .js 入口（不再以 LICENSE 假冒 Node 入口）')
    assert.equal(existsSync(resolved), true, '按片段 args 从副本 cwd 应解析到副本内真实 .js 入口')
    const sourceHash = createHash('sha256').update(readFileSync(join(src, entryRel))).digest('hex')
    const copyHash = createHash('sha256').update(readFileSync(resolved)).digest('hex')
    assert.equal(copyHash, sourceHash, '副本入口内容须与源文件一致（SHA-256）')
  } finally {
    rmSync(src, { recursive: true, force: true })
  }
})

// 批 P 退回修正：严格片段契约反例——非字符串项/缺分隔/尾随垃圾/重复 args 掩盖/缺
// command/非 node command/首项非规范 tools 入口/未知键行均不得静默通过；双路径失败
// 且目标原有文件与文件集合逐字不变（预检失败必须发生在任何复制之前）。
const assertTargetUntouched = (target) => {
  assert.deepEqual(readdirSync(target).sort(), ['.keep'], '失败安装不得改变目标文件集合')
  assert.equal(readFileSync(join(target, '.keep'), 'utf8'), '', '失败安装不得改变目标原有文件内容')
}

test('严格契约：args 混合非字符串项 → 双路径失败且目标逐字不变', () => {
  const src = snippetFixture('[mcp_servers.chrome-devtools]\ncommand = "node"\nargs = ["tools/mcp/chrome-devtools-mcp/LICENSE", 123]\n')
  try {
    assert.notEqual(runCheck(src).status, 0, '非字符串 args 项应使 --check 失败')
    const { r, target } = installOverlay(src, 'toml-mixed')
    assert.notEqual(r.status, 0, '非字符串 args 项应使安装失败')
    assertTargetUntouched(target)
  } finally {
    rmSync(src, { recursive: true, force: true })
  }
})

test('严格契约：args 字符串间缺逗号 → 双路径失败且目标逐字不变', () => {
  const src = snippetFixture('[mcp_servers.chrome-devtools]\ncommand = "node"\nargs = ["tools/mcp/chrome-devtools-mcp/LICENSE" "tools/mcp/chrome-devtools-mcp/package.json"]\n', { 'tools/mcp/chrome-devtools-mcp/package.json': '{}' })
  try {
    assert.notEqual(runCheck(src).status, 0, '缺逗号分隔应使 --check 失败')
    const { r, target } = installOverlay(src, 'toml-nocomma')
    assert.notEqual(r.status, 0, '缺逗号分隔应使安装失败')
    assertTargetUntouched(target)
  } finally {
    rmSync(src, { recursive: true, force: true })
  }
})

test('严格契约：args 数组后尾随垃圾 → 双路径失败且目标逐字不变', () => {
  const src = snippetFixture('[mcp_servers.chrome-devtools]\ncommand = "node"\nargs = ["tools/mcp/chrome-devtools-mcp/LICENSE", "--x"] junk\n')
  try {
    assert.notEqual(runCheck(src).status, 0, '尾随垃圾应使 --check 失败')
    const { r, target } = installOverlay(src, 'toml-trail')
    assert.notEqual(r.status, 0, '尾随垃圾应使安装失败')
    assertTargetUntouched(target)
  } finally {
    rmSync(src, { recursive: true, force: true })
  }
})

test('严格契约：重复 args 行以后行掩盖前行非法引用 → 双路径失败', () => {
  const src = snippetFixture('[mcp_servers.chrome-devtools]\ncommand = "node"\nargs = ["tools/mcp/chrome-devtools-mcp/missing-entry.js"]\nargs = ["tools/mcp/chrome-devtools-mcp/LICENSE"]\n')
  try {
    assert.notEqual(runCheck(src).status, 0, '重复 args 行应使 --check 失败')
    const { r, target } = installOverlay(src, 'toml-dupargs')
    assert.notEqual(r.status, 0, '重复 args 行应使安装失败')
    assertTargetUntouched(target)
  } finally {
    rmSync(src, { recursive: true, force: true })
  }
})

test('严格契约：缺 command 行 → 双路径失败且目标逐字不变', () => {
  const src = snippetFixture('[mcp_servers.chrome-devtools]\nargs = ["tools/mcp/chrome-devtools-mcp/LICENSE", "--channel=stable"]\n')
  try {
    const check = runCheck(src)
    assert.notEqual(check.status, 0, '缺 command 应使 --check 失败')
    assert.ok((check.stderr || '').includes('command'), `应指明 command 问题：${check.stderr}`)
    const { r, target } = installOverlay(src, 'toml-nocmd')
    assert.notEqual(r.status, 0, '缺 command 应使安装失败')
    assertTargetUntouched(target)
  } finally {
    rmSync(src, { recursive: true, force: true })
  }
})

test('严格契约：command 非 node → 双路径失败且目标逐字不变', () => {
  const src = snippetFixture('[mcp_servers.chrome-devtools]\ncommand = "python"\nargs = ["tools/mcp/chrome-devtools-mcp/LICENSE", "--channel=stable"]\n')
  try {
    assert.notEqual(runCheck(src).status, 0, '非 node command 应使 --check 失败')
    const { r, target } = installOverlay(src, 'toml-badcmd')
    assert.notEqual(r.status, 0, '非 node command 应使安装失败')
    assertTargetUntouched(target)
  } finally {
    rmSync(src, { recursive: true, force: true })
  }
})

test('严格契约：首项非规范 tools 入口（裸文件名/标志）→ 双路径失败', () => {
  const src = snippetFixture('[mcp_servers.chrome-devtools]\ncommand = "node"\nargs = ["missing-entry.js", "--flag"]\n')
  try {
    const check = runCheck(src)
    assert.notEqual(check.status, 0, '首项非 tools 入口应使 --check 失败')
    assert.ok((check.stderr || '').includes('越界') || (check.stderr || '').includes('tools'), `应指明首项入口违规：${check.stderr}`)
    const { r, target } = installOverlay(src, 'toml-firstentry')
    assert.notEqual(r.status, 0, '首项非 tools 入口应使安装失败')
    assertTargetUntouched(target)
  } finally {
    rmSync(src, { recursive: true, force: true })
  }
})

test('严格契约：section 内未知键行 → 双路径失败且目标逐字不变', () => {
  const src = snippetFixture('[mcp_servers.chrome-devtools]\ncommand = "node"\nfoo = "bar"\nargs = ["tools/mcp/chrome-devtools-mcp/LICENSE", "--channel=stable"]\n')
  try {
    assert.notEqual(runCheck(src).status, 0, '未知键行应使 --check 失败')
    const { r, target } = installOverlay(src, 'toml-unknownkey')
    assert.notEqual(r.status, 0, '未知键行应使安装失败')
    assertTargetUntouched(target)
  } finally {
    rmSync(src, { recursive: true, force: true })
  }
})
