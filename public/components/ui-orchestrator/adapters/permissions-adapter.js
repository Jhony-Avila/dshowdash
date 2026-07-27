import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.4.0-P18EC";
const MODULE_ID = "ui-orchestrator.adapters.permissions-adapter";
const UI_ORCHESTRATOR_EVENTS = { INTENT_DENIED: "ui-orchestrator:intent-denied", INTENT_GRANTED: "ui-orchestrator:intent-granted" };
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
let _metrics = { checks: 0, granted: 0, denied: 0, bypassedNoGuard: 0, errors: 0 };
function init(options = {}) {
  return { success: true, connected: !!_getPort("permissionsGuard") };
}
function canExecuteIntent(rule) {
  _metrics.checks++;
  const pg = _getPort("permissionsGuard");
  if (!pg) {
    _metrics.bypassedNoGuard++;
    return { allowed: true, reason: "no-guard-available", degraded: true };
  }
  try {
    const requiresPermission = rule.requiresPermission;
    const minLevel = rule.minLevel;
    const intentId = rule.intentId;
    if (!requiresPermission && !minLevel) {
      _metrics.granted++;
      return { allowed: true, reason: "no-restrictions" };
    }
    if (requiresPermission) {
      const hasPermission = pg.can?.(requiresPermission) || pg.hasCapability?.(requiresPermission);
      if (!hasPermission) {
        _metrics.denied++;
        _emitDenied(intentId, "permission", requiresPermission);
        return { allowed: false, reason: "missing-permission", required: requiresPermission };
      }
    }
    if (minLevel) {
      const hasLevel = pg.isAtLeastLevel?.(minLevel);
      if (!hasLevel) {
        _metrics.denied++;
        _emitDenied(intentId, "level", minLevel);
        return { allowed: false, reason: "insufficient-level", required: minLevel, current: pg.getUserLevel?.() || 0 };
      }
    }
    _metrics.granted++;
    _emitGranted(rule.intentId);
    return { allowed: true, reason: "all-checks-passed" };
  } catch (error) {
    _metrics.errors++;
    return { allowed: false, reason: "error", error: error.message };
  }
}
function canExecuteIntents(rules) {
  return rules.map((rule) => {
    const result = canExecuteIntent(rule);
    return Object.assign({ intentId: rule.intentId }, result);
  });
}
function filterAccessibleRules(rules) {
  return rules.filter((rule) => canExecuteIntent(rule).allowed);
}
function getDenialReason(rule) {
  const result = canExecuteIntent(rule);
  if (result.allowed) return null;
  return result;
}
function _emitDenied(intentId, type, required) {
  const eb = _getPort("eventBus");
  if (eb && eb.emit) {
    eb.emit(UI_ORCHESTRATOR_EVENTS.INTENT_DENIED, { intentId, type, required, timestamp: Date.now() });
  }
}
function _emitGranted(intentId) {
  const eb = _getPort("eventBus");
  if (eb && eb.emit) {
    eb.emit(UI_ORCHESTRATOR_EVENTS.INTENT_GRANTED, { intentId, timestamp: Date.now() });
  }
}
function isConnected() {
  return !!_getPort("permissionsGuard");
}
function getCurrentUserInfo() {
  const pg = _getPort("permissionsGuard");
  if (!pg) return null;
  return { level: pg.getUserLevel?.() || 0, roles: pg.getRoles?.() || [], capabilities: pg.getCapabilities?.() || [] };
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function resetMetrics() {
  _metrics = { checks: 0, granted: 0, denied: 0, bypassedNoGuard: 0, errors: 0 };
}
function info() {
  const pg = _getPort("permissionsGuard");
  return { moduleId: MODULE_ID, version: VERSION, connected: isConnected(), portsInitialized: Ports.isInitialized(), permissionsGuardVersion: pg && pg.getVersion ? pg.getVersion() : null, userInfo: getCurrentUserInfo(), metrics: getMetrics() };
}
function healthCheck() {
  const pg = _getPort("permissionsGuard");
  const connected = isConnected();
  const lowErrors = _metrics.errors < 5;
  const checksWorking = _metrics.checks >= 0;
  const pgHealthy = pg && pg.healthCheck && pg.healthCheck().status === "HEALTHY";
  const checks = { connected, lowErrors, checksWorking, permissionsGuardHealthy: pgHealthy, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const status = passed >= 4 ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY";
  return { status, score: `${passed}/${total}`, checks, metrics: getMetrics(), portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
var permissions_adapter_default = { init, canExecuteIntent, canExecuteIntents, filterAccessibleRules, getDenialReason, isConnected, getCurrentUserInfo, getMetrics, resetMetrics, info, healthCheck, UI_ORCHESTRATOR_EVENTS, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  UI_ORCHESTRATOR_EVENTS,
  VERSION,
  canExecuteIntent,
  canExecuteIntents,
  permissions_adapter_default as default,
  filterAccessibleRules,
  getCurrentUserInfo,
  getDenialReason,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  isConnected,
  resetMetrics
};
