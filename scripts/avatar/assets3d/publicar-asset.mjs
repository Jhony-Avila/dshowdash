#!/usr/bin/env node
// assets3d/publicar-asset.mjs — PUBLICADOR de asset 3D (AS5 F5 · passos
// 2–4 do pipeline docs/AVATAR-STUDIO-5/pipeline-assets-3d.md).
// @version 1.0.0  @created 2026-08-03
//
// Entrada: UM GLB fonte (do storage/assets-3d-fonte, nunca editado lá) +
// metadados. Saída: a pasta do personagem COMPLETA no padrão do contrato:
//   modelo.lod0.glb  ← fonte OTIMIZADA (dedup+prune, sem perda visual)
//   modelo.lod1.glb  ← simplificação meshopt (alvo ≤ gate §631: 25k tri)
//   modelo.lod2.glb  ← simplificação agressiva (alvo ≤ 8k tri)
//   manifest.json    ← §517 com hashes sha256 (§478), licença §511,
//                      triângulos medidos e proveniência
// thumb/preview ficam com gerar-thumbs-3d.mjs (§508) — passo seguinte.
// No FIM, roda o validador §487 na pasta: o pipeline valida a si mesmo.
//
// Uso:
//   node scripts/avatar/assets3d/publicar-asset.mjs \
//     --fonte storage/assets-3d-fonte/ubc-standard-v1/extraido/X.glb \
//     --saida public/assets/avatars/3d/personagens/base_humano_m \
//     --id base_humano_m [--tipo personagem_base] [--rig ubc-v1] \
//     [--origem ubc-standard-v1] [--licenca CC0] \
//     [--comprovante storage/assets-3d-fonte/ubc-standard-v1/LICENSE.txt] \
//     [--animacoes idle,walk] [--data AAAA-MM-DD] [--sem-validar]
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { compactPrimitive, dedup, prune, simplify, textureCompress, weld } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import { validarAsset } from './validar-asset.mjs';

const LIMITES = { lod1: 25_000, lod2: 8_000 }; // gate §631 (lod0 só confere)
const MARGEM = 0.9; // alvo = 90% do limite (folga p/ variação do simplify)
// megas 611-613 (§631 texturas): fontes UBC vêm em 4096px — cada LOD
// redimensiona pro seu teto e converte pra WebP (EXT_texture_webp; o
// GLTFLoader do three decodifica nativo). Sem isto o GLB embutiria
// ~12MB de PNG e estouraria a política de "poucos MB" versionados.
const TEXTURA_MAX = { lod0: 2048, lod1: 1024, lod2: 512 };

/** Redimensiona/converte TODAS as texturas do doc pro teto do LOD. */
async function ajustarTexturas(doc, lod, log) {
  const teto = TEXTURA_MAX[lod];
  await doc.transform(textureCompress({
    encoder: sharp,
    targetFormat: 'webp',
    quality: 82,
    effort: 4,
    resize: [teto, teto], // "contain": só ENCOLHE o que passa do teto
  }));
  log?.(`${lod}: texturas → webp ≤ ${teto}px`);
}

function argumento(nome, padrao) {
  const i = process.argv.indexOf(`--${nome}`);
  return i > -1 ? process.argv[i + 1] : padrao;
}

function sha256De(caminho) {
  return `sha256:${createHash('sha256').update(readFileSync(caminho)).digest('hex')}`;
}

/** Triângulos TRIANGLES de um Document gltf-transform. */
function triangulosDe(doc) {
  let total = 0;
  for (const malha of doc.getRoot().listMeshes()) {
    for (const prim of malha.listPrimitives()) {
      if (prim.getMode() !== 4) continue;
      const idx = prim.getIndices();
      total += Math.floor((idx ? idx.getCount() : (prim.getAttribute('POSITION')?.getCount() ?? 0)) / 3);
    }
  }
  return total;
}

/** Publica e devolve { pasta, manifest, medidas }. Exportado p/ o teste. */
export async function publicarAsset(opcoes) {
  const {
    fonte, saida, id,
    tipo = 'personagem_base',
    rig = 'ubc-v1',
    origem = 'ubc-standard-v1',
    licencaTipo = 'CC0',
    comprovante = 'storage/assets-3d-fonte/ubc-standard-v1/LICENSE.txt',
    animacoes = null, // null = EXTRAIR do GLB (mega 9); lista = override
    mascara = null, // megas 631-633 (§415.2): regiões do corpo que a parte oculta
    familia = null, // lote 651-660 (§423): família de complexidade; cabelo/barba sem valor = economico
    data = null,
    validar = true,
    log = (m) => console.log(m),
  } = opcoes;
  if (!fonte || !saida || !id) throw new Error('obrigatórios: fonte, saida, id');
  if (!/^[a-z0-9_]+$/.test(id)) throw new Error(`id "${id}" fora do snake_case ASCII`);

  // extensões registradas (fontes AS4 usam EXT_meshopt_compression); a
  // SAÍDA é sempre GLB PLANO — o palco carrega sem decoder (§423 universal)
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
  await Promise.all([MeshoptSimplifier.ready, MeshoptDecoder.ready, MeshoptEncoder.ready]);
  const semCompressao = (doc) => {
    for (const ext of doc.getRoot().listExtensionsUsed()) {
      if (ext.extensionName === 'EXT_meshopt_compression') ext.dispose();
    }
    return doc;
  };
  const pasta = resolve(saida);
  mkdirSync(pasta, { recursive: true });

  // lod0: fonte otimizada SEM perda de malha (dedup + poda de órfãos);
  // texturas entram no teto §631 do lod0 (2048px, webp) — megas 611-613
  const lod0 = semCompressao(await io.read(resolve(fonte)));
  await lod0.transform(dedup(), prune());
  await ajustarTexturas(lod0, 'lod0', log);
  const tri0 = triangulosDe(lod0);
  await io.write(join(pasta, 'modelo.lod0.glb'), lod0);
  log(`lod0: ${tri0} triângulos (otimizado, sem perda de malha)`);

  // lod1/lod2: simplificação meshopt até caber no gate §631 (com margem)
  const medidas = { lod0: tri0 };
  const excecoes = {};
  for (const [lod, limite] of Object.entries(LIMITES)) {
    const doc = semCompressao(await io.read(resolve(fonte)));
    await doc.transform(dedup(), prune());
    const antes = triangulosDe(doc);
    const alvo = Math.min(limite * MARGEM, antes);
    // §631: erro cresce em PASSADAS até caber no gate — qualidade primeiro,
    // mas o limite é INEGOCIÁVEL (lição mega 8: aventureiro lod2 travou em
    // 10062 com erro fixo 0.01 e passou despercebido até o registro)
    const errosPassada = [0.01, 0.04, 0.1, 0.25];
    if (antes > alvo) {
      // ratio do simplify é POR PRIMITIVA — usa a proporção global do alvo
      await doc.transform(weld()); // funde vértices ANTES (o simplify rende mais)
      for (const erroAlvo of errosPassada) {
        await doc.transform(
          simplify({
            simplifier: MeshoptSimplifier,
            ratio: alvo / triangulosDe(doc),
            error: erroAlvo,
            lockBorder: erroAlvo <= 0.04, // costura protegida enquanto dá
          }),
        );
        if (triangulosDe(doc) <= limite) break;
      }
      await doc.transform(prune());
      const resultado = triangulosDe(doc);
      if (resultado > limite) {
        // fonte resiste (flat-shaded): exceção AUDITÁVEL até o teto absoluto
        const teto = { lod1: 30_000, lod2: 12_000 }[lod];
        const reducao = ((antes - resultado) / antes) * 100;
        if (resultado <= teto && reducao < 8) {
          excecoes[lod] = `fonte resiste a simplify (flat-shaded; ${antes}→${resultado}, ${reducao.toFixed(1)}%) — aceito até o teto absoluto ${teto}`;
          log(`⚠ ${lod}: ${resultado} acima do gate ${limite} — EXCEÇÃO declarada no manifest (teto ${teto})`);
        } else {
          throw new Error(`${lod} não coube no gate §631 nem com simplificação agressiva (${resultado} > ${limite}) — reveja a fonte`);
        }
      }
      // compactPrimitive: descarta a FAIXA de vértices que o simplify
      // deixou sem referência (prune só remove acessores inteiros) —
      // sem isto o lod1 sai MAIOR em bytes que o lod0
      for (const malha of doc.getRoot().listMeshes()) {
        for (const prim of malha.listPrimitives()) compactPrimitive(prim);
      }
      await doc.transform(dedup()); // re-compartilha acessores idênticos entre primitivas
    }
    await ajustarTexturas(doc, lod, log); // megas 611-613 (§631 texturas)
    const depois = triangulosDe(doc);
    medidas[lod] = depois;
    await io.write(join(pasta, `modelo.${lod}.glb`), doc);
    log(`${lod}: ${antes} → ${depois} triângulos (limite §631: ${limite})`);
  }

  // animações REAIS do GLB (mega 9) — nada de hardcode: o manifest lista
  // exatamente os clipes embutidos (a UI monta o seletor daqui)
  const clipesReais = (lod0.getRoot().listAnimations() ?? []).map((an) => an.getName()).filter(Boolean);
  const animacoesFinal = animacoes ?? (clipesReais.length ? clipesReais : []);

  // manifest §517 (hashes calculados dos ARQUIVOS finais — §478)
  // §423: cabelo/barba SEMPRE declaram família (padrão: econômico — hair
  // cards rígidos dos packs CC0); outras categorias só se pedida
  const familiaFinal = familia ?? (tipo === 'parte_cabelo' || tipo === 'parte_barba' ? 'economico' : null);
  const manifest = {
    id, tipo, versao: 1, rig,
    ...(familiaFinal ? { familia: familiaFinal } : {}),
    lods: { lod0: 'modelo.lod0.glb', lod1: 'modelo.lod1.glb', lod2: 'modelo.lod2.glb' },
    hashes: {
      lod0: sha256De(join(pasta, 'modelo.lod0.glb')),
      lod1: sha256De(join(pasta, 'modelo.lod1.glb')),
      lod2: sha256De(join(pasta, 'modelo.lod2.glb')),
    },
    triangulos: medidas,
    ...(Object.keys(excecoes).length ? { excecoes } : {}),
    animacoes: animacoesFinal,
    ...(Array.isArray(mascara) && mascara.length ? { mascara } : {}), // §415.2
    licenca: { tipo: licencaTipo, fonte: origem, comprovante },
    origem,
    fonte_original: basename(String(fonte)),
    ...(data ? { criado_em: data } : {}),
  };
  writeFileSync(join(pasta, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  log(`manifest.json escrito (${manifest.hashes.lod0.slice(0, 18)}…)`);

  // valida a si mesmo (§487) — thumbs entram no passo seguinte, então
  // aqui aceitamos a ausência SÓ deles quando pedido
  if (validar) {
    const r = validarAsset(pasta);
    const errosReais = r.erros.filter((e) => !e.includes('thumb.webp') && !e.includes('preview.webp'));
    if (errosReais.length) {
      throw new Error(`publicação REPROVADA pelo validador §487:\n  ${errosReais.join('\n  ')}`);
    }
    log(`validador §487: aprovado (pendem thumbs §508${r.avisos.length ? ` · avisos: ${r.avisos.length}` : ''})`);
  }
  return { pasta, manifest, medidas };
}

// ── CLI ─────────────────────────────────────────────────────────────
if (process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]))) {
  const fonte = argumento('fonte');
  const saida = argumento('saida');
  const id = argumento('id');
  if (!fonte || !saida || !id) {
    console.error('uso: publicar-asset.mjs --fonte <glb> --saida <pasta> --id <slug> [--tipo --rig --origem --licenca --comprovante --animacoes a,b --data AAAA-MM-DD --sem-validar]');
    process.exit(2);
  }
  publicarAsset({
    fonte, saida, id,
    tipo: argumento('tipo', 'personagem_base'),
    rig: argumento('rig', 'ubc-v1'),
    origem: argumento('origem', 'ubc-standard-v1'),
    licencaTipo: argumento('licenca', 'CC0'),
    comprovante: argumento('comprovante', 'storage/assets-3d-fonte/ubc-standard-v1/LICENSE.txt'),
    animacoes: process.argv.includes('--animacoes')
      ? argumento('animacoes', '').split(',').map((s) => s.trim()).filter(Boolean)
      : null, // default: extrair do GLB
    mascara: process.argv.includes('--mascara')
      ? argumento('mascara', '').split(',').map((s) => s.trim()).filter(Boolean)
      : null, // megas 631-633 (§415.2)
    familia: argumento('familia', null), // lote 651-660 (§423)
    data: argumento('data', null),
    validar: !process.argv.includes('--sem-validar'),
  }).then(({ pasta, medidas }) => {
    console.log(`PUBLICADO em ${pasta} · triângulos ${JSON.stringify(medidas)}`);
    console.log('próximo passo: gerar-thumbs-3d.mjs (§508) e gerar-registro-sql.mjs (§614)');
  }).catch((e) => { console.error(`✗ ${e.message}`); process.exit(1); });
}
