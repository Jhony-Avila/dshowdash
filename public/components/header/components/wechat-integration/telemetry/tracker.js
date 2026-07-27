const VERSION = "5.1.0-ENTERPRISE";
const MODULE_ID = "header/components/wechat-integration/telemetry/tracker";
let _debug = false;
let _logBuffer = [];
function _log(level, ...args) {
  if (!_debug && level === "debug") return;
  _logBuffer.push({ level, args, ts: Date.now() });
  if (_logBuffer.length > 50) _logBuffer.shift();
}
class TelemetryTracker {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.events = [];
    this.maxEvents = options.maxEvents || 100;
    this._metrics = { trackCount: 0, flushCount: 0, lastTrackAt: null };
  }
  track(event, data = {}) {
    if (!this.enabled) return;
    this.events.push({ event, data, timestamp: Date.now() });
    this._metrics.trackCount++;
    this._metrics.lastTrackAt = Date.now();
    if (this.events.length > this.maxEvents) this.events.shift();
  }
  getEvents() {
    return [...this.events];
  }
  flush() {
    const evts = [...this.events];
    this.events = [];
    this._metrics.flushCount++;
    return evts;
  }
  clear() {
    this.events = [];
  }
  enable() {
    this.enabled = true;
  }
  disable() {
    this.enabled = false;
  }
  healthCheck() {
    const checks = { enabled: this.enabled, belowMax: this.events.length < this.maxEvents };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 2 ? "HEALTHY" : "DEGRADED", score: passed, maxScore: 2, scoreDisplay: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, enabled: this.enabled, eventCount: this.events.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(enabled) {
    _debug = !!enabled;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { trackCount: 0, flushCount: 0, lastTrackAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [..._logBuffer];
  }
}
function setDebug(enabled) {
  _debug = !!enabled;
}
function getLogs() {
  return [..._logBuffer];
}
var tracker_default = TelemetryTracker;
export {
  MODULE_ID,
  TelemetryTracker,
  VERSION,
  tracker_default as default,
  getLogs,
  setDebug
};
