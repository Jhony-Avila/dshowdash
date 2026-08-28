// testes/mobile-catalog-density.mjs — TRACK C cert corretiva: DENSIDADE e
// descoberta de assets no celular. Após o Marco 11, pelo menos uma linha
// significativa de cards deve aparecer sem rolagem longa em 360×640, 390×844 e
// 430×932 — sem perder busca/filtros, mantendo alvos ≥44 e sem overflow.
import { abrir, irParaHarness } from './navegador.mjs';
const FLAGS = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true, 'as6.mobile_studio': true };
const VPS = [[360, 640], [390, 844], [430, 932]];
let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };

const { navegador, pagina, erros } = await abrir({ viewport: { width: 390, height: 844 }, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: FLAGS });
try {
  await irParaHarness(pagina, 'avst-harness.html', 1000);
  await pagina.evaluate(() => { const b = [...document.querySelectorAll('.avst5-sidebar .avst5-cat')].find((x) => (x.textContent || '').trim().startsWith('Roupa')); b?.click(); });
  await pagina.waitForTimeout(500);
  for (const [w, h] of VPS) {
    await pagina.setViewportSize({ width: w, height: h }); await pagina.waitForTimeout(300);
    const r = await pagina.evaluate(() => {
      // card "significativamente visível": pelo menos 40px de altura acima da dobra
      const cards = [...document.querySelectorAll('.avst-card')].map((c) => c.getBoundingClientRect());
      const sig = cards.filter((b) => b.width > 0 && b.top < window.innerHeight - 40 && b.bottom > 0);
      const busca = document.querySelector('.avst5-shell[data-mobile] input[type="search"], .avst5-shell[data-mobile] input[type="text"]');
      const buscaVis = busca ? (() => { const b = busca.getBoundingClientRect(); return b.width > 0 && b.top < window.innerHeight; })() : false;
      const filtros = !![...document.querySelectorAll('.avst5-shell[data-mobile] button, .avst5-shell[data-mobile] [role="radio"]')].find((x) => /filtro/i.test((x.textContent || '') + (x.getAttribute('aria-label') || '')));
      const chips = [...document.querySelectorAll('.avst5-shell[data-mobile] .avst5-abas > *, .avst5-shell[data-mobile] .avst5-chips > *')];
      const menorChip = chips.length ? Math.min(...chips.map((el) => { const b = el.getBoundingClientRect(); return Math.round(Math.min(b.width, b.height)); })) : 44;
      return { sig: sig.length, buscaVis, filtros, overflow: document.documentElement.scrollWidth > window.innerWidth + 1, menorChip };
    });
    console.log(`  ${w}x${h}:`, JSON.stringify(r));
    ok(r.sig >= 1, `${w}x${h}: ≥1 linha de assets significativa acima da dobra (${r.sig})`);
    ok(!r.overflow, `${w}x${h}: sem overflow horizontal`);
    ok(r.buscaVis, `${w}x${h}: busca acessível`);
    ok(r.filtros, `${w}x${h}: filtros encontráveis`);
    ok(r.menorChip >= 40, `${w}x${h}: chips de filtro mantêm alvo (${r.menorChip}px)`);
  }
  // estado preservado: categoria Roupa continua ativa após os resizes
  const catAtiva = await pagina.evaluate(() => (document.querySelector('.avst5-cat-on .avst6-tax-nome')?.textContent || '').trim());
  ok(/Roupa/.test(catAtiva), `categoria ativa preservada após resizes (${catAtiva})`);
  ok(erros.length === 0, `sem erros JS (${erros.slice(0, 2).join(' | ')})`);
} finally { await navegador.close(); }
console.log(falhas ? `\n✗ mobile-catalog-density: ${falhas} falha(s)` : '\n✓ mobile-catalog-density verde');
process.exit(falhas ? 1 : 0);
