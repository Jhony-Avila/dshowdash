// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: global-state-actions
// PURPOSE: Global State Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   from ../api/contracts.js
//
// PROVIDES:
//   default export
//   MODULE_ID
//   VERSION
// ═══════════════════════════════════════════════════════════════
'use strict';

import GlobalStateContracts, { ACTIONS, ENFORCEMENT_DEFAULTS } from '../api/contracts.js';

const MODULE_ID = 'global-state-actions';
const VERSION = '5.1.0-ENTERPRISE';

const StateActions = {
  MODULE_ID,
  VERSION,

  setSession(sessionData: unknown) { return { type: ACTIONS.SET_SESSION, payload: sessionData }; },
  clearSession() { return { type: ACTIONS.CLEAR_SESSION, payload: null as unknown }; },
  updatePreferences(preferences: unknown) { return { type: ACTIONS.UPDATE_PREFERENCES, payload: preferences }; },
  setLoading(isLoading: boolean) { return { type: ACTIONS.SET_LOADING, payload: { isLoading } }; },
  setOnlineStatus(isOnline: boolean) { return { type: ACTIONS.SET_ONLINE_STATUS, payload: { isOnline } }; },
  setMaintenanceMode(enabled: boolean) { return { type: ACTIONS.SET_MAINTENANCE_MODE, payload: { maintenanceMode: enabled } }; },
  updateNavigation(navData: unknown) { return { type: ACTIONS.UPDATE_NAVIGATION, payload: navData }; },
  setFlag(key: string, value: unknown) { return { type: ACTIONS.SET_FLAG, payload: { key, value } }; },
  resetState() { return { type: ACTIONS.RESET_STATE, payload: null as unknown }; },
  hydrateState(state: unknown) { return { type: ACTIONS.HYDRATE_STATE, payload: state }; },

  setPermissionsMode(mode: string, options: { apiConnected?: boolean; source?: string } = {}) {
    return { type: ACTIONS.SET_PERMISSIONS_MODE, payload: { mode, apiConnected: options.apiConnected !== undefined ? options.apiConnected : false, lastModeChange: Date.now(), source: options.source || 'unknown' } };
  },

  setPermissionsEnforcement(enforcementConfig: unknown) {
    const enforcement = Object.assign({}, ENFORCEMENT_DEFAULTS, enforcementConfig, { lastChange: Date.now() });
    return { type: ACTIONS.SET_PERMISSIONS_ENFORCEMENT, payload: enforcement };
  },

  enableEnforcement(scope = 'global', options: { domains?: string[]; routes?: string[]; failOpen?: boolean } = {}) {
    return StateActions.setPermissionsEnforcement({ enabled: true, scope, domains: options.domains || [], routes: options.routes || [], failOpen: options.failOpen !== false });
  },

  disableEnforcement() { return StateActions.setPermissionsEnforcement({ enabled: false }); },

  info() {
    return { moduleId: MODULE_ID, version: VERSION, availableActions: Object.keys(ACTIONS), actionsCount: Object.keys(ACTIONS).length, contractsSource: 'api/contracts.js', hasEnforcementActions: true, timestamp: Date.now() };
  },

  healthCheck() {
    const actionMethods = ['setSession', 'clearSession', 'updatePreferences', 'setLoading', 'setOnlineStatus', 'setMaintenanceMode', 'updateNavigation', 'setFlag', 'resetState', 'hydrateState', 'setPermissionsMode', 'setPermissionsEnforcement', 'enableEnforcement', 'disableEnforcement'];
    let allMethodsExist = true;
    for (let i = 0; i < actionMethods.length; i++) { if (typeof (StateActions as Record<string, unknown>)[actionMethods[i]] !== 'function') { allMethodsExist = false; break; } }
    const checks = { hasActions: Object.keys(ACTIONS).length > 0, allMethodsExist, contractsImported: !!GlobalStateContracts, hasPermissionsAction: typeof StateActions.setPermissionsMode === 'function', hasEnforcementAction: typeof StateActions.setPermissionsEnforcement === 'function', hasEnforcementHelpers: typeof StateActions.enableEnforcement === 'function' };
    let passed = 0; let total = 0; const keys = Object.keys(checks); for (let j = 0; j < keys.length; j++) { total++; if ((checks as Record<string, boolean>)[keys[j]]) passed++; }
    return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, healthy: passed === total, checks, moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
  }
};

export default StateActions;
export { MODULE_ID, VERSION };
