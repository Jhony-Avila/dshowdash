// testes/mobile-viewport-matrix.mjs — TRACK C cert: matriz completa de
// viewports + varredura progressiva 300→1600. Em cada tamanho: sem overflow
// horizontal, palco útil visível, sem erro JS; e a composição correta
// (mobile em estreito/baixo ≤768w ou ≤520h; desktop no resto). A varredura
// procura pontos de quebra intermediários (overflow) que a matriz fixa não pega.
import { abrir, irParaHarness } from './navegador.mjs';
const FLAGS = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true, 'as6.mobile_studio': true };
let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };

const MATRIZ = [
  [320, 568], [360, 640], [375, 667], [390, 844], [393, 873], [412, 915], [430, 932],
  [667, 375], [844, 390], [768, 1024], [1024, 768], [1280, 720], [1440, 900], [1600, 1000],
];
const esperaMobile = (w, h) => w <= 768 || h <= 520;

const { navegador, pagina, erros } = await abrir({ viewport: { width: 390, height: 844 }, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: FLAGS });
try {
  await irParaHarness(pagina, 'avst-harness.html', 1000);

  let matrizOk = 0;
  for (const [w, h] of MATRIZ) {
    await pagina.setViewportSize({ width: w, height: h });
    await pagina.waitForTimeout(180);
    const r = await pagina.evaluate(() => {
      const dentro = (el) => { if (!el) return false; const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0 && b.left >= -1 && b.right <= window.innerWidth + 1 && b.top < window.innerHeight; };
      const palco = document.querySelector('.avst5-palco'); const rp = palco?.getBoundingClientRect();
      // "fora da tela" só conta o que DEVERIA estar visível: elementos que NÃO
      // estão dentro de um contêiner de scroll horizontal e NÃO estão hidden.
      const emScrollX = (el) => { let p = el.parentElement; while (p && !p.classList?.contains('avst5-shell')) { const cs = getComputedStyle(p); if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') return true; p = p.parentElement; } return false; };
      let foraIndevido = 0;
      for (const el of document.querySelectorAll('.avst5-shell[data-mobile] .avst5-cat, .avst5-shell[data-mobile] .avst5-salvar .avst-botao')) {
        const b = el.getBoundingClientRect();
        if (b.width > 0 && !el.hasAttribute('hidden') && !emScrollX(el) && (b.right < -1 || b.left > window.innerWidth + 1)) foraIndevido++;
      }
      return {
        mobile: document.querySelector('.avst5-shell[data-mobile]') !== null,
        overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        palcoVis: !!rp && rp.height > 100 && rp.top < window.innerHeight && rp.width <= window.innerWidth + 1,
        primeiraCatVisivel: dentro(document.querySelector('.avst5-cat')),
        foraIndevido,
      };
    });
    const compOk = r.mobile === esperaMobile(w, h);
    const bom = !r.overflow && r.palcoVis && compOk && r.foraIndevido === 0;
    if (bom) matrizOk++; else console.log(`    ${w}x${h}:`, JSON.stringify(r), `esperaMobile=${esperaMobile(w, h)}`);
    ok(bom, `${w}x${h}: ${esperaMobile(w, h) ? 'mobile' : 'desktop'} · sem overflow · palco na tela · nada essencial fora`);
  }
  console.log(`  matriz: ${matrizOk}/${MATRIZ.length}`);

  // varredura progressiva de largura (altura fixa 800): procura overflow em QUALQUER largura
  const quebras = [];
  for (let w = 300; w <= 1600; w += 20) {
    await pagina.setViewportSize({ width: w, height: 800 });
    await pagina.waitForTimeout(45);
    const over = await pagina.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (over) quebras.push(w);
  }
  console.log(`  varredura 300→1600 (passo 20): ${quebras.length ? 'overflow em ' + quebras.join(',') : 'sem overflow em nenhuma largura'}`);
  ok(quebras.length === 0, `varredura progressiva sem pontos de quebra (${quebras.length} larguras com overflow)`);

  ok(erros.length === 0, `sem erros JS na matriz toda (${erros.slice(0, 2).join(' | ')})`);
} finally { await navegador.close(); }
console.log(falhas ? `\n✗ mobile-viewport-matrix: ${falhas} falha(s)` : '\n✓ mobile-viewport-matrix verde');
process.exit(falhas ? 1 : 0);
