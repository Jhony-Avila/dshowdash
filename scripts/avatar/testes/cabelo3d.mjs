// testes/cabelo3d.mjs — lote 651–660 (§412–§414/§423–§425, flags
// as5.cabelo3d + as5.morfos3d): BARBA como slot próprio + MORFOS via escala.
//   A) CONTRATO: cabelo E barba montam JUNTOS no MESMO esqueleto da base
//      (§425 combinações; identidade de Bones pós-rebind) e o passo 10
//      marca AMBOS no canal cabelo (§420);
//   B) UI (harness, Herói UBC): grupo Barba próprio; Barba NÃO aparece na
//      lista de cabelos; combinar Longo+Barba muda o palco 2×; tipo
//      corporal ROBUSTO §102 muda o 3D e voltar ao MÉDIO restaura o frame
//      byte a byte (§414 neutro = escala 1);
//   C) rollback §651 (flags off): barba volta à lista de cabelos; corpo
//      robusto NÃO toca o 3D.
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
const PORTA = 8919;
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── PARTE A: contrato ────────────────────────────────────────────────
const dir = mkdtempSync(join(tmpdir(), 'avst-cab-'));
const fonte = join(dir, 'manequim.glb');
await gerarManequim(fonte, { denso: false });
writeFileSync(join(dir, 'entrada.ts'), `
import { montarPersonagem } from '${PAINEL}/src/services/Assembler3d';
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
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const carregar = async () => (await new GLTFLoader().loadAsync('/manequim.glb')).scene;
    const saida = {};
    // §425: cabelo + barba na MESMA montagem — as duas rebindam nos bones
    // da base (combinação, não exclusão)
    const base = await carregar();
    const cab = await carregar();
    const brb = await carregar();
    const r1 = window.__montar({
      base,
      partes: [
        { id: 'cab_dev', categoria: 'cabelo', cena: cab },
        { id: 'brb_dev', categoria: 'barba', cena: brb },
      ],
      bonesCanonicos: [],
    });
    const fase = (n) => r1.fases.find((f) => f.passo === n);
    saida.montou = r1.ok;
    saida.faseCabelo = /1 parte/.test(fase('cabelo')?.detalhe ?? '');
    saida.faseBarba = /1 parte/.test(fase('barba')?.detalhe ?? '');
    // identidade: TODOS os SkinnedMesh (base+partes) usam os MESMOS Bones
    const deBase = new Set();
    base.traverse((o) => { if (o.isBone) deBase.add(o); });
    let compartilham = true;
    for (const raiz of [cab, brb]) {
      raiz.traverse((o) => {
        if (o.isSkinnedMesh && !o.skeleton.bones.every((b) => deBase.has(b))) compartilham = false;
      });
    }
    saida.mesmoEsqueleto = compartilham;
    // §420: barba tinge com o canal CABELO (passo 10 marca as duas)
    saida.canalCabelo2x = /canais §73 marcados: cabelo×2/.test(fase('materiais')?.detalhe ?? '');
    return saida;
  });
  ok(r.montou, 'montagem cabelo+barba falhou (§425)');
  ok(r.faseCabelo && r.faseBarba, 'fases cabelo/barba não reportaram 1 parte cada (§406)');
  ok(r.mesmoEsqueleto, 'cabelo e barba não compartilham o esqueleto da base (§425)');
  ok(r.canalCabelo2x, 'passo 10 não marcou cabelo+barba no canal cabelo (§420)');
  ok(errosPag.length === 0, `erros JS no contrato: ${errosPag.join(' | ')}`);
} catch (e) {
  falhas.push(`exceção no contrato: ${e.message}`);
} finally {
  await nav1?.close().catch(() => {});
  srv.close();
  rmSync(dir, { recursive: true, force: true });
}

// ── helpers da UI ────────────────────────────────────────────────────
const abrirPalcoNoHeroi = async (p) => {
  await p.emulateMedia({ reducedMotion: 'reduce' });
  await irParaHarness(p, 'avst-harness.html', 1200);
  await p.locator('[data-teste="botao-3d"]').click();
  await p.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 30000 });
  await p.waitForTimeout(3000);
  await p.evaluate(() => { [...document.querySelectorAll('.avst5-p3d-personagens .avst5-p3d-chip')].find((x) => x.textContent.includes('Herói (UBC)'))?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await p.waitForTimeout(5000);
};
const clicar = (p, sel) => p.evaluate((s) => document.querySelector(s)?.dispatchEvent(new MouseEvent('click', { bubbles: true })), sel);
const abrirCriacaoAvancada = async (p) => {
  await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Base'))?.click(); });
  await p.waitForTimeout(800);
};

// ── PARTE B: UI (flags ON) ───────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 }, webgl: true,
    init: () => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': true }));
      localStorage.setItem('dshow.avst5.p3d.qualidade.v1', 'medio');
    },
  });
  try {
    await abrirPalcoNoHeroi(p);
    const canvas = p.locator('[data-teste="palco-3d"] canvas');
    // §425: grupo Barba próprio; Barba fora da lista de cabelos
    ok(await p.locator('[data-teste="p3d-barbas"]').count() === 1, 'grupo Barba ausente (§425/as5.cabelo3d)');
    ok(await p.locator('[data-teste="p3d-cabelo-cab_barba"]').count() === 0, 'Barba ainda na lista de cabelos (§425)');
    // combinação: cabelo Longo + barba juntos
    const semNada = await canvas.screenshot();
    await clicar(p, '[data-teste="p3d-cabelo-cab_longo"]');
    await p.waitForTimeout(5000);
    const comCabelo = await canvas.screenshot();
    ok(!semNada.equals(comCabelo), 'cabelo Longo não entrou no palco');
    await clicar(p, '[data-teste="p3d-barba-cab_barba"]');
    await p.waitForTimeout(5000);
    ok(await p.locator('[data-teste="p3d-barba-cab_barba"][aria-checked="true"]').count() === 1, 'chip da barba não marcou');
    const comBarba = await canvas.screenshot();
    ok(!comCabelo.equals(comBarba), 'barba não COMBINOU com o cabelo (§425)');
    // §412–§414: tipo corporal §102 molda o 3D; MÉDIO restaura byte a byte
    await abrirCriacaoAvancada(p);
    ok(await p.locator('[data-teste="criacao-avancada"]').count() === 1, 'seção criação avançada ausente');
    await clicar(p, '[data-teste="corpo-robusto"]'); // prima o layout (draft sujo)
    await p.waitForTimeout(2000);
    await clicar(p, '[data-teste="corpo-medio"]');
    await p.waitForTimeout(2000);
    const neutro = await canvas.screenshot();
    await clicar(p, '[data-teste="corpo-robusto"]');
    await p.waitForTimeout(2000);
    const robusto = await canvas.screenshot();
    ok(!neutro.equals(robusto), 'tipo corporal ROBUSTO não moldou o 3D (§414)');
    await clicar(p, '[data-teste="corpo-medio"]');
    await p.waitForTimeout(2000);
    const deVolta = await canvas.screenshot();
    ok(neutro.equals(deVolta), 'voltar ao MÉDIO não restaurou o frame (§414 neutro = escala 1)');
    await p.screenshot({ path: `${SAIDA}/cabelo3d-ui.png` });
    ok(erros.length === 0, `erros de página (UI): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção na UI: ${e.message}`); }
  await b.close();
}

// ── PARTE C: rollback §651 (as5.cabelo3d + as5.morfos3d OFF) ─────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 }, webgl: true,
    init: () => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({
        'as5.novo_shell': true, 'as5.palco3d': true,
        'as5.cabelo3d': false, 'as5.morfos3d': false,
      }));
      localStorage.setItem('dshow.avst5.p3d.qualidade.v1', 'medio');
    },
  });
  try {
    await abrirPalcoNoHeroi(p);
    const canvas = p.locator('[data-teste="palco-3d"] canvas');
    // §651: barba VOLTA à lista de cabelos (comportamento do lote 621-630)
    ok(await p.locator('[data-teste="p3d-barbas"]').count() === 0, 'flag off com grupo Barba (§651)');
    ok(await p.locator('[data-teste="p3d-cabelo-cab_barba"]').count() === 1, 'flag off e Barba fora da lista de cabelos (§651)');
    // §651: corpo robusto não toca o 3D
    await abrirCriacaoAvancada(p);
    await clicar(p, '[data-teste="corpo-robusto"]'); // prima o layout
    await p.waitForTimeout(2000);
    await clicar(p, '[data-teste="corpo-medio"]');
    await p.waitForTimeout(2000);
    const neutro = await canvas.screenshot();
    await clicar(p, '[data-teste="corpo-robusto"]');
    await p.waitForTimeout(2000);
    const robusto = await canvas.screenshot();
    ok(neutro.equals(robusto), 'flag off mas o corpo moldou o 3D (§651)');
    ok(erros.length === 0, `erros de página (rollback): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção no rollback: ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('FALHAS cabelo3d:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('cabelo3d OK');
