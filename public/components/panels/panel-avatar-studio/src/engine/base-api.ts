// engine/base-api.ts — contrato interno entre o motor e as partes de arte.
// @version 1.0.0  @created 2026-07-29
//
// Cada item do catálogo carrega sua própria função de render (string SVG pura).
// `uid` prefixa TODOS os ids de <defs> — vários avatares na mesma página
// (preview, comparação, presets) não podem colidir gradientes.
import type { ItemCatalogo, PoseId } from '../domain/types';
import type { Paleta } from './cores';
import type { PerfilCorpo2D } from './partes/corpo';

/** Gera o markup SVG da parte. Determinístico: mesma entrada → mesmo SVG.
 *  Golden V2 (#219): 3º arg OPCIONAL `perfil` — só o corpo-inteiro premium o
 *  passa (renderCorpoV2 veste a anatomia certa); busto/legado ignoram. */
export type ParteRender = (p: Paleta, uid: string, perfil?: PerfilCorpo2D) => string;

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
  /**
   * Sobreposição no CORPO INTEIRO (240×400): detalhes da peça desenhados
   * sobre o scaffold do torso (gola, gravata, zíper, obi, núcleo…). Sem
   * isto a roupa só muda a COR do corpo — feedback do Jhony na validação.
   * Região útil do torso: x 86–154, y 108–218 (braços são grupos à parte).
   */
  renderCorpo?: ParteRender;

  // ── onda 1411 (MEGA_BRIEFING_01 §2381–§2427, decisão #159): trilho
  // CLASSIC PREMIUM — hooks OPCIONAIS consumidos SÓ com opcoes.premium
  // (flag as6.classico_premium + config.acabamento === 'premium').
  // Parte sem os hooks / premium desligado ⇒ SVG byte a byte o de sempre. ──
  /** Marca de trilho: asset autorado no padrão premium (IDs `_px_`, #166). */
  acabamento?: 'premium';
  /** Fragmento ATRÁS da figura inteira (halo de luz, volume de fundo). */
  renderAtras?: ParteRender;
  /** Fragmento NA FRENTE de todas as camadas (fios soltos, brilho de lente). */
  renderFrente?: ParteRender;
  /** SOMBRA DE CONTATO própria (pintada antes da figura, por cima do fundo);
   *  ausente + premium ⇒ o motor pinta a sombra de contato PADRÃO. */
  renderSombra?: ParteRender;
  /** Planos extras no CORPO INTEIRO/palco (parallax §2427): atrás do
   *  personagem e à frente dele — mesmas coordenadas dos planos do render. */
  renderPlanos?: { atras?: ParteRender; frente?: ParteRender };

  // ── onda 1415 (#191): vestuário premium no CORPO INTEIRO ──
  /** SILHUETA PRÓPRIA no corpo inteiro (240×400): desenhada POR CIMA do
   *  torso do scaffold, cobrindo-o (o `corpoInteiro` continua intocado —
   *  a peça é quem tem a forma). Consumido SÓ com opcoes.premium no lugar
   *  do `renderCorpo`; sem o hook / sem premium ⇒ caminho de sempre. */
  renderCorpoV2?: ParteRender;
  /** onda 1415 (#191): TOKEN de material dominante da peça (metadado para
   *  a UI — swatch de material; a arte já consome via materiais2d). */
  materialToken?: import('./materiais2d').MaterialToken2d;
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
