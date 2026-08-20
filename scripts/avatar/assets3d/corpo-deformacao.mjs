#!/usr/bin/env node
// assets3d/corpo-deformacao.mjs — onda 1410 (MEGA_BRIEFING_01 §238–§244,
// §400, §432, §2637–§2650; herdado da 1409): DEFORMAÇÃO DO CORPO em poses —
// A–H = 8 amostras uniformes de um clipe (embutido no GLB ou de um
// pacote_animacoes UAL retargetado por NOME de bone, rig ubc-v1) + TESTE EM
// MOVIMENTO (3 frames distintos = a animação realmente move o corpo).
// Por pose: minY (pés sob o chão §400), altura do bbox, pixels da silhueta;
// flags automáticas: pes_sob_o_chao (minY < −2 cm), colapso (silhueta < 30 %
// da pose A), altura anômala (> ±45 %). Renders clay ficam fora do git;
// métricas determinísticas → docs/AVATAR-STUDIO-5/evidencias/deformacao-3d.json.
// Uso: node scripts/avatar/assets3d/corpo-deformacao.mjs <pasta-base>
//   [--pacote public/assets/avatars/3d/animacoes/ual_basico] [--clipe Nome]
//   [--saida dir] [--porta 8918] [--json]
// @version 1.0.0  @created 2026-08-20
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
export const POSES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function paginaHtml({ lado, clipe }) {
  return `<!doctype html><html><head><meta charset="utf-8">
<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script></head>
<body style="margin:0"><script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const LADO = ${lado};
const CLIPE = ${JSON.stringify(clipe)};
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(LADO, LADO); renderer.setPixelRatio(1);
document.body.appendChild(renderer.domElement);
const cena = new THREE.Scene(); cena.background = new THREE.Color('#ffffff');
cena.add(new THREE.AmbientLight(0xffffff, 1.2));
const clay = new THREE.MeshBasicMaterial({ color: 0x000000 }); // silhueta basta p/ as métricas
const loader = new GLTFLoader();
const carregar = (u) => new Promise((ok, err) => loader.load(u, ok, undefined, err));
function pixels() {
  const c = document.createElement('canvas'); c.width = LADO; c.height = LADO;
  c.getContext('2d').drawImage(renderer.domElement, 0, 0);
  const d = c.getContext('2d').getImageData(0, 0, LADO, LADO).data;
  let n = 0; const m = new Uint8Array(LADO * LADO);
  for (let i = 0; i < LADO * LADO; i += 1) { if (d[i * 4] < 128) { n += 1; m[i] = 1; } }
  return { n, m };
}
const iou = (a, b) => { let i2 = 0, u = 0; for (let i = 0; i < a.length; i += 1) { if (a[i] && b[i]) i2 += 1; if (a[i] || b[i]) u += 1; } return u ? i2 / u : 1; };
try {
  const base = await carregar('/base/modelo.lod0.glb');
  const obj = base.scene; cena.add(obj);
  obj.traverse((o) => { if (o.isSkinnedMesh) o.frustumCulled = false; });
  cena.overrideMaterial = clay;
  let clipes = base.animations ?? [];
  if (${JSON.stringify(true)} && !clipes.length) {
    const pac = await carregar('/pacote/pacote.glb').catch(() => null);
    if (pac) clipes = pac.animations ?? []; // retarget por NOME de bone (§432/§436 — rig ubc-v1)
  }
  const clip = CLIPE ? clipes.find((c) => c.name === CLIPE) : (clipes.find((c) => /walk|idle/i.test(c.name)) ?? clipes[0]);
  if (!clip) throw new Error('nenhum clipe disponível (nem embutido nem pacote)');
  const mixer = new THREE.AnimationMixer(obj);
  mixer.clipAction(clip).play();
  // câmera fixa pela CAIXA DO BIND POSE (as poses variam dentro dela)
  obj.updateMatrixWorld(true);
  const caixa0 = new THREE.Box3().setFromObject(obj);
  const centro = caixa0.getCenter(new THREE.Vector3());
  const maior = Math.max(...caixa0.getSize(new THREE.Vector3()).toArray());
  const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 100);
  camera.position.set(centro.x, centro.y + maior * 0.18, centro.z + maior * 2.1);
  camera.lookAt(centro);
  const poses = [];
  const renders = {};
  for (let i = 0; i < 8; i += 1) {
    const t = (clip.duration * i) / 8;
    mixer.setTime(t);
    obj.updateMatrixWorld(true);
    renderer.render(cena, camera);
    const { n, m } = pixels();
    // bbox da POSE (SkinnedMesh precisa do boundingBox por geometria posada)
    const caixa = new THREE.Box3();
    obj.traverse((o) => { if (o.isSkinnedMesh) { o.computeBoundingBox(); caixa.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld)); } });
    if (caixa.isEmpty()) caixa.copy(caixa0);
    poses.push({ pose: 'ABCDEFGH'[i], t: +t.toFixed(3), pixels: n, minY: +caixa.min.y.toFixed(4), altura: +(caixa.max.y - caixa.min.y).toFixed(4), mascara: Array.from(m) });
    renders['pose_' + 'ABCDEFGH'[i]] = renderer.domElement.toDataURL('image/png');
  }
  // teste em movimento (§432): 3 frames têm de DIFERIR entre si
  const [pA, pD, pG] = [poses[0], poses[3], poses[6]];
  const movimento = {
    clipe: clip.name, duracao: +clip.duration.toFixed(3),
    iou_A_D: +iou(Uint8Array.from(pA.mascara), Uint8Array.from(pD.mascara)).toFixed(4),
    iou_A_G: +iou(Uint8Array.from(pA.mascara), Uint8Array.from(pG.mascara)).toFixed(4),
  };
  for (const p of poses) delete p.mascara;
  window.__saida = { poses, movimento, renders };
  window.__pronto = true;
} catch (e) { window.__erro = String(e && e.message || e); window.__pronto = true; }
</script></body></html>`;
}

const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.glb': 'model/gltf-binary', '.json': 'application/json' };
function servir({ base, pacote }, porta, html) {
  const srv = createServer(async (req, res) => {
    try {
      const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
      if (url === '/') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(html); return; }
      let arquivo = null;
      if (url.startsWith('/three/')) arquivo = join(RAIZ, 'node_modules/three', url.slice(7));
      else if (url.startsWith('/base/')) arquivo = join(base, url.slice(6));
      else if (url.startsWith('/pacote/') && pacote) arquivo = join(pacote, url.slice(8));
      if (!arquivo) { res.writeHead(404); res.end(); return; }
      const corpo = await readFile(arquivo);
      res.writeHead(200, { 'Content-Type': MIME[extname(arquivo)] ?? 'application/octet-stream' });
      res.end(corpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((ok) => srv.listen(porta, '127.0.0.1', () => ok(srv)));
}

/** Avaliação pura das poses → flags (§400). Exportada p/ o teste. */
export function avaliarPoses(poses, movimento) {
  const flags = [];
  const ref = poses[0];
  for (const p of poses) {
    if (p.minY < -0.02) flags.push(`pose ${p.pose}: pés ${(-p.minY * 100).toFixed(1)} cm sob o chão (§400)`);
    if (ref.pixels > 0 && p.pixels < ref.pixels * 0.3) flags.push(`pose ${p.pose}: silhueta colapsou (${p.pixels} px < 30 % da pose A)`);
    if (ref.altura > 0 && Math.abs(p.altura - ref.altura) > ref.altura * 0.45) flags.push(`pose ${p.pose}: altura anômala (${p.altura} vs ${ref.altura} m)`);
  }
  if (movimento && movimento.iou_A_D > 0.995 && movimento.iou_A_G > 0.995) flags.push(`clipe "${movimento.clipe}" não move o corpo (3 frames idênticos — retarget §432 quebrado?)`);
  return { flags, ok: flags.length === 0 };
}

export async function deformacao(pastaBase, { pacote = null, clipe = null, saida = null, lado = 384, porta = 8918, gravarPng = true } = {}) {
  const base = resolve(pastaBase);
  const manifest = JSON.parse(readFileSync(join(base, 'manifest.json'), 'utf8'));
  const html = paginaHtml({ lado, clipe });
  const { chromium } = await import('playwright-core');
  const srv = await servir({ base, pacote: pacote ? resolve(pacote) : null }, porta, html);
  let navegador = null;
  try {
    navegador = await chromium.launch({ executablePath: process.env.PW_CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
    const pagina = await (await navegador.newContext({ viewport: { width: lado + 64, height: lado + 64 } })).newPage();
    await pagina.goto(`http://127.0.0.1:${porta}/`, { waitUntil: 'networkidle' });
    await pagina.waitForFunction(() => window.__pronto === true, undefined, { timeout: 300000 });
    const erro = await pagina.evaluate(() => window.__erro ?? null);
    if (erro) throw new Error(`deformação falhou: ${erro}`);
    const res = await pagina.evaluate(() => window.__saida);
    const destino = resolve(saida ?? join(RAIZ, 'scripts', 'avatar', 'testes', 'saida', 'deformacao', manifest.id));
    mkdirSync(destino, { recursive: true });
    if (gravarPng) for (const [nome, data] of Object.entries(res.renders)) writeFileSync(join(destino, `${manifest.id}_${nome}.png`), Buffer.from(data.split(',')[1], 'base64'));
    const aval = avaliarPoses(res.poses, res.movimento);
    return { id: manifest.id, rig: manifest.rig ?? null, ...res, renders: undefined, ...aval, destino };
  } finally { await navegador?.close().catch(() => {}); srv.close(); }
}

if (process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]))) {
  const args = process.argv.slice(2);
  const pasta = args.find((a) => !a.startsWith('--'));
  const val = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
  if (!pasta) { console.error('uso: corpo-deformacao.mjs <pasta-base> [--pacote dir] [--clipe Nome] [--saida dir] [--porta N] [--json]'); process.exit(2); }
  deformacao(pasta, { pacote: val('--pacote', null), clipe: val('--clipe', null), saida: val('--saida', null), porta: Number(val('--porta', 8918)) })
    .then((r) => {
      const destino = join(RAIZ, 'docs', 'AVATAR-STUDIO-5', 'evidencias');
      mkdirSync(destino, { recursive: true });
      const arq = join(destino, 'deformacao-3d.json');
      const atual = existsSync(arq) ? JSON.parse(readFileSync(arq, 'utf8')) : { gerado_por: 'scripts/avatar/assets3d/corpo-deformacao.mjs', bases: {} };
      atual.bases[r.id] = { rig: r.rig, clipe: r.movimento.clipe, poses: r.poses, movimento: r.movimento, flags: r.flags, ok: r.ok };
      writeFileSync(arq, `${JSON.stringify(atual, null, 2)}\n`);
      if (args.includes('--json')) { console.log(JSON.stringify(r)); return; }
      console.log(`DEFORMACAO_${r.ok ? 'OK' : 'FLAGS'} ${r.id} · clipe ${r.movimento.clipe} · IoU A×D ${r.movimento.iou_A_D} / A×G ${r.movimento.iou_A_G}`);
      for (const f of r.flags) console.log(`  △ ${f}`);
      console.log(`→ evidencias/deformacao-3d.json + renders em ${r.destino}`);
    })
    .catch((e) => { console.error(`✗ ${e.message}`); process.exit(1); });
}
