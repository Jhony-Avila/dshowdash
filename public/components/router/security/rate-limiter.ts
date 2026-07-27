

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: router.security.rate-limiter
// PURPOSE: security   rate limiter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ALGORITHMS — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   setRouteLimit() — exported function
//   removeRouteLimit() — exported function
//   getRouteLimit() — exported function
//   getAllLimits() — exported function
//   checkLimit() — exported function
//   resetRoute() — exported function
//   resetUser() — exported function
//   resetAll() — exported function
//   cleanup() — exported function
//   getMetrics() — exported function
//   getStatus() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
// Route Rate Limiter v1.2.0-P17WI
// @version 1.2.0-P17WI
// @changelog P17WI - Migração para PortsFactory/PortsProfiles
// Limita frequência de acesso a rotas

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.2.0-P17WI';
export const MODULE_ID = 'router.security.rate-limiter';

const hasWindow = typeof window !== 'undefined';

// P17WI PORTS PATTERN
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function _log(level: string, msg: string, ctx: Record<string, unknown> = {}) {
  const logger = _getPort('logger');
  if (!logger || typeof logger[level] !== 'function') return;
  logger[level](msg, { component: MODULE_ID, ...ctx });
}

// Algoritmos disponíveis
export const ALGORITHMS = Object.freeze({
  SLIDING_WINDOW: 'sliding-window',
  TOKEN_BUCKET: 'token-bucket',
  FIXED_WINDOW: 'fixed-window',
  LEAKY_BUCKET: 'leaky-bucket'
});

// Storage
const _routeLimits = new Map();
const _userBuckets = new Map();
const _globalBuckets = new Map();

// Métricas
const _metrics = {
  totalChecks: 0,
  allowed: 0,
  blocked: 0,
  lastCheck: null as number | null
};

export function setRouteLimit(routeId: string, config: Record<string, any> = {}) {
  _initPorts();
  const limit = {
    routeId,
    maxRequests: config.maxRequests || 100,
    windowMs: config.windowMs || 60000,
    algorithm: config.algorithm || ALGORITHMS.SLIDING_WINDOW,
    keyGenerator: config.keyGenerator || null,
    skipSuccessful: config.skipSuccessful || false,
    skipFailed: config.skipFailed || false,
    message: config.message || 'Too many requests',
    retryAfterMs: config.retryAfterMs || null,
    whitelist: config.whitelist || [],
    blacklist: config.blacklist || [],
    onLimitReached: config.onLimitReached || null,
    enabled: config.enabled ?? true
  };

  _routeLimits.set(routeId, limit);
  _log('info', 'Route limit set', { routeId, maxRequests: limit.maxRequests, windowMs: limit.windowMs });
  return limit;
}

export function removeRouteLimit(routeId: string) {
  const deleted = _routeLimits.delete(routeId);
  if (deleted) {
    _globalBuckets.delete(routeId);
    _log('info', 'Route limit removed', { routeId });
  }
  return deleted;
}

export function getRouteLimit(routeId: string) {
  return _routeLimits.get(routeId) || null;
}

export function getAllLimits() {
  return Array.from(_routeLimits.values());
}

export function checkLimit(routeId: string, context: Record<string, unknown> = {}) {
  _metrics.totalChecks++;
  _metrics.lastCheck = Date.now() as number | null;

  const limit = _routeLimits.get(routeId);
  
  if (!limit || !limit.enabled) {
    _metrics.allowed++;
    return { allowed: true, remaining: Infinity };
  }

  const key = _generateKey(routeId, context, limit);

  if (limit.whitelist.length > 0 && context.userId) {
    if (limit.whitelist.includes(context.userId)) {
      _metrics.allowed++;
      return { allowed: true, remaining: Infinity, whitelisted: true };
    }
  }

  if (limit.blacklist.length > 0 && context.userId) {
    if (limit.blacklist.includes(context.userId)) {
      _metrics.blocked++;
      return { 
        allowed: false, 
        remaining: 0, 
        blacklisted: true,
        message: 'Access denied',
        retryAfter: null as number | null
      };
    }
  }

  let result;
  switch (limit.algorithm) {
    case ALGORITHMS.TOKEN_BUCKET:
      result = _tokenBucket(key, limit);
      break;
    case ALGORITHMS.FIXED_WINDOW:
      result = _fixedWindow(key, limit);
      break;
    case ALGORITHMS.LEAKY_BUCKET:
      result = _leakyBucket(key, limit);
      break;
    case ALGORITHMS.SLIDING_WINDOW:
    default:
      result = _slidingWindow(key, limit);
  }

  if (result.allowed) {
    _metrics.allowed++;
  } else {
    _metrics.blocked++;
    if (limit.onLimitReached) {
      try {
        limit.onLimitReached({ routeId, key, context, limit: result });
      } catch (e: any) {
        _log('warn', 'onLimitReached callback error', { error: e.message });
      }
    }
  }

  return result;
}

function _slidingWindow(key: string, limit: { windowMs: number; maxRequests: number; message: string }) {
  const now = Date.now();
  const windowStart = now - limit.windowMs;

  if (!_userBuckets.has(key)) {
    _userBuckets.set(key, []);
  }

  const timestamps = _userBuckets.get(key);
  
  const validTimestamps = timestamps.filter((t: number) => t > windowStart);
  _userBuckets.set(key, validTimestamps);

  if (validTimestamps.length >= limit.maxRequests) {
    const oldestTimestamp = validTimestamps[0];
    const retryAfter = (oldestTimestamp + limit.windowMs) - now;
    
    return {
      allowed: false,
      remaining: 0,
      total: limit.maxRequests,
      resetAt: oldestTimestamp + limit.windowMs,
      retryAfter: Math.max(0, retryAfter),
      message: limit.message
    };
  }

  validTimestamps.push(now);
  
  return {
    allowed: true,
    remaining: limit.maxRequests - validTimestamps.length,
    total: limit.maxRequests,
    resetAt: validTimestamps[0] + limit.windowMs
  };
}

function _fixedWindow(key: string, limit: { windowMs: number; maxRequests: number; message: string }) {
  const now = Date.now();
  const windowKey = `${key}:${Math.floor(now / limit.windowMs)}`;

  if (!_globalBuckets.has(windowKey)) {
    _globalBuckets.set(windowKey, { count: 0, windowStart: now });
  }

  const bucket = _globalBuckets.get(windowKey);
  
  if (bucket.count >= limit.maxRequests) {
    const resetAt = bucket.windowStart + limit.windowMs;
    return {
      allowed: false,
      remaining: 0,
      total: limit.maxRequests,
      resetAt,
      retryAfter: resetAt - now,
      message: limit.message
    };
  }

  bucket.count++;
  
  return {
    allowed: true,
    remaining: limit.maxRequests - bucket.count,
    total: limit.maxRequests,
    resetAt: bucket.windowStart + limit.windowMs
  };
}

function _tokenBucket(key: string, limit: { windowMs: number; maxRequests: number; message: string }) {
  const now = Date.now();
  const refillRate = limit.maxRequests / limit.windowMs;

  if (!_userBuckets.has(key)) {
    _userBuckets.set(key, { tokens: limit.maxRequests, lastRefill: now });
  }

  const bucket = _userBuckets.get(key);
  
  const elapsed = now - bucket.lastRefill;
  const tokensToAdd = elapsed * refillRate;
  bucket.tokens = Math.min(limit.maxRequests, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;

  if (bucket.tokens < 1) {
    const timeToNextToken = (1 - bucket.tokens) / refillRate;
    return {
      allowed: false,
      remaining: 0,
      total: limit.maxRequests,
      retryAfter: Math.ceil(timeToNextToken),
      message: limit.message
    };
  }

  bucket.tokens -= 1;
  
  return {
    allowed: true,
    remaining: Math.floor(bucket.tokens),
    total: limit.maxRequests
  };
}

function _leakyBucket(key: string, limit: { windowMs: number; maxRequests: number; message: string }) {
  const now = Date.now();
  const leakRate = limit.maxRequests / limit.windowMs;

  if (!_userBuckets.has(key)) {
    _userBuckets.set(key, { water: 0, lastLeak: now });
  }

  const bucket = _userBuckets.get(key);
  
  const elapsed = now - bucket.lastLeak;
  const leaked = elapsed * leakRate;
  bucket.water = Math.max(0, bucket.water - leaked);
  bucket.lastLeak = now;

  if (bucket.water >= limit.maxRequests) {
    const timeToLeak = (bucket.water - limit.maxRequests + 1) / leakRate;
    return {
      allowed: false,
      remaining: 0,
      total: limit.maxRequests,
      retryAfter: Math.ceil(timeToLeak),
      message: limit.message
    };
  }

  bucket.water += 1;
  
  return {
    allowed: true,
    remaining: Math.floor(limit.maxRequests - bucket.water),
    total: limit.maxRequests
  };
}

function _generateKey(routeId: string, context: Record<string, unknown>, limit: { keyGenerator?: (id: string, ctx: Record<string, unknown>) => string }) {
  if (limit.keyGenerator) {
    try {
      return limit.keyGenerator(routeId, context);
    } catch (e: any) {
      _log('warn', 'Custom key generator failed', { error: e.message });
    }
  }

  const parts = [routeId];
  if (context.userId) parts.push(`user:${context.userId}`);
  else if (context.ip) parts.push(`ip:${context.ip}`);
  else if (context.sessionId) parts.push(`session:${context.sessionId}`);
  
  return parts.join(':');
}

export function resetRoute(routeId: string) {
  _globalBuckets.delete(routeId);
  
  for (const [key] of _userBuckets) {
    if (key.startsWith(`${routeId}:`)) {
      _userBuckets.delete(key);
    }
  }
  
  _log('info', 'Route rate limit reset', { routeId });
}

export function resetUser(userId: string) {
  for (const [key] of _userBuckets) {
    if (key.includes(`user:${userId}`)) {
      _userBuckets.delete(key);
    }
  }
  _log('info', 'User rate limits reset', { userId });
}

export function resetAll() {
  _userBuckets.clear();
  _globalBuckets.clear();
  _log('info', 'All rate limits reset');
}

export function cleanup(maxAgeMs = 3600000) {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, timestamps] of _userBuckets) {
    if (Array.isArray(timestamps)) {
      const recent = timestamps.filter(t => now - t < maxAgeMs);
      if (recent.length === 0) {
        _userBuckets.delete(key);
        cleaned++;
      } else {
        _userBuckets.set(key, recent);
      }
    }
  }

  _log('debug', 'Cleanup completed', { cleaned });
  return cleaned;
}

export function getMetrics() {
  return {
    ..._metrics,
    blockRate: _metrics.totalChecks > 0 
      ? `${((_metrics.blocked / _metrics.totalChecks) * 100).toFixed(2)}%`
      : '0%',
    routesWithLimits: _routeLimits.size,
    activeBuckets: _userBuckets.size + _globalBuckets.size
  };
}

export function getStatus() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    algorithms: Object.values(ALGORITHMS),
    portsInitialized: Ports.isInitialized(),
    metrics: getMetrics()
  };
}

export function healthCheck() {
  return {
    status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED',
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized(),
    checks: {
      limitsConfigured: _routeLimits.size >= 0,
      algorithmsAvailable: Object.keys(ALGORITHMS).length === 4
    },
    timestamp: Date.now()
  };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    features: ['sliding-window', 'token-bucket', 'fixed-window', 'leaky-bucket', 'whitelist', 'blacklist', 'custom-keys'],
    portsInitialized: Ports.isInitialized(),
    status: getStatus()
  };
}

export default {
  VERSION, MODULE_ID, ALGORITHMS,
  setRouteLimit, removeRouteLimit, getRouteLimit, getAllLimits,
  checkLimit,
  resetRoute, resetUser, resetAll, cleanup,
  getMetrics, getStatus, healthCheck, info,
  injectPorts, getPorts
};
