// testes/materiais3d.mjs — lote 641–650 (§418–§421, flag as5.materiais3d):
// MATERIAL MANAGER + canais de cor §73 no 3D.
//   A) CONTRATO: pipeline central tinge por canal (multiplicativo §421),
//      restaura byte a byte, é idempotente, respeita nome (cabelo
//      embutido), convive com a tinta mega 81, grampeia emissivos §418.2,
//      e o assembler MARCA canais por categoria no passo 10 (§420);
//   B) UI (harness, shell + palco 3D no Herói UBC): trocar a cor de
//      Cabelo no painel 2D recolore o palco; vestir Ranger e trocar a
//      cor de Roupa recolore a armadura (§420: a UI fala canais);
//   C) rollback §651 (as5.materiais3d off = trocar cor NÃO muda o palco).
// @version 1.0.0  @created 2026-08-07
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { gerarManequim } from '../assets3d/gerar-manequim.mjs';
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const PORTA = 8918;
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── PARTE A: contrato ────────────────────────────────────────────────
const dir = mkdtempSync(join(tmpdir(), 'avst-mat-'));
const fonte = join(dir, 'manequim.glb');
await gerarManequim(fonte, { denso: false });
writeFileSync(join(dir, 'entrada.ts'), `
import { aplicarPipelineCores, canalDaCategoria, descartarMateriais, marcarCanal } from '${PAINEL}/src/services/Materiais3d';
import { montarPersonagem } from '${PAINEL}/src/services/Assembler3d';
(window as any).__pipeline = aplicarPipelineCores;
(window as any).__canalDe = canalDaCategoria;
(window as any).__marcar = marcarCanal;
(window as any).__descartar = descartarMateriais;
(window as any).__montar = montarPersonagem;
(window as any).__bundlePronto = true;
`);
const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')]
  .find((c) => existsSync(c)) ?? 'esbuild';
execSync(`"${esbuild}" "${join(dir, 'entrada.ts')}" --bundle --format=esm ` +
  '--external:three --external:three/examples/jsm/* ' +
  `--outfile="${join(dir, 'bundle.js')}"`, { stdio: 'pipe' });
const PAGINA = `<!doctype html><html><head><meta charset="utf-8">
<script type="importmap">{"imports":{
  "three": "/three/build/three.module.js",
  "three/examples/jsm/loaders/GLTFLoader.js": "/three/examples/jsm/loaders/GLTFLoader.js"
}}</script></head><body><script type="module" src="/bundle.js"></script></body></html>`;
const MIME = { '.js': 'text/javascript', '.glb': 'model/gltf-binary' };
const srv = createServer(async (req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  try {
    if (url === '/') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(PAGINA); return; }
    const arq = url === '/bundle.js' ? join(dir, 'bundle.js')
      : url === '/manequim.glb' ? fonte
        : url.startsWith('/three/') ? join(RAIZ, 'node_modules/three', url.slice(7)) : null;
    if (!arq) { res.writeHead(404); res.end(); return; }
    const corpo = await readFile(arq);
    res.writeHead(200, { 'Content-Type': MIME[extname(arq)] ?? 'application/octet-stream' });
    res.end(corpo);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => srv.listen(PORTA, '127.0.0.1', r));

const { chromium } = await import('playwright-core');
let nav1 = null;
try {
  nav1 = await chromium.launch({
    executablePath: process.env.PW_CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
  });
  const p = await (await nav1.newContext()).newPage();
  const errosPag = [];
  p.on('pageerror', (e) => errosPag.push(e.message.slice(0, 140)));
  await p.goto(`http://127.0.0.1:${PORTA}/`, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__bundlePronto === true, { timeout: 20000 });
  const r = await p.evaluate(async () => {
    const THREE = await import('three');
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const carregar = async () => (await new GLTFLoader().loadAsync('/manequim.glb')).scene;
    const corDe = (raiz) => {
      let hex = null;
      raiz.traverse((o) => { if (o.isMesh && hex === null) hex = o.material.color.getHex(); });
      return hex;
    };
    const saida = {};

    // §420: categoria → canal (cabelo+barba compartilham o canal cabelo)
    saida.canais = window.__canalDe('cabelo') === 'cabelo'
      && window.__canalDe('barba') === 'cabelo'
      && window.__canalDe('roupa') === 'roupa'
      && window.__canalDe('acessorio') === 'destaque';

    // §421: tinge por canal MARCADO (multiplicativo), restaura, idempotente
    const alvo = await carregar();
    const original = corDe(alvo);
    window.__marcar(alvo, 'roupa');
    window.__pipeline(alvo, { cores: { roupa: '#ff0000' } });
    const tingido = corDe(alvo);
    const esperado = new THREE.Color(original).multiply(new THREE.Color('#ff0000')).getHex();
    saida.tingiu = tingido === esperado && tingido !== original;
    window.__pipeline(alvo, { cores: { roupa: '#ff0000' } });
    saida.idempotente = corDe(alvo) === tingido; // 2× = 1× (nunca acumula)
    window.__pipeline(alvo, {});
    saida.restaurou = corDe(alvo) === original;  // sem cores = arte original

    // canal por NOME (§420): cobre o cabelo EMBUTIDO das bases UBC
    const cab = await carregar();
    cab.traverse((o) => { if (o.isMesh) o.material.name = 'MI_Hair_1'; });
    window.__pipeline(cab, { cores: { cabelo: '#00ff00' } });
    saida.porNome = corDe(cab) !== original;
    // pele NUNCA por chute: material sem marca/nome de pele fica intocado
    window.__pipeline(cab, { cores: { pele: '#123456' } });
    saida.peleSoPorNome = corDe(cab) === original;

    // mega 81 convive: canal + tinta lerp por cima; sem tinta volta ao canal
    const dois = await carregar();
    window.__marcar(dois, 'roupa');
    window.__pipeline(dois, { cores: { roupa: '#ff0000' } });
    const soCanal = corDe(dois);
    window.__pipeline(dois, { cores: { roupa: '#ff0000' }, tinta: { cor: '#00ff00', forca: 0.5 } });
    saida.comTinta = corDe(dois) !== soCanal;
    window.__pipeline(dois, { cores: { roupa: '#ff0000' } });
    saida.tintaSaiu = corDe(dois) === soCanal;

    // §418.2: emissivo acima do teto é grampeado
    const em = await carregar();
    em.traverse((o) => { if (o.isMesh) o.material.emissiveIntensity = 9; });
    window.__pipeline(em, {});
    let teto = true;
    em.traverse((o) => { if (o.isMesh && o.material.emissiveIntensity > 2) teto = false; });
    saida.emissivo = teto;

    // §406 passo 10: o assembler MARCA os canais por categoria
    const base = await carregar();
    const parte = await carregar();
    const r10 = window.__montar({
      base,
      partes: [{ id: 'rou_dev', categoria: 'roupa', cena: parte }],
      bonesCanonicos: [],
    });
    const fase10 = r10.fases.find((f) => f.passo === 'materiais');
    saida.passo10 = r10.ok && /canais §73 marcados: roupa×1/.test(fase10?.detalhe ?? '');
    window.__pipeline(base, { cores: { roupa: '#0000ff' } });
    saida.parteTingida = corDe(parte) !== original; // material da parte respondeu ao canal

    // §419 descartar recursos: materiais/texturas descartados sem lançar
    saida.descartou = window.__descartar(base) > 0;
    return saida;
  });
  ok(r.canais, 'canalDaCategoria fora do vocabulário §420');
  ok(r.tingiu, 'pipeline não tingiu o canal marcado (§421 multiplicativo)');
  ok(r.idempotente, 'pipeline não é idempotente (acumulou tinta)');
  ok(r.restaurou, 'sem cores o material não voltou ao original (byte-stability)');
  ok(r.porNome, 'canal por NOME (hair) não respondeu (§420)');
  ok(r.peleSoPorNome, 'pele tingiu material sem nome de pele (§418 — nunca chutar)');
  ok(r.comTinta, 'tinta mega 81 não aplicou por cima do canal');
  ok(r.tintaSaiu, 'remover a tinta não voltou ao estado só-canal');
  ok(r.emissivo, 'emissivo acima do teto §418.2 não foi grampeado');
  ok(r.passo10, 'assembler passo 10 não marcou canais §73 (§420)');
  ok(r.parteTingida, 'material da parte montada não respondeu ao canal roupa');
  ok(r.descartou, 'descartarMateriais não descartou nada (§419)');
  ok(errosPag.length === 0, `erros JS no contrato: ${errosPag.join(' | ')}`);
} catch (e) {
  falhas.push(`exceção no contrato: ${e.message}`);
} finally {
  await nav1?.close().catch(() => {});
  srv.close();
  rmSync(dir, { recursive: true, force: true });
}

// ── helpers da UI (partes B e C) ─────────────────────────────────────
const initShell = () => {
  localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': true }));
  localStorage.setItem('dshow.avst5.p3d.qualidade.v1', 'medio'); // tier fixo = sem troca de LOD no meio
};
const initShellOff = () => {
  localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': true, 'as5.materiais3d': false }));
  localStorage.setItem('dshow.avst5.p3d.qualidade.v1', 'medio');
};
const abrirPalcoNoHeroi = async (p) => {
  await p.emulateMedia({ reducedMotion: 'reduce' }); // pose estática = screenshot determinístico
  await irParaHarness(p, 'avst-harness.html', 1200);
  await p.locator('[data-teste="botao-3d"]').click();
  await p.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 30000 });
  await p.waitForTimeout(3000);
  await p.evaluate(() => { [...document.querySelectorAll('.avst5-p3d-personagens .avst5-p3d-chip')].find((x) => x.textContent.includes('Herói (UBC)'))?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await p.waitForTimeout(5000);
};
const trocarCor = async (p, slot, hex) => {
  // painel "Cores e propriedades" do shell (§420: a UI fala canais §73)
  const botao = p.locator('.avst5-painel-btn[title="Cores e propriedades"]');
  if (await botao.getAttribute('aria-pressed') !== 'true') await botao.click();
  await p.waitForSelector('.avst-cores', { timeout: 10000 });
  await p.evaluate(({ slot: s, hex: h }) => {
    const grupo = document.querySelector(`.avst-cores [aria-label="Cor de ${s}"]`);
    [...(grupo?.querySelectorAll('.avst-swatch') ?? [])].find((b) => b.title === h)
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }, { slot, hex });
  await p.waitForTimeout(2500);
};

// ── PARTE B: UI (flag ON) ────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 }, webgl: true, init: initShell,
  });
  try {
    await abrirPalcoNoHeroi(p);
    const canvas = p.locator('[data-teste="palco-3d"] canvas');
    // 1ª troca "prima" o layout: o botão Original (§64.2) aparece e o
    // canvas assenta — screenshots seguintes comparam SÓ o render
    await trocarCor(p, 'Cabelo', '#4c9de8');
    const antes = await canvas.screenshot();
    await trocarCor(p, 'Cabelo', '#e84c6f'); // rosa vivo — bem longe do azul
    const cabeloNovo = await canvas.screenshot();
    ok(!antes.equals(cabeloNovo), 'trocar a cor de Cabelo não recoloriu o palco (§420)');
    // veste o Ranger e recolore a ROUPA (canal marcado pelo passo 10 §406)
    await p.evaluate(() => document.querySelector('[data-teste="p3d-roupa-ranger"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    await p.waitForTimeout(6000);
    const vestido = await canvas.screenshot();
    await trocarCor(p, 'Roupa', '#e85c3a');
    const roupaNova = await canvas.screenshot();
    ok(!vestido.equals(roupaNova), 'trocar a cor de Roupa não recoloriu a armadura (§420/§406)');
    await p.screenshot({ path: `${SAIDA}/materiais3d-ui.png` });
    ok(erros.length === 0, `erros de página (UI): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção na UI: ${e.message}`); }
  await b.close();
}

// ── PARTE C: rollback §651 (flag OFF = cor não toca o 3D) ────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 }, webgl: true, init: initShellOff,
  });
  try {
    await abrirPalcoNoHeroi(p);
    const canvas = p.locator('[data-teste="palco-3d"] canvas');
    await trocarCor(p, 'Cabelo', '#4c9de8'); // prima o layout (botão Original)
    const antes = await canvas.screenshot();
    await trocarCor(p, 'Cabelo', '#e84c6f');
    const depois = await canvas.screenshot();
    ok(antes.equals(depois), 'flag off mas a cor 2D recoloriu o palco (§651)');
    ok(erros.length === 0, `erros de página (rollback): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção no rollback: ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('FALHAS materiais3d:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('materiais3d OK');
