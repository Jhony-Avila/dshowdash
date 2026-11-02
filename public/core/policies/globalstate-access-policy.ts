// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.policies.globalstate-access-policy
// PURPOSE: GlobalState Access Policy - Controle e auditoria de acessos
// ───────────────────────────────────────────────────────────────
// @contract P2_ENFORCEMENT - Parte do roadmap P2 (enforcement gradual)
// @contract STRICT_MODE - Em strict mode, enforcement = 'block'
// @contract NR_FULL - Non-Regression Full-Context
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   isStrict from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ACCESS_TYPES — enum de tipos de acesso
//   ACCESS_SOURCES — enum de fontes autorizadas
//   init() — inicializa policy
//   recordAccess() — registra um acesso ao GlobalState
//   isAuthorizedSource() — verifica se fonte é autorizada
//   getAccessLog() — retorna log de acessos
//   getMetrics() — retorna métricas
//   getViolations() — retorna violações
//   healthCheck() — status do módulo
//   info() — informações do módulo
//   injectPorts() — injeção de ports
//   getPorts() — snapshot de ports
//
// EMITS (eventos):
//   globalstate:access — acesso registrado
//   globalstate:violation — violação detectada
//
// @changelog v1.3.0-STRICT-MODE: Integrado com strict-mode.js - enforcement auto 'block' em strict
// @changelog v1.2.0-P2-ENTERPRISE: Upgraded to P2-ENTERPRISE standard
// @changelog v1.1.0-P1-ENTERPRISE: Added lazy init on recordAccess
// @changelog v1.0.0-P1-ENTERPRISE: Criação inicial
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

export const VERSION = '1.3.0-STRICT-MODE';
export const MODULE_ID = 'core.policies.globalstate-access-policy';

// ============================================================================
// ACCESS TYPES & SOURCES
// ============================================================================

export const ACCESS_TYPES = Object.freeze({
  GET: 'get',
  SET: 'set',
  SUBSCRIBE: 'subscribe',
  DISPATCH: 'dispatch'
});

export const ACCESS_SOURCES = Object.freeze({
  PORTS: 'ports',                      // Via Ports.get('globalState') ✓
  CORE_WINDOW_ADAPTER: 'core.windowAdapter', // Via Core.windowAdapter.get() ✓
  FACADE: 'facade',                    // Via GlobalStateFacade ✓
  ADAPTER_AUTHORIZED: 'adapter',       // Via adapter autorizado ✓
  DIAGNOSTIC: 'diagnostic',            // Via GlobalsAdapter (diagnóstico) ✓
  WINDOW_DIRECT: 'window.direct',      // Via window.GlobalState ⚠ (legacy)
  UNKNOWN: 'unknown'                   // Origem desconhecida ✗
});

// Fontes autorizadas (não geram warning)
const AUTHORIZED_SOURCES: Set<string> = new Set([
  ACCESS_SOURCES.PORTS,
  ACCESS_SOURCES.CORE_WINDOW_ADAPTER,
  ACCESS_SOURCES.FACADE,
  ACCESS_SOURCES.ADAPTER_AUTHORIZED,
  ACCESS_SOURCES.DIAGNOSTIC
]);

// ============================================================================
// PORTS SETUP
// ============================================================================

const Ports = createCorePorts({ moduleId: MODULE_ID });

const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

// ============================================================================
// STATE
// ============================================================================

let _initialized = false;
let _enforcementLevel = 'warn'; // 'silent' | 'warn' | 'block'
const _accessLog: Record<string, unknown>[] = [];
const _violations: Record<string, unknown>[] = [];
const MAX_LOG_SIZE = 100;
const MAX_VIOLATIONS_SIZE = 50;

const _metrics: {
  totalAccesses: number;
  byType: Record<string, number>;
  bySource: Record<string, number>;
  violations: number;
  authorized: number;
  lastAccessAt: number | null;
} = {
  totalAccesses: 0,
  byType: { get: 0, set: 0, subscribe: 0, dispatch: 0 },
  bySource: {},
  violations: 0,
  authorized: 0,
  lastAccessAt: null
};

// ============================================================================
// HELPERS
// ============================================================================

const _log = (level: string, message: string, data: Record<string, unknown> = {}) => {
  const logger = _getPort('logger');
  if (logger && logger[level]) {
    logger[level](`[${MODULE_ID}] ${message}`, data);
  }
};

const _emit = (eventName: string, data: Record<string, unknown> = {}) => {
  const eb = _getPort('eventBus');
  if (eb && eb.emit) {
    eb.emit(eventName, { source: MODULE_ID, timestamp: Date.now(), ...data });
  }
};

const _track = (eventName: string, payload: Record<string, unknown>) => {
  const telemetry = _getPort('telemetry');
  if (telemetry && telemetry.track) {
    telemetry.track(eventName, { moduleId: MODULE_ID, ...payload });
  }
};

const _addToLog = (entry: Record<string, unknown>) => {
  _accessLog.unshift(entry);
  if (_accessLog.length > MAX_LOG_SIZE) _accessLog.pop();
};

const _addViolation = (violation: Record<string, unknown>) => {
  _violations.unshift(violation);
  if (_violations.length > MAX_VIOLATIONS_SIZE) _violations.pop();
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Inicializa a policy
 * @param {Object} options - Opções de configuração
 * @returns {Object}
 */
export function init(options: Record<string, unknown> = {}) {
  if (_initialized) return { ok: true, alreadyInitialized: true };

  _initPorts();

  if (options.enforcementLevel) {
    _enforcementLevel = options.enforcementLevel as string;
  }

  _initialized = true;
  _log('info', 'GlobalStateAccessPolicy initialized', { enforcementLevel: _enforcementLevel });
  _emit('globalstate:policy:init', { version: VERSION, enforcementLevel: _enforcementLevel });

  return { ok: true, version: VERSION };
}

/**
 * Verifica se uma fonte é autorizada
 * @param {string} source - Fonte do acesso
 * @returns {boolean}
 */
export function isAuthorizedSource(source: string) {
  return AUTHORIZED_SOURCES.has(source);
}

/**
 * Registra um acesso ao GlobalState
 * @param {Object} params - Parâmetros do acesso
 * @returns {Object}
 */
export function recordAccess(params: { scope?: string; action?: string; data?: Record<string, unknown>; type?: string; source?: string; key?: string | null; caller?: string | null; moduleId?: string | null } = {}) {
  // Lazy init: inicializa automaticamente se necessário
  if (!_initialized) init();

  const {
    type = ACCESS_TYPES.GET,
    source = ACCESS_SOURCES.UNKNOWN,
    key = null,
    caller = null,
    moduleId = null
  } = params;

  _metrics.totalAccesses++;
  _metrics.byType[type] = (_metrics.byType[type] || 0) + 1;
  _metrics.bySource[source] = (_metrics.bySource[source] || 0) + 1;
  _metrics.lastAccessAt = Date.now();

  const entry = {
    id: `access-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    type,
    source,
    key,
    caller,
    moduleId,
    timestamp: Date.now(),
    authorized: isAuthorizedSource(source)
  };

  _addToLog(entry);

  if (entry.authorized) {
    _metrics.authorized++;
    _emit('globalstate:access', entry);
    return { ok: true, authorized: true, entry };
  }

  // Violação detectada
  _metrics.violations++;

  // v1.3.0: Em strict mode, enforcement é sempre 'block'
  const strictMode = isStrict();
  const effectiveEnforcement = strictMode ? 'block' : _enforcementLevel;

  const violation = {
    ...entry,
    enforcementLevel: effectiveEnforcement,
    strictMode,
    message: `Acesso direto a GlobalState via ${source} (use Ports ou Core.windowAdapter)`
  };

  _addViolation(violation);
  _emit('globalstate:violation', violation);
  _track('globalstate:violation', violation);

  if (effectiveEnforcement === 'warn') {
    _log('warn', `[VIOLATION] ${violation.message}`, { key, caller, moduleId });
  } else if (effectiveEnforcement === 'block') {
    _log('error', `[BLOCKED${strictMode ? ' STRICT' : ''}] ${violation.message}`, { key, caller, moduleId, strictMode });
    return { ok: false, authorized: false, blocked: true, strictMode, violation };
  }

  return { ok: true, authorized: false, violation };
}

/**
 * Configura nível de enforcement
 * @param {string} level - 'silent' | 'warn' | 'block'
 */
export function setEnforcementLevel(level: string) {
  if (['silent', 'warn', 'block'].includes(level)) {
    const previous = _enforcementLevel;
    _enforcementLevel = level;
    _log('info', `Enforcement level changed: ${previous} → ${level}`);
    _emit('globalstate:policy:enforcement-changed', { previous, current: level });
    return { ok: true, level };
  }
  return { ok: false, error: 'Invalid level' };
}

/**
 * Retorna log de acessos
 * @param {number} limit - Limite de entradas
 * @returns {Array}
 */
export function getAccessLog(limit = 20) {
  return _accessLog.slice(0, limit);
}

/**
 * Retorna violações
 * @param {number} limit - Limite de entradas
 * @returns {Array}
 */
export function getViolations(limit = 20) {
  return _violations.slice(0, limit);
}

/**
 * Retorna métricas
 * @returns {Object}
 */
export function getMetrics() {
  const authRate = _metrics.totalAccesses > 0
    ? (_metrics.authorized / _metrics.totalAccesses * 100).toFixed(1)
    : '100.0';

  return {
    ..._metrics,
    authorizationRate: `${authRate}%`,
    violationRate: _metrics.totalAccesses > 0
      ? `${(_metrics.violations / _metrics.totalAccesses * 100).toFixed(1)}%`
      : '0.0%',
    logSize: _accessLog.length,
    violationsLogSize: _violations.length
  };
}

/**
 * Reseta métricas (para testes)
 */
export function resetMetrics() {
  _metrics.totalAccesses = 0;
  _metrics.byType = { get: 0, set: 0, subscribe: 0, dispatch: 0 };
  _metrics.bySource = {};
  _metrics.violations = 0;
  _metrics.authorized = 0;
  _metrics.lastAccessAt = null;
  _accessLog.length = 0;
  _violations.length = 0;
  return { ok: true };
}

/**
 * Health check
 * @returns {Object}
 */
export function healthCheck() {
  const strictMode = isStrict();
  const violationRate = _metrics.totalAccesses > 0
    ? _metrics.violations / _metrics.totalAccesses
    : 0;

  const checks = {
    initialized: _initialized,
    hasEventBus: !!_getPort('eventBus'),
    hasTelemetry: !!_getPort('telemetry'),
    lowViolationRate: violationRate < 0.1,
    portsInitialized: Ports.isInitialized(),
    strictModeCompliant: !strictMode || violationRate === 0
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed >= total - 1 ? 'HEALTHY' : passed >= total - 2 ? 'DEGRADED' : 'UNHEALTHY',
    score: `${passed}/${total}`,
    version: VERSION,
    moduleId: MODULE_ID,
    enforcementLevel: _enforcementLevel,
    effectiveEnforcement: strictMode ? 'block' : _enforcementLevel,
    strictMode,
    checks,
    metrics: getMetrics()
  };
}

/**
 * Info do módulo
 * @returns {Object}
 */
export function info() {
  const strictMode = isStrict();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: _initialized,
    enforcementLevel: _enforcementLevel,
    effectiveEnforcement: strictMode ? 'block' : _enforcementLevel,
    strictMode,
    authorizedSources: Array.from(AUTHORIZED_SOURCES),
    metrics: getMetrics(),
    portsInitialized: Ports.isInitialized()
  };
}

export default {
  VERSION,
  MODULE_ID,
  ACCESS_TYPES,
  ACCESS_SOURCES,
  init,
  isAuthorizedSource,
  recordAccess,
  setEnforcementLevel,
  getAccessLog,
  getViolations,
  getMetrics,
  resetMetrics,
  healthCheck,
  info,
  injectPorts,
  getPorts
};
