// testes/qualidade-visual.mjs — onda 1406 (MEGA_BRIEFING_01 §68–§69, §161,
// §1419–§1421, §2576–§2590, decisão #157): QUALIDADE VISUAL COMO DADO.
//
//   A) Node puro — registry QualidadeVisual cobre 100% do catálogo 2D e
//      dos placeholders da PoC (soc_* = prototype, não destacável);
//      metadadosDe expõe qualidadeVisual/statusQaVisual/versaoVisual e NÃO
//      adiciona a tag sem a flag; SOCKET_3D_POR_SLOT cobre os 15 slots e
//      só aponta para sockets do vocabulário fechado; schema v2: os 34
//      manifests publicados passam (schemaVersion 2), fixtures com campo
//      desconhecido → aviso, enum errado → erro, premium sem qaVisual →
//      erro; ids únicos entre personagens/ e partes/; index.json propaga
//      qualidadeVisual; relatório KPI é determinístico.
//   B) Navegador — flag as6.avatar_visual_v2 ON: drawer do shell mostra
//      "Qualidade: …" (det-qualidade) e a PoC Estúdio 3D ESCONDE os 9
//      placeholders (só o chip "—" por socket); flag OFF (padrão): sem
//      det-qualidade e os 9 placeholders aparecem (byte a byte §651).
// @version 1.0.0  @created 2026-08-19
import { SAIDA, abrir, irParaHarness, abrirAba3d } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── A) Node puro ────────────────────────────────────────────────────
{
  const { execSync } = await import('node:child_process');
  const { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join, resolve } = await import('node:path');
  const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
  const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
  const tmp = mkdtempSync(join(tmpdir(), 'avst-1406-'));
  try {
    writeFileSync(join(tmp, 'prova.ts'), `
import { PARTES } from '${PAINEL}/src/services/AvatarCatalog';
import { ITENS_SOCKET, SOCKETS_3D } from '${PAINEL}/src/poc3d/catalogo3d';
import { NIVEIS_QUALIDADE_VISUAL, STATUS_QA_VISUAL, qualidadeVisualDe, statusQaVisualDe, ehDestacavel, atingeNivel, coberturaQualidade, fichaQualidadeDe } from '${PAINEL}/src/services/QualidadeVisual';
import { metadadosDe } from '${PAINEL}/src/services/MetadadosAssets';
import { SOCKET_3D_POR_SLOT, slotPorSocket3d } from '${PAINEL}/src/workspace/acessorios';
import { SLOTS_EQUIPAMENTO } from '${PAINEL}/src/nucleo/contratos';
const problemas: string[] = [];
for (const p of PARTES) {
  const f = fichaQualidadeDe(p.id);
  if (!NIVEIS_QUALIDADE_VISUAL.includes(f.qualidadeVisual)) problemas.push(p.id + ': nivel invalido');
  if (!STATUS_QA_VISUAL.includes(f.statusQaVisual)) problemas.push(p.id + ': status invalido');
  if (f.qualidadeVisual === 'prototype') problemas.push(p.id + ': arte 2D publicada nao pode ser prototype');
  const md = metadadosDe(p as any);
  if (md.qualidadeVisual !== f.qualidadeVisual || !md.versaoVisual) problemas.push(p.id + ': metadadosDe sem ficha de qualidade');
  if (md.tags.includes(f.qualidadeVisual)) problemas.push(p.id + ': tag de qualidade presente SEM a flag');
}
for (const i of ITENS_SOCKET) {
  if (qualidadeVisualDe(i.id) !== 'prototype') problemas.push(i.id + ': placeholder da PoC deveria ser prototype');
  if (ehDestacavel(i.id)) problemas.push(i.id + ': prototype nao pode ser destacavel');
  if (atingeNivel(i.id, 'production')) problemas.push(i.id + ': prototype atinge production?');
}
if (!atingeNivel('bas_classica', 'production') || !ehDestacavel('bas_classica')) problemas.push('bas_classica deveria ser production/destacavel');
if (qualidadeVisualDe('cab_px_teste') !== 'premium') problemas.push('prefixo _px_ deveria nascer premium');
const cob = coberturaQualidade(PARTES as any);
if (cob.total !== PARTES.length || cob.production + cob.legacy + cob.premium + cob.hero + cob.prototype !== cob.total) problemas.push('coberturaQualidade nao soma o catalogo');
const slots = Object.keys(SOCKET_3D_POR_SLOT);
if (slots.length !== 15) problemas.push('SOCKET_3D_POR_SLOT deveria cobrir 15 slots, tem ' + slots.length);
for (const [slot, socket] of Object.entries(SOCKET_3D_POR_SLOT)) {
  if (!(SOCKETS_3D as readonly string[]).includes(socket)) problemas.push(slot + ' -> socket fora do vocabulario: ' + socket);
  if (!(SLOTS_EQUIPAMENTO as readonly string[]).includes(socket)) problemas.push(slot + ' -> socket fora de SLOTS_EQUIPAMENTO: ' + socket);
  if (!(SLOTS_EQUIPAMENTO as readonly string[]).includes('acessorio_' + slot)) problemas.push(slot + ' nao e slot de equipamento');
}
if (slotPorSocket3d('wrist_l') !== 'pulso_e' || slotPorSocket3d('head') !== 'cabeca') problemas.push('slotPorSocket3d inverso errado');
console.log(JSON.stringify({ problemas, total: PARTES.length, statusPadrao: statusQaVisualDe('bas_classica') }));
`);
    execSync(`npx esbuild ${join(tmp, 'prova.ts')} --bundle --platform=node --format=esm --outfile=${join(tmp, 'prova.mjs')} --log-level=silent`, { cwd: RAIZ, stdio: ['ignore', 'ignore', 'inherit'] });
    const r = JSON.parse(execSync(`node ${join(tmp, 'prova.mjs')}`, { cwd: RAIZ }).toString());
    for (const p of r.problemas) falhas.push(`[A] ${p}`);
    ok(r.total >= 393, `[A] catálogo com ${r.total} itens`);
    ok(r.statusPadrao === 'pending', '[A] status de QA padrão deveria ser pending');

    // schema v2 — validador (puro) sobre os 34 manifests publicados + fixtures
    const { validarSchemaV2, validarAsset } = await import('../assets3d/validar-asset.mjs');
    const ids = new Map();
    for (const pasta of ['personagens', 'partes']) {
      const dir = join(RAIZ, 'public', 'assets', 'avatars', '3d', pasta);
      for (const slug of readdirSync(dir)) {
        const arq = join(dir, slug, 'manifest.json');
        if (!existsSync(arq)) continue;
        const m = JSON.parse(readFileSync(arq, 'utf8'));
        ok(m.schemaVersion === 2 && m.qualidadeVisual && m.qaVisual?.status && m.visibility, `[A] ${pasta}/${slug} sem carimbo v2`);
        const sv = validarSchemaV2(m);
        ok(sv.erros.length === 0, `[A] ${slug}: schema v2 com erros: ${sv.erros.join('; ')}`);
        ok(!sv.avisos.some((a) => a.includes('desconhecido')), `[A] ${slug}: campo desconhecido no manifest: ${sv.avisos.join('; ')}`);
        if (ids.has(m.id)) falhas.push(`[A] id duplicado entre pastas: ${m.id} (${ids.get(m.id)} e ${pasta})`);
        ids.set(m.id, pasta);
      }
      const idx = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'));
      ok(idx.personagens.every((p) => p.qualidadeVisual && p.visibility), `[A] index.json de ${pasta} sem qualidadeVisual/visibility`);
    }
    ok(ids.size === 34, `[A] esperava 34 manifests, achei ${ids.size}`);
    // validador completo segue aprovando uma base real (nada regrediu)
    const rBase = validarAsset(join(RAIZ, 'public', 'assets', 'avatars', '3d', 'personagens', 'base_superhero_m'));
    ok(rBase.aprovado && rBase.medidas.schemaVersion === 2, `[A] base_superhero_m reprovada após v2: ${rBase.erros.join('; ')}`);
    // fixtures
    const base = { id: 'ace3d_teste', tipo: 'parte_acessorio', versao: 1, rig: 'ubc-v1', lods: {}, hashes: {}, licenca: {}, origem: 'x', schemaVersion: 2 };
    const f1 = validarSchemaV2({ ...base, campoInventado: 1 });
    ok(f1.erros.length === 0 && f1.avisos.some((a) => a.includes('desconhecido "campoInventado"')), '[A] campo desconhecido deveria ser AVISO, não erro');
    const f2 = validarSchemaV2({ ...base, qualidadeVisual: 'otimo' });
    ok(f2.erros.some((e) => e.includes('fora do enum')), '[A] enum inválido de qualidadeVisual deveria ser ERRO');
    const f3 = validarSchemaV2({ ...base, qualidadeVisual: 'premium' });
    ok(f3.erros.some((e) => e.includes('exige o campo "qaVisual"')), '[A] premium sem qaVisual deveria ser ERRO (§2589)');
    const f4 = validarSchemaV2({ ...base, qualidadeVisual: 'premium', qaVisual: { status: 'pending' }, artBibleVersion: '1.0', bounds: {}, materiais: {} });
    ok(f4.erros.length === 0 && f4.avisos.some((a) => a.includes('não pode ser PUBLICADO')), '[A] premium pendente deveria avisar o gate §2677');
    const f5 = validarSchemaV2({ ...base, id: 'oculos_legal' });
    ok(f5.avisos.some((a) => a.includes('naming #166')), '[A] id fora do naming #166 em asset v2 deveria avisar');
    const f6 = validarSchemaV2({ id: 'x', tipo: 'parte_cabelo', versao: 1, rig: 'r', lods: {}, hashes: {}, licenca: {}, origem: 'o' });
    ok(f6.erros.length === 0 && f6.v2 === false, '[A] manifest v1 puro deveria continuar válido');

    // relatório KPI determinístico
    const KPI = join(RAIZ, 'docs', 'AVATAR-STUDIO-5', 'evidencias', 'kpi-visual.json');
    const antes = readFileSync(KPI, 'utf8');
    execSync('node scripts/avatar/qa-visual/relatorio.mjs --json', { cwd: RAIZ, stdio: ['ignore', 'ignore', 'inherit'] });
    ok(antes === readFileSync(KPI, 'utf8'), '[A] relatorio.mjs não é determinístico (ou kpi-visual.json desatualizado — regerar)');
    const kpi = JSON.parse(antes);
    ok(kpi.catalogo2d.geral.total >= 393 && kpi.assets3d.geral.total === 34 && kpi.assets3d.placeholdersPoc.prototype === 9, '[A] KPI com contagens inesperadas');
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}

// ── B) Navegador ────────────────────────────────────────────────────
const abrirDetalhe = async (p) => p.evaluate(() => {
  const card = [...document.querySelectorAll('.avst5-painel .avst-card')].find((c) => !c.className.includes('avst-card-nenhum'));
  card?.querySelector('.avst-card-info-btn')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
for (const ligada of [true, false]) {
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: (on) => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': false, 'as6.avatar_visual_v2': on })); },
    initArg: ligada,
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await abrirDetalhe(p);
    await p.waitForTimeout(500);
    const n = await p.locator('[data-teste="det-qualidade"]').count();
    if (ligada) {
      ok(n === 1, '[B-ON] drawer sem det-qualidade com a flag ligada');
      const txt = await p.locator('[data-teste="det-qualidade"]').textContent();
      ok(!!txt && txt.includes('Qualidade: Produção') && txt.includes('QA pendente'), `[B-ON] texto de qualidade inesperado: ${txt}`);
      ok(await p.locator('[data-teste="det-tag"]', { hasText: '#production' }).count() === 1, '[B-ON] tag #production ausente no drawer');
    } else {
      ok(n === 0, '[B-OFF] det-qualidade apareceu com a flag desligada (§651)');
      ok(await p.locator('[data-teste="det-tag"]', { hasText: '#production' }).count() === 0, '[B-OFF] tag #production vazou sem a flag');
    }
    await p.screenshot({ path: `${SAIDA}/qualidade-visual-drawer-${ligada ? 'on' : 'off'}.png` });
    ok(erros.length === 0, `[B-${ligada ? 'ON' : 'OFF'}] erros JS: ${erros.join(' | ')}`);
  } finally { await b.close(); }
}
// PoC Estúdio 3D (clássico): placeholders escondidos só com a flag ON (e hud3d OFF)
for (const ligada of [true, false]) {
  const { navegador: b, pagina: p } = await abrir({
    viewport: { width: 1500, height: 940 }, webgl: true,
    init: (on) => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': false, 'as5.palco3d': true, 'as5.classico_aaa': false, 'as5.hud3d': false, 'as6.avatar_visual_v2': on })); },
    initArg: ligada,
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await abrirAba3d(p);
    const botoes = await p.locator('.avst-3d-socket .avst-3d-chips button').count();
    // 7 sockets da leva 1 × chip "—" + 9 placeholders (flag OFF) · só os 7 "—" (flag ON)
    if (ligada) ok(botoes === 7, `[PoC-ON] esperava só os 7 chips "—" (prototypes escondidos), achei ${botoes}`);
    else ok(botoes === 16, `[PoC-OFF] esperava 16 chips (7 "—" + 9 placeholders), achei ${botoes}`);
  } finally { await b.close(); }
}

console.log('[qualidade-visual] FALHAS:', falhas.length ? falhas.join(' || ') : 'nenhuma');
process.exit(falhas.length ? 1 : 0);
