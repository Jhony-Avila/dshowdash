// scripts/avatar/qa-visual/relatorio.mjs — onda 1406 (MEGA_BRIEFING_01 §157,
// §3035–§3040, decisão #157): KPIs de QUALIDADE VISUAL a partir dos dados
// (QualidadeVisual.ts p/ o catálogo 2D + manifests v2 p/ o 3D) →
// docs/AVATAR-STUDIO-5/evidencias/kpi-visual.json (determinístico; o diff
// no git é o burn-down da dívida visual §3039).
//   Premium Coverage % (KPI principal §3037) · cobertura por nível Q0–Q4
//   por categoria/tipo · Visual QA status · Quality Coverage Matrix §3035.
// Uso (da raiz): node scripts/avatar/qa-visual/relatorio.mjs [--json]
// @version 1.0.0  @created 2026-08-19
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const ASSETS3D = join(RAIZ, 'public', 'assets', 'avatars', '3d');
const SO_JSON = process.argv.includes('--json');
const NIVEIS = ['prototype', 'legacy', 'production', 'premium', 'hero'];

// 1) 2D via bundle Node-puro ---------------------------------------------
const tmp = mkdtempSync(join(tmpdir(), 'avst-kpi-'));
writeFileSync(join(tmp, 'entrada.ts'), `
import { PARTES } from '${PAINEL}/src/services/AvatarCatalog';
import { ITENS_SOCKET } from '${PAINEL}/src/poc3d/catalogo3d';
import { fichaQualidadeDe, ehDestacavel } from '${PAINEL}/src/services/QualidadeVisual';
const itens = PARTES.map((p: any) => ({ id: p.id, categoria: p.categoria, ...fichaQualidadeDe(p.id), destacavel: ehDestacavel(p.id) }));
const poc = ITENS_SOCKET.map((i: any) => ({ id: i.id, categoria: 'soc3d', ...fichaQualidadeDe(i.id), destacavel: ehDestacavel(i.id) }));
console.log(JSON.stringify({ itens, poc }));
`);
execSync(`npx esbuild ${join(tmp, 'entrada.ts')} --bundle --platform=node --format=esm --outfile=${join(tmp, 'entrada.mjs')} --log-level=silent`,
  { cwd: RAIZ, stdio: ['ignore', 'inherit', 'inherit'] });
const { itens, poc } = JSON.parse(execSync(`node ${join(tmp, 'entrada.mjs')}`, { cwd: RAIZ }).toString());
rmSync(tmp, { recursive: true, force: true });

function matriz(lista) {
  const m = Object.fromEntries(NIVEIS.map((n) => [n, 0]));
  const qa = {};
  for (const it of lista) { m[it.qualidadeVisual] += 1; qa[it.statusQaVisual] = (qa[it.statusQaVisual] ?? 0) + 1; }
  const total = lista.length;
  return {
    total, ...m,
    premiumCoveragePct: total ? Math.round(((m.premium + m.hero) / total) * 1000) / 10 : 0,
    productionReadyPct: total ? Math.round(((m.production + m.premium + m.hero) / total) * 1000) / 10 : 0,
    qaAprovadoPct: total ? Math.round((((qa.approved ?? 0) + (qa.approved_with_notes ?? 0)) / total) * 1000) / 10 : 0,
    qa: Object.fromEntries(Object.entries(qa).sort()),
  };
}
const porCategoria = {};
for (const it of itens) (porCategoria[it.categoria] ??= []).push(it);
const kpi2d = {
  geral: matriz(itens),
  porCategoria: Object.fromEntries(Object.keys(porCategoria).sort().map((c) => [c, matriz(porCategoria[c])])),
  naoDestacaveis: itens.filter((i) => !i.destacavel).map((i) => i.id).sort(),
};

// 2) 3D via manifests v2 ----------------------------------------------------
function manifests(pasta) {
  const dir = join(ASSETS3D, pasta);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => {
    const m = JSON.parse(readFileSync(join(dir, d.name, 'manifest.json'), 'utf8'));
    return { id: m.id, tipo: m.tipo, qualidadeVisual: m.qualidadeVisual ?? 'legacy', statusQaVisual: m.qaVisual?.status ?? 'pending', visibility: m.visibility ?? 'production' };
  }).sort((a, b) => a.id.localeCompare(b.id));
}
const m3d = [...manifests('personagens'), ...manifests('partes')];
const porTipo = {};
for (const a of m3d) (porTipo[a.tipo] ??= []).push(a);
const kpi3d = {
  geral: matriz(m3d),
  porTipo: Object.fromEntries(Object.keys(porTipo).sort().map((t) => [t, matriz(porTipo[t])])),
  placeholdersPoc: matriz(poc),
};

const relatorio = {
  gerado_por: 'scripts/avatar/qa-visual/relatorio.mjs',
  artBibleVersion: '1.0',
  kpiPrincipal: { nome: 'Premium Coverage %', catalogo2d: kpi2d.geral.premiumCoveragePct, assets3d: kpi3d.geral.premiumCoveragePct },
  catalogo2d: kpi2d,
  assets3d: kpi3d,
  visualDebt: {
    // §158/§3039: dívida = itens ainda não premium/hero, por área (burn-down no diff)
    catalogo2d: Object.fromEntries(Object.entries(kpi2d.porCategoria).map(([c, m]) => [c, m.total - m.premium - m.hero])),
    assets3d: Object.fromEntries(Object.entries(kpi3d.porTipo).map(([t, m]) => [t, m.total - m.premium - m.hero])),
  },
};
const destino = join(RAIZ, 'docs', 'AVATAR-STUDIO-5', 'evidencias');
mkdirSync(destino, { recursive: true });
writeFileSync(join(destino, 'kpi-visual.json'), `${JSON.stringify(relatorio, null, 2)}\n`);
if (SO_JSON) { console.log(JSON.stringify(relatorio)); process.exit(0); }
console.log(`KPI Premium Coverage: 2D ${kpi2d.geral.premiumCoveragePct}% · 3D ${kpi3d.geral.premiumCoveragePct}% · production-ready 2D ${kpi2d.geral.productionReadyPct}% / 3D ${kpi3d.geral.productionReadyPct}% · QA aprovado 2D ${kpi2d.geral.qaAprovadoPct}% / 3D ${kpi3d.geral.qaAprovadoPct}%`);
console.log(`2D: ${JSON.stringify(kpi2d.geral)}`);
console.log(`3D: ${JSON.stringify(kpi3d.geral)} · PoC prototypes: ${kpi3d.placeholdersPoc.prototype}/${kpi3d.placeholdersPoc.total}`);
console.log('→ docs/AVATAR-STUDIO-5/evidencias/kpi-visual.json');
