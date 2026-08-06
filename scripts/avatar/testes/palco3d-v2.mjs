// testes/palco3d-v2.mjs — lote 261–270 (§440–§458, flag as5.palco3d_v2):
// A5 do palco 3D SEM UBC. Duas partes:
//   1. CONTRATO (página efêmera + manequim, byte-compare com pausar +
//      avancarQuadro(0)): tone mapping §457, ambiente §449, rim §452,
//      partículas §444–§446, enquadrar §454 e VIDA §440–§441 isolada
//      (animação 'nenhum' → só a vida mexe o quadro; null = para).
//   2. UI (harness): grupo Cinema no toolbar do palco, vida ON por
//      padrão, chips de tone mapping, rollback §651 (flag off = some).
// @version 1.0.0  @created 2026-08-05
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { gerarManequim } from '../assets3d/gerar-manequim.mjs';
import { publicarAsset } from '../assets3d/publicar-asset.mjs';
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const PORTA = 8912;
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── PARTE 1: contrato do renderer ────────────────────────────────────
const dir = mkdtempSync(join(tmpdir(), 'avst-p3dv2-'));
const fonte = join(dir, 'manequim.glb');
await gerarManequim(fonte, { denso: true });
await publicarAsset({
  fonte, saida: join(dir, 'personagens', 'manequim_dev'), id: 'manequim_dev',
  origem: 'manequim-procedural', comprovante: 'scripts/avatar/assets3d/gerar-manequim.mjs',
  data: '2026-08-05', log: () => {},
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
  "three/examples/jsm/environments/RoomEnvironment.js": "/three/examples/jsm/environments/RoomEnvironment.js"
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
    // pausado + avancarQuadro(0) = RE-RENDER puro (mesma pose → byte-compare)
    r3d.pausar();
    r3d.avancarQuadro(0);
    const base = c.toDataURL();
    // §457–§458: MODO do tone mapping muda o quadro; 'aces' restaura
    r3d.definirTonemapping('agx');
    r3d.avancarQuadro(0);
    saida.toneMudou = c.toDataURL() !== base;
    r3d.definirTonemapping('aces');
    r3d.avancarQuadro(0);
    saida.toneVoltou = c.toDataURL() === base;
    // §449: ambiente a 0 escurece; 0.55 (padrão da mega 77) restaura
    r3d.definirAmbiente(0);
    r3d.avancarQuadro(0);
    saida.ambMudou = c.toDataURL() !== base;
    r3d.definirAmbiente(0.55);
    r3d.avancarQuadro(0);
    saida.ambVoltou = c.toDataURL() === base;
    // §452: rim light entra e sai limpa
    r3d.definirRim('#4cd9e8');
    r3d.avancarQuadro(0);
    saida.rimMudou = c.toDataURL() !== base;
    r3d.definirRim(null);
    r3d.avancarQuadro(0);
    saida.rimVoltou = c.toDataURL() === base;
    // §444–§446: partículas determinísticas entram e saem limpas
    r3d.definirParticulas3d('#ff2d75');
    r3d.avancarQuadro(0);
    saida.partMudou = c.toDataURL() !== base;
    r3d.definirParticulas3d(null);
    r3d.avancarQuadro(0);
    saida.partVoltou = c.toDataURL() === base;
    // §454: enquadrar('rosto') aproxima ≠ enquadrar('auto')
    r3d.enquadrar('rosto');
    r3d.avancarQuadro(0);
    const rosto = c.toDataURL();
    saida.rostoMudou = rosto !== base;
    r3d.enquadrar('auto');
    r3d.avancarQuadro(0);
    saida.autoDifere = c.toDataURL() !== rosto;
    // §440–§441: VIDA isolada — animação 'nenhum' desliga o idle; sem
    // vida o quadro PARA; com vida volta a respirar; null para de novo
    await r3d.tocarAnimacao({ id: 'nenhum' });
    r3d.retomar();
    await new Promise((res) => setTimeout(res, 300));
    const s1 = c.toDataURL();
    await new Promise((res) => setTimeout(res, 300));
    saida.paradoSemVida = c.toDataURL() === s1;
    r3d.definirVida(1);
    await new Promise((res) => setTimeout(res, 400));
    const v1 = c.toDataURL();
    await new Promise((res) => setTimeout(res, 300));
    saida.vidaMexe = c.toDataURL() !== v1;
    r3d.definirVida(null);
    await new Promise((res) => setTimeout(res, 300));
    const v2 = c.toDataURL();
    await new Promise((res) => setTimeout(res, 300));
    saida.vidaDesliga = c.toDataURL() === v2;
    await r3d.descartar();
    return saida;
  });
  ok(r.toneMudou, 'tone mapping AgX §457 não mudou o quadro');
  ok(r.toneVoltou, 'voltar ao ACES não restaurou o quadro byte a byte');
  ok(r.ambMudou, 'ambiente 0 §449 não mudou o quadro');
  ok(r.ambVoltou, 'ambiente 1 não restaurou o quadro');
  ok(r.rimMudou, 'rim light §452 não entrou no quadro');
  ok(r.rimVoltou, 'remover o rim não restaurou o quadro');
  ok(r.partMudou, 'partículas §444 não entraram no quadro');
  ok(r.partVoltou, 'remover as partículas não restaurou o quadro');
  ok(r.rostoMudou, 'enquadrar(rosto) §454 não moveu a câmera');
  ok(r.autoDifere, 'enquadrar(auto) deveria diferir do rosto');
  ok(r.paradoSemVida, 'sem idle e sem vida o quadro deveria PARAR');
  ok(r.vidaMexe, 'vida §440 não fez o quadro respirar');
  ok(r.vidaDesliga, 'definirVida(null) não parou a respiração');
  ok(errosPag.length === 0, `erros JS no contrato: ${errosPag.join(' | ')}`);
} catch (e) {
  falhas.push(`exceção no contrato: ${e.message}`);
} finally {
  await nav1?.close().catch(() => {});
  srv.close();
  rmSync(dir, { recursive: true, force: true });
}

// ── PARTE 2: UI no harness (grupo Cinema + rollback §651) ────────────
const { navegador: b, pagina: p2, erros } = await abrir({
  viewport: { width: 1500, height: 940 }, webgl: true,
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1',
      JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': true }));
  },
});
try {
  await irParaHarness(p2, 'avst-harness.html', 1200);
  await p2.locator('[data-teste="botao-3d"]').click();
  await p2.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 30000 });
  await p2.waitForTimeout(4000);

  ok(await p2.locator('[data-teste="p3d-cinema"]').count() === 1, 'chip Cinema ausente do toolbar');
  await p2.locator('[data-teste="p3d-cinema"]').click();
  await p2.waitForSelector('[data-teste="p3d-vida"]', { timeout: 3000 });
  // §440: o palco nasce VIVO — vida ligada por padrão
  ok(await p2.locator('[data-teste="p3d-vida"][aria-pressed="true"]').count() === 1,
    'vida deveria nascer LIGADA (§440)');
  // tone mapping: 4 modos, ACES marcado; AgX assume ao clicar
  ok(await p2.locator('[data-teste="p3d-tone"] button').count() === 4, 'esperava 4 modos de tone mapping');
  ok(await p2.locator('[data-teste="p3d-tone-aces"][aria-pressed="true"]').count() === 1,
    'ACES deveria ser o modo inicial');
  await p2.locator('[data-teste="p3d-tone-agx"]').click();
  await p2.waitForTimeout(300);
  ok(await p2.locator('[data-teste="p3d-tone-agx"][aria-pressed="true"]').count() === 1,
    'AgX não assumiu ao clicar');
  // aro + partículas ligam sem erro; ambiente presente; enquadrar roda
  await p2.locator('[data-teste="p3d-rim"]').click();
  await p2.locator('[data-teste="p3d-part"]').click();
  await p2.waitForTimeout(400);
  ok(await p2.locator('[data-teste="p3d-rim"][aria-pressed="true"]').count() === 1, 'aro não ligou');
  ok(await p2.locator('[data-teste="p3d-part"][aria-pressed="true"]').count() === 1, 'partículas não ligaram');
  ok(await p2.locator('[data-teste="p3d-amb"]').count() === 1, 'slider de ambiente ausente');
  await p2.locator('[data-teste="p3d-enq-rosto"]').click();
  await p2.waitForTimeout(300);
  await p2.locator('[data-teste="p3d-enq-auto"]').click();
  await p2.waitForTimeout(300);
  await p2.screenshot({ path: `${SAIDA}/palco3d-v2-cinema.png` });

} catch (e) {
  falhas.push(`exceção na UI: ${e.message}`);
}
await b.close();

// rollback §651: contexto NOVO com a flag off → o grupo Cinema SOME
// (o init do abrir() reescreve as flags a cada navegação — por isso um
// contexto dedicado, não um reload)
const { navegador: b2, pagina: p3, erros: erros2 } = await abrir({
  viewport: { width: 1500, height: 940 }, webgl: true,
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({
      'as5.novo_shell': true, 'as5.palco3d': true, 'as5.palco3d_v2': false,
    }));
  },
});
try {
  await irParaHarness(p3, 'avst-harness.html', 1200);
  await p3.locator('[data-teste="botao-3d"]').click();
  await p3.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 30000 });
  await p3.waitForTimeout(2000);
  ok(await p3.locator('[data-teste="p3d-cinema"]').count() === 0,
    'flag off deveria esconder o Cinema (§651)');
} catch (e) {
  falhas.push(`exceção no rollback: ${e.message}`);
}

const ok_ = relatorio('palco3d-v2', falhas, [...erros, ...erros2]);
await b2.close();
process.exit(ok_ ? 0 : 1);
