// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: global-state-store:reducer
// PURPOSE: Global State Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   from /core/runtime/events/index.js
//   from ../api/contracts.js
//   from ../utils/validators.js
//   from ./store-config.js
//
// PROVIDES:
//   VERSION
//   MODULE_ID
//   reducer
//   info
//   healthCheck
//   default export
// ═══════════════════════════════════════════════════════════════
'use strict';

import { PERMISSIONS_EVENTS } from '/core/runtime/events/catalog/permissions.events.js';
import { ACTIONS, INITIAL_STATE, EVENTS, isValidEnforcement, ENFORCEMENT_DEFAULTS } from '../api/contracts.js';
import StateValidators from '../utils/validators.js';
import { deepClone, log } from './store-config.js';

const VERSION = '1.2.0-ENTERPRISE';
const MODULE_ID = 'global-state-store:reducer';

function reducer(state: unknown, action: { type: string; payload?: unknown }, context: Record<string, unknown>) {
  const telemetry: any = context.telemetry;
  const emit: any = context.emit;
  const eventBus: any = context.eventBus;
  const st: any = state;

  switch (action.type) {
    case ACTIONS.SET_SESSION: {
      const sessionValidation = StateValidators.validateSession(action.payload);
      if (!sessionValidation.valid) {
        // @ts-expect-error strict migration — TS2769
        telemetry.trackError(new Error(sessionValidation.error), { action });
        log('error', 'SET_SESSION blocked:', sessionValidation.error);
        return state;
      }
      const sanitizedPayload: any = Object.assign({}, action.payload);
      if (sanitizedPayload.user) sanitizedPayload.user = StateValidators.sanitizeUser(sanitizedPayload.user);
      if (!sanitizedPayload.userId && sanitizedPayload.user && sanitizedPayload.user.id) sanitizedPayload.userId = sanitizedPayload.user.id;
      if (sanitizedPayload.isAuthenticated === undefined) sanitizedPayload.isAuthenticated = !!(sanitizedPayload.user || sanitizedPayload.userId);
      return Object.assign({}, st, { session: Object.assign({}, st.session, sanitizedPayload, { lastActivity: Date.now() }) });
    }
    
    case ACTIONS.CLEAR_SESSION:
      return Object.assign({}, st, { session: deepClone(INITIAL_STATE.session) });
    
    case ACTIONS.UPDATE_PREFERENCES: {
      const prefsValidation = StateValidators.validatePreferences(action.payload);
      if (!prefsValidation.valid) {
        // @ts-expect-error strict migration — TS2769
        telemetry.trackError(new Error(prefsValidation.error), { action });
        log('error', 'UPDATE_PREFERENCES blocked:', prefsValidation.error);
        return state;
      }
      return Object.assign({}, st, { preferences: Object.assign({}, st.preferences, action.payload) });
    }
    
    case ACTIONS.SET_LOADING: {
      const p65: any = action.payload;
      return Object.assign({}, st, { app: Object.assign({}, st.app, { isLoading: !!p65.isLoading }) });
    }
    case ACTIONS.SET_ONLINE_STATUS: {
      const p68: any = action.payload;
      return Object.assign({}, st, { app: Object.assign({}, st.app, { isOnline: !!p68.isOnline }) });
    }
    case ACTIONS.SET_MAINTENANCE_MODE: {
      const p71: any = action.payload;
      return Object.assign({}, st, { app: Object.assign({}, st.app, { maintenanceMode: !!p71.maintenanceMode }) });
    }
    
    case ACTIONS.UPDATE_NAVIGATION: {
      const navValidation = StateValidators.validateNavigation(action.payload);
      if (!navValidation.valid) {
        // @ts-expect-error strict migration — TS2769
        telemetry.trackError(new Error(navValidation.error), { action });
        log('error', 'UPDATE_NAVIGATION blocked:', navValidation.error);
        return state;
      }
      return Object.assign({}, st, { navigation: Object.assign({}, st.navigation, action.payload) });
    }
    
    case ACTIONS.SET_FLAG: {
      const p84: any = action.payload;
      const key = p84.key;
      const value = p84.value;
      if (key === 'featureFlags') return Object.assign({}, st, { flags: Object.assign({}, st.flags, { featureFlags: Object.assign({}, st.flags.featureFlags, value) }) });
      const newFlags: Record<string, unknown> = Object.assign({}, st.flags);
      newFlags[key] = value;
      return Object.assign({}, st, { flags: newFlags });
    }
    
    case ACTIONS.SET_PERMISSIONS_MODE: {
      const p93: any = action.payload;
      const mode = p93.mode;
      const apiConnected = p93.apiConnected;
      const lastModeChange = p93.lastModeChange;
      const source = p93.source;
      const validModes = ['allow-all', 'enforce'];
      if (validModes.indexOf(mode) === -1) { log('error', 'SET_PERMISSIONS_MODE blocked: invalid mode', { mode }); return st; }
      const newPermissions: any = Object.assign({}, st.permissions, { mode, apiConnected: apiConnected !== undefined ? apiConnected : (st.permissions ? st.permissions.apiConnected : false), lastModeChange: lastModeChange || Date.now() });
      emit(EVENTS.PERMISSIONS_MODE_CHANGED, { mode, apiConnected: newPermissions.apiConnected, source, timestamp: Date.now() });
      if (eventBus && eventBus.emit) eventBus.emit(PERMISSIONS_EVENTS.MODE_CHANGED, { mode, apiConnected: newPermissions.apiConnected, source, timestamp: Date.now() });
      return Object.assign({}, st, { permissions: newPermissions });
    }

    case ACTIONS.SET_PERMISSIONS_ENFORCEMENT: {
      const payload: any = action.payload;
      if (!isValidEnforcement(payload)) { log('error', 'SET_PERMISSIONS_ENFORCEMENT blocked: invalid structure', { payload }); return st; }
      const newEnforcement: any = Object.assign({}, ENFORCEMENT_DEFAULTS, st.permissions ? st.permissions.enforcement : {}, payload, { lastChange: payload.lastChange || Date.now() });
      const newPerms = Object.assign({}, st.permissions, { enforcement: newEnforcement });
      emit(EVENTS.PERMISSIONS_ENFORCEMENT_CHANGED, { enforcement: newEnforcement, previousEnforcement: st.permissions ? st.permissions.enforcement : null, timestamp: Date.now() });
      if (eventBus && eventBus.emit) eventBus.emit(PERMISSIONS_EVENTS.ENFORCEMENT_CHANGED, { enforcement: newEnforcement, timestamp: Date.now() });
      log('info', 'Enforcement updated', { enabled: newEnforcement.enabled, scope: newEnforcement.scope, failOpen: newEnforcement.failOpen });
      return Object.assign({}, st, { permissions: newPerms });
    }
    
    case ACTIONS.RESET_STATE:
      return deepClone(INITIAL_STATE);
    
    case ACTIONS.HYDRATE_STATE: {
      const hydrateValidation = StateValidators.validateState(action.payload);
      if (!hydrateValidation.valid) {
        // @ts-expect-error strict migration — TS2769
        telemetry.trackError(new Error(hydrateValidation.error), { action: 'HYDRATE_STATE' });
        log('error', 'HYDRATE_STATE ignored - invalid payload:', hydrateValidation.error);
        return state;
      }
      return deepClone(action.payload);
    }
    
    default:
      return state;
  }
}

function info() { return { moduleId: MODULE_ID, version: VERSION }; }

function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { reducerReady: typeof reducer === 'function', actionsSupported: Object.keys(ACTIONS).length } };
}

export { VERSION, MODULE_ID, reducer, info, healthCheck };
export default { VERSION, MODULE_ID, reducer, info, healthCheck };
