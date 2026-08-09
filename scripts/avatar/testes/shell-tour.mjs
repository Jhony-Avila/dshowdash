// testes/shell-tour.mjs — AS5 §568–§571: tour guiado de primeiro uso.
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';
const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false }));
    // remove a marca SÓ na 1ª carga (addInitScript re-roda no reload)
    try { if (!sessionStorage.getItem('tour-seed')) { sessionStorage.setItem('tour-seed', '1'); localStorage.removeItem('dshow.avst5.tour.v1'); } } catch { /* sem storage */ }
  },
});
await irParaHarness(p, 'avst-harness.html', 1200);
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// 1ª visita: tour abre sozinho no passo 1/6 (mega 299: +passo do poder)
ok(await p.locator('[data-teste="tour"]').count() === 1, 'tour não abriu na primeira visita');
ok((await p.locator('.avst5-tour-card em').textContent()) === '1/6', 'não começou no passo 1/6');
await p.screenshot({ path: `${SAIDA}/tour-passo1.png` });
// avança todos os passos até "Começar!"
for (let i = 0; i < 6; i++) { await p.locator('[data-teste="tour-proximo"]').click(); await p.waitForTimeout(350); }
ok(await p.locator('[data-teste="tour"]').count() === 0, 'tour não fechou no fim');
// persistência: reload NÃO reabre (localStorage marcou visto)
await p.reload();
await p.waitForTimeout(1500);
ok(await p.locator('[data-teste="tour"]').count() === 0, 'tour reabriu após visto (deveria persistir)');
// botão "?" reabre sob demanda; Pular fecha
await p.locator('[data-teste="tour-abrir"]').click();
await p.waitForTimeout(400);
ok(await p.locator('[data-teste="tour"]').count() === 1, 'botão ? não reabriu o tour');
await p.locator('.avst5-tour-card footer button', { hasText: 'Pular' }).click();
await p.waitForTimeout(300);
ok(await p.locator('[data-teste="tour"]').count() === 0, 'Pular não fechou');

const ok_ = relatorio('shell-tour', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
