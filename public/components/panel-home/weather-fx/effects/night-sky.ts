'use strict';
// =============================================================
// weather-fx / effects / night-sky — CÉU-LIMPO NOITE. Efeito INTEIRO
// diferente do sol (não é só paleta): estrelas cintilando (pooling,
// cintilar dessincronizado), via-láctea sutil (faixa diagonal difusa +
// estrelas mais densas), lua com glow/halo + sombreado. Respeita opacity
// (crossfade) e reduced-motion (congela cintilar, mantém o quadro).
// Céu, via-láctea e lua = gradientes cacheados; estrelas = arcs baratos.
// =============================================================
import { EffectBase, type EffectParams, type FxEnv } from '../engine/effect-base.js';
import { liveInc, liveDec } from './live-probe.js';
export const MODULE_ID = 'panel-home.weather-fx.effects.night-sky';
export const VERSION = '0.1.0-ETAPA4';

const BASE_STARS = 200;    // escala por densityScale do governor

interface Star { x: number; y: number; r: number; base: number; phase: number; twk: number; }
function rand(a: number, b: number): number { return a + Math.random() * (b - a); }

export class NightSkyEffect extends EffectBase {
  private ctx: CanvasRenderingContext2D | null = null;
  private w = 0; private h = 0;
  private stars: Star[] = [];
  private visible = BASE_STARS;
  private moonX = 0; private moonY = 0; private moonR = 0;
  private counted = false;

  private skyGrad: CanvasGradient | null = null;
  private moonGlow: CanvasGradient | null = null;
  private moonDisc: CanvasGradient | null = null;
  // via-láctea: ângulo diagonal + meia-largura
  private mwAngle = -0.6;

  constructor(_params?: EffectParams) {
    super('night-sky');
    liveInc(); this.counted = true;
  }

  init(ctx: CanvasRenderingContext2D, env: FxEnv): void {
    this.ctx = ctx;
    this._build(env);
    this._seedStars(env);
  }

  update(dt: number, env: FxEnv): void {
    if (env.width !== this.w || env.height !== this.h) { this._build(env); this._seedStars(env); }
    this.visible = Math.max(40, Math.round(this.stars.length * env.densityScale));
    if (env.reducedMotion) return;                 // congela o cintilar
    for (let i = 0; i < this.stars.length; i++) this.stars[i].phase += dt * this.stars[i].twk;
  }

  render(ctx: CanvasRenderingContext2D, env: FxEnv, opacity: number): void {
    const W = this.w, H = this.h;
    ctx.save();
    ctx.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);

    // 1) céu-noite
    ctx.globalAlpha = opacity;
    if (this.skyGrad) { ctx.fillStyle = this.skyGrad; ctx.fillRect(0, 0, W, H); }

    // 2) via-láctea: faixa diagonal difusa (gradiente cacheado por frame — barato)
    ctx.save();
    ctx.translate(W * 0.5, H * 0.5); ctx.rotate(this.mwAngle);
    const band = Math.max(W, H);
    const mw = ctx.createLinearGradient(0, -band * 0.16, 0, band * 0.16);
    mw.addColorStop(0, 'rgba(150,170,220,0)');
    mw.addColorStop(0.5, 'rgba(170,185,225,' + (0.10 * opacity).toFixed(3) + ')');
    mw.addColorStop(1, 'rgba(150,170,220,0)');
    ctx.fillStyle = mw; ctx.fillRect(-band, -band * 0.16, band * 2, band * 0.32);
    ctx.restore();

    // 3) estrelas (cintilar dessincronizado). visible = subset por densityScale
    for (let i = 0; i < this.visible; i++) {
      const s = this.stars[i];
      const tw = 0.55 + 0.45 * Math.sin(s.phase);
      ctx.globalAlpha = s.base * tw * opacity;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = '#eaf1ff'; ctx.fill();
    }

    // 4) lua: glow + disco + sombreado sutil
    ctx.globalAlpha = opacity;
    if (this.moonGlow) { ctx.fillStyle = this.moonGlow; ctx.fillRect(0, 0, W, H); }
    if (this.moonDisc) {
      ctx.beginPath(); ctx.arc(this.moonX, this.moonY, this.moonR, 0, Math.PI * 2);
      ctx.fillStyle = this.moonDisc; ctx.fill();
    }
    // 2-3 "crateras" sugeridas (círculos escuros bem sutis)
    ctx.globalAlpha = 0.06 * opacity; ctx.fillStyle = '#8a93ad';
    const cr = this.moonR;
    for (const c of [[-0.28, -0.15, 0.22], [0.2, 0.24, 0.16], [0.32, -0.28, 0.12]]) {
      ctx.beginPath(); ctx.arc(this.moonX + cr * c[0], this.moonY + cr * c[1], cr * c[2], 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();
  }

  destroy(): void {
    if (this.counted) { this.counted = false; liveDec(); }
    this.stars.length = 0; this.skyGrad = null; this.moonGlow = null; this.moonDisc = null; this.ctx = null;
  }

  private _build(env: FxEnv): void {
    if (!this.ctx) return;
    this.w = env.width; this.h = env.height;
    const sky = this.ctx.createLinearGradient(0, 0, 0, this.h || 1);
    sky.addColorStop(0, '#05070d'); sky.addColorStop(0.55, '#0d1526'); sky.addColorStop(1, '#16213e');
    this.skyGrad = sky;
    this.moonX = this.w * 0.24; this.moonY = this.h * 0.26;
    this.moonR = Math.max(14, Math.min(this.w, this.h) * 0.06);
    const gr = this.moonR * 5;
    const glow = this.ctx.createRadialGradient(this.moonX, this.moonY, this.moonR * 0.7, this.moonX, this.moonY, gr);
    glow.addColorStop(0, 'rgba(210,222,245,0.35)'); glow.addColorStop(0.4, 'rgba(200,214,240,0.10)'); glow.addColorStop(1, 'rgba(200,214,240,0)');
    this.moonGlow = glow;
    const disc = this.ctx.createRadialGradient(this.moonX - this.moonR * 0.3, this.moonY - this.moonR * 0.3, this.moonR * 0.2, this.moonX, this.moonY, this.moonR);
    disc.addColorStop(0, '#f4f6ff'); disc.addColorStop(0.7, '#dfe5f2'); disc.addColorStop(1, '#c3cbdd');
    this.moonDisc = disc;
  }

  private _seedStars(env: FxEnv): void {
    this.stars.length = 0;
    const cx = this.w * 0.5, cy = this.h * 0.5, cos = Math.cos(this.mwAngle), sin = Math.sin(this.mwAngle);
    for (let i = 0; i < BASE_STARS; i++) {
      let x = rand(0, this.w), y = rand(0, this.h);
      // ~35% enviesadas p/ perto da faixa da via-láctea (mais densas lá)
      if (Math.random() < 0.35) {
        const along = rand(-Math.max(this.w, this.h) * 0.6, Math.max(this.w, this.h) * 0.6);
        const across = rand(-1, 1) * this.h * 0.12;
        x = cx + along * cos - across * sin; y = cy + along * sin + across * cos;
      }
      this.stars.push({ x, y, r: rand(0.4, 1.7), base: rand(0.35, 1), phase: rand(0, Math.PI * 2), twk: rand(0.6, 2.2) });
    }
    this.visible = Math.max(40, Math.round(this.stars.length * (env.densityScale || 1)));
  }
}
export default NightSkyEffect;
