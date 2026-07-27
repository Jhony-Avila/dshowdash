import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { PERFORMANCE_EVENTS } from "/core/runtime/events/catalog/performance.events.js";
const VERSION = "5.6.0-ES6";
const MODULE_ID = "header.core.header-api";
const hasWindow = typeof window !== "undefined";
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
function _debugEnabled() {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug || false;
}
function _log(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error" && logger.error) {
    logger.error.apply(logger, [prefix].concat(args));
    return;
  }
  if (level === "warn" && logger.warn) {
    logger.warn.apply(logger, [prefix].concat(args));
    return;
  }
  if (level === "info" && logger.info) {
    logger.info.apply(logger, [prefix].concat(args));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug.apply(logger, [prefix].concat(args));
}
function HeaderAPI(header) {
  this.header = header;
  this._debug = false;
  this._metrics = { apiCallCount: 0, observerInitCount: 0, authCallCount: 0, lastCallAt: null };
}
HeaderAPI.prototype._getUserMenu = function() {
  return this.header.componentsLoader && this.header.componentsLoader.getComponent ? this.header.componentsLoader.getComponent("user-menu") : null;
};
HeaderAPI.prototype.exposeGlobalAPI = function() {
  const self = this;
  const apiName = this.header.options.globalApiName || "headerAPI";
  window[apiName] = { refresh() {
    self._metrics.apiCallCount++;
    self._metrics.lastCallAt = Date.now();
    return self.header.refresh();
  }, showFallback(type, msg, opts) {
    return self.header.showFallback(type, msg, opts);
  }, hideFallback() {
    return self.header.hideFallback();
  }, getState() {
    return self.header.getState();
  }, getLifecycleState() {
    return self.header.lifecycle ? self.header.lifecycle.getState() : null;
  }, getLifecycleMetrics() {
    return self.header.lifecycle ? self.header.lifecycle.getMetrics() : null;
  }, getCircuitMetrics() {
    return self.header.fetchClient ? self.header.fetchClient.getCircuitMetrics() : null;
  }, resetCircuit() {
    return self.header.fetchClient ? self.header.fetchClient.resetCircuit() : null;
  }, healthCheck() {
    return self.header.healthCheck();
  }, info() {
    return self.header.info();
  }, isReducedMode() {
    return self.header.reducedMode;
  }, isMounted() {
    return self.header.isMounted;
  }, isDestroyed() {
    return self.header.isDestroyed;
  }, version: self.header.version, instanceId: self.header.instanceId, notify(opts) {
    return self.header.notifications ? self.header.notifications.show(opts) : null;
  }, clearNotifications() {
    return self.header.notifications ? self.header.notifications.clear() : null;
  }, updateUser(user) {
    self._metrics.authCallCount++;
    self._metrics.lastCallAt = Date.now();
    const userMenu = self._getUserMenu();
    if (userMenu) {
      userMenu.updateUser ? userMenu.updateUser(user) : userMenu.setUser(user);
      _log("info", "User atualizado via API");
      return true;
    }
    _log("warn", "User-menu n\xE3o dispon\xEDvel");
    return false;
  }, clearUser() {
    self._metrics.authCallCount++;
    self._metrics.lastCallAt = Date.now();
    const userMenu = self._getUserMenu();
    if (userMenu) {
      userMenu.clearUser ? userMenu.clearUser() : userMenu.setUser(null);
      _log("info", "User limpo via API");
      return true;
    }
    return false;
  }, getUser() {
    const userMenu = self._getUserMenu();
    return userMenu ? userMenu.getUser ? userMenu.getUser() : userMenu.store && userMenu.store.getState ? userMenu.store.getState().user : null : null;
  }, getComponent(name) {
    return self.header.componentsLoader && self.header.componentsLoader.getComponent ? self.header.componentsLoader.getComponent(name) : null;
  }, getComponentsStats() {
    return self.header.componentsLoader && self.header.componentsLoader.getStats ? self.header.componentsLoader.getStats() : null;
  }, getEventsInfo() {
    return self.header.events && self.header.events.info ? self.header.events.info() : null;
  }, setDebug(enabled) {
    return self.header.setDebug(enabled);
  } };
  if (_debugEnabled()) window[`__${apiName}Instance`] = self.header;
  _log("info", `API global exposta: window.${apiName}`);
};
HeaderAPI.prototype.initPerformanceObserver = function() {
  const self = this;
  if (!hasWindow || !window.PerformanceObserver || !this.header.telemetry) return;
  try {
    this._metrics.observerInitCount++;
    this.header.performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        if (entry.entryType === "layout-shift" && !entry.hadRecentInput) {
          const cfg = _getPort("config");
          const sampleRate = self.header.config.telemetry && self.header.config.telemetry.sampleRate ? self.header.config.telemetry.sampleRate : 0.1;
          const shouldSample = Math.random() < sampleRate;
          if (shouldSample || cfg && cfg.app && cfg.app.debug) {
            self.header.telemetry.track(PERFORMANCE_EVENTS.CLS, { value: entry.value, instanceId: self.header.instanceId, action: "cls" });
          }
        }
        if (entry.entryType === "first-input") {
          const cfg2 = _getPort("config");
          const sampleRate2 = self.header.config.telemetry && self.header.config.telemetry.sampleRate ? self.header.config.telemetry.sampleRate : 0.1;
          const shouldSample2 = Math.random() < sampleRate2;
          if (shouldSample2 || cfg2 && cfg2.app && cfg2.app.debug) {
            self.header.telemetry.track(PERFORMANCE_EVENTS.FID, { value: entry.processingStart - entry.startTime, instanceId: self.header.instanceId, action: "fid" });
          }
        }
      }
    });
    this.header.performanceObserver.observe({ type: "layout-shift", buffered: true });
    this.header.performanceObserver.observe({ type: "first-input", buffered: true });
    _log("debug", "PerformanceObserver inicializado");
  } catch (error) {
    _log("warn", "Erro ao inicializar PerformanceObserver:", error);
  }
};
HeaderAPI.prototype.healthCheck = function() {
  const apiName = this.header.options.globalApiName || "headerAPI";
  const checks = { headerAvailable: !!this.header, apiExposed: hasWindow && !!window[apiName], performanceObserverSupported: hasWindow && !!window.PerformanceObserver, userMenuAccessible: !!this._getUserMenu(), portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter((e) => !e[1]).map((e) => e[0]), portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
HeaderAPI.prototype.info = function() {
  return { version: VERSION, moduleId: MODULE_ID, apiName: this.header.options.globalApiName || "headerAPI", metrics: this._metrics, portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck() };
};
HeaderAPI.prototype.setDebug = function(enabled) {
  this._debug = !!enabled;
};
HeaderAPI.prototype.resetMetrics = function() {
  this._metrics = { apiCallCount: 0, observerInitCount: 0, authCallCount: 0, lastCallAt: null };
};
HeaderAPI.prototype.destroy = function() {
  if (this.header && this.header.performanceObserver) {
    try {
      this.header.performanceObserver.disconnect();
    } catch (e) {
    }
    this.header.performanceObserver = null;
    _log("info", "PerformanceObserver desconectado");
  }
  const apiName = this.header && this.header.options ? this.header.options.globalApiName || "headerAPI" : "headerAPI";
  if (hasWindow && window[apiName]) {
    delete window[apiName];
  }
  if (hasWindow && window[`__${apiName}Instance`]) {
    delete window[`__${apiName}Instance`];
  }
  this.header = null;
};
function getVersion() {
  return VERSION;
}
var header_api_default = HeaderAPI;
export {
  HeaderAPI,
  MODULE_ID,
  VERSION,
  header_api_default as default,
  getPorts,
  getVersion,
  injectPorts
};
