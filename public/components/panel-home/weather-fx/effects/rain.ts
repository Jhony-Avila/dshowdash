'use strict';
// =============================================================
// weather-fx / effects / rain — CHUVA. Porte fiel do proto-rain-v4
// aprovado. Técnicas: object pooling, delta-time, 3 planos de
// profundidade (FRONT sprite-pingo c/ highlight + splash · MID sprite ·
// BACK linha barata), parede de névoa cacheada (pattern seamless torus),
// splash em cluster, sprites/gradientes pré-renderizados. A infra de
// DPR/refresh/governor/RAF é do MOTOR — aqui só reagimos a env.dpr
// (transform) e env.densityScale (contagem). intensity = param
// (chuva-leve ~0.35 · chuva-forte ~0.85). Variante dia/noite na paleta.
// =============================================================
import { EffectBase, type EffectParams, type FxEnv } from '../engine/effect-base.js';
import { liveInc, liveDec } from './live-probe.js';
export const MODULE_ID = 'panel-home.weather-fx.effects.rain';
export const VERSION = '0.2.0-ETAPA5';   // +palette:'storm' (aditivo; chuva-leve/forte inalteradas)

const FRONT = 0, MID = 1, BACK = 2;
const MAX_DROPS = 1800, MAX_SPLASH = 900;
const TILE = 180, GRAV = 820;

interface Drop { active: boolean; x: number; y: number; len: number; speed: number; thick: number; alpha: number; plane: number; drawW: number; splash: boolean; }
interface Splash { active: boolean; kind: number; x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; }

function rand(a: number, b: number): number { return a + Math.random() * (b - a); }
function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
function clamp(v: number, a: number, b: number): number { return v < a ? a : (v > b ? b : v); }

// paletas (dia/noite): céu de fundo + tom das gotas.
// stormDay/stormNight = ADITIVO (Lote B): só usados por palette:'storm'
// (tempestade). chuva-leve/forte não passam palette → seguem day/night.
const SKY = {
  day:        ['#3f6389', '#4a6f92', '#587f9f'],
  night:      ['#0c1420', '#131d2e', '#1b2740'],
  stormDay:   ['#1f2c3a', '#26374a', '#2d4257'],
  stormNight: ['#060a11', '#0a1019', '#111a2b']
};

export class RainEffect extends EffectBase {
  private ctx: CanvasRenderingContext2D | null = null;
  private w = 0; private h = 0; private isDay = true;
  private intensity = 0.55;
  private paletteKey: 'rain' | 'storm' = 'rain';   // 'storm' = céu escuro (tempestade); default preserva Lote A
  private counted = false;

  private drops: Drop[] = [];
  private splashes: Splash[] = [];
  private activeDrops = 0;
  private targetActive = 0;
  private speedMul = 1; private wind = 0.16; private fogAlpha = 0;
  private fogScrollX = 0; private fogScrollY = 0;

  private dropFront: HTMLCanvasElement | null = null;
  private dropMid: HTMLCanvasElement | null = null;
  private dotSprite: HTMLCanvasElement | null = null;
  private arcSprite: HTMLCanvasElement | null = null;
  private fogPattern: CanvasPattern | null = null;
  private skyGrad: CanvasGradient | null = null;
  private mistGrad: CanvasGradient | null = null;

  constructor(params?: EffectParams) {
    super('rain');
    if (params) {
      if (typeof params.intensity === 'number') this.intensity = params.intensity;
      if (typeof params.isDay === 'boolean') this.isDay = params.isDay;
      if (params.palette === 'storm' || params.palette === 'rain') this.paletteKey = params.palette;
    }
    for (let i = 0; i < MAX_DROPS; i++) this.drops.push({ active: false, x: 0, y: 0, len: 0, speed: 0, thick: 0, alpha: 0, plane: BACK, drawW: 0, splash: false });
    for (let j = 0; j < MAX_SPLASH; j++) this.splashes.push({ active: false, kind: 0, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 0, size: 0 });
    liveInc(); this.counted = true;
  }

  setParams(params: EffectParams): void {
    super.setParams(params);
    if (typeof params.intensity === 'number') this.intensity = params.intensity;
    if (typeof params.isDay === 'boolean') this.isDay = params.isDay;
    if (params.palette === 'storm' || params.palette === 'rain') this.paletteKey = params.palette;
  }

  init(ctx: CanvasRenderingContext2D, env: FxEnv): void {
    this.ctx = ctx;
    this.dropFront = this._buildDropSprite(true);
    this.dropMid = this._buildDropSprite(false);
    this.dotSprite = this._buildDot();
    this.arcSprite = this._buildArc();
    this.fogPattern = this._buildFog(ctx);
    this._buildSky(env);
    this._applyIntensity(env);
    // pré-semeia (evita "tela seca" no primeiro frame)
    let pre = Math.min(this.targetActive, 400);
    for (let p = 0; p < MAX_DROPS && pre > 0; p++) {
      if (!this.drops[p].active) { this._spawnDrop(this.drops[p], false); this.activeDrops++; pre--; }
    }
  }

  update(dt: number, env: FxEnv): void {
    if (env.width !== this.w || env.height !== this.h) this._buildSky(env);
    this._applyIntensity(env);

    // ajusta população ao alvo (spawn/despawn em lotes, como o proto)
    if (this.activeDrops < this.targetActive) {
      let toAdd = Math.min(this.targetActive - this.activeDrops, 120);
      for (let a = 0; a < MAX_DROPS && toAdd > 0; a++) {
        if (!this.drops[a].active) { this._spawnDrop(this.drops[a], true); this.activeDrops++; toAdd--; }
      }
    } else if (this.activeDrops > this.targetActive) {
      let toRemove = this.activeDrops - this.targetActive;
      for (let b = MAX_DROPS - 1; b >= 0 && toRemove > 0; b--) {
        if (this.drops[b].active) { this.drops[b].active = false; this.activeDrops--; toRemove--; }
      }
    }

    // reduced-motion: névoa NÃO scrolla (quadro quase parado)
    if (!env.reducedMotion) {
      this.fogScrollY += 45 * this.speedMul * dt;
      this.fogScrollX += 45 * this.speedMul * this.wind * dt;
    }

    for (let i = 0; i < MAX_DROPS; i++) {
      const d = this.drops[i];
      if (!d.active) continue;
      const vy = d.speed * this.speedMul;
      d.y += vy * dt;
      d.x += vy * this.wind * dt;
      if (d.y - d.len > this.h) {
        if (d.splash && !env.reducedMotion && Math.random() < 0.85) this._spawnSplashCluster(d.x);
        this._spawnDrop(d, true);
      }
    }

    for (let s = 0; s < MAX_SPLASH; s++) {
      const sp = this.splashes[s];
      if (!sp.active) continue;
      sp.life -= dt;
      if (sp.kind === 0) { sp.vy += GRAV * dt; sp.x += sp.vx * dt; sp.y += sp.vy * dt; if (sp.y > this.h) sp.active = false; }
      if (sp.life <= 0) sp.active = false;
    }
  }

  render(ctx: CanvasRenderingContext2D, env: FxEnv, opacity: number): void {
    const dpr = env.dpr, W = this.w, H = this.h;
    ctx.save();
    // fundo (céu)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = opacity;
    if (this.skyGrad) { ctx.fillStyle = this.skyGrad; ctx.fillRect(0, 0, W, H); }

    // parede de névoa (pattern cacheado, scroll seamless) POR BAIXO das gotas
    if (this.fogAlpha > 0.01 && this.fogPattern) {
      const ox = ((this.fogScrollX % TILE) + TILE) % TILE;
      const oy = ((this.fogScrollY % TILE) + TILE) % TILE;
      ctx.save();
      ctx.globalAlpha = this.fogAlpha * opacity;
      ctx.translate(ox, oy);
      ctx.fillStyle = this.fogPattern;
      ctx.fillRect(-ox, -oy, W, H);
      ctx.restore();
    }

    // gotas: BACK = linha barata; FRONT/MID = sprite-pingo (rotação por vento)
    const cc = 1 / Math.sqrt(1 + this.wind * this.wind);
    const sn = -this.wind * cc;
    const acc = dpr * cc, ass = dpr * sn;
    ctx.strokeStyle = this.isDay ? 'rgba(196,216,246,1)' : 'rgba(150,178,220,1)';
    ctx.lineCap = 'round';
    for (let i = 0; i < MAX_DROPS; i++) {
      const d = this.drops[i];
      if (!d.active) continue;
      ctx.setTransform(acc, ass, -ass, acc, dpr * d.x, dpr * d.y);
      ctx.globalAlpha = d.alpha * opacity;
      if (d.plane === BACK) {
        ctx.lineWidth = d.thick;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -d.len); ctx.stroke();
      } else {
        const spr = d.plane === FRONT ? this.dropFront : this.dropMid;
        if (spr) ctx.drawImage(spr, -d.drawW * 0.5, -d.len, d.drawW, d.len);
      }
    }

    // rodapé + respingos em coords CSS
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = opacity;
    if (this.mistGrad) { ctx.fillStyle = this.mistGrad; ctx.fillRect(0, H * 0.7, W, H * 0.3); }
    for (let s2 = 0; s2 < MAX_SPLASH; s2++) {
      const sp = this.splashes[s2];
      if (!sp.active) continue;
      const t = sp.life / sp.max;
      if (sp.kind === 0 && this.dotSprite) {
        const sz = sp.size * (0.7 + 0.3 * t);
        ctx.globalAlpha = t * 0.9 * opacity;
        ctx.drawImage(this.dotSprite, sp.x - sz, sp.y - sz, sz * 2, sz * 2);
      } else if (this.arcSprite) {
        const grow = 1.35 - t, aw = sp.size * grow, ah = aw * (28 / 48);
        ctx.globalAlpha = t * 0.85 * opacity;
        ctx.drawImage(this.arcSprite, sp.x - aw, sp.y - ah, aw * 2, ah * 2);
      }
    }
    ctx.restore();   // volta ao transform base do canvas-core (crossfade da próxima camada intacto)
  }

  destroy(): void {
    if (this.counted) { this.counted = false; liveDec(); }
    this.drops.length = 0; this.splashes.length = 0;
    this.dropFront = this.dropMid = this.dotSprite = this.arcSprite = null;
    this.fogPattern = null; this.skyGrad = null; this.mistGrad = null; this.ctx = null;
    this.activeDrops = 0;
  }

  // ---- densidade por faixa × densityScale do governor (fluidez > densidade) ----
  private _applyIntensity(env: FxEnv): void {
    const v = this.intensity;
    let base: number;
    if (v < 0.30) base = lerp(20, 220, v / 0.30);
    else if (v < 0.70) base = lerp(220, 900, (v - 0.30) / 0.40);
    else base = lerp(900, MAX_DROPS, (v - 0.70) / 0.30);
    const rm = env.reducedMotion ? 0.15 : 1;               // reduced-motion: chuva leve estática
    this.targetActive = Math.round(base * env.densityScale * rm);
    this.speedMul = lerp(0.85, 1.25, v);
    this.wind = lerp(0.06, 0.24, v);
    this.fogAlpha = Math.pow(v, 1.1) * 0.95;                // a parede satura no temporal
  }

  private _spawnDrop(d: Drop, fromTop: boolean): void {
    d.active = true;
    const r = Math.random();
    if (r < 0.16) d.plane = FRONT; else if (r < 0.56) d.plane = MID; else d.plane = BACK;
    if (d.plane === FRONT) { d.len = rand(26, 50); d.speed = rand(520, 700); d.thick = rand(2.6, 4.2); d.alpha = rand(0.62, 0.85); d.drawW = d.thick * 2.0; d.splash = true; }
    else if (d.plane === MID) { d.len = rand(13, 24); d.speed = rand(330, 460); d.thick = rand(1.4, 2.2); d.alpha = rand(0.26, 0.44); d.drawW = d.thick * 2.0; d.splash = false; }
    else { d.len = rand(6, 12); d.speed = rand(160, 260); d.thick = rand(0.7, 1.2); d.alpha = rand(0.10, 0.22); d.drawW = 0; d.splash = false; }
    d.x = rand(-60, this.w + 60);
    d.y = fromTop ? -rand(0, this.h * 0.6) - d.len : rand(0, this.h);
  }

  private _spawnSplashCluster(x: number): void {
    this._spawnSplash(1, x, this.h - 2, 0, 0, rand(0.13, 0.20), rand(9, 13));
    const n = 2 + (Math.random() < 0.5 ? 0 : 1);
    for (let k = 0; k < n; k++) this._spawnSplash(0, x + rand(-4, 4), this.h - 3, rand(-120, 120), -rand(150, 300), rand(0.22, 0.40), rand(1.6, 3.4));
  }
  private _spawnSplash(kind: number, x: number, y: number, vx: number, vy: number, life: number, size: number): void {
    for (let k = 0; k < MAX_SPLASH; k++) {
      const s = this.splashes[k];
      if (!s.active) { s.active = true; s.kind = kind; s.x = x; s.y = y; s.vx = vx; s.vy = vy; s.max = life; s.life = life; s.size = size; return; }
    }
  }

  private _buildSky(env: FxEnv): void {
    if (!this.ctx) return;
    this.w = env.width; this.h = env.height;
    const pal = this.paletteKey === 'storm'
      ? (this.isDay ? SKY.stormDay : SKY.stormNight)
      : (this.isDay ? SKY.day : SKY.night);
    const g = this.ctx.createLinearGradient(0, 0, 0, this.h || 1);
    g.addColorStop(0, pal[0]); g.addColorStop(0.55, pal[1]); g.addColorStop(1, pal[2]);
    this.skyGrad = g;
    const m = this.ctx.createLinearGradient(0, this.h * 0.7, 0, this.h || 1);
    m.addColorStop(0, 'rgba(150,175,205,0)'); m.addColorStop(1, 'rgba(150,175,205,0.10)');
    this.mistGrad = m;
  }

  private _buildDropSprite(withHighlight: boolean): HTMLCanvasElement {
    const w = 24, h = 96, c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d') as CanvasRenderingContext2D;
    const cx = w / 2, headR = w * 0.44;
    const grad = g.createLinearGradient(0, h, 0, 0);
    if (this.isDay) {
      grad.addColorStop(0.00, 'rgba(214,230,255,0.98)'); grad.addColorStop(0.14, 'rgba(202,222,252,0.90)');
      grad.addColorStop(0.55, 'rgba(190,214,245,0.38)'); grad.addColorStop(1.00, 'rgba(188,212,244,0.00)');
    } else {
      grad.addColorStop(0.00, 'rgba(170,196,232,0.95)'); grad.addColorStop(0.14, 'rgba(156,184,224,0.86)');
      grad.addColorStop(0.55, 'rgba(140,170,214,0.34)'); grad.addColorStop(1.00, 'rgba(138,168,212,0.00)');
    }
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(cx, h);
    g.quadraticCurveTo(cx + headR, h, cx + headR * 0.72, h - headR * 1.7);
    g.lineTo(cx + w * 0.05, h * 0.14);
    g.quadraticCurveTo(cx, 0, cx - w * 0.05, h * 0.14);
    g.lineTo(cx - headR * 0.72, h - headR * 1.7);
    g.quadraticCurveTo(cx - headR, h, cx, h);
    g.closePath(); g.fill();
    if (withHighlight) {
      g.strokeStyle = 'rgba(242,248,255,0.55)'; g.lineWidth = w * 0.09; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx - w * 0.13, h * 0.30); g.lineTo(cx - w * 0.13, h * 0.72); g.stroke();
    }
    return c;
  }

  private _buildDot(): HTMLCanvasElement {
    const s = 16, c = document.createElement('canvas'); c.width = s; c.height = s;
    const d = c.getContext('2d') as CanvasRenderingContext2D;
    const g = d.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(220,234,255,0.98)'); g.addColorStop(0.5, 'rgba(198,220,250,0.5)'); g.addColorStop(1, 'rgba(198,220,250,0)');
    d.fillStyle = g; d.beginPath(); d.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2); d.fill();
    return c;
  }

  private _buildArc(): HTMLCanvasElement {
    const w = 48, h = 28, c = document.createElement('canvas'); c.width = w; c.height = h;
    const a = c.getContext('2d') as CanvasRenderingContext2D;
    a.strokeStyle = 'rgba(214,230,255,0.95)'; a.lineCap = 'round';
    const cx = w / 2, base = h - 3;
    a.lineWidth = 1.6; a.beginPath(); a.ellipse(cx, base, 20, 8, 0, Math.PI, Math.PI * 2); a.stroke();
    a.lineWidth = 1.9; a.strokeStyle = 'rgba(232,242,255,0.98)';
    a.beginPath(); a.arc(cx, base, 10, Math.PI * 1.12, Math.PI * 1.88); a.stroke();
    return c;
  }

  private _buildFog(ctx: CanvasRenderingContext2D): CanvasPattern | null {
    const c = document.createElement('canvas'); c.width = TILE; c.height = TILE;
    const f = c.getContext('2d') as CanvasRenderingContext2D;
    f.fillStyle = 'rgba(172,196,230,0.03)'; f.fillRect(0, 0, TILE, TILE);
    f.lineCap = 'round';
    const slope = 0.16;
    for (let i = 0; i < 60; i++) {
      const x0 = rand(0, TILE), y0 = rand(0, TILE), len = rand(7, 16), dx = len * slope;
      f.strokeStyle = 'rgba(190,212,244,' + rand(0.04, 0.11).toFixed(3) + ')';
      f.lineWidth = rand(0.6, 1.3);
      for (let gx = -1; gx <= 1; gx++) for (let gy = -1; gy <= 1; gy++) {
        const bx = x0 + gx * TILE, by = y0 + gy * TILE;
        f.beginPath(); f.moveTo(bx, by); f.lineTo(bx - dx, by - len); f.stroke();
      }
    }
    return ctx.createPattern(c, 'repeat');
  }
}
export default RainEffect;
