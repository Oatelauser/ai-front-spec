// 页面标注器 page-picker v2.7.2 —— $page-annotate 技能资产
// 注入方式：Read 本文件后，用 evaluate_script 以 `() => { <本文件内容> }` 形式注入目标页
// 依赖：window.__picker 单例（重复注入自动 destroy 旧实例，含遗留标注迁移）
// 交互模型（v2.7.0 对象化语法——加与删彻底分离）：
//   拖拽=自由框标注（无锚）；吸附开时悬停出布局框（已标注区内同样出框）、单击按框标注并锚定该元素、Alt+滚轮爬梯选父/子；
//   嵌套标注共存：点子区域=新增子标注，父标注保留；连点逐层加深；
//   删除只走显式通道：悬停标注右上角 ✕、Delete/Backspace 删悬停标注、撤销/清空兜底；单击/双击永不删除；
//   Esc 取消拖拽中的框；提交=锁定批次并清对照虚线；已读标注变淡；
//   编号创建时定终身、删除不复用（reload 后归零）；
//   锚定标注在 resize/滚动/读取时按元素当前位置重画（标注跟元素走）；锚元素消失 read() 报 anchorLost；
//   __picker.ghost(rects)=修复轮虚线对照（近似坐标，提交自动清）
if (window.__picker && __picker.destroy) __picker.destroy();
const __legacy = (window.__picker && Array.isArray(__picker.state.marks)) ? window.__picker.state.marks.map(m => ({ rect: m.rect, read: m.read })) : (window.__pickerLegacy || []);
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
    '<span style="margin-left:auto;font-size:10px;color:#475569;font-family:ui-monospace,monospace">v2.7.2</span>' +
  '</div>' +
  '<div style="padding:8px 12px;border-bottom:1px solid rgba(148,163,184,.12);color:#94a3b8">' +
    '<div><b style="color:#5eead4;font-weight:600">圈选</b> — 点击/拖拽标注，嵌套共存；单击永不删除</div>' +
    '<div><b style="color:#5eead4;font-weight:600">爬梯</b> — 悬停时 Alt+滚轮 选父/子元素（标注区内可用）</div>' +
    '<div><b style="color:#5eead4;font-weight:600">删除</b> — 悬停标注点 ✕ 或按 Delete；Esc 取消拖拽</div>' +
  '</div>' +
  '<div style="padding:7px 12px;border-bottom:1px solid rgba(148,163,184,.12)">' +
    '<button id="__psnap" title="悬停元素出边框，单击按布局框标注" style="margin:0;padding:4px 10px;border:1px solid rgba(37,99,235,.6);border-radius:6px;background:rgba(37,99,235,.2);color:#93c5fd;font:600 12px system-ui;cursor:pointer">吸附布局：开</button>' +
    '<button id="__pgh" style="display:none;margin:0 0 0 8px;padding:4px 10px;border:1px solid rgba(148,163,184,.35);border-radius:6px;background:transparent;color:#94a3b8;font:600 12px system-ui;cursor:pointer">对照虚线：开</button>' +
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
// ✕ 就近删除钮：悬停命中标注时移到其右上角
const xBtn = mk(document.body, { position: 'fixed', display: 'none', pointerEvents: 'auto', cursor: 'pointer', zIndex: 2147483647, width: '20px', height: '20px', lineHeight: '20px', textAlign: 'center', background: 'rgba(15,23,42,.92)', color: '#f87171', font: 'bold 13px system-ui', borderRadius: '50%', border: '1px solid rgba(248,113,113,.5)', userSelect: 'none' });
xBtn.textContent = '✕';
const state = { marks: [], snap: true, committed: false, nextId: 1 };
const listeners = [];
const on = (evt, fn, opt) => { document.addEventListener(evt, fn, opt); listeners.push([evt, fn, opt]); };
const toPage = (x, y) => ({ x: x + window.scrollX, y: y + window.scrollY });
const $ = (id) => document.getElementById(id);
const setCount = () => { $('__pc').textContent = state.marks.length ? '已标注 ' + state.marks.length + ' 处' : '尚无标注'; };
let hoverMark = null;
const setHoverMark = (m) => {
  hoverMark = m;
  if (!m || state.committed) { xBtn.style.display = 'none'; return; }
  const r = clientRegion(m);
  xBtn.style.display = 'block';
  xBtn.style.left = Math.min(Math.max(r.x + m.rect.w - 12, 4), window.innerWidth - 24) + 'px';
  xBtn.style.top = Math.min(Math.max(r.y - 10, 4), window.innerHeight - 24) + 'px';
};
const makeMark = (rect, fixed, anchor) => {
  if (rect.w < 12 || rect.h < 12) return false;
  const id = state.nextId++;
  const color = COLORS[(id - 1) % COLORS.length];
  const pos = fixed ? 'fixed' : 'absolute';
  const ov = mk(document.body, { position: pos, left: rect.x + 'px', top: rect.y + 'px', width: rect.w + 'px', height: rect.h + 'px', zIndex: 2147483645, pointerEvents: 'none', background: color + '1f', border: '2px solid ' + color, borderRadius: '4px', transition: 'background .12s' });
  const tag = mk(document.body, { position: pos, left: rect.x - 1 + 'px', top: rect.y - 1 + 'px', zIndex: 2147483647, background: color, color: '#fff', font: 'bold 12px system-ui', minWidth: '18px', textAlign: 'center', padding: '1px 4px', borderRadius: '4px', pointerEvents: 'none' });
  tag.textContent = id;
  state.marks.push({ id, rect, color, ov, tag, read: false, fixed: !!fixed, anchor: anchor || null });
  setCount();
  return true;
};
const removeMark = (i) => { if (i < 0) return; const m = state.marks.splice(i, 1)[0]; if (hoverMark === m) setHoverMark(null); m.ov.remove(); m.tag.remove(); setCount(); };
const clientRegion = (m) => m.fixed ? m.rect : { x: m.rect.x - window.scrollX, y: m.rect.y - window.scrollY, w: m.rect.w, h: m.rect.h };
const inFixedTree = (el) => { let n = el; while (n && n !== document.body) { const p = getComputedStyle(n).position; if (p === 'fixed' || p === 'sticky') return true; n = n.parentElement; } return false; };
const smallestAt = (cx, cy) => { let hit = -1, minA = Infinity; state.marks.forEach((m, i) => { const r = clientRegion(m); if (cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h) { const a = m.rect.w * m.rect.h; if (a < minA) { minA = a; hit = i; } } }); return hit; };
// 锚定刷新：吸附标注按锚元素当前盒子重画（resize/滚动/read 时；兼容字体/图片晚加载的布局漂移）
const refreshRects = () => {
  state.marks.forEach((m) => {
    if (!m.anchor || !m.anchor.isConnected) return;
    const r = m.anchor.getBoundingClientRect();
    if (r.width < 1 && r.height < 1) return;
    const fx = inFixedTree(m.anchor);
    m.fixed = fx;
    m.rect = fx ? { x: r.x, y: r.y, w: r.width, h: r.height } : { x: r.x + window.scrollX, y: r.y + window.scrollY, w: r.width, h: r.height };
    const pos = fx ? 'fixed' : 'absolute';
    Object.assign(m.ov.style, { position: pos, left: m.rect.x + 'px', top: m.rect.y + 'px', width: m.rect.w + 'px', height: m.rect.h + 'px' });
    Object.assign(m.tag.style, { position: pos, left: (m.rect.x - 1) + 'px', top: (m.rect.y - 1) + 'px' });
  });
  if (hoverMark) setHoverMark(hoverMark);
};
let snapTarget = null, ladder = [];
const descOf = (t) => t.tagName.toLowerCase() + (typeof t.className === 'string' && t.className ? '.' + t.className.trim().split(/\s+/)[0] : '');
const showSnap = (t, prefix) => {
  snapTarget = t;
  const r = t.getBoundingClientRect();
  Object.assign(snapBox.style, { display: 'block', left: r.x + 'px', top: r.y + 'px', width: r.width + 'px', height: r.height + 'px' });
  $('__ph').textContent = (prefix ? prefix + ' · ' : '') + '点击标注 ' + descOf(t) + (ladder.length ? '（爬梯 ' + ladder.length + ' 级）' : '');
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
  if (v) setHoverMark(null);
  if (v) $('__pcont').onclick = () => setCommitted(false);
};
// 幽灵对照：修复轮 reload 后由 agent 传入上轮 read() 的 rects，虚线重画（近似坐标）
let ghosts = [], ghostOn = true;
const clearGhost = () => { ghosts.forEach(g => g.remove()); ghosts = []; $('__pgh').style.display = 'none'; };
const ghost = (rects) => {
  clearGhost(); ghostOn = true;
  (rects || []).forEach(r => { if (!r || !(r.w >= 4) || !(r.h >= 4)) return; ghosts.push(mk(document.body, { position: 'absolute', left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px', zIndex: 2147483644, pointerEvents: 'none', border: '2px dashed #94a3b8', borderRadius: '4px', opacity: '.55' })); });
  if (ghosts.length) { $('__pgh').style.display = 'inline-block'; $('__pgh').textContent = '对照虚线：开'; }
  return 'ghost:' + ghosts.length;
};
let down = null, hudDrag = null, rafP = false;
const scheduleRefresh = () => { if (!rafP) { rafP = true; requestAnimationFrame(() => { rafP = false; refreshRects(); }); } };
on('mousemove', (e) => {
  if (hudDrag) { hud.style.left = (e.clientX - hudDrag.dx) + 'px'; hud.style.top = (e.clientY - hudDrag.dy) + 'px'; hud.style.right = 'auto'; return; }
  if (down) { Object.assign(band.style, { display: 'block', left: Math.min(down.x, e.clientX) + 'px', top: Math.min(down.y, e.clientY) + 'px', width: Math.abs(e.clientX - down.x) + 'px', height: Math.abs(e.clientY - down.y) + 'px' }); return; }
  if (hud.contains(e.target)) { snapBox.style.display = 'none'; snapTarget = null; ladder = []; setHoverMark(null); $('__ph').textContent = ''; return; }
  state.marks.forEach(m => { m.ov.style.background = m.color + '1f'; });
  let hint = '';
  const hit = state.committed ? -1 : smallestAt(e.clientX, e.clientY);
  if (hit >= 0) { const m = state.marks[hit]; m.ov.style.background = m.color + '3d'; setHoverMark(m); hint = '悬停 #' + m.id + ' · ✕删'; }
  else setHoverMark(null);
  if (state.snap) {
    const t = e.target.closest('body *');
    if (t && !els.includes(t)) {
      const r = t.getBoundingClientRect();
      if (r.width >= 8 && r.height >= 8) { if (t !== snapTarget) ladder = []; showSnap(t, hint); return; }
    }
    snapBox.style.display = 'none'; snapTarget = null; ladder = [];
  } else { snapBox.style.display = 'none'; snapTarget = null; }
  $('__ph').textContent = hint;
}, true);
on('wheel', (e) => {
  if (!state.snap || !e.altKey || !snapTarget || down || hudDrag) return;
  e.preventDefault(); e.stopPropagation();
  if (e.deltaY < 0) {
    const p = snapTarget.parentElement;
    if (p && p !== document.body) { ladder.push(snapTarget); showSnap(p, hoverMark ? '悬停 #' + hoverMark.id + ' · ✕删' : ''); }
  } else {
    const c = ladder.pop();
    if (c) showSnap(c, hoverMark ? '悬停 #' + hoverMark.id + ' · ✕删' : '');
  }
}, { capture: true, passive: false });
on('scroll', () => {
  if (snapTarget) {
    if (!snapTarget.isConnected) { snapBox.style.display = 'none'; snapTarget = null; ladder = []; }
    else { const r = snapTarget.getBoundingClientRect(); Object.assign(snapBox.style, { left: r.x + 'px', top: r.y + 'px', width: r.width + 'px', height: r.height + 'px' }); }
  }
  scheduleRefresh();
}, true);
on('resize', () => { snapBox.style.display = 'none'; snapTarget = null; ladder = []; scheduleRefresh(); }, true);
on('mousedown', (e) => {
  if (hud.contains(e.target)) { const hr = hud.getBoundingClientRect(); hudDrag = { dx: e.clientX - hr.x, dy: e.clientY - hr.y }; hud.style.cursor = 'grabbing'; e.preventDefault(); return; }
  if (e.target === xBtn) { e.preventDefault(); return; }
  if (!state.committed) { down = { x: e.clientX, y: e.clientY, t: (e.target.closest('body *') && !els.includes(e.target.closest('body *'))) ? e.target.closest('body *') : null, snapped: snapTarget }; setHoverMark(null); }
  e.preventDefault();
}, true);
on('mouseup', (e) => {
  if (hudDrag) { hudDrag = null; hud.style.cursor = 'grab'; return; }
  if (hud.contains(e.target)) { down = null; band.style.display = 'none'; return; }
  if (e.target === xBtn) {
    down = null; band.style.display = 'none';
    if (hoverMark) removeMark(state.marks.indexOf(hoverMark));
    e.preventDefault(); e.stopPropagation();
    return;
  }
  if (!down) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
  if (moved > 8) {
    const fx = down.t ? inFixedTree(down.t) : false;
    const p1 = fx ? { x: Math.min(down.x, e.clientX), y: Math.min(down.y, e.clientY) } : toPage(Math.min(down.x, e.clientX), Math.min(down.y, e.clientY));
    makeMark({ x: p1.x, y: p1.y, w: Math.abs(e.clientX - down.x), h: Math.abs(e.clientY - down.y) }, fx, null);
  } else {
    const t = (state.snap && down.snapped) ? down.snapped : down.t;
    if (t && t !== document.body && t.isConnected && !els.includes(t)) {
      const dup = state.marks.find(mm => mm.anchor === t);
      if (dup) { $('__ph').textContent = '已标注 #' + dup.id + ' · 悬停 ✕ 删'; }
      else {
        const r = t.getBoundingClientRect();
        const fx = inFixedTree(t);
        const p = fx ? { x: r.x, y: r.y } : toPage(r.x, r.y);
        if (r.width >= 8 && r.height >= 8) makeMark({ x: p.x, y: p.y, w: r.width, h: r.height }, fx, t);
      }
    }
  }
  band.style.display = 'none';
  snapTarget = null; ladder = [];
  down = null;
  e.preventDefault(); e.stopPropagation();
}, true);
on('click', (e) => { if (!hud.contains(e.target)) { e.preventDefault(); e.stopPropagation(); } }, true);
on('keydown', (e) => {
  if (e.target && e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) return;
  if (e.key === 'Escape') { if (down) { down = null; band.style.display = 'none'; e.preventDefault(); e.stopPropagation(); } return; }
  if ((e.key === 'Delete' || e.key === 'Backspace') && hoverMark && !state.committed) { removeMark(state.marks.indexOf(hoverMark)); e.preventDefault(); e.stopPropagation(); }
}, true);
on('beforeunload', (e) => { if (state.marks.some(m => !m.read)) { e.preventDefault(); e.returnValue = '有未读取的标注，确认离开？'; return e.returnValue; } });
$('__psnap').onclick = () => setSnap(!state.snap);
$('__pgh').onclick = () => { ghostOn = !ghostOn; ghosts.forEach(g => g.style.display = ghostOn ? 'block' : 'none'); $('__pgh').textContent = '对照虚线：' + (ghostOn ? '开' : '关'); };
$('__pu').onclick = () => { if (state.marks.length) removeMark(state.marks.length - 1); };
$('__pcl').onclick = () => { while (state.marks.length) removeMark(state.marks.length - 1); };
$('__psub').onclick = () => { if (state.marks.some(m => !m.read)) { clearGhost(); setCommitted(true); } };
const diagOf = (el) => {
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  let p = el.id ? '#' + el.id : el.tagName.toLowerCase();
  if (typeof el.className === 'string' && el.className.trim()) p += '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.');
  return { sel: p, text: (el.textContent || '').trim().slice(0, 40), font: cs.fontSize + '/' + cs.fontWeight, color: cs.color, rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, area: Math.round(r.width * r.height) };
};
const read = () => {
  refreshRects();
  const out = { committed: state.committed, scroll: { x: window.scrollX, y: window.scrollY }, viewport: { w: window.innerWidth, h: window.innerHeight }, marks: [] };
  // v2.7.2：单趟扫描——每元素只读一次几何再分发到命中的标注（原为每标注全量扫，布局读次数 O(标注×元素)）
  const elSet = new Set(els);
  const regions = state.marks.map((m) => { const c = clientRegion(m); return { m, x: c.x, y: c.y, x2: c.x + m.rect.w, y2: c.y + m.rect.h }; });
  const buckets = state.marks.map(() => []);
  document.querySelectorAll('body *').forEach(el => {
    if (elSet.has(el) || el === document.body) return;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    const ex = r.x + r.width / 2, ey = r.y + r.height / 2;
    let d = null;
    regions.forEach((rg, i) => {
      if (rg.m.anchor === el) return;
      if (ex < rg.x || ex > rg.x2 || ey < rg.y || ey > rg.y2) return;
      if (r.width * r.height > rg.m.rect.w * rg.m.rect.h * 4) return;
      if (!d) d = diagOf(el);
      buckets[i].push(d);
    });
  });
  state.marks.forEach((m, i) => {
    if (m.anchor && m.anchor.isConnected) { const a = diagOf(m.anchor); a.anchor = true; buckets[i].unshift(a); }
    buckets[i].sort((a, b) => (a.anchor ? -1 : b.anchor ? 1 : a.area - b.area));
    out.marks.push({ n: m.id, read: !!m.read, anchorLost: !!(m.anchor && !m.anchor.isConnected), rect: { x: Math.round(m.rect.x), y: Math.round(m.rect.y), w: Math.round(m.rect.w), h: Math.round(m.rect.h) }, elements: buckets[i].slice(0, 10) });
  });
  const preFlags = out.marks.map(x => x.read);
  state.marks.forEach(m => { if (!m.read) { m.read = true; m.ov.style.opacity = '.5'; m.tag.style.opacity = '.5'; } });
  if (state.committed) setCommitted(false);
  out.newCount = preFlags.filter(f => !f).length;
  return out;
};
window.__picker = { state, read, ghost, destroy: () => { listeners.forEach(([evt, fn, opt]) => document.removeEventListener(evt, fn, opt)); els.forEach(el => el.remove()); ghosts = []; document.body.style.userSelect = ''; delete window.__picker; } };
__legacy.forEach(l => { if (makeMark(l.rect, false, null)) { const m = state.marks[state.marks.length - 1]; m.read = !!l.read; m.ov.style.opacity = m.read ? '.5' : '1'; m.tag.style.opacity = m.read ? '.5' : '1'; } });
return 'installed-v2.7.2';
