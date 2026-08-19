#!/usr/bin/env node
// assets3d/auditar-lods.mjs — onda 1409 (MEGA_BRIEFING_01 §96, §148–§151,
// §271–§276, §2625–§2636; decisão #165b): AUDITORIA DE LODs dos assets 3D
// publicados — triângulos/bytes/hash por LOD, LODs IDÊNTICOS (lod0=lod1=lod2
// ou lod1=lod0), razão de redução, e (opcional, --silhueta) IoU da silhueta
// LOD0×LOD2 via gerar-renders-homologacao. Saída determinística em
// docs/AVATAR-STUDIO-5/evidencias/lods-3d.json (o diff é o relatório).
// A REPUBLICAÇÃO com decimação real muda hashes/manifests (★ ok do Jhony) —
// este script só mede e classifica; o validador (1409) avisa LODs iguais em
// `production` e reprova em `premium+`.
// Uso (da raiz): node scripts/avatar/assets3d/auditar-lods.mjs [--silhueta] [--json]
// @version 1.0.0  @created 2026-08-19
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const ASSETS3D = join(RAIZ, 'public', 'assets', 'avatars', '3d');
const SO_JSON = process.argv.includes('--json');
const COM_SILHUETA = process.argv.includes('--silhueta');
export const IOU_MINIMO = 0.92; // §2636

export function auditarPasta(dir, manifest) {
  const lods = {};
  for (const lod of ['lod0', 'lod1', 'lod2']) {
    const arq = join(dir, manifest.lods?.[lod] ?? `modelo.${lod}.glb`);
    if (!existsSync(arq)) { lods[lod] = null; continue; }
    const buf = readFileSync(arq);
    lods[lod] = { bytes: buf.length, sha256: createHash('sha256').update(buf).digest('hex').slice(0, 16), triangulos: manifest.triangulos?.[lod] ?? null };
  }
  const t0 = lods.lod0?.triangulos ?? 0; const t1 = lods.lod1?.triangulos ?? 0; const t2 = lods.lod2?.triangulos ?? 0;
  // classe por GEOMETRIA (triângulos): os bytes podem diferir só pelas
  // texturas redimensionadas por LOD (publicador) — isso NÃO é decimação
  const identicos = t0 > 0 && t0 === t1 && t1 === t2;
  const lod1IgualLod0 = t0 > 0 && t0 === t1 && t2 < t1;
  const lod2IgualLod1 = t0 > 0 && t1 < t0 && t1 === t2;
  const classe = identicos ? 'identicos' : lod1IgualLod0 ? 'lod1=lod0' : lod2IgualLod1 ? 'lod2=lod1' : 'decrescente';
  const bytesIguais = !!(lods.lod0 && lods.lod1 && lods.lod2 && lods.lod0.sha256 === lods.lod1.sha256 && lods.lod1.sha256 === lods.lod2.sha256);
  return {
    id: manifest.id, tipo: manifest.tipo, qualidadeVisual: manifest.qualidadeVisual ?? null,
    lods, classe, bytesIguais,
    reducao: { lod1: t0 ? +(t1 / t0).toFixed(3) : null, lod2: t0 ? +(t2 / t0).toFixed(3) : null },
    excecaoDeclarada: manifest.excecoes?.lod ?? manifest.excecoes?.lods ?? null,
  };
}

export function auditarTudo() {
  const assets = [];
  for (const pasta of ['personagens', 'partes']) {
    const dir = join(ASSETS3D, pasta);
    if (!existsSync(dir)) continue;
    for (const d of readdirSync(dir, { withFileTypes: true })) {
      if (!d.isDirectory()) continue;
      const m = JSON.parse(readFileSync(join(dir, d.name, 'manifest.json'), 'utf8'));
      assets.push({ pasta, ...auditarPasta(join(dir, d.name), m) });
    }
  }
  assets.sort((a, b) => a.id.localeCompare(b.id));
  const porClasse = assets.reduce((acc, a) => { acc[a.classe] = (acc[a.classe] ?? 0) + 1; return acc; }, {});
  return {
    gerado_por: 'scripts/avatar/assets3d/auditar-lods.mjs',
    resumo: {
      total: assets.length, porClasse,
      identicos: assets.filter((a) => a.classe === 'identicos').map((a) => a.id),
      lod1IgualLod0: assets.filter((a) => a.classe === 'lod1=lod0').map((a) => a.id),
      comDecimacaoReal: assets.filter((a) => a.classe === 'decrescente').map((a) => a.id),
      bytesTotais: assets.reduce((n, a) => n + ['lod0', 'lod1', 'lod2'].reduce((m, l) => m + (a.lods[l]?.bytes ?? 0), 0), 0),
      bytesRedundantes: assets.reduce((n, a) => n + (a.classe === 'identicos' ? (a.lods.lod1?.bytes ?? 0) + (a.lods.lod2?.bytes ?? 0) : a.classe === 'lod1=lod0' ? (a.lods.lod1?.bytes ?? 0) : 0), 0),
      iouMinimo: IOU_MINIMO,
    },
    assets,
  };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const rel = auditarTudo();
  if (COM_SILHUETA) {
    const { gerarRendersHomologacao } = await import('./gerar-renders-homologacao.mjs');
    for (const a of rel.assets) {
      if (a.classe !== 'decrescente' && a.classe !== 'lod2=lod1' && a.classe !== 'lod1=lod0') continue; // idênticos = IoU 1 por definição
      try {
        const r = await gerarRendersHomologacao(join(ASSETS3D, a.pasta, a.id), { angulos: ['front', '34'], modos: ['silhueta'], lods: [0, 2], gravarPng: false, saida: join(RAIZ, 'scripts', 'avatar', 'testes', 'saida', 'lods', a.id), porta: 8912 });
        a.iouLod2 = r.metricas.lods.lod2 ? Math.min(r.metricas.lods.lod2.iou_front ?? 1, r.metricas.lods.lod2.iou_34 ?? 1) : null;
        a.silhuetaOk = a.iouLod2 === null ? null : a.iouLod2 >= IOU_MINIMO;
      } catch (e) { a.iouLod2 = null; a.silhuetaErro = String(e.message).slice(0, 120); }
    }
  }
  const destino = join(RAIZ, 'docs', 'AVATAR-STUDIO-5', 'evidencias');
  mkdirSync(destino, { recursive: true });
  writeFileSync(join(destino, 'lods-3d.json'), `${JSON.stringify(rel, null, 2)}\n`);
  if (SO_JSON) { console.log(JSON.stringify(rel)); process.exit(0); }
  console.log(`LODs: ${rel.resumo.total} assets · ${JSON.stringify(rel.resumo.porClasse)} · bytes redundantes ${(rel.resumo.bytesRedundantes / 1024 / 1024).toFixed(1)} MB de ${(rel.resumo.bytesTotais / 1024 / 1024).toFixed(1)} MB`);
  console.log(`  idênticos (${rel.resumo.identicos.length}): ${rel.resumo.identicos.join(', ')}`);
  console.log(`  lod1=lod0 (${rel.resumo.lod1IgualLod0.length}): ${rel.resumo.lod1IgualLod0.join(', ')}`);
  console.log(`  decimação real (${rel.resumo.comDecimacaoReal.length}): ${rel.resumo.comDecimacaoReal.join(', ') || 'nenhum'}`);
  if (COM_SILHUETA) for (const a of rel.assets.filter((x) => x.iouLod2 !== undefined)) console.log(`  silhueta ${a.id}: IoU lod2 ${a.iouLod2} ${a.silhuetaOk === false ? '✗' : '✓'}`);
  console.log('→ docs/AVATAR-STUDIO-5/evidencias/lods-3d.json');
}
