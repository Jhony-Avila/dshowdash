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

// ── §325: FORMATOS de saída (fonte única de verdade) ────────────────
// perfil = composição clássica 1:1 (intocada — determinismo preservado
// para fotos já salvas). Os demais são WIDE: medalhão à esquerda, título
// + emblema à direita, fundo/banner esticados na largura. A `caixa` mantém
// ALTURA 240 (escala dos assets idêntica à do quadrado); `saida` é o PNG.
export type FormatoFotoId = 'perfil' | 'header' | 'banner' | 'wallpaper';
export const FORMATOS_FOTO: Record<FormatoFotoId, {
  nome: string; proporcao: string; saida: [number, number]; caixa: [number, number];
}> = {
  perfil: { nome: 'Perfil', proporcao: '1:1', saida: [480, 480], caixa: [240, 240] },
  header: { nome: 'Header', proporcao: '3:1', saida: [1500, 500], caixa: [720, 240] },
  banner: { nome: 'Banner', proporcao: '4:1', saida: [1920, 480], caixa: [960, 240] },
  wallpaper: { nome: 'Wallpaper', proporcao: '16:9', saida: [1920, 1080], caixa: [426.7, 240] },
};

export interface OpcoesRenderFoto {
  uid?: string;
  forma?: 'quadrado' | 'circulo';
  estatico?: boolean;
  tamanho?: number;
  /** §325: formato de saída — omitido/'perfil' = quadrado clássico */
  formato?: FormatoFotoId;
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

  // §325: formatos WIDE têm composição própria; o quadrado segue intacto
  if (opcoes.formato && opcoes.formato !== 'perfil') {
    return comporWide(fotoHref, estilo, pintar, resolver, p, uid, opcoes);
  }

  const fundo = pintar(estilo.camadas.fundo) + pintar(estilo.camadas.banner) + pintar(estilo.camadas.aura);
  const efeitoDef = estilo.camadas.efeito && estilo.camadas.efeito !== 'nenhum'
    ? resolver(estilo.camadas.efeito)
    : undefined;
  const efeitoSvg = efeitoDef ? efeitoDef.render(p, uid) : '';
  const efeitoAtras = efeitoDef?.atras ? efeitoSvg : '';
  const efeitoFrente = efeitoDef && !efeitoDef.atras ? efeitoSvg : '';
  const moldura = pintar(estilo.camadas.moldura);

  // medalhão central: aro externo → anel de destaque → foto clipada
  const medalhao = medalhaoSvg(fotoHref, p, uid);

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

/** Medalhão (aro → foto clipada → anel de destaque) — compartilhado entre
 *  o quadrado clássico e os formatos wide (§325). Geometria IDÊNTICA à
 *  original: o output do formato 'perfil' segue byte a byte o mesmo. */
function medalhaoSvg(fotoHref: string, p: ReturnType<typeof paletaDe>, uid: string): string {
  return `<circle cx="120" cy="118" r="97" fill="#0a0d15" opacity="0.92"/>` +
    `<image href="${escaparAtributo(fotoHref)}" x="28" y="26" width="184" height="184" ` +
      `preserveAspectRatio="xMidYMid slice" clip-path="url(#${uid}fclip)"/>` +
    `<circle cx="120" cy="118" r="93" fill="none" stroke="${p.destaque.base}" stroke-width="3" opacity="0.9"/>`;
}

/** §325: composição WIDE — medalhão à ESQUERDA (célula 240×240 intocada:
 *  aura/efeito continuam ancorados nele), título + emblema à DIREITA em
 *  escala maior, fundo/banner ESTICADOS na largura toda. Moldura fica de
 *  fora: molduras são desenhadas para 1:1 e esticar deformaria os cantos
 *  (a UI desabilita os chips fora do formato Perfil). */
function comporWide(
  fotoHref: string,
  estilo: EstiloFotoRender,
  pintar: (id: string | undefined) => string,
  resolver: (id: string) => ParteDef | undefined,
  p: ReturnType<typeof paletaDe>,
  uid: string,
  opcoes: OpcoesRenderFoto,
): string {
  const formato = FORMATOS_FOTO[opcoes.formato ?? 'header'];
  const [W, H] = formato.caixa;
  const sx = W / 240;

  // fundo + banner esticados ("fundo esticado" — §325); gradientes ficam
  // imperceptíveis, padrões alargam de leve (aceito pelo briefing)
  const fundo = `<g transform="scale(${sx} 1)">${pintar(estilo.camadas.fundo) + pintar(estilo.camadas.banner)}</g>`;
  const aura = pintar(estilo.camadas.aura); // ancorada na célula esquerda
  const efeitoDef = estilo.camadas.efeito && estilo.camadas.efeito !== 'nenhum'
    ? resolver(estilo.camadas.efeito)
    : undefined;
  const efeitoSvg = efeitoDef ? efeitoDef.render(p, uid) : '';
  const efeitoAtras = efeitoDef?.atras ? efeitoSvg : '';
  const efeitoFrente = efeitoDef && !efeitoDef.atras ? efeitoSvg : '';

  // célula direita: emblema (badge grande) em cima, selo do título embaixo
  const cx2 = (240 + W) / 2;
  const badge = estilo.camadas.emblema && estilo.camadas.emblema !== 'nenhum'
    ? `<g transform="translate(${cx2 - 152} -114) scale(1)">${pintar(estilo.camadas.emblema)}</g>`
    : '';
  let selo = '';
  if (estilo.selo) {
    const nome = estilo.selo.nome;
    const larg = Math.min(W - 240 - 24, Math.max(120, Math.round(nome.length * 10) + 34));
    selo =
      `<g><rect x="${cx2 - larg / 2}" y="128" width="${larg}" height="30" rx="15" fill="#0a0d15" opacity="0.88" ` +
        `stroke="${estilo.selo.cor}" stroke-width="1.6"/>` +
      `<text x="${cx2}" y="148" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" ` +
        `font-size="16" font-weight="700" fill="${estilo.selo.cor}">${escaparTexto(nome)}</text></g>`;
  }

  // dimensões explícitas SÓ no export (raster nítido no canvas); no preview
  // o CSS manda — width/height intrínsecos inflariam o min-content do flex
  const [lw, lh] = formato.saida;
  const dims = opcoes.estatico ? ` width="${lw}" height="${lh}"` : '';
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"${dims} ` +
    `preserveAspectRatio="none" role="img" aria-label="Foto estilizada (${formato.nome})">
<defs><clipPath id="${uid}clip"><rect width="${W}" height="${H}" rx="14"/></clipPath><clipPath id="${uid}fclip"><circle cx="120" cy="118" r="92"/></clipPath></defs>
<g clip-path="url(#${uid}clip)"><rect width="${W}" height="${H}" fill="#0a0d15"/>${fundo}${efeitoAtras}${aura}${medalhaoSvg(fotoHref, p, uid)}${badge}${efeitoFrente}${selo}</g>
</svg>`;

  if (opcoes.estatico) svg = congelarSvg(svg);
  return svg;
}
