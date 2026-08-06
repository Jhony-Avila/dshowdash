// testes/orcamento.mjs — lote 381–390 (§183/§184/§186.1/§274, flag
// as5.orcamento_perf): orçamento de performance.
//   • §274 prefetch: hover no botão 3D busca o chunk Renderizador3d ANTES
//     do clique (asserção pela rede)
//   • §186.1: captura do palco 2D sai em 1920px (flag on)
//   • §183: aviso de orçamento no viewer dev quando storage >80% (semeado)
//   • rollback §651: sem hover-prefetch e captura volta a 960px
// @version 1.0.0  @created 2026-08-06
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1',
      JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': true, 'as5.telemetria_painel': true }));
    // §183: ~4,3MB semeados p/ cruzar os 80% do orçamento de 5MB
    try { localStorage.setItem('dshow.avst5.teste-orcamento.v1', JSON.stringify({ x: 'a'.repeat(2200000) })); } catch { /* quota */ }
  },
});
try {
  await irParaHarness(p, 'avst-harness.html', 1200);

  // §274: ANTES do hover o chunk não veio; hover → chunk atravessa a rede
  const antes = await p.evaluate(() =>
    performance.getEntriesByType('resource').filter((r) => r.name.includes('/chunks/Renderizador3d.')).length);
  ok(antes === 0, 'chunk 3D não podia ter vindo antes do hover (§274)');
  await p.locator('[data-teste="botao-3d"]').hover();
  await p.waitForTimeout(1500);
  const depois = await p.evaluate(() =>
    performance.getEntriesByType('resource').filter((r) => r.name.includes('/chunks/Renderizador3d.')).length);
  ok(depois >= 1, 'hover não fez o prefetch do motor (§274)');

  // §186.1: captura em 1920px — intercepta o download
  await p.locator('button[title="Modo Studio (apresentação)"]').click();
  await p.waitForTimeout(500);
  const nome = await p.evaluate(async () => new Promise((resolve) => {
    const orig = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function c() {
      HTMLAnchorElement.prototype.click = orig;
      resolve(this.download);
    };
    [...document.querySelectorAll('button')].find((x) => x.textContent.includes('Capturar'))
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    setTimeout(() => resolve('TIMEOUT'), 8000);
  }));
  ok(String(nome).includes('1920px'), `captura deveria sair em 1920px (§186.1): ${nome}`);

  // §183: viewer dev mostra o aviso de orçamento
  await p.keyboard.press('Control+k');
  await p.waitForTimeout(600);
  await p.keyboard.type('Telemetria');
  await p.waitForTimeout(400);
  await p.keyboard.press('Enter');
  await p.waitForSelector('[data-teste="telemetria-dev"]', { timeout: 8000 });
  ok(await p.locator('[data-teste="orcamento-aviso"]').count() === 1, 'aviso de orçamento §183 ausente');
  await p.screenshot({ path: `${SAIDA}/orcamento.png` });
} catch (e) {
  falhas.push(`exceção: ${e.message}`);
}
await b.close();

// rollback §651
const { navegador: b2, pagina: p2, erros: erros2 } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({
      'as5.novo_shell': true, 'as5.palco3d': true, 'as5.orcamento_perf': false,
    }));
  },
});
try {
  await irParaHarness(p2, 'avst-harness.html', 1200);
  await p2.locator('[data-teste="botao-3d"]').hover();
  await p2.waitForTimeout(1200);
  const chunk = await p2.evaluate(() =>
    performance.getEntriesByType('resource').filter((r) => r.name.includes('/chunks/Renderizador3d.')).length);
  ok(chunk === 0, 'flag off com prefetch (§651)');
  await p2.locator('button[title="Modo Studio (apresentação)"]').click();
  await p2.waitForTimeout(500);
  const nome2 = await p2.evaluate(async () => new Promise((resolve) => {
    const orig = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function c() {
      HTMLAnchorElement.prototype.click = orig;
      resolve(this.download);
    };
    [...document.querySelectorAll('button')].find((x) => x.textContent.includes('Capturar'))
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    setTimeout(() => resolve('TIMEOUT'), 8000);
  }));
  ok(String(nome2).includes('960px'), `flag off deveria capturar 960px (§651): ${nome2}`);
} catch (e) {
  falhas.push(`exceção no rollback: ${e.message}`);
}

const ok_ = relatorio('orcamento', falhas, [...erros, ...erros2]);
await b2.close();
process.exit(ok_ ? 0 : 1);
