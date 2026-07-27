import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { SYSTEM_EVENTS } from "/core/runtime/events/catalog/system.events.js";
import { DOMHelpers } from "../utils/dom.js";
const VERSION = "5.6.0-P18EC";
const MODULE_ID = "header/core/network-quality";
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
class NetworkQualityMonitor {
  // @ts-expect-error TS migration - TS2339
  constructor(config, store, logger) {
    if (!config || !config.network) throw new TypeError("Config \xE9 obrigat\xF3rio e deve conter network");
    this.config = { debounce: config.network.debounce || 500, updateInterval: config.network.updateInterval || 3e4, historySize: config.network.historySize || 50, instanceId: config.instanceId || "network-monitor-default" };
    this.store = store;
    this.logger = logger || this._createLogger();
    this._debug = false;
    this._onChange = DOMHelpers.debounce(() => this.update(), this.config.debounce);
    this._listeners = /* @__PURE__ */ new Map();
    this._lastQuality = null;
    this._lastUpdate = null;
    this._isMounted = false;
    this._isDestroyed = false;
    this._metrics = { totalUpdates: 0, qualityChanges: 0, lastChangeAt: null, timeInExcellent: 0, timeInGood: 0, timeInRegular: 0, timeInPoor: 0, timeInOffline: 0 };
    this.history = [];
    this._updateIntervalId = null;
    this._qualityStartTime = Date.now();
    this._qualityTrackingInterval = null;
  }
  _createLogger() {
    const prefix = `[NetworkMonitor:${this.config.instanceId}]`;
    return { debug: (...args) => _log("debug", prefix, ...args), info: (...args) => _log("info", prefix, ...args), warn: (...args) => _log("warn", prefix, ...args), error: (...args) => _log("error", prefix, ...args) };
  }
  _log(level, ...args) {
    if (!this._debug && level === "debug") return;
    _log(level, ...args);
  }
  mount() {
    if (this._isMounted) {
      this._log("warn", "NetworkQualityMonitor j\xE1 montado");
      return;
    }
    if (this._isDestroyed) {
      this._log("error", "NetworkQualityMonitor foi destru\xEDdo - n\xE3o pode montar");
      return;
    }
    this.update();
    if ("connection" in navigator) {
      navigator.connection.addEventListener("change", this._onChange);
      this._log("debug", "Connection API listener registrado");
    } else {
      this._log("warn", "Connection API n\xE3o dispon\xEDvel");
    }
    this._updateIntervalId = setInterval(() => {
      if (!this._isDestroyed) this.update();
    }, this.config.updateInterval);
    this._startQualityTracking();
    this._isMounted = true;
    this._log("info", "NetworkQualityMonitor montado");
  }
  _startQualityTracking() {
    this._qualityTrackingInterval = setInterval(() => {
      if (this._isDestroyed || !this._lastQuality) return;
      const elapsed = 5e3;
      switch (this._lastQuality) {
        case "excellent":
          this._metrics.timeInExcellent += elapsed;
          break;
        case "good":
          this._metrics.timeInGood += elapsed;
          break;
        case "regular":
          this._metrics.timeInRegular += elapsed;
          break;
        case "poor":
          this._metrics.timeInPoor += elapsed;
          break;
        case "offline":
          this._metrics.timeInOffline += elapsed;
          break;
      }
    }, 5e3);
  }
  on(event, callback) {
    if (typeof callback !== "function") throw new TypeError("Callback deve ser fun\xE7\xE3o");
    if (!this._listeners.has(event)) this._listeners.set(event, /* @__PURE__ */ new Set());
    this._listeners.get(event).add(callback);
    this._log("debug", `Listener registrado: ${event}`);
    return () => this.off(event, callback);
  }
  off(event, callback) {
    if (this._listeners.has(event)) {
      const deleted = this._listeners.get(event).delete(callback);
      if (deleted) this._log("debug", `Listener removido: ${event}`);
      return deleted;
    }
    return false;
  }
  emit(event, data) {
    if (!this._listeners.has(event)) return;
    const listeners = this._listeners.get(event);
    let errorCount = 0;
    listeners.forEach((callback) => {
      try {
        callback(data);
      } catch (err) {
        errorCount++;
        this._log("error", `Erro em listener de '${event}':`, err);
      }
    });
    if (errorCount > 0) this._log("warn", `${errorCount} erros em listeners de '${event}'`);
  }
  update() {
    if (this._isDestroyed) {
      this._log("warn", "NetworkQualityMonitor destru\xEDdo - update ignorado");
      return null;
    }
    this._metrics.totalUpdates++;
    this._lastUpdate = Date.now();
    const state = this.store.getState();
    let quality, tooltip, rtt, effectiveType, downlink, status;
    if (!state.connectivity.online) {
      quality = "offline";
      status = "offline";
      tooltip = "Sem conex\xE3o com a internet";
      this._updateQuality(quality, tooltip, { status, rtt: null, effectiveType: null, downlink: null });
      return { quality, tooltip, status };
    }
    if ("connection" in navigator && navigator.connection) {
      const conn = navigator.connection;
      effectiveType = conn.effectiveType;
      downlink = conn.downlink;
      rtt = conn.rtt;
      if (effectiveType === "4g" && downlink >= 10) {
        quality = "excellent";
        status = "online";
        tooltip = `Rede: ${effectiveType} (down ${downlink.toFixed(1)} Mbps) - Excelente`;
      } else if (effectiveType === "4g" || effectiveType === "3g" && downlink >= 5) {
        quality = "good";
        status = "online";
        tooltip = `Rede: ${effectiveType} (down ${downlink.toFixed(1)} Mbps) - Boa`;
      } else if (effectiveType === "3g") {
        quality = "regular";
        status = "degraded";
        tooltip = `Rede: ${effectiveType} (down ${downlink.toFixed(1)} Mbps) - Regular`;
      } else if (effectiveType === "2g") {
        quality = "poor";
        status = "degraded";
        tooltip = `Rede: ${effectiveType} (down ${downlink.toFixed(1)} Mbps) - Lenta`;
      } else {
        quality = "regular";
        status = "degraded";
        tooltip = `Rede: ${effectiveType} - Conex\xE3o inst\xE1vel`;
      }
    } else {
      const jitter = state.connectivity.jitter || 0;
      rtt = state.connectivity.rttMs;
      if (jitter <= 10) {
        quality = "excellent";
        status = "online";
        tooltip = `Rede: Est\xE1vel (jitter ${jitter}ms)`;
      } else if (jitter <= 30) {
        quality = "good";
        status = "online";
        tooltip = `Rede: Boa (jitter ${jitter}ms)`;
      } else if (jitter <= 60) {
        quality = "regular";
        status = "degraded";
        tooltip = `Rede: Regular (jitter ${jitter}ms)`;
      } else {
        quality = "poor";
        status = "degraded";
        tooltip = `Rede: Inst\xE1vel (jitter ${jitter}ms)`;
      }
      effectiveType = null;
      downlink = null;
    }
    this._updateQuality(quality, tooltip, { status, rtt, effectiveType, downlink });
    return { quality, tooltip, status, rtt, effectiveType, downlink };
  }
  _updateQuality(quality, tooltip, extra = {}) {
    this.store.updateConnectivity({ quality, ...extra });
    this._addToHistory({ quality, tooltip, ...extra, timestamp: Date.now() });
    this._emitQualityChange({ quality, tooltip, ...extra });
  }
  _emitQualityChange(data) {
    if (data.quality !== this._lastQuality) {
      if (this._lastQuality) {
        const timeInState = Date.now() - this._qualityStartTime;
        this._log("info", `Quality mudou: ${this._lastQuality} -> ${data.quality} (${Math.round(timeInState / 1e3)}s)`);
      }
      this._lastQuality = data.quality;
      this._qualityStartTime = Date.now();
      this._metrics.qualityChanges++;
      this._metrics.lastChangeAt = Date.now();
      this.emit(SYSTEM_EVENTS.QUALITY_CHANGE, data);
    }
  }
  _addToHistory(entry) {
    this.history.push(entry);
    if (this.history.length > this.config.historySize) this.history.shift();
  }
  getCurrentQuality() {
    return this._lastQuality;
  }
  getLastUpdate() {
    return this._lastUpdate;
  }
  forceUpdate() {
    return this.update();
  }
  getMetrics() {
    const totalTime = this._metrics.timeInExcellent + this._metrics.timeInGood + this._metrics.timeInRegular + this._metrics.timeInPoor + this._metrics.timeInOffline;
    return { ...this._metrics, currentQuality: this._lastQuality, lastUpdate: this._lastUpdate, historySize: this.history.length, totalTime, percentExcellent: totalTime > 0 ? this._metrics.timeInExcellent / totalTime * 100 : 0, percentGood: totalTime > 0 ? this._metrics.timeInGood / totalTime * 100 : 0, percentRegular: totalTime > 0 ? this._metrics.timeInRegular / totalTime * 100 : 0, percentPoor: totalTime > 0 ? this._metrics.timeInPoor / totalTime * 100 : 0, percentOffline: totalTime > 0 ? this._metrics.timeInOffline / totalTime * 100 : 0, isMounted: this._isMounted, isDestroyed: this._isDestroyed };
  }
  healthCheck() {
    const checks = { notDestroyed: !this._isDestroyed, isMounted: this._isMounted, hasStore: !!this.store, hasLastQuality: !!this._lastQuality || this._metrics.totalUpdates === 0 };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter(([, v]) => !v).map(([k]) => k), version: VERSION, moduleId: MODULE_ID, instanceId: this.config.instanceId, portsInitialized: Ports.isInitialized(), currentQuality: this._lastQuality, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  // @ts-expect-error strict migration — TS2322
  getHistory(limit = null) {
    const history = [...this.history];
    return limit ? history.slice(-limit) : history;
  }
  getConnectionInfo() {
    if (!("connection" in navigator)) return null;
    const conn = navigator.connection;
    return { effectiveType: conn.effectiveType, downlink: conn.downlink, rtt: conn.rtt, saveData: conn.saveData, type: conn.type };
  }
  static isConnectionAPISupported() {
    return "connection" in navigator;
  }
  unmount() {
    if (!this._isMounted) {
      this._log("warn", "NetworkQualityMonitor n\xE3o est\xE1 montado");
      return;
    }
    if (this._isDestroyed) {
      this._log("warn", "NetworkQualityMonitor j\xE1 foi destru\xEDdo");
      return;
    }
    if ("connection" in navigator) navigator.connection.removeEventListener("change", this._onChange);
    if (this._updateIntervalId) {
      clearInterval(this._updateIntervalId);
      this._updateIntervalId = null;
    }
    if (this._qualityTrackingInterval) {
      clearInterval(this._qualityTrackingInterval);
      this._qualityTrackingInterval = null;
    }
    this._listeners.clear();
    this._isMounted = false;
    this._log("info", "NetworkQualityMonitor desmontado");
  }
  destroy() {
    if (this._isDestroyed) {
      this._log("warn", "NetworkQualityMonitor j\xE1 destru\xEDdo");
      return;
    }
    if (this._isMounted) this.unmount();
    this.history = [];
    this._isDestroyed = true;
    this._log("info", "NetworkQualityMonitor destru\xEDdo");
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, instanceId: this.config.instanceId, portsInitialized: Ports.isInitialized(), currentQuality: this._lastQuality, metrics: this.getMetrics(), healthCheck: this.healthCheck() };
  }
  setDebug(enabled) {
    this._debug = !!enabled;
  }
  resetMetrics() {
    this._metrics = { totalUpdates: 0, qualityChanges: 0, lastChangeAt: null, timeInExcellent: 0, timeInGood: 0, timeInRegular: 0, timeInPoor: 0, timeInOffline: 0 };
  }
}
function getVersion() {
  return VERSION;
}
function setDebug(enabled) {
}
var network_quality_default = NetworkQualityMonitor;
export {
  MODULE_ID,
  NetworkQualityMonitor,
  VERSION,
  network_quality_default as default,
  getPorts,
  getVersion,
  injectPorts,
  setDebug
};
