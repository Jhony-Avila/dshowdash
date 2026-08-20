#!/usr/bin/env node
// assets3d/gerar-indice-3d.mjs — ÍNDICE dos personagens publicados (mega 9).
// @version 1.0.0  @created 2026-08-03
//
// Varre public/assets/avatars/3d/personagens/*/manifest.json e gera o
// index.json que a UI consome (slug, nome amigável, thumb, animações,
// exceções §631). Roda após qualquer publicação — o índice é DERIVADO,
// nunca editado à mão. Determinístico (ordem alfabética por slug).
//
// Uso: node scripts/avatar/assets3d/gerar-indice-3d.mjs [pasta-personagens]
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { validarAsset } from './validar-asset.mjs';

// onda 1410 (MEGA_BRIEFING_01 §2735–§2742): HEALTH SCORE por asset (0–100),
// derivado e determinístico — consumo SÓ pelo QaStudio/tooling (campo extra
// no index.json; o runtime ignora campos desconhecidos). Penalidades:
// erro do validador −40 cada · ressalva −10 · nota (LODs etc.) −5 ·
// qaVisual rejected −50 / rework −30 / pending −10 · deprecated −20.
export function healthDe(pasta, manifest) {
  let score = 100;
  try {
    const r = validarAsset(pasta, { rigCanonico: undefined });
    score -= 40 * r.erros.length + 10 * r.avisos.length + 5 * (r.notas?.length ?? 0);
  } catch { score -= 60; }
  const qa = manifest.qaVisual?.status ?? null;
  if (qa === 'rejected') score -= 50; else if (qa === 'rework') score -= 30; else if (qa === 'pending') score -= 10;
  if (manifest.deprecated) score -= 20;
  return Math.max(0, Math.min(100, score));
}

const NOMES_AMIGAVEIS = {
  androide: 'Androide', animal_pug: 'Pug', humano_aventureiro: 'Aventureiro',
  humano_casual: 'Casual', humano_punk: 'Punk', humano_terno: 'Executivo',
  // megas 617-618 (UBC)
  base_superhero_m: 'Herói (UBC)', base_superhero_f: 'Heroína (UBC)',
  // megas 627-628 (partes de cabelo §423 — mesma ferramenta, pasta partes/)
  cab_longo: 'Longo', cab_coque: 'Coque', cab_repartido: 'Repartido',
  cab_raspado: 'Raspado', cab_raspado_f: 'Raspado F', cab_barba: 'Barba',
  // megas 631-633 (roupas §415-§417 — nomes por peça)
  rou3d_ranger_m_corpo: 'Ranger M · corpo', rou3d_ranger_m_bracos: 'Ranger M · braços',
  rou3d_ranger_m_pernas: 'Ranger M · pernas', rou3d_ranger_m_botas: 'Ranger M · botas',
  rou3d_ranger_m_capuz: 'Ranger M · capuz', rou3d_ranger_m_ombreira: 'Ranger M · ombreira',
  rou3d_ranger_f_corpo: 'Ranger F · corpo', rou3d_ranger_f_bracos: 'Ranger F · braços',
  rou3d_ranger_f_pernas: 'Ranger F · pernas', rou3d_ranger_f_botas: 'Ranger F · botas',
  rou3d_ranger_f_capuz: 'Ranger F · capuz', rou3d_ranger_f_ombreira: 'Ranger F · ombreira',
  rou3d_peasant_m_corpo: 'Camponês M · corpo', rou3d_peasant_m_bracos: 'Camponês M · braços',
  rou3d_peasant_m_pernas: 'Camponês M · pernas', rou3d_peasant_m_botas: 'Camponês M · pés',
  rou3d_peasant_f_corpo: 'Camponesa F · corpo', rou3d_peasant_f_bracos: 'Camponesa F · braços',
  rou3d_peasant_f_pernas: 'Camponesa F · pernas', rou3d_peasant_f_botas: 'Camponesa F · pés',
};

export function gerarIndice3d(pastaPersonagens) {
  const dir = resolve(pastaPersonagens);
  const personagens = [];
  for (const slug of readdirSync(dir).sort()) {
    const arq = join(dir, slug, 'manifest.json');
    if (!existsSync(arq)) continue;
    const m = JSON.parse(readFileSync(arq, 'utf8'));
    personagens.push({
      slug: m.id,
      nome: NOMES_AMIGAVEIS[m.id] ?? m.id,
      tipo: m.tipo,
      rig: m.rig,
      // §423 (lote 651-660): família de complexidade declarada no manifest
      ...(m.familia ? { familia: m.familia } : {}),
      // onda 1406 (MEGA_BRIEFING_01 §68–§69/§2759–§2764, #157): qualidade
      // visual, visibilidade e sucessor PROPAGADOS do manifest v2 — o front
      // filtra destaque/canary sem abrir cada manifest
      ...(m.qualidadeVisual ? { qualidadeVisual: m.qualidadeVisual } : {}),
      ...(m.visibility ? { visibility: m.visibility } : {}),
      ...(m.deprecated ? { deprecated: true } : {}),
      ...(m.successorId ? { successorId: m.successorId } : {}),
      thumb: `${m.id}/thumb.webp`,
      preview: `${m.id}/preview.webp`,
      animacoes: m.animacoes ?? [],
      triangulos: m.triangulos ?? {},
      ...(m.excecoes ? { excecoes: m.excecoes } : {}),
      // onda 1410 (§2735): health 0–100 (QaStudio/tooling; runtime ignora)
      health: healthDe(join(dir, slug), m),
    });
  }
  // onda 1406 (§2585): ID duplicado entre pastas = FAIL (nunca índice ambíguo)
  const vistos = new Set();
  for (const p of personagens) {
    if (vistos.has(p.slug)) throw new Error(`ID duplicado no índice: ${p.slug} (§2585 — dois manifests com o mesmo id)`);
    vistos.add(p.slug);
  }
  const indice = { versao: 1, gerado_por: 'gerar-indice-3d.mjs', personagens };
  writeFileSync(join(dir, 'index.json'), `${JSON.stringify(indice, null, 2)}\n`);
  return indice;
}

if (process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]))) {
  const pasta = process.argv[2] ?? 'public/assets/avatars/3d/personagens';
  const r = gerarIndice3d(pasta);
  console.log(`INDICE_OK ${pasta}/index.json · ${r.personagens.length} personagem(ns)`);
}
