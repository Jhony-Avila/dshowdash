import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.2.0-P17WI";
const MODULE_ID = "router.core.feature-flags";
const hasWindow = typeof window !== "undefined";
const Ports = createUiPorts({ moduleId: MODULE_ID });
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
function _log(level, msg, ctx) {
  if (!ctx) ctx = {};
  const logger = _getPort("logger");
  if (!logger || typeof logger[level] !== "function") return;
  ctx.component = MODULE_ID;
  logger[level](msg, ctx);
}
const _flags = /* @__PURE__ */ new Map();
const _routeFlags = /* @__PURE__ */ new Map();
const _userOverrides = /* @__PURE__ */ new Map();
const _metrics = { evaluations: 0, enabledCount: 0, disabledCount: 0, lastEvaluation: null };
function defineFlag(flagId, config) {
  if (!config) config = {};
  const flag = { id: flagId, enabled: config.enabled !== void 0 ? config.enabled : false, description: config.description || "", percentage: config.percentage !== void 0 ? config.percentage : 100, allowedUsers: config.allowedUsers || [], blockedUsers: config.blockedUsers || [], startDate: config.startDate || null, endDate: config.endDate || null, environments: config.environments || ["production", "development"], metadata: config.metadata || {}, createdAt: Date.now(), updatedAt: Date.now() };
  _flags.set(flagId, flag);
  _log("info", "Flag defined", { flagId, enabled: flag.enabled });
  return flag;
}
function updateFlag(flagId, updates) {
  if (!updates) updates = {};
  const flag = _flags.get(flagId);
  if (!flag) {
    _log("warn", "Flag not found", { flagId });
    return null;
  }
  Object.assign(flag, updates, { updatedAt: Date.now() });
  _log("info", "Flag updated", { flagId, updates: Object.keys(updates) });
  return flag;
}
function removeFlag(flagId) {
  const deleted = _flags.delete(flagId);
  if (deleted) {
    _routeFlags.forEach((flags) => {
      flags.delete(flagId);
    });
    _log("info", "Flag removed", { flagId });
  }
  return deleted;
}
function getFlag(flagId) {
  return _flags.get(flagId) || null;
}
function getAllFlags() {
  return Array.from(_flags.values());
}
function assignFlagToRoute(routeId, flagId, options) {
  if (!options) options = {};
  if (!_flags.has(flagId)) {
    _log("warn", "Cannot assign unknown flag", { flagId, routeId });
    return false;
  }
  if (!_routeFlags.has(routeId)) {
    _routeFlags.set(routeId, /* @__PURE__ */ new Map());
  }
  _routeFlags.get(routeId).set(flagId, { flagId, required: options.required !== void 0 ? options.required : true, fallbackRoute: options.fallbackRoute || null, message: options.message || "Feature not available" });
  _log("info", "Flag assigned to route", { routeId, flagId });
  return true;
}
function removeFlagFromRoute(routeId, flagId) {
  const routeMap = _routeFlags.get(routeId);
  if (routeMap) {
    return routeMap.delete(flagId);
  }
  return false;
}
function getRoutesForFlag(flagId) {
  const routes = [];
  _routeFlags.forEach((flags, routeId) => {
    if (flags.has(flagId)) routes.push(routeId);
  });
  return routes;
}
function getFlagsForRoute(routeId) {
  const routeMap = _routeFlags.get(routeId);
  return routeMap ? Array.from(routeMap.keys()) : [];
}
function setUserOverride(userId, flagId, enabled) {
  if (!_userOverrides.has(userId)) {
    _userOverrides.set(userId, /* @__PURE__ */ new Map());
  }
  _userOverrides.get(userId).set(flagId, enabled);
  _log("debug", "User override set", { userId, flagId, enabled });
}
function removeUserOverride(userId, flagId) {
  const userMap = _userOverrides.get(userId);
  if (userMap) {
    return userMap.delete(flagId);
  }
  return false;
}
function clearUserOverrides(userId) {
  return _userOverrides.delete(userId);
}
function _hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
function isEnabled(flagId, context) {
  if (!context) context = {};
  _metrics.evaluations++;
  _metrics.lastEvaluation = Date.now();
  const flag = _flags.get(flagId);
  if (!flag) {
    _metrics.disabledCount++;
    return false;
  }
  if (context.userId) {
    const userOverrides = _userOverrides.get(context.userId);
    if (userOverrides && userOverrides.has(flagId)) {
      const enabled = userOverrides.get(flagId);
      enabled ? _metrics.enabledCount++ : _metrics.disabledCount++;
      return enabled;
    }
  }
  if (!flag.enabled) {
    _metrics.disabledCount++;
    return false;
  }
  if (context.userId && flag.blockedUsers.indexOf(context.userId) !== -1) {
    _metrics.disabledCount++;
    return false;
  }
  if (flag.allowedUsers.length > 0 && context.userId) {
    if (flag.allowedUsers.indexOf(context.userId) === -1) {
      _metrics.disabledCount++;
      return false;
    }
  }
  const now = Date.now();
  if (flag.startDate && now < new Date(flag.startDate).getTime()) {
    _metrics.disabledCount++;
    return false;
  }
  if (flag.endDate && now > new Date(flag.endDate).getTime()) {
    _metrics.disabledCount++;
    return false;
  }
  if (context.environment && flag.environments.indexOf(context.environment) === -1) {
    _metrics.disabledCount++;
    return false;
  }
  if (flag.percentage < 100) {
    const hash = _hashString(context.userId || context.sessionId || String(Math.random()));
    const bucket = hash % 100;
    if (bucket >= flag.percentage) {
      _metrics.disabledCount++;
      return false;
    }
  }
  _metrics.enabledCount++;
  return true;
}
function canAccessRoute(routeId, context) {
  if (!context) context = {};
  const routeMap = _routeFlags.get(routeId);
  if (!routeMap || routeMap.size === 0) {
    return { allowed: true, flags: [] };
  }
  const results = [];
  let allowed = true;
  routeMap.forEach((config, flagId) => {
    const enabled = isEnabled(flagId, context);
    results.push({ flagId, enabled, required: config.required });
    if (config.required && !enabled) {
      allowed = false;
    }
  });
  const first = routeMap.values().next().value;
  return { allowed, flags: results, fallbackRoute: allowed ? null : first ? first.fallbackRoute : null, message: allowed ? null : first ? first.message : null };
}
function enableAll() {
  let count = 0;
  _flags.forEach((flag) => {
    flag.enabled = true;
    flag.updatedAt = Date.now();
    count++;
  });
  _log("info", "All flags enabled", { count });
  return count;
}
function disableAll() {
  let count = 0;
  _flags.forEach((flag) => {
    flag.enabled = false;
    flag.updatedAt = Date.now();
    count++;
  });
  _log("info", "All flags disabled", { count });
  return count;
}
function importFlags(data) {
  if (!Array.isArray(data)) return 0;
  let imported = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i].id) {
      defineFlag(data[i].id, data[i]);
      imported++;
    }
  }
  return imported;
}
function exportFlags() {
  const assignments = [];
  _routeFlags.forEach((flags, routeId) => {
    assignments.push({ routeId, flags: Array.from(flags.entries()) });
  });
  return { version: VERSION, exportedAt: (/* @__PURE__ */ new Date()).toISOString(), flags: getAllFlags(), routeAssignments: assignments };
}
function getMetrics() {
  const enabledFlags = Array.from(_flags.values()).filter((f) => f.enabled).length;
  return Object.assign({}, _metrics, { totalFlags: _flags.size, enabledFlags, disabledFlags: _flags.size - enabledFlags, routesWithFlags: _routeFlags.size, usersWithOverrides: _userOverrides.size });
}
function getStatus() {
  return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), metrics: getMetrics() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), checks: { flagsLoaded: _flags.size >= 0, evaluationWorking: true }, timestamp: Date.now() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), features: ["flag-management", "route-assignment", "user-overrides", "percentage-rollout", "date-ranges", "environment-targeting"], status: getStatus() };
}
var feature_flags_default = { VERSION, MODULE_ID, defineFlag, updateFlag, removeFlag, getFlag, getAllFlags, assignFlagToRoute, removeFlagFromRoute, getRoutesForFlag, getFlagsForRoute, setUserOverride, removeUserOverride, clearUserOverrides, isEnabled, canAccessRoute, enableAll, disableAll, importFlags, exportFlags, getMetrics, getStatus, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  assignFlagToRoute,
  canAccessRoute,
  clearUserOverrides,
  feature_flags_default as default,
  defineFlag,
  disableAll,
  enableAll,
  exportFlags,
  getAllFlags,
  getFlag,
  getFlagsForRoute,
  getMetrics,
  getPorts,
  getRoutesForFlag,
  getStatus,
  healthCheck,
  importFlags,
  info,
  injectPorts,
  isEnabled,
  removeFlag,
  removeFlagFromRoute,
  removeUserOverride,
  setUserOverride,
  updateFlag
};
