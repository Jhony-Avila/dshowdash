// testes/golden-classic.mjs — onda 1411 (MEGA_BRIEFING_01 §2381–§2427,
// §2498–§2510; decisão #159): FUNDAÇÃO CLASSIC PREMIUM como contrato.
//
// Node puro (esbuild --platform=node, defaults PADROES = flags OFF):
//   A) CAMADAS_Z → ORDEM_CAMADAS derivada é BYTE A BYTE a lista histórica
//      do render (snapshot literal aqui); z estritamente crescente ×10;
//   B) byte-stability: acabamento 'premium' persiste no validarConfig
//      (neutro omitido) mas com a FLAG OFF o SVG é byte-idêntico ao
//      clássico (svgDe ignora), inclusive para partes `_px_` equipadas;
//      partes premium FORA do catálogo com flag OFF (itensDe) e resolvíveis
//      por id (POR_ID) — rollback §651 sem perda de dado;
//   C) modo premium (opcoes.premium explícito): sombra de contato entra
//      (padrão OU renderSombra da peça), hooks renderAtras/renderFrente,
//      materiais2d/tintaPremium determinísticos (2 renders = mesmos bytes),
//      SEM filtros SVG novos (SvgSanitizer não estendido), luminância
//      monotônica (claro > base > escuro em L);
//   D) goldens p01–p02 (male/female premium × busto/palco/corpo): sha256
//      gravados em docs/AVATAR-STUDIO-6/golden-classic.json (baseline
//      própria do trilho; --gravar + revisão no MESMO commit, doutrina #83);
//   E) orçamento §2510 nos goldens premium: busto ≤ 40 KB e ≤ 600 nós e
//      ≤ 4 filtros; corpo ≤ 80 KB (relatório via orcamento-2d.mjs).
// @version 1.0.0  @created 2026-08-20
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const BASELINE = join(RAIZ, 'docs', 'AVATAR-STUDIO-6', 'golden-classic.json');
const GRAVAR = process.argv.includes('--gravar');
const tmp = mkdtempSync(join(tmpdir(), 'avst-classic-'));

writeFileSync(join(tmp, 'prova.ts'), `
import { createHash } from 'node:crypto';
import { CAMADAS_Z, ORDEM_CAMADAS } from '@painel/engine/camadas';
import { CONFIG_PADRAO, itensDe, itemPorId, svgDe, validarConfig, configDePreset as _cdp } from '@painel/services/AvatarCatalog';
import { paletaDe } from '@painel/engine/cores';
const paletaFake = () => paletaDe(undefined);
import { tintaPremium, luminanciaDe } from '@painel/engine/cores';
import { material2d, MATERIAIS_2D } from '@painel/engine/materiais2d';
import { SUCESSOR_PREMIUM, qualidadeVisualDe, ehDestacavel, rendererSupport } from '@painel/services/QualidadeVisual';
import type { AvatarConfig } from '@painel/domain/types';

const sha = (s: string): string => createHash('sha256').update(s).digest('hex');
const falhas: string[] = [];
const ok = (c: boolean, m: string): void => { if (!c) falhas.push(m); };
const cfg = (extra: Partial<AvatarConfig>): AvatarConfig => validarConfig({ ...CONFIG_PADRAO, ...extra });

// A) ordem derivada == lista histórica (snapshot literal)
const HISTORICA = ['roupa','roupa_sobre','emblema','boca','olhos','cabelo','acessorio','acessorio_pescoco','acessorio_cabeca','acessorio_rosto','acessorio_costas','acessorio_olhos','acessorio_orelha','acessorio_flutuante','acessorio_companheiro','acessorio_pernas','acessorio_pes','acessorio_cintura','acessorio_pulso_e','acessorio_pulso_d','acessorio_mao_e','acessorio_mao_d'];
ok(JSON.stringify(ORDEM_CAMADAS) === JSON.stringify(HISTORICA), '[A] ORDEM_CAMADAS derivada difere da lista historica: ' + JSON.stringify(ORDEM_CAMADAS));
const zs = HISTORICA.map((c) => (CAMADAS_Z as Record<string, number>)[c]);
ok(zs.every((z, i) => i === 0 || z > zs[i - 1]), '[A] CAMADAS_Z nao estritamente crescente');
ok(zs.every((z) => z % 10 === 0), '[A] z fora dos multiplos de 10');

// B) byte-stability com flag OFF (defaults do PADROES no node)
const classico = cfg({ camadas: { ...CONFIG_PADRAO.camadas, roupa: 'rou_px_terno' } });
const comAcabamento = cfg({ camadas: { ...CONFIG_PADRAO.camadas, roupa: 'rou_px_terno' }, acabamento: 'premium' });
ok(comAcabamento.acabamento === 'premium', '[B] validarConfig deveria persistir acabamento premium');
ok(!('acabamento' in cfg({})), '[B] acabamento neutro deveria ser OMITIDO');
ok((validarConfig({ ...CONFIG_PADRAO, acabamento: 'x' as never }) as AvatarConfig).acabamento === undefined, '[B] acabamento invalido deveria ser descartado');
// uid explicito: o hashConfig muda com o campo novo (uid diferente = ids de
// defs diferentes), mas o RENDER em si tem de ser byte a byte o classico
ok(svgDe(classico, { uid: 'bs' }) === svgDe(comAcabamento, { uid: 'bs' }), '[B] FLAG OFF: acabamento premium NAO pode mudar o render (rollback §651)');
ok(svgDe(cfg({})) === svgDe(cfg({}), { premium: false }), '[B] premium:false explicito = classico byte a byte');
ok(!itensDe('roupa').some((x) => x.id.includes('_px_')), '[B] flag OFF: catalogo nao pode listar partes _px_');
ok(itemPorId('rou_px_terno')?.acabamento === 'premium' && itemPorId('rou_px_jaqueta') !== undefined, '[B] resolver POR_ID deveria aceitar as partes premium (dado salvo)');

// C) modo premium (explicito — o gate por flag ja foi provado em [B])
const svgClassico = svgDe(classico);
const svgPremium = svgDe(comAcabamento, { premium: true });
ok(svgPremium !== svgClassico, '[C] premium deveria mudar o render');
ok(svgPremium.includes('ry="7"') || svgPremium.includes('rx="66"'), '[C] renderSombra da peca (elipse 66x7) ausente');
ok(svgPremium.includes('pxtz'), '[C] renderAtras (halo) ausente');
ok(svgDe(comAcabamento, { premium: true }) === svgPremium, '[C] premium nao deterministico (2 renders diferem)');
// sombra PADRAO quando a peca nao declara renderSombra
const semSombra = cfg({ acabamento: 'premium' }); // roupa padrao (classica, sem hooks)
const svgPadrao = svgDe(semSombra, { premium: true });
ok(svgPadrao.includes('cy="236" rx="58"'), '[C] sombra de contato PADRAO ausente no busto');
ok(!/<filter|<feGaussianBlur|<feDropShadow/.test(svgPremium) || /<filter/.test(svgClassico), '[C] premium introduziu FILTRO svg (orcamento §2510 / sanitizer)');
// materiais/tinta
for (const tk of MATERIAIS_2D) {
  const m = material2d(tk, '#2d4a8a');
  const defs = m.defs('u1');
  ok(defs.includes('u1m2_' + tk), '[C] defs de ' + tk + ' sem prefixo uid');
  ok(m.defs('u1') === defs, '[C] material ' + tk + ' nao deterministico');
  ok(!/<filter/.test(defs), '[C] material ' + tk + ' emite filtro (proibido §2510)');
}
for (const hex of ['#f5f5f5', '#7c5cff', '#101014']) {
  const t = tintaPremium(hex);
  ok(luminanciaDe(t.brilho) >= luminanciaDe(t.claro) && luminanciaDe(t.claro) > luminanciaDe(t.base) - 1e-9 && luminanciaDe(t.base) > luminanciaDe(t.escuro) && luminanciaDe(t.escuro) > luminanciaDe(t.profundo) - 1e-9, '[C] rampa premium nao monotonica em ' + hex);
}
ok(tintaPremium('#101014').luminancia < 0.02 && tintaPremium('#f5f5f5').luminancia > 0.9, '[C] luminancia fora da faixa');
// QualidadeVisual do trilho
ok(qualidadeVisualDe('rou_px_terno') === 'premium', '[C] _px_ deveria nascer premium');
ok(qualidadeVisualDe('rou_terno') === 'legacy' && !ehDestacavel('rou_terno') && ehDestacavel('rou_px_terno'), '[C] sucessor premium deveria rebaixar o legado a legacy fora do destaque');
ok(SUCESSOR_PREMIUM.rou_terno === 'rou_px_terno', '[C] SUCESSOR_PREMIUM sem rou_terno');
ok(JSON.stringify(rendererSupport('rou_px_terno')) === '["2d"]' && JSON.stringify(rendererSupport('base_superhero_m')) === '["3d"]' && rendererSupport('cab_longo').length === 2, '[C] rendererSupport');

// F) onda 1412 — FACES PREMIUM (§595–§597, §701–§708, #162)
import { BASES_PREMIUM, OLHOS_PREMIUM, BOCAS_PREMIUM } from '@painel/engine/partes/premium/faces';
import { EXPRESSOES_PREMIUM, PRESETS, presetsAtivos } from '@painel/services/AvatarCatalog';
const configDePreset = _cdp;
import { paramsDaCamada, sanitizarParams } from '@painel/engine/params';
ok(BASES_PREMIUM.length === 8 && OLHOS_PREMIUM.length === 8 && BOCAS_PREMIUM.length === 8, '[F] 8 bases + 8 olhos + 8 bocas premium');
ok(BASES_PREMIUM.every((x) => /^bas_px_/.test(x.id)) && OLHOS_PREMIUM.every((x) => /^olh_px_/.test(x.id)) && BOCAS_PREMIUM.every((x) => /^boc_px_/.test(x.id)), '[F] naming #166');
ok(!itensDe('base').some((x) => x.id.includes('_px_')) && !itensDe('olhos').some((x) => x.id.includes('_px_')) && !itensDe('boca').some((x) => x.id.includes('_px_')), '[F] flag OFF: catalogo sem faces _px_');
// olhos premium SEM sobrancelha (§703): nada acima de y~96 no fragmento
const olhosSvg = OLHOS_PREMIUM[0].render({ ...paletaFake(), iris: undefined } as never, 'uF');
ok(!/M8\d 9[0-3]|q 11 -6/.test(olhosSvg), '[F] olh_px_ nao pode ter sobrancelha');
ok(olhosSvg.includes('uFpxcatchL') && olhosSvg.includes('uFpxcatchR'), '[F] catchlights sem os ids pxcatchL/R (luz do palco §707)');
ok((olhosSvg.match(/circle/g) ?? []).length >= 8, '[F] olho premium raso demais (iris 2 tons + 2 catchlights)');
// coresFace: valida/persiste/injeta so premium
const cIris = cfg({ camadas: { ...CONFIG_PADRAO.camadas, olhos: 'olh_px_confiante' }, coresFace: { iris: '#3D7A5B' }, acabamento: 'premium' });
ok(cIris.coresFace?.iris === '#3d7a5b', '[F] coresFace.iris deveria normalizar/persistir');
ok(!('coresFace' in cfg({ coresFace: { iris: 'verde' } as never })), '[F] iris invalida deveria cair');
ok(!('coresFace' in cfg({ coresFace: {} })), '[F] coresFace vazio deveria sumir');
const svgIrisOn = svgDe(cIris, { uid: 'ir', premium: true });
const svgIrisOff = svgDe(cIris, { uid: 'ir', premium: false });
const svgSemIris = svgDe(cfg({ camadas: { ...CONFIG_PADRAO.camadas, olhos: 'olh_px_confiante' }, acabamento: 'premium' }), { uid: 'ir', premium: false });
ok(svgIrisOn.includes('#3d7a5b') || svgIrisOn.includes('3d7a5b'), '[F] premium deveria pintar a iris escolhida');
ok(svgIrisOff === svgSemIris, '[F] sem premium a iris NAO pode aplicar (rollback §651)');
// params olhos v2: soV2 gating
ok((paramsDaCamada('olhos') ?? []).every((d) => !d.soV2) && (paramsDaCamada('olhos', 'olh_padrao') ?? []).every((d) => !d.soV2), '[F] legado nao pode ver params soV2');
ok((paramsDaCamada('olhos', 'olh_px_confiante') ?? []).some((d) => d.id === 'espacamento'), '[F] olh_px_ deveria ganhar espacamento/altura/inclinacao');
ok(sanitizarParams('olhos', { espacamento: 1.1 }, 'olh_padrao') === undefined, '[F] validarConfig nao pode aceitar soV2 em arte legada');
ok(sanitizarParams('olhos', { espacamento: 1.1 }, 'olh_px_confiante')?.espacamento === 1.1, '[F] soV2 valido em arte v2');
const cParams = cfg({ camadas: { ...CONFIG_PADRAO.camadas, olhos: 'olh_px_confiante' }, params: { olhos: { espacamento: 1.08, inclinacao: 4 } }, acabamento: 'premium' });
ok(cParams.params?.olhos?.espacamento === 1.08, '[F] params v2 deveriam persistir no config');
const svgP = svgDe(cParams, { uid: 'pp', premium: true });
ok(svgP.includes('scale(1.08 1)') && svgP.includes('rotate(4 120 108)'), '[F] wrappers de espacamento/inclinacao ausentes');
// expressoes = presets de par olhos+boca (sem campo novo)
ok(EXPRESSOES_PREMIUM.length === 8 && EXPRESSOES_PREMIUM.every((e) => itemPorId(e.olhos)?.acabamento === 'premium' && itemPorId(e.boca)?.acabamento === 'premium'), '[F] expressoes premium invalidas');
ok(!('expressao' in cfg({})), '[F] expressao NAO pode virar campo do config');
// presets golden gated
ok(PRESETS.some((x) => x.id === 'pre_golden_m') && PRESETS.some((x) => x.id === 'pre_golden_f'), '[F] presets golden ausentes');
ok(!presetsAtivos().some((x) => x.id.startsWith('pre_golden_')), '[F] flag OFF: presetsAtivos nao pode listar os golden');
const cfgM = validarConfig({ formato: 'camadas', versao: 2, ...configDePreset(PRESETS.find((x) => x.id === 'pre_golden_m')!) } as never);
ok(cfgM.base === 'bas_px_angular' && cfgM.acabamento === 'premium' && cfgM.coresFace?.iris === '#4a3626', '[F] configDePreset do golden male: ' + JSON.stringify({ base: cfgM.base, ac: cfgM.acabamento }));

// G) onda 1413 — CABELOS PREMIUM (§881–§897, #181)
import { CABELOS_PREMIUM } from '@painel/engine/partes/premium/cabelos';
import { HUMANOIDES } from '@painel/engine/partes/cabelos';
import { PERFIL_HEADWEAR, PERFIL_CABELO_PX, resolverEstadoCabelo, profundidadeRecorte } from '@painel/engine/compat-cabelo';
ok(CABELOS_PREMIUM.length === 10 && CABELOS_PREMIUM.every((x) => /^cab_px_/.test(x.id)), '[G] 10 cabelos cab_px_* (naming #166)');
ok(!itensDe('cabelo').some((x) => x.id.includes('_px_')), '[G] flag OFF: catalogo sem cabelos _px_');
ok(itemPorId('cab_px_curto')?.acabamento === 'premium' && itemPorId('cab_px_afro') !== undefined, '[G] resolver POR_ID aceita cabelos premium (dado salvo)');
ok(HUMANOIDES.includes('bas_px_oval') && HUMANOIDES.includes('bas_px_suave') && CABELOS_PREMIUM.every((x) => x.requerBase === HUMANOIDES), '[G] requerBase precisa incluir as bases _px_ (compat 1412)');
const LONGOS = ['cab_px_longo_liso', 'cab_px_ondulado', 'cab_px_rabo'];
ok(CABELOS_PREMIUM.every((x) => LONGOS.includes(x.id) === (x.renderAtras !== undefined)), '[G] renderAtras: exatamente os 3 longos (massa atras dos ombros §889)');
ok(['cab_px_longo_liso', 'cab_px_ondulado', 'cab_px_cacheado'].every((id) => itemPorId(id)?.usaCores?.includes('destaque')), '[G] canal destaque declarado nas mechas §891');
ok(CABELOS_PREMIUM.every((x) => x.id in PERFIL_CABELO_PX), '[G] todo cab_px_ precisa de perfil §897');
// matriz §897 (spot checks das 4 combinacoes-chave)
ok(resolverEstadoCabelo('cab_px_coque', null) === 'visible' && resolverEstadoCabelo(null, 'ace_bone') === 'hidden', '[G] §897 basicos');
ok(resolverEstadoCabelo('cab_px_coque', 'ace_coroa') === 'visible', '[G] §897 aberto = visible');
ok(resolverEstadoCabelo('cab_px_coque', 'ace_bone') === 'masked' && resolverEstadoCabelo('cab_px_curto', 'ace_bone') === 'visible', '[G] §897 justo: alto=masked, baixo=visible');
ok(resolverEstadoCabelo('cab_px_longo_liso', 'ace_bone') === 'variant' && resolverEstadoCabelo('cab_px_longo_liso', 'ace_viseira_vr') === 'variant', '[G] §897 longo vence o chapeu (variant)');
ok(resolverEstadoCabelo('cab_px_curto', 'ace_viseira_vr') === 'hidden', '[G] §897 fechado engole o curto');
ok(resolverEstadoCabelo('cab_inexistente', 'ace_inexistente') === 'visible', '[G] fallback conservador fora dos registries');
ok(profundidadeRecorte('masked') === 14 && profundidadeRecorte('variant') === 8 && profundidadeRecorte('visible') === 0, '[G] profundidades §897');
ok(profundidadeRecorte('masked', 1) === 22 && profundidadeRecorte('visible', 0.5) === 11, '[G] encaixe manual escala 0..22px');
// clip no render: SO premium + _px_ + prof>0
const comBone = cfg({ base: 'bas_px_oval', camadas: { ...CONFIG_PADRAO.camadas, cabelo: 'cab_px_coque', acessorio: 'ace_bone' }, acabamento: 'premium' });
ok(svgDe(comBone, { uid: 'hc', premium: true }).includes('hchclip'), '[G] clip §897 ausente (premium + coque + bone)');
ok(!svgDe(comBone, { uid: 'hc' }).includes('hchclip'), '[G] clip NAO pode existir sem premium (rollback §651)');
const classicoBone = cfg({ camadas: { ...CONFIG_PADRAO.camadas, cabelo: 'cab_coque', acessorio: 'ace_bone' }, acabamento: 'premium' });
ok(!svgDe(classicoBone, { uid: 'hc', premium: true }).includes('hchclip'), '[G] arte classica NUNCA e recortada (nao editar partes/*)');
ok(!svgDe(cfg({ base: 'bas_px_oval', camadas: { ...CONFIG_PADRAO.camadas, cabelo: 'cab_px_coque' }, acabamento: 'premium' }), { uid: 'hc', premium: true }).includes('hchclip'), '[G] sem chapeu = sem clip');
// param encaixe: soV2, consumido pelo motor
ok((paramsDaCamada('cabelo') ?? []).every((d) => d.id !== 'encaixe'), '[G] legado nao pode ver o encaixe');
ok((paramsDaCamada('cabelo', 'cab_px_curto') ?? []).some((d) => d.id === 'encaixe'), '[G] cab_px_ deveria ganhar o param encaixe');
ok(sanitizarParams('cabelo', { encaixe: 0.5 }, 'cab_curto') === undefined && sanitizarParams('cabelo', { encaixe: 0.5 }, 'cab_px_curto')?.encaixe === 0.5, '[G] encaixe gated por soV2');
const comEncaixe = cfg({ base: 'bas_px_oval', camadas: { ...CONFIG_PADRAO.camadas, cabelo: 'cab_px_curto' }, params: { cabelo: { encaixe: 0.5 } }, acabamento: 'premium' });
ok(svgDe(comEncaixe, { uid: 'hc', premium: true }).includes('y="60"'), '[G] encaixe 0.5 deveria recortar em y=49+11');
// byte-stability: config com cabelo premium + acabamento, FLAG OFF = classico
const cabOff = cfg({ base: 'bas_px_oval', camadas: { ...CONFIG_PADRAO.camadas, cabelo: 'cab_px_lateral' }, acabamento: 'premium' });
ok(svgDe(cabOff, { uid: 'bs' }) === svgDe({ ...cabOff, acabamento: undefined } as never, { uid: 'bs' }), '[G] FLAG OFF: cabelo premium equipado nao muda o render');

// D) goldens p01-p06 + c01-c02 (1411/1412) + h01-h06 + p07-p08 (1413)
const p01 = cfg({ camadas: { ...CONFIG_PADRAO.camadas, roupa: 'rou_px_terno' }, acabamento: 'premium', cores: { ...CONFIG_PADRAO.cores, destaque: '#c9a75a' } });
const p02 = cfg({ base: 'bas_redonda', camadas: { ...CONFIG_PADRAO.camadas, roupa: 'rou_px_jaqueta', cabelo: 'cab_ondulado' }, acabamento: 'premium', cores: { ...CONFIG_PADRAO.cores, cabelo: '#d9b166', roupa: '#7a2d3c' } });
// onda 1412: p03/p04 = golden faces male/female; p05 = iris + params v2;
// p06 = expressao (par olhos+boca); c01/c02 = presets golden completos
const p03 = cfg({ base: 'bas_px_angular', camadas: { ...CONFIG_PADRAO.camadas, olhos: 'olh_px_confiante', boca: 'boc_px_sorriso', roupa: 'rou_px_terno' }, coresFace: { iris: '#4a3626' }, acabamento: 'premium' });
const p04 = cfg({ base: 'bas_px_coracao', camadas: { ...CONFIG_PADRAO.camadas, olhos: 'olh_px_amendoado', boca: 'boc_px_suave', roupa: 'rou_px_jaqueta' }, coresFace: { iris: '#2f5d43' }, acabamento: 'premium' });
const p05 = cfg({ base: 'bas_px_oval', camadas: { ...CONFIG_PADRAO.camadas, olhos: 'olh_px_intenso', boca: 'boc_px_riso' }, coresFace: { iris: '#3a6ea8' }, params: { olhos: { espacamento: 1.06, altura: -1.5, inclinacao: 3 } }, acabamento: 'premium' });
const exp = EXPRESSOES_PREMIUM[6]; // misterio
const p06 = cfg({ base: 'bas_px_diamante', camadas: { ...CONFIG_PADRAO.camadas, olhos: exp.olhos, boca: exp.boca }, acabamento: 'premium' });
const c01 = validarConfig({ formato: 'camadas', versao: 2, ...configDePreset(PRESETS.find((x) => x.id === 'pre_golden_m')!) } as never);
const c02 = validarConfig({ formato: 'camadas', versao: 2, ...configDePreset(PRESETS.find((x) => x.id === 'pre_golden_f')!) } as never);
const casos: Record<string, string> = {};
for (const [nome, c] of [['p01', p01], ['p02', p02]] as const) {
  casos[nome + '-busto'] = svgDe(c, { premium: true });
  casos[nome + '-palco'] = svgDe(c, { premium: true, palco: true });
  casos[nome + '-corpo'] = svgDe(c, { premium: true, palco: true, enquadramento: 'corpo' });
}
for (const [nome, c] of [['p03', p03], ['p04', p04], ['p05', p05], ['p06', p06]] as const) {
  casos[nome + '-busto'] = svgDe(c, { premium: true });
}
casos['c01-golden-m-palco'] = svgDe(c01, { premium: true, palco: true });
casos['c02-golden-f-palco'] = svgDe(c02, { premium: true, palco: true });
// onda 1413: h01-h06 = Golden Hair (2 estilos x escuro/loiro/branco sobre a
// base golden); p07/p08 = goldens completos com cabelo premium
const CORES_HAIR: [string, string][] = [['escuro', '#14100c'], ['loiro', '#d9b166'], ['branco', '#e8e6e0']];
let h = 0;
for (const estilo of ['cab_px_lateral', 'cab_px_longo_liso']) {
  for (const [, hex] of CORES_HAIR) {
    h += 1;
    const c = cfg({ base: 'bas_px_oval', camadas: { ...CONFIG_PADRAO.camadas, cabelo: estilo }, cores: { ...CONFIG_PADRAO.cores, cabelo: hex, destaque: '#c9a75a' }, acabamento: 'premium' });
    casos['h0' + h + '-' + estilo.replace('cab_px_', '') + '-busto'] = svgDe(c, { premium: true });
  }
}
const p07 = cfg({ ...c01, camadas: { ...c01.camadas, cabelo: 'cab_px_lateral' }, cores: { ...c01.cores, cabelo: '#14100c' } });
const p08 = cfg({ ...c02, camadas: { ...c02.camadas, cabelo: 'cab_px_longo_liso' }, cores: { ...c02.cores, cabelo: '#3d2b1f', destaque: '#c9a75a' } });
casos['p07-golden-m-cabelo-busto'] = svgDe(p07, { premium: true });
casos['p08-golden-f-cabelo-busto'] = svgDe(p08, { premium: true });
const hashes: Record<string, { sha256: string; bytes: number; nos: number; filtros: number }> = {};
for (const [id, svg] of Object.entries(casos)) {
  hashes[id] = { sha256: sha(svg), bytes: svg.length, nos: (svg.match(/</g) ?? []).length, filtros: (svg.match(/<filter/g) ?? []).length };
}
// E) orcamento §2510
for (const [id, m] of Object.entries(hashes)) {
  const teto = id.endsWith('-corpo') ? 80 * 1024 : 40 * 1024;
  ok(m.bytes <= teto, '[E] ' + id + ' acima do orcamento (' + m.bytes + ' > ' + teto + ')');
  if (!id.endsWith('-corpo')) ok(m.nos <= 600, '[E] ' + id + ' com ' + m.nos + ' nos (> 600)');
  ok(m.filtros <= 4, '[E] ' + id + ' com ' + m.filtros + ' filtros (> 4)');
}
console.log(JSON.stringify({ falhas, hashes }));
`);

const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')]
  .find((c) => existsSync(c)) ?? 'esbuild';
execSync(`"${esbuild}" "${join(tmp, 'prova.ts')}" --bundle --format=esm --platform=node --alias:@painel="${join(PAINEL, 'src')}" --outfile="${join(tmp, 'prova.mjs')}"`, { stdio: ['ignore', 'ignore', 'inherit'] });
const bruto = execSync(`node "${join(tmp, 'prova.mjs')}"`, { encoding: 'utf8' });
rmSync(tmp, { recursive: true, force: true });
const { falhas, hashes } = JSON.parse(bruto.trim().split('\n').pop());

if (GRAVAR) {
  writeFileSync(BASELINE, `${JSON.stringify({
    descricao: 'GOLDEN CLASSIC PREMIUM (ondas 1411–1413, decisão #159) — sha256 do SVG premium por caso: p01/p02 (roupas × busto/palco/corpo), p03–p06 (faces 1412), c01/c02 (presets golden no palco), h01–h06 (Golden Hair 1413: 2 estilos × 3 cores), p07/p08 (goldens completos com cabelo premium). Regenerar: node scripts/avatar/testes/golden-classic.mjs --gravar (revisar o diff no MESMO commit — doutrina #83; mudança visual premium exige validação do Jhony antes de ligar a flag).',
    casos: hashes,
  }, null, 2)}\n`);
  console.log(`[golden-classic] baseline gravada (${Object.keys(hashes).length} casos)`);
} else if (!existsSync(BASELINE)) {
  falhas.push('baseline golden-classic.json ausente — rode --gravar no commit da onda');
} else {
  const base = JSON.parse(readFileSync(BASELINE, 'utf8')).casos;
  for (const [id, m] of Object.entries(hashes)) {
    if (!base[id]) falhas.push(`caso NOVO sem baseline: ${id} (--gravar + revisão)`);
    else if (base[id].sha256 !== m.sha256) falhas.push(`GOLDEN PREMIUM MUDOU: ${id} (${base[id].sha256.slice(0, 10)} → ${m.sha256.slice(0, 10)}) — doutrina #83`);
  }
  for (const id of Object.keys(base)) if (!hashes[id]) falhas.push(`caso da baseline sumiu: ${id}`);
}

console.log('[golden-classic] FALHAS:', falhas.length ? falhas.join(' || ') : 'nenhuma');
process.exit(falhas.length ? 1 : 0);
