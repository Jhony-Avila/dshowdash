'use strict';
// =============================================================
// weather-fx / engine / effect-base
// Contrato GENÉRICO de efeito visual de clima — agnóstico ao tipo.
// Serve partículas (chuva/neve), gradientes (céu/sol), sprites
// (lua/estrelas), nuvens, névoa e relâmpago. Um EffectModule é uma
// CAMADA que o compositor atualiza (update) e desenha (render) com
// uma OPACITY — é isso que habilita o crossfade da Etapa 2.
// =============================================================
export const MODULE_ID = 'panel-home.weather-fx.engine.effect-base';
export const VERSION = '0.1.0-ETAPA1';

// Ambiente do frame, passado a cada update/render. Mutável e reusado
// pelo engine (sem alocar por frame).
export interface FxEnv {
  width: number;         // px CSS
  height: number;        // px CSS
  dpr: number;           // supersample atual (governor)
  isDay: boolean;        // variante dia/noite
  reducedMotion: boolean;
  timeScale: number;     // 1 normal; <1 em reduced-motion
  densityScale: number;  // 0.4..1 — teto de partículas do governor
}

export interface EffectParams {
  intensity?: number;    // 0..1 (garoa→temporal, densidade de nuvem, etc.)
  isDay?: boolean;
  [k: string]: unknown;
}

// Base CONCRETA com no-ops — cada efeito estende e sobrescreve só o
// que usa. Interfaces são apagadas no transpile (type-only).
export class EffectBase {
  readonly id: string;
  protected params: EffectParams = {};
  constructor(id: string) { this.id = id; }

  // aloca pools / pré-renderiza sprites / cria gradientes (uma vez)
  init(_ctx: CanvasRenderingContext2D, _env: FxEnv): void { /* no-op */ }

  // avança a simulação — delta-time, independente de framerate
  update(_dt: number, _env: FxEnv): void { /* no-op */ }

  // desenha aplicando opacity (0..1) — o compositor usa no crossfade
  render(_ctx: CanvasRenderingContext2D, _env: FxEnv, _opacity: number): void { /* no-op */ }

  // reconfigura em runtime (intensidade, dia/noite…)
  setParams(params: EffectParams): void { this.params = { ...this.params, ...params }; }

  // libera pools, listeners, timers — REGRA ANTI-LEAK. Idempotente.
  destroy(): void { /* no-op */ }
}
export default EffectBase;
