// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components._shared.permissions.integration.diagnostics
// PURPOSE: Diagnostics and health reporting for permissions integration
// ───────────────────────────────────────────────────────────────
// @contract HEALTH_CHECK - healthCheck(version, moduleId, state, Permissions, Inventory) generates health report
// @contract INFO - info(version, moduleId, state, Permissions, Inventory) generates info report
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// PROVIDES: healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID
// @changelog v1.2.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.2.0-P17WI: PortsFactory/PortsProfiles migration
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.2.0-P2-ENTERPRISE';
export const MODULE_ID = 'components._shared.permissions.integration.diagnostics';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

export function healthCheck(version: string, moduleId: string, state: Record<string, any>, Permissions: Record<string, any>, Inventory: Record<string, any>) {
  const ps = Ports.snapshot();
  const engineHealth = Permissions.healthCheck();
  const inventoryStats = Inventory.getInventoryStats();

  const checks = {
    initialized: state.initialized,
    engineHealthy: engineHealth.status === 'HEALTHY',
    apiConnected: state.apiConnected,
    hasUser: !!state.currentUserId && state.currentUserId !== 'anonymous',
    portsInitialized: ps._initialized
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    version,
    moduleId,
    phase: state.apiConnected ? 'api-connected' : 'allow-all',
    checks,
    currentUser: state.currentUserId,
    engine: engineHealth,
    inventory: inventoryStats,
    integrationStats: Object.assign({}, state.stats),
    cachedPermissions: {
      triggers: Object.keys(state.userPermissions.triggers).length,
      regions: Object.keys(state.userPermissions.regions).length
    },
    eventBusConnected: !!_getPort('eventBus'),
    globallyExposed: typeof window !== 'undefined' && !!window.Permissions,
    readyFlagsUsed: state.readyFlagsUsed,
    portsInitialized: ps._initialized,
    timestamp: Date.now()
  };
}

export function info(version: string, moduleId: string, state: Record<string, any>, Permissions: Record<string, any>, Inventory: Record<string, any>) {
  return {
    version,
    moduleId,
    phase: state.apiConnected ? 'api-connected (Fase 6)' : 'allow-all (Fase 2)',
    initialized: state.initialized,
    registeredAt: state.registeredAt,
    currentUser: state.currentUserId,
    apiConnected: state.apiConnected,
    mode: Permissions.getMode(),
    readyFlagsUsed: state.readyFlagsUsed,
    stats: Object.assign({}, state.stats, Permissions.getStats()),
    cachedPermissions: {
      triggers: Object.keys(state.userPermissions.triggers).length,
      regions: Object.keys(state.userPermissions.regions).length
    },
    regions: Permissions.getAllRegions().length,
    triggers: Permissions.getAllTriggers().length,
    criticalTriggers: Inventory.getCriticalTriggers().length,
    timestamp: Date.now()
  };
}

export default { VERSION, MODULE_ID, healthCheck, info, injectPorts, getPorts };
