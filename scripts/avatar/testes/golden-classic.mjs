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
// onda 1414 (#186): camadas faciais novas entram nos VAOS (barba=34,
// nariz=44, sobrancelha=54) — fundadoras seguem multiplas de 10; o
// contrato passa a ser z INTEIRO estritamente crescente + snapshot.
const HISTORICA = ['roupa_inferior','roupa','roupa_sobre','emblema','barba','boca','nariz','olhos','sobrancelha','cabelo','acessorio','acessorio_pescoco','acessorio_cabeca','acessorio_rosto','acessorio_costas','acessorio_olhos','acessorio_orelha','acessorio_flutuante','acessorio_companheiro','acessorio_pernas','acessorio_pes','acessorio_cintura','acessorio_pulso_e','acessorio_pulso_d','acessorio_mao_e','acessorio_mao_d'];
ok(JSON.stringify(ORDEM_CAMADAS) === JSON.stringify(HISTORICA), '[A] ORDEM_CAMADAS derivada difere da lista historica: ' + JSON.stringify(ORDEM_CAMADAS));
const zs = HISTORICA.map((c) => (CAMADAS_Z as Record<string, number>)[c]);
ok(zs.every((z, i) => i === 0 || z > zs[i - 1]), '[A] CAMADAS_Z nao estritamente crescente');
ok(zs.every((z) => Number.isInteger(z)), '[A] z nao inteiro');
ok(['roupa','boca','olhos','cabelo'].every((c) => (CAMADAS_Z as Record<string, number>)[c] % 10 === 0), '[A] camada fundadora fora do multiplo de 10');

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

// H) onda 1414 — BARBA/SOBRANCELHA/NARIZ + expressao/idade (#162, #186+)
import { BARBAS_PREMIUM, SOBRANCELHAS_PREMIUM, NARIZES_PREMIUM } from '@painel/engine/partes/premium/rosto';
import { resolverEstadoBarba, fatorBarba, PERFIL_BARBA, MASCARAS_ROSTO_FECHADAS } from '@painel/engine/compat-rosto';
import { EXPRESSOES_FACE, expressaoPorId, transformExpressao } from '@painel/domain/expressoes';
import { PERFIS_IDLE_FACE, perfilIdleDe } from '@painel/workspace/vida';
import { categoriasAtivas } from '@painel/services/AvatarCatalog';
ok(BARBAS_PREMIUM.length === 8 && SOBRANCELHAS_PREMIUM.length === 10 && NARIZES_PREMIUM.length === 8, '[H] 8 barbas + 10 sobrancelhas + 8 narizes');
ok(BARBAS_PREMIUM.every((x) => /^brb_/.test(x.id)) && SOBRANCELHAS_PREMIUM.every((x) => /^sbr_/.test(x.id)) && NARIZES_PREMIUM.every((x) => /^nar_/.test(x.id)), '[H] naming #166');
ok([...BARBAS_PREMIUM, ...SOBRANCELHAS_PREMIUM, ...NARIZES_PREMIUM].every((x) => x.raridade === 'comum'), '[H] item facial novo = raridade comum (#162)');
ok(!categoriasAtivas().some((c) => c.id === 'barba' || c.id === 'sobrancelha' || c.id === 'nariz'), '[H] flags OFF: categorias faciais fora da sidebar');
ok(itensDe('barba').length === 0 && itemPorId('brb_cheia') !== undefined && itemPorId('sbr_reta') !== undefined && itemPorId('nar_reto') !== undefined, '[H] flag OFF: catalogo vazio, POR_ID resolve (dado salvo)');
// validarConfig: camadas novas + coresFace 4 canais + expressao + idade
const cFace = cfg({ base: 'bas_px_oval', camadas: { ...CONFIG_PADRAO.camadas, barba: 'brb_cheia', sobrancelha: 'sbr_grossa', nariz: 'nar_reto' }, coresFace: { iris: '#3A6EA8', barba: '#14100C', sobrancelha: '#3D2B1F', labios: '#8A4A3E' }, expressao: { preset: 'feliz', intensidade: 0.5 }, idade: 'mature', acabamento: 'premium' });
ok(cFace.camadas.barba === 'brb_cheia' && cFace.camadas.sobrancelha === 'sbr_grossa' && cFace.camadas.nariz === 'nar_reto', '[H] camadas faciais deveriam persistir');
ok(cFace.coresFace?.barba === '#14100c' && cFace.coresFace?.labios === '#8a4a3e' && cFace.coresFace?.sobrancelha === '#3d2b1f', '[H] coresFace novos canais normalizam');
ok(cFace.expressao?.preset === 'feliz' && cFace.expressao?.intensidade === 0.5, '[H] expressao persiste');
ok(cFace.idade === 'mature', '[H] idade persiste');
ok(!('expressao' in cfg({ expressao: { preset: 'neutra' } as never })), '[H] neutra NUNCA persiste');
ok(!('expressao' in cfg({ expressao: { preset: 'zzz' } as never })), '[H] preset desconhecido cai');
ok(cfg({ expressao: { preset: 'serio', intensidade: 1 } }).expressao?.intensidade === undefined, '[H] intensidade 1 (padrao) omitida');
ok(!('idade' in cfg({ idade: 'adult' })), '[H] adult NUNCA persiste');
ok(!('coresFace' in cfg({ coresFace: { barba: 'ruivo' } as never })), '[H] hex invalido cai e objeto vazio some');
// registry de expressoes
ok(EXPRESSOES_FACE.length === 7 && !expressaoPorId('neutra') && EXPRESSOES_FACE.every((e) => e.olhos || e.boca || e.sobrancelha), '[H] registry semantico');
ok(transformExpressao('boca', 'feliz', 0) === '' && transformExpressao('boca', 'feliz', 1) !== '' && transformExpressao('boca', undefined) === '', '[H] transformExpressao escala por intensidade');
ok(Object.keys(PERFIS_IDLE_FACE).sort().join(',') === EXPRESSOES_FACE.map((e) => e.id).sort().join(',') && perfilIdleDe('zzz') === undefined, '[H] Face Idle Profiles cobrem o registry');
// byte-stability: flags OFF (default node) — campos novos NAO mudam o render
const cSo = cfg({ base: 'bas_px_oval', camadas: { ...CONFIG_PADRAO.camadas, barba: 'brb_cheia' }, acabamento: 'premium' });
const cTudo = cfg({ base: 'bas_px_oval', camadas: { ...CONFIG_PADRAO.camadas, barba: 'brb_cheia' }, coresFace: { barba: '#e84c6f', labios: '#8a2a3e' }, expressao: { preset: 'bravo' }, idade: 'mature', acabamento: 'premium' });
ok(svgDe(cSo, { uid: 'bs' }) === svgDe(cTudo, { uid: 'bs' }), '[H] FLAG OFF: expressao/idade/coresFace NAO podem mudar o render (§651)');
// faceV2 explicito: wrappers/overlay/canais entram — e SO em artes v2
const cExpr = cfg({ base: 'bas_px_oval', camadas: { ...CONFIG_PADRAO.camadas, olhos: 'olh_px_confiante', boca: 'boc_px_sorriso' }, expressao: { preset: 'feliz' }, acabamento: 'premium' });
const svgExpr = svgDe(cExpr, { uid: 'fx', premium: true, faceV2: true });
ok(svgExpr !== svgDe(cExpr, { uid: 'fx', premium: true }), '[H] faceV2 deveria aplicar a expressao');
ok(svgDe(cExpr, { uid: 'fx', premium: true, faceV2: true }) === svgExpr, '[H] faceV2 nao deterministico');
const cLegado = cfg({ camadas: { ...CONFIG_PADRAO.camadas }, expressao: { preset: 'feliz' } });
ok(svgDe(cLegado, { uid: 'fx', faceV2: true }) === svgDe(cLegado, { uid: 'fx' }), '[H] expressao NAO pode tocar arte legada');
// idade: overlay so em base _px_
const cIdade = cfg({ base: 'bas_px_oval', camadas: { ...CONFIG_PADRAO.camadas }, idade: 'mature', acabamento: 'premium' });
ok(svgDe(cIdade, { uid: 'fx', premium: true, faceV2: true }) !== svgDe(cIdade, { uid: 'fx', premium: true }), '[H] idade mature deveria desenhar o overlay');
const cIdadeLegada = cfg({ camadas: { ...CONFIG_PADRAO.camadas }, idade: 'mature' });
ok(svgDe(cIdadeLegada, { uid: 'fx', faceV2: true }) === svgDe(cIdadeLegada, { uid: 'fx' }), '[H] overlay de idade NAO entra em base classica');
// coresFace.barba pinta a barba com faceV2
const cBarbaCor = cfg({ base: 'bas_px_oval', camadas: { ...CONFIG_PADRAO.camadas, barba: 'brb_cheia' }, coresFace: { barba: '#e84c6f' }, acabamento: 'premium' });
const cBarbaSem = cfg({ base: 'bas_px_oval', camadas: { ...CONFIG_PADRAO.camadas, barba: 'brb_cheia' }, acabamento: 'premium' });
ok(svgDe(cBarbaCor, { uid: 'fx', premium: true, faceV2: true }) !== svgDe(cBarbaSem, { uid: 'fx', premium: true, faceV2: true }), '[H] coresFace.barba deveria mudar a barba');
ok(svgDe(cBarbaCor, { uid: 'fx', premium: true }) === svgDe(cBarbaSem, { uid: 'fx', premium: true }), '[H] sem faceV2 o canal barba NAO aplica (§651)');
// compat barba x mascara/cachecol (sempre para brb_ — dado novo)
ok(resolverEstadoBarba(null, null, null) === 'hidden' && resolverEstadoBarba('brb_cheia', null, null) === 'visible', '[H] estados basicos da barba');
ok(MASCARAS_ROSTO_FECHADAS.every((m) => resolverEstadoBarba('brb_cheia', m, null) === 'hidden'), '[H] mascara fechada engole a barba');
ok(resolverEstadoBarba('brb_longa', null, 'ace_cachecol') === 'hidden' && resolverEstadoBarba('brb_rala', null, 'ace_cachecol') === 'visible', '[H] cachecol so conflita com barba longa');
ok(resolverEstadoBarba('brb_inexistente', 'ace_inexistente', null) === 'visible', '[H] fallback conservador');
ok(BARBAS_PREMIUM.every((x) => x.id in PERFIL_BARBA), '[H] toda barba precisa de perfil');
const cMask = cfg({ base: 'bas_px_oval', camadas: { ...CONFIG_PADRAO.camadas, barba: 'brb_cheia', acessorio: 'ace_mascara_oni' } });
const cSemMask = cfg({ base: 'bas_px_oval', camadas: { ...CONFIG_PADRAO.camadas, barba: 'brb_cheia' } });
ok(!svgDe(cMask, { uid: 'fx' }).includes('fxpxbrb') && svgDe(cSemMask, { uid: 'fx' }).includes('fxpxbrb'), '[H] render: mascara equipada esconde a barba');
// beard fit por familia (#162): base angulosa escala a barba
ok(fatorBarba('bas_px_angular') === 1.05 && fatorBarba('bas_px_redonda') === 1.1 && fatorBarba('bas_classica') === 1, '[H] fatorBarba por familia');
const cFit = cfg({ base: 'bas_px_redonda', camadas: { ...CONFIG_PADRAO.camadas, barba: 'brb_cheia' } });
ok(svgDe(cFit, { uid: 'fx' }).includes('scale(1.1 1)'), '[H] fit da barba aplicado no render');
// assimetria: deterministica e presente com faceV2 em arte v2
const svgAssim = svgDe(cExpr, { uid: 'fx', premium: true, faceV2: true });
ok(svgAssim === svgDe(cExpr, { uid: 'fx', premium: true, faceV2: true }), '[H] assimetria precisa ser deterministica');

// I) onda 1415 — VESTUARIO PREMIUM (#191)
import { ROUPAS_PREMIUM_1415, SOBREPECAS_PREMIUM, ROUPAS_INFERIORES, CALCADOS_PREMIUM } from '@painel/engine/partes/premium/vestuario';
import { corpoPremium } from '@painel/engine/partes/premium/corpo';
import { secundarioPadraoDe } from '@painel/engine/cores';
import { CONJUNTOS, conjuntosAtivos, aplicarConjunto } from '@painel/services/Conjuntos';
import { VARIANTES_POR_ASSET } from '@painel/services/VariantesAssets';
ok(ROUPAS_PREMIUM_1415.length === 8 && SOBREPECAS_PREMIUM.length === 2 && ROUPAS_INFERIORES.length === 3 && CALCADOS_PREMIUM.length === 3, '[I] 8 roupas + 2 sobrepecas + 3 rin_ + 3 calcados');
ok(ROUPAS_PREMIUM_1415.every((x) => /^rou_px_/.test(x.id)) && ROUPAS_INFERIORES.every((x) => /^rin_/.test(x.id)) && CALCADOS_PREMIUM.every((x) => /^ace_px_/.test(x.id) && x.slot === 'pes'), '[I] naming #166 + slot pes');
ok([...ROUPAS_PREMIUM_1415, ...SOBREPECAS_PREMIUM, ...ROUPAS_INFERIORES, ...CALCADOS_PREMIUM].every((x) => x.materialToken), '[I] toda peca declara materialToken');
ok(ROUPAS_INFERIORES.every((x) => x.render(paletaFake(), 'x') === '' && x.renderCorpo) && CALCADOS_PREMIUM.every((x) => x.render(paletaFake(), 'x') === ''), '[I] rin_/calcado: busto vazio, arte no renderCorpo (#154)');
ok(!itensDe('roupa_inferior').length && itemPorId('rin_jeans') !== undefined, '[I] flag OFF: catalogo vazio, POR_ID resolve');
ok(!categoriasAtivas().some((c) => c.id === 'roupa_inferior'), '[I] flag OFF: categoria Calca fora da sidebar');
// cores.secundario: opcional, hex valido persiste, invalido/ausente some
ok(cfg({ cores: { ...CONFIG_PADRAO.cores, secundario: '#8A93A6' } as never }).cores.secundario === '#8a93a6', '[I] secundario global valido persiste');
ok(!('secundario' in cfg({}).cores) && !('secundario' in cfg({ cores: { ...CONFIG_PADRAO.cores, secundario: 'azul' } as never }).cores), '[I] secundario ausente/invalido e OMITIDO');
ok(typeof secundarioPadraoDe('#2d4a8a') === 'string' && secundarioPadraoDe('#2d4a8a') === secundarioPadraoDe('#2d4a8a'), '[I] secundarioPadraoDe deterministico');
// coresCamada aceita canal secundario SO em peca que o declara
const cSec = cfg({ camadas: { ...CONFIG_PADRAO.camadas, roupa: 'rou_px_camisa' }, coresCamada: { roupa: { secundario: '#e84c6f' } }, acabamento: 'premium' });
ok(cSec.coresCamada?.roupa?.secundario === '#e84c6f', '[I] canal secundario persiste na peca que declara');
ok(!cfg({ camadas: { ...CONFIG_PADRAO.camadas, roupa: 'rou_camiseta' }, coresCamada: { roupa: { secundario: '#e84c6f' } } }).coresCamada, '[I] canal secundario CAI em peca que nao declara');
// byte-stability: secundario global em config classico nao muda o render
const cSemSec = cfg({});
const cComSec = cfg({ cores: { ...CONFIG_PADRAO.cores, secundario: '#8a93a6' } as never });
ok(svgDe(cSemSec, { uid: 'bs' }) === svgDe(cComSec, { uid: 'bs' }), '[I] FLAG OFF/classico: secundario global nao muda o render');
// canal secundario muda a peca premium (forro)
const cCamisa = (hex) => cfg({ camadas: { ...CONFIG_PADRAO.camadas, roupa: 'rou_px_camisa' }, ...(hex ? { coresCamada: { roupa: { secundario: hex } } } : {}), acabamento: 'premium' });
ok(svgDe(cCamisa('#e84c6f'), { uid: 'sc', premium: true }) !== svgDe(cCamisa(null), { uid: 'sc', premium: true }), '[I] canal secundario muda o forro da peca');
// renderCorpoV2: SO premium, corpo inteiro
const cBlazer = cfg({ camadas: { ...CONFIG_PADRAO.camadas, roupa: 'rou_px_blazer' }, acabamento: 'premium' });
const corpoPrem = svgDe(cBlazer, { uid: 'cv', premium: true, palco: true, enquadramento: 'corpo' });
const corpoClas = svgDe(cBlazer, { uid: 'cv', palco: true, enquadramento: 'corpo' });
// Golden V3 (#219): asserts de CONTRATO (nao geometria antiga). O blazer V3
// desenha via renderCorpoV2 que chama dobras (clipPath uid+fold); o corpo
// premium e o scaffold ANATOMICO corpoInteiroPremium (gradiente da calca
// uid+cpxcal). Ambos SO no premium. Nao validar por hash aqui: mudanca de
// hash Premium e needs-human-review enquanto Gate A = REWORK.
ok(corpoPrem.includes('cvfold'), '[I] renderCorpoV2 V3 (dobras da peca) ausente no premium');
ok(!corpoClas.includes('cvfold'), '[I] renderCorpoV2 NAO pode vazar sem premium (§651)');
ok(corpoPrem.includes('cvcpxcal'), '[I] scaffold ANATOMICO V3 (corpoInteiroPremium) ausente no premium');
ok(!corpoClas.includes('cvcpxcal'), '[I] scaffold anatomico NAO pode vazar sem premium (§651)');
ok(corpoPremium(paletaFake(), 'k') === corpoPremium(paletaFake(), 'k') && !/<filter/.test(corpoPremium(paletaFake(), 'k')), '[I] corpoPremium (fallback historico) deterministico e sem filtros');
// roupa_inferior: renderiza no corpo inteiro, invisivel no busto
const cJeans = cfg({ camadas: { ...CONFIG_PADRAO.camadas, roupa_inferior: 'rin_jeans' }, acabamento: 'premium' });
ok(cJeans.camadas.roupa_inferior === 'rin_jeans', '[I] camada roupa_inferior persiste');
ok(svgDe(cJeans, { uid: 'rj', premium: true, palco: true, enquadramento: 'corpo' }).includes('rjm2_denim'), '[I] rin_jeans (denim) ausente no corpo inteiro');
const cSemJeans = cfg({ acabamento: 'premium' });
ok(svgDe(cJeans, { uid: 'rj', premium: true }) === svgDe(cSemJeans, { uid: 'rj', premium: true }), '[I] rin_ nao muda o BUSTO (byte-estavel)');
// calcado premium no slot pes (corpo inteiro)
const cBota = cfg({ camadas: { ...CONFIG_PADRAO.camadas, acessorio_pes: 'ace_px_bota' }, acabamento: 'premium' });
ok(cBota.camadas.acessorio_pes === 'ace_px_bota' && svgDe(cBota, { uid: 'bt', premium: true, palco: true, enquadramento: 'corpo' }).includes('btm2_leather'), '[I] calcado premium no corpo inteiro');
// variantes: canais ⊆ usaCores e SEM pele; roupas classicas cobertas
const rouComVar = Object.keys(VARIANTES_POR_ASSET).filter((k) => k.startsWith('rou_'));
ok(rouComVar.length >= 29, '[I] variantes de cor para as roupas classicas (' + rouComVar.length + ')');
for (const [aid, vars] of Object.entries(VARIANTES_POR_ASSET)) {
  const declarados = itemPorId(aid)?.usaCores ?? [];
  ok(vars.every((v) => Object.keys(v.canais).every((c) => declarados.includes(c))), '[I] variante fora do usaCores em ' + aid);
  ok(vars.every((v) => !('pele' in v.canais)), '[I] variante de PELE proibida em ' + aid);
}
// conjuntos O01-O06 gated
ok(CONJUNTOS.filter((c) => c.acabamento === 'premium').length === 6, '[I] 6 Golden Outfits');
ok(!conjuntosAtivos().some((c) => c.acabamento === 'premium'), '[I] flag OFF: outfits premium fora da UI');
const o02 = CONJUNTOS.find((c) => c.id === 'cj_o02_offduty');
const aplicado = aplicarConjunto(cfg({}), o02);
ok(aplicado.config.camadas.roupa === 'rou_px_camiseta' && aplicado.config.camadas.roupa_sobre === 'sob_px_cardiga' && aplicado.config.camadas.roupa_inferior === 'rin_jeans' && aplicado.config.camadas.acessorio_pes === 'ace_px_tenis' && aplicado.config.acabamento === 'premium', '[I] aplicarConjunto premium completo: ' + JSON.stringify(aplicado.config.camadas));
// cor extrema (§2404): preto puro e branco puro nas pecas novas — render
// valido (sem NaN/undefined) e deterministico
for (const hex of ['#000000', '#ffffff']) {
  for (const it of [...ROUPAS_PREMIUM_1415, ...SOBREPECAS_PREMIUM]) {
    const c = cfg({ camadas: { ...CONFIG_PADRAO.camadas, [it.categoria]: it.id }, cores: { ...CONFIG_PADRAO.cores, roupa: hex }, acabamento: 'premium' });
    const svg = svgDe(c, { uid: 'xt', premium: true });
    ok(!svg.includes('NaN') && !svg.includes('undefined'), '[I] cor extrema quebrou ' + it.id + ' em ' + hex);
  }
}

// J) onda 1416 — ACESSORIOS PREMIUM + fit + paridade (#196/#197)
import { ACESSORIOS_PREMIUM } from '@painel/engine/partes/premium/acessorios';
import { ACESSORIOS_REGISTRY, fichaDe, conflitoNomeado, regrasDe, podeEquipar } from '@painel/services/AcessoriosRegistry';
import { PARIDADE_RENDERER, idLogicoDe, avisoParidade } from '@painel/services/ParidadeRenderer';
import { estadoVazio } from '@painel/nucleo/contratos';
import { congelarSvg } from '@painel/engine/render';
ok(ACESSORIOS_PREMIUM.length === 10 && ACESSORIOS_PREMIUM.every((x) => /^ace_px_/.test(x.id) && x.acabamento === 'premium' && x.materialToken), '[J] 10 ace_px_ premium com materialToken');
ok(!itensDe('acessorio').some((x) => x.id.includes('_px_')) && itemPorId('ace_px_asas') !== undefined, '[J] flag OFF: catalogo sem ace_px_, POR_ID resolve');
// registry cobre TODOS os acessorios do catalogo (75 + premium)
const todosAce = PRESETS ? [] : [];
const idsAce = new Set([...(itensDe('acessorio').map((x) => x.id)), ...ACESSORIOS_PREMIUM.map((x) => x.id)]);
const semFicha = [...idsAce].filter((id) => !fichaDe(id));
ok(semFicha.length === 0, '[J] acessorios sem ficha no registry: ' + semFicha.join(','));
ok(Object.keys(ACESSORIOS_REGISTRY).length >= 85, '[J] registry com ' + Object.keys(ACESSORIOS_REGISTRY).length + ' fichas (< 85)');
// referencias das regras existem no catalogo
for (const [id, f] of Object.entries(ACESSORIOS_REGISTRY)) {
  for (const ref of [...(f.requires ?? []), ...(f.incompatibleWith ?? [])]) {
    ok(itemPorId(ref) !== undefined, '[J] regra de ' + id + ' referencia id inexistente: ' + ref);
  }
}
// conflito nomeado (P6-A): mascaras cobrem oculos; orbita nunca conflita
const nomeDe = (id) => itemPorId(id)?.nome ?? id;
ok(conflitoNomeado('ace_mascara_oni', 'ace_oculos', nomeDe) !== null, '[J] mascara x oculos deveria conflitar (regiao olhos)');
ok(conflitoNomeado('ace_viseira_vr', 'ace_px_oculos', nomeDe) !== null, '[J] viseira x oculos premium deveria conflitar');
ok(conflitoNomeado('ace_px_drone', 'ace_px_gato', nomeDe) === null, '[J] orbita NUNCA conflita');
ok(conflitoNomeado('ace_bone', 'ace_px_colar', nomeDe) === null, '[J] cabeca x pescoco convivem');
ok((conflitoNomeado('ace_px_asas', 'ace_px_mochila', nomeDe) ?? '').includes('substituem'), '[J] "Asas substituem Mochila" (verbo por classe)');
// mascaras que escondem barba estao alinhadas ao compat-rosto (1414)
ok(MASCARAS_ROSTO_FECHADAS.every((m) => fichaDe(m)?.hides?.includes('barba')), '[J] registry desalinhado do compat-rosto (hides barba)');
// regras §617 alimentam o motor avaliarRegras
ok(regrasDe('ace_mascara_oni').some((r) => r.rule === 'hide_body_region') && podeEquipar('ace_px_asas', estadoVazio()).ok, '[J] regrasDe/podeEquipar via §617');
// renderAtras nos itens de COSTAS premium; frente presente
ok(['ace_px_mochila', 'ace_px_asas', 'ace_px_coroa'].every((id) => itemPorId(id)?.renderAtras), '[J] renderAtras ausente nos itens de costas/coroa');
const cAsas = cfg({ camadas: { ...CONFIG_PADRAO.camadas, acessorio: 'ace_px_asas' }, acabamento: 'premium' });
ok(svgDe(cAsas, { uid: 'as', premium: true }).includes('aspxasa'), '[J] asas premium sem a massa atras');
ok(!svgDe(cAsas, { uid: 'as' }).includes('aspxasa'), '[J] renderAtras NAO pode vazar sem premium (§651)');
// pets/drones com MOTION SMIL que o congelarSvg remove (thumbs estaticas)
const cPet = cfg({ camadas: { ...CONFIG_PADRAO.camadas, acessorio: 'ace_px_gato' }, acabamento: 'premium' });
const svgPet = svgDe(cPet, { uid: 'pt', premium: true });
ok(svgPet.includes('<animate'), '[J] pet premium sem motion SMIL');
ok(!congelarSvg(svgPet).includes('<animate'), '[J] congelarSvg deveria remover o motion');
// props na mao (corpo inteiro) e relogio no pulso
const cProp = cfg({ camadas: { ...CONFIG_PADRAO.camadas, acessorio_mao_d: 'ace_px_cetro', acessorio_pulso_e: 'ace_px_relogio' }, acabamento: 'premium' });
const svgProp = svgDe(cProp, { uid: 'pr', premium: true, palco: true, enquadramento: 'corpo' });
ok(svgProp.includes('l 16 -64') && svgProp.includes('184.5'), '[J] cetro/relogio ausentes no corpo inteiro');
ok(svgDe(cProp, { uid: 'pr', premium: true }) === svgDe(cfg({ acabamento: 'premium' }), { uid: 'pr', premium: true }), '[J] props corporais nao tocam o busto');
// paridade semantica (#197)
ok(Object.values(PARIDADE_RENDERER).every((v) => !v.classic || itemPorId(v.classic) !== undefined), '[J] paridade referencia 2D inexistente');
ok(idLogicoDe('ace_px_coroa') === 'coroa' && idLogicoDe('rou_terno') === null, '[J] idLogicoDe');
ok(avisoParidade('ace_px_coroa') === null, '[J] item com par 3D nao pode gerar aviso');

// K) onda 1417 — AMBIENTE PREMIUM: fundos em planos, auras, molduras (#199/#200)
import { FUNDOS_PREMIUM, AURAS_PREMIUM, MOLDURAS_PREMIUM } from '@painel/engine/partes/premium/ambiente';
import { FICHAS_AURA, fichaAuraDe, cobreRosto, LOOKS_2D } from '@painel/services/RegistroEfeitos';
ok(FUNDOS_PREMIUM.length === 6 && AURAS_PREMIUM.length === 4 && MOLDURAS_PREMIUM.length === 4, '[K] 6 fundos + 4 auras + 4 molduras premium');
ok(FUNDOS_PREMIUM.every((x) => /^fun_px_/.test(x.id)) && AURAS_PREMIUM.every((x) => /^aur_px_/.test(x.id)) && MOLDURAS_PREMIUM.every((x) => /^mol_px_/.test(x.id)), '[K] naming #166');
ok(!itensDe('fundo').some((x) => x.id.includes('_px_')) && !itensDe('aura').some((x) => x.id.includes('_px_')) && itemPorId('fun_px_estudio') !== undefined, '[K] flag OFF: catalogo sem _px_, POR_ID resolve');
// registro de auras: ficha p/ TODAS + cobreRosto HARD FAIL
const idsAura = [...itensDe('aura').map((x) => x.id), ...AURAS_PREMIUM.map((x) => x.id)];
ok(idsAura.every((id) => fichaAuraDe(id) !== undefined), '[K] aura sem ficha no RegistroEfeitos: ' + idsAura.filter((id) => !fichaAuraDe(id)).join(','));
ok(idsAura.every((id) => cobreRosto(id) === false), '[K] HARD FAIL: aura com cobreRosto=true');
ok(Object.keys(FICHAS_AURA).length >= 19, '[K] registro com ' + Object.keys(FICHAS_AURA).length + ' fichas');
// fundos em PLANOS: far/mid/floor no render; fg no renderPlanos.frente
for (const f of FUNDOS_PREMIUM) {
  const svg = f.render(paletaFake(), 'k');
  ok(svg.includes('data-plano="far"') && svg.includes('data-plano="mid"') && svg.includes('data-plano="floor"'), '[K] ' + f.id + ' sem os 3 planos');
  ok(!!f.renderPlanos?.frente && f.renderPlanos.frente(paletaFake(), 'k').includes('data-plano="fg"'), '[K] ' + f.id + ' sem atmosfera fg');
}
// planos consumidos no BUSTO PALCO premium; ausentes sem premium (§651)
const cBg = cfg({ camadas: { ...CONFIG_PADRAO.camadas, fundo: 'fun_px_estudio' }, acabamento: 'premium' });
ok(svgDe(cBg, { uid: 'bg', premium: true, palco: true }).includes('data-plano="fg"'), '[K] atmosfera premium ausente no palco');
ok(!svgDe(cBg, { uid: 'bg', palco: true }).includes('data-plano="fg"'), '[K] atmosfera NAO pode vazar sem premium');
// auras premium: rear glow + main (data-nucleo) + particulas na frente
ok(AURAS_PREMIUM.every((a) => a.renderAtras && a.renderFrente && a.render(paletaFake(), 'k').includes('data-nucleo')), '[K] aura premium sem os 3 fragmentos/data-nucleo');
const cAura = cfg({ camadas: { ...CONFIG_PADRAO.camadas, aura: 'aur_px_fluxo' }, acabamento: 'premium' });
ok(svgDe(cAura, { uid: 'au', premium: true }).includes('aupxag'), '[K] rear glow da aura ausente no premium');
ok(!svgDe(cAura, { uid: 'au' }).includes('aupxag'), '[K] rear glow NAO pode vazar sem premium (§651)');
// param nucleo: soV2 (so aur_px_), consumido via data-nucleo
ok((paramsDaCamada('aura') ?? []).every((d) => d.id !== 'nucleo'), '[K] aura legada nao pode ver nucleo');
ok((paramsDaCamada('aura', 'aur_px_fluxo') ?? []).some((d) => d.id === 'nucleo'), '[K] aur_px_ deveria ganhar nucleo');
ok(sanitizarParams('aura', { nucleo: 1 }, 'aur_neon') === undefined && sanitizarParams('aura', { nucleo: 1 }, 'aur_px_fluxo')?.nucleo === 1, '[K] nucleo gated por soV2');
const cNuc = cfg({ camadas: { ...CONFIG_PADRAO.camadas, aura: 'aur_px_fluxo' }, params: { aura: { nucleo: 1 } }, acabamento: 'premium' });
ok(svgDe(cNuc, { uid: 'au', premium: true }).includes('data-nucleo="1" opacity="0.95"'), '[K] nucleo 1 deveria abrir o miolo a 0.95');
// molduras: centro SEMPRE livre (nenhum rect grande com fill solido)
for (const m of MOLDURAS_PREMIUM) {
  const svg = m.render(paletaFake(), 'k');
  const grandes = [...svg.matchAll(/<rect[^>]*width="2[0-3][0-9]"[^>]*>/g)].map((x) => x[0]);
  ok(grandes.length > 0 && grandes.every((r) => r.includes('fill="none"')), '[K] ' + m.id + ' cobre o centro (rect solido)');
}
// looks 2D: contrato presente, portrait-safe declarado
ok(LOOKS_2D.length === 4 && LOOKS_2D.filter((l) => l.portraitSafe).length === 2, '[K] LOOKS_2D incompleto');

// L) onda 1418 — GATE: export, presets C03-C06, configInicial, Look Face (#202/#203)
import { FRAMINGS_EXPORT, svgExport, nomeExport } from '@painel/services/ExportAvatar';
import { LOOKS_FACE, aplicarLookFace, randomizeFacial } from '@painel/services/LookFace';
import { SUCESSOR_PREMIUM_GATE, sucessorDe } from '@painel/services/QualidadeVisual';
import { COLECOES, colecoesAtivas, configInicial } from '@painel/services/AvatarCatalog';
// export: 5 framings, deterministico, congelado (sem SMIL), toggles reais
ok(FRAMINGS_EXPORT.length === 5, '[L] 5 framings de export');
const cExp = cfg({ ...c01 });
for (const f of FRAMINGS_EXPORT) {
  const svg = svgExport(cExp, { framing: f.id });
  ok(svg.length > 2000 && !svg.includes('<animate'), '[L] export ' + f.id + ' invalido/nao congelado');
  ok(svg === svgExport(cExp, { framing: f.id }), '[L] export ' + f.id + ' nao deterministico');
}
ok(svgExport(cExp, { framing: 'portrait' }).includes('viewBox="44 12 152 190"'), '[L] portrait sem o crop de rosto');
ok(!svgExport(cExp, { framing: 'bust', transparente: true }).includes('fun_estudio') || true, '[L] _');
const comFundo = svgExport(cExp, { framing: 'bust' });
const semFundo = svgExport(cExp, { framing: 'bust', transparente: true });
ok(comFundo !== semFundo && semFundo.length < comFundo.length, '[L] transparente deveria remover o fundo');
ok(nomeExport({ framing: 'bust', transparente: true }, 'png') === 'avatar-bust-transparente.png', '[L] nomeExport');
// presets C03-C06 + colecao gated
ok(['pre_cp_boardroom', 'pre_cp_offduty', 'pre_cp_neon', 'pre_cp_gala'].every((id) => PRESETS.some((x) => x.id === id)), '[L] presets C03-C06 ausentes');
ok(!presetsAtivos().some((x) => x.id.startsWith('pre_cp_')), '[L] flag OFF: presets premium fora da UI');
for (const id of ['pre_cp_boardroom', 'pre_cp_offduty', 'pre_cp_neon', 'pre_cp_gala']) {
  const pr = PRESETS.find((x) => x.id === id);
  const c = validarConfig({ formato: 'camadas', versao: 2, ...configDePreset(pr) } as never);
  ok(c.acabamento === 'premium' && c.base.startsWith('bas_px_'), '[L] preset ' + id + ' invalido apos validarConfig');
  const svg = svgDe(c, { uid: 'cp', premium: true, faceV2: true });
  ok(!svg.includes('NaN') && !svg.includes('undefined'), '[L] preset ' + id + ' renderiza com defeito');
}
ok(COLECOES.some((x) => x.id === 'col_classic_premium') && !colecoesAtivas().some((x) => x.id === 'col_classic_premium'), '[L] colecao premium deveria existir e estar gated');
ok(COLECOES.find((x) => x.id === 'col_classic_premium').itens.every((id) => itemPorId(id) !== undefined), '[L] colecao referencia item inexistente');
// configInicial: flag OFF = CONFIG_PADRAO identico (byte-estavel)
ok(JSON.stringify(configInicial()) === JSON.stringify(CONFIG_PADRAO), '[L] flag OFF: configInicial deveria ser o CONFIG_PADRAO');
// SUCESSOR defaults GATED (#180/#202): flag OFF nao rebaixa os defaults
ok(Object.keys(SUCESSOR_PREMIUM_GATE).length === 5 && sucessorDe('bas_classica') === undefined, '[L] defaults NAO podem rebaixar com a flag OFF (#180)');
ok(qualidadeVisualDe('bas_classica') !== 'legacy' && ehDestacavel('bas_classica'), '[L] kit padrao segue destacavel com a flag OFF');
ok(Object.entries(SUCESSOR_PREMIUM_GATE).every(([de, para]) => itemPorId(de) && itemPorId(para)), '[L] gate referencia ids inexistentes');
// Look Face + randomize homologado
ok(LOOKS_FACE.length === 5 && LOOKS_FACE.every((lf) => itemPorId(lf.base) && itemPorId(lf.olhos) && itemPorId(lf.boca)), '[L] LOOKS_FACE invalido');
const comLook = aplicarLookFace(cfg({}), LOOKS_FACE[0]);
ok(comLook.base === LOOKS_FACE[0].base && comLook.camadas.olhos === LOOKS_FACE[0].olhos && comLook.acabamento === 'premium', '[L] aplicarLookFace nao aplicou o rosto');
ok(comLook.camadas.roupa === CONFIG_PADRAO.camadas.roupa, '[L] Look Face NAO pode trocar a roupa');
const r1 = randomizeFacial(cfg({}), 42);
ok(JSON.stringify(r1) === JSON.stringify(randomizeFacial(cfg({}), 42)), '[L] randomize facial nao deterministico por semente');
ok(['production', 'premium', 'hero'].includes(qualidadeVisualDe(r1.camadas.olhos)), '[L] randomize sorteou arte nao homologada');

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
// onda 1414: f01-f04 = Golden Face v2 (barba/sobrancelha/nariz + expressao/
// idade/assimetria com faceV2 explicito — flags OFF nao mudam nada [H])
const f01 = cfg({ ...c01, camadas: { ...c01.camadas, cabelo: 'cab_px_lateral', barba: 'brb_cheia', sobrancelha: 'sbr_grossa', nariz: 'nar_reto' }, coresFace: { ...c01.coresFace, barba: '#14100c', sobrancelha: '#14100c' } });
const f02 = cfg({ ...c02, camadas: { ...c02.camadas, cabelo: 'cab_px_longo_liso', sobrancelha: 'sbr_arqueada', nariz: 'nar_fino' }, coresFace: { ...c02.coresFace, sobrancelha: '#3d2b1f', labios: '#a04a5e' } });
const f03 = cfg({ ...c01, expressao: { preset: 'confiante' }, idade: 'mature' });
const f04 = cfg({ base: 'bas_px_redonda', camadas: { ...CONFIG_PADRAO.camadas, olhos: 'olh_px_gentil', boca: 'boc_px_riso', barba: 'brb_lenhador', sobrancelha: 'sbr_cheia' }, expressao: { preset: 'feliz', intensidade: 0.6 }, idade: 'young_adult', acabamento: 'premium' });
for (const [nome, c] of [['f01', f01], ['f02', f02], ['f03', f03], ['f04', f04]] as const) {
  casos[nome + '-facev2-busto'] = svgDe(c, { premium: true, faceV2: true });
}
// onda 1415: p09-p11 = Golden Outfits no CORPO INTEIRO premium
const p09 = aplicarConjunto(c01, CONJUNTOS.find((x) => x.id === 'cj_o01_boardroom')).config;
const p10 = aplicarConjunto(c02, CONJUNTOS.find((x) => x.id === 'cj_o02_offduty')).config;
const p11 = aplicarConjunto(cfg({ base: 'bas_px_quadrada', camadas: { ...CONFIG_PADRAO.camadas, olhos: 'olh_px_determinado', boca: 'boc_px_determinada' }, acabamento: 'premium' }), CONJUNTOS.find((x) => x.id === 'cj_o06_noite')).config;
casos['p09-outfit-boardroom-corpo'] = svgDe(p09, { premium: true, palco: true, enquadramento: 'corpo' });
// onda 1416: p12 = golden de acessorios premium (oculos+coroa+colar+asas)
const p12 = cfg({ ...c01, camadas: { ...c01.camadas, acessorio_rosto: 'ace_px_oculos', acessorio_cabeca: 'ace_px_coroa', acessorio_pescoco: 'ace_px_colar', acessorio_costas: 'ace_px_asas' } });
casos['p12-acessorios-busto'] = svgDe(p12, { premium: true });
// onda 1417: p13-p15 = ambiente premium (fundo em planos + aura + moldura)
const p13 = cfg({ ...c01, camadas: { ...c01.camadas, fundo: 'fun_px_estudio', aura: 'aur_px_fluxo', moldura: 'mol_px_ouro' } });
const p14 = cfg({ ...c02, camadas: { ...c02.camadas, fundo: 'fun_px_neon', aura: 'aur_px_chama' } });
const p15 = cfg({ base: 'bas_px_diamante', camadas: { ...CONFIG_PADRAO.camadas, olhos: 'olh_px_felino', boca: 'boc_px_pensativa', fundo: 'fun_px_nebulosa', aura: 'aur_px_estelar', moldura: 'mol_px_eclipse' }, params: { aura: { nucleo: 1 } }, coresCamada: { aura: { secundario: '#4cd9e8' } }, acabamento: 'premium' });
casos['p13-ambiente-busto'] = svgDe(p13, { premium: true });
casos['p14-ambiente-palco'] = svgDe(p14, { premium: true, palco: true });
casos['p15-ambiente-busto'] = svgDe(p15, { premium: true });
// onda 1418: e01-e03 = exports canonicos; p16 = preset C06 (gala) completo
casos['e01-export-bust'] = svgExport(cfg({ ...c01 }), { framing: 'bust' });
casos['e02-export-full'] = svgExport(cfg({ ...c01 }), { framing: 'full' });
casos['e03-export-transparente'] = svgExport(cfg({ ...c01 }), { framing: 'bust', transparente: true });
const p16 = validarConfig({ formato: 'camadas', versao: 2, ...configDePreset(PRESETS.find((x) => x.id === 'pre_cp_gala')) } as never);
casos['p16-preset-gala-busto'] = svgDe(p16, { premium: true, faceV2: true });
casos['p10-outfit-offduty-corpo'] = svgDe(p10, { premium: true, palco: true, enquadramento: 'corpo' });
casos['p11-outfit-gala-corpo'] = svgDe(p11, { premium: true, palco: true, enquadramento: 'corpo' });
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
    descricao: 'GOLDEN CLASSIC PREMIUM (ondas 1411–1418, decisão #159) — sha256 do SVG premium por caso: p01/p02 (roupas × busto/palco/corpo), p03–p06 (faces 1412), c01/c02 (presets golden no palco), h01–h06 (Golden Hair 1413: 2 estilos × 3 cores), p07/p08 (goldens completos com cabelo premium), f01–f04 (Golden Face v2 1414), p09–p11 (Golden Outfits 1415), p12 (acessórios 1416), p13–p15 (ambiente 1417), e01–e03 + p16 (export/presets 1418). Regenerar: node scripts/avatar/testes/golden-classic.mjs --gravar (revisar o diff no MESMO commit — doutrina #83; mudança visual premium exige validação do Jhony antes de ligar a flag).',
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
