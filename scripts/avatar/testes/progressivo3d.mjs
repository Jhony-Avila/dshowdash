// testes/progressivo3d.mjs — lote 681–690 (§461–§478, flag
// as5.progressivo3d): LOD/PROGRESSIVO.
//   A) CONTRATO (CacheAssets3d §475): roundtrip IDB, imutável por hash,
//      invalidação por hash novo, buscarComCache NÃO volta à rede;
//   B) UI: fases §472 aparecem na troca (badge some no fim); §475 povoa
//      o IndexedDB com chaves por hash; §473 troca rápida não erra nem
//      trava; §462 tela pequena rebaixa o tier (HUD mostra economico);
//   C) rollback §651: flag off = sem badge, sem IDB, tier fixo intacto.
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
const PORTA = 8921;
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── PARTE A: contrato do cache §475 ─────────────────────────────────
const dir = mkdtempSync(join(tmpdir(), 'avst-prog-'));
writeFileSync(join(dir, 'entrada.ts'), `
import { buscarComCache, chaveCache, gravarCache, lerCache } from '${PAINEL}/src/services/CacheAssets3d';
(window as any).__buscar = buscarComCache;
(window as any).__chave = chaveCache;
(window as any).__gravar = gravarCache;
(window as any).__ler = lerCache;
(window as any).__bundlePronto = true;
`);
const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')]
  .find((c) => existsSync(c)) ?? 'esbuild';
execSync(`"${esbuild}" "${join(dir, 'entrada.ts')}" --bundle --format=esm ` +
  `--outfile="${join(dir, 'bundle.js')}"`, { stdio: 'pipe' });
let hitsDado = 0;
const srv = createServer(async (req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  try {
    if (url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<!doctype html><html><head><meta charset="utf-8"></head><body><script type="module" src="/bundle.js"></script></body></html>');
      return;
    }
    if (url === '/dado.bin') {
      hitsDado += 1;
      res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
      res.end(Buffer.from([7, 7, 7, 7, 42]));
      return;
    }
    if (url === '/bundle.js') {
      res.writeHead(200, { 'Content-Type': 'text/javascript' });
      res.end(await readFile(join(dir, 'bundle.js')));
      return;
    }
    res.writeHead(404); res.end();
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
  const r = await p.evaluate(async () => {
    const saida = {};
    const bytes = new Uint8Array([1, 2, 3, 4]).buffer;
    // roundtrip §475
    await window.__gravar(window.__chave('/a.glb', 'h1'), bytes, true);
    const lido = await window.__ler(window.__chave('/a.glb', 'h1'));
    saida.roundtrip = !!lido && new Uint8Array(lido)[3] === 4;
    // invalidação POR HASH: hash novo = chave nova = miss
    saida.invalidaPorHash = (await window.__ler(window.__chave('/a.glb', 'h2'))) === null;
    // buscarComCache: 2ª chamada NÃO volta à rede (o servidor conta)
    const b1 = await window.__buscar('/dado.bin', 'hx');
    const b2 = await window.__buscar('/dado.bin', 'hx');
    saida.bytesOk = new Uint8Array(b1)[4] === 42 && new Uint8Array(b2)[4] === 42;
    return saida;
  });
  ok(r.roundtrip, 'roundtrip do cache §475 falhou');
  ok(r.invalidaPorHash, 'hash novo deveria invalidar (miss) — §475');
  ok(r.bytesOk, 'buscarComCache devolveu bytes errados');
  await p.waitForTimeout(400); // gravação assíncrona assenta
  ok(hitsDado === 1, `2ª busca voltou à rede (${hitsDado} hits — deveria ser 1) §475`);
  ok(errosPag.length === 0, `erros JS no contrato: ${errosPag.join(' | ')}`);
} catch (e) {
  falhas.push(`exceção no contrato: ${e.message}`);
} finally {
  await nav1?.close().catch(() => {});
  srv.close();
  rmSync(dir, { recursive: true, force: true });
}

// ── helpers UI ──────────────────────────────────────────────────────
const abrirPalco = async (p) => {
  await p.emulateMedia({ reducedMotion: 'reduce' });
  await irParaHarness(p, 'avst-harness.html', 1200);
  await p.locator('[data-teste="botao-3d"]').click();
  await p.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 30000 });
  await p.waitForTimeout(2500);
};
const clicarChip = (p, texto) => p.evaluate((t) => {
  [...document.querySelectorAll('.avst5-p3d-personagens .avst5-p3d-chip')]
    .find((x) => x.textContent.includes(t))?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, texto);

// ── PARTE B: UI (flag ON) ───────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 }, webgl: true,
    init: () => {
      indexedDB.deleteDatabase('dshow.avst3d.v1'); // começa limpo
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': true }));
      localStorage.setItem('dshow.avst5.p3d.qualidade.v1', 'medio');
    },
  });
  try {
    await abrirPalco(p);
    // §472: troca p/ personagem FRIO mostra as fases e o badge some
    void clicarChip(p, 'Herói (UBC)');
    const viuCarga = await p.waitForSelector('[data-teste="p3d-carga"]', { timeout: 8000 })
      .then(() => true).catch(() => false);
    ok(viuCarga, 'badge de carga §472 não apareceu na troca fria');
    await p.waitForTimeout(9000);
    ok(await p.locator('[data-teste="p3d-carga"]').count() === 0, 'badge de carga não sumiu ao terminar (§472)');
    // §475: IndexedDB povoado com chaves POR HASH
    const idb = await p.evaluate(() => new Promise((resolve) => {
      const req = indexedDB.open('dshow.avst3d.v1', 1);
      req.onsuccess = () => {
        try {
          const tx = req.result.transaction('arquivos', 'readonly');
          const all = tx.objectStore('arquivos').getAllKeys();
          all.onsuccess = () => resolve(all.result);
          all.onerror = () => resolve([]);
        } catch { resolve([]); }
      };
      req.onerror = () => resolve([]);
    }));
    ok(Array.isArray(idb) && idb.length > 0, 'IndexedDB vazio após carga (§475)');
    ok(idb.some((k) => String(k).includes('#')), 'nenhuma chave com hash no IDB (§477→§475)');
    // §473: troca RÁPIDA A→B→A não erra nem trava o palco
    void clicarChip(p, 'Androide');
    await p.waitForTimeout(120);
    void clicarChip(p, 'Heroína (UBC)');
    await p.waitForTimeout(120);
    void clicarChip(p, 'Androide');
    await p.waitForTimeout(9000);
    ok(await p.locator('[data-teste="palco-3d"] canvas').count() === 1, 'palco caiu na troca rápida (§473)');
    await p.screenshot({ path: `${SAIDA}/progressivo3d-ui.png` });
    ok(erros.length === 0, `erros de página (UI): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção na UI: ${e.message}`); }
  await b.close();
}

// §462: tela PEQUENA rebaixa o tier (HUD mostra economico com qualidade fixa medio)
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 390, height: 760 }, webgl: true,
    init: () => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': true, 'as5.hud3d': true }));
      localStorage.setItem('dshow.avst5.p3d.qualidade.v1', 'medio');
    },
  });
  try {
    await abrirPalco(p);
    await p.waitForTimeout(2500); // HUD amostra a cada 1s
    const hud = await p.locator('[data-teste="p3d-hud"]').textContent().catch(() => '');
    ok((hud ?? '').includes('economico'), `tela pequena não rebaixou o tier (§462 — HUD: "${hud}")`);
    ok((hud ?? '').includes('dc'), 'HUD sem draw calls (§467)');
    ok(erros.length === 0, `erros de página (§462): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção no §462: ${e.message}`); }
  await b.close();
}

// ── PARTE C: rollback §651 (flag OFF) ───────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 390, height: 760 }, webgl: true,
    init: () => {
      indexedDB.deleteDatabase('dshow.avst3d.v1');
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': true, 'as5.hud3d': true, 'as5.progressivo3d': false }));
      localStorage.setItem('dshow.avst5.p3d.qualidade.v1', 'medio');
    },
  });
  try {
    await abrirPalco(p);
    void clicarChip(p, 'Herói (UBC)');
    const viuCarga = await p.waitForSelector('[data-teste="p3d-carga"]', { timeout: 4000 })
      .then(() => true).catch(() => false);
    ok(!viuCarga, 'flag off mas o badge de carga apareceu (§651)');
    await p.waitForTimeout(7000);
    const hud = await p.locator('[data-teste="p3d-hud"]').textContent().catch(() => '');
    ok((hud ?? '').includes('medio'), `flag off: tier fixo deveria seguir medio (HUD: "${hud}") §651`);
    const idb = await p.evaluate(() => new Promise((resolve) => {
      const req = indexedDB.open('dshow.avst3d.v1', 1);
      req.onsuccess = () => {
        try {
          const tx = req.result.transaction('arquivos', 'readonly');
          const all = tx.objectStore('arquivos').getAllKeys();
          all.onsuccess = () => resolve(all.result);
          all.onerror = () => resolve([]);
        } catch { resolve([]); }
      };
      req.onerror = () => resolve([]);
    }));
    ok(Array.isArray(idb) && idb.length === 0, 'flag off mas o IDB foi povoado (§651)');
    ok(erros.length === 0, `erros de página (rollback): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção no rollback: ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('FALHAS progressivo3d:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('progressivo3d OK');
