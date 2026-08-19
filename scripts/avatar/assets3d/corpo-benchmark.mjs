#!/usr/bin/env node
// assets3d/corpo-benchmark.mjs — onda 1409 (MEGA_BRIEFING_01 §1749–§1755,
// §2637–§2650; ART-BIBLE §6 proporções): CORPO-BENCHMARK das bases
// (personagem_base) — renders clay/silhueta (front/profile) + LANDMARKS
// geométricos do rig (altura, largura de ombros, cabeças na altura, pelvis,
// mãos, pés) comparados às FAIXAS de referência por estilo. Saída
// determinística (geometria; PNGs ficam fora do git): evidencias/corpo-benchmark.json.
// Uso (da raiz): node scripts/avatar/assets3d/corpo-benchmark.mjs [--json] [--so <id>]
// @version 1.0.0  @created 2026-08-19
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { gerarRendersHomologacao } from './gerar-renders-homologacao.mjs';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const ASSETS3D = join(RAIZ, 'public', 'assets', 'avatars', '3d');
const DESTINO = join(RAIZ, 'docs', 'AVATAR-STUDIO-5', 'evidencias', 'corpo-benchmark.json');

/** Faixas de referência (ART-BIBLE §6 / §1749–§1755): o estilo do asset
 *  (manifest.estilo ou heurística do id) escolhe a faixa. Tudo em
 *  PROPORÇÕES (adimensional) — escala absoluta é só informativa. */
// Calibração inicial 1409 (medida = distância entre os bones upperarm/
// clavicle, MENOR que a largura visual de ombros; "cabeças" usa o bone Head
// na BASE do crânio — por isso as faixas são mais largas que o cânone de
// desenho; refinar após validação visual do Jhony — ART-BIBLE §6).
export const FAIXAS = {
  realista: { cabecasNaAltura: [7.0, 9.0], ombrosSobreAltura: [0.16, 0.30], alturaM: [1.55, 2.05] },
  estilizado: { cabecasNaAltura: [4.5, 7.5], ombrosSobreAltura: [0.14, 0.34], alturaM: [1.2, 2.2] },
  cartoon: { cabecasNaAltura: [2.5, 5.0], ombrosSobreAltura: [0.12, 0.40], alturaM: [0.8, 2.2] },
  criatura: { cabecasNaAltura: [1.5, 9], ombrosSobreAltura: [0.1, 0.6], alturaM: [0.3, 3] },
  robo: { cabecasNaAltura: [2.0, 7], ombrosSobreAltura: [0.1, 0.6], alturaM: [0.5, 6] },
};

export function estiloDe(manifest) {
  if (manifest.estilo && FAIXAS[manifest.estilo]) return manifest.estilo;
  const id = String(manifest.id);
  if (/^(animal|criatura|pet)_/.test(id)) return 'criatura';
  if (/^base_superhero/.test(id)) return 'realista';   // UBC: proporções reais
  if (/^humano_/.test(id)) return 'estilizado';         // Quaternius low-poly: 5–7 cabeças
  if (/^androide|robo/.test(id)) return 'robo';          // RobotExpressive: 4,8 m de altura nativa (§487 escala — informativo)
  return 'estilizado';
}

export function avaliar(landmarks, estilo) {
  const f = FAIXAS[estilo];
  const desvios = [];
  const dentro = (k, v, [a, b]) => { if (v === null || v === undefined) return; if (v < a || v > b) desvios.push(`${k}=${v} fora de [${a}, ${b}] (${estilo})`); };
  const ombrosSobreAltura = landmarks.larguraOmbros && landmarks.altura ? +(landmarks.larguraOmbros / landmarks.altura).toFixed(3) : null;
  dentro('cabecasNaAltura', landmarks.cabecasNaAltura, f.cabecasNaAltura);
  dentro('ombrosSobreAltura', ombrosSobreAltura, f.ombrosSobreAltura);
  dentro('alturaM', landmarks.altura, f.alturaM);
  return { estilo, ombrosSobreAltura, desvios, dentroDaFaixa: desvios.length === 0 };
}

export async function benchmark({ so = null, porta = 8914 } = {}) {
  const dir = join(ASSETS3D, 'personagens');
  const bases = [];
  for (const d of readdirSync(dir, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const mf = join(dir, d.name, 'manifest.json');
    if (!existsSync(mf)) continue;
    const m = JSON.parse(readFileSync(mf, 'utf8'));
    if (m.tipo !== 'personagem_base') continue;
    if (so && m.id !== so) continue;
    bases.push({ pasta: join(dir, d.name), manifest: m });
  }
  const resultados = [];
  for (const b of bases) {
    const saida = join(RAIZ, 'scripts', 'avatar', 'testes', 'saida', 'corpo-benchmark', b.manifest.id);
    const r = await gerarRendersHomologacao(b.pasta, { angulos: ['front', 'profile'], modos: ['clay', 'silhueta'], lods: [0], saida, porta, gravarPng: true });
    const lm = r.metricas.landmarks ?? {};
    const estilo = estiloDe(b.manifest);
    resultados.push({ id: b.manifest.id, rig: b.manifest.rig ?? null, qualidadeVisual: b.manifest.qualidadeVisual ?? null, ...avaliar(lm, estilo), landmarks: lm, renders: r.arquivos.map((a) => a.replace(RAIZ + '/', '')) });
  }
  resultados.sort((a, b) => a.id.localeCompare(b.id));
  return {
    gerado_por: 'scripts/avatar/assets3d/corpo-benchmark.mjs', faixas: FAIXAS,
    resumo: { total: resultados.length, dentroDaFaixa: resultados.filter((r) => r.dentroDaFaixa).length, foraDaFaixa: resultados.filter((r) => !r.dentroDaFaixa).map((r) => `${r.id}: ${r.desvios.join('; ')}`) },
    bases: resultados.map(({ renders, ...resto }) => resto), // PNGs fora do JSON (caminhos variam por máquina)
  };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const args = process.argv.slice(2);
  const so = args.includes('--so') ? args[args.indexOf('--so') + 1] : null;
  const rel = await benchmark({ so });
  if (!so) { mkdirSync(join(DESTINO, '..'), { recursive: true }); writeFileSync(DESTINO, `${JSON.stringify(rel, null, 2)}\n`); }
  if (args.includes('--json')) { console.log(JSON.stringify(rel)); process.exit(0); }
  console.log(`CORPO-BENCHMARK: ${rel.resumo.total} bases · ${rel.resumo.dentroDaFaixa} dentro da faixa`);
  for (const b of rel.bases) console.log(`  ${b.dentroDaFaixa ? '✓' : '△'} ${b.id} [${b.estilo}] cabeças ${b.landmarks.cabecasNaAltura ?? '—'} · ombros/altura ${b.ombrosSobreAltura ?? '—'} · altura ${b.landmarks.altura ?? '—'} m${b.desvios.length ? ` — ${b.desvios.join('; ')}` : ''}`);
  if (!so) console.log('→ docs/AVATAR-STUDIO-5/evidencias/corpo-benchmark.json');
}
