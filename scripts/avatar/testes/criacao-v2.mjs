// testes/criacao-v2.mjs — ONDA 231–260, LOTE 251–260 (§102–§119 + §349/§361–§369).
//  A) SHELL/criação avançada: tipo corporal §102 e postura §118 viram
//     wrapper de transform no SVG (com undo), preset facial §105 aplica a
//     morfologia §108, idle 2D §119 liga via data-attr, emotes v2 §120;
//  B) FOTO: histórico VISUAL §361 (thumbs + saltar), renomear projeto
//     §364 v2, presets de exportação §369 e Compor pra mim §349
//     (determinístico: selo compacto no topo quando título+legenda).
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── A) SHELL ──
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': false }));
    },
  });
  await irParaHarness(p, 'avst-harness.html', 1000);
  const svgPalco = () => p.evaluate(() => document.querySelector('.avst5-zoom svg')?.outerHTML ?? '');

  // categoria Base → seção de criação avançada
  await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Base'))?.click(); });
  await p.waitForTimeout(500);
  ok(await p.locator('[data-teste="criacao-avancada"]').count() === 1, 'seção criação avançada ausente (flag as5.criacao_avancada?)');

  // §102 tipo corporal
  const antesCorpo = await svgPalco();
  ok(!antesCorpo.includes('scale(1.1 0.98)'), 'palco não deveria ter wrapper de corpo antes');
  await p.locator('[data-teste="corpo-robusto"]').click();
  await p.waitForTimeout(400);
  ok((await svgPalco()).includes('scale(1.1 0.98)'), 'tipo corporal ROBUSTO não entrou no SVG (§102)');
  // §118 postura (acumula com corpo)
  await p.locator('[data-teste="postura-confiante"]').click();
  await p.waitForTimeout(400);
  const comAmbos = await svgPalco();
  ok(comAmbos.includes('rotate(-2 120'), 'postura CONFIANTE não entrou no SVG (§118)');
  ok(comAmbos.includes('scale(1.1 0.98)'), 'postura não deveria derrubar o tipo corporal');
  // volta ao neutro = wrapper some (byte-estável)
  await p.locator('[data-teste="corpo-medio"]').click();
  await p.locator('[data-teste="postura-neutra"]').click();
  await p.waitForTimeout(400);
  const neutro = await svgPalco();
  ok(!neutro.includes('scale(1.1 0.98)') && !neutro.includes('rotate(-2 120'), 'neutro deveria remover o wrapper §102/§118');
  // undo devolve a postura (comando com inverso)
  await p.locator('button[title="Desfazer (Ctrl+Z)"]').click();
  await p.waitForTimeout(400);
  ok((await svgPalco()).includes('rotate(-2 120'), 'desfazer não devolveu a postura (comando §71-like)');
  await p.locator('button[title="Desfazer (Ctrl+Z)"]').click();
  await p.waitForTimeout(300);

  // §105 preset facial → morfologia §108 nos olhos
  await p.locator('[data-teste="facial-marcante"]').click();
  await p.waitForTimeout(400);
  ok((await svgPalco()).includes('scale(0.9)'), 'preset facial MARCANTE não aplicou a morfologia dos olhos (§105/§108)');
  await p.locator('[data-teste="facial-classico"]').click();
  await p.waitForTimeout(300);

  // §119 idle 2D (no painel do cenário)
  await p.locator('[data-teste="cenario-abrir"]').click();
  await p.locator('[data-teste="idle-flutuar"]').click();
  await p.waitForTimeout(300);
  ok(await p.locator('.avst5-viewport[data-idle="flutuar"]').count() === 1, 'idle 2D FLUTUAR não ligou (§119)');
  await p.locator('[data-teste="idle-nenhum"]').click();
  await p.waitForTimeout(200);
  ok(await p.locator('.avst5-viewport[data-idle]').count() === 0, 'idle não desligou');

  // §120 emotes v2 — 7 emotes no Studio
  await p.locator('button[title="Modo Studio (apresentação)"]').click();
  await p.waitForTimeout(400);
  ok(await p.locator('[data-teste="emotes"] button').count() === 7, 'esperava 7 emotes (4 clássicos + 3 v2 §120)');
  await p.screenshot({ path: `${SAIDA}/criacao-v2-shell.png` });
  ok(erros.length === 0, `erros de página (shell): ${erros.join(' | ')}`);
  await b.close();
}

// ── B) FOTO ──
{
  const { navegador: b, pagina: p, erros } = await abrir({ viewport: { width: 1500, height: 1100 } });
  await irParaHarness(p, 'avst-harness.html', 800);
  await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Foto')?.click(); });
  await p.waitForTimeout(500);
  await p.evaluate(async () => {
    const c = document.createElement('canvas');
    c.width = 480; c.height = 480;
    const g = c.getContext('2d');
    g.fillStyle = '#7c5cff'; g.fillRect(0, 0, 480, 480);
    const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
    const dt = new DataTransfer();
    dt.items.add(new File([blob], 'cv2.png', { type: 'image/png' }));
    const input = document.querySelector('input[type="file"]');
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await p.waitForSelector('.avst-foto-acoes', { timeout: 10000 });
  await p.evaluate(() => { [...document.querySelectorAll('.avst-foto-acoes button')].find((x) => x.textContent.includes('Estilizar'))?.click(); });
  await p.waitForSelector('[data-teste="ajustes-foto"]', { timeout: 10000 });
  const svgDe = () => p.evaluate(() => document.querySelector('.avst-ft-preview svg')?.outerHTML ?? '');

  // §361: 2 passos de histórico → thumbs → saltar de volta
  await p.evaluate(() => {
    const grupo = [...document.querySelectorAll('.avst-ft-grupo')].find((x) => x.querySelector('.avst-ft-rotulo')?.textContent.trim().startsWith('Fundo'));
    [...(grupo?.querySelectorAll('.avst-ft-chip') ?? [])][1]?.click();
  });
  await p.waitForTimeout(300);
  const aposFundo = await svgDe();
  await p.evaluate(() => {
    const grupo = [...document.querySelectorAll('.avst-ft-grupo')].find((x) => x.querySelector('.avst-ft-rotulo')?.textContent.includes('Título'));
    [...(grupo?.querySelectorAll('.avst-ft-chip') ?? [])][1]?.click();
  });
  await p.waitForTimeout(300);
  await p.locator('[data-teste="hist-visual-toggle"]').click();
  await p.waitForTimeout(300);
  ok(await p.locator('[data-teste="hist-visual"]').count() === 1, 'histórico visual §361 não abriu');
  const nPassos = await p.locator('[data-teste="hist-visual"] .avst-ft-histpasso').count();
  ok(nPassos >= 3, `esperava ≥2 passos + atual no histórico visual (veio ${nPassos})`);
  await p.locator('[data-teste="hist-passo-1"]').click();
  await p.waitForTimeout(300);
  ok(await svgDe() === aposFundo, 'saltar para o passo 1 não restaurou o estado (só fundo, sem título)');
  ok(await p.locator('[data-teste="ft-refazer"]').isEnabled(), 'refazer deveria ficar disponível após o salto (§361)');

  // §349: compor pra mim — título + legenda no perfil → selo compacto no topo
  await p.locator('[data-teste="legenda-foto"]').evaluate((el) => {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    set.call(el, 'Dshow'); el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await p.evaluate(() => {
    const grupo = [...document.querySelectorAll('.avst-ft-grupo')].find((x) => x.querySelector('.avst-ft-rotulo')?.textContent.includes('Título'));
    [...(grupo?.querySelectorAll('.avst-ft-chip') ?? [])][1]?.click();
  });
  await p.waitForTimeout(300);
  await p.locator('[data-teste="compor-auto"]').click();
  await p.waitForTimeout(400);
  const composto = await svgDe();
  ok(composto.includes('y="14"'), 'Compor pra mim não moveu o selo ao topo (§349: título+legenda no 1:1)');
  ok(composto.includes('font-size="9.8"'), 'Compor pra mim não aplicou o selo compacto P (§349×§344)');
  await p.locator('[data-teste="compor-auto"]').click();
  await p.waitForTimeout(300);
  ok(await svgDe() === composto, 'Compor pra mim deveria ser DETERMINÍSTICO (2ª chamada = mesmo SVG)');

  // §369: preset de exportação
  await p.evaluate(() => { [...document.querySelectorAll('[data-teste="formatos-foto"] .avst-ft-chip')].find((x) => x.textContent.includes('Header'))?.click(); });
  await p.waitForTimeout(200);
  await p.locator('[data-teste="export-preset-salvar"]').click();
  await p.waitForTimeout(200);
  ok(await p.locator('[data-teste="export-presets"] .avst-ft-chip').count() >= 2, 'preset de exportação não apareceu (§369)');
  await p.evaluate(() => { [...document.querySelectorAll('[data-teste="formatos-foto"] .avst-ft-chip')].find((x) => x.textContent.includes('Perfil'))?.click(); });
  await p.waitForTimeout(200);
  await p.evaluate(() => { [...document.querySelectorAll('[data-teste="export-presets"] .avst-ft-chip')].find((x) => x.textContent.startsWith('Export'))?.click(); });
  await p.waitForTimeout(300);
  ok(await p.locator('[data-teste="formatos-foto"] .avst-ft-chip[aria-checked="true"]').textContent().then((t) => t?.includes('Header')), 'aplicar o preset §369 não restaurou o formato Header');
  const persistiuExp = await p.evaluate(() => localStorage.getItem('dshow.avst5.foto.export.v1') ?? '');
  ok(persistiuExp.includes('xp_'), 'preset de exportação não persistiu');

  // §364 v2: guardar projeto → renomear inline
  await p.locator('[data-teste="guardar-projeto"]').click();
  await p.waitForTimeout(600);
  await p.evaluate(() => { [...document.querySelectorAll('.avst-foto-acoes button')].find((x) => x.textContent.includes('Cancelar'))?.click(); });
  await p.waitForTimeout(500);
  ok(await p.locator('[data-teste="projeto-nome"]').count() >= 1, 'nome do projeto ausente na lista (§364 v2)');
  await p.locator('[data-teste="projeto-nome"]').first().click();
  await p.locator('[data-teste="projeto-renomear-input"]').fill('Capa da China');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(300);
  ok((await p.locator('[data-teste="projeto-nome"]').first().textContent()) === 'Capa da China', 'renomear projeto não aplicou (§364 v2)');
  const projPersist = await p.evaluate(() => localStorage.getItem('dshow.avst5.foto.projetos.v1') ?? '');
  ok(projPersist.includes('Capa da China'), 'renome do projeto não persistiu');
  await p.screenshot({ path: `${SAIDA}/criacao-v2-foto.png` });
  ok(erros.length === 0, `erros de página (foto): ${erros.join(' | ')}`);
  await b.close();
}

if (falhas.length) { console.error('FALHAS criacao-v2:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('criacao-v2 OK');
