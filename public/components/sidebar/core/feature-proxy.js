import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
const MODULE_ID = "sidebar:feature-proxy";
const VERSION = "1.4.0-P2-ENTERPRISE";
const _Ports = createUiPorts({ moduleId: MODULE_ID });
const _getPort = (name) => _Ports.get(name);
const injectPorts = (p) => _Ports.inject(p);
const getPortsSnapshot = () => _Ports.snapshot();
function _getLogger() {
  const portLogger = _getPort("logger");
  if (portLogger) return portLogger;
  if (typeof window !== "undefined" && window.Core?.windowAdapter?.get) {
    const waLogger = window.Core.windowAdapter.get("Logger");
    if (waLogger) return waLogger;
  }
  return null;
}
const _log = (level, ...args) => {
  const prefix = `[${MODULE_ID}]`;
  const logger = _getLogger();
  if (logger?.[level]) {
    logger[level](prefix, ...args);
  } else if (!isStrict() && (level === "error" || level === "warn")) {
    console.debug(prefix, ...args);
  }
};
const _proxyCache = /* @__PURE__ */ new Map();
const _moduleCache = /* @__PURE__ */ new Map();
const _usageMetrics = { calls: /* @__PURE__ */ new Map(), errors: /* @__PURE__ */ new Map(), loadTimes: /* @__PURE__ */ new Map() };
class FeatureProxy {
  constructor(featureName, contract, resolver) {
    this._featureName = featureName;
    this._contract = contract;
    this._resolver = resolver;
    this._module = null;
    this._loaded = false;
    this._loading = null;
    this._createMethods();
  }
  _createMethods() {
    if (!this._contract || !this._contract.methods) return;
    const methods = this._contract.methods;
    if (Array.isArray(methods)) {
      methods.forEach((methodName) => {
        if (typeof methodName === "string" && !this[methodName]) {
          this[methodName] = (...args) => this._invoke(methodName, args);
        }
      });
    } else if (typeof methods === "object") {
      Object.keys(methods).forEach((methodName) => {
        if (!this[methodName]) {
          this[methodName] = (...args) => this._invoke(methodName, args);
        }
      });
    }
  }
  async _invoke(methodName, args = []) {
    const startTime = performance.now();
    const callKey = `${this._featureName}.${methodName}`;
    try {
      _usageMetrics.calls.set(callKey, (_usageMetrics.calls.get(callKey) || 0) + 1);
      if (!this._loaded) await this._load();
      const originalMethod = this._resolveMethodName(methodName);
      if (!this._module || typeof this._module[originalMethod] !== "function") {
        const fallbackResult = this._tryFallback(methodName, args);
        if (fallbackResult !== void 0) return fallbackResult;
        _log("warn", `M\xE9todo n\xE3o encontrado: ${callKey}`);
        return void 0;
      }
      const result = await Promise.resolve(this._module[originalMethod](...args));
      _usageMetrics.loadTimes.set(callKey, performance.now() - startTime);
      return result;
    } catch (error) {
      _usageMetrics.errors.set(callKey, (_usageMetrics.errors.get(callKey) || 0) + 1);
      _log("error", `Erro ao invocar ${callKey}:`, error.message);
      return void 0;
    }
  }
  async _load() {
    if (this._loading) return this._loading;
    if (this._loaded && this._module) return this._module;
    this._loading = (async () => {
      try {
        const startTime = performance.now();
        if (_moduleCache.has(this._featureName)) {
          this._module = _moduleCache.get(this._featureName);
          this._loaded = true;
          return this._module;
        }
        if (this._resolver && typeof this._resolver === "function") {
          this._module = await Promise.resolve(this._resolver(this._featureName, this._contract));
          if (this._module) {
            _moduleCache.set(this._featureName, this._module);
            this._loaded = true;
            _usageMetrics.loadTimes.set(`${this._featureName}:load`, performance.now() - startTime);
          }
        }
        return this._module;
      } catch (error) {
        _log("error", `Erro ao carregar feature ${this._featureName}:`, error.message);
        this._module = null;
        this._loaded = false;
        return null;
      } finally {
        this._loading = null;
      }
    })();
    return this._loading;
  }
  _resolveMethodName(methodName) {
    if (!this._contract || !this._contract.methods) return methodName;
    const methods = this._contract.methods;
    if (typeof methods === "object" && !Array.isArray(methods)) {
      const methodConfig = methods[methodName];
      if (methodConfig && methodConfig.original) return methodConfig.original;
    }
    return methodName;
  }
  _tryFallback(methodName, args) {
    if (isStrict()) return void 0;
    try {
      if (typeof window !== "undefined" && window.SidebarKernel) {
        recordViolation("WINDOW_SIDEBARKERNEL_FALLBACK", { module: MODULE_ID, method: methodName });
        const kernel = window.SidebarKernel;
        if (typeof kernel._invokeFeature === "function") return kernel._invokeFeature(this._featureName, methodName, ...args);
      }
    } catch (e) {
    }
    return void 0;
  }
  isLoaded() {
    return this._loaded;
  }
  getContract() {
    return this._contract;
  }
  getName() {
    return this._featureName;
  }
  getMethods() {
    if (!this._contract || !this._contract.methods) return [];
    const methods = this._contract.methods;
    if (Array.isArray(methods)) return [...methods];
    if (typeof methods === "object") return Object.keys(methods);
    return [];
  }
  info() {
    return { feature: this._featureName, loaded: this._loaded, methods: this.getMethods(), contract: this._contract ? { module: this._contract.module, version: this._contract.version, category: this._contract.category } : null };
  }
}
function getFeatureProxy(featureName, contracts, resolver) {
  if (!featureName || typeof featureName !== "string") {
    _log("warn", "Nome de feature inv\xE1lido:", featureName);
    return null;
  }
  const cacheKey = featureName.toLowerCase();
  if (_proxyCache.has(cacheKey)) return _proxyCache.get(cacheKey);
  const contract = contracts ? contracts[cacheKey] || contracts[featureName] : null;
  if (!contract) {
    _log("warn", `Contrato n\xE3o encontrado para feature: ${featureName}`);
    const emptyProxy = new FeatureProxy(featureName, { methods: [] }, resolver);
    _proxyCache.set(cacheKey, emptyProxy);
    return emptyProxy;
  }
  const proxy = new FeatureProxy(featureName, contract, resolver);
  _proxyCache.set(cacheKey, proxy);
  return proxy;
}
function clearProxyCache() {
  _proxyCache.clear();
  _moduleCache.clear();
}
function getUsageMetrics() {
  return { calls: Object.fromEntries(_usageMetrics.calls), errors: Object.fromEntries(_usageMetrics.errors), loadTimes: Object.fromEntries(_usageMetrics.loadTimes), cachedProxies: _proxyCache.size, cachedModules: _moduleCache.size };
}
function getCachedFeatures() {
  return Array.from(_proxyCache.keys());
}
async function preloadFeatures(featureNames, contracts, resolver) {
  if (!Array.isArray(featureNames)) return;
  const promises = featureNames.map(async (name) => {
    try {
      const proxy = getFeatureProxy(name, contracts, resolver);
      if (proxy) await proxy._load();
    } catch (e) {
      _log("warn", `Falha no preload de ${name}:`, e.message);
    }
  });
  await Promise.allSettled(promises);
}
function healthCheck() {
  const metrics = getUsageMetrics();
  const totalErrors = Array.from(_usageMetrics.errors.values()).reduce((a, b) => a + b, 0);
  const totalCalls = Array.from(_usageMetrics.calls.values()).reduce((a, b) => a + b, 0);
  const errorRate = totalCalls > 0 ? totalErrors / totalCalls * 100 : 0;
  return {
    status: errorRate < 5 ? "HEALTHY" : errorRate < 20 ? "DEGRADED" : "UNHEALTHY",
    module: MODULE_ID,
    version: VERSION,
    portsInitialized: _Ports.isInitialized(),
    strictMode: isStrict(),
    metrics: { cachedProxies: _proxyCache.size, cachedModules: _moduleCache.size, totalCalls, totalErrors, errorRate: `${errorRate.toFixed(2)}%` }
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: _Ports.isInitialized(), strictMode: isStrict(), cachedProxies: getCachedFeatures(), metrics: getUsageMetrics() };
}
var feature_proxy_default = { FeatureProxy, getFeatureProxy, clearProxyCache, getUsageMetrics, getCachedFeatures, preloadFeatures, healthCheck, info, injectPorts, getPorts: getPortsSnapshot };
export {
  FeatureProxy,
  MODULE_ID,
  VERSION,
  clearProxyCache,
  feature_proxy_default as default,
  getCachedFeatures,
  getFeatureProxy,
  getPortsSnapshot,
  getUsageMetrics,
  healthCheck,
  info,
  injectPorts,
  preloadFeatures
};
