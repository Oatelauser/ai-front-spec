// 页面标注器 page-picker v2.6.2 —— $page-annotate 技能资产
// 注入方式：Read 本文件后，用 evaluate_script 以 `() => { <本文件内容> }` 形式注入目标页
// 依赖：window.__picker 单例（重复注入自动 destroy 旧实例，含遗留标注迁移）
// 交互模型：拖拽=自由框标注；吸附开时悬停出布局框、单击按框标注、Alt+滚轮爬梯选父/子；
//           点击标注区域内=取消；提交=锁定批次；已读标注自动变淡；编号全局递增
if (window.__picker && __picker.destroy) __picker.destroy();
const __legacy = (window.__picker && Array.isArray(__picker.state.marks)) ? __picker.state.marks.map(m => ({ rect: m.rect, read: m.read })) : (window.__pickerLegacy || []);
window.__pickerLegacy = undefined;
document.body.style.userSelect = 'none';
const COLORS = ['#0d9488', '#2563eb', '#d97706', '#7c3aed', '#dc2626', '#0891b2'];
const els = [];
const mk = (parent, styles) => { const d = document.createElement('div'); Object.assign(d.style, styles); parent.appendChild(d); els.push(d); return d; };
const band = mk(document.body, { position: 'fixed', display: 'none', pointerEvents: 'none', zIndex: 2147483646, border: '2px dashed #0d9488', background: 'rgba(13,148,136,.08)' });
const snapBox = mk(document.body, { position: 'fixed', display: 'none', pointerEvents: 'none', zIndex: 2147483646, border: '2px solid #0d9488', background: 'rgba(13,148,136,.12)', borderRadius: '4px' });
const hud = mk(document.body, { position: 'fixed', top: '16px', right: '16px', zIndex: 2147483647, background: 'rgba(15,23,42,.96)', color: '#e2e8f0', font: '12px/1.6 system-ui', padding: '0', borderRadius: '10px', boxShadow: '0 8px 28px rgba(0,0,0,.35)', pointerEvents: 'auto', cursor: 'grab', minWidth: '240px', border: '1px solid rgba(148,163,184,.15)' });
hud.innerHTML =
  '<div style="display:flex;align-items:center;gap:6px;padding:9px 12px 8px;border-bottom:1px solid rgba(148,163,184,.15)">' +
    '<span style="cursor:grab;letter-spacing:1px;color:#64748b;font-size:13px">⠿</span>' +
    '<span style="font-weight:600;font-size:13px;color:#f1f5f9">页面标注器</span>' +
    '<span style="margin-left:auto;font-size:10px;color:#475569;font-family:ui-monospace,monospace">v2.6.2</span>' +
  '</div>' +
  '<div style="padding:8px 12px;border-bottom:1px solid rgba(148,163,184,.12);color:#94a3b8">' +
    '<div><b style="color:#5eead4;font-weight:600">圈选</b> — 点击元素按布局框，或拖拽自由框</div>' +
    '<div><b style="color:#5eead4;font-weight:600">爬梯</b> — 悬停时 Alt+滚轮 选父/子元素</div>' +
    '<div><b style="color:#5eead4;font-weight:600">取消</b> — 点击标注区域内</div>' +
  '</div>' +
  '<div style="padding:7px 12px;border-bottom:1px solid rgba(148,163,184,.12)">' +
    '<button id="__psnap" title="悬停元素出边框，单击按布局框标注" style="margin:0;padding:4px 10px;border:1px solid rgba(37,99,235,.6);border-radius:6px;background:rgba(37,99,235,.2);color:#93c5fd;font:600 12px system-ui;cursor:pointer">吸附布局：开</button>' +
    '<span style="color:#64748b;font-size:11px;margin-left:8px">悬停时 Alt+滚轮=选父/子框</span>' +
  '</div>' +
  '<div style="padding:8px 12px;font-size:12px">' +
    '<span id="__pc" style="color:#f1f5f9;font-weight:600">尚无标注</span>' +
    '<span id="__ph" style="color:#5eead4;margin-left:6px"></span>' +
  '</div>' +
  '<div id="__pbtns" style="padding:0 12px 10px;display:flex;gap:8px">' +
    '<button id="__pu" style="flex:1;margin:0;padding:5px 0;border:1px solid rgba(94,234,212,.35);border-radius:6px;background:rgba(13,148,136,.18);color:#5eead4;font:600 12px system-ui;cursor:pointer">撤销</button>' +
    '<button id="__pcl" style="flex:1;margin:0;padding:5px 0;border:1px solid rgba(148,163,184,.3);border-radius:6px;background:transparent;color:#94a3b8;font:600 12px system-ui;cursor:pointer">清空</button>' +
    '<button id="__psub" style="flex:1;margin:0;padding:5px 0;border:1px solid rgba(217,119,6,.45);border-radius:6px;background:rgba(217,119,6,.2);color:#fbbf24;font:600 12px system-ui;cursor:pointer">提交</button>' +
  '</div>' +
  '<div id="__pfoot" style="padding:6px 12px 8px;border-top:1px solid rgba(148,163,184,.12);color:#475569;font-size:11px">标注完成后点「提交」，回对话说「读」</div>';
const state = { marks: [], snap: true, committed: false };
const listeners = [];
const on = (evt, fn, opt) => { document.addEventListener(evt, fn, opt); listeners.push([evt, fn, opt]); };
const toPage = (x, y) => ({ x: x + window.scrollX, y: y + window.scrollY });
const contains = (m, px, py) => px >= m.rect.x && px <= m.rect.x + m.rect.w && py >= m.rect.y && py <= m.rect.y + m.rect.h;
const $ = (id) => document.getElementById(id);
const setCount = () => { $('__pc').textContent = state.marks.length ? '已标注 ' + state.marks.length + ' 处' : '尚无标注'; };
const recolor = () => { state.marks.forEach((mm, k) => { const c = COLORS[k % COLORS.length]; mm.tag.textContent = k + 1; mm.ov.style.background = c + '1f'; mm.ov.style.border = '2px solid ' + c; mm.color = c; mm.ov.style.opacity = mm.read ? '.5' : '1'; mm.tag.style.opacity = mm.read ? '.5' : '1'; }); };
const makeMark = (rect) => {
  if (rect.w < 12 || rect.h < 12) return false;
  const color = COLORS[state.marks.length % COLORS.length];
  const ov = mk(document.body, { position: 'absolute', left: rect.x + 'px', top: rect.y + 'px', width: rect.w + 'px', height: rect.h + 'px', zIndex: 2147483645, pointerEvents: 'none', background: color + '1f', border: '2px solid ' + color, borderRadius: '4px', transition: 'background .12s' });
  const tag = mk(document.body, { position: 'absolute', left: rect.x - 1 + 'px', top: rect.y - 1 + 'px', zIndex: 2147483647, background: color, color: '#fff', font: 'bold 12px system-ui', minWidth: '18px', textAlign: 'center', padding: '1px 4px', borderRadius: '4px', pointerEvents: 'none' });
  tag.textContent = state.marks.length + 1;
  state.marks.push({ rect, color, ov, tag, read: false });
  setCount();
  return true;
};
const removeMark = (i) => { const m = state.marks.splice(i, 1)[0]; m.ov.remove(); m.tag.remove(); recolor(); setCount(); };
const smallestAt = (cx, cy) => { const p = toPage(cx, cy); let hit = -1, minA = Infinity; state.marks.forEach((m, i) => { if (contains(m, p.x, p.y)) { const a = m.rect.w * m.rect.h; if (a < minA) { minA = a; hit = i; } } }); return hit; };
let snapTarget = null, ladder = [];
const descOf = (t) => t.tagName.toLowerCase() + (typeof t.className === 'string' && t.className ? '.' + t.className.trim().split(/\s+/)[0] : '');
const showSnap = (t) => {
  snapTarget = t;
  const r = t.getBoundingClientRect();
  Object.assign(snapBox.style, { display: 'block', left: r.x + 'px', top: r.y + 'px', width: r.width + 'px', height: r.height + 'px' });
  $('__ph').textContent = '点击标注 ' + descOf(t) + (ladder.length ? '（爬梯 ' + ladder.length + ' 级）' : '');
};
const setSnap = (v) => {
  state.snap = v;
  const b = $('__psnap');
  b.textContent = '吸附布局：' + (v ? '开' : '关');
  b.style.borderColor = v ? 'rgba(37,99,235,.6)' : 'rgba(148,163,184,.3)';
  b.style.background = v ? 'rgba(37,99,235,.2)' : 'transparent';
  b.style.color = v ? '#93c5fd' : '#94a3b8';
  if (!v) { snapBox.style.display = 'none'; snapTarget = null; ladder = []; }
};
const setCommitted = (v) => {
  state.committed = v;
  $('__pbtns').style.display = v ? 'none' : 'flex';
  $('__pfoot').innerHTML = v ? '<b style="color:#fbbf24">已提交 ' + state.marks.filter(m => !m.read).length + ' 处新标注</b> — 回对话说「读」 · <a href="javascript:void(0)" id="__pcont" style="color:#5eead4;cursor:pointer">继续标注</a>' : '标注完成后点「提交」，回对话说「读」';
  if (v) $('__pcont').onclick = () => setCommitted(false);
};
let down = null, hudDrag = null;
on('mousemove', (e) => {
  if (hudDrag) { hud.style.left = (e.clientX - hudDrag.dx) + 'px'; hud.style.top = (e.clientY - hudDrag.dy) + 'px'; hud.style.right = 'auto'; return; }
  if (down) { Object.assign(band.style, { display: 'block', left: Math.min(down.x, e.clientX) + 'px', top: Math.min(down.y, e.clientY) + 'px', width: Math.abs(e.clientX - down.x) + 'px', height: Math.abs(e.clientY - down.y) + 'px' }); return; }
  if (hud.contains(e.target)) { snapBox.style.display = 'none'; snapTarget = null; ladder = []; $('__ph').textContent = ''; return; }
  state.marks.forEach(m => { m.ov.style.background = m.color + '1f'; });
  const hit = smallestAt(e.clientX, e.clientY);
  if (hit >= 0) { $('__ph').textContent = '悬停 #' + (hit + 1); state.marks[hit].ov.style.background = state.marks[hit].color + '3d'; snapBox.style.display = 'none'; snapTarget = null; ladder = []; return; }
  if (state.snap) {
    const t = e.target.closest('body *');
    if (t && !els.includes(t)) {
      const r = t.getBoundingClientRect();
      if (r.width >= 8 && r.height >= 8) { if (t !== snapTarget) { ladder = []; showSnap(t); } return; }
    }
    snapBox.style.display = 'none'; snapTarget = null; ladder = []; $('__ph').textContent = '';
  } else { snapBox.style.display = 'none'; snapTarget = null; $('__ph').textContent = ''; }
}, true);
on('wheel', (e) => {
  if (!state.snap || !e.altKey || !snapTarget || down || hudDrag) return;
  e.preventDefault(); e.stopPropagation();
  if (e.deltaY < 0) {
    const p = snapTarget.parentElement;
    if (p && p !== document.body) { ladder.push(snapTarget); showSnap(p); }
  } else {
    const c = ladder.pop();
    if (c) showSnap(c);
  }
}, { capture: true, passive: false });
// v2.6.2：滚动时按 snapTarget 最新位置重画吸附框（修复 fixed 框随滚轮漂移）
on('scroll', () => {
  if (!snapTarget) return;
  if (!snapTarget.isConnected) { snapBox.style.display = 'none'; snapTarget = null; ladder = []; return; }
  const r = snapTarget.getBoundingClientRect();
  Object.assign(snapBox.style, { left: r.x + 'px', top: r.y + 'px', width: r.width + 'px', height: r.height + 'px' });
}, true);
on('mousedown', (e) => {
  if (hud.contains(e.target)) { const hr = hud.getBoundingClientRect(); hudDrag = { dx: e.clientX - hr.x, dy: e.clientY - hr.y }; hud.style.cursor = 'grabbing'; e.preventDefault(); return; }
  if (!state.committed) down = { x: e.clientX, y: e.clientY, t: (e.target.closest('body *') && !els.includes(e.target.closest('body *'))) ? e.target.closest('body *') : null, snapped: snapTarget };
  e.preventDefault();
}, true);
on('mouseup', (e) => {
  if (hudDrag) { hudDrag = null; hud.style.cursor = 'grab'; return; }
  if (hud.contains(e.target)) { down = null; band.style.display = 'none'; return; }
  if (!down) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
  if (moved > 8) {
    const p1 = toPage(Math.min(down.x, e.clientX), Math.min(down.y, e.clientY));
    makeMark({ x: p1.x, y: p1.y, w: Math.abs(e.clientX - down.x), h: Math.abs(e.clientY - down.y) });
  } else {
    const hit = smallestAt(e.clientX, e.clientY);
    if (hit >= 0) removeMark(hit);
    else {
      const t = (state.snap && down.snapped) ? down.snapped : down.t;
      if (t && t !== document.body && t.isConnected) {
        const r = t.getBoundingClientRect();
        const p = toPage(r.x, r.y);
        if (r.width >= 8 && r.height >= 8) makeMark({ x: p.x, y: p.y, w: r.width, h: r.height });
      }
    }
  }
  band.style.display = 'none';
  snapTarget = null; ladder = [];
  down = null;
  e.preventDefault(); e.stopPropagation();
}, true);
on('click', (e) => { if (!hud.contains(e.target)) { e.preventDefault(); e.stopPropagation(); } }, true);
on('beforeunload', (e) => { if (state.marks.some(m => !m.read)) { e.preventDefault(); e.returnValue = '有未读取的标注，确认离开？'; return e.returnValue; } });
$('__psnap').onclick = () => setSnap(!state.snap);
$('__pu').onclick = () => { if (state.marks.length) removeMark(state.marks.length - 1); };
$('__pcl').onclick = () => { while (state.marks.length) removeMark(state.marks.length - 1); };
$('__psub').onclick = () => { if (state.marks.some(m => !m.read)) setCommitted(true); };
const read = () => {
  const out = { committed: state.committed, scroll: { x: window.scrollX, y: window.scrollY }, viewport: { w: window.innerWidth, h: window.innerHeight }, marks: [] };
  state.marks.forEach((m, i) => {
    const c = { x: m.rect.x - window.scrollX, y: m.rect.y - window.scrollY };
    const region = { x: c.x, y: c.y, x2: c.x + m.rect.w, y2: c.y + m.rect.h };
    const found = [];
    document.querySelectorAll('body *').forEach(el => {
      if (els.includes(el) || el === document.body) return;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      const ex = r.x + r.width / 2, ey = r.y + r.height / 2;
      if (ex < region.x || ex > region.x2 || ey < region.y || ey > region.y2) return;
      if (r.width * r.height > m.rect.w * m.rect.h * 4) return;
      const cs = getComputedStyle(el);
      let p = el.id ? '#' + el.id : el.tagName.toLowerCase();
      if (typeof el.className === 'string' && el.className.trim()) p += '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.');
      found.push({ sel: p, text: (el.textContent || '').trim().slice(0, 40), font: cs.fontSize + '/' + cs.fontWeight, color: cs.color, rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, area: Math.round(r.width * r.height) });
    });
    found.sort((a, b) => a.area - b.area);
    out.marks.push({ n: i + 1, read: !!m.read, rect: { x: Math.round(m.rect.x), y: Math.round(m.rect.y), w: Math.round(m.rect.w), h: Math.round(m.rect.h) }, elements: found.slice(0, 10) });
  });
  const preFlags = out.marks.map(x => x.read);
  state.marks.forEach(m => { if (!m.read) { m.read = true; m.ov.style.opacity = '.5'; m.tag.style.opacity = '.5'; } });
  if (state.committed) setCommitted(false);
  out.newCount = preFlags.filter(f => !f).length;
  return out;
};
window.__picker = { state, read, destroy: () => { listeners.forEach(([evt, fn, opt]) => document.removeEventListener(evt, fn, opt)); els.forEach(el => el.remove()); state.marks.forEach(m => { m.ov.remove(); m.tag.remove(); }); document.body.style.userSelect = ''; delete window.__picker; } };
__legacy.forEach(l => { if (makeMark(l.rect)) { const m = state.marks[state.marks.length - 1]; m.read = !!l.read; m.ov.style.opacity = m.read ? '.5' : '1'; m.tag.style.opacity = m.read ? '.5' : '1'; } });
return 'installed-v2.6.2';
