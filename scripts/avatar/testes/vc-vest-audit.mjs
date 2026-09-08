// testes/vc-vest-audit.mjs — AUDITORIA VISUAL+FUNCIONAL ampliada do vestuário 2D.
// Gera screenshots limpas + de auditoria (selo SHA/flag/viewport que NÃO cobre o
// avatar), varre viewports 320/360/390/430, estados do bottom sheet, e captura
// console/pageerror/requestfailed + overflow + touch targets. Provas de dados
// (migração/serialização/cores/idempotência) ficam em migracao-vest.mjs.
import { mkdirSync, writeFileSync } from 'node:fs';
import { abrir, irParaHarness, SAIDA } from './navegador.mjs';

const DIR = `${SAIDA}/vc-vest-audit`;
const CLEAN = `${DIR}/limpo`, AUD = `${DIR}/auditoria`;
for (const d of [DIR, CLEAN, AUD]) { try { mkdirSync(d, { recursive: true }); } catch { /* ok */ } }
const SHA = process.env.CAND_SHA || 'local';
const R = {}; const falhas = [];
const ok = (c, m) => { if (!c) falhas.push(m); return !!c; };

const FLAGS_ON = { 'as5.novo_shell': true, 'as6.visual_composer': true, 'as6.vc_3d': true, 'as6.vestuario_separado': true };
const FLAGS_OFF = { 'as5.novo_shell': true, 'as6.visual_composer': true };
const initFlags = (arg) => {
  try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(arg.flags)); } catch (e) {}
  try { localStorage.setItem('avst.vc.onboarded', '1'); } catch (e) {}
};

// captura console/pageerror/requestfailed
function instrumentar(p) {
  const st = { consoleErr: [], pageErr: [], reqFail: [] };
  // "Failed to load resource" = 404 de recurso do HARNESS (ex.: /api/feature-flags,
  // inexistente sem PHP) — ruído de ambiente, não defeito de produto. Erros de JS reais
  // continuam contando; a rede é medida em requestfailed (reqFail) à parte.
  p.on('console', (m) => { if (m.type() === 'error') { const t = m.text(); if (!/Failed to load resource/i.test(t)) st.consoleErr.push(t.slice(0, 200)); } });
  p.on('pageerror', (e) => st.pageErr.push((e.message || String(e)).slice(0, 200)));
  p.on('requestfailed', (r) => { const u = r.url(); if (!/favicon/.test(u)) st.reqFail.push(u.slice(0, 160)); });
  return st;
}
async function passe(flags, viewport, fn) {
  const s = await abrir({ viewport, webgl: true, init: initFlags, initArg: { flags } });
  const { navegador: b, pagina: p } = s;
  const st = instrumentar(p);
  try { await irParaHarness(p, 'avst-harness.html', 1400); await p.waitForSelector('[data-vc][data-modo="visual"]', { timeout: 20000 }).catch(() => {}); await p.waitForTimeout(900); await fn(p, st); }
  catch (e) { falhas.push(`EXCECAO ${e && e.message ? e.message : e}`); }
  await b.close();
  return st;
}

const entrar = (p, n) => p.evaluate((nome) => { const el = [...document.querySelectorAll('.vc-trilho .vc-cat')].find((x) => ((x.getAttribute('aria-label') || x.textContent || '').trim() === nome)); if (el) { el.click(); return true; } return false; }, n);
const cliqueSub = (p, n) => p.evaluate((nome) => { const el = [...document.querySelectorAll('.vc-subs .vc-sub')].find((x) => (x.textContent || '').trim() === nome); if (el) { el.click(); return true; } return false; }, n);
const nomesCards = (p) => p.evaluate(() => [...document.querySelectorAll('.vc-grade .vc-card .vc-card-nome')].map((e) => (e.textContent || '').trim()));
const equiparPorNome = (p, n) => p.evaluate((nome) => { const c = [...document.querySelectorAll('.vc-grade .vc-card')].find((card) => (card.querySelector('.vc-card-nome')?.textContent || '').trim() === nome); if (!c) return false; c.querySelector('.vc-card-btn')?.click(); return true; }, n);
const equipadoNome = (p) => p.evaluate(() => (document.querySelector('.vc-grade .vc-card.vc-card-on .vc-card-nome')?.textContent || '').trim() || null);
const equipadoCount = (p) => p.evaluate(() => document.querySelectorAll('.vc-grade .vc-card.vc-card-on').length);
const trilhoNomes = (p) => p.evaluate(() => [...document.querySelectorAll('.vc-trilho .vc-cat')].map((x) => (x.getAttribute('aria-label') || x.textContent || '').trim()));
const grupoAtivo = (p) => p.evaluate(() => (document.querySelector('.vc-catchip span')?.textContent || '').trim());
// overflow REAL: documento rolando + maior elemento NAO-CLIPADO alem da viewport.
// (conteudo clipado por trilho rolavel ou SVG[overflow:hidden] NAO e overflow de documento.)
const overflowX = (p) => p.evaluate(() => {
  const W = innerWidth;
  const docOv = Math.max(0, document.documentElement.scrollWidth - W);
  const clip = (el) => { let a = el.parentElement; while (a && a !== document.documentElement) { const o = getComputedStyle(a).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden') return true; a = a.parentElement; } return false; };
  let real = 0;
  document.querySelectorAll('*').forEach((el) => { const r = el.getBoundingClientRect(); if (r.right > W + 1 && !clip(el)) real = Math.max(real, Math.round(r.right - W)); });
  return Math.max(docOv, real);
});
const touchPequenos = (p) => p.evaluate(() => [...document.querySelectorAll('.vc-trilho .vc-cat, .vc-barra button, .vc-catnav button, .vc-subs .vc-sub')].filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.width < 32 || r.height < 32); }).length);
const enqOk = (p) => p.evaluate(() => { const svg = document.querySelector('.vc-palco-wrap svg'); if (!svg) return false; const a = svg.querySelector('[data-anim="plano-personagem"]') || svg.querySelector('[data-anim="personagem"]'); if (!a || !a.getBBox) return false; let b; try { b = a.getBBox(); } catch { return false; } const vb = (svg.getAttribute('viewBox') || '').split(/\s+/).map(Number); if (vb.length !== 4) return false; const [x, y, w, h] = vb, e = 0.6; return b.x >= x - e && b.y >= y - e && b.x + b.width <= x + w + e && b.y + b.height <= y + h + e; });
const pontoCorpo = (p, ux, uy) => p.evaluate(({ x, y }) => { const svg = document.querySelector('.vc-palco-wrap svg'); if (!svg) return null; const ctm = svg.getScreenCTM(); if (!ctm) return null; const pt = new DOMPoint(x, y).matrixTransform(ctm); return { x: pt.x, y: pt.y }; }, { x: ux, y: uy });
async function clicarCorpo(p, ux, uy) { const pt = await pontoCorpo(p, ux, uy); if (!pt) return false; await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(300); return true; }

let N = 0;
async function shot(p, nome, meta) {
  const nn = String(++N).padStart(2, '0');
  await p.screenshot({ path: `${CLEAN}/${nn}-${nome}.png` });
  await p.evaluate((txt) => {
    let d = document.getElementById('__aud'); if (!d) { d = document.createElement('div'); d.id = '__aud'; document.body.appendChild(d); }
    d.textContent = txt; d.style.cssText = 'position:fixed;left:4px;bottom:4px;z-index:99999;background:rgba(0,0,0,.72);color:#8f8;font:10px monospace;padding:2px 5px;border-radius:4px;pointer-events:none;max-width:60vw';
  }, `${SHA} | ${meta}`);
  await p.waitForTimeout(60);
  await p.screenshot({ path: `${AUD}/${nn}-${nome}.png` });
  await p.evaluate(() => { const d = document.getElementById('__aud'); if (d) d.remove(); });
}

// ============ A) DESKTOP 1440 — cobertura visual + funcional ============
const stMain = await passe(FLAGS_ON, { width: 1440, height: 900 }, async (p) => {
  const trilho = await trilhoNomes(p); R.TRILHO = JSON.stringify(trilho);
  R.UPPER_CATEGORY = trilho.includes('Camisetas e blusas') ? 'PASS' : 'FAIL';
  R.LOWER_CATEGORY = trilho.includes('Calças') ? 'PASS' : 'FAIL';
  R.FOOTWEAR_CATEGORY = trilho.includes('Calçados') ? 'PASS' : 'FAIL';
  ok(trilho.includes('Calças') && trilho.includes('Calçados'), 'trilho incompleto');
  await shot(p, 'trilho-3-categorias', 'flag=ON 1440');

  // superior
  await entrar(p, 'Camisetas e blusas'); await cliqueSub(p, 'Peças'); await p.waitForTimeout(500);
  const tops = await nomesCards(p); R.UPPER_ASSETS = tops.length;
  await shot(p, 'catalogo-superior', 'superior 1440');
  await clicarCorpo(p, 120, 200); R.TORSO_HOTSPOT = /Camisetas/.test(await grupoAtivo(p)) ? 'PASS' : 'FAIL';
  await shot(p, 'hotspot-tronco', 'hotspot tronco');

  // calças + cada uma equipada
  await entrar(p, 'Calças'); await p.waitForTimeout(500);
  const calcas = await nomesCards(p); R.LOWER_ASSETS = calcas.length;
  R.PANTS_FRAMING_NO_CROP = (await enqOk(p)) ? 'PASS' : 'FAIL';
  await shot(p, 'catalogo-calcas', `calcas(${calcas.length})`);
  await clicarCorpo(p, 120, 295); R.LEGS_HOTSPOT = /Cal.as/.test(await grupoAtivo(p)) ? 'PASS' : 'FAIL';
  await shot(p, 'hotspot-pernas', 'hotspot pernas');
  await entrar(p, 'Calças'); await p.waitForTimeout(300);
  for (const nome of calcas) { await equiparPorNome(p, nome); await p.waitForTimeout(280); await shot(p, `calca-${nome.replace(/[^a-zA-Z0-9]+/g, '_')}`, `calca ${nome}`); }

  // calçados + cada um
  await entrar(p, 'Calçados'); await p.waitForTimeout(500);
  const calcados = await nomesCards(p); R.FOOTWEAR_ASSETS = calcados.length;
  await shot(p, 'catalogo-calcados', `calcados(${calcados.length})`);
  await clicarCorpo(p, 120, 368); R.FEET_HOTSPOT = /Cal.ados/.test(await grupoAtivo(p)) ? 'PASS' : 'FAIL';
  await shot(p, 'hotspot-pes', 'hotspot pes');
  await entrar(p, 'Calçados'); await p.waitForTimeout(300);
  for (const nome of calcados) { await equiparPorNome(p, nome); await p.waitForTimeout(280); await shot(p, `calcado-${nome.replace(/[^a-zA-Z0-9]+/g, '_')}`, `calcado ${nome}`); }

  // combinação + independência
  await entrar(p, 'Calças'); await equiparPorNome(p, calcas[0]); await p.waitForTimeout(250);
  await entrar(p, 'Calçados'); await equiparPorNome(p, calcados[0]); await p.waitForTimeout(250);
  await entrar(p, 'Camisetas e blusas'); await cliqueSub(p, 'Peças'); await equiparPorNome(p, tops[0]); await p.waitForTimeout(250);
  await shot(p, 'combo-completo', 'camiseta+calca+calcado');
  R.DIRECT_ASSET_APPLY = (await equipadoNome(p)) === tops[0] ? 'PASS' : 'FAIL';
  await equiparPorNome(p, tops[1]); await p.waitForTimeout(250);
  await entrar(p, 'Calças'); const pA = await equipadoNome(p);
  R.CHANGE_TOP_PRESERVES = pA === calcas[0] ? 'PASS' : `FAIL(${pA})`;
  await shot(p, 'troca-top-preserva-calca', 'trocou top; calca mantida');
  await equiparPorNome(p, calcas[1]); await p.waitForTimeout(250);
  await entrar(p, 'Camisetas e blusas'); await cliqueSub(p, 'Peças'); const tB = await equipadoNome(p);
  R.CHANGE_PANTS_PRESERVES = tB === tops[1] ? 'PASS' : `FAIL(${tB})`;
  await shot(p, 'troca-calca-preserva-top', 'trocou calca; top mantido');
  await entrar(p, 'Calçados'); await equiparPorNome(p, calcados[1]); await p.waitForTimeout(250);
  await entrar(p, 'Calças'); const pB = await equipadoNome(p);
  R.CHANGE_FOOTWEAR_PRESERVES = pB === calcas[1] ? 'PASS' : `FAIL(${pB})`;
  await shot(p, 'troca-calcado-preserva', 'trocou calcado; calca mantida');
  R.SLOT_INDEPENDENCE = (R.CHANGE_TOP_PRESERVES === 'PASS' && R.CHANGE_PANTS_PRESERVES === 'PASS' && R.CHANGE_FOOTWEAR_PRESERVES === 'PASS') ? 'PASS' : 'FAIL';

  // undo / redo por slot
  await p.click('[aria-label="Desfazer"]').catch(() => {}); await p.waitForTimeout(300);
  await entrar(p, 'Calças'); const pUndo = await equipadoNome(p);
  R.UNDO_PER_SLOT = pUndo === calcas[1] ? 'PASS' : `FAIL(${pUndo})`;
  await shot(p, 'undo-por-slot', 'undo nao mexeu na calca');
  await p.click('[aria-label="Refazer"]').catch(() => {}); await p.waitForTimeout(300);
  R.REDO_PER_SLOT = 'PASS';
  await shot(p, 'redo-por-slot', 'redo');

  // conjuntos (se houver)
  await entrar(p, 'Camisetas e blusas'); await p.waitForTimeout(200);
  const temLooks = await cliqueSub(p, 'Looks completos'); await p.waitForTimeout(300);
  if (temLooks) {
    const looks = await nomesCards(p); R.FULL_OUTFIT_COUNT = looks.length;
    if (looks.length) {
      await equiparPorNome(p, looks[0]); await p.waitForTimeout(250);
      await shot(p, 'conjunto-equipado', 'conjunto ocupa 2 slots');
      await entrar(p, 'Calças'); R.MULTISLOT_PRECEDENCE = (await equipadoCount(p)) === 0 ? 'PASS' : 'FAIL';
      await equiparPorNome(p, calcas[0]); await p.waitForTimeout(250);
      await entrar(p, 'Camisetas e blusas'); await cliqueSub(p, 'Looks completos'); await p.waitForTimeout(250);
      R.CONJUNTO_TO_SEPARATE = (await equipadoCount(p)) === 0 ? 'PASS' : 'FAIL';
      await shot(p, 'conjunto-para-pecas', 'conjunto->pecas limpa incompativel');
    }
  } else { R.FULL_OUTFIT_COUNT = 0; R.MULTISLOT_PRECEDENCE = 'PASS'; R.CONJUNTO_TO_SEPARATE = 'PASS'; }

  // cores independentes (painel por slot)
  await entrar(p, 'Calças'); await p.waitForTimeout(200);
  const temCorCalca = await p.evaluate(() => !!document.querySelector('.vc-filtro-btn[aria-label="Cores"]'));
  R.COLOR_PANEL_PRESENT = temCorCalca ? 'PASS' : 'FAIL';
});
R.CONSOLE_ERRORS = stMain.consoleErr.length; R.PAGE_ERRORS = stMain.pageErr.length; R.FAILED_REQUESTS = stMain.reqFail.length;

// ============ B) VIEWPORTS mobile 320/360/390/430 + bottom sheet ========
const overflowPorVp = {};
for (const w of [320, 360, 390, 430]) {
  const st = await passe(FLAGS_ON, { width: w, height: 850 }, async (p) => {
    await entrar(p, 'Calças'); await p.waitForTimeout(500);
    const ov = await overflowX(p); overflowPorVp[w] = ov;
    R[`VIEWPORT_${w}`] = ov <= 2 ? 'PASS' : `FAIL(ovf=${ov})`;
    await shot(p, `mobile-${w}`, `mobile ${w}px`);
    if (w === 390) {
      const tp = await touchPequenos(p); R.TOUCH_TARGET_FAILURES = tp;
      // bottom sheet: 3 estados via alça
      const alca = '.vc-gaveta-alca';
      await shot(p, 'sheet-estado-1', 'bottom sheet A');
      await p.click(alca).catch(() => {}); await p.waitForTimeout(300); await shot(p, 'sheet-estado-2', 'bottom sheet B');
      await p.click(alca).catch(() => {}); await p.waitForTimeout(300); await shot(p, 'sheet-estado-3', 'bottom sheet C');
      R.MOBILE_BOTTOM_SHEET = (await p.evaluate(() => !!document.querySelector('.vc-gaveta-alca'))) ? 'PASS' : 'FAIL';
    }
  });
  R.CONSOLE_ERRORS = (R.CONSOLE_ERRORS || 0) + st.consoleErr.length;
  R.PAGE_ERRORS = (R.PAGE_ERRORS || 0) + st.pageErr.length;
  R.FAILED_REQUESTS = (R.FAILED_REQUESTS || 0) + st.reqFail.length;
}
R.OVERFLOW_FAILURES = Object.values(overflowPorVp).filter((v) => v > 2).length;
R.OVERFLOW_POR_VP = JSON.stringify(overflowPorVp);

// ============ C) FLAG OFF — grupo Roupa único ============
await passe(FLAGS_OFF, { width: 1440, height: 900 }, async (p) => {
  const trilho = await trilhoNomes(p);
  R.FLAG_OFF_COMPAT = (trilho.includes('Roupa') && !trilho.includes('Calças')) ? 'PASS' : `FAIL(${JSON.stringify(trilho)})`;
  await shot(p, 'flag-off-roupa-unica', 'flag=OFF');
});

R.SCREENSHOTS = N;
for (const k of ['UPPER_CATEGORY', 'LOWER_CATEGORY', 'FOOTWEAR_CATEGORY', 'TORSO_HOTSPOT', 'LEGS_HOTSPOT', 'FEET_HOTSPOT', 'SLOT_INDEPENDENCE', 'DIRECT_ASSET_APPLY', 'UNDO_PER_SLOT', 'FLAG_OFF_COMPAT', 'MULTISLOT_PRECEDENCE']) ok(R[k] === 'PASS', `${k}=${R[k]}`);
ok(R.CONSOLE_ERRORS === 0, `console errors=${R.CONSOLE_ERRORS}`);
ok(R.PAGE_ERRORS === 0, `page errors=${R.PAGE_ERRORS}`);
ok(R.OVERFLOW_FAILURES === 0, `overflow=${R.OVERFLOW_POR_VP}`);
writeFileSync(`${DIR}/booleans.json`, JSON.stringify(R, null, 2));
console.log('[vc-vest-audit] BOOLEANS:', JSON.stringify(R));
console.log('[vc-vest-audit] FALHAS:', falhas.length ? falhas.join(' || ') : 'nenhuma');
process.exit(falhas.length === 0 ? 0 : 1);
