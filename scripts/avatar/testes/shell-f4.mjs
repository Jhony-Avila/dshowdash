// testes/shell-f4.mjs — AS5 F4: presets pessoais (§136/§199), histórico
// granular da sessão (§138) e autosave/recuperação de rascunho (§139).
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true })); },
});
await irParaHarness(p, 'avst-harness.html', 1200);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };
const svgPalco = () => p.locator('.avst5-palco svg').evaluate((el) => el.innerHTML);
const equipar = (indice) => p.evaluate((n) => {
  const cs = [...document.querySelectorAll('.avst5-painel .avst-card')].filter((x) => !x.className.includes('avst-card-ativo') && !x.className.includes('avst-card-bloqueado') && !x.className.includes('avst-card-nenhum'));
  cs[n]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, indice);

// muda o cabelo (comando 1)
await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Cabelo'))?.click(); });
await p.waitForTimeout(600);
await equipar(0);
await p.waitForTimeout(500);
const lookPreset = await svgPalco();

// §136/§199: salva o look atual como preset
await p.locator('.avst5-abas button', { hasText: 'Presets' }).click();
await p.waitForTimeout(400);
await p.locator('.avst5-presets-salvar input').fill('Look de Teste');
await p.locator('.avst5-presets-salvar button').click();
await p.waitForTimeout(400);
ok(await p.locator('[data-teste="preset"]').count() === 1, 'preset salvo não apareceu na biblioteca');
ok((await p.locator('.avst5-preset-info strong').textContent()) === 'Look de Teste', 'nome do preset errado');

// muda MAIS o avatar (comando 2), depois aplica o preset → volta ao look salvo
await p.locator('.avst5-abas button', { hasText: 'Todos' }).click();
await p.waitForTimeout(400);
await equipar(1);
await p.waitForTimeout(500);
ok((await svgPalco()) !== lookPreset, 'segunda troca não mudou o palco');
await p.locator('.avst5-abas button', { hasText: 'Presets' }).click();
await p.waitForTimeout(400);
await p.locator('.avst5-preset-corpo').click();
await p.waitForTimeout(500);
ok((await svgPalco()) === lookPreset, 'aplicar preset não restaurou o look salvo');

// §138: histórico da sessão lista as ações; "Início da sessão" desfaz tudo
await p.locator('.avst5-abas button', { hasText: 'Equipados' }).click();
await p.waitForTimeout(400);
const nEntradas = await p.locator('.avst5-hist-lista li').count();
ok(nEntradas >= 4, `histórico deveria ter início + 3 ações (tem ${nEntradas})`);
await p.locator('.avst5-hist-lista li button').first().click(); // Início da sessão
await p.waitForTimeout(500);
ok((await p.locator('.avst5-salvar').textContent())?.includes('Tudo salvo'), 'voltar ao início não zerou as mudanças');
// pular direto para a última entrada (refaz em lote)
await p.locator('.avst5-hist-lista li button').last().click();
await p.waitForTimeout(500);
ok((await svgPalco()) === lookPreset, 'refazer pela timeline não voltou ao look');
await p.screenshot({ path: `${SAIDA}/f4-presets-historico.png` });

// §139: autosave persistiu; reload SEM salvar → faixa de recuperação
await p.waitForTimeout(1200); // debounce de 800ms do autosave
await p.reload();
await p.waitForTimeout(1500);
ok(await p.locator('[data-teste="rascunho"]').count() === 1, 'faixa de rascunho não apareceu após reload');
const antesContinuar = await svgPalco();
await p.locator('[data-teste="rascunho"] button', { hasText: 'Continuar' }).click();
await p.waitForTimeout(600);
ok((await svgPalco()) !== antesContinuar, 'Continuar não aplicou o rascunho');
ok((await p.locator('.avst5-salvar').textContent())?.includes('alteraç'), 'rascunho aplicado deveria marcar alterações');
await p.screenshot({ path: `${SAIDA}/f4-rascunho.png` });

// Descartar: reload de novo → faixa volta (rascunho segue lá) → descartar some
await p.reload();
await p.waitForTimeout(1500);
if (await p.locator('[data-teste="rascunho"]').count()) {
  await p.locator('[data-teste="rascunho"] button', { hasText: 'Descartar' }).click();
  await p.waitForTimeout(400);
  ok(await p.locator('[data-teste="rascunho"]').count() === 0, 'Descartar não fechou a faixa');
  await p.reload();
  await p.waitForTimeout(1500);
  ok(await p.locator('[data-teste="rascunho"]').count() === 0, 'rascunho descartado voltou após reload');
}

const ok_ = relatorio('shell-f4', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
