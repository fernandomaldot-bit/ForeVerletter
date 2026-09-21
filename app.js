(() => {
'use strict';
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function el(tag, cls, text){ const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

/* ---------- storage (falls back to memory if the browser blocks it) ---------- */
const store = (() => {
  const mem = {}; let ok = false;
  try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); ok = true; } catch (e) {}
  return {
    persistent: ok,
    get(k){ try { if (ok) return localStorage.getItem(k); } catch (e) {} return k in mem ? mem[k] : null; },
    set(k, v){ try { if (ok) { localStorage.setItem(k, v); return true; } } catch (e) { mem[k] = v; return false; } mem[k] = v; return true; },
    del(k){ try { if (ok) localStorage.removeItem(k); } catch (e) {} delete mem[k]; }
  };
})();

/* ---------- options ---------- */
const PAPERS = [
  {n:'Cream',    paper:'#fbf5e6', edge:'#e3d6b3', env:'#efe2c2', env2:'#d9c79a', line:'rgba(122,92,48,.20)'},
  {n:'Rose',     paper:'#fdeeed', edge:'#eecbc9', env:'#f3d0cf', env2:'#e2b0af', line:'rgba(160,80,80,.18)'},
  {n:'Sage',     paper:'#f0f3e6', edge:'#d1dcb7', env:'#d9e3c3', env2:'#bccb9d', line:'rgba(80,110,60,.18)'},
  {n:'Sky',      paper:'#eaf2f9', edge:'#c2d7ea', env:'#cfe0ef', env2:'#a9c3db', line:'rgba(60,100,150,.18)'},
  {n:'Midnight', paper:'#1f2a44', edge:'#33436b', env:'#2a3757', env2:'#182039', line:'rgba(230,215,170,.16)', dark:true, ink:'#f2e4bd'}
];
const INKS = [
  {n:'Sepia', c:'#4a2f1b'}, {n:'Blue-black', c:'#1c2c5a'}, {n:'Burgundy', c:'#7a1f33'},
  {n:'Forest', c:'#1f4a35'}, {n:'Graphite', c:'#2b2b2e'}
];
const FONTS = [
  {n:'Caveat',        f:"'Caveat','Segoe Script','Bradley Hand',cursive",               fs:'1.75rem', lh:'2.1rem'},
  {n:'Dancing Script',f:"'Dancing Script','Brush Script MT',cursive",                    fs:'1.55rem', lh:'2.1rem'},
  {n:'Homemade Apple',f:"'Homemade Apple','Snell Roundhand',cursive",                    fs:'1.15rem', lh:'2.3rem'},
  {n:'EB Garamond',   f:"'EB Garamond',Georgia,serif",                                  fs:'1.3rem',  lh:'2rem'},
  {n:'Typewriter',    f:"'Special Elite','Courier New',monospace",                      fs:'1.05rem', lh:'2rem'}
];
const WAX = [
  {n:'Crimson', a:'#d1495b', b:'#a3202f', c:'#6f1220', t:'#ffffff'},
  {n:'Navy',    a:'#4f6fb0', b:'#25407a', c:'#152648', t:'#ffffff'},
  {n:'Forest',  a:'#5d9a74', b:'#2f6a4b', c:'#1a4230', t:'#ffffff'},
  {n:'Gold',    a:'#efd27e', b:'#c9a238', c:'#7d5d0f', t:'#3a2a05'},
  {n:'Plum',    a:'#a2609e', b:'#6d2e6a', c:'#421a40', t:'#ffffff'},
  {n:'Ink',     a:'#62626b', b:'#2f2f37', c:'#141418', t:'#ffffff'}
];
const MARKS = [
  {k:'initial', label:'Your initial'}, {k:'\u2665', label:'Heart'}, {k:'\u2726', label:'Star'},
  {k:'\u2740', label:'Flower'}, {k:'\u263E', label:'Moon'}, {k:'\u2709', label:'Envelope'}
];
const DEFAULT = {to:'', fr:'', tx:'', pa:0, ink:0, fo:0, ln:1, se:0, mk:0};

function clean(o){
  o = o || {};
  const s = x => typeof x === 'string' ? x : '';
  const n = (x, m) => { x = Number(x); return Number.isInteger(x) && x >= 0 && x < m ? x : 0; };
  return {
    to: s(o.to).slice(0,120), fr: s(o.fr).slice(0,120), tx: s(o.tx),
    pa: n(o.pa, PAPERS.length), ink: n(o.ink, INKS.length), fo: n(o.fo, FONTS.length),
    ln: o.ln ? 1 : 0, se: n(o.se, WAX.length), mk: n(o.mk, MARKS.length)
  };
}

/* Letters from the first version kept the greeting and closing in separate fields.
   Fold them into one piece of text so every letter is plain, editable text. */
function upgrade(o){
  o = o || {};
  const p = clean(o);
  if (o.v !== 2 && typeof o.tx === 'string' && o.tx.trim()) {
    const to = String(o.to || '').trim(), cl = String(o.cl || '').trim(), fr = String(o.fr || '').trim();
    const tail = [cl, fr].filter(Boolean).join('\n');
    p.tx = (to ? 'Dear ' + to + ',' : 'Hello,') + '\n\n' + o.tx.replace(/\s+$/, '') + (tail ? '\n\n' + tail : '');
  }
  p.v = 2; p.d = Number(o.d) || 0;
  return p;
}

/*CODEC*/
const te = new TextEncoder(), td = new TextDecoder();
function toB64u(bytes){
  let s = ''; const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) s += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64u(str){
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str), out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function pipeBytes(bytes, transform){
  const stream = new Blob([bytes]).stream().pipeThrough(transform);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function encodeLetter(obj){
  const raw = te.encode(JSON.stringify(obj));
  if (typeof CompressionStream !== 'undefined') {
    try {
      const z = await pipeBytes(raw, new CompressionStream('deflate-raw'));
      if (z.length < raw.length) return 'z' + toB64u(z);
    } catch (e) {}
  }
  return 'p' + toB64u(raw);
}
async function decodeLetter(code){
  const kind = code[0], data = fromB64u(code.slice(1));
  let raw = data;
  if (kind === 'z') {
    if (typeof DecompressionStream === 'undefined') throw new Error('This browser can’t unpack the letter');
    raw = await pipeBytes(data, new DecompressionStream('deflate-raw'));
  } else if (kind !== 'p') throw new Error('Unknown letter format');
  const p = upgrade(JSON.parse(td.decode(raw)));
  if (!p.tx.trim()) throw new Error('Empty letter');
  return p;
}
function extractCode(s){
  s = (s || '').trim();
  const m = s.match(/[#?&]l=([A-Za-z0-9_-]+)/);
  if (m) return m[1];
  const c = s.replace(/\s+/g, '');
  return /^[zp][A-Za-z0-9_-]{4,}$/.test(c) ? c : null;
}
/*ENDCODEC*/

/* ---------- look & feel helpers ---------- */
function styleVars(p){
  const pa = PAPERS[p.pa], f = FONTS[p.fo], w = WAX[p.se];
  return {
    '--p-bg':pa.paper, '--p-edge':pa.edge, '--p-ink':pa.dark ? pa.ink : INKS[p.ink].c, '--p-line':pa.line,
    '--env':pa.env, '--env2':pa.env2, '--p-font':f.f, '--p-fs':f.fs, '--p-lh':f.lh,
    '--w1':w.a, '--w2':w.b, '--w3':w.c, '--w-tx':w.t
  };
}
function paint(node, p){ const v = styleVars(p); for (const k in v) node.style.setProperty(k, v[k]); }
function markOf(p){
  const m = MARKS[p.mk].k;
  if (m === 'initial') { const c = Array.from((p.fr || '').trim())[0]; return c ? c.toUpperCase() : '\u2726\uFE0E'; }
  return m + '\uFE0E';
}
function graphemes(text){
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    return [...new Intl.Segmenter(undefined, {granularity:'grapheme'}).segment(text)].map(x => x.segment);
  }
  return Array.from(text);
}
function assemble(p){
  // The letter is exactly what the writer typed; nothing is added around it.
  return p.tx.replace(/^(?:[ \t]*\r?\n)+/, '').replace(/\s+$/, '');
}
const fmtDate = ms => ms ? new Date(ms).toLocaleDateString(undefined, {year:'numeric', month:'long', day:'numeric'}) : '';

let toastT;
function toast(msg){
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2600);
}
async function copyText(text, inputEl){
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
  try {
    let ta = inputEl, tmp = false;
    if (!ta) { ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); tmp = true; }
    ta.focus(); ta.select();
    const ok = document.execCommand('copy');
    if (tmp) ta.remove();
    return ok;
  } catch (e) { return false; }
}

/* ---------- envelope ---------- */
const ENV_HTML =
  '<div class="env-back"></div>' +
  '<div class="flap"><div class="face fr"><i></i></div><div class="face bk"><i></i></div></div>' +
  '<div class="env-paper"></div>' +
  '<div class="env-front"></div>' +
  '<div class="addr"><strong class="addr-to"></strong></div>' +
  '<button type="button" class="seal" aria-label="Break the seal"><span class="half l"><b class="mk"></b></span><span class="half r"><b class="mk"></b></span></button>';
function fillEnv(root, p){
  root.innerHTML = ENV_HTML;
  paint(root, p);
  root.dataset.s = 'closed';
  $('.addr-to', root).textContent = p.to.trim();
  $('.addr', root).hidden = !p.to.trim();
  $$('.mk', root).forEach(m => { m.textContent = markOf(p); });
}

/* ---------- state ---------- */
let D = Object.assign({}, DEFAULT);
try { const s = store.get('sl:draft'); if (s) { const u = upgrade(JSON.parse(s)); delete u.v; delete u.d; D = Object.assign({}, DEFAULT, u); } } catch (e) {}
let BOX = [];
try {
  const raw = JSON.parse(store.get('sl:box') || '[]');
  BOX = raw.filter(r => r && typeof r.code === 'string' && r.payload)
           .map(r => ({id:String(r.id), created:Number(r.created) || 0, code:r.code, payload:upgrade(r.payload)}));
} catch (e) {}
const S = {rec:null};
const R = {p:null, opts:{}, gen:0, timer:null, typing:false, speed:'steady', follow:true, chunks:[], i:0, per:1, scale:1, shown:null, rest:null};
let CUR = 'write';

function detectBase(){
  try { const u = new URL(location.href); if (u.protocol === 'http:' || u.protocol === 'https:') { u.hash = ''; return u.toString(); } } catch (e) {}
  return '';
}
let BASE = store.get('sl:base') || detectBase();
const linkFor = rec => BASE ? BASE.split('#')[0] + '#l=' + rec.code : '';

let saveT;
function persistDraft(){ clearTimeout(saveT); saveT = setTimeout(() => store.set('sl:draft', JSON.stringify(Object.assign({v:2}, D))), 250); }
function saveBox(){
  if (!store.set('sl:box', JSON.stringify(BOX)) && store.persistent) toast('Couldn’t keep a copy in your letterbox; storage is full.');
}
function updateCount(){ const c = $('#box-count'); c.textContent = BOX.length; c.hidden = !BOX.length; }

/* ---------- routing ---------- */
const VIEWS = ['write','sealed','box','read','bad'];
function show(v){
  stopTyping(); R.gen++; CUR = v;
  VIEWS.forEach(x => { $('#v-' + x).hidden = x !== v; });
  document.body.classList.toggle('reading', v === 'read');
  $$('[data-nav]').forEach(b => b.setAttribute('aria-current', b.dataset.nav === v ? 'page' : 'false'));
  window.scrollTo(0, 0);
  if (v === 'box') renderBox();
  if (v === 'write') requestAnimationFrame(fit);
  const h = $('#v-' + v + ' [tabindex="-1"]'); if (h && v !== 'read') h.focus({preventScroll:true});
}
function leaveLink(){ try { if (location.hash || /[?&]l=/.test(location.search)) history.replaceState(null, '', location.pathname); } catch (e) {} }
function go(v){
  if (v === 'open') return openDialog();
  leaveLink(); show(v);
  if (v === 'write') $('#f-tx').focus({preventScroll:true});
}
async function route(){
  const code = extractCode(location.hash) || extractCode(location.search);
  if (!code) { show('write'); return; }
  try { openRead(await decodeLetter(code), {}); }
  catch (e) { console.error(e); show('bad'); }
}

/* ---------- compose ---------- */
function buildGroups(){
  const mk = (host, items, key, render) => {
    const h = $('#' + host); h.innerHTML = '';
    items.forEach((it, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.dataset.i = i; b.dataset.key = key;
      b.setAttribute('role', 'radio'); render(b, it, i);
      b.addEventListener('click', () => { D[key] = i; changed(); });
      h.appendChild(b);
    });
  };
  mk('g-paper', PAPERS, 'pa', (b, it) => { b.style.background = it.paper; b.title = it.n; b.setAttribute('aria-label', it.n + ' paper'); });
  mk('g-ink', INKS, 'ink', (b, it) => { b.style.background = it.c; b.title = it.n; b.setAttribute('aria-label', it.n + ' ink'); });
  mk('g-font', FONTS, 'fo', (b, it) => {
    const aa = el('span', 'aa', 'Aa'); aa.style.fontFamily = it.f;
    b.append(aa, el('small', '', it.n)); b.setAttribute('aria-label', it.n + ' handwriting');
  });
  mk('g-wax', WAX, 'se', (b, it) => {
    b.style.background = 'radial-gradient(circle at 32% 28%,' + it.a + ',' + it.b + ' 55%,' + it.c + ')';
    b.title = it.n; b.setAttribute('aria-label', it.n + ' wax');
  });
  mk('g-mark', MARKS, 'mk', (b, it) => {
    b.className = 'mkbtn'; b.textContent = it.k === 'initial' ? 'A' : it.k + '\uFE0E';
    b.title = it.label; b.setAttribute('aria-label', it.label);
  });
}
function syncGroups(){
  $$('.sw button[data-key], .fonts button[data-key]').forEach(b => b.setAttribute('aria-checked', String(+b.dataset.i === D[b.dataset.key])));
}
function applyStyle(){
  paint($('#v-write'), D);
  $('#paper').classList.toggle('lined', !!D.ln);
  const dark = !!PAPERS[D.pa].dark;
  $('#grp-ink').classList.toggle('off', dark);
  $$('#g-ink button').forEach(b => { b.disabled = dark; });
  $('#l-ink').textContent = dark ? 'Ink (Midnight paper uses gold ink)' : 'Ink';
  syncGroups();
}
function changed(){ applyStyle(); fit(); persistDraft(); }

function fit(){
  const ta = $('#f-tx'); ta.style.height = 'auto';
  const lh = parseFloat(getComputedStyle(ta).lineHeight) || 32;
  ta.style.height = Math.max(lh * 8, Math.ceil(ta.scrollHeight / lh) * lh) + 'px';
}
function countWords(){
  const n = D.tx.trim().split(/\s+/).filter(Boolean).length;
  $('#count').textContent = n + (n === 1 ? ' word' : ' words');
}
function syncForm(){
  $('#f-to').value = D.to; $('#f-fr').value = D.fr; $('#f-tx').value = D.tx; $('#f-ln').checked = !!D.ln;
  applyStyle(); countWords(); requestAnimationFrame(fit);
}
function bindCompose(){
  [['f-to','to'],['f-fr','fr'],['f-tx','tx']].forEach(([id, k]) => {
    $('#' + id).addEventListener('input', e => {
      D[k] = e.target.value; persistDraft();
      if (k === 'tx') { fit(); countWords(); }
    });
  });
  $('#f-ln').addEventListener('change', e => { D.ln = e.target.checked ? 1 : 0; changed(); });
  const clear = $('#btn-clear'); let t = null;
  clear.addEventListener('click', () => {
    if (clear.dataset.armed) {
      clearTimeout(t); delete clear.dataset.armed; clear.textContent = 'Clear the page';
      D.tx = ''; D.to = ''; syncForm(); persistDraft(); $('#f-tx').focus();
    } else {
      clear.dataset.armed = '1'; clear.textContent = 'Really clear it?';
      t = setTimeout(() => { delete clear.dataset.armed; clear.textContent = 'Clear the page'; }, 3000);
    }
  });
  $('#btn-seal').addEventListener('click', sealLetter);
  window.addEventListener('resize', () => { if (CUR === 'write') fit(); });
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', () => { if (CUR === 'write') fit(); });
}
function loadIntoDraft(p){ D = Object.assign({}, DEFAULT, clean(p)); persistDraft(); syncForm(); }

async function sealLetter(){
  if (!D.tx.trim()) {
    const paper = $('#paper'); paper.classList.remove('shake'); void paper.offsetWidth; paper.classList.add('shake');
    $('#f-tx').focus(); toast('Write a few words first.'); return;
  }
  const btn = $('#btn-seal'); btn.disabled = true;
  try {
    const payload = Object.assign(clean(D), {v:2, d:Date.now()});
    const code = await encodeLetter(payload);
    const check = await decodeLetter(code);   // make sure the link really opens before handing it out
    if (check.tx !== payload.tx) throw new Error('Round-trip check failed');
    const rec = {id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), created: payload.d, payload, code};
    BOX.unshift(rec); saveBox(); updateCount();
    showSealed(rec);
  } catch (e) {
    console.error(e); toast('Something went wrong while sealing. Please try again.');
  } finally { btn.disabled = false; }
}

/* ---------- sealed view ---------- */
function showSealed(rec){
  S.rec = rec; show('sealed');
  const env = $('#s-env'); fillEnv(env, rec.payload);
  const seal = $('.seal', env); seal.disabled = true; seal.tabIndex = -1; seal.classList.add('stamp');
  refreshLink();
}
function refreshLink(){
  const rec = S.rec; if (!rec) return;
  const url = linkFor(rec);
  $('#s-link').value = url; $('#s-code').value = rec.code;
  $('#s-copy').disabled = !url;
  $('#s-share').hidden = !(url && navigator.share);
  $('#base-in').value = store.get('sl:base') || '';
  $('#adv').open = !BASE;
  const note = $('#s-note');
  if (url.length > 1800) {
    note.hidden = false;
    note.textContent = 'This is a long letter, so the link is long (' + url.length.toLocaleString() + ' characters). Email and most chat apps handle that, but some, like SMS, may cut it off. If that happens, send the letter code instead.';
  } else note.hidden = true;
}
async function copyLink(rec){
  const url = linkFor(rec);
  if (!url) { toast('Add your site address first (see “Link not opening the letter?”).'); return; }
  toast(await copyText(url, $('#v-sealed').hidden ? null : $('#s-link')) ? 'Link copied' : 'Select the link and copy it by hand');
}
function bindSealed(){
  $('#s-copy').addEventListener('click', () => copyLink(S.rec));
  $('#s-copycode').addEventListener('click', async () => toast(await copyText(S.rec.code, $('#s-code')) ? 'Letter code copied' : 'Select the code and copy it by hand'));
  $('#s-share').addEventListener('click', async () => {
    const url = linkFor(S.rec); if (!url) return;
    try { await navigator.share({title:'A sealed letter', text:'A sealed letter is waiting for you.', url}); }
    catch (e) { if (!e || e.name !== 'AbortError') copyLink(S.rec); }
  });
  $('#s-preview').addEventListener('click', () => openRead(S.rec.payload, {preview:true, back: () => show('sealed')}));
  $('#s-another').addEventListener('click', () => { D.tx = ''; D.to = ''; syncForm(); persistDraft(); go('write'); });
  $('#base-set').addEventListener('click', () => {
    const v = $('#base-in').value.trim();
    try { const u = new URL(v); if (!/^https?:$/.test(u.protocol)) throw 0; u.hash = ''; BASE = u.toString(); store.set('sl:base', BASE); refreshLink(); toast('Site address saved'); }
    catch (e) { toast('That doesn’t look like a web address.'); }
  });
  $('#base-reset').addEventListener('click', () => { store.del('sl:base'); BASE = detectBase(); refreshLink(); toast('Using this page’s address'); });
}

/* ---------- letterbox ---------- */
function renderBox(){
  const host = $('#box-list'); host.innerHTML = '';
  $('#box-empty').hidden = BOX.length > 0;
  $('#box-note').textContent = store.persistent
    ? 'Every letter you seal is kept here, in this browser, as many as you like.'
    : 'Your browser is blocking storage, so these letters last only until you close this tab.';
  BOX.forEach(rec => {
    const p = rec.payload;
    const card = el('article', 'card'); paint(card, p);
    card.append(el('div', 'airmail'));
    const inner = el('div', 'card-in');
    const top = el('div', 'card-top');
    const seal = el('span', 's', markOf(p)); seal.setAttribute('aria-hidden', 'true');
    const who = el('div'); who.append(el('b', '', p.to.trim() || 'No name on the envelope'), el('span', 'd', fmtDate(rec.created)));
    top.append(seal, who);
    const snip = el('div', 'snip', p.tx.replace(/\s+/g, ' ').trim().slice(0, 200));
    const btns = el('div', 'row-btns');
    const bCopy = el('button', 'ghost sm', 'Copy link'); bCopy.type = 'button'; bCopy.onclick = () => copyLink(rec);
    const bView = el('button', 'ghost sm', 'Preview'); bView.type = 'button'; bView.onclick = () => openRead(p, {preview:true, back: () => show('box')});
    const bEdit = el('button', 'ghost sm', 'Edit a copy'); bEdit.type = 'button'; bEdit.onclick = () => { loadIntoDraft(p); go('write'); };
    const bDel = el('button', 'ghost sm', 'Delete'); bDel.type = 'button';
    let t = null;
    bDel.onclick = () => {
      if (bDel.dataset.armed) { BOX = BOX.filter(r => r.id !== rec.id); saveBox(); updateCount(); renderBox(); }
      else { bDel.dataset.armed = '1'; bDel.textContent = 'Really delete?'; t = setTimeout(() => { delete bDel.dataset.armed; bDel.textContent = 'Delete'; }, 3000); }
    };
    btns.append(bCopy, bView, bEdit, bDel);
    inner.append(top, snip, btns); card.append(inner); host.append(card);
  });
}

/* ---------- opening a letter ---------- */
function openRead(p, opts){
  R.p = p; R.opts = opts || {}; show('read');
  const v = $('#v-read'); paint(v, p);
  fillEnv($('#r-env'), p);
  const scene = $('#scene'); scene.hidden = false; scene.classList.remove('leaving');
  const sheet = $('#sheet'); sheet.hidden = true; sheet.className = 'sheet' + (p.ln ? ' lined' : '');
  $('#r-ctl').hidden = true; $('#after').hidden = true;
  $('#r-back').hidden = !R.opts.back;
  const fr = p.fr.trim();
  $('#r-hint').textContent = fr ? 'Sealed by ' + fr + (p.d ? ' on ' + fmtDate(p.d) : '') : (p.d ? 'Sealed on ' + fmtDate(p.d) : '');
  const text = assemble(p);
  R.shown = document.createTextNode(''); R.rest = document.createTextNode(text);
  $('#t-shown').replaceChildren(R.shown); $('#t-rest').replaceChildren(R.rest);
  $('#r-full').textContent = text;
  R.busy = false;
  $('#r-env .seal').addEventListener('click', openLetter);
}
async function openLetter(){
  if (R.busy) return; R.busy = true;
  const g = R.gen, k = reduceMotion() ? 0.2 : 1;
  const wait = async ms => { await sleep(ms * k); return g === R.gen; };
  const env = $('#r-env'), seal = $('.seal', env);
  seal.classList.add('shake'); if (!await wait(260)) return;
  seal.classList.remove('shake'); seal.classList.add('broke'); seal.disabled = true;
  if (!await wait(320)) return;
  env.dataset.s = 'open'; if (!await wait(780)) return;
  env.dataset.s = 'out';  if (!await wait(1050)) return;
  const scene = $('#scene'); scene.classList.add('leaving'); if (!await wait(480)) return;
  scene.hidden = true;
  const sheet = $('#sheet'); sheet.hidden = false; sheet.classList.add('unfold');
  window.scrollTo(0, 0);
  if (!await wait(700)) return;
  startTyping();
}

/* ---------- typing ---------- */
function stopTyping(){ clearTimeout(R.timer); R.typing = false; }
function startTyping(){
  stopTyping();
  const text = assemble(R.p);
  R.chunks = graphemes(text); R.i = 0;
  R.shown.data = ''; R.rest.data = text;
  const len = R.chunks.length;
  R.per = Math.max(1, Math.floor(len / 2500));
  R.scale = len > 1200 ? Math.max(.3, 1200 / len) : 1;
  R.follow = true; R.typing = true;
  const sheet = $('#sheet'); sheet.classList.remove('done'); sheet.classList.add('typing');
  $('#r-ctl').hidden = false; $('#after').hidden = true;
  R.timer = setTimeout(tick, 450);
}
function delayFor(ch){
  const base = ({slow:78, steady:44, quick:16})[R.speed] * R.scale;
  let d = base * (0.55 + Math.random() * 0.9);
  if (/[.!?\u2026]/.test(ch)) d += 360 * R.scale;
  else if (/[,;:\u2014]/.test(ch)) d += 170 * R.scale;
  else if (ch === '\n') d += 260 * R.scale;
  return Math.max(9, d);
}
function tick(){
  if (!R.typing) return;
  if (R.i >= R.chunks.length) return doneTyping();
  const s = R.chunks.slice(R.i, R.i + R.per).join(''); R.i += R.per;
  R.shown.appendData(s); R.rest.deleteData(0, s.length);
  followPen();
  R.timer = setTimeout(tick, delayFor(s.slice(-1)));
}
function followPen(){
  if (!R.follow) return;
  const r = $('#t-anchor').getBoundingClientRect();
  if (r.bottom > innerHeight * 0.72) window.scrollBy({top: r.bottom - innerHeight * 0.55, behavior: reduceMotion() ? 'auto' : 'smooth'});
}
function finishNow(){
  clearTimeout(R.timer);
  const text = assemble(R.p);
  R.shown.data = text; R.rest.data = ''; R.i = R.chunks.length;
  doneTyping();
}
function doneTyping(){
  R.typing = false;
  const sheet = $('#sheet'); sheet.classList.remove('typing'); sheet.classList.add('done');
  $('#r-ctl').hidden = true;
  const fr = R.p.fr.trim();
  $('#after-h').textContent = fr ? 'That was ' + fr + '’s letter' : 'That was the whole letter';
  $('#a-reply').textContent = fr ? 'Write back to ' + fr : 'Write back';
  $('#a-reply').hidden = !!R.opts.preview;
  const a = $('#after'); a.hidden = false;
  if (R.follow) setTimeout(() => a.scrollIntoView({behavior: reduceMotion() ? 'auto' : 'smooth', block:'nearest'}), 200);
}
function bindRead(){
  $('#r-open').addEventListener('click', openLetter);
  $$('#r-ctl [data-sp]').forEach(b => b.addEventListener('click', () => {
    R.speed = b.dataset.sp; $$('#r-ctl [data-sp]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  }));
  $('#r-skip').addEventListener('click', finishNow);
  $('#a-again').addEventListener('click', () => { window.scrollTo(0, 0); R.gen++; startTyping(); });
  $('#a-own').addEventListener('click', () => go('write'));
  $('#a-reply').addEventListener('click', () => {
    const p = R.p;
    if (!D.tx.trim()) { D.to = p.fr; D.fr = p.to; syncForm(); persistDraft(); go('write'); }
    else { go('write'); toast('You have an unfinished draft. Seal it or clear the page to start a reply.'); }
  });
  $('#r-back').addEventListener('click', () => { if (R.opts.back) R.opts.back(); });
  addEventListener('wheel', e => { if (R.typing && e.deltaY < 0) R.follow = false; }, {passive:true});
  addEventListener('touchmove', () => { if (R.typing) R.follow = false; }, {passive:true});
  addEventListener('scroll', () => {
    if (R.typing && !R.follow && $('#t-anchor').getBoundingClientRect().bottom > innerHeight * 0.8) R.follow = true;
  }, {passive:true});
}

/* ---------- open-by-paste dialog ---------- */
let dlgPrev = 'write';
function openDialog(){
  dlgPrev = CUR; $('#dlg-in').value = ''; $('#dlg-err').textContent = '';
  const d = $('#dlg'); try { d.showModal(); } catch (e) { d.setAttribute('open', ''); }
  $('#dlg-in').focus();
}
function closeDialog(){ const d = $('#dlg'); try { d.close(); } catch (e) { d.removeAttribute('open'); } }
function bindDialog(){
  $('#dlg-cancel').addEventListener('click', closeDialog);
  $('#dlg-go').addEventListener('click', async () => {
    const code = extractCode($('#dlg-in').value);
    if (!code) { $('#dlg-err').textContent = 'That doesn’t look like a letter link or code.'; return; }
    try {
      const p = await decodeLetter(code); closeDialog();
      const back = dlgPrev === 'read' || dlgPrev === 'bad' ? 'write' : dlgPrev;
      openRead(p, {back: () => show(back)});
    } catch (e) { console.error(e); $('#dlg-err').textContent = 'That letter couldn’t be opened. The link may be cut short.'; }
  });
  $('#bad-open').addEventListener('click', openDialog);
  $('#bad-write').addEventListener('click', () => go('write'));
}

/* ---------- boot ---------- */
function boot(){
  buildGroups(); bindCompose(); bindSealed(); bindRead(); bindDialog(); updateCount(); syncForm();
  $('#brand').addEventListener('click', () => go('write'));
  $$('[data-nav]').forEach(b => b.addEventListener('click', () => go(b.dataset.nav)));
  $('#box-new').addEventListener('click', () => go('write'));
  addEventListener('hashchange', () => { if (extractCode(location.hash)) route(); });
  route();
}
boot();
})();
