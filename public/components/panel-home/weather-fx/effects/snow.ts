'use strict';
// =============================================================
// weather-fx / effects / snow — NEVE (WMO 71-77, cobre granizo 77).
// Molde de pooling + delta-time do rain, porém MAIS leve: flocos caindo
// devagar com BALANÇO oscilante (sin(phase) no X, não reto), 3 planos de
// profundidade (tamanho/velocidade/alpha), sprite macio cacheado. Paleta
// dia/noite. `intensity` suportado (leve/forte) mas 1 intensidade no ship.
// Acúmulo no rodapé = OFF por padrão (gancho `accumulate`, 1 fillRect).
// Respeita opacity (crossfade) e reduced-motion (congela queda+balanço).
// =============================================================
import { EffectBase, type EffectParams, type FxEnv } from '../engine/effect-base.js';
import { liveInc, liveDec } from './live-probe.js';
export const MODULE_ID = 'panel-home.weather-fx.effects.snow';
export const VERSION = '0.1.0-ETAPA5';

const FRONT = 0, MID = 1, BACK = 2;
const MAX_FLAKES = 1100;

interface Flake { active: boolean; x: number; y: number; r: number; speed: number; alpha: number; plane: number; phase: number; swayAmp: number; swayFreq: number; }
function rand(a: number, b: number): number { return a + Math.random() * (b - a); }
function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }

const SKY = {
  day:   ['#8a97a6', '#9aa6b3', '#aeb8c2'],
  night: ['#0a0f18', '#111827', '#1b2438']
};

export class SnowEffect extends EffectBase {
  private ctx: CanvasRenderingContext2D | null = null;
  private w = 0; private h = 0; private isDay = true;
  private intensity = 0.5;
  private accumulate = false;
  private counted = false;

  private flakes: Flake[] = [];
  private activeFlakes = 0;
  private targetActive = 0;
  private speedMul = 1; private wind = 0.05;

  private flakeSprite: HTMLCanvasElement | null = null;
  private skyGrad: CanvasGradient | null = null;
  private accumGrad: CanvasGradient | null = null;

  constructor(params?: EffectParams) {
    super('snow');
    if (params) {
      if (typeof params.intensity === 'number') this.intensity = params.intensity;
      if (typeof params.isDay === 'boolean') this.isDay = params.isDay;
      if (typeof params.accumulate === 'boolean') this.accumulate = params.accumulate;
    }
    for (let i = 0; i < MAX_FLAKES; i++) this.flakes.push({ active: false, x: 0, y: 0, r: 0, speed: 0, alpha: 0, plane: BACK, phase: 0, swayAmp: 0, swayFreq: 0 });
    liveInc(); this.counted = true;
  }

  setParams(params: EffectParams): void {
    super.setParams(params);
    if (typeof params.intensity === 'number') this.intensity = params.intensity;
    if (typeof params.isDay === 'boolean') this.isDay = params.isDay;
    if (typeof params.accumulate === 'boolean') this.accumulate = params.accumulate;
  }

  init(ctx: CanvasRenderingContext2D, env: FxEnv): void {
    this.ctx = ctx;
    this.flakeSprite = this._buildFlake();
    this._build(env);
    this._applyIntensity(env);
    // pré-semeia espalhado (evita "céu limpo" no primeiro frame)
    let pre = Math.min(this.targetActive, 300);
    for (let p = 0; p < MAX_FLAKES && pre > 0; p++) {
      if (!this.flakes[p].active) { this._spawn(this.flakes[p], false); this.activeFlakes++; pre--; }
    }
  }

  update(dt: number, env: FxEnv): void {
    if (env.width !== this.w || env.height !== this.h) this._build(env);
    this._applyIntensity(env);

    if (this.activeFlakes < this.targetActive) {
      let add = Math.min(this.targetActive - this.activeFlakes, 80);
      for (let a = 0; a < MAX_FLAKES && add > 0; a++) {
        if (!this.flakes[a].active) { this._spawn(this.flakes[a], true); this.activeFlakes++; add--; }
      }
    } else if (this.activeFlakes > this.targetActive) {
      let rem = this.activeFlakes - this.targetActive;
      for (let b = MAX_FLAKES - 1; b >= 0 && rem > 0; b--) {
        if (this.flakes[b].active) { this.flakes[b].active = false; this.activeFlakes--; rem--; }
      }
    }

    const rm = env.reducedMotion;
    for (let i = 0; i < MAX_FLAKES; i++) {
      const f = this.flakes[i];
      if (!f.active) continue;
      f.y += f.speed * this.speedMul * dt;
      if (!rm) {
        f.phase += f.swayFreq * dt;
        f.x += (Math.sin(f.phase) * f.swayAmp + f.speed * this.wind) * dt;
      }
      if (f.y - f.r > this.h) this._spawn(f, true);
      else if (f.x < -20) f.x = this.w + 20;
      else if (f.x > this.w + 20) f.x = -20;
    }
  }

  render(ctx: CanvasRenderingContext2D, env: FxEnv, opacity: number): void {
    const W = this.w, H = this.h;
    ctx.save();
    ctx.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);
    ctx.globalAlpha = opacity;
    if (this.skyGrad) { ctx.fillStyle = this.skyGrad; ctx.fillRect(0, 0, W, H); }
    if (this.accumulate && this.accumGrad) { ctx.fillStyle = this.accumGrad; ctx.fillRect(0, H * 0.82, W, H * 0.18); }

    const spr = this.flakeSprite;
    if (spr) {
      for (let i = 0; i < MAX_FLAKES; i++) {
        const f = this.flakes[i];
        if (!f.active) continue;
        ctx.globalAlpha = f.alpha * opacity;
        const d = f.r * 2;
        if (f.plane === FRONT) {
          const dh = d * 1.35;   // leve alongamento vertical no plano da frente = pista de queda
          ctx.drawImage(spr, f.x - f.r, f.y - dh * 0.5, d, dh);
        } else {
          ctx.drawImage(spr, f.x - f.r, f.y - f.r, d, d);
        }
      }
    }
    ctx.restore();
  }

  destroy(): void {
    if (this.counted) { this.counted = false; liveDec(); }
    this.flakes.length = 0;
    this.flakeSprite = null; this.skyGrad = null; this.accumGrad = null; this.ctx = null;
    this.activeFlakes = 0;
  }

  // densidade × densityScale do governor (fluidez > densidade)
  private _applyIntensity(env: FxEnv): void {
    const base = lerp(180, 650, this.intensity);
    const rm = env.reducedMotion ? 0.25 : 1;
    this.targetActive = Math.round(base * env.densityScale * rm);
    this.speedMul = env.reducedMotion ? 0.15 : 1;
  }

  private _spawn(f: Flake, fromTop: boolean): void {
    f.active = true;
    const r = Math.random();
    if (r < 0.18) f.plane = FRONT; else if (r < 0.55) f.plane = MID; else f.plane = BACK;
    if (f.plane === FRONT) { f.r = rand(3.5, 5.5); f.speed = rand(95, 135); f.alpha = rand(0.75, 0.95); f.swayAmp = rand(22, 38); f.swayFreq = rand(0.6, 1.1); }
    else if (f.plane === MID) { f.r = rand(2.2, 3.4); f.speed = rand(62, 88); f.alpha = rand(0.5, 0.7); f.swayAmp = rand(14, 24); f.swayFreq = rand(0.7, 1.3); }
    else { f.r = rand(1.2, 2.0); f.speed = rand(34, 52); f.alpha = rand(0.28, 0.45); f.swayAmp = rand(8, 14); f.swayFreq = rand(0.9, 1.6); }
    f.phase = rand(0, Math.PI * 2);
    f.x = rand(-20, this.w + 20);
    f.y = fromTop ? -rand(0, this.h * 0.5) - f.r : rand(0, this.h);
  }

  private _build(env: FxEnv): void {
    if (!this.ctx) return;
    this.w = env.width; this.h = env.height;
    const pal = this.isDay ? SKY.day : SKY.night;
    const g = this.ctx.createLinearGradient(0, 0, 0, this.h || 1);
    g.addColorStop(0, pal[0]); g.addColorStop(0.55, pal[1]); g.addColorStop(1, pal[2]);
    this.skyGrad = g;
    // faixa de acúmulo (só desenhada se accumulate=true)
    const col = this.isDay ? '245,248,252' : '200,214,235';
    const a = this.ctx.createLinearGradient(0, this.h * 0.82, 0, this.h || 1);
    a.addColorStop(0, 'rgba(' + col + ',0)'); a.addColorStop(1, 'rgba(' + col + ',0.45)');
    this.accumGrad = a;
  }

  private _buildFlake(): HTMLCanvasElement {
    const s = 16, c = document.createElement('canvas'); c.width = s; c.height = s;
    const d = c.getContext('2d') as CanvasRenderingContext2D;
    const col = this.isDay ? '255,255,255' : '226,236,250';
    const g = d.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    // floco com BRILHO: miolo cheio + feather curto (não disco chapado mole)
    g.addColorStop(0, 'rgba(' + col + ',1)'); g.addColorStop(0.55, 'rgba(' + col + ',0.95)'); g.addColorStop(0.8, 'rgba(' + col + ',0.45)'); g.addColorStop(1, 'rgba(' + col + ',0)');
    d.fillStyle = g; d.beginPath(); d.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2); d.fill();
    return c;
  }
}
export default SnowEffect;
