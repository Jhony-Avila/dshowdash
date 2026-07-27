import { WeatherSource } from "./weather-source.js";
import { WeatherPoller } from "./weather-poller.js";
import { codeToState } from "./state-map.js";
import { sceneForState } from "../effects/scene-factory.js";
const MODULE_ID = "panel-home.weather-fx.weather.weather-controller";
const VERSION = "0.2.0-ETAPA4";
const FADE_S = 1.2;
class WeatherController {
  host;
  source;
  poller;
  current = null;
  // estado em cena
  lastCode = -1;
  // último weathercode REAL lido
  lastIsDay = true;
  // último is_day REAL lido
  lastOkAt = 0;
  lastError = null;
  constructor(host) {
    this.host = host;
    this.source = new WeatherSource();
    this.poller = new WeatherPoller(this.source, {
      isVisible: () => this.host.isVisible(),
      onReading: (r) => {
        this.onReading(r.code, r.isDay);
        if (r.forecast && r.forecast.length && this.host.onForecast) this.host.onForecast(r.forecast);
      },
      onError: (msg) => {
        this.lastError = msg;
      }
    });
  }
  start() {
    this.poller.start();
  }
  stop() {
    this.poller.stop();
  }
  // engine avisa que a home/aba voltou: leitura imediata
  onVisible() {
    this.poller.onVisible();
  }
  // leitura do poller: guarda o real, mapeia e transiciona SE mudou.
  onReading(code, isDay) {
    this.lastCode = code;
    this.lastIsDay = isDay;
    this.lastOkAt = performance.now();
    this.lastError = null;
    this.applyState(codeToState(code, isDay));
  }
  // troca de cena só se o estado (id+isDay) mudou — evita crossfade à toa.
  // A CENA vem do scene-factory (efeito real p/ ceu-limpo/chuva-*; placeholder p/ o resto).
  applyState(next) {
    if (this.current && this.current.id === next.id && this.current.isDay === next.isDay) return;
    this.current = next;
    this.host.crossfadeTo(sceneForState(next), FADE_S);
  }
  currentWeather() {
    return {
      code: this.lastCode,
      // weathercode REAL
      isDay: this.lastCode >= 0 ? this.lastIsDay : null,
      // is_day REAL
      state: this.current ? this.current.id : null,
      // estado renderizado
      stateIsDay: this.current ? this.current.isDay : null,
      source: "real",
      lastOkAt: this.lastOkAt,
      lastError: this.lastError,
      poller: this.poller.metrics
    };
  }
  get liveState() {
    return this.current;
  }
}
var weather_controller_default = WeatherController;
export {
  MODULE_ID,
  VERSION,
  WeatherController,
  weather_controller_default as default
};
