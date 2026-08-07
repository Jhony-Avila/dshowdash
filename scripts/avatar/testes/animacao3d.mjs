// testes/animacao3d.mjs — lote 661–670 (§432–§439, flag as5.animacao3d):
// ANIMATION MANAGER + máquina de estados + pacote externo + olhar.
//   A) CONTRATO: publicar-animacoes gera pacote slim válido; o manager
//      carrega, REMOVE root motion §437, e o clipe move um personagem
//      DIFERENTE do mesmo rig (§436 reuso por nome de bone); máquina
//      §433 (captura bloqueia emote); alvoOlhar §439 com amplitude
//      limitada;
//   B) UI (harness, Herói UBC): sem pacote publicado o palco funciona
//      igual (§481); olhar DESLIGA em movimento reduzido (canvas
//      estático sob mousemove); Androide segue com chips próprios;
//   C) rollback §651 (as5.animacao3d off): mousemove inerte, sem erros.
// @version 1.0.0  @created 2026-08-07
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { Document, NodeIO } from '@gltf-transform/core';
import { gerarManequim } from '../assets3d/gerar-manequim.mjs';
import { publicarAnimacoes } from '../assets3d/publicar-animacoes.mjs';
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const PORTA = 8920;
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── PARTE A: contrato ────────────────────────────────────────────────
const dir = mkdtempSync(join(tmpdir(), 'avst-anim-'));
const fonteManequim = join(dir, 'manequim.glb');
await gerarManequim(fonteManequim, { denso: false });

// fonte de animações SINTÉTICA no rig do manequim: 'Idle' gira UpperArmL
// e TAMBÉM move Hips.position (p/ provar a remoção §437); 'Wave' idem
{
  const doc = new Document();
  const buf = doc.createBuffer();
  const cena = doc.createScene('cena');
  const hips = doc.createNode('Hips');
  const arm = doc.createNode('UpperArmL');
  hips.addChild(arm);
  cena.addChild(hips);
  const tempos = doc.createAccessor().setType('SCALAR').setArray(new Float32Array([0, 1])).setBuffer(buf);
  const rots = doc.createAccessor().setType('VEC4')
    .setArray(new Float32Array([0, 0, 0, 1, 0.7071, 0, 0, 0.7071])).setBuffer(buf);
  const pos = doc.createAccessor().setType('VEC3')
    .setArray(new Float32Array([0, 0, 0, 0, 1, 0])).setBuffer(buf);
  for (const nome of ['Idle', 'Wave']) {
    const anim = doc.createAnimation(nome);
    const s1 = doc.createAnimationSampler().setInput(tempos).setOutput(rots);
    anim.addSampler(s1).addChannel(
      doc.createAnimationChannel().setTargetNode(arm).setTargetPath('rotation').setSampler(s1));
    const s2 = doc.createAnimationSampler().setInput(tempos).setOutput(pos);
    anim.addSampler(s2).addChannel(
      doc.createAnimationChannel().setTargetNode(hips).setTargetPath('translation').setSampler(s2));
  }
  await new NodeIO().write(join(dir, 'fonte-anim.glb'), doc);
}
// publica o pacote com a ferramenta REAL (§432/§436)
const { manifest: manifestPacote } = await publicarAnimacoes({
  fonte: join(dir, 'fonte-anim.glb'), saida: join(dir, 'pacote'), id: 'dev_anims',
  clipes: ['Idle', 'Wave'], rig: 'manequim-dev', log: () => {},
});
ok(manifestPacote.tipo === 'pacote_animacoes' && manifestPacote.clipes.length === 2,
  'manifest do pacote fora do contrato (§432)');
// clipe ausente deve REPROVAR (validação antes de publicar)
let reprovou = false;
try {
  await publicarAnimacoes({
    fonte: join(dir, 'fonte-anim.glb'), saida: join(dir, 'p2'), id: 'x',
    clipes: ['NaoExiste'], log: () => {},
  });
} catch { reprovou = true; }
ok(reprovou, 'publicador aceitou clipe inexistente');

writeFileSync(join(dir, 'entrada.ts'), `
import { MaquinaAnimacao, alvoOlhar, carregarPacoteAnimacoes, OLHAR_MAX } from '${PAINEL}/src/services/Animacoes3d';
(window as any).__Maquina = MaquinaAnimacao;
(window as any).__alvoOlhar = alvoOlhar;
(window as any).__olharMax = OLHAR_MAX;
(window as any).__carregarPacote = carregarPacoteAnimacoes;
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
const MIME = { '.js': 'text/javascript', '.glb': 'model/gltf-binary' };
const srv = createServer(async (req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  try {
    if (url === '/') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(PAGINA); return; }
    const arq = url === '/bundle.js' ? join(dir, 'bundle.js')
      : url === '/manequim.glb' ? fonteManequim
        : url === '/pacote.glb' ? join(dir, 'pacote', 'pacote.glb')
          : url.startsWith('/three/') ? join(RAIZ, 'node_modules/three', url.slice(7)) : null;
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
    const THREE = await import('three');
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const saida = {};

    // §432/§437: pacote carrega, root motion FORA, clipes por nome
    const pacote = await window.__carregarPacote('/pacote.glb');
    saida.clipes = pacote.clipes.size === 2 && pacote.clipes.has('Idle') && pacote.clipes.has('Wave');
    const idle = pacote.clipes.get('Idle');
    saida.semRootMotion = !idle.tracks.some((t) => t.name === 'Hips.position');
    saida.temRotacao = idle.tracks.some((t) => t.name === 'UpperArmL.quaternion');

    // §436: o MESMO clipe move um personagem DIFERENTE do rig (manequim)
    const alvo = (await new GLTFLoader().loadAsync('/manequim.glb')).scene;
    let braco = null;
    alvo.traverse((o) => { if (o.isBone && o.name === 'UpperArmL') braco = o; });
    const antes = braco.quaternion.clone();
    const mixer = new THREE.AnimationMixer(alvo);
    mixer.clipAction(idle).play();
    mixer.update(0.5);
    saida.moveu = !braco.quaternion.equals(antes);

    // §433: máquina — captura BLOQUEIA emote; pose e idle liberados depois
    const m = new window.__Maquina();
    saida.mCarregando = m.estado === 'carregando' && !m.pode('emote');
    m.ir('idle');
    saida.mCaptura = m.ir('captura') && !m.ir('emote') && m.estado === 'captura';
    saida.mVolta = m.ir('idle') && m.ir('emote');

    // §439: amplitude LIMITADA + centro no null
    const max = window.__olharMax;
    const a = window.__alvoOlhar(3, -4);
    const b = window.__alvoOlhar(null, null);
    saida.olharClamp = a.guinada === max.guinada && a.arfagem === -max.arfagem
      && b.guinada === 0 && b.arfagem === 0;
    return saida;
  });
  ok(r.clipes, 'pacote não carregou os 2 clipes (§432)');
  ok(r.semRootMotion, 'root motion do Hips não foi removido (§437)');
  ok(r.temRotacao, 'track de rotação sumiu junto (§437 só remove posição de raiz)');
  ok(r.moveu, 'clipe do pacote não moveu personagem do mesmo rig (§436)');
  ok(r.mCarregando, 'máquina §433: carregando deveria bloquear emote');
  ok(r.mCaptura, 'máquina §433: captura deveria bloquear emote');
  ok(r.mVolta, 'máquina §433: idle→emote deveria ser permitido após captura');
  ok(r.olharClamp, 'alvoOlhar sem amplitude limitada (§439)');
  ok(errosPag.length === 0, `erros JS no contrato: ${errosPag.join(' | ')}`);
} catch (e) {
  falhas.push(`exceção no contrato: ${e.message}`);
} finally {
  await nav1?.close().catch(() => {});
  srv.close();
  rmSync(dir, { recursive: true, force: true });
}

// ── PARTE B: UI (flag ON; pacote UAL ainda não publicado = §481) ────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 }, webgl: true,
    init: () => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': true }));
      localStorage.setItem('dshow.avst5.p3d.qualidade.v1', 'medio');
    },
  });
  try {
    await p.emulateMedia({ reducedMotion: 'reduce' });
    await irParaHarness(p, 'avst-harness.html', 1200);
    await p.locator('[data-teste="botao-3d"]').click();
    await p.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 30000 });
    await p.waitForTimeout(3000);
    await p.evaluate(() => { [...document.querySelectorAll('.avst5-p3d-personagens .avst5-p3d-chip')].find((x) => x.textContent.includes('Herói (UBC)'))?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await p.waitForTimeout(6000);
    const canvas = p.locator('[data-teste="palco-3d"] canvas');
    // §439: em MOVIMENTO REDUZIDO o olhar fica DESLIGADO — mousemove não
    // pode tocar o palco (frame estático antes e depois)
    const caixa = await canvas.boundingBox();
    const antes = await canvas.screenshot();
    await p.mouse.move(caixa.x + caixa.width * 0.15, caixa.y + caixa.height * 0.3);
    await p.waitForTimeout(600);
    await p.mouse.move(caixa.x + caixa.width * 0.85, caixa.y + caixa.height * 0.7);
    await p.waitForTimeout(1500);
    const depois = await canvas.screenshot();
    ok(antes.equals(depois), 'movimento reduzido mas o olhar mexeu no palco (§439/§297)');
    // §481: sem pacote publicado o Herói segue sem chips de animação
    ok(await p.locator('[data-teste="p3d-animacoes"]').count() === 0, 'chips de animação sem pacote publicado (§481)');
    // regressão: Androide (clipes PRÓPRIOS do GLB) mantém os chips
    await p.evaluate(() => { [...document.querySelectorAll('.avst5-p3d-personagens .avst5-p3d-chip')].find((x) => x.textContent.trim() === 'Androide')?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await p.waitForTimeout(5000);
    ok(await p.locator('[data-teste="p3d-animacoes"]').count() === 1, 'Androide perdeu os chips de animação (regressão §432)');
    await p.screenshot({ path: `${SAIDA}/animacao3d-ui.png` });
    ok(erros.length === 0, `erros de página (UI): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção na UI: ${e.message}`); }
  await b.close();
}

// ── PARTE C: rollback §651 (as5.animacao3d OFF) ─────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 }, webgl: true,
    init: () => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({
        'as5.novo_shell': true, 'as5.palco3d': true, 'as5.animacao3d': false,
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
    await p.evaluate(() => { [...document.querySelectorAll('.avst5-p3d-personagens .avst5-p3d-chip')].find((x) => x.textContent.includes('Herói (UBC)'))?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await p.waitForTimeout(5000);
    const canvas = p.locator('[data-teste="palco-3d"] canvas');
    const caixa = await canvas.boundingBox();
    const antes = await canvas.screenshot();
    await p.mouse.move(caixa.x + caixa.width * 0.8, caixa.y + caixa.height * 0.6);
    await p.waitForTimeout(1200);
    const depois = await canvas.screenshot();
    ok(antes.equals(depois), 'flag off mas o mousemove tocou o palco (§651)');
    ok(erros.length === 0, `erros de página (rollback): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção no rollback: ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('FALHAS animacao3d:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('animacao3d OK');
