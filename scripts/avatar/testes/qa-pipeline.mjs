// testes/qa-pipeline.mjs — onda 1410 (MEGA_BRIEFING_01 §2663–§2677, §2707,
// §2743–§2767; VISUAL-QA.md §5–§7): PIPELINE DE QA como contrato executável.
//
// Node puro (sem navegador). Verifica:
//   A) ficha-qa: criar (pending, eixos por categoria, não-aplicáveis null),
//      status machine §2675 (transições válidas/ inválidas; aprovar exige
//      notas+evidências+0 hard fails; approved_with_notes exige issue §3082;
//      approved é terminal), resumo espelhado no manifest `qaVisual`;
//   B) gate de publicação §2677 (premium sem approved recusa; override exige
//      motivo e LOGA em storage/visual-qa/overrides.log) + ingestão segura
//      §2748 (limite de MB, magic, URI externa);
//   C) cli.mjs: --dry-run não muda NADA no disco; preservarVersao snapshot;
//      restaurarVersao (rollback) devolve byte a byte; report/validate saem;
//   D) health score §2735 no index.json (determinístico, 0–100, penaliza
//      qaVisual ruim/deprecated) — regenerado = commitado;
//   E) avaliações puras herdadas da 1409: clipping (§415.2 — máscara
//      declarada rebaixa flag) e deformação (§400/§432 — pés sob o chão,
//      clipe que não move); evidencias/{clipping,deformacao}-3d.json íntegras.
// @version 1.0.0  @created 2026-08-20
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { criarFicha, transicionar, validarTransicao, eixosDe, lerFicha, EIXOS } from '../assets3d/ficha-qa.mjs';
import { verificarGatePublicacao, validarFonteSegura } from '../assets3d/publicar-asset.mjs';
import { preservarVersao, restaurarVersao } from '../assets3d/cli.mjs';
import { healthDe, gerarIndice3d } from '../assets3d/gerar-indice-3d.mjs';
import { avaliarClipping, baseDaParte, LIMITE_PCT_DENTRO } from '../assets3d/clipping-qa.mjs';
import { avaliarPoses } from '../assets3d/corpo-deformacao.mjs';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const ASSETS3D = join(RAIZ, 'public', 'assets', 'avatars', '3d');
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };
const tmp = mkdtempSync(join(tmpdir(), 'qa-1410-'));
const fx = (nome, patch = {}) => {
  const d = join(tmp, nome);
  cpSync(join(ASSETS3D, 'personagens', 'base_superhero_m'), d, { recursive: true });
  const m = JSON.parse(readFileSync(join(d, 'manifest.json'), 'utf8'));
  writeFileSync(join(d, 'manifest.json'), JSON.stringify({ ...m, ...patch }, null, 2));
  return d;
};

try {
  // ── A) ficha-qa ──────────────────────────────────────────────────
  ok(eixosDe('parte_cabelo').includes('cabelo') && !eixosDe('parte_cabelo').includes('rosto') && eixosDe('personagem_base').includes('rosto'), '[A] eixos por categoria errados');
  const dA = fx('ficha', { id: 'qa_fixture_a', versao: 99 });
  const { ficha: f0, criada } = criarFicha(dA);
  ok(criada && f0.status === 'pending' && !('rosto' in f0.notas) && f0.eixosAplicaveis.includes('rosto') && f0.notas.vfx === null, `[A] ficha inicial errada: ${JSON.stringify({ criada, status: f0.status, aplicaveis: f0.eixosAplicaveis.length, vfx: f0.notas.vfx })}`);
  ok(!criarFicha(dA).criada, '[A] criar de novo não deveria recriar');
  // transição inválida
  ok(!validarTransicao(f0, 'pending').ok, '[A] pending → pending deveria ser inválida');
  let recusou = null;
  try { transicionar(dA, 'approved', { reviewer: 'jhony' }); } catch (e) { recusou = e.message; }
  ok(recusou?.includes('eixos aplicáveis sem nota'), `[A] aprovar sem notas deveria recusar: ${recusou}`);
  // preencher notas + evidência falsa
  const notas = Object.fromEntries(eixosDe('personagem_base').map((e) => [e, 8]));
  let semReviewer = null;
  try { transicionar(dA, 'rework', { notas, evidencias: ['x_front.png'] }); } catch (e) { semReviewer = e.message; }
  ok(semReviewer?.includes('reviewer'), '[A] transição sem reviewer deveria recusar');
  transicionar(dA, 'rework', { reviewer: 'jhony', data: '2026-08-20', notas, evidencias: ['x_front.png'] });
  const mfA = JSON.parse(readFileSync(join(dA, 'manifest.json'), 'utf8'));
  ok(mfA.qaVisual.status === 'rework' && mfA.qaVisual.reviewer === 'jhony', `[A] manifest não espelhou o resumo: ${JSON.stringify(mfA.qaVisual)}`);
  transicionar(dA, 'pending', { softFails: ['highlight plástico'] }); // volta à rodada com um soft fail anotado
  // soft fail → approved exige with_notes + issue (validação falha = NADA persiste)
  let softErr = null;
  try { transicionar(dA, 'approved', { reviewer: 'jhony' }); } catch (e) { softErr = e.message; }
  ok(softErr?.includes('approved_with_notes'), '[A] approved com soft fail aberto deveria recusar');
  let issueErr = null;
  try { transicionar(dA, 'approved_with_notes', { reviewer: 'jhony' }); } catch (e) { issueErr = e.message; }
  ok(issueErr?.includes('§3082'), '[A] with_notes sem issue deveria recusar');
  const { ficha: fOk } = transicionar(dA, 'approved_with_notes', { reviewer: 'jhony', data: '2026-08-20', issues: [{ texto: 'highlight plástico', owner: 'jhony', severidade: 'S3', prazo: '2026-09-01' }] });
  ok(fOk.status === 'approved_with_notes' && fOk.historico.length === 3, `[A] histórico/status: ${fOk.status}/${fOk.historico.length}`);
  ok(!validarTransicao(fOk, 'pending').ok, '[A] approved_with_notes deveria ser terminal');
  // hard fail bloqueia
  const dH = fx('ficha-hard', { id: 'qa_fixture_h', versao: 99 });
  criarFicha(dH);
  let hardErr = null;
  try { transicionar(dH, 'approved', { reviewer: 'jhony', notas, evidencias: ['e.png'], hardFails: ['clipping grosseiro'] }); } catch (e) { hardErr = e.message; }
  ok(hardErr?.includes('hard fail') || hardErr?.includes('hard fails'), `[A] hard fail deveria bloquear aprovação: ${hardErr}`);
  ok(lerFicha(dH).ficha.status === 'pending', '[A] transição recusada não pode mudar o status');
  ok(EIXOS.length === 18, '[A] 18 eixos (VISUAL-QA §1)');

  // ── B) gate + ingestão ───────────────────────────────────────────
  ok(verificarGatePublicacao({ id: 'x', qualidadeVisual: 'production' }).gate === 'nao_se_aplica', '[B] production não passa pelo gate');
  ok(verificarGatePublicacao({ id: 'x', qualidadeVisual: 'premium', qaVisual: { status: 'approved' } }).gate === 'aprovado', '[B] premium aprovado deveria passar');
  let gateErr = null;
  try { verificarGatePublicacao({ id: 'x', qualidadeVisual: 'hero', qaVisual: { status: 'pending' } }); } catch (e) { gateErr = e.message; }
  ok(gateErr?.includes('§2677'), '[B] hero pendente deveria recusar');
  let semMotivo = null;
  try { verificarGatePublicacao({ id: 'x', qualidadeVisual: 'premium', qaVisual: { status: 'rework' } }, { override: true }); } catch (e) { semMotivo = e.message; }
  ok(semMotivo?.includes('motivo'), '[B] override sem motivo deveria recusar');
  const rOv = verificarGatePublicacao({ id: 'qa_fixture_ov', versao: 9, qualidadeVisual: 'premium', qaVisual: { status: 'pending' } }, { override: true, motivo: 'teste 1410', log: () => {}, raiz: tmp });
  ok(rOv.gate === 'override' && readFileSync(join(tmp, 'storage', 'visual-qa', 'overrides.log'), 'utf8').includes('qa_fixture_ov'), '[B] override deveria logar em overrides.log');
  // ingestão
  const segOk = validarFonteSegura(join(ASSETS3D, 'personagens', 'base_superhero_m', 'modelo.lod2.glb'));
  ok(segOk.mb > 0 && segOk.imagens === 7, `[B] fonte válida: ${JSON.stringify(segOk)}`);
  let tamErr = null;
  try { validarFonteSegura(join(ASSETS3D, 'personagens', 'base_superhero_m', 'modelo.lod0.glb'), { limiteMB: 0.1 }); } catch (e) { tamErr = e.message; }
  ok(tamErr?.includes('limite de ingestão'), '[B] fonte acima do limite deveria recusar');
  let magicErr = null;
  try { validarFonteSegura(join(ASSETS3D, 'personagens', 'base_superhero_m', 'manifest.json')); } catch (e) { magicErr = e.message; }
  ok(magicErr?.includes('GLB'), '[B] não-GLB deveria recusar (magic)');
  // URI externa: GLB sintético mínimo com buffer uri http
  const gltfJson = JSON.stringify({ asset: { version: '2.0' }, buffers: [{ uri: 'https://exemplo.com/a.bin', byteLength: 4 }] });
  const pad = gltfJson + ' '.repeat((4 - (gltfJson.length % 4)) % 4);
  const glb = Buffer.concat([Buffer.from([0x67, 0x6c, 0x54, 0x46]), Buffer.alloc(16), Buffer.from(pad)]);
  glb.writeUInt32LE(2, 4); glb.writeUInt32LE(glb.length, 8); glb.writeUInt32LE(pad.length, 12); glb.writeUInt32LE(0x4e4f534a, 16);
  const arqGlb = join(tmp, 'externo.glb');
  writeFileSync(arqGlb, glb);
  let uriErr = null;
  try { validarFonteSegura(arqGlb); } catch (e) { uriErr = e.message; }
  ok(uriErr?.includes('URI externa'), `[B] URI externa deveria recusar: ${uriErr}`);

  // ── C) cli: dry-run, snapshot e rollback ─────────────────────────
  const dC = fx('versao', { id: 'qa_fixture_v', versao: 3 });
  const antes = readFileSync(join(dC, 'manifest.json'), 'utf8');
  const dry = preservarVersao(dC, { dry: true, log: () => {} });
  ok(dry.dry === true && !existsSync(join(RAIZ, 'storage', 'assets-3d-versoes', 'qa_fixture_v')), '[C] dry-run não pode criar snapshot');
  const snap = preservarVersao(dC, { log: () => {} });
  ok(existsSync(join(snap.destino, 'manifest.json')) && snap.versao === 3, '[C] snapshot v3 não criado');
  writeFileSync(join(dC, 'manifest.json'), antes.replace('"versao": 3', '"versao": 4'));
  restaurarVersao(dC, { para: 'v3', log: () => {} });
  ok(readFileSync(join(dC, 'manifest.json'), 'utf8') === antes, '[C] rollback não devolveu byte a byte');
  let rbErr = null;
  try { restaurarVersao(dC, { para: 'v9', log: () => {} }); } catch (e) { rbErr = e.message; }
  ok(rbErr?.includes('inexistente'), '[C] rollback p/ versão inexistente deveria recusar');
  rmSync(join(RAIZ, 'storage', 'assets-3d-versoes', 'qa_fixture_v'), { recursive: true, force: true });
  const cliOut = execSync(`node ${join(RAIZ, 'scripts/avatar/assets3d/cli.mjs')} publish ${dC} --dry-run`, { encoding: 'utf8' });
  ok(cliOut.includes('[dry-run] publish qa_fixture_v'), `[C] cli publish --dry-run: ${cliOut.trim()}`);
  ok(readFileSync(join(dC, 'manifest.json'), 'utf8') === antes, '[C] cli --dry-run mudou o manifest');
  const rep = execSync(`node ${join(RAIZ, 'scripts/avatar/assets3d/cli.mjs')} report ${join(ASSETS3D, 'personagens', 'base_superhero_m')}`, { encoding: 'utf8' });
  ok(rep.includes('health') && rep.includes('LODs: classe lod1=lod0') && rep.includes('QA:'), `[C] report incompleto`);

  // ── D) health no index ───────────────────────────────────────────
  const h = healthDe(join(ASSETS3D, 'personagens', 'base_superhero_m'), JSON.parse(readFileSync(join(ASSETS3D, 'personagens', 'base_superhero_m', 'manifest.json'), 'utf8')));
  ok(h >= 0 && h <= 100, `[D] health fora de 0–100: ${h}`);
  const hRej = healthDe(join(ASSETS3D, 'personagens', 'base_superhero_m'), { qaVisual: { status: 'rejected' } });
  ok(hRej < h, `[D] rejected deveria penalizar (${hRej} vs ${h})`);
  const idx = JSON.parse(readFileSync(join(ASSETS3D, 'personagens', 'index.json'), 'utf8'));
  ok(idx.personagens.every((p) => typeof p.health === 'number' && p.health >= 0 && p.health <= 100), '[D] index.json sem health válido');
  const regen = gerarIndice3d(join(ASSETS3D, 'personagens'));
  ok(JSON.stringify(regen.personagens) === JSON.stringify(idx.personagens), '[D] index.json commitado diverge do regenerado (rodar gerar-indice-3d)');

  // ── E) avaliações puras 1409→1410 + evidências ───────────────────
  ok(baseDaParte('rou3d_ranger_f_botas') === 'base_superhero_f' && baseDaParte('rou3d_peasant_m_corpo') === 'base_superhero_m', '[E] baseDaParte');
  const cSem = avaliarClipping({ pctDentro: 20 }, { mascara: [] });
  const cCom = avaliarClipping({ pctDentro: 20 }, { mascara: ['torso'] });
  const cOk = avaliarClipping({ pctDentro: 1 }, {});
  ok(cSem.veredito === 'flag' && cCom.veredito === 'ok_mascarado' && cOk.veredito === 'ok', `[E] avaliarClipping: ${cSem.veredito}/${cCom.veredito}/${cOk.veredito}`);
  const clipJson = JSON.parse(readFileSync(join(RAIZ, 'docs/AVATAR-STUDIO-5/evidencias/clipping-3d.json'), 'utf8'));
  ok(clipJson.resumo.total === 20 && clipJson.limitePctDentro === LIMITE_PCT_DENTRO && clipJson.resumo.flags.length >= 15, `[E] clipping-3d.json: ${JSON.stringify(clipJson.resumo).slice(0, 120)}`);
  const posesOk = [{ pose: 'A', pixels: 1000, minY: 0.01, altura: 1.8 }, { pose: 'B', pixels: 900, minY: 0, altura: 1.7 }];
  ok(avaliarPoses(posesOk, { clipe: 'Walk', iou_A_D: 0.9, iou_A_G: 0.9 }).ok, '[E] poses saudáveis não podem flaggar');
  const aval = avaliarPoses([{ pose: 'A', pixels: 1000, minY: -0.1, altura: 1.8 }, { pose: 'B', pixels: 100, minY: 0, altura: 0.5 }], { clipe: 'X', iou_A_D: 0.999, iou_A_G: 0.999 });
  ok(aval.flags.length === 4 && aval.flags.some((f) => f.includes('sob o chão')) && aval.flags.some((f) => f.includes('não move')), `[E] avaliarPoses deveria dar 4 flags: ${JSON.stringify(aval.flags)}`);
  const defJson = JSON.parse(readFileSync(join(RAIZ, 'docs/AVATAR-STUDIO-5/evidencias/deformacao-3d.json'), 'utf8'));
  ok(Object.keys(defJson.bases).length === 8 && Object.values(defJson.bases).every((b) => b.ok && b.poses.length === 8), `[E] deformacao-3d.json: ${Object.keys(defJson.bases).length} bases`);
  ok(defJson.bases.base_superhero_m.clipe === 'Idle_Loop' && defJson.bases.base_superhero_m.movimento.iou_A_D < 0.99, '[E] UAL retarget da UBC deveria mover o corpo (§432)');
} finally {
  // limpa fichas de fixtures em storage/ (nunca sujar o QA real)
  for (const id of ['qa_fixture_a', 'qa_fixture_h', 'qa_fixture_v']) rmSync(join(RAIZ, 'storage', 'visual-qa', id), { recursive: true, force: true });
  rmSync(tmp, { recursive: true, force: true });
}

console.log('[qa-pipeline] FALHAS:', falhas.length ? falhas.join(' || ') : 'nenhuma');
process.exit(falhas.length ? 1 : 0);
