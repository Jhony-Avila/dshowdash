// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.6.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.permissions-guard
// PURPOSE: Permissions guard with role/capability/level checking and policy management
// ───────────────────────────────────────────────────────────────
// @contract INIT - init(options) initializes permissions guard
// @contract SHUTDOWN - shutdown() shuts down permissions guard
// @contract RESET - reset() resets permissions guard
// @contract CAN - can(action) checks single permission
// @contract CAN_ALL - canAll(actions) checks all permissions
// @contract CAN_ANY - canAny(actions) checks any permission
// @contract HAS_ROLE - hasRole(role) checks role
// @contract HAS_ANY_ROLE - hasAnyRole(roles) checks any role
// @contract HAS_ALL_ROLES - hasAllRoles(roles) checks all roles
// @contract HAS_CAPABILITY - hasCapability(cap) checks capability
// @contract IS_AT_LEAST_LEVEL - isAtLeastLevel(level) checks user level
// @contract GUARD - guard(action, onDenied) creates guard function
// @contract REGISTER_POLICY - registerPolicy(action, policy) registers policy
// @contract CAN_ACCESS_ROUTE - canAccessRoute(route) checks route access
// @contract CAN_ACCESS_MODULE - canAccessModuleAction(module, action) checks module access
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// IMPORTS: isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
// IMPORTS: AUTH_EVENTS, AUTH_STATES, PERMISSIONS_EVENTS from /core/runtime/events/index.js
// IMPORTS: permissionsStore from ./state/store.js
// IMPORTS: PermissionChecker from ./core/checker.js
// IMPORTS: PolicyManager from ./core/policies.js
// IMPORTS: PermissionsLifecycle from ./core/lifecycle.js
// IMPORTS: Tracker from ./telemetry/tracker.js
// IMPORTS: Helpers from ./utils/helpers.js
// IMPORTS: RESOURCES, ACTIONS, ROLES, LEVELS from ./core/contract.js
// IMPORTS: route registry functions from ./registry/routes.js
// IMPORTS: module registry functions from ./registry/modules.js
// IMPORTS: integrations from ./core/integrations.js
// IMPORTS: access-checks from ./core/access-checks.js
// IMPORTS: diagnostics from ./core/diagnostics.js
// PROVIDES: PermissionsGuard, permissionsStore, PermissionChecker, PolicyManager,
//           PermissionsLifecycle, RESOURCES, ACTIONS, ROLES, LEVELS, buildResourceAction,
//           parseResourceAction, PERMISSIONS_EVENTS, AUTH_EVENTS, AUTH_STATES,
//           injectPorts, getPorts, VERSION, MODULE_ID
// @changelog v5.6.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v5.5.0-ENTERPRISE-STRICT-MODE: Strict mode integration
// @changelog v5.5.0-ENTERPRISE: ES6 modernization
// @changelog v5.4.0-ENTERPRISE: Fixed duplicate export of injectPorts/getPorts
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import { AUTH_EVENTS, AUTH_STATES } from '/core/runtime/events/catalog/auth.events.js';
import { PERMISSIONS_EVENTS } from '/core/runtime/events/catalog/permissions.events.js';
import { permissionsStore } from './state/store.js';

// @ts-expect-error TS migration - TS2614
import { PermissionChecker } from './core/checker.js';
import { PolicyManager as _PolicyManager } from './core/policies.js';

// @ts-expect-error TS migration - TS2614
import { PermissionsLifecycle as _PermissionsLifecycle } from './core/lifecycle.js';

const PolicyManager = _PolicyManager as any;
const PermissionsLifecycle = _PermissionsLifecycle as any;
import * as Tracker from './telemetry/tracker.js';
import * as Helpers from './utils/helpers.js';
import { RESOURCES, ACTIONS, ROLES, LEVELS, buildResourceAction, parseResourceAction, isKnownRole, getRoleLevel } from './core/contract.js';
import { getRoutePolicy, isPublicRoute, getProtectedRoutes, getPublicRoutes, getAllRoutes, registerRoute, validateRoutePolicies } from './registry/routes.js';
import { getModulePolicy, getModuleActionPolicy, isPublicModule, getAllModules, getModulesByLevel, registerModule, validateModulePolicies } from './registry/modules.js';
import { setupGlobalStateIntegration, cleanupGlobalStateIntegration, setupOrchestratorIntegration, cleanupOrchestratorIntegration, _integrationsStatus, getIntegrationsStatus } from './core/integrations.js';
import { canAccessRoute, canAccessModuleAction } from './core/access-checks.js';
import { info as diagnosticsInfo, healthCheck as diagnosticsHealthCheck, createDebugObject } from './core/diagnostics.js';

const VERSION = '5.6.0-P2-ENTERPRISE';
const MODULE_ID = 'permissions-guard';

const validateSessionShape = (session: Record<string, unknown> & { isAuthenticated?: boolean }) => {
  if (!session || typeof session !== 'object') return { valid: false, reason: 'session must be object' };
  if (typeof session.isAuthenticated !== 'boolean') return { valid: false, reason: 'isAuthenticated must be boolean' };
  return { valid: true };
};

const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const _metrics = { initAttempts: 0, forceReinits: 0, permissionChecks: 0 };
const _log = (level: string, ...args: unknown[]) => {
  const logger = _getPort('logger');
  if (!logger) return;
  const debug = _getPort('config')?.app?.debug;
  if (level === 'error') logger.error?.(`[${MODULE_ID}]`, ...args);
  else if (level === 'warn') logger.warn?.(`[${MODULE_ID}]`, ...args);
  else if (level === 'info') logger.info?.(`[${MODULE_ID}]`, ...args);
  else if (debug) logger.debug?.(`[${MODULE_ID}]`, ...args);
};

const PermissionsGuard = {
  version: VERSION, name: MODULE_ID, moduleId: MODULE_ID,

  init: (options: { force?: boolean } & Record<string, unknown> = {}) => {
    _metrics.initAttempts++;
    _initPorts();
    if (options.force) { _metrics.forceReinits++; _log('info', 'Force reinit: limpando integrações antes de reinicializar'); cleanupGlobalStateIntegration(); cleanupOrchestratorIntegration(); }
    const result = PermissionsLifecycle.init(options);
    let globalStateConnected = false;
    let orchestratorConnected = false;
    if (result.ok && !result.alreadyInitialized) { globalStateConnected = setupGlobalStateIntegration(); orchestratorConnected = setupOrchestratorIntegration(); }
    else if (result.ok && result.alreadyInitialized) { globalStateConnected = _integrationsStatus.globalStateConnected; orchestratorConnected = _integrationsStatus.orchestratorConnected; }
    return { ...result, integrations: { globalStateConnected, orchestratorConnected } };
  },

  shutdown: () => { cleanupGlobalStateIntegration(); cleanupOrchestratorIntegration(); return PermissionsLifecycle.shutdown(); },
  destroy: () => PermissionsGuard.shutdown(),
  reset: () => PermissionsLifecycle.reset(),
  isInitialized: () => PermissionsLifecycle.isInitialized(),
  isDegraded: () => PermissionsLifecycle.isDegraded(),
  injectPorts, getPorts,

  syncFromGlobalState: (session: Record<string, unknown>) => PermissionsLifecycle.syncFromGlobalState(session),
  loadFromUser: (user: Record<string, unknown>) => PermissionsLifecycle.loadFromUser(user),
  validateSession: (session: Record<string, unknown> & { isAuthenticated?: boolean }) => validateSessionShape(session),

  can: (action: string) => { _metrics.permissionChecks++; return PermissionChecker.can(action); },
  canAll: (actions: string[]) => PermissionChecker.canAll(actions),
  canAny: (actions: string[]) => PermissionChecker.canAny(actions),
  hasRole: (role: string) => PermissionChecker.hasRole(role),
  hasAnyRole: (roles: string[]) => PermissionChecker.hasAnyRole(roles),
  hasAllRoles: (roles: string[]) => PermissionChecker.hasAllRoles(roles),
  hasCapability: (cap: string) => PermissionChecker.hasCapability(cap),
  hasAnyCapability: (caps: string[]) => PermissionChecker.hasAnyCapability(caps),
  hasAllCapabilities: (caps: string[]) => PermissionChecker.hasAllCapabilities(caps),
  isAtLeastLevel: (level: number) => PermissionChecker.isAtLeastLevel(level),
  guard: (action: string, onDenied: (() => void) | undefined) => PermissionChecker.guard(action, onDenied),
  createGuard: (action: string) => PermissionChecker.createGuard(action),

  canAccessRoute, getRoutePolicy, isPublicRoute, getProtectedRoutes, getPublicRoutes, getAllRoutes, registerRoute, validateRoutePolicies,
  canAccessModuleAction, getModulePolicy, getModuleActionPolicy, isPublicModule, getAllModules, getModulesByLevel, registerModule, validateModulePolicies,

  getRoles: () => permissionsStore.getRoles(),
  setRoles: (roles: string[]) => permissionsStore.setRoles(Helpers.normalizeRoles(roles)),
  getCapabilities: () => permissionsStore.getCapabilities(),
  setCapabilities: (caps: string[]) => permissionsStore.setCapabilities(Helpers.normalizeCapabilities(caps)),
  getScopes: () => permissionsStore.getScopes(),
  setScopes: (scopes: string[]) => permissionsStore.setScopes(scopes),
  getUserLevel: () => permissionsStore.getUserLevel(),
  setUserLevel: (level: number) => permissionsStore.setUserLevel(level),

  registerPolicy: (action: string, policy: Record<string, unknown>) => PolicyManager.register(action, policy),
  unregisterPolicy: (action: string) => PolicyManager.unregister(action),
  getPolicy: (action: string) => PolicyManager.get(action),
  listPolicies: () => PolicyManager.list(),
  getPolicies: () => PolicyManager.list(),
  setMode: (mode: string) => PolicyManager.setMode(mode),
  getMode: () => PolicyManager.getMode(),

  RESOURCES, ACTIONS, ROLES, LEVELS, AUTH_EVENTS, AUTH_STATES, PERMISSIONS_EVENTS,
  buildResourceAction, parseResourceAction, isKnownRole, getRoleLevel,

  getVersion: () => VERSION,
  status: () => PermissionsLifecycle.getStatus(),
  info: () => ({ ...diagnosticsInfo(), portsInitialized: Ports.isInitialized() }),
  healthCheck: () => ({ ...diagnosticsHealthCheck(), portsInitialized: Ports.isInitialized() }),

  debug: createDebugObject()
};

if (typeof window !== 'undefined') {
  // DevTools sempre permitido
  window.__dev = window.__dev || {};
  window.__dev.permissionsGuard = { getVersion: () => VERSION, info: () => PermissionsGuard.info(), healthCheck: () => PermissionsGuard.healthCheck(), getMetrics: () => ({ ..._metrics }), getIntegrationsStatus: () => getIntegrationsStatus(), getStoreInfo: () => permissionsStore.info(), getCheckerInfo: () => PermissionChecker.info(), getPoliciesInfo: () => PolicyManager.info(), debug: PermissionsGuard.debug };

  // Globals só expostos fora do strict mode
  if (!isStrict()) {
    (window as any).PermissionsGuard = PermissionsGuard;
    (window as any).PermissionsGuardVersion = VERSION;
    Tracker.track('permissions:global:exposed', { version: VERSION });
  } else {
    recordViolation('GLOBAL_EXPOSURE_BLOCKED', { module: MODULE_ID, target: 'window.PermissionsGuard, window.PermissionsGuardVersion' });
  }
}

export { PermissionsGuard, permissionsStore, PermissionChecker, PolicyManager, PermissionsLifecycle, RESOURCES, ACTIONS, ROLES, LEVELS, buildResourceAction, parseResourceAction, PERMISSIONS_EVENTS, AUTH_EVENTS, AUTH_STATES, VERSION, MODULE_ID };
export default PermissionsGuard;
