

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: logger-global-anomaly
// PURPOSE: Detecta padrões anormais (ex: 100 errors em 1 min → alerta)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SYSTEM_EVENTS from /core/runtime/events/index.js
//   isStrict from /core/runtime/enterprise/strict-mode.js
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   recordOccurrence() — exported function
//   onAnomaly() — exported function
//   getRecentAnomalies() — exported function
//   getCurrentStatus() — exported function
//   initAnomaly() — exported function
//   setAnomalyEnabled() — exported function
//   isAnomalyEnabled() — exported function
//   getAnomalyConfig() — exported function
//   getAnomalyStats() — exported function
//   resetAnomalyStats() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   SYSTEM_EVENTS.HEALTH_DEGRADED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.Core
// ═══════════════════════════════════════════════════════════════
'use strict';

import { SYSTEM_EVENTS } from '/core/runtime/events/catalog/system.events.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';
import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.2.0-STRICT-MODE';
export const MODULE_ID = 'logger-global-anomaly';

// Ports pattern para acesso ao EventBus
const _Ports = createCorePorts({ moduleId: MODULE_ID });
const _getPort = (name: string) => _Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => _Ports.inject(p);
export const getPorts = () => _Ports.snapshot();

/**
 * Resolve EventBus via Ports/WindowAdapter
 * @contract STRICT_MODE - Em modo strict, sem fallback para window.EventBus
 * @returns {Object|null}
 */
function _getEventBus() {
  // Primary: Ports
  const eb = _getPort('eventBus');
  if (eb) return eb;

  if (typeof window === 'undefined') return null;
  const strictMode = isStrict();

  // Secondary: Core.windowAdapter
  if (window.Core?.windowAdapter?.get) {
    const wab = window.Core.windowAdapter.get('EventBus');
    if (wab) return wab;
  }

  return null;
}

var _config = {
  enabled: true,
  windowMs: 60000,
  thresholds: {
    error: { count: 50, action: 'alert' },
    critical: { count: 10, action: 'alert' },
    warn: { count: 100, action: 'log' }
  },
  cooldownMs: 300000
};

var _counters = {};
var _lastAlerts = {};
var _anomalies: unknown[] = [];
var MAX_ANOMALIES = 50;

var _stats = {
  anomaliesDetected: 0,
  alertsTriggered: 0,
  byLevel: {}
};

var _alertCallbacks: unknown[] = [];

function ensureCounter(level: string) {
  // @ts-expect-error strict migration — TS7053
  if (!_counters[level]) {
    // @ts-expect-error strict migration — TS7053
    _counters[level] = {
      count: 0,
      windowStart: Date.now(),
      timestamps: []
    };
  }
  // @ts-expect-error strict migration — TS7053
  return _counters[level];
}

export function recordOccurrence(level: string) {
  if (!_config.enabled) return null;
  
  // @ts-expect-error strict migration — TS7053
  var threshold = _config.thresholds[level];
  if (!threshold) return null;
  
  var counter = ensureCounter(level);
  var now = Date.now();
  
  counter.timestamps = counter.timestamps.filter(function(ts: number) {
    return now - ts < _config.windowMs;
  });
  
  counter.timestamps.push(now);
  counter.count = counter.timestamps.length;
  
  if (counter.count >= threshold.count) {
    return checkAndTriggerAnomaly(level, counter.count, threshold);
  }
  
  return null;
}

function checkAndTriggerAnomaly(level: string, count: number, threshold: { count: number; action: string }) {
  var now = Date.now();
  // @ts-expect-error strict migration — TS7053
  var lastAlert = _lastAlerts[level] || 0;
  
  if (now - lastAlert < _config.cooldownMs) {
    return { detected: true, suppressed: true, reason: 'cooldown' };
  }
  
  var anomaly = {
    id: 'anom-' + Date.now().toString(36),
    level: level,
    count: count,
    threshold: threshold.count,
    windowMs: _config.windowMs,
    action: threshold.action,
    detectedAt: now,
    message: 'Anomaly detected: ' + count + ' ' + level + ' logs in ' + (_config.windowMs / 1000) + 's (threshold: ' + threshold.count + ')'
  };
  
  _anomalies.push(anomaly);
  while (_anomalies.length > MAX_ANOMALIES) {
    _anomalies.shift();
  }
  
  // @ts-expect-error strict migration — TS7053
  _lastAlerts[level] = now;
  _stats.anomaliesDetected++;
  // @ts-expect-error strict migration — TS7053
  if (!_stats.byLevel[level]) _stats.byLevel[level] = 0;
  // @ts-expect-error strict migration — TS7053
  _stats.byLevel[level]++;
  
  if (threshold.action === 'alert') {
    triggerAlert(anomaly);
  }
  
  // @ts-expect-error strict migration — TS7053
  _counters[level] = {
    count: 0,
    windowStart: now,
    timestamps: []
  };
  
  return { detected: true, anomaly: anomaly };
}

// P18EC: usando SYSTEM_EVENTS.HEALTH_DEGRADED
// v1.2.0: EventBus via Ports/WindowAdapter (strict mode compliant)
function triggerAlert(anomaly: Record<string, unknown>) {
  _stats.alertsTriggered++;

  console.warn('🚨 [ANOMALY ALERT] ' + anomaly.message);

  // @ts-expect-error strict migration — TS2345
  _alertCallbacks.forEach(function(callback: (anomaly: Record<string, unknown>) => void) {
    try {
      callback(anomaly);
    } catch (e) {}
  });

  // v1.2.0: Usar _getEventBus() ao invés de window.EventBus direto
  const eventBus = _getEventBus();
  if (eventBus?.emit) {
    try {
      eventBus.emit(SYSTEM_EVENTS.HEALTH_DEGRADED, anomaly);
    } catch (e) {}
  }
}

export function onAnomaly(callback: (...args: unknown[]) => void) {
  if (typeof callback === 'function') {
    _alertCallbacks.push(callback);
  }
  return function() {
    _alertCallbacks = _alertCallbacks.filter(function(cb: unknown) { return cb !== callback; });
  };
}

export function getRecentAnomalies(limit: number) {
  limit = limit || 10;
  return _anomalies.slice(-limit);
}

export function getCurrentStatus() {
  var status = {};
  var now = Date.now();
  
  for (var level in _counters) {
    // @ts-expect-error strict migration — TS7053
    var counter = _counters[level];
    // @ts-expect-error strict migration — TS7053
    var threshold = _config.thresholds[level];
    
    // @ts-expect-error strict migration — TS7053
    status[level] = {
      count: counter.count,
      threshold: threshold ? threshold.count : null,
      percentage: threshold ? Math.round((counter.count / threshold.count) * 100) : 0,
      windowRemaining: Math.max(0, _config.windowMs - (now - counter.windowStart))
    };
  }
  
  return status;
}

export function initAnomaly(config: Record<string, unknown>) {
  config = config || {};
  if (config.enabled !== undefined) _config.enabled = config.enabled as boolean;
  if (config.windowMs) _config.windowMs = config.windowMs as number;
  if (config.cooldownMs) _config.cooldownMs = config.cooldownMs as number;
  if (config.thresholds) {
    for (var level in config.thresholds as Record<string, unknown>) {
      // @ts-expect-error strict migration — TS7053
      _config.thresholds[level] = (config.thresholds as Record<string, unknown>)[level];
    }
  }
  
  return { ok: true, config: getAnomalyConfig() };
}

export function setAnomalyEnabled(enabled: boolean) {
  _config.enabled = enabled;
  if (!enabled) {
    _counters = {};
  }
}

export function isAnomalyEnabled() {
  return _config.enabled;
}

export function getAnomalyConfig() {
  return {
    enabled: _config.enabled,
    windowMs: _config.windowMs,
    cooldownMs: _config.cooldownMs,
    thresholds: { ..._config.thresholds }
  };
}

export function getAnomalyStats() {
  return {
    enabled: _config.enabled,
    anomaliesDetected: _stats.anomaliesDetected,
    alertsTriggered: _stats.alertsTriggered,
    byLevel: { ..._stats.byLevel },
    currentStatus: getCurrentStatus(),
    recentAnomalies: getRecentAnomalies(5)
  };
}

export function resetAnomalyStats() {
  _stats = {
    anomaliesDetected: 0,
    alertsTriggered: 0,
    byLevel: {}
  };
  _counters = {};
  _anomalies = [];
}

export function healthCheck() {
  var status = getCurrentStatus();
  var nearThreshold = false;

  for (var level in status) {
    // @ts-expect-error strict migration — TS7053
    if (status[level].percentage > 80) {
      nearThreshold = true;
      break;
    }
  }

  const strictMode = isStrict();
  const hasEventBus = !!_getEventBus();

  return {
    status: !_config.enabled ? 'DISABLED' : (nearThreshold ? 'WARNING' : 'HEALTHY'),
    version: VERSION,
    moduleId: MODULE_ID,
    enabled: _config.enabled,
    anomaliesDetected: _stats.anomaliesDetected,
    nearThreshold: nearThreshold,
    strictMode: strictMode,
    eventBusAvailable: hasEventBus,
    strictModeCompliant: !strictMode || hasEventBus,
    portsInitialized: _Ports.isInitialized()
  };
}
