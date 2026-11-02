// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.policies.navigation-access-policy
// PURPOSE: Navigation Access Policy - Controle e auditoria de navegação
// ───────────────────────────────────────────────────────────────
// @contract P2_ENFORCEMENT - Parte do roadmap P2 (enforcement gradual)
// @contract NR_FULL - Non-Regression Full-Context
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   NAV_ACCESS_TYPES — enum de tipos de navegação
//   NAV_SOURCES — enum de fontes autorizadas
//   init() — inicializa policy
//   recordNavigation() — registra uma navegação
//   isAuthorizedNavSource() — verifica se fonte é autorizada
//   getNavigationLog() — retorna log de navegações
//   getViolations() — retorna violações
//   getMetrics() — retorna métricas
//   healthCheck() — status do módulo
//   info() — informações do módulo
//
// EMITS (eventos):
//   navigation:policy:access — navegação registrada
//   navigation:policy:violation — violação detectada
//   navigation:policy:ui-direct — UI tentou navegar diretamente
// @changelog v1.1.0-P2-ENTERPRISE: Added lazy init on recordNavigation (NR-FULL roadmap P2)
// @changelog v1.0.0-P2-ENTERPRISE: Criação inicial (NR-FULL roadmap P2)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'core.policies.navigation-access-policy';

// ============================================================================
// NAVIGATION TYPES & SOURCES
// ============================================================================

export const NAV_ACCESS_TYPES = Object.freeze({
  SOFT: 'soft',           // SPA navigation (hash, pushState)
  HARD: 'hard',           // Full page reload
  BACK: 'back',           // History back
  FORWARD: 'forward',     // History forward
  EXTERNAL: 'external'    // External URL
});

export const NAV_SOURCES = Object.freeze({
  NAVIGATION_BROKER: 'NavigationBroker',     // Via NavigationBroker ✓
  HARD_NAV_SERVICE: 'HardNavService',        // Via HardNavService ✓
  ROUTER_GLOBAL: 'RouterGlobal',             // Via RouterGlobal ✓
  PORTS_ROUTER: 'Ports.router',              // Via Ports.get('router') ✓
  EVENT_INTENT: 'EventIntent',               // Via NAV_INTENTS event ✓
  UI_DIRECT: 'UI.direct',                    // UI chamando location diretamente ⚠
  WINDOW_LOCATION: 'window.location',        // Acesso direto a window.location ⚠
  UNKNOWN: 'unknown'                         // Origem desconhecida ✗
});

// Fontes autorizadas
const AUTHORIZED_NAV_SOURCES: Set<string> = new Set([
  NAV_SOURCES.NAVIGATION_BROKER,
  NAV_SOURCES.HARD_NAV_SERVICE,
  NAV_SOURCES.ROUTER_GLOBAL,
  NAV_SOURCES.PORTS_ROUTER,
  NAV_SOURCES.EVENT_INTENT
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
let _featureFlags = {
  warnOnUIDirectNav: true,
  warnOnWindowLocation: true,
  blockUnauthorized: false,
  telemetryEnabled: true
};

const _navigationLog: Record<string, unknown>[] = [];
const _violations: Record<string, unknown>[] = [];
const MAX_LOG_SIZE = 100;
const MAX_VIOLATIONS_SIZE = 50;

const _metrics: {
  totalNavigations: number;
  byType: Record<string, number>;
  bySource: Record<string, number>;
  violations: number;
  authorized: number;
  uiDirectAttempts: number;
  lastNavigationAt: number | null;
} = {
  totalNavigations: 0,
  byType: { soft: 0, hard: 0, back: 0, forward: 0, external: 0 },
  bySource: {},
  violations: 0,
  authorized: 0,
  uiDirectAttempts: 0,
  lastNavigationAt: null
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
  if (!_featureFlags.telemetryEnabled) return;
  const telemetry = _getPort('telemetry');
  if (telemetry && telemetry.track) {
    telemetry.track(eventName, { moduleId: MODULE_ID, ...payload });
  }
};

const _addToLog = (entry: Record<string, unknown>) => {
  _navigationLog.unshift(entry);
  if (_navigationLog.length > MAX_LOG_SIZE) _navigationLog.pop();
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

  if (options.featureFlags) {
    _featureFlags = { ..._featureFlags, ...(options.featureFlags as Record<string, unknown>) };
  }

  _initialized = true;
  _log('info', 'NavigationAccessPolicy initialized', { enforcementLevel: _enforcementLevel, featureFlags: _featureFlags });
  _emit('navigation:policy:init', { version: VERSION, enforcementLevel: _enforcementLevel });

  return { ok: true, version: VERSION };
}

/**
 * Verifica se uma fonte de navegação é autorizada
 * @param {string} source - Fonte da navegação
 * @returns {boolean}
 */
export function isAuthorizedNavSource(source: string) {
  return AUTHORIZED_NAV_SOURCES.has(source);
}

/**
 * Registra uma navegação
 * @param {Object} params - Parâmetros da navegação
 * @returns {Object}
 */
export function recordNavigation(params: { scope?: string; action?: string; data?: Record<string, unknown>; type?: string; source?: string; target?: string | null; reason?: string | null; caller?: string | null; moduleId?: string | null; isUIComponent?: boolean } = {}) {
  // Lazy init: inicializa automaticamente se necessário
  if (!_initialized) init();

  const {
    type = NAV_ACCESS_TYPES.SOFT,
    source = NAV_SOURCES.UNKNOWN,
    target = null,
    reason = null,
    caller = null,
    moduleId = null,
    isUIComponent = false
  } = params;

  _metrics.totalNavigations++;
  _metrics.byType[type] = (_metrics.byType[type] || 0) + 1;
  _metrics.bySource[source] = (_metrics.bySource[source] || 0) + 1;
  _metrics.lastNavigationAt = Date.now();

  const entry = {
    id: `nav-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    type,
    source,
    target,
    reason,
    caller,
    moduleId,
    isUIComponent,
    timestamp: Date.now(),
    authorized: isAuthorizedNavSource(source)
  };

  _addToLog(entry);

  // Caso 1: Navegação autorizada
  if (entry.authorized) {
    _metrics.authorized++;
    _emit('navigation:policy:access', entry);
    return { ok: true, authorized: true, entry };
  }

  // Caso 2: UI tentando navegar diretamente
  if (isUIComponent && (source === NAV_SOURCES.UI_DIRECT || source === NAV_SOURCES.WINDOW_LOCATION)) {
    _metrics.uiDirectAttempts++;

    const violation = {
      ...entry,
      violationType: 'UI_DIRECT_NAVIGATION',
      message: `Componente UI tentou navegar diretamente via ${source}. Use NavigationBroker.navigate() ou emita NAV_INTENTS.NAVIGATE`
    };

    _addViolation(violation);
    _metrics.violations++;

    if (_featureFlags.warnOnUIDirectNav && _enforcementLevel !== 'silent') {
      _log('warn', `[UI-DIRECT-NAV] ${violation.message}`, { target, caller, moduleId });
      _emit('navigation:policy:ui-direct', violation);
    }

    _track('navigation:violation:ui-direct', violation);

    if (_featureFlags.blockUnauthorized) {
      return { ok: false, authorized: false, blocked: true, violation };
    }

    return { ok: true, authorized: false, violation };
  }

  // Caso 3: Outra violação
  _metrics.violations++;

  const violation = {
    ...entry,
    violationType: 'UNAUTHORIZED_SOURCE',
    enforcementLevel: _enforcementLevel,
    message: `Navegação via fonte não autorizada: ${source}. Use NavigationBroker ou HardNavService.`
  };

  _addViolation(violation);
  _emit('navigation:policy:violation', violation);
  _track('navigation:violation', violation);

  if (_enforcementLevel === 'warn') {
    _log('warn', `[VIOLATION] ${violation.message}`, { target, caller, moduleId });
  } else if (_enforcementLevel === 'block' || _featureFlags.blockUnauthorized) {
    _log('error', `[BLOCKED] ${violation.message}`, { target, caller, moduleId });
    return { ok: false, authorized: false, blocked: true, violation };
  }

  return { ok: true, authorized: false, violation };
}

/**
 * Configura feature flags
 * @param {Object} flags - Flags a serem atualizadas
 */
export function setFeatureFlags(flags: Record<string, unknown>) {
  const previous = { ..._featureFlags };
  _featureFlags = { ..._featureFlags, ...flags };
  _log('info', 'Feature flags updated', { previous, current: _featureFlags });
  _emit('navigation:policy:flags-changed', { previous, current: _featureFlags });
  return { ok: true, flags: _featureFlags };
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
    _emit('navigation:policy:enforcement-changed', { previous, current: level });
    return { ok: true, level };
  }
  return { ok: false, error: 'Invalid level' };
}

/**
 * Retorna log de navegações
 * @param {number} limit - Limite de entradas
 * @returns {Array}
 */
export function getNavigationLog(limit = 20) {
  return _navigationLog.slice(0, limit);
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
  const authRate = _metrics.totalNavigations > 0
    ? (_metrics.authorized / _metrics.totalNavigations * 100).toFixed(1)
    : '100.0';

  return {
    ..._metrics,
    authorizationRate: `${authRate}%`,
    violationRate: _metrics.totalNavigations > 0
      ? `${(_metrics.violations / _metrics.totalNavigations * 100).toFixed(1)}%`
      : '0.0%',
    logSize: _navigationLog.length,
    violationsLogSize: _violations.length
  };
}

/**
 * Reseta métricas (para testes)
 */
export function resetMetrics() {
  _metrics.totalNavigations = 0;
  _metrics.byType = { soft: 0, hard: 0, back: 0, forward: 0, external: 0 };
  _metrics.bySource = {};
  _metrics.violations = 0;
  _metrics.authorized = 0;
  _metrics.uiDirectAttempts = 0;
  _metrics.lastNavigationAt = null;
  _navigationLog.length = 0;
  _violations.length = 0;
  return { ok: true };
}

/**
 * Health check
 * @returns {Object}
 */
export function healthCheck() {
  const violationRate = _metrics.totalNavigations > 0
    ? _metrics.violations / _metrics.totalNavigations
    : 0;

  const checks = {
    initialized: _initialized,
    hasEventBus: !!_getPort('eventBus'),
    hasTelemetry: !!_getPort('telemetry'),
    lowViolationRate: violationRate < 0.1,
    lowUIDirectRate: _metrics.totalNavigations > 0 ? (_metrics.uiDirectAttempts / _metrics.totalNavigations) < 0.05 : true,
    portsInitialized: Ports.isInitialized()
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed >= total - 1 ? 'HEALTHY' : passed >= total - 2 ? 'DEGRADED' : 'UNHEALTHY',
    score: `${passed}/${total}`,
    version: VERSION,
    moduleId: MODULE_ID,
    enforcementLevel: _enforcementLevel,
    featureFlags: _featureFlags,
    checks,
    metrics: getMetrics()
  };
}

/**
 * Info do módulo
 * @returns {Object}
 */
export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: _initialized,
    enforcementLevel: _enforcementLevel,
    featureFlags: _featureFlags,
    authorizedSources: Array.from(AUTHORIZED_NAV_SOURCES),
    metrics: getMetrics(),
    portsInitialized: Ports.isInitialized()
  };
}

export default {
  VERSION,
  MODULE_ID,
  NAV_ACCESS_TYPES,
  NAV_SOURCES,
  init,
  isAuthorizedNavSource,
  recordNavigation,
  setFeatureFlags,
  setEnforcementLevel,
  getNavigationLog,
  getViolations,
  getMetrics,
  resetMetrics,
  healthCheck,
  info,
  injectPorts,
  getPorts
};
