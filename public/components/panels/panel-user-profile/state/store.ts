// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.1-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-profile.state.store
// PURPOSE: Panel User Profile - State Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   MODULE_ID from ../core/constants.js
//
// PROVIDES:
//   VERSION — module constant
//   STORE_MODULE_ID — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   getState() — exported function
//   setState() — exported function
//   subscribe() — exported function
//   reset() — exported function
//   setProfile() — exported function
//   setAvatars() — exported function
//   updateProfileField() — exported function
//   setAvatar() — exported function
//   setLoading() — exported function
//   setSaving() — exported function
//   setError() — exported function
//   ... and 15 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { MODULE_ID } from '../core/constants.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const STORE_MODULE_ID = 'panel-user-profile.state.store';

const Ports = createPanelPorts({ moduleId: STORE_MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function _debug() { const cfg = _getPort('config'); return cfg && cfg.app && cfg.app.debug; }

function _log(level: string, ...args: any[]) { const logger = _getPort('logger'); if (!logger) return; if (!_debug() && level === 'debug') return; const fn = logger[level] || logger.info; if (typeof fn === 'function') fn.apply(logger, [`[${STORE_MODULE_ID}]`].concat(args)); }

const initialState: { mounted: boolean; loading: boolean; saving: boolean; error: string | null; profile: Record<string, unknown> | null; avatars: Record<string, unknown>[]; showAvatarPicker: boolean; isDirty: boolean; mountedAt: number | null; lastRefresh: number | null } = { mounted: false, loading: false, saving: false, error: null, profile: null, avatars: [], showAvatarPicker: false, isDirty: false, mountedAt: null, lastRefresh: null };
let state = Object.assign({}, initialState);
const listeners = new Set();

export function getState() { return Object.assign({}, state); }

// @ts-expect-error TS migration - TS2349
export function setState(partial) { state = Object.assign({}, state, partial); listeners.forEach(fn => { try { fn(state); } catch (e) { _log('error', 'Listener error:', e.message); } }); }
export function subscribe(fn: (state: typeof initialState) => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }

// @ts-expect-error TS migration - TS2349
export function reset() { state = Object.assign({}, initialState); listeners.forEach(fn => { fn(state); }); }

export function setProfile(profile: Record<string, unknown> | null) { setState({ profile, isDirty: false, error: null }); }
export function setAvatars(avatars: Record<string, unknown>[]) { setState({ avatars: avatars || [] }); }
export function updateProfileField(field: string, value: unknown) { if (!state.profile) return; const profile = Object.assign({}, state.profile); profile[field] = value; setState({ profile, isDirty: true }); }
export function setAvatar(avatarUrl: string) { if (!state.profile) return; const profile = Object.assign({}, state.profile, { avatarUrl }); setState({ profile, isDirty: true, showAvatarPicker: false }); }

export function setLoading(loading: boolean) { setState({ loading }); }
export function setSaving(saving: boolean) { setState({ saving }); }
export function setError(error: string | null) { setState({ error }); }
export function setMounted(mounted: boolean) { setState({ mounted, mountedAt: mounted ? Date.now() : null }); }
export function setShowAvatarPicker(show: boolean) { setState({ showAvatarPicker: show }); }
export function setDirty(isDirty: boolean) { setState({ isDirty }); }
export function setLastRefresh() { setState({ lastRefresh: Date.now() }); }

export function getProfile() { return state.profile; }
export function getAvatars() { return state.avatars; }
export function isLoading() { return state.loading; }
export function isSaving() { return state.saving; }
export function isDirty() { return state.isDirty; }
export function hasError() { return !!state.error; }
export function isMounted() { return state.mounted; }

export function getAuthContext() { _initPorts(); const auth = _getPort('auth'); if (auth && auth.isAuthenticated && auth.isAuthenticated()) { return { isAuthenticated: true, user: auth.getUser ? auth.getUser() : null }; } return { isAuthenticated: false, user: null }; }

export function getHealthData() { return { moduleId: MODULE_ID, mounted: state.mounted, loading: state.loading, saving: state.saving, hasError: !!state.error, hasProfile: !!state.profile, avatarsCount: state.avatars.length, isDirty: state.isDirty, uptime: state.mountedAt ? Date.now() - state.mountedAt : 0, lastRefresh: state.lastRefresh }; }

export function healthCheck() { _initPorts(); const logger = _getPort('logger'); const checks = { storeReady: true, loggerReady: !!logger, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 3 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/3`, checks, moduleId: STORE_MODULE_ID, version: VERSION }; }

export function info() { return { moduleId: STORE_MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), healthCheck: healthCheck() }; }

export default { getState, setState, subscribe, reset, setProfile, setAvatars, updateProfileField, setAvatar, setLoading, setSaving, setError, setMounted, setShowAvatarPicker, setDirty, setLastRefresh, getProfile, getAvatars, isLoading, isSaving, isDirty, hasError, isMounted, getAuthContext, getHealthData, healthCheck, info, injectPorts, getPorts };

// Alias export: consumers import { StateStore } from this module
export const StateStore = { getState, setState, subscribe, reset, setProfile, setAvatars, updateProfileField, setAvatar, setLoading, setSaving, setError, setMounted, setShowAvatarPicker, setDirty, setLastRefresh, getProfile, getAvatars, isLoading, isSaving, isDirty, hasError, isMounted, getAuthContext, getHealthData, healthCheck, info, injectPorts, getPorts, VERSION, STORE_MODULE_ID };
