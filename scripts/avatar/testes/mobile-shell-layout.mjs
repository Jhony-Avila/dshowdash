// testes/mobile-shell-layout.mjs — TRACK C Marco 1: FUNDAÇÃO responsiva.
// Prova comportamento REAL (não presença de classe): com a flag mobile ON e
// viewport estreito, o shell (a) marca data-mobile, (b) NÃO tem overflow
// horizontal, (c) mantém o palco visível no topo. Com a flag OFF, NÃO marca
// data-mobile (desktop aprovado intocado).
import { abrir, irParaHarness } from './navegador.mjs';

const FLAGS_BASE = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true };
let falhas = 0;
const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };

async function medir(pagina) {
  return pagina.evaluate(() => {
    const shell = document.querySelector('.avst5-shell');
    const vp = document.querySelector('.avst5-viewport');
    const doc = document.documentElement;
    const rectVp = vp ? vp.getBoundingClientRect() : null;
    return {
      temShell: !!shell,
      dataMobile: shell ? shell.getAttribute('data-mobile') : null,
      // overflow horizontal de página / do shell
      docScrollW: doc.scrollWidth, innerW: window.innerWidth,
      shellScrollW: shell ? shell.scrollWidth : 0, shellClientW: shell ? shell.clientWidth : 0,
      // palco visível?
      palcoH: rectVp ? Math.round(rectVp.height) : 0,
      palcoTop: rectVp ? Math.round(rectVp.top) : -1,
      palcoVisivel: !!rectVp && rectVp.top < window.innerHeight && rectVp.bottom > 0 && rectVp.height > 150,
    };
  });
}

// ── contexto 1: flag ON + viewport estreito (375×667) ──
{
  const FLAGS = { ...FLAGS_BASE, 'as6.mobile_studio': true };
  const { navegador, pagina, erros } = await abrir({ viewport: { width: 375, height: 667 }, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: FLAGS });
  try {
    await irParaHarness(pagina, 'avst-harness.html', 1100);
    const m = await medir(pagina);
    console.log('  [ON 375×667]', JSON.stringify(m));
    ok(m.temShell, 'shell montou');
    ok(m.dataMobile === '1', 'data-mobile=1 (composição mobile ativa)');
    ok(m.docScrollW <= m.innerW + 1, `SEM overflow horizontal de página (scrollW ${m.docScrollW} ≤ innerW ${m.innerW})`);
    ok(m.shellScrollW <= m.shellClientW + 1, `SEM overflow horizontal do shell (${m.shellScrollW} ≤ ${m.shellClientW})`);
    ok(m.palcoVisivel, `palco visível no topo (h ${m.palcoH}, top ${m.palcoTop})`);
    ok(erros.length === 0, `sem erros JS (${erros.slice(0, 2).join(' | ')})`);
  } finally { await navegador.close(); }
}

// ── contexto 2: flag OFF → desktop (sem data-mobile) mesmo estreito ──
{
  const FLAGS = { ...FLAGS_BASE, 'as6.mobile_studio': false };
  const { navegador, pagina, erros } = await abrir({ viewport: { width: 375, height: 667 }, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: FLAGS });
  try {
    await irParaHarness(pagina, 'avst-harness.html', 1100);
    const m = await medir(pagina);
    console.log('  [OFF 375×667]', JSON.stringify({ dataMobile: m.dataMobile }));
    ok(m.dataMobile === null, 'flag OFF: SEM data-mobile (desktop aprovado intocado)');
    ok(erros.length === 0, `flag OFF: sem erros JS (${erros.slice(0, 2).join(' | ')})`);
  } finally { await navegador.close(); }
}

console.log(falhas ? `\n✗ mobile-shell-layout: ${falhas} falha(s)` : '\n✓ mobile-shell-layout verde');
process.exit(falhas ? 1 : 0);
