import { createLogger } from "../utils/logger.js";
import { createErrorHandler } from "../utils/error-handler.js";
import { withTimeout, retryWithBackoff, DEFAULT_TIMEOUTS } from "../utils/async-helpers/index.js";
const VERSION = "1.1.0-MODULAR";
const MODULE_ID = "container-main:fallback-system";
const FALLBACK_LEVELS = Object.freeze({
  PRIMARY: 0,
  SECONDARY: 1,
  TERTIARY: 2,
  DEGRADED: 3,
  MINIMAL: 4,
  OFFLINE: 5
});
const FALLBACK_STRATEGIES = Object.freeze({
  RETRY: "retry",
  ALTERNATE: "alternate",
  CACHE: "cache",
  DEFAULT: "default",
  DEGRADED: "degraded",
  OFFLINE: "offline"
});
function createFallbackSystem(options = {}) {
  const {
    eventBus = null,
    maxRetries = 3,
    retryDelay = 1e3,
    cacheEnabled = true,
    onFallback = null,
    onRecovery = null,
    onExhausted = null
  } = options;
  const _logger = createLogger(MODULE_ID);
  const _errorHandler = createErrorHandler(MODULE_ID);
  let _eventBus = eventBus;
  const _chains = /* @__PURE__ */ new Map();
  const _cache = /* @__PURE__ */ new Map();
  const _cacheExpiry = /* @__PURE__ */ new Map();
  const _states = /* @__PURE__ */ new Map();
  let _metrics = {
    totalCalls: 0,
    primarySuccess: 0,
    fallbacksUsed: 0,
    cacheHits: 0,
    exhausted: 0,
    recovered: 0
  };
  function _emit(event, data) {
    if (_eventBus?.emit) {
      _eventBus.emit(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
    }
  }
  function _getFromCache(key) {
    if (!cacheEnabled || !_cache.has(key)) return null;
    const expiry = _cacheExpiry.get(key);
    if (expiry && Date.now() > expiry) {
      _cache.delete(key);
      _cacheExpiry.delete(key);
      return null;
    }
    _metrics.cacheHits++;
    return _cache.get(key);
  }
  function _setCache(key, value, ttl = 6e4) {
    if (!cacheEnabled) return;
    _cache.set(key, value);
    _cacheExpiry.set(key, Date.now() + ttl);
  }
  async function _executeWithChain(operationId, chain, context = {}) {
    const { args = [], timeout = DEFAULT_TIMEOUTS.MEDIUM, cacheKey = null, cacheTTL = 6e4 } = context;
    _metrics.totalCalls++;
    if (cacheKey) {
      const cached = _getFromCache(cacheKey);
      if (cached !== null) {
        _logger.debug(`Cache hit for ${operationId}`);
        return { success: true, result: cached, level: FALLBACK_LEVELS.PRIMARY, fromCache: true };
      }
    }
    for (let level = 0; level < chain.length; level++) {
      const handler = chain[level];
      const isRetryable = handler.strategy === FALLBACK_STRATEGIES.RETRY;
      try {
        let result;
        if (isRetryable && level === 0) {
          result = await retryWithBackoff(
            async () => withTimeout(handler.fn(...args), timeout),
            { maxRetries, baseDelay: retryDelay, timeoutPerAttempt: timeout }
          );
        } else {
          result = await withTimeout(handler.fn(...args), timeout);
        }
        if (level === 0) {
          _metrics.primarySuccess++;
        } else {
          _metrics.fallbacksUsed++;
          onFallback?.({ operationId, level, strategy: handler.strategy });
          _emit("fallback:used", { operationId, level, strategy: handler.strategy });
        }
        _states.set(operationId, { level, lastSuccess: Date.now(), healthy: true });
        if (cacheKey && handler.cacheable !== false) {
          _setCache(cacheKey, result, cacheTTL);
        }
        if (level === 0 && _states.get(operationId)?.level > 0) {
          _metrics.recovered++;
          onRecovery?.({ operationId });
          _emit("fallback:recovered", { operationId });
        }
        return { success: true, result, level, strategy: handler.strategy };
      } catch (error) {
        _logger.warn(`Level ${level} failed for ${operationId}: ${error.message}`);
        if (level === chain.length - 1) {
          _metrics.exhausted++;
          _states.set(operationId, { level: FALLBACK_LEVELS.OFFLINE, lastError: error, healthy: false });
          onExhausted?.({ operationId, error });
          _emit("fallback:exhausted", { operationId, error: error.message });
          return { success: false, error, level: FALLBACK_LEVELS.OFFLINE, exhausted: true };
        }
      }
    }
    return { success: false, exhausted: true };
  }
  const system = {
    injectEventBus(bus) {
      _eventBus = bus;
    },
    register(operationId, chain) {
      if (!Array.isArray(chain) || chain.length === 0) {
        throw new Error("Chain must be non-empty array");
      }
      const normalizedChain = chain.map((item, index) => {
        if (typeof item === "function") {
          return { fn: item, strategy: index === 0 ? FALLBACK_STRATEGIES.RETRY : FALLBACK_STRATEGIES.ALTERNATE };
        }
        return {
          fn: item.fn || item.handler,
          strategy: item.strategy || FALLBACK_STRATEGIES.ALTERNATE,
          cacheable: item.cacheable !== false
        };
      });
      _chains.set(operationId, normalizedChain);
      _states.set(operationId, { level: FALLBACK_LEVELS.PRIMARY, healthy: true });
      _logger.debug(`Registered fallback chain: ${operationId} (${normalizedChain.length} levels)`);
      return this;
    },
    unregister(operationId) {
      _chains.delete(operationId);
      _states.delete(operationId);
      return this;
    },
    async execute(operationId, context = {}) {
      const chain = _chains.get(operationId);
      if (!chain) {
        throw new Error(`No fallback chain registered for: ${operationId}`);
      }
      return _executeWithChain(operationId, chain, context);
    },
    async executeAdhoc(chain, context = {}) {
      const operationId = `adhoc-${Date.now()}`;
      this.register(operationId, chain);
      try {
        return await this.execute(operationId, context);
      } finally {
        this.unregister(operationId);
      }
    },
    withFallback(primaryFn, fallbackFn, options2 = {}) {
      const { defaultValue = null, timeout = DEFAULT_TIMEOUTS.MEDIUM } = options2;
      return async (...args) => {
        const chain = [
          { fn: () => primaryFn(...args), strategy: FALLBACK_STRATEGIES.RETRY },
          { fn: () => fallbackFn(...args), strategy: FALLBACK_STRATEGIES.ALTERNATE },
          { fn: () => defaultValue, strategy: FALLBACK_STRATEGIES.DEFAULT }
        ];
        const result = await this.executeAdhoc(chain, { args, timeout });
        return result.success ? result.result : defaultValue;
      };
    },
    withCacheFallback(primaryFn, cacheKey, options2 = {}) {
      const { cacheTTL = 6e4, defaultValue = null, timeout = DEFAULT_TIMEOUTS.MEDIUM } = options2;
      return async (...args) => {
        const cached = _getFromCache(cacheKey);
        if (cached !== null) return cached;
        try {
          const result = await withTimeout(primaryFn(...args), timeout);
          _setCache(cacheKey, result, cacheTTL);
          return result;
        } catch (error) {
          _logger.warn(`Primary failed, no cache: ${error.message}`);
          return defaultValue;
        }
      };
    },
    getState(operationId) {
      return _states.get(operationId) || null;
    },
    isHealthy(operationId) {
      const state = _states.get(operationId);
      return state?.healthy !== false;
    },
    listOperations() {
      return Array.from(_chains.keys());
    },
    // @ts-expect-error strict migration — TS2322
    clearCache(key = null) {
      if (key) {
        _cache.delete(key);
        _cacheExpiry.delete(key);
      } else {
        _cache.clear();
        _cacheExpiry.clear();
      }
    },
    resetState(operationId) {
      _states.set(operationId, { level: FALLBACK_LEVELS.PRIMARY, healthy: true });
    },
    getMetrics() {
      return {
        ..._metrics,
        registeredOperations: _chains.size,
        cacheSize: _cache.size,
        successRate: _metrics.totalCalls > 0 ? `${((_metrics.primarySuccess + _metrics.fallbacksUsed) / _metrics.totalCalls * 100).toFixed(2)}%` : "0%"
      };
    },
    resetMetrics() {
      _metrics = { totalCalls: 0, primarySuccess: 0, fallbacksUsed: 0, cacheHits: 0, exhausted: 0, recovered: 0 };
    },
    healthCheck() {
      const unhealthy = Array.from(_states.entries()).filter(([_, s]) => !s.healthy);
      let status = "HEALTHY";
      if (unhealthy.length > 0) status = "DEGRADED";
      if (unhealthy.length > _chains.size / 2) status = "UNHEALTHY";
      return {
        status,
        version: VERSION,
        moduleId: MODULE_ID,
        registeredOperations: _chains.size,
        unhealthyOperations: unhealthy.map(([id]) => id),
        metrics: this.getMetrics()
      };
    },
    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        levels: Object.keys(FALLBACK_LEVELS),
        strategies: Object.keys(FALLBACK_STRATEGIES),
        registeredOperations: _chains.size,
        cacheEnabled,
        maxRetries
      };
    },
    destroy() {
      _chains.clear();
      _states.clear();
      _cache.clear();
      _cacheExpiry.clear();
    }
  };
  return system;
}
let _instance = null;
function getFallbackSystem(options = {}) {
  if (!_instance) {
    _instance = createFallbackSystem(options);
  }
  return _instance;
}
function resetFallbackSystem() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, levels: Object.keys(FALLBACK_LEVELS), strategies: Object.keys(FALLBACK_STRATEGIES) };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var fallback_system_default = {
  VERSION,
  MODULE_ID,
  FALLBACK_LEVELS,
  FALLBACK_STRATEGIES,
  createFallbackSystem,
  getFallbackSystem,
  resetFallbackSystem,
  info,
  healthCheck
};
export {
  FALLBACK_LEVELS,
  FALLBACK_STRATEGIES,
  MODULE_ID,
  VERSION,
  createFallbackSystem,
  fallback_system_default as default,
  getFallbackSystem,
  healthCheck,
  info,
  resetFallbackSystem
};
