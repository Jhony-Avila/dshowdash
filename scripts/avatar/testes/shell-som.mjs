// testes/shell-som.mjs — SOM no shell §584 (mega 8): E2E com AudioContext
// STUBADO (conta osciladores disparados — headless não tem áudio real).
// @version 1.0.0  @created 2026-08-03
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true }));
    localStorage.setItem('dshow.avatar.som.v1', '1'); // som LIGADO
    // stub: mesma superfície que services/Som usa; cada osc.start conta
    window.__notas = 0;
    const Param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} });
    const No = () => ({ gain: Param(), connect(x) { return x; }, disconnect() {} });
    window.AudioContext = class {
      constructor() { this.currentTime = 0; this.state = 'running'; this.destination = No(); }
      resume() { return Promise.resolve(); }
      createGain() { return No(); }
      createOscillator() {
        return { type: 'sine', frequency: Param(), connect(x) { return x; }, start() { window.__notas += 1; }, stop() {} };
      }
    };
  },
});
await irParaHarness(p, 'avst-harness.html', 1200);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };
const notas = () => p.evaluate(() => window.__notas);

// chave do som certa? (o stub só serve se o serviço usar a mesma CHAVE)
ok(await p.locator('[data-teste="som-toggle"][aria-pressed="true"]').count() === 1,
  'som deveria iniciar LIGADO (chave dshow.avatar.som.v1=1)');

// R1: equipar dispara nota(s) — 2 osciladores por nota (seno + brilho)
await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Cabelo'))?.click(); });
await p.waitForTimeout(700);
const antes = await notas();
await p.evaluate(() => {
  const cards = [...document.querySelectorAll('.avst5-painel .avst-card')]
    .filter((c) => !c.className.includes('avst-card-ativo') && !c.className.includes('avst-card-nenhum') && c.dataset.teste !== 'card-adiado');
  cards[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await p.waitForTimeout(400);
const aposEquipar = await notas();
ok(aposEquipar > antes, `equipar não tocou (notas ${antes}→${aposEquipar})`);

// R2: salvar toca o acorde (dó+mi = 2 notas × 2 osciladores)
await p.locator('.avst5-salvar button', { hasText: /salvar/i }).first().click();
await p.waitForTimeout(600);
const aposSalvar = await notas();
ok(aposSalvar >= aposEquipar + 4, `salvar não tocou o acorde (notas ${aposEquipar}→${aposSalvar})`);

// R3: MUTE corta tudo — equipar de novo não toca
await p.locator('[data-teste="som-toggle"]').click();
await p.waitForTimeout(200);
const antesMudo = await notas();
await p.evaluate(() => {
  const cards = [...document.querySelectorAll('.avst5-painel .avst-card')]
    .filter((c) => !c.className.includes('avst-card-ativo') && !c.className.includes('avst-card-nenhum') && c.dataset.teste !== 'card-adiado');
  cards[2]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await p.waitForTimeout(400);
ok((await notas()) === antesMudo, 'com mute, equipar ainda tocou');
ok(await p.locator('[data-teste="som-toggle"][aria-pressed="false"]').count() === 1, 'toggle não refletiu o mute');
await p.screenshot({ path: `${SAIDA}/som-mute.png` });

const ok_ = relatorio('shell-som', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
