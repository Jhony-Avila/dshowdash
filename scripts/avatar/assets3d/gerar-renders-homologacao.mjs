#!/usr/bin/env node
// assets3d/gerar-renders-homologacao.mjs — onda 1409 (MEGA_BRIEFING_01 §34,
// §64, §99–§101, §141–§146, §188–§190, §304–§306, §329, §2630–§2636, §2656–
// §2662; decisões #158/#161): RENDERS DE HOMOLOGAÇÃO padronizados de um asset
// PUBLICADO (personagem ou parte), fora da UI — mesma página efêmera do
// gerar-thumbs-3d.mjs (three + GLTFLoader, SwiftShader, look estudio@1:
// ACES + RoomEnvironment 0.55 + luzes canônicas), câmera canônica por
// ÂNGULO (front, 34, profile, back) e por MODO (normal, clay, silhueta,
// wireframe), por LOD. Produz PNGs + metricas.json:
//   · bbox/altura/largura de ombros (bones clavicle_l/r quando ubc-v1)/
//     cabeça (bone Head/head) → "Proportion Sheet" mensurável (§188/§343)
//   · silhueta: IoU entre LOD0 e cada LOD (máscara alpha do render) — gate
//     §2630–§2636 (fail se < 0,92 no validador, 1409)
//   · triângulos/materiais por LOD (renderer.info)
// PNGs ficam FORA do git (storage/visual-qa/<id>/ ou --saida); só métricas
// entram em docs/AVATAR-STUDIO-5/evidencias quando o caller quiser.
//
// Uso: node scripts/avatar/assets3d/gerar-renders-homologacao.mjs <pasta-publicada>
//   [--angulos front,34,profile,back] [--modos normal,clay,silhueta] [--lods 0,1,2]
//   [--saida storage/visual-qa/<id>] [--lado 512] [--porta 8911] [--json]
// @version 1.0.0  @created 2026-08-19
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
export const ANGULOS = { front: 0, '34': Math.PI / 4, profile: Math.PI / 2, back: Math.PI };
export const MODOS = ['normal', 'clay', 'silhueta', 'wireframe'];

function paginaHtml({ angulos, modos, lods, lado }) {
  return `<!doctype html><html><head><meta charset="utf-8">
<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script></head>
<body style="margin:0"><script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
const LADO = ${lado};
const ANGULOS = ${JSON.stringify(angulos)};
const MODOS = ${JSON.stringify(modos)};
const LODS = ${JSON.stringify(lods)};
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true });
renderer.setSize(LADO, LADO); renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);
const cena = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
cena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
cena.environmentIntensity = 0.55;
const chave = new THREE.DirectionalLight(0xffffff, 2.6); chave.position.set(2.2, 3.0, 2.6);
const fill = new THREE.DirectionalLight(0x9db4ff, 1.1); fill.position.set(-2.4, 1.2, -1.6);
cena.add(chave, fill, new THREE.AmbientLight(0xffffff, 0.55));
const FUNDO = { normal: '#2e2e2e', clay: '#2e2e2e', silhueta: '#ffffff', wireframe: '#0d1017' };
const MAT = {
  clay: new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.85, metalness: 0 }),
  silhueta: new THREE.MeshBasicMaterial({ color: 0x000000 }),
  wireframe: new THREE.MeshBasicMaterial({ color: 0x7c9cff, wireframe: true }),
};
const saida = { renders: {}, metricas: { lods: {}, landmarks: null } };
const loader = new GLTFLoader();
function carregar(url) { return new Promise((ok, err) => loader.load(url, ok, undefined, err)); }
function mascara() {
  const c = document.createElement('canvas'); c.width = LADO; c.height = LADO;
  c.getContext('2d').drawImage(renderer.domElement, 0, 0);
  const d = c.getContext('2d').getImageData(0, 0, LADO, LADO).data;
  const m = new Uint8Array(LADO * LADO);
  for (let i = 0; i < LADO * LADO; i += 1) m[i] = d[i * 4] < 128 ? 1 : 0; // preto = personagem (fundo branco)
  return m;
}
function iou(a, b) { let inter = 0, uni = 0; for (let i = 0; i < a.length; i += 1) { if (a[i] && b[i]) inter += 1; if (a[i] || b[i]) uni += 1; } return uni ? inter / uni : 1; }
try {
  const mascarasLod0 = {};
  for (const lod of LODS) {
    const gltf = await carregar('/alvo/modelo.lod' + lod + '.glb');
    const obj = gltf.scene; cena.add(obj);
    const caixa = new THREE.Box3().setFromObject(obj);
    const centro = caixa.getCenter(new THREE.Vector3());
    const tam = caixa.getSize(new THREE.Vector3());
    const maior = Math.max(tam.x, tam.y, tam.z);
    const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 100);
    // landmarks do rig (Proportion Sheet §188/§343) — só no lod0
    if (lod === LODS[0]) {
      obj.updateMatrixWorld(true);
      const pos = (n) => { let p = null; obj.traverse((o) => { if (o.isBone && o.name === n) p = o.getWorldPosition(new THREE.Vector3()); }); return p ? [+p.x.toFixed(4), +p.y.toFixed(4), +p.z.toFixed(4)] : null; };
      const head = pos('Head') || pos('head'); const neck = pos('neck_01') || pos('Neck');
      const cl = pos('upperarm_l') || pos('clavicle_l') || pos('LeftArm') || pos('LeftShoulder'); const cr = pos('upperarm_r') || pos('clavicle_r') || pos('RightArm') || pos('RightShoulder');
      const pelvis = pos('pelvis') || pos('Hips'); const hl = pos('hand_l') || pos('LeftHand'); const fl = pos('foot_l') || pos('LeftFoot');
      const ombros = cl && cr ? +Math.hypot(cl[0] - cr[0], cl[1] - cr[1], cl[2] - cr[2]).toFixed(4) : null;
      const hr = pos('hand_r') || pos('RightHand'); const ir = pos('index_01_r') || pos('RightHandIndex1');
      saida.metricas.landmarks = { altura: +tam.y.toFixed(4), largura: +tam.x.toFixed(4), profundidade: +tam.z.toFixed(4),
        head, neck, ombro_l: cl, ombro_r: cr, pelvis, hand_l: hl, foot_l: fl, larguraOmbros: ombros,
        maoAteIndicador: hr && ir ? +Math.hypot(hr[0] - ir[0], hr[1] - ir[1], hr[2] - ir[2]).toFixed(4) : null,
        // cabeças na altura: bone Head fica na BASE da cabeça → altura da cabeça ≈ topo − head.y
        cabecasNaAltura: head ? +(tam.y / Math.max(0.01, caixa.max.y - head[1])).toFixed(2) : null,
        minY: +caixa.min.y.toFixed(4) };
    }
    for (const [angNome, az] of Object.entries(ANGULOS)) {
      const d = maior * 1.9;
      camera.position.set(centro.x + d * Math.sin(az) * 0.92, centro.y + d * 0.18, centro.z + d * Math.cos(az) * 0.92);
      camera.lookAt(centro);
      for (const modo of MODOS) {
        cena.background = new THREE.Color(FUNDO[modo]);
        cena.overrideMaterial = MAT[modo] ?? null;
        renderer.render(cena, camera);
        const nome = 'lod' + lod + '_' + angNome + '_' + modo;
        saida.renders[nome] = renderer.domElement.toDataURL('image/png');
        if (modo === 'silhueta') {
          const m = mascara();
          if (lod === LODS[0]) mascarasLod0[angNome] = m;
          else saida.metricas.lods['lod' + lod] = { ...(saida.metricas.lods['lod' + lod] ?? {}), ['iou_' + angNome]: +iou(mascarasLod0[angNome], m).toFixed(4) };
        }
      }
    }
    cena.overrideMaterial = null;
    renderer.render(cena, camera);
    saida.metricas.lods['lod' + lod] = { ...(saida.metricas.lods['lod' + lod] ?? {}), triangulos: renderer.info.render.triangles, drawCalls: renderer.info.render.calls, texturas: renderer.info.memory.textures, geometrias: renderer.info.memory.geometries };
    cena.remove(obj);
    obj.traverse((o) => { if (o.isMesh) { o.geometry?.dispose(); const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach((m) => { if (!m) return; for (const k of ['map','normalMap','roughnessMap','metalnessMap','aoMap','emissiveMap','alphaMap']) m[k]?.dispose?.(); m.dispose?.(); }); } });
    renderer.info.reset();
  }
  window.__saida = saida; window.__pronto = true;
} catch (e) { window.__erro = String(e && e.message || e); window.__pronto = true; }
</script></body></html>`;
}

const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.glb': 'model/gltf-binary', '.json': 'application/json' };
function servir(pastaAlvo, porta, html) {
  const srv = createServer(async (req, res) => {
    try {
      const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
      if (url === '/' || url === '/index.html') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(html); return; }
      let arquivo = null;
      if (url.startsWith('/three/')) arquivo = join(RAIZ, 'node_modules/three', url.slice(7));
      else if (url.startsWith('/alvo/')) arquivo = join(pastaAlvo, url.slice(6));
      if (!arquivo || (!resolve(arquivo).startsWith(RAIZ) && !resolve(arquivo).startsWith(resolve(pastaAlvo)))) { res.writeHead(404); res.end(); return; }
      const corpo = await readFile(arquivo);
      res.writeHead(200, { 'Content-Type': MIME[extname(arquivo)] ?? 'application/octet-stream' });
      res.end(corpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((ok) => srv.listen(porta, '127.0.0.1', () => ok(srv)));
}

/** Gera renders + metricas.json. Exportado p/ testes e p/ o corpo-benchmark. */
export async function gerarRendersHomologacao(pastaPublicada, { angulos = ['front', '34', 'profile', 'back'], modos = ['normal', 'clay', 'silhueta'], lods = [0, 1, 2], saida = null, lado = 512, porta = 8911, gravarPng = true } = {}) {
  const pasta = resolve(pastaPublicada);
  const manifest = JSON.parse(readFileSync(join(pasta, 'manifest.json'), 'utf8'));
  const destino = resolve(saida ?? join(RAIZ, 'storage', 'visual-qa', manifest.id));
  mkdirSync(destino, { recursive: true });
  const angs = Object.fromEntries(angulos.filter((a) => a in ANGULOS).map((a) => [a, ANGULOS[a]]));
  const html = paginaHtml({ angulos: angs, modos: modos.filter((m) => MODOS.includes(m)), lods, lado });
  const { chromium } = await import('playwright-core');
  const srv = await servir(pasta, porta, html);
  let navegador = null;
  try {
    navegador = await chromium.launch({ executablePath: process.env.PW_CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
    const pagina = await (await navegador.newContext({ viewport: { width: lado + 64, height: lado + 64 } })).newPage();
    await pagina.goto(`http://127.0.0.1:${porta}/`, { waitUntil: 'networkidle' });
    await pagina.waitForFunction(() => window.__pronto === true, { timeout: 120000 });
    const erro = await pagina.evaluate(() => window.__erro ?? null);
    if (erro) throw new Error(`render falhou: ${erro}`);
    const res = await pagina.evaluate(() => window.__saida);
    const arquivos = [];
    for (const [nome, data] of Object.entries(res.renders)) {
      if (!gravarPng) continue;
      const arq = join(destino, `${manifest.id}_v${manifest.versao}_${nome}.png`);
      writeFileSync(arq, Buffer.from(data.split(',')[1], 'base64'));
      arquivos.push(arq);
    }
    const metricas = { id: manifest.id, versao: manifest.versao, tipo: manifest.tipo, look: 'estudio@1', lado, angulos: Object.keys(angs), modos, ...res.metricas };
    writeFileSync(join(destino, 'metricas.json'), `${JSON.stringify(metricas, null, 2)}\n`);
    return { destino, arquivos, metricas };
  } finally { await navegador?.close().catch(() => {}); srv.close(); }
}

if (process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]))) {
  const args = process.argv.slice(2);
  const pasta = args.find((a) => !a.startsWith('--'));
  const val = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
  if (!pasta) { console.error('uso: gerar-renders-homologacao.mjs <pasta-publicada> [--angulos a,b] [--modos m,n] [--lods 0,1,2] [--saida dir] [--lado 512] [--porta N] [--json]'); process.exit(2); }
  gerarRendersHomologacao(pasta, {
    angulos: val('--angulos', 'front,34,profile,back').split(','), modos: val('--modos', 'normal,clay,silhueta').split(','),
    lods: val('--lods', '0,1,2').split(',').map(Number), saida: val('--saida', null), lado: Number(val('--lado', 512)), porta: Number(val('--porta', 8911)),
  }).then((r) => {
    if (args.includes('--json')) console.log(JSON.stringify(r.metricas));
    else { console.log(`HOMOLOGACAO_OK ${r.arquivos.length} renders em ${r.destino}`); console.log(JSON.stringify(r.metricas.lods)); if (r.metricas.landmarks) console.log(`landmarks: ${JSON.stringify(r.metricas.landmarks)}`); }
  }).catch((e) => { console.error(`✗ ${e.message}`); process.exit(1); });
}
