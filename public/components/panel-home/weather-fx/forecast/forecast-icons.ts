'use strict';
// =============================================================
// weather-fx / forecast / forecast-icons — ícones SVG por ESTADO.
// COESÃO POR CONSTRUÇÃO: a faixa passa cada weather_code por codeToState()
// (a MESMA tabela do state-map que escolhe o efeito de fundo), então o
// mini-ícone do dia fala a mesma língua do efeito animado. Variante DIA
// (previsão é diária). SVG inline: crisp em qualquer DPI, leve, sem emoji.
// =============================================================
import type { WeatherStateId } from '../weather/state-map.js';
export const MODULE_ID = 'panel-home.weather-fx.forecast.forecast-icons';
export const VERSION = '0.1.0-ETAPA6';

function svg(inner: string): string {
  return '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + inner + '</svg>';
}

// nuvem base (círculos + base arredondada) — reusada por vários estados
const CLOUD = '<g fill="#c7d0da">'
  + '<circle cx="9" cy="14" r="4"/><circle cx="14" cy="12.5" r="5"/><circle cx="17.5" cy="15" r="3.2"/>'
  + '<rect x="6" y="14" width="13" height="4.6" rx="2.3"/></g>';

// sol cheio (disco + 8 raios) — ceu-limpo
const SUN_FULL = '<g stroke="#ffd66b" stroke-width="1.8" stroke-linecap="round">'
  + '<line x1="12" y1="2" x2="12" y2="4.5"/><line x1="12" y1="19.5" x2="12" y2="22"/>'
  + '<line x1="2" y1="12" x2="4.5" y2="12"/><line x1="19.5" y1="12" x2="22" y2="12"/>'
  + '<line x1="4.9" y1="4.9" x2="6.7" y2="6.7"/><line x1="17.3" y1="17.3" x2="19.1" y2="19.1"/>'
  + '<line x1="19.1" y1="4.9" x2="17.3" y2="6.7"/><line x1="6.7" y1="17.3" x2="4.9" y2="19.1"/>'
  + '</g><circle cx="12" cy="12" r="5" fill="#ffd66b"/>';

// sol pequeno (canto sup-esq) — parcial-nublado (some atrás da nuvem)
const SUN_SMALL = '<g stroke="#ffd66b" stroke-width="1.5" stroke-linecap="round">'
  + '<line x1="8" y1="2.4" x2="8" y2="3.9"/><line x1="2.4" y1="8" x2="3.9" y2="8"/>'
  + '<line x1="4.0" y1="4.0" x2="5.1" y2="5.1"/><line x1="12.0" y1="4.0" x2="10.9" y2="5.1"/>'
  + '<line x1="4.0" y1="12.0" x2="5.1" y2="10.9"/>'
  + '</g><circle cx="8" cy="8" r="3" fill="#ffd66b"/>';

const PARTLY = SUN_SMALL + CLOUD;
const FOG = '<g fill="#c7d0da" opacity="0.9"><circle cx="9" cy="12.5" r="4"/><circle cx="14" cy="11.5" r="4.6"/><rect x="6" y="12.5" width="12.5" height="4" rx="2"/></g>'
  + '<g stroke="#b8c2cc" stroke-width="1.6" stroke-linecap="round"><line x1="6" y1="19.5" x2="18" y2="19.5"/><line x1="7.5" y1="22.2" x2="16.5" y2="22.2"/></g>';
const RAIN_L = CLOUD + '<g stroke="#7fb0e8" stroke-width="1.7" stroke-linecap="round"><line x1="10" y1="19.5" x2="9" y2="22.5"/><line x1="15" y1="19.5" x2="14" y2="22.5"/></g>';
const RAIN_H = CLOUD + '<g stroke="#5f95d8" stroke-width="1.8" stroke-linecap="round"><line x1="8.5" y1="19.3" x2="7.5" y2="22.8"/><line x1="12" y1="19.3" x2="11" y2="22.8"/><line x1="15.5" y1="19.3" x2="14.5" y2="22.8"/></g>';
const SNOW = CLOUD + '<g fill="#e6f0ff"><circle cx="9" cy="21" r="1.1"/><circle cx="13" cy="22.2" r="1.1"/><circle cx="16" cy="20.8" r="1.1"/></g>';
const STORM = CLOUD + '<path d="M12.5 17 l-2.8 4 h2 l-1 3 3.6-4.6 h-2 l1.2-2.4 z" fill="#ffd66b"/>';

export function iconFor(state: WeatherStateId): string {
  let inner: string;
  switch (state) {
    case 'ceu-limpo':        inner = SUN_FULL; break;
    case 'parcial-nublado':  inner = PARTLY;   break;
    case 'nublado':          inner = CLOUD;    break;
    case 'nevoa':            inner = FOG;      break;
    case 'chuva-leve':       inner = RAIN_L;   break;
    case 'chuva-forte':      inner = RAIN_H;   break;
    case 'neve':             inner = SNOW;     break;
    case 'tempestade':       inner = STORM;    break;
    default:                 inner = CLOUD;
  }
  return svg(inner);
}
export default iconFor;
