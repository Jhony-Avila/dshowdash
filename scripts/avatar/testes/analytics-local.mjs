// testes/analytics-local.mjs — lote 461–470 (§292–§294, flag
// as5.analytics_local): heatmap + contagem por evento no viewer dev.
//   • §293: itens usados semeados → barras por categoria + últimos usados
//   • §294: eventos da sessão agrupados com contagem
//   • rollback §651: viewer sem os blocos novos
// @version 1.0.0  @created 2026-08-06
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

async function abrirViewer(p) {
  await p.keyboard.press('Control+k');
  await p.waitForTimeout(500);
  await p.keyboard.type('Telemetria');
  await p.waitForTimeout(400);
  await p.keyboard.press('Enter');
  await p.waitForSelector('[data-teste="telemetria-dev"]', { timeout: 8000 });
}

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1',
      JSON.stringify({ 'as5.novo_shell': true, 'as5.telemetria_painel': true }));
    localStorage.setItem('dshow.avatar.usados.v1', JSON.stringify(['cab_moicano', 'cab_curto', 'olh_estrela', 'rou_jersey']));
    localStorage.setItem('dshow.avst5.recentes.v1', JSON.stringify(['cab_moicano']));
  },
});
try {
  await irParaHarness(p, 'avst-harness.html', 1200);
  // gera pelo menos 1 evento de telemetria (trocar de categoria)
  await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Cabelo'))?.click(); });
  await p.waitForTimeout(400);
  await abrirViewer(p);
  ok(await p.locator('[data-teste="heatmap"]').count() === 1, 'heatmap §293 ausente');
  const heat = await p.locator('[data-teste="heatmap"]').textContent();
  ok((heat ?? '').includes('cabelo'), 'heatmap sem a categoria mais usada (cabelo ×2)');
  ok(await p.locator('[data-teste="heatmap-recentes"]').count() === 1, 'últimos usados ausentes');
  ok(await p.locator('[data-teste="por-evento"]').count() === 1, 'contagem por evento §294 ausente');
  ok(/×\d/.test((await p.locator('[data-teste="por-evento"]').textContent()) ?? ''), 'contagens ausentes');
  await p.screenshot({ path: `${SAIDA}/analytics-local.png` });
} catch (e) { falhas.push(`exceção: ${e.message}`); }
await b.close();

const { navegador: b2, pagina: p2, erros: erros2 } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({
      'as5.novo_shell': true, 'as5.telemetria_painel': true, 'as5.analytics_local': false,
    }));
    localStorage.setItem('dshow.avatar.usados.v1', JSON.stringify(['cab_moicano']));
  },
});
try {
  await irParaHarness(p2, 'avst-harness.html', 1200);
  await abrirViewer(p2);
  ok(await p2.locator('[data-teste="heatmap"]').count() === 0, 'flag off com heatmap (§651)');
  ok(await p2.locator('[data-teste="por-evento"]').count() === 0, 'flag off com por-evento (§651)');
} catch (e) { falhas.push(`exceção no rollback: ${e.message}`); }

const ok_ = relatorio('analytics-local', falhas, [...erros, ...erros2]);
await b2.close();
process.exit(ok_ ? 0 : 1);
