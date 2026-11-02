// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.kernel.telemetry-emitter
// PURPOSE: P2 AAA+ Governance - Telemetria formal para observabilidade
// ───────────────────────────────────────────────────────────────
// @contract KERNEL_INTERNAL - Módulo interno do kernel
// @contract TELEMETRY_OWNER - Owner de telemetria do sistema
// @contract EVENTS_SCHEMA - Eventos estruturados com schema definido
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   EVENT_TYPES — enum de tipos de eventos
//   LEVELS — enum de níveis (DEBUG, INFO, WARN, ERROR, CRITICAL)
//   emit(type, level, data, context) — emite evento de telemetria
//   emitDebug/emitInfo/emitWarn/emitError/emitCritical — atalhos por nível
//   featureRegistered/featureEnabled/featureDisabled/featureError — P2 convenience
//   governanceBlock/cascadeSuspended/recoveryBackoff — governance events
//   healthChange/lockViolation/unregisteredBlock — health/anti-regression
//   flush() — flush buffer de eventos
//   subscribe(callback) — subscribe a eventos
//   configure(config) — configuração
//   healthCheck() — status de saúde do módulo
//   info/getInfo() — informações do módulo
//   injectPorts(p) — inject port dependencies
//   getPorts() — return ports snapshot
//
// @changelog v1.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT, MODULE_ID
// @changelog v1.2.0-P2-ENTERPRISE: Migração completa para Ports
// @changelog v1.1.0-PORTSFACTORY: Migração para PortsFactory
// @changelog v1.0.0-P2: Implementação inicial P2 AAA+ Governance
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'core.kernel.telemetry-emitter';

// ═══════════════════════════════════════════════════════════════
// PORTS
// ═══════════════════════════════════════════════════════════════

const _Ports = createCorePorts({ moduleId: MODULE_ID });
let _portsInitialized = false;
function _initPorts() { if (_portsInitialized) return; _Ports.init(); _portsInitialized = true; }
function _getPort(name: string) { _initPorts(); return _Ports.get(name); }
function _getEventBus() { _initPorts(); return (_Ports as unknown as { getEventBus?: () => unknown }).getEventBus ? (_Ports as unknown as { getEventBus: () => unknown }).getEventBus() : null; }
export function injectPorts(p: unknown) { return _Ports.inject(p); }
export function getPorts() { return _Ports.snapshot(); }

// ═══════════════════════════════════════════════════════════════
// TELEMETRY EVENT TYPES
// ═══════════════════════════════════════════════════════════════

export const EVENT_TYPES = Object.freeze({
  // Feature lifecycle
  FEATURE_REGISTERED: 'feature:registered',
  FEATURE_ENABLED: 'feature:enabled',
  FEATURE_DISABLED: 'feature:disabled',
  FEATURE_ERROR: 'feature:error',
  FEATURE_RECOVERY: 'feature:recovery',

  // Governance
  GOVERNANCE_BLOCK: 'governance:block',
  GOVERNANCE_ALLOW: 'governance:allow',
  CASCADE_SUSPENDED: 'governance:cascade:suspended',
  RECOVERY_BACKOFF: 'governance:recovery:backoff',
  CAPABILITY_BLOCK: 'governance:capability:block',

  // Health
  HEALTH_CHANGE: 'health:change',
  HEALTH_CRITICAL: 'health:critical',
  HEALTH_DEGRADED: 'health:degraded',
  HEALTH_RECOVERED: 'health:recovered',

  // Manifest
  MANIFEST_REGISTERED: 'manifest:registered',
  MANIFEST_LOCKED: 'manifest:locked',
  FLAG_CHANGED: 'manifest:flag:changed',

  // Context
  MODE_CHANGE: 'context:mode:change',
  PHASE_CHANGE: 'context:phase:change',

  // Anti-regression
  LOCK_VIOLATION: 'antiregression:lock:violation',
  UNREGISTERED_BLOCK: 'antiregression:unregistered:block'
});

// ═══════════════════════════════════════════════════════════════
// TELEMETRY LEVELS
// ═══════════════════════════════════════════════════════════════

export const LEVELS = Object.freeze({
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  CRITICAL: 'critical'
});

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let _enabled = true;
let _buffer: unknown[] = [];
const _maxBufferSize = 1000;
let _subscribers: ((...args: unknown[]) => unknown)[] = [];
let _filters = {};
let _metrics = {
  emitted: 0,
  buffered: 0,
  flushed: 0,
  dropped: 0,
  errors: 0
};

const _config = {
  bufferEnabled: true,
  autoFlush: true,
  flushInterval: 5000,
  minLevel: LEVELS.INFO,
  includeStackTrace: false
};

let _flushTimer: ReturnType<typeof setInterval> | null = null;

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

const _levelPriority = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  critical: 4
};

function _shouldEmit(level: string) {
  return (_levelPriority as Record<string, number>)[level] >= (_levelPriority as Record<string, number>)[_config.minLevel];
}

function _createEvent(type: string, level: string, data: unknown, context: unknown) {
  return {
    id: _generateEventId(),
    type,
    level,
    data: data || {},
    context: Object.assign({
      moduleId: MODULE_ID,
      version: VERSION,
      timestamp: Date.now(),
      isoTime: new Date().toISOString()
    }, context || {}),
    meta: {
      emittedAt: Date.now(),
      buffered: false
    }
  };
}

function _generateEventId() {
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
}

// ═══════════════════════════════════════════════════════════════
// LOGGER (via PortsFactory)
// ═══════════════════════════════════════════════════════════════

function _log(level: string, message: string, data?: unknown) {
  const prefix = `[${MODULE_ID}]`;
  const logger = _getPort('logger');
  if (logger && logger[level]) {
    logger[level](`${prefix} ${message}`, data || {});
  }
}

// ═══════════════════════════════════════════════════════════════
// EMIT FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Emite um evento de telemetria
 */
export function emit(type: string, level: string, data?: unknown, context?: unknown) {
  if (!_enabled) return null;
  if (!_shouldEmit(level)) return null;

  // Verificar filtros
  if ((_filters as Record<string, unknown>)[type] === false) return null;

  const event = _createEvent(type, level, data, context);
  _metrics.emitted++;

  // Notificar subscribers
  for (let i = 0; i < _subscribers.length; i++) {
    try {
      _subscribers[i](event);
    } catch (e) {
      _metrics.errors++;
    }
  }

  // Buffer se habilitado
  if (_config.bufferEnabled) {
    _addToBuffer(event);
  }

  // Emitir via EventBus global
  _emitToEventBus(event);

  return event;
}

/**
 * Atalhos por nível
 */
export function emitDebug(type: string, data?: unknown, context?: unknown) {
  return emit(type, LEVELS.DEBUG, data, context);
}

export function emitInfo(type: string, data?: unknown, context?: unknown) {
  return emit(type, LEVELS.INFO, data, context);
}

export function emitWarn(type: string, data?: unknown, context?: unknown) {
  return emit(type, LEVELS.WARN, data, context);
}

export function emitError(type: string, data?: unknown, context?: unknown) {
  return emit(type, LEVELS.ERROR, data, context);
}

export function emitCritical(type: string, data?: unknown, context?: unknown) {
  return emit(type, LEVELS.CRITICAL, data, context);
}

// ═══════════════════════════════════════════════════════════════
// CONVENIENCE EMITTERS (P2 specific)
// ═══════════════════════════════════════════════════════════════

export function featureRegistered(featureId: string, definition: unknown) {
  return emitInfo(EVENT_TYPES.FEATURE_REGISTERED, { featureId, definition });
}

export function featureEnabled(featureId: string, duration: number) {
  return emitInfo(EVENT_TYPES.FEATURE_ENABLED, { featureId, durationMs: duration });
}

export function featureDisabled(featureId: string, reason: unknown) {
  return emitInfo(EVENT_TYPES.FEATURE_DISABLED, { featureId, reason });
}

export function featureError(featureId: string, errorMsg: unknown, stack?: unknown) {
  return emitError(EVENT_TYPES.FEATURE_ERROR, {
    featureId,
    error: errorMsg,
    stack: _config.includeStackTrace ? stack : undefined
  });
}

export function featureRecovery(featureId: string, attempt: number, success: boolean) {
  return emitInfo(EVENT_TYPES.FEATURE_RECOVERY, {
    featureId,
    attempt,
    success
  });
}

export function governanceBlock(featureId: string, reason: unknown, mode: unknown) {
  return emitWarn(EVENT_TYPES.GOVERNANCE_BLOCK, {
    featureId,
    reason,
    mode
  });
}

export function cascadeSuspended(featureId: string, pendingDependents: unknown, mode: unknown) {
  return emitWarn(EVENT_TYPES.CASCADE_SUSPENDED, {
    featureId,
    pendingDependents,
    mode
  });
}

export function recoveryBackoff(featureId: string, attempt: number, delayMs: number) {
  return emitInfo(EVENT_TYPES.RECOVERY_BACKOFF, {
    featureId,
    attempt,
    delayMs
  });
}

export function healthChange(featureId: string, from: unknown, to: unknown, isCritical: boolean) {
  const level = isCritical ? LEVELS.ERROR : LEVELS.INFO;
  return emit(EVENT_TYPES.HEALTH_CHANGE, level, {
    featureId,
    from,
    to,
    critical: isCritical
  });
}

export function lockViolation(operation: string, featureId: string) {
  return emitError(EVENT_TYPES.LOCK_VIOLATION, {
    operation,
    featureId
  });
}

export function unregisteredBlock(featureId: string) {
  return emitWarn(EVENT_TYPES.UNREGISTERED_BLOCK, { featureId });
}

// ═══════════════════════════════════════════════════════════════
// BUFFER MANAGEMENT
// ═══════════════════════════════════════════════════════════════

function _addToBuffer(event: Record<string, unknown>) {
  (event.meta as Record<string, unknown>).buffered = true;
  _buffer.push(event);
  _metrics.buffered++;

  if (_buffer.length > _maxBufferSize) {
    _buffer.shift();
    _metrics.dropped++;
  }
}

function _emitToEventBus(event: Record<string, unknown>) {
  const eb = _getEventBus() as Record<string, unknown> | null;
  if (eb && typeof eb['emit'] === 'function') {
    (eb['emit'] as (...args: unknown[]) => void)(`telemetry:${event.type}`, event);
  }
}

export function flush() {
  if (_buffer.length === 0) return { ok: true, flushed: 0 };

  const events = _buffer.slice();
  _buffer = [];
  _metrics.flushed += events.length;

  // Emitir batch para processamento via Ports
  const eb = _getEventBus() as Record<string, unknown> | null;
  if (eb && typeof eb['emit'] === 'function') {
    (eb['emit'] as (...args: unknown[]) => void)('telemetry:batch', { events, count: events.length, source: MODULE_ID, timestamp: Date.now() });
  }

  _log('debug', 'Buffer flushed', { count: events.length });
  return { ok: true, flushed: events.length, events };
}

export function getBuffer() {
  return _buffer.slice();
}

export function clearBuffer() {
  const count = _buffer.length;
  _buffer = [];
  return { ok: true, cleared: count };
}

// ═══════════════════════════════════════════════════════════════
// AUTO FLUSH
// ═══════════════════════════════════════════════════════════════

function _startAutoFlush() {
  if (_flushTimer) return;
  _flushTimer = setInterval(() => {
    if (_buffer.length > 0) {
      flush();
    }
  }, _config.flushInterval);
}

function _stopAutoFlush() {
  if (_flushTimer) {
    clearInterval(_flushTimer);
    _flushTimer = null;
  }
}

// ═══════════════════════════════════════════════════════════════
// SUBSCRIPTIONS
// ═══════════════════════════════════════════════════════════════

export function subscribe(callback: (...args: unknown[]) => unknown) {
  if (typeof callback !== 'function') return () => {};
  _subscribers.push(callback);
  return function unsubscribe() {
    const idx = _subscribers.indexOf(callback);
    if (idx >= 0) _subscribers.splice(idx, 1);
  };
}

// ═══════════════════════════════════════════════════════════════
// FILTERS
// ═══════════════════════════════════════════════════════════════

export function setFilter(eventType: string, enabled: boolean) {
  (_filters as Record<string, unknown>)[eventType] = enabled;
}

export function clearFilters() {
  _filters = {};
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export function configure(config: Record<string, unknown>) {
  Object.assign(_config, config);

  if (_config.autoFlush) {
    _startAutoFlush();
  } else {
    _stopAutoFlush();
  }

  return Object.assign({}, _config);
}

export function getConfig() {
  return Object.assign({}, _config);
}

export function enableEmitter() {
  _enabled = true;
  if (_config.autoFlush) _startAutoFlush();
}

export function disableEmitter() {
  _enabled = false;
  _stopAutoFlush();
}

export function isEnabled() {
  return _enabled;
}

// ═══════════════════════════════════════════════════════════════
// DIAGNOSTICS
// ═══════════════════════════════════════════════════════════════

export function getMetrics() {
  return Object.assign({}, _metrics);
}

export function getInfo() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: _enabled,
    p2Enterprise: true,
    portsInitialized: _portsInitialized,
    bufferSize: _buffer.length,
    subscriberCount: _subscribers.length,
    filterCount: Object.keys(_filters).length,
    config: Object.assign({}, _config),
    metrics: Object.assign({}, _metrics),
    timestamp: Date.now()
  };
}

export function healthCheck() {
  const checks = {
    enabled: _enabled,
    bufferNotFull: _buffer.length < _maxBufferSize * 0.9,
    noErrors: _metrics.errors < 10,
    recentFlush: _metrics.flushed > 0 || _buffer.length < 100
  };

  let passed = 0;
  let total = 0;
  for (const key in checks) {
    total++;
    if ((checks as Record<string, unknown>)[key]) passed++;
  }

  return {
    status: passed === total ? 'HEALTHY' : (passed > 0 ? 'DEGRADED' : 'UNHEALTHY'),
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: _Ports.isInitialized(),
    score: { passed, total },
    checks,
    metrics: Object.assign({}, _metrics),
    timestamp: Date.now()
  };
}

export function reset() {
  _stopAutoFlush();
  _buffer = [];
  _subscribers = [];
  _filters = {};
  _metrics = { emitted: 0, buffered: 0, flushed: 0, dropped: 0, errors: 0 };
  _enabled = true;
  if (_config.autoFlush) _startAutoFlush();
  _log('info', 'Telemetry emitter reset');
}

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════

// Auto-start flush if enabled
if (typeof window !== 'undefined' && _config.autoFlush) {
  _startAutoFlush();
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
  VERSION,
  MODULE_ID,
  EVENT_TYPES,
  LEVELS,
  // Ports
  injectPorts,
  getPorts,
  // Core emit
  emit,
  debug: emitDebug,
  warn: emitWarn,
  error: emitError,
  critical: emitCritical,
  // Convenience emitters
  featureRegistered,
  featureEnabled,
  featureDisabled,
  featureError,
  featureRecovery,
  governanceBlock,
  cascadeSuspended,
  recoveryBackoff,
  healthChange,
  lockViolation,
  unregisteredBlock,
  // Buffer
  flush,
  getBuffer,
  clearBuffer,
  // Subscriptions
  subscribe,
  // Filters
  setFilter,
  clearFilters,
  // Config
  configure,
  getConfig,
  enable: enableEmitter,
  disable: disableEmitter,
  isEnabled,
  // Diagnostics
  getMetrics,
  info: getInfo,
  healthCheck,
  reset
};
