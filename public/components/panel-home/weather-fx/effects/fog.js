import { EffectBase } from "../engine/effect-base.js";
import { liveInc, liveDec } from "./live-probe.js";
const MODULE_ID = "panel-home.weather-fx.effects.fog";
const VERSION = "0.1.0-ETAPA5";
const TILE = 220;
function rand(a, b) {
  return a + Math.random() * (b - a);
}
const SKY = {
  day: ["#c4ccd2", "#b3bcc4", "#a7b1ba"],
  night: ["#0f151f", "#141b28", "#1b2433"]
};
class FogEffect extends EffectBase {
  ctx = null;
  w = 0;
  h = 0;
  isDay = true;
  counted = false;
  // 3 camadas: perto (blobs grandes, rápida) → longe (pequenos, lenta) = profundidade
  layers = [
    { tile: "near", sx: 0, sy: 0, vx: 40, vy: 6, alpha: 0.5 },
    { tile: "far", sx: 0, sy: 0, vx: 26, vy: -4, alpha: 0.42 },
    { tile: "far", sx: 0, sy: 0, vx: 14, vy: 5, alpha: 0.34 }
  ];
  skyGrad = null;
  fogNear = null;
  // blobs grandes/densos (primeiro plano)
  fogFar = null;
  // pequenos/ralos (fundo)
  wallGrad = null;
  constructor(params) {
    super("fog");
    if (params && typeof params.isDay === "boolean") this.isDay = params.isDay;
    liveInc();
    this.counted = true;
  }
  setParams(params) {
    super.setParams(params);
    if (typeof params.isDay === "boolean") this.isDay = params.isDay;
  }
  init(ctx, env) {
    this.ctx = ctx;
    this.fogNear = this._buildFog(ctx, "near");
    this.fogFar = this._buildFog(ctx, "far");
    this._build(env);
  }
  update(dt, env) {
    if (env.width !== this.w || env.height !== this.h) this._build(env);
    if (env.reducedMotion) return;
    for (const L of this.layers) {
      L.sx += L.vx * dt;
      L.sy += L.vy * dt;
    }
  }
  render(ctx, env, opacity) {
    const W = this.w, H = this.h;
    ctx.save();
    ctx.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);
    ctx.globalAlpha = opacity;
    if (this.skyGrad) {
      ctx.fillStyle = this.skyGrad;
      ctx.fillRect(0, 0, W, H);
    }
    for (const L of this.layers) {
      const pat = L.tile === "near" ? this.fogNear : this.fogFar;
      if (!pat) continue;
      const ox = (L.sx % TILE + TILE) % TILE;
      const oy = (L.sy % TILE + TILE) % TILE;
      ctx.save();
      ctx.globalAlpha = L.alpha * opacity;
      ctx.translate(ox, oy);
      ctx.fillStyle = pat;
      ctx.fillRect(-ox, -oy, W, H);
      ctx.restore();
    }
    if (this.wallGrad) {
      ctx.globalAlpha = opacity;
      ctx.fillStyle = this.wallGrad;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }
  destroy() {
    if (this.counted) {
      this.counted = false;
      liveDec();
    }
    this.layers.length = 0;
    this.skyGrad = null;
    this.fogNear = null;
    this.fogFar = null;
    this.wallGrad = null;
    this.ctx = null;
  }
  _build(env) {
    if (!this.ctx) return;
    this.w = env.width;
    this.h = env.height;
    const pal = this.isDay ? SKY.day : SKY.night;
    const g = this.ctx.createLinearGradient(0, 0, 0, this.h || 1);
    g.addColorStop(0, pal[0]);
    g.addColorStop(0.55, pal[1]);
    g.addColorStop(1, pal[2]);
    this.skyGrad = g;
    const c = this.isDay ? "255,255,255" : "150,170,200";
    const w = this.ctx.createRadialGradient(this.w * 0.5, this.h * 0.5, 0, this.w * 0.5, this.h * 0.5, Math.max(this.w, this.h) * 0.75);
    w.addColorStop(0, "rgba(" + c + ",0.06)");
    w.addColorStop(0.5, "rgba(" + c + ",0.03)");
    w.addColorStop(1, "rgba(" + c + ",0)");
    this.wallGrad = w;
  }
  _buildFog(ctx, kind) {
    const c = document.createElement("canvas");
    c.width = TILE;
    c.height = TILE;
    const f = c.getContext("2d");
    const col = this.isDay ? "235,240,245" : "120,140,170";
    const count = kind === "near" ? 14 : 42;
    const rMin = kind === "near" ? TILE * 0.2 : TILE * 0.06;
    const rMax = kind === "near" ? TILE * 0.45 : TILE * 0.16;
    const aMin = kind === "near" ? 0.1 : 0.06;
    const aMax = kind === "near" ? 0.24 : 0.13;
    for (let i = 0; i < count; i++) {
      const x = rand(0, TILE), y = rand(0, TILE), r = rand(rMin, rMax), a = rand(aMin, aMax);
      for (let gx = -1; gx <= 1; gx++) for (let gy = -1; gy <= 1; gy++) {
        const bx = x + gx * TILE, by = y + gy * TILE;
        const g = f.createRadialGradient(bx, by, 0, bx, by, r);
        g.addColorStop(0, "rgba(" + col + "," + a.toFixed(3) + ")");
        g.addColorStop(1, "rgba(" + col + ",0)");
        f.fillStyle = g;
        f.beginPath();
        f.arc(bx, by, r, 0, Math.PI * 2);
        f.fill();
      }
    }
    return ctx.createPattern(c, "repeat");
  }
}
var fog_default = FogEffect;
export {
  FogEffect,
  MODULE_ID,
  VERSION,
  fog_default as default
};
