// testes/dock-classico.mjs — lote 831–840 (AS6 §103–§105, flag
// as6.dock_classico; briefing complementar 2026-08-08): Asset Dock v3.
//   A) flag ON (clássico AAA, aba de itens): wrapper dock-v3 presente;
//      wheel VERTICAL rola a grade HORIZONTALMENTE; seta direita
//      aparece com overflow e rola ao clicar; seta esquerda aparece
//      depois de rolar; thumb do card ocupa ≥72% da altura (visual >
//      texto); clique em card continua equipando (drag threshold);
//   B) rollback §651: flag OFF = sem wrapper/setas e wheel NÃO
//      intercepta — trilho anterior byte a byte.
// @version 1.0.0  @created 2026-08-08
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const prepararItens = async (p) => {
  await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Roupa')?.click(); });
  await p.waitForTimeout(700);
};

// ── A) flag ON ──────────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1440, height: 900 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': false, 'as5.classico_aaa': true })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await prepararItens(p);
    ok(await p.locator('.avst-trilho[data-dock-v3]').count() === 1, 'trilho sem o escopo dock-v3 com a flag ON');
    ok(await p.locator('[data-teste="dock-v3"]').count() === 1, 'wrapper DockAssets ausente');
    // ── PROVA GEOMÉTRICA (desktop 1440×900): a dock fica ABAIXO do
    // preview, em largura total, e NÃO existe lateral de assets ──
    const geo = await p.evaluate(() => {
      const caixa = (sel) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, bottom: r.bottom }; };
      return { palco: caixa('.avst-palco'), trilho: caixa('.avst-trilho'), lateral: caixa('.avst-lateral') };
    });
    ok(geo.lateral === null, 'a lateral direita de assets NÃO deveria existir no DOM (aba de itens)');
    ok(geo.trilho && geo.palco && geo.trilho.y >= geo.palco.bottom - 2,
      `a dock deveria estar ABAIXO do preview (palco.bottom=${geo.palco?.bottom} · trilho.y=${geo.trilho?.y})`);
    ok(geo.trilho && Math.abs(geo.trilho.w - geo.palco.w) < 4,
      `a dock deveria ter a MESMA largura do preview (${geo.palco?.w} × ${geo.trilho?.w})`);
    ok(geo.palco && geo.palco.h > geo.trilho.h,
      'o preview deveria dominar a área vertical (palco > dock)');
    // wheel vertical → horizontal
    const antes = await p.evaluate(() => document.querySelector('.avst-trilho .avst-grade').scrollLeft);
    await p.locator('.avst-trilho .avst-grade').evaluate((el) => {
      el.dispatchEvent(new WheelEvent('wheel', { deltaY: 240, bubbles: true, cancelable: true }));
    });
    await p.waitForTimeout(200);
    const depois = await p.evaluate(() => document.querySelector('.avst-trilho .avst-grade').scrollLeft);
    ok(depois > antes, `wheel vertical não rolou horizontal (${antes} → ${depois})`);
    // seta direita com overflow; rola ~80% ao clicar; esquerda aparece
    ok(await p.locator('[data-teste="dock-seta-dir"]').count() === 1, 'seta direita ausente com overflow');
    await p.locator('[data-teste="dock-seta-dir"]').click();
    await p.waitForTimeout(700);
    const aposSeta = await p.evaluate(() => document.querySelector('.avst-trilho .avst-grade').scrollLeft);
    ok(aposSeta > depois + 200, `seta direita não rolou (${depois} → ${aposSeta})`);
    ok(await p.locator('[data-teste="dock-seta-esq"]').count() === 1, 'seta esquerda deveria aparecer após rolar');
    // prioridade visual: thumb ≥72% da altura do card
    const prop = await p.evaluate(() => {
      const card = document.querySelector('.avst-trilho .avst-card:not(.avst-card-nenhum)');
      const thumb = card?.querySelector('.avst-card-thumb');
      return card && thumb ? thumb.getBoundingClientRect().height / card.getBoundingClientRect().height : 0;
    });
    ok(prop >= 0.72, `thumb deveria dominar o card (${(prop * 100).toFixed(0)}%)`);
    // clique ainda equipa (threshold de drag não pode matar o clique)
    await p.evaluate(() => { document.querySelector('.avst-trilho .avst-grade').scrollLeft = 0; });
    await p.waitForTimeout(200);
    const idAntes = await p.evaluate(() => [...document.querySelectorAll('.avst-trilho .avst-card-ativo')].length);
    await p.locator('.avst-trilho .avst-card:not(.avst-card-nenhum):not(.avst-card-ativo)').first().click();
    await p.waitForTimeout(500);
    const trocou = await p.evaluate(() => [...document.querySelectorAll('.avst-trilho .avst-card-ativo')].length);
    ok(trocou >= Math.max(1, idAntes), 'clique no card deixou de equipar (drag comeu o clique?)');
    await p.screenshot({ path: `${SAIDA}/dock-classico.png` });
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── B) rollback §651 ────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1440, height: 900 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': false, 'as5.classico_aaa': true, 'as6.dock_classico': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await prepararItens(p);
    ok(await p.locator('.avst-trilho').count() === 1, 'trilho AAA sumiu com a dock v3 OFF');
    ok(await p.locator('.avst-trilho[data-dock-v3]').count() === 0, 'flag OFF mas o escopo dock-v3 apareceu (§651)');
    ok(await p.locator('[data-teste^="dock-seta"]').count() === 0, 'flag OFF mas as setas apareceram (§651)');
    const antes = await p.evaluate(() => document.querySelector('.avst-trilho .avst-grade').scrollLeft);
    await p.locator('.avst-trilho .avst-grade').evaluate((el) => {
      el.dispatchEvent(new WheelEvent('wheel', { deltaY: 240, bubbles: true, cancelable: true }));
    });
    await p.waitForTimeout(200);
    const depois = await p.evaluate(() => document.querySelector('.avst-trilho .avst-grade').scrollLeft);
    ok(depois === antes, 'flag OFF mas o wheel foi interceptado (§651)');
    ok(erros.length === 0, `erros de página (OFF): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('FALHAS dock-classico:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('dock-classico OK');
