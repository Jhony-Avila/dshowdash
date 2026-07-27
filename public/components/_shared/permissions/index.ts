// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components._shared.permissions
// PURPOSE: Permissions System - Main Engine with UARPS support
// ───────────────────────────────────────────────────────────────
// @contract INIT - init(options) initializes the permissions engine
// @contract RESET - reset() clears all state
// @contract DESTROY - destroy() teardown lifecycle
// @contract CAN - can(userId, entityId) checks permission for entity
// @contract CAN_TRIGGER - canTrigger(userId, triggerId) checks trigger permission
// @contract CAN_ACCESS_REGION - canAccessRegion(userId, regionId) checks region permission
// @contract CHECK_MULTIPLE - checkMultiple(userId, entityIds) batch permission check
// @contract REGISTER_REGION - registerRegion(config) registers a region
// @contract REGISTER_TRIGGER - registerTrigger(config) registers a trigger
// @contract GET_REGION - getRegion(id) retrieves a region
// @contract GET_TRIGGER - getTrigger(id) retrieves a trigger
// @contract GET_ALL_REGIONS - getAllRegions() lists all regions
// @contract GET_ALL_TRIGGERS - getAllTriggers() lists all triggers
// @contract SET_PERMISSION - setPermission(userId, entityId, state, options) sets permission
// @contract GET_PERMISSION - getPermission(userId, entityId) retrieves permission
// @contract REMOVE_PERMISSION - removePermission(userId, entityId) removes permission
// @contract GET_USER_PERMISSIONS - getUserPermissions(userId) lists user permissions
// @contract SET_MULTIPLE_PERMISSIONS - setMultiplePermissions(userId, permissions) batch set
// @contract SET_MODE - setMode(mode) sets permission mode
// @contract GET_MODE - getMode() returns current mode
// @contract SET_DEBUG - setDebug(enabled) toggles debug logging
// @contract GET_CONFIG - getConfig() returns config snapshot
// @contract GET_STATS - getStats() returns usage statistics
// @contract HEALTH - healthCheck() and info() for observability
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract RE_EXPORTS - Re-exports contracts, canonical builders, and inventory
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// IMPORTS: ENTITY_TYPE, REGION_TYPE, TRIGGER_CATEGORY, CRITICALITY, PERMISSION_STATE, validateId, parseId, buildId, isTriggerId, isRegionId, createRegion, createTrigger, createPermission from ./contracts.js
// IMPORTS: buildNavigationItemTrigger, buildNavigationSectionTrigger, buildTrigger, buildRegion, validateTrigger, isLegacyFormat from ./builders/trigger-builders.js
// IMPORTS: STRUCTURAL_REGIONS, PANEL_REGIONS, HEADER_TRIGGERS, NAVRAIL_TRIGGERS, FOOTER_TRIGGERS, NAVIGATION_*, ALL_REGIONS, ALL_TRIGGERS, getRegionById, getTriggerById, getInventoryStats, getNavigationTriggers from ./inventory.js
// PROVIDES: init, reset, destroy, can, canTrigger, canAccessRegion, checkMultiple, registerRegion, registerTrigger, getRegion, getTrigger, getAllRegions, getAllTriggers, setPermission, getPermission, removePermission, getUserPermissions, setMultiplePermissions, setMode, getMode, setDebug, getConfig, getStats, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID
// PROVIDES: Re-exports from contracts, builders, inventory
// @changelog v2.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.3.0 - Integrated canonical builders and inventory exports
// @changelog v2.2.0-P17WI - PortsFactory/PortsProfiles migration
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import {
  VERSION as CONTRACTS_VERSION,
  ENTITY_TYPE,
  REGION_TYPE,
  TRIGGER_CATEGORY,
  CRITICALITY,
  PERMISSION_STATE,
  validateId,
  parseId,
  buildId,
  isTriggerId,
  isRegionId,
  createRegion,
  createTrigger,
  createPermission
} from './contracts.js';

// ═══════════════════════════════════════════════════════════════
// CANONICAL BUILDERS (Enterprise - Contract Enforced)
// ═══════════════════════════════════════════════════════════════
import {
  buildNavigationItemTrigger,
  buildNavigationSectionTrigger,
  buildTrigger as buildCanonicalTrigger,
  buildRegion as buildCanonicalRegion,
  validateTrigger,
  isLegacyFormat
} from './builders/trigger-builders.js';

// ═══════════════════════════════════════════════════════════════
// INVENTORY (Regions & Triggers Catalog)
// ═══════════════════════════════════════════════════════════════
import {
  STRUCTURAL_REGIONS,
  PANEL_REGIONS,
  HEADER_TRIGGERS,
  NAVRAIL_TRIGGERS,
  FOOTER_TRIGGERS,
  NAVIGATION_SECTION_TRIGGERS,
  NAVIGATION_ITEM_TRIGGERS,
  NAVIGATION_TRIGGERS,
  ALL_REGIONS as INVENTORY_REGIONS,
  ALL_TRIGGERS as INVENTORY_TRIGGERS,
  getRegionById as getInventoryRegionById,
  getTriggerById as getInventoryTriggerById,
  getInventoryStats,
  getNavigationTriggers,
  getNavigationItemTriggers,
  getNavigationSectionTriggers
} from './inventory.js';

export const VERSION = '2.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'components._shared.permissions';

const hasWindow = typeof window !== 'undefined';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _log = function(level: 'error' | 'warn' | 'info' | 'debug', ...args: any[]) {
  const logger = _getPort('logger');
  if (!logger) return;
  const fn = logger[level] || logger.info;
  if (typeof fn === 'function') fn.apply(logger, [`[${MODULE_ID}]`].concat(args));
};

const CONFIG = { mode: 'allow-all', debug: false, logDenials: true, fallbackToMinLevel: true };
const _state = { initialized: false, regions: new Map(), triggers: new Map(), permissions: new Map(), stats: { checks: 0, allowed: 0, denied: 0 } };

export function registerRegion(config: Record<string, unknown>) {
  const region = createRegion(config);
  _state.regions.set(region.id, region);
  _logEvent('region:registered', region.id);
  return region;
}

export function registerTrigger(config: Record<string, unknown>) {
  const trigger = createTrigger(config);
  _state.triggers.set(trigger.id, trigger);
  _logEvent('trigger:registered', trigger.id);
  return trigger;
}

export function getRegion(id: string) { return _state.regions.get(id) || null; }
export function getTrigger(id: string) { return _state.triggers.get(id) || null; }
export function getAllRegions() { return Array.from(_state.regions.values()); }
export function getAllTriggers() { return Array.from(_state.triggers.values()); }

export function setPermission(userId: string, entityId: string, state: string, options: Record<string, unknown>) {
  if (!options) options = {};
  const permission = createPermission({
    userId,
    entityId,
    state,
    grantedBy: options.grantedBy || null,
    expiresAt: options.expiresAt || null,
    reason: options.reason || null
  });
  const key = _buildPermissionKey(userId, entityId);
  _state.permissions.set(key, permission);
  _logEvent('permission:set', { userId, entityId, state });
  return permission;
}

export function getPermission(userId: string, entityId: string) {
  const key = _buildPermissionKey(userId, entityId);
  return _state.permissions.get(key) || null;
}

export function removePermission(userId: string, entityId: string) {
  const key = _buildPermissionKey(userId, entityId);
  const existed = _state.permissions.delete(key);
  if (existed) _logEvent('permission:removed', { userId, entityId });
  return existed;
}

export function getUserPermissions(userId: string) {
  const permissions: Array<Record<string, unknown>> = [];
  _state.permissions.forEach(permission => {
    if (permission.userId === userId) permissions.push(permission);
  });
  return permissions;
}

export function can(userId: string, entityId: string) {
  _state.stats.checks++;
  if (CONFIG.mode === 'allow-all') {
    _state.stats.allowed++;
    return true;
  }
  const permission = getPermission(userId, entityId);
  if (!permission) {
    if (CONFIG.fallbackToMinLevel) {
      _state.stats.allowed++;
      return true;
    }
    _state.stats.denied++;
    return false;
  }
  const allowed = permission.state === PERMISSION_STATE.ALLOWED;
  if (allowed) {
    _state.stats.allowed++;
  } else {
    _state.stats.denied++;
    if (CONFIG.logDenials) _logEvent('permission:denied', { userId, entityId });
  }
  return allowed;
}

export function canTrigger(userId: string, triggerId: string) {
  if (!isTriggerId(triggerId)) {
    _log('warn', 'Invalid trigger ID:', triggerId);
    return CONFIG.mode === 'allow-all';
  }
  return can(userId, triggerId);
}

export function canAccessRegion(userId: string, regionId: string) {
  if (!isRegionId(regionId)) {
    _log('warn', 'Invalid region ID:', regionId);
    return CONFIG.mode === 'allow-all';
  }
  return can(userId, regionId);
}

export function checkMultiple(userId: string, entityIds: string[]) {
  const results: Record<string, boolean> = {};
  for (let i = 0; i < entityIds.length; i++) {
    results[entityIds[i]] = can(userId, entityIds[i]);
  }
  return results;
}

export function setMultiplePermissions(userId: string, permissions: Array<Record<string, unknown>>) {
  const results = [];
  for (let i = 0; i < permissions.length; i++) {
    const p = permissions[i];
    results.push(setPermission(userId, p.entityId as string, p.state as string, p));
  }
  return results;
}

export function setMode(mode: string) {
  if (['allow-all', 'explicit', 'strict'].indexOf(mode) < 0) throw new Error(`Invalid mode: ${mode}`);
  CONFIG.mode = mode;
  _logEvent('config:mode', mode);
}

export function getMode() { return CONFIG.mode; }
export function setDebug(enabled: boolean) { CONFIG.debug = enabled; }
export function getConfig() { return Object.assign({}, CONFIG); }

export function init(options: Record<string, unknown>) {
  if (!options) options = {};
  if (_state.initialized) return;
  _initPorts();
  if (options.mode) CONFIG.mode = options.mode as string;
  if (options.debug !== undefined) CONFIG.debug = options.debug as boolean;
  if (options.logDenials !== undefined) CONFIG.logDenials = options.logDenials as boolean;
  _state.initialized = true;
  _logEvent('init', { config: CONFIG });
  return true;
}

export function reset() {
  _state.regions.clear();
  _state.triggers.clear();
  _state.permissions.clear();
  _state.stats = { checks: 0, allowed: 0, denied: 0 };
  _logEvent('reset');
}

export function destroy() {
  reset();
  _state.initialized = false;
  _logEvent('destroy');
}

export function getStats() {
  return {
    checks: _state.stats.checks,
    allowed: _state.stats.allowed,
    denied: _state.stats.denied,
    regions: _state.regions.size,
    triggers: _state.triggers.size,
    permissions: _state.permissions.size
  };
}

export function healthCheck() {
  const logger = _getPort('logger');
  return {
    status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED',
    version: VERSION,
    moduleId: MODULE_ID,
    contractsVersion: CONTRACTS_VERSION,
    mode: CONFIG.mode,
    initialized: _state.initialized,
    stats: getStats(),
    loggerAvailable: !!logger,
    portsInitialized: Ports.isInitialized(),
    inventoryStats: getInventoryStats(),
    buildersAvailable: true,
    threeSegmentCompliant: true,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    mode: CONFIG.mode,
    initialized: _state.initialized,
    portsInitialized: Ports.isInitialized(),
    regions: getAllRegions(),
    triggers: getAllTriggers(),
    stats: getStats(),
    inventoryStats: getInventoryStats(),
    triggerPattern: 'trigger:navigation:item-{id} | trigger:navigation:section-{id}',
    enforcement: 'CONTRACT_VALIDATED',
    timestamp: Date.now()
  };
}

function _buildPermissionKey(userId: string, entityId: string) { return `${userId}::${entityId}`; }

function _logEvent(event: string, data?: unknown) { if (!CONFIG.debug) return; _log('info', event, data || ''); }

// ═══════════════════════════════════════════════════════════════
// EXPORTS - Contracts
// ═══════════════════════════════════════════════════════════════
export {
  ENTITY_TYPE,
  REGION_TYPE,
  TRIGGER_CATEGORY,
  CRITICALITY,
  PERMISSION_STATE,
  validateId,
  parseId,
  buildId,
  isTriggerId,
  isRegionId
};

// ═══════════════════════════════════════════════════════════════
// EXPORTS - Canonical Builders (USE THESE FOR NEW CODE)
// ═══════════════════════════════════════════════════════════════
export {
  buildNavigationItemTrigger,
  buildNavigationSectionTrigger,
  buildCanonicalTrigger,
  buildCanonicalRegion,
  validateTrigger,
  isLegacyFormat
};

// ═══════════════════════════════════════════════════════════════
// EXPORTS - Inventory
// ═══════════════════════════════════════════════════════════════
export {
  STRUCTURAL_REGIONS,
  PANEL_REGIONS,
  HEADER_TRIGGERS,
  NAVRAIL_TRIGGERS,
  FOOTER_TRIGGERS,
  NAVIGATION_SECTION_TRIGGERS,
  NAVIGATION_ITEM_TRIGGERS,
  NAVIGATION_TRIGGERS,
  INVENTORY_REGIONS,
  INVENTORY_TRIGGERS,
  getInventoryRegionById,
  getInventoryTriggerById,
  getInventoryStats,
  getNavigationTriggers,
  getNavigationItemTriggers,
  getNavigationSectionTriggers
};

// ═══════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════
export default {
  VERSION,
  MODULE_ID,
  // Lifecycle
  init,
  reset,
  destroy,
  // Permission checks
  can,
  canTrigger,
  canAccessRegion,
  checkMultiple,
  // Registration
  registerRegion,
  registerTrigger,
  getRegion,
  getTrigger,
  getAllRegions,
  getAllTriggers,
  // Permissions management
  setPermission,
  getPermission,
  removePermission,
  getUserPermissions,
  setMultiplePermissions,
  // Config
  setMode,
  getMode,
  setDebug,
  getConfig,
  getStats,
  // Health
  healthCheck,
  info,
  // Ports
  injectPorts,
  getPorts,
  // Contracts
  ENTITY_TYPE,
  REGION_TYPE,
  TRIGGER_CATEGORY,
  CRITICALITY,
  PERMISSION_STATE,
  validateId,
  parseId,
  buildId,
  isTriggerId,
  isRegionId,
  // Canonical Builders (USE THESE)
  buildNavigationItemTrigger,
  buildNavigationSectionTrigger,
  buildCanonicalTrigger,
  buildCanonicalRegion,
  validateTrigger,
  isLegacyFormat,
  // Inventory
  STRUCTURAL_REGIONS,
  PANEL_REGIONS,
  NAVIGATION_TRIGGERS,
  INVENTORY_REGIONS,
  INVENTORY_TRIGGERS,
  getInventoryStats,
  getNavigationTriggers
};
