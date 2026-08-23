// domain/corpo102.ts — onda 1422 (#210): TABELA §102 do corpo — números
// CANÔNICOS [largura, altura] por tipo corporal, na camada de DOMÍNIO
// para o engine 2D (wrapper §102), o Renderizador3d (escala §412) e a
// Body API (services/Corpo3d) lerem da MESMA fonte. Antes vivia
// triplicada (engine/render.ts, Renderizador3d e espelho PHP). Mudar
// um número = decisão numerada + goldens regravados (#83).
// @version 1.0.0  @created 2026-08-22
import type { TipoCorporal } from './types';

export const PRESETS_CORPO: Record<TipoCorporal, [number, number]> = {
  esbelto: [0.95, 1.02], atletico: [1.05, 1], robusto: [1.1, 0.98], compacto: [0.97, 0.94],
  // Golden V3.1 (#219): perfil FEMININO explícito — sobrevive validarConfig
  // (bug V3: 'feminino' era descartado por não estar no enum). Escala 3D suave.
  feminino: [0.94, 1.0],
};
