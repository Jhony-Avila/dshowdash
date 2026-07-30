// engine/render.ts — motor de composição SVG do Avatar Studio.
// @version 1.0.0  @created 2026-07-29
//
// Determinístico: mesmo AvatarConfig → mesmo SVG, byte a byte. É isso que
// permite salvar o config JSON no banco e re-renderizar em qualquer lugar
// (studio, header, menu, perfil) com resultado idêntico.
//
// Ordem de pintura (z-order fixo):
//   fundo → banner → aura → efeito(atrás) → base → roupa → emblema → boca
//   → olhos → cabelo → acessório → moldura → efeito(frente)
//   (banner/aura/emblema — Expansão, decisão #33: categorias 2D de baixo custo)
import type { AvatarConfig } from '../domain/types';
import { paletaDe } from './cores';
import type { ParteDef } from './base-api';
import { G } from './base-api';
import { corpoInteiro } from './partes/corpo';

export interface OpcoesRender {
  /** Tamanho CSS do SVG (width/height). Default: responsivo (100%). */
  tamanho?: number;
  /** Prefixo de ids de <defs>. Default: hash do config (estável e único). */
  uid?: string;
  /** 'quadrado' (raio 26) ou 'circulo' (como aparece no header). */
  forma?: 'quadrado' | 'circulo';
  /** Desliga animações SMIL (thumbnails em grade — economia de GPU). */
  estatico?: boolean;
  /**
   * Modo PALCO (AS3 F1): envolve as camadas em grupos data-anim
   * (plano-fundo/plano-personagem/personagem/olhos/cabelo/palpebras/plano-frente)
   * para o PalcoCinema animar via WAAPI. NUNCA usado na publicação —
   * o SVG salvo permanece byte-estável (critério de aceite nº 8).
   */
  palco?: boolean;
  /**
   * Enquadramento (AS3 F2a): 'busto' (padrão — publicação/header) ou
   * 'corpo' (240×400, corpo inteiro com braços animáveis — só no palco,
   * exige palco:true). Pedido do Jhony: "avatares com o corpo inteiro".
   */
  enquadramento?: 'busto' | 'corpo';
}

/** Hash djb2 → base36. Estável entre execuções (nada de Math.random). */
export function hashConfig(config: AvatarConfig): string {
  const s = JSON.stringify(config);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `av${(h >>> 0).toString(36)}`;
}

const ORDEM_CAMADAS = ['roupa', 'emblema', 'boca', 'olhos', 'cabelo', 'acessorio'] as const;

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

  // "fundo" composto: fundo → banner → aura (tudo atrás do personagem)
  const fundo = pintar(config.camadas.fundo) + pintar(config.camadas.banner)
    + pintar(config.camadas.aura);
  const efeitoDef = config.camadas.efeito && config.camadas.efeito !== 'nenhum'
    ? resolver(config.camadas.efeito)
    : undefined;
  const efeitoSvg = efeitoDef ? efeitoDef.render(p, uid) : '';
  const efeitoAtras = efeitoDef?.atras ? efeitoSvg : '';
  const efeitoFrente = efeitoDef && !efeitoDef.atras ? efeitoSvg : '';

  const moldura = pintar(config.camadas.moldura);

  const alto = opcoes.enquadramento === 'corpo' && opcoes.palco ? 400 : 240;
  const clip = forma === 'circulo' && alto === 240
    ? `<circle cx="${G.cx}" cy="${G.cx}" r="118"/>`
    : `<rect width="240" height="${alto}" rx="26"/>`;

  const dim = opcoes.tamanho ? ` width="${opcoes.tamanho}" height="${opcoes.tamanho}"` : '';

  const corpoTodo = opcoes.enquadramento === 'corpo' && opcoes.palco;

  let conteudo: string;
  if (opcoes.palco) {
    // Grupos animáveis do palco (idle/parallax) — só no preview do estúdio.
    const itemOlhos = config.camadas.olhos ? resolver(config.camadas.olhos) : undefined;
    const palpebras = itemOlhos && itemOlhos.piscar !== false
      ? `<g data-anim="palpebras" opacity="0">
          <ellipse cx="${G.olhoEsqX}" cy="${G.olhosY - 1}" rx="12" ry="10" fill="${p.pele.escuro}"/>
          <ellipse cx="${G.olhoDirX}" cy="${G.olhosY - 1}" rx="12" ry="10" fill="${p.pele.escuro}"/>
        </g>`
      : '';
    if (corpoTodo) {
      // CORPO INTEIRO (240×400): corpo novo + cabeça do busto (sem a roupa
      // de busto) reaproveitada em escala no topo — arte 100% compartilhada.
      const cabeca =
        pintar(config.base) + pintar(config.camadas.boca) +
        `<g data-anim="olhos">${pintar(config.camadas.olhos)}</g>` +
        `<g data-anim="cabelo">${pintar(config.camadas.cabelo)}</g>` +
        pintar(config.camadas.acessorio) + palpebras;
      // emblema no peito do corpo inteiro (mapeia (152,206) do busto → (145,145))
      const emblemaCorpo = config.camadas.emblema && config.camadas.emblema !== 'nenhum'
        ? `<g transform="translate(15.8 -30.1) scale(0.85)">${pintar(config.camadas.emblema)}</g>`
        : '';
      conteudo =
        `<g data-anim="plano-fundo"><g transform="translate(120 200) scale(1.78) translate(-120 -120)">${fundo}${efeitoAtras}</g></g>` +
        `<g data-anim="plano-personagem"><g data-anim="personagem">` +
          corpoInteiro(p, uid) + emblemaCorpo +
          `<g transform="translate(45.6 -16) scale(0.62)">${cabeca}</g>` +
        `</g></g>` +
        `<g data-anim="plano-frente"><g transform="translate(120 200) scale(1.8) translate(-120 -120)">${efeitoFrente}</g></g>`;
    } else {
      // planos com sobre-escala: o parallax translada sem expor a borda do clip
      conteudo =
        `<g data-anim="plano-fundo"><g transform="translate(120 120) scale(1.08) translate(-120 -120)">${fundo}${efeitoAtras}</g></g>` +
        `<g data-anim="plano-personagem"><g data-anim="personagem">` +
          pintar(config.base) + pintar(config.camadas.roupa) + pintar(config.camadas.emblema) +
          pintar(config.camadas.boca) +
          `<g data-anim="olhos">${pintar(config.camadas.olhos)}</g>` +
          `<g data-anim="cabelo">${pintar(config.camadas.cabelo)}</g>` +
          pintar(config.camadas.acessorio) + palpebras +
        `</g></g>` +
        `<g data-anim="plano-frente"><g transform="translate(120 120) scale(1.1) translate(-120 -120)">${efeitoFrente}</g></g>`;
    }
  } else {
    const personagem =
      pintar(config.base) + ORDEM_CAMADAS.map((c) => pintar(config.camadas[c])).join('');
    conteudo = `${fundo}${efeitoAtras}${personagem}${efeitoFrente}`;
  }

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 ${alto}"${dim} role="img" aria-label="Avatar personalizado">
<defs><clipPath id="${uid}clip">${clip}</clipPath></defs>
<g clip-path="url(#${uid}clip)">${conteudo}</g>
${corpoTodo ? '' : moldura}
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
