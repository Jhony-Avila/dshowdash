// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.1-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-account-security.state.store
// PURPOSE: Panel Account Security - State Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   getState() — exported function
//   setState() — exported function
//   subscribe() — exported function
//   reset() — exported function
//   setSecurityInfo() — exported function
//   setLoading() — exported function
//   setSaving() — exported function
//   setError() — exported function
//   setMounted() — exported function
//   setShowPasswordForm() — exported function
//   updatePasswordField() — exported function
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

export const MODULE_ID = 'panel-account-security.state.store';
export const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

interface StoreState {
  mounted: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
  securityInfo: Record<string, unknown> | null;
  showPasswordForm: boolean;
  passwordForm: { current: string; new: string; confirm: string };
  mountedAt: number | null;
}
const initialState: StoreState = { mounted: false, loading: false, saving: false, error: null, securityInfo: null, showPasswordForm: false, passwordForm: { current: '', new: '', confirm: '' }, mountedAt: null };
let state: StoreState = Object.assign({}, initialState);
const listeners: Array<(s: StoreState) => void> = [];

export function getState() { return Object.assign({}, state); }
export function setState(partial: Partial<StoreState>) { state = Object.assign({}, state, partial); for (let i = 0; i < listeners.length; i++) { listeners[i](state); } }
export function subscribe(fn: (s: StoreState) => void) { listeners.push(fn); return () => { const idx = listeners.indexOf(fn); if (idx > -1) listeners.splice(idx, 1); }; }
export function reset() { state = Object.assign({}, initialState); }
export function setSecurityInfo(info: Record<string, unknown> | null) { setState({ securityInfo: info }); }
export function setLoading(loading: boolean) { setState({ loading }); }
export function setSaving(saving: boolean) { setState({ saving }); }
export function setError(error: string | null) { setState({ error }); }
export function setMounted(mounted: boolean) { setState({ mounted, mountedAt: mounted ? Date.now() : null }); }
export function setShowPasswordForm(show: boolean) { setState({ showPasswordForm: show, passwordForm: { current: '', new: '', confirm: '' } }); }
export function updatePasswordField(field: keyof StoreState['passwordForm'], value: string) { const pf = Object.assign({}, state.passwordForm); pf[field] = value; setState({ passwordForm: pf }); }

export function getAuthContext() {
  _initPorts();
  const auth = _getPort('auth');
  const gs = _getPort('globalState');
  if (auth && auth.isAuthenticated && auth.isAuthenticated()) { return { isAuthenticated: true, user: auth.getUser ? auth.getUser() : null }; }
  if (gs && gs.auth) { return { isAuthenticated: true, user: gs.auth }; }
  return { isAuthenticated: false, user: null };
}

export function getHealthData() { return { mounted: state.mounted, loading: state.loading, saving: state.saving, hasError: !!state.error, hasSecurityInfo: !!state.securityInfo, uptime: state.mountedAt ? Date.now() - state.mountedAt : 0 }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { storeReady: true, portsInitialized: Ports.isInitialized() } }; }

export default { getState, setState, subscribe, reset, setSecurityInfo, setLoading, setSaving, setError, setMounted, setShowPasswordForm, updatePasswordField, getAuthContext, getHealthData, info, healthCheck, injectPorts, getPorts };
