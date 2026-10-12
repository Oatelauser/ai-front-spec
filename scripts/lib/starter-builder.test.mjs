import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve, sep } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const builder = join(root, 'scripts/build-starter.mjs')
const build = (target) => spawnSync(process.execPath, [builder, '--target', target, '--accept-mcp'], { encoding: 'utf8' })

test('干净副本：distExcludes 不落地，skills 全数随发，副本内三连校验通过', async () => {
  const target = await mkdtemp(join(tmpdir(), 'starter-clean-'))
  try {
    const run = build(target)
    assert.equal(run.status, 0, run.stdout + run.stderr)
    for (const excluded of ['scripts', 'toolkit.json', 'docs/wayfinder', 'CONTRIBUTING.md', '.serena', '.github', '.gitignore', '.gitattributes']) {
      assert.equal(existsSync(join(target, excluded)), false, `${excluded} 不应随发`)
    }
    const manifest = JSON.parse(await readFile(join(target, '.toolkit/manifest.json'), 'utf8'))
    assert.equal(manifest.starterStatus, 'ready')
    const toolkit = JSON.parse(await readFile(join(root, 'toolkit.json'), 'utf8'))
    assert.equal(manifest.starterVersion, toolkit.version, '干净副本应写入 starterVersion')
    for (const skill of toolkit.skills) {
      assert.equal(existsSync(join(target, '.agents/skills', skill, 'SKILL.md')), true, `${skill} 缺 SKILL.md`)
    }
    assert.ok((await readFile(join(target, 'AGENTS.md'), 'utf8')).includes('$project-workflow'))
    assert.ok(existsSync(join(target, 'LICENSE')), 'LICENSE 应随发')
    assert.ok(existsSync(join(target, 'NOTICE')), 'NOTICE 应随发')
    // 票 12：MCP 消费材料精确登记随发；缓存/临时物不随发
    assert.ok(existsSync(join(target, '.mcp.json')), '.mcp.json 应随发')
    assert.ok(existsSync(join(target, 'tools/mcp/chrome-devtools-mcp/LICENSE')), 'chrome-devtools-mcp LICENSE 应随发')
    assert.ok(existsSync(join(target, 'tools/mcp/codex-mcp-snippet.toml')), 'codex-mcp-snippet.toml 应随发')
    assert.equal(existsSync(join(target, '.agents/skills/ui-ux-pro-max/scripts/__pycache__')), false, '__pycache__ 不应随发')
    assert.equal(existsSync(join(target, '.claude/skills/ui-ux-pro-max/scripts/__pycache__')), false, '镜像侧 __pycache__ 不应随发')
  } finally {
    await rm(target, { recursive: true, force: true })
  }
})

test('已有项目安全接入：用户文件保留，缺失受管文件写入，MCP 显式采纳', async () => {
  const target = await mkdtemp(join(tmpdir(), 'starter-overlay-'))
  try {
    await writeFile(join(target, 'AGENTS.md'), 'USER-EDITED')
    await mkdir(join(target, '.agents/skills/retired-demo'), { recursive: true })
    await writeFile(join(target, '.agents/skills/retired-demo/SKILL.md'), '---\nname: retired-demo\n---\n')
    await mkdir(join(target, 'docs/rules'), { recursive: true })
    await writeFile(join(target, 'docs/rules/FRONTEND_CONVENTIONS.md'), 'MY-CONVENTIONS')
    await mkdir(join(target, '.toolkit'), { recursive: true })
    await writeFile(join(target, '.toolkit/manifest.json'), JSON.stringify({ starterStatus: 'ready', profileStatus: 'user-state', starterVersion: '0.0.0' }))
    const run = build(target)
    assert.equal(run.status, 0, run.stdout + run.stderr)
    assert.equal(await readFile(join(target, 'AGENTS.md'), 'utf8'), 'USER-EDITED', 'skipIfExists 文件不得覆盖用户内容')
    assert.equal(await readFile(join(target, 'docs/rules/FRONTEND_CONVENTIONS.md'), 'utf8'), 'MY-CONVENTIONS', '用户前端约定不得被升级覆盖')
    const installed = JSON.parse(await readFile(join(target, '.toolkit/manifest.json'), 'utf8'))
    assert.equal(installed.profileStatus, 'user-state', 'overlay 不得重置用户 manifest 状态')
    const current = JSON.parse(await readFile(join(root, 'toolkit.json'), 'utf8'))
    assert.equal(installed.starterVersion, current.version, 'overlay 应把 starterVersion 升到当前版本')
    assert.ok(run.stdout.includes('0.0.0 →'), '升级打印应包含旧→新版本：\n' + run.stdout)
    assert.ok(existsSync(join(target, 'LICENSE')), '非 skipIfExists 文件应写入')
    assert.ok(run.stdout.includes('跳过'), '跳过清单应打印：\n' + run.stdout)
    assert.ok(run.stdout.includes('与新版有') && run.stdout.includes('差异'), '跳过文件与新版有差异时应标注差异与采纳指引：\n' + run.stdout)
    assert.ok(run.stdout.includes('retired-demo') && run.stdout.includes('退役'), '未登记技能目录应提示退役：\n' + run.stdout)
  } finally {
    await rm(target, { recursive: true, force: true })
  }
})

test('release 产物在 checkout 外构建打包，构建/打包/发布路径一致', async () => {
  const ci = await readFile(join(root, '.github/workflows/ci.yml'), 'utf8')
  const release = ci.slice(ci.indexOf('  release:'))
  assert.ok(
    release.includes('node scripts/build-starter.mjs --target "$RUNNER_TEMP/dist-starter"'),
    'release 构建目标必须在 checkout 外（$RUNNER_TEMP），源内目标会被重叠保护拒绝',
  )
  assert.ok(
    release.includes('VERSION=$(node -p "require(\'./toolkit.json\').version")'),
    '版本提取保持原有双引号加固',
  )
  assert.ok(
    release.includes('if [ "v$VERSION" != "$GITHUB_REF_NAME" ]; then'),
    'tag 断言保持原有双引号加固',
  )
  assert.equal(release.includes('--target dist-starter'), false, '不得残留 checkout 内的 --target dist-starter 字面量')
  assert.ok(release.includes('cd "$RUNNER_TEMP/dist-starter"'), '打包必须进入同一构建目录')
  assert.ok(release.includes('zip -r "$RUNNER_TEMP/ai-front-spec-v$VERSION.zip"'), 'zip 必须落在 $RUNNER_TEMP')
  assert.ok(
    release.includes('gh release create "$GITHUB_REF_NAME" "$RUNNER_TEMP/ai-front-spec-v$VERSION.zip"'),
    'gh release 参数必须指向 $RUNNER_TEMP 中的 zip',
  )
  assert.equal(release.includes('../ai-front-spec-v'), false, '不得残留 checkout 内相对路径 zip')
})

test('release 命令回放：RUNNER_TEMP 含空格时目标与产物均为单一参数', async () => {
  const ci = await readFile(join(root, '.github/workflows/ci.yml'), 'utf8')
  const release = ci.slice(ci.indexOf('  release:'))
  const commands = []
  let inRun = false
  for (const line of release.split(/\r?\n/)) {
    if (/^ {8}run: \|$/.test(line)) { inRun = true; continue }
    const single = line.match(/^ {8}run: (.+)$/)
    if (single) { commands.push(single[1]); inRun = false; continue }
    if (inRun) {
      if (/^ {10}/.test(line) && /\S/.test(line)) commands.push(line.slice(10))
      else if (/\S/.test(line)) inRun = false
    }
  }
  assert.ok(commands.length >= 6, '应从 release 段解析出全部命令行：' + commands.join('\n'))
  const home = await mkdtemp(join(tmpdir(), 'starter-release-replay-'))
  try {
    const runnerTemp = join(home, 'runner temp').split(sep).join('/')
    await mkdir(runnerTemp, { recursive: true })
    const record = join(home, 'record.log').split(sep).join('/')
    const script = [
      'set -e',
      'export RUNNER_TEMP=' + JSON.stringify(runnerTemp),
      'export GITHUB_REF_NAME=v9.9.9',
      'export RECORD=' + JSON.stringify(record),
      'node() {',
      '  if [ "$1" = "-p" ]; then printf 9.9.9; return 0; fi',
      '  local previous= target=',
      '  for argument in "$@"; do if [ "$previous" = "--target" ]; then target=$argument; fi; previous=$argument; done',
      '  echo "target=[$target]" >> "$RECORD"',
      '  mkdir -p "$target" && printf stock > "$target/AGENTS.md"',
      '}',
      'zip() { echo "zip-path=[$2]" >> "$RECORD"; touch "$2"; }',
      'gh() { echo "gh-tag=[$3]" >> "$RECORD"; echo "gh-zip=[$4]" >> "$RECORD"; [ -f "$4" ]; }',
      ...commands,
      'echo replay-ok',
    ].join('\n')
    const run = spawnSync('bash', ['-c', script], { encoding: 'utf8' })
    assert.equal(run.status, 0, '回放脚本应整体成功（stub 隔离，无真实远端调用）：\n' + script + '\n---\n' + run.stdout + run.stderr)
    const logged = await readFile(record, 'utf8')
    assert.ok(logged.includes('target=[' + runnerTemp + '/dist-starter]'), '构建目标须为单一参数且含空格路径完整：\n' + logged)
    assert.ok(logged.includes('zip-path=[' + runnerTemp + '/ai-front-spec-v9.9.9.zip]'), 'zip 须为单一参数：\n' + logged)
    assert.ok(logged.includes('gh-tag=[v9.9.9]'), logged)
    assert.ok(logged.includes('gh-zip=[' + runnerTemp + '/ai-front-spec-v9.9.9.zip]'), 'gh 发布参数须为单一参数：\n' + logged)
  } finally {
    await rm(home, { recursive: true, force: true })
  }
})
