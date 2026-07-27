import { EffectBase } from "../engine/effect-base.js";
import { liveInc, liveDec } from "./live-probe.js";
const MODULE_ID = "panel-home.weather-fx.effects.placeholder-scene";
const VERSION = "0.2.0-ETAPA4";
const COLORS = {
  "ceu-limpo": "#3a8ed6",
  "parcial-nublado": "#6b7f95",
  "nublado": "#5b6470",
  "nevoa": "#9aa3a8",
  "chuva-leve": "#4a7a8c",
  "chuva-forte": "#2c4a63",
  "neve": "#cdd7e0",
  "tempestade": "#3a2f52"
};
class PlaceholderScene extends EffectBase {
  color;
  label;
  day;
  counted = false;
  constructor(state) {
    super("placeholder:" + state.id);
    this.color = COLORS[state.id] || COLORS["parcial-nublado"];
    this.day = state.isDay;
    this.label = state.id.toUpperCase() + (state.isDay ? " (dia)" : " (noite)");
    liveInc();
    this.counted = true;
  }
  render(ctx, env, opacity) {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = this.day ? this.color : this._darken(this.color);
    ctx.fillRect(0, 0, env.width, env.height);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = `600 ${Math.max(18, Math.round(env.width / 24))}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.label, env.width / 2, env.height / 2);
    ctx.restore();
  }
  _darken(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.round((n >> 16 & 255) * 0.55);
    const g = Math.round((n >> 8 & 255) * 0.55);
    const b = Math.round((n & 255) * 0.55);
    return `rgb(${r},${g},${b})`;
  }
  destroy() {
    if (!this.counted) return;
    this.counted = false;
    liveDec();
  }
}
var placeholder_scene_default = PlaceholderScene;
export {
  MODULE_ID,
  PlaceholderScene,
  VERSION,
  placeholder_scene_default as default
};
