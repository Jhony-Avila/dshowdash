// services/ExportAvatar.ts — onda 1418 (MEGA_BRIEFING_01 P10-G, P3-G;
// decisões #202–#203): PHOTO MODE 2D DO AVATAR — export do personagem em
// FRAMINGS canônicos com toggles de fundo/moldura/efeito e transparência.
//
// Puro e determinístico: `svgExport` monta o SVG final a partir do MESMO
// config do avatar (a foto usa o que o usuário vê — §321). A conversão
// PNG/WebP é do navegador (canvas — `rasterizarExport`); o SVG é a fonte.
// Gated por `as6.cp_foto` na UI; nada aqui altera configs salvos.
// @version 1.0.0  @created 2026-08-21
import type { AvatarConfig } from '../domain/types';
import { svgDe } from './AvatarCatalog';
import { congelarSvg } from '../engine/render';

export type FramingExport = 'full' | 'bust' | 'portrait' | 'square' | 'vertical';

export const FRAMINGS_EXPORT: Array<{ id: FramingExport; nome: string; largura: number; altura: number }> = [
  { id: 'full', nome: 'Corpo inteiro', largura: 240, altura: 400 },
  { id: 'bust', nome: 'Busto', largura: 240, altura: 240 },
  { id: 'portrait', nome: 'Retrato', largura: 160, altura: 200 },
  { id: 'square', nome: 'Quadrado', largura: 240, altura: 240 },
  { id: 'vertical', nome: 'Vertical', largura: 240, altura: 400 },
];

export interface OpcoesExport {
  framing: FramingExport;
  /** toggles §321: desligar camadas de apresentação no export */
  fundo?: boolean;      // default true
  moldura?: boolean;    // default true
  efeito?: boolean;     // default true
  /** true = sem fundo E marca o SVG como transparente (PNG alpha) */
  transparente?: boolean;
}

/** Config derivado com os toggles aplicados (imutável; nada persiste). */
function configExport(config: AvatarConfig, o: OpcoesExport): AvatarConfig {
  const camadas = { ...config.camadas };
  const semFundo = o.transparente || o.fundo === false;
  if (semFundo) { delete camadas.fundo; delete camadas.banner; }
  if (o.moldura === false) delete camadas.moldura;
  if (o.efeito === false) delete camadas.efeito;
  return { ...config, camadas };
}

/** SVG canônico do export (congelado — sem SMIL; pronto p/ rasterizar). */
export function svgExport(config: AvatarConfig, o: OpcoesExport): string {
  const c = configExport(config, o);
  const corpo = o.framing === 'full' || o.framing === 'vertical';
  let svg = svgDe(c, {
    uid: 'exp',
    ...(corpo ? { palco: true, enquadramento: 'corpo' as const } : {}),
    ...(o.framing === 'portrait' || o.framing === 'square' ? { forma: 'quadrado' as const } : {}),
  });
  // retrato: recorte no rosto (viewBox §68 — crop, arte intocada)
  if (o.framing === 'portrait') {
    svg = svg.replace('viewBox="0 0 240 240"', 'viewBox="44 12 152 190"');
  }
  return congelarSvg(svg);
}

/** Nome de arquivo canônico do export. */
export function nomeExport(o: OpcoesExport, formato: 'png' | 'webp' | 'svg'): string {
  const partes = ['avatar', o.framing];
  if (o.transparente) partes.push('transparente');
  return `${partes.join('-')}.${formato}`;
}

/** Rasteriza no NAVEGADOR (canvas). 2× por padrão (§506 espírito). */
export async function rasterizarExport(
  svg: string, largura: number, altura: number,
  formato: 'png' | 'webp', escala = 2,
): Promise<Blob> {
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const img = new Image();
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error('EXPORT_SVG_INVALIDO'));
    img.src = url;
  });
  const canvas = document.createElement('canvas');
  canvas.width = largura * escala;
  canvas.height = altura * escala;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('EXPORT_SEM_CANVAS');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((res, rej) => canvas.toBlob(
    (b) => (b ? res(b) : rej(new Error('EXPORT_SEM_BLOB'))),
    formato === 'webp' ? 'image/webp' : 'image/png',
    0.95,
  ));
}
