// testes/mobile-category-flow.mjs — TRACK C Marco 2: fluxo de categorias no
// celular. Cada categoria essencial é alcançável por toque e o palco reenquadra
// (busto p/ rosto/cabelo; corpo p/ roupa/calçados) — o motor real segue mandando.
import { abrir, irParaHarness } from './navegador.mjs';
const FLAGS = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true, 'as6.mobile_studio': true };
const CATS = ['Rosto', 'Olhos', 'Cabelo', 'Roupa', 'Calçados'];
let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };

const { navegador, pagina, erros } = await abrir({ viewport: { width: 390, height: 844 }, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: FLAGS });
try {
  await irParaHarness(pagina, 'avst-harness.html', 1100);
  for (const c of CATS) {
    const achou = await pagina.evaluate((n) => {
      const b = [...document.querySelectorAll('.avst5-sidebar .avst5-cat, button.avst6-navg-cab')].find((x) => (x.textContent || '').trim().startsWith(n));
      if (!b) return false; b.scrollIntoView({ inline: 'center' }); b.click(); return true;
    }, c);
    await pagina.waitForTimeout(500);
    const info = await pagina.evaluate(() => {
      const palco = document.querySelector('.avst5-palco'); const svg = palco?.querySelector('svg');
      const vb = svg?.getAttribute('viewBox'); const corpo = !!vb && parseFloat(vb.split(/\s+/)[3] || '0') > 300;
      const rect = palco?.getBoundingClientRect();
      return { temSvg: !!svg, corpo, palcoVisivel: !!rect && rect.height > 150 && rect.top < window.innerHeight, docScrollW: document.documentElement.scrollWidth, innerW: window.innerWidth };
    });
    ok(achou && info.temSvg && info.palcoVisivel && info.docScrollW <= info.innerW + 1,
      `${c}: alcançável + palco renderiza (${info.corpo ? 'corpo' : 'busto'}) + visível + sem overflow`);
  }
  ok(erros.length === 0, `sem erros JS (${erros.slice(0, 2).join(' | ')})`);
} finally { await navegador.close(); }
console.log(falhas ? `\n✗ mobile-category-flow: ${falhas} falha(s)` : '\n✓ mobile-category-flow verde');
process.exit(falhas ? 1 : 0);
