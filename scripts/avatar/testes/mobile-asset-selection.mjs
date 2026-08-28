// testes/mobile-asset-selection.mjs — TRACK C Marco 4: seleção de asset por toque.
import { abrir, irParaHarness } from './navegador.mjs';
const FLAGS = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true, 'as6.mobile_studio': true };
let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };
const { navegador, pagina, erros } = await abrir({ viewport: { width: 390, height: 844 }, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: FLAGS });
try {
  await irParaHarness(pagina, 'avst-harness.html', 1100);
  const grade = await pagina.evaluate(() => { const g = document.querySelector('.avst-grade'); const cs = g ? getComputedStyle(g) : null; const cards = document.querySelectorAll('.avst-card'); return { temGrade: !!g, cols: cs ? cs.gridTemplateColumns.split(' ').length : 0, nCards: cards.length }; });
  ok(grade.temGrade && grade.nCards > 0, `catálogo tem cards (${grade.nCards})`);
  ok(grade.cols >= 2 && grade.cols <= 3, `grade em ${grade.cols} colunas (mobile)`);
  // seleciona um card não-ativo
  const sel = await pagina.evaluate(() => { const c = [...document.querySelectorAll('.avst-card')].find((x) => !x.classList.contains('avst-card-ativo')); if (!c) return false; c.scrollIntoView({ block: 'center' }); c.click(); return true; });
  await pagina.waitForTimeout(600);
  const depois = await pagina.evaluate(() => ({ temAtivo: !!document.querySelector('.avst-card-ativo'), temSvg: !!document.querySelector('.avst5-palco svg'), docScrollW: document.documentElement.scrollWidth, innerW: window.innerWidth }));
  ok(sel, 'card tocável');
  ok(depois.temSvg, 'palco re-renderiza após aplicar');
  ok(depois.docScrollW <= depois.innerW + 1, 'sem overflow horizontal ao selecionar');
  ok(erros.length === 0, `sem erros JS (${erros.slice(0, 2).join(' | ')})`);
} finally { await navegador.close(); }
console.log(falhas ? `\n✗ mobile-asset-selection: ${falhas} falha(s)` : '\n✓ mobile-asset-selection verde');
process.exit(falhas ? 1 : 0);
