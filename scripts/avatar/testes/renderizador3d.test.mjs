// testes/renderizador3d.test.mjs — Renderizador3d do CONTRATO §401 (mega 6).
// @version 1.0.0  @created 2026-08-03
//
// Fluxo: manequim publicado on-the-fly (pipeline mega 5, sem thumbs) →
// esbuild bundla o Renderizador3d (three EXTERNAL, resolvido por
// import-map no navegador) → página efêmera + servidor próprio →
// asserções do contrato inteiro em Chromium/SwiftShader:
//   economico baixa lod2 · canvas pinta · definirQualidade('alto') troca
//   p/ lod0 a quente · capturar 256 devolve PNG · pausar congela · idle
//   mexe o esqueleto · pendências honestas · descartar limpa o DOM.
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
const PORTA = 8911;
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };
const dir = mkdtempSync(join(tmpdir(), 'avst-r3d-'));

// 1. manequim publicado (sem thumbs — o renderer não precisa delas)
const fonte = join(dir, 'manequim.glb');
await gerarManequim(fonte, { denso: true });
const pastaPub = join(dir, 'personagens', 'manequim_dev');
await publicarAsset({
  fonte, saida: pastaPub, id: 'manequim_dev', origem: 'manequim-procedural',
  comprovante: 'scripts/avatar/assets3d/gerar-manequim.mjs', data: '2026-08-03', log: () => {},
});

// 2. bundle do Renderizador3d (three external → import-map da página)
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

// 3. página + servidor efêmero (conta requests p/ provar o LOD por tier)
const PAGINA = `<!doctype html><html><head><meta charset="utf-8">
<script type="importmap">{"imports":{
  "three": "/three/build/three.module.js",
  "three/examples/jsm/loaders/GLTFLoader.js": "/three/examples/jsm/loaders/GLTFLoader.js",
  "three/examples/jsm/utils/SkeletonUtils.js": "/three/examples/jsm/utils/SkeletonUtils.js",
  "three/examples/jsm/controls/OrbitControls.js": "/three/examples/jsm/controls/OrbitControls.js"
}}</script></head><body style="margin:0">
<div id="palco" style="width:480px;height:480px"></div>
<script type="module" src="/bundle.js"></script></body></html>`;
const MIME = { '.js': 'text/javascript', '.glb': 'model/gltf-binary', '.json': 'application/json' };
const requests = [];
const srv = createServer(async (req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  requests.push(url);
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

// 4. navegador: contrato inteiro
const { chromium } = await import('playwright-core');
let navegador = null;
try {
  navegador = await chromium.launch({
    executablePath: process.env.PW_CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
  });
  const p = await (await navegador.newContext({ viewport: { width: 640, height: 640 } })).newPage();
  const errosPagina = [];
  p.on('pageerror', (e) => errosPagina.push(e.message.slice(0, 140)));
  await p.goto(`http://127.0.0.1:${PORTA}/`, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__bundlePronto === true, { timeout: 20000 });

  const resultado = await p.evaluate(async () => {
    const R = window.__Renderizador3d;
    const estado = window.__estadoVazio();
    estado.equipment = { cabelo: 'cab_moicano', aura: 'aur_neon' }; // pendências esperadas
    const r3d = new R();
    window.__r3d = r3d;
    await r3d.inicializar({ qualidade: 'economico', pixelRatioMax: 1 });
    await r3d.montar(document.getElementById('palco'));
    const aplicado = await r3d.aplicarEstado(estado);
    await new Promise((res) => setTimeout(res, 400)); // uns frames de idle
    const canvas = document.querySelector('#palco canvas');
    const captura = await r3d.capturar({ largura: 256, altura: 256 });
    return {
      id: r3d.id,
      aplicadoOk: aplicado.ok,
      pendencias: aplicado.pendencias,
      temCanvas: Boolean(canvas),
      capturaPng: captura.dataUri.startsWith('data:image/png') && captura.dataUri.length > 2000,
      capturaDim: `${captura.largura}x${captura.altura}`,
    };
  });
  ok(resultado.id === '3d', 'id do renderer deveria ser 3d');
  ok(resultado.aplicadoOk, 'aplicarEstado não retornou ok');
  ok(resultado.temCanvas, 'montar não criou canvas no alvo');
  ok(resultado.capturaPng && resultado.capturaDim === '256x256', 'capturar §508 não devolveu PNG 256');
  ok(resultado.pendencias.includes('cabelo') && resultado.pendencias.includes('aura'),
    `pendências honestas §481 erradas: ${JSON.stringify(resultado.pendencias)}`);
  ok(requests.some((u) => u.endsWith('modelo.lod2.glb')), 'economico deveria baixar o lod2');
  ok(!requests.some((u) => u.endsWith('modelo.lod0.glb')), 'lod0 não deveria ter sido baixado ainda');

  // qualidade a quente: alto → lod0 atravessa a rede
  await p.evaluate(async () => {
    window.__r3d.definirQualidade('alto');
    await new Promise((res) => setTimeout(res, 600));
  });
  ok(requests.some((u) => u.endsWith('modelo.lod0.glb')), 'definirQualidade(alto) deveria baixar o lod0');

  // idle procedural mexe o esqueleto; pausar CONGELA o quadro
  const idle = await p.evaluate(async () => {
    const antes = document.querySelector('#palco canvas').toDataURL();
    await new Promise((res) => setTimeout(res, 350));
    const depois = document.querySelector('#palco canvas').toDataURL();
    window.__r3d.pausar();
    await new Promise((res) => setTimeout(res, 200));
    const p1 = document.querySelector('#palco canvas').toDataURL();
    await new Promise((res) => setTimeout(res, 250));
    const p2 = document.querySelector('#palco canvas').toDataURL();
    return { mexeu: antes !== depois, congelou: p1 === p2 };
  });
  ok(idle.mexeu, 'idle procedural não alterou o quadro');
  ok(idle.congelou, 'pausar não congelou o quadro');

  // descartar limpa o DOM
  const limpou = await p.evaluate(async () => {
    await window.__r3d.descartar();
    return document.querySelectorAll('#palco canvas').length === 0;
  });
  ok(limpou, 'descartar não removeu o canvas');
  ok(errosPagina.length === 0, `erros JS na página: ${errosPagina.join(' | ')}`);
} catch (e) {
  falhas.push(`exceção: ${e.message}`);
} finally {
  await navegador?.close().catch(() => {});
  srv.close();
  rmSync(dir, { recursive: true, force: true });
}

console.log(`[renderizador3d] FALHAS: ${falhas.length ? falhas.join(' || ') : 'nenhuma'}`);
process.exit(falhas.length ? 1 : 0);
