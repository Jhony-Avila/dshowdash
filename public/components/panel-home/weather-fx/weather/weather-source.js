import WeatherAPI from "../../../header/components/weather-sp/api/fetch.js";
const MODULE_ID = "panel-home.weather-fx.weather.weather-source";
const VERSION = "0.2.0-ETAPA3";
class WeatherSource {
  api;
  constructor() {
    this.api = new WeatherAPI();
  }
  // Lê a fonte. O backend expõe `weather_code` (underscore); toleramos
  // `weathercode`/`code` caso o shape varie. ok:false quando veio o
  // fallback boot-safe (sem código numérico) — o controller MANTÉM o
  // último estado (não pisca).
  async read() {
    const data = await this.api.fetchWeather();
    const rawCode = data ? data.weather_code ?? data.weathercode ?? data.code : void 0;
    const code = Number(rawCode);
    if (!data || data._fallback || !Number.isFinite(code)) {
      return { code: -1, isDay: this._isDaySP(), ok: false, forecast: [] };
    }
    const fc = Array.isArray(data.forecast) ? data.forecast : [];
    return { code, isDay: this._isDaySP(), ok: true, forecast: fc };
  }
  // ---------------------------------------------------------------
  // Dia/noite HEURÍSTICO para São Paulo (lat ~-23.55°). O backend NÃO
  // fornece is_day (medido: OpenMeteoFetcher não pede nem retorna), então
  // aproximamos nascer/pôr do sol por uma CURVA SAZONAL (declinação solar
  // de Cooper). NÃO é astronômico preciso — ignora equação do tempo e a
  // correção fina de longitude (erro ~±15min); é bom o bastante pro
  // dia/noite visual. PNR futuro: is_day real no OpenMeteoFetcher.php.
  // ---------------------------------------------------------------
  _isDaySP(now = /* @__PURE__ */ new Date()) {
    const LAT = -23.55;
    const RAD = Math.PI / 180;
    const sp = new Date(now.getTime() - 3 * 36e5);
    const hour = sp.getUTCHours() + sp.getUTCMinutes() / 60;
    const yearStart = Date.UTC(sp.getUTCFullYear(), 0, 0);
    const dayOfYear = Math.floor((sp.getTime() - yearStart) / 864e5);
    const decl = -23.44 * Math.cos(RAD * 360 * (dayOfYear + 10) / 365);
    let cosH = -Math.tan(LAT * RAD) * Math.tan(decl * RAD);
    cosH = Math.max(-1, Math.min(1, cosH));
    const H = Math.acos(cosH) / RAD;
    const sunrise = 12 - H / 15;
    const sunset = 12 + H / 15;
    return hour >= sunrise && hour < sunset;
  }
}
var weather_source_default = WeatherSource;
export {
  MODULE_ID,
  VERSION,
  WeatherSource,
  weather_source_default as default
};
