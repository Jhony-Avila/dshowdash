// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header-panel-chatgpt-state-store
// PURPOSE: State Store - Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

export const MODULE_ID = 'header-panel-chatgpt-state-store';
import { VERSION } from '/core/version.js'; export { VERSION };

let _metrics = { gets: 0, sets: 0, subscriptions: 0 };

export class StateStore { [key: string]: any;
  constructor(initial: Record<string, unknown> = {}) { this._state = { ...initial }; this._listeners = new Set(); }
  getState() { _metrics.gets++; return { ...this._state }; }
  // @ts-expect-error TS migration - TS2698
  setState(partial: unknown) { _metrics.sets++; this._state = { ...this._state, ...partial }; this._notify(); }
  subscribe(fn: Function) { _metrics.subscriptions++; this._listeners.add(fn); return () => this._listeners.delete(fn); }
  _notify() { this._listeners.forEach((fn: Function) => fn(this._state)); }
  getMetrics() { return { ..._metrics, listeners: this._listeners.size }; }
  info() { return { moduleId: MODULE_ID, version: VERSION, metrics: this.getMetrics() }; }
  healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { storeReady: true }, metrics: this.getMetrics() }; }
}

export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: ((null as any)?._initialized !== false) ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, checks: { storeReady: true } }; }
