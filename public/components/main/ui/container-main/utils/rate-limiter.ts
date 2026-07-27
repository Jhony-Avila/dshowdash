
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE5-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:rate-limiter
// PURPOSE: Rate Limiter - Controle de taxa de requisições
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   STRATEGIES — exported value
//   LIMIT_ACTIONS — exported value
//   createRateLimiter() — exported function
//   PRESETS — exported value
//   createFromPreset() — exported function
//   getRateLimiter() — exported function
//   resetRateLimiter() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from './logger.js';

export const VERSION = '1.0.0-PHASE5';
export const MODULE_ID = 'container-main:rate-limiter';

// Estratégias de rate limiting
export const STRATEGIES = Object.freeze({
  SLIDING_WINDOW: 'sliding-window',
  FIXED_WINDOW: 'fixed-window',
  TOKEN_BUCKET: 'token-bucket',
  LEAKY_BUCKET: 'leaky-bucket'
});

// Ações quando limite atingido
export const LIMIT_ACTIONS = Object.freeze({
  REJECT: 'reject',
  QUEUE: 'queue',
  THROTTLE: 'throttle',
  WARN: 'warn'
});

// Cria o rate limiter
export function createRateLimiter(options: Record<string, any> = {}) {
  const {
    maxRequests = 100,
    windowMs = 60000,
    strategy = STRATEGIES.SLIDING_WINDOW,
    action = LIMIT_ACTIONS.REJECT,
    keyGenerator = () => 'default',
    onLimitReached = null,
    onRequestAllowed = null,
    cleanupInterval = 60000
  } = options;

  const _logger = createLogger(MODULE_ID);
  let _buckets = new Map();
  let _queue = [];
  let _cleanupTimer: ReturnType<typeof setTimeout> | null = null;
  let _metrics = { allowed: 0, rejected: 0, queued: 0, totalRequests: 0 };

  // Limpa buckets expirados
  function _cleanup() {
    const now = Date.now();
    for (const [key, bucket] of _buckets) {
      if (now - bucket.lastAccess > windowMs * 2) {
        _buckets.delete(key);
      }
    }
  }

  // Inicia cleanup automático
  _cleanupTimer = setInterval(_cleanup, cleanupInterval);

  // Obtém ou cria bucket
  function _getBucket(key: string) {
    if (!_buckets.has(key)) {
      _buckets.set(key, {
        requests: [],
        tokens: maxRequests,
        lastRefill: Date.now(),
        lastAccess: Date.now()
      });
    }
    const bucket = _buckets.get(key);
    bucket.lastAccess = Date.now();
    return bucket;
  }

  // Sliding Window
  function _checkSlidingWindow(bucket: Record<string, unknown>) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Remove requisições fora da janela
    bucket.requests = (bucket.requests as unknown[]).filter((t: unknown) => (t as number) > windowStart);
    
    if ((bucket.requests as unknown[]).length >= maxRequests) {
      // @ts-expect-error strict migration — TS18046
      return { allowed: false, remaining: 0, resetAt: bucket.requests[0] + windowMs };
    }
    
    (bucket.requests as unknown[]).push(now);
    return { allowed: true, remaining: maxRequests - (bucket.requests as unknown[]).length, resetAt: now + windowMs };
  }

  // Fixed Window
  function _checkFixedWindow(bucket: Record<string, unknown>) {
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    
    if (!bucket.windowStart || bucket.windowStart !== windowStart) {
      bucket.windowStart = windowStart;
      bucket.count = 0;
    }
    
    // @ts-expect-error strict migration — TS18046
    if (bucket.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetAt: windowStart + windowMs };
    }
    
    (bucket.count as number)++;
    return { allowed: true, remaining: maxRequests - (bucket.count as number), resetAt: windowStart + windowMs };
  }

  // Token Bucket
  function _checkTokenBucket(bucket: Record<string, unknown>) {
    const now = Date.now();
    const timePassed = now - (bucket.lastRefill as number);
    const refillRate = maxRequests / windowMs;
    
    // Recarrega tokens
    bucket.tokens = Math.min(maxRequests, (bucket.tokens as number) + (timePassed * refillRate));
    bucket.lastRefill = now;
    
    if ((bucket.tokens as number) < 1) {
      return { allowed: false, remaining: 0, resetAt: now + ((1 - (bucket.tokens as number)) / refillRate) };
    }
    
    (bucket.tokens as number)--;
    return { allowed: true, remaining: Math.floor((bucket.tokens as number)), resetAt: now + windowMs };
  }

  // Leaky Bucket
  function _checkLeakyBucket(bucket: Record<string, unknown>) {
    const now = Date.now();
    const leakRate = maxRequests / windowMs;
    
    if (!bucket.water) bucket.water = 0;
    if (!bucket.lastLeak) bucket.lastLeak = now;
    
    // Vaza água
    const timePassed = now - (bucket.lastLeak as number);
    bucket.water = Math.max(0, (bucket.water as number) - (timePassed * leakRate));
    bucket.lastLeak = now;
    
    // @ts-expect-error strict migration — TS18046
    if (bucket.water >= maxRequests) {
      return { allowed: false, remaining: 0, resetAt: now + (((bucket.water as number) - maxRequests + 1) / leakRate) };
    }
    
    (bucket.water as number)++;
    return { allowed: true, remaining: Math.floor(maxRequests - (bucket.water as number)), resetAt: now + windowMs };
  }

  // Verifica rate limit
  function _check(key: string) {
    const bucket = _getBucket(key);
    
    switch (strategy) {
      case STRATEGIES.FIXED_WINDOW:
        return _checkFixedWindow(bucket);
      case STRATEGIES.TOKEN_BUCKET:
        return _checkTokenBucket(bucket);
      case STRATEGIES.LEAKY_BUCKET:
        return _checkLeakyBucket(bucket);
      default:
        return _checkSlidingWindow(bucket);
    }
  }

  const limiter = {
    // Verifica se requisição é permitida
    check(key: string | null = null) {
      const resolvedKey = key || keyGenerator();
      return _check(resolvedKey);
    },

    // Tenta executar com rate limiting
    async attempt(fn: (...args: unknown[]) => void, key: string | null = null) {
      const resolvedKey = key || keyGenerator();
      const result = _check(resolvedKey);
      
      _metrics.totalRequests++;
      
      if (result.allowed) {
        _metrics.allowed++;
        onRequestAllowed?.({ key: resolvedKey, remaining: result.remaining });
        
        if (typeof fn === 'function') {
          return { success: true, result: await fn(), rateLimit: result };
        }
        return { success: true, rateLimit: result };
      }
      
      _metrics.rejected++;
      onLimitReached?.({ key: resolvedKey, resetAt: result.resetAt });
      _logger.warn(`Rate limit reached for key: ${resolvedKey}`, {});
      
      if (action === LIMIT_ACTIONS.QUEUE) {
        _metrics.queued++;
        return new Promise((resolve) => {
          const delay = result.resetAt - Date.now();
          setTimeout(async () => {
            const retryResult = await this.attempt(fn, resolvedKey);
            resolve(retryResult);
          }, Math.max(0, delay));
        });
      }
      
      if (action === LIMIT_ACTIONS.WARN) {
        if (typeof fn === 'function') {
          return { success: true, result: await fn(), rateLimit: result, warning: 'Rate limit exceeded' };
        }
        return { success: true, rateLimit: result, warning: 'Rate limit exceeded' };
      }
      
      return { success: false, error: 'Rate limit exceeded', rateLimit: result };
    },

    // Wrapper para funções
    wrap(fn: (...args: unknown[]) => void, key: string | null = null) {
      return async (...args: unknown[]) => {
        const result = await this.attempt(() => fn(...args), key);
        // @ts-expect-error strict migration — TS18046
        if (!result.success) {
          // @ts-expect-error strict migration — TS18046
          throw new Error(result.error);
        }
        // @ts-expect-error strict migration — TS18046
        return result.result;
      };
    },

    // Cria limiter específico
    createLimiter(customOptions = {}) {
      return createRateLimiter({ ...options, ...customOptions });
    },

    // Reset bucket específico
    reset(key: string) {
      _buckets.delete(key);
    },

    // Reset todos os buckets
    resetAll() {
      _buckets.clear();
    },

    // Obtém status de um bucket
    getStatus(key: string | null = null) {
      const resolvedKey = key || keyGenerator();
      const result = _check(resolvedKey);
      
      // Desfaz a contagem feita pelo check
      const bucket = _buckets.get(resolvedKey);
      if (bucket && bucket.requests) {
        bucket.requests.pop();
      }
      
      return {
        key: resolvedKey,
        remaining: result.remaining + (result.allowed ? 1 : 0),
        resetAt: result.resetAt,
        resetIn: Math.max(0, result.resetAt - Date.now())
      };
    },

    // Métricas
    getMetrics() {
      return {
        ..._metrics,
        activeBuckets: _buckets.size,
        queueSize: _queue.length,
        rejectionRate: _metrics.totalRequests > 0 
          ? `${((_metrics.rejected / _metrics.totalRequests) * 100).toFixed(2)}%`
          : '0%'
      };
    },

    resetMetrics() {
      _metrics = { allowed: 0, rejected: 0, queued: 0, totalRequests: 0 };
    },

    // Health check
    healthCheck() {
      const metrics = this.getMetrics();
      const rejectionRate = parseFloat(metrics.rejectionRate);
      
      let status = 'HEALTHY';
      if (rejectionRate > 50) status = 'WARNING';
      if (rejectionRate > 80) status = 'DEGRADED';
      
      return {
        status,
        version: VERSION,
        moduleId: MODULE_ID,
        strategy,
        maxRequests,
        windowMs,
        metrics
      };
    },

    // Info
    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        strategy,
        maxRequests,
        windowMs,
        action,
        strategies: Object.keys(STRATEGIES),
        actions: Object.keys(LIMIT_ACTIONS)
      };
    },

    // Destroy
    destroy() {
      if (_cleanupTimer) {
        clearInterval(_cleanupTimer);
        _cleanupTimer = null;
      }
      _buckets.clear();
      _queue = [];
    }
  };

  return limiter;
}

// Presets
export const PRESETS = Object.freeze({
  // API calls - 100 req/min
  api: { maxRequests: 100, windowMs: 60000, strategy: STRATEGIES.SLIDING_WINDOW },
  // UI interactions - 20 req/sec
  ui: { maxRequests: 20, windowMs: 1000, strategy: STRATEGIES.TOKEN_BUCKET },
  // Form submissions - 5 req/min
  form: { maxRequests: 5, windowMs: 60000, strategy: STRATEGIES.FIXED_WINDOW },
  // Heavy operations - 10 req/5min
  heavy: { maxRequests: 10, windowMs: 300000, strategy: STRATEGIES.LEAKY_BUCKET },
  // Auth attempts - 5 req/15min
  auth: { maxRequests: 5, windowMs: 900000, strategy: STRATEGIES.FIXED_WINDOW, action: LIMIT_ACTIONS.REJECT }
});

// Factory com preset
export function createFromPreset(presetName: unknown, overrides = {}) {
  // @ts-expect-error strict migration — TS7053
  const preset = PRESETS[presetName as string];
  if (!preset) {
    throw new Error(`Unknown preset: ${presetName}`);
  }
  return createRateLimiter({ ...preset, ...overrides });
}

// Singleton instances
let _instances = new Map();

export function getRateLimiter(name = 'default', options: Record<string, any> = {}) {
  if (!_instances.has(name)) {
    _instances.set(name, createRateLimiter(options));
  }
  return _instances.get(name);
}

export function resetRateLimiter(name: string | null = null) {
  if (name) {
    const instance = _instances.get(name);
    if (instance) {
      instance.destroy();
      _instances.delete(name);
    }
  } else {
    for (const instance of _instances.values()) {
      instance.destroy();
    }
    _instances.clear();
  }
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, strategies: Object.keys(STRATEGIES), presets: Object.keys(PRESETS) };
}

export function healthCheck() {
  const instance = _instances.get('default');
  if (instance) return instance.healthCheck();
  return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID };
}

export default {
  VERSION, MODULE_ID,
  STRATEGIES, LIMIT_ACTIONS, PRESETS,
  createRateLimiter, createFromPreset, getRateLimiter, resetRateLimiter,
  info, healthCheck
};
