import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve } from 'node:path'

export function parseSkillFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match) return { description: '', extraKeys: [], name: '' }

  const lines = match[1].split(/\r?\n/)
  const entries = []

  for (let index = 0; index < lines.length; index += 1) {
    const parts = lines[index].match(/^([a-zA-Z][\w-]*):\s*(.*)$/)
    if (!parts) continue

    let value = parts[2].trim()
    if (/^[>|][+-]?$/.test(value)) {
      const fragments = []
      for (index += 1; index < lines.length && /^\s+/.test(lines[index]); index += 1) {
        fragments.push(lines[index].trim())
      }
      index -= 1
      value = value.startsWith('>') ? fragments.join(' ') : fragments.join('\n')
    }
    entries.push([parts[1], stripQuotes(value)])
  }
  const values = Object.fromEntries(entries)

  return {
    description: values.description ?? '',
    extraKeys: entries.map(([key]) => key).filter((key) => !['name', 'description'].includes(key)),
    name: values.name ?? '',
  }
}

export function collectGuidanceErrors({ config, files, packageJson }) {
  const errors = []

  for (const file of config.requiredFiles) {
    if (!files[file]?.trim()) {
      errors.push(
        diagnostic('PE001', file, '缺少或为空的提示词工程文件。', '补充文件并登记其职责。'),
      )
    }
  }

  for (const contract of config.promptContracts ?? []) {
    errors.push(...validatePromptContract(files[contract.file] ?? '', contract))
  }

  errors.push(...validateProjectSkill(config, files))
  for (const skill of config.additionalSkills ?? []) {
    errors.push(...validateProjectSkill({ ...config, projectSkill: skill }, files))
  }
  errors.push(...validateRouting(config, files))
  errors.push(...validateCapabilityRequirements(config, files))
  errors.push(...validateForbiddenPatterns(config, files))
  errors.push(...validatePlaceholders(config, files))
  errors.push(...validateProjectRecords(config, files))
  errors.push(...validateProfileArtifacts(config, files))
  errors.push(...validatePackageIntegration(config, packageJson))

  const agents = files['AGENTS.md'] ?? ''
  const skillName = config.projectSkill?.name
  if (skillName && !agents.includes(`$${skillName}`)) {
    errors.push(
      diagnostic(
        'PE013',
        'AGENTS.md',
        `长期规则没有路由到 $${skillName}。`,
        '在强制入口中显式调用项目 Skill。',
      ),
    )
  }

  return errors
}

function validateProfileArtifacts(config, files) {
  const errors = []
  const report = (file, message) => errors.push(diagnostic('PE016', file, message,
    '保持画像状态、端目标和初始化提案的结构化契约。'))
  const stateFile = config.projectRecords?.profile ?? '.toolkit/profile-state.json'
  const stateText = files[stateFile]
  if (stateText?.trim()) {
    try {
      const state = JSON.parse(stateText)
      const targets = state.deliveryTargets
      const targetNames = ['browserWeb', 'mobileH5', 'tabletWeb', 'webview', 'pwa', 'multiPlatform']
      const statuses = ['pending', 'recommended', 'user-confirmed', 'deferred', 'conflict']
      if (!targets || typeof targets !== 'object' || Array.isArray(targets)) {
        report(stateFile, 'profile-state 必须包含 deliveryTargets 对象。')
      } else {
        for (const name of targetNames) {
          const target = targets[name]
          if (!target || !statuses.includes(target.status) || !('value' in target)) {
            report(stateFile, `deliveryTargets.${name} 必须包含合法 status 和 value。`)
          }
        }
        if (targets.multiPlatform?.derived !== true) {
          report(stateFile, 'deliveryTargets.multiPlatform 必须标记 derived=true，不能作为独立事实编辑。')
        }
      }
      if (!state.proposal || state.proposal.path !== '.toolkit/profile-proposal.json' ||
          !['none', 'proposed', 'awaiting-approval', 'approved', 'archived'].includes(state.proposal.status)) {
        report(stateFile, 'profile-state.proposal 必须记录标准路径和提案状态。')
      }
    } catch {
      report(stateFile, 'profile-state.json 必须是有效 JSON。')
    }
  }

  const proposalFile = '.agents/skills/project-profile/templates/profile-proposal.template.json'
  const proposalText = files[proposalFile]
  if (proposalText?.trim()) {
    try {
      const proposal = JSON.parse(proposalText)
      const ids = (proposal.cards ?? []).map(card => card?.id)
      if (!['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7'].every(id => ids.includes(id)) || ids.length !== 7) {
        report(proposalFile, 'profile proposal 模板必须包含且仅包含 Q1-Q7 七张决策卡片。')
      }
      const scopes = ['facts', 'userDecisions', 'recommendations', 'componentPlan', 'deferred']
      if (!proposal.writeScopes || !scopes.every(scope => Object.hasOwn(proposal.writeScopes, scope))) {
        report(proposalFile, 'profile proposal 模板必须声明 facts、userDecisions、recommendations、componentPlan、deferred 五个写入层。')
      }
      if (!Array.isArray(proposal.traceability) || proposal.traceability.length === 0) {
        report(proposalFile, 'profile proposal 模板必须包含非空 traceability 追踪矩阵。')
      }
    } catch {
      report(proposalFile, 'profile-proposal.template.json 必须是有效 JSON。')
    }
  }
  return errors
}

export function validateLocalLinks({ files, root }) {
  const errors = []

  for (const [source, content] of Object.entries(files)) {
    for (const match of content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const destination = parseMarkdownDestination(match[1])
      const [target, rawFragment = ''] = destination.split('#', 2)
      if (/^[a-z][a-z\d+.-]*:/i.test(target)) continue

      let decodedTarget
      try {
        decodedTarget = decodeURIComponent(target)
      } catch {
        errors.push(
          diagnostic('PE008', source, `本地链接不是有效的 URL 编码：${target}`, '修正链接编码。'),
        )
        continue
      }

      const targetPath = target
        ? resolve(root, dirname(source), decodedTarget)
        : resolve(root, source)
      const relativePath = relative(root, targetPath)
      if (isAbsolute(relativePath) || relativePath.startsWith('..')) {
        errors.push(
          diagnostic(
            'PE008',
            source,
            `本地链接越出项目根目录：${target}`,
            '把引用目标放入项目内，或改用明确的外部 URL。',
          ),
        )
      } else if (!existsSync(targetPath) || !statSync(targetPath).isFile()) {
        errors.push(
          diagnostic('PE008', source, `本地链接目标不存在：${target}`, '修正路径或补充目标文件。'),
        )
      } else if (rawFragment) {
        let fragment
        try {
          fragment = decodeURIComponent(rawFragment).toLowerCase()
        } catch {
          errors.push(
            diagnostic(
              'PE008',
              source,
              `本地链接锚点不是有效的 URL 编码：${rawFragment}`,
              '修正锚点编码。',
            ),
          )
          continue
        }
        const targetContent = readFileSync(targetPath, 'utf8')
        if (!collectMarkdownAnchors(targetContent).has(fragment)) {
          errors.push(
            diagnostic(
              'PE008',
              source,
              `本地链接锚点不存在：${destination}`,
              '修正标题锚点或移除失效片段。',
            ),
          )
        }
      }
    }
  }

  return errors
}

export function validateDocumentedPackageScripts({ config, files, packageJson }) {
  if (!packageJson) return []

  const scripts = packageJson.scripts ?? {}
  const documented = new Set()
  const commandPattern = /\b(?:npm|pnpm|yarn|bun)\s+run\s+([\w:-]+)/g

  for (const content of Object.values(files)) {
    for (const match of content.matchAll(commandPattern)) documented.add(match[1])
  }

  return [...documented]
    .filter((command) => !scripts[command])
    .map((command) =>
      diagnostic(
        'PE009',
        config.packageIntegration?.manifestPath ?? 'package.json',
        `文档引用了不存在的包脚本：${command}`,
        '补充脚本或修正文档命令。',
      ),
    )
}

function validatePromptContract(content, contract) {
  const errors = []
  let previousIndex = -1

  for (const [index, section] of contract.sections.entries()) {
    const sectionIndex = content.indexOf(section)
    if (sectionIndex < 0) {
      errors.push(
        diagnostic(
          'PE002',
          contract.file,
          `Prompt 合同缺少“${section}”段。`,
          '补充目标、上下文、约束和完成条件，并给出可执行内容。',
        ),
      )
      continue
    }
    if (sectionIndex < previousIndex) {
      errors.push(
        diagnostic('PE002', contract.file, `Prompt 合同中“${section}”顺序错误。`, '按配置顺序排列。'),
      )
    }

    const nextSection = contract.sections[index + 1]
    const candidateIndex = nextSection
      ? content.indexOf(nextSection, sectionIndex + section.length)
      : content.length
    const nextIndex = candidateIndex < 0 ? content.length : candidateIndex
    const sectionEnd = findPromptSectionEnd(content, sectionIndex + section.length, nextIndex)
    const body = content.slice(sectionIndex + section.length, sectionEnd).replace(/[`#\s-]/g, '')
    if (!body) {
      errors.push(
        diagnostic('PE002', contract.file, `Prompt 合同中“${section}”没有正文。`, '增加可填写说明。'),
      )
    }
    previousIndex = sectionIndex
  }

  return errors
}

function validateProjectSkill(config, files) {
  const errors = []
  const skill = config.projectSkill
  if (!skill) return errors

  const content = files[skill.path] ?? ''
  const frontmatter = parseSkillFrontmatter(content)
  if (frontmatter.name !== skill.name) {
    errors.push(
      diagnostic(
        'PE003',
        skill.path,
        `Skill name 必须与目录名一致：${skill.name}`,
        '同步修改目录名和 frontmatter name。',
      ),
    )
  }
  if (frontmatter.extraKeys.length > 0) {
    errors.push(
      diagnostic(
        'PE003',
        skill.path,
        `Skill frontmatter 只允许 name/description：${frontmatter.extraKeys.join(', ')}`,
        '把产品元数据移到 agents/openai.yaml。',
      ),
    )
  }

  const hasTrigger = (skill.triggerPatterns ?? []).some((pattern) =>
    new RegExp(pattern, 'i').test(frontmatter.description),
  )
  if (!frontmatter.description || !hasTrigger) {
    errors.push(
      diagnostic(
        'PE004',
        skill.path,
        'Skill description 没有同时说明能力和触发场景。',
        '在 description 中加入明确的 Use when/何时使用语义。',
      ),
    )
  }
  if (content.split(/\r?\n/).length > skill.maxLines) {
    errors.push(
      diagnostic(
        'PE005',
        skill.path,
        `Skill 超过 ${skill.maxLines} 行。`,
        '保留核心流程，把任务变体移入 references/。',
      ),
    )
  }

  const metadata = files[skill.metadataPath] ?? ''
  const interfaceBlock =
    metadata.match(/^interface:\s*\r?\n((?:[ \t]+.*(?:\r?\n|$))*)/m)?.[1] ?? ''
  const displayName = readQuotedYamlValue(interfaceBlock, 'display_name')
  const shortDescription = readQuotedYamlValue(interfaceBlock, 'short_description')
  const defaultPrompt = readQuotedYamlValue(interfaceBlock, 'default_prompt')
  if (!interfaceBlock || !displayName || !shortDescription) {
    errors.push(
      diagnostic(
        'PE006',
        skill.metadataPath,
        'agents/openai.yaml 缺少有效的 interface 展示元数据。',
        '提供双引号或单引号包裹的 display_name、short_description 和 default_prompt。',
      ),
    )
  }
  if (!defaultPrompt.includes(`$${skill.name}`)) {
    errors.push(
      diagnostic(
        'PE006',
        skill.metadataPath,
        `default_prompt 必须显式调用 $${skill.name}。`,
        '修正 agents/openai.yaml 的 default_prompt。',
      ),
    )
  }

  return errors
}

function validateRouting(config, files) {
  const routing = config.routing
  if (!routing) return []

  const content = files[routing.path] ?? ''
  return (routing.requiredMarkers ?? [])
    .filter((marker) => !content.includes(marker))
    .map((marker) =>
      diagnostic(
        'PE007',
        routing.path,
        `任务路由缺少能力类别：${marker}`,
        '补充任务、最小能力和边界。',
      ),
    )
}

function validateCapabilityRequirements(config, files) {
  const requirements = config.capabilityRequirements
  if (!requirements) return []

  const content = files[requirements.path] ?? ''
  return (requirements.requiredMarkers ?? [])
    .filter((marker) => !content.includes(marker))
    .map((marker) =>
      diagnostic(
        'PE014',
        requirements.path,
        `能力安装清单缺少依赖标识：${marker}`,
        '补充插件精确引用或独立 Skill 的固定安装来源。',
      ),
    )
}

function validateForbiddenPatterns(config, files) {
  const errors = []

  for (const pattern of config.forbiddenPatterns ?? []) {
    const matcher = new RegExp(pattern, 'i')
    for (const [file, content] of Object.entries(files)) {
      if (matcher.test(content)) {
        errors.push(
          diagnostic(
            'PE011',
            file,
            `发现禁用或项目专属模式：${pattern}`,
            '把项目专属事实移入 PROJECT_PROFILE.md 或配置。',
          ),
        )
      }
    }
  }

  return errors
}

function validatePlaceholders(config, files) {
  if (config.allowPlaceholders) return []

  const profileState = parseJsonRecord(
    files[config.projectRecords?.profile ?? '.toolkit/profile-state.json'],
  )
  const matcher = new RegExp(config.placeholderPattern, 'g')
  const errors = []
  for (const [file, content] of Object.entries(files)) {
    if (keepsPlaceholdersByDesign(file.replace(/\\/g, '/'), profileState)) continue
    const matches = [...content.matchAll(matcher)]
    if (matches.length > 0) {
      errors.push(
        diagnostic(
          'PE012',
          file,
          `仍有 ${matches.length} 个未替换占位符。`,
          '填写项目事实后再启用严格模式。',
        ),
      )
    }
  }
  return errors
}

function validateProjectRecords(config, files) {
  const records = config.projectRecords
  if (!records) return []
  const errors = []
  const report = (file, message) => errors.push(diagnostic('PE015', file, message,
    '按资源生命周期和能力状态模型修正真实记录，不把未验证状态改成成功。'))
  const readRecord = (file) => {
    try {
      const record = JSON.parse(files[file] ?? '')
      if (!record || Array.isArray(record) || record.schemaVersion !== 1) throw new Error('schemaVersion')
      return record
    } catch {
      report(file, '项目记录必须是 schemaVersion=1 的有效 JSON 对象。')
      return null
    }
  }
  const manifest = readRecord(records.manifest)
  if (manifest) {
    const validPath = path => typeof path === 'string' && path.length > 0 && !isAbsolute(path) &&
      !path.split(/[\\/]/).includes('..')
    if (manifest.kind === 'project-starter') {
      if (manifest.starterStatus !== 'ready' || manifest.bootstrapStatus !== 'initialized' ||
          !['draft', 'initialized', 'conflict'].includes(manifest.profileStatus) ||
          !['draft', 'initialized', 'conflict'].includes(manifest.componentCatalogStatus ?? 'draft') ||
          !['pending', 'user-confirmed', 'inferred-only', 'conflict'].includes(manifest.templateSelection?.status) ||
          !Array.isArray(manifest.templateSelection?.candidates) ||
          !manifest.templateSelection.candidates.includes('generic') ||
          !manifest.templateSelection.candidates.includes('react') ||
          !manifest.templateSelection.candidates.includes('vue')) {
        report(records.manifest, 'Starter manifest 必须记录 ready、profileStatus、componentCatalogStatus 和完整模板选择状态。')
      }
      if (!Array.isArray(manifest.installedFiles) || !manifest.installedFiles.every(validPath) ||
          new Set(manifest.installedFiles).size !== manifest.installedFiles.length) {
        report(records.manifest, 'Starter installedFiles 必须是无重复且不越界的目标相对路径数组。')
      }
    } else {
      const fields = manifest.deferredFields
      if (manifest.kind !== 'project-installation' || !['draft', 'initialized'].includes(manifest.status) ||
          !['review-required', 'disabled'].includes(manifest.updates) || typeof manifest.localResources !== 'boolean') {
        report(records.manifest, '初始化记录的类型、状态、更新策略或本地资源标记无效。')
      }
      if (!['name', 'version', 'source'].every(key => typeof manifest.toolkit?.[key] === 'string' && manifest.toolkit[key].trim())) {
        report(records.manifest, '初始化记录缺少工具包名称、版本或可定位来源。')
      }
      if (!Array.isArray(manifest.installedFiles) || !manifest.installedFiles.every(validPath) ||
          new Set(manifest.installedFiles).size !== manifest.installedFiles.length) {
        report(records.manifest, 'installedFiles 必须是无重复且不越界的目标相对路径数组。')
      }
      if (!Array.isArray(fields) || fields.some(field => !field || field.impact !== 'low' || !field.field || !field.reason)) {
        report(records.manifest, 'deferredFields 只能记录具备字段名和原因的低影响待确认项。')
      } else if (fields.length && (manifest.status === 'initialized' || !config.allowPlaceholders)) {
        report(records.manifest, '仍有待确认字段，不能通过严格验收或标记 initialized。')
      }
      if (manifest.status === 'initialized' && (!Number.isFinite(Date.parse(manifest.initializedAt)) ||
          !manifest.installedFiles?.length || manifest.lastValidation?.status !== 'passed' ||
          !manifest.lastValidation.command || !Number.isFinite(Date.parse(manifest.lastValidation.at)))) {
        report(records.manifest, 'initialized 需要实际时间、接入清单和已通过校验的命令及时间。')
      }
    }
    if (!['passed', 'failed', 'not-run'].includes(manifest.lastValidation?.status)) {
      report(records.manifest, 'lastValidation 必须记录 passed、failed 或 not-run。')
    }
  }
  const capabilities = records.capabilities ? readRecord(records.capabilities) : null
  if (capabilities) {
    const states = {
      installed: ['yes', 'no', 'source-unverified', 'not-applicable', 'unknown'],
      enabled: ['yes', 'no', 'not-applicable', 'unknown'],
      connected: ['yes', 'no', 'not-required', 'not-applicable', 'unknown'],
      discoverable: ['yes', 'no', 'new-session-required', 'not-applicable', 'unknown'],
      taskUsable: ['yes', 'no', 'not-required', 'unknown'],
      installability: ['available', 'approval-required', 'host-unsupported', 'source-unreachable',
        'path-missing', 'not-applicable', 'unknown'],
    }
    if (!['on-demand', 'core', 'ui', 'react-ui', 'figma', 'github', 'full'].includes(capabilities.mode) ||
        !Array.isArray(capabilities.capabilities)) {
      report(records.capabilities, '能力模式或 capabilities 数组无效。')
    } else {
      const ids = new Set()
      for (const item of capabilities.capabilities) {
        if (!item || typeof item.id !== 'string' || !item.id || ids.has(item.id) ||
            !['plugin', 'host', 'skill', 'project-skill'].includes(item.type) ||
            !item.exactReference || !Array.isArray(item.evidence) || !Array.isArray(item.blockers) ||
            !Object.entries(states).every(([key, values]) => values.includes(item[key]))) {
          report(records.capabilities, '能力条目缺少精确引用、独立状态、证据/阻塞数组，或 id 重复。')
          continue
        }
        ids.add(item.id)
        if (item.taskUsable === 'yes' && (!item.evidence.length || item.blockers.length ||
            !['yes', 'not-applicable'].includes(item.installed) ||
            !['yes', 'not-applicable'].includes(item.enabled) ||
            !['yes', 'not-required', 'not-applicable'].includes(item.connected) || item.discoverable !== 'yes')) {
          report(records.capabilities, '任务可用状态缺少相应的安装、启用、连接、发现或无阻塞证据。')
        }
      }
    }
  }
  return errors
}

function validatePackageIntegration(config, packageJson) {
  const integration = config.packageIntegration
  if (!integration?.enabled || !integration.required) return []
  if (!packageJson) {
    return [
      diagnostic(
        'PE010',
        integration.manifestPath,
        '要求包脚本接入，但找不到项目清单。',
        '修正 manifestPath，或在非 JavaScript 项目中关闭该规则并接入等价门禁。',
      ),
    ]
  }

  const scripts = packageJson.scripts ?? {}
  const errors = []
  if (scripts[integration.aiCheckScript] !== integration.aiCheckCommand) {
    errors.push(
      diagnostic(
        'PE010',
        integration.manifestPath,
        `${integration.aiCheckScript} 必须执行：${integration.aiCheckCommand}`,
        '添加或修正专项 AI 指引校验脚本。',
      ),
    )
  }

  const connected = (integration.qualityScripts ?? []).some((name) =>
    scriptReachesTarget(scripts, name, integration.aiCheckScript),
  )
  if (!connected) {
    errors.push(
      diagnostic(
        'PE010',
        integration.manifestPath,
        'AI 指引校验没有接入任何总质量门禁。',
        `在 ${(integration.qualityScripts ?? []).join(' 或 ')} 中调用 ${integration.aiCheckScript}。`,
      ),
    )
  }

  return errors
}

// 模板源文件与 init 前的领域草稿按设计保留占位符；对应状态标记 initialized 后必须完成替换。
function keepsPlaceholdersByDesign(file, profileState) {
  if (file.startsWith('.agents/skills/') && file.includes('/templates/')) return true
  if (file === 'docs/PROJECT_PROFILE.md') return profileState?.status !== 'initialized'
  if (file === 'docs/rules/AI_COMPONENT_CATALOG.md') {
    return profileState?.componentCatalog?.status !== 'initialized'
  }
  return false
}

function parseJsonRecord(text) {
  if (!text?.trim()) return null
  try {
    const record = JSON.parse(text)
    return record && !Array.isArray(record) ? record : null
  } catch {
    return null
  }
}

function diagnostic(code, file, message, hint = '') {
  return { code, file, hint, message }
}

function collectMarkdownAnchors(content) {
  const anchors = new Set()
  const duplicates = new Map()

  for (const match of content.matchAll(/^#{1,6}\s+(.+?)\s*#*\s*$/gm)) {
    const base = match[1]
      .toLowerCase()
      .replace(/[`*_~[\]()]/g, '')
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .trim()
      .replace(/\s+/g, '-')
    const count = duplicates.get(base) ?? 0
    duplicates.set(base, count + 1)
    anchors.add(count === 0 ? base : `${base}-${count}`)
  }

  return anchors
}

function findPromptSectionEnd(content, bodyStart, defaultEnd) {
  const candidates = [defaultEnd]
  const precedingFences = content.slice(0, bodyStart).match(/```/g)?.length ?? 0
  if (precedingFences % 2 === 1) {
    const closingFence = content.indexOf('\n```', bodyStart)
    if (closingFence >= 0) candidates.push(closingFence)
  } else {
    const headingMatch = content.slice(bodyStart).match(/\n#{1,6}\s+/)
    if (headingMatch?.index !== undefined) candidates.push(bodyStart + headingMatch.index)
  }
  return Math.min(...candidates.filter((value) => value >= bodyStart))
}

function parseMarkdownDestination(rawValue) {
  const value = rawValue.trim()
  if (value.startsWith('<')) {
    const closingIndex = value.indexOf('>')
    return closingIndex >= 0 ? value.slice(1, closingIndex) : value
  }
  return value.match(/^(\S+)/)?.[1] ?? value
}

function readQuotedYamlValue(content, key) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return content.match(new RegExp(`^\\s+${escapedKey}:\\s*(['"])(.*?)\\1\\s*$`, 'm'))?.[2] ?? ''
}

function scriptReachesTarget(scripts, current, target, visited = new Set()) {
  if (current === target) return true
  if (visited.has(current) || !scripts[current]) return false

  const nextVisited = new Set(visited)
  nextVisited.add(current)
  return extractScriptCalls(scripts[current]).some((called) =>
    scriptReachesTarget(scripts, called, target, nextVisited),
  )
}

function extractScriptCalls(command) {
  const calls = []
  const pattern =
    /(?:^|&&|;)\s*(?:npm|pnpm|yarn|bun)\s+run\s+([\w:-]+)(?=\s|$|&&|\|\||;)/g
  for (const match of command.matchAll(pattern)) calls.push(match[1])
  return calls
}

function stripQuotes(value) {
  if (
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('"') && value.endsWith('"'))
  ) {
    return value.slice(1, -1)
  }
  return value
}

// —— 死引用执法（票 09：三类引用 + 分发视角；由 check-ai-guidance 在 --strict 下挂载）——

// 豁免登记表（Q2）：宿主级风格引用与历史否定式提及不按本仓名册执法。
const DEAD_REF_SKILL_EXEMPTIONS = new Set(['grill-me', 'bootstrap-project'])
// 整包原样 vendor 的 product-design 包内路径属模板/生成物上下文，不按本仓路径执法（票 08 整包原则）。
// 另登记上游断链/宿主路径（票 09 Q2 登记表）：compatibility-testing 引用未随包分发的兄弟技能与 qe-browser；
// tdd-workflow 引用宿主 ~/.claude 路径；react-best-practices 上游 AGENTS.md 引用未随包的规则文件。
const DEAD_REF_FILE_EXEMPTIONS = [
  /^\.agents\/skills\/product-design\//,
  /^\.agents\/skills\/(compatibility-testing|tdd-workflow|react-best-practices|playwright-cli)\//,
]
// 运行态产物：init 生成前不存在，文档引用合法。
const DEAD_REF_SKIP_PATHS = new Set(['.toolkit/profile-proposal.json'])
// ④ 豁免：README 自述双形态与剔除清单属分发说明（票 10 I4），其余随发文件禁引开发件路径。
const DIST_SELF_REFERENCE_DOCS = new Set(['README.md'])
// 消费者侧没有 toolkit.json 时回退内置默认（G10）。
const DEFAULT_DIST_EXCLUDES = ['scripts', 'toolkit.json', 'docs/wayfinder', '.serena', 'CONTRIBUTING.md', '.git']
// 锚定前缀不含 scripts/：vendored 技能包内 `scripts/...` 是包相对路径，按仓根执法必误报（G6「结构性排除 vendored 误报」）。
const DEAD_REF_ANCHOR_DIRS = ['.agents', '.claude', '.toolkit', 'docs', '.github']

export function validateDeadReferences(root, config = {}) {
  const errors = []
  const distExcludes = readDistExcludes(root)
  const roster = collectSkillRoster(root)
  const external = new Set(config.externalSkills ?? [])
  const knownSkills = (name) => roster.has(name) || external.has(name)

  for (const rel of collectDeadRefFiles(root)) {
    const content = stripFencedBlocks(readFileSync(resolve(root, rel), 'utf8'))
    const isDevOnly = underAny(distExcludes, rel)

    // ①a markdown 链接：相对引用文件所在目录解析，`/` 开头按仓库根。
    for (const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const destination = parseMarkdownDestination(match[1])
      const target = destination.split('#', 2)[0]
      if (!target || /^[a-z][a-z\d+.-]*:/i.test(target)) continue
      let decoded
      try {
        decoded = decodeURIComponent(target)
      } catch {
        continue
      }
      const candidates = decoded.startsWith('/')
        ? [resolve(root, `.${decoded}`)]
        : [resolve(root, dirname(rel), decoded)]
      if (rel.includes('/templates/')) candidates.push(resolve(root, decoded)) // 模板按实例化位置（仓库根）兜底
      if (!candidates.some((candidate) => existsSync(candidate) || pathFieldExists(candidate))) {
        errors.push(
          diagnostic('PE017', rel, `死引用：链接目标不存在 ${target}`, '修正路径或补充目标文件。'),
        )
      }
    }

    // ①b 锚定反引号路径（G6）+ ④ 分发视角（随发文件禁引剔除清单路径）。
    for (const match of content.matchAll(/`([^`\n]+)`/g)) {
      const value = match[1].trim()
      if (value.includes(' ') || value.startsWith('~') || value.startsWith('$')) continue
      if (value.includes('...')) continue
      if (!/^[\w@./-]+$/.test(value)) continue
      if (DEAD_REF_SKIP_PATHS.has(value)) continue
      if (/[*{}<>[\]]/.test(value)) continue
      if (/^[a-z][a-z\d+.-]*:/i.test(value)) continue

      const distHit = distExcludes.find(
        (entry) => value === entry || value.startsWith(`${entry}/`),
      )
      if (distHit) {
        if (isDevOnly || DIST_SELF_REFERENCE_DOCS.has(rel)) continue
        if (existsSync(resolve(root, dirname(rel), value))) continue
        errors.push(
          diagnostic(
            'PE019',
            rel,
            `分发文件引用了开发件路径：${value}`,
            '消费者副本中不存在该路径；改用随发路径，或把说明移入 README/CONTRIBUTING。',
          ),
        )
        continue
      }

      const anchored =
        value.startsWith('/') ||
        DEAD_REF_ANCHOR_DIRS.some((dir) => value === dir || value.startsWith(`${dir}/`))
      if (!anchored || !value.includes('/')) continue
      const segments = value.split('/').filter(Boolean)
      if (segments.length < 2 && !/\.\w+$/.test(value)) continue // `/g`、`/name` 等单段形态不按路径执法
      const base = value.startsWith('/') ? resolve(root, `.${value}`) : resolve(root, value)
      if (!existsSync(base) && !pathFieldExists(base)) {
        errors.push(
          diagnostic('PE017', rel, `死引用：路径不存在 ${value}`, '修正路径或补充目标文件。'),
        )
      }
    }

    // ② .mjs/.json 路径型字符串字面量：含 `/` 且解析落仓内；叙述性纯文本不扫。
    if (/\.(mjs|json)$/.test(rel)) {
      for (const match of content.matchAll(/(['"])([^'"`\n]+)\1/g)) {
        const value = match[2]
        if (!value.includes('/') || /\s/.test(value) || /[*{}<>$~]/.test(value)) continue
        if (value.includes('...')) continue
        if (!/^[\w@./-]+$/.test(value)) continue
        if (DEAD_REF_SKIP_PATHS.has(value) || distExcludes.includes(value)) continue
        if (/^[a-z][a-z\d+.-]*:/i.test(value)) continue
        const local = value.startsWith('./') || value.startsWith('../')
        if (!local && value.split('/').filter(Boolean).length < 2) continue // 单段裸词多为配置值；`./x.mjs` 相对导入仍查
        const skillRoot = rel.startsWith('.agents/skills/')
          ? resolve(root, rel.split('/').slice(0, 3).join('/'))
          : null
        const candidates = local
          ? [resolve(root, dirname(rel), value)]
          : [resolve(root, value), resolve(root, dirname(rel), value)]
        if (skillRoot) candidates.push(resolve(skillRoot, value))
        if (!candidates.some((candidate) => existsSync(candidate) || pathFieldExists(candidate))) {
          errors.push(
            diagnostic('PE017', rel, `死引用：字符串路径不存在 ${value}`, '修正字符串或补充目标文件。'),
          )
        }
      }
    }

    // ③ 技能调用引用：裸 $name（小写起，shell 变量结构排除）/`/name` 必须命中名册；ns 与登记表豁免。
    if (/\.(md|ya?ml)$/.test(rel)) {
      for (const match of content.matchAll(/\$([a-z][\w-]*)(:)?/g)) {
        const [, name, namespaced] = match
        if (namespaced || DEAD_REF_SKILL_EXEMPTIONS.has(name) || knownSkills(name)) continue
        errors.push(
          diagnostic(
            'PE018',
            rel,
            `技能引用未命中内置名册：$${name}`,
            '改为 .agents/skills/*/SKILL.md frontmatter name，或使用命名空间/插件引用。',
          ),
        )
      }
      for (const match of content.matchAll(/`\/([a-z][\w-]*)`/g)) {
        if (!match[1].includes('-')) continue // `/g`、`/plan` 等正则/命令片段排除；技能名均含连字符
        if (DEAD_REF_SKILL_EXEMPTIONS.has(match[1]) || knownSkills(match[1])) continue
        errors.push(
          diagnostic(
            'PE018',
            rel,
            `技能引用未命中内置名册：/${match[1]}`,
            '改为 .agents/skills/*/SKILL.md frontmatter name，或使用命名空间/插件引用。',
          ),
        )
      }
      // ③+ 跨技能调用惯用语（"Call the Skill tool with X"）：X 必须命中名册或外部声明（全局/插件提供）。
      for (const match of content.matchAll(/Call the Skill tool with ["'`]?([a-z][\w-]*)/gi)) {
        if (DEAD_REF_SKILL_EXEMPTIONS.has(match[1]) || knownSkills(match[1])) continue
        errors.push(
          diagnostic(
            'PE018',
            rel,
            `技能调用依赖未命中：${match[1]}`,
            '补齐被依赖技能，或在 .toolkit/ai-guidance.config.mjs 的 externalSkills 登记为全局/插件提供。',
          ),
        )
      }
    }
  }

  return errors
}

function readDistExcludes(root) {
  try {
    const toolkit = JSON.parse(readFileSync(resolve(root, 'toolkit.json'), 'utf8'))
    if (Array.isArray(toolkit.distExcludes) && toolkit.distExcludes.length > 0) {
      return toolkit.distExcludes
    }
  } catch {
    // 消费者侧没有 toolkit.json：回退内置默认。
  }
  return DEFAULT_DIST_EXCLUDES
}

function collectSkillRoster(root) {
  const roster = new Set()
  const skillsDir = resolve(root, '.agents/skills')
  if (!existsSync(skillsDir)) return roster
  for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const skillPath = resolve(skillsDir, entry.name, 'SKILL.md')
    if (!existsSync(skillPath)) continue
    const name = parseSkillFrontmatter(readFileSync(skillPath, 'utf8')).name
    roster.add(name || entry.name)
  }
  return roster
}

// 扫描面（G7）：根四件 + docs/**/*.md + .agents/skills 层 md/yaml/json + .toolkit mjs/json；镜像与 wayfinder 豁免。
function collectDeadRefFiles(root) {
  const files = []
  for (const name of ['AGENTS.md', 'CLAUDE.md', 'README.md', 'CONTRIBUTING.md']) {
    if (existsSync(resolve(root, name))) files.push(name)
  }
  const walk = (dirRel, fileFilter) => {
    const dirAbs = resolve(root, dirRel)
    if (!existsSync(dirAbs)) return
    for (const entry of readdirSync(dirAbs, { withFileTypes: true })) {
      const rel = `${dirRel}/${entry.name}`
      if (entry.isDirectory()) {
        if (rel === 'docs/wayfinder') continue
        walk(rel, fileFilter)
      } else if (fileFilter.test(entry.name)) {
        files.push(rel)
      }
    }
  }
  walk('docs', /\.md$/)
  walk('.agents', /\.(md|ya?ml|json)$/)
  walk('.toolkit', /\.(mjs|json)$/)
  return files.filter((rel) => !DEAD_REF_FILE_EXEMPTIONS.some((pattern) => pattern.test(rel)))
}

function underAny(excludes, rel) {
  const normalized = rel.replace(/\\/g, '/')
  return excludes.some((entry) => {
    const base = entry.replace(/\/$/, '')
    return normalized === base || normalized.startsWith(`${base}/`)
  })
}

function pathFieldExists(candidate) {
  // `.toolkit/profile-state.json.deliveryTargets` 一类「文件.字段」复合引用：剥掉字段后缀再查。
  const stripped = candidate.replace(/\.[^./\\]+$/, '')
  return stripped !== candidate && existsSync(stripped)
}

function stripFencedBlocks(content) {
  const lines = content.split(/\r?\n/)
  let fenced = false
  return lines
    .filter((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        fenced = !fenced
        return false
      }
      return !fenced
    })
    .join('\n')
}
