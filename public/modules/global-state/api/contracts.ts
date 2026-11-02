// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: global-state-contracts
// PURPOSE: Global State Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   from /core/runtime/events/index.js
//
// PROVIDES:
//   default export
//   MODULE_ID
//   VERSION
//   NAMESPACE
//   EVENTS
//   INITIAL_STATE
//   ACTIONS
//   ALLOWED_FIELDS
//   VALID_VALUES
//   SENSITIVE_FIELDS
//   ENFORCEMENT_DEFAULTS
//   isAllowedField
//   getUnknownFields
//   isValidTheme
//   isValidLanguage
//   isValidNavigationMode
//   isValidPermissionsMode
//   isValidEnforcementScope
//   isValidEnforcement
//   info
//   healthCheck
// ═══════════════════════════════════════════════════════════════
'use strict';

import { PERMISSIONS_EVENTS } from '/core/runtime/events/catalog/permissions.events.js';

const MODULE_ID = 'global-state-contracts';
const VERSION = '6.1.0-ENTERPRISE';
const NAMESPACE = 'global-state';

const EVENTS = Object.freeze({
  STATE_CHANGED: 'global-state:changed',
  STATE_RESET: 'global-state:reset',
  STATE_HYDRATED: 'global-state:hydrated',
  READY: 'global-state:ready',
  DESTROYED: 'global-state:destroyed',
  INIT_START: 'global-state:init:start',
  INIT_COMPLETE: 'global-state:init:complete',
  SUBSCRIBER_ADDED: 'global-state:subscriber:added',
  SUBSCRIBER_REMOVED: 'global-state:subscriber:removed',
  SESSION_SYNCED: 'global-state:session:synced',
  SESSION_CLEARED: 'global-state:session:cleared',
  PERMISSIONS_MODE_CHANGED: 'global-state:permissions:mode:changed',
  PERMISSIONS_ENFORCEMENT_CHANGED: 'global-state:permissions:enforcement:changed',
  PERMISSIONS_ENFORCEMENT_DECISION: PERMISSIONS_EVENTS.ENFORCEMENT_DECISION,
  ERROR: 'global-state:error',
  VALIDATION_FAILED: 'global-state:validation:failed'
});

const ENFORCEMENT_DEFAULTS = Object.freeze({ enabled: false, scope: 'global', domains: [], routes: [], failOpen: true });

const INITIAL_STATE = Object.freeze({
  session: Object.freeze({ isAuthenticated: false, token: null, userId: null, user: null, lastActivity: null, expiresAt: null, roles: [], permissions: [] }),
  preferences: Object.freeze({ theme: 'light', language: 'pt-BR', compactMode: false, animations: true }),
  app: Object.freeze({ isLoading: false, isOnline: true, maintenanceMode: false, version: '3.0.0' }),
  navigation: Object.freeze({ currentRoute: '/', previousRoute: null, sidebarOpen: true, activePanel: null, currentPage: null, lastNavigationAt: null, view: null, tab: null, section: null, entity: null, entityId: null, mode: 'view', page: 1, sort: null, filters: null, extras: {} }),
  flags: Object.freeze({ debugMode: false, telemetryEnabled: true, featureFlags: {} }),
  permissions: Object.freeze({ mode: 'allow-all', lastModeChange: null, apiConnected: false, enforcement: Object.freeze({ enabled: false, scope: 'global', domains: [], routes: [], failOpen: true, lastChange: null }) })
});

const ACTIONS = Object.freeze({
  SET_SESSION: 'SET_SESSION', CLEAR_SESSION: 'CLEAR_SESSION', UPDATE_PREFERENCES: 'UPDATE_PREFERENCES',
  SET_LOADING: 'SET_LOADING', SET_ONLINE_STATUS: 'SET_ONLINE_STATUS', SET_MAINTENANCE_MODE: 'SET_MAINTENANCE_MODE',
  UPDATE_NAVIGATION: 'UPDATE_NAVIGATION', SET_FLAG: 'SET_FLAG', RESET_STATE: 'RESET_STATE', HYDRATE_STATE: 'HYDRATE_STATE',
  SET_PERMISSIONS_MODE: 'SET_PERMISSIONS_MODE', SET_PERMISSIONS_ENFORCEMENT: 'SET_PERMISSIONS_ENFORCEMENT'
});

const ALLOWED_FIELDS = Object.freeze({
  session: Object.freeze(['isAuthenticated', 'token', 'userId', 'user', 'lastActivity', 'expiresAt', 'refreshToken', 'roles', 'permissions']),
  preferences: Object.freeze(['theme', 'language', 'compactMode', 'animations', 'fontSize', 'timezone']),
  navigation: Object.freeze(['currentRoute', 'previousRoute', 'sidebarOpen', 'activePanel', 'breadcrumbs', 'currentPage', 'lastNavigationAt', 'view', 'tab', 'section', 'entity', 'entityId', 'mode', 'page', 'sort', 'filters', 'extras']),
  app: Object.freeze(['isLoading', 'isOnline', 'maintenanceMode', 'version']),
  flags: Object.freeze(['debugMode', 'telemetryEnabled', 'featureFlags']),
  permissions: Object.freeze(['mode', 'lastModeChange', 'apiConnected', 'enforcement']),
  enforcement: Object.freeze(['enabled', 'scope', 'domains', 'routes', 'failOpen', 'lastChange'])
});

const VALID_VALUES = Object.freeze({
  themes: Object.freeze(['light', 'dark', 'auto']),
  languages: Object.freeze(['pt-BR', 'en-US', 'es-ES']),
  navigationModes: Object.freeze(['view', 'edit', 'create', 'list', 'detail']),
  permissionsModes: Object.freeze(['allow-all', 'enforce']),
  enforcementScopes: Object.freeze(['global', 'domain', 'route'])
});

const SENSITIVE_FIELDS = Object.freeze(['password', 'password_hash', 'secret', 'api_key', 'token', 'refreshToken']);

function isAllowedField(section: string, field: string) { const allowed = (ALLOWED_FIELDS as Record<string, readonly string[]>)[section]; return allowed ? allowed.indexOf(field) !== -1 : false; }

function getUnknownFields(section: string, obj: Record<string, unknown>) {
  if (!obj || typeof obj !== 'object') return [];
  const allowed = (ALLOWED_FIELDS as Record<string, readonly string[]>)[section];
  if (!allowed) return Object.keys(obj as object);
  const unknown = [];
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) { if (allowed.indexOf(keys[i]) === -1) unknown.push(keys[i]); }
  return unknown;
}

function isValidTheme(theme: string) { return VALID_VALUES.themes.indexOf(theme as any) !== -1; }
function isValidLanguage(language: string) { return VALID_VALUES.languages.indexOf(language as any) !== -1; }
function isValidNavigationMode(mode: string) { return VALID_VALUES.navigationModes.indexOf(mode as any) !== -1; }
function isValidPermissionsMode(mode: string) { return VALID_VALUES.permissionsModes.indexOf(mode as any) !== -1; }
function isValidEnforcementScope(scope: string) { return VALID_VALUES.enforcementScopes.indexOf(scope as any) !== -1; }

function isValidEnforcement(enforcement: unknown) {
  if (!enforcement || typeof enforcement !== 'object') return false;
  const e = enforcement as Record<string, unknown>;
  if (typeof e.enabled !== 'boolean') return false;
  if (e.scope && !isValidEnforcementScope(e.scope as string)) return false;
  if (e.domains && !Array.isArray(e.domains)) return false;
  if (e.routes && !Array.isArray(e.routes)) return false;
  if (e.failOpen !== undefined && typeof e.failOpen !== 'boolean') return false;
  return true;
}

function info() {
  return { moduleId: MODULE_ID, version: VERSION, namespace: NAMESPACE, actionsCount: Object.keys(ACTIONS).length, eventsCount: Object.keys(EVENTS).length, allowedFieldsSections: Object.keys(ALLOWED_FIELDS), hasEnforcement: true, timestamp: Date.now() };
}

function healthCheck() {
  const permissions = INITIAL_STATE.permissions;
  const checks = { hasActions: Object.keys(ACTIONS).length > 0, hasEvents: Object.keys(EVENTS).length > 0, hasInitialState: !!INITIAL_STATE, hasAllowedFields: Object.keys(ALLOWED_FIELDS).length > 0, hasPermissionsState: !!permissions, hasEnforcementState: !!(permissions && permissions.enforcement), hasEnforcementAction: !!ACTIONS.SET_PERMISSIONS_ENFORCEMENT, allFrozen: Object.isFrozen(ACTIONS) && Object.isFrozen(EVENTS) && Object.isFrozen(ALLOWED_FIELDS) };
  let passed = 0; let total = 0; const keys = Object.keys(checks); for (let i = 0; i < keys.length; i++) { total++; if ((checks as Record<string, boolean>)[keys[i]]) passed++; }
  return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, healthy: passed === total, checks, moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}

const GlobalStateContracts = { MODULE_ID, VERSION, NAMESPACE, EVENTS, INITIAL_STATE, ACTIONS, ALLOWED_FIELDS, VALID_VALUES, SENSITIVE_FIELDS, ENFORCEMENT_DEFAULTS, isAllowedField, getUnknownFields, isValidTheme, isValidLanguage, isValidNavigationMode, isValidPermissionsMode, isValidEnforcementScope, isValidEnforcement, info, healthCheck };

Object.freeze(GlobalStateContracts);

export default GlobalStateContracts;
export { MODULE_ID, VERSION, NAMESPACE, EVENTS, INITIAL_STATE, ACTIONS, ALLOWED_FIELDS, VALID_VALUES, SENSITIVE_FIELDS, ENFORCEMENT_DEFAULTS, isAllowedField, getUnknownFields, isValidTheme, isValidLanguage, isValidNavigationMode, isValidPermissionsMode, isValidEnforcementScope, isValidEnforcement, info, healthCheck };
