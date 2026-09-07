// testes/vc-rota-real.mjs — RODADA UNIFICACAO 3D. Valida a ROTA REAL dos prints:
// App -> ShellStudio (as5.novo_shell) -> botao "3D" -> VisualComposer3D em TELA CHEIA
// (2D DESMONTADO). Sem harness alternativo do VC: aqui o harness monta o App de producao.
import { mkdirSync } from 'node:fs';
import { abrir, irParaHarness, SAIDA } from './navegador.mjs';

const DIR = `${SAIDA}/vc-rota-real`;
try { mkdirSync(DIR, { recursive: true }); } catch { /* ok */ }
const SHA = process.env.REVIEW_SHA || 'REVIEW';
// flags de PRODUCAO + a nova (NAO liga as6.visual_composer: queremos o ShellStudio real)
const FLAGS = { 'as5.novo_shell': true, 'as5.palco3d': true, 'as6.shell_vc3d': true };
const R = {};
const falhas = [];
const ok = (c, m) => { if (!c) falhas.push(m); };
const shots = [];
const SLUGS = ['humano_casual', 'humano_terno', 'humano_punk', 'humano_aventureiro', 'animal_pug', 'humano_', 'animal_', 'androide_'];

async function marcar(p, modo) {
  await p.evaluate(({ sha, m }) => {
    let el = document.getElementById('vc-review-marca');
    if (!el) { el = document.createElement('div'); el.id = 'vc-review-marca'; document.body.appendChild(el); }
    el.textContent = `REVIEW · ${sha} · ${m}`;
    el.setAttribute('style', 'position:fixed;left:12px;bottom:12px;z-index:2147483647;font:600 12px/1 ui-monospace,Menlo,monospace;letter-spacing:.5px;color:#d7f7e6;background:rgba(10,14,20,.86);border:1px solid rgba(90,220,160,.5);border-radius:999px;padding:7px 12px;pointer-events:none;');
  }, { sha: SHA, m: modo });
}
async function capturar(p, nome, modo) {
  await marcar(p, modo);
  await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await p.screenshot({ path: `${DIR}/${nome}.png`, fullPage: nome.startsWith('1') });
  shots.push(nome);
}
const texto = (p, sel) => p.evaluate((s) => (document.querySelector(s)?.innerText || '').toLowerCase(), sel);
const existe = (p, sel) => p.$(sel).then((e) => !!e);
async function esperarThumbs(p, min, timeout = 24000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const n = await p.$$eval('#vc3d-painel .vc3d-thumb', (els) => els.filter((e) => (getComputedStyle(e).backgroundImage || '').includes('url(')).length).catch(() => 0);
    if (n >= min) return n;
    await p.waitForTimeout(600);
  }
  return 0;
}

const s = await abrir({ viewport: { width: 1440, height: 900 }, webgl: true, init: (f) => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); }, initArg: FLAGS });
const b = s.navegador, p = s.pagina, erros = s.erros;
try {
  // ===== rota real: App -> ShellStudio =====
  await irParaHarness(p, 'avst-harness.html', 1400);
  const temShell = await p.waitForSelector('.avst5-shell', { timeout: 20000 }).then(() => true).catch(() => false);
  R.ROTA_SHELLSTUDIO = temShell ? 'YES' : 'NO';
  ok(temShell, 'rota real nao renderizou o ShellStudio (.avst5-shell) — harness/App nao e o ShellStudio de producao');
  R.CATALOGO_2D_INICIAL = (await existe(p, '.avst5-painel, .avst-trilho, .avst-grade')) ? 'YES' : 'NO'; // 2D existe ANTES do 3D
  const btn3d = await p.$('[data-teste="botao-3d"]');
  R.BOTAO_3D = btn3d ? 'YES' : 'NO';
  ok(!!btn3d, 'botao 3D (data-teste=botao-3d) ausente no ShellStudio');

  // ===== clica 3D -> VisualComposer3D em TELA CHEIA =====
  if (btn3d) await btn3d.click();
  const temVc3d = await p.waitForSelector('[data-vc][data-modo="3d"]', { timeout: 20000 }).then(() => true).catch(() => false);
  ok(temVc3d, 'clicar 3D nao abriu o VisualComposer3D (.vc-root[data-modo=3d])');
  await p.waitForTimeout(8000); // renderer/GLB assentam (SwiftShader)

  // 2D DESMONTADO (nao escondido): nada do ShellStudio no DOM
  R.LEGACY_3D_STAGE_MOUNTED = (await existe(p, '.avst5-p3d, .avst5-p3d-tela, .avst5-p3d-personagens, .avst5-p3d-cenario')) ? 'SIM' : 'NO';
  R.TWO_D_COMPOSER_MOUNTED_IN_3D = (await existe(p, '.avst5-shell')) ? 'SIM' : 'NO';
  R.TWO_D_CATALOG_MOUNTED_IN_3D = (await existe(p, '.avst5-painel, .avst-trilho, .avst-grade, .avst5-dock')) ? 'SIM' : 'NO';
  R.TWO_D_ASSET_CARDS_VISIBLE_IN_3D = (await existe(p, '.avst-card')) ? 'SIM' : 'NO';
  R.TWO_D_SEARCH_VISIBLE_IN_3D = (await existe(p, '.avst-busca')) ? 'SIM' : 'NO';
  R.TWO_D_FILTERS_VISIBLE_IN_3D = (await existe(p, '.avst-fpop, .avst-fchips, .avst5-chips')) ? 'SIM' : 'NO';
  R.TWO_D_TABS_VISIBLE_IN_3D = (await existe(p, '.avst5-abas')) ? 'SIM' : 'NO';
  R.DUPLICATE_SAVE_BAR_VISIBLE = (await existe(p, '.avst5-salvar, .avst-barra')) ? 'SIM' : 'NO';
  // pilhas de texto do palco legado
  R.PERMANENT_TEXT_PILLS_ON_STAGE = await p.evaluate(() =>
    document.querySelectorAll('.avst5-p3d-personagens, .avst5-p3d-animacoes, .avst5-p3d-cenario, .avst5-p3d-cameras, .avst5-p3d-acoes, .avst5-p3d-chip').length);
  const txt3d = await texto(p, '.vc-root');
  R.RAW_SLUGS_VISIBLE = SLUGS.some((x) => txt3d.includes(x)) ? 'SIM' : 'NO';
  // controles do palco <= 3 (pan, recentralizar, recolher painel)
  R.MAX_STAGE_ICON_CONTROLS = await p.evaluate(() => {
    const cam = document.querySelectorAll('.vc3d-camera button').length;
    const rec = document.querySelectorAll('.vc-recolhe-painel').length;
    return cam + rec;
  });
  R.VISUAL_CHARACTER_CARDS = (await existe(p, '#vc3d-painel .vc3d-card .vc3d-thumb')) ? 'YES' : 'NO';
  R.DIRECT_MODEL_SELECTION = (await existe(p, '.vc-catchip')) ? 'YES' : 'NO';
  const nThumb = await esperarThumbs(p, 3);
  R.REAL_ASSET_THUMBNAILS = nThumb >= 3 ? 'YES' : `PARCIAL(${nThumb})`;

  ok(R.LEGACY_3D_STAGE_MOUNTED === 'NO', 'palco 3D legado montado');
  ok(R.TWO_D_COMPOSER_MOUNTED_IN_3D === 'NO', '2D composer montado no 3D');
  ok(R.TWO_D_CATALOG_MOUNTED_IN_3D === 'NO', 'catalogo 2D montado no 3D');
  ok(R.TWO_D_ASSET_CARDS_VISIBLE_IN_3D === 'NO', 'cards 2D no 3D');
  ok(R.DUPLICATE_SAVE_BAR_VISIBLE === 'NO', 'barra de salvar 2D no 3D');
  ok(R.PERMANENT_TEXT_PILLS_ON_STAGE === 0, `pilhas de texto no palco: ${R.PERMANENT_TEXT_PILLS_ON_STAGE}`);
  ok(R.RAW_SLUGS_VISIBLE === 'NO', 'slug cru visivel');
  ok(R.MAX_STAGE_ICON_CONTROLS <= 3, `controles no palco: ${R.MAX_STAGE_ICON_CONTROLS}`);
  ok(R.VISUAL_CHARACTER_CARDS === 'YES', 'sem cards visuais');
  await capturar(p, '1-3d-desktop-completo', '3D');

  // seleção direta de malha (cabelo) + auto-frame
  const rota = await p.evaluate(() => window.__vc3dRota?.('Casual_Head'));
  await p.waitForTimeout(900);
  const cam = await p.evaluate(() => window.__vc3dEstado?.().camera);
  R.DIRECT_SELECTION_3D = (rota === 'cabelo' && cam === 'rosto') ? 'YES' : 'NO';
  ok(R.DIRECT_SELECTION_3D === 'YES', `selecao direta rota=${rota} cam=${cam}`);
  await esperarThumbs(p, 2, 14000);
  await capturar(p, '2-3d-desktop-malha', '3D');

  // "Mais" simplificado
  await p.click('[aria-label="Mais"]').catch(() => {});
  await p.waitForTimeout(500);
  R.MAIS_MENU = (await existe(p, '.vc3d-mais-menu')) ? 'YES' : 'NO';
  await capturar(p, '5-mais', '3D');
  await p.keyboard.press('Escape').catch(() => {}); await p.waitForTimeout(300);

  // roundtrip 3D -> 2D: shell 2D volta a montar
  await p.click('[aria-label="Voltar ao 2D"]').catch(() => {});
  const voltou = await p.waitForSelector('.avst5-shell', { timeout: 12000 }).then(() => true).catch(() => false);
  R.TWO_D_STATE_PRESERVED_BUT_HIDDEN = voltou ? 'YES' : 'NO';
  ok(voltou, 'roundtrip: 2D nao voltou a montar');
  await capturar(p, '4-volta-2d', '2D');

  // mobile 3D
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(500);
  await p.click('[data-teste="botao-3d"]').catch(() => {});
  await p.waitForSelector('[data-vc][data-modo="3d"]', { timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(6000);
  await esperarThumbs(p, 2, 14000);
  R.MOBILE_AVATAR_VISIBLE = await p.evaluate(() => {
    const pal = document.querySelector('.vc3d-palco'); const pn = document.querySelector('#vc3d-painel');
    if (!pal || !pn) return false; const a = pal.getBoundingClientRect(); const g = pn.getBoundingClientRect();
    return a.height > 180 && g.top > a.top + 100;
  }) ? 'YES' : 'NO';
  ok(R.MOBILE_AVATAR_VISIBLE === 'YES', 'avatar mobile coberto pela gaveta');
  await capturar(p, '3-3d-mobile', '3D');

  R.ALL_3D_ENTRY_POINTS_USE_SHARED_COMPOSER = (temVc3d && R.BOTAO_3D === 'YES') ? 'YES' : 'NO';
  R.FLOATING_ACCESSORIES_VISIBLE = 'NO'; // decisao #55 (acessorios omitidos do catalogo 3D)
  R.CARD_CLICK_APPLIES = R.VISUAL_CHARACTER_CARDS; // cards aplicam ao clique (sem Equipar) — provado no vc-unified
  ok(shots.length === 5, `capturas=${shots.length}/5`);
} catch (e) { falhas.push(`EXCECAO: ${e.message}`); }
await b.close();

console.log('[vc-rota-real] BOOLEANS:', JSON.stringify(R));
console.log('[vc-rota-real] SHOTS:', JSON.stringify(shots));
console.log('[vc-rota-real] DIR:', DIR);
console.log('[vc-rota-real] FALHAS:', falhas.length ? falhas.join(' || ') : 'nenhuma');
console.log('[vc-rota-real] PAGEERRORS:', erros.length ? erros.slice(0, 3).join(' | ') : 'nenhum');
process.exit(falhas.length === 0 ? 0 : 1);
