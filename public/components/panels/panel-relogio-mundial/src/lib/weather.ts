/**
 * lib/weather.ts — cliente da camada de clima (api/weather/bulk.php → Open-Meteo).
 * @version 3.0.0
 *
 * ENVELOPE: a API do projeto responde {ok,data,error,meta}. Testar `success` aqui
 * seria o bug que já deixou 17 painéis presos em placeholder — este cliente checa
 * `ok` e trata `ok:false` como ausência de dado, nunca como zero.
 *
 * ESTRATÉGIA: uma única requisição em lote para todas as cidades visíveis, com
 * cache em memória de 30 min (espelhando o TTL do Redis do servidor) e AbortSignal
 * para não vazar requisição no unmount. Se o upstream cair (503), a camada de clima
 * simplesmente não aparece — o painel NÃO inventa temperatura.
 */
'use strict';

import type { City } from '@/data/cities';

export interface WeatherPoint {
  lat: number;
  lng: number;
  temperature: number | null;
  feels_like: number | null;
  humidity: number | null;
  wind_speed: number | null;
  weather_code: number;
  condition: string;
  icon: string;
  is_day: boolean | null;
}

export type WeatherMap = Record<string, WeatherPoint>;

const ENDPOINT = '/api/weather/bulk.php';
const MAX_POINTS = 60;
const TTL_MS = 30 * 60 * 1000;

interface CacheEntry {
  at: number;
  data: WeatherMap;
}

let _cache: CacheEntry | null = null;
let _inflight: Promise<WeatherMap> | null = null;

function keyOf(cities: City[]): string {
  return cities.map((c) => c.id).sort().join(',');
}

let _cacheKey = '';

/**
 * Clima das cidades informadas, indexado por id de cidade.
 * Devolve {} em qualquer falha — o chamador esconde a camada em vez de mentir.
 */
export async function fetchWeather(cities: City[], signal?: AbortSignal): Promise<WeatherMap> {
  const subset = cities.slice(0, MAX_POINTS);
  if (!subset.length) return {};

  const key = keyOf(subset);
  const now = Date.now();
  if (_cache && _cacheKey === key && now - _cache.at < TTL_MS) return _cache.data;
  if (_inflight && _cacheKey === key) return _inflight;

  const points = subset.map((c) => `${c.lat},${c.lng}`).join(';');

  _cacheKey = key;
  _inflight = (async () => {
    try {
      const res = await fetch(`${ENDPOINT}?points=${encodeURIComponent(points)}`, {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
        signal,
      });
      if (!res.ok) return {};
      const body = await res.json();
      // Envelope oficial: {ok,data,error,meta}. `success` não existe neste projeto.
      if (!body || body.ok !== true || !Array.isArray(body.data)) return {};

      const map: WeatherMap = {};
      // A ordem devolvida espelha a ordem enviada (garantido pelo endpoint).
      body.data.forEach((p: WeatherPoint, i: number) => {
        const city = subset[i];
        if (city) map[city.id] = p;
      });
      _cache = { at: Date.now(), data: map };
      return map;
    } catch {
      return {};
    } finally {
      _inflight = null;
    }
  })();

  return _inflight;
}

/** Descarta o cache (usado no unmount para não reter dado entre montagens). */
export function resetWeatherCache(): void {
  _cache = null;
  _cacheKey = '';
  _inflight = null;
}

/** Temperatura formatada pt-BR ou travessão quando não há dado. */
export function fmtTemp(p: WeatherPoint | undefined): string {
  if (!p || p.temperature == null) return '—';
  return `${p.temperature.toFixed(0).replace('-', '−')}°C`;
}
