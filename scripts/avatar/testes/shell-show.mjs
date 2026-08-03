// testes/shell-show.mjs — AS5 §174: Showcase cinematográfico + captura.
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';
const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true })); },
});
await irParaHarness(p, 'avst-harness.html', 1200);
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

ok(await p.locator('[data-teste="showcase"]').count() === 1, 'botão Apresentar ausente');
await p.locator('[data-teste="showcase"]').click();
await p.waitForTimeout(600);
ok(await p.locator('.avst5-shell[data-apresentando]').count() === 1, 'sequência não iniciou (data-apresentando)');
ok(await p.locator('.avst5-shell[data-modo="studio"]').count() === 1, 'Apresentar deveria entrar no modo Studio');
ok(await p.locator('.avst5-capturar').count() === 1, 'botão Capturar ausente no Studio');
await p.screenshot({ path: `${SAIDA}/show-meio.png` });
await p.waitForTimeout(6500); // sequência média ~6s (§174.2)
ok(await p.locator('.avst5-shell[data-apresentando]').count() === 0, 'sequência não terminou');
// captura dispara download de PNG
const [download] = await Promise.all([
  p.waitForEvent('download', { timeout: 8000 }).catch(() => null),
  p.locator('.avst5-capturar').click(),
]);
ok(download !== null && (download.suggestedFilename() ?? '').includes('.png'), 'captura não gerou download PNG');

const ok_ = relatorio('shell-show', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
