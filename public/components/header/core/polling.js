import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { SYSTEM_EVENTS } from "/core/runtime/events/catalog/system.events.js";
import { DOMHelpers } from "../utils/dom.js";
const VERSION = "5.9.0-ES6";
const MODULE_ID = "header/core/polling";
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _debugEnabled = () => _getPort("config")?.app?.debug || false;
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  if (level === "error") {
    logger.error?.(`[${MODULE_ID}]`, ...args);
    return;
  }
  if (level === "warn") {
    logger.warn?.(`[${MODULE_ID}]`, ...args);
    return;
  }
  if (_debugEnabled()) logger.debug?.(`[${MODULE_ID}]`, ...args);
};
function _getErrorMessage(error) {
  if (!error) return "Erro desconhecido (undefined)";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message || error.name || "Error sem mensagem";
  if (typeof error.message === "string") return error.message;
  if (typeof error.toString === "function") {
    const str = error.toString();
    if (str !== "[object Object]") return str;
  }
  try {
    return JSON.stringify(error);
  } catch (e) {
    return "Erro nao serializavel";
  }
}
class PollingManager {
  constructor(config, healthAPI, alertsAPI, networkMonitor, store, timers, telemetry, logger, eventBus) {
    if (!config || !config.polling) throw new TypeError("Config e obrigatorio e deve conter polling");
    this.config = { healthInterval: config.polling.healthInterval || 15e3, alertsInterval: config.polling.alertsInterval || 3e4, networkQualityInterval: config.polling.networkQualityInterval || 3e4, syncDebounceInterval: config.polling.syncDebounceInterval || 1e3, backoffSequence: config.polling.backoffSequence || [5e3, 1e4, 2e4, 3e4, 6e4], rttSamples: config.network?.rttSamples || 10, rttThresholds: config.network?.rttThresholds || { online: 120, degraded: 350 }, instanceId: config.instanceId || "polling-manager-default" };
    this.healthAPI = healthAPI;
    this.alertsAPI = alertsAPI;
    this.networkMonitor = networkMonitor;
    this.store = store;
    this.timers = timers;
    this.telemetry = telemetry;
    this.logger = logger || this._createLogger();
    this.eventBus = eventBus;
    this._debug = false;
    this.isActive = false;
    this.isPaused = false;
    this.isDestroyed = false;
    this.backoffIndex = 0;
    this.lastConnectivityStatus = null;
    this._metrics = { totalHealthPolls: 0, totalHealthSuccess: 0, totalHealthFailures: 0, totalAlertsPolls: 0, totalAlertsSuccess: 0, totalAlertsFailures: 0, totalNetworkUpdates: 0, reconnectAttempts: 0, currentBackoffIndex: 0, lastHealthPollAt: null, lastAlertsPollAt: null, lastNetworkUpdateAt: null, startedAt: null, stoppedAt: null, uptime: 0 };
    this.healthHistory = [];
    this.alertsHistory = [];
    this.maxHistorySize = 50;
  }
  _createLogger() {
    const prefix = `[PollingManager:${this.config.instanceId}]`;
    return { debug: (...args) => _log("debug", prefix, ...args), info: (...args) => _log("info", prefix, ...args), warn: (...args) => _log("warn", prefix, ...args), error: (...args) => _log("error", prefix, ...args) };
  }
  _log(level, ...args) {
    if (!this._debug && level === "debug") return;
    _log(level, ...args);
  }
  _isTimersAvailable() {
    return this.timers && !this.timers.isDestroyed;
  }
  start() {
    if (this.isActive && !this.isPaused) {
      this._log("warn", "Polling ja esta ativo");
      return;
    }
    if (this.isDestroyed) {
      this._log("error", "PollingManager foi destruido - nao pode iniciar");
      return;
    }
    if (!this._isTimersAvailable()) {
      this._log("warn", "TimersManager nao disponivel - polling nao iniciado");
      return;
    }
    this.isActive = true;
    this.isPaused = false;
    this._metrics.startedAt = Date.now();
    this._log("info", "Polling unificado iniciado");
    this.startHealthPolling();
    if (this._isTimersAvailable()) {
      this.timers.setInterval("alerts", async () => {
        if (!document.hidden && this.isActive && !this.isPaused) await this.pollAlerts();
      }, this.config.alertsInterval);
    }
    if (this._isTimersAvailable()) {
      this.timers.setInterval("networkQuality", () => {
        if (!document.hidden && this.isActive && !this.isPaused) {
          this._metrics.totalNetworkUpdates++;
          this._metrics.lastNetworkUpdateAt = Date.now();
          if (this.networkMonitor) this.networkMonitor.update();
        }
      }, this.config.networkQualityInterval);
    }
    this._startUptimeTracking();
  }
  _startUptimeTracking() {
    if (!this._isTimersAvailable()) return;
    this.timers.setInterval("uptime", () => {
      if (this.isActive && !this.isPaused) this._metrics.uptime += 5e3;
    }, 5e3);
  }
  stop() {
    if (!this.isActive) {
      this._log("warn", "Polling nao esta ativo");
      return;
    }
    this.isActive = false;
    this.isPaused = false;
    this._metrics.stoppedAt = Date.now();
    if (this._isTimersAvailable()) this.timers.clearAll();
    this._log("info", "Polling parado");
  }
  pause() {
    if (!this.isActive) {
      this._log("warn", "Polling nao esta ativo - pause ignorado");
      return;
    }
    if (this.isPaused) {
      this._log("warn", "Polling ja esta pausado");
      return;
    }
    this.isPaused = true;
    if (this._isTimersAvailable()) this.timers.clearAll();
    this._log("info", "Polling pausado");
  }
  resume() {
    if (!this.isActive) {
      this._log("warn", "Polling nao esta ativo - resume ignorado");
      return;
    }
    if (!this.isPaused) {
      this._log("warn", "Polling nao esta pausado");
      return;
    }
    this.isPaused = false;
    this._log("info", "Polling retomado");
    this._restartIntervals();
  }
  _restartIntervals() {
    if (this._isTimersAvailable()) this.timers.clearAll();
    this.startHealthPolling();
    if (this._isTimersAvailable()) {
      this.timers.setInterval("alerts", async () => {
        if (!document.hidden && this.isActive && !this.isPaused) await this.pollAlerts();
      }, this.config.alertsInterval);
    }
    if (this._isTimersAvailable()) {
      this.timers.setInterval("networkQuality", () => {
        if (!document.hidden && this.isActive && !this.isPaused) {
          this._metrics.totalNetworkUpdates++;
          this._metrics.lastNetworkUpdateAt = Date.now();
          if (this.networkMonitor) this.networkMonitor.update();
        }
      }, this.config.networkQualityInterval);
    }
    this._startUptimeTracking();
  }
  async startHealthPolling() {
    if (this.isDestroyed || !this._isTimersAvailable()) return;
    await this.pollHealth();
    if (this.isDestroyed || !this._isTimersAvailable()) {
      this._log("debug", "Timers indisponivel apos pollHealth - interval nao registrado");
      return;
    }
    this.timers.setInterval("health", async () => {
      if (!document.hidden && this.isActive && !this.isPaused) await this.pollHealth();
    }, this.config.healthInterval);
  }
  // @ts-expect-error strict migration — TS2345
  async pollHealth() {
    if (this.isDestroyed) return;
    if (!this.healthAPI) {
      this._log("warn", "HealthAPI nao disponivel - pollHealth ignorado");
      return;
    }
    this._metrics.totalHealthPolls++;
    this._metrics.lastHealthPollAt = Date.now();
    try {
      const result = await this.healthAPI.ping();
      if (result && result.ok) {
        this._metrics.totalHealthSuccess++;
        this.handleHealthSuccess(result.rttMs, result.status, result.data);
        this._addToHealthHistory({ success: true, rttMs: result.rttMs, status: result.status, data: result.data });
      } else {
        this._metrics.totalHealthFailures++;
        const errorMsg = result ? result.error || "Resposta sem ok" : "Resultado nulo";
        this.handleHealthError(errorMsg, result ? result.status : null);
        this._addToHealthHistory({ success: false, error: errorMsg, status: result ? result.status : null });
      }
    } catch (error) {
      this._metrics.totalHealthFailures++;
      const errMsg = _getErrorMessage(error);
      this._log("warn", `Erro em pollHealth: ${errMsg}`);
      this._addToHealthHistory({ success: false, error: errMsg });
      this.handleHealthError(errMsg, null);
    }
  }
  // @ts-expect-error TS migration - TS2339, TS2367
  handleHealthSuccess(rttMs, status, healthData) {
    if (!this.store) return;
    const state = this.store.getState();
    this.backoffIndex = 0;
    this._metrics.currentBackoffIndex = 0;
    if (this._isTimersAvailable()) this.timers.clear("reconnect");
    const history = [...state.connectivity?.rttHistory || []];
    history.push(rttMs);
    if (history.length > this.config.rttSamples) history.shift();
    const medianRtt = Math.round(DOMHelpers.median(history));
    const jitter = Math.round(DOMHelpers.mad(history));
    let connectivityStatus;
    if (medianRtt <= this.config.rttThresholds.online) connectivityStatus = "online";
    else if (medianRtt <= this.config.rttThresholds.degraded) connectivityStatus = "degraded";
    else connectivityStatus = "poor";
    this.store.updateConnectivity({ online: true, rttMs: medianRtt, jitter, rttHistory: history, timeoutCount: 0, status: connectivityStatus });
    if (healthData) {
      const healthStatus = healthData.status || "unknown";
      const checks = healthData.checks || {};
      let degradedReason = null;
      if (healthStatus === "degraded") {
        const failedChecks = Object.entries(checks).filter(([key, value]) => value.status === "unavailable" || value.status === "unhealthy").map(([key]) => key);
        if (failedChecks.length > 0) degradedReason = `${failedChecks.join(", ")} unavailable`;
      }
      this.store.updateHealth({ status: healthStatus, checks: { database: checks.database?.status || "unknown", disk: checks.disk?.status || "unknown", memory: checks.memory?.status || "unknown", php: checks.php?.status || "unknown" }, responseTimeMs: healthData.response_time_ms || rttMs, degradedReason });
      if (this.eventBus && SYSTEM_EVENTS && SYSTEM_EVENTS.HEALTH_CHECKED) {
        this.eventBus.emit(SYSTEM_EVENTS.HEALTH_CHECKED, { status: healthStatus, checks, response_time_ms: healthData.response_time_ms || rttMs, timestamp: Date.now() });
      }
    }
    if (this.networkMonitor) this.networkMonitor.update();
    if (this.telemetry && typeof this.telemetry.trackNetChange === "function") {
      const conn = navigator.connection;
      this.telemetry.trackNetChange({ online: true, rttMs: medianRtt, quality: state.connectivity?.quality, jitter, downlink: conn?.downlink || null, effectiveType: conn?.effectiveType || null, saveData: conn?.saveData || null, at: Date.now() });
    }
    if (status === 401 || status === 403) {
      this._log("warn", `Autenticacao expirada: ${status}`);
      if (this.telemetry && typeof this.telemetry.trackAuthExpired === "function") this.telemetry.trackAuthExpired(status);
    }
  }
  handleHealthError(error, status) {
    if (!this.store) return;
    const state = this.store.getState();
    const timeoutCount = (state.connectivity?.timeoutCount || 0) + 1;
    if (this.telemetry && typeof this.telemetry.trackNetError === "function") this.telemetry.trackNetError(error, timeoutCount);
    if (timeoutCount >= 2) {
      this.store.updateConnectivity({ online: false, timeoutCount, status: "offline" });
      this.scheduleReconnect();
    } else {
      this.store.updateConnectivity({ timeoutCount });
    }
    this._log("warn", `Ping falhou: ${error} (${timeoutCount} timeouts)`);
  }
  scheduleReconnect() {
    if (!this._isTimersAvailable()) return;
    this.timers.clear("health");
    this.timers.clear("reconnect");
    const delay = this.config.backoffSequence[Math.min(this.backoffIndex, this.config.backoffSequence.length - 1)];
    this._metrics.reconnectAttempts++;
    this._metrics.currentBackoffIndex = this.backoffIndex;
    this._log("info", `Reconectando em ${delay / 1e3}s (backoff ${this.backoffIndex + 1})`);
    this.timers.set("reconnect", () => {
      this.backoffIndex++;
      this.startHealthPolling();
    }, delay);
  }
  async pollAlerts() {
    if (this.isDestroyed || !this.alertsAPI) return;
    this._metrics.totalAlertsPolls++;
    this._metrics.lastAlertsPollAt = Date.now();
    try {
      const result = await this.alertsAPI.getAlerts();
      if (result && result.success) {
        this._metrics.totalAlertsSuccess++;
        if (this.store) this.store.updateAlerts({ critical: result.critical, warning: result.warning, info: result.info || 0, lastErrorAt: result.lastErrorAt, lastWarningAt: result.lastWarningAt || null });
        this._addToAlertsHistory({ success: true, critical: result.critical, warning: result.warning, info: result.info || 0 });
        if (this.telemetry && typeof this.telemetry.trackAlertsUpdate === "function") this.telemetry.trackAlertsUpdate(result.critical, result.warning, result.lastErrorAt);
      } else {
        this._metrics.totalAlertsFailures++;
        const errorMsg = result ? result.error || "Resposta sem success" : "Resultado nulo";
        this._addToAlertsHistory({ success: false, error: errorMsg });
        this._log("warn", `Erro ao buscar alertas: ${errorMsg}`);
      }
    } catch (error) {
      this._metrics.totalAlertsFailures++;
      const errMsg = _getErrorMessage(error);
      this._addToAlertsHistory({ success: false, error: errMsg });
      this._log("warn", `Erro em pollAlerts: ${errMsg}`);
    }
  }
  _addToHealthHistory(entry) {
    this.healthHistory.push({ ...entry, timestamp: Date.now() });
    if (this.healthHistory.length > this.maxHistorySize) this.healthHistory.shift();
  }
  _addToAlertsHistory(entry) {
    this.alertsHistory.push({ ...entry, timestamp: Date.now() });
    if (this.alertsHistory.length > this.maxHistorySize) this.alertsHistory.shift();
  }
  getMetrics() {
    const healthSuccessRate = this._metrics.totalHealthPolls > 0 ? this._metrics.totalHealthSuccess / this._metrics.totalHealthPolls : 0;
    const alertsSuccessRate = this._metrics.totalAlertsPolls > 0 ? this._metrics.totalAlertsSuccess / this._metrics.totalAlertsPolls : 0;
    return { ...this._metrics, healthSuccessRate: Math.round(healthSuccessRate * 100) / 100, alertsSuccessRate: Math.round(alertsSuccessRate * 100) / 100, healthHistorySize: this.healthHistory.length, alertsHistorySize: this.alertsHistory.length, isActive: this.isActive, isPaused: this.isPaused, isDestroyed: this.isDestroyed };
  }
  healthCheck() {
    const checks = { notDestroyed: !this.isDestroyed, isActive: this.isActive, notPaused: !this.isPaused, hasHealthAPI: !!this.healthAPI, hasAlertsAPI: !!this.alertsAPI, timersAvailable: this._isTimersAvailable() };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed === total ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter(([, v]) => !v).map(([k]) => k), version: VERSION, moduleId: MODULE_ID, instanceId: this.config.instanceId, portsInitialized: Ports.isInitialized(), uptime: this._metrics.uptime, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  // @ts-expect-error strict migration — TS2322
  getHealthHistory(limit = null) {
    const history = [...this.healthHistory];
    return limit ? history.slice(-limit) : history;
  }
  // @ts-expect-error strict migration — TS2322
  getAlertsHistory(limit = null) {
    const history = [...this.alertsHistory];
    return limit ? history.slice(-limit) : history;
  }
  resetBackoff() {
    this.backoffIndex = 0;
    this._metrics.currentBackoffIndex = 0;
    if (this._isTimersAvailable()) this.timers.clear("reconnect");
    this._log("info", "Backoff resetado");
  }
  async forceHealthPoll() {
    this._log("info", "Health poll forcado");
    return await this.pollHealth();
  }
  async forceAlertsPoll() {
    this._log("info", "Alerts poll forcado");
    return await this.pollAlerts();
  }
  destroy() {
    if (this.isDestroyed) {
      this._log("warn", "PollingManager ja destruido");
      return;
    }
    if (this.isActive) this.stop();
    this.healthHistory = [];
    this.alertsHistory = [];
    this.isDestroyed = true;
    this._log("info", "PollingManager destruido");
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, instanceId: this.config.instanceId, portsInitialized: Ports.isInitialized(), isActive: this.isActive, isPaused: this.isPaused, timersAvailable: this._isTimersAvailable(), metrics: this.getMetrics(), healthCheck: this.healthCheck() };
  }
  setDebug(enabled) {
    this._debug = !!enabled;
  }
  resetMetrics() {
    this._metrics = { totalHealthPolls: 0, totalHealthSuccess: 0, totalHealthFailures: 0, totalAlertsPolls: 0, totalAlertsSuccess: 0, totalAlertsFailures: 0, totalNetworkUpdates: 0, reconnectAttempts: 0, currentBackoffIndex: 0, lastHealthPollAt: null, lastAlertsPollAt: null, lastNetworkUpdateAt: null, startedAt: null, stoppedAt: null, uptime: 0 };
  }
}
function getVersion() {
  return VERSION;
}
function setDebug(enabled) {
}
var polling_default = PollingManager;
export {
  MODULE_ID,
  PollingManager,
  VERSION,
  polling_default as default,
  getPorts,
  getVersion,
  injectPorts,
  setDebug
};
