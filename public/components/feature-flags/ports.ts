// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.feature-flags.ports
// PURPOSE: Ports management for feature flags dependency injection
// ───────────────────────────────────────────────────────────────
// @contract INIT_PORTS - initPorts() initializes ports
// @contract GET_PORT - getPort(name) returns specific port
// @contract INJECT_PORTS - injectPorts(ports) injects ports
// @contract GET_PORTS - getPorts() returns ports snapshot
// @contract IS_INITIALIZED - isInitialized() returns init status
// @contract IS_DEBUG - isDebug() returns debug mode status
// @contract LOG - log(level, ...args) logs with level
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// PROVIDES: initPorts, getPort, injectPorts, getPorts, isInitialized,
//           isDebug, log, healthCheck, info, VERSION, MODULE_ID
// @changelog v1.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog P17WI: Migração para PortsFactory/PortsProfiles
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.feature-flags.ports';

const Ports = createCorePorts({ moduleId: MODULE_ID });

export function initPorts() {
  Ports.init();
}

interface Port {
  [key: string]: ((...args: unknown[]) => unknown) | Record<string, unknown> | unknown;
  emit?: (...args: unknown[]) => unknown;
  on?: (...args: unknown[]) => unknown;
  off?: (...args: unknown[]) => unknown;
  subscribe?: (...args: unknown[]) => unknown;
  error?: (...args: unknown[]) => unknown;
  warn?: (...args: unknown[]) => unknown;
  debug?: (...args: unknown[]) => unknown;
  app?: Record<string, unknown>;
}

export function getPort(name: string): Port | undefined {
  return Ports.get(name);
}

export function injectPorts(p: Record<string, unknown>): unknown {
  return Ports.inject(p);
}

export function getPorts() {
  return Ports.snapshot();
}

export function isInitialized() {
  return Ports.isInitialized();
}

export function isDebug() {
  const cfg = getPort('config');
  const app = cfg?.app as Record<string, unknown> | undefined;
  return (app?.debug as boolean) || false;
}

export function log(level: string, ...args: unknown[]): void {
  const logger = getPort('logger');
  if (!logger) return;

  const prefix = '[feature-flags]';

  if (level === 'error') {
    logger.error?.(`${prefix}`, ...args);
    return;
  }
  if (level === 'warn') {
    logger.warn?.(`${prefix}`, ...args);
    return;
  }
  if (isDebug() && logger.debug) {
    logger.debug(`${prefix}`, ...args);
  }
}

export function healthCheck() {
  const portsSnapshot = Ports.snapshot();

  const checks = {
    portsInitialized: portsSnapshot._initialized,
    loggerAvailable: !!getPort('logger')
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: portsSnapshot._initialized,
    timestamp: Date.now()
  };
}

export function info() {
  const portsSnapshot = Ports.snapshot();

  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: portsSnapshot._initialized,
    loggerAvailable: !!getPort('logger'),
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}

export default {
  initPorts,
  getPort,
  injectPorts,
  getPorts,
  isInitialized,
  isDebug,
  log,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
