// TRACK C Marco 5: teclado/formulários — font 16 (iOS sem zoom), scroll-margin,
// foco não quebra o layout. (Teclado real é validado em aparelho — checklist.)
import { abrir, irParaHarness } from './navegador.mjs';
const FLAGS = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true, 'as6.mobile_studio': true };
let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };
const { navegador, pagina, erros } = await abrir({ viewport: { width: 390, height: 844 }, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: FLAGS });
try {
  await irParaHarness(pagina, 'avst-harness.html', 1100);
  const m = await pagina.evaluate(() => {
    const inp = document.querySelector('input[type="text"], input[type="search"], input:not([type])');
    if (!inp) return { semCampo: true, docScrollW: document.documentElement.scrollWidth, innerW: window.innerWidth };
    inp.scrollIntoView({ block: 'center' }); inp.focus();
    const cs = getComputedStyle(inp);
    return { semCampo: false, font: parseFloat(cs.fontSize), scrollMB: cs.scrollMarginBottom, focado: document.activeElement === inp, docScrollW: document.documentElement.scrollWidth, innerW: window.innerWidth };
  });
  console.log('  campo:', JSON.stringify(m));
  ok(m.docScrollW <= m.innerW + 1, 'sem overflow horizontal com campo em foco');
  if (!m.semCampo) {
    ok(m.font >= 16, `campo com font ≥16px (iOS não dá zoom): ${m.font}`);
    ok(parseFloat(m.scrollMB) >= 100, `campo tem scroll-margin p/ não ficar sob a barra/teclado: ${m.scrollMB}`);
    ok(m.focado, 'campo recebe foco');
  } else { console.log('  (nenhum campo de texto visível no estado atual — checklist de aparelho cobre o teclado)'); }
  ok(erros.length === 0, 'sem erros JS');
} finally { await navegador.close(); }
console.log(falhas ? `\n✗ mobile-keyboard-viewport: ${falhas} falha(s)` : '\n✓ mobile-keyboard-viewport verde');
process.exit(falhas ? 1 : 0);
