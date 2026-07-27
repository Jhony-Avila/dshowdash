const MODULE_ID = "panel-home.weather-fx.weather.weather-poller";
const VERSION = "0.1.0-ETAPA3";
const POLL_INTERVAL_MS = 3e5;
class WeatherPoller {
  source;
  host;
  timer = null;
  busy = false;
  // anti-reentrância (fetch lento > intervalo)
  _metrics = { polls: 0, ok: 0, skipped: 0, errors: 0, lastOkAt: 0 };
  constructor(source, host) {
    this.source = source;
    this.host = host;
  }
  start() {
    if (this.timer !== null) return;
    void this.poll();
    this.timer = setInterval(() => {
      void this.poll();
    }, POLL_INTERVAL_MS);
  }
  // engine chama quando a home/aba volta a ficar visível: leitura imediata
  onVisible() {
    void this.poll();
  }
  async poll() {
    if (this.busy) return;
    if (!this.host.isVisible()) {
      this._metrics.skipped++;
      return;
    }
    this.busy = true;
    this._metrics.polls++;
    try {
      const r = await this.source.read();
      if (r.ok) {
        this._metrics.ok++;
        this._metrics.lastOkAt = performance.now();
        this.host.onReading(r);
      } else {
        this._metrics.errors++;
        this.host.onError("leitura sem weathercode (fallback) \u2014 mant\xE9m \xFAltimo estado");
      }
    } catch (e) {
      this._metrics.errors++;
      this.host.onError("fetch falhou: " + (e instanceof Error ? e.message : "erro"));
    } finally {
      this.busy = false;
    }
  }
  stop() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  get metrics() {
    return { ...this._metrics, interval: POLL_INTERVAL_MS };
  }
}
var weather_poller_default = WeatherPoller;
export {
  MODULE_ID,
  POLL_INTERVAL_MS,
  VERSION,
  WeatherPoller,
  weather_poller_default as default
};
