// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.accordion.module.ports-manager
// PURPOSE: Port management and dependency injection for accordion
// ───────────────────────────────────────────────────────────────
// @contract INIT_PORTS - initPorts() initializes ports system
// @contract INJECT_PORTS - injectPorts(p) injects port dependencies
// @contract GET_PORTS - getPorts() returns ports snapshot
// @contract GET_PORT - getPort(name) returns specific port
// @contract IS_PORTS_INITIALIZED - isPortsInitialized() checks init state
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: createUiPorts from /core/runtime/ports-profiles.js
// IMPORTS: MODULE_ID from ./constants.js
// PROVIDES: initPorts, injectPorts, getPorts, getPort,
//           isPortsInitialized, healthCheck, info, VERSION, MODULE_ID
// @changelog v1.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.2.0-MODULAR: Initial modular architecture
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { MODULE_ID as ACCORDION_MODULE_ID } from './constants.js';

export const VERSION = '1.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.accordion.module.ports-manager';

const Ports = createUiPorts({ moduleId: ACCORDION_MODULE_ID });

export function initPorts() {
  Ports.init();
}

export function injectPorts(p: Record<string, unknown>) {
  return Ports.inject(p);
}

export function getPorts() {
  return Ports.snapshot();
}

export function getPort(name: string) {
  return Ports.get(name);
}

export function isPortsInitialized() {
  return Ports.isInitialized();
}

export function healthCheck() {
  const checks = {
    portsAvailable: !!Ports,
    portsInitialized: isPortsInitialized()
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
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: isPortsInitialized(),
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}

export default {
  initPorts,
  injectPorts,
  getPorts,
  getPort,
  isPortsInitialized,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
