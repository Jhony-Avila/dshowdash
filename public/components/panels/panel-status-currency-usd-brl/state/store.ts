// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-status-currency-usd-brl/state/store
// PURPOSE: Status Currency USD-BRL - State Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
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
export const MODULE_ID = 'panels/panel-status-currency-usd-brl/state/store';
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
export class StateStore {
  [key: string]: any;
  constructor(initialState = {}) { this.state = { ...initialState }; this.subscribers = []; this._metrics = { updateCount: 0, notifyCount: 0, lastUpdateAt: null }; }
  getState() { return { ...this.state }; }
  setState(updates: Record<string, unknown>) { const prev = this.getState(); this.state = { ...this.state, ...updates }; this._metrics.updateCount++; this._metrics.lastUpdateAt = Date.now(); this.subscribers.forEach((s: (state: Record<string, unknown>, prev: Record<string, unknown>) => void) => { try { s(this.state, prev); this._metrics.notifyCount++; } catch (e) { _getPort('logger')?.error(`[${MODULE_ID}] Subscriber error:`, e); } }); }
  subscribe(s: (state: Record<string, unknown>, prev: Record<string, unknown>) => void) { this.subscribers.push(s); return () => { const i = this.subscribers.indexOf(s); if (i > -1) this.subscribers.splice(i, 1); }; }
  reset(initialState = {}) { this.state = { ...initialState }; }
  healthCheck() { const checks = { hasState: !!this.state, subscribersReady: Array.isArray(this.subscribers), portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 3 ? 'healthy' : 'degraded', score: passed, maxScore: 3, checks, version: VERSION, moduleId: MODULE_ID }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, subscriberCount: this.subscribers.length, metrics: this._metrics, portsInitialized: Ports.isInitialized() }; }
  getMetrics() { return { ...this._metrics }; }
}
export const store = new StateStore();
export default StateStore;
