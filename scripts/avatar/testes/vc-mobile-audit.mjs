// vc-mobile-audit.mjs — auditoria de layout mobile do VC (restauração bottom-sheet).
// Mede overflow por elemento em toda a matriz de viewports (flag ON e OFF), alvos de
// toque, console/pageerror/rede, e captura screenshots limpas + de auditoria. Também
// grava os rects de elementos-chave no DESKTOP para diff estrutural antes/depois.
//   node vc-mobile-audit.mjs <phase: before|after> <screensDir> <jsonOut>
// env: CAND_SHA (rótulo).
import { abrir, irParaHarness } from './navegador.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';

const PHASE = process.argv[2] || 'after';
const SDIR = process.argv[3] || '/tmp/mob-screens';
const JOUT = process.argv[4] || '/tmp/mob-audit.json';
const SHA = process.env.CAND_SHA || 'cand';
mkdirSync(SDIR, { recursive: true });

const ON = { 'as5.novo_shell': true, 'as6.visual_composer': true, 'as6.vc_3d': true, 'as6.vestuario_separado': true };
const OFF = { 'as5.novo_shell': true, 'as6.visual_composer': true }; // clássica: vestuário_separado desligado
const initFlags = (a) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(a.flags)); localStorage.setItem('avst.vc.onboarded', '1'); } catch (e) {} };

const PORTRAIT = [[320, 568], [360, 800], [375, 812], [390, 844], [393, 852], [430, 932]];
const LANDSCAPE = [[844, 390]];
const BREAK = [[768, 1024], [769, 1024]];
const DESKTOP = [[1280, 900]];

// selectors-chave p/ diff estrutural desktop (posição/tamanho não podem mudar)
const KEY = ['.vc-root[data-vc]', '.vc-barra', '.vc-corpo', '.vc-trilho', '.vc-palco', '.vc-palco-wrap', '.vc-painel', '.vc-grade', '.vc-catnav'];

async function novaPagina(flags, vw, vh) {
  const s = await abrir({ viewport: { width: vw, height: vh }, webgl: true, init: initFlags, initArg: { flags } });
  const cerr = [], perr = [], freq = [];
  s.pagina.on('console', (m) => { if (m.type() === 'error') { const t = m.text(); if (!/Failed to load resource|feature-flags|favicon/i.test(t)) cerr.push(t.slice(0, 160)); } });
  s.pagina.on('pageerror', (e) => perr.push(String(e).slice(0, 160)));
  s.pagina.on('requestfailed', (r) => { const u = r.url(); if (!/feature-flags|favicon/i.test(u)) freq.push(u.slice(0, 120)); });
  await irParaHarness(s.pagina, 'avst-harness.html', 1400);
  await s.pagina.waitForSelector('[data-vc]', { timeout: 20000 }).catch(() => {});
  await s.pagina.waitForTimeout(500);
  return { ...s, cerr, perr, freq };
}

async function medir(p) {
  return await p.evaluate((KEY) => {
    const W = innerWidth;
    const de = document.documentElement, body = document.body;
    const root = document.querySelector('.vc-root[data-vc]');
    const q = (s) => document.querySelector(s);
    const ox = (el) => el ? (el.scrollWidth - el.clientWidth) : 0;
    const desc = (el) => el ? (el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).trim().replace(/\s+/g, '.').slice(0, 40) : '')) : '(null)';
    // offenders: ultrapassam a viewport. REAL = não-clipado por nenhum ancestral com
    // overflow-x auto/scroll/hidden (trilho rolável e SVG[overflow:hidden] são contidos,
    // não são overflow de documento — o critério é "não aumentar a largura do documento").
    const clipado = (el) => { let a = el.parentElement; while (a && a !== document.documentElement) { const o = getComputedStyle(a).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden') return true; a = a.parentElement; } return false; };
    const off = [], offReais = [];
    document.querySelectorAll('*').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.right > W + 1 || r.left < -1) {
        const rec = { sel: desc(el), w: Math.round(r.width), right: Math.round(r.right), left: Math.round(r.left), sw: el.scrollWidth, cw: el.clientWidth };
        off.push(rec);
        if (!clipado(el)) offReais.push(rec);
      }
    });
    off.sort((a, b) => b.right - a.right); offReais.sort((a, b) => b.right - a.right);
    // touch targets: interativos visíveis com menor dimensão < 44
    const touchBad = [];
    document.querySelectorAll('button,a[href],input,[role="button"],[tabindex]').forEach((el) => {
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || r.width < 1 || r.height < 1) return;
      if (r.width < 44 || r.height < 44) touchBad.push({ sel: desc(el), w: Math.round(r.width), h: Math.round(r.height) });
    });
    const rail = q('.vc-trilho'), sheet = q('.vc-painel'), grade = q('.vc-grade');
    // rects dos elementos-chave (p/ diff desktop)
    const rects = {};
    for (const sel of KEY) { const el = q(sel); if (el) { const r = el.getBoundingClientRect(); rects[sel] = { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; } }
    return {
      W, docSW: de.scrollWidth, docCW: de.clientWidth,
      bodyOX: body ? (body.scrollWidth - body.clientWidth) : 0,
      rootOX: ox(root),
      railSW: rail ? rail.scrollWidth : 0, railCW: rail ? rail.clientWidth : 0,
      sheetOX: ox(sheet), gradeOX: ox(grade),
      docOverflow: Math.max(0, de.scrollWidth - W),
      offenders: off.slice(0, 8), offReais: offReais.slice(0, 8), offReaisN: offReais.length,
      touchBad: touchBad.slice(0, 12), touchBadN: touchBad.length,
      rects,
    };
  }, KEY);
}

async function shot(p, base, label) {
  try { await p.screenshot({ path: `${SDIR}/${base}__clean.png`, fullPage: false }); } catch (e) {}
  try {
    await p.evaluate((txt) => { const d = document.createElement('div'); d.id = '__auditlbl'; d.textContent = txt; d.style.cssText = 'position:fixed;left:2px;bottom:2px;z-index:99999;background:#000a;color:#0f0;font:9px monospace;padding:2px 4px;border-radius:3px;pointer-events:none;max-width:60vw;white-space:nowrap;overflow:hidden'; document.body.appendChild(d); }, label);
    await p.screenshot({ path: `${SDIR}/${base}__audit.png`, fullPage: false });
    await p.evaluate(() => { const d = document.getElementById('__auditlbl'); d && d.remove(); });
  } catch (e) {}
}

const catByRe = async (p, re) => p.evaluate((rs) => {
  const rx = new RegExp(rs, 'i');
  const el = [...document.querySelectorAll('.vc-trilho .vc-cat')].find((x) => rx.test(x.getAttribute('aria-label') || x.textContent || ''));
  if (el) { el.click(); return true; } return false;
}, re.source);
const setGaveta = (p, estado) => p.evaluate((e) => { const r = document.querySelector('.vc-root[data-vc]'); if (r) r.setAttribute('data-gaveta', e); }, estado);

const R = { phase: PHASE, sha: SHA, viewports: {}, gate: {}, shots: [], notas: [] };
let cerrTot = 0, perrTot = 0, freqTot = 0, touchTot = 0, overflowFails = 0;
const combos = [];
for (const [w, h] of PORTRAIT) combos.push({ w, h, flag: 'ON', flags: ON, kind: 'portrait' });
for (const [w, h] of PORTRAIT) combos.push({ w, h, flag: 'OFF', flags: OFF, kind: 'portrait' });
for (const [w, h] of LANDSCAPE) combos.push({ w, h, flag: 'ON', flags: ON, kind: 'landscape' });
for (const [w, h] of BREAK) combos.push({ w, h, flag: 'ON', flags: ON, kind: 'break' });
for (const [w, h] of DESKTOP) { combos.push({ w, h, flag: 'ON', flags: ON, kind: 'desktop' }); combos.push({ w, h, flag: 'OFF', flags: OFF, kind: 'desktop' }); }

// no "before" só precisamos: evidência do bug (320/390/430 ON) + desktop ref (rects+shot)
const beforeSet = (c) => (c.kind === 'portrait' && c.flag === 'ON' && [320, 390, 430].includes(c.w)) || (c.kind === 'desktop' && c.flag === 'ON');
// no "mid" (vestuário sem CSS) só medimos rects do desktop ON — baseline p/ isolar o diff do CSS
const midSet = (c) => c.kind === 'desktop' && c.flag === 'ON';

for (const c of combos) {
  if (PHASE === 'before' && !beforeSet(c)) continue;
  if (PHASE === 'mid' && !midSet(c)) continue;
  const s = await novaPagina(c.flags, c.w, c.h);
  const { pagina: p, navegador: b } = s;
  // exercita catálogo de vestuário quando mobile+ON (abre "Calças")
  if (c.kind !== 'desktop' && c.flag === 'ON') { await catByRe(p, /cal.as$/i).catch(() => {}); await p.waitForTimeout(400); }
  const m = await medir(p);
  const key = `${c.w}x${c.h}_${c.flag}`;
  // OVERFLOW REAL = documento não rola na horizontal E nenhum elemento NÃO-CLIPADO passa da
  // viewport. root.scrollWidth é informativo (inflado por trilho rolável + SVG[hidden]).
  const docOK = m.docSW <= m.W + 1, bodyOK = m.bodyOX <= 1, realOK = m.offReaisN === 0;
  const fail = !(docOK && bodyOK && realOK);
  const isMobileGate = c.kind !== 'desktop';
  if (fail) overflowFails++;
  cerrTot += s.cerr.length; perrTot += s.perr.length; freqTot += s.freq.length;
  touchTot = Math.max(touchTot, isMobileGate ? m.touchBadN : 0); // pior viewport, não soma cumulativa
  R.viewports[key] = {
    kind: c.kind, flag: c.flag, W: m.W, docSW: m.docSW, bodyOX: m.bodyOX, rootOX: m.rootOX,
    docOverflow: m.docOverflow, railScroll: m.railSW - m.railCW, sheetOX: m.sheetOX, gradeOX: m.gradeOX,
    overflowFail: fail, offReaisN: m.offReaisN, offReais: m.offReais,
    touchBadN: m.touchBadN, touchBad: m.touchBad, offenders: m.offenders,
    cerr: s.cerr.length, perr: s.perr.length, freq: s.freq.length, rects: m.rects,
  };
  // screenshots
  const tag = `${PHASE}_${key}`;
  if (PHASE === 'mid') {
    // só rects; sem screenshots (baseline de diff desktop)
  } else if (PHASE === 'before') {
    if (c.kind === 'portrait') { await shot(p, `bug_${tag}`, `BEFORE bug ${key} ${SHA}`); R.shots.push(`bug_${tag}`); }
    if (c.kind === 'desktop') { await shot(p, `desktop_${tag}`, `BEFORE desktop ${key} ${SHA}`); R.shots.push(`desktop_${tag}`); }
  } else {
    // AFTER: cobre a lista de evidências exigida
    if (c.kind === 'portrait' && [320, 390, 430].includes(c.w) && c.flag === 'ON') { await shot(p, `after_${tag}`, `AFTER ${key} ${SHA}`); R.shots.push(`after_${tag}`); }
    if (c.kind === 'portrait' && c.w === 390 && c.flag === 'OFF') { await shot(p, `flagoff_${tag}`, `AFTER flagOFF ${key} ${SHA}`); R.shots.push(`flagoff_${tag}`); }
    if (c.kind === 'landscape') { await shot(p, `landscape_${tag}`, `AFTER landscape ${key} ${SHA}`); R.shots.push(`landscape_${tag}`); }
    if (c.kind === 'break') { await shot(p, `break_${tag}`, `AFTER breakpoint ${key} ${SHA}`); R.shots.push(`break_${tag}`); }
    if (c.kind === 'desktop' && c.flag === 'ON') { await shot(p, `desktop_${tag}`, `AFTER desktop ${key} ${SHA}`); R.shots.push(`desktop_${tag}`); }
    // estados ricos só no 390 ON
    if (c.kind === 'portrait' && c.w === 390 && c.flag === 'ON') {
      await shot(p, `rail_${tag}`, `AFTER trilho ${key}`); R.shots.push(`rail_${tag}`);
      for (const g of ['recolhida', 'meio', 'expandida']) { await setGaveta(p, g); await p.waitForTimeout(300); await shot(p, `sheet_${g}_${tag}`, `AFTER sheet ${g} ${key}`); R.shots.push(`sheet_${g}_${tag}`); }
      await setGaveta(p, 'meio');
      if (await catByRe(p, /blus|camis|superior|torso/i).catch(() => false)) { await p.waitForTimeout(300); await shot(p, `cat_superior_${tag}`, `AFTER superior ${key}`); R.shots.push(`cat_superior_${tag}`); } else R.notas.push('cat superior: seletor nao encontrado');
      if (await catByRe(p, /cal.as$/i).catch(() => false)) { await p.waitForTimeout(300); await shot(p, `cat_calcas_${tag}`, `AFTER calcas ${key}`); R.shots.push(`cat_calcas_${tag}`); } else R.notas.push('cat calcas: seletor nao encontrado');
      if (await catByRe(p, /cal.ados|sapat|t.nis|p.s$/i).catch(() => false)) { await p.waitForTimeout(300); await shot(p, `cat_calcados_${tag}`, `AFTER calcados ${key}`); R.shots.push(`cat_calcados_${tag}`); } else R.notas.push('cat calcados: seletor nao encontrado');
      // cores (best-effort)
      const cor = await p.evaluate(() => { const el = [...document.querySelectorAll('button,[role="button"]')].find((x) => /cor/i.test(x.getAttribute('aria-label') || x.textContent || '')); if (el) { el.click(); return true; } return false; }).catch(() => false);
      if (cor) { await p.waitForTimeout(300); await shot(p, `cores_${tag}`, `AFTER cores ${key}`); R.shots.push(`cores_${tag}`); } else R.notas.push('cores: seletor nao encontrado (best-effort)');
      // hotspots (best-effort)
      for (const [nome, re] of [['pernas', /perna|leg|cal.a/i], ['pes', /p.s|feet|cal.ado/i]]) {
        const hit = await p.evaluate((rs) => { const rx = new RegExp(rs, 'i'); const el = [...document.querySelectorAll('[data-hotspot],[class*="hotspot"],.vc-palco [role="button"]')].find((x) => rx.test(x.getAttribute('aria-label') || x.getAttribute('data-hotspot') || '')); if (el) { el.click(); return true; } return false; }, re.source).catch(() => false);
        if (hit) { await p.waitForTimeout(300); await shot(p, `hotspot_${nome}_${tag}`, `AFTER hotspot ${nome} ${key}`); R.shots.push(`hotspot_${nome}_${tag}`); } else R.notas.push(`hotspot ${nome}: seletor nao encontrado (best-effort)`);
      }
    }
  }
  await b.close();
}

// gate agregado
const mobileKeys = Object.entries(R.viewports).filter(([, v]) => v.kind !== 'desktop');
const anyDocOverflow = Object.values(R.viewports).some((v) => v.overflowFail);
const anyReal = Object.values(R.viewports).some((v) => v.offReaisN > 0);
const maxRootOX = Math.max(0, ...Object.values(R.viewports).map((v) => v.rootOX));
R.gate = {
  DOCUMENT_SCROLL_WIDTH_LE_CLIENT_WIDTH: Object.values(R.viewports).every((v) => v.docSW <= v.W + 1) ? 'YES' : 'NO',
  BODY_OVERFLOW_X: Object.values(R.viewports).some((v) => v.bodyOX > 1) ? 'YES' : 'NO',
  // VC_ROOT_OVERFLOW_X = existe overflow REAL (não-clipado) dentro do root? (não o scrollWidth cru)
  VC_ROOT_OVERFLOW_X: anyReal ? 'YES' : 'NO',
  VC_ROOT_SCROLLWIDTH_INFO: maxRootOX + 'px (informativo: inclui trilho rolável + SVG[hidden] clipados)',
  RAIL_OVERFLOW_CONTAINED: !anyDocOverflow ? 'YES' : 'NO',
  SHEET_OVERFLOW_CONTAINED: !anyReal ? 'YES' : 'NO',
  ASSET_GRID_OVERFLOW_CONTAINED: !anyReal ? 'YES' : 'NO',
  OVERFLOW_FAILURES: overflowFails,
};
R.totais = { CONSOLE_ERRORS: cerrTot, PAGE_ERRORS: perrTot, FAILED_REQUESTS: freqTot, TOUCH_TARGET_FAILURES: touchTot, SCREENSHOTS: R.shots.length };
// PASS por viewport (nome esperado pelo verdict)
R.perViewport = {};
for (const [w, h] of [...PORTRAIT, ...LANDSCAPE, ...BREAK]) { const k = `${w}x${h}_ON`; const v = R.viewports[k]; if (v) R.perViewport[w] = v.overflowFail ? 'FAIL' : 'PASS'; }
// flag ON/OFF mobile agregado
const onMob = mobileKeys.filter(([, v]) => v.flag === 'ON'); const offMob = Object.entries(R.viewports).filter(([, v]) => v.flag === 'OFF' && v.kind !== 'desktop');
R.FLAG_ON_MOBILE = onMob.every(([, v]) => !v.overflowFail) ? 'PASS' : 'FAIL';
R.FLAG_OFF_MOBILE = offMob.length ? (offMob.every(([, v]) => !v.overflowFail) ? 'PASS' : 'FAIL') : 'n/a';

writeFileSync(JOUT, JSON.stringify(R, null, 2));
console.log(`[mob ${PHASE}] OVERFLOW_FAILURES=${overflowFails} shots=${R.shots.length} touchBad=${touchTot} cerr=${cerrTot} perr=${perrTot} freq=${freqTot}`);
console.log('[mob] GATE=' + JSON.stringify(R.gate));
console.log('[mob] FLAG_ON_MOBILE=' + R.FLAG_ON_MOBILE + ' FLAG_OFF_MOBILE=' + R.FLAG_OFF_MOBILE);
console.log('[mob] perViewport=' + JSON.stringify(R.perViewport));
for (const n of R.notas) console.log('[mob nota] ' + n);
process.exit(overflowFails > 0 ? 1 : 0);
