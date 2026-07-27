import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { PERMISSIONS_EVENTS } from "/core/runtime/events/catalog/permissions.events.js";
import { AUTH_EVENTS, AUTH_INTENTS } from "/core/runtime/events/catalog/auth.events.js";
import { routerTelemetry } from "../telemetry/tracker.js";
import { getForbiddenRoute } from "../registry/routes.js";
import { GUARD_POLICIES } from "../registry/definitions/constants.js";
import { AuthGuard, PermissionGuard, LegacyGuard, PermissionsArrayGuard, guardPipeline, runGuardPipeline, getPipelineInfo, getGuardMetrics, resetAllMetrics } from "./guards/pipeline.js";
const VERSION = "10.1.0-P18EC";
const MODULE_ID = "router-guard";
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
function validateEventContracts(throwOnError = false) {
  const checks = {
    authEventsValid: !!AUTH_EVENTS && Object.keys(AUTH_EVENTS).length > 0,
    authIntentsValid: !!AUTH_INTENTS && Object.keys(AUTH_INTENTS).length > 0,
    permissionsEventsValid: !!PERMISSIONS_EVENTS && Object.keys(PERMISSIONS_EVENTS).length > 0
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const valid = passed === total;
  if (!valid && throwOnError) throw new Error("Event contracts validation failed");
  return { valid, score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks };
}
function _log(level, msg, ctx = {}) {
  const logger = _getPort("logger");
  if (!logger || typeof logger[level] !== "function") return;
  logger[level](msg, { component: MODULE_ID, ...ctx });
}
function _emit(event, data = {}) {
  const eventBus = _getPort("eventBus");
  if (eventBus?.emit) {
    eventBus.emit(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
  }
}
function getVersion() {
  return VERSION;
}
let lastCheckPath = null;
let lastCheckTime = null;
let lastCheckReason = null;
let checkCount = 0;
let blockCount = 0;
let enforcementMetrics = {
  evaluated: 0,
  enforced: 0,
  enforcedByDomain: 0,
  enforcedByRoute: 0,
  enforcedByGlobal: 0,
  bypassed: 0,
  bypassedByFeatureFlag: 0,
  failOpenUsed: 0,
  blocks: 0,
  alerts: 0
};
const SYNC_MAX_WAIT = 600;
const SYNC_CHECK_INTERVAL = 50;
function _emitAlert(type, context = {}) {
  enforcementMetrics.alerts++;
  const alertPayload = {
    type,
    path: context.path || lastCheckPath,
    policy: context.policy || null,
    permissionsMode: context.permissionsMode || null,
    enforcement: _getEnforcement(),
    metricsSnapshot: { ...enforcementMetrics },
    timestamp: Date.now()
  };
  _log("warn", `[SECURITY ALERT] ${type}`, alertPayload);
  _emit(PERMISSIONS_EVENTS.ENFORCEMENT_ALERT, alertPayload);
  return alertPayload;
}
function _isEnforcementFeatureFlagEnabled() {
  try {
    const globalState = _getPort("globalState");
    if (globalState?.get) {
      const flags = globalState.get("flags.featureFlags");
      if (flags && typeof flags.permissionsEnforcement === "boolean") {
        return flags.permissionsEnforcement;
      }
    }
  } catch (e) {
    _log("warn", "Failed to get feature flag", { error: e.message });
  }
  return true;
}
function _getEnforcement() {
  try {
    const globalState = _getPort("globalState");
    if (globalState?.get) {
      const enforcement = globalState.get("permissions.enforcement");
      if (enforcement) return enforcement;
    }
  } catch (e) {
    _log("warn", "Failed to get enforcement from GlobalState", { error: e.message });
  }
  return { enabled: false, scope: "global", domains: [], routes: [], failOpen: true };
}
function _getPermissionsMode() {
  const globalState = _getPort("globalState");
  if (globalState?.get) {
    const mode = globalState.get("permissions.mode");
    if (mode) return mode;
  }
  const permissions = _getPort("permissions");
  if (permissions?.getMode) {
    return permissions.getMode();
  }
  return "allow-all";
}
function _matchRoute(path, patterns) {
  if (!path || !Array.isArray(patterns)) return false;
  return patterns.some((pattern) => {
    if (path === pattern) return true;
    if (pattern.endsWith("*")) {
      return path.startsWith(pattern.slice(0, -1));
    }
    return path.startsWith(`${pattern}/`);
  });
}
function _getEffectivePermissionsMode(route) {
  enforcementMetrics.evaluated++;
  if (!_isEnforcementFeatureFlagEnabled()) {
    enforcementMetrics.bypassedByFeatureFlag++;
    _log("debug", "Enforcement bypassed by feature flag");
    return "allow-all";
  }
  let enforcement;
  try {
    enforcement = _getEnforcement();
  } catch (e) {
    _log("warn", "Enforcement check failed, using fail-open", { error: e.message });
    enforcementMetrics.failOpenUsed++;
    _emitAlert("fail-open", { path: route?.path, reason: "enforcement-check-error" });
    return "allow-all";
  }
  if (!enforcement.enabled) {
    enforcementMetrics.bypassed++;
    return "allow-all";
  }
  const path = route?.path || "";
  const domain = route?.domain || null;
  let shouldEnforce = false;
  let reason = "disabled";
  let scopeType = null;
  try {
    switch (enforcement.scope) {
      case "global":
        shouldEnforce = true;
        reason = "global-scope";
        scopeType = "global";
        break;
      case "domain":
        if (domain && Array.isArray(enforcement.domains) && enforcement.domains.includes(domain)) {
          shouldEnforce = true;
          reason = `domain:${domain}`;
          scopeType = "domain";
        }
        break;
      case "route":
        if (path && Array.isArray(enforcement.routes)) {
          shouldEnforce = _matchRoute(path, enforcement.routes);
          if (shouldEnforce) {
            reason = `route:${path}`;
            scopeType = "route";
          }
        }
        break;
      default:
        shouldEnforce = false;
        reason = "unknown-scope";
    }
  } catch (e) {
    if (enforcement.failOpen !== false) {
      _log("warn", "Enforcement logic error, using fail-open", { error: e.message, path });
      enforcementMetrics.failOpenUsed++;
      _emitAlert("fail-open", { path, reason: "enforcement-logic-error" });
      return "allow-all";
    }
    throw e;
  }
  if (shouldEnforce) {
    enforcementMetrics.enforced++;
    if (scopeType === "global") enforcementMetrics.enforcedByGlobal++;
    if (scopeType === "domain") enforcementMetrics.enforcedByDomain++;
    if (scopeType === "route") enforcementMetrics.enforcedByRoute++;
  } else {
    enforcementMetrics.bypassed++;
  }
  _emit(PERMISSIONS_EVENTS.ENFORCEMENT_DECISION, {
    path,
    domain,
    policy: route?.guardPolicy || null,
    permissionsMode: shouldEnforce ? "enforce" : "allow-all",
    enforced: shouldEnforce,
    reason,
    scope: enforcement.scope,
    scopeType,
    failOpen: enforcement.failOpen
  });
  return shouldEnforce ? "enforce" : "allow-all";
}
function resolveGuardPolicy(route) {
  if (route.public === true) return GUARD_POLICIES.PUBLIC;
  if (route.guardPolicy && Object.values(GUARD_POLICIES).includes(route.guardPolicy)) return route.guardPolicy;
  const hasPermissions = route.permissions?.length > 0;
  const hasMinLevel = route.minLevel > 0;
  const hasUarpsMapping = PermissionGuard.routeTriggerMap?.[route.path] || PermissionGuard.routeTriggerMap?.[route.id];
  if (hasUarpsMapping) return GUARD_POLICIES.UARPS;
  if (hasPermissions && !hasMinLevel) return GUARD_POLICIES.PERMISSIONS;
  if (hasMinLevel && !hasPermissions) return GUARD_POLICIES.LEGACY;
  if (hasPermissions && hasMinLevel) return GUARD_POLICIES.HYBRID;
  return route.requiresAuth ? GUARD_POLICIES.HYBRID : GUARD_POLICIES.PUBLIC;
}
function _getAuth() {
  return _getPort("auth") || (hasWindow ? window.AuthAdapter || window.CoreAuthAdapter : null);
}
function isPermissionsSynced() {
  const auth = _getAuth();
  if (!auth?.isReady?.()) return false;
  const level = auth?.getLevel?.() ?? 0;
  const caps = auth?.getCapabilities?.() ?? [];
  const roles = auth?.getRoles?.() ?? [];
  return level > 0 || caps.length > 0 || roles.length > 0 && !roles.every((r) => r === "guest");
}
async function waitForPermissionsSync(maxWait = SYNC_MAX_WAIT, permissionsMode = "allow-all") {
  if (permissionsMode === "allow-all") {
    _log("debug", "Mode allow-all - skipping sync wait");
    return true;
  }
  const readyFlags = _getPort("readyFlags");
  if (readyFlags?.waitFor) {
    const rfReady = await readyFlags.waitFor("permissions", maxWait);
    if (rfReady) {
      _log("info", "ReadyFlags.permissions ready");
      return true;
    }
  }
  const startTime = Date.now();
  while (Date.now() - startTime < maxWait) {
    if (isPermissionsSynced()) {
      _log("info", "Auth sincronizado via Ports", { waitTime: Date.now() - startTime });
      return true;
    }
    await new Promise((r) => setTimeout(r, SYNC_CHECK_INTERVAL));
  }
  _log("warn", "Timeout aguardando permissions sync", { waited: maxWait, mode: permissionsMode });
  return false;
}
const RouteGuard = {
  injectPorts,
  getPorts,
  isAuthenticated() {
    return AuthGuard.isAuthenticated();
  },
  isPermissionsSynced() {
    return isPermissionsSynced();
  },
  async waitForPermissionsSync(maxWait) {
    return waitForPermissionsSync(maxWait);
  },
  resolveGuardPolicy(route) {
    return resolveGuardPolicy(route);
  },
  getPermissionsMode() {
    return _getPermissionsMode();
  },
  getEffectivePermissionsMode(route) {
    return _getEffectivePermissionsMode(route);
  },
  getEnforcement() {
    return _getEnforcement();
  },
  isEnforcementFeatureFlagEnabled() {
    return _isEnforcementFeatureFlagEnabled();
  },
  getUserLevelDirect() {
    return LegacyGuard.getUserLevel();
  },
  getUserLevel() {
    return LegacyGuard.getUserLevel();
  },
  hasMinLevel(requiredLevel) {
    if (!requiredLevel || requiredLevel === 0) return true;
    return LegacyGuard.getUserLevel() >= requiredLevel;
  },
  hasPermission(requiredPermissions) {
    return PermissionsArrayGuard.hasPermission(requiredPermissions);
  },
  getUserRoles() {
    return PermissionsArrayGuard.getUserRoles();
  },
  getUserPermissions() {
    return PermissionsArrayGuard.getUserCapabilities();
  },
  async checkRoute(route) {
    checkCount++;
    lastCheckPath = route?.path || null;
    lastCheckTime = Date.now();
    const contractsValidation = validateEventContracts(false);
    const authReady = AuthGuard.isReady();
    let permissionsMode;
    try {
      permissionsMode = _getEffectivePermissionsMode(route);
    } catch (e) {
      const enforcement = _getEnforcement();
      if (enforcement.failOpen !== false) {
        _log("error", "Critical enforcement error, using fail-open", { error: e.message });
        enforcementMetrics.failOpenUsed++;
        _emitAlert("fail-open", { path: route?.path, reason: "critical-error" });
        permissionsMode = "allow-all";
      } else {
        throw e;
      }
    }
    if (!route) {
      lastCheckReason = "invalid-route";
      return { allowed: false, reason: "invalid-route", redirect: "/", details: null, authAvailable: authReady, contractsValid: contractsValidation.valid, policy: null, permissionsMode, enforcement: _getEnforcement(), _pipeline: { policy: null, permissionsMode } };
    }
    const policy = resolveGuardPolicy(route);
    _log("debug", "Route policy resolved", { path: route.path, policy, permissionsMode });
    const needsSync = route.minLevel > 0 || route.permissions?.length > 0 || route.requiresAuth === true;
    if (needsSync && AuthGuard.isAuthenticated() && !isPermissionsSynced()) {
      _log("info", "Auth OK mas n\xE3o sincronizado, aguardando...", { path: route.path, mode: permissionsMode });
      const synced = await waitForPermissionsSync(SYNC_MAX_WAIT, permissionsMode);
      if (!synced && permissionsMode === "enforce" && (route.minLevel > 0 || route.permissions?.length > 0)) {
        blockCount++;
        enforcementMetrics.blocks++;
        lastCheckReason = "sync-timeout-blocked";
        _emitAlert("block", { path: route.path, policy, permissionsMode, reason: "sync-timeout" });
        const forbiddenRoute = getForbiddenRoute();
        return { allowed: false, reason: "forbidden", redirect: forbiddenRoute?.path || "/forbidden", details: { type: "sync-timeout-security-block", mode: permissionsMode }, authAvailable: authReady, contractsValid: contractsValidation.valid, policy, permissionsMode, enforcement: _getEnforcement(), _pipeline: { policy, permissionsMode, blockedBy: "sync-timeout" } };
      }
    }
    const pipelineResult = await runGuardPipeline(route, { authReady, policy, permissionsMode });
    if (!pipelineResult.allowed) {
      blockCount++;
      if (permissionsMode === "enforce") {
        enforcementMetrics.blocks++;
        _emitAlert("block", { path: route.path, policy, permissionsMode, reason: pipelineResult.reason, blockedBy: pipelineResult.blockedBy });
      }
      lastCheckReason = pipelineResult.reason;
      if (pipelineResult.reason === "unauthenticated") {
        this.emitAuthRequired(route.path, "route-guard");
      }
      try {
        routerTelemetry.trackGuardBlock(route, pipelineResult.reason);
      } catch (e) {
      }
      return { allowed: false, reason: pipelineResult.reason, redirect: pipelineResult.redirect, details: pipelineResult.details, authAvailable: authReady, contractsValid: contractsValidation.valid, policy, permissionsMode, enforcement: _getEnforcement(), _pipeline: { blockedBy: pipelineResult.blockedBy, results: pipelineResult.pipelineResults, policy, permissionsMode } };
    }
    lastCheckReason = "ok";
    return { allowed: true, reason: "ok", redirect: null, details: null, authAvailable: authReady, contractsValid: contractsValidation.valid, policy, permissionsMode, enforcement: _getEnforcement(), _pipeline: { results: pipelineResult.pipelineResults, policy, permissionsMode } };
  },
  emitAuthRequired(attemptedRoute, reason) {
    try {
      if (AUTH_EVENTS?.LOGIN_REQUIRED) {
        _emit(AUTH_INTENTS.LOGIN, { reason, attemptedRoute });
      }
    } catch (error) {
      _log("warn", `Failed to emit auth required: ${error.message}`);
    }
  },
  onAuthChange(callback) {
    const eventBus = _getPort("eventBus");
    if (!eventBus) return () => {
    };
    const cleanups = [];
    try {
      if (AUTH_EVENTS?.LOGIN_SUCCESS) {
        const h = (data) => {
          try {
            callback(true, data);
          } catch (e) {
          }
        };
        eventBus.on(AUTH_EVENTS.LOGIN_SUCCESS, h);
        cleanups.push(() => {
          try {
            eventBus.off(AUTH_EVENTS.LOGIN_SUCCESS, h);
          } catch (e) {
          }
        });
      }
      if (AUTH_EVENTS?.LOGOUT) {
        const h = (data) => {
          try {
            callback(false, data);
          } catch (e) {
          }
        };
        eventBus.on(AUTH_EVENTS.LOGOUT, h);
        cleanups.push(() => {
          try {
            eventBus.off(AUTH_EVENTS.LOGOUT, h);
          } catch (e) {
          }
        });
      }
      if (AUTH_EVENTS?.LOGOUT_SUCCESS) {
        const h = (data) => {
          try {
            callback(false, data);
          } catch (e) {
          }
        };
        eventBus.on(AUTH_EVENTS.LOGOUT_SUCCESS, h);
        cleanups.push(() => {
          try {
            eventBus.off(AUTH_EVENTS.LOGOUT_SUCCESS, h);
          } catch (e) {
          }
        });
      }
      if (AUTH_EVENTS?.SESSION_CHECKED) {
        const h = (data) => {
          try {
            callback(data?.authenticated === true, data);
          } catch (e) {
          }
        };
        eventBus.on(AUTH_EVENTS.SESSION_CHECKED, h);
        cleanups.push(() => {
          try {
            eventBus.off(AUTH_EVENTS.SESSION_CHECKED, h);
          } catch (e) {
          }
        });
      }
    } catch (error) {
      _log("warn", `Failed to setup auth listeners: ${error.message}`);
    }
    return () => {
      cleanups.forEach((cleanup) => {
        try {
          cleanup();
        } catch (e) {
        }
      });
    };
  },
  getGuards() {
    return { AuthGuard, PermissionGuard, LegacyGuard, PermissionsArrayGuard };
  },
  getPipelineInfo() {
    return getPipelineInfo();
  },
  getGuardMetrics() {
    return getGuardMetrics();
  },
  getEnforcementMetrics() {
    return { ...enforcementMetrics };
  },
  GUARD_POLICIES,
  getStatus() {
    const contractsValidation = validateEventContracts(false);
    const authReady = AuthGuard.isReady();
    const uarpsAvailable = PermissionGuard.isAvailable();
    const permissionsMode = _getPermissionsMode();
    const enforcement = _getEnforcement();
    const auth = _getAuth();
    return { version: VERSION, moduleId: MODULE_ID, isAuthenticated: AuthGuard.isAuthenticated(), userLevel: LegacyGuard.getUserLevel(), userRoles: PermissionsArrayGuard.getUserRoles(), permissionsSynced: isPermissionsSynced(), permissionsMode, enforcement, featureFlagEnabled: _isEnforcementFeatureFlagEnabled(), authAvailable: authReady, uarpsAvailable, contractsValid: contractsValidation.valid, contractsScore: contractsValidation.scoreDisplay, authSource: "PortsPattern", authPortAvailable: !!auth, lastCheck: { path: lastCheckPath, time: lastCheckTime, reason: lastCheckReason }, metrics: { checkCount, blockCount }, enforcementMetrics: { ...enforcementMetrics }, pipeline: this.getPipelineInfo(), guardMetrics: this.getGuardMetrics(), portsStatus: { initialized: Ports.isInitialized() } };
  },
  healthCheck() {
    const authReady = AuthGuard.isReady();
    const uarpsAvailable = PermissionGuard.isAvailable();
    const guardMetrics = this.getGuardMetrics();
    const legacyUsage = guardMetrics.legacy.minLevelUsage;
    const permissionsMode = _getPermissionsMode();
    const enforcement = _getEnforcement();
    const auth = _getAuth();
    let status = "HEALTHY";
    let warnings = [];
    if (legacyUsage > 0) {
      status = "DEGRADED";
      warnings.push(`LEGACY_MINLEVEL: ${legacyUsage} checks using deprecated minLevel`);
    }
    if (enforcementMetrics.failOpenUsed > 0) {
      warnings.push(`FAIL_OPEN: ${enforcementMetrics.failOpenUsed} times used due to errors`);
    }
    if (enforcementMetrics.blocks > 0) {
      warnings.push(`BLOCKS: ${enforcementMetrics.blocks} routes blocked by enforcement`);
    }
    if (enforcementMetrics.alerts > 0) {
      warnings.push(`ALERTS: ${enforcementMetrics.alerts} security alerts emitted`);
    }
    return { status, moduleId: MODULE_ID, version: VERSION, permissionsMode, enforcement: { enabled: enforcement.enabled, scope: enforcement.scope, failOpen: enforcement.failOpen, featureFlagEnabled: _isEnforcementFeatureFlagEnabled() }, checks: { authGuardReady: authReady, permissionGuardReady: uarpsAvailable, legacyGuardDeprecated: true, pipelineConfigured: guardPipeline.length === 4, modeAwareSync: true, enforcementConfigured: true, featureFlagConfigured: true, portsInitialized: Ports.isInitialized(), authPortAvailable: !!auth }, warnings: warnings.length > 0 ? warnings : null };
  },
  getVersion() {
    return VERSION;
  },
  resetMetrics() {
    checkCount = 0;
    blockCount = 0;
    lastCheckPath = null;
    lastCheckTime = null;
    lastCheckReason = null;
    enforcementMetrics = { evaluated: 0, enforced: 0, enforcedByDomain: 0, enforcedByRoute: 0, enforcedByGlobal: 0, bypassed: 0, bypassedByFeatureFlag: 0, failOpenUsed: 0, blocks: 0, alerts: 0 };
    resetAllMetrics();
  },
  info() {
    const auth = _getAuth();
    return { moduleId: MODULE_ID, version: VERSION, permissionsMode: _getPermissionsMode(), enforcement: _getEnforcement(), featureFlagEnabled: _isEnforcementFeatureFlagEnabled(), enforcementMetrics: { ...enforcementMetrics }, pipeline: this.getPipelineInfo(), guardMetrics: this.getGuardMetrics(), guardPolicies: GUARD_POLICIES, authPortAvailable: !!auth, portsInitialized: Ports.isInitialized() };
  }
};
if (hasWindow) {
  window.__dev = window.__dev || {};
  window.__dev.router = {
    getStatus: () => RouteGuard.getStatus(),
    getMetrics: () => ({ check: { count: checkCount, blocks: blockCount }, enforcement: { ...enforcementMetrics }, guards: RouteGuard.getGuardMetrics() }),
    getGuardStatus: () => RouteGuard.healthCheck(),
    getEnforcementMetrics: () => RouteGuard.getEnforcementMetrics(),
    getEnforcement: () => RouteGuard.getEnforcement(),
    getPermissionsMode: () => RouteGuard.getPermissionsMode(),
    getPorts: () => RouteGuard.getPorts(),
    resetMetrics: () => RouteGuard.resetMetrics(),
    checkRoute: (route) => RouteGuard.checkRoute(route),
    version: VERSION
  };
  _log("info", "window.__dev.router exposed for DevTools");
}
var guard_default = RouteGuard;
export {
  AuthGuard,
  GUARD_POLICIES,
  LegacyGuard,
  MODULE_ID,
  PermissionGuard,
  PermissionsArrayGuard,
  RouteGuard,
  VERSION,
  guard_default as default,
  getPorts,
  getVersion,
  injectPorts,
  validateEventContracts
};
