import { existsSync, readFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import {
  collectGuidanceErrors,
  validateDeadReferences,
  validateTaskRecords,
  validateDocumentedPackageScripts,
  validateLocalLinks,
} from './lib/ai-guidance-validation.mjs'

const scriptParent = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const defaultRoot = basename(scriptParent) === '.toolkit' ? resolve(scriptParent, '..') : scriptParent
let outputFormat = 'text'

try {
  const options = parseArguments(process.argv.slice(2))
  outputFormat = options.format
  const projectRoot = resolve(options.root ?? defaultRoot)
  const defaultConfig = existsSync(resolve(projectRoot, '.toolkit/ai-guidance.config.mjs'))
    ? '.toolkit/ai-guidance.config.mjs'
    : 'ai-guidance.config.mjs'
  const configPath = resolve(projectRoot, options.config ?? defaultConfig)

  if (!existsSync(configPath)) {
    printAndExit(
      [
        diagnostic(
          'PE000',
          configPath,
          '找不到 AI 指引配置文件。',
          '使用 --config 指定配置，或在项目根目录创建 ai-guidance.config.mjs。',
        ),
      ],
      options.format,
      2,
    )
  }

  const imported = await import(pathToFileURL(configPath).href)
  const config = {
    ...imported.default,
    allowPlaceholders: options.strict ? false : imported.default.allowPlaceholders,
    packageIntegration: {
      ...imported.default.packageIntegration,
      required:
        options.strict && imported.default.packageIntegration?.enabled !== false
          ? true
          : imported.default.packageIntegration?.required,
    },
  }
  const files = Object.fromEntries(
    config.requiredFiles.map((file) => {
      const absolutePath = resolve(projectRoot, file)
      return [file, existsSync(absolutePath) ? readFileSync(absolutePath, 'utf8') : '']
    }),
  )
  const packagePath = resolve(
    projectRoot,
    config.packageIntegration?.manifestPath ?? 'package.json',
  )
  const packageJson = existsSync(packagePath)
    ? JSON.parse(readFileSync(packagePath, 'utf8'))
    : undefined

  const errors = [
    ...collectGuidanceErrors({ config, files, packageJson }),
    ...validateLocalLinks({ files, root: projectRoot }),
    ...validateDocumentedPackageScripts({
      config,
      files,
      packageJson,
    }),
    ...(options.strict ? [...validateDeadReferences(projectRoot, config), ...validateTaskRecords(projectRoot)] : []),
  ]

  printAndExit(errors, options.format, errors.length > 0 ? 1 : 0, config.requiredFiles.length)
} catch (error) {
  printAndExit(
    [
      diagnostic(
        'PE000',
        '',
        `AI 指引校验器运行失败：${error instanceof Error ? error.message : String(error)}`,
        '检查配置文件、JSON/YAML 编码和脚本运行环境。',
      ),
    ],
    outputFormat,
    2,
  )
}

function parseArguments(args) {
  const options = { format: 'text', strict: false }

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]
    if (argument === '--strict') {
      options.strict = true
    } else if (argument === '--root' || argument === '--config' || argument === '--format') {
      const value = args[index + 1]
      if (!value) throw new Error(`${argument} 缺少参数`)
      const key = argument.slice(2)
      options[key] = value
      index += 1
    } else {
      throw new Error(`未知参数：${argument}`)
    }
  }

  if (!['text', 'json'].includes(options.format)) {
    throw new Error('--format 只支持 text 或 json')
  }

  return options
}

function printAndExit(errors, format, exitCode, checkedFiles = 0) {
  if (format === 'json') {
    console.log(JSON.stringify({ checkedFiles, errors, ok: errors.length === 0 }, null, 2))
  } else if (errors.length > 0) {
    console.error('AI guidance check failed:')
    errors.forEach((error) => {
      const location = error.file ? ` ${error.file}` : ''
      console.error(`- [${error.code}]${location}：${error.message}`)
      if (error.hint) console.error(`  建议：${error.hint}`)
    })
  } else {
    console.log(`AI guidance validated across ${checkedFiles} files.`)
  }

  process.exit(exitCode)
}

function diagnostic(code, file, message, hint = '') {
  return { code, file, hint, message }
}
