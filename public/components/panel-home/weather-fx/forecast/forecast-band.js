import { codeToState } from "../weather/state-map.js";
import { iconFor } from "./forecast-icons.js";
const MODULE_ID = "panel-home.weather-fx.forecast.forecast-band";
const VERSION = "0.1.0-ETAPA6";
const STYLE_ID = "phf-band-style";
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "S\xE1b"];
const CSS = `
.phf-band{display:flex;gap:6px;justify-content:center;flex-wrap:nowrap;margin-top:1rem;padding:8px 10px;max-width:100%;
  background:rgba(10,14,22,0.28);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border-radius:14px;
  border:1px solid rgba(255,255,255,0.06);pointer-events:none;user-select:none;box-sizing:border-box;}
.phf-day{display:flex;flex-direction:column;align-items:center;gap:3px;min-width:44px;padding:2px 4px;}
.phf-dow{font-size:.72rem;font-weight:600;color:rgba(255,255,255,0.92);text-shadow:0 1px 2px rgba(0,0,0,.55);white-space:nowrap;}
.phf-ic{line-height:0;filter:drop-shadow(0 1px 2px rgba(0,0,0,.4));}
.phf-t{display:flex;gap:4px;font-size:.72rem;line-height:1;}
.phf-t b{font-weight:700;color:rgba(255,255,255,0.95);text-shadow:0 1px 2px rgba(0,0,0,.55);}
.phf-t i{font-style:normal;color:rgba(255,255,255,0.58);text-shadow:0 1px 2px rgba(0,0,0,.55);}
@media (max-width:520px){.phf-day{min-width:38px;}.phf-dow,.phf-t{font-size:.66rem;}.phf-band{gap:3px;padding:6px;}}
`;
class ForecastBand {
  el = null;
  mounted = false;
  mount(wrapper) {
    if (this.mounted || !wrapper) return;
    this._injectStyle();
    const content = wrapper.querySelector(".ph-content") || wrapper;
    content.querySelectorAll(".phf-band").forEach((e) => e.remove());
    const band = document.createElement("div");
    band.className = "phf-band";
    band.setAttribute("data-weather-fx-forecast", "1");
    const msg = content.querySelector("#panel-home-message-area") || content.querySelector(".ph-message-area");
    if (msg && msg.parentElement === content) content.insertBefore(band, msg.nextSibling);
    else content.appendChild(band);
    this.el = band;
    this.mounted = true;
  }
  // Alimentada pelo controller (mesmo payload do clima; sem fetch novo).
  update(forecast) {
    if (!this.el || !Array.isArray(forecast) || !forecast.length) return;
    const days = forecast.slice(0, 7);
    this.el.innerHTML = days.map((d, i) => this._cell(d, i)).join("");
  }
  _cell(d, i) {
    const label = i === 0 ? "Hoje" : this._dayLabel(d.date);
    const state = codeToState(Number(d.weather_code), true).id;
    const max = d.temp_max == null ? "\u2013" : Math.round(d.temp_max) + "\xB0";
    const min = d.temp_min == null ? "\u2013" : Math.round(d.temp_min) + "\xB0";
    return '<div class="phf-day"><span class="phf-dow">' + this._esc(label) + '</span><span class="phf-ic">' + iconFor(state) + '</span><span class="phf-t"><b>' + max + "</b><i>" + min + "</i></span></div>";
  }
  // FUSO: dia numérico vem do SPLIT da ISO (direto). O nome do dia usa
  // new Date(y, mo-1, da) — data LOCAL por PARTES, NUNCA new Date(iso)
  // (que parseia como UTC-meia-noite -> off-by-one em UTC-3).
  _dayLabel(iso) {
    const p = String(iso).split("-");
    const y = Number(p[0]), mo = Number(p[1]), da = Number(p[2]);
    if (!y || !mo || !da) return "";
    const dow = WEEKDAYS[new Date(y, mo - 1, da).getDay()];
    return dow + " " + da;
  }
  _esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  }
  _injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const st = document.createElement("style");
    st.id = STYLE_ID;
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  // ANTI-LEAK: remove a faixa E o <style> injetado. Idempotente.
  destroy() {
    if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
    this.el = null;
    this.mounted = false;
    const st = document.getElementById(STYLE_ID);
    if (st && st.parentNode) st.parentNode.removeChild(st);
  }
}
var forecast_band_default = ForecastBand;
export {
  ForecastBand,
  MODULE_ID,
  VERSION,
  forecast_band_default as default
};
