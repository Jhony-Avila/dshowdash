'use strict';
// =============================================================
// weather-fx / weather / weather-poller — poller PRÓPRIO do clima.
// 5min (igual ao header; não martela a API). GATE de visibilidade:
// não faz fetch se a aba está hidden OU a home está oculta. 1ª leitura
// no start; leitura imediata ao voltar a ficar visível (onVisible).
// Tolerante a falha: repassa erro ao host (que mantém o último estado).
// =============================================================
import type { WeatherSource, WeatherReading } from './weather-source.js';
export const MODULE_ID = 'panel-home.weather-fx.weather.weather-poller';
export const VERSION = '0.1.0-ETAPA3';

export const POLL_INTERVAL_MS = 300000;   // 5min

export interface PollerHost {
  isVisible: () => boolean;                       // home visível E aba não-hidden
  onReading: (r: WeatherReading) => void;
  onError: (msg: string) => void;
}

export class WeatherPoller {
  private source: WeatherSource;
  private host: PollerHost;
  private timer: number | null = null;
  private busy = false;                            // anti-reentrância (fetch lento > intervalo)
  private _metrics = { polls: 0, ok: 0, skipped: 0, errors: 0, lastOkAt: 0 };

  constructor(source: WeatherSource, host: PollerHost) {
    this.source = source; this.host = host;
  }

  start(): void {
    if (this.timer !== null) return;
    void this.poll();                                                   // 1ª leitura no mount
    this.timer = setInterval(() => { void this.poll(); }, POLL_INTERVAL_MS) as unknown as number;
  }

  // engine chama quando a home/aba volta a ficar visível: leitura imediata
  onVisible(): void { void this.poll(); }

  private async poll(): Promise<void> {
    if (this.busy) return;
    if (!this.host.isVisible()) { this._metrics.skipped++; return; }    // GATE: nenhum fetch oculto
    this.busy = true; this._metrics.polls++;
    try {
      const r = await this.source.read();
      if (r.ok) { this._metrics.ok++; this._metrics.lastOkAt = performance.now(); this.host.onReading(r); }
      else { this._metrics.errors++; this.host.onError('leitura sem weathercode (fallback) — mantém último estado'); }
    } catch (e) {
      this._metrics.errors++;
      this.host.onError('fetch falhou: ' + (e instanceof Error ? e.message : 'erro'));
    } finally { this.busy = false; }
  }

  stop(): void {
    if (this.timer !== null) { clearInterval(this.timer); this.timer = null; }
  }

  get metrics(): Record<string, number> { return { ...this._metrics, interval: POLL_INTERVAL_MS }; }
}
export default WeatherPoller;
