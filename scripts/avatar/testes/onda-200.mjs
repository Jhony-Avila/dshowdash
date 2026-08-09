// testes/onda-200.mjs — ONDA 161–200 (4 mega lotes de 2026-08-05):
// A) Photo camadas PRO §338–§343 (painel/blend/luz/tipografia/subtítulo/
//    dicas §349 com aplicar); B) apresentação §180/§185 (renomear preset,
//    histórico restaurar); C) evolução §241–§246 (marco no salvar, memória);
// D) missões §250/§251 (desafio da semana, memorialista conclui via §246).
// @version 1.0.0  @created 2026-08-05
import { BASE, SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({ viewport: { width: 1500, height: 940 } });
await irParaHarness(p, 'avst-harness.html', 800);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── A) FOTO (clássico): entra no Estilizar com foto sintética ──
await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Foto')?.click(); });
await p.waitForTimeout(600);
await p.evaluate(async () => {
  const c = document.createElement('canvas');
  c.width = 480; c.height = 480;
  const g = c.getContext('2d');
  g.fillStyle = '#7c5cff'; g.fillRect(0, 0, 480, 480);
  const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
  const dt = new DataTransfer();
  dt.items.add(new File([blob], 'onda.png', { type: 'image/png' }));
  const input = document.querySelector('input[type="file"]');
  input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
});
await p.waitForSelector('.avst-foto-acoes', { timeout: 10000 });
await p.evaluate(() => {
  [...document.querySelectorAll('.avst-foto-acoes button')].find((x) => x.textContent.includes('Estilizar'))?.click();
});
await p.waitForSelector('[data-teste="ajustes-foto"]', { timeout: 10000 });
const svgDe = () => p.evaluate(() => document.querySelector('.avst-ft-preview svg')?.outerHTML ?? '');

// equipa um FUNDO para o painel de camadas ter conteúdo
await p.evaluate(() => {
  const grupo = [...document.querySelectorAll('.avst-ft-grupo')].find((x) => x.querySelector('.avst-ft-rotulo')?.textContent.trim().startsWith('Fundo')); // lote 221: o canvas PRO também diz 'Fundo' nos controles — mirar o RÓTULO
  [...(grupo?.querySelectorAll('.avst-ft-chip') ?? [])][1]?.click();
});
await p.waitForTimeout(400);
const comFundo = await svgDe();
await p.waitForSelector('[data-teste="camadas-foto"]', { timeout: 5000 });
ok(await p.locator('[data-teste="cf-fundo"]').count() === 1, 'painel §338 sem a linha do fundo equipado');

// ocultar §338 → muda; reexibir → byte-idêntico
await p.locator('[data-teste="cf-olho-fundo"]').click();
await p.waitForTimeout(300);
ok(await svgDe() !== comFundo, 'ocultar camada não mudou o SVG (§338)');
await p.locator('[data-teste="cf-olho-fundo"]').click();
await p.waitForTimeout(300);
ok(await svgDe() === comFundo, 'reexibir deveria voltar byte-idêntico (neutro omitido)');

// blend §342
await p.locator('[data-teste="cf-blend-fundo"]').selectOption('multiply');
await p.waitForTimeout(300);
ok((await svgDe()).includes('mix-blend-mode:multiply'), 'blend multiply §342 não entrou no SVG');
await p.locator('[data-teste="cf-blend-fundo"]').selectOption('normal');

// luz local §334
await p.locator('[data-teste="luz-local"] button', { hasText: 'Radial' }).click();
await p.waitForTimeout(300);
ok((await svgDe()).includes('luz'), 'luz local radial §334 ausente do SVG');
await p.locator('[data-teste="luz-local"] button', { hasText: 'Sem luz' }).click();

// tipografia §343: legenda + mono + caixa alta
await p.locator('[data-teste="legenda-foto"]').evaluate((el) => {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(el, 'Dshow');
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
await p.waitForTimeout(300);
await p.waitForSelector('[data-teste="tipografia-foto"]', { timeout: 4000 });
await p.locator('[data-teste="tf-fonte-mono"]').click();
await p.locator('[data-teste="tf-caixa"]').click();
await p.waitForTimeout(300);
const comTipo = await svgDe();
ok(comTipo.includes('ui-monospace') && comTipo.includes('DSHOW'), 'tipografia §343 (mono + caixa alta) não aplicou');

// dica §349: legenda LONGA no 1:1 → sugerir Header; Aplicar troca o formato
await p.locator('[data-teste="legenda-foto"]').evaluate((el) => {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(el, 'Uma legenda bem comprida para o quadrado');
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
await p.waitForTimeout(400);
await p.waitForSelector('[data-teste="dicas-foto"]', { timeout: 4000 });
await p.evaluate(() => document.querySelector('[data-teste="dica-aplicar"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
await p.waitForTimeout(500);
ok(await p.locator('[data-teste="formatos-foto"] [aria-checked="true"]', { hasText: 'Header' }).count() === 1,
  'dica §349 aplicada deveria trocar o formato p/ Header');

// subtítulo §343.1 no wide
await p.locator('[data-teste="subtitulo-foto"]').evaluate((el) => {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(el, 'CEO da Dshow');
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
await p.waitForTimeout(400);
// caixa alta segue LIGADA do teste anterior → o subtítulo sai maiúsculo
ok((await svgDe()).includes('CEO DA DSHOW'), 'subtítulo §343.1 não entrou no wide');
await p.screenshot({ path: `${SAIDA}/onda200-foto.png` });

// ── B) SHELL: histórico §185 + renomear preset §180 ──
const ctxB = await b.newContext({ viewport: { width: 1500, height: 940 } });
await ctxB.addInitScript(() => {
  localStorage.setItem('dshow.avst5.tour.v1', 'feito');
  localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false }));
});
const pB = await ctxB.newPage();
pB.on('pageerror', (e) => erros.push(e.message.slice(0, 160)));
await pB.goto(`${BASE}/avst-harness.html`, { waitUntil: 'networkidle' });
await pB.waitForFunction(() => window.__pronto === true, { timeout: 20000 });
await pB.waitForTimeout(1000);

// histórico §185: 2 composições diferentes → restaurar volta o fundo
await pB.locator('[data-teste="cenarios-2d"] button', { hasText: 'Neon' }).click();
await pB.waitForTimeout(1000); // debounce 700ms grava a composição
await pB.locator('[data-teste="cenarios-2d"] button', { hasText: 'Dojo' }).click();
await pB.waitForTimeout(1000);
// a UI de cenas/histórico vive no modo STUDIO (lição do palco-apresentacao)
await pB.evaluate(() => {
  [...document.querySelectorAll('button')].find((x) => x.title?.includes('Studio'))?.click();
});
await pB.waitForTimeout(600);
await pB.waitForSelector('[data-teste="hist-palco"]', { timeout: 4000 });
await pB.locator('[data-teste="hist-restaurar"]').first().click();
await pB.waitForTimeout(500);
ok(await pB.locator('[data-teste="cenarios-2d"] [aria-checked="true"]', { hasText: 'Neon' }).count() === 1,
  'restaurar §185 não voltou ao cenário anterior');

// renomear preset §180 (duplo clique → input → Enter)
await pB.locator('[data-teste="apresentacao-salvar"]').click();
await pB.waitForTimeout(400);
await pB.locator('[data-teste="ap-aplicar"]').first().dblclick();
await pB.waitForSelector('[data-teste="ap-renomear-input"]', { timeout: 3000 });
await pB.locator('[data-teste="ap-renomear-input"]').fill('Palco A');
await pB.keyboard.press('Enter');
await pB.waitForTimeout(400);
ok(await pB.locator('[data-teste="ap-aplicar"]', { hasText: 'Palco A' }).count() === 1,
  'renomear preset §180 não persistiu');
// volta ao modo EDIÇÃO (toggle do Studio) p/ o catálogo reaparecer
await pB.evaluate(() => {
  [...document.querySelectorAll('button')].find((x) => x.title?.includes('Studio'))?.click();
});
await pB.waitForTimeout(500);

// ── C) EVOLUÇÃO §241–§246: salvar → marco → memória ──
await pB.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Cabelo'))?.click(); });
await pB.waitForTimeout(700);
await pB.evaluate(() => {
  const c = [...document.querySelectorAll('.avst5-painel .avst-card')]
    .find((x) => !x.className.includes('avst-card-ativo') && !x.className.includes('avst-card-bloqueado') && !x.className.includes('avst-card-nenhum'));
  c?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await pB.waitForTimeout(500);
await pB.locator('.avst5-salvar button', { hasText: /salvar/i }).first().click();
await pB.waitForTimeout(800);
await pB.locator('[data-teste="evolucao-abrir"]').click();
await pB.waitForSelector('[data-teste="evolucao"]', { timeout: 5000 });
ok(await pB.locator('[data-teste="evo-marco"]').count() >= 1, 'salvar não registrou marco §241');
await pB.locator('[data-teste="evo-nota"]').first().click();
await pB.waitForSelector('[data-teste="evo-nota-input"]', { timeout: 3000 });
await pB.locator('[data-teste="evo-nota-input"]').fill('Viagem Shenzhen');
await pB.keyboard.press('Enter');
await pB.waitForTimeout(400);
ok(await pB.locator('[data-teste="evo-nota"]', { hasText: 'Viagem Shenzhen' }).count() === 1,
  'memória §246 não persistiu no marco');
// comparar §242
await pB.locator('[data-teste="evo-abrir-comparar"]').first().click();
await pB.waitForSelector('[data-teste="evo-comparar"]', { timeout: 3000 });
ok(await pB.locator('[data-teste="evo-comparar"] img').count() === 2, 'antes/depois §242 sem os 2 lados');
await pB.screenshot({ path: `${SAIDA}/onda200-evolucao.png` });
await pB.locator('[data-teste="evolucao"] header button[title="Fechar"]').click(); // lição: X, não Esc
await pB.waitForTimeout(300);

// ── D) MISSÕES §250/§251: estrutura + memorialista concluída via §246 ──
await pB.locator('[data-teste="missoes-abrir"]').click();
await pB.waitForSelector('[data-teste="missoes"]', { timeout: 5000 });
ok(await pB.locator('[data-teste="desafio-semana"]').count() === 1, 'desafio da semana §251 ausente');
ok(await pB.locator('[data-teste="missao"]').count() === 7, 'esperava 7 missões §250');
ok(await pB.locator('[data-teste="missao"][data-feita="1"]').count() >= 1
  && (await pB.locator('[data-teste="missao"][data-feita="1"]').allTextContents()).join(' ').includes('memória'),
  'missão memorialista deveria concluir após a nota §246');
await pB.screenshot({ path: `${SAIDA}/onda200-missoes.png` });
await ctxB.close();

const ok_ = relatorio('onda-200', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
