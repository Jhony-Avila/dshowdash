import FetchAdapter from "./fetch.js";
const VERSION = "5.1.0-ENTERPRISE";
const MODULE_ID = "footer/components/status-devices/api/alerts";
let _debug = false;
let _logBuffer = [];
function _log(level, ...args) {
  if (!_debug && level === "debug") return;
  _logBuffer.push({ level, args, ts: Date.now() });
  if (_logBuffer.length > 50) _logBuffer.shift();
}
class AlertsAPI {
  // @ts-expect-error TS migration - TS2351
  constructor(options = {}) {
    this.fetch = new FetchAdapter({ baseURL: options.baseURL || "/api" });
    this._metrics = { getCount: 0, successCount: 0, errorCount: 0, lastGetAt: null };
  }
  async getAlerts() {
    this._metrics.getCount++;
    this._metrics.lastGetAt = Date.now();
    try {
      const response = await this.fetch.get("/alerts/list.php");
      this._metrics.successCount++;
      return { ok: true, alerts: response.alerts || [] };
    } catch (error) {
      this._metrics.errorCount++;
      return { ok: false, alerts: [] };
    }
  }
  healthCheck() {
    const checks = { fetchReady: !!this.fetch, goodSuccessRate: this._metrics.getCount === 0 || this._metrics.successCount / this._metrics.getCount > 0.5 };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 2 ? "HEALTHY" : "DEGRADED", score: passed, maxScore: 2, scoreDisplay: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(enabled) {
    _debug = !!enabled;
    if (this.fetch?.setDebug) this.fetch.setDebug(enabled);
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { getCount: 0, successCount: 0, errorCount: 0, lastGetAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [..._logBuffer];
  }
}
function getVersion() {
  return VERSION;
}
function setDebug(enabled) {
  _debug = !!enabled;
}
function getLogs() {
  return [..._logBuffer];
}
var alerts_default = AlertsAPI;
export {
  AlertsAPI,
  MODULE_ID,
  VERSION,
  alerts_default as default,
  getLogs,
  getVersion,
  setDebug
};
