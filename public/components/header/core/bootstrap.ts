// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/bootstrap
// PURPOSE: Bootstrap orchestrator for Header initialization and integrations
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   createLogger from /assets/js/core/logger-global/index.js
//   * as Integrations from ./header-integrations.js
//   * as FeatureFlags from ./feature-flags.js
// PROVIDES:
//   bootstrap(headerInstance, userConfig) — full bootstrap with integrations
//   quickBootstrap(headerInstance) — bootstrap with default config
//   shutdown() — shutdown header and cleanup integrations
//   isBootstrapped() — check bootstrap status
//   getHeaderInstance() — get current header instance
//   getIntegrations() — get integrations module
//   healthCheck() — return health status
//   info() — return module info
//   injectPorts(p) — inject dependency ports
//   getPorts() — get ports snapshot
// EMITS (eventos):
//   header:bootstrap:complete — when bootstrap finishes successfully
// ═══════════════════════════════════════════════════════════════
// Header - Bootstrap
// @version 1.2.0-ES6
// @changelog v1.2.0-ES6 - Task 10.1 B09: var → const/let
// @changelog v1.1.0-LOGGER - Fallback de _log migrado para createLogger()
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { createLogger } from '/assets/js/core/logger-global/index.js';
import * as Integrations from './header-integrations.js';
import * as FeatureFlags from './feature-flags.js';

export const VERSION = '1.2.0-ES6';
export const MODULE_ID = 'header/core/bootstrap';

const Ports = createCorePorts({ moduleId: MODULE_ID });
const _fallbackLogger = createLogger(MODULE_ID);

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _log = function(level: string, ...args: any[]) {const logger = _getPort('logger'); if (!logger) { const msg = args.join(' '); if (level === 'error') { _fallbackLogger.error(msg); return; } if (level === 'warn') { _fallbackLogger.warn(msg); return; } if (level === 'info') { _fallbackLogger.info(msg); return; } _fallbackLogger.debug(msg); return; } const prefix = `[${MODULE_ID}]`; if (level === 'error' && logger.error) { logger.error(prefix, args.join(' ')); return; } if (level === 'warn' && logger.warn) { logger.warn(prefix, args.join(' ')); return; } if (level === 'info' && logger.info) { logger.info(prefix, args.join(' ')); return; } if (logger.debug) logger.debug(prefix, args.join(' ')); };

let _bootstrapped = false;
let _headerInstance: unknown = null;
let _startTime: unknown = null;

const DEFAULT_CONFIG = {
  features: {
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
    pluginSystemEnabled: true,
    lazyLoadingEnabled: false,
    serviceWorkerEnabled: false
  },
  api: {
    timeout: 6000,
    retries: 1
  },
  cache: {
    enabled: true,
    defaultTTL: 60000
  },
  selfHealing: {
    checkInterval: 30000,
    maxRetries: 3
  }
};

function bootstrap(headerInstance: Record<string,unknown>, userConfig: Record<string,unknown>) {
  if (_bootstrapped) {
    _log('warn', 'Header ja inicializado via bootstrap');
    return Promise.resolve(_headerInstance);
  }

  _initPorts();
  _startTime = performance.now();
  _headerInstance = headerInstance;

  const config = _mergeConfig(DEFAULT_CONFIG, userConfig || {});

  _log('info', 'Iniciando bootstrap do Header...');

  return Integrations.init(headerInstance, config).then(() => {
    Integrations.start();

    _bootstrapped = true;
    // @ts-expect-error TS migration - TS2363
    const bootTime = performance.now() - _startTime;

    _log('info', `Bootstrap concluido em ${bootTime.toFixed(0)}ms`);

    const eventBus = _getPort('eventBus');
    if (eventBus && eventBus.emit) {
      eventBus.emit('header:bootstrap:complete', {
        version: VERSION,
        bootTime,
        modules: Integrations.getAllModules().length,
        timestamp: Date.now()
      });
    }

    return headerInstance;
  }).catch(error => {
    _log('error', 'Bootstrap falhou:', error.message);
    throw error;
  });
}

function _mergeConfig(defaults: unknown, user: Record<string,unknown>) {
  const result = {};
  // @ts-expect-error strict migration — TS2769
  Object.keys(defaults).forEach(key => {
    if (typeof (defaults as Record<string,unknown>)[key] === 'object' && (defaults as Record<string,unknown>)[key] !== null && !Array.isArray((defaults as Record<string,unknown>)[key])) {
      // @ts-expect-error TS migration - TS2345
      (result as Record<string,unknown>)[key] = _mergeConfig((defaults as Record<string,unknown>)[key], user[key] || {});
    } else {
      (result as Record<string,unknown>)[key] = user[key] !== undefined ? user[key] : (defaults as Record<string,unknown>)[key];
    }
  });
  Object.keys(user).forEach(key => {
    if ((result as Record<string,unknown>)[key] === undefined) {
      (result as Record<string,unknown>)[key] = user[key];
    }
  });
  return result;
}

function quickBootstrap(headerInstance: Record<string,unknown>) {
  return bootstrap(headerInstance, {});
}

function shutdown() {
  if (!_bootstrapped) {
    _log('warn', 'Header nao foi inicializado via bootstrap');
    return;
  }

  _log('info', 'Desligando Header...');
  Integrations.cleanup();
  _bootstrapped = false;
  _headerInstance = null;
  _log('info', 'Header desligado');
}

function isBootstrapped() {
  return _bootstrapped;
}

function getHeaderInstance() {
  return _headerInstance;
}

function getIntegrations() {
  return Integrations;
}

function healthCheck() {
  if (!_bootstrapped) {
    return { status: 'NOT_BOOTSTRAPPED', score: 0, maxScore: 1, checks: { bootstrapped: false } };
  }

  const integrationsHealth = Integrations.healthCheck();
  const checks = {
    bootstrapped: _bootstrapped,
    hasHeader: !!_headerInstance,
    integrationsHealthy: integrationsHealth.status === 'HEALTHY',
    portsInitialized: Ports.isInitialized()
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    integrationsHealth,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: new Date().toISOString()
  };
}

function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    bootstrapped: _bootstrapped,
    hasHeader: !!_headerInstance,
    defaultConfig: DEFAULT_CONFIG,
    integrationsInfo: _bootstrapped ? Integrations.info() : null,
    portsInitialized: Ports.isInitialized(),
    healthCheck: healthCheck()
  };
}

export { bootstrap, quickBootstrap, shutdown, isBootstrapped, getHeaderInstance, getIntegrations, healthCheck, info, DEFAULT_CONFIG };
export default { VERSION, MODULE_ID, bootstrap, quickBootstrap, shutdown, isBootstrapped, getHeaderInstance, getIntegrations, healthCheck, info };
