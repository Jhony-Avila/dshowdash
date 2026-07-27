import { VERSION } from "/core/version.js";
function createModulePollingManager(moduleId) {
  const MODULE_ID = moduleId;
  const _metrics = { starts: 0, stops: 0, ticks: 0, errors: 0, lastTickAt: null };
  class PollingManager {
    constructor(options = {}) {
      this.interval = options.interval || 3e4;
      this.callback = options.callback || null;
      this._timerId = null;
      this._isRunning = false;
      this._tickCount = 0;
    }
    start(callback) {
      if (this._isRunning) return;
      if (callback) this.callback = callback;
      if (!this.callback) throw new Error("Callback required");
      this._isRunning = true;
      _metrics.starts++;
      this._tick();
      this._timerId = setInterval(() => this._tick(), this.interval);
    }
    stop() {
      if (!this._isRunning) return;
      if (this._timerId) {
        clearInterval(this._timerId);
        this._timerId = null;
      }
      this._isRunning = false;
      _metrics.stops++;
    }
    async _tick() {
      _metrics.ticks++;
      _metrics.lastTickAt = Date.now();
      this._tickCount++;
      try {
        await this.callback();
      } catch (error) {
        _metrics.errors++;
      }
    }
    // @ts-expect-error TS migration - TS2554
    setInterval(ms) {
      this.interval = ms;
      if (this._isRunning) {
        this.stop();
        this.start();
      }
    }
    isRunning() {
      return this._isRunning;
    }
    getTickCount() {
      return this._tickCount;
    }
    resetTickCount() {
      this._tickCount = 0;
    }
    healthCheck() {
      const checks = { notStuck: !this._isRunning || Date.now() - _metrics.lastTickAt < this.interval * 3, lowErrors: _metrics.errors < _metrics.ticks * 0.5 || _metrics.ticks === 0 };
      const passed = Object.values(checks).filter(Boolean).length;
      return { status: passed === 2 ? "HEALTHY" : "DEGRADED", score: passed, maxScore: 2, checks, isRunning: this._isRunning, version: VERSION, moduleId: MODULE_ID };
    }
    info() {
      return { version: VERSION, moduleId: MODULE_ID, isRunning: this._isRunning, interval: this.interval, tickCount: this._tickCount, metrics: { ..._metrics } };
    }
  }
  function getMetrics() {
    return { ..._metrics };
  }
  function resetMetrics() {
    _metrics.starts = 0;
    _metrics.stops = 0;
    _metrics.ticks = 0;
    _metrics.errors = 0;
    _metrics.lastTickAt = null;
  }
  return { PollingManager, getMetrics, resetMetrics, MODULE_ID, VERSION };
}
export {
  createModulePollingManager
};
