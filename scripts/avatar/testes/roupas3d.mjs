// testes/roupas3d.mjs — lote 631–640 (§415–§417, flag as5.roupas3d):
// ROUPAS 3D com BODY MASKING.
//   A) CONTRATO: mascararBase esconde faces da base dominadas pelos bones
//      da região (§415.2), restaura com [] (byte-stability), e o
//      assembler aplica a máscara DECLARADA pela parte no passo 13;
//   B) UI (harness, com partes publicadas): vestir Ranger no Herói UBC
//      muda o palco e marca o chip; trocar pra Camponês troca; base
//      legada esconde o grupo;
//   C) rollback §651 (as5.roupas3d off = grupo some; cabelos seguem).
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
const PORTA = 8917;
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── PARTE A: contrato ────────────────────────────────────────────────
const dir = mkdtempSync(join(tmpdir(), 'avst-rou-'));
const fonte = join(dir, 'manequim.glb');
await gerarManequim(fonte, { denso: false });
writeFileSync(join(dir, 'entrada.ts'), `
import { mascararBase, montarPersonagem } from '${PAINEL}/src/services/Assembler3d';
(window as any).__mascarar = mascararBase;
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
    const facesDe = (raiz) => {
      let n = 0;
      raiz.traverse((o) => { if (o.isSkinnedMesh) n += (o.geometry.getIndex()?.count ?? 0) / 3; });
      return n;
    };
    const bonesDe = (raiz) => {
      const l = [];
      raiz.traverse((o) => { if (o.isBone) l.push(o); });
      return l;
    };
    const saida = {};

    // §415.2: máscara esconde faces; [] restaura byte a byte
    const base = await carregar();
    const bones = bonesDe(base);
    const mapa = { teste: bones.slice(0, Math.ceil(bones.length / 2)).map((b) => b.name) };
    const antes = facesDe(base);
    const escondidas = window.__mascarar(base, ['teste'], mapa);
    saida.escondeu = escondidas > 0 && facesDe(base) === antes - escondidas;
    window.__mascarar(base, [], mapa);
    saida.restaurou = facesDe(base) === antes;
    // idempotente: aplicar 2× = mesmo resultado
    const e1 = window.__mascarar(base, ['teste'], mapa);
    const e2 = window.__mascarar(base, ['teste'], mapa);
    saida.idempotente = e1 === e2 && e1 === escondidas;
    window.__mascarar(base, [], mapa);

    // assembler passo 13: parte DECLARA a máscara e a base é mascarada
    const base2 = await carregar();
    // dá nomes ubc aos 3 primeiros bones (a máscara padrão é do rig ubc-v1)
    const bones2 = bonesDe(base2);
    bones2[0].name = 'spine_01'; bones2[1].name = 'spine_02'; bones2[2].name = 'spine_03';
    const parte = await carregar();
    const antes2 = facesDe(base2);
    const r2 = window.__montar({
      base: base2,
      partes: [{ id: 'roupa_dev', categoria: 'roupa', cena: parte, mascara: ['torso'] }],
      bonesCanonicos: [],
    });
    const faseClipping = r2.fases.find((f) => f.passo === 'clipping');
    saida.montouComMascara = r2.ok && /faces da base ocultas/.test(faseClipping?.detalhe ?? '');
    saida.baseReduziu = facesDe(base2) < antes2 + facesDe(parte); // base perdeu faces (parte somada à raiz)
    return saida;
  });
  ok(r.escondeu, 'mascararBase não escondeu faces da região (§415.2)');
  ok(r.restaurou, 'máscara vazia não restaurou a base (byte-stability)');
  ok(r.idempotente, 'mascararBase não é idempotente');
  ok(r.montouComMascara, 'assembler não aplicou a máscara declarada pela parte (§417)');
  ok(errosPag.length === 0, `erros JS no contrato: ${errosPag.join(' | ')}`);
} catch (e) {
  falhas.push(`exceção no contrato: ${e.message}`);
} finally {
  await nav1?.close().catch(() => {});
  srv.close();
  rmSync(dir, { recursive: true, force: true });
}

// ── PARTE B: UI ──────────────────────────────────────────────────────
{
  const temRoupas = existsSync(join(RAIZ, 'public/assets/avatars/3d/partes/rou3d_ranger_m_corpo/manifest.json'));
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 }, webgl: true,
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': true })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await p.locator('[data-teste="botao-3d"]').click();
    await p.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 30000 });
    await p.waitForTimeout(3000);
    if (temRoupas) {
      await p.evaluate(() => { [...document.querySelectorAll('.avst5-p3d-personagens .avst5-p3d-chip')].find((x) => x.textContent.includes('Herói (UBC)'))?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
      await p.waitForTimeout(4000);
      ok(await p.locator('[data-teste="p3d-roupas"]').count() === 1, 'grupo de roupas ausente com base ubc-v1 (§415)');
      const antes = await p.locator('[data-teste="palco-3d"] canvas').screenshot();
      await p.evaluate(() => document.querySelector('[data-teste="p3d-roupa-ranger"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
      await p.waitForTimeout(5000);
      ok(await p.locator('[data-teste="p3d-roupa-ranger"][aria-checked="true"]').count() === 1, 'Ranger não marcou');
      const vestido = await p.locator('[data-teste="palco-3d"] canvas').screenshot();
      ok(!antes.equals(vestido), 'vestir o Ranger não mudou o palco (§415)');
      await p.evaluate(() => document.querySelector('[data-teste="p3d-roupa-peasant"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
      await p.waitForTimeout(5000);
      const camponesa = await p.locator('[data-teste="palco-3d"] canvas').screenshot();
      ok(!vestido.equals(camponesa), 'trocar pra Camponês não mudou o palco (§416)');
      await p.evaluate(() => { [...document.querySelectorAll('.avst5-p3d-personagens .avst5-p3d-chip')].find((x) => x.textContent.trim() === 'Androide')?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
      await p.waitForTimeout(3000);
      ok(await p.locator('[data-teste="p3d-roupas"]').count() === 0, 'grupo de roupas deveria sumir em base legada');
    } else {
      ok(await p.locator('[data-teste="p3d-roupas"]').count() === 0, 'sem partes de roupa o grupo deveria estar ausente (§481)');
      console.log('[roupas3d] aviso: roupas ainda não publicadas — ramo completo da UI roda após a publicação');
    }
    await p.screenshot({ path: `${SAIDA}/roupas3d-ui.png` });
    ok(erros.length === 0, `erros de página (UI): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção na UI: ${e.message}`); }
  await b.close();
}

// ── PARTE C: rollback §651 ───────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 }, webgl: true,
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': true, 'as5.roupas3d': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await p.locator('[data-teste="botao-3d"]').click();
    await p.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 30000 });
    await p.waitForTimeout(3000);
    await p.evaluate(() => { [...document.querySelectorAll('.avst5-p3d-personagens .avst5-p3d-chip')].find((x) => x.textContent.includes('Herói (UBC)'))?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await p.waitForTimeout(3500);
    ok(await p.locator('[data-teste="p3d-roupas"]').count() === 0, 'flag off com grupo de roupas (§651)');
    ok(erros.length === 0, `erros de página (rollback): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção no rollback: ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('FALHAS roupas3d:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('roupas3d OK');
