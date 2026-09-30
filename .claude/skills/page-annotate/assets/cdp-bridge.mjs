#!/usr/bin/env node
// cdp-bridge.mjs —— $page-annotate 的 Codex 宿主通道：可见 Chrome 启动/连接 + CDP evaluate（注入与读回）
// 零依赖：Node ≥22（内置 fetch 与全局 WebSocket）。
// 用法：
//   node cdp-bridge.mjs launch [--url <url>] [--port <port>] [--chrome <chrome路径>]  启动可见 Chrome（一次性 profile），输出 {ok,port,targetId,url}
//   node cdp-bridge.mjs eval   --port <p> [--target-id <id>] --expr "<js>"             evaluate 表达式（returnByValue），输出 {ok,value}
//   node cdp-bridge.mjs inject --port <p> --file <page-picker.js>                     注入脚本全文（自动 IIFE 包装顶层 return），输出 {ok,value}
//   node cdp-bridge.mjs read   --port <p>                                             输出 __picker.read() 的 JSON（未注入则报错退出）
//   node cdp-bridge.mjs user-port                                                    输出用户 Chrome 的 DevToolsActivePort 端口（用户轨；待实测）
// 依据 2026-09-30 codex exec 实测：宿主 browser 工具不注入 exec 会话，shell+CDP 为正式通道；
//   顶层 return 裸 evaluate 会 SyntaxError（本脚本 inject 自动包装）；全新 profile 首启 chrome://intro
//   抢 URL 且 /json/new 对 file:// 拒载（本脚本统一开空 tab 后 Page.navigate 规避，实测坑）。一次性 profile 落在系统临时目录，会话结束可清理。
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, mkdtempSync } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const argv = process.argv.slice(2);
const cmd = argv[0];
const opt = (name, def) => { const i = argv.indexOf(name); return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : def; };
const die = (msg) => { console.error(String(msg)); process.exit(1); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const base = (port) => `http://127.0.0.1:${port}`;

const findChrome = () => {
  const cands = [
    process.env.CHROME_PATH,
    join(process.env.ProgramFiles || '', 'Google/Chrome/Application/chrome.exe'),
    join(process.env['ProgramFiles(x86)'] || '', 'Google/Chrome/Application/chrome.exe'),
    join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  return cands.find((p) => existsSync(p)) || null;
};

const freePort = () => new Promise((res) => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });

const waitReady = async (port) => {
  for (let i = 0; i < 40; i++) {
    try { await fetch(`${base(port)}/json/version`); return true; } catch { await sleep(250); }
  }
  return false;
};

const pageTarget = async (port, targetId) => {
  const list = await (await fetch(`${base(port)}/json`)).json();
  const pages = list.filter((t) => t.type === 'page');
  if (!pages.length) return null;
  if (targetId) return pages.find((t) => t.id === targetId) || null;
  return pages.find((t) => !String(t.url).startsWith('chrome://')) || pages[0];
};

const openWs = (url) => new Promise((res, rej) => { const ws = new WebSocket(url); ws.onopen = () => res(ws); ws.onerror = () => rej(new Error('WebSocket 连接失败')); });
const cdp = (ws) => {
  let seq = 0;
  return (method, params) => new Promise((res, rej) => {
    const id = ++seq;
    const onmsg = (ev) => { const m = JSON.parse(ev.data); if (m.id === id) { ws.removeEventListener('message', onmsg); res(m); } };
    ws.addEventListener('message', onmsg);
    ws.send(JSON.stringify({ id, method, params: params || {} }));
    setTimeout(() => { ws.removeEventListener('message', onmsg); rej(new Error(method + ' 超时（30s）')); }, 30000);
  });
};
const evaluate = async (port, expression, targetId) => {
  const t = await pageTarget(port, targetId);
  if (!t) die(`调试口 ${port} 上没有可用 page 目标`);
  const ws = await openWs(t.webSocketDebuggerUrl).catch((e) => die(e.message));
  const msg = await cdp(ws)('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }).catch((e) => { try { ws.close(); } catch {} die(e.message); });
  try { ws.close(); } catch {}
  if (msg.error) die('CDP 错误：' + JSON.stringify(msg.error));
  if (msg.result.exceptionDetails) die('页面异常：' + JSON.stringify(msg.result.exceptionDetails).slice(0, 600));
  return msg.result.result;
};

if (cmd === 'launch') {
  const chrome = opt('--chrome') || findChrome();
  if (!chrome) die('未找到 Chrome（用 --chrome 指定路径，或设 CHROME_PATH）');
  const port = Number(opt('--port', '')) || (await freePort());
  const profile = mkdtempSync(join(tmpdir(), 'pa-chrome-'));
  const child = spawn(chrome, ['--new-window', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check'], { detached: true, stdio: 'ignore' });
  child.unref();
  if (!(await waitReady(port))) die('Chrome 10s 内未开放调试口');
  const url = opt('--url', 'about:blank');
  // 统一开空 tab 后 Page.navigate（/json/new 带 url 对 file:// 拒载、新 profile 首启 intro 抢 URL，均为实测坑），再等 readyState
  const t = await (await fetch(`${base(port)}/json/new`, { method: 'PUT' })).json();
  const ws = await openWs(t.webSocketDebuggerUrl).catch((e) => die(e.message));
  await cdp(ws)('Page.navigate', { url }).catch((e) => { try { ws.close(); } catch {} die(e.message); });
  for (let i = 0; i < 40; i++) {
    const st = await cdp(ws)('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true }).catch(() => null);
    if (st && st.result && st.result.result && st.result.result.value === 'complete') break;
    await sleep(250);
  }
  try { ws.close(); } catch {}
  console.log(JSON.stringify({ ok: true, port, targetId: t.id, url }));
} else if (cmd === 'eval') {
  const port = Number(opt('--port', '')) || die('--port 必填');
  const expr = opt('--expr'); if (!expr) die('--expr 必填');
  const r = await evaluate(port, expr, opt('--target-id'));
  console.log(JSON.stringify({ ok: true, value: r.value === undefined ? null : r.value }));
} else if (cmd === 'inject') {
  const port = Number(opt('--port', '')) || die('--port 必填');
  const file = opt('--file'); if (!file) die('--file 必填');
  const src = readFileSync(file, 'utf8');
  const r = await evaluate(port, `(function(){\n${src}\n})()`, opt('--target-id'));
  console.log(JSON.stringify({ ok: true, value: r.value === undefined ? null : r.value }));
} else if (cmd === 'read') {
  const port = Number(opt('--port', '')) || die('--port 必填');
  const r = await evaluate(port, 'window.__picker ? JSON.stringify(window.__picker.read()) : null', opt('--target-id'));
  if (r.value === null || r.value === undefined) die('page-picker 未注入（先跑 inject）');
  console.log(r.value);
} else if (cmd === 'user-port') {
  const p = join(process.env.LOCALAPPDATA || '', 'Google/Chrome/User Data/DevToolsActivePort');
  if (!existsSync(p)) die('未找到 DevToolsActivePort（用户 Chrome 的 remote-debugging toggle 未开？）');
  console.log(readFileSync(p, 'utf8').trim().split(/\r?\n/)[0]);
} else {
  die('未知命令。用法见文件头注释：launch / eval / inject / read / user-port');
}
