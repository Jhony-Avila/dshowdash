'use strict';
// =============================================================
// weather-fx / effects / clouds — SISTEMA DE NUVENS compartilhado
// (WMO 3 nublado · WMO 2 parcial-nublado). Uma classe, 3 params:
//   coverage (0..1 → nº/opacidade das nuvens) · isDay · overlay.
//   - overlay=false (NUBLADO): preenche céu encoberto próprio (cinza) +
//     nuvens densas, sem astro.
//   - overlay=true (PARCIAL): NÃO preenche céu (transparente) + nuvens
//     esparsas — desenhado POR CIMA de Sun/NightSky reais no factory
//     (sol/estrelas de verdade espiando entre as nuvens).
// Nuvens = clusters de puffs (gradiente radial cacheado) deslizando devagar
// com wrap. Respeita opacity (crossfade) e reduced-motion (congela drift).
// =============================================================
import { EffectBase, type EffectParams, type FxEnv } from '../engine/effect-base.js';
import { liveInc, liveDec } from './live-probe.js';
export const MODULE_ID = 'panel-home.weather-fx.effects.clouds';
export const VERSION = '0.1.0-ETAPA5';

interface Puff { dx: number; dy: number; r: number; }
interface Cloud { x: number; y: number; scale: number; speed: number; alpha: number; span: number; puffs: Puff[]; }
function rand(a: number, b: number): number { return a + Math.random() * (b - a); }
function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }

const SKY = {
  overcastDay:   ['#8c98a3', '#7e8b96', '#71808b'],   // céu mais escuro -> nuvem clara "lê" a forma
  overcastNight: ['#161c26', '#1b2330', '#212b3b']
};

export class CloudEffect extends EffectBase {
  private ctx: CanvasRenderingContext2D | null = null;
  private w = 0; private h = 0;
  private isDay = true; private overlay = false; private coverage = 0.6;
  private counted = false;

  private clouds: Cloud[] = [];
  private puffSprite: HTMLCanvasElement | null = null;
  private skyGrad: CanvasGradient | null = null;

  constructor(params?: EffectParams) {
    super('clouds');
    if (params) {
      if (typeof params.isDay === 'boolean') this.isDay = params.isDay;
      if (typeof params.overlay === 'boolean') this.overlay = params.overlay;
      if (typeof params.coverage === 'number') this.coverage = params.coverage;
    }
    liveInc(); this.counted = true;
  }

  setParams(params: EffectParams): void {
    super.setParams(params);
    if (typeof params.isDay === 'boolean') this.isDay = params.isDay;
    if (typeof params.overlay === 'boolean') this.overlay = params.overlay;
    if (typeof params.coverage === 'number') this.coverage = params.coverage;
  }

  init(ctx: CanvasRenderingContext2D, env: FxEnv): void {
    this.ctx = ctx;
    this.puffSprite = this._buildPuff();
    this._build(env);
  }

  update(dt: number, env: FxEnv): void {
    if (env.width !== this.w || env.height !== this.h) this._build(env);
    if (env.reducedMotion) return;                 // congela o drift
    for (const c of this.clouds) {
      c.x += c.speed * dt;
      if (c.x - c.span > this.w) c.x = -c.span;     // wrap seamless
    }
  }

  render(ctx: CanvasRenderingContext2D, env: FxEnv, opacity: number): void {
    const W = this.w, H = this.h;
    ctx.save();
    ctx.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);

    // céu só no modo NUBLADO (overlay=false); no PARCIAL some por cima do Sun/Night
    if (!this.overlay && this.skyGrad) {
      ctx.globalAlpha = opacity; ctx.fillStyle = this.skyGrad; ctx.fillRect(0, 0, W, H);
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

  destroy(): void {
    if (this.counted) { this.counted = false; liveDec(); }
    this.clouds.length = 0;
    this.puffSprite = null; this.skyGrad = null; this.ctx = null;
  }

  private _build(env: FxEnv): void {
    if (!this.ctx) return;
    this.w = env.width; this.h = env.height;
    if (!this.overlay) {
      const pal = this.isDay ? SKY.overcastDay : SKY.overcastNight;
      const g = this.ctx.createLinearGradient(0, 0, 0, this.h || 1);
      g.addColorStop(0, pal[0]); g.addColorStop(0.55, pal[1]); g.addColorStop(1, pal[2]);
      this.skyGrad = g;
    } else {
      this.skyGrad = null;
    }
    this._seed();
  }

  private _seed(): void {
    this.clouds.length = 0;
    // coverage → quantidade e opacidade (nublado = mais/denso · parcial = menos)
    const n = Math.max(2, Math.round(lerp(2, 9, this.coverage)));
    const baseAlpha = lerp(0.28, 0.7, this.coverage);
    for (let i = 0; i < n; i++) {
      const scale = rand(0.8, 1.6);
      const npuffs = 3 + Math.floor(rand(0, 4));
      const puffs: Puff[] = [];
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
        speed: rand(4, 12) * (this.overlay ? 1.1 : 1.6),   // nublado deriva visível (era 0.8)
        alpha: baseAlpha * rand(0.85, 1.1),
        span: span * scale,
        puffs
      });
    }
  }

  private _buildPuff(): HTMLCanvasElement {
    const s = 128, c = document.createElement('canvas'); c.width = s; c.height = s;
    const d = c.getContext('2d') as CanvasRenderingContext2D;
    // corpo da nuvem: parcial (claro/estelar) vs nublado (cinza)
    const col = this.overlay
      ? (this.isDay ? '248,250,253' : '70,80,98')
      : (this.isDay ? '206,214,222' : '150,162,182');   // nublado: nuvem clara (contraste)
    const g = d.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    if (this.overlay) {
      // parcial: borda macia (INALTERADO — ficou bom)
      g.addColorStop(0, 'rgba(' + col + ',0.9)'); g.addColorStop(0.5, 'rgba(' + col + ',0.5)'); g.addColorStop(1, 'rgba(' + col + ',0)');
    } else {
      // nublado: miolo sólido + feather curto = forma DEFINIDA (menos blur)
      g.addColorStop(0, 'rgba(' + col + ',0.98)'); g.addColorStop(0.6, 'rgba(' + col + ',0.9)'); g.addColorStop(0.82, 'rgba(' + col + ',0.5)'); g.addColorStop(1, 'rgba(' + col + ',0)');
    }
    d.fillStyle = g; d.beginPath(); d.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2); d.fill();
    return c;
  }
}
export default CloudEffect;
