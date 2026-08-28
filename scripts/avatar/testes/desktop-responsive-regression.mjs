// testes/desktop-responsive-regression.mjs — TRACK C cert: GUARDA do desktop.
// Com a flag as6.mobile_studio LIGADA, em larguras de desktop a composição
// mobile NÃO pode aplicar (data-mobile ausente) — o grid aprovado de 5 colunas
// permanece byte a byte. Prova que o mobile é escopado por viewport, não vaza
// para o desktop mesmo com a flag ON. Cobre 1280/1440/1600.
import { abrir, irParaHarness } from './navegador.mjs';
const FLAGS = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true, 'as6.mobile_studio': true };
const VPS = [{ width: 1280, height: 720 }, { width: 1440, height: 900 }, { width: 1600, height: 1000 }];
let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };

for (const vp of VPS) {
  const { navegador, pagina, erros } = await abrir({ viewport: vp, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: FLAGS });
  try {
    await irParaHarness(pagina, 'avst-harness.html', 900);
    const m = await pagina.evaluate(() => {
      const corpo = document.querySelector('.avst5-corpo');
      const cs = corpo ? getComputedStyle(corpo) : null;
      const sidebar = document.querySelector('.avst5-sidebar');
      const csSb = sidebar ? getComputedStyle(sidebar) : null;
      return {
        mobile: document.querySelector('.avst5-shell[data-mobile]') !== null,
        display: cs?.display || '',
        gridCols: cs?.gridTemplateColumns || '',
        sidebarDir: csSb?.flexDirection || '',
        overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      };
    });
    console.log(`  ${vp.width}x${vp.height}:`, JSON.stringify(m));
    ok(!m.mobile, `${vp.width}: data-mobile AUSENTE (desktop preservado, flag ON não vaza)`);
    ok(m.display === 'grid', `${vp.width}: corpo continua GRID (${m.display})`);
    ok((m.gridCols.match(/px|fr/g) || []).length >= 3, `${vp.width}: grid multi-coluna preservado`);
    ok(m.sidebarDir === 'column', `${vp.width}: navegação vertical (coluna) — não virou trilho`);
    ok(!m.overflow, `${vp.width}: sem overflow horizontal`);
    ok(erros.length === 0, `${vp.width}: sem erros JS`);
  } finally { await navegador.close(); }
}
console.log(falhas ? `\n✗ desktop-responsive-regression: ${falhas} falha(s)` : '\n✓ desktop-responsive-regression verde');
process.exit(falhas ? 1 : 0);
