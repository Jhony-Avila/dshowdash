// testes/palco-apresentacao.mjs — lote 60–69: cenários §160, hora §162,
// luz §164, poder §153–155, cenas de apresentação §180/§185 (shell) +
// página de coleção §207–214, filtros de conquista §218 e comparação de
// presets §231.
// @version 1.0.0  @created 2026-08-04
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true }));
  },
});
await irParaHarness(p, 'avst-harness.html', 1000);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// R1 (megas 60–62): cenários/hora/luz refletem em data-attrs do viewport
ok(await p.locator('[data-teste="cenarios-2d"] button').count() === 6, 'esperava 6 cenários (§160)');
await p.locator('[data-teste="cenarios-2d"] button', { hasText: 'Dojo' }).click();
await p.locator('[data-teste="horas-2d"] button', { hasText: 'Noite' }).click();
await p.locator('[data-teste="luzes-2d"] button', { hasText: 'Dramática' }).click();
await p.waitForTimeout(300);
ok(await p.locator('.avst5-viewport[data-fundo="dojo"][data-hora="noite"][data-luz="dramatica"]').count() === 1,
  'cenário/hora/luz não refletiram no viewport');
await p.screenshot({ path: `${SAIDA}/palco-dojo-noite.png` });
// persistência das escolhas
const persistiu = await p.evaluate(() => [
  localStorage.getItem('dshow.avst5.palco.hora.v1'),
  localStorage.getItem('dshow.avst5.palco.luz.v1'),
].join(','));
ok(persistiu === 'noite,dramatica', `hora/luz não persistiram (${persistiu})`);

// R2 (mega 63): poder — equipa uma AURA pela paleta e ATIVA no studio
await p.keyboard.press('Control+k');
await p.waitForSelector('[data-teste="paleta-comandos"]', { timeout: 5000 });
await p.locator('[data-teste="paleta-comandos"] input').fill('aura neon');
await p.waitForTimeout(400);
await p.keyboard.press('Enter'); // equipa o primeiro resultado
await p.waitForTimeout(600);
await p.evaluate(() => {
  [...document.querySelectorAll('button')].find((x) => x.title?.includes('Studio'))?.click();
});
await p.waitForTimeout(600);
ok(await p.locator('[data-teste="ativar-poder"]').count() === 1, 'botão Ativar poder ausente no studio');
const desabilitado = await p.locator('[data-teste="ativar-poder"]').isDisabled();
ok(!desabilitado, 'com aura equipada o poder deveria estar habilitado');
await p.locator('[data-teste="ativar-poder"]').click();
await p.waitForSelector('[data-teste="poder-ativo"]', { timeout: 3000 });
ok(await p.locator('[data-teste="poder-ativo"] svg').count() >= 1, 'overlay do poder sem SVG');
await p.screenshot({ path: `${SAIDA}/palco-poder.png` });
await p.waitForSelector('[data-teste="poder-ativo"]', { state: 'detached', timeout: 6000 });

// R3 (megas 65+66): cena de apresentação salva/aplica; última volta
await p.locator('[data-teste="apresentacao-salvar"]').click();
await p.waitForTimeout(300);
ok(await p.locator('[data-teste="apresentacoes"] .avst5-apresenta-item').count() === 1, 'cena não foi salva (§180)');
// capturar registra a apresentação (§185) — intercepta o download
await p.evaluate(async () => {
  const original = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () { /* ignora o PNG */ };
  [...document.querySelectorAll('button')].find((x) => x.textContent.includes('Capturar'))?.click();
  await new Promise((r) => setTimeout(r, 1500));
  HTMLAnchorElement.prototype.click = original;
});
const ultima = await p.evaluate(() => localStorage.getItem('dshow.avst5.apresentacao.ultima.v1') ?? '');
ok(ultima.includes('dojo'), `última apresentação não registrada (§185): ${ultima}`);
// muda o cenário → chip "última" aparece e VOLTA ao registrado
await p.keyboard.press('Escape'); // sai do studio
await p.waitForTimeout(400);
await p.locator('[data-teste="cenarios-2d"] button', { hasText: 'Neon' }).click();
await p.evaluate(() => {
  [...document.querySelectorAll('button')].find((x) => x.title?.includes('Studio'))?.click();
});
await p.waitForTimeout(500);
await p.waitForSelector('[data-teste="apresentacao-ultima"]', { timeout: 4000 });
await p.locator('[data-teste="apresentacao-ultima"]').click();
await p.waitForTimeout(300);
ok(await p.locator('.avst5-viewport[data-fundo="dojo"]').count() === 1, 'chip última não restaurou o cenário');
await p.keyboard.press('Escape');
await p.waitForTimeout(400);

// R5 (mega 69) PRIMEIRO — ainda no shell: comparação de presets
await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Base'))?.click(); });
await p.locator('.avst5-abas button', { hasText: 'Presets' }).click();
await p.waitForTimeout(500);
await p.locator('.avst5-presets-salvar input').fill('Cmp A');
await p.locator('.avst5-presets-salvar button').click();
await p.waitForTimeout(400);
await p.keyboard.press('Control+k');
await p.waitForSelector('[data-teste="paleta-comandos"]', { timeout: 5000 });
await p.locator('[data-teste="paleta-comandos"] input').fill('randomizar');
await p.waitForTimeout(300);
await p.keyboard.press('Enter');
await p.waitForTimeout(700);
await p.locator('.avst5-presets-salvar input').fill('Cmp B');
await p.locator('.avst5-presets-salvar button').click();
await p.waitForTimeout(400);
const botoes = p.locator('[data-teste="preset-comparar"]');
await botoes.nth(0).click();
await botoes.nth(1).click();
await p.waitForSelector('[data-teste="presets-comparar"]', { timeout: 4000 });
ok(await p.locator('[data-teste="presets-comparar"] figure').count() === 2, 'comparação sem os 2 lados');
ok((await p.locator('[data-teste="presets-difs"] li').count()) >= 1, 'comparação sem diferenças listadas');
await p.screenshot({ path: `${SAIDA}/presets-comparar.png` });

// R4 (mega 67): coleções vivem no CLÁSSICO — troca de modo primeiro
await p.evaluate(() => { [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Modo clássico')?.click(); });
await p.waitForSelector('.avst-shell', { timeout: 10000 });
await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.includes('Coleç'))?.click(); });
await p.waitForTimeout(800);
await p.locator('[data-teste="col-abrir"]').first().click();
await p.waitForSelector('[data-teste="col-pagina"]', { timeout: 5000 });
ok(await p.locator('[data-teste="col-lore"]').count() === 1, 'lore §210 ausente na página da coleção');
ok((await p.locator('[data-teste="col-itens"] li').count()) >= 5, 'checklist de itens §208 vazia');
ok(await p.locator('[data-teste="col-recompensa"]').count() === 1, 'linha de recompensa §213 ausente');
await p.screenshot({ path: `${SAIDA}/colecao-pagina.png` });
await p.locator('[data-teste="col-voltar"]').click();
await p.waitForTimeout(400);
ok(await p.locator('[data-teste="col-pagina"]').count() === 0, 'voltar não fechou a página da coleção');

// R6 (mega 68): conquistas (clássico) — filtros presentes (vazio-tolerante)
await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.includes('Conquistas'))?.click(); });
await p.waitForTimeout(900);
const temFiltro = await p.locator('[data-teste="conq-filtros"]').count();
const semVida = await p.locator('.avst-vazio, [data-teste="esqueleto-conquistas"]').count();
ok(temFiltro === 1 || semVida >= 1, 'conquistas sem filtros §218 (e sem estado de carga válido)');

const ok_ = relatorio('palco-apresentacao', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
