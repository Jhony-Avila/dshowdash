// testes/palco-sensorial.mjs — lote 321–330 (§157.4–.5/§161/§164.3/§178,
// flag as5.palco_sensorial): palco sensorial no SHELL.
//   • §157.4 crossfade: trocar o fundo cria a camada cen-fade com o fundo
//     ANTERIOR e ela some sozinha (~380ms)
//   • §157.5 presença: trocar a BASE liga data-presenca e desliga sozinho
//   • §164.3 luz: slider persiste e aplica data-luzadv + var no viewport;
//     1.0 = atributo AUSENTE (modo simples §164.4, zero mudança)
//   • §161/§178 som ambiente: API pura testada à parte (não toca em CI —
//     AudioContext headless fica suspenso; aqui só garantimos que ligar o
//     fundo com o som DESLIGADO não cria nós de áudio nem erro JS)
//   • rollback §651: flag off = sem slider, sem fade, sem presença
// @version 1.0.0  @created 2026-08-06
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false }));
  },
});
try {
  await irParaHarness(p, 'avst-harness.html', 1200);
  // modo studio expõe os controles de cenário
  await p.locator('button[title="Modo Studio (apresentação)"]').click();
  await p.waitForTimeout(500);

  // §157.4: troca de fundo → camada com o fundo ANTERIOR aparece e some
  const fundoAtual = await p.locator('.avst5-viewport').first().getAttribute('data-fundo');
  await p.evaluate(() => {
    const grupo = document.querySelector('[data-teste="cenarios-2d"]') ?? document;
    [...grupo.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Arena')?.click();
  });
  await p.waitForTimeout(120);
  const fade = p.locator('[data-teste="cen-fade"]');
  ok(await fade.count() === 1, 'crossfade §157.4 não criou a camada');
  ok(await fade.getAttribute('data-fundo') === fundoAtual, 'camada de fade deveria carregar o fundo ANTERIOR');
  await p.waitForTimeout(600);
  ok(await fade.count() === 0, 'camada de fade não sumiu sozinha');

  // §164.3: slider de intensidade — 1.0 ausente; 1.2 liga data-luzadv
  ok(await p.locator('[data-teste="luz-intensidade"]').count() === 1, 'slider §164.3 ausente');
  ok(await p.locator('.avst5-viewport[data-luzadv]').count() === 0, 'padrão 1.0 não pode ter data-luzadv (§164.4)');
  await p.locator('[data-teste="luz-intensidade"]').evaluate((el) => {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    set.call(el, '1.2');
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await p.waitForTimeout(300);
  ok(await p.locator('.avst5-viewport[data-luzadv]').count() === 1, 'data-luzadv não ligou com 1.2');
  const persist = await p.evaluate(() => localStorage.getItem('dshow.avst5.palco.luzint.v1'));
  ok(persist === '1.2', `intensidade não persistiu (${persist})`);

  // §157.5: trocar a BASE liga a presença e desliga sozinho
  await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Base'))?.click(); });
  await p.waitForTimeout(500);
  await p.evaluate(() => {
    const cards = [...document.querySelectorAll('.avst5-painel .avst-card')]
      .filter((c) => !c.className.includes('avst-card-nenhum') && !c.className.includes('avst-card-bloqueado'));
    cards[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await p.waitForTimeout(150);
  ok(await p.locator('.avst5-viewport[data-presenca]').count() === 1, 'presença §157.5 não ligou');
  await p.waitForTimeout(800);
  ok(await p.locator('.avst5-viewport[data-presenca]').count() === 0, 'presença não desligou sozinha');

  // §161/§178: com o som DESLIGADO, ligar fundo não cria AudioContext
  const audio = await p.evaluate(() => Boolean(window.__ctxAudio));
  ok(!audio, 'ambiente não pode tocar com o som desligado (§178.3)');
  await p.screenshot({ path: `${SAIDA}/palco-sensorial.png` });
} catch (e) {
  falhas.push(`exceção: ${e.message}`);
}
await b.close();

// rollback §651
const { navegador: b2, pagina: p2, erros: erros2 } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({
      'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco_sensorial': false,
    }));
  },
});
try {
  await irParaHarness(p2, 'avst-harness.html', 1200);
  await p2.locator('button[title="Modo Studio (apresentação)"]').click();
  await p2.waitForTimeout(500);
  ok(await p2.locator('[data-teste="luz-intensidade"]').count() === 0, 'flag off com slider §164.3 (§651)');
  await p2.evaluate(() => {
    const grupo = document.querySelector('[data-teste="cenarios-2d"]') ?? document;
    [...grupo.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Arena')?.click();
  });
  await p2.waitForTimeout(120);
  ok(await p2.locator('[data-teste="cen-fade"]').count() === 0, 'flag off com crossfade (§651)');
} catch (e) {
  falhas.push(`exceção no rollback: ${e.message}`);
}

const ok_ = relatorio('palco-sensorial', falhas, [...erros, ...erros2]);
await b2.close();
process.exit(ok_ ? 0 : 1);
