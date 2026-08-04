// scripts/avatar/gerar-manifest.mjs — ASSET MANIFEST unificado (mega 84 · §267).
// @version 1.0.0  @created 2026-08-04
//
// Fonte de verdade DERIVADA e determinística: catálogo 2D (bundlado via
// esbuild, mesmo padrão do nucleo.test) + índice 3D publicado. Sem NOW():
// mesmo repositório → mesmo manifest byte a byte (diff-ável no gate).
// Uso: node scripts/avatar/gerar-manifest.mjs   (da raiz do repo)
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
// public/assets/avatars/* é GITIGNORED (arte vive no servidor) — o
// manifest é artefato de GOVERNANÇA e mora versionado em docs/.
const SAIDA = join(RAIZ, 'docs', 'AVATAR-STUDIO-5', 'manifest-assets.json');

const tmp = mkdtempSync(join(tmpdir(), 'avst-manifest-'));
writeFileSync(join(tmp, 'extrai.ts'), `
import { CATEGORIAS, COLECOES, PARTES, RARIDADES, TITULOS } from '${PAINEL}/src/services/AvatarCatalog';
const saida = {
  categorias: CATEGORIAS.map((c) => c.id),
  raridades: Object.keys(RARIDADES),
  itens: PARTES.map((p) => ({ id: p.id, categoria: p.categoria, raridade: p.raridade }))
    .sort((a, b) => a.id.localeCompare(b.id)),
  titulos: TITULOS.map((t) => t.id).sort(),
  colecoes: COLECOES.map((c) => ({ id: c.id, itens: c.itens.length })),
};
console.log(JSON.stringify(saida));
`);
const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')]
  .find((c) => existsSync(c)) ?? 'esbuild';
execSync(`"${esbuild}" "${join(tmp, 'extrai.ts')}" --bundle --platform=node --format=esm --outfile="${join(tmp, 'extrai.mjs')}"`, { stdio: 'pipe' });
const catalogo2d = JSON.parse(execSync(`node "${join(tmp, 'extrai.mjs')}"`, { encoding: 'utf8' }).trim());
rmSync(tmp, { recursive: true, force: true });

// 3D: índice publicado (derivado da esteira §7) — ausente = lista vazia
let personagens3d = [];
try {
  const idx = JSON.parse(readFileSync(join(RAIZ, 'public/assets/avatars/3d/personagens/index.json'), 'utf8'));
  personagens3d = (idx.personagens ?? idx ?? []).map((p) => ({
    slug: p.slug, animacoes: (p.animacoes ?? []).length,
  })).sort((a, b) => a.slug.localeCompare(b.slug));
} catch { /* publicação parcial */ }

const manifest = {
  formato: 'dshow-avatar-manifest',
  versao: 1,
  // determinismo §267: NADA de timestamp — o git diz quando mudou
  resumo: {
    itens2d: catalogo2d.itens.length,
    categorias: catalogo2d.categorias.length,
    titulos: catalogo2d.titulos.length,
    colecoes: catalogo2d.colecoes.length,
    personagens3d: personagens3d.length,
  },
  ...catalogo2d,
  personagens3d,
};

writeFileSync(SAIDA, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`manifest → ${SAIDA} (${manifest.resumo.itens2d} itens 2D · ${personagens3d.length} personagens 3D)`);
