// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/feature-flags
// PURPOSE: Sistema de feature flags para controle de funcionalidades do Header
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
// PROVIDES:
//   init(customFlags) — inicializa com flags customizadas
//   isEnabled(flag) / isDisabled(flag) — verifica estado de flag
//   setFlag(name, value) — altera valor de flag
//   getFlag(name) — retorna valor de flag
//   getAll() — retorna todas as flags
//   getEnabled() / getDisabled() — lista flags por estado
//   reset() — restaura flags para defaults
//   healthCheck() — status de saude do modulo
//   info() — informacoes completas do modulo
//   injectPorts(p) / getPorts() — gestao de ports
// EVENTS EMITTED:
//   header:feature-flag:changed — quando flag e alterada
// ═══════════════════════════════════════════════════════════════
// Header - Feature Flags System
// @version 1.2.0-ES6
// @changelog v1.2.0-ES6 - Task 10.1 B07: var → const/let
// @changelog v1.1.0 - Adicionado suporte a DISABLED status nos healthChecks
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.2.0-ES6';
export const MODULE_ID = 'header/core/feature-flags';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _initialized = false;
let _flags = {};

const _metrics = {
  initCalls: 0,
  flagChecks: 0,
  flagChanges: 0
};

const DEFAULT_FLAGS = {
  routerIntegration: true,
  globalStateIntegration: true,
  eventBusIntegration: true,
  appShellIntegration: true,
  telemetryEnabled: true,
  circuitBreakerEnabled: true,
  pollingEnabled: true,
  accessibilityEnabled: true,
  selfHealingEnabled: true,
  gracefulDegradationEnabled: true,
  pluginSystemEnabled: false,
  lazyLoadingEnabled: true,
  serviceWorkerEnabled: false,
  configValidation: true
};

function _log(level: string, msg: string, data?: unknown) {
  const logger = _getPort('logger');
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === 'error' && logger.error) logger.error(prefix, msg, data || '');
  else if (level === 'warn' && logger.warn) logger.warn(prefix, msg, data || '');
  else if (level === 'info' && logger.info) logger.info(prefix, msg, data || '');
}

export function init(customFlags?: Record<string, boolean>) {
  _metrics.initCalls++;
  if (_initialized) {
    return;
  }
  _initPorts();
  _flags = Object.assign({}, DEFAULT_FLAGS, customFlags || {});
  _initialized = true;
  _log('info', `FeatureFlags inicializado com ${Object.keys(_flags).length} flags`);
}

export function isEnabled(flagName: string) {
  _metrics.flagChecks++;
  if (!_initialized) {
    init();
  }
  return (_flags as Record<string,unknown>)[flagName as string] === true;
}

export function isDisabled(flagName: string) {
  return !isEnabled(flagName);
}

export function setFlag(flagName: string, value: unknown) {
  if (!_initialized) init();
  const oldValue = (_flags as Record<string,unknown>)[flagName as string];
  (_flags as Record<string,unknown>)[flagName as string] = !!value;
  if (oldValue !== (_flags as Record<string,unknown>)[flagName as string]) {
    _metrics.flagChanges++;
    _log('info', `Flag alterada: ${flagName} = ${(_flags as Record<string,unknown>)[flagName as string]}`);
    const eventBus = _getPort('eventBus');
    if (eventBus && eventBus.emit) {
      eventBus.emit('header:feature-flag:changed', { flag: flagName, value: (_flags as Record<string,unknown>)[flagName as string], oldValue });
    }
  }
}

export function getFlag(flagName: string) {
  if (!_initialized) init();
  return (_flags as Record<string,unknown>)[flagName as string];
}

export function getAll() {
  if (!_initialized) init();
  return Object.assign({}, _flags);
}

export function getEnabled() {
  if (!_initialized) init();
  // @ts-expect-error strict migration — TS7034
  const enabled = [];
  Object.keys(_flags).forEach(key => {
    if ((_flags as Record<string,unknown>)[key] === true) enabled.push(key);
  });
  // @ts-expect-error strict migration — TS7005
  return enabled;
}

export function getDisabled() {
  if (!_initialized) init();
  // @ts-expect-error strict migration — TS7034
  const disabled = [];
  Object.keys(_flags).forEach(key => {
    if ((_flags as Record<string,unknown>)[key] === false) disabled.push(key);
  });
  // @ts-expect-error strict migration — TS7005
  return disabled;
}

export function reset() {
  _flags = Object.assign({}, DEFAULT_FLAGS);
  _log('info', 'FeatureFlags resetado para defaults');
}

export function getMetrics() {
  return Object.assign({}, _metrics);
}

export function healthCheck() {
  const checks = {
    initialized: _initialized,
    hasFlags: Object.keys(_flags).length > 0,
    portsInitialized: Ports.isInitialized(),
    storageAccessible: true
  };
  const issues = [];
  if (!_initialized) issues.push('Nao inicializado');
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    issues,
    portsInitialized: Ports.isInitialized(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: new Date().toISOString()
  };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: _initialized,
    flags: getAll(),
    enabledCount: getEnabled().length,
    disabledCount: getDisabled().length,
    metrics: getMetrics(),
    portsInitialized: Ports.isInitialized(),
    healthCheck: healthCheck()
  };
}

export default {
  VERSION,
  MODULE_ID,
  init,
  isEnabled,
  isDisabled,
  setFlag,
  getFlag,
  getAll,
  getEnabled,
  getDisabled,
  reset,
  getMetrics,
  healthCheck,
  info
};
