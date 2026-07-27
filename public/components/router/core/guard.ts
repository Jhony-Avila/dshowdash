

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.1.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: router-guard
// PURPOSE: core   guard
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   PERMISSIONS_EVENTS from /core/runtime/events/catalog/permissions.events.js
//   AUTH_EVENTS, AUTH_INTENTS from /core/runtime/events/catalog/auth.events.js
//   routerTelemetry from ../telemetry/tracker.js
//   getForbiddenRoute from ../registry/routes.js
//   GUARD_POLICIES from ../registry/definitions/constants.js
//   AuthGuard, PermissionGuard, LegacyGuard, PermissionsArrayGuard, guardPipeline, runGuardPipeline, getPipelineInfo, getGuardMetrics, resetAllMetrics from ./guards/pipeline.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   RouteGuard — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   validateEventContracts() — exported function
//   getVersion() — exported function
//   AuthGuard — exported value
//   PermissionGuard — exported value
//   LegacyGuard — exported value
//   PermissionsArrayGuard — exported value
//   GUARD_POLICIES — exported value
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   event
// LISTENS (eventos):
//   AUTH_EVENTS.LOGIN_SUCCESS
//   AUTH_EVENTS.LOGOUT
//   AUTH_EVENTS.LOGOUT_SUCCESS
//   AUTH_EVENTS.SESSION_CHECKED
// WINDOW ACCESS:
//   window.AuthAdapter
//   window.CoreAuthAdapter
//   window.__dev
// ═══════════════════════════════════════════════════════════════
'use strict';
// Router Global - Route Guards
// @version 10.1.0-P18EC-ES6
// @changelog v10.1.0-P18EC - Exported validateEventContracts for lifecycle.js
// @changelog v10.0.0-P18EC - Fixed broken import, migrated AUTH_EVENTS/AUTH_INTENTS to central catalog

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { PERMISSIONS_EVENTS } from '/core/runtime/events/catalog/permissions.events.js';
import { AUTH_EVENTS, AUTH_INTENTS } from '/core/runtime/events/catalog/auth.events.js';
import { routerTelemetry } from '../telemetry/tracker.js';
import { getForbiddenRoute } from '../registry/routes.js';
import { GUARD_POLICIES } from '../registry/definitions/constants.js';

import { AuthGuard, PermissionGuard, LegacyGuard, PermissionsArrayGuard, guardPipeline, runGuardPipeline, getPipelineInfo, getGuardMetrics, resetAllMetrics } from './guards/pipeline.js';

export const VERSION = '10.1.0-P18EC';
export const MODULE_ID = 'router-guard';

const hasWindow = typeof window !== 'undefined';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

// validateEventContracts - exported for lifecycle.js
export function validateEventContracts(throwOnError = false) {
  const checks = {
    authEventsValid: !!AUTH_EVENTS && Object.keys(AUTH_EVENTS).length > 0,
    authIntentsValid: !!AUTH_INTENTS && Object.keys(AUTH_INTENTS).length > 0,
    permissionsEventsValid: !!PERMISSIONS_EVENTS && Object.keys(PERMISSIONS_EVENTS).length > 0
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const valid = passed === total;
  if (!valid && throwOnError) throw new Error('Event contracts validation failed');
  return { valid, score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks };
}

function _log(level: string, msg: string, ctx: Record<string, unknown> = {}) {
  const logger = _getPort('logger');
  if (!logger || typeof logger[level] !== 'function') return;
  logger[level](msg, { component: MODULE_ID, ...ctx });
}

function _emit(event: string, data: Record<string, unknown> = {}) {
  const eventBus = _getPort('eventBus');
  if (eventBus?.emit) {
    eventBus.emit(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
  }
}

export function getVersion() { return VERSION; }

let lastCheckPath: string | null = null;
let lastCheckTime: number | null = null;
let lastCheckReason: string | null = null;
let checkCount = 0;
let blockCount = 0;

let enforcementMetrics = {
  evaluated: 0, enforced: 0, enforcedByDomain: 0, enforcedByRoute: 0, enforcedByGlobal: 0,
  bypassed: 0, bypassedByFeatureFlag: 0, failOpenUsed: 0, blocks: 0, alerts: 0
};

const SYNC_MAX_WAIT = 600;
const SYNC_CHECK_INTERVAL = 50;

function _emitAlert(type: string, context: Record<string, unknown> = {}) {
  enforcementMetrics.alerts++;
  const alertPayload = {
    type,
    path: (context as any).path || lastCheckPath,
    policy: (context as any).policy || null,
    permissionsMode: (context as any).permissionsMode || null,
    enforcement: _getEnforcement(),
    metricsSnapshot: { ...enforcementMetrics },
    timestamp: Date.now()
  };
  
  _log('warn', `[SECURITY ALERT] ${type}`, alertPayload);
  _emit(PERMISSIONS_EVENTS.ENFORCEMENT_ALERT, alertPayload);
  
  return alertPayload;
}

function _isEnforcementFeatureFlagEnabled() {
  try {
    const globalState = _getPort('globalState');
    if (globalState?.get) {
      const flags = globalState.get('flags.featureFlags');
      if (flags && typeof flags.permissionsEnforcement === 'boolean') {
        return flags.permissionsEnforcement;
      }
    }
  } catch (e: any) {
    _log('warn', 'Failed to get feature flag', { error: e.message });
  }
  return true;
}

function _getEnforcement() {
  try {
    const globalState = _getPort('globalState');
    if (globalState?.get) {
      const enforcement = globalState.get('permissions.enforcement');
      if (enforcement) return enforcement;
    }
  } catch (e: any) {
    _log('warn', 'Failed to get enforcement from GlobalState', { error: e.message });
  }
  return { enabled: false, scope: 'global', domains: [], routes: [], failOpen: true };
}

function _getPermissionsMode() {
  const globalState = _getPort('globalState');
  if (globalState?.get) {
    const mode = globalState.get('permissions.mode');
    if (mode) return mode;
  }
  const permissions = _getPort('permissions');
  if (permissions?.getMode) {
    return permissions.getMode();
  }
  return 'allow-all';
}

function _matchRoute(path: string, patterns: string[]) {
  if (!path || !Array.isArray(patterns)) return false;
  return patterns.some(pattern => {
    if (path === pattern) return true;
    if (pattern.endsWith('*')) {
      return path.startsWith(pattern.slice(0, -1));
    }
    return path.startsWith(`${pattern}/`);
  });
}

function _getEffectivePermissionsMode(route: Record<string, unknown>) {
  enforcementMetrics.evaluated++;
  
  if (!_isEnforcementFeatureFlagEnabled()) {
    enforcementMetrics.bypassedByFeatureFlag++;
    _log('debug', 'Enforcement bypassed by feature flag');
    return 'allow-all';
  }
  
  let enforcement;
  try {
    enforcement = _getEnforcement();
  } catch (e: any) {
    _log('warn', 'Enforcement check failed, using fail-open', { error: e.message });
    enforcementMetrics.failOpenUsed++;
    _emitAlert('fail-open', { path: route?.path, reason: 'enforcement-check-error' });
    return 'allow-all';
  }
  
  if (!enforcement.enabled) {
    enforcementMetrics.bypassed++;
    return 'allow-all';
  }
  
  const path = route?.path || '';
  const domain = route?.domain || null;
  
  let shouldEnforce = false;
  let reason = 'disabled';
  let scopeType = null;
  
  try {
    switch (enforcement.scope) {
      case 'global':
        shouldEnforce = true;
        reason = 'global-scope';
        scopeType = 'global';
        break;
      case 'domain':
        if (domain && Array.isArray(enforcement.domains) && enforcement.domains.includes(domain)) {
          shouldEnforce = true;
          reason = `domain:${domain}`;
          scopeType = 'domain';
        }
        break;
      case 'route':
        if (path && Array.isArray(enforcement.routes)) {
          shouldEnforce = _matchRoute(path as string, (enforcement as Record<string, unknown>).routes as string[]);
          if (shouldEnforce) {
            reason = `route:${path}`;
            scopeType = 'route';
          }
        }
        break;
      default:
        shouldEnforce = false;
        reason = 'unknown-scope';
    }
  } catch (e: any) {
    if (enforcement.failOpen !== false) {
      _log('warn', 'Enforcement logic error, using fail-open', { error: (e as Error).message, path });
      enforcementMetrics.failOpenUsed++;
      _emitAlert('fail-open', { path, reason: 'enforcement-logic-error' });
      return 'allow-all';
    }
    throw e;
  }
  
  if (shouldEnforce) {
    enforcementMetrics.enforced++;
    if (scopeType === 'global') enforcementMetrics.enforcedByGlobal++;
    if (scopeType === 'domain') enforcementMetrics.enforcedByDomain++;
    if (scopeType === 'route') enforcementMetrics.enforcedByRoute++;
  } else {
    enforcementMetrics.bypassed++;
  }
  
  _emit(PERMISSIONS_EVENTS.ENFORCEMENT_DECISION, {
    path, domain, policy: route?.guardPolicy || null,
    permissionsMode: shouldEnforce ? 'enforce' : 'allow-all',
    enforced: shouldEnforce, reason, scope: enforcement.scope, scopeType, failOpen: enforcement.failOpen
  });
  
  return shouldEnforce ? 'enforce' : 'allow-all';
}

function resolveGuardPolicy(route: Record<string, unknown>) {
  if (route.public === true) return GUARD_POLICIES.PUBLIC;
  if (route.guardPolicy && (Object.values(GUARD_POLICIES) as string[]).includes(route.guardPolicy as string)) return route.guardPolicy as string;
  const hasPermissions = (route.permissions as string[] | undefined)?.length! > 0;
  const hasMinLevel = (route.minLevel as number) > 0;
  const hasUarpsMapping = (PermissionGuard.routeTriggerMap as Record<string, unknown>)?.[route.path as string] || (PermissionGuard.routeTriggerMap as Record<string, unknown>)?.[route.id as string];
  if (hasUarpsMapping) return GUARD_POLICIES.UARPS;
  if (hasPermissions && !hasMinLevel) return GUARD_POLICIES.PERMISSIONS;
  if (hasMinLevel && !hasPermissions) return GUARD_POLICIES.LEGACY;
  if (hasPermissions && hasMinLevel) return GUARD_POLICIES.HYBRID;
  return route.requiresAuth ? GUARD_POLICIES.HYBRID : GUARD_POLICIES.PUBLIC;
}

function _getAuth() {
  return _getPort('auth') || (hasWindow ? ((window as any).AuthAdapter || (window as any).CoreAuthAdapter) : null);
}

function isPermissionsSynced() {
  const auth = _getAuth();
  if (!auth?.isReady?.()) return false;
  const level = auth?.getLevel?.() ?? 0;
  const caps = auth?.getCapabilities?.() ?? [];
  const roles = auth?.getRoles?.() ?? [];
  return level > 0 || caps.length > 0 || (roles.length > 0 && !roles.every((r: string) => r === 'guest'));
}

async function waitForPermissionsSync(maxWait = SYNC_MAX_WAIT, permissionsMode = 'allow-all') {
  if (permissionsMode === 'allow-all') {
    _log('debug', 'Mode allow-all - skipping sync wait');
    return true;
  }
  const readyFlags = _getPort('readyFlags');
  if (readyFlags?.waitFor) {
    const rfReady = await readyFlags.waitFor('permissions', maxWait);
    if (rfReady) { _log('info', 'ReadyFlags.permissions ready'); return true; }
  }
  const startTime = Date.now();
  while (Date.now() - startTime < maxWait) {
    if (isPermissionsSynced()) {
      _log('info', 'Auth sincronizado via Ports', { waitTime: Date.now() - startTime });
      return true;
    }
    await new Promise(r => setTimeout(r, SYNC_CHECK_INTERVAL));
  }
  _log('warn', 'Timeout aguardando permissions sync', { waited: maxWait, mode: permissionsMode });
  return false;
}

export const RouteGuard = {
  injectPorts,
  getPorts,
  
  isAuthenticated() { return AuthGuard.isAuthenticated(); },
  isPermissionsSynced() { return isPermissionsSynced(); },
  async waitForPermissionsSync(maxWait: number) { return waitForPermissionsSync(maxWait); },
  resolveGuardPolicy(route: Record<string, unknown>) { return resolveGuardPolicy(route); },
  getPermissionsMode() { return _getPermissionsMode(); },
  getEffectivePermissionsMode(route: Record<string, unknown>) { return _getEffectivePermissionsMode(route); },
  getEnforcement() { return _getEnforcement(); },
  isEnforcementFeatureFlagEnabled() { return _isEnforcementFeatureFlagEnabled(); },
  getUserLevelDirect() { return LegacyGuard.getUserLevel(); },
  getUserLevel() { return LegacyGuard.getUserLevel(); },
  hasMinLevel(requiredLevel: number) {
    if (!requiredLevel || requiredLevel === 0) return true;
    return LegacyGuard.getUserLevel() >= requiredLevel;
  },
  hasPermission(requiredPermissions: string[]) { return PermissionsArrayGuard.hasPermission(requiredPermissions); },
  getUserRoles() { return PermissionsArrayGuard.getUserRoles(); },
  getUserPermissions() { return PermissionsArrayGuard.getUserCapabilities(); },

  async checkRoute(route: Record<string, unknown>) {
    checkCount++;
    lastCheckPath = (route?.path as string) || null;
    lastCheckTime = Date.now();
    const contractsValidation = validateEventContracts(false);
    const authReady = AuthGuard.isReady();
    
    let permissionsMode;
    try {
      permissionsMode = _getEffectivePermissionsMode(route);
    } catch (e: any) {
      const enforcement = _getEnforcement();
      if (enforcement.failOpen !== false) {
        _log('error', 'Critical enforcement error, using fail-open', { error: e.message });
        enforcementMetrics.failOpenUsed++;
        _emitAlert('fail-open', { path: route?.path, reason: 'critical-error' });
        permissionsMode = 'allow-all';
      } else { throw e; }
    }

    if (!route) {
      lastCheckReason = 'invalid-route';
      return { allowed: false, reason: 'invalid-route', redirect: '/', details: null as unknown, authAvailable: authReady, contractsValid: contractsValidation.valid, policy: null as string | null, permissionsMode, enforcement: _getEnforcement(), _pipeline: { policy: null as string | null, permissionsMode } };
    }

    const policy = resolveGuardPolicy(route);
    _log('debug', 'Route policy resolved', { path: route.path, policy, permissionsMode });
    const needsSync = ((route.minLevel as number) > 0 || (route.permissions as string[] | undefined)?.length! > 0 || route.requiresAuth === true);
    
    if (needsSync && AuthGuard.isAuthenticated() && !isPermissionsSynced()) {
      _log('info', 'Auth OK mas não sincronizado, aguardando...', { path: route.path, mode: permissionsMode });
      const synced = await waitForPermissionsSync(SYNC_MAX_WAIT, permissionsMode);
      if (!synced && permissionsMode === 'enforce' && ((route.minLevel as number) > 0 || (route.permissions as string[] | undefined)?.length! > 0)) {
        blockCount++;
        enforcementMetrics.blocks++;
        lastCheckReason = 'sync-timeout-blocked';
        _emitAlert('block', { path: route.path, policy, permissionsMode, reason: 'sync-timeout' });
        const forbiddenRoute = getForbiddenRoute();
        return { allowed: false, reason: 'forbidden', redirect: forbiddenRoute?.path || '/forbidden', details: { type: 'sync-timeout-security-block', mode: permissionsMode }, authAvailable: authReady, contractsValid: contractsValidation.valid, policy, permissionsMode, enforcement: _getEnforcement(), _pipeline: { policy, permissionsMode, blockedBy: 'sync-timeout' } };
      }
    }

    const pipelineResult = await runGuardPipeline(route, { authReady, policy, permissionsMode });

    if (!pipelineResult.allowed) {
      blockCount++;
      if (permissionsMode === 'enforce') {
        enforcementMetrics.blocks++;
        _emitAlert('block', { path: route.path, policy, permissionsMode, reason: pipelineResult.reason, blockedBy: pipelineResult.blockedBy });
      }
      lastCheckReason = pipelineResult.reason as string;
      // @ts-expect-error strict migration — TS2345
      if (pipelineResult.reason === 'unauthenticated') { this.emitAuthRequired(route.path, 'route-guard'); }
      try { routerTelemetry.trackGuardBlock(route, pipelineResult.reason as string); } catch (e: any) {}
      return { allowed: false, reason: pipelineResult.reason, redirect: pipelineResult.redirect as string | null, details: pipelineResult.details as unknown, authAvailable: authReady, contractsValid: contractsValidation.valid, policy, permissionsMode, enforcement: _getEnforcement(), _pipeline: { blockedBy: pipelineResult.blockedBy, results: pipelineResult.pipelineResults, policy, permissionsMode } };
    }

    lastCheckReason = 'ok';
    return { allowed: true, reason: 'ok', redirect: null as string | null, details: null as unknown, authAvailable: authReady, contractsValid: contractsValidation.valid, policy, permissionsMode, enforcement: _getEnforcement(), _pipeline: { results: pipelineResult.pipelineResults, policy, permissionsMode } };
  },

  emitAuthRequired(attemptedRoute: string, reason: string) {
    try { if (AUTH_EVENTS?.LOGIN_REQUIRED) { _emit(AUTH_INTENTS.LOGIN, { reason, attemptedRoute }); } } catch (error: any) { _log('warn', `Failed to emit auth required: ${error.message}`); }
  },

  onAuthChange(callback: (authenticated: boolean, data: Record<string, unknown>) => void) {
    const eventBus = _getPort('eventBus');
    if (!eventBus) return () => {};
    const cleanups: (() => void)[] = [];
    try {
      if (AUTH_EVENTS?.LOGIN_SUCCESS) { 
        const h = (data: Record<string, unknown>) => { try { callback(true, data); } catch (e: any) {} }; 
        eventBus.on(AUTH_EVENTS.LOGIN_SUCCESS, h); 
        cleanups.push(() => { try { eventBus.off(AUTH_EVENTS.LOGIN_SUCCESS, h); } catch (e: any) {} }); 
      }
      if (AUTH_EVENTS?.LOGOUT) { 
        const h = (data: Record<string, unknown>) => { try { callback(false, data); } catch (e: any) {} }; 
        eventBus.on(AUTH_EVENTS.LOGOUT, h); 
        cleanups.push(() => { try { eventBus.off(AUTH_EVENTS.LOGOUT, h); } catch (e: any) {} }); 
      }
      if (AUTH_EVENTS?.LOGOUT_SUCCESS) { 
        const h = (data: Record<string, unknown>) => { try { callback(false, data); } catch (e: any) {} }; 
        eventBus.on(AUTH_EVENTS.LOGOUT_SUCCESS, h); 
        cleanups.push(() => { try { eventBus.off(AUTH_EVENTS.LOGOUT_SUCCESS, h); } catch (e: any) {} }); 
      }
      if (AUTH_EVENTS?.SESSION_CHECKED) { 
        const h = (data: Record<string, unknown>) => { try { callback(data?.authenticated === true, data); } catch (e: any) {} }; 
        eventBus.on(AUTH_EVENTS.SESSION_CHECKED, h); 
        cleanups.push(() => { try { eventBus.off(AUTH_EVENTS.SESSION_CHECKED, h); } catch (e: any) {} }); 
      }
    } catch (error: any) { _log('warn', `Failed to setup auth listeners: ${error.message}`); }
    return () => { cleanups.forEach(cleanup => { try { cleanup(); } catch (e: any) {} }); };
  },

  getGuards() { return { AuthGuard, PermissionGuard, LegacyGuard, PermissionsArrayGuard }; },
  getPipelineInfo() { return getPipelineInfo(); },
  getGuardMetrics() { return getGuardMetrics(); },
  getEnforcementMetrics() { return { ...enforcementMetrics }; },
  GUARD_POLICIES,

  getStatus() {
    const contractsValidation = validateEventContracts(false);
    const authReady = AuthGuard.isReady();
    const uarpsAvailable = PermissionGuard.isAvailable();
    const permissionsMode = _getPermissionsMode();
    const enforcement = _getEnforcement();
    const auth = _getAuth();
    return { version: VERSION, moduleId: MODULE_ID, isAuthenticated: AuthGuard.isAuthenticated(), userLevel: LegacyGuard.getUserLevel(), userRoles: PermissionsArrayGuard.getUserRoles(), permissionsSynced: isPermissionsSynced(), permissionsMode, enforcement, featureFlagEnabled: _isEnforcementFeatureFlagEnabled(), authAvailable: authReady, uarpsAvailable, contractsValid: contractsValidation.valid, contractsScore: contractsValidation.scoreDisplay, authSource: 'PortsPattern', authPortAvailable: !!auth, lastCheck: { path: lastCheckPath, time: lastCheckTime, reason: lastCheckReason }, metrics: { checkCount, blockCount }, enforcementMetrics: { ...enforcementMetrics }, pipeline: this.getPipelineInfo(), guardMetrics: this.getGuardMetrics(), portsStatus: { initialized: Ports.isInitialized() } };
  },

  healthCheck() {
    const authReady = AuthGuard.isReady();
    const uarpsAvailable = PermissionGuard.isAvailable();
    const guardMetrics = this.getGuardMetrics();
    const legacyUsage = guardMetrics.legacy.minLevelUsage;
    const permissionsMode = _getPermissionsMode();
    const enforcement = _getEnforcement();
    const auth = _getAuth();
    let status = 'HEALTHY';
    let warnings: string[] = [];
    if (legacyUsage > 0) { status = 'DEGRADED'; warnings.push(`LEGACY_MINLEVEL: ${legacyUsage} checks using deprecated minLevel`); }
    if (enforcementMetrics.failOpenUsed > 0) { warnings.push(`FAIL_OPEN: ${enforcementMetrics.failOpenUsed} times used due to errors`); }
    if (enforcementMetrics.blocks > 0) { warnings.push(`BLOCKS: ${enforcementMetrics.blocks} routes blocked by enforcement`); }
    if (enforcementMetrics.alerts > 0) { warnings.push(`ALERTS: ${enforcementMetrics.alerts} security alerts emitted`); }
    return { status, moduleId: MODULE_ID, version: VERSION, permissionsMode, enforcement: { enabled: enforcement.enabled, scope: enforcement.scope, failOpen: enforcement.failOpen, featureFlagEnabled: _isEnforcementFeatureFlagEnabled() }, checks: { authGuardReady: authReady, permissionGuardReady: uarpsAvailable, legacyGuardDeprecated: true, pipelineConfigured: guardPipeline.length === 4, modeAwareSync: true, enforcementConfigured: true, featureFlagConfigured: true, portsInitialized: Ports.isInitialized(), authPortAvailable: !!auth }, warnings: warnings.length > 0 ? warnings : null };
  },

  getVersion() { return VERSION; },

  resetMetrics() {
    checkCount = 0; blockCount = 0; lastCheckPath = null; lastCheckTime = null; lastCheckReason = null;
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
    checkRoute: (route: Record<string, unknown>) => RouteGuard.checkRoute(route),
    version: VERSION
  };
  _log('info', 'window.__dev.router exposed for DevTools');
}

export default RouteGuard;
export { AuthGuard, PermissionGuard, LegacyGuard, PermissionsArrayGuard, GUARD_POLICIES };
