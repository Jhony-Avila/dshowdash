// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: logger-global-throttle
// PURPOSE: Logger Global - Throttle v1.0.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   shouldAllow() — exported function
//   initThrottle() — exported function
//   setThrottleEnabled() — exported function
//   isThrottleEnabled() — exported function
//   getThrottleConfig() — exported function
//   getThrottleStats() — exported function
//   resetThrottleStats() — exported function
//   releaseThrottle() — exported function
//   releaseAllThrottles() — exported function
//   healthCheck() — exported function
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

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'logger-global-throttle';

// Configuração padrão
var DEFAULT_MAX_PER_SECOND = 10;
var DEFAULT_WINDOW_MS = 1000;
var DEFAULT_COOLDOWN_MS = 5000;

var _config = {
  enabled: true,
  maxPerSecond: DEFAULT_MAX_PER_SECOND,
  windowMs: DEFAULT_WINDOW_MS,
  cooldownMs: DEFAULT_COOLDOWN_MS,
  bypassLevels: ['error', 'critical', 'security', 'audit', 'panic']
};

// Contadores por componente
var _componentCounters = {};
var _throttledComponents = new Set();
var _stats = {
  totalThrottled: 0,
  byComponent: {},
  lastThrottleAt: null as unknown | null
};

// Estrutura do contador
function createCounter() {
  return {
    count: 0,
    windowStart: Date.now(),
    throttledUntil: 0,
    totalThrottled: 0
  };
}

// Verifica se deve permitir log
export function shouldAllow(component: string, level: string) {
  if (!_config.enabled) return { allowed: true };
  
  // Bypass para níveis críticos
  if (_config.bypassLevels.indexOf(level) !== -1) {
    return { allowed: true, reason: 'bypass-level' };
  }
  
  var now = Date.now();
  
  // Inicializa contador se não existe
  // @ts-expect-error strict migration — TS7053
  if (!_componentCounters[component]) {
    // @ts-expect-error strict migration — TS7053
    _componentCounters[component] = createCounter();
  }
  
  // @ts-expect-error strict migration — TS7053
  var counter = _componentCounters[component];
  
  // Se está em cooldown
  if (counter.throttledUntil > now) {
    counter.totalThrottled++;
    _stats.totalThrottled++;
    _stats.lastThrottleAt = now;
    // @ts-expect-error strict migration — TS7053
    if (!_stats.byComponent[component]) _stats.byComponent[component] = 0;
    // @ts-expect-error strict migration — TS7053
    _stats.byComponent[component]++;
    
    return { 
      allowed: false, 
      reason: 'cooldown',
      remainingMs: counter.throttledUntil - now
    };
  }
  
  // Reset janela se expirou
  if (now - counter.windowStart > _config.windowMs) {
    counter.count = 0;
    counter.windowStart = now;
    _throttledComponents.delete(component);
  }
  
  // Incrementa contador
  counter.count++;
  
  // Verifica limite
  if (counter.count > _config.maxPerSecond) {
    counter.throttledUntil = now + _config.cooldownMs;
    counter.totalThrottled++;
    _stats.totalThrottled++;
    _stats.lastThrottleAt = now;
    _throttledComponents.add(component);
    // @ts-expect-error strict migration — TS7053
    if (!_stats.byComponent[component]) _stats.byComponent[component] = 0;
    // @ts-expect-error strict migration — TS7053
    _stats.byComponent[component]++;
    
    return { 
      allowed: false, 
      reason: 'rate-limit',
      cooldownMs: _config.cooldownMs
    };
  }
  
  return { allowed: true, count: counter.count };
}

// Configuração
export function initThrottle(config: Record<string, unknown>) {
  config = config || {};
  if (config.enabled !== undefined) _config.enabled = config.enabled as boolean;
  if (config.maxPerSecond) _config.maxPerSecond = config.maxPerSecond as number;
  if (config.windowMs) _config.windowMs = config.windowMs as number;
  if (config.cooldownMs) _config.cooldownMs = config.cooldownMs as number;
  if (Array.isArray(config.bypassLevels)) _config.bypassLevels = config.bypassLevels as string[];
  
  return { ok: true, config: getThrottleConfig() };
}

export function setThrottleEnabled(enabled: boolean) {
  _config.enabled = enabled;
  if (!enabled) {
    // Limpa throttles ativos
    _componentCounters = {};
    _throttledComponents.clear();
  }
}

export function isThrottleEnabled() {
  return _config.enabled;
}

export function getThrottleConfig() {
  return { ..._config, bypassLevels: [..._config.bypassLevels] };
}

// Stats
export function getThrottleStats() {
  var throttledList: unknown[] = [];
  _throttledComponents.forEach(function(c) { throttledList.push(c); });
  
  return {
    enabled: _config.enabled,
    totalThrottled: _stats.totalThrottled,
    currentlyThrottled: throttledList,
    byComponent: { ..._stats.byComponent },
    lastThrottleAt: _stats.lastThrottleAt,
    activeComponents: Object.keys(_componentCounters).length
  };
}

export function resetThrottleStats() {
  _stats = {
    totalThrottled: 0,
    byComponent: {},
    lastThrottleAt: null
  };
}

// Libera throttle de componente específico
export function releaseThrottle(component: string) {
  // @ts-expect-error strict migration — TS7053
  if (_componentCounters[component]) {
    // @ts-expect-error strict migration — TS7053
    _componentCounters[component].throttledUntil = 0;
    _throttledComponents.delete(component);
    return true;
  }
  return false;
}

// Libera todos os throttles
export function releaseAllThrottles() {
  var released = Object.keys(_componentCounters).length;
  _componentCounters = {};
  _throttledComponents.clear();
  return released;
}

export function healthCheck() {
  var throttledList = [];
  _throttledComponents.forEach(function(c) { throttledList.push(c); });
  
  return {
    status: _config.enabled ? 'HEALTHY' : 'DISABLED',
    version: VERSION,
    moduleId: MODULE_ID,
    enabled: _config.enabled,
    throttledComponents: throttledList.length,
    totalThrottled: _stats.totalThrottled
  };
}
