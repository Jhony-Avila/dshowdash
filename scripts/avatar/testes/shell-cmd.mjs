// testes/shell-cmd.mjs — AS5 §566: command palette (Ctrl+K).
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';
const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true })); },
});
await irParaHarness(p, 'avst-harness.html', 1200);
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };
const svgPalco = () => p.locator('.avst5-palco svg').evaluate((el) => el.innerHTML);

// Ctrl+K abre; Esc fecha
await p.keyboard.press('Control+k');
await p.waitForTimeout(400);
ok(await p.locator('[data-teste="paleta-comandos"]').count() === 1, 'Ctrl+K não abriu a paleta');
await p.keyboard.press('Escape');
await p.waitForTimeout(300);
ok(await p.locator('[data-teste="paleta-comandos"]').count() === 0, 'Esc não fechou');

// navegação: "abrir cabelo" → categoria muda
await p.keyboard.press('Control+k');
await p.waitForTimeout(300);
await p.keyboard.type('abrir cabelo');
await p.waitForTimeout(300);
await p.keyboard.press('Enter');
await p.waitForTimeout(500);
ok(await p.locator('.avst5-cat-on', { hasText: 'Cabelo' }).count() === 1, 'comando Abrir Cabelo não navegou');

// equipar por nome: "moicano" (item real) muda o palco
const antes = await svgPalco();
await p.keyboard.press('Control+k');
await p.waitForTimeout(300);
await p.keyboard.type('moicano');
await p.waitForTimeout(400);
await p.screenshot({ path: `${SAIDA}/cmd-paleta.png` });
await p.keyboard.press('Enter');
await p.waitForTimeout(600);
ok((await svgPalco()) !== antes, 'Equipar pela paleta não mudou o palco');
ok((await p.locator('.avst5-salvar').textContent())?.includes('alteraç'), 'equipar pela paleta deveria virar alteração');

const ok_ = relatorio('shell-cmd', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
