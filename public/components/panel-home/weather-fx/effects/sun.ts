'use strict';
// =============================================================
// weather-fx / effects / sun — CÉU-LIMPO DIA. "No talo, mas elegante".
// 4 técnicas com MODERAÇÃO (na dúvida, menos): (1) céu azul cacheado
// (2) disco + glow radial cacheado (3) lens flare SUTIL (2-3 anéis) e
// god rays lentíssimos (4) poucas motas de luz douradas. Tudo respeita
// opacity (crossfade) e reduced-motion (congela movimento, mantém o
// quadro). Gradientes cacheados; god rays/motas são poucas primitivas.
// =============================================================
import { EffectBase, type EffectParams, type FxEnv } from '../engine/effect-base.js';
import { liveInc, liveDec } from './live-probe.js';
export const MODULE_ID = 'panel-home.weather-fx.effects.sun';
export const VERSION = '0.1.0-ETAPA4';

const N_RAYS = 8;          // feixes (poucos, macios)
const N_MOTES = 30;        // motas de luz (delicadas)

interface Mote { x: number; y: number; r: number; phase: number; spd: number; drift: number; }
function rand(a: number, b: number): number { return a + Math.random() * (b - a); }

export class SunEffect extends EffectBase {
  private ctx: CanvasRenderingContext2D | null = null;
  private w = 0; private h = 0;
  private sunX = 0; private sunY = 0; private coreR = 0;
  private rayAngle = 0;
  private motes: Mote[] = [];
  private counted = false;

  private skyGrad: CanvasGradient | null = null;
  private glowGrad: CanvasGradient | null = null;

  constructor(_params?: EffectParams) {
    super('sun');
    liveInc(); this.counted = true;
  }

  init(ctx: CanvasRenderingContext2D, env: FxEnv): void {
    this.ctx = ctx;
    this._build(env);
    for (let i = 0; i < N_MOTES; i++) {
      this.motes.push({ x: rand(0, env.width || 1), y: rand(0, env.height || 1), r: rand(0.8, 2.2), phase: rand(0, Math.PI * 2), spd: rand(6, 16), drift: rand(-6, 6) });
    }
  }

  update(dt: number, env: FxEnv): void {
    if (env.width !== this.w || env.height !== this.h) this._build(env);
    if (env.reducedMotion) return;                 // congela raios+motas (mantém o quadro)
    this.rayAngle += dt * 0.03;                     // rotação quase imperceptível
    for (const m of this.motes) {
      m.y -= m.spd * dt; m.x += m.drift * dt; m.phase += dt * 1.6;
      if (m.y < -4) { m.y = this.h + 4; m.x = rand(0, this.w); }
    }
  }

  render(ctx: CanvasRenderingContext2D, env: FxEnv, opacity: number): void {
    const W = this.w, H = this.h;
    ctx.save();
    ctx.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);

    // 1) céu
    ctx.globalAlpha = opacity;
    if (this.skyGrad) { ctx.fillStyle = this.skyGrad; ctx.fillRect(0, 0, W, H); }

    // 2) god rays (feixes macios, aditivos, alpha baixo) — atrás do disco
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(this.sunX, this.sunY);
    ctx.rotate(this.rayAngle);
    const rayLen = Math.hypot(W, H);
    for (let i = 0; i < N_RAYS; i++) {
      ctx.rotate((Math.PI * 2) / N_RAYS);
      const g = ctx.createLinearGradient(0, 0, rayLen, 0);
      g.addColorStop(0, 'rgba(255,236,180,' + (0.05 * opacity).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(255,236,180,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.lineTo(rayLen, -rayLen * 0.045); ctx.lineTo(rayLen, rayLen * 0.045);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    // 3) glow + disco do sol
    if (this.glowGrad) {
      ctx.globalAlpha = opacity;
      ctx.fillStyle = this.glowGrad;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.globalAlpha = opacity;
    ctx.beginPath(); ctx.arc(this.sunX, this.sunY, this.coreR, 0, Math.PI * 2);
    ctx.fillStyle = '#fff6df'; ctx.fill();

    // 4) lens flare SUTIL — 2 a 3 anéis na diagonal sol→canto oposto
    const dx = (W * 0.5 - this.sunX), dy = (H * 0.5 - this.sunY);
    const flares = [{ t: 0.9, r: this.coreR * 0.9, a: 0.10 }, { t: 1.5, r: this.coreR * 1.5, a: 0.06 }, { t: 2.1, r: this.coreR * 0.6, a: 0.05 }];
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const f of flares) {
      const fx = this.sunX + dx * f.t, fy = this.sunY + dy * f.t;
      const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, f.r);
      fg.addColorStop(0, 'rgba(255,240,200,' + (f.a * opacity).toFixed(3) + ')');
      fg.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(fx, fy, f.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    // 5) motas de luz (poucas, cintilar leve)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const m of this.motes) {
      const tw = 0.5 + 0.5 * Math.sin(m.phase);
      ctx.globalAlpha = 0.35 * tw * opacity;
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fillStyle = '#ffe9a8'; ctx.fill();
    }
    ctx.restore();

    ctx.restore();
  }

  destroy(): void {
    if (this.counted) { this.counted = false; liveDec(); }
    this.motes.length = 0; this.skyGrad = null; this.glowGrad = null; this.ctx = null;
  }

  private _build(env: FxEnv): void {
    if (!this.ctx) return;
    this.w = env.width; this.h = env.height;
    this.sunX = this.w * 0.74; this.sunY = this.h * 0.26;
    this.coreR = Math.max(10, Math.min(this.w, this.h) * 0.045);
    // céu: azul mais profundo no topo, mais claro embaixo/junto ao sol
    const sky = this.ctx.createLinearGradient(0, 0, 0, this.h || 1);
    sky.addColorStop(0, '#2b6bb0'); sky.addColorStop(0.5, '#4b8fd0'); sky.addColorStop(1, '#8fc0e8');
    this.skyGrad = sky;
    // glow difuso do sol (radial, decai)
    const gr = Math.max(this.w, this.h) * 0.55;
    const glow = this.ctx.createRadialGradient(this.sunX, this.sunY, this.coreR * 0.6, this.sunX, this.sunY, gr);
    glow.addColorStop(0, 'rgba(255,244,205,0.85)'); glow.addColorStop(0.18, 'rgba(255,232,170,0.45)');
    glow.addColorStop(0.5, 'rgba(255,224,150,0.12)'); glow.addColorStop(1, 'rgba(255,224,150,0)');
    this.glowGrad = glow;
  }
}
export default SunEffect;
