// testes/mobile-color-controls.mjs — TRACK C Marco 4: cores/sliders por toque.
import { abrir, irParaHarness } from './navegador.mjs';
const FLAGS = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true, 'as6.mobile_studio': true };
let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };
const { navegador, pagina, erros } = await abrir({ viewport: { width: 390, height: 844 }, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: FLAGS });
try {
  await irParaHarness(pagina, 'avst-harness.html', 1100);
  // vai p/ Cabelo (tem cor)
  await pagina.evaluate(() => { const b = [...document.querySelectorAll('.avst5-sidebar .avst5-cat')].find((x) => (x.textContent||'').trim().startsWith('Cabelo')); b?.scrollIntoView({inline:'center'}); b?.click(); });
  await pagina.waitForTimeout(500);
  const m = await pagina.evaluate(() => {
    const sw = [...document.querySelectorAll('.avst-swatch')].map((s) => { const r = s.getBoundingClientRect(); return Math.round(Math.min(r.width, r.height)); }).filter((n) => n > 0);
    const sliders = [...document.querySelectorAll('input[type="range"]')].map((s) => { const r = s.getBoundingClientRect(); return Math.round(r.height); }).filter((n) => n > 0);
    return { nSw: sw.length, menorSw: sw.length ? Math.min(...sw) : 0, nSlider: sliders.length, menorSliderH: sliders.length ? Math.min(...sliders) : 0, docScrollW: document.documentElement.scrollWidth, innerW: window.innerWidth };
  });
  console.log('  controles:', JSON.stringify(m));
  ok(m.nSw === 0 || m.menorSw >= 30, `swatches com alvo confortável ≥30px (menor ${m.menorSw}, n ${m.nSw})`);
  ok(m.nSlider === 0 || m.menorSliderH >= 40, `sliders com área de toque ≥40px (menor ${m.menorSliderH}, n ${m.nSlider})`);
  ok(m.docScrollW <= m.innerW + 1, 'sem overflow horizontal nos controles');
  ok(erros.length === 0, `sem erros JS (${erros.slice(0, 2).join(' | ')})`);
} finally { await navegador.close(); }
console.log(falhas ? `\n✗ mobile-color-controls: ${falhas} falha(s)` : '\n✓ mobile-color-controls verde');
process.exit(falhas ? 1 : 0);
