// testes/lotes-gigantes.mjs — lotes 71–90 e 91–110: personalidade §117,
// luz de edição §132, emotes §120, busca com operadores §57+, economia
// §225, wide lado/transparente §350/§372, código do look §373, poses 3D
// §442, tinta §419, galeria de capturas, morfologia §108–111.
// @version 1.0.0  @created 2026-08-04
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 }, webgl: true,
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': true }));
  },
});
await irParaHarness(p, 'avst-harness.html', 1000);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };
const svgPalco = () => p.evaluate(() => document.querySelector('.avst5-palco svg')?.outerHTML ?? '');

// R1 (mega 71): personalidade pela paleta — olhos+boca mudam JUNTOS
await p.keyboard.press('Control+k');
await p.waitForSelector('[data-teste="paleta-comandos"]', { timeout: 5000 });
await p.locator('[data-teste="paleta-comandos"] input').fill('personalidade confiante');
await p.waitForTimeout(300);
await p.keyboard.press('Enter');
await p.waitForTimeout(600);
const confiante = await svgPalco();
ok(confiante.length > 500, 'palco sumiu após personalidade');
// desfazer prova que virou COMANDO único
await p.keyboard.press('Control+z');
await p.waitForTimeout(400);
ok(await svgPalco() !== confiante, 'personalidade não entrou como comando (undo)');
await p.keyboard.press('Control+Shift+z');
await p.waitForTimeout(400);

// R2 (mega 75): luz de EDIÇÃO fiel — luz quente escolhida, edição continua neutra
await p.locator('[data-teste="luzes-2d"] button', { hasText: 'Quente' }).click();
await p.waitForTimeout(200);
ok(await p.locator('.avst5-viewport[data-luz="neutra"]').count() === 1,
  'edição deveria FORÇAR luz neutra (§132)');
await p.evaluate(() => { [...document.querySelectorAll('button')].find((x) => x.title?.includes('Studio'))?.click(); });
await p.waitForTimeout(500);
ok(await p.locator('.avst5-viewport[data-luz="quente"]').count() === 1,
  'studio deveria aplicar a luz escolhida');

// R3 (mega 76): emote — expressão muda por ~2s e VOLTA sozinha
const antesEmote = await svgPalco();
await p.locator('[data-teste="emotes"] button').first().click();
await p.waitForTimeout(500);
ok(await svgPalco() !== antesEmote, 'emote não mudou a expressão');
await p.waitForTimeout(2200);
ok(await svgPalco() === antesEmote, 'emote não voltou sozinho (preview §608)');
await p.keyboard.press('Escape');
await p.waitForTimeout(400);

// R4 (megas 72–74): MORFOLOGIA — params de olhos aparecem no painel
// Propriedades e a escala entra no SVG (wrapper translate(120 108))
await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Olhos'))?.click(); });
await p.waitForTimeout(600);
const abriuProps = await p.evaluate(() => {
  const btn = [...document.querySelectorAll('.avst5-painel-btn')].find((x) => x.title?.includes('Propriedades') || x.title?.includes('propriedades'));
  btn?.click();
  return Boolean(btn);
});
if (abriuProps) {
  await p.waitForTimeout(500);
  const temSlider = await p.evaluate(() => {
    const painel = document.querySelector('.avst5-props, [data-teste="propriedades"]');
    return Boolean(painel && [...painel.querySelectorAll('label, span')].some((x) => x.textContent.includes('Tamanho')));
  });
  ok(temSlider, 'slider Tamanho dos olhos §109 ausente nas Propriedades');
} else {
  ok(false, 'botão de Propriedades não encontrado p/ morfologia');
}

// R5 (mega 95): busca com OPERADOR raridade:
await p.evaluate(() => {
  const busca = document.querySelector('.avst-busca input');
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(busca, 'raridade:epico');
  busca.dispatchEvent(new Event('input', { bubbles: true }));
});
await p.waitForTimeout(500);
const nEpicos = await p.locator('.avst-grade .avst-card:not(.avst-card-nenhum)').count();
ok(nEpicos >= 1, 'operador raridade:epico não devolveu itens');
await p.evaluate(() => {
  const busca = document.querySelector('.avst-busca input');
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(busca, '');
  busca.dispatchEvent(new Event('input', { bubbles: true }));
});

// R6 (megas 92–94): DetalheAsset com economia/desbloqueio
await p.waitForTimeout(400);
await p.evaluate(() => {
  const card = document.querySelector('.avst-grade .avst-card:not(.avst-card-nenhum)');
  const detalhes = card?.querySelector('[title*="etalhes"], [aria-label*="etalhes"]');
  (detalhes ?? card)?.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));
  detalhes?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await p.waitForTimeout(700);
if (await p.locator('[data-teste="drawer-detalhe"]').count() === 1) {
  ok(await p.locator('[data-teste="det-economia"]').count() === 1, 'linha de economia §225 ausente no detalhe');
  await p.locator('[data-teste="drawer-detalhe"] button[title="Fechar"]').click();
  await p.waitForSelector('[data-teste="drawer-detalhe"]', { state: 'detached', timeout: 4000 });
} else {
  ok(false, 'não consegui abrir o DetalheAsset p/ economia');
}

// R7 (mega 97): CÓDIGO DO LOOK — copiar (fallback mostra) e aplicar
await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Base'))?.click(); });
await p.locator('.avst5-abas button', { hasText: 'Presets' }).click();
await p.waitForSelector('[data-teste="look-copiar"]', { timeout: 5000 });
const codigo = await p.evaluate(async () => {
  let pego = null;
  const original = navigator.clipboard?.writeText?.bind(navigator.clipboard);
  if (navigator.clipboard) navigator.clipboard.writeText = (t) => { pego = t; return Promise.resolve(); };
  document.querySelector('[data-teste="look-copiar"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 400));
  if (navigator.clipboard && original) navigator.clipboard.writeText = original;
  return pego;
});
ok(typeof codigo === 'string' && codigo.startsWith('DSHOW-'), `código do look inválido (${String(codigo).slice(0, 20)})`);
await p.locator('[data-teste="look-entrada"]').fill(codigo);
await p.locator('[data-teste="look-entrada"]').press('Enter');
await p.waitForFunction(() => document.querySelector('[data-teste="backup-aviso"]')?.textContent?.includes('aplicado'), { timeout: 4000 })
  .catch(() => falhas.push('código do look não aplicou'));
await p.locator('[data-teste="look-entrada"]').fill('DSHOW-lixo!!!');
await p.locator('[data-teste="look-entrada"]').press('Enter');
await p.waitForFunction(() => document.querySelector('[data-teste="backup-aviso"]')?.textContent?.includes('inválido'), { timeout: 4000 })
  .catch(() => falhas.push('código lixo deveria ser recusado'));

// R8 (megas 96+103): Foto wide — lado do medalhão e fundo transparente
await p.evaluate(() => { [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Modo clássico')?.click(); });
await p.waitForSelector('.avst-shell', { timeout: 10000 });
await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Foto')?.click(); });
await p.waitForTimeout(500);
await p.evaluate(async () => {
  const c = document.createElement('canvas'); c.width = 480; c.height = 480;
  const g = c.getContext('2d'); g.fillStyle = '#3a7ce0'; g.fillRect(0, 0, 480, 480);
  const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
  const input = document.querySelector('input[type="file"]');
  const dt = new DataTransfer(); dt.items.add(new File([blob], 's.png', { type: 'image/png' }));
  input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
});
await p.waitForSelector('.avst-foto-acoes', { timeout: 10000 });
await p.evaluate(() => { [...document.querySelectorAll('.avst-foto-acoes button')].find((x) => x.textContent.includes('Estilizar'))?.click(); });
await p.waitForSelector('[data-teste="formatos-foto"]', { timeout: 10000 });
await p.locator('[data-teste="formatos-foto"] button', { hasText: 'Header' }).click();
await p.waitForSelector('[data-teste="opcoes-wide"]', { timeout: 4000 });
const svgEsq = await p.evaluate(() => document.querySelector('.avst-ft-preview svg')?.outerHTML ?? '');
await p.locator('[data-teste="foto-lado-direita"]').click();
await p.waitForTimeout(400);
const svgDir = await p.evaluate(() => document.querySelector('.avst-ft-preview svg')?.outerHTML ?? '');
ok(svgDir !== svgEsq && svgDir.includes('translate(480 0)'), 'medalhão à direita §350 não deslocou (720-240=480)');
await p.locator('[data-teste="foto-wide-transp"]').click();
await p.waitForTimeout(400);
const svgTransp = await p.evaluate(() => document.querySelector('.avst-ft-preview svg')?.outerHTML ?? '');
ok(!svgTransp.includes('fill="#0a0d15"/>' ) || !svgTransp.includes(`<rect width="720"`),
  'wide transparente §372 manteve o retângulo de base');
await p.screenshot({ path: `${SAIDA}/foto-wide-direita.png` });

// R9 (megas 80+81+101+102): palco 3D — tinta, pose salva, galeria, marca
await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.includes('Estúdio 5.0') || x.textContent.includes('Estúdio'))?.click(); });
await p.waitForTimeout(800);
// volta ao shell novo (o botão pode estar no clássico como "Estúdio 5.0")
if (await p.locator('[data-teste="botao-3d"]').count() === 0) {
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__pronto === true, { timeout: 20000 });
  await p.waitForTimeout(800);
}
// §139: o autosave da sessão pode oferecer o rascunho — descarta p/ o teste
if (await p.locator('[data-teste="rascunho"]').count() === 1) {
  await p.locator('[data-teste="rascunho"] button', { hasText: 'Descartar' }).click();
  await p.waitForTimeout(300);
}
await p.locator('[data-teste="botao-3d"]').click();
await p.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 30000 });
await p.waitForTimeout(4000);
// tinta liga/desliga (mega 81)
await p.locator('[data-teste="p3d-tinta"]').click();
ok(await p.locator('[data-teste="p3d-tinta"][aria-pressed="true"]').count() === 1, 'toggle de tinta §419 não ligou');
await p.locator('[data-teste="p3d-tinta"]').click();
// pose: congela, scrub, salva, chip aparece, aplica (megas 44/80)
await p.locator('[data-teste="p3d-pose"]').click();
await p.waitForSelector('[data-teste="p3d-pose-salvar"]', { timeout: 4000 });
await p.locator('[data-teste="p3d-quadro-frente"]').click();
await p.locator('[data-teste="p3d-pose-salvar"]').click();
await p.waitForTimeout(400);
ok(await p.locator('[data-teste="p3d-poses"] .avst5-p3d-cena').count() === 1, 'pose salva §443 não virou chip');
await p.locator('[data-teste="p3d-pose"]').click(); // retoma
await p.waitForTimeout(300);
await p.locator('[data-teste="p3d-poses"] .avst5-p3d-cena button').first().click();
await p.waitForTimeout(500);
ok(await p.locator('[data-teste="p3d-congelado"]').count() === 1, 'aplicar pose deveria congelar no tempo salvo');
await p.locator('[data-teste="p3d-pose"]').click(); // retoma de novo
// marca custom (mega 102) + captura → galeria local (mega 101)
await p.locator('[data-teste="p3d-ajuste"]').click();
await p.waitForSelector('[data-teste="p3d-marca-texto"]', { timeout: 3000 });
await p.locator('[data-teste="p3d-marca-texto"]').fill('JHONY');
await p.evaluate(async () => {
  const original = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () { /* engole o download */ };
  document.querySelector('[data-teste="p3d-capturar"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 3000));
  HTMLAnchorElement.prototype.click = original;
});
await p.waitForSelector('[data-teste="p3d-capturas"]', { timeout: 6000 });
ok(await p.locator('[data-teste="p3d-capturas"] img').count() >= 1, 'galeria local de capturas vazia (mega 101)');
const marcaPersistiu = await p.evaluate(() => localStorage.getItem('dshow.avst5.p3d.marca.v1'));
ok(marcaPersistiu === 'JHONY', `texto da marca não persistiu (${marcaPersistiu})`);
await p.screenshot({ path: `${SAIDA}/lotes-palco3d.png` });

const ok_ = relatorio('lotes-gigantes', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
