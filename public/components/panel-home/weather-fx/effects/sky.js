import { EffectBase } from "../engine/effect-base.js";
const MODULE_ID = "panel-home.weather-fx.effects.sky";
const VERSION = "0.1.0-ETAPA1";
class SkyEffect extends EffectBase {
  grad = null;
  w = 0;
  h = 0;
  day = true;
  constructor() {
    super("sky");
  }
  init(ctx, env) {
    this.build(ctx, env);
  }
  // gradiente pré-renderizado (cacheado entre frames; só refaz em resize / troca dia-noite)
  build(ctx, env) {
    this.w = env.width;
    this.h = env.height;
    this.day = env.isDay;
    const g = ctx.createLinearGradient(0, 0, 0, env.height || 1);
    if (env.isDay) {
      g.addColorStop(0, "#2b3a52");
      g.addColorStop(0.55, "#33465f");
      g.addColorStop(1, "#3d5169");
    } else {
      g.addColorStop(0, "#141b28");
      g.addColorStop(0.55, "#1b2436");
      g.addColorStop(1, "#232f44");
    }
    this.grad = g;
  }
  render(ctx, env, opacity) {
    if (!this.grad || env.width !== this.w || env.height !== this.h || env.isDay !== this.day) {
      this.build(ctx, env);
    }
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = this.grad;
    ctx.fillRect(0, 0, env.width, env.height);
    ctx.restore();
  }
  destroy() {
    this.grad = null;
  }
  // sem pools/listeners — nada a vazar
}
var sky_default = SkyEffect;
export {
  MODULE_ID,
  SkyEffect,
  VERSION,
  sky_default as default
};
