#!/usr/bin/env node
// assets3d/clipping-qa.mjs — onda 1410 (MEGA_BRIEFING_01 §1124–§1134,
// §1220, §2653; herdado da 1409): CLIPPING QA SEMIAUTOMÁTICO em bind pose —
// para cada peça de roupa publicada, testa por RAYCAST DE PARIDADE quantos
// vértices da peça ficam DENTRO da malha do corpo (vértice da roupa sob a
// pele = corpo atravessa a roupa no runtime). Peça com `mascara` declarada
// oculta a região do corpo (§415.2) — penetração ali é esperada e vira só
// informação. Heurístico (bind pose, lod2, amostra de vértices): pega os
// casos grosseiros; o veredito fino em pose segue humano (VISUAL-QA §6).
// Saída determinística: docs/AVATAR-STUDIO-5/evidencias/clipping-3d.json.
// Uso: node scripts/avatar/assets3d/clipping-qa.mjs [--so <idParte>] [--porta 8919] [--json]
// @version 1.0.0  @created 2026-08-20
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const ASSETS3D = join(RAIZ, 'public', 'assets', 'avatars', '3d');
export const LIMITE_PCT_DENTRO = 5; // acima disto SEM máscara = flag

function paginaHtml() {
  return `<!doctype html><html><head><meta charset="utf-8">
<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script></head>
<body><script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const loader = new GLTFLoader();
const carregar = (u) => new Promise((ok, err) => loader.load(u, ok, undefined, err));
// paridade: nº ímpar de interseções do raio +X = ponto DENTRO da malha
function dentro(raycaster, malhas, ponto) {
  raycaster.set(ponto, new THREE.Vector3(1, 0, 0));
  raycaster.far = 10;
  let n = 0;
  for (const m of malhas) n += raycaster.intersectObject(m, false).length;
  return n % 2 === 1;
}
try {
  const base = await carregar('/base/modelo.lod2.glb');
  base.scene.updateMatrixWorld(true);
  const malhasBase = [];
  base.scene.traverse((o) => { if (o.isMesh || o.isSkinnedMesh) { o.material = new THREE.MeshBasicMaterial(); malhasBase.push(o); } });
  const parte = await carregar('/parte/modelo.lod2.glb');
  parte.scene.updateMatrixWorld(true);
  const raycaster = new THREE.Raycaster();
  let total = 0; let dentroN = 0; let yMin = Infinity; let yMax = -Infinity;
  const v = new THREE.Vector3();
  parte.scene.traverse((o) => {
    if (!(o.isMesh || o.isSkinnedMesh)) return;
    const pos = o.geometry?.attributes?.POSITION ?? o.geometry?.attributes?.position;
    if (!pos) return;
    const passo = Math.max(1, Math.floor(pos.count / 700)); // amostra ≤ ~700 vértices (raycast sem BVH)
    for (let i = 0; i < pos.count; i += passo) {
      v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      yMin = Math.min(yMin, v.y); yMax = Math.max(yMax, v.y);
      total += 1;
      if (dentro(raycaster, malhasBase, v)) dentroN += 1;
    }
  });
  window.__saida = { total, dentro: dentroN, pctDentro: total ? +(100 * dentroN / total).toFixed(2) : 0, yMin: +yMin.toFixed(3), yMax: +yMax.toFixed(3) };
  window.__pronto = true;
} catch (e) { window.__erro = String(e && e.message || e); window.__pronto = true; }
</script></body></html>`;
}

const MIME = { '.js': 'text/javascript', '.glb': 'model/gltf-binary' };
function servir({ base, parte }, porta, html) {
  const srv = createServer(async (req, res) => {
    try {
      const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
      if (url === '/') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(html); return; }
      let arquivo = null;
      if (url.startsWith('/three/')) arquivo = join(RAIZ, 'node_modules/three', url.slice(7));
      else if (url.startsWith('/base/')) arquivo = join(base, url.slice(6));
      else if (url.startsWith('/parte/')) arquivo = join(parte, url.slice(7));
      if (!arquivo) { res.writeHead(404); res.end(); return; }
      const corpo = await readFile(arquivo);
      res.writeHead(200, { 'Content-Type': MIME[extname(arquivo)] ?? 'application/octet-stream' });
      res.end(corpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((ok) => srv.listen(porta, '127.0.0.1', () => ok(srv)));
}

/** Base correspondente à peça (rig ubc-v1: _m_/_f_ no id). */
export function baseDaParte(id) {
  if (/_f(_|$)/.test(id)) return 'base_superhero_f';
  return 'base_superhero_m';
}

/** Avaliação pura (§415.2): flag só quando penetração ALTA sem máscara. */
export function avaliarClipping(medida, manifest) {
  const comMascara = Array.isArray(manifest.mascara) && manifest.mascara.length > 0;
  const flag = medida.pctDentro > LIMITE_PCT_DENTRO && !comMascara;
  return {
    ...medida, comMascara,
    veredito: flag ? 'flag' : medida.pctDentro > LIMITE_PCT_DENTRO ? 'ok_mascarado' : 'ok',
    ...(flag ? { nota: `${medida.pctDentro} % dos vértices dentro do corpo SEM máscara declarada — corpo atravessa a peça (§415.2)` } : {}),
  };
}

export async function clippingDaParte(pastaParte, { porta = 8919 } = {}) {
  const dir = resolve(pastaParte);
  const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
  const base = join(ASSETS3D, 'personagens', baseDaParte(manifest.id));
  const { chromium } = await import('playwright-core');
  const srv = await servir({ base, parte: dir }, porta, paginaHtml());
  let navegador = null;
  try {
    navegador = await chromium.launch({ executablePath: process.env.PW_CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
    const pagina = await (await navegador.newContext()).newPage();
    await pagina.goto(`http://127.0.0.1:${porta}/`, { waitUntil: 'networkidle' });
    await pagina.waitForFunction(() => window.__pronto === true, undefined, { timeout: 300000 });
    const erro = await pagina.evaluate(() => window.__erro ?? null);
    if (erro) throw new Error(`clipping falhou (${manifest.id}): ${erro}`);
    const medida = await pagina.evaluate(() => window.__saida);
    return { id: manifest.id, base: baseDaParte(manifest.id), ...avaliarClipping(medida, manifest) };
  } finally { await navegador?.close().catch(() => {}); srv.close(); }
}

if (process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]))) {
  const args = process.argv.slice(2);
  const val = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
  const so = val('--so', null);
  const porta = Number(val('--porta', 8919));
  const dir = join(ASSETS3D, 'partes');
  const pecas = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(dir, d.name, 'manifest.json')))
    .map((d) => ({ nome: d.name, m: JSON.parse(readFileSync(join(dir, d.name, 'manifest.json'), 'utf8')) }))
    .filter(({ m }) => m.tipo === 'parte_roupa' && (!so || m.id === so));
  const resultados = [];
  for (const p of pecas) {
    // eslint-disable-next-line no-await-in-loop
    resultados.push(await clippingDaParte(join(dir, p.nome), { porta }));
  }
  resultados.sort((a, b) => a.id.localeCompare(b.id));
  const rel = {
    gerado_por: 'scripts/avatar/assets3d/clipping-qa.mjs', limitePctDentro: LIMITE_PCT_DENTRO,
    resumo: { total: resultados.length, flags: resultados.filter((r) => r.veredito === 'flag').map((r) => r.id), mascarados: resultados.filter((r) => r.veredito === 'ok_mascarado').length },
    pecas: resultados,
  };
  if (!so) {
    const destino = join(RAIZ, 'docs', 'AVATAR-STUDIO-5', 'evidencias');
    mkdirSync(destino, { recursive: true });
    writeFileSync(join(destino, 'clipping-3d.json'), `${JSON.stringify(rel, null, 2)}\n`);
  }
  if (args.includes('--json')) { console.log(JSON.stringify(rel)); process.exit(0); }
  console.log(`CLIPPING: ${rel.resumo.total} peças · flags ${rel.resumo.flags.length} · mascaradas ${rel.resumo.mascarados}`);
  for (const r of resultados) console.log(`  ${r.veredito === 'flag' ? '△' : '✓'} ${r.id} [${r.base}] ${r.pctDentro} % dentro${r.comMascara ? ' (mascara)' : ''}${r.nota ? ` — ${r.nota}` : ''}`);
  if (!so) console.log('→ docs/AVATAR-STUDIO-5/evidencias/clipping-3d.json');
}
