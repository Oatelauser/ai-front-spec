// F3 回归：update-vendored check 必须区分 无更新(0) / 可升级(1) / 未知·错误(2)。
// 隔离 fixture：把脚本复制进临时根 + 各场景 toolkit.json，上游用本地 git 仓库或不存在路径，
// npm 通道指向不可达 registry —— 全程不碰真实远端、不碰本仓 toolkit.json。
import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const script = resolve(repoRoot, 'scripts/update-vendored.mjs')
const workflow = readFileSync(resolve(repoRoot, '.github/workflows/vendored-check.yml'), 'utf8')

const git = (args, opts = {}) => spawnSync('git', args, { encoding: 'utf8', ...opts })

// 建一个带单提交的本地 git 仓库当“上游”，返回 { repo, sha }
const makeUpstream = (dir) => {
  git(['init', '--quiet', dir])
  git(['-C', dir, '-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '--allow-empty', '--quiet', '-m', 'init'])
  return { repo: dir, sha: git(['-C', dir, 'rev-parse', 'HEAD']).stdout.trim() }
}

// 把脚本复制进临时根（脚本按自身位置定位 root/toolkit.json），写 fixture 后跑 check
const runCheck = (vendored, packages = null, env = {}) => {
  const root = mkdtempSync(join(tmpdir(), 'upd-vendored-'))
  mkdirSync(join(root, 'scripts'), { recursive: true })
  copyFileSync(script, join(root, 'scripts/update-vendored.mjs'))
  writeFileSync(join(root, 'toolkit.json'), JSON.stringify({ vendored, ...(packages ? { packages } : {}) }))
  const result = spawnSync(process.execPath, [join(root, 'scripts/update-vendored.mjs')], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
  })
  rmSync(root, { recursive: true, force: true })
  return result
}

describe('update-vendored check 三态退出码（F3）', () => {
  // fixture 生命周期挂在 before/after：describe 回调体只在收集期同步执行一次，
  // 在那里 try/finally 会在用例运行前就把上游仓库删掉。
  const upstreamDir = join(tmpdir(), `upd-upstream-${process.pid}.git`)
  let upstream
  before(() => {
    upstream = makeUpstream(upstreamDir)
  })
  after(() => {
    rmSync(upstreamDir, { recursive: true, force: true })
  })

  it('基线与上游一致：退出 0（已知无更新）', () => {
      const r = runCheck({ demo: { repo: upstream.repo, sha: upstream.sha } })
      assert.equal(r.status, 0, r.stdout + r.stderr)
      assert.ok(r.stdout.includes('✓'), `上游 sha=${upstream.sha}\n${r.stdout}${r.stderr}`)
    })

    it('基线落后：退出 1（可升级）', () => {
      const r = runCheck({ demo: { repo: upstream.repo, sha: '0'.repeat(40) } })
      assert.equal(r.status, 1, r.stdout + r.stderr)
      assert.ok(r.stdout.includes('↑'), r.stdout + r.stderr)
    })

    it('上游不存在：退出 2（未知/错误，不得全绿）', () => {
      const r = runCheck({ demo: { repo: join(upstreamDir, 'missing-repo'), sha: '0'.repeat(40) } })
      assert.equal(r.status, 2, `应退出 2，实际 ${r.status}：${r.stdout}`)
    })

    it('缺基线：退出 2（未知/错误，不得全绿）', () => {
      const r = runCheck({ demo: { repo: upstream.repo } })
      assert.equal(r.status, 2, `应退出 2，实际 ${r.status}：${r.stdout}`)
    })

  it('混合结果（一项干净 + 一项探测失败）：退出 2，不返回全绿', () => {
      const r = runCheck({
        ok: { repo: upstream.repo, sha: upstream.sha },
        bad: { repo: join(upstreamDir, 'missing-repo'), sha: '0'.repeat(40) },
      })
      assert.equal(r.status, 2, `应退出 2，实际 ${r.status}：${r.stdout}`)
      assert.ok(r.stdout.includes('✓') && r.stdout.includes('!'))
    })

  it('npm registry 不可达：退出 2（隔离 registry 指向本机拒绝端口）', () => {
      const r = runCheck(
        { demo: { pkg: 'demo-pkg' } },
        { 'demo-pkg': { npm: 'demo-pkg', version: '0.0.0' } },
        { npm_config_registry: 'http://127.0.0.1:9/', npm_config_fetch_retries: '0', npm_config_fetch_retry_maxtimeout: '100' },
      )
      assert.equal(r.status, 2, `应退出 2，实际 ${r.status}：${r.stdout}`)
    })

  it('引用包未登记 npm 通道：退出 2（配置缺口按未知处理）', () => {
      const r = runCheck({ demo: { pkg: 'unregistered' } })
      assert.equal(r.status, 2, `应退出 2，实际 ${r.status}：${r.stdout}`)
    })
})

// F3 补修验证：从工作流 YAML 提取各步骤的 run 脚本，用命令替身（node/gh 函数）在本地 bash 真实执行控制流。
// 这不是文本匹配，也不是真实 GitHub Actions 运行——步骤级 if:/continue-on-error 属声明式语义，仍用最小结构钉锁定。
const findBash = () => {
  const candidates = ['bash']
  for (const root of [process.env.ProgramFiles, process.env['ProgramFiles(x86)']]) {
    if (root) candidates.push(join(root, 'Git', 'bin', 'bash.exe'), join(root, 'Git', 'usr', 'bin', 'bash.exe'))
  }
  for (const candidate of candidates) {
    if (spawnSync(candidate, ['-c', 'echo ok'], { encoding: 'utf8' }).status === 0) return candidate
  }
  return null
}
const BASH = findBash()

// 提取锚点所在步骤的 run: | 脚本块（10 空格缩进），越界到下一个 step 即止
const extractRunBlock = (anchor) => {
  const anchorIdx = workflow.indexOf(anchor)
  assert.ok(anchorIdx !== -1, `工作流缺少锚点：${anchor}`)
  const stepEnd = workflow.indexOf('\n      - ', anchorIdx)
  const scopeEnd = stepEnd === -1 ? workflow.length : stepEnd
  const runIdx = workflow.indexOf('run: |', anchorIdx)
  assert.ok(runIdx !== -1 && runIdx < scopeEnd, `锚点 ${anchor} 所在步骤应有 run: | 块`)
  const body = []
  for (const line of workflow.slice(runIdx, scopeEnd).split(/\r?\n/).slice(1)) {
    if (line.trim() === '') { body.push(''); continue }
    if (!/^ {10}/.test(line)) break
    body.push(line.slice(10))
  }
  assert.ok(body.length > 0, `锚点 ${anchor} 的 run 块不应为空`)
  return body.join('\n')
}

const SUMMARY_LINE = '小结：可升级 1 · 未知/错误 0 · 无变化 0（退出码 0=全绿 1=可升级 2=未知/错误）'

// check 步骤替身：node 函数按参数输出内容并返回给定退出码
const runCheckStep = (stubExit, stubOutput) => {
  assert.ok(BASH, '本机需要 bash（Git 自带或 CI Linux）才能执行工作流控制流替身测试')
  const dir = mkdtempSync(join(tmpdir(), 'wf-check-'))
  try {
    writeFileSync(join(dir, 'step.sh'),
      `node() { printf '%s\\n' ${JSON.stringify(stubOutput)}; return ${stubExit}; }\n` + extractRunBlock('id: check'))
    const githubOutput = join(dir, 'github-output.txt')
    const r = spawnSync(BASH, ['--noprofile', '--norc', '-eo', 'pipefail', 'step.sh'], {
      cwd: dir, encoding: 'utf8', env: { ...process.env, GITHUB_OUTPUT: githubOutput },
    })
    return {
      status: r.status, output: r.stdout + r.stderr,
      githubOutput: readFileSync(githubOutput, 'utf8'),
      reportContent: readFileSync(join(dir, 'report.txt'), 'utf8'),
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

// 报告步骤替身：gh 函数记录调用，Actions 表达式替换为环境变量驱动
const runReportStep = ({ exit, packCount = '', uploadOutcome = '', issue = '', checkOutcome = 'success', reportContent = null }) => {
  assert.ok(BASH, '本机需要 bash（Git 自带或 CI Linux）才能执行工作流控制流替身测试')
  const dir = mkdtempSync(join(tmpdir(), 'wf-report-'))
  try {
    writeFileSync(join(dir, 'report.txt'), reportContent ?? `REPORT-MARKER ↑ demo 可升级\n${SUMMARY_LINE}`)
    const ghLog = join(dir, 'gh.log')
    let script = extractRunBlock('name: 报告落 Issue')
    const subs = {
      '${{ steps.check.outputs.exit }}': '${WF_EXIT}',
      '${{ steps.check.outcome }}': '${WF_CHECK_OUTCOME}',
      '${{ steps.pack.outputs.count }}': '${WF_PACK_COUNT}',
      '${{ steps.upload.outcome }}': '${WF_UPLOAD_OUTCOME}',
      '${{ github.repository }}': 'demo/repo',
      '${{ github.run_id }}': '123456',
      '${{ github.run_number }}': '42',
    }
    for (const [from, to] of Object.entries(subs)) script = script.split(from).join(to)
    assert.ok(!script.includes('${{'), '报告脚本含未替换的 Actions 表达式，测试替身需同步更新')
    writeFileSync(join(dir, 'step.sh'), [
      `gh() { printf '%s\\n' "$*" >> "$GH_LOG"; if [ "$1 $2" = "issue list" ]; then printf '%s' "$GH_ISSUE"; fi; }`,
      script,
      '',
    ].join('\n'))
    const r = spawnSync(BASH, ['--noprofile', '--norc', '-eo', 'pipefail', 'step.sh'], {
      cwd: dir, encoding: 'utf8',
      env: {
        ...process.env, GH_LOG: ghLog, GH_ISSUE: issue,
        WF_EXIT: String(exit), WF_CHECK_OUTCOME: checkOutcome,
        WF_PACK_COUNT: String(packCount), WF_UPLOAD_OUTCOME: uploadOutcome,
      },
    })
    return {
      status: r.status, output: r.stdout + r.stderr,
      log: existsSync(ghLog) ? readFileSync(ghLog, 'utf8') : '',
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

// 串联：真实执行 check 步骤脚本，从其实际输出解析 exit 与报告内容、从实际退出状态推导 outcome，
// 直通报告步骤——不手工预设"正确结果"。
const runChained = (stubExit, stubOutput, issue = '42') => {
  const check = runCheckStep(stubExit, stubOutput)
  const exitMatch = /exit=(\d+)/.exec(check.githubOutput)
  assert.ok(exitMatch, `check 步骤输出应含 exit=，实际：${check.githubOutput}`)
  const report = runReportStep({
    exit: Number(exitMatch[1]),
    checkOutcome: check.status === 0 ? 'success' : 'failure',
    reportContent: check.reportContent,
    issue,
  })
  return { check, exit: Number(exitMatch[1]), report }
}

describe('vendored-check check 步骤控制流（F3，bash 替身执行）', () => {
  it('exit=0 且输出完整：步骤成功，输出 exit=0', () => {
    const r = runCheckStep(0, `  ✓ demo：最新（aaaaaaaa）\n${SUMMARY_LINE}`)
    assert.equal(r.status, 0, r.output)
    assert.ok(r.githubOutput.includes('exit=0'), r.githubOutput)
  })

  it('exit=1（可升级）：发现升级不当作失败，步骤仍成功', () => {
    const r = runCheckStep(1, `  ↑ demo：可升级 aaaaaaaa → bbbbbbbb\n${SUMMARY_LINE}`)
    assert.equal(r.status, 0, r.output)
    assert.ok(r.githubOutput.includes('exit=1'), r.githubOutput)
  })

  it('exit=2（未知/错误）：步骤必须失败，工作流不得全绿', () => {
    const r = runCheckStep(2, `  ! demo：无法探测上游（网络/代理）\n${SUMMARY_LINE.replace('未知/错误 0', '未知/错误 1')}`)
    assert.notEqual(r.status, 0, `exit=2 时 check 步骤应失败，实际 ${r.status}`)
    assert.ok(r.githubOutput.includes('exit=2'), r.githubOutput)
  })

  it('异常退出码（127）：同样按失败处理', () => {
    const r = runCheckStep(127, '')
    assert.notEqual(r.status, 0, `异常退出码应失败，实际 ${r.status}`)
  })

  it('崩溃无小结行（如 node 抛错退出 1）：按异常失败，下游消费统一为 2', () => {
    const r = runCheckStep(1, '')
    assert.notEqual(r.status, 0, '输出不完整（无小结行）应判定为异常')
    assert.ok(/exit=2(\D|$)/.test(r.githubOutput), `下游消费的 exit 应归一为 2，实际：${r.githubOutput}`)
  })

  it('原始退出码 0 但缺小结行：步骤失败，下游消费统一为 2（不得用未校验的 0）', () => {
    const r = runCheckStep(0, '  ✓ demo：最新（aaaaaaaa）')
    assert.notEqual(r.status, 0, '输出不完整应判定为异常，即使原始退出码为 0')
    assert.ok(/exit=2(\D|$)/.test(r.githubOutput), `下游消费的 exit 应归一为 2，实际：${r.githubOutput}`)
  })
})

describe('vendored-check check→报告串联（F3，真实输出直通，不预设结果）', () => {
  it('原始 exit=0 且缺小结行：gh close 从未被调用，报告探测不完整', () => {
    const { check, exit, report } = runChained(0, '  ✓ demo：最新（aaaaaaaa）\n（输出中断，无小结）')
    assert.notEqual(check.status, 0, 'check 步骤应失败')
    assert.ok(!report.log.includes('issue close'), `不得关闭待办，gh 调用：${report.log}`)
    assert.ok(report.log.includes('探测不完整'), `报告应探测不完整，gh 调用：${report.log}`)
    assert.equal(exit, 2, `下游消费的 exit 应为 2，实际 ${exit}`)
  })

  it('原始 exit=1 且缺小结行：不报告为可升级，走探测不完整，不关闭', () => {
    const { check, report } = runChained(1, '  ↑ demo：可升级 aaaaaaaa → bbbbbbbb\n（随后崩溃）')
    assert.notEqual(check.status, 0, 'check 步骤应失败')
    assert.ok(!report.log.includes('issue close'), `不得关闭待办，gh 调用：${report.log}`)
    assert.ok(report.log.includes('探测不完整'), `异常不得报告为可升级，gh 调用：${report.log}`)
  })

  it('正常完整 exit=0（有小结行）：check 成功，仍可关闭待办', () => {
    const { check, exit, report } = runChained(0, `  ✓ demo：最新（aaaaaaaa）\n${SUMMARY_LINE}`)
    assert.equal(check.status, 0, check.output)
    assert.equal(exit, 0)
    assert.ok(report.log.includes('issue close 42'), `完整全绿应关闭待办，gh 调用：${report.log}`)
  })

  it('有效结果为 0 但 check 步骤失败：关闭分支不得放行（双条件）', () => {
    const r = runReportStep({ exit: 0, checkOutcome: 'failure', issue: '42' })
    assert.equal(r.status, 0, r.output)
    assert.ok(!r.log.includes('issue close'), `exit=0 且 check 失败时不得关闭，gh 调用：${r.log}`)
    assert.ok(r.log.includes('探测不完整'), `应走探测不完整分支，gh 调用：${r.log}`)
  })
})

describe('vendored-check 报告步骤控制流（F3，gh 替身执行）', () => {
  it('exit=0 且有未决 Issue：只关闭，措辞含探测完整', () => {
    const r = runReportStep({ exit: 0, issue: '42' })
    assert.equal(r.status, 0, r.output)
    assert.ok(r.log.includes('issue close 42'), r.log)
    assert.ok(!r.log.includes('issue create') && !r.log.includes('issue comment'), r.log)
  })

  it('exit=0 且无未决 Issue：不动作', () => {
    const r = runReportStep({ exit: 0, issue: '' })
    assert.equal(r.status, 0, r.output)
    assert.equal(r.log.trim(), 'issue list --state open --search in:title vendored 技能升级待办 --json number --jq .[0].number')
  })

  it('exit=1 且无未决 Issue：创建可升级报告，正文含检查结果', () => {
    const r = runReportStep({ exit: 1, issue: '' })
    assert.equal(r.status, 0, r.output)
    assert.ok(r.log.includes('issue create') && r.log.includes('检查结果'), r.log)
    assert.ok(r.log.includes('REPORT-MARKER'), '报告应内嵌 check 输出')
    assert.ok(!r.log.includes('issue close'), r.log)
  })

  it('exit=1 且有未决 Issue：追加评论，不关闭', () => {
    const r = runReportStep({ exit: 1, issue: '42' })
    assert.equal(r.status, 0, r.output)
    assert.ok(r.log.includes('issue comment 42'), r.log)
    assert.ok(!r.log.includes('issue close'), r.log)
  })

  it('exit=2（混合可升级+未知）：探测不完整语义，保留待办不关闭', () => {
    const r = runReportStep({ exit: 2, issue: '42' })
    assert.equal(r.status, 0, r.output)
    assert.ok(r.log.includes('issue comment 42') && r.log.includes('探测不完整'), r.log)
    assert.ok(!r.log.includes('issue close'), r.log)
  })

  it('异常退出码（127）走探测不完整分支，不关闭', () => {
    const r = runReportStep({ exit: 127, issue: '42' })
    assert.equal(r.status, 0, r.output)
    assert.ok(r.log.includes('探测不完整'), r.log)
    assert.ok(!r.log.includes('issue close'), r.log)
  })

  it('打包成功且上传成功：报告承诺离线升级包（含 Artifacts 链接）', () => {
    const r = runReportStep({ exit: 1, packCount: '3', uploadOutcome: 'success', issue: '' })
    assert.equal(r.status, 0, r.output)
    assert.ok(r.log.includes('Artifacts'), r.log)
  })

  it('上传失败：报告仍发出，但不得承诺升级包（无 Artifacts 链接）', () => {
    const r = runReportStep({ exit: 1, packCount: '3', uploadOutcome: 'failure', issue: '42' })
    assert.equal(r.status, 0, r.output)
    assert.ok(r.log.includes('issue comment 42'), '上传失败不得阻断报告路径')
    assert.ok(!r.log.includes('Artifacts'), r.log)
  })

  it('打包无产物（count=0，含纯未知无可打包项）：报告不得承诺升级包', () => {
    const r = runReportStep({ exit: 1, packCount: '0', uploadOutcome: 'success', issue: '' })
    assert.equal(r.status, 0, r.output)
    assert.ok(r.log.includes('issue create'), r.log)
    assert.ok(!r.log.includes('Artifacts'), r.log)
  })

  it('探测不完整但确有可升级包（混合+上传成功）：告警并附升级包链接', () => {
    const r = runReportStep({ exit: 2, packCount: '2', uploadOutcome: 'success', issue: '42' })
    assert.equal(r.status, 0, r.output)
    assert.ok(r.log.includes('探测不完整') && r.log.includes('Artifacts'), r.log)
  })
})

describe('vendored-check 步骤门控结构（F3 声明式钉）', () => {
  it('打包/上传失败不阻断报告，报告步骤不被前置失败跳过', () => {
    // 声明式 if/continue-on-error 无法本地执行，用结构钉锁定最小语义；
    // 条件用 ${{ }} 包裹（裸 ! 开头的普通标量不是合法 YAML）
    const packGates = workflow.match(/if: \$\{\{ !cancelled\(\) && steps\.check\.outputs\.exit != '0'/g) ?? []
    assert.equal(packGates.length, 2, 'pack 与 upload 都应在非全绿且未取消时运行')
    assert.ok(/id: upload\r?\n\s+if: \$\{\{ !cancelled\(\) && steps\.check\.outputs\.exit != '0' && steps\.pack\.outputs\.count/.test(workflow),
      'upload 应以 count 非空非 0 为门（打包失败/无产物不上传）')
    assert.ok(workflow.includes('if: ${{ !cancelled() && (github.event_name =='), '报告步骤应 !cancelled()，前置失败仍运行')
    const continueOnError = workflow.match(/continue-on-error: true/g) ?? []
    assert.equal(continueOnError.length, 2, 'pack 与 upload 应 continue-on-error（失败不阻断报告）')
  })
})
