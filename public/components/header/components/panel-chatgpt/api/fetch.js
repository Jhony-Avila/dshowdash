import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "10.2.0-P2-ENTERPRISE";
const MODULE_ID = "header.panel-chatgpt.api.fetch";
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _debug = () => _getPort("config")?.app?.debug || false;
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  if (!_debug() && level === "debug") return;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn(`[${MODULE_ID}]`, ...args);
};
function _createFallback(reason, endpoint) {
  return { data: null, status: "unavailable", _fallback: true, _fallback_reason: reason, _endpoint: endpoint };
}
function _isAbortError(error) {
  if (!error) return false;
  if (error.name === "AbortError") return true;
  const msg = String(error.message || "").toLowerCase();
  return msg.includes("aborted") || msg.includes("abort");
}
class FetchAPI {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || "";
    this.timeout = options.timeout || 12e3;
    this._abortController = null;
    this._metrics = { requests: 0, successes: 0, failures: 0, lastRequestAt: null };
  }
  async fetch(endpoint, options = {}) {
    this._metrics.requests++;
    this._metrics.lastRequestAt = Date.now();
    this._abortController = new AbortController();
    const timeoutId = setTimeout(() => this._abortController.abort(), this.timeout);
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, { ...options, signal: this._abortController.signal });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      this._metrics.successes++;
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      this._metrics.failures++;
      if (_isAbortError(error)) {
        _log("warn", "Fetch aborted (non-fatal)", { endpoint, timeout: this.timeout });
        return _createFallback("timeout", endpoint);
      }
      _log("error", "Fetch failed (non-fatal)", { endpoint, error: error.message });
      return _createFallback("error", endpoint);
    }
  }
  abort() {
    if (this._abortController) this._abortController.abort();
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { requests: 0, successes: 0, failures: 0, lastRequestAt: null };
  }
  healthCheck() {
    const ps = Ports.snapshot();
    const successRate = this._metrics.requests > 0 ? this._metrics.successes / this._metrics.requests : 1;
    const checks = { ready: true, goodSuccessRate: successRate > 0.5, portsInitialized: ps._initialized };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 3 ? "HEALTHY" : "DEGRADED", score: passed, maxScore: 3, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: ps._initialized };
  }
  info() {
    const ps = Ports.snapshot();
    return { version: VERSION, moduleId: MODULE_ID, baseUrl: this.baseUrl, metrics: this.getMetrics(), portsInitialized: ps._initialized };
  }
  destroy() {
    this.resetMetrics?.();
  }
}
var fetch_default = FetchAPI;
export {
  FetchAPI,
  MODULE_ID,
  VERSION,
  fetch_default as default,
  getPorts,
  injectPorts
};
