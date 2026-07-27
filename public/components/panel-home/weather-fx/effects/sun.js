import { EffectBase } from "../engine/effect-base.js";
import { liveInc, liveDec } from "./live-probe.js";
const MODULE_ID = "panel-home.weather-fx.effects.sun";
const VERSION = "0.1.0-ETAPA4";
const N_RAYS = 8;
const N_MOTES = 30;
function rand(a, b) {
  return a + Math.random() * (b - a);
}
class SunEffect extends EffectBase {
  ctx = null;
  w = 0;
  h = 0;
  sunX = 0;
  sunY = 0;
  coreR = 0;
  rayAngle = 0;
  motes = [];
  counted = false;
  skyGrad = null;
  glowGrad = null;
  constructor(_params) {
    super("sun");
    liveInc();
    this.counted = true;
  }
  init(ctx, env) {
    this.ctx = ctx;
    this._build(env);
    for (let i = 0; i < N_MOTES; i++) {
      this.motes.push({ x: rand(0, env.width || 1), y: rand(0, env.height || 1), r: rand(0.8, 2.2), phase: rand(0, Math.PI * 2), spd: rand(6, 16), drift: rand(-6, 6) });
    }
  }
  update(dt, env) {
    if (env.width !== this.w || env.height !== this.h) this._build(env);
    if (env.reducedMotion) return;
    this.rayAngle += dt * 0.03;
    for (const m of this.motes) {
      m.y -= m.spd * dt;
      m.x += m.drift * dt;
      m.phase += dt * 1.6;
      if (m.y < -4) {
        m.y = this.h + 4;
        m.x = rand(0, this.w);
      }
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
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.translate(this.sunX, this.sunY);
    ctx.rotate(this.rayAngle);
    const rayLen = Math.hypot(W, H);
    for (let i = 0; i < N_RAYS; i++) {
      ctx.rotate(Math.PI * 2 / N_RAYS);
      const g = ctx.createLinearGradient(0, 0, rayLen, 0);
      g.addColorStop(0, "rgba(255,236,180," + (0.05 * opacity).toFixed(3) + ")");
      g.addColorStop(1, "rgba(255,236,180,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(rayLen, -rayLen * 0.045);
      ctx.lineTo(rayLen, rayLen * 0.045);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    if (this.glowGrad) {
      ctx.globalAlpha = opacity;
      ctx.fillStyle = this.glowGrad;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.globalAlpha = opacity;
    ctx.beginPath();
    ctx.arc(this.sunX, this.sunY, this.coreR, 0, Math.PI * 2);
    ctx.fillStyle = "#fff6df";
    ctx.fill();
    const dx = W * 0.5 - this.sunX, dy = H * 0.5 - this.sunY;
    const flares = [{ t: 0.9, r: this.coreR * 0.9, a: 0.1 }, { t: 1.5, r: this.coreR * 1.5, a: 0.06 }, { t: 2.1, r: this.coreR * 0.6, a: 0.05 }];
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const f of flares) {
      const fx = this.sunX + dx * f.t, fy = this.sunY + dy * f.t;
      const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, f.r);
      fg.addColorStop(0, "rgba(255,240,200," + (f.a * opacity).toFixed(3) + ")");
      fg.addColorStop(1, "rgba(255,240,200,0)");
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.arc(fx, fy, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const m of this.motes) {
      const tw = 0.5 + 0.5 * Math.sin(m.phase);
      ctx.globalAlpha = 0.35 * tw * opacity;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fillStyle = "#ffe9a8";
      ctx.fill();
    }
    ctx.restore();
    ctx.restore();
  }
  destroy() {
    if (this.counted) {
      this.counted = false;
      liveDec();
    }
    this.motes.length = 0;
    this.skyGrad = null;
    this.glowGrad = null;
    this.ctx = null;
  }
  _build(env) {
    if (!this.ctx) return;
    this.w = env.width;
    this.h = env.height;
    this.sunX = this.w * 0.74;
    this.sunY = this.h * 0.26;
    this.coreR = Math.max(10, Math.min(this.w, this.h) * 0.045);
    const sky = this.ctx.createLinearGradient(0, 0, 0, this.h || 1);
    sky.addColorStop(0, "#2b6bb0");
    sky.addColorStop(0.5, "#4b8fd0");
    sky.addColorStop(1, "#8fc0e8");
    this.skyGrad = sky;
    const gr = Math.max(this.w, this.h) * 0.55;
    const glow = this.ctx.createRadialGradient(this.sunX, this.sunY, this.coreR * 0.6, this.sunX, this.sunY, gr);
    glow.addColorStop(0, "rgba(255,244,205,0.85)");
    glow.addColorStop(0.18, "rgba(255,232,170,0.45)");
    glow.addColorStop(0.5, "rgba(255,224,150,0.12)");
    glow.addColorStop(1, "rgba(255,224,150,0)");
    this.glowGrad = glow;
  }
}
var sun_default = SunEffect;
export {
  MODULE_ID,
  SunEffect,
  VERSION,
  sun_default as default
};
