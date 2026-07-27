import { createCorePorts } from "/core/runtime/ports-profiles.js";
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
} from "./contracts.js";
import {
  buildNavigationItemTrigger,
  buildNavigationSectionTrigger,
  buildTrigger as buildCanonicalTrigger,
  buildRegion as buildCanonicalRegion,
  validateTrigger,
  isLegacyFormat
} from "./builders/trigger-builders.js";
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
} from "./inventory.js";
const VERSION = "2.3.0-P2-ENTERPRISE";
const MODULE_ID = "components._shared.permissions";
const hasWindow = typeof window !== "undefined";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _log = function(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn.apply(logger, [`[${MODULE_ID}]`].concat(args));
};
const CONFIG = { mode: "allow-all", debug: false, logDenials: true, fallbackToMinLevel: true };
const _state = { initialized: false, regions: /* @__PURE__ */ new Map(), triggers: /* @__PURE__ */ new Map(), permissions: /* @__PURE__ */ new Map(), stats: { checks: 0, allowed: 0, denied: 0 } };
function registerRegion(config) {
  const region = createRegion(config);
  _state.regions.set(region.id, region);
  _logEvent("region:registered", region.id);
  return region;
}
function registerTrigger(config) {
  const trigger = createTrigger(config);
  _state.triggers.set(trigger.id, trigger);
  _logEvent("trigger:registered", trigger.id);
  return trigger;
}
function getRegion(id) {
  return _state.regions.get(id) || null;
}
function getTrigger(id) {
  return _state.triggers.get(id) || null;
}
function getAllRegions() {
  return Array.from(_state.regions.values());
}
function getAllTriggers() {
  return Array.from(_state.triggers.values());
}
function setPermission(userId, entityId, state, options) {
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
  _logEvent("permission:set", { userId, entityId, state });
  return permission;
}
function getPermission(userId, entityId) {
  const key = _buildPermissionKey(userId, entityId);
  return _state.permissions.get(key) || null;
}
function removePermission(userId, entityId) {
  const key = _buildPermissionKey(userId, entityId);
  const existed = _state.permissions.delete(key);
  if (existed) _logEvent("permission:removed", { userId, entityId });
  return existed;
}
function getUserPermissions(userId) {
  const permissions = [];
  _state.permissions.forEach((permission) => {
    if (permission.userId === userId) permissions.push(permission);
  });
  return permissions;
}
function can(userId, entityId) {
  _state.stats.checks++;
  if (CONFIG.mode === "allow-all") {
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
    if (CONFIG.logDenials) _logEvent("permission:denied", { userId, entityId });
  }
  return allowed;
}
function canTrigger(userId, triggerId) {
  if (!isTriggerId(triggerId)) {
    _log("warn", "Invalid trigger ID:", triggerId);
    return CONFIG.mode === "allow-all";
  }
  return can(userId, triggerId);
}
function canAccessRegion(userId, regionId) {
  if (!isRegionId(regionId)) {
    _log("warn", "Invalid region ID:", regionId);
    return CONFIG.mode === "allow-all";
  }
  return can(userId, regionId);
}
function checkMultiple(userId, entityIds) {
  const results = {};
  for (let i = 0; i < entityIds.length; i++) {
    results[entityIds[i]] = can(userId, entityIds[i]);
  }
  return results;
}
function setMultiplePermissions(userId, permissions) {
  const results = [];
  for (let i = 0; i < permissions.length; i++) {
    const p = permissions[i];
    results.push(setPermission(userId, p.entityId, p.state, p));
  }
  return results;
}
function setMode(mode) {
  if (["allow-all", "explicit", "strict"].indexOf(mode) < 0) throw new Error(`Invalid mode: ${mode}`);
  CONFIG.mode = mode;
  _logEvent("config:mode", mode);
}
function getMode() {
  return CONFIG.mode;
}
function setDebug(enabled) {
  CONFIG.debug = enabled;
}
function getConfig() {
  return Object.assign({}, CONFIG);
}
function init(options) {
  if (!options) options = {};
  if (_state.initialized) return;
  _initPorts();
  if (options.mode) CONFIG.mode = options.mode;
  if (options.debug !== void 0) CONFIG.debug = options.debug;
  if (options.logDenials !== void 0) CONFIG.logDenials = options.logDenials;
  _state.initialized = true;
  _logEvent("init", { config: CONFIG });
  return true;
}
function reset() {
  _state.regions.clear();
  _state.triggers.clear();
  _state.permissions.clear();
  _state.stats = { checks: 0, allowed: 0, denied: 0 };
  _logEvent("reset");
}
function destroy() {
  reset();
  _state.initialized = false;
  _logEvent("destroy");
}
function getStats() {
  return {
    checks: _state.stats.checks,
    allowed: _state.stats.allowed,
    denied: _state.stats.denied,
    regions: _state.regions.size,
    triggers: _state.triggers.size,
    permissions: _state.permissions.size
  };
}
function healthCheck() {
  const logger = _getPort("logger");
  return {
    status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED",
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
function info() {
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
    triggerPattern: "trigger:navigation:item-{id} | trigger:navigation:section-{id}",
    enforcement: "CONTRACT_VALIDATED",
    timestamp: Date.now()
  };
}
function _buildPermissionKey(userId, entityId) {
  return `${userId}::${entityId}`;
}
function _logEvent(event, data) {
  if (!CONFIG.debug) return;
  _log("info", event, data || "");
}
var permissions_default = {
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
export {
  CRITICALITY,
  ENTITY_TYPE,
  FOOTER_TRIGGERS,
  HEADER_TRIGGERS,
  INVENTORY_REGIONS,
  INVENTORY_TRIGGERS,
  MODULE_ID,
  NAVIGATION_ITEM_TRIGGERS,
  NAVIGATION_SECTION_TRIGGERS,
  NAVIGATION_TRIGGERS,
  NAVRAIL_TRIGGERS,
  PANEL_REGIONS,
  PERMISSION_STATE,
  REGION_TYPE,
  STRUCTURAL_REGIONS,
  TRIGGER_CATEGORY,
  VERSION,
  buildCanonicalRegion,
  buildCanonicalTrigger,
  buildId,
  buildNavigationItemTrigger,
  buildNavigationSectionTrigger,
  can,
  canAccessRegion,
  canTrigger,
  checkMultiple,
  permissions_default as default,
  destroy,
  getAllRegions,
  getAllTriggers,
  getConfig,
  getInventoryRegionById,
  getInventoryStats,
  getInventoryTriggerById,
  getMode,
  getNavigationItemTriggers,
  getNavigationSectionTriggers,
  getNavigationTriggers,
  getPermission,
  getPorts,
  getRegion,
  getStats,
  getTrigger,
  getUserPermissions,
  healthCheck,
  info,
  init,
  injectPorts,
  isLegacyFormat,
  isRegionId,
  isTriggerId,
  parseId,
  registerRegion,
  registerTrigger,
  removePermission,
  reset,
  setDebug,
  setMode,
  setMultiplePermissions,
  setPermission,
  validateId,
  validateTrigger
};
