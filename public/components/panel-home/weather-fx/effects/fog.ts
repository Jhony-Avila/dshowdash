'use strict';
// =============================================================
// weather-fx / effects / fog — NÉVOA (WMO 45/48). A "parede de névoa"
// que no rain é coadjuvante aqui vira PROTAGONISTA: 3 camadas do MESMO
// tile seamless (torus) rolando em velocidades/direções diferentes =
// profundidade por parallax; opacidade média; céu-base cacheado (dia =
// cinza-claro · noite = cinza-azulado escuro) + vignette central densa
// (sensação de visibilidade reduzida). Respeita opacity (crossfade) e
// reduced-motion (congela o scroll, mantém o quadro). Custo: só fillRects
// de gradiente/pattern cacheados — zero partícula.
// =============================================================
import { EffectBase, type EffectParams, type FxEnv } from '../engine/effect-base.js';
import { liveInc, liveDec } from './live-probe.js';
export const MODULE_ID = 'panel-home.weather-fx.effects.fog';
export const VERSION = '0.1.0-ETAPA5';

const TILE = 220;
function rand(a: number, b: number): number { return a + Math.random() * (b - a); }

// paletas (dia/noite) do céu de fundo
const SKY = {
  day:   ['#c4ccd2', '#b3bcc4', '#a7b1ba'],
  night: ['#0f151f', '#141b28', '#1b2433']
};

interface FogLayer { tile: 'near' | 'far'; sx: number; sy: number; vx: number; vy: number; alpha: number; }

export class FogEffect extends EffectBase {
  private ctx: CanvasRenderingContext2D | null = null;
  private w = 0; private h = 0; private isDay = true;
  private counted = false;

  // 3 camadas: perto (blobs grandes, rápida) → longe (pequenos, lenta) = profundidade
  private layers: FogLayer[] = [
    { tile: 'near', sx: 0, sy: 0, vx: 40, vy: 6,  alpha: 0.50 },
    { tile: 'far',  sx: 0, sy: 0, vx: 26, vy: -4, alpha: 0.42 },
    { tile: 'far',  sx: 0, sy: 0, vx: 14, vy: 5,  alpha: 0.34 }
  ];

  private skyGrad: CanvasGradient | null = null;
  private fogNear: CanvasPattern | null = null;   // blobs grandes/densos (primeiro plano)
  private fogFar: CanvasPattern | null = null;     // pequenos/ralos (fundo)
  private wallGrad: CanvasGradient | null = null;

  constructor(params?: EffectParams) {
    super('fog');
    if (params && typeof params.isDay === 'boolean') this.isDay = params.isDay;
    liveInc(); this.counted = true;
  }

  setParams(params: EffectParams): void {
    super.setParams(params);
    if (typeof params.isDay === 'boolean') this.isDay = params.isDay;
  }

  init(ctx: CanvasRenderingContext2D, env: FxEnv): void {
    this.ctx = ctx;
    this.fogNear = this._buildFog(ctx, 'near');
    this.fogFar = this._buildFog(ctx, 'far');
    this._build(env);
  }

  update(dt: number, env: FxEnv): void {
    if (env.width !== this.w || env.height !== this.h) this._build(env);
    if (env.reducedMotion) return;                 // congela o quadro
    for (const L of this.layers) { L.sx += L.vx * dt; L.sy += L.vy * dt; }
  }

  render(ctx: CanvasRenderingContext2D, env: FxEnv, opacity: number): void {
    const W = this.w, H = this.h;
    ctx.save();
    ctx.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);

    // 1) céu
    ctx.globalAlpha = opacity;
    if (this.skyGrad) { ctx.fillStyle = this.skyGrad; ctx.fillRect(0, 0, W, H); }

    // 2) camadas de névoa: near/far em velocidades diferentes = parallax visível
    for (const L of this.layers) {
      const pat = L.tile === 'near' ? this.fogNear : this.fogFar;
      if (!pat) continue;
      const ox = ((L.sx % TILE) + TILE) % TILE;
      const oy = ((L.sy % TILE) + TILE) % TILE;
      ctx.save();
      ctx.globalAlpha = L.alpha * opacity;
      ctx.translate(ox, oy);
      ctx.fillStyle = pat;
      ctx.fillRect(-ox, -oy, W, H);
      ctx.restore();
    }

    // 3) vignette central densa (nevoeiro fechando a visibilidade)
    if (this.wallGrad) { ctx.globalAlpha = opacity; ctx.fillStyle = this.wallGrad; ctx.fillRect(0, 0, W, H); }

    ctx.restore();
  }

  destroy(): void {
    if (this.counted) { this.counted = false; liveDec(); }
    this.layers.length = 0;
    this.skyGrad = null; this.fogNear = null; this.fogFar = null; this.wallGrad = null; this.ctx = null;
  }

  private _build(env: FxEnv): void {
    if (!this.ctx) return;
    this.w = env.width; this.h = env.height;
    const pal = this.isDay ? SKY.day : SKY.night;
    const g = this.ctx.createLinearGradient(0, 0, 0, this.h || 1);
    g.addColorStop(0, pal[0]); g.addColorStop(0.55, pal[1]); g.addColorStop(1, pal[2]);
    this.skyGrad = g;
    // névoa mais densa no miolo (clara de dia, azulada de noite)
    const c = this.isDay ? '255,255,255' : '150,170,200';
    const w = this.ctx.createRadialGradient(this.w * 0.5, this.h * 0.5, 0, this.w * 0.5, this.h * 0.5, Math.max(this.w, this.h) * 0.75);
    w.addColorStop(0, 'rgba(' + c + ',0.06)'); w.addColorStop(0.5, 'rgba(' + c + ',0.03)'); w.addColorStop(1, 'rgba(' + c + ',0)');   // vignette mais suave (camadas dominam)
    this.wallGrad = w;
  }

  private _buildFog(ctx: CanvasRenderingContext2D, kind: 'near' | 'far'): CanvasPattern | null {
    const c = document.createElement('canvas'); c.width = TILE; c.height = TILE;
    const f = c.getContext('2d') as CanvasRenderingContext2D;
    const col = this.isDay ? '235,240,245' : '120,140,170';
    // near = poucos blobs grandes/densos (1º plano) · far = muitos pequenos/ralos (fundo)
    const count = kind === 'near' ? 14 : 42;
    const rMin = kind === 'near' ? TILE * 0.20 : TILE * 0.06;
    const rMax = kind === 'near' ? TILE * 0.45 : TILE * 0.16;
    const aMin = kind === 'near' ? 0.10 : 0.06;
    const aMax = kind === 'near' ? 0.24 : 0.13;
    // blobs suaves com wrap toroidal (repetição sem costura)
    for (let i = 0; i < count; i++) {
      const x = rand(0, TILE), y = rand(0, TILE), r = rand(rMin, rMax), a = rand(aMin, aMax);
      for (let gx = -1; gx <= 1; gx++) for (let gy = -1; gy <= 1; gy++) {
        const bx = x + gx * TILE, by = y + gy * TILE;
        const g = f.createRadialGradient(bx, by, 0, bx, by, r);
        g.addColorStop(0, 'rgba(' + col + ',' + a.toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + col + ',0)');
        f.fillStyle = g; f.beginPath(); f.arc(bx, by, r, 0, Math.PI * 2); f.fill();
      }
    }
    return ctx.createPattern(c, 'repeat');
  }
}
export default FogEffect;
