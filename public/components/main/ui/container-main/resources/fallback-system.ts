
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:fallback-system
// PURPOSE: Fallback System - Sistema de fallback em cascata
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ../utils/logger.js
//   createErrorHandler from ../utils/error-handler.js
//   withTimeout, retryWithBackoff, DEFAULT_TIMEOUTS from ../utils/async-helpers/i...
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   FALLBACK_LEVELS — exported value
//   FALLBACK_STRATEGIES — exported value
//   createFallbackSystem() — exported function
//   getFallbackSystem() — exported function
//   resetFallbackSystem() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   event
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from '../utils/logger.js';
import { createErrorHandler } from '../utils/error-handler.js';
import { withTimeout, retryWithBackoff, DEFAULT_TIMEOUTS } from '../utils/async-helpers/index.js';

export const VERSION = '1.1.0-MODULAR';
export const MODULE_ID = 'container-main:fallback-system';

// Níveis de fallback
export const FALLBACK_LEVELS = Object.freeze({
  PRIMARY: 0,
  SECONDARY: 1,
  TERTIARY: 2,
  DEGRADED: 3,
  MINIMAL: 4,
  OFFLINE: 5
});

// Estratégias de fallback
export const FALLBACK_STRATEGIES = Object.freeze({
  RETRY: 'retry',
  ALTERNATE: 'alternate',
  CACHE: 'cache',
  DEFAULT: 'default',
  DEGRADED: 'degraded',
  OFFLINE: 'offline'
});

// Cria sistema de fallback
export function createFallbackSystem(options: Record<string, any> = {}) {
  const {
    eventBus = null,
    maxRetries = 3,
    retryDelay = 1000,
    cacheEnabled = true,
    onFallback = null,
    onRecovery = null,
    onExhausted = null
  } = options;

  const _logger = createLogger(MODULE_ID);
  const _errorHandler = createErrorHandler(MODULE_ID);
  let _eventBus = eventBus;
  
  const _chains = new Map();
  const _cache = new Map();
  const _cacheExpiry = new Map();
  const _states = new Map();
  
  let _metrics = {
    totalCalls: 0,
    primarySuccess: 0,
    fallbacksUsed: 0,
    cacheHits: 0,
    exhausted: 0,
    recovered: 0
  };

  function _emit(event: string, data: Record<string, unknown>) {
    if (_eventBus?.emit) {
      _eventBus.emit(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
    }
  }

  function _getFromCache(key: string) {
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

  function _setCache(key: string, value: unknown, ttl = 60000) {
    if (!cacheEnabled) return;
    _cache.set(key, value);
    _cacheExpiry.set(key, Date.now() + ttl);
  }

  async function _executeWithChain(operationId: string, chain: Array<Record<string, unknown>>, context: Record<string, any> = {}) {
    const { args = [], timeout = DEFAULT_TIMEOUTS.MEDIUM, cacheKey = null, cacheTTL = 60000 } = context;
    
    _metrics.totalCalls++;
    
    if (cacheKey) {
      const cached = _getFromCache(cacheKey);
      if (cached !== null) {
        _logger.debug(`Cache hit for ${operationId}`);
        return { success: true, result: cached, level: FALLBACK_LEVELS.PRIMARY, fromCache: true };
      }
    }

    for (let level = 0; level < chain.length; level++) {
      const handler = chain[level] as Record<string, unknown>;
      const isRetryable = handler.strategy === FALLBACK_STRATEGIES.RETRY;
      
      try {
        let result;
        
        if (isRetryable && level === 0) {
          result = await retryWithBackoff(
            async () => withTimeout((handler.fn as (...a: unknown[]) => unknown)(...args), timeout),
            { maxRetries, baseDelay: retryDelay, timeoutPerAttempt: timeout }
          );
        } else {
          result = await withTimeout((handler.fn as (...a: unknown[]) => unknown)(...args), timeout);
        }

        if (level === 0) {
          _metrics.primarySuccess++;
        } else {
          _metrics.fallbacksUsed++;
          onFallback?.({ operationId, level, strategy: handler.strategy });
          _emit('fallback:used', { operationId, level, strategy: handler.strategy });
        }

        _states.set(operationId, { level, lastSuccess: Date.now(), healthy: true });

        if (cacheKey && handler.cacheable !== false) {
          _setCache(cacheKey, result, cacheTTL);
        }

        if (level === 0 && _states.get(operationId)?.level > 0) {
          _metrics.recovered++;
          onRecovery?.({ operationId });
          _emit('fallback:recovered', { operationId });
        }

        return { success: true, result, level, strategy: handler.strategy };

      } catch (error: any) {
        _logger.warn(`Level ${level} failed for ${operationId}: ${error.message}`);
        
        if (level === chain.length - 1) {
          _metrics.exhausted++;
          _states.set(operationId, { level: FALLBACK_LEVELS.OFFLINE, lastError: error, healthy: false });
          
          onExhausted?.({ operationId, error });
          _emit('fallback:exhausted', { operationId, error: error.message });
          
          return { success: false, error, level: FALLBACK_LEVELS.OFFLINE, exhausted: true };
        }
      }
    }

    return { success: false, exhausted: true };
  }

  const system = {
    injectEventBus(bus: unknown) {
      _eventBus = bus;
    },

    register(operationId: unknown, chain: unknown) {
      if (!Array.isArray(chain) || chain.length === 0) {
        throw new Error('Chain must be non-empty array');
      }
      
      const normalizedChain = chain.map((item, index) => {
        if (typeof item === 'function') {
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

    unregister(operationId: unknown) {
      _chains.delete(operationId);
      _states.delete(operationId);
      return this;
    },

    async execute(operationId: string, context = {}) {
      const chain = _chains.get(operationId);

      if (!chain) {
        throw new Error(`No fallback chain registered for: ${operationId}`);
      }

      return _executeWithChain(operationId, chain, context);
    },

    async executeAdhoc(chain: unknown, context = {}) {
      const operationId = `adhoc-${Date.now()}`;
      this.register(operationId, chain);
      
      try {
        return await this.execute(operationId, context);
      } finally {
        this.unregister(operationId);
      }
    },

    withFallback(primaryFn: (...args: unknown[]) => unknown, fallbackFn: (...args: unknown[]) => unknown, options: Record<string, any> = {}) {
      const { defaultValue = null, timeout = DEFAULT_TIMEOUTS.MEDIUM } = options;
      
      return async (...args: unknown[]) => {
        const chain = [
          { fn: () => primaryFn(...args), strategy: FALLBACK_STRATEGIES.RETRY },
          { fn: () => fallbackFn(...args), strategy: FALLBACK_STRATEGIES.ALTERNATE },
          { fn: () => defaultValue, strategy: FALLBACK_STRATEGIES.DEFAULT }
        ];
        
        const result = await this.executeAdhoc(chain, { args, timeout });
        return result.success ? result.result : defaultValue;
      };
    },

    withCacheFallback(primaryFn: (...args: unknown[]) => unknown, cacheKey: string, options: Record<string, any> = {}) {
      const { cacheTTL = 60000, defaultValue = null, timeout = DEFAULT_TIMEOUTS.MEDIUM } = options;
      
      return async (...args: unknown[]) => {
        const cached = _getFromCache(cacheKey);
        if (cached !== null) return cached;
        
        try {
          const result = await withTimeout((primaryFn as (...a: unknown[]) => unknown)(...args), timeout);
          _setCache(cacheKey, result, cacheTTL);
          return result;
        } catch (error: any) {
          _logger.warn(`Primary failed, no cache: ${error.message}`);
          return defaultValue;
        }
      };
    },

    getState(operationId: unknown) {
      return _states.get(operationId) || null;
    },

    isHealthy(operationId: unknown) {
      const state = _states.get(operationId);
      return state?.healthy !== false;
    },

    listOperations() {
      return Array.from(_chains.keys());
    },

    // @ts-expect-error strict migration — TS2322
    clearCache(key: string = null) {
      if (key) {
        _cache.delete(key);
        _cacheExpiry.delete(key);
      } else {
        _cache.clear();
        _cacheExpiry.clear();
      }
    },

    resetState(operationId: unknown) {
      _states.set(operationId, { level: FALLBACK_LEVELS.PRIMARY, healthy: true });
    },

    getMetrics() {
      return {
        ..._metrics,
        registeredOperations: _chains.size,
        cacheSize: _cache.size,
        successRate: _metrics.totalCalls > 0 
          ? `${((_metrics.primarySuccess + _metrics.fallbacksUsed) / _metrics.totalCalls * 100).toFixed(2)}%`
          : '0%'
      };
    },

    resetMetrics() {
      _metrics = { totalCalls: 0, primarySuccess: 0, fallbacksUsed: 0, cacheHits: 0, exhausted: 0, recovered: 0 };
    },

    healthCheck() {
      const unhealthy = Array.from(_states.entries()).filter(([_, s]) => !s.healthy);
      
      let status = 'HEALTHY';
      if (unhealthy.length > 0) status = 'DEGRADED';
      if (unhealthy.length > _chains.size / 2) status = 'UNHEALTHY';

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

let _instance: ReturnType<typeof createFallbackSystem> | null = null;

export function getFallbackSystem(options: Record<string, any> = {}) {
  if (!_instance) {
    _instance = createFallbackSystem(options);
  }
  return _instance;
}

export function resetFallbackSystem() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, levels: Object.keys(FALLBACK_LEVELS), strategies: Object.keys(FALLBACK_STRATEGIES) };
}

export function healthCheck(): Record<string, unknown> {
  if (_instance) return _instance.healthCheck();
  return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID };
}

export default {
  VERSION, MODULE_ID,
  FALLBACK_LEVELS, FALLBACK_STRATEGIES,
  createFallbackSystem, getFallbackSystem, resetFallbackSystem,
  info, healthCheck
};
