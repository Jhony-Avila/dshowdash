// testes/pos3d-real.mjs — lote 451–460 (§457/§177, flag as5.pos3d_real):
// pós-processamento 3D REAL (EffectComposer + bloom + vinheta).
//   CONTRATO (página efêmera): definirPos(true, true) muda o QUADRO
//   renderizado (composer de verdade, não CSS) e NÃO usa filter CSS;
//   §177.1: econômico continua sem nada; desligar restaura o caminho
//   legado byte a byte; fallback (real=false) segue no filter CSS.
// @version 1.0.0  @created 2026-08-06
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { gerarManequim } from '../assets3d/gerar-manequim.mjs';
import { publicarAsset } from '../assets3d/publicar-asset.mjs';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const PORTA = 8915;
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const dir = mkdtempSync(join(tmpdir(), 'avst-pos3d-'));
const fonte = join(dir, 'manequim.glb');
await gerarManequim(fonte, { denso: true });
await publicarAsset({
  fonte, saida: join(dir, 'personagens', 'manequim_dev'), id: 'manequim_dev',
  origem: 'manequim-procedural', comprovante: 'scripts/avatar/assets3d/gerar-manequim.mjs',
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
  "three/examples/jsm/shaders/LuminosityHighPassShader.js": "/three/examples/jsm/shaders/LuminosityHighPassShader.js"
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
    await new Promise((res) => setTimeout(res, 500));
    const c = document.querySelector('#palco canvas');
    const saida = {};
    r3d.pausar();
    r3d.avancarQuadro(0);
    const base = c.toDataURL();
    // composer REAL: quadro muda e NÃO é CSS filter
    r3d.definirPos(true, true);
    r3d.avancarQuadro(0);
    saida.realMudou = c.toDataURL() !== base;
    saida.semCss = (c.style.filter ?? '') === '';
    // desligar restaura byte a byte
    r3d.definirPos(false, true);
    r3d.avancarQuadro(0);
    saida.voltou = c.toDataURL() === base;
    // fallback (real=false) segue no CSS filter
    r3d.definirPos(true, false);
    saida.fallbackCss = (c.style.filter ?? '').includes('saturate');
    r3d.definirPos(false, false);
    // §177.1: econômico nunca
    r3d.definirQualidade('economico');
    await new Promise((res) => setTimeout(res, 800));
    r3d.definirPos(true, true);
    r3d.avancarQuadro(0);
    saida.economicoLimpo = (c.style.filter ?? '') === '';
    await r3d.descartar();
    return saida;
  });
  ok(r.realMudou, 'composer §457 não mudou o quadro');
  ok(r.semCss, 'composer real não podia usar CSS filter');
  ok(r.voltou, 'desligar o pós real não restaurou byte a byte');
  ok(r.fallbackCss, 'fallback CSS (real=false) sumiu');
  ok(r.economicoLimpo, 'econômico com pós viola §177.1');
  ok(errosPag.length === 0, `erros JS: ${errosPag.join(' | ')}`);
} catch (e) {
  falhas.push(`exceção: ${e.message}`);
} finally {
  await nav1?.close().catch(() => {});
  srv.close();
  rmSync(dir, { recursive: true, force: true });
}

console.log(`[pos3d-real] FALHAS: ${falhas.length ? falhas.join(' || ') : 'nenhuma'}`);
process.exit(falhas.length ? 1 : 0);
