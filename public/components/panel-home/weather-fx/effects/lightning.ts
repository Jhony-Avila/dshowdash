'use strict';
// =============================================================
// weather-fx / effects / lightning — RAIOS (overlay da TEMPESTADE, WMO
// 95/96/99). TRANSPARENTE: não preenche céu — só clarões por cima da
// chuva-forte ('storm'). Assinatura = flash branco-azulado breve, decay
// rápido, às vezes duplo-piscar; traço ramificado opcional.
//
//   ACESSIBILIDADE (requisito): prefers-reduced-motion => SEM flash algum
//   (nada de estroboscópio). FREQUÊNCIA contida por gap mínimo forçado
//   (4.5–9s) — nunca vira estrobo. Um flash de cada vez (não sobrepõe).
//
// Respeita opacity (crossfade). Custo ~nulo na maioria dos frames.
// =============================================================
import { EffectBase, type EffectParams, type FxEnv } from '../engine/effect-base.js';
import { liveInc, liveDec } from './live-probe.js';
export const MODULE_ID = 'panel-home.weather-fx.effects.lightning';
export const VERSION = '0.1.0-ETAPA5';

const MIN_GAP = 4.5, MAX_GAP = 9.0;   // s entre raios — teto anti-estroboscópio
const FLASH_DUR = 0.22;               // s — clarão breve

interface Pulse { age: number; dur: number; max: number; }
function rand(a: number, b: number): number { return a + Math.random() * (b - a); }

export class LightningEffect extends EffectBase {
  private w = 0; private h = 0; private isDay = true;
  private counted = false;

  private timer = rand(MIN_GAP, MAX_GAP) * 0.5;   // 1º raio não demora tanto
  private pulses: Pulse[] = [];                    // até 2 (piscar duplo)
  private bolt: number[] | null = null; private boltAge = 0;
  private maxA = 0.55;

  constructor(params?: EffectParams) {
    super('lightning');
    if (params && typeof params.isDay === 'boolean') this.isDay = params.isDay;
    this.maxA = this.isDay ? 0.5 : 0.62;            // um pouco mais forte à noite
    liveInc(); this.counted = true;
  }

  setParams(params: EffectParams): void {
    super.setParams(params);
    if (typeof params.isDay === 'boolean') { this.isDay = params.isDay; this.maxA = this.isDay ? 0.5 : 0.62; }
  }

  init(_ctx: CanvasRenderingContext2D, env: FxEnv): void { this.w = env.width; this.h = env.height; }

  // Dispara um clarão IMEDIATO (usado pelo "momento herói" da intro na tempestade).
  // Só se não houver clarão em curso (respeita o teto anti-estroboscópio) e reseta o
  // gap p/ o ritmo ambiente normal. reduced-motion é tratado no update() (limpa pulsos).
  strike(): void {
    if (this.pulses.length !== 0) return;
    this._strike();
    this.timer = rand(MIN_GAP, MAX_GAP);
  }

  update(dt: number, env: FxEnv): void {
    this.w = env.width; this.h = env.height;
    // ACESSIBILIDADE: reduced-motion => nenhum flash (sem estroboscópio)
    if (env.reducedMotion) { this.pulses.length = 0; this.bolt = null; return; }

    this.timer -= dt;
    // envelhece e compacta pulsos in-place (sem alocar no caso comum = vazio)
    if (this.pulses.length) {
      let k = 0;
      for (let i = 0; i < this.pulses.length; i++) { const p = this.pulses[i]; p.age += dt; if (p.age < p.dur) this.pulses[k++] = p; }
      this.pulses.length = k;
    }
    if (this.bolt) { this.boltAge += dt; if (this.boltAge > 0.12) this.bolt = null; }

    // dispara só quando o clarão anterior acabou (gap mínimo garante não-estrobo)
    if (this.timer <= 0 && this.pulses.length === 0) { this._strike(); this.timer = rand(MIN_GAP, MAX_GAP); }
  }

  render(ctx: CanvasRenderingContext2D, env: FxEnv, opacity: number): void {
    if (this.pulses.length === 0) return;
    const W = this.w, H = this.h;

    // soma dos pulsos ativos (piscar duplo), com teto de brilho
    let a = 0;
    for (let i = 0; i < this.pulses.length; i++) {
      const p = this.pulses[i];
      if (p.age < 0) continue;                       // pulso atrasado ainda não ativou
      const t = 1 - p.age / p.dur;
      a += p.max * t * t;
    }
    if (a <= 0.001) return;
    if (a > this.maxA) a = this.maxA;

    ctx.save();
    ctx.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);
    // clarão de tela cheia
    ctx.globalAlpha = a * opacity;
    ctx.fillStyle = 'rgb(224,232,255)';
    ctx.fillRect(0, 0, W, H);
    // traço do raio (início do clarão)
    if (this.bolt && this.boltAge < 0.12) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(1, a / this.maxA) * opacity;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const b = this.bolt;
      ctx.strokeStyle = 'rgba(235,242,255,0.95)'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(b[0], b[1]);
      for (let i = 2; i < b.length; i += 2) ctx.lineTo(b[i], b[i + 1]);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 0.9; ctx.stroke();
    }
    ctx.restore();
  }

  destroy(): void {
    if (this.counted) { this.counted = false; liveDec(); }
    this.pulses.length = 0; this.bolt = null;
  }

  private _strike(): void {
    this.pulses.push({ age: 0, dur: FLASH_DUR, max: this.maxA });
    if (Math.random() < 0.45) this.pulses.push({ age: -0.10, dur: 0.12, max: this.maxA * 0.7 }); // piscar duplo (atrasado, mais fraco)
    if (Math.random() < 0.6) this._buildBolt(); else this.bolt = null;
    this.boltAge = 0;
  }

  private _buildBolt(): void {
    const pts: number[] = [];
    let x = rand(this.w * 0.2, this.w * 0.8), y = 0;
    const segH = this.h / (10 + Math.floor(rand(0, 5)));
    pts.push(x, y);
    while (y < this.h * 0.66) { y += segH; x += rand(-28, 28); pts.push(x, y); }
    this.bolt = pts;
  }
}
export default LightningEffect;
