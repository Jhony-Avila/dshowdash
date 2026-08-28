// testes/mobile-performance-smoke.mjs — TRACK C Marco 8: desempenho e
// estabilidade da composição mobile. Não mede FPS de device (headless não é
// fiel); mede ESTABILIDADE verificável: (a) laço de interação (troca de
// categorias + abre/fecha ferramenta) não vaza nós de DOM, (b) churn de
// resize/orientação não lança e alterna data-mobile corretamente, (c) o palco
// 2D tem contagem de nós limitada (sem duplicar cena), (d) zero erro JS no
// percurso todo. Motor/Track A intocados.
import { abrir, irParaHarness } from './navegador.mjs';
const FLAGS = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true, 'as6.mobile_studio': true };
let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };

const { navegador, pagina, erros } = await abrir({ viewport: { width: 390, height: 844 }, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: FLAGS });
try {
  await irParaHarness(pagina, 'avst-harness.html', 1100);

  // baseline: composição mobile ativa + contagem de nós inicial
  const base = await pagina.evaluate(() => ({
    mobile: document.querySelector('.avst5-shell[data-mobile]') !== null,
    nos: document.querySelectorAll('*').length,
  }));
  ok(base.mobile, 'composição mobile ativa no baseline (data-mobile)');

  // (a) laço de interação: percorre categorias 2× e abre/fecha ferramenta 3×
  const CATS = ['Rosto', 'Olhos', 'Cabelo', 'Roupa', 'Calçados'];
  for (let volta = 0; volta < 2; volta++) {
    for (const c of CATS) {
      await pagina.evaluate((n) => {
        const b = [...document.querySelectorAll('.avst5-sidebar .avst5-cat, button.avst6-navg-cab')].find((x) => (x.textContent || '').trim().startsWith(n));
        if (b) { b.scrollIntoView({ inline: 'center' }); b.click(); }
      }, c);
      await pagina.waitForTimeout(120);
    }
  }
  for (let i = 0; i < 3; i++) {
    await pagina.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').trim().startsWith('Coleções'));
      b?.click();
    });
    await pagina.waitForTimeout(350);
    await pagina.evaluate(() => document.querySelector('.avst5-ferr-fechar')?.click());
    await pagina.waitForTimeout(250);
  }
  const depois = await pagina.evaluate(() => ({
    nos: document.querySelectorAll('*').length,
    ferrAberta: document.querySelector('.avst5-ferr-modal') !== null,
  }));
  const delta = depois.nos - base.nos;
  console.log(`  nós: base ${base.nos} → depois ${depois.nos} (Δ${delta})`);
  ok(!depois.ferrAberta, 'ferramenta fechada ao fim do laço (sem sobra de overlay)');
  // tolerância: o laço não deve empilhar centenas de nós órfãos (vazamento).
  ok(delta <= Math.max(120, Math.round(base.nos * 0.15)), `DOM estável após laço (Δ${delta} nós dentro do orçamento)`);

  // (b) churn de resize/orientação: mobile↔desktop várias vezes, sem lançar
  const seq = [[820, 700], [390, 844], [844, 390], [390, 844], [1200, 800], [375, 667]];
  for (const [w, h] of seq) { await pagina.setViewportSize({ width: w, height: h }); await pagina.waitForTimeout(160); }
  const churn = await pagina.evaluate(() => ({
    mobile: document.querySelector('.avst5-shell[data-mobile]') !== null,
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    innerW: window.innerWidth,
  }));
  // 375×667 = celular estreito → deve terminar em mobile, sem overflow horizontal
  ok(churn.mobile, `data-mobile correto após churn de resize (viewport final ${churn.innerW})`);
  ok(!churn.overflow, 'sem overflow horizontal após churn de resize');

  // desktop largo desliga a composição mobile (prova reversibilidade da flag+viewport)
  await pagina.setViewportSize({ width: 1280, height: 900 });
  await pagina.waitForTimeout(200);
  const desk = await pagina.evaluate(() => document.querySelector('.avst5-shell[data-mobile]') === null);
  ok(desk, 'viewport largo desativa data-mobile (volta ao desktop)');
  await pagina.setViewportSize({ width: 390, height: 844 });
  await pagina.waitForTimeout(200);

  // (c) palco 2D com contagem de nós limitada (não duplica cena por troca)
  const palco = await pagina.evaluate(() => {
    const svg = document.querySelector('.avst5-palco svg');
    return { temSvg: !!svg, nosSvg: svg ? svg.querySelectorAll('*').length : 0 };
  });
  ok(palco.temSvg, 'palco 2D presente');
  ok(palco.nosSvg > 0 && palco.nosSvg < 4000, `palco com nós limitados (${palco.nosSvg} < 4000, sem cena duplicada)`);

  ok(erros.length === 0, `sem erros JS no percurso (${erros.slice(0, 3).join(' | ')})`);
} finally { await navegador.close(); }
console.log(falhas ? `\n✗ mobile-performance-smoke: ${falhas} falha(s)` : '\n✓ mobile-performance-smoke verde');
process.exit(falhas ? 1 : 0);
