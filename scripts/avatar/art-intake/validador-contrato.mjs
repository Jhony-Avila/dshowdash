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
// Puro Node — sem DOM, sem navegador. @version 1.1.0 @created 2026-08-27
//   (GOLDEN V4.3 FINAL — ART INTAKE GATE; hardening 2026-08-28: enum de
//   categoria/slot, família roupa_inferior, âncoras via fonte única ancoras.mjs)
import { ANCORAS_FAMILIA, FAMILIAS, canonicos, faltantes, aliasesUsados } from './ancoras.mjs';

// espelha domain/heroAsset.ts (HERO_LAYERS / HERO_TONES) e types.ts (CanalCor)
export const HERO_LAYERS = new Set(['back', 'shadow', 'base', 'mid', 'light', 'detail', 'occlusion', 'front']);
export const HERO_TONES = new Set(['base', 'claro', 'escuro', 'profundo', 'brilho', 'meio']);
export const CANAIS = new Set(['pele', 'cabelo', 'roupa', 'destaque', 'secundario']);
// espelha engine/materiais2d.ts (MaterialToken2d)
export const MATERIAIS = new Set(['wool', 'silk', 'denim', 'leather', 'metal', 'technical', 'satin', 'cotton', 'glass', 'emissive']);
// espelha domain/types.ts (CategoriaId) — enum FECHADO de categoria (G-02)
export const CATEGORIAS = new Set(['base', 'cabelo', 'olhos', 'boca', 'roupa', 'acessorio', 'fundo', 'moldura', 'efeito', 'aura', 'banner', 'emblema', 'roupa_sobre', 'barba', 'sobrancelha', 'nariz', 'roupa_inferior']);
// espelha domain/types.ts (SlotAcessorio) — enum FECHADO de slot de acessório
export const SLOTS_ACESSORIO = new Set(['cabeca', 'rosto', 'pescoco', 'olhos', 'orelha', 'costas', 'flutuante', 'companheiro', 'pulso_e', 'pulso_d', 'mao_e', 'mao_d', 'cintura', 'pernas', 'pes']);

// dimensões nativas por frame (domain/heroAsset: corpo=240×400, busto=240×240)
export const DIM_FRAME = { busto: [240, 240], corpo: [240, 400] };

// re-export da fonte única de âncoras (compat com quem importava ANCORAS_MINIMAS)
export { ANCORAS_FAMILIA, canonicos };

const RE_TAG = /<([\w:-]+)((?:[^>"']|"[^"]*"|'[^']*')*?)\/?>/g;
function attr(attrs, nome) {
  const m = attrs.match(new RegExp(`\\b${nome.replace(':', '\\:')}\\s*=\\s*"([^"]*)"`));
  return m ? m[1] : null;
}

/** Classifica a FAMÍLIA (define âncoras exigidas). Ordem: manifesto.familia →
 *  slot (hand/footwear, D-02) → categoria/frame. */
export function classificarFamilia(man) {
  if (man.familia && FAMILIAS.has(man.familia)) return man.familia;
  const c = man.categoria;
  const slot = man.slot;
  // D-02: acessórios que SÃO domínios (mão/calçado) derivam do slot
  if (slot === 'pes') return 'calcado';
  if (slot === 'mao_e' || slot === 'mao_d') return 'mao';
  if (c === 'cabelo') return 'cabelo';
  if (c === 'olhos' || c === 'boca' || c === 'nariz' || c === 'sobrancelha' || c === 'barba') return 'rosto';
  if (c === 'roupa' || c === 'roupa_sobre') return 'roupa';
  if (c === 'roupa_inferior') return 'roupa_inferior'; // D-04: família própria (sem gola)
  if (c === 'base') return man.frame === 'corpo' ? 'corpo' : 'rosto';
  return null; // acessório genérico sem domínio de âncora
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

  // ── 0) enum de categoria / slot (G-02) ─────────────────────────────
  if (!man || man.categoria === undefined || man.categoria === null) {
    add('manifesto.categoria', 'categoria ausente no manifesto', `Declare categoria ∈ { ${[...CATEGORIAS].join(', ')} }.`);
  } else if (!CATEGORIAS.has(man.categoria)) {
    add('manifesto.categoria', `categoria desconhecida: recebido "${man.categoria}"`, `Use uma categoria válida: ${[...CATEGORIAS].join(' | ')}.`);
  }
  if (man && man.slot !== undefined && man.slot !== null && !SLOTS_ACESSORIO.has(man.slot)) {
    add('manifesto.slot', `slot incompatível: recebido "${man.slot}"`, `Slot de acessório deve ∈ { ${[...SLOTS_ACESSORIO].join(', ')} } — ou omita.`);
  }

  // ── 1) canvas / viewBox ────────────────────────────────────────────
  const frame = man && man.frame;
  const dim = DIM_FRAME[frame];
  if (!dim) {
    add('manifesto.frame', `frame inválido: recebido ${JSON.stringify(frame)} (esperado "busto" ou "corpo")`, 'Declare frame:"busto" (240×240) ou "corpo" (240×400) no manifesto.');
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
  const anchorCount = new Map(); // p/ detectar âncora DUPLICADA
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
    if (anc) { anchorsDecl.add(anc); anchorCount.set(anc, (anchorCount.get(anc) || 0) + 1); }

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

  // ── 3b) âncora DUPLICADA (mesmo nome 2×) ───────────────────────────
  for (const [nome, n] of anchorCount) {
    if (n > 1) add('data-anchor', `âncora "${nome}" duplicada (${n}×)`, 'Cada âncora deve aparecer UMA vez em <g data-hero="anchors">. Remova as cópias.');
  }

  // ── 4) âncoras mínimas por família (fonte única: ancoras.mjs) ───────
  //   Modelo de sinônimos: um requisito é satisfeito por QUALQUER alias do grupo.
  //   Aliases legados passam (compat) mas a mensagem sempre cita o CANÔNICO.
  const familia = classificarFamilia(man || {});
  if (familia) {
    const faltando = faltantes(familia, anchorsDecl); // nomes canônicos não satisfeitos
    const canon = canonicos(familia).join(', ');
    if (!dentroDeAnchors && anchorsDecl.size === 0) {
      add('<g data-hero="anchors">', `família "${familia}" exige âncoras e nenhuma foi declarada`, `Adicione <g data-hero="anchors"> com (canônico): ${canon}.`);
    } else if (faltando.length) {
      add('data-anchor', `família "${familia}": âncora(s) canônica(s) ausente(s): ${faltando.join(', ')} — recebido: [${[...anchorsDecl].join(', ') || '∅'}]`, `Declare as faltantes (canônico): ${faltando.join(', ')}. Conjunto esperado: ${canon}.`);
    }
    // aviso informativo (não reprova): uso de alias legado
    const alias = aliasesUsados(familia, anchorsDecl);
    if (alias.length) violacoes.push({ arquivo, elemento: 'data-anchor', problema: `alias legado aceito: ${alias.map((a) => `${a.recebido}→${a.canonico}`).join(', ')}`, como: 'Compatível, mas prefira o nome canônico nas próximas entregas.', gate: 'CONTRACT_INFO' });
  }

  const dur = violacoes.filter((v) => v.gate !== 'CONTRACT_INFO');
  return { ok: dur.length === 0, violacoes: dur, avisos: violacoes.filter((v) => v.gate === 'CONTRACT_INFO'), familia };
}
