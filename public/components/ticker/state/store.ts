// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: ticker/state/store
// PURPOSE: Ticker State Store (Enterprise)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   getVersion() — exported function
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

import { createUiPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '6.4.0-P17WI';
export const MODULE_ID = 'ticker/state/store';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debug = () => { const cfg = _getPort('config'); return cfg?.app?.debug ?? false; };
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (!logger) return; if (!_debug() && level === 'debug') return; const fn = logger[level] || logger.info; if (typeof fn === 'function') fn(`[${MODULE_ID}]`, ...args); };

const INITIAL_STATE = Object.freeze({ news: [], status: 'loading', lastUpdate: null });
const VALID_STATUSES = ['loading', 'ok', 'offline', 'error'];

export class StateStore {
  [key: string]: any;
  constructor(initialState: Record<string, unknown> = {}) { this._state = this._freeze({ ...INITIAL_STATE, ...initialState }); this.listeners = []; this._metrics = { updateCount: 0, notifyCount: 0, rejectCount: 0, lastUpdateAt: null }; _initPorts(); }
  _freeze(obj: unknown): unknown { if (Array.isArray(obj)) { return Object.freeze(obj.map((item: unknown) => typeof item === 'object' ? this._freeze(item) : item)); } if (obj && typeof obj === 'object') { const o = obj as Record<string, unknown>; Object.keys(o).forEach((key: string) => { if (typeof o[key] === 'object') o[key] = this._freeze(o[key]); }); return Object.freeze(o); } return obj; }
  _validateUpdate(updates: Record<string, unknown>) { if (updates.status && !VALID_STATUSES.includes(updates.status as string)) { _log('warn', `Status inválido rejeitado: ${updates.status}`); this._metrics.rejectCount++; return false; } if (updates.news && !Array.isArray(updates.news)) { _log('warn', 'news deve ser array'); this._metrics.rejectCount++; return false; } return true; }
  getState() { return this._state; }
  setState(updates: Record<string, unknown>) { if (!this._validateUpdate(updates)) return false; const newState = { ...this._state, ...updates }; this._state = this._freeze(newState); this._notify(); this._metrics.updateCount++; this._metrics.lastUpdateAt = Date.now(); _log('debug', 'State updated:', updates); return true; }
  subscribe(listener: (...args: unknown[]) => void) { if (typeof listener !== 'function') { _log('warn', 'Listener deve ser função'); return () => {}; } this.listeners.push(listener); return () => { this.listeners = this.listeners.filter((l: unknown) => l !== listener); }; }
  _notify() { this.listeners.forEach((listener: (...args: unknown[]) => void) => { try { listener(this._state); this._metrics.notifyCount++; } catch (e) { _log('error', 'Erro em listener:', e); } }); }
  reset() { this._state = this._freeze({ ...INITIAL_STATE }); this.listeners = []; _log('debug', 'State reset'); }
  select(selector: (state: unknown) => unknown) { try { return selector(this._state); } catch (e) { _log('error', 'Erro em selector:', e); return null; } }
  healthCheck() { const logger = _getPort('logger'); const checks = { hasState: !!this._state, isFrozen: Object.isFrozen(this._state), validStatus: VALID_STATUSES.includes(this._state.status), subscribersReady: Array.isArray(this.listeners), loggerReady: !!logger, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: new Date().toISOString() }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, newsCount: this._state.news.length, status: this._state.status, subscriberCount: this.listeners.length, isFrozen: Object.isFrozen(this._state), metrics: this._metrics, portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck() }; }
  getMetrics() { return { ...this._metrics }; }
  resetMetrics() { this._metrics = { updateCount: 0, notifyCount: 0, rejectCount: 0, lastUpdateAt: null }; }
}

export function getVersion() { return VERSION; }
export default StateStore;
