#!/usr/bin/env node
// assets3d/migrar-manifest-v2.mjs — onda 1406 (MEGA_BRIEFING_01 §2576–§2590,
// decisão #157): carimba manifests §517 publicados com o SCHEMA v2 de forma
// ADITIVA e IDEMPOTENTE — só acrescenta campos ausentes, nunca altera os
// existentes (hashes/LODs/licença intocados; o GLB não muda de bytes).
//   schemaVersion: 2 · qualidadeVisual: 'production' (publicado = gate
//   técnico aprovado; Art Bible §2) · qaVisual: {status:'pending'} ·
//   visibility: 'production' · renderers: ['3d'] · deprecated: false
// Uso: node scripts/avatar/assets3d/migrar-manifest-v2.mjs [--dry-run] [pasta…]
// @version 1.0.0  @created 2026-08-19
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const DRY = process.argv.includes('--dry-run');
const pastas = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const alvos = pastas.length ? pastas : ['public/assets/avatars/3d/personagens', 'public/assets/avatars/3d/partes'];

export function migrarManifestV2(manifest) {
  const m = { ...manifest };
  let mudou = false;
  const porDefeito = {
    schemaVersion: 2,
    qualidadeVisual: 'production',
    qaVisual: { status: 'pending' },
    visibility: 'production',
    renderers: ['3d'],
    deprecated: false,
  };
  for (const [k, v] of Object.entries(porDefeito)) {
    if (m[k] === undefined) { m[k] = v; mudou = true; }
  }
  return { manifest: m, mudou };
}

let total = 0; let alterados = 0;
for (const alvo of alvos) {
  const dir = resolve(RAIZ, alvo);
  if (!existsSync(dir)) continue;
  for (const slug of readdirSync(dir).sort()) {
    const arq = join(dir, slug, 'manifest.json');
    if (!existsSync(arq)) continue;
    total += 1;
    const { manifest, mudou } = migrarManifestV2(JSON.parse(readFileSync(arq, 'utf8')));
    if (!mudou) continue;
    alterados += 1;
    if (!DRY) writeFileSync(arq, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`${DRY ? '[dry-run] ' : ''}v2 → ${alvo}/${slug}`);
  }
}
console.log(`MIGRACAO_V2_OK ${alterados}/${total} manifests ${DRY ? 'seriam ' : ''}carimbados`);
