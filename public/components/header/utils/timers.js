import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.5.0-ES6";
const MODULE_ID = "header/utils/timers";
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
let _debug = false;
const _debugEnabled = () => {
  const cfg = _getPort("config");
  return _debug || cfg && cfg.app && cfg.app.debug;
};
const _log = function(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    if (logger.error) logger.error(...[prefix].concat(args));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(...[prefix].concat(args));
    return;
  }
  if (level === "info") {
    if (logger.info) logger.info(...[prefix].concat(args));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug(...[prefix].concat(args));
};
function TimersManager(config) {
  config = config || {};
  this.config = { maxTimers: config.maxTimers || 100, maxAbortControllers: config.maxAbortControllers || 50, instanceId: config.instanceId || "timers-default" };
  this.timers = /* @__PURE__ */ new Map();
  this.abortControllers = /* @__PURE__ */ new Map();
  this._debug = false;
  this._metrics = { totalTimersCreated: 0, totalTimersCleared: 0, totalAbortControllersCreated: 0, totalAborted: 0, activeTimers: 0, activeAbortControllers: 0 };
  this.isDestroyed = false;
}
TimersManager.prototype._validateKey = (key) => {
  if (!key || typeof key !== "string") throw new TypeError("Key deve ser uma string n\xE3o-vazia");
  return true;
};
TimersManager.prototype.set = function(key, callback, delay) {
  const self = this;
  if (this.isDestroyed) {
    _log("warn", "TimersManager destru\xEDdo - set ignorado");
    return false;
  }
  this._validateKey(key);
  if (typeof callback !== "function") throw new TypeError("Callback deve ser fun\xE7\xE3o");
  if (typeof delay !== "number" || delay < 0) throw new TypeError("Delay deve ser n\xFAmero positivo");
  this.clear(key);
  if (this.timers.size >= this.config.maxTimers) {
    _log("warn", `Limite de timers atingido (${this.config.maxTimers})`);
    return false;
  }
  const id = setTimeout(() => {
    try {
      callback();
    } catch (error) {
      _log("error", `Erro no callback do timer "${key}":`, error);
    } finally {
      self.timers.delete(key);
      self._metrics.activeTimers = self.timers.size;
    }
  }, delay);
  this.timers.set(key, { id, type: "timeout", createdAt: Date.now(), delay });
  this._metrics.totalTimersCreated++;
  this._metrics.activeTimers = this.timers.size;
  return true;
};
TimersManager.prototype.setInterval = function(key, callback, delay) {
  const self = this;
  if (this.isDestroyed) {
    _log("warn", "TimersManager destru\xEDdo - setInterval ignorado");
    return false;
  }
  this._validateKey(key);
  if (typeof callback !== "function") throw new TypeError("Callback deve ser fun\xE7\xE3o");
  if (typeof delay !== "number" || delay < 0) throw new TypeError("Delay deve ser n\xFAmero positivo");
  this.clear(key);
  if (this.timers.size >= this.config.maxTimers) {
    _log("warn", `Limite de timers atingido (${this.config.maxTimers})`);
    return false;
  }
  const safeCallback = () => {
    try {
      callback();
    } catch (error) {
      _log("error", `Erro no callback do interval "${key}":`, error);
    }
  };
  const id = setInterval(safeCallback, delay);
  this.timers.set(key, { id, type: "interval", createdAt: Date.now(), delay });
  this._metrics.totalTimersCreated++;
  this._metrics.activeTimers = this.timers.size;
  return true;
};
TimersManager.prototype.clear = function(key) {
  if (this.isDestroyed) return false;
  const timer = this.timers.get(key);
  if (!timer) return false;
  if (timer.type === "timeout") clearTimeout(timer.id);
  else if (timer.type === "interval") clearInterval(timer.id);
  this.timers.delete(key);
  this._metrics.totalTimersCleared++;
  this._metrics.activeTimers = this.timers.size;
  return true;
};
TimersManager.prototype.clearAll = function() {
  const self = this;
  const count = this.timers.size;
  this.timers.forEach((timer, key) => {
    self.clear(key);
  });
  _log("info", `${count} timers limpos`);
  return count;
};
TimersManager.prototype.has = function(key) {
  return this.timers.has(key);
};
TimersManager.prototype.getTimer = function(key) {
  const timer = this.timers.get(key);
  if (!timer) return null;
  return { type: timer.type, createdAt: timer.createdAt, delay: timer.delay, age: Date.now() - timer.createdAt };
};
TimersManager.prototype.getAllTimers = function() {
  const result = {};
  this.timers.forEach((timer, key) => {
    result[key] = { type: timer.type, createdAt: timer.createdAt, delay: timer.delay, age: Date.now() - timer.createdAt };
  });
  return result;
};
TimersManager.prototype.setAbortController = function(key, controller) {
  if (this.isDestroyed) {
    _log("warn", "TimersManager destru\xEDdo - setAbortController ignorado");
    return false;
  }
  this._validateKey(key);
  if (!(controller instanceof AbortController)) throw new TypeError("Controller deve ser inst\xE2ncia de AbortController");
  this.abortAbortController(key);
  if (this.abortControllers.size >= this.config.maxAbortControllers) {
    _log("warn", `Limite de AbortControllers atingido (${this.config.maxAbortControllers})`);
    return false;
  }
  this.abortControllers.set(key, { controller, createdAt: Date.now() });
  this._metrics.totalAbortControllersCreated++;
  this._metrics.activeAbortControllers = this.abortControllers.size;
  return true;
};
TimersManager.prototype.abortAbortController = function(key) {
  if (this.isDestroyed) return false;
  const entry = this.abortControllers.get(key);
  if (!entry) return false;
  try {
    entry.controller.abort();
    this._metrics.totalAborted++;
  } catch (error) {
    _log("error", `Erro ao abortar controller "${key}":`, error);
  }
  this.abortControllers.delete(key);
  this._metrics.activeAbortControllers = this.abortControllers.size;
  return true;
};
TimersManager.prototype.abortAll = function() {
  const self = this;
  const count = this.abortControllers.size;
  this.abortControllers.forEach((entry, key) => {
    self.abortAbortController(key);
  });
  _log("info", `${count} AbortControllers abortados`);
  return count;
};
TimersManager.prototype.hasAbortController = function(key) {
  return this.abortControllers.has(key);
};
TimersManager.prototype.getAbortController = function(key) {
  const entry = this.abortControllers.get(key);
  if (!entry) return null;
  return { createdAt: entry.createdAt, age: Date.now() - entry.createdAt, aborted: entry.controller.signal.aborted };
};
TimersManager.prototype.getMetrics = function() {
  return Object.assign({ isDestroyed: this.isDestroyed }, this._metrics);
};
TimersManager.prototype.healthCheck = function() {
  const logger = _getPort("logger");
  const checks = { notDestroyed: !this.isDestroyed, belowTimerLimit: this._metrics.activeTimers < this.config.maxTimers, belowAbortLimit: this._metrics.activeAbortControllers < this.config.maxAbortControllers, loggerAvailable: !!logger };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter((e) => !e[1]).map((e) => e[0]), version: VERSION, moduleId: MODULE_ID, instanceId: this.config.instanceId, portsInitialized: Ports.isInitialized(), activeTimers: this._metrics.activeTimers, activeAbortControllers: this._metrics.activeAbortControllers, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
TimersManager.prototype.destroy = function() {
  if (this.isDestroyed) {
    _log("warn", "TimersManager j\xE1 destru\xEDdo");
    return;
  }
  this.clearAll();
  this.abortAll();
  this.isDestroyed = true;
  _log("info", "TimersManager destru\xEDdo");
};
TimersManager.prototype.info = function() {
  return { version: VERSION, moduleId: MODULE_ID, instanceId: this.config.instanceId, portsInitialized: Ports.isInitialized(), activeTimers: this._metrics.activeTimers, activeAbortControllers: this._metrics.activeAbortControllers, metrics: this._metrics, healthCheck: this.healthCheck() };
};
TimersManager.prototype.setDebug = function(enabled) {
  this._debug = !!enabled;
  _debug = !!enabled;
};
TimersManager.prototype.resetMetrics = function() {
  this._metrics = { totalTimersCreated: 0, totalTimersCleared: 0, totalAbortControllersCreated: 0, totalAborted: 0, activeTimers: this.timers.size, activeAbortControllers: this.abortControllers.size };
};
function getVersion() {
  return VERSION;
}
function setDebug(enabled) {
  _debug = !!enabled;
}
var timers_default = TimersManager;
export {
  MODULE_ID,
  TimersManager,
  VERSION,
  timers_default as default,
  getPorts,
  getVersion,
  injectPorts,
  setDebug
};
