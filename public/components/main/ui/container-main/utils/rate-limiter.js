import { createLogger } from "./logger.js";
const VERSION = "1.0.0-PHASE5";
const MODULE_ID = "container-main:rate-limiter";
const STRATEGIES = Object.freeze({
  SLIDING_WINDOW: "sliding-window",
  FIXED_WINDOW: "fixed-window",
  TOKEN_BUCKET: "token-bucket",
  LEAKY_BUCKET: "leaky-bucket"
});
const LIMIT_ACTIONS = Object.freeze({
  REJECT: "reject",
  QUEUE: "queue",
  THROTTLE: "throttle",
  WARN: "warn"
});
function createRateLimiter(options = {}) {
  const {
    maxRequests = 100,
    windowMs = 6e4,
    strategy = STRATEGIES.SLIDING_WINDOW,
    action = LIMIT_ACTIONS.REJECT,
    keyGenerator = () => "default",
    onLimitReached = null,
    onRequestAllowed = null,
    cleanupInterval = 6e4
  } = options;
  const _logger = createLogger(MODULE_ID);
  let _buckets = /* @__PURE__ */ new Map();
  let _queue = [];
  let _cleanupTimer = null;
  let _metrics = { allowed: 0, rejected: 0, queued: 0, totalRequests: 0 };
  function _cleanup() {
    const now = Date.now();
    for (const [key, bucket] of _buckets) {
      if (now - bucket.lastAccess > windowMs * 2) {
        _buckets.delete(key);
      }
    }
  }
  _cleanupTimer = setInterval(_cleanup, cleanupInterval);
  function _getBucket(key) {
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
  function _checkSlidingWindow(bucket) {
    const now = Date.now();
    const windowStart = now - windowMs;
    bucket.requests = bucket.requests.filter((t) => t > windowStart);
    if (bucket.requests.length >= maxRequests) {
      return { allowed: false, remaining: 0, resetAt: bucket.requests[0] + windowMs };
    }
    bucket.requests.push(now);
    return { allowed: true, remaining: maxRequests - bucket.requests.length, resetAt: now + windowMs };
  }
  function _checkFixedWindow(bucket) {
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    if (!bucket.windowStart || bucket.windowStart !== windowStart) {
      bucket.windowStart = windowStart;
      bucket.count = 0;
    }
    if (bucket.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetAt: windowStart + windowMs };
    }
    bucket.count++;
    return { allowed: true, remaining: maxRequests - bucket.count, resetAt: windowStart + windowMs };
  }
  function _checkTokenBucket(bucket) {
    const now = Date.now();
    const timePassed = now - bucket.lastRefill;
    const refillRate = maxRequests / windowMs;
    bucket.tokens = Math.min(maxRequests, bucket.tokens + timePassed * refillRate);
    bucket.lastRefill = now;
    if (bucket.tokens < 1) {
      return { allowed: false, remaining: 0, resetAt: now + (1 - bucket.tokens) / refillRate };
    }
    bucket.tokens--;
    return { allowed: true, remaining: Math.floor(bucket.tokens), resetAt: now + windowMs };
  }
  function _checkLeakyBucket(bucket) {
    const now = Date.now();
    const leakRate = maxRequests / windowMs;
    if (!bucket.water) bucket.water = 0;
    if (!bucket.lastLeak) bucket.lastLeak = now;
    const timePassed = now - bucket.lastLeak;
    bucket.water = Math.max(0, bucket.water - timePassed * leakRate);
    bucket.lastLeak = now;
    if (bucket.water >= maxRequests) {
      return { allowed: false, remaining: 0, resetAt: now + (bucket.water - maxRequests + 1) / leakRate };
    }
    bucket.water++;
    return { allowed: true, remaining: Math.floor(maxRequests - bucket.water), resetAt: now + windowMs };
  }
  function _check(key) {
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
    check(key = null) {
      const resolvedKey = key || keyGenerator();
      return _check(resolvedKey);
    },
    // Tenta executar com rate limiting
    async attempt(fn, key = null) {
      const resolvedKey = key || keyGenerator();
      const result = _check(resolvedKey);
      _metrics.totalRequests++;
      if (result.allowed) {
        _metrics.allowed++;
        onRequestAllowed?.({ key: resolvedKey, remaining: result.remaining });
        if (typeof fn === "function") {
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
        if (typeof fn === "function") {
          return { success: true, result: await fn(), rateLimit: result, warning: "Rate limit exceeded" };
        }
        return { success: true, rateLimit: result, warning: "Rate limit exceeded" };
      }
      return { success: false, error: "Rate limit exceeded", rateLimit: result };
    },
    // Wrapper para funções
    wrap(fn, key = null) {
      return async (...args) => {
        const result = await this.attempt(() => fn(...args), key);
        if (!result.success) {
          throw new Error(result.error);
        }
        return result.result;
      };
    },
    // Cria limiter específico
    createLimiter(customOptions = {}) {
      return createRateLimiter({ ...options, ...customOptions });
    },
    // Reset bucket específico
    reset(key) {
      _buckets.delete(key);
    },
    // Reset todos os buckets
    resetAll() {
      _buckets.clear();
    },
    // Obtém status de um bucket
    getStatus(key = null) {
      const resolvedKey = key || keyGenerator();
      const result = _check(resolvedKey);
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
        rejectionRate: _metrics.totalRequests > 0 ? `${(_metrics.rejected / _metrics.totalRequests * 100).toFixed(2)}%` : "0%"
      };
    },
    resetMetrics() {
      _metrics = { allowed: 0, rejected: 0, queued: 0, totalRequests: 0 };
    },
    // Health check
    healthCheck() {
      const metrics = this.getMetrics();
      const rejectionRate = parseFloat(metrics.rejectionRate);
      let status = "HEALTHY";
      if (rejectionRate > 50) status = "WARNING";
      if (rejectionRate > 80) status = "DEGRADED";
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
const PRESETS = Object.freeze({
  // API calls - 100 req/min
  api: { maxRequests: 100, windowMs: 6e4, strategy: STRATEGIES.SLIDING_WINDOW },
  // UI interactions - 20 req/sec
  ui: { maxRequests: 20, windowMs: 1e3, strategy: STRATEGIES.TOKEN_BUCKET },
  // Form submissions - 5 req/min
  form: { maxRequests: 5, windowMs: 6e4, strategy: STRATEGIES.FIXED_WINDOW },
  // Heavy operations - 10 req/5min
  heavy: { maxRequests: 10, windowMs: 3e5, strategy: STRATEGIES.LEAKY_BUCKET },
  // Auth attempts - 5 req/15min
  auth: { maxRequests: 5, windowMs: 9e5, strategy: STRATEGIES.FIXED_WINDOW, action: LIMIT_ACTIONS.REJECT }
});
function createFromPreset(presetName, overrides = {}) {
  const preset = PRESETS[presetName];
  if (!preset) {
    throw new Error(`Unknown preset: ${presetName}`);
  }
  return createRateLimiter({ ...preset, ...overrides });
}
let _instances = /* @__PURE__ */ new Map();
function getRateLimiter(name = "default", options = {}) {
  if (!_instances.has(name)) {
    _instances.set(name, createRateLimiter(options));
  }
  return _instances.get(name);
}
function resetRateLimiter(name = null) {
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
function info() {
  return { moduleId: MODULE_ID, version: VERSION, strategies: Object.keys(STRATEGIES), presets: Object.keys(PRESETS) };
}
function healthCheck() {
  const instance = _instances.get("default");
  if (instance) return instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var rate_limiter_default = {
  VERSION,
  MODULE_ID,
  STRATEGIES,
  LIMIT_ACTIONS,
  PRESETS,
  createRateLimiter,
  createFromPreset,
  getRateLimiter,
  resetRateLimiter,
  info,
  healthCheck
};
export {
  LIMIT_ACTIONS,
  MODULE_ID,
  PRESETS,
  STRATEGIES,
  VERSION,
  createFromPreset,
  createRateLimiter,
  rate_limiter_default as default,
  getRateLimiter,
  healthCheck,
  info,
  resetRateLimiter
};
