import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.3.0-P17WI";
const MODULE_ID = "login-modal-breach-detection";
const HIBP_API_URL = "https://api.pwnedpasswords.com/range/";
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
const _debugEnabled = function() {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug ? true : false;
};
const _log = function(level, ...rest) {
  const logger = _getPort("logger");
  if (!logger) return;
  const args = rest;
  const prefix = "[breach-detection]";
  if (level === "error") {
    if (logger.error) logger.error.apply(logger, [prefix].concat(args));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn.apply(logger, [prefix].concat(args));
    return;
  }
  if (level === "info") {
    if (logger.info) logger.info.apply(logger, [prefix].concat(args));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug.apply(logger, [prefix].concat(args));
};
function BreachDetection(config) {
  if (!config) config = {};
  this.config = config;
  this.enabled = config.breachDetection ? config.breachDetection.enabled !== false : true;
  this.blockOnBreach = config.breachDetection ? config.breachDetection.blockOnBreach || false : false;
  this.warnOnBreach = config.breachDetection ? config.breachDetection.warnOnBreach !== false : true;
  this.timeout = config.breachDetection ? config.breachDetection.timeout || 5e3 : 5e3;
  this._cache = /* @__PURE__ */ new Map();
  this._cacheTimers = /* @__PURE__ */ new Map();
  this._metrics = { checks: 0, breaches: 0, errors: 0, cacheHits: 0 };
  _initPorts();
}
BreachDetection.prototype.checkPassword = function(password) {
  const self = this;
  self._metrics.checks++;
  if (!self.enabled || !password) return Promise.resolve({ breached: false, checked: false, reason: "disabled_or_empty" });
  return self._sha1(password).then(function(hash) {
    const prefix = hash.substring(0, 5).toUpperCase();
    const suffix = hash.substring(5).toUpperCase();
    const cacheKey = prefix;
    if (self._cache.has(cacheKey)) {
      self._metrics.cacheHits++;
      const suffixes = self._cache.get(cacheKey);
      let match = null;
      for (let i = 0; i < suffixes.length; i++) {
        if (suffixes[i].hash === suffix) {
          match = suffixes[i];
          break;
        }
      }
      if (match) {
        self._metrics.breaches++;
        _log("warn", "Senha encontrada em vazamento (cache)", { count: match.count });
        return { breached: true, checked: true, count: match.count, source: "hibp_cache" };
      }
      return { breached: false, checked: true, source: "hibp_cache" };
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(function() {
      controller.abort();
    }, self.timeout);
    return fetch(HIBP_API_URL + prefix, { method: "GET", headers: { "Add-Padding": "true" }, signal: controller.signal }).then(function(response) {
      clearTimeout(timeoutId);
      if (!response.ok) {
        _log("warn", "HIBP API retornou erro", { status: response.status });
        return { breached: false, checked: false, reason: "api_error", status: response.status };
      }
      return response.text().then(function(text) {
        const lines = text.split("\n");
        const suffixList = [];
        for (let j = 0; j < lines.length; j++) {
          const parts = lines[j].split(":");
          const h = parts[0] ? parts[0].trim() : null;
          const c = parts[1] ? parseInt(parts[1], 10) : 0;
          if (h) suffixList.push({ hash: h, count: c || 0 });
        }
        self._cache.set(cacheKey, suffixList);
        if (self._cacheTimers.has(cacheKey)) clearTimeout(self._cacheTimers.get(cacheKey));
        self._cacheTimers.set(cacheKey, setTimeout(function() {
          self._cache.delete(cacheKey);
          self._cacheTimers.delete(cacheKey);
        }, 36e5));
        let foundMatch = null;
        for (let k = 0; k < suffixList.length; k++) {
          if (suffixList[k].hash === suffix) {
            foundMatch = suffixList[k];
            break;
          }
        }
        if (foundMatch) {
          self._metrics.breaches++;
          _log("warn", "Senha encontrada em vazamento", { count: foundMatch.count });
          return { breached: true, checked: true, count: foundMatch.count, source: "hibp_api" };
        }
        _log("info", "Senha nao encontrada em vazamentos conhecidos");
        return { breached: false, checked: true, source: "hibp_api" };
      });
    }).catch(function(error) {
      clearTimeout(timeoutId);
      self._metrics.errors++;
      if (error.name === "AbortError") {
        _log("warn", "HIBP API timeout");
        return { breached: false, checked: false, reason: "timeout" };
      }
      _log("error", "Erro ao verificar vazamento", error);
      return { breached: false, checked: false, reason: "error", error: error.message };
    });
  }).catch(function(error) {
    self._metrics.errors++;
    _log("error", "Erro ao calcular hash", error);
    return { breached: false, checked: false, reason: "hash_error", error: error.message };
  });
};
BreachDetection.prototype._sha1 = function(str) {
  const self = this;
  const crypto = typeof window !== "undefined" ? window.crypto : null;
  if (crypto && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    return crypto.subtle.digest("SHA-1", data).then(function(hashBuffer) {
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(function(b) {
        return b.toString(16).padStart(2, "0");
      }).join("");
    });
  }
  return Promise.resolve(self._simpleSha1Fallback(str));
};
BreachDetection.prototype._simpleSha1Fallback = function(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(40, "0");
};
BreachDetection.prototype.getWarningMessage = function(result) {
  if (!result.breached) return null;
  const countText = result.count > 1e6 ? "milhoes de vezes" : result.count > 1e3 ? "milhares de vezes" : result.count + " vezes";
  return "Esta senha foi encontrada em vazamentos de dados (" + countText + "). Recomendamos usar uma senha diferente.";
};
BreachDetection.prototype.shouldBlock = function(result) {
  return this.blockOnBreach && result.breached;
};
BreachDetection.prototype.shouldWarn = function(result) {
  return this.warnOnBreach && result.breached;
};
BreachDetection.prototype.clearCache = function() {
  this._cacheTimers.forEach(function(timerId) {
    clearTimeout(timerId);
  });
  this._cacheTimers.clear();
  this._cache.clear();
  _log("info", "Cache de breach detection limpo");
};
BreachDetection.prototype.info = function() {
  return { moduleId: MODULE_ID, version: VERSION, enabled: this.enabled, blockOnBreach: this.blockOnBreach, warnOnBreach: this.warnOnBreach, portsInitialized: Ports.isInitialized(), loggerAvailable: !!_getPort("logger"), cacheSize: this._cache.size, metrics: Object.assign({}, this._metrics), timestamp: Date.now() };
};
BreachDetection.prototype.healthCheck = function() {
  const crypto = typeof window !== "undefined" ? window.crypto : null;
  const checks = { enabled: this.enabled, hasCrypto: !!(crypto && crypto.subtle), lowErrorRate: this._metrics.checks === 0 || this._metrics.errors / this._metrics.checks < 0.3, loggerAvailable: !!_getPort("logger"), portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed >= 4 ? "HEALTHY" : "DEGRADED", score: passed + "/5", checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
};
var breach_detection_default = BreachDetection;
export {
  BreachDetection,
  MODULE_ID,
  VERSION,
  breach_detection_default as default,
  getPorts,
  injectPorts
};
