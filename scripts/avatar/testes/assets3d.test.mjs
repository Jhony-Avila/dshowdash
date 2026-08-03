// testes/assets3d.test.mjs — validador §487 com GLB SINTÉTICO (node puro).
// @version 1.0.0  @created 2026-08-03
// Gera em tmp uma pasta de personagem VÁLIDA (GLB binário mínimo com
// malha + skin) e valida; depois quebra de 4 jeitos e exige a reprovação
// certa em cada um. Zero dependências, zero navegador.
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validarAsset, lerJsonDoGlb, contarTriangulos } from '../assets3d/validar-asset.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

/** Monta um GLB v2 mínimo: N triângulos indexados + skin com os bones dados. */
function glbSintetico({ triangulos = 12, bones = ['Hips', 'Spine', 'HandL'] } = {}) {
  const indices = triangulos * 3;
  const gltf = {
    asset: { version: '2.0' },
    nodes: bones.map((nome) => ({ name: nome })),
    skins: [{ joints: bones.map((_, i) => i) }],
    accessors: [{ count: indices, componentType: 5123, type: 'SCALAR' }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 0, mode: 4 }] }],
  };
  let json = Buffer.from(JSON.stringify(gltf), 'utf8');
  if (json.length % 4) json = Buffer.concat([json, Buffer.alloc(4 - (json.length % 4), 0x20)]);
  const bin = Buffer.alloc(8); // chunk BIN simbólico (o validador só lê o JSON)
  const cab = Buffer.alloc(12);
  cab.writeUInt32LE(0x46546c67, 0); cab.writeUInt32LE(2, 4);
  cab.writeUInt32LE(12 + 8 + json.length + 8 + bin.length, 8);
  const cabJson = Buffer.alloc(8);
  cabJson.writeUInt32LE(json.length, 0); cabJson.writeUInt32LE(0x4e4f534a, 4);
  const cabBin = Buffer.alloc(8);
  cabBin.writeUInt32LE(bin.length, 0); cabBin.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([cab, cabJson, json, cabBin, bin]);
}

const sha = (b) => `sha256:${createHash('sha256').update(b).digest('hex')}`;

/** Escreve uma pasta de personagem completa e devolve o caminho. */
function montarPasta(nome, { glbs, manifestExtra = {} } = {}) {
  const dir = mkdtempSync(join(tmpdir(), `avst3d-${nome}-`));
  const padrao = glbSintetico();
  const porLod = { lod0: padrao, lod1: padrao, lod2: padrao, ...(glbs ?? {}) };
  for (const lod of ['lod0', 'lod1', 'lod2']) writeFileSync(join(dir, `modelo.${lod}.glb`), porLod[lod]);
  writeFileSync(join(dir, 'thumb.webp'), Buffer.from('RIFFxxxxWEBP'));
  writeFileSync(join(dir, 'preview.webp'), Buffer.from('RIFFxxxxWEBP'));
  const manifest = {
    id: 'base_humano_m', tipo: 'personagem_base', versao: 1, rig: 'ubc-v1',
    lods: { lod0: 'modelo.lod0.glb', lod1: 'modelo.lod1.glb', lod2: 'modelo.lod2.glb' },
    hashes: { lod0: sha(porLod.lod0), lod1: sha(porLod.lod1), lod2: sha(porLod.lod2) },
    animacoes: ['idle'],
    licenca: { tipo: 'CC0', fonte: 'quaternius.itch.io', comprovante: 'storage/assets-3d-fonte/ubc-standard-v1/LICENSE.txt' },
    origem: 'ubc-standard-v1', criado_em: '2026-08-03',
    ...manifestExtra,
  };
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return dir;
}

const pastas = [];
try {
  // helpers do GLB funcionam de verdade
  const dirParse = montarPasta('parse');
  pastas.push(dirParse);
  const gltf = lerJsonDoGlb(join(dirParse, 'modelo.lod0.glb'));
  ok(contarTriangulos(gltf) === 12, 'contarTriangulos deveria dar 12 no GLB sintético');

  // 1. caso FELIZ aprova (rig canônico vazio → só aviso)
  const feliz = validarAsset(dirParse, { rigCanonico: [] });
  ok(feliz.aprovado, `caso feliz reprovou: ${feliz.erros.join(' | ')}`);
  ok(feliz.avisos.some((a) => a.includes('canônica')), 'deveria avisar da lista canônica vazia');
  ok(feliz.medidas.bones === 3, `esperava 3 bones (${feliz.medidas.bones})`);

  // 2. hash ERRADO reprova citando §478
  const dirHash = montarPasta('hash');
  pastas.push(dirHash);
  copyFileSync(join(dirHash, 'modelo.lod1.glb'), join(dirHash, 'x.bak'));
  writeFileSync(join(dirHash, 'modelo.lod1.glb'), glbSintetico({ triangulos: 13 }));
  const rHash = validarAsset(dirHash, { rigCanonico: [] });
  ok(!rHash.aprovado && rHash.erros.some((e) => e.includes('lod1') && e.includes('478')),
    `hash corrompido não reprovou certo: ${rHash.erros.join(' | ')}`);

  // 3. triângulos ACIMA do gate §631 reprova (lod2 > 8k)
  const estourado = glbSintetico({ triangulos: 9000 });
  const dirTri = montarPasta('tri', { glbs: { lod2: estourado } });
  pastas.push(dirTri);
  const rTri = validarAsset(dirTri, { rigCanonico: [] });
  ok(!rTri.aprovado && rTri.erros.some((e) => e.includes('lod2') && e.includes('631')),
    `gate de triângulos não pegou: ${rTri.erros.join(' | ')}`);
  ok(rTri.medidas.triangulos.lod2 === 9000, 'medida de triângulos do lod2 errada');

  // 4. arquivo OBRIGATÓRIO faltando reprova
  const dirSem = montarPasta('sem');
  pastas.push(dirSem);
  rmSync(join(dirSem, 'preview.webp'));
  const rSem = validarAsset(dirSem, { rigCanonico: [] });
  ok(!rSem.aprovado && rSem.erros.some((e) => e.includes('preview.webp')),
    `arquivo faltando não reprovou: ${rSem.erros.join(' | ')}`);

  // 5. bone com ESPAÇO reprova citando §436; e lista canônica exige presença
  const comEspaco = glbSintetico({ bones: ['Hips', 'Wrist R'] });
  const dirBone = montarPasta('bone', { glbs: { lod0: comEspaco } });
  pastas.push(dirBone);
  const rBone = validarAsset(dirBone, { rigCanonico: [] });
  ok(!rBone.aprovado && rBone.erros.some((e) => e.includes('Wrist R') && e.includes('436')),
    `bone com espaço não reprovou: ${rBone.erros.join(' | ')}`);
  const rCanon = validarAsset(dirParse, { rigCanonico: ['Hips', 'Spine', 'HandL', 'HandR'] });
  ok(!rCanon.aprovado && rCanon.erros.some((e) => e.includes('HandR')),
    'lista canônica preenchida deveria exigir o bone ausente');
} finally {
  for (const p of pastas) rmSync(p, { recursive: true, force: true });
}

console.log(`[assets3d] FALHAS: ${falhas.length ? falhas.join(' || ') : 'nenhuma'}`);
process.exit(falhas.length ? 1 : 0);
