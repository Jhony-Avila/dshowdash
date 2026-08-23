// testes/corretivo-a.mjs — onda 1423 (BRIEFING_CORRETIVO_01 Fase A;
// decisões #212–#215): CANDIDATE MODE + UPGRADE PREMIUM + UX 3D SIMPLES.
//
//   A) Node puro — flags: FLAGS_CANDIDATE cobre exatamente o preset §12
//      (2D+3D+UX) sem flags DEV; definirCandidate liga/desliga SÓ o
//      preset (override alheio sobrevive); matrizFlags devolve origem/
//      deps; candidateAtivo. QualidadeVisual.montarCandidatoPremium:
//      legacy → candidato com sucessores SEM mutar o original; premium →
//      null; trocas listadas. Pós v2 termina em OutputPass (#215 — sem
//      ele a saída ficava linear/bronze). Arte de aura XML-VÁLIDA
//      (data-nucleo="1" — export PNG estrito §achado).
//   B) Navegador:
//      1. ux3d_simples OFF: UI 3D byte a byte (turntable/qualidade
//         visíveis; botão Avançado AUSENTE);
//      2. candidate ON: botão Avançado presente, técnicos ocultos até
//         abrir, e reaparecem ao clicar; lentes visíveis (§62);
//      3. upgrade Legacy→Premium no shell: banner aparece p/ config
//         legado, "Ver comparação" mostra 2 renders, "Atualizar" aplica
//         acabamento premium; "Manter" dispensa e o banner some.
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
  const tmp = mkdtempSync(join(tmpdir(), 'avst-1423-'));
  try {
    writeFileSync(join(tmp, 'prova.ts'), `
const memoria: Record<string, string> = {};
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => memoria[k] ?? null,
  setItem: (k: string, v: string) => { memoria[k] = v; },
  removeItem: (k: string) => { delete memoria[k]; },
};
(globalThis as Record<string, unknown>).window = { location: { search: '' } };
import { FLAGS_CANDIDATE, candidateAtivo, definirCandidate, matrizFlags, flag } from '@painel/nucleo/flags';
import { montarCandidatoPremium } from '@painel/services/QualidadeVisual';
import { validarConfig, svgDe } from '@painel/services/AvatarCatalog';
const p: string[] = [];
// preset §12 exato (2D + 3D + UX; zero flags DEV). Golden A+ #57: 'as6.arte_v2'
// incluído — o modo candidate é o PREVIEW premium do revisor, e arte_v2 foi
// adicionado a FLAGS_CANDIDATE no #219-R1 (commit cf2ecdaa) sem atualizar este
// ESPERADAS; o código estava certo, o snapshot é que ficou defasado.
const ESPERADAS = ['as6.classico_premium', 'as6.arte_v2', 'as6.face_v2', 'as6.barba_slot', 'as6.brow_slot', 'as6.roupa_premium', 'as6.acess_2d_premium', 'as6.cp_foto', 'as6.looks', 'as6.material_v2', 'as6.camera_v2', 'as6.sombras_v2', 'as6.pos_v2', 'as6.foto_lentes', 'as6.ux3d_simples', 'as6.thumb_item_v2'];
if (JSON.stringify([...FLAGS_CANDIDATE].sort()) !== JSON.stringify([...ESPERADAS].sort())) p.push('preset candidate divergiu do §12: ' + FLAGS_CANDIDATE.join(','));
for (const dev of ['as6.qa_route', 'as6.material_debug', 'as6.dev_iluminacao', 'as5.hud3d', 'as6.qa_visual']) {
  if (FLAGS_CANDIDATE.includes(dev)) p.push('flag DEV no candidate (§12 proibe): ' + dev);
}
// liga/desliga preservando override alheio
memoria['dshow.avst.flags.v1'] = JSON.stringify({ 'as5.hud3d': true });
if (candidateAtivo()) p.push('candidate nao deveria estar ativo');
definirCandidate(true);
if (!candidateAtivo()) p.push('definirCandidate(true) nao ligou');
if (!flag('as6.classico_premium') || !flag('as6.ux3d_simples')) p.push('flags do preset nao efetivas');
let local = JSON.parse(memoria['dshow.avst.flags.v1']);
if (local['as5.hud3d'] !== true) p.push('override alheio foi destruido');
definirCandidate(false);
local = JSON.parse(memoria['dshow.avst.flags.v1']);
if (candidateAtivo() || Object.keys(local).some((k) => ESPERADAS.includes(k))) p.push('definirCandidate(false) nao limpou o preset');
if (local['as5.hud3d'] !== true) p.push('override alheio sumiu no desligar');
// matriz
definirCandidate(true);
const matriz = matrizFlags();
const linha = matriz.find((f) => f.nome === 'as6.classico_premium');
if (!linha || linha.origem !== 'local' || linha.efetiva !== true || !linha.candidate) p.push('matriz errada p/ classico_premium: ' + JSON.stringify(linha));
const semDep = matriz.find((f) => f.nome === 'as6.camera_v2');
if (!semDep || !semDep.dependencias.includes('as5.palco3d')) p.push('matriz sem dependencias');
// upgrade premium
const legado = validarConfig({ formato: 'camadas', versao: 3, base: 'bas_classica', camadas: { olhos: 'olh_padrao', boca: 'boc_sorriso', cabelo: 'cab_curto' }, cores: { pele: '#e8b58c', cabelo: '#4a3527', roupa: '#2b5f8f', destaque: '#c9a227' } });
const cand = montarCandidatoPremium(legado);
if (!cand) { p.push('candidato premium nao montou'); } else {
  if (cand.candidato.acabamento !== 'premium') p.push('candidato sem acabamento premium');
  if (legado.acabamento !== undefined) p.push('montarCandidatoPremium MUTOU o original');
  if (!cand.trocas.some((t) => t.de === 'bas_classica' && t.para === 'bas_px_oval')) p.push('sucessor da base nao aplicado (gate ligado no teste)');
  if (!cand.trocas.some((t) => t.de === 'cab_curto' && t.para === 'cab_px_curto')) p.push('sucessor do cabelo nao aplicado');
}
if (montarCandidatoPremium(cand!.candidato) !== null) p.push('avatar ja premium deveria dar null');
// arte de aura XML-valida (#215): parser estrito nao pode quebrar
const comAura = validarConfig({ ...legado, camadas: { ...legado.camadas, aura: 'aur_px_fluxo', fundo: 'fun_px_estudio' }, acabamento: 'premium' });
const svg = svgDe(comAura, { premium: true, faceV2: true, estatico: true, palco: true, enquadramento: 'corpo' });
if (/<[a-zA-Z-]+ [^>]*\\sdata-nucleo(\\s|>)/.test(svg)) p.push('atributo XML sem valor na arte (data-nucleo cru)');
console.log(JSON.stringify(p));
`);
    const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')].find((c) => existsSync(c)) ?? 'esbuild';
    execSync(`"${esbuild}" "${join(tmp, 'prova.ts')}" --bundle --format=esm --platform=node --alias:@painel="${PAINEL}/src" --outfile="${join(tmp, 'prova.mjs')}"`, { stdio: ['ignore', 'ignore', 'inherit'] });
    const saida = execSync(`node "${join(tmp, 'prova.mjs')}"`, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }).trim().split('\n').pop();
    for (const m of JSON.parse(saida)) falhas.push(`[A] ${m}`);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}

// ── B) Navegador ────────────────────────────────────────────────────
async function abrirEstudio(flags, atePalco, salvarLegado = false) {
  const { navegador, pagina, erros } = await abrir({
    viewport: { width: 1500, height: 940 }, webgl: atePalco,
    init: ({ f, salvarLegado }) => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f));
      try { localStorage.setItem('dshow.avst6.qualidade.v1', 'alto'); } catch { /* ok */ }
      if (salvarLegado) {
        // avatar LEGADO salvo (sem acabamento): o banner de upgrade e p/ ele
        localStorage.setItem('avst.harness.config', JSON.stringify({
          formato: 'camadas', versao: 3, base: 'bas_classica',
          camadas: { olhos: 'olh_padrao', boca: 'boc_sorriso', cabelo: 'cab_curto', roupa: 'rou_social' },
          cores: { pele: '#e8b58c', cabelo: '#4a3527', roupa: '#2b5f8f', destaque: '#c9a227' },
        }));
      }
    },
    initArg: { f: { 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': true, 'as5.quality3d_v2': false, 'as5.hud3d': true, ...flags }, salvarLegado },
  });
  await pagina.emulateMedia({ reducedMotion: 'reduce' });
  await irParaHarness(pagina, 'avst-harness.html', 1200);
  if (atePalco) {
    await pagina.locator('[data-teste="botao-3d"]').click();
    await pagina.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 45000 });
    await pagina.waitForTimeout(5000);
  }
  return { pagina, erros, fechar: () => navegador.close() };
}

// B1: ux3d_simples OFF — UI byte a byte (sem botão Avançado)
{
  const { pagina, fechar } = await abrirEstudio({}, true);
  ok((await pagina.locator('[data-teste="p3d-avancado"]').count()) === 0, '[B1] botao Avancado vazou SEM a flag');
  ok((await pagina.locator('[data-teste="p3d-turntable"]').count()) === 1, '[B1] turntable sumiu SEM a flag');
  ok((await pagina.locator('[data-teste="p3d-qualidade"]').count()) === 1, '[B1] qualidade sumiu SEM a flag');
  await fechar();
}

// B2: candidate (ux simples) — técnicos atrás do Avançado
{
  const { pagina, erros: errosJs, fechar } = await abrirEstudio({
    'as6.ux3d_simples': true, 'as6.looks': true, 'as6.camera_v2': true,
    'as6.sombras_v2': true, 'as6.pos_v2': true, 'as6.foto_lentes': true, 'as6.material_v2': true,
  }, true);
  ok((await pagina.locator('[data-teste="p3d-avancado"]').count()) === 1, '[B2] botao Avancado ausente');
  ok((await pagina.locator('[data-teste="p3d-turntable"]').count()) === 0, '[B2] turntable deveria estar oculto no modo simples');
  ok((await pagina.locator('[data-teste="p3d-qualidade"]').count()) === 0, '[B2] qualidade deveria estar oculta no modo simples');
  ok((await pagina.locator('[data-teste="p3d-cenas"]').count()) === 0, '[B2] cenas deveriam estar ocultas no modo simples');
  ok((await pagina.locator('[data-teste="p3d-lentes"]').count()) === 1, '[B2] lentes (essencial §62) deveriam ficar visiveis');
  ok((await pagina.locator('[data-teste="p3d-capturar"]').count()) === 1, '[B2] capturar (essencial) sumiu');
  await pagina.locator('[data-teste="p3d-avancado"]').click();
  await pagina.waitForTimeout(300);
  ok((await pagina.locator('[data-teste="p3d-turntable"]').count()) === 1, '[B2] Avancado aberto deveria devolver o turntable');
  ok((await pagina.locator('[data-teste="p3d-qualidade"]').count()) === 1, '[B2] Avancado aberto deveria devolver a qualidade');
  ok(!errosJs.length, `[B2] erros JS: ${errosJs.slice(0, 2).join(' | ')}`);
  await fechar();
}

// B3: upgrade Legacy→Premium no shell (as6.classico_premium ON)
{
  const { pagina, erros: errosJs, fechar } = await abrirEstudio({ 'as6.classico_premium': true, 'as6.face_v2': true }, false, true);
  await pagina.waitForTimeout(1500);
  ok((await pagina.locator('[data-teste="upgrade-premium"]').count()) === 1, '[B3] banner de upgrade ausente p/ avatar legado');
  await pagina.locator('[data-teste="upgrade-comparar"]').click();
  await pagina.waitForTimeout(400);
  const svgs = await pagina.locator('[data-teste="upgrade-preview"] svg').count();
  ok(svgs >= 2, `[B3] preview deveria mostrar 2 renders (veio ${svgs})`);
  await pagina.locator('[data-teste="upgrade-aplicar"]').click();
  await pagina.waitForTimeout(600);
  const premium = await pagina.locator('[data-teste="toggle-acabamento"]').getAttribute('class');
  ok(premium !== null && premium.includes('avst-fchip-on'), '[B3] Atualizar deveria aplicar acabamento premium');
  ok((await pagina.locator('[data-teste="upgrade-premium"]').count()) === 0, '[B3] banner deveria sumir depois de atualizar');
  ok(!errosJs.length, `[B3] erros JS: ${errosJs.slice(0, 2).join(' | ')}`);
  await fechar();
}

// B4: "Manter" dispensa e persiste
{
  const { pagina, fechar } = await abrirEstudio({ 'as6.classico_premium': true }, false, true);
  await pagina.waitForTimeout(1500);
  if ((await pagina.locator('[data-teste="upgrade-premium"]').count()) === 1) {
    await pagina.locator('[data-teste="upgrade-manter"]').click();
    await pagina.waitForTimeout(300);
    ok((await pagina.locator('[data-teste="upgrade-premium"]').count()) === 0, '[B4] Manter nao dispensou o banner');
    const guardado = await pagina.evaluate(() => localStorage.getItem('dshow.avst.upgrade-premium.v1'));
    ok(guardado === 'dispensado', '[B4] dispensa nao persistiu');
  } else {
    falhas.push('[B4] banner nao apareceu p/ dispensar');
  }
  await fechar();
}

console.log('[corretivo-a] FALHAS:', falhas.length ? falhas.join(' || ') : 'nenhuma');
process.exit(falhas.length ? 1 : 0);
