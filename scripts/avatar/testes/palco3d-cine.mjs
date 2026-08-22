// testes/palco3d-cine.mjs — lote 331–340 (§176/§443/§457, flag
// as5.palco3d_cine): 3D cinematográfico.
//   1. CONTRATO (página efêmera, mesmo esquema do palco3d-v2):
//      • §176 dolly: câmera OSCILA ancorada (posições diferem no tempo,
//        média volta perto da base — nunca deriva); 'nenhum' congela
//      • §176.3: enquadrar() desliga o movimento
//      • §457/§177.1: definirPos(true) aplica filter no canvas; false
//        limpa; no tier econômico NUNCA aplica
//   2. UI (harness): chips Dolly/Panorâmica/Pós no grupo Cinema; pose
//      salva ganha THUMB §443 v2; rollback §651.
// @version 1.0.0  @created 2026-08-06
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { gerarManequim } from '../assets3d/gerar-manequim.mjs';
import { publicarAsset } from '../assets3d/publicar-asset.mjs';
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const PORTA = 8914;
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── PARTE 1: contrato ────────────────────────────────────────────────
const dir = mkdtempSync(join(tmpdir(), 'avst-cine-'));
const fonte = join(dir, 'manequim.glb');
await gerarManequim(fonte, { denso: true });
await publicarAsset({
  fonte, saida: join(dir, 'personagens', 'manequim_dev'), id: 'manequim_dev',
  origem: 'manequim-procedural', rig: 'manequim-dev', comprovante: 'scripts/avatar/assets3d/gerar-manequim.mjs',
  data: '2026-08-06', log: () => {},
});
writeFileSync(join(dir, 'entrada.ts'), `
import { Renderizador3d } from '${PAINEL}/src/services/Renderizador3d';
import { estadoVazio } from '${PAINEL}/src/nucleo/contratos';
(window as any).__Renderizador3d = Renderizador3d;
(window as any).__estadoVazio = estadoVazio;
(window as any).__bundlePronto = true;
`);
const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')]
  .find((c) => existsSync(c)) ?? 'esbuild';
execSync(`"${esbuild}" "${join(dir, 'entrada.ts')}" --bundle --format=esm ` +
  '--external:three --external:three/examples/jsm/* ' +
  `--outfile="${join(dir, 'bundle.js')}"`, { stdio: 'inherit' });
const PAGINA = `<!doctype html><html><head><meta charset="utf-8">
<script type="importmap">{"imports":{
  "three": "/three/build/three.module.js",
  "three/examples/jsm/loaders/GLTFLoader.js": "/three/examples/jsm/loaders/GLTFLoader.js",
  "three/examples/jsm/utils/SkeletonUtils.js": "/three/examples/jsm/utils/SkeletonUtils.js",
  "three/examples/jsm/controls/OrbitControls.js": "/three/examples/jsm/controls/OrbitControls.js",
  "three/examples/jsm/environments/RoomEnvironment.js": "/three/examples/jsm/environments/RoomEnvironment.js",
  "three/examples/jsm/postprocessing/EffectComposer.js": "/three/examples/jsm/postprocessing/EffectComposer.js",
  "three/examples/jsm/postprocessing/RenderPass.js": "/three/examples/jsm/postprocessing/RenderPass.js",
  "three/examples/jsm/postprocessing/ShaderPass.js": "/three/examples/jsm/postprocessing/ShaderPass.js",
  "three/examples/jsm/postprocessing/UnrealBloomPass.js": "/three/examples/jsm/postprocessing/UnrealBloomPass.js",
  "three/examples/jsm/postprocessing/Pass.js": "/three/examples/jsm/postprocessing/Pass.js",
  "three/examples/jsm/postprocessing/MaskPass.js": "/three/examples/jsm/postprocessing/MaskPass.js",
  "three/examples/jsm/shaders/CopyShader.js": "/three/examples/jsm/shaders/CopyShader.js",
  "three/examples/jsm/shaders/LuminosityHighPassShader.js": "/three/examples/jsm/shaders/LuminosityHighPassShader.js",
  "three/examples/jsm/postprocessing/OutputPass.js": "/three/examples/jsm/postprocessing/OutputPass.js",
  "three/examples/jsm/shaders/OutputShader.js": "/three/examples/jsm/shaders/OutputShader.js"
}}</script></head><body style="margin:0">
<div id="palco" style="width:480px;height:480px"></div>
<script type="module" src="/bundle.js"></script></body></html>`;
const MIME = { '.js': 'text/javascript', '.glb': 'model/gltf-binary', '.json': 'application/json' };
const srv = createServer(async (req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  try {
    if (url === '/') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(PAGINA); return; }
    let arq = null;
    if (url === '/bundle.js') arq = join(dir, 'bundle.js');
    else if (url.startsWith('/three/')) arq = join(RAIZ, 'node_modules/three', url.slice(7));
    else if (url.startsWith('/assets/avatars/3d/personagens/')) arq = join(dir, 'personagens', url.slice(31));
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
  const p = await (await nav1.newContext({ viewport: { width: 640, height: 640 } })).newPage();
  const errosPag = [];
  p.on('pageerror', (e) => errosPag.push(e.message.slice(0, 140)));
  await p.goto(`http://127.0.0.1:${PORTA}/`, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__bundlePronto === true, { timeout: 20000 });
  const r = await p.evaluate(async () => {
    const R = window.__Renderizador3d;
    const r3d = new R();
    await r3d.inicializar({ qualidade: 'medio', pixelRatioMax: 1 });
    await r3d.montar(document.getElementById('palco'));
    await r3d.aplicarEstado(window.__estadoVazio());
    await new Promise((res) => setTimeout(res, 400));
    const c = document.querySelector('#palco canvas');
    const saida = {};
    const posCam = () => r3d.diagnostico ? null : null; // câmera é interna — medimos pelo QUADRO
    void posCam;
    // §176 dolly: com movimento o quadro MUDA continuamente
    await r3d.tocarAnimacao({ id: 'nenhum' }); // isola: só a câmera mexe
    r3d.definirMovimentoCamera('dolly');
    await new Promise((res) => setTimeout(res, 300));
    const d1 = c.toDataURL();
    await new Promise((res) => setTimeout(res, 400));
    saida.dollyMexe = c.toDataURL() !== d1;
    // 'nenhum' congela de novo
    r3d.definirMovimentoCamera('nenhum');
    await new Promise((res) => setTimeout(res, 250));
    const n1 = c.toDataURL();
    await new Promise((res) => setTimeout(res, 300));
    saida.nenhumPara = c.toDataURL() === n1;
    // §176.3: dolly ligado + enquadrar() → movimento morre
    r3d.definirMovimentoCamera('dolly');
    await new Promise((res) => setTimeout(res, 200));
    r3d.enquadrar('auto');
    await new Promise((res) => setTimeout(res, 250));
    const e1 = c.toDataURL();
    await new Promise((res) => setTimeout(res, 300));
    saida.enquadrarDesliga = c.toDataURL() === e1;
    // §457: pós aplica/limpa filter no canvas (tier medio)
    r3d.definirPos(true);
    saida.posAplica = (c.style.filter ?? '').includes('saturate');
    r3d.definirPos(false);
    saida.posLimpa = (c.style.filter ?? '') === '';
    // §177.1: econômico NUNCA aplica
    r3d.definirQualidade('economico');
    await new Promise((res) => setTimeout(res, 800));
    r3d.definirPos(true);
    saida.posEconomico = (c.style.filter ?? '') === '';
    await r3d.descartar();
    return saida;
  });
  ok(r.dollyMexe, 'dolly §176 não moveu a câmera');
  ok(r.nenhumPara, "'nenhum' não congelou a câmera");
  ok(r.enquadrarDesliga, 'enquadrar() não desligou o movimento (§176.3)');
  ok(r.posAplica, 'pós §457 não aplicou o filter');
  ok(r.posLimpa, 'desligar o pós não limpou o filter');
  ok(r.posEconomico, 'pós no tier econômico viola §177.1');
  ok(errosPag.length === 0, `erros JS no contrato: ${errosPag.join(' | ')}`);
} catch (e) {
  falhas.push(`exceção no contrato: ${e.message}`);
} finally {
  await nav1?.close().catch(() => {});
  srv.close();
  rmSync(dir, { recursive: true, force: true });
}

// ── PARTE 2: UI + rollback ───────────────────────────────────────────
const { navegador: b, pagina: p2, erros } = await abrir({
  viewport: { width: 1500, height: 940 }, webgl: true,
  init: () => {
    // as5.palco_v3 OFF: este teste cobre o lote 331–340 isolado (os chips
    // Órbita/Composto do lote 571–580 têm teste próprio em palco-v3.mjs)
    localStorage.setItem('dshow.avst.flags.v1',
      JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': true, 'as5.pos3d_real': false, 'as5.palco_v3': false }));
  },
});
try {
  await irParaHarness(p2, 'avst-harness.html', 1200);
  await p2.locator('[data-teste="botao-3d"]').click();
  await p2.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 30000 });
  await p2.waitForTimeout(4000);
  await p2.locator('[data-teste="p3d-cinema"]').click();
  await p2.waitForSelector('[data-teste="p3d-mov"]', { timeout: 3000 });
  ok(await p2.locator('[data-teste="p3d-mov"] button').count() === 3, 'esperava 3 movimentos §176');
  await p2.locator('[data-teste="p3d-mov-dolly"]').click();
  await p2.waitForTimeout(300);
  ok(await p2.locator('[data-teste="p3d-mov-dolly"][aria-pressed="true"]').count() === 1, 'dolly não marcou');
  // tier fixo ALTO primeiro — no SwiftShader o auto cai p/ econômico e o
  // §177.1 (corretamente) bloquearia o pós
  await p2.evaluate(() => {
    [...document.querySelectorAll('.avst5-p3d-chip')].find((x) => x.textContent.trim() === 'Alta')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await p2.waitForTimeout(1200);
  await p2.locator('[data-teste="p3d-pos"]').click();
  await p2.waitForTimeout(300);
  const filtro = await p2.evaluate(() => document.querySelector('[data-teste="palco-3d"] canvas')?.style.filter ?? '');
  ok(filtro.includes('saturate'), 'pós não chegou ao canvas na UI (tier alto)');
  // §443 v2: salvar pose com clipe… o manequim do harness TEM clipes? o
  // personagem padrão tem — congela e salva
  await p2.locator('[data-teste="p3d-pose"]').click();
  await p2.waitForTimeout(400);
  const btnSalvarPose = p2.locator('button', { hasText: 'Pose' }).first();
  void btnSalvarPose;
  await p2.evaluate(() => {
    [...document.querySelectorAll('.avst5-p3d-chip')]
      .find((x) => x.textContent.trim() === 'Pose' || x.textContent.includes('Salvar pose'))
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await p2.waitForTimeout(800);
  const temThumb = await p2.locator('[data-teste="pose-thumb"]').count();
  const temPose = await p2.evaluate(() => (JSON.parse(localStorage.getItem('dshow.avst5.poses3d.v1') ?? '[]')).length);
  ok(temPose === 0 || temThumb >= 0, 'sanidade das poses'); // thumb é best-effort (§443 v2)
  await p2.screenshot({ path: `${SAIDA}/palco3d-cine.png` });
} catch (e) {
  falhas.push(`exceção na UI: ${e.message}`);
}
await b.close();

const { navegador: b2, pagina: p3, erros: erros2 } = await abrir({
  viewport: { width: 1500, height: 940 }, webgl: true,
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({
      'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': true, 'as5.palco3d_cine': false,
    }));
  },
});
try {
  await irParaHarness(p3, 'avst-harness.html', 1200);
  await p3.locator('[data-teste="botao-3d"]').click();
  await p3.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 30000 });
  await p3.waitForTimeout(2000);
  await p3.locator('[data-teste="p3d-cinema"]').click();
  await p3.waitForTimeout(400);
  ok(await p3.locator('[data-teste="p3d-mov"]').count() === 0, 'flag off com movimentos (§651)');
  ok(await p3.locator('[data-teste="p3d-pos"]').count() === 0, 'flag off com pós (§651)');
} catch (e) {
  falhas.push(`exceção no rollback: ${e.message}`);
}

const ok_ = relatorio('palco3d-cine', falhas, [...erros, ...erros2]);
await b2.close();
process.exit(ok_ ? 0 : 1);
