// TRACK C Marco 5: safe-areas — nada colado na borda; padding usa env().
import { abrir, irParaHarness } from './navegador.mjs';
const FLAGS = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true, 'as6.mobile_studio': true };
let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };
const { navegador, pagina, erros } = await abrir({ viewport: { width: 390, height: 844 }, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: FLAGS });
try {
  await irParaHarness(pagina, 'avst-harness.html', 1100);
  const m = await pagina.evaluate(() => {
    const shell = document.querySelector('.avst5-shell');
    const sa = getComputedStyle(shell).getPropertyValue('--sa-bottom');
    const head = document.querySelector('.avst5-header'); const csh = head ? getComputedStyle(head) : null;
    return { temVar: sa !== '', headTop: csh ? parseFloat(csh.paddingTop) : 0, overflowX: getComputedStyle(shell).overflowX };
  });
  ok(m.temVar, 'variáveis de safe-area definidas no shell (env com fallback)');
  ok(m.headTop >= 4, `header tem padding-top (respeita notch): ${m.headTop}px`);
  ok(m.overflowX === 'hidden', 'shell sem overflow horizontal');
  ok(erros.length === 0, 'sem erros JS');
} finally { await navegador.close(); }
console.log(falhas ? `\n✗ mobile-safe-area: ${falhas} falha(s)` : '\n✓ mobile-safe-area verde');
process.exit(falhas ? 1 : 0);
