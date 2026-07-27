import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { AuthGuard } from "./auth-guard.js";
import { PermissionGuard } from "./permission-guard.js";
import { LegacyGuard } from "./legacy-guard.js";
import { PermissionsArrayGuard } from "./permissions-array-guard.js";
import { GUARD_POLICIES } from "/components/router/registry/definitions/constants.js";
const MODULE_ID = "router.core.guards.pipeline";
const VERSION = "1.5.0-P25";
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
const guardPipeline = [AuthGuard, PermissionGuard, LegacyGuard, PermissionsArrayGuard].sort((a, b) => a.order - b.order);
function getActiveGuardsForPolicy(policy) {
  if (policy === GUARD_POLICIES.PUBLIC) return { auth: false, uarps: false, legacy: false, permissions: false };
  if (policy === GUARD_POLICIES.UARPS) return { auth: true, uarps: true, legacy: false, permissions: false };
  if (policy === GUARD_POLICIES.PERMISSIONS) return { auth: true, uarps: false, legacy: false, permissions: true };
  if (policy === GUARD_POLICIES.LEGACY) return { auth: true, uarps: false, legacy: true, permissions: false };
  if (policy === GUARD_POLICIES.HYBRID) return { auth: true, uarps: true, legacy: true, permissions: true };
  return { auth: true, uarps: true, legacy: true, permissions: true };
}
function getGuardKey(guardName) {
  const map = { "AuthGuard": "auth", "PermissionGuard": "uarps", "LegacyGuard": "legacy", "PermissionsArrayGuard": "permissions" };
  return map[guardName] || null;
}
function runGuardPipeline(route, context) {
  if (!context) context = {};
  const results = [];
  const policy = context.policy || null;
  const permissionsMode = context.permissionsMode || "allow-all";
  const activeGuards = getActiveGuardsForPolicy(policy);
  _log("debug", "[Pipeline] Starting", { policy, permissionsMode, activeGuards });
  let i = 0;
  function runNext() {
    if (i >= guardPipeline.length) {
      return Promise.resolve({ allowed: true, reason: "ok", redirect: null, details: null, pipelineResults: results, policy, permissionsMode });
    }
    const guard = guardPipeline[i++];
    const guardKey = getGuardKey(guard.name);
    const isActive = activeGuards[guardKey] !== false;
    if (!isActive && policy !== null) {
      const skipResult = { passed: true, reason: "skipped-by-policy", guard: guard.name, skipped: true, policy, permissionsMode };
      if (guard.metrics && typeof guard.metrics.skippedByPolicy === "number") {
        guard.metrics.skippedByPolicy++;
      }
      results.push(skipResult);
      return runNext();
    }
    return Promise.resolve().then(() => guard.check(route, Object.assign({}, context, { policy, permissionsMode }))).then((result) => {
      result.policy = policy;
      result.permissionsMode = permissionsMode;
      result.guard = result.guard || guard.name;
      results.push(result);
      if (!result.passed && !result.skipped) {
        _log("debug", "[Pipeline] Guard blocked", { guard: guard.name, reason: result.reason, policy, permissionsMode });
        return { allowed: false, reason: result.reason, redirect: result.redirect, details: result.details, blockedBy: guard.name, pipelineResults: results, policy, permissionsMode };
      }
      return runNext();
    }).catch((error) => {
      _log("error", "[Pipeline] Guard error", { guard: guard.name, error: error.message });
      const errorResult = { passed: false, reason: "guard-error", guard: guard.name, details: { error: error.message }, policy, permissionsMode };
      results.push(errorResult);
      return { allowed: false, reason: "guard-error", redirect: "/forbidden", details: { guard: guard.name, error: error.message }, blockedBy: guard.name, pipelineResults: results, policy, permissionsMode };
    });
  }
  return runNext();
}
function getPipelineInfo() {
  return guardPipeline.map((g) => ({
    name: g.name,
    order: g.order,
    deprecated: g.deprecated || false,
    version: g.version || "1.0.0"
  }));
}
function getGuardMetrics() {
  return { auth: Object.assign({}, AuthGuard.metrics), uarps: Object.assign({}, PermissionGuard.metrics), legacy: Object.assign({}, LegacyGuard.metrics), permissions: Object.assign({}, PermissionsArrayGuard.metrics) };
}
function resetAllMetrics() {
  AuthGuard.resetMetrics();
  PermissionGuard.resetMetrics();
  LegacyGuard.resetMetrics();
  PermissionsArrayGuard.resetMetrics();
}
function healthCheck() {
  const checks = { pipelineConfigured: guardPipeline.length > 0, portsInitialized: Ports.isInitialized(), allGuardsAvailable: !!(AuthGuard && PermissionGuard && LegacyGuard && PermissionsArrayGuard) };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, guardsCount: guardPipeline.length, p25Compliant: true, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, guardsCount: guardPipeline.length, guards: getPipelineInfo(), p25Compliant: true };
}
export {
  AuthGuard,
  GUARD_POLICIES,
  LegacyGuard,
  MODULE_ID,
  PermissionGuard,
  PermissionsArrayGuard,
  VERSION,
  getGuardMetrics,
  getPipelineInfo,
  getPorts,
  guardPipeline,
  healthCheck,
  info,
  injectPorts,
  resetAllMetrics,
  runGuardPipeline
};
