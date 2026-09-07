// engine/partes/heroes.ts — decisão A+2: REGISTRY DE HEROES 2D AUTORADOS.
// Fecha o loop do método A+ (§3-7): um ativo autorado (SVG desenhado em
// ferramenta visual) entra no CATÁLOGO como item real, via importarHeroAsset —
// o motor NÃO reconstrói a arte. Cada hero é um arquivo autorado embutido aqui
// (fonte única do runtime; o molde/spec vive em docs/AVATAR-STUDIO-5/
// V4_HERO_ASSET_TEMPLATE.svg). IDs `_hx_` (hero-authored) — o catálogo os lista
// SÓ com a flag as6.hero_2d (mais restrita que classico_premium); render
// elevado quando o trilho premium (classico_premium + arte_v2) está ON.
//
// NOTA: o blazer abaixo é o ativo de REFERÊNCIA (mesma arte do molde). Não é um
// hero final ≥8 — é a PROVA de que o pipeline entrega ao catálogo. Heroes reais
// entram aqui conforme o ilustrador os autorar (seguindo V4_ART_AUTHORING_KIT).
// @version 1.0.0  @created 2026-08-24 (decisão A+2)
import { importarHeroAsset } from '../heroAssetImport';
import type { HeroAsset2D } from '../../domain/heroAsset';
import type { ParteDef } from '../base-api';

// Blazer autorado (fragmento SVG do molde V4_HERO_ASSET_TEMPLATE.svg).
const BLAZER_SVG = `<defs>
    <radialGradient id="halo" cx="0.5" cy="0.42" r="0.62">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.16"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>

  
  <ellipse data-hero-layer="back" cx="120" cy="196" rx="108" ry="150" fill="url(#halo)"/>

  
  <ellipse data-hero-layer="shadow" cx="120" cy="386" rx="74" ry="9" fill="#000000" opacity="0.30"/>
  <ellipse data-hero-layer="shadow" cx="120" cy="386" rx="46" ry="5" fill="#000000" opacity="0.22"/>

  
  <path data-hero-layer="base" data-channel="roupa" data-material="wool" fill="#3a4256"
        d="M107 108
           C 103 112 98 116 71 124
           C 74 138 76 146 75 160
           C 74 178 72 186 85 200
           C 82 214 82 220 82 230
           L 158 230
           C 158 220 158 214 155 200
           C 168 186 166 178 165 160
           C 164 146 166 138 169 124
           C 142 116 137 112 133 108
           C 128 130 112 130 107 108 Z"/>

  
  <path data-hero-layer="mid" data-channel="roupa" data-tone="escuro" data-paint="stroke"
        fill="none" stroke="#232833" stroke-width="3" stroke-linecap="round" opacity="0.55"
        d="M92 150 C 90 176 92 198 96 224"/>
  <path data-hero-layer="mid" data-channel="roupa" data-tone="escuro" data-paint="stroke"
        fill="none" stroke="#232833" stroke-width="3" stroke-linecap="round" opacity="0.55"
        d="M148 150 C 150 176 148 198 144 224"/>

  
  <path data-hero-layer="light" data-channel="roupa" data-tone="claro" data-paint="stroke"
        fill="none" stroke="#6b7488" stroke-width="2.4" stroke-linecap="round" opacity="0.5"
        d="M80 132 C 78 150 78 168 80 190"/>

  
  <path data-hero-layer="detail" data-channel="destaque" data-tone="escuro" fill="#8a5e1e"
        d="M107 108 C 112 130 118 150 120 176 L 120 150 C 118 130 114 118 107 108 Z"/>
  <path data-hero-layer="detail" data-channel="destaque" data-tone="escuro" fill="#8a5e1e"
        d="M133 108 C 128 130 122 150 120 176 L 120 150 C 122 130 126 118 133 108 Z"/>
  <circle data-hero-layer="detail" data-channel="destaque" data-tone="brilho" cx="120" cy="188" r="2.4"/>
  <circle data-hero-layer="detail" data-channel="destaque" data-tone="brilho" cx="120" cy="206" r="2.4"/>

  
  <path data-hero-layer="occlusion" fill="#000000" opacity="0.18"
        d="M104 120 C 112 128 128 128 136 120 C 132 132 108 132 104 120 Z"/>

  
  <path data-hero-layer="front" fill="#ffffff" opacity="0.14"
        d="M112 118 C 116 134 118 150 119 170 C 116 150 113 132 112 118 Z"/>

  
  <g data-hero="anchors">
    <circle data-anchor="gola"    cx="120" cy="112"/>
    <circle data-anchor="ombroL"  cx="71"  cy="124"/>
    <circle data-anchor="ombroR"  cx="169" cy="124"/>
    <circle data-anchor="cintura" cx="120" cy="192"/>
    <circle data-anchor="bainha"  cx="120" cy="230"/>
  </g>`;

const BLAZER: HeroAsset2D = {
  manifesto: {
    id: 'rou_hx_blazer', categoria: 'roupa', nome: 'Blazer Autorado',
    descricao: 'Alfaiataria estruturada — primeiro ativo pelo pipeline de autoria (A+).',
    raridade: 'epico', tema: 'executivo',
    lore: 'Desenhado fora do código e vestido pelo motor sem uma linha de Bézier na mão.',
    frame: 'corpo', viewBox: [240, 400],
    canais: [{ canal: 'roupa', rotulo: 'Tecido' }, { canal: 'destaque', rotulo: 'Lapela' }],
    zonasMaterial: [{ id: 'corpo', material: 'wool', canal: 'roupa' }],
    fit: 'STRUCTURED',
  },
  svg: BLAZER_SVG,
};

/** Heroes 2D autorados, prontos p/ o catálogo (id `_hx_`, gated por as6.hero_2d). */
export const HEROES_2D: ParteDef[] = [
  importarHeroAsset(BLAZER),
];
