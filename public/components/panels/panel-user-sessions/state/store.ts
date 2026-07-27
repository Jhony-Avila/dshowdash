// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.2-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-sessions.state.store
// PURPOSE: Panel User Sessions - State Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   getState() — exported function
//   setState() — exported function
//   subscribe() — exported function
//   reset() — exported function
//   setSessions() — exported function
//   setCurrentSessionId() — exported function
//   setLoginHistory() — exported function
//   setLoading() — exported function
//   setTerminating() — exported function
//   setError() — exported function
//   setMounted() — exported function
//   ... and 5 more exports
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-user-sessions.state.store';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

interface StoreState {
  mounted: boolean;
  loading: boolean;
  terminating: string | null;
  error: string | null;
  sessions: Record<string, unknown>[];
  currentSessionId: string | null;
  loginHistory: Record<string, unknown>[];
  mountedAt: number | null;
}
const initialState: StoreState = { mounted: false, loading: false, terminating: null, error: null, sessions: [], currentSessionId: null, loginHistory: [], mountedAt: null };
let state = Object.assign({}, initialState);
const listeners = new Set();

export function getState() { return Object.assign({}, state); }

// @ts-expect-error strict migration — TS2345
export function setState(partial: Partial<StoreState>) { state = Object.assign({}, state, partial); listeners.forEach((fn: (s: StoreState) => void) => { fn(state); }); }
export function subscribe(fn: (s: StoreState) => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
export function reset() { state = Object.assign({}, initialState); }

export function setSessions(sessions: Record<string, unknown>[]) { setState({ sessions }); }
export function setCurrentSessionId(id: string | null) { setState({ currentSessionId: id }); }
export function setLoginHistory(history: Record<string, unknown>[]) { setState({ loginHistory: history }); }
export function setLoading(loading: boolean) { setState({ loading }); }
export function setTerminating(sessionId: string | null) { setState({ terminating: sessionId }); }
export function setError(error: string | null) { setState({ error }); }
export function setMounted(mounted: boolean) { setState({ mounted, mountedAt: mounted ? Date.now() : null }); }
export function removeSession(sessionId: string) { setState({ sessions: state.sessions.filter(s => s['id'] !== sessionId) }); }

export function getAuthContext() {
  _initPorts();
  const auth = _getPort('auth');
  if (auth && auth.isAuthenticated && auth.isAuthenticated()) { return { isAuthenticated: true, user: auth.getUser ? auth.getUser() : null }; }
  return { isAuthenticated: false, user: null };
}

export function getHealthData() { return { mounted: state.mounted, loading: state.loading, hasError: !!state.error, sessionsCount: state.sessions.length, uptime: state.mountedAt ? Date.now() - state.mountedAt : 0 }; }

export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { storeReady: true, portsInitialized: Ports.isInitialized() } }; }

export default { getState, setState, subscribe, reset, setSessions, setCurrentSessionId, setLoginHistory, setLoading, setTerminating, setError, setMounted, removeSession, getAuthContext, getHealthData, info, healthCheck, injectPorts, getPorts };

// Alias export: consumers import { StateStore } from this module
export const StateStore = { getState, setState, subscribe, reset, setSessions, setCurrentSessionId, setLoginHistory, setLoading, setTerminating, setError, setMounted, removeSession, getAuthContext, getHealthData, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
