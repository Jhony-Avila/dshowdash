// testes/bundle-assets.mjs — onda 1409 (MEGA_BRIEFING_01 §2783–§2804, §2946;
// PERFORMANCE-BUDGETS.md §2/§3): ORÇAMENTOS DE ASSET como contrato executável.
//
// Node puro (sem navegador). Verifica:
//   A) bundle JS do painel NÃO embute assets (GLB/KTX2/HDR/EXR/PNG/JPG/WebP
//      como data: URL) — assets vêm sempre por URL (§2783); nenhum chunk
//      com base64 binário > 8 KB; dist/assets só CSS + workers;
//   B) budgets.json íntegro (classes do PERFORMANCE-BUDGETS §3, fatores,
//      regressão histórica) e medir-perf-asset determinístico (2 execuções
//      = mesmo JSON; perf-assets.json commitado coincide — "o diff é o
//      relatório");
//   C) regra de orçamento: asset `production` fora do teto = AVISO (nunca
//      erro — §2804 sem reprovação retroativa); `premium` fora = ERRO;
//      asset dentro do teto = dentroDoOrcamento=true; regressão histórica
//      (+40 % bytes / +50 % VRAM) detectada;
//   D) validador: LODs idênticos → NOTA em production, ERRO em premium
//      (#165b, §2625–§2636); exceção declarada vira aviso;
//   E) auditar-lods determinístico e coerente com o validador (classes).
// @version 1.0.0  @created 2026-08-19
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync, cpSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { BUDGETS, medirAsset, medirTudo, regressoes, classeDe } from '../assets3d/medir-perf-asset.mjs';
import { validarAsset } from '../assets3d/validar-asset.mjs';
import { auditarTudo, auditarPasta } from '../assets3d/auditar-lods.mjs';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const DIST = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio', 'dist');
const ASSETS3D = join(RAIZ, 'public', 'assets', 'avatars', '3d');
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── A) bundle sem assets embutidos ─────────────────────────────────
if (!existsSync(DIST)) {
  falhas.push('[A] dist do painel ausente — rodar o build antes');
} else {
  const chunks = readdirSync(join(DIST, 'chunks')).filter((f) => f.endsWith('.js'));
  ok(chunks.length >= 15, `[A] poucos chunks no dist (${chunks.length})`);
  const reBin = /data:(application\/octet-stream|model\/gltf-binary|image\/(png|jpe?g|webp|ktx2)|image\/vnd\.radiance)[^"'`]{0,40};base64,([A-Za-z0-9+/=]{8192,})/;
  for (const f of chunks) {
    const txt = readFileSync(join(DIST, 'chunks', f), 'utf8');
    ok(!reBin.test(txt), `[A] chunk ${f} embute asset binário em base64 (>8 KB) — assets vão por URL (§2783)`);
  }
  const proibidos = ['.glb', '.gltf', '.ktx2', '.hdr', '.exr', '.png', '.jpg', '.jpeg', '.webp', '.bin'];
  for (const f of readdirSync(join(DIST, 'assets'))) {
    ok(!proibidos.some((e) => f.endsWith(e)), `[A] dist/assets contém asset binário "${f}" — assets 3D/texturas ficam em public/assets (fora do bundle)`);
  }
  const peso = (d) => readdirSync(d).reduce((n, f) => n + statSync(join(d, f)).size, 0);
  ok(peso(join(DIST, 'chunks')) < 3 * 1024 * 1024, '[A] chunks somam > 3 MB — conferir gate de peso');
}

// ── B) budgets + determinismo ──────────────────────────────────────
const CLASSES_EXIGIDAS = ['personagem_base', 'parte_cabelo', 'parte_roupa', 'parte_acessorio', 'parte_acessorio:small', 'parte_acessorio:hero', 'pet', 'companion', 'cenario'];
for (const c of CLASSES_EXIGIDAS) ok(!!BUDGETS.classes[c], `[B] budgets.json sem a classe "${c}" (PERFORMANCE-BUDGETS §3)`);
for (const [c, b] of Object.entries(BUDGETS.classes)) {
  for (const k of ['triangulos', 'materiais', 'texturaMax', 'texturas', 'bytesLod0', 'drawCalls', 'vramMB']) ok(Number.isFinite(b[k]) && b[k] > 0, `[B] classe ${c} sem ${k} numérico`);
}
ok(BUDGETS.fatorLod.lod1 === 0.5 && BUDGETS.fatorLod.lod2 === 0.2, '[B] fatorLod diverge do alvo §2630 (50 % / 20 %)');
ok(BUDGETS.regressaoHistorica.loadPct === 40 && BUDGETS.regressaoHistorica.texturaPct === 50, '[B] regressão histórica diverge de §2804 (+40 % / +50 %)');
ok(BUDGETS.classes.personagem_base.triangulos === 30000 && BUDGETS.classes.parte_cabelo.triangulos === 12000 && BUDGETS.classes.parte_roupa.triangulos === 10000, '[B] tetos de triângulos divergem da tabela PERFORMANCE-BUDGETS §3');
const r1 = medirTudo(); const r2 = medirTudo();
ok(JSON.stringify(r1) === JSON.stringify(r2), '[B] medir-perf-asset NÃO determinístico');
ok(r1.resumo.total === 34, `[B] esperado 34 assets medidos, veio ${r1.resumo.total}`);
const perfJson = join(RAIZ, 'docs', 'AVATAR-STUDIO-5', 'evidencias', 'perf-assets.json');
ok(existsSync(perfJson), '[B] evidencias/perf-assets.json ausente');
if (existsSync(perfJson)) {
  const grav = JSON.parse(readFileSync(perfJson, 'utf8'));
  const semReg = (r) => JSON.stringify({ ...r, resumo: { ...r.resumo, regressoes: [] } });
  ok(semReg(grav) === semReg(r1), '[B] perf-assets.json commitado diverge da medição atual — regenerar (node scripts/avatar/assets3d/medir-perf-asset.mjs)');
}
ok(r1.resumo.comErro.length === 0, `[B] assets com ERRO de orçamento (só premium/hero erram): ${r1.resumo.comErro.join(', ')}`);
for (const a of r1.assets) ok(a.classe !== null || BUDGETS.ignorar.includes(a.tipo), `[B] ${a.id}: tipo ${a.tipo} sem classe de orçamento`);
const ubc = r1.assets.find((a) => a.id === 'base_superhero_m');
ok(ubc && ubc.lods.lod0.triangulos === 14318 && ubc.lods.lod0.texturas === 7 && ubc.lods.lod0.texturaMax === 2048, '[B] medidas do base_superhero_m fora do esperado (14318 tri / 7 tex / 2048px)');

// ── C) regra de orçamento em fixtures ──────────────────────────────
const tmp = mkdtempSync(join(tmpdir(), 'perf-1409-'));
try {
  const origem = join(ASSETS3D, 'personagens', 'base_superhero_m');
  const fx = (nome, patch) => {
    const d = join(tmp, nome); cpSync(origem, d, { recursive: true });
    const m = JSON.parse(readFileSync(join(d, 'manifest.json'), 'utf8'));
    writeFileSync(join(d, 'manifest.json'), JSON.stringify({ ...m, ...patch }));
    return d;
  };
  const prod = medirAsset(fx('prod', { qualidadeVisual: 'production' }));
  ok(prod.erros.length === 0 && prod.avisos.some((a) => a.includes('texturas 7')), '[C] production fora do teto deveria AVISAR (não errar) — §2804');
  ok(prod.dentroDoOrcamento === false, '[C] production fora do teto deveria marcar dentroDoOrcamento=false');
  const prem = medirAsset(fx('prem', { qualidadeVisual: 'premium' }));
  ok(prem.erros.length > 0 && prem.erros.some((a) => a.includes('texturas 7')), '[C] premium fora do teto deveria ERRAR');
  const pet = medirAsset(fx('pet', { tipo: 'pet', qualidadeVisual: 'production' }));
  ok(pet.classe === 'pet', '[C] classe por tipo "pet" não resolvida');
  const small = medirAsset(fx('small', { tipo: 'parte_acessorio', perfClasse: 'small' }));
  ok(small.classe === 'parte_acessorio:small', '[C] perfClasse explícita não resolvida');
  const anim = medirAsset(fx('anim', { tipo: 'pacote_animacoes' }));
  ok(anim.classe === null && anim.avisos.length === 0, '[C] tipo ignorado (pacote_animacoes) não deveria avisar');
  ok(classeDe({ tipo: 'tipo_inexistente' }) === null, '[C] tipo inexistente deveria dar classe null');
  // regressão histórica §2804
  const antes = { assets: [{ id: prod.id, lods: { lod0: { bytes: prod.lods.lod0.bytes / 2, vramMB: prod.lods.lod0.vramMB / 2 } } }] };
  const reg = regressoes([prod], antes);
  ok(reg.some((r) => r.metrica === 'bytes lod0') && reg.some((r) => r.metrica === 'vram lod0'), '[C] regressão histórica (+100 %) não detectada');
  ok(regressoes([prod], { assets: [{ id: prod.id, lods: { lod0: { bytes: prod.lods.lod0.bytes, vramMB: prod.lods.lod0.vramMB } } }] }).length === 0, '[C] falso positivo de regressão (0 %)');

  // ── D) validador: LODs idênticos ──
  const vProd = validarAsset(fx('vprod', { qualidadeVisual: 'production' }), { rigCanonico: [] });
  ok(vProd.medidas.classeLod === 'lod1=lod0', `[D] classeLod esperada lod1=lod0, veio ${vProd.medidas.classeLod}`);
  ok(!vProd.erros.some((e) => e.includes('LODs sem decimação')) && !vProd.avisos.some((a) => a.includes('LODs sem decimação')) && vProd.notas.some((a) => a.includes('LODs sem decimação')), '[D] production com LODs iguais deveria virar NOTA (nem erro nem ressalva — contrato UBC limpo)');
  const premManifest = JSON.parse(readFileSync(join(origem, 'manifest.json'), 'utf8'));
  const vPrem = validarAsset(fx('vprem', { qualidadeVisual: 'premium', qaVisual: { status: 'approved', reviewer: 'x', date: '2026-08-19', notes: '' }, bounds: { min: [0, 0, 0], max: [1, 1, 1] }, artBibleVersion: '1.0', materiais: premManifest.materiais ?? {} }), { rigCanonico: [] });
  ok(vPrem.erros.some((e) => e.includes('LODs sem decimação') && e.includes('premium')), `[D] premium com LODs iguais deveria ERRAR: ${vPrem.erros.join(' | ')}`);
  const vExc = validarAsset(fx('vexc', { qualidadeVisual: 'premium', excecoes: { lod: 'asset baixo-poli, 1 LOD basta (§2636)' }, qaVisual: { status: 'approved', reviewer: 'x', date: '2026-08-19', notes: '' }, bounds: { min: [0, 0, 0], max: [1, 1, 1] }, artBibleVersion: '1.0', materiais: premManifest.materiais ?? {} }), { rigCanonico: [] });
  ok(!vExc.erros.some((e) => e.includes('LODs sem decimação')) && vExc.notas.some((a) => a.includes('EXCEÇÃO declarada')), '[D] exceção declarada deveria virar nota');
  // validador de cabelo/roupa (§1631–§1635): alpha declarado sem BLEND = aviso;
  // roupa premium com >3 materiais = ERRO; production = aviso
  const cab = join(ASSETS3D, 'partes', 'cab_longo');
  const fxCab = (nome, patch) => { const d = join(tmp, nome); cpSync(cab, d, { recursive: true }); const m = JSON.parse(readFileSync(join(d, 'manifest.json'), 'utf8')); writeFileSync(join(d, 'manifest.json'), JSON.stringify({ ...m, ...patch })); return d; };
  const vCab = validarAsset(fxCab('cab-blend', { alpha: 'blend' }), { rigCanonico: [] });
  ok(vCab.avisos.some((a) => a.includes('declara alpha blend')) && vCab.medidas.alpha?.[0] === 'OPAQUE', '[D] alpha declarado sem material BLEND deveria avisar');
  const terno = join(ASSETS3D, 'personagens', 'humano_terno'); // 10 materiais
  const fxT = (nome, patch) => { const d = join(tmp, nome); cpSync(terno, d, { recursive: true }); const m = JSON.parse(readFileSync(join(d, 'manifest.json'), 'utf8')); writeFileSync(join(d, 'manifest.json'), JSON.stringify({ ...m, ...patch })); return d; };
  const vRoupaProd = validarAsset(fxT('roupa-prod', { tipo: 'parte_roupa', qualidadeVisual: 'production' }), { rigCanonico: [] });
  ok(vRoupaProd.avisos.some((a) => a.includes('materiais (máx 3')) && !vRoupaProd.erros.some((a) => a.includes('máx 3')), '[D] roupa production com >3 materiais deveria AVISAR');
  const vRoupaPrem = validarAsset(fxT('roupa-prem', { tipo: 'parte_roupa', qualidadeVisual: 'premium', qaVisual: { status: 'approved', reviewer: 'x', date: '2026-08-19', notes: '' }, bounds: { min: [0, 0, 0], max: [1, 1, 1] }, artBibleVersion: '1.0', materiais: premManifest.materiais ?? {} }), { rigCanonico: [] });
  ok(vRoupaPrem.erros.some((a) => a.includes('materiais (máx 3')), '[D] roupa premium com >3 materiais deveria ERRAR');
  // auditar-lods coerente
  const aud = auditarPasta(fx('aud', {}), JSON.parse(readFileSync(join(origem, 'manifest.json'), 'utf8')));
  ok(aud.classe === 'lod1=lod0', `[D] auditar-lods classe ${aud.classe} ≠ validador lod1=lod0`);
} finally { rmSync(tmp, { recursive: true, force: true }); }

// ── E) auditar-lods determinístico + evidência ─────────────────────
const l1 = auditarTudo(); const l2 = auditarTudo();
ok(JSON.stringify(l1) === JSON.stringify(l2), '[E] auditar-lods NÃO determinístico');
ok(l1.resumo.total === 34 && l1.resumo.porClasse.identicos >= 1, '[E] auditoria de LODs sem os 34 assets');
const lodsJson = join(RAIZ, 'docs', 'AVATAR-STUDIO-5', 'evidencias', 'lods-3d.json');
ok(existsSync(lodsJson) && JSON.stringify(JSON.parse(readFileSync(lodsJson, 'utf8'))) === JSON.stringify(l1), '[E] evidencias/lods-3d.json diverge da auditoria atual — regenerar (node scripts/avatar/assets3d/auditar-lods.mjs)');
for (const a of l1.assets) {
  const v = r1.assets.find((x) => x.id === a.id);
  if (v && a.lods.lod0) ok(v.lods.lod0.triangulos === a.lods.lod0.triangulos || a.lods.lod0.triangulos === null, `[E] ${a.id}: triângulos do manifest (${a.lods.lod0.triangulos}) ≠ medidos (${v.lods.lod0.triangulos})`);
}

console.log('[bundle-assets] FALHAS:', falhas.length ? falhas.join(' || ') : 'nenhuma');
process.exit(falhas.length ? 1 : 0);
