// testes/corpo3d-v2.mjs — onda 1422 (MEGA_BRIEFING_01 Parte 2 P2-B/C/E;
// decisões #210/#211): BODY API — fonte única do corpo + body.v2.
//
//   A) Node puro — Corpo3d: PRESETS_CORPO snapshot literal §102 e MESMO
//      objeto no engine 2D (domain/corpo102 — fim da triplicação);
//      resolverCorpo com paridade EXATA à matemática anterior (clamps
//      0.88–1.15 / 0.9–1.07) em todos os presets × finos; morfos v2 →
//      segmentos clampados ao envelope; sanitizarCorpoV2 (enum, clamp
//      ±1, 2 casas, 0/vazio omitido); migração tipo→preset identidade;
//      POSTURAS_3D cobre as 5 posturas; SOCKETS_CORPO aponta p/ bones
//      reais do rig ubc-v1; aliases mixamo normalizam; validarConfig
//      aceita/limpa corpoV2 (neutro NÃO persiste); espelho PHP presente
//      (enum + morfos + clamp) e php -l verde.
//   B) Navegador (base_superhero_m, rig ubc-v1 real):
//      1. flags OFF: corpoV2 no estado NÃO muda a escala (byte a byte);
//      2. as6.corpo_v2 ON: definirCorpo3d com v2 aplica preset (escala
//         §102) + bone scaling por segmento (clavicles escaladas, com
//         restauração ao voltar p/ neutro); as6.corpo_grounding re-ancora
//         min.y ≈ 0; anexarNoSocket(mao_d) pendura no bone hand_r;
//         definirPostura3d inclina e null restaura; zero erros JS.
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
  const tmp = mkdtempSync(join(tmpdir(), 'avst-1422-'));
  try {
    writeFileSync(join(tmp, 'prova.ts'), `
import { PRESETS_CORPO, ENVELOPE_CORPO, MORPHS_CORPO, POSTURAS_3D, SOCKETS_CORPO, ALIASES_BONES, resolverCorpo, sanitizarCorpoV2, migrarTipoParaPreset, normalizarBone } from '@painel/services/Corpo3d';
import { PRESETS_CORPO as TABELA_DOMINIO } from '@painel/domain/corpo102';
import { REGIOES_UBC } from '@painel/services/Assembler3d';
import { validarConfig } from '@painel/services/AvatarCatalog';
const p: string[] = [];
// snapshot literal §102 (mudou = decisão numerada)
if (JSON.stringify(PRESETS_CORPO) !== JSON.stringify({ esbelto: [0.95, 1.02], atletico: [1.05, 1], robusto: [1.1, 0.98], compacto: [0.97, 0.94] })) p.push('tabela §102 divergiu do snapshot');
if (PRESETS_CORPO !== TABELA_DOMINIO) p.push('services e domain nao compartilham o MESMO objeto (triplicacao voltou)');
// paridade EXATA com a matemática anterior (clamps antigos)
const antigo = (tipo: string, fino: { largura?: number; altura?: number } | null) => {
  const preset = (PRESETS_CORPO as Record<string, [number, number]>)[tipo] ?? [1, 1];
  return [
    Math.min(1.15, Math.max(0.88, preset[0] * (fino?.largura ?? 1))),
    Math.min(1.07, Math.max(0.9, preset[1] * (fino?.altura ?? 1))),
  ];
};
for (const tipo of ['esbelto', 'atletico', 'robusto', 'compacto', 'zzz', '']) {
  for (const fino of [null, { largura: 1.08 }, { altura: 0.96 }, { largura: 0.92, altura: 1.04 }, { largura: 5 }]) {
    const r = resolverCorpo(tipo, fino);
    const a = antigo(tipo, fino);
    if (r.escala[0] !== a[0] || r.escala[1] !== a[1]) p.push('paridade quebrou: ' + tipo + ' ' + JSON.stringify(fino) + ' -> ' + JSON.stringify(r.escala) + ' != ' + JSON.stringify(a));
  }
}
const neutro = resolverCorpo(null, null, null);
if (neutro.escala[0] !== 1 || neutro.escala[1] !== 1 || Object.keys(neutro.segmentos).length || neutro.origem !== 'neutro') p.push('neutro nao e neutro');
// v2: preset vence o legado; morfos viram segmentos clampados
const v2 = resolverCorpo('esbelto', null, { preset: 'robusto', morfos: { ombros: 1, cintura: -1 } });
if (v2.escala[0] !== 1.1) p.push('preset v2 deveria vencer o legado');
if (v2.origem !== 'v2') p.push('origem v2 errada');
if (!v2.segmentos.clavicle_l || Math.abs(v2.segmentos.clavicle_l.escala - 1.1) > 1e-9) p.push('morfo ombros +1 deveria escalar clavicle 1.1');
if (!v2.segmentos.pelvis || Math.abs(v2.segmentos.pelvis.escala - 0.92) > 1e-9) p.push('morfo cintura -1 deveria clampar no envelope 0.92 (1-0.1=0.9 < 0.92)');
if (v2.segmentos.pelvis.eixo !== 'xz') p.push('cintura deveria escalar so xz');
// sanitizar
if (sanitizarCorpoV2(null) !== null || sanitizarCorpoV2({}) !== null) p.push('vazio deveria dar null');
if (sanitizarCorpoV2({ preset: 'gigante' }) !== null) p.push('preset invalido deveria cair');
const s1 = sanitizarCorpoV2({ preset: 'atletico', morfos: { ombros: 9, torax: 0, pernas: -0.333, alien: 1 } });
if (!s1 || s1.preset !== 'atletico') p.push('sanitizar perdeu o preset');
if (!s1?.morfos || s1.morfos.ombros !== 1 || s1.morfos.pernas !== -0.33 || 'torax' in (s1.morfos ?? {}) || 'alien' in (s1.morfos ?? {})) p.push('sanitizar morfos errado: ' + JSON.stringify(s1));
// migracao identidade
for (const t of ['esbelto', 'atletico', 'robusto', 'compacto']) if (migrarTipoParaPreset(t) !== t) p.push('migracao nao e identidade: ' + t);
if (migrarTipoParaPreset('x') !== null) p.push('migracao deveria recusar desconhecido');
// posturas
for (const id of ['confiante', 'relaxada', 'executiva', 'heroica', 'misteriosa']) {
  const po = (POSTURAS_3D as Record<string, { amplitudeIdle: number }>)[id];
  if (!po || !(po.amplitudeIdle > 0)) p.push('postura sem perfil: ' + id);
}
// sockets → bones do rig
const bonesRig = new Set(Object.values(REGIOES_UBC).flat().map((b: string) => b.toLowerCase()));
for (const [id, s] of Object.entries(SOCKETS_CORPO)) {
  if (!bonesRig.has(s.bone.toLowerCase())) p.push('socket ' + id + ' aponta p/ bone fora do rig: ' + s.bone);
}
// aliases
if (normalizarBone('mixamorig:LeftHand') !== 'hand_l' || normalizarBone('Hips') !== 'pelvis' || normalizarBone('hand_r') !== 'hand_r' || normalizarBone('Head') !== 'Head') p.push('normalizarBone errado');
if (Object.keys(ALIASES_BONES).some((k) => k !== k.toLowerCase())) p.push('aliases devem ser lowercase');
// validarConfig: corpoV2 sanitizado; neutro nao persiste
const cfg = validarConfig({ base: 'bas_classica', corpoV2: { preset: 'robusto', morfos: { ombros: 0 } } });
if (!cfg.corpoV2 || cfg.corpoV2.preset !== 'robusto' || cfg.corpoV2.morfos) p.push('validarConfig corpoV2 errado: ' + JSON.stringify(cfg.corpoV2));
const cfg2 = validarConfig({ base: 'bas_classica', corpoV2: { morfos: { ombros: 0 } } });
if (cfg2.corpoV2 !== undefined) p.push('corpoV2 neutro NAO pode persistir');
console.log(JSON.stringify(p));
`);
    const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')].find((c) => existsSync(c)) ?? 'esbuild';
    execSync(`"${esbuild}" "${join(tmp, 'prova.ts')}" --bundle --format=esm --platform=node --alias:@painel="${PAINEL}/src" --outfile="${join(tmp, 'prova.mjs')}"`, { stdio: ['ignore', 'ignore', 'inherit'] });
    const saida = execSync(`node "${join(tmp, 'prova.mjs')}"`, { encoding: 'utf8' }).trim().split('\n').pop();
    for (const m of JSON.parse(saida)) falhas.push(`[A] ${m}`);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}

// A2: espelho PHP (enum, morfos, clamp) + php -l
{
  const { execSync } = await import('node:child_process');
  const { readFileSync } = await import('node:fs');
  const { join, resolve } = await import('node:path');
  const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
  const php = readFileSync(join(RAIZ, 'api', 'avatar', 'studio.php'), 'utf8');
  ok(php.includes("'corpoV2'"), '[A2] studio.php sem espelho de corpoV2');
  ok(php.includes("['ombros', 'torax', 'cintura', 'bracos', 'pernas']"), '[A2] PHP sem a lista de morfos');
  ok(/min\(1\.0, max\(-1\.0/.test(php), '[A2] PHP sem o clamp -1..1 do morfo');
  try {
    execSync('php -l api/avatar/studio.php', { cwd: RAIZ, stdio: 'pipe' });
  } catch { falhas.push('[A2] php -l reprovou studio.php'); }
}

// ── B) Navegador ────────────────────────────────────────────────────
async function abrirPalco3d(flags) {
  const { navegador, pagina, erros } = await abrir({
    viewport: { width: 1500, height: 940 }, webgl: true,
    init: ({ f }) => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f));
      try {
        localStorage.setItem('dshow.avst6.qualidade.v1', 'alto');
        localStorage.setItem('dshow.avst5.p3d.personagem.v1', 'base_superhero_m'); // rig ubc-v1 real
      } catch { /* ok */ }
    },
    initArg: { f: { 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': true, 'as5.quality3d_v2': false, 'as5.hud3d': true, ...flags } },
  });
  await pagina.emulateMedia({ reducedMotion: 'reduce' });
  await irParaHarness(pagina, 'avst-harness.html', 1200);
  await pagina.locator('[data-teste="botao-3d"]').click();
  await pagina.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 45000 });
  await pagina.waitForTimeout(7000);
  return { pagina, erros, fechar: () => navegador.close() };
}

// B1: flags OFF — v2 no definirCorpo3d NÃO muda nada (renderer ignora sem flag)
{
  const { pagina, fechar } = await abrirPalco3d({});
  const r = await pagina.evaluate(() => {
    const rr = window.__avst3d;
    const antes = rr.personagem ? [rr.personagem.scale.x, rr.personagem.scale.y] : null;
    rr.definirCorpo3d({ tipo: null, fino: null, v2: { preset: 'robusto', morfos: { ombros: 1 } } });
    const depois = rr.personagem ? [rr.personagem.scale.x, rr.personagem.scale.y] : null;
    return { antes, depois };
  });
  ok(r.antes && r.depois && r.antes[0] === r.depois[0] && r.antes[1] === r.depois[1],
    `[B1] corpoV2 mudou a escala SEM as6.corpo_v2 (${r.antes} -> ${r.depois})`);
  await fechar();
}

// B2: corpo_v2 + grounding ON — bone scaling, sockets, postura
{
  const { pagina, erros: errosJs, fechar } = await abrirPalco3d({ 'as6.corpo_v2': true, 'as6.corpo_grounding': true, 'as5.morfos3d': true });
  const r = await pagina.evaluate(() => {
    const rr = window.__avst3d;
    const acharBone = (nome) => {
      let b = null;
      rr.personagem?.traverse?.((o) => { if (!b && o.isBone && o.name.toLowerCase() === nome) b = o; });
      return b;
    };
    // v2: preset + morfo ombros
    rr.definirCorpo3d({ tipo: null, fino: null, v2: { preset: 'robusto', morfos: { ombros: 1 } } });
    const escala = rr.personagem ? [rr.personagem.scale.x, rr.personagem.scale.y] : null;
    const clav = acharBone('clavicle_l');
    const escalaClav = clav ? clav.scale.x : null;
    // grounding: min.y ~ 0
    rr.personagem?.updateMatrixWorld?.(true);
    // socket real (Object3D obtido via clone raso de uma luz — sem THREE global)
    const THREEobj = rr.luzes ? rr.luzes.preencher.clone() : null;
    let socketOk = false;
    let paiSocket = null;
    if (THREEobj) {
      THREEobj.name = 'prova-socket';
      socketOk = rr.anexarNoSocket(THREEobj, 'mao_d');
      paiSocket = THREEobj.parent ? THREEobj.parent.name : null;
      THREEobj.parent?.remove?.(THREEobj);
    }
    // postura
    rr.definirPostura3d('heroica');
    const rotComPostura = rr.personagem ? rr.personagem.rotation.z : null;
    rr.definirPostura3d(null);
    const rotSemPostura = rr.personagem ? rr.personagem.rotation.z : null;
    // neutro restaura segmentos
    rr.definirCorpo3d(null);
    const clavDepois = acharBone('clavicle_l');
    return {
      escala, escalaClav, socketOk, paiSocket,
      rotComPostura, rotSemPostura,
      escalaClavDepois: clavDepois ? clavDepois.scale.x : null,
    };
  });
  ok(r.escala && Math.abs(r.escala[0] - 1.1) < 1e-6 && Math.abs(r.escala[1] - 0.98) < 1e-6, `[B2] preset robusto v2 nao aplicou a escala §102 (${r.escala})`);
  ok(r.escalaClav !== null && Math.abs(r.escalaClav - 1.1) < 1e-6, `[B2] bone scaling ombros +1 nao escalou clavicle (${r.escalaClav})`);
  ok(r.socketOk === true && r.paiSocket === 'hand_r', `[B2] anexarNoSocket(mao_d) deveria pendurar em hand_r (ok=${r.socketOk}, pai=${r.paiSocket})`);
  ok(r.rotComPostura !== null && Math.abs(r.rotComPostura - (-0.05)) < 1e-6, `[B2] postura heroica deveria inclinar -0.05 (${r.rotComPostura})`);
  ok(r.rotSemPostura === 0, `[B2] definirPostura3d(null) deveria restaurar (${r.rotSemPostura})`);
  ok(r.escalaClavDepois !== null && Math.abs(r.escalaClavDepois - 1) < 1e-6, `[B2] neutro deveria RESTAURAR a escala do bone (${r.escalaClavDepois})`);
  // grounding: pés no chão
  const minY = await pagina.evaluate(() => {
    const rr = window.__avst3d;
    rr.definirCorpo3d({ tipo: 'robusto', fino: null, v2: null });
    rr.personagem?.updateMatrixWorld?.(true);
    // Box3 via renderer interno: usa a cena p/ obter THREE
    const caixa = rr.ultimaMontagem !== undefined && rr.personagem ? (() => {
      let min = Infinity;
      rr.personagem.traverse((o) => {
        if (o.isMesh && o.geometry) {
          o.geometry.computeBoundingBox?.();
          const bb = o.geometry.boundingBox;
          if (bb) {
            const v = bb.min.clone().applyMatrix4(o.matrixWorld);
            min = Math.min(min, v.y);
          }
        }
      });
      return min;
    })() : null;
    return caixa;
  });
  ok(minY !== null && minY > -0.12, `[B2] grounding deveria manter os pés perto do chão (min.y=${minY})`);
  ok(!errosJs.length, `[B2] erros JS: ${errosJs.slice(0, 2).join(' | ')}`);
  await fechar();
}

console.log('[corpo3d-v2] FALHAS:', falhas.length ? falhas.join(' || ') : 'nenhuma');
process.exit(falhas.length ? 1 : 0);
