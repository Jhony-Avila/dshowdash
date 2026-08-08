// testes/ual-extra.mjs — lote 731–740 (§432, flag as5.ual_extra):
// MULTI-PACOTE de animações.
//   A) CONTRATO: mesclarClipes é first-wins (o básico define o Idle
//      canônico; extras só somam) e preserva a ordem;
//   B) UI: com o ual_extra PUBLICADO os emotes (Yes/FoldArms/…) viram
//      chips no Herói; sem publicação o palco segue igual (§481);
//   C) rollback §651: flag off = só o básico (sem 'Yes', teto 6).
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
const PORTA = 8923;
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── PARTE A: contrato mesclarClipes ─────────────────────────────────
const dir = mkdtempSync(join(tmpdir(), 'avst-ux-'));
writeFileSync(join(dir, 'entrada.ts'), `
import { mesclarClipes } from '${PAINEL}/src/services/Animacoes3d';
(window as any).__mesclar = mesclarClipes;
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
const srv = createServer(async (req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  try {
    if (url === '/') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(PAGINA); return; }
    const arq = url === '/bundle.js' ? join(dir, 'bundle.js')
      : url.startsWith('/three/') ? join(RAIZ, 'node_modules/three', url.slice(7)) : null;
    if (!arq) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': extname(arq) === '.js' ? 'text/javascript' : 'application/octet-stream' });
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
    const basico = { url: 'b', clipes: new Map([['Idle_Loop', { name: 'A' }], ['Yes', { name: 'B1' }]]) };
    const extra = { url: 'e', clipes: new Map([['Yes', { name: 'B2' }], ['Chest_Open', { name: 'C' }]]) };
    const t = window.__mesclar([basico, extra]);
    return {
      tamanho: t.size,
      firstWins: t.get('Yes')?.name === 'B1',
      somou: t.get('Chest_Open')?.name === 'C',
      ordem: [...t.keys()].join(','),
    };
  });
  ok(r.tamanho === 3, `mescla com tamanho errado (${r.tamanho})`);
  ok(r.firstWins, 'conflito de nome não ficou com o PRIMEIRO pacote (§432)');
  ok(r.somou, 'clipe exclusivo do extra não somou');
  ok(r.ordem === 'Idle_Loop,Yes,Chest_Open', `ordem de inserção quebrada (${r.ordem})`);
  ok(errosPag.length === 0, `erros JS no contrato: ${errosPag.join(' | ')}`);
} catch (e) {
  falhas.push(`exceção no contrato: ${e.message}`);
} finally {
  await nav1?.close().catch(() => {});
  srv.close();
  rmSync(dir, { recursive: true, force: true });
}

// ── helpers ─────────────────────────────────────────────────────────
const temExtra = existsSync(join(RAIZ, 'public/assets/avatars/3d/animacoes/ual_extra/manifest.json'));
const chipsDoHeroi = async (p) => {
  await p.emulateMedia({ reducedMotion: 'reduce' });
  await irParaHarness(p, 'avst-harness.html', 1200);
  await p.locator('[data-teste="botao-3d"]').click();
  await p.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 30000 });
  await p.waitForTimeout(3000);
  await p.evaluate(() => { [...document.querySelectorAll('.avst5-p3d-personagens .avst5-p3d-chip')].find((x) => x.textContent.includes('Herói (UBC)'))?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await p.waitForTimeout(8000);
  await p.waitForFunction(() => !document.querySelector('[data-teste="p3d-carga"]'), { timeout: 25000 }).catch(() => {});
  return p.locator('[data-teste="p3d-animacoes"] .avst5-p3d-chip').allTextContents();
};

// ── PARTE B: UI (flag ON) ───────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 }, webgl: true,
    init: () => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': true }));
      localStorage.setItem('dshow.avst5.p3d.qualidade.v1', 'medio');
    },
  });
  try {
    const chips = await chipsDoHeroi(p);
    if (temExtra) {
      ok(chips.some((c) => c.includes('Yes')), `extra publicado mas sem o emote Yes (chips: ${chips.join('|')})`);
      ok(chips.length >= 7, `esperava ≥7 chips com o extra (${chips.length})`);
    } else {
      ok(chips.length >= 4, `chips do básico sumiram (${chips.length})`);
      ok(!chips.some((c) => c.includes('Yes')), 'Yes presente sem o extra publicado?');
      console.log('[ual-extra] aviso: ual_extra ainda não publicado — ramo completo roda após a publicação');
    }
    await p.screenshot({ path: `${SAIDA}/ual-extra.png` });
    ok(erros.length === 0, `erros de página (UI): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção na UI: ${e.message}`); }
  await b.close();
}

// ── PARTE C: rollback §651 (flag OFF = só o básico) ─────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 }, webgl: true,
    init: () => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': true, 'as5.ual_extra': false }));
      localStorage.setItem('dshow.avst5.p3d.qualidade.v1', 'medio');
    },
  });
  try {
    const chips = await chipsDoHeroi(p);
    ok(chips.length >= 4 && chips.length <= 6, `flag off deveria manter o teto 6 (${chips.length})`);
    ok(!chips.some((c) => c.includes('Yes')), 'flag off mas o emote do extra apareceu (§651)');
    ok(erros.length === 0, `erros de página (rollback): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção no rollback: ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('FALHAS ual-extra:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('ual-extra OK');
