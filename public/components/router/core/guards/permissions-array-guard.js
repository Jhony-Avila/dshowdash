import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { GUARD_POLICIES, PERMISSION_GRAMMAR } from "/components/router/registry/definitions/constants.js";
const MODULE_ID = "router.core.guards.permissions-array-guard";
const VERSION = "1.6.0-P25";
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
function _getAuth() {
  if (hasWindow) {
    return window.AuthAdapter || window.CoreAuthAdapter || null;
  }
  return null;
}
let metrics = { checks: 0, blocks: 0, legacyMappings: 0, skippedByPolicy: 0, bypassedByMode: 0 };
function parsePermission(perm) {
  if (!perm || typeof perm !== "string") return null;
  const CAP = PERMISSION_GRAMMAR && PERMISSION_GRAMMAR.CAPABILITY_PREFIX || "cap:";
  const ROLE = PERMISSION_GRAMMAR && PERMISSION_GRAMMAR.ROLE_PREFIX || "role:";
  const LEVEL = PERMISSION_GRAMMAR && PERMISSION_GRAMMAR.LEVEL_PREFIX || "level:";
  if (perm.indexOf(CAP) === 0) {
    return { type: "capability", value: perm.slice(CAP.length) };
  }
  if (perm.indexOf(ROLE) === 0) {
    return { type: "role", value: perm.slice(ROLE.length) };
  }
  if (perm.indexOf(LEVEL) === 0) {
    return { type: "level", value: parseInt(perm.slice(LEVEL.length), 10) };
  }
  metrics.legacyMappings++;
  if (perm.indexOf(":") !== -1) {
    return { type: "capability", value: perm };
  }
  return { type: "role", value: perm };
}
function checkSinglePermission(parsed) {
  if (!parsed) return false;
  const auth = _getAuth();
  if (parsed.type === "role") {
    const userRoles = auth && auth.getRoles ? auth.getRoles() : [];
    return userRoles.indexOf(parsed.value) !== -1;
  }
  if (parsed.type === "capability") {
    if (auth && auth.can) {
      return auth.can(parsed.value);
    }
    const caps = auth && auth.getCapabilities ? auth.getCapabilities() : [];
    return caps.indexOf(parsed.value) !== -1;
  }
  if (parsed.type === "level") {
    const userLevel = auth && auth.getLevel ? auth.getLevel() : 0;
    return userLevel >= parsed.value;
  }
  return false;
}
function hasPermission(permissions) {
  if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
    return true;
  }
  for (let i = 0; i < permissions.length; i++) {
    const parsed = parsePermission(permissions[i]);
    if (checkSinglePermission(parsed)) return true;
  }
  return false;
}
const PermissionsArrayGuard = {
  name: "PermissionsArrayGuard",
  order: 4,
  version: VERSION,
  metrics,
  getUserRoles() {
    const auth = _getAuth();
    return auth && auth.getRoles ? auth.getRoles() : [];
  },
  getUserCapabilities() {
    const auth = _getAuth();
    return auth && auth.getCapabilities ? auth.getCapabilities() : [];
  },
  hasPermission,
  check(route, context) {
    if (!context) context = {};
    metrics.checks++;
    const policy = context.policy;
    const permissionsMode = context.permissionsMode || "allow-all";
    if (permissionsMode === "allow-all") {
      metrics.bypassedByMode++;
      _log("debug", "[PermissionsArrayGuard] Bypassed by allow-all mode");
      return Promise.resolve({ passed: true, reason: "bypassed-by-mode", guard: this.name, skipped: true, policy, permissionsMode });
    }
    if (policy && policy !== GUARD_POLICIES.PERMISSIONS && policy !== GUARD_POLICIES.HYBRID) {
      metrics.skippedByPolicy++;
      _log("debug", "[PermissionsArrayGuard] Skipped by policy", { policy });
      return Promise.resolve({ passed: true, reason: "skipped-by-policy", guard: this.name, skipped: true, policy, permissionsMode });
    }
    const permissions = route ? route.permissions : null;
    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
      return Promise.resolve({ passed: true, reason: "no-permissions-required", guard: this.name, policy, permissionsMode });
    }
    const hasAccess = hasPermission(permissions);
    if (!hasAccess) {
      metrics.blocks++;
      _log("debug", "[PermissionsArrayGuard] Blocked", { permissions, policy, permissionsMode });
      return Promise.resolve({ passed: false, reason: "insufficient-permissions", redirect: "/forbidden", guard: this.name, details: { required: permissions }, policy, permissionsMode });
    }
    return Promise.resolve({ passed: true, reason: "permissions-ok", guard: this.name, policy, permissionsMode });
  },
  resetMetrics() {
    metrics = { checks: 0, blocks: 0, legacyMappings: 0, skippedByPolicy: 0, bypassedByMode: 0 };
    this.metrics = metrics;
  },
  healthCheck() {
    const checks = { portsInitialized: Ports.isInitialized(), authAdapterAvailable: !!_getAuth() };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed >= 1 ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, metrics, p25Compliant: true, timestamp: Date.now() };
  },
  info() {
    return { moduleId: MODULE_ID, version: VERSION, metrics, p25Compliant: true };
  }
};
var permissions_array_guard_default = PermissionsArrayGuard;
export {
  MODULE_ID,
  PermissionsArrayGuard,
  VERSION,
  permissions_array_guard_default as default,
  getPorts,
  injectPorts
};
