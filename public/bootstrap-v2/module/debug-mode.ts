// Debug Mode Unificado - #20
// @version 1.3.0-HEALTH-CONTRACT
// @changelog v1.2.0-DOMAIN-PURE: applyToConfig() via windowAdapter → window.BootstrapV2 fallback (cadeia AAA)
// @changelog v1.1.0-PORTSFACTORY - applyToLogger migrado para PortsFactory (elimina window.Logger)
// @description Controle unificado de todas as flags de debug
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.0)
// ═══════════════════════════════════════════════════════════════
// RESOLVES BootstrapV2 via _resolveBootstrap():
//   1. windowAdapter.get('BootstrapV2') — adapter layer
//   2. window.BootstrapV2               — último fallback
// RESOLVES Logger via PortsFactory (_Ports.get('logger'))
// BROWSER APIs: window.__debug (exposeGlobalHelpers), console, performance
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { createHealthResult, HEALTH_STATUS } from '../contracts/health-contract.ts';

export const VERSION = '1.2.0-DOMAIN-PURE';
export const MODULE_ID = 'debug-mode';

var _Ports = createCorePorts({ moduleId: MODULE_ID });

interface DebugState {
  enabled: boolean;
  level: string;
  modules: Record<string, boolean>;
  startedAt: number | null;
}

let _debugState: DebugState = {
  enabled: false,
  level: 'info',
  modules: {},
  startedAt: null
};

const DEBUG_LEVELS: Record<string, number> = {
  OFF: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  DEBUG: 4,
  TRACE: 5
};

const CONTROLLED_FLAGS = [
  'VERBOSE_LOGGING',
  'TELEMETRY_DEBUG',
  'MEMORY_METRICS',
  'PROGRESS_EVENTS'
];

// v1.2.0: Resolver BootstrapV2 via windowAdapter → window fallback
function _resolveBootstrap() {
  if (typeof window === 'undefined') return null;
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var resolved = window.Core.windowAdapter.get('BootstrapV2');
    if (resolved) return resolved;
  }
  return (window as any).BootstrapV2 || null;
}

// ============================================================================
// CORE API
// ============================================================================

export function enable(options?: { level?: string; exposeGlobal?: boolean }) {
  if (options === undefined) options = {};

  _debugState.enabled = true;
  _debugState.level = options.level || 'debug';
  _debugState.startedAt = Date.now();

  applyToConfig(true);
  applyToLogger(true);

  if (options.exposeGlobal !== false) {
    exposeGlobalHelpers();
  }

  log('info', 'Debug mode ENABLED', { level: _debugState.level, options });

  return getState();
}

export function disable() {
  // @ts-expect-error strict migration — TS18047
  log('info', 'Debug mode DISABLED', { duration: Date.now() - _debugState.startedAt });

  _debugState.enabled = false;
  _debugState.startedAt = null;

  applyToConfig(false);
  applyToLogger(false);
  removeGlobalHelpers();

  return getState();
}

export function toggle() {
  return _debugState.enabled ? disable() : enable();
}

export function isEnabled() {
  return _debugState.enabled === true;
}

export function getState() {
  return {
    enabled: _debugState.enabled,
    level: _debugState.level,
    levelValue: DEBUG_LEVELS[_debugState.level.toUpperCase()] || 3,
    startedAt: _debugState.startedAt,
    duration: _debugState.startedAt ? Date.now() - _debugState.startedAt : 0,
    modules: { ..._debugState.modules },
    controlledFlags: CONTROLLED_FLAGS
  };
}

// ============================================================================
// MODULE-SPECIFIC DEBUG
// ============================================================================

export function enableModule(moduleName: string) {
  _debugState.modules[moduleName] = true;
  log('debug', 'Module debug enabled: ' + moduleName);
  return true;
}

export function disableModule(moduleName: string) {
  _debugState.modules[moduleName] = false;
  log('debug', 'Module debug disabled: ' + moduleName);
  return true;
}

export function isModuleEnabled(moduleName: string) {
  if (!_debugState.enabled) return false;
  if (_debugState.modules[moduleName] === false) return false;
  return true;
}

// ============================================================================
// LOGGING HELPERS
// ============================================================================

export function log(level: string, message: string, data?: unknown) {
  if (!_debugState.enabled) return;

  const levelValue = DEBUG_LEVELS[level.toUpperCase()] || 3;
  const currentLevel = DEBUG_LEVELS[_debugState.level.toUpperCase()] || 3;

  if (levelValue > currentLevel) return;

  const prefix = '[DEBUG][' + level.toUpperCase() + ']';

  const con = console as unknown as Record<string, Function>;
  if (data !== undefined) {
    con[level] ? con[level](prefix, message, data) : console.log(prefix, message, data);
  } else {
    con[level] ? con[level](prefix, message) : console.log(prefix, message);
  }
}

export function measure<T>(name: string, fn: () => T): T {
  if (!_debugState.enabled) return fn();

  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;

  log('debug', 'MEASURE [' + name + ']: ' + duration.toFixed(2) + 'ms');

  return result;
}

export async function measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  if (!_debugState.enabled) return fn();

  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  log('debug', 'MEASURE [' + name + ']: ' + duration.toFixed(2) + 'ms');

  return result;
}

// ============================================================================
// INTEGRAÇÃO COM CONFIG E LOGGER
// ============================================================================

function applyToConfig(enabled: boolean) {
  try {
    var bootstrap = _resolveBootstrap();
    if (bootstrap && bootstrap._instance && bootstrap._instance.config) {
      CONTROLLED_FLAGS.forEach(function(flag) {
        bootstrap._instance.config.features[flag] = enabled;
      });
    }
  } catch (e) {
    // Silently fail
  }
}

function applyToLogger(enabled: boolean) {
  try {
    var logger = _Ports.get('logger');
    if (logger) {
      if (enabled) {
        if (typeof logger.enableLevel === 'function') { logger.enableLevel('debug'); logger.enableLevel('trace'); }
      } else {
        if (typeof logger.disableLevel === 'function') { logger.disableLevel('debug'); logger.disableLevel('trace'); }
      }
    }
  } catch (e) {
    // Silently fail
  }
}

function exposeGlobalHelpers() {
  if (typeof window === 'undefined') return;

  (window as any).__debug = {
    log: log,
    measure: measure,
    measureAsync: measureAsync,
    state: getState,
    enable: enable,
    disable: disable,
    toggle: toggle,
    enableModule: enableModule,
    disableModule: disableModule
  };
}

function removeGlobalHelpers() {
  if (typeof window === 'undefined') return;
  delete (window as any).__debug;
}

// ============================================================================
// DIAGNÓSTICOS
// ============================================================================

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    state: getState(),
    levels: Object.keys(DEBUG_LEVELS),
    controlledFlags: CONTROLLED_FLAGS,
    portsInitialized: _Ports.isInitialized(),
    improvements: ['#20-UnifiedDebugMode']
  };
}

export function healthCheck() {
  return createHealthResult({
    status: HEALTH_STATUS.HEALTHY,
    moduleId: MODULE_ID,
    version: VERSION,
    details: {
      enabled: _debugState.enabled,
      level: _debugState.level,
      portsInitialized: _Ports.isInitialized()
    }
  });
}

export function injectPorts(p: Record<string, unknown>) { return _Ports.inject(p); }
export function getPorts() { return _Ports.snapshot(); }

export default {
  VERSION,
  MODULE_ID,
  DEBUG_LEVELS,
  enable,
  disable,
  toggle,
  isEnabled,
  getState,
  enableModule,
  disableModule,
  isModuleEnabled,
  log,
  measure,
  measureAsync,
  info,
  healthCheck,
  injectPorts,
  getPorts
};
