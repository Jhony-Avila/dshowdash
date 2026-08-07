// testes/assembler.mjs — lote 621–630 (§406, flag as5.assembler3d):
// CHARACTER ASSEMBLER.
//   A) CONTRATO (página efêmera): montarPersonagem roda os 14 passos §406
//      na ordem do briefing; parte REBINDADA compartilha os MESMOS Bones
//      da base (identidade de objeto); rig canônico errado REPROVA no
//      passo 2; parte de rig estranho vira pendência degradada (§481).
//   B) UI (harness): com partes publicadas + base ubc-v1 o grupo de
//      cabelos aparece e aplica; sem índice de partes o grupo some;
//      rollback §651 (flag off = grupo nunca aparece).
// @version 1.0.0  @created 2026-08-07
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { gerarManequim } from '../assets3d/gerar-manequim.mjs';
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const PORTA = 8916;
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── PARTE A: contrato do assembler ───────────────────────────────────
const dir = mkdtempSync(join(tmpdir(), 'avst-asm-'));
const fonte = join(dir, 'manequim.glb');
await gerarManequim(fonte, { denso: false });

writeFileSync(join(dir, 'entrada.ts'), `
import { montarPersonagem, religarParte } from '${PAINEL}/src/services/Assembler3d';
(window as any).__montar = montarPersonagem;
(window as any).__religar = religarParte;
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
}}</script></head><body>
<script type="module" src="/bundle.js"></script></body></html>`;
const MIME = { '.js': 'text/javascript', '.glb': 'model/gltf-binary' };
const srv = createServer(async (req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  try {
    if (url === '/') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(PAGINA); return; }
    let arq = null;
    if (url === '/bundle.js') arq = join(dir, 'bundle.js');
    else if (url === '/manequim.glb') arq = fonte;
    else if (url.startsWith('/three/')) arq = join(RAIZ, 'node_modules/three', url.slice(7));
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
  const p = await (await nav1.newContext()).newPage();
  const errosPag = [];
  p.on('pageerror', (e) => errosPag.push(e.message.slice(0, 140)));
  await p.goto(`http://127.0.0.1:${PORTA}/`, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__bundlePronto === true, { timeout: 20000 });
  const r = await p.evaluate(async () => {
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const carregar = async () => (await new GLTFLoader().loadAsync('/manequim.glb')).scene;
    const bonesDe = (raiz) => {
      const m = new Map();
      raiz.traverse((n) => { if (n.isBone) m.set(n.name, n); });
      return m;
    };
    const saida = {};

    // 14 passos na ORDEM do §406, todos ok, parte religada
    const base = await carregar();
    const parte = await carregar(); // mesmo rig por construção
    const canonicos = [...bonesDe(base).keys()];
    const r1 = window.__montar({
      base, partes: [{ id: 'parte_dev', categoria: 'cabelo', cena: parte }],
      bonesCanonicos: canonicos,
    });
    saida.ok1 = r1.ok;
    saida.ordem = r1.fases.map((f) => f.passo).join('>');
    saida.todasOk = r1.fases.every((f) => f.ok);
    saida.pendencias1 = r1.pendencias.length;
    // identidade de bones: skinned da PARTE aponta pros MESMOS Bones da base
    const bonesBase = bonesDe(base);
    let identidade = false;
    parte.traverse((n) => {
      if (n.isSkinnedMesh && !identidade) {
        identidade = n.skeleton.bones.every((b) => bonesBase.get(b.name) === b);
      }
    });
    saida.identidade = identidade;
    // parte é FILHA da base montada
    saida.anexada = (() => { let achou = false; base.traverse((n) => { if (n === parte) achou = true; }); return achou; })();

    // rig canônico ERRADO reprova no passo 2
    const base2 = await carregar();
    const r2 = window.__montar({ base: base2, partes: [], bonesCanonicos: ['bone_inexistente'] });
    saida.reprovaRig = !r2.ok && r2.fases.some((f) => f.passo === 'validar_rig' && !f.ok);

    // parte com bone fora da base = pendência degradada (não derruba)
    const base3 = await carregar();
    const parte3 = await carregar();
    parte3.traverse((n) => { if (n.isBone && n.name === [...bonesDe(parte3).keys()][0]) n.name = 'bone_alienigena'; });
    const r3 = window.__montar({
      base: base3, partes: [{ id: 'parte_estranha', categoria: 'roupa', cena: parte3 }],
      bonesCanonicos: [],
    });
    saida.degrada = r3.ok && r3.pendencias.some((x) => x.includes('parte_estranha'));
    return saida;
  });
  ok(r.ok1, 'montagem básica não aprovou');
  ok(r.ordem === 'carregar_base>validar_rig>tipo_corporal>morphs>pele>cabelo>barba>roupas>acessorios>materiais>emblemas>animacao>clipping>compatibilidade',
    `fases fora da ordem do §406: ${r.ordem}`);
  ok(r.todasOk, 'alguma fase reportou falha na montagem básica');
  ok(r.identidade, 'parte NÃO compartilha os Bones da base (rebind §406 falhou)');
  ok(r.anexada, 'parte não foi anexada à raiz montada');
  ok(r.reprovaRig, 'rig canônico errado deveria reprovar no passo 2 (§436)');
  ok(r.degrada, 'parte de rig estranho deveria degradar com pendência (§481)');
  ok(errosPag.length === 0, `erros JS no contrato: ${errosPag.join(' | ')}`);
} catch (e) {
  falhas.push(`exceção no contrato: ${e.message}`);
} finally {
  await nav1?.close().catch(() => {});
  srv.close();
  rmSync(dir, { recursive: true, force: true });
}

// ── PARTE B: UI (harness) ────────────────────────────────────────────
{
  const temPartes = existsSync(join(RAIZ, 'public/assets/avatars/3d/partes/index.json'));
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 }, webgl: true,
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': true })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await p.locator('[data-teste="botao-3d"]').click();
    await p.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 30000 });
    await p.waitForTimeout(3000);
    if (temPartes) {
      // base ubc-v1 → grupo de cabelos aparece e aplica
      await p.evaluate(() => { [...document.querySelectorAll('.avst5-p3d-personagens .avst5-p3d-chip')].find((x) => x.textContent.includes('Herói (UBC)'))?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
      await p.waitForTimeout(4000);
      ok(await p.locator('[data-teste="p3d-cabelos"]').count() === 1, 'grupo de cabelos ausente com base ubc-v1 (§423)');
      const chip = p.locator('[data-teste="p3d-cabelos"] .avst5-p3d-chip').nth(1);
      await chip.click();
      await p.waitForTimeout(2500);
      ok(await p.locator('[data-teste="p3d-cabelos"] .avst5-p3d-chip-on').count() === 1, 'cabelo não marcou');
      // base LEGADA → grupo some (rig ≠ ubc-v1)
      await p.evaluate(() => { [...document.querySelectorAll('.avst5-p3d-personagens .avst5-p3d-chip')].find((x) => x.textContent.trim() === 'Androide')?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
      await p.waitForTimeout(3000);
      ok(await p.locator('[data-teste="p3d-cabelos"]').count() === 0, 'grupo de cabelos deveria sumir em base fora do rig ubc-v1');
    } else {
      ok(await p.locator('[data-teste="p3d-cabelos"]').count() === 0, 'sem índice de partes o grupo deveria estar ausente (§481)');
      console.log('[assembler] aviso: partes ainda não publicadas — ramo completo da UI roda após a publicação');
    }
    await p.screenshot({ path: `${SAIDA}/assembler-ui.png` });
    ok(erros.length === 0, `erros de página (UI): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção na UI: ${e.message}`); }
  await b.close();
}

// ── PARTE C: rollback §651 ───────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 }, webgl: true,
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': true, 'as5.assembler3d': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await p.locator('[data-teste="botao-3d"]').click();
    await p.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 30000 });
    await p.waitForTimeout(2500);
    ok(await p.locator('[data-teste="p3d-cabelos"]').count() === 0, 'flag off com grupo de cabelos (§651)');
    ok(erros.length === 0, `erros de página (rollback): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção no rollback: ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('FALHAS assembler:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('assembler OK');
