// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components._shared.permissions.integration.global-expose
// PURPOSE: Global window exposure for Permissions API
// ───────────────────────────────────────────────────────────────
// @contract EXPOSE_GLOBALLY - exposeGlobally(...) exposes API to window.Permissions
// ───────────────────────────────────────────────────────────────
// IMPORTS: None
// PROVIDES: exposeGlobally, VERSION, MODULE_ID
// @changelog v1.0.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.0.0: Initial version
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'components._shared.permissions.integration.global-expose';
export const VERSION = '1.0.0-P2-ENTERPRISE';

export function exposeGlobally(VERSION: string, MODULE_ID: string, state: Record<string, any>, Permissions: Record<string, any>, Inventory: Record<string, any>, api: Record<string, any>, diagnostics: Record<string, any>, init: (...args: unknown[]) => unknown, syncPermissions: (...args: unknown[]) => unknown, log: ((event: string, data?: unknown) => void) | null) {
  (window as any).Permissions = {
    can: api.can,
    canTrigger: api.canTrigger,
    canAccessRegion: api.canAccessRegion,
    checkMultiple: api.checkMultiple,
    setCurrentUser: api.setCurrentUser,
    getCurrentUser: api.getCurrentUser,
    syncPermissions,
    isApiConnected() { return state.apiConnected; },
    getUserPermissions() { return Object.assign({}, state.userPermissions); },
    getRegion: Permissions.getRegion,
    getTrigger: Permissions.getTrigger,
    getAllRegions: Permissions.getAllRegions,
    getAllTriggers: Permissions.getAllTriggers,
    getMode: Permissions.getMode,
    setMode: Permissions.setMode,
    setDebug: Permissions.setDebug,
    healthCheck: diagnostics.healthCheck,
    info: diagnostics.info,
    getStats() { return Object.assign({}, state.stats, Permissions.getStats()); },
    inventory: {
      getRegionById: Inventory.getRegionById,
      getTriggerById: Inventory.getTriggerById,
      getRegionsByType: Inventory.getRegionsByType,
      getTriggersByCategory: Inventory.getTriggersByCategory,
      getCriticalTriggers: Inventory.getCriticalTriggers,
      getInventoryStats: Inventory.getInventoryStats
    },
    ENTITY_TYPE: Permissions.ENTITY_TYPE,
    REGION_TYPE: Permissions.REGION_TYPE,
    TRIGGER_CATEGORY: Permissions.TRIGGER_CATEGORY,
    CRITICALITY: Permissions.CRITICALITY,
    PERMISSION_STATE: Permissions.PERMISSION_STATE,
    VERSION,
    MODULE_ID
  };
  window.__dev = window.__dev || {};
  window.__dev.permissions = {
    engine: Permissions,
    inventory: Inventory,
    integration: {
      state() { return Object.assign({}, state); },
      init,
      healthCheck: diagnostics.healthCheck,
      info: diagnostics.info,
      syncPermissions
    }
  };
  if (log) log('global-exposed');
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}

export function healthCheck() {
  return {
    status: typeof window !== 'undefined' && !!window.Permissions ? 'HEALTHY' : 'NOT_EXPOSED',
    moduleId: MODULE_ID,
    version: VERSION,
    timestamp: Date.now()
  };
}

export default { MODULE_ID, VERSION, exposeGlobally, info, healthCheck };
