// testes/conquistas-f7.mjs — AS5 F7: perfil de progressão (§220–§224, §634)
// + recomendação contextual (§89) na aba Conquistas do App clássico.
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({ viewport: { width: 1500, height: 940 } });
await irParaHarness(p, 'avst-harness.html', 1200);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Conquistas')?.click(); });
await p.waitForTimeout(700);

ok(await p.locator('[data-teste="perfil-progresso"]').count() === 1, 'perfil de progresso ausente');
const selo = await p.locator('.avst-perfil-selo').textContent();
ok(/Nível \d+/.test(selo ?? ''), `selo de nível ausente (${selo})`);
// §634: fórmula TRANSPARENTE visível na UI
ok((await p.locator('.avst-perfil-formula').textContent())?.includes('Fórmula aberta'),
  'fórmula do XP não está exposta (§634)');
// §220: timeline com as 2 conquistas datadas do mock (mais recente primeiro)
const linhas = await p.locator('.avst-perfil-timeline li').allTextContents();
ok(linhas.length === 2, `timeline deveria ter 2 entradas (tem ${linhas.length})`);
ok(linhas[0].includes('Explorador') && linhas[1].includes('Primeiro Look'),
  'timeline não está em ordem mais-recente-primeiro');
// §89: recomendação da coleção mais próxima de completar
ok(await p.locator('[data-teste="recomendacao"]').count() === 1, 'recomendação §89 ausente');
ok((await p.locator('[data-teste="recomendacao"]').textContent())?.includes('/'),
  'recomendação sem progresso N/M');
// XP do mock: 2 conquistas × 40 = 80 (+ itens explorados locais)
ok(/\d+ XP/.test((await p.locator('.avst-perfil-xp em').textContent()) ?? ''), 'contador de XP ausente');
await p.screenshot({ path: `${SAIDA}/f7-perfil.png` });

const ok_ = relatorio('conquistas-f7', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
