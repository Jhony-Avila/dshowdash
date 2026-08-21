#!/usr/bin/env node
// avatar/orcamento-2d.mjs — onda 1411 (MEGA_BRIEFING_01 §2498–§2510;
// PERFORMANCE-BUDGETS.md §5; decisão #159): ORÇAMENTO DO AVATAR 2D —
// mede bytes / nós / filtros / gradientes do SVG renderizado para um
// conjunto canônico de configs (clássico e premium, busto e corpo) e
// compara com os tetos: busto ≤ 40 KB, ≤ 600 nós, ≤ 4 filtros; corpo
// ≤ 80 KB. Teto duro do sanitizer continua sendo SvgSanitizer MAX_BYTES
// (300 KB) — este script é o gate FINO do trilho premium.
// Saída determinística: docs/AVATAR-STUDIO-5/evidencias/orcamento-2d.json
// (o diff é o relatório). Acima do teto: aviso em item clássico (nunca
// reprovação retroativa), ERRO em item premium (`_px_`/acabamento).
// Uso (da raiz): node scripts/avatar/orcamento-2d.mjs [--json]
// @version 1.1.0  @created 2026-08-20  @updated 2026-08-21 (ondas 1413–1417)
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const DESTINO = join(RAIZ, 'docs', 'AVATAR-STUDIO-5', 'evidencias', 'orcamento-2d.json');
export const TETOS = { bustoBytes: 40 * 1024, bustoNos: 600, bustoFiltros: 4, corpoBytes: 80 * 1024 };
const tmp = mkdtempSync(join(tmpdir(), 'orc2d-'));

writeFileSync(join(tmp, 'prova.ts'), `
import { CONFIG_PADRAO, itensDe, itemPorId, svgDe, validarConfig } from '@painel/services/AvatarCatalog';
import type { AvatarConfig } from '@painel/domain/types';
const cfg = (extra: Partial<AvatarConfig>): AvatarConfig => validarConfig({ ...CONFIG_PADRAO, ...extra });
const medir = (svg: string) => ({
  bytes: svg.length,
  nos: (svg.match(/</g) ?? []).length,
  filtros: (svg.match(/<filter/g) ?? []).length,
  gradientes: (svg.match(/<linearGradient|<radialGradient/g) ?? []).length,
});
// casos canônicos: padrão + roupa mais pesada do catálogo + cada premium
const casos: Record<string, { premium: boolean; corpo: boolean; m: ReturnType<typeof medir> }> = {};
casos['classico-padrao-busto'] = { premium: false, corpo: false, m: medir(svgDe(cfg({}), { uid: 'orc' })) };
casos['classico-padrao-corpo'] = { premium: false, corpo: true, m: medir(svgDe(cfg({}), { uid: 'orc', palco: true, enquadramento: 'corpo' })) };
// TODAS as roupas (clássicas E premium) no busto — a peça mais pesada manda
// onda 1415: as 8 rou_px_ novas entram pela lista do próprio módulo
import { ROUPAS_PREMIUM_1415, SOBREPECAS_PREMIUM, ROUPAS_INFERIORES, CALCADOS_PREMIUM } from '@painel/engine/partes/premium/vestuario';
const todas = [...new Set([...itensDe('roupa').map((x) => x.id), 'rou_px_terno', 'rou_px_jaqueta', ...ROUPAS_PREMIUM_1415.map((x) => x.id)])];
for (const id of todas) {
  const ehPremium = itemPorId(id)?.acabamento === 'premium';
  const c = cfg({ camadas: { ...CONFIG_PADRAO.camadas, roupa: id }, ...(ehPremium ? { acabamento: 'premium' as const } : {}) });
  casos['roupa-' + id] = { premium: ehPremium, corpo: false, m: medir(svgDe(c, { uid: 'orc', ...(ehPremium ? { premium: true } : {}) })) };
}
casos['premium-p01-corpo'] = { premium: true, corpo: true, m: medir(svgDe(cfg({ camadas: { ...CONFIG_PADRAO.camadas, roupa: 'rou_px_terno' }, acabamento: 'premium' }), { uid: 'orc', premium: true, palco: true, enquadramento: 'corpo' })) };
// onda 1412: goldens de ROSTO premium (base+olhos+boca _px_ + coresFace)
casos['premium-golden-m-busto'] = { premium: true, corpo: false, m: medir(svgDe(cfg({ base: 'bas_px_angular', camadas: { ...CONFIG_PADRAO.camadas, olhos: 'olh_px_confiante', boca: 'boc_px_sorriso', roupa: 'rou_px_terno' }, coresFace: { iris: '#4a3626' }, acabamento: 'premium' }), { uid: 'orc', premium: true })) };
casos['premium-golden-f-busto'] = { premium: true, corpo: false, m: medir(svgDe(cfg({ base: 'bas_px_coracao', camadas: { ...CONFIG_PADRAO.camadas, olhos: 'olh_px_amendoado', boca: 'boc_px_suave', roupa: 'rou_px_jaqueta' }, coresFace: { iris: '#2f5d43' }, acabamento: 'premium' }), { uid: 'orc', premium: true })) };
// onda 1413: TODOS os cabelos premium no busto + o mais pesado no corpo
import { CABELOS_PREMIUM } from '@painel/engine/partes/premium/cabelos';
for (const cab of CABELOS_PREMIUM.map((x) => x.id)) {
  const c = cfg({ base: 'bas_px_oval' as any, camadas: { ...CONFIG_PADRAO.camadas, cabelo: cab }, acabamento: 'premium' as const });
  casos['cabelo-' + cab] = { premium: true, corpo: false, m: medir(svgDe(c, { uid: 'orc', premium: true })) };
}
casos['premium-golden-f-cabelo-corpo'] = { premium: true, corpo: true, m: medir(svgDe(cfg({ base: 'bas_px_coracao', camadas: { ...CONFIG_PADRAO.camadas, cabelo: 'cab_px_longo_liso', olhos: 'olh_px_amendoado', boca: 'boc_px_suave', roupa: 'rou_px_jaqueta' }, coresFace: { iris: '#2f5d43' }, acabamento: 'premium' }), { uid: 'orc', premium: true, palco: true, enquadramento: 'corpo' })) };
// onda 1414: categorias faciais novas — cada barba/sobrancelha/nariz no
// busto golden com faceV2 (o recorte fino e o orcamento valem para elas)
import { BARBAS_PREMIUM, SOBRANCELHAS_PREMIUM, NARIZES_PREMIUM } from '@painel/engine/partes/premium/rosto';
for (const [cat, lista] of [['barba', BARBAS_PREMIUM], ['sobrancelha', SOBRANCELHAS_PREMIUM], ['nariz', NARIZES_PREMIUM]] as const) {
  for (const item of lista) {
    const c = cfg({ base: 'bas_px_oval' as any, camadas: { ...CONFIG_PADRAO.camadas, [cat]: item.id }, acabamento: 'premium' as const });
    casos[cat + '-' + item.id] = { premium: true, corpo: false, m: medir(svgDe(c, { uid: 'orc', premium: true, faceV2: true })) };
  }
}
casos['premium-face-v2-completa'] = { premium: true, corpo: false, m: medir(svgDe(cfg({ base: 'bas_px_redonda', camadas: { ...CONFIG_PADRAO.camadas, olhos: 'olh_px_gentil', boca: 'boc_px_riso', cabelo: 'cab_px_lateral', barba: 'brb_lenhador', sobrancelha: 'sbr_cheia', nariz: 'nar_forte' }, coresFace: { iris: '#3a6ea8', barba: '#14100c' }, expressao: { preset: 'feliz' }, idade: 'mature', acabamento: 'premium' }), { uid: 'orc', premium: true, faceV2: true })) };
// onda 1415: outfit completo no CORPO INTEIRO (pior caso do vestuário) +
// sobrepeças premium no busto
for (const it of SOBREPECAS_PREMIUM) {
  const c = cfg({ camadas: { ...CONFIG_PADRAO.camadas, roupa_sobre: it.id }, acabamento: 'premium' as const });
  casos['sobrepeca-' + it.id] = { premium: true, corpo: false, m: medir(svgDe(c, { uid: 'orc', premium: true })) };
}
casos['premium-outfit-corpo'] = { premium: true, corpo: true, m: medir(svgDe(cfg({ base: 'bas_px_quadrada', camadas: { ...CONFIG_PADRAO.camadas, roupa: 'rou_px_blazer', roupa_sobre: 'sob_px_capa', roupa_inferior: 'rin_jeans', acessorio_pes: 'ace_px_bota', cabelo: 'cab_px_lateral', barba: 'brb_cheia', olhos: 'olh_px_determinado', boca: 'boc_px_determinada' }, acabamento: 'premium' }), { uid: 'orc', premium: true, faceV2: true, palco: true, enquadramento: 'corpo' })) };
// onda 1416: acessorios premium — cada um no busto golden (asas/mochila com
// renderAtras contam no peso do busto premium)
import { ACESSORIOS_PREMIUM } from '@painel/engine/partes/premium/acessorios';
for (const item of ACESSORIOS_PREMIUM) {
  const chave = 'acessorio_' + (item.slot ?? 'cabeca');
  const c = cfg({ camadas: { ...CONFIG_PADRAO.camadas, [chave]: item.id }, acabamento: 'premium' as const });
  casos['acess-' + item.id] = { premium: true, corpo: false, m: medir(svgDe(c, { uid: 'orc', premium: true })) };
}
// onda 1417: ambiente premium — fundos (palco, com atmosfera), auras e
// molduras no busto
import { FUNDOS_PREMIUM, AURAS_PREMIUM, MOLDURAS_PREMIUM } from '@painel/engine/partes/premium/ambiente';
for (const [cat, lista] of [['fundo', FUNDOS_PREMIUM], ['aura', AURAS_PREMIUM], ['moldura', MOLDURAS_PREMIUM]] as const) {
  for (const item of lista) {
    const c = cfg({ camadas: { ...CONFIG_PADRAO.camadas, [cat]: item.id }, acabamento: 'premium' as const });
    casos[cat + '-' + item.id] = { premium: true, corpo: false, m: medir(svgDe(c, { uid: 'orc', premium: true, ...(cat === 'fundo' ? { palco: true } : {}) })) };
  }
}
console.log(JSON.stringify(casos));
`);

const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')]
  .find((c) => existsSync(c)) ?? 'esbuild';
execSync(`"${esbuild}" "${join(tmp, 'prova.ts')}" --bundle --format=esm --platform=node --alias:@painel="${join(PAINEL, 'src')}" --outfile="${join(tmp, 'prova.mjs')}"`, { stdio: ['ignore', 'ignore', 'inherit'] });
const casos = JSON.parse(execSync(`node "${join(tmp, 'prova.mjs')}"`, { encoding: 'utf8' }).trim().split('\n').pop());
rmSync(tmp, { recursive: true, force: true });

const avisos = [];
const erros = [];
for (const [id, c] of Object.entries(casos)) {
  const tetoB = c.corpo ? TETOS.corpoBytes : TETOS.bustoBytes;
  const problemas = [];
  if (c.m.bytes > tetoB) problemas.push(`${c.m.bytes} B > ${tetoB}`);
  if (!c.corpo && c.m.nos > TETOS.bustoNos) problemas.push(`${c.m.nos} nós > ${TETOS.bustoNos}`);
  if (!c.corpo && c.m.filtros > TETOS.bustoFiltros) problemas.push(`${c.m.filtros} filtros > ${TETOS.bustoFiltros}`);
  if (problemas.length) (c.premium ? erros : avisos).push(`${id}: ${problemas.join(' · ')}`);
}
const rel = {
  gerado_por: 'scripts/avatar/orcamento-2d.mjs', tetos: TETOS,
  resumo: { casos: Object.keys(casos).length, erros, avisos },
  casos: Object.fromEntries(Object.entries(casos).map(([k, v]) => [k, v.m])),
};
mkdirSync(join(DESTINO, '..'), { recursive: true });
writeFileSync(DESTINO, `${JSON.stringify(rel, null, 2)}\n`);
if (process.argv.includes('--json')) { console.log(JSON.stringify(rel)); process.exit(erros.length ? 1 : 0); }
console.log(`ORCAMENTO-2D: ${rel.resumo.casos} casos · erros(premium) ${erros.length} · avisos(clássico) ${avisos.length}`);
for (const e of erros) console.log(`  ✗ ${e}`);
for (const a of avisos) console.log(`  △ ${a}`);
console.log('→ docs/AVATAR-STUDIO-5/evidencias/orcamento-2d.json');
process.exit(erros.length ? 1 : 0);
