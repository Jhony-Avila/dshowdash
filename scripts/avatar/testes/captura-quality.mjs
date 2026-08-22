// testes/captura-quality.mjs — lote 691–700 (§482–§483 + §506/§329,
// flags as5.quality3d_v2 + as5.captura3d_v2): QUALITY MANAGER v2 +
// CAPTURA ALTA.
//   A) CONTRATO: passoDpr §483 é suave (desce 15%, piso 70%, recupera,
//      estável na faixa média);
//   B) UI: perfis Ultra/Cine §482.1 no seletor; captura v2 §329.2 —
//      indicador §329.3 aparece e some, galeria recebe PNG 960 real
//      (LOD alto + supersampling §506) e o tier VOLTA ao que era;
//   C) rollback §651: flags off = 4 chips e captura antiga sem badge.
// @version 1.0.0  @created 2026-08-07
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const PORTA = 8922;
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── PARTE A: contrato passoDpr §483 ─────────────────────────────────
const dir = mkdtempSync(join(tmpdir(), 'avst-cq-'));
writeFileSync(join(dir, 'entrada.ts'), `
import { passoDpr } from '${PAINEL}/src/services/Renderizador3d';
(window as any).__passoDpr = passoDpr;
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
  "three/examples/jsm/loaders/GLTFLoader.js": "/three/examples/jsm/loaders/GLTFLoader.js",
  "three/examples/jsm/controls/OrbitControls.js": "/three/examples/jsm/controls/OrbitControls.js",
  "three/examples/jsm/environments/RoomEnvironment.js": "/three/examples/jsm/environments/RoomEnvironment.js",
  "three/examples/jsm/postprocessing/EffectComposer.js": "/three/examples/jsm/postprocessing/EffectComposer.js",
  "three/examples/jsm/postprocessing/RenderPass.js": "/three/examples/jsm/postprocessing/RenderPass.js",
  "three/examples/jsm/postprocessing/ShaderPass.js": "/three/examples/jsm/postprocessing/ShaderPass.js",
  "three/examples/jsm/postprocessing/UnrealBloomPass.js": "/three/examples/jsm/postprocessing/UnrealBloomPass.js",
  "three/examples/jsm/postprocessing/OutputPass.js": "/three/examples/jsm/postprocessing/OutputPass.js"
}}</script></head><body><script type="module" src="/bundle.js"></script></body></html>`;
const MIME = { '.js': 'text/javascript' };
const srv = createServer(async (req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  try {
    if (url === '/') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(PAGINA); return; }
    const arq = url === '/bundle.js' ? join(dir, 'bundle.js')
      : url.startsWith('/three/') ? join(RAIZ, 'node_modules/three', url.slice(7)) : null;
    if (!arq) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[extname(arq)] ?? 'application/octet-stream' });
    res.end(await readFile(arq));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => srv.listen(PORTA, '127.0.0.1', r));

const { chromium } = await import('playwright-core');
let nav1 = null;
try {
  nav1 = await chromium.launch({
    executablePath: process.env.PW_CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox'],
  });
  const p = await (await nav1.newContext()).newPage();
  const errosPag = [];
  p.on('pageerror', (e) => errosPag.push(e.message.slice(0, 140)));
  await p.goto(`http://127.0.0.1:${PORTA}/`, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__bundlePronto === true, { timeout: 20000 });
  const r = await p.evaluate(() => {
    const f = window.__passoDpr;
    const desce = f(20, 2, 2);
    let v = 2;
    for (let i = 0; i < 20; i += 1) v = f(20, v, 2); // queda contínua → piso
    const recupera = f(60, 1.4, 2);
    return {
      desce15: Math.abs(desce - 1.7) < 0.001,
      piso70: Math.abs(v - 1.4) < 0.001,
      recupera: recupera > 1.4 && recupera <= 2,
      estavel: f(40, 1.7, 2) === 1.7,
      nuncaAcimaDaBase: f(60, 2, 2) === 2,
    };
  });
  ok(r.desce15, 'passoDpr não desceu 15% com FPS baixo (§483)');
  ok(r.piso70, 'passoDpr furou o piso de 70% da base (§483)');
  ok(r.recupera, 'passoDpr não recuperou com folga (§483)');
  ok(r.estavel, 'passoDpr mexeu na faixa estável (§483 — sem mudanças abruptas)');
  ok(r.nuncaAcimaDaBase, 'passoDpr passou da base (§483)');
  ok(errosPag.length === 0, `erros JS no contrato: ${errosPag.join(' | ')}`);
} catch (e) {
  falhas.push(`exceção no contrato: ${e.message}`);
} finally {
  await nav1?.close().catch(() => {});
  srv.close();
  rmSync(dir, { recursive: true, force: true });
}

// ── PARTE B: UI (flags ON) ──────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 }, webgl: true,
    init: () => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': true }));
      localStorage.setItem('dshow.avst5.p3d.qualidade.v1', 'medio');
    },
  });
  try {
    await p.emulateMedia({ reducedMotion: 'reduce' });
    await irParaHarness(p, 'avst-harness.html', 1200);
    await p.locator('[data-teste="botao-3d"]').click();
    await p.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 30000 });
    await p.waitForTimeout(3000);
    // §482.1: 6 chips (4 base + Ultra + Cine)
    ok(await p.locator('[data-teste="p3d-qualidade"] .avst5-p3d-chip').count() === 6,
      'esperava 6 chips de qualidade com quality_v2 (§482.1)');
    await p.evaluate(() => document.querySelector('[data-teste="p3d-perfil-cine"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    await p.waitForTimeout(2500);
    ok(await p.locator('[data-teste="p3d-perfil-cine"][aria-checked="true"]').count() === 1, 'perfil Cine não marcou');
    // volta ao médio p/ forçar o caminho "LOD alto" da captura v2
    await p.evaluate(() => { [...document.querySelectorAll('[data-teste="p3d-qualidade"] .avst5-p3d-chip')].find((c) => c.textContent.trim() === 'Média')?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await p.waitForTimeout(3000);
    // §329.2/3: captura v2 mostra o indicador e entrega PNG 960 na galeria
    await p.waitForSelector('[data-teste="p3d-capturar"]', { timeout: 10000 });
    void p.evaluate(() => document.querySelector('[data-teste="p3d-capturar"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    const viuFase = await p.waitForSelector('[data-teste="p3d-captura-fase"]', { timeout: 15000 })
      .then(() => true).catch(() => false);
    ok(viuFase, 'indicador §329.3 não apareceu na captura v2');
    await p.waitForFunction(() => !document.querySelector('[data-teste="p3d-captura-fase"]'), { timeout: 30000 }).catch(() => {});
    const galeria = await p.waitForSelector('[data-teste="p3d-capturas"] img', { timeout: 10000 })
      .then(() => true).catch(() => false);
    ok(galeria, 'galeria não recebeu a captura v2');
    if (galeria) {
      const m = await p.evaluate(() => new Promise((resolve) => {
        const src = document.querySelector('[data-teste="p3d-capturas"] img')?.getAttribute('src') ?? '';
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, png: src.startsWith('data:image/png') });
        img.onerror = () => resolve({ w: 0, png: false });
        img.src = src;
      }));
      ok(m.w === 960 && m.png, `captura v2 fora do contrato (${m.w}px png=${m.png})`);
    }
    // tier VOLTOU ao que era (§329.2 passo final)
    await p.waitForTimeout(1500);
    ok(await p.evaluate(() => [...document.querySelectorAll('[data-teste="p3d-qualidade"] .avst5-p3d-chip')].find((c) => c.textContent.trim() === 'Média')?.getAttribute('aria-checked')) === 'true',
      'tier não voltou ao anterior após a captura (§329.2)');
    await p.screenshot({ path: `${SAIDA}/captura-quality.png` });
    ok(erros.length === 0, `erros de página (UI): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção na UI: ${e.message}`); }
  await b.close();
}

// ── PARTE C: rollback §651 (flags OFF) ──────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 }, webgl: true,
    init: () => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({
        'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': true,
        'as5.quality3d_v2': false, 'as5.captura3d_v2': false,
      }));
      localStorage.setItem('dshow.avst5.p3d.qualidade.v1', 'medio');
    },
  });
  try {
    await p.emulateMedia({ reducedMotion: 'reduce' });
    await irParaHarness(p, 'avst-harness.html', 1200);
    await p.locator('[data-teste="botao-3d"]').click();
    await p.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 30000 });
    await p.waitForTimeout(3000);
    ok(await p.locator('[data-teste="p3d-qualidade"] .avst5-p3d-chip').count() === 4,
      'flag off deveria manter os 4 chips (§651)');
    void p.evaluate(() => document.querySelector('[data-teste="p3d-capturar"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    const viuFase = await p.waitForSelector('[data-teste="p3d-captura-fase"]', { timeout: 4000 })
      .then(() => true).catch(() => false);
    ok(!viuFase, 'flag off mas o indicador §329.3 apareceu (§651)');
    const galeria = await p.waitForSelector('[data-teste="p3d-capturas"] img', { timeout: 10000 })
      .then(() => true).catch(() => false);
    ok(galeria, 'captura ANTIGA parou de funcionar com a flag off');
    ok(erros.length === 0, `erros de página (rollback): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção no rollback: ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('FALHAS captura-quality:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('captura-quality OK');
