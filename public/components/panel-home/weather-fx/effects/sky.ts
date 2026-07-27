'use strict';
// =============================================================
// weather-fx / effects / sky — EFEITO NULO da Etapa 1.
// Só um gradiente de céu (sem clima, sem partículas). Serve pra
// provar que o engine monta, roda o loop e limpa sem vazar. Já
// implementa o contrato EffectBase completo (init/render/destroy)
// e a variante dia/noite via env.isDay.
// =============================================================
import { EffectBase, type FxEnv } from '../engine/effect-base.js';
export const MODULE_ID = 'panel-home.weather-fx.effects.sky';
export const VERSION = '0.1.0-ETAPA1';

export class SkyEffect extends EffectBase {
  private grad: CanvasGradient | null = null;
  private w = 0; private h = 0; private day = true;

  constructor() { super('sky'); }

  init(ctx: CanvasRenderingContext2D, env: FxEnv): void { this.build(ctx, env); }

  // gradiente pré-renderizado (cacheado entre frames; só refaz em resize / troca dia-noite)
  private build(ctx: CanvasRenderingContext2D, env: FxEnv): void {
    this.w = env.width; this.h = env.height; this.day = env.isDay;
    const g = ctx.createLinearGradient(0, 0, 0, env.height || 1);
    if (env.isDay) {
      g.addColorStop(0, '#2b3a52'); g.addColorStop(0.55, '#33465f'); g.addColorStop(1, '#3d5169');
    } else {
      g.addColorStop(0, '#141b28'); g.addColorStop(0.55, '#1b2436'); g.addColorStop(1, '#232f44');
    }
    this.grad = g;
  }

  render(ctx: CanvasRenderingContext2D, env: FxEnv, opacity: number): void {
    if (!this.grad || env.width !== this.w || env.height !== this.h || env.isDay !== this.day) {
      this.build(ctx, env);
    }
    ctx.save();
    ctx.globalAlpha = opacity;                 // multiplicador de crossfade
    ctx.fillStyle = this.grad as CanvasGradient;
    ctx.fillRect(0, 0, env.width, env.height);
    ctx.restore();
  }

  destroy(): void { this.grad = null; }        // sem pools/listeners — nada a vazar
}
export default SkyEffect;
