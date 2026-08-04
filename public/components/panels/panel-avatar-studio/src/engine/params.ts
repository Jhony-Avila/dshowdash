// engine/params.ts — framework de PROPRIEDADES por asset (briefing §71, AS5 F3 C2).
// @version 1.0.0  @created 2026-07-31
//
// FONTE ÚNICA do vocabulário de propriedades: o catálogo valida por aqui
// (validarConfig), o motor aplica por aqui (renderAvatar) e a UI monta os
// sliders por aqui (PropriedadesAsset). Espelha o properties_schema_json do
// asset registry (§614) — quando o registry ligar (flag as5.registry_api),
// este mapa passa a ser o FALLBACK do schema vindo do servidor.
//
// PRINCÍPIO (mesmo do `titulo` no validarConfig): valor PADRÃO nunca
// persiste — config sem propriedade alterada é byte-idêntico ao de antes
// da feature, então NENHUM avatar existente muda de hash/render.
//
// A aplicação NÃO toca nas artes (lição da F2: nunca editar partes/*):
//   • intensidade → <g opacity> envolvendo a camada;
//   • velocidade  → reescala os `dur="Ns"` SMIL do fragmento da camada;
//   • escala      → <g transform="translate(cx cy) scale(s) …"> no centro
//                   declarado da categoria (emblema: peito 152,206).
import type { CamadaId, CategoriaId, ParamsAsset } from '../domain/types';

export interface ParamDef {
  id: string;
  nome: string;
  min: number;
  max: number;
  passo: number;
  padrao: number;
}

/** §71 — primeiras entregas: aura (intensidade/velocidade) e emblema (escala).
 *  Óculos/headset/fundo/título entram quando houver arte paramétrica (F9/P11). */
export const PARAMS_POR_CATEGORIA: Partial<Record<CategoriaId, ParamDef[]>> = {
  aura: [
    { id: 'intensidade', nome: 'Intensidade', min: 0.25, max: 1, passo: 0.05, padrao: 1 },
    { id: 'velocidade', nome: 'Velocidade', min: 0.5, max: 2, passo: 0.1, padrao: 1 },
    { id: 'raio', nome: 'Raio', min: 0.7, max: 1.3, passo: 0.05, padrao: 1 }, // §150.1 (P4)
  ],
  emblema: [
    { id: 'escala', nome: 'Escala', min: 0.6, max: 1.5, passo: 0.05, padrao: 1 },
  ],
  // mega 64 (§166–§172): editores de MOLDURA e BANNER — intensidade usa o
  // wrapper genérico <g opacity>; escala fica de fora (deformaria o quadro)
  moldura: [
    { id: 'intensidade', nome: 'Intensidade', min: 0.3, max: 1, passo: 0.05, padrao: 1 },
  ],
  banner: [
    { id: 'intensidade', nome: 'Intensidade', min: 0.3, max: 1, passo: 0.05, padrao: 1 },
  ],
};

/** Centro geométrico para transformações de escala, por categoria (viewBox 240×240). */
const CENTRO_ESCALA: Partial<Record<CategoriaId, [number, number]>> = {
  emblema: [152, 206], // peito do busto — mesmo ponto do mapeamento corpo inteiro
  aura: [120, 120],    // §150.1: raio escala do CENTRO do palco
};

/** Categoria "dona" de uma chave de camada (acessorio_* → acessorio). */
export function categoriaDaCamada(chave: string): CategoriaId {
  return (chave.startsWith('acessorio') ? 'acessorio' : chave) as CategoriaId;
}

/** Defs de propriedades de uma camada (undefined = camada sem propriedades). */
export function paramsDaCamada(chave: string): ParamDef[] | undefined {
  return PARAMS_POR_CATEGORIA[categoriaDaCamada(chave)];
}

const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));

/**
 * Sanitiza os valores brutos de UMA camada (validarConfig §71):
 * chave desconhecida cai; valor não-numérico cai; numérico é grampeado
 * ao [min,max]; valor PADRÃO cai (não persiste). undefined = nada sobrou.
 */
export function sanitizarParams(chave: string, bruto: unknown): ParamsAsset | undefined {
  const defs = paramsDaCamada(chave);
  if (!defs || typeof bruto !== 'object' || bruto === null) return undefined;
  const saida: ParamsAsset = {};
  for (const def of defs) {
    const v = (bruto as Record<string, unknown>)[def.id];
    if (typeof v !== 'number' || !Number.isFinite(v)) continue;
    const g = clamp(v, def.min, def.max);
    if (g !== def.padrao) saida[def.id] = Math.round(g * 100) / 100;
  }
  return Object.keys(saida).length ? saida : undefined;
}

/** Reescala todos os `dur="Ns"` SMIL do fragmento (velocidade ×2 = metade do dur). */
function reescalarDur(svg: string, velocidade: number): string {
  return svg.replace(/dur="(\d+(?:\.\d+)?)s"/g, (_, n: string) => {
    const novo = Math.max(0.2, parseFloat(n) / velocidade);
    return `dur="${(Math.round(novo * 100) / 100)}s"`;
  });
}

/**
 * Aplica as propriedades ao fragmento SVG JÁ renderizado da camada.
 * Sem params (ou tudo padrão) devolve o fragmento INTACTO — byte-estável.
 * Grampeia na aplicação também (defesa em profundidade: o config pode
 * chegar aqui sem passar pelo validarConfig).
 */
export function aplicarParamsSvg(chave: CamadaId | string, svg: string, params?: ParamsAsset): string {
  if (!svg || !params) return svg;
  const defs = paramsDaCamada(chave);
  if (!defs) return svg;
  const valor = (id: string): number | undefined => {
    const def = defs.find((d) => d.id === id);
    const v = params[id];
    if (!def || typeof v !== 'number' || !Number.isFinite(v)) return undefined;
    const g = clamp(v, def.min, def.max);
    return g === def.padrao ? undefined : g;
  };

  let saida = svg;
  const velocidade = valor('velocidade');
  if (velocidade !== undefined) saida = reescalarDur(saida, velocidade);
  const escala = valor('escala') ?? valor('raio'); // raio (aura §150) = escala central
  if (escala !== undefined) {
    const [cx, cy] = CENTRO_ESCALA[categoriaDaCamada(chave)] ?? [120, 120];
    saida = `<g transform="translate(${cx} ${cy}) scale(${escala}) translate(${-cx} ${-cy})">${saida}</g>`;
  }
  const intensidade = valor('intensidade');
  if (intensidade !== undefined) {
    saida = `<g opacity="${intensidade}">${saida}</g>`;
  }
  return saida;
}
