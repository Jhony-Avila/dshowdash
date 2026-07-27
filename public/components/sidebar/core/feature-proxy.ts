// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar:feature-proxy
// PURPOSE: FEATURE PROXY - SIDEBAR ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   FeatureProxy — exported value
//   getFeatureProxy() — exported function
//   clearProxyCache() — exported function
//   getUsageMetrics() — exported function
//   getCachedFeatures() — exported function
//   preloadFeatures() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   injectPorts() — exported function
//   getPortsSnapshot() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS: (none)
// @changelog v1.3.0-STRICT-MODE - Migração NR-FULL strict mode com recordViolation
// @changelog v1.2.0-PORTSFACTORY - Migração para PortsFactory
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const MODULE_ID = 'sidebar:feature-proxy';
export const VERSION = '1.4.0-P2-ENTERPRISE';

const _Ports = createUiPorts({ moduleId: MODULE_ID });
const _getPort = (name: string) => _Ports.get(name);
const injectPorts = (p: DynObj) => _Ports.inject(p);
const getPortsSnapshot = () => _Ports.snapshot();

// ═══════════════════════════════════════════════════════════════
// STRICT MODE RESOLUTION: Logger
// ═══════════════════════════════════════════════════════════════
function _getLogger() {
  // 1. Try Ports first
  const portLogger = _getPort('logger');
  if (portLogger) return portLogger;

  // 2. Try Core.windowAdapter
  if (typeof window !== 'undefined' && (window as any).Core?.windowAdapter?.get) {
    const waLogger = (window as any).Core.windowAdapter.get('Logger');
    if (waLogger) return waLogger;
  }

  // 3. In strict mode, return null (no fallback)
  // 4. Non-strict: use window.Logger with violation recording

  return null;
}

const _log = (level: string, ...args: DynObj[]) => {
  const prefix = `[${MODULE_ID}]`;
  const logger = _getLogger();
  if (logger?.[level]) { logger[level](prefix, ...args); }
  else if (!isStrict() && (level === 'error' || level === 'warn')) {
    console.debug(prefix, ...args);
  }
};

const _proxyCache = new Map();
const _moduleCache = new Map();
const _usageMetrics = { calls: new Map(), errors: new Map(), loadTimes: new Map() };

class FeatureProxy {
  [key: string]: any;
  constructor(featureName: string, contract: DynObj, resolver: DynObj) {
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
      methods.forEach(methodName => { if (typeof methodName === 'string' && !this[methodName]) { this[methodName] = (...args: DynObj[]) => this._invoke(methodName, args); } });
    } else if (typeof methods === 'object') {
      Object.keys(methods).forEach(methodName => { if (!this[methodName]) { this[methodName] = (...args: DynObj[]) => this._invoke(methodName, args); } });
    }
  }

  async _invoke(methodName: string, args: DynObj[] = []) {
    const startTime = performance.now();
    const callKey = `${this._featureName}.${methodName}`;
    try {
      _usageMetrics.calls.set(callKey, (_usageMetrics.calls.get(callKey) || 0) + 1);
      if (!this._loaded) await this._load();
      const originalMethod = this._resolveMethodName(methodName);
      if (!this._module || typeof this._module[originalMethod] !== 'function') {
        const fallbackResult = this._tryFallback(methodName, args);
        if (fallbackResult !== undefined) return fallbackResult;
        _log('warn', `Método não encontrado: ${callKey}`);
        return undefined;
      }
      const result = await Promise.resolve(this._module[originalMethod](...args));
      _usageMetrics.loadTimes.set(callKey, performance.now() - startTime);
      return result;
    } catch (error: any) {
      _usageMetrics.errors.set(callKey, (_usageMetrics.errors.get(callKey) || 0) + 1);
      _log('error', `Erro ao invocar ${callKey}:`, error.message);
      return undefined;
    }
  }

  async _load() {
    if (this._loading) return this._loading;
    if (this._loaded && this._module) return this._module;
    this._loading = (async () => {
      try {
        const startTime = performance.now();
        if (_moduleCache.has(this._featureName)) { this._module = _moduleCache.get(this._featureName); this._loaded = true; return this._module; }
        if (this._resolver && typeof this._resolver === 'function') {
          this._module = await Promise.resolve(this._resolver(this._featureName, this._contract));
          if (this._module) {
            _moduleCache.set(this._featureName, this._module);
            this._loaded = true;
            _usageMetrics.loadTimes.set(`${this._featureName}:load`, performance.now() - startTime);
          }
        }
        return this._module;
      } catch (error: any) {
        _log('error', `Erro ao carregar feature ${this._featureName}:`, error.message);
        this._module = null;
        this._loaded = false;
        return null;
      } finally { this._loading = null; }
    })();
    return this._loading;
  }

  _resolveMethodName(methodName: string) {
    if (!this._contract || !this._contract.methods) return methodName;
    const methods = this._contract.methods;
    if (typeof methods === 'object' && !Array.isArray(methods)) {
      const methodConfig = methods[methodName];
      if (methodConfig && methodConfig.original) return methodConfig.original;
    }
    return methodName;
  }

  _tryFallback(methodName: string, args: DynObj) {
    // In strict mode, do not use window fallback
    if (isStrict()) return undefined;

    try {
      if (typeof window !== 'undefined' && (window as any).SidebarKernel) {
        recordViolation('WINDOW_SIDEBARKERNEL_FALLBACK', { module: MODULE_ID, method: methodName });
        const kernel = (window as any).SidebarKernel;
        if (typeof kernel._invokeFeature === 'function') return kernel._invokeFeature(this._featureName, methodName, ...args);
      }
    } catch (e: any) {}
    return undefined;
  }

  isLoaded() { return this._loaded; }
  getContract() { return this._contract; }
  getName() { return this._featureName; }
  getMethods() {
    if (!this._contract || !this._contract.methods) return [];
    const methods = this._contract.methods;
    if (Array.isArray(methods)) return [...methods];
    if (typeof methods === 'object') return Object.keys(methods);
    return [];
  }
  info() {
    return { feature: this._featureName, loaded: this._loaded, methods: this.getMethods(), contract: this._contract ? { module: this._contract.module, version: this._contract.version, category: this._contract.category } : null };
  }
}

function getFeatureProxy(featureName: string, contracts: DynObj, resolver: DynObj) {
  if (!featureName || typeof featureName !== 'string') { _log('warn', 'Nome de feature inválido:', featureName); return null; }
  const cacheKey = featureName.toLowerCase();
  if (_proxyCache.has(cacheKey)) return _proxyCache.get(cacheKey);
  const contract = contracts ? contracts[cacheKey] || contracts[featureName] : null;
  if (!contract) {
    _log('warn', `Contrato não encontrado para feature: ${featureName}`);
    const emptyProxy = new FeatureProxy(featureName, { methods: [] }, resolver);
    _proxyCache.set(cacheKey, emptyProxy);
    return emptyProxy;
  }
  const proxy = new FeatureProxy(featureName, contract, resolver);
  _proxyCache.set(cacheKey, proxy);
  return proxy;
}

function clearProxyCache() { _proxyCache.clear(); _moduleCache.clear(); }

function getUsageMetrics() {
  return { calls: Object.fromEntries(_usageMetrics.calls), errors: Object.fromEntries(_usageMetrics.errors), loadTimes: Object.fromEntries(_usageMetrics.loadTimes), cachedProxies: _proxyCache.size, cachedModules: _moduleCache.size };
}

function getCachedFeatures() { return Array.from(_proxyCache.keys()); }

async function preloadFeatures(featureNames: DynObj, contracts: DynObj, resolver: DynObj) {
  if (!Array.isArray(featureNames)) return;
  const promises = featureNames.map(async (name) => {
    try { const proxy = getFeatureProxy(name, contracts, resolver); if (proxy) await proxy._load(); }
    catch (e: any) { _log('warn', `Falha no preload de ${name}:`, e.message); }
  });
  await Promise.allSettled(promises);
}

function healthCheck() {
  const metrics = getUsageMetrics();
  const totalErrors = Array.from(_usageMetrics.errors.values()).reduce((a, b) => a + b, 0);
  const totalCalls = Array.from(_usageMetrics.calls.values()).reduce((a, b) => a + b, 0);
  const errorRate = totalCalls > 0 ? (totalErrors / totalCalls) * 100 : 0;
  return {
    status: errorRate < 5 ? 'HEALTHY' : errorRate < 20 ? 'DEGRADED' : 'UNHEALTHY',
    module: MODULE_ID, version: VERSION,
    portsInitialized: _Ports.isInitialized(),
    strictMode: isStrict(),
    metrics: { cachedProxies: _proxyCache.size, cachedModules: _moduleCache.size, totalCalls, totalErrors, errorRate: `${errorRate.toFixed(2)}%` }
  };
}

function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: _Ports.isInitialized(), strictMode: isStrict(), cachedProxies: getCachedFeatures(), metrics: getUsageMetrics() }; }

export { FeatureProxy, getFeatureProxy, clearProxyCache, getUsageMetrics, getCachedFeatures, preloadFeatures, healthCheck, info, injectPorts, getPortsSnapshot };
export default { FeatureProxy, getFeatureProxy, clearProxyCache, getUsageMetrics, getCachedFeatures, preloadFeatures, healthCheck, info, injectPorts, getPorts: getPortsSnapshot };
