// testes/shell-save.mjs — AS5 §158: CONFETE ao salvar com SUCESSO.
// O harness mocka window.fetch (POST studio.php responde ok) — o teste
// instrumenta ESSA camada (page.route nunca vê os mocks) e usa o registro
// __ch619 do próprio harness p/ provar o §619 do lote 141: escrita SEMPRE
// (best-effort), leitura de montagem gated pela flag.
// @version 1.2.0  @created 2026-08-03  @updated 2026-08-04 (lote 141)
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false })); },
});
await irParaHarness(p, 'avst-harness.html', 1200);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// instrumenta o fetch MOCKADO do harness (depois do load — o harness o
// define em script inline; addInitScript seria sobrescrito)
await p.evaluate(() => {
  window.__api = [];
  const f = window.fetch;
  window.fetch = (u, o) => {
    const s = String(u instanceof Request ? u.url : u);
    if (s.includes('/api/')) window.__api.push(`${(o && o.method) || 'GET'} ${s}`);
    return f(u, o);
  };
});

// muda algo (cabelo) para habilitar o salvar
await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Cabelo'))?.click(); });
await p.waitForTimeout(700);
await p.evaluate(() => {
  const cards = [...document.querySelectorAll('.avst5-painel .avst-card')]
    .filter((c) => !c.className.includes('avst-card-ativo') && !c.className.includes('avst-card-nenhum') && c.dataset.teste !== 'card-adiado');
  cards[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await p.waitForTimeout(500);
ok((await p.locator('.avst5-salvar').textContent())?.includes('alteraç'), 'mudança não habilitou o salvar');

// salva — mock responde sucesso → CONFETE (§158) + POST registrado
await p.locator('.avst5-salvar button', { hasText: /salvar/i }).first().click();
await p.waitForTimeout(500);
const chamadas = await p.evaluate(() => window.__api);
ok(chamadas.some((c) => c.startsWith('POST') && c.includes('studio.php')),
  `salvar não POSTou no studio.php (chamadas: ${chamadas.join(' | ') || 'nenhuma'})`);
ok(await p.locator('.avst5-celebracao').count() === 1, 'confete §158 não apareceu no sucesso do salvar');
ok(await p.locator('.avst5-celebracao svg').count() === 1, 'overlay do confete sem o SVG do efeito');
await p.screenshot({ path: `${SAIDA}/save-confete.png` });

// overlay é EFÊMERO (~2.2s) e some sozinho
await p.waitForTimeout(2400);
ok(await p.locator('.avst5-celebracao').count() === 0, 'confete não sumiu sozinho (deveria durar ~2.2s)');
ok((await p.locator('.avst5-salvar').textContent())?.toLowerCase().includes('salv'), 'barra não confirmou o salvamento');

// §619 (lote 141): a ESCRITA no espelho é SEMPRE ativa (best-effort) — mesmo
// com as5.estado_api OFF o save espelha o draft; só o GET de montagem é gated
const ch619 = await p.evaluate(() => window.__ch619 ?? []);
ok(ch619.length > 0 && ch619.every((c) => c.m === 'POST'),
  `flag OFF: esperava só POSTs best-effort no estado.php (${ch619.map((c) => c.m).join(',') || 'nenhuma chamada'})`);
ok(ch619.some((c) => c.corpo?.draft), 'save não espelhou nenhum draft no §619 (lote 141)');

const ok_ = relatorio('shell-save', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
