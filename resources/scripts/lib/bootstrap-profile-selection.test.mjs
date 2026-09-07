import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const toolkit = JSON.parse(readFileSync(resolve(root, 'resources/toolkit.json'), 'utf8'))
const selection = readFileSync(resolve(root, '.agents/skills/bootstrap-project/references/profile-selection.md'), 'utf8')
const confirmation = readFileSync(resolve(root, '.agents/skills/bootstrap-project/references/confirmation-flow.md'), 'utf8')
const state = readFileSync(resolve(root, '.agents/skills/bootstrap-project/references/state-model.md'), 'utf8')

test('profile candidates are all discoverable even without framework evidence', () => {
  assert.deepEqual(Object.keys(toolkit.profiles).sort(), ['generic', 'react', 'vue'])
  for (const profilePath of Object.values(toolkit.profiles)) {
    assert.equal(existsSync(resolve(root, profilePath)), true, profilePath)
  }
  assert.match(selection, /展示所有可用候选/)
  assert.match(selection, /recommended.*不等于.*selected/)
  assert.match(selection, /generic、React、Vue 或明确暂缓/)
})

test('template choice and profile completeness remain separate states', () => {
  assert.match(confirmation, /模板选择状态单独记录为 `pending`、`user-confirmed`、`inferred-only` 或 `conflict`/)
  assert.match(state, /templateSelection\.status: pending \| user-confirmed \| inferred-only \| conflict/)
  assert.match(state, /"selected": null/)
  assert.match(state, /"profileStatus": "draft"/)
})

test('missing templates are reported instead of substituted', () => {
  assert.match(selection, /模板文件缺失或不可读时报告具体缺口/)
  assert.match(selection, /不能把 generic 草案写成已选择的模板/)
})
