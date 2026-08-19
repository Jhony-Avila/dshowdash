// scripts/avatar/inventario-visual.mjs — onda 1405 (MEGA_BRIEFING_01 §15,
// §61–§63, §159–§162, §1224, §2284.1): INVENTÁRIO do catálogo visual
// (2D: ParteDef por categoria/tema/raridade/slot; 3D: personagens e partes
// publicados com LODs/triângulos/família) em JSON determinístico.
//
// Ferramenta de desenvolvimento (doutrina #83): o resultado é baked em
// docs/AVATAR-STUDIO-5/evidencias/inventario-visual.json e revisado no
// diff; a classificação KEEP/UPGRADE/REPLACE/DEV_ONLY/DEPRECATE por
// FAMÍLIA vive em docs/AVATAR-STUDIO-5/inventario-visual.md (curadoria).
//
// Uso (da raiz do repo):  node scripts/avatar/inventario-visual.mjs [--json]
// @version 1.0.0  @created 2026-08-19
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const ASSETS3D = join(RAIZ, 'public', 'assets', 'avatars', '3d');
const SO_JSON = process.argv.includes('--json');

// 1) catálogo 2D via bundle Node-puro ----------------------------------
const tmp = mkdtempSync(join(tmpdir(), 'avst-inv-'));
writeFileSync(join(tmp, 'entrada.ts'), `
import { PARTES, CATEGORIAS, PRESETS, COLECOES } from '${PAINEL}/src/services/AvatarCatalog';
import { SUBCATEGORIA_POR_ASSET } from '${PAINEL}/src/workspace/acessorios';
import { FOCO_ITEM_ASSET } from '${PAINEL}/src/components/modoItem';
const itens = PARTES.map((p: any) => ({
  id: p.id, categoria: p.categoria, nome: p.nome, tema: p.tema ?? null, raridade: p.raridade ?? 'comum',
  slot: p.slot ?? null, subcategoria: SUBCATEGORIA_POR_ASSET[p.id] ?? null,
  usaCores: p.usaCores ?? null, renderCorpo: !!p.renderCorpo, atras: !!p.atras,
  focoMedido: !!FOCO_ITEM_ASSET[p.id],
}));
console.log(JSON.stringify({ categorias: CATEGORIAS.map((c: any) => c.id), itens, presets: PRESETS.length, colecoes: COLECOES.length }));
`);
execSync(
  `npx esbuild ${join(tmp, 'entrada.ts')} --bundle --platform=node --format=esm --outfile=${join(tmp, 'entrada.mjs')} --log-level=silent`,
  { cwd: RAIZ, stdio: ['ignore', 'inherit', 'inherit'] },
);
const cat2d = JSON.parse(execSync(`node ${join(tmp, 'entrada.mjs')}`, { cwd: RAIZ }).toString());
rmSync(tmp, { recursive: true, force: true });

const porCategoria = {};
for (const it of cat2d.itens) {
  const c = (porCategoria[it.categoria] ??= { total: 0, temas: {}, raridades: {}, slots: {}, subcategorias: {}, renderCorpo: 0, atras: 0, semFoco: [] });
  c.total += 1;
  if (it.tema) c.temas[it.tema] = (c.temas[it.tema] ?? 0) + 1;
  c.raridades[it.raridade] = (c.raridades[it.raridade] ?? 0) + 1;
  if (it.slot) c.slots[it.slot] = (c.slots[it.slot] ?? 0) + 1;
  if (it.subcategoria) c.subcategorias[it.subcategoria] = (c.subcategorias[it.subcategoria] ?? 0) + 1;
  if (it.renderCorpo) c.renderCorpo += 1;
  if (it.atras) c.atras += 1;
  if (it.categoria === 'acessorio' && !it.focoMedido) c.semFoco.push(it.id);
}
for (const c of Object.values(porCategoria)) {
  for (const k of ['temas', 'raridades', 'slots', 'subcategorias']) c[k] = Object.fromEntries(Object.entries(c[k]).sort());
  c.semFoco.sort();
}

// 2) assets 3D publicados -----------------------------------------------
function lerManifests(pasta) {
  const dir = join(ASSETS3D, pasta);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => {
    const m = JSON.parse(readFileSync(join(dir, d.name, 'manifest.json'), 'utf8'));
    const tri = m.triangulos ?? {};
    return {
      id: m.id, tipo: m.tipo, rig: m.rig ?? null, familia: m.familia ?? null, versao: m.versao,
      triangulos: tri, lodsIdenticos: tri.lod0 !== undefined && tri.lod0 === tri.lod1 && tri.lod1 === tri.lod2,
      lod1IgualLod0: tri.lod0 !== undefined && tri.lod0 === tri.lod1,
      licenca: m.licenca?.tipo ?? null, origem: m.origem ?? null, mascara: m.mascara ?? null,
      qualidadeVisual: m.qualidadeVisual ?? null, schemaVersion: m.schemaVersion ?? 1,
    };
  }).sort((a, b) => a.id.localeCompare(b.id));
}
const personagens = lerManifests('personagens');
const partes = lerManifests('partes');

const inventario = {
  gerado_por: 'scripts/avatar/inventario-visual.mjs',
  catalogo2d: {
    total: cat2d.itens.length, categorias: cat2d.categorias, presets: cat2d.presets, colecoes: cat2d.colecoes,
    porCategoria,
  },
  assets3d: {
    personagens: { total: personagens.length, itens: personagens },
    partes: { total: partes.length, itens: partes },
    lodsIdenticos: [...personagens, ...partes].filter((a) => a.lodsIdenticos).map((a) => a.id),
    lod1IgualLod0: [...personagens, ...partes].filter((a) => a.lod1IgualLod0 && !a.lodsIdenticos).map((a) => a.id),
    semQualidadeVisual: [...personagens, ...partes].filter((a) => !a.qualidadeVisual).length,
  },
};

const destino = join(RAIZ, 'docs', 'AVATAR-STUDIO-5', 'evidencias');
mkdirSync(destino, { recursive: true });
writeFileSync(join(destino, 'inventario-visual.json'), JSON.stringify(inventario, null, 2) + '\n');

if (SO_JSON) { console.log(JSON.stringify(inventario)); process.exit(0); }
console.log(`Catálogo 2D: ${inventario.catalogo2d.total} itens em ${cat2d.categorias.length} categorias · ${cat2d.presets} presets · ${cat2d.colecoes} coleções`);
for (const [c, v] of Object.entries(porCategoria)) console.log(`  ${c.padEnd(14)} ${String(v.total).padStart(3)}  raridades=${JSON.stringify(v.raridades)}${v.renderCorpo ? ` renderCorpo=${v.renderCorpo}` : ''}`);
console.log(`Assets 3D: ${personagens.length} personagens · ${partes.length} partes`);
console.log(`  LODs idênticos (lod0=lod1=lod2): ${inventario.assets3d.lodsIdenticos.join(', ') || 'nenhum'}`);
console.log(`  lod1 = lod0: ${inventario.assets3d.lod1IgualLod0.join(', ') || 'nenhum'}`);
console.log(`  sem qualidadeVisual no manifest: ${inventario.assets3d.semQualidadeVisual}`);
console.log(`→ ${join('docs', 'AVATAR-STUDIO-5', 'evidencias', 'inventario-visual.json')}`);
