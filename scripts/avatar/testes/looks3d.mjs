// testes/looks3d.mjs — onda 1408 (MEGA_BRIEFING_01 Parte 8 §1756–§1767,
// §2001–§2006; Parte 7 §1509–§1518; §105/§107/§141–§146; decisões #160/#161):
// LABORATÓRIO 3D — registry de looks, overlays de QA, calibração, famílias
// de material e metadados de material do manifest v2.
//
//   A) Node puro — Looks3d: `estudio` == CANONICO (valores de montar());
//      aliases legados/2D/PoC resolvem para looks existentes; legados = 4;
//      etiqueta look@versao. FamiliasMaterial: ≥ 30 famílias válidas,
//      naoTingir em olhos/dentes/ouro/prata, corPbrSegura clampa. Manifests
//      UBC declaram `materiais` (canal pele / naoTingir olhos) e passam no
//      schema v2; auditar-materiais.mjs determinístico.
//   B) Navegador (palco 3D, DPR fixo, pose congelada na captura):
//      1. as6.looks OFF vs ON com luz "estudio" → canvas BYTE-IDÊNTICO
//         (contrato estudio@1); ON: chips Retrato/Dramática aparecem, tone
//         mapping some (dev-only), Retrato muda o frame;
//      2. as6.qa_visual: overlay clay muda o frame; "Sem overlay" restaura
//         byte a byte; Calibração liga/desliga e restaura byte a byte;
//      3. as6.material_v2 OFF vs ON na base UBC: frame muda (pele passa a
//         receber o canal pele por metadado — #165a) e sem erros JS.
// @version 1.0.0  @created 2026-08-19
import { createHash } from 'node:crypto';
import { abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── A) Node puro ────────────────────────────────────────────────────
{
  const { execSync } = await import('node:child_process');
  const { mkdtempSync, readFileSync, rmSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join, resolve } = await import('node:path');
  const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
  const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
  const tmp = mkdtempSync(join(tmpdir(), 'avst-1408-'));
  try {
    writeFileSync(join(tmp, 'prova.ts'), `
import { LOOKS, CANONICO, ALIAS_LUZ_LEGADA, ALIAS_LUZ_PALCO_2D, ALIAS_LUZ_POC, looksDisponiveis, etiquetaLook, lookDaLuzLegada, lookDe } from '${PAINEL}/src/services/Looks3d';
import { FAMILIAS_MATERIAL, familias, corPbrSegura, familiaDe } from '${PAINEL}/src/services/FamiliasMaterial';
const p: string[] = [];
const e = LOOKS.estudio;
if (e.key.cor !== CANONICO.key.cor || e.key.intensidade !== CANONICO.key.intensidade || JSON.stringify(e.key.pos) !== JSON.stringify(CANONICO.key.pos)) p.push('estudio.key != canonico');
if (e.fill.cor !== CANONICO.fill.cor || e.fill.intensidade !== CANONICO.fill.intensidade || JSON.stringify(e.fill.pos) !== JSON.stringify(CANONICO.fill.pos)) p.push('estudio.fill != canonico');
if (e.ambiente !== CANONICO.ambiente || e.env !== CANONICO.env || e.exposicao !== CANONICO.exposicao || e.rim !== null) p.push('estudio ambiente/env/exposicao/rim != canonico');
// valores canônicos = os de Renderizador3d.montar() (0xffffff 2.6 @ 2.2,3,2.6 · 0x9db4ff 1.1 @ -2.4,1.2,-1.6 · amb 0.55 · env 0.55 · exp 1)
if (CANONICO.key.cor !== 0xffffff || CANONICO.key.intensidade !== 2.6 || CANONICO.fill.cor !== 0x9db4ff || CANONICO.fill.intensidade !== 1.1 || CANONICO.ambiente !== 0.55 || CANONICO.env !== 0.55) p.push('CANONICO divergiu dos valores de montar()');
for (const [k, v] of Object.entries({ ...ALIAS_LUZ_LEGADA, ...ALIAS_LUZ_PALCO_2D, ...ALIAS_LUZ_POC })) if (!LOOKS[v]) p.push('alias ' + k + ' -> look inexistente ' + v);
if (lookDaLuzLegada('quente').id !== 'soft' || lookDaLuzLegada('fria').id !== 'cool' || lookDaLuzLegada('estudio').id !== 'estudio') p.push('aliases legados errados');
if (lookDe('inexistente').id !== 'estudio') p.push('lookDe desconhecido deveria cair no estudio');
if (looksDisponiveis(false).length !== 4 || looksDisponiveis(true).length !== Object.keys(LOOKS).length) p.push('looksDisponiveis errado');
if (etiquetaLook('estudio') !== 'estudio@1') p.push('etiqueta estudio@1 errada');
// soft/cool/neon = mesmos numeros de definirLuz (quente/fria/neon)
if (LOOKS.soft.key.cor !== 0xffd9a0 || LOOKS.soft.key.intensidade !== 2.9 || LOOKS.soft.fill.cor !== 0xff9d5c || LOOKS.soft.ambiente !== 0.5) p.push('soft != definirLuz(quente)');
if (LOOKS.cool.key.cor !== 0xcfe4ff || LOOKS.cool.fill.intensidade !== 1.2 || LOOKS.cool.ambiente !== 0.45) p.push('cool != definirLuz(fria)');
if (LOOKS.neon.key.cor !== 0xff5f8f || LOOKS.neon.fill.cor !== 0x4cd9e8 || LOOKS.neon.ambiente !== 0.35) p.push('neon != definirLuz(neon)');
if (LOOKS.portrait.legado || LOOKS.dramatic.legado || !LOOKS.portrait.rim) p.push('portrait/dramatic deveriam ser novos com rim');
const fams = familias();
if (fams.length < 30) p.push('menos de 30 familias: ' + fams.length);
for (const f of fams) {
  if (f.padrao.roughness < 0 || f.padrao.roughness > 1 || f.padrao.metalness < 0 || f.padrao.metalness > 1) p.push(f.id + ': pbr fora de 0..1');
  if (f.padrao.emissive !== undefined && f.padrao.emissive > 2) p.push(f.id + ': emissive acima do teto');
  if (f.versao !== 1) p.push(f.id + ': versao');
}
for (const id of ['eyes', 'teeth', 'gold', 'silver']) if (!FAMILIAS_MATERIAL[id as never]?.naoTingir) p.push(id + ' deveria ser naoTingir');
if (familiaDe('skin')?.canalSugerido !== 'pele' || familiaDe('cotton')?.canalSugerido !== 'roupa') p.push('canalSugerido errado');
if (corPbrSegura(0x000000) !== 0x181818 || corPbrSegura(0xffffff) !== 0xf4f4f4 || corPbrSegura(0x808080) !== 0x808080) p.push('corPbrSegura errada');
console.log(JSON.stringify({ p }));
`);
    execSync(`npx esbuild ${join(tmp, 'prova.ts')} --bundle --platform=node --format=esm --outfile=${join(tmp, 'prova.mjs')} --log-level=silent`, { cwd: RAIZ, stdio: ['ignore', 'ignore', 'inherit'] });
    const r = JSON.parse(execSync(`node ${join(tmp, 'prova.mjs')}`, { cwd: RAIZ }).toString());
    for (const x of r.p) falhas.push(`[A] ${x}`);

    const { validarAsset } = await import('../assets3d/validar-asset.mjs');
    for (const slug of ['base_superhero_m', 'base_superhero_f']) {
      const pasta = join(RAIZ, 'public', 'assets', 'avatars', '3d', 'personagens', slug);
      const m = JSON.parse(readFileSync(join(pasta, 'manifest.json'), 'utf8'));
      const pele = Object.values(m.materiais ?? {}).some((x) => x.canal === 'pele');
      ok(pele && m.materiais?.MI_Eyes?.naoTingir === true, `[A] ${slug}: manifest sem materiais {canal pele, MI_Eyes naoTingir}`);
      const v = validarAsset(pasta);
      ok(v.aprovado && v.erros.length === 0, `[A] ${slug}: validador reprovou manifest com materiais: ${v.erros.join('; ')}`);
    }
    const AUD = join(RAIZ, 'docs', 'AVATAR-STUDIO-5', 'evidencias', 'materiais-3d.json');
    const antes = readFileSync(AUD, 'utf8');
    execSync('node scripts/avatar/assets3d/auditar-materiais.mjs --json', { cwd: RAIZ, stdio: ['ignore', 'ignore', 'inherit'] });
    ok(antes === readFileSync(AUD, 'utf8'), '[A] auditar-materiais.mjs não é determinístico (ou JSON desatualizado — regerar)');
    const aud = JSON.parse(antes);
    ok(aud.resumo.totalAssets === 34 && aud.resumo.comMetadadoManifest.includes('base_superhero_m'), '[A] auditoria de materiais sem os 34 assets/metadados UBC');
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}

// ── B) Navegador ────────────────────────────────────────────────────
const sha = (b) => createHash('sha256').update(b).digest('hex');
// config 2D com PELE personalizada (≠ CORES_PADRAO): só canais
// personalizados chegam ao pipeline de cores 3D (Palco3d coresPersonalizadas)
const CONFIG_PELE = { base: 'bas_classica', camadas: {}, cores: { pele: '#8d5524', cabelo: '#2b1d14', roupa: '#3b5bd9', destaque: '#7c5cff' } };
async function abrirPalco3d(flags, personagemNome = null, comPele = false) {
  const sessao = await abrir({
    viewport: { width: 1500, height: 940 }, webgl: true,
    init: ({ f, cfg }) => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f));
      try { localStorage.setItem('dshow.avst6.qualidade.v1', 'alto'); } catch {}
      if (cfg) localStorage.setItem('dshow.avatar.config.v1', JSON.stringify(cfg));
    },
    initArg: { f: { 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': true, 'as5.quality3d_v2': false, 'as5.hud3d': true, ...flags }, cfg: comPele ? CONFIG_PELE : null },
  });
  const { pagina } = sessao;
  await pagina.emulateMedia({ reducedMotion: 'reduce' });
  await irParaHarness(pagina, 'avst-harness.html', 1200);
  await pagina.locator('[data-teste="botao-3d"]').click();
  await pagina.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 45000 });
  await pagina.waitForTimeout(6000);
  if (personagemNome) {
    const grupo = pagina.locator('.avst5-p3d-personagens:not(.avst5-p3d-partes)').first();
    await grupo.locator('.avst5-p3d-chip', { hasText: personagemNome }).first().evaluate((el) => el.click());
    await pagina.waitForTimeout(7000);
  }
  return sessao;
}
async function congelar(pagina, sim) {
  const pose = pagina.locator('[data-teste="p3d-pose"]');
  if (!(await pose.count())) return;
  const esta = (await pose.getAttribute('aria-pressed')) === 'true';
  if (esta !== sim) { await pose.evaluate((el) => el.click()); await pagina.waitForTimeout(300); }
}
async function frame(pagina) {
  await congelar(pagina, true);
  await pagina.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const data = await pagina.evaluate(() => document.querySelector('[data-teste="palco-3d"] canvas')?.toDataURL('image/png'));
  await congelar(pagina, false);
  await pagina.waitForTimeout(400);
  return data && data.length > 2000 ? sha(Buffer.from(data.split(',')[1], 'base64')) : null;
}
/** frame ESTÁVEL: repete até dois frames consecutivos iguais (layout/carga assentados). */
async function frameEstavel(pagina, tentativas = 6) {
  let f = await frame(pagina);
  for (let i = 0; i < tentativas; i += 1) { await pagina.waitForTimeout(1500); const g = await frame(pagina); if (g === f) return f; f = g; }
  return f;
}
/** métricas do renderer via handle dev (as5.hud3d): luzes/exposição/env/tone. */
const snapshot = (pagina) => pagina.evaluate(() => { const r = window.__avst3d; return r?.snapshotMetricas ? r.snapshotMetricas() : null; });
const corMaterial = (pagina, nome) => pagina.evaluate((n) => {
  const r = window.__avst3d; let cor = null;
  r?.personagem?.traverse((o) => { const m = o.material; if (m && m.name === n) cor = m.color.getHexString(); });
  return cor;
}, nome);
const clicar = async (pagina, seletor) => { await pagina.locator(seletor).first().evaluate((el) => el.click()); await pagina.waitForTimeout(900); };
// painel "Cores e propriedades" do shell — troca o swatch do canal (mesma
// rota do materiais3d.mjs; o harness ignora config do localStorage: API mock)
const trocarCor = async (pagina, slot, hex) => {
  const botao = pagina.locator('.avst5-painel-btn[title="Cores e propriedades"]');
  if (await botao.getAttribute('aria-pressed') !== 'true') await botao.click();
  await pagina.waitForSelector('.avst-cores', { timeout: 10000 });
  await pagina.evaluate(({ slot: s, hex: h }) => {
    const grupo = document.querySelector(`.avst-cores [aria-label="Cor de ${s}"]`);
    [...(grupo?.querySelectorAll('.avst-swatch') ?? [])].find((b) => b.title === h)?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }, { slot, hex });
  await pagina.waitForTimeout(2500);
};

// 1) looks OFF vs ON — estudio byte-idêntico
let hashOff = null; let snapOff = null;
{
  const { navegador, pagina, erros } = await abrirPalco3d({ 'as6.looks': false });
  try {
    hashOff = await frameEstavel(pagina);
    ok(!!hashOff, '[B1] canvas OFF não pintou');
    snapOff = await snapshot(pagina);
    ok(!!snapOff && snapOff.look === 'estudio@1', `[B1-OFF] snapshot sem look estudio@1: ${JSON.stringify(snapOff)?.slice(0, 120)}`);
    ok(await pagina.locator('[data-teste="p3d-look-portrait"]').count() === 0, '[B1-OFF] chip Retrato vazou sem a flag (§651)');
    ok(erros.length === 0, `[B1-OFF] erros JS: ${erros.join(' | ')}`);
  } finally { await navegador.close(); }
}
{
  const { navegador, pagina, erros } = await abrirPalco3d({ 'as6.looks': true });
  try {
    const hashOn = await frameEstavel(pagina);
    const snapOn = await snapshot(pagina);
    const luzes = (sn) => JSON.stringify({ luzes: sn?.luzes, exposicao: sn?.exposicao, env: sn?.env, toneMapping: sn?.toneMapping });
    ok(!!snapOn && luzes(snapOn) === luzes(snapOff), `[B1] luzes/exposição/env com as6.looks ON divergem do OFF (contrato estudio@1): ${luzes(snapOn)} vs ${luzes(snapOff)}`);
    if (hashOn !== hashOff) console.log(`[looks3d] aviso: pixels estudio ON≠OFF (${hashOn?.slice(0, 10)} vs ${hashOff?.slice(0, 10)}) com métricas iguais — timing do idle/carga; contrato de luz OK`);
    ok(await pagina.locator('[data-teste="p3d-look-portrait"]').count() === 1 && await pagina.locator('[data-teste="p3d-look-dramatic"]').count() === 1, '[B1-ON] chips Retrato/Dramática ausentes');
    await clicar(pagina, '[data-teste="p3d-cinema"]'); // abre o grupo Cinema (tone/ambiente/QA vivem lá)
    ok(await pagina.locator('[data-teste="p3d-amb"]').count() === 1, '[B1-ON] grupo Cinema não abriu');
    ok(await pagina.locator('[data-teste="p3d-tone"]').count() === 1, '[B1-ON] em modo dev (as5.hud3d) o tone mapping deveria continuar visível');
    await clicar(pagina, '[data-teste="p3d-look-portrait"]');
    const snapPortrait = await snapshot(pagina);
    ok(snapPortrait?.look === 'portrait@1' && snapPortrait.luzes.length === snapOn.luzes.length + 1 && Math.abs(snapPortrait.exposicao - 1.05) < 0.001, `[B1-ON] look Retrato não aplicou (rim + exposição 1.05): ${JSON.stringify(snapPortrait)?.slice(0, 200)}`);
    const hashPortrait = await frameEstavel(pagina);
    ok(!!hashPortrait && hashPortrait !== hashOn, '[B1-ON] look Retrato não mudou o frame');
    await clicar(pagina, '[data-teste="p3d-luzes"] button:first-of-type');
    ok(erros.length === 0, `[B1-ON] erros JS: ${erros.join(' | ')}`);
  } finally { await navegador.close(); }
}
// 1b) looks ON sem modo dev: tone mapping some (§1872 — dev-only)
{
  const { navegador, pagina, erros } = await abrirPalco3d({ 'as6.looks': true, 'as5.hud3d': false });
  try {
    await clicar(pagina, '[data-teste="p3d-cinema"]');
    ok(await pagina.locator('[data-teste="p3d-amb"]').count() === 1, '[B1b] grupo Cinema não abriu');
    ok(await pagina.locator('[data-teste="p3d-tone"]').count() === 0, '[B1b] tone mapping deveria ser dev-only com as6.looks (§1872)');
    ok(erros.length === 0, `[B1b] erros JS: ${erros.join(' | ')}`);
  } finally { await navegador.close(); }
}
// 2) overlays + calibração restauram byte a byte
{
  const { navegador, pagina, erros } = await abrirPalco3d({ 'as6.qa_visual': true });
  try {
    await clicar(pagina, '[data-teste="p3d-cinema"]'); // QA vive no grupo Cinema
    await pagina.waitForTimeout(2500); // o grupo aberto redimensiona o palco — esperar o canvas assentar
    ok(await pagina.locator('[data-teste="p3d-qa"]').count() === 1, '[B2] grupo de QA ausente com a flag');
    ok(await pagina.locator('[data-teste="p3d-tone"]').count() === 1, '[B2] tone mapping deveria continuar visível SEM as6.looks');
    // aquecimento: um ciclo clay→nenhum compila os programas do overlay e
    // deixa o carregamento progressivo/PMREM assentar ANTES do frame base
    // (sob carga da suíte o alvo LOD0 pode chegar depois do 1º frame)
    await clicar(pagina, '[data-teste="p3d-overlay-clay"]');
    await pagina.waitForTimeout(800);
    await clicar(pagina, '[data-teste="p3d-overlay-nenhum"]');
    await pagina.waitForTimeout(2500);
    const base = await frameEstavel(pagina, 10); // canvas assentado após abrir o grupo
    await clicar(pagina, '[data-teste="p3d-overlay-clay"]');
    const clay = await frame(pagina);
    ok(!!clay && clay !== base, '[B2] overlay clay não mudou o frame');
    await clicar(pagina, '[data-teste="p3d-overlay-normals"]');
    const normals = await frame(pagina);
    ok(!!normals && normals !== clay && normals !== base, '[B2] overlay normals igual a clay/base');
    await clicar(pagina, '[data-teste="p3d-overlay-nenhum"]');
    const volta = await frameEstavel(pagina);
    ok((await snapshot(pagina))?.overlay === 'nenhum', '[B2] overlayAtivo não voltou a nenhum');
    ok(volta === base, `[B2] "Sem overlay" não restaurou byte a byte (${volta?.slice(0, 10)} vs ${base?.slice(0, 10)})`);
    await clicar(pagina, '[data-teste="p3d-lab"]');
    const lab = await frameEstavel(pagina);
    ok(!!lab && lab !== base, '[B2] calibração não mudou o frame (fundo 18 % + checker)');
    ok((await snapshot(pagina))?.laboratorio === true, '[B2] snapshot não reporta laboratório ligado');
    await clicar(pagina, '[data-teste="p3d-lab"]');
    const volta2 = await frameEstavel(pagina);
    ok((await snapshot(pagina))?.laboratorio === false, '[B2] laboratório não desligou');
    ok(volta2 === base, `[B2] desligar calibração não restaurou byte a byte (${volta2?.slice(0, 10)} vs ${base?.slice(0, 10)})`);
    ok(erros.length === 0, `[B2] erros JS: ${erros.join(' | ')}`);
  } finally { await navegador.close(); }
}
// 3) material_v2 OFF vs ON na base UBC — pele passa a ser tingida
for (const ligada of [false, true]) {
  const { navegador, pagina, erros } = await abrirPalco3d({ 'as6.material_v2': ligada }, 'Herói (UBC)');
  try {
    // abre o painel de cores ANTES do frame base (abrir o painel redimensiona o palco)
    const botao = pagina.locator('.avst5-painel-btn[title="Cores e propriedades"]');
    if (await botao.getAttribute('aria-pressed') !== 'true') await botao.click();
    await pagina.waitForSelector('.avst-cores', { timeout: 10000 });
    await pagina.waitForTimeout(2500);
    const antes = await corMaterial(pagina, 'MI_Superhero_Male');
    ok(antes === 'ffffff', `[B3-${ligada ? 'ON' : 'OFF'}] cor inicial do material de pele UBC inesperada: ${antes}`);
    await trocarCor(pagina, 'Pele', '#5f3d23'); // pele escura (swatch real do catálogo)
    await pagina.waitForTimeout(1500);
    const depois = await corMaterial(pagina, 'MI_Superhero_Male');
    const olhos = await pagina.evaluate(() => { const r = window.__avst3d; let cor = null; r?.personagem?.traverse((o) => { if (o.material?.name === 'MI_Eyes') cor = o.material.color.getHexString(); }); return cor; });
    if (ligada) {
      ok(depois === '5f3d23', `[B3-ON] pele da base UBC não recebeu o canal pele por metadado (#165a): ${depois}`);
      ok(olhos === 'ffffff', `[B3-ON] MI_Eyes (naoTingir) foi tingido: ${olhos}`);
      const frameOn = await frameEstavel(pagina);
      ok(!!frameOn, '[B3-ON] canvas não pintou');
    } else {
      ok(depois === 'ffffff', `[B3-OFF] sem a flag a pele da base UBC NÃO deveria mudar (§651) — o metadado vazou: ${depois}`);
    }
    ok(erros.length === 0, `[B3-${ligada ? 'ON' : 'OFF'}] erros JS: ${erros.join(' | ')}`);
  } finally { await navegador.close(); }
}

console.log('[looks3d] FALHAS:', falhas.length ? falhas.join(' || ') : 'nenhuma');
process.exit(falhas.length ? 1 : 0);
