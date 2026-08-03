#!/usr/bin/env node
// assets3d/gerar-thumbs-3d.mjs — THUMBS determinísticos (AS5 F5 · §508).
// @version 1.0.0  @created 2026-08-03
//
// Captura thumb.webp (128px, grade) e preview.webp (512px, drawer/hero) do
// modelo.lod0.glb de uma pasta PUBLICADA, com câmera/luz CANÔNICAS: mesma
// entrada → mesma imagem (§508). Renderiza em Chromium headless
// (SwiftShader — mesmo caminho da suíte) com uma página efêmera que importa
// three.module + GLTFLoader por import-map servidos do próprio repo.
//
// Uso: node scripts/avatar/assets3d/gerar-thumbs-3d.mjs <pasta-publicada>
//   [--porta 8907]  (o servidor estático efêmero sobe e cai sozinho)
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtempSync, rmSync } from 'node:fs';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');

const PAGINA = `<!doctype html><html><head><meta charset="utf-8">
<script type="importmap">{"imports":{
  "three": "/three/build/three.module.js",
  "three/addons/": "/three/examples/jsm/"
}}</script></head>
<body style="margin:0">
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// §508: TUDO canônico — nada de aleatório, nada de relógio
const LADO = 512;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true });
renderer.setSize(LADO, LADO);
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const cena = new THREE.Scene();
cena.background = new THREE.Color('#0d1017'); // fundo do estúdio
const luzChave = new THREE.DirectionalLight(0xffffff, 2.6); luzChave.position.set(2.2, 3.0, 2.6);
const luzPreencher = new THREE.DirectionalLight(0x9db4ff, 1.1); luzPreencher.position.set(-2.4, 1.2, -1.6);
cena.add(luzChave, luzPreencher, new THREE.AmbientLight(0xffffff, 0.55));

new GLTFLoader().load('/alvo/modelo.lod0.glb', (gltf) => {
  const objeto = gltf.scene;
  cena.add(objeto);
  // enquadramento canônico: caixa do modelo → câmera a 3/4 (frente-direita)
  const caixa = new THREE.Box3().setFromObject(objeto);
  const centro = caixa.getCenter(new THREE.Vector3());
  const tamanho = caixa.getSize(new THREE.Vector3());
  const maior = Math.max(tamanho.x, tamanho.y, tamanho.z);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 100);
  const d = maior * 1.9;
  camera.position.set(centro.x + d * 0.62, centro.y + d * 0.34, centro.z + d * 0.72);
  camera.lookAt(centro);
  renderer.render(cena, camera);
  window.__png512 = renderer.domElement.toDataURL('image/png');
  // thumb 128: re-render no mesmo canvas reduzido (nitidez > downscale css)
  renderer.setSize(128, 128);
  renderer.render(cena, camera);
  window.__png128 = renderer.domElement.toDataURL('image/png');
  window.__pronto = true;
}, undefined, (e) => { window.__erro = String(e && e.message || e); window.__pronto = true; });
</script></body></html>`;

const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.glb': 'model/gltf-binary', '.json': 'application/json', '.wasm': 'application/wasm' };

/** Servidor efêmero: /three/* (node_modules), /alvo/* (pasta do asset). */
function servir(pastaAlvo, porta) {
  const srv = createServer(async (req, res) => {
    try {
      const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
      let arquivo = null;
      if (url === '/' || url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(PAGINA);
        return;
      }
      if (url.startsWith('/three/')) arquivo = join(RAIZ, 'node_modules/three', url.slice(7));
      else if (url.startsWith('/alvo/')) arquivo = join(pastaAlvo, url.slice(6));
      if (!arquivo || !resolve(arquivo).startsWith(RAIZ) && !resolve(arquivo).startsWith(resolve(pastaAlvo))) {
        res.writeHead(404); res.end(); return;
      }
      const corpo = await readFile(arquivo);
      res.writeHead(200, { 'Content-Type': MIME[extname(arquivo)] ?? 'application/octet-stream' });
      res.end(corpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((ok) => srv.listen(porta, '127.0.0.1', () => ok(srv)));
}

/** PNG data-url → arquivo .webp (encode via canvas do PRÓPRIO navegador). */
async function pngParaWebp(pagina, dataUrl, destino, lado) {
  const webp = await pagina.evaluate(async ({ png, tam }) => {
    const img = new Image();
    await new Promise((r) => { img.onload = r; img.src = png; });
    const c = document.createElement('canvas');
    c.width = tam; c.height = tam;
    c.getContext('2d').drawImage(img, 0, 0, tam, tam);
    return c.toDataURL('image/webp', 0.9);
  }, { png: dataUrl, tam: lado });
  writeFileSync(destino, Buffer.from(webp.split(',')[1], 'base64'));
}

/** Gera thumb+preview na pasta publicada. Exportado p/ o teste. */
export async function gerarThumbs(pastaPublicada, { porta = 8907 } = {}) {
  const pasta = resolve(pastaPublicada);
  const { chromium } = await import('playwright-core');
  const srv = await servir(pasta, porta);
  let navegador = null;
  try {
    navegador = await chromium.launch({
      executablePath: process.env.PW_CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
      args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
    });
    const pagina = await (await navegador.newContext({ viewport: { width: 640, height: 640 } })).newPage();
    await pagina.goto(`http://127.0.0.1:${porta}/`, { waitUntil: 'networkidle' });
    await pagina.waitForFunction(() => window.__pronto === true, { timeout: 30000 });
    const erro = await pagina.evaluate(() => window.__erro ?? null);
    if (erro) throw new Error(`carregamento do GLB falhou: ${erro}`);
    const png512 = await pagina.evaluate(() => window.__png512);
    const png128 = await pagina.evaluate(() => window.__png128);
    if (!png512 || png512.length < 2000 || !png128 || png128.length < 800) {
      throw new Error('render vazio — canvas não produziu imagem');
    }
    await pngParaWebp(pagina, png512, join(pasta, 'preview.webp'), 512);
    await pngParaWebp(pagina, png128, join(pasta, 'thumb.webp'), 128);
    return { thumb: join(pasta, 'thumb.webp'), preview: join(pasta, 'preview.webp') };
  } finally {
    await navegador?.close().catch(() => {});
    srv.close();
  }
}

// ── CLI ─────────────────────────────────────────────────────────────
if (process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]))) {
  const pasta = process.argv[2];
  const porta = Number(process.argv[process.argv.indexOf('--porta') + 1]) || 8907;
  if (!pasta) { console.error('uso: gerar-thumbs-3d.mjs <pasta-publicada> [--porta N]'); process.exit(2); }
  gerarThumbs(pasta, { porta })
    .then((r) => console.log(`THUMBS_OK ${r.thumb} + ${r.preview}`))
    .catch((e) => { console.error(`✗ ${e.message}`); process.exit(1); });
}
