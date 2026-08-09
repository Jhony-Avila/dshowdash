// testes/programa-160.mjs — PROGRAMA 111–160 (5 mega lotes de 2026-08-04):
// A) Photo Studio: forma do medalhão §341, filtro de cor §333, legenda §344,
//    zoom §340 e byte-estabilidade do neutro (fotos salvas intactas);
// B) Consultor de estilo §232–§240 (regras, porquê, aplicar = comando);
// C) Versões §619 (drawer lê o espelho SEM flag — lote 141);
// D) Props 3D §426–§431 (acessório 2D → prop aproximada no palco 3D).
// @version 1.0.0  @created 2026-08-04
import { BASE, SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({ viewport: { width: 1500, height: 940 }, webgl: true });
await irParaHarness(p, 'avst-harness.html', 800);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };
const range = (pagina, teste, valor) => pagina.locator(`[data-teste="${teste}"]`).evaluate((el, v) => {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(el, v);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}, valor);

// ── A) FOTO (clássico): entra no Estilizar com uma foto sintética ──
await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Foto')?.click(); });
await p.waitForTimeout(600);
await p.evaluate(async () => {
  const c = document.createElement('canvas');
  c.width = 480; c.height = 480;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 480, 480);
  grad.addColorStop(0, '#39d98a'); grad.addColorStop(1, '#7c5cff');
  g.fillStyle = grad; g.fillRect(0, 0, 480, 480);
  const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
  const arquivo = new File([blob], 'p160.png', { type: 'image/png' });
  const input = document.querySelector('.avst-foto-origens input[type="file"], input[type="file"]');
  const dt = new DataTransfer();
  dt.items.add(arquivo);
  input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
});
await p.waitForSelector('.avst-foto-acoes', { timeout: 10000 });
await p.evaluate(() => {
  [...document.querySelectorAll('.avst-foto-acoes button')].find((x) => x.textContent.includes('Estilizar'))?.click();
});
await p.waitForSelector('[data-teste="ajustes-foto"]', { timeout: 10000 });

const svgDe = () => p.evaluate(() => document.querySelector('.avst-ft-preview svg')?.outerHTML ?? '');
const antes = await svgDe();
ok(antes.length > 1000, 'preview estilizado vazio');
ok(!antes.includes('<polygon'), 'neutro deveria ser o círculo legado (sem polygon)');

// forma §341: Hexágono clipa o medalhão com <polygon>
await p.locator('[data-teste="formas-medalhao"] button', { hasText: 'Hexágono' }).click();
await p.waitForTimeout(300);
const comForma = await svgDe();
ok(comForma.includes('<polygon points='), 'forma Hexágono não virou <polygon> no SVG (§341)');

// filtro de cor §333: P&B = feColorMatrix saturate 0
await p.locator('[data-teste="filtros-cor"] button', { hasText: 'P&B' }).click();
await p.waitForTimeout(300);
ok((await svgDe()).includes('type="saturate" values="0"'), 'filtro P&B sem saturate 0 (§333)');

// zoom §340: novo slider mexe no preview
await range(p, 'ajuste-zoomFoto', '1.3');
await p.waitForTimeout(300);
const comZoom = await svgDe();
ok(comZoom !== comForma && comZoom.includes('scale(1.3'), 'zoom da foto não entrou na composição (§340)');

// legenda §344: texto sanitizado aparece como <text>
await p.locator('[data-teste="legenda-foto"]').evaluate((el) => {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(el, 'Feito na Dshow');
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
await p.waitForTimeout(300);
const comLegenda = await svgDe();
ok(comLegenda.includes('<text') && comLegenda.includes('Feito na Dshow'), 'legenda §344 não entrou no SVG');
await p.screenshot({ path: `${SAIDA}/p160-foto.png` });

// byte-estabilidade: limpar legenda + Zerar ajustes = SVG byte-idêntico
await p.locator('[data-teste="legenda-foto"]').evaluate((el) => {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(el, '');
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
await p.locator('[data-teste="ajuste-zerar"]').click();
await p.waitForTimeout(300);
ok(await svgDe() === antes, 'neutro omitido quebrou: Zerar+sem legenda deveria voltar byte-idêntico');

// ── B) CONSULTOR §232–§240 (shell, flag as5.consultor ON por padrão) ──
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

ok(await pB.locator('[data-teste="consultor-abrir"]').count() === 1, 'botão do consultor ausente (as5.consultor padrão ON)');
await pB.locator('[data-teste="consultor-abrir"]').click();
await pB.waitForSelector('[data-teste="consultor"]', { timeout: 5000 });
const nCards = await pB.locator('[data-teste="cons-sugestao"]').count();
ok(nCards >= 1, 'consultor sem sugestões p/ o avatar padrão (motor §232)');
const porques = await pB.evaluate(() => [...document.querySelectorAll('[data-teste="cons-porque"]')].map((x) => x.textContent.trim()));
ok(porques.length === nCards && porques.every((t) => t.length >= 8), '§238: todo card precisa explicar o PORQUÊ');
await pB.screenshot({ path: `${SAIDA}/p160-consultor.png` });
// aplicar a 1ª sugestão = COMANDO (habilita o desfazer)
await pB.evaluate(() => document.querySelector('[data-teste="cons-aplicar"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
await pB.waitForTimeout(500);
await pB.locator('[data-teste="consultor"] header button[title="Fechar"]').click(); // lição: X, não Esc
await pB.waitForTimeout(300);
ok(await pB.locator('[data-teste="consultor"]').count() === 0, 'X não fechou o consultor');
const undoB = pB.locator('button[title^="Desfazer"]');
ok(!(await undoB.isDisabled()), 'aplicar sugestão deveria virar comando (undo habilitado)');
ok((await pB.locator('.avst5-salvar').textContent())?.includes('alteraç'), 'sugestão aplicada deveria virar alteração pendente');
await undoB.click();
await pB.waitForTimeout(400);
ok(await undoB.isDisabled(), 'desfazer deveria esvaziar o histórico (volta ao base)');
ok(!(await pB.locator('button[title="Refazer"]').isDisabled()), 'refazer deveria acender após o undo');

// ── C) VERSÕES §619 (lote 141: leitura do drawer SEM flag as5.estado_api) ──
await pB.locator('[data-teste="versoes-abrir"]').click();
await pB.waitForSelector('[data-teste="versoes-619"]', { timeout: 5000 });
await pB.waitForSelector('[data-teste="versoes-consistencia"]', { timeout: 5000 });
ok(await pB.locator('[data-teste="versoes-indisponivel"]').count() === 0, 'espelho mockado não deveria cair no indisponível');
ok(((await pB.locator('[data-teste="versoes-consistencia"]').textContent()) ?? '').includes('§629'), 'nota de consistência §629 ausente');
ok(await pB.locator('[data-teste="versoes-lista"]').count() === 1, 'timeline de versões ausente');
ok(await pB.evaluate(() => (window.__ch619 ?? []).some((c) => c.m === 'GET')),
  'drawer deveria LER o espelho mesmo com as5.estado_api OFF (lote 141)');
await pB.screenshot({ path: `${SAIDA}/p160-versoes.png` });
await ctxB.close();

// ── D) PROPS 3D §426–§431: acessório de rosto vira prop aproximada ──
const ctxD = await b.newContext({ viewport: { width: 1500, height: 940 } });
await ctxD.addInitScript(() => {
  localStorage.setItem('dshow.avst5.tour.v1', 'feito');
  localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': true }));
});
const pD = await ctxD.newPage();
pD.on('pageerror', (e) => erros.push(e.message.slice(0, 160)));
await pD.goto(`${BASE}/avst-harness.html`, { waitUntil: 'networkidle' });
await pD.waitForFunction(() => window.__pronto === true, { timeout: 20000 });
await pD.waitForTimeout(1000);
// equipa um acessório de ROSTO (→ prop "oculos") ANTES de ligar o 3D
await pD.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Acessório'))?.click(); });
await pD.waitForTimeout(600);
await pD.locator('.avst5-chip', { hasText: 'Rosto' }).click();
await pD.waitForTimeout(400);
await pD.evaluate(() => {
  const c = [...document.querySelectorAll('.avst5-painel .avst-card')]
    .find((x) => !x.className.includes('avst-card-ativo') && !x.className.includes('avst-card-bloqueado') && !x.className.includes('avst-card-nenhum'));
  c?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await pD.waitForTimeout(500);
await pD.locator('[data-teste="botao-3d"]').click();
await pD.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 30000 });
await pD.waitForFunction(() => {
  const n = document.querySelector('[data-teste="p3d-pendencias"]');
  return !!n && /aproximado\(s\) no 3D/.test(n.textContent ?? '');
}, { timeout: 30000 }).catch(() => falhas.push('nota "aproximado(s) no 3D" §426 nunca apareceu'));
await pD.waitForTimeout(2500); // SwiftShader pinta com calma
const pintou = await pD.evaluate(() => {
  const c = document.querySelector('[data-teste="palco-3d"] canvas');
  return c ? c.toDataURL('image/png').length : 0;
});
ok(pintou > 2000, `canvas 3D com prop não pintou (${pintou} bytes)`);
await pD.screenshot({ path: `${SAIDA}/p160-props3d.png` });
await ctxD.close();

const ok_ = relatorio('programa-160', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
