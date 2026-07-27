const VERSION = "5.5.0-ENTERPRISE";
const MODULE_ID = "login-modal-utils-timers";
const isBrowser = typeof window !== "undefined";
const TIMER_KEYS = { ERROR_AUTO_HIDE: "error:auto-hide", ERROR_COUNTDOWN: "error:countdown", VIDEO_LOAD: "video:load-timeout", RATE_LIMIT_RESET: "rate-limit:reset", SESSION_CHECK: "session:check" };
class TimersManager {
  constructor(config = {}) {
    this.config = config;
    this.namespace = config.namespace || "login-modal";
    this.telemetry = config.telemetry || null;
    this.ignorePagehide = config.ignorePagehide || false;
    this.timers = /* @__PURE__ */ new Map();
    this.intervals = /* @__PURE__ */ new Map();
    this.abortController = new AbortController();
    this.abortSignal = this.abortController.signal;
    this.metrics = { created: 0, expired: 0, cancelled: 0, aborted: 0 };
    if (!this.ignorePagehide) this._bindPagehide();
  }
  set(name, callback, delay) {
    const key = this._namespaceKey(name);
    this.clear(key, { skipNamespace: true });
    const wrappedCallback = () => {
      callback();
      this.timers.delete(key);
      this.metrics.expired++;
      this._track("timer:expired", { name: key, delay });
    };
    const timerId = setTimeout(wrappedCallback, delay);
    this.timers.set(key, { id: timerId, type: "timeout", startedAt: Date.now(), delay, callback });
    this.metrics.created++;
    return timerId;
  }
  interval(name, callback, delay, options = {}) {
    const key = this._namespaceKey(name);
    this.clearInterval(key, { skipNamespace: true });
    const driftCorrection = options.driftCorrection !== false;
    const expectedInterval = delay;
    let expectedTime = Date.now() + expectedInterval;
    const wrappedCallback = () => {
      callback();
      if (driftCorrection) {
        const drift = Date.now() - expectedTime;
        expectedTime += expectedInterval;
        const nextDelay = Math.max(0, expectedInterval - drift);
        const intervalId2 = setTimeout(wrappedCallback, nextDelay);
        const current = this.intervals.get(key);
        if (current) current.id = intervalId2;
      }
    };
    const intervalId = driftCorrection ? setTimeout(wrappedCallback, delay) : setInterval(callback, delay);
    this.intervals.set(key, { id: intervalId, type: "interval", startedAt: Date.now(), delay, driftCorrection, callback });
    this.metrics.created++;
    return intervalId;
  }
  wait(name, delay) {
    const key = this._namespaceKey(name);
    return new Promise((resolve, reject) => {
      const wrappedCallback = () => {
        resolve({ name: key, elapsed: delay });
      };
      const timerId = this._setInternal(key, wrappedCallback, delay);
      this.abortSignal.addEventListener("abort", () => {
        this.clear(key, { skipNamespace: true });
        reject(new Error(`Timer ${key} aborted`));
      }, { once: true });
    });
  }
  _setInternal(key, callback, delay) {
    this.clear(key, { skipNamespace: true });
    const wrappedCallback = () => {
      callback();
      this.timers.delete(key);
      this.metrics.expired++;
      this._track("timer:expired", { name: key, delay });
    };
    const timerId = setTimeout(wrappedCallback, delay);
    this.timers.set(key, { id: timerId, type: "timeout", startedAt: Date.now(), delay, callback });
    this.metrics.created++;
    return timerId;
  }
  clear(name, options = {}) {
    const key = options.skipNamespace ? name : this._namespaceKey(name);
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer.id);
      this.timers.delete(key);
      this.metrics.cancelled++;
      this._track("timer:cancelled", { name: key });
    }
  }
  clearInterval(name, options = {}) {
    const key = options.skipNamespace ? name : this._namespaceKey(name);
    const interval = this.intervals.get(key);
    if (interval) {
      if (interval.driftCorrection) clearTimeout(interval.id);
      else clearInterval(interval.id);
      this.intervals.delete(key);
      this.metrics.cancelled++;
      this._track("interval:cancelled", { name: key });
    }
  }
  clearAll() {
    this.timers.forEach((timer) => clearTimeout(timer.id));
    this.timers.clear();
    this.intervals.forEach((interval) => {
      if (interval.driftCorrection) clearTimeout(interval.id);
      else clearInterval(interval.id);
    });
    this.intervals.clear();
    this._track("timers:cleared-all", { count: this.metrics.created });
  }
  abort() {
    this.abortController.abort();
    this.clearAll();
    this.metrics.aborted++;
    this._track("timers:aborted", { totalAborted: this.metrics.aborted });
  }
  has(name) {
    const key = this._namespaceKey(name);
    return this.timers.has(key) || this.intervals.has(key);
  }
  getMetadata(name) {
    const key = this._namespaceKey(name);
    const timer = this.timers.get(key) || this.intervals.get(key);
    if (!timer) return null;
    return { type: timer.type, startedAt: timer.startedAt, delay: timer.delay, elapsed: Date.now() - timer.startedAt, driftCorrection: timer.driftCorrection || false };
  }
  getMetrics() {
    return { ...this.metrics, active: this.timers.size + this.intervals.size };
  }
  resetMetrics() {
    this.metrics = { created: 0, expired: 0, cancelled: 0, aborted: 0 };
  }
  _namespaceKey(name) {
    if (name.startsWith(`${this.namespace}:`)) return name;
    if (name.includes(":")) return `${this.namespace}:${name}`;
    return `${this.namespace}:${name}`;
  }
  _bindPagehide() {
    if (!isBrowser) return;
    window.addEventListener("pagehide", () => {
      this.clearAll();
    }, { once: true });
  }
  _track(event, detail = {}) {
    if (this.telemetry && typeof this.telemetry === "function") this.telemetry(event, { ...detail, timestamp: Date.now(), source: "timers-manager" });
  }
  info() {
    return { moduleId: MODULE_ID, version: VERSION, metrics: this.getMetrics(), activeTimers: this.timers.size, activeIntervals: this.intervals.size, namespace: this.namespace, timestamp: Date.now() };
  }
  healthCheck() {
    const checks = { notAborted: !this.abortSignal.aborted, reasonableActiveCount: this.timers.size + this.intervals.size < 50, lowCancelRate: this.metrics.created === 0 || this.metrics.cancelled / this.metrics.created < 0.9 };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/${total}`, healthy: passed >= 2, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
  }
}
var timers_default = TimersManager;
export {
  MODULE_ID,
  TIMER_KEYS,
  TimersManager,
  VERSION,
  timers_default as default
};
