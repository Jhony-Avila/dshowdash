// TRACK C Marco 5: paisagem de celular (844×390) usável.
import { abrir, irParaHarness } from './navegador.mjs';
const FLAGS = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true, 'as6.mobile_studio': true };
let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };
const { navegador, pagina, erros } = await abrir({ viewport: { width: 844, height: 390 }, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: FLAGS });
try {
  await irParaHarness(pagina, 'avst-harness.html', 1100);
  const m = await pagina.evaluate(() => {
    const shell = document.querySelector('.avst5-shell'); const vp = document.querySelector('.avst5-viewport');
    const r = vp?.getBoundingClientRect();
    return { dataMobile: shell?.getAttribute('data-mobile'), palcoH: r ? Math.round(r.height) : 0, palcoVisivel: !!r && r.height > 120 && r.top < window.innerHeight, docScrollW: document.documentElement.scrollWidth, innerW: window.innerWidth, nCats: document.querySelectorAll('.avst5-sidebar .avst5-cat').length };
  });
  console.log('  landscape:', JSON.stringify(m));
  ok(m.dataMobile === '1', 'composição mobile ativa (altura ≤520)');
  ok(m.palcoVisivel, `palco visível (h ${m.palcoH})`);
  ok(m.docScrollW <= m.innerW + 1, 'sem overflow horizontal');
  ok(m.nCats >= 3, `categorias acessíveis (${m.nCats})`);
  ok(erros.length === 0, 'sem erros JS');
} finally { await navegador.close(); }
console.log(falhas ? `\n✗ mobile-landscape: ${falhas} falha(s)` : '\n✓ mobile-landscape verde');
process.exit(falhas ? 1 : 0);
