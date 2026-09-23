#!/usr/bin/env node

const fs = require('node:fs');
const https = require('node:https');
const path = require('node:path');

const TINYPNG_HOST = 'api.tinify.com';
const DEFAULT_EXTENSIONS = ['.png', '.jpg', '.jpeg'/* , '.webp' */]; //webp api报错
const DEFAULT_TARGET = 'src/assets/imgs';
const DEFAULT_SKIP_DIRS = new Set([
  '.cache',
  '.git',
  '.next',
  '.nuxt',
  '.turbo',
  'build',
  'coverage',
  'dist',
  'node_modules'
]);

function printUsage() {
  console.log(`
TinyPNG batch image compression

Usage:
  node scripts/tinypng-compress.cjs <targetDir> [options]

Environment:
  TINYPNG_API_KEY          Read from project .env or shell; required unless --dry-run is used.

Options:
  --passes <number>       Compression passes per file. Default: 2.
  --extensions <list>     Comma-separated extensions. Default: png,jpg,jpeg,webp.
  --track-file <path>     Compression tracking JSON file.
  --dry-run               List files without uploading or writing.
  --force                 Ignore tracking file and recompress matched files.
  --no-recursive          Only scan the target directory, not child folders.
  -h, --help              Show this help.

Examples:
  node scripts/tinypng-compress.cjs src/assets/imgs/mall --dry-run
  node scripts/tinypng-compress.cjs src/assets/imgs/mall --passes 2
  node scripts/tinypng-compress.cjs src/assets/preload --extensions png,jpg,jpeg,webp --dry-run
`);
}

function readOptionValue(argv, index, optionName) {
  const value = argv[index + 1];

  if (!value || value.startsWith('--')) {
    throw new Error(`${optionName} requires a value`);
  }

  return value;
}

function normalizeExtensions(value) {
  return value
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean)
    .map(item => (item.startsWith('.') ? item : `.${item}`));
}

function parsePositiveInteger(value, name) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer`);
  }

  return parsed;
}

function parseArgs(argv) {
  const options = {
    dryRun: false,
    extensions: DEFAULT_EXTENSIONS,
    force: false,
    help: false,
    passes: 2,
    recursive: true,
    targetDir: null,
    trackFile: null
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '-h' || arg === '--help') {
      options.help = true;
      continue;
    }

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg === '--force') {
      options.force = true;
      continue;
    }

    if (arg === '--no-recursive') {
      options.recursive = false;
      continue;
    }

    if (arg === '--passes') {
      const value = readOptionValue(argv, index, arg);
      options.passes = parsePositiveInteger(value, arg);
      index += 1;
      continue;
    }

    if (arg === '--extensions') {
      const value = readOptionValue(argv, index, arg);
      options.extensions = normalizeExtensions(value);

      if (!options.extensions.length) {
        throw new Error('--extensions must include at least one extension');
      }

      index += 1;
      continue;
    }

    if (arg === '--track-file') {
      options.trackFile = readOptionValue(argv, index, arg);
      index += 1;
      continue;
    }

    if (arg.startsWith('--')) {
      throw new Error(`Unknown option: ${arg}`);
    }

    if (options.targetDir) {
      throw new Error(`Unexpected positional argument: ${arg}`);
    }

    options.targetDir = arg;
  }

  if (!options.targetDir && fs.existsSync(DEFAULT_TARGET)) {
    options.targetDir = DEFAULT_TARGET;
  }

  return options;
}

function ensureInsideProject(targetPath, label) {
  const cwd = path.resolve(process.cwd());
  const resolved = path.resolve(process.cwd(), targetPath);
  const relative = path.relative(cwd, resolved);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${label} must be inside current project: ${resolved}`);
  }

  return resolved;
}

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    throw new Error(`Target directory does not exist: ${dir}`);
  }

  if (!fs.statSync(dir).isDirectory()) {
    throw new Error(`Target path is not a directory: ${dir}`);
  }
}

function toTrackKey(rootDir, filePath) {
  return path.relative(rootDir, filePath).split(path.sep).join('/');
}

function getImageFiles(dir, options, rootDir = dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      if (options.recursive && !DEFAULT_SKIP_DIRS.has(item.name)) {
        files.push(...getImageFiles(fullPath, options, rootDir));
      }
      continue;
    }

    if (!item.isFile()) {
      continue;
    }

    const extension = path.extname(item.name).toLowerCase();

    if (options.extensions.includes(extension)) {
      files.push(fullPath);
    }
  }

  return files.sort((first, second) => toTrackKey(rootDir, first).localeCompare(toTrackKey(rootDir, second)));
}

function loadCompressedMap(trackFile) {
  if (!fs.existsSync(trackFile)) {
    return {};
  }

  const raw = fs.readFileSync(trackFile, 'utf8');

  if (!raw.trim()) {
    return {};
  }

  const parsed = JSON.parse(raw);

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`Invalid tracking file: ${trackFile}`);
  }

  return parsed;
}

function saveCompressedMap(trackFile, compressedMap) {
  fs.mkdirSync(path.dirname(trackFile), { recursive: true });
  fs.writeFileSync(trackFile, `${JSON.stringify(compressedMap, null, 2)}\n`);
}

function stripEnvQuotes(value) {
  const trimmed = value.trim();
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];

  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function loadProjectEnv() {
  const envPath = path.resolve(process.cwd(), '.env');

  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const index = trimmed.indexOf('=');

    if (index <= 0) {
      continue;
    }

    const key = trimmed.slice(0, index).trim();
    const value = stripEnvQuotes(trimmed.slice(index + 1));

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function getApiKey() {
  const apiKey = process.env.TINYPNG_API_KEY;

  if (!apiKey) {
    throw new Error('Missing TINYPNG_API_KEY. Add it to .env or set it in the current shell.');
  }

  return apiKey;
}

function parseApiResponse(body, statusCode) {
  try {
    return JSON.parse(body);
  } catch (_error) {
    throw new Error(`TinyPNG returned invalid JSON (${statusCode}): ${body}`);
  }
}

function tinypngCompressOnce(inputPath, apiKey) {
  return new Promise((resolve, reject) => {
    const inputBuffer = fs.readFileSync(inputPath);
    const inputSize = inputBuffer.length;

    const req = https.request(
      {
        auth: `api:${apiKey}`,
        headers: {
          'Content-Type': 'application/octet-stream'
        },
        hostname: TINYPNG_HOST,
        method: 'POST',
        path: '/shrink'
      },
      res => {
        const chunks = [];

        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString();
          let result;

          try {
            result = parseApiResponse(body, res.statusCode);
          } catch (error) {
            reject(error);
            return;
          }

          if (res.statusCode === 201 && res.headers.location) {
            resolve({
              inputSize,
              outputSize: result.output?.size || 0,
              outputUrl: res.headers.location
            });
            return;
          }

          const message = result.message || result.error || body;
          reject(new Error(`TinyPNG API error (${res.statusCode}): ${message}`));
        });
      }
    );

    req.on('error', reject);
    req.write(inputBuffer);
    req.end();
  });
}

function downloadResult(outputUrl) {
  return new Promise((resolve, reject) => {
    https
      .get(outputUrl, res => {
        const chunks = [];

        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`Download failed (${res.statusCode}) from ${outputUrl}`));
            return;
          }

          resolve(Buffer.concat(chunks));
        });
      })
      .on('error', reject);
  });
}

function formatSize(size) {
  if (size >= 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
  }

  return `${(size / 1024).toFixed(1)} KB`;
}

function formatRatio(inputSize, outputSize) {
  if (inputSize === 0) {
    return '0.0%';
  }

  return `${((1 - outputSize / inputSize) * 100).toFixed(1)}%`;
}

async function compressFile(filePath, options, apiKey) {
  const originalSize = fs.statSync(filePath).size;
  let finalSize = originalSize;

  for (let pass = 1; pass <= options.passes; pass += 1) {
    process.stdout.write(`  pass ${pass}/${options.passes}... `);

    const { inputSize, outputSize, outputUrl } = await tinypngCompressOnce(filePath, apiKey);
    const data = await downloadResult(outputUrl);
    fs.writeFileSync(filePath, data);

    finalSize = data.length || outputSize;
    console.log(`${formatSize(inputSize)} -> ${formatSize(finalSize)} (-${formatRatio(inputSize, finalSize)})`);
  }

  return {
    finalSize,
    originalSize,
    ratio: formatRatio(originalSize, finalSize)
  };
}

async function main() {
  loadProjectEnv();

  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    return;
  }

  if (!options.targetDir) {
    printUsage();
    throw new Error(`No target directory provided and default "${DEFAULT_TARGET}" does not exist`);
  }

  const targetDir = ensureInsideProject(options.targetDir, 'Target directory');
  ensureDirectory(targetDir);

  const trackFile = options.trackFile
    ? ensureInsideProject(options.trackFile, 'Tracking file')
    : path.join(targetDir, '.tinypng-compressed.json');
  const imageFiles = getImageFiles(targetDir, options, targetDir);
  const compressedMap = loadCompressedMap(trackFile);
  const skipped = [];
  const toCompress = [];

  for (const file of imageFiles) {
    const key = toTrackKey(targetDir, file);
    const currentSize = fs.statSync(file).size;

    if (!options.force && compressedMap[key] === currentSize) {
      skipped.push(file);
    } else {
      toCompress.push(file);
    }
  }

  console.log('TinyPNG batch image compression');
  console.log(`Target: ${targetDir}`);
  console.log(`Extensions: ${options.extensions.join(', ')}`);
  console.log(`Recursive: ${options.recursive ? 'yes' : 'no'}`);
  console.log(`Tracking: ${trackFile}`);
  console.log(`Matched: ${imageFiles.length}`);
  console.log(`Skipped: ${skipped.length}`);
  console.log(`Pending: ${toCompress.length}`);

  if (!toCompress.length) {
    console.log('Nothing to compress.');
    return;
  }

  if (options.dryRun) {
    console.log('\nDry run files:');
    for (const file of toCompress) {
      console.log(`- ${toTrackKey(targetDir, file)} (${formatSize(fs.statSync(file).size)})`);
    }
    return;
  }

  const apiKey = getApiKey();
  let totalOriginal = 0;
  let totalFinal = 0;

  for (let index = 0; index < toCompress.length; index += 1) {
    const file = toCompress[index];
    const key = toTrackKey(targetDir, file);
    const size = fs.statSync(file).size;

    console.log(`\n[${index + 1}/${toCompress.length}] ${key} (${formatSize(size)})`);
    const startedAt = Date.now();
    const result = await compressFile(file, options, apiKey);
    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

    totalOriginal += result.originalSize;
    totalFinal += result.finalSize;
    compressedMap[key] = result.finalSize;
    saveCompressedMap(trackFile, compressedMap);

    console.log(`  total: ${formatSize(result.originalSize)} -> ${formatSize(result.finalSize)} (-${result.ratio}), ${elapsed}s`);
  }

  console.log('\nDone.');
  console.log(`Compressed files: ${toCompress.length}`);
  console.log(`Original size: ${formatSize(totalOriginal)}`);
  console.log(`Final size: ${formatSize(totalFinal)}`);
  console.log(`Saved: ${formatRatio(totalOriginal, totalFinal)}`);
}

main().catch(error => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
