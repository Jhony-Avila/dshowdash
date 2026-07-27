import { EffectBase } from "../engine/effect-base.js";
import { liveInc, liveDec } from "./live-probe.js";
const MODULE_ID = "panel-home.weather-fx.effects.clouds";
const VERSION = "0.1.0-ETAPA5";
function rand(a, b) {
  return a + Math.random() * (b - a);
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
const SKY = {
  overcastDay: ["#8c98a3", "#7e8b96", "#71808b"],
  // céu mais escuro -> nuvem clara "lê" a forma
  overcastNight: ["#161c26", "#1b2330", "#212b3b"]
};
class CloudEffect extends EffectBase {
  ctx = null;
  w = 0;
  h = 0;
  isDay = true;
  overlay = false;
  coverage = 0.6;
  counted = false;
  clouds = [];
  puffSprite = null;
  skyGrad = null;
  constructor(params) {
    super("clouds");
    if (params) {
      if (typeof params.isDay === "boolean") this.isDay = params.isDay;
      if (typeof params.overlay === "boolean") this.overlay = params.overlay;
      if (typeof params.coverage === "number") this.coverage = params.coverage;
    }
    liveInc();
    this.counted = true;
  }
  setParams(params) {
    super.setParams(params);
    if (typeof params.isDay === "boolean") this.isDay = params.isDay;
    if (typeof params.overlay === "boolean") this.overlay = params.overlay;
    if (typeof params.coverage === "number") this.coverage = params.coverage;
  }
  init(ctx, env) {
    this.ctx = ctx;
    this.puffSprite = this._buildPuff();
    this._build(env);
  }
  update(dt, env) {
    if (env.width !== this.w || env.height !== this.h) this._build(env);
    if (env.reducedMotion) return;
    for (const c of this.clouds) {
      c.x += c.speed * dt;
      if (c.x - c.span > this.w) c.x = -c.span;
    }
  }
  render(ctx, env, opacity) {
    const W = this.w, H = this.h;
    ctx.save();
    ctx.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);
    if (!this.overlay && this.skyGrad) {
      ctx.globalAlpha = opacity;
      ctx.fillStyle = this.skyGrad;
      ctx.fillRect(0, 0, W, H);
    }
    const spr = this.puffSprite;
    if (spr) {
      for (const c of this.clouds) {
        ctx.globalAlpha = c.alpha * opacity;
        for (const p of c.puffs) {
          const r = p.r * c.scale, d = r * 2;
          ctx.drawImage(spr, c.x + p.dx * c.scale - r, c.y + p.dy * c.scale - r, d, d);
        }
      }
    }
    ctx.restore();
  }
  destroy() {
    if (this.counted) {
      this.counted = false;
      liveDec();
    }
    this.clouds.length = 0;
    this.puffSprite = null;
    this.skyGrad = null;
    this.ctx = null;
  }
  _build(env) {
    if (!this.ctx) return;
    this.w = env.width;
    this.h = env.height;
    if (!this.overlay) {
      const pal = this.isDay ? SKY.overcastDay : SKY.overcastNight;
      const g = this.ctx.createLinearGradient(0, 0, 0, this.h || 1);
      g.addColorStop(0, pal[0]);
      g.addColorStop(0.55, pal[1]);
      g.addColorStop(1, pal[2]);
      this.skyGrad = g;
    } else {
      this.skyGrad = null;
    }
    this._seed();
  }
  _seed() {
    this.clouds.length = 0;
    const n = Math.max(2, Math.round(lerp(2, 9, this.coverage)));
    const baseAlpha = lerp(0.28, 0.7, this.coverage);
    for (let i = 0; i < n; i++) {
      const scale = rand(0.8, 1.6);
      const npuffs = 3 + Math.floor(rand(0, 4));
      const puffs = [];
      let span = 0;
      for (let p = 0; p < npuffs; p++) {
        const dx = rand(-70, 70), dy = rand(-22, 22), r = rand(34, 64);
        puffs.push({ dx, dy, r });
        span = Math.max(span, Math.abs(dx) + r);
      }
      this.clouds.push({
        x: rand(0, this.w),
        y: rand(this.h * 0.08, this.h * 0.62),
        scale,
        speed: rand(4, 12) * (this.overlay ? 1.1 : 1.6),
        // nublado deriva visível (era 0.8)
        alpha: baseAlpha * rand(0.85, 1.1),
        span: span * scale,
        puffs
      });
    }
  }
  _buildPuff() {
    const s = 128, c = document.createElement("canvas");
    c.width = s;
    c.height = s;
    const d = c.getContext("2d");
    const col = this.overlay ? this.isDay ? "248,250,253" : "70,80,98" : this.isDay ? "206,214,222" : "150,162,182";
    const g = d.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    if (this.overlay) {
      g.addColorStop(0, "rgba(" + col + ",0.9)");
      g.addColorStop(0.5, "rgba(" + col + ",0.5)");
      g.addColorStop(1, "rgba(" + col + ",0)");
    } else {
      g.addColorStop(0, "rgba(" + col + ",0.98)");
      g.addColorStop(0.6, "rgba(" + col + ",0.9)");
      g.addColorStop(0.82, "rgba(" + col + ",0.5)");
      g.addColorStop(1, "rgba(" + col + ",0)");
    }
    d.fillStyle = g;
    d.beginPath();
    d.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2);
    d.fill();
    return c;
  }
}
var clouds_default = CloudEffect;
export {
  CloudEffect,
  MODULE_ID,
  VERSION,
  clouds_default as default
};
