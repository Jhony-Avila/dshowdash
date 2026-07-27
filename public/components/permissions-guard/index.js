import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
import { AUTH_EVENTS, AUTH_STATES } from "/core/runtime/events/catalog/auth.events.js";
import { PERMISSIONS_EVENTS } from "/core/runtime/events/catalog/permissions.events.js";
import { permissionsStore } from "./state/store.js";
import { PermissionChecker } from "./core/checker.js";
import { PolicyManager as _PolicyManager } from "./core/policies.js";
import { PermissionsLifecycle as _PermissionsLifecycle } from "./core/lifecycle.js";
const PolicyManager = _PolicyManager;
const PermissionsLifecycle = _PermissionsLifecycle;
import * as Tracker from "./telemetry/tracker.js";
import * as Helpers from "./utils/helpers.js";
import { RESOURCES, ACTIONS, ROLES, LEVELS, buildResourceAction, parseResourceAction, isKnownRole, getRoleLevel } from "./core/contract.js";
import { getRoutePolicy, isPublicRoute, getProtectedRoutes, getPublicRoutes, getAllRoutes, registerRoute, validateRoutePolicies } from "./registry/routes.js";
import { getModulePolicy, getModuleActionPolicy, isPublicModule, getAllModules, getModulesByLevel, registerModule, validateModulePolicies } from "./registry/modules.js";
import { setupGlobalStateIntegration, cleanupGlobalStateIntegration, setupOrchestratorIntegration, cleanupOrchestratorIntegration, _integrationsStatus, getIntegrationsStatus } from "./core/integrations.js";
import { canAccessRoute, canAccessModuleAction } from "./core/access-checks.js";
import { info as diagnosticsInfo, healthCheck as diagnosticsHealthCheck, createDebugObject } from "./core/diagnostics.js";
const VERSION = "5.6.0-P2-ENTERPRISE";
const MODULE_ID = "permissions-guard";
const validateSessionShape = (session) => {
  if (!session || typeof session !== "object") return { valid: false, reason: "session must be object" };
  if (typeof session.isAuthenticated !== "boolean") return { valid: false, reason: "isAuthenticated must be boolean" };
  return { valid: true };
};
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _metrics = { initAttempts: 0, forceReinits: 0, permissionChecks: 0 };
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  const debug = _getPort("config")?.app?.debug;
  if (level === "error") logger.error?.(`[${MODULE_ID}]`, ...args);
  else if (level === "warn") logger.warn?.(`[${MODULE_ID}]`, ...args);
  else if (level === "info") logger.info?.(`[${MODULE_ID}]`, ...args);
  else if (debug) logger.debug?.(`[${MODULE_ID}]`, ...args);
};
const PermissionsGuard = {
  version: VERSION,
  name: MODULE_ID,
  moduleId: MODULE_ID,
  init: (options = {}) => {
    _metrics.initAttempts++;
    _initPorts();
    if (options.force) {
      _metrics.forceReinits++;
      _log("info", "Force reinit: limpando integra\xE7\xF5es antes de reinicializar");
      cleanupGlobalStateIntegration();
      cleanupOrchestratorIntegration();
    }
    const result = PermissionsLifecycle.init(options);
    let globalStateConnected = false;
    let orchestratorConnected = false;
    if (result.ok && !result.alreadyInitialized) {
      globalStateConnected = setupGlobalStateIntegration();
      orchestratorConnected = setupOrchestratorIntegration();
    } else if (result.ok && result.alreadyInitialized) {
      globalStateConnected = _integrationsStatus.globalStateConnected;
      orchestratorConnected = _integrationsStatus.orchestratorConnected;
    }
    return { ...result, integrations: { globalStateConnected, orchestratorConnected } };
  },
  shutdown: () => {
    cleanupGlobalStateIntegration();
    cleanupOrchestratorIntegration();
    return PermissionsLifecycle.shutdown();
  },
  destroy: () => PermissionsGuard.shutdown(),
  reset: () => PermissionsLifecycle.reset(),
  isInitialized: () => PermissionsLifecycle.isInitialized(),
  isDegraded: () => PermissionsLifecycle.isDegraded(),
  injectPorts,
  getPorts,
  syncFromGlobalState: (session) => PermissionsLifecycle.syncFromGlobalState(session),
  loadFromUser: (user) => PermissionsLifecycle.loadFromUser(user),
  validateSession: (session) => validateSessionShape(session),
  can: (action) => {
    _metrics.permissionChecks++;
    return PermissionChecker.can(action);
  },
  canAll: (actions) => PermissionChecker.canAll(actions),
  canAny: (actions) => PermissionChecker.canAny(actions),
  hasRole: (role) => PermissionChecker.hasRole(role),
  hasAnyRole: (roles) => PermissionChecker.hasAnyRole(roles),
  hasAllRoles: (roles) => PermissionChecker.hasAllRoles(roles),
  hasCapability: (cap) => PermissionChecker.hasCapability(cap),
  hasAnyCapability: (caps) => PermissionChecker.hasAnyCapability(caps),
  hasAllCapabilities: (caps) => PermissionChecker.hasAllCapabilities(caps),
  isAtLeastLevel: (level) => PermissionChecker.isAtLeastLevel(level),
  guard: (action, onDenied) => PermissionChecker.guard(action, onDenied),
  createGuard: (action) => PermissionChecker.createGuard(action),
  canAccessRoute,
  getRoutePolicy,
  isPublicRoute,
  getProtectedRoutes,
  getPublicRoutes,
  getAllRoutes,
  registerRoute,
  validateRoutePolicies,
  canAccessModuleAction,
  getModulePolicy,
  getModuleActionPolicy,
  isPublicModule,
  getAllModules,
  getModulesByLevel,
  registerModule,
  validateModulePolicies,
  getRoles: () => permissionsStore.getRoles(),
  setRoles: (roles) => permissionsStore.setRoles(Helpers.normalizeRoles(roles)),
  getCapabilities: () => permissionsStore.getCapabilities(),
  setCapabilities: (caps) => permissionsStore.setCapabilities(Helpers.normalizeCapabilities(caps)),
  getScopes: () => permissionsStore.getScopes(),
  setScopes: (scopes) => permissionsStore.setScopes(scopes),
  getUserLevel: () => permissionsStore.getUserLevel(),
  setUserLevel: (level) => permissionsStore.setUserLevel(level),
  registerPolicy: (action, policy) => PolicyManager.register(action, policy),
  unregisterPolicy: (action) => PolicyManager.unregister(action),
  getPolicy: (action) => PolicyManager.get(action),
  listPolicies: () => PolicyManager.list(),
  getPolicies: () => PolicyManager.list(),
  setMode: (mode) => PolicyManager.setMode(mode),
  getMode: () => PolicyManager.getMode(),
  RESOURCES,
  ACTIONS,
  ROLES,
  LEVELS,
  AUTH_EVENTS,
  AUTH_STATES,
  PERMISSIONS_EVENTS,
  buildResourceAction,
  parseResourceAction,
  isKnownRole,
  getRoleLevel,
  getVersion: () => VERSION,
  status: () => PermissionsLifecycle.getStatus(),
  info: () => ({ ...diagnosticsInfo(), portsInitialized: Ports.isInitialized() }),
  healthCheck: () => ({ ...diagnosticsHealthCheck(), portsInitialized: Ports.isInitialized() }),
  debug: createDebugObject()
};
if (typeof window !== "undefined") {
  window.__dev = window.__dev || {};
  window.__dev.permissionsGuard = { getVersion: () => VERSION, info: () => PermissionsGuard.info(), healthCheck: () => PermissionsGuard.healthCheck(), getMetrics: () => ({ ..._metrics }), getIntegrationsStatus: () => getIntegrationsStatus(), getStoreInfo: () => permissionsStore.info(), getCheckerInfo: () => PermissionChecker.info(), getPoliciesInfo: () => PolicyManager.info(), debug: PermissionsGuard.debug };
  if (!isStrict()) {
    window.PermissionsGuard = PermissionsGuard;
    window.PermissionsGuardVersion = VERSION;
    Tracker.track("permissions:global:exposed", { version: VERSION });
  } else {
    recordViolation("GLOBAL_EXPOSURE_BLOCKED", { module: MODULE_ID, target: "window.PermissionsGuard, window.PermissionsGuardVersion" });
  }
}
var permissions_guard_default = PermissionsGuard;
export {
  ACTIONS,
  AUTH_EVENTS,
  AUTH_STATES,
  LEVELS,
  MODULE_ID,
  PERMISSIONS_EVENTS,
  PermissionChecker,
  PermissionsGuard,
  PermissionsLifecycle,
  PolicyManager,
  RESOURCES,
  ROLES,
  VERSION,
  buildResourceAction,
  permissions_guard_default as default,
  getPorts,
  injectPorts,
  parseResourceAction,
  permissionsStore
};
