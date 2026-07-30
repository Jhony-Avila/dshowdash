// engine/render-foto.ts — composição da FOTO ESTILIZADA (4.6 §21).
// @version 1.0.0  @created 2026-07-30
//
// A foto NUNCA recebe roupas ou características corporais — só assets de
// APRESENTAÇÃO: fundo, banner, aura, efeito, moldura, emblema (vira badge)
// e o selo do título. Layout medalhão: a foto fica num círculo central
// sobre o cenário, com anel na cor de destaque.
//
// Determinístico como o motor principal: mesmo estilo + mesma foto → mesmo
// SVG. Este SVG existe SÓ no cliente (preview + rasterização p/ PNG 480);
// o que vai ao servidor é o PNG re-encodado + o JSON de parâmetros — o
// sanitizador de SVG do backend continua NÃO aceitando <image>.
import type { AvatarConfig } from '../domain/types';
import { paletaDe } from './cores';
import type { ParteDef } from './base-api';
import { congelarSvg, hashTexto } from './render';

export interface EstiloFotoRender {
  camadas: {
    fundo?: string;
    banner?: string;
    aura?: string;
    efeito?: string;
    moldura?: string;
    emblema?: string;
  };
  cores: AvatarConfig['cores'];
  /** selo do título JÁ resolvido pelo serviço (nome + cor da raridade) */
  selo?: { nome: string; cor: string };
}

export interface OpcoesRenderFoto {
  uid?: string;
  forma?: 'quadrado' | 'circulo';
  estatico?: boolean;
  tamanho?: number;
}

function escaparAtributo(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escaparTexto(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Compõe o SVG da foto estilizada. `resolver` desacopla do catálogo
 * (mesma inversão de dependência do renderAvatar).
 */
export function renderFotoEstilizada(
  fotoHref: string,
  estilo: EstiloFotoRender,
  resolver: (id: string) => ParteDef | undefined,
  opcoes: OpcoesRenderFoto = {},
): string {
  const uid = opcoes.uid ?? hashTexto(JSON.stringify(estilo.camadas) + (estilo.selo?.nome ?? ''));
  const p = paletaDe(estilo.cores);
  const forma = opcoes.forma ?? 'quadrado';

  const pintar = (id: string | undefined): string => {
    if (!id || id === 'nenhum') return '';
    const parte = resolver(id);
    return parte ? parte.render(p, uid) : '';
  };

  const fundo = pintar(estilo.camadas.fundo) + pintar(estilo.camadas.banner) + pintar(estilo.camadas.aura);
  const efeitoDef = estilo.camadas.efeito && estilo.camadas.efeito !== 'nenhum'
    ? resolver(estilo.camadas.efeito)
    : undefined;
  const efeitoSvg = efeitoDef ? efeitoDef.render(p, uid) : '';
  const efeitoAtras = efeitoDef?.atras ? efeitoSvg : '';
  const efeitoFrente = efeitoDef && !efeitoDef.atras ? efeitoSvg : '';
  const moldura = pintar(estilo.camadas.moldura);

  // medalhão central: aro externo → anel de destaque → foto clipada
  const medalhao =
    `<circle cx="120" cy="118" r="97" fill="#0a0d15" opacity="0.92"/>` +
    `<image href="${escaparAtributo(fotoHref)}" x="28" y="26" width="184" height="184" ` +
      `preserveAspectRatio="xMidYMid slice" clip-path="url(#${uid}fclip)"/>` +
    `<circle cx="120" cy="118" r="93" fill="none" stroke="${p.destaque.base}" stroke-width="3" opacity="0.9"/>`;

  // emblema vira BADGE no canto inferior direito do medalhão
  // (o pino desenha centrado em (152,206) → alvo (178,178))
  const badge = estilo.camadas.emblema && estilo.camadas.emblema !== 'nenhum'
    ? `<g transform="translate(26 -28)">${pintar(estilo.camadas.emblema)}</g>`
    : '';

  // selo do título: faixa inferior legível no PNG derivado (480px)
  let selo = '';
  if (estilo.selo) {
    const nome = estilo.selo.nome;
    const larg = Math.min(200, Math.max(92, Math.round(nome.length * 7.4) + 26));
    const x = 120 - larg / 2;
    selo =
      `<g><rect x="${x}" y="206" width="${larg}" height="22" rx="11" fill="#0a0d15" opacity="0.88" ` +
        `stroke="${estilo.selo.cor}" stroke-width="1.4"/>` +
      `<text x="120" y="221" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" ` +
        `font-size="12" font-weight="700" fill="${estilo.selo.cor}">${escaparTexto(nome)}</text></g>`;
  }

  const clip = forma === 'circulo'
    ? `<circle cx="120" cy="120" r="118"/>`
    : `<rect width="240" height="240" rx="26"/>`;
  const dim = opcoes.tamanho ? ` width="${opcoes.tamanho}" height="${opcoes.tamanho}"` : '';

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"${dim} role="img" aria-label="Foto estilizada">
<defs><clipPath id="${uid}clip">${clip}</clipPath><clipPath id="${uid}fclip"><circle cx="120" cy="118" r="92"/></clipPath></defs>
<g clip-path="url(#${uid}clip)">${fundo}${efeitoAtras}${medalhao}${badge}${efeitoFrente}${selo}</g>
${moldura}
</svg>`;

  if (opcoes.estatico) {
    svg = congelarSvg(svg);
  }
  return svg;
}
