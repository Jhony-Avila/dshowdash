// vc-catalogo-audit.mjs — auditoria do Catálogo V2 (#54). Modos:
//   gradecap  → captura, com a FLAG OFF, o DOM normalizado + hash do screenshot da .vc-grade
//               (baseline p/ provar identidade byte-a-byte entre commit2 e commit3).
//   full      → com a FLAG ON: screenshots de categorias/estados/A-B-C, overflow mobile,
//               contraste (proxy), performance OFF×ON. Best-effort e nunca derruba a grade.
//   node vc-catalogo-audit.mjs <gradecap|full> <screensDir> <jsonOut>
// env: CAND_SHA.
import { abrir, irParaHarness } from './navegador.mjs';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const MODO = process.argv[2] || 'full';
const SDIR = process.argv[3] || '/tmp/cat-screens';
const JOUT = process.argv[4] || '/tmp/cat-audit.json';
const SHA = process.env.CAND_SHA || 'cand';
mkdirSync(SDIR, { recursive: true });

const BASE = { 'as5.novo_shell': true, 'as6.visual_composer': true, 'as6.vc_3d': true, 'as6.vestuario_separado': true };
const ON = { ...BASE, 'as6.catalogo_v2': true };
const initFlags = (a) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(a.flags)); localStorage.setItem('avst.vc.onboarded', '1'); } catch (e) {} };

async function pagina(flags, w, h) {
  const s = await abrir({ viewport: { width: w, height: h }, webgl: true, init: initFlags, initArg: { flags } });
  const cerr = [], perr = [], freq = [];
  s.pagina.on('console', (m) => { if (m.type() === 'error') { const t = m.text(); if (!/Failed to load resource|feature-flags|favicon/i.test(t)) cerr.push(t.slice(0, 160)); } });
  s.pagina.on('pageerror', (e) => perr.push(String(e).slice(0, 160)));
  s.pagina.on('requestfailed', (r) => { const u = r.url(); if (!/feature-flags|favicon/i.test(u)) freq.push(u.slice(0, 120)); });
  await irParaHarness(s.pagina, 'avst-harness.html', 1400);
  await s.pagina.waitForSelector('[data-vc]', { timeout: 20000 }).catch(() => {});
  await s.pagina.waitForTimeout(500);
  return { ...s, cerr, perr, freq };
}
const clicaCat = (p, re) => p.evaluate((rs) => { const el = [...document.querySelectorAll('.vc-trilho .vc-cat')].find((x) => new RegExp(rs, 'i').test(x.getAttribute('aria-label') || x.textContent || '')); if (el) { el.click(); return true; } return false; }, re.source || re);
const shot = async (p, base, label) => {
  try { await p.screenshot({ path: `${SDIR}/${base}__clean.png` }); } catch (e) {}
  try { await p.evaluate((t) => { const d = document.createElement('div'); d.id = '__lbl'; d.textContent = t; d.style.cssText = 'position:fixed;left:2px;bottom:2px;z-index:99999;background:#000a;color:#0f0;font:9px monospace;padding:2px 4px;border-radius:3px;pointer-events:none'; document.body.appendChild(d); }, label); await p.screenshot({ path: `${SDIR}/${base}__audit.png` }); await p.evaluate(() => document.getElementById('__lbl')?.remove()); } catch (e) {}
};
// DOM normalizado da grade (ignora ruído de runtime; foca estrutura/atributos que importam)
const gradeDom = (p) => p.evaluate(() => {
  const g = document.querySelector('.vc-grade'); if (!g) return { n: 0, dom: '' };
  const norm = g.innerHTML.replace(/\s+/g, ' ').replace(/ (data-reactid|data-teste)="[^"]*"/g, '').trim();
  const cards = g.querySelectorAll('.vc-card, .vc-card-btn').length;
  return { n: cards, dom: norm };
});

async function gradecap() {
  // FLAG OFF, desktop, categoria estável (Cabelo). Captura DOM + hash do screenshot da grade.
  const s = await pagina(BASE, 1280, 900);
  const { pagina: p, navegador: b } = s;
  await clicaCat(p, /cabelo/i).catch(() => {}); await p.waitForTimeout(500);
  const d = await gradeDom(p);
  let shotHash = '';
  try { const el = await p.$('.vc-grade'); if (el) { const buf = await el.screenshot(); shotHash = createHash('sha256').update(buf).digest('hex'); } } catch (e) {}
  writeFileSync(JOUT, JSON.stringify({ modo: 'gradecap', sha: SHA, cards: d.n, domHash: createHash('sha256').update(d.dom).digest('hex'), domLen: d.dom.length, shotHash, cerr: s.cerr.length, perr: s.perr.length }, null, 2));
  console.log(`[cat gradecap] cards=${d.n} domHash=${createHash('sha256').update(d.dom).digest('hex').slice(0, 16)} shotHash=${shotHash.slice(0, 16)} cerr=${s.cerr.length}`);
  await b.close();
}

async function full() {
  const R = { modo: 'full', sha: SHA, shots: [], contraste: {}, overflow: {}, perf: {}, cerr: 0, perr: 0, freq: 0, notas: [] };
  // ---- Desktop flag ON: categorias exigidas + estados ----
  {
    const s = await pagina(ON, 1280, 900); const { pagina: p, navegador: b } = s;
    const cats = [['cabelo', /cabelo/i], ['rosto', /rosto/i], ['superior', /camis|blus|superior/i], ['calcas', /cal.as$/i], ['calcados', /cal.ados/i]];
    for (const [nome, re] of cats) { if (await clicaCat(p, re).catch(() => false)) { await p.waitForTimeout(450); await shot(p, `cat_${nome}`, `V2 ${nome} 1280 ${SHA}`); R.shots.push(`cat_${nome}`); } else R.notas.push(`cat ${nome} nao encontrada`); }
    // Rosto → subs (olhos/boca) best-effort
    await clicaCat(p, /rosto/i).catch(() => {}); await p.waitForTimeout(300);
    for (const [nome, re] of [['olhos', /olhos/i], ['boca', /boca/i]]) {
      const hit = await p.evaluate((rs) => { const el = [...document.querySelectorAll('.vc-sub,.vc-catnav button,[role="tab"]')].find((x) => new RegExp(rs, 'i').test(x.textContent || '')); if (el) { el.click(); return true; } return false; }, re.source).catch(() => false);
      if (hit) { await p.waitForTimeout(400); await shot(p, `cat_${nome}`, `V2 ${nome} 1280`); R.shots.push(`cat_${nome}`); } else R.notas.push(`sub ${nome} nao encontrada`);
    }
    // estados: hover / foco / equipado (clica 1º card) / vazio(busca)
    await clicaCat(p, /cabelo/i).catch(() => {}); await p.waitForTimeout(300);
    try { const c = await p.$('.vc-card-btn'); if (c) { await c.hover(); await p.waitForTimeout(200); await shot(p, 'estado_hover', 'V2 hover'); R.shots.push('estado_hover'); await c.focus(); await p.waitForTimeout(150); await shot(p, 'estado_foco', 'V2 foco'); R.shots.push('estado_foco'); await c.click(); await p.waitForTimeout(400); await shot(p, 'estado_equipado', 'V2 equipado'); R.shots.push('estado_equipado'); } } catch (e) { R.notas.push('estados: ' + String(e).slice(0, 60)); }
    // A/B/C (mesma categoria/escala): A=default; B=fundo neutro opaco; C=3col compacto
    await clicaCat(p, /cabelo/i).catch(() => {}); await p.waitForTimeout(300);
    await shot(p, 'variante_A', 'A: 2col translucido'); R.shots.push('variante_A');
    await p.evaluate(() => { const st = document.createElement('style'); st.id = '__B'; st.textContent = '.vc-root[data-catalogo-v2] .vc-thumb{background:#20242e !important;border-color:#333 !important}'; document.head.appendChild(st); });
    await p.waitForTimeout(200); await shot(p, 'variante_B', 'B: 2col fundo neutro opaco'); R.shots.push('variante_B');
    await p.evaluate(() => { document.getElementById('__B')?.remove(); document.querySelector('.vc-root[data-catalogo-v2]')?.setAttribute('data-grade', 'compacto'); });
    await p.waitForTimeout(250); await shot(p, 'variante_C', 'C: 3col compacto'); R.shots.push('variante_C');
    await p.evaluate(() => document.querySelector('.vc-root[data-catalogo-v2]')?.removeAttribute('data-grade'));
    // contraste (proxy): fundo do thumb NAO é branco sólido + largura do card em 2col
    const met = await p.evaluate(() => {
      const t = document.querySelector('.vc-thumb'); const card = document.querySelector('.vc-card'); const g = document.querySelector('.vc-grade');
      const bg = t ? getComputedStyle(t).backgroundColor + '|' + getComputedStyle(t).backgroundImage.slice(0, 40) : '';
      const cardW = card ? Math.round(card.getBoundingClientRect().width) : 0;
      const cols = g ? getComputedStyle(g).gridTemplateColumns.split(' ').length : 0;
      const branco = /rgb\(255,\s*255,\s*255\)/.test(t ? getComputedStyle(t).backgroundColor : '');
      return { bg, cardW, cols, branco };
    });
    R.contraste = met;
    R.cerr += s.cerr.length; R.perr += s.perr.length; R.freq += s.freq.length;
    await b.close();
  }
  // ---- Mobile flag ON: overflow (clip-aware) + screenshots + detentes ----
  const clip = `(el)=>{let a=el.parentElement;while(a&&a!==document.documentElement){const o=getComputedStyle(a).overflowX;if(o==='auto'||o==='scroll'||o==='hidden')return true;a=a.parentElement;}return false;}`;
  for (const [w, h] of [[320, 568], [360, 800], [390, 844], [430, 932]]) {
    const s = await pagina(ON, w, h); const { pagina: p, navegador: b } = s;
    await clicaCat(p, /cabelo/i).catch(() => {}); await p.waitForTimeout(400);
    const of = await p.evaluate((clipSrc) => {
      const W = innerWidth; const clipFn = eval(clipSrc);
      const docOv = Math.max(0, document.documentElement.scrollWidth - W);
      let real = 0; document.querySelectorAll('*').forEach((el) => { const r = el.getBoundingClientRect(); if (r.right > W + 1 && !clipFn(el)) real = Math.max(real, Math.round(r.right - W)); });
      return { docOv, real };
    }, clip);
    R.overflow[w] = of;
    if ([320, 390].includes(w)) { await shot(p, `mobile_${w}`, `V2 mobile ${w}`); R.shots.push(`mobile_${w}`); }
    if (w === 390) { for (const g of ['meio', 'expandida']) { await p.evaluate((e) => document.querySelector('.vc-root[data-vc]')?.setAttribute('data-gaveta', e), g); await p.waitForTimeout(300); await shot(p, `mobile_sheet_${g}`, `V2 sheet ${g} 390`); R.shots.push(`mobile_sheet_${g}`); } }
    R.cerr += s.cerr.length; R.perr += s.perr.length; R.freq += s.freq.length;
    await b.close();
  }
  R.overflowFailures = Object.values(R.overflow).filter((o) => o.docOv > 1 || o.real > 1).length;
  // ---- Performance OFF × ON (grade visível + #svg) ----
  for (const [tag, flags] of [['off', BASE], ['on', ON]]) {
    const s = await pagina(flags, 1280, 900); const { pagina: p, navegador: b } = s;
    const t0 = Date.now(); await clicaCat(p, /cabelo/i).catch(() => {}); await p.waitForSelector('.vc-grade .vc-card, .vc-grade .vc-card-btn', { timeout: 8000 }).catch(() => {});
    const dt = Date.now() - t0;
    const nsvg = await p.evaluate(() => document.querySelectorAll('.vc-grade svg').length);
    const t1 = Date.now(); await clicaCat(p, /cal.as$/i).catch(() => {}); await p.waitForTimeout(50); const dcat = Date.now() - t1;
    R.perf[tag] = { gradeMs: dt, svgs: nsvg, catSwitchMs: dcat };
    await b.close();
  }
  writeFileSync(JOUT, JSON.stringify(R, null, 2));
  console.log(`[cat full] shots=${R.shots.length} overflowFailures=${R.overflowFailures} cerr=${R.cerr} perr=${R.perr} freq=${R.freq}`);
  console.log('[cat] contraste=' + JSON.stringify(R.contraste));
  console.log('[cat] overflow=' + JSON.stringify(R.overflow));
  console.log('[cat] perf=' + JSON.stringify(R.perf));
  for (const n of R.notas) console.log('[cat nota] ' + n);
}

if (MODO === 'gradecap') await gradecap(); else await full();
