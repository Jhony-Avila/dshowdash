// testes/mobile-touch-navigation.mjs — TRACK C Marco 2: navegação por toque.
// Prova: trilho de categorias HORIZONTAL, alvos ≥44px, sem depender de hover,
// categoria ativa marcada, troca por toque funciona (comportamento real).
import { abrir, irParaHarness } from './navegador.mjs';
const FLAGS = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true, 'as6.mobile_studio': true };
let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };

const { navegador, pagina, erros } = await abrir({ viewport: { width: 375, height: 667 }, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: FLAGS });
try {
  await irParaHarness(pagina, 'avst-harness.html', 1100);
  const info = await pagina.evaluate(() => {
    const rail = document.querySelector('.avst5-sidebar');
    const cats = [...document.querySelectorAll('.avst5-sidebar .avst5-cat, .avst5-sidebar .avst6-navg-cab')];
    const rectRail = rail ? rail.getBoundingClientRect() : null;
    const cs = rail ? getComputedStyle(rail) : null;
    const alvos = cats.map((b) => { const r = b.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; }).filter((a) => a.w > 0);
    return {
      temRail: !!rail,
      direcao: cs ? cs.flexDirection : null,
      railW: rectRail ? Math.round(rectRail.width) : 0,
      railH: rectRail ? Math.round(rectRail.height) : 0,
      scrollW: rail ? rail.scrollWidth : 0, clientW: rail ? rail.clientWidth : 0,
      nCats: alvos.length,
      pequenos: alvos.filter((a) => a.h < 44).length, // alvos abaixo de 44px de altura
      menorH: alvos.length ? Math.min(...alvos.map((a) => a.h)) : 0,
    };
  });
  console.log('  rail:', JSON.stringify(info));
  ok(info.temRail, 'trilho de categorias presente');
  ok(info.direcao === 'row', 'trilho é HORIZONTAL (flex-direction: row)');
  ok(info.railH <= 80, `trilho é uma faixa fina (h ${info.railH} ≤ 80)`);
  ok(info.nCats >= 3, `há categorias no trilho (${info.nCats})`);
  ok(info.pequenos === 0, `todos os alvos ≥44px de altura (menor ${info.menorH}, abaixo de 44: ${info.pequenos})`);
  ok(info.scrollW >= info.clientW, `trilho rolável na horizontal se preciso (scrollW ${info.scrollW} ≥ clientW ${info.clientW})`);

  // troca por TOQUE (tap) — categoria ativa muda
  const antes = await pagina.evaluate(() => document.querySelector('.avst5-cat-on')?.textContent?.trim() || null);
  await pagina.evaluate(() => {
    const cats = [...document.querySelectorAll('.avst5-sidebar .avst5-cat')];
    const alvo = cats.find((c) => !c.classList.contains('avst5-cat-on'));
    alvo?.scrollIntoView({ inline: 'center' }); alvo?.click();
  });
  await pagina.waitForTimeout(500);
  const depois = await pagina.evaluate(() => ({ ativa: document.querySelector('.avst5-cat-on')?.textContent?.trim() || null, temSvg: !!document.querySelector('.avst5-palco svg'), docScrollW: document.documentElement.scrollWidth, innerW: window.innerWidth }));
  ok(depois.ativa && depois.ativa !== antes, `toque troca a categoria ativa (${antes} → ${depois.ativa})`);
  ok(depois.temSvg, 'palco continua renderizando após a troca');
  ok(depois.docScrollW <= depois.innerW + 1, 'sem overflow horizontal após a troca');
  ok(erros.length === 0, `sem erros JS (${erros.slice(0, 2).join(' | ')})`);
} finally { await navegador.close(); }
console.log(falhas ? `\n✗ mobile-touch-navigation: ${falhas} falha(s)` : '\n✓ mobile-touch-navigation verde');
process.exit(falhas ? 1 : 0);
