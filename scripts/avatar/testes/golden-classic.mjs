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
import { CONFIG_PADRAO, itensDe, itemPorId, svgDe, validarConfig } from '@painel/services/AvatarCatalog';
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

// D) goldens p01-p02 (2 configs x busto/palco/corpo = 6 casos)
const p01 = cfg({ camadas: { ...CONFIG_PADRAO.camadas, roupa: 'rou_px_terno' }, acabamento: 'premium', cores: { ...CONFIG_PADRAO.cores, destaque: '#c9a75a' } });
const p02 = cfg({ base: 'bas_redonda', camadas: { ...CONFIG_PADRAO.camadas, roupa: 'rou_px_jaqueta', cabelo: 'cab_ondulado' }, acabamento: 'premium', cores: { ...CONFIG_PADRAO.cores, cabelo: '#d9b166', roupa: '#7a2d3c' } });
const casos: Record<string, string> = {};
for (const [nome, c] of [['p01', p01], ['p02', p02]] as const) {
  casos[nome + '-busto'] = svgDe(c, { premium: true });
  casos[nome + '-palco'] = svgDe(c, { premium: true, palco: true });
  casos[nome + '-corpo'] = svgDe(c, { premium: true, palco: true, enquadramento: 'corpo' });
}
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
    descricao: 'GOLDEN CLASSIC PREMIUM (onda 1411, decisão #159) — sha256 do SVG premium por caso p01/p02 × busto/palco/corpo. Regenerar: node scripts/avatar/testes/golden-classic.mjs --gravar (revisar o diff no MESMO commit — doutrina #83; mudança visual premium exige validação do Jhony antes de ligar a flag).',
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
