'use strict';
// =============================================================
// weather-fx / effects / placeholder-scene — STAND-IN (andaime/dev).
// Cor sólida + rótulo de texto por estado (ex: "CHUVA-FORTE (noite)").
// NÃO é o efeito real. No Lote A os estados ceu-limpo/chuva-leve/chuva-
// forte já têm efeito real; os outros 5 seguem neste placeholder até o
// Lote B. Sonda anti-leak COMPARTILHADA via live-probe.
// =============================================================
import { EffectBase, type FxEnv } from '../engine/effect-base.js';
import type { WeatherState, WeatherStateId } from '../weather/state-map.js';
import { liveInc, liveDec } from './live-probe.js';
export const MODULE_ID = 'panel-home.weather-fx.effects.placeholder-scene';
export const VERSION = '0.2.0-ETAPA4';

// cor base por estado (variante noite = escurecida no render)
const COLORS: Record<WeatherStateId, string> = {
  'ceu-limpo': '#3a8ed6',
  'parcial-nublado': '#6b7f95',
  'nublado': '#5b6470',
  'nevoa': '#9aa3a8',
  'chuva-leve': '#4a7a8c',
  'chuva-forte': '#2c4a63',
  'neve': '#cdd7e0',
  'tempestade': '#3a2f52'
};

export class PlaceholderScene extends EffectBase {
  private color: string;
  private label: string;
  private day: boolean;
  private counted = false;

  constructor(state: WeatherState) {
    super('placeholder:' + state.id);
    this.color = COLORS[state.id] || COLORS['parcial-nublado'];
    this.day = state.isDay;
    this.label = state.id.toUpperCase() + (state.isDay ? ' (dia)' : ' (noite)');
    liveInc(); this.counted = true;
  }

  render(ctx: CanvasRenderingContext2D, env: FxEnv, opacity: number): void {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = this.day ? this.color : this._darken(this.color);
    ctx.fillRect(0, 0, env.width, env.height);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = `600 ${Math.max(18, Math.round(env.width / 24))}px system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(this.label, env.width / 2, env.height / 2);
    ctx.restore();
  }

  private _darken(hex: string): string {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.round(((n >> 16) & 255) * 0.55);
    const g = Math.round(((n >> 8) & 255) * 0.55);
    const b = Math.round((n & 255) * 0.55);
    return `rgb(${r},${g},${b})`;
  }

  destroy(): void { if (!this.counted) return; this.counted = false; liveDec(); }
}
export default PlaceholderScene;
