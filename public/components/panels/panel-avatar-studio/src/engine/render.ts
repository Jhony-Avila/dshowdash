// engine/render.ts — motor de composição SVG do Avatar Studio.
// @version 1.0.0  @created 2026-07-29
//
// Determinístico: mesmo AvatarConfig → mesmo SVG, byte a byte. É isso que
// permite salvar o config JSON no banco e re-renderizar em qualquer lugar
// (studio, header, menu, perfil) com resultado idêntico.
//
// Ordem de pintura (z-order fixo):
//   fundo → efeito(atrás) → base → roupa → boca → olhos → cabelo
//   → acessório → moldura → efeito(frente)
import type { AvatarConfig } from '../domain/types';
import { paletaDe } from './cores';
import type { ParteDef } from './base-api';
import { G } from './base-api';

export interface OpcoesRender {
  /** Tamanho CSS do SVG (width/height). Default: responsivo (100%). */
  tamanho?: number;
  /** Prefixo de ids de <defs>. Default: hash do config (estável e único). */
  uid?: string;
  /** 'quadrado' (raio 26) ou 'circulo' (como aparece no header). */
  forma?: 'quadrado' | 'circulo';
  /** Desliga animações SMIL (thumbnails em grade — economia de GPU). */
  estatico?: boolean;
}

/** Hash djb2 → base36. Estável entre execuções (nada de Math.random). */
export function hashConfig(config: AvatarConfig): string {
  const s = JSON.stringify(config);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `av${(h >>> 0).toString(36)}`;
}

const ORDEM_CAMADAS = ['roupa', 'boca', 'olhos', 'cabelo', 'acessorio'] as const;

/**
 * Compõe o SVG completo do avatar.
 * `resolver` desacopla o motor do catálogo (inversão de dependência):
 * recebe um id e devolve a ParteDef — quem conhece o catálogo é o serviço.
 */
export function renderAvatar(
  config: AvatarConfig,
  resolver: (id: string) => ParteDef | undefined,
  opcoes: OpcoesRender = {},
): string {
  const uid = opcoes.uid ?? hashConfig(config);
  const p = paletaDe(config.cores);
  const forma = opcoes.forma ?? 'quadrado';

  const pintar = (id: string | undefined): string => {
    if (!id || id === 'nenhum') return '';
    const parte = resolver(id);
    return parte ? parte.render(p, uid) : '';
  };

  const fundo = pintar(config.camadas.fundo);
  const efeitoDef = config.camadas.efeito && config.camadas.efeito !== 'nenhum'
    ? resolver(config.camadas.efeito)
    : undefined;
  const efeitoSvg = efeitoDef ? efeitoDef.render(p, uid) : '';
  const efeitoAtras = efeitoDef?.atras ? efeitoSvg : '';
  const efeitoFrente = efeitoDef && !efeitoDef.atras ? efeitoSvg : '';

  const personagem =
    pintar(config.base) + ORDEM_CAMADAS.map((c) => pintar(config.camadas[c])).join('');

  const moldura = pintar(config.camadas.moldura);

  const clip = forma === 'circulo'
    ? `<circle cx="${G.cx}" cy="${G.cx}" r="118"/>`
    : `<rect width="240" height="240" rx="26"/>`;

  const dim = opcoes.tamanho ? ` width="${opcoes.tamanho}" height="${opcoes.tamanho}"` : '';

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"${dim} role="img" aria-label="Avatar personalizado">
<defs><clipPath id="${uid}clip">${clip}</clipPath></defs>
<g clip-path="url(#${uid}clip)">${fundo}${efeitoAtras}${personagem}${efeitoFrente}</g>
${moldura}
</svg>`;

  if (opcoes.estatico) {
    // remove blocos <animate*> (SMIL) — thumbnails ficam congeladas
    svg = svg.replace(/<animate[^>]*\/>|<animate[\s\S]*?<\/animate[^>]*>/g, '')
             .replace(/<animateTransform[^>]*\/>/g, '');
  }
  return svg;
}

/** SVG como data: URI — vira `src` de <img> em qualquer lugar do shell. */
export function renderDataUri(
  config: AvatarConfig,
  resolver: (id: string) => ParteDef | undefined,
  opcoes: OpcoesRender = {},
): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(renderAvatar(config, resolver, opcoes))}`;
}
