const MODULE_ID = "panel-home.weather-fx.weather.state-map";
const VERSION = "0.1.0-ETAPA3";
const WEATHER_STATES = [
  "ceu-limpo",
  "parcial-nublado",
  "nublado",
  "nevoa",
  "chuva-leve",
  "chuva-forte",
  "neve",
  "tempestade"
];
const FALLBACK_STATE = "parcial-nublado";
const CODE_TO_STATE = {
  0: "ceu-limpo",
  1: "parcial-nublado",
  2: "parcial-nublado",
  3: "nublado",
  45: "nevoa",
  48: "nevoa",
  51: "chuva-leve",
  53: "chuva-leve",
  55: "chuva-leve",
  61: "chuva-leve",
  80: "chuva-leve",
  63: "chuva-forte",
  65: "chuva-forte",
  81: "chuva-forte",
  82: "chuva-forte",
  71: "neve",
  73: "neve",
  75: "neve",
  77: "neve",
  95: "tempestade",
  96: "tempestade",
  99: "tempestade"
};
function codeToState(code, isDay) {
  const id = CODE_TO_STATE[code] || FALLBACK_STATE;
  return { id, isDay: !!isDay };
}
function mappedCodeCount() {
  return Object.keys(CODE_TO_STATE).length;
}
var state_map_default = codeToState;
export {
  FALLBACK_STATE,
  MODULE_ID,
  VERSION,
  WEATHER_STATES,
  codeToState,
  state_map_default as default,
  mappedCodeCount
};
