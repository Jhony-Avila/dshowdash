#!/usr/bin/env node
// assets3d/gerar-evidencias.mjs — onda 1410 (MEGA_BRIEFING_01 §2663–§2674;
// VISUAL-QA.md §6–§7): EVIDÊNCIAS padronizadas de QA por asset — renders de
// homologação (ângulos/modos POR CATEGORIA) gravados FORA do público em
// storage/visual-qa/<id>/evidencias/ (gitignored) e anexados à ficha.
// A matriz por categoria segue o checklist §6: base = 4 ângulos + clay/
// silhueta; cabelo/barba = silhueta+clay+backlight (34); roupa = 4 ângulos;
// acessório = front/34 close.
// Uso: node scripts/avatar/assets3d/gerar-evidencias.mjs <pasta-publicada> [--porta N]
// @version 1.0.0  @created 2026-08-20
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { gerarRendersHomologacao } from './gerar-renders-homologacao.mjs';
import { DIR_FICHAS, criarFicha } from './ficha-qa.mjs';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');

/** Matriz de evidências por tipo (VISUAL-QA §6). */
export const MATRIZ = {
  personagem_base: { angulos: ['front', '34', 'profile', 'back'], modos: ['normal', 'clay', 'silhueta'], lods: [0, 2] },
  parte_cabelo: { angulos: ['front', '34', 'back'], modos: ['normal', 'clay', 'silhueta'], lods: [0, 2] },
  parte_barba: { angulos: ['front', '34'], modos: ['normal', 'clay', 'silhueta'], lods: [0] },
  parte_roupa: { angulos: ['front', '34', 'profile', 'back'], modos: ['normal', 'clay'], lods: [0, 2] },
  parte_acessorio: { angulos: ['front', '34'], modos: ['normal', 'clay'], lods: [0] },
  cenario: { angulos: ['front', '34'], modos: ['normal'], lods: [0] },
};

export async function gerarEvidencias(pasta, { porta = 8917 } = {}) {
  const dir = resolve(pasta);
  const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
  const m = MATRIZ[manifest.tipo] ?? MATRIZ.parte_acessorio;
  const destino = join(DIR_FICHAS, manifest.id, 'evidencias');
  mkdirSync(destino, { recursive: true });
  const tmp = join(RAIZ, 'scripts', 'avatar', 'testes', 'saida', 'evidencias', manifest.id);
  const r = await gerarRendersHomologacao(dir, { ...m, gravarPng: true, saida: tmp, porta });
  const arquivos = [];
  for (const a of r.arquivos) {
    const nome = `${manifest.id}_v${manifest.versao ?? 1}_${basename(a)}`;
    copyFileSync(a, join(destino, nome));
    arquivos.push(nome);
  }
  copyFileSync(join(r.destino, 'metricas.json'), join(destino, `${manifest.id}_v${manifest.versao ?? 1}_metricas.json`));
  // anexa à ficha (cria pending se não houver)
  const { arquivo } = criarFicha(dir);
  const ficha = JSON.parse(readFileSync(arquivo, 'utf8'));
  ficha.evidencias = [...new Set([...ficha.evidencias, ...arquivos])];
  writeFileSync(arquivo, `${JSON.stringify(ficha, null, 2)}\n`);
  return { destino, arquivos, metricas: r.metricas, ficha: arquivo };
}

if (process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]))) {
  const pasta = process.argv[2];
  if (!pasta) { console.error('uso: gerar-evidencias.mjs <pasta-publicada> [--porta N]'); process.exit(2); }
  const porta = Number(process.argv[process.argv.indexOf('--porta') + 1]) || 8917;
  gerarEvidencias(pasta, { porta })
    .then((r) => console.log(`EVIDENCIAS_OK ${r.arquivos.length} em ${r.destino} (ficha atualizada)`))
    .catch((e) => { console.error(`✗ ${e.message}`); process.exit(1); });
}
