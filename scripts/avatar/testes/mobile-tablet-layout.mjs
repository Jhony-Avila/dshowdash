// testes/mobile-tablet-layout.mjs — TRACK C cert: fronteira do tablet.
// 768×1024 (retrato) = mobile (≤768 → stack). 1024×768 (paisagem) = desktop
// (largura 1024 > 768 e altura 768 > 520 → grid aprovado). Prova a decisão de
// breakpoint por conteúdo, sem user-agent. Flag ON nos dois casos.
import { abrir, irParaHarness } from './navegador.mjs';
const FLAGS = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true, 'as6.mobile_studio': true };
let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };

async function cenario(vp, esperaMobile, rotulo) {
  const { navegador, pagina, erros } = await abrir({ viewport: vp, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: FLAGS });
  try {
    await irParaHarness(pagina, 'avst-harness.html', 1000);
    const m = await pagina.evaluate(() => ({
      mobile: document.querySelector('.avst5-shell[data-mobile]') !== null,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      palcoVis: (() => { const p = document.querySelector('.avst5-palco'); const r = p?.getBoundingClientRect(); return !!r && r.height > 120; })(),
    }));
    console.log(`  ${rotulo}:`, JSON.stringify(m));
    ok(m.mobile === esperaMobile, `${rotulo}: composição ${esperaMobile ? 'MOBILE (stack)' : 'DESKTOP (grid)'} correta`);
    ok(!m.overflow, `${rotulo}: sem overflow horizontal`);
    ok(m.palcoVis, `${rotulo}: palco renderiza`);
    ok(erros.length === 0, `${rotulo}: sem erros JS`);
  } finally { await navegador.close(); }
}

await cenario({ width: 768, height: 1024 }, true, 'tablet-retrato 768x1024');
await cenario({ width: 1024, height: 768 }, false, 'tablet-paisagem 1024x768');
console.log(falhas ? `\n✗ mobile-tablet-layout: ${falhas} falha(s)` : '\n✓ mobile-tablet-layout verde');
process.exit(falhas ? 1 : 0);
