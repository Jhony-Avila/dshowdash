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

  return { ok: violacoes.length === 0, violacoes };
}
