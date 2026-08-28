// testes/mobile-color-flow.mjs — TRACK C cert: fluxo de cor no celular, na
// medida do que o harness permite. As VARIANTES de cor (§73/§74) só existem para
// assets com canais de cor (usaCores), que o catálogo-mock do harness não expõe
// (canais=null) — logo o payload-com-cor é E2E de SESSÃO AUTENTICADA (device),
// não do harness. Aqui provamos as garantias de LAYOUT que a cor usa no mobile:
// (a) equipar asset atualiza o palco (loop que a cor monta em cima);
// (b) o caminho de cor é acessível (botão Detalhes pós-equipar);
// (c) o CSS de controle de cor está correto no mobile (swatch/slider ≥ alvo).
import { abrir, irParaHarness } from './navegador.mjs';
const FLAGS = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true, 'as6.mobile_studio': true };
let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };

const { navegador, pagina, erros } = await abrir({ viewport: { width: 390, height: 844 }, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: FLAGS });
try {
  await irParaHarness(pagina, 'avst-harness.html', 1100);
  await pagina.evaluate(() => { const b = [...document.querySelectorAll('.avst5-sidebar .avst5-cat')].find((e) => (e.textContent || '').trim().startsWith('Cabelo')); b?.click(); });
  await pagina.waitForTimeout(500);
  const svg0 = await pagina.evaluate(() => document.querySelector('.avst5-palco svg')?.outerHTML.length || 0);

  // (a) equipar asset → palco atualiza + pendente (o loop de edição que a cor usa)
  await pagina.evaluate(() => { const c = [...document.querySelectorAll('.avst-card')].find((x) => !x.classList.contains('avst-card-ativo')); c?.scrollIntoView({ block: 'center' }); c?.click(); });
  await pagina.waitForTimeout(700);
  const svg1 = await pagina.evaluate(() => document.querySelector('.avst5-palco svg')?.outerHTML.length || 0);
  const pendente = await pagina.evaluate(() => !!document.querySelector('.avst5-salvar-pendente'));
  ok(svg1 !== svg0, `equipar atualiza o palco (svg ${svg0}→${svg1})`);
  ok(pendente, 'edição deixa estado pendente (base do fluxo de cor)');

  // (b) caminho de cor acessível: botão Detalhes pós-equipar (abre variantes §73 quando há canais)
  const temDetalhes = await pagina.evaluate(() => [...document.querySelectorAll('button')].some((x) => (x.textContent || '').trim() === 'Detalhes'));
  ok(temDetalhes, 'caminho de cor acessível (botão Detalhes presente após equipar)');

  // (c) CSS de controle de cor correto no mobile (independe de dados): swatch e slider
  const css = await pagina.evaluate(() => {
    const el = document.createElement('div'); el.className = 'avst5-shell'; el.setAttribute('data-mobile', '1');
    const sw = document.createElement('button'); sw.className = 'avst-swatch'; el.appendChild(sw);
    const sl = document.createElement('input'); sl.type = 'range'; el.appendChild(sl);
    document.body.appendChild(el);
    const csw = getComputedStyle(sw), csl = getComputedStyle(sl);
    const r = { swW: parseFloat(csw.width) || parseFloat(csw.minWidth) || 0, swTouch: csw.touchAction, slH: parseFloat(csl.height) || 0 };
    el.remove(); return r;
  });
  console.log('  css cor:', JSON.stringify(css));
  ok(css.slH >= 44, `slider mobile com área de toque ≥44px (${css.slH})`);
  ok(css.swTouch === 'manipulation', 'swatch com touch-action manipulation');

  // (d) salvar a edição (o mecanismo que persiste a cor também)
  await pagina.evaluate(() => document.querySelector('.avst5-salvar .avst-botao-primario')?.click());
  await pagina.waitForTimeout(1200);
  const salvo = await pagina.evaluate(() => ({ salvo: !document.querySelector('.avst5-salvar-pendente'), erro: !!document.querySelector('.avst5-salvar-erro') }));
  ok(!salvo.erro && salvo.salvo, 'salvar persiste a edição (mesmo caminho da cor)');

  console.log('  NOTA: variantes de cor (§73/§74) exigem assets com canais (usaCores); o catálogo-mock do harness não os expõe → payload-com-cor é validação de SESSÃO AUTENTICADA (device). Ver MOBILE_REAL_DEVICE_TEST_KIT.');
  ok(erros.length === 0, `sem erros JS (${erros.slice(0, 2).join(' | ')})`);
} finally { await navegador.close(); }
console.log(falhas ? `\n✗ mobile-color-flow: ${falhas} falha(s)` : '\n✓ mobile-color-flow verde');
process.exit(falhas ? 1 : 0);
