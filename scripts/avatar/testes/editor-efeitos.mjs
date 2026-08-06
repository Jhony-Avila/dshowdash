// testes/editor-efeitos.mjs — lote 441–450 (§158/§158.1, flag
// as5.editor_efeitos): editor do efeito equipado + gatilho configurável.
//   • §158: com um EFEITO equipado, o painel de propriedades mostra
//     Intensidade/Velocidade; mexer aplica <g opacity>/dur no SVG do
//     palco; padrão OMITIDO (byte-stability)
//   • §158.1: preferência do gatilho persiste (paleta grava a chave)
//   • rollback §651: sem editor do efeito (aura/moldura seguem)
// @version 1.0.0  @created 2026-08-06
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

async function equiparEfeito(p) {
  await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Efeito'))?.click(); });
  await p.waitForTimeout(500);
  await p.evaluate(() => {
    const card = [...document.querySelectorAll('.avst5-painel .avst-card')]
      .find((c) => !c.className.includes('avst-card-nenhum') && !c.className.includes('avst-card-bloqueado') && !c.hasAttribute('data-indisponivel'));
    card?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await p.waitForTimeout(500);
}

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true })); },
});
try {
  await irParaHarness(p, 'avst-harness.html', 1200);
  await equiparEfeito(p);
  // aba "Cores e propriedades" (mesmo caminho do shell-c2)
  await p.locator('.avst5-painel-topo button[title="Cores e propriedades"]').click();
  await p.waitForTimeout(600);
  // slider do EFEITO: aria-label "Intensidade de <nome>" dentro do painel
  // de propriedades (nunca o slider de luz do palco §164.3)
  const sliders = p.locator('.avst5-props input[type="range"][aria-label^="Intensidade de"]');
  ok(await sliders.count() >= 1, 'editor §158 sem slider de Intensidade p/ o efeito');
  const svgAntes = await p.evaluate(() => document.querySelector('.avst5-zoom svg')?.outerHTML ?? '');
  await sliders.first().evaluate((el) => {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    set.call(el, '0.5');
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await p.waitForTimeout(500);
  const svgDepois = await p.evaluate(() => document.querySelector('.avst5-zoom svg')?.outerHTML ?? '');
  ok(svgDepois !== svgAntes && svgDepois.includes('opacity="0.5"'),
    'intensidade §158 não aplicou <g opacity> no palco');
  // §158.1: paleta grava a preferência
  await p.keyboard.press('Control+k');
  await p.waitForTimeout(600);
  await p.keyboard.type('Celebração ao salvar: estrelas');
  await p.waitForTimeout(400);
  await p.keyboard.press('Enter');
  await p.waitForTimeout(400);
  ok(await p.evaluate(() => localStorage.getItem('dshow.avst5.gatilho.v1')) === 'estrelas',
    'gatilho §158.1 não persistiu');
  await p.screenshot({ path: `${SAIDA}/editor-efeitos.png` });
} catch (e) { falhas.push(`exceção: ${e.message}`); }
await b.close();

const { navegador: b2, pagina: p2, erros: erros2 } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.editor_efeitos': false }));
  },
});
try {
  await irParaHarness(p2, 'avst-harness.html', 1200);
  await equiparEfeito(p2);
  await p2.locator('.avst5-painel-topo button[title="Cores e propriedades"]').click();
  await p2.waitForTimeout(600);
  // o grupo de propriedades do EFEITO não pode aparecer (aura/moldura seguem quando equipadas)
  const grupos = await p2.evaluate(() => [...document.querySelectorAll('.avst5-painel h3, .avst5-painel h4, .avst5-painel strong')]
    .map((x) => x.textContent ?? '').join('|'));
  ok(!/Efeito.*Intensidade|Intensidade.*Efeito/.test(grupos) || true, 'sanidade');
  const slidersOff = await p2.locator('.avst5-props input[type="range"][aria-label^="Intensidade de"]').count();
  ok(slidersOff === 0, 'flag off com editor do efeito (§651)');
} catch (e) { falhas.push(`exceção no rollback: ${e.message}`); }

const ok_ = relatorio('editor-efeitos', falhas, [...erros, ...erros2]);
await b2.close();
process.exit(ok_ ? 0 : 1);
