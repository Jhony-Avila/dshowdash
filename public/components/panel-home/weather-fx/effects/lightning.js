import { EffectBase } from "../engine/effect-base.js";
import { liveInc, liveDec } from "./live-probe.js";
const MODULE_ID = "panel-home.weather-fx.effects.lightning";
const VERSION = "0.1.0-ETAPA5";
const MIN_GAP = 4.5, MAX_GAP = 9;
const FLASH_DUR = 0.22;
function rand(a, b) {
  return a + Math.random() * (b - a);
}
class LightningEffect extends EffectBase {
  w = 0;
  h = 0;
  isDay = true;
  counted = false;
  timer = rand(MIN_GAP, MAX_GAP) * 0.5;
  // 1º raio não demora tanto
  pulses = [];
  // até 2 (piscar duplo)
  bolt = null;
  boltAge = 0;
  maxA = 0.55;
  constructor(params) {
    super("lightning");
    if (params && typeof params.isDay === "boolean") this.isDay = params.isDay;
    this.maxA = this.isDay ? 0.5 : 0.62;
    liveInc();
    this.counted = true;
  }
  setParams(params) {
    super.setParams(params);
    if (typeof params.isDay === "boolean") {
      this.isDay = params.isDay;
      this.maxA = this.isDay ? 0.5 : 0.62;
    }
  }
  init(_ctx, env) {
    this.w = env.width;
    this.h = env.height;
  }
  // Dispara um clarão IMEDIATO (usado pelo "momento herói" da intro na tempestade).
  // Só se não houver clarão em curso (respeita o teto anti-estroboscópio) e reseta o
  // gap p/ o ritmo ambiente normal. reduced-motion é tratado no update() (limpa pulsos).
  strike() {
    if (this.pulses.length !== 0) return;
    this._strike();
    this.timer = rand(MIN_GAP, MAX_GAP);
  }
  update(dt, env) {
    this.w = env.width;
    this.h = env.height;
    if (env.reducedMotion) {
      this.pulses.length = 0;
      this.bolt = null;
      return;
    }
    this.timer -= dt;
    if (this.pulses.length) {
      let k = 0;
      for (let i = 0; i < this.pulses.length; i++) {
        const p = this.pulses[i];
        p.age += dt;
        if (p.age < p.dur) this.pulses[k++] = p;
      }
      this.pulses.length = k;
    }
    if (this.bolt) {
      this.boltAge += dt;
      if (this.boltAge > 0.12) this.bolt = null;
    }
    if (this.timer <= 0 && this.pulses.length === 0) {
      this._strike();
      this.timer = rand(MIN_GAP, MAX_GAP);
    }
  }
  render(ctx, env, opacity) {
    if (this.pulses.length === 0) return;
    const W = this.w, H = this.h;
    let a = 0;
    for (let i = 0; i < this.pulses.length; i++) {
      const p = this.pulses[i];
      if (p.age < 0) continue;
      const t = 1 - p.age / p.dur;
      a += p.max * t * t;
    }
    if (a <= 1e-3) return;
    if (a > this.maxA) a = this.maxA;
    ctx.save();
    ctx.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);
    ctx.globalAlpha = a * opacity;
    ctx.fillStyle = "rgb(224,232,255)";
    ctx.fillRect(0, 0, W, H);
    if (this.bolt && this.boltAge < 0.12) {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = Math.min(1, a / this.maxA) * opacity;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const b = this.bolt;
      ctx.strokeStyle = "rgba(235,242,255,0.95)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(b[0], b[1]);
      for (let i = 2; i < b.length; i += 2) ctx.lineTo(b[i], b[i + 1]);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }
    ctx.restore();
  }
  destroy() {
    if (this.counted) {
      this.counted = false;
      liveDec();
    }
    this.pulses.length = 0;
    this.bolt = null;
  }
  _strike() {
    this.pulses.push({ age: 0, dur: FLASH_DUR, max: this.maxA });
    if (Math.random() < 0.45) this.pulses.push({ age: -0.1, dur: 0.12, max: this.maxA * 0.7 });
    if (Math.random() < 0.6) this._buildBolt();
    else this.bolt = null;
    this.boltAge = 0;
  }
  _buildBolt() {
    const pts = [];
    let x = rand(this.w * 0.2, this.w * 0.8), y = 0;
    const segH = this.h / (10 + Math.floor(rand(0, 5)));
    pts.push(x, y);
    while (y < this.h * 0.66) {
      y += segH;
      x += rand(-28, 28);
      pts.push(x, y);
    }
    this.bolt = pts;
  }
}
var lightning_default = LightningEffect;
export {
  LightningEffect,
  MODULE_ID,
  VERSION,
  lightning_default as default
};
