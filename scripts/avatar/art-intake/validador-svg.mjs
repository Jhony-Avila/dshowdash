// art-intake/validador-svg.mjs — GATE DE SEGURANÇA P0 do ART INTAKE.
//
// Valida um fragmento/arquivo SVG AUTORADO (vindo de fora — Illustrator/Figma/
// Inkscape/ilustrador) ANTES de ele tocar o motor. É um GATE TÉCNICO DE
// SEGURANÇA, não um crítico de arte: só rejeita o que é perigoso ou proibido
// pela convenção (§636 — validador de IA/entrada externa). Se algo aqui falha,
// o intake é TECHNICAL_FAIL — o motor NÃO renderiza, nada é "consertado" em
// silêncio, e o relatório diz arquivo/elemento/problema/como-corrigir.
//
// P0 — REJEIÇÕES (SVG hostil ou fora do contrato de segurança):
//   • <script>                              — execução de código
//   • <foreignObject>                       — HTML/JS embutido
//   • atributos on* (onload/onclick/…)      — handlers de evento
//   • javascript:  em qualquer URI          — URI executável
//   • <image>                               — raster (arte é VETOR, §5/§30)
//   • href/xlink:href externo (não '#id')   — busca recurso externo
//   • url(...) externo (http/https///data)  — recurso externo em pintura/filtro
//   • @import / <style> com url() externo   — CSS externo
//   • <font-face>/@font-face src externo    — fonte externa
//   • elemento fora do ALLOWLIST            — vocabulário não previsto
//   • atributo perigoso (xlink:href externo em <use>, etc.)
//
// PERMITIDO (a convenção depende disto): url(#id) INTERNO, <defs> internos,
// href="#id" interno (use/gradient), data-* de autoria (heroAsset), gradientes,
// clipPath/mask internos, filtros SVG nativos.
//
// Puro Node (string/regex) — sem DOM, sem navegador, sem dependência nova.
// @version 1.0.0  @created 2026-08-27  (GOLDEN V4.3 FINAL — ART INTAKE GATE)

/** Vocabulário SVG permitido em arte autorada (vetor + composição interna). */
export const ELEMENTOS_PERMITIDOS = new Set([
  'svg', 'g', 'defs', 'title', 'desc', 'metadata', 'symbol',
  'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
  'linearGradient', 'radialGradient', 'stop',
  'clipPath', 'mask', 'use', 'pattern', 'marker',
  'filter', 'feGaussianBlur', 'feOffset', 'feBlend', 'feColorMatrix',
  'feComposite', 'feFlood', 'feMerge', 'feMergeNode', 'feMorphology',
  'feDropShadow', 'feTurbulence', 'feDisplacementMap', 'feComponentTransfer',
  'feFuncR', 'feFuncG', 'feFuncB', 'feFuncA', 'feTile', 'feImage',
  // <style> é tolerado mas o CONTEÚDO é auditado (sem @import/url externo).
  'style',
]);

/** Elementos SEMPRE proibidos (mesmo que apareçam “vazios”). */
export const ELEMENTOS_PROIBIDOS = new Set([
  'script', 'foreignObject', 'image', 'a', 'iframe', 'embed', 'object',
  'audio', 'video', 'animate', 'animateTransform', 'animateMotion', 'set',
  'font', 'font-face', 'font-face-src', 'font-face-uri', 'handler', 'listener',
]);

const RE_TAG = /<([\w:-]+)((?:[^>"']|"[^"]*"|'[^']*')*?)\/?>/g;
const RE_ATTR = /([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g;

/** URI é “externo” (busca recurso fora do documento)? '#id' e '' são internos. */
function uriExterno(v) {
  const s = (v || '').trim();
  if (!s || s.startsWith('#')) return false;                 // âncora interna
  if (/^javascript:/i.test(s)) return true;                  // executável → externo/hostil
  if (/^(https?:)?\/\//i.test(s)) return true;               // http(s):// ou //host
  if (/^data:/i.test(s)) return true;                        // recurso embutido (raster/script)
  if (/^(file|ftp|blob):/i.test(s)) return true;             // outros esquemas
  if (/^\.\.?\//.test(s) || /\.[a-z0-9]{2,4}(\?|#|$)/i.test(s)) return true; // caminho/arquivo
  return false;                                              // (fragmento sem esquema — tolerado)
}

/** url(...) dentro de um valor de atributo/CSS aponta p/ fora do documento? */
function temUrlExterna(valor) {
  const re = /url\(\s*['"]?([^'")]+)['"]?\s*\)/gi;
  let m;
  while ((m = re.exec(valor))) {
    const alvo = m[1].trim();
    if (!alvo.startsWith('#')) return alvo; // url(#id) é OK; o resto é externo
  }
  return null;
}

function ehId(v) { return typeof v === 'string' && v.trim().length > 0; }

/** Devolve o conteúdo INTERNO do elemento que declara id="alvo" (subárvore), ou
 *  null se não achar. Respeita aninhamento do mesmo nome de tag. */
function subtreeDeId(svg, alvo) {
  const re = new RegExp(`<([\\w:-]+)\\b[^>]*\\bid="${alvo}"[^>]*?(\\/?)>`);
  const m = re.exec(svg);
  if (!m) return null;
  if (m[2] === '/') return ''; // self-close: sem subárvore
  const nome = m[1]; const inicio = m.index + m[0].length;
  const abre = new RegExp(`<${nome}\\b[^>]*?(\\/?)>`, 'g');
  const fecha = new RegExp(`</${nome}>`, 'g');
  let depth = 1; let j = inicio; const n = svg.length;
  while (depth > 0 && j < n) {
    abre.lastIndex = j; fecha.lastIndex = j;
    const a = abre.exec(svg); const f = fecha.exec(svg);
    if (!f) return svg.slice(inicio); // sem fechamento — devolve o resto
    if (a && a.index < f.index) { if (a[1] !== '/') depth++; j = a.index + a[0].length; }
    else { depth--; if (depth === 0) return svg.slice(inicio, f.index); j = f.index + f[0].length; }
  }
  return svg.slice(inicio);
}

/**
 * Valida a SEGURANÇA de um SVG autorado.
 * @param {string} svg   — conteúdo SVG (arquivo inteiro ou fragmento).
 * @param {string} arquivo — rótulo p/ o relatório (nome do arquivo).
 * @returns {{ok:boolean, violacoes:Array<{arquivo,elemento,problema,como}>}}
 */
export function validarSeguranca(svg, arquivo = '(svg)') {
  const violacoes = [];
  const add = (elemento, problema, como) => violacoes.push({ arquivo, elemento, problema, como, gate: 'SECURITY_P0' });

  // 0) rejeições textuais rápidas (independem do parse de tags)
  if (/javascript:/i.test(svg)) {
    add('*', 'URI "javascript:" presente no documento', 'Remova qualquer javascript: — arte é 100% declarativa, sem código.');
  }
  // @import em CSS embutido
  if (/@import\b/i.test(svg)) {
    add('style/@import', 'CSS @import (folha de estilo externa)', 'Remova @import; toda a pintura vem de fill/stroke/data-channel, sem CSS externo.');
  }
  // 0b) DOCTYPE / ENTIDADES / declarações de markup (XXE / billion-laughs)
  if (/<!DOCTYPE/i.test(svg) || /<!ENTITY/i.test(svg) || /<!\[CDATA\[[\s\S]*<!/i.test(svg)) {
    add('<!DOCTYPE|<!ENTITY>', 'declaração de markup (DOCTYPE/ENTITY) presente', 'Remova <!DOCTYPE> e <!ENTITY>. Arte é um fragmento SVG puro, sem entidades XML (evita expansão/XXE).');
  }

  // 1) varredura de TAGS
  let m;
  RE_TAG.lastIndex = 0;
  const idsVistos = new Map(); // id → contagem (unicidade é do contrato; aqui só coletamos)
  while ((m = RE_TAG.exec(svg))) {
    const nome = m[1];
    const attrs = m[2] || '';

    // 1a) elemento proibido / fora do allowlist
    if (ELEMENTOS_PROIBIDOS.has(nome)) {
      add(`<${nome}>`, `elemento proibido <${nome}> (execução/HTML/raster/fonte externa/animação de script)`,
        `Remova <${nome}>. Arte autorada é vetor estático: use <path>/<circle>/gradiente. Raster e HTML embutido são proibidos (§5/§30/§636).`);
    } else if (!ELEMENTOS_PERMITIDOS.has(nome)) {
      add(`<${nome}>`, `elemento <${nome}> fora do vocabulário permitido`,
        `Use apenas o vocabulário do template (V4_HERO_ASSET_TEMPLATE.svg): shapes, gradientes, clipPath/mask/use internos e filtros SVG nativos.`);
    }

    // 1b) atributos: on*, hrefs, url() externos
    RE_ATTR.lastIndex = 0;
    let a;
    while ((a = RE_ATTR.exec(attrs))) {
      const chave = a[1];
      const valor = a[3] !== undefined ? a[3] : (a[4] || '');
      const chaveLow = chave.toLowerCase();

      if (chaveLow.startsWith('on')) {
        add(`<${nome} ${chave}>`, `handler de evento "${chave}" (execução de JS)`,
          `Remova o atributo ${chave}. Nenhum handler de evento é permitido na arte.`);
      }
      if ((chaveLow === 'href' || chaveLow === 'xlink:href' || chaveLow === 'src') && uriExterno(valor)) {
        add(`<${nome} ${chave}>`, `${chave}="${valor}" aponta p/ recurso EXTERNO`,
          `Só é permitido ${chave}="#id" (referência interna). Remova recursos externos; embuta o necessário como vetor no próprio SVG.`);
      }
      if (chaveLow === 'style' || /url\(/i.test(valor)) {
        const alvo = temUrlExterna(valor);
        if (alvo) {
          add(`<${nome} ${chave}>`, `url("${alvo}") externa em ${chave}`,
            `Só url(#id) interno é permitido. Substitua por um gradiente/def interno do próprio SVG.`);
        }
        if (chaveLow === 'style' && /@import|expression\s*\(|javascript:/i.test(valor)) {
          add(`<${nome} style>`, `CSS perigoso em style (@import/expression/javascript:)`,
            `Remova CSS externo/executável do atributo style.`);
        }
      }
      if (chaveLow === 'id' && ehId(valor)) idsVistos.set(valor, (idsVistos.get(valor) || 0) + 1);
    }
  }

  // 2) conteúdo de <style>…</style>: @import / url externo / expression
  const reStyle = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  while ((m = reStyle.exec(svg))) {
    const css = m[1] || '';
    const alvo = temUrlExterna(css);
    if (alvo) add('<style>', `url("${alvo}") externa em <style>`, 'Só url(#id) interno; sem recursos externos no CSS embutido.');
    if (/@import|expression\s*\(/i.test(css)) add('<style>', 'CSS externo/executável em <style> (@import/expression)', 'Remova @import/expression do <style>.');
    if (/@font-face/i.test(css) && temUrlExterna(css)) add('<style>@font-face', 'fonte externa via @font-face', 'Converta textos em contornos (<path>) ou use apenas fontes do sistema; sem fonte externa.');
  }

  // 3) HARDENING: limites de complexidade / dimensão / conteúdo oculto ─
  const LIM = { bytes: 512 * 1024, elementos: 4000, profundidade: 40, usos: 64, dim: 4096, fora: 4096 };

  // 3a) tamanho total
  const nBytes = Buffer.byteLength(svg, 'utf8');
  if (nBytes > LIM.bytes) add('documento', `SVG grande demais: ${nBytes} bytes (> ${LIM.bytes})`, `Reduza o arquivo para ≤ ${LIM.bytes} bytes (simplifique curvas/defs).`);

  // 3b) walker: contagem de elementos, profundidade, ciclo de <use>
  const RE_ANY = /<(!--[\s\S]*?--|!\[CDATA\[[\s\S]*?\]\]|![^>]*|\?[^>]*\?|(\/?)([\w:-]+)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?))>/g;
  let elementos = 0; let profundidade = 0; let usos = 0; let maxProf = 0; const pilha = [];
  let t;
  while ((t = RE_ANY.exec(svg))) {
    const corpo = t[1];
    if (corpo.startsWith('!') || corpo.startsWith('?')) continue; // comentário/CDATA/decl
    const fechando = t[2] === '/'; const nome = t[3]; const attrs = t[4] || ''; const selfClose = t[5] === '/';
    if (fechando) { if (pilha.length) pilha.pop(); continue; }
    elementos++;
    if (nome === 'use') {
      usos++;
      const ref = (attrs.match(/\b(?:xlink:href|href)="#([\w-]+)"/) || [])[1];
      if (ref && pilha.some((p) => p.id === ref)) {
        add('<use>', `<use href="#${ref}"> referencia um ANCESTRAL de mesmo id — ciclo de expansão`, 'Remova a auto-referência de <use> (billion-laughs). <use> só pode apontar p/ um id irmão/def, nunca um ancestral.');
      }
    }
    if (!selfClose) {
      const id = (attrs.match(/\bid="([\w-]+)"/) || [])[1] || null;
      pilha.push({ nome, id });
      if (pilha.length > maxProf) maxProf = pilha.length;
    } else if (pilha.length + 1 > maxProf) maxProf = pilha.length + 1;
  }
  profundidade = maxProf;
  if (elementos > LIM.elementos) add('documento', `elementos demais: ${elementos} (> ${LIM.elementos})`, `Reduza a contagem de elementos para ≤ ${LIM.elementos}.`);
  if (profundidade > LIM.profundidade) add('documento', `aninhamento profundo demais: ${profundidade} níveis (> ${LIM.profundidade})`, `Achate a árvore para ≤ ${LIM.profundidade} níveis.`);
  if (usos > LIM.usos) add('documento', `<use> em excesso: ${usos} (> ${LIM.usos})`, `Reduza o número de <use> para ≤ ${LIM.usos}.`);

  // 3b') EXPANSÃO de <use>: rejeita <use> cujo ALVO tem outro <use> dentro
  //   (cobre cadeia e ciclo — inclusive mútuo — sem quebrar <use> de 1 nível).
  const refs = [...svg.matchAll(/<use\b[^>]*\b(?:xlink:href|href)="#([\w-]+)"/g)].map((mm) => mm[1]);
  for (const id of new Set(refs)) {
    const sub = subtreeDeId(svg, id);
    if (sub !== null && /<use\b/.test(sub)) {
      add('<use>', `<use href="#${id}"> aponta p/ um alvo que CONTÉM outro <use> (expansão em cadeia/ciclo)`, 'Só é permitido <use> de 1 nível (alvo sem <use> dentro). Achate a referência — evita billion-laughs.');
      break;
    }
  }

  // 3c) dimensões / viewBox
  const svgTag = (svg.match(/<svg\b[^>]*>/i) || [''])[0];
  const at = (n) => { const mm = svgTag.match(new RegExp(`\\b${n}="([^"]*)"`)); return mm ? mm[1] : null; };
  const w = parseFloat(at('width')); const h = parseFloat(at('height'));
  if ((Number.isFinite(w) && w > LIM.dim) || (Number.isFinite(h) && h > LIM.dim)) add('<svg width/height>', `dimensão excessiva: ${w}×${h} (> ${LIM.dim})`, `width/height devem ≤ ${LIM.dim} (o contrato fixa 240×240/240×400).`);
  const vb = at('viewBox');
  if (vb) { const p = vb.trim().split(/[ ,]+/).map(Number); if (p.length === 4 && (p[2] > LIM.dim || p[3] > LIM.dim)) add('<svg viewBox>', `viewBox excessivo: ${p[2]}×${p[3]} (> ${LIM.dim})`, `viewBox deve ≤ ${LIM.dim} (o contrato fixa 240 240 / 240 400).`); }

  // 3d) conteúdo integralmente invisível (shape desenhável com opacity 0 / display:none)
  const DESENHAVEIS = /^(path|rect|circle|ellipse|polygon|polyline|line|use)$/;
  RE_TAG.lastIndex = 0; let d;
  while ((d = RE_TAG.exec(svg))) {
    const nome = d[1]; const attrs = d[2] || '';
    if (!DESENHAVEIS.test(nome)) continue;
    const op = attrs.match(/\bopacity="([^"]*)"/); const fo = attrs.match(/\bfill-opacity="([^"]*)"/);
    const invis = (op && parseFloat(op[1]) === 0) || /display\s*:\s*none/i.test(attrs) || /visibility\s*:\s*hidden/i.test(attrs);
    if (invis) add(`<${nome}>`, 'elemento desenhável integralmente INVISÍVEL (opacity:0/display:none)', 'Remova conteúdo invisível — arte não pode carregar payload oculto. Se é decorativo, torne visível ou apague.');
    // 3e) conteúdo relevante FORA do quadro (coords muito além do viewBox)
    const cx = parseFloat((attrs.match(/\bcx="([^"]*)"/) || [])[1]); const cy = parseFloat((attrs.match(/\bcy="([^"]*)"/) || [])[1]);
    const x = parseFloat((attrs.match(/\bx="([^"]*)"/) || [])[1]); const y = parseFloat((attrs.match(/\by="([^"]*)"/) || [])[1]);
    const px = Number.isFinite(cx) ? cx : x; const py = Number.isFinite(cy) ? cy : y;
    if ((Number.isFinite(px) && (px > LIM.fora || px < -LIM.fora)) || (Number.isFinite(py) && (py > LIM.fora || py < -LIM.fora))) {
      add(`<${nome}>`, `conteúdo muito fora do quadro (${px},${py})`, 'Mantenha a arte dentro do viewBox (240×240/240×400). Remova geometria fora do quadro.');
    }
  }

  return { ok: violacoes.length === 0, violacoes };
}
