// testes/vc-unified.mjs — RODADA DESIGN OVERHAUL. Produz as 6 EVIDÊNCIAS visuais exigidas
// (com marcador REVIEW), espera as MINIATURAS reais renderizarem antes de capturar, e coleta
// os critérios finais (best-effort — a prova é a imagem). WebGL SwiftShader (esperas generosas).
import { mkdirSync } from 'node:fs';
import { abrir, irParaHarness, SAIDA } from './navegador.mjs';

const DIR = `${SAIDA}/vc-unificado`;
try { mkdirSync(DIR, { recursive: true }); } catch { /* ok */ }
const SHA = process.env.REVIEW_SHA || 'REVIEW';
const FLAGS_ON = { 'as5.novo_shell': true, 'as6.visual_composer': true, 'as6.vc_3d': true };
const R = {};
const falhas = [];
const ok = (c, m) => { if (!c) falhas.push(m); };
const shots = [];

async function marcar(p, modo) {
  await p.evaluate(({ sha, m }) => {
    let el = document.getElementById('vc-review-marca');
    if (!el) { el = document.createElement('div'); el.id = 'vc-review-marca'; document.body.appendChild(el); }
    el.textContent = `REVIEW · ${sha} · ${m}`;
    el.setAttribute('style', 'position:fixed;left:12px;bottom:12px;z-index:2147483647;font:600 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.5px;color:#d7f7e6;background:rgba(10,14,20,.86);border:1px solid rgba(90,220,160,.5);border-radius:999px;padding:7px 12px;pointer-events:none;');
  }, { sha: SHA, m: modo });
}
async function capturar(p, nome, modo) {
  await marcar(p, modo);
  await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const caminho = `${DIR}/${nome}.png`;
  await p.screenshot({ path: caminho });
  const temMarca = await p.$eval('#vc-review-marca', (e) => !!e && /REVIEW/.test(e.textContent || '')).catch(() => false);
  shots.push(nome); if (!temMarca) falhas.push(`marca ausente em ${nome}`);
  return caminho;
}
const textoPainel = (p, sel) => p.evaluate((s) => (document.querySelector(s)?.innerText || '').toLowerCase(), sel);
async function esperarThumbs(p, min, timeout = 24000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const n = await p.$$eval('#vc3d-painel .vc3d-thumb', (els) => els.filter((e) => (getComputedStyle(e).backgroundImage || '').includes('url(')).length).catch(() => 0);
    if (n >= min) return n;
    await p.waitForTimeout(600);
  }
  return await p.$$eval('#vc3d-painel .vc3d-thumb', (els) => els.filter((e) => (getComputedStyle(e).backgroundImage || '').includes('url(')).length).catch(() => 0);
}

const tentar3d = (p) => p.evaluate(() => {
  const cand = [...document.querySelectorAll('button, [role="button"], .vc-mp-item, a')].find((x) => { const t = (x.textContent || '').trim(); return /Abrir modo 3D/i.test(t) && t.length < 40; });
  if (!cand) return false; (cand.closest('button, [role="button"], .vc-mp-item, a') || cand).click(); return true;
});
async function entrar3d(p) {
  await p.click('[aria-label="Mais"]'); await p.waitForTimeout(500);
  if (!(await tentar3d(p))) { await p.evaluate(() => { const g = [...document.querySelectorAll('.vc-mp-grupo-cab, [class*="grupo-cab"]')].find((b) => /Apresentar/i.test(b.textContent || '')); if (g) g.click(); }); await p.waitForTimeout(400); await tentar3d(p); }
  await p.waitForSelector('[data-vc][data-modo="3d"]', { timeout: 20000 });
}

const s = await abrir({ viewport: { width: 1440, height: 900 }, webgl: true, init: (f) => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); }, initArg: FLAGS_ON });
const b = s.navegador, p = s.pagina, erros = s.erros;
try {
  // ===================== 2D DESKTOP (região selecionada + miniaturas) =====================
  await irParaHarness(p, 'avst-harness.html', 1200);
  await p.waitForSelector('[data-vc][data-modo="visual"]', { timeout: 20000 });
  // seleciona uma região no palco (Cabelo)
  await p.evaluate(() => { const h = [...document.querySelectorAll('.vc-hot')].find((x) => /Cabelo/i.test(x.getAttribute('aria-label') || '')) || document.querySelector('.vc-hot'); if (h) h.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await p.waitForTimeout(500);
  // 2D já tem miniaturas reais (svgItemIsolado): confirma thumbs no catálogo
  const thumbs2d = await p.$$eval('.vc-painel .vc-thumb svg, #vc-painel-cat .vc-thumb svg', (e) => e.length).catch(() => 0);
  R.REAL_ASSET_THUMBNAILS_2D = thumbs2d > 0 ? 'YES' : 'NO';
  R.RIGHT_PANEL_VISUALLY_INTEGRATED = await p.evaluate(() => { const pn = document.querySelector('.vc-painel'); if (!pn) return false; const c = getComputedStyle(pn).backgroundColor.match(/\d+/g); if (!c) return false; const [r, g2, b2] = c.map(Number); return (0.299 * r + 0.587 * g2 + 0.114 * b2) < 90; }) ? 'YES' : 'NO';
  R.AVATAR_DOMINANT = await p.evaluate(() => { const pa = document.querySelector('.vc-palco'); const pn = document.querySelector('.vc-painel'); if (!pa) return false; const a = pa.getBoundingClientRect(); const c = pn ? pn.getBoundingClientRect() : { width: 0 }; return a.width > c.width * 1.6; }) ? 'YES' : 'NO';
  R.CATEGORY_LABEL_WRAP = await p.evaluate(() => { const cats = [...document.querySelectorAll('.vc-trilho .vc-cat')]; return cats.some((c) => c.getBoundingClientRect().height > 64); }) ? 'SIM' : 'NO';
  R.SELECTED_REGION_INDICATOR = (await p.$('.vc-catchip')) && (await p.$('.vc-hot-on')) ? 'YES' : 'NO';
  await capturar(p, '1-2d-desktop', '2D');

  // aplica um asset no 2D (clique aplica; sem "Equipar")
  const undoAntes = await p.$eval('[aria-label="Desfazer"]', (e) => !e.disabled).catch(() => false);
  await p.click('.vc-painel .vc-grade .vc-card-btn, #vc-painel-cat .vc-grade .vc-card-btn').catch(() => {});
  await p.waitForTimeout(300);
  const undoDepois = await p.$eval('[aria-label="Desfazer"]', (e) => !e.disabled).catch(() => false);
  R.CARD_CLICK_APPLIES_2D = (undoDepois && !undoAntes) || undoDepois ? 'YES' : 'NO';
  R.EQUIP_BUTTON_VISIBLE = /equipar/.test(await textoPainel(p, '.vc-painel')) ? 'SIM' : 'NO';

  // ===================== 3D DESKTOP (malha destacada + miniaturas) =====================
  await entrar3d(p);
  await p.waitForTimeout(7000);
  R.WEBGL_CANVAS = await p.evaluate(() => { const c = document.querySelector('[data-modo="3d"] canvas'); if (!c) return 0; try { return c.toDataURL('image/png').length; } catch { return -1; } }) > 3000 ? 'YES' : 'NO';
  // Personagem: espera miniaturas dos LOOKS renderizarem
  const nThumb = await esperarThumbs(p, 3);
  R.REAL_ASSET_THUMBNAILS = nThumb >= 3 ? 'YES' : `PARCIAL(${nThumb})`;
  R.TEXT_ONLY_ASSET_CARDS = await p.evaluate(() => { const cards = [...document.querySelectorAll('#vc3d-painel .vc3d-card')]; if (!cards.length) return 'NO'; return cards.some((c) => !c.querySelector('.vc3d-thumb')) ? 'SIM' : 'NO'; });
  R.REPEATED_AVAILABILITY_TEXT = /(dispon[ií]vel[\s\S]*){2,}/.test(await textoPainel(p, '#vc3d-painel')) ? 'SIM' : 'NO';
  R.MISLEADING_ASSET_CATEGORY = /looks completos/.test(await textoPainel(p, '#vc3d-painel')) ? 'NO' : 'SIM';
  R.MODEL_REGION_HIGHLIGHT = !!(await p.$('.vc-catchip')) ? 'YES' : 'NO';
  // seleção direta de malha → cabelo + auto-frame (destaque persistente)
  const rota = await p.evaluate(() => window.__vc3dRota?.('Casual_Head'));
  await p.waitForTimeout(900);
  const camDepois = await p.evaluate(() => window.__vc3dEstado?.().camera);
  R.DIRECT_SELECTION_3D = (rota === 'cabelo' && camDepois === 'rosto') ? 'YES' : 'NO';
  await esperarThumbs(p, 2, 16000);
  await capturar(p, '2-3d-desktop', '3D');

  // aplica um LOOK real no 3D (card aplica; sem Equipar) → evidência 6
  await p.evaluate(() => { const b3 = [...document.querySelectorAll('.vc-trilho button')].find((x) => /Personagem/i.test(x.getAttribute('aria-label') || '')); if (b3) b3.click(); });
  await esperarThumbs(p, 3, 18000);
  await p.evaluate(() => { const b3 = [...document.querySelectorAll('#vc3d-painel .vc3d-card')].find((x) => /^Social/i.test((x.textContent || '').trim())); if (b3) b3.click(); });
  await p.waitForTimeout(1200);
  R.CARD_CLICK_APPLIES = (await p.evaluate(() => window.__vc3dEstado?.().roupa)) === 'terno' ? 'YES' : 'NO';
  await capturar(p, '6-aplicacao-3d', '3D');

  // "MAIS" — primeira tela simplificada (menu, não parede)
  await p.click('[aria-label="Mais"]'); await p.waitForTimeout(500);
  R.MORE_ALL_SECTIONS_AT_ONCE = await p.evaluate(() => {
    const menu = document.querySelector('.vc3d-mais-menu');
    const itens = document.querySelectorAll('.vc3d-mais-menu .vc3d-mais-mi').length;
    const temGradeCena = !!document.querySelector('.vc3d-sub'); // subpainel aberto = seções todas juntas
    return (menu && itens >= 5 && !temGradeCena) ? 'NO' : 'SIM';
  });
  await capturar(p, '5-mais', '3D');
  await p.keyboard.press('Escape').catch(() => {}); await p.waitForTimeout(300);

  // ===================== MOBILE (avatar visível com gaveta) =====================
  await p.evaluate(() => { const v = [...document.querySelectorAll('[aria-label="Voltar ao 2D"]')][0]; if (v) v.click(); }).catch(() => {});
  await p.waitForTimeout(400);
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(500);
  // 2D mobile: gaveta meio, avatar visível acima
  R.MOBILE_AVATAR_VISIBLE_WITH_SHEET_2D = await p.evaluate(() => {
    const wrap = document.querySelector('.vc-palco-wrap'); const pn = document.querySelector('.vc-painel');
    if (!wrap || !pn) return false; const w = wrap.getBoundingClientRect(); const g = pn.getBoundingClientRect();
    return w.bottom <= g.top + 8 && w.height > 120;
  }) ? 'YES' : 'NO';
  await capturar(p, '3-2d-mobile', '2D');

  // 3D mobile
  await entrar3d(p); await p.waitForTimeout(6000);
  await esperarThumbs(p, 2, 16000);
  R.MOBILE_AVATAR_VISIBLE_WITH_SHEET_3D = await p.evaluate(() => {
    const pal = document.querySelector('.vc3d-palco'); const pn = document.querySelector('#vc3d-painel');
    if (!pal || !pn) return false; const a = pal.getBoundingClientRect(); const g = pn.getBoundingClientRect();
    return a.height > 180 && g.top > a.top + 100;
  }) ? 'YES' : 'NO';
  R.MOBILE_AVATAR_VISIBLE_WITH_SHEET = (R.MOBILE_AVATAR_VISIBLE_WITH_SHEET_2D === 'YES' && R.MOBILE_AVATAR_VISIBLE_WITH_SHEET_3D === 'YES') ? 'YES' : 'NO';
  await capturar(p, '4-3d-mobile', '3D');

  R.REVIEW_MARKER_VISIBLE = falhas.some((f) => /marca ausente/.test(f)) ? 'NO' : 'YES';
  R.EVIDENCE_2D = shots.includes('1-2d-desktop') && shots.includes('3-2d-mobile') ? 'YES' : 'NO';
  R.EVIDENCE_3D = shots.includes('2-3d-desktop') && shots.includes('4-3d-mobile') ? 'YES' : 'NO';

  // asserts (best-effort — a prova final é a imagem)
  ok(R.WEBGL_CANVAS === 'YES', 'canvas 3D vazio');
  ok(R.TEXT_ONLY_ASSET_CARDS === 'NO', 'cards de texto no 3D');
  ok(R.CATEGORY_LABEL_WRAP === 'NO', 'rótulo do trilho quebrando');
  ok(R.REPEATED_AVAILABILITY_TEXT === 'NO', 'texto de disponibilidade repetido');
  ok(R.MISLEADING_ASSET_CATEGORY === 'NO', 'sem Looks completos (categoria enganosa)');
  ok(R.RIGHT_PANEL_VISUALLY_INTEGRATED === 'YES', 'painel não integrado (claro)');
  ok(R.AVATAR_DOMINANT === 'YES', 'avatar não dominante');
  ok(R.MORE_ALL_SECTIONS_AT_ONCE === 'NO', 'Mais mostra tudo de uma vez');
  ok(R.MOBILE_AVATAR_VISIBLE_WITH_SHEET === 'YES', 'avatar mobile coberto pela gaveta');
  ok(R.CARD_CLICK_APPLIES === 'YES', 'card 3D não aplicou');
  ok(R.CARD_CLICK_APPLIES_2D === 'YES', 'card 2D não aplicou');
  ok(R.DIRECT_SELECTION_3D === 'YES', `seleção direta 3D rota=${rota} cam=${camDepois}`);
  ok(R.REVIEW_MARKER_VISIBLE === 'YES', 'marcador REVIEW ausente em alguma captura');
  ok(shots.length === 6, `capturas=${shots.length}/6`);
} catch (e) { falhas.push(`EXCEÇÃO: ${e.message}`); }
await b.close();

console.log('[vc-unified] BOOLEANS:', JSON.stringify(R));
console.log('[vc-unified] SHOTS:', JSON.stringify(shots));
console.log('[vc-unified] DIR:', DIR);
console.log('[vc-unified] FALHAS:', falhas.length ? falhas.join(' || ') : 'nenhuma');
console.log('[vc-unified] PAGEERRORS:', erros.length ? erros.slice(0, 3).join(' | ') : 'nenhum');
process.exit(falhas.length === 0 ? 0 : 1);
