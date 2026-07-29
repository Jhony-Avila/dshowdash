// engine/base-api.ts — contrato interno entre o motor e as partes de arte.
// @version 1.0.0  @created 2026-07-29
//
// Cada item do catálogo carrega sua própria função de render (string SVG pura).
// `uid` prefixa TODOS os ids de <defs> — vários avatares na mesma página
// (preview, comparação, presets) não podem colidir gradientes.
import type { ItemCatalogo, PoseId } from '../domain/types';
import type { Paleta } from './cores';

/** Gera o markup SVG da parte. Determinístico: mesma entrada → mesmo SVG. */
export type ParteRender = (p: Paleta, uid: string) => string;

export interface ParteDef extends ItemCatalogo {
  /** Efeitos com atras=true renderizam ATRÁS do personagem (aura, chuva digital). */
  atras?: boolean;
  /** Pose frontal (padrão). */
  render: ParteRender;
  /**
   * Variantes de pose futuras (AS3 decisão #23) — o motor usa 'frontal' hoje;
   * quando ¾/lateral/poder existirem, o resolvedor escolhe pela pose pedida.
   */
  variantes?: Partial<Record<PoseId, ParteRender>>;
}

// ── Geometria compartilhada (todas as partes se ancoram aqui) ───────
// Canvas 240×240. Personagem centrado; cabeça elíptica; ombros na borda inferior.
export const G = {
  lado: 240,
  cx: 120,
  cabecaCy: 106,
  cabecaRx: 50,
  cabecaRy: 57,
  topoCabeca: 49,
  olhoEsqX: 100,
  olhoDirX: 140,
  olhosY: 108,
  bocaY: 146,
  orelhaY: 112,
} as const;

/** Ombros/torso padrão — as roupas partem deste path. */
export const PATH_OMBROS =
  'M36 240 v-12 c0 -28 36 -46 84 -46 s84 18 84 46 v12 z';

/** Pescoço padrão — desenhado pela BASE, coberto pela roupa. */
export const PATH_PESCOCO =
  'M103 146 h34 v40 c0 9 -34 9 -34 0 z';
