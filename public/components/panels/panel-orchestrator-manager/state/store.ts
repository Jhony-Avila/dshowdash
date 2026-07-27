// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.1-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-orchestrator-manager.state.store
// PURPOSE: Panel Orchestrator Manager - State Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   state — exported value
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
export const MODULE_ID = 'panel-orchestrator-manager.state.store';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function _debug() { const cfg = _getPort('config'); return cfg && cfg.app && cfg.app.debug; }

function _log(level: string, ...args: any[]) { const logger = _getPort('logger'); if (!logger) return; if (!_debug() && level === 'debug') return; const fn = logger[level] || logger.info; if (typeof fn === 'function') fn.apply(logger, [`[${MODULE_ID}]`].concat(args)); }

const initialState: {
  triggers: Record<string, unknown>[];
  rules: Record<string, unknown>[];
  flags: Record<string, unknown>[];
  selectedTab: string;
  editingItem: Record<string, unknown> | null;
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  filterComponent: string;
  [key: string]: unknown;
} = { triggers: [], rules: [], flags: [], selectedTab: 'triggers', editingItem: null, isLoading: false, error: null, searchTerm: '', filterComponent: 'all' };
let _state = Object.assign({}, initialState);
let _subscribers: Array<(s: typeof initialState) => void> = [];

function _notify() { _subscribers.forEach(fn => { try { fn(_state); } catch (e: any) { _log('error', 'Subscriber error:', e.message); } }); }

export const state = {
  init() { _initPorts(); _state = Object.assign({}, initialState); _subscribers = []; },
  getState() { return Object.assign({}, _state); },
  setState(partial: Partial<typeof initialState>) { _state = Object.assign({}, _state, partial); _notify(); },
  subscribe(fn: (s: typeof initialState) => void) { _subscribers.push(fn); return () => { _subscribers = _subscribers.filter(s => s !== fn); }; },
  reset() { _state = Object.assign({}, initialState); _notify(); },
  setTriggers(triggers: Record<string, unknown>[]) { this.setState({ triggers, isLoading: false }); },
  setRules(rules: Record<string, unknown>[]) { this.setState({ rules, isLoading: false }); },
  setFlags(flags: Record<string, unknown>[]) { this.setState({ flags, isLoading: false }); },
  setTab(tab: string) { this.setState({ selectedTab: tab }); },
  setEditing(item: Record<string, unknown> | null) { this.setState({ editingItem: item }); },
  clearEditing() { this.setState({ editingItem: null }); },
  setLoading(loading: boolean) { this.setState({ isLoading: loading }); },
  setError(error: string) { this.setState({ error, isLoading: false }); },
  setSearch(term: string) { this.setState({ searchTerm: term }); },
  setFilter(component: string) { this.setState({ filterComponent: component }); },
  healthCheck() { const logger = _getPort('logger'); const checks = { stateReady: true, loggerReady: !!logger, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 3 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/3`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; },
  info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), healthCheck: state.healthCheck() }; }
};

export default state;
