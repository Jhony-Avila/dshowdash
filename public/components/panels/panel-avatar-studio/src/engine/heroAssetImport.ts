// engine/heroAssetImport.ts — PIPELINE DE IMPORTAÇÃO DO ATIVO AUTORADO —
// decisão A+ §5/§6/§23. Transforma um HeroAsset2D (SVG desenhado à mão +
// manifesto) num `ParteDef` que o catálogo consome como qualquer outro — SEM
// reconstruir a arte procedimentalmente (§5). O motor só:
//   1) prefixa TODOS os ids de <defs>/gradiente pelo `uid` (multi-avatar);
//   2) resolve os CANAIS de cor (data-channel/data-tone) a partir da Paleta
//      → a peça continua CUSTOMIZÁVEL (§24) sem o artista tocar em cor;
//   3) resolve as ZONAS de material (data-material) via materiais2d (§25);
//   4) distribui as CAMADAS autoradas (data-hero-layer) pelos hooks do
//      ParteDef (render/renderAtras/renderSombra/renderFrente) — via LAYER_HOOK.
//
// É determinístico (mesma entrada ⇒ mesmos bytes) e reversível: nada da arte
// é reinventado; o SVG de saída é o SVG de entrada com ids/cores resolvidos e
// os atributos de autoria (data-*) removidos. Um engenheiro integra a peça sem
// o ilustrador (§23); o ilustrador troca o SVG sem tocar em código (§22).
//
// @version 1.0.0  @created 2026-08-23  (decisão A+)
import type { ParteDef } from './base-api';
import type { Paleta, Tinta } from './cores';
import { tintaPremium } from './cores';
import { material2d } from './materiais2d';
import type { MaterialToken2d } from './materiais2d';
import {
  HERO_LAYERS, LAYER_HOOK, LAYER_Z,
} from '../domain/heroAsset';
import type {
  HeroAsset2D, HeroAnchor, HeroLayer, HeroTone,
} from '../domain/heroAsset';
import type { CanalCor } from '../domain/types';

// ── util: tom de um canal ────────────────────────────────────────────
// base/claro/escuro/profundo vêm direto da Tinta; brilho/meio derivam da
// premium (tintaPremium) para não exigir Paleta premium na entrada.
function tomDoCanal(p: Paleta, canal: CanalCor, tone: HeroTone): string {
  const t = p[canal] as Tinta;
  if (tone === 'base' || tone === 'claro' || tone === 'escuro' || tone === 'profundo') {
    return t[tone];
  }
  return tintaPremium(t.base)[tone]; // brilho | meio
}

// ── util: leitura de atributos de UMA tag (string dos atributos) ──────
function attr(attrs: string, nome: string): string | null {
  const m = attrs.match(new RegExp(`\\b${nome}="([^"]*)"`));
  return m ? m[1] : null;
}
// remove atributos de autoria (data-*) do texto de atributos
function limparAutoria(attrs: string): string {
  return attrs
    .replace(/\s+data-(hero-layer|hero|channel|tone|paint|material|anchor)="[^"]*"/g, '')
    .replace(/\s{2,}/g, ' ');
}
// varredura GLOBAL: remove qualquer atributo de autoria remanescente (elementos
// que só carregam data-hero-layer e não passam por resolverPintura).
function limparAutoriaGlobal(svg: string): string {
  return svg.replace(/\s+data-(hero-layer|hero|channel|tone|paint|material|anchor)="[^"]*"/g, '');
}
// define/força um atributo de pintura (fill|stroke) no texto de atributos
function forcarPintura(attrs: string, nome: 'fill' | 'stroke', valor: string): string {
  if (new RegExp(`\\b${nome}="[^"]*"`).test(attrs)) {
    return attrs.replace(new RegExp(`\\b${nome}="[^"]*"`), `${nome}="${valor}"`);
  }
  return `${attrs} ${nome}="${valor}"`;
}

// ── uid-scoping: prefixa ids declarados E referências ────────────────
function escoparIds(svg: string, u: string): string {
  return svg
    .replace(/\bid="([\w-]+)"/g, `id="${u}$1"`)
    .replace(/url\(#([\w-]+)\)/g, `url(#${u}$1)`)
    .replace(/\b(xlink:href|href)="#([\w-]+)"/g, `$1="#${u}$2"`);
}

// ── parse: separa <defs>, âncoras e elementos de topo por camada ─────
interface AssetParsed {
  defs: string;                 // conteúdo bruto de <defs> concatenado
  anchors: HeroAnchor[];
  buckets: Record<HeroLayer, string[]>; // elementos de topo por camada
}

/** Divide um fragmento SVG nos elementos de TOPO (respeitando aninhamento). */
function elementosDeTopo(svg: string): string[] {
  const out: string[] = [];
  let i = 0; const n = svg.length;
  while (i < n) {
    // pula texto/whitespace entre tags
    if (svg[i] !== '<') { i++; continue; }
    // comentário
    if (svg.startsWith('<!--', i)) { const e = svg.indexOf('-->', i); i = e < 0 ? n : e + 3; continue; }
    const tagM = svg.slice(i).match(/^<([\w:-]+)([^>]*?)(\/?)>/);
    if (!tagM) { i++; continue; }
    const nome = tagM[1]; const selfClose = tagM[3] === '/'; const tagFull = tagM[0];
    if (selfClose) { out.push(tagFull); i += tagFull.length; continue; }
    // acha o fechamento correspondente respeitando aninhamento do MESMO nome
    let depth = 1; let j = i + tagFull.length;
    const abre = new RegExp(`<${nome}\\b[^>]*?(\\/?)>`, 'g');
    const fecha = new RegExp(`</${nome}>`, 'g');
    while (depth > 0 && j < n) {
      abre.lastIndex = j; fecha.lastIndex = j;
      const a = abre.exec(svg); const f = fecha.exec(svg);
      if (!f) { j = n; break; }
      if (a && a.index < f.index) {
        if (a[1] !== '/') depth++;
        j = a.index + a[0].length;
      } else {
        depth--;
        j = f.index + f[0].length;
      }
    }
    out.push(svg.slice(i, j));
    i = j;
  }
  return out;
}

function parseAsset(asset: HeroAsset2D): AssetParsed {
  let svg = asset.svg;
  // 1) extrai <defs> (todos) — mantidos, ids escopados depois
  let defs = '';
  svg = svg.replace(/<defs>([\s\S]*?)<\/defs>/g, (_m, body) => { defs += body; return ''; });
  // 2) extrai âncoras
  const anchors: HeroAnchor[] = [];
  svg = svg.replace(/<g\b[^>]*data-hero="anchors"[^>]*>([\s\S]*?)<\/g>/g, (_m, body) => {
    const re = /<\w+\b([^>]*)\/?>/g; let mm: RegExpExecArray | null;
    while ((mm = re.exec(body))) {
      const a = mm[1];
      const nome = attr(a, 'data-anchor'); if (!nome) continue;
      const x = parseFloat(attr(a, 'cx') ?? attr(a, 'x') ?? 'NaN');
      const y = parseFloat(attr(a, 'cy') ?? attr(a, 'y') ?? 'NaN');
      if (!Number.isNaN(x) && !Number.isNaN(y)) anchors.push({ nome, x, y });
    }
    return '';
  });
  // 3) elementos de topo → buckets por data-hero-layer
  const buckets = Object.fromEntries(HERO_LAYERS.map((l) => [l, [] as string[]])) as Record<HeroLayer, string[]>;
  for (const el of elementosDeTopo(svg)) {
    if (!el.trim()) continue;
    const head = el.match(/^<[\w:-]+([^>]*?)\/?>/);
    const camada = (head && (attr(head[1], 'data-hero-layer') as HeroLayer)) || 'base';
    (buckets[camada] || buckets.base).push(el);
  }
  return { defs, anchors, buckets };
}

// ── resolução de canais/materiais em UM bloco de elementos ───────────
// Coletamos defs de material sob demanda (uma vez por par token+canal).
function resolverPintura(bloco: string, p: Paleta, u: string, matDefs: Map<string, string>): string {
  return bloco.replace(/<([\w:-]+)([^>]*?)(\/?)>/g, (full, tag, attrs, close) => {
    const canal = attr(attrs, 'data-channel') as CanalCor | null;
    const material = attr(attrs, 'data-material') as MaterialToken2d | null;
    if (!canal && !material) return full; // tag comum: intacta
    const paint = (attr(attrs, 'data-paint') as 'fill' | 'stroke' | 'both' | null) || 'fill';
    let a = attrs;
    if (material && canal) {
      const chave = `${material}:${canal}`;
      const mu = `${u}${canal}_`;
      const baseHex = (p[canal] as Tinta | undefined)?.base ?? p.roupa.base;
      const m = material2d(material, baseHex);
      if (!matDefs.has(chave)) matDefs.set(chave, m.defs(mu));
      a = forcarPintura(a, 'fill', m.fill(mu));
    } else if (canal) {
      const tone = (attr(attrs, 'data-tone') as HeroTone | null) || 'base';
      const cor = tomDoCanal(p, canal, tone);
      if (paint === 'fill' || paint === 'both') a = forcarPintura(a, 'fill', cor);
      if (paint === 'stroke' || paint === 'both') a = forcarPintura(a, 'stroke', cor);
    }
    return `<${tag}${limparAutoria(a)}${close ? '/' : ''}>`;
  });
}

type HookNome = 'render' | 'renderAtras' | 'renderSombra' | 'renderFrente';
const HOOK_PRIORIDADE: HookNome[] = ['render', 'renderAtras', 'renderSombra', 'renderFrente'];

/** Um hook está NÃO-vazio se alguma camada mapeada p/ ele tem elementos. */
function hookNaoVazio(hook: HookNome, parsed: AssetParsed): boolean {
  return HERO_LAYERS.some((l) => LAYER_HOOK[l] === hook && parsed.buckets[l].length > 0);
}
/** Dono dos <defs> do asset: 1º hook não-vazio na ordem de prioridade. Como
 *  os fragmentos dos hooks vão para o MESMO <svg> final, um único <defs>
 *  (por id, escopado por uid) resolve as referências de TODOS os hooks —
 *  duplicá-lo geraria ids repetidos no documento. */
function donoDefs(parsed: AssetParsed): HookNome | null {
  return HOOK_PRIORIDADE.find((h) => hookNaoVazio(h, parsed)) ?? null;
}

/** Monta o fragmento de UM hook a partir das camadas que caem nele, em z.
 *  Retorna '' se vazio. */
function montarHook(hook: HookNome, parsed: AssetParsed, p: Paleta, u: string): string {
  const camadas = HERO_LAYERS
    .filter((l) => LAYER_HOOK[l] === hook)
    .sort((x, y) => LAYER_Z[x] - LAYER_Z[y]);
  const matDefs = new Map<string, string>();
  const corpo = camadas.map((l) => parsed.buckets[l].join('')).join('');
  if (!corpo.trim()) return '';
  const resolvido = limparAutoriaGlobal(resolverPintura(corpo, p, u, matDefs));
  // defs do asset entram UMA vez, no hook dono; materiais entram no hook que
  // os usou. Ambos escopados por uid junto com o corpo.
  const defsAsset = hook === donoDefs(parsed) && parsed.defs.trim() ? `<defs>${parsed.defs}</defs>` : '';
  const defsMat = matDefs.size ? `<defs>${[...matDefs.values()].join('')}</defs>` : '';
  return escoparIds(`${defsAsset}${defsMat}${resolvido}`, u);
}

/**
 * IMPORTA um HeroAsset2D → ParteDef. O ParteDef resultante é indistinguível
 * de um autorado à mão do ponto de vista do catálogo/render, mas sua arte é
 * a autorada — o motor só a resolve (cor/uid) e a distribui pelos hooks.
 *
 * Byte-stability: com paleta e uid fixos, o SVG emitido é sempre o mesmo.
 */
export function importarHeroAsset(asset: HeroAsset2D): ParteDef {
  const m = asset.manifesto;
  const parsed = parseAsset(asset);
  asset.anchors = parsed.anchors; // devolve âncoras ao ativo (uso do motor)

  const render = (p: Paleta, u: string) => montarHook('render', parsed, p, u);
  const atras = (p: Paleta, u: string) => montarHook('renderAtras', parsed, p, u);
  const sombra = (p: Paleta, u: string) => montarHook('renderSombra', parsed, p, u);
  const frente = (p: Paleta, u: string) => montarHook('renderFrente', parsed, p, u);

  const temAtras = HERO_LAYERS.some((l) => LAYER_HOOK[l] === 'renderAtras' && parsed.buckets[l].length);
  const temSombra = HERO_LAYERS.some((l) => LAYER_HOOK[l] === 'renderSombra' && parsed.buckets[l].length);
  const temFrente = HERO_LAYERS.some((l) => LAYER_HOOK[l] === 'renderFrente' && parsed.buckets[l].length);

  const def: ParteDef = {
    id: m.id,
    categoria: m.categoria,
    nome: m.nome,
    descricao: m.descricao,
    raridade: m.raridade,
    tema: m.tema,
    lore: m.lore,
    usaCores: m.canais.map((c) => c.canal),
    requerBase: m.requerBase,
    incompativelCom: m.incompativelCom,
    acabamento: 'premium',
    render,
    // corpo inteiro: a mesma silhueta autorada é a peça (§ silhueta própria)
    renderCorpoV2: m.frame === 'corpo' ? render : undefined,
  };
  if (temAtras) def.renderAtras = atras;
  if (temSombra) def.renderSombra = sombra;
  if (temFrente) def.renderFrente = frente;
  return def;
}

/** Só o parse (para provas/inspeção: âncoras, buckets, contagem). */
export { parseAsset };
