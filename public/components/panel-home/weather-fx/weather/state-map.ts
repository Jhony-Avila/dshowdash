'use strict';
// =============================================================
// weather-fx / weather / state-map — WMO + is_day -> 1 dos 8 estados.
// PURA (sem I/O). Tabela APROVADA (22 códigos, sem órfão). Código
// desconhecido -> parcial-nublado (fallback definido).
// =============================================================
export const MODULE_ID = 'panel-home.weather-fx.weather.state-map';
export const VERSION = '0.1.0-ETAPA3';

// os 8 estados — ids estáveis (usados por placeholder-scene e dev override)
export type WeatherStateId =
  | 'ceu-limpo' | 'parcial-nublado' | 'nublado' | 'nevoa'
  | 'chuva-leve' | 'chuva-forte' | 'neve' | 'tempestade';

export const WEATHER_STATES: WeatherStateId[] = [
  'ceu-limpo', 'parcial-nublado', 'nublado', 'nevoa',
  'chuva-leve', 'chuva-forte', 'neve', 'tempestade'
];

export const FALLBACK_STATE: WeatherStateId = 'parcial-nublado';

// tabela WMO aprovada — 22 códigos, sem órfão
const CODE_TO_STATE: Record<number, WeatherStateId> = {
  0: 'ceu-limpo',
  1: 'parcial-nublado', 2: 'parcial-nublado',
  3: 'nublado',
  45: 'nevoa', 48: 'nevoa',
  51: 'chuva-leve', 53: 'chuva-leve', 55: 'chuva-leve', 61: 'chuva-leve', 80: 'chuva-leve',
  63: 'chuva-forte', 65: 'chuva-forte', 81: 'chuva-forte', 82: 'chuva-forte',
  71: 'neve', 73: 'neve', 75: 'neve', 77: 'neve',
  95: 'tempestade', 96: 'tempestade', 99: 'tempestade'
};

export interface WeatherState { id: WeatherStateId; isDay: boolean; }

// code + isDay -> estado. Desconhecido -> fallback (parcial-nublado).
export function codeToState(code: number, isDay: boolean): WeatherState {
  const id = CODE_TO_STATE[code] || FALLBACK_STATE;
  return { id, isDay: !!isDay };
}

// util p/ dev/self-test: quantos códigos a tabela cobre (deve ser 22)
export function mappedCodeCount(): number { return Object.keys(CODE_TO_STATE).length; }
export default codeToState;
