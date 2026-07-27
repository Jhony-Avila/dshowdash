'use strict';
// =============================================================
// weather-fx / weather / weather-controller — liga poller -> state-map
// -> crossfade. Só transiciona se o estado (id+isDay) MUDOU (evita
// crossfade à toa). currentWeather expõe a leitura real p/ o healthCheck.
// A cena de cada estado vem do scene-factory (efeito real ou placeholder)
// — o controller NÃO conhece os efeitos concretos.
// =============================================================
import { WeatherSource, type ForecastDay } from './weather-source.js';
import { WeatherPoller } from './weather-poller.js';
import { codeToState, type WeatherState } from './state-map.js';
import { sceneForState } from '../effects/scene-factory.js';
import type { EffectBase } from '../engine/effect-base.js';
export const MODULE_ID = 'panel-home.weather-fx.weather.weather-controller';
export const VERSION = '0.2.0-ETAPA4';

const FADE_S = 1.2;

export interface ControllerHost {
  crossfadeTo: (scene: EffectBase[], durationS: number) => void;
  isVisible: () => boolean;
  onForecast?: (forecast: ForecastDay[]) => void;   // faixa 7 dias (mesmo payload; sem 2º fetch)
}

export class WeatherController {
  private host: ControllerHost;
  private source: WeatherSource;
  private poller: WeatherPoller;
  private current: WeatherState | null = null;   // estado em cena
  private lastCode = -1;                          // último weathercode REAL lido
  private lastIsDay = true;                       // último is_day REAL lido
  private lastOkAt = 0;
  private lastError: string | null = null;

  constructor(host: ControllerHost) {
    this.host = host;
    this.source = new WeatherSource();
    this.poller = new WeatherPoller(this.source, {
      isVisible: () => this.host.isVisible(),
      onReading: (r) => {
        this.onReading(r.code, r.isDay);
        // repassa forecast p/ a faixa só em leitura boa e não-vazia (não pisca no fallback)
        if (r.forecast && r.forecast.length && this.host.onForecast) this.host.onForecast(r.forecast);
      },
      onError: (msg) => { this.lastError = msg; }
    });
  }

  start(): void { this.poller.start(); }
  stop(): void { this.poller.stop(); }

  // engine avisa que a home/aba voltou: leitura imediata
  onVisible(): void { this.poller.onVisible(); }

  // leitura do poller: guarda o real, mapeia e transiciona SE mudou.
  private onReading(code: number, isDay: boolean): void {
    this.lastCode = code; this.lastIsDay = isDay; this.lastOkAt = performance.now(); this.lastError = null;
    this.applyState(codeToState(code, isDay));
  }

  // troca de cena só se o estado (id+isDay) mudou — evita crossfade à toa.
  // A CENA vem do scene-factory (efeito real p/ ceu-limpo/chuva-*; placeholder p/ o resto).
  private applyState(next: WeatherState): void {
    if (this.current && this.current.id === next.id && this.current.isDay === next.isDay) return;
    this.current = next;
    this.host.crossfadeTo(sceneForState(next), FADE_S);
  }

  currentWeather(): Record<string, unknown> {
    return {
      code: this.lastCode,                                   // weathercode REAL
      isDay: this.lastCode >= 0 ? this.lastIsDay : null,     // is_day REAL
      state: this.current ? this.current.id : null,          // estado renderizado
      stateIsDay: this.current ? this.current.isDay : null,
      source: 'real',
      lastOkAt: this.lastOkAt,
      lastError: this.lastError,
      poller: this.poller.metrics
    };
  }

  get liveState(): WeatherState | null { return this.current; }
}
export default WeatherController;
