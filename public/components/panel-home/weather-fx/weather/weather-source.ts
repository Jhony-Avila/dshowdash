'use strict';
// =============================================================
// weather-fx / weather / weather-source — adapter da FONTE de clima.
// REUSO (Opção B, MVP aprovado): usa o MESMO client WeatherAPI do
// header — header/components/weather-sp/api/fetch.js — logo o MESMO
// endpoint (/api/weather/get_sao_paulo.php, server-cached) e o MESMO
// fallback boot-safe. NÃO duplica fetch/URL/abort.
//
// >> ACOPLAMENTO CROSS-COMPONENTE INTENCIONAL <<
// Este módulo depende de header/components/weather-sp/api/fetch.js.
// Contrato REAL do payload (medido por curl + OpenMeteoFetcher.php):
//   { temperature, weather_code, condition, icon, ... }  — NÃO tem is_day.
// O campo do código é `weather_code` (underscore). Registrado na memória
// do projeto (acoplamento + correção do levantamento).
// =============================================================
import WeatherAPI from '../../../header/components/weather-sp/api/fetch.js';
export const MODULE_ID = 'panel-home.weather-fx.weather.weather-source';
export const VERSION = '0.2.0-ETAPA3';

// 1 dia da previsão (subset do forecast[] do payload; ver OpenMeteoFetcher.php)
export interface ForecastDay { date: string; weather_code: number; temp_max: number | null; temp_min: number | null; }
export interface WeatherReading { code: number; isDay: boolean; ok: boolean; forecast: ForecastDay[]; }

export class WeatherSource {
  private api: { fetchWeather: () => Promise<Record<string, unknown>> };

  constructor() {
    this.api = new (WeatherAPI as unknown as { new(): { fetchWeather: () => Promise<Record<string, unknown>> } })();
  }

  // Lê a fonte. O backend expõe `weather_code` (underscore); toleramos
  // `weathercode`/`code` caso o shape varie. ok:false quando veio o
  // fallback boot-safe (sem código numérico) — o controller MANTÉM o
  // último estado (não pisca).
  async read(): Promise<WeatherReading> {
    const data = (await this.api.fetchWeather()) as Record<string, unknown> | null;
    const rawCode = data ? (data.weather_code ?? data.weathercode ?? data.code) : undefined;
    const code = Number(rawCode);
    if (!data || data._fallback || !Number.isFinite(code)) {
      return { code: -1, isDay: this._isDaySP(), ok: false, forecast: [] };
    }
    // forecast[] já vem no MESMO payload (Passo 1) — sem 2º fetch
    const fc = Array.isArray(data.forecast) ? (data.forecast as ForecastDay[]) : [];
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
  private _isDaySP(now: Date = new Date()): boolean {
    const LAT = -23.55;                                  // São Paulo
    const RAD = Math.PI / 180;
    // hora-relógio de SP: UTC-3 fixo (sem horário de verão desde 2019),
    // independente do fuso do browser (usa o epoch UTC deslocado).
    const sp = new Date(now.getTime() - 3 * 3600000);
    const hour = sp.getUTCHours() + sp.getUTCMinutes() / 60;
    // dia do ano (1..365) a partir do timestamp já em "relógio de SP"
    const yearStart = Date.UTC(sp.getUTCFullYear(), 0, 0);
    const dayOfYear = Math.floor((sp.getTime() - yearStart) / 86400000);
    // declinação solar aproximada (Cooper), em graus
    const decl = -23.44 * Math.cos(RAD * 360 * (dayOfYear + 10) / 365);
    // ângulo horário do nascer/pôr: cos(H) = -tan(lat)·tan(decl)
    let cosH = -Math.tan(LAT * RAD) * Math.tan(decl * RAD);
    cosH = Math.max(-1, Math.min(1, cosH));             // clamp (dia/noite polar — não é SP)
    const H = Math.acos(cosH) / RAD;                     // graus
    const sunrise = 12 - H / 15;                         // hora solar ≈ hora local (aprox.)
    const sunset = 12 + H / 15;
    return hour >= sunrise && hour < sunset;
  }
}
export default WeatherSource;
