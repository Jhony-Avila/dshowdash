// scripts/deploy/smoke-dist.mjs — SMOKE pós-build (lote 151 · §605/§312).
// @version 1.0.0  @created 2026-08-04
//
// Valida o dist RECÉM-BUILDADO antes do deploy declarar vitória:
// manifest do vite existe, todo chunk referenciado existe em disco com
// tamanho > 0, o entry css existe. Roda no servidor (passo do deploy) e
// localmente. Saída: SMOKE_DIST_OK ou exit 1 com a lista do que faltou.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const RAIZ = resolve(process.env.DEPLOY_RAIZ ?? resolve(import.meta.dirname, '..', '..'));
const PAINEIS = [
  'public/components/panels/panel-avatar-studio',
  'public/components/panels/panel-dashboard',
];

const falhas = [];
for (const painel of PAINEIS) {
  const dist = join(RAIZ, painel, 'dist');
  const manifesto = join(dist, '.vite', 'manifest.json');
  if (!existsSync(manifesto)) { falhas.push(`${painel}: manifest do vite ausente`); continue; }
  let mapa;
  try { mapa = JSON.parse(readFileSync(manifesto, 'utf8')); } catch { falhas.push(`${painel}: manifest ilegível`); continue; }
  const arquivos = new Set();
  for (const entrada of Object.values(mapa)) {
    if (entrada && typeof entrada === 'object' && entrada.file) arquivos.add(entrada.file);
    for (const css of entrada?.css ?? []) arquivos.add(css);
  }
  if (arquivos.size === 0) { falhas.push(`${painel}: manifest vazio`); continue; }
  for (const arq of arquivos) {
    const caminho = join(dist, arq);
    if (!existsSync(caminho)) { falhas.push(`${painel}: ${arq} referenciado mas AUSENTE`); continue; }
    if (statSync(caminho).size === 0) falhas.push(`${painel}: ${arq} com 0 bytes`);
  }
}

if (falhas.length) {
  console.error(`SMOKE_DIST_FALHOU:\n - ${falhas.join('\n - ')}`);
  process.exit(1);
}
console.log('SMOKE_DIST_OK');
