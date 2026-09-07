// art-intake/validador-contrato.mjs — GATE DE CONTRATO do ART INTAKE.
//
// Depois do gate de SEGURANÇA (validador-svg), confere que o ativo autorado
// segue a CONVENÇÃO (domain/heroAsset.ts + V4_HERO_ASSET_TEMPLATE.svg) — de novo
// um gate TÉCNICO, nunca de arte:
//   • canvas: viewBox 0 0 240 240 (busto) ou 0 0 240 400 (corpo), casando com
//     manifesto.frame; width/height coerentes.
//   • fundo TRANSPARENTE: nada de <rect> opaco cobrindo o canvas inteiro.
//   • ids ÚNICOS no documento (o import prefixa por uid, mas colisão de origem
//     denuncia copy-paste e quebra url(#id)).
//   • data-hero-layer ∈ HERO_LAYERS; data-channel ∈ CANAIS; data-tone ∈ TONS;
//     data-material ∈ MATERIAIS  — vocabulário fechado (§7/§25).
//   • ÂNCORAS mínimas por FAMÍLIA (<g data-hero="anchors">) — sem elas o motor
//     não sabe ancorar a peça (§9): rosto precisa de olhos; corpo, de ombro/
//     cintura; calçado, do pé; etc.
//
// As tabelas abaixo ESPELHAM as fontes de verdade (heroAsset.ts / types.ts /
// materiais2d.ts). O teste art-intake.mjs cobre “layer/canal desconhecido → FAIL”,
// travando qualquer divergência.
//
// Puro Node — sem DOM, sem navegador. @version 1.0.0 @created 2026-08-27
//   (GOLDEN V4.3 FINAL — ART INTAKE GATE)

// espelha domain/heroAsset.ts (HERO_LAYERS / HERO_TONES) e types.ts (CanalCor)
export const HERO_LAYERS = new Set(['back', 'shadow', 'base', 'mid', 'light', 'detail', 'occlusion', 'front']);
export const HERO_TONES = new Set(['base', 'claro', 'escuro', 'profundo', 'brilho', 'meio']);
export const CANAIS = new Set(['pele', 'cabelo', 'roupa', 'destaque', 'secundario']);
// espelha engine/materiais2d.ts (MaterialToken2d)
export const MATERIAIS = new Set(['wool', 'silk', 'denim', 'leather', 'metal', 'technical', 'satin', 'cotton', 'glass', 'emissive']);

// dimensões nativas por frame (domain/heroAsset: corpo=240×400, busto=240×240)
export const DIM_FRAME = { busto: [240, 240], corpo: [240, 400] };

/** Âncoras MÍNIMAS por família (o motor precisa delas p/ posicionar a peça). */
export const ANCORAS_MINIMAS = {
  rosto:   ['olhoE', 'olhoD', 'boca'],      // face hero — olhos = base do CHARACTER_IDENTITY
  cabelo:  ['coroa', 'testa'],              // encaixe do cabelo na cabeça
  mao:     ['punho'],                       // mão neutra — âncora do pulso
  calcado: ['tornozelo', 'solado'],         // calçado ancora ao pé (§12/§71)
  roupa:   ['gola', 'barra'],               // vestuário (busto/torso) — gola + bainha
  corpo:   ['ombroE', 'ombroD', 'cintura'], // body hero — ombros + cintura
};

const RE_TAG = /<([\w:-]+)((?:[^>"']|"[^"]*"|'[^']*')*?)\/?>/g;
function attr(attrs, nome) {
  const m = attrs.match(new RegExp(`\\b${nome.replace(':', '\\:')}\\s*=\\s*"([^"]*)"`));
  return m ? m[1] : null;
}

/** Classifica a FAMÍLIA (define âncoras exigidas). manifesto.familia vence;
 *  senão deriva de categoria/frame. */
export function classificarFamilia(man) {
  if (man.familia && ANCORAS_MINIMAS[man.familia]) return man.familia;
  const c = man.categoria;
  if (c === 'cabelo') return 'cabelo';
  if (c === 'olhos' || c === 'boca' || c === 'nariz' || c === 'sobrancelha' || c === 'barba') return 'rosto';
  if (c === 'roupa' || c === 'roupa_sobre' || c === 'roupa_inferior') return 'roupa';
  if (c === 'base') return man.frame === 'corpo' ? 'corpo' : 'rosto';
  return null; // acessório genérico etc. — sem âncora exigida
}

/**
 * Valida o CONTRATO de um ativo autorado.
 * @param {string} svg — SVG (arquivo inteiro, com a casca <svg>).
 * @param {object} man — manifesto (HeroAssetManifest).
 * @param {string} arquivo — rótulo p/ o relatório.
 */
export function validarContrato(svg, man, arquivo = '(svg)') {
  const violacoes = [];
  const add = (elemento, problema, como) => violacoes.push({ arquivo, elemento, problema, como, gate: 'CONTRACT' });

  // ── 1) canvas / viewBox ────────────────────────────────────────────
  const frame = man && man.frame;
  const dim = DIM_FRAME[frame];
  if (!dim) {
    add('manifesto.frame', `frame inválido: ${JSON.stringify(frame)} (esperado "busto" ou "corpo")`, 'Declare frame:"busto" (240×240) ou "corpo" (240×400) no manifesto.');
  }
  const svgTag = svg.match(/<svg\b[^>]*>/i);
  if (!svgTag) {
    add('<svg>', 'sem elemento <svg> raiz', 'Envolva a arte em <svg viewBox="0 0 240 400" …> (ou 240 240 p/ busto).');
  } else {
    const vb = attr(svgTag[0], 'viewBox');
    const esperado = dim ? `0 0 ${dim[0]} ${dim[1]}` : null;
    const vbNorm = vb ? vb.trim().replace(/[, ]+/g, ' ') : null;
    if (esperado && vbNorm !== esperado) {
      add('<svg viewBox>', `viewBox="${vb}" ≠ esperado "${esperado}" p/ frame "${frame}"`, `Ajuste o viewBox para "${esperado}". Canvas fixo garante enquadramento e byte-stability.`);
    }
    const w = parseFloat(attr(svgTag[0], 'width') || 'NaN');
    const h = parseFloat(attr(svgTag[0], 'height') || 'NaN');
    if (dim && (!Number.isNaN(w) || !Number.isNaN(h)) && (Math.round(w) !== dim[0] || Math.round(h) !== dim[1])) {
      add('<svg width/height>', `width/height (${w}×${h}) ≠ ${dim[0]}×${dim[1]}`, `Use width="${dim[0]}" height="${dim[1]}" (ou omita — mas se presentes, precisam casar).`);
    }
  }

  // ── 2) fundo transparente (sem rect opaco cobrindo o canvas) ────────
  RE_TAG.lastIndex = 0;
  let m;
  const idCount = new Map();
  const anchorsDecl = new Set();
  let dentroDeAnchors = false;
  while ((m = RE_TAG.exec(svg))) {
    const nome = m[1];
    const attrs = m[2] || '';

    // fundo opaco: <rect> do tamanho do canvas com fill não-transparente
    if (nome === 'rect' && dim) {
      const x = parseFloat(attr(attrs, 'x') || '0');
      const y = parseFloat(attr(attrs, 'y') || '0');
      const w = parseFloat(attr(attrs, 'width') || '0');
      const h = parseFloat(attr(attrs, 'height') || '0');
      const fill = (attr(attrs, 'fill') || '').trim().toLowerCase();
      const op = parseFloat(attr(attrs, 'opacity') || attr(attrs, 'fill-opacity') || '1');
      const cobre = x <= 0 && y <= 0 && w >= dim[0] && h >= dim[1];
      const opaco = fill && fill !== 'none' && fill !== 'transparent' && op >= 0.99;
      if (cobre && opaco) {
        add('<rect> fundo', `retângulo ${w}×${h} opaco (fill=${fill}) cobrindo o canvas`, 'Remova o fundo. O canvas é TRANSPARENTE — o palco/card fornece o fundo (§7).');
      }
    }

    // ids
    const id = attr(attrs, 'id');
    if (id) idCount.set(id, (idCount.get(id) || 0) + 1);

    // âncoras: dentro de <g data-hero="anchors">
    if (nome === 'g' && /data-hero\s*=\s*"anchors"/.test(attrs)) dentroDeAnchors = true;
    const anc = attr(attrs, 'data-anchor');
    if (anc) anchorsDecl.add(anc);

    // data-* de vocabulário fechado
    const layer = attr(attrs, 'data-hero-layer');
    if (layer && !HERO_LAYERS.has(layer)) {
      add(`<${nome} data-hero-layer>`, `data-hero-layer="${layer}" desconhecido`, `Use uma camada válida: ${[...HERO_LAYERS].join(' | ')}.`);
    }
    const canal = attr(attrs, 'data-channel');
    if (canal && !CANAIS.has(canal)) {
      add(`<${nome} data-channel>`, `data-channel="${canal}" desconhecido`, `Use um canal válido: ${[...CANAIS].join(' | ')}.`);
    }
    const tone = attr(attrs, 'data-tone');
    if (tone && !HERO_TONES.has(tone)) {
      add(`<${nome} data-tone>`, `data-tone="${tone}" desconhecido`, `Use um tom válido: ${[...HERO_TONES].join(' | ')}.`);
    }
    const mat = attr(attrs, 'data-material');
    if (mat && !MATERIAIS.has(mat)) {
      add(`<${nome} data-material>`, `data-material="${mat}" desconhecido`, `Use um material válido: ${[...MATERIAIS].join(' | ')}.`);
    }
  }

  // ── 3) ids únicos ──────────────────────────────────────────────────
  for (const [id, n] of idCount) {
    if (n > 1) add(`id="${id}"`, `id "${id}" duplicado (${n}×)`, 'IDs devem ser únicos no documento — renomeie as cópias (o import prefixa por uid, mas colisão de origem quebra url(#id)).');
  }

  // ── 4) âncoras mínimas por família ─────────────────────────────────
  const familia = classificarFamilia(man || {});
  if (familia) {
    const faltando = ANCORAS_MINIMAS[familia].filter((a) => !anchorsDecl.has(a));
    if (!dentroDeAnchors && anchorsDecl.size === 0) {
      add('<g data-hero="anchors">', `família "${familia}" exige âncoras e nenhuma foi declarada`, `Adicione <g data-hero="anchors"> com: ${ANCORAS_MINIMAS[familia].join(', ')}.`);
    } else if (faltando.length) {
      add('data-anchor', `família "${familia}": âncora(s) ausente(s): ${faltando.join(', ')}`, `Declare as âncoras faltantes dentro de <g data-hero="anchors"> (ex.: <circle data-anchor="${faltando[0]}" cx cy/>).`);
    }
  }

  return { ok: violacoes.length === 0, violacoes, familia };
}
