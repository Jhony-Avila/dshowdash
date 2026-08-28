// testes/mobile-extreme-data.mjs — TRACK C cert corretiva: dados extremos no
// celular. Injeta nomes longos, Unicode/emoji e conteúdo ausente na UI mobile e
// verifica truncamento/wrapping acessível, sem overflow horizontal, sem quebra
// de layout, seleção preservada. (A contagem 1/10/50/100/500 é exercida pela
// densidade do catálogo real; aqui foca robustez a strings extremas.)
import { abrir, irParaHarness } from './navegador.mjs';
const FLAGS = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true, 'as6.mobile_studio': true };
let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };

const { navegador, pagina, erros } = await abrir({ viewport: { width: 360, height: 640 }, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: FLAGS });
try {
  await irParaHarness(pagina, 'avst-harness.html', 1000);
  await pagina.evaluate(() => { const b = [...document.querySelectorAll('.avst5-sidebar .avst5-cat')].find((x) => (x.textContent || '').trim().startsWith('Roupa')); b?.click(); });
  await pagina.waitForTimeout(500);

  // injeta strings extremas nos nomes de cards e num título
  const antes = await pagina.evaluate(() => document.documentElement.scrollWidth);
  const r = await pagina.evaluate(() => {
    const LONGO = 'Traje'.repeat(40); // ~200 chars, sem espaços
    const EMOJI = '🎭👗✨ Camiseta Ultra Máxima Premium Édition 🚀🔥💎 ' + 'x'.repeat(60);
    const nomes = [...document.querySelectorAll('.avst-card-nome')];
    nomes.slice(0, 6).forEach((n, i) => { n.textContent = i % 2 ? LONGO : EMOJI; });
    // força reflow
    void document.body.offsetHeight;
    const overflowNoCard = nomes.slice(0, 6).some((n) => { const c = n.closest('.avst-card'); if (!c) return false; return c.scrollWidth > c.clientWidth + 2; });
    return {
      overflowPagina: document.documentElement.scrollWidth > window.innerWidth + 1,
      overflowNoCard,
      docScrollW: document.documentElement.scrollWidth, innerW: window.innerWidth,
    };
  });
  console.log('  extremos:', JSON.stringify(r));
  ok(!r.overflowPagina, `nomes longos/emoji NÃO causam overflow de página (${r.docScrollW} ≤ ${r.innerW})`);
  ok(!r.overflowNoCard, 'nome longo é truncado/quebrado dentro do card (sem estourar o card)');

  // conteúdo ausente: remove thumb de um card → layout não quebra
  const semThumb = await pagina.evaluate(() => {
    const card = document.querySelector('.avst-card'); const img = card?.querySelector('img, svg, .avst-card-thumb');
    if (img) img.remove();
    void document.body.offsetHeight;
    return { cardVivo: !!card && card.getBoundingClientRect().height > 0, overflow: document.documentElement.scrollWidth > window.innerWidth + 1 };
  });
  ok(semThumb.cardVivo && !semThumb.overflow, 'card sem thumbnail não quebra o layout');

  // seleção preservada após o estresse de strings
  const selOk = await pagina.evaluate(() => (document.querySelector('.avst5-cat-on .avst6-tax-nome')?.textContent || '').includes('Roupa'));
  ok(selOk, 'categoria selecionada preservada após dados extremos');
  ok(erros.length === 0, `sem erro JS (${erros.slice(0, 2).join(' | ')})`);
} finally { await navegador.close(); }
console.log(falhas ? `\n✗ mobile-extreme-data: ${falhas} falha(s)` : '\n✓ mobile-extreme-data verde');
process.exit(falhas ? 1 : 0);
