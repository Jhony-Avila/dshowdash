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

const NOMES_AMIGAVEIS = {
  androide: 'Androide', animal_pug: 'Pug', humano_aventureiro: 'Aventureiro',
  humano_casual: 'Casual', humano_punk: 'Punk', humano_terno: 'Executivo',
  // megas 617-618 (UBC)
  base_superhero_m: 'Herói (UBC)', base_superhero_f: 'Heroína (UBC)',
  // megas 627-628 (partes de cabelo §423 — mesma ferramenta, pasta partes/)
  cab_longo: 'Longo', cab_coque: 'Coque', cab_repartido: 'Repartido',
  cab_raspado: 'Raspado', cab_raspado_f: 'Raspado F', cab_barba: 'Barba',
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
      thumb: `${m.id}/thumb.webp`,
      preview: `${m.id}/preview.webp`,
      animacoes: m.animacoes ?? [],
      triangulos: m.triangulos ?? {},
      ...(m.excecoes ? { excecoes: m.excecoes } : {}),
    });
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
