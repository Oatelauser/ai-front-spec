// F4 回归：cdp 请求成功/错误/超时/断连后不得残留 timer 或监听器。
// 用 process.getActiveResourcesInfo() 的 Timeout 计数做资源级断言——比 unref/“感觉快了”强：
// timer 未清理 = 资源残留 = 进程要多活到超时为止。
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { cdp } from '../../.agents/skills/page-annotate/assets/cdp-bridge.mjs'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const timeoutCount = () => process.getActiveResourcesInfo().filter((r) => r === 'Timeout').length

class FakeWs {
  constructor() {
    this.listeners = new Map()
    this.sent = []
  }
  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set())
    this.listeners.get(type).add(fn)
  }
  removeEventListener(type, fn) { this.listeners.get(type)?.delete(fn) }
  listenerCount(type) { return this.listeners.get(type)?.size ?? 0 }
  dispatch(type, ev = {}) { for (const fn of [...(this.listeners.get(type) ?? [])]) fn(ev) }
  send(payload) { this.sent.push(JSON.parse(payload)) }
  // 收到请求后同步回一个成功响应
  reply({ id }) { this.dispatch('message', { data: JSON.stringify({ id, result: { result: { value: id } } }) }) }
}

describe('cdp 请求生命周期（F4）', () => {
  it('即时响应：resolve 后 Timeout 资源归零、监听器全部移除', async () => {
    const ws = new FakeWs()
    const before = timeoutCount()
    const origSend = ws.send.bind(ws)
    ws.send = (payload) => { origSend(payload); ws.reply(JSON.parse(payload)) }
    const request = cdp(ws, 120)
    const started = Date.now()
    const msg = await request('Runtime.evaluate', {})
    assert.ok(Date.now() - started < 80, '即时响应不应等待')
    assert.equal(msg.result.result.value, 1)
    assert.equal(timeoutCount(), before, '成功后仍残留 Timeout（30s timer 未清理）')
    assert.equal(ws.listenerCount('message'), 0)
    assert.equal(ws.listenerCount('close'), 0)
    assert.equal(ws.listenerCount('error'), 0)
  })

  it('无响应：按设定时长真正超时并清理监听器', async () => {
    const ws = new FakeWs()
    const before = timeoutCount()
    const started = Date.now()
    await assert.rejects(cdp(ws, 150)('Runtime.evaluate', {}), /超时/)
    const elapsed = Date.now() - started
    assert.ok(elapsed >= 145, `应等到超时时长，实际 ${elapsed}ms`)
    assert.ok(elapsed < 5000, '超时不应被无限拉长')
    assert.equal(timeoutCount(), before, '超时触发后不得再残留 Timeout')
    assert.equal(ws.listenerCount('message'), 0)
    assert.ok(ws.sent.length === 1 && ws.sent[0].id === 1, '请求应已发出且带 id')
  })

  it('连接关闭：立即拒绝（不等超时）且清理 timer 与监听器', async () => {
    const ws = new FakeWs()
    const before = timeoutCount()
    const started = Date.now()
    const request = cdp(ws, 500)('Runtime.evaluate', {})
    setTimeout(() => ws.dispatch('close'), 40)
    await assert.rejects(request, /连接已关闭/)
    assert.ok(Date.now() - started < 450, '断连应立即拒绝，而非等超时')
    assert.equal(timeoutCount(), before, '断连清理后不得残留 Timeout')
    assert.equal(ws.listenerCount('message'), 0)
    assert.equal(ws.listenerCount('close'), 0)
  })

  it('连接错误：立即拒绝且清理 timer 与监听器', async () => {
    const ws = new FakeWs()
    const before = timeoutCount()
    const request = cdp(ws, 500)('Runtime.evaluate', {})
    setTimeout(() => ws.dispatch('error'), 20)
    await assert.rejects(request, /连接错误/)
    assert.equal(timeoutCount(), before, '错误清理后不得残留 Timeout')
    assert.equal(ws.listenerCount('message'), 0)
    assert.equal(ws.listenerCount('error'), 0)
  })

  it('成功后连接再关闭不产生迟到的伪拒绝', async () => {
    const ws = new FakeWs()
    const origSend = ws.send.bind(ws)
    ws.send = (payload) => { origSend(payload); ws.reply(JSON.parse(payload)) }
    const request = cdp(ws, 100)
    await request('Runtime.evaluate', {})
    ws.dispatch('close')
    await sleep(150)
    // 若 close 监听器未移除，会对已 settle 的 promise 调 rej——本身无害，但监听器残留会被上面计数断言抓住；
    // 这里锁定的是导出契约：cdp 默认 30s 超时可在测试中注入。
    assert.equal(ws.listenerCount('close'), 0)
  })

  it('send 同步抛错：以原始异常拒绝，Timeout 与三监听器全部清理', async () => {
    const ws = new FakeWs()
    ws.send = () => { throw new Error('send 同步失败') }
    const before = timeoutCount()
    const started = Date.now()
    await assert.rejects(cdp(ws, 400)('Runtime.evaluate', {}), /send 同步失败/)
    assert.ok(Date.now() - started < 350, '同步抛错应立即拒绝，不等超时')
    assert.equal(timeoutCount(), before, 'send 抛错后仍残留 Timeout')
    assert.equal(ws.listenerCount('message'), 0)
    assert.equal(ws.listenerCount('close'), 0)
    assert.equal(ws.listenerCount('error'), 0)
  })

  it('参数不可序列化：以序列化异常拒绝，Timeout 与三监听器全部清理', async () => {
    const ws = new FakeWs()
    const before = timeoutCount()
    await assert.rejects(cdp(ws, 400)('Runtime.evaluate', { big: 1n }), /serialize|BigInt/i)
    assert.equal(timeoutCount(), before, '序列化失败后仍残留 Timeout')
    assert.equal(ws.listenerCount('message'), 0)
    assert.equal(ws.listenerCount('close'), 0)
    assert.equal(ws.listenerCount('error'), 0)
  })
})
