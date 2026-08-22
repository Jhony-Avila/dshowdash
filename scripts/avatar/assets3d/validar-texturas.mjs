#!/usr/bin/env node
// assets3d/validar-texturas.mjs — onda 1421 (MEGA_BRIEFING_01 Parte 7
// P7-E §1652–§1677; decisão #209): VALIDADOR DE MAPAS/TEXTURAS de todos
// os GLBs publicados — node PURO (parse do container GLB + headers
// PNG/JPEG; zero three). Complementa o validar-asset.mjs (que valida a
// PASTA de um personagem): aqui o foco é o CONTEÚDO dos materiais.
//
// Checks:
//   E1 (ERRO)  mesma imagem usada como COR (sRGB) e como DADO linear
//              (normal/roughness/metalness/occlusion) — color space
//              conflitante corrompe um dos usos;
//   E2 (ERRO)  fatores PBR fora de [0,1] (metallicFactor/roughnessFactor);
//   E3 (ERRO)  textura maior que 2× o teto da categoria (TEXTURA_MAX);
//   A1 (aviso) textura acima do teto da categoria (até 2×);
//   A2 (aviso) dimensão não potência de dois (mipmaps degradados);
//   A3 (aviso) metallicFactor "meio-metal" (0.1–0.9) SEM mapa de
//              metalness (PBR ambíguo §1634);
//   A4 (aviso) alphaMode BLEND sem baseColorTexture (transparência
//              plana — provável engano de export).
//
// Uso: node scripts/avatar/assets3d/validar-texturas.mjs [--json]
// Saída: relatório + docs/AVATAR-STUDIO-5/evidencias/texturas-3d.json;
// exit 0 = sem erros (avisos não derrubam).
// @version 1.0.0  @created 2026-08-22
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const BASE = join(RAIZ, 'public', 'assets', 'avatars', '3d');

/** Teto de textura POR CATEGORIA (#209 — TEXTURA_MAX §1652): maior
 *  dimensão em px. Erro duro só acima de 2× (o gap é aviso). */
export const TEXTURA_MAX = { personagem: 2048, parte: 1024, prop: 1024, cenario: 2048 };

export const ehPot = (n) => n > 0 && (n & (n - 1)) === 0;

/** Dimensões de um PNG (IHDR) — null se não for PNG. */
export function dimensoesPng(buf) {
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { largura: buf.readUInt32BE(16), altura: buf.readUInt32BE(20) };
}

/** Dimensões de um JPEG (primeiro SOF0–SOF15 válido) — null se não for. */
export function dimensoesJpeg(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) { i += 1; continue; }
    const marcador = buf[i + 1];
    if (marcador >= 0xc0 && marcador <= 0xcf && marcador !== 0xc4 && marcador !== 0xc8 && marcador !== 0xcc) {
      return { altura: buf.readUInt16BE(i + 5), largura: buf.readUInt16BE(i + 7) };
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}

/** Dimensões de um WEBP (VP8/VP8L/VP8X — o publicador §631 exporta webp). */
export function dimensoesWebp(buf) {
  if (buf.length < 30 || buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
  const chunk = buf.toString('ascii', 12, 16);
  if (chunk === 'VP8X') {
    return { largura: 1 + buf.readUIntLE(24, 3), altura: 1 + buf.readUIntLE(27, 3) };
  }
  if (chunk === 'VP8 ') {
    if (buf[23] !== 0x9d || buf[24] !== 0x01 || buf[25] !== 0x2a) return null;
    return { largura: buf.readUInt16LE(26) & 0x3fff, altura: buf.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === 'VP8L') {
    if (buf[20] !== 0x2f) return null;
    const b = buf.readUInt32LE(21);
    return { largura: (b & 0x3fff) + 1, altura: ((b >> 14) & 0x3fff) + 1 };
  }
  return null;
}

export function categoriaDoCaminho(caminho) {
  if (caminho.includes('/partes/')) return 'parte';
  if (caminho.includes('/cenarios/')) return 'cenario';
  if (caminho.includes('/props/')) return 'prop';
  return 'personagem';
}

/** Parse do container GLB: devolve { json, bin } (bin pode ser null). */
export function parseGlb(buf) {
  if (buf.readUInt32LE(0) !== 0x46546c67) return null; // 'glTF'
  let off = 12;
  let json = null; let bin = null;
  while (off + 8 <= buf.length) {
    const tam = buf.readUInt32LE(off);
    const tipo = buf.readUInt32LE(off + 4);
    const corpo = buf.subarray(off + 8, off + 8 + tam);
    if (tipo === 0x4e4f534a) json = JSON.parse(corpo.toString('utf8'));
    else if (tipo === 0x004e4942) bin = corpo;
    off += 8 + tam + (tam % 4 === 0 ? 0 : 4 - (tam % 4));
  }
  return json ? { json, bin } : null;
}

/** Valida UM glb já parseado; devolve { erros: [], avisos: [] }. */
export function validarGlb(json, bin, categoria) {
  const erros = [];
  const avisos = [];
  const texturas = json.textures ?? [];
  const imagens = json.images ?? [];
  const fonteDaTextura = (ti) => (ti !== undefined && texturas[ti] ? texturas[ti].source : undefined);
  // 1. classifica cada IMAGEM por uso (cor sRGB × dado linear)
  const usoCor = new Set();
  const usoDado = new Set();
  for (const mat of json.materials ?? []) {
    const pbr = mat.pbrMetallicRoughness ?? {};
    const addCor = (t) => { const s = fonteDaTextura(t?.index); if (s !== undefined) usoCor.add(s); };
    const addDado = (t) => { const s = fonteDaTextura(t?.index); if (s !== undefined) usoDado.add(s); };
    addCor(pbr.baseColorTexture);
    addCor(mat.emissiveTexture);
    addDado(pbr.metallicRoughnessTexture);
    addDado(mat.normalTexture);
    addDado(mat.occlusionTexture);
    // E2: fatores fora de [0,1]
    for (const [campo, v] of [['metallicFactor', pbr.metallicFactor], ['roughnessFactor', pbr.roughnessFactor]]) {
      if (v !== undefined && (v < 0 || v > 1)) erros.push(`E2 ${mat.name ?? '?'}: ${campo}=${v} fora de [0,1]`);
    }
    // A3: meio-metal sem mapa
    const mf = pbr.metallicFactor;
    if (mf !== undefined && mf > 0.1 && mf < 0.9 && !pbr.metallicRoughnessTexture) {
      avisos.push(`A3 ${mat.name ?? '?'}: metallicFactor ${mf} sem mapa de metalness (PBR ambiguo)`);
    }
    // A4: BLEND sem baseColorTexture
    if (mat.alphaMode === 'BLEND' && !pbr.baseColorTexture) {
      avisos.push(`A4 ${mat.name ?? '?'}: alphaMode BLEND sem baseColorTexture`);
    }
  }
  // E1: conflito de color space
  for (const s of usoCor) if (usoDado.has(s)) erros.push(`E1 imagem #${s} usada como COR e como DADO linear`);
  // dimensões (imagens embutidas no BIN)
  const teto = TEXTURA_MAX[categoria] ?? 2048;
  imagens.forEach((img, idx) => {
    if (img.bufferView === undefined || !bin) return;
    const bv = json.bufferViews?.[img.bufferView];
    if (!bv) return;
    const dados = bin.subarray(bv.byteOffset ?? 0, (bv.byteOffset ?? 0) + bv.byteLength);
    const dim = dimensoesPng(dados) ?? dimensoesJpeg(dados) ?? dimensoesWebp(dados);
    if (!dim) { avisos.push(`A? imagem #${idx} (${img.mimeType ?? '?'}): dimensoes ilegiveis`); return; }
    const maior = Math.max(dim.largura, dim.altura);
    if (maior > teto * 2) erros.push(`E3 imagem #${idx}: ${dim.largura}x${dim.altura} > 2x teto ${teto} (${categoria})`);
    else if (maior > teto) avisos.push(`A1 imagem #${idx}: ${dim.largura}x${dim.altura} > teto ${teto} (${categoria})`);
    if (!ehPot(dim.largura) || !ehPot(dim.altura)) avisos.push(`A2 imagem #${idx}: ${dim.largura}x${dim.altura} nao-POT`);
  });
  return { erros, avisos };
}

// ── main (só quando executado direto) ────────────────────────────────
const executadoDireto = process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname);
if (executadoDireto) {
  const { readdirSync, statSync } = await import('node:fs');
  const glbs = [];
  const anda = (dir) => {
    for (const nome of readdirSync(dir)) {
      const c = join(dir, nome);
      if (statSync(c).isDirectory()) anda(c);
      else if (nome.endsWith('.glb')) glbs.push(c);
    }
  };
  anda(BASE);
  const relatorio = { geradoEm: new Date().toISOString(), total: glbs.length, erros: 0, avisos: 0, arquivos: [] };
  for (const caminho of glbs.sort()) {
    const rel = relative(RAIZ, caminho);
    let r;
    try {
      const glb = parseGlb(readFileSync(caminho));
      if (!glb) { relatorio.arquivos.push({ arquivo: rel, erros: ['container GLB invalido'], avisos: [] }); relatorio.erros += 1; continue; }
      r = validarGlb(glb.json, glb.bin, categoriaDoCaminho(caminho.replace(/\\/g, '/')));
    } catch (e) {
      relatorio.arquivos.push({ arquivo: rel, erros: [`parse falhou: ${e.message}`], avisos: [] });
      relatorio.erros += 1;
      continue;
    }
    relatorio.erros += r.erros.length;
    relatorio.avisos += r.avisos.length;
    if (r.erros.length || r.avisos.length) relatorio.arquivos.push({ arquivo: rel, ...r });
  }
  const saida = join(RAIZ, 'docs', 'AVATAR-STUDIO-5', 'evidencias');
  mkdirSync(saida, { recursive: true });
  writeFileSync(join(saida, 'texturas-3d.json'), `${JSON.stringify(relatorio, null, 2)}\n`);
  const json = process.argv.includes('--json');
  if (json) console.log(JSON.stringify(relatorio));
  else console.log(`TEXTURAS-3D: ${relatorio.total} glbs · erros ${relatorio.erros} · avisos ${relatorio.avisos}\n→ docs/AVATAR-STUDIO-5/evidencias/texturas-3d.json`);
  process.exit(relatorio.erros ? 1 : 0);
}
