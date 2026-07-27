// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-notifications.state.store
// PURPOSE: Panel User Notifications - State Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   getState() — exported function
//   setState() — exported function
//   subscribe() — exported function
//   reset() — exported function
//   setSettings() — exported function
//   setLoading() — exported function
//   setSaving() — exported function
//   setError() — exported function
//   setMounted() — exported function
//   setDirty() — exported function
//   updateSetting() — exported function
//   getAuthContext() — exported function
//   getHealthData() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   ... and 4 more exports
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

const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'panel-user-notifications.state.store';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

const initialState: { mounted: boolean; loading: boolean; saving: boolean; error: string | null; settings: Record<string, unknown> | null; isDirty: boolean; mountedAt: number | null } = { mounted: false, loading: false, saving: false, error: null, settings: null, isDirty: false, mountedAt: null };
let state = Object.assign({}, initialState);
const listeners: Array<(s: typeof initialState) => void> = [];

function getState() { return Object.assign({}, state); }
function setState(partial: Partial<typeof initialState>) { state = Object.assign({}, state, partial); for (let i = 0; i < listeners.length; i++) { try { listeners[i](state); } catch (e) {} } }
function subscribe(fn: (s: typeof initialState) => void) { listeners.push(fn); return () => { const idx = listeners.indexOf(fn); if (idx > -1) listeners.splice(idx, 1); }; }
function reset() { state = Object.assign({}, initialState); }

function setSettings(settings: Record<string, unknown> | null) { setState({ settings, isDirty: false }); }
function setLoading(loading: boolean) { setState({ loading }); }
function setSaving(saving: boolean) { setState({ saving }); }
function setError(error: string | null) { setState({ error }); }
function setMounted(mounted: boolean) { setState({ mounted, mountedAt: mounted ? Date.now() : null }); }
function setDirty(isDirty: boolean) { setState({ isDirty }); }

function updateSetting(category: string, key: string, value: unknown) {
  const settings: Record<string, Record<string, unknown>> = Object.assign({}, state.settings as Record<string, Record<string, unknown>>);
  if (!settings[category]) settings[category] = {};
  settings[category][key] = value;
  setState({ settings, isDirty: true });
}

function getAuthContext() {
  _initPorts();
  const auth = _getPort('auth');
  const gs = _getPort('globalState');
  if (auth && auth.isAuthenticated && auth.isAuthenticated()) { return { isAuthenticated: true, user: auth.getUser ? auth.getUser() : null }; }
  if (gs && gs.auth) { return { isAuthenticated: true, user: gs.auth }; }
  return { isAuthenticated: false, user: null };
}

function getHealthData() { return { mounted: state.mounted, loading: state.loading, saving: state.saving, hasError: !!state.error, hasSettings: !!state.settings, uptime: state.mountedAt ? Date.now() - state.mountedAt : 0, portsInitialized: Ports.isInitialized() }; }

function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { storeReady: true, portsInitialized: Ports.isInitialized() } }; }

export { getState, setState, subscribe, reset, setSettings, setLoading, setSaving, setError, setMounted, setDirty, updateSetting, getAuthContext, getHealthData, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
export default { getState, setState, subscribe, reset, setSettings, setLoading, setSaving, setError, setMounted, setDirty, updateSetting, getAuthContext, getHealthData, info, healthCheck, injectPorts, getPorts };

// Alias export: consumers import { StateStore } from this module
export const StateStore = { getState, setState, subscribe, reset, setSettings, setLoading, setSaving, setError, setMounted, setDirty, updateSetting, getAuthContext, getHealthData, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
