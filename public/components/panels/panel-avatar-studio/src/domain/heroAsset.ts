// domain/heroAsset.ts — CONTRATO DO ATIVO AUTORADO (HeroAsset2D) — decisão A+
// §3–§7 (mudança do método de autoria artística).
//
// PROBLEMA que este contrato resolve: até aqui a ARTE e o MOTOR estavam
// FUNDIDOS — um `ParteDef.render(p,u)` desenhava a peça com coordenadas Bézier
// digitadas à mão. Isso impôs um TETO de qualidade (autorar cego). A decisão
// A+ separa as duas responsabilidades:
//
//   ENGINE  = âncoras, escala, fit, paleta, clipping, composição, variantes,
//             adaptação ao corpo, compatibilidade, apresentação.   (NÓS)
//   ART ASSET = silhueta, curvas autoradas, anatomia, construção da peça,
//               cabelo, estrutura facial, mãos, calçado, detalhe.  (ILUSTRADOR,
//               em Illustrator/Figma/Inkscape — depois IMPORTADO, nunca
//               reconstruído procedimentalmente, §5).
//
// Um HeroAsset2D é o DADO que descreve um ativo autorado: o fragmento SVG que
// o artista desenhou + os METADADOS que o motor precisa para consumi-lo
// (âncoras, canais de cor, zonas de material, buckets de camada, foco de
// card/palco). O motor transforma isto num `ParteDef` (engine/heroAssetImport)
// SEM redesenhar nada: só reescreve ids (uid), resolve canais/materiais e
// distribui as camadas autoradas pelos hooks do ParteDef.
//
// CONVENÇÃO DE AUTORIA (o "idioma" que o ilustrador segue no SVG — §7/§22):
//   Canvas: 240×400 (corpo) ou 240×240 (busto). Fundo transparente.
//   Atributos data-* nos elementos (o resto é SVG comum):
//     data-hero-layer="back|shadow|base|mid|light|detail|occlusion|front"
//         → BUCKET de composição (mapeia p/ hook do ParteDef; ver LAYER_HOOK).
//     data-channel="pele|cabelo|roupa|destaque"
//         → o fill/stroke deste elemento vem da PALETA (customizável, §24).
//     data-tone="base|claro|escuro|profundo|brilho|meio"   (default base)
//         → qual tom derivado do canal usar.
//     data-paint="fill|stroke|both"   (default fill)
//         → onde aplicar a cor do canal.
//     data-material="wool|silk|denim|leather|metal|technical|satin|cotton|glass|emissive"
//         → preenche via material2d (usa o hex do data-channel como base, §25).
//     <g data-hero="anchors"> … <circle data-anchor="ombroL" cx="…" cy="…"/> …
//         → âncoras nomeadas (não são pintadas; viram o mapa `anchors`).
//   Ids de <defs>/gradientes: livres — o import prefixa TODOS por uid.
//
// @version 1.0.0  @created 2026-08-23  (decisão A+)
import type { MaterialToken2d } from '../engine/materiais2d';
import type { CanalCor, CategoriaId, Raridade } from './types';
import type { PerfilCorpo2D } from '../engine/partes/corpo';

/** Enquadramento nativo em que a peça foi autorada. */
export type HeroFrame = 'busto' | 'corpo';

/** Buckets de camada que o artista nomeia; o import os mapeia p/ hooks. */
export type HeroLayer =
  | 'back'        // volume/halo ATRÁS da figura        → renderAtras
  | 'shadow'      // sombra de contato no chão           → renderSombra
  | 'base'        // silhueta/preenchimento              → render
  | 'mid'         // meios-tons / dobras                 → render
  | 'light'       // realces                             → render
  | 'detail'      // costura, fecho, textura fina        → render
  | 'occlusion'   // oclusão de contato sobre a figura   → render
  | 'front';      // fios soltos, brilho de lente        → renderFrente

/** Ponto de âncora nomeado (coord. no viewBox nativo do ativo). */
export interface HeroAnchor {
  nome: string;
  x: number;
  y: number;
}

/** Caixa normalizada [x,y,w,h] em 0..1 sobre o viewBox nativo. */
export type CaixaNorm = [number, number, number, number];

/** Zona de material declarada (metadado p/ UI de swatch; a arte já a consome
 *  via data-material — esta lista é o CONTRATO explícito, §17/§25). */
export interface HeroMaterialZone {
  id: string;                 // rótulo humano ('corpo do blazer', 'lapela')
  material: MaterialToken2d;
  canal: CanalCor;            // qual canal de cor pinta a zona
}

/** Canal de cor exposto pela peça ao usuário (customização, §24). */
export interface HeroPaletteChannel {
  canal: CanalCor;
  rotulo: string;             // como aparece no seletor de cor
}

/** MANIFESTO do ativo autorado — tudo menos o SVG em si. */
export interface HeroAssetManifest {
  id: string;                 // ex.: 'rou_hx_blazer'  (hx = hero-authored)
  categoria: CategoriaId;
  nome: string;
  descricao: string;
  raridade: Raridade;
  tema: string;
  lore?: string;
  /** enquadramento nativo do desenho. */
  frame: HeroFrame;
  /** viewBox nativo: [w,h] (origem 0,0). corpo=240×400, busto=240×240. */
  viewBox: [number, number];
  /** canais de cor que o usuário pode trocar (deriva usaCores do ParteDef). */
  canais: HeroPaletteChannel[];
  /** zonas de material declaradas (metadado + validação). */
  zonasMaterial?: HeroMaterialZone[];
  /** perfis de corpo com os quais a peça é compatível (vazio = todos). */
  corposCompat?: PerfilCorpo2D[];
  /** classe de caimento (fit) — dá o comportamento de adaptação (§16). */
  fit?: 'FITTED' | 'REGULAR' | 'RELAXED' | 'OVERSIZED' | 'STRUCTURED';
  /** foco do CARD (o que É o item — §10): crop normalizado do viewBox. */
  focoCard?: CaixaNorm;
  /** foco do PALCO (como fica no personagem — §10). */
  focoPalco?: CaixaNorm;
  /** recorte seguro (nada essencial fora daqui) — p/ auto-frame (§9). */
  safeCrop?: CaixaNorm;
  /** bases compatíveis / incompatibilidades (repassa ao ItemCatalogo). */
  requerBase?: string[];
  incompativelCom?: string[];
}

/** O ativo autorado COMPLETO: manifesto + fragmento SVG desenhado. */
export interface HeroAsset2D {
  manifesto: HeroAssetManifest;
  /** SVG autorado (fragmento: sem <svg> externo; <defs> + elementos com
   *  os data-* da convenção). É a "verdade artística" — nunca reescrita à
   *  mão pelo motor (§5); o import só a TRANSFORMA determinística/reversível. */
  svg: string;
  /** âncoras extraídas de <g data-hero="anchors"> (preenchidas no parse). */
  anchors?: HeroAnchor[];
}

/** Mapa camada-autorada → hook do ParteDef (fonte única, §3). */
export const LAYER_HOOK: Record<HeroLayer, 'render' | 'renderAtras' | 'renderSombra' | 'renderFrente'> = {
  back: 'renderAtras',
  shadow: 'renderSombra',
  base: 'render',
  mid: 'render',
  light: 'render',
  detail: 'render',
  occlusion: 'render',
  front: 'renderFrente',
};

/** Ordem de pintura DENTRO do hook `render` (z crescente = mais à frente). */
export const LAYER_Z: Record<HeroLayer, number> = {
  back: 0, shadow: 0, base: 10, mid: 20, light: 30, detail: 40, occlusion: 50, front: 60,
};

export const HERO_LAYERS: readonly HeroLayer[] = [
  'back', 'shadow', 'base', 'mid', 'light', 'detail', 'occlusion', 'front',
];

export const HERO_TONES = ['base', 'claro', 'escuro', 'profundo', 'brilho', 'meio'] as const;
export type HeroTone = typeof HERO_TONES[number];
