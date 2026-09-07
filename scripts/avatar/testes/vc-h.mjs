// testes/vc-h.mjs — VC-H (Briefing 1 §2/§3/§4/§7/§14/§18/§19): aceite headless do
// Visual Composer 2D. Liga as6.visual_composer (+ as5.novo_shell) e valida os
// binários do §18 sem menus: cliques diretos (cabelo/olhos/boca/rosto/roupa/pés),
// trilho curto (6), sem rótulos técnicos, sem overflow, sem erro de console.
// Flag OFF = este teste não se aplica (o caminho clássico é coberto pelos demais).
import { abrir, irParaHarness, relatorio } from './navegador.mjs';

const falhas = [];
const ok = (c, m) => { if (!c) falhas.push(m); };
const RESUMO = {};

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1440, height: 900 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.visual_composer': true }));
    try { localStorage.removeItem('avst.vc.onboarded'); } catch { /* ok */ } // força 1ª abertura
  },
});

// console.error de app (exclui falhas de rede/recurso, que não são erro de lógica)
const consoleErros = [];
p.on('console', (m) => {
  if (m.type() !== 'error') return;
  const t = m.text();
  if (/Failed to load resource|net::|ERR_|favicon|status of 40|status of 50/i.test(t)) return;
  consoleErros.push(t.slice(0, 180));
});

try {
  await irParaHarness(p, 'avst-harness.html', 1200);
  await p.waitForSelector('[data-vc][data-modo="visual"]', { timeout: 20000 });
  await p.waitForSelector('.vc-palco-wrap svg', { timeout: 20000 });

  const contexto = () => p.$eval('#vc-painel-cat', (el) => el.getAttribute('aria-label')).catch(() => null);
  const subOn = () => p.$$eval('.vc-subs .vc-sub-on', (els) => (els[0]?.textContent || '').trim()).catch(() => '');
  const nCards = () => p.$$eval('#vc-painel-cat .vc-grade .vc-card', (e) => e.length).catch(() => 0);

  // A. PALCO_DOMINANTE
  { const box = await (await p.$('.vc-palco-wrap'))?.boundingBox();
    ok(!!box && box.width > 200 && box.height > 200, `A PALCO_DOMINANTE box=${JSON.stringify(box)}`); }

  // B. VISIBLE_CATEGORY_COUNT = 6 + rótulos humanos
  { const labels = await p.$$eval('.vc-trilho .vc-cat', (els) => els.map((e) => e.textContent.trim()));
    RESUMO.VISIBLE_CATEGORY_COUNT = labels.length;
    ok(labels.length === 6, `B VISIBLE_CATEGORY_COUNT=${labels.length} (esperado 6) [${labels.join('|')}]`);
    ok(JSON.stringify(labels) === JSON.stringify(['Base', 'Cabelo', 'Rosto', 'Roupa', 'Acessórios', 'Mais']), `B rótulos=${labels.join('|')}`); }

  // §7 onboarding: dica presente na 1ª abertura, some ao descartar
  { const dica = await p.$('.vc-onboard'); ok(!!dica, 'ONB dica ausente na 1ª abertura');
    if (dica) { await p.click('.vc-onboard-x'); await p.waitForTimeout(150);
      ok(!(await p.$('.vc-onboard')), 'ONB dica não sumiu ao descartar'); } }

  // C. DIRECT_HAIR
  await p.click('[aria-label="Editar Cabelo"]'); await p.waitForTimeout(300);
  RESUMO.HAIR_CLICK = (await contexto()) === 'Catálogo: Cabelo';
  ok(RESUMO.HAIR_CLICK, `C DIRECT_HAIR contexto=${await contexto()}`);
  ok((await nCards()) > 0, 'C cabelo sem itens no catálogo');

  // D. DIRECT_EYES (sub-hotspot direto, sem entrar em Rosto antes)
  await p.click('[aria-label="Editar Olhos"]'); await p.waitForTimeout(300);
  RESUMO.EYES_CLICK = (await contexto()) === 'Catálogo: Rosto' && (await subOn()) === 'Olhos';
  ok(RESUMO.EYES_CLICK, `D DIRECT_EYES contexto=${await contexto()} sub=${await subOn()}`);

  // E. DIRECT_MOUTH
  await p.click('[aria-label="Editar Boca"]'); await p.waitForTimeout(300);
  RESUMO.MOUTH_CLICK = (await subOn()) === 'Boca';
  ok(RESUMO.MOUTH_CLICK, `E DIRECT_MOUTH sub=${await subOn()}`);

  // F. DIRECT_FACE (canto do hotspot de rosto p/ não cair numa sub central)
  await p.locator('[aria-label="Editar Rosto"]').click({ position: { x: 3, y: 3 } }); await p.waitForTimeout(300);
  RESUMO.FACE_CLICK = (await contexto()) === 'Catálogo: Rosto';
  ok(RESUMO.FACE_CLICK, `F DIRECT_FACE contexto=${await contexto()}`);

  // G. DIRECT_CLOTHING (entra em modo corpo)
  await p.click('[aria-label="Editar Roupa"]'); await p.waitForTimeout(400);
  RESUMO.CLOTHING_CLICK = (await contexto()) === 'Catálogo: Roupa';
  ok(RESUMO.CLOTHING_CLICK, `G DIRECT_CLOTHING contexto=${await contexto()}`);
  await p.waitForSelector('[aria-label="Editar Calçados"]', { timeout: 6000 }).catch(() => {});
  ok(!!(await p.$('[aria-label="Editar Calçados"]')), 'G hotspot Calçados ausente no modo corpo');

  // H. DIRECT_FOOTWEAR (clique direto nos pés → calçados)
  await p.click('[aria-label="Editar Calçados"]'); await p.waitForTimeout(400);
  const nPes = await p.$$eval('#vc-painel-cat .vc-grade [data-slot="pes"]', (e) => e.length).catch(() => 0);
  RESUMO.FOOTWEAR_CLICK = (await subOn()) === 'Calçados' && nPes > 0;
  ok(RESUMO.FOOTWEAR_CLICK, `H DIRECT_FOOTWEAR sub=${await subOn()} cards_pes=${nPes}`);

  // §19 undo: aplicar 1 item habilita Desfazer; desfazer volta
  { const btn = await p.$('#vc-painel-cat .vc-grade .vc-card-btn');
    if (btn) { await btn.click(); await p.waitForTimeout(250);
      const undoOn = !(await p.$eval('[aria-label="Desfazer"]', (el) => el.disabled));
      ok(undoOn, '§19 Desfazer não habilitou após aplicar');
      if (undoOn) { await p.click('[aria-label="Desfazer"]'); await p.waitForTimeout(200); } } }

  // N. TOP_ACTIONS <= 6 (desktop)
  { const n = await p.$$eval('.vc-barra button', (e) => e.length);
    RESUMO.VISIBLE_PRIMARY_ACTIONS = n; ok(n <= 6, `N TOP_ACTIONS_DESKTOP=${n} (>6)`); }

  // J. OVERFLOW_FAILURES = 0 (sem scroll horizontal na raiz)
  { const ov = await p.evaluate(() => { const r = document.querySelector('.vc-root'); return r && r.scrollWidth > r.clientWidth + 1 ? `${r.scrollWidth}>${r.clientWidth}` : ''; });
    ok(ov === '', `J OVERFLOW_DESKTOP ${ov}`); }

  // K. A11Y: toda região com nome acessível + live region
  { const semLabel = await p.$$eval('.vc-hot', (els) => els.filter((e) => !e.getAttribute('aria-label')).length);
    ok(semLabel === 0, `K ${semLabel} hotspots sem aria-label`);
    ok(!!(await p.$('.vc-sr-live')), 'K live region ausente'); }

  // L. TECHNICAL_LABELS_VISIBLE = NO (trilho + subs)
  { const txt = await p.evaluate(() => (document.querySelector('.vc-trilho')?.textContent || '') + ' || ' + (document.querySelector('.vc-subs')?.textContent || ''));
    ok(!/acessorio_|slot:|\bundefined\b|\bnull\b|_e\b|_d\b/i.test(txt), `L termos técnicos visíveis: ${txt.slice(0, 90)}`); }

  // M. mobile 390×844: TOP_ACTIONS<=5 + sem overflow
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(400);
  { const nM = await p.$$eval('.vc-barra button', (e) => e.length);
    ok(nM <= 5, `M TOP_ACTIONS_MOBILE=${nM} (>5)`);
    const ovM = await p.evaluate(() => { const r = document.querySelector('.vc-root'); return r && r.scrollWidth > r.clientWidth + 1 ? `${r.scrollWidth}>${r.clientWidth}` : ''; });
    ok(ovM === '', `M OVERFLOW_MOBILE ${ovM}`); }

  // I. CONSOLE_ERRORS = 0 (app) e PAGEERRORS = 0
  ok(consoleErros.length === 0, `I CONSOLE_ERRORS=${consoleErros.length}: ${consoleErros.slice(0, 3).join(' | ')}`);
  ok(erros.length === 0, `I PAGEERRORS=${erros.length}: ${erros.slice(0, 3).join(' | ')}`);
} catch (e) {
  falhas.push(`EXCEÇÃO no probe: ${e.message}`);
}

console.log('[vc-h] DIRECT_MANIPULATION_MAP:', JSON.stringify({
  HAIR: !!RESUMO.HAIR_CLICK, EYES: !!RESUMO.EYES_CLICK, MOUTH: !!RESUMO.MOUTH_CLICK,
  FACE: !!RESUMO.FACE_CLICK, CLOTHING: !!RESUMO.CLOTHING_CLICK, FOOTWEAR: !!RESUMO.FOOTWEAR_CLICK,
}));
console.log('[vc-h] VISIBLE_CATEGORY_COUNT:', RESUMO.VISIBLE_CATEGORY_COUNT, '· VISIBLE_PRIMARY_ACTIONS:', RESUMO.VISIBLE_PRIMARY_ACTIONS);
const okAll = relatorio('vc-h', falhas, [...erros, ...consoleErros]);
await b.close();
process.exit(okAll ? 0 : 1);
