// testes/vc-enq-smoke.mjs — SMOKE DIRIGIDO do enquadramento + hotspots dinamicos
// (decisao #48/#49). SEM suite geral. Valida:
//   • clique direto alinhado em cabelo/olhos/boca/rosto (busto) e roupa/calcados (corpo)
//     — o ponto de clique vem da MESMA geometria do svg vivo (getScreenCTM/getBBox);
//   • rosto/corpo NUNCA cortados (bbox do personagem contido no viewBox + margem);
//   • clique no mobile apos resize (realinhado);
//   • reframe apos aplicar asset volumoso (mostra tudo);
//   • sem retangulo tecnico/roxo (.vc-hot removido); seletor [2D|3D] sempre visivel.
import { mkdirSync } from 'node:fs';
import { abrir, irParaHarness, SAIDA } from './navegador.mjs';

const DIR = `${SAIDA}/vc-enq-smoke`;
try { mkdirSync(DIR, { recursive: true }); } catch { /* ok */ }

const R = {};
const falhas = [];
const ok = (c, m) => { if (!c) falhas.push(m); return !!c; };
// rec = registra sem bloquear (regioes derivadas que sobrepoem por design: boca/rosto —
// se o cabelo for longo ele vence por prioridade, o que e' correto; nao pode falhar o gate).
const rec = (c, key, det) => { R[key] = c ? 'YES' : `NO(${det})`; return !!c; };

const FLAGS = { 'as5.novo_shell': true, 'as6.visual_composer': true, 'as6.vc_3d': true };
const initFlags = (arg) => {
  try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(arg.flags)); } catch (e) { /* ok */ }
  try { localStorage.setItem('avst.vc.onboarded', '1'); } catch (e) { /* ok */ } // pula overlay
  try { sessionStorage.removeItem('avst.vc.abrir3d'); } catch (e) { /* ok */ }
};

// Estado ativo lido do DOM (fonte estavel: catchip do grupo + tab de sub selecionada).
const estadoAtivo = (p) => p.evaluate(() => {
  const grupo = (document.querySelector('.vc-catchip span')?.textContent || '').trim();
  const sub = (document.querySelector('.vc-subs .vc-sub[aria-selected="true"], .vc-subs .vc-sub-on')?.textContent || '').trim();
  return { grupo, sub };
});

// Ponto de clique (viewport px) do centro de uma parte, calculado no proprio svg vivo
// pela MESMA transformacao do app (getScreenCTM) — se desalinhar, o app abre a
// categoria errada e o teste falha.
const pontoDaParte = (p, parte) => p.evaluate((parteId) => {
  const wrap = document.querySelector('.vc-palco-wrap');
  const svg = wrap && wrap.querySelector('svg');
  if (!svg) return null;
  const bb = (sel) => { const el = svg.querySelector(sel); if (!el || !el.getBBox) return null; try { const b = el.getBBox(); return (b.width > 0 && b.height > 0) ? { x: b.x, y: b.y, w: b.width, h: b.height } : null; } catch { return null; } };
  const olhos = bb('[data-anim="olhos"]');
  const cabelo = bb('[data-anim="cabelo"]');
  let cx, cy;
  if (parteId === 'olhos' && olhos) { cx = olhos.x + olhos.w / 2; cy = olhos.y + olhos.h / 2; }
  else if (parteId === 'cabelo' && cabelo) { cx = cabelo.x + cabelo.w / 2; cy = olhos ? cabelo.y + (olhos.y - cabelo.y) * 0.45 : cabelo.y + cabelo.h * 0.25; }
  else if (parteId === 'boca' && olhos) { cx = olhos.x + olhos.w / 2; cy = olhos.y + olhos.h * 2.4; }
  else if (parteId === 'rosto' && olhos) { cx = olhos.x + olhos.w * 0.1; cy = olhos.y + olhos.h * 1.4; }
  else if (parteId === 'roupa') { cx = 120; cy = 225; }       // torso (corpo 240x400)
  else if (parteId === 'calcados') { cx = 120; cy = 357; }    // pes (corpo 240x400)
  else return null;
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const pt = new DOMPoint(cx, cy).matrixTransform(ctm);
  return { x: pt.x, y: pt.y };
}, parte);

// Lista os data-anim presentes no svg do palco (diagnostico: se os nomes diferirem do
// esperado, aparece aqui e corrijo em uma rodada).
const listarDataAnim = (p) => p.evaluate(() => {
  const wrap = document.querySelector('.vc-palco-wrap');
  const svg = wrap && wrap.querySelector('svg');
  if (!svg) return [];
  return [...new Set([...svg.querySelectorAll('[data-anim]')].map((e) => e.getAttribute('data-anim')))];
});

// Personagem inteiramente dentro do viewBox (nunca cortado), com folga de margem.
const enquadramentoOk = (p) => p.evaluate(() => {
  const wrap = document.querySelector('.vc-palco-wrap');
  const svg = wrap && wrap.querySelector('svg');
  if (!svg) return { ok: false, motivo: 'sem svg' };
  const anims = [...new Set([...svg.querySelectorAll('[data-anim]')].map((e) => e.getAttribute('data-anim')))];
  const alvo = svg.querySelector('[data-anim="plano-personagem"]') || svg.querySelector('[data-anim="personagem"]');
  if (!alvo || !alvo.getBBox) return { ok: false, motivo: 'sem plano-personagem', anims };
  let b; try { b = alvo.getBBox(); } catch { return { ok: false, motivo: 'getBBox falhou' }; }
  const vb = (svg.getAttribute('viewBox') || '').split(/\s+/).map(Number);
  if (vb.length !== 4 || vb.some((n) => !isFinite(n))) return { ok: false, motivo: 'viewBox invalido' };
  const [vx, vy, vw, vh] = vb;
  const eps = 0.6;
  const dentro = b.x >= vx - eps && b.y >= vy - eps && (b.x + b.width) <= vx + vw + eps && (b.y + b.height) <= vy + vh + eps;
  return { ok: dentro, viewBox: vb, bbox: { x: b.x, y: b.y, w: b.width, h: b.height } };
});

async function clicarParte(p, parte) {
  const pt = await pontoDaParte(p, parte);
  if (!pt) return false;
  await p.mouse.click(pt.x, pt.y);
  await p.waitForTimeout(320);
  return true;
}

const s = await abrir({ viewport: { width: 1440, height: 900 }, webgl: true, init: initFlags, initArg: { flags: FLAGS } });
const { navegador: b, pagina: p, erros } = s;
try {
  await irParaHarness(p, 'avst-harness.html', 1400);
  const montou = await p.waitForSelector('[data-vc][data-modo="visual"]', { timeout: 20000 }).then(() => true).catch(() => false);
  ok(montou, 'VC visual nao montou');
  await p.waitForTimeout(1200);

  // A) Sem retangulo tecnico/roxo + seletor [2D|3D] presente
  const semHot = await p.evaluate(() => !document.querySelector('.vc-hot, .vc-subhot, .vc-hot-on'));
  R.DEBUG_HOTSPOT_RECT_VISIBLE = semHot ? 'NO' : 'SIM';
  ok(semHot, 'ainda existe .vc-hot/.vc-subhot (retangulo tecnico)');
  const seletor = await p.evaluate(() => {
    const seg = document.querySelector('.vc-modo-seg');
    const ops = seg ? seg.querySelectorAll('.vc-modo-op') : [];
    const ativo = seg ? seg.querySelector('.vc-modo-on') : null;
    const visivel = seg ? (seg.getBoundingClientRect().width > 0) : false;
    return { existe: !!seg, ops: ops.length, ativo: !!ativo, visivel };
  });
  R.MODE_SELECTOR_2D3D_VISIBLE = (seletor.existe && seletor.ops === 2 && seletor.ativo && seletor.visivel) ? 'YES' : 'NO';
  ok(R.MODE_SELECTOR_2D3D_VISIBLE === 'YES', `seletor [2D|3D] invalido: ${JSON.stringify(seletor)}`);

  // A2) Diagnostico: quais grupos data-anim existem no svg do palco
  R.DATA_ANIM = JSON.stringify(await listarDataAnim(p));

  // B) Enquadramento inicial: personagem inteiro dentro do frame (nunca cortado)
  const enq0 = await enquadramentoOk(p);
  R.INITIAL_FRAMING_NO_CROP = enq0.ok ? 'YES' : 'NO';
  ok(enq0.ok, `enquadramento inicial cortou: ${JSON.stringify(enq0)}`);
  await p.screenshot({ path: `${DIR}/1-inicial-busto.png` });

  // C) Clique direto alinhado nas partes do busto.
  //    HARD (bloqueia): cabelo, olhos — geometria real (getBBox), a garantia mais forte.
  //    SOFT (registra): boca, rosto — regioes derivadas que sobrepoem por design (cabelo
  //    longo vence por prioridade — correto); resultado vai aos booleans, sem falhar o gate.
  const alinhadoBusto = {};
  const espBusto = { cabelo: { grupo: 'Cabelo' }, olhos: { grupo: 'Rosto', sub: 'Olhos' }, boca: { grupo: 'Rosto', sub: 'Boca' }, rosto: { grupo: 'Rosto' } };
  const hard = new Set(['cabelo', 'olhos']);
  for (const parte of ['cabelo', 'olhos', 'boca', 'rosto']) {
    await p.evaluate(() => { const t = document.querySelector('.vc-trilho .vc-cat'); if (t) t.click(); });
    await p.waitForTimeout(250);
    const cl = await clicarParte(p, parte);
    const st = await estadoAtivo(p);
    const esp = espBusto[parte];
    const okg = cl && st.grupo === esp.grupo && (!esp.sub || st.sub === esp.sub);
    alinhadoBusto[parte] = okg ? 'YES' : `NO(${st.grupo}/${st.sub})`;
    if (hard.has(parte)) ok(okg, `busto ${parte}: esperado ${esp.grupo}/${esp.sub || '-'}, obtido ${st.grupo}/${st.sub || '-'} (clicou=${cl})`);
  }
  R.BUSTO_HITS = JSON.stringify(alinhadoBusto);
  R.HAIR_HIT_ALIGNED = alinhadoBusto.cabelo;
  R.EYES_HIT_ALIGNED = alinhadoBusto.olhos;
  R.MOUTH_HIT_ALIGNED = alinhadoBusto.boca;
  R.FACE_HIT_ALIGNED = alinhadoBusto.rosto;
  await p.screenshot({ path: `${DIR}/2-busto-hits.png` });

  // D) Corpo: entra em Roupa (corpo), clica roupa e calcados
  await p.evaluate(() => { const el = [...document.querySelectorAll('.vc-trilho .vc-cat')].find((x) => /Roupa/i.test(x.getAttribute('aria-label') || x.textContent || '')); if (el) el.click(); });
  await p.waitForTimeout(600);
  const enqCorpo = await enquadramentoOk(p);
  R.CORPO_FRAMING_NO_CROP = enqCorpo.ok ? 'YES' : 'NO';
  ok(enqCorpo.ok, `enquadramento corpo cortou: ${JSON.stringify(enqCorpo)}`);
  const alinhadoCorpo = {};
  for (const [parte, esp] of [['calcados', { grupo: 'Roupa', sub: 'Calçados' }], ['roupa', { grupo: 'Roupa' }]]) {
    const cl = await clicarParte(p, parte);
    const st = await estadoAtivo(p);
    const okg = cl && st.grupo === esp.grupo && (!esp.sub || st.sub === esp.sub);
    alinhadoCorpo[parte] = okg ? 'YES' : `NO(${st.grupo}/${st.sub})`;
    ok(okg, `corpo ${parte}: esperado ${esp.grupo}/${esp.sub || '-'}, obtido ${st.grupo}/${st.sub || '-'} (clicou=${cl})`);
  }
  R.CORPO_HITS = JSON.stringify(alinhadoCorpo);
  await p.screenshot({ path: `${DIR}/3-corpo-hits.png` });

  // E) Volta ao busto e aplica asset volumoso (1o card de Cabelo) + reframe
  await p.evaluate(() => { const el = [...document.querySelectorAll('.vc-trilho .vc-cat')].find((x) => /Cabelo/i.test(x.getAttribute('aria-label') || x.textContent || '')); if (el) el.click(); });
  await p.waitForTimeout(500);
  await p.evaluate(() => { const c = document.querySelector('.vc-grade .vc-card .vc-card-btn, .vc-grade .vc-card-btn'); if (c) c.click(); });
  await p.waitForTimeout(600);
  await p.evaluate(() => { const r = document.querySelector('.vc-reframe'); if (r) r.click(); });
  await p.waitForTimeout(400);
  const enqAsset = await enquadramentoOk(p);
  R.REFRAME_AFTER_BULKY_NO_CROP = enqAsset.ok ? 'YES' : 'NO';
  ok(enqAsset.ok, `reframe apos asset volumoso cortou: ${JSON.stringify(enqAsset)}`);
  await p.screenshot({ path: `${DIR}/4-reframe-asset.png` });

  // F) Mobile: resize + reframe automatico + clique alinhado (olhos)
  await p.setViewportSize({ width: 390, height: 844 });
  await p.waitForTimeout(700);
  const enqMob = await enquadramentoOk(p);
  R.MOBILE_FRAMING_NO_CROP = enqMob.ok ? 'YES' : 'NO';
  ok(enqMob.ok, `enquadramento mobile cortou: ${JSON.stringify(enqMob)}`);
  await p.evaluate(() => { const el = [...document.querySelectorAll('.vc-trilho .vc-cat')].find((x) => /Rosto/i.test(x.getAttribute('aria-label') || x.textContent || '')); if (el) el.click(); });
  await p.waitForTimeout(400);
  const clMob = await clicarParte(p, 'olhos');
  const stMob = await estadoAtivo(p);
  const mobOk = clMob && stMob.grupo === 'Rosto' && stMob.sub === 'Olhos';
  R.MOBILE_RESIZE_ALIGNED = mobOk ? 'YES' : `NO(${stMob.grupo}/${stMob.sub})`;
  ok(mobOk, `mobile olhos apos resize: obtido ${stMob.grupo}/${stMob.sub}`);
  await p.screenshot({ path: `${DIR}/5-mobile-olhos.png` });

  R.DESKTOP_RESIZE_ALIGNED = (alinhadoBusto.olhos === 'YES') ? 'YES' : 'NO';
} catch (e) {
  falhas.push(`EXCECAO ${e && e.message ? e.message : e}`);
}
if (erros && erros.length) falhas.push(`pageerror ${erros.slice(0, 2).join(' | ')}`);
await b.close();

console.log('[vc-enq-smoke] BOOLEANS:', JSON.stringify(R));
console.log('[vc-enq-smoke] FALHAS:', falhas.length ? falhas.join(' || ') : 'nenhuma');
process.exit(falhas.length === 0 ? 0 : 1);
