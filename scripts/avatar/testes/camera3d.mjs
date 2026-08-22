// testes/camera3d.mjs — onda 1419 (MEGA_BRIEFING_01 Parte 8 P8-B/P8-C;
// decisões #204/#205): CÂMERA V2 + SOMBRAS/CHÃO/AMBIENTE do palco 3D.
//
//   A) Node puro — Camera3d: FOVs do §P8-B (rosto/retrato 24°, busto 28°,
//      corpo 32–34°), bookmarks válidos, PRESET_POR_CATEGORIA cobre TODAS
//      as categorias, limites de órbita sanos, `enquadrar()` puro e
//      determinístico (eye-line dentro da caixa, costas atrás, headroom
//      afasta). Looks3d: todo look declara sombra{bias<0, raio>0} e fog
//      válido/null; `estudio` SEM fog (contrato canônico intocado).
//   B) Navegador (palco 3D, handle dev as5.hud3d):
//      1. flags OFF: botões de bookmark AUSENTES;
//      2. as6.camera_v2 ON: bookmarks aparecem; busto→FOV 28, face→24,
//         corpo→33 (após a transição 300 ms); guard #165d: repetir o MESMO
//         modo não mexe a câmera; órbita ganha limites polares;
//      3. as6.sombras_v2 ON: mapSize 2048 no tier alto, contact shadow
//         SEMPRE visível (chão fake com textura), fog por look
//         (dramatic tem, estudio não), definirChao('gloss'/'grid') responde.
// @version 1.0.0  @created 2026-08-22
import { abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── A) Node puro ────────────────────────────────────────────────────
{
  const { execSync } = await import('node:child_process');
  const { mkdtempSync, rmSync, writeFileSync, existsSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join, resolve } = await import('node:path');
  const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
  const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
  const tmp = mkdtempSync(join(tmpdir(), 'avst-1419-'));
  try {
    writeFileSync(join(tmp, 'prova.ts'), `
import { PRESETS_CAMERA_3D, BOOKMARKS_CAMERA, PRESET_POR_CATEGORIA, LIMITES_ORBITA, TRANSICAO_CAMERA_MS, enquadrar } from '@painel/services/Camera3d';
import { LOOKS } from '@painel/services/Looks3d';
import { CATEGORIAS } from '@painel/services/AvatarCatalog';
const p: string[] = [];
const P = PRESETS_CAMERA_3D;
if (P.face.fov !== 24 || P.retrato.fov !== 24) p.push('rosto/retrato FOV != 24');
if (P.busto.fov !== 28) p.push('busto FOV != 28');
if (P.corpo.fov < 32 || P.corpo.fov > 34) p.push('corpo FOV fora de 32-34');
for (const [b, preset] of Object.entries(BOOKMARKS_CAMERA)) if (!P[preset]) p.push('bookmark ' + b + ' -> preset inexistente');
if (BOOKMARKS_CAMERA.back !== 'costas' || BOOKMARKS_CAMERA.face !== 'face') p.push('bookmarks errados');
for (const c of CATEGORIAS.map((x) => x.id)) if (!PRESET_POR_CATEGORIA[c]) p.push('categoria sem preset: ' + c);
if (PRESET_POR_CATEGORIA.base !== 'face' || PRESET_POR_CATEGORIA.roupa !== 'busto' || PRESET_POR_CATEGORIA.roupa_inferior !== 'corpo') p.push('category-aware errado');
if (!(LIMITES_ORBITA.minPolar > 0 && LIMITES_ORBITA.maxPolar < Math.PI && LIMITES_ORBITA.minDistance > 0 && LIMITES_ORBITA.maxDistance > LIMITES_ORBITA.minDistance && LIMITES_ORBITA.near <= 0.05)) p.push('limites de orbita insanos');
if (TRANSICAO_CAMERA_MS !== 300) p.push('transicao != 300ms');
const caixa = { min: [-0.4, 0, -0.25] as [number, number, number], max: [0.4, 1.8, 0.25] as [number, number, number] };
const e1 = enquadrar(caixa, 'busto');
if (JSON.stringify(e1) !== JSON.stringify(enquadrar(caixa, 'busto'))) p.push('enquadrar nao deterministico');
if (e1.fov !== 28) p.push('enquadrar nao devolve o FOV do preset');
if (!(e1.alvo[1] > 0 && e1.alvo[1] < 1.8)) p.push('eye-line fora da caixa');
if (P.busto.eyeLine <= P.corpo.eyeLine || P.face.eyeLine <= P.busto.eyeLine) p.push('eye-line nao sobe do corpo ao rosto');
const eFace = enquadrar(caixa, 'face');
const eCorpo = enquadrar(caixa, 'corpo');
const dist = (e: typeof e1) => Math.hypot(e.posicao[0] - e.alvo[0], e.posicao[1] - e.alvo[1], e.posicao[2] - e.alvo[2]);
if (!(dist(eFace) < dist(e1) && dist(e1) < dist(eCorpo))) p.push('distancias nao crescem do rosto ao corpo');
const eCostas = enquadrar(caixa, 'costas');
if (!(eCostas.posicao[2] < eCostas.alvo[2])) p.push('costas deveria posicionar ATRAS (z negativo)');
const semFolga = { ...P.corpo, headroom: 0 };
// headroom afasta: preset com folga > mesmo preset sem folga
if (!(dist(eCorpo) > (() => { const m = ((1.8 * P.corpo.alturaEnquadrada) / 2) / Math.tan((P.corpo.fov * Math.PI) / 360); return m; })())) p.push('headroom nao afasta a camera');
for (const [id, l] of Object.entries(LOOKS)) {
  if (!(l.sombra && l.sombra.bias < 0 && l.sombra.raio > 0)) p.push(id + ': sombra invalida');
  if (l.fog !== null && !(l.fog.far > l.fog.near && l.fog.near > 0)) p.push(id + ': fog invalido');
}
if (LOOKS.estudio.fog !== null) p.push('estudio NAO pode ter fog (contrato canonico)');
if (!LOOKS.dramatic.fog) p.push('dramatic deveria ter fog');
console.log(JSON.stringify(p));
`);
    const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')].find((c) => existsSync(c)) ?? 'esbuild';
    execSync(`"${esbuild}" "${join(tmp, 'prova.ts')}" --bundle --format=esm --platform=node --alias:@painel="${PAINEL}/src" --outfile="${join(tmp, 'prova.mjs')}"`, { stdio: ['ignore', 'ignore', 'inherit'] });
    const saida = execSync(`node "${join(tmp, 'prova.mjs')}"`, { encoding: 'utf8' }).trim().split('\n').pop();
    for (const m of JSON.parse(saida)) falhas.push(`[A] ${m}`);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}

// ── B) Navegador ────────────────────────────────────────────────────
async function abrirPalco3d(flags) {
  const { navegador, pagina, erros } = await abrir({
    viewport: { width: 1500, height: 940 }, webgl: true,
    init: ({ f }) => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f));
      try { localStorage.setItem('dshow.avst6.qualidade.v1', 'alto'); } catch { /* ok */ }
    },
    initArg: { f: { 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': true, 'as5.quality3d_v2': false, 'as5.hud3d': true, ...flags } },
  });
  await pagina.emulateMedia({ reducedMotion: 'reduce' });
  await irParaHarness(pagina, 'avst-harness.html', 1200);
  await pagina.locator('[data-teste="botao-3d"]').click();
  await pagina.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 45000 });
  await pagina.waitForTimeout(6000);
  return { pagina, erros, fechar: () => navegador.close() };
}

// B1: flags OFF — bookmarks ausentes
{
  const { pagina, fechar } = await abrirPalco3d({});
  ok((await pagina.locator('[data-teste="p3d-cam-busto"]').count()) === 0, '[B1] bookmark visivel SEM as6.camera_v2');
  await fechar();
}

// B2: camera_v2 + sombras_v2 ON
{
  const { pagina, erros: errosJs, fechar } = await abrirPalco3d({ 'as6.camera_v2': true, 'as6.sombras_v2': true, 'as6.looks': true });
  ok((await pagina.locator('[data-teste="p3d-cam-busto"]').count()) === 1, '[B2] bookmark busto ausente com a flag');
  const info = async () => pagina.evaluate(() => {
    const r = window.__avst3d;
    return r && r.camera ? {
      fov: r.camera.fov,
      pos: [r.camera.position.x, r.camera.position.y, r.camera.position.z],
      mapa: r.luzes?.chave?.shadow?.mapSize?.x ?? 0,
      fakeVisivel: r.chao?.visible ?? null,
      temTextura: Boolean(r.chao?.material?.map),
      fog: Boolean(r.cena?.fog),
      chaoTipo: r.chaoAtivo ? r.chaoAtivo() : null,
      minPolar: r.controles ? r.controles.minPolarAngle : null,
    } : null;
  });
  await pagina.locator('[data-teste="p3d-cam-busto"]').evaluate((el) => el.click());
  await pagina.waitForTimeout(800); // transição 300ms + folga
  let i = await info();
  ok(i && Math.round(i.fov) === 28, `[B2] busto deveria por FOV 28 (veio ${i?.fov})`);
  ok(i && i.mapa === 2048, `[B2] tier alto deveria usar shadow map 2048 (veio ${i?.mapa})`);
  ok(i && i.fakeVisivel === true && i.temTextura, '[B2] contact shadow procedural deveria estar SEMPRE visivel');
  // guard #165d: repetir o MESMO modo nao mexe a camera
  const antes = i.pos;
  await pagina.evaluate(() => { window.__avst3d.definirCamera({ modo: 'busto' }); });
  await pagina.waitForTimeout(500);
  i = await info();
  ok(i && JSON.stringify(i.pos) === JSON.stringify(antes), '[B2] #165d: mesmo modo NAO pode reenquadrar');
  // face muda o FOV (transicao)
  await pagina.locator('[data-teste="p3d-cam-face"]').evaluate((el) => el.click());
  await pagina.waitForTimeout(800);
  i = await info();
  ok(i && Math.round(i.fov) === 24, `[B2] face deveria por FOV 24 (veio ${i?.fov})`);
  // fog por look: dramatic tem, estudio nao
  await pagina.evaluate(() => { window.__avst3d.aplicarLook('dramatic'); });
  await pagina.waitForTimeout(200);
  ok((await info())?.fog === true, '[B2] dramatic deveria ligar o fog');
  await pagina.evaluate(() => { window.__avst3d.aplicarLook('estudio'); });
  await pagina.waitForTimeout(200);
  ok((await info())?.fog === false, '[B2] estudio NAO pode ter fog');
  // chao v2 responde
  await pagina.evaluate(() => { window.__avst3d.definirChao('gloss'); });
  ok((await info())?.chaoTipo === 'gloss', '[B2] definirChao(gloss) nao aplicou');
  await pagina.evaluate(() => { window.__avst3d.definirChao('studio_matte'); });
  ok((await info())?.chaoTipo === 'studio_matte', '[B2] definirChao(studio_matte) nao restaurou');
  // orbita com limites
  await pagina.locator('[data-teste="p3d-orbita"]').evaluate((el) => el.click());
  await pagina.waitForTimeout(400);
  i = await info();
  ok(i && i.minPolar !== null && i.minPolar > 0, '[B2] orbita sem limites polares (as6.camera_v2)');
  ok(!errosJs.length, `[B2] erros JS: ${errosJs.slice(0, 2).join(' | ')}`);
  await fechar();
}

console.log('[camera3d] FALHAS:', falhas.length ? falhas.join(' || ') : 'nenhuma');
process.exit(falhas.length ? 1 : 0);
